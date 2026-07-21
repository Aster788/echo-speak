import type { DismissReason } from "@/types/dismiss-reason";

export type AcceptedPreferenceRecord = {
  phrase: string;
  meaning: string;
  topicId: string | null;
  topicSlug: string | null;
  weight: number;
  feedbackAt: string;
};

export type DismissedPreferenceRecord = {
  phrase: string;
  phraseKey: string;
  reason: DismissReason | null;
  topicId: string | null;
  topicSlug: string | null;
  dismissedAt: string;
};

export type ExtractionPreferenceContext = {
  acceptedHistory: AcceptedPreferenceRecord[];
  dismissedHistory: DismissedPreferenceRecord[];
  dismissalReasonCounts: Partial<Record<DismissReason, number>>;
  hardBlockedKeys: Set<string>;
  totalAccepted: number;
  totalDismissed: number;
};

export type PreferenceExamples = {
  accepted: AcceptedPreferenceRecord[];
  dismissed: DismissedPreferenceRecord[];
};
