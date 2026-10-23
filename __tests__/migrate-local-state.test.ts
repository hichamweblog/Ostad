import { describe, expect, it } from 'vitest';
import { getEmptyState } from '@/lib/storage';
import type { ClassRoom, Student, StudentGrade } from '@/lib/types';
import { migrateLocalCoreData } from '@/lib/supabase/migrate-local-state';

/** ترحيل الحالة المحلية القديمة إلى Supabase يجب أن يحترم قيود القرار الجديدة. */

function makeClient() {
  const upserts: Record<string, unknown[]> = {};
  const client = {
    from(table: string) {
      return {
        upsert: async (rows: unknown) => {
          upserts[table] = [...(upserts[table] ?? []), rows];
          return { error: null };
        },
      };
    },
  };
  return { client: client as never, upserts };
}

function stateWithGrade(grade: Partial<StudentGrade>) {
  const state = getEmptyState();
  state.classes = [{ id: 'c1', name: 'قسم', level: '1AS_SCIENCE', stream: '' } as ClassRoom];
  state.students = [{ id: 's1', classId: 'c1', fullName: 'تلميذ', numberInList: 1 } as Student];
  state.grades = [{
    id: 'g1',
    studentId: 's1',
    classId: 'c1',
    trimester: 1,
    continuousEval: 15,
    quiz: 12,
    exam: 14,
    calculatedAverage: 13,
    ...grade,
  } as StudentGrade];
  return state;
}

describe('migrateLocalCoreData — grade bounds', () => {
  it('clamps legacy 5-point component scores to the decree ceilings', async () => {
    const { client, upserts } = makeClient();
    await migrateLocalCoreData(
      client,
      'owner-1',
      stateWithGrade({ behaviorScore: 5, attendanceScore: 4.5, notebookScore: 5, participationScore: 5 }),
    );

    const rows = upserts.grades.flat() as Array<Record<string, unknown>>;
    expect(rows).toHaveLength(1);
    expect(rows[0].behavior_score).toBe(3);
    expect(rows[0].attendance_score).toBe(3);
    expect(rows[0].notebook_score).toBe(5);
    expect(rows[0].participation_score).toBe(5);
  });

  it('keeps unset components null instead of promoting them to the ceiling', async () => {
    const { client, upserts } = makeClient();
    await migrateLocalCoreData(
      client,
      'owner-1',
      stateWithGrade({ behaviorScore: null, attendanceScore: undefined, notebookScore: null, participationScore: null }),
    );

    const rows = upserts.grades.flat() as Array<Record<string, unknown>>;
    expect(rows[0].behavior_score).toBeNull();
    expect(rows[0].attendance_score).toBeNull();
    expect(rows[0].notebook_score).toBeNull();
    expect(rows[0].participation_score).toBeNull();
  });

  it('accepts the new maxima unchanged', async () => {
    const { client, upserts } = makeClient();
    await migrateLocalCoreData(
      client,
      'owner-1',
      stateWithGrade({ behaviorScore: 3, attendanceScore: 3, notebookScore: 6, participationScore: 8 }),
    );

    const rows = upserts.grades.flat() as Array<Record<string, unknown>>;
    expect(rows[0].behavior_score).toBe(3);
    expect(rows[0].attendance_score).toBe(3);
    expect(rows[0].notebook_score).toBe(6);
    expect(rows[0].participation_score).toBe(8);
  });
});
