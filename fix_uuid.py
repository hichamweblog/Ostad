import re

with open('tsconfig.json', 'r') as f:
    content = f.read()

# Make sure we can resolve the types
if '"typeRoots":' not in content:
    target = '"compilerOptions": {'
    replacement = '"compilerOptions": {\n    "typeRoots": ["./node_modules/@types"],'
    content = content.replace(target, replacement)
    with open('tsconfig.json', 'w') as f:
        f.write(content)
