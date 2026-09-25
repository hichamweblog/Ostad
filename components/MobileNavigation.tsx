'use client';

import React from 'react';
import { useAppState } from '@/hooks/app-state-context';
import { SanadTab } from './SidebarSanad';
import { ClipboardList, Home, MoreHorizontal, PlayCircle, Users } from 'lucide-react';

interface MobileNavigationProps {
  currentTab: SanadTab;
  onSelectTab: (tab: SanadTab) => void;
  onOpenMobileMenu: () => void;
}

interface NavItem {
  tab: SanadTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const sideItems: NavItem[] = [
  { tab: 'dashboard', label: 'اليوم', icon: Home },
  { tab: 'classes', label: 'الأقسام', icon: Users },
  { tab: 'grades', label: 'النقاط', icon: ClipboardList },
];

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentTab,
  onSelectTab,
  onOpenMobileMenu,
}) => {
  const { state, updateState } = useAppState();
  const now = new Date();
  const rawDay = now.getDay();
  const currentDayOfWeek = rawDay <= 4 ? rawDay : 0;
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const todaySlots = state.timetable
    .filter(slot => slot.dayOfWeek === currentDayOfWeek)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const currentOrNextSlot =
    todaySlots.find(slot => slot.startTime <= currentTime && currentTime < slot.endTime) ??
    todaySlots.find(slot => slot.startTime > currentTime) ??
    null;
  const slotClass = currentOrNextSlot
    ? state.classes.find(classRoom => classRoom.id === currentOrNextSlot.classId)
    : null;
  const fallbackClass = state.classes.find(classRoom => classRoom.id === state.activeClassId) ?? state.classes[0] ?? null;
  const startLabel = slotClass ? `ابدأ ${slotClass.name}` : 'ابدأ الحصة';

  const handleStartClass = () => {
    const targetClassId = currentOrNextSlot?.classId || fallbackClass?.id || null;
    if (targetClassId) {
      updateState(previous => ({ ...previous, activeClassId: targetClassId }));
    }
    onSelectTab('attendance');
  };

  return (
    <nav
      aria-label="شريط التنقل السفلي للهاتف واللوحي"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-[var(--border-default)] bg-[var(--bg-surface)] pb-[env(safe-area-inset-bottom)] shadow-[var(--shadow-nav)]"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 items-end px-1 pb-1 pt-1">
        {sideItems.slice(0, 2).map(item => {
          const isActive = currentTab === item.tab || (item.tab === 'classes' && currentTab === 'students');
          const Icon = item.icon;

          return (
            <button
              key={item.tab}
              onClick={() => onSelectTab(item.tab)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-h-[52px] flex-col items-center justify-center py-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] ${
                isActive ? 'text-[var(--primary)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Icon className="h-[22px] w-[22px]" />
              <span className="mt-1 text-[10px] font-medium leading-none">{item.label}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={handleStartClass}
          aria-label={startLabel}
          aria-current={currentTab === 'attendance' ? 'page' : undefined}
          className="relative -mt-5 flex min-h-[68px] flex-col items-center justify-start text-[var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-white bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/30 active:scale-95">
            <PlayCircle className="h-6 w-6" />
          </span>
          <span className="mt-1 max-w-[4.5rem] truncate text-[10px] font-black leading-none">ابدأ</span>
        </button>

        {sideItems.slice(2).map(item => {
          const isActive = currentTab === item.tab;
          const Icon = item.icon;

          return (
            <button
              key={item.tab}
              onClick={() => onSelectTab(item.tab)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-h-[52px] flex-col items-center justify-center py-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] ${
                isActive ? 'text-[var(--primary)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Icon className="h-[22px] w-[22px]" />
              <span className="mt-1 text-[10px] font-medium leading-none">{item.label}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="فتح المزيد من المسارات"
          className="flex min-h-[52px] flex-col items-center justify-center py-1 text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
        >
          <MoreHorizontal className="h-[22px] w-[22px]" />
          <span className="mt-1 text-[10px] font-medium leading-none">المزيد</span>
        </button>
      </div>
    </nav>
  );
};
