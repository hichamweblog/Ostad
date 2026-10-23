'use client';

import type { Student } from '@/lib/types';
import { X } from 'lucide-react';
import { useDialogA11y } from '@/hooks/use-dialog-a11y';

interface StudentFormDialogProps {
  open: boolean;
  draft: Partial<Student> | null;
  error: string | null;
  saving: boolean;
  onChange: (next: Partial<Student>) => void;
  onClearError: () => void;
  onClose: () => void;
  onSave: () => void;
}

/** Add / edit one student inside the active class. */
export function StudentFormDialog({
  open,
  draft,
  error,
  saving,
  onChange,
  onClearError,
  onClose,
  onSave,
}: StudentFormDialogProps) {
  const dialogRef = useDialogA11y(open, onClose);
  if (!open || !draft) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-modal-title"
        className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl outline-none"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 id="student-modal-title" className="text-base font-black text-slate-900">
            {draft.fullName ? 'تعديل بيانات التلميذ' : 'إضافة تلميذ جديد'}
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
            <label htmlFor="student-full-name" className="font-bold text-slate-700">
              الاسم واللقب:
            </label>
            <input
              id="student-full-name"
              type="text"
              value={draft.fullName || ''}
              onChange={event => {
                onChange({ ...draft, fullName: event.target.value });
                if (error) onClearError();
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'student-name-error' : undefined}
              placeholder="الاسم الكامل للتلميذ"
              className={`w-full rounded-lg border px-3 py-2 font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
                error ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
              }`}
            />
            {error && (
              <p id="student-name-error" role="alert" className="text-xs font-bold text-rose-700">
                {error}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="student-number" className="font-bold text-slate-700">
                الرقم في القائمة:
              </label>
              <input
                id="student-number"
                type="number"
                min={1}
                value={draft.numberInList || 1}
                onChange={event => onChange({ ...draft, numberInList: Number(event.target.value) })}
                className="min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="student-gender" className="font-bold text-slate-700">
                الجنس:
              </label>
              <select
                id="student-gender"
                value={draft.gender || 'M'}
                onChange={event => onChange({ ...draft, gender: event.target.value as 'M' | 'F' })}
                className="min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="M">ذكر</option>
                <option value="F">أنثى</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="student-registration" className="font-bold text-slate-700">
              رقم التعريف / التسجيل بالرقمنة:
            </label>
            <input
              id="student-registration"
              type="text"
              value={draft.registrationNumber || ''}
              onChange={event => onChange({ ...draft, registrationNumber: event.target.value })}
              placeholder="اختياري"
              className="min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
            />
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
            disabled={saving || !draft.fullName?.trim()}
            className="min-h-11 rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'جارٍ الحفظ...' : 'حفظ التلميذ'}
          </button>
        </div>
      </div>
    </div>
  );
}
