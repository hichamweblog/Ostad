export interface TeacherProfile {
  name: string; // الاسم الكامل
  title: string; // e.g. "أستاذ التعليم الثانوي للعلوم الإسلامية"
  schoolName: string; // e.g. "ثانوية الشهيد زيغود يوسف"
  stateName: string; // ولاية e.g. "الجزائر وسط" / "وهران" / "سطيف" / "قسنطينة"
  academicYear: string; // e.g. "2026/2027"
  hijriYear?: string; // e.g. "1448 هـ"
  // Detailed Civil & Professional Profile (Sanad Al-Oustadh format)
  firstNameAr?: string;
  lastNameAr?: string;
  firstNameEn?: string;
  lastNameEn?: string;
  email?: string;
  phoneNumber?: string;
  avatarUrl?: string; // رابط أو كود Base64 للصورة الشخصية
  avatarStorageKey?: string;
  firstAppointmentDate?: string; // تاريخ أول تعيين بالقطاع لحساب سنوات الخبرة تلقائياً
  experienceYears?: number;
  birthDate?: string;
  birthPlace?: string;
  familyStatus?: string;
  gender?: 'M' | 'F';
}

/**
 * Professional ranks offered in the profile (Phase 6): the ministry list was reduced to
 * these three choices; older stored titles fall back to the first one.
 */
export const PROFESSIONAL_RANKS = [
  'أستاذ قسم أول',
  'أستاذ قسم ثان',
  'أستاذ مميز',
] as const;

export type ProfessionalRank = (typeof PROFESSIONAL_RANKS)[number];

export type HolidayType = 'national' | 'religious' | 'term' | 'exam';

export interface OfficialHoliday {
  id: string;
  name: string;
  dateStr: string; // e.g. "01 نوفمبر 2026" or "19 مارس 2027"
  type: HolidayType;
  /** First covered day (ISO yyyy-mm-dd). Legacy entries may lack it until edited. */
  startDate?: string;
  /** Last covered day (ISO, inclusive). Omitted = single-day holiday. */
  endDate?: string;
  /** Omitted = all levels; used for third-year-only secondary examinations. */
  levels?: GradeLevel[];
  /** Religious dates remain provisional until officially confirmed. */
  provisional?: boolean;
}

/**
 * أوزان التقويم المستمر كما في القرار الوزاري:
 * السلوك 3 | المواظبة 3 | الكراس 6 | المشاركة والنشاط 8 = 20.
 *
 * «إحضار الأدوات» (3) لا وجود له في العلوم الإسلامية، فدُمج في الكراس ليصبح 6،
 * و«العمل الفردي/الفوجي/المبادرة» (5) اندمجت في المشاركة مع توثيقها (3) فصارت 8.
 */
export interface ContinuousEvaluationRules {
  behaviorMax: number; // 3
  attendanceMax: number; // 3
  notebookMax: number; // 6
  participationMax: number; // 8 = توثيق 3 + تقدير 5
  /** خصم المخالفة السلوكية الأولى. */
  disruptionDeduction: number; // 0.25
  /** خصم كل مخالفة بعد الأولى (تصاعدي حتى السقف). */
  disruptionRepeatDeduction?: number; // 0.5
  /** خصم عدم كتابة الدروس — احتياطي فقط عند غياب جولات الكراس. */
  unwrittenLessonDeduction: number;
  unexcusedAbsenceDeduction: number;
  lateDeduction: number;
  /** نقطة تُضاف لكل مشاركة إيجابية (نموذج قديم، أُبقي للتوافق). */
  participationBonus: number;
  /** خصم اختياري عند تسجيل عدم المشاركة (افتراضياً 0 = دون خصم). */
  lackOfParticipationDeduction?: number;
  /** حصة المشاركة الآلية (من 8). والباقي تقدير الأستاذ. */
  participationRecordedMax?: number; // 3
  /** حصة تقدير الأستاذ (من 8). */
  participationJudgementMax?: number; // 5
  /** النسبة المستهدفة من الحصص الموثّقة للوصول إلى كامل نقطة التوثيق. */
  participationTargetRatio?: number; // 0.25
  /** عدد جولات الكراس في الفصل. */
  notebookRounds?: number; // 2
  maxScore: number; // 20
  showGuidanceAlerts: boolean;
  exemptRuleSecondQuiz: string; // legacy text key, kept for backward compatibility
}

export interface AcademicCalendarSettings {
  termDates: {
    term1Start: string;
    term1End: string;
    term2Start: string;
    term2End: string;
    term3Start: string;
    term3End: string;
  };
  holidays: OfficialHoliday[];
  evaluationRules: ContinuousEvaluationRules;
  timetableSettings: {
    dayStart: string; // "08:00 AM"
    dayEnd: string; // "05:00 PM"
    activeDays: number[]; // [0, 1, 2, 3, 4]
  };
}

