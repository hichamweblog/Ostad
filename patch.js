const fs = require('fs');
let code = fs.readFileSync('components/Dashboard.tsx', 'utf8');
code = code.replace(
  "import { OFFICIAL_CURRICULUM } from '@/lib/curriculum-data';",
  "import { OFFICIAL_CURRICULUM, loadAllCurriculum } from '@/lib/curriculum-data';\nimport { useEffect, useState } from 'react';"
);
code = code.replace(
  "export const Dashboard: React.FC<DashboardProps> = ({ state, onNavigate, onUpdateState }) => {",
  "export const Dashboard: React.FC<DashboardProps> = ({ state, onNavigate, onUpdateState }) => {\n  const [, setLoaded] = useState(false);\n  useEffect(() => {\n    loadAllCurriculum().then(() => setLoaded(true));\n  }, []);"
);
fs.writeFileSync('components/Dashboard.tsx', code);
