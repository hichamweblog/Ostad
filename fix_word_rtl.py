with open('components/DocumentsExport.tsx', 'r') as f:
    content = f.read()

content = content.replace("<body style=\"", "<body dir=\\\"rtl\\\" style=\"")

with open('components/DocumentsExport.tsx', 'w') as f:
    f.write(content)