export type AppTheme = 'light' | 'dark' | 'sepia';
export type DashboardStyle = 'executive' | 'academic_hub';

export type GradeLevel = '1AS_ARTS' | '1AS_SCIENCE' | '2AS' | '3AS';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface Student {
  id: string;
  classId: string;
  numberInList: number;
  fullName: string;
  regNumber?: string; // رقم التسجيل بالرقمنة
  registrationNumber?: string;
  gender?: 'M' | 'F';
  birthDate?: string;
  notes?: string;
  isRepeater?: boolean; // تلميذ معيد للسنة
  guardianPhone?: string; // هاتف الولي
}

export interface ClassRoom {
  id: string;
  name: string; // e.g. "3 ع ت 1" أو "1 ج م آداب 2"
  level: GradeLevel;
  stream: string; // الشعبة: علوم تجريبية، تقني رياضي، آداب وفلسفة، لغات أجنبية، تسيير واقتصاد، إلخ
  roomNumber?: string;
  color?: string;
}

/** Compact, synchronized fields used by the session editor. */
export interface SessionEditorContract {
  summary: string;
  assignments: string;
}

export interface TimetableSlot {
  id: string;
  classId: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4; // 0=Sunday (الأحد), 1=Monday (الإثنين), 2=Tuesday (الثلاثاء), 3=Wednesday (الأربعاء), 4=Thursday (الخميس)
  startTime: string; // "08:00"
  endTime: string; // "09:00" or "10:00"
  room?: string;
  type?: string;
}

export type LessonStatus = 'NOT_STARTED' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'NEEDS_REMEDIAL';

export interface CurriculumUnit {
  id: string;
  level: GradeLevel;
  sectionNumber: number;
  sectionName: string; // المقطع: المقطع الأول، المقطع الثاني...
  unitNumber: number;
  title: string; // عنوان الوحدة
  domain: string; // الميدان: القرآن الكريم والحديث، العقيدة والفكر، الفقه وأصوله، السيرة والحضارة
  hourlyVolume: number; // الحجم الساعي / الزمن
  targetedCompetence?: string; // الكفاءة المستهدفة
  learningObjective?: string; // الهدف التعلمي (وفق التدرجات ومؤشرات الأداء)
  learningObjectives?: string[]; // الأهداف التعلمية
  targetedResources?: string[]; // الموارد المستهدفة (العناصر المفاهيمية)
  implementationMechanisms?: string[]; // آلية تنفيذ التعلمات
  indicators?: string[]; // مؤشرات الأداء والتقويم
  referenceTexts?: string[]; // السندات والنصوص المؤطرة
  teacherDirectives?: string[]; // توجيهات خاصة بالأستاذ (ليست عناصر مفاهيمية)
  pedagogicalDirectives?: string[]; // توجيهات خاصة بالأستاذ (للتوافق)
  learningSteps?: { stepName: string; content: string }[]; // مراحل الإنجاز والإيضاح والتحليل
  pdfUrl?: string; // رابط أو مسار ملف المذكرة PDF
  pdfFileName?: string;
  pdfBase64?: string;
}

export interface AttachedPdfDocument {
  unitId: string;
  fileName: string;
  fileDataUrl?: string; // Base64 data URL
  fileUrl?: string; // Direct URL
  fileSize?: number;
  uploadedAt: string;
}

export interface ClassLessonProgress {
  id: string;
  classId: string;
  unitId: string;
  status: LessonStatus;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  remedialNotes?: string;
}

export type SessionStatus = 'COMPLETED' | 'CANCELLED';

export interface SessionRecord {
  id: string;
  classId: string;
  unitId?: string;
  customTopic?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "08:00"
  endTime: string; // "09:00"
  room?: string;
  sessionGoals: string; // أهداف الحصة
  accomplishments: string; // ما تم إنجازه
  nextSteps: string; // ما يحتاج معالجة في الحصة القادمة
  /** Compact editor aliases retained alongside the legacy notebook fields. */
  summary?: string;
  assignments?: string;
  teacherNotes: string; // ملاحظات الأستاذ
  notes?: string; // دفتر الملاحظات الموحد
  /** Session part number within the unit (1..5). */
  partNumber?: number;
  /** Whether the session was completed normally or cancelled for a reason. */
  sessionStatus?: SessionStatus;
  /** Reason when sessionStatus === 'CANCELLED' (e.g. الغياب, اجتماع, عطلة...). */
  cancellationReason?: string;
  /**
   * 'orientation' = the first session of the year (تقديم توجيهات عامة + تقديم البرنامج):
   * it is documented in the notebook but attached to no curriculum unit.
   */
  sessionKind?: 'orientation';
  // Legacy notebook fields kept for backward compatibility with older backups.
  memoryWhatWorked?: string; // ماذا نجح؟
  memoryWhatFailed?: string; // ماذا لم ينجح؟
  memoryDifficulty?: string; // ما الصعوبة؟
  memoryNextTimeChange?: string; // ما الذي يجب تغييره للمرة القادمة؟
  attendance: { [studentId: string]: AttendanceStatus };
  type?: string;
  // Behavior & Evaluation Tracking per Session
  disruptions?: string[]; // Array of studentIds with a recorded behaviour incident
  unwrittenLessons?: string[]; // Array of studentIds who didn't write the lesson (بدون كراس)
  poorParticipation?: string[]; // Array of studentIds with poor participation
  goodParticipation?: string[]; // Array of studentIds with exceptional participation
  /** Set when the teacher explicitly finishes documenting the class. */
  completedAt?: string;
  /**
   * جولات تفتيش الكراس: تُسجَّل في الحصة التي جرى فيها التفتيش، والدرجة 0–5.
   * التلميذ يُفتَّش مرة في كل جولة؛ الجولة الواحدة قد تمتد على عدة حصص
   * (8–10 تلاميذ في الحصة) لأن القسم قد يبلغ 40 تلميذاً.
   */
  notebookChecks?: { [studentId: string]: NotebookCheck };
}

