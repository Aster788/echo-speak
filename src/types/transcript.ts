export interface Transcript {
  id: string;
  videoId: string;
  rawText: string;
  cleanedText: string | null;
  createdAt: string;
}

export interface Video {
  id: string;
  title: string;
  sourceUrl: string | null;
  createdAt: string;
}
