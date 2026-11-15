# معين الأستاذ — قواعد وكلاء الذكاء الاصطناعي

هذه الوثيقة هي **مصدر الحقيقة الوحيد لوكلاء الذكاء الاصطناعي** في المستودع، إلى جانب `README.md` الموجه للمستخدمين والتوثيق العام.
يجب قراءتها قبل أي تعديل، وتحديثها عند تغيير المعمارية أو الحالة أو المزامنة.
**يُمنع منعاً باتاً إنشاء مجلدات أو ملفات توثيق أخرى (مثل `docs/`) منعاً للتشتت**؛ كل قاعدة أو قرار هندسي يُوثق هنا مباشرة.

## 1. هوية المنتج

- الاسم: معين الأستاذ (Mueen Al-Ostad).
- الإنتاج: `https://ostady.vercel.app`.
- المنتج: دفتر عمل شخصي لأستاذ العلوم الإسلامية في التعليم الثانوي بالجزائر.
- اللغة والاتجاه: العربية RTL؛ الأسلوب رسمي وموجز.
- الأيقونة المعتمدة: `brand-logo-text.png` مع حزمة PWA الموحدة في `public/`.

## 2. التقنية والبنية

- Next.js 16.3.8، App Router، React 19، TypeScript.
- Tailwind CSS v4 و`lucide-react`.
- البناء عبر Webpack في سكربتات `package.json`.
- المسارات المستقلة: `/dashboard`, `/classes`, `/students`, `/attendance`, `/grades`, `/council`, `/sessions`, `/annual-distribution`, `/curriculum`, `/timetable`, `/lesson-preparation`, `/documents`, `/settings`.
- لا تستخدم query tabs؛ التنقل يمر عبر `usePathname` و`router.push`.
- Server Components هي الافتراضي. استخدم `'use client'` فقط للـ hooks أو أحداث المتصفح أو IndexedDB، ومرر البيانات عبر حدود واضحة.
- `lib/storage.ts` هو عقد `AppState` والأنواع؛ لا تنشئ store أو snapshot منافساً لدورة `useCloudAppState`.
- ملفات التصدير الرسمية تمر عبر `exportToDocx`/`lib/docx-exporter.ts` بمقاس A4 وRTL. لا تستبدل OOXML بملف نصي متنكر في `.docx`.

## 3. قواعد ممنوعة

- لا تستخدم `alert`, `prompt`, أو `confirm`؛ استخدم `showToast` و`ConfirmDialog`.
- لا تضف `dark:` أو وضعاً ليلياً؛ التطبيق فاتح فقط.
- لا تضف Hex داخل JSX/CSS الخاص بالواجهة؛ استخدم tokens من `app/globals.css`. ألوان قوالب التصدير المستقلة مسموحة داخل exporter constants.
- لا تضف عنوان صفحة ثانياً داخل المحتوى؛ العنوان في `TopHeaderSanad`.
- لا ترحّل بيانات تجريبية إلى Supabase. تبدأ مساحة المستخدم فارغة دائماً.
- لا تستدعي `reset_workspace` دون تأكيد صريح وتحذير واضح ونسخة احتياطية.
- لا تضف حالة قابلة للتغيير أو تخزيناً جديداً دون تحديد مصدر الحقيقة ومسار الرفع والحذف وإعادة المحاولة والتعارض واختباراته.
- لا تنشئ ملفات توثيق مستقلة في مجلدات فرعية؛ التوثيق ينحصر في `AGENTS.md` و`README.md` فقط.

## 4. عقد البيانات والمزامنة

### مصدر الحقيقة

Supabase هو المصدر الوحيد للحالة المنظمة. IndexedDB هو:

1. cache محلي قابل للاستبدال.
2. outbox دائم للتعديلات غير المؤكدة (Delta Mutations Outbox).
3. تخزين ثنائي مؤقت لملفات PDF/avatar، وليس مصدراً مستقلاً.

`useCloudAppState` هو المالك الوحيد للتحميل والحفظ والمزامنة. المكونات تعدل الحالة عبر `useAppState()` ولا تكتب إلى Supabase أو IndexedDB مباشرة إلا عبر helpers المعتمدة.

### التحميل والدمج

