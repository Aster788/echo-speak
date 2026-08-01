/**
 * Supabase/PostgREST caps each response at 1000 rows by default.
 * Unbounded `.select()` calls must page with `.range()` or silently drop data
 * (e.g. Today's Review newEligible undercounting past 1000 expressions).
 */

export const SUPABASE_PAGE_SIZE = 1000;

export type SupabasePageResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

/**
 * Fetch every row for a query by paging with inclusive `from`/`to` ranges.
 * `queryFactory` must apply the same filters/order and call `.range(from, to)`.
 */
export async function fetchAllRows<T>(
  queryFactory: (
    from: number,
    to: number
  ) => PromiseLike<SupabasePageResult<T>>,
  pageSize: number = SUPABASE_PAGE_SIZE
): Promise<T[]> {
  if (pageSize < 1) {
    throw new Error("pageSize must be >= 1");
  }

  const rows: T[] = [];
  let from = 0;

  for (;;) {
    const to = from + pageSize - 1;
    const { data, error } = await queryFactory(from, to);
    if (error) {
      throw new Error(error.message);
    }
    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) {
      break;
    }
    from += pageSize;
  }

  return rows;
}

/** Split an id list for PostgREST `.in()` filters (URL / clause size limits). */
export function chunkIds<T>(ids: T[], chunkSize: number = 500): T[][] {
  if (chunkSize < 1) {
    throw new Error("chunkSize must be >= 1");
  }
  if (ids.length === 0) return [];
  const chunks: T[][] = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    chunks.push(ids.slice(i, i + chunkSize));
  }
  return chunks;
}
