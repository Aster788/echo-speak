"use client";

import { pageHintFont } from "@/lib/page-hint-font";

export type GapCardItem = {
  id: string;
  phrase: string;
  meaning: string;
  video_id: string;
  video_title: string | null;
  video_creator: string | null;
  reason: string;
};

type GapCardProps = {
  gap: GapCardItem;
  busy?: boolean;
  onAccept: () => void;
  onIgnore: () => void;
};

export function GapCard({ gap, busy = false, onAccept, onIgnore }: GapCardProps) {
  return (
    <article className="border-[7px] border-dashed border-[#050505] bg-[#FFFFFF] px-4 py-3 text-[#222222]">
      <div className="space-y-1.5">
        <h3 className="text-[0.9375rem] font-medium leading-snug">{gap.phrase}</h3>
        {gap.meaning ? (
          <p className="text-[0.8125rem] leading-snug">{gap.meaning}</p>
        ) : null}
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onAccept}
          className={`${pageHintFont.className} flex-1 rounded-[0.625rem] border border-[#222222]/25 bg-[#222222]/5 px-3 py-1.5 text-[0.8125rem] text-[#222222] transition-opacity duration-150 active:opacity-80 disabled:opacity-50`}
        >
          Accept
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onIgnore}
          className={`${pageHintFont.className} flex-1 rounded-[0.625rem] border border-[#222222]/15 bg-transparent px-3 py-1.5 text-[0.8125rem] text-[#222222]/80 transition-opacity duration-150 active:opacity-80 disabled:opacity-50`}
        >
          Ignore
        </button>
      </div>
    </article>
  );
}
