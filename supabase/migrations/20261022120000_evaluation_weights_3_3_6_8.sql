-- أوزان التقويم المستمر وفق القرار الوزاري: السلوك 3 · المواظبة 3 · الكراس 6 · المشاركة 8
-- القيود القديمة كانت تسقف العناصر الأربعة عند 5، فتُرفض درجات الكراس (6) والمشاركة (8).

-- 1) كشوف قديمة تحمل قيماً على مقياس 5 (السلوك والمواظبة). نُقصّها إلى السقف الجديد
--    قبل فرض القيد، وإلا فشل الترحيل على أي صف قديم قيمته 4 أو 5. لا نلمس null.
update public.grades
set behavior_score = case when behavior_score > 3 then 3 else behavior_score end,
    attendance_score = case when attendance_score > 3 then 3 else attendance_score end,
    notebook_score = case when notebook_score > 6 then 6 else notebook_score end,
    participation_score = case when participation_score > 8 then 8 else participation_score end
where behavior_score > 3
   or attendance_score > 3
   or notebook_score > 6
   or participation_score > 8;

-- 2) نُسقط أي قيد تحقّق قائم على أعمدة التقويم الأربعة مهما كان اسمه التلقائي.
do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace ns on ns.oid = rel.relnamespace
    where ns.nspname = 'public'
      and rel.relname = 'grades'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ~ '(behavior_score|attendance_score|notebook_score|participation_score)'
  loop
    execute format('alter table public.grades drop constraint %I', constraint_name);
  end loop;
end
$$;

-- 3) القيود الجديدة تساوي أسقف القرار، وتطابق حدود toRow في lib/supabase/core-sync.ts.
alter table public.grades
  add constraint grades_behavior_score_check check (behavior_score between 0 and 3),
  add constraint grades_attendance_score_check check (attendance_score between 0 and 3),
  add constraint grades_notebook_score_check check (notebook_score between 0 and 6),
  add constraint grades_participation_score_check check (participation_score between 0 and 8);
