"use client";

import { useState, type FormEvent } from "react";
import type { ImportActionState } from "./state";

export function ImportForm() {
  const [state, setState] = useState<ImportActionState>({
    ok: false,
    message: "",
  });
  const [loading, setLoading] = useState(false);

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
          placeholder="Auto-filled from YouTube URL, or enter manually"
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
        <p
          className="text-sm text-[#222222]"
          role={state.ok ? "status" : "alert"}
        >
          {state.message}
          {state.ok && state.transcriptId && (
            <span className="mt-1 block text-xs opacity-80">
              Video: {state.videoId} · Transcript: {state.transcriptId}
            </span>
          )}
        </p>
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
