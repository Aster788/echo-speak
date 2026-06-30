"use client";

import {
  DISMISS_REASONS,
  DISMISS_REASON_LABELS,
  type DismissReason,
} from "@/types/dismiss-reason";

type DismissReasonSheetProps = {
  open: boolean;
  phrase?: string;
  selectedReason: DismissReason | null;
  onSelectReason: (reason: DismissReason) => void;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
};

export function DismissReasonSheet({
  open,
  phrase,
  selectedReason,
  onSelectReason,
  onCancel,
  onConfirm,
  busy = false,
}: DismissReasonSheetProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#222222]/30 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Delete reason"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[420px] rounded-t-2xl bg-[#FBF8F1] p-5 pb-7 shadow-xl sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-1 text-center text-[1rem] font-medium text-[#222222]">
          Delete expression
        </div>
        {phrase ? (
          <div className="mb-3 text-center text-sm text-[#222222]/70">
            “{phrase.length > 40 ? phrase.slice(0, 40) + "…" : phrase}”
          </div>
        ) : null}
        <p className="mb-2 text-center text-xs text-[#222222]/60">
          Why are you deleting it? This helps future extractions skip it.
        </p>
        <div className="flex flex-wrap justify-center gap-2 px-2 py-3">
          {DISMISS_REASONS.map((reason) => {
            const active = selectedReason === reason;
            return (
              <button
                key={reason}
                type="button"
                onClick={() => onSelectReason(reason)}
                disabled={busy}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                  active
                    ? "border-[#222222] bg-[#222222] text-[#FBF8F1]"
                    : "border-[#222222]/20 bg-transparent text-[#222222] active:opacity-70"
                }`}
              >
                {DISMISS_REASON_LABELS[reason]}
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-6 pt-2 text-[0.875rem]">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-full border border-[#222222]/20 px-5 py-2 transition-opacity duration-150 active:opacity-70 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy || !selectedReason}
            className="rounded-full border border-[#222222]/20 px-5 py-2 transition-opacity duration-150 active:opacity-70 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
