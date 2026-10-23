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
  في `participation_score` (0 أو 2 أو 4 داخل حدّ 0–8) عند ضغط «تطبيق على القسم» فقط.
- تغيير أي حقل متزامن يستلزم: تحديث `lib/storage.ts` (عقد `AppState`)،
  و`lib/supabase/core-sync.ts`، وmigration إن كان عموداً، واختبار مزامنة
  يثبت الدورة ذهاباً وإياباً.

## 5. قواعد المجال والواجهة

- الساعات الأسبوعية: `getWeeklyHours()`؛ 1 ج.م علوم ساعة واحدة، وبقية الأقسام
  ساعتان.

### التقويم المستمر — قرار وزاري بأوزان ثابتة

نموذج التقويم محسوم بقرار وزاري، والمصدر الوحيد للحساب هو
`calculateEvaluationBreakdown()` في `lib/grade-calculator.ts`.

| مكوّن التطبيق | السقف | طريقة الإدخال والحساب |
| --- | --- | --- |
| السلوك والانضباط | 3 | خصم 0.5 عن كل مخالفة |
| المواظبة والحضور | 3 | خصم 0.5 عن كل غياب غير مبرر؛ التأخر للمتابعة فقط |
| الكراس وأدوات التعلم | 6 | حالة مباشرة: 6 أو 4 أو 2 أو 0 |
| المشاركة والنشاط | 8 | توثيق آلي 4 + تقدير أستاذ 4 |

- الأوزان **3/3/6/8 ثابتة ولا تُعدَّل من الواجهة**؛ القابل للضبط هو شدّة
  الخصم السلوكي (`disruptionDeduction` ثم `disruptionRepeatDeduction`)، وخصم
  الغياب غير المبرر، ونسبة المشاركة المطلوبة (`participationTargetRatio`).
  تقسيم المشاركة **4 + 4 تنظيم داخلي مبسّط** وليس ادعاءً بتفصيل وزاري حرفي.
- السلوك: خصم **0.5 عن كل مخالفة من الأولى** (`disruptionDeduction =
  disruptionRepeatDeduction = 0.5`)، بأرضية 0؛ ست مخالفات تستهلك العنصر كاملاً.
  الواجهة تعرض حقلاً واحداً ويكتب القيمتين معاً، وتُرقّى الثنائية القديمة
  0.25/0.5 مرة واحدة في `normalizeCalendarSettings`.
- المواظبة: `max(0, 3 − 0.5 × الغيابات غير المبررة)`. الغياب المبرر دون خصم،
  والتأخر لا يدخل في العلامة (`lateDeduction = 0`)؛ وتبقى سجلاته القديمة قابلة
  للقراءة. واجهة التسجيل في `AttendanceSanad` تعرض **زر الغياب وحده**، بلا زرين
  مستقلين للتأخر أو التبرير؛ الضغطة الأولى تسجّل الغياب والثانية تعيد «حاضر».
- الكراس: متوسط درجات الجولات مباشرة من 6؛ الحالات هي «مكتمل ومنظم» 6،
  «جيد، مع نقص طفيف» 4، «ناقص أو غير منظم» 2، «منعدم أو لم يحضر الكراس» 0.
  لا ضرب في `6 ÷ 5`. عند القراءة فقط تُرقّى القيمتان القديمتان 5 و2.5 إلى 6 و2.
  المراقبة الفصلية هي **المصدر الوحيد** للنقطة. حُذف زر «الكراس −» اليومي، وتبقى
  `unwrittenLessons` القديمة محفوظة ومتزامنة كأرشيف لكنها لا تدخل الحساب.
- المشاركة = **توثيق آلي (4)** يُقاس على الحصص التي وُثِّق فيها شيء فعلاً
  (`documentedSessions`، لا كل الحصص) + **تقدير الأستاذ (4)** من الحالات
  `4 · 2 · 0` المحفوظة في `StudentGrade.participationScore`. يبلغ التوثيق سقفه
  عند **30%**؛ وما دونها `4 × min(1, نسبة المشاركة ÷ 0.30)` ثم يُقرّب لأقرب 0.5.
- **اقتراح التقدير** (`lib/participation-judgement.ts`): عند فتح «مراجعة التقويم»
  تُملأ القائمة بالتقدير المحفوظ، وإلا بـ«متوسط (2/4)» لكل تلميذ. الاقتراح محايد
  وقابل للتعديل، ولا يُكتب في الحالة إلا بزر «تطبيق على القسم»؛ إغلاق النافذة
  لا يحفظ شيئاً. القيم القديمة المعروفة 5 و3.75 و2.5 و1.25 تُقرأ كـ4 و2 و2 و0.
- **قاعدة الأدلة**: السلوك والمواظبة يعملان بالاستثناء؛ لا واقعة تعني لا خصم.
  الكراس بلا مراقبة، والمشاركة بلا توثيق وتقدير، يُستبعدان من البسط والمقام
  وتُعاد النسبة إلى 20؛ لا صفر جزاءً على نقص التسجيل. تُرجع
  الدالة `missing` لعرض «—» بدل الصفر.
