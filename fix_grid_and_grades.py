import re

with open('components/AttendanceSanad.tsx', 'r') as f:
    content = f.read()

# 1. Remove poorParticipation button from Seating Plan for Student 1
old_poor1 = r"""<button\s*onClick=\{\(\) => handleToggleBehavior\(student1\.id, 'poorParticipation'\)\}\s*className=\{`p-1 rounded cursor-pointer transition-colors \$\{\s*activeSession\?\.poorParticipation\?\.includes\(student1\.id\)\s*\? 'bg-orange-500 text-white'\s*: 'bg-slate-100 text-slate-500 hover:bg-orange-100 hover:text-orange-600'\s*\}\`\}\s*title="مشاركة سلبية / عدم الانتباه"\s*>\s*<UserMinus className="w-3 h-3" />\s*</button>"""
content = re.sub(old_poor1, "", content)

# 2. Remove poorParticipation button from Seating Plan for Student 2
old_poor2 = r"""<button\s*onClick=\{\(\) => handleToggleBehavior\(student2\.id, 'poorParticipation'\)\}\s*className=\{`p-1 rounded cursor-pointer transition-colors \$\{\s*activeSession\?\.poorParticipation\?\.includes\(student2\.id\)\s*\? 'bg-orange-500 text-white'\s*: 'bg-slate-100 text-slate-500 hover:bg-orange-100 hover:text-orange-600'\s*\}\`\}\s*title="مشاركة سلبية / عدم الانتباه"\s*>\s*<UserMinus className="w-3 h-3" />\s*</button>"""
content = re.sub(old_poor2, "", content)

# 3. Change icon tooltips or contents in Seating plan to match text (الكراس - , شغب - , مشاركة +)
# For student 1
content = content.replace('title="تسجيل حالة شغب"', 'title="شغب وسلوك سيء"')
content = content.replace('title="لم يكتب الدرس"', 'title="لم يكتب الدرس / الكراس"')
content = content.replace('title="مشاركة ممتازة"', 'title="مشاركة إيجابية"')

# Also let's just make the text identical to the mobile view instead of icons, as requested
# "حالة الحصة والتقويم السلوكي الكراس شغب مشاركة احذف أيقونة مشاركة سلبية في مخطط الجلوس نفس الأيقونات أيضا غائب أو حاضر"
# Wait, user said "نفس الأيقونات" - meaning he wants the same buttons (Text + symbols) as in the List view.
# Currently List view uses Text: `الغياب -`, `الكراس -`, `شغب -`, `مشاركة +`.

student1_buttons = r"""<div className="flex items-center justify-between gap-1 mt-1">\s*<button\s*onClick=\{\(\) => handleToggleBehavior\(student1\.id, 'disruptions'\)\}\s*className=\{`p-1 rounded cursor-pointer transition-colors \$\{\s*activeSession\?\.disruptions\?\.includes\(student1\.id\)\s*\? 'bg-rose-500 text-white'\s*: 'bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-600'\s*\}\`\}\s*title="شغب وسلوك سيء"\s*>\s*<AlertTriangle className="w-3 h-3" />\s*</button>\s*<button\s*onClick=\{\(\) => handleToggleBehavior\(student1\.id, 'unwrittenLessons'\)\}\s*className=\{`p-1 rounded cursor-pointer transition-colors \$\{\s*activeSession\?\.unwrittenLessons\?\.includes\(student1\.id\)\s*\? 'bg-amber-500 text-white'\s*: 'bg-slate-100 text-slate-500 hover:bg-amber-100 hover:text-amber-600'\s*\}\`\}\s*title="لم يكتب الدرس / الكراس"\s*>\s*<BookX className="w-3 h-3" />\s*</button>\s*<button\s*onClick=\{\(\) => handleToggleBehavior\(student1\.id, 'goodParticipation'\)\}\s*className=\{`p-1 rounded cursor-pointer transition-colors \$\{\s*activeSession\?\.goodParticipation\?\.includes\(student1\.id\)\s*\? 'bg-emerald-500 text-white'\s*: 'bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-600'\s*\}\`\}\s*title="مشاركة إيجابية"\s*>\s*<Star className="w-3 h-3" />\s*</button>\s*</div>"""

