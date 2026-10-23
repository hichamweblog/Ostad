/**
 * حالة الوحدة في المنهاج.
 *
 * الواجهة تعرض ثلاث حالات فقط: لم يبدأ · قيد الإنجاز · أنجز.
 * كان النوع القديم يسمح بحالتين إضافيتين (PLANNED وNEEDS_REMEDIAL) محفوظتين في
 * السحابة، لذلك تُطبَّع القيمة المقروءة إلى إحدى الحالات الثلاث بدل حذف السجل:
 *   PLANNED        → لم يبدأ   (لم يُنجز بعد)
 *   NEEDS_REMEDIAL → قيد الإنجاز (لم يُغلق)
 */

export type UnitStatusOption = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export const UNIT_STATUS_OPTIONS: { value: UnitStatusOption; label: string }[] = [
  { value: 'NOT_STARTED', label: 'لم يبدأ' },
  { value: 'IN_PROGRESS', label: 'قيد الإنجاز' },
  { value: 'COMPLETED', label: 'أنجز' },
];

export const UNIT_STATUS_LABELS: Record<UnitStatusOption, string> = {
  NOT_STARTED: 'لم يبدأ',
  IN_PROGRESS: 'قيد الإنجاز',
  COMPLETED: 'أنجز',
};

/** يحوّل أي حالة قديمة أو غير صالحة إلى إحدى الحالات الثلاث. */
export function normalizeUnitStatus(status: string | null | undefined): UnitStatusOption {
  switch (status) {
    case 'COMPLETED':
      return 'COMPLETED';
    case 'IN_PROGRESS':
    case 'NEEDS_REMEDIAL':
      return 'IN_PROGRESS';
    case 'NOT_STARTED':
    case 'PLANNED':
    default:
      return 'NOT_STARTED';
  }
}
