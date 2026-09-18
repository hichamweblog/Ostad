'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { AppState } from '@/lib/storage';
import { calculateStudentAverage } from '@/lib/grade-calculator';
import { triggerHapticFeedback } from '@/lib/utils';
import { injectGradesIntoFile } from '@/lib/excel-sync';
import { Student, StudentGrade } from '@/lib/types';
import {
  PEDAGOGICAL_TIERS,
  getScoreTier,
  getDefaultEstimation,
  getDefaultGuidance
} from '@/lib/pedagogical-evaluations';
import {
  GraduationCap,
  Save,
  FileSpreadsheet,
  Download,
  Upload,
  Info,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  X,
  Search,
  Sparkles,
  PenLine,
  ListFilter,
  FileDown
} from 'lucide-react';

/**
 * قائمة منسدلة ذكية للتقديرات تشمل كل الاحتمالات الوزارية مصنفة حسب النقطة
 */
const EstimationDropdown: React.FC<{
  studentId: string;
  value: string;
  avg: number | null;
  onChange: (val: string) => void;
}> = ({ studentId, value, avg, onChange }) => {
  const [isCustom, setIsCustom] = useState(false);
  const currentTier = getScoreTier(avg);
  const tierInfo = PEDAGOGICAL_TIERS[currentTier];

  const allKnown = Object.values(PEDAGOGICAL_TIERS).flatMap(t => t.estimations);
  const isCustomValue = Boolean(value && !allKnown.includes(value));

  if (isCustom) {
    return (
      <div className="flex items-center gap-1 w-full" id={`est-custom-${studentId}`}>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="اكتب التقدير مخصصاً..."
          className="w-full text-xs px-2 py-1 rounded-lg border border-gold bg-amber-50/50 font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-gold shadow-2xs"
          autoFocus
        />
        <button
          type="button"
          onClick={() => setIsCustom(false)}
          title="العودة للقائمة المنسدلة"
          className="p-1 text-slate-400 hover:text-amber-700 hover:bg-amber-100 cursor-pointer rounded shrink-0 transition-colors"
        >
          <ListFilter className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 w-full" id={`est-select-container-${studentId}`}>
      <select
        value={value}
        onChange={e => {
          if (e.target.value === '__CUSTOM__') {
            setIsCustom(true);
          } else {
            onChange(e.target.value);
          }
        }}
        className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-800 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold cursor-pointer shadow-2xs transition-colors"
      >
        <option value="">-- اختر التقدير --</option>

        {/* الاحتمالات الموصى بها مباشرة حسب نقطة التلميذ */}
        {avg !== null && (
          <optgroup label={`⭐ موصى بها حسب النقطة (${tierInfo.label})`}>
            {tierInfo.estimations.map((est, i) => (
              <option key={`rec-${i}`} value={est}>
                {est}
              </option>
            ))}
          </optgroup>
        )}

        {/* كافة الاحتمالات الأخرى حسب المستويات الوزارية */}
        {Object.values(PEDAGOGICAL_TIERS).map(t => (
          <optgroup key={t.tier} label={`فئة: ${t.label}`}>
            {t.estimations.map((est, i) => (
              <option key={`${t.tier}-${i}`} value={est}>
                {est}
              </option>
            ))}
          </optgroup>
        ))}

        {isCustomValue && (
          <optgroup label="تقدير مخصص مسجل حالياً">
            <option value={value}>{value}</option>
          </optgroup>
        )}

        <optgroup label="تخصيص">
          <option value="__CUSTOM__">✍️ كتابة تقدير مخصص...</option>
        </optgroup>
      </select>

      <button
        type="button"
        onClick={() => setIsCustom(true)}
        title="كتابة يدوية مخصصة"
        className="p-1 text-slate-400 hover:text-amber-700 hover:bg-slate-100 cursor-pointer rounded shrink-0 transition-colors"
      >
        <PenLine className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

/**
 * قائمة منسدلة ذكية للإرشادات تشمل كل الاحتمالات والتوجيهات البيداغوجية حسب النقطة
 */
const GuidanceDropdown: React.FC<{
  studentId: string;
  value: string;
  avg: number | null;
  onChange: (val: string) => void;
}> = ({ studentId, value, avg, onChange }) => {
  const [isCustom, setIsCustom] = useState(false);
  const currentTier = getScoreTier(avg);
  const tierInfo = PEDAGOGICAL_TIERS[currentTier];

  const allKnown = Object.values(PEDAGOGICAL_TIERS).flatMap(t => t.guidanceList);
  const isCustomValue = Boolean(value && !allKnown.includes(value));

  if (isCustom) {
    return (
      <div className="flex items-center gap-1 w-full" id={`guidance-custom-${studentId}`}>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="اكتب الإرشاد البيداغوجي..."
          className="w-full text-xs px-2.5 py-1 rounded-lg border border-gold bg-amber-50/50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-gold shadow-2xs"
          autoFocus
        />
        <button
          type="button"
          onClick={() => setIsCustom(false)}
          title="العودة للقائمة المنسدلة"
          className="p-1 text-slate-400 hover:text-amber-700 hover:bg-amber-100 cursor-pointer rounded shrink-0 transition-colors"
        >
          <ListFilter className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 w-full" id={`guidance-select-container-${studentId}`}>
      <select
        value={value}
        onChange={e => {
          if (e.target.value === '__CUSTOM__') {
            setIsCustom(true);
          } else {
            onChange(e.target.value);
          }
        }}
        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold cursor-pointer shadow-2xs transition-colors"
      >
        <option value="">-- اختر الإرشاد --</option>

        {/* الإرشادات الموصى بها حسب النقطة */}
        {avg !== null && (
          <optgroup label={`🎯 إرشادات موصى بها حسب النقطة (${tierInfo.label})`}>
            {tierInfo.guidanceList.map((g, i) => (
              <option key={`rec-g-${i}`} value={g}>
                {g}
              </option>
            ))}
          </optgroup>
        )}

        {/* كافة الاحتمالات والتوجيهات البيداغوجية الأخرى */}
        {Object.values(PEDAGOGICAL_TIERS).map(t => (
          <optgroup key={`g-grp-${t.tier}`} label={`إرشادات فئة: ${t.label}`}>
            {t.guidanceList.map((g, i) => (
              <option key={`${t.tier}-g-${i}`} value={g}>
                {g}
              </option>
            ))}
          </optgroup>
        ))}

        {isCustomValue && (
          <optgroup label="إرشاد مخصص مسجل حالياً">
            <option value={value}>{value}</option>
          </optgroup>
        )}

        <optgroup label="تخصيص">
          <option value="__CUSTOM__">✍️ كتابة إرشاد مخصص...</option>
        </optgroup>
      </select>

      <button
        type="button"
        onClick={() => setIsCustom(true)}
        title="كتابة يدوية مخصصة"
        className="p-1 text-slate-400 hover:text-amber-700 hover:bg-slate-100 cursor-pointer rounded shrink-0 transition-colors"
      >
        <PenLine className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

function buildDraft(
  students: Student[],
  grades: StudentGrade[],
  classId: string,
  trimester: 1 | 2 | 3
) {
  const filtered = students.filter(s => s.classId === classId);
  const draft: {
    [id: string]: {
      continuousEval: string;
      quiz: string;
      exam: string;
      estimation: string;
      guidance: string;
      remarks: string;
    };
  } = {};
  for (const st of filtered) {
    const g = grades.find(x => x.studentId === st.id && x.trimester === trimester);
    draft[st.id] = {
      continuousEval: g?.continuousEval !== null && g?.continuousEval !== undefined ? String(g.continuousEval) : '',
      quiz: g?.quiz !== null && g?.quiz !== undefined ? String(g.quiz) : '',
      exam: g?.exam !== null && g?.exam !== undefined ? String(g.exam) : '',
      estimation: g?.estimation || '',
      guidance: g?.guidance || '',
      remarks: g?.remarks || ''
    };
  }
  return draft;
}

interface GradesAndEvaluationProps {
  state: AppState;
  onUpdateState: (updater: (prev: AppState) => AppState) => void;
}

export const GradesAndEvaluation: React.FC<GradesAndEvaluationProps> = ({
  state,
  onUpdateState
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(
    state.activeClassId || (state.classes[0]?.id || '')
  );
  const [selectedTrimester, setSelectedTrimester] = useState<1 | 2 | 3>(
    state.activeTrimester || 1
  );

  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [mobileActiveTab, setMobileActiveTab] = useState<'continuousEval' | 'quiz' | 'exam'>('continuousEval');
  const [searchStudent, setSearchStudent] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const activeClass = state.classes.find(c => c.id === selectedClassId);
  const classStudents = state.students
    .filter(s => s.classId === selectedClassId)
    .sort((a, b) => a.numberInList - b.numberInList);

  // Local editable grades map for smooth typing without lag
  const [gradesDraft, setGradesDraft] = useState(() =>
    buildDraft(
      state.students,
      state.grades,
      state.activeClassId || (state.classes[0]?.id || ''),
      state.activeTrimester || 1
    )
  );

  const handleSelectClass = (newClassId: string) => {
    setSelectedClassId(newClassId);
    setGradesDraft(buildDraft(state.students, state.grades, newClassId, selectedTrimester));
  };

  const handleSelectTrimester = (newTri: 1 | 2 | 3) => {
    setSelectedTrimester(newTri);
    setGradesDraft(buildDraft(state.students, state.grades, selectedClassId, newTri));
  };

  // Precompute stats per student for continuous evaluation calculation
  const classSessions = state.sessions.filter(s => s.classId === selectedClassId);
  const studentStatsMap: Record<string, {
    absent: number; late: number; excused: number;
    disruptions: number; unwritten: number; poorPart: number; goodPart: number;
  }> = {};

  for (const s of classStudents) {
    studentStatsMap[s.id] = { absent: 0, late: 0, excused: 0, disruptions: 0, unwritten: 0, poorPart: 0, goodPart: 0 };
  }

  for (const session of classSessions) {
    if (session.attendance) {
      for (const [studentId, status] of Object.entries(session.attendance)) {
        if (!studentStatsMap[studentId]) studentStatsMap[studentId] = { absent: 0, late: 0, excused: 0, disruptions: 0, unwritten: 0, poorPart: 0, goodPart: 0 };
        if (status === 'ABSENT') studentStatsMap[studentId].absent++;
        else if (status === 'LATE') studentStatsMap[studentId].late++;
        else if (status === 'EXCUSED') studentStatsMap[studentId].excused++;
      }
    }
    if (session.disruptions) {
      for (const studentId of session.disruptions) {
        if (studentStatsMap[studentId]) studentStatsMap[studentId].disruptions++;
      }
    }
    if (session.unwrittenLessons) {
      for (const studentId of session.unwrittenLessons) {
        if (studentStatsMap[studentId]) studentStatsMap[studentId].unwritten++;
      }
    }
    if (session.poorParticipation) {
      for (const studentId of session.poorParticipation) {
        if (studentStatsMap[studentId]) studentStatsMap[studentId].poorPart++;
      }
    }
    if (session.goodParticipation) {
      for (const studentId of session.goodParticipation) {
        if (studentStatsMap[studentId]) studentStatsMap[studentId].goodPart++;
      }
    }
  }

  const calcAutoContinuousEval = (studentId: string): number => {
    const stats = studentStatsMap[studentId];
    if (!stats) return 20;

    const disruptDed = state.calendarSettings?.evaluationRules?.disruptionDeduction ?? 0.5;
    const unwrittenDed = state.calendarSettings?.evaluationRules?.unwrittenLessonDeduction ?? 0.5;
    const absentDed = state.calendarSettings?.evaluationRules?.unexcusedAbsenceDeduction ?? 0.5;
    
    // New simplified calculation: base 20, subtract penalties, add bonuses
    const penalties = (stats.disruptions * disruptDed) + (stats.unwritten * unwrittenDed) + (stats.absent * absentDed);
    const partBonus = state.calendarSettings?.evaluationRules?.participationBonus ?? 0.5;
    const bonuses = (stats.goodPart * partBonus);
    
    const total = Math.min(20, Math.max(0, 20 - penalties + bonuses));
    return Number(total.toFixed(2));
  };

  const handleAutoFillContinuousEval = () => {
    let count = 0;
    setGradesDraft(prev => {
      const next = { ...prev };
      for (const st of classStudents) {
        const autoScore = calcAutoContinuousEval(st.id);
        const d = next[st.id] || { continuousEval: '', quiz: '', exam: '', estimation: '', guidance: '', remarks: '' };
        next[st.id] = { ...d, continuousEval: String(autoScore) };
        count++;
      }
      return next;
    });
    setToastMessage(`تم استيراد وحساب التقويم المستمر آلياً لـ (${count}) تلميذ من سجل الحضور والمتابعة!`);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3500);
  };

  const handleGradeChange = (
    studentId: string,
    field: 'continuousEval' | 'quiz' | 'exam',
    value: string
  ) => {
    // allow empty, or number between 0 and 20
    if (value !== '' && (isNaN(Number(value)) || Number(value) < 0 || Number(value) > 20)) {
      return;
    }
    setGradesDraft(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { continuousEval: '', quiz: '', exam: '', estimation: '', guidance: '', remarks: '' }),
        [field]: value
      }
    }));
  };

  const handleTextFieldChange = (
    studentId: string,
    field: 'estimation' | 'guidance' | 'remarks',
    value: string
  ) => {
    setGradesDraft(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { continuousEval: '', quiz: '', exam: '', estimation: '', guidance: '', remarks: '' }),
        [field]: value
      }
    }));
  };

  // تطبيق التقديرات والإرشادات آلياً لجميع التلاميذ حسب نقاطهم ومعدلاتهم المحسوبة
  const handleAutoFillPedagogicalFields = () => {
    let count = 0;
    setGradesDraft(prev => {
      const next = { ...prev };
      for (const st of classStudents) {
        const d = next[st.id] || { continuousEval: '', quiz: '', exam: '', estimation: '', guidance: '', remarks: '' };
        const ce = d.continuousEval !== '' ? Number(d.continuousEval) : null;
        const q = d.quiz !== '' ? Number(d.quiz) : null;
        const ex = d.exam !== '' ? Number(d.exam) : null;
        const avg = calculateStudentAverage(ce, q, ex);
        if (avg !== null) {
          next[st.id] = {
            ...d,
            estimation: getDefaultEstimation(avg),
            guidance: getDefaultGuidance(avg)
          };
          count++;
        }
      }
      return next;
    });
    setToastMessage(`تم تطبيق التقديرات والإرشادات آلياً لـ (${count}) تلميذ حسب نقاطهم ومعدلاتهم بنجاح!`);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3500);
  };

  const handleSaveAllGrades = () => {
    triggerHapticFeedback();
    const updatedGradesList: StudentGrade[] = [...state.grades];

    for (const student of classStudents) {
      const draft = gradesDraft[student.id] || { continuousEval: '', quiz: '', exam: '', estimation: '', guidance: '', remarks: '' };
      const ceVal = draft.continuousEval !== '' ? Number(draft.continuousEval) : null;
      const qVal = draft.quiz !== '' ? Number(draft.quiz) : null;
      const exVal = draft.exam !== '' ? Number(draft.exam) : null;

      const calcAvg = calculateStudentAverage(ceVal, qVal, exVal);
      const estVal = draft.estimation || (calcAvg !== null ? getDefaultEstimation(calcAvg) : '');
      const guidanceVal = draft.guidance || (calcAvg !== null ? getDefaultGuidance(calcAvg) : '');

      const existingIndex = updatedGradesList.findIndex(
        g => g.studentId === student.id && g.trimester === selectedTrimester
      );

      const gradeObj: StudentGrade = {
        id: existingIndex >= 0 ? updatedGradesList[existingIndex].id : `gr-${student.id}-t${selectedTrimester}`,
        studentId: student.id,
        classId: selectedClassId,
        trimester: selectedTrimester,
        continuousEval: ceVal,
        quiz: qVal,
        exam: exVal,
        calculatedAverage: calcAvg,
        estimation: estVal,
        guidance: guidanceVal
      };

      if (existingIndex >= 0) {
        updatedGradesList[existingIndex] = gradeObj;
      } else {
        updatedGradesList.push(gradeObj);
      }
    }

    onUpdateState(prev => ({
      ...prev,
      grades: updatedGradesList
    }));

    setToastMessage(`تم حفظ وحساب كافة علامات ومعدلات الفصل ${selectedTrimester} بنجاح!`);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  // Export marks sheet to Excel
  const handleDigitizationUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeClass) return;

    setIsExporting(true);
    try {
      // Save current grades in state as well
      handleSaveAllGrades();

      // Collect all grades for this trimester, ensuring current draft edits are merged
      const trimesterGrades = [...state.grades.filter(g => g.trimester === selectedTrimester)];
      
      Object.entries(gradesDraft).forEach(([studentId, draft]) => {
        const ce = draft.continuousEval !== '' ? Number(draft.continuousEval) : null;
        const q = draft.quiz !== '' ? Number(draft.quiz) : null;
        const ex = draft.exam !== '' ? Number(draft.exam) : null;
        const est = draft.estimation;
        const gui = draft.guidance;

        const existingIdx = trimesterGrades.findIndex(
          g => g.studentId === studentId && g.classId === activeClass.id && g.trimester === selectedTrimester
        );

        if (existingIdx !== -1) {
          trimesterGrades[existingIdx] = {
            ...trimesterGrades[existingIdx],
            continuousEval: ce,
            quiz: q,
            exam: ex,
            estimation: est,
            guidance: gui,
          };
        } else {
          trimesterGrades.push({
            id: `grd-${studentId}-${selectedTrimester}`,
            studentId,
            classId: activeClass.id,
            trimester: selectedTrimester,
            continuousEval: ce,
            quiz: q,
            exam: ex,
            estimation: est,
            guidance: gui,
          });
        }
      });

      // Pass the official empty file, all students, and the grades
      const blob = await injectGradesIntoFile(file, state.students, trimesterGrades);
      
      // Download the modified file with original layout 100% preserved
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `محجوز_${file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setToastMessage('تم حقن النقاط في ملف الرقمنة بنجاح مع الحفاظ التام على القالب والتنسيق الأصلي!');
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 4000);
    } catch (err: any) {
      console.error(err);
      import('@/components/Toast').then(({ showToast }) => {
        showToast(err.message || 'حدث خطأ أثناء حقن البيانات. تأكد من أنه ملف الرقمنة الرسمي الصحيح.', 'error');
      });
    } finally {
      setIsExporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExportExcel = () => {
    if (!activeClass) return;

    const rows = classStudents.map((st, idx) => {
      const draft = gradesDraft[st.id] || { continuousEval: '', quiz: '', exam: '', estimation: '', guidance: '', remarks: '' };
      const ce = draft.continuousEval !== '' ? Number(draft.continuousEval) : '';
      const q = draft.quiz !== '' ? Number(draft.quiz) : '';
      const ex = draft.exam !== '' ? Number(draft.exam) : '';
      const avg = calculateStudentAverage(
        ce !== '' ? ce : null,
        q !== '' ? q : null,
        ex !== '' ? ex : null
      );

      return {
        'الرقم': st.numberInList || idx + 1,
        'الاسم واللقب': st.fullName,
        'التقويم المستمر (20)': ce,
        'الفرض المحروس (20)': q,
        'الاختبار الفصلي (20)': ex,
        'المعدل الفصلي (20)': avg ?? '',
        'التقديرات': draft.estimation || (avg !== null ? getDefaultEstimation(avg) : '-'),
        'الإرشادات': draft.guidance || (avg !== null ? getDefaultGuidance(avg) : '')
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    if (!ws['!dir']) ws['!dir'] = 'rtl';
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `كشف_الفصل_${selectedTrimester}`);
    XLSX.writeFile(wb, `كشف_علامات_${activeClass.name.replace(/\s+/g, '_')}_فصل${selectedTrimester}.xlsx`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6" id="grades-evaluation-view">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-gold" />
            <span>النقاط</span>
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 w-full lg:w-auto">
          <input
            type="file"
            ref={fileInputRef}
            accept=".xlsx, .xls"
            onChange={handleDigitizationUpload}
            className="hidden"
          />

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
            <button
              onClick={() => setShowFormulaModal(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-slate-500 shrink-0" />
              <span>كيف يُحسب؟</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isExporting}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#2E7D9B] hover:bg-[#0b543b] disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
              title="حقن النقاط في ملف الرقمنة (Excel) المفرغ"
            >
              <Download className={`w-4 h-4 shrink-0 ${isExporting ? 'animate-bounce' : ''}`} />
              <span>حقن الرقمنة</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold shadow-xs cursor-pointer transition-colors"
              title="استخراج كشف النقاط كملف Excel"
              id="btn-export-grades-sheet"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#2E7D9B] shrink-0" />
              <span>استخراج كشف النقاط</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2">
            <button
              onClick={handleAutoFillContinuousEval}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--primary-soft)] hover:bg-[var(--primary-soft)] text-emerald-900 border border-[var(--primary)] text-xs font-bold cursor-pointer transition-colors shadow-2xs"
              title="حساب التقويم المستمر آلياً بناءً على الغيابات والسلوك المسجل في دفتر النصوص"
            >
              <Sparkles className="w-4 h-4 text-emerald-primary shrink-0" />
              <span>حساب التقويم آلياً</span>
            </button>

            <button
              onClick={handleAutoFillPedagogicalFields}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold cursor-pointer transition-colors shadow-2xs"
              title="ملء التقديرات والإرشادات آلياً لجميع تلاميذ القسم حسب نقاطهم ومعدلاتهم"
            >
              <Sparkles className="w-4 h-4 text-gold shrink-0" />
              <span>تطبيق التقديرات آلياً</span>
            </button>

            <button
              onClick={handleSaveAllGrades}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gold hover:bg-gold text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
              id="btn-save-all-grades"
            >
              <Save className="w-4 h-4 shrink-0" />
              <span>حفظ كل العلامات</span>
            </button>
          </div>
        </div>
      </div>

      {saveToast && (
        <div className="p-3.5 rounded-xl bg-emerald-primary text-white font-bold text-xs flex items-center gap-2 shadow-md">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMessage || `تم حفظ وحساب كافة علامات ومعدلات الفصل ${selectedTrimester} بنجاح!`}</span>
        </div>
      )}

      {/* Class & Trimester Filter Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-4 sm:justify-between items-start sm:items-center w-full sm:w-auto">
          <div className="space-y-0.5 w-full sm:w-auto">
            <span className="text-[11px] font-bold text-slate-500 block">اختر القسم:</span>
            <select
              value={selectedClassId}
              onChange={e => handleSelectClass(e.target.value)}
              className="w-full sm:w-auto bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 outline-none cursor-pointer"
            >
              {state.classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.stream})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-0.5 w-full sm:w-auto">
            <span className="text-[11px] font-bold text-slate-500 block">الفترة الدراسية:</span>
            <div className="flex items-center bg-slate-50 p-0.5 rounded-lg border border-slate-300 w-full sm:w-auto">
              {([1, 2, 3] as const).map(tri => (
                <button
                  key={tri}
                  onClick={() => handleSelectTrimester(tri)}
                  className={`flex-1 sm:flex-initial px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer text-center ${
                    selectedTrimester === tri
                      ? 'bg-gold text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  الفصل {tri}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-500 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <span>تعداد القسم: <strong className="text-slate-900">{classStudents.length} تلميذ</strong></span>
        </div>
      </div>

      {/* Mobile Column Quick-Filter & Search Ribbon */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            value={searchStudent}
            onChange={e => setSearchStudent(e.target.value)}
            placeholder="بحث عن تلميذ لتنقيطه..."
            className="w-full pl-3 pr-9 py-2 border border-slate-200 rounded-xl bg-white text-xs focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>

        {/* Mobile Segmented Control */}
        <div className="md:hidden flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200 text-xs w-full mt-3 sm:mt-0">
          <button
            type="button"
            onClick={() => setMobileActiveTab('continuousEval')}
            className={`flex-1 py-2 px-2 rounded-lg font-bold text-[11px] transition-all cursor-pointer text-center ${
              mobileActiveTab === 'continuousEval'
                ? 'bg-white text-emerald-primary shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            التقويم
          </button>
          <button
            type="button"
            onClick={() => setMobileActiveTab('quiz')}
            className={`flex-1 py-2 px-2 rounded-lg font-bold text-[11px] transition-all cursor-pointer text-center ${
              mobileActiveTab === 'quiz'
                ? 'bg-white text-emerald-primary shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            الفرض
          </button>
          <button
            type="button"
            onClick={() => setMobileActiveTab('exam')}
            className={`flex-1 py-2 px-2 rounded-lg font-bold text-[11px] transition-all cursor-pointer text-center ${
              mobileActiveTab === 'exam'
                ? 'bg-white text-emerald-primary shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            الاختبار
          </button>
        </div>
      </div>

      {/* Grades Container */}
      <div className="space-y-3">
        {classStudents.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 text-center py-12 text-slate-400 text-xs shadow-xs">
            لا يوجد تلاميذ مسجلين في هذا القسم. يرجى إضافتهم من تبويب «الأقسام والتوقيت».
          </div>
        ) : (
          <>
            {/* 1. Mobile-First Card View (Screens < 768px): Compact Rows */}
            <div className="block md:hidden space-y-2">
              {classStudents
                .filter(s => s.fullName.toLowerCase().includes(searchStudent.toLowerCase()))
                .map(student => {
                  const draft = gradesDraft[student.id] || { continuousEval: '', quiz: '', exam: '', estimation: '', guidance: '', remarks: '' };
                  const ce = draft.continuousEval !== '' ? Number(draft.continuousEval) : null;
                  const q = draft.quiz !== '' ? Number(draft.quiz) : null;
                  const ex = draft.exam !== '' ? Number(draft.exam) : null;
                  const avg = calculateStudentAverage(ce, q, ex);
                  const isPassing = avg !== null && avg >= 10;

                  return (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-xs gap-3"
                    >
                      {/* Left side: Avatar (#) and Student Name */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                          {student.numberInList}
                        </span>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-[#1A1C1E] whitespace-normal break-words leading-tight">
                            {student.fullName}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            {student.isRepeater && (
                              <span className="inline-block text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                                معيد
                              </span>
                            )}
                            {avg !== null && (
                              <span className={`text-[10px] font-mono font-bold ${isPassing ? 'text-emerald-primary' : 'text-rose-600'}`}>
                                المعدل: {avg.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right side: Input for active tab */}
                      <div className="shrink-0 w-24">
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          max="20"
                          placeholder="-"
                          value={draft[mobileActiveTab]}
                          onChange={e => handleGradeChange(student.id, mobileActiveTab, e.target.value)}
                          className="w-full text-center px-2 rounded-lg border border-slate-300 bg-slate-50 font-mono font-bold text-sm text-slate-900 focus:ring-2 focus:ring-gold focus:outline-none focus:bg-white transition-colors min-h-[44px]"
                        />
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* 2. Desktop Table View (Screens >= 768px) */}
            <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-800 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="py-3 px-3 w-10 text-center">#</th>
                      <th className="py-3 px-4 min-w-[160px]">اسم ولقب التلميذ</th>
                      <th className="py-3 px-2 w-28 text-center">
                        التقويم المستمر
                        <span className="block text-[10px] font-normal text-slate-500">(على 20)</span>
                      </th>
                      <th className="py-3 px-2 w-28 text-center">
                        الفرض المحروس
                        <span className="block text-[10px] font-normal text-slate-500">(على 20)</span>
                      </th>
                      <th className="py-3 px-2 w-28 text-center">
                        الاختبار الفصلي
                        <span className="block text-[10px] font-normal text-slate-500">(على 20 × 2)</span>
                      </th>
                      <th className="py-3 px-3 w-28 text-center bg-amber-50/70 border-x border-amber-200">
                        المعدل الفصلي
                        <span className="block text-[10px] font-normal text-amber-700">(حساب آلي)</span>
                      </th>
                      <th className="py-3 px-3 min-w-[175px]">التقديرات</th>
                      <th className="py-3 px-4 min-w-[200px]">الإرشادات</th>
                      <th className="py-3 px-4 min-w-[200px]">ملاحظة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classStudents
                      .filter(s => s.fullName.toLowerCase().includes(searchStudent.toLowerCase()))
                      .map(student => {
                        const draft = gradesDraft[student.id] || { continuousEval: '', quiz: '', exam: '', estimation: '', guidance: '', remarks: '' };
                        const ce = draft.continuousEval !== '' ? Number(draft.continuousEval) : null;
                        const q = draft.quiz !== '' ? Number(draft.quiz) : null;
                        const ex = draft.exam !== '' ? Number(draft.exam) : null;
                        const avg = calculateStudentAverage(ce, q, ex);

                        const isPassing = avg !== null && avg >= 10;

                        return (
                          <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-500">
                              {student.numberInList}
                            </td>
                            <td className="py-2.5 px-4 font-bold text-slate-900">
                              {student.fullName}
                            </td>

                            {/* Continuous Evaluation (0-20) */}
                            <td className="py-2 px-2 text-center">
                              <input
                                type="number"
                                step="0.25"
                                min="0"
                                max="20"
                                placeholder="-"
                                value={draft.continuousEval}
                                onChange={e => handleGradeChange(student.id, 'continuousEval', e.target.value)}
                                className="w-18 text-center px-1 py-1 rounded-md border border-slate-300 font-mono font-bold text-slate-900 focus:outline-amber-600 focus:border-gold"
                              />
                            </td>

                            {/* Quiz (0-20) */}
                            <td className="py-2 px-2 text-center">
                              <input
                                type="number"
                                step="0.25"
                                min="0"
                                max="20"
                                placeholder="-"
                                value={draft.quiz}
                                onChange={e => handleGradeChange(student.id, 'quiz', e.target.value)}
                                className="w-18 text-center px-1 py-1 rounded-md border border-slate-300 font-mono font-bold text-slate-900 focus:outline-amber-600 focus:border-gold"
                              />
                            </td>

                            {/* Exam (0-20) */}
                            <td className="py-2 px-2 text-center">
                              <input
                                type="number"
                                step="0.25"
                                min="0"
                                max="20"
                                placeholder="-"
                                value={draft.exam}
                                onChange={e => handleGradeChange(student.id, 'exam', e.target.value)}
                                className="w-18 text-center px-1 py-1 rounded-md border border-slate-300 font-mono font-bold text-slate-900 focus:outline-amber-600 focus:border-gold"
                              />
                            </td>

                            {/* Calculated Average */}
                            <td className="py-2.5 px-3 text-center bg-amber-50/50 border-x border-amber-200">
                              <span
                                className={`font-mono text-sm font-bold ${
                                  avg === null
                                    ? 'text-slate-400'
                                    : isPassing
                                    ? 'text-emerald-primary'
                                    : 'text-rose-700'
                                }`}
                              >
                                {avg !== null ? avg.toFixed(2) : '-'}
                              </span>
                            </td>

                            {/* Estimation (التقديرات) */}
                            <td className="py-2 px-3">
                              <EstimationDropdown
                                studentId={student.id}
                                value={draft.estimation}
                                avg={avg}
                                onChange={val => handleTextFieldChange(student.id, 'estimation', val)}
                              />
                            </td>

                            {/* Guidelines & Advice (الإرشادات) */}
                            <td className="py-2 px-4">
                              <GuidanceDropdown
                                studentId={student.id}
                                value={draft.guidance}
                                avg={avg}
                                onChange={val => handleTextFieldChange(student.id, 'guidance', val)}
                              />
                            </td>

                            {/* Remark (ملاحظة) */}
                            <td className="py-2 px-4">
                              <input
                                type="text"
                                className="w-full text-xs p-2 text-right border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-primary bg-white"
                                value={draft.remarks || ''}
                                onChange={e => handleTextFieldChange(student.id, 'remarks', e.target.value)}
                                placeholder="إضافة ملاحظة..."
                              />
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Explanatory Formula Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                صيغة المعدل
              </h3>
              <button
                onClick={() => setShowFormulaModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center space-y-2">
                <div className="text-[11px] font-bold text-amber-900">الصيغة الوزارية الرسمية:</div>
                <div className="font-mono text-sm font-bold text-amber-950 dir-ltr">
                  المعدل = [ التقويم المستمر + الفرض + (الاختبار × 2) ] ÷ 4
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-slate-900 block">شرح العناصر:</span>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li><strong>التقويم المستمر (على 20):</strong> يشمل انضباط التلميذ، كراس المادة، المشاركة الصفية، والواجبات المنزلية.</li>
                  <li><strong>الفرض المحروس (على 20):</strong> فرض واحد رسمي خلال الفصل مدته ساعة كاملة.</li>
                  <li><strong>الاختبار الفصلي (على 20):</strong> اختبار موحد يضاعف بمعامل 2 طبقاً للقرارات الوزارية المنظمة للتقويم في الطور الثانوي.</li>
                  <li><strong>معامل المادة:</strong> ثابت (2) في كافة السنوات والشعب (علمي، رياضي، تقني رياضي، تسيير واقتصاد، آداب وفلسفة، لغات أجنبية).</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowFormulaModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
