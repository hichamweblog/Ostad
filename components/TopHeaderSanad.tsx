'use client';

import React, { useState, useEffect } from'react';
import { AppState, exportBackupJSON } from'@/lib/storage';
import { SanadTab } from'./SidebarSanad';
import {
 Menu,
 Search,
 Calendar,
 CheckCircle2,
 Download,
 BookOpen,
 Sun,
 Moon
} from'lucide-react';
import { PWAInstallButton } from'./PWAInstallButton';

interface TopHeaderSanadProps {
 currentTab: SanadTab;
 state: AppState;
 onUpdateState: (updater: (prev: AppState) => AppState) => void;
 onOpenSearch: () => void;
 onToggleMobileSidebar: () => void;
}

const TAB_TITLES: Record<SanadTab, { title: string; subtitle?: string }> = {
 dashboard: { title:'لوحة التحكم', subtitle:'متابعة الحصص والأفواج والمهام اليومية'},
 classes: { title:'الأفواج والتلاميذ', subtitle:'إدارة الأقسام وقوائم الرقمنة'},
 attendance: { title:'التقويم المستمر والحضور', subtitle:'معايير التقويم المستمر (السلوك، الكراس، المشاركة، الغيابات)'},
 grades: { title:'دفتر العلامات', subtitle:'التقويم المستمر، الفروض، الاختبارات، والمعدل الوزاري'},
 council: { title:'مجالس الأقسام', subtitle:'إحصائيات النتائج ونسب النجاح الرسمية'},
 sessions: { title:'دفتر النصوص', subtitle:'سجل الحصص اليومي والذاكرة البيداغوجية'},
 annual_dist: { title:'التوزيع السنوي', subtitle:'التدرج السنوي للتعلمات والمقاطع البيداغوجية'},
 curriculum: { title:'المنهاج والبرامج', subtitle:'منهاج مادة العلوم الإسلامية المعتمد'},
 timetable: { title:'جدول التوقيت', subtitle:'شبكة الحصص الأسبوعية'},
 settings: { title:'الإعدادات', subtitle:'التقويم المستمر'},
 prep: { title:'تحضير المذكرات', subtitle:'إعداد المذكرات وتصدير Word والملفات الرسمية'},
 documents: { title:'الوثائق الرسمية', subtitle:'وثائق ومذكرات الوزارة عبر Google Drive'}
};

export const TopHeaderSanad: React.FC<TopHeaderSanadProps> = ({
 currentTab,
 state,
 onUpdateState,
 onOpenSearch,
 onToggleMobileSidebar
}) => {
 const currentInfo = TAB_TITLES[currentTab] || { title:'معين'};
 const [backupSuccess, setBackupSuccess] = useState(false);

 // Algerian date formatting
 const today = new Date();
 const dayNames = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
 const monthNames = [
'جانفي','فيفري','مارس','أفريل','ماي','جوان',
'جويلية','أوت','سبتمبر','أكتوبر','نوفمبر','ديسمبر'
 ];
 const gregorianDate =`${dayNames[today.getDay()]} ${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()} م`;

 // Automatic Hijri date
 const hijriDate = (() => {
 try {
 const formatter = new Intl.DateTimeFormat('ar-DZ-u-ca-islamic-umalqura', {
 day:'numeric',
 month:'long',
 year:'numeric'
 });
 let formatted = formatter.format(today).replace(/\s+/g,'').trim();
 formatted = formatted.replace(/هـ/g,'').replace(/AH/ig,'').trim();
 return formatted +'هـ';
 } catch {
 return state.profile.hijriYear ||'1448 هـ';
 }
 })();

 useEffect(() => {
 if (typeof document !=='undefined') {
 document.documentElement.classList.remove('dark');
 }
 }, []);

 // Quick JSON Backup Handler
 const handleQuickBackup = () => {
 try {
 const jsonStr = exportBackupJSON(state);
 const blob = new Blob([jsonStr], { type:'application/json'});
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download =`معين_نسخة_احتياطية_${state.profile.name ||'أستاذ'}_${new Date().toISOString().slice(0, 10)}.json`;
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
 <header className="sticky top-0 z-30 print:hidden bg-[#FAF8F4]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#FAF8F4]/60 backdrop-blur-md border-b border-[#DDD7CB] ] transition-colors">
 <div className="h-16 px-4 sm:px-8 max-w-7xl mx-auto flex items-center justify-between gap-4">
 {/* Right Side: Menu toggle & Page Title */}
 <div className="flex items-center gap-3 min-w-0">
 <button
 onClick={onToggleMobileSidebar}
 className="p-2 rounded-xl lg:hidden text-[#475569] hover:text-[var(--text-primary)] hover:bg-[#EBE6DC] ] :text-white :bg-[#1E3747] transition-colors cursor-pointer shrink-0"
 aria-label="فتح القائمة"
 >
 <Menu className="w-5 h-5"/>
 </button>

 <div className="min-w-0 flex items-center gap-2">
 <h1 className="text-base sm:text-lg font-black text-[var(--primary)] font-display tracking-tight truncate">
 معين الأستاذ
 </h1>
 <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-[var(--primary-soft)] text-[#0D2C3B] text-[10px] font-bold">إصدار 2026</span>
 </div>
 </div>

 {/* Left Side: Gregorian + Hijri Date + Search + Dark/Light + Backup */}
 <div className="flex items-center gap-2 sm:gap-3 shrink-0">
 {/* Automatic Gregorian + Hijri Date */}
 <div className="hidden md:flex flex-col items-end pl-3 border-l border-[#DDD7CB] ] text-right">
 <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
 <Calendar className="w-3.5 h-3.5 text-[var(--primary)] shrink-0"/>
 <span>{gregorianDate}</span>
 </div>
 <div className="text-[11px] font-amiri font-bold text-[var(--primary)]">
 {hijriDate}
 </div>
 </div>

 {/* Quick Search Button */}
 <button
 onClick={onOpenSearch}
 className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white ] hover:bg-stone-50 :bg-[#1B3242] border border-[#DDD7CB] ] text-xs text-[#64748B] ] hover:text-[var(--text-primary)] :text-white transition-all cursor-pointer shadow-xs whitespace-nowrap"
 title="بحث شامل (Ctrl+K)"
 >
 <Search className="w-4 h-4 text-[#64748B] ]"/>
 <span className="hidden sm:inline font-medium">بحث</span>
 <kbd className="hidden lg:inline-block px-1.5 py-0.5 rounded bg-[#FAF8F4] ] border border-[#DDD7CB] ] text-[10px] font-mono text-[#475569] ]">
 Ctrl+K
 </kbd>
 </button>

 

 <PWAInstallButton />
 
 {/* Backup Button */}
 <button
 onClick={handleQuickBackup}
 className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
 title="حفظ نسخة احتياطية فورية (JSON)"
 >
 <Download className="w-4 h-4"/>
 <span className="hidden sm:inline">نسخ احتياطي</span>
 </button>
 </div>
 </div>

 {backupSuccess && (
 <div className="bg-emerald-600 text-white text-xs font-bold py-1.5 px-4 text-center flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top duration-300">
 <CheckCircle2 className="w-4 h-4"/>
 <span>تم تنزيل النسخة الاحتياطية بنجاح بصيغة JSON!</span>
 </div>
 )}
 </header>
 );
};

