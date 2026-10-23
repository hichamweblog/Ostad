/**
 * تقدير المشاركة والنشاط (0–5) وأدوات اقتراحه آلياً.
 *
 * القرار الوزاري يمنح المشاركة والنشاط 8 نقاط: 3 توثيق آلي و5 تقدير أستاذ
 * (عمل فردي وفوجي ومبادرة). التوثيق الآلي لا يرى العمل الفوجي ولا المبادرة،
 * لذلك يبقى التقدير قرار الأستاذ؛ لكن يمكن اقتراح قيمة بداية من أدلة التوثيق
 * نفسها، ثم يعدّلها الأستاذ أو يقبلها.
 *
 * الاقتراح لا يُحفظ من تلقاء نفسه: يظهر في نافذة «مراجعة التقويم» فقط، ولا
 * يُكتب في `StudentGrade.participationScore` إلا بزر «تطبيق على القسم».
 */

export interface ParticipationJudgementLevel {
  /** القيمة كما تُحفظ وتُعرض في القائمة المنسدلة. */
  value: string;
  label: string;
  score: number | null;
  /** شرح من سطر يظهر كتلميح على المستوى. */
  hint: string;
}

export const JUDGEMENT_LEVELS: ParticipationJudgementLevel[] = [
  { value: '', label: 'بدون تقدير', score: null, hint: 'لا يُحتسب تقدير؛ يبقى وزن المشاركة على التوثيق فقط.' },
  { value: '0', label: 'منعدم (0)', score: 0, hint: 'لم يشارك ولم يبادر رغم توثيق الحصص.' },
  { value: '1.25', label: 'نادر (1.25)', score: 1.25, hint: 'مشاركة نادرة.' },
  { value: '2.5', label: 'متقطع (2.5)', score: 2.5, hint: 'مشاركة متقطعة.' },
  { value: '3.75', label: 'منتظم (3.75)', score: 3.75, hint: 'مشاركة منتظمة مع بعض العمل الفوجي.' },
  { value: '5', label: 'مبادر ويقود (5)', score: 5, hint: 'مبادر ويقود العمل الفوجي ويبادر من تلقاء نفسه.' },
];

/**
 * النقاط المحفوظة قبل اعتماد القرار كانت تُحسب آلياً على 5 ولم تكن تقديراً
 * اختاره الأستاذ، فلا يجوز قراءتها كتقدير مشاركة. نقبل فقط القيم التي تُطابق
 * سلّماً من سلالم التقدير المعروضة في النافذة.
 */
export function storedJudgementValue(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const asString = String(value);
  return JUDGEMENT_LEVELS.some(level => level.value === asString) ? asString : '';
}

/** تسمية المستوى من قيمته المحفوظة، أو «بدون تقدير» إن لم تطابق. */
export function judgementLabel(value: string | number | null | undefined): string {
  const asString = value === null || value === undefined ? '' : String(value);
  return JUDGEMENT_LEVELS.find(level => level.value === asString)?.label ?? JUDGEMENT_LEVELS[0].label;
}

export interface ParticipationEvidence {
  /** عدد المشاركات الإيجابية المسجلة للتلميذ. */
  goodPart?: number;
  /** عدد المشاركات الضعيفة المسجلة للتلميذ. */
  poorPart?: number;
  /** عدد الحصص التي وُثِّق فيها شيء فعلاً لهذا القسم. */
  documentedSessions?: number;
  /** نسبة المشاركة المطلوبة من الحصص الموثّقة (افتراضياً 0.25). */
  targetRatio?: number;
}

const LEVEL_SCORES = JUDGEMENT_LEVELS
  .map(level => level.score)
  .filter((score): score is number => score !== null);

function count(value: number | undefined): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}

/**
 * اقتراح تقدير المشاركة من أدلة التوثيق:
 * – بلا حصص موثّقة أو بلا أي تسجيل لهذا التلميذ: لا اقتراح (null).
 * – نسبة المشاركة تُقاس على الحصص الموثّقة، والهدف هو `participationTargetRatio`
 *   بحدّ أقصى 50%: ضعف الهدف ← «مبادر»، الهدف ← «منتظم»، نصف الهدف ←
 *   «متقطع»، أي مشاركة ← «نادر»، وصفرها مع ضعيفة مسجلة ← «منعدم».
 * – إذا غلبت المشاركة الضعيفة الإيجابية ينزل الاقتراح درجة واحدة.
 * الاقتراح نقطة بداية قابلة للتعديل، ولا يُحفظ تلقائياً.
 */
export function suggestParticipationJudgement(evidence: ParticipationEvidence = {}): number | null {
  const documented = count(evidence.documentedSessions);
  const good = count(evidence.goodPart);
  const poor = count(evidence.poorPart);
  if (documented === 0 || (good === 0 && poor === 0)) return null;

  const rawTarget = Number(evidence.targetRatio);
  // الهدف المطلوب قد يصل إلى 100% للتوثيق الآلي، لكن سلّم التقدير يُقيَّس على
  // 50% كحدّ أقصى حتى لا يصبح تلميذ شارك في 90% من الحصص «متقطعاً».
  const target = Number.isFinite(rawTarget) && rawTarget > 0
    ? Math.min(0.5, Math.max(0.05, rawTarget))
    : 0.25;
  const ratio = good / documented;
  const topThreshold = Math.min(1, target * 2);

  let index = ratio >= topThreshold
    ? LEVEL_SCORES.length - 1
    : ratio >= target
      ? LEVEL_SCORES.length - 2
      : ratio >= target / 2
        ? LEVEL_SCORES.length - 3
        : ratio > 0
          ? LEVEL_SCORES.length - 4
          : 0;

  if (poor > good) index = Math.max(0, index - 1);
  return LEVEL_SCORES[index] ?? null;
}
