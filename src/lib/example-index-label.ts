/** Zero-padded example index for multi-example cards: 01, 02, 03, … */
export function formatExampleIndexLabel(index: number): string {
  return String(index + 1).padStart(2, "0");
}
