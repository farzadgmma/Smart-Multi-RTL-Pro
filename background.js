/**
 * Smart Multi-RTL Pro Background Service Worker
 */

chrome.runtime.onInstalled.addListener(() => {
    // Create Context Menu
    chrome.contextMenus.create({
        id: 'toggle-rtl-ltr',
        title: 'تغییر جهت متن (RTL / LTR)',
        contexts: ['selection', 'editable', 'page']
    });

    // Auto-inject content script into ALL currently open tabs on install/update (No Refresh Required!)
    chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] }, (tabs) => {
        for (const tab of tabs) {
            if (tab.id) {
                chrome.scripting.insertCSS({
                    target: { tabId: tab.id },
                    files: ['content.css']
                }).catch(() => {});

                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                }).catch(() => {});
            }
        }
    });
});

// Context Menu listener
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'toggle-rtl-ltr' && tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_CURRENT_ELEMENT_RTL' }).catch(() => {});
    }
});

// Shortcut command listener
chrome.commands.onCommand.addListener((command) => {
    if (command === 'toggle-rtl') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'TOGGLE_CURRENT_ELEMENT_RTL' }).catch(() => {});
            }
        });
    }
});
