import { isPrimarilyChineseLine } from "@/lib/english-lines";

/** Legacy raw-text alignment helpers (not used by production `resolveExampleZh`). */

export type BilingualBlock = {
  lang: "en" | "zh";
  text: string;
};

export type EnZhPair = {
  en: string;
  zh: string;
};

const MIN_RECALL = 0.55;
const MIN_PRECISION = 0.5;
const MIN_F1 = 0.65;
const EMBEDDED_COVERAGE = 0.45;
const MAX_PAIR_WINDOW = 6;

const INCOMPLETE_ZH_ENDING =
  /(?:时|的|在|向|并|为|是|我|你|和|与|把|让|给|会|要|还|就|也|都|而|但|因|所|以|对|跟|有|没|不|很|更|最|就|才|只|被|将|着|过|吗|呢|吧|啊|呀|哦|嗯|即将)$/;

export function parseBilingualBlocks(rawText: string): BilingualBlock[] {
  const blocks: BilingualBlock[] = [];
  let current: BilingualBlock | null = null;

  for (const line of rawText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const lang = isPrimarilyChineseLine(trimmed) ? "zh" : "en";
    if (!current || current.lang !== lang) {
      current = { lang, text: trimmed };
      blocks.push(current);
    } else {
      current.text = `${current.text}\n${trimmed}`;
    }
  }

  return blocks;
}

export function parseEnZhPairs(rawText: string): EnZhPair[] {
  const blocks = parseBilingualBlocks(rawText);
  const pairs: EnZhPair[] = [];

  for (let i = 0; i < blocks.length; i += 1) {
    if (blocks[i].lang !== "en") continue;

    for (let j = i + 1; j < blocks.length; j += 1) {
      if (blocks[j].lang === "zh") {
        pairs.push({ en: blocks[i].text, zh: blocks[j].text });
        break;
      }
      if (blocks[j].lang === "en") break;
    }
  }

  return pairs;
}

