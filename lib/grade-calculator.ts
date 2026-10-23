import { ContinuousEvaluationRules, CouncilStatistics, Student, StudentGrade } from './types';

/**
 * حساب نقطة التقويم المستمر (على 20) وفق أوزان القرار الوزاري:
 * 3 السلوك والانضباط | 3 المواظبة والحضور | 6 الكراس والواجبات | 8 المشاركة والنشاط.
 *
 * كانت النسخة السابقة تعطي كل عنصر 5 نقاط وتنقص مقداراً ثابتاً عن كل واقعة،
 * فكانت النتيجة أن القسم كله يتراوح بين 12 و18 مهما اختلف سلوكه. النموذج الحالي:
 * – المواظبة نسبة من الحصص لا عدداً مطلقاً، حتى لا يُعاقب قسم الساعة الواحدة ضعفاً.
 * – السلوك خصم تصاعدي (الأولى 0.25 ثم 0.5) فلا يهبط السقف من أول مخالفة.
 * – الكراس من جولة تفتيش واحدة على مقياس 0–5 (لا عدّ «لم يكتب»).
 * – المشاركة = توثيق آلي (3) فوق الحصص الموثّقة فقط + تقدير الأستاذ (5).
 * – أي عنصر بلا أدلة كافية يُستبعد ويُعاد توزيع وزنه على الباقي بدل منحه صفراً
 *   أو سقفه كاملاً.
 */
/** جمع مكوّنات التقويم الأربعة مع سقف لكل عنصر حسب وزنه في القرار. */
export function calculateContinuousEvaluation(
  behaviorScore: number | string | null = 3,
  attendanceScore: number | string | null = 3,
  notebookScore: number | string | null = 6,
  participationScore: number | string | null = 8
): number {
  const safeScore = (val: any, fallback: number, max: number) => {
    if (val === null || val === undefined || val === '') return fallback;
    const num = Number(val);
    return isNaN(num) ? fallback : Math.max(0, Math.min(max, num));
  };

  const total =
    safeScore(behaviorScore, 3, 3) +
    safeScore(attendanceScore, 3, 3) +
    safeScore(notebookScore, 6, 6) +
    safeScore(participationScore, 8, 8);
  return Math.round(total * 100) / 100;
}

/** Counts accumulated from the notebook (attendance + behaviour marks) for one student. */
export interface SessionBehaviourStats {
  absent?: number;
  late?: number;
  disruptions?: number;
  unwritten?: number;
  poorPart?: number;
  goodPart?: number;
  /** عدد حصص الفصل غير الملغاة — مقام نسبة المواظبة والمشاركة. */
  sessionsCount?: number;
  /** عدد الحصص التي وُثِّقت فيها مشاركة تلميذ واحد على الأقل. */
  documentedSessions?: number;
  /** درجات جولات الكراس (0–5)؛ جولة واحدة افتراضياً وجولتان كحد أقصى. */
  notebookScores?: number[];
  /** تقدير الأستاذ للمشاركة والنشاط (0–5). */
  participationJudgement?: number | null;
}

export interface ContinuousEvaluationBreakdown {
  /** قيمة العنصر بعد الاستبعاد، أو null إن لم تتوفر أدلته. */
  behavior: number | null;
  attendance: number | null;
  notebook: number | null;
  participation: number | null;
  /** الجزء الآلي من المشاركة (توثيق). */
  participationRecorded: number | null;
  /** الجزء التقديري من المشاركة. */
  participationJudgement: number | null;
  total: number;
  /** مجموع الأسقف المتاحة فعلاً لهذا التلميذ (قد يقل عن 20). */
  availableMax: number;
  /** العناصر المستبعدة لغياب الأدلة. */
  missing: Array<'behavior' | 'attendance' | 'notebook' | 'participation'>;
}

const DEFAULT_MAX = { behavior: 3, attendance: 3, notebook: 6, participation: 8 };
const DEFAULT_JUDGEMENT_MAX = 5;
const DEFAULT_TARGET_RATIO = 0.25;
const MIN_SESSIONS_FOR_RATIO = 5;

function positiveCount(value: number | undefined | null): number {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

function scoreCeiling(value: unknown, fallback: number): number {
  const max = Number(value);
  return Number.isFinite(max) && max > 0 ? max : fallback;
}

function ruleValue(value: unknown, fallback: number): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : fallback;
}

function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}

function clampScore(value: number, max: number): number {
  return roundScore(Math.max(0, Math.min(max, value)));
}

/**
 * الخصم السلوكي التصاعدي: المخالفة الأولى 0.25 ثم 0.5 لكل مخالفة بعدها.
 * ست مخالفات تستهلك 2.75 من 3، أي أن السلوك المتكرر يُفقد العنصر كاملاً عملياً
 * بينما لا يهبط تلميذ عابر من أول زلّة.
 */
function behaviourDeduction(count: number, first: number, repeat: number): number {
  if (count <= 0) return 0;
  return first + repeat * (count - 1);
}

