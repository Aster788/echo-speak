"use client";

import { useState, useTransition } from "react";
import { GapCard, type GapCardItem } from "@/components/GapCard";
import { pageHintFont } from "@/lib/page-hint-font";
import { compareNames, compareVideoTitles } from "@/lib/sort-collections";

type GapsManagerProps = {
  initialGaps: GapCardItem[];
};

type GapVideoGroup = {
  videoId: string;
  label: string;
  gaps: GapCardItem[];
};

function videoGroupLabel(gap: GapCardItem): string {
  const title = gap.video_title?.trim() || "Untitled video";
  const creator = gap.video_creator?.trim();
  return creator ? `${creator} · ${title}` : title;
}

function groupGapsByVideo(gaps: GapCardItem[]): GapVideoGroup[] {
  const groups = new Map<string, GapVideoGroup>();
  for (const gap of gaps) {
    const existing = groups.get(gap.video_id);
    if (existing) {
      existing.gaps.push(gap);
      continue;
    }
    groups.set(gap.video_id, {
      videoId: gap.video_id,
      label: videoGroupLabel(gap),
      gaps: [gap],
    });
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      gaps: [...group.gaps].sort((a, b) => {
        const phraseCmp = compareNames(a.phrase, b.phrase);
        if (phraseCmp !== 0) return phraseCmp;
        return a.id.localeCompare(b.id);
      }),
    }))
    .sort((a, b) => {
      const titleCmp = compareVideoTitles(a.label, b.label);
      if (titleCmp !== 0) return titleCmp;
      return a.videoId.localeCompare(b.videoId);
    });
}

export function GapsManager({ initialGaps }: GapsManagerProps) {
  const [gaps, setGaps] = useState(initialGaps);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshing, startRefresh] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const groups = groupGapsByVideo(gaps);

  async function act(gapId: string, action: "accept" | "ignore") {
    setBusyId(gapId);
    setError(null);
    try {
      const response = await fetch(`/api/gaps/${gapId}/${action}`, {
        method: "POST",
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? `Failed to ${action} gap.`);
      }
      setGaps((prev) => prev.filter((gap) => gap.id !== gapId));
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} gap.`);
    } finally {
      setBusyId(null);
    }
  }

  function refreshAll() {
    startRefresh(async () => {
      setError(null);
      try {
        const refreshResponse = await fetch("/api/gaps/refresh", {
          method: "POST",
        });
        const refreshPayload = (await refreshResponse.json()) as {
          ok?: boolean;
          message?: string;
        };
        if (!refreshResponse.ok || !refreshPayload.ok) {
          throw new Error(refreshPayload.message ?? "Failed to refresh gaps.");
        }

        const listResponse = await fetch("/api/gaps");
        const listPayload = (await listResponse.json()) as {
          ok?: boolean;
          message?: string;
          gaps?: GapCardItem[];
        };
        if (!listResponse.ok || !listPayload.ok) {
          throw new Error(listPayload.message ?? "Failed to reload gaps.");
        }
        setGaps(listPayload.gaps ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to refresh gaps.");
      }
    });
  }

  return (
    <div className="mt-4 space-y-3">
      <p
        className={`${pageHintFont.className} text-[0.75rem] leading-snug text-[#222222]/65`}
      >
        Accept keeps the phrase (locked for re-extract). Ignore removes it from
        Collections and blocks it on future extracts.
      </p>

      <div className="flex items-center justify-between gap-2">
        <p
          className={`${pageHintFont.className} text-[0.8125rem] text-[#222222]/70`}
        >
          {gaps.length === 0
            ? "No pending gaps"
            : `${gaps.length} pending gap${gaps.length === 1 ? "" : "s"}`}
        </p>
        <button
          type="button"
          onClick={refreshAll}
          disabled={refreshing}
          className={`${pageHintFont.className} shrink-0 rounded-[0.625rem] border border-[#222222]/25 bg-[#222222]/5 px-3 py-1 text-[0.8125rem] text-[#222222] transition-opacity duration-150 active:opacity-80 disabled:opacity-50`}
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error ? (
        <p className="text-center text-[0.8125rem] text-red-700">{error}</p>
      ) : null}

      {gaps.length === 0 ? (
        <p className="mt-8 text-center text-[0.8125rem] font-normal text-[#222222] opacity-70">
          No gaps detected.
        </p>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.videoId} className="space-y-3">
              <h2
                className={`${pageHintFont.className} px-0.5 text-[0.8125rem] italic leading-snug text-[#222222]/70`}
              >
                {group.label}
              </h2>
              <ul className="space-y-3">
                {group.gaps.map((gap) => (
                  <li key={gap.id}>
                    <GapCard
                      gap={gap}
                      busy={busyId === gap.id || refreshing}
                      onAccept={() => void act(gap.id, "accept")}
                      onIgnore={() => void act(gap.id, "ignore")}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
