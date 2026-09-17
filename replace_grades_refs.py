with open('components/GradesAndEvaluation.tsx', 'r') as f:
    content = f.read()

target = "const [searchStudent, setSearchStudent] = useState('');"
replacement = """const [searchStudent, setSearchStudent] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);"""

content = content.replace(target, replacement)

with open('components/GradesAndEvaluation.tsx', 'w') as f:
    f.write(content)
