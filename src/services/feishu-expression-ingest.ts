import {
  createExpressions,
  listExpressionsByVideo,
} from "@/db/expressions";
import { listDismissedPhraseKeysForVideo } from "@/db/expression-dismissals";
import { buildTopicIndex, listTopics } from "@/db/topics";
import { resolveVideoForFeishuSection } from "@/db/videos";
import { expandExampleFromNote } from "@/lib/feishu-example-expand";
import { resolveFeishuSectionTopicId } from "@/lib/feishu-section-topic-map";
import { getLlmClient, getLlmModel, loadPrompt } from "@/lib/llm";
import { canonicalKey } from "@/lib/phrase-canonical";
import type { FeishuDocVideoSection, FeishuBlock } from "@/lib/feishu-doc-parser";
import { parseVocabTableRows } from "@/lib/feishu-table-parser";
import { filterSubsumedTableVocab } from "@/lib/feishu-vocab-filter";
import { resolveExampleZh } from "@/services/example-zh";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Expression } from "@/types/expression";
import { getSupabase } from "@/lib/supabase";

export type FeishuExtractedSentence = {
  phrase: string;
  meaning: string;
  example_en: string;
  feishu_section: string | null;
  phonetic?: string | null;
};

function noteCandidateLines(blocks: FeishuBlock[]): string[] {
  return blocks
    .filter(
      (block): block is Extract<FeishuBlock, { type: "bullet" } | { type: "phrase" }> =>
        block.type === "bullet" || block.type === "phrase"
    )
    .map((block) => block.text);
}

export type FeishuSectionIngestResult = {
  videoId: string;
  expressionsUpserted: number;
  tablesParsed: number;
  sentencesExtracted: number;
  skippedTranscriptDuplicates: number;
  skippedDismissed: number;
  skippedSubsumedVocab: number;
};

const MAX_SENTENCES_PER_BATCH = 40;

