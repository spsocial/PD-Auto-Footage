/**
 * flow-merge-new.js — Merge mode สำหรับ "แอป Flow ใหม่" (flow.google.com · Angular Material)
 *
 * ทำไมต้องมีไฟล์นี้: Merge เดิมใน flow-content.js ยึด selector ของหน้าเก่า (React + styled-components
 *   คลาสสุ่ม sc-46973129-1 / sc-addd5871 / sc-903adef0 ...) ซึ่ง **ไม่มีอยู่จริงบนหน้าใหม่เลยสักตัว**
 *   (แกะจากโครมจริง 2026-09-09 · นับได้ 0) → เขียนชั้นคุย DOM ใหม่ทั้งชั้น แต่ "ตรรกะ/ลำดับ/จังหวะคน" ยกของเดิมมา
 *
 * ป้ายทั้งหมดแกะจากของจริงแล้ว — รายละเอียดเต็มใน FLOW-NEW-MERGE-RECON.md
 *   กล่องพ้อม  = div.ProseMirror (contenteditable · ไม่ใช่ textarea → ต้องใช้ execCommand insertText · เทสผ่านแล้ว)
 *   ปุ่มเจน    = button[aria-label="Start generation"]
 *   ตั้งค่า    = button.settings-trigger → radio ข้อความอ่านออก (Image/Video/16:9/720p/8s/x1)
 *   การ์ดสื่อ  = flow-image-tile / flow-video-tile
 *   ต่อฉาก     = คลิกการ์ดวิดีโอ → Scene builder → "Add clip" → "Extend (โมเดล)"
 *
 * ⚠️ ข้อค้นพบสำคัญ (ตอบคำถาม owner): ปุ่ม Extend จะ **disabled** ถ้าคลิปต้นทางต่อฉากไม่ได้
 *    (เช่นเจนด้วยโมเดลที่ไม่รองรับ) → อ่าน .disabled แล้วบอกผู้ใช้ตรงๆ ดีกว่าปล่อยให้งง
 *
 * โหลดในโลก isolated เดียวกับ flow-content.js → แชร์ window ตัวเดียวกัน (เรียกผ่าน window.__pdMergeNew)
 */
