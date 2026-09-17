'use client';

import React, { useState, useEffect } from 'react';
import { AppState } from '@/lib/storage';
import { OFFICIAL_CURRICULUM, getMergedCurriculumUnits } from '@/lib/curriculum-data';
import { SanadTab } from './SidebarSanad';
import { Search, X, BookOpen, Users, ArrowLeft, GraduationCap } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onNavigate: (tab: SanadTab) => void;
  onUpdateState: (updater: (prev: AppState) => AppState) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  state,
  onNavigate,
  onUpdateState
}) => {
  const [query, setQuery] = useState('');

  // Keyboard shortcut ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  // Search lessons
  const matchedUnits = !q
    ? []
    : getMergedCurriculumUnits(state.customUnits).filter(
        u =>
          u.title.toLowerCase().includes(q) ||
          u.domain.toLowerCase().includes(q) ||
          (u.referenceTexts && u.referenceTexts.some(t => t.toLowerCase().includes(q)))
      ).slice(0, 6);

  // Search students
  const matchedStudents = !q
    ? []
    : state.students
        .filter(s => s.fullName.toLowerCase().includes(q) || (s.regNumber && s.regNumber.includes(q)))
        .slice(0, 6);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-start justify-center p-4 pt-16">
      <div className="rounded-3xl max-w-xl w-full p-5 shadow-2xl border border-[#EBE7DF] bg-[#FFFFFF] text-[#182026] space-y-4">
        {/* Search Header Input */}
        <div className="flex items-center gap-3 pb-3 border-b border-[#EBE7DF]">
          <Search className="w-5 h-5 text-[#0D6547] shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="ابحث عن وحدة، تلميذ، سند شرعي، مصطلح فقهي..."
            className="w-full bg-transparent focus:outline-hidden text-sm font-semibold placeholder:text-[#8C96A3]"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#FAF8F5] text-[#8C96A3] hover:text-[#182026] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1 scrollbar-thin">
          {!q && (
            <div className="py-8 text-center text-xs text-[#8C96A3]">
              اكتب كلمة للبحث الفوري في المنهاج الرسمي (1AS/2AS/3AS) أو أسماء التلاميذ.
            </div>
          )}

          {/* Lessons Section */}
          {matchedUnits.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-black text-[#8C96A3] uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#0D6547]" />
                <span>الوحدات والدروس في المنهاج ({matchedUnits.length})</span>
              </div>
              <div className="space-y-1">
                {matchedUnits.map(unit => (
                  <div
                    key={unit.id}
                    onClick={() => {
                      onClose();
                      onNavigate('curriculum');
                    }}
                    className="p-3 rounded-2xl border border-[#EBE7DF] hover:border-[#0D6547] bg-[#FAF8F5] hover:bg-[#FFFFFF] flex items-center justify-between cursor-pointer transition-all group"
                  >
                    <div>
                      <div className="font-bold text-xs text-[#182026] group-hover:text-[#0D6547] transition-colors">
                        {unit.title}
                      </div>
                      <div className="text-[11px] text-[#5A6672] flex items-center gap-2 mt-0.5">
                        <span className="font-semibold text-[#0D6547]">{unit.level}</span>
                        <span>•</span>
                        <span>{unit.domain}</span>
                      </div>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-[#8C96A3] group-hover:text-[#0D6547] group-hover:-translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Students Section */}
          {matchedStudents.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-black text-[#8C96A3] uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>قائمة التلاميذ ({matchedStudents.length})</span>
              </div>
              <div className="space-y-1">
                {matchedStudents.map(st => {
                  const cls = state.classes.find(c => c.id === st.classId);
                  return (
                    <div
                      key={st.id}
                      onClick={() => {
                        if (cls) {
                          onUpdateState(prev => ({ ...prev, activeClassId: cls.id }));
                        }
                        onClose();
                        onNavigate('classes');
                      }}
                      className="p-3 rounded-2xl border border-[#EBE7DF] hover:border-[#0D6547] bg-[#FAF8F5] hover:bg-[#FFFFFF] flex items-center justify-between cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center">
                          {st.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-[#182026] group-hover:text-[#0D6547] transition-colors">
                            {st.fullName}
                          </div>
                          <div className="text-[11px] text-[#5A6672] flex items-center gap-2">
                            <span>{cls?.name || 'قسم غير محدد'}</span>
                            {st.regNumber && <span>رقم: {st.regNumber}</span>}
                          </div>
                        </div>
                      </div>
                      <ArrowLeft className="w-4 h-4 text-[#8C96A3] group-hover:text-[#0D6547] group-hover:-translate-x-1 transition-all" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {q && matchedUnits.length === 0 && matchedStudents.length === 0 && (
            <div className="py-8 text-center text-xs text-[#8C96A3]">
              لم يتم العثور على نتائج مطابقة لـ &quot;{query}&quot;
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-2 border-t border-[#DDD7CB] flex items-center justify-between text-[11px] text-[#64748B]">
          <span>اضغط ESC للإغلاق</span>
          <span className="text-[#0D6547] font-semibold">معين - التعليم الثانوي</span>
        </div>
      </div>
    </div>
  );
};
