"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { titleFromTranscriptFilename } from "@/lib/transcript-filename";
import type { ImportActionState } from "./state";

function ExtractExpressionsButton({ transcriptId }: { transcriptId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleExtract() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/transcripts/${transcriptId}/extract`, {
        method: "POST",
      });
      const data = (await response.json()) as {
        ok: boolean;
        message?: string;
        expressionCount?: number;
      };

      if (!response.ok || !data.ok) {
        setMessage(data.message ?? "Extraction failed.");
        return;
      }

      setMessage(
        `Extracted ${data.expressionCount ?? 0} expression(s). Curate them in Topics.`
      );
    } catch {
      setMessage("Extraction failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <button
        type="button"
        onClick={handleExtract}
        disabled={loading}
        className="w-full rounded border border-[#222222] bg-[#FFFFFF] px-4 py-2 text-[#222222] transition-opacity duration-150 disabled:opacity-60"
      >
        {loading ? "Extracting…" : "Extract expressions"}
      </button>
      {message && (
        <p className="text-xs text-[#222222] opacity-80" role="status">
          {message}
        </p>
      )}
    </div>
  );
}

export function ImportForm() {
  const [state, setState] = useState<ImportActionState>({
    ok: false,
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || titleTouched) {
      return;
    }

    setTitle(titleFromTranscriptFilename(file.name));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setState({ ok: false, message: "" });

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/transcripts/import", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as ImportActionState;

      setState(data);

      if (data.ok) {
        form.reset();
        setTitle("");
        setTitleTouched(false);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="mb-1 block text-sm text-[#222222]">
          Video title
          <span className="font-normal opacity-70">
            {" "}
            (optional with YouTube URL or file upload)
          </span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            setTitleTouched(true);
          }}
          placeholder="Auto-filled from file name or YouTube URL"
          className="w-full rounded border border-[#222222]/20 bg-[#FFFFFF] px-3 py-2 text-[#222222]"
        />
      </div>

      <div>
        <label
          htmlFor="youtube_url"
          className="mb-1 block text-sm text-[#222222]"
        >
          YouTube URL (optional)
        </label>
        <input
          id="youtube_url"
          name="youtube_url"
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full rounded border border-[#222222]/20 bg-[#FFFFFF] px-3 py-2 text-[#222222]"
        />
      </div>

      <div>
        <label htmlFor="file" className="mb-1 block text-sm text-[#222222]">
          Upload .txt or .srt
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".txt,.srt,text/plain,application/x-subrip"
          onChange={handleFileChange}
          className="w-full text-sm text-[#222222]"
        />
      </div>

      <div>
        <label htmlFor="paste" className="mb-1 block text-sm text-[#222222]">
          Or paste transcript
        </label>
        <textarea
          id="paste"
          name="paste"
          rows={12}
          placeholder="Paste exported YouTube transcript…"
          className="w-full rounded border border-[#222222]/20 bg-[#FFFFFF] px-3 py-2 font-mono text-sm text-[#222222]"
        />
      </div>

      {state.message && (
        <div
          className="text-sm text-[#222222]"
          role={state.ok ? "status" : "alert"}
        >
          <p>{state.message}</p>
          {state.duplicate && state.videoId && (
            <p className="mt-2 text-xs opacity-80">
              Existing video{state.videoTitle ? `: ${state.videoTitle}` : ""} ·{" "}
              {state.transcriptId
                ? `Transcript: ${state.transcriptId}`
                : `Video: ${state.videoId}`}
            </p>
          )}
          {state.duplicate && (
            <Link
              href="/topics"
              className="mt-2 inline-block text-xs underline opacity-80"
            >
              Open Topics to review existing expressions
            </Link>
          )}
          {state.ok && state.transcriptId && (
            <span className="mt-1 block text-xs opacity-80">
              Video: {state.videoId} · Transcript: {state.transcriptId}
            </span>
          )}
        </div>
      )}

      {state.ok && state.transcriptId && (
        <div className="mt-3 space-y-2">
          <ExtractExpressionsButton transcriptId={state.transcriptId} />
          <Link
            href="/topics"
            className="block text-center text-xs text-[#222222] underline opacity-80"
          >
            Open Topics to curate expressions
          </Link>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded border border-[#222222] bg-[#222222] px-4 py-2 text-[#FFFFFF] transition-opacity duration-150 disabled:opacity-60"
      >
        {loading ? "Importing…" : "Import"}
      </button>
    </form>
  );
}
