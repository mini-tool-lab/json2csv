#!/usr/bin/env node
'use strict';

const fs = require('fs');

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => (data += chunk));
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

/**
 * Flatten JSON into row objects.
 * - Objects become dot.notation keys
 * - Arrays of primitives become joined strings "a|b|c"
 * - Arrays of objects become indexed keys: items[0].id, items[1].id
 */
function flattenToRow(value, prefix = '', out = {}) {
  const isObject =
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value);

  if (value === null || value === undefined) {
    if (prefix) out[prefix] = value === undefined ? '' : '';
    return out;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      if (prefix) out[prefix] = '';
      return out;
    }

    const allPrimitive = value.every(v => v === null || ['string', 'number', 'boolean'].includes(typeof v));
    if (allPrimitive) {
      const joined = value.map(v => (v === null ? '' : String(v))).join('|');
      if (prefix) out[prefix] = joined;
      return out;
    }

    // Mixed / objects: index columns
    value.forEach((item, idx) => {
      const key = prefix ? `${prefix}[${idx}]` : `[${idx}]`;
      flattenToRow(item, key, out);
    });
    return out;
  }

  if (isObject) {
    const keys = Object.keys(value);
    if (keys.length === 0) {
      if (prefix) out[prefix] = '';
      return out;
    }
    for (const k of keys) {
      const nextPrefix = prefix ? `${prefix}.${k}` : k;
      flattenToRow(value[k], nextPrefix, out);
    }
    return out;
  }

  // Primitive
  if (prefix) out[prefix] = String(value);
  return out;
}

function asRows(json) {
  // If the JSON is an array of objects/primitives, treat each element as a row.
  if (Array.isArray(json)) {
    // Common case: array of objects
    return json.map(item => flattenToRow(item));
  }
  // Single object or primitive becomes one row
  return [flattenToRow(json)];
}

function escapeCsvCell(v) {
  const s = v === null || v === undefined ? '' : String(v);
  // Escape if contains special chars
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows) {
  // Build a stable header set across all rows
  const headerSet = new Set();
  for (const r of rows) for (const k of Object.keys(r)) headerSet.add(k);

  // Predictable order: alphabetical
  const headers = Array.from(headerSet).sort((a, b) => a.localeCompare(b));

  const lines = [];
  lines.push(headers.map(escapeCsvCell).join(','));

  for (const r of rows) {
    const line = headers.map(h => escapeCsvCell(r[h] ?? '')).join(',');
    lines.push(line);
  }
  return lines.join('\n') + '\n';
}

function usage(exitCode = 0) {
  const msg = `
json2csv - flatten JSON into CSV

Usage:
  json2csv <input.json>
  cat input.json | json2csv

Notes:
  - Nested objects become dot keys: user.profile.name
  - Arrays of primitives become joined strings: tags -> "a|b|c"
  - Arrays of objects become indexed columns: items[0].id, items[1].id
`;
  process.stderr.write(msg.trim() + '\n');
  process.exit(exitCode);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('-h') || args.includes('--help')) usage(0);

  let raw;
  if (args.length >= 1) {
    const path = args[0];
    try {
      raw = fs.readFileSync(path, 'utf8');
    } catch (e) {
      process.stderr.write(`Error reading file: ${path}\n${e.message}\n`);
      process.exit(1);
    }
  } else {
    // stdin
    if (process.stdin.isTTY) usage(1);
    raw = await readStdin();
  }

  let json;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    process.stderr.write(`Invalid JSON:\n${e.message}\n`);
    process.exit(1);
  }

  const rows = asRows(json);
  const csv = toCsv(rows);
  process.stdout.write(csv);
}

main().catch(err => {
  process.stderr.write(`Unexpected error:\n${err?.stack || err}\n`);
  process.exit(1);
});
