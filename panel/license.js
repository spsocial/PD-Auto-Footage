// ╔══════════════════════════════════════════════════════════════════════════════════════╗
// ║                           ⚖️  คำเตือนทางกฎหมาย / LEGAL NOTICE  ⚖️                 ║
// ╠══════════════════════════════════════════════════════════════════════════════════════╣
// ║  ซอฟต์แวร์นี้เป็นทรัพย์สินทางปัญญาของ                                               ║
// ║  1) บริษัท พร้อมดี เอไอ เทค จำกัด (Prompt D AI Tech) ทะเบียน 0115568038804        ║
// ║  2) บริษัท เอสพี โซเชียลสองสี่ มาร์เก็ตติ้ง จำกัด เลขผู้เสียภาษี 0725566001886       ║
// ║                                                                                    ║
// ║  ครอบคลุม: PD Auto Footage + PD Auto Flow + PD AUTO VIP ทุกเวอร์ชัน + แบรนด์/โลโก้ ║
// ║  ⛔ ห้าม: ทำซ้ำ ดัดแปลง Reverse Engineer / Bypass License / ขายต่อ / แอบอ้างแบรนด์  ║
// ║  🔍 ระบบตรวจจับการละเมิดทำงาน 24 ชม. — บันทึก Device ID, License Key, หลักฐานในศาล  ║
// ║  📋 โทษ: พ.ร.บ.ลิขสิทธิ์ 2537 (จำคุก 6ด-8ปี ปรับสูงสุด 1,600,000) + พ.ร.บ.คอมพ์ 2550 ║
// ║      + พ.ร.บ.ความลับการค้า 2545 + อาญา ม.341 ฉ้อโกง · ค่าเสียหาย 5,000,000 บาท/ครั้ง ║
// ║  🔴 ดำเนินคดีอาญา+แพ่งทันที ไม่มีเจรจา ไม่ยอมความ                                   ║
// ║  © 2024-2026 บ.พร้อมดี เอไอ เทค จำกัด & บ.เอสพี โซเชียลสองสี่ มาร์เก็ตติ้ง จำกัด    ║
// ╚══════════════════════════════════════════════════════════════════════════════════════╝

