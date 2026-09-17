import re

with open('components/ClassesManager.tsx', 'r') as f:
    content = f.read()

target_start = "  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {\n"
target_end = "  };\n"

start_idx = content.find(target_start)
# find the next "};\n\n" after start_idx
end_idx = content.find("  };\n", start_idx) + len("  };\n")

target = content[start_idx:end_idx]

replacement = """  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    if (fileInputRef.current) fileInputRef.current.value = '';
  };
"""

new_content = content.replace(target, replacement)

with open('components/ClassesManager.tsx', 'w') as f:
    f.write(new_content)
