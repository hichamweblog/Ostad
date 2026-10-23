import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  cleanAcademicYear,
  cleanSchoolName,
  cleanStateName,
  describeInstitutionMetadata,
  extractInstitutionMetadata,
  mergeInstitutionMetadata,
} from '@/lib/institution-metadata';

/**
 * ترويسة ملف الأستاذ هي المصدر الوحيد لاسم المؤسسة والولاية والسنة، لكنها في الملفات
 * الحقيقية جملة مدموجة. هذه الاختبارات تثبّت التنظيف وقاعدة الدمج: الفارغ يُملأ،
 * وما كتبه الأستاذ بنفسه لا يُستبدل من ملف.
 */

describe('cleaning the workbook header', () => {
  it('cuts the school name at the next label', () => {
    expect(cleanSchoolName('ثانوية الإمام مالك — الموسم الدراسي: 2026/2027')).toBe('ثانوية الإمام مالك');
    expect(cleanSchoolName('ثانوية الإمام مالك مديرية التربية لولاية تلمسان')).toBe('ثانوية الإمام مالك');
    expect(cleanSchoolName('ثانوية الإمام مالك, 2026/2027')).toBe('ثانوية الإمام مالك');
  });

  it('keeps a school name that carries no trailing label', () => {
    expect(cleanSchoolName('ثانوية الإمام مالك')).toBe('ثانوية الإمام مالك');
    expect(cleanSchoolName('متوسطة الأمير عبد القادر')).toBe('متوسطة الأمير عبد القادر');
  });

  it('rejects a header with no readable school', () => {
    expect(cleanSchoolName('قائمة التلاميذ')).toBe('');
    expect(cleanSchoolName('')).toBe('');
  });

  it('reads the wilaya from the directorate line', () => {
    expect(cleanStateName('مديرية التربية لولاية تلمسان')).toBe('تلمسان');
    expect(cleanStateName('مديرية التربية لولاية سيدي بلعباس')).toBe('سيدي بلعباس');
    expect(cleanStateName('مديرية التربية - وهران')).toBe('وهران');
    expect(cleanStateName('قائمة التلاميذ')).toBe('');
  });

  it('normalises the school year and refuses a non-consecutive one', () => {
    expect(cleanAcademicYear('السنة الدراسية : 2025-2026')).toBe('2025/2026');
    expect(cleanAcademicYear('الموسم الدراسي: 2026 / 2027')).toBe('2026/2027');
    expect(cleanAcademicYear('2026-2027')).toBe('2026/2027');
    expect(cleanAcademicYear('2026-2028')).toBe('');
    expect(cleanAcademicYear('قائمة التلاميذ')).toBe('');
  });

  it('takes the first readable value of each field from the title rows', () => {
    const metadata = extractInstitutionMetadata([
      'ثانوية الإمام مالك — الموسم الدراسي: 2026/2027',
      'مديرية التربية لولاية تلمسان',
      'القسم: 2 ع ت 1',
    ]);
    expect(metadata).toEqual({
      schoolName: 'ثانوية الإمام مالك',
      stateName: 'تلمسان',
      academicYear: '2026/2027',
    });
    expect(extractInstitutionMetadata(['القسم: 2 ع ت 1'])).toEqual({});
  });
});

describe('merging the header into the settings', () => {
  const emptyProfile = { schoolName: '', stateName: '', academicYear: '2026/2027' };

  it('fills the empty fields and the untouched default year', () => {
    const result = mergeInstitutionMetadata(
      emptyProfile,
      { schoolName: 'ثانوية الإمام مالك', stateName: 'تلمسان', academicYear: '2025/2026' },
      { defaultAcademicYear: '2026/2027' },
    );

    expect(result.applied).toEqual({
      schoolName: 'ثانوية الإمام مالك',
      stateName: 'تلمسان',
      academicYear: '2025/2026',
    });
    expect(result.kept).toEqual({});
    expect(result.profile).toEqual({
      schoolName: 'ثانوية الإمام مالك',
      stateName: 'تلمسان',
      academicYear: '2025/2026',
    });
  });

  it('never overwrites a value the teacher typed by hand', () => {
    const result = mergeInstitutionMetadata(
      { schoolName: 'ثانوية ابن باديس', stateName: 'وهران', academicYear: '2024/2025' },
      { schoolName: 'ثانوية الإمام مالك', stateName: 'تلمسان', academicYear: '2025/2026' },
      { defaultAcademicYear: '2026/2027' },
    );

    expect(result.applied).toEqual({});
    expect(result.kept).toEqual({
      schoolName: 'ثانوية الإمام مالك',
      stateName: 'تلمسان',
      academicYear: '2025/2026',
    });
    expect(result.profile).toEqual({
      schoolName: 'ثانوية ابن باديس',
      stateName: 'وهران',
      academicYear: '2024/2025',
    });
  });

  it('stays silent when the file agrees with the settings', () => {
    const result = mergeInstitutionMetadata(
      { schoolName: 'ثانوية الإمام مالك', stateName: 'تلمسان', academicYear: '2026/2027' },
      { schoolName: 'ثانوية الإمام مالك', stateName: 'تلمسان', academicYear: '2026/2027' },
      { defaultAcademicYear: '2026/2027' },
    );

    expect(result.applied).toEqual({});
    expect(result.kept).toEqual({});
  });

  it('cleans the header again before writing it to the profile', () => {
    const result = mergeInstitutionMetadata(
      { schoolName: '', stateName: '', academicYear: '2026/2027' },
      { schoolName: 'ثانوية الإمام مالك — الموسم الدراسي: 2025/2026', academicYear: '2025-2026' },
      { defaultAcademicYear: '2026/2027' },
    );
    expect(result.applied.schoolName).toBe('ثانوية الإمام مالك');
    expect(result.applied.academicYear).toBe('2025/2026');
    expect(result.profile.academicYear).toBe('2025/2026');
  });

  it('describes what will change in Arabic', () => {
    expect(describeInstitutionMetadata({ schoolName: 'ثانوية الإمام مالك', academicYear: '2026/2027' })).toBe(
      'المؤسسة: ثانوية الإمام مالك — السنة: 2026/2027',
    );
    expect(describeInstitutionMetadata({})).toBe('');
  });
});

describe('the login screen has no unauthenticated entry', () => {
  it('removes the «المتابعة دون اتصال» bypass entirely', () => {
    const source = readFileSync(join(process.cwd(), 'components', 'AuthGate.tsx'), 'utf8');
    expect(source).not.toContain('المتابعة دون اتصال');
    expect(source).not.toContain('handleContinueOffline');
    expect(source).not.toContain('showOfflineFallback');
    // The spinner still ends on its own instead of hanging forever.
    expect(source).toContain('setLoading(false)');
  });
});
