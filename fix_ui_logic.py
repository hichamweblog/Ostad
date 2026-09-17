import re

with open('components/AttendanceSanad.tsx', 'r') as f:
    content = f.read()

# Fix headers
old_headers = r"""<th className="p-3 w-14 text-center">الرقم</th>\s*<th className="p-3">اسم ولقب التلميذ</th>\s*<th className="p-3 text-center">حالة الحصة والتقويم السلوكي</th>\s*<th className="p-3 text-center">مجموع الغيابات</th>\s*<th className="p-3 text-center">أثر التقويم المقدر</th>"""
new_headers = """<th className="p-3 w-14 text-center">الرقم</th>
                        <th className="p-3">اسم ولقب التلميذ</th>
                        <th className="p-3 text-center">حالة الحصة والتقويم السلوكي</th>
                        <th className="p-3 text-center">مجموع الغيابات</th>
                        <th className="p-3 text-center">مجموع السلوك</th>
                        <th className="p-3 text-center">أثر التقويم المقدر</th>"""
content = re.sub(old_headers, new_headers, content)

# Fix estimatedImpact rendering in Desktop view
old_impact_td = r"""<td className="p-3 text-center font-bold font-mono">\s*\{estimatedImpact > 0 \? \(\s*<span className="text-rose-600 font-bold">-\{estimatedImpact\.toFixed\(2\)\} ن</span>\s*\) : \(\s*<span className="text-emerald-600">0\.00</span>\s*\)\}\s*</td>"""
new_impact_td = """<td className="p-3 text-center font-bold font-mono text-sm border-r border-slate-100 bg-slate-50/50">
                              {estimatedImpact > 0 ? (
                                <span className="text-emerald-600 font-bold">+{estimatedImpact.toFixed(2)} ن</span>
                              ) : estimatedImpact < 0 ? (
                                <span className="text-rose-600 font-bold">{estimatedImpact.toFixed(2)} ن</span>
                              ) : (
                                <span className="text-slate-400">0.00</span>
                              )}
                            </td>"""
content = re.sub(old_impact_td, new_impact_td, content)

# Also fix estimatedImpact in mobile view
old_mobile_impact = r"""\{estimatedImpact > 0 && \(\s*<span className="text-[10px] text-rose-600 font-semibold">\s*\(\-\{estimatedImpact\.toFixed\(1\)\}\)\s*</span>\s*\)\}"""
new_mobile_impact = """{estimatedImpact !== 0 && (
                            <span className={`text-[10px] font-semibold ${estimatedImpact > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              ({estimatedImpact > 0 ? '+' : ''}{estimatedImpact.toFixed(1)} ن)
                            </span>
                          )}"""
# Escape brackets in python string if needed, or use replace
content = content.replace(
    "{estimatedImpact > 0 && (\n                            <span className=\"text-[10px] text-rose-600 font-semibold\">\n                              (-{estimatedImpact.toFixed(1)})\n                            </span>\n                          )}",
    "{estimatedImpact !== 0 && (\n                            <span className={`text-[10px] font-semibold ${estimatedImpact > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>\n                              ({estimatedImpact > 0 ? '+' : ''}{estimatedImpact.toFixed(2)})\n                            </span>\n                          )}"
)
# Let's write a safer replace for mobile impact:
old_mobile_impact_2 = r"\{estimatedImpact > 0 && \([\s\S]*?\)\}"
new_mobile_impact_2 = """{estimatedImpact !== 0 && (
                            <span className={`text-[11px] font-bold ${estimatedImpact > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              ({estimatedImpact > 0 ? '+' : ''}{estimatedImpact.toFixed(2)} ن)
                            </span>
                          )}"""
# Apply regex replacement for the first occurrence in mobile view
# It matches `{estimatedImpact > 0 && (...)}`
import re
# actually, it's safer to just replace all `{estimatedImpact > 0 && ( <span... )}`
content = re.sub(r"\{estimatedImpact > 0 && \(\s*<span className=\"text-\[10px\] text-rose-600 font-semibold\">\s*\(\-\{estimatedImpact\.toFixed\(1\)\}\)\s*</span>\s*\)\}", new_mobile_impact_2, content)


with open('components/AttendanceSanad.tsx', 'w') as f:
    f.write(content)

