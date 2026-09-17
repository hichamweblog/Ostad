import re

with open('components/AttendanceSanad.tsx', 'r') as f:
    content = f.read()

# 1. Update the studentStatsMap computation
old_stats = """  // Calculate cumulative stats per student in this class across all sessions
  const studentStatsMap: Record<string, { absent: number; late: number; excused: number }> = {};
  for (const s of classStudents) {
    studentStatsMap[s.id] = { absent: 0, late: 0, excused: 0 };
  }
  for (const session of classSessions) {
    if (!session.attendance) continue;
    for (const [studentId, status] of Object.entries(session.attendance)) {
      if (!studentStatsMap[studentId]) studentStatsMap[studentId] = { absent: 0, late: 0, excused: 0 };
      if (status === 'ABSENT') studentStatsMap[studentId].absent++;
      else if (status === 'LATE') studentStatsMap[studentId].late++;
      else if (status === 'EXCUSED') studentStatsMap[studentId].excused++;
    }
  }"""

new_stats = """  // Calculate cumulative stats per student in this class across all sessions
  const studentStatsMap: Record<string, { absent: number; unwrittenLessons: number; disruptions: number; goodParticipation: number }> = {};
  for (const s of classStudents) {
    studentStatsMap[s.id] = { absent: 0, unwrittenLessons: 0, disruptions: 0, goodParticipation: 0 };
  }
  for (const session of classSessions) {
    if (session.attendance) {
      for (const [studentId, status] of Object.entries(session.attendance)) {
        if (!studentStatsMap[studentId]) studentStatsMap[studentId] = { absent: 0, unwrittenLessons: 0, disruptions: 0, goodParticipation: 0 };
        if (status === 'ABSENT') studentStatsMap[studentId].absent++;
      }
    }
    if (session.unwrittenLessons) {
      for (const studentId of session.unwrittenLessons) {
        if (!studentStatsMap[studentId]) studentStatsMap[studentId] = { absent: 0, unwrittenLessons: 0, disruptions: 0, goodParticipation: 0 };
        studentStatsMap[studentId].unwrittenLessons++;
      }
    }
    if (session.disruptions) {
      for (const studentId of session.disruptions) {
        if (!studentStatsMap[studentId]) studentStatsMap[studentId] = { absent: 0, unwrittenLessons: 0, disruptions: 0, goodParticipation: 0 };
        studentStatsMap[studentId].disruptions++;
      }
    }
    if (session.goodParticipation) {
      for (const studentId of session.goodParticipation) {
        if (!studentStatsMap[studentId]) studentStatsMap[studentId] = { absent: 0, unwrittenLessons: 0, disruptions: 0, goodParticipation: 0 };
        studentStatsMap[studentId].goodParticipation++;
      }
    }
  }"""

content = content.replace(old_stats, new_stats)

# 2. Update Table Headers
old_headers = """                        <th className="p-3 text-center">حالة الحصة الحالية</th>
                        <th className="p-3 text-center">التقويم السلوكي</th>
                        <th className="p-3 text-center">مجموع الغيابات</th>
                        <th className="p-3 text-center">مجموع التأخرات</th>
                        <th className="p-3 text-center">أثر التقويم المقدر</th>"""

new_headers = """                        <th className="p-3 text-center">حالة الحصة والتقويم السلوكي</th>
                        <th className="p-3 text-center">مجموع الغيابات</th>
                        <th className="p-3 text-center">أثر التقويم المقدر</th>"""

content = content.replace(old_headers, new_headers)

# 3. Update Deductions logic in Mobile block
content = re.sub(
    r"const stats = studentStatsMap\[student.id\] \|\| \{ absent: 0, late: 0, excused: 0 \};\s*const unexcusedDeduction = [^\n]+\s*const lateDeduction = [^\n]+\s*const totalDeduction = Math.min\(unexcusedDeduction \+ lateDeduction, 20\);",
    r"""const stats = studentStatsMap[student.id] || { absent: 0, unwrittenLessons: 0, disruptions: 0, goodParticipation: 0 };
                  const deductionPoints = (stats.absent * 0.5) + (stats.unwrittenLessons * 0.5) + (stats.disruptions * 0.5);
                  const bonusPoints = stats.goodParticipation * 0.5;
                  const estimatedImpact = bonusPoints - deductionPoints;""",
    content
)

# 4. Update the actual Table body deduction variables
# 5. Combine interactive buttons into one column
# Note: Since there are many parts to replace, I will use regular expressions to carefully replace the UI parts

with open('components/AttendanceSanad.tsx', 'w') as f:
    f.write(content)

