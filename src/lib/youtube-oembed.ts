const OEMBED_ENDPOINT = "https://www.youtube.com/oembed";

type OEmbedResponse = {
  title?: string;
};

export function isYoutubeWatchUrl(url: string): boolean {
  return extractYoutubeVideoId(url) !== null;
}

export function extractYoutubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.replace(/^\//, "").split("/")[0];
      return id || null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v");
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function normalizeYoutubeWatchUrl(url: string): string | null {
  const videoId = extractYoutubeVideoId(url);
  if (!videoId) {
    return null;
  }

  return `https://www.youtube.com/watch?v=${videoId}`;
}

export async function fetchYoutubeTitle(url: string): Promise<string> {
  const trimmed = url.trim();
  if (!isYoutubeWatchUrl(trimmed)) {
    throw new Error("Invalid YouTube URL.");
  }

  const oembedUrl = `${OEMBED_ENDPOINT}?url=${encodeURIComponent(trimmed)}&format=json`;
  const response = await fetch(oembedUrl);

  if (!response.ok) {
    throw new Error("Could not fetch video title from YouTube.");
  }

  const data = (await response.json()) as OEmbedResponse;
  const title = data.title?.trim();

  if (!title) {
    throw new Error("YouTube returned an empty title.");
  }

  return title;
}

export async function resolveImportTitle(
  title: string,
  youtube_url: string | null | undefined,
  fetchTitle: (url: string) => Promise<string> = fetchYoutubeTitle
): Promise<string> {
  const trimmedTitle = title.trim();
  if (trimmedTitle) {
    return trimmedTitle;
  }

  const trimmedUrl = youtube_url?.trim();
  if (trimmedUrl) {
    return fetchTitle(trimmedUrl);
  }

  throw new Error(
    "Video title is required unless a YouTube URL is provided."
  );
}
