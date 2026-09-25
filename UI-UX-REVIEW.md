# UI/UX Review — معين الأستاذ (Ostad)

**Date:** 2026-09-25  
**Scope:** Mobile-first and responsive UI/UX review based on the current repository source.  
**Primary user:** Algerian secondary-school Islamic sciences teacher using the app mostly on a phone during real classroom work.

---

## 1. Executive summary

The app already has a strong foundation for a modern Arabic RTL productivity tool: clear educational domain focus, a dedicated mobile bottom navigation, desktop sidebar, card-based mobile alternatives for many tables, PWA/offline thinking, sync status, and useful workflow shortcuts.

The main UX opportunity is to make the app less like a full admin system and more like a guided daily teaching assistant. On mobile, the user should always understand:

1. What should I do next?
2. Which class am I working on?
3. Is my work saved?
4. How do I return quickly to attendance, grades, or today’s session?

### Overall rating

| Area | Rating | Notes |
|---|---:|---|
| Visual identity | 7.5/10 | Good RTL typography and calm palette, but token use is inconsistent and gold-on-white contrast needs work. |
| Mobile-first UX | 7/10 | Many pages have mobile cards, but key actions are still top-heavy and some touch targets are small. |
| Responsive behavior | 6.5/10 | Good page containers, but a breakpoint mismatch creates tablet layout risk. |
| User journey | 7/10 | Strong daily-dashboard idea; onboarding/import journey needs tighter guidance and fewer competing patterns. |
| Accessibility | 6.5/10 | RTL, focus styles and some aria attributes exist; modals, labels, icon buttons, contrast and touch targets need polish. |
| Product clarity | 8/10 | The domain problem is clear and valuable. |

**Recommended priority:** Fix responsive breakpoint and touch/contrast issues first, then redesign onboarding and mobile daily journey.

---

## 2. What works well today

### 2.1 Arabic RTL foundation is strong

- The root layout uses `lang="ar"` and `dir="rtl"`.
- The UI uses Arabic-first copy and domain-specific labels.
- Tajawal and Amiri fonts support modern UI text plus religious/academic content.
- Most views are wrapped in mobile-friendly containers:
  - `max-w-[30rem]` on mobile
  - wider containers on desktop
  - consistent `px-3 sm:px-6 md:px-8`

### 2.2 Good native-app structure

- Mobile has a fixed bottom navigation.
- Desktop has a collapsible right sidebar.
- Top header is sticky and keeps the current page context visible.
- App supports PWA installation and offline/local operation.
- Sync status is visible and mostly non-blocking.

### 2.3 Many complex pages already avoid mobile tables

Good examples:

- **Attendance:** mobile card list instead of a wide table.
- **Grades:** mobile segmented control to edit one grade type at a time.
- **Students:** desktop table + mobile cards.
- **Timetable:** mobile daily list + desktop matrix.

This is the correct strategy for a teacher using one hand in a classroom.

### 2.4 Dashboard has good intent

The dashboard includes:

- next action recommendation;
- active class summary;
- today’s sessions;
- quick routes to attendance, grades, sessions and documents;
- onboarding/checklist ideas.

The idea is excellent. It should become the user’s “today workspace”.

---

## 3. Highest-priority UX problems

## P0 — Responsive breakpoint mismatch on tablet

### Problem

In `app/page.tsx`, the main content gets a right margin starting at `md`:

```tsx
isCollapsed ? "md:mr-20" : "md:mr-64"
```

But the persistent sidebar only becomes visible at `lg`:

```tsx
translate-x-full lg:translate-x-0
```

This means tablet widths between `md` and `lg` can have a large empty right offset while the sidebar is hidden. Mobile bottom navigation is also hidden at `md`, so tablet users rely on the header menu but see desktop spacing.

### UX impact

- Broken-feeling tablet layout.
- Wasted space on iPad/tablet landscape or small laptops.
- Navigation model changes too early.

### Recommendation

Use one breakpoint consistently:

- either show the persistent sidebar from `md`, or
- keep mobile/tablet layout until `lg`.

Recommended change:

```tsx
isCollapsed ? "lg:mr-20" : "lg:mr-64"
```

Also keep bottom navigation or a tablet navigation pattern until the sidebar is actually visible.

---

## P0 — Touch targets are inconsistent

### Problem

