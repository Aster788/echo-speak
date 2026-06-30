"use client";

import { useRef, useState, type FormEvent } from "react";
import { ImportActionStrip } from "@/components/import/ImportActionStrip";
import { ImportFilePicker } from "@/components/import/ImportFilePicker";
import { ImportLineField } from "@/components/import/ImportLineField";
import { ImportLinedTextarea } from "@/components/import/ImportLinedTextarea";
import { ImportNotebookShell } from "@/components/import/ImportNotebookShell";
import { ImportStatusStrip } from "@/components/import/ImportStatusStrip";
import { notebookLabelOptionalClassName } from "@/lib/import-notebook-layout";
import { titleFromTranscriptFilename } from "@/lib/transcript-filename";
import type { ImportActionState } from "./state";

export function ImportForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ImportActionState>({
    ok: false,
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);
  const [paste, setPaste] = useState("");
  const [extractLoading, setExtractLoading] = useState(false);
  const [extractMessage, setExtractMessage] = useState("");
  const [extractCount, setExtractCount] = useState<number | undefined>();

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || titleTouched) {
      return;
    }

    setTitle(titleFromTranscriptFilename(file.name));
  }

  async function handleExtract() {
    if (!state.transcriptId) return;

    setExtractLoading(true);
    setExtractMessage("");

    try {
      const response = await fetch(
        `/api/transcripts/${state.transcriptId}/extract`,
        { method: "POST" }
      );
      const data = (await response.json()) as {
        ok: boolean;
        message?: string;
        expressionCount?: number;
      };

      if (!response.ok || !data.ok) {
        setExtractMessage(data.message ?? "Extraction failed.");
        setExtractCount(undefined);
        return;
      }

      const count = data.expressionCount ?? 0;
      setExtractCount(count);
      setExtractMessage(`Extracted ${count} expression(s).`);
    } catch {
      setExtractMessage("Extraction failed. Try again.");
      setExtractCount(undefined);
    } finally {
      setExtractLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setState({ ok: false, message: "" });
    setExtractMessage("");
    setExtractCount(undefined);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/transcripts/import", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as ImportActionState;

      setState(data);

      if (data.ok && fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch {
      setState({
        ok: false,
        message: "Import failed. Try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  const importReceiptMessage = state.message && !state.ok ? state.message : undefined;

  const canExtract = Boolean(
    state.transcriptId && (state.ok || state.duplicate)
  );
  const existingExpressionCount =
    extractCount ?? state.expressionCount ?? 0;
  const showCollectionsLink = Boolean(
    existingExpressionCount > 0 &&
      (extractCount !== undefined
        ? !extractMessage.toLowerCase().includes("failed")
        : state.duplicate)
  );
  const extractFailed = Boolean(
    extractMessage && extractMessage.toLowerCase().includes("failed")
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <ImportNotebookShell>
        <div className="flex flex-col">
          <div className="shrink-0">
            <ImportLineField
              id="title"
              name="title"
              label={
                <>
                  Video title
                  <span className={notebookLabelOptionalClassName}>
                    {" "}
                    (optional with video URL or file upload)
                  </span>
                </>
              }
              type="text"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setTitleTouched(true);
              }}
              placeholder="Auto-filled from file name or video URL"
            />

            <ImportLineField
              id="youtube_url"
              name="youtube_url"
              label={
                <>
                  Video URL{" "}
                  <span className={notebookLabelOptionalClassName}>
                    (optional)
                  </span>
                </>
              }
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
            />

            <ImportFilePicker
              key={state.ok && state.transcriptId ? state.transcriptId : "idle"}
              inputRef={fileInputRef}
              onFileChange={handleFileChange}
            />
          </div>

          <ImportActionStrip
            importLoading={loading}
            extractLoading={extractLoading}
            showExtract={canExtract}
            onExtract={handleExtract}
          />

          <ImportLinedTextarea
            id="paste"
            name="paste"
            value={paste}
            onChange={(event) => setPaste(event.target.value)}
            className="mt-2"
          />
        </div>
      </ImportNotebookShell>

      <ImportStatusStrip
        importMessage={importReceiptMessage}
        importOk={state.ok}
        importDuplicate={state.duplicate}
        duplicateVideoTitle={state.videoTitle}
        extractCount={extractCount}
        extractFailed={extractFailed}
        showCollectionsLink={showCollectionsLink}
        importPendingExtract={Boolean(
          state.duplicate &&
            state.transcriptId &&
            (state.expressionCount ?? 0) === 0
        )}
      />
    </form>
  );
}
