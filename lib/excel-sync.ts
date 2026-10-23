import type * as XLSX from 'xlsx';
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import { GradeLevel, Student, StudentGrade } from './types';
import { v4 as uuidv4 } from 'uuid';
import { parseAlgerianClass, getCanonicalClassName, getStudentNameKey } from './name-normalizer';
import { normalizeDateToIso } from './date-utils';

const MAX_EXCEL_FILE_SIZE_BYTES = 15 * 1024 * 1024;
const EXCEL_FILE_EXTENSIONS = new Set(['.xlsx', '.xlsm', '.xlsb', '.xls']);
/**
 * Guard rails for `xlsx`, which has no fix available for its (dev-only-exposed) advisories on
 * npm. The workbook is untrusted input, so the cost of parsing it is bounded here instead:
 * a sheet count cap, a total-rows cap and a wall-clock budget. Anything larger is refused
 * with an explicit message rather than freezing the tab.
 */
const MAX_EXCEL_SHEETS = 60;
const MAX_EXCEL_ROWS_TOTAL = 60_000;
const MAX_EXCEL_PARSE_MS = 20_000;

function assertSheetBudget(sheetCount: number): void {
  if (sheetCount > MAX_EXCEL_SHEETS) {
    throw new Error(`عدد أوراق العمل كبير جداً (${sheetCount}). الحد الأقصى هو ${MAX_EXCEL_SHEETS} ورقة.`);
  }
}

function assertRowBudget(totalRows: number): void {
  if (totalRows > MAX_EXCEL_ROWS_TOTAL) {
    throw new Error(`حجم البيانات في الملف كبير جداً (${totalRows} سطراً). الحد الأقصى هو ${MAX_EXCEL_ROWS_TOTAL} سطراً.`);
  }
}

function assertTimeBudget(startedAt: number): void {
  if (Date.now() - startedAt > MAX_EXCEL_PARSE_MS) {
    throw new Error('استغرق تحليل ملف Excel وقتاً طويلاً وتم إيقافه. جرّب ملفاً أصغر.');
  }
}

function validateExcelFile(file: File): void {
  const fileName = file.name.toLowerCase();
  const extension = fileName.slice(fileName.lastIndexOf('.'));
  if (!EXCEL_FILE_EXTENSIONS.has(extension)) {
    throw new Error('يرجى اختيار ملف Excel بصيغة XLSX أو XLS أو XLSM أو XLSB.');
  }
  if (file.size <= 0 || file.size > MAX_EXCEL_FILE_SIZE_BYTES) {
    throw new Error('حجم ملف Excel غير صالح. الحد الأقصى المسموح هو 15 ميغابايت.');
  }
}

/** Why a worksheet was kept or ignored during a roster import. */
export type ParsedSheetStatus = 'IMPORTED' | 'SKIPPED_ADMIN' | 'SKIPPED_EMPTY' | 'SKIPPED_DUPLICATE';

export interface ParsedSheetSummary {
  sheetName: string;
  className: string;
  studentCount: number;
  status: ParsedSheetStatus;
  reason?: string;
}

export interface ParsedClassData {
  sheetName: string;
  className: string;
  level: GradeLevel;
  stream: string;
  students: Omit<Student, 'classId'>[];
}

export interface ParsedDigitizationResult {
  classes: ParsedClassData[];
  /** One row per worksheet in the workbook, so the teacher can see what was kept and what was ignored. */
  sheets: ParsedSheetSummary[];
  totalStudents: number;
  // The workbook header may name the school, the directorate and the year, but none of that is
  // imported: the request is «القسم وأسماء التلاميذ فقط», and a messy header can be wrong.
}

/**
 * Folds the many spellings used in Algerian school files (hamza forms, taa marbuta, diacritics,
 * tatweel) into one plain form so a keyword test is not defeated by «قائمة» / «قائمه».
 */
