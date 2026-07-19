import { describe, expect, it } from "vitest";
import {
  elementsToMarkdown,
  feishuBlocksToMarkdown,
  type FeishuDocBlock,
} from "@/lib/feishu-blocks-to-markdown";
import { parseFeishuDoc } from "@/lib/feishu-doc-parser";

describe("elementsToMarkdown", () => {
  it("preserves heading link as markdown", () => {
    const md = elementsToMarkdown([
      { text_run: { content: "🍊 " } },
      {
        text_run: {
          content: "没有安排的一天",
          text_element_style: {
            link: {
              url: "https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DQOFhaDA3X3Q",
            },
          },
        },
      },
    ]);
    expect(md).toBe(
      "🍊 [没有安排的一天](https://www.youtube.com/watch?v=QOFhaDA3X3Q)"
    );
  });
});

describe("feishuBlocksToMarkdown", () => {
  it("emits H1/H3/section/bullets/table for parseFeishuDoc", () => {
    const blocks: FeishuDocBlock[] = [
      {
        block_id: "page",
        block_type: 1,
        children: ["h1", "h3", "table", "sec", "b1"],
        page: { elements: [{ text_run: { content: "Doc" } }] },
      },
      {
        block_id: "h1",
        block_type: 3,
        heading1: {
          elements: [
            {
              text_run: {
                content: "Leah",
                text_element_style: {
                  link: { url: "https%3A%2F%2Fwww.youtube.com%2F%40Leah" },
                },
              },
            },
          ],
        },
      },
      {
        block_id: "h3",
        block_type: 5,
        heading3: {
          elements: [
            {
              text_run: {
                content: "Video Title",
                text_element_style: {
                  link: {
                    url: "https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3Dabc123XXXXX",
                  },
                },
              },
            },
          ],
        },
      },
      {
        block_id: "table",
        block_type: 31,
        table: {
          cells: ["c1", "c2", "c3", "c4"],
          property: { column_size: 2, row_size: 2 },
        },
      },
      { block_id: "c1", block_type: 32, children: ["t1"], table_cell: {} },
      { block_id: "c2", block_type: 32, children: ["t2"], table_cell: {} },
      { block_id: "c3", block_type: 32, children: ["t3"], table_cell: {} },
      { block_id: "c4", block_type: 32, children: ["t4"], table_cell: {} },
      {
        block_id: "t1",
        block_type: 2,
        text: { elements: [{ text_run: { content: "sew" } }] },
      },
      {
        block_id: "t2",
        block_type: 2,
        text: { elements: [{ text_run: { content: "缝" } }] },
      },
      {
        block_id: "t3",
        block_type: 2,
        text: { elements: [{ text_run: { content: "loose" } }] },
      },
      {
        block_id: "t4",
        block_type: 2,
        text: { elements: [{ text_run: { content: "松" } }] },
      },
      {
        block_id: "sec",
        block_type: 2,
        text: { elements: [{ text_run: { content: "【Shopping】" } }] },
      },
      {
        block_id: "b1",
        block_type: 12,
        bullet: {
          elements: [{ text_run: { content: "I might stop by (逛)." } }],
        },
      },
    ];

    const md = feishuBlocksToMarkdown(blocks);
    const sections = parseFeishuDoc(md);
    expect(sections).toHaveLength(1);
    expect(sections[0]?.creatorName).toBe("Leah");
    expect(sections[0]?.videoTitle).toBe("Video Title");
    expect(sections[0]?.youtubeUrl).toContain("watch?v=abc123XXXXX");
    expect(sections[0]?.blocks.some((b) => b.type === "table")).toBe(true);
    expect(
      sections[0]?.blocks.some(
        (b) => b.type === "bullet" && b.section === "Shopping"
      )
    ).toBe(true);
  });
});
