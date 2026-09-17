with open('components/AttendanceSanad.tsx', 'r') as f:
    content = f.read()

content = content.replace("""          return {
            ...ses,
            ),
              [studentId]: status
            }
          };""", """          return {
            ...ses,
            attendance: {
              ...(ses.attendance || {}),
              [studentId]: status
            }
          };""")

with open('components/AttendanceSanad.tsx', 'w') as f:
    f.write(content)

