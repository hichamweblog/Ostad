import { CurriculumUnit, GradeLevel, TeacherProfile } from './types';
import { getDriveFolderForLevel } from './drive-curriculum-map';

export const levelLabelsAr: Record<GradeLevel, string> = {
  '1AS_ARTS': 'السنة الأولى ثانوي — جذع مشترك آداب',
  '1AS_SCIENCE': 'السنة الأولى ثانوي — جذع مشترك علوم وتكنولوجيا',
  '2AS': 'السنة الثانية ثانوي — جميع الشعب',
  '3AS': 'السنة الثالثة ثانوي — أقسام البكالوريا (جميع الشعب)'
};

/**
 * Generate comprehensive Markdown (.md) content for a single pedagogical unit/memo
 */
export function generateUnitMarkdown(unit: CurriculumUnit, profile?: TeacherProfile): string {
  const levelTitle = levelLabelsAr[unit.level] || unit.level;
  const driveInfo = getDriveFolderForLevel(unit.level);

  let md = `# الجمهورية الجزائرية الديمقراطية الشعبية
## وزارة التربية الوطنية — مادة العلوم الإسلامية
### بطاقة المذكرة البيداغوجية الرسمية

---

- **المؤسسة التعليمية:** ${profile?.schoolName || 'ثانوية التعليم الثانوي'}
- **مديرية التربية:** ولاية ${profile?.stateName || 'الجزائر'}
- **الأستاذ(ة):** ${profile?.name || 'أستاذ المادة'}
- **السنة الدراسية:** ${profile?.academicYear || '2025/2026'}
- **المستوى والشعبة:** ${levelTitle}
- **رقم الوحدة:** الوحدة ${unit.unitNumber}
- **عنوان الوحدة:** ${unit.title}
- **الميدان:** ${unit.domain}
- **الحجم الساعي:** ${unit.hourlyVolume} ساعة
${unit.sectionNumber ? `- **المقطع التعليمي:** المقطع ${unit.sectionNumber}${unit.sectionName ? ` (${unit.sectionName})` : ''}` : ''}
${unit.driveFileName ? `- **ملف المذكرة المدمج (Google Drive):** [${unit.driveFileName}](${unit.driveViewUrl || unit.drivePreviewUrl || ''})` : ''}

---

## 1. الكفاءة المستهدفة والهدف التعلمي
> **${unit.targetedCompetence || unit.learningObjective || 'التحكم في معارف وقيم الوحدة وبناء السلوك الإيجابي.'}**

${unit.learningObjective && unit.learningObjective !== unit.targetedCompetence ? `### الهدف التعلمي الخاص:\n${unit.learningObjective}\n` : ''}

## 2. الموارد المعرفية والقيم المستهدفة
${(unit.targetedResources || unit.learningObjectives || []).map((r, i) => `${i + 1}. **${r}**`).join('\n') || '- استيعاب معاني ومفردات الدرس والأحكام الشرعية المستنبطة.'}

## 3. آلية تنفيذ التعلمات (سيرورة الحصة والوضعيات)
${(unit.implementationMechanisms || []).map((m, i) => `- [ ] **المرحلة ${i + 1}:** ${m}`).join('\n') || '- الانطلاق من الوضعية المشكلة وبناء المفاهيم تدريجياً عبر الحوار والاستنتاج.'}

## 4. توجيهات بيداغوجية خاصة بالأستاذ
${(unit.teacherDirectives || unit.pedagogicalDirectives || []).map(d => `- > 📌 ${d}`).join('\n') || '- تفعيل المقاربة بالكفاءات وتشجيع المشاركة النشطة للتلاميذ.'}

## 5. مؤشرات الأداء والتقويم
${(unit.indicators || []).map(ind => `- [x] ✓ ${ind}`).join('\n') || '- قدرة المتعلم على تحديد المفاهيم وتمييز الأحكام والتمثل العملي للقيم.'}

## 6. السندات والنصوص الشرعية المؤطرة
${(unit.referenceTexts || []).map(t => `> 📖 « ${t} »`).join('\n\n') || '> الآيات والأحاديث المعتمدة في المنهاج الرسمي.'}

---
${unit.driveViewUrl ? `## 📎 المرفقات الرقمية\n- **رابط المذكرة بصيغة PDF في Google Drive:** [فتح ملف المذكرة كاملاً](${unit.driveViewUrl})\n` : ''}
${driveInfo ? `- **مجلد التفتيش الوزاري للمستوى على Google Drive:** [استعراض كافة مذكرات المستوى](${driveInfo.folderUrl})\n` : ''}

---
*تم إنشاء هذا الملف بتنسيق Markdown (.md) عبر منصة «معين للعلوم الإسلامية» — التعليم الثانوي بالجزائر.*
`;

  return md;
}

/**
 * Generate complete Markdown document containing all curriculum units for a given grade level
 */
export function generateLevelCurriculumMarkdown(
  level: GradeLevel,
  units: CurriculumUnit[],
  profile?: TeacherProfile
): string {
  const levelTitle = levelLabelsAr[level] || level;
  const driveInfo = getDriveFolderForLevel(level);
  const totalHours = units.reduce((acc, u) => acc + (u.hourlyVolume || 0), 0);

  let md = `# فهرس ومذكرات مادة العلوم الإسلامية — ${levelTitle}
## وزارة التربية الوطنية — الجمهورية الجزائرية الديمقراطية الشعبية

- **الأستاذ(ة):** ${profile?.name || 'أستاذ المادة'}
- **المؤسسة:** ${profile?.schoolName || 'ثانوية التعليم الثانوي'}
- **السنة الدراسية:** ${profile?.academicYear || '2025/2026'}
- **إجمالي الوحدات:** ${units.length} وحدة تعليمية
- **إجمالي الحجم الساعي:** ${totalHours} ساعة
${driveInfo ? `- **مجلد المذكرات الوزاري (Google Drive):** [${driveInfo.titleAr} (${driveInfo.unitsCount} مذكرة PDF)](${driveInfo.folderUrl})\n` : ''}

---

## جدول التدرج السنوي والوحدات التعليمية

| الرقم | عنوان الوحدة التعليمية | الميدان | الحجم الساعي | المقطع | ملف PDF المدمج (Drive) |
| :---: | :--- | :--- | :---: | :---: | :--- |
${units.map(u => `| ${u.unitNumber} | **${u.title}** | ${u.domain} | ${u.hourlyVolume} سا | ${u.sectionNumber ? `المقطع ${u.sectionNumber}` : '—'} | ${u.driveViewUrl ? `[عرض المذكرة PDF](${u.driveViewUrl})` : '—'} |`).join('\n')}

---

## البطاقات البيداغوجية المفصلة للوحدات

`;

  units.forEach(u => {
    md += `\n### الوحدة ${u.unitNumber}: ${u.title}\n\n`;
    md += `- **الميدان:** ${u.domain} | **الحجم الساعي:** ${u.hourlyVolume} سا${u.sectionNumber ? ` | **المقطع:** ${u.sectionNumber}` : ''}\n`;
    if (u.driveViewUrl) {
      md += `- **ملف المذكرة المدمج:** [${u.driveFileName || 'فتح في Google Drive'}](${u.driveViewUrl})\n`;
    }
    md += `\n**الكفاءة المستهدفة:**\n> ${u.targetedCompetence || u.learningObjective || 'بناء التعلمات المعتمدة.'}\n\n`;

    if (u.targetedResources && u.targetedResources.length > 0) {
      md += `**الموارد المعرفية:**\n`;
      u.targetedResources.forEach((r, idx) => {
        md += `${idx + 1}. ${r}\n`;
      });
      md += `\n`;
    }

    if (u.implementationMechanisms && u.implementationMechanisms.length > 0) {
      md += `**آلية تنفيذ التعلمات:**\n`;
      u.implementationMechanisms.forEach((m, idx) => {
        md += `- خطوة ${idx + 1}: ${m}\n`;
      });
      md += `\n`;
    }

    if (u.teacherDirectives && u.teacherDirectives.length > 0) {
      md += `**توجيهات الأستاذ:**\n`;
      u.teacherDirectives.forEach(d => {
        md += `- 📌 ${d}\n`;
      });
      md += `\n`;
    }

    if (u.indicators && u.indicators.length > 0) {
      md += `**مؤشرات التقويم:**\n`;
      u.indicators.forEach(ind => {
        md += `- ✓ ${ind}\n`;
      });
      md += `\n`;
    }

    if (u.referenceTexts && u.referenceTexts.length > 0) {
      md += `**السندات الشرعية:**\n`;
      u.referenceTexts.forEach(t => {
        md += `> « ${t} »\n\n`;
      });
    }

    md += `---\n`;
  });

  md += `\n*تم استخراج هذا التقرير الشامل بتنسيق Markdown (.md) من منصة معين للعلوم الإسلامية.*\n`;

  return md;
}

/**
 * Trigger client-side download of a string as a `.md` file
 */
export function downloadMarkdownFile(content: string, filename: string): void {
  const cleanFilename = filename.endsWith('.md') ? filename : `${filename}.md`;
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = cleanFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
