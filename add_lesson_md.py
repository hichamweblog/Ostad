with open('components/LessonPreparation.tsx', 'r') as f:
    content = f.read()

md_func = """
  const handleExportMarkdown = () => {
    if (!currentUnit) return;
    let mdContent = `# المذكرة البيداغوجية: الوحدة ${currentUnit.unitNumber} - ${currentUnit.title}\\n\\n`;
    
    if (activeAiPlan) {
      mdContent += activeAiPlan + "\\n";
    } else {
      mdContent += `**الميدان:** ${currentUnit.field}\\n`;
      mdContent += `**الحجم الساعي:** ${currentUnit.hourlyVolume} سا\\n\\n`;
      mdContent += `## الكفاءة المستهدفة\\n${currentUnit.targetedCompetence}\\n\\n`;
      
      mdContent += `## مراحل الإنجاز (سيرورة التعلم)\\n`;
      (currentUnit.implementationMechanisms || []).forEach((step, idx) => {
        mdContent += `${idx + 1}. ${step}\\n`;
      });
      
      if (currentUnit.teacherDirectives && currentUnit.teacherDirectives.length > 0) {
        mdContent += `\\n## توجيهات الأستاذ\\n`;
        currentUnit.teacherDirectives.forEach(dir => {
          mdContent += `- ${dir}\\n`;
        });
      }
    }

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `مذكرة_${currentUnit.title}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
"""

content = content.replace("  const handleGenerateAiPlan = async () => {", md_func + "\n  const handleGenerateAiPlan = async () => {")

md_btn = """                  <button
                    onClick={handleExportMarkdown}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                    title="تصدير المذكرة كملف Markdown (.md)"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">تصدير Markdown</span>
                    <span className="sm:hidden">.md</span>
                  </button>
                  <button
                    onClick={() => {
                      if (fileInputRef.current) fileInputRef.current.click();
                    }}"""

content = content.replace("""                  <button
                    onClick={() => {
                      if (fileInputRef.current) fileInputRef.current.click();
                    }}""", md_btn)

with open('components/LessonPreparation.tsx', 'w') as f:
    f.write(content)
