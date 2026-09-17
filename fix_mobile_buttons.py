import re

with open('components/AttendanceSanad.tsx', 'r') as f:
    content = f.read()

# I will replace from `{/* 4 Status Segmented Buttons (100% width, No Scrolling, Touch-friendly) */}` 
# all the way down to `</div>\n                    </div>\n                  );`

old_mobile_block = r"\{/\* 4 Status Segmented Buttons \(100% width, No Scrolling, Touch-friendly\) \*/\}.*?\{/\* 4 Behavioral Segments \(Mobile\) \*/\}.*?</button>\s*</div>"
new_mobile_block = """{/* Unified Attendance & Behavior Buttons (Mobile) */}
                      <div className="grid grid-cols-4 gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                                <button
                                  onClick={() => handleSetStudentStatus(student.id, status === 'ABSENT' ? 'PRESENT' : 'ABSENT')}
                                  className={`py-1.5 rounded-lg font-bold text-[10px] transition-all cursor-pointer border ${
                                    status === 'ABSENT'
                                      ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                                      : 'border-transparent text-slate-500 hover:text-rose-600 hover:bg-white'
                                  }`}
                                  title="تسجيل غياب"
                                >
                                  الغياب -
                                </button>
                                <button
                                  onClick={() => handleToggleBehavior(student.id, 'unwrittenLessons')}
                                  className={`py-1.5 rounded-lg font-bold text-[10px] transition-all cursor-pointer border ${
                                    activeSession.unwrittenLessons?.includes(student.id)
                                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                      : 'border-transparent text-slate-500 hover:text-amber-600 hover:bg-white'
                                  }`}
                                  title="لم يكتب الدرس"
                                >
                                  الكراس -
                                </button>
                                <button
                                  onClick={() => handleToggleBehavior(student.id, 'disruptions')}
                                  className={`py-1.5 rounded-lg font-bold text-[10px] transition-all cursor-pointer border ${
                                    activeSession.disruptions?.includes(student.id)
                                      ? 'bg-[#0D2C3B] text-white border-[#0D2C3B] shadow-xs'
                                      : 'border-transparent text-slate-500 hover:text-[#0D2C3B] hover:bg-white'
                                  }`}
                                  title="شغب وسلوك سيء"
                                >
                                  شغب -
                                </button>
                                <button
                                  onClick={() => handleToggleBehavior(student.id, 'goodParticipation')}
                                  className={`py-1.5 rounded-lg font-bold text-[10px] transition-all cursor-pointer border ${
                                    activeSession.goodParticipation?.includes(student.id)
                                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                                      : 'border-transparent text-slate-500 hover:text-emerald-600 hover:bg-white'
                                  }`}
                                  title="مشاركة إيجابية"
                                >
                                  مشاركة +
                                </button>
                      </div>"""

content = re.sub(old_mobile_block, new_mobile_block, content, flags=re.DOTALL)

with open('components/AttendanceSanad.tsx', 'w') as f:
    f.write(content)

