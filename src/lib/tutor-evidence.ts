export function boundedWatched(requested: number, saved: number) { return Math.max(0, Math.min(requested, saved)); }
export function verifiedCitations(citations: { start_sec: number; snippet: string }[], chunks: { start_sec: number; end_sec: number; text: string }[], watched: number) {
  return citations.filter(c => c.snippet.trim().length > 0 && chunks.some(chunk => chunk.end_sec <= watched && chunk.start_sec === c.start_sec && chunk.text.includes(c.snippet))).slice(0, 4);
}
