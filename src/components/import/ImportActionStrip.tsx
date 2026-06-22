import { PageFlagButton } from "@/components/import/PageFlagButton";

type ImportActionStripProps = {
  importLoading: boolean;
  extractLoading: boolean;
  showExtract: boolean;
  onExtract: () => void;
};

export function ImportActionStrip({
  importLoading,
  extractLoading,
  showExtract,
  onExtract,
}: ImportActionStripProps) {
  return (
    <div className="my-2 flex shrink-0 flex-col items-center justify-center gap-2">
      <PageFlagButton type="submit" disabled={importLoading}>
        {importLoading ? "Importing…" : "Import"}
      </PageFlagButton>
      <div
        className={showExtract ? "" : "invisible pointer-events-none"}
        aria-hidden={!showExtract}
      >
        <PageFlagButton
          type="button"
          disabled={!showExtract || extractLoading}
          onClick={onExtract}
        >
          {extractLoading ? "Extracting…" : "Extract"}
        </PageFlagButton>
      </div>
    </div>
  );
}
