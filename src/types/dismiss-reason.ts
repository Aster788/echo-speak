export const DISMISS_REASONS = [
  "single_word",
  "fragment",
  "duplicate",
  "obscure",
  "already_know",
  "off_topic",
  "other",
] as const;

export type DismissReason = (typeof DISMISS_REASONS)[number];

export const DISMISS_REASON_LABELS: Record<DismissReason, string> = {
  single_word: "单词/太短",
  fragment: "语法碎片",
  duplicate: "重复拆条",
  obscure: "太生僻",
  already_know: "已会",
  off_topic: "与内容无关",
  other: "其他",
};

export function isDismissReason(value: string): value is DismissReason {
  return (DISMISS_REASONS as readonly string[]).includes(value);
}