Many primary buttons use `min-h-11` or `h-14`, which is good. But several frequent controls are smaller:

- top header search/PWA/sync buttons;
- class card edit/delete icons;
- grade desktop inputs at `min-h-[36px]`;
- attendance mobile status buttons with small `py-1.5` text;
- tiny hover-only buttons in timetable desktop matrix;
- modal close buttons without consistent 44px area.

### UX impact

During class, teachers need fast, error-tolerant tapping. Small controls increase accidental actions, especially attendance/behavior marking.

### Recommendation

Adopt a strict target policy:

- mobile: minimum `44px × 44px`;
- desktop: minimum `36px × 36px`, but destructive actions should still be generous;
- icon-only buttons: `min-h-10 min-w-10` at minimum, `min-h-11 min-w-11` on mobile.

Create reusable classes/components:

- `IconButton`
- `PrimaryButton`
- `BottomSheetAction`
- `SegmentedControl`

---

## P0 — Gold buttons have weak contrast with white text

### Problem

The theme gold is `#D9B44A`. Several buttons use gold background with white text, for example:

- PWA install button
- “حفظ كل العلامات”
- some grade/focus states

White text on this gold is likely below WCAG contrast requirements.

### UX impact

- Hard to read in bright classroom lighting.
- Accessibility issue for low-vision users.
- The gold accent feels decorative instead of functional.

### Recommendation

Use one of these patterns:

1. gold background + navy text:
   - `bg-[var(--accent-gold)] text-[var(--accent-navy)]`
2. darker gold for buttons:
   - e.g. `#8A6414` or another accessible shade
3. keep gold as accent only, not primary button background.

---

## P1 — Onboarding exists, but the journey is not actionable enough

### Current state

There are two onboarding patterns:

1. global modal `components/Onboarding.tsx` for users with no classes/students;
2. dashboard onboarding banner/checklist in `components/Dashboard.tsx`.

Both are useful, but they compete. The modal collects profile data, then dismisses. The dashboard checklist points to setup tasks. The ideal new-user flow should guide the teacher directly to the import/add path.

### UX friction

A new teacher needs a clear path:

1. complete teacher/school profile;
2. import or add classes;
3. import or paste students;
4. set timetable;
5. start first attendance/session.

Today, the onboarding modal says “هيا نبدأ” but does not directly open the import flow. The dashboard banner helps, but only after the modal is dismissed.

### Recommendation

Create a single setup wizard with actionable CTAs:

| Step | CTA |
|---|---|
| Welcome | “ابدأ الإعداد” |
| Profile | “حفظ ومتابعة” |
| Classes | “استيراد من الرقمنة” / “إضافة قسم يدوياً” |
| Students | “استيراد الممتاز” / “لصق أسماء” |
| Timetable | “إضافة أول حصة” / “تخطي مؤقتاً” |
| Finish | “فتح لوحة اليوم” |

The wizard should save progress so the user can leave and continue later.

---

## P1 — Mobile bottom navigation does not fully match the daily journey

### Current mobile nav

`components/MobileNavigation.tsx` contains:

1. الرئيسية
2. الحصة الحالية → timetable
3. دفتر النصوص
4. النقاط
5. المزيد

### UX issue

For the teacher’s most frequent live-class journey, **attendance** is more important than timetable. “الحصة الحالية” pointing to the timetable is ambiguous: users may expect it to start attendance or session documentation.

### Recommendation

Use mobile bottom nav for the real top tasks:

Recommended option A:

1. اليوم
2. الأقسام
3. الحضور
4. النقاط
5. المزيد

Recommended option B with central action:

1. اليوم
2. الأقسام
3. **ابدأ الحصة** center CTA
4. النقاط
5. المزيد

The center action can route dynamically:

- if a current timetable slot exists → attendance for that class;
- if no current slot → choose class/session sheet.

---

## P1 — Key actions are too top-heavy on mobile

Many pages place important actions in top toolbars. This is common in desktop dashboards, but less ideal during one-handed mobile use.

Examples:

- Attendance: “حصة جديدة اليوم”, “توليد حصص الفصل”, export, follow in sessions.
- Grades: save, auto-fill, export, import are all top controls.
- Timetable: add/export/filter in top toolbar.

### Recommendation

For mobile, use sticky bottom action bars or floating contextual buttons:

