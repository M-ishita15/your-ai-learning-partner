import { describe, expect, it } from 'vitest';
import { validateNoteSummary } from '../lib/notes-content';

describe('Watched-only note summaries', () => {
  const chunks = [{ start_sec: 0, end_sec: 30, text: 'Quantum mechanics is a framework.' }];
  const output = { title: 'Framework', points: [{ text: 'A framework for physics.', start_sec: 0, quote: 'Quantum mechanics is a framework.' }] };
  it('accepts exact evidence from a fully watched segment', () => {
    expect(validateNoteSummary(output, chunks, 30)).toEqual(output);
  });
  it('does not unlock summaries from partially watched content', () => {
    expect(() => validateNoteSummary(output, chunks, 29)).toThrow();
  });
  it('rejects invented quotes and mismatched timestamps', () => {
    expect(() => validateNoteSummary({ ...output, points: [{ ...output.points[0], quote: 'invented' }] }, chunks, 30)).toThrow();
    expect(() => validateNoteSummary({ ...output, points: [{ ...output.points[0], start_sec: 210 }] }, chunks, 30)).toThrow();
  });
});