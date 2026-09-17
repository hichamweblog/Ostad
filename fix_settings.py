import re

with open('components/SettingsSanad.tsx', 'r') as f:
    content = f.read()

# Update settings UI to remove 'تأخر' and 'مشاركة سلبية / عدم الانتباه' and update default settings logic to match our exact deductions.
old_settings = r"""<div className="grid sm:grid-cols-2 gap-4">\s*<div>\s*<label className="block text-xs font-bold text-slate-700 mb-1\.5">خصم الغياب غير المبرر</label>\s*<input\s*type="number"\s*step="0\.5"\s*min="0"\s*value=\{localSettings\.evaluationRules\?\.unexcusedAbsenceDeduction \|\| 0\}\s*onChange=\{\(e\) => handleEvaluationRulesChange\('unexcusedAbsenceDeduction', Number\(e\.target\.value\)\)\}\s*className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"\s*/>\s*</div>\s*<div>\s*<label className="block text-xs font-bold text-slate-700 mb-1\.5">خصم التأخر</label>\s*<input\s*type="number"\s*step="0\.5"\s*min="0"\s*value=\{localSettings\.evaluationRules\?\.lateDeduction \|\| 0\}\s*onChange=\{\(e\) => handleEvaluationRulesChange\('lateDeduction', Number\(e\.target\.value\)\)\}\s*className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"\s*/>\s*</div>\s*</div>\s*<div className="grid sm:grid-cols-3 gap-4">\s*<div>\s*<label className="block text-xs font-bold text-slate-700 mb-1\.5">خصم الشغب والسلوك</label>\s*<input\s*type="number"\s*step="0\.5"\s*min="0"\s*value=\{localSettings\.evaluationRules\?\.disruptionDeduction \|\| 0\}\s*onChange=\{\(e\) => handleEvaluationRulesChange\('disruptionDeduction', Number\(e\.target\.value\)\)\}\s*className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"\s*/>\s*</div>\s*<div>\s*<label className="block text-xs font-bold text-slate-700 mb-1\.5">خصم إهمال الكراس</label>\s*<input\s*type="number"\s*step="0\.5"\s*min="0"\s*value=\{localSettings\.evaluationRules\?\.unwrittenLessonDeduction \|\| 0\}\s*onChange=\{\(e\) => handleEvaluationRulesChange\('unwrittenLessonDeduction', Number\(e\.target\.value\)\)\}\s*className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"\s*/>\s*</div>\s*<div>\s*<label className="block text-xs font-bold text-slate-700 mb-1\.5">خصم ضعف المشاركة</label>\s*<input\s*type="number"\s*step="0\.5"\s*min="0"\s*value=\{localSettings\.evaluationRules\?\.lackOfParticipationDeduction \|\| 0\}\s*onChange=\{\(e\) => handleEvaluationRulesChange\('lackOfParticipationDeduction', Number\(e\.target\.value\)\)\}\s*className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"\s*/>\s*</div>\s*</div>"""

new_settings = """<div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">خصم الغياب (-)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={localSettings.evaluationRules?.unexcusedAbsenceDeduction || 0.5}
                      onChange={(e) => handleEvaluationRulesChange('unexcusedAbsenceDeduction', Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">بونص المشاركة الإيجابية (+)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={localSettings.evaluationRules?.goodParticipationBonus || 0.5}
                      onChange={(e) => handleEvaluationRulesChange('goodParticipationBonus', Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">خصم الشغب (-)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={localSettings.evaluationRules?.disruptionDeduction || 0.5}
                      onChange={(e) => handleEvaluationRulesChange('disruptionDeduction', Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">خصم بدون كراس (-)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={localSettings.evaluationRules?.unwrittenLessonDeduction || 0.5}
                      onChange={(e) => handleEvaluationRulesChange('unwrittenLessonDeduction', Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>"""

content = re.sub(old_settings, new_settings, content)

with open('components/SettingsSanad.tsx', 'w') as f:
    f.write(content)

