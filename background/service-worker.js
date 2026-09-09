// =====================================================================
// PD Auto Flow Mini — Service Worker
// v0.1: เปิด side panel เมื่อกดไอคอน extension
// =====================================================================

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('[PD Footage] installed');
});

// ════════════════════════════════════════════════════════════════
// Merge Mode anti-403 — CDP humanized session (ported จาก PD Auto VIP v4.5.7)
//   reCAPTCHA Enterprise v3 ให้คะแนน "ทั้ง session ต่อเนื่อง" ไม่ใช่แค่ตอนคลิก
//   กุญแจสำคัญสุด = ambient activity (ขยับเมาส์/scroll เบาๆ ตลอด) ให้ session ดูมีชีวิต
//   + humanized CDP click จริง (bezier ease-out + overshoot + jitter) จ่อ Flow
//   → reCAPTCHA มองเป็นคนจริง → API generate ผ่าน ไม่โดน 403
//   Yellow bar (debugger) จะค้างระหว่าง Merge Mode ทำงาน — เป็นเรื่องปกติ
// ════════════════════════════════════════════════════════════════
const _mouse = {};    // tabId -> {x, y}  ตำแหน่งเมาส์ล่าสุด (ต่อเนื่อง ไม่วาร์ป)
const _ambient = {};  // tabId -> { running, timer, forcePaused, pauseUntil }
const _busy = {};     // tabId -> true ระหว่างคลิก (ให้ ambient หยุดชั่วคราว)

function _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// คลิกเดี่ยว (mousePressed→released) — VIP engine ใช้สำหรับปุ่ม Create/Generate ที่ JS click ไม่ติด
async function cdpClickAt(tabId, x, y) {
  let attached = false;
  try {
    try { await chrome.debugger.attach({ tabId }, '1.3'); attached = true; }
    catch (e) { if (!String(e.message || '').toLowerCase().includes('already attached')) throw e; }
    await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await new Promise(r => setTimeout(r, 80));
    await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
    _mouse[tabId] = { x, y };
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err.message || err) };
  } finally {
    // detach เฉพาะถ้าเรา attach เอง (ตอน ambient ไม่ทำงาน) — ไม่งั้นปล่อยให้ ambient ถือ debugger ต่อ
    if (attached && !(_ambient[tabId] && _ambient[tabId].running)) {
      try { await chrome.debugger.detach({ tabId }); } catch (e) { /* ignore */ }
    }
  }
}

function _lastMouse(tabId) {
  return _mouse[tabId] || { x: 400 + Math.floor(Math.random() * 200), y: 300 + Math.floor(Math.random() * 200) };
}

async function _ensureAttached(tabId) {
  try { await chrome.debugger.attach({ tabId }, '1.3'); }
  catch (e) { if (!String(e.message || '').toLowerCase().includes('already attached')) throw e; }
}

async function _move(tabId, x, y) {
  await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none' });
  _mouse[tabId] = { x, y };
}

// bezier ease-out จากตำแหน่งล่าสุด → เป้า (ช้าลงตอนใกล้ + บางครั้ง overshoot แล้วดึงกลับ)
function _humanPath(x0, y0, x1, y1) {
  const dist = Math.hypot(x1 - x0, y1 - y0);
  const numPoints = Math.max(8, Math.min(30, Math.round(dist / 22)));
  const cx = (x0 + x1) / 2 + (Math.random() * 160 - 80);
  const cy = (y0 + y1) / 2 + (Math.random() * 160 - 80);
  const overshoot = Math.random() < 0.4;
  const ox = overshoot ? x1 + (Math.random() * 30 - 15) : x1;
  const oy = overshoot ? y1 + (Math.random() * 30 - 15) : y1;
  const path = [];
  for (let i = 1; i <= numPoints; i++) {
    let t = i / numPoints;
    t = 1 - Math.pow(1 - t, 2.2); // ease-out (Fitts: ช้าลงตอนใกล้เป้า)
    const u = 1 - t;
    path.push({ x: Math.round(u * u * x0 + 2 * u * t * cx + t * t * ox), y: Math.round(u * u * y0 + 2 * u * t * cy + t * t * oy) });
  }
  if (overshoot) {
    path.push({ x: Math.round((ox + x1) / 2), y: Math.round((oy + y1) / 2) });
    path.push({ x: x1, y: y1 });
  } else {
    path[path.length - 1] = { x: x1, y: y1 };
  }
  return path;
}