new_student1_buttons = """<div className="flex items-center justify-between gap-1 mt-1">
                                  <button
                                    onClick={() => handleToggleBehavior(student1.id, 'unwrittenLessons')}
                                    className={`flex-1 py-1 px-1 rounded cursor-pointer font-bold text-[9px] transition-colors border ${
                                      activeSession?.unwrittenLessons?.includes(student1.id)
                                        ? 'bg-amber-500 text-white border-amber-600'
                                        : 'bg-slate-50 text-slate-500 hover:bg-white border-transparent'
                                    }`}
                                    title="لم يكتب الدرس"
                                  >
                                    الكراس -
                                  </button>
                                  <button
                                    onClick={() => handleToggleBehavior(student1.id, 'disruptions')}
                                    className={`flex-1 py-1 px-1 rounded cursor-pointer font-bold text-[9px] transition-colors border ${
                                      activeSession?.disruptions?.includes(student1.id)
                                        ? 'bg-[#0D2C3B] text-white border-[#0D2C3B]'
                                        : 'bg-slate-50 text-slate-500 hover:bg-white border-transparent'
                                    }`}
                                    title="شغب وسلوك سيء"
                                  >
                                    شغب -
                                  </button>
                                  <button
                                    onClick={() => handleToggleBehavior(student1.id, 'goodParticipation')}
                                    className={`flex-1 py-1 px-1 rounded cursor-pointer font-bold text-[9px] transition-colors border ${
                                      activeSession?.goodParticipation?.includes(student1.id)
                                        ? 'bg-emerald-500 text-white border-emerald-600'
                                        : 'bg-slate-50 text-slate-500 hover:bg-white border-transparent'
                                    }`}
                                    title="مشاركة إيجابية"
                                  >
                                    مشاركة +
                                  </button>
                            </div>"""

content = re.sub(student1_buttons, new_student1_buttons, content)


student2_buttons = r"""<div className="flex items-center justify-between gap-1 mt-1">\s*<button\s*onClick=\{\(\) => handleToggleBehavior\(student2\.id, 'disruptions'\)\}\s*className=\{`p-1 rounded cursor-pointer transition-colors \$\{\s*activeSession\?\.disruptions\?\.includes\(student2\.id\)\s*\? 'bg-rose-500 text-white'\s*: 'bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-600'\s*\}\`\}\s*title="شغب وسلوك سيء"\s*>\s*<AlertTriangle className="w-3 h-3" />\s*</button>\s*<button\s*onClick=\{\(\) => handleToggleBehavior\(student2\.id, 'unwrittenLessons'\)\}\s*className=\{`p-1 rounded cursor-pointer transition-colors \$\{\s*activeSession\?\.unwrittenLessons\?\.includes\(student2\.id\)\s*\? 'bg-amber-500 text-white'\s*: 'bg-slate-100 text-slate-500 hover:bg-amber-100 hover:text-amber-600'\s*\}\`\}\s*title="لم يكتب الدرس / الكراس"\s*>\s*<BookX className="w-3 h-3" />\s*</button>\s*<button\s*onClick=\{\(\) => handleToggleBehavior\(student2\.id, 'goodParticipation'\)\}\s*className=\{`p-1 rounded cursor-pointer transition-colors \$\{\s*activeSession\?\.goodParticipation\?\.includes\(student2\.id\)\s*\? 'bg-emerald-500 text-white'\s*: 'bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-600'\s*\}\`\}\s*title="مشاركة إيجابية"\s*>\s*<Star className="w-3 h-3" />\s*</button>\s*</div>"""

new_student2_buttons = """<div className="flex items-center justify-between gap-1 mt-1">
                                  <button
                                    onClick={() => handleToggleBehavior(student2.id, 'unwrittenLessons')}
                                    className={`flex-1 py-1 px-1 rounded cursor-pointer font-bold text-[9px] transition-colors border ${
                                      activeSession?.unwrittenLessons?.includes(student2.id)
                                        ? 'bg-amber-500 text-white border-amber-600'
                                        : 'bg-slate-50 text-slate-500 hover:bg-white border-transparent'
                                    }`}
                                    title="لم يكتب الدرس"
                                  >
                                    الكراس -
                                  </button>
                                  <button
                                    onClick={() => handleToggleBehavior(student2.id, 'disruptions')}
                                    className={`flex-1 py-1 px-1 rounded cursor-pointer font-bold text-[9px] transition-colors border ${
                                      activeSession?.disruptions?.includes(student2.id)
                                        ? 'bg-[#0D2C3B] text-white border-[#0D2C3B]'
                                        : 'bg-slate-50 text-slate-500 hover:bg-white border-transparent'
                                    }`}
                                    title="شغب وسلوك سيء"
                                  >
                                    شغب -
                                  </button>
                                  <button
                                    onClick={() => handleToggleBehavior(student2.id, 'goodParticipation')}
                                    className={`flex-1 py-1 px-1 rounded cursor-pointer font-bold text-[9px] transition-colors border ${
                                      activeSession?.goodParticipation?.includes(student2.id)
                                        ? 'bg-emerald-500 text-white border-emerald-600'
                                        : 'bg-slate-50 text-slate-500 hover:bg-white border-transparent'
                                    }`}
                                    title="مشاركة إيجابية"
                                  >
                                    مشاركة +
                                  </button>
                            </div>"""

content = re.sub(student2_buttons, new_student2_buttons, content)

with open('components/AttendanceSanad.tsx', 'w') as f:
    f.write(content)

