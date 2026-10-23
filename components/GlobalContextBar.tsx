'use client';

import { useAppState } from '@/hooks/app-state-context';
import { normalizeTrimester, trimesterLabel } from '@/lib/academic-calendar';
import { Users } from 'lucide-react';

/**
 * Persistent class + trimester context, shown on every screen.
 *
 * Before this bar, the same choice lived inside each module (attendance, grades,
 * council, documents), so «دفتر النقاط» could say «الفصل الثاني» while
 * «مجالس الأقسام» still said «الفصل الأول». This is now the single place the
 * teacher changes either value; the modules follow `state.activeClassId` and
 * `state.activeTrimester`.
 */
export function GlobalContextBar() {
  const { state, updateState } = useAppState();
  const trimester = normalizeTrimester(state.activeTrimester);
  const activeClass = state.classes.find(item => item.id === state.activeClassId);

  if (state.classes.length === 0) return null;

  return (
    <div className="no-print border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
      <div className="mx-auto flex w-full max-w-[30rem] items-center justify-between gap-2 px-3 py-2 sm:px-6 md:max-w-7xl md:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-2 md:flex-none">
          <Users className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]" aria-hidden="true" />
          <label htmlFor="global-context-class" className="shrink-0 text-xs font-bold text-[var(--text-tertiary)]">
            القسم
          </label>
          <select
            id="global-context-class"
            value={activeClass?.id ?? ''}
            onChange={event => updateState(prev => ({ ...prev, activeClassId: event.target.value }))}
            className="min-h-9 min-w-0 flex-1 truncate rounded-lg border border-[var(--border-default)] bg-white px-2 text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] md:w-56 md:flex-none"
          >
            {!activeClass && <option value="">اختر قسماً</option>}
            {state.classes.map(item => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          {activeClass && (
            <span className="hidden shrink-0 text-xs font-medium text-[var(--text-muted)] md:inline">
              {state.students.filter(student => student.classId === activeClass.id).length} تلميذاً
            </span>
          )}
        </div>

        <div
          role="group"
          aria-label="الفصل الدراسي النشط"
          className="flex shrink-0 items-center gap-0.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-page)] p-0.5"
        >
          {([1, 2, 3] as const).map(term => {
            const isActive = term === trimester;
            return (
              <button
                key={term}
                type="button"
                aria-pressed={isActive}
                onClick={() => updateState(prev => ({ ...prev, activeTrimester: term }))}
                className={`min-h-9 rounded-lg px-2 text-xs font-bold transition-colors sm:px-3 ${
                  isActive
                    ? 'bg-[var(--primary)] text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:bg-white'
                }`}
                title={trimesterLabel(term)}
              >
                <span className="hidden sm:inline">{trimesterLabel(term)}</span>
                <span aria-hidden="true" className="sm:hidden">ف{term}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
