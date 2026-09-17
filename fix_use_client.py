with open('components/SidebarSanad.tsx', 'r') as f:
    content = f.read()

content = content.replace("import Image from 'next/image';\n'use client';", "'use client';\nimport Image from 'next/image';")

with open('components/SidebarSanad.tsx', 'w') as f:
    f.write(content)
