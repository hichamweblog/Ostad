'use client';

import type { SyncConflictDescriptor } from '@/lib/sync-outbox';
import { AccessibleDialog } from '@/components/AccessibleDialog';

function preview(value: unknown): string {
  if (value === undefined) return 'لا توجد بيانات قابلة للعرض';
  return JSON.stringify(value, null, 2);
}

export function SyncConflictDialog({
  conflict,
  busy,
  onKeepRemote,
  onKeepLocal,
}: {
  conflict: SyncConflictDescriptor | null;
  busy: boolean;
  onKeepRemote: () => Promise<void>;
  onKeepLocal: () => Promise<void>;
}) {
  if (!conflict) return null;
  return (
    <AccessibleDialog
      open={Boolean(conflict)}
      titleId="sync-conflict-title"
      describedBy="sync-conflict-desc"
      onClose={() => {}}
      className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white p-6 shadow-2xl border border-slate-200"
    >
      <div>
        <h2 id="sync-conflict-title" className="text-lg font-bold text-slate-900">مراجعة تعارض المزامنة</h2>
        <p id="sync-conflict-desc" className="mt-2 text-sm text-slate-600">
          يوجد تعديل سحابي أحدث من التعديل المحلي. لن يتم الكتابة فوق أي نسخة دون اختيارك.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <h3 className="font-bold text-amber-900">النسخة المحلية (revision {conflict.localRevision})</h3>
            <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap text-xs text-amber-950 font-mono">{preview(conflict.localPayload)}</pre>
          </section>
          <section className="rounded-xl border border-sky-200 bg-sky-50 p-3">
            <h3 className="font-bold text-sky-900">النسخة السحابية (revision {conflict.remoteRevision})</h3>
            <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap text-xs text-sky-950 font-mono">{preview(conflict.remotePayload)}</pre>
          </section>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void onKeepRemote()}
            className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            الاحتفاظ بالسحابية
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void onKeepLocal()}
            className="min-h-11 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] px-4 py-2 text-sm font-bold text-white transition-colors disabled:opacity-50 cursor-pointer"
          >
            الاحتفاظ بالمحلية
          </button>
        </div>
      </div>
    </AccessibleDialog>
  );
}
