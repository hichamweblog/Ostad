import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PARTICIPATION_JUDGEMENT,
  JUDGEMENT_LEVELS,
  judgementLabel,
  storedJudgementValue,
  suggestParticipationJudgement,
} from '@/lib/participation-judgement';

describe('JUDGEMENT_LEVELS', () => {
  it('offers three teacher states on four points, plus an unreviewed state', () => {
    expect(JUDGEMENT_LEVELS.map(level => level.value)).toEqual(['', '4', '2', '0']);
    expect(JUDGEMENT_LEVELS.map(level => level.score)).toEqual([null, 4, 2, 0]);
    expect(JUDGEMENT_LEVELS.map(level => level.label)).toEqual([
      'بدون تقدير',
      'مبادر ومتميز (4)',
      'متوسط (2)',
      'سلبي (0)',
    ]);
  });

  it('reads the new stored values and maps the previous known scale', () => {
    expect(storedJudgementValue(null)).toBe('');
    expect(storedJudgementValue(undefined)).toBe('');
    expect(storedJudgementValue(4)).toBe('4');
    expect(storedJudgementValue(2)).toBe('2');
    expect(storedJudgementValue(0)).toBe('0');
    expect(storedJudgementValue(5)).toBe('4');
    expect(storedJudgementValue(3.75)).toBe('2');
    expect(storedJudgementValue(2.5)).toBe('2');
    expect(storedJudgementValue(1.25)).toBe('0');
    expect(storedJudgementValue(3.5)).toBe('');
  });

  it('labels a stored value or falls back to «بدون تقدير»', () => {
    expect(judgementLabel('2')).toBe('متوسط (2)');
    expect(judgementLabel(4)).toBe('مبادر ومتميز (4)');
    expect(judgementLabel('')).toBe('بدون تقدير');
    expect(judgementLabel(3.5)).toBe('بدون تقدير');
  });
});

describe('suggestParticipationJudgement', () => {
  it('always proposes the neutral medium state without saving anything by itself', () => {
    expect(DEFAULT_PARTICIPATION_JUDGEMENT).toBe(2);
    expect(suggestParticipationJudgement()).toBe(2);
  });
});
