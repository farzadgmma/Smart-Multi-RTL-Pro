// Mode tests: forced rtl/ltr, number conversion, manual toggle
const fs = require('fs');

class FakeClassList {
  constructor(){ this.s = new Set(); }
  add(...cs){ cs.forEach(c=>this.s.add(c)); } remove(...cs){ cs.forEach(c=>this.s.delete(c)); }
  contains(c){ return this.s.has(c); }
  forEach(fn){ [...this.s].forEach(fn); }
}
class FakeEl {
  constructor(tag, text, label){
    this.tagName = tag.toUpperCase(); this.nodeType = 1; this.attributes = {};
    this.classList = new FakeClassList(); this.children = []; this.childNodes = [];
    this.style = { _p:{}, removeProperty(k){ delete this._p[k]; } };
    this.id = ''; this.className = ''; this._text = text || ''; this.parentElement = null;
    this.shadowRoot = null; this._label = label || tag;
  }
  get value(){ return this._value !== undefined ? this._value : this._text; }
  set value(v){ this._value = v; }
  setAttribute(k,v){ this.attributes[k]=v; }
  getAttribute(k){ return k in this.attributes ? this.attributes[k] : null; }
  removeAttribute(k){ delete this.attributes[k]; }
  hasAttribute(k){ return k in this.attributes; }
  get textContent(){ return this._text; } set textContent(v){ this._text = v; }
  appendChild(c){ c.parentElement = this; this.children.push(c); this.childNodes.push(c); return c; }
  remove(){ if (this.parentElement){ const i = this.parentElement.children.indexOf(this); if(i>=0) this.parentElement.children.splice(i,1); } }
  closest(sel){
    const matchSel = (el, s) => {
      if (s.startsWith('#')) return el.id === s.slice(1);
      if (s.startsWith('[')) { const k = s.slice(1, -1).split('=')[0]; return el.hasAttribute(k); }
      if (s.startsWith('.')) return el.classList.contains(s.slice(1));
      return el.tagName === s.toUpperCase();
    };
    let el = this;
    while (el) {
      if (sel.split(',').some(s => matchSel(el, s.trim()))) return el;
      el = el.parentElement;
    }
    return null;
  }
  querySelectorAll(sel){
    const out = [];
    const walk = (el) => {
      for (const c of el.children) {
        const m = (s) => { s = s.trim(); return s.startsWith('.') ? c.classList.contains(s.slice(1)) : c.tagName === s.toUpperCase(); };
        if (sel.split(',').some(m)) out.push(c);
        walk(c);
      }
    };
    walk(this);
    return out;
  }
}

function boot(storedSettings) {
  const doc = {
    body: null, documentElement: null, head: null, readyState: 'complete',
    createElement: (t) => new FakeEl(t),
    getElementById: (id) => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
  };
  const body = new FakeEl('BODY'); doc.body = body;
  const pFa = new FakeEl('P', 'این یک پاراگراف فارسی است', 'pFa');
  const pEn = new FakeEl('P', 'English paragraph', 'pEn');
  const pMix = new FakeEl('P', 'قیمت 1500 تومان', 'pMix');
  // model real DOM: text lives in a TEXT_NODE child
  for (const p of [pFa, pEn, pMix]) {
    const tn = { nodeType: 3, textContent: p._text };
    Object.defineProperty(tn, 'textContent', {
      get() { return p._text; },
      set(v) { p._text = v; }
    });
    p.childNodes.push(tn);
  }
  body.appendChild(pFa); body.appendChild(pEn); body.appendChild(pMix);

  global.document = doc;
  global.location = { hostname: 'example.com', host: 'example.com', href: 'https://example.com/', protocol: 'https:' };
  global.window = global; global.top = global; global.self = global;
  global.Node = { TEXT_NODE: 3, ELEMENT_NODE: 1 };
  class FakeMutationObserver { constructor(cb){ this.cb = cb; } observe(){} disconnect(){} }
  global.MutationObserver = FakeMutationObserver;
  global.chrome = {
    runtime: { onMessage: { addListener(){} } },
    storage: {
      sync: { get(defs, cb){ cb({ ...defs, registered: true, enabled: true, ...storedSettings }); },
             set(o, cb){ cb && cb(); } },
      onChanged: { addListener(){} }
    }
  };
  // reset engine double-injection guard + module cache between boots
  delete global.__SMART_RTL_PRO_ACTIVE__;
  delete require.cache[require.resolve('/home/user/Smart-Multi-RTL-Pro/content.js')];
  require('/home/user/Smart-Multi-RTL-Pro/content.js');
  return { pFa, pEn, pMix };
}

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log('  PASS:', name); }
  else { fail++; console.log('  FAIL:', name); }
}

// Test 1: forced RTL mode applies to ALL text elements
console.log('-- forced rtl mode --');
{
  const { pFa, pEn, pMix } = boot({ mode: 'rtl' });
  check('Persian p -> rtl', pFa.getAttribute('dir') === 'rtl');
  check('English p -> rtl (forced)', pEn.getAttribute('dir') === 'rtl');
  check('mixed p -> rtl', pMix.getAttribute('dir') === 'rtl');
}

// Test 2: forced LTR mode applies to all
console.log('-- forced ltr mode --');
{
  const { pFa, pEn } = boot({ mode: 'ltr' });
  check('Persian p -> ltr (forced)', pFa.getAttribute('dir') === 'ltr');
  check('English p -> ltr', pEn.getAttribute('dir') === 'ltr');
}

// Test 3: convertNumbers
console.log('-- convert numbers --');
{
  const { pMix } = boot({ mode: 'auto', convertNumbers: true });
  check('digits converted to Persian', pMix._text === 'قیمت ۱۵۰۰ تومان');
}

// Test 4: auto mode leaves English alone
console.log('-- auto mode --');
{
  const { pFa, pEn } = boot({ mode: 'auto' });
  check('Persian p -> rtl', pFa.getAttribute('dir') === 'rtl');
  check('English p untouched', pEn.getAttribute('dir') === null);
}

console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;
