# 🔍 مراجعة شاملة — تطبيق «معين الأستاذ» (Ostady)
## Production Readiness Audit

**التاريخ:** 25 سبتمبر 2026  
**المراجع:** Senior Product + UX + Full-Stack + QA Engineer  
**النطاق:** Production Readiness Audit — مراجعة كود كاملة + UX + Security + Sync + QA  
**الرابط:** https://ostady.vercel.app

---

## Executive Summary

تطبيق «معين الأستاذ» هو تطبيق Next.js 16 متكامل يستخدم Supabase كـ backend (Auth + Database + Storage + Realtime). التطبيق مصمم لأستاذ العلوم الإسلامية في التعليم الثانوي بالجزائر ويغطي: إدارة الأقسام، التلاميذ، الحضور، النقاط، دفتر النصوص، جدول التوقيت، البرنامج السنوي، والمذكرات.

### الحكم العام

**التطبيق جاهز جزئيًا للإنتاج** — البنية الأساسية صلبة والتزامن السحابي متقدم جدًا، لكن توجد عدة مشاكل حرجة وعالية يجب معالجتها قبل الاستخدام الفعلي من طرف أساتذة حقيقيين.

**نقاط القوة:**
- نظام مزامنة متطور جدًا (outbox-based sync مع tombstones وconflict resolution)
- RLS policies على كل الجداول
- دعم offline + IndexedDB cache
- Mobile-first UI مع bottom navigation
- دعم استيراد Excel (الرقمنة + الممتاز)

**نقاط الضعف الرئيسية:**
- Debounced save (300ms) يعني فقدان بيانات محتمل عند إغلاق المفاجئ للتاب
- لا يوجد undo/redo
- بعض الـ edge cases في grade persistence
- Components ضخمة جدًا (ClassesManager = 2300+ سطر)
- لا يوجد onboarding flow واضح للمستخدم الجديد

---

## 1. 🔎 فهم التطبيق بالكامل

### المشكلة التي يحلها
رقمنة العمل البيداغوجي لأستاذ العلوم الإسلامية: إدارة الأفواج، الحضور والغياب، التقويم المستمر، العلامات، دفتر النصوص اليومي، والمخطط السنوي.

### المستخدم الرئيسي
أستاذ العلوم الإسلامية في التعليم الثانوي الجزائري (يستخدم غالبًا من الهاتف).

### الكيانات الرئيسية (Entities)

| Entity | Description | Storage |
|--------|-------------|---------|
| `TeacherProfile` | بيانات الأستاذ | Supabase `profiles` + Local |
| `ClassRoom` | الأقسام/الأفواج | Supabase `classes` + Local |
| `Student` | التلاميذ | Supabase `students` + Local |
| `SessionRecord` | حصص دفتر النصوص | Supabase `sessions` + Local |
| `StudentGrade` | العلامات والتقديرات | Supabase `grades` + Local |
| `TimetableSlot` | جدول التوقيت | Supabase `timetable_slots` + Local |
| `ClassLessonProgress` | تقدم الدروس | Supabase `lesson_progress` + Local |
| `CurriculumUnit` | وحدات المنهج | Supabase `custom_units` + Static data |
| `LessonPlan` | المذكرات | Supabase `lesson_plans` + Local |
| `DashboardTask` | مهام لوحة التحكم | Supabase `dashboard_tasks` + Local |

### كيف تتحرك البيانات

```
User Action → Component setState → handleUpdateState/updateStateAndWait
→ enqueueSyncDelta (IndexedDB outbox) → flushSyncOutbox → Supabase upsert
→ Realtime postgres_changes → other tabs reload
→ saveAppStateCache (IndexedDB cache, debounced 400ms)
```

### ما يُدار محليًا vs سحابيًا

- **محليًا (IndexedDB):** AppState cache للتحميل السريع، sync outbox للعمليات المعلقة
- **سحابيًا (Supabase):** كل الجداول مع RLS policies
- **حساب على الواجهة:** المعدل الفصلي، التقويم المستمر الآلي، التقديرات
- **Auth:** Supabase Auth (Google OAuth + Email OTP)

---

## 2. 👤 User Journey Report — رحلة الأستاذ الجديد

### مرحلة 1: الدخول (Login)

| Step | User Intent | UI | Data | Persistence | Risk |
|------|-------------|-----|------|-------------|------|
| فتح التطبيق | الوصول للتطبيق | Landing page مع زر "ابدأ الآن" | لا شيء | - | ✅ |
| الضغط على "ابدأ الآن" | تسجيل الدخول | Bottom sheet مع خيارات Google/Email | لا شيء | - | ✅ |
| Google OAuth | دخول سريع | Redirect → Google → callback | Session cookie | HttpOnly cookie | 🟡 |
| Email OTP | دخول بالبريد | إدخال البريد → رابط سحري | OTP sent | - | 🟡 |
| بعد الدخول | الوصول للتطبيق | Redirect → Dashboard | Load from Supabase | - | ✅ |

**المشاكل المحتملة:**
- 🟡 **لا يوجد حساب تقليدي (email/password)** — فقط Google أو magic link. إذا فقد الأستاذ وصوله لحساب Google، لا يمكنه استعادة الوصول.
- 🟡 **Callback URL صارم** — إذا لم يكن `NEXT_PUBLIC_APP_URL` مضبوطًا بشكل صحيح، قد يفشل OAuth redirect.
- 🟢 **offline fallback** — يوجد زر "المتابعة دون اتصال" يظهر بعد 2 ثوانٍ، لكنه يدخل بدون مصادقة.

### مرحلة 2: أول استخدام (Onboarding)

| Step | User Intent | UI | Data | Risk |
|------|-------------|-----|------|------|
| أول دخول | فهم التطبيق | Dashboard فارغ أو demo data | - | 🔴 |
| - | - | لا يوجد onboarding wizard | - | 🔴 |

**🔴 CRITICAL — لا يوجد Onboarding Flow:**
- الأستاذ الجديد يرى التطبيق فارغًا أو مع بيانات تجريبية
- لا توجد خطوات إرشادية تشرح: "ابدأ باستيراد أقسامك" أو "أضف تلاميذك"
- `onboardingDismissed` موجود في AppState لكنه لا يُستخدم فعليًا لإظهار flow تدريجي
- **الإصلاح:** إضافة onboarding بسيط من 3 خطوات: (1) أدخل اسمك ومدرستك، (2) استورد أقسامك أو أضف يدويًا، (3) ابدأ

### مرحلة 3: بدء العمل

