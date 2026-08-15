// inspector.js
// Handles the manual element selection for Smart Multi-RTL Pro

(() => {
    'use strict';

    let inspectorActive = false;
    let hoveredElement = null;

    function showToast(message) {
        let toast = document.getElementById('smart-rtl-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'smart-rtl-toast';
            toast.style.cssText = `
                position: fixed !important;
                top: 20px !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
                background: linear-gradient(135deg, #10b981, #059669) !important;
                color: #ffffff !important;
                padding: 10px 20px !important;
                border-radius: 10px !important;
                font-family: 'Vazirmatn', -apple-system, sans-serif !important;
                font-size: 13px !important;
                font-weight: 600 !important;
                box-shadow: 0 8px 24px rgba(0,0,0,0.3) !important;
                z-index: 2147483647 !important;
                direction: rtl !important;
                text-align: center !important;
                pointer-events: none !important;
                transition: opacity 0.3s ease, transform 0.3s ease !important;
            `;
            (document.body || document.documentElement).appendChild(toast);
        }
        toast.textContent = message;
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
        setTimeout(() => {
            if (toast) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(-50%) translateY(-10px)';
            }
        }, 2200);
    }

    function enableInspector() {
        if (inspectorActive) return;
        inspectorActive = true;
        document.addEventListener('mouseover', handleMouseOver, true);
        document.addEventListener('mouseout', handleMouseOut, true);
        document.addEventListener('click', handleClick, true);
        document.addEventListener('keydown', handleKeyDown, true);
        if (document.body) document.body.style.cursor = 'crosshair';
        showToast('🎯 روی هر المانی که می‌خواهید راست‌چین شود کلیک کنید (Esc برای انصراف)');
    }

    function disableInspector() {
        if (!inspectorActive) return;
        inspectorActive = false;
        document.removeEventListener('mouseover', handleMouseOver, true);
        document.removeEventListener('mouseout', handleMouseOut, true);
        document.removeEventListener('click', handleClick, true);
        document.removeEventListener('keydown', handleKeyDown, true);
        if (document.body) document.body.style.cursor = '';
        if (hoveredElement) {
            hoveredElement.classList.remove('smart-rtl-inspector-hover');
            hoveredElement = null;
        }
    }

    function handleMouseOver(e) {
        if (!inspectorActive) return;
        e.stopPropagation();
        if (hoveredElement) {
            hoveredElement.classList.remove('smart-rtl-inspector-hover');
        }
        hoveredElement = e.target;
        hoveredElement.classList.add('smart-rtl-inspector-hover');
    }

    function handleMouseOut(e) {
        if (!inspectorActive) return;
        e.stopPropagation();
        if (hoveredElement === e.target) {
            hoveredElement.classList.remove('smart-rtl-inspector-hover');
            hoveredElement = null;
        }
    }

    function isExtensionValid() {
        return typeof chrome !== 'undefined' && chrome.runtime && !!chrome.runtime.id;
    }

    function handleClick(e) {
        if (!inspectorActive) return;
        e.preventDefault();
        e.stopPropagation();

        const target = e.target;
        
        disableInspector();

        const selector = generateSelector(target);
        
        target.setAttribute('dir', 'rtl');
        target.classList.add('smart-rtl-text-right');
        target.classList.remove('smart-rtl-text-left');
        if (target.style) {
            target.style.setProperty('direction', 'rtl', 'important');
            target.style.setProperty('text-align', 'right', 'important');
            target.style.setProperty('unicode-bidi', 'isolate', 'important');
        }

        if (!isExtensionValid()) {
            showToast('✅ المان راست‌چین شد');
            return;
        }

        try {
            const hostname = window.location.hostname;
            chrome.storage.local.get(['manualSelectors'], (res) => {
                if (!isExtensionValid() || chrome.runtime?.lastError) return;
                const manualSelectors = res.manualSelectors || {};
                if (!manualSelectors[hostname]) {
                    manualSelectors[hostname] = [];
                }
                if (!manualSelectors[hostname].includes(selector)) {
                    manualSelectors[hostname].push(selector);
                    chrome.storage.local.set({ manualSelectors }, () => {
                        showToast('✅ المان مورد نظر با موفقیت راست‌چین و ذخیره شد');
                    });
                } else {
                    showToast('✅ المان راست‌چین شد');
                }
            });
        } catch (err) {
            showToast('✅ المان راست‌چین شد');
        }
    }

    function handleKeyDown(e) {
        if (!inspectorActive) return;
        if (e.key === 'Escape') {
            disableInspector();
            showToast('❌ انتخاب دستی لغو شد');
        }
    }

    function generateSelector(el) {
        if (el.tagName.toLowerCase() === 'html') return 'html';
        
        let path = [];
        let current = el;
        
        while (current && current.tagName && current.tagName.toLowerCase() !== 'html') {
            let selector = current.tagName.toLowerCase();
            
            if (current.id && !current.id.includes('smart-rtl')) {
                selector += `#${current.id}`;
                path.unshift(selector);
                break;
            } else {
                let classes = Array.from(current.classList).filter(c => 
                    !c.startsWith('smart-rtl-') && 
                    !c.includes(':') && 
                    !['flex', 'grid', 'block', 'w-full', 'h-full', 'relative', 'absolute'].includes(c)
                );
                
                if (classes.length > 0) {
                    selector += `.${classes.join('.')}`;
                }
                
                let sibling = current;
                let nth = 1;
                while ((sibling = sibling.previousElementSibling)) {
                    if (sibling.tagName === current.tagName) nth++;
                }
                if (nth > 1 || !classes.length) {
                    selector += `:nth-of-type(${nth})`;
                }
            }
            
            path.unshift(selector);
            current = current.parentElement;
        }
        
        return path.join(' > ');
    }

    if (isExtensionValid()) {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (!isExtensionValid()) return false;
            if (request.action === 'toggleInspector') {
                if (inspectorActive) {
                    disableInspector();
                    sendResponse({ active: false });
                } else {
                    enableInspector();
                    sendResponse({ active: true });
                }
                return true;
            }
        });
    }

    // Direct page shortcut: Ctrl + Space (or Ctrl + Shift + Space)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && (e.code === 'Space' || e.key === ' ') && !e.altKey && !e.metaKey) {
            const activeTag = document.activeElement ? document.activeElement.tagName : '';
            const isTyping = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || document.activeElement?.isContentEditable;
            if (!isTyping) {
                e.preventDefault();
                if (inspectorActive) {
                    disableInspector();
                } else {
                    enableInspector();
                }
            }
        }
    }, true);

})();


