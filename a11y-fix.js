const fs = require('fs');
const glob = require('glob'); // npm install glob might be needed? No, can use fs.readdirSync recursively.

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = dir + '/' + f;
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      if (f.endsWith('.tsx') || f.endsWith('.ts')) {
        callback(dirPath);
      }
    }
  });
}

function fixA11y(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  // 1. Modals
  if (content.includes('fixed inset-0')) {
     const modalRegex = /(<div[^>]*className="[^"]*fixed inset-0[^>]*>[\s\S]*?<div)\s+(className="bg-white rounded-(?:2xl|xl|lg|md)[^"]*)/g;
     content = content.replace(modalRegex, (match, p1, p2) => {
        changed = true;
        return `${p1} role="dialog" aria-modal="true" ${p2}`;
     });
     // GlobalSearchModal might have a different setup
  }

  // 2. Interactive divs/lis (onClick without role="button")
  // Find <div or <li with onClick but no role="button" or similar.
  // This is tricky with regex because of multiline tags in JSX.
  // Maybe just do simple ones that don't span across lines for onClick?
  // Actually, I can use a simpler regex or simple string replacements for specific known elements.
  
  fs.writeFileSync(filePath, content, 'utf-8');
  if (changed) console.log('Fixed modals in', filePath);
}

walkDir('./components', fixA11y);
console.log('Done');
