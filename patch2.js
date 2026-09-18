const fs = require('fs');
let code = fs.readFileSync('components/Dashboard.tsx', 'utf8');
code = code.replace(
  "export const Dashboard: React.FC<DashboardProps> = ({",
  "export const Dashboard: React.FC<DashboardProps> = ({\n"
);
// Just inject it after the function opening bracket
code = code.replace(
  "}) => {\n  // Urgent tasks state",
  "}) => {\n  const [, setLoaded] = useState(false);\n  useEffect(() => {\n    loadAllCurriculum().then(() => setLoaded(true));\n  }, []);\n  // Urgent tasks state"
);
fs.writeFileSync('components/Dashboard.tsx', code);
