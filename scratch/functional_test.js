// Functional test: simulate a page and check that the engine applies RTL correctly
const fs = require('fs');

class FakeClassList {
  constructor(){ this.s = new Set(); }
  add(...cs){ cs.forEach(c=>this.s.add(c)); } remove(...cs){ cs.forEach(c=>this.s.delete(c)); }
  contains(c){ return this.s.has(c); }
  forEach(fn){ [...this.s].forEach(fn); }
}
class FakeEl {
  constructor(tag, text){
    this.tagName = tag.toUpperCase(); this.nodeType = 1; this.attributes = {};
    this.classList = new FakeClassList(); this.children = []; this.childNodes = [];
    this.style = { _p:{}, removeProperty(k){ delete this._p[k]; } };
    this.id = ''; this.className = ''; this._text = text || ''; this.parentElement = null;
    this.shadowRoot = null; this.ownerDocument = doc;
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

const doc = {
  body: null, documentElement: null, head: null, readyState: 'complete',
  createElement: (t) => new FakeEl(t),
  getElementById: (id) => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
};
const body = new FakeEl('BODY'); doc.body = body;
const container = new FakeEl('DIV'); container.className = 'container';
const pFa = new FakeEl('P', 'این یک پاراگراف فارسی است');
const pEn = new FakeEl('P', 'English paragraph');
const row = new FakeEl('DIV');
row._text = 'متن مستقیم ';
const textNode = { nodeType: 3, textContent: 'متن مستقیم ' };
row.childNodes.push(textNode); row.appendChild(new FakeEl('B', 'تست'));
const ta = new FakeEl('TEXTAREA', 'متن فارسی در تکست‌اریا');
const cb = new FakeEl('INPUT'); cb.setAttribute('type','checkbox');
const ql = new FakeEl('DIV', 'rich'); ql.className = 'ql-editor';
const a = new FakeEl('A', 'لینک فارسی');
[container, pFa, pEn, row, ta, cb, ql, a].forEach(n => {
  if (n === container) body.appendChild(n);
  else container.appendChild(n);
});

global.document = doc;
global.location = { hostname: 'example.com', host: 'example.com', href: 'https://example.com/', protocol: 'https:' };
global.window = global; global.top = global; global.self = global;
global.Node = { TEXT_NODE: 3, ELEMENT_NODE: 1 };
let lastObserver = null;
class FakeMutationObserver { constructor(cb){ this.cb = cb; lastObserver = this; } observe(){} disconnect(){} }
global.MutationObserver = FakeMutationObserver;
global.chrome = {
  runtime: { onMessage: { addListener(){} } },
  storage: {
    sync: { get(defs, cb){ cb({ ...defs, registered: true, enabled: true, mode: 'auto', font: 'vazir' }); },
           set(o, cb){ cb && cb(); } },
    onChanged: { addListener(){} }
  }
};

require('/home/user/Smart-Multi-RTL-Pro/content.js');

console.log('engine active flag:', global.__SMART_RTL_PRO_ACTIVE__ === true ? 'OK' : 'MISSING');
console.log('pFa dir:', pFa.getAttribute('dir'), '| class right:', pFa.classList.contains('smart-rtl-text-right'), '(expect rtl / true)');
console.log('pEn dir:', pEn.getAttribute('dir'), '| class right:', pEn.classList.contains('smart-rtl-text-right'), '(expect null / false)');
console.log('row dir:', row.getAttribute('dir'), '(expect rtl - direct text div)');
console.log('a dir:', a.getAttribute('dir'), '(expect rtl - Persian link)');
console.log('textarea dir:', ta.getAttribute('dir'), '(expect rtl - Persian textarea)');
console.log('checkbox dir:', cb.getAttribute('dir'), '(expect null - non-text input)');
console.log('ql-editor dir:', ql.getAttribute('dir'), '(expect null - rich editor)');

// Now simulate SPA mutations: new elements added dynamically
const newP = new FakeEl('P', 'پاراگراف داینامیک جدید');
if (lastObserver) {
  lastObserver.cb([{ type: 'childList', addedNodes: [newP] }]);
}
setTimeout(() => console.log('dynamic p dir:', newP.getAttribute('dir'), '(expect rtl - observer path)'), 300);
