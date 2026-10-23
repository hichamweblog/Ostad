import type { NotebookCheck, SessionRecord } from './types';

/**
 * جولات تفتيش الكراس.
 *
 * قسم من 40 تلميذاً لا يمكن تفتيشه في حصة واحدة، لذلك الجولة الواحدة تمتد على
 * عدة حصص (8–10 تلاميذ في الحصة). كل تفتيش يُحفظ في الحصة التي جرى فيها، وتُجمع
 * النتائج على مستوى الفصل: لكل تلميذ درجة واحدة لكل جولة (الأحدث تحسم التعارض
 * بين جهازين).
 */

export type NotebookRound = 1 | 2;

export interface StudentNotebookRounds {
  [studentId: string]: Partial<Record<NotebookRound, NotebookCheck>>;
}

/** درجات التفتيش السريع: أربع درجات تكفي وتُبقي الاختيار بضغطة واحدة. */
export const NOTEBOOK_SCORE_CHOICES: { score: number; label: string; hint: string }[] = [
  { score: 5, label: 'مكتمل', hint: 'كل الدروس والواجبات منظّمة' },
  { score: 4, label: 'جيد', hint: 'نقص طفيف في درس أو واجب' },
  { score: 2.5, label: 'ناقص', hint: 'نقص واضح ومتكرر' },
  { score: 0, label: 'مهمل', hint: 'كراس غير موجود أو شبه فارغ' },
];

export function clampNotebookScore(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(5, Math.round(numeric * 10) / 10));
}

/**
 * يجمع آخر تفتيش لكل تلميذ في كل جولة عبر حصص الفصل.
 * الحصص الملغاة لا تُفتَّش أصلاً، وتُستثنى هنا للاحتياط.
 */
export function collectNotebookChecks(sessions: SessionRecord[]): StudentNotebookRounds {
  const result: StudentNotebookRounds = {};
  for (const session of sessions) {
    if (session.sessionStatus === 'CANCELLED') continue;
    for (const [studentId, raw] of Object.entries(session.notebookChecks || {})) {
      if (!raw || (raw.round !== 1 && raw.round !== 2)) continue;
      const check: NotebookCheck = {
        round: raw.round,
        score: clampNotebookScore(raw.score),
        at: typeof raw.at === 'string' && raw.at ? raw.at : '',
      };
      const bucket = (result[studentId] ??= {});
      const existing = bucket[check.round];
      if (!existing || check.at >= existing.at) bucket[check.round] = check;
    }
  }
  return result;
}

/** الجولة المفتوحة: الأولى حتى يُفتَّش كل التلاميذ، ثم الثانية. */
export function nextOpenRound(checks: StudentNotebookRounds, studentIds: string[]): NotebookRound {
  const missingFirst = studentIds.some(id => !checks[id]?.[1]);
  return missingFirst ? 1 : 2;
}

export interface RoundProgress {
  round: NotebookRound;
  inspected: number;
  total: number;
  complete: boolean;
}

export function roundProgress(
  checks: StudentNotebookRounds,
  studentIds: string[],
  round: NotebookRound,
): RoundProgress {
  const inspected = studentIds.filter(id => Boolean(checks[id]?.[round])).length;
  return { round, inspected, total: studentIds.length, complete: studentIds.length > 0 && inspected === studentIds.length };
}

/** درجات الجولات المكتملة لتلميذ واحد، على مقياس 0–5. */
export function notebookScoresFor(checks: StudentNotebookRounds, studentId: string): number[] {
  const bucket = checks[studentId];
  if (!bucket) return [];
  return ([1, 2] as NotebookRound[])
    .map(round => bucket[round]?.score)
    .filter((score): score is number => typeof score === 'number');
}

export interface NotebookCheckUpdate {
  studentId: string;
  score: number;
}

/**
 * يحوّل اختيارات النافذة إلى كائن التفتيش المُراد دمجه في الحصة.
 * التوقيت واحد للدفعة كلها حتى تبقى المقارنة بين الأجهزة حاسمة.
 */
export function buildNotebookChecks(
  updates: NotebookCheckUpdate[],
  round: NotebookRound,
  now: string = new Date().toISOString(),
): { [studentId: string]: NotebookCheck } {
  const checks: { [studentId: string]: NotebookCheck } = {};
  for (const update of updates) {
    checks[update.studentId] = {
      round,
      score: clampNotebookScore(update.score),
      at: now,
    };
  }
  return checks;
}