- Attendance: sticky bottom “حفظ / متابعة في دفتر النصوص”.
- Grades: sticky bottom “حفظ العلامات” with saved/unsaved indicator.
- Timetable: floating “+ إضافة حصة”.
- Students: bottom sheet “إضافة أو استيراد”.

Keep secondary actions in an overflow menu.

---

## P1 — Too much density in some mobile cards

The current app prioritizes completeness, but some mobile cards include many metrics, badges and controls. This is useful for power users, but can feel heavy for first-time teachers.

### Pages affected

- Attendance student cards.
- Grades student cards.
- Dashboard top sections.
- Class cards.

### Recommendation

Use progressive disclosure:

- show essential data first;
- hide secondary stats behind “تفاصيل” or expand/collapse;
- use a compact/comfortable toggle in settings;
- preserve density for desktop and advanced users.

For example, attendance card default:

- student number/name;
- four status buttons;
- absence count badge.

Expanded:

- cumulative behavior;
- estimated impact;
- notes/history.

---

## 4. Page-by-page review

## 4.1 Auth and first entry

### Strengths

- Clean mobile-first landing page.
- Bottom sheet login is modern and mobile-friendly.
- Google + email magic link options are simple.
- Offline fallback appears after a delay.

### Issues

- Landing page does not show enough product value before asking to start.
- Login sheet has no obvious privacy/trust reassurance.
- Offline mode copy needs to clarify what sync means later.
- Bottom sheet should trap focus and support Escape/back gestures consistently.

### Recommendations

- Add 3 benefit cards under the hero:
  - “الحضور في ثوانٍ”
  - “النقاط محسوبة تلقائياً”
  - “وثائق جاهزة للطباعة”
- Add small trust line:
  - “يمكنك العمل محلياً، وتتم المزامنة عند الاتصال.”
- Use the official brand logo instead of the simple “مـ” block if available.

---

## 4.2 Onboarding

### Strengths

- Short, friendly modal.
- Asks for profile data relevant to documents.
- Uses progress dots.

### Issues

- It is isolated from the actual data setup journey.
- It can conflict conceptually with dashboard onboarding.
- Step 3 lists actions but does not perform them.
- Skip/dismiss may leave the user in an empty app with no strong next CTA.

### Recommendations

- Merge onboarding modal and dashboard checklist into one guided setup flow.
- End onboarding by opening the classes import/add sheet.
- Add “استيراد ملف الرقمنة” as a first-class action.
- Add “سأضيف يدوياً” fallback for teachers without files.

---

## 4.3 Dashboard

### Strengths

- Best page conceptually.
- “الخطوة التالية المقترحة” is exactly the right pattern.
- Active class card is useful.
- Quick tools reduce navigation depth.

### Issues

- Dashboard still has many competing sections.
- Quick action hierarchy could be clearer.
- Top stat bar can look like an admin dashboard instead of a daily teaching workspace.
- The page repeats some navigation choices available in nav/sidebar.

### Recommended redesign

Make the dashboard a “Today” screen:

1. **Current/next class card**
   - class name, time, room, planned lesson
   - primary CTA: “ابدأ الحصة”
   - secondary: “فتح التوقيت”
2. **Today checklist**
   - take attendance
   - write session notes
   - update grades if needed
3. **Active class shortcuts**
   - التلاميذ، الحضور، النقاط، دفتر النصوص
4. **Alerts**
   - missing timetable
   - students without grades
   - sync issue only if action needed

---

## 4.4 Classes and students

### Strengths

- Class cards are readable and action-oriented.
- Student list has desktop table and mobile cards.
- Import sheet for students is a good mobile pattern.
- Duplicate/merge and preview flows are valuable.

### Issues

- Classes page mixes many concepts: class setup, attendance, grades, student details.
- Edit/delete icon buttons are small and rely on `title` instead of strong accessible labels.
- On empty state, import/add path should be more prominent.
- Some copy alternates between “قسم”, “فوج”, “الأقسام المسندة”, which may be okay locally but should be intentionally standardized.

### Recommendations

- First empty state should offer two large cards:
  - “استيراد من الرقمنة”
  - “إضافة قسم يدوياً”
- Student import sheet should be available even before choosing a class if it can create classes from the file.
- Add long-press or action menu for destructive actions on mobile instead of always showing delete.
- Add accessible labels:
  - `aria-label="تعديل قسم {name}"`
  - `aria-label="حذف قسم {name}"`

