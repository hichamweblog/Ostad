'use client';

import React, { useState, useRef } from 'react';
import { AppState } from '@/lib/storage';
import { CurriculumUnit, SessionRecord } from '@/lib/types';
import { getMergedCurriculumUnits } from '@/lib/curriculum-data';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  BookOpen,
  Users,
  Lightbulb,
  Plus,
  Save,
  Trash2,
  Calendar,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  History,
  FileText,
  Search,
  Bold,
  List,
  ListOrdered,
  Quote,
  Check,
  ChevronDown,
  FileDown
} from 'lucide-react';
import { exportToDoc } from '@/lib/utils';

interface SessionCahierProps {
  state: AppState;
  onUpdateState: (updater: (prev: AppState) => AppState) => void;
}

interface FormattingBarProps {
  val: string;
  setter: React.Dispatch<React.SetStateAction<string>>;
}

const FormattingBar: React.FC<FormattingBarProps> = ({ setter }) => {
  const handleApply = (prefix: string, suffix: string = '') => {
    setter(prev => {
      if (!prev) return `${prefix}${suffix}`;
      return `${prev}\n${prefix}${suffix}`;
    });
  };

  return (
    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-t-lg text-slate-600 text-[11px]">
      <button
        type="button"
        onClick={() => handleApply('**', '**')}
        className="px-1.5 py-0.5 rounded hover:bg-slate-200 font-bold flex items-center gap-0.5 cursor-pointer"
        title="نص عريض"
      >
        <Bold className="w-3 h-3" />
        <span className="hidden sm:inline">عريض</span>
      </button>
      <button
        type="button"
        onClick={() => handleApply('﴿ ', ' ﴾')}
        className="px-1.5 py-0.5 rounded hover:bg-emerald-100 text-emerald-800 font-bold cursor-pointer"
        title="إدراج قوس آية قرآنية"
      >
        ﴿ آية ﴾
      </button>
      <button
        type="button"
        onClick={() => handleApply('« ', ' »')}
        className="px-1.5 py-0.5 rounded hover:bg-blue-100 text-blue-800 font-bold cursor-pointer"
        title="إدراج قوس حديث نبوي"
      >
        « حديث »
      </button>
      <button
        type="button"
        onClick={() => handleApply('• ')}
        className="px-1.5 py-0.5 rounded hover:bg-slate-200 flex items-center gap-0.5 cursor-pointer"
        title="نقطة تعداد"
      >
        <List className="w-3 h-3" />
        <span className="hidden sm:inline">نقطة</span>
      </button>
      <button
        type="button"
        onClick={() => handleApply('1. ')}
        className="px-1.5 py-0.5 rounded hover:bg-slate-200 flex items-center gap-0.5 cursor-pointer"
        title="ترقيم"
      >
        <ListOrdered className="w-3 h-3" />
        <span className="hidden sm:inline">ترقيم</span>
      </button>
    </div>
  );
};

