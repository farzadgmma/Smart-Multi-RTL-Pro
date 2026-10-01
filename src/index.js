/**
 * @mobtakerai/rtl-pro
 * Smart Multi-RTL Pro Engine v6.0 (High-Precision & Zero-Latency Architecture)
 * Developed by MobtakerAi (مبتکران نیک افزار)
 *
 * Open-source high-performance text direction and typography engine
 * for web applications (React, Vue, Angular, Next.js, Vanilla JS) and extensions.
 */

// -------------------------------------------------------------
// Core Constants & Regular Expressions
// -------------------------------------------------------------
export const PERSIAN_ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFE]/;
export const PERSIAN_ARABIC_REGEX_G = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFE]/g;
export const ENGLISH_REGEX = /[a-zA-Z]/g;
export const HAS_ENGLISH_REGEX = /[a-zA-Z]/;
export const ENGLISH_DIGITS_REGEX = /[0-9]/g;
export const PERSIAN_DIGITS_MAP = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export const NON_TEXT_TAGS = new Set([
    'HTML', 'BODY', 'SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'CANVAS', 'IFRAME',
    'VIDEO', 'AUDIO', 'OBJECT', 'EMBED', 'NAV', 'FOOTER', 'HEADER'
]);

export const CODE_AND_EDITOR_SELECTORS = [
    'pre', 'code', 'kbd', 'samp', 'var',
    '.hljs', '.prism', '[class*="language-"]', '[class*="highlight-"]',
    '.monaco-editor', '.CodeMirror', '.cm-editor', '.ace_editor',
    '.ql-editor', '.ProseMirror', '.DraftEditor-root', '[data-slate-editor="true"]',
    '.tiptap', '.notion-page-content', '[g_editable="true"]', 'textarea.ace_text-input'
].join(', ');

export const MANUAL_ATTR = 'data-smart-rtl-manual';
export const OWN_DIR_ATTR = 'data-smart-rtl-dir';

export const TARGET_SELECTOR = 'p, div, li, ul, ol, h1, h2, h3, h4, h5, h6, blockquote, td, th, label, figcaption';
export const EDITABLE_SELECTOR = 'input, textarea, [contenteditable="true"], [contenteditable=""]';
export const BLOCK_TAG_NAMES = new Set(['P', 'DIV', 'LI', 'UL', 'OL', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'TD', 'TH', 'PRE', 'FORM', 'SECTION', 'ARTICLE']);
export const TEXT_BLOCK_SET = new Set(['P', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'TD', 'TH', 'LABEL', 'FIGCAPTION']);

export const FONT_CLASSES = [
    'smart-rtl-font-vazir', 'smart-rtl-font-yekan', 'smart-rtl-font-estedad',
    'smart-rtl-font-dana', 'smart-rtl-font-shabnam', 'smart-rtl-font-tanha',
    'smart-rtl-font-gandom', 'smart-rtl-font-nahid', 'smart-rtl-font-samim',
    'smart-rtl-font-sahel', 'smart-rtl-font-parastoo', 'smart-rtl-font-notosans',
    'smart-rtl-font-nazanin', 'smart-rtl-font-mitra', 'smart-rtl-font-yagut'
];

