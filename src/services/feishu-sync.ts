/**
 * Sync notes from Feishu into the expression pipeline.
 * TODO: implement Feishu Open API auth and note fetch.
 */

export interface FeishuNote {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

export async function syncFeishuNotes(): Promise<FeishuNote[]> {
  throw new Error("Feishu sync not implemented");
}
