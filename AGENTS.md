# معين الأستاذ — قواعد وكلاء الذكاء الاصطناعي

هذه الوثيقة هي **مصدر الحقيقة الوحيد لوكلاء الذكاء الاصطناعي** في المستودع.
يجب قراءتها قبل أي تعديل، وتحديثها عند تغيير المعمارية أو الحالة أو المزامنة.
لا توجد وثيقة أخرى ملزمة تنافسها.

## 1. هوية المنتج

- الاسم: معين الأستاذ (Mueen Al-Ostad).
- الإنتاج: `https://ostady.vercel.app`.
- المنتج: دفتر عمل شخصي لأستاذ العلوم الإسلامية في التعليم الثانوي بالجزائر.
- اللغة والاتجاه: العربية RTL؛ الأسلوب رسمي وموجز.
- الأيقونة المعتمدة: `brand-logo-text.png` مع حزمة PWA الموجودة في `public/`.

## 2. التقنية والبنية

- Next.js 16.3.8، App Router، React 19، TypeScript.
- Tailwind CSS v4 و`lucide-react`.
- البناء عبر Webpack في scripts الموجودة في `package.json`.
- المسارات المستقلة: `/dashboard`, `/classes`, `/students`, `/attendance`,
  `/grades`, `/council`, `/sessions`, `/annual-distribution`, `/curriculum`,
  `/timetable`, `/lesson-preparation`, `/documents`, `/settings`.
- لا تستخدم query tabs؛ التنقل يمر عبر `usePathname` و`router.push`.
- Server Components هي الافتراضي. استخدم `'use client'` فقط للـ hooks أو
  أحداث المتصفح أو IndexedDB، ومرر البيانات عبر حدود واضحة.
- `lib/storage.ts` هو عقد `AppState` والأنواع؛ لا تنشئ store أو snapshot
  منافساً لدورة `useCloudAppState`.
- ملفات التصدير الرسمية تمر عبر `exportToDocx`/`lib/docx-exporter.ts` بمقاس A4
  وRTL. لا تستبدل OOXML بملف نصي متنكر في `.docx`.

## 3. قواعد ممنوعة

- لا تستخدم `alert`, `prompt`, أو `confirm`; استخدم `showToast` و`ConfirmDialog`.
- لا تضف `dark:` أو وضعاً ليلياً؛ التطبيق فاتح فقط.
- لا تضف Hex داخل JSX/CSS الخاص بالواجهة؛ استخدم tokens من `app/globals.css`.
  ألوان قوالب التصدير المستقلة مسموحة داخل exporter constants.
- لا تضف عنوان صفحة ثانياً داخل المحتوى؛ العنوان في `TopHeaderSanad`.
- لا ترحّل بيانات تجريبية إلى Supabase. تبدأ مساحة المستخدم فارغة.
- لا تستدعي `reset_workspace` دون تأكيد صريح وتحذير واضح.
- لا تضف حالة قابلة للتغيير أو تخزيناً جديداً دون تحديد مصدر الحقيقة ومسار
  الرفع والحذف وإعادة المحاولة والتعارض واختباراته.

## 4. عقد البيانات والمزامنة

### مصدر الحقيقة

Supabase هو المصدر الوحيد للحالة المنظمة. IndexedDB هو:

1. cache محلي قابل للاستبدال.
2. outbox دائم للتعديلات غير المؤكدة.
3. تخزين ثنائي مؤقت لملفات PDF/avatar، وليس مصدراً مستقلاً.

`useCloudAppState` هو المالك الوحيد للتحميل والحفظ والمزامنة. المكونات تعدل
الحالة عبر `useAppState()` ولا تكتب إلى Supabase أو IndexedDB مباشرة إلا عبر
helpers المعتمدة.

### التحميل والدمج

- عند التحميل، اقرأ الكاش فقط لعرض العمل المحلي المؤقت أو لإعادة تشغيل outbox.
- بعد نجاح قراءة Supabase، تفوز السحابة دائماً.
- لا يُستبقى سجل غير موجود في السحابة إلا إذا كان له `pendingRecordIds` في
  outbox غير مؤكد.
- الحالة السحابية الفارغة حالة صحيحة؛ لا تستخدم طول roster لاستنتاج فشل الحذف.
- اقرأ `sync_tombstones` قبل الدمج. الحذف مطلق ويمنع إعادة ظهور السجل.
- `SyncConflictError` نتيجة فشل صريحة، ولا يُمسح شاهد الحذف تلقائياً.
- لا يسمح `allowTombstoneOverride` إلا بقرار صريح من نافذة التعارض.
- استخدم `shouldApplyRemoteRefresh` قبل وبعد `await` لمنع clobber لكتابة محلية.
- استخدم `isSelfAuthoredChange` لتجاهل صدى الجهاز نفسه و`nextRevisionFloor` لمنع
  رجوع ساعة المراجعة.

