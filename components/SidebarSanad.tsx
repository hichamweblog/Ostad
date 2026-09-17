'use client';
import Image from 'next/image';

import React from 'react';
import { AppState, exportBackupJSON } from '@/lib/storage';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Star,
  BarChart3,
  Edit3,
  CalendarRange,
  BookOpen,
  CalendarDays,
  Contact,
  Settings,
  Sparkles,
  FileText,
  ChevronLeft,
  X,
  LogOut,
  Download,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

export type SanadTab =
  | 'dashboard'
  | 'classes'
  | 'attendance'
  | 'grades'
  | 'council'
  | 'sessions'
  | 'annual_dist'
  | 'curriculum'
  | 'timetable'
  | 'profile'
  | 'settings'
  | 'prep'
  | 'documents';

interface SidebarSanadProps {
  currentTab: SanadTab;
  onSelectTab: (tab: SanadTab) => void;
  state: AppState;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const SidebarSanad: React.FC<SidebarSanadProps> = ({
  currentTab,
  onSelectTab,
  state,
  isOpenMobile = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const navGroups: {
    groupName: string;
    items: {
      id: SanadTab;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      isAi?: boolean;
      badge?: string;
    }[];
  }[] = [
    {
      groupName: 'الرئيسية',
      items: [{ id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard }]
    },
    {
      groupName: 'البيداغوجيا والتخطيط',
      items: [
        { id: 'annual_dist', label: 'التوزيع السنوي والتدرجات', icon: CalendarRange },
        { id: 'curriculum', label: 'المقاطع والوحدات التعليمية', icon: BookOpen },
        { id: 'prep', label: 'المذكرات البيداغوجية (PDF)', icon: FileText },
        { id: 'sessions', label: 'دفتر النصوص', icon: Edit3 }
      ]
    },
    {
      groupName: 'الإدارة والنتائج',
      items: [
        { id: 'classes', label: 'تسيير الأقسام', icon: Users },
        { id: 'attendance', label: 'الحضور والغياب', icon: UserCheck },
        { id: 'grades', label: 'دفتر التنقيط', icon: Star },
        { id: 'council', label: 'مجالس الأقسام', icon: BarChart3 },
        { id: 'timetable', label: 'جدول الحصص', icon: CalendarDays },
        { id: 'documents', label: 'الوثائق البيداغوجية', icon: FileText }
      ]
    },
    {
      groupName: 'الحساب والإعدادات',
      items: [
        { id: 'settings', label: 'الإعدادات', icon: Settings }
      ]
    }
  ];

  const handleBackup = () => {
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

  const teacherName = state.profile.name || 'أستاذ محمد';
  const schoolName = state.profile.schoolName || 'ثانوية النخبة';
  const teacherInitial = teacherName.trim().charAt(0) || 'أ';

  return (
    <>
      {/* Mobile Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Signature Deep Navy Sidebar (as seen in Screenshot 2) */}
      <aside
        id="sanad-sidebar"
        className={`fixed top-0 bottom-0 right-0 z-50 flex flex-col transition-all duration-300 ease-in-out border-l border-[#1A2E35] bg-[#0D1E24] text-slate-100 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isOpenMobile
            ? 'translate-x-0 shadow-2xl w-72'
            : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Branding (Screenshot 2: مساعد الأستاذ - إصدار المحترفين) */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#1A2E35] shrink-0">
          {isCollapsed ? (
            <div className="mx-auto">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0D6547] to-[#084530] flex items-center justify-center text-white font-black text-base shadow-sm border border-emerald-500/40">
                س
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0D6547] to-[#084530] flex items-center justify-center text-white font-black text-base shadow-sm border border-emerald-400/30">
                س
              </div>
              <div className="text-right">
                <div className="font-black text-sm text-white tracking-tight leading-tight">
                  معين
                </div>
                <div className="text-[10px] text-amber-400 font-bold flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>أستاذ العلوم الإسلامية</span>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Collapse Toggle */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              title={isCollapsed ? 'توسيع القائمة' : 'تصغير القائمة'}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Mobile Close Button */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg lg:hidden cursor-pointer"
              aria-label="إغلاق القائمة"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 text-right">
                  {group.groupName}
                </div>
              )}

              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-right cursor-pointer group relative ${
                      isActive
                        ? 'bg-[#0D6547] text-white shadow-sm border border-emerald-400/30'
                        : 'text-slate-300 hover:text-white hover:bg-[#162B33]'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                    id={`sidebar-link-${item.id}`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive
                          ? 'text-white'
                          : item.isAi
                          ? 'text-amber-400'
                          : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />
                    {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
                    {!isCollapsed && item.isAi && !isActive && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold">
                        AI
                      </span>
                    )}

                    {/* Active Pip Indicator for Collapsed Mode */}
                    {isCollapsed && isActive && (
                      <span className="absolute left-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Section (Screenshot 2: أستاذ محمد - ثانوية النخبة - تسجيل الخروج / النسخ الاحتياطي) */}
        <div className="p-3 border-t border-[#1A2E35] shrink-0 bg-[#0A171B] space-y-2">
          {!isCollapsed ? (
            <div
              onClick={() => {
                onSelectTab('profile');
                if (onCloseMobile) onCloseMobile();
              }}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#162B33] transition-colors cursor-pointer"
            >
              {state.profile.avatarUrl ? (
                <img
                  src={state.profile.avatarUrl}
                  alt={teacherName}
                  className="w-9 h-9 rounded-xl object-cover shadow-xs shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                  {teacherInitial}
                </div>
              )}
              <div className="text-right overflow-hidden flex-1">
                <div className="font-bold text-xs text-white truncate">
                  {teacherName}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {schoolName}
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => {
                onSelectTab('profile');
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 font-black text-sm flex items-center justify-center cursor-pointer overflow-hidden"
              title={teacherName}
            >
              {state.profile.avatarUrl ? (
                <img
                  src={state.profile.avatarUrl}
                  alt={teacherName}
                  className="w-full h-full object-cover"
                />
              ) : (
                teacherInitial
              )}
            </div>
          )}

          {!isCollapsed && (
            <div className="pt-1 flex items-center justify-between gap-1 text-[11px] text-slate-400">
              <button
                onClick={handleBackup}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:text-white hover:bg-[#162B33] transition-colors cursor-pointer"
                title="تصدير نسخة احتياطية"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>حفظ محلي</span>
              </button>

              <button
                onClick={() => onSelectTab('settings')}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:text-white hover:bg-[#162B33] transition-colors cursor-pointer text-slate-400 hover:text-rose-300"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
