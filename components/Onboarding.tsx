'use client';

import React, { useState } from 'react';
import { useAppState } from '@/hooks/app-state-context';
import { X, ArrowLeft, ArrowRight, Users, School, Sparkles } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
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

  const handleNext = async () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      // Save profile if changed
      if (name || schoolName || stateName) {
        setIsSaving(true);
        try {
          await updateStateAndWait(prev => ({
            ...prev,
            profile: {
              ...prev.profile,
              name: name || prev.profile.name,
              schoolName: schoolName || prev.profile.schoolName,
              stateName: stateName || prev.profile.stateName,
            },
            onboardingDismissed: true,
          }));
        } catch (error) {
          console.error('Failed to save onboarding data:', error);
        } finally {
          setIsSaving(false);
        }
      } else {
        // Just mark onboarding as dismissed
        await updateStateAndWait(prev => ({ ...prev, onboardingDismissed: true }));
      }
      onComplete();
    }
  };

  const handleSkip = async () => {
    await updateStateAndWait(prev => ({ ...prev, onboardingDismissed: true }));
    onComplete();
  };

  const currentStep = steps[step];
  const Icon = currentStep.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-teal-600 to-teal-700 px-6 py-8 text-white">
          <button
            onClick={handleSkip}
            className="absolute top-4 left-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white/20 rounded-2xl p-4">
              <Icon className="w-12 h-12" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center">{currentStep.title}</h2>
          <p className="text-teal-100 text-center mt-2 text-sm">{currentStep.description}</p>
          
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
              <div className="bg-teal-50 rounded-xl p-4">
                <p className="text-sm text-teal-900 leading-relaxed">
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
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  الاسم الكامل <span className="text-slate-400">(اختياري)</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: أحمد بن محمد"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  اسم المؤسسة <span className="text-slate-400">(اختياري)</span>
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="مثال: ثانوية ابن خلدون"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  الولاية <span className="text-slate-400">(اختياري)</span>
                </label>
                <input
                  type="text"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  placeholder="مثال: تلمسان"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  dir="rtl"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 text-center">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-teal-600">1</div>
                  <div className="text-xs text-slate-600 mt-1">أضف أقسامك</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-teal-600">2</div>
                  <div className="text-xs text-slate-600 mt-1">استورد التلاميذ</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-teal-600">3</div>
                  <div className="text-xs text-slate-600 mt-1">سجّل الحضور</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-teal-600">4</div>
                  <div className="text-xs text-slate-600 mt-1">احسب النقاط</div>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                يمكنك البدء فورًا أو تخطي هذه الخطوة والعودة لاحقًا
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 flex items-center justify-between gap-3">
          <button
            onClick={handleSkip}
            className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            تخطي
          </button>

          <button
            onClick={handleNext}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white rounded-xl font-semibold transition-colors"
          >
            {step === steps.length - 1 ? (
              <>
                ابدأ الاستخدام
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
      </div>
    </div>
  );
}
