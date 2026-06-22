"use client";

import { pageHintFont } from "@/lib/page-hint-font";
import { useState } from "react";
import {
  NOTEBOOK_ROW_HEIGHT,
  notebookInputClassName,
  notebookLabelClassName,
  notebookRowBorderClassName,
} from "@/lib/import-notebook-layout";

type ImportFilePickerProps = {
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export function ImportFilePicker({
  inputRef,
  onFileChange,
}: ImportFilePickerProps) {
  const [fileName, setFileName] = useState<string | null>(null);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setFileName(file?.name ?? null);
    onFileChange(event);
  }

  function openPicker() {
    inputRef.current?.click();
  }

  const labelText = fileName
    ? "One file selected"
    : "Click here to choose file";

  return (
    <div className="mb-2 shrink-0">
      <div className={`${pageHintFont.className} ${notebookLabelClassName} mb-0.5`}>
        Upload .txt or .srt
      </div>

      <input
        ref={inputRef}
        id="file"
        name="file"
        type="file"
        accept=".txt,.srt,text/plain,application/x-subrip"
        onChange={handleChange}
        className="sr-only"
      />

      <div
        className={`w-full ${notebookRowBorderClassName}`}
        style={{ height: NOTEBOOK_ROW_HEIGHT }}
      >
        <button
          type="button"
          onClick={openPicker}
          className={`inline-flex h-full w-full max-w-full items-center gap-1 text-left ${notebookInputClassName}`}
          style={{ lineHeight: `${NOTEBOOK_ROW_HEIGHT}px` }}
        >
          <span className="shrink-0">{labelText}</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/import/pen-button.png"
            alt=""
            className="h-7 w-7 shrink-0 object-contain"
          />
        </button>
      </div>
    </div>
  );
}
