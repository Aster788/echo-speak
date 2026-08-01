import { describe, expect, it, vi } from "vitest";
import {
  SUPABASE_PAGE_SIZE,
  chunkIds,
  fetchAllRows,
} from "@/lib/supabase-fetch-all";

describe("fetchAllRows", () => {
  it("returns a single page when under the page size", async () => {
    const rows = await fetchAllRows(async () => ({
      data: [{ id: 1 }, { id: 2 }],
      error: null,
    }));
    expect(rows).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it("pages until a short page (reproduces >1000 expression bug)", async () => {
    const total = SUPABASE_PAGE_SIZE + 250;
    const factory = vi.fn(async (from: number, to: number) => {
      const page = [];
      for (let i = from; i <= to && i < total; i += 1) {
        page.push({ id: i });
      }
      return { data: page, error: null };
    });

    const rows = await fetchAllRows(factory);
    expect(rows).toHaveLength(total);
    expect(factory).toHaveBeenCalledTimes(2);
    expect(factory).toHaveBeenNthCalledWith(1, 0, SUPABASE_PAGE_SIZE - 1);
    expect(factory).toHaveBeenNthCalledWith(
      2,
      SUPABASE_PAGE_SIZE,
      SUPABASE_PAGE_SIZE * 2 - 1
    );
  });

  it("throws when a page errors", async () => {
    await expect(
      fetchAllRows(async () => ({
        data: null,
        error: { message: "boom" },
      }))
    ).rejects.toThrow("boom");
  });
});

describe("chunkIds", () => {
  it("chunks id lists for .in() filters", () => {
    expect(chunkIds([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunkIds([], 2)).toEqual([]);
  });
});
