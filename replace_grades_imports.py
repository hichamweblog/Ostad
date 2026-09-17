with open('components/GradesAndEvaluation.tsx', 'r') as f:
    content = f.read()

target = "import { calculateStudentAverage } from '@/lib/grade-calculator';"
replacement = """import { calculateStudentAverage } from '@/lib/grade-calculator';
import { injectGradesIntoFile } from '@/lib/excel-sync';"""

content = content.replace(target, replacement)

with open('components/GradesAndEvaluation.tsx', 'w') as f:
    f.write(content)
