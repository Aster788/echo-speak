import { describe, expect, it, vi } from "vitest";
import {
  importTranscript,
  validateTranscriptLength,
  MAX_TRANSCRIPT_LENGTH,
} from "@/services/transcript-importer";
import type { SupabaseClient } from "@supabase/supabase-js";

function mockSupabase(): SupabaseClient {
  const video = {
    id: "video-1",
    title: "Test Video",
    youtube_url: null,
    source: "manual" as const,
    created_at: new Date().toISOString(),
  };

  const transcript = {
    id: "transcript-1",
    video_id: video.id,
    raw_text: "Hello world",
    cleaned_text: "Hello world",
    created_at: new Date().toISOString(),
  };

  return {
    from(table: string) {
      return {
        insert() {
          return {
            select() {
              return {
                single: async () => ({
                  data: table === "videos" ? video : transcript,
                  error: null,
                }),
              };
            },
          };
        },
      };
    },
  } as unknown as SupabaseClient;
}

describe("transcript-importer", () => {
  it("rejects empty transcript", () => {
    expect(() => validateTranscriptLength("   ")).toThrow(/empty/i);
  });

  it("rejects transcript over max length", () => {
    expect(() => validateTranscriptLength("a".repeat(MAX_TRANSCRIPT_LENGTH + 1))).toThrow(
      /maximum length/i
    );
  });

  it("imports with mocked supabase and sync cleaner", async () => {
    const cleanFn = vi.fn(async (raw: string) => raw.toUpperCase());

    const result = await importTranscript(
      { title: "My Video", rawText: "hello" },
      { supabase: mockSupabase(), cleanFn }
    );

    expect(cleanFn).toHaveBeenCalledWith("hello");
    expect(result.video.id).toBe("video-1");
    expect(result.transcript.id).toBe("transcript-1");
  });
});
