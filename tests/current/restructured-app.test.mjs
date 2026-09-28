import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const root = resolve(process.cwd(), 'app_integral');

test('la producción usa la arquitectura reestructurada', () => {
  for (const path of [
    'index.html',
    'src/services/firebase-client.js',
    'src/services/wedding-context.js',
    'src/modules/checklist/index.js',
    'src/modules/presupuesto/index.js',
    'src/modules/proveedores/index.js',
    'src/modules/invitados/index.js',
    'src/modules/distribucion/index.js',
    'src/modules/cronograma/index.js',
    'src/modules/invitaciones/index.js',
    'src/modules/musica/index.js'
  ]) {
    assert.equal(existsSync(resolve(root, path)), true, `Falta ${path}`);
  }
});

test('no reaparecen entradas ni carpetas legacy dentro de app_integral', () => {
  for (const path of ['applu.html', 'appludesktop.html', 'applumovil.html', 'js', 'css', 'legacy', 'legacy_snapshots']) {
    assert.equal(existsSync(resolve(root, path)), false, `No debe existir app_integral/${path}`);
  }
});

test('la entrada principal no depende del árbol de desarrollo', () => {
  const html = readFileSync(resolve(root, 'index.html'), 'utf8');
  assert.equal(html.includes('../mi-gran-dia/'), false);
  for (const icon of ['checklist','presupuesto','proveedores','invitados','distribucion','cronograma','invitaciones','musica']) {
    assert.equal(existsSync(resolve(root, 'assets/icons', `${icon}.png`)), true, `Falta icono PNG original ${icon}.png`);
  }
});

test('los estilos productivos no usan !important', () => {
  const cssFiles = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = resolve(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.css')) cssFiles.push(full);
    }
  };
  walk(root);
  for (const file of cssFiles) {
    assert.equal(readFileSync(file, 'utf8').includes('!important'), false, `!important encontrado en ${file}`);
  }
});