### Outbox

- كل عملية تحمل owner، entity، record id، revision، operation id، وdevice id.
- enqueue محلي حتى دون شبكة أو جلسة؛ flush فقط بعد تحقق جلسة مصادق عليها
  ومطابقة `auth.uid()` لمالك العملية.
- لا يُحذف outbox قبل إقرار Supabase.
- الفشل يبقي العملية في الطابور مع backoff وحالة ظاهرة.
- التعارض لا يعاد تلقائياً إلى ما لا نهاية؛ يعرض قرار keep remote/local.
- الخروج يفرغ الطابور إن أمكن، ثم يستدعي `purgeLocalUserData`. إذا فشل flush
  يجب تحذير المستخدم قبل قبول فقدان العمل غير المؤكد.

### عزل المستخدمين والملفات

- مفاتيح الحالة: `sanad:app-state:v4:<ownerId>`.
- PDF: `sanad:pdf:<ownerId>:<unitId>`.
- memoranda outbox: `sanad:memoranda-outbox:<ownerId>:<operationId>`.
- avatar/outbox/cache يجب حذفها عند الخروج؛ لا تترك legacy unscoped blobs.
- لا تعتمد على localStorage لبيانات المستخدم؛ المسموح فقط معرف الجهاز.
- Service Worker لا يخزن أي طلب Supabase أو OAuth مصادق عليه؛ قواعد
  `NetworkOnly` يجب أن تسبق `defaultCache` في `app/sw.ts`.
- سياسة CSP الحالية تبدأ بوضع `Report-Only` حتى لا تكسر OAuth أو موارد Next.js؛
  عند استقرار تقارير الإنتاج تُنقل إلى `Content-Security-Policy` الحاجزة مع
  إبقاء نطاقات Supabase وWebSocket وموارد PWA المطلوبة فقط.

### الكيانات

الجداول المملوكة للمستخدم: `profiles`, `app_settings`, `classes`, `students`,
`grades`, `sessions`, `attendance`, `session_behaviors`, `timetable_slots`,
`lesson_progress`, `lesson_plans`, `custom_units`, `dashboard_tasks`,
`file_assets`/`memoranda_files`, `sync_operations`, `sync_conflicts`,
`sync_tombstones`.

كل جدول متزامن يجب أن يملك RLS وسياسات owner صحيحة، وأن يكون في
`SYNCHRONIZED_TABLES` إذا كان Realtime مطلوباً، ومضافاً إلى `supabase_realtime`
مع `replica identity full` للأحداث التي تحتاج بيانات DELETE.

### تخزين حقول الحصص والدرجات

- **الحصة كاملة في JSON**: `sessions.teacher_notes` يحمل `SessionRecord`
  كاملاً، و`fromRow('session')` تعيد نشره. لذلك أي حقل جديد داخل الحصة —
  ومنه `notebookChecks` لجولات الكراس — **لا يحتاج عموداً ولا جدولاً جديداً**،
  شرط أن يبقى قابلاً للتسلسل وأن تعيده `reconcileEntityList` كما هو.
- `reconcileSessionMarks()` تعيد بناء `attendance` و`BEHAVIOR_FIELDS` فقط من
  جداولها؛ لا تمسح `notebookChecks` ولا بقية حقول JSON.
- **حدود أعمدة الدرجات في `grades`** هي أسقف القرار: `behavior_score` 0–3،
  `attendance_score` 0–3، `notebook_score` 0–6، `participation_score` 0–8.
  الترقية في
  `supabase/migrations/20261022120000_evaluation_weights_3_3_6_8.sql`: تقصّ
  القيم القديمة الخارجة عن السقف (4 و5 في السلوك/المواظبة) قبل فرض القيود،
  لأن القيود القديمة كانت 0–5 وتفشل الترقية على بيانات قائمة.
- `toRow` في `lib/supabase/core-sync.ts` يرفض أي قيمة خارج هذه الحدود برمي
  خطأ صريح (لا يقصّها صامتاً) حتى يتوقف الرفع بدل كتابة سجل فاسد؛ حافظ على
  تطابق الحدود بين `toRow` والـmigration.
- `lib/supabase/migrate-local-state.ts` يمرّر المكوّنات عبر
  `nullableScore(value, max)` أثناء الترحيل الأولي، ويُبقي `null` كما هو.
