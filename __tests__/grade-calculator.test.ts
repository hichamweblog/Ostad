import { describe, expect, it } from 'vitest';
import {
  calculateContinuousEvaluation,
  calculateEvaluationBreakdown,
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

describe('calculateEvaluationBreakdown (3/3/6/8 with 4+4 participation)', () => {
  const rules = {
    behaviorMax: 3,
    attendanceMax: 3,
    notebookMax: 6,
    participationMax: 8,
    participationRecordedMax: 4,
    participationJudgementMax: 4,
    participationTargetRatio: 0.3,
    disruptionDeduction: 0.5,
    disruptionRepeatDeduction: 0.5,
    unexcusedAbsenceDeduction: 0.5,
    // حتى لو بقي إعداد قديم، لا يجوز أن يدخل التأخر في الحساب.
    lateDeduction: 0.5,
  };

  it('gives a student with no incidents and full evidence the full mark', () => {
    const breakdown = calculateEvaluationBreakdown(
      {
        sessionsCount: 30,
        documentedSessions: 12,
        goodPart: 4,
        notebookScores: [6],
        participationJudgement: 4,
      },
      rules,
    );
    expect(breakdown.behavior).toBe(3);
    expect(breakdown.attendance).toBe(3);
    expect(breakdown.notebook).toBe(6);
    expect(breakdown.participation).toBe(8);
    expect(breakdown.total).toBe(20);
  });

  it('deducts a direct 0.5 per unexcused absence regardless of session count', () => {
    const tenSessions = calculateEvaluationBreakdown({ sessionsCount: 10, absent: 2 }, rules);
    const thirtySessions = calculateEvaluationBreakdown({ sessionsCount: 30, absent: 2 }, rules);
    expect(tenSessions.attendance).toBe(2);
    expect(thirtySessions.attendance).toBe(2);
    expect(calculateEvaluationBreakdown({ absent: 1 }, rules).attendance).toBe(2.5);
    expect(calculateEvaluationBreakdown({ absent: 6 }, rules).attendance).toBe(0);
    expect(calculateEvaluationBreakdown({ absent: 8 }, rules).attendance).toBe(0);
  });

  it('records late marks without deducting them', () => {
    expect(calculateEvaluationBreakdown({ late: 4 }, rules).attendance).toBe(3);
    expect(calculateEvaluationBreakdown({ absent: 1, late: 4 }, rules).attendance).toBe(2.5);
  });

  it('deducts a flat 0.5 per behaviour incident from the very first one', () => {
    expect(calculateEvaluationBreakdown({ disruptions: 1 }, rules).behavior).toBe(2.5);
    expect(calculateEvaluationBreakdown({ disruptions: 2 }, rules).behavior).toBe(2);
    expect(calculateEvaluationBreakdown({ disruptions: 6 }, rules).behavior).toBe(0);
    expect(calculateEvaluationBreakdown({ disruptions: 1 }).behavior).toBe(2.5);
  });

  it('uses the four notebook states directly on a 0–6 scale', () => {
    expect(calculateEvaluationBreakdown({ notebookScores: [6] }, rules).notebook).toBe(6);
    expect(calculateEvaluationBreakdown({ notebookScores: [4] }, rules).notebook).toBe(4);
    expect(calculateEvaluationBreakdown({ notebookScores: [2] }, rules).notebook).toBe(2);
    expect(calculateEvaluationBreakdown({ notebookScores: [0] }, rules).notebook).toBe(0);
    // جولة ثانية قديمة لا تدخل عندما يكون الفصل مضبوطاً على مراقبة واحدة.
    expect(calculateEvaluationBreakdown({ notebookScores: [6, 0] }, rules).notebook).toBe(6);
  });

  it('averages direct scores only when two rounds are explicitly configured', () => {
    const twoRounds = { ...rules, notebookRounds: 2 };
    expect(calculateEvaluationBreakdown({ notebookScores: [6, 4] }, twoRounds).notebook).toBe(5);
    expect(calculateEvaluationBreakdown({ notebookScores: [4, 2] }, twoRounds).notebook).toBe(3);
    expect(calculateEvaluationBreakdown({ notebookScores: [0, 0] }, twoRounds).notebook).toBe(0);
  });

  it('uses only the termly inspection and ignores legacy daily notebook notes', () => {
    expect(calculateEvaluationBreakdown({ notebookScores: [4] }, rules).notebook).toBe(4);
    expect(calculateEvaluationBreakdown({ notebookScores: [0] }, rules).notebook).toBe(0);
    expect(calculateEvaluationBreakdown({ unwritten: 12 }, rules).notebook).toBeNull();
    expect(calculateEvaluationBreakdown({ unwritten: 12 }, rules).missing).toContain('notebook');
    expect(calculateEvaluationBreakdown({}, rules).notebook).toBeNull();
  });

  it('gives full recorded participation at 30% of documented sessions', () => {
    expect(calculateEvaluationBreakdown({ documentedSessions: 10, goodPart: 3 }, rules).participationRecorded).toBe(4);
    expect(calculateEvaluationBreakdown({ documentedSessions: 10, goodPart: 8 }, rules).participationRecorded).toBe(4);
    expect(calculateEvaluationBreakdown({ sessionsCount: 20, documentedSessions: 0 }, rules).participationRecorded).toBeNull();
  });

  it('rounds proportional recorded participation to the nearest half point', () => {
    expect(calculateEvaluationBreakdown({ documentedSessions: 10, goodPart: 2 }, rules).participationRecorded).toBe(2.5);
    expect(calculateEvaluationBreakdown({ documentedSessions: 10, goodPart: 1 }, rules).participationRecorded).toBe(1.5);
    expect(calculateEvaluationBreakdown({ documentedSessions: 20, goodPart: 1 }, rules).participationRecorded).toBe(0.5);
    expect(calculateEvaluationBreakdown({ documentedSessions: 10, goodPart: 0 }, rules).participationRecorded).toBe(0);
  });

  it('adds the direct teacher judgement 0/2/4 on top of the recorded part', () => {
    const average = calculateEvaluationBreakdown(
      { documentedSessions: 10, goodPart: 0, participationJudgement: 2 },
      rules,
    );
    expect(average.participationRecorded).toBe(0);
    expect(average.participationJudgement).toBe(2);
    expect(average.participation).toBe(2);

    const excellent = calculateEvaluationBreakdown(
      { documentedSessions: 10, goodPart: 3, participationJudgement: 4 },
      rules,
    );
    expect(excellent.participation).toBe(8);
  });

  it('excludes missing notebook evidence and redistributes its weight', () => {
    const noNotebook = calculateEvaluationBreakdown(
      { sessionsCount: 30, documentedSessions: 10, goodPart: 3, participationJudgement: 4 },
      rules,
    );
    expect(noNotebook.missing).toEqual(['notebook']);
    expect(noNotebook.availableMax).toBe(14);
    expect(noNotebook.total).toBe(20);

    const sparse = calculateEvaluationBreakdown(
      { sessionsCount: 3, disruptions: 2, documentedSessions: 10, goodPart: 3, participationJudgement: 4 },
      rules,
    );
    expect(sparse.missing).toEqual(['notebook']);
    expect(sparse.attendance).toBe(3);
    expect(sparse.availableMax).toBe(14);
    // سلوك 2 + مواظبة 3 + مشاركة 8 = 13 من 14 متاحاً.
    expect(sparse.total).toBe(18.57);
  });

  it('never exceeds 20 for any combination', () => {
    const perfect = calculateEvaluationBreakdown(
      {
        sessionsCount: 40,
        documentedSessions: 4,
        goodPart: 40,
        notebookScores: [6],
        participationJudgement: 4,
      },
      rules,
    );
    expect(perfect.total).toBeLessThanOrEqual(20);
    expect(perfect.total).toBe(20);
  });
});