export function calculateEvaluationBreakdown(
  stats: SessionBehaviourStats = {},
  rules?: Partial<ContinuousEvaluationRules> | null,
): ContinuousEvaluationBreakdown {
  const behaviorMax = scoreCeiling(rules?.behaviorMax, DEFAULT_MAX.behavior);
  const attendanceMax = scoreCeiling(rules?.attendanceMax, DEFAULT_MAX.attendance);
  const notebookMax = scoreCeiling(rules?.notebookMax, DEFAULT_MAX.notebook);
  const participationMax = scoreCeiling(rules?.participationMax, DEFAULT_MAX.participation);
  const judgementMax = scoreCeiling(rules?.participationJudgementMax, DEFAULT_JUDGEMENT_MAX);
  const recordedMax = Math.max(
    0,
    Math.min(
      participationMax,
      Number.isFinite(Number(rules?.participationRecordedMax))
        ? Number(rules?.participationRecordedMax)
        : participationMax - judgementMax,
    ),
  );
  const targetRatio = scoreCeiling(rules?.participationTargetRatio, DEFAULT_TARGET_RATIO) || DEFAULT_TARGET_RATIO;

  // 1) السلوك والانضباط — دائماً متاح: عدم التسجيل يعني عدم المخالفة.
  const behavior = clampScore(
    behaviorMax -
      behaviourDeduction(
        positiveCount(stats.disruptions),
        ruleValue(rules?.disruptionDeduction, 0.25),
        ruleValue(rules?.disruptionRepeatDeduction, 0.5),
      ),
    behaviorMax,
  );

  // 2) المواظبة والحضور — نسبة من الحصص، ولا تُحتسب قبل 5 حصص (أدلة كافية).
  const sessionsCount = positiveCount(stats.sessionsCount);
  const attendanceAvailable = sessionsCount >= MIN_SESSIONS_FOR_RATIO;
  const attendance = attendanceAvailable
    ? clampScore(
        attendanceMax *
          Math.pow(
            1 -
              Math.min(
                1,
                (positiveCount(stats.absent) * ruleValue(rules?.unexcusedAbsenceDeduction, 1) +
                  positiveCount(stats.late) * ruleValue(rules?.lateDeduction, 0.5)) /
                  sessionsCount,
              ),
            2,
          ),
        attendanceMax,
      )
    : null;

  // 3) الكراس — متوسط الجولات المطلوبة (جولة واحدة افتراضياً). أي درجة محفوظة
  //    في جولة زائدة عن الإعداد لا تدخل الحساب حتى لا يتغيّر السقف بصمت.
  //    وإن لم تُنفَّذ جولة قط، تُستخدم علامات «لم يكتب» كدليل احتياطي.
  const notebookRounds = Math.min(2, Math.max(1, Math.round(ruleValue(rules?.notebookRounds, 1))));
  const rounds = (stats.notebookScores || []).filter(score => Number.isFinite(score)).slice(0, notebookRounds);
  const hasRounds = rounds.length > 0;
  const fallbackNotebook = hasRounds
    ? null
    : positiveCount(stats.unwritten) > 0
      ? 5 - positiveCount(stats.unwritten) * ruleValue(rules?.unwrittenLessonDeduction, 0.5)
      : null;
  const notebookRaw = hasRounds
    ? rounds.reduce((sum, score) => sum + score, 0) / rounds.length
    : fallbackNotebook;
  const notebook = notebookRaw === null ? null : clampScore((notebookRaw / 5) * notebookMax, notebookMax);

  // 4) المشاركة والنشاط = توثيق آلي + تقدير الأستاذ.
  //    المقام هو الحصص التي وُثِّق فيها شيء فعلاً، فلا يُعاقب تلميذ على ضيق الوقت.
  const documentedSessions = positiveCount(stats.documentedSessions);
  const participationRecorded = documentedSessions > 0
    ? clampScore(
        recordedMax * Math.min(1, positiveCount(stats.goodPart) / documentedSessions / targetRatio),
        recordedMax,
      )
    : null;
  const judgementRaw = stats.participationJudgement;
  const participationJudgement = judgementRaw === null || judgementRaw === undefined || !Number.isFinite(Number(judgementRaw))
    ? null
    : clampScore((Number(judgementRaw) / 5) * judgementMax, judgementMax);
  const participation = participationRecorded === null && participationJudgement === null
    ? null
    : roundScore((participationRecorded ?? 0) + (participationJudgement ?? 0));

  const components: Array<{ key: ContinuousEvaluationBreakdown['missing'][number]; value: number | null; max: number }> = [
    { key: 'behavior', value: behavior, max: behaviorMax },
    { key: 'attendance', value: attendance, max: attendanceMax },
    { key: 'notebook', value: notebook, max: notebookMax },
    {
      key: 'participation',
      value: participation,
      max: (participationRecorded === null ? 0 : recordedMax) + (participationJudgement === null ? 0 : judgementMax),
    },
  ];

  const missing = components.filter(item => item.value === null).map(item => item.key);
  const available = components.filter((item): item is { key: typeof item.key; value: number; max: number } => item.value !== null);
  const availableMax = available.reduce((sum, item) => sum + item.max, 0);
  const earned = available.reduce((sum, item) => sum + item.value, 0);
  const total = availableMax > 0 ? roundScore((earned / availableMax) * 20) : 0;

  return {
    behavior,
    attendance,
    notebook,
    participation,
    participationRecorded,
    participationJudgement,
    total,
    availableMax,
    missing,
  };
}

