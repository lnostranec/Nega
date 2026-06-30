export function normalizeSearchWords(query: string) {
  return query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function matchesSearchQuery(fields: string[], query: string): boolean {
  const words = normalizeSearchWords(query);
  if (words.length === 0) return false;

  const haystack = fields.join(" ").toLowerCase();
  return words.every((word) => haystack.includes(word));
}
