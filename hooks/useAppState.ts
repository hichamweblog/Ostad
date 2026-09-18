import { useState, useEffect, useSyncExternalStore } from 'react';
import { AppState, getInitialState, loadAppState, saveAppState } from '@/lib/storage';

const emptySubscribe = () => () => {};

function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function useAppState() {
  const isMounted = useIsMounted();
  const [state, setState] = useState<AppState>(() => {
    if (typeof window !== 'undefined') {
      return loadAppState();
    }
    return getInitialState();
  });

  const handleUpdateState = (updater: (prev: AppState) => AppState) => {
    setState(prev => updater(prev));
  };

  useEffect(() => {
    if (isMounted) {
      const handler = setTimeout(() => {
        try {
          saveAppState(state);
        } catch (error) {
          import('@/components/Toast').then(({ showToast }) => {
            showToast('⚠️ تحذير: مساحة التخزين ممتلئة. يرجى تصدير نسخة احتياطية وحذف الملفات غير الضرورية.', 'warning');
          });
        }
      }, 500);
      return () => clearTimeout(handler);
    }
  }, [state, isMounted]);

  return { state, handleUpdateState, isMounted };
}
