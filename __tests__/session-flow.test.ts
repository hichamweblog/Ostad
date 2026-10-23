import { getEmptyState } from '@/lib/storage';
import { describe, expect, it } from 'vitest';
import type { AppState } from '../lib/storage';
import type { SessionRecord, TimetableSlot } from '../lib/types';
import { resolveOrCreateSession } from '../lib/session-flow';

const slot: TimetableSlot = {
  id: 'slot-1',
  classId: 'class-1',
  dayOfWeek: 4,
  startTime: '10:00',
  endTime: '11:00',
};

function stateWithSessions(sessions: SessionRecord[] = []): AppState {
  return {
    activeClassId: null,
    sessions,
  } as AppState;
}

describe('resolveOrCreateSession', () => {
  it('creates a session from the timetable time and activates its class', () => {
    const result = resolveOrCreateSession(
      stateWithSessions(),
      slot,
      '2026-10-01',
      () => 'session-1',
    );

    expect(result.created).toBe(true);
    expect(result.sessionId).toBe('session-1');
    expect(result.state.activeClassId).toBe('class-1');
    expect(result.state.sessions[0]).toMatchObject({
      id: 'session-1',
      classId: 'class-1',
      date: '2026-10-01',
      startTime: '10:00',
      endTime: '11:00',
      attendance: {},
    });
  });

  it('is idempotent for repeated start-session actions', () => {
    const existing: SessionRecord = {
      id: 'existing-session',
      classId: 'class-1',
      date: '2026-10-01',
      startTime: '10:00',
      endTime: '11:00',
      sessionGoals: 'درس قائم',
      accomplishments: '',
      nextSteps: '',
      teacherNotes: '',
      attendance: {},
    };

    const result = resolveOrCreateSession(
      stateWithSessions([existing]),
      slot,
      '2026-10-01',
      () => 'must-not-be-used',
    );

    expect(result.created).toBe(false);
    expect(result.sessionId).toBe('existing-session');
    expect(result.state.sessions).toHaveLength(1);
    expect(result.state.sessions[0].sessionGoals).toBe('درس قائم');
  });

  it('allows the same timetable slot on another date', () => {
    const previous: SessionRecord = {
      id: 'previous-session',
      classId: 'class-1',
      date: '2026-09-24',
      startTime: '10:00',
      endTime: '11:00',
      sessionGoals: '',
      accomplishments: '',
      nextSteps: '',
      teacherNotes: '',
      attendance: {},
    };

    const result = resolveOrCreateSession(
      stateWithSessions([previous]),
      slot,
      '2026-10-01',
      () => 'new-session',
    );

    expect(result.created).toBe(true);
    expect(result.state.sessions.map(session => session.id)).toEqual([
      'new-session',
      'previous-session',
    ]);
  });
});


describe('orientation session without a curriculum unit', () => {
  it('recognises both the new kind and a legacy unlinked orientation title', async () => {
    const { isOrientationSession, ORIENTATION_SESSION_TOPIC, isSessionDocumented } = await import('@/lib/session-flow');
    const empty = getEmptyState();
    const slot = { id: 'slot', classId: 'class', dayOfWeek: 0, startTime: '08:00', endTime: '09:00', room: '' };
    const { state } = resolveOrCreateSession(empty, slot, '2026-09-20', () => 'orientation');
    const session = { ...state.sessions[0], sessionKind: 'orientation' as const, unitId: undefined, customTopic: ORIENTATION_SESSION_TOPIC };
    expect(isOrientationSession(session)).toBe(true);
    expect(isSessionDocumented(session)).toBe(true);
    expect(session.unitId).toBeUndefined();
    expect(state.lessonProgress).toEqual([]);
    expect(isOrientationSession({ customTopic: ORIENTATION_SESSION_TOPIC })).toBe(true);
    expect(isOrientationSession({ unitId: 'unit', customTopic: ORIENTATION_SESSION_TOPIC })).toBe(false);
  });
});

describe('single-session units are not numbered in the notebook', () => {
  it('recognises a one-hour unit only', async () => {
    const { isSingleSessionUnit } = await import('@/lib/session-flow');
    expect(isSingleSessionUnit(1)).toBe(true);
    expect(isSingleSessionUnit(0)).toBe(true);
    expect(isSingleSessionUnit(2)).toBe(false);
    expect(isSingleSessionUnit(3)).toBe(false);
    expect(isSingleSessionUnit(undefined)).toBe(false);
    expect(isSingleSessionUnit(null)).toBe(false);
  });

  it('writes a title without the (1) suffix for a single-session unit', async () => {
    const { buildSessionTitle } = await import('@/lib/session-flow');
    expect(buildSessionTitle('وحدة من حصة واحدة', 1, { cancelled: false }, { singleSession: true }))
      .toBe('وحدة من حصة واحدة');
    expect(buildSessionTitle('وحدة من حصتين', 1, { cancelled: false }))
      .toBe('وحدة من حصتين (1)');
    // A cancelled session still carries its reason and no part number.
    expect(buildSessionTitle('وحدة من حصة واحدة', 1, { cancelled: true, reason: 'الغياب' }, { singleSession: true }))
      .toBe('حصة ملغاة (الغياب) — وحدة من حصة واحدة');
  });

  it('cleans a legacy (1) suffix already stored in older records', async () => {
    const { stripSingleSessionSuffix } = await import('@/lib/session-flow');
    expect(stripSingleSessionSuffix('وحدة من حصة واحدة (1)')).toBe('وحدة من حصة واحدة');
    expect(stripSingleSessionSuffix('وحدة من حصتين (2)')).toBe('وحدة من حصتين (2)');
    expect(stripSingleSessionSuffix('حصة ملغاة (الغياب) — وحدة')).toBe('حصة ملغاة (الغياب) — وحدة');
  });

  it('reads the part number as 1 when the title carries no suffix', async () => {
    const { readSessionPart } = await import('@/lib/session-flow');
    const session: SessionRecord = {
      id: 's', classId: 'c', date: '2026-10-01', startTime: '08:00', endTime: '09:00',
      sessionGoals: '', accomplishments: '', nextSteps: '', teacherNotes: '',
      attendance: {}, customTopic: 'وحدة من حصة واحدة',
    };
    expect(readSessionPart(session)).toBe(1);
  });
});
