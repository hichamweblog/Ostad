with open('components/SessionCahier.tsx', 'r') as f:
    content = f.read()

content = content.replace("memoryNextTimeChange\n    };", "memoryNextTimeChange,\n      attendance: {}\n    };")

with open('components/SessionCahier.tsx', 'w') as f:
    f.write(content)
