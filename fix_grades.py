import re

with open('components/GradesAndEvaluation.tsx', 'r') as f:
    content = f.read()

# Update calcAutoContinuousEval
old_calc = r"""  const calcAutoContinuousEval = \(studentId: string\): number => \{.*?return Number\(total\.toFixed\(2\)\);\s*?\};"""
new_calc = """  const calcAutoContinuousEval = (studentId: string): number => {
    const stats = studentStatsMap[studentId];
    if (!stats) return 20;

    const disruptDed = state.calendarSettings?.evaluationRules?.disruptionDeduction ?? 0.5;
    const unwrittenDed = state.calendarSettings?.evaluationRules?.unwrittenLessonDeduction ?? 0.5;
    const absentDed = state.calendarSettings?.evaluationRules?.unexcusedAbsenceDeduction ?? 0.5;
    
    // New simplified calculation: base 20, subtract penalties, add bonuses
    const penalties = (stats.disruptions * disruptDed) + (stats.unwritten * unwrittenDed) + (stats.absent * absentDed);
    const bonuses = (stats.goodPart * 0.5); // Fixed bonus per good participation
    
    const total = Math.min(20, Math.max(0, 20 - penalties + bonuses));
    return Number(total.toFixed(2));
  };"""

content = re.sub(old_calc, new_calc, content, flags=re.DOTALL)

with open('components/GradesAndEvaluation.tsx', 'w') as f:
    f.write(content)

