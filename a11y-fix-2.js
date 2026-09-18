const fs = require('fs');

const files = [
  './components/ClassesManager.tsx',
  './components/AttendanceSanad.tsx',
  './components/LessonPreparation.tsx'
];

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Regex to match <div ... onClick={...} ... > or <li ... onClick={...} ...>
  // We'll replace <div or <li if it has onClick but no role="button"
  
  // Since JSX can span multiple lines, we'll just do a simpler search:
  // Find all onClick props, check if the preceding tag is div or li.
  // Actually, let's use a simpler regex that matches the opening tag name, optional props, then onClick, optional props, then >
  // It's easier to find `<div ... onClick={...}` and add role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { ... } }}

  // Let's manually replace known issues or write a robust parser.
  // Let's just output the matches with line numbers and context so we can replace them using multi_replace_file_content or script.
  let lines = content.split('\n');
  lines.forEach((line, i) => {
    if (line.includes('onClick=') && (line.includes('<div') || line.includes('<li') || line.includes('<span'))) {
      console.log(`File: ${filePath} | Line ${i+1}: ${line.trim()}`);
    }
  });

});