async function humanMoveTo(tabId, x, y) {
  const s = _lastMouse(tabId);
  for (const p of _humanPath(s.x, s.y, x, y)) {
    await _move(tabId, p.x, p.y);
    await _sleep(8 + Math.random() * 26);
    if (Math.random() < 0.08) await _sleep(40 + Math.random() * 110); // หยุดคิดกลางทางบางครั้ง
  }
}

async function cdpHumanClickAt(tabId, x, y) {
  const hadAmbient = !!(_ambient[tabId] && _ambient[tabId].running);
  let weAttached = false;
  _busy[tabId] = true;
  try {
    await _ensureAttached(tabId);
    if (!hadAmbient) weAttached = true;
    await humanMoveTo(tabId, x, y);
    await _sleep(180 + Math.random() * 320); // hover/อ่านก่อนกด
    const njit = 1 + Math.floor(Math.random() * 2);
    for (let k = 0; k < njit; k++) {
      await _move(tabId, x + Math.round(Math.random() * 4 - 2), y + Math.round(Math.random() * 4 - 2));
      await _sleep(30 + Math.random() * 55);
    }
    const jx = Math.round(x + (Math.random() * 6 - 3));
    const jy = Math.round(y + (Math.random() * 6 - 3));
    await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchMouseEvent', { type: 'mousePressed', x: jx, y: jy, button: 'left', clickCount: 1 });
    await _sleep(50 + Math.random() * 80);
    await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchMouseEvent', { type: 'mouseReleased', x: jx, y: jy, button: 'left', clickCount: 1 });
    _mouse[tabId] = { x: jx, y: jy };
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err.message || err) };
  } finally {
    _busy[tabId] = false;
    if (weAttached && !(_ambient[tabId] && _ambient[tabId].running)) {
      try { await chrome.debugger.detach({ tabId }); } catch (e) { /* ignore */ }
    }
  }
}

// ── Ambient mouse: ขยับเมาส์/scroll เบาๆ ตลอด ให้ session ดูมีชีวิต (ตัวพลิกเกม reCAPTCHA v3) ──
async function _ambientTick(tabId) {
  if (_busy[tabId]) return;
  const a = _ambient[tabId];
  if (a && a.forcePaused) return;
  if (a && a.pauseUntil && Date.now() < a.pauseUntil) return;
  try {
    await _ensureAttached(tabId);
    const last = _lastMouse(tabId);
    const nx = Math.max(20, Math.min(1400, last.x + Math.round(Math.random() * 160 - 80)));
    const ny = Math.max(20, Math.min(2200, last.y + Math.round(Math.random() * 160 - 80)));
    const steps = 2 + Math.floor(Math.random() * 3);
    for (let i = 1; i <= steps; i++) {
      if (_busy[tabId]) return;
      const t = i / steps;
      await _move(tabId, Math.round(last.x + (nx - last.x) * t), Math.round(last.y + (ny - last.y) * t));
      await _sleep(20 + Math.random() * 40);
    }
    if (Math.random() < 0.25) {
      await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchMouseEvent', {
        type: 'mouseWheel', x: nx, y: ny, deltaX: 0, deltaY: Math.round(Math.random() * 200 - 100)
      });
    }
  } catch (_) { /* tab อาจ navigate */ }
}

function startAmbient(tabId) {
  if (_ambient[tabId] && _ambient[tabId].running) return;
  _ambient[tabId] = { running: true, timer: null };
  _ensureAttached(tabId).catch(() => {});
  const loop = async () => {
    if (!(_ambient[tabId] && _ambient[tabId].running)) return;
    await _ambientTick(tabId);
    if (!(_ambient[tabId] && _ambient[tabId].running)) return;
    _ambient[tabId].timer = setTimeout(loop, 900 + Math.random() * 3000); // ทุก 0.9-3.9s
  };
  _ambient[tabId].timer = setTimeout(loop, 500 + Math.random() * 1500);
  console.log('[CDP Ambient] ▶️ start tab', tabId);
}

