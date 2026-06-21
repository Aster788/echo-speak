import { describe, expect, it, vi } from "vitest";
import { hashTranscriptContent } from "@/lib/transcript-content-hash";
import { DuplicateImportError } from "@/services/import-duplicate-error";
import {
  importTranscript,
  validateTranscriptLength,
  MAX_TRANSCRIPT_LENGTH,
} from "@/services/transcript-importer";
import type { SupabaseClient } from "@supabase/supabase-js";

function mockSupabase(options: {
  existingHash?: { video_id: string; id: string } | null;
  existingYoutubeVideo?: {
    id: string;
    title: string;
    transcriptId?: string;
  } | null;
} = {}): SupabaseClient {
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
    content_hash: hashTranscriptContent("Hello world"),
    created_at: new Date().toISOString(),
  };

  return {
    from(table: string) {
      if (table === "transcripts") {
        return {
          select(columns?: string) {
            if (columns === "id, video_id, cleaned_text") {
              return {
                not: () => ({
                  async then() {
                    return { data: [], error: null };
                  },
                }),
              };
            }

            return {
              eq(_column: string, value: string) {
                if (value === options.existingHash?.id) {
                  return {
                    single: async () => ({ data: transcript, error: null }),
                  };
                }

                if (
                  options.existingHash &&
                  value === hashTranscriptContent("duplicate text")
                ) {
                  return {
                    maybeSingle: async () => ({
                      data: {
                        ...transcript,
                        id: options.existingHash!.id,
                        video_id: options.existingHash!.video_id,
                      },
                      error: null,
                    }),
                  };
                }

                return {
                  maybeSingle: async () => ({ data: null, error: null }),
                  order() {
                    return {
                      limit() {
                        return {
                          maybeSingle: async () => ({
                            data: options.existingYoutubeVideo?.transcriptId
                              ? {
                                  id: options.existingYoutubeVideo.transcriptId,
                                  video_id: options.existingYoutubeVideo.id,
                                }
                              : null,
                            error: null,
                          }),
                        };
                      },
                    };
                  },
                };
              },
            };
          },
          insert() {
            return {
              select() {
                return {
                  single: async () => ({ data: transcript, error: null }),
                };
              },
            };
          },
        };
      }

      if (table === "videos") {
        return {
          select() {
            return {
              eq(_column: string, value: string) {
                if (
                  options.existingYoutubeVideo &&
                  value ===
                    "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                ) {
                  return {
                    maybeSingle: async () => ({
                      data: {
                        id: options.existingYoutubeVideo!.id,
                        title: options.existingYoutubeVideo!.title,
                        youtube_url: value,
                        source: "youtube",
                        created_at: new Date().toISOString(),
                      },
                      error: null,
                    }),
                  };
                }

                return {
                  maybeSingle: async () => ({ data: null, error: null }),
                };
              },
            };
          },
          insert() {
            return {
              select() {
                return {
                  single: async () => ({ data: video, error: null }),
                };
              },
            };
          },
        };
      }

      throw new Error(`Unexpected table: ${table}`);
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

  it("rejects duplicate transcript content", async () => {
    await expect(
      importTranscript(
        { title: "Again", rawText: "duplicate text" },
        {
          supabase: mockSupabase({
            existingHash: { id: "existing-transcript", video_id: "existing-video" },
          }),
          cleanFn: async (raw) => raw,
        }
      )
    ).rejects.toBeInstanceOf(DuplicateImportError);
  });

  it("rejects duplicate YouTube URL", async () => {
    await expect(
      importTranscript(
        {
          title: "Duplicate",
          rawText: "brand new transcript text",
          youtube_url: "https://youtu.be/dQw4w9WgXcQ",
        },
        {
          supabase: mockSupabase({
            existingYoutubeVideo: {
              id: "existing-video",
              title: "Already Imported",
              transcriptId: "existing-transcript",
            },
          }),
          cleanFn: async (raw) => raw,
        }
      )
    ).rejects.toMatchObject({
      reason: "youtube_url",
      videoId: "existing-video",
    });
  });
});
