import { notebookRowBorderClassName } from "@/lib/import-notebook-layout";

/** Single ruled line under an input row (notebook paper). */
export function ImportPaperLine({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-0 w-full shrink-0 ${notebookRowBorderClassName} ${className}`}
      aria-hidden="true"
    />
  );
}