---

## 4.5 Attendance

### Strengths

- Very strong mobile-first direction.
- Student cards are better than table scrolling.
- Behavior buttons are direct and fast.
- `aria-pressed` is used on status toggles.
- “Mark all present” is useful.

### Issues

- Attendance page is still visually dense.
- Four status buttons are small for live use.
- Labels like “الغياب -”, “الكراس -”, “شغب -”, “مشاركة +” are compact but may not be self-explanatory for new users.
- Export action is less important during live attendance and should be secondary.
- There is no clear “session complete” moment.

### Recommendations

- Increase mobile status buttons to at least 44px high.
- Use icons + labels + color, not only tiny text.
- Add a sticky bottom bar:
  - saved state
  - “متابعة في دفتر النصوص”
- Add an optional “mode” switch:
  - سريع: attendance only
  - مفصل: behavior + participation
- Add confirmation/undo snackbar after bulk actions like “تحديد الكل حاضر”.

---

## 4.6 Grades

### Strengths

- Mobile segmented control avoids a huge table.
- Save status is visible.
- Automatic continuous evaluation is valuable.
- Summary cards give quick class status.

### Issues

- The toolbar contains many actions at once.
- “حقن الرقمنة” may be unclear for non-technical users.
- Save and auto-fill are high-impact actions but visually compete with export/import.
- On mobile, editing one grade type at a time is good, but users need a clear way to see completion across all three grade types.

### Recommendations

- Split actions:
  - primary: حفظ العلامات
  - secondary menu: استيراد/تصدير/شرح الصيغة
  - automation: separate card “أدوات ذكية”
- Rename “حقن الرقمنة” to something clearer:
  - “ملء ملف الرقمنة بالنقاط”
- Add per-student completion indicator:
  - 0/3, 1/3, 2/3, complete.
- Add inline validation messages for grades outside 0–20 instead of silently ignoring invalid input.
- Keep save status sticky at bottom on mobile.

---

## 4.7 Timetable

### Strengths

- Excellent responsive model: mobile daily list, desktop matrix.
- Add/edit modal behaves like a bottom sheet on mobile.
- Day pills are clear and easy to scan.

### Issues

- Top action bar may wrap awkwardly on small screens.
- Desktop matrix has tiny hover-only edit/delete buttons.
- Tablet behavior should align with the global navigation breakpoint.

### Recommendations

- Keep mobile daily list until `lg`, which the component already does.
- Make desktop matrix actions visible on keyboard focus, not hover only.
- Use a floating `+` on mobile for adding a session to the selected day.
- Add “copy this day” or “duplicate slot” later if teachers repeat schedules.

---

## 4.8 Sessions / lesson notebook

### Strengths

- Rich text toolbar supports domain-specific formatting.
- Session documentation is connected from attendance.
- Export/print thinking is present.

### Issues

- Rich editing on mobile can become crowded.
- Teachers likely need fast templates more than formatting controls during live work.

### Recommendations

- Add quick templates:
  - “تم إنجاز…”
  - “واجب منزلي…”
  - “ملاحظة حول القسم…”
- Collapse formatting toolbar under “تنسيق” on small screens.
- Add voice-to-text affordance if possible later, because teachers may document after class quickly.

---

## 4.9 Curriculum, annual distribution and lesson preparation

### Strengths

- Horizontal chips are suitable for filtering levels/years.
- Strong academic content value.
- The teacher can move from curriculum to lesson preparation.

### Issues

- Some screens likely have many small controls and dense cards.
- Curriculum content can be read-only/reference-heavy; it needs clear “what can I do next?” actions.

### Recommendations

- Every unit card should prioritize:
  - status: not started / in progress / completed;
  - next action: prepare lesson / mark progress / view PDF.
- Use sticky level filter on mobile.
- For long content, add search and “recently used”.

---

## 4.10 Documents and exports

### Strengths

- Documents are a strong differentiator.
- Desktop print previews are useful.
- Mobile export cards exist.

### Issues

- Print/table previews are inherently desktop-oriented.
- On mobile, the user likely wants “choose document → export/share”, not inspect wide tables.

### Recommendations

- Mobile document flow:
  1. choose document type;
  2. choose class/term;
  3. preview summary only;
  4. export/share.
- Keep full A4 preview for tablet/desktop.
- Add “last exported” history later.

