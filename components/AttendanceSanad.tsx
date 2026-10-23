'use client';

import { showToast } from '@/components/Toast';
import { printElement } from '@/lib/print';
import { AccessibleDialog } from '@/components/AccessibleDialog';
import { useAppState } from '@/hooks/app-state-context';
import React, { useEffect, useState } from 'react';
import { exportToDocx, triggerHapticFeedback } from '@/lib/utils';
import { filterByTrimester, getExcludedDayLabel, isDateExcluded, normalizeTrimester, trimesterLabel } from '@/lib/academic-calendar';
import { EVALUATION_EVENT_LABELS } from '@/lib/evaluation-labels';
import { calculateEvaluationBreakdown } from '@/lib/grade-calculator';
import {
  NOTEBOOK_SCORE_CHOICES,
  buildNotebookChecks,
  collectNotebookChecks,
  nextOpenRound,
  normalizeNotebookRounds,
  roundProgress,
} from '@/lib/notebook-rounds';
import { getLocalDateString } from '@/lib/date-utils';
import { AttendanceStatus, SessionRecord } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import {
  UserCheck,
  Sparkles,
  Printer,
  Clock3,
  Plus,
  Search,
  Save
} from 'lucide-react';

interface AttendanceSanadProps {
  onNavigateToTimetable?: () => void;
  onNavigateToSessions?: (sessionId?: string) => void;
}

