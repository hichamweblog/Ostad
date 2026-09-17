import re
with open('components/SessionCahier.tsx', 'r') as f:
    content = f.read()

pattern = re.compile(r"  const handleExportMarkdown = \(\) => \{[\s\S]*?URL\.revokeObjectURL\(url\);\n  \};")

replacement = """  const handleExportMarkdown = () => {
    let mdContent = `# دفتر النصوص - قسم ${activeClass?.name}\\n\\n`;
    classPastSessions.forEach((s, idx) => {
      const unitObj = availableUnits.find(u => u.id === s.unitId);
      const title = unitObj?.title || s.customTopic || 'حصة تعلمية';
      const domain = unitObj?.domain || '—';
      const timeSlot = s.startTime && s.endTime ? `${s.startTime} - ${s.endTime}` : (s.startTime || '—');

      mdContent += `## الحصة رقم ${classPastSessions.length - idx}: ${title} (${s.date})\\n`;
      mdContent += `- التوقيت: ${timeSlot}\\n`;
      mdContent += `- الميدان: ${domain}\\n`;
      
      if (s.sessionGoals) mdContent += `\\n### أهداف الحصة\\n${s.sessionGoals}\\n`;
      if (s.accomplishments) mdContent += `\\n### ما تم إنجازه وبناؤه في الحصة\\n${s.accomplishments}\\n`;
      if (s.nextSteps) mdContent += `\\n### المعالجة والواجبات\\n${s.nextSteps}\\n`;
      if (s.teacherNotes) mdContent += `\\n### الملاحظات والذاكرة البيداغوجية\\n${s.teacherNotes}\\n`;
      mdContent += `\\n---\\n\\n`;
    });

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `دفتر_النصوص_${activeClass?.name || 'القسم'}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };"""

content = pattern.sub(replacement, content)

with open('components/SessionCahier.tsx', 'w') as f:
    f.write(content)
