'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastEvent {
  id: number;
  message: string;
  type: ToastType;
}

let toastListener: ((event: ToastEvent) => void) | null = null;
let toastSequence = 0;

/**
 * إظهار إشعار. الإشعارات تُرتَّب في طابور بدل أن يقطع كلٌّ منها سابقه،
 * ويمكن إغلاقها يدويًا، ويعلنها قارئ الشاشة عبر aria-live.
 */
export const showToast = (message: string, type: ToastType = 'info') => {
  if (!toastListener) return;
  toastSequence += 1;
  toastListener({ id: toastSequence, message, type });
};

const MAX_VISIBLE = 3;
const DURATION: Record<ToastType, number> = {
  success: 4000,
  info: 4500,
  warning: 6000,
  error: 8000,
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastEvent[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  useEffect(() => {
    const activeTimers = timers.current;
    toastListener = (event: ToastEvent) => {
      setToasts((current) => [...current, event].slice(-MAX_VISIBLE));
      const timer = setTimeout(() => dismiss(event.id), DURATION[event.type]);
      timers.current.set(event.id, timer);
    };
    return () => {
      toastListener = null;
      activeTimers.forEach((timer) => clearTimeout(timer));
      activeTimers.clear();
    };
  }, [dismiss]);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[140] flex flex-col items-center gap-2 sm:inset-x-auto sm:bottom-auto sm:top-20 sm:right-1/2 sm:translate-x-1/2"
      dir="rtl"
    >
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const styles: Record<ToastType, string> = {
          success: 'bg-[var(--success)] text-white',
          error: 'bg-[var(--danger)] text-white',
          warning: 'bg-[var(--warning)] text-white',
          info: 'bg-[var(--primary-ink)] text-white',
        };
        const Icon = toast.type === 'success' ? CheckCircle2 : toast.type === 'warning' || isError ? AlertTriangle : Info;
        return (
          <div
            key={toast.id}
            role={isError ? 'alert' : 'status'}
            aria-live={isError ? 'assertive' : 'polite'}
            className={`pointer-events-auto flex w-full max-w-md items-start gap-2 rounded-xl px-4 py-3 text-sm font-bold shadow-lg motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 ${styles[toast.type]}`}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="flex-1 leading-6">{toast.message}</span>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="إغلاق الإشعار"
              className="-ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-current/80 transition-colors hover:bg-white/15"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