(function () {
  'use strict';
  if (window.__pdMergeNewInstalled) return;
  window.__pdMergeNewInstalled = true;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rand = (a, b) => a + Math.random() * (b - a);
  const $$ = (s, root) => [...(root || document).querySelectorAll(s)];
  const norm = (e) => ((e && e.textContent) || '').replace(/\s+/g, ' ').trim();
  const say = (m, lv) => { try { (window.__pdMergeReport || (() => {}))(m, lv); } catch (_) {} };

  // รอเงื่อนไข — คืนค่าที่ได้ หรือ null เมื่อหมดเวลา
  async function waitFor(fn, timeoutMs = 30000, stepMs = 500) {
    const dl = Date.now() + timeoutMs;
    for (;;) {
      let v = null; try { v = fn(); } catch (_) { v = null; }
      if (v) return v;
      if (Date.now() > dl) return null;
      await sleep(stepMs);
    }
  }

  /* 🖱️ คลิกแบบคนจริง — ยกจังหวะจาก Merge เดิม (เลื่อนเมาส์จริงผ่าน CDP + ลังเลก่อนกด)
     ⚠️ ต้องกด "ปุ่มชั้นใน" ของ Angular Material — กดที่ตัวครอบ (flow-menu-item) ไม่ติด (เทสจริงแล้ว) */
  async function humanClick(el, label) {
    if (!el) throw new Error('ไม่เจอปุ่ม' + (label ? ' (' + label + ')' : ''));
    if (el.disabled) throw new Error('ปุ่มถูกปิดใช้งาน' + (label ? ' (' + label + ')' : ''));
    try { el.scrollIntoView({ block: 'center', behavior: 'instant' }); } catch (_) {}
    await sleep(rand(120, 320));
    const r = el.getBoundingClientRect();
    const jx = Math.max(0, Math.min(6, r.width / 2 - 2));
    const jy = Math.max(0, Math.min(6, r.height / 2 - 2));
    const cx = r.x + r.width / 2 + (Math.random() * 2 - 1) * jx;
    const cy = r.y + r.height / 2 + (Math.random() * 2 - 1) * jy;
    try { chrome.runtime.sendMessage({ __pdCdpMove: true, x: Math.round(cx), y: Math.round(cy) }); } catch (_) {}
    await sleep(rand(180, 420)); // ลังเลก่อนกด (แบบ VIP)
    const o = { bubbles: true, cancelable: true, view: window, clientX: cx, clientY: cy, button: 0, buttons: 1, pointerId: 1, pointerType: 'mouse', isPrimary: true, detail: 1 };
    ['pointerover', 'pointerenter', 'pointermove', 'pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']
      .forEach((ev) => el.dispatchEvent(ev.startsWith('pointer') ? new PointerEvent(ev, o) : new MouseEvent(ev, o)));
    await sleep(rand(250, 600));
  }

  /* 🌏 ยึด "ชื่อไอคอน" ไม่ใช่ข้อความ (owner ทัก 2026-09-09: Flow ของเขาเป็นภาษาไทย)
     Angular Material วาดไอคอนด้วย ligature — ข้อความในแท็ก <mat-icon> เป็น "ชื่อไอคอน" เสมอ
     เช่น arrow_forward / keyboard_double_arrow_right / motion_blur → **ไม่ถูกแปลตามภาษา**
     ส่วน aria-label กับข้อความเมนู (Extend / Animate / Add clip) โดนแปลหมด = ยึดไม่ได้
     → matcher ทุกตัวหาไอคอนก่อน แล้วค่อยถอยไปดูข้อความอังกฤษ (เผื่อ Flow เปลี่ยนไอคอน) */
  const iconsOf = (el) => $$('mat-icon, .material-symbols-outlined, .google-symbols, i', el).map((i) => norm(i));
  //   บางที่ไอคอนไม่ได้อยู่ในแท็กแยก แต่ติดหัวข้อความ (เช่น "imageImage" / "imageรูปภาพ") → เช็คว่าขึ้นต้นด้วยชื่อไอคอนด้วย
  const hasIcon = (el, name) => iconsOf(el).some((t) => t === name) || norm(el).startsWith(name);
  const byIcon = (list, icon, textRe) => list.find((b) => hasIcon(b, icon)) || (textRe ? list.find((b) => textRe.test(norm(b))) : null);

  const overlayBtns = () => $$('.cdk-overlay-pane button, .cdk-overlay-container button');
  const overlayItem = (re) => overlayBtns().find((b) => re.test(norm(b)));
  const overlayByIcon = (icon, textRe) => byIcon(overlayBtns(), icon, textRe);
  /* ปิดเมนู/ป๊อปอัป — ⚠️ ห้ามใช้ Escape ในหน้า Scene builder!
     เทสจริง 2026-09-09: Escape ไม่ได้ปิดแค่เมนู แต่ "เด้งออกจาก Scene builder" กลับไปหน้าโปรเจ็คเลย
     (ตรงกับที่ owner เห็น: "กดเปิดคลิปเข้าไป แล้วมันก็กดปิดออกมา") → กด backdrop แทน */
  const closeOverlay = async () => {
    const bd = document.querySelector('.cdk-overlay-backdrop');
    if (bd) { try { bd.click(); } catch (_) {} }
    else document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await sleep(500);
  };

  /* 🕵️ หาปุ่มไม่เจอ = พิมพ์ "ของที่เห็นจริงบนหน้า" ออกมาให้ดูเลย (owner 2026-09-09)
     เพราะ Flow ของลูกค้าเป็นภาษาไทย ถ้าไอคอนไหน Google เปลี่ยนชื่อ เราจะได้รู้ในรอบเดียว
     ไม่ต้องให้ลูกค้าไปสลับภาษาแล้วเทสใหม่ (ระบบเก่าต้องทำแบบนั้น) */
  function dumpCandidates(what, list) {
    try {
      const rows = (list || []).slice(0, 14).map((b) => {
        const ic = iconsOf(b).join('/');
        const t = norm(b).slice(0, 26);
        const al = (b.getAttribute && (b.getAttribute('aria-label') || '')).slice(0, 26);
        return (ic ? '[' + ic + ']' : '') + (t ? ' "' + t + '"' : '') + (al ? ' (' + al + ')' : '');
      }).filter(Boolean);
      say('   🕵️ หา ' + what + ' ไม่เจอ — บนหน้ามีปุ่มพวกนี้: ' + (rows.join(' · ') || '(ไม่มีเลย)'), 'warn');
    } catch (_) {}
  }

  /* ⏳ รอหน้าพร้อมจริง (owner 2026-09-09: "ทำอะไรก็เร็วๆ ไปหน่อย ไม่รอหน้าพร้อมก่อน")
     Angular โหลดทีละส่วน — หน้าดูเสร็จแล้วแต่กล่องพ้อม/ปุ่มตั้งค่ายังไม่ถูกสร้าง
     → รอจนเจอ "กล่องพ้อม + ปุ่มตั้งค่า" แล้วนิ่งอีก 1.5 วิ ค่อยทำงานต่อ
     + สั่งขยายหน้าต่างซ้ำทุกครั้ง เพราะระบบย่อหน้าต่างงานอัตโนมัติชอบหดจอกลางคัน (owner เจอจริง) */
  async function waitReady(timeoutMs, report) {
    try { chrome.runtime.sendMessage({ __pdWindowSize: 'expandBig' }); } catch (_) {}
    const ok = await waitFor(() => (promptBox() && $$('button').some((b) => /settings-trigg/.test(String(b.className)))) ? true : null, timeoutMs || 45000, 800);
    if (!ok) throw new Error('หน้า Flow ยังไม่พร้อม (ไม่เจอกล่องพ้อม/ปุ่มตั้งค่าภายในเวลา)');
    await sleep(1500); // ให้ Angular วาดเสร็จจริง ๆ ก่อนไปกด
    try { await ensureAgentOff(); } catch (_) {}
    if (report) report('   ✅ หน้า Flow พร้อมแล้ว');
    return true;
  }

  /* 🤖 ปิด Flow Agent ก่อนทำงาน (owner ถาม 2026-09-09: "ถ้าใครเปิด agent อยู่ Merge ปิดให้ไหม")
     ของเดิมปิดผ่าน API setAgentToggle — แต่แอปใหม่ตอบ skipped (ไม่รองรับ) = ไม่เคยปิดให้เลย
     แอปใหม่มีชิป Agent ในกล่องพ้อม: <flow-agent-mode-toggle-chip><button aria-pressed="true|false">
     → อ่าน aria-pressed (ไม่เกี่ยวกับภาษา · แกะจากหน้าจริงแล้ว) แล้วกดปิดถ้าเปิดอยู่
     ถ้าปล่อยเปิดไว้ Agent จะแย่งคุมกล่องพ้อม = Merge พิมพ์พ้อม/กดเจนไม่ได้ (ปัญหาเดิมสมัยแอปเก่า) */
  async function ensureAgentOff() {
    const chip = document.querySelector('flow-agent-mode-toggle-chip');
    if (!chip) return true; // ไม่มีชิป = บัญชีนี้ไม่มีโหมด Agent
    const btn = chip.querySelector('button, [role=button]') || chip;
    if (btn.getAttribute('aria-pressed') !== 'true') return true; // ปิดอยู่แล้ว
    say('   🤖 เจอ Flow Agent เปิดอยู่ — กำลังปิดให้ (ไม่งั้นมันจะแย่งช่องพิมพ์พ้อม)', 'warn');
    await humanClick(btn, 'ปิด Agent');
    const pressed = () => {
      const c = document.querySelector('flow-agent-mode-toggle-chip');
      const b = c && (c.querySelector('button, [role=button]') || c);
      return b ? b.getAttribute('aria-pressed') : null;
    };
    const off = await waitFor(() => (pressed() !== 'true' ? true : null), 8000, 500);
    say(off ? '   ✅ ปิด Flow Agent แล้ว' : '   ⚠️ ปิด Agent ไม่สำเร็จ — ถ้าพิมพ์พ้อมไม่ติด ให้ปิดเองในหน้า Flow', off ? 'ok' : 'warn');
    return !!off;
  }

  // ---------- ① ตั้งค่า (โหมด/สัดส่วน/ความละเอียด/ความยาว/จำนวน) ----------
  //   เมนูเดียวรวมทุกอย่าง · ทุกตัวเลือกเป็น [role=radio] ข้อความอ่านออก (ไอคอน+ข้อความติดกัน เช่น "imageImage")
  async function openSettings() {
    const t = $$('button').find((b) => /settings-trigg/.test(String(b.className)));
    if (!t) { dumpCandidates('ปุ่มตั้งค่า', $$('button')); throw new Error('ไม่เจอปุ่มตั้งค่า (หน้ายังโหลดไม่เสร็จ?)'); }
    await humanClick(t, 'settings');
    const ok = await waitFor(() => $$('.cdk-overlay-pane [role=radio]').length > 0, 8000, 300);
    if (!ok) throw new Error('เมนูตั้งค่าไม่เปิด');
  }
  /* เลือก radio — หา 2 ทาง: ① ชื่อไอคอน (ไม่แปลตามภาษา) ② ข้อความตรงตัว (ตัวเลขอย่าง 720p/8s/x1 ไม่แปลอยู่แล้ว)
     ⚠️ owner ทัก: Flow ของเขาเป็นภาษาไทย → ห้ามยึดคำว่า Image/Video เด็ดขาด (โดนแปลเป็น รูปภาพ/วิดีโอ) */
  async function pickRadio(match, label) {
    const list = $$('.cdk-overlay-pane [role=radio]');
    const el = typeof match === 'string' ? list.find((b) => hasIcon(b, match))
      : list.find((b) => match.test(norm(b)));
    if (!el) { say('   ⚠️ ไม่เจอตัวเลือก ' + label + ' (ข้ามไปใช้ค่าเดิม)', 'warn'); return false; }
    if (el.getAttribute('aria-checked') === 'true') return true; // ตรงอยู่แล้ว ไม่ต้องกด
    await humanClick(el, label);
    return true;
  }
  /* 🎬 เลือกโมเดลวิดีโอ (owner 2026-09-09: "คลิปแรกเลือกโมเดล 0 เครดิตแล้ว ทำไมบอกต่อฉากไม่ได้")
     ต้นเหตุ: Merge ตั้งแต่สัดส่วน แต่ **ไม่เคยตั้งโมเดลวิดีโอ** → Flow ใช้ค่าที่ค้างในหน้า (Omni)
     พอฉาก 1 เป็น Omni → ปุ่ม Extend (Veo) ถูกปิด = ต่อฉากไม่ได้ ทั้งที่ผู้ใช้เลือก Veo ไว้แล้ว
     ปุ่ม "เลือกตระกูลโมเดล" อยู่ในเมนูตั้งค่า → กดแล้วเลือกจากชื่อรุ่น (ชื่อแบรนด์ ไม่ถูกแปลตามภาษา) */
  async function pickModelFamily(want, label) {
    const list = Array.isArray(want) ? want : [want];      // ไล่ตามลำดับความชอบ (ตัวแรก = ตรงรุ่นที่สุด)
    const trig = $$('.cdk-overlay-pane button').find((b) => /Select model family/i.test(b.getAttribute('aria-label') || ''))
      || $$('.cdk-overlay-pane button').find((b) => hasIcon(b, 'arrow_drop_down'));
    if (!trig) { say('   ℹ️ เมนูนี้ไม่มีให้เลือกโมเดล (ข้าม)'); return false; }
    if (list[0] && list[0].test(norm(trig))) return true;   // ตรงรุ่นที่ต้องการอยู่แล้ว
    await humanClick(trig, 'เลือกตระกูลโมเดล');
    const items = () => $$('.cdk-overlay-pane button, .cdk-overlay-pane [role=menuitem], .cdk-overlay-pane [role=option]');
    await waitFor(() => (items().length > 1 ? true : null), 6000, 300);
    let pick = null, usedIdx = -1;
    for (let i = 0; i < list.length && !pick; i++) { pick = items().find((b) => list[i].test(norm(b))) || null; if (pick) usedIdx = i; }
    if (pick && usedIdx > 0) say('   ⚠️ ไม่เจอรุ่นที่ตรงเป๊ะ — ใช้ "' + norm(pick).slice(0, 34) + '" แทน', 'warn');
    if (!pick) { dumpCandidates('โมเดล ' + label, $$('.cdk-overlay-pane button, .cdk-overlay-pane [role=menuitem]')); return false; }
    const opt2 = pick;
    await humanClick(opt2, 'โมเดล ' + label);
    say('   🎛️ ตั้งโมเดล: ' + norm(opt2).slice(0, 40), 'ok');   // ใช้ร่วมทั้งโมเดลภาพและวิดีโอ
    return true;
  }
  //   แปลงคีย์โมเดลของแอป → ชื่อที่โชว์ใน Flow (ชื่อแบรนด์ ไม่แปลตามภาษา)
  /* ⚠️ ต้องเลือก "รุ่นให้ตรง" ไม่ใช่แค่ตระกูล (owner ยืนยัน 2026-09-09: ต้องเป็น Veo 3.1 Lite ถึงต่อฉากได้)
     เมนูมี Veo หลายรุ่น — ถ้าไปได้รุ่นอื่น ปุ่ม Extend ก็ยังเทาอยู่ดี
     คีย์ของแอปเช่น veo_3_1_i2v_lite_low_priority → ต้องจับคำว่า lite ด้วย */
  /* 📋 รายชื่อจริงในเมนู (แกะจากหน้า Flow 2026-09-09):
       Omni 1.1 Flash · Veo 3.1 - Lite · Veo 3.1 - Fast · Veo 3.1 - Quality · Veo 3.1 - Lite [Lower Priority]
     ⚠️ ตัวฟรี 0 เครดิตของแอปคือ **Lite [Lower Priority]** — ถ้าจับแค่ /veo.*lite/ จะได้ "Veo 3.1 - Lite"
        (คนละตัว เสียเครดิต) → ต้องไล่ลำดับความชอบ ไม่ใช่ regex เดียว */
  const modelRe = (key) => {
    const k = String(key || '').toLowerCase();
    if (/veo/.test(k)) {
      if (/low|lower/.test(k)) return [/veo[^|]*lite[^|]*lower/i, /veo[^|]*lite/i, /veo/i];   // ฟรี 0 เครดิต
      if (/lite/.test(k)) return [/veo[^|]*lite(?![^|]*lower)/i, /veo[^|]*lite/i, /veo/i];
      if (/fast/.test(k)) return [/veo[^|]*fast/i, /veo/i];
      if (/quality/.test(k)) return [/veo[^|]*quality/i, /veo/i];
      return [/veo/i];
    }
    if (/omni|abra/.test(k)) return [/omni/i];
    return null;
  };
  /* 🖼️ โมเดลภาพที่ผู้ใช้เลือกในแอป → ชื่อในเมนูของ Flow (owner 2026-09-09: "เลือก Banana 2 แต่มันใช้ Pro")
     Merge ไม่เคยตั้งโมเดลภาพเลย ใช้ค่าที่ค้างอยู่ในหน้า Flow มาตลอด */
  const imgModelRe = (key) => {
    const k = String(key || '').toLowerCase();
    if (/nano_banana_2|banana_2|banana2/.test(k)) return /nano\s*banana\s*2/i;
    if (/nano_banana_pro|banana_pro/.test(k)) return /nano\s*banana\s*pro/i;
    if (/imagen/.test(k)) return /imagen/i;
    return null;
  };
  //   ⏱️ ความยาวคลิปตามโมเดลวิดีโอที่เลือก (Omni เลือกได้ 4/6/8/10 · Veo = 8)
  const durOfModel = (key) => {
    const k = String(key || '').toLowerCase();
    if (/10s/.test(k)) return 10;
    if (/6s/.test(k)) return 6;
    if (/4s/.test(k)) return 4;
    return 8;
  };

  const MODE_ICON = { Image: 'image', Video: 'videocam', Frames: 'crop_free', Ingredients: 'chrome_extension' };
  async function configure(cfg) {
    cfg = cfg || {};
    await openSettings();
    /* โหมด: ถ้าเมนูไม่มีตัวเลือกโหมด แปลว่าอยู่โหมดนั้นอยู่แล้ว (แอปใหม่ซ่อนแถวโหมดเมื่อไม่มีให้สลับ)
       → ไม่ต้องเตือน กันคนอ่าน log แล้วนึกว่าพัง (owner เจอ "⚠️ ไม่เจอตัวเลือก โหมด Image" ทั้งที่อยู่โหมดภาพอยู่แล้ว) */
    if (cfg.mode) {
      const icon = MODE_ICON[cfg.mode] || String(cfg.mode).toLowerCase();
      const has = $$('.cdk-overlay-pane [role=radio]').some((b) => hasIcon(b, icon));
      if (has) await pickRadio(icon, 'โหมด ' + cfg.mode);
      else say('   ℹ️ อยู่โหมด ' + cfg.mode + ' อยู่แล้ว (เมนูไม่มีให้สลับ)');
    }
    if (cfg.aspect) await pickRadio(cfg.aspect === '9:16' ? 'crop_9_16' : 'crop_16_9', 'สัดส่วน ' + cfg.aspect);
    if (cfg.imageModel) { const re = imgModelRe(cfg.imageModel); if (re) await pickModelFamily(re, cfg.imageModel); }
    if (cfg.videoModel) { const re = modelRe(cfg.videoModel); if (re) await pickModelFamily(re, cfg.videoModel); }
    if (cfg.resolution) await pickRadio(new RegExp('^' + cfg.resolution, 'i'), cfg.resolution);      // 720p/360p ไม่แปล
    if (cfg.duration) await pickRadio(new RegExp('^' + cfg.duration + 's$', 'i'), cfg.duration + ' วิ'); // 8s ไม่แปล
    if (cfg.count) await pickRadio(new RegExp('^x' + cfg.count + '$', 'i'), 'จำนวน x' + cfg.count);      // x1 ไม่แปล
    await closeOverlay();
  }
  // อ่านค่าที่ตั้งอยู่ตอนนี้ (ปุ่มโชว์สรุป เช่น "Video · 720p · 8s crop_16_9 x1")
  const currentSettings = () => norm($$('button').find((b) => /settings-trigg/.test(String(b.className))) || {});

  // ---------- ② พิมพ์พ้อม ----------
  //   ⚠️ ProseMirror: กำหนด .value/.textContent ตรงๆ ไม่ได้ (Angular ไม่รู้เรื่อง) → execCommand insertText
  //   เทสจริงแล้ว: พิมพ์ติด + ปุ่ม Start generation เปลี่ยนจาก disabled → enabled ทันที
  function promptBox() { return $$('div.ProseMirror').find((e) => !!e.offsetParent) || document.querySelector('div.ProseMirror'); }
  async function clearPrompt() {
    const pm = promptBox(); if (!pm) return;
    pm.focus();
    const s = window.getSelection(), r = document.createRange();
    r.selectNodeContents(pm); s.removeAllRanges(); s.addRange(r);
    document.execCommand('delete');
    await sleep(200);
  }
  async function typePrompt(text) {
    const pm = promptBox();
    if (!pm) throw new Error('ไม่เจอกล่องพ้อม');
    await clearPrompt();
    pm.focus();
    const s = window.getSelection(), r = document.createRange();
    r.selectNodeContents(pm); r.collapse(false); s.removeAllRanges(); s.addRange(r);
    // พิมพ์เป็นท่อน ๆ (เหมือนคนพิมพ์ · ไม่ยัดทีเดียว) — Angular ได้รับ input event ครบ
    const str = String(text || '');
    for (let i = 0; i < str.length; i += 60) {
      document.execCommand('insertText', false, str.slice(i, i + 60));
      await sleep(rand(40, 120));
    }
    await sleep(300);
    return (pm.textContent || '').includes(str.slice(0, 20));
  }

  // ---------- ③ กดเจน ----------
  //   ปุ่มเจน: aria-label="Start generation" โดนแปลเมื่อ UI เป็นไทย → ยึดไอคอน arrow_forward (อยู่ในกล่องพ้อม)
  const genBtn = () => {
    const box = document.querySelector('flow-generate-icon-button') || document.querySelector('flow-base-prompt-box') || document;
    return byIcon($$('button', box), 'arrow_forward')
      || $$('button').find((b) => (b.getAttribute('aria-label') || '') === 'Start generation')
      || byIcon($$('button'), 'arrow_forward');
  };
  async function generate() {
    const g = await waitFor(() => { const b = genBtn(); return (b && !b.disabled) ? b : null; }, 15000, 500);
    if (!g) { dumpCandidates('ปุ่มเจน (arrow_forward)', $$('button')); throw new Error('ปุ่มเจนยังกดไม่ได้ (พ้อมว่าง หรือหน้าไม่พร้อม)'); }
    await humanClick(g, 'Start generation');
  }

  // ---------- ④ การ์ดสื่อ ----------
  const imageTiles = () => $$('flow-image-tile');
  const videoTiles = () => $$('flow-video-tile');
  //   รอการ์ดใหม่โผล่ (เทียบจำนวนก่อน-หลัง) · Flow ใส่การ์ดใหม่ไว้บนสุดเสมอ
  /* 🔑 จำ "ตัวตนการ์ด" ก่อนเจน แล้วรอใบที่ไม่เคยเห็น (owner 2026-09-09)
     เดิมนับจำนวนการ์ดเฉยๆ → รูป ref ที่เพิ่งอัปเข้าโปรเจ็คก็โผล่เป็นการ์ดด้วย
     = ระบบนึกว่า "ได้ภาพแล้ว" ทันทีที่กด Generate (log ขึ้นวินาทีเดียวกันเป๊ะ) แล้วไปหยิบรูป ref มาทำต่อ */
  const tileKey = (t) => {
    const im = t.querySelector('img, video');
    return (im && (im.getAttribute('src') || im.currentSrc || '')) || norm(t).slice(0, 40) || String(Math.random());
  };
  const tileKeys = (kind) => new Set((kind === 'video' ? videoTiles() : imageTiles()).map(tileKey));
  async function waitNewTile(kind, beforeKeys, timeoutMs, excludeRe) {
    const get = kind === 'video' ? videoTiles : imageTiles;
    const known = (beforeKeys instanceof Set) ? beforeKeys : new Set();
    /* ⚠️ Flow ใส่การ์ด "กำลังเจน" ทันทีที่กด → เจอการ์ดใหม่ไม่ได้แปลว่าเสร็จ (owner: "ได้ภาพแล้ว" ขึ้นใน 3 วิ)
       → ต้องรอจนการ์ดมีรูป/คลิปจริง (มี src) ถึงจะถือว่าเสร็จ */
    const ready = (x) => {
      //   การ์ดที่ยังเจนอยู่จะโชว์ % ความคืบหน้า (เช่น "15%") — ยังไม่นับว่าเสร็จ
      if (/\d{1,3}\s?%/.test(norm(x))) return false;
      const m = x.querySelector(kind === 'video' ? 'video, img.thumbnail, img' : 'img');
      const src = m && (m.getAttribute('src') || m.currentSrc || '');
      return !!(src && !/^data:image\/gif/.test(src));
    };
    /* 🚫 กันการ์ด "รูป ref ที่เราเพิ่งอัป" มาปนเป็นภาพที่เจนได้ (owner จับได้: บอทเอาภาพนางแบบไปทำวิดีโอ)
       รูป ref อัปเสร็จช้ากว่าตอนเริ่มเจน → โผล่ทีหลัง = ดูเหมือนการ์ดใหม่เป๊ะ · กันด้วยชื่อไฟล์ของเราเอง */
    const skip = (x) => excludeRe && excludeRe.test(norm(x));
    /* ⚠️ owner 2026-09-09: "ฉาก 2 ยังเจนไม่เสร็จ แต่ไปเซฟคลิปฉาก 1 แล้วบอกว่าเสร็จ"
       ต้นเหตุ: กุญแจของการ์ด = URL รูป/คลิปข้างใน — การ์ดที่ยังเรนเดอร์ไม่เสร็จตอนเริ่มจับ
       พอเสร็จทีหลัง URL เพิ่งโผล่ = "กุญแจเปลี่ยน" → นับเป็นการ์ดใหม่ทั้งที่เป็นของฉากก่อน
       → กันอีกชั้นด้วย "ตัวตนของ element": การ์ดไหนพร้อมอยู่แล้วตั้งแต่ก่อนกดเจน = ของเก่าเสมอ */
    const oldReady = get().filter((x) => ready(x));
    const t = await waitFor(() => get().find((x) => !known.has(tileKey(x)) && !skip(x) && ready(x) && oldReady.indexOf(x) < 0) || null, timeoutMs || 6 * 60 * 1000, 3000);
    if (!t) throw new Error('รอ' + (kind === 'video' ? 'คลิป' : 'ภาพ') + 'ไม่ขึ้นภายในเวลา');
    await sleep(2000); // ให้การ์ดวาดปุ่มลอยเสร็จ
    return t;
  }
  //   เปิดเมนู ⋮ ของการ์ดแล้วกดรายการที่ต้องการ (Animate / Download / Add to scene ...)
  //   match = ชื่อไอคอน (แนะนำ · ไม่แปลตามภาษา) หรือ regex ข้อความ
  async function tileMenu(tile, match, label) {
    /* 🖱️ ปุ่ม ⋮ บนการ์ดเป็น "ปุ่มลอย" โผล่เฉพาะตอนเมาส์ชี้อยู่บนการ์ด (owner เจอ "ไม่เจอปุ่มเมนูบนการ์ด")
       → ต้องส่ง hover เข้าไปก่อน แล้วค่อยหา */
    let mv = null;
    for (let i = 0; i < 3 && !mv; i++) {
      const r = tile.getBoundingClientRect();
      const o = { bubbles: true, cancelable: true, view: window, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2, pointerId: 1, pointerType: 'mouse', isPrimary: true };
      ['pointerover', 'pointerenter', 'mouseover', 'mouseenter', 'pointermove', 'mousemove'].forEach((ev) => {
        tile.dispatchEvent(ev.startsWith('pointer') ? new PointerEvent(ev, o) : new MouseEvent(ev, o));
      });
      try { chrome.runtime.sendMessage({ __pdCdpMove: true, x: Math.round(o.clientX), y: Math.round(o.clientY) }); } catch (_) {}
      await sleep(700);
      mv = $$('button', tile).find((b) => hasIcon(b, 'more_vert'));
    }
    if (!mv) { dumpCandidates('ปุ่มเมนู ⋮ บนการ์ด', $$('button', tile)); throw new Error('ไม่เจอปุ่มเมนูบนการ์ด'); }
    await humanClick(mv, 'เมนูการ์ด');
    const item = await waitFor(() => (typeof match === 'string' ? overlayByIcon(match) : overlayItem(match)), 6000, 300);
    if (!item) { dumpCandidates('เมนู ' + label, overlayBtns()); await closeOverlay(); throw new Error('ไม่เจอเมนู ' + label); }
    await humanClick(item, label);
  }

  // ---------- ⑤ ต่อฉาก (Extend) ----------
  //   คลิกการ์ดวิดีโอตรง ๆ = เข้า Scene builder (/project/<pid>/edit/<sceneId>) — ไม่ต้องผ่านเมนู
  async function openScene(tile) {
    const target = tile.querySelector('img.thumbnail, video, img') || tile;
    await humanClick(target, 'เปิดคลิปเข้า Scene builder');
    const ok = await waitFor(() => /\/edit\//.test(location.href) && document.querySelector('flow-scene-builder'), 30000, 700);
    if (!ok) throw new Error('เปิด Scene builder ไม่สำเร็จ');
    /* ⏳ owner 2026-09-09: "กดเปิดคลิปเข้าไป แล้วบราวเซอร์เด้งเป็นเล็กๆ แล้วมันก็กดปิดออกมา"
       เข้าหน้าแล้วต้องรอไทม์ไลน์+ปุ่มโหลดเสร็จก่อน (เดิมกดต่อภายใน 1 วิ = ปุ่มยังไม่พร้อม เลยขึ้นว่า disabled)
       + สั่งขยายหน้าต่างซ้ำ เพราะตัวจัดการหน้าต่างอัตโนมัติชอบย่อจอตอนเปลี่ยนหน้า */
    try { chrome.runtime.sendMessage({ __pdWindowSize: 'expandBig' }); } catch (_) {}
    await waitFor(() => document.querySelector('flow-scene-timeline') && $$('button,[role=button]').some((b) => hasIcon(b, 'add_2')), 30000, 700);
    await sleep(2500);
    await ensureHistoryOpen();   // เปิดแผงประวัติค้างไว้ = เห็นการ์ด "ล้มเหลว" ทันทีที่ Flow เจนไม่ผ่าน
  }
  //   เช็คว่าต่อฉากได้ไหม + ได้ด้วยโมเดลอะไร (เมนูบอกชื่อโมเดลมาเลย)
  async function extendInfo() {
    //   ปุ่ม Add clip: aria-label โดนแปล → ยึดไอคอน add_2 บนไทม์ไลน์ (fallback aria-label อังกฤษ)
    const add = byIcon($$('button,[role=button]'), 'add_2') || $$('button,[role=button]').find((b) => (b.getAttribute('aria-label') || '') === 'Add clip');
    if (!add) return { ok: false, why: 'ไม่เจอปุ่ม Add clip' };
    await humanClick(add, 'Add clip');
    //   Extend: ข้อความโดนแปล → ยึดไอคอน keyboard_double_arrow_right
    const item = await waitFor(() => overlayByIcon('keyboard_double_arrow_right', /Extend/i), 8000, 300);
    if (!item) { dumpCandidates('เมนู Extend', overlayBtns()); await closeOverlay(); return { ok: false, why: 'ไม่มีตัวเลือก Extend' }; }
    /* ⏳ ปุ่มนี้ disabled อยู่พักนึงตอนหน้าเพิ่งโหลด (คลิปยังประมวลผลไม่เสร็จ) → รอสูงสุด 45 วิ
       ถ้าครบเวลายัง disabled ค่อยสรุปว่า "โมเดลนี้ต่อฉากไม่ได้" (แยก 2 เคสนี้ออกจากกันให้ชัด) */
    const live = await waitFor(() => {
      const b = overlayByIcon('keyboard_double_arrow_right', /Extend/i);
      return (b && !b.disabled) ? b : null;
    }, 45000, 1500);
    const el = live || overlayByIcon('keyboard_double_arrow_right', /Extend/i) || item;
    const label = norm(el).replace(/^keyboard_double_arrow_right/, '');
    return { ok: !!live, disabled: !live, label, el };
  }
  /* ⏱️ ความยาวซีนตอนนี้ (วินาที) — ใช้พิสูจน์ว่า "ต่อฉากเสร็จจริง" ไม่ใช่แค่กดสั่งไปแล้ว
     owner 2026-09-09: กด Extend เสร็จ 9 วิ ระบบก็ดึงคลิปเลย → ได้แค่ฉาก 1 (8 วิ) */
  /* ⚠️ การ์ด "ล้มเหลว" บนหน้าโปรเจ็ค (ตอนเจนภาพ/วิดีโอไม่ผ่าน — คนละใบกับการ์ดในแผงประวัติของ Scene builder)
     owner 2026-09-09: "กรณีเฟลตอนสร้าง มันยังไม่มีตัวเช็คเพื่อรีทาย" — เดิมบอทไม่รู้ นั่งรอเก้อจนครบ 6 นาที
     หน้าตา: กล่องในกริดสื่อ มีไอคอนเตือน + ข้อความว่าไม่สำเร็จ + ปุ่ม ↻ ลองใหม่ / ↺ ย้อน / 🗑 ลบ */
  //   คำ/ไอคอนที่บอกว่า "การ์ดนี้เจนไม่สำเร็จ" — ครอบทั้งไทยและอังกฤษ (Flow แปลข้อความตามภาษาที่ผู้ใช้ตั้ง)
  const FAIL_RE = /ล้มเหลว|ไม่สำเร็จ|เกิดข้อผิดพลาด|ผิดพลาด|ลองใหม่|failed|failure|unsuccessful|error|went wrong|try again/i;
  function failedGenCard() {
    //   ① ทางเดิม: ปุ่มลบ + ปุ่มลองใหม่ อยู่ในกล่องเดียวกัน + มีคำ/ไอคอนเตือน
    for (const d of $$('button,[role=button]').filter((b) => hasIcon(b, 'delete'))) {
      if (d.closest('.cdk-overlay-container') || d.closest('flow-editor-history-panel')) continue;  // เมนู/แผงประวัติ ไม่นับ
      let box = d.parentElement;
      for (let i = 0; i < 5 && box; i++, box = box.parentElement) {
        const btns = $$('button,[role=button]', box);
        const retry = btns.find((b) => RETRY_ICONS.some((ic) => hasIcon(b, ic)));
        if (!retry) continue;
        const warn = WARN_ICONS.some((ic) => hasIcon(box, ic)) || FAIL_RE.test(norm(box));
        if (warn) return { box, retry, del: d };
        break;
      }
    }
    /* ② ทางสำรอง — ยึด "ข้อความ" เป็นหลัก ไม่ยึดชื่อไอคอน (owner 2026-09-10:
          "ถ้า Flow เป็นภาษาไทยจะเช็คได้ไหม · ตอนนี้ Flow อังกฤษยังนิ่งไป 3-4 นาที")
          Google เปลี่ยนชื่อไอคอน/เปลี่ยนเป็น SVG เมื่อไหร่ ทางแรกก็ตาบอดทันที
          ทางนี้: หากล่องเล็กที่สุดที่มีคำว่า "ล้มเหลว/Failed" + มีปุ่มอย่างน้อย 2 ปุ่ม (ลองใหม่/ย้อน/ลบ) */
    let best = null;
    for (const el of $$('div,section,article')) {
      if (el.closest('.cdk-overlay-container') || el.closest('flow-editor-history-panel')) continue;
      const t = norm(el);
      if (!t || t.length > 400 || !FAIL_RE.test(t)) continue;
      const btns = $$('button,[role=button]', el).filter((b) => !b.disabled);
      if (btns.length < 2) continue;
      if (!best || t.length < norm(best.el).length) best = { el, btns };
    }
    if (best) {
      const del = best.btns.find((b) => hasIcon(b, 'delete')) || best.btns[best.btns.length - 1];
      //   ปุ่มลองใหม่ = ตัวที่ไม่ใช่ปุ่มลบ (ปกติเป็นปุ่มแรกของแถว)
      const retry = best.btns.find((b) => RETRY_ICONS.some((ic) => hasIcon(b, ic))) || best.btns.find((b) => b !== del) || best.btns[0];
      return { box: best.el, retry, del };
    }
    return null;
  }
  /* 🔁 รอการ์ดใหม่แบบรู้ตัวว่าเฟล — เจอการ์ดล้มเหลวเมื่อไหร่ กดปุ่มลองใหม่บนการ์ดนั้นเลย (สูงสุด 3 ครั้ง)
     ไม่ต้องรีเฟรชหน้า (รีเฟรช = สคริปต์ที่กำลังทำงานตายกลางคัน งานล่มทั้งฉาก) */
  async function waitNewTileSmart(kind, before, timeout, excludeRe, what) {
    const label = what || (kind === 'image' ? 'ภาพ' : 'วิดีโอ');
    for (let attempt = 1; attempt <= 3; attempt++) {
      let failed = false;
      /* 💓 เต้นเป็นจังหวะระหว่างรอ (owner 2026-09-10: "log มันค้าง เลยคิดว่ามันนิ่งเกินไป")
         เดิมระหว่างรอ 6-12 นาทีไม่มี log สักบรรทัด = แยกไม่ออกว่า "กำลังรอ" หรือ "ตายไปแล้ว" */
      const _t0 = Date.now();
      const hb = setInterval(() => {
        const sec = Math.round((Date.now() - _t0) / 1000);
        say(`   ⏳ ยังรอ${label}อยู่... ${sec >= 60 ? Math.floor(sec / 60) + ' นาที ' + (sec % 60) + ' วิ' : sec + ' วิ'} (ปกติ 1-3 นาที · ถ้า Flow ขึ้นการ์ดล้มเหลวจะกดลองใหม่ให้เอง)`);
      }, 30000);
      const w = setInterval(() => { try { if (failedGenCard()) failed = true; } catch (_) {} }, 5000);
      let tile = null;
      try {
        tile = await Promise.race([
          waitNewTile(kind, before, timeout, excludeRe).catch(() => null),
          (async () => { while (!failed) await sleep(2000); return null; })(),
        ]);
      } finally { clearInterval(w); clearInterval(hb); }
      if (tile) return tile;
      const fc = failedGenCard();
      //   หมดเวลาจริง ๆ (ไม่ได้ขึ้นการ์ดล้มเหลว) → โยน error แบบเดิม ให้ฝั่งแอปรีทาย/เขียนพรอมต์ใหม่
      if (!fc) throw new Error('รอ' + label + 'ไม่ขึ้นภายในเวลา');
      if (attempt >= 3) throw new Error(`Flow เจน${label}ไม่ผ่าน 3 ครั้งติด (${norm(fc.box).replace(/\s+/g, ' ').slice(0, 90)})`);
      say(`   ⚠️ Flow ขึ้นการ์ด "ล้มเหลว" ตอนเจน${label} — กดลองใหม่ให้ (ครั้งที่ ${attempt}/2)`, 'warn');
      try { chrome.runtime.sendMessage({ __pdWindowSize: 'expandBig' }); } catch (_) {}
      try { await humanClick(fc.retry, 'ลองใหม่บนการ์ดที่ล้มเหลว'); }
      catch (_) { throw new Error('Flow เจน' + label + 'ไม่สำเร็จ และกดปุ่มลองใหม่บนการ์ดไม่ได้'); }
      await sleep(4000);
      await waitFor(() => !failedGenCard(), 20000, 1000);   // ให้การ์ดเก่าหายก่อน ไม่งั้นรอบหน้าจับตัวเดิมซ้ำ
    }
    throw new Error('รอ' + label + 'ไม่ขึ้นภายในเวลา');
  }

  /* 🗑️ ฉากที่เจนไม่สำเร็จ → ลบคลิปนั้นทิ้ง แล้วสั่งต่อฉากใหม่ (owner 2026-09-09)
     owner: "แค่คลิ๊กที่คลิปเฟล แล้วลบ ลบเสร็จ รีทายแบบเดิมเหมือนตอนต่อฉาก 2 ใส่พ้อม กด extend"

     ✅ แกะจากหน้าจริง + ลบจริงมาแล้ว (โปรเจ็คของ owner · scene 2 คลิป → เหลือ 1 คลิป 8 วิ):
       · คลิปบนไทม์ไลน์ = `flow-scene-timeline .clip` (มีคลาส is-first / is-last / selected)
       · คลิกขวาบนคลิป → เมนู Copy · Paste · Save to Project · Download · **Delete** (ไอคอน delete)
       · ลบแล้วหายทันที ไม่มีป๊อปยืนยัน
       · การ์ด "ล้มเหลว" (⚠️ + ปุ่มลองใหม่/ย้อน/ถังขยะ) อยู่ใน **แผงประวัติ** ทางขวา
         → ถ้าแผงปิดอยู่ การ์ดจะไม่มีใน DOM เลย ต้องกดเปิดแผงก่อนเสมอ */
  const RETRY_ICONS = ['refresh', 'replay', 'autorenew', 'restart_alt', 'rotate_right', 'cached', 'sync'];
  const WARN_ICONS = ['warning', 'error', 'error_outline', 'report', 'priority_high'];
  //   แผงประวัติ: ปุ่มสลับเป็นไอคอน history · ข้อความ "Show history" ↔ "Hide history/ซ่อนประวัติ"
  async function ensureHistoryOpen() {
    const btn = $$('button,[role=button]').find((b) => hasIcon(b, 'history'))
      || $$('button,[role=button]').find((b) => /history|ประวัติ/i.test(norm(b) + ' ' + (b.getAttribute('aria-label') || '')));
    if (!btn) return false;
    if (/ซ่อน|hide/i.test(norm(btn) + ' ' + (btn.getAttribute('aria-label') || ''))) return true;  // เปิดอยู่แล้ว
    try { await humanClick(btn, 'เปิดแผงประวัติ'); } catch (_) { return false; }
    await sleep(1500);
    return true;
  }
  /*   การ์ด "ล้มเหลว" ในแผงประวัติ
       📏 วัดของจริงมาแล้ว (2026-09-09) ว่าการ์ด "สำเร็จ" มีปุ่มอะไรบ้าง:
          Reuse prompt (keyboard_return) · More options (more_vert) · Ingredient (add) · Expand prompt
          → **ไม่มีปุ่มถังขยะ และไม่มีปุ่มลองใหม่เลย**
       ส่วนการ์ดที่เฟล (ภาพจาก owner) = ⚠️ + ข้อความ "…ไม่สำเร็จ" + ปุ่ม ↻ ลองใหม่ / ↺ ย้อน / 🗑 ลบ
       → เงื่อนไข: ในแผงประวัติมีปุ่มถังขยะ **และ** (มีปุ่มลองใหม่ หรือ ไอคอนเตือน หรือ ข้อความว่าไม่สำเร็จ)
         = ไม่มีทางไปตรงกับการ์ดที่สำเร็จ (กันบอทตรวจมั่วแล้วลบคลิปดีทิ้ง — เสียเครดิตฟรี) */
  function failedCard() {
    const panel = document.querySelector('flow-editor-history-panel');
    if (!panel) return null;                       // แผงประวัติไม่ได้เปิด = ยังตอบไม่ได้ ถือว่ายังไม่เฟล
    const del = $$('button,[role=button]', panel).find((b) => hasIcon(b, 'delete'));
    if (!del) return null;                         // การ์ดสำเร็จไม่มีถังขยะ = ยังไม่เฟล
    const box = del.closest('flow-editor-history-step-video') || del.parentElement || panel;
    const sure = $$('button,[role=button]', box).some((x) => RETRY_ICONS.some((ic) => hasIcon(x, ic)))
      || WARN_ICONS.some((ic) => hasIcon(box, ic))
      || /ล้มเหลว|ไม่สำเร็จ|fail|error|unsuccessful/i.test(norm(box));
    return sure ? { box, del } : null;
  }
  //   คลิปบนไทม์ไลน์ (เรียงซ้าย→ขวา)
  function timelineClipEls() {
    const els = $$('flow-scene-timeline .clip');
    if (els.length) return els.sort((a, b2) => a.getBoundingClientRect().x - b2.getBoundingClientRect().x);
    //   สำรอง: เผื่อคลาส .clip เปลี่ยนชื่อ — เดาจากกล่องกว้าง ๆ ในไทม์ไลน์ (ตัดปุ่ม + ที่กว้างแค่ ~24px ทิ้ง)
    const tl = document.querySelector('flow-scene-timeline');
    if (!tl) return [];
    const seen = new Set(); const out = [];
    $$('[class*="clip" i], [class*="strip" i]', tl).forEach((box) => {
      const r = box.getBoundingClientRect();
      if (r.width < 60 || r.height < 20) return;
      const k = Math.round(r.x) + 'x' + Math.round(r.width);
      if (seen.has(k)) return; seen.add(k); out.push(box);
    });
    return out.sort((a, b2) => a.getBoundingClientRect().x - b2.getBoundingClientRect().x);
  }
  //   คลิกขวาบนคลิป (Angular ใช้ mat-context-menu-trigger → ต้องยิง contextmenu event พร้อมพิกัดจริง)
  async function rightClick(el, label) {
    if (!el) throw new Error('ไม่เจอคลิป' + (label ? ' (' + label + ')' : ''));
    try { el.scrollIntoView({ block: 'center', behavior: 'instant' }); } catch (_) {}
    await sleep(300);
    const r = el.getBoundingClientRect();
    const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
    const o = { bubbles: true, cancelable: true, view: window, clientX: cx, clientY: cy, button: 2, buttons: 2, pointerId: 1, pointerType: 'mouse', isPrimary: true, detail: 0 };
    ['pointerover', 'pointerenter', 'pointermove', 'pointerdown', 'mousedown', 'pointerup', 'mouseup']
      .forEach((ev) => el.dispatchEvent(ev.startsWith('pointer') ? new PointerEvent(ev, o) : new MouseEvent(ev, o)));
    el.dispatchEvent(new MouseEvent('contextmenu', o));
    await sleep(700);
  }
  //   ลบคลิปตัวท้ายสุด (= ฉากที่เพิ่งต่อแล้วเฟล) ออกจากไทม์ไลน์
  async function deleteLastClip() {
    const clips = timelineClipEls();
    const last = clips[clips.length - 1];
    if (!last) return false;
    const before = clips.length;
    try { chrome.runtime.sendMessage({ __pdWindowSize: 'expandBig' }); } catch (_) {}
    await rightClick(last, 'คลิปฉากล่าสุด');
    const del = await waitFor(() => overlayByIcon('delete', /^(ลบ|delete|remove)/i), 6000, 300);
    if (!del) {
      //   ไม่มีเมนูคลิกขวา → ใช้ปุ่มถังขยะบนการ์ด "ล้มเหลว" ในแผงประวัติแทน
      await closeOverlay();
      await ensureHistoryOpen();
      const fc = failedCard();
      if (!fc) return false;
      await humanClick(fc.del, 'ลบคลิปที่ล้มเหลว (จากแผงประวัติ)');
    } else {
      await humanClick(del, 'ลบคลิปที่ล้มเหลว');
    }
    await sleep(1500);
    return await waitFor(() => (timelineClipEls().length < before) || !failedCard(), 15000, 1000) !== null;
  }

  function sceneDurSec() {
    /* ⚠️ owner 2026-09-09: อ่านจาก video.duration ไม่ได้ — ตัวเล่นไม่อัปเดตค่านี้ตอนซีนยาวขึ้น
       (ภาพหน้าจอ: ตัวเลขบนจอขึ้น 00:16:00 แล้ว = ฉาก 2 เสร็จ แต่โค้ดยังนึกว่า 8 วิ)
       → อ่าน "เวลารวม" ที่โชว์ใต้ตัวเล่นแทน · รูปแบบ นาที:วินาที:เฟรม → เอาตัวกลางเป็นวินาที */
    const root = document.querySelector('flow-scene-builder') || document.body;
    const txt = (root.innerText || '');
    const all = txt.match(/\d{2}:\d{2}:\d{2}/g) || [];
    if (all.length) {
      const p2 = all[all.length - 1].split(':').map(Number);   // ตัวสุดท้าย = เวลารวม (ตัวแรก = ตำแหน่งที่เล่นอยู่)
      const sec = (p2[0] || 0) * 60 + (p2[1] || 0);
      if (sec > 0) return sec;
    }
    const v = (document.querySelector('flow-scene-editor-canvas') || document).querySelector('video');
    const d = v && v.duration;
    return (typeof d === 'number' && isFinite(d) && d > 0) ? d : 0;
  }
  /* 🔑 สัญญาณที่เชื่อถือได้จริง = "ไฟล์วิดีโอของซีนเปลี่ยนเป็นไฟล์ใหม่"
     owner 2026-09-09 (รอบที่ 2): ตัวเลขความยาวขึ้น 16 วิ "ทันทีที่กด Extend" — Flow จองที่ในไทม์ไลน์ไว้ก่อน
     ทั้งที่คลิปยังเรนเดอร์ไม่เสร็จ → ความยาว/จำนวนคลิป เชื่อไม่ได้
     แต่ Flow จะสร้าง "ไฟล์รวมซีนใหม่" ต่อเมื่อเรนเดอร์เสร็จจริง → รอ src เปลี่ยนคือของจริง */
  function sceneVideoSrc() {
    const v = (document.querySelector('flow-scene-editor-canvas') || document).querySelector('video');
    if (!v) return '';
    return v.currentSrc || v.getAttribute('src') || (v.querySelector('source') && v.querySelector('source').getAttribute('src')) || '';
  }
  //   สัญญาณสำรอง: จำนวนคลิปบนไทม์ไลน์ (ต่อฉากสำเร็จ = คลิปเพิ่ม)
  const timelineClips = () => $$('flow-scene-timeline flow-timeline-clip, flow-scene-timeline [class*="clip"]').length;
  async function extendOnce(prompt) {
    /* 🔁 ต่อฉากได้สูงสุด 3 ครั้ง — เฟลแล้ว "ลบคลิปที่เฟลทิ้ง" แล้วสั่งต่อฉากใหม่ด้วยพรอมต์เดิม
       (owner 2026-09-09: เดิมบอทไม่รู้ว่าเฟล เลยรอเก้อจนหมดเวลา 12 นาที แล้วได้คลิปฉากเดียว) */
    for (let attempt = 1; attempt <= 3; attempt++) {
      try { chrome.runtime.sendMessage({ __pdWindowSize: 'expandBig' }); } catch (_) {} // กันจอหดตอนกดต่อฉาก (owner เจอจริง)
      const durBefore = sceneDurSec();
      const srcBefore = sceneVideoSrc();
      const info = await extendInfo();
      if (!info.ok) {
        await closeOverlay();
        throw new Error(info.disabled
          ? `ต่อฉากไม่ได้ — Flow ปิดปุ่ม Extend ไว้สำหรับคลิปนี้ (${info.label || 'ไม่ทราบโมเดล'}) · คลิปที่เจนด้วยโมเดลบางตัวต่อฉากไม่ได้`
          : (info.why || 'ต่อฉากไม่ได้'));
      }
      say('   ➡️ ต่อฉากด้วย ' + info.label + (attempt > 1 ? ` (ลองใหม่ครั้งที่ ${attempt - 1}/2)` : ''));
      await humanClick(info.el, 'Extend');
      await sleep(1500);
      if (prompt) await typePrompt(prompt);
      await generate();
      say('   ⏳ รอฉากใหม่เจนเสร็จ (ปกติ 1-2 นาที)...');
      const t0 = Date.now();
      let failed = false, busy = false, lastProbe = 0;
      /*  ระหว่างรอ คอยส่องว่า Flow ขึ้นการ์ด "ล้มเหลว" หรือยัง
          การ์ดจะโผล่ในแผงขวาต่อเมื่อคลิปนั้นถูกเลือกอยู่ → ทุก ~1 นาที คลิกแถบคลิปตัวท้ายแล้วดูซ้ำ */
      const _watch = setInterval(() => {
        if (busy || failed) return;
        busy = true;
        (async () => {
          try {
            if (failedCard()) { failed = true; return; }
            //   เผื่อแผงประวัติถูกปิดกลางทาง (Flow เด้งปิดเองบางจังหวะ) → เปิดซ้ำทุก ~1 นาที
            if (Date.now() - lastProbe > 60000) { lastProbe = Date.now(); await ensureHistoryOpen(); if (failedCard()) failed = true; }
          } catch (_) {} finally { busy = false; }
        })();
      }, 8000);
      const grew = await waitFor(() => {
        if (failed) return 'FAIL';
        const src = sceneVideoSrc();
        const d = sceneDurSec();
        // ✅ ของจริง: ไฟล์วิดีโอของซีนถูกสร้างใหม่ (src เปลี่ยน) + ความยาวเพิ่มขึ้นแล้ว
        const srcChanged = !!src && src !== srcBefore;
        const longer = durBefore > 0 ? d > durBefore + 1 : d > 9;
        if (srcChanged && longer) return d || -1;
        // กันเคสอ่าน src ไม่ได้เลย → ยอมรับความยาวที่เพิ่ม แต่ต้องผ่านไปแล้วอย่างน้อย 60 วิ (เจน 1 ฉากเร็วกว่านี้ไม่ได้)
        if (!srcBefore && longer && Date.now() - t0 > 60000) return d || -1;
        return null;
      }, 12 * 60 * 1000, 4000);
      clearInterval(_watch);

      if (grew === 'FAIL' || (!grew && failedCard())) {
        if (attempt >= 3) throw new Error('ต่อฉากไม่สำเร็จ — Flow เจนฉากนี้ไม่ผ่าน 3 ครั้งติด (ลองเปลี่ยนพรอมต์/โมเดล)');
        say('   ⚠️ Flow เจนฉากนี้ไม่สำเร็จ — ลบคลิปที่เฟลทิ้ง แล้วสั่งต่อฉากใหม่', 'warn');
        if (!(await deleteLastClip())) say('   ⚠️ ลบคลิปที่เฟลไม่สำเร็จ — จะลองสั่งต่อฉากใหม่ทับไปเลย', 'warn');
        //   ต้องรอให้การ์ดที่เฟล "หายไปจริง" ก่อน ไม่งั้นรอบถัดไปจะเห็นการ์ดเก่าแล้วนึกว่าเฟลทันที
        if (!(await waitFor(() => !failedCard(), 20000, 1000))) {
          say('   ⚠️ การ์ดที่เฟลยังค้างอยู่ในประวัติ — หยุดต่อฉากไว้ก่อนเพื่อกันวนซ้ำ', 'warn');
          throw new Error('ต่อฉากไม่สำเร็จ — ลบคลิปที่เฟลออกไม่ได้ (การ์ดล้มเหลวยังค้างในประวัติ)');
        }
        await sleep(2500);
        continue;
      }
      if (!grew) throw new Error('ต่อฉากแล้วแต่ Flow ไม่ได้สร้างคลิปรวมใหม่ภายใน 12 นาที (อาจเจนไม่สำเร็จ)');
      await sleep(2500); // ให้ตัวเล่นสลับมาที่ไฟล์ใหม่เรียบร้อยก่อนดึง
      say('   ✅ ฉากใหม่เสร็จแล้ว' + (grew > 0 ? ' — คลิปยาว ' + Math.round(grew) + ' วิ' : ''), 'ok');
      return;
    }
  }

  // ---------- ⑥ อัปโหลดรูป ref ----------
  //   หน้าใหม่ไม่มี input[type=file] ค้างใน DOM (ต่างจากหน้าเก่า) → ต้องเปิด "Add media menu" ก่อน ตัว input ถึงถูกสร้าง
  //   ใส่ไฟล์ด้วย DataTransfer เหมือนเดิม (ท่าที่ Merge เก่าใช้มาตลอด · ชื่อไฟล์ pd-product-N.png ค้นเจอง่ายใน library)
  async function fileInput() {
    let inp = document.querySelector('input[type="file"]');
    if (inp) return inp;
    const add = $$('button,[role=button]').find((b) => /Add media menu/i.test(b.getAttribute('aria-label') || ''))
      || byIcon($$('flow-media-upload button, flow-add-menu button'), 'add');
    if (add) {
      await humanClick(add, 'Add media menu');
      inp = await waitFor(() => document.querySelector('input[type="file"]'), 6000, 300);
      if (inp) return inp;
      // เมนูอาจมีรายการ "Upload" ให้กดอีกชั้น
      const up = overlayItem(/upload|เพิ่ม|จากเครื่อง/i);
      if (up) { await humanClick(up, 'Upload'); inp = await waitFor(() => document.querySelector('input[type="file"]'), 6000, 300); }
    }
    return inp;
  }
  async function uploadRefs(refImages, b64ToBlob) {
    const refs = (refImages || []).filter(Boolean);
    const names = [];
    for (let i = 0; i < refs.length; i++) {
      const inp = await fileInput();
      if (!inp) throw new Error('ไม่พบช่องอัปโหลดรูปในหน้า Flow ใหม่ (เปิดเมนู Add media ไม่สำเร็จ)');
      const blob = b64ToBlob(refs[i]);
      const fname = 'pd-product-' + (i + 1) + '.png';
      const dt = new DataTransfer(); dt.items.add(new File([blob], fname, { type: blob.type || 'image/png' }));
      inp.files = dt.files;
      inp.dispatchEvent(new Event('change', { bubbles: true }));
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      say('   ⬆️ อัปโหลดรูป ' + (i + 1) + '/' + refs.length + '...');
      const before = imageTiles().length;
      await waitFor(() => imageTiles().length > before, 60000, 1500); // รอการ์ดรูปโผล่ = อัปเสร็จ
      names.push(fname);
      await sleep(rand(600, 1200));
    }
    return names;
  }

  /* 🧩 แนบรูป ref เข้ากล่องพ้อม — แกะจากของจริงแล้ว (2026-09-09 · owner จับได้ว่า log โกหก 2 รอบ)
     ขั้นตอนจริงมี 3 จังหวะ ไม่ใช่กดรูปเฉยๆ:
       ① กดปุ่ม add ในกล่องพ้อม → เปิด flow-add-menu-popover-content
       ② กดรูปใน flow-add-menu-asset-item  → รูปเข้า flow-add-menu-detail-pane (แค่ "เลือกดู" ยังไม่แนบ)
       ③ กดปุ่ม "Add to prompt" ใน detail pane → ถึงจะแนบจริง แล้วเมนูปิดเอง
     ✅ พิสูจน์การแนบได้จริง: กล่องพ้อมจะมี <flow-image-ingredient-chip> โผล่ (นับได้)
        → ไม่ต้องเชื่อว่า "กดแล้วน่าจะติด" อีกต่อไป · แนบทีละใบ (เมนูปิดหลังแนบ ต้องเปิดใหม่) */
  /* ⬆️ อัปรูปผ่าน "ปุ่มอัปโหลดของเมนูเอง" (owner 2026-09-09 · จุดที่พลาดมาตลอด)
     ก่อนหน้านี้อัปผ่าน API สำเร็จจริง — แต่ Angular โหลดรายการสื่อไว้ตอนเปิดหน้า
     ยัดรูปเข้าทางหลังบ้านแล้วหน้าเว็บ "ไม่รู้เรื่อง" → เมนูแนบว่างเปล่า (log ยืนยัน: เจอแต่ปุ่ม upload)
     → ต้องอัปผ่านช่องของมันเอง ซึ่งซ่อนอยู่ "ในเมนูแนบ" ไม่ใช่ที่หน้าหลัก (หาผิดที่มา 3 รอบ)
     = ท่าเดียวกับที่คนลากรูปไปวางเอง */
  async function openAddMenu() {
    const box = document.querySelector('flow-base-prompt-box') || document.querySelector('flow-prompt-box') || document;
    const add = $$('button', box).find((b) => /Add ingredients/i.test(b.getAttribute('aria-label') || '')) || byIcon($$('button', box), 'add');
    if (!add) { dumpCandidates('ปุ่มเปิดเมนูแนบ (add ในกล่องพ้อม)', $$('button', box)); return false; }
    await humanClick(add, 'เปิดเมนูแนบ ref');
    const ok = await waitFor(() => document.querySelector('flow-add-menu-popover-content') || document.querySelector('flow-add-menu-asset-list'), 8000, 300);
    return !!ok;
  }
  async function uploadViaMenu(refImages, b64ToBlob) {
    const refs = (refImages || []).filter(Boolean);
    if (!refs.length) return 0;
    if (!(await openAddMenu())) return 0;
    const upBtn = byIcon($$('.cdk-overlay-pane button'), 'upload');
    if (!upBtn) { dumpCandidates('ปุ่มอัปโหลดสื่อในเมนู', $$('.cdk-overlay-pane button')); await closeOverlay(); return 0; }
    const before = $$('flow-add-menu-asset-item').length;
    await humanClick(upBtn, 'อัปโหลดสื่อ');
    const inp = await waitFor(() => document.querySelector('input[type="file"]'), 8000, 300);
    if (!inp) { say('   ⚠️ กดอัปโหลดแล้วไม่เจอช่องเลือกไฟล์', 'warn'); await closeOverlay(); return 0; }
    const dt = new DataTransfer();
    refs.forEach((r, i) => { const blob = b64ToBlob(r); dt.items.add(new File([blob], 'pd-product-' + (i + 1) + '.png', { type: blob.type || 'image/png' })); });
    inp.files = dt.files;
    inp.dispatchEvent(new Event('change', { bubbles: true }));
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    say('   ⬆️ ส่งรูป ' + refs.length + ' ใบเข้าช่องอัปโหลดของ Flow แล้ว — รอขึ้นรายการ...');
    /* ⏳ owner จับได้ 2026-09-09: รายการโผล่ทันทีในสถานะ "กำลังอัปโหลด" → ผมนับว่าเสร็จแล้ว
       → ต้องรอจน "อัปเสร็จจริง" = ไม่มีแถบโหลด/สปินเนอร์ค้าง + มีรูปย่อขึ้นแล้ว
       (เช็คจากแท็บ progress ของ Angular Material = ไม่ต้องอ่านคำว่า "กำลังอัปโหลด" ที่แปลตามภาษา) */
    const uploading = (it) => !!it.querySelector('mat-progress-bar, mat-spinner, [role=progressbar], .mat-mdc-progress-bar, .mat-mdc-progress-spinner');
    const readyItems = () => $$('flow-add-menu-asset-item').filter((it) => {
      if (uploading(it)) return false;
      const im = it.querySelector('img');
      return !!(im && (im.getAttribute('src') || im.currentSrc));
    });
    //   ⚠️ ต้องรอ "ครบทุกใบ" — เดิมใบแรกเสร็จก็เดินต่อเลย ใบที่ 2 ยังอัปอยู่ = แนบไม่ครบ (owner เจอ 1 ใบ)
    const got = await waitFor(() => { const n = readyItems().length - before; return n >= refs.length ? n : null; }, 180000, 2000)
      || (readyItems().length - before);
    if (!got) { await closeOverlay(); say('   ⚠️ อัปแล้วรูปไม่พร้อมใช้ภายใน 3 นาที', 'warn'); return 0; }
    await sleep(1200);
    await closeOverlay();
    say('   ✅ รูปอัปเสร็จพร้อมใช้แล้ว ' + got + ' ใบ', 'ok');
    return got;
  }

  /* 🧩 นับ "ชิปรูป ref" ในกล่องพ้อม — owner เจอ log "แนบแล้ว 4/2 ใบ" (นับเกินเท่าตัว)
     เพราะ flow-image-ingredient-chip ซ้อนอยู่ใน flow-ingredient-chip → นับทั้งคู่ = คูณสอง
     → นับเฉพาะตัวนอกสุด และนับเฉพาะที่อยู่ในกล่องพ้อมจริง */
  const chipCount = () => {
    const box = document.querySelector('flow-base-prompt-box') || document.querySelector('flow-prompt-box') || document;
    const all = $$('flow-image-ingredient-chip, flow-ingredient-chip', box);
    return all.filter((c2) => !all.some((o) => o !== c2 && o.contains(c2))).length;
  };
  /* 🧹 ล้างชิปรูป ref ที่ค้างอยู่ในกล่องพ้อม (owner 2026-09-09 · เจอในบอท extension)
     หลังกด Animate ฉากก่อนหน้า Flow จะทิ้ง "ภาพฉากนั้น" ไว้เป็นชิปในกล่องพ้อม
     → ฉากถัดไปถ้าไม่ล้างก่อน จะเจนโดยใช้ ภาพฉากเก่า + รูปสินค้า ปนกัน = ภาพมั่ว */
  async function clearIngredients() {
    const box = () => document.querySelector('flow-base-prompt-box') || document.querySelector('flow-prompt-box') || document;
    for (let i = 0; i < 12 && chipCount() > 0; i++) {
      const chips = $$('flow-image-ingredient-chip, flow-ingredient-chip', box());
      const outer = chips.filter((c) => !chips.some((o) => o !== c && o.contains(c)));
      const target = outer[outer.length - 1];
      if (!target) break;
      const x = $$('button,[role=button]', target).find((b) => hasIcon(b, 'close') || /remove|ลบ|เอาออก/i.test(b.getAttribute('aria-label') || ''))
        || $$('button,[role=button]', target)[0];
      if (!x) break;
      try { await humanClick(x, 'เอาชิปรูปเดิมออก'); } catch (_) { break; }
      await sleep(300);
    }
    if (chipCount() > 0) say('   ⚠️ ยังมีรูปค้างในกล่องพ้อม ' + chipCount() + ' ใบ — ภาพอาจปนของฉากก่อน', 'warn');
  }

  async function attachOne(pickIdx) {
    const box = document.querySelector('flow-base-prompt-box') || document.querySelector('flow-prompt-box') || document;
    const add = $$('button', box).find((b) => /Add ingredients/i.test(b.getAttribute('aria-label') || ''))
      || byIcon($$('button', box), 'add');
    if (!add) { dumpCandidates('ปุ่มแนบ ref (add ในกล่องพ้อม)', $$('button', box)); return false; }
    await humanClick(add, 'เปิดเมนูแนบ ref');
    /* 🎯 เลือกด้วย "ชื่อไฟล์ของเราเอง" ไม่ใช่ลำดับ (owner: แนบแล้วตัวละครไม่ถูกใช้)
       ลำดับในเมนูสลับได้ตามเวลาอัปเสร็จ + ใบที่ยังอัปไม่เสร็จก็อยู่ในรายการ → เลือกตามลำดับ = ได้ผิดใบ/ใบที่ยังไม่พร้อม */
    const wantName = 'pd-product-' + (pickIdx + 1);
    const okItem = (x) => !x.querySelector('mat-progress-bar, mat-spinner, [role=progressbar], .mat-mdc-progress-bar, .mat-mdc-progress-spinner')
      && !!x.querySelector('img');
    const it = await waitFor(() => {
      const l = $$('flow-add-menu-asset-item').filter(okItem);
      return l.find((x) => norm(x).includes(wantName)) || null;
    }, 60000, 1000);
    if (!it) { dumpCandidates('รูป ' + wantName + ' ในเมนูแนบ', $$('flow-add-menu-asset-item')); await closeOverlay(); return false; }
    const chipsBefore = chipCount();
    await humanClick(it.querySelector('img, button, [role=button]') || it, 'เลือกรูป');
    /* ✅ Flow บางรุ่น "เลือกรูป = แนบเลย" ไม่มีปุ่มยืนยัน (owner 2026-09-09: log ฟ้อง "ไม่เจอปุ่มยืนยันแนบ" ทั้งที่รูปติดแล้ว)
       → เช็คชิปในกล่องพ้อมก่อน ถ้าเพิ่มแล้วถือว่าเสร็จ ไม่ต้องหาปุ่มยืนยัน (กันกดซ้ำ/แนบเกิน) */
    if (await waitFor(() => (chipCount() > chipsBefore ? true : null), 3500, 400)) { await closeOverlay(); return true; }
    // ③ ปุ่มยืนยัน — อยู่ใน detail pane · ข้อความโดนแปลถ้า UI เป็นไทย → หาแบบไม่พึ่งข้อความก่อน
    const pane = () => document.querySelector('flow-add-menu-detail-pane');
    const confirm = await waitFor(() => {
      const p2 = pane(); if (!p2) return null;
      const bs = $$('button', p2).filter((b) => !b.disabled);
      return bs.find((b) => /add to prompt|เพิ่ม|แนบ/i.test(norm(b))) || bs[bs.length - 1] || null;
    }, 6000, 300);
    if (!confirm) { dumpCandidates('ปุ่มยืนยันแนบ (Add to prompt)', $$('.cdk-overlay-pane button')); await closeOverlay(); return false; }
    const before = chipCount();
    await humanClick(confirm, 'Add to prompt');
    const ok = await waitFor(() => (chipCount() > before ? true : null), 8000, 400);
    if (!ok) await closeOverlay();
    return !!ok;
  }
  /*  รับได้ 2 แบบ: จำนวนใบ (0..n-1) หรือ "ลิสต์ลำดับใบที่จะแนบ" เช่น [0,2]
      (บางฉากอัปรูปเข้าคลังไว้เฉย ๆ แต่ไม่แนบ — เช่นฉากที่ไม่โชว์สินค้า) */
  async function attachIngredients(count) {
    const idxs = Array.isArray(count) ? count.slice() : Array.from({ length: Math.max(1, count || 1) }, (_, i) => i);
    const want = idxs.length;
    let n = 0;
    for (const i of idxs) {
      let ok = false;
      try { ok = await attachOne(i); } catch (e) { say('   ⚠️ แนบรูปใบ ' + (i + 1) + ' เออเรอร์: ' + ((e && e.message) || e), 'warn'); }
      if (ok) n++;
      await sleep(rand(500, 900));
    }
    // 🔍 เช็คของจริงจากจำนวนชิปในกล่องพ้อม — ไม่รายงานเกินความจริงอีก
    const real = chipCount();
    say(real ? ('   🧩 แนบรูป ref เข้ากล่องพ้อมแล้ว ' + real + '/' + want + ' ใบ (นับจากชิปในกล่องพ้อมจริง)')
      : '   ⚠️ แนบรูป ref ไม่ติดสักใบ — ภาพที่ได้อาจไม่ตรงสินค้า/นางแบบ', real ? 'ok' : 'warn');
    return real;
  }

  /* 🎥 ดึงคลิปออกจากหน้า Flow (จุดที่ขาดไปทั้งหมด — เจนได้แล้วแต่ไม่เคยเอาออกมา)
     ในหน้า Scene builder ตัวเล่นจะมี <video> ที่ src = "คลิปรวมทุกฉากในซีนนั้น" อยู่แล้ว
     → fetch ในหน้าเว็บ (คุกกี้ครบ) แล้วแปลงเป็น dataURL ส่งกลับให้แอปต่อ ffmpeg ตามปกติ */
  function blobToDataUrl(b) {
    return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result)); fr.onerror = rej; fr.readAsDataURL(b); });
  }
  /* 🚪 ออกจาก Scene builder กลับหน้าโปรเจ็ค
     สำคัญมากสำหรับ Footage/Podcast ที่เจนทีละฉากติด ๆ กันในแท็บเดียว:
     ถ้าค้างอยู่ในหน้าแก้ซีน กล่องพ้อมจะกลายเป็น "อธิบายวิธีแก้วิดีโอนี้"
     → ฉากถัดไปจะพิมพ์พ้อมลงช่องแก้คลิปเก่าแทนที่จะเจนคลิปใหม่ */
  const inScene = () => /\/(edit|scene)\//.test(location.href);
  async function leaveScene() {
    if (!inScene()) return true;
    const btns = $$('button,[role=button]');
    const done = btns.find((b) => (b.getAttribute('aria-label') || '') === 'Done editing scene')
      || btns.find((b) => /^(done|เสร็จสิ้น|เสร็จ)/i.test(norm(b)));
    const back = byIcon(btns, 'arrow_back');
    try { await humanClick(done || back, 'ออกจาก Scene builder'); }
    catch (_) { try { history.back(); } catch (_) {} }
    await waitFor(() => !inScene(), 20000, 700);
    await sleep(1500);
    return !inScene();
  }

  /* ⬇️ ดึงไฟล์คลิปของ "การ์ดที่เพิ่งเจนเสร็จ" ออกจากหน้า Flow
     ⚠️ จุดเสี่ยงที่ owner ทัก 2026-09-09 ("เผื่อมันโหลดคลิปซ้ำ หรือมั่ว"):
        การ์ดวิดีโอส่วนใหญ่โชว์แค่รูปปก ยังไม่มี <video> ในการ์ด
        ถ้าถอยไปอ่าน <video> ตัวไหนก็ได้บนหน้า = ได้ "คลิปฉากก่อนหน้าที่ค้างในตัวเล่น"
        → Footage ที่เจนทีละฉากติด ๆ กันจะได้คลิปซ้ำกันทุกฉาก
     กันไว้ 2 ชั้น: ① ไม่มี <video> ในการ์ด = เปิดการ์ดนั้นเข้า Scene builder ก่อน (ตัวเล่นจะโหลดคลิปของการ์ดนั้นจริง)
                    ② จำ URL ที่ส่งไปรอบก่อน — ได้ URL เดิมซ้ำ = ถือว่ายังไม่ใช่ของจริง รอจนเปลี่ยน */
  let _lastVideoSrc = '';
  async function grabVideo(tile) {
    const srcOf = (root) => {
      const v = (root || document).querySelector('video');
      if (!v) return '';
      return v.currentSrc || v.getAttribute('src') || (v.querySelector('source') && v.querySelector('source').getAttribute('src')) || '';
    };
    const fresh = () => {
      const u = srcOf(document.querySelector('flow-scene-editor-canvas')) || srcOf(document);
      return (u && u !== _lastVideoSrc) ? u : null;      // URL เดิมซ้ำ = คลิปเก่าค้างอยู่ในตัวเล่น
    };
    let src = tile ? srcOf(tile) : '';
    if (src && src === _lastVideoSrc) src = '';           // การ์ดคืน URL เดิม = ยังไม่ใช่ของใหม่
    if (!src && tile) {
      say('   🎬 เปิดคลิปที่เพิ่งเจนเพื่อดึงไฟล์ (กันหยิบคลิปฉากก่อนหน้า)...');
      try { await openScene(tile); } catch (_) {}
      src = await waitFor(fresh, 45000, 1000) || '';
    }
    if (!src) src = await waitFor(fresh, 20000, 1000) || '';
    if (!src) { say('   ⚠️ หา URL คลิปในหน้าไม่เจอ (หรือได้คลิปเดิมซ้ำ)', 'warn'); return { url: '', dataUrl: '' }; }
    _lastVideoSrc = src;
    /* ⚠️ owner 2026-09-09: fetch ในหน้าเว็บได้ "Failed to fetch" — คลิปอยู่คนละโดเมน (flow-content.google.com)
       content script โดน CORS บล็อก → ส่ง URL กลับให้ background โหลดแทน (มีสิทธิ์ข้ามโดเมนอยู่แล้ว
       และเป็นทางที่ Express ใช้อยู่ทุกวัน) · blob: โหลดในหน้าได้ ก็ทำในหน้าเลย */
    if (/^blob:/i.test(src)) {
      say('   ⬇️ กำลังดึงคลิปออกจากหน้า Flow...');
      try {
        const r = await fetch(src);
        const b = await r.blob();
        if (b.size >= 200000) { say('   ✅ ได้คลิปแล้ว ' + Math.round(b.size / 1024) + ' KB', 'ok'); return { url: '', dataUrl: await blobToDataUrl(b) }; }
      } catch (_) {}
    }
    say('   ⬇️ ส่งลิงก์คลิปให้แอปโหลด...');
    return { url: src, dataUrl: '' };
  }

  //   🖼️ URL รูปในการ์ด (ใช้ทำปกงานให้เหมือน Express — ปกต้องเป็น "ภาพที่เจนได้" ไม่ใช่รูปสินค้าที่แนบไป)
  function tileImageSrc(tile) {
    const im = tile && (tile.querySelector('img.thumbnail') || tile.querySelector('img'));
    return (im && (im.currentSrc || im.getAttribute('src'))) || '';
  }

  window.__pdMergeNew = {
    attachIngredients, clearIngredients, tileKeys, uploadViaMenu, openAddMenu, grabVideo, tileImageSrc, leaveScene, inScene, failedCard, deleteLastClip, ensureHistoryOpen, timelineClipEls,
    pickModelFamily, configure, currentSettings, imgModelRe, durOfModel, typePrompt, clearPrompt, generate, uploadRefs, fileInput, waitReady, ensureAgentOff,
    imageTiles, videoTiles, waitNewTile, waitNewTileSmart, failedGenCard, tileMenu, openScene, extendInfo, extendOnce,
    humanClick, waitFor, closeOverlay, promptBox, genBtn,
  };
  console.log('[PD App] flow-merge-new พร้อม (Merge สำหรับ Flow แอปใหม่)');
})();
