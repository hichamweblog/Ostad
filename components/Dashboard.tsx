'use client';

import React, { useState } from 'react';
import { AppState, exportBackupJSON } from '@/lib/storage';
import { SanadTab } from './SidebarSanad';
import { OFFICIAL_CURRICULUM } from '@/lib/curriculum-data';
import {
  Clock,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  Users,
  ArrowLeft,
  CalendarDays,
  CalendarRange,
  Printer,
  Edit3,
  BarChart3,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  FileText,
  Download,
  ExternalLink,
  ShieldCheck,
  X
} from 'lucide-react';

interface DashboardProps {
  state: AppState;
  onNavigate: (tab: SanadTab) => void;
  onUpdateState: (updater: (prev: AppState) => AppState) => void;
}

interface UrgentTask {
  id: string;
  text: string;
  done: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  state,
  onNavigate,
  onUpdateState
}) => {
  // Urgent tasks state with localStorage persistence
  const [tasks, setTasks] = useState<UrgentTask[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sanad_urgent_tasks');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return [
      { id: 't-1', text: 'تصدير قائمة التلاميذ (2 ع ت) للرقمنة', done: false },
      { id: 't-2', text: 'تجهيز مذكرة الفقه وأصوله (الربا)', done: true },
      { id: 't-3', text: 'تحليل نتائج مجلس قسم 3 آداب وفلسفة', done: false }
    ];
  });

  const [newTaskText, setNewTaskText] = useState('');
  const [showTaskInput, setShowTaskInput] = useState(false);
  const [isTodaySessionsModalOpen, setIsTodaySessionsModalOpen] = useState(false);

  const saveTasks = (newTasks: UrgentTask[]) => {
    setTasks(newTasks);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sanad_urgent_tasks', JSON.stringify(newTasks));
    }
  };

  const toggleTask = (id: string) => {
    const updated = tasks.map(t => (t.id === id ? { ...t, done: !t.done } : t));
    saveTasks(updated);
  };

  const addTask = () => {
    if (!newTaskText.trim()) return;
    const updated = [
      ...tasks,
      { id: `t-${Date.now()}`, text: newTaskText.trim(), done: false }
    ];
    saveTasks(updated);
    setNewTaskText('');
    setShowTaskInput(false);
  };

  const deleteTask = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    saveTasks(updated);
  };

  // Quick JSON Backup Handler
  const handleQuickBackup = () => {
    const jsonStr = exportBackupJSON(state);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `معين_نسخة_احتياطية_${state.profile.name || 'أستاذ'}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Day calculations (Algerian week: Sunday=0 ... Thursday=4)
  const now = new Date();
  const rawDay = now.getDay();
  const currentDayOfWeek = rawDay <= 4 ? rawDay : 0;
  const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const monthNames = [
    'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
    'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  const dateFormatted = `${dayNames[now.getDay()]}، ${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;

  // Today's slots
  const todaySlots = state.timetable
    .filter(slot => slot.dayOfWeek === currentDayOfWeek)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;

  const currentSlotIndex = todaySlots.findIndex(s => s.endTime >= currentTimeStr);
  const activeSlot = currentSlotIndex >= 0 ? todaySlots[currentSlotIndex] : todaySlots[0];
  const activeSlotClass = activeSlot ? state.classes.find(c => c.id === activeSlot.classId) : null;

  // Upcoming topic
  const classProgress = state.lessonProgress.filter(p => p.classId === activeSlot?.classId);
  const completedUnitIds = new Set(
    classProgress.filter(p => p.status === 'COMPLETED').map(p => p.unitId)
  );
  const classUnits = OFFICIAL_CURRICULUM.filter(u => u.level === activeSlotClass?.level);
  const currentUnit = classUnits.find(u => !completedUnitIds.has(u.id)) || classUnits[0];

  // Syllabus progress
  const totalRelevantUnits = state.classes.reduce((acc, cls) => {
    const units = OFFICIAL_CURRICULUM.filter(u => u.level === cls.level);
    return acc + units.length;
  }, 0);
  const totalCompletedUnits = state.lessonProgress.filter(p => p.status === 'COMPLETED').length;
  const syllabusPercentage =
    totalRelevantUnits > 0 ? Math.round((totalCompletedUnits / totalRelevantUnits) * 100) : 45;

  const isDemoData = state.profile.name === 'أستاذ المادة';

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8" id="academic-dashboard">
      {/* Onboarding Banner for New Teachers */}
      {isDemoData && (
        <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--color-navy)] rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-3">مرحباً بك أستاذ(ة) في منصة «معين الأستاذ»</h2>
            <p className="text-sm text-white/90 mb-6 max-w-3xl leading-relaxed">
              تتصفح حالياً المنصة ببيانات تجريبية واقعية للتعرف على مميزاتها.
              للبدء بأسرع طريقة وأكثرها دقة بحسابك الخاص، لا تقم بإدخال الأقسام يدوياً! 
              توجّه إلى <strong className="bg-white/20 px-1.5 py-0.5 rounded mx-1">تسيير الأقسام</strong> ثم اختر استيراد ملف «الرقمنة (Excel)» أو «الممتاز».
              ستقوم المنصة آلياً باكتشاف المستويات، الشعب، وتسجيل جميع تلاميذك بضغطة زر واحدة!
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigate('classes')}
                className="px-5 py-2.5 bg-white text-[#0D2C3B] hover:bg-[var(--primary-soft)] font-bold rounded-xl shadow-lg transition-transform hover:-translate-y-1 cursor-pointer flex items-center gap-2 text-sm w-fit"
              >
                <Users className="w-5 h-5" />
                <span>الذهاب إلى استيراد الأقسام والتلاميذ</span>
              </button>
              <button
                onClick={() => onNavigate('settings')}
                className="px-5 py-2.5 bg-black/20 text-white hover:bg-black/30 font-bold rounded-xl shadow-lg transition-transform hover:-translate-y-1 cursor-pointer flex items-center gap-2 text-sm w-fit border border-white/10"
              >
                <span>إعداد ملفي الشخصي وتفريغ البيانات</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 1. Quiet, Functional Top Header (Clean & Uncluttered) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DDD7CB]">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] font-display tracking-tight">
            أهلاً بك، {(state.profile.name || 'أستاذ المادة').includes('أستاذ') ? (state.profile.name || 'أستاذ المادة') : `الأستاذ(ة) ${state.profile.name}`}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsTodaySessionsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            id="btn-quick-today-sessions"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>إدخال حصص اليوم</span>
          </button>
          <button
            onClick={() => onNavigate('documents')}
            className="px-3 py-2 rounded-xl bg-white hover:bg-stone-50 border border-[#DDD7CB] text-[#0F172A] font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            id="btn-quick-export"
          >
            <FileText className="w-3.5 h-3.5 text-[#64748B]" />
            <span className="hidden sm:inline">تصدير وثيقة (DOC)</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Row (Minimalist, Airy & Spacious) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: إجمالي التلاميذ */}
        <div
          onClick={() => onNavigate('classes')}
          className="bg-white p-5 rounded-2xl border border-[#DDD7CB] shadow-xs hover:border-[var(--primary)] transition-all cursor-pointer"
        >
          <div className="text-xs font-bold text-[#64748B] flex items-center justify-between">
            <span>إجمالي التلاميذ</span>
            <Users className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#0F172A] font-display mt-2">
            {state.students.length === 0 && state.classes.length === 0 ? "0" : state.students.length}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1 font-medium">
            موزعين على {state.classes.length} أقسام
          </div>
        </div>

        {/* Metric 2: الحصص المبرمجة - يفتح نافذة إدخال حصص اليوم */}
        <div
          onClick={() => setIsTodaySessionsModalOpen(true)}
          className="bg-white p-5 rounded-2xl border border-[#DDD7CB] shadow-xs hover:border-[var(--primary)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-[var(--primary)]/50 hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer group"
          title="انقر لإدخال وتوثيق حصص اليوم في الدفتر اليومي"
        >
          <div className="text-xs font-bold text-[#64748B] flex items-center justify-between">
            <span>حصص اليوم المبرمجة</span>
            <CalendarDays className="w-4 h-4 text-[var(--primary)] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#0F172A] font-display mt-2">
            {todaySlots.length} حصص اليوم
          </div>
          <div className="text-[11px] text-[var(--primary)] mt-1 font-bold flex items-center gap-1">
            <span>انقر لإدخال حصص اليوم ←</span>
          </div>
        </div>

        {/* Metric 3: الحصص المنجزة */}
        <div
          onClick={() => onNavigate('sessions')}
          className="bg-white p-5 rounded-2xl border border-[#DDD7CB] shadow-xs hover:border-[var(--primary)] transition-all cursor-pointer"
        >
          <div className="text-xs font-bold text-[#64748B] flex items-center justify-between">
            <span>الدفتر اليومي</span>
            <Edit3 className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#0F172A] font-display mt-2">
            {state.sessions.length} حصة
          </div>
          <div className="text-[11px] text-[#64748B] mt-1 font-medium">موثقة في السجل</div>
        </div>

        {/* Metric 4: تقدم المنهاج */}
        <div
          onClick={() => onNavigate('annual_dist')}
          className="bg-white p-5 rounded-2xl border border-[#DDD7CB] shadow-xs hover:border-[var(--primary)] transition-all cursor-pointer"
        >
          <div className="text-xs font-bold text-[#64748B] flex items-center justify-between">
            <span>تقدم المنهاج</span>
            <span className="text-[11px] font-bold text-[var(--primary)] bg-[var(--primary-soft)] px-2 py-0.5 rounded-md">
              الفصل {state.activeTrimester}
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[var(--primary)] font-display mt-2">
            {syllabusPercentage}%
          </div>
          <div className="w-full bg-[#EBE6DC] rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-[var(--primary)] h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, syllabusPercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Main Two-Column Clean Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* RIGHT COLUMN (8 COLS): Current/Next Class Card + Today's Schedule + Recent Sessions */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active / Next Slot Hero Card */}
          <div className="bg-white rounded-2xl border border-[#DDD7CB] p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-[#EBE6DC] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] animate-pulse" />
                <h3 className="font-black text-sm text-[#0F172A] font-display">
                  {activeSlot ? 'الحصة الجارية الآن أو القادمة' : 'برنامج اليوم'}
                </h3>
              </div>
              <span className="text-xs font-mono text-[#64748B]">{currentTimeStr}</span>
            </div>

            {activeSlot ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF8F4] p-4 rounded-xl border border-[#DDD7CB]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-[#0F172A]">
                        {activeSlotClass?.name || 'قسم ثانوي'}
                      </span>
                      {activeSlotClass?.stream && (
                        <span className="text-xs text-[#475569] font-semibold">
                          ({activeSlotClass.stream})
                        </span>
                      )}
                      {activeSlot.room && (
                        <span className="text-xs text-[#64748B] bg-white px-2 py-0.5 rounded border border-[#DDD7CB]">
                          قاعة {activeSlot.room}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#475569] font-medium">
                      الموضوع المقرر في الحصة الجارية أو القادمة: <span className="font-bold text-[#0F172A]">{currentUnit ? currentUnit.title : 'الوحدة التعلمية المبرمجة'}</span>
                    </p>
                  </div>

                  <div className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-white border border-[#DDD7CB] text-[#0F172A] self-start sm:self-auto shrink-0">
                    {activeSlot.startTime} - {activeSlot.endTime}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (activeSlotClass) {
                        onUpdateState(prev => ({ ...prev, activeClassId: activeSlotClass.id }));
                      }
                      onNavigate('attendance');
                    }}
                    className="flex-1 py-3 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
                    id="btn-open-attendance"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>تسجيل الحضور ومخطط الجلوس</span>
                  </button>

                  <button
                    onClick={() => onNavigate('timetable')}
                    className="px-4 py-3 rounded-xl bg-white hover:bg-stone-50 border border-[#DDD7CB] text-[#0F172A] font-bold text-xs transition-colors cursor-pointer"
                  >
                    جدول الحصص
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[#64748B] bg-[#FAF8F4] rounded-xl border border-dashed border-[#DDD7CB]">
                لا توجد حصص مبرمجة في هذا التوقيت.
              </div>
            )}
          </div>

          {/* Today's Schedule Overview */}
          {todaySlots.length > 1 && (
            <div className="bg-white rounded-2xl border border-[#DDD7CB] p-6 shadow-xs space-y-4">
              <h4 className="font-black text-sm text-[#0F172A] font-display flex items-center justify-between">
                <span>باقي حصص اليوم ({dayNames[currentDayOfWeek]})</span>
                <span className="text-xs text-[#64748B] font-normal font-sans">
                  {todaySlots.length} حصص
                </span>
              </h4>

              <div className="space-y-2">
                {todaySlots.map(slot => {
                  const cls = state.classes.find(c => c.id === slot.classId);
                  const isCurrent = slot.id === activeSlot?.id;
                  return (
                    <div
                      key={slot.id}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-colors ${
                        isCurrent
                          ? 'bg-[var(--primary-soft)]/60 border-[var(--primary)] font-bold'
                          : 'bg-[#FAF8F4] border-[#DDD7CB] text-[#475569]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[#0F172A] font-semibold">{slot.startTime} - {slot.endTime}</span>
                        <span className="font-bold text-[#0F172A]">{cls?.name || 'قسم'}</span>
                        <span className="text-[#64748B] hidden sm:inline">{cls?.stream}</span>
                      </div>
                      <span className={`text-[11px] px-2 py-0.5 rounded ${
                        isCurrent ? 'bg-[var(--primary)] text-white' : 'text-[#64748B]'
                      }`}>
                        {isCurrent ? 'الحصة الحالية' : 'مجدولة'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Recorded Sessions */}
          <div className="bg-white rounded-2xl border border-[#DDD7CB] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-sm text-[#0F172A] font-display">
                آخر الحصص الموثقة في الدفتر اليومي
              </h4>
              <button
                onClick={() => onNavigate('sessions')}
                className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>فتح الدفتر اليومي</span>
                <ArrowLeft className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-[#EBE6DC] text-xs">
              {state.sessions.slice(0, 3).map(ses => {
                const cls = state.classes.find(c => c.id === ses.classId);
                return (
                  <div key={ses.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                    <div>
                      <div className="font-bold text-[#0F172A]">{cls?.name || 'قسم'} • {ses.customTopic || 'حصة عادية'}</div>
                      <div className="text-[11px] text-[#64748B] mt-0.5">{ses.date} ({ses.startTime} - {ses.endTime})</div>
                    </div>
                    <span className="text-[11px] font-bold text-[var(--primary)] bg-[var(--primary-soft)] px-2.5 py-0.5 rounded-full shrink-0">
                      موثقة
                    </span>
                  </div>
                );
              })}
              {state.sessions.length === 0 && (
                <p className="text-xs text-[#64748B] py-4 text-center">لم يتم تسجيل حصص بعد في الدفتر اليومي.</p>
              )}
            </div>
          </div>
        </div>

        {/* LEFT COLUMN (4 COLS): Core Pedagogical Tools & Quick Checklist */}
        <div className="lg:col-span-4 space-y-6">
          {/* 4 Clean Action Cards */}
          <div className="bg-white rounded-2xl border border-[#DDD7CB] p-5 shadow-xs space-y-3">
            <h4 className="font-black text-xs text-[#64748B] tracking-wider uppercase">
              الأدوات البيداغوجية
            </h4>

            <div className="space-y-2 text-xs font-bold">
              {/* Card 1: دفتر العلامات */}
              <button
                onClick={() => onNavigate('grades')}
                className="w-full p-3 rounded-xl bg-[#FAF8F4] hover:bg-[var(--primary-soft)] border border-[#DDD7CB] hover:border-[var(--primary)] text-[#0F172A] flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 text-[var(--primary)]" />
                  <span>دفتر التنقيط والعلامات</span>
                </div>
                <ArrowLeft className="w-3.5 h-3.5 text-[#64748B] group-hover:-translate-x-1 transition-transform" />
              </button>

              {/* Card 2: المنهاج والتوزيع السنوي */}
              <button
                onClick={() => onNavigate('curriculum')}
                className="w-full p-3 rounded-xl bg-[#FAF8F4] hover:bg-[var(--primary-soft)] border border-[#DDD7CB] hover:border-[var(--primary)] text-[#0F172A] flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-[var(--primary)]" />
                  <span>البرامج والمنهاج الوزاري</span>
                </div>
                <ArrowLeft className="w-3.5 h-3.5 text-[#64748B] group-hover:-translate-x-1 transition-transform" />
              </button>

              {/* Card 3: مجالس الأقسام */}
              <button
                onClick={() => onNavigate('council')}
                className="w-full p-3 rounded-xl bg-[#FAF8F4] hover:bg-[var(--primary-soft)] border border-[#DDD7CB] hover:border-[var(--primary)] text-[#0F172A] flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-[var(--primary)]" />
                  <span>تحليل نتائج مجالس الأقسام</span>
                </div>
                <ArrowLeft className="w-3.5 h-3.5 text-[#64748B] group-hover:-translate-x-1 transition-transform" />
              </button>

              {/* Card 4: التوزيع السنوي والتدرجات */}
              <button
                onClick={() => onNavigate('annual_dist')}
                className="w-full p-3 rounded-xl bg-[#FAF8F4] hover:bg-[var(--primary-soft)] border border-[#DDD7CB] hover:border-[var(--primary)] text-[#0F172A] flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <CalendarRange className="w-4 h-4 text-[var(--primary)]" />
                  <span>التوزيع السنوي والتدرجات</span>
                </div>
                <ArrowLeft className="w-3.5 h-3.5 text-[#64748B] group-hover:-translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Urgent Tasks & Follow-up Checklist */}
          <div className="bg-white rounded-2xl border border-[#DDD7CB] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#EBE6DC] pb-2.5">
              <h4 className="font-black text-xs text-[#64748B] tracking-wider uppercase flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>متابعات ومهام عاجلة</span>
              </h4>
              <button
                onClick={() => setShowTaskInput(!showTaskInput)}
                className="text-xs text-[var(--primary)] hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>إضافة</span>
              </button>
            </div>

            {showTaskInput && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="مهمة جديدة..."
                  value={newTaskText}
                  onChange={e => setNewTaskText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTask()}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-[#DDD7CB] text-xs font-medium focus:outline-[var(--primary)]"
                  autoFocus
                />
                <button
                  onClick={addTask}
                  className="px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-bold cursor-pointer"
                >
                  حفظ
                </button>
              </div>
            )}

            <div className="space-y-2 text-xs">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    task.done
                      ? 'bg-[#FAF8F4] border-[#DDD7CB] text-[#64748B] line-through'
                      : 'bg-white border-[#DDD7CB] text-[#0F172A]'
                  }`}
                >
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="flex items-center gap-2 text-right flex-1 cursor-pointer"
                  >
                    {task.done ? (
                      <CheckSquare className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                    )}
                    <span className="font-medium">{task.text}</span>
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-[#64748B] hover:text-rose-600 p-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: إدخال حصص اليوم المبرمجة */}
      {isTodaySessionsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200" dir="rtl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-[var(--primary)]" />
                <h3 className="text-base font-black text-slate-900">
                  حصص اليوم المبرمجة ({dayNames[currentDayOfWeek]})
                </h3>
              </div>
              <button
                onClick={() => setIsTodaySessionsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              حدد الحصة التي ترغب في توثيقها بالدفتر اليومي أو رصد حضور تلامذتها:
            </p>

            <div className="space-y-2.5 max-h-80 overflow-y-auto">
              {todaySlots.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  لا توجد حصص مبرمجة ليوم {dayNames[currentDayOfWeek]} في جدول التوقيت الأسبوعي.
                </div>
              ) : (
                todaySlots.map((slot, idx) => {
                  const cls = state.classes.find(c => c.id === slot.classId);
                  const isRecorded = state.sessions.some(
                    s => s.classId === slot.classId && s.date === new Date().toISOString().split('T')[0]
                  );

                  return (
                    <div
                      key={slot.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-[var(--primary-soft)]/50 hover:border-[var(--primary)] transition-all flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-900">
                            {slot.startTime} - {slot.endTime}
                          </span>
                          <span className="font-black text-sm text-slate-900">{cls?.name || 'قسم'}</span>
                          {cls?.stream && (
                            <span className="text-xs text-slate-500 hidden sm:inline">({cls.stream})</span>
                          )}
                        </div>
                        {slot.room && (
                          <div className="text-[11px] text-slate-500">
                            القاعة: {slot.room}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isRecorded ? (
                          <span className="text-[11px] font-bold text-[var(--primary)] bg-[var(--primary-soft)] px-2.5 py-1 rounded-lg">
                            تم التدوين ✓
                          </span>
                        ) : null}
                        <button
                          onClick={() => {
                            if (slot.classId) {
                              onUpdateState(prev => ({ ...prev, activeClassId: slot.classId }));
                            }
                            setIsTodaySessionsModalOpen(false);
                            onNavigate('sessions');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                        >
                          تدوين بالدفتر اليومي
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <button
                onClick={() => {
                  setIsTodaySessionsModalOpen(false);
                  onNavigate('timetable');
                }}
                className="text-[var(--primary)] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>فتح جدول الحصص الأسبوعي الكامل</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsTodaySessionsModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
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
