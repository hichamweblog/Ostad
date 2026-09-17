import re
with open('components/SidebarSanad.tsx', 'r') as f:
    content = f.read()

if "import Image from 'next/image';" not in content:
    content = "import Image from 'next/image';\n" + content

with open('components/SidebarSanad.tsx', 'w') as f:
    f.write(content)
