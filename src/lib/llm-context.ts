import { AsyncLocalStorage } from "node:async_hooks";
import type { LlmOverrides } from "@/lib/user-settings";

const llmContext = new AsyncLocalStorage<LlmOverrides | undefined>();

export function runWithLlmOverrides<T>(
  overrides: LlmOverrides | undefined,
  fn: () => T
): T {
  return llmContext.run(overrides, fn);
}

export function runWithLlmOverridesAsync<T>(
  overrides: LlmOverrides | undefined,
  fn: () => Promise<T>
): Promise<T> {
  return llmContext.run(overrides, fn);
}

export function getLlmOverrides(): LlmOverrides | undefined {
  return llmContext.getStore();
}