export const DEFAULT_STYLES = `
/* Smart Multi-RTL Pro CSS - Zero-Network Architecture */
html body .smart-rtl-text-right,
html body [dir="rtl"].smart-rtl-text-right,
html body [data-smart-rtl-dir="true"].smart-rtl-text-right {
    direction: rtl !important;
    text-align: right !important;
    unicode-bidi: isolate !important;
}
html body .smart-rtl-text-left,
html body [dir="ltr"].smart-rtl-text-left,
html body [data-smart-rtl-dir="true"].smart-rtl-text-left {
    direction: ltr !important;
    text-align: left !important;
    unicode-bidi: isolate !important;
}
ul.smart-rtl-text-right, ol.smart-rtl-text-right {
    direction: rtl !important;
    text-align: right !important;
    padding-right: 24px !important;
    padding-left: 0 !important;
}
li.smart-rtl-text-right {
    direction: rtl !important;
    text-align: right !important;
    unicode-bidi: isolate !important;
}
/* Bulletproof Code Block Immunity */
pre, code, kbd, samp, var,
.hljs, .prism, [class*="language-"], [class*="highlight-"],
.monaco-editor, .CodeMirror, .cm-editor, .ace_editor {
    direction: ltr !important;
    text-align: left !important;
    unicode-bidi: embed !important;
}
/* System & Local Persian Typography Fallback Chain */
.smart-rtl-font-vazir { font-family: 'Vazirmatn', 'Vazir', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Tahoma, sans-serif !important; }
.smart-rtl-font-yekan { font-family: 'IRANYekanWeb', 'IRANYekan', 'B Yekan', 'Yekan', 'Vazirmatn', Tahoma, sans-serif !important; }
.smart-rtl-font-estedad { font-family: 'Estedad', 'IRANYekanWeb', 'Vazirmatn', Tahoma, sans-serif !important; }
.smart-rtl-font-dana { font-family: 'Dana', 'IRANYekanWeb', 'Vazirmatn', Tahoma, sans-serif !important; }
.smart-rtl-font-shabnam { font-family: 'Shabnam', 'Vazirmatn', Tahoma, sans-serif !important; }
.smart-rtl-font-tanha { font-family: 'Tanha', 'Vazirmatn', Tahoma, sans-serif !important; }
.smart-rtl-font-gandom { font-family: 'Gandom', 'Vazirmatn', Tahoma, sans-serif !important; }
.smart-rtl-font-nahid { font-family: 'Nahid', 'Vazirmatn', Tahoma, sans-serif !important; }
.smart-rtl-font-samim { font-family: 'Samim', 'Vazirmatn', Tahoma, sans-serif !important; }
.smart-rtl-font-sahel { font-family: 'Sahel', 'Vazirmatn', Tahoma, sans-serif !important; }
.smart-rtl-font-parastoo { font-family: 'Parastoo', 'Vazirmatn', Tahoma, sans-serif !important; }
.smart-rtl-font-notosans { font-family: 'Noto Sans Arabic', 'Vazirmatn', Tahoma, sans-serif !important; }
.smart-rtl-font-nazanin { font-family: 'B Nazanin', 'IRANNazanin', 'Nazanin', 'Vazirmatn', Tahoma, sans-serif !important; }
.smart-rtl-font-mitra { font-family: 'B Mitra', 'IRANMitra', 'Mitra', 'Vazirmatn', Tahoma, sans-serif !important; }
.smart-rtl-font-yagut { font-family: 'B Yagut', 'IRANYagut', 'Yagut', 'Vazirmatn', Tahoma, sans-serif !important; }
.smart-rtl-size-110 { font-size: 110% !important; }
.smart-rtl-size-120 { font-size: 120% !important; }
.smart-rtl-size-130 { font-size: 130% !important; }
.smart-rtl-lh-relaxed { line-height: 1.8 !important; }
.smart-rtl-lh-loose { line-height: 2.1 !important; }
`;

// -------------------------------------------------------------
// Pure Utilities
// -------------------------------------------------------------
export function isPersianArabicText(text) {
    if (!text || typeof text !== 'string') return false;
    const trimmed = text.trim();
    return trimmed.length > 0 ? PERSIAN_ARABIC_REGEX.test(trimmed) : false;
}

export function isPureEnglishText(text) {
    if (!text || typeof text !== 'string') return false;
    const trimmed = text.trim();
    if (!trimmed) return false;
    return !PERSIAN_ARABIC_REGEX.test(trimmed) && HAS_ENGLISH_REGEX.test(trimmed);
}

export function convertDigitsToPersian(text) {
    if (!text || typeof text !== 'string') return text;
    return text.replace(ENGLISH_DIGITS_REGEX, (digit) => PERSIAN_DIGITS_MAP[parseInt(digit, 10)]);
}

