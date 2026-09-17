import re

with open('components/ClassesManager.tsx', 'r') as f:
    content = f.read()

target = """  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedClassId) return;

    try {
      const parsedData = await parseDigitizationFile(file);
      
      onUpdateState(prev => {
        let classToUpdate = prev.classes.find(c => c.id === selectedClassId);
        if (!classToUpdate) return prev;

        const existingStudents = prev.students.filter(s => s.classId === selectedClassId);
        const importedStudents = parsedData.students;
        
        const newStudentsToAdd: Student[] = [];
        let studentsUpdatedCount = 0;
        
        const currentStudentMap = new Map();
        existingStudents.forEach(s => {
          if (s.regNumber) currentStudentMap.set(s.regNumber, s);
          else currentStudentMap.set(s.fullName, s); // Fallback to name if regNumber missing
        });
        
        for (const imported of importedStudents) {
          if (imported.regNumber && currentStudentMap.has(imported.regNumber)) {
            studentsUpdatedCount++;
          } else if (!imported.regNumber && currentStudentMap.has(imported.fullName)) { 
            studentsUpdatedCount++;
          } else {
            newStudentsToAdd.push({
              ...imported,
              classId: selectedClassId,
              id: `std-${selectedClassId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
            });
          }
        }
        
        setImportNotification(`تمت المزامنة بنجاح: تمت إضافة ${newStudentsToAdd.length} تلميذ جديد، وبقي ${studentsUpdatedCount} تلميذ بدون تغيير لضمان حفظ بياناتهم السابقة.`);
        
        return {
          ...prev,
          students: [...prev.students, ...newStudentsToAdd],
          classes: prev.classes.map(c => 
            c.id === selectedClassId && (c.name.includes('قسم جديد') || c.name.trim() === '') 
              ? { ...c, name: parsedData.className, level: parsedData.level, stream: parsedData.stream }
              : c
          )
        };
      });
      
    } catch (err: any) {
      console.error('File import error:', err);
      alert(err.message || 'حدث خطأ أثناء قراءة الملف. يرجى التأكد من أنه ملف الرقمنة الأصلي.');
    }
  };"""

replacement = """  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsedData = await parseDigitizationFile(file);
      
      onUpdateState(prev => {
        let classIdToUse = selectedClassId;
        
        // Find existing class by name (extracted from file)
        const existingClassByName = prev.classes.find(c => c.name === parsedData.className);
        
        let newClasses = [...prev.classes];
        let studentsUpdatedCount = 0;
        const newStudentsToAdd: Student[] = [];
        
        if (existingClassByName) {
          classIdToUse = existingClassByName.id;
        } else if (!classIdToUse) {
          // Create new class if no class is selected and no match found
          classIdToUse = 'class-' + Date.now();
          newClasses.push({
            id: classIdToUse,
            name: parsedData.className,
            level: parsedData.level,
            stream: parsedData.stream,
            color: 'bg-emerald-100 text-emerald-800'
          });
        }
        
        // Ensure UI switches to this class
        setSelectedClassId(classIdToUse);

        const existingStudents = prev.students.filter(s => s.classId === classIdToUse);
        const importedStudents = parsedData.students;
        
        const currentStudentMap = new Map();
        existingStudents.forEach(s => {
          if (s.regNumber) currentStudentMap.set(s.regNumber, s);
          else currentStudentMap.set(s.fullName, s);
        });
        
        for (const imported of importedStudents) {
          if (imported.regNumber && currentStudentMap.has(imported.regNumber)) {
            studentsUpdatedCount++;
          } else if (!imported.regNumber && currentStudentMap.has(imported.fullName)) { 
            studentsUpdatedCount++;
          } else {
            newStudentsToAdd.push({
              ...imported,
              classId: classIdToUse,
              id: `std-${classIdToUse}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
            });
          }
        }
        
        setImportNotification(`تمت المزامنة بنجاح: تم إنشاء/تحديث القسم (${parsedData.className}). أضيف ${newStudentsToAdd.length} تلميذ، وحُفظ ${studentsUpdatedCount} تلميذ.`);
        
        return {
          ...prev,
          classes: newClasses,
          students: [...prev.students, ...newStudentsToAdd]
        };
      });
      
    } catch (err: any) {
      console.error('File import error:', err);
      alert(err.message || 'حدث خطأ أثناء قراءة الملف. يرجى التأكد من أنه ملف الرقمنة الأصلي.');
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };"""

content = content.replace(target, replacement)

# We also need to fix the "selectedClassId" handling on mount. If selectedClassId is empty but classes exist, it should pick the first.
mount_target = """  const [selectedClassId, setSelectedClassId] = useState<string>(
    state.activeClassId || (state.classes.length > 0 ? state.classes[0].id : '')
  );"""

# Make sure it updates if state.classes changes and selectedClassId is empty
effect_target = """  const classStudents = state.students
    .filter(s => s.classId === selectedClassId)
    .sort((a, b) => a.numberInList - b.numberInList);"""

effect_replacement = """  React.useEffect(() => {
    if (!selectedClassId && state.classes.length > 0) {
      setSelectedClassId(state.activeClassId || state.classes[0].id);
    }
  }, [state.classes, selectedClassId, state.activeClassId]);

  const classStudents = state.students
    .filter(s => s.classId === selectedClassId)
    .sort((a, b) => a.numberInList - b.numberInList);"""

content = content.replace(effect_target, effect_replacement)

with open('components/ClassesManager.tsx', 'w') as f:
    f.write(content)

