"use client";

import {
  DISMISS_REASONS,
  DISMISS_REASON_LABELS,
  type DismissReason,
} from "@/types/dismiss-reason";

type DismissReasonDialogProps = {
  open: boolean;
  phrase: string;
  onCancel: () => void;
  onConfirm: (reason: DismissReason) => void;
};

export function DismissReasonDialog({
  open,
  phrase,
  onCancel,
  onConfirm,
}: DismissReasonDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#222222]/15 px-5"
      role="dialog"
      aria-modal="true"
      aria-label="Dismiss expression"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[360px] rounded-lg border border-[#222222]/15 bg-[#FFFFFF] p-5 text-[#222222] shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-center text-[0.9375rem] font-medium">
          为什么不值得学？
        </p>
        <p className="mt-2 text-center text-sm opacity-70">&ldquo;{phrase}&rdquo;</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-[0.8125rem]">
          {DISMISS_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => onConfirm(reason)}
              className="rounded-full border border-[#222222]/20 px-3 py-1 transition-opacity duration-150 active:opacity-70"
            >
              {DISMISS_REASON_LABELS[reason]}
            </button>
          ))}
        </div>
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-[#222222]/20 px-5 py-2 text-[0.875rem] transition-opacity duration-150 active:opacity-70"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
