import { describe, expect, it } from "vitest";
import { parseFeishuDocxTokens } from "@/lib/feishu-doc-urls";

describe("parseFeishuDocxTokens", () => {
  it("extracts token from feishu docx URL", () => {
    expect(
      parseFeishuDocxTokens(
        "https://my.feishu.cn/docx/JarWdKpIfoRVmXxFeM5ch9DTnlJ"
      )
    ).toEqual(["JarWdKpIfoRVmXxFeM5ch9DTnlJ"]);
  });

  it("dedupes and accepts bare tokens", () => {
    expect(
      parseFeishuDocxTokens(
        "JarWdKpIfoRVmXxFeM5ch9DTnlJ https://my.feishu.cn/docx/JarWdKpIfoRVmXxFeM5ch9DTnlJ"
      )
    ).toEqual(["JarWdKpIfoRVmXxFeM5ch9DTnlJ"]);
  });

  it("returns empty for blank input", () => {
    expect(parseFeishuDocxTokens("")).toEqual([]);
    expect(parseFeishuDocxTokens(null)).toEqual([]);
  });
});
