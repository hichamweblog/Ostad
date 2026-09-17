with open('components/ClassesManager.tsx', 'r') as f:
    content = f.read()

target = """  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsedData = await parseDigitizationFile(file);
      
      onUpdateState(prev => {
        let classToUpdate = prev.classes.find(c => c.id === selectedClassId);"""

replacement = """  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsedData = await parseDigitizationFile(file);
      
      onUpdateState(prev => {
        // If no class is selected but we have classes, use the active one or the first one
        let targetClassId = selectedClassId;
        if (!targetClassId) {
            targetClassId = prev.activeClassId || (prev.classes.length > 0 ? prev.classes[0].id : '');
        }

        let classToUpdate = prev.classes.find(c => c.id === targetClassId);
        
        // If we still don't have a class, we need to create one first based on the file!
        if (!classToUpdate) {
            targetClassId = `cls-${Date.now()}`;
            classToUpdate = {
                id: targetClassId,
                name: parsedData.className,
                level: parsedData.level,
                stream: parsedData.stream,
                color: 'emerald'
            };
            prev.classes.push(classToUpdate);
            prev.activeClassId = targetClassId;
        }"""

if target in content:
    content = content.replace(target, replacement)
    
    # Also need to fix selectedClassId references below in the function
    target2 = "const existingStudents = prev.students.filter(s => s.classId === selectedClassId);"
    replacement2 = "const existingStudents = prev.students.filter(s => s.classId === targetClassId);"
    content = content.replace(target2, replacement2)
    
    target3 = "classId: selectedClassId,"
    replacement3 = "classId: targetClassId,"
    content = content.replace(target3, replacement3)
    
    target4 = "id: `std-${selectedClassId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`"
    replacement4 = "id: `std-${targetClassId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`"
    content = content.replace(target4, replacement4)
    
    target5 = "c.id === selectedClassId && (c.name.includes('قسم جديد') || c.name.trim() === '')"
    replacement5 = "c.id === targetClassId && (c.name.includes('قسم جديد') || c.name.trim() === '')"
    content = content.replace(target5, replacement5)
    
    with open('components/ClassesManager.tsx', 'w') as f:
        f.write(content)
    print("Fixed upload logic")
else:
    print("Target not found")
