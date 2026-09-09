// =====================================================================
// PD Auto Flow Mini — Flow orchestrator (isolated world บน labs.google)
// Phase 3b: รับคำสั่งจาก panel → เจนภาพ cinematic + animate ทีละฉาก → คืนคลิป (base64)
//   bridge ไป flow-api.js (MAIN world) ผ่าน window.postMessage (pattern เดิมจาก PD Auto VIP)
// =====================================================================
(function () {
  'use strict';
  if (window.__pdMiniFlowInstalled__) return;
  window.__pdMiniFlowInstalled__ = true;

  // v0.6.1: กันรันซ้อน + หยุดทันที (แก้บั๊ก "หยุดไม่สนิทแล้วรันใหม่ → 2 orchestrator ตีกันบนหน้า Flow")
  //   _busy = มีงานรันอยู่ไหม (กันเริ่มงานที่ 2 พร้อมกัน) · _runSeq = เลขรอบ (งานเก่าถูก supersede แล้วถอย)
  //   window.__pdFootageStopNow__ = flag หยุดทันที (vip-engine อ่านได้ใน loop รอวิดีโอ 180 วิ → ไม่ต้องรอฉากจบ)
  let _busy = false;
  let _runSeq = 0;

  // ── Bridge: isolated → MAIN (PDFlowAPI) ──
  function callFlowAPI(fn, ...args) {
    return new Promise((resolve, reject) => {
      const id = 'pdm-' + Math.random().toString(36).slice(2);
      const handler = (e) => {
        if (e.source !== window) return;
        const d = e.data;
        if (!d || !d.__pdFlowAPIResult || d.id !== id) return;
        window.removeEventListener('message', handler);
        clearTimeout(toid);
        if (d.error) { const err = new Error(d.error); err.status = d.errorStatus; reject(err); }
        else resolve(d.result);
      };
      window.addEventListener('message', handler);
      const toid = setTimeout(() => {
        window.removeEventListener('message', handler);
        reject(new Error('callFlowAPI timeout: ' + fn));
      }, 180000);
      window.postMessage({ __pdFlowAPI: true, id, fn, args }, '*');
    });
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // ── Merge Mode: humanized session กัน 403 (คุยกับ service-worker CDP engine) ──
  //   ส่ง action ไป background; bg หา tabId จาก sender.tab.id เอง (content script ไม่รู้ tabId ตัวเอง)
  function cdpMsg(action, extra) {
    return new Promise((resolve) => {
      try { chrome.runtime.sendMessage(Object.assign({ action }, extra || {}), (r) => { void chrome.runtime.lastError; resolve(r); }); }
      catch (_) { resolve(null); }
    });
  }
  let _mergeOn = false;
  async function startMergeSession() {
    if (_mergeOn) return;
    const r = await cdpMsg('cdpAmbientStart');
    _mergeOn = !!(r && r.success);
    if (_mergeOn) {
      progress('🛡️ Merge Mode: เปิดเซสชันเลียนแบบคนจริง (กัน 403) — แถบ debugger จะค้างไว้ ปกติ');
      // คลิกจริงจุดปลอดภัย (ขอบซ้ายว่างๆ) ครั้งแรก เพื่อหว่านสัญญาณ "คนกดจริง" ให้ reCAPTCHA
      await safeHumanClick();
    }
  }
  async function stopMergeSession() {
    if (!_mergeOn) return;
    _mergeOn = false;
    await cdpMsg('cdpAmbientStop');
  }
  // คลิก humanized บนพิกัดที่ไม่โดนปุ่มอะไร (ขอบ viewport) — ได้ event คลิกจริงโดยไม่ไปกดอะไรเสีย
  async function safeHumanClick() {
    if (!_mergeOn) return;
    try {
      const y = Math.round(window.innerHeight * (0.3 + Math.random() * 0.4));
      const x = 4 + Math.round(Math.random() * 6); // ขอบซ้ายสุด ~4-10px = พื้นที่ว่าง ไม่มีปุ่ม
      await cdpMsg('cdpHumanClick', { x, y });
    } catch (_) {}
  }

  /* 🎨 โมเดลที่ผู้ใช้เลือกในบอท → ชื่อที่ Flow รู้จัก (ตารางเดียวกับ PD App)
     ⚠️ ก่อนหน้านี้ mini-flow ฝัง GEM_PIX_2 ไว้ตายตัว + ไม่ส่งโมเดลวิดีโอเลย
     = ผู้ใช้เลือกโมเดลอะไรก็ได้อย่างเดียว (owner 2026-09-09) */
  const IMG_MODEL = { nano_banana_2: 'NARWHAL', nano_banana_pro: 'GEM_PIX_2', imagen_4: 'IMAGEN_4' };
  const I2V_MODEL = {
    veo_lite_lower: 'veo_3_1_i2v_lite_low_priority',   // ฟรี 0 เครดิต
    veo_lite: 'veo_3_1_i2v_lite',
    veo_fast: 'veo_3_1_i2v_s_fast_portrait_ultra',
    omni_flash_4s: 'abra_i2v_4s',
    omni_flash_6s: 'abra_i2v_6s',
    omni_flash: 'abra_i2v_8s',
    omni_flash_10s: 'abra_i2v_10s',
  };
  //   Omni Flash เลือกจำนวนวินาทีได้ (4/6/8/10) → แปลงเป็นคีย์ย่อยก่อน
  function pdVideoModelKey(req) {
    let k = (req && req.videoModel) || 'veo_lite_lower';
    if (k === 'omni_flash') {
      const sec = parseInt((req && req.maxClipSec) || 8, 10);
      k = sec === 10 ? 'omni_flash_10s' : sec === 6 ? 'omni_flash_6s' : sec === 4 ? 'omni_flash_4s' : 'omni_flash';
    }
    return I2V_MODEL[k] || I2V_MODEL.veo_lite_lower;
  }

  const ASPECT_IMG = { '9:16': 'IMAGE_ASPECT_RATIO_PORTRAIT', '16:9': 'IMAGE_ASPECT_RATIO_LANDSCAPE', '1:1': 'IMAGE_ASPECT_RATIO_SQUARE' };
  const ASPECT_VID = { '9:16': 'VIDEO_ASPECT_RATIO_PORTRAIT', '16:9': 'VIDEO_ASPECT_RATIO_LANDSCAPE', '1:1': 'VIDEO_ASPECT_RATIO_SQUARE' };

  // ── ม่านทำงานบนหน้า Flow (glassmorphism ส้ม-ดำ) ──
  function ensureOverlay() {
    let el = document.getElementById('pd-mini-overlay');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'pd-mini-overlay';
    el.innerHTML =
      '<div class="pdm-card">' +
        '<div class="pdm-spin"></div>' +
        '<div class="pdm-brand">PD AUTO <span>FOOTAGE</span></div>' +
        '<div class="pdm-step" id="pdm-step">กำลังเริ่ม...</div>' +
        '<div class="pdm-warn">⚠️ บอทกำลังสร้างคลิป — อย่าปิดแท็บนี้</div>' +
      '</div>';
    const css = document.createElement('style');
    css.textContent =
      '#pd-mini-overlay{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;' +
      'background:rgba(9,9,11,0.78);backdrop-filter:blur(7px);font-family:Segoe UI,Tahoma,sans-serif;}' +
      '#pd-mini-overlay .pdm-card{background:rgba(17,17,20,0.92);border:1px solid rgba(245,158,11,0.4);border-radius:20px;' +
      'padding:30px 40px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.6),0 0 40px rgba(245,158,11,0.18);position:relative;overflow:hidden;}' +
      '#pd-mini-overlay .pdm-card::before{content:"";position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#f59e0b 30%,#f5c842 70%,transparent);}' +
      '#pd-mini-overlay .pdm-spin{width:46px;height:46px;margin:0 auto 14px;border-radius:50%;border:4px solid rgba(245,158,11,0.18);border-top-color:#f59e0b;animation:pdmSpin 0.9s linear infinite;}' +
      '@keyframes pdmSpin{to{transform:rotate(360deg)}}' +
      '#pd-mini-overlay .pdm-brand{font-size:15px;font-weight:800;letter-spacing:1.5px;color:#ececf0;}' +
      '#pd-mini-overlay .pdm-brand span{background:linear-gradient(90deg,#f59e0b,#f5c842);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;}' +
      '#pd-mini-overlay .pdm-step{font-size:13px;font-weight:700;color:#f59e0b;margin-top:8px;min-height:18px;}' +
      '#pd-mini-overlay .pdm-warn{font-size:11px;color:#8b8b96;margin-top:12px;}';
    el.appendChild(css);
    (document.body || document.documentElement).appendChild(el);
    return el;
  }
  function showOverlay(text) { const el = ensureOverlay(); el.style.display = 'flex'; const s = el.querySelector('#pdm-step'); if (s && text) s.textContent = text; }
  function hideOverlay() { const el = document.getElementById('pd-mini-overlay'); if (el) el.style.display = 'none'; }

  function progress(text) {
    try { chrome.runtime.sendMessage({ action: 'miniFlowProgress', text }); } catch (e) {}
    try { showOverlay(text); } catch (e) {}
  }

  // รอ PDFlowAPI พร้อม (จับ auth header จาก fetch แรกของ Flow)
  async function waitFlowReady(timeoutMs) {
    const start = Date.now();
    while (Date.now() - start < (timeoutMs || 60000)) {
      try { if (await callFlowAPI('isReady')) return true; } catch (e) {}
      await sleep(1500);
    }
    throw new Error('Flow ยังไม่พร้อม (auth ไม่ถูกจับ) — เปิดหน้า labs.google/fx/tools/flow ค้างไว้ แล้วลองใหม่');
  }

  // โหลดวิดีโอ media → base64
  // ⚠️ บทเรียนจาก VIP: getMediaUrlRedirect 302 → CDN (flow-content.google) ที่ไม่มี CORS headers
  //   ใส่ credentials:'include' = browser reject cross-origin redirect ด้วย "Failed to fetch"
  //   → ต้อง fetch relative URL บน labs.google origin + ไม่ใส่ credentials (ใช้ session cookie อัตโนมัติ)
  const PD_NEW_APP = /(^|\.)flow\.google\.com$/i.test(location.hostname);   // 🌐 Flow แอปใหม่
  async function fetchVideoBase64(mediaId) {
    /* 🌐 แอปใหม่ไม่มี path /fx/api/trpc/... — ต้องถาม URL ไฟล์จริงจาก API แล้วให้ background โหลด (ข้ามโดเมน = CORS) */
    if (PD_NEW_APP) {
      const url = await callFlowAPI('getMediaUrlRedirect', mediaId);
      const r = await new Promise((res) => { try { chrome.runtime.sendMessage({ action: 'pdFetchMediaB64', url }, (x) => res(x || null)); } catch (_) { res(null); } });
      if (!r || !r.success) throw new Error('โหลดวิดีโอไม่สำเร็จ: ' + ((r && r.error) || 'background ไม่ตอบ'));
      return r.dataUrl;
    }
    const trpcUrl = '/fx/api/trpc/media.getMediaUrlRedirect?name=' + encodeURIComponent(mediaId);
    const res = await fetch(trpcUrl, { method: 'GET' }); // ❌ ห้าม credentials:'include'
    if (!res.ok) throw new Error('โหลดวิดีโอ status=' + res.status);
    const blob = await res.blob();
    if (!blob || blob.size < 50 * 1024) throw new Error('คลิปเล็กผิดปกติ (' + (blob ? blob.size : 0) + ' bytes)');
    return await new Promise((resolve) => {
      const fr = new FileReader();
      fr.onloadend = () => resolve(fr.result);
      fr.readAsDataURL(blob);
    });
  }

  // base64 dataURL → Blob (สำหรับ uploadImage)
  function dataUrlToBlob(dataUrl) {
    const [head, b64] = dataUrl.split(',');
    const mime = (head.match(/data:([^;]+)/) || [])[1] || 'image/png';
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  // ── เจน 1 คลิปต่อ 1 ฉาก: image (แนบ ref สินค้า) → animate → poll → fetch ──
  async function generateOneScene(ctx, scene, sceneIdx) {
    const aspectImg = ASPECT_IMG[ctx.aspect] || ASPECT_IMG['9:16'];
    const aspectVid = ASPECT_VID[ctx.aspect] || ASPECT_VID['9:16'];

    progress(`ฉาก ${sceneIdx + 1}: สร้างภาพ...`);
    // 🔑 แนบรูปสินค้าเป็น reference (ถ้ามี) + ล็อกพรอมต์ห้ามออกแบบสินค้าใหม่
    let imgPrompt = scene.imagePrompt;
    const refUUIDs = [];
    // v0.2: แนบ ref สินค้าเฉพาะฉากที่โชว์สินค้า (showProduct) — ฉาก hook/ปัญหาที่ยังไม่มีสินค้า = ไม่แนบ
    const showProd = scene.showProduct !== false;
    if (ctx.productRefId && showProd) {
      refUUIDs.push(ctx.productRefId);
      imgPrompt += ' ⚠️ MANDATORY PRODUCT ACCURACY: Use the EXACT product from the attached product reference image — identical packaging, label, brand, all text, color, shape, design. Do NOT redesign, do NOT invent a different product, do NOT alter the label. Only the scene/background/angle changes around this exact product.';
    }
    // v0.2: แนบตัวละครหลักเป็น ref (ถ้ามี) + lock ให้เป็นคนเดิมทุกฉาก (เลียนแบบ PD Auto VIP)
    if (ctx.characterRefId) {
      refUUIDs.push(ctx.characterRefId);
      imgPrompt += ' ⚠️ MANDATORY: The person in the scene MUST be the SAME person as shown in the attached character reference image — same face, hairstyle, gender, body. Do NOT change the person, do NOT change gender. The character does NOT speak (mouth closed or natural smile, no lip movement).';
    }
    const imgRes = await callFlowAPI('generateImage', {
      projectId: ctx.projectId,
      sessionId: ctx.sessionId,
      prompt: imgPrompt,
      refUUIDs: refUUIDs,
      imageModelName: ctx.imageModelName || 'GEM_PIX_2',   // 🎨 ตามที่ผู้ใช้เลือก (default = Nano Banana Pro)
      aspectRatio: aspectImg,
    });
    const imgMedia = imgRes.media && imgRes.media[0];
    if (!imgMedia || !imgMedia.name) throw new Error('ฉาก ' + (sceneIdx + 1) + ': ภาพไม่สำเร็จ');

    progress(`ฉาก ${sceneIdx + 1}: ทำให้เคลื่อนไหว (animate)...`);
    const vidRes = await callFlowAPI('animateImage', {
      projectId: ctx.projectId,
      sessionId: ctx.sessionId,
      prompt: scene.videoPrompt, // ฟุตเทจ ไม่มีคนพูด (lock ใน prompt แล้ว)
      imageMediaId: imgMedia.name,
      aspectRatio: aspectVid,
      videoModelKey: ctx.videoModelKey,   // 🎬 โมเดลวิดีโอ + ความยาวตามที่ผู้ใช้เลือก
    });
    const vidMedia = vidRes.media && vidRes.media[0];
    if (!vidMedia || !vidMedia.name) throw new Error('ฉาก ' + (sceneIdx + 1) + ': animate ไม่สำเร็จ');

    progress(`ฉาก ${sceneIdx + 1}: รอ Flow เรนเดอร์คลิป...`);
    await callFlowAPI('waitForVideo', {
      projectId: ctx.projectId,
      mediaId: vidMedia.name,
      intervalMs: 4000,
      timeoutMs: 8 * 60 * 1000,
    });

    progress(`ฉาก ${sceneIdx + 1}: ดาวน์โหลดคลิป...`);
    // retry การโหลดไฟล์เอง 3 ครั้ง (network สะดุด / CDN ยังไม่พร้อม)
    let base64 = '';
    let dlErr = '';
    for (let d = 1; d <= 3; d++) {
      try {
        base64 = await fetchVideoBase64(vidMedia.name);
        if (base64 && base64.length > 50000) break; // ได้ไฟล์จริง
        dlErr = 'ไฟล์เล็กผิดปกติ';
      } catch (e) { dlErr = e.message; }
      if (d < 3) { progress(`ฉาก ${sceneIdx + 1}: โหลดซ้ำ ${d + 1}/3...`); await sleep(3000); }
    }
    if (!base64 || base64.length <= 50000) throw new Error('ดาวน์โหลดคลิปไม่สำเร็จ: ' + dlErr);
    return base64;
  }

  // ── เจน 1 ฉาก พร้อม retry อัจฉริยะ (แยกประเภทเฟล → พักให้เหมาะ) ──
  const MAX_SCENE_RETRIES = 6;
  // 403/reCAPTCHA: พักขั้นบันไดยาว (score ต้องใช้เวลาฟื้น เหมือน VIP merge) 30→60→90→120→180 วิ
  const COOLDOWN_403 = [30000, 60000, 90000, 120000, 180000];
  // เฟลชั่วคราว (network/timeout/5xx): พักสั้น
  const COOLDOWN_SOFT = [4000, 8000, 15000, 25000, 40000];

  // จำแนกประเภท error
  function classifyError(e) {
    const msg = (e && e.message || '').toLowerCase();
    const status = e && e.status;
    if (status === 403 || /403|recaptcha|unusual activity|forbidden|permission/i.test(msg)) return 'block403';
    if (status === 429 || /429|resource_exhausted|quota|rate/i.test(msg)) return 'rate';
    // content policy / Flow ปฏิเสธ → ไม่ retry (ลองกี่ครั้งก็ไม่ผ่าน)
    if (/safety|policy|blocked|rejected|ปฏิเสธ|violat/i.test(msg)) return 'hardreject';
    return 'soft';
  }

  async function chunkSleep(ms) {
    // พักแบบเช็คได้ — ขยับ progress ทุก 5 วิ (ให้ user เห็นว่ายังทำงาน)
    const start = Date.now();
    while (Date.now() - start < ms) {
      if (window.__pdFootageStopNow__) return; // v0.6.1: หยุดทันที — ไม่พักต่อ
      await sleep(Math.min(5000, ms - (Date.now() - start)));
    }
  }

  async function generateSceneWithRetry(ctx, scene, sceneIdx) {
    let lastErr = '';
    for (let attempt = 1; attempt <= MAX_SCENE_RETRIES; attempt++) {
      if (window.__pdFootageStopNow__) throw new Error('หยุดโดยผู้ใช้'); // v0.6.1: หยุดทันที — ไม่ retry ต่อ
      try {
        return await generateOneScene(ctx, scene, sceneIdx);
      } catch (e) {
        lastErr = e.message || String(e);
        const kind = classifyError(e);

        if (kind === 'hardreject') {
          // Flow ปฏิเสธเนื้อหา → ไม่มีทางผ่าน ข้ามทันที
          throw new Error(`ฉาก ${sceneIdx + 1} ถูก Flow ปฏิเสธ (เนื้อหา): ${lastErr}`);
        }
        if (attempt >= MAX_SCENE_RETRIES) break;

        let cd, label;
        if (kind === 'block403' || kind === 'rate') {
          cd = COOLDOWN_403[Math.min(attempt - 1, COOLDOWN_403.length - 1)];
          label = kind === 'block403' ? '🛡️ ติด 403/reCAPTCHA' : '⏳ โดนจำกัดอัตรา';
        } else {
          cd = COOLDOWN_SOFT[Math.min(attempt - 1, COOLDOWN_SOFT.length - 1)];
          label = '⚠️ เฟลชั่วคราว';
        }
        const cdLabel = cd >= 60000 ? `${Math.round(cd / 60000)} นาที` : `${Math.round(cd / 1000)} วิ`;
        progress(`ฉาก ${sceneIdx + 1}: ${label} — พัก ${cdLabel} แล้วลองใหม่ (${attempt + 1}/${MAX_SCENE_RETRIES})`);
        await chunkSleep(cd);

        // เชื่อมต่อหลุด → จับ auth ใหม่ก่อน retry
        if (kind === 'soft' && /timeout|auth|fetch|เชื่อมต่อ/i.test(lastErr)) {
          try { await waitFlowReady(30000); } catch (_) {}
        }
      }
    }
    throw new Error(`ฉาก ${sceneIdx + 1} เฟลครบ ${MAX_SCENE_RETRIES} ครั้ง: ${lastErr}`);
  }

  // ── เจนครบทุกฉากของ 1 สินค้า ──
  async function generateProductClips(req, myRun) {
    await waitFlowReady(60000);

    // 🛡️ Merge Mode: เปิด humanized session ก่อนเริ่มยิง API (ลด 403)
    if (req.mergeMode) { try { await startMergeSession(); } catch (e) {} }

    progress('เตรียมโปรเจค Flow...');
    /* 🌐 Flow แอปใหม่: คำสั่งทุกอย่าง (อัปรูป/เจนภาพ) ต้องยิงจาก "หน้าโปรเจ็ค" เท่านั้น
       (owner 2026-09-09: ค้างอยู่หน้าแรก flow.google.com → อัปรูป ref ไม่สำเร็จทุกครั้ง)
       → panel จะสร้างโปรเจ็ค + พาแท็บเข้าหน้าโปรเจ็คก่อน แล้วส่ง projectId มาให้ใช้ซ้ำ */
    const proj = (req && req.projectId)
      ? { projectId: req.projectId, agentSessionId: req.sessionId || null }
      : await callFlowAPI('createProject');
    const ctx = {
      projectId: proj.projectId, sessionId: proj.agentSessionId, aspect: req.aspect,
      //   🎨🎬 โมเดลที่ผู้ใช้เลือก — เก็บไว้ใน ctx เพราะตัวเจนรายฉากไม่เห็น req
      imageModelName: IMG_MODEL[req && req.imageModel] || 'GEM_PIX_2',
      videoModelKey: pdVideoModelKey(req),
    };
    // ปิด Flow Agent panel (กัน UI เพี้ยน — ของจริงไม่กระทบ API แต่กันเหนียว)
    try { await callFlowAPI('setAgentToggle', proj.projectId, false); } catch (e) {}

    // 🔑 อัปโหลดรูปสินค้าเป็น reference ครั้งเดียว → ใช้ทุกฉาก (กันคลิปออกมาไม่ตรงสินค้า)
    if (req.productImage) {
      try {
        progress('อัปโหลดรูปสินค้าเป็น ref...');
        const blob = dataUrlToBlob(req.productImage);
        const media = await callFlowAPI('uploadImage', {
          projectId: proj.projectId,
          fileBlob: blob,
          fileName: 'product-ref.png',
          mimeType: blob.type,
        });
        if (media && media.name) {
          ctx.productRefId = media.name;
          progress('✓ แนบรูปสินค้าแล้ว — ทุกฉากจะใช้สินค้าตัวนี้');
        }
      } catch (e) {
        progress('⚠️ อัปโหลดรูปสินค้าไม่สำเร็จ: ' + ((e && e.message) || e) + ' — สร้างจากข้อความล้วน (อาจไม่ตรงสินค้า)');
      }
    }

    // v0.2: 🧑 อัปโหลดรูปตัวละครหลักเป็น reference ครั้งเดียว → ใช้ทุกฉาก (พรีเซนเตอร์คนเดิม)
    if (req.characterImage) {
      try {
        progress('อัปโหลดรูปตัวละครหลักเป็น ref...');
        const cblob = dataUrlToBlob(req.characterImage);
        const cmedia = await callFlowAPI('uploadImage', {
          projectId: proj.projectId,
          fileBlob: cblob,
          fileName: 'character-ref.png',
          mimeType: cblob.type,
        });
        if (cmedia && cmedia.name) {
          ctx.characterRefId = cmedia.name;
          progress('✓ แนบรูปตัวละครแล้ว — ทุกฉากจะใช้คนเดิม');
        }
      } catch (e) {
        progress('⚠️ อัปโหลดรูปตัวละครไม่สำเร็จ: ' + ((e && e.message) || e));
      }
    }

    const clips = [];
    let consecutiveFails = 0; // circuit breaker — เฟลติดกันหลายฉาก = หยุด (กัน loop เปล่า/โดนบล็อค)
    try {
      for (let i = 0; i < req.scenes.length; i++) {
        // เช็คสัญญาณหยุด — v0.6.1: หยุดทันที (in-memory) + supersede (มีรอบใหม่กว่า) + storage flag เดิม
        if (window.__pdFootageStopNow__ || myRun !== _runSeq) { progress('⏹️ หยุดโดยผู้ใช้'); break; }
        const stopChk = await chrome.storage.local.get('pdFootageStop');
        if (stopChk && stopChk.pdFootageStop) { progress('⏹️ หยุดโดยผู้ใช้'); break; }
        // คลิกจริงจุดปลอดภัยก่อนเจนแต่ละฉาก (ต่อสัญญาณ "คนกดจริง" ให้ reCAPTCHA ตลอด session)
        if (_mergeOn) { await safeHumanClick(); }
        try {
          const b64 = await generateSceneWithRetry(ctx, req.scenes[i], i);
          clips.push(b64);
          consecutiveFails = 0;
        } catch (sceneErr) {
          consecutiveFails++;
          progress(`⚠️ ฉาก ${i + 1} ข้าม (${sceneErr.message})`);
          if (consecutiveFails >= 3) {
            throw new Error('เฟลติดกัน 3 ฉาก — หยุด (อาจโดน Flow บล็อคชั่วคราว ลองใหม่ภายหลัง)');
          }
          // ข้ามฉากนี้ ทำฉากต่อไป (ถ้าได้คลิปบางส่วนยังเอาไปรวมได้)
        }
      }
    } finally {
      // ลบโปรเจคทิ้งเสมอ (สำเร็จหรือเฟล) — ไม่ให้รก
      try { await callFlowAPI('deleteProject', proj.projectId); } catch (e) {}
      // ปิด humanized session + detach debugger (แถบ yellow bar หาย)
      try { await stopMergeSession(); } catch (e) {}
      hideOverlay();
    }
    if (clips.length === 0) throw new Error('ไม่ได้คลิปเลย — ลองใหม่ภายหลัง');
    return clips;
  }

  // ── Message handler ──
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'miniFlowPing') { sendResponse({ ok: true }); return true; }
    /*  🆕 สร้างโปรเจ็คอย่างเดียว — panel เอา id ไปเปิดหน้าโปรเจ็คก่อนเริ่มงาน (จำเป็นสำหรับ Flow แอปใหม่) */
    if (message.action === 'miniFlowNewProject') {
      (async () => {
        try {
          await waitFlowReady(60000);
          const pj = await callFlowAPI('createProject');
          sendResponse({ success: true, projectId: pj && (pj.projectId || pj.id), sessionId: pj && pj.agentSessionId });
        } catch (e) { sendResponse({ success: false, error: (e && e.message) || String(e) }); }
      })();
      return true;
    }
    if (message.action === 'pdHideCurtain') { // v0.3.1: panel สั่งปิดม่าน (จบงาน/หยุด)
      try { chrome.storage.local.remove('pdFootageRunning'); } catch (e) {}
      try { hideOverlay(); } catch (e) {}
      sendResponse({ ok: true }); return true;
    }
    if (message.action === 'pdFootageStopNow') { // v0.6.1: หยุด "ทันที" — loop รอวิดีโอ/retry/พัก เห็น flag ภายใน ~2 วิ
      window.__pdFootageStopNow__ = true;
      sendResponse({ ok: true }); return true;
    }
    if (message.action === 'pdFootageResetStop') { // v0.6.1: เริ่มงานใหม่ (Merge path) → เคลียร์ flag หยุด ไม่งั้นฉากแรกจะถูกยกเลิกทันที
      window.__pdFootageStopNow__ = false;
      sendResponse({ ok: true }); return true;
    }
    if (message.action === 'miniFlowGenerate') {
      // v0.6.1: กันรันซ้อน — งานเก่ายังไม่จบ ห้ามเริ่มใหม่ (กัน 2 orchestrator ตีกันบนหน้า Flow → นับการ์ดมั่ว/timeout เก๊)
      if (_busy) {
        sendResponse({ success: false, error: 'BUSY: มีงานเดิมยังรันอยู่บนหน้า Flow — กดหยุดแล้วรอ 3 วิ หรือรีเฟรชหน้า Flow ก่อนรันใหม่' });
        return true;
      }
      (async () => {
        _busy = true;
        window.__pdFootageStopNow__ = false; // เริ่มงานใหม่ = เคลียร์ flag หยุด
        const myRun = ++_runSeq;
        try {
          const clips = await generateProductClips(message.req, myRun);
          // คลิป base64 อาจใหญ่ → เซฟ storage ทีละสินค้า เลี่ยง message ก้อนยักษ์
          const key = 'pdMiniClips_' + (message.req.tag || Date.now());
          await chrome.storage.local.set({ [key]: { ts: Date.now(), clips } });
          sendResponse({ success: true, key, count: clips.length });
        } catch (e) {
          console.error('[PD Mini Flow]', e);
          try { await stopMergeSession(); } catch (_) {}
          try { hideOverlay(); } catch (_) {}
          sendResponse({ success: false, error: e.message });
        } finally {
          _busy = false; // ปลดล็อก — รันใหม่ได้
        }
      })();
      return true;
    }
  });

  // v0.3.1: ม่าน auto-reshow — ถ้า panel ยังรัน (api mode) แล้วหน้า Flow โหลด/รีเฟรช → โชว์ม่านทันที กันดูเหมือนหยุด
  try {
    chrome.storage.local.get(['pdFootageRunning'], (r) => {
      if (r && r.pdFootageRunning === 'api') { try { showOverlay('🎬 บอทกำลังทำงาน...'); } catch (e) {} }
    });
  } catch (e) {}

  console.log('[PD Mini Flow] orchestrator ready');
})();
