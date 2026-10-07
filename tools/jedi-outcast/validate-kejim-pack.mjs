import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || 'public/starwars/kejim_post');
const required = [
  'kejim_post.glb',
  'actors/kyle.glb',
  'actors/jan.glb',
  'actors/stormtrooper.glb',
  'actors/officer.glb',
];

const optional = [
  'audio/explore.ogg',
  'audio/action.ogg',
];

const check = (relative) => {
  const full = path.join(root, relative);
  const exists = fs.existsSync(full);
  const size = exists ? fs.statSync(full).size : 0;
  return { relative, exists, size };
};

const requiredStatus = required.map(check);
const optionalStatus = optional.map(check);
const missing = requiredStatus.filter(item => !item.exists);

console.log('Kejim Post runtime pack:', root);
for (const item of requiredStatus) {
  console.log(`${item.exists ? 'PASS' : 'MISS'} required ${item.relative}${item.exists ? ` (${item.size} bytes)` : ''}`);
}
for (const item of optionalStatus) {
  console.log(`${item.exists ? 'PASS' : 'SKIP'} optional ${item.relative}${item.exists ? ` (${item.size} bytes)` : ''}`);
}

if (missing.length) {
  console.error(`Runtime pack incomplete: ${missing.length} required file(s) missing.`);
  process.exitCode = 1;
} else {
  console.log('Runtime pack minimum = PASS');
}
