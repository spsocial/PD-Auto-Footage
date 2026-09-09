/**
 * PD Auto Footage — Build Script (obfuscate + dist)
 * วิธีใช้: node build.js   (รันจากโฟลเดอร์ PD-Auto-Footage)
 *
 * ⚠️ Footage เป็นสถาปัตยกรรม message-based ล้วน (panel ↔ vip-engine ↔ background
 *    แลกเปลี่ยน object ที่อ่าน key ตรงๆ เช่น {success, base64, sceneIndex, action})
 *    → ใช้ SAFE profile ทุกไฟล์ (transformObjectKeys:false) ไม่งั้น key โดน rename
 *    แล้ว message ข้าม context พังหมด · ยังกัน reverse ได้ดี (stringArray base64+rc4
 *    + hex identifiers + split strings)
 */

const fs = require('fs');
const path = require('path');

// ใช้ javascript-obfuscator จาก node_modules ของ PD Auto VIP (footage ไม่มี node_modules แยก)
const VIP_OBF = path.join('C:', 'Users', 'usEr', 'Desktop', 'โปรเจ็ค Extension', 'PD Auto VIP', 'node_modules', 'javascript-obfuscator');
let JavaScriptObfuscator;
try { JavaScriptObfuscator = require('javascript-obfuscator'); }
catch (e) { JavaScriptObfuscator = require(VIP_OBF); }

const VERSION = '0.7.9';
const DIST_DIR = 'dist';

// ── ไฟล์ JS ที่ต้อง obfuscate (SAFE profile ทุกไฟล์ — เหตุผลด้านบน) ──
const FILES_TO_OBFUSCATE = [
  'panel/license.js',
  'panel/panel.js',
  'panel/ai.js',
  'panel/tts.js',
  'panel/engine.js',
  'panel/picker.js',
  'panel/clipmerge.js',
  'content/flow-api.js',
  'content/flow-api-new.js',
  'content/flow-merge-new.js',   // Flow app flow.google.com (batchexecute) - MAIN world same as flow-api.js
  'content/flow-hook.js',
  'content/mini-flow.js',
  'content/mini-tiktok.js',
  'content/tiktok-content.js',
  'content/tiktok-injected.js',
  'content/vip-engine.js',
  'background/service-worker.js',
];

// ── ไฟล์/โฟลเดอร์ที่ copy ตรงๆ (ไม่ obfuscate) ──
const FILES_TO_COPY = [
  'manifest.json',
  'panel/panel.html',
  'panel/panel.css',
  'panel/picker.html',
  'panel/clipmerge.html',
  'assets',
  'lib',
];

// SAFE profile — กัน cross-context พัง แต่ยังอ่านยากมาก
const SAFE_OBFUSCATION = {
  compact: true,
  controlFlowFlattening: false,   // กัน hook/timing เพี้ยน
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,
  deadCodeInjection: false,
  stringArray: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayThreshold: 0.75,
  stringArrayEncoding: ['base64', 'rc4'],
  stringArrayIndexShift: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersType: 'function',
  unicodeEscapeSequence: true,
  debugProtection: false,
  disableConsoleOutput: false,
  numbersToExpressions: true,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 10,
  transformObjectKeys: false,     // ⚠️ สำคัญสุด — กัน message key พัง
  selfDefending: false,
  target: 'browser',
};

function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

function copyRecursive(src, dest) {
  const stat = fs.lstatSync(src);
  if (stat.isDirectory()) {
    ensureDir(dest);
    for (const f of fs.readdirSync(src)) copyRecursive(path.join(src, f), path.join(dest, f));
  } else {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
  }
}

function deleteRecursive(p) {
  if (!fs.existsSync(p)) return;
  for (const f of fs.readdirSync(p)) {
    const cur = path.join(p, f);
    if (fs.lstatSync(cur).isDirectory()) deleteRecursive(cur);
    else fs.unlinkSync(cur);
  }
  fs.rmdirSync(p);
}

// เก็บหัวคอมเมนต์ Legal (บรรทัด ⚖️/©) ไว้ให้โจรอ่านเห็น — แปะกลับหลัง obfuscate
function extractLegal(code) {
  const lines = code.split('\n');
  const out = [];
  for (const line of lines) {
    if (/^\s*\/\/.*(⚖️|LEGAL|ลิขสิทธิ์|©|พร้อมดี|All rights reserved)/.test(line)) out.push(line);
    else if (out.length && /^\s*\/\//.test(line)) out.push(line); // คอมเมนต์ต่อเนื่องหลัง legal
    else if (out.length) break;
  }
  return out.length ? out.join('\n') + '\n\n' : '';
}

function obfuscate(srcRel) {
  const src = path.join(__dirname, srcRel);
  const dest = path.join(__dirname, DIST_DIR, srcRel);
  if (!fs.existsSync(src)) { console.log('   ⚠️ skip (not found): ' + srcRel); return; }
  const code = fs.readFileSync(src, 'utf8');
  const legal = extractLegal(code);
  try {
    const out = JavaScriptObfuscator.obfuscate(code, SAFE_OBFUSCATION).getObfuscatedCode();
    const final = legal + out;
    ensureDir(path.dirname(dest));
    fs.writeFileSync(dest, final);
    const inKB = (Buffer.byteLength(code) / 1024).toFixed(0);
    const outKB = (Buffer.byteLength(final) / 1024).toFixed(0);
    console.log('   🔐 ' + srcRel + '  (' + inKB + 'KB → ' + outKB + 'KB)' + (legal ? '  📜 legal kept' : ''));
  } catch (err) {
    console.log('   ❌ obfuscate fail ' + srcRel + ': ' + err.message + ' → copy ดิบแทน');
    copyRecursive(src, dest);
  }
}

async function build() {
  const t0 = Date.now();
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   PD Auto Footage — Protected Build v' + VERSION + '       ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  console.log('📁 1) เคลียร์ dist/...');
  deleteRecursive(path.join(__dirname, DIST_DIR));
  ensureDir(path.join(__dirname, DIST_DIR));

  console.log('📋 2) copy ไฟล์ static...');
  for (const f of FILES_TO_COPY) {
    const src = path.join(__dirname, f);
    if (fs.existsSync(src)) { copyRecursive(src, path.join(__dirname, DIST_DIR, f)); console.log('   ✓ ' + f); }
    else console.log('   ⚠️ ' + f + ' (not found)');
  }

  console.log('\n🔐 3) obfuscate JS (SAFE profile)...');
  for (const f of FILES_TO_OBFUSCATE) obfuscate(f);

  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║              BUILD เสร็จ!                      ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('   ⏱️  ' + ((Date.now() - t0) / 1000).toFixed(1) + ' วิ  📁 ' + DIST_DIR + '/');
  console.log('   ขั้นต่อไป: zip โฟลเดอร์ dist/ → ส่งลูกค้า');
}

build().catch(console.error);
