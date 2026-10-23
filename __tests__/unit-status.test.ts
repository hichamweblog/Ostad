import { describe, expect, it } from 'vitest';
import {
  UNIT_STATUS_LABELS,
  UNIT_STATUS_OPTIONS,
  normalizeUnitStatus,
} from '@/lib/unit-status';

describe('unit status (three states only)', () => {
  it('offers exactly لم يبدأ / قيد الإنجاز / أنجز', () => {
    expect(UNIT_STATUS_OPTIONS.map(option => option.value)).toEqual([
      'NOT_STARTED',
      'IN_PROGRESS',
      'COMPLETED',
    ]);
    expect(UNIT_STATUS_OPTIONS.map(option => option.label)).toEqual([
      'لم يبدأ',
      'قيد الإنجاز',
      'أنجز',
    ]);
    expect(Object.values(UNIT_STATUS_LABELS)).toEqual(['لم يبدأ', 'قيد الإنجاز', 'أنجز']);
  });

  it('folds the legacy cloud values onto a visible state instead of deleting the row', () => {
    expect(normalizeUnitStatus('PLANNED')).toBe('NOT_STARTED');
    expect(normalizeUnitStatus('NEEDS_REMEDIAL')).toBe('IN_PROGRESS');
  });

  it('passes the current states through untouched', () => {
    expect(normalizeUnitStatus('NOT_STARTED')).toBe('NOT_STARTED');
    expect(normalizeUnitStatus('IN_PROGRESS')).toBe('IN_PROGRESS');
    expect(normalizeUnitStatus('COMPLETED')).toBe('COMPLETED');
  });

  it('treats unknown or empty values as not started', () => {
    expect(normalizeUnitStatus(undefined)).toBe('NOT_STARTED');
    expect(normalizeUnitStatus(null)).toBe('NOT_STARTED');
    expect(normalizeUnitStatus('')).toBe('NOT_STARTED');
    expect(normalizeUnitStatus('SOMETHING_ELSE')).toBe('NOT_STARTED');
  });
});
