import type { AttendanceStatus } from './types';

/**
 * زر الغياب الوحيد في قائمة التسجيل: يفعّل الغياب من الضغطة الأولى،
 * ويعيد التلميذ إلى «حاضر» عند الضغط عليه وهو غائب.
 */
export function toggleAbsenceStatus(
  current: AttendanceStatus | null | undefined,
): AttendanceStatus {
  return current === 'ABSENT' ? 'PRESENT' : 'ABSENT';
}
