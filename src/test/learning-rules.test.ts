import { describe, it, expect } from 'vitest';
import { boundedWatched, verifiedCitations } from '../lib/tutor-evidence';
import { parseTranscript, validateScorecard, SCORE_LABELS, nextInterval } from '../lib/lesson-content';
describe('Evidence-only learning rules', () => {
 it('never accepts watch time beyond server saved progress', () => { expect(boundedWatched(650,210)).toBe(210); });
 it('requires quoted evidence from a fully watched transcript segment', () => { const chunks=[{start_sec:0,end_sec:30,text:'Quantum mechanics is a framework.'}]; expect(verifiedCitations([{start_sec:0,snippet:'framework'}],chunks,30)).toHaveLength(1); expect(verifiedCitations([{start_sec:0,snippet:'framework'}],chunks,29)).toHaveLength(0); expect(verifiedCitations([{start_sec:0,snippet:'invented'}],chunks,30)).toHaveLength(0); });
 it('requires four 1–5 scores with verbatim learner quotes and a real topic', () => { const card={scores:SCORE_LABELS.map(label=>({label,value:5,evidence:'my answer',tip:'Review'})),weakest_topic_id:'topic',revisit_sec:999,summary:'Done'}; expect(validateScorecard(card,['my answer'],[{id:'topic',start_sec:210}]).revisit_sec).toBe(210); expect(()=>validateScorecard({...card,scores:card.scores.map(s=>({...s,value:6}))},['my answer'],[{id:'topic',start_sec:210}])).toThrow(); expect(()=>validateScorecard(card,['different'],[{id:'topic',start_sec:210}])).toThrow(); });
 it('uses 1 day then 6 days for recall and resets missed topics',()=>{ expect(nextInterval(0)).toBe(1);expect(nextInterval(1)).toBe(6);expect(nextInterval(6,2.5,false)).toBe(0); });
 it('parses supplied SRT and rejects untimestamped invented content',()=>{ expect(parseTranscript('1\n00:00:00,000 --> 00:00:30,000\nActual caption.')).toEqual([{start_sec:0,end_sec:30,text:'Actual caption.'}]);expect(()=>parseTranscript('No timestamps')).toThrow(); });
});
