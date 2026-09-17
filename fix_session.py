import re
with open('components/SessionCahier.tsx', 'r') as f:
    content = f.read()

content = re.sub(r"(memoryNextTimeChange)(\n\s*};)", r"\1,\n      attendance: {}\2", content)

with open('components/SessionCahier.tsx', 'w') as f:
    f.write(content)
