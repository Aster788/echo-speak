import { NextResponse } from "next/server";
import { parseTranscriptFile } from "@/lib/transcript-parse";
import { titleFromTranscriptFilename } from "@/lib/transcript-filename";
import { importTranscript } from "@/services/transcript-importer";
import { isDuplicateImportError } from "@/services/import-duplicate-error";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    let title = String(formData.get("title") ?? "");
    const youtube_url = String(formData.get("youtube_url") ?? "") || null;
    const paste = String(formData.get("paste") ?? "").trim();
    const file = formData.get("file");

    let rawText = paste;

    if (file instanceof File && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      rawText = parseTranscriptFile(buffer, file.name);

      if (!title.trim()) {
        title = titleFromTranscriptFilename(file.name);
      }
    }

    if (!rawText.trim()) {
      return NextResponse.json(
        {
          ok: false,
          message: "Provide transcript text or upload a .txt / .srt file.",
        },
        { status: 400 }
      );
    }

    const result = await importTranscript({
      title,
      rawText,
      youtube_url,
    });

    return NextResponse.json({
      ok: true,
      message: "Transcript saved successfully.",
      videoId: result.video.id,
      transcriptId: result.transcript.id,
    });
  } catch (error) {
    if (isDuplicateImportError(error)) {
      return NextResponse.json(
        {
          ok: false,
          duplicate: true,
          reason: error.reason,
          message: error.message,
          videoId: error.videoId,
          transcriptId: error.transcriptId ?? undefined,
          videoTitle: error.videoTitle ?? undefined,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Import failed. Try again.",
      },
      { status: 500 }
    );
  }
}
