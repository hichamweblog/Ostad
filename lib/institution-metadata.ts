/**
 * بيانات المؤسسة الملتقطة من ترويسة ملف Excel.
 *
 * ملفات الرقمنة والممتاز تبدأ بترويسة تحمل اسم الثانوية والولاية والسنة الدراسية،
 * وغالباً تكون مدموجة في خلية واحدة («ثانوية الإمام مالك — الموسم الدراسي: 2026/2027»).
 * هنا تُنظَّف هذه القيم قبل عرضها أو كتابتها في الإعدادات، حتى لا يجد الأستاذ في
 * حقل «المؤسسة» جملة كاملة.
 *
 * الاستيراد لا يمسّ التلاميذ أو الأقسام: القسم وأسماء التلاميذ وحدهم يدخلون القوائم،
 * أما ترويسة الملف فتحدّث حقول الإعدادات الثلاثة فقط (المؤسسة، الولاية، السنة).
 */

export interface InstitutionMetadata {
  schoolName?: string;
  stateName?: string;
  academicYear?: string;
}

/** الحقول الثلاثة من ملف الأستاذ التي تخصّ المؤسسة. */
export interface InstitutionProfileFields {
  schoolName: string;
  stateName: string;
  academicYear: string;
}

export interface InstitutionMergeResult {
  profile: InstitutionProfileFields;
  /** القيم المكتوبة في الإعدادات (كانت فارغة أو لا تزال على القيمة الافتراضية). */
  applied: InstitutionMetadata;
  /** قيم من الملف لم تُكتب لأن الإعدادات تحمل قيمة أخرى اختارها الأستاذ. */
  kept: InstitutionMetadata;
}

const SCHOOL_WORD = '(?:ثانوية|متوسطة|إكمالية|اكمالية)';
// «ثانوية الإمام مالك — الموسم الدراسي…»: كل ما يأتي بعد عنوان جديد ليس من اسم المؤسسة.
const NEXT_LABEL =
  /\s+(?:السنة|الموسم|مديرية|الأستاذ|الاستاذ|الأستاذة|الاستاذه|المادة|الماده|المؤسسة|المؤسسه|القسم|الفوج|الولاية|الشعبة|المستوى|رقم)\s*.*$/i;

function tidy(value: string): string {
  return value
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[.،,;:|\u2013\u2014-]+$/g, '')
    .trim();
}

/** «ثانوية الإمام مالك — الموسم الدراسي: 2026/2027» ← «ثانوية الإمام مالك» */
export function cleanSchoolName(raw: unknown): string {
  const text = tidy(String(raw ?? ''));
  const match = text.match(new RegExp(`${SCHOOL_WORD}\\s+([^,،|:\\n\\r]{3,80})`, 'i'));
  if (!match) return '';
  const body = tidy(match[1].replace(NEXT_LABEL, ''));
  if (body.length < 3) return '';
  const prefix = tidy(match[0]).split(' ')[0];
  return `${prefix} ${body}`;
}

/** «مديرية التربية لولاية تلمسان» ← «تلمسان» */
export function cleanStateName(raw: unknown): string {
  const text = tidy(String(raw ?? ''));
  const match = text.match(
    /مديرية\s*التربية\s*(?:لولاية)?\s*[:：\-]?\s*([^\s,،|:\n\r]+(?:\s+[^\s,،|:\n\r]+){0,1})/,
  );
  if (!match) return '';
  const body = tidy(match[1].replace(NEXT_LABEL, ''));
  return body.length >= 2 ? body : '';
}

/** «السنة الدراسية : 2025-2026» ← «2025/2026» (وتُرفض السنة غير المتتالية). */
export function cleanAcademicYear(raw: unknown): string {
  const text = tidy(String(raw ?? ''));
  const match = text.match(/(20\d{2})\s*[-/]\s*(20\d{2})/);
  if (!match) return '';
  const start = Math.min(Number(match[1]), Number(match[2]));
  const end = Math.max(Number(match[1]), Number(match[2]));
  if (end !== start + 1) return '';
  return `${start}/${end}`;
}