| Step | UI Action | Data Mutation | Persist | Failure | Sync |
|------|-----------|---------------|---------|---------|------|
| إنشاء قسم | Modal → حفظ | `updateStateAndWait` | ✅ DB + Cache | Toast error | ✅ |
| إضافة تلميذ | Modal → حفظ | `updateStateAndWait` | ✅ DB + Cache | Toast error | ✅ |
| إدخال نقاط | Input → auto-save | Debounced `persistDraftGrades` | 🟡 900ms delay | 🟡 Silent | 🟡 |
| تسجيل حضور | Toggle → save | `updateStateAndWait` | ✅ DB + Cache | Toast error | ✅ |
| إنشاء مذكرة | Form → save | `updateStateAndWait` | ✅ DB + Cache | Toast error | ✅ |

---

## 3. 🧠 LOGIC AUDIT

### 3.1 Race Conditions

#### 🔴 CRITICAL: Grade Draft Auto-Save Race Condition

**المشكلة:**
```
المستخدم يدخل نقطة → gradesDraft updates → setTimeout(900ms) → persistDraftGrades()
```

إذا غيّر المستخدم القسم أو الفصل الدراسي خلال 900ms:
1. `handleSelectClass` يستدعي `persistDraftGrades()` (إذا dirty) — يحفظ في القسم القديم
2. ثم يغير `selectedClassId` ويعيد بناء `gradesDraft`
3. الـ effect السابق (`setTimeout 900ms`) ما زال قيد التشغيل وقد يحفظ بيانات خاطئة

**Root cause:** الـ `useEffect` الذي يعتمد على `gradesDraft` لا يأخذ في الحسبان أن `selectedClassId` قد تغير بين وقت تشغيل الـ effect ووقت حدوث الـ timeout.

**الإصلاح:** إضافة guard في الـ `setTimeout` callback يتحقق من أن `selectedClassId` و `selectedTrimester` لم يتغيرا.

#### 🟠 HIGH: Concurrent State Updates in `handleUpdateState`

**المشكلة:**
`handleUpdateState` يقرأ من `latestStateRef.current` ويحدث `setState` في نفس اللحظة. إذا حدثت عمليتا تحديث في نفس الـ render cycle، قد تفقد إحداهما.

```javascript
const handleUpdateState = (updater) => {
  const previous = latestStateRef.current;
  const next = updater(previous);
  latestStateRef.current = next;
  setState(next);
};
```

**الإصلاح:** استخدام functional form لـ `setState` مع تحديث ref داخل callback.

### 3.2 Stale State Issues

#### 🟠 HIGH: Grades Draft Not Flushed on Navigation

**المشكلة:** في `GradesAndEvaluation.tsx`:
```javascript
const handleSelectClass = (newClassId: string) => {
  if (isDirtyRef.current) {
    void persistDraftGrades();  // ← fire-and-forget!
  }
  setSelectedClassId(newClassId);  // ← immediately changes context
  setGradesDraft(buildDraft(...));  // ← overwrites draft
};
```

إذا فشل `persistDraftGrades()` (network error)، البيانات تُفقد لأن `gradesDraft` يُعاد بناؤه فورًا.

**الإصلاح:** `await persistDraftGrades()` قبل تغيير القسم، مع feedback للمستخدم عند الفشل.

#### 🟡 MEDIUM: `prevGradesRef` Doesn't Account for Draft Changes

```javascript
useEffect(() => {
  if (changed || (!isDirtyRef.current && prevGradesRef.current !== state.grades)) {
    setGradesDraft(buildDraft(...));
  }
}, [state.grades, ...]);
```

إذا كان المستخدم يكتب نقطة (isDirtyRef.current = true) وجاء تحديث من Realtime، الـ draft لن يُحدث — وهو السلوك الصحيح. لكن إذا انتهى الـ sync وأصبح `isDirtyRef.current = false`، أي تعديل لاحق من Realtime سيُطبق فورًا ويعيد بناء الـ draft.

### 3.3 Double Submission

#### 🟡 MEDIUM: No Button Disable During Save

في `ClassesManager.tsx`:
```javascript
const handleSaveClass = async () => {
  setIsClassModalOpen(false);  // Modal closes immediately
  setEditingClass(null);
  try {
    await updateStateAndWait(prev => { ... });
    showToast('تم الحفظ', 'success');
  } catch (error) {
    showToast('تعذر الحفظ', 'error');
  }
};
```

المودال يُغلق فورًا قبل اكتمال الحفظ. إذا ضغط المستخدم "حفظ" مرتين بسرعة، قد يُنشأ سجلان.

**الإصلاح:** إضافة `isSaving` state وتعطيل الزر حتى اكتمال العملية.

### 3.4 Null/Undefined Scenarios

#### 🟡 MEDIUM: Missing Null Guard in Session Calculations

في `GradesAndEvaluation.tsx`:
```javascript
const studentStatsMap: Record<string, {...}> = {};
for (const s of classStudents) {
  studentStatsMap[s.id] = { absent: 0, ... };
}
for (const session of classSessions) {
  for (const [studentId, status] of Object.entries(session.attendance)) {
    if (!studentStatsMap[studentId]) studentStatsMap[studentId] = { ... };
```

إذا حُذف تلميذ ولكن session ما زال يحتوي على attendance له، يُنشأ entry مؤقت. هذا ليس خطأ لكنه يضيع ذاكرة.

---

## 4. 🔄 SYNC AUDIT

### 4.1 Create Operations

| Feature | Local Update | DB Update | Error Handling | Rollback | Refresh Safe | Risk |
|---------|-------------|-----------|----------------|----------|--------------|------|
| Create Class | ✅ Immediate | ✅ updateStateAndWait | ✅ Toast | ❌ No rollback | ✅ Yes | 🟢 Low |
| Create Student | ✅ Immediate | ✅ updateStateAndWait | ✅ Toast | ❌ No rollback | ✅ Yes | 🟢 Low |
| Create Session | ✅ Immediate | ✅ updateStateAndWait | ✅ Toast | ❌ No rollback | ✅ Yes | 🟢 Low |
| Create Grade | ✅ 900ms debounce | ⚠️ Debounced | ⚠️ Console only | ❌ No rollback | 🟡 Maybe | 🟠 High |
| Create Timetable | ✅ Immediate | ✅ updateStateAndWait | ✅ Toast | ❌ No rollback | ✅ Yes | 🟢 Low |

### 4.2 Update Operations

