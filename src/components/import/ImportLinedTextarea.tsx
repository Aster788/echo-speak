import { pageHintFont } from "@/lib/page-hint-font";
import type { TextareaHTMLAttributes } from "react";
import {
  NOTEBOOK_ROW_HEIGHT,
  NOTEBOOK_TEXTAREA_RULED_LINES,
  notebookLabelClassName,
  notebookRowBorderClassName,
  notebookTextareaClassName,
} from "@/lib/import-notebook-layout";

type ImportLinedTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
};

export function ImportLinedTextarea({
  label = "Or paste transcript",
  id,
  className = "",
  ...textareaProps
}: ImportLinedTextareaProps) {
  const ruledLines = NOTEBOOK_TEXTAREA_RULED_LINES;
  const totalRows = 1 + ruledLines;
  const totalHeight = NOTEBOOK_ROW_HEIGHT * totalRows;

  return (
    <div className={`shrink-0 ${className}`}>
      <label
        htmlFor={id}
        className={`${pageHintFont.className} ${notebookLabelClassName} mb-0.5 block`}
      >
        {label}
      </label>
      <div className="relative w-full" style={{ height: totalHeight }}>
        <textarea
          id={id}
          rows={totalRows}
          className={`absolute inset-0 z-0 h-full w-full ${notebookTextareaClassName}`}
          style={{
            lineHeight: `${NOTEBOOK_ROW_HEIGHT}px`,
            backgroundColor: "transparent",
          }}
          placeholder="Paste video transcript here"
          {...textareaProps}
        />
        <div
          className="pointer-events-none absolute inset-0 z-10 flex flex-col"
          aria-hidden="true"
        >
          {Array.from({ length: totalRows }, (_, index) => (
            <div
              key={index}
              className={`shrink-0 ${notebookRowBorderClassName}`}
              style={{ height: NOTEBOOK_ROW_HEIGHT }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
