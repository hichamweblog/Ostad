const fs = require('fs');
let code = fs.readFileSync('components/CurriculumView.tsx', 'utf8');
code = code.replace(
  "}) => {\n  const activeClass",
  "}) => {\n  const [, setLoaded] = useState(false);\n  useEffect(() => {\n    loadAllCurriculum().then(() => setLoaded(true));\n  }, []);\n  const activeClass"
);
fs.writeFileSync('components/CurriculumView.tsx', code);