| Feature | Local Update | DB Update | Error Handling | Rollback | Refresh Safe | Risk |
|---------|-------------|-----------|----------------|----------|--------------|------|
| Update Class | ✅ Immediate | ✅ updateStateAndWait | ✅ Toast | ❌ No rollback | ✅ Yes | 🟢 Low |
| Update Student | ✅ Immediate | ✅ updateStateAndWait | ✅ Toast | ❌ No rollback | ✅ Yes | 🟢 Low |
| Update Grade | ✅ 900ms debounce | ⚠️ Debounced | ⚠️ Console + Toast | ❌ No rollback | 🟡 Maybe | 🟠 High |
| Update Session | ✅ Immediate | ✅ updateStateAndWait | ✅ Toast | ❌ No rollback | ✅ Yes | 🟢 Low |
| Update Attendance | ✅ Immediate | ✅ updateStateAndWait | ✅ Toast | ❌ No rollback | ✅ Yes | 🟢 Low |

### 4.3 Delete Operations

| Feature | Local Update | DB Update | Confirmation | Cascade | Risk |
|---------|-------------|-----------|--------------|---------|------|
| Delete Class | ✅ Immediate | ✅ updateStateAndWait | ✅ Dialog | ⚠️ Manual cascade | 🟡 Medium |
| Delete Student | ✅ Immediate | ✅ updateStateAndWait | ✅ Dialog | ✅ Deletes grades | 🟢 Low |
| Delete Timetable | ✅ Immediate | ✅ updateStateAndWait | ✅ Dialog | ✅ | 🟢 Low |
| Delete Grade | N/A (overwrite) | ✅ Upsert | ❌ None | N/A | 🟢 Low |

### 4.4 Critical Sync Findings

#### 🔴 CRITICAL: "UI Says Saved, But Data Wasn't Actually Saved"

**المكان الأول: Grade Draft Persistence**
```javascript
// GradesAndEvaluation.tsx - line ~480
useEffect(() => {
  const timer = window.setTimeout(() => {
    void persistDraftGradesRef.current()
      .then(() => { isDirtyRef.current = false; setSaveStatus('saved'); })
      .catch(() => { setSaveStatus('pending'); }); // ← User sees "pending" but no clear error
  }, 900);
}, [gradesDraft]);
```

**السيناريو الخطير:**
1. الأستاذ يدخل 30 نقطة
2. يرى "محفوظ تلقائيًا" بعد 900ms
3. يغلق التاب — الـ `beforeunload` handler يستدعي `persistDraftGrades()` لكن هذا async
4. المتصفح قد يقتل العملية قبل اكتمالها
5. النتيجة: النقاط غير محفوظة في Supabase

**الإصلاح:** 
- إضافة `navigator.sendBeacon()` أو استخدام `visibilitychange` event مع sync flush
- إظهار "غير محفوظ" بوضوح عند وجود تغييرات غير مؤكدة

#### 🟠 HIGH: Debounced Save Shows "Saved" Prematurely

```javascript
<span>{saveStatus === 'saved' ? 'محفوظ تلقائياً' : ...}</span>
```

المستخدم يرى "محفوظ تلقائيًا" بعد اكتمال `persistDraftGrades()` local state update، لكن الـ Supabase flush قد يفشل لاحقًا. الحالة `saveStatus` لا تعكس حالة الـ cloud sync الفعلية.

**الإصلاح:** ربط `saveStatus` بـ `cloudStatus` من `AppStateContext`.

#### 🟠 HIGH: No Multi-Tab Conflict Warning

**السيناريو:**
1. Tab A: يفتح التطبيق
2. Tab B: يفتح التطبيق (نفس الحساب)
3. Tab A: يعدل نقطة تلميذ
4. Tab B: ما زال يرى النقطة القديمة
5. Tab B: يعدل نفس النقطة
6. النتيجة: آخر write wins بدون أي تنبيه

**السبب:** Realtime refresh_coalescer يتجاهل التغييرات من نفس الـ `syncDeviceId`:
```javascript
if (isSelfAuthoredChange(payload, getSyncDeviceId())) return;
```

لكن `syncDeviceId` هو نفس الجهاز — فقط tabs مختلفة.

**الإصلاح:** استخدام ` BroadcastChannel` API أو `localStorage` events للتزامن بين tabs.

---

## 5. 🗄️ CRUD AUDIT

### ملخص CRUD

| Entity | Create | Read | Update | Delete | Validation | Cascade |
|--------|--------|------|--------|--------|------------|---------|
| Classes | ✅ | ✅ | ✅ | ✅ | ✅ Name required | 🟡 Manual |
| Students | ✅ | ✅ | ✅ | ✅ | ✅ Name required | ✅ Grades |
| Grades | ✅ (overwrite) | ✅ | ✅ (overwrite) | ❌ (set null) | ✅ 0-20 range | N/A |
| Sessions | ✅ | ✅ | ✅ | ✅ | ⚠️ Minimal | ✅ Attendance |
| Timetable | ✅ | ✅ | ✅ | ✅ | ✅ Required fields | ✅ |
| Attendance | ✅ (toggle) | ✅ | ✅ (toggle) | ✅ | ✅ Enum check | ✅ |
| Lesson Plans | ✅ | ✅ | ✅ | ✅ | ✅ Title required | ✅ |
| Profile | ✅ (on signup) | ✅ | ✅ | N/A | ⚠️ Minimal | N/A |

### تفاصيل كل CRUD

#### Classes CRUD

**Create:** ✅ جيد — modal مع validation، `updateStateAndWait` يضمن الحفظ السحابي
**Read:** ✅ جيد — يُحمّل من Supabase مع fallback للـ cache المحلي
**Update:** ✅ جيد — نفس الـ modal للتحرير
**Delete:** 🟡 — يحذف يدويًا الطلاب والجدول المرتبط لكن لا يحذف sessions والـ grades المرتبطة في الـ outbox operations (رغم أن `handleExecuteDelete` يفعل ذلك في local state)

#### Students CRUD

**Create:** ✅ جيد — مع renumbering تلقائي
**Read:** ✅ جيد — desktop table + mobile cards
**Update:** ✅ جيد — modal مع validation
**Delete:** ✅ جيد — يحذف grades المرتبطة أيضًا

**Edge case:** 🟡 عند حذف تلميذ، الـ attendance في الجلسات ما زال يحتفظ بـ studentId. يجب تنفيذه.

#### Grades CRUD

**Create/Update:** 🟠 — يستخدم draft pattern مع debounce. لا يوجد "create" منفصل بل overwrite.
**Delete:** 🟡 — لا يوجد زر حذف للعلامات. يمكن فقط وضع null.
**Validation:** ✅ — range 0-20، لكن لا يوجد validation للخطوط العربية/الأرقام.

