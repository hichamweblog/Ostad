import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import {
  detectRosterLayout,
  extractClassNameFromRows,
  isAdministrativeSheet,
  normalizeArabicText,
  parseDigitizationFile,
} from '@/lib/excel-sync';

/** Builds a real .xlsx buffer from a list of sheets, the same way a teacher's file is shaped. */
function buildWorkbookFile(sheets: { name: string; rows: unknown[][] }[]): File {
  const workbook = XLSX.utils.book_new();
  sheets.forEach(sheet => {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sheet.rows), sheet.name);
  });
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  return new File([buffer], 'قوائم_الأقسام.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

const officialSheet = [
  ['مديرية التربية لولاية تلمسان', '', '', ''],
  ['ثانوية الإمام مالك', '', '', ''],
  ['السنة الدراسية : 2026-2027', '', '', ''],
  ['الفوج التربوي : 2 ع ت 1', '', '', ''],
  ['', '', '', ''],
  ['رقم التعريف', 'اللقب', 'الاسم', 'تاريخ الميلاد'],
  ['123456789', 'بن علي', 'محمد', '2008-03-12'],
  ['123456790', 'زروقي', 'أمينة', '2008-07-01'],
  ['', 'مجموع الذكور والإناث', '2', ''],
];

const messySheet = [
  ['قائمة التلاميذ', '', ''],
  ['', 'الاسم واللقب', 'ملاحظات'],
  ['', '1. قاسمي عبد الرحمن', ''],
  ['', '2. حمدي سارة', ''],
  ['', '', ''],
];

const staffSheet = [
  ['قائمة الأساتذة', '', ''],
  ['الرقم', 'اللقب والاسم', 'المادة'],
  ['1', 'بلقاسمي رشيد', 'علوم إسلامية'],
  ['2', 'مرزوقي فتيحة', 'لغة عربية'],
];

describe('multi-sheet roster import', () => {
  it('reads every worksheet and keeps only sections with student names', async () => {
    const file = buildWorkbookFile([
      { name: '2 ع ت 1', rows: officialSheet },
      { name: 'قائمة الأساتذة', rows: staffSheet },
      { name: 'Feuil3', rows: [] },
      { name: 'قسم 1 ج م آداب 2', rows: messySheet },
    ]);

    const result = await parseDigitizationFile(file);

    expect(result.classes).toHaveLength(2);
    expect(result.totalStudents).toBe(4);

    const official = result.classes.find(c => c.sheetName === '2 ع ت 1');
    expect(official?.className).toBe('2 ع ت 1');
    expect(official?.students.map(s => s.fullName)).toEqual(['بن علي محمد', 'زروقي أمينة']);
    // Administration/grade columns are not imported; only names (and the declared reg number).
    expect(official?.students[0]).not.toHaveProperty('gender');
    expect(official?.students[0].regNumber).toBe('123456789');

    const messy = result.classes.find(c => c.sheetName === 'قسم 1 ج م آداب 2');
    expect(messy?.students.map(s => s.fullName)).toEqual(['قاسمي عبد الرحمن', 'حمدي سارة']);
  });

  it('never imports a staff worksheet', async () => {
    const file = buildWorkbookFile([
      { name: 'الطاقم الإداري', rows: staffSheet },
      { name: '2 ع ت 1', rows: officialSheet },
    ]);

    const result = await parseDigitizationFile(file);

    expect(result.classes).toHaveLength(1);
    expect(result.totalStudents).toBe(2);
    expect(result.classes.flatMap(c => c.students.map(s => s.fullName))).not.toContain('بلقاسمي رشيد');

    const staffSummary = result.sheets.find(s => s.sheetName === 'الطاقم الإداري');
    expect(staffSummary?.status).toBe('SKIPPED_ADMIN');
    expect(staffSummary?.studentCount).toBe(0);
  });

  it('does not mistake a generic sheet title for a class name', async () => {
    const file = buildWorkbookFile([
      {
        name: 'قائمة التلاميذ',
        rows: [
          ['القسم: 3 ع ت 2', ''],
          ['الاسم واللقب', ''],
          ['قاسمي عبد الرحمن', ''],
          ['حمدي سارة', ''],
        ],
      },
      {
        name: 'ورقة1',
        rows: [['الاسم واللقب'], ['زروقي أمينة'], ['بلقاسمي ياسين']],
      },
    ]);

    const result = await parseDigitizationFile(file);
    expect(result.classes[0].className).toBe('3 ع ت 2');
    expect(result.classes[1].className).toBe('قسم 2');
  });

  it('keeps Latin names that merely contain a header word', async () => {
    const file = buildWorkbookFile([
      {
        name: '2AS1',
        rows: [
          ['Nom', 'Prénom'],
          ['Benali', 'Noman'],
          ['Cherif', 'Amel'],
        ],
      },
    ]);

    const result = await parseDigitizationFile(file);
    expect(result.classes[0].students.map(s => s.fullName)).toEqual(['Benali Noman', 'Cherif Amel']);
  });

  it('cleans the section name and the institution header of a merged title row', async () => {
    const file = buildWorkbookFile([
      {
        name: '2 ع ت 1',
        rows: [
          ['ثانوية الإمام مالك', 'الموسم الدراسي: 2026/2027'],
          ['القسم: 2 ع ت 1 مادة العلوم الإسلامية'],
          ['اللقب', 'الاسم'],
          ['بن علي', 'محمد'],
        ],
      },
    ]);

    const result = await parseDigitizationFile(file);
    expect(result.classes[0].className).toBe('2 ع ت 1');
    // The header feeds the settings fields (never the rosters), already cleaned.
    expect(result.schoolName).toBe('ثانوية الإمام مالك');
    expect(result.academicYear).toBe('2026/2027');
    // Students carry names only: no grades, no administration columns.
    expect(result.classes[0].students).toHaveLength(1);
    expect(Object.keys(result.classes[0].students[0]).sort()).toEqual([
      'birthDate',
      'fullName',
      'id',
      'numberInList',
      'regNumber',
      'registrationNumber',
    ]);
  });

  it('skips a staff list even when it has no title row and is written in French', async () => {
    const file = buildWorkbookFile([
      {
        name: 'Liste des professeurs',
        rows: [
          ['Nom', 'Prénom', 'Matière'],
          ['Benali', 'Rachid', 'Maths'],
          ['Cherif', 'Fatiha', 'Français'],
        ],
      },
      { name: '2 ع ت 1', rows: officialSheet },
    ]);

    const result = await parseDigitizationFile(file);

    expect(result.classes).toHaveLength(1);
    expect(result.classes[0].students.map(s => s.fullName)).toEqual(['بن علي محمد', 'زروقي أمينة']);
    expect(result.sheets.find(s => s.sheetName === 'Liste des professeurs')?.status).toBe('SKIPPED_ADMIN');
  });

  it('imports the same roster once when every subject has its own sheet', async () => {
    const subjectSheet = (subject: string) => [
      ['ثانوية الإمام مالك', subject],
      ['القسم: 2 ع ت 1'],
      ['اللقب', 'الاسم'],
      ['بن علي', 'محمد'],
      ['زروقي', 'أمينة'],
      ['حمدي', 'سارة'],
    ];

    const file = buildWorkbookFile([
      { name: 'علوم إسلامية', rows: subjectSheet('علوم إسلامية') },
      { name: 'لغة عربية', rows: subjectSheet('لغة عربية') },
    ]);

    const result = await parseDigitizationFile(file);

    expect(result.classes).toHaveLength(1);
    expect(result.totalStudents).toBe(3);
    expect(result.sheets.map(s => s.status)).toEqual(['IMPORTED', 'SKIPPED_DUPLICATE']);
  });

  it('reads a plain list of names with no header row at all', async () => {
    const file = buildWorkbookFile([
      {
        name: 'القسم 3 ع ت 2',
        rows: [['قاسمي عبد الرحمن'], ['حمدي سارة'], ['زروقي أمينة'], ['بلقاسمي ياسين']],
      },
    ]);

    const result = await parseDigitizationFile(file);

    expect(result.classes).toHaveLength(1);
    expect(result.classes[0].className).toBe('3 ع ت 2');
    expect(result.classes[0].students).toHaveLength(4);
  });

  it('summarises every sheet so the teacher can see what will be imported', async () => {
    const file = buildWorkbookFile([
      { name: '2 ع ت 1', rows: officialSheet },
      { name: 'الطاقم الإداري', rows: staffSheet },
      { name: 'Feuil3', rows: [] },
    ]);

    const result = await parseDigitizationFile(file);

    expect(result.sheets.map(s => s.sheetName)).toEqual(['2 ع ت 1', 'الطاقم الإداري', 'Feuil3']);
    expect(result.sheets.map(s => s.status)).toEqual(['IMPORTED', 'SKIPPED_ADMIN', 'SKIPPED_EMPTY']);
  });
});

describe('roster layout detection', () => {
  it('finds a last-name / first-name pair behind a messy header', () => {
    const layout = detectRosterLayout([
      ['', '', ''],
      ['الرقم', 'اللقب', 'الاسم'],
      ['1', 'بن علي', 'محمد'],
    ]);
    expect(layout).toMatchObject({ lastNameCol: 1, firstNameCol: 2, guessed: false });
  });

  it('accepts one full-name column', () => {
    const layout = detectRosterLayout([['الاسم واللقب'], ['قاسمي عبد الرحمن']]);
    expect(layout).toMatchObject({ fullNameCol: 0, guessed: false });
  });

  it('falls back to the values when the sheet has no header at all', () => {
    const layout = detectRosterLayout([
      ['قاسمي عبد الرحمن', '15'],
      ['حمدي سارة', '12'],
      ['زروقي أمينة', '18'],
    ]);
    expect(layout?.guessed).toBe(true);
    expect(layout?.fullNameCol).toBe(0);
  });

  it('prefers a last-name / first-name pair over a surname column', () => {
    const layout = detectRosterLayout([
      ['01', 'بن علي', 'محمد', 'جيد جدا'],
      ['02', 'زروقي', 'أمينة', 'ممتاز'],
      ['03', 'قاسمي', 'عبد الرحمن', 'حسن'],
    ]);
    expect(layout?.guessed).toBe(true);
    expect(layout).toMatchObject({ lastNameCol: 1, firstNameCol: 2 });
  });

  it('never mistakes an estimation column for names', () => {
    const layout = detectRosterLayout([
      ['جيد جدا', 'جيد', 'ممتاز'],
      ['جيد', 'حسن', 'مقبول'],
      ['ممتاز', 'جيد جدا', 'حسن'],
    ]);
    expect(layout).toBeNull();
  });

  it('returns nothing for a sheet without names', () => {
    expect(detectRosterLayout([['المادة', 'المستوى'], ['علوم إسلامية', '2AS']])).toBeNull();
  });
});

describe('sheet helpers', () => {
  it('folds the spellings of the same word', () => {
    expect(normalizeArabicText('قائمة  الأساتذة')).toBe('قائمه الاساتذه');
  });

  it('recognises an administrative sheet by its title', () => {
    expect(isAdministrativeSheet('Feuil2', 'قائمة الأساتذة والمادة')).toBe(true);
    expect(isAdministrativeSheet('Feuil2', 'الأستاذ: بلقاسمي رشيد')).toBe(false);
    expect(isAdministrativeSheet('2 ع ت 1', 'الفوج التربوي : 2 ع ت 1')).toBe(false);
  });

  it('reads the section name from the title rows', () => {
    expect(extractClassNameFromRows(officialSheet)).toBe('2 ع ت 1');
  });
});
