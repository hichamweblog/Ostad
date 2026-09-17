with open('components/AttendanceSanad.tsx', 'r') as f:
    content = f.read()

content = content.replace("  List\n} from 'lucide-react';", "  List,\n  AlertTriangle,\n  BookX,\n  UserMinus,\n  Star\n} from 'lucide-react';")

with open('components/AttendanceSanad.tsx', 'w') as f:
    f.write(content)
