import re

with open('components/AttendanceSanad.tsx', 'r') as f:
    content = f.read()

# Replace handleCycleStatus logic to only toggle between PRESENT and ABSENT
old_cycle = r"""  const handleCycleStatus = \(studentId: string\) => \{\s*const current = activeAttendance\[studentId\] \|\| 'PRESENT';\s*const order: AttendanceStatus\[\] = \['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'\];\s*const nextIdx = \(order\.indexOf\(current\) \+ 1\) % order\.length;\s*handleSetStudentStatus\(studentId, order\[nextIdx\]\);\s*\};"""
new_cycle = """  const handleCycleStatus = (studentId: string) => {
    const current = activeAttendance[studentId] || 'PRESENT';
    const nextStatus = current === 'ABSENT' ? 'PRESENT' : 'ABSENT';
    handleSetStudentStatus(studentId, nextStatus);
  };"""
content = re.sub(old_cycle, new_cycle, content)

# Replace the Status Pill rendering logic for Student 1 and Student 2 in Seating Plan
# They currently have complex ternary for LATE and EXCUSED, and emojis ✔ ✖

pill_pattern = r"""<button\s*type="button"\s*onClick=\{\(\) => handleCycleStatus\(student\d\.id\)\}\s*className=\{`w-full py-1 px-1\.5 rounded text-\[11px\] font-black text-center transition-all cursor-pointer \$\{\s*\(activeAttendance\[student\d\.id\] \|\| 'PRESENT'\) === 'PRESENT'\s*\? 'bg-emerald-100 text-emerald-800 border border-emerald-300'\s*: \(activeAttendance\[student\d\.id\]\) === 'ABSENT'\s*\? 'bg-rose-100 text-rose-800 border border-rose-300'\s*: \(activeAttendance\[student\d\.id\]\) === 'LATE'\s*\? 'bg-amber-100 text-amber-800 border border-amber-300'\s*: 'bg-blue-100 text-blue-800 border border-blue-300'\s*\}\`\}\s*title="انقر لتبديل الحالة سريعاً"\s*>\s*\{activeAttendance\[student\d\.id\] === 'ABSENT'\s*\? 'غائب ✖'\s*: activeAttendance\[student\d\.id\] === 'LATE'\s*\? 'متأخر ⏱'\s*: activeAttendance\[student\d\.id\] === 'EXCUSED'\s*\? 'مبرر ℹ'\s*: 'حاضر ✔'\}\s*</button>"""

def replace_pill(match):
    text = match.group(0)
    student_var = "student1" if "student1.id" in text else "student2"
    
    return f"""<button
                              type="button"
                              onClick={{() => handleCycleStatus({student_var}.id)}}
                              className={{`w-full py-1 px-1.5 rounded text-[11px] font-black text-center transition-all cursor-pointer border ${{
                                (activeAttendance[{student_var}.id] || 'PRESENT') === 'PRESENT'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }}`}}
                              title="انقر لتبديل الحالة سريعاً"
                            >
                              {{(activeAttendance[{student_var}.id] || 'PRESENT') === 'PRESENT' ? 'حاضر ✔' : 'غائب ✖'}}
                            </button>"""

content = re.sub(pill_pattern, replace_pill, content, flags=re.DOTALL)


# Also ensure Desktop Table View has identical output
old_table_td = r"""<td className="p-3 text-center font-bold text-slate-700">\s*\{status === 'ABSENT'\s*\? \(\s*<span className="text-rose-600 bg-rose-50 px-2 py-1 rounded-md">غائب</span>\s*\) : status === 'LATE'\s*\? \(\s*<span className="text-amber-600 bg-amber-50 px-2 py-1 rounded-md">متأخر</span>\s*\) : status === 'EXCUSED'\s*\? \(\s*<span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-md">مبرر</span>\s*\) : \(\s*<span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">حاضر</span>\s*\)\}\s*</td>"""
new_table_td = """<td className="p-3 text-center font-bold text-slate-700">
                              {status === 'ABSENT' ? (
                                <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-1 rounded-md text-xs">غائب ✖</span>
                              ) : (
                                <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md text-xs">حاضر ✔</span>
                              )}
                            </td>"""
content = re.sub(old_table_td, new_table_td, content, flags=re.DOTALL)

with open('components/AttendanceSanad.tsx', 'w') as f:
    f.write(content)

