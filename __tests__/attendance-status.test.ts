import { describe, expect, it } from 'vitest';
import { toggleAbsenceStatus } from '@/lib/attendance-status';

describe('toggleAbsenceStatus', () => {
  it('activates absence from the first press in every previous state', () => {
    expect(toggleAbsenceStatus(undefined)).toBe('ABSENT');
    expect(toggleAbsenceStatus('PRESENT')).toBe('ABSENT');
    expect(toggleAbsenceStatus('LATE')).toBe('ABSENT');
    expect(toggleAbsenceStatus('EXCUSED')).toBe('ABSENT');
  });

  it('returns an absent student to present when the same button is pressed again', () => {
    expect(toggleAbsenceStatus('ABSENT')).toBe('PRESENT');
  });
});
