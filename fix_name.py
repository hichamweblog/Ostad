import re

with open('components/LogoEmblem.tsx', 'r') as f:
    content = f.read()

# Change it back to معين
old_text = r"""<span className="font-amiri text-lg">سند الأستاذ</span>"""
new_text = """<span className="font-amiri text-lg">معين الأستاذ</span>"""
content = re.sub(old_text, new_text, content)

with open('components/LogoEmblem.tsx', 'w') as f:
    f.write(content)

with open('app/layout.tsx', 'r') as f:
    layout_content = f.read()

layout_content = layout_content.replace('سند الأستاذ', 'معين الأستاذ')
with open('app/layout.tsx', 'w') as f:
    f.write(layout_content)
