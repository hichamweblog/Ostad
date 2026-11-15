/**
 * اشتقاق حالة وحدة المنهاج لقسم معيّن (§3.3 من خطة التحسين).
 *
 * الحالة تُشتق آلياً من الحصص الموثّقة في دفتر النصوص، وتبقى أسبقية الاختيار
 * اليدوي للأستاذ: أي صف lessonProgress موسوم `manual: true` يفوق الاشتقاق.
 * الحصص الملغاة لا تُحتسب، والصفوف القديمة بلا `manual` تُعامل كاشتقاق آلي
 * مع إبقاء حالة «أنجز» التي كتبها مفتاح الإنجاز في الحصة.
 */

import type { AppState } from './storage';
import type { ClassLessonProgress, SessionRecord } from './types';
import { normalizeUnitStatus, type UnitStatusOption } from './unit-status';
import { getUnitTaughtSessions } from './session-flow';
import { getMergedCurriculumUnits } from './curriculum-data';

/** ما تحتاجه getUnitProgress من الحالة؛ Pick<AppState, …> حتى يمرّرها كل مستهلك. */
export type UnitProgressState = Pick<AppState, 'lessonProgress' | 'sessions' | 'customUnits'>;

/**
 * حالة الوحدة لقسم معيّن: أول تطابق في lessonProgress إن كان يدوياً يفوق،
 * وإلا تُشتق من الحالات المحفوظة ومن عدد الحصص الموثّقة مقابل الحجم الساعي.
 *
 * يُمرَّر `hourlyVolume` من المستهلك الذي يملك الوحدة أصلًا لتجنّب إعادة
 * بناء قائمة المنهاج المدموج عند كل استدعاء؛ عند غيابه تُقرأ من
 * `getMergedCurriculumUnits(state.customUnits)`.
 */
export function getUnitProgress(
  state: UnitProgressState,
  classId: string | undefined | null,
  unitId: string,
  hourlyVolume?: number,
): UnitStatusOption {
  if (!classId) return 'NOT_STARTED';

  const row: ClassLessonProgress | undefined = state.lessonProgress.find(
    progress => progress.classId === classId && progress.unitId === unitId,
  );

  // 1) الاختيار اليدوي الصريح من الأستاذ يفوق كل شيء.
  if (row?.manual) return normalizeUnitStatus(row.status);

  // 2) مفتاح «الوحدة مكتملة» داخل الحصة يكتب COMPLETED ويبقى ساريًا.
  if (row?.status === 'COMPLETED') return 'COMPLETED';

  const taught = getUnitTaughtSessions(state.sessions, classId, unitId);

  // 3) بلوغ الحجم الساعي بالحصص الموثّقة يعني الإنجاز.
  const hours = Number(hourlyVolume ?? resolveHourlyVolume(state, unitId));
  if (Number.isFinite(hours) && hours > 0 && taught.length >= hours) return 'COMPLETED';

  // 4) بداية موثّقة أو حالة قيد الإنجاز المحفوظة.
  if (normalizeUnitStatus(row?.status) === 'IN_PROGRESS' || taught.length > 0) {
    return 'IN_PROGRESS';
  }

  return 'NOT_STARTED';
}

function resolveHourlyVolume(state: UnitProgressState, unitId: string): number | undefined {
  return getMergedCurriculumUnits(state.customUnits ?? []).find(unit => unit.id === unitId)
    ?.hourlyVolume;
}
