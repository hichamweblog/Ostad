/**
 * تقدير الأستاذ للمشاركة والنشاط (0–4).
 *
 * التوثيق الآلي (4) مستقل عن هذا التقدير. لذلك تبدأ مراجعة الفصل بالحالة
 * المحايدة «متوسط (2)» لكل تلميذ لم يحفظ له تقدير سابق، ويغيّر الأستاذ حالات
 * التميز أو السلبية فقط. الاقتراح حالة واجهة فقط ولا يُحفظ إلا بعد الضغط على
 * «تطبيق على القسم» ثم عملية الحفظ المعتادة.
 */

export interface ParticipationJudgementLevel {
  /** القيمة كما تُحفظ وتُعرض في القائمة المنسدلة. */
  value: string;
  label: string;
  score: number | null;
  /** شرح من سطر يظهر كتلميح على المستوى. */
  hint: string;
}

export const DEFAULT_PARTICIPATION_JUDGEMENT = 2;

export const JUDGEMENT_LEVELS: ParticipationJudgementLevel[] = [
  { value: '', label: 'بدون تقدير', score: null, hint: 'يُستبعد جزء التقدير من الحساب إلى أن يراجعه الأستاذ.' },
  { value: '4', label: 'مبادر ومتميز (4)', score: 4, hint: 'إنجاز وتفاعل واضحان مع مبادرة وإبداع.' },
  { value: '2', label: 'متوسط (2)', score: 2, hint: 'إنجاز وتفاعل متوسطان؛ وهذا هو الاقتراح الافتراضي.' },
  { value: '0', label: 'سلبي (0)', score: 0, hint: 'لا يظهر إنجاز أو تفاعل أو مبادرة رغم متابعة الأستاذ.' },
];

/** قيم السلّم السابق تُقرأ بما يعادلها في الحالات الثلاث الجديدة. */
const LEGACY_JUDGEMENT_VALUES: Record<string, string> = {
  '1.25': '0',
  '2.5': '2',
  '3.75': '2',
  '5': '4',
};

/** يعيد قيمة الحالة الجديدة، ويحوّل القيم المعروفة من السلّم السابق عند القراءة. */
export function storedJudgementValue(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const asString = String(value);
  if (JUDGEMENT_LEVELS.some(level => level.value === asString)) return asString;
  return LEGACY_JUDGEMENT_VALUES[asString] ?? '';
}

/** تسمية المستوى من قيمته المحفوظة، أو «بدون تقدير» إن لم تطابق. */
export function judgementLabel(value: string | number | null | undefined): string {
  const asString = value === null || value === undefined ? '' : String(value);
  return JUDGEMENT_LEVELS.find(level => level.value === asString)?.label ?? JUDGEMENT_LEVELS[0].label;
}

/**
 * الاقتراح الافتراضي عند فتح المراجعة: متوسط 2/4 لكل من لا تقدير محفوظاً له.
 * لا يعتمد على عدد المشاركات، لأن تلك الأدلة تدخل أصلاً في جزء التوثيق الآلي.
 */
export function suggestParticipationJudgement(): number {
  return DEFAULT_PARTICIPATION_JUDGEMENT;
}
