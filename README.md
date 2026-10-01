# Smart Multi-RTL Pro 🌐✨ (`@mobtakerai/rtl-pro`)

[![npm version](https://img.shields.io/npm/v/@mobtakerai/rtl-pro.svg?color=cb3837)](https://www.npmjs.com/package/@mobtakerai/rtl-pro)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bundle Size](https://img.shields.io/badge/bundle%20size-<25KB-success)](https://www.npmjs.com/package/@mobtakerai/rtl-pro)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Developer](https://img.shields.io/badge/Developer-MobtakerAi%20(مبتکران%20نیک%20افزار)-purple)](https://mobtakerai.ir)

**Smart Multi-RTL Pro** is a high-performance, zero-latency Persian & Arabic auto-RTL engine and typography optimizer. Available both as an **npm library (`@mobtakerai/rtl-pro`)** for web applications (React, Next.js, Vue, Angular, Svelte, Vanilla JS) and as an **advanced Chrome Extension**.

[📦 NPM Package Quick Start](#-npm-package-installation--usage) | [🇮🇷 راهنمای فارسی](#-راهنمای-فارسی---پکیج-npm-و-افزونه) | [🧩 Chrome Extension](#-chrome-extension)

---

## 📦 NPM Package: Installation & Usage

Install the core engine in any JavaScript or TypeScript project with a single command:

```bash
# npm
npm install @mobtakerai/rtl-pro

# yarn
yarn add @mobtakerai/rtl-pro

# pnpm
pnpm add @mobtakerai/rtl-pro
```

### ⚡ 1. Vanilla JavaScript / Single Page Apps

```javascript
import { initRtl } from '@mobtakerai/rtl-pro';
import '@mobtakerai/rtl-pro/styles.css'; // Optional if injectStyles: true (default)

// Initialize the engine on the entire document or a specific container
const rtlController = initRtl({
  target: document.body,
  mode: 'auto',          // 'auto' | 'rtl' | 'ltr' | 'manual'
  font: 'vazir',         // 'vazir' | 'yekan' | 'estedad' | 'dana' | 'shabnam' | 'system'
  fontSize: '100',       // '100' | '110' | '120' | '130'
  convertNumbers: false, // Convert English digits (123) to Persian (۱۲۳)
  preserveCode: true     // Guarantees <pre>, <code>, Monaco editors remain strictly LTR
});

// Programmatic control:
// rtlController.scan();             // Re-scan dynamic content
// rtlController.setMode('rtl');     // Change alignment mode
// rtlController.setFont('yekan');   // Change typography
// rtlController.disconnect();       // Pause MutationObserver
// rtlController.destroy();          // Clean up when unmounting
```

### ⚛️ 2. React / Next.js (App & Pages Router)

```tsx
'use client';
import { useEffect } from 'react';
import { initRtl } from '@mobtakerai/rtl-pro';

export default function App() {
  useEffect(() => {
    // Automatically runs only on client-side (100% SSR Safe)
    const controller = initRtl({
      mode: 'auto',
      font: 'vazir',
      convertNumbers: false
    });

    return () => {
      controller.destroy();
    };
  }, []);

  return (
    <main>
      <h1>سیستم مدیریت هوشمند</h1>
      <p>این متن به طور خودکار راست‌چین می‌شود و کلمات English دست‌نخورده باقی می‌مانند.</p>
    </main>
  );
}
```

### 🟢 3. Vue 3 (Composition API)

```vue
<script setup>
import { onMounted, onUnmounted } from 'vue';
import { initRtl } from '@mobtakerai/rtl-pro';

let rtlController = null;

onMounted(() => {
  rtlController = initRtl({
    target: '#app',
    mode: 'auto'
  });
});

onUnmounted(() => {
  rtlController?.destroy();
});
</script>
```

### 🌐 4. Direct CDN / Browser Script Tag (No Bundler)

```html
<!-- Include UMD Script from CDN -->
<script src="https://cdn.jsdelivr.net/npm/@mobtakerai/rtl-pro/dist/index.global.js"></script>

<script>
  // Access via global window.RtlPro
  window.RtlPro.initRtl({
    mode: 'auto',
    font: 'vazir'
  });
</script>
```

---

## 🛠️ Configuration Options (`RtlOptions`)

| Option | Type | Default | Description |
|---|---|---|---|
| `target` | `HTMLElement \| string` | `document.body` | Root element or CSS selector to monitor and format. |
| `mode` | `'auto' \| 'rtl' \| 'ltr' \| 'manual'` | `'auto'` | **auto**: Smart language detection. **rtl**: Force RTL. **ltr**: Force LTR. |
| `font` | `string` | `'vazir'` | Persian font family: `'vazir'`, `'yekan'`, `'estedad'`, `'dana'`, `'shabnam'`, `'tanha'`, `'gandom'`, `'samim'`, `'system'`. |
| `fontSize` | `'100' \| '110' \| '120' \| '130'` | `'100'` | Font scale percentage. |
| `lineHeight` | `'normal' \| 'relaxed' \| 'loose'` | `'normal'` | Line height preset for improved Persian reading comfort. |
| `convertNumbers` | `boolean` | `false` | Automatically converts Latin digits (123) to Persian digits (۱۲۳). |
| `preserveCode` | `boolean` | `true` | Protects `<pre>`, `<code>`, Monaco, Prism, Highlight.js from direction flips. |
| `injectStyles` | `boolean` | `true` | Automatically injects zero-latency isolation styles into `document.head`. |
| `throttleMs` | `number` | `60` | Streaming debounce throttle in milliseconds (maintains 60/120 FPS). |

### 🧰 Standalone Utility Functions

```javascript
import { 
  isPersianArabicText, 
  isPureEnglishText, 
  convertDigitsToPersian,
  setRtl,
  setLtr,
  clearDirection
} from '@mobtakerai/rtl-pro';

isPersianArabicText('سلام دنیا'); // true
isPersianArabicText('Hello world'); // false

isPureEnglishText('Hello world'); // true
isPureEnglishText('Hello دنیا'); // false

convertDigitsToPersian('نسخه 2026'); // "نسخه ۲۰۲۶"
```

---

## 🧩 Chrome Extension

Smart Multi-RTL Pro is also a production-grade Chrome Extension packed with features:
- **Zero-Latency Engine v6.0:** Native C++ `TreeWalker` traversal with sub-millisecond execution (<1ms).
- **AI Streaming Ready:** Zero layout thrashing or browser freezing during real-time LLM token generation (ChatGPT, Claude, Arena.ai).
- **Manual Inspector Tool:** Press <kbd>Ctrl</kbd> + <kbd>Space</kbd> on any web page to manually select and lock any element into RTL.
- **Quick Direction Shortcut:** Press <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd> to toggle direction of the currently focused block.

### Chrome Extension Installation:
1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top-right corner.
4. Click **Load unpacked** and select this directory.

---

## 🇮🇷 راهنمای فارسی - پکیج NPM و افزونه

پکیج رسمی **`@mobtakerai/rtl-pro`** قدرتمندترین موتور متن‌باز تشخیص خودکار زبان‌های راست‌به‌چپ (فارسی و عربی) و بهینه‌سازی تایپوگرافی است که توسط شرکت **مبتکران نیک افزار** توسعه داده شده است.

### 🌟 ویژگی‌های برجسته:
1. **سرعت فوق‌العاده با موتور بومی (C++ TreeWalker):** به جای پیمایش سنگین ده‌ها هزار تگ `div`، مستقیماً گره‌های متنی را در کسری از میلی‌ثانیه پردازش می‌کند.
2. **سازگاری کامل با استریم هوش مصنوعی (AI Streaming):** در صفحات چت هوش مصنوعی (مثل ChatGPT و آرنا) متن‌های ورودی بدون افت فریم و بدون فریز مرورگر پردازش می‌شوند.
3. **مصونیت قطعی بلاک‌های کد و ادیتورها:** تگ‌های `<pre>`, `<code>`, Monaco, Prism بدون کوچکترین به‌هم‌ریختگی یا معکوس‌شدن پرانتزها و براکت‌ها چپ‌چین باقی می‌مانند.
4. **تایپوگرافی زیبای فارسی:** پشتیبانی از فونت‌های محبوب (وزیرمتن، ایران‌یکان، دانا، شبنم، استعداد و...) بدون نیاز به دانلود شبکه (صفر انسداد رندر).

### نصب پکیج:
```bash
npm install @mobtakerai/rtl-pro
```

---

## 📄 License

MIT License © 2026 **MobtakerAi (مبتکران نیک افزار)** & Farzad Gmma.
Free for personal and commercial open-source projects.
