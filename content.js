
/**
* Smart Multi-RTL Pro Engine v4.2
* Fixes:
*  - Double injection guard (root cause of broken Persian typing)
*  - contenteditable descendant misdetection
*  - document_start / body-not-ready race condition
*  - forced-LTR-while-typing bug
*/


(() => {
'use strict';


// 🛡️ جلوگیری از اجرای دوباره در صورت تزریق مضاعف (root cause اصلی باگ تایپ)
if (window.__SMART_RTL_PRO_ACTIVE__) {
return;
}
window.__SMART_RTL_PRO_ACTIVE__ = true;


const PERSIAN_ARABIC_REGEX = /[\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFE]/;
const PERSIAN_ARABIC_REGEX_G = /[\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFE]/g;
const ENGLISH_REGEX = /[a-zA-Z]/g;
const ENGLISH_DIGITS_REGEX = /[0-9]/g;
const PERSIAN_DIGITS_MAP = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];


const IGNORE_TAGS = new Set([
'HTML', 'BODY', 'SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'CODE', 'PRE',
'BUTTON', 'NAV', 'HEADER', 'FOOTER', 'ASIDE', 'CANVAS', 'IFRAME', 'FORM',
'MAIN', 'SECTION', 'ARTICLE', 'UL', 'OL', 'TABLE', 'TR', 'TBODY', 'THEAD'
]);


const RICH_EDITOR_SELECTOR = [
'.ql-editor', '.ProseMirror', '.DraftEditor-root', '.public-DraftEditor-content',
'[data-slate-editor="true"]', '.monaco-editor', '.CodeMirror', '.cke_editable',
'.tiptap', '.notion-page-content', '[g_editable="true"]', 'textarea.ace_text-input'
].join(', ');


const MANUAL_ATTR = 'data-smart-rtl-manual';
const OWN_DIR_ATTR = 'data-smart-rtl-dir';


const TARGET_SELECTOR = 'p, span, div, li, a, h1, h2, h3, h4, h5, h6, blockquote, td, th, label, figcaption';
const EDITABLE_SELECTOR = 'input, textarea, [contenteditable="true"], [contenteditable=""]';


let settings = {
registered: false,
enabled: true,
mode: 'auto',
font: 'vazir',
fontSize: '100',
lineHeight: 'normal',
convertNumbers: false,
showWidget: false,
disabledSites: []
};


let lastContextElement = null;


const FONT_CLASSES = [
'smart-rtl-font-vazir', 'smart-rtl-font-yekan', 'smart-rtl-font-shabnam',
'smart-rtl-font-samim', 'smart-rtl-font-sahel', 'smart-rtl-font-parastoo'
];


const isSiteDisabled = () => {
if (!settings.registered) return true;
if (!settings.enabled) return true;


const host = location.hostname.toLowerCase();
if (Array.isArray(settings.disabledSites)) {
return settings.disabledSites.some(site => {
const s = site.toLowerCase().trim();
return host === s || host.endsWith('.' + s) || s.endsWith('.' + host);
});
}
return false;
};


/* ---------------------------------------------------------
* Style Injection
* --------------------------------------------------------- */
function injectInlineStyles() {
if (isSiteDisabled()) {
removeInlineStyles();
return;
}
if (document.getElementById('smart-rtl-style-root')) return;
const style = document.createElement('style');
style.id = 'smart-rtl-style-root';
style.textContent = `
.smart-rtl-text-right { direction: rtl !important; text-align: right !important; }

.smart-rtl-text-left { direction: ltr !important; text-align: left !important; }
.smart-rtl-font-vazir { font-family: 'Vazirmatn', -apple-system, sans-serif !important; }
.smart-rtl-font-yekan { font-family: 'IRANYekanWeb', 'B Yekan', 'Yekan', sans-serif !important; }
.smart-rtl-font-shabnam { font-family: 'Shabnam', sans-serif !important; }
.smart-rtl-font-samim { font-family: 'Samim', sans-serif !important; }
.smart-rtl-font-sahel { font-family: 'Sahel', sans-serif !important; }
.smart-rtl-font-parastoo { font-family: 'Parastoo', sans-serif !important; }
.smart-rtl-size-110 { font-size: 110% !important; }
.smart-rtl-size-120 { font-size: 120% !important; }
.smart-rtl-size-130 { font-size: 130% !important; }
.smart-rtl-lh-relaxed { line-height: 1.8 !important; }
.smart-rtl-lh-loose { line-height: 2.1 !important; }
`;
(document.head || document.documentElement).appendChild(style);
}


function removeInlineStyles() {
const style = document.getElementById('smart-rtl-style-root');
if (style) style.remove();
}


function translatePageToPersian() {
if (isSiteDisabled()) return;
if (window.location.host.includes('translate.goog') || window.location.host.includes('translate.google')) return;
const targetUrl = `https://translate.google.com/translate?sl=auto&tl=fa&u=${encodeURIComponent(window.location.href)}`;
window.location.href = targetUrl;
}


function convertDigitsToPersian(text) {
if (!text) return text;
return text.replace(ENGLISH_DIGITS_REGEX, (digit) => PERSIAN_DIGITS_MAP[parseInt(digit, 10)]);
}


/* ---------------------------------------------------------
* Text Detection
* --------------------------------------------------------- */
function isPersianArabicText(text) {
if (!text || typeof text !== 'string') return false;
const trimmed = text.trim();
if (!trimmed) return false;


if (!PERSIAN_ARABIC_REGEX.test(trimmed)) return false;


const rtlMatches = trimmed.match(PERSIAN_ARABIC_REGEX_G) || [];
const engMatches = trimmed.match(ENGLISH_REGEX) || [];
const totalLetters = rtlMatches.length + engMatches.length;


if (totalLetters === 0) return false;


if (trimmed.length <= 3) return rtlMatches.length > 0;


const rtlRatio = rtlMatches.length / totalLetters;
const firstWordIsRtl = PERSIAN_ARABIC_REGEX.test(trimmed.substring(0, 10));


return rtlRatio >= 0.3 || firstWordIsRtl;
}


/* ---------------------------------------------------------
* Editor / UI detection guards
* --------------------------------------------------------- */
function isRichEditorArea(el) {
if (!el) return false;
return !!(el.closest && el.closest(RICH_EDITOR_SELECTOR));
}


function isInsideEditableDescendant(el) {
const root = el.closest && el.closest('[contenteditable="true"], [contenteditable=""]');
return !!root && root !== el;
}


function isEditableRoot(el) {
if (!el || el.nodeType !== 1) return false;
if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return true;
const ce = el.getAttribute('contenteditable');
return ce === 'true' || ce === '';
}


function isLayoutContainerOrUi(el) {
if (!el || el.nodeType !== 1) return true;
if (IGNORE_TAGS.has(el.tagName)) return true;


const className = typeof el.className === 'string' ? el.className.toLowerCase() : '';
const role = el.getAttribute('role') || '';


if (
role === 'button' || role === 'navigation' || role === 'menu' || role === 'menubar' || role === 'dialog' ||
className.includes('btn') || className.includes('button') || className.includes('nav') ||
className.includes('menu') || className.includes('sidebar') || className.includes('navbar') ||
className.includes('flex') || className.includes('grid') || className.includes('container') ||
className.includes('wrapper') || className.includes('row') || className.includes('column') ||
className.includes('hljs') || className.includes('katex') ||
el.hasAttribute('data-smart-rtl-ignore') || el.id === 'smart-rtl-floating-widget'
) {
return true;
}


if (el.closest('pre, code, button, nav, #smart-rtl-floating-widget')) {
return true;
}


return false;
}


/* ---------------------------------------------------------
* Style / Font application
* --------------------------------------------------------- */
function applyStylesAndFont(el) {
if (isSiteDisabled()) return;


FONT_CLASSES.forEach(cls => {
if (el.classList.contains(cls)) el.classList.remove(cls);
});


if (settings.font && settings.font !== 'system') {
const cls = `smart-rtl-font-${settings.font}`;
if (!el.classList.contains(cls)) el.classList.add(cls);
}


const sizeClasses = ['smart-rtl-size-110', 'smart-rtl-size-120', 'smart-rtl-size-130'];
sizeClasses.forEach(c => el.classList.remove(c));
if (settings.fontSize && settings.fontSize !== '100') {
el.classList.add(`smart-rtl-size-${settings.fontSize}`);
}


const lhClasses = ['smart-rtl-lh-relaxed', 'smart-rtl-lh-loose'];
lhClasses.forEach(c => el.classList.remove(c));
if (settings.lineHeight && settings.lineHeight !== 'normal') {
el.classList.add(`smart-rtl-lh-${settings.lineHeight}`);
}
}


const isNativeRtlSite = () => {
return document.documentElement?.dir === 'rtl' || document.body?.dir === 'rtl';
};


/* ---------------------------------------------------------
* Set/Clear direction for NORMAL block elements
* --------------------------------------------------------- */
function setRtl(el) {
if (isSiteDisabled()) return;


if (el.getAttribute('dir') !== 'rtl') {
el.setAttribute('dir', 'rtl');
el.setAttribute(OWN_DIR_ATTR, 'true');
}


if (!isNativeRtlSite() && !el.classList.contains('smart-rtl-text-right')) {
el.classList.add('smart-rtl-text-right');
}
el.classList.remove('smart-rtl-text-left');
applyStylesAndFont(el);


if (settings.convertNumbers && ['P', 'LI', 'SPAN', 'DIV', 'TD', 'TH', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(el.tagName)) {
for (let i = 0; i < el.childNodes.length; i++) {
const child = el.childNodes[i];
if (child.nodeType === Node.TEXT_NODE && child.textContent) {
child.textContent = convertDigitsToPersian(child.textContent);
}
}
}
}


function setLtr(el) {
if (isSiteDisabled()) return;
if (el.getAttribute('dir') !== 'ltr') {
el.setAttribute('dir', 'ltr');
el.setAttribute(OWN_DIR_ATTR, 'true');
}
if (!el.classList.contains('smart-rtl-text-left')) el.classList.add('smart-rtl-text-left');
el.classList.remove('smart-rtl-text-right');
FONT_CLASSES.forEach(cls => el.classList.remove(cls));
el.style.removeProperty('font-family');
}


function clearDirection(el) {
if (el.getAttribute(OWN_DIR_ATTR) === 'true') {
el.removeAttribute('dir');
el.removeAttribute(OWN_DIR_ATTR);
}
el.classList.remove('smart-rtl-text-right', 'smart-rtl-text-left');
el.classList.remove('smart-rtl-size-110', 'smart-rtl-size-120', 'smart-rtl-size-130');
el.classList.remove('smart-rtl-lh-relaxed', 'smart-rtl-lh-loose');
FONT_CLASSES.forEach(cls => el.classList.remove(cls));
el.style.removeProperty('font-family');
el.style.removeProperty('direction');
el.style.removeProperty('text-align');
}


/* ---------------------------------------------------------
* Gentle handling for EDITABLE ROOTS (input/textarea/contenteditable root)
* --------------------------------------------------------- */
function setDirSoft(el, dir) {
if (el.getAttribute('dir') === dir) return;
el.setAttribute('dir', dir);
el.setAttribute(OWN_DIR_ATTR, 'true');
}


function processEditableRoot(el) {
if (isSiteDisabled()) return;
if (el.hasAttribute(MANUAL_ATTR)) return;
if (isRichEditorArea(el)) return;


let val;
if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
val = el.value || el.getAttribute('placeholder') || '';
} else {
val = el.textContent || '';
}


const trimmed = val.trim();
if (!trimmed) return;


if (settings.mode === 'ltr') {
setDirSoft(el, 'ltr');
return;
}


if (settings.mode === 'rtl') {
if (isPersianArabicText(val)) setDirSoft(el, 'rtl');
return;
}


if (isPersianArabicText(val)) {
setDirSoft(el, 'rtl');
} else if (el.getAttribute(OWN_DIR_ATTR) === 'true' && trimmed.length >= 3) {
setDirSoft(el, 'ltr');
}


if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
applyStylesAndFont(el);
}
}


