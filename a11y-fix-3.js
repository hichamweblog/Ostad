const fs = require('fs');

const files = [
  './components/ClassesManager.tsx',
  './components/AttendanceSanad.tsx',
  './components/LessonPreparation.tsx'
];

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf-8');
  const matches = [...content.matchAll(/<(div|li|span)([^>]*?)onClick=\{([^>]*?)\}([^>]*?)>/g)];
  if (matches.length > 0) {
     console.log(`Found ${matches.length} matches in ${filePath}`);
     matches.forEach(m => {
       console.log(m[0]);
     });
  }
});
