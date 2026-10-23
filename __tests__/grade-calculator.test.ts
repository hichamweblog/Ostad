import { describe, expect, it } from 'vitest';
import {
  calculateContinuousEvaluation,
  calculateStudentAverage
} from '@/lib/grade-calculator';

describe('calculateStudentAverage', () => {
  it('calculates the official average with one quiz', () => {
    expect(calculateStudentAverage(16, 12, 14)).toBe(14);
  });

  it('does not calculate an average when quiz is missing', () => {
    expect(calculateStudentAverage(16, null, 14)).toBeNull();
  });

  it('does not calculate an average when a required mark is missing', () => {
    expect(calculateStudentAverage(16, 12, null)).toBeNull();
  });

  it('rejects marks outside the 0 to 20 range', () => {
    expect(calculateStudentAverage(21, 12, 14)).toBeNull();
    expect(calculateStudentAverage(16, 12, Number.NaN)).toBeNull();
  });

  it('calculates continuous evaluation from four capped components', () => {
    expect(calculateContinuousEvaluation(3, 3, 5, 2.25)).toBe(13.25);
    // 8 caps at 3, a negative mark clamps to 0, notebook caps at 6
    expect(calculateContinuousEvaluation(8, -1, 9, 5)).toBe(14);
  });
});

describe('pedagogical evaluations tiers', () => {
  it('assigns distinctive estimations to EXCELLENT and VERY_GOOD tiers (§3.6)', async () => {
    const { getDefaultEstimation, getScoreTier, PEDAGOGICAL_TIERS } = await import('@/lib/pedagogical-evaluations');
    expect(getScoreTier(19)).toBe('EXCELLENT');
    expect(getDefaultEstimation(19)).toBe('نتائج ممتازة');

    expect(getScoreTier(17)).toBe('VERY_GOOD');
    expect(getDefaultEstimation(17)).toBe('نتائج جيدة جداً');

    expect(PEDAGOGICAL_TIERS.EXCELLENT.defaultEstimation).not.toBe(
      PEDAGOGICAL_TIERS.VERY_GOOD.defaultEstimation
    );
  });
});

