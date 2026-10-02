import type { AppState } from './storage';
import type { SessionRecord, TimetableSlot } from './types';
import { v4 as uuidv4 } from 'uuid';

export interface ResolvedSession {
  state: AppState;
  sessionId: string;
  created: boolean;
}

/**
 * Resolves the teaching session represented by a timetable slot.
 *
 * The logical identity is intentionally based on class/date/start time. This
 * mirrors the cloud uniqueness rule and makes repeated taps on "ابدأ الحصة"
 * idempotent, including while the first write is still waiting in the outbox.
 */
export function resolveOrCreateSession(
  state: AppState,
  slot: TimetableSlot,
  date: string,
  createId: () => string = uuidv4,
): ResolvedSession {
  const existing = state.sessions.find(session =>
    session.classId === slot.classId &&
    session.date === date &&
    session.startTime === slot.startTime
  );

  if (existing) {
    return {
      state: state.activeClassId === slot.classId
        ? state
        : { ...state, activeClassId: slot.classId },
      sessionId: existing.id,
      created: false,
    };
  }

  const session: SessionRecord = {
    id: createId(),
    classId: slot.classId,
    date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    room: slot.room,
    sessionGoals: '',
    accomplishments: '',
    nextSteps: '',
    teacherNotes: '',
    attendance: {},
  };

  return {
    state: {
      ...state,
      activeClassId: slot.classId,
      sessions: [session, ...state.sessions],
    },
    sessionId: session.id,
    created: true,
  };
}
