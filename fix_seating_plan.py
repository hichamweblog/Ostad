import re

with open('components/AttendanceSanad.tsx', 'r') as f:
    content = f.read()

# I need to find the student card inside the Seating Plan.
# There are two blocks for student1 and student2
# They look like this:
"""
                            {/* Current Status Pill with quick cycle on click */}
                            <button
"""

# Let's write a python script to insert the small evaluation toggles there.

new_buttons1 = """
                            {/* Current Status Pill with quick cycle on click */}
                            <button
                              type="button"
                              onClick={() => handleCycleStatus(student1.id)}
                              className={`w-full py-1 px-1.5 rounded text-[11px] font-black text-center transition-all cursor-pointer ${
                                (activeAttendance[student1.id] || 'PRESENT') === 'PRESENT'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : (activeAttendance[student1.id]) === 'ABSENT'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : (activeAttendance[student1.id]) === 'LATE'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-blue-100 text-blue-800 border border-blue-300'
                              }`}
                              title="انقر لتبديل الحالة سريعاً"
                            >
                              {activeAttendance[student1.id] === 'ABSENT'
                                ? 'غائب ✖'
                                : activeAttendance[student1.id] === 'LATE'
                                ? 'متأخر ⏱'
                                : activeAttendance[student1.id] === 'EXCUSED'
                                ? 'مبرر ℹ'
                                : 'حاضر ✔'}
                            </button>
                            <div className="flex items-center justify-between gap-1 mt-1">
                                  <button
                                    onClick={() => handleToggleBehavior(student1.id, 'disruptions')}
                                    className={`p-1 rounded cursor-pointer transition-colors ${
                                      activeSession?.disruptions?.includes(student1.id)
                                        ? 'bg-rose-500 text-white'
                                        : 'bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-600'
                                    }`}
                                    title="تسجيل حالة شغب"
                                  >
                                    <AlertTriangle className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleToggleBehavior(student1.id, 'unwrittenLessons')}
                                    className={`p-1 rounded cursor-pointer transition-colors ${
                                      activeSession?.unwrittenLessons?.includes(student1.id)
                                        ? 'bg-amber-500 text-white'
                                        : 'bg-slate-100 text-slate-500 hover:bg-amber-100 hover:text-amber-600'
                                    }`}
                                    title="لم يكتب الدرس"
                                  >
                                    <BookX className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleToggleBehavior(student1.id, 'poorParticipation')}
                                    className={`p-1 rounded cursor-pointer transition-colors ${
                                      activeSession?.poorParticipation?.includes(student1.id)
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-slate-100 text-slate-500 hover:bg-orange-100 hover:text-orange-600'
                                    }`}
                                    title="مشاركة سلبية / عدم الانتباه"
                                  >
                                    <UserMinus className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleToggleBehavior(student1.id, 'goodParticipation')}
                                    className={`p-1 rounded cursor-pointer transition-colors ${
                                      activeSession?.goodParticipation?.includes(student1.id)
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-600'
                                    }`}
                                    title="مشاركة ممتازة"
                                  >
                                    <Star className="w-3 h-3" />
                                  </button>
                            </div>
"""

new_buttons2 = new_buttons1.replace("student1", "student2")

content = re.sub(r'\{\/\*\s*Current Status Pill with quick cycle on click\s*\*\/\}\s*<button[\s\S]*?<\/button>', lambda m: new_buttons1 if 'student1' in m.group(0) else new_buttons2, content)

with open('components/AttendanceSanad.tsx', 'w') as f:
    f.write(content)
