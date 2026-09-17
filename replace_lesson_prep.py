with open('components/LessonPreparation.tsx', 'r') as f:
    content = f.read()

# Replacements for Google Drive / Official PDF talk
content = content.replace("مذكرة وزارية رسمية بصيغة PDF", "المذكرة المدمجة")
content = content.replace("مذكرة هذه الوحدة الرسمية مدمجة وجاهزة للمعاينة المباشرة في الأسفل.", "")
content = content.replace("فتح في Google Drive", "فتح المجلد")
content = content.replace("فتح المجلد الكامل على Google Drive", "فتح المجلد")
content = content.replace("Google Drive مجلد", "مجلد الوحدة")
content = content.replace("Level Google Drive Folder", "مجلد المستوى")
content = content.replace("Official Google Drive PDF", "PDF")
content = content.replace("مذكرة جاهزة", "مذكرة الوحدة")
content = content.replace("المذكرات الرسمية لوزارة التربية الوطنية", "المذكرات المدمجة")
content = content.replace("المذكرات المدمجة بصيغة PDF", "المذكرة المدمجة")

with open('components/LessonPreparation.tsx', 'w') as f:
    f.write(content)
