import re

with open('components/AttendanceSanad.tsx', 'r') as f:
    content = f.read()

# 1. Update the variables
old_vars = r"""// Active session stats\s*const activeAttendance = activeSession\?\.attendance \|\| \{\};\s*const presentCount = Object\.values\(activeAttendance\)\.filter\(v => v === 'PRESENT'\)\.length;\s*const absentCount = Object\.values\(activeAttendance\)\.filter\(v => v === 'ABSENT'\)\.length;\s*const lateCount = Object\.values\(activeAttendance\)\.filter\(v => v === 'LATE'\)\.length;\s*const excusedCount = Object\.values\(activeAttendance\)\.filter\(v => v === 'EXCUSED'\)\.length;"""
new_vars = """// Active session stats
  const activeAttendance = activeSession?.attendance || {};
  const absentCount = Object.values(activeAttendance).filter(v => v === 'ABSENT').length;
  // الحضور = إجمالي التلاميذ - عدد الغائبين
  const presentCount = classStudents.length - absentCount;"""
content = re.sub(old_vars, new_vars, content)

# 2. Update the Export Doc stats
old_doc_stats = r"""<div style="margin-top: 12px; padding: 8px; border: 1px solid #94a3b8; background-color: #f8fafc; font-size: 9.5pt;">\s*<b>إحصاء الحصة:</b> تعداد الفوج: <b>\$\{classStudents\.length\}</b> تلميذ &nbsp;\|&nbsp;\s*الحاضرون: <b style="color: #16a34a;">\$\{presentCount\}</b> &nbsp;\|&nbsp;\s*الغائبون: <b style="color: #dc2626;">\$\{absentCount\}</b> &nbsp;\|&nbsp;\s*المتأخرون: <b style="color: #d97706;">\$\{lateCount\}</b> &nbsp;\|&nbsp;\s*المبررون: <b style="color: #2563eb;">\$\{excusedCount\}</b>\s*</div>"""
new_doc_stats = """<div style="margin-top: 12px; padding: 8px; border: 1px solid #94a3b8; background-color: #f8fafc; font-size: 9.5pt;">
          <b>إحصاء الحصة:</b> تعداد الفوج: <b>${classStudents.length}</b> تلميذ &nbsp;|&nbsp; 
          الحاضرون: <b style="color: #16a34a;">${presentCount}</b> &nbsp;|&nbsp; 
          الغائبون: <b style="color: #dc2626;">${absentCount}</b>
        </div>"""
content = re.sub(old_doc_stats, new_doc_stats, content)

# 3. Update the UI
old_ui_stats = r"""\{/\* Quick Session Stats \*/\}\s*<div className="grid grid-cols-4 sm:flex items-center gap-1.5 sm:gap-2 text-xs w-full sm:w-auto">.*?</div>\s*</div>\s*</div>"""
new_ui_stats = """{/* Quick Session Stats */}
            <div className="grid grid-cols-2 sm:flex items-center gap-1.5 sm:gap-2 text-xs w-full sm:w-auto">
              <div className="text-center sm:text-right px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                <span className="sm:hidden block text-[10px] text-emerald-700">حاضر</span>
                <span className="hidden sm:inline">حاضر: </span>
                <span>{presentCount}</span>
              </div>
              <div className="text-center sm:text-right px-2 py-1 rounded-lg bg-rose-50 text-rose-800 font-bold border border-rose-200">
                <span className="sm:hidden block text-[10px] text-rose-700">غائب</span>
                <span className="hidden sm:inline">غائب: </span>
                <span>{absentCount}</span>
              </div>
            </div>
          </div>"""
content = re.sub(old_ui_stats, new_ui_stats, content, flags=re.DOTALL)

with open('components/AttendanceSanad.tsx', 'w') as f:
    f.write(content)

