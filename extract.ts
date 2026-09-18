import { OFFICIAL_CURRICULUM } from './lib/curriculum-data';
import * as fs from 'fs';

const levels = ['1AS_ARTS', '1AS_SCIENCE', '2AS', '3AS'];
fs.mkdirSync('./lib/data', { recursive: true });

levels.forEach(level => {
  const units = OFFICIAL_CURRICULUM.filter(u => u.level === level);
  const filename = level.toLowerCase().replace('_', '-');
  fs.writeFileSync(`./lib/data/curriculum-${filename}.json`, JSON.stringify(units, null, 2));
});

console.log('Extraction complete.');
