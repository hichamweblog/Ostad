const fs = require('fs');
const content = fs.readFileSync('./components/LessonPreparation.tsx', 'utf-8');
const lines = content.split('\n');
for (let i=0; i<lines.length; i++) {
  if (lines[i].includes('<div') || lines[i].includes('<li')) {
    for (let j=0; j<10 && i+j<lines.length; j++) {
       if (lines[i+j].includes('onClick=')) {
          if (lines[i+j].includes('<button') || lines[i+j].includes('<a') || lines[i+j].includes('</button>')) break;
          let block = lines.slice(i, i+j+1).join('\n');
          // If block doesn't contain a button tag before onClick, it might be the div
          if (!block.includes('<button') && !block.includes('<a')) {
             console.log(`Match at line ${i+1}:\n${block}`);
          }
       }
       if (lines[i+j].includes('>')) break; // End of opening tag
    }
  }
}
