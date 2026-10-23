import { describe, expect, it } from 'vitest';
import {
  JUDGEMENT_LEVELS,
  judgementLabel,
  storedJudgementValue,
  suggestParticipationJudgement,
} from '@/lib/participation-judgement';

describe('JUDGEMENT_LEVELS', () => {
  it('starts with «بدون تقدير» and covers the five decree levels', () => {
    expect(JUDGEMENT_LEVELS[0].value).toBe('');
    expect(JUDGEMENT_LEVELS.map(level => level.value)).toEqual(['', '0', '1.25', '2.5', '3.75', '5']);
    expect(JUDGEMENT_LEVELS.map(level => level.score)).toEqual([null, 0, 1.25, 2.5, 3.75, 5]);
  });

  it('never reads a legacy auto-computed participation value as a judgement', () => {
    expect(storedJudgementValue(null)).toBe('');
    expect(storedJudgementValue(undefined)).toBe('');
    expect(storedJudgementValue(4)).toBe('');
    expect(storedJudgementValue(3.5)).toBe('');
    expect(storedJudgementValue(3.75)).toBe('3.75');
    expect(storedJudgementValue(0)).toBe('0');
    expect(storedJudgementValue(5)).toBe('5');
  });

  it('labels a stored value or falls back to «بدون تقدير»', () => {
    expect(judgementLabel('2.5')).toBe('متقطع (2.5)');
    expect(judgementLabel('')).toBe('بدون تقدير');
    expect(judgementLabel(4)).toBe('بدون تقدير');
  });
});

describe('suggestParticipationJudgement', () => {
  it('suggests nothing when the class has no documented session', () => {
    expect(suggestParticipationJudgement({ documentedSessions: 0, goodPart: 4 })).toBeNull();
  });

  it('suggests nothing for a student with no participation marks at all', () => {
    expect(suggestParticipationJudgement({ documentedSessions: 10, goodPart: 0, poorPart: 0 })).toBeNull();
  });

  it('maps the share of documented sessions to a level', () => {
    // الهدف 25%: 6/10 ضعفه، و3/10 يبلغه، و2/10 فوق نصفه (12.5%)، و1/10 دونه
    expect(suggestParticipationJudgement({ documentedSessions: 10, goodPart: 6 })).toBe(5);
    expect(suggestParticipationJudgement({ documentedSessions: 10, goodPart: 3 })).toBe(3.75);
    expect(suggestParticipationJudgement({ documentedSessions: 10, goodPart: 2 })).toBe(2.5);
    expect(suggestParticipationJudgement({ documentedSessions: 10, goodPart: 1 })).toBe(1.25);
    expect(suggestParticipationJudgement({ documentedSessions: 25, goodPart: 1 })).toBe(1.25);
  });

  it('marks a student with only weak participation as «منعدم»', () => {
    expect(suggestParticipationJudgement({ documentedSessions: 10, goodPart: 0, poorPart: 2 })).toBe(0);
  });

  it('drops one level when weak participation outweighs the positive one', () => {
    // 2/10 = متقطع (2.5) ثم تهبط درجة لأن الضعيف أكثر
    expect(suggestParticipationJudgement({ documentedSessions: 10, goodPart: 2, poorPart: 3 })).toBe(1.25);
    expect(suggestParticipationJudgement({ documentedSessions: 10, goodPart: 0, poorPart: 5 })).toBe(0);
  });

  it('scales with a teacher-chosen target ratio', () => {
    // هدف 50%: 5/10 يبلغ الهدف، و10/10 ضعفه، و3/10 فوق نصفه
    expect(suggestParticipationJudgement({ documentedSessions: 10, goodPart: 10, targetRatio: 0.5 })).toBe(5);
    expect(suggestParticipationJudgement({ documentedSessions: 10, goodPart: 5, targetRatio: 0.5 })).toBe(3.75);
    expect(suggestParticipationJudgement({ documentedSessions: 10, goodPart: 3, targetRatio: 0.5 })).toBe(2.5);
  });

  it('still allows the top level when the teacher requires full participation', () => {
    expect(suggestParticipationJudgement({ documentedSessions: 10, goodPart: 10, targetRatio: 1 })).toBe(5);
    expect(suggestParticipationJudgement({ documentedSessions: 10, goodPart: 9, targetRatio: 1 })).toBe(3.75);
  });

  it('ignores invalid evidence instead of producing NaN', () => {
    expect(suggestParticipationJudgement({ documentedSessions: Number.NaN, goodPart: 2 })).toBeNull();
    expect(suggestParticipationJudgement({ documentedSessions: 10, goodPart: -3 })).toBeNull();
    expect(suggestParticipationJudgement({ documentedSessions: 10, goodPart: 2, targetRatio: Number.NaN })).toBe(2.5);
  });
});