/** نتيجة تفتيش الكراس داخل جولة واحدة. */
export interface NotebookCheck {
  round: 1 | 2;
  /** 0 = مهمل، 5 = مكتمل ومنظّم. */
  score: number;
  /** وقت التفتيش (ISO) لحسم التعارض بين الجهازين. */
  at: string;
}

export interface StudentGrade {
  id: string;
  studentId: string;
  classId: string;
  trimester: 1 | 2 | 3;
  continuousEval: number | null; // التقويم المستمر الإجمالي (على 20)
  // عناصر التقويم المستمر الأربعة بأوزان القرار الوزاري 3 / 3 / 6 / 8:
  behaviorScore?: number | null; // السلوك والانضباط (على 3)
  attendanceScore?: number | null; // المواظبة والحضور (على 3)
  notebookScore?: number | null; // الكراس والواجبات (على 6)
  participationScore?: number | null; // تقدير الأستاذ للمشاركة والنشاط (على 5)؛ الجزء الآلي يُحسب من الحصص
  // تفاصيل التقييم وسجل الملاحظات:
  disruptionsCount?: number; // عدد المخالفات السلوكية المسجلة
  unwrittenLessonsCount?: number; // عدد مرات عدم كتابة الدروس
  lackOfParticipationCount?: number; // عدد مرات عدم المشاركة
  quiz: number | null; // الفرض الأول (على 20)
  secondQuiz?: number | null; // legacy field (غير مستعمل في مادة العلوم الإسلامية)
  isSecondQuizExempt?: boolean; // legacy field (غير مستعمل في مادة العلوم الإسلامية)
  exam: number | null; // الاختبار (على 20)
  calculatedAverage?: number | null; // المعدل الفصلي
  estimation?: string; // التقدير الرسمي: ممتاز، جيد جداً، جيد، إلخ
  guidance?: string; // الإرشادات والتوجيهات البيداغوجية
  remarks?: string; // الملاحظة
  followUpNotes?: string; // المتابعة
}

export type GroupRole = 'LEADER' | 'REPORTER' | 'SPOKESPERSON' | 'TIMEKEEPER' | 'MEMBER';

export interface SmartGroupMember {
  student: Student;
  role: GroupRole;
}

export interface SmartGroup {
  id: string;
  name: string;
  color: string;
  members: SmartGroupMember[];
  assignedTask?: string;
}

export interface CouncilStatistics {
  classId: string;
  trimester: 1 | 2 | 3;
  totalStudents: number;
  evaluatedCount: number;
  averageScore: number;
  passCount: number; // >= 10
  failCount: number; // < 10
  passRate: number; // %
  highestScore: number;
  lowestScore: number;
  topStudentName: string;
  lowestStudentName: string;
  // Bands according to official Algerian format:
  lessThan8: number;
  between8and10: number;
  between10and12: number;
  between12and14: number;
  between14and16: number;
  greaterThan16: number;
  // Qualitative
  frequentAbsenteesCount: number;
  needsFollowUpCount: number;
}

export interface LessonPlan {
  id: string;
  unitId?: string;
  title: string;
  level: GradeLevel;
  content?: string;
  domain?: string;
  targetCompetence?: string;
  learningObjectives?: string[];
  problemSituation?: string; // الوضعية المشكلة الانطلاقية
  pedagogicalMeans?: string[]; // الوسائل والسندات
  steps?: {
    stage: string; // مرحلة التمهيد / التحليل / الاستنتاج / التقويم
    timing: string;
    teacherActivity: string;
    studentActivity: string;
    contentSummary: string;
  }[];
  formativeEvaluation?: string; // التقويم التكويني
  remedialPlan?: string; // معالجة التعثر المحتمل
  boardSchema?: string; // مخطط السبورة
  createdAt: string;
  updatedAt?: string;
}
