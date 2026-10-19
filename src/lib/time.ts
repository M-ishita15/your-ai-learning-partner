export function fmt(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Turn a free-text question into an OR tsquery of safe words. */
export function toTsQuery(q: string) {
  const stop = new Set(["what", "does", "the", "is", "a", "an", "of", "to", "and", "how", "why", "in", "it", "this", "that", "are", "be", "mean", "means", "about", "lecture", "say"]);
  const words = q
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stop.has(w))
    .slice(0, 12);
  return words.join(" | ");
}

export const SEED_LESSON_ID = "11111111-1111-1111-1111-111111111111";
