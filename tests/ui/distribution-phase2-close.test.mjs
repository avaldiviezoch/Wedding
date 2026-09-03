import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const p2 = readFileSync(new URL('../../pruebas/distribucion/phase2-p2.js', import.meta.url), 'utf8');
const closeSource = readFileSync(new URL('../../pruebas/distribucion/phase2-p2-close.js', import.meta.url), 'utf8');
const host = readFileSync(new URL('../../pruebas/distribucion/phase2-host.js', import.meta.url), 'utf8');

const forbiddenPersistence = /\b(?:localStorage|sessionStorage|indexedDB|firebase|firestore|setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/i;

class ClassList {
  constructor(...names) { this.values = new Set(names); }
  add(...names) { names.forEach((name) => this.values.add(name)); }
  remove(...names) { names.forEach((name) => this.values.delete(name)); }
  contains(name) { return this.values.has(name); }
  toggle(name, force) {
    const enabled = force === undefined ? !this.contains(name) : Boolean(force);
    if (enabled) this.add(name); else this.remove(name);
    return enabled;
  }
}

function node(id = '', classes = []) {
  return {
    id,
    classList: new ClassList(...classes),
    style: { setProperty() {}, removeProperty(name) { delete this[name]; } },
    dataset: {},
    children: [],
    textContent: '',
    scrollHeight: 260,
    offsetHeight: 56,
    listeners: {},
    append(...children) { this.children.push(...children); },
    appendChild(child) { this.children.push(child); return child; },
    insertBefore(child) { this.children.push(child); return child; },
    remove() {},
    click() { this.listeners.click?.forEach((fn) => fn({ target: this, preventDefault() {}, stopImmediatePropagation() {} })); },
    addEventListener(type, handler) { (this.listeners[type] ||= []).push(handler); },
    setAttribute(name, value) { this[name] = String(value); },
    getBoundingClientRect() { return this.rect || { top: 700, bottom: 756, left: 0, right: 56, width: 56, height: 56 }; },
    closest() { return this; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    replaceChildren(...children) { this.children = children; }
  };
}

function makeCloseRuntime() {
  const fab = node('p2MobileFab', ['p2-mobile-fab']);
  const actions = node('p2MobileActions', ['p2-mobile-sheet']);
  const backdrop = node('p2MobileBackdrop', ['p2-mobile-backdrop']);
  const tools = node('', ['tools-panel']);
  const props = node('', ['properties-panel']);
  const nodes = { p2MobileFab: fab, p2MobileActions: actions, p2MobileBackdrop: backdrop };
  const documentListeners = {};
  const context = {
    console,
    Math,
    Object,
    window: {
      innerHeight: 844,
      addEventListener() {}
    },
    requestAnimationFrame(fn) { fn(); },
    document: {
      documentElement: { dataset: {} },
      getElementById(id) { return nodes[id] || null; },
      querySelector(selector) {
        if (selector === '.tools-panel') return tools;
        if (selector === '.properties-panel') return props;
        if (selector.includes('.tools-panel.p2-sheet-open') && tools.classList.contains('p2-sheet-open')) return tools;
        if (selector.includes('.properties-panel.p2-sheet-open') && props.classList.contains('p2-sheet-open')) return props;
        return null;
      },
      addEventListener(type, handler) { (documentListeners[type] ||= []).push(handler); }
    }
  };
  vm.createContext(context);
  vm.runInContext(closeSource, context, { filename: 'phase2-p2-close.js' });
  return { context, fab, actions, backdrop, tools, props, documentListeners };
}

test('P2.1 carga después de P2 y sigue sin persistencia real', () => {
  assert.match(host, /script\.onload\s*=\s*\(\)\s*=>\s*loadP2Close\(doc\)/);
  assert.match(host, /phase2-p2-close\.js\?v=20260903-p21-1/);
  assert.doesNotMatch(closeSource, forbiddenPersistence);
  assert.doesNotThrow(() => new Function(closeSource));
});

test('Escape cierra sheets, menú, backdrop y restablece FAB', () => {
  const { fab, actions, backdrop, tools, documentListeners } = makeCloseRuntime();
  tools.classList.add('p2-sheet-open');
  actions.classList.add('show');
  backdrop.classList.add('show');
  fab.textContent = '×';

  const event = { key: 'Escape', prevented: false, preventDefault() { this.prevented = true; } };
  documentListeners.keydown[0](event);

  assert.equal(event.prevented, true);
  assert.equal(tools.classList.contains('p2-sheet-open'), false);
  assert.equal(actions.classList.contains('show'), false);
  assert.equal(backdrop.classList.contains('show'), false);
  assert.equal(fab.textContent, '+');
  assert.match(String(fab.style.bottom), /safe-area-inset-bottom/);
});

test('FAB se posiciona sobre el sheet y el menú decide arriba/abajo por espacio disponible', () => {
  const { context, fab, actions, tools } = makeCloseRuntime();
  tools.classList.add('p2-sheet-open');
  tools.rect = { top: 500, bottom: 840, left: 0, right: 390, width: 390, height: 340 };
  context.window.MiGranDiaDistributionPhase2Close.positionFabAboveSheet(tools);
  assert.ok(parseFloat(fab.style.bottom) > 300);

  fab.rect = { top: 90, bottom: 146, left: 320, right: 376, width: 56, height: 56 };
  context.window.MiGranDiaDistributionPhase2Close.updateFabMenuDirection();
  assert.equal(actions.classList.contains('p2-menu-down'), true);

  fab.rect = { top: 700, bottom: 756, left: 320, right: 376, width: 56, height: 56 };
  context.window.MiGranDiaDistributionPhase2Close.updateFabMenuDirection();
  assert.equal(actions.classList.contains('p2-menu-up'), true);
});

test('contrato JSON mantiene versión, límites y referencias de asientos válidas', () => {
  assert.match(p2, /const SESSION_VERSION = 2/);
  assert.match(p2, /const MAX_PROPOSALS = 20/);
  assert.match(p2, /file\.size > 5 \* 1024 \* 1024/);
  assert.match(p2, /table\.seats = table\.seats\.map\(\(id\) => id && guestIds\.has\(id\) \? id : null\)/);
  assert.match(p2, /proposals = imported/);
  assert.match(p2, /restoreState\(clone\(active\.state\)\)/);
  assert.doesNotMatch(p2, forbiddenPersistence);
});
