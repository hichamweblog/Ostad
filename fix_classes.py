with open('components/ClassesManager.tsx', 'r') as f:
    content = f.read()

target = "id: `std-${selectedClassId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,\n          classId: targetClassId,"
replacement = "id: `std-${selectedClassId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,\n          classId: selectedClassId,"
content = content.replace(target, replacement)

target2 = "classId: targetClassId,"
replacement2 = "classId: selectedClassId,"
content = content.replace(target2, replacement2)

with open('components/ClassesManager.tsx', 'w') as f:
    f.write(content)
