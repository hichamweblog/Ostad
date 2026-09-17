with open('components/GradesAndEvaluation.tsx', 'r') as f:
    content = f.read()

target = "const handleExportExcel = () => {\n    if (!activeClass) return;"

replacement = """const handleDigitizationUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeClass) return;

    setIsExporting(true);
    try {
      // Get grades from state
      const classGrades = state.grades.filter(g => g.classId === activeClass.id && g.trimester === selectedTrimester);
      
      // We pass the official empty file, the students list, and their grades.
      const blob = await injectGradesIntoFile(file, classStudents, classGrades);
      
      // Download the modified file
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Clean up the name a bit or keep the original, we will just prefix it to show it is injected
      link.download = `محجوز_${file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setToastMessage('تم حقن النقاط في ملف الرقمنة بنجاح!');
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 4000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'حدث خطأ أثناء حقن البيانات. تأكد من أنه ملف الرقمنة الرسمي الصحيح.');
    } finally {
      setIsExporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExportExcel = () => {
    if (!activeClass) return;"""

content = content.replace(target, replacement)

with open('components/GradesAndEvaluation.tsx', 'w') as f:
    f.write(content)