**🟠 Problem:** إذا أدخل الأستاذ "١٥" (أرقام عربية) بدل "15"، `Number("١٥")` = `NaN` → يُرفض.

---

## 6. 🔐 AUTH + SECURITY

### Authentication Flow

```
1. User clicks "ابدأ الآن" → Bottom sheet
2. Option A: Google OAuth → redirect → callback → session cookie
3. Option B: Email OTP → magic link → callback → session cookie
4. AuthGate checks session → if valid, renders AppContent
5. onAuthStateChange listener handles session expiry
```

### Security Assessment

#### ✅ Strengths

1. **RLS on ALL tables** — كل جدول عليه Row Level Security:
   ```sql
   create policy {table}_owner_access on {table}
   for all to authenticated
   using ((select auth.uid()) = owner_id)
   with check ((select auth.uid()) = owner_id)
   ```

2. **User Isolation** — `owner_id` على كل سجل، filtered في كل query
3. **No service role key exposure** — `.env.example` يوضح أنه secret فقط
4. **Publishable key validation** — `getSupabaseEnv()` يتحقق من صحة المفتاح

5. **Storage policies** — ملفات memoranda مقيدة بـ owner:
   ```sql
   split_part(name, '/', 2) = (select auth.uid())::text
   ```

#### 🟡 Concerns

1. **No middleware-level auth redirect** — `middleware.ts` يُحدث session فقط لكنه لا يعيد توجيه المستخدمين غير المسجلين. الحماية تتم client-side فقط عبر `AuthGate`.

2. **Supabase client created on every call** — `createSupabaseBrowserClient()` يُنشأ كل مرة. ليس مشكلة أمنية لكن يؤثر على الأداء.

3. **`auth.getUser()` cached for 30s** — إذا انتهت الجلسة، قد يستمر التطبيق في العمل لمدة 30 ثانية قبل اكتشاف ذلك.

4. **Client-side security assumptions** — لا يوجد server-side validation للبيانات المرسلة. كل الـ validation client-side.

#### 🔴 User A accessing User B's data?

**الإجابة: لا، بفضل RLS.** كل query تُفلتر بـ `owner_id = auth.uid()`. حتى لو عرف User A الـ ID الخاص بـ User B، الـ query لن ترجع بيانات.

**استثناء محتمل:** إذا كان هناك bug في `workspaceId()` — لأنه يعتمد على `default_workspace_id()` RPC التي تستخدم `auth.uid()`. إذا فشلت RPC، الـ fallback ينشئ workspace جديد — وهذا صحيح.

---

## 7. 📱 MOBILE-FIRST UX AUDIT

### ✅ Strengths

1. **Bottom Navigation** — 5 عناصر: الرئيسية، الحصة الحالية، دفتر النصوص، النقاط، المزيد
2. **Safe area** — `pb-[env(safe-area-inset-bottom)]` للهواتف ذات الحافة السفلية
3. **Touch targets** — `min-h-[48px]` على أزرار التنقل
4. **RTL support** — `dir="rtl"` على كل شيء
5. **Mobile cards** — التلاميذ والعلامات تظهر كبطاقات على الهاتف
6. **Responsive layouts** — `max-w-[30rem] md:max-w-7xl`

### 🟡 Issues

#### 1. Horizontal Scrolling in Grades Table (Desktop View)

**المكان:** `GradesAndEvaluation.tsx` — desktop table
```html
<div className="overflow-x-auto">
  <table className="w-full text-right text-xs">
```

**لماذا يحدث:** الجدول يحتوي 8 أعمدة مع `min-w` على بعضها. على التابلت (768-1024px)، قد يحتاج horizontal scroll.

**الحل:** على الأحجام المتوسطة، تحويل بعض الأعمدة (التقديرات/الإرشادات) إلى accordion أو tooltip.

#### 2. Import Sheet — Bottom Sheet Z-Index Conflict

في `ClassesManager.tsx`:
```html
<div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40">
```

الـ z-index `50` قد يتعارض مع modals أخرى (z-50 أيضًا).

#### 3. Small Touch Targets for Edit/Delete Buttons

في `ClassesManager.tsx` — أزرار التعديل والحذف للتلاميذ:
```html
<button className="p-1 text-slate-400">
  <Edit className="w-3.5 h-3.5" />
</button>
```

`p-1` مع أيقونة `w-3.5 h-3.5` = حوالي 28px × 28px. أقل من 44px الموصى بها.

**Mobile cards** ✅ يستخدم `p-2` مع أيقونات `w-4 h-4` — أفضل.

#### 4. Missing Pull-to-Refresh

لا يوجد pull-to-refresh للبيانات. إذا دخل المستخدم من الهاتف بعد ضعف الشبكة، لا يستطيع إعادة التحميل بسهولة.

#### 5. Long Lists Without Virtualization

قائمة التلاميذ في `ClassesManager` تُعرض كلها. مع 40-50 تلميذ في القسم، هذا مقبول. لكن مع عدة أقسام × 50 تلميذ، قد يكون بطيئًا.

---

## 8. 🎨 UI AUDIT

### Visual Hierarchy

**✅ جيد:**
- استخدام متسق لـ CSS variables (`--primary`, `--text-primary`, etc.)
- `font-black` للعناوين، `font-bold` للنصوص المهمة
- تدرج واضح من `text-primary` → `text-secondary` → `text-tertiary`

**🟡 ملاحظات:**
- الألوان `gold` و `amber-600` تُستخدم أحيانًا بشكل متبادل
- `var(--danger)` vs `text-rose-600` — inconsistent

### Empty States

**✅ جيد:** Empty states موجودة في:
- قائمة الأقسام: "لم تتم إضافة أقسام بعد"
- قائمة التلاميذ: "لا يوجد تلاميذ مسجلين"
- جدول النقاط: "لا يوجد تلاميذ مسجلين في هذا القسم"

**🟡 مفقود:**
- Dashboard فارغ — لا يوجد empty state واضح
- Sessions — غير محقق

### Loading States

**✅ جيد:** كل route لديه `loading.tsx` مع spinner
**✅ جيد:** Dynamic imports مع `loading: ViewLoading`

### Dark Mode

**🟡 Partial:** CSS variables موجودة (`--bg-page`, `--text-primary`) لكن لا يوجد toggle واضح في الواجهة. `theme` موجود في `AppState` لكن لا يبدو مطبقًا بالكامل.

---

## 9. ♿ ACCESSIBILITY

### ✅ Strengths

