'use client';

import React from 'react';
import { SanadTab } from './SidebarSanad';
import { AppState } from '@/lib/storage';
import { Home, Users, ClipboardList, BookOpen, Calendar } from 'lucide-react';

interface MobileNavigationProps {
  currentTab: SanadTab;
  onSelectTab: (tab: SanadTab) => void;
  onOpenMobileMenu: () => void;
  state: AppState;
  onUpdateState: (updater: (prev: AppState) => AppState) => void;
}

interface NavItem {
  tab: SanadTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { tab: 'dashboard', label: 'الرئيسية', icon: Home },
  { tab: 'classes', label: 'الأقسام', icon: Users },
  { tab: 'grades', label: 'النقاط', icon: ClipboardList },
  { tab: 'prep', label: 'الدروس', icon: BookOpen },
  { tab: 'timetable', label: 'الجدول', icon: Calendar },
];

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentTab,
  onSelectTab,
}) => {
  return (
    <nav
      aria-label="شريط التنقل السفلي للهاتف"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 supports-[backdrop-filter]:bg-white/85 backdrop-blur-xl border-t border-[var(--border-default)] pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_18px_rgba(15,23,42,0.08)]"
    >
      <div className="max-w-md mx-auto flex items-center justify-around px-1 py-1.5">
        {navItems.map((item) => {
          const isActive = currentTab === item.tab;
          const Icon = item.icon;

          return (
            <button
              key={item.tab}
              onClick={() => onSelectTab(item.tab)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`flex-1 flex flex-col items-center justify-center min-h-12 py-1 rounded-xl cursor-pointer transition-colors active:scale-95 ${
                isActive ? 'text-[#2E7D9B]' : 'text-[#8E95A0] hover:text-[#182026]'
              }`}
            >
              <div className="flex flex-col items-center justify-center">
                <Icon className="w-[22px] h-[22px]" />
                <span
                  className={`w-1 h-1 rounded-full mt-0.5 transition-colors ${
                    isActive ? 'bg-[#2E7D9B]' : 'bg-transparent'
                  }`}
                />
              </div>
              <span className="text-[10px] font-medium mt-1 leading-none">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
