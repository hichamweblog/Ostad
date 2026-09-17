import re
with open('components/Dashboard.tsx', 'r') as f:
    content = f.read()

target = """          <div className="text-2xl sm:text-3xl font-black text-[#0F172A] font-display mt-2">
            {state.students.length}
          </div>"""

replacement = """          <div className="text-2xl sm:text-3xl font-black text-[#0F172A] font-display mt-2">
            {state.students.length === 0 && state.classes.length === 0 ? "0" : state.students.length}
          </div>"""

content = content.replace(target, replacement)

with open('components/Dashboard.tsx', 'w') as f:
    f.write(content)
