'use client';

import React, { useEffect, useState } from 'react';
import { useAppState } from '@/hooks/app-state-context';
import { calculateEvaluationBreakdown, calculateStudentAverage } from '@/lib/grade-calculator';
import { filterByTrimester } from '@/lib/academic-calendar';
import { EVALUATION_CRITERIA, criterionMax } from '@/lib/evaluation-labels';
import { triggerHapticFeedback } from '@/lib/utils';
import { Student, StudentGrade } from '@/lib/types';
import { normalizeGradeInput as normalizeNumerals } from '@/lib/grade-input';
import { GRADE_FIELD_LABELS, nextGradeCell, parseGradeTable, type GradeField } from '@/lib/grade-table';
import { collectNotebookChecks, normalizeNotebookRounds, notebookScoresFor } from '@/lib/notebook-rounds';
import {
  JUDGEMENT_LEVELS,
  storedJudgementValue,
  suggestParticipationJudgement,
} from '@/lib/participation-judgement';
import { getStudentNameKey } from '@/lib/name-normalizer';
import { AccessibleDialog } from './AccessibleDialog';
import {
  PEDAGOGICAL_TIERS,
  getScoreTier,
  getDefaultEstimation,
  getDefaultGuidance
} from '@/lib/pedagogical-evaluations';
import {

  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  Search,
  Sparkles,
  PenLine,
  ListFilter,
  Upload,
  Loader2
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

  const ratedTiers = Object.values(PEDAGOGICAL_TIERS).filter(t => t.tier !== 'UNRATED');
  const allKnown = ratedTiers.flatMap(t => t.estimations);
  const isCustomValue = Boolean(value && !allKnown.includes(value));

  if (isCustom) {
    return (
      <div className="flex items-center gap-1 w-full" id={`est-custom-${studentId}`}>
        <input
          type="text" value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="اكتب التقدير مخصصاً..." className="w-full text-xs px-2 py-1 rounded-lg border border-gold bg-amber-50/50 font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-gold shadow-2xs" autoFocus
        />
        <button
          type="button" onClick={() => setIsCustom(false)}
          title="العودة للقائمة المنسدلة" className="p-1 text-slate-400 hover:text-amber-700 hover:bg-amber-100 cursor-pointer rounded shrink-0 transition-colors" >
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
        className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-800 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold cursor-pointer shadow-2xs transition-colors" >
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
        {ratedTiers.map(t => (
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
        type="button" onClick={() => setIsCustom(true)}
        title="كتابة يدوية مخصصة" className="p-1 text-slate-400 hover:text-amber-700 hover:bg-slate-100 cursor-pointer rounded shrink-0 transition-colors" >
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

  const ratedTiers = Object.values(PEDAGOGICAL_TIERS).filter(t => t.tier !== 'UNRATED');
  const allKnown = ratedTiers.flatMap(t => t.guidanceList);
  const isCustomValue = Boolean(value && !allKnown.includes(value));

  if (isCustom) {
    return (
      <div className="flex items-center gap-1 w-full" id={`guidance-custom-${studentId}`}>
        <input
          type="text" value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="اكتب الإرشاد البيداغوجي..." className="w-full text-xs px-2.5 py-1 rounded-lg border border-gold bg-amber-50/50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-gold shadow-2xs" autoFocus
        />
        <button
          type="button" onClick={() => setIsCustom(false)}
          title="العودة للقائمة المنسدلة" className="p-1 text-slate-400 hover:text-amber-700 hover:bg-amber-100 cursor-pointer rounded shrink-0 transition-colors" >
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
        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold cursor-pointer shadow-2xs transition-colors" >
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
        {ratedTiers.map(t => (
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
        type="button" onClick={() => setIsCustom(true)}
        title="كتابة يدوية مخصصة" className="p-1 text-slate-400 hover:text-amber-700 hover:bg-slate-100 cursor-pointer rounded shrink-0 transition-colors" >
        <PenLine className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export interface GradeDraftEntry {
  continuousEval: string;
  quiz: string;
  exam: string;
  estimation: string;
  guidance: string;
  remarks: string;
  /** تقدير الأستاذ للمشاركة والنشاط (0–5) — يُحفظ في participationScore. */
  participationJudgement: string;
}

export const EMPTY_GRADE_DRAFT: GradeDraftEntry = {
  continuousEval: '',
  quiz: '',
  exam: '',
  estimation: '',
  guidance: '',
  remarks: '',
  participationJudgement: '',
};

function buildDraft(
  students: Student[],
  grades: StudentGrade[],
  classId: string,
  trimester: 1 | 2 | 3
) {
  const filtered = students.filter(s => s.classId === classId);
  const draft: { [id: string]: GradeDraftEntry } = {};
  for (const st of filtered) {
    const g = grades.find(x => x.studentId === st.id && x.trimester === trimester);
    draft[st.id] = {
      continuousEval: g?.continuousEval !== null && g?.continuousEval !== undefined ? String(g.continuousEval) : '',
      quiz: g?.quiz !== null && g?.quiz !== undefined ? String(g.quiz) : '',
      exam: g?.exam !== null && g?.exam !== undefined ? String(g.exam) : '',
      estimation: g?.estimation || '',
      guidance: g?.guidance || '',
      remarks: g?.remarks || '',
      participationJudgement: storedJudgementValue(g?.participationScore),
    };
  }
  return draft;
}

interface GradesAndEvaluationProps {
}

export const GradesAndEvaluation: React.FC<GradesAndEvaluationProps> = () => {
  const { state, updateState: onUpdateState, updateStateAndWait } = useAppState();
  const [selectedClassId, setSelectedClassId] = useState<string>(
    state.activeClassId || (state.classes[0]?.id || '')
  );
  const [selectedTrimester, setSelectedTrimester] = useState<1 | 2 | 3>(
    state.activeTrimester || 1
  );

  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [showReview, setShowReview] = useState(false);
  // تقديرات جلسة المراجعة الحالية فقط — تُملأ بالاقتراح الآلي أو المحفوظ،
  // ولا تُكتب في الحالة إلا بزر «تطبيق على القسم».
  const [reviewJudgements, setReviewJudgements] = useState<Record<string, string>>({});
  const [saveToast, setSaveToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'pending'>('saved');
  const [mobileActiveTab, setMobileActiveTab] = useState<'continuousEval' | 'quiz' | 'exam'>(
    state.lastWorkspace?.route === 'grades' ? (state.lastWorkspace.gradeColumn || 'continuousEval') : 'continuousEval'
  );
  const [searchStudent, setSearchStudent] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const gradeInputRefs = React.useRef<Record<string, HTMLInputElement | null>>({});
  const [isExporting, setIsExporting] = useState(false);
  const isDirtyRef = React.useRef(false);

  const activeClass = state.classes.find(c => c.id === selectedClassId);
  const classStudents = state.students
    .filter(s => s.classId === selectedClassId)
    .sort((a, b) => a.numberInList - b.numberInList);

  const visibleStudents = classStudents.filter(student =>
    student.fullName.toLowerCase().includes(searchStudent.toLowerCase())
  );

  /**
   * Sequential entry: Enter / ArrowDown keeps the same column and moves to the
   * next student, ArrowUp goes back one. Tab still moves across columns.
   */
  const focusGradeCell = (studentId: string, field: GradeField, direction: 'up' | 'down') => {
    const target = nextGradeCell(field, direction);
    if (!target) return;
    const currentIndex = visibleStudents.findIndex(student => student.id === studentId);
    if (currentIndex === -1) return;
    const nextStudent = visibleStudents[currentIndex + target.moveRow];
    if (!nextStudent) return;
    const nextInput = gradeInputRefs.current[`${target.field}:${nextStudent.id}`];
    nextInput?.focus();
    nextInput?.select();
  };

  /** Mobile card list keeps one column, so Enter simply moves to the next card. */
  const focusMobileNext = (studentId: string) => {
    const currentIndex = visibleStudents.findIndex(student => student.id === studentId);
    const nextStudent = visibleStudents[currentIndex + 1];
    if (!nextStudent) return;
    const nextInput = gradeInputRefs.current[`m:${mobileActiveTab}:${nextStudent.id}`];
    nextInput?.focus();
    nextInput?.select();
  };

  const handleGradeKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    studentId: string,
    field: GradeField,
  ) => {
    if (event.key === 'Enter' || event.key === 'ArrowDown') {
      event.preventDefault();
      focusGradeCell(studentId, field, 'down');
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusGradeCell(studentId, field, 'up');
    }
  };

  // ── Excel / clipboard grade import ───────────────────────────────────────────
  const [showGradeImport, setShowGradeImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importField, setImportField] = useState<GradeField>('exam');
  const [importFileName, setImportFileName] = useState('');
  const [isReadingImport, setIsReadingImport] = useState(false);

  const importPreview = React.useMemo(
    () => parseGradeTable(importText, importField),
    [importText, importField],
  );

  const matchedImportRows = React.useMemo(() => {
    const byKey = new Map(classStudents.map(student => [getStudentNameKey(student.fullName), student]));
    const matched: { studentId: string; values: Partial<Record<GradeField, string>> }[] = [];
    const unmatched: string[] = [];
    importPreview.rows.forEach(row => {
      const student = byKey.get(row.key);
      if (student) matched.push({ studentId: student.id, values: row.values });
      else unmatched.push(row.name);
    });
    return { matched, unmatched };
  }, [classStudents, importPreview.rows]);

  const handleImportFile = async (file: File) => {
    setIsReadingImport(true);
    try {
      if (/\.(csv|txt)$/i.test(file.name)) {
        setImportText(await file.text());
      } else {
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false, raw: false });
        setImportText(
          rows
            .map(row => (row as unknown[]).map(cell => String(cell ?? '').trim()).join('\t'))
            .filter(line => line.replace(/\t/g, '').trim())
            .join('\n'),
        );
      }
      setImportFileName(file.name);
    } catch (error) {
      console.error('Grade import read failed:', error);
      setToastMessage('تعذّر قراءة الملف. تأكد أنه ملف Excel أو CSV صالح.');
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 4000);
    } finally {
      setIsReadingImport(false);
    }
  };

  const handleApplyImport = () => {
    if (matchedImportRows.matched.length === 0) return;
    const matches = matchedImportRows.matched;
    setGradesDraft(prev => {
      const next = { ...prev };
      for (const match of matches) {
        const current = next[match.studentId] || EMPTY_GRADE_DRAFT;
        next[match.studentId] = { ...current, ...match.values };
      }
      return next;
    });
    isDirtyRef.current = true;
    const skipped = matchedImportRows.unmatched.length;
    setToastMessage(
      `تم استيراد نقاط ${matches.length} تلميذاً.` +
        (skipped ? ` لم يُطابَق ${skipped} اسماً — راجع الإملاء.` : '') +
        ' اضغط «حفظ» لتثبيتها.',
    );
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 5000);
    setShowGradeImport(false);
    setImportText('');
    setImportFileName('');
  };

  // Local editable grades map for smooth typing without lag
  const [gradesDraft, setGradesDraft] = useState(() =>
    buildDraft(
      state.students,
      state.grades,
      state.activeClassId || (state.classes[0]?.id || ''),
      state.activeTrimester || 1
    )
  );

  const prevGradesRef = React.useRef(state.grades);

  useEffect(() => {
    let changed = false;
    let nextClassId = selectedClassId;
    let nextTri = selectedTrimester;

    if (state.activeClassId && state.activeClassId !== selectedClassId) {
      nextClassId = state.activeClassId;
      changed = true;
    }
    if (state.activeTrimester && state.activeTrimester !== selectedTrimester) {
      nextTri = state.activeTrimester;
      changed = true;
    }

    if (changed || (!isDirtyRef.current && prevGradesRef.current !== state.grades)) {
      setSelectedClassId(nextClassId);
      setSelectedTrimester(nextTri);
      isDirtyRef.current = false;
      setGradesDraft(buildDraft(state.students, state.grades, nextClassId, nextTri));
    }
    prevGradesRef.current = state.grades;
  }, [state.activeClassId, state.activeTrimester, selectedClassId, selectedTrimester, state.students, state.grades]);

  const handleMobileGradeTab = (column: 'continuousEval' | 'quiz' | 'exam') => {
    setMobileActiveTab(column);
    onUpdateState(previous => ({
      ...previous,
      lastWorkspace: {
        route: 'grades',
        classId: selectedClassId,
        gradeColumn: column,
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  const handleSelectClass = async (newClassId: string) => {
    // CRITICAL FIX: await persist before switching context to prevent data loss
    if (isDirtyRef.current) {
      try {
        await persistDraftGrades();
      } catch (error) {
        console.error('Failed to persist grades before class switch:', error);
        setToastMessage('تعذر حفظ النقاط قبل تغيير القسم. يرجى المحاولة مرة أخرى.');
        setSaveToast(true);
        setTimeout(() => setSaveToast(false), 4000);
        return; // Don't switch if persist failed
      }
    }
    setSelectedClassId(newClassId);
    isDirtyRef.current = false;
    onUpdateState(prev => ({ ...prev, activeClassId: newClassId }));
    setGradesDraft(buildDraft(state.students, state.grades, newClassId, selectedTrimester));
  };

  const handleSelectTrimester = async (newTri: 1 | 2 | 3) => {
    // CRITICAL FIX: await persist before switching context to prevent data loss
    if (isDirtyRef.current) {
      try {
        await persistDraftGrades();
      } catch (error) {
        console.error('Failed to persist grades before trimester switch:', error);
        setToastMessage('تعذر حفظ النقاط قبل تغيير الفصل. يرجى المحاولة مرة أخرى.');
        setSaveToast(true);
        setTimeout(() => setSaveToast(false), 4000);
        return; // Don't switch if persist failed
      }
    }
    setSelectedTrimester(newTri);
    isDirtyRef.current = false;
    setGradesDraft(buildDraft(state.students, state.grades, selectedClassId, newTri));
  };

  // Precompute stats per student for continuous evaluation calculation.
  // A cancelled session documents nothing taught, so its leftover marks never count.
  // Sessions are scoped to the selected term: term 2 must start from a clean slate.
  const classSessions = filterByTrimester(
    state.sessions.filter(s => s.classId === selectedClassId && s.sessionStatus !== 'CANCELLED'),
    state.calendarSettings?.termDates,
    selectedTrimester,
  );
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

  // الحصص التي وُثِّق فيها تلميذ واحد على الأقل. ضيق الوقت لا يجوز أن يُحسب ضد
  // التلميذ: من لم تُسجَّل مشاركته في حصة غير موثّقة لا يُعاقب.
  const documentedSessionsCount = classSessions.filter(
    session => (session.goodParticipation?.length ?? 0) + (session.poorParticipation?.length ?? 0) > 0,
  ).length;
  const notebookChecks = collectNotebookChecks(classSessions);

  /**
   * One shared breakdown drives the suggested mark, the tooltip and the saved value.
   * Auto components come from the notebook (attendance + behaviour + participation
   * evidence); the teacher's 0–5 judgement is added on top of the documented part.
   */
  const evaluationRules = state.calendarSettings?.evaluationRules;
  const notebookRounds = normalizeNotebookRounds(evaluationRules?.notebookRounds);

  /**
   * حاسبة واحدة تخدم الجدول والنافذة: `judgementValue` يسمح لشاشة المراجعة
   * بحساب المجموع من التقدير المعروض فيها قبل حفظه (اقتراحاً كان أو تعديلاً)،
   * بينما يبقى الجدول على التقدير المحفوظ فعلاً.
   */
  const breakdownFor = (studentId: string, judgementValue?: string) => {
    const raw = judgementValue !== undefined
      ? judgementValue
      : (gradesDraft[studentId]?.participationJudgement || '');
    return calculateEvaluationBreakdown(
      {
        ...(studentStatsMap[studentId] || {}),
        sessionsCount: classSessions.length,
        documentedSessions: documentedSessionsCount,
        notebookScores: notebookScoresFor(notebookChecks, studentId, notebookRounds),
        participationJudgement: raw === '' ? null : Number(raw),
      },
      state.calendarSettings?.evaluationRules
    );
  };

  const autoBreakdownFor = (studentId: string) => breakdownFor(studentId);

  /** اقتراح تقدير المشاركة من أدلة التوثيق؛ لا يُحفظ حتى يضغط الأستاذ «تطبيق». */
  const suggestedJudgementFor = (studentId: string): string => {
    const suggestion = suggestParticipationJudgement({
      goodPart: studentStatsMap[studentId]?.goodPart ?? 0,
      poorPart: studentStatsMap[studentId]?.poorPart ?? 0,
      documentedSessions: documentedSessionsCount,
      targetRatio: evaluationRules?.participationTargetRatio,
    });
    return suggestion === null ? '' : String(suggestion);
  };

  const calcAutoContinuousEval = (studentId: string): number => autoBreakdownFor(studentId).total;

  const autoBreakdownTitle = (studentId: string): string => {
    const breakdown = autoBreakdownFor(studentId);
    const rules = state.calendarSettings?.evaluationRules;
    return EVALUATION_CRITERIA.map(meta => {
      if (meta.key === 'participation') {
        const parts = [
          breakdown.participationRecorded !== null ? `توثيق ${breakdown.participationRecorded}` : null,
          breakdown.participationJudgement !== null ? `تقدير ${breakdown.participationJudgement}` : null,
        ].filter(Boolean).join(' + ');
        const value = breakdown.participation === null ? '—' : breakdown.participation;
        return `${meta.short} ${value}/${criterionMax(rules, meta.key)}${parts ? ` (${parts})` : ''}`;
      }
      return `${meta.short} ${breakdown[meta.key]}/${criterionMax(rules, meta.key)}`;
    }).join(' • ');
  };

  const handleUseAutoContinuousEval = (studentId: string) => {
    const autoScore = calcAutoContinuousEval(studentId);
    isDirtyRef.current = true;
    setGradesDraft(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || EMPTY_GRADE_DRAFT),
        continuousEval: String(autoScore)
      }
    }));
    setToastMessage(`تم وضع النقطة الآلية ${autoScore} في خانة التقويم المستمر. يمكنك تعديلها يدوياً.`);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  /**
   * يفتح المراجعة وقد ملأ كل صف: التقدير المحفوظ إن وُجد، وإلا الاقتراح الآلي.
   * الاقتراح يظهر في القائمة فقط ولا يمسّ الحالة، فيمكن إغلاق النافذة دون أثر.
   */
  const openReview = () => {
    const seeded: Record<string, string> = {};
    for (const student of classStudents) {
      const stored = gradesDraft[student.id]?.participationJudgement || '';
      seeded[student.id] = stored || suggestedJudgementFor(student.id);
    }
    setReviewJudgements(seeded);
    setShowReview(true);
  };

  /** يطبّق تقديرات نافذة المراجعة (المقترحة أو المعدَّلة) والتقويم المحسوب منها. */
  const handleApplyReview = () => {
    isDirtyRef.current = true;
    setGradesDraft(prev => {
      const next = { ...prev };
      for (const student of classStudents) {
        const draft = next[student.id] || EMPTY_GRADE_DRAFT;
        const judgement = reviewJudgements[student.id] ?? '';
        next[student.id] = {
          ...draft,
          participationJudgement: judgement,
          continuousEval: String(breakdownFor(student.id, judgement).total),
        };
      }
      return next;
    });
    setToastMessage('تم تطبيق التقديرات المقترحة (وما عدّلته) على القسم. راجع النقاط ثم احفظ.');
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 4000);
    setShowReview(false);
  };

  const handleGradeChange = (
    studentId: string,
    field: 'continuousEval' | 'quiz' | 'exam',
    value: string
  ) => {
    // Normalize Arabic/Persian numerals to Western
    const normalized = normalizeNumerals(value);
    // allow empty, or number between 0 and 20
    if (normalized !== '' && (isNaN(Number(normalized)) || Number(normalized) < 0 || Number(normalized) > 20)) {
      setToastMessage('تنبيه: يجب أن تكون العلامة محصورة بين 0 و 20.');
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 3500);
      return;
    }
    isDirtyRef.current = true;
    setGradesDraft(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || EMPTY_GRADE_DRAFT),
        [field]: normalized
      }
    }));
  };

  const handleTextFieldChange = (
    studentId: string,
    field: 'estimation' | 'guidance' | 'remarks',
    value: string
  ) => {
    isDirtyRef.current = true;
    setGradesDraft(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || EMPTY_GRADE_DRAFT),
        [field]: value
      }
    }));
  };

  // تطبيق التقديرات والإرشادات آلياً لجميع التلاميذ حسب نقاطهم ومعدلاتهم المحسوبة
  const handleAutoFillPedagogicalFields = () => {
    let count = 0;
    isDirtyRef.current = true;
    setGradesDraft(prev => {
      const next = { ...prev };
      for (const st of classStudents) {
        const d = next[st.id] || EMPTY_GRADE_DRAFT;
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

  const persistDraftGrades = async () => {
    await updateStateAndWait(prev => {
      const updatedGradesList: StudentGrade[] = [...prev.grades];

      for (const student of classStudents) {
        const draft = gradesDraft[student.id] || EMPTY_GRADE_DRAFT;
        const ceVal = draft.continuousEval !== '' ? Number(draft.continuousEval) : null;
        const qVal = draft.quiz !== '' ? Number(draft.quiz) : null;
        const exVal = draft.exam !== '' ? Number(draft.exam) : null;

        const calcAvg = calculateStudentAverage(ceVal, qVal, exVal);
        const estVal = draft.estimation || (calcAvg !== null ? getDefaultEstimation(calcAvg) : '');
        const guidanceVal = draft.guidance || (calcAvg !== null ? getDefaultGuidance(calcAvg) : '');

        const existingIndex = updatedGradesList.findIndex(
          g => g.studentId === student.id && g.trimester === selectedTrimester
        );

        const existingGrade = existingIndex >= 0 ? updatedGradesList[existingIndex] : undefined;
        const breakdown = autoBreakdownFor(student.id);
        const gradeObj: StudentGrade = {
          ...existingGrade,
          id: existingGrade?.id || `gr-${student.id}-t${selectedTrimester}`,
          studentId: student.id,
          classId: selectedClassId,
          trimester: selectedTrimester,
          continuousEval: ceVal,
          quiz: qVal,
          exam: exVal,
          calculatedAverage: calcAvg,
          estimation: estVal,
          guidance: guidanceVal,
          // المكوّنات تُحفظ كما احتُسبت كي تعكس السحابة النموذج نفسه، مع بقاء
          // المشاركة في العمود المخصّص لها: الجزء التقديري (0–5) الذي اختاره الأستاذ.
          behaviorScore: breakdown.behavior,
          attendanceScore: breakdown.attendance,
          notebookScore: breakdown.notebook,
          participationScore:
            draft.participationJudgement === '' ? null : Number(draft.participationJudgement),
        };

        if (existingIndex >= 0) {
          updatedGradesList[existingIndex] = gradeObj;
        } else {
          updatedGradesList.push(gradeObj);
        }
      }

      return {
        ...prev,
        grades: updatedGradesList
      };
    });
  };

  const persistDraftGradesRef = React.useRef(persistDraftGrades);
  persistDraftGradesRef.current = persistDraftGrades;

  useEffect(() => {
    if (!isDirtyRef.current) return;
    setSaveStatus('pending');
    let isMounted = true;
    const timer = window.setTimeout(() => {
      if (!isMounted) return;
      setSaveStatus('saving');
      void persistDraftGradesRef.current()
        .then(() => {
          if (!isMounted) return;
          isDirtyRef.current = false;
          setSaveStatus('saved');
        })
        .catch((error: unknown) => {
          if (!isMounted) return;
          console.error('Grades sync failed:', error);
          setSaveStatus('pending');
          setToastMessage('تعذر حفظ النقاط في السحابة. التغييرات لم تُفقد — ستتم إعادة المحاولة تلقائيًا.');
          setSaveToast(true);
        });
    }, 500); // Reduced from 900ms to minimize data-loss window
    return () => {
      isMounted = false;
      window.clearTimeout(timer);
    };
  }, [gradesDraft]);

  // CRITICAL FIX: Immediately persist when tab becomes hidden (prevents data loss on tab close)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isDirtyRef.current) {
        // Fire-and-forget but the outbox (IndexedDB) guarantees durability:
        // the debounced save effect already wrote to the outbox, and
        // useCloudAppState's pagehide handler will flush it.
        void persistDraftGradesRef.current().catch(() => { /* outbox will retry */ });
      }
    };
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        // Immediately persist to the durable outbox before the page dies
        void persistDraftGradesRef.current().catch(() => { /* outbox will retry */ });
        // Show the browser's native "are you sure?" dialog
        e.preventDefault();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Cleanup: attempt one last persist if still dirty
      if (isDirtyRef.current) {
        void persistDraftGradesRef.current().catch(() => { /* best effort */ });
      }
    };
  }, []);

  const handleSaveAllGrades = async () => {
    triggerHapticFeedback();
    setSaveStatus('saving');
    try {
      await persistDraftGrades();
      setSaveStatus('saved');
      const incompleteCount = classStudents.filter(student => {
        const draft = gradesDraft[student.id];
        return !draft || draft.continuousEval === '' || draft.quiz === '' || draft.exam === '';
      }).length;
      setToastMessage(
        incompleteCount > 0
          ? `تم حفظ النقاط. أُجّل حساب المعدل لـ ${incompleteCount} تلميذ حتى تكتمل نقاط التقويم والفرض والاختبار.`
          : `تم حفظ وحساب كافة علامات ومعدلات الفصل ${selectedTrimester} بنجاح!`
      );
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 3500);
    } catch (error: unknown) {
      console.error('Grades sync failed:', error);
      setSaveStatus('pending');
      setToastMessage('تعذر حفظ النقاط في السحابة.');
      setSaveToast(true);
    }
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
        const calculatedAverage = calculateStudentAverage(ce, q, ex);
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
            calculatedAverage,
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
            calculatedAverage,
            estimation: est,
            guidance: gui,
          });
        }
      });

      // Pass the official empty file, all students, and the grades
      const { injectGradesIntoFile } = await import('@/lib/excel-sync');
      const injectionResult = await injectGradesIntoFile(file, state.students, trimesterGrades);
      if (injectionResult.matchedStudents === 0) {
        throw new Error('لم تتم مطابقة أي تلميذ داخل الملف الرسمي. لم يتم تنزيل ملف؛ تحقق من القسم أو رقم التعريف والاسم.');
      }

      // Download the modified ministry workbook without changing its filename.
      const url = URL.createObjectURL(injectionResult.blob);
      const link = document.createElement('a');
      link.href = url;
      // Keep the ministry workbook filename unchanged for upload validation.
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setToastMessage(
        `تم حقن ${injectionResult.gradesWritten} قيمة في ملف الرقمنة لـ ${injectionResult.matchedStudents} تلاميذ مع الحفاظ على القالب الأصلي.`
      );
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

  const handleExportExcel = async () => {
    if (!activeClass) return;

    const rows = classStudents.map((st, idx) => {
      const draft = gradesDraft[st.id] || EMPTY_GRADE_DRAFT;
      const ce = draft.continuousEval !== '' ? Number(draft.continuousEval) : '';
      const q = draft.quiz !== '' ? Number(draft.quiz) : '';
      const ex = draft.exam !== '' ? Number(draft.exam) : '';
      const avg = calculateStudentAverage(
        ce !== '' ? ce : null,
        q !== '' ? q : null,
        ex !== '' ? ex : null
      );

      const [lastName, ...firstNameParts] = st.fullName.trim().split(/\s+/);
      return [
        st.registrationNumber || st.regNumber || '',
        lastName || '',
        firstNameParts.join(' '),
        st.birthDate || '',
        ce,
        q,
        ex,
        draft.estimation || (avg !== null ? getDefaultEstimation(avg) : ''),
        draft.guidance || (avg !== null ? getDefaultGuidance(avg) : '')
      ];
    });

    const { utils, writeFile } = await import('xlsx');
    const ws = utils.aoa_to_sheet([
      ['الجمهورية الجزائرية الديمقراطية الشعبية'],
      ['وزارة التربية الوطنية'],
      [`كشف نقاط مادة العلوم الإسلامية - ${activeClass.name} - الفصل ${selectedTrimester}`],
      ['رقم التعريف', 'اللقب', 'الاسم', 'تاريخ الميلاد', 'التقييم المستمر /20', 'معدل الفروض /20', 'الاختبار /20', 'التقديرات', 'الإرشادات'],
      ...rows
    ]);
    ws['!dir'] = 'rtl';
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } }
    ];
    ws['!cols'] = [
      { wch: 21 }, { wch: 18 }, { wch: 22 }, { wch: 14 },
      { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 24 }, { wch: 34 }
    ];
    for (const cellRef of ['A1', 'A2', 'A3']) {
      if (ws[cellRef]) ws[cellRef].s = { font: { bold: true, sz: cellRef === 'A3' ? 14 : 11 }, alignment: { horizontal: 'right' } };
    }
    for (let column = 0; column < 9; column++) {
      const header = utils.encode_cell({ r: 3, c: column });
      if (ws[header]) ws[header].s = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '2E7D9B' } }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true } };
    }
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, `الرقمنة_فصل_${selectedTrimester}`);
    writeFile(wb, `كشف_علامات_${activeClass.name.replace(/\s+/g, '_')}_فصل${selectedTrimester}.xlsx`);
  };

  const gradeSummary = classStudents.reduce((summary, student) => {
    const draft = gradesDraft[student.id];
    const ce = draft?.continuousEval !== '' && draft?.continuousEval !== undefined ? Number(draft.continuousEval) : null;
    const quiz = draft?.quiz !== '' && draft?.quiz !== undefined ? Number(draft.quiz) : null;
    const exam = draft?.exam !== '' && draft?.exam !== undefined ? Number(draft.exam) : null;
    const average = calculateStudentAverage(ce, quiz, exam);
    if (average !== null) {
      summary.completed++;
      summary.averageTotal += average;
      if (average < 10) summary.belowTen++;
    } else {
      summary.incomplete++;
    }
    return summary;
  }, { completed: 0, incomplete: 0, belowTen: 0, averageTotal: 0 });
  const overallAverage = gradeSummary.completed > 0
    ? (gradeSummary.averageTotal / gradeSummary.completed).toFixed(2)
    : '-';

  return (
    <div className="space-y-6 w-full max-w-[30rem] md:max-w-7xl mx-auto px-3 sm:px-6 md:px-8 py-4 sm:py-6" id="grades-evaluation-view">
      {/* Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 w-full lg:w-auto">
          <input
            type="file" ref={fileInputRef}
            accept=".xlsx, .xls" onChange={handleDigitizationUpload}
            className="hidden" />

          <details className="group rounded-xl border border-slate-200 bg-slate-50 p-1">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 text-xs font-bold text-slate-700">
              <span>المزيد: شرح واستيراد وتصدير</span>
              <span className="transition-transform group-open:rotate-180">⌄</span>
            </summary>
            <div className="grid grid-cols-2 items-center gap-2 border-t border-slate-200 p-2 sm:flex sm:flex-wrap">
            <button
              onClick={() => setShowFormulaModal(true)}
              className="flex min-h-11 items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors" >
              <HelpCircle className="w-4 h-4 text-slate-500 shrink-0" />
              <span>كيف يُحسب؟</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isExporting}
              className="flex min-h-11 items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors" title="ملء ملف الرقمنة (Excel) بالنقاط المحفوظة" >
              <Download className={`w-4 h-4 shrink-0 ${isExporting ? 'animate-bounce' : ''}`} />
              <span>ملء ملف الرقمنة</span>
            </button>

            <button
              onClick={() => setShowGradeImport(true)}
              className="flex min-h-11 items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold shadow-xs cursor-pointer transition-colors"
              title="لصق عمود من Excel أو اختيار ملف .xlsx/.csv لملء النقاط دفعة واحدة">
              <Upload className="w-4 h-4 text-[var(--primary)] shrink-0" />
              <span>استيراد النقاط</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="col-span-2 sm:col-span-1 flex min-h-11 items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold shadow-xs cursor-pointer transition-colors" title="استخراج كشف النقاط كملف Excel" id="btn-export-grades-sheet" >
              <FileSpreadsheet className="w-4 h-4 text-[var(--primary)] shrink-0" />
              <span>استخراج كشف النقاط</span>
            </button>
            </div>
          </details>

          <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2">
            <button
              onClick={openReview}
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-[var(--primary)]/30 bg-white px-3.5 py-2 text-xs font-bold text-[var(--primary-ink)] shadow-2xs transition-colors hover:bg-[var(--primary-soft)]"
              title="مراجعة مكوّنات التقويم لكل تلميذ؛ التقدير مقترح آلياً ويمكن تعديله">
              <ListFilter className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>مراجعة التقويم</span>
            </button>

            <button
              onClick={handleAutoFillPedagogicalFields}
              className="flex min-h-11 items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold cursor-pointer transition-colors shadow-2xs" title="ملء التقديرات والإرشادات آلياً لجميع تلاميذ القسم حسب نقاطهم ومعدلاتهم" >
              <Sparkles className="w-4 h-4 text-gold shrink-0" />
              <span>تطبيق التقديرات آلياً</span>
            </button>

            <span
              className={`text-xs font-bold ${
                saveStatus === 'saved' ? 'text-[var(--primary)]' : saveStatus === 'saving' ? 'text-amber-700' : 'text-slate-500'
              }`}
              aria-live="polite"
            >
              {saveStatus === 'saved' ? '✓ محفوظ' : saveStatus === 'saving' ? '⟳ جارٍ الحفظ...' : '⏳ تغييرات غير محفوظة'}
            </span>
          </div>
        </div>
      </div>

      {saveToast && (
        <div
          role="alert"
          className={`p-3.5 rounded-xl font-bold text-xs flex items-center justify-between gap-3 shadow-md transition-all ${
            toastMessage.includes('تعذر') || toastMessage.includes('خطأ')
              ? 'bg-rose-600 text-white'
              : 'bg-[var(--primary)] text-white'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {toastMessage.includes('تعذر') || toastMessage.includes('خطأ') ? (
              <AlertCircle className="w-5 h-5 shrink-0 text-white" />
            ) : (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-white" />
            )}
            <span className="truncate">{toastMessage || `تم حفظ وحساب كافة علامات ومعدلات الفصل ${selectedTrimester} بنجاح!`}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {(toastMessage.includes('تعذر') || toastMessage.includes('خطأ')) && (
              <button
                type="button"
                onClick={handleSaveAllGrades}
                className="min-h-9 px-2.5 py-1 rounded-lg bg-white text-rose-700 hover:bg-rose-50 text-xs font-black transition-colors cursor-pointer"
              >
                إعادة المحاولة
              </button>
            )}
            <button
              type="button"
              onClick={() => setSaveToast(false)}
              className="min-h-9 min-w-9 p-1 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center justify-center"
              aria-label="إغلاق التنبيه"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}


      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="ملخص دفتر النقاط">
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
          <div className="text-xs font-bold text-slate-500">مكتمل</div>
          <div className="mt-1 text-lg font-black text-[var(--primary)]">{gradeSummary.completed}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
          <div className="text-xs font-bold text-slate-500">ناقص</div>
          <div className="mt-1 text-lg font-black text-amber-700">{gradeSummary.incomplete}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
          <div className="text-xs font-bold text-slate-500">المتوسط العام</div>
          <div className="mt-1 text-lg font-black text-slate-900">{overallAverage}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
          <div className="text-xs font-bold text-slate-500">أقل من 10</div>
          <div className="mt-1 text-lg font-black text-rose-700">{gradeSummary.belowTen}</div>
        </div>
      </div>

      {/* Class & Trimester Filter Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-4 sm:justify-between items-start sm:items-center w-full sm:w-auto">
          <div className="space-y-0.5 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-500 block">اختر القسم:</span>
            <select
              value={selectedClassId}
              onChange={e => handleSelectClass(e.target.value)}
              className="w-full sm:w-auto bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 outline-none cursor-pointer" >
              {state.classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.stream})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-0.5 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-500 block">الفترة الدراسية:</span>
            <div className="flex items-center bg-slate-50 p-0.5 rounded-lg border border-slate-300 w-full sm:w-auto">
              {([1, 2, 3] as const).map(tri => (
                <button
                  key={tri}
                  onClick={() => handleSelectTrimester(tri)}
                  className={`flex-1 sm:flex-initial px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer text-center ${
                    selectedTrimester === tri
                      ? 'bg-[var(--accent-gold)] text-[var(--accent-navy)] shadow-xs' : 'text-slate-600 hover:text-slate-900' }`}
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
            type="text" value={searchStudent}
            onChange={e => setSearchStudent(e.target.value)}
            placeholder="بحث عن تلميذ لتنقيطه..." className="w-full pl-3 pr-9 py-2 border border-slate-200 rounded-xl bg-white text-xs focus:outline-none focus:ring-2 focus:ring-gold" />
        </div>

        {/* Mobile Segmented Control */}
        <div className="md:hidden flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200 text-xs w-full mt-3 sm:mt-0">
          <button
            type="button" onClick={() => handleMobileGradeTab('continuousEval')}
            className={`flex-1 py-2 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer text-center ${
              mobileActiveTab === 'continuousEval' ? 'bg-white text-[var(--primary)] shadow-xs border border-slate-200' : 'text-slate-500 hover:text-slate-700' }`}
          >
            التقويم
          </button>
          <button
            type="button" onClick={() => handleMobileGradeTab('quiz')}
            className={`flex-1 py-2 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer text-center ${
              mobileActiveTab === 'quiz' ? 'bg-white text-[var(--primary)] shadow-xs border border-slate-200' : 'text-slate-500 hover:text-slate-700' }`}
          >
            الفرض
          </button>
          <button
            type="button" onClick={() => handleMobileGradeTab('exam')}
            className={`flex-1 py-2 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer text-center ${
              mobileActiveTab === 'exam' ? 'bg-white text-[var(--primary)] shadow-xs border border-slate-200' : 'text-slate-500 hover:text-slate-700' }`}
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
                  const draft = gradesDraft[student.id] || EMPTY_GRADE_DRAFT;
                  const ce = draft.continuousEval !== '' ? Number(draft.continuousEval) : null;
                  const q = draft.quiz !== '' ? Number(draft.quiz) : null;
                  const ex = draft.exam !== '' ? Number(draft.exam) : null;
                  const avg = calculateStudentAverage(ce, q, ex);
                  const completedFields = [draft.continuousEval, draft.quiz, draft.exam].filter(value => value !== '').length;

                  return (
                    <div
                      key={student.id}
                      className="flex flex-col p-3 bg-white rounded-xl border border-slate-200 shadow-xs gap-3" >
                      {/* Left side: Avatar (#) and Student Name */}
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                          {student.numberInList}
                        </span>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-[var(--text-primary)] whitespace-normal break-words leading-tight">
                            {student.fullName}
                          </h4>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-black ${completedFields === 3 ? 'bg-[var(--success-soft)] text-[var(--success)]' : 'bg-amber-50 text-amber-800'}`}>
                              {completedFields}/3 مكتملة
                            </span>
                            {student.isRepeater && (
                              <span className="inline-block rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-800">
                                معيد
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full">
                        <span className="text-xs font-bold text-slate-500 flex-1">
                          {mobileActiveTab === 'continuousEval' ? 'التقويم المستمر' : mobileActiveTab === 'quiz' ? 'الفرض المحروس' : 'الاختبار الفصلي'}
                        </span>
                        <input
                          ref={element => { gradeInputRefs.current[`m:${mobileActiveTab}:${student.id}`] = element; }}
                          type="text" inputMode="decimal" pattern="[0-9٠-٩۰-۹.,٫]*" placeholder="-" value={draft[mobileActiveTab]}
                          onFocus={event => event.currentTarget.select()}
                          onChange={e => handleGradeChange(student.id, mobileActiveTab, e.target.value)}
                          onKeyDown={event => {
                            if (event.key !== 'Enter') return;
                            event.preventDefault();
                            focusMobileNext(student.id);
                          }}
                          onBlur={() => {
                            const raw = normalizeNumerals(draft[mobileActiveTab]);
                            if (raw === '') return;
                            const numeric = Number(raw);
                            if (!Number.isFinite(numeric)) return;
                            const clamped = Math.min(20, Math.max(0, numeric));
                            if (String(clamped) !== raw) handleGradeChange(student.id, mobileActiveTab, String(clamped));
                          }}
                          enterKeyHint="next"
                          aria-label={`${mobileActiveTab === 'continuousEval' ? 'التقويم المستمر' : mobileActiveTab === 'quiz' ? 'الفرض المحروس' : 'الاختبار الفصلي'} - ${student.fullName}`}
                          className="w-24 text-center px-2 rounded-lg border border-slate-300 bg-slate-50 font-mono font-bold text-sm text-slate-900 focus:ring-2 focus:ring-gold focus:outline-none focus:bg-white transition-colors min-h-[44px]" />
                      </div>
                      {mobileActiveTab === 'continuousEval' && (
                        <div className="flex items-center justify-between gap-2 rounded-lg border border-[var(--primary)]/20 bg-[var(--primary-soft)] px-3 py-2">
                          <span className="text-xs font-semibold text-[var(--text-secondary)]" title={autoBreakdownTitle(student.id)}>
                            المقترح آلياً: <strong className="font-mono text-[var(--primary)]">{calcAutoContinuousEval(student.id).toFixed(2)}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUseAutoContinuousEval(student.id)}
                            className="min-h-8 rounded-md border border-[var(--primary)]/30 bg-white px-2 text-xs font-bold text-[var(--primary-ink)] hover:bg-[var(--primary-soft)]"
                          >
                            استخدام المقترح
                          </button>
                        </div>
                      )}

                      {avg !== null && (
                        <div className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                          <span className="text-xs font-bold text-amber-800">المعدل الفصلي</span>
                          <span className="font-mono text-sm font-bold text-amber-900">{avg.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-2 w-full border-t border-slate-100 pt-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">التقديرات</label>
                          <EstimationDropdown studentId={student.id} value={draft.estimation} avg={avg} onChange={val => handleTextFieldChange(student.id, 'estimation', val)} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">الإرشادات</label>
                          <GuidanceDropdown studentId={student.id} value={draft.guidance} avg={avg} onChange={val => handleTextFieldChange(student.id, 'guidance', val)} />
                        </div>
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
                        <span className="block text-xs font-normal text-slate-500">(على 20)</span>
                      </th>
                      <th className="py-3 px-2 w-28 text-center">
                        الفرض المحروس
                        <span className="block text-xs font-normal text-slate-500">(على 20)</span>
                      </th>
                      <th className="py-3 px-2 w-28 text-center">
                        الاختبار الفصلي
                        <span className="block text-xs font-normal text-slate-500">(على 20 × 2)</span>
                      </th>
                      <th className="py-3 px-3 w-28 text-center bg-amber-50/70 border-x border-amber-200">
                        المعدل الفصلي
                        <span className="block text-xs font-normal text-amber-700">(حساب آلي)</span>
                      </th>
                      <th className="py-3 px-3 min-w-[175px]">التقديرات</th>
                      <th className="py-3 px-4 min-w-[200px]">الإرشادات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classStudents
                      .filter(s => s.fullName.toLowerCase().includes(searchStudent.toLowerCase()))
                      .map(student => {
                        const draft = gradesDraft[student.id] || EMPTY_GRADE_DRAFT;
                        const ce = draft.continuousEval !== '' ? Number(draft.continuousEval) : null;
                        const q = draft.quiz !== '' ? Number(draft.quiz) : null;
                        const ex = draft.exam !== '' ? Number(draft.exam) : null;
                        const avg = calculateStudentAverage(ce, q, ex);

                        return (
                          <tr key={student.id} className="hover:bg-slate-50/80 transition-colors h-[54px] max-h-[54px]">
                            <td className="p-1 px-2 text-center font-mono font-bold text-slate-500">
                              {student.numberInList}
                            </td>
                            <td className="p-1 px-2 font-bold text-slate-900">
                              {student.fullName}
                            </td>

                            {/* Continuous Evaluation (0-20) */}
                            <td className="p-1 px-1 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <input
                                  ref={element => { gradeInputRefs.current[`continuousEval:${student.id}`] = element; }}
                                  type="number" inputMode="decimal" step="0.25" min="0" max="20" placeholder="-" value={draft.continuousEval}
                                  onChange={e => handleGradeChange(student.id, 'continuousEval', e.target.value)}
                                  onKeyDown={event => handleGradeKeyDown(event, student.id, 'continuousEval')}
                                  onBlur={() => {
                                    const raw = normalizeNumerals(draft.continuousEval);
                                    if (raw === '') return;
                                    const numeric = Number(raw);
                                    if (!Number.isFinite(numeric)) return;
                                    const clamped = Math.min(20, Math.max(0, numeric));
                                    if (String(clamped) !== raw) handleGradeChange(student.id, 'continuousEval', String(clamped));
                                  }}
                                  enterKeyHint="next"
                                  aria-label={`التقويم المستمر - ${student.fullName}`}
                                  className="w-18 text-center px-1 py-1 min-h-[40px] rounded-md border border-slate-300 font-mono font-bold text-slate-900 focus:outline-amber-600 focus:border-gold" />
                                <div className="hidden sm:flex items-center gap-1 text-xs text-[var(--primary)] whitespace-nowrap" title={autoBreakdownTitle(student.id)}>
                                  <span className="font-mono">{calcAutoContinuousEval(student.id).toFixed(2)}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleUseAutoContinuousEval(student.id)}
                                    className="rounded border border-[var(--primary)]/30 bg-[var(--primary-soft)] px-1 py-0 font-bold hover:opacity-80"
                                  >
                                    تطبيق
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Quiz (0-20) */}
                            <td className="p-1 px-1 text-center">
                              <input
                                ref={element => { gradeInputRefs.current[`quiz:${student.id}`] = element; }}
                                type="number" inputMode="decimal" step="0.25" min="0" max="20" placeholder="-" value={draft.quiz}
                                onChange={e => handleGradeChange(student.id, 'quiz', e.target.value)}
                                onKeyDown={event => handleGradeKeyDown(event, student.id, 'quiz')}
                                onBlur={() => {
                                  const raw = normalizeNumerals(draft.quiz);
                                  if (raw === '') return;
                                  const numeric = Number(raw);
                                  if (!Number.isFinite(numeric)) return;
                                  const clamped = Math.min(20, Math.max(0, numeric));
                                  if (String(clamped) !== raw) handleGradeChange(student.id, 'quiz', String(clamped));
                                }}
                                enterKeyHint="next"
                                aria-label={`الفرض المحروس - ${student.fullName}`}
                                className="w-18 text-center px-1 py-1 min-h-[40px] rounded-md border border-slate-300 font-mono font-bold text-slate-900 focus:outline-amber-600 focus:border-gold" />
                            </td>

                            {/* Exam (0-20) */}
                            <td className="p-1 px-1 text-center">
                              <input
                                ref={element => { gradeInputRefs.current[`exam:${student.id}`] = element; }}
                                type="number" inputMode="decimal" step="0.25" min="0" max="20" placeholder="-" value={draft.exam}
                                onChange={e => handleGradeChange(student.id, 'exam', e.target.value)}
                                onKeyDown={event => handleGradeKeyDown(event, student.id, 'exam')}
                                onBlur={() => {
                                  const raw = normalizeNumerals(draft.exam);
                                  if (raw === '') return;
                                  const numeric = Number(raw);
                                  if (!Number.isFinite(numeric)) return;
                                  const clamped = Math.min(20, Math.max(0, numeric));
                                  if (String(clamped) !== raw) handleGradeChange(student.id, 'exam', String(clamped));
                                }}
                                enterKeyHint="next"
                                aria-label={`الاختبار الفصلي - ${student.fullName}`}
                                className="w-18 text-center px-1 py-1 min-h-[40px] rounded-md border border-slate-300 font-mono font-bold text-slate-900 focus:outline-amber-600 focus:border-gold" />
                            </td>

                            <td className="p-1 px-2 text-center bg-amber-50/50 border-x border-amber-200">
                              <span className="font-mono text-sm font-bold text-amber-900">
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
      <AccessibleDialog
        open={showFormulaModal}
        titleId="grade-formula-title"
        onClose={() => setShowFormulaModal(false)}
        dismissOnBackdrop
        className="w-full max-w-lg space-y-4 rounded-xl border border-slate-200 bg-white p-6 text-right shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 id="grade-formula-title" className="text-base font-bold text-slate-900">
            صيغة المعدل
          </h3>
          <button
            onClick={() => setShowFormulaModal(false)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            aria-label="إغلاق">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs leading-relaxed text-slate-700">
          <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
            <div className="text-xs font-bold text-amber-900">الصيغة الوزارية الرسمية:</div>
            <div className="font-mono text-sm font-bold text-amber-950 dir-ltr">
              المعدل = [ التقويم المستمر + الفرض + (الاختبار × 2) ] ÷ 4
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="block font-bold text-slate-900">شرح العناصر:</span>
            <ul className="list-inside list-disc space-y-1 text-slate-600">
              <li><strong>التقويم المستمر (على 20):</strong> السلوك والانضباط 3، المواظبة والحضور 3، الكراس والواجبات 6، المشاركة والنشاط 8 — كما في القرار الوزاري.</li>
              <li><strong>المواظبة (على 3):</strong> نسبة من حصص الفصل: كل غياب غير مبرر يُنقص النسبة بنقطة كاملة، والتأخر بنصف نقطة، ثم تُضرب النسبة في منحنى تصاعدي. الغياب المبرَّر لا يُخصم.</li>
              <li><strong>السلوك (على 3):</strong> خصم 0.5 عن كل مخالفة من الأولى؛ ست مخالفات تستهلك العنصر كاملاً.</li>
              <li><strong>الكراس (على 6):</strong> مراقبة واحدة للكراس في الفصل على مقياس 0–5، تمتد على عدة حصص (8–10 تلاميذ في الحصة).</li>
              <li><strong>المشاركة والنشاط (على 8):</strong> 3 نقاط توثيق آلي تُحسب على الحصص التي وُثِّق فيها شيء فعلاً (لا على كل الحصص)، و5 نقاط تقدير الأستاذ من خمسة مستويات.</li>
              <li><strong>عنصر بلا أدلة:</strong> يُستبعد ويُعاد توزيع وزنه على بقية العناصر بدل منحه صفراً أو سقفه كاملاً.</li>
              <li><strong>الفرض المحروس (على 20):</strong> فرض واحد رسمي خلال الفصل مدته ساعة كاملة.</li>
              <li><strong>الاختبار الفصلي (على 20):</strong> اختبار موحد يضاعف بمعامل 2 طبقاً للقرارات الوزارية المنظمة للتقويم في الطور الثانوي.</li>
              <li><strong>معامل المادة:</strong> ثابت (2) في كافة السنوات والشعب (علمي، رياضي، تقني رياضي، تسيير واقتصاد، آداب وفلسفة، لغات أجنبية).</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-100 pt-2">
          <button
            onClick={() => setShowFormulaModal(false)}
            className="min-h-11 rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[var(--primary-hover)]">
            إغلاق
          </button>
        </div>
      </AccessibleDialog>

      {/* Continuous-evaluation review: one screen, no extra icons */}
      <AccessibleDialog
        open={showReview}
        titleId="grade-review-title"
        onClose={() => setShowReview(false)}
        className="flex max-h-[90vh] w-full max-w-3xl flex-col gap-4 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 text-right shadow-xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 id="grade-review-title" className="text-base font-black text-[var(--text-primary)]">
              مراجعة التقويم المستمر
            </h3>
            <p className="mt-1 text-xs leading-6 text-[var(--text-secondary)]">
              الأوزان: السلوك 3 · المواظبة 3 · الكراس 6 · المشاركة والنشاط 8 (منها 3 توثيق و5 تقدير).
            </p>
            <p className="text-xs leading-6 text-[var(--text-tertiary)]">
              التقدير مُقترَح آلياً من مشاركاتك المسجّلة؛ عدّله من القائمة إن أردت ثم اضغط «تطبيق على القسم».
            </p>
            <p className="text-xs leading-6 text-[var(--text-tertiary)]">
              {classSessions.length} حصة هذا الفصل · {documentedSessionsCount} حصة موثّقة للمشاركة ·
              الكراس: {classStudents.filter(st => notebookScoresFor(notebookChecks, st.id, notebookRounds).length > 0).length}/{classStudents.length}
              {' '}تلميذاً تمت مراقبة كراسه.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowReview(false)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="إغلاق المراجعة"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pe-1">
          {classStudents.map(student => {
            const storedJudgement = gradesDraft[student.id]?.participationJudgement || '';
            const suggestion = suggestedJudgementFor(student.id);
            const judgement = reviewJudgements[student.id] ?? '';
            const showsSuggestion = storedJudgement === '' && judgement !== '' && judgement === suggestion;
            const breakdown = breakdownFor(student.id, judgement);
            const missingNotebook = breakdown.missing.includes('notebook');
            const missingAttendance = breakdown.missing.includes('attendance');
            return (
              <div
                key={student.id}
                className="rounded-xl border border-[var(--border-subtle)] bg-white p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="w-6 shrink-0 text-center font-mono text-xs font-bold text-[var(--text-tertiary)]">
                      {student.numberInList}
                    </span>
                    <span className="truncate text-sm font-bold text-[var(--text-primary)]">{student.fullName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="rounded bg-[var(--bg-page)] px-2 py-0.5 font-mono text-[var(--text-secondary)]">
                      المجموع <strong className="text-[var(--text-primary)]">{breakdown.total.toFixed(2)}</strong>/20
                    </span>
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs sm:grid-cols-4">
                  <span className="rounded-lg bg-[var(--bg-page)] px-2 py-1 text-[var(--text-secondary)]">
                    المواظبة {missingAttendance || breakdown.attendance === null ? '—' : `${breakdown.attendance}/${criterionMax(evaluationRules, 'attendance')}`}
                  </span>
                  <span className="rounded-lg bg-[var(--bg-page)] px-2 py-1 text-[var(--text-secondary)]">
                    السلوك {breakdown.behavior ?? '—'}/{criterionMax(evaluationRules, 'behavior')}
                  </span>
                  <span className="rounded-lg bg-[var(--bg-page)] px-2 py-1 text-[var(--text-secondary)]">
                    الكراس {missingNotebook || breakdown.notebook === null ? '—' : `${breakdown.notebook.toFixed(1)}/${criterionMax(evaluationRules, 'notebook')}`}
                  </span>
                  <span className="rounded-lg bg-[var(--bg-page)] px-2 py-1 text-[var(--text-secondary)]">
                    التوثيق {breakdown.participationRecorded === null ? '—' : `${breakdown.participationRecorded.toFixed(1)}/${evaluationRules?.participationRecordedMax ?? 3}`}
                  </span>
                </div>

                <label className="mt-2 flex items-center justify-between gap-2 text-xs font-bold text-[var(--text-secondary)]">
                  <span className="flex items-center gap-2">
                    <span>تقدير المشاركة والنشاط</span>
                    {showsSuggestion && (
                      <span className="rounded bg-[var(--primary-soft)] px-1.5 py-0.5 text-xs font-bold text-[var(--primary-ink)]">
                        مقترح
                      </span>
                    )}
                  </span>
                  <select
                    value={judgement}
                    onChange={event => {
                      const value = event.target.value;
                      setReviewJudgements(prev => ({ ...prev, [student.id]: value }));
                    }}
                    className="min-h-9 rounded-lg border border-[var(--border-default)] bg-white px-2 text-xs font-bold text-[var(--text-primary)]"
                    aria-label={`تقدير المشاركة - ${student.fullName}`}
                  >
                    {JUDGEMENT_LEVELS.map(level => (
                      <option key={level.value || 'none'} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[var(--border-subtle)] pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-6 text-[var(--text-tertiary)]">
            العنصر بلا أدلة يُستبعد ويُعاد توزيع وزنه، فلا صفر جزاءً على نقص التسجيل.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowReview(false)}
              className="min-h-11 rounded-xl border border-[var(--border-default)] px-4 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)]"
            >
              إغلاق
            </button>
            <button
              type="button"
              onClick={handleApplyReview}
              className="min-h-11 rounded-xl bg-[var(--primary)] px-5 text-xs font-bold text-white transition-colors hover:bg-[var(--primary-hover)]"
            >
              تطبيق على القسم
            </button>
          </div>
        </div>
      </AccessibleDialog>

      {/* Excel / clipboard import */}
      <AccessibleDialog
        open={showGradeImport}
        titleId="grade-import-title"
        onClose={() => setShowGradeImport(false)}
        className="w-full max-w-2xl space-y-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 text-right shadow-xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 id="grade-import-title" className="text-base font-black text-[var(--text-primary)]">
              استيراد النقاط من Excel
            </h3>
            <p className="mt-1 text-xs leading-6 text-[var(--text-secondary)]">
              انسخ الأعمدة من ملف Excel وألصقها هنا، أو اختر ملفاً مباشرة.
              كل سطر: <span className="font-mono">الاسم</span> ثم التقويم المستمر ثم الفرض ثم الاختبار.
              ويمكن أن يكون سطرين فقط: الاسم والنقطة.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowGradeImport(false)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="إغلاق نافذة الاستيراد"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--primary)]/40 bg-[var(--primary-soft)]/40 px-4 text-xs font-bold text-[var(--primary-ink)] transition-colors hover:bg-[var(--primary-soft)]">
            {isReadingImport ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}
            <span>اختيار ملف Excel أو CSV</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv,.txt"
              className="sr-only"
              onChange={event => {
                const file = event.target.files?.[0];
                if (file) void handleImportFile(file);
                event.target.value = '';
              }}
            />
          </label>
          {importFileName && (
            <span className="truncate text-xs font-bold text-[var(--text-tertiary)]">{importFileName}</span>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_14rem]">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-[var(--text-secondary)]">لصق الجدول</span>
            <textarea
              value={importText}
              onChange={event => setImportText(event.target.value)}
              rows={8}
              dir="auto"
              placeholder={'بن علي يوسف\t12\t14\t16\nحداد مريم\t10\t11\t13'}
              className="w-full rounded-xl border border-[var(--border-default)] bg-white px-3 py-2 font-mono text-xs leading-6 text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none"
            />
          </label>
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-[var(--text-secondary)]">
                عمود الاستيراد لسطر من خانتين
              </span>
              <select
                value={importField}
                onChange={event => setImportField(event.target.value as GradeField)}
                className="min-h-11 w-full rounded-xl border border-[var(--border-default)] bg-white px-3 text-xs font-bold text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none"
              >
                {(Object.keys(GRADE_FIELD_LABELS) as GradeField[]).map(field => (
                  <option key={field} value={field}>{GRADE_FIELD_LABELS[field]}</option>
                ))}
              </select>
            </label>
            <div className="space-y-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">أسطر جاهزة</span>
                <strong className="font-mono text-[var(--success)]">{matchedImportRows.matched.length}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">أسماء غير مطابقة</span>
                <strong className="font-mono text-[var(--warning)]">{matchedImportRows.unmatched.length}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">أسطر متجاهلة</span>
                <strong className="font-mono text-[var(--text-tertiary)]">{importPreview.skipped.length}</strong>
              </div>
            </div>
          </div>
        </div>

        {matchedImportRows.unmatched.length > 0 && (
          <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <strong>لم نجد في هذا القسم:</strong>{' '}
            {matchedImportRows.unmatched.slice(0, 6).join('، ')}
            {matchedImportRows.unmatched.length > 6 ? ` و${matchedImportRows.unmatched.length - 6} آخرين` : ''}
          </div>
        )}

        {importPreview.skipped.length > 0 && (
          <div role="status" className="max-h-24 overflow-y-auto rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
            <ul className="list-inside list-disc space-y-0.5">
              {importPreview.skipped.slice(0, 5).map(item => (
                <li key={item.line}>السطر {item.line}: {item.reason}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-[var(--border-subtle)] pt-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setShowGradeImport(false)}
            className="min-h-11 rounded-xl border border-[var(--border-default)] px-4 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)]"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleApplyImport}
            disabled={matchedImportRows.matched.length === 0}
            className="min-h-11 rounded-xl bg-[var(--primary)] px-5 text-xs font-bold text-white transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            استيراد {matchedImportRows.matched.length} نقطة
          </button>
        </div>
      </AccessibleDialog>
    </div>
  );
};
