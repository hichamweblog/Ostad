import { describe, expect, it } from 'vitest';
import {
  buildNotebookChecks,
  clampNotebookScore,
  collectNotebookChecks,
  nextOpenRound,
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

describe('collectNotebookChecks', () => {
  it('gathers checks spread over several sessions of the same round', () => {
    const checks = collectNotebookChecks([
      session('s1', { st1: { round: 1, score: 5, at: '2026-10-01T08:00:00Z' } }),
      session('s2', { st2: { round: 1, score: 3, at: '2026-10-02T08:00:00Z' } }),
    ]);

    expect(checks.st1[1]?.score).toBe(5);
    expect(checks.st2[1]?.score).toBe(3);
    expect(notebookScoresFor(checks, 'st1')).toEqual([5]);
  });

  it('keeps the latest check when the same round was recorded twice', () => {
    const checks = collectNotebookChecks([
      session('s1', { st1: { round: 1, score: 2, at: '2026-10-01T08:00:00Z' } }),
      session('s2', { st1: { round: 1, score: 5, at: '2026-10-09T08:00:00Z' } }),
    ]);

    expect(checks.st1[1]?.score).toBe(5);
  });

  it('separates the two rounds and averages them', () => {
    const checks = collectNotebookChecks([
      session('s1', { st1: { round: 1, score: 4, at: '2026-10-01T08:00:00Z' } }),
      session('s2', { st1: { round: 2, score: 5, at: '2026-11-01T08:00:00Z' } }),
    ]);

    expect(notebookScoresFor(checks, 'st1')).toEqual([4, 5]);
  });

  it('ignores cancelled sessions and malformed entries', () => {
    const checks = collectNotebookChecks([
      session('s1', { st1: { round: 1, score: 5, at: '2026-10-01T08:00:00Z' } }, { sessionStatus: 'CANCELLED' }),
      session('s2', { st2: { round: 3 as unknown as 1, score: 5, at: '' } }),
    ]);

    expect(checks).toEqual({});
  });
});

describe('round lifecycle', () => {
  it('keeps round 1 open until every student is inspected', () => {
    const checks = collectNotebookChecks([
      session('s1', { st1: { round: 1, score: 5, at: '2026-10-01T08:00:00Z' } }),
    ]);

    expect(nextOpenRound(checks, ['st1', 'st2'])).toBe(1);
    expect(nextOpenRound(checks, ['st1'])).toBe(2);
  });

  it('reports progress for the open round', () => {
    const checks = collectNotebookChecks([
      session('s1', {
        st1: { round: 1, score: 5, at: '2026-10-01T08:00:00Z' },
        st2: { round: 1, score: 3, at: '2026-10-01T08:00:00Z' },
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
        { studentId: 'st1', score: 5 },
        { studentId: 'st2', score: 2.5 },
      ],
      2,
      '2026-11-02T10:00:00.000Z',
    );

    expect(checks.st1).toEqual({ round: 2, score: 5, at: '2026-11-02T10:00:00.000Z' });
    expect(checks.st2.score).toBe(2.5);
  });

  it('clamps out-of-range scores', () => {
    expect(clampNotebookScore(9)).toBe(5);
    expect(clampNotebookScore(-3)).toBe(0);
    expect(clampNotebookScore('x')).toBe(0);
  });
});
