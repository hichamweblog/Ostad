with open('components/SessionCahier.tsx', 'r') as f:
    cahier_content = f.read()

md_func = """
  const handleExportMarkdown = () => {
    let mdContent = `# دفتر النصوص - قسم ${activeClassObj?.name}\\n\\n`;
    classPastSessions.forEach(s => {
      mdContent += `## حصة يوم ${s.date}\\n`;
      mdContent += `- التوقيت: ${s.startTime} - ${s.endTime}\\n`;
      mdContent += `- الميدان: ${s.field}\\n`;
      mdContent += `- الوحدة: ${s.unitTitle}\\n`;
      mdContent += `\\n### الكفاءة المستهدفة\\n${s.targetedCompetence}\\n`;
      if (s.homework) mdContent += `\\n### العمل المنزلي\\n${s.homework}\\n`;
      if (s.teacherRemarks) mdContent += `\\n### ملاحظات الأستاذ\\n${s.teacherRemarks}\\n`;
      mdContent += `\\n---\\n\\n`;
    });

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `دفتر_النصوص_${activeClassObj?.name || 'القسم'}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
"""

cahier_content = cahier_content.replace("  const handleExportCahierDoc = () => {", md_func + "\n  const handleExportCahierDoc = () => {")

md_btn = """              <button
                onClick={handleExportMarkdown}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="تصدير الدفتر كملف Markdown (.md)"
              >
                <FileDown className="w-3.5 h-3.5 text-slate-300" />
                <span className="hidden sm:inline">تصدير Markdown</span>
                <span className="sm:hidden">.md</span>
              </button>
              <button
                onClick={handleExportCahierDoc}"""

cahier_content = cahier_content.replace("              <button\n                onClick={handleExportCahierDoc}", md_btn)

with open('components/SessionCahier.tsx', 'w') as f:
    f.write(cahier_content)
