import re

with open('lib/types.ts', 'r') as f:
    content = f.read()

# re-insert attendance: { [studentId: string]: AttendanceStatus };
if 'attendance:' not in content:
    content = content.replace('memoryNextTimeChange?: string; // ما الذي يجب تغييره للمرة القادمة؟', 
                              'memoryNextTimeChange?: string; // ما الذي يجب تغييره للمرة القادمة؟\n  attendance: { [studentId: string]: AttendanceStatus };\n  type?: string;')
    with open('lib/types.ts', 'w') as f:
        f.write(content)
