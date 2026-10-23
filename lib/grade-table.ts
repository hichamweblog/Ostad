import { getStudentNameKey } from './name-normalizer';
import { normalizeGradeInput } from './grade-input';

export type GradeField = 'continuousEval' | 'quiz' | 'exam';

export const GRADE_FIELD_ORDER: GradeField[] = ['continuousEval', 'quiz', 'exam'];

export const GRADE_FIELD_LABELS: Record<GradeField, string> = {
  continuousEval: 'التقويم المستمر',
  quiz: 'الفرض المحروس',
  exam: 'الاختبار الفصلي',
};

export interface ParsedGradeRow {
  /** Name exactly as typed/copied, used in the preview and error messages. */
  name: string;
  /** Stable identity key (normalized Arabic) used for matching. */
  key: string;
  /** Only the fields present in the pasted row. */
  values: Partial<Record<GradeField, string>>;
}

export interface ParseGradeTableResult {
  rows: ParsedGradeRow[];
  /** Rows that were ignored, with the reason, so the UI can explain the count. */
  skipped: { line: number; reason: string }[];
  /** A first line that looks like a header ("الاسم / التقويم ...") is dropped. */
  headerSkipped: boolean;
}

const HEADER_HINTS = ['الاسم', 'اسم', 'اللقب', 'التلميذ', 'التقويم', 'الفرض', 'الاختبار', 'النقطة', 'العلامة'];

function looksLikeHeader(cells: string[]): boolean {
  const joined = cells.join(' ');
  return HEADER_HINTS.some(hint => joined.includes(hint)) &&
    !cells.some(cell => /^[0-9٠-٩۰-۹.,٫]+$/.test(cell.trim()));
}

/**
 * Parses a grade table copied from Excel/Calc (tab separated) or typed by hand
 * (semicolon / comma separated).
 *
 * Accepted shapes per row:
 *   - 4+ cells: name, continuousEval, quiz, exam
 *   - 2 cells:  name, value  → the value goes into `fallbackField`
 * Blank lines are ignored; anything else is reported in `skipped`.
 */
export function parseGradeTable(text: string, fallbackField: GradeField = 'continuousEval'): ParseGradeTableResult {
  const rows: ParsedGradeRow[] = [];
  const skipped: { line: number; reason: string }[] = [];
  let headerSkipped = false;

  const lines = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  lines.forEach((line, index) => {
    const separator = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
    const cells = line.split(separator).map(cell => cell.trim());

    if (!headerSkipped && index === 0 && looksLikeHeader(cells)) {
      headerSkipped = true;
      return;
    }

    const name = cells[0]?.replace(/^["']|["']$/g, '').trim() || '';
    const key = getStudentNameKey(name);
    if (!name || !key) {
      skipped.push({ line: index + 1, reason: 'لا يوجد اسم في أول خانة' });
      return;
    }

    const rawValues = cells.slice(1).filter(cell => cell !== '');
    if (rawValues.length === 0) {
      skipped.push({ line: index + 1, reason: 'لا توجد نقاط في السطر' });
      return;
    }

    const values: Partial<Record<GradeField, string>> = {};
    const targets: GradeField[] = rawValues.length >= 3
      ? ['continuousEval', 'quiz', 'exam']
      : [fallbackField];

    let invalid: string | null = null;
    rawValues.slice(0, targets.length).forEach((cell, i) => {
      const field = targets[i];
      if (!field) return;
      const normalized = normalizeGradeInput(cell).replace(/[^\d.]/g, '');
      const numeric = Number(normalized);
      if (normalized === '' || Number.isNaN(numeric) || numeric < 0 || numeric > 20) {
        invalid = cell || '(فارغ)';
        return;
      }
      values[field] = String(numeric);
    });

    if (invalid) {
      skipped.push({ line: index + 1, reason: `نقطة غير صالحة: ${invalid} (المسموح 0 – 20)` });
      return;
    }

    rows.push({ name, key, values });
  });

  return { rows, skipped, headerSkipped };
}

/**
 * Moves focus inside the grades table.
 * - Up/Down and Enter: same column, previous/next student.
 * - Left/Right: next/previous column for the same student (RTL reading order).
 */
export function nextGradeCell(
  field: GradeField,
  direction: 'up' | 'down' | 'left' | 'right',
  fields: GradeField[] = GRADE_FIELD_ORDER,
): { field: GradeField; moveRow: -1 | 0 | 1 } | null {
  const index = fields.indexOf(field);
  if (index === -1) return null;

  if (direction === 'up') return { field, moveRow: -1 };
  if (direction === 'down') return { field, moveRow: 1 };

  const step = direction === 'left' ? 1 : -1;
  const nextIndex = index + step;
  if (nextIndex < 0 || nextIndex >= fields.length) return null;
  return { field: fields[nextIndex], moveRow: 0 };
}