export const SessionCahier: React.FC<SessionCahierProps> = ({
  state,
  onUpdateState
}) => {
  const activeClass = state.classes.find(c => c.id === state.activeClassId);

  const availableUnits = getMergedCurriculumUnits(state.customUnits).filter(
    u => u.level === activeClass?.level
  );

  // Active form state for logging a session
  const todayStr = new Date().toISOString().split('T')[0];
  const [sessionDate, setSessionDate] = useState(todayStr);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [selectedUnitId, setSelectedUnitId] = useState<string>(
    availableUnits[0]?.id || ''
  );
  const [sessionGoals, setSessionGoals] = useState('');
  const [accomplishments, setAccomplishments] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [teacherNotes, setTeacherNotes] = useState('');

  // Pedagogical Memory fields
  const [memoryWhatWorked, setMemoryWhatWorked] = useState('');
  const [memoryWhatFailed, setMemoryWhatFailed] = useState('');
  const [memoryDifficulty, setMemoryDifficulty] = useState('');
  const [memoryNextTimeChange, setMemoryNextTimeChange] = useState('');

  // Curriculum Extraction Modal State
  const [curriculumSearch, setCurriculumSearch] = useState('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<number | 'all'>('all');

  const [savedSuccessMsg, setSavedSuccessMsg] = useState(false);

  // Helper for applying markdown or symbols into a specific state field
  const applyFormat = (
    getter: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
    prefix: string,
    suffix: string = ''
  ) => {
    setter(prev => {
      if (!prev) return `${prefix}${suffix}`;
      return `${prev}\n${prefix}${suffix}`;
    });
  };

  // Helper to extract official objectives from curriculum database
  const getObjectivesFromUnit = (unit: CurriculumUnit): string => {
    const parts: string[] = [];
    if (unit.learningObjective) {
      parts.push(`• الهدف التعلمي الأساسي: ${unit.learningObjective}`);
    }
    if (unit.targetedCompetence) {
      parts.push(`• الكفاءة المستهدفة: ${unit.targetedCompetence}`);
    }
    if (unit.targetedResources && unit.targetedResources.length > 0) {
      parts.push(`• الموارد المعرفية والمفاهيمية المستهدفة:`);
      unit.targetedResources.forEach(res => parts.push(`  - ${res}`));
    }
    if (unit.indicators && unit.indicators.length > 0) {
      parts.push(`• مؤشرات الكفاءة والتقويم:`);
      unit.indicators.forEach(ind => parts.push(`  - ${ind}`));
    }
    if (unit.referenceTexts && unit.referenceTexts.length > 0) {
      parts.push(`• السندات الشرعية المؤطرة:`);
      unit.referenceTexts.forEach(txt => parts.push(`  « ${txt} »`));
    }
    return parts.join('\n');
  };

  // When selected unit changes, fill objectives automatically from curriculum DB
  const handleSelectUnit = (unitId: string) => {
    setSelectedUnitId(unitId);
    const unit = availableUnits.find(u => u.id === unitId);
    if (unit) {
      setSessionGoals(getObjectivesFromUnit(unit));
    }
  };

  // Explicit button action to re-fetch/update objectives from curriculum database
  const handleFetchObjectivesFromDB = () => {
    const unit = availableUnits.find(u => u.id === selectedUnitId);
    if (unit) {
      setSessionGoals(getObjectivesFromUnit(unit));
    }
  };

  // Check if teacher has prior pedagogical memories for this selected unit
  const previousMemoryForThisUnit = state.sessions.find(
    s => s.unitId === selectedUnitId && (s.memoryWhatWorked || s.memoryNextTimeChange || s.memoryDifficulty)
  );

  // Save Session
  const handleSaveSession = () => {
    if (!state.activeClassId) {
      alert('يرجى تحديد القسم أولاً');
      return;
    }

    const newSession: SessionRecord = {
      id: `ses-${Date.now()}`,
      classId: state.activeClassId,
      unitId: selectedUnitId,
      date: sessionDate,
      startTime,
      endTime,
      sessionGoals,
      accomplishments,
      nextSteps,
      teacherNotes,
      memoryWhatWorked,
      memoryWhatFailed,
      memoryDifficulty,
      memoryNextTimeChange,
      attendance: {}
    };

    onUpdateState(prev => {
      const existingProgIdx = prev.lessonProgress.findIndex(
        p => p.classId === prev.activeClassId && p.unitId === selectedUnitId
      );
      let newProg = [...prev.lessonProgress];
      if (existingProgIdx >= 0) {
        newProg[existingProgIdx] = {
          ...newProg[existingProgIdx],
          status: 'COMPLETED',
          completedAt: sessionDate
        };
      } else {
        newProg.push({
          id: `prog-${Date.now()}`,
          classId: prev.activeClassId!,
          unitId: selectedUnitId,
          status: 'COMPLETED',
          completedAt: sessionDate
        });
      }

      return {
        ...prev,
        sessions: [newSession, ...prev.sessions],
        lessonProgress: newProg
      };
    });

    setSavedSuccessMsg(true);
    setTimeout(() => setSavedSuccessMsg(false), 3500);

    // Reset accomplishments for next entry
    setAccomplishments('');
    setNextSteps('');
    setTeacherNotes('');
  };

  const handleDeleteSession = (sessionId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا السجل من الدفتر اليومي؟')) {
      onUpdateState(prev => ({
        ...prev,
        sessions: prev.sessions.filter(s => s.id !== sessionId)
      }));
    }
  };

  const classPastSessions = state.sessions.filter(
    s => s.classId === state.activeClassId
  );

  const selectedUnitObj = availableUnits.find(u => u.id === selectedUnitId);

  // Export Cahier de texte to Word (.doc)

  const handleExportMarkdown = () => {
    let mdContent = `# دفتر النصوص - قسم ${activeClass?.name}

`;
    classPastSessions.forEach((s, idx) => {
      const unitObj = availableUnits.find(u => u.id === s.unitId);
      const title = unitObj?.title || s.customTopic || 'حصة تعلمية';
      const domain = unitObj?.domain || '—';
      const timeSlot = s.startTime && s.endTime ? `${s.startTime} - ${s.endTime}` : (s.startTime || '—');

      mdContent += `## الحصة رقم ${classPastSessions.length - idx}: ${title} (${s.date})
`;
      mdContent += `- التوقيت: ${timeSlot}
`;
      mdContent += `- الميدان: ${domain}
`;
      
      if (s.sessionGoals) mdContent += `
### أهداف الحصة
${s.sessionGoals}
`;
      if (s.accomplishments) mdContent += `
### ما تم إنجازه وبناؤه في الحصة
${s.accomplishments}
`;
      if (s.nextSteps) mdContent += `
### المعالجة والواجبات
${s.nextSteps}
`;
      if (s.teacherNotes) mdContent += `
### الملاحظات والذاكرة البيداغوجية
${s.teacherNotes}
`;
      mdContent += `
---

`;
    });

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `دفتر_النصوص_${activeClass?.name || 'القسم'}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCahierDoc = () => {
    const rowsHtml = classPastSessions.map((s, idx) => {
      const unitObj = availableUnits.find(u => u.id === s.unitId);
      const title = unitObj?.title || s.customTopic || 'حصة تعلمية';
      const domain = unitObj?.domain || '—';
      const timeSlot = s.startTime && s.endTime ? `${s.startTime} - ${s.endTime}` : (s.startTime || '—');
      return `
        <tr>
          <td style="border: 1px solid #94a3b8; padding: 6px; text-align: center; font-weight: bold;">${classPastSessions.length - idx}</td>
          <td style="border: 1px solid #94a3b8; padding: 6px; text-align: center;">${s.date}</td>
          <td style="border: 1px solid #94a3b8; padding: 6px; text-align: center;">${timeSlot}</td>
          <td style="border: 1px solid #94a3b8; padding: 6px; text-align: right;"><strong>${title}</strong></td>
          <td style="border: 1px solid #94a3b8; padding: 6px; text-align: right;">${domain}</td>
        </tr>
      `;
    }).join('');

    const detailsHtml = classPastSessions.map((s, idx) => {
      const unitObj = availableUnits.find(u => u.id === s.unitId);
      const title = unitObj?.title || s.customTopic || 'حصة تعلمية';
      const domain = unitObj?.domain || '—';
      const timeSlot = s.startTime && s.endTime ? `${s.startTime} - ${s.endTime}` : (s.startTime || '—');
      return `
        <div style="margin-bottom: 25px; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px;">
          <h3 style="color: #0d2c3b;">الحصة رقم ${classPastSessions.length - idx}: ${title} (${s.date})</h3>
          <p><strong>التوقيت:</strong> ${timeSlot} | <strong>الميدان:</strong> ${domain}</p>
          ${s.sessionGoals ? `<h4>أهداف الحصة:</h4><p style="white-space: pre-wrap;">${s.sessionGoals}</p>` : ''}
          ${s.accomplishments ? `<h4>ما تم إنجازه وبناؤه في الحصة:</h4><p style="white-space: pre-wrap;">${s.accomplishments}</p>` : ''}
          ${s.nextSteps ? `<h4>المعالجة والواجبات:</h4><p style="white-space: pre-wrap;">${s.nextSteps}</p>` : ''}
          ${s.teacherNotes ? `<h4>الملاحظات والذاكرة البيداغوجية:</h4><p style="white-space: pre-wrap;">${s.teacherNotes}</p>` : ''}
        </div>
      `;
    }).join('');

    const html = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #0d2c3b;">الجمهورية الجزائرية الديمقراطية الشعبية</h2>
        <h3 style="color: #0d2c3b;">وزارة التربية الوطنية</h3>
        <h2 style="color: #0e7c61;">دفتر النصوص وسجل الحصص اليومي الرقمي — مادة العلوم الإسلامية</h2>
        <p><strong>المؤسسة:</strong> ${state.profile?.schoolName || 'ثانوية التعليم الثانوي'} | <strong>الأستاذ(ة):</strong> ${state.profile?.name || 'أستاذ المادة'} | <strong>السنة الدراسية:</strong> ${state.profile?.academicYear || '2025/2026'}</p>
        <p><strong>الفوج التربوي:</strong> ${activeClass?.name || 'القسم'} (${activeClass?.stream || ''}) | <strong>عدد الحصص الموثقة:</strong> ${classPastSessions.length}</p>
      </div>
      <hr/>
      <h3>جدول الحصص المنجزة زمنياً:</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <thead>
          <tr style="background-color: #f1f5f9; font-weight: bold;">
            <th style="border: 1px solid #94a3b8; padding: 6px; text-align: center; width: 8%;">الرقم</th>
            <th style="border: 1px solid #94a3b8; padding: 6px; text-align: center; width: 16%;">التاريخ</th>
            <th style="border: 1px solid #94a3b8; padding: 6px; text-align: center; width: 16%;">التوقيت</th>
            <th style="border: 1px solid #94a3b8; padding: 6px; text-align: right; width: 38%;">عنوان الوحدة / الدرس</th>
            <th style="border: 1px solid #94a3b8; padding: 6px; text-align: right; width: 22%;">الميدان</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
      <br/><hr/>
      <h3>تفاصيل وسير الحصص المسجلة:</h3>
      ${detailsHtml}
    `;

    exportToDoc(html, `دفتر_نصوص_${activeClass?.name || 'القسم'}`);
  };

  // Export Pedagogical Memory to Word (.doc)
  const handleExportPedagogicalMemoryDoc = () => {
    const memorySessions = classPastSessions.filter(
      s => s.memoryWhatWorked || s.memoryDifficulty || s.memoryWhatFailed || s.memoryNextTimeChange || s.teacherNotes
    );

    const memoryRows = memorySessions.map((s, idx) => {
      const unitObj = availableUnits.find(u => u.id === s.unitId);
      const title = unitObj?.title || s.customTopic || 'حصة تعلمية';
      return `
        <div style="margin-bottom: 25px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; background-color: #fafaf9;">
          <h3 style="color: #0d2c3b; margin-top: 0;">الحصة ${idx + 1}: ${title} — ${s.date}</h3>
          ${s.memoryWhatWorked ? `<p style="color: #065f46;"><strong>✓ ماذا نجح في الحصة؟</strong><br/>${s.memoryWhatWorked}</p>` : ''}
          ${s.memoryDifficulty ? `<p style="color: #991b1b;"><strong>⚠ ما الصعوبة التي واجهت المتعلمين؟</strong><br/>${s.memoryDifficulty}</p>` : ''}
          ${s.memoryWhatFailed ? `<p style="color: #c2410c;"><strong>✕ ماذا لم ينجح كما هو متوقع؟</strong><br/>${s.memoryWhatFailed}</p>` : ''}
          ${s.memoryNextTimeChange ? `<p style="color: #1e40af;"><strong>💡 ما الذي يجب تغييره للمرة القادمة؟</strong><br/>${s.memoryNextTimeChange}</p>` : ''}
          ${s.teacherNotes ? `<p style="color: #334155;"><strong>سجل الملاحظات العامة:</strong><br/>${s.teacherNotes}</p>` : ''}
        </div>
      `;
    }).join('');

    const html = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #0d2c3b;">الجمهورية الجزائرية الديمقراطية الشعبية</h2>
        <h3 style="color: #0d2c3b;">وزارة التربية الوطنية</h3>
        <h2 style="color: #b45309;">دفتر الذاكرة البيداغوجية والتقييم الذاتي للأستاذ</h2>
        <p><strong>الأستاذ(ة):</strong> ${state.profile?.name || 'أستاذ المادة'} | <strong>المؤسسة:</strong> ${state.profile?.schoolName || 'ثانوية التعليم الثانوي'} | <strong>السنة الدراسية:</strong> ${state.profile?.academicYear || '2025/2026'}</p>
        <p><strong>القسم:</strong> ${activeClass?.name || 'جميع الأقسام'} | <strong>عدد السجلات البيداغوجية:</strong> ${memorySessions.length}</p>
      </div>
      <hr/>
      ${memoryRows.length > 0 ? memoryRows : '<p style="text-align:center;">لا توجد سجلات ذاكرة بيداغوجية مسجلة حتى الآن.</p>'}
    `;

    exportToDoc(html, `دفتر_الذاكرة_البيداغوجية_${activeClass?.name || 'القسم'}`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6" id="session-cahier-view">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-[#0E7C61]" />
            <span>دفتر النصوص</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            توثيق الحصص المنجزة زمنياً، استخراج الدروس من المنهاج الرسمي، وتدوين الملاحظات البيداغوجية
          </p>
        </div>

        {/* Actions & Class Selection */}
        <div className="flex items-center gap-2 flex-wrap">
          {classPastSessions.length > 0 && (
            <>
              <button
                onClick={handleExportCahierDoc}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="تصدير دفتر النصوص كاملاً إلى ملف Word (.doc)"
              >
                <FileDown className="w-3.5 h-3.5 text-emerald-200" />
                <span>تصدير دفتر النصوص (.doc)</span>
              </button>
              <button
                onClick={handleExportPedagogicalMemoryDoc}
                className="px-3.5 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="تصدير دفتر الذاكرة البيداغوجية وسجلات التقييم الذاتي إلى ملف Word (.doc)"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-200" />
                <span>دفتر الذاكرة البيداغوجية (.doc)</span>
              </button>
            </>
          )}

          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#0d6547]" />
            <span>القسم النشط: {activeClass?.name || 'لم يحدد'}</span>
          </div>
        </div>
      </div>

      {savedSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="font-bold">تم توثيق الحصة وتحديث حالة الإنجاز في المنهاج بنجاح.</span>
        </div>
      )}

      {/* Session Entry Form */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#0d6547]" />
                <span>بيانات الحصة والوحدة المقررة</span>
              </h3>
            </div>

            {/* Date, Time & Unit Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">تاريخ الحصة:</label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={e => setSessionDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-slate-900 focus:ring-1 focus:ring-[#0d6547]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">من الساعة:</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-slate-900 focus:ring-1 focus:ring-[#0d6547]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">إلى الساعة:</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-slate-900 focus:ring-1 focus:ring-[#0d6547]"
                />
              </div>
            </div>

            {/* Lesson / Unit Picker */}
            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-700 flex items-center justify-between">
                <span>موضوع الدرس / الوحدة التعلمية المقررة:</span>
                {selectedUnitObj && (
                  <span className="text-[#0d6547] font-semibold">
                    الميدان: {selectedUnitObj.domain} • الحجم: {selectedUnitObj.hourlyVolume} سا
                  </span>
                )}
              </label>
              <select
                value={selectedUnitId}
                onChange={e => handleSelectUnit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-1 focus:ring-[#0d6547] cursor-pointer bg-white"
              >
                {availableUnits.map(unit => (
                  <option key={unit.id} value={unit.id}>
                    الوحدة {unit.unitNumber}: {unit.title} ({unit.domain})
                  </option>
                ))}
              </select>
            </div>

            {/* Prior Pedagogical Memory Notification if available */}
            {previousMemoryForThisUnit && (
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs space-y-1">
                <div className="font-black text-amber-900 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span>ذاكرة سابقة مسجلة لنفس هذا الدرس:</span>
                </div>
                {previousMemoryForThisUnit.memoryWhatWorked && (
                  <p className="text-emerald-900 text-[11px]">
                    <span className="font-bold">ما نجح: </span>{previousMemoryForThisUnit.memoryWhatWorked}
                  </p>
                )}
                {previousMemoryForThisUnit.memoryNextTimeChange && (
                  <p className="text-blue-900 text-[11px]">
                    <span className="font-bold">توجيه التعديل: </span>{previousMemoryForThisUnit.memoryNextTimeChange}
                  </p>
                )}
              </div>
            )}

            {/* Objectives (Static View) */}
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between gap-2 flex-wrap pb-0.5">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#0d6547]" />
                  <span>الأهداف التعلمية المسطرة للحصة:</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-normal text-[10px] hidden sm:inline">مستخرجة آلياً من قاعدة البيانات</span>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden p-3 min-h-[60px]">
                {sessionGoals ? (
                  <div className="whitespace-pre-wrap text-slate-700 font-medium leading-relaxed">{sessionGoals}</div>
                ) : (
                  <span className="text-slate-400 italic">اختر وحدة تعليمية لعرض أهدافها...</span>
                )}
              </div>
            </div>

            {/* Accomplishments & Course Progress (Text Area + Format Toolbar) */}
            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-700 flex items-center justify-between">
                <span>ما تم إنجازه وسير الدرس والمناقشات:</span>
                <span className="text-slate-400 font-normal text-[10px]">Text Area مع إمكانية التنسيق</span>
              </label>
              <div className="rounded-xl border border-slate-300 overflow-hidden focus-within:ring-1 focus-within:ring-[#0d6547]">
                <FormattingBar val={accomplishments} setter={setAccomplishments} />
                <textarea
                  rows={4}
                  value={accomplishments}
                  onChange={e => setAccomplishments(e.target.value)}
                  placeholder="• تم التطرق إلى العنصر الأول والثاني ومناقشة الشواهد القرآنية مع المتعلمين...&#10;• إنجاز النشاط التطبيقي رقم 1 في الكراس..."
                  className="w-full px-3 py-2 text-slate-900 border-0 focus:outline-none text-xs leading-relaxed"
                />
              </div>
            </div>

            {/* Next Steps & Homework (Text Area + Format Toolbar) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  التوجيهات والواجب للحصة القادمة:
                </label>
                <div className="rounded-xl border border-slate-300 overflow-hidden focus-within:ring-1 focus-within:ring-[#0d6547]">
                  <FormattingBar val={nextSteps} setter={setNextSteps} />
                  <textarea
                    rows={3}
                    value={nextSteps}
                    onChange={e => setNextSteps(e.target.value)}
                    placeholder="• تحضير نص الإسناد ص 45&#10;• حفظ الأبيات أو السند الشرعي..."
                    className="w-full px-3 py-2 text-slate-900 border-0 focus:outline-none text-xs leading-relaxed"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  ملاحظات عامة حول القسم والانضباط:
                </label>
                <div className="rounded-xl border border-slate-300 overflow-hidden focus-within:ring-1 focus-within:ring-[#0d6547]">
                  <FormattingBar val={teacherNotes} setter={setTeacherNotes} />
                  <textarea
                    rows={3}
                    value={teacherNotes}
                    onChange={e => setTeacherNotes(e.target.value)}
                    placeholder="• تفاعل ممتاز ومشاركة فعالة من أغلب التلاميذ...&#10;• التنبيه على إحضار الكتاب المدرسي..."
                    className="w-full px-3 py-2 text-slate-900 border-0 focus:outline-none text-xs leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Pedagogical Memory Accordion Box (All Text Areas) */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span>دفتر الذاكرة البيداغوجية (تطوير ذاتي وتوثيق تراكمي)</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                تتحول هذه المدخلات إلى مراجع فورية تُستحضر تلقائياً عند تدريس نفس الوحدة مستقبلاً
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-emerald-800">ماذا نجح في هذه الحصة؟</label>
                  <div className="rounded-xl border border-slate-300 bg-white overflow-hidden focus-within:ring-1 focus-within:ring-emerald-600">
                    <FormattingBar val={memoryWhatWorked} setter={setMemoryWhatWorked} />
                    <textarea
                      rows={2}
                      value={memoryWhatWorked}
                      onChange={e => setMemoryWhatWorked(e.target.value)}
                      placeholder="استعمال الأمثلة الواقعية، الاستدلال بالحديث، العمل بالأفواج..."
                      className="w-full px-2.5 py-1.5 border-0 focus:outline-none text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-rose-800">ما الصعوبة التي واجهت التلاميذ؟</label>
                  <div className="rounded-xl border border-slate-300 bg-white overflow-hidden focus-within:ring-1 focus-within:ring-rose-600">
                    <FormattingBar val={memoryDifficulty} setter={setMemoryDifficulty} />
                    <textarea
                      rows={2}
                      value={memoryDifficulty}
                      onChange={e => setMemoryDifficulty(e.target.value)}
                      placeholder="صعوبة ضبط الفوارق الفقهية، مصطلحات السند..."
                      className="w-full px-2.5 py-1.5 border-0 focus:outline-none text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-blue-800">
                    ما الذي يجب تغييره أو تحسينه في المرة القادمة؟
                  </label>
                  <div className="rounded-xl border border-slate-300 bg-white overflow-hidden focus-within:ring-1 focus-within:ring-blue-600">
                    <FormattingBar val={memoryNextTimeChange} setter={setMemoryNextTimeChange} />
                    <textarea
                      rows={2}
                      value={memoryNextTimeChange}
                      onChange={e => setMemoryNextTimeChange(e.target.value)}
                      placeholder="تخصيص 15 دقيقة للتطبيقات الكتابية الفردية بدل الشفوي فقط..."
                      className="w-full px-2.5 py-1.5 border-0 focus:outline-none text-xs text-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit button */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSaveSession}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0d6547] hover:bg-[#0b543b] text-white text-xs font-black shadow-md cursor-pointer transition-all"
                id="btn-save-session-record"
              >
                <Save className="w-4 h-4" />
                <span>حفظ الحصة في الدفتر اليومي وتأكيد الإنجاز</span>
              </button>
            </div>
      </div>

      {/* Historical Sessions Log */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-700" />
            <span>سجل الحصص السابقة لقسم {activeClass?.name} ({classPastSessions.length} حصة)</span>
          </h3>
        </div>

        {classPastSessions.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            لم تسجل بعد أي حصة لهذا القسم. استخدم النموذج أعلاه لتدوين أول حصة.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {classPastSessions.map(ses => {
              const unit = availableUnits.find(u => u.id === ses.unitId);

              return (
                <div key={ses.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {ses.date}
                      </span>
                      <span className="text-slate-500 font-mono">
                        {ses.startTime} – {ses.endTime}
                      </span>
                      <span className="font-bold text-slate-900">
                        {unit ? unit.title : 'حصة غير محددة'}
                      </span>
                    </div>
                    {ses.accomplishments && (
                      <p className="text-slate-600 text-xs whitespace-pre-line">
                        <span className="font-semibold text-slate-700">ما تم إنجازه: </span>
                        {ses.accomplishments}
                      </p>
                    )}
                    {ses.nextSteps && (
                      <p className="text-slate-500 text-[11px] whitespace-pre-line">
                        <span className="font-semibold text-slate-600">التوجيهات: </span>
                        {ses.nextSteps}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteSession(ses.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    title="حذف الحصة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
