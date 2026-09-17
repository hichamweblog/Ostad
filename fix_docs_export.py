with open('components/DocumentsExport.tsx', 'r') as f:
    content = f.read()

content = content.replace("استمارة مجلس القسم - الفصل", "تقرير مجلس القسم - الفصل")
content = content.replace("استمارة مجلس القسم", "تقرير مجلس القسم")
content = content.replace("COUNCIL FORM", "COUNCIL REPORT")

with open('components/DocumentsExport.tsx', 'w') as f:
    f.write(content)