- عند التحميل، اقرأ الكاش فقط لعرض العمل المحلي المؤقت أو لإعادة تشغيل outbox.
- بعد نجاح قراءة Supabase، تفوز السحابة دائماً.
- لا يُستبقى سجل غير موجود في السحابة إلا إذا كان له `pendingRecordIds` في outbox غير مؤكد.
- الحالة السحابية الفارغة حالة صحيحة؛ لا تستخدم طول roster لاستنتاج فشل الحذف.
- اقرأ `sync_tombstones` قبل الدمج. الحذف مطلق ويمنع إعادة ظهور السجل.
- `SyncConflictError` نتيجة فشل صريحة، ولا يُمسح شاهد الحذف تلقائياً.
- لا يسمح `allowTombstoneOverride` إلا بقرار صريح من نافذة التعارض.
- استخدم `shouldApplyRemoteRefresh` قبل وبعد `await` لمنع clobber لكتابة محلية.
- استخدم `isSelfAuthoredChange` لتجاهل صدى الجهاز نفسه (فحص `payload.new` لعمليات INSERT/UPDATE و`payload.old` لعمليات DELETE) و`nextRevisionFloor` لمنع رجوع ساعة المراجعة.
- قراءة الجداول السحابية الكبيرة (خاصة `attendance` و`sync_tombstones`) تتم عبر تجزئة الصفحات (`fetchPaginatedRows` بحد 1000 صف) لمنع البتر الصامت من Supabase PostgREST.
- تفادي حذف السجل المفعّل مجدداً: عند إضافة أو تفعيل سجل كان في `deletedRecordIds`، يتم استثناؤه تلقائياً بواسطة `recordExistsInState` لمنع توليد عملية حذف متناقضة في الـ outbox.
- نسبة تقدم المنهاج عبر `getUnitProgress`: تحسب آلياً من الحصص المنجزة غير الملغاة مع دعم التجاوز اليدوي الصريح (`manual: true`).
- التحديد التلقائي للحصة الافتراضية في شاشة الحضور عبر `pickDefaultSession` لاختيار الحصة الجارية أو التالية زمنياً اليوم.

### Outbox

- كل عملية تحمل owner، entity، record id، revision، operation id، وdevice id.
- enqueue محلي حتى دون شبكة أو جلسة؛ flush فقط بعد تحقق جلسة مصادق عليها ومطابقة `auth.uid()` لمالك العملية.
- لا يُحذف outbox قبل إقرار Supabase.
- الفشل يبقي العملية في الطابور مع backoff وحالة ظاهرة.
- التعارض لا يعاد تلقائياً إلى ما لا نهاية؛ يعرض قرار keep remote/local.
- الخروج يفرغ الطابور إن أمكن، ثم يستدعي `purgeLocalUserData`. إذا فشل flush يجب تحذير المستخدم قبل قبول فقدان العمل غير المؤكد.

### عزل المستخدمين والملفات

- مفاتيح الحالة: `sanad:app-state:v4:<ownerId>`.
- PDF: `sanad:pdf:<ownerId>:<unitId>`.
- memoranda outbox: `sanad:memoranda-outbox:<ownerId>:<operationId>`.
- avatar/outbox/cache يجب حذفها عند الخروج؛ لا تترك legacy unscoped blobs.
- لا تعتمد على localStorage لبيانات المستخدم؛ المسموح فقط معرف الجهاز.
- Service Worker لا يخزن أي طلب Supabase أو OAuth مصادق عليه؛ قواعد `NetworkOnly` يجب أن تسبق `defaultCache` في `app/sw.ts`.
- سياسة CSP تبدأ بوضع `Report-Only` حتى لا تكسر OAuth أو موارد Next.js؛ عند استقرار تقارير الإنتاج تُنقل إلى `Content-Security-Policy` الحاجزة مع إبقاء نطاقات Supabase وWebSocket وموارد PWA المطلوبة فقط.

### الكيانات وقاعدة البيانات

الجداول المملوكة للمستخدم في Supabase:
`profiles`, `app_settings`, `classes`, `students`, `grades`, `sessions`, `attendance`, `session_behaviors`, `timetable_slots`, `lesson_progress`, `lesson_plans`, `custom_units`, `dashboard_tasks`, `file_assets`/`memoranda_files`, `sync_operations`, `sync_conflicts`, `sync_tombstones`.

كل جدول متزامن يجب أن يملك RLS وسياسات owner صحيحة (`auth.uid() = user_id`)، وأن يكون في `SYNCHRONIZED_TABLES` إذا كان Realtime مطلوباً، ومضافاً إلى `supabase_realtime` مع `replica identity full` للأحداث التي تحتاج بيانات DELETE. وتكون جميع المفاتيح الأجنبية مزودة بفهارس لمنع أقفال الجداول.

### تخزين حقول الحصص والدرجات