/* ---------------------------------------------------------
* Main processing
* --------------------------------------------------------- */
function processElement(el) {
if (isSiteDisabled()) return;
if (!el || el.nodeType !== 1) return;
if (el.hasAttribute(MANUAL_ATTR)) return;


if (isEditableRoot(el)) {
processEditableRoot(el);
return;
}


if (isInsideEditableDescendant(el) || isRichEditorArea(el)) {
return;
}


if (isLayoutContainerOrUi(el)) return;


const BLOCK_TAG_NAMES = new Set(['P', 'DIV', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'TD', 'TH', 'LABEL', 'FIGCAPTION', 'SECTION', 'ARTICLE', 'UL', 'OL', 'TABLE', 'FORM']);

function hasBlockChildren(elem) {
    if (!elem || !elem.children) return false;
    for (let i = 0; i < elem.children.length; i++) {
        if (BLOCK_TAG_NAMES.has(elem.children[i].tagName)) {
            return true;
        }
    }
    return false;
}

if (el.tagName === 'DIV' && hasBlockChildren(el)) {
    return;
}
if (el.tagName === 'A' && el.children.length > 0) {
    return;
}


const isTextTarget = ['P', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'TD', 'TH', 'LABEL', 'FIGCAPTION', 'SPAN', 'DIV'].includes(el.tagName);
if (!isTextTarget) return;


const text = el.textContent || '';
if (!text || text.trim().length < 1) return;


if (settings.mode === 'rtl') {
if (isPersianArabicText(text)) setRtl(el);
} else if (settings.mode === 'ltr') {
setLtr(el);
} else {
if (isPersianArabicText(text)) {
setRtl(el);
} else if (el.classList.contains('smart-rtl-text-right')) {
clearDirection(el);
}
}
}


