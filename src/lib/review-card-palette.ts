export const REVIEW_CARD_PALETTE = [
  "#BFB99F",
  "#E0DBC8",
  "#C8C0A9",
  "#9A947C",
  "#222222",
  "#DCD9CF",
  "#6B4242",
  "#A06C5E",
  "#C49486",
  "#573838",
  "#B88F6E",
  "#D4BC9A",
  "#B9A26F",
  "#E2D2B0",
  "#798892",
  "#4A5863",
  "#A1B0B9",
  "#5F6E7A",
  "#735F70",
  "#A898A5",
  "#523F4F",
  "#B0B9A4",
  "#8A967C",
  "#5C684E",
  "#D9CFC1",
] as const;

function parseHex(hex: string): { r: number; g: number; b: number } {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

export function pickReviewCardColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return REVIEW_CARD_PALETTE[hash % REVIEW_CARD_PALETTE.length];
}

export function reviewCardTextColor(background: string): "#FFFFFF" | "#222222" {
  const { r, g, b } = parseHex(background);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#222222" : "#FFFFFF";
}