- **اقتراح تقدير المشاركة حالة واجهة فقط** (`lib/participation-judgement.ts`):
  لا يُضاف إلى `AppState` ولا إلى أي جدول ولا إلى حمولة المزامنة، وأثره يُحفظ
  في `participation_score` (0–5 داخل حدّ 0–8) عند ضغط «تطبيق على القسم» فقط.
- تغيير أي حقل متزامن يستلزم: تحديث `lib/storage.ts` (عقد `AppState`)،
  و`lib/supabase/core-sync.ts`، وmigration إن كان عموداً، واختبار مزامنة
  يثبت الدورة ذهاباً وإياباً.

## 5. قواعد المجال والواجهة

- الساعات الأسبوعية: `getWeeklyHours()`؛ 1 ج.م علوم ساعة واحدة، وبقية الأقسام
  ساعتان.

### التقويم المستمر — قرار وزاري بأوزان ثابتة

نموذج التقويم محسوم بقرار وزاري، والمصدر الوحيد للحساب هو
`calculateEvaluationBreakdown()` في `lib/grade-calculator.ts`.

| مكوّن التطبيق | السقف | ما يجمعه من القرار |
| --- | --- | --- |
| السلوك والانضباط | 3 | السلوك |
| المواظبة والحضور | 3 | الغيابات والتأخرات |
| الكراس والواجبات | 6 | الكراس (3) + الأدوات (3) مدموجة |
| المشاركة والنشاط | 8 | المشاركة (3) + الفردي (3) + الفوجي (1) + المبادرة (1) |

- الأوزان **3/3/6/8 ثابتة ولا تُعدَّل من الواجهة**؛ القابل للضبط هو شدّة
  الخصم السلوكي (`disruptionDeduction` ثم `disruptionRepeatDeduction`)، ووزن
  الغياب/التأخر، ونسبة المشاركة المطلوبة (`participationTargetRatio`).
- السلوك: خصم تصاعدي `first + repeat × (n − 1)` بأرضية 0، فلا يهبط العنصر من
  أول مخالفة.
- المواظبة: `3 × (1 − min(1, (غياب × وزن + تأخر × وزن) ÷ حصص))²`، ولا تُحتسب
  قبل 5 حصص، والحصص الملغاة لا تدخل المقام.
- الكراس: متوسط درجات الجولات (0–5) × `6 ÷ 5`؛ وإن لم تُنفَّذ جولة تُستخدم
  علامات «لم يكتب» كدليل احتياطي.
- المشاركة = **توثيق آلي (3)** يُقاس على الحصص التي وُثِّق فيها شيء فعلاً
  (`documentedSessions`، لا كل الحصص) + **تقدير الأستاذ (5)** من سلّم
  `0 · 1.25 · 2.5 · 3.75 · 5` المحفوظ في `StudentGrade.participationScore`.
- **اقتراح التقدير** (`lib/participation-judgement.ts`): عند فتح «مراجعة التقويم»
  تُملأ القائمة بتقدير محفوظ إن وُجد، وإلا باقتراح آلي من نسبة المشاركة
  الإيجابية إلى الحصص الموثّقة (مضاعف الهدف ← «مبادر»، الهدف ← «منتظم»، نصفه ←
  «متقطع»، أي مشاركة ← «نادر»، وصفرها مع ضعيفة ← «منعدم»)، والهدف الفعلي للتقدير
  لا يتجاوز 50% حتى لا يصبح من شارك في 90% «متقطعاً». يُخفض الاقتراح درجة إذا
  غلبت المشاركة الضعيفة. الاقتراح **قابل للتعديل**، ولا يُكتب في الحالة إلا بزر
  «تطبيق على القسم»؛ إغلاق النافذة لا يحفظ شيئاً.
- **قاعدة الأدلة**: أي مكوّن بلا أدلة كافية يُستبعد من البسط والمقام وتُعاد
  نسبة المجموع إلى 20؛ لا صفر جزاءً على نقص التسجيل ولا سقف مجاناً. تُرجع
  الدالة `missing` لعرض «—» بدل الصفر.
- **جولات الكراس**: جولتان في الفصل، الجولة الواحدة تمتد على عدة حصص (8–10
  تلاميذ لكل حصة) وتُحفظ في `SessionRecord.notebookChecks[studentId]` مع
  `round/score/at`. الجولة المفتوحة من `nextOpenRound()` والتقدّم من
  `roundProgress()`؛ الأحدث حسب `at` يفوز، والحصص الملغاة تُستثنى، ولا تُكتب
  فوق تفتيش جولة أخرى في الحصة نفسها.
- الإدخال: الحضور والمشاركة السريعة وجولة الكراس في `AttendanceSanad`،
  والمراجعة والتقدير و«تطبيق على القسم» في `GradesAndEvaluation`، وجدول
  الأوزان في `SettingsSanad`.
