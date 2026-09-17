'use client';

import React, { useState, useEffect } from 'react';
import { AppState, exportBackupJSON } from '@/lib/storage';
import { SanadTab } from './SidebarSanad';
import {
  Menu,
  Search,
  Calendar,
  CheckCircle2,
  Download,
  BookOpen,
  Sun,
  Moon
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface TopHeaderSanadProps {
  currentTab: SanadTab;
  state: AppState;
  onUpdateState: (updater: (prev: AppState) => AppState) => void;
  onOpenSearch: () => void;
  onToggleMobileSidebar: () => void;
}

const TAB_TITLES: Record<SanadTab, { title: string; subtitle?: string }> = {
  dashboard: { title: 'لوحة التحكم', subtitle: 'متابعة الحصص والأفواج والمهام اليومية' },
  classes: { title: 'الأفواج والتلاميذ', subtitle: 'إدارة الأقسام وقوائم الرقمنة' },
  attendance: { title: 'التقويم المستمر والحضور', subtitle: 'معايير التقويم المستمر (السلوك، الكراس، المشاركة، الغيابات)' },
  grades: { title: 'دفتر العلامات', subtitle: 'التقويم المستمر، الفروض، الاختبارات، والمعدل الوزاري' },
  council: { title: 'مجالس الأقسام', subtitle: 'إحصائيات النتائج ونسب النجاح الرسمية' },
  sessions: { title: 'دفتر النصوص', subtitle: 'سجل الحصص اليومي والذاكرة البيداغوجية' },
  annual_dist: { title: 'التوزيع السنوي', subtitle: 'التدرج السنوي للتعلمات والمقاطع البيداغوجية' },
  curriculum: { title: 'المنهاج والبرامج', subtitle: 'منهاج مادة العلوم الإسلامية المعتمد' },
  timetable: { title: 'جدول التوقيت', subtitle: 'شبكة الحصص الأسبوعية' },
  profile: { title: 'الملف المهني', subtitle: 'بطاقة الأستاذ والرتبة الحالية' },
  settings: { title: 'الإعدادات', subtitle: 'التقويم المستمر' },
  prep: { title: 'تحضير المذكرات', subtitle: 'إعداد المذكرات وتصدير Word والملفات الرسمية' },
  documents: { title: 'الوثائق الرسمية', subtitle: 'وثائق ومذكرات الوزارة عبر Google Drive' }
};

export const TopHeaderSanad: React.FC<TopHeaderSanadProps> = ({
  currentTab,
  state,
  onUpdateState,
  onOpenSearch,
  onToggleMobileSidebar
}) => {
  const currentInfo = TAB_TITLES[currentTab] || { title: 'معين' };
  const [backupSuccess, setBackupSuccess] = useState(false);

  // Algerian date formatting
  const today = new Date();
  const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const monthNames = [
    'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
    'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  const gregorianDate = `${dayNames[today.getDay()]} ${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()} م`;

  // Automatic Hijri date
  const hijriDate = (() => {
    try {
      const formatter = new Intl.DateTimeFormat('ar-DZ-u-ca-islamic-umalqura', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      let formatted = formatter.format(today).replace(/\s+/g, ' ').trim();
      formatted = formatted.replace(/هـ/g, '').replace(/AH/ig, '').trim();
      return formatted + ' هـ';
    } catch {
      return state.profile.hijriYear || '1448 هـ';
    }
  })();

  // Dark / Light Mode
  const isDarkMode = state.theme === 'dark';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (state.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [state.theme]);

  const toggleTheme = () => {
    const nextTheme = isDarkMode ? 'light' : 'dark';
    if (typeof document !== 'undefined') {
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    onUpdateState(prev => ({ ...prev, theme: nextTheme }));
  };

  // Quick JSON Backup Handler
  const handleQuickBackup = () => {
    try {
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
      setBackupSuccess(true);
      setTimeout(() => setBackupSuccess(false), 3500);
    } catch (e) {
      console.error('Backup error:', e);
    }
  };

  return (
    <header className="sticky top-0 z-30 print:hidden bg-[#FAF8F4]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#FAF8F4]/60 dark:bg-[#0F212D]/95 backdrop-blur-md border-b border-[#DDD7CB] dark:border-[#1E3747] transition-colors">
      <div className="h-16 px-4 sm:px-8 max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Right Side: Menu toggle & Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleMobileSidebar}
            className="p-2 rounded-xl lg:hidden text-[#475569] hover:text-[#0F172A] hover:bg-[#EBE6DC] dark:text-[#94A3B8] dark:hover:text-white dark:hover:bg-[#1E3747] transition-colors cursor-pointer shrink-0"
            aria-label="فتح القائمة"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-black text-[#0F172A] dark:text-white font-display tracking-tight truncate">
              {currentInfo.title}
            </h1>
            <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] hidden sm:block truncate">
              {currentInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Left Side: Gregorian + Hijri Date + Search + Dark/Light + Backup */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Automatic Gregorian + Hijri Date */}
          <div className="hidden md:flex flex-col items-end pl-3 border-l border-[#DDD7CB] dark:border-[#1E3747] text-right">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F172A] dark:text-white">
              <Calendar className="w-3.5 h-3.5 text-[#0D6547] shrink-0" />
              <span>{gregorianDate}</span>
            </div>
            <div className="text-[11px] font-amiri font-bold text-[#0D6547] dark:text-emerald-400">
              {hijriDate}
            </div>
          </div>

          {/* Quick Search Button */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#152733] hover:bg-stone-50 dark:hover:bg-[#1B3242] border border-[#DDD7CB] dark:border-[#1E3747] text-xs text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white transition-all cursor-pointer shadow-xs whitespace-nowrap"
            title="بحث شامل (Ctrl+K)"
          >
            <Search className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8]" />
            <span className="hidden sm:inline font-medium">بحث</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 rounded bg-[#FAF8F4] dark:bg-[#0B1922] border border-[#DDD7CB] dark:border-[#1E3747] text-[10px] font-mono text-[#475569] dark:text-[#94A3B8]">
              Ctrl+K
            </kbd>
          </button>

          {/* Dark / Light Mode Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-white dark:bg-[#152733] hover:bg-stone-50 dark:hover:bg-[#1B3242] border border-[#DDD7CB] dark:border-[#1E3747] text-xs font-bold text-[#0F172A] dark:text-white transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            title={isDarkMode ? 'التحويل إلى الوضع النهاري' : 'التحويل إلى الوضع الليلي'}
          >
            {isDarkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline text-xs">نهاري</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-700" />
                <span className="hidden sm:inline text-xs">ليلي</span>
              </>
            )}
          </button>

          <PWAInstallButton />
          
          {/* Backup Button */}
          <button
            onClick={handleQuickBackup}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-[#0D6547] hover:bg-[#094732] text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            title="حفظ نسخة احتياطية فورية (JSON)"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">نسخ احتياطي</span>
          </button>
        </div>
      </div>

      {backupSuccess && (
        <div className="bg-emerald-600 text-white text-xs font-bold py-1.5 px-4 text-center flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-4 h-4" />
          <span>تم تنزيل النسخة الاحتياطية بنجاح بصيغة JSON!</span>
        </div>
      )}
    </header>
  );
};

