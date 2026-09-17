import re

with open('components/AttendanceSanad.tsx', 'r') as f:
    content = f.read()

# Replace Mobile View interactive buttons block
mobile_buttons_pattern = r"<div className=\"flex flex-wrap items-center gap-1 mt-3 pt-3 border-t border-slate-100\">.*?</div>"
new_mobile_buttons = """<div className="flex flex-wrap items-center justify-between w-full mt-3 pt-3 border-t border-slate-100">
                            <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleSetStudentStatus(student.id, status === 'ABSENT' ? 'PRESENT' : 'ABSENT')}
                                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer border ${
                                    status === 'ABSENT'
                                      ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                                      : 'border-transparent text-slate-500 hover:text-rose-600 hover:bg-slate-100'
                                  }`}
                                  title="تسجيل غياب"
                                >
                                  الغياب -
                                </button>
                                <button
                                  onClick={() => handleToggleBehavior(student.id, 'unwrittenLessons')}
                                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer border ${
                                    activeSession.unwrittenLessons?.includes(student.id)
                                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                      : 'border-transparent text-slate-500 hover:text-amber-600 hover:bg-slate-100'
                                  }`}
                                  title="لم يكتب الدرس"
                                >
                                  الكراس -
                                </button>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleToggleBehavior(student.id, 'disruptions')}
                                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer border ${
                                    activeSession.disruptions?.includes(student.id)
                                      ? 'bg-[#0D2C3B] text-white border-[#0D2C3B] shadow-xs'
                                      : 'border-transparent text-slate-500 hover:text-[#0D2C3B] hover:bg-slate-100'
                                  }`}
                                  title="شغب وسلوك سيء"
                                >
                                  شغب -
                                </button>
                                <button
                                  onClick={() => handleToggleBehavior(student.id, 'goodParticipation')}
                                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer border ${
                                    activeSession.goodParticipation?.includes(student.id)
                                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                                      : 'border-transparent text-slate-500 hover:text-emerald-600 hover:bg-slate-100'
                                  }`}
                                  title="مشاركة إيجابية"
                                >
                                  مشاركة +
                                </button>
                            </div>
                          </div>"""

# Ensure we only replace the specific one for mobile view (which is inside the first map loop of `filteredStudents` before desktop view)
# Actually, I'll just use a more targeted replace by isolating the block.
import sys
content_parts = content.split('{/* 2. Desktop Table View')
if len(content_parts) == 2:
    part1 = re.sub(mobile_buttons_pattern, new_mobile_buttons, content_parts[0])
    content = part1 + '{/* 2. Desktop Table View' + content_parts[1]
else:
    print("Error parsing Mobile block")
    sys.exit(1)


# Replace Seating Plan Grid buttons (student1 and student2)
# Since the buttons for both students are similar, we can replace both using regex.
grid_btn_pattern = r"<button\s+onClick=\{[^}]*\}\s+className=\{[^}]*\}\s+title=\"انقر لتبديل الحالة سريعاً\"\s*>\s*\{[^}]*\}\s*</button>\s*<div className=\"flex items-center justify-between gap-1 mt-1\">\s*<button[^>]*>\s*<AlertTriangle[^>]*/>\s*</button>\s*<button[^>]*>\s*<BookX[^>]*/>\s*</button>\s*<button[^>]*>\s*<UserMinus[^>]*/>\s*</button>\s*<button[^>]*>\s*<Star[^>]*/>\s*</button>\s*</div>"

def replacement_grid(match):
    # Determine if this is student1 or student2
    text = match.group(0)
    student_var = "student1" if "student1.id" in text else "student2"
    
    return f"""<div className="flex flex-col gap-1 mt-1">
                                <div className="flex items-center justify-between gap-1">
                                  <button
                                    onClick={{() => handleSetStudentStatus({student_var}.id, activeAttendance[{student_var}.id] === 'ABSENT' ? 'PRESENT' : 'ABSENT')}}
                                    className={{`flex-1 p-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${{
                                      activeAttendance[{student_var}.id] === 'ABSENT'
                                        ? 'bg-rose-500 text-white'
                                        : 'bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-600'
                                    }}`}}
                                  >
                                    الغياب -
                                  </button>
                                  <button
                                    onClick={{() => handleToggleBehavior({student_var}.id, 'unwrittenLessons')}}
                                    className={{`flex-1 p-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${{
                                      activeSession?.unwrittenLessons?.includes({student_var}.id)
                                        ? 'bg-amber-500 text-white'
                                        : 'bg-slate-100 text-slate-500 hover:bg-amber-100 hover:text-amber-600'
                                    }}`}}
                                  >
                                    الكراس -
                                  </button>
                                </div>
                                <div className="flex items-center justify-between gap-1">
                                  <button
                                    onClick={{() => handleToggleBehavior({student_var}.id, 'disruptions')}}
                                    className={{`flex-1 p-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${{
                                      activeSession?.disruptions?.includes({student_var}.id)
                                        ? 'bg-[#0D2C3B] text-white'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }}`}}
                                  >
                                    شغب -
                                  </button>
                                  <button
                                    onClick={{() => handleToggleBehavior({student_var}.id, 'goodParticipation')}}
                                    className={{`flex-1 p-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${{
                                      activeSession?.goodParticipation?.includes({student_var}.id)
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-600'
                                    }}`}}
                                  >
                                    مشاركة +
                                  </button>
                                </div>
                            </div>"""

content = re.sub(grid_btn_pattern, replacement_grid, content)

# Finally, update Seating Guide Legend
old_legend = r"""<span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-\[11px\]">حاضر</span>\s*<span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-\[11px\]">غائب</span>\s*<span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-\[11px\]">متأخر</span>\s*<span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-\[11px\]">مبرر</span>"""
new_legend = """<span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[11px]">الغياب -</span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[11px]">الكراس -</span>
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-bold text-[11px]">شغب -</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]">مشاركة +</span>"""

content = re.sub(old_legend, new_legend, content)


with open('components/AttendanceSanad.tsx', 'w') as f:
    f.write(content)

