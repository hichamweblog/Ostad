import re

with open('components/AttendanceSanad.tsx', 'r') as f:
    content = f.read()

content = re.sub(r"(teacherNotes: ''\n\s*)}", r"\1, attendance: {}}", content)

with open('components/AttendanceSanad.tsx', 'w') as f:
    f.write(content)