describe('calculateEvaluationBreakdown (decree weights 3/3/6/8)', () => {
  const rules = {
    behaviorMax: 3,
    attendanceMax: 3,
    notebookMax: 6,
    participationMax: 8,
    participationRecordedMax: 3,
    participationJudgementMax: 5,
    participationTargetRatio: 0.25,
    disruptionDeduction: 0.25,
    disruptionRepeatDeduction: 0.5,
  };

  it('gives a student with no incidents and full evidence the full mark', async () => {
    const { calculateEvaluationBreakdown } = await import('@/lib/grade-calculator');
    const breakdown = calculateEvaluationBreakdown(
      {
        sessionsCount: 30,
        documentedSessions: 12,
        goodPart: 6,
        notebookScores: [5, 5],
        participationJudgement: 5,
      },
      rules,
    );
    expect(breakdown.behavior).toBe(3);
    expect(breakdown.attendance).toBe(3);
    expect(breakdown.notebook).toBe(6);
    expect(breakdown.participation).toBeCloseTo(8, 5);
    expect(breakdown.total).toBe(20);
  });

  it('scales attendance by the share of missed sessions, not by a flat count', async () => {
    const { calculateEvaluationBreakdown } = await import('@/lib/grade-calculator');
    const tenSessions = calculateEvaluationBreakdown({ sessionsCount: 10, absent: 2 }, rules);
    const thirtySessions = calculateEvaluationBreakdown({ sessionsCount: 30, absent: 2 }, rules);
    // 2/10 misses = 80% → 3 * 0.64; 2/30 = 93.3% → 3 * 0.87
    expect(tenSessions.attendance).toBeLessThan(thirtySessions.attendance);
    expect(tenSessions.attendance).toBeCloseTo(1.92, 2);
    expect(thirtySessions.attendance).toBeCloseTo(2.61, 2);
  });

  it('escalates the behaviour deduction instead of dropping the whole component at once', async () => {
    const { calculateEvaluationBreakdown } = await import('@/lib/grade-calculator');
    expect(calculateEvaluationBreakdown({ disruptions: 1 }, rules).behavior).toBe(2.75);
    expect(calculateEvaluationBreakdown({ disruptions: 2 }, rules).behavior).toBe(2.25);
    expect(calculateEvaluationBreakdown({ disruptions: 6 }, rules).behavior).toBe(0.25);
  });

  it('averages the two notebook rounds on a 0–6 scale', async () => {
    const { calculateEvaluationBreakdown } = await import('@/lib/grade-calculator');
    expect(calculateEvaluationBreakdown({ notebookScores: [5, 5] }, rules).notebook).toBe(6);
    expect(calculateEvaluationBreakdown({ notebookScores: [5, 3] }, rules).notebook).toBe(4.8);
    expect(calculateEvaluationBreakdown({ notebookScores: [0, 0] }, rules).notebook).toBe(0);
  });

  it('counts documented participation on documented sessions only', async () => {
    const { calculateEvaluationBreakdown } = await import('@/lib/grade-calculator');
    // 3 positives out of 12 documented sessions = 25% → full 3 points
    expect(calculateEvaluationBreakdown({ documentedSessions: 12, goodPart: 3 }, rules).participationRecorded).toBe(3);
    // 1/12 < 25% → one third of 3
    expect(calculateEvaluationBreakdown({ documentedSessions: 12, goodPart: 1 }, rules).participationRecorded).toBe(1);
    // no documented session at all → the component is missing, never a zero verdict
    expect(calculateEvaluationBreakdown({ sessionsCount: 20, documentedSessions: 0 }, rules).participationRecorded).toBeNull();
  });

  it('adds the teacher judgement (0–5) on top of the documented part', async () => {
    const { calculateEvaluationBreakdown } = await import('@/lib/grade-calculator');
    const breakdown = calculateEvaluationBreakdown(
      { documentedSessions: 10, goodPart: 0, participationJudgement: 2.5 },
      rules,
    );
    expect(breakdown.participationRecorded).toBe(0);
    expect(breakdown.participationJudgement).toBe(2.5);
    expect(breakdown.participation).toBe(2.5);
  });

  it('excludes a component with no evidence and redistributes its weight', async () => {
    const { calculateEvaluationBreakdown } = await import('@/lib/grade-calculator');
    const noNotebook = calculateEvaluationBreakdown(
      { sessionsCount: 30, documentedSessions: 10, goodPart: 3, participationJudgement: 5 },
      rules,
    );
    expect(noNotebook.missing).toContain('notebook');
    expect(noNotebook.availableMax).toBe(14);
    expect(noNotebook.total).toBe(20);

    const sparse = calculateEvaluationBreakdown(
      { sessionsCount: 3, disruptions: 2, documentedSessions: 10, goodPart: 3, participationJudgement: 5 },
      rules,
    );
    expect(sparse.missing).toEqual(expect.arrayContaining(['attendance', 'notebook']));
    // عنصر مستبعد يُعرض فراغاً لا صفراً
    expect(sparse.attendance).toBeNull();
    expect(sparse.notebook).toBeNull();
    expect(sparse.availableMax).toBe(11);
    // 2.25 behaviour of 3 + 8 participation of 8 → 10.25/11 → 18.64
    expect(sparse.total).toBeCloseTo(18.64, 2);
  });

  it('never exceeds 20 for any combination', async () => {
    const { calculateEvaluationBreakdown } = await import('@/lib/grade-calculator');
    const perfect = calculateEvaluationBreakdown(
      {
        sessionsCount: 40,
        documentedSessions: 4,
        goodPart: 40,
        notebookScores: [5, 5],
        participationJudgement: 5,
      },
      rules,
    );
    expect(perfect.total).toBeLessThanOrEqual(20);
    expect(perfect.total).toBe(20);
  });
});