// =====================================================================
// PD Auto Footage — License Gate (ใช้ระบบ/เซิร์ฟเวอร์เดียวกับ PD Auto VIP)
// คีย์ VIP เดิมใช้กับ Footage ได้เลย (validate กับ Google Apps Script ตัวเดิม)
// =====================================================================
(function () {
  'use strict';

  const LICENSE_CONFIG = {
    // เซิร์ฟเวอร์เดียวกับ PD Auto VIP → คีย์ลูกค้าเดิมใช้ได้
    API_URL: 'https://script.google.com/macros/s/AKfycbxoRN70qePRgTgifNkAJsKIuOWIU2dewBtiqhip_gjTekho0XgQuUzrB5Xf4KRiBRrUHg/exec',
    API_URL_SECONDARY: 'https://script.google.com/macros/s/AKfycbzEdSxjk0O3GLZ_tJb_tKvD5mk_Y9peck9rEVJpY1caO3V9ThDNmCF5av-Pl2-S6iZ8/exec',
    // 🔑 ระบบคีย์ใหม่ 2026-08-03: คีย์ Footage ซื้อแยก (PDFT-) / คีย์เหมา PD App (PDALL-) อยู่ Worker คนละระบบกับชีทเดิม
    //    (เว็บทั้ง 2 เปลี่ยนมาออกคีย์ PDFT แล้ว — ไม่แก้ตรงนี้ = ลูกค้าซื้อใหม่ล็อกอิน extension ไม่ได้)
    PDAPP_URL: 'https://pd-app-license.filmbancha127.workers.dev',
    APP_NAME: 'PD_AUTO_FOOTAGE',
    VERSION: '0.1.0',
    STORAGE_KEY: 'pd_footage_license',
  };
  // คีย์ระบบใหม่ดูจาก prefix — PDCT (การ์ตูน) ใช้กับ Footage ไม่ได้ (server ปฏิเสธเองพร้อมข้อความบอก)
  const isPdAppKey = (k) => /^(PDFT|PDALL|PDCT)-/i.test(String(k || '').trim());

  // เก็บ fetch ดั้งเดิมตอนโหลด — เลี่ยง interceptor ของโจร
  const _origFetch = window.fetch.bind(window);

  const sget = (keys) => new Promise((r) => chrome.storage.local.get(keys, r));
  const sset = (obj) => new Promise((r) => chrome.storage.local.set(obj, r));
  const sdel = (keys) => new Promise((r) => chrome.storage.local.remove(keys, r));

  // ── Device fingerprint (16 hex) ──
  async function getDeviceId() {
    const got = await sget(['pd_device_id']);
    if (got && got.pd_device_id) return got.pd_device_id;
    const parts = [
      navigator.userAgent, navigator.language,
      screen.width + 'x' + screen.height, screen.colorDepth,
      new Date().getTimezoneOffset(), navigator.hardwareConcurrency || 'x',
      LICENSE_CONFIG.APP_NAME, Date.now(), Math.random().toString(36),
    ].join('|');
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(parts));
    const hex = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
    const id = hex.substring(0, 16).toUpperCase();
    await sset({ pd_device_id: id });
    return id;
  }

  function getDeviceName() {
    const ua = navigator.userAgent;
    let b = 'Unknown', os = 'Unknown';
    if (ua.includes('Edg')) b = 'Edge'; else if (ua.includes('Chrome')) b = 'Chrome';
    else if (ua.includes('Firefox')) b = 'Firefox'; else if (ua.includes('Safari')) b = 'Safari';
    if (ua.includes('Windows')) os = 'Windows'; else if (ua.includes('Mac')) os = 'Mac'; else if (ua.includes('Linux')) os = 'Linux';
    return b + ' - ' + os + ' (Footage)';
  }

  // ── validate กับ server (primary → secondary) ──
  // action='activate' ตอน login (ลงทะเบียนเครื่อง + คืน sessions ตอนเต็ม), 'validate' ตอน revalidate เงียบๆ
  async function validateLicense(key, deviceId, action) {
    const body = {
      action: action || 'validate',
      licenseKey: String(key).toUpperCase().trim(),
      deviceId, deviceName: getDeviceName(),
      appVersion: LICENSE_CONFIG.VERSION,
    };
    const tryUrl = async (url) => {
      const res = await _origFetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json && typeof json === 'object') json._serverUrl = url; // จำว่า server ไหนตอบ → ลบ session ให้ถูกชีท
      return json;
    };
    // 🔑 คีย์ระบบใหม่ (PDFT-/PDALL-) → Worker pd-app-license เท่านั้น (โปรโตคอลเดียวกัน + แนบ app/bot ให้ server เช็คสิทธิ์)
    if (isPdAppKey(body.licenseKey)) {
      try {
        const res = await _origFetch(LICENSE_CONFIG.PDAPP_URL, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, app: 'PD_APP', bot: 'footage' }),
        });
        const json = await res.json();
        if (json && typeof json === 'object') json._serverUrl = LICENSE_CONFIG.PDAPP_URL;
        return json || { success: false, error: '__OFFLINE__' };
      } catch (e) { return { success: false, error: '__OFFLINE__' }; }
    }
    let primary = null;
    try {
      primary = await tryUrl(LICENSE_CONFIG.API_URL);
      if (primary && (primary.success || primary.needRemoveSession)) return primary;
    } catch (e) {}
    if (LICENSE_CONFIG.API_URL_SECONDARY) {
      try {
        const sec = await tryUrl(LICENSE_CONFIG.API_URL_SECONDARY);
        if (sec && (sec.success || sec.needRemoveSession)) return sec;
        if (sec && sec.error) return sec;
      } catch (e) {}
    }
    if (primary && primary.error) return primary;
    return { success: false, error: '__OFFLINE__' }; // ทั้งสอง server ติดต่อไม่ได้
  }

  // ── ลบ session (เครื่องเก่า) — ยิงไป server เดียวกับที่เจอคีย์ ──
  async function removeSession(key, targetDeviceId, serverUrl) {
    try {
      const url = serverUrl || LICENSE_CONFIG.API_URL;
      const res = await _origFetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'removeSession',
          licenseKey: String(key).toUpperCase().trim(),
          deviceId: targetDeviceId,        // ใช้ target เป็น current เพื่อลบเครื่องนั้น
          targetDeviceId: targetDeviceId,
        }),
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  function formatLastSeen(ts) {
    if (!ts) return 'ไม่ทราบ';
    const t = typeof ts === 'number' ? ts : Date.parse(ts);
    if (!t || isNaN(t)) return String(ts);
    const diff = Date.now() - t;
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'เมื่อสักครู่';
    if (m < 60) return m + ' นาทีที่แล้ว';
    const h = Math.floor(m / 60);
    if (h < 24) return h + ' ชม.ที่แล้ว';
    return Math.floor(h / 24) + ' วันที่แล้ว';
  }

  // ── สถานะ unlock (panel.js เช็คก่อนรัน) ──
  window.__pdLicensed = false;

  function buildGate() {
    if (document.getElementById('pd-license-gate')) return;
    const g = document.createElement('div');
    g.id = 'pd-license-gate';
    g.innerHTML = `
      <div class="plg-card">
        <img src="../assets/logo.png" class="plg-logo" alt="">
        <div class="plg-title">PD Auto Footage</div>
        <div class="plg-sub">กรอก License Key เพื่อเริ่มใช้งาน<br><span class="plg-hint">ใช้คีย์ PD Auto VIP เดิม หรือคีย์ PD Footage (PDFT-...) / คีย์เหมา (PDALL-...) ได้เลย</span></div>
        <input id="plgKey" class="plg-input" type="text" placeholder="PD-... / PDFT-..." autocomplete="off" spellcheck="false">
        <button id="plgBtn" class="plg-btn">🔓 เปิดใช้งาน</button>
        <div id="plgMsg" class="plg-msg"></div>
        <div id="plgSessions" class="plg-sessions" style="display:none;">
          <div class="plg-sess-title">⚠️ คีย์นี้ใช้ครบจำนวนเครื่องแล้ว — ลบเครื่องเก่าออกเพื่อใช้เครื่องนี้</div>
          <div id="plgSessList" class="plg-sess-list"></div>
        </div>
        <div class="plg-foot">© Prompt D AI Tech Co., Ltd. &amp; SP Social24 Marketing Co., Ltd. · ห้ามแชร์คีย์ — ระบบตรวจจับ 24 ชม.</div>
      </div>`;
    document.body.appendChild(g);

    const style = document.createElement('style');
    style.textContent = `
      #pd-license-gate {
        position: fixed; inset: 0; z-index: 99999;
        background: radial-gradient(120% 120% at 50% 0%, #1a1206 0%, #09090b 55%);
        display: flex; align-items: center; justify-content: center; padding: 22px;
        font-family: 'Sukhumvit Set','Inter',system-ui,sans-serif;
      }
      #pd-license-gate .plg-card {
        width: 100%; max-width: 300px; display: flex; flex-direction: column; align-items: center; gap: 10px;
        padding: 30px 24px 22px; border-radius: 22px;
        background: linear-gradient(165deg, #161617, #0d0d10);
        border: 1px solid rgba(245,158,11,0.4);
        box-shadow: 0 22px 60px rgba(0,0,0,0.6), 0 0 38px rgba(245,158,11,0.14);
      }
      #pd-license-gate .plg-logo { width: 56px; height: 56px; border-radius: 14px; object-fit: cover; box-shadow: 0 0 20px rgba(245,158,11,0.35); }
      #pd-license-gate .plg-title { font-size: 19px; font-weight: 900; background: linear-gradient(90deg,#f59e0b,#fcd34d); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
      #pd-license-gate .plg-sub { font-size: 11.5px; color: #a1a1aa; text-align: center; line-height: 1.6; }
      #pd-license-gate .plg-hint { color: #f59e0b; font-size: 10.5px; }
      #pd-license-gate .plg-input {
        width: 100%; margin-top: 6px; padding: 12px 14px; border-radius: 12px; text-align: center;
        background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12);
        color: #fff; font-size: 14px; font-weight: 700; letter-spacing: 1px; outline: none;
        text-transform: uppercase;
      }
      #pd-license-gate .plg-input:focus { border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.15); }
      #pd-license-gate .plg-btn {
        width: 100%; padding: 12px; border-radius: 12px; cursor: pointer; border: none;
        background: linear-gradient(135deg,#d97706,#f59e0b,#fcd34d); color: #1a1106; font-weight: 800; font-size: 14px;
        box-shadow: 0 6px 18px rgba(245,158,11,0.3);
      }
      #pd-license-gate .plg-btn:hover { filter: brightness(1.08); }
      #pd-license-gate .plg-btn:disabled { opacity: 0.55; cursor: wait; }
      #pd-license-gate .plg-msg { font-size: 11.5px; text-align: center; min-height: 16px; line-height: 1.5; }
      #pd-license-gate .plg-msg.err { color: #f87171; }
      #pd-license-gate .plg-msg.ok { color: #4ade80; }
      #pd-license-gate .plg-foot { font-size: 9px; color: #52525b; text-align: center; margin-top: 4px; line-height: 1.5; }
      #pd-license-gate .plg-sessions { width: 100%; margin-top: 4px; }
      #pd-license-gate .plg-sess-title { font-size: 10.5px; color: #fbbf24; text-align: center; line-height: 1.5; margin-bottom: 8px; }
      #pd-license-gate .plg-sess-list { display: flex; flex-direction: column; gap: 6px; max-height: 180px; overflow-y: auto; }
      #pd-license-gate .plg-sess-item {
        display: flex; align-items: center; justify-content: space-between; gap: 8px;
        padding: 8px 10px; border-radius: 10px;
        background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
      }
      #pd-license-gate .plg-sess-info { flex: 1; min-width: 0; text-align: left; }
      #pd-license-gate .plg-sess-name { font-size: 11.5px; color: #e4e4e7; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      #pd-license-gate .plg-sess-seen { font-size: 9.5px; color: #71717a; }
      #pd-license-gate .plg-sess-del {
        flex-shrink: 0; padding: 6px 12px; border-radius: 8px; cursor: pointer; border: none;
        background: linear-gradient(135deg,#dc2626,#ef4444); color: #fff; font-weight: 800; font-size: 11px;
      }
      #pd-license-gate .plg-sess-del:hover { filter: brightness(1.1); }
      #pd-license-gate .plg-sess-del:disabled { opacity: 0.5; cursor: wait; }
    `;
    document.head.appendChild(style);

    const keyEl = g.querySelector('#plgKey');
    const btn = g.querySelector('#plgBtn');
    const msg = g.querySelector('#plgMsg');
    const sessBox = g.querySelector('#plgSessions');
    const sessList = g.querySelector('#plgSessList');

    // แสดงรายการเครื่อง + ปุ่มลบ (ตอนคีย์เต็ม) — เหมือนบอทหลัก
    const renderSessions = (key, sessions, serverUrl) => {
      sessList.innerHTML = '';
      (sessions || []).forEach((s) => {
        const item = document.createElement('div');
        item.className = 'plg-sess-item';
        item.innerHTML = `
          <div class="plg-sess-info">
            <div class="plg-sess-name">${s.name || s.deviceName || 'อุปกรณ์'}</div>
            <div class="plg-sess-seen">ใช้ล่าสุด: ${formatLastSeen(s.lastSeen)}</div>
          </div>
          <button class="plg-sess-del">ลบ</button>`;
        const del = item.querySelector('.plg-sess-del');
        del.addEventListener('click', async () => {
          del.disabled = true; del.textContent = '...';
          const r = await removeSession(key, s.id || s.deviceId, serverUrl);
          if (r && r.success) {
            item.remove();
            msg.className = 'plg-msg ok'; msg.textContent = '✅ ลบเครื่องเก่าแล้ว — กด "เปิดใช้งาน" อีกครั้ง';
            if (!sessList.children.length) sessBox.style.display = 'none';
          } else {
            del.disabled = false; del.textContent = 'ลบ';
            msg.className = 'plg-msg err'; msg.textContent = '❌ ' + ((r && r.error) || 'ลบไม่สำเร็จ');
          }
        });
        sessList.appendChild(item);
      });
      sessBox.style.display = sessList.children.length ? 'block' : 'none';
    };

    const submit = async () => {
      const key = keyEl.value.trim();
      if (!key) { msg.className = 'plg-msg err'; msg.textContent = 'กรุณากรอก License Key'; return; }
      btn.disabled = true; msg.className = 'plg-msg'; msg.textContent = '⏳ กำลังตรวจสอบ...';
      sessBox.style.display = 'none';
      try {
        const dev = await getDeviceId();
        const res = await validateLicense(key, dev, 'activate'); // login = activate (ลงทะเบียนเครื่อง)
        if (res && res.success) {
          await sset({ [LICENSE_CONFIG.STORAGE_KEY]: { key: key.toUpperCase().trim(), ts: Date.now() } });
          msg.className = 'plg-msg ok'; msg.textContent = '✅ เปิดใช้งานสำเร็จ!';
          window.__pdLicensed = true;
          setTimeout(() => g.remove(), 600);
        } else if (res && res.needRemoveSession) {
          msg.className = 'plg-msg err';
          msg.textContent = `⚠️ ใช้ครบ ${res.maxSessions || ''} เครื่องแล้ว — ลบเครื่องเก่าด้านล่าง`;
          renderSessions(key, res.sessions, res._serverUrl);
          btn.disabled = false;
        } else if (res && res.error === '__OFFLINE__') {
          msg.className = 'plg-msg err'; msg.textContent = '❌ เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ — เช็คเน็ตแล้วลองใหม่';
          btn.disabled = false;
        } else {
          msg.className = 'plg-msg err'; msg.textContent = '❌ ' + ((res && res.error) || 'License Key ไม่ถูกต้อง');
          btn.disabled = false;
        }
      } catch (e) {
        msg.className = 'plg-msg err'; msg.textContent = '❌ ' + e.message;
        btn.disabled = false;
      }
    };
    btn.addEventListener('click', submit);
    keyEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
    setTimeout(() => keyEl.focus(), 100);
  }

  // ── ตรวจตอนเปิดแผง: มีคีย์เก็บไว้ → revalidate; ไม่มี/ไม่ผ่าน → โชว์ gate ──
  async function ensureLicensed() {
    const got = await sget([LICENSE_CONFIG.STORAGE_KEY]);
    const lic = got && got[LICENSE_CONFIG.STORAGE_KEY];
    if (lic && lic.key) {
      try {
        const dev = await getDeviceId();
        const res = await validateLicense(lic.key, dev);
        if (res && res.success) { window.__pdLicensed = true; return; }
        // v0.6.7: เด้งออกเฉพาะเมื่อ server "ยืนยันชัดเจน" ว่าโดนเตะ/เพิกถอน/หมดอายุ (แบบ PD Auto VIP — kicked เท่านั้น)
        //   เดิม: error อะไรก็ตามที่ไม่ใช่ __OFFLINE__ → ลบคีย์+เด้งออก → Google Apps Script คืน error ชั่วคราวได้บ่อย
        //   (quota/timeout/สะดุด) พอ side panel โหลดใหม่แล้ว revalidate เจอ error ชั่วคราว = "ใช้ๆ อยู่เด้งออกเอง"
        const errStr = String((res && res.error) || '').toLowerCase();
        const hardKick = res && (
          res.kicked === true || res.revoked === true || res.expired === true ||
          res.deactivated === true || res.valid === false ||
          // + ข้อความจาก Worker ระบบคีย์ใหม่ (PDFT/PDALL): ถูกถอดสิทธิ์ (โดนลบเครื่อง) · คีย์ผิดบอท
          /revoked|expired|deactivat|ยกเลิก|เพิกถอน|หมดอายุ|ถูกระงับ|ถูกบล็อค|ไม่พบคีย์|ไม่พบ license|ถูกถอดสิทธิ์|ใช้กับบอทนี้ไม่ได้/.test(errStr)
        );
        if (hardKick) { await sdel([LICENSE_CONFIG.STORAGE_KEY]); window.__pdLicensed = false; buildGate(); return; }
        // error ทั่วไป/ชั่วคราว/offline → ผ่อนผัน ใช้คีย์เดิมต่อ ไม่เด้งออก (กันล็อกตัวเองผิดๆ)
        window.__pdLicensed = true; return;
      } catch (e) { window.__pdLicensed = true; return; }
    }
    buildGate();
  }

  window.PDLicense = { ensureLicensed, logout: async () => { await sdel([LICENSE_CONFIG.STORAGE_KEY]); window.__pdLicensed = false; buildGate(); } };

  // auto-run ตอนโหลด
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureLicensed);
  } else {
    ensureLicensed();
  }
})();
