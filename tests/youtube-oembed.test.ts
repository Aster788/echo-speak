import { describe, expect, it, vi } from "vitest";
import {
  extractYoutubeVideoId,
  fetchYoutubeTitle,
  isYoutubeWatchUrl,
  normalizeYoutubeWatchUrl,
  resolveImportTitle,
} from "@/lib/youtube-oembed";

describe("youtube-oembed", () => {
  it("accepts youtube.com watch URLs", () => {
    expect(
      isYoutubeWatchUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    ).toBe(true);
  });

  it("accepts youtu.be URLs", () => {
    expect(isYoutubeWatchUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(true);
  });

  it("rejects non-YouTube URLs", () => {
    expect(isYoutubeWatchUrl("https://example.com/watch?v=1")).toBe(false);
  });

  it("normalizes watch and youtu.be URLs to the same canonical URL", () => {
    expect(
      normalizeYoutubeWatchUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    ).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(normalizeYoutubeWatchUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    );
    expect(extractYoutubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
  });

  it("fetchYoutubeTitle returns title from oEmbed response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ title: "Sample Video Title" }),
      }))
    );

    await expect(
      fetchYoutubeTitle("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    ).resolves.toBe("Sample Video Title");

    vi.unstubAllGlobals();
  });

  it("resolveImportTitle prefers manual title", async () => {
    const fetchTitle = vi.fn(async () => "From YouTube");

    await expect(
      resolveImportTitle("Manual Title", "https://youtu.be/abc", fetchTitle)
    ).resolves.toBe("Manual Title");

    expect(fetchTitle).not.toHaveBeenCalled();
  });

  it("resolveImportTitle uses oEmbed when title empty and URL present", async () => {
    const fetchTitle = vi.fn(async () => "From YouTube");

    await expect(
      resolveImportTitle("", "https://youtu.be/abc", fetchTitle)
    ).resolves.toBe("From YouTube");

    expect(fetchTitle).toHaveBeenCalledWith("https://youtu.be/abc");
  });

  it("resolveImportTitle errors when title and URL missing", async () => {
    await expect(resolveImportTitle("", null)).rejects.toThrow(/required/i);
  });
});