---

## 4.11 Settings

### Strengths

- Tabbed settings reduce vertical complexity.
- Professional profile is important for document output.
- Backup/sync tools are visible.

### Issues

- Settings pages often accumulate too many controls.
- Several labels should be programmatically associated with inputs.
- Backup/sync/destructive actions need stronger hierarchy.

### Recommendations

- Group settings into user mental models:
  - ملفي المهني
  - السنة والفصول
  - النسخ الاحتياطي والمزامنة
  - الخصوصية والبيانات
- Use warning zones for destructive actions.
- Add “profile completeness” indicator because missing school/profile data affects official documents.

---

## 5. Navigation and information architecture

### Current structure

Desktop sidebar groups routes into:

- الرئيسية
- المنهاج والتخطيط
- التقويم
- النظام

This is logical, but mobile users think more in terms of tasks.

### Recommended mobile task map

| Mobile task | Destination |
|---|---|
| اليوم | Dashboard |
| الأقسام | Classes/students setup |
| الحضور | Attendance for active/current class |
| النقاط | Grades |
| المزيد | Timetable, sessions, curriculum, documents, settings |

### Recommended desktop/sidebar refinements

Keep the current groups, but consider:

- “اليوم” instead of “لوحة التحكم” for the dashboard.
- “التلاميذ والأقسام” as one grouped area.
- “الحضور والتقويم المستمر” for attendance if behavior affects continuous evaluation.
- Avoid duplicate/near-duplicate labels across nav and page title.

---

## 6. Visual design review

## 6.1 Color system

### Strengths

- Primary ocean blue + navy + gold works well for a professional education app.
- Light theme is appropriate for print-heavy school use.

### Issues

- Components mix CSS variables with raw Tailwind palettes like `slate`, `amber`, `rose`, `blue`, `emerald`.
- Some colors are inline hex values for class colors.
- Gold contrast needs adjustment.

### Recommendations

Create semantic aliases and use them everywhere:

- `--surface-card`
- `--surface-muted`
- `--action-primary`
- `--action-secondary`
- `--state-success`
- `--state-warning`
- `--state-danger`
- `--state-info`

Use Tailwind arbitrary values only through variables, not direct palettes, except for class-specific user colors.

## 6.2 Typography

### Strengths

- Tajawal is good for UI.
- Amiri adds academic personality.

### Issues

- Many labels use `text-[10px]` or `text-[11px]`.
- This is efficient but can hurt readability on phones.

### Recommendations

Minimum mobile text guidance:

- body: 13–14px;
- metadata: 12px minimum;
- badges: 11px only when non-essential;
- buttons: 12–13px minimum.

## 6.3 Spacing and hierarchy

### Strengths

- Rounded cards and soft borders give a modern look.
- Consistent page padding is good.

### Issues

- Many cards have similar visual weight, so hierarchy can flatten.
- Some pages show too many bordered boxes at once.

### Recommendations

Use a stronger hierarchy:

1. primary card: larger, tinted, one CTA;
2. secondary cards: white with border;
3. metadata: no card unless interactive;
4. destructive/warning: separate visual zone.

---

## 7. Accessibility review

### Strengths

- `dir="rtl"` and `lang="ar"` are set.
- Skip link exists.
- Focus-visible base style exists.
- Some `aria-pressed` and `aria-current` usage exists.
- Many tables keep real table markup on desktop.

### Issues

- Several modals are custom and do not appear to share focus trap/escape handling.
- Some icon buttons rely on `title` but lack `aria-label`.
- Some close buttons lack accessible names.
- Many visible labels do not use `htmlFor` / `id` association.
- Gold/white contrast is weak.
- Some controls are smaller than mobile touch guidelines.

### Recommendations

- Use `AccessibleDialog` for all dialogs/bottom sheets.
- Add `aria-label` to all icon-only buttons.
- Add `htmlFor`/`id` to all form fields.
- Ensure every button has a visible focus ring.
- Test with keyboard only and screen reader in Arabic.
- Run automated checks with Axe or Playwright accessibility checks.

---

## 8. Modern UX enhancement ideas

### 8.1 “Today mode”

A streamlined teacher mode optimized for class time:

- current class;
- four attendance/behavior buttons;
- session note shortcut;
- save status;
- next class timer.

This can become the core mobile experience.

### 8.2 Smart command button

