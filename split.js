// One-time splitter: takes index.html and splits each slide into slides/NN-name.html
// Run: node split.js
const fs = require('fs');
const path = require('path');

const SLIDE_NAMES = {
  '01': 'cover',
  '02': 'company',
  '03': 'products',
  '04': 'clients',
  '05': 'why',
  '06': 'omnichannel',
  '07': 'dialog',
  '08': 'ai-tools',
  '09': 'ai-attrs',
  '10': 'ai-prompter',
  '11': 'savings',
  '12': 'audit',
  '13': 'flexibility',
  '14': 'pricing-structure',
  '15': 'pricing-calc',
  '16': 'pricing-tiers',
  '17': 'contacts',
};

const src = fs.readFileSync('index.html', 'utf8');
const outDir = 'slides';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

// Find all slide markers — numbering is by ORDER of appearance, not the
// (potentially stale) number written inside the comment.
const markerRe = /<!--\s*={3,}[\s\S]*?={3,}\s*-->/g;
const markers = [];
let m;
let order = 0;
while ((m = markerRe.exec(src)) !== null) {
  order++;
  markers.push({ num: String(order).padStart(2, '0'), idx: m.index });
}

if (markers.length === 0) {
  console.error('No slide markers found.');
  process.exit(1);
}

// _head.html — everything before first marker
const head = src.slice(0, markers[0].idx);
fs.writeFileSync(path.join(outDir, '_head.html'), head);

// Slides — between markers
for (let i = 0; i < markers.length; i++) {
  const start = markers[i].idx;
  const end = i + 1 < markers.length ? markers[i + 1].idx : findFootStart(src);
  const num = markers[i].num;
  const name = SLIDE_NAMES[num] || `slide${num}`;
  const content = src.slice(start, end);
  fs.writeFileSync(path.join(outDir, `${num}-${name}.html`), content);
}

// _foot.html — from </deck-stage> to end
const footStart = findFootStart(src);
fs.writeFileSync(path.join(outDir, '_foot.html'), src.slice(footStart));

function findFootStart(s) {
  return s.indexOf('</deck-stage>');
}

console.log(`Split into ${markers.length} slides + _head.html + _foot.html in ${outDir}/`);
