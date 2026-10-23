'use client';

import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

/**
 * شاشة خطأ موحّدة لكل المسارات.
 *
 * الخطأ في التطبيق نادرًا ما يعني أن البيانات ضاعت: النسخة المحلية موجودة
 * دائمًا. لذلك تعرض الشاشة ثلاث طرق خروج بدل زر واحد غامض.
 */
export function RouteError({
  reset,
}: {
  error?: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[50vh] items-center justify-center p-6" role="alert">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-amber-50">
          <AlertTriangle className="h-5 w-5 text-amber-700" aria-hidden="true" />
        </div>
        <h1 className="mb-2 text-lg font-bold text-[var(--text-primary)]">تعذّر عرض هذه الشاشة</h1>
        <p className="mb-1 text-sm leading-7 text-[var(--text-secondary)]">
          حدث خطأ غير متوقع أثناء العرض. بياناتك المحفوظة لم تتأثر.
        </p>
        <p className="mb-5 text-xs text-[var(--text-tertiary)]">
          إن تكرر الخطأ، أعد تحميل الصفحة أو انتقل إلى لوحة التحكم ثم حاول مجددًا.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-bold text-white transition-colors hover:bg-[var(--primary-hover)]"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            إعادة المحاولة
          </button>
          <Link
            href="/dashboard"
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border-default)] px-4 text-sm font-bold text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-subtle)]"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            لوحة التحكم
          </Link>
        </div>
      </div>
    </main>
  );
}

export default RouteError;
