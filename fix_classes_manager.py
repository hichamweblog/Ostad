import re

with open('components/ClassesManager.tsx', 'r') as f:
    content = f.read()

target = """  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsedData = await parseDigitizationFile(file);
      
      onUpdateState(prev => {
        let classIdToUse = selectedClassId;
        const existingClassByName = prev.classes.find(c => c.name === parsedData.className);
        
        let newClasses = [...prev.classes];
        
        if (existingClassByName) {
          classIdToUse = existingClassByName.id;
        } else if (!classIdToUse || classIdToUse.trim() === '') {
          classIdToUse = 'class-' + Date.now();
          newClasses.push({
            id: classIdToUse,
            name: parsedData.className,
            level: parsedData.level,
            stream: parsedData.stream,
            color: 'bg-emerald-100 text-emerald-800'
          });
        }
        
        setSelectedClassId(classIdToUse);

        const existingStudents = prev.students.filter(s => s.classId === classIdToUse);
        const importedStudents = parsedData.students;
        
        let studentsUpdatedCount = 0;
        const newStudentsToAdd: any[] = [];
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
        
        setImportNotification(`تم الاستيراد: إضافة ${newStudentsToAdd.length} تلميذ للقسم (${parsedData.className}).`);
        
        return {
          ...prev,
          classes: newClasses.map(c => 
            c.id === classIdToUse && (c.name.includes('قسم جديد') || c.name.trim() === '') 
              ? { ...c, name: parsedData.className, level: parsedData.level, stream: parsedData.stream }
              : c
          ),
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

replacement = """  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsedDataArray = await parseDigitizationFile(file); // Returns an array of classes
      
      onUpdateState(prev => {
        let newClasses = [...prev.classes];
        let allNewStudents: any[] = [];
        let totalAdded = 0;
        let totalUpdated = 0;
        let firstClassId = selectedClassId;
        
        for (const parsedData of parsedDataArray) {
          let classIdToUse = '';
          const existingClassByName = newClasses.find(c => c.name === parsedData.className);
          
          if (existingClassByName) {
            classIdToUse = existingClassByName.id;
          } else {
            // Create a completely new class for this worksheet
            classIdToUse = `class-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            newClasses.push({
              id: classIdToUse,
              name: parsedData.className,
              level: parsedData.level,
              stream: parsedData.stream,
              color: 'bg-emerald-100 text-emerald-800'
            });
          }
          
          if (!firstClassId) {
            firstClassId = classIdToUse;
          }

          const existingStudents = prev.students.filter(s => s.classId === classIdToUse);
          const currentStudentMap = new Map();
          existingStudents.forEach(s => {
            if (s.regNumber) currentStudentMap.set(s.regNumber, s);
            else currentStudentMap.set(s.fullName, s);
          });
          
          for (const imported of parsedData.students) {
            if (imported.regNumber && currentStudentMap.has(imported.regNumber)) {
              totalUpdated++;
            } else if (!imported.regNumber && currentStudentMap.has(imported.fullName)) { 
              totalUpdated++;
            } else {
              allNewStudents.push({
                ...imported,
                classId: classIdToUse,
                id: `std-${classIdToUse}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
              });
              totalAdded++;
            }
          }
        }
        
        if (firstClassId) {
          setSelectedClassId(firstClassId);
        }
        
        setImportNotification(`تم الاستيراد من ${parsedDataArray.length} ورقة عمل (قسم). إضافة ${totalAdded} تلميذ، وحُفظ ${totalUpdated} تلميذ سابق.`);
        
        return {
          ...prev,
          classes: newClasses,
          students: [...prev.students, ...allNewStudents]
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

with open('components/ClassesManager.tsx', 'w') as f:
    f.write(content)
