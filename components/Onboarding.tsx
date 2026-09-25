'use client';

import React, { useState } from 'react';
import { useAppState } from '@/hooks/app-state-context';
import { AccessibleDialog } from './AccessibleDialog';
import { X, ArrowLeft, Users, School, Sparkles } from 'lucide-react';

interface OnboardingProps {
  onComplete?: () => void;
  onOpenSetup?: () => void;
}

export function Onboarding({ onComplete, onOpenSetup }: OnboardingProps) {
  const { state, updateStateAndWait } = useAppState();
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState(state.profile.name === 'أستاذ المادة' ? '' : state.profile.name);
  const [schoolName, setSchoolName] = useState(state.profile.schoolName || '');
  const [stateName, setStateName] = useState(state.profile.stateName || '');

  const steps = [
    {
      title: 'مرحبًا بك في مُعين!',
      description: 'تطبيقك الرقمي لإدارة الأقسام والحضور والنقاط',
      icon: Sparkles,
    },
    {
      title: 'بياناتك الشخصية',
      description: 'هذه البيانات ستظهر في الوثائق المطبوعة',
      icon: Users,
    },
    {
      title: 'هيا نبدأ!',
      description: 'يمكنك إضافة أقسامك الآن أو لاحقًا',
      icon: School,
    },
  ];

  const saveAndDismiss = async () => {
    setIsSaving(true);
    try {
      await updateStateAndWait(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          name: name.trim() || prev.profile.name,
          schoolName: schoolName.trim() || prev.profile.schoolName,
          stateName: stateName.trim() || prev.profile.stateName,
        },
        onboardingDismissed: true,
      }));
      onComplete?.();
      return true;
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
      return;
    }

    const saved = await saveAndDismiss();
    if (saved) onOpenSetup?.();
  };

  const handleSkip = async () => {
    setIsSaving(true);
    try {
      await updateStateAndWait(prev => ({ ...prev, onboardingDismissed: true }));
      onComplete?.();
    } finally {
      setIsSaving(false);
    }
  };

  const currentStep = steps[step];
  const Icon = currentStep.icon;

  return (
    <AccessibleDialog
      open
      titleId="onboarding-title"
      onClose={handleSkip}
      className="w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl"
    >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[var(--primary)] to-[var(--accent-navy)] px-6 py-8 text-white">
          <button
            onClick={handleSkip}
            className="absolute top-4 left-4 min-h-11 min-w-11 p-2 hover:bg-white/10 rounded-xl transition-colors flex items-center justify-center"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white/20 rounded-2xl p-4">
              <Icon className="w-12 h-12" />
            </div>
          </div>
          
          <h2 id="onboarding-title" className="text-2xl font-bold text-center">{currentStep.title}</h2>
          <p className="text-white/85 text-center mt-2 text-sm">{currentStep.description}</p>
          
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx === step ? 'w-8 bg-white' : 'w-2 bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {step === 0 && (
            <div className="space-y-4 text-center">
              <div className="bg-[var(--primary-soft)] rounded-xl p-4">
                <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                  مُعين سيساعدك في إدارة أقسامك وتلاميذك، تسجيل الحضور، حساب النقاط، 
                  وتصدير الوثائق الرسمية بكل سهولة.
                </p>
              </div>
              <p className="text-xs text-slate-500">
                بياناتك محفوظة بشكل آمن في السحابة ومتاحة من أي جهاز
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="onboarding-teacher-name" className="block text-sm font-semibold text-slate-700 mb-2">
                  الاسم الكامل <span className="text-slate-400">(اختياري)</span>
                </label>
                <input
                  id="onboarding-teacher-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: أحمد بن محمد"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition-all"
                  dir="rtl"
                />
              </div>

              <div>
                <label htmlFor="onboarding-school-name" className="block text-sm font-semibold text-slate-700 mb-2">
                  اسم المؤسسة <span className="text-slate-400">(اختياري)</span>
                </label>
                <input
                  id="onboarding-school-name"
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="مثال: ثانوية ابن خلدون"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition-all"
                  dir="rtl"
                />
              </div>

              <div>
                <label htmlFor="onboarding-state-name" className="block text-sm font-semibold text-slate-700 mb-2">
                  الولاية <span className="text-slate-400">(اختياري)</span>
                </label>
                <input
                  id="onboarding-state-name"
                  type="text"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  placeholder="مثال: تلمسان"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition-all"
                  dir="rtl"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 text-center">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-[var(--primary)]">1</div>
                  <div className="text-xs text-slate-600 mt-1">أضف أقسامك</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-[var(--primary)]">2</div>
                  <div className="text-xs text-slate-600 mt-1">استورد التلاميذ</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-[var(--primary)]">3</div>
                  <div className="text-xs text-slate-600 mt-1">سجّل الحضور</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-[var(--primary)]">4</div>
                  <div className="text-xs text-slate-600 mt-1">احسب النقاط</div>
                </div>
              </div>
              <p className="text-xs text-slate-500">
سنفتح لك شاشة الأقسام مباشرة لتبدأ باستيراد بيانات الرقمنة أو إضافة قسم يدوياً.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 flex items-center justify-between gap-3">
          <button
            onClick={handleSkip}
            className="min-h-11 px-3 text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            تخطي
          </button>

          <button
            onClick={handleNext}
            disabled={isSaving}
            className="flex min-h-11 items-center gap-2 px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:bg-[var(--primary)]/60 text-white rounded-xl font-semibold transition-colors"
          >
            {step === steps.length - 1 ? (
              <>
                إعداد الأقسام الآن
                <Sparkles className="w-4 h-4" />
              </>
            ) : (
              <>
                التالي
                <ArrowLeft className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </AccessibleDialog>
  );
}
