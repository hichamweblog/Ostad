'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getSupabaseEnv } from '@/lib/supabase/env';
import { getCachedAuthUser, initializeAuthState, subscribeToAuthState } from '@/lib/supabase/auth-state';
import { showToast } from '@/components/Toast';
import { clearAppStateCache } from '@/lib/state-cache';
import type { User } from '@supabase/supabase-js';

interface AuthGateProps {
  children: (user: User | null, onSignOut: () => void) => React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const cachedUser = getCachedAuthUser();
  const [user, setUser] = useState<User | null>(cachedUser ?? null);
  const configured = Boolean(getSupabaseEnv());
  const [loading, setLoading] = useState(configured && cachedUser === undefined);
  const [showOfflineFallback, setShowOfflineFallback] = useState(false);

  useEffect(() => {
    let timeoutId: number;
    if (loading) {
      timeoutId = window.setTimeout(() => setShowOfflineFallback(true), 2000);
    }
    return () => window.clearTimeout(timeoutId);
  }, [loading]);

  const handleContinueOffline = async () => {
    const client = createSupabaseBrowserClient();
    if (client) {
      const { data } = await client.auth.getSession();
      if (data.session?.user) {
        setUser(data.session.user);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    const callbackCode = new URLSearchParams(window.location.search).get('code');
    if (callbackCode && window.location.pathname === '/') {
      const callbackUrl = new URL('/auth/callback', window.location.origin);
      callbackUrl.searchParams.set('code', callbackCode);
      const next = new URLSearchParams(window.location.search).get('next');
      if (next) callbackUrl.searchParams.set('next', next);
      window.location.replace(callbackUrl.toString());
      return () => {
        active = false;
      };
    }

    const unsubscribe = subscribeToAuthState((nextUser) => {
      if (!active) return;
      setUser(nextUser);
      setLoading(false);
    });
    void initializeAuthState()
      .then((nextUser) => {
        if (!active) return;
        setUser(nextUser);
        setLoading(false);
      })
      .catch((error) => {
        if (!active) return;
        console.error('Supabase session lookup failed:', error);
        setLoading(false);
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  if (!configured) return children(null, () => {});
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[var(--bg-page)]" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-[var(--muted-foreground)]">جارٍ الاتصال بالسحابة...</p>
        </div>
        {showOfflineFallback && (
          <button
            onClick={handleContinueOffline}
            className="px-6 py-2.5 rounded-full border border-[var(--border-default)] bg-white shadow-sm text-sm font-bold text-[var(--text-secondary)] active:bg-slate-50 transition-colors animate-in fade-in zoom-in duration-300"
          >
            المتابعة دون اتصال (الوضع المحلي)
          </button>
        )}
      </div>
    );
  }

  if (!user) return <AuthLanding />;
  return (
    children(user, () => void supabaseSignOut())
  );
}

async function supabaseSignOut() {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return;
  try {
    const { data } = await supabase.auth.getUser();
    if (data?.user?.id) {
      await clearAppStateCache(data.user.id);
    } else {
      await clearAppStateCache();
    }
  } catch {
    await clearAppStateCache();
  }
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Supabase sign-out failed:', error);
}

function AuthLanding() {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <main className="min-h-[100dvh] bg-[var(--bg-page)] flex flex-col" dir="rtl">
      <div className="flex-1 flex flex-col justify-center px-4 py-8 pb-32">
        <div className="mx-auto w-full max-w-lg text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-[var(--primary)] text-white rounded-3xl shadow-xl flex items-center justify-center font-black text-2xl rotate-3">
            مـ
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">معين الأستاذ</h1>
            <p className="text-[var(--text-secondary)] font-medium leading-relaxed max-w-sm mx-auto">
              دفتر رقمي منظم لإدارة الأقسام، الحضور، النقاط، والمخطط السنوي.
            </p>
          </div>
          <button
            onClick={() => setShowLogin(true)}
            className="w-full sm:w-auto min-w-[200px] h-14 rounded-2xl bg-[var(--primary)] text-white font-bold shadow-lg shadow-[var(--primary)]/30 active:scale-95 transition-all mx-auto mt-4"
          >
            ابدأ الآن
          </button>
        </div>
      </div>
      
      {/* Bottom Sheet Backdrop */}
      {showLogin && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm transition-opacity"
          onClick={() => setShowLogin(false)}
        />
      )}
      
      {/* Bottom Sheet Modal */}
      <div 
        className={`fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out ${showLogin ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="mx-auto w-12 h-1.5 bg-slate-200 rounded-full my-3" />
        <LoginPanel onBack={() => setShowLogin(false)} />
      </div>
    </main>
  );
}

function LoginPanel({ onBack }: { onBack: () => void }) {
  const [errorMessage, setErrorMessage] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('auth') === 'error'
      ? 'تعذر إكمال تسجيل الدخول. أعد المحاولة بعد قليل.'
      : null;
  });
  const [working, setWorking] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const signIn = async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    setWorking(true);
    setErrorMessage(null);
    try {
      const next = `${window.location.pathname}${window.location.search}`;
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Google sign-in failed:', error);
      setErrorMessage('تعذر بدء تسجيل الدخول. أعد المحاولة بعد قليل.');
      setWorking(false);
    }
  };

  const signInWithEmail = async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase || !email.trim()) return;
    setWorking(true);
    setErrorMessage(null);
    try {
      const next = `${window.location.pathname}${window.location.search}`;
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      setEmailSent(true);
    } catch (error) {
      console.error('Email sign-in failed:', error);
      setErrorMessage('تعذر إرسال رابط الدخول. تحقق من البريد وأعد المحاولة.');
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="px-6 pb-8 pt-2 w-full max-w-md mx-auto flex flex-col gap-5">
      <div className="text-center">
        <h2 className="text-xl font-black text-[var(--text-primary)]">تسجيل الدخول</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">اختر طريقة الدخول للوصول إلى دفترك</p>
      </div>
      
      {errorMessage && (
        <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-100">
          {errorMessage}
        </div>
      )}

      <button
        type="button"
        disabled={working}
        onClick={signIn}
        className="w-full h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center gap-3 hover:bg-slate-50 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span className="font-bold text-slate-700">المتابعة باستخدام Google</span>
      </button>

      <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
        <div className="h-px bg-slate-200 flex-1"></div>
        أو عبر البريد الإلكتروني
        <div className="h-px bg-slate-200 flex-1"></div>
      </div>

      <div className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="أدخل بريدك الإلكتروني"
          className="w-full h-14 rounded-2xl bg-slate-50 border border-slate-200 px-4 text-center text-sm outline-none focus:border-[var(--primary)] focus:bg-white transition-all dir-ltr"
          dir="ltr"
        />
        <button
          type="button"
          disabled={working || !email.trim()}
          onClick={() => void signInWithEmail()}
          className="w-full h-14 rounded-2xl bg-[var(--primary)] text-white font-bold shadow-lg shadow-[var(--primary)]/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none"
        >
          {emailSent ? 'تم الإرسال (راجع بريدك)' : working ? 'جارٍ الإرسال...' : 'إرسال رابط الدخول السحري'}
        </button>
      </div>
    </div>
  );
}
