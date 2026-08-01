document.addEventListener('DOMContentLoaded', async () => {
    const registrationOverlay = document.getElementById('registration-overlay');
    const countrySelect = document.getElementById('country-select');
    const phoneInput = document.getElementById('phone-input');
    const registerSubmitBtn = document.getElementById('registerSubmitBtn');
    const registerError = document.getElementById('register-error');

    const globalToggle = document.getElementById('global-toggle');
    const domainToggle = document.getElementById('domain-toggle');
    const currentDomainEl = document.getElementById('current-domain');
    const modeSelect = document.getElementById('mode-select');
    const fontSelect = document.getElementById('font-select');
    const sizeSelect = document.getElementById('size-select');
    const lineheightSelect = document.getElementById('lineheight-select');
    const numbersToggle = document.getElementById('numbers-toggle');
    const widgetToggle = document.getElementById('widget-toggle');
    const translatePageBtn = document.getElementById('translatePageBtn');
    const toggleCurrentBtn = document.getElementById('toggleCurrentBtn');
    const statusMsg = document.getElementById('status-msg');

    let currentDomain = '';
    let isHttpTab = false;

    const getActiveTab = (cb) =>
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => cb(tabs[0]));

    // Check Registration Status first
    chrome.storage.sync.get(['registered', 'userPhone', 'userCountry'], (res) => {
        if (res && res.registered) {
            registrationOverlay.classList.add('hidden');
        } else {
            registrationOverlay.classList.remove('hidden');
        }
    });

    function validatePhoneNumber(country, phone) {
        const cleaned = phone.replace(/[\s\-\+\(\)]/g, '');
        if (!cleaned || cleaned.length < 7) {
            return { valid: false, msg: 'لطفاً شماره موبایل معتبر وارد کنید.' };
        }

        if (country === 'IR') {
            if (/^(09|989|9)[0-9]{9}$/.test(cleaned)) return { valid: true };
            return { valid: false, msg: 'شماره همراه ایران باید با 09 شروع شود.' };
        }
        
        if (country === 'IQ') {
            if (/^(07|9647|7)[0-9]{8,9}$/.test(cleaned)) return { valid: true };
            return { valid: false, msg: 'شماره همراه عراق باید با 07 شروع شود.' };
        }

        if (country === 'LB') {
            if (/^(961|03|70|71|76|81|3|7)[0-9]{6,8}$/.test(cleaned)) return { valid: true };
            return { valid: false, msg: 'شماره همراه لبنان معتبر نیست.' };
        }

        if (country === 'YE') {
            if (/^(967|7|07)[0-9]{7,9}$/.test(cleaned)) return { valid: true };
            return { valid: false, msg: 'شماره همراه یمن معتبر نیست.' };
        }

        if (country === 'CN') {
            if (/^(861|1)[0-9]{10}$/.test(cleaned)) return { valid: true };
            return { valid: false, msg: 'شماره همراه چین معتبر نیست.' };
        }

        if (country === 'RU') {
            if (/^(7|8|9)[0-9]{9,10}$/.test(cleaned)) return { valid: true };
            return { valid: false, msg: 'شماره همراه روسیه معتبر نیست.' };
        }

        return { valid: true };
    }

    if (registerSubmitBtn) {
        registerSubmitBtn.addEventListener('click', () => {
            const country = countrySelect.value;
            const phone = phoneInput.value.trim();

            const check = validatePhoneNumber(country, phone);
            if (!check.valid) {
                registerError.textContent = check.msg;
                return;
            }

            registerError.textContent = '';
            registerSubmitBtn.disabled = true;
            registerSubmitBtn.textContent = 'در حال ثبت...';

            // تایم‌اوت برای جلوگیری از گیر کردن دکمه روی «در حال ثبت...»
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            let offline = false;

            fetch('https://www.mobtakerai.ir/api/register-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: phone,
                    country: country,
                    timestamp: new Date().toISOString(),
                    app: 'Multi-RTL-Pro'
                }),
                signal: controller.signal
            }).catch(() => {
                // بدون اتصال به سرور هم فعال‌سازی به صورت محلی انجام می‌شود
                offline = true;
                registerError.textContent = '⚠️ اتصال به سرور برقرار نشد؛ فعال‌سازی به صورت محلی ذخیره شد.';
                registerError.style.color = '#f59e0b';
            }).finally(() => {
                clearTimeout(timeoutId);
                chrome.storage.sync.set({
                    registered: true,
                    userPhone: phone,
                    userCountry: country
                }, () => {
                    registrationOverlay.classList.add('hidden');
                    notifyContentScript();
                    // اگر آفلاین بود، اجازه بده پیام دیده شود بعد راهنما باز شود
                    const openGuide = () => chrome.tabs.create({ url: chrome.runtime.getURL('guide.html') });
                    if (offline) setTimeout(openGuide, 1500);
                    else openGuide();
                });
            });
        });
    }

    // Tab Navigation switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            tabBtns.forEach((b) => b.classList.remove('active'));
            tabContents.forEach((c) => c.classList.remove('active'));

            btn.classList.add('active');
            const targetTab = document.getElementById(btn.getAttribute('data-tab'));
            if (targetTab) targetTab.classList.add('active');
        });
    });

    document.querySelectorAll('a[href^="http"]').forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            if (href) {
                chrome.tabs.create({ url: href });
            }
        });
    });

    // Get current tab domain first, then load settings
    // (ترتیب مهم است تا وضعیت «فعال در این وب‌سایت» درست نمایش داده شود)
    getActiveTab((tab) => {
        if (tab && tab.url && tab.url.startsWith('http')) {
            try {
                const urlObj = new URL(tab.url);
                currentDomain = urlObj.hostname.toLowerCase();
                currentDomainEl.textContent = currentDomain;
                isHttpTab = true;
            } catch (e) {
                currentDomainEl.textContent = 'صفحه وب';
            }
        } else {
            currentDomainEl.textContent = 'صفحه مرورگر';
            domainToggle.disabled = true;
        }

        // Load initial settings (فقط بعد از مشخص شدن دامنه)
        chrome.storage.sync.get({
            enabled: true,
            font: 'vazir',
            mode: 'auto',
            fontSize: '100',
            lineHeight: 'normal',
            convertNumbers: false,
            showWidget: false,
            disabledSites: []
        }, (stored) => {
            globalToggle.checked = stored.enabled;
            modeSelect.value = stored.mode || 'auto';
            fontSelect.value = stored.font || 'vazir';
            sizeSelect.value = stored.fontSize || '100';
            lineheightSelect.value = stored.lineHeight || 'normal';
            numbersToggle.checked = !!stored.convertNumbers;
            widgetToggle.checked = !!stored.showWidget;

            if (currentDomain) {
                const isDisabled = Array.isArray(stored.disabledSites) && stored.disabledSites.some(site => {
                    const s = site.toLowerCase().trim();
                    return currentDomain === s || currentDomain.endsWith('.' + s) || s.endsWith('.' + currentDomain);
                });
                domainToggle.checked = !isDisabled;
            }
            updateUiState();
        });
    });



    function updateUiState() {
        const isOff = !globalToggle.checked || !domainToggle.checked;
        const controls = [modeSelect, fontSelect, sizeSelect, lineheightSelect, numbersToggle, widgetToggle, translatePageBtn, toggleCurrentBtn];
        controls.forEach(c => {
            if (c) c.disabled = isOff;
        });
        document.querySelectorAll('.card').forEach(card => {
            if (card.querySelector('#global-toggle') || card.querySelector('#domain-toggle')) {
                // If it's the global toggle, never disable it visually.
                // If it's the domain toggle, only disable it visually if global toggle is off.
                if (card.querySelector('#domain-toggle')) {
                    if (!globalToggle.checked) {
                        card.style.opacity = '0.5';
                        card.style.pointerEvents = 'none';
                    } else {
                        card.style.opacity = '1';
                        card.style.pointerEvents = 'auto';
                    }
                }
                return;
            }

            if (isOff) {
                card.style.opacity = '0.5';
                card.style.pointerEvents = 'none';
            } else {
                card.style.opacity = '1';
                card.style.pointerEvents = 'auto';
            }
        });
    }

    function saveSettings() {
        updateUiState();

        chrome.storage.sync.get({ disabledSites: [] }, (stored) => {
            let disabledSites = stored.disabledSites || [];

            if (currentDomain) {
                if (!domainToggle.checked) {
                    if (!disabledSites.includes(currentDomain)) {
                        disabledSites.push(currentDomain);
                    }
                } else {
                    disabledSites = disabledSites.filter(d => d !== currentDomain && !currentDomain.endsWith('.' + d) && !d.endsWith('.' + currentDomain));
                }
            }

            const newSettings = {
                enabled: globalToggle.checked,
                font: fontSelect.value,
                mode: modeSelect.value,
                fontSize: sizeSelect.value,
                lineHeight: lineheightSelect.value,
                convertNumbers: numbersToggle.checked,
                showWidget: widgetToggle.checked,
                disabledSites: disabledSites
            };

            chrome.storage.sync.set(newSettings, () => {
                showStatusMessage();
                notifyContentScript();
            });
        });
    }

    function notifyContentScript() {
        getActiveTab((tab) => {
            if (!tab || !tab.id) return;
            chrome.tabs.sendMessage(tab.id, { action: 'SETTINGS_UPDATED' }).catch(() => {});
        });
    }

    function showStatusMessage() {
        if (!statusMsg) return;
        statusMsg.classList.add('show');
        setTimeout(() => {
            statusMsg.classList.remove('show');
        }, 1200);
    }

    if (translatePageBtn) {
        translatePageBtn.addEventListener('click', () => {
            getActiveTab((tab) => {
                if (!tab || !tab.id) return;
                chrome.tabs.sendMessage(tab.id, { action: 'TRANSLATE_PAGE_FA' }).catch(() => {});
            });
        });
    }

    if (toggleCurrentBtn) {
        toggleCurrentBtn.addEventListener('click', () => {
            getActiveTab((tab) => {
                if (!tab || !tab.id) return;
                chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_CURRENT_ELEMENT_RTL' }).catch(() => {});
            });
        });
    }

    // Event Listeners
    globalToggle.addEventListener('change', saveSettings);
    domainToggle.addEventListener('change', saveSettings);
    modeSelect.addEventListener('change', saveSettings);
    fontSelect.addEventListener('change', saveSettings);
    sizeSelect.addEventListener('change', saveSettings);
    lineheightSelect.addEventListener('change', saveSettings);
    numbersToggle.addEventListener('change', saveSettings);
    widgetToggle.addEventListener('change', saveSettings);
});
