with open('components/GradesAndEvaluation.tsx', 'r') as f:
    content = f.read()

md_func = """
  const handleExportMarkdown = () => {
    if (!activeClass) return;
    let mdContent = `# كشف نقاط التقويم المستمر والفروض والاختبارات\\n\\n`;
    mdContent += `**القسم:** ${activeClass.name} (${activeClass.stream})\\n`;
    mdContent += `**الفصل:** ${selectedTrimester}\\n\\n`;
    
    mdContent += `| الرقم | الاسم واللقب | التقويم | الفرض | الاختبار | المعدل | التقدير |\\n`;
    mdContent += `|-------|--------------|---------|-------|----------|--------|---------|\\n`;
    
    classStudents.forEach((st, idx) => {
      const draft = gradesDraft[st.id] || { continuousEval: '', quiz: '', exam: '', estimation: '', guidance: '', remarks: '' };
      const ce = draft.continuousEval !== '' ? Number(draft.continuousEval) : '-';
      const q = draft.quiz !== '' ? Number(draft.quiz) : '-';
      const ex = draft.exam !== '' ? Number(draft.exam) : '-';
      const ceVal = draft.continuousEval !== '' ? Number(draft.continuousEval) : null;
      const qVal = draft.quiz !== '' ? Number(draft.quiz) : null;
      const exVal = draft.exam !== '' ? Number(draft.exam) : null;
      const avg = calculateStudentAverage(ceVal, qVal, exVal) ?? '-';
      
      mdContent += `| ${st.numberInList || idx + 1} | ${st.fullName} | ${ce} | ${q} | ${ex} | ${avg} | ${draft.estimation || '-'} |\\n`;
    });

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `كشف_النقاط_${activeClass.name}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
"""

content = content.replace("  const handleExportExcel = () => {", md_func + "\n  const handleExportExcel = () => {")

md_btn = """            <button
              onClick={handleExportMarkdown}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs cursor-pointer"
              title="تصدير كشف النقاط كملف Markdown (.md)"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-300" />
              <span className="hidden sm:inline">Markdown</span>
              <span className="sm:hidden">.md</span>
            </button>
            <button
              onClick={handleExportExcel}"""

content = content.replace("            <button\n              onClick={handleExportExcel}", md_btn)

with open('components/GradesAndEvaluation.tsx', 'w') as f:
    f.write(content)