async function extractSentencesFromBlocks(
  blocks: FeishuBlock[],
  videoTitle: string
): Promise<FeishuExtractedSentence[]> {
  const sentenceBlocks = blocks.filter(
    (block): block is Extract<FeishuBlock, { type: "bullet" } | { type: "phrase" }> =>
      block.type === "bullet" || block.type === "phrase"
  );
  if (sentenceBlocks.length === 0) return [];

  const systemPrompt = await loadPrompt("feishu-extract-sentences");
  const prompt = systemPrompt.replace(
    "{{MAX_EXPRESSIONS}}",
    String(MAX_SENTENCES_PER_BATCH)
  );

  const payload = sentenceBlocks.map((block) => ({
    text: block.text,
    section: block.section,
  }));

  const openai = getLlmClient();
  let content: string;
  try {
    const response = await openai.chat.completions.create({
      model: getLlmModel(),
      messages: [
        { role: "system", content: prompt },
        {
          role: "user",
          content: JSON.stringify({ videoTitle, items: payload }),
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });
    content = response.choices[0]?.message?.content?.trim() || "{}";
  } catch {
    // Provider empty/truncated JSON body — skip sentence LLM; tables still ingest.
    return [];
  }

  let parsed: {
    expressions?: Array<{
      phrase?: string;
      meaning?: string;
      example_en?: string;
    }>;
  };
  try {
    parsed = JSON.parse(content) as typeof parsed;
  } catch {
    return [];
  }

  return (parsed.expressions ?? [])
    .filter((item) => item.phrase?.trim() && item.meaning?.trim())
    .map((item, index) => ({
      phrase: item.phrase!.trim(),
      meaning: item.meaning!.trim(),
      example_en: item.example_en?.trim() || item.phrase!.trim(),
      feishu_section: sentenceBlocks[index]?.section ?? sentenceBlocks[0]?.section ?? null,
    }));
}

async function upsertFeishuExpression(
  videoId: string,
  input: {
    phrase: string;
    meaning: string;
    example_en: string;
    example_zh?: string | null;
    feishu_section: string | null;
    phonetic?: string | null;
  },
  existingByKey: Map<string, Expression>,
  resolveTopicId: (section: string | null) => string | null,
  supabase: SupabaseClient
): Promise<"inserted" | "updated" | "skipped"> {
  const key = canonicalKey(input.phrase);
  const existing = existingByKey.get(key);

  if (existing?.source_type === "transcript") {
    return "skipped";
  }

  const exampleZh =
    input.example_zh ?? (await resolveExampleZh(input.example_en));
  const topicId = resolveTopicId(input.feishu_section);
  const phonetic = input.phonetic ?? null;

  if (existing?.source_type === "feishu") {
    const updatePayload: Record<string, unknown> = {
      phrase: input.phrase,
      meaning: input.meaning,
      example_en: input.example_en,
      example_zh: exampleZh,
      examples: [{ en: input.example_en, zh: exampleZh }],
      feishu_section: input.feishu_section,
      phonetic,
      weight: Math.min(existing.weight + 0.5, 3.0),
    };
    if (!existing.topic_locked) {
      updatePayload.topic_id = topicId;
    }

    const { error } = await supabase
      .from("expressions")
      .update(updatePayload)
      .eq("id", existing.id);
    if (error) throw error;
    return "updated";
  }

  const [created] = await createExpressions(
    [
      {
        video_id: videoId,
        phrase: input.phrase,
        meaning: input.meaning,
        example_en: input.example_en,
        example_zh: exampleZh,
        topic_id: topicId,
        source_type: "feishu",
        weight: 1.0,
        feishu_section: input.feishu_section,
        phonetic,
      },
    ],
    supabase
  );
  existingByKey.set(key, created);
  return "inserted";
}

export async function ingestFeishuVideoSection(
  section: FeishuDocVideoSection,
  options: {
    supabase?: SupabaseClient;
    extractSentences?: typeof extractSentencesFromBlocks;
  } = {}
): Promise<FeishuSectionIngestResult> {
  const supabase = options.supabase ?? getSupabase();
  const extractFn = options.extractSentences ?? extractSentencesFromBlocks;

  const topics = await listTopics(supabase);
  const topicIndex = buildTopicIndex(topics);
  const resolveTopicId = (section: string | null) =>
    resolveFeishuSectionTopicId(section, topicIndex, topics);

  const video = await resolveVideoForFeishuSection(
    {
      videoTitle: section.videoTitle,
      youtubeUrl: section.youtubeUrl,
      creatorName: section.creatorName,
    },
    supabase
  );

  const dismissed = await listDismissedPhraseKeysForVideo(video.id, supabase);
  const existingExpressions = await listExpressionsByVideo(video.id, supabase);
  const existingByKey = new Map<string, Expression>();
  for (const expr of existingExpressions) {
    existingByKey.set(canonicalKey(expr.phrase), expr);
  }

  let expressionsUpserted = 0;
  let skippedTranscriptDuplicates = 0;
  let skippedDismissed = 0;

  const candidateLines = noteCandidateLines(section.blocks);
  const sentences = await extractFn(section.blocks, section.videoTitle);
  const ingestedTexts: Array<{ phrase: string; example_en: string }> = [];

  for (const sentence of sentences) {
    const key = canonicalKey(sentence.phrase);
    if (dismissed.has(key)) {
      skippedDismissed += 1;
      continue;
    }
    const example_en = expandExampleFromNote(
      sentence.example_en,
      candidateLines,
      { phrase: sentence.phrase }
    );
    const result = await upsertFeishuExpression(
      video.id,
      { ...sentence, example_en },
      existingByKey,
      resolveTopicId,
      supabase
    );
    if (result === "skipped") {
      skippedTranscriptDuplicates += 1;
      continue;
    }
    expressionsUpserted += 1;
    ingestedTexts.push({
      phrase: sentence.phrase,
      example_en,
    });
  }

  const tableRows = section.blocks
    .filter((block): block is Extract<FeishuBlock, { type: "table" }> => block.type === "table")
    .flatMap((block) => block.rows);

  const tableItems = parseVocabTableRows(tableRows);
  const filteredTable = filterSubsumedTableVocab(tableItems, ingestedTexts);
  const skippedSubsumedVocab = tableItems.length - filteredTable.length;

  const lastSection = [...section.blocks]
    .reverse()
    .find((block): block is Extract<FeishuBlock, { type: "section" }> => block.type === "section");

  for (const item of filteredTable) {
    const key = canonicalKey(item.phrase);
    if (dismissed.has(key)) {
      skippedDismissed += 1;
      continue;
    }
    // Table cells start with lemma as example_en — that is not a short example
    // sentence, so do not expand lemma → any containing note line.
    const result = await upsertFeishuExpression(
      video.id,
      {
        phrase: item.phrase,
        meaning: item.meaning,
        example_en: item.example_en,
        example_zh: item.meaning,
        feishu_section: lastSection?.label ?? null,
        phonetic: item.phonetic,
      },
      existingByKey,
      resolveTopicId,
      supabase
    );
    if (result === "skipped") {
      skippedTranscriptDuplicates += 1;
      continue;
    }
    expressionsUpserted += 1;
  }

  return {
    videoId: video.id,
    expressionsUpserted,
    tablesParsed: tableItems.length,
    sentencesExtracted: sentences.length,
    skippedTranscriptDuplicates,
    skippedDismissed,
    skippedSubsumedVocab,
  };
}
