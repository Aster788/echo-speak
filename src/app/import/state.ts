export type ImportActionState = {
  ok: boolean;
  message: string;
  videoId?: string;
  transcriptId?: string;
};

export const importActionInitialState: ImportActionState = {
  ok: false,
  message: "",
};