export const AttendanceSanad: React.FC<AttendanceSanadProps> = ({
  onNavigateToTimetable,
  onNavigateToSessions
}) => {
  const { state, updateState: onUpdateState, updateStateAndWait } = useAppState();
  const [selectedClassId, setSelectedClassId] = useState<string>(
    state.activeClassId || (state.classes[0]?.id || '')
  );

  useEffect(() => {
    if (state.activeClassId && state.activeClassId !== selectedClassId) {
      // Sync navigation context when another screen changes the active class.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedClassId(state.activeClassId);
    }
  }, [state.activeClassId, selectedClassId]);

  const activeClass = state.classes.find(c => c.id === selectedClassId) || state.classes[0];
  const classStudents = state.students
    .filter(s => s.classId === selectedClassId)
    .sort((a, b) => a.numberInList - b.numberInList);

  const activeTrimester = normalizeTrimester(state.activeTrimester);

  // Sessions are scoped to the active term: a new term starts with an empty log
  // instead of showing (and counting) the previous term's sessions.
  const classSessions = filterByTrimester(
    state.sessions.filter(s => s.classId === selectedClassId),
    state.calendarSettings?.termDates,
    activeTrimester,
  ).sort((a, b) => b.date.localeCompare(a.date));

  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    classSessions[0]?.id || '' );
  const [searchQuery, setSearchQuery] = useState('');
  const [attendanceMode, setAttendanceMode] = useState<'quick' | 'detailed'>('quick');
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [notebookDraft, setNotebookDraft] = useState<Record<string, number>>({});
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [showFinishReview, setShowFinishReview] = useState(false);
  const [bulkUndo, setBulkUndo] = useState<{
    sessionId: string;
    attendance: Record<string, AttendanceStatus>;
  } | null>(null);

  const activeSession = classSessions.find(s => s.id === selectedSessionId) || classSessions[0];
  const activeAttendance = activeSession?.attendance || {};

  // التناوب الكامل: حاضر → متأخر → مبرَّر → غائب. في الوضع السريع يبقى
  // التبديل الثنائي حاضر/غائب كما اعتاده الأستاذ.
  const ATTENDANCE_CYCLE: AttendanceStatus[] = ['PRESENT', 'LATE', 'EXCUSED', 'ABSENT'];
  const handleCycleStatus = (studentId: string) => {
    const current = (activeAttendance[studentId] || 'PRESENT') as AttendanceStatus;
    if (attendanceMode === 'quick') {
      handleSetStudentStatus(studentId, current === 'ABSENT' ? 'PRESENT' : 'ABSENT');
      return;
    }
    const index = ATTENDANCE_CYCLE.indexOf(current);
    handleSetStudentStatus(studentId, ATTENDANCE_CYCLE[(index + 1) % ATTENDANCE_CYCLE.length]);
  };

  const handleSelectClass = (classId: string) => {
    setSelectedClassId(classId);
    onUpdateState(prev => ({ ...prev, activeClassId: classId }));
  };

  // Calculate cumulative stats per student in this class across all sessions
  type BehaviourStats = {
    absent: number;
    late: number;
    unwrittenLessons: number;
    disruptions: number;
    goodParticipation: number;
    poorParticipation: number;
  };
  const emptyStats = (): BehaviourStats => ({
    absent: 0,
    late: 0,
    unwrittenLessons: 0,
    disruptions: 0,
    goodParticipation: 0,
    poorParticipation: 0,
  });
  const studentStatsMap: Record<string, BehaviourStats> = {};
  for (const s of classStudents) {
    studentStatsMap[s.id] = emptyStats();
  }
  for (const session of classSessions) {
    // A cancelled session is only a journal entry: its marks never feed the evaluation.
    if (session.sessionStatus === 'CANCELLED') continue;
    if (session.attendance) {
      for (const [studentId, status] of Object.entries(session.attendance)) {
        if (!studentStatsMap[studentId]) studentStatsMap[studentId] = emptyStats();
        if (status === 'ABSENT') studentStatsMap[studentId].absent++;
        else if (status === 'LATE') studentStatsMap[studentId].late++;
      }
    }
    if (session.unwrittenLessons) {
      for (const studentId of session.unwrittenLessons) {
        if (!studentStatsMap[studentId]) studentStatsMap[studentId] = emptyStats();
        studentStatsMap[studentId].unwrittenLessons++;
      }
    }
    if (session.disruptions) {
      for (const studentId of session.disruptions) {
        if (!studentStatsMap[studentId]) studentStatsMap[studentId] = emptyStats();
        studentStatsMap[studentId].disruptions++;
      }
    }
    if (session.goodParticipation) {
      for (const studentId of session.goodParticipation) {
        if (!studentStatsMap[studentId]) studentStatsMap[studentId] = emptyStats();
        studentStatsMap[studentId].goodParticipation++;
      }
    }
    if (session.poorParticipation) {
      for (const studentId of session.poorParticipation) {
        if (!studentStatsMap[studentId]) studentStatsMap[studentId] = emptyStats();
        studentStatsMap[studentId].poorParticipation++;
      }
    }
  }

  // النقطة المعروضة أثناء الحصة هي الجزء الموثَّق من المشاركة (من 3). أما تقدير
  // الأستاذ (5) فيُدخل في نهاية الفصل من شاشة «مراجعة التقويم».
  const evaluationRules = state.calendarSettings?.evaluationRules;
  const participationMax = evaluationRules?.participationRecordedMax ?? 3;
  // الحصة الملغاة لا تُحتسب في المقام: لا تُدرّس ولا تُوثَّق.
  const scoredSessions = classSessions.filter(session => session.sessionStatus !== 'CANCELLED');
  const documentedSessionsCount = scoredSessions.filter(
    session => (session.goodParticipation?.length ?? 0) + (session.poorParticipation?.length ?? 0) > 0,
  ).length;
  const participationScoreFor = (stats: BehaviourStats): number =>
    calculateEvaluationBreakdown(
      {
        absent: stats.absent,
        late: stats.late,
        disruptions: stats.disruptions,
        unwritten: stats.unwrittenLessons,
        poorPart: stats.poorParticipation,
        goodPart: stats.goodParticipation,
        sessionsCount: scoredSessions.length,
        documentedSessions: documentedSessionsCount,
      },
      evaluationRules
    ).participationRecorded ?? 0;

  // جولة تفتيش الكراس: واحدة في الفصل (ويمكن ضبطها على 2)، وتمتد على عدة حصص.
  const notebookRounds = normalizeNotebookRounds(evaluationRules?.notebookRounds);
  const notebookChecks = collectNotebookChecks(classSessions);
  const classStudentIds = classStudents.map(student => student.id);
  const notebookRound = nextOpenRound(notebookChecks, classStudentIds, notebookRounds);
  const notebookProgress = roundProgress(notebookChecks, classStudentIds, notebookRound);
  // مع جولة واحدة: بعد اكتمالها يتحول الزر إلى مراجعة وتعديل بدل فتح جولة ثانية.
  const notebookNeedsReview = notebookRounds === 1 && notebookProgress.complete;
  const notebookLabel = notebookRounds > 1 ? `جولة الكراس ${notebookRound}` : 'جولة الكراس';

  // تلميذ سُجّل كراسه في الحصة نفسها ضمن الجولة الأخرى: لا نسمح بالكتابة فوق
  // سجله السابق، لأن التفتيش الواحد للحصة يخص تلميذاً واحداً.
  const otherRoundInSession = (studentId: string): number | null => {
    const existing = activeSession?.notebookChecks?.[studentId];
    return existing && existing.round !== notebookRound ? existing.round : null;
  };

  // لا نُعيد حفظ ما لم يتغيّر: التوقيت الجديد قد يتجاوز تفتيشاً أحدث من جهاز آخر.
  const pendingNotebookUpdates = Object.entries(notebookDraft)
    .filter(([studentId]) => otherRoundInSession(studentId) === null)
    .filter(([studentId, score]) => notebookChecks[studentId]?.[notebookRound]?.score !== score)
    .map(([studentId, score]) => ({ studentId, score }));

  const openNotebookRound = () => {
    const seeded: Record<string, number> = {};
    for (const student of classStudents) {
      const existing = notebookChecks[student.id]?.[notebookRound];
      if (existing) seeded[student.id] = existing.score;
    }
    setNotebookDraft(seeded);
    setIsNotebookOpen(true);
  };

  const handleSaveNotebookRound = async () => {
    if (!activeSession) {
      showToast('أنشئ حصة أولاً ثم سجّل جولة الكراس داخلها.', 'warning');
      return;
    }
    const updates = pendingNotebookUpdates;
    if (updates.length === 0) {
      showToast('لم تختر أي تلميذ بعد.', 'warning');
      return;
    }
    try {
      const checks = buildNotebookChecks(updates, notebookRound);
      await updateStateAndWait(prev => ({
        ...prev,
        sessions: prev.sessions.map(session =>
          session.id === activeSession.id
            ? { ...session, notebookChecks: { ...(session.notebookChecks || {}), ...checks } }
            : session,
        ),
      }));
      const remaining = classStudents.filter(student => !notebookDraft[student.id]).length;
      const roundLabel = notebookRounds > 1 ? ` في الجولة ${notebookRound}` : '';
      showToast(
        `تم حفظ تفتيش ${updates.length} كراس${roundLabel}` +
          (remaining > 0
            ? `؛ بقي ${remaining} تلميذاً تُكملهم في حصة أخرى.`
            : '؛ اكتملت جولة الكراس لهذا الفصل.'),
        'success',
      );
      setIsNotebookOpen(false);
    } catch (error) {
      console.error('Notebook round save failed:', error);
      showToast('تعذر حفظ جولة الكراس في السحابة.', 'error');
    }
  };

  // Handle setting status for a student in active session
  const handleSetStudentStatus = async (studentId: string, status: AttendanceStatus) => {
    if (!activeSession) return;
    
    triggerHapticFeedback();

    try {
      await updateStateAndWait(prev => ({
        ...prev,
        sessions: prev.sessions.map(ses => ses.id === activeSession.id
          ? { ...ses, attendance: { ...(ses.attendance || {}), [studentId]: status } }
          : ses)
      }));
    } catch (error) {
      console.error('Attendance status sync failed:', error);
      showToast('تعذر حفظ حالة الحضور في السحابة.', 'error');
    }
  };

  const handleToggleBehavior = async (studentId: string, behaviorType: 'disruptions' | 'unwrittenLessons' | 'poorParticipation' | 'goodParticipation') => {
    if (!activeSession) return;

    try {
      await updateStateAndWait(prev => ({
        ...prev,
        sessions: prev.sessions.map(ses => {
        if (ses.id === activeSession.id) {
          const arr = ses[behaviorType] || [];
          const exists = arr.includes(studentId);
          let newArr = exists ? arr.filter(id => id !== studentId) : [...arr, studentId];
          
          let updatedSes = { ...ses, [behaviorType]: newArr };

          // Mutually exclusive participation marks
          if (behaviorType === 'goodParticipation' && !exists) {
            updatedSes.poorParticipation = (ses.poorParticipation || []).filter(id => id !== studentId);
          } else if (behaviorType === 'poorParticipation' && !exists) {
            updatedSes.goodParticipation = (ses.goodParticipation || []).filter(id => id !== studentId);
          }

          return updatedSes;
        }
        return ses;
        })
      }));
    } catch (error) {
      console.error('Attendance behavior sync failed:', error);
      showToast('تعذر حفظ متابعة التلميذ في السحابة.', 'error');
    }
  };

  // Mark all students present in active session
  const handleMarkAllPresent = async () => {
    if (!activeSession) return;
    setBulkUndo({
      sessionId: activeSession.id,
      attendance: { ...(activeSession.attendance || {}) },
    });
    const allPresentMap: Record<string, AttendanceStatus> = {};
    for (const s of classStudents) {
      allPresentMap[s.id] = 'PRESENT';
    }

    try {
      await updateStateAndWait(prev => ({
        ...prev,
        sessions: prev.sessions.map(ses => {
        if (ses.id === activeSession.id) {
          return {
            ...ses,
            attendance: allPresentMap
          };
        }
        return ses;
        })
      }));
    } catch (error) {
      console.error('Mark all present sync failed:', error);
      showToast('تعذر حفظ الحضور الجماعي في السحابة.', 'error');
    }
  };

  const handleUndoBulkAttendance = async () => {
    if (!bulkUndo) return;
    const snapshot = bulkUndo;
    setBulkUndo(null);
    try {
      await updateStateAndWait(previous => ({
        ...previous,
        sessions: previous.sessions.map(session =>
          session.id === snapshot.sessionId
            ? { ...session, attendance: { ...snapshot.attendance } }
            : session
        ),
      }));
      showToast('تم التراجع عن تحديد الحضور الجماعي.', 'success');
    } catch (error) {
      console.error('Undo bulk attendance failed:', error);
      showToast('تعذر التراجع عن العملية.', 'error');
    }
  };

  // Finish attendance and continue the same session in the lesson log.
  const handleFinishAttendance = async () => {
    if (!activeSession) return;
    setIsSavingAll(true);
    try {
      await updateStateAndWait(prev => ({
        ...prev,
        sessions: prev.sessions.map(ses => ses.id === activeSession.id
          ? {
              ...ses,
              attendance: { ...(activeAttendance || {}) },
              unwrittenLessons: [...(activeSession.unwrittenLessons || [])],
              disruptions: [...(activeSession.disruptions || [])],
              poorParticipation: [...(activeSession.poorParticipation || [])],
              goodParticipation: [...(activeSession.goodParticipation || [])],
            }
          : ses)
      }));
      showToast(
        `تم إنهاء الحضور — ${trimesterLabel(activeTrimester)}: ${presentCount} حاضر، ${lateCount} متأخر، ${absentCount} غائب.`,
        'success',
      );
      setShowFinishReview(false);
      onNavigateToSessions?.(activeSession.id);
    } catch (error) {
      console.error('Save all attendance sync failed:', error);
      showToast('تعذر حفظ كامل بيانات الحصة في السحابة.', 'error');
    } finally {
      setIsSavingAll(false);
    }
  };

  // Create a session for today, deriving its time from the timetable whenever possible.
  const handleCreateTodaySession = async () => {
    const today = new Date();
    const todayStr = getLocalDateString(today);
    const excluded = getExcludedDayLabel(state.calendarSettings?.holidays, todayStr, activeClass?.level);
    if (excluded) {
      showToast(`اليوم مستثنى من الحصص: ${excluded}`, 'warning');
      return;
    }
    const currentTime = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
    const todayClassSlots = state.timetable
      .filter(slot => slot.classId === selectedClassId && slot.dayOfWeek === today.getDay())
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    const inferredSlot =
      todayClassSlots.find(slot => slot.startTime <= currentTime && currentTime < slot.endTime) ??
      todayClassSlots.find(slot => slot.startTime > currentTime) ??
      todayClassSlots[0];
    const inferredStartTime = inferredSlot?.startTime ?? '08:00';
    const existingSession = state.sessions.find(session =>
      session.classId === selectedClassId &&
      session.date === todayStr &&
      session.startTime === inferredStartTime
    );
    if (existingSession) {
      setSelectedSessionId(existingSession.id);
      return;
    }

    const newSession: SessionRecord = {
      id: uuidv4(),
      classId: selectedClassId,
      date: todayStr,
      startTime: inferredStartTime,
      endTime: inferredSlot?.endTime ?? '09:00',
      sessionGoals: 'تسجيل الحضور والمتابعة اليومية',
      accomplishments: '',
      nextSteps: '',
      teacherNotes: '', attendance: {},
      };

    setSelectedSessionId(newSession.id);
    try {
      await updateStateAndWait(prev => ({
        ...prev,
        activeClassId: selectedClassId,
        sessions: [newSession, ...prev.sessions]
      }));
    } catch (error) {
      console.error('Create session sync failed:', error);
      showToast('تعذر إنشاء الحصة في السحابة.', 'error');
    }
  };

  // Generate sessions for the active trimester according to the weekly timetable
  const handleGenerateTrimesterSessions = () => {
    const timetableForClass = state.timetable.filter(s => s.classId === selectedClassId);
    if (timetableForClass.length === 0) {
      showToast('يرجى أولاً إضافة حصص لهذا الفوج في جدول التوقيت ليتسنى توليدها تلقائياً.', 'warning');
      return;
    }

    const termDates = state.calendarSettings?.termDates || {
      term1Start: '2026-09-01',
      term1End: '2026-12-15',
      term2Start: '2026-12-16',
      term2End: '2027-03-15',
      term3Start: '2027-03-16',
      term3End: '2027-06-30' };

    let start = new Date(termDates.term1Start);
    let end = new Date(termDates.term1End);
    if (state.activeTrimester === 2) {
      start = new Date(termDates.term2Start);
      end = new Date(termDates.term2End);
    } else if (state.activeTrimester === 3) {
      start = new Date(termDates.term3Start);
      end = new Date(termDates.term3End);
    }

    const newSessions: SessionRecord[] = [];
    const cur = new Date(start);

    // Keep a generous safety limit while allowing two weekly lessons to cover a full trimester.
    let count = 0;
    while (cur <= end && count < 100) {
      const dayOfWeek = cur.getDay(); // 0=Sun ... 4=Thu
      const matchingSlots = timetableForClass
        .filter(t => t.dayOfWeek === dayOfWeek)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      if (matchingSlots.length > 0) {
        const dateStr = getLocalDateString(cur);
        for (const matchSlot of matchingSlots) {
          if (isDateExcluded(state.calendarSettings?.holidays, dateStr, activeClass?.level)) continue;
          if (count >= 100) break;
          const exists = [...state.sessions, ...newSessions].some(
            s =>
              s.classId === selectedClassId &&
              s.date === dateStr &&
              s.startTime === matchSlot.startTime &&
              s.endTime === matchSlot.endTime
          );
          if (exists) continue;

          newSessions.push({
            id: uuidv4(),
            classId: selectedClassId,
            date: dateStr,
            startTime: matchSlot.startTime,
            endTime: matchSlot.endTime,
            sessionGoals: '',
            accomplishments: '',
            nextSteps: '',
            teacherNotes: '',
            attendance: {},
          });
          count++;
        }
      }
      cur.setDate(cur.getDate() + 1);
    }

    if (newSessions.length > 0) {
      void updateStateAndWait(prev => ({
        ...prev,
        activeClassId: selectedClassId,
        sessions: [...newSessions, ...prev.sessions]
      }))
        .then(() => {
          setSelectedSessionId(newSessions[0].id);
          showToast(`تم حفظ ${newSessions.length} حصة في طابور المزامنة لـ${trimesterLabel(activeTrimester)}.`, 'success');
        })
        .catch((error: unknown) => {
          console.error('Generated sessions sync failed:', error);
          showToast(error instanceof Error ? error.message : 'تعذر تأكيد الحصص في السحابة.', 'error');
        });
    } else {
      showToast('جميع حصص هذا الفصل مولدة مسبقاً.', 'warning');
    }
    setShowGenerateConfirm(false);
  };

  const filteredStudents = classStudents.filter(s =>
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Active session stats. A student with no explicit record is considered present
  // (that is how the sheet is filled), then each status is counted separately so
  // late and excused students are never silently merged into "present".
  const statusCounts = classStudents.reduce(
    (counts, student) => {
      const status = activeAttendance[student.id] || 'PRESENT';
      counts[status] += 1;
      return counts;
    },
    { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 } as Record<AttendanceStatus, number>,
  );
  const presentCount = statusCounts.PRESENT;
  const absentCount = statusCounts.ABSENT;
  const lateCount = statusCounts.LATE;
  const excusedCount = statusCounts.EXCUSED;

  // Export official attendance sheet to Word (.docx) with clean table and RTL visual columns
  const handleExportDoc = () => {
    const studentRows = classStudents
      .map(student => {
        const status = activeAttendance[student.id] || 'PRESENT';
        const stats = studentStatsMap[student.id] || { absent: 0, late: 0, excused: 0 };
        const isGood = activeSession?.goodParticipation?.includes(student.id);
        const isPoor = activeSession?.poorParticipation?.includes(student.id);
        const isDisruptive = activeSession?.disruptions?.includes(student.id);
        const isNoLessons = activeSession?.unwrittenLessons?.includes(student.id);

        const behaviorParts: string[] = [];
        if (isGood) behaviorParts.push('مشارك ونشيط');
        if (isPoor) behaviorParts.push('مستوى ضعيف يحتاج متابعة');
        if (isNoLessons) behaviorParts.push(EVALUATION_EVENT_LABELS.unwrittenLesson);
        if (isDisruptive) behaviorParts.push('سلوك غير منضبط');

        const statusLabel =
          status === 'ABSENT' ? '<span style="color: #dc2626; font-weight: bold;">غائب</span>' : status === 'LATE' ? '<span style="color: #d97706; font-weight: bold;">متأخر</span>' : status === 'EXCUSED' ? '<span style="color: #2563eb; font-weight: bold;">مبرر</span>' : '<span style="color: #16a34a;">حاضر</span>';

        const statsText = `غ: ${stats.absent} | ${EVALUATION_EVENT_LABELS.disruption}: ${stats.disruptions} | ${EVALUATION_EVENT_LABELS.unwrittenLesson}: ${stats.unwrittenLessons}`;
          
          return `
            <tr>
              <td style="border: 1px solid #d5dfdc; padding: 6px; text-align: center;">${student.numberInList}</td>
              <td style="border: 1px solid #d5dfdc; padding: 6px;"><b>${student.fullName}</b></td>
              <td style="border: 1px solid #d5dfdc; padding: 6px; text-align: center;">${statusLabel}</td>
              <td style="border: 1px solid #d5dfdc; padding: 6px;">${behaviorParts.join('، ') || '-'}</td>
              <td style="border: 1px solid #d5dfdc; padding: 6px; text-align: center; direction: ltr;">${statsText}</td>
            </tr>
          `;
      })
      .join('');

    const html = `
      <div dir="rtl" style="font-family: 'Amiri', 'Traditional Arabic', serif; color: #000000; padding: 5px;">
        <table style="width: 100%; border: none; margin-bottom: 10px; font-size: 9.5pt;">
          <tr>
            <td style="width: 33%; text-align: right; vertical-align: top; line-height: 1.4;">
              المؤسسة: <b>${state.profile.schoolName || 'ثانوية التعليم الثانوي'}</b><br/>
              الأستاذ(ة): <b>${state.profile.name || 'أستاذ المادة'}</b><br/>
              المادة: <b>العلوم الإسلامية</b>
            </td>
            <td style="width: 34%; text-align: center; vertical-align: middle;">
              <div style="margin: 0; font-size: 12pt; color: #0d2c3b; text-decoration: underline;">ورقة رصد الغياب والمتابعة اليومية</div>
              <div style="font-size: 10.5pt; font-weight: bold; margin-top: 2px;">
                القسم: <b>${activeClass?.name || 'فوج تربوي'}</b> (${activeClass?.stream || ''}) — القاعة: <b>${activeClass?.roomNumber || '...'}</b>
              </div>
            </td>
            <td style="width: 33%; text-align: left; vertical-align: top; line-height: 1.4;">
              الموسم الدراسي: <b>${state.profile.academicYear || '2026/2027'}</b><br/>
              التاريخ: <b>${activeSession?.date || '..../..../2026 م'}</b><br/>
              التوقيت: <b>${activeSession ? `${activeSession.startTime} - ${activeSession.endTime}` : '...... إلى ......'}</b>
            </td>
          </tr>
        </table>

        <div style="height: 1.5px; background-color: #0d2c3b; margin-bottom: 10px;"></div>

        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 10pt;">
          <thead>
            <tr style="background-color: #f1f5f9; font-weight: bold;">
              <th style="border: 1px solid #000; padding: 6px; width: 8%; text-align: center;">الرقم</th>
              <th style="border: 1px solid #000; padding: 6px; width: 32%; text-align: right;">اسم ولقب التلميذ</th>
              <th style="border: 1px solid #000; padding: 6px; width: 14%; text-align: center;">حالة الحصة</th>
              <th style="border: 1px solid #000; padding: 6px; width: 14%; text-align: center;">الغياب والتأخر التراكمي</th>
              <th style="border: 1px solid #000; padding: 6px; width: 32%; text-align: right;">الملاحظات وتقويم الانضباط</th>
            </tr>
          </thead>
          <tbody>
            ${studentRows}
          </tbody>
        </table>

        <div style="margin-top: 12px; padding: 8px; border: 1px solid #94a3b8; background-color: #f8fafc; font-size: 9.5pt;">
          <b>إحصاء الحصة:</b> تعداد الفوج: <b>${classStudents.length}</b> تلميذ &nbsp;|&nbsp; 
          الحاضرون: <b style="color: #16a34a;">${presentCount}</b> &nbsp;|&nbsp; 
          الغائبون: <b style="color: #dc2626;">${absentCount}</b>
        </div>

        <table style="width: 100%; border: none; margin-top: 20px; font-size: 10pt;">
          <tr>
            <td style="width: 50%; text-align: center; vertical-align: top; border: 1px dashed #cbd5e1; padding: 12px;">
              <b>توقيع أستاذ(ة) المادة:</b>
              <p style="margin: 30px 0 0; font-size: 8.5pt; color: #64748b;">حرر في: ${activeSession?.date || '..../..../2026 م'}</p>
            </td>
            <td style="width: 50%; text-align: center; vertical-align: top; border: 1px dashed #cbd5e1; padding: 12px;">
              <b>تأشيرة مستشار التربية / ناظر الدروس:</b>
              <p style="margin: 30px 0 0; font-size: 8.5pt; color: #64748b;">(الختم والملاحظة)</p>
            </td>
          </tr>
        </table>
      </div>
    `;

    exportToDocx(html, `ورقة_الغياب_${activeClass?.name || 'فوج'}_${activeSession?.date || 'حصة'}`);
  };

  return (
    <div className="space-y-6 w-full max-w-[30rem] md:max-w-7xl mx-auto px-3 sm:px-6 md:px-8 py-4 sm:py-6" id="attendance-sanad-view">

      {/* Top Class Selector & Action Ribbon (Screenshot 6) */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary-ink)] flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">الفوج المعروض:</div>
            <select
              value={selectedClassId}
              onChange={e => {
                handleSelectClass(e.target.value);
                const nextSes = state.sessions.find(s => s.classId === e.target.value);
                if (nextSes) setSelectedSessionId(nextSes.id);
              }}
              className="block w-full max-w-full min-w-0 text-wrap whitespace-normal font-bold text-slate-900 bg-transparent text-base focus:outline-none border-b border-dashed border-[var(--primary)] cursor-pointer" >
              {state.classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} - {cls.stream}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-stretch sm:items-center gap-2 flex-wrap">
          {/* Generate sessions button */}
          <button
            onClick={() => handleGenerateTrimesterSessions()}
            className="min-h-11 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[var(--primary-ink)] bg-[var(--primary-soft)] hover:bg-[var(--primary-soft)] border border-[var(--primary)]/20 transition-colors cursor-pointer" >
            <Sparkles className="w-3.5 h-3.5" />
            <span>توليد حصص {trimesterLabel(activeTrimester)}</span>
          </button>

          {/* New session button */}
          <button
            onClick={handleCreateTodaySession}
            className="min-h-11 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-colors shadow-xs cursor-pointer" >
            <Plus className="w-4 h-4" />
            <span>حصة جديدة اليوم</span>
          </button>
        </div>
      </div>

      {/* If No sessions exist for class */}
      {classSessions.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center space-y-3">
          <Clock3 className="w-8 h-8 text-gold mx-auto" />
          <h3 className="font-bold text-amber-900 text-sm">
            لا توجد حصص مسجلة لهذا الفوج حتى الآن
          </h3>
          <p className="text-xs text-amber-700 max-w-md mx-auto">
            يمكنك توليد حصص الفصل تلقائياً وفق جدول التوقيت، أو إضافة حصة جديدة يدوياً للبدء برصد الحضور.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setShowGenerateConfirm(true)}
              className="px-4 py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[var(--primary-hover)] cursor-pointer" >
              توليد حصص {trimesterLabel(activeTrimester)}
            </button>
            {onNavigateToTimetable && (
              <button
                onClick={onNavigateToTimetable}
                className="px-4 py-2 bg-white border border-amber-300 text-amber-900 text-xs font-bold rounded-xl hover:bg-amber-100 cursor-pointer" >
                الذهاب إلى جدول التوقيت
              </button>
            )}
          </div>
        </div>
      )}

      {/* Session Active Toolbar */}
      {activeSession && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Session Selector */}
            <div className="flex flex-col gap-2 w-full sm:flex-1">
              <span className="text-xs font-bold text-slate-700 shrink-0">تحديد الحصة:</span>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                    value={selectedSessionId}
                    onChange={e => setSelectedSessionId(e.target.value)}
                    className="w-full sm:flex-1 px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs sm:text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] cursor-pointer" >
                    {classSessions.map(ses => (
                      <option key={ses.id} value={ses.id}>
                    {ses.date} ({ses.startTime}-{ses.endTime}) {ses.sessionGoals ? `- ${ses.sessionGoals.slice(0, 30)}...` : ''}
                      </option>
                    ))}
                  </select>

                {/* Mark All Present */}
                <button
                  onClick={handleMarkAllPresent}
                  className="w-full sm:w-auto min-h-11 px-4 py-2 rounded-xl bg-[var(--primary-soft)] hover:bg-[var(--primary-soft)] text-[var(--primary-ink)] text-xs font-bold border border-[var(--primary)]/20 transition-colors cursor-pointer shrink-0" >
                  تحديد الكل «حاضر»
                </button>

                {/* Attendance is already auto-saved; this action advances the session workflow. */}
                {activeSession.sessionStatus !== 'CANCELLED' && (
                <button
                  type="button"
                  onClick={openNotebookRound}
                  className="flex min-h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[var(--accent-gold)] bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 transition-colors hover:bg-amber-100 sm:w-auto"
                  title="تفتيش كراس 8–10 تلاميذ في هذه الحصة؛ الجولة الواحدة تكتمل على عدة حصص"
                >
                  <span>{notebookNeedsReview ? 'مراجعة الكراس' : notebookLabel}</span>
                  <span className="rounded bg-white/80 px-1.5 font-mono text-xs">
                    {notebookProgress.inspected}/{notebookProgress.total}
                  </span>
                </button>
                )}

                <button
                  onClick={() => setShowFinishReview(true)}
                  disabled={isSavingAll}
                  className="w-full sm:w-auto min-h-11 px-4 py-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold transition-colors cursor-pointer shrink-0 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5" >
                  <Save className="w-3.5 h-3.5" />
                  {isSavingAll ? 'جارٍ الإنهاء...' : 'إنهاء الحضور'}
                </button>
              </div>
            </div>

            <p className="w-full text-xs text-[var(--text-secondary)]">
              كل ما يُسجَّل هنا يُحتسب في <strong>{trimesterLabel(activeTrimester)}</strong> فقط؛
              الفصل التالي يبدأ من صفر.
            </p>

            {/* Quick Session Stats */}
            <div className="grid grid-cols-2 sm:flex items-center gap-1.5 sm:gap-2 text-xs w-full sm:w-auto">
              <div className="text-center sm:text-right px-2 py-1 rounded-lg bg-[var(--primary-soft)] text-[var(--primary-ink)] font-bold border border-[var(--primary)]/20">
                <span className="sm:hidden block text-xs text-[var(--primary)]">حاضر</span>
                <span className="hidden sm:inline">حاضر: </span>
                <span>{presentCount}</span>
              </div>
              <div className="text-center sm:text-right px-2 py-1 rounded-lg bg-rose-50 text-rose-800 font-bold border border-rose-200">
                <span className="sm:hidden block text-xs text-rose-700">غائب</span>
                <span className="hidden sm:inline">غائب: </span>
                <span>{absentCount}</span>
              </div>
            </div>
          </div>

          {bulkUndo?.sessionId === activeSession.id && (
            <div
              role="status"
              className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-[var(--primary)]/20 bg-[var(--primary-soft)] px-4 py-2 text-xs font-bold text-[var(--text-primary)]"
            >
              <span>تم تحديد كل التلاميذ حاضرين.</span>
              <button
                type="button"
                onClick={() => void handleUndoBulkAttendance()}
                className="min-h-11 rounded-lg bg-white px-4 text-[var(--primary)] shadow-xs"
              >
                تراجع
              </button>
            </div>
          )}

          {/* Search bar and View Mode Switcher */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="relative flex-1 w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text" value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="بحث عن تلميذ..." className="w-full pl-3 pr-9 py-2 border border-slate-200 rounded-xl bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
              <div className="grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs font-black">
                <button
                  type="button"
                  onClick={() => setAttendanceMode('quick')}
                  className={`min-h-9 rounded-lg px-3 ${attendanceMode === 'quick' ? 'bg-white text-[var(--primary)] shadow-xs' : 'text-slate-500'}`}
                >
                  سريع
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceMode('detailed')}
                  className={`min-h-9 rounded-lg px-3 ${attendanceMode === 'detailed' ? 'bg-white text-[var(--primary)] shadow-xs' : 'text-slate-500'}`}
                >
                  مفصل
                </button>
              </div>

            </div>

            <button
              onClick={handleExportDoc}
              className="flex min-h-11 items-center justify-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs" >
              <Printer className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              <span>تصدير إلى ملف docx</span>
            </button>
            <button
              type="button"
              onClick={() => printElement('attendance-doc', { title: 'ورقة الحضور والمواظبة' })}
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 cursor-pointer"
              title="معاينة ورقة الحضور ثم طباعتها أو حفظها PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              <span>معاينة وطباعة</span>
            </button>
            {onNavigateToSessions && (
              <button
                type="button"
                onClick={() => onNavigateToSessions(activeSession?.id)}
                className="flex min-h-11 items-center justify-center gap-1.5 px-3.5 py-2 bg-[var(--primary)] border border-[var(--primary)] rounded-xl text-xs font-bold text-white hover:bg-[var(--primary-hover)] cursor-pointer shadow-xs"
              >
                متابعة في دفتر النصوص
              </button>
            )}
          </div>

          {/* Conditional View: Table vs Seating Plan */}
          <div id="attendance-doc">
          <div className="space-y-3">
              {/* 1. Mobile-First Card View (Screens < 768px): ZERO Horizontal Scrolling */}
              <div className="block md:hidden space-y-2.5">
                {filteredStudents.map(student => {
                  const status = activeAttendance[student.id] || 'PRESENT';
                  const stats = studentStatsMap[student.id] || emptyStats();
                  const participationPoints = participationScoreFor(stats);

                  return (
                    <div
                      key={student.id}
                      className="p-3 bg-white rounded-xl border border-[var(--border-default)] shadow-xs space-y-2.5 transition-all" >
                      {/* Top Row: Number, Name, Repeater, & Stats */}
                      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-3">
                        <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto">
                          <span className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                            {student.numberInList}
                          </span>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-sm text-[var(--text-primary)] whitespace-normal break-words leading-tight">
                              {student.fullName}
                            </h4>
                            {student.isRepeater && (
                              <span className="inline-block text-xs px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold mt-0.5">
                                معيد
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Badges: Total Absences & Delays */}
                        <div className="flex items-center gap-1 shrink-0 text-xs font-bold font-mono flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-lg border ${
                              stats.absent > 0
                                ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-400 border-slate-200' }`}
                            title="مجموع الغيابات" >
                            {stats.absent} غ
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-lg border ${
                              stats.disruptions > 0 || stats.unwrittenLessons > 0
                                ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-400 border-slate-200' }`}
                            title="مجموع التأخرات" >
                            سلوك: {stats.disruptions} | كراس: {stats.unwrittenLessons}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-lg border font-mono ${
                              participationPoints > 0
                                ? 'bg-[var(--primary-soft)] text-[var(--primary-ink)] border-[var(--primary)]/30'
                                : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}
                            title="التوثيق الآلي: يُحتسب على الحصص الموثّقة فقط (من 3)"
                          >
                            مشاركة: {participationPoints.toFixed(2)}/{participationMax}
                          </span>
                        </div>
                      </div>

                      {/* Unified Attendance & Behavior Buttons (Mobile) */}
                      <div className={`grid ${attendanceMode === 'detailed' ? 'grid-cols-4' : 'grid-cols-2'} gap-1.5`}>
                                <button
                                  type="button"
                                  onClick={() => handleCycleStatus(student.id)}
                                  aria-pressed={status === 'ABSENT'}
                                  className={`min-h-11 px-1 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                                    status === 'ABSENT' ? 'bg-rose-500 text-white border-rose-600 shadow-xs' : 'border-slate-200 bg-white text-slate-600 hover:text-rose-600 hover:border-rose-300' }`}
                                  title="تسجيل غياب" >
                                  الغياب -
                                </button>
                                {attendanceMode === 'detailed' && (
                                  <>
                                <button
                                  type="button"
                                  onClick={() => handleToggleBehavior(student.id, 'unwrittenLessons')}
                                  aria-pressed={Boolean(activeSession.unwrittenLessons?.includes(student.id))}
                                  className={`min-h-11 px-1 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                                    activeSession.unwrittenLessons?.includes(student.id)
                                      ? 'bg-[var(--accent-gold)] text-[var(--accent-navy)] border-[var(--accent-gold)] shadow-xs' : 'border-slate-200 bg-white text-slate-600 hover:text-amber-700 hover:border-amber-300' }`}
                                  title="لم يكتب الدرس أو أهمل الكراس والواجبات" >
                                  الكراس -
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleBehavior(student.id, 'disruptions')}
                                  aria-pressed={Boolean(activeSession.disruptions?.includes(student.id))}
                                  className={`min-h-11 px-1 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                                    activeSession.disruptions?.includes(student.id)
                                      ? 'bg-[var(--text-primary)] text-white border-[var(--text-primary)] shadow-xs' : 'border-slate-200 bg-white text-slate-600 hover:text-[var(--text-primary)] hover:border-slate-400' }`}
                                  title="مخالفة سلوكية وانضباط" >
                                  سلوك -
                                </button>
                                  </>
                                )}
                                {/* Participation is always reachable: it is the mark that raises the
                                    participation point from 0, so it cannot hide behind detailed mode. */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleBehavior(student.id, 'goodParticipation')}
                                  aria-pressed={Boolean(activeSession.goodParticipation?.includes(student.id))}
                                  className={`min-h-11 px-1 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                                    activeSession.goodParticipation?.includes(student.id)
                                      ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs' : 'border-slate-200 bg-white text-slate-600 hover:text-[var(--primary)] hover:border-[var(--primary)]' }`}
                                  title="مشاركة إيجابية" >
                                  مشاركة +
                                </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 2. Desktop Table View (Screens >= 768px) */}
              <div className="hidden md:block bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                        <th className="p-3 w-14 text-center">الرقم</th>
                        <th className="p-3">اسم ولقب التلميذ</th>
                        <th className="p-3 text-center">حالة الحصة والتقويم السلوكي</th>
                        <th className="p-3 text-center">مجموع الغيابات</th>
                        <th className="p-3 text-center">مجموع السلوك</th>
                        <th className="p-3 text-center">
                          نقطة المشاركة
                          <span className="block text-xs font-normal text-slate-400">توثيق على الحصص الموثّقة (من 3)</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.map(student => {
                        const status = activeAttendance[student.id] || null;
                        const stats = studentStatsMap[student.id] || emptyStats();
                        const participationPoints = participationScoreFor(stats);

                        return (
                          <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="p-3 text-center font-mono font-bold text-slate-500">
                              {student.numberInList}
                            </td>
                            <td className="p-3 font-bold text-slate-900">
                              {student.fullName}
                              {student.isRepeater && (
                                <span className="mr-2 text-xs px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold">
                                  معيد
                                </span>
                              )}
                            </td>
                            {/* Unified Attendance & Behavior Buttons */}
                            <td className="p-2 text-center">
                              <div className="inline-flex flex-wrap items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleCycleStatus(student.id)}
                                  aria-pressed={status === 'ABSENT'}
                                  className={`min-h-10 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                                    status === 'ABSENT' ? 'bg-rose-500 text-white border-rose-600 shadow-xs' : 'border-slate-200 bg-white text-slate-500 hover:text-rose-600 hover:border-rose-300' }`}
                                  title="تسجيل غياب" >
                                  الغياب -
                                </button>
                                {attendanceMode === 'detailed' && (
                                  <>
                                <button
                                  type="button"
                                  onClick={() => handleToggleBehavior(student.id, 'unwrittenLessons')}
                                  aria-pressed={Boolean(activeSession.unwrittenLessons?.includes(student.id))}
                                  className={`min-h-10 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                                    activeSession.unwrittenLessons?.includes(student.id)
                                      ? 'bg-[var(--accent-gold)] text-[var(--accent-navy)] border-[var(--accent-gold)] shadow-xs' : 'border-slate-200 bg-white text-slate-500 hover:text-amber-700 hover:border-amber-300' }`}
                                  title="لم يكتب الدرس أو أهمل الكراس والواجبات" >
                                  الكراس -
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleBehavior(student.id, 'disruptions')}
                                  aria-pressed={Boolean(activeSession.disruptions?.includes(student.id))}
                                  className={`min-h-10 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                                    activeSession.disruptions?.includes(student.id)
                                      ? 'bg-[var(--text-primary)] text-white border-[var(--text-primary)] shadow-xs' : 'border-slate-200 bg-white text-slate-500 hover:text-[var(--text-primary)] hover:border-slate-400' }`}
                                  title="مخالفة سلوكية وانضباط" >
                                  سلوك -
                                </button>
                                  </>
                                )}
                                {/* Participation stays visible in quick mode: it is the mark that
                                    raises the participation point from 0 upwards. */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleBehavior(student.id, 'goodParticipation')}
                                  aria-pressed={Boolean(activeSession.goodParticipation?.includes(student.id))}
                                  className={`min-h-10 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                                    activeSession.goodParticipation?.includes(student.id)
                                      ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs' : 'border-slate-200 bg-white text-slate-500 hover:text-[var(--primary)] hover:border-[var(--primary)]' }`}
                                  title="مشاركة إيجابية" >
                                  مشاركة +
                                </button>
                              </div>
                            </td>
                            {/* Cumulative Absences */}
                            <td className="p-3 text-center font-bold">
                              <span className={stats.absent >= 3 ? 'text-rose-600' : 'text-slate-700'}>
                                {stats.absent} غ
                              </span>
                            </td>
                            {/* Cumulative Delays */}
                            <td className="p-3 text-center font-bold text-slate-700">
                              سلوك: {stats.disruptions} | كراس: {stats.unwrittenLessons}
                            </td>
                            {/* Participation points (automatic, starting from 0) */}
                            <td className="p-3 text-center font-bold font-mono text-sm border-r border-slate-100 bg-slate-50/50">
                              <span className={participationPoints > 0 ? 'text-[var(--primary)]' : 'text-slate-400'}>
                                {participationPoints.toFixed(2)} / {participationMax}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

              {/* Seating Guide Legend */}
              <div className="bg-white rounded-xl p-3 border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-3 text-slate-600 font-medium">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-slate-900 ml-1">دليل الحالات:</span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-xs whitespace-nowrap">الغياب -</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-xs whitespace-nowrap">الكراس -</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-bold text-xs whitespace-nowrap">سلوك -</span>
                  <span className="px-1.5 py-0.5 rounded bg-[var(--primary-soft)] text-[var(--primary-ink)] font-bold text-xs whitespace-nowrap">مشاركة +</span>
                </div>
                <div className="text-xs text-slate-500">
                  💡 انقر على حالة التلميذ للتبديل: حاضر ← متأخر ← مبرَّر ← غائب (في الوضع المفصّل). نقطة المشاركة تُحتسب على الحصص الموثّقة فقط، وتكتمل بـ5 نقاط تقدير في «مراجعة التقويم».
                </div>
              </div>
          </div>
        </div>
      )}


      {/* تأكيد توليد حصص الفصل: إجراء جماعي يُنشئ عشرات السجلات */}
      <AccessibleDialog
        open={showGenerateConfirm}
        titleId="generate-sessions-title"
        onClose={() => setShowGenerateConfirm(false)}
        className="w-full max-w-md rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 text-right shadow-xl"
      >
        <h3 id="generate-sessions-title" className="text-lg font-bold text-[var(--text-primary)]">
          توليد حصص {trimesterLabel(activeTrimester)}
        </h3>
        <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
          سيُنشئ التطبيق حصصًا لكل أسبوع في هذا الفصل وفق جدول التوقيت، مع تجاهل أيام العطل.
          الحصص الموجودة مسبقًا لن تتكرر.
        </p>
        <p className="mt-2 rounded-xl bg-[var(--bg-surface-subtle)] px-3 py-2 text-xs text-[var(--text-secondary)]">
          العدد المتوقع لا يتجاوز 100 حصة. بعد التوليد يمكنك حذف أي حصة من السجل.
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setShowGenerateConfirm(false)}
            className="min-h-11 rounded-xl border border-[var(--border-default)] px-4 text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)]"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleGenerateTrimesterSessions}
            className="min-h-11 rounded-xl bg-[var(--primary)] px-4 text-xs font-bold text-white hover:bg-[var(--primary-hover)]"
          >
            توليد الآن
          </button>
        </div>
      </AccessibleDialog>

      {/* جولة الكراس — تفتيش سريع لدفعة من التلاميذ في الحصة الحالية */}
      <AccessibleDialog
        open={isNotebookOpen}
        titleId="notebook-round-title"
        onClose={() => setIsNotebookOpen(false)}
        className="flex max-h-[90vh] w-full max-w-lg flex-col gap-3 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 text-right shadow-xl sm:p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 id="notebook-round-title" className="text-base font-black text-[var(--text-primary)]">
              {notebookRounds > 1 ? `جولة الكراس ${notebookRound}` : 'جولة الكراس'}
            </h3>
            <p className="mt-1 text-xs leading-6 text-[var(--text-secondary)]">
              {notebookRounds > 1
                ? `افتح كراس 8–10 تلاميذ فقط في هذه الحصة، ويُكمل بقية القسم في حصة أخرى حتى يكتمل العدد (${notebookProgress.inspected}/${notebookProgress.total}).`
                : notebookNeedsReview
                  ? 'اكتملت الجولة لهذا الفصل. يمكنك تعديل أي درجة ثم الحفظ؛ ولا حاجة لجولة ثانية.'
                  : `جولة واحدة في الفصل: افتح كراس 8–10 تلاميذ فقط في هذه الحصة، ويُكمل بقية القسم في حصة أخرى حتى يكتمل العدد (${notebookProgress.inspected}/${notebookProgress.total}).`}
            </p>
          </div>
          <span className="shrink-0 rounded-lg bg-[var(--primary-soft)] px-2 py-1 font-mono text-xs font-bold text-[var(--primary-ink)]">
            {notebookProgress.inspected}/{notebookProgress.total}
          </span>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pe-1">
          {classStudents.map(student => {
            const selected = notebookDraft[student.id];
            const checkedInRound = notebookChecks[student.id]?.[notebookRound];
            const otherRound = otherRoundInSession(student.id);
            return (
              <div key={student.id} className="rounded-xl border border-[var(--border-subtle)] bg-white p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-bold text-[var(--text-primary)]">
                    <span className="me-1.5 font-mono text-[var(--text-tertiary)]">{student.numberInList}</span>
                    {student.fullName}
                  </span>
                  {otherRound && (
                    <span className="shrink-0 rounded bg-[var(--bg-page)] px-1.5 py-0.5 text-xs text-[var(--text-tertiary)]">
                      سُجّل سابقاً
                    </span>
                  )}
                  {!otherRound && checkedInRound && selected === undefined && (
                    <span className="shrink-0 rounded bg-[var(--bg-page)] px-1.5 py-0.5 text-xs text-[var(--text-tertiary)]">
                      سُجّل {checkedInRound.score}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 grid grid-cols-4 gap-1">
                  {NOTEBOOK_SCORE_CHOICES.map(choice => {
                    const isSelected = selected === choice.score;
                    return (
                      <button
                        key={choice.score}
                        type="button"
                        aria-pressed={isSelected}
                        title={choice.hint}
                        disabled={otherRound !== null}
                        onClick={() => {
                          triggerHapticFeedback();
                          setNotebookDraft(prev => ({ ...prev, [student.id]: choice.score }));
                        }}
                        className={`min-h-9 rounded-lg border text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          isSelected
                            ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                            : 'border-[var(--border-default)] bg-white text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)]'
                        }`}
                      >
                        {choice.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[var(--border-subtle)] pt-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setIsNotebookOpen(false)}
            className="min-h-11 rounded-xl border border-[var(--border-default)] px-4 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)]"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={() => void handleSaveNotebookRound()}
            disabled={pendingNotebookUpdates.length === 0}
            className="min-h-11 rounded-xl bg-[var(--primary)] px-5 text-xs font-bold text-white transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            حفظ {pendingNotebookUpdates.length} تفتيشاً
          </button>
        </div>
      </AccessibleDialog>

      {/* مراجعة إلزامية قبل إنهاء الحضور: لا حفظ بلا رؤية الملخص */}
      <AccessibleDialog
        open={showFinishReview}
        titleId="finish-attendance-title"
        describedBy="finish-attendance-summary"
        onClose={() => setShowFinishReview(false)}
        className="w-full max-w-md rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 text-right shadow-xl"
      >
        <h3 id="finish-attendance-title" className="text-lg font-bold text-[var(--text-primary)]">
          مراجعة الحضور قبل الإنهاء
        </h3>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          {activeClass?.name} — {trimesterLabel(activeTrimester)} — {activeSession?.date}
        </p>

        <div id="finish-attendance-summary" className="mt-4 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
            <div className="text-lg font-black text-emerald-800">{presentCount}</div>
            <div className="text-xs font-bold text-emerald-700">حاضر</div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
            <div className="text-lg font-black text-amber-800">{lateCount}</div>
            <div className="text-xs font-bold text-amber-700">متأخر</div>
          </div>
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2">
            <div className="text-lg font-black text-sky-800">{excusedCount}</div>
            <div className="text-xs font-bold text-sky-700">غائب مبرر</div>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
            <div className="text-lg font-black text-rose-800">{absentCount}</div>
            <div className="text-xs font-bold text-rose-700">غائب</div>
          </div>
        </div>

        <p className="mt-4 rounded-xl bg-[var(--bg-surface-subtle)] px-3 py-2 text-xs leading-5 text-[var(--text-secondary)]">
          بعد الإنهاء تُنقل إلى دفتر النصوص لتوثيق الحصة. يمكنك تعديل الحضور لاحقًا من سجل الحصص،
          لكن المخالفات والملاحظات المسجّلة هنا هي ما سيُحتسب في {trimesterLabel(activeTrimester)}.
        </p>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setShowFinishReview(false)}
            className="min-h-11 rounded-xl border border-[var(--border-default)] px-4 text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)]"
          >
            رجوع للتعديل
          </button>
          <button
            type="button"
            onClick={() => void handleFinishAttendance()}
            disabled={isSavingAll}
            className="min-h-11 rounded-xl bg-[var(--primary)] px-4 text-xs font-bold text-white transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingAll ? 'جارٍ الحفظ…' : 'تأكيد وإنهاء'}
          </button>
        </div>
      </AccessibleDialog>
    </div>
  );
};
