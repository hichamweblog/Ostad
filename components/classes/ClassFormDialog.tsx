'use client';

import { CLASS_COLORS, DEFAULT_CLASS_COLOR } from '@/lib/class-colors';
import type { ClassRoom, GradeLevel } from '@/lib/types';
import { X } from 'lucide-react';
import { useDialogA11y } from '@/hooks/use-dialog-a11y';

interface ClassFormDialogProps {
  open: boolean;
  draft: Partial<ClassRoom> | null;
  error: string | null;
  saving: boolean;
  onChange: (next: Partial<ClassRoom>) => void;
  onClearError: () => void;
  onClose: () => void;
  onSave: () => void;
}

/**
 * Add / edit class panel. Extracted from `ClassesManager` so the list screen
 * stays about lists, and every class field is validated in one place.
 */
export function ClassFormDialog({
  open,
  draft,
  error,
  saving,
  onChange,
  onClearError,
  onClose,
  onSave,
}: ClassFormDialogProps) {
  const dialogRef = useDialogA11y(open, onClose);
  if (!open || !draft) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="class-modal-title"
        className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl outline-none"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 id="class-modal-title" className="text-base font-black text-slate-900">
            {draft.name ? 'تعديل القسم' : 'إضافة قسم جديد'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="إغلاق النافذة"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="space-y-1">
            <label htmlFor="class-name" className="font-bold text-slate-700">
              تسمية القسم (مثال: 3 علوم 1):
            </label>
            <input
              id="class-name"
              type="text"
              value={draft.name || ''}
              onChange={event => {
                onChange({ ...draft, name: event.target.value });
                if (error) onClearError();
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'class-name-error' : undefined}
              placeholder="3 علوم تجريبية 1"
              className={`w-full rounded-lg border px-3 py-2 font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
                error ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
              }`}
            />
            {error && (
              <p id="class-name-error" role="alert" className="text-xs font-bold text-rose-700">
                {error}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="class-level" className="font-bold text-slate-700">
                المستوى الدراسي:
              </label>
              <select
                id="class-level"
                value={draft.level || '3AS'}
                onChange={event => onChange({ ...draft, level: event.target.value as GradeLevel })}
                className="min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 font-bold"
              >
                <option value="1AS_ARTS">1 ج.م آداب (2 سا/أسبوع)</option>
                <option value="1AS_SCIENCE">1 ج.م علوم وتكنولوجيا (1 سا/أسبوع)</option>
                <option value="2AS">السنة الثانية ثانوي 2AS (2 سا/أسبوع)</option>
                <option value="3AS">السنة الثالثة ثانوي بكالوريا 3AS (2 سا/أسبوع)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="class-stream" className="font-bold text-slate-700">
                الشعبة:
              </label>
              <input
                id="class-stream"
                type="text"
                value={draft.stream || ''}
                onChange={event => onChange({ ...draft, stream: event.target.value })}
                placeholder="علوم تجريبية / رياضيات / آداب..."
                className="min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="class-room" className="font-bold text-slate-700">
                القاعة:
              </label>
              <input
                id="class-room"
                type="text"
                value={draft.roomNumber || ''}
                onChange={event => onChange({ ...draft, roomNumber: event.target.value })}
                placeholder="القاعة 04"
                className="min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
              />
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-700">لون التمييز:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {CLASS_COLORS.map(color => {
                  const isSelected =
                    (draft.color || DEFAULT_CLASS_COLOR).toLowerCase() === color.toLowerCase();
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => onChange({ ...draft, color })}
                      aria-label={`اختيار اللون ${color}`}
                      aria-pressed={isSelected}
                      className={`h-11 w-11 cursor-pointer rounded-lg border-2 transition-transform hover:scale-105 ${
                        isSelected ? 'scale-105 border-slate-900' : 'border-slate-200'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  );
                })}
                <input
                  type="color"
                  value={draft.color || DEFAULT_CLASS_COLOR}
                  onChange={event => onChange({ ...draft, color: event.target.value })}
                  aria-label="لون مخصص"
                  className="h-11 w-14 cursor-pointer rounded-lg border border-slate-300 bg-white p-0.5"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
          <button
            onClick={onClose}
            className="min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700"
          >
            إلغاء
          </button>
          <button
            onClick={onSave}
            disabled={saving || !draft.name?.trim()}
            className="min-h-11 rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'جارٍ الحفظ...' : 'حفظ القسم'}
          </button>
        </div>
      </div>
    </div>
  );
}
