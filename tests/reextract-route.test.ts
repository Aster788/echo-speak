import { describe, expect, it, vi, beforeEach } from "vitest";

const getLatestTranscriptForVideo = vi.fn();
const extractExpressionsForTranscript = vi.fn();

vi.mock("@/db/transcripts", () => ({
  getLatestTranscriptForVideo: (...args: unknown[]) =>
    getLatestTranscriptForVideo(...args),
}));
vi.mock("@/services/expression-pipeline", () => ({
  extractExpressionsForTranscript: (...args: unknown[]) =>
    extractExpressionsForTranscript(...args),
}));
vi.mock("@/lib/supabase", () => ({
  getSupabaseAdmin: () => ({}),
}));

import { POST } from "@/app/api/videos/[id]/reextract/route";

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("POST /api/videos/[id]/reextract", () => {
  beforeEach(() => {
    getLatestTranscriptForVideo.mockReset();
    extractExpressionsForTranscript.mockReset();
  });

  it("returns 404 when no transcript found for the video", async () => {
    getLatestTranscriptForVideo.mockResolvedValue(null);
    const response = await POST(
      new Request("https://x/api/videos/vid-1/reextract", {
        method: "POST",
        body: "{}",
      }),
      makeContext("vid-1")
    );
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.ok).toBe(false);
  });

  it("resolves latest transcript and delegates to the pipeline", async () => {
    const transcript = { id: "transcript-9", video_id: "vid-1" };
    getLatestTranscriptForVideo.mockResolvedValue(transcript);
    extractExpressionsForTranscript.mockResolvedValue({
      videoId: "vid-1",
      transcriptId: "transcript-9",
      expressionCount: 7,
      expressions: [],
    });

    const response = await POST(
      new Request("https://x/api/videos/vid-1/reextract", {
        method: "POST",
        body: "{}",
      }),
      makeContext("vid-1")
    );

    expect(getLatestTranscriptForVideo).toHaveBeenCalledWith("vid-1", expect.anything());
    expect(extractExpressionsForTranscript).toHaveBeenCalledWith(
      "transcript-9",
      expect.objectContaining({ supabase: expect.anything() })
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.expressionCount).toBe(7);
  });

  it("passes depth through when provided", async () => {
    const transcript = { id: "t-1", video_id: "v-1" };
    getLatestTranscriptForVideo.mockResolvedValue(transcript);
    extractExpressionsForTranscript.mockResolvedValue({
      videoId: "v-1",
      transcriptId: "t-1",
      expressionCount: 3,
      expressions: [],
    });

    await POST(
      new Request("https://x/api/videos/v-1/reextract", {
        method: "POST",
        body: JSON.stringify({ depth: "deep" }),
      }),
      makeContext("v-1")
    );

    expect(extractExpressionsForTranscript).toHaveBeenCalledWith(
      "t-1",
      expect.objectContaining({ depth: "deep" })
    );
  });
});
