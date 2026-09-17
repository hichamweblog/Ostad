'use client';

import React, { useState } from 'react';
import { SanadTab } from './SidebarSanad';
import { AppState } from '@/lib/storage';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Menu,
  Plus,
  X,
  PlayCircle,
  Sparkles,
  Star,
  FileSpreadsheet,
  BookOpen,
  UserCheck,
  Contact,
  FileText
} from 'lucide-react';

interface MobileNavigationProps {
  currentTab: SanadTab;
  onSelectTab: (tab: SanadTab) => void;
  onOpenMobileMenu: () => void;
  state: AppState;
  onUpdateState: (updater: (prev: AppState) => AppState) => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentTab,
  onSelectTab,
  onOpenMobileMenu,
  state,
  onUpdateState
}) => {
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);

  return (
    <>
      {/* Floating Bottom Bar (Mobile only: lg:hidden) as seen in Screenshot 1, 3, 5 */}
      <nav
        aria-label="شريط التنقل السفلي للهاتف"
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-[#EBE7DF] px-2 py-1.5 bg-[#FFFFFF]/95 backdrop-blur-md text-[#5A6672] shadow-[0_-4px_20px_rgba(0,0,0,0.03)]"
      >
        <div className="max-w-md mx-auto flex items-center justify-around relative">
          {/* Item 1: Dashboard */}
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
              currentTab === 'dashboard'
                ? 'text-[#0D6547] font-bold scale-105'
                : 'hover:text-[#182026]'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">الرئيسية</span>
          </button>

          {/* Item 2: Timetable */}
          <button
            onClick={() => onSelectTab('timetable')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
              currentTab === 'timetable'
                ? 'text-[#0D6547] font-bold scale-105'
                : 'hover:text-[#182026]'
            }`}
          >
            <CalendarDays className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">الجدول</span>
          </button>

          {/* Center Elevated Quick Action Button (+) */}
          <div className="relative -top-3">
            <button
              onClick={() => setIsQuickActionsOpen(true)}
              aria-label="إجراءات سريعة"
              className="w-12 h-12 rounded-full bg-[#0D6547] hover:bg-[#084530] text-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-[#FFFFFF]"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          {/* Item 3: Classes */}
          <button
            onClick={() => onSelectTab('classes')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
              currentTab === 'classes'
                ? 'text-[#0D6547] font-bold scale-105'
                : 'hover:text-[#182026]'
            }`}
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">الأقسام</span>
          </button>

          {/* Item 4: Menu / Profile */}
          <button
            onClick={() => onSelectTab('profile')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
              currentTab === 'profile'
                ? 'text-[#0D6547] font-bold scale-105'
                : 'hover:text-[#182026]'
            }`}
          >
            <Contact className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">حسابي</span>
          </button>
        </div>
      </nav>

      {/* Quick Actions Bottom Sheet Modal */}
      {isQuickActionsOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs lg:hidden">
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 border border-[#EBE7DF] bg-[#FFFFFF] shadow-2xl space-y-4 text-right">
            {/* Sheet Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#EBE7DF]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#0D6547] flex items-center justify-center font-bold">
                  ⚡
                </div>
                <div>
                  <h3 className="font-black text-sm text-[#182026]">إجراءات سريعة</h3>
                  <p className="text-[11px] text-[#8C96A3]">اختر العملية المطلوبة للوصول الفوري</p>
                </div>
              </div>
              <button
                onClick={() => setIsQuickActionsOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#FAF8F5] text-[#8C96A3] hover:text-[#182026] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  setIsQuickActionsOpen(false);
                  onSelectTab('attendance');
                }}
                className="p-3 rounded-xl border border-[#EBE7DF] hover:border-[#0D6547] bg-[#FAF8F5] hover:bg-[#FFFFFF] text-right transition-all flex flex-col gap-2 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-[#0D6547] text-white flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#182026]">رصد الحضور والغياب</div>
                  <div className="text-[10px] text-[#8C96A3]">مخطط الجلوس والقائمة</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsQuickActionsOpen(false);
                  onSelectTab('sessions');
                }}
                className="p-3 rounded-xl border border-[#EBE7DF] hover:border-[#0D6547] bg-[#FAF8F5] hover:bg-[#FFFFFF] text-right transition-all flex flex-col gap-2 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#182026]">دفتر النصوص</div>
                  <div className="text-[10px] text-[#8C96A3]">توثيق الحصص المنجزة</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsQuickActionsOpen(false);
                  onSelectTab('grades');
                }}
                className="p-3 rounded-xl border border-[#EBE7DF] hover:border-purple-500 bg-[#FAF8F5] hover:bg-[#FFFFFF] text-right transition-all flex flex-col gap-2 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                  <Star className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#182026]">دفتر التنقيط</div>
                  <div className="text-[10px] text-[#8C96A3]">المراقبة والفروض</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsQuickActionsOpen(false);
                  onSelectTab('prep');
                }}
                className="p-3 rounded-xl border border-[#EBE7DF] hover:border-blue-500 bg-[#FAF8F5] hover:bg-[#FFFFFF] text-right transition-all flex flex-col gap-2 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#182026]">المذكرات البيداغوجية</div>
                  <div className="text-[10px] text-[#8C96A3]">إعداد وطباعة المذكرات</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