- **جولة الكراس واحدة في الفصل** (الافتراض: `notebookRounds = 1`، والحد الأقصى 2
  لسجل قديم). الجولة تمتد على عدة حصص (8–10 تلاميذ لكل حصة) وتُحفظ في
  `SessionRecord.notebookChecks[studentId]` مع `round/score/at`.
  `nextOpenRound(checks, ids, rounds)` لا تفتح جولة 2 إلا إذا كان الإعداد 2،
  و`notebookScoresFor(..., rounds)` و`calculateEvaluationBreakdown` يقرآن الجولات
  المطلوبة فقط؛ الأحدث حسب `at` يفوز، والحصص الملغاة تُستثنى، ولا تُكتب فوق
  تفتيش جولة أخرى في الحصة نفسها. أي درجة في جولة زائدة تبقى في السجل ولا تدخل
  الحساب. عند اكتمال الجولة الوحيدة يتحول الزر إلى «مراجعة الكراس» للتعديل.
- الإدخال: الحضور والمشاركة السريعة وجولة الكراس في `AttendanceSanad`،
  والمراجعة والتقدير و«تطبيق على القسم» في `GradesAndEvaluation`، وجدول
  الأوزان في `SettingsSanad`.
- الاختبارات الملزمة: `grade-calculator.test.ts`، `notebook-rounds.test.ts`،
  `participation-judgement.test.ts`، `attendance-status.test.ts` (الغياب من
  الضغطة الأولى)، `student-profile.test.ts` (الفصول السابقة والقراءة دون كتابة)،
  `academic-calendar.test.ts` (ترقية الإعدادات القديمة)،
  `grades-sync.test.ts` (حدود الرفع)، `offline-recovery.test.ts` (دورة
  `notebookChecks` وإعدادات التقويم)، `migrate-local-state.test.ts`.
- الوحدة ذات الحجم الساعي حصة واحدة (`isSingleSessionUnit`) تُدوَّن دون ترقيم؛
  لا تكتب `(1)` في عنوانها ولا تحفظ `partNumber` لها.
- ملاحظات دفتر النصوص مرتبطة بالقسم: لا تعرض داخل قسم ملاحظة كُتبت في قسم آخر.
- السنة ثلاثة فصول (`1 | 2 | 3`). `AppState.activeTrimester` هو المصدر الوحيد للفصل
  الحالي، ويُغيَّر من `GlobalContextBar` فقط. كل ما يُحتسب أو يُصدَّر (الحضور،
  السلوك، المواظبة، الكراس، المشاركة، دفتر النصوص، الوثائق، المجالس) يجب أن يمر
  عبر `filterByTrimester()` أو `isDateInTrimester()` قبل العرض أو الحساب، حتى
  يبدأ كل فصل من صفر.
- `StudentGrade` مفتاحه المنطقي `studentId + trimester`؛ لا تدمج صفوف فصلين.
- ملف التلميذ قراءة فقط عبر `selectStudentProfile()` في `lib/student-profile.ts`:
  يعرض الفصل النشط ثم السابقة، ويشتق النتائج والحضور من السجلات المحفوظة نفسها
  دون تغيير `activeClassId` أو `activeTrimester` أو إنشاء outbox. النقص `—` وليس
  صفراً، ولا تعرض البطاقة خانة التأخر. يفتح من `StudentNameButton` أو نتيجة
  البحث؛ لا تُحوّل صفوف التحرير كاملة إلى أزرار ولا تُراكب الحوارات.
- تسميات عناصر التقويم المستمر تأتي من `lib/evaluation-labels.ts` ولا تُكتب
  يدويًا في المكوّنات (السلوك والانضباط، المواظبة والحضور، الكراس وأدوات
  التعلم، المشاركة الصفية).
- استيراد الرقمنة/ممتاز يمر عبر parsers والـ roster batch دون إسقاط الطلاب
  الموجودين أو الكتابة فوق بيانات مستخدم آخر.
- مستورد Excel في `lib/excel-sync.ts` يقرأ **كل أوراق الملف** ويقبل العناوين
  غير المنظّمة (`detectRosterLayout`: عمود اسم كامل، أو لقب/اسم منفصلان، أو
  تخمين من القيم). القوائم تستقبل اسم القسم وأسماء التلاميذ فقط، وأي ورقة
  طاقم/إدارة (`isAdministrativeSheet`) تُعرض في المعاينة ولا تُستورد. ترويسة
  الملف (المؤسسة/الولاية/السنة) تُنظَّف في `lib/institution-metadata.ts` وتُدمج
  في `profile` بقاعدة واحدة: الحقل الفارغ والسنة الافتراضية يُملآن من الملف،
  وما كتبه الأستاذ بنفسه لا يُستبدل بل يُبلَّغ عنه. لكل ورقة ملخّص في
  `ParsedDigitizationResult.sheets` ويختار الأستاذ ما يُستورد، والقائمة المكرّرة
  في أكثر من ورقة (ورقة لكل مادة) تُستورد مرة واحدة (`SKIPPED_DUPLICATE`).
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
- الطباعة تمر عبر `printElement(id, { landscape })` من `lib/print.ts`، الذي
  ينسخ أنماط التطبيق داخل إطار معزول RTL بمقاس A4 وهوامش 7 مم وحجم 9.5pt
  (الجداول 8.5pt)؛ لا تستدعِ `window.print()` على الصفحة كاملة. العنصر المطبوع
  يجب أن يُوسم `no-print` لما لا يُطبع، وأن يبقى التخطيط تحت صفحتين A4.
- تصدير Word يمر عبر `lib/docx-exporter.ts`: A4 وهوامش 1.2 سم وخط 10pt و`bidi`
  على كل فقرة و`bidiVisual` على كل جدول؛ لا تُبنَ حزمة OOXML داخل مكوّن.
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