1. **Skip link** — "الانتقال إلى المحتوى الرئيسي"
2. **`aria-live`** — على loading indicators
3. **`aria-label`** — على معظم الأزرار
4. **`role="dialog"` + `aria-modal`** — على modals
5. **`aria-current="page"`** — على التنقل النشط

### 🔴 Issues

1. **Missing form labels** — في `ClassesManager.tsx` modals:
   ```html
   <input value={editingClass.name} onChange={...} />
   ```
   لا يوجد `<label>` associated — فقط `<label>` visual بدون `htmlFor`.

2. **Missing error announcements** — عند فشل الحفظ، الـ toast يظهر بصريًا لكن لا يُannounce لـ screen readers.

3. **Color-only status indicators** — الـ sync status يستخدم ألوان فقط (`text-[var(--primary)]` vs `text-amber-700`).

---

## 10. ⚡ PERFORMANCE

### ✅ Strengths

1. **Dynamic imports** — كل المكونات الثقيلة محملة بـ `dynamic()` مع `ssr: false`
2. **IndexedDB caching** — البيانات تُحمّل أولًا من cache المحلي
3. **Debounced saves** — 300ms debounce على الـ state changes
4. **Realtime coalescing** — 250ms coalesce period للتغييرات السريعة

### 🔴 Issues

#### 1. ClassesManager is 113KB+ (2300+ lines)

هذا الملف يُحمّل كله دفعة واحدة. يجب تقسيمه إلى:
- `ClassList.tsx`
- `StudentRoster.tsx`
- `TimetableView.tsx`
- `ImportDialogs.tsx`

#### 2. `useCloudAppState` is 1184 lines

Hook واحد ضخم يحتوي على كل منطق الـ sync. يجب تقسيمه إلى:
- `useSyncOutbox.ts`
- `useRealtimeSync.ts`
- `useCloudSync.ts`

#### 3. `loadCoreState` Makes N+1 Queries

```javascript
const results = await Promise.all(
  Object.entries(tables).map(async ([entity, table]) => {
    const query = c.from(table).select('*');
    const result = entity === 'profile'
      ? await query.eq('id', userId)
      : await query.eq('owner_id', userId);
    return [entity, result];
  })
);
```

هذا يفتح 12+ connection في نفس الوقت. على Supabase free tier، قد يُسبب connection pool exhaustion.

**الإصلاح:** تجميع الاستعلامات في RPC واحدة أو استخدام views.

#### 4. `xlsx` Library is Large

```javascript
void import('xlsx').then(({ utils, writeFile }) => { ... });
```

مكتبة `xlsx` ≈ 400KB minified. تُحمّل ديناميكيًا ✅ لكن لا تزال كبيرة.

#### 5. Missing Pagination

كل البيانات تُحمّل دفعة واحدة. مع 7 أقسام × 45 تلميذ × 3 فصول = 945 سجل grade — مقبول الآن لكن سيكبر.

---

## 11. 🧪 QA / EDGE CASES

### Double Click / Double Submit

| Action | Protected? | Risk |
|--------|-----------|------|
| Save Class | 🟡 Modal closes immediately | Duplicate class |
| Save Student | 🟡 Modal closes immediately | Duplicate student |
| Save Grade | ✅ Debounced (900ms) | Low risk |
| Delete Class | ✅ Confirmation dialog | Protected |
| Delete Student | ✅ Confirmation dialog | Protected |
| Import File | 🟡 File input resets after | Medium risk |

### Empty Values

| Field | Validation | Risk |
|-------|-----------|------|
| Class name | ✅ Required check | ✅ Protected |
| Student name | ✅ Required check | ✅ Protected |
| Grade value | ✅ Range 0-20 | ✅ Protected |
| Session date | 🟡 No explicit check | 🟡 |

### Very Long Text

- لا يوجد `maxLength` على حقول الاسم
- `fullName` في database هو `text` — لا حد
- 🟡 يمكن إدخال اسم بطول 10,000 حرف — لن يسبب خطأ لكن سيشوه الـ UI

### Refreshing During Mutation

- `handleSaveClass` يستدعي `updateStateAndWait` → إذا حدث refresh:
  - `visibilitychange` → `persistPendingWork()` → يحفظ في outbox
  - بعد العودة → `initializeState()` → يقرأ من cache → يُكمل الـ flush
  - ✅ محمي نسبيًا

### Nonexistent Records

- `app/page.tsx` يحتوي على `not-found.tsx` ✅
- لكن لا يوجد handling لـ class ID غير موجود في URL

### Missing Profile

```javascript
profile: profile ? { ...localState.profile, ... } : localState.profile
```

إذا لم يكن هناك profile في Supabase، يستخدم المحلي. ✅ جيد.

---

## 12. 🧩 DATABASE / DATA MODEL

### ✅ Strengths

1. **Foreign keys with CASCADE** — حذف قسم يحذف طلابه وعلاماته
2. **CHECK constraints** — `check (continuous_eval between 0 and 20)`
3. **UNIQUE constraints** — `(workspace_id, student_id, trimester)` على grades
4. **Sync metadata** — `sync_revision`, `sync_device_id` على كل جدول
5. **Tombstones** — لحفظ سجل الحذف عبر الأجهزة

### 🟡 Issues

1. **Missing index on `sync_revision`** — queries تفلتر بـ `sync_revision` لكن لا يوجد index مخصص.

2. **`teacher_notes` is `text` (JSON string)** — Session notes مخزنة كـ JSON في text column. هذا يعني:
   - لا يمكن query على الحقول الداخلية
   - لا يوجد validation للبنية
   - 🟡 إذا فشل `JSON.parse()` في `fromRow`، يُعاد session فارغ

3. **`normalized_name` is generated** — ✅ جيد للأداء لكن:
   - لا يُستخدم في الـ client-side queries
   - يُحمّل كل الطلاب ثم يُفلتر client-side

4. **No soft delete on profiles** — حذف الحساب = حذف كل البيانات (CASCADE). لا يوجد فترة استرداد.

---

## 13. 🏗️ ARCHITECTURE REVIEW

### ✅ Strengths

1. **App Router** — يستخدم Next.js 16 App Router بشكل صحيح
2. **Client/Server boundary** — كل الصفحات client components مع dynamic imports
3. **Context pattern** — `AppStateProvider` يحقن الـ state في كل المكونات
4. **Sync architecture** — outbox-based sync هو pattern صحيح للتطبيقات offline-first

### 🔴 Issues

#### 1. Business Logic Inside UI Components

`ClassesManager.tsx` (2300 سطر) يحتوي على:
- منطق استيراد Excel
- منطق merge التلاميذ
- منطق conflict detection
- منطق file parsing
- UI rendering

