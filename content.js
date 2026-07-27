/**
 * Smart Multi-RTL Pro Engine v4.0
 * Absolute Isolation & Instant Full Cleanup Engine
 */

(() => {
    'use strict';

    const PERSIAN_ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFE]/;
    const ENGLISH_REGEX = /[a-zA-Z]/g;
    const ENGLISH_DIGITS_REGEX = /[0-9]/g;
    const PERSIAN_DIGITS_MAP = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    
    const IGNORE_TAGS = new Set([
        'HTML', 'BODY', 'SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'CODE', 'PRE', 
        'BUTTON', 'NAV', 'HEADER', 'FOOTER', 'ASIDE', 'CANVAS', 'IFRAME', 'FORM',
        'MAIN', 'SECTION', 'ARTICLE', 'UL', 'OL', 'TABLE', 'TR', 'TBODY', 'THEAD'
    ]);

    const MANUAL_ATTR = 'data-smart-rtl-manual';
    const TARGET_SELECTOR = 'p, span, div, li, a, h1, h2, h3, h4, h5, h6, blockquote, td, th, label, figcaption, input, textarea, [contenteditable]';

    let settings = {
        registered: false,
        enabled: true,
        mode: 'auto',          // 'auto', 'rtl', 'ltr'
        font: 'vazir',        // 'vazir', 'yekan', 'shabnam', 'samim', 'sahel', 'parastoo', 'system'
        fontSize: '100',      // '100', '110', '120', '130'
        lineHeight: 'normal',  // 'normal', 'relaxed', 'loose'
        convertNumbers: false, // true / false
        showWidget: false,     // true / false
        disabledSites: []
    };

    let lastContextElement = null;

    const FONT_CLASSES = [
        'smart-rtl-font-vazir', 'smart-rtl-font-yekan', 'smart-rtl-font-shabnam', 
        'smart-rtl-font-samim', 'smart-rtl-font-sahel', 'smart-rtl-font-parastoo'
    ];

    const FONT_MAP = {
        system: '',
        vazir: "'Vazirmatn', -apple-system, BlinkMacSystemFont, sans-serif",
        yekan: "'IRANYekanWeb', 'B Yekan', 'Yekan', sans-serif",
        shabnam: "'Shabnam', sans-serif",
        samim: "'Samim', sans-serif",
        sahel: "'Sahel', sans-serif",
        parastoo: "'Parastoo', sans-serif"
    };

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

    function injectInlineStyles() {
        if (isSiteDisabled()) {
            removeInlineStyles();
            return;
        }
        if (document.getElementById('smart-rtl-style-root')) return;
        const style = document.createElement('style');
        style.id = 'smart-rtl-style-root';
        style.textContent = `
            .smart-rtl-text-right {
                direction: rtl !important;
                text-align: right !important;
            }
            span.smart-rtl-text-right {
                display: inline-block !important;
            }
            .smart-rtl-text-left {
                direction: ltr !important;
                text-align: left !important;
            }
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

    function isPersianArabicText(text) {
        if (!text || typeof text !== 'string') return false;
        const trimmed = text.trim();
        if (!trimmed || trimmed.length < 2) return false;

        if (!PERSIAN_ARABIC_REGEX.test(trimmed)) return false;

        const rtlMatches = trimmed.match(new RegExp(PERSIAN_ARABIC_REGEX.source, 'g')) || [];
        const engMatches = trimmed.match(ENGLISH_REGEX) || [];
        const totalLetters = rtlMatches.length + engMatches.length;

        if (totalLetters === 0) return false;

        const rtlRatio = rtlMatches.length / totalLetters;
        const firstWordIsRtl = PERSIAN_ARABIC_REGEX.test(trimmed.substring(0, 10));

        return rtlRatio >= 0.3 || firstWordIsRtl;
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
            className.includes('hljs') || className.includes('monaco') || className.includes('katex') ||
            el.hasAttribute('data-smart-rtl-ignore') || el.id === 'smart-rtl-floating-widget'
        ) {
            return true;
        }

        if (el.closest('pre, code, .monaco-editor, .katex, button, nav')) {
            return true;
        }

        return false;
    }

    function applyStylesAndFont(el) {
        if (isSiteDisabled()) return;

        // Remove old font classes
        FONT_CLASSES.forEach(cls => el.classList.remove(cls));

        // Add active font class
        if (settings.font && settings.font !== 'system') {
            el.classList.add(`smart-rtl-font-${settings.font}`);
        }

        if (settings.fontSize && settings.fontSize !== '100') {
            el.classList.add(`smart-rtl-size-${settings.fontSize}`);
        } else {
            el.classList.remove('smart-rtl-size-110', 'smart-rtl-size-120', 'smart-rtl-size-130');
        }

        if (settings.lineHeight && settings.lineHeight !== 'normal') {
            el.classList.add(`smart-rtl-lh-${settings.lineHeight}`);
        } else {
            el.classList.remove('smart-rtl-lh-relaxed', 'smart-rtl-lh-loose');
        }
    }

    function setRtl(el) {
        if (isSiteDisabled()) return;
        el.setAttribute('dir', 'rtl');
        el.classList.add('smart-rtl-text-right');
        el.classList.remove('smart-rtl-text-left');
        applyStylesAndFont(el);

        if (settings.convertNumbers && (el.tagName === 'P' || el.tagName === 'LI' || el.tagName === 'SPAN')) {
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
        el.setAttribute('dir', 'ltr');
        el.classList.add('smart-rtl-text-left');
        el.classList.remove('smart-rtl-text-right');
        FONT_CLASSES.forEach(cls => el.classList.remove(cls));
        el.style.removeProperty('font-family');
    }

    function clearDirection(el) {
        el.removeAttribute('dir');
        el.classList.remove('smart-rtl-text-right', 'smart-rtl-text-left');
        el.classList.remove('smart-rtl-size-110', 'smart-rtl-size-120', 'smart-rtl-size-130');
        el.classList.remove('smart-rtl-lh-relaxed', 'smart-rtl-lh-loose');
        FONT_CLASSES.forEach(cls => el.classList.remove(cls));
        el.style.removeProperty('font-family');
        el.style.removeProperty('direction');
        el.style.removeProperty('text-align');
    }

    function processElement(el) {
        if (isSiteDisabled()) return;
        if (isLayoutContainerOrUi(el)) return;
        if (el.hasAttribute(MANUAL_ATTR)) return;

        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            const val = el.value || el.placeholder || '';
            if (isPersianArabicText(val)) {
                setRtl(el);
            } else if (val.trim().length > 0 && el.hasAttribute('dir')) {
                setLtr(el);
            }
            return;
        }

        if (el.isContentEditable) {
            const val = el.textContent || '';
            if (isPersianArabicText(val)) {
                setRtl(el);
            } else if (val.trim().length > 0 && el.hasAttribute('dir')) {
                setLtr(el);
            }
            return;
        }

        if ((el.tagName === 'DIV' || el.tagName === 'A') && el.children.length > 0) {
            return;
        }

        const isTextTarget = ['P', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'TD', 'TH', 'LABEL', 'FIGCAPTION', 'SPAN', 'DIV'].includes(el.tagName);
        if (!isTextTarget) return;

        const text = el.textContent || '';
        if (!text || text.trim().length < 2) return;

        if (settings.mode === 'rtl') {
            if (isPersianArabicText(text)) {
                setRtl(el);
            }
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

    function scanNodeTree(root) {
        if (isSiteDisabled() || !root) return;
        
        if (root.nodeType === 1) {
            processElement(root);
            const nodes = root.querySelectorAll ? root.querySelectorAll(TARGET_SELECTOR) : [];
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                processElement(node);
                if (node.shadowRoot) {
                    scanNodeTree(node.shadowRoot);
                }
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

    /**
     * Absolute 100% Cleanup of ALL extension classes, inline fonts, dir attributes, and widgets
     */
    function removeAllStyles() {
        const fontSelector = FONT_CLASSES.map(c => '.' + c).join(', ');
        const selector = `.smart-rtl-text-right, .smart-rtl-text-left, ${fontSelector}, [dir="rtl"], [dir="ltr"]`;

        document.querySelectorAll(selector).forEach(el => {
            if (!el.hasAttribute(MANUAL_ATTR)) {
                clearDirection(el);
            }
        });

        removeFloatingWidget();
        removeInlineStyles();
    }

    /* Floating Quick Toggle Widget */
    function renderFloatingWidget() {
        let widget = document.getElementById('smart-rtl-floating-widget');
        if (!settings.showWidget || isSiteDisabled()) {
            removeFloatingWidget();
            return;
        }

        if (!widget) {
            widget = document.createElement('div');
            widget.id = 'smart-rtl-floating-widget';
            widget.innerHTML = '⇄';
            widget.title = 'تغییر جهت سریع متون (RTL / LTR)';
            widget.addEventListener('click', () => {
                if (isSiteDisabled()) return;
                const isRtlNow = document.body.getAttribute('data-smart-rtl-mode') === 'rtl';
                if (isRtlNow) {
                    settings.mode = 'ltr';
                    document.body.setAttribute('data-smart-rtl-mode', 'ltr');
                } else {
                    settings.mode = 'rtl';
                    document.body.setAttribute('data-smart-rtl-mode', 'rtl');
                }
                fullScan();
            });
            (document.body || document.documentElement).appendChild(widget);
        }
    }

    function removeFloatingWidget() {
        const widget = document.getElementById('smart-rtl-floating-widget');
        if (widget) widget.remove();
    }

    // Dynamic Throttled MutationObserver
    let pendingNodes = new Set();
    let timer = null;

    const observer = new MutationObserver((mutations) => {
        if (isSiteDisabled()) return;
        for (let i = 0; i < mutations.length; i++) {
            const m = mutations[i];
            if (m.type === 'childList') {
                for (let j = 0; j < m.addedNodes.length; j++) {
                    const node = m.addedNodes[j];
                    if (node.nodeType === 1) pendingNodes.add(node);
                }
            } else if (m.type === 'characterData' && m.target.parentElement) {
                pendingNodes.add(m.target.parentElement);
            }
        }
        if (pendingNodes.size && !timer) {
            timer = setTimeout(() => {
                const nodes = [...pendingNodes];
                pendingNodes.clear();
                timer = null;
                nodes.forEach(scanNodeTree);
            }, 80);
        }
    });

    function startObserving() {
        if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true, characterData: true });
        }
    }

    document.addEventListener('contextmenu', e => { lastContextElement = e.target; }, true);
    document.addEventListener('focusin', e => {
        if (e.target?.tagName === 'TEXTAREA' || e.target?.isContentEditable || e.target?.tagName === 'INPUT') {
            lastContextElement = e.target;
        }
    }, true);

    function toggleElementDirection(el) {
        if (isSiteDisabled()) return;
        if (!el || el === document.body) return;
        
        const target = el.closest('p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th, label, input, textarea, [contenteditable], span') || el;
        const currentDir = target.getAttribute('dir') || getComputedStyle(target).direction;
        
        target.setAttribute(MANUAL_ATTR, 'true');
        if (currentDir === 'rtl') {
            setLtr(target);
        } else {
            setRtl(target);
        }
    }

    document.addEventListener('input', (e) => {
        if (isSiteDisabled()) return;
        const target = e.target;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
            processElement(target);
        }
    }, true);

    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        if (msg.action === 'TOGGLE_CURRENT_ELEMENT_RTL') {
            toggleElementDirection(lastContextElement || document.activeElement);
            sendResponse({ status: 'ok' });
        } else if (msg.action === 'TRANSLATE_PAGE_FA') {
            translatePageToPersian();
            sendResponse({ status: 'ok' });
        } else if (msg.action === 'SETTINGS_UPDATED') {
            loadSettings(() => {
                if (isSiteDisabled()) {
                    removeAllStyles();
                } else {
                    fullScan();
                }
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
        if (isSiteDisabled()) {
            removeAllStyles();
        } else {
            fullScan();
        }
    });

    // Start Engine
    loadSettings(() => {
        if (isSiteDisabled()) {
            removeAllStyles();
        } else {
            fullScan();
            startObserving();
        }
    });

})();