async function stopAmbient(tabId) {
  const a = _ambient[tabId];
  if (!a) return;
  a.running = false;
  if (a.timer) clearTimeout(a.timer);
  delete _ambient[tabId];
  try { await chrome.debugger.detach({ tabId }); } catch (_) { /* ignore */ }
  console.log('[CDP Ambient] ⏹️ stop tab', tabId);
}

// auto-cleanup ถ้า tab ปิด หรือ debugger หลุด
chrome.tabs.onRemoved.addListener((tabId) => { stopAmbient(tabId).catch(() => {}); });
if (chrome.debugger.onDetach) {
  chrome.debugger.onDetach.addListener((src) => {
    const tabId = src && src.tabId;
    if (tabId && _ambient[tabId]) { _ambient[tabId].running = false; delete _ambient[tabId]; }
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = (message && message.tabId) || (sender.tab && sender.tab.id);

  /* 🌐 Flow แอปใหม่: ไฟล์คลิปอยู่คนละโดเมน (flow-content.google) — fetch ใน content script โดน CORS
     → ให้ service worker โหลดแทน (มี host permission แล้ว) แล้วส่ง base64 กลับ */
  if (message.action === 'pdFetchMediaB64') {
    (async () => {
      try {
        const r = await fetch(message.url, { credentials: 'omit' });
        if (!r.ok) throw new Error('status=' + r.status);
        const b = await r.blob();
        if (!b || b.size < 50 * 1024) throw new Error('ไฟล์เล็กผิดปกติ (' + (b ? b.size : 0) + ' bytes)');
        // ⚠️ service worker ไม่มี FileReader — แปลงเองทีละท่อน (ไฟล์ใหญ่ = สตริงยาวเกิน arg ถ้าทำทีเดียว)
        const buf = new Uint8Array(await b.arrayBuffer());
        let bin = '';
        for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
        const du = 'data:' + (b.type || 'video/mp4') + ';base64,' + btoa(bin);
        sendResponse({ success: true, dataUrl: du, size: b.size });
      } catch (e) { sendResponse({ success: false, error: e.message }); }
    })();
    return true;
  }
  if (message.action === 'cdpHumanClick') {
    if (!tabId) { sendResponse({ success: false, error: 'no tabId' }); return true; }
    cdpHumanClickAt(tabId, message.x, message.y)
      .then(res => sendResponse(res))
      .catch(err => sendResponse({ success: false, error: String(err.message || err) }));
    return true;
  }

  // VIP engine ใช้ cdpClick (คลิกเดี่ยว ไม่มี trajectory) สำหรับปุ่ม Generate/Create
  if (message.action === 'cdpClick') {
    if (!tabId) { sendResponse({ success: false, error: 'no tabId' }); return true; }
    cdpClickAt(tabId, message.x, message.y)
      .then(res => sendResponse(res))
      .catch(err => sendResponse({ success: false, error: String(err.message || err) }));
    return true;
  }

  if (message.action === 'cdpMoveTo') {
    if (tabId && _ambient[tabId] && _ambient[tabId].running) {
      _ambient[tabId].pauseUntil = Date.now() + 6000;
      if (!_busy[tabId]) humanMoveTo(tabId, message.x, message.y).catch(() => {});
    }
    return false;
  }

  if (message.action === 'cdpAmbientPause' || message.action === 'cdpAmbientResume') {
    if (tabId && _ambient[tabId]) {
      const pausing = (message.action === 'cdpAmbientPause');
      _ambient[tabId].forcePaused = pausing;
      if (!pausing) _ambient[tabId].pauseUntil = 0;
    }
    return false;
  }

  if (message.action === 'cdpAmbientStart') {
    if (tabId) startAmbient(tabId);
    sendResponse({ success: !!tabId });
    return true;
  }
  if (message.action === 'cdpAmbientStop') {
    if (tabId) { stopAmbient(tabId).then(() => sendResponse({ success: true })); return true; }
    sendResponse({ success: false });
    return true;
  }
  return false;
});