**الإصلاح:** استخراج الـ business logic إلى hooks/services منفصلة.

#### 2. Inconsistent Data Access Patterns

بعض المكونات تستخدم `updateState` (sync):
```javascript
onUpdateState(prev => ({ ...prev, activeClassId: cls.id }));
```

وأخرى تستخدم `updateStateAndWait` (async):
```javascript
await updateStateAndWait(prev => { ... });
```

لا يوجد قاعدة واضحة متى يُستخدم أي منهما.

#### 3. Giant Component Files

| Component | Lines | Assessment |
|-----------|-------|-----------|
| ClassesManager.tsx | 2306 | 🔴 Needs split |
| GradesAndEvaluation.tsx | 1238 | 🟠 Should split |
| useCloudAppState.ts | 1184 | 🟠 Should split |
| core-sync.ts | 814 | 🟡 Acceptable |
| sync-outbox.ts | 516 | ✅ Good |
| storage.ts | 872 | 🟡 Contains too much demo data |

---

## 14. 🛠️ AI-GENERATED CODE AUDIT

### أنماط AI المكتشفة

#### 1. Duplicated Logic — Import Handlers

`applyDigitizationImport` و `handleConfirmMoumtazeImport` يتشاركان ~70% من الكود:
- نفس منطق إنشاء الأقسام
- نفس منطق مقارنة التلاميذ
- نفس منطق ترقيم القوائم

**الإصلاح:** استخراج shared `importRosterData()` function.

#### 2. Defensive Code بدون سبب

```javascript
const safeScore = (val: any, fallback: number) => {
  if (val === null || val === undefined || val === '') return fallback;
  const num = Number(val);
  return isNaN(num) ? fallback : Math.max(0, Math.min(5, num));
};
```

هذا مبالغ فيه — `val` يأتي من state داخلي وهو `number | null` بالفعل.

#### 3. Inconsistent Naming

- `handleUpdateState` vs `onUpdateState` vs `updateState`
- `cloudStatus` vs `saveStatus` vs `syncStatus`
- `selectedClassId` (local) vs `activeClassId` (state)

#### 4. Dead Code

- `secondQuiz` field in `StudentGrade` — "legacy field (غير مستعمل)"
- `isSecondQuizExempt` — "legacy field"
- `memoryWhatWorked`, `memoryWhatFailed` — "Legacy notebook fields"

هذه الحقول موجودة في types وتُحمل من Supabase لكن لا تُستخدم.

#### 5. Fake Loading States

في `GradesAndEvaluation`:
```javascript
const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'pending'>('saved');
```

`'saving'` يُضبط لمدة أقل من ثانية في الغالب — المستخدم لا يراه فعليًا.

---

## 15. 🔍 DATA FLOW TRACING

### Feature: إدخال نقطة تلميذ

```
User types "15" in input
  ↓
onChange → handleGradeChange(studentId, 'quiz', '15')
  ↓
isDirtyRef.current = true
setGradesDraft(prev => ({ ...prev, [studentId]: { ...prev[studentId], quiz: '15' } }))
  ↓
useEffect([gradesDraft]) fires → setTimeout(900ms)
  ↓
persistDraftGrades() called
  ↓
updateStateAndWait(prev => {
  // builds updatedGradesList with calculatedAverage
  return { ...prev, grades: updatedGradesList };
})
  ↓
setState(nextState) → UI re-renders with new grade
  ↓
enqueueSyncDelta() → writes to IndexedDB outbox
  ↓
flushSyncOutbox() → Supabase upsert to grades table
  ↓
Realtime event → other tabs reload
  ↓
saveAppStateCache() → IndexedDB cache updated
```

**أين يمكن أن تنكسر:**
1. ⚠️ بين `setTimeout(900ms)` و`persistDraftGrades()` — إذا غيّر المستخدم القسم
2. ⚠️ بين `enqueueSyncDelta()` و`flushSyncOutbox()` — إذا انقطع الإنترنت
3. ⚠️ `saveStatus` يُضبط على `'saved'` بعد `setState` لكن قبل flush confirmation

---

## 16. 🚨 HIDDEN BUGS

### Hidden Bugs

1. **🟠 Workspace Cache Never Invalidated**
   ```javascript
   const workspaceCache = new Map<string, string>();
   ```
   Module-level Map لا يُمسح أبدًا. إذا أنشأ المستخدم workspace جديد (بعد حذف الحساب وإعادة التسجيل)، الـ cache سيعود ID قديم.

2. **🟡 `authCheckCache` Module-Level State**
   ```javascript
   let authCheckCache: { ownerId: string; at: number; ok: boolean } | null = null;
   ```
   إذا تعدد الحسابات في نفس المتصفح، قد يُستخدم cache خاطئ.

3. **🟡 `isDemoState` Check is Fragile**
   ```javascript
   export function isDemoState(state: AppState): boolean {
     return state.profile.name === 'أستاذ المادة' &&
       state.classes.some(item => item.id.startsWith('cls-')) &&
       state.students.some(item => item.id.startsWith('std-'));
   }
   ```
   إذا غيّر الأستاذ اسمه فقط، يُعتبر "demo" ولا يُحمّل.

### Latent Bugs

4. **🟠 Revision Counter Overflow**
   ```javascript
   revisionRef.current += 1;
   ```
   في JavaScript، الأعداد الصحيحة آمنة حتى `Number.MAX_SAFE_INTEGER` (2^53). عمليًا لن يحدث overflow لكن لا يوجد reset mechanism.

5. **🟡 Sync Operations Idempotency**
   ```javascript
   const operationId = `${metadata.revision}:${metadata.updatedAt}:${operation.id}`;
   ```
   إذا أُعيدت نفس العملية بـ `updatedAt` مختلف (clock skew)، لن يُتعرف عليها كـ duplicate.

### Data Bugs

6. **🔴 Grade Draft Lost on Tab Close**
   إذا أغلق الأستاذ التاب خلال 900ms من إدخال آخر نقطة، تلك النقطة تُفقد.
   `beforeunload` handler يستدعي `persistDraftGrades()` لكن هذا async — المتصفح قد يقتله.

7. **🟠 Student IDs in Attendance After Student Deletion**
   عند حذف تلميذ، `handleExecuteDelete` يحذف grades لكن attendance في sessions ما زال يحتوي على الـ studentId.

### Security Bugs

8. **✅ No cross-user data access** — RLS يحمي بشكل صحيح.

### Scalability Bugs

