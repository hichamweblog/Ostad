import re

with open('components/AttendanceSanad.tsx', 'r') as f:
    content = f.read()

# Replace Desktop Table interactive buttons block
desktop_buttons_pattern = r"\{/\* 4 Interactive Status Buttons \*/\}.*?\{/\* Behavioral Evaluation Buttons \*/\}.*?</button>\s*</div>\s*</td>"
new_desktop_buttons = """{/* Unified Attendance & Behavior Buttons */}
                            <td className="p-2 text-center">
                              <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                                <button
                                  onClick={() => handleSetStudentStatus(student.id, status === 'ABSENT' ? 'PRESENT' : 'ABSENT')}
                                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer border ${
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
                                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer border ${
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
                                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer border ${
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
                                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer border ${
                                    activeSession.goodParticipation?.includes(student.id)
                                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                                      : 'border-transparent text-slate-500 hover:text-emerald-600 hover:bg-white'
                                  }`}
                                  title="مشاركة إيجابية"
                                >
                                  مشاركة +
                                </button>
                              </div>
                            </td>"""

content = re.sub(desktop_buttons_pattern, new_desktop_buttons, content, flags=re.DOTALL)

# Delete stats display for late/excused and add total absences
content = re.sub(
    r"""<td className="p-3 text-center font-mono font-bold text-slate-700 bg-slate-50/50">\s*\{stats\.absent\}\s*</td>\s*<td className="p-3 text-center font-mono font-bold text-slate-700 bg-slate-50/50">\s*\{stats\.late\}\s*</td>\s*<td className="p-3 text-center font-bold">.*?</td>""",
    r"""<td className="p-3 text-center font-mono font-bold text-slate-700 bg-slate-50/50">
                              {stats.absent} غ
                            </td>
                            <td className="p-3 text-center font-bold">
                              <span className={`px-2 py-1 rounded text-xs ${estimatedImpact < 0 ? 'bg-rose-100 text-rose-700' : estimatedImpact > 0 ? 'bg-emerald-100 text-emerald-700' : 'text-emerald-600'}`}>
                                {estimatedImpact > 0 ? '+' : ''}{estimatedImpact.toFixed(2)}
                              </span>
                            </td>""",
    content,
    flags=re.DOTALL
)

with open('components/AttendanceSanad.tsx', 'w') as f:
    f.write(content)