A persistent action button that changes by context:

- no classes → “إضافة قسم”
- no students → “استيراد التلاميذ”
- before class → “فتح الحصة القادمة”
- during class → “تسجيل الحضور”
- after class → “توثيق الدفتر”

### 8.3 Better empty states

Every empty state should answer:

1. Why is this empty?
2. What should I do now?
3. Can I import instead of manually entering data?

### 8.4 Undo for risky quick actions

For fast classroom work, undo is better than confirmation for non-destructive quick toggles:

- mark all present;
- auto-fill continuous evaluation;
- apply estimations;
- bulk generated sessions.

Use snackbar:

> تم تطبيق التغيير — تراجع

### 8.5 Consistent bottom sheets

Use bottom sheets on mobile for:

- create/edit class;
- create/edit student;
- import options;
- add timetable slot;
- export options;
- filter/search.

Desktop can keep centered dialogs.

---

## 9. Recommended implementation roadmap

## Phase 1 — Quick wins, high impact

Estimated effort: 1–2 days.

1. Fix global `md`/`lg` sidebar/content breakpoint mismatch.
2. Increase mobile touch targets to 44px minimum.
3. Fix gold contrast.
4. Add accessible labels to icon-only buttons and modal close buttons.
5. Hide secondary header actions behind overflow on very small screens.
6. Rename unclear copy such as “حقن الرقمنة” to “ملء ملف الرقمنة بالنقاط”.
7. Make attendance and grades save status more mobile-visible.

## Phase 2 — Mobile journey improvement

Estimated effort: 3–5 days.

1. Redesign bottom nav around daily tasks.
2. Add dynamic “ابدأ الحصة” CTA.
3. Convert major mobile modals into reusable bottom sheets.
4. Simplify dashboard into “Today” screen.
5. Improve empty states and first-run setup CTAs.

## Phase 3 — Onboarding and setup wizard

Estimated effort: 1 week.

1. Merge onboarding modal + dashboard checklist into one setup flow.
2. Add import-first setup path.
3. Add progress persistence.
4. Add profile completeness warning before exports.
5. Add demo-data clarity and “start with my real data” path.

## Phase 4 — Accessibility and design-system cleanup

Estimated effort: 1 week.

1. Replace ad-hoc dialogs with `AccessibleDialog`/bottom sheet component.
2. Add form label associations.
3. Standardize button/input/card components.
4. Replace raw palette classes with semantic tokens.
5. Add automated accessibility checks.

---

## 10. Proposed target user journey

### New teacher

1. Opens app.
2. Sees short value proposition and starts.
3. Signs in or continues locally.
4. Enters profile and school details.
5. Imports classes/students from digitization file, or adds manually.
6. Adds timetable.
7. Lands on Today dashboard.
8. Starts first class.

### Daily use

1. Opens app on phone.
2. Dashboard shows current/next class.
3. Taps “ابدأ الحصة”.
4. Marks attendance/behavior.
5. Taps “متابعة في دفتر النصوص”.
6. Adds accomplishments/next steps.
7. App shows saved/synced status.

### End of term

1. Opens grades.
2. Uses attendance/behavior to calculate continuous evaluation.
3. Enters quiz/exam marks.
4. Reviews incomplete students.
5. Exports grade sheet or fills digitization file.
6. Opens council analysis/documents.

---

## 11. Success metrics to track

| Metric | Why it matters |
|---|---|
| Time to first class created/imported | Measures onboarding success. |
| Time to first attendance record | Measures daily workflow clarity. |
| Percentage of users who complete profile | Affects official document quality. |
| Number of taps from dashboard to attendance | Should be 1 tap when class is known. |
| Save/sync error visibility | Builds trust. |
| Mobile horizontal scroll occurrences | Should be near zero except print previews. |
| Grade completion rate per class | Measures grade UX effectiveness. |

---

## 12. Final recommendation

The app should keep its current professional Arabic education identity, but the next UI/UX iteration should prioritize:

1. **one clear mobile daily flow**;
2. **larger, safer touch interactions**;
3. **single guided onboarding/setup journey**;
4. **consistent responsive breakpoints**;
5. **accessible colors, dialogs and labels**;
6. **progressive disclosure to reduce cognitive load**.

With these changes, the app can feel less like a data-management dashboard and more like a polished native assistant for teachers in real classroom conditions.