9. **🟡 `loadCoreState` Loads ALL Data**
   كل التحميل يجلب كل صفوف كل الجداول. مع 5 سنوات من البيانات:
   - 7 أقسام × 45 تلميذ × 3 فصول = 945 grade
   - 7 أقسام × 35 أسبوع = 245 session
   - 245 session × 45 تلميذ attendance = 11,025 row
   
   هذا سيُصبح بطيئًا (> 2s على Supabase).

---

## 17. 📊 SEVERITY INDEX

### 🔴 CRITICAL (3 issues)
1. Grade draft lost on tab close (300-900ms window)
2. No onboarding flow — new users see empty app
3. `isDemoState` fragility — name change breaks cloud sync

### 🟠 HIGH (8 issues)
4. Grade auto-save race condition on class switch
5. `saveStatus` doesn't reflect actual cloud sync state
6. No multi-tab synchronization
7. `ClassesManager.tsx` is 2300+ lines — unmaintainable
8. `loadCoreState` makes 12+ parallel queries
9. `persistDraftGrades` fire-and-forget on class switch
10. Workspace cache never invalidated
11. No button disable during save operations

### 🟡 MEDIUM (12 issues)
12. Arabic numerals rejected in grade inputs
13. Missing form labels for accessibility
14. Horizontal scroll in grades table (tablet)
15. Student attendance not cleaned on student delete
16. No password auth — Google-only is fragile
17. Legacy dead code in types
18. Inconsistent naming (handleUpdateState/onUpdateState/updateState)
19. No pull-to-refresh
20. Missing max length on text inputs
21. Dark mode not implemented
22. No undo/redo
23. `xlsx` library is 400KB+

### 🟢 LOW (8 issues)
24. Revision counter never resets
25. Defensive code without cause
26. Fake 'saving' loading state
27. Module-level caches (authCheckCache)
28. Color inconsistency (gold vs amber)
29. Touch targets slightly small on desktop student list
30. No pagination
31. No virtualization for long lists

---

## 18. 📋 FINAL AUDIT REPORT

### Executive Summary

تطبيق «معين الأستاذ» يمتلك بنية سحابية متقدمة جدًا (sync outbox, tombstones, conflict resolution) لكنها مُحَمَّلة بـ UI components ضخمة ومنطق business مدمج في الواجهة. التطبيق **يعمل بشكل صحيح في الـ happy path** لكن يحتوي على ثغرات خطيرة في handling الأخطاء و edge cases — خصوصًا في منطقة إدخال العلامات.

### Critical Findings

#### C1: Grade Draft Lost on Tab Close
- **Problem:** 900ms debounce + async `beforeunload` = data loss window
- **Why it matters:** الأستاذ يدخل علامات طوال الحصة. فقدان نقطة واحدة يضيع ثقته بالتطبيق.
- **Reproduction:** أدخل نقطة → أغلق التاب فورًا → أعد الفتح
- **Root cause:** `setTimeout(900)` في `persistDraftGrades` + `beforeunload` async
- **Fix:** استخدام `navigator.sendBeacon` أو حفظ فوري عند `visibilitychange`

#### C2: No Onboarding Flow
- **Problem:** أستاذ جديد يرى تطبيقًا فارغًا بدون توجيه
- **Why it matters:** المستخدم لن يفهم ما يجب فعله → سيغادر
- **Reproduction:** حساب جديد → Dashboard
- **Root cause:** `onboardingDismissed` exists but never used
- **Fix:** 3-step onboarding wizard

#### C3: `isDemoState` Fragility
- **Problem:** إذا غيّر الأستاذ اسمه من "أستاذ المادة" → يُعتبر demo ولا يُحمّل من السحابة
- **Why it matters:** البيانات السحابية لا تظهر بعد تسجيل الدخول
- **Reproduction:** غيّر الاسم في Settings → أعد تحميل الصفحة
- **Root cause:** `isDemoState()` يتحقق من `profile.name === 'أستاذ المادة'`
- **Fix:** استخدام `cloudRevision` أو flag explicit بدل التحقق من الاسم

### High Priority Findings

#### H1: Grade Auto-Save Race Condition
- **Problem:** تغيير القسم أثناء dirty draft → حفظ خاطئ
- **Fix:** `await persistDraftGrades()` قبل تغيير القسم مع error handling

#### H2: Save Status Misleading
- **Problem:** "محفوظ تلقائيًا" تظهر قبل تأكيد الـ cloud sync
- **Fix:** ربط `saveStatus` بـ `cloudStatus` من context

#### H3: No Multi-Tab Sync
- **Problem:** Tabs مختلفة ترى بيانات مختلفة
- **Fix:** `BroadcastChannel` API أو `localStorage` events

#### H4: ClassesManager 2300+ Lines
- **Problem:** unmaintainable, hard to test, slow to load
- **Fix:** تقسيم إلى 4-5 مكونات منفصلة

---

## 19. 🔄 MUTATION / SYNC MATRIX

| Feature | Mutation | Local Update | DB Update | Error Handling | Rollback | Refresh Safe | Risk |
|---------|----------|-------------|-----------|----------------|----------|--------------|------|
| Create Class | `updateStateAndWait` | ✅ Immediate | ✅ Awaited | ✅ Toast | ❌ No | ✅ Yes | 🟢 Low |
| Edit Class | `updateStateAndWait` | ✅ Immediate | ✅ Awaited | ✅ Toast | ❌ No | ✅ Yes | 🟢 Low |
| Delete Class | `updateStateAndWait` | ✅ Immediate | ✅ Awaited | ✅ Toast | ❌ No | ✅ Yes | 🟡 Manual cascade |
| Add Student | `updateStateAndWait` | ✅ Immediate | ✅ Awaited | ✅ Toast | ❌ No | ✅ Yes | 🟢 Low |
| Edit Student | `updateStateAndWait` | ✅ Immediate | ✅ Awaited | ✅ Toast | ❌ No | ✅ Yes | 🟢 Low |
| Delete Student | `updateStateAndWait` | ✅ Immediate | ✅ Awaited | ✅ Toast | ❌ No | ✅ Yes | 🟡 Attendance stale |
| **Enter Grade** | **Debounced 900ms** | **✅ Immediate** | **🟡 Delayed** | **🟠 Console** | **❌ No** | **🟠 Partial** | **🔴 High** |
| Auto-Save Grades | `persistDraftGrades` | ✅ Via draft | ✅ Awaited | 🟡 Toast only | ❌ No | ✅ Yes | 🟠 High |
| Toggle Attendance | `updateStateAndWait` | ✅ Immediate | ✅ Awaited | ✅ Toast | ❌ No | ✅ Yes | 🟢 Low |
| Create Session | `updateStateAndWait` | ✅ Immediate | ✅ Awaited | ✅ Toast | ❌ No | ✅ Yes | 🟢 Low |
| Edit Session | `updateStateAndWait` | ✅ Immediate | ✅ Awaited | ✅ Toast | ❌ No | ✅ Yes | 🟢 Low |
| Timetable Slot | `updateStateAndWait` | ✅ Immediate | ✅ Awaited | ✅ Toast | ❌ No | ✅ Yes | 🟢 Low |
| Profile Update | `updateStateAndWait` | ✅ Immediate | ✅ Awaited | ✅ Toast | ❌ No | ✅ Yes | 🟢 Low |
| Import Roster | `commitRosterImport` | ✅ Immediate | ✅ Awaited | ✅ Toast | ❌ No | ✅ Yes | 🟡 Complex |
| Reset Workspace | `resetWorkspace` | ✅ Immediate | ✅ Awaited | ✅ Toast | ❌ No | ✅ Yes | 🟡 Destructive |