/**
 * حساب المعدل الفصلي لمادة العلوم الإسلامية وفق الصيغة الوزارية الرسمية:
 * المعدل = [ (التقويم المستمر + الفرض المحروس) + (الاختبار * 2) ] / 4
 */
export function calculateStudentAverage(
  continuousEval: number | null,
  quiz: number | null,
  exam: number | null
): number | null {
  const isValidMark = (mark: number | null): mark is number =>
    mark !== null && Number.isFinite(mark) && mark >= 0 && mark <= 20;

  if (
    (continuousEval !== null && !isValidMark(continuousEval)) ||
    (quiz !== null && !isValidMark(quiz)) ||
    (exam !== null && !isValidMark(exam))
  ) {
    return null;
  }

  // The official average is only meaningful once all required marks exist.
  if (continuousEval === null || quiz === null || exam === null) {
    return null;
  }

  const avg = (continuousEval + quiz + exam * 2) / 4;
  return Math.round(avg * 100) / 100;
}

/**
 * حساب إحصائيات مجلس القسم وفق النموذج الرسمي لوزارة التربية الوطنية الجزائرية
 * الفئات المعتمدة في الوثائق الرسمية:
 * 1. أقل من 8
 * 2. مابين 8 و 10
 * 3. مابين 10 و 12
 * 4. مابين 12 و 14
 * 5. مابين 14 و 16
 * 6. أكبر من 16
 */
export function calculateCouncilStatistics(
  classId: string,
  trimester: 1 | 2 | 3,
  students: Student[],
  grades: StudentGrade[],
  absencesCountMap?: { [studentId: string]: number }
): CouncilStatistics {
  const classStudents = students.filter(s => s.classId === classId);
  const totalStudents = classStudents.length;

  const validGrades: { studentId: string; studentName: string; average: number }[] = [];

  for (const student of classStudents) {
    const studentGrade = grades.find(
      g => g.studentId === student.id && g.trimester === trimester
    );

    if (studentGrade) {
      const avg =
        studentGrade.calculatedAverage ??
        calculateStudentAverage(
          studentGrade.continuousEval,
          studentGrade.quiz,
          studentGrade.exam
        );

      if (avg !== null && !isNaN(avg)) {
        validGrades.push({
          studentId: student.id,
          studentName: student.fullName,
          average: avg
        });
      }
    }
  }

  const evaluatedCount = validGrades.length;

  if (evaluatedCount === 0) {
    return {
      classId,
      trimester,
      totalStudents,
      evaluatedCount: 0,
      averageScore: 0,
      passCount: 0,
      failCount: 0,
      passRate: 0,
      highestScore: 0,
      lowestScore: 0,
      topStudentName: '—',
      lowestStudentName: '—',
      lessThan8: 0,
      between8and10: 0,
      between10and12: 0,
      between12and14: 0,
      between14and16: 0,
      greaterThan16: 0,
      frequentAbsenteesCount: 0,
      needsFollowUpCount: 0
    };
  }

  // فرز الدرجات
  validGrades.sort((a, b) => a.average - b.average);

  let sum = 0;
  let passCount = 0;
  let lessThan8 = 0;
  let between8and10 = 0;
  let between10and12 = 0;
  let between12and14 = 0;
  let between14and16 = 0;
  let greaterThan16 = 0;

  for (const item of validGrades) {
    const val = item.average;
    sum += val;

    if (val >= 10) {
      passCount++;
    }

    if (val < 8) {
      lessThan8++;
    } else if (val < 10) {
      between8and10++;
    } else if (val < 12) {
      between10and12++;
    } else if (val < 14) {
      between12and14++;
    } else if (val < 16) {
      between14and16++;
    } else {
      greaterThan16++;
    }
  }

  const averageScore = Math.round((sum / evaluatedCount) * 100) / 100;
  const passRate = Math.round((passCount / evaluatedCount) * 10000) / 100;

  const lowestScore = validGrades[0].average;
  const lowestStudentName = validGrades[0].studentName;

  const highestScore = validGrades[validGrades.length - 1].average;
  const topStudentName = validGrades[validGrades.length - 1].studentName;

  let frequentAbsenteesCount = 0;
  if (absencesCountMap) {
    for (const student of classStudents) {
      if ((absencesCountMap[student.id] || 0) >= 4) {
        frequentAbsenteesCount++;
      }
    }
  }

  const needsFollowUpCount = lessThan8;

  return {
    classId,
    trimester,
    totalStudents,
    evaluatedCount,
    averageScore,
    passCount,
    failCount: evaluatedCount - passCount,
    passRate,
    highestScore,
    lowestScore,
    topStudentName,
    lowestStudentName,
    lessThan8,
    between8and10,
    between10and12,
    between12and14,
    between14and16,
    greaterThan16,
    frequentAbsenteesCount,
    needsFollowUpCount
  };
}
