import { describe, expect, it } from 'vitest';
import {
  NOTEBOOK_SCORE_CHOICES,
  buildNotebookChecks,
  clampNotebookScore,
  collectNotebookChecks,
  nextOpenRound,
  normalizeNotebookRounds,
  notebookScoresFor,
  roundProgress,
} from '@/lib/notebook-rounds';
import type { SessionRecord } from '@/lib/types';

function session(id: string, checks: SessionRecord['notebookChecks'], extra: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id,
    classId: 'c1',
    date: '2026-10-01',
    startTime: '08:00',
    endTime: '09:00',
    sessionGoals: '',
    accomplishments: '',
    nextSteps: '',
    teacherNotes: '',
    attendance: {},
    notebookChecks: checks,
    ...extra,
  };
}

describe('notebook states', () => {
  it('offers exactly four direct states: 6/4/2/0', () => {
    expect(NOTEBOOK_SCORE_CHOICES.map(choice => choice.score)).toEqual([6, 4, 2, 0]);
    expect(NOTEBOOK_SCORE_CHOICES.map(choice => choice.label)).toEqual([
      'مكتمل ومنظم',
      'جيد، مع نقص طفيف',
      'ناقص أو غير منظم',
      'منعدم أو لم يحضر الكراس',
    ]);
  });

  it('gathers checks spread over several sessions of the same round', () => {
    const checks = collectNotebookChecks([
      session('s1', { st1: { round: 1, score: 6, at: '2026-10-01T08:00:00Z' } }),
      session('s2', { st2: { round: 1, score: 4, at: '2026-10-02T08:00:00Z' } }),
    ]);

    expect(checks.st1[1]?.score).toBe(6);
    expect(checks.st2[1]?.score).toBe(4);
    expect(notebookScoresFor(checks, 'st1')).toEqual([6]);
  });

  it('maps the previous 0–5 choices when reading without rewriting the stored record', () => {
    const checks = collectNotebookChecks([
      session('s1', {
        complete: { round: 1, score: 5, at: '2026-10-01T08:00:00Z' },
        good: { round: 1, score: 4, at: '2026-10-01T08:00:00Z' },
        incomplete: { round: 1, score: 2.5, at: '2026-10-01T08:00:00Z' },
        absent: { round: 1, score: 0, at: '2026-10-01T08:00:00Z' },
      }),
    ]);

    expect(notebookScoresFor(checks, 'complete')).toEqual([6]);
    expect(notebookScoresFor(checks, 'good')).toEqual([4]);
    expect(notebookScoresFor(checks, 'incomplete')).toEqual([2]);
    expect(notebookScoresFor(checks, 'absent')).toEqual([0]);
  });

  it('keeps the latest check when the same round was recorded twice', () => {
    const checks = collectNotebookChecks([
      session('s1', { st1: { round: 1, score: 2, at: '2026-10-01T08:00:00Z' } }),
      session('s2', { st1: { round: 1, score: 6, at: '2026-10-09T08:00:00Z' } }),
    ]);

    expect(checks.st1[1]?.score).toBe(6);
  });

  it('keeps a legacy second round in storage but reads one round by default', () => {
    const checks = collectNotebookChecks([
      session('s1', { st1: { round: 1, score: 4, at: '2026-10-01T08:00:00Z' } }),
      session('s2', { st1: { round: 2, score: 6, at: '2026-11-01T08:00:00Z' } }),
    ]);

    expect(checks.st1[2]?.score).toBe(6);
    expect(notebookScoresFor(checks, 'st1')).toEqual([4]);
    expect(notebookScoresFor(checks, 'st1', 2)).toEqual([4, 6]);
  });

  it('ignores cancelled sessions and malformed entries', () => {
    const checks = collectNotebookChecks([
      session('s1', { st1: { round: 1, score: 6, at: '2026-10-01T08:00:00Z' } }, { sessionStatus: 'CANCELLED' }),
      session('s2', { st2: { round: 3 as unknown as 1, score: 6, at: '' } }),
    ]);

    expect(checks).toEqual({});
  });
});

describe('round lifecycle', () => {
  it('never opens a second round when the term asks for one', () => {
    const partial = collectNotebookChecks([
      session('s1', { st1: { round: 1, score: 6, at: '2026-10-01T08:00:00Z' } }),
    ]);
    const complete = collectNotebookChecks([
      session('s1', {
        st1: { round: 1, score: 6, at: '2026-10-01T08:00:00Z' },
        st2: { round: 1, score: 4, at: '2026-10-01T08:00:00Z' },
      }),
    ]);

    expect(nextOpenRound(partial, ['st1', 'st2'])).toBe(1);
    expect(nextOpenRound(complete, ['st1', 'st2'])).toBe(1);
  });

  it('advances to round 2 only when the term explicitly asks for two', () => {
    const checks = collectNotebookChecks([
      session('s1', { st1: { round: 1, score: 6, at: '2026-10-01T08:00:00Z' } }),
    ]);

    expect(nextOpenRound(checks, ['st1', 'st2'], 2)).toBe(1);
    expect(nextOpenRound(checks, ['st1'], 2)).toBe(2);
    expect(nextOpenRound(checks, ['st1'], 5)).toBe(2);
  });

  it('normalises the configured round count to 1 or 2', () => {
    expect(normalizeNotebookRounds(undefined)).toBe(1);
    expect(normalizeNotebookRounds(0)).toBe(1);
    expect(normalizeNotebookRounds(2)).toBe(2);
    expect(normalizeNotebookRounds(9)).toBe(2);
    expect(normalizeNotebookRounds(Number.NaN)).toBe(1);
  });

  it('reports progress for the open round', () => {
    const checks = collectNotebookChecks([
      session('s1', {
        st1: { round: 1, score: 6, at: '2026-10-01T08:00:00Z' },
        st2: { round: 1, score: 2, at: '2026-10-01T08:00:00Z' },
      }),
    ]);

    expect(roundProgress(checks, ['st1', 'st2', 'st3'], 1)).toEqual({
      round: 1,
      inspected: 2,
      total: 3,
      complete: false,
    });
  });
});

describe('buildNotebookChecks', () => {
  it('builds one timestamped entry per inspected student', () => {
    const checks = buildNotebookChecks(
      [
        { studentId: 'st1', score: 6 },
        { studentId: 'st2', score: 2 },
      ],
      2,
      '2026-11-02T10:00:00.000Z',
    );

    expect(checks.st1).toEqual({ round: 2, score: 6, at: '2026-11-02T10:00:00.000Z' });
    expect(checks.st2.score).toBe(2);
  });

  it('clamps out-of-range scores to the direct 0–6 scale', () => {
    expect(clampNotebookScore(9)).toBe(6);
    expect(clampNotebookScore(-3)).toBe(0);
    expect(clampNotebookScore('x')).toBe(0);
  });
});
