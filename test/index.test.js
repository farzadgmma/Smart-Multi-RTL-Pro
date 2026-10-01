const assert = require('assert');
const path = require('path');

console.log('Running @mobtakerai/rtl-pro test suite...\n');

// 1. Test CommonJS Import
const rtlPro = require('../dist/index.cjs');

assert.strictEqual(typeof rtlPro, 'function', 'Default export should be initRtl function');
assert.strictEqual(typeof rtlPro.initRtl, 'function', 'Named export initRtl should exist');
assert.strictEqual(typeof rtlPro.isPersianArabicText, 'function', 'isPersianArabicText should be exported');
assert.strictEqual(typeof rtlPro.isPureEnglishText, 'function', 'isPureEnglishText should be exported');
assert.strictEqual(typeof rtlPro.convertDigitsToPersian, 'function', 'convertDigitsToPersian should be exported');
assert.strictEqual(typeof rtlPro.scanNodeTree, 'function', 'scanNodeTree should be exported');
console.log('✔ CJS Module exports verified');

// 2. Test isPersianArabicText
assert.strictEqual(rtlPro.isPersianArabicText('سلام دنیا'), true, 'Should detect pure Persian');
assert.strictEqual(rtlPro.isPersianArabicText('Hello دنیا'), true, 'Should detect mixed Persian');
assert.strictEqual(rtlPro.isPersianArabicText('Hello world'), false, 'Should reject pure English');
assert.strictEqual(rtlPro.isPersianArabicText('12345'), false, 'Should reject pure numbers');
assert.strictEqual(rtlPro.isPersianArabicText(''), false, 'Should handle empty string');
assert.strictEqual(rtlPro.isPersianArabicText(null), false, 'Should handle null');
console.log('✔ isPersianArabicText logic verified');

// 3. Test isPureEnglishText
assert.strictEqual(rtlPro.isPureEnglishText('Hello world'), true, 'Should accept pure English');
assert.strictEqual(rtlPro.isPureEnglishText('Hello world 123'), true, 'Should accept English with numbers');
assert.strictEqual(rtlPro.isPureEnglishText('سلام دنیا'), false, 'Should reject Persian');
assert.strictEqual(rtlPro.isPureEnglishText('Hello دنیا'), false, 'Should reject mixed text');
assert.strictEqual(rtlPro.isPureEnglishText('12345'), false, 'Should reject pure numbers');
console.log('✔ isPureEnglishText logic verified');

// 4. Test convertDigitsToPersian
assert.strictEqual(rtlPro.convertDigitsToPersian('1234567890'), '۱۲۳۴۵۶۷۸۹۰', 'Should convert all 10 digits');
assert.strictEqual(rtlPro.convertDigitsToPersian('تست 2026 میلادی'), 'تست ۲۰۲۶ میلادی', 'Should convert digits inside Persian text');
assert.strictEqual(rtlPro.convertDigitsToPersian('No digits here'), 'No digits here', 'Should leave non-digit text unchanged');
console.log('✔ convertDigitsToPersian logic verified');

// 5. Test SSR safety (running in Node without window/document)
const controller = rtlPro.initRtl({ mode: 'auto' });
assert.strictEqual(typeof controller, 'object', 'Controller should be returned');
assert.strictEqual(typeof controller.scan, 'function', 'controller.scan should be a function');
assert.strictEqual(typeof controller.setMode, 'function', 'controller.setMode should be a function');
assert.strictEqual(typeof controller.setFont, 'function', 'controller.setFont should be a function');
assert.strictEqual(typeof controller.disconnect, 'function', 'controller.disconnect should be a function');
assert.strictEqual(typeof controller.destroy, 'function', 'controller.destroy should be a function');

// Invoking methods in SSR mode should be safe and not throw
assert.doesNotThrow(() => {
    controller.scan();
    controller.setMode('rtl');
    controller.setFont('vazir');
    controller.disconnect();
    controller.destroy();
}, 'SSR controller calls should never throw');
console.log('✔ SSR Safety verified (Zero-crash in Node.js / Next.js SSR)');

// 6. Test Global / UMD file
const globalCode = require('fs').readFileSync(path.join(__dirname, '../dist/index.global.js'), 'utf8');
assert(globalCode.includes('global.RtlPro'), 'UMD bundle must attach to global.RtlPro');
console.log('✔ Browser UMD bundle structure verified');

console.log('\n✨ All tests passed with 100% success!');
