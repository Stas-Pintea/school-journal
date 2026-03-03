#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const i18nDir = path.resolve(__dirname, '..', 'src', 'i18n');

const suspiciousPattern =
  /(Рџ|РЎ|РµР|Р°Р|РёР|СЃ|С‚|СЏ|Г®|Дѓ|И™|И|вЂ|â„|�|A5<5|540:B)/u;

const allowedUnicodeChars = new Set(['•']);

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      out.push(full);
    }
  }
  return out;
}

function hasBom(content) {
  return content.charCodeAt(0) === 0xfeff;
}

function scanFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const issues = [];

  if (hasBom(raw)) {
    issues.push({ type: 'bom', line: 1, sample: 'UTF-8 BOM found' });
  }

  const lines = raw.split(/\r?\n/);
  lines.forEach((line, idx) => {
    if (
      line.includes('mojibakeMarkers') ||
      line.includes('cp1251ReverseMap.set(') ||
      line.includes('normalizeI18nText(')
    ) {
      return;
    }
    if (!suspiciousPattern.test(line)) return;
    const sample = line.trim();
    if (sample.length === 1 && allowedUnicodeChars.has(sample)) return;
    issues.push({
      type: 'mojibake',
      line: idx + 1,
      sample: sample.slice(0, 180),
    });
  });

  return issues;
}

const files = walk(i18nDir);
let hasError = false;

for (const file of files) {
  const issues = scanFile(file);
  if (!issues.length) continue;
  hasError = true;
  console.error(`\n[check-i18n-encoding] ${path.relative(process.cwd(), file)}`);
  issues.forEach((issue) => {
    console.error(`  - ${issue.type} at line ${issue.line}: ${issue.sample}`);
  });
}

if (hasError) {
  console.error('\n[check-i18n-encoding] Failed: fix encoding/mojibake in i18n files.');
  process.exit(1);
}

console.log('[check-i18n-encoding] OK');