- **الحصة كاملة في JSON**: `sessions.teacher_notes` يحمل `SessionRecord` كاملاً، و`fromRow('session')` تعيد نشره. لذلك أي حقل جديد داخل الحصة — ومنه `notebookChecks` لجولات الكراس — **لا يحتاج عموداً ولا جدولاً جديداً**، بشرط أن يبقى قابلاً للتسلسل وأن تعيده `reconcileEntityList` كما هو.
- `reconcileSessionMarks()` تعيد بناء `attendance` و`BEHAVIOR_FIELDS` فقط من جداولها؛ لا تمسح `notebookChecks` ولا بقية حقول JSON.
- **حدود أعمدة الدرجات في `grades`** هي أسقف القرار: `behavior_score` 0–3، `attendance_score` 0–3، `notebook_score` 0–6، `participation_score` 0–8.
- `toRow` في `lib/supabase/core-sync.ts` يرفض أي قيمة خارج هذه الحدود برمي خطأ صريح (لا يقصّها صامتاً) حتى يتوقف الرفع بدل كتابة سجل فاسد؛ حافظ على تطابق الحدود بين `toRow` والـmigration.
- `lib/supabase/migrate-local-state.ts` يمرّر المكوّنات عبر `nullableScore(value, max)` أثناء الترحيل الأولي، ويُبقي `null` كما هو.
- **اقتراح تقدير المشاركة حالة واجهة فقط** (`lib/participation-judgement.ts`): لا يُضاف إلى `AppState` ولا إلى أي جدول ولا إلى حمولة المزامنة، وأثره يُحفظ في `participation_score` (0 أو 2 أو 4 داخل حدّ 0–8) عند ضغط «تطبيق على القسم» فقط.
- تغيير أي حقل متزامن يستلزم: تحديث `lib/storage.ts` (عقد `AppState`)، و`lib/supabase/core-sync.ts`، وmigration إن كان عموداً، واختبار مزامنة يثبت الدورة ذهاباً وإياباً.

## 5. قواعد المجال والواجهة

- الساعات الأسبوعية: `getWeeklyHours()`؛ 1 ج.م علوم ساعة واحدة، وبقية الأقسام ساعتان.

### التقويم المستمر — قرار وزاري بأوزان ثابتة

نموذج التقويم محسوم بقرار وزاري، والمصدر الوحيد للحساب هو `calculateEvaluationBreakdown()` في `lib/grade-calculator.ts`.

| مكوّن التطبيق | السقف | طريقة الإدخال والحساب |
| --- | --- | --- |
| السلوك والانضباط | 3 | خصم 0.5 عن كل مخالفة من المخالفة الأولى |
| المواظبة والحضور | 3 | خصم مباشر 0.5 عن كل غياب غير مبرر؛ التأخر للمتابعة فقط ولا يُخصم |
| الكراس وأدوات التعلم | 6 | مراقبة فصلية واحدة بأربع حالات مباشرة: 6 أو 4 أو 2 أو 0 |
| المشاركة والنشاط | 8 | توثيق آلي 4 (سقفه عند 30% من الحصص الموثقة) + تقدير أستاذ 4 |

- الأوزان **3/3/6/8 ثابتة ولا تُعدَّل من الواجهة**.
- **السلوك**: خصم **0.5 عن كل مخالفة من الأولى** (`disruptionDeduction = disruptionRepeatDeduction = 0.5`)، بأرضية 0؛ 6 مخالفات تستهلك العنصر كاملاً.
- **المواظبة**: خصم مباشر 0.5 عن كل غياب غير مبرر. التأخر لا يدخل في العلامة ويبقى للمتابعة التربوية وسجلاته لا تخصم. في شاشة الحضور يعمل زر الغياب بنقرة واحدة (الضغطة الأولى تفعّل الغياب، وإعادة الضغط تعيد التلميذ حاضراً).
- **الكراس وأدوات التعلم**: مراقبة فصلية **واحدة** بأربع حالات مباشرة:
  1. مكتمل ومنظم: **6**
  2. جيد، مع نقص طفيف: **4**
  3. ناقص أو غير منظم: **2**
  4. منعدم أو لم يحضر الكراس: **0**
  المراقبة الفصلية هي المصدر الوحيد للنقطة؛ والملاحظات اليومية القديمة أرشيف لا يدخل الحساب. وإن لم تُنفَّذ جولة تفتيش قط فالعنصر يُستبعد (`null`) وتُعاد نسبة المجموع إلى 20.
- **المشاركة والنشاط**:
  - **توثيق آلي (4 نقاط)**: يُقاس على الحصص التي وُثّق فيها شيء فعلاً (`documentedSessions`)، ويبلغ سقفه 4/4 عند نسبة مشاركة 30% من الحصص الموثقة، وما دون ذلك يُحسب تناسبياً: `4 × min(1, ratio / 0.30)` ويقرب إلى أقرب 0.5.
  - **تقدير الأستاذ (4 نقاط)**: ثلاث حالات: مبادر ومتميز (4)، متوسط (2)، سلبي (0). يُقترح «متوسط (2)» كقيمة افتراضية محايدة عند فتح نافذة مراجعة التقويم، ولا يُحفظ في الحالة إلا عند الضغط صراحة على زر «تطبيق على القسم».