- الاختبارات الملزمة: `grade-calculator.test.ts`، `notebook-rounds.test.ts`،
  `academic-calendar.test.ts` (ترقية 5/5/5/5)، `grades-sync.test.ts` (حدود
  الرفع)، `offline-recovery.test.ts` (دورة `notebookChecks`)،
  `migrate-local-state.test.ts` (قصّ القيم القديمة).
- الوحدة ذات الحجم الساعي حصة واحدة (`isSingleSessionUnit`) تُدوَّن دون ترقيم؛
  لا تكتب `(1)` في عنوانها ولا تحفظ `partNumber` لها.
- ملاحظات دفتر النصوص مرتبطة بالقسم: لا تعرض داخل قسم ملاحظة كُتبت في قسم آخر.
- السنة ثلاثة فصول (`1 | 2 | 3`). `AppState.activeTrimester` هو المصدر الوحيد للفصل
  الحالي، ويُغيَّر من `GlobalContextBar` فقط. كل ما يُحتسب أو يُصدَّر (الحضور،
  السلوك، المواظبة، الكراس، المشاركة، دفتر النصوص، الوثائق، المجالس) يجب أن يمر
  عبر `filterByTrimester()` أو `isDateInTrimester()` قبل العرض أو الحساب، حتى
  يبدأ كل فصل من صفر.
- `StudentGrade` مفتاحه المنطقي `studentId + trimester`؛ لا تدمج صفوف فصلين.
- تسميات عناصر التقويم المستمر تأتي من `lib/evaluation-labels.ts` ولا تُكتب
  يدويًا في المكوّنات (السلوك والانضباط، المواظبة والحضور، الكراس والواجبات،
  المشاركة الصفية).
- استيراد الرقمنة/ممتاز يمر عبر parsers والـ roster batch دون إسقاط الطلاب
  الموجودين أو الكتابة فوق بيانات مستخدم آخر.
- أزرار اللمس لا تقل عن 44px، والأزرار الأيقونية لها accessible name.
- الحوارات تستخدم `AccessibleDialog`/`ResponsiveOverlay` مع focus trap وEscape
  واستعادة التركيز وAndroid Back.
- أخطاء النماذج inline مع `aria-invalid` و`aria-describedby` قدر الإمكان.
- لا تُعد نماذج بلا رسالة: أي `return` تحقّقي يجب أن يعرض خطأً تحت الحقل ويُعطّل
  زر الحفظ، لا أن يعود صامتًا.
- الحوارات لا تُغلق بالنقر على الخلفية افتراضيًا (`dismissOnBackdrop` مُعطَّل)
  تفاديًا لفقدان ما كُتب؛ فعّلها فقط في الحوارات المعلوماتية.
- الإشعارات تمر عبر `Toast` بطابور و`aria-live`، ولا تُقطع رسالة سابقة.
- النوافذ المكتوبة يدويًا (لا `AccessibleDialog`) تربط `useDialogA11y(open, onClose)`
  باللوحة: Focus trap + Escape + استعادة التركيز + قفل التمرير.
- الطباعة تمر عبر `printElement(id, { landscape })` من `lib/print.ts`، الذي ينسخ
  أنماط التطبيق داخل إطار معزول؛ لا تستدعِ `window.print()` على الصفحة كاملة.
- استيراد النقاط يمر عبر `parseGradeTable()` من `lib/grade-table.ts` (أسماء مطبَّعة،
  ورفض أي نقطة خارج 0–20)؛ لا تحلّل النص داخل المكوّن.
- احترم `prefers-reduced-motion` وsafe areas.

## 6. الاختبارات الإلزامية قبل إنهاء التغيير

شغّل على الأقل:

```bash
npm run lint
npm run test
npm run build
git diff --check
```

عند تغيير الحالة أو المزامنة يجب أن تغطي الاختبارات:

- remote empty + stale cache => remote wins.
- حذف آخر قسم ثم reload لا يعيد القسم أو الطلاب أو الحضور.
- tombstone يمنع edit/upsert حتى قرار override صريح.
- outbox survives offline and is removed only after acknowledgement.
- logout purges owner-scoped cache, binaries, avatar, memoranda, and outbox.
- two owners cannot read or flush each other's local records.
- realtime tables and service-worker NetworkOnly rules remain aligned.

## 7. توثيق القرارات

لا تنشئ وثيقة مراجعة أو جرد جديدة. عند تغيير الحالة أو المزامنة حدّث هذا الملف
في نفس التغيير، وأضف/حدّث اختباراً يثبت السلوك. `README.md` موجه للمستخدمين
ووصف المشروع فقط، ولا يكرر عقد المزامنة التفصيلي.
