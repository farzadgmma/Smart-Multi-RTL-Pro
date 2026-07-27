/**
* Smart Multi-RTL Pro Background Service Worker v1.1
* Fixed: Double-injection bug that caused broken typing on already-open tabs after update/reload
*/


function setupContextMenu() {
chrome.contextMenus.removeAll(() => {
chrome.contextMenus.create({
id: 'toggle-rtl-ltr',
title: 'تغییر جهت متن (RTL / LTR)',
contexts: ['selection', 'editable', 'page']
});
});
}


function injectIntoTab(tab) {
if (!tab.id) return;
chrome.scripting.insertCSS({
target: { tabId: tab.id, allFrames: true },
files: ['content.css']
}).catch(() => {});


chrome.scripting.executeScript({
target: { tabId: tab.id, allFrames: true },
files: ['content.js']
}).catch(() => {});
}


/**
* قبل از تزریق، چک می‌کنیم که آیا content.js از قبل روی این تب فعال است یا نه
* (جلوگیری از تزریق دوگانه که باعث خرابی تایپ فارسی می‌شد)
*/
function injectIfNotPresent(tab) {
if (!tab.id) return;
chrome.tabs.sendMessage(tab.id, { action: 'PING' }, (response) => {
if (chrome.runtime.lastError || !response || response.status !== 'alive') {
injectIntoTab(tab);
}
// اگر پاسخ آمد یعنی از قبل فعال است -> هیچ کاری نکن
});
}


chrome.runtime.onInstalled.addListener((details) => {
setupContextMenu();


chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] }, (tabs) => {
for (const tab of tabs) {
if (details.reason === 'install') {
// نصب تازه: مطمئناً هیچ تبی content script ندارد
injectIntoTab(tab);
} else {
// آپدیت/ری‌لود: احتمالاً بعضی تب‌ها از قبل content script فعال دارند
injectIfNotPresent(tab);
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