// -------------------------------------------------------------
// DOM Inspector & Guard Caches (WeakMap Memoized)
// -------------------------------------------------------------
const codeOrEditorCache = new WeakMap();
const editableDescendantCache = new WeakMap();

export function isCodeOrEditorArea(el) {
    if (!el || el.nodeType !== 1) return false;
    if (codeOrEditorCache.has(el)) return codeOrEditorCache.get(el);

    let isCode = false;
    if (['PRE', 'CODE', 'KBD', 'SAMP', 'VAR'].includes(el.tagName)) {
        isCode = true;
    } else if (el.closest && el.closest(CODE_AND_EDITOR_SELECTORS)) {
        isCode = true;
    }

    codeOrEditorCache.set(el, isCode);
    return isCode;
}

export function isInsideEditableDescendant(el) {
    if (!el || el.nodeType !== 1) return false;
    if (editableDescendantCache.has(el)) return editableDescendantCache.get(el);

    const root = el.closest && el.closest('[contenteditable="true"], [contenteditable=""]');
    const isDescendant = !!root && root !== el;

    editableDescendantCache.set(el, isDescendant);
    return isDescendant;
}

export function isEditableRoot(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return true;
    const ce = el.getAttribute('contenteditable');
    return ce === 'true' || ce === '';
}

export function isNonTextContainer(el) {
    if (!el || el.nodeType !== 1) return true;
    if (NON_TEXT_TAGS.has(el.tagName)) return true;
    if (isCodeOrEditorArea(el)) return true;

    const className = typeof el.className === 'string' ? el.className.toLowerCase() : '';
    if (className.includes('katex') || el.hasAttribute('data-smart-rtl-ignore') || el.id === 'smart-rtl-floating-widget') {
        return true;
    }
    if (el.closest && el.closest('#smart-rtl-floating-widget')) {
        return true;
    }
    return false;
}

export function hasBlockChildren(elem) {
    if (!elem || !elem.children) return false;
    for (let i = 0; i < elem.children.length; i++) {
        if (BLOCK_TAG_NAMES.has(elem.children[i].tagName)) {
            return true;
        }
    }
    return false;
}

export function isNativeRtlSite() {
    if (typeof document === 'undefined') return false;
    return document.documentElement?.dir === 'rtl' || document.body?.dir === 'rtl';
}

// -------------------------------------------------------------
// Style Injection & Direction Control
// -------------------------------------------------------------
export function injectStyles(customCss = DEFAULT_STYLES) {
    if (typeof document === 'undefined') return;
    let style = document.getElementById('smart-rtl-style-root');
    if (!style) {
        style = document.createElement('style');
        style.id = 'smart-rtl-style-root';
        style.textContent = customCss;
        (document.head || document.documentElement).appendChild(style);
    }
}

export function removeInjectedStyles() {
    if (typeof document === 'undefined') return;
    const style = document.getElementById('smart-rtl-style-root');
    if (style) style.remove();
}

export function applyStylesAndFont(el, config = {}) {
    if (!el || el.nodeType !== 1) return;

    const currentFont = config.font && config.font !== 'system' ? `smart-rtl-font-${config.font}` : '';
    FONT_CLASSES.forEach(cls => {
        if (cls !== currentFont && el.classList.contains(cls)) el.classList.remove(cls);
    });
    if (currentFont && !el.classList.contains(currentFont)) el.classList.add(currentFont);

    const sizeClasses = ['smart-rtl-size-110', 'smart-rtl-size-120', 'smart-rtl-size-130'];
    const currentSize = config.fontSize && config.fontSize !== '100' ? `smart-rtl-size-${config.fontSize}` : '';
    sizeClasses.forEach(c => {
        if (c !== currentSize && el.classList.contains(c)) el.classList.remove(c);
    });
    if (currentSize && !el.classList.contains(currentSize)) el.classList.add(currentSize);

    const lhClasses = ['smart-rtl-lh-relaxed', 'smart-rtl-lh-loose'];
    const currentLh = config.lineHeight && config.lineHeight !== 'normal' ? `smart-rtl-lh-${config.lineHeight}` : '';
    lhClasses.forEach(c => {
        if (c !== currentLh && el.classList.contains(c)) el.classList.remove(c);
    });
    if (currentLh && !el.classList.contains(currentLh)) el.classList.add(currentLh);
}

