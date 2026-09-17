/**
 * دليل التقديرات والإرشادات البيداغوجية الرسمية لمادة العلوم الإسلامية
 * بالتعليم الثانوي الجزائري، مصنفة حسب فئات النقاط والمعدلات.
 */

export type ScoreTier =
  | 'EXCELLENT'      // 18 - 20
  | 'VERY_GOOD'      // 16 - 17.99
  | 'GOOD'           // 14 - 15.99
  | 'NEAR_GOOD'      // 12 - 13.99
  | 'AVERAGE'        // 10 - 11.99
  | 'BELOW_AVERAGE'  // 08 - 09.99
  | 'POOR'           // أقل من 08
  | 'UNRATED';       // لم تُسجل بعد أو غائب

export interface TierData {
  tier: ScoreTier;
  rangeLabel: string;
  label: string;
  colorClass: string;
  defaultEstimation: string;
  defaultGuidance: string;
  estimations: string[];
  guidanceList: string[];
}

export const PEDAGOGICAL_TIERS: Record<ScoreTier, TierData> = {
  EXCELLENT: {
    tier: 'EXCELLENT',
    rangeLabel: '18 - 20',
    label: 'امتياز (18 - 20)',
    colorClass: 'text-emerald-700 bg-emerald-50',
    defaultEstimation: 'ممتاز ومثالي',
    defaultGuidance: 'واصل تألقك واجتهادك المتميز',
    estimations: [
      'ممتاز ومثالي',
      'ممتاز',
      'عمل متميز ومتقن',
      'لوحة شرف',
      'تهاني الأستاذ',
      'استيعاب فائق للمفاهيم الشرعية',
      'إجابات نموذجية متكاملة'
    ],
    guidanceList: [
      'واصل تألقك واجتهادك المتميز',
      'استمر على هذا النهج المشرف',
      'ننتظر منك العلامة الكاملة دائماً',
      'قدوة حسنة لزملائك في القسم',
      'احرص على تعميق الاستدلال وتوظيف الشواهد الشرعية',
      'حفظك للمتون واستيعابك للأدلة يجعلك نموذجاً يُحتذى'
    ]
  },
  VERY_GOOD: {
    tier: 'VERY_GOOD',
    rangeLabel: '16 - 17.99',
    label: 'جيد جداً (16 - 17.99)',
    colorClass: 'text-teal-700 bg-teal-50',
    defaultEstimation: 'جيد جداً',
    defaultGuidance: 'استمر في العطاء لمزيد من التألق',
    estimations: [
      'جيد جداً',
      'نتائج مشجعة جداً',
      'عمل جاد ومتواصل',
      'تشجيعات الأستاذ',
      'مستوى واعد وتفوق ملحوظ',
      'مشاركة ممتازة وتحضير جاد'
    ],
    guidanceList: [
      'استمر في العطاء لمزيد من التألق والوصول للامتياز',
      'تركيز أكبر في ضبط المصطلحات الدقيقة',
      'احرص على تدعيم الإجابات بالشواهد النقلية',
      'عمل جاد ومثمر، واصل بهذا العزم والإصرار',
      'احرص على إدارة الوقت بدقة أثناء الاختبار'
    ]
  },
  GOOD: {
    tier: 'GOOD',
    rangeLabel: '14 - 15.99',
    label: 'جيد (14 - 15.99)',
    colorClass: 'text-blue-700 bg-blue-50',
    defaultEstimation: 'جيد واستيعاب سليم',
    defaultGuidance: 'بإمكانك تحقيق الأفضل بمزيد من التركيز',
    estimations: [
      'جيد واستيعاب سليم',
      'جيد',
      'مستوى مرضي',
      'تشجيع',
      'تحكم حسن في الكفاءات المستهدفة',
      'عمل منظم ونتائج إيجابية'
    ],
    guidanceList: [
      'بإمكانك تحقيق الأفضل بمزيد من التركيز وتفادي التسرع',
      'راجع المصطلحات الشرعية بدقة أكبر ورتب عناصر إجابتك',
      'اهتم بتنظيم ورقة الإجابة وتدقيق الشواهد',
      'مستوى واعد، ثابر للارتقاء إلى مرتبة الجيد جداً',
      'المواظبة والمشاركة الفعالة تضمن لك الامتياز'
    ]
  },
  NEAR_GOOD: {
    tier: 'NEAR_GOOD',
    rangeLabel: '12 - 13.99',
    label: 'قريب من الجيد (12 - 13.99)',
    colorClass: 'text-cyan-700 bg-cyan-50',
    defaultEstimation: 'قريب من الجيد',
    defaultGuidance: 'ضاعف جهودك للوصول إلى مرتبة الجيد',
    estimations: [
      'قريب من الجيد',
      'مستوى مقبول مع إمكانية التحسن',
      'عمل لا بأس به',
      'تحسن ملحوظ يستحق التشجيع',
      'نتائج مقبولة قابلة للتطوير'
    ],
    guidanceList: [
      'ضاعف جهودك للوصول إلى مرتبة الجيد',
      'ركّز أكثر أثناء شرح الدروس وحل التطبيقات الصفية',
      'احرص على حفظ الشواهد والمفاهيم الأساسية',
      'نظّم كراس المادة وراجع الدروس أولاً بأول',
      'تجنب التردد والخلط بين المفاهيم في الوضعيات الإدماجية'
    ]
  },
  AVERAGE: {
    tier: 'AVERAGE',
    rangeLabel: '10 - 11.99',
    label: 'متوسط (10 - 11.99)',
    colorClass: 'text-amber-700 bg-amber-50',
    defaultEstimation: 'متوسط، يستطيع التحسن',
    defaultGuidance: 'نتائج متوسطة تتطلب مضاعفة الجهد والمراجعة',
    estimations: [
      'متوسط، يستطيع التحسن',
      'متوسط',
      'على حافة النجاح',
      'تذبذب في النتائج',
      'مستوى متوسط يتطلب يقظة'
    ],
    guidanceList: [
      'نتائج متوسطة تتطلب مضاعفة الجهد والمراجعة الجادة',
      'عليك بالمشاركة الصفية وتدوين الكفاءات والملخصات',
      'تجنب الإهمال والتراخي في إنجاز الواجبات والبحوث',
      'راجع أخطاء الاختبار الفصلي وتداركها فوراً',
      'احرص على الانتباه الدائم داخل القسم وعدم التشتت'
    ]
  },
  BELOW_AVERAGE: {
    tier: 'BELOW_AVERAGE',
    rangeLabel: '08 - 09.99',
    label: 'دون المتوسط (08 - 09.99)',
    colorClass: 'text-orange-700 bg-orange-50',
    defaultEstimation: 'دون المتوسط، يحتاج متابعة',
    defaultGuidance: 'بحاجة لمراجعة جادة ومستمرة لتدارك النقص',
    estimations: [
      'دون المتوسط، يحتاج متابعة',
      'دون المتوسط',
      'قريب من المعدل، يحتاج مجهوداً',
      'تراجع في المستوى',
      'إنذار بيداغوجي'
    ],
    guidanceList: [
      'بحاجة لمراجعة جادة ومستمرة لتدارك النقص وبلوغ المعدل',
      'يجب التركيز التام في القسم وتجنب التشتت والغياب',
      'احرص على إنجاز الفروض والواجبات بمفردك لتثبيت المكتسبات',
      'استغل حصص المعالجة البيداغوجية لتحسين نتائجك',
      'كراس المادة غير مكتمل، تدارك النقص فوراً'
    ]
  },
  POOR: {
    tier: 'POOR',
    rangeLabel: 'أقل من 08',
    label: 'ضعيف (أقل من 08)',
    colorClass: 'text-rose-700 bg-rose-50',
    defaultEstimation: 'ضعيف، بحاجة لمعالجة بيداغوجية مستعجلة',
    defaultGuidance: 'بحاجة لمعالجة بيداغوجية مستعجلة وتدارك سريع',
    estimations: [
      'ضعيف، بحاجة لمعالجة بيداغوجية مستعجلة',
      'ضعيف',
      'ضعيف جداً',
      'نتائج مقلقة جداً',
      'تهاون ملحوظ وإهمال',
      'توبيخ',
      'إنذار من مجلس القسم'
    ],
    guidanceList: [
      'بحاجة لمعالجة بيداغوجية مستعجلة وتدارك سريع لتفادي الرسوب',
      'يجب استدراك التأخر والالتزام بإحضار الكراس والانضباط',
      'تهاون وإهمال واضح يستوجب تدخلاً فورياً وجدية في العمل',
      'يُطلب إشعار الولي فوراً لمتابعة الوضعية الدراسية المقلقة',
      'انضباط غائب وعمل شبه منعدم، انتبه لمستقبلك الدراسي'
    ]
  },
  UNRATED: {
    tier: 'UNRATED',
    rangeLabel: '-',
    label: '-',
    colorClass: 'text-slate-600 bg-slate-50',
    defaultEstimation: '',
    defaultGuidance: 'الالتزام بالحضور والمواظبة على الدروس',
    estimations: [
      '',
      'غائب مبرر',
      'غائب غير مبرر',
      'معفى بيداغوجياً',
      'انتقال مؤجل'
    ],
    guidanceList: [
      'الالتزام بالحضور والمواظبة وتبرير الغياب رسمياً لدى الإدارة',
      'الاتصال بالإدارة لإجراء التقويم التعويضي الاستدراكي',
      'متابعة خاصة لحالة الغياب المتكرر مع مستشار التوجيه'
    ]
  }
};

/**
 * تحديد الفئة البيداغوجية حسب المعدل أو النقطة
 */
export function getScoreTier(avg: number | null | undefined): ScoreTier {
  if (avg === null || avg === undefined || isNaN(avg)) return 'UNRATED';
  if (avg >= 18) return 'EXCELLENT';
  if (avg >= 16) return 'VERY_GOOD';
  if (avg >= 14) return 'GOOD';
  if (avg >= 12) return 'NEAR_GOOD';
  if (avg >= 10) return 'AVERAGE';
  if (avg >= 8) return 'BELOW_AVERAGE';
  return 'POOR';
}

/**
 * التقدير البيداغوجي الافتراضي حسب النقطة
 */
export function getDefaultEstimation(avg: number | null | undefined): string {
  const tier = getScoreTier(avg);
  return PEDAGOGICAL_TIERS[tier].defaultEstimation;
}

/**
 * الإرشاد البيداغوجي الافتراضي حسب النقطة
 */
export function getDefaultGuidance(avg: number | null | undefined): string {
  const tier = getScoreTier(avg);
  return PEDAGOGICAL_TIERS[tier].defaultGuidance;
}
