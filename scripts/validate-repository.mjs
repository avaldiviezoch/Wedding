import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const baselinePath = resolve(root, 'qa/static-validation-baseline.json');
const updateBaseline = process.argv.includes('--update-baseline');
const ignoredDirectories = new Set(['.git', 'node_modules']);
const findings = [];

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) return [];
    const absolute = resolve(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

function repoPath(absolute) {
  return relative(root, absolute).split(sep).join('/');
}

function add(type, file, detail, reference = '') {
  findings.push({ type, file: repoPath(file), reference, detail });
}

function localReference(value) {
  const clean = value.trim();
  if (!clean || clean.startsWith('#')) return null;
  if (/^(?:[a-z]+:|\/\/)/i.test(clean)) return null;
  if (/^\{[{%]/.test(clean)) return null;
  return clean.split(/[?#]/, 1)[0];
}

function decodeReference(value) {
  try { return decodeURIComponent(value); } catch { return value; }
}

function validateReference(file, value, kind, baseDirectory = dirname(file)) {
  const local = localReference(value);
  if (!local || /[*${}]/.test(local)) return;
  const decoded = decodeReference(local);
  const target = decoded.startsWith('/')
    ? resolve(root, decoded.replace(/^\/+/, ''))
    : resolve(baseDirectory, decoded);
  if (!target.startsWith(root + sep) && target !== root) return;
  if (!existsSync(target)) add('missing-reference', file, `${kind}: ${value}`, value);
}

const files = walk(root);
const htmlFiles = files.filter((file) => extname(file).toLowerCase() === '.html');
const cssFiles = files.filter((file) => extname(file).toLowerCase() === '.css');
const jsFiles = files.filter((file) => ['.js', '.mjs', '.cjs'].includes(extname(file).toLowerCase()));
const workflowFiles = files.filter((file) => repoPath(file).startsWith('.github/workflows/') && /\.ya?ml$/i.test(file));

for (const file of jsFiles) {
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  } catch (error) {
    const detail = String(error.stderr || error.stdout || error.message).trim().split(/\r?\n/).slice(-3).join(' ');
    add('javascript-syntax', file, detail);
  }

  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(/(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g)) {
    if (match[1].startsWith('.')) validateReference(file, match[1], 'import JS');
  }
  for (const match of source.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    if (match[1].startsWith('.')) validateReference(file, match[1], 'import dinámico JS');
  }
}

for (const file of htmlFiles) {
  const source = readFileSync(file, 'utf8');
  const baseMatch = source.match(/<base\b[^>]*href=["']([^"']+)["']/i);
  let baseDirectory = dirname(file);
  if (baseMatch) {
    const baseValue = localReference(baseMatch[1]);
    if (baseValue) baseDirectory = resolve(dirname(file), decodeReference(baseValue));
  }

  for (const match of source.matchAll(/<(script|link|img|source|video|audio|iframe)\b[^>]*?\s(?:src|href|poster)=["']([^"']+)["']/gi)) {
    validateReference(file, match[2], `<${match[1].toLowerCase()}>`, baseDirectory);
  }

  const markupOnly = source.replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<style\b[\s\S]*?<\/style>/gi, '');
  const ids = new Map();
  for (const match of markupOnly.matchAll(/\sid=["']([^"']+)["']/gi)) {
    ids.set(match[1], (ids.get(match[1]) || 0) + 1);
  }
  for (const [id, count] of ids) {
    if (count > 1) add('duplicate-html-id', file, `id="${id}" aparece ${count} veces`, id);
  }
}

for (const file of cssFiles) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi)) {
    validateReference(file, match[2], 'url CSS');
  }
}

for (const file of workflowFiles) {
  const source = readFileSync(file, 'utf8');
  const candidates = new Set();
  for (const match of source.matchAll(/Path\(\s*['"]([^'"]+)['"]\s*\)/g)) candidates.add(match[1]);
  for (const match of source.matchAll(/\b(?:git\s+(?:add|rm)|grep\s+(?:-[A-Za-z]+\s+)*(?:'[^']*'|"[^"]*")?\s*)\s+([^\r\n|;&]+)/g)) {
    for (const token of match[1].match(/(?:"[^"]+"|'[^']+'|\S+)/g) || []) {
      const clean = token.replace(/^['"]|['"]$/g, '');
      if (/^[\w./ -]+\.[\w-]+$/.test(clean)) candidates.add(clean);
    }
  }
  for (const candidate of candidates) {
    if (/[*${}]/.test(candidate)) continue;
    const target = resolve(root, candidate);
    if (target.startsWith(root + sep) && !existsSync(target)) {
      add('workflow-missing-path', file, `workflow referencia ruta inexistente: ${candidate}`, candidate);
    }
  }
}

findings.sort((a, b) => `${a.type}|${a.file}|${a.reference}`.localeCompare(`${b.type}|${b.file}|${b.reference}`));
const fingerprints = findings.map((item) => `${item.type}|${item.file}|${item.reference}`);

if (updateBaseline) {
  writeFileSync(baselinePath, `${JSON.stringify({ version: 1, findings: fingerprints }, null, 2)}\n`);
  console.log(`Línea base actualizada con ${fingerprints.length} hallazgos conocidos.`);
  process.exit(0);
}

const baseline = existsSync(baselinePath)
  ? JSON.parse(readFileSync(baselinePath, 'utf8')).findings || []
  : [];
const known = new Set(baseline);
const current = new Set(fingerprints);
const regressions = findings.filter((item) => !known.has(`${item.type}|${item.file}|${item.reference}`));
const resolved = baseline.filter((fingerprint) => !current.has(fingerprint));

for (const item of findings) {
  const marker = known.has(`${item.type}|${item.file}|${item.reference}`) ? 'KNOWN' : 'NEW';
  console.log(`[${marker}] ${item.type}: ${item.file} — ${item.detail}`);
}
if (resolved.length) console.log(`\nHallazgos de la línea base que ya no aparecen: ${resolved.length}`);
console.log(`\nResumen: ${findings.length} hallazgos actuales, ${regressions.length} regresiones nuevas.`);

if (regressions.length) {
  console.error('La validación falló: documenta o corrige las regresiones nuevas antes de actualizar la línea base.');
  process.exit(1);
}


