import re

with open('components/SettingsSanad.tsx', 'r') as f:
    content = f.read()

# Make sure we clean up the actual wording and remove late settings
content = re.sub(
    r"""<div>\s*<label className="block font-bold text-slate-700 mb-1">\s*خصم التأخر الواحد \(نقاط\):\s*</label>\s*<input\s*type="number"[\s\S]*?/>\s*</div>""",
    "",
    content
)

# And remove "والتأخرات" from title and desc
content = content.replace("2. الغيابات والتأخرات", "2. الغيابات")
content = content.replace("الغيابات والتأخرات (5)", "الغيابات (5)")
content = content.replace("في حالة الغياب غير المبرر أو التأخر يُخصم آلياً.", "في حالة الغياب غير المبرر يُخصم آلياً.")

# Remove poor participation completely
content = re.sub(
    r"""<div>\s*<label className="block font-bold text-slate-700 mb-1">\s*خصم ضعف المشاركة الواحد \(نقاط\):\s*</label>\s*<input\s*type="number"[\s\S]*?/>\s*</div>""",
    "",
    content
)

with open('components/SettingsSanad.tsx', 'w') as f:
    f.write(content)