export function setRtl(el, config = {}) {
    if (!el || el.nodeType !== 1) return;

    const isNative = isNativeRtlSite();
    const hasRightClass = el.classList.contains('smart-rtl-text-right');
    const hasDirRtl = el.getAttribute('dir') === 'rtl';

    // Fast path: if already configured for RTL, return immediately
    if (hasDirRtl && (isNative || hasRightClass) && (!el.style || el.style.direction === 'rtl')) {
        return;
    }

    if (!hasDirRtl) {
        el.setAttribute('dir', 'rtl');
        el.setAttribute(OWN_DIR_ATTR, 'true');
    }

    if (!isNative && !hasRightClass) {
        el.classList.add('smart-rtl-text-right');
    }
    el.classList.remove('smart-rtl-text-left');

    if (el.style) {
        if (el.style.direction !== 'rtl') el.style.setProperty('direction', 'rtl', 'important');
        if (el.style.textAlign !== 'right') el.style.setProperty('text-align', 'right', 'important');
        if (el.style.unicodeBidi !== 'isolate') el.style.setProperty('unicode-bidi', 'isolate', 'important');
    }

    applyStylesAndFont(el, config);

    if (config.convertNumbers && ['P', 'LI', 'SPAN', 'DIV', 'TD', 'TH', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(el.tagName)) {
        for (let i = 0; i < el.childNodes.length; i++) {
            const child = el.childNodes[i];
            if (child.nodeType === 3 && child.textContent) {
                const newText = convertDigitsToPersian(child.textContent);
                if (child.textContent !== newText) {
                    if (!child.__smartRtlConverted) child.__smartRtlConverted = 0;
                    if (child.__smartRtlConverted < 3) {
                        child.__smartRtlConverted++;
                        child.textContent = newText;
                    }
                }
            }
        }
    }
}

export function setLtr(el) {
    if (!el || el.nodeType !== 1) return;

    const hasLeftClass = el.classList.contains('smart-rtl-text-left');
    const hasDirLtr = el.getAttribute('dir') === 'ltr';

    if (hasDirLtr && hasLeftClass && (!el.style || el.style.direction === 'ltr')) {
        return;
    }

    if (!hasDirLtr) {
        el.setAttribute('dir', 'ltr');
        el.setAttribute(OWN_DIR_ATTR, 'true');
    }
    if (!hasLeftClass) el.classList.add('smart-rtl-text-left');
    el.classList.remove('smart-rtl-text-right');

    if (el.style) {
        if (el.style.direction !== 'ltr') el.style.setProperty('direction', 'ltr', 'important');
        if (el.style.textAlign !== 'left') el.style.setProperty('text-align', 'left', 'important');
        if (el.style.unicodeBidi !== 'isolate') el.style.setProperty('unicode-bidi', 'isolate', 'important');
        el.style.removeProperty('font-family');
    }
    FONT_CLASSES.forEach(cls => el.classList.remove(cls));
}

export function clearDirection(el) {
    if (!el || el.nodeType !== 1) return;

    if (el.getAttribute(OWN_DIR_ATTR) === 'true') {
        el.removeAttribute('dir');
        el.removeAttribute(OWN_DIR_ATTR);
    }
    el.classList.remove('smart-rtl-text-right', 'smart-rtl-text-left');
    el.classList.remove('smart-rtl-size-110', 'smart-rtl-size-120', 'smart-rtl-size-130');
    el.classList.remove('smart-rtl-lh-relaxed', 'smart-rtl-lh-loose');
    FONT_CLASSES.forEach(cls => el.classList.remove(cls));
    if (el.style) {
        el.style.removeProperty('font-family');
        el.style.removeProperty('direction');
        el.style.removeProperty('text-align');
        el.style.removeProperty('unicode-bidi');
    }
}

function setDirSoft(el, dir) {
    if (el.getAttribute('dir') === dir) return;
    el.setAttribute('dir', dir);
    el.setAttribute(OWN_DIR_ATTR, 'true');
}

export function processEditableRoot(el, config = {}) {
    if (!el || el.nodeType !== 1) return;
    if (el.hasAttribute(MANUAL_ATTR) || config.mode === 'manual' || isCodeOrEditorArea(el)) return;

    let val = (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')
        ? (el.value || el.getAttribute('placeholder') || '')
        : (el.textContent || '');

    const trimmed = val.trim();
    if (!trimmed) return;

    if (config.mode === 'ltr') {
        setDirSoft(el, 'ltr');
        return;
    }

    if (config.mode === 'rtl') {
        if (isPersianArabicText(val)) setDirSoft(el, 'rtl');
        return;
    }

    if (isPersianArabicText(val)) {
        setDirSoft(el, 'rtl');
    } else if (el.getAttribute(OWN_DIR_ATTR) === 'true' && isPureEnglishText(val)) {
        setDirSoft(el, 'ltr');
    }

    if ((el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && isPersianArabicText(val)) {
        applyStylesAndFont(el, config);
    }
}

// -------------------------------------------------------------
// Core Element & Tree Processing
// -------------------------------------------------------------
export function processElement(el, config = {}) {
    if (!el || el.nodeType !== 1) return;
    if (el.hasAttribute(MANUAL_ATTR) || config.mode === 'manual') return;

    if (isEditableRoot(el)) {
        processEditableRoot(el, config);
        return;
    }

    if (isInsideEditableDescendant(el) || isCodeOrEditorArea(el)) return;
    if (isNonTextContainer(el)) return;

    // Skip structural container DIVs (with block children or many children)
    if (el.tagName === 'DIV' && (hasBlockChildren(el) || (el.children && el.children.length > 5))) {
        return;
    }

    const text = el.textContent || '';
    if (!text || text.trim().length < 1) return;

    // Ultra-fast streaming guard: If element already has correct direction, exit immediately
    const currentDir = el.getAttribute('dir');
    if (currentDir === 'rtl' && isPersianArabicText(text)) return;
    if (currentDir === 'ltr' && isPureEnglishText(text)) return;

    // Handle List containers (UL / OL)
    if (el.tagName === 'UL' || el.tagName === 'OL') {
        if (isPersianArabicText(text)) {
            setRtl(el, config);
        } else if (isPureEnglishText(text)) {
            setLtr(el);
        }
        return;
    }

    if (config.mode === 'rtl') {
        if (isPersianArabicText(text)) setRtl(el, config);
    } else if (config.mode === 'ltr') {
        setLtr(el);
    } else {
        // Auto Mode
        if (isPersianArabicText(text)) {
            setRtl(el, config);
        } else if (isPureEnglishText(text)) {
            setLtr(el);
        } else if (el.classList.contains('smart-rtl-text-right')) {
            clearDirection(el);
        }
    }
}

export function scanNodeTree(root, config = {}) {
    if (!root || !root.isConnected) return;

    if (root.nodeType === 1) {
        if (isCodeOrEditorArea(root) || isInsideEditableDescendant(root)) return;

        // Direct leaf text block: format it immediately in O(1)
        if (TEXT_BLOCK_SET.has(root.tagName) || (root.tagName === 'DIV' && !hasBlockChildren(root))) {
            processElement(root, config);
            return;
        }
    }

    // High-Performance native C++ TreeWalker traversal
    try {
        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode(node) {
                    if (!node.data || node.data.length < 2) return NodeFilter.FILTER_SKIP;
                    const parent = node.parentElement;
                    if (!parent) return NodeFilter.FILTER_SKIP;
                    if (isCodeOrEditorArea(parent) || isInsideEditableDescendant(parent)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const blocksToProcess = new Set();
        let textNode;
        let visitedCount = 0;

        while ((textNode = walker.nextNode())) {
            const parent = textNode.parentElement;
            if (!parent) continue;

            const block = parent.closest ? parent.closest(TARGET_SELECTOR) : parent;
            if (block && !block.hasAttribute(MANUAL_ATTR)) {
                blocksToProcess.add(block);
            }

            visitedCount++;
            if (visitedCount > 3000) break; // Time-slicing limit to prevent Long Tasks
        }

        blocksToProcess.forEach(el => processElement(el, config));

        if (root.querySelectorAll) {
            const editables = root.querySelectorAll(EDITABLE_SELECTOR);
            for (let i = 0; i < editables.length; i++) {
                processElement(editables[i], config);
            }
        }
    } catch (e) {
        processElement(root, config);
    }
}

// -------------------------------------------------------------
// Main Entry Point: initRtl
// -------------------------------------------------------------
/**
 * Initialize the Smart Multi-RTL Pro Engine on a page or container.
 *
 * @param {Object} [options]
 * @param {HTMLElement|string} [options.target=document.body] - The root element or CSS selector to monitor.
 * @param {'auto'|'rtl'|'ltr'|'manual'} [options.mode='auto'] - Alignment strategy.
 * @param {string} [options.font='vazir'] - Persian font family name or 'system'.
 * @param {'100'|'110'|'120'|'130'} [options.fontSize='100'] - Font scaling percentage.
 * @param {'normal'|'relaxed'|'loose'} [options.lineHeight='normal'] - Line height preset.
 * @param {boolean} [options.convertNumbers=false] - Convert English digits (123) to Persian (۱۲۳).
 * @param {boolean} [options.preserveCode=true] - Guard code blocks and syntax editors from direction changes.
 * @param {boolean} [options.injectStyles=true] - Inject default zero-latency CSS rules into document head.
 * @param {number} [options.throttleMs=60] - Streaming batch throttle delay in ms.
 * @param {string[]} [options.excludeSelectors=[]] - Additional CSS selectors to ignore.
 * @returns {Object} RTL Controller with scan(), setMode(), setFont(), disconnect(), destroy().
 */
export function initRtl(options = {}) {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        // SSR Safe Stub
        return {
            scan: () => {},
            setMode: () => {},
            setFont: () => {},
            setOptions: () => {},
            disconnect: () => {},
            destroy: () => {}
        };
    }

    let config = {
        mode: 'auto',
        font: 'vazir',
        fontSize: '100',
        lineHeight: 'normal',
        convertNumbers: false,
        preserveCode: true,
        injectStyles: true,
        throttleMs: 60,
        excludeSelectors: [],
        ...options
    };

    if (config.injectStyles) {
        injectStyles();
    }

    const resolveTarget = () => {
        if (!options.target) return document.body;
        if (typeof options.target === 'string') {
            return document.querySelector(options.target) || document.body;
        }
        return options.target;
    };

    const targetEl = resolveTarget();

    // Initial Full Scan
    if (targetEl) {
        scanNodeTree(targetEl, config);
    }

    // Streaming & Mutation Observer
    let pendingNodes = new Set();
    let scheduledRaf = null;
    let lastScanTime = 0;
    let isDestroyed = false;

    function scheduleBatchScan() {
        if (scheduledRaf || isDestroyed) return;

        scheduledRaf = requestAnimationFrame(() => {
            const now = performance.now();
            const elapsed = now - lastScanTime;
            const remaining = Math.max(0, config.throttleMs - elapsed);

            setTimeout(() => {
                scheduledRaf = null;
                lastScanTime = performance.now();

                if (!pendingNodes.size || isDestroyed) return;
                const nodes = Array.from(pendingNodes);
                pendingNodes.clear();

                const MAX_BATCH_NODES = 80;
                const batch = nodes.slice(0, MAX_BATCH_NODES);
                if (nodes.length > MAX_BATCH_NODES) {
                    const remainingNodes = nodes.slice(MAX_BATCH_NODES);
                    for (let r = 0; r < remainingNodes.length; r++) pendingNodes.add(remainingNodes[r]);
                    scheduleBatchScan();
                }

                for (let i = 0; i < batch.length; i++) {
                    const node = batch[i];
                    if (!node || !node.isConnected) continue;
                    scanNodeTree(node, config);
                }
            }, remaining);
        });
    }

    const observer = new MutationObserver((mutations) => {
        if (isDestroyed) return;

        for (let i = 0; i < mutations.length; i++) {
            const m = mutations[i];

            if (m.type === 'childList') {
                for (let j = 0; j < m.addedNodes.length; j++) {
                    const node = m.addedNodes[j];
                    if (node.nodeType === 1) {
                        if (isCodeOrEditorArea(node) || isInsideEditableDescendant(node)) continue;
                        pendingNodes.add(node);
                    } else if (node.nodeType === 3 && node.parentElement) {
                        const parent = node.parentElement;
                        if (isCodeOrEditorArea(parent) || isInsideEditableDescendant(parent)) continue;
                        const block = parent.closest ? parent.closest(TARGET_SELECTOR) : parent;
                        if (block) pendingNodes.add(block);
                    }
                }
            } else if (m.type === 'characterData' && m.target.parentElement) {
                const parent = m.target.parentElement;
                if (isCodeOrEditorArea(parent) || isInsideEditableDescendant(parent)) continue;
                const block = parent.closest ? parent.closest(TARGET_SELECTOR) : parent;
                if (block) pendingNodes.add(block);
            }
        }

        if (pendingNodes.size && !scheduledRaf) {
            scheduleBatchScan();
        }
    });

    if (targetEl) {
        observer.observe(targetEl, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    // Input listener for editable elements
    const inputTimers = new WeakMap();
    const handleInput = (e) => {
        if (isDestroyed) return;
        const target = e.target;
        if (!target || target.nodeType !== 1) return;

        const isEditable = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || isEditableRoot(target);
        if (!isEditable || isCodeOrEditorArea(target)) return;

        if (inputTimers.has(target)) clearTimeout(inputTimers.get(target));
        const t = setTimeout(() => {
            processEditableRoot(target, config);
            inputTimers.delete(target);
        }, 120);
        inputTimers.set(target, t);
    };

    if (typeof document !== 'undefined') {
        document.addEventListener('input', handleInput, true);
    }

    // Controller Object
    return {
        scan: (customRoot) => {
            if (isDestroyed) return;
            scanNodeTree(customRoot || resolveTarget(), config);
        },
        setMode: (newMode) => {
            config.mode = newMode;
            scanNodeTree(resolveTarget(), config);
        },
        setFont: (newFont) => {
            config.font = newFont;
            scanNodeTree(resolveTarget(), config);
        },
        setOptions: (newOpts) => {
            config = { ...config, ...newOpts };
            scanNodeTree(resolveTarget(), config);
        },
        disconnect: () => {
            observer.disconnect();
            if (scheduledRaf) {
                cancelAnimationFrame(scheduledRaf);
                scheduledRaf = null;
            }
            pendingNodes.clear();
        },
        destroy: () => {
            isDestroyed = true;
            observer.disconnect();
            if (scheduledRaf) {
                cancelAnimationFrame(scheduledRaf);
                scheduledRaf = null;
            }
            pendingNodes.clear();
            if (typeof document !== 'undefined') {
                document.removeEventListener('input', handleInput, true);
            }
        }
    };
}

// Default export
export default initRtl;
