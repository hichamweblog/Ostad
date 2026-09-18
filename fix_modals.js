const fs = require('fs');

function processFile(path, regex, replacer) {
    let content = fs.readFileSync(path, 'utf8');
    content = content.replace(regex, replacer);
    fs.writeFileSync(path, content);
}

processFile('/home/dzgeek/Ostad/components/ClassesManager.tsx', 
  /className="bg-white rounded-2xl (max-w-[a-z0-9]+) w-full([^"]*)"/g, 
  (match, maxW, rest) => {
    if (rest.includes('rounded-t-3xl')) return match;
    return `className="bg-white ${maxW} w-full${rest} rounded-t-3xl sm:rounded-2xl rounded-b-none sm:rounded-b-2xl mb-0 sm:mb-auto pb-8 sm:pb-6 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95"`;
  }
);

processFile('/home/dzgeek/Ostad/components/GlobalSearchModal.tsx',
  /className="rounded-3xl (max-w-xl) w-full([^"]*)"/g,
  (match, maxW, rest) => {
    return `className="bg-[#FFFFFF] ${maxW} w-full${rest} rounded-t-3xl sm:rounded-3xl rounded-b-none sm:rounded-b-3xl mb-0 sm:mb-auto pb-8 sm:pb-6 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95"`;
  }
);
