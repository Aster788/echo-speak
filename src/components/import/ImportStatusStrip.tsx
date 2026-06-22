import Link from "next/link";
import { pageHintFont } from "@/lib/page-hint-font";
import {
  STATUS_STRIP_ASPECT_RATIO,
  STATUS_STRIP_DISPLAY_WIDTH_PERCENT,
  STATUS_STRIP_IDLE_MESSAGE,
  statusStripIdleTextInset,
  statusStripTextInset,
} from "@/lib/import-notebook-layout";

type ImportStatusStripProps = {
  importMessage?: string;
  importOk?: boolean;
  importDuplicate?: boolean;
  duplicateVideoTitle?: string;
  extractCount?: number;
  extractFailed?: boolean;
  showTopicsLink?: boolean;
};

export function ImportStatusStrip({
  importMessage,
  importOk,
  importDuplicate,
  duplicateVideoTitle,
  extractCount,
  extractFailed,
  showTopicsLink,
}: ImportStatusStripProps) {
  const hasExtractResult = extractCount !== undefined && !extractFailed;
  const hasStatus =
    importOk ||
    importDuplicate ||
    extractCount !== undefined ||
    extractFailed ||
    Boolean(importMessage);

  return (
    <div
      className="relative mx-auto mt-7 shrink-0"
      style={{
        width: `${STATUS_STRIP_DISPLAY_WIDTH_PERCENT}%`,
        aspectRatio: String(STATUS_STRIP_ASPECT_RATIO),
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/import/sticky-notes.png"
        alt=""
        className="block h-full w-full object-contain"
        aria-hidden="true"
      />
      <div
        className={`${pageHintFont.className} absolute inset-0 flex flex-col justify-center space-y-0.5 text-[12px] italic leading-snug tracking-[0.035em] ${
          hasStatus
            ? "text-left text-[#222222]/70"
            : "items-center text-center text-[#222222]/70"
        }`}
        style={hasStatus ? statusStripTextInset : statusStripIdleTextInset}
      >
        {!hasStatus && (
          <p className="font-bold opacity-95">{STATUS_STRIP_IDLE_MESSAGE}</p>
        )}
        {importOk && !importDuplicate && !hasExtractResult && (
          <p role="status">Transcript saved successfully.</p>
        )}
        {importMessage && !hasExtractResult && <p role="alert">{importMessage}</p>}
        {importDuplicate && duplicateVideoTitle && !hasExtractResult && (
          <p className="opacity-90">Existing video: {duplicateVideoTitle}</p>
        )}
        {hasExtractResult && (
          <p role="status">Extract {extractCount} expression(s).</p>
        )}
        {extractFailed && (
          <p role="alert">Extraction failed. Try again.</p>
        )}
        {showTopicsLink && (
          <Link href="/topics" className="underline opacity-95">
            Open Topics to curate expressions.
          </Link>
        )}
      </div>
    </div>
  );
}
