'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { AppState, getInitialState, loadAppState, saveAppState } from '@/lib/storage';
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

const emptySubscribe = () => () => {};

function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export default function Page() {
  const isMounted = useIsMounted();
  const [state, setState] = useState<AppState>(() => {
    if (typeof window !== 'undefined') {
      return loadAppState();
    }
    return getInitialState();
  });

  const [currentTab, setCurrentTab] = useState<SanadTab>('dashboard');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [prepUnit, setPrepUnit] = useState<CurriculumUnit | null>(null);
  const [prepTab, setPrepTab] = useState<'card' | 'pdf' | 'bank'>('card');

  // Save state whenever it updates
  const handleUpdateState = (updater: (prev: AppState) => AppState) => {
    setState(prev => updater(prev));
  };

  // Synchronize state changes to localStorage after render
  useEffect(() => {
    if (isMounted) {
      saveAppState(state);
    }
  }, [state, isMounted]);

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
      <div className="min-h-screen bg-[#F4F1EA] flex items-center justify-center text-[#0F172A]" dir="rtl">
        <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-3xl border border-[#DDD7CB] shadow-md max-w-sm w-full mx-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#0D6547] text-white flex items-center justify-center font-black text-xl shadow-sm">
            س
          </div>
          <div>
            <h2 className="text-base font-black text-[#0F172A] font-display">معين</h2>
            <p className="text-xs text-[#64748B] mt-1">جاري تحميل منصة العلوم الإسلامية...</p>
          </div>
          <div className="w-7 h-7 border-3 border-[#0D6547] border-t-transparent rounded-full animate-spin mt-1" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-row bg-[#F4F1EA] text-[#0F172A]"
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
          isCollapsed ? 'lg:mr-20' : 'lg:mr-64'
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
        <main className="flex-1 pb-20 lg:pb-12">
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

          {currentTab === 'profile' && (
            <ProfessionalProfile
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
        <footer className="py-5 px-8 text-center text-xs border-t border-[#DDD7CB] bg-white text-[#64748B] print:hidden">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="font-medium">
              «معين» - تطبيق مساعد أستاذ العلوم الإسلامية في التعليم الثانوي (الجمهورية الجزائرية)
            </span>
            <span className="font-mono opacity-80">
              السنة الدراسية: {state.profile.academicYear} • ثانوية {state.profile.schoolName}
            </span>
          </div>
        </footer>
      </div>

      {/* 3. Mobile Navigation Bottom Bar (lg:hidden) */}
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