export function normalizeArabicText(value: unknown): string {
  return String(value ?? '')
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[\u200c-\u200f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const STAFF_SHEET_WORDS = /(اساتذ|استاذ|طاقم|اداري|إداري|عمال|موظف|مستخدم|مسير|مقتصد|professeur|enseignant|personnel)/;
// «قائمة» alone says nothing: «قائمة الأساتذة» is a staff list, «قائمة التلاميذ» a roster.
const STUDENT_SHEET_WORDS = /(تلاميذ|تلميذ|قسم|فوج|افواج)/;

/**
 * An administrative worksheet (teachers, staff, workers) must never be imported as a class roster.
 * The test is deliberately narrow: a staff word has to appear where a student word does not,
 * either in the sheet name or in the sheet's title rows.
 */
export function isAdministrativeSheet(sheetName: string, headText: string): boolean {
  const name = normalizeArabicText(sheetName);
  if (STAFF_SHEET_WORDS.test(name) && !STUDENT_SHEET_WORDS.test(name)) return true;

  const text = normalizeArabicText(headText);
  const staffTitle =
    /(قائمه|لائحه|جدول|كشف)\s*(ال)?(اساتذ|طاقم|عمال|موظف|مستخدم|اداري|إداري)|الطاقم\s*(ال)?(اداري|إداري|التربوي)|(اساتذ|اطارات)\s*(الماده|المؤسسه)|liste\s*des\s*(professeurs|enseignants)|corps\s*enseignant/;
  const studentText = /(تلاميذ|تلميذ|قائمه\s*(ال)?تلاميذ|افواج|قائمه\s*(ال)?اقسام)/;
  return staffTitle.test(text) && !studentText.test(text);
}

/** Rows that belong to the administration block and must not become students. */
export function isStaffOrAdminRow(value: unknown): boolean {
  const text = normalizeArabicText(value);
  if (!text) return false;
  return /(^|\s)(ال)?(استاذ|استاذه|اساتذ|مدير|مديره|ناظر|مستشار|مقتصد|مسير|موظف|عامل|سائق|حارس|اعوان|اداري)(\s|$|:)/.test(
    text,
  );
}

/** Strips list numbering, leading labels and decoration from a name cell. */
export function cleanStudentName(value: unknown): string {
  return String(value ?? '')
    .replace(/[\u200c-\u200f\u0640]/g, ' ')
    .replace(/^\s*(?:الرقم|رقم|التلميذ|التلميذة|الاسم)\s*[:：-]\s*/, '')
    .replace(/^\s*\d{1,3}\s*[-.)\-:]\s*/, '')
    .replace(/\s*[|•]+\s*/g, ' ')
    .replace(/[.،,;:]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const ARABIC_HEADER_WORDS =
  /(اللقب|الاسم|التعريف|تاريخ|الميلاد|التقويم|الفرض|فروض|الاختبار|التقدير|ملاحظ|الرقم|المستوى|الشعبه|القسم|الفوج|المؤسسه|الاستاذ|الماده|الجنس|العدد|المجموع|رقم)/;
/** Latin words must match as whole words: «Noman» is a first name, «Nom» is a header. */
const LATIN_HEADER_WORDS = /\b(matricule|nom|prenom|prénom|name|birth|naissance)\b/i;

function looksLikeHeaderish(value: unknown): boolean {
  const text = normalizeArabicText(value);
  return ARABIC_HEADER_WORDS.test(text) || LATIN_HEADER_WORDS.test(text);
}

/** كلمات تظهر في أعمدة التقديرات أو الحضور وليست أسماء. */
const NON_NAME_WORDS =
  /^(ممتاز|جيد\s*جدا|جيد|حسن|مقبول|ضعيف|ضعيف\s*جدا|غائب|حاضر|متاخر|متأخر|معيد|نعم|لا|ذكر|انثي|أنثى|ذكور|اناث|إناث|ناجح|راسب|مؤجل|منقطع)$/;

function looksLikePersonName(value: unknown): boolean {
  const text = cleanStudentName(value);
  if (!text || text.length < 5 || text.length > 70) return false;
  if (/\d/.test(text)) return false;
  if (looksLikeHeaderish(text) || isSchoolSummaryOrFooterRow(text)) return false;
  if (NON_NAME_WORDS.test(normalizeArabicText(text))) return false;
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 6) return false;
  const letters = text.replace(/[^\p{L}\s'’-]/gu, '');
  return letters.replace(/\s/g, '').length >= 5;
}

function looksLikeNameWord(value: unknown): boolean {
  const text = cleanStudentName(value);
  if (!text || text.length < 2 || text.length > 30) return false;
  if (/\d/.test(text)) return false;
  if (looksLikeHeaderish(text) || isSchoolSummaryOrFooterRow(text)) return false;
  if (NON_NAME_WORDS.test(normalizeArabicText(text))) return false;
  return /^[\p{L}\s'’.-]+$/u.test(text);
}

interface RosterNameColumns {
  fullNameCol: number;
  lastNameCol: number;
  firstNameCol: number;
  regNumberCol: number;
  birthDateCol: number;
}

export interface RosterLayout {
  headerRowIndex: number;
  dataStartRowIndex: number;
  fullNameCol: number;
  lastNameCol: number;
  firstNameCol: number;
  regNumberCol: number;
  birthDateCol: number;
  /** True when the columns were guessed from the values because the sheet has no usable header. */
  guessed: boolean;
}

const MAX_HEADER_SCAN_ROWS = 30;
const MAX_LAYOUT_COLUMNS = 40;

/**
 * Finds the student-name columns in a messy roster sheet:
 * 1. an explicit header row (`اللقب`/`الاسم`, `الاسم واللقب`, `Nom et prénom`, …), or
 * 2. a value-based guess (one full-name column, or a last-name/first-name pair).
 * Columns such as grades, birth dates or administration notes are ignored on purpose: the
 * importer only ever keeps the section name and the student names.
 */
export function detectRosterLayout(data: any[][]): RosterLayout | null {
  const rows = Array.isArray(data) ? data : [];
  const limit = Math.min(rows.length, MAX_HEADER_SCAN_ROWS);

  for (let r = 0; r < limit; r++) {
    const row = rows[r] || [];
    const cols: RosterNameColumns = {
      fullNameCol: -1,
      lastNameCol: -1,
      firstNameCol: -1,
      regNumberCol: -1,
      birthDateCol: -1,
    };
    let firstNameOnlySeen = false;

    row.forEach((cell, c) => {
      if (c >= MAX_LAYOUT_COLUMNS) return;
      const raw = String(cell ?? '').trim();
      if (!raw) return;

      const isFull = /(الاسم\s*(و|وال|و\s)?\s*اللقب|اللقب\s*(و|وال)?\s*الاسم|اسم\s*(و|وال)?\s*لقب|الاسم\s*الكامل|nom\s*(et|&)?\s*prenom|nom\s*complet)/i.test(
        raw,
      );
      if (isFull) {
        if (cols.fullNameCol === -1) cols.fullNameCol = c;
        return;
      }
      if (/(رقم\s*(التعريف|التسجيل|الترتيب)|matricule|numero|n°)/i.test(raw) && cols.regNumberCol === -1) {
        cols.regNumberCol = c;
        return;
      }
      if (/تاريخ\s*الميلاد|date\s*de\s*naissance|naissance/i.test(raw) && cols.birthDateCol === -1) {
        cols.birthDateCol = c;
        return;
      }
      if (/اللقب|l'?nom\b|^nom$/i.test(raw) && cols.lastNameCol === -1 && !/الاسم/.test(raw)) {
        cols.lastNameCol = c;
        return;
      }
      if (/^(الاسم(\s*الشخصي)?|prénom|prenom|first\s*name)$/i.test(raw) && cols.firstNameCol === -1) {
        cols.firstNameCol = c;
        firstNameOnlySeen = true;
        return;
      }
    });

    const hasFullName = cols.fullNameCol >= 0;
    const hasNamePair = cols.lastNameCol >= 0 && cols.firstNameCol >= 0;

    // A sheet whose only name header is «الاسم» usually holds one full name per row.
    const hasFullNameOnly = !hasFullName && !hasNamePair && firstNameOnlySeen;
    if (!hasFullName && !hasNamePair && !hasFullNameOnly) continue;

    return {
      headerRowIndex: r,
      dataStartRowIndex: r + 1,
      fullNameCol: hasFullName ? cols.fullNameCol : hasFullNameOnly ? cols.firstNameCol : -1,
      lastNameCol: hasFullName || hasFullNameOnly ? -1 : cols.lastNameCol,
      firstNameCol: hasFullName || hasFullNameOnly ? -1 : cols.firstNameCol,
      regNumberCol: cols.regNumberCol,
      birthDateCol: cols.birthDateCol,
      guessed: false,
    };
  }

  // No readable header: guess from the values themselves.
  const scanRows = Math.min(rows.length, 60);
  let bestFullCol = -1;
  let bestFullCount = 0;
  for (let c = 0; c < MAX_LAYOUT_COLUMNS; c++) {
    let count = 0;
    for (let r = 0; r < scanRows; r++) {
      if (looksLikePersonName((rows[r] || [])[c])) count++;
    }
    if (count > bestFullCount) {
      bestFullCount = count;
      bestFullCol = c;
    }
  }
  if (bestFullCol >= 0 && bestFullCount >= 3) {
    // A sheet without any header often lists «اللقب» and «الاسم» in two columns; the
    // surname column can look like a full name, so a single-word neighbour wins.
    for (const pairCol of [bestFullCol - 1, bestFullCol]) {
      if (pairCol < 0) continue;
      let pairHits = 0;
      for (let r = 0; r < scanRows; r++) {
        const row = rows[r] || [];
        if (looksLikeNameWord(row[pairCol]) && looksLikeNameWord(row[pairCol + 1])) pairHits++;
      }
      if (pairHits < 3 || pairHits < bestFullCount * 0.6) continue;
      const singleWordNeighbour = Array.from({ length: scanRows }, (_, r) => String((rows[r] || [])[pairCol + 1] ?? '').trim())
        .filter(Boolean)
        .every(cell => cell.split(/\s+/).length === 1);
      if (!singleWordNeighbour) continue;
      let firstPairRow = 0;
      for (let r = 0; r < scanRows; r++) {
        const row = rows[r] || [];
        if (looksLikeNameWord(row[pairCol]) && looksLikeNameWord(row[pairCol + 1])) {
          firstPairRow = r;
          break;
        }
      }
      return {
        headerRowIndex: firstPairRow - 1,
        dataStartRowIndex: firstPairRow,
        fullNameCol: -1,
        lastNameCol: pairCol,
        firstNameCol: pairCol + 1,
        regNumberCol: -1,
        birthDateCol: -1,
        guessed: true,
      };
    }

    let firstRow = 0;
    for (let r = 0; r < scanRows; r++) {
      if (looksLikePersonName((rows[r] || [])[bestFullCol])) {
        firstRow = r;
        break;
      }
    }
    return {
      headerRowIndex: firstRow - 1,
      dataStartRowIndex: firstRow,
      fullNameCol: bestFullCol,
      lastNameCol: -1,
      firstNameCol: -1,
      regNumberCol: -1,
      birthDateCol: -1,
      guessed: true,
    };
  }

  let bestPair: { col: number; count: number } | null = null;
  for (let c = 0; c + 1 < MAX_LAYOUT_COLUMNS; c++) {
    let count = 0;
    for (let r = 0; r < scanRows; r++) {
      const row = rows[r] || [];
      if (looksLikeNameWord(row[c]) && looksLikeNameWord(row[c + 1])) count++;
    }
    if (count >= 3 && (!bestPair || count > bestPair.count)) {
      bestPair = { col: c, count };
    }
  }
  if (bestPair) {
    let firstRow = 0;
    for (let r = 0; r < scanRows; r++) {
      const row = rows[r] || [];
      if (looksLikeNameWord(row[bestPair.col]) && looksLikeNameWord(row[bestPair.col + 1])) {
        firstRow = r;
        break;
      }
    }
    return {
      headerRowIndex: firstRow - 1,
      dataStartRowIndex: firstRow,
      fullNameCol: -1,
      lastNameCol: bestPair.col,
      firstNameCol: bestPair.col + 1,
      regNumberCol: -1,
      birthDateCol: -1,
      guessed: true,
    };
  }

  return null;
}

/**
 * Drops a leading «القسم»/«الفوج» label and a trailing subject so the code parses as a level.
 * Nothing is dropped when what remains is not a class code («القسم الأول» stays readable).
 */
export function stripSectionLabel(value: string): string {
  const original = String(value ?? '').replace(/\s+/g, ' ').trim();
  const withoutLabel = original
    .replace(/^\s*(?:ال)?(?:فوج|قسم)\s*(?:التربوي|التربويه)?\s*[:：\-]?\s*/i, '')
    .replace(/\s*(?:مادة|المادة|الماده)\s*[:：]?\s*.*$/i, '')
    .replace(/[.،,;:]+$/, '')
    .trim();
  if (!withoutLabel) return original;
  return /[\d\u0660-\u0669]/.test(withoutLabel) ? withoutLabel : original;
}

/** Reads the class/section name written in the sheet title rows (`الفوج التربوي`, `القسم`, …). */
export function extractClassNameFromRows(rows: any[][], limit = 12): string {
  const scan = Math.min(rows.length, limit);
  for (let r = 0; r < scan; r++) {
    const row = rows[r] || [];
    for (const cell of row) {
      const text = String(cell ?? '').trim();
      if (!text) continue;
      const labelled = text.match(
        /(?:الفوج\s*(?:التربوي)?|القسم\s*(?:التربوي)?)\s*[:：]\s*([^\n,،|]{2,40})/i,
      );
      if (!labelled?.[1]) continue;
      const cleaned = labelled[1]
        .replace(/\s+(?:مادة|المادة|الماده|الأستاذ|الاستاذ|المؤسسة|المؤسسه|السنة|الموسم|عدد|التلاميذ)\s*.*$/i, '')
        .replace(/[.،,;:]+$/, '')
        .trim();
      if (cleaned.length >= 2) return cleaned;
    }
  }
  return '';
}


/**
 * Detects GradeLevel and Stream (الشعبة) from class text and sheet code according to the Algerian Educational System.
 */
export function detectLevelAndStream(
  rawText: string,
  sheetName?: string
): { level: GradeLevel; stream: string } {
  const combinedText = `${rawText} ${sheetName || ''}`.trim();
  const parsed = parseAlgerianClass(combinedText);
  
  if (parsed) {
    return { level: parsed.level, stream: parsed.officialStream };
  }

  return { level: '2AS', stream: 'غير مصنف' };
}

/**
 * Detects if a cell or text represents a summary/total/statistical row at the bottom of an Excel sheet
 * such as "مجموع الذكور", "مجموع الإناث", "مجموع الذكور والإناث", "المجموع العام", "العدد الإجمالي", "المعيدون", etc.
 */
export function isSchoolSummaryOrFooterRow(text: unknown, rowCells?: unknown[]): boolean {
  if (!text) return false;
  const raw = String(text).trim();
  if (!raw) return false;

  const compact = raw.replace(/[\s:_ـ\-#\d\.\/\\()]+/g, '');
  const norm = raw.replace(/[\s:_ـ\-#\d\.\/\\()]+/g, ' ').trim();

  // 1. Direct compact keywords found in Algerian school sheets
  const summaryKeywords = [
    'ذكور', 'إناث', 'اناث', 'الذكور', 'الإناث', 'الاناث',
    'مجموع', 'المجموع', 'المجموعالعام', 'المجموعالكلي', 'مجموعالقسم', 'مجموعالتلاميذ',
    'مجموعالذكور', 'مجموعالإناث', 'مجموعالاناث', 'مجموعالذكورو الإناث', 'مجموعالذكوروالإناث',
    'مجموعالذكورو الإناث', 'مجموعالذكوروالاناث',
    'عددالذكور', 'عددالإناث', 'عددالاناث', 'تعدادالذكور', 'تعدادالإناث', 'تعدادالتلاميذ',
    'إجمالي', 'الاجمالي', 'العددالإجمالي', 'العدداإجمالي', 'العدداجمالي',
    'المعيدون', 'المعيدين', 'معيدون', 'معيدين', 'تكرار', 'إحصاء', 'احصاء',
    'توقيعالمدير', 'توقيعالأستاذ', 'المدير', 'الناظر', 'مستشارالتربية', 'ملاحظة', 'ملاحظات'
  ];

  if (summaryKeywords.includes(compact)) return true;

  // 2. Starts with / contains key phrases
  if (/^(?:مجموع|المجموع|عدد|تعداد|إجمالي|اجمالي|إحصاء|احصاء)\s*(?:ال?ذكور|ال?إ?ناث|ال?تلاميذ|ال?قسم|ال?عام|ال?كلي)?/i.test(norm)) {
    return true;
  }

  if (/^(?:ال?ذكور|ال?إ?ناث|ال?معيد(?:ون|ين))(?:\s*[:：\d]|$)/i.test(norm)) {
    return true;
  }

  if (/مجموع\s*(?:ال?ذكور|ال?إ?ناث|القسم|العام|الكلي|التلاميذ)/i.test(raw)) return true;
  if (/(?:عدد|تعداد)\s*(?:ال?ذكور|ال?إ?ناث|التلاميذ)/i.test(raw)) return true;
  if (/توقيع\s*(?:المدير|الأستاذ|الناظر)/i.test(raw)) return true;

  // 3. Check row cells if provided
  if (Array.isArray(rowCells) && rowCells.length > 0) {
    const fullRow = rowCells.map(c => String(c || '').trim()).join(' ');
    if (
      /مجموع\s*(?:ال?ذكور|ال?إ?ناث|القسم|العام)|المجموع\s*العام|تعداد\s*التلاميذ|إحصاء\s*التلاميذ/i.test(fullRow) &&
      /ذكور|إناث|المجموع/i.test(fullRow)
    ) {
      return true;
    }
  }

  return false;
}

export interface SheetColumnIndices {
  /** False when no ministerial / technical header row was found, so the defaults below are only a guess. */
  headerDetected: boolean;
  headerRowIndex: number;
  dataStartRowIndex: number;
  regNumberCol: number;
  lastNameCol: number;
  firstNameCol: number;
  birthDateCol: number;
  continuousCol: number;
  quizCol: number;
  examCol: number;
  estimationCol: number;
  guidanceCol: number;
}

/**
 * Dynamically detects the column layout of a sheet in the official Algerian digitization file.
 * Correctly accounts for sheets starting at Column A or Column B, and reads ministerial code tags.
 */
export function detectSheetColumnIndices(data: any[][]): SheetColumnIndices {
  let headerDetected = false;
  let headerRowIndex = 7;
  let dataStartRowIndex = 8;
  let regNumberCol = -1;
  let lastNameCol = -1;
  let firstNameCol = -1;
  let birthDateCol = -1;
  let continuousCol = -1;
  let quizCol = -1;
  let examCol = -1;
  let estimationCol = -1;
  let guidanceCol = -1;

  for (let r = 0; r < Math.min(data.length, 18); r++) {
    const row = data[r] || [];
    const rowText = row.map(c => String(c || '').trim()).join(' ');

    const isArabicHeader = rowText.includes('اللقب') && (rowText.includes('الاسم') || rowText.includes('التعريف'));
    const isTechHeader = /matricule/i.test(rowText) && /nom/i.test(rowText);

    if (isArabicHeader || isTechHeader) {
      headerDetected = true;
      headerRowIndex = r;
      dataStartRowIndex = r + 1;

      row.forEach((cell, c) => {
        const val = String(cell || '').trim();
        if (/رقم\s*التعريف|matricule|رقم\s*التسجيل|التعريف\s*الوطني/i.test(val)) regNumberCol = c;
        else if (/اللقب|nom/i.test(val)) lastNameCol = c;
        else if (/الاسم|prenom/i.test(val)) firstNameCol = c;
        else if (/تاريخ\s*الميلاد|date_n|الميلاد/i.test(val)) birthDateCol = c;
        else if (/التقويم\s*المستمر|التقويم|^01$/i.test(val)) continuousCol = c;
        else if (/معدل\s*الفروض|الفرض|فروض|^03$/i.test(val)) quizCol = c;
        else if (/الاختبار|امتحان|^09$/i.test(val)) examCol = c;
        else if (/التقديرات|التقدير|^obs$/i.test(val)) estimationCol = c;
        else if (/الإرشادات|الارشادات|توجيهات|^cons$/i.test(val)) guidanceCol = c;
      });

      if (r > 0) {
        const prevRow = data[r - 1] || [];
        prevRow.forEach((cell, c) => {
          const val = String(cell || '').trim();
          if (/matricule/i.test(val) && regNumberCol === -1) regNumberCol = c;
          if (/^01$/.test(val) && continuousCol === -1) continuousCol = c;
          if (/^03$/.test(val) && quizCol === -1) quizCol = c;
          if (/^09$/.test(val) && examCol === -1) examCol = c;
          if (/^obs$/i.test(val) && estimationCol === -1) estimationCol = c;
          if (/^cons$/i.test(val) && guidanceCol === -1) guidanceCol = c;
        });
      }

      if (isTechHeader && r + 1 < data.length) {
        const nextRow = data[r + 1] || [];
        const nextRowText = nextRow.map(c => String(c || '').trim()).join(' ');
        if (nextRowText.includes('اللقب') || nextRowText.includes('الاسم')) {
          headerRowIndex = r + 1;
          dataStartRowIndex = r + 2;
          nextRow.forEach((cell, c) => {
            const val = String(cell || '').trim();
            if (/رقم\s*التعريف/i.test(val)) regNumberCol = c;
            else if (/اللقب/i.test(val)) lastNameCol = c;
            else if (/الاسم/i.test(val)) firstNameCol = c;
            else if (/تاريخ\s*الميلاد/i.test(val)) birthDateCol = c;
            else if (/التقويم/i.test(val)) continuousCol = c;
            else if (/الفرض|فروض/i.test(val)) quizCol = c;
            else if (/الاختبار/i.test(val)) examCol = c;
            else if (/التقديرات/i.test(val)) estimationCol = c;
            else if (/الارشادات/i.test(val)) guidanceCol = c;
          });
        }
      }
      break;
    }
  }

  const baseCol = regNumberCol >= 0 ? regNumberCol : (lastNameCol >= 1 ? lastNameCol - 1 : 0);
  if (regNumberCol === -1) regNumberCol = baseCol;
  if (lastNameCol === -1) lastNameCol = baseCol + 1;
  if (firstNameCol === -1) firstNameCol = baseCol + 2;
  if (birthDateCol === -1) birthDateCol = baseCol + 3;
  if (continuousCol === -1) continuousCol = baseCol + 4;
  if (quizCol === -1) quizCol = baseCol + 5;
  if (examCol === -1) examCol = baseCol + 6;
  if (estimationCol === -1) estimationCol = baseCol + 7;
  if (guidanceCol === -1) guidanceCol = baseCol + 8;

  return {
    headerDetected,
    headerRowIndex,
    dataStartRowIndex,
    regNumberCol,
    lastNameCol,
    firstNameCol,
    birthDateCol,
    continuousCol,
    quizCol,
    examCol,
    estimationCol,
    guidanceCol,
  };
}

/**
 * Parses all sheets of the official Algerian digitisation file to extract ALL classes and student rosters.
 */
export async function parseDigitizationFile(
  file: File
): Promise<ParsedDigitizationResult> {
  const XLSX = await import('xlsx');
  validateExcelFile(file);
  const arrayBuffer = await file.arrayBuffer();

  let workbook;
  try {
    workbook = XLSX.read(arrayBuffer, { type: 'array' });
  } catch (err) {
    throw new Error('عذراً، يبدو أن ملف الإكسل غير صالح أو لا يتطابق مع التنسيق الوزاري المعتمد.');
  }

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('الملف فارغ أو غير صالح (لا توجد أوراق عمل).');
  }
  assertSheetBudget(workbook.SheetNames.length);
  const parseStartedAt = Date.now();
  let totalRowsSeen = 0;

  const parsedClasses: ParsedClassData[] = [];
  const sheetSummaries: ParsedSheetSummary[] = [];

  // Every worksheet is inspected: real files mix rosters, staff lists, empty tabs and summaries.
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    // Convert sheet to matrix of cells
    const data = XLSX.utils.sheet_to_json<any[]>(worksheet, {
      header: 1,
      defval: '',
      blankrows: true,
    });

    if (!data || data.length === 0) {
      sheetSummaries.push({
        sheetName,
        className: '',
        studentCount: 0,
        status: 'SKIPPED_EMPTY',
        reason: 'ورقة فارغة',
      });
      continue;
    }

    totalRowsSeen += data.length;
    assertRowBudget(totalRowsSeen);
    assertTimeBudget(parseStartedAt);

    // The title block only names the institution, the subject or the staff; it is inspected to
    // reject staff lists, never imported (the request is «القسم وأسماء التلاميذ فقط»).
    const headRowTexts = data
      .slice(0, 12)
      .map(row => (row || []).map(cell => String(cell || '').trim()).filter(Boolean).join(' '))
      .filter(Boolean);
    const headText = headRowTexts.join(' | ');

    // Administration sheets (teachers, staff, workers) are reported but never imported.
    if (isAdministrativeSheet(sheetName, headText)) {
      sheetSummaries.push({
        sheetName,
        className: '',
        studentCount: 0,
        status: 'SKIPPED_ADMIN',
        reason: 'قائمة إدارية أو طاقم تربوي — تُستثنى من الاستيراد',
      });
      continue;
    }

    // Layout: explicit header row first, then a value-based guess, then the ministerial template.
    let layout = detectRosterLayout(data);
    if (!layout) {
      const official = detectSheetColumnIndices(data);
      if (official.headerDetected && official.lastNameCol >= 0 && official.firstNameCol >= 0) {
        layout = {
          headerRowIndex: official.headerRowIndex,
          dataStartRowIndex: official.dataStartRowIndex,
          fullNameCol: -1,
          lastNameCol: official.lastNameCol,
          firstNameCol: official.firstNameCol,
          regNumberCol: official.regNumberCol,
          birthDateCol: official.birthDateCol,
          guessed: false,
        };
      }
    }

    if (!layout) {
      sheetSummaries.push({
        sheetName,
        className: '',
        studentCount: 0,
        status: 'SKIPPED_EMPTY',
        reason: 'لم يُعثر على أعمدة أسماء التلاميذ',
      });
      continue;
    }

    // Class/section name: «الفوج التربوي» / «القسم» labels, otherwise the worksheet name.
    let extractedClassName = extractClassNameFromRows(data, 12);
    if (!extractedClassName) {
      const normalizedSheetName = normalizeArabicText(sheetName);
      // «قائمة التلاميذ» أو «ورقة 1» ليست اسم قسم: تُترك للتسمية الافتراضية.
      const genericSheetName =
        /^(sheet|feuil|hoja|ورقه)\s*\d*$/i.test(normalizedSheetName) ||
        /^(قائمه|قايمه|لائحه|كشف|جدول|اسماء|قائمه\s*(ال)?تلاميذ|قائمه\s*(ال)?تلميذ|ورقه\s*(ال)?تلاميذ)$/i.test(
          normalizedSheetName.replace(/\s+/g, ' ').trim(),
        );
      const normalizedNoSpaces = normalizedSheetName.replace(/\s+/g, '');
      const looksGeneric = genericSheetName || /^(قائمه|لائحه|كشف|ورقه)?(ال)?(تلاميذ|تلميذ|اسماء)$/.test(normalizedNoSpaces);
      if (!looksGeneric && normalizedSheetName.length >= 2) {
        extractedClassName = String(sheetName).trim();
      }
    }
    extractedClassName = stripSectionLabel(extractedClassName);
    if (!extractedClassName) {
      extractedClassName = `قسم ${parsedClasses.length + 1}`;
    }

    // Only names are imported: no grades, no administration columns, no gender guesses.
    const students: Omit<Student, 'classId'>[] = [];
    let numberInList = 1;
    let blankStreak = 0;

    for (let i = layout.dataStartRowIndex; i < data.length; i++) {
      // A very long sheet must not freeze the tab: the wall-clock budget is checked
      // while walking the rows, not only once per worksheet.
      if ((i & 511) === 0) assertTimeBudget(parseStartedAt);
      const row = data[i] || [];
      const rawName =
        layout.fullNameCol >= 0
          ? row[layout.fullNameCol]
          : [row[layout.lastNameCol], row[layout.firstNameCol]]
              .map(value => String(value ?? '').trim())
              .filter(Boolean)
              .join(' ');
      const rowText = row.map(cell => String(cell ?? '').trim()).filter(Boolean).join(' ');
      const name = cleanStudentName(rawName);

      // A totals row closes the roster; a note or a signature row is simply skipped.
      if (isSchoolSummaryOrFooterRow(name, row) || isSchoolSummaryOrFooterRow(rowText, row)) {
        if (/(مجموع|المجموع|تعداد|احصاء|إحصاء)/.test(normalizeArabicText(rowText))) break;
        blankStreak += 1;
        if (blankStreak > 3) break;
        continue;
      }

      if (!name) {
        blankStreak += 1;
        if (blankStreak > 12) break;
        continue;
      }
      blankStreak = 0;

      // Administration rows («الأستاذ: …», «المدير») never become students.
      if (isStaffOrAdminRow(name)) continue;

      const isValidName = layout.guessed
        ? looksLikeNameWord(name)
        : /\p{L}/u.test(name) && !looksLikeHeaderish(name);
      if (!isValidName) continue;

      const regRaw = layout.regNumberCol >= 0 ? String(row[layout.regNumberCol] ?? '').trim() : '';
      const regNumber = /^[\d\u0660-\u0669][\d\u0660-\u0669\s/.\-]{2,}$/.test(regRaw) ? regRaw : '';
      const birthDate =
        layout.birthDateCol >= 0 ? normalizeDateToIso(row[layout.birthDateCol]) || undefined : undefined;

      students.push({
        id: uuidv4(),
        numberInList,
        fullName: name,
        regNumber: regNumber || undefined,
        registrationNumber: regNumber || undefined,
        birthDate,
      });
      numberInList += 1;
    }

    if (students.length > 0) {
      // Real workbooks repeat the same roster on one sheet per subject. Importing every copy
      // would create identical classes, so a roster already seen in this file is reported once.
      const sheetKeys = new Set(students.map(student => getStudentNameKey(student.fullName)));
      // Small classes have to match entirely; a big one may lose or gain a pupil between copies.
      const requiredShared = sheetKeys.size >= 4 ? Math.ceil(sheetKeys.size * 0.8) : sheetKeys.size;
      const repeatedRoster = parsedClasses.some(previous => {
        const previousKeys = new Set(previous.students.map(student => getStudentNameKey(student.fullName)));
        let shared = 0;
        sheetKeys.forEach(key => {
          if (previousKeys.has(key)) shared += 1;
        });
        return shared >= requiredShared && previousKeys.size <= sheetKeys.size * 1.5 + 2;
      });
      if (repeatedRoster) {
        sheetSummaries.push({
          sheetName,
          className: getCanonicalClassName(extractedClassName || sheetName),
          studentCount: 0,
          status: 'SKIPPED_DUPLICATE',
          reason: 'نفس قائمة التلاميذ موجودة في ورقة أخرى — استُوردت مرة واحدة',
        });
        continue;
      }

      const className = getCanonicalClassName(extractedClassName || sheetName);
      const { level, stream } = detectLevelAndStream(className, sheetName);
      parsedClasses.push({ sheetName, className, level, stream, students });
      sheetSummaries.push({
        sheetName,
        className,
        studentCount: students.length,
        status: 'IMPORTED',
      });
    } else {
      sheetSummaries.push({
        sheetName,
        className: extractedClassName,
        studentCount: 0,
        status: 'SKIPPED_EMPTY',
        reason: 'لم يُعثر على أسماء تلاميذ',
      });
    }
  }

  if (parsedClasses.length === 0) {
    throw new Error(
      'لم يتم العثور على أي تلاميذ في الملف. تأكد من أن الملف يحتوي على ورقة بها أسماء التلاميذ، وأن أوراق الطاقم الإداري لا تُستورد عمداً.'
    );
  }

  const totalStudents = parsedClasses.reduce(
    (acc, cls) => acc + cls.students.length,
    0
  );

  return {
    classes: parsedClasses,
    sheets: sheetSummaries,
    totalStudents,
  };
}

/**
 * Injects grades directly IN-PLACE into the official digitisation file.
 * Patches only the target worksheet XML files inside the original XLSX package:
 * - Keeps hidden rows (rows 6 & 7) hidden.
 * - Keeps all styling, borders, colors, column widths, row heights, and views intact.
 * - DOES NOT regenerate the workbook or use aoa_to_sheet/XLSX.write.
 * - Matches students by National ID (رقم التعريف) or by normalized full name.
 */
export async function injectGradesIntoFile(
  file: File,
  students: Student[],
  grades: StudentGrade[]
): Promise<{ blob: Blob; matchedStudents: number; gradesWritten: number }> {
  const XLSX = await import('xlsx');
  validateExcelFile(file);
  const arrayBuffer = await file.arrayBuffer();
  const originalZip = unzipSync(new Uint8Array(arrayBuffer));
  let workbook;
  try {
    workbook = XLSX.read(arrayBuffer, {
      type: 'array',
      cellStyles: true,
      cellNF: true,
      cellDates: true,
    });
  } catch (err) {
    throw new Error('عذراً، يبدو أن ملف الإكسل غير صالح أو لا يتطابق مع التنسيق الوزاري المعتمد.');
  }

  const gradeLookupByReg = new Map<string, StudentGrade>();
  const gradeLookupByName = new Map<string, StudentGrade>();
  const matchedStudentIds = new Set<string>();
  let gradesWritten = 0;

  const normalizeRegNumber = (value: unknown): string => {
    const normalized = String(value ?? '')
      .trim()
      .replace(/\.0+$/, '')
      .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
    return normalized.replace(/\s+/g, '');
  };

  students.forEach(student => {
    const grade = grades.find(g => g.studentId === student.id);
    if (grade) {
      const regNumber = normalizeRegNumber(student.regNumber || student.registrationNumber);
      if (regNumber) {
        gradeLookupByReg.set(regNumber, grade);
      }
      if (student.fullName) {
        gradeLookupByName.set(getStudentNameKey(student.fullName), grade);
      }
    }
  });

  const readCellText = (worksheet: XLSX.WorkSheet, r: number, c: number): string => {
    const cell = worksheet[XLSX.utils.encode_cell({ r, c })];
    if (!cell) return '';
    return String(cell.w ?? cell.v ?? '').trim();
  };

  const escapeXml = (value: string): string =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

  const sheetXmlByName = new Map<string, string>();
  const workbookXml = strFromU8(originalZip['xl/workbook.xml']);
  const relationshipsXml = strFromU8(originalZip['xl/_rels/workbook.xml.rels']);
  const relationshipTargets = new Map<string, string>();
  relationshipsXml.replace(/<Relationship\b([^>]*)\/>/g, (_match, attrs: string) => {
    const id = attrs.match(/\bId="([^"]+)"/)?.[1];
    const target = attrs.match(/\bTarget="([^"]+)"/)?.[1];
    if (id && target) relationshipTargets.set(id, `xl/${target.replace(/^\/+/, '')}`);
    return _match;
  });
  workbookXml.replace(/<sheet\b([^>]*)\/>/g, (_match, attrs: string) => {
    const name = attrs.match(/\bname="([^"]+)"/)?.[1];
    const relationshipId = attrs.match(/\br:id="([^"]+)"/)?.[1];
    const target = relationshipId && relationshipTargets.get(relationshipId);
    if (name && target) sheetXmlByName.set(name, target);
    return _match;
  });

  const pendingCellValues = new Map<string, Map<string, number | string>>();
  const setCellValueInPlace = (sheetPath: string, r: number, c: number, val: number | string) => {
    const sheetValues = pendingCellValues.get(sheetPath) || new Map<string, number | string>();
    sheetValues.set(XLSX.utils.encode_cell({ r, c }), val);
    pendingCellValues.set(sheetPath, sheetValues);
  };

  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return;

    const data = XLSX.utils.sheet_to_json<any[]>(worksheet, {
      header: 1,
      defval: '',
      blankrows: true,
    });
    if (!data || data.length === 0) return;

    const cols = detectSheetColumnIndices(data);

    for (let r = cols.dataStartRowIndex; r < data.length; r++) {
      const row = data[r];
      if (!row) continue;

      // Use the displayed cell text for long national IDs; converting a 15-digit
      // Excel number through JavaScript can otherwise lose precision.
      const regNumber = normalizeRegNumber(readCellText(worksheet, r, cols.regNumberCol) || row[cols.regNumberCol]);
      const lastName = readCellText(worksheet, r, cols.lastNameCol) || String(row[cols.lastNameCol] || '').trim();
      const firstName = readCellText(worksheet, r, cols.firstNameCol) || String(row[cols.firstNameCol] || '').trim();
      const fullName = `${lastName} ${firstName}`.trim().replace(/\s+/g, ' ');

      if (!regNumber && !lastName && !firstName) continue;

      if (
        lastName.includes('المجموع') ||
        lastName.includes('توقيع') ||
        regNumber.includes('المجموع')
      ) {
        break;
      }

      const grade =
        (regNumber ? gradeLookupByReg.get(regNumber) : null) ||
        (fullName ? gradeLookupByName.get(getStudentNameKey(fullName)) : null);

      if (grade) {
        matchedStudentIds.add(grade.studentId);
        if (grade.continuousEval !== null && grade.continuousEval !== undefined && cols.continuousCol !== -1) {
          setCellValueInPlace(sheetXmlByName.get(sheetName) || '', r, cols.continuousCol, Number(grade.continuousEval));
          gradesWritten++;
        }
        if (grade.quiz !== null && grade.quiz !== undefined && cols.quizCol !== -1) {
          setCellValueInPlace(sheetXmlByName.get(sheetName) || '', r, cols.quizCol, Number(grade.quiz));
          gradesWritten++;
        }
        if (grade.exam !== null && grade.exam !== undefined && cols.examCol !== -1) {
          setCellValueInPlace(sheetXmlByName.get(sheetName) || '', r, cols.examCol, Number(grade.exam));
          gradesWritten++;
        }
        if (grade.estimation && grade.estimation.trim() !== '' && cols.estimationCol !== -1) {
          setCellValueInPlace(sheetXmlByName.get(sheetName) || '', r, cols.estimationCol, grade.estimation.trim());
          gradesWritten++;
        }
        if (grade.guidance && grade.guidance.trim() !== '' && cols.guidanceCol !== -1) {
          setCellValueInPlace(sheetXmlByName.get(sheetName) || '', r, cols.guidanceCol, grade.guidance.trim());
          gradesWritten++;
        }
      }
    }
  });

  pendingCellValues.forEach((values, sheetPath) => {
    const xml = strFromU8(originalZip[sheetPath]);
    let updatedXml = xml;
    values.forEach((value, cellRef) => {
      const cellPattern = new RegExp(
        `<c\\b(?=[^>]*\\br="${cellRef}")([^>]*)\\/>|<c\\b(?=[^>]*\\br="${cellRef}")([^>]*)>([\\s\\S]*?)<\\/c>`
      );
      updatedXml = updatedXml.replace(cellPattern, (_match, attrsSelfClosing, attrsWithBody) => {
        const attrs = String(attrsSelfClosing || attrsWithBody || '')
          .replace(/\s+t="[^"]*"/g, '');
        if (typeof value === 'number') {
          return `<c${attrs}><v>${String(value)}</v></c>`;
        }
        return `<c${attrs} t="inlineStr"><is><t>${escapeXml(String(value))}</t></is></c>`;
      });
    });
    if ((updatedXml.match(/<row\b/g) || []).length !== (xml.match(/<row\b/g) || []).length) {
      throw new Error('تعذر الحفاظ على جميع صفوف ملف الرقمنة الأصلي؛ أُلغي الحقن ولم يتم إنشاء ملف ناقص.');
    }
    originalZip[sheetPath] = strToU8(updatedXml);
  });

  const outputBuffer = zipSync(originalZip, { level: 0 });

  return {
    blob: new Blob([outputBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    matchedStudents: matchedStudentIds.size,
    gradesWritten
  };
}
