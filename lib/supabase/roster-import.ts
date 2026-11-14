import { createSupabaseBrowserClient } from './browser';
import type { GradeLevel, Student } from '@/lib/types';
import { normalizeDateToIso } from '@/lib/date-utils';
import { getCloudRecordId } from './core-sync';
import { getWeeklyHours } from '@/lib/curriculum-data';
import { DEFAULT_CLASS_COLOR, pickClassColor } from '@/lib/class-colors';

export interface RosterImportClass {
  id: string;
  name: string;
  level: GradeLevel;
  stream: string;
  roomNumber?: string;
  /** لون تمييز القسم (يُختار تلقائياً إن لم يرفقه المستورد) */
  color?: string;
}

export interface RosterImportStudent extends Omit<Student, 'classId'> {
  classId: string;
}

export interface CommittedRoster {
  classes: RosterImportClass[];
  students: RosterImportStudent[];
}

export async function commitRosterImportBatch(
  classes: RosterImportClass[],
  students: RosterImportStudent[],
): Promise<CommittedRoster> {
  if (classes.length === 0) return { classes: [], students: [] };
  const client = createSupabaseBrowserClient();
  if (!client) {
    throw new Error('تعذر الوصول إلى الخادم السحابي لتأكيد استيراد القوائم.');
  }

  const { data: authData } = await client.auth.getUser();
  const userId = authData.user?.id;
  if (!userId) {
    throw new Error('يجب تسجيل الدخول لتأكيد استيراد القوائم في السحابة.');
  }

  // كل قسم يحصل على لون مختلف عن بقية الأقسام في نفس الاستيراد
  const usedColors: string[] = [];
  const mappedClasses = classes.map((c) => {
    const requested = typeof c.color === 'string' ? c.color.trim() : '';
    const color = requested || pickClassColor(usedColors);
    usedColors.push(color);
    return {
      id: getCloudRecordId(userId, 'class', c.id),
      name: c.name.trim(),
      level: c.level,
      stream: c.stream || '',
      section: c.stream || '',
      roomNumber: c.roomNumber?.trim() || null,
      color,
    };
  });

  const mappedStudents = students.map((s) => ({
    id: getCloudRecordId(userId, 'student', s.id),
    class_id: getCloudRecordId(userId, 'class', s.classId),
    classId: getCloudRecordId(userId, 'class', s.classId),
    full_name: s.fullName.trim(),
    fullName: s.fullName.trim(),
    number_in_list: s.numberInList,
    numberInList: s.numberInList,
    reg_number: s.regNumber || null,
    registration_number: s.registrationNumber || s.regNumber || null,
    gender: s.gender === 'M' ? 'M' : s.gender === 'F' ? 'F' : null,
    birth_date: normalizeDateToIso(s.birthDate) || null,
    is_repeater: Boolean(s.isRepeater),
    guardian_phone: s.guardianPhone || null,
    notes: s.notes || null,
  }));

  // Resolve Workspace
  let wid: string | null = null;
  const widResult = await (client as any).rpc('default_workspace_id');
  if (typeof widResult.data === 'string' && widResult.data) {
    wid = widResult.data;
  } else {
    const { data: ws } = await (client as any).from('workspaces').select('id').eq('owner_id', userId).maybeSingle();
    if (ws?.id) {
      wid = ws.id;
    } else {
      const { data: createdWs } = await (client as any).from('workspaces').upsert({ owner_id: userId }, { onConflict: 'owner_id' }).select('id').single();
      if (createdWs?.id) wid = createdWs.id;
    }
  }

  // Check for existing classes by name to prevent unique constraint collision on (workspace_id, name, academic_year)
  const { data: existingClasses } = await (client as any)
    .from('classes')
    .select('id, name')
    .eq('owner_id', userId);

  const existingClassMap = new Map<string, string>();
  for (const c of (existingClasses || []) as Array<{ id?: string; name?: string }>) {
    if (typeof c.name === 'string' && typeof c.id === 'string') {
      existingClassMap.set(c.name.trim(), c.id);
    }
  }

  for (const c of mappedClasses) {
    const matchedExistingId = existingClassMap.get(c.name);
    if (matchedExistingId && matchedExistingId !== c.id) {
      for (const s of mappedStudents) {
        if (s.class_id === c.id || s.classId === c.id) {
          s.class_id = matchedExistingId;
          s.classId = matchedExistingId;
        }
      }
      c.id = matchedExistingId;
    }
  }

  const classIds = Array.from(new Set(mappedClasses.map((c) => c.id)));

  // Reconcile students with existing DB records to prevent unique constraint collisions
  // on (workspace_id, class_id, number_in_list) and preserve grades/attendance foreign keys
  let existingDbStudents: any[] = [];
  if (classIds.length > 0) {
    try {
      const { data: dbStudents } = await (client as any)
        .from('students')
        .select('id, class_id, number_in_list, reg_number, registration_number, full_name')
        .in('class_id', classIds)
        .eq('owner_id', userId);
      if (dbStudents) {
        existingDbStudents = (dbStudents as any[]).map((row: any) => ({
          ...row,
          // الرقم الفعلي قبل أي إزاحة +10000 سابقة (من محاولة استيراد قديمة متوقفة جزئياً)
          _originalNumber:
            typeof row.number_in_list === 'number' && row.number_in_list >= 10000
              ? row.number_in_list - 10000
              : row.number_in_list,
        }));
      }
    } catch (e) {
      console.warn('Error fetching existing students for reconciliation:', e);
    }
  }

  if (existingDbStudents.length > 0) {
    const usedDbStudentIds = new Set<string>();
    for (const s of mappedStudents) {
      const candidates = existingDbStudents.filter(
        (ex: any) => ex.class_id === s.class_id && !usedDbStudentIds.has(ex.id)
      );

      let match = candidates.find((ex: any) =>
        s.reg_number && (ex.reg_number === s.reg_number || ex.registration_number === s.reg_number)
      );

      if (!match) {
        match = candidates.find((ex: any) =>
          ex._originalNumber === s.number_in_list &&
          (ex.full_name?.trim() === s.full_name || !ex.full_name)
        );
      }

      if (!match) {
        match = candidates.find((ex: any) => ex._originalNumber === s.number_in_list);
      }

      if (match) {
        usedDbStudentIds.add(match.id);
        s.id = match.id;
      }
    }
  }

  const studentIds = mappedStudents.map((s) => s.id);
  const importedIdSet = new Set(studentIds);

  // Clear stale tombstones for these classes and students so they are never blocked by stale deletions
  try {
    await (client as any)
      .from('sync_tombstones')
      .delete()
      .eq('owner_id', userId)
      .in('entity_type', ['class', 'student'])
      .in('entity_id', [...classIds, ...studentIds]);
  } catch (err) {
    console.warn('Tombstone cleanup warning during roster import:', err);
  }

  const dbClasses = mappedClasses.map((c) => ({
    id: c.id,
    workspace_id: wid,
    owner_id: userId,
    name: c.name,
    level: c.level,
    section: c.section || null,
    weekly_hours: getWeeklyHours(c.level),
    academic_year: null,
    room_number: c.roomNumber?.trim() || null,
    color: c.color || DEFAULT_CLASS_COLOR,
    updated_by: userId,
  }));

  const { error: classesErr } = await (client as any)
    .from('classes')
    .upsert(dbClasses, { onConflict: 'id' });
  if (classesErr) throw classesErr;

  // استيراد دمجي فقط: لا يُحذف أي تلميذ سحابي غائب عن الملف.
  // تُزاح أرقام كل التلاميذ الموجودين +10000 قبل رفع الاستيراد كي لا تتصادم
  // مع قيد (workspace_id, class_id, number_in_list)، ثم يُعاد الترقيم بعد الرفع.
  if (existingDbStudents.length > 0) {
    for (let i = 0; i < existingDbStudents.length; i += 50) {
      const batch = existingDbStudents.slice(i, i + 50);
      await Promise.all(
        batch.map((row: any) =>
          (client as any)
            .from('students')
            .update({ number_in_list: row._originalNumber + 10000 })
            .eq('id', row.id)
        )
      );
    }
  }

  const dbStudents = mappedStudents.map((s) => ({
    id: s.id,
    workspace_id: wid,
    owner_id: userId,
    class_id: s.class_id,
    full_name: s.full_name,
    number_in_list: s.number_in_list,
    reg_number: s.reg_number,
    registration_number: s.registration_number,
    gender: s.gender === 'M' ? 'male' : s.gender === 'F' ? 'female' : null,
    birth_date: s.birth_date,
    is_repeater: s.is_repeater,
    guardian_phone: s.guardian_phone,
    notes: s.notes,
    updated_by: userId,
  }));

  for (let i = 0; i < dbStudents.length; i += 100) {
    const chunk = dbStudents.slice(i, i + 100);
    const { error: studentsErr } = await (client as any)
      .from('students')
      .upsert(chunk, { onConflict: 'id' });
    if (studentsErr) throw studentsErr;
  }

  // إعادة ترقيم التلاميذ الغائبين عن الملف بعد نجاح الرفع: نُفضّل رقمهم الأصلي
  // إن صار متاحاً، وإلا أصغر رقم حر. لا يفقد التلميذ أبداً: إن امتلأ القسم
  // (999 رقماً) يبقى مرئياً برقم مُزاح.
  const absentDbStudents = existingDbStudents.filter((row: any) => !importedIdSet.has(row.id));
  if (absentDbStudents.length > 0) {
    try {
      const takenByClass = new Map<string, Set<number>>();
      for (const s of dbStudents) {
        if (typeof s.number_in_list === 'number' && s.number_in_list < 10000) {
          let taken = takenByClass.get(s.class_id);
          if (!taken) {
            taken = new Set<number>();
            takenByClass.set(s.class_id, taken);
          }
          taken.add(s.number_in_list);
        }
      }

      const updates: Array<{ id: string; number_in_list: number }> = [];
      for (const row of absentDbStudents) {
        let taken = takenByClass.get(row.class_id);
        if (!taken) {
          taken = new Set<number>();
          takenByClass.set(row.class_id, taken);
        }

        let assigned: number | null = null;
        if (
          typeof row._originalNumber === 'number' &&
          row._originalNumber >= 1 &&
          row._originalNumber <= 999 &&
          !taken.has(row._originalNumber)
        ) {
          assigned = row._originalNumber;
        } else {
          for (let n = 1; n <= 999; n += 1) {
            if (!taken.has(n)) {
              assigned = n;
              break;
            }
          }
        }

        if (assigned === null) {
          console.warn(
            'Skipping renumber for student whose class is full of numbers:',
            row.id
          );
          continue;
        }

        taken.add(assigned);
        updates.push({ id: row.id, number_in_list: assigned });
      }

      for (let i = 0; i < updates.length; i += 50) {
        const batch = updates.slice(i, i + 50);
        await Promise.all(
          batch.map((u) =>
            (client as any)
              .from('students')
              .update({ number_in_list: u.number_in_list })
              .eq('id', u.id)
          )
        );
      }
    } catch (renumberErr) {
      console.warn('Student renumbering warning after roster import:', renumberErr);
    }
  }

  return {
    classes: mappedClasses.map((c) => ({
      id: c.id,
      name: c.name,
      level: c.level,
      stream: c.stream,
      roomNumber: c.roomNumber || undefined,
      color: c.color,
    })),
    students: mappedStudents.map((s) => ({
      id: s.id,
      classId: s.class_id,
      fullName: s.full_name,
      numberInList: s.number_in_list,
      regNumber: s.reg_number || undefined,
      registrationNumber: s.registration_number || undefined,
      gender: s.gender === 'M' || s.gender === 'F' ? s.gender : undefined,
      birthDate: s.birth_date || undefined,
      isRepeater: s.is_repeater,
      guardianPhone: s.guardian_phone || undefined,
      notes: s.notes || undefined,
    })),
  };
}
