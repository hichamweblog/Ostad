with open('components/LessonPreparation.tsx', 'r') as f:
    content = f.read()

# Remove the pdf name from the dropdown options
target1 = "const pdfName = state.unitPdfFiles?.[unit.id]?.fileName || unit.driveFileName;"
rep1 = "const hasPdf = Boolean(state.unitPdfFiles?.[unit.id] || unit.driveFileName || unit.pdfUrl);"
content = content.replace(target1, rep1)

target2 = "{pdfName ? `— 📄 [${pdfName}]` : ''}"
rep2 = "{hasPdf ? '— 📄 [مدمجة]' : ''}"
content = content.replace(target2, rep2)

# Remove the file name from the banner
target3 = """                  {attachedPdf?.fileName
                    ? `الملف المرفوع: ${attachedPdf.fileName} • تم الرفع محلياً`
                    : currentUnit.driveFileName
                    ? `الملف المدمج`
                    : 'مذكرة بصيغة PDF'}"""
rep3 = """                  {attachedPdf?.fileName
                    ? `تم رفع مذكرة مخصصة محلياً`
                    : currentUnit.driveFileName
                    ? `مذكرة الوحدة المدمجة`
                    : 'مذكرة بصيغة PDF'}"""
content = content.replace(target3, rep3)

with open('components/LessonPreparation.tsx', 'w') as f:
    f.write(content)