export function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u2018\u2019`']/g, "'")
    .replace(/\[(?:music|laughter|applause)\]/gi, " ")
    .replace(/^>>+\s*/gm, " ")
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function enTokens(text: string): string[] {
  return normalizeForMatch(text).split(" ").filter((token) => token.length >= 2);
}

function tokenRecall(example: string[], candidate: string[]): number {
  if (example.length === 0) return 0;
  const cand = new Set(candidate);
  let hits = 0;
  for (const token of example) {
    if (cand.has(token)) hits += 1;
  }
  return hits / example.length;
}

function tokenPrecision(example: string[], candidate: string[]): number {
  if (candidate.length === 0) return 0;
  const ex = new Set(example);
  let hits = 0;
  for (const token of candidate) {
    if (ex.has(token)) hits += 1;
  }
  return hits / candidate.length;
}

function tokenF1(example: string[], candidate: string[]): number {
  const recall = tokenRecall(example, candidate);
  const precision = tokenPrecision(example, candidate);
  if (recall + precision === 0) return 0;
  return (2 * recall * precision) / (recall + precision);
}

function countCjk(text: string): number {
  return (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) ?? []).length;
}

function isEmbeddedExample(exampleEn: string, candidateEn: string): boolean {
  const example = normalizeForMatch(exampleEn);
  const candidate = normalizeForMatch(candidateEn);
  if (!example || !candidate) return false;
  if (!candidate.includes(example) && !example.includes(candidate)) return false;

  const shorter = example.length <= candidate.length ? example : candidate;
  const longer = example.length > candidate.length ? example : candidate;
  return shorter.length / longer.length >= EMBEDDED_COVERAGE;
}

export function isPlausibleAlignment(
  exampleEn: string,
  exampleZh: string
): boolean {
  const zh = exampleZh.replace(/\s+/g, "").trim();
  if (!zh) return false;

  const cjk = countCjk(zh);
  if (cjk < 2) return false;

  const latin = (zh.match(/[a-zA-Z]/g) ?? []).length;
  if (latin > cjk) return false;

  if (normalizeForMatch(zh) === normalizeForMatch(exampleEn)) return false;

  const enWordCount = enTokens(exampleEn).length;
  const endsWithSentence = /[。！？…」』"']$/.test(zh);
  const minCjk =
    enWordCount <= 4
      ? 2
      : Math.min(8, Math.max(4, Math.floor(enWordCount * 0.35)));

  if (endsWithSentence && cjk >= 2 && enWordCount <= 10) {
    // Short complete sentences (e.g. 下次见。) are valid review fronts.
  } else if (cjk < minCjk) {
    return false;
  }

  if (enWordCount >= 6 && !endsWithSentence) return false;

  if (!endsWithSentence) {
    if (INCOMPLETE_ZH_ENDING.test(zh)) return false;
    if (enWordCount >= 8 && cjk < minCjk * 1.5) return false;
  }

  if (/^[\s。，、！？]/.test(exampleZh.trim())) return false;

  const maxCjk = Math.max(80, enWordCount * 10);
  if (cjk > maxCjk) return false;

  return true;
}

type AlignmentCandidate = {
  zh: string;
  score: number;
  recall: number;
  precision: number;
};

function scorePair(
  exampleTokens: string[],
  exampleEn: string,
  en: string,
  zh: string
): AlignmentCandidate | null {
  const candidateTokens = enTokens(en);
  const recall = tokenRecall(exampleTokens, candidateTokens);
  const precision = tokenPrecision(exampleTokens, candidateTokens);
  const embedded = isEmbeddedExample(exampleEn, en);

  if (!embedded && recall < MIN_RECALL) return null;
  if (!embedded && precision < MIN_PRECISION) return null;

  const score = embedded
    ? recall * precision + precision
    : tokenF1(exampleTokens, candidateTokens);
  if (!embedded && score < MIN_F1) return null;

  return { zh, score, recall, precision };
}

function pickBestCandidate(
  current: AlignmentCandidate | null,
  next: AlignmentCandidate,
  windowSize: number,
  currentWindowSize: number
): AlignmentCandidate {
  if (!current) return next;
  if (next.score > current.score + 0.02) return next;
  if (
    Math.abs(next.score - current.score) <= 0.02 &&
    windowSize < currentWindowSize
  ) {
    return next;
  }
  return current;
}

export function findAlignedZhFromPairs(
  pairs: EnZhPair[],
  exampleEn: string
): string | null {
  const example = exampleEn.trim();
  if (!example || pairs.length === 0) return null;

  const exampleTokens = enTokens(example);
  if (exampleTokens.length === 0) return null;

  let best: AlignmentCandidate | null = null;
  let bestWindow = Number.POSITIVE_INFINITY;

  for (let i = 0; i < pairs.length; i += 1) {
    const single = scorePair(exampleTokens, example, pairs[i].en, pairs[i].zh);
    if (single) {
      best = pickBestCandidate(best, single, 1, bestWindow);
      if (best === single) bestWindow = 1;
    }

    for (let j = i; j < Math.min(i + MAX_PAIR_WINDOW, pairs.length); j += 1) {
      if (j > i) {
        const mergedEn = pairs
          .slice(i, j + 1)
          .map((pair) => pair.en)
          .join(" ");
        const mergedZh = pairs
          .slice(i, j + 1)
          .map((pair) => pair.zh)
          .join("");
        const merged = scorePair(
          exampleTokens,
          example,
          mergedEn,
          mergedZh
        );
        if (merged) {
          const windowSize = j - i + 1;
          const picked = pickBestCandidate(best, merged, windowSize, bestWindow);
          if (picked === merged) bestWindow = windowSize;
          best = picked;
        }
      }
    }
  }

  if (!best) return null;
  return best.zh.trim();
}

function normalizeZhOutput(zh: string): string {
  return zh.replace(/\s+/g, "").trim();
}

export function alignExampleZhFromRawText(
  rawText: string,
  exampleEn: string
): string | null {
  const aligned = findAlignedZhFromPairs(parseEnZhPairs(rawText), exampleEn);
  if (!aligned) return null;
  const normalized = normalizeZhOutput(aligned);
  if (!isPlausibleAlignment(exampleEn, normalized)) return null;
  return normalized;
}
