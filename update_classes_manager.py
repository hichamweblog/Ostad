with open('components/ClassesManager.tsx', 'r') as f:
    content = f.read()

# 1. Replace handleFileUpload
old_upload_start = "  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {"
old_upload_end = "  // Quick Paste Names Parser"

new_upload_fn = """  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsedData = await parseDigitizationFile(file);

      onUpdateState(prev => {
        const updatedClasses = [...prev.classes];
        let updatedStudents = [...prev.students];
        let totalNewStudentsAdded = 0;
        let totalExistingStudentsRetained = 0;
        const processedClassIds: string[] = [];

        const classColors = [
          '#0d9488', '#0284c7', '#d97706', '#7c3aed', '#e11d48',
          '#059669', '#4f46e5', '#ca8a04', '#2563eb', '#db2777'
        ];

        // Loop through all parsed classes from all sheets in the Excel file
        parsedData.classes.forEach((pClass, idx) => {
          // Check if class already exists by exact name or matching normalized name
          let classObj = updatedClasses.find(
            c => c.name.trim().toLowerCase() === pClass.className.trim().toLowerCase()
          );

          // If not found, check if there's an unused placeholder class (e.g., "قسم جديد" with 0 students)
          if (!classObj) {
            const placeholderIdx = updatedClasses.findIndex(
              c => (c.name.includes('قسم جديد') || c.name.trim() === '') &&
                   !updatedStudents.some(s => s.classId === c.id) &&
                   !processedClassIds.includes(c.id)
            );
            if (placeholderIdx !== -1) {
              classObj = updatedClasses[placeholderIdx];
              classObj.name = pClass.className;
              classObj.level = pClass.level;
              classObj.stream = pClass.stream;
              classObj.color = classObj.color || classColors[(updatedClasses.length + idx) % classColors.length];
            }
          }

          // If still not found, create a brand new class
          if (!classObj) {
            const newClassId = `cls-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
            classObj = {
              id: newClassId,
              name: pClass.className,
              level: pClass.level,
              stream: pClass.stream,
              color: classColors[(updatedClasses.length + idx) % classColors.length],
            };
            updatedClasses.push(classObj);
          } else {
            // Update level and stream based on exact parsing
            classObj.level = pClass.level;
            classObj.stream = pClass.stream;
          }

          processedClassIds.push(classObj.id);

          // Process students for this specific class
          const existingStudentsInClass = updatedStudents.filter(s => s.classId === classObj!.id);
          const studentLookupByReg = new Map<string, Student>();
          const studentLookupByName = new Map<string, Student>();

          existingStudentsInClass.forEach(s => {
            if (s.regNumber) studentLookupByReg.set(s.regNumber, s);
            if (s.fullName) studentLookupByName.set(s.fullName.trim(), s);
          });

          pClass.students.forEach(importedStudent => {
            const matchByReg = importedStudent.regNumber ? studentLookupByReg.get(importedStudent.regNumber) : null;
            const matchByName = studentLookupByName.get(importedStudent.fullName.trim());

            if (matchByReg || matchByName) {
              totalExistingStudentsRetained++;
              const targetExisting = matchByReg || matchByName;
              if (targetExisting && importedStudent.regNumber && !targetExisting.regNumber) {
                targetExisting.regNumber = importedStudent.regNumber;
                targetExisting.registrationNumber = importedStudent.regNumber;
              }
            } else {
              totalNewStudentsAdded++;
              const newStudent: Student = {
                ...importedStudent,
                id: `std-${classObj!.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                classId: classObj!.id, // STRICTLY ASSIGNED TO THIS CLASS ID!
              };
              updatedStudents.push(newStudent);
            }
          });
        });

        // Set the active and selected class to the first imported class
        const firstClassId = processedClassIds[0] || prev.activeClassId || (updatedClasses.length > 0 ? updatedClasses[0].id : null);
        if (firstClassId) {
          setSelectedClassId(firstClassId);
        }

        // Summary notification
        const msg = `تمت المزامنة بنجاح لـ ${parsedData.classes.length} أفواج تربوية: تمت إضافة ${totalNewStudentsAdded} تلميذاً وتحديث ${totalExistingStudentsRetained} تلميذاً في النظام.`;
        setImportNotification(msg);

        // Update profile if schoolName or academicYear were detected
        const updatedProfile = { ...prev.profile };
        if (parsedData.schoolName && (!prev.profile.schoolName || prev.profile.schoolName.includes('ثانوية'))) {
          updatedProfile.schoolName = parsedData.schoolName;
        }
        if (parsedData.academicYear) {
          updatedProfile.academicYear = parsedData.academicYear;
        }
        if (parsedData.stateName) {
          updatedProfile.stateName = parsedData.stateName;
        }

        return {
          ...prev,
          classes: updatedClasses,
          students: updatedStudents,
          activeClassId: firstClassId,
          profile: updatedProfile,
        };
      });
    } catch (err: any) {
      console.error('File import error:', err);
      alert(err.message || 'حدث خطأ أثناء قراءة الملف. يرجى التأكد من أنه ملف الرقمنة الأصلي.');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Quick Paste Names Parser"""

idx_start = content.find(old_upload_start)
idx_end = content.find(old_upload_end)

if idx_start != -1 and idx_end != -1:
    content = content[:idx_start] + new_upload_fn + content[idx_end + len(old_upload_end):]
    print("Replaced handleFileUpload successfully")
else:
    print("Could not find boundaries for handleFileUpload", idx_start, idx_end)

# 2. Improve the display on the Class Card:
# Level Label
old_level_markup = """                    <div className="flex justify-between">
                      <span className="text-slate-500">المستوى الدراسي:</span>
                      <span className="font-bold text-slate-800">{cls.level}</span>
                    </div>"""

new_level_markup = """                    <div className="flex justify-between">
                      <span className="text-slate-500">المستوى الدراسي:</span>
                      <span className="font-bold text-slate-800">
                        {cls.level === '3AS'
                          ? 'السنة الثالثة ثانوي'
                          : cls.level === '2AS'
                          ? 'السنة الثانية ثانوي'
                          : cls.level === '1AS_ARTS'
                          ? 'السنة الأولى ثانوي (ج.م آداب)'
                          : 'السنة الأولى ثانوي (ج.م علوم)'}
                      </span>
                    </div>"""

if old_level_markup in content:
    content = content.replace(old_level_markup, new_level_markup)
    print("Replaced level markup")
else:
    print("Could not find old_level_markup")

# Hours per week
old_hours_markup = """                    <div className="flex justify-between">
                      <span className="text-slate-500">حصص أسبوعية:</span>
                      <span className="font-mono text-slate-800">{slotsCount} حصص</span>
                    </div>"""

new_hours_markup = """                    <div className="flex justify-between">
                      <span className="text-slate-500">الحصص الأسبوعية:</span>
                      <span className="font-bold text-slate-800">
                        {cls.level === '1AS_SCIENCE' ? '1 حصة (ساعة واحدة)' : '2 حصص (ساعتان)'}
                        {slotsCount > 0 ? ` • ${slotsCount} بالتوقيت` : ''}
                      </span>
                    </div>"""

if old_hours_markup in content:
    content = content.replace(old_hours_markup, new_hours_markup)
    print("Replaced hours markup")
else:
    print("Could not find old_hours_markup")

with open('components/ClassesManager.tsx', 'w') as f:
    f.write(content)