/** يقبل القيمة الخام من الملف أو القيمة النظيفة أصلاً (توست/معاينة). */
function normalizeSchool(value: unknown): string {
  const raw = tidy(String(value ?? ''));
  if (!raw) return '';
  if (/ثانوية|متوسطة|إكمالية|اكمالية/.test(raw)) return cleanSchoolName(raw);
  return raw.length >= 3 ? raw : '';
}

function normalizeState(value: unknown): string {
  const raw = tidy(String(value ?? ''));
  if (!raw) return '';
  if (/مديرية|التربية/.test(raw)) return cleanStateName(raw);
  return raw.length >= 2 ? raw : '';
}

/** يقرأ الترويسة من أول صفوف كل ورقة؛ أول قيمة مقروءة لكل حقل تفوز. */
export function extractInstitutionMetadata(headRowTexts: string[]): InstitutionMetadata {
  const metadata: InstitutionMetadata = {};
  for (const rowText of headRowTexts) {
    if (!rowText) continue;
    if (!metadata.schoolName) {
      const school = cleanSchoolName(rowText);
      if (school) metadata.schoolName = school;
    }
    if (!metadata.stateName) {
      const state = cleanStateName(rowText);
      if (state) metadata.stateName = state;
    }
    if (!metadata.academicYear) {
      const year = cleanAcademicYear(rowText);
      if (year) metadata.academicYear = year;
    }
  }
  return metadata;
}

function differs(current: string | undefined, next: string | undefined): boolean {
  const value = tidy(String(current ?? ''));
  if (!next || value === next) return false;
  return true;
}

/**
 * يدمج الترويسة في إعدادات الأستاذ.
 *
 * القاعدة: الحقل الفارغ يُملأ من الملف، وكذلك السنة الدراسية إن كانت لا تزال على
 * القيمة الافتراضية للتطبيق. أما قيمة كتبها الأستاذ بنفسه فلا تُستبدل من ملف، بل
 * تُعاد في `kept` ليُخبر بها بدل أن يفقد ما اختاره.
 */
export function mergeInstitutionMetadata(
  profile: InstitutionProfileFields,
  detected: InstitutionMetadata,
  options: { defaultAcademicYear?: string } = {},
): InstitutionMergeResult {
  const applied: InstitutionMetadata = {};
  const kept: InstitutionMetadata = {};

  const school = normalizeSchool(detected.schoolName);
  const state = normalizeState(detected.stateName);
  const year = cleanAcademicYear(detected.academicYear);

  if (school) {
    if (!tidy(profile.schoolName)) applied.schoolName = school;
    else if (differs(profile.schoolName, school)) kept.schoolName = school;
  }
  if (state) {
    if (!tidy(profile.stateName)) applied.stateName = state;
    else if (differs(profile.stateName, state)) kept.stateName = state;
  }
  if (year) {
    const current = tidy(profile.academicYear);
    if (current === year) {
      // Same year already saved: nothing to announce.
    } else if (
      !current ||
      (options.defaultAcademicYear !== undefined && current === tidy(options.defaultAcademicYear))
    ) {
      applied.academicYear = year;
    } else {
      kept.academicYear = year;
    }
  }

  return {
    profile: {
      schoolName: applied.schoolName ?? profile.schoolName,
      stateName: applied.stateName ?? profile.stateName,
      academicYear: applied.academicYear ?? profile.academicYear,
    },
    applied,
    kept,
  };
}

/** جملة عربية قصيرة لما سيُحدَّث في الإعدادات، تُعرض في معاينة الاستيراد. */
export function describeInstitutionMetadata(metadata: InstitutionMetadata): string {
  const parts: string[] = [];
  if (metadata.schoolName) parts.push(`المؤسسة: ${metadata.schoolName}`);
  if (metadata.stateName) parts.push(`الولاية: ${metadata.stateName}`);
  if (metadata.academicYear) parts.push(`السنة: ${metadata.academicYear}`);
  return parts.join(' — ');
}