/* ---------------------------------------------------------
* Scanning
* --------------------------------------------------------- */
function scanNodeTree(root) {
if (isSiteDisabled() || !root) return;


if (root.nodeType === 1) {
if (isRichEditorArea(root) || isInsideEditableDescendant(root)) return;


processElement(root);


const nodes = root.querySelectorAll
? root.querySelectorAll(`${TARGET_SELECTOR}, ${EDITABLE_SELECTOR}`)
: [];


for (let i = 0; i < nodes.length; i++) {
const node = nodes[i];
if (isRichEditorArea(node) || isInsideEditableDescendant(node)) continue;
processElement(node);
if (node.shadowRoot) scanNodeTree(node.shadowRoot);
}
}
}


function fullScan() {
if (isSiteDisabled()) {
removeAllStyles();
removeFloatingWidget();
removeInlineStyles();
return;
}
injectInlineStyles();
scanNodeTree(document.body);
renderFloatingWidget();
}


function removeAllStyles() {
const fontSelector = FONT_CLASSES.map(c => '.' + c).join(', ');
const selector = `.smart-rtl-text-right, .smart-rtl-text-left, ${fontSelector}, [${OWN_DIR_ATTR}="true"]`;


document.querySelectorAll(selector).forEach(el => {
if (!el.hasAttribute(MANUAL_ATTR)) clearDirection(el);
});


removeFloatingWidget();
removeInlineStyles();
}


