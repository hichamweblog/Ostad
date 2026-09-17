import re

with open('components/AttendanceSanad.tsx', 'r') as f:
    content = f.read()

# Fix 1: line 629 and 635 'stats.late' in Mobile View card footer
content = re.sub(r"\{stats\.late\}\s*ت\s*\|\s*\{stats\.excused\}\s*م", r"شغب: {stats.disruptions} | كراس: {stats.unwrittenLessons}", content)
content = re.sub(r"\{stats\.late\}\s*ت", r"شغب: {stats.disruptions} | كراس: {stats.unwrittenLessons}", content) # just in case

# Fix 2: totalDeduction in Mobile view
content = re.sub(r"\{totalDeduction > 0 \? '\-' : ''\}\{totalDeduction\.toFixed\(2\)\}", r"{estimatedImpact > 0 ? '+' : ''}{estimatedImpact.toFixed(2)}", content)
content = re.sub(r"totalDeduction > 0 \? 'bg-rose-100 text-rose-700' : 'text-emerald-600'", r"estimatedImpact < 0 ? 'bg-rose-100 text-rose-700' : estimatedImpact > 0 ? 'bg-emerald-100 text-emerald-700' : 'text-emerald-600'", content)

# Fix 3: any remaining totalDeduction
content = content.replace("totalDeduction", "estimatedImpact")

with open('components/AttendanceSanad.tsx', 'w') as f:
    f.write(content)

