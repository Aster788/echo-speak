/** Reasons shown in Collections / Topics dismiss pickers. */
export const COLLECTION_DISMISS_REASONS = [
  "single_word",
  "fragment",
  "duplicate",
  "obscure",
  "already_know",
  "off_topic",
  "other",
] as const;

/** All persisted dismiss reasons (includes Gaps Ignore). */
export const DISMISS_REASONS = [
  ...COLLECTION_DISMISS_REASONS,
  "gap_ignore",
] as const;

export type DismissReason = (typeof DISMISS_REASONS)[number];
export type CollectionDismissReason = (typeof COLLECTION_DISMISS_REASONS)[number];

export const DISMISS_REASON_LABELS: Record<DismissReason, string> = {
  single_word: "单词/太短",
  fragment: "语法碎片",
  duplicate: "重复拆条",
  obscure: "太生僻",
  already_know: "已会",
  off_topic: "与内容无关",
  other: "其他",
  gap_ignore: "Gaps 忽略",
};

export function isDismissReason(value: string): value is DismissReason {
  return (DISMISS_REASONS as readonly string[]).includes(value);
}
