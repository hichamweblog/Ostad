import re
with open('components/SessionCahier.tsx', 'r') as f:
    content = f.read()

# Fix the variable declarations
content = re.sub(r"const \[memoryNextTimeChange, attendance: \{\}([^\]]*)\]", r"const [memoryNextTimeChange\1]", content)

# Remove all bad replacements first
content = content.replace("memoryNextTimeChange, attendance: {}", "memoryNextTimeChange")

# Then only replace in the object creation
content = content.replace("memoryNextTimeChange\n    };", "memoryNextTimeChange,\n      attendance: {}\n    };")
content = content.replace("memoryNextTimeChange,\n    };", "memoryNextTimeChange,\n      attendance: {}\n    };")

with open('components/SessionCahier.tsx', 'w') as f:
    f.write(content)
