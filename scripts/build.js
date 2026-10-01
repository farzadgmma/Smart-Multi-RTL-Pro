const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
}

console.log('Building @mobtakerai/rtl-pro bundles...');

// 1. Read Source Files
const srcCode = fs.readFileSync(path.join(SRC_DIR, 'index.js'), 'utf8');
const dtsCode = fs.readFileSync(path.join(SRC_DIR, 'index.d.ts'), 'utf8');
const cssCode = fs.readFileSync(path.join(ROOT_DIR, 'content.css'), 'utf8');

// 2. Emit ESM (dist/index.mjs)
fs.writeFileSync(path.join(DIST_DIR, 'index.mjs'), srcCode, 'utf8');
console.log('✔ Emitted dist/index.mjs (ESM)');

// 3. Emit CommonJS (dist/index.cjs)
// Transform ES exports to CJS module.exports
let cjsCode = srcCode;

// Replace export const / export function / export default
const namedExports = [];

cjsCode = cjsCode.replace(/export\s+const\s+([A-Za-z0-9_]+)\s*=/g, (match, name) => {
    namedExports.push(name);
    return `const ${name} =`;
});

cjsCode = cjsCode.replace(/export\s+function\s+([A-Za-z0-9_]+)\s*\(/g, (match, name) => {
    namedExports.push(name);
    return `function ${name}(`;
});

cjsCode = cjsCode.replace(/export\s+default\s+([A-Za-z0-9_]+);?/g, '');

let cjsFooter = `
module.exports = initRtl;
module.exports.default = initRtl;
`;

namedExports.forEach(name => {
    cjsFooter += `module.exports.${name} = ${name};\n`;
});

cjsCode = cjsCode.trim() + '\n' + cjsFooter;
fs.writeFileSync(path.join(DIST_DIR, 'index.cjs'), cjsCode, 'utf8');
console.log('✔ Emitted dist/index.cjs (CommonJS)');

// 4. Emit Browser UMD / Global (dist/index.global.js)
let umdCode = `(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        factory(exports);
    } else if (typeof define === 'function' && define.amd) {
        define(['exports'], factory);
    } else {
        global = typeof globalThis !== 'undefined' ? globalThis : global || self;
        factory(global.RtlPro = {});
    }
})(this, (function (exports) {
    'use strict';

`;

let innerUmd = srcCode;
innerUmd = innerUmd.replace(/export\s+const\s+([A-Za-z0-9_]+)\s*=/g, (m, name) => `const ${name} = exports.${name} =`);
innerUmd = innerUmd.replace(/export\s+function\s+([A-Za-z0-9_]+)\s*\(/g, (m, name) => `function ${name}(`);
innerUmd = innerUmd.replace(/export\s+default\s+([A-Za-z0-9_]+);?/g, '');

let umdExports = '\n';
namedExports.forEach(name => {
    umdExports += `    exports.${name} = ${name};\n`;
});
umdExports += `    exports.default = initRtl;\n`;

umdCode += innerUmd.split('\n').map(l => '    ' + l).join('\n');
umdCode += umdExports;
umdCode += `\n}));\n`;

fs.writeFileSync(path.join(DIST_DIR, 'index.global.js'), umdCode, 'utf8');
console.log('✔ Emitted dist/index.global.js (Browser UMD / Global)');

// 5. Copy TypeScript Definitions & CSS
fs.writeFileSync(path.join(DIST_DIR, 'index.d.ts'), dtsCode, 'utf8');
console.log('✔ Emitted dist/index.d.ts (TypeScript definitions)');

fs.writeFileSync(path.join(DIST_DIR, 'styles.css'), cssCode, 'utf8');
console.log('✔ Emitted dist/styles.css');

console.log('🎉 Build completed successfully!');
