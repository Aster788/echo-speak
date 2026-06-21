export function slugifyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function uniqueTopicSlug(
  baseSlug: string,
  exists: (slug: string) => Promise<boolean>
): Promise<string> {
  if (!(await exists(baseSlug))) {
    return baseSlug;
  }

  for (let index = 2; index < 100; index += 1) {
    const candidate = `${baseSlug}-${index}`;
    if (!(await exists(candidate))) {
      return candidate;
    }
  }

  throw new Error("Unable to generate a unique topic slug.");
}
