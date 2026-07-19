"use client";

import { useState, useTransition } from "react";
import { runFeishuSyncManual } from "@/app/feishu/actions";

export function FeishuSyncSettings() {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSync(full = false) {
    startTransition(async () => {
      try {
        let sectionOffset = 0;
        let totalExpressions = 0;
        let totalVideos = 0;
        let docsProcessed = 0;
        let totalSections = 0;

        for (;;) {
          const result = await runFeishuSyncManual(full ? "full" : "incremental", {
            sectionOffset,
          });

          if (!result.ok) {
            setMessage(result.error);
            return;
          }

          totalExpressions += result.result.expressionsUpserted;
          totalVideos += result.result.videoSectionsProcessed;
          docsProcessed = result.result.docsProcessed;
          totalSections = result.result.totalSections;

          if (result.result.complete) {
            setMessage(
              `Synced ${totalExpressions} expressions from ${totalVideos} videos across ${docsProcessed} docs` +
                (totalSections > 0 ? ` (${totalSections}/${totalSections} videos)` : "") +
                "."
            );
            return;
          }

          setMessage(result.summary);
          sectionOffset = result.result.nextSectionOffset;
        }
      } catch (error) {
        const text =
          error instanceof Error ? error.message : "Feishu sync failed.";
        setMessage(
          text.includes("fetch") || text.includes("Failed to fetch")
            ? "Sync timed out or the connection dropped. Tap Sync all again to continue from where it left off."
            : text
        );
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
          Sync now
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => handleSync(true)}
          className="min-w-0 flex-1 rounded-[1rem] border-[2.5px] border-[#D4D4D4] px-4 py-2.5 text-center text-[0.8125rem] font-medium text-[#222222] transition-opacity duration-150 hover:opacity-80 disabled:opacity-50"
        >
          {pending ? "Syncing…" : "Sync all"}
        </button>
      </div>
      {message ? (
        <p className="text-center text-[0.75rem] text-[#222222]/80">{message}</p>
      ) : null}
    </div>
  );
}