/* ---------------------------------------------------------
* Floating Widget (فقط در فریم اصلی نمایش داده می‌شود)
* --------------------------------------------------------- */
function renderFloatingWidget() {
if (window.top !== window.self) return; // جلوگیری از رندر تکراری داخل iframe ها


let widget = document.getElementById('smart-rtl-floating-widget');
if (!settings.showWidget || isSiteDisabled()) {
removeFloatingWidget();
return;
}


if (!widget) {
widget = document.createElement('div');
widget.id = 'smart-rtl-floating-widget';
widget.setAttribute('data-smart-rtl-ignore', 'true');
widget.innerHTML = '⇄';
widget.title = 'تغییر جهت سریع متون (RTL / LTR / خودکار)';
widget.addEventListener('click', () => {
if (isSiteDisabled()) return;
if (settings.mode === 'auto') settings.mode = 'rtl';
else if (settings.mode === 'rtl') settings.mode = 'ltr';
else settings.mode = 'auto';


document.body.setAttribute('data-smart-rtl-mode', settings.mode);
fullScan();
});
(document.body || document.documentElement).appendChild(widget);
}
}


function removeFloatingWidget() {
const widget = document.getElementById('smart-rtl-floating-widget');
if (widget) widget.remove();
}


/* ---------------------------------------------------------
* MutationObserver (throttled)
* --------------------------------------------------------- */
let pendingNodes = new Set();
let timer = null;


