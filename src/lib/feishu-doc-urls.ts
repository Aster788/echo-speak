/**
 * Extract Feishu docx tokens from Settings URLs / bare tokens.
 * Example: https://my.feishu.cn/docx/JarWdKpIfoRVmXxFeM5ch9DTnlJ
 */

const DOCX_URL_RE = /\/docx\/([A-Za-z0-9]+)/gi;
const BARE_TOKEN_RE = /^[A-Za-z0-9]{20,}$/;

export function parseFeishuDocxTokens(input: string | null | undefined): string[] {
  const text = input?.trim() ?? "";
  if (!text) return [];

  const tokens: string[] = [];
  const seen = new Set<string>();

  for (const match of text.matchAll(DOCX_URL_RE)) {
    const token = match[1];
    if (token && !seen.has(token)) {
      seen.add(token);
      tokens.push(token);
    }
  }

  for (const part of text.split(/[\s,;]+/)) {
    const trimmed = part.trim();
    if (!trimmed || trimmed.includes("/")) continue;
    if (BARE_TOKEN_RE.test(trimmed) && !seen.has(trimmed)) {
      seen.add(trimmed);
      tokens.push(trimmed);
    }
  }

  return tokens;
}
