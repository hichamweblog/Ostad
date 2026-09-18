const fs = require('fs');

const files = [
  './components/ClassesManager.tsx',
  './components/AttendanceSanad.tsx',
  './components/LessonPreparation.tsx'
];

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf-8');
  // Match <div ... onClick={...} ... >
  const matches = [...content.matchAll(/<(div|li|span|a)\b([^>]*?)onClick=\{([^>]*?)\}([^>]*?)>/gi)];
  
  if (matches.length > 0) {
    console.log(`Found non-button interactive elements in ${filePath}:`);
    matches.forEach(m => {
       console.log(m[0]);
    });
  } else {
    console.log(`No matches in ${filePath}`);
  }
});
