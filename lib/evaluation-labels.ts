/**
 * التسميات البيداغوجية الموحّدة لعناصر التقويم المستمر.
 *
 * التسميات المعتمدة في التطبيق هي: السلوك، المواظبة، الكراس وأدوات التعلم،
 * المشاركة الصفية. كانت الواجهة تستخدم «الشغب» و«الكراس» و«الغيابات» كتسميات
 * أساسية، وهي إمّا سلبية الدلالة أو ناقصة. هذا الملف هو المصدر الوحيد للتسميات
 * حتى لا تختلف من شاشة إلى أخرى.
 */

import type { ContinuousEvaluationRules } from './types';

export type EvaluationCriterion = 'behavior' | 'attendance' | 'notebook' | 'participation';

export interface EvaluationCriterionMeta {
  key: EvaluationCriterion;
  /** التسمية الكاملة المعتمدة في التقارير والوثائق الرسمية. */
  label: string;
  /** تسمية مختصرة للشرائح والجداول الضيقة. */
  short: string;
  /** حقل السقف في قواعد التقويم. */
  maxKey: keyof ContinuousEvaluationRules;
  /** شرح من سطر واحد يظهر كتلميح أو تحت الحقل. */
  hint: string;
}

export const EVALUATION_CRITERIA: EvaluationCriterionMeta[] = [
  {
    key: 'behavior',
    label: 'السلوك والانضباط',
    short: 'السلوك',
    maxKey: 'behaviorMax',
    hint: 'خصم 0.5 عن كل مخالفة، من المخالفة الأولى.',
  },
  {
    key: 'attendance',
    label: 'المواظبة والحضور',
    short: 'المواظبة',
    maxKey: 'attendanceMax',
    hint: 'خصم 0.5 عن كل غياب غير مبرر؛ التأخر والغياب المبرر دون خصم.',
  },
  {
    key: 'notebook',
    label: 'الكراس وأدوات التعلم',
    short: 'الكراس',
    maxKey: 'notebookMax',
    hint: 'مراقبة واحدة في الفصل بأربع حالات مباشرة: 6 أو 4 أو 2 أو 0.',
  },
  {
    key: 'participation',
    label: 'المشاركة الصفية',
    short: 'المشاركة',
    maxKey: 'participationMax',
    hint: 'توثيق آلي (4) عند 30% من الحصص الموثّقة + تقدير الأستاذ (4).',
  },
];

const BY_KEY = new Map(EVALUATION_CRITERIA.map((item) => [item.key, item]));

export function criterionMeta(key: EvaluationCriterion): EvaluationCriterionMeta {
  return BY_KEY.get(key) ?? EVALUATION_CRITERIA[0];
}

/** تسمية كاملة: «السلوك والانضباط». */
export function criterionLabel(key: EvaluationCriterion): string {
  return criterionMeta(key).label;
}

/** تسمية مختصرة: «السلوك». */
export function criterionShortLabel(key: EvaluationCriterion): string {
  return criterionMeta(key).short;
}

/** عنوان الحدث المسجّل، بصياغة محايدة بدل «شغب». */
export const EVALUATION_EVENT_LABELS = {
  disruption: 'مخالفة سلوكية',
  unwrittenLesson: 'لم يكتب الدرس',
  poorParticipation: 'مشاركة ضعيفة',
  goodParticipation: 'مشاركة إيجابية',
  absence: 'غياب',
  late: 'تأخر',
  excused: 'غياب مبرر',
} as const;

/** سقف العنصر مع قيمته الافتراضية عند غياب الإعدادات. */
/** الأسقف الافتراضية من القرار الوزاري 3 / 3 / 6 / 8. */
const DEFAULT_MAX: Record<EvaluationCriterion, number> = {
  behavior: 3,
  attendance: 3,
  notebook: 6,
  participation: 8,
};

export function criterionMax(
  rules: ContinuousEvaluationRules | undefined,
  key: EvaluationCriterion,
): number {
  const meta = criterionMeta(key);
  const raw = rules?.[meta.maxKey];
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : DEFAULT_MAX[key];
}
