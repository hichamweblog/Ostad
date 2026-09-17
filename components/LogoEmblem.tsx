'use client';

import React from 'react';

interface LogoEmblemProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  academicYear?: string;
}

export const LogoEmblem: React.FC<LogoEmblemProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
  academicYear = '2026/2027'
}) => {
  const iconSize = size === 'sm' ? 34 : size === 'lg' ? 52 : 42;

  return (
    <div className={`flex items-center gap-2.5 ${className}`} id="app-logo-emblem">
      {/* Sanad Al-Oustadh Emerald Emblem */}
      <div
        style={{ width: iconSize, height: iconSize }}
        className="rounded-xl bg-gradient-to-br from-[#0d6547] to-[#084530] flex items-center justify-center shadow-sm shrink-0 border border-emerald-600/30 text-white"
      >
        <svg
          width={Math.round(iconSize * 0.65)}
          height={Math.round(iconSize * 0.65)}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Islamic Arch & Open Book (Mushaf / Notebook) motif */}
          <path d="M12 3a9 9 0 0 0-9 9v9h18v-9a9 9 0 0 0-9-9Z" />
          <path d="M12 21v-8" />
          <path d="M8 15a4 4 0 0 1 4-4 4 4 0 0 1 4 4" />
          <path d="M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" fill="#D9B44A" stroke="none" />
        </svg>
      </div>

      {/* Typography Identity */}
      <div className="flex flex-col text-right leading-tight">
        <span className="text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
          <span className="font-amiri text-lg">معين الأستاذ</span>
        </span>
        {showSubtitle && (
          <span className="text-[11px] text-slate-500 font-medium mt-0.5">
            العلوم الإسلامية • {academicYear}
          </span>
        )}
      </div>
    </div>
  );
};
