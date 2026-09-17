import glob

for filename in glob.glob('components/*.tsx'):
    with open(filename, 'r') as f:
        content = f.read()
    
    if 'XLSX.utils.json_to_sheet' in content:
        # We need to add ws['!dir'] = 'rtl';
        lines = content.split('\n')
        new_lines = []
        for line in lines:
            new_lines.append(line)
            if 'const ws = XLSX.utils.json_to_sheet' in line or 'const ws = XLSX.utils.table_to_sheet' in line:
                indent = line[:len(line) - len(line.lstrip())]
                new_lines.append(f"{indent}if (!ws['!dir']) ws['!dir'] = 'rtl';")
        
        with open(filename, 'w') as f:
            f.write('\n'.join(new_lines))

