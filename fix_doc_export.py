import re

with open('components/AttendanceSanad.tsx', 'r') as f:
    content = f.read()

# Update Word Doc Export logic
old_doc = r"const statsText = `غ: \$\{stats\.absent\} \| ت: \$\{stats\.late\}`;.*?<tr>.*?</tr>"
new_doc = """const statsText = `غ: ${stats.absent} | شغب: ${stats.disruptions} | كراس: ${stats.unwrittenLessons}`;
          
          return `
            <tr>
              <td style="border: 1px solid #d5dfdc; padding: 6px; text-align: center;">${student.numberInList}</td>
              <td style="border: 1px solid #d5dfdc; padding: 6px;"><b>${student.fullName}</b></td>
              <td style="border: 1px solid #d5dfdc; padding: 6px; text-align: center;">${statusLabel}</td>
              <td style="border: 1px solid #d5dfdc; padding: 6px;">${behaviorParts.join('، ') || '-'}</td>
              <td style="border: 1px solid #d5dfdc; padding: 6px; text-align: center; direction: ltr;">${statsText}</td>
            </tr>
          `;"""

content = re.sub(old_doc, new_doc, content, flags=re.DOTALL)

with open('components/AttendanceSanad.tsx', 'w') as f:
    f.write(content)

