import { describe, expect, it } from 'vitest';
import { getUnitProgress } from '@/lib/curriculum-progress';
import type { SessionRecord } from '@/lib/types';

describe('getUnitProgress (§3.3 automatic curriculum progress tracking)', () => {
  const classId = 'class-1';
  const unitId = 'unit-101';

  it('returns NOT_STARTED when no classId is provided', () => {
    const state = { lessonProgress: [], sessions: [], customUnits: [] };
    expect(getUnitProgress(state, null, unitId)).toBe('NOT_STARTED');
  });

  it('returns NOT_STARTED when unit has no sessions or progress recorded', () => {
    const state = { lessonProgress: [], sessions: [], customUnits: [] };
    expect(getUnitProgress(state, classId, unitId, 2)).toBe('NOT_STARTED');
  });

  it('honours explicit manual choice from teacher over automated derivation', () => {
    const state = {
      lessonProgress: [
        {
          id: 'prog-1',
          classId,
          unitId,
          status: 'COMPLETED' as const,
          manual: true,
        },
      ],
      // 0 sessions taught
      sessions: [],
      customUnits: [],
    };
    expect(getUnitProgress(state, classId, unitId, 2)).toBe('COMPLETED');
  });

  it('automatically marks COMPLETED when taught sessions reach the hourly volume', () => {
    const sessions: SessionRecord[] = [
      {
        id: 'ses-1',
        classId,
        unitId,
        date: '2026-10-01',
        startTime: '08:00',
        accomplishments: 'الجزء الأول',
        attendance: {},
      },
      {
        id: 'ses-2',
        classId,
        unitId,
        date: '2026-10-08',
        startTime: '08:00',
        accomplishments: 'الجزء الثاني',
        attendance: {},
      },
    ];
    const state = { lessonProgress: [], sessions, customUnits: [] };
    // 2 sessions for a 2-hour unit
    expect(getUnitProgress(state, classId, unitId, 2)).toBe('COMPLETED');
  });

  it('marks IN_PROGRESS when only 1 session taught for a 2-hour unit', () => {
    const sessions: SessionRecord[] = [
      {
        id: 'ses-1',
        classId,
        unitId,
        date: '2026-10-01',
        startTime: '08:00',
        accomplishments: 'الجزء الأول',
        attendance: {},
      },
    ];
    const state = { lessonProgress: [], sessions, customUnits: [] };
    expect(getUnitProgress(state, classId, unitId, 2)).toBe('IN_PROGRESS');
  });

  it('ignores cancelled sessions when deriving progress', () => {
    const sessions: SessionRecord[] = [
      {
        id: 'ses-1',
        classId,
        unitId,
        date: '2026-10-01',
        startTime: '08:00',
        sessionStatus: 'CANCELLED',
        cancellationReason: 'عطلة',
        attendance: {},
      },
      {
        id: 'ses-2',
        classId,
        unitId,
        date: '2026-10-08',
        startTime: '08:00',
        accomplishments: 'الجزء الأول فقط',
        attendance: {},
      },
    ];
    const state = { lessonProgress: [], sessions, customUnits: [] };
    // Only 1 real session taught, unit needs 2 hours
    expect(getUnitProgress(state, classId, unitId, 2)).toBe('IN_PROGRESS');
  });

  it('scopes sessions strictly to the specified classId', () => {
    const sessions: SessionRecord[] = [
      {
        id: 'ses-1',
        classId: 'other-class',
        unitId,
        date: '2026-10-01',
        startTime: '08:00',
        accomplishments: 'درس في قسم آخر',
        attendance: {},
      },
    ];
    const state = { lessonProgress: [], sessions, customUnits: [] };
    expect(getUnitProgress(state, classId, unitId, 2)).toBe('NOT_STARTED');
  });
});