const observer = new MutationObserver((mutations) => {
if (isSiteDisabled()) return;
for (let i = 0; i < mutations.length; i++) {
const m = mutations[i];
let targetEl = null;


if (m.type === 'childList') {
for (let j = 0; j < m.addedNodes.length; j++) {
const node = m.addedNodes[j];
if (node.nodeType === 1) {
if (isRichEditorArea(node) || isInsideEditableDescendant(node)) continue;
pendingNodes.add(node);
}
}
continue;
} else if (m.type === 'characterData' && m.target.parentElement) {
targetEl = m.target.parentElement;
}


if (targetEl) {
if (isRichEditorArea(targetEl) || isInsideEditableDescendant(targetEl)) continue;
pendingNodes.add(targetEl);
}
}


if (pendingNodes.size && !timer) {
timer = setTimeout(() => {
const nodes = [...pendingNodes];
pendingNodes.clear();
timer = null;
nodes.forEach(scanNodeTree);
}, 120);
}
});


function startObserving() {
if (document.body) {
observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}
}


/* ---------------------------------------------------------
* Wait for document.body to exist (document_start race condition fix)
* --------------------------------------------------------- */
function whenBodyReady(cb) {
if (document.body) {
cb();
return;
}
const obs = new MutationObserver(() => {
if (document.body) {
obs.disconnect();
cb();
}
});
obs.observe(document.documentElement, { childList: true });
}


/* ---------------------------------------------------------
* Context menu / focus tracking
* --------------------------------------------------------- */
document.addEventListener('contextmenu', e => { lastContextElement = e.target; }, true);
document.addEventListener('focusin', e => {
if (e.target?.tagName === 'TEXTAREA' || e.target?.isContentEditable || e.target?.tagName === 'INPUT') {
lastContextElement = e.target;
}
}, true);


function toggleElementDirection(el) {
if (isSiteDisabled()) return;
if (!el || el === document.body) return;


const target =
el.closest('[contenteditable="true"], [contenteditable=""]') ||
el.closest('input, textarea') ||
el.closest('p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th, label, span, div') ||
el;


target.setAttribute(MANUAL_ATTR, 'true');
const currentDir = target.getAttribute('dir') || getComputedStyle(target).direction;


if (isEditableRoot(target)) {
setDirSoft(target, currentDir === 'rtl' ? 'ltr' : 'rtl');
} else {
if (currentDir === 'rtl') setLtr(target);
else setRtl(target);
}
}


/* ---------------------------------------------------------
* Debounced input handling
* --------------------------------------------------------- */
const inputTimers = new WeakMap();


document.addEventListener('input', (e) => {
if (isSiteDisabled()) return;
const target = e.target;
if (!target || target.nodeType !== 1) return;


const isEditable = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || isEditableRoot(target);
if (!isEditable) return;
if (isRichEditorArea(target)) return;


if (inputTimers.has(target)) clearTimeout(inputTimers.get(target));
const t = setTimeout(() => {
processEditableRoot(target);
inputTimers.delete(target);
}, 150);
inputTimers.set(target, t);
}, true);


/* ---------------------------------------------------------
* Messaging
* --------------------------------------------------------- */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
if (msg.action === 'PING') {
sendResponse({ status: 'alive' });
return true;
}
if (msg.action === 'TOGGLE_CURRENT_ELEMENT_RTL') {
toggleElementDirection(lastContextElement || document.activeElement);
sendResponse({ status: 'ok' });
} else if (msg.action === 'TRANSLATE_PAGE_FA') {
translatePageToPersian();
sendResponse({ status: 'ok' });
} else if (msg.action === 'SETTINGS_UPDATED') {
loadSettings(() => {
if (isSiteDisabled()) removeAllStyles();
else fullScan();
});
sendResponse({ status: 'ok' });
}
return true;
});


function loadSettings(cb) {
chrome.storage.sync.get(
{ registered: false, enabled: true, mode: 'auto', font: 'vazir', fontSize: '100', lineHeight: 'normal', convertNumbers: false, showWidget: false, disabledSites: [] },
(res) => {
settings = { ...settings, ...res };
cb && cb();
}
);
}


chrome.storage.onChanged.addListener((changes) => {
for (const k in changes) settings[k] = changes[k].newValue;
if (isSiteDisabled()) removeAllStyles();
else fullScan();
});


// Start Engine
loadSettings(() => {
whenBodyReady(() => {
if (isSiteDisabled()) {
removeAllStyles();
} else {
fullScan();
startObserving();
}
});
});


})();