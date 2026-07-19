"use client";

import { useEffect, useState, useTransition } from "react";
import { runFeishuSyncManual } from "@/app/feishu/actions";

const RESUME_KEY = "echo-speak:feishu-sync-resume-offset";

function formatSyncError(error: unknown): string {
  const text =
    error instanceof Error ? error.message : String(error ?? "Feishu sync failed.");
  if (
    /Unexpected end of JSON input/i.test(text) ||
    /empty response body/i.test(text) ||
    /invalid JSON/i.test(text) ||
    /Failed to fetch/i.test(text)
  ) {
    return "Sync hit an empty API response (Feishu or LLM). Tap Sync all again — it will continue from the last offset.";
  }
  return text;
}

function readResumeOffset(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.sessionStorage.getItem(RESUME_KEY);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function writeResumeOffset(offset: number) {
  if (typeof window === "undefined") return;
  if (offset > 0) {
    window.sessionStorage.setItem(RESUME_KEY, String(offset));
  } else {
    window.sessionStorage.removeItem(RESUME_KEY);
  }
}

export function FeishuSyncSettings() {
  const [message, setMessage] = useState("");
  const [resumeOffset, setResumeOffset] = useState(0);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setResumeOffset(readResumeOffset());
  }, []);

  function updateResume(offset: number) {
    setResumeOffset(offset);
    writeResumeOffset(offset);
  }

  function handleSync(full = false) {
    startTransition(async () => {
      try {
        let sectionOffset = full ? readResumeOffset() : 0;
        let totalExpressions = 0;
        let totalVideos = 0;
        let docsProcessed = 0;
        let totalSections = 0;

        for (;;) {
          const result = await runFeishuSyncManual(full ? "full" : "incremental", {
            sectionOffset,
          });

          if (!result.ok) {
            updateResume(sectionOffset);
            setMessage(formatSyncError(new Error(result.error)));
            return;
          }

          totalExpressions += result.result.expressionsUpserted;
          totalVideos += result.result.videoSectionsProcessed;
          docsProcessed = result.result.docsProcessed;
          totalSections = result.result.totalSections;

          if (result.result.complete) {
            updateResume(0);
            setMessage(
              `Synced ${totalExpressions} expressions from ${totalVideos} videos across ${docsProcessed} docs` +
                (totalSections > 0 ? ` (${totalSections}/${totalSections} videos)` : "") +
                "."
            );
            return;
          }

          setMessage(result.summary);
          sectionOffset = result.result.nextSectionOffset;
          updateResume(sectionOffset);
        }
      } catch (error) {
        setMessage(formatSyncError(error));
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[0.75rem] leading-snug text-[#222222]/80">
        Sync notes from Feishu into your expression library. Home also syncs
        automatically when stale. Large docs sync in small batches.
      </p>
      <div className="flex w-full gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => handleSync(false)}
          className="min-w-0 flex-1 rounded-[1rem] border-[2.5px] border-[#D4D4D4] px-4 py-2.5 text-center text-[0.8125rem] font-medium text-[#222222] transition-opacity duration-150 hover:opacity-80 disabled:opacity-50"
        >
          Sync New
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => handleSync(true)}
          className="min-w-0 flex-1 rounded-[1rem] border-[2.5px] border-[#D4D4D4] px-4 py-2.5 text-center text-[0.8125rem] font-medium text-[#222222] transition-opacity duration-150 hover:opacity-80 disabled:opacity-50"
        >
          {pending
            ? "Syncing…"
            : resumeOffset > 0
              ? `Sync all (resume ${resumeOffset})`
              : "Sync all"}
        </button>
      </div>
      {message ? (
        <p className="text-center text-[0.75rem] text-[#222222]/80">{message}</p>
      ) : null}
    </div>
  );
}
