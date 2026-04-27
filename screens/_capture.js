// Helper: извлекает HTML из последнего tool-result evaluate-снапшота
// и сохраняет в screens/{name}.html
//
// Использование: node _capture.js <name>

const fs = require('fs');
const path = require('path');

const targetName = process.argv[2];
if (!targetName) {
  console.error('Usage: node _capture.js <name>');
  process.exit(1);
}

const TOOL_RESULTS_DIR = 'C:/Users/user/.claude/projects/C--Users-user-chat-platform--claude-worktrees-suspicious-jang-c5303f/add2bb30-b578-44ec-834c-322503ae7bab/tool-results';

// Берём последний по имени (имя содержит timestamp)
const files = fs.readdirSync(TOOL_RESULTS_DIR)
  .filter(f => f.startsWith('mcp-playwright-browser_evaluate-') && f.endsWith('.txt'))
  .sort()
  .reverse();

if (files.length === 0) {
  console.error('No tool-result files found.');
  process.exit(1);
}

const latest = path.join(TOOL_RESULTS_DIR, files[0]);
const raw = fs.readFileSync(latest, 'utf8');

const startMarker = '### Result\n';
const endMarker = '\n### Ran Playwright';
const startIdx = raw.indexOf(startMarker) + startMarker.length;
const endIdx = raw.lastIndexOf(endMarker);
const jsonStr = raw.slice(startIdx, endIdx).trim();
const html = JSON.parse(jsonStr);

const outDir = path.resolve(__dirname);
const outFile = path.join(outDir, `${targetName}.html`);
fs.writeFileSync(outFile, html, 'utf8');

console.log(`Wrote ${html.length} chars (${Math.round(html.length / 1024)} KB) to ${outFile}`);
console.log(`Source: ${latest}`);
