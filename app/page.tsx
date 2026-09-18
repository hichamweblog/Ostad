'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '@/hooks/useAppState';
import { SidebarSanad, SanadTab } from '@/components/SidebarSanad';
import { TopHeaderSanad } from '@/components/TopHeaderSanad';
import { MobileNavigation } from '@/components/MobileNavigation';
import { Dashboard } from '@/components/Dashboard';
import { ClassesManager } from '@/components/ClassesManager';
import { AttendanceSanad } from '@/components/AttendanceSanad';
import { GradesAndEvaluation } from '@/components/GradesAndEvaluation';
import { CouncilAnalysis } from '@/components/CouncilAnalysis';
import { SessionCahier } from '@/components/SessionCahier';
import { AnnualDistribution } from '@/components/AnnualDistribution';
import { CurriculumView } from '@/components/CurriculumView';
import { TimetableSanad } from '@/components/TimetableSanad';
import { ProfessionalProfile } from '@/components/ProfessionalProfile';
import { SettingsSanad } from '@/components/SettingsSanad';
import { LessonPreparation } from '@/components/LessonPreparation';
import { DocumentsExport } from '@/components/DocumentsExport';
import { GlobalSearchModal } from '@/components/GlobalSearchModal';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { CurriculumUnit } from '@/lib/types';

export default function Page() {
  const { state, handleUpdateState, isMounted } = useAppState();

  const [currentTab, setCurrentTab] = useState<SanadTab>('dashboard');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [prepUnit, setPrepUnit] = useState<CurriculumUnit | null>(null);
  const [prepTab, setPrepTab] = useState<'card' | 'pdf' | 'bank'>('card');

  // Keyboard shortcut Ctrl+K / Cmd+K for global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Navigate to AI prep with unit preselected
  const handlePrepareUnit = (unit: CurriculumUnit, tab: 'card' | 'pdf' | 'bank' = 'card') => {
    setPrepUnit(unit);
    setPrepTab(tab);
    setCurrentTab('prep');
  };

  const isCollapsed = state.sidebarCollapsed || false;

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-5">
          <img src="/pwa-192x192.png" alt="معين" width={72} height={72} className="rounded-2xl" />
          <div className="text-center">
            <h2 className="text-lg font-bold text-[#1A1C1E]">معين</h2>
            <p className="text-xs text-[#8E95A0] mt-1">جاري التحميل...</p>
          </div>
          <div className="w-6 h-6 border-2 border-[#2E7D9B] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-row bg-[#F8F9FA] text-[#1A1C1E]"
      dir="rtl"
    >
      {/* 1. Official Sanad Al-Oustadh Right Sidebar (Desktop & Mobile Drawer) */}
      <SidebarSanad
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        state={state}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() =>
          handleUpdateState(prev => ({
            ...prev,
            sidebarCollapsed: !prev.sidebarCollapsed
          }))
        }
      />

      {/* 2. Main Content Wrapper (offset by sidebar width on desktop) */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isCollapsed ? 'md:mr-20' : 'md:mr-64'
        }`}
      >
        {/* Top Header Bar */}
        <TopHeaderSanad
          currentTab={currentTab}
          state={state}
          onUpdateState={handleUpdateState}
          onOpenSearch={() => setIsSearchOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        />

        {/* View Content Area (with bottom padding for Mobile Navigation bar) */}
        <main className="flex-1 pb-20 md:pb-12">
          {currentTab === 'dashboard' && (
            <Dashboard
              state={state}
              onNavigate={setCurrentTab}
              onUpdateState={handleUpdateState}
            />
          )}

          {currentTab === 'classes' && (
            <ClassesManager
              state={state}
              onUpdateState={handleUpdateState}
            />
          )}

          {currentTab === 'attendance' && (
            <AttendanceSanad
              state={state}
              onUpdateState={handleUpdateState}
              onNavigateToTimetable={() => setCurrentTab('timetable')}
            />
          )}

          {currentTab === 'grades' && (
            <GradesAndEvaluation
              state={state}
              onUpdateState={handleUpdateState}
            />
          )}

          {currentTab === 'council' && (
            <CouncilAnalysis state={state} />
          )}

          {currentTab === 'sessions' && (
            <SessionCahier
              state={state}
              onUpdateState={handleUpdateState}
            />
          )}

          {currentTab === 'annual_dist' && (
            <AnnualDistribution
              state={state}
              onUpdateState={handleUpdateState}
            />
          )}

          {currentTab === 'curriculum' && (
            <CurriculumView
              state={state}
              onUpdateState={handleUpdateState}
              onPrepareUnit={handlePrepareUnit}
            />
          )}

          {currentTab === 'timetable' && (
            <TimetableSanad
              state={state}
              onUpdateState={handleUpdateState}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsSanad
              state={state}
              onUpdateState={handleUpdateState}
            />
          )}

          {currentTab === 'prep' && (
            <LessonPreparation
              state={state}
              onUpdateState={handleUpdateState}
              initialUnit={prepUnit}
              initialTab={prepTab}
            />
          )}

          {currentTab === 'documents' && (
            <DocumentsExport state={state} />
          )}
        </main>

        {/* Footer (Desktop & Tablet) */}
        <footer className="py-6 px-4 pb-24 md:pb-6 text-center text-xs border-t border-[#DEE2E6] bg-white print:hidden">
          <div className="max-w-7xl mx-auto flex flex-col items-center justify-center gap-1">
            <div className="font-bold text-sm text-[#1A1C1E] mb-1">معين</div>
            <div className="text-slate-500 font-medium">تطبيق مساعد لأستاذ العلوم الإسلامية في التعليم الثانوي</div>
            <div className="text-slate-600 font-bold mt-1">ثانوية الدكتور بن زرجب - تلمسان</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">2026 - 2027</div>
          </div>
        </footer>
      </div>

      {/* 3. Mobile Navigation Bottom Bar (md:hidden) */}
      <MobileNavigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
        state={state}
        onUpdateState={handleUpdateState}
      />

      {/* 4. Global Search Modal (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        state={state}
        onNavigate={setCurrentTab}
        onUpdateState={handleUpdateState}
      />
      <OfflineIndicator />
    </div>
  );
}