---

## 20. ✅ PRODUCTION READINESS

### هل التطبيق جاهز للاستخدام الإنتاجي من طرف عدد محدود من الأساتذة؟

### الجواب: **نعم، بشرط إصلاح 3 مشاكل حرجة أولًا.**

### ما هو جاهز؟

- ✅ المصادقة والتفويض (Auth + RLS)
- ✅ التخزين السحابي والبنية التحتية
- ✅ نظام المزامنة الأساسي (outbox + flush)
- ✅ إدارة الأقسام والتلاميذ (CRUD كامل)
- ✅ إدارة الحضور والغياب
- ✅ واجهة الهاتف الأساسية
- ✅ استيراد ملفات Excel
- ✅ حساب المعدل والتقييم المستمر
- ✅ تصدير البيانات

### ما يحتاج إصلاحًا؟

- 🔴 فقدان بيانات النقاط عند إغلاق التاب المفاجئ
- 🔴 عدم وجود onboarding
- 🔴 `isDemoState` fragility
- 🟠 misleading save status
- 🟠 race conditions في grade editing
- 🟠 multi-tab sync

### Blockers (يجب إصلاحها قبل الإطلاق)

1. Grade draft persistence on tab close
2. Onboarding flow
3. `isDemoState` fix

### ما يجب اختباره قبل الإطلاق

1. ✅ اختبار إدخال نقاط على هاتف حقيقي مع انقطاع إنترنت
2. ✅ اختبار refresh بعد إدخال نقاط
3. ✅ اختبار multi-tab usage
4. ✅ اختبار import roster مع بيانات حقيقية
5. ✅ اختبار session expiry وإعادة الدخول

### ما يمكن تأجيله

- تقسيم الـ components (يمكن العمل به كما هو)
- Pagination (مع < 1000 record لا حاجة)
- Dark mode
- Pull-to-refresh
- Undo/Redo

---

## 21. 🛠️ FIX PLAN

### Phase 1 — Must Fix Before Production (1-2 أيام)

1. **Grade persistence on tab close**
   - إضافة `visibilitychange` handler يحفظ فوريًا
   - تقليل debounce إلى 500ms
   - إضافة confirmation عند الإغلاق مع dirty draft

2. **`isDemoState` fix**
   - استبدال التحقق من الاسم بـ `cloudRevision === undefined && classes.length > 0`

3. **Basic onboarding**
   - 3 خطوات: الاسم → استيراد الأقسام → بدء الاستخدام

### Phase 2 — UX / Reliability (3-5 أيام)

4. **Grade auto-save race condition** — `await` قبل class switch
5. **Save status accuracy** — ربط بـ `cloudStatus`
6. **Button disable during save** — `isSaving` state
7. **Multi-tab sync** — `BroadcastChannel`
8. **Attendance cleanup on student delete**

### Phase 3 — Performance / Architecture (1-2 أسابيع)

9. **Split ClassesManager** — 4-5 components
10. **Reduce `loadCoreState` queries** — batch أو RPC
11. **Extract import logic** — shared function
12. **Remove dead code** — legacy fields

### Phase 4 — Polish (مستمر)

13. **Accessibility** — labels, ARIA, color contrast
14. **Dark mode**
15. **Pull-to-refresh**
16. **Arabic numeral support**
17. **Undo/redo**
18. **Performance monitoring**

---

## 22. 📝 الإجابة عن السؤال الأهم

> **عندما يقوم الأستاذ بأي تعديل داخل التطبيق، هل يمكنني أن أثق فعليًا أن التعديل تم حفظه في قاعدة البيانات وأن واجهة التطبيق تمثل الحالة الحقيقية للبيانات؟**

### الإجابة التفصيلية:

**بالنسبة لمعظم العمليات (إنشاء/تعديل/حذف أقسام، تلاميذ، حصص، حضور):**
**✅ نعم** — تستخدم `updateStateAndWait` التي تنتظر تأكيد Supabase قبل إظهار رسالة النجاح.

**بالنسبة لإدخال العلامات (النقاط):**
**⚠️ لا يمكن الثقة الكاملة** — تستخدم debounce pattern مع 900ms تأخير:
- بعد الـ 900ms، البيانات في React state ✅
- بعد الـ flush، البيانات في Supabase ✅
- لكن:
  - إذا أغلقت التاب خلال 900ms → **بيانات مفقودة** ❌
  - إذا فشل الشبكة بعد "محفوظ تلقائيًا" → **الفجوة بين UI و DB** ❌
  - إذا غيّر المستخدم القسم بسرعة → **race condition** ❌

### فجوات "UI says saved, data wasn't saved":

| الحالة | المكان | السبب |
|--------|--------|-------|
| إدخال نقطة → إغلاق فوري | GradesAndEvaluation | 900ms debounce + async unload |
| إدخال نقطة → "محفوظ" → فشل الشبكة لاحقًا | GradesAndEvaluation | saveStatus لا يعكس cloud status |
| تعديل أثناء sync | handleUpdateState | UI يحدث فورًا قبل flush |
| تغيير قسم أثناء dirty draft | handleSelectClass | fire-and-forget persist |

---

## خاتمة

التطبيق يمتلك بنية تحتية ممتازة (supabase sync, RLS, offline support) لكنه يحتاج:
1. **إصلاحات حرجة** في منطقة العلامات (Grade persistence)
2. **تحسين UX** (onboarding, error feedback)
3. **تنظيف معماري** (تقسيم المكونات الضخمة)

مع إصلاحات Phase 1 (1-2 أيام عمل)، يمكن إطلاق التطبيق لعدد محدود من الأساتذة بأمان.
