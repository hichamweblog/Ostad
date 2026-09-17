with open('lib/storage.ts', 'r') as f:
    content = f.read()

content = content.replace("memoryNextTimeChange: 'البدء مباشرة بالنشاط المقارن وتخصيص 10 دقائق للتطبيق الكتابي.',\n    }", "memoryNextTimeChange: 'البدء مباشرة بالنشاط المقارن وتخصيص 10 دقائق للتطبيق الكتابي.',\n    attendance: {}\n    }")

with open('lib/storage.ts', 'w') as f:
    f.write(content)
