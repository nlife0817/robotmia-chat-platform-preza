// Build index.html from slides/*.html fragments.
// Order: _head.html → NN-*.html (sorted) → _foot.html
// Run: node build.js
const fs = require('fs');
const path = require('path');

const dir = 'slides';
const all = fs.readdirSync(dir);
const slideFiles = all.filter(f => /^\d{2}-.+\.html$/.test(f)).sort();
const order = ['_head.html', ...slideFiles, '_foot.html'];

const parts = order.map(f => {
  const p = path.join(dir, f);
  if (!fs.existsSync(p)) {
    console.error(`Missing: ${p}`);
    process.exit(1);
  }
  return fs.readFileSync(p, 'utf8');
});

const out = parts.join('');
fs.writeFileSync('index.html', out);
console.log(`Built index.html from ${order.length} fragments (${slideFiles.length} slides).`);