- **قاعدة الأدلة واستبعاد النقص**: السلوك والمواظبة يعملان بالاستثناء؛ لا واقعة تعني لا خصم. الكراس بلا مراقبة، والمشاركة بلا توثيق وتقدير، يُستبعدان من البسط والمقام وتُعاد النسبة إلى 20؛ لا صفر جزاءً على نقص التسجيل. وتعرض الواجهة `—` للدلالة على نقص الأدلة.
- **جولة الكراس واحدة في الفصل**: (`notebookRounds = 1` افتراضياً). تمتد الجولة على عدة حصص (8–10 تلاميذ لكل حصة) وتُحفظ في `SessionRecord.notebookChecks[studentId]`.
- **ترقيم عناوين الحصص في دفتر النصوص**: **قراءة وقت العرض** عبر `getUnitSessionDisplayTitle(session, unitTitle, taughtSessions)`: وحدة أُنجزت في حصة واحدة غير ملغاة فقط تُكتب بلا رقم، وأكثر من حصة تُرقَّم كلها حسب ترتيبها الزمني من `getUnitTaughtSessions()`. لا تُخزَّن العناوين مرقّمة.
- **ملاحظات دفتر النصوص**: مرتبطة بالقسم فقط، ولا تُعرض داخل قسم ملاحظة كُتبت في قسم آخر.
- **الفصول الثلاثة (`1 | 2 | 3`)**: `AppState.activeTrimester` هو المصدر الوحيد للفصل الحالي، ويُغيَّر من `GlobalContextBar` فقط. كل ما يُحتسب أو يُصدَّر يمر عبر `filterByTrimester()` أو `isDateInTrimester()`.
- **ملف التلميذ (`StudentProfileOverlay`)**:
  - نافذة عرض موحدة للقراءة فقط عبر `selectStudentProfile()` في `lib/student-profile.ts`.
  - تعرض الهوية الأساسية، ملخص الفصل النشط، مؤشرات التقويم، وسجل الحضور، ونتائج الفصول السابقة دون تغيير `activeClassId` أو `activeTrimester` ودون إنشاء أي outbox.
  - النقص يظهر `—` وليس صفراً. لا تعرض البطاقة خانة التأخر.
  - تُفتح البطاقة من زر اسم التلميذ `StudentNameButton` في قوائم التلاميذ والحضور ورصد النقاط، ومن نتائج البحث السريع (`Ctrl+K`)، ومن أسماء المتفوقين في مجالس الأقسام.
- **استيراد القوائم محمي بالدمج فقط (Merge-Only Import)**:
  - استيراد الرقمنة أو ملفات Excel يمر عبر الدمج الإضافي؛ لا يُحذف أي تلميذ أو علامة أو سجل حضور مسجل في السحابة عند استيراد ملف لا يتضمنهم.
  - يقرأ مستورد Excel في `lib/excel-sync.ts` كل أوراق الملف، ويتجاهل أوراق الإدارة/الطاقم، ويدمج ترويسة المؤسسة والولاية في `profile`.
- **ضوابط تجربة المستخدم وإمكانية الوصول (UI/UX & A11y)**:
  - أزرار اللمس لا تقل عن 44px، والأزرار الأيقونية تملك `aria-label`.
  - الحوارات تستخدم `AccessibleDialog`/`ResponsiveOverlay` مع focus trap وEscape واستعادة التركيز وAndroid Back.
  - الحوارات لا تُغلق بالنقر على الخلفية افتراضياً (`dismissOnBackdrop: false`) تفادياً لفقدان المدخلات.
  - أخطاء النماذج inline مع `aria-invalid` و`aria-describedby`، والتحقق يمنع الحفظ مع رسالة صريحة تحت الحقل.
  - الإشعارات تمر عبر طابور `Toast` مع `aria-live`.
  - الطباعة تمر حصراً عبر `printElement(id, { landscape })` من `lib/print.ts` داخل إطار معزول RTL بمقاس A4.
  - تصدير Word يمر عبر `lib/docx-exporter.ts` بملفات OOXML حقيقية بمقاس A4 وRTL.

## 6. الاختبارات الإلزامية قبل إنهاء أي تغيير

يجب تشغيل الحزمة الكاملة والتحقق من نجاحها 100%:

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

**لا تنشئ أي ملفات توثيق أخرى خارج `AGENTS.md` و`README.md`**. عند أي تعديل معماري أو بيداغوجي، حدّث هذا الملف في نفس الالتزام وأضف اختباراً يثبت السلوك، وحدّث `README.md` للمستخدمين.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
