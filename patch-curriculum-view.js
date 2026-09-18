const fs = require('fs');
let code = fs.readFileSync('components/CurriculumView.tsx', 'utf8');

code = code.replace(
  "import { OFFICIAL_CURRICULUM, OFFICIAL_LEVELS, getMergedCurriculumUnits } from '@/lib/curriculum-data';",
  "import { OFFICIAL_CURRICULUM, OFFICIAL_LEVELS, getMergedCurriculumUnits, loadAllCurriculum } from '@/lib/curriculum-data';\nimport { useEffect } from 'react';"
);
code = code.replace(
  "export const CurriculumView: React.FC<CurriculumViewProps> = ({ state, onUpdateState }) => {",
  "export const CurriculumView: React.FC<CurriculumViewProps> = ({ state, onUpdateState }) => {\n  const [, setLoaded] = React.useState(false);\n  useEffect(() => {\n    loadAllCurriculum().then(() => setLoaded(true));\n  }, []);"
);
fs.writeFileSync('components/CurriculumView.tsx', code);
