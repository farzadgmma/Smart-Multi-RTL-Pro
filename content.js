
/**
 * Smart Multi-RTL Pro Engine v5.0 (High-Precision Edition)
 * Developed by Mobtakeran Nik Afzar
 * Features:
 *  - High-precision Persian/Arabic detection for mixed Persian-English technical text
 *  - Pure English preservation (guarantees English paragraphs remain LTR)
 *  - Full Markdown & List support (ul, ol, li, pre, code with Persian)
 *  - Inline & CSS specificity guarantees with unicode-bidi: isolate
 *  - MutationObserver throttling and shadowRoot traversal
 *  - Manual Inspector selector persistence
 */

(() => {
    'use strict';

    // 🛡️ Double injection guard
    if (window.__SMART_RTL_PRO_ACTIVE__) {
        return;
    }

    // 🛡️ Invisible/Ad Iframe Guard: Skip tiny tracking or ad iframes
    if (window.self !== window.top) {
        try {
            if (window.innerWidth > 0 && (window.innerWidth < 150 || window.innerHeight < 100)) {
                return;
            }
        } catch (e) {}
    }

    window.__SMART_RTL_PRO_ACTIVE__ = true;

    const PERSIAN_ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFE]/;
    const PERSIAN_ARABIC_REGEX_G = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFE]/g;
    const ENGLISH_REGEX = /[a-zA-Z]/g;
    const HAS_ENGLISH_REGEX = /[a-zA-Z]/;
    const ENGLISH_DIGITS_REGEX = /[0-9]/g;
    const PERSIAN_DIGITS_MAP = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

    const NON_TEXT_TAGS = new Set([
        'HTML', 'BODY', 'SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'CANVAS', 'IFRAME',
        'VIDEO', 'AUDIO', 'OBJECT', 'EMBED', 'NAV', 'FOOTER', 'HEADER'
    ]);

    const CODE_AND_EDITOR_SELECTORS = [
        'pre', 'code', 'kbd', 'samp', 'var',
        '.hljs', '.prism', '[class*="language-"]', '[class*="highlight-"]',
        '.monaco-editor', '.CodeMirror', '.cm-editor', '.ace_editor',
        '.ql-editor', '.ProseMirror', '.DraftEditor-root', '[data-slate-editor="true"]',
        '.tiptap', '.notion-page-content', '[g_editable="true"]', 'textarea.ace_text-input'
    ].join(', ');

    const MANUAL_ATTR = 'data-smart-rtl-manual';
    const OWN_DIR_ATTR = 'data-smart-rtl-dir';

    const TARGET_SELECTOR = 'p, div, li, ul, ol, h1, h2, h3, h4, h5, h6, blockquote, td, th, label, figcaption';
    const EDITABLE_SELECTOR = 'input, textarea, [contenteditable="true"], [contenteditable=""]';

    let settings = {
        registered: true,
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
        'smart-rtl-font-vazir', 'smart-rtl-font-yekan', 'smart-rtl-font-estedad',
        'smart-rtl-font-dana', 'smart-rtl-font-shabnam', 'smart-rtl-font-tanha',
        'smart-rtl-font-gandom', 'smart-rtl-font-nahid', 'smart-rtl-font-samim',
        'smart-rtl-font-sahel', 'smart-rtl-font-parastoo', 'smart-rtl-font-notosans',
        'smart-rtl-font-nazanin', 'smart-rtl-font-mitra', 'smart-rtl-font-yagut'
    ];

    const isSiteDisabled = () => {
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
        let style = document.getElementById('smart-rtl-style-root');
        if (!style) {
            style = document.createElement('style');
            style.id = 'smart-rtl-style-root';
            style.textContent = `
                .smart-rtl-text-right { direction: rtl !important; text-align: right !important; unicode-bidi: isolate !important; }
                .smart-rtl-text-left { direction: ltr !important; text-align: left !important; unicode-bidi: isolate !important; }
                ul.smart-rtl-text-right, ol.smart-rtl-text-right { direction: rtl !important; text-align: right !important; padding-right: 24px !important; padding-left: 0 !important; }
                li.smart-rtl-text-right { direction: rtl !important; text-align: right !important; unicode-bidi: isolate !important; }
                pre, code, kbd, samp, var, .hljs, .prism, [class*="language-"], [class*="highlight-"], .monaco-editor, .CodeMirror, .cm-editor, .ace_editor { direction: ltr !important; text-align: left !important; unicode-bidi: embed !important; }
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
            (document.head || document.documentElement).appendChild(style);
        }
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
     * High-Precision Language & Text Detection
     * --------------------------------------------------------- */
    function isPersianArabicText(text) {
        if (!text || typeof text !== 'string') return false;
        const trimmed = text.trim();
        if (!trimmed) return false;
        return PERSIAN_ARABIC_REGEX.test(trimmed);
    }

    function isPureEnglishText(text) {
        if (!text || typeof text !== 'string') return false;
        const trimmed = text.trim();
        if (!trimmed) return false;
        return !PERSIAN_ARABIC_REGEX.test(trimmed) && HAS_ENGLISH_REGEX.test(trimmed);
    }

    /* ---------------------------------------------------------
     * Editor / Code / UI detection guards (WeakMap Memoized)
     * --------------------------------------------------------- */
    const codeOrEditorCache = new WeakMap();
    const editableDescendantCache = new WeakMap();

    function isCodeOrEditorArea(el) {
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

    function isInsideEditableDescendant(el) {
        if (!el || el.nodeType !== 1) return false;
        if (editableDescendantCache.has(el)) return editableDescendantCache.get(el);

        const root = el.closest && el.closest('[contenteditable="true"], [contenteditable=""]');
        const isDescendant = !!root && root !== el;

        editableDescendantCache.set(el, isDescendant);
        return isDescendant;
    }

    function isEditableRoot(el) {
        if (!el || el.nodeType !== 1) return false;
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return true;
        const ce = el.getAttribute('contenteditable');
        return ce === 'true' || ce === '';
    }

    function isNonTextContainer(el) {
        if (!el || el.nodeType !== 1) return true;
        if (NON_TEXT_TAGS.has(el.tagName)) return true;
        if (isCodeOrEditorArea(el)) return true;

        const className = typeof el.className === 'string' ? el.className.toLowerCase() : '';
        if (className.includes('katex') || el.hasAttribute('data-smart-rtl-ignore') || el.id === 'smart-rtl-floating-widget') {
            return true;
        }
        if (el.closest('#smart-rtl-floating-widget')) {
            return true;
        }
        return false;
    }

    /* ---------------------------------------------------------
     * Style / Font application
     * --------------------------------------------------------- */
    function applyStylesAndFont(el) {
        if (isSiteDisabled()) return;

        const currentFont = settings.font && settings.font !== 'system' ? `smart-rtl-font-${settings.font}` : '';
        FONT_CLASSES.forEach(cls => {
            if (cls !== currentFont && el.classList.contains(cls)) el.classList.remove(cls);
        });
        if (currentFont && !el.classList.contains(currentFont)) el.classList.add(currentFont);

        const sizeClasses = ['smart-rtl-size-110', 'smart-rtl-size-120', 'smart-rtl-size-130'];
        const currentSize = settings.fontSize && settings.fontSize !== '100' ? `smart-rtl-size-${settings.fontSize}` : '';
        sizeClasses.forEach(c => {
            if (c !== currentSize && el.classList.contains(c)) el.classList.remove(c);
        });
        if (currentSize && !el.classList.contains(currentSize)) el.classList.add(currentSize);

        const lhClasses = ['smart-rtl-lh-relaxed', 'smart-rtl-lh-loose'];
        const currentLh = settings.lineHeight && settings.lineHeight !== 'normal' ? `smart-rtl-lh-${settings.lineHeight}` : '';
        lhClasses.forEach(c => {
            if (c !== currentLh && el.classList.contains(c)) el.classList.remove(c);
        });
        if (currentLh && !el.classList.contains(currentLh)) el.classList.add(currentLh);
    }

    const isNativeRtlSite = () => {
        return document.documentElement?.dir === 'rtl' || document.body?.dir === 'rtl';
    };

    /* ---------------------------------------------------------
     * Set/Clear direction for block elements (Optimized Fast-Path)
     * --------------------------------------------------------- */
    function setRtl(el) {
        if (isSiteDisabled()) return;

        const isNative = isNativeRtlSite();
        const hasRightClass = el.classList.contains('smart-rtl-text-right');
        const hasDirRtl = el.getAttribute('dir') === 'rtl';

        // Fast path: if already fully configured for RTL, exit immediately with zero layout cost!
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

        applyStylesAndFont(el);

        if (settings.convertNumbers && ['P', 'LI', 'SPAN', 'DIV', 'TD', 'TH', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(el.tagName)) {
            for (let i = 0; i < el.childNodes.length; i++) {
                const child = el.childNodes[i];
                if (child.nodeType === Node.TEXT_NODE && child.textContent) {
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

    function setLtr(el) {
        if (isSiteDisabled()) return;

        const hasLeftClass = el.classList.contains('smart-rtl-text-left');
        const hasDirLtr = el.getAttribute('dir') === 'ltr';

        // Fast path: if already fully configured for LTR, exit immediately!
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

    function clearDirection(el) {
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

    /* ---------------------------------------------------------
     * Gentle handling for EDITABLE ROOTS (input/textarea/contenteditable)
     * --------------------------------------------------------- */
    function setDirSoft(el, dir) {
        if (el.getAttribute('dir') === dir) return;
        el.setAttribute('dir', dir);
        el.setAttribute(OWN_DIR_ATTR, 'true');
    }

    function processEditableRoot(el) {
        if (isSiteDisabled()) return;
        if (el.hasAttribute(MANUAL_ATTR)) return;
        if (settings.mode === 'manual') return;
        if (isCodeOrEditorArea(el)) return;

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
        } else if (el.getAttribute(OWN_DIR_ATTR) === 'true' && isPureEnglishText(val)) {
            setDirSoft(el, 'ltr');
        }

        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            if (isPersianArabicText(val)) applyStylesAndFont(el);
        }
    }

    /* ---------------------------------------------------------
     * Main Processing Logic
     * --------------------------------------------------------- */
    const BLOCK_TAG_NAMES = new Set(['P', 'DIV', 'LI', 'UL', 'OL', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'TD', 'TH', 'PRE', 'FORM', 'SECTION', 'ARTICLE']);

    function hasBlockChildren(elem) {
        if (!elem || !elem.children) return false;
        for (let i = 0; i < elem.children.length; i++) {
            if (BLOCK_TAG_NAMES.has(elem.children[i].tagName)) {
                return true;
            }
        }
        return false;
    }

    function processElement(el) {
        if (isSiteDisabled()) return;
        if (!el || el.nodeType !== 1) return;
        if (el.hasAttribute(MANUAL_ATTR)) return;
        if (settings.mode === 'manual') return;

        if (isEditableRoot(el)) {
            processEditableRoot(el);
            return;
        }

        if (isInsideEditableDescendant(el) || isCodeOrEditorArea(el)) {
            return;
        }

        if (isNonTextContainer(el)) return;

        // Skip structural container DIVs (with block children or many children)
        if (el.tagName === 'DIV' && (hasBlockChildren(el) || (el.children && el.children.length > 5))) {
            return;
        }

        const text = el.textContent || '';
        if (!text || text.trim().length < 1) return;

        // Ultra-fast streaming guard: If element already has correct direction, exit immediately!
        const currentDir = el.getAttribute('dir');
        if (currentDir === 'rtl' && isPersianArabicText(text)) {
            return;
        }
        if (currentDir === 'ltr' && isPureEnglishText(text)) {
            return;
        }

        // Handle List containers (UL / OL)
        if (el.tagName === 'UL' || el.tagName === 'OL') {
            if (isPersianArabicText(text)) {
                setRtl(el);
            } else if (isPureEnglishText(text)) {
                setLtr(el);
            }
            return;
        }

        if (settings.mode === 'rtl') {
            if (isPersianArabicText(text)) setRtl(el);
        } else if (settings.mode === 'ltr') {
            setLtr(el);
        } else {
            // Auto Mode
            if (isPersianArabicText(text)) {
                setRtl(el);
            } else if (isPureEnglishText(text)) {
                setLtr(el);
            } else if (el.classList.contains('smart-rtl-text-right')) {
                clearDirection(el);
            }
        }
    }

    /* ---------------------------------------------------------
     * DOM Tree Scanning (High-Performance Engine v6.0 TreeWalker)
     * --------------------------------------------------------- */
    const TEXT_BLOCK_SET = new Set(['P', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'TD', 'TH', 'LABEL', 'FIGCAPTION']);

    function scanNodeTree(root) {
        if (isSiteDisabled() || !root || !root.isConnected) return;

        if (root.nodeType === 1) {
            if (isCodeOrEditorArea(root) || isInsideEditableDescendant(root)) return;

            // Direct leaf text block: format it immediately in O(1)
            if (TEXT_BLOCK_SET.has(root.tagName) || (root.tagName === 'DIV' && !hasBlockChildren(root))) {
                processElement(root);
                return;
            }
        }

        // For large containers or document.body:
        // Use native C++ TreeWalker to collect ONLY text-bearing blocks
        // instead of querySelectorAll on 20,000 empty DIVs!
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

                // Find the nearest enclosing text block
                const block = parent.closest ? parent.closest(TARGET_SELECTOR) : parent;
                if (block && !block.hasAttribute(MANUAL_ATTR)) {
                    blocksToProcess.add(block);
                }

                visitedCount++;
                if (visitedCount > 3000) break; // Time-slicing limit to guarantee 0 frame drops
            }

            blocksToProcess.forEach(processElement);

            // Also process editable inputs/textareas within root
            if (root.querySelectorAll) {
                const editables = root.querySelectorAll(EDITABLE_SELECTOR);
                for (let i = 0; i < editables.length; i++) {
                    processElement(editables[i]);
                }
            }
        } catch (e) {
            processElement(root);
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
        if (cachedManualSelectors && cachedManualSelectors.length) {
            applyManualSelectors(cachedManualSelectors);
        }
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
     * Floating Quick Widget
     * --------------------------------------------------------- */
    function renderFloatingWidget() {
        if (window.top !== window.self) return;

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
                else if (settings.mode === 'ltr') settings.mode = 'manual';
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
     * Extension Context Guard & In-Memory Cache
     * --------------------------------------------------------- */
    function isExtensionValid() {
        return typeof chrome !== 'undefined' && chrome.runtime && !!chrome.runtime.id;
    }

    let cachedManualSelectors = [];

    function reloadManualSelectors() {
        if (!isExtensionValid()) return;
        try {
            const hostname = window.location.hostname;
            chrome.storage.local.get(['manualSelectors'], (res) => {
                if (!isExtensionValid() || chrome.runtime?.lastError) return;
                if (res && res.manualSelectors && res.manualSelectors[hostname]) {
                    cachedManualSelectors = res.manualSelectors[hostname];
                    applyManualSelectors(cachedManualSelectors);
                }
            });
        } catch (e) {}
    }

    /* ---------------------------------------------------------
     * MutationObserver (High Performance rAF + Throttling)
     * --------------------------------------------------------- */
    let pendingNodes = new Set();
    let scheduledRaf = null;
    let lastScanTime = 0;
    const THROTTLE_MS = 60; // Max ~16 scans per second, keeps main thread at 60/120fps

    function scheduleBatchScan() {
        if (scheduledRaf) return;

        scheduledRaf = requestAnimationFrame(() => {
            const now = performance.now();
            const elapsed = now - lastScanTime;
            const remaining = Math.max(0, THROTTLE_MS - elapsed);

            setTimeout(() => {
                scheduledRaf = null;
                lastScanTime = performance.now();

                if (!pendingNodes.size) return;
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
                    scanNodeTree(node);
                }

                if (cachedManualSelectors && cachedManualSelectors.length) {
                    for (let s = 0; s < cachedManualSelectors.length; s++) {
                        const sel = cachedManualSelectors[s];
                        for (let n = 0; n < batch.length; n++) {
                            const node = batch[n];
                            try {
                                if (node.matches && node.matches(sel)) setRtl(node);
                                if (node.querySelectorAll) {
                                    const matches = node.querySelectorAll(sel);
                                    for (let m = 0; m < matches.length; m++) setRtl(matches[m]);
                                }
                            } catch (e) {}
                        }
                    }
                }
            }, remaining);
        });
    }

    const observer = new MutationObserver((mutations) => {
        if (!isExtensionValid()) {
            observer.disconnect();
            return;
        }
        if (isSiteDisabled()) return;

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

    function startObserving() {
        if (document.body && isExtensionValid()) {
            // Observe DOM additions and character streaming.
            // Attributes are deliberately omitted to eliminate self-triggering feedback loops!
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true
            });
        }
    }

    /* ---------------------------------------------------------
     * Manual Selectors Application
     * --------------------------------------------------------- */
    function applyManualSelectors(selectors) {
        if (!selectors || !selectors.length) return;
        selectors.forEach(selector => {
            try {
                const els = document.querySelectorAll(selector);
                els.forEach(el => {
                    if (el.nodeType === 1) setRtl(el);
                });
            } catch (e) {}
        });
    }

    function whenBodyReady(cb) {
        if (document.body) {
            cb();
        } else {
            const obs = new MutationObserver(() => {
                if (document.body) {
                    obs.disconnect();
                    cb();
                }
            });
            obs.observe(document.documentElement, { childList: true });
        }
    }

    /* ---------------------------------------------------------
     * Context Menu & Focus Tracking
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
            el.closest('p, li, ul, ol, h1, h2, h3, h4, h5, h6, blockquote, td, th, label, span, div') ||
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
     * Debounced Input Handling
     * --------------------------------------------------------- */
    const inputTimers = new WeakMap();

    document.addEventListener('input', (e) => {
        if (isSiteDisabled()) return;
        const target = e.target;
        if (!target || target.nodeType !== 1) return;

        const isEditable = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || isEditableRoot(target);
        if (!isEditable) return;
        if (isCodeOrEditorArea(target)) return;

        if (inputTimers.has(target)) clearTimeout(inputTimers.get(target));
        const t = setTimeout(() => {
            processEditableRoot(target);
            inputTimers.delete(target);
        }, 120);
        inputTimers.set(target, t);
    }, true);

    /* ---------------------------------------------------------
     * Message Handling
     * --------------------------------------------------------- */
    if (isExtensionValid()) {
        chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
            if (!isExtensionValid()) return false;
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
                reloadManualSelectors();
                sendResponse({ status: 'ok' });
            }
            return true;
        });
    }

    function loadSettings(cb) {
        if (!isExtensionValid()) {
            cb && cb();
            return;
        }
        try {
            chrome.storage.sync.get(
                { registered: true, enabled: true, mode: 'auto', font: 'vazir', fontSize: '100', lineHeight: 'normal', convertNumbers: false, showWidget: false, disabledSites: [] },
                (res) => {
                    if (!isExtensionValid() || chrome.runtime?.lastError) return;
                    settings = { ...settings, ...res };
                    cb && cb();
                }
            );
        } catch (e) {
            cb && cb();
        }
    }

    if (isExtensionValid()) {
        try {
            chrome.storage.onChanged.addListener((changes) => {
                if (!isExtensionValid()) return;
                for (const k in changes) {
                    if (k === 'manualSelectors') {
                        const hostname = window.location.hostname;
                        const newSelectors = changes.manualSelectors.newValue;
                        if (newSelectors && newSelectors[hostname]) {
                            cachedManualSelectors = newSelectors[hostname];
                            applyManualSelectors(cachedManualSelectors);
                        }
                    } else {
                        settings[k] = changes[k].newValue;
                    }
                }
                if (isSiteDisabled()) removeAllStyles();
                else fullScan();
            });
        } catch (e) {}
    }

    // Start Engine
    loadSettings(() => {
        whenBodyReady(() => {
            if (isSiteDisabled()) {
                removeAllStyles();
            } else {
                fullScan();
                startObserving();
                reloadManualSelectors();
                setTimeout(reloadManualSelectors, 1500);
                setTimeout(reloadManualSelectors, 4000);
            }
        });
    });

})();
