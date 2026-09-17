with open('components/CouncilAnalysis.tsx', 'r') as f:
    content = f.read()

# Make it look more "Pro Max" - we already use bento cards, but maybe improve the texts and layout.
# Ensure no "استمارة" anywhere.
content = content.replace("مطابقة تماماً للنموذج الرسمي المعتمد في مجالس الأقسام بالثانويات الجزائرية", "مطابقة للنموذج الرسمي المعتمد")
content = content.replace("Council Written Diagnostic Report (جاهز للقراءة في مجلس القسم)", "")
content = content.replace("تقرير الأستاذ المرفوع لمجلس القسم (التشخيص التربوي وخطة العلاج)", "التقرير البيداغوجي والتشخيص")

with open('components/CouncilAnalysis.tsx', 'w') as f:
    f.write(content)
