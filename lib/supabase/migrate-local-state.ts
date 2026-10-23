import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppState } from '@/lib/storage';
import type { Database } from './database.types';
import { getWeeklyHours } from '@/lib/curriculum-data';

const MIGRATION_NAMESPACE = '8d7f1a0a-3d80-4d63-a4eb-8d4ef2bfbb28';

export function stableUuid(value: string): string {
  let hashA = 0x811c9dc5;
  let hashB = 0x9e3779b9;
  for (const character of `${MIGRATION_NAMESPACE}:${value}`) {
    const code = character.codePointAt(0) ?? 0;
    hashA = Math.imul(hashA ^ code, 0x01000193);
    hashB = Math.imul(hashB ^ code, 0x85ebca6b);
  }
  const hex = [
    hashA >>> 0,
    hashB >>> 0,
    Math.imul(hashA, hashB) >>> 0,
    Math.imul(hashA ^ hashB, 0xc2b2ae35) >>> 0,
  ]
    .map((part) => part.toString(16).padStart(8, '0'))
    .join('')
    .padStart(32, '0')
    .slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20)}`;
}

function nullableText(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

/**
 * يحمي الترحيل الأولي من قيم المقياس القديم (0–5 لكل عنصر) التي أصبحت خارج
 * أسقف القرار (3/3/6/8) وأصبحت قيود جدول grades ترفضها.
 */
function nullableScore(value: number | null | undefined, max: number): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(max, value));
}

export interface LocalMigrationSummary {
  classes: number;
  students: number;
  grades: number;
}

export async function migrateLocalCoreData(
  supabase: SupabaseClient<Database>,
  ownerId: string,
  state: AppState,
): Promise<LocalMigrationSummary> {
  const classIdMap = new Map(state.classes.map((item) => [item.id, stableUuid(`class:${ownerId}:${item.id}`)]));
  const studentIdMap = new Map(state.students.map((item) => [item.id, stableUuid(`student:${ownerId}:${item.id}`)]));

  const classRows: Database['public']['Tables']['classes']['Insert'][] = state.classes.map((item) => ({
    id: classIdMap.get(item.id),
    owner_id: ownerId,
    name: item.name.trim(),
    level: item.level,
    section: item.stream,
    weekly_hours: getWeeklyHours(item.level),
    academic_year: state.profile.academicYear || null,
    notes: null,
    room_number: item.roomNumber || null,
    color: item.color || null,
  }));

  const { error: classesError } = await supabase
    .from('classes')
    .upsert(classRows, { onConflict: 'id' });
  if (classesError) throw new Error(`فشل ترحيل الأقسام: ${classesError.message}`);

  const studentRows: Database['public']['Tables']['students']['Insert'][] = state.students
    .filter((item) => classIdMap.has(item.classId))
    .map((item) => ({
      id: studentIdMap.get(item.id),
      owner_id: ownerId,
      class_id: classIdMap.get(item.classId)!,
      external_id: nullableText(item.regNumber ?? item.registrationNumber),
      full_name: item.fullName.trim(),
      number_in_list: item.numberInList,
      reg_number: nullableText(item.regNumber),
      registration_number: nullableText(item.registrationNumber),
      is_repeater: item.isRepeater ?? false,
      guardian_phone: nullableText(item.guardianPhone),
      gender: item.gender === 'M' ? 'male' : item.gender === 'F' ? 'female' : null,
      birth_date: item.birthDate || null,
      notes: nullableText(item.notes),
    }));

  const { error: studentsError } = await supabase
    .from('students')
    .upsert(studentRows, { onConflict: 'id' });
  if (studentsError) throw new Error(`فشل ترحيل التلاميذ: ${studentsError.message}`);

  const gradeRows: Database['public']['Tables']['grades']['Insert'][] = state.grades
    .filter((item) => studentIdMap.has(item.studentId) && classIdMap.has(item.classId))
    .map((item) => ({
      id: stableUuid(`grade:${ownerId}:${item.studentId}:${item.trimester}`),
      owner_id: ownerId,
      student_id: studentIdMap.get(item.studentId)!,
      class_id: classIdMap.get(item.classId)!,
      trimester: item.trimester,
      continuous_eval: item.continuousEval,
      behavior_score: nullableScore(item.behaviorScore, 3),
      attendance_score: nullableScore(item.attendanceScore, 3),
      notebook_score: nullableScore(item.notebookScore, 6),
      participation_score: nullableScore(item.participationScore, 8),
      quiz: item.quiz,
      exam: item.exam,
      calculated_average: item.calculatedAverage ?? null,
      estimation: nullableText(item.estimation),
      guidance: nullableText(item.guidance),
      remarks: nullableText(item.remarks),
      follow_up_notes: nullableText(item.followUpNotes),
    }));

  const { error: gradesError } = await supabase
    .from('grades')
    .upsert(gradeRows, { onConflict: 'id' });
  if (gradesError) throw new Error(`فشل ترحيل الدرجات: ${gradesError.message}`);

  return {
    classes: classRows.length,
    students: studentRows.length,
    grades: gradeRows.length,
  };
}
