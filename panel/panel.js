// =====================================================================
// PD Auto Flow Mini — Panel UI (v0.1 skeleton)
//
// หลักโค้ดสะอาดของโปรเจ็คนี้:
//  - state เดียว + render จาก state เสมอ (ไม่จิ้ม DOM กระจัดกระจาย)
//  - logic ธุรกิจแยกไฟล์ (จะ port จาก PD Auto VIP เป็น module ทีละชิ้น)
//  - ทุกฟีเจอร์มีจุดเสียบชัดเจน (ดู TODO ระบุ source ที่จะ port)
//
// v0.1 = UI ทำงานครบ (เลือก/ตั้งค่า/สรุป/log) แต่ปุ่มรันยังเป็น stub
// ⚠️ ยังไม่ใส่ license lock (user สั่งข้ามไว้ก่อน — เทสให้เสร็จก่อน)
// =====================================================================
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);

  // ── เสียงพากย์ (Gemini TTS prebuilt voices ที่เหมาะกับงานโฆษณาไทย) ──
  // TODO(Phase 3): ปุ่มฟัง = เรียก Gemini TTS จริงด้วยประโยคตัวอย่าง + cache
  const VOICES = [
    { id: 'charon',  icon: '🎙️', name: 'เสียงโฆษณาชาย — ทุ้มลึก',   desc: 'น่าเชื่อถือ เหมาะสินค้าจริงจัง/พรีเมียม' },
    { id: 'kore',    icon: '🎙️', name: 'เสียงโฆษณาหญิง — มั่นใจ',   desc: 'ชัดถ้อยชัดคำ เหมาะขายตรง CTA แรง' },
    { id: 'aoede',   icon: '🌸', name: 'หญิงนุ่มนวล',               desc: 'อบอุ่น เหมาะสกินแคร์/ของใช้ในบ้าน' },
    { id: 'puck',    icon: '😄', name: 'ชายเป็นกันเอง',             desc: 'สบายๆ เหมือนเพื่อนแนะนำ เหมาะของกิน/แกดเจ็ต' },
  ];

  // ── State ────────────────────────────────────────────────────────
  const state = {
    products: [],            // [{ id, name, image(base64), productId, basketName }]
    voice: 'charon',
    subStyle: 'tiktok_bold',
    hwOverlay: false,        // ✍️ กราฟิกลายมือ (Handwritten Overlay) — ต่อท้ายทุกพรอมต์วิดีโอ
    running: false,
    // v0.2: ตัวละครหลัก (ออปชัน) — ใช้กับทุกสินค้า
    character: { enabled: false, image: '', gender: 'female', desc: '' },
  };

  // v0.2: คืนข้อมูลตัวละคร ถ้าเปิดใช้ + มีรูป (ไม่งั้น null = โหมดฟุตเทจไม่มีคน เหมือนเดิม)
  function getCharacterOpt() {
    const c = state.character;
    return (c.enabled && c.image) ? { gender: c.gender || '', desc: (c.desc || '').trim() } : null;
  }

  // v0.5: ระบบเสียงพากย์ — gemini (สำเร็จรูป) หรือ voiceclone (เสียงโคลนลูกค้าเอง)
  //   ⚠️ เปลี่ยน tunnel/โดเมน VoiceClone → แก้ที่เดียวตรงนี้ (+ host_permissions ใน manifest ถ้าเปลี่ยนโดเมน)
  const DEFAULT_VC_SERVER = 'https://app.pd-voiceclone.com';
  function getTtsProvider() { return $('ttsProvider') ? $('ttsProvider').value : 'gemini'; }
  function getVoiceCloneCfg() {
    return {
      serverUrl: DEFAULT_VC_SERVER, // ฝังไว้ — เว็บเดียวกันหมด ลูกค้าต่างกันแค่ key
      apiKey: ($('vcApiKey') ? $('vcApiKey').value : '').trim(),
      speed: parseFloat($('voiceSpeed').value) || 1.0,
      language: 'th',
    };
  }
  // dispatcher — พากย์ 1 ประโยคตาม provider ที่เลือก → { blob, durationSec }
  async function synthVoice(text) {
    if (getTtsProvider() === 'voiceclone') {
      return window.PDMiniTTS.synthesizeClone(text, getVoiceCloneCfg());
    }
    return window.PDMiniTTS.synthesize(text, state.voice, $('apiKeyInput').value.trim());
  }

  // ── Init ─────────────────────────────────────────────────────────
  function init() {
    renderVoices();
    bindEvents();
    restoreSettings();
    updateSummary();
    // โชว์เวอร์ชันที่ pill + ช่องตั้งค่า
    $('licensePill').textContent = 'v' + CURRENT_VERSION;
    if ($('appVersion')) $('appVersion').textContent = CURRENT_VERSION;
    // เช็คอัปเดตจาก GitHub (เงียบๆ ไม่บล็อค)
    checkForUpdate();
  }

  // ════════════════════════════════════════════════════════════════
  // 🔄 Auto Update Check — เช็คเวอร์ชันใหม่จาก GitHub (เหมือนบอทหลัก VIP)
  //   Chrome โหลด unpacked อัปเดตเองอัตโนมัติไม่ได้ → บอทแจ้ง + ปุ่มโหลด 1 คลิก
  //   ⚠️ แก้ GITHUB_REPO ให้ตรงกับ repo ที่สร้าง (owner/ชื่อ-repo)
  // ════════════════════════════════════════════════════════════════
  const CURRENT_VERSION = (chrome.runtime && chrome.runtime.getManifest)
    ? chrome.runtime.getManifest().version : '0.1.0';
  const GITHUB_REPO = 'spsocial/PD-Auto-Footage'; // ⚠️ เปลี่ยนให้ตรง repo จริง
  const VERSION_CHECK_URL = 'https://raw.githubusercontent.com/' + GITHUB_REPO + '/main/version.json';

  function isNewerVersion(latest, current) {
    const l = String(latest).split('.').map(Number);
    const c = String(current).split('.').map(Number);
    for (let i = 0; i < Math.max(l.length, c.length); i++) {
      const lv = l[i] || 0, cv = c[i] || 0;
      if (lv > cv) return true;
      if (lv < cv) return false;
    }
    return false;
  }

  async function checkForUpdate(manual) {
    const resEl = $('updateCheckResult');
    if (manual && resEl) resEl.innerHTML = '<span style="color:#a1a1aa">⏳ กำลังเช็ค...</span>';
    try {
      const resp = await fetch(VERSION_CHECK_URL + '?t=' + Date.now(), { cache: 'no-store' });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const data = await resp.json();
      const latest = data.latest || data.version;
      const downloadUrl = data.downloadUrl || '';
      const changelog = data.changelog || '';
      // ประวัติเวอร์ชัน
      if (data.versions && $('versionHistory')) {
        $('versionHistory').innerHTML = data.versions.slice(0, 5)
          .map((v) => '• <b>v' + (v.version || v.v) + '</b> ' + (v.note || v.changelog || '')).join('<br>');
      }
      if (latest && isNewerVersion(latest, CURRENT_VERSION)) {
        if (resEl) resEl.innerHTML = '<span style="color:#fcd34d">🆕 มี v' + latest + ' แล้ว!</span>';
        showUpdateBanner(latest, changelog, downloadUrl);
      } else {
        if (resEl) resEl.innerHTML = '<span style="color:#4ade80">✅ ล่าสุดแล้ว</span>';
      }
    } catch (e) {
      if (manual && resEl) resEl.innerHTML = '<span style="color:#f87171">❌ เช็คไม่ได้ (เน็ต/repo?)</span>';
      console.log('[Update] check failed:', e.message);
    }
  }

  function showUpdateBanner(version, changelog, downloadUrl) {
    const b = $('updateBanner');
    if (!b) return;
    $('ubTitle').textContent = '🆕 เวอร์ชันใหม่ v' + version + ' พร้อมแล้ว!';
    $('ubSub').textContent = (changelog || 'กดโหลดเพื่ออัปเดต').replace(/\n/g, ' · ');
    b.style.display = 'flex';
    // pill แดงๆ คลิกได้
    const pill = $('licensePill');
    if (pill) { pill.textContent = '🆕 v' + version; pill.classList.add('update'); pill.onclick = () => b.scrollIntoView({ behavior: 'smooth' }); }
    // v0.6.3: จุดแดงบนปุ่มเฟือง ⚙️ — คนใหม่เห็นชัดว่ามีอัปเดต (กดเข้าไปดู/โหลดในตั้งค่า)
    try { const sb = $('settingsBtn'); if (sb) { sb.classList.add('has-update'); sb.title = '🆕 มีเวอร์ชันใหม่ v' + version + ' — กดดู'; } } catch (_) {}
    const dl = $('ubDownload');
    dl.onclick = () => {
      if (downloadUrl) chrome.tabs.create({ url: downloadUrl });
      else chrome.tabs.create({ url: 'https://github.com/' + GITHUB_REPO + '/releases/latest' });
    };
    $('ubClose').onclick = () => { b.style.display = 'none'; };
  }

  // ── ① สินค้า ─────────────────────────────────────────────────────
  function renderProducts() {
    const grid = $('productGrid');
    grid.querySelectorAll('.product-card').forEach((el) => el.remove());
    $('productEmpty').style.display = state.products.length ? 'none' : 'block';
    $('productTools').style.display = state.products.length ? 'flex' : 'none';
    $('productCount').textContent = state.products.length + '/10';

    state.products.forEach((p) => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.title = p.name + ' — กดเพื่อเอาออก';
      card.innerHTML =
        (p.image ? '<img src="' + p.image + '" alt="">' : '') +
        '<span class="pname">' + escapeHtml(p.name || '') + '</span>';
      card.addEventListener('click', () => {
        state.products = state.products.filter((x) => x.id !== p.id);
        renderProducts();
        updateSummary();
      });
      grid.appendChild(card);
    });
  }

  // ── ③ เสียง ──────────────────────────────────────────────────────
  function renderVoices() {
    const list = $('voiceList');
    list.innerHTML = '';
    VOICES.forEach((v) => {
      const item = document.createElement('div');
      item.className = 'voice-item' + (state.voice === v.id ? ' selected' : '');
      item.innerHTML =
        '<span class="v-icon">' + v.icon + '</span>' +
        '<div class="v-info"><div class="v-name">' + v.name + '</div>' +
        '<div class="v-desc">' + v.desc + '</div></div>' +
        '<button class="voice-play" data-voice="' + v.id + '">▶ ฟัง</button>';
      item.addEventListener('click', (e) => {
        if (e.target.closest('.voice-play')) return;
        state.voice = v.id;
        renderVoices();
        updateSummary();
      });
      item.querySelector('.voice-play').addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        btn.textContent = '⏳';
        try {
          const key = $('apiKeyInput').value.trim();
          const r = await window.PDMiniTTS.synthesize('สวัสดีค่ะ นี่คือตัวอย่างเสียงพากย์โฆษณา จาก พีดี ออโต้ ฟุตเทจ', v.id, key);
          new Audio(URL.createObjectURL(r.blob)).play();
        } catch (err) {
          log('🔊 ' + err.message, 'error');
        }
        btn.textContent = '▶ ฟัง';
      });
      list.appendChild(item);
    });
  }

  // ── ④ ซับ ────────────────────────────────────────────────────────
  function bindSubStyles() {
    document.querySelectorAll('.sub-style').forEach((el) => {
      el.addEventListener('click', () => {
        document.querySelectorAll('.sub-style').forEach((x) => x.classList.remove('selected'));
        el.classList.add('selected');
        state.subStyle = el.dataset.style;
        const so = $('subOptions');
        const ssr = $('subSizeRow');
        const hide = (state.subStyle === 'none') ? 'none' : 'flex';
        if (so) so.style.display = hide;
        if (ssr) ssr.style.display = hide;
        updateSummary();
      });
    });
    // ป้ายค่าขนาด/เส้นขอบซับ (อัปเดตสด)
    const sz = $('subSize'), szv = $('subSizeVal');
    if (sz && szv) {
      const szLabel = (v) => v < 0.052 ? 'เล็ก' : v < 0.064 ? 'กลาง' : v < 0.08 ? 'ใหญ่' : v < 0.095 ? 'ใหญ่มาก' : 'จัมโบ้ 🔥'; // v0.7: สเกลใหม่ถึง 0.11
      sz.addEventListener('input', () => { szv.textContent = szLabel(parseFloat(sz.value)); });
    }
    const ol = $('subOutline'), olv = $('subOutlineVal');
    if (ol && olv) ol.addEventListener('input', () => { olv.textContent = ol.value; });
  }

  // ── แถบสรุป ──────────────────────────────────────────────────────
  function updateSummary() {
    const chips = [];
    chips.push('📦 ' + state.products.length + ' สินค้า');
    const sc = $('sceneCount').value;
    chips.push('🎬 ' + (sc === 'random' ? '🎲 สุ่มฉาก' : sc + ' ฉาก'));
    const moodText = $('visualMood').selectedOptions[0].textContent.split('—')[0].trim();
    chips.push(moodText);
    if (getTtsProvider() === 'voiceclone') {
      chips.push('🎙️ เสียงโคลน');
    } else {
      const v = VOICES.find((x) => x.id === state.voice);
      if (v) chips.push('🎙️ ' + v.name.split('—')[0].trim());
    }
    const out = $('outputMode').value;
    chips.push(out === 'review' ? '🧪 ตรวจก่อนโพส' : out === 'post' ? '📤 โพส+ปักตะกร้า' : out === 'post_save' ? '📤💾 โพส+เซฟ' : '💾 เซฟ');
    const loop = $('loopCount').value;
    if (loop !== '1') chips.push('🔁 ' + (loop === '999' ? '♾️' : loop + ' รอบ'));
    $('summaryChips').innerHTML = chips.map((c) => '<span class="chip">' + c + '</span>').join('');
  }

  // ── Log + Progress ───────────────────────────────────────────────
  function log(msg, type) {
    $('logPanel').style.display = 'block';
    const line = document.createElement('div');
    if (type === 'error') line.className = 'err';
    if (type === 'success') line.className = 'ok';
    const t = new Date().toTimeString().slice(0, 8);
    line.textContent = '[' + t + '] ' + msg;
    const body = $('logBody');
    body.appendChild(line);
    body.scrollTop = body.scrollHeight;
  }

  function setProgress(pct, text) {
    $('progressWrap').style.display = 'block';
    $('progressFill').style.width = pct + '%';
    $('progressText').textContent = text || '';
    // อัพม่านในแผงด้วย
    $('roBar').style.width = pct + '%';
    if (text) $('roStep').textContent = text;
  }

  function showRunOverlay(show) {
    $('runOverlay').classList.toggle('show', !!show);
    if (show) { $('roBar').style.width = '0%'; $('roStep').textContent = 'กำลังเริ่ม...'; $('roSub').textContent = ''; }
  }
  function setOverlaySub(text) { $('roSub').textContent = text || ''; }

  // ── Run (stub) ───────────────────────────────────────────────────
  async function startRun() {
    if (state.running) return;
    // 🔒 License gate — ต้องเปิดใช้งานด้วยคีย์ก่อน
    if (!window.__pdLicensed) {
      if (window.PDLicense) { try { await window.PDLicense.ensureLicensed(); } catch (e) {} }
      if (!window.__pdLicensed) { log('🔒 กรุณาเปิดใช้งานด้วย License Key ก่อนเริ่มงาน', 'error'); return; }
    }
    if (state.products.length === 0) {
      log('⚠️ ยังไม่มีสินค้า — กด "🔄 ดึงจากตะกร้า TikTok" ก่อน', 'error');
      return;
    }
    state.running = true;
    try { chrome.storage.local.remove('pdFootageStop'); } catch (e) {} // เคลียร์ flag หยุดเก่า
    // v0.3.1: 🎬 flag บอก content script ว่ากำลังรัน (engine ไหน) → โชว์ม่านเองทันทีที่หน้า Flow โหลด/รีเฟรช/retry (กันม่านหลุดดูเหมือนหยุด)
    try {
      const engine = ($('genEngine') && $('genEngine').value === 'merge') ? 'merge' : 'api';
      chrome.storage.local.set({ pdFootageRunning: engine });
    } catch (e) {}
    $('startBtn').disabled = true;
    $('stopBtn').disabled = false;
    showRunOverlay(true);
    log('🚀 เริ่มสร้างโฆษณา ' + state.products.length + ' สินค้า', 'success');

    const apiKey = $('apiKeyInput').value.trim();
    const loopTotal = parseInt($('loopCount').value) || 1;
    const setDelay = parseInt($('setDelay').value) || 0;
    state._done = 0; state._failed = 0; state._fail403 = 0; state._mb = 0; state._t0 = Date.now(); // reset สถิติรอบนี้
    state._schedOffsetMin = 0; // v0.4: ตัวสะสมเวลาตั้งโพส (บวกทุกคลิป)

    try {
      outer:
      for (let round = 1; round <= loopTotal; round++) {
        if (!state.running) break;
        if (loopTotal > 1) log('╔═══ 🔁 รอบที่ ' + round + '/' + (loopTotal === 999 ? '∞' : loopTotal) + ' ═══');

      for (let pi = 0; pi < state.products.length; pi++) {
        if (!state.running) break outer;
        const product = state.products[pi];
        try {
        // สุ่มค่าใหม่ต่อสินค้า (ถ้าตั้ง random) — แต่ละคลิปได้แนว/มู้ด/ฉากต่างกัน
        const opts = {
          structure: pickStructure(),
          mood: pickValue('visualMood', ['cinematic', 'luxury', 'minimal', 'energetic', 'nature']),
          coverFont: pickCoverFont(), // v0.6: สไตล์ฟอนต์พาดหัวฉากแรก ('' = AI เลือกเอง)
          sceneCount: pickSceneCount(),
          character: getCharacterOpt(), // v0.2: ตัวละครหลัก (null = ไม่มี → ฟุตเทจไม่มีคนเหมือนเดิม)
          handwrittenOverlay: !!state.hwOverlay, // ✍️ กราฟิกลายมือ — ต่อท้ายทุกพรอมต์วิดีโอ
        };
        const base = (pi / state.products.length) * 100;
        setProgress(base + 2, 'สินค้า ' + (pi + 1) + '/' + state.products.length + ' — คิดบทโฆษณา...');
        log('━━ 📦 ' + (pi + 1) + '/' + state.products.length + ': ' + product.name);

        // v0.3.1: โชว์โครงเรื่องที่สุ่มได้ (เฉพาะตอนเลือก "สุ่ม" — user อยากรู้ว่าติ๊กหลายอันแล้วได้อะไร)
        if ($('adStructure').value === 'random') {
          log('🎲 สุ่มโครงเรื่อง: ' + (STRUCT_LABEL[opts.structure] || opts.structure), 'info');
        }

        // 1) AI คิดบทตามโครง
        log('🧠 AI กำลังคิดบทโฆษณา (' + opts.sceneCount + ' ฉาก)...');
        const scenes = await window.PDMiniAI.generateAdScript(product, opts, apiKey);
        scenes.forEach((s, i) => log('  📝 ฉาก ' + (i + 1) + ': "' + s.voice + '"'));

        // 2) เสียงพากย์ทีละฉาก (รู้ duration เป๊ะ — ใช้ทำซับ Phase 4)
        for (let si = 0; si < scenes.length; si++) {
          if (!state.running) break;
          setProgress(base + ((si + 1) / scenes.length) * (90 / state.products.length),
            'สินค้า ' + (pi + 1) + ' — พากย์เสียงฉาก ' + (si + 1) + '/' + scenes.length);
          log('🎙️ พากย์ฉาก ' + (si + 1) + '/' + scenes.length + (getTtsProvider() === 'voiceclone' ? ' (เสียงโคลน)' : '') + '...');
          const r = await synthVoice(scenes[si].voice);
          scenes[si].audioBlob = r.blob;
          scenes[si].durationSec = r.durationSec;
          log('  ✅ ได้เสียง ' + r.durationSec + ' วิ', 'success');
        }

        // 3) Flow เจนภาพ cinematic + animate ทีละฉาก (ผ่าน content script บน labs.google)
        setProgress(base + (40 / state.products.length), 'สินค้า ' + (pi + 1) + ' — Flow สร้างคลิป...');
        log('🎬 Flow กำลังสร้างคลิป cinematic ' + scenes.length + ' ฉาก...');
        const useMerge = $('genEngine') && $('genEngine').value === 'merge';
        const flowReq = {
          tag: 'p' + pi + '_' + Date.now(),
          firstOfRun: (round === 1 && pi === 0), // v0.2: สินค้าแรกสุดของการรัน — ต้องขึ้นโปรเจ็คใหม่เสมอ (ยังไม่มีโปรเจ็ค)
          aspect: $('aspectRatio').value,
          productImage: product.image,   // 🔑 แนบรูปสินค้าเป็น ref — กันคลิปออกมาไม่ตรงสินค้า
          productName: product.name,
          // v0.2: แนบรูปตัวละครหลัก (ถ้าเปิดใช้) → mini-flow อัปเป็น ref ครั้งเดียว ใช้ทุกฉาก
          //   v0.3: 🥦 veggie_drama ไม่แนบรูปคน — กัน lock "หน้าเหมือนรูป" ขัดกับ "หัวเป็นผลไม้" (บั๊ก) ให้ AI สร้างหัวผลไม้เอง
          characterImage: (state.character.enabled && state.character.image && opts.structure !== 'veggie_drama' && opts.structure !== 'warehouse_hands') ? state.character.image : '',
          mergeMode: useMerge,           // 🛡️ humanized session กัน 403 (API path)
          // v0.6.7 (กู้คืน): โมเดลรูป/วิดีโอ + รีทายสูงสุด/ฉาก จาก UI — vip-engine อ่าน imageModel/videoModel/maxRetries (มี default ถ้าไม่ส่ง)
          imageModel: $('imageModelSel') ? $('imageModelSel').value : 'nano_banana_pro',
          videoModel: $('videoModelSel') ? $('videoModelSel').value : 'veo_lite_lower',
          omniSeconds: $('omniSecondsSel') ? (parseInt($('omniSecondsSel').value, 10) || 8) : 8, // ⏱️ Omni Flash 8/10s
          maxRetries: $('maxRetries') ? Math.max(1, Math.min(15, parseInt($('maxRetries').value) || 7)) : 7,
          scenes: scenes.map((s) => ({ imagePrompt: s.imagePrompt, videoPrompt: s.videoPrompt, showProduct: s.showProduct !== false })),
        };
        // 🛡️ Merge Mode คลิกจริง = ขับเครื่องยนต์ VIP (คลิกปุ่มบนหน้า Flow จริง) · ไม่งั้น API Direct
        const clips = useMerge ? await generateFlowClipsMerge(flowReq) : await generateFlowClips(flowReq);
        log('  ✅ ได้คลิป ' + clips.length + ' ฉาก', 'success');

        // 4) รวมร่าง: ฟุตเทจ + เสียงพากย์ + เพลง duck + ซับ + ตัดเงียบ → MP4
        setProgress(base + (75 / state.products.length), 'สินค้า ' + (pi + 1) + ' — รวมคลิป+เสียง+ซับ...');
        const music = await loadBgMusic();
        const sfx = await loadSfx();
        const mp4 = await window.PDMiniEngine.buildVideo({
          clips: clips,
          scenes: scenes,
          aspect: $('aspectRatio').value,
          quality: ($('clipQuality') ? $('clipQuality').value : '720p'), // v0.6.6: output 720p/1080p/4k
          subStyle: state.subStyle,
          subFont: $('subFont').value,
          subAnim: $('subAnim').value,
          subSize: parseFloat($('subSize').value),
          subOutline: parseInt($('subOutline').value),
          subSplit: $('subSplit') ? $('subSplit').value : 'normal', // v0.7: ⚡ ทีละคำ CapCut
          subPos: $('subPos') ? parseFloat($('subPos').value) : 0.24, // v0.7: ตำแหน่งซับ
          music: { enabled: $('bgMusicToggle').checked && !!music, blob: music, volume: parseInt($('bgMusicVolume').value) },
          sfx: { enabled: $('sfxToggle').checked && !!sfx, blob: sfx, volume: parseInt($('sfxVolume').value) },
          silenceCut: $('silenceCutToggle').checked,
          // ⏱️ ความยาวคลิปจริง (Omni Flash 10 วิ = 10, อื่นๆ = 8) + ขั้นต่ำต่อฉาก 5 วิ (กันคลิปสั้น)
          maxClipSec: (($('videoModelSel') && $('videoModelSel').value === 'omni_flash') && $('omniSecondsSel') && parseInt($('omniSecondsSel').value, 10) === 10) ? 10 : 8,
          minSceneSec: 5,
        }, (m) => log('  ' + m));

        // 5) ผลลัพธ์ตาม outputMode
        const outMode = $('outputMode').value;
        const safe = ((product.name || '').replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim()
          .slice(0, 30).trim().replace(/[. ]+$/, '')) || ('product' + (pi + 1));
        let postedOk = false;
        const doPost = (outMode === 'post' || outMode === 'post_save');
        if (doPost) {
          try {
            // v0.4: รวมตั้งค่าการโพส (วิธีโพส/ตั้งเวลา/แฮชแท็ก/disclosure)
            const postCfg = readPostConfig();
            if (postCfg.postType === 'schedule') {
              const sch = computeSchedule();
              postCfg.scheduleDate = sch.date; postCfg.scheduleTime = sch.time;
              log('📤 กำลังโพส TikTok (ตั้งเวลา ' + sch.date + ' ' + sch.time + ' น.) + ปักตะกร้า...');
            } else if (postCfg.postType === 'saveDraft') {
              log('📤 กำลังบันทึกฉบับร่าง TikTok + ปักตะกร้า...');
            } else {
              log('📤 กำลังโพส TikTok ทันที + ปักตะกร้าอัตโนมัติ...');
            }
            const pr = await postClipToTikTok(mp4, product, scenes, safe, apiKey, postCfg);
            if (pr && pr.success) {
              postedOk = true;
              state._posted = (state._posted || 0) + 1;
              log('  ✅ โพส TikTok สำเร็จ!', 'success');
            } else {
              log('  ⚠️ โพสไม่สำเร็จ: ' + ((pr && pr.error) || 'ไม่ทราบสาเหตุ') + ' — เซฟไฟล์ไว้ให้แทน', 'error');
            }
          } catch (postErr) {
            log('  ⚠️ โพส TikTok พลาด: ' + postErr.message + ' — เซฟไฟล์ไว้ให้แทน', 'error');
          }
        }
        // เซฟไฟล์: โหมด save/post_save เซฟเสมอ · โหมด post เซฟเฉพาะตอนโพสไม่สำเร็จ (fallback กันไฟล์รก)
        const doSave = (outMode === 'save' || outMode === 'post_save' || (outMode === 'post' && !postedOk) || (outMode !== 'post' && !doPost));
        if (doSave) {
          const url = URL.createObjectURL(mp4);
          await chrome.downloads.download({
            url, filename: 'PD-Footage/' + safe + '.mp4', saveAs: false, conflictAction: 'uniquify',
          });
          setTimeout(() => URL.revokeObjectURL(url), 120000);
          log('💾 เสร็จ! เซฟ → Downloads/PD-Footage/' + safe + '.mp4 (' + (mp4.size / 1048576).toFixed(1) + ' MB)', 'success');
        }
        state._done = (state._done || 0) + 1;
        state._mb = (state._mb || 0) + mp4.size / 1048576;
        state._fail403 = 0; // สำเร็จ → reset ตัวนับ 403 ติดกัน

        } catch (prodErr) {
          // สินค้านี้เฟล → ข้ามไปตัวถัดไป ไม่ทำให้ทั้งงานหยุด
          state._failed = (state._failed || 0) + 1;
          log('❌ สินค้า ' + (pi + 1) + ' (' + product.name.slice(0, 25) + ') เฟล: ' + prodErr.message + ' — ข้ามไปตัวถัดไป', 'error');
          // ถ้าเฟลเพราะ 403 → นับ ถ้าติดกัน 2 สินค้า พักยาวให้ score ฟื้น
          if (/403|recaptcha|บล็อค|จำกัด/i.test(prodErr.message)) {
            state._fail403 = (state._fail403 || 0) + 1;
            if (state._fail403 >= 2 && state.running) {
              log('🛡️ ติด 403 ติดกัน — พัก 3 นาทีให้ระบบฟื้นก่อนทำต่อ...', 'error');
              for (let t = 0; t < 180 && state.running; t++) await sleep(1000);
              state._fail403 = 0;
            }
          }
        }

        // พักระหว่างสินค้า (ข้ามตัวสุดท้ายของรอบสุดท้าย)
        //   v0.7.1: +สุ่ม 0-40% ของค่าที่ตั้ง (พักไม่เท่ากันทุกครั้ง = เนียนกว่าคาบเวลาตายตัว) กัน reCAPTCHA จับจังหวะเครื่องจักร
        const isLast = (round === loopTotal && pi === state.products.length - 1);
        if (!isLast && setDelay > 0 && state.running) {
          const jitter = Math.floor(setDelay * Math.random() * 0.4);
          const waitSec = setDelay + jitter;
          log('⏸️ พัก ' + waitSec + ' วิ ก่อนสินค้าถัดไป (กัน 403)...');
          for (let t = 0; t < waitSec && state.running; t++) await sleep(1000);
        }
      }
      } // end round loop
      setProgress(100, 'เสร็จทั้งหมด');
      log('🎉 จบงาน — สำเร็จ ' + (state._done || 0) + ' คลิป' + (state._failed ? ' · เฟล ' + state._failed : '') + '', 'success');
    } catch (e) {
      log('❌ ' + e.message, 'error');
      state._fatalErr = e.message;
    } finally {
      state.running = false;
      try { chrome.storage.local.remove('pdFootageRunning'); } catch (e) {} // v0.3.1: จบงาน → ปิดม่าน auto-reshow
      // สั่งปิดม่านบนหน้า Flow ที่ค้างอยู่ (ถ้ามี)
      try {
        const ft = (await chrome.tabs.query({ url: ['https://labs.google/*', 'https://flow.google.com/*'] }))[0];
        if (ft) chrome.tabs.sendMessage(ft.id, { action: 'pdHideCurtain' }).catch(() => {});
      } catch (e) {}
      $('startBtn').disabled = false;
      $('stopBtn').disabled = true;
      showRunOverlay(false);
      showSummaryCard();
    }
  }

  // ── การ์ดสรุปเมื่อรันเสร็จ ──────────────────────────────────────────
  function showSummaryCard() {
    const done = state._done || 0;
    const failed = state._failed || 0;
    const stopped = state._stopped;
    // เวลาที่ใช้ → m:ss
    const secs = Math.max(0, Math.round((Date.now() - (state._t0 || Date.now())) / 1000));
    const tStr = Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0');

    // หัวการ์ดปรับตามผล
    let emoji = '🎉', title = 'เสร็จทั้งหมดแล้ว!', sub = 'สร้างโฆษณาเรียบร้อย พร้อมโพสได้เลย';
    if (stopped) { emoji = '⏹️'; title = 'หยุดแล้ว'; sub = 'หยุดกลางทางตามที่สั่ง'; }
    else if (done === 0) { emoji = '😵'; title = 'ยังไม่ได้คลิปเลย'; sub = state._fatalErr || 'ลองใหม่ หรือสลับวิธีสร้างคลิป'; }
    else if (failed > 0) { emoji = '✅'; title = 'เสร็จแล้ว (มีบางตัวเฟล)'; sub = 'คลิปที่สำเร็จเซฟไว้แล้ว'; }

    $('sumEmoji').textContent = emoji;
    $('sumTitle').textContent = title;
    $('sumSubtitle').textContent = sub;
    $('sumDone').textContent = done;
    $('sumFailed').textContent = failed;
    $('sumTime').textContent = tStr;

    // meta บรรทัดล่าง
    const meta = [];
    if (done > 0) meta.push('📁 เซฟที่ <b>Downloads/PD-Footage/</b>');
    if (state._mb > 0) meta.push('💾 รวม ' + state._mb.toFixed(1) + ' MB');
    const engine = ($('genEngine') && $('genEngine').value === 'merge') ? '🛡️ Merge Mode' : '⚡ API Direct';
    meta.push('⚙️ ' + engine);
    $('sumMeta').innerHTML = meta.join(' · ');

    $('summaryOverlay').classList.add('show');
  }

  // ค่า dropdown ที่มีตัวเลือก "random" → สุ่มจาก list จริง
  function pickValue(id, pool) {
    const v = $(id).value;
    return v === 'random' ? pool[Math.floor(Math.random() * pool.length)] : v;
  }

  // v0.2: เลือกโครงเรื่อง — ถ้า "สุ่ม" → สุ่มจากแนวที่ติ๊ก (default ทุกแนว ถ้าไม่ติ๊ก)
  const ALL_STRUCTURES = ['problem_solution', 'hard_sell', 'storytelling', 'lifestyle', 'funny', 'relatable', 'ugc_review', 'viral_trend', 'dm_close', 'pai_ya', 'veggie_drama', 'before_after', 'asmr_satisfying', 'demo_howto', 'listicle', 'warehouse_hands', 'mirror_selfie', 'minimal_cute']; // v0.7.2: + มินิมอลน่ารัก
  // v0.3.1: ป้ายชื่อโครงเรื่อง (ไว้โชว์ใน log ตอนสุ่ม — user อยากรู้ว่าสุ่มได้แนวไหน)
  const STRUCT_LABEL = {
    problem_solution: '🎯 ปัญหา → โซลูชัน', hard_sell: '🔥 ขายแรง', storytelling: '📖 เล่าเรื่อง',
    lifestyle: '🌅 Lifestyle', funny: '😂 ตลก/มุกป่วน', relatable: '🏠 ใกล้ตัว',
    ugc_review: '🗣️ รีวิว UGC', viral_trend: '🔥 ตามกระแสไวรัล', dm_close: '💬 ทักแชทปิดการขาย',
    pai_ya: '💊 ป้ายยา',
    veggie_drama: '🥦 ละครผัก/ผลไม้หัวคน',
    before_after: '🔄 ก่อน-หลัง', asmr_satisfying: '🤤 ASMR/ฟินๆ', demo_howto: '🔧 เดโม/วิธีใช้', listicle: '🔢 นับข้อ/เหตุผล',
    warehouse_hands: '📦 โกดังเห็นแค่มือ',
    mirror_selfie: '👗 เซลฟี่กระจกลองเสื้อ (OOTD)', // v0.6.7
    minimal_cute: '🤍 มินิมอลน่ารัก', // v0.7.2
  };
  function pickStructure() {
    const v = $('adStructure').value;
    if (v !== 'random') return v;
    const ticked = Array.from(document.querySelectorAll('.structure-pool-cb:checked')).map((c) => c.value);
    const pool = ticked.length ? ticked : ALL_STRUCTURES;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // v0.6: เลือกสไตล์ฟอนต์พาดหัวฉากแรก — '' = AI เลือกเอง · 'random' = สุ่มจากสไตล์จริง (ไม่รวม AI/สุ่ม)
  const COVER_FONT_KEYS = ['casual_real', 'tiktok_bold', 'handwritten', 'pop_sale', 'news_banner', 'cute_bubble', 'bold_premium', 'elegant_serif'];
  function pickCoverFont() {
    const v = $('coverFontStyle') ? $('coverFontStyle').value : '';
    if (v === 'random') return COVER_FONT_KEYS[Math.floor(Math.random() * COVER_FONT_KEYS.length)];
    return v; // '' = AI เลือกเอง
  }

  // v0.2: เลือกจำนวนฉาก — ถ้า "สุ่ม" → สุ่มจากจำนวนที่ติ๊ก (default 3-5 ถ้าไม่ติ๊ก)
  function pickSceneCount() {
    const v = $('sceneCount').value;
    if (v !== 'random') return parseInt(v);
    const ticked = Array.from(document.querySelectorAll('.scene-pool-cb:checked'))
      .map((c) => parseInt(c.value)).filter((n) => n >= 2 && n <= 10);
    const pool = ticked.length ? ticked : [3, 4, 5];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // ── Flow: หา/เปิดแท็บ labs.google → สั่ง content script เจนคลิป → คืน [base64 mp4] ──
  //   ⚠️ content script (flow-hook/api MAIN world) ต้องโหลดพร้อมหน้า ถึงจะ "จับ auth" ได้
  //   ถ้าแท็บเปิดอยู่ก่อนรีโหลด extension → script ไม่ถูก inject → ต้อง "reload หน้า" ก่อน (เหมือนบอทหลัก)
  async function pingFlow(tabId, tries) {
    for (let i = 0; i < tries; i++) {
      const pong = await chrome.tabs.sendMessage(tabId, { action: 'miniFlowPing' }).catch(() => null);
      if (pong && pong.ok) return true;
      await sleep(1500);
    }
    return false;
  }

  async function generateFlowClips(req) {
    /* 🌐 Google ทยอยย้าย Flow ไป flow.google.com — ต้องหาแท็บให้เจอทั้ง 2 โดเมน */
    let tab = (await chrome.tabs.query({ url: 'https://flow.google.com/*' }))[0]
           || (await chrome.tabs.query({ url: 'https://labs.google/fx/tools/flow*' }))[0]
           || (await chrome.tabs.query({ url: 'https://labs.google/*' }))[0];

    if (!tab) {
      log('🆕 เปิดหน้า Flow (labs.google) ให้อัตโนมัติ...');
      tab = await chrome.tabs.create({ url: 'https://labs.google/fx/tools/flow', active: false });
      await waitTabComplete(tab.id, 30000);
      await sleep(4000);
    } else if (!(await pingFlow(tab.id, 1))) {
      // มีแท็บแต่ script ไม่ตอบ → reload เพื่อให้ flow-hook โหลดพร้อมหน้า + จับ auth ใหม่
      log('🔄 รีเฟรชหน้า Flow เพื่อเชื่อมต่อ (จับสิทธิ์ใหม่)...');
      await chrome.tabs.reload(tab.id);
      await waitTabComplete(tab.id, 30000);
      await sleep(4000);
    }

    if (!(await pingFlow(tab.id, 8))) {
      // ลองรีโหลดอีกรอบเป็น last resort
      log('🔄 ยังไม่ตอบ — รีเฟรชอีกครั้ง...');
      await chrome.tabs.reload(tab.id);
      await waitTabComplete(tab.id, 30000);
      await sleep(5000);
      if (!(await pingFlow(tab.id, 8))) {
        throw new Error('เชื่อมต่อหน้า Flow ไม่ได้ — เปิด labs.google/fx/tools/flow ค้างไว้ + ล็อกอิน Google แล้วลองใหม่');
      }
    }
    log('  ✓ เชื่อมต่อ Flow แล้ว');

    const resp = await chrome.tabs.sendMessage(tab.id, { action: 'miniFlowGenerate', req })
      .catch((e) => ({ success: false, error: e.message }));
    if (!resp || !resp.success) throw new Error((resp && resp.error) || 'Flow gen ไม่สำเร็จ');

    const r = await chrome.storage.local.get(resp.key);
    const data = r[resp.key];
    chrome.storage.local.remove(resp.key);
    return (data && data.clips) || [];
  }

  // ════════════════════════════════════════════════════════════════
  // 🛡️ Merge Mode — คลิกปุ่มจริงบนหน้า Flow (ขับเครื่องยนต์ VIP `vip-engine.js`)
  //   เลียนแบบคนกดจริง 100% → reCAPTCHA จับเป็นคน → ทน 403 สุด
  //   ขั้นตอน: หา/เปิดแท็บ Flow → ambient humanized → skip-download (hook ดักคลิป)
  //   → New project → ต่อฉาก: mergeGenerateScene (สร้างภาพ+animate+โหลด) → getFlowFinalVideo
  // ════════════════════════════════════════════════════════════════
  async function ensureFlowTabReady() {
    /* 🌐 Google ทยอยย้าย Flow ไป flow.google.com — ต้องหาแท็บให้เจอทั้ง 2 โดเมน */
    let tab = (await chrome.tabs.query({ url: 'https://flow.google.com/*' }))[0]
           || (await chrome.tabs.query({ url: 'https://labs.google/fx/tools/flow*' }))[0]
           || (await chrome.tabs.query({ url: 'https://labs.google/*' }))[0];
    if (!tab) {
      log('🆕 เปิดหน้า Flow (labs.google) ให้อัตโนมัติ...');
      tab = await chrome.tabs.create({ url: 'https://labs.google/fx/tools/flow', active: true });
      await waitTabComplete(tab.id, 30000);
      await sleep(4000);
    }
    // verify vip-engine ตอบ (mergePing) — ไม่ตอบ → reload
    const alive = async (n) => {
      for (let i = 0; i < n; i++) {
        const r = await chrome.tabs.sendMessage(tab.id, { action: 'mergePing' }).catch(() => null);
        if (r && r.success) return true;
        await sleep(1500);
      }
      return false;
    };
    if (!(await alive(2))) {
      log('🔄 รีเฟรชหน้า Flow เพื่อโหลดเครื่องยนต์...');
      await chrome.tabs.reload(tab.id);
      await waitTabComplete(tab.id, 30000);
      await sleep(5000);
      if (!(await alive(8))) {
        throw new Error('เชื่อมต่อหน้า Flow ไม่ได้ — เปิด labs.google/fx/tools/flow + ล็อกอิน Google แล้วลองใหม่');
      }
    }
    return tab;
  }

  async function generateFlowClipsMerge(req) {
    const tab = await ensureFlowTabReady();
    const tabId = tab.id;
    const sendTab = (msg) => chrome.tabs.sendMessage(tabId, msg).catch((e) => ({ success: false, error: e.message }));

    log('  ✓ เชื่อมต่อ Flow (Merge Mode คลิกจริง)');
    // Flow ต้อง active เพื่อให้ CDP คลิกโดนพิกัดถูก (พื้นหลังคลิกเพี้ยน)
    try { await chrome.tabs.update(tabId, { active: true }); } catch (_) {}

    // v0.2 🐛 FIX: ขึ้นโปรเจ็คใหม่ทุกสินค้า — ต้อง "กลับหน้า Flow หลักก่อน" ไม่งั้น findNewProjectButton
    //   หาปุ่มผิด (กดเปิดคลิป/อยู่ในโปรเจ็คเดิม) → ref ปนข้ามสินค้า · เลียนแบบ VIP (navigate+refresh ก่อน)
    //   firstOfRun = สินค้าแรกสุด ต้องขึ้นใหม่เสมอ (ยังไม่มีโปรเจ็ค) · checkbox ปิด = ทำต่อในเดิม (เร็วกว่า)
    const wantNewProject = (typeof $('newProjectEachSet') !== 'undefined' && $('newProjectEachSet'))
      ? $('newProjectEachSet').checked : true;
    const doNewProject = wantNewProject || req.firstOfRun;
    if (doNewProject) {
      log('  🏠 กลับหน้า Flow หลักก่อนเปิดโปรเจ็คใหม่ (กันกดผิดหน้า)...');
      try {
        await chrome.tabs.update(tabId, { url: 'https://labs.google/fx/tools/flow', active: true });
        await waitTabComplete(tabId, 30000);
        await sleep(4000);
        // รอ vip-engine โหลดพร้อมหลัง navigate (mergePing)
        for (let i = 0; i < 8; i++) {
          const r = await chrome.tabs.sendMessage(tabId, { action: 'mergePing' }).catch(() => null);
          if (r && r.success) break;
          await sleep(1500);
        }
      } catch (navErr) { log('  ⚠️ navigate หน้าหลักมีปัญหา: ' + navErr.message, 'error'); }
    } else {
      log('  ♻️ ทำต่อในโปรเจ็คเดิม (ปิด "ขึ้นโปรเจ็คใหม่ทุกสินค้า") — ref ใช้ชื่อ unique กันปนอยู่แล้ว');
    }

    // เปิด humanized ambient session (ขยับเมาส์จริงตลอด กัน reCAPTCHA) — หลัง navigate (debugger attach กับ tab อยู่แล้ว)
    await chrome.runtime.sendMessage({ action: 'cdpAmbientStart', tabId }).catch(() => {});
    // ให้ hook ดักไฟล์คลิป (ไม่เซฟลงเครื่อง — เราเอา base64 มารวมเอง) — ตั้งหลัง navigate (reload reset flag)
    await sendTab({ action: 'setSkipDownload', enabled: true });
    // v0.6.1: เคลียร์ flag หยุด (in-memory) ก่อนเริ่มฉาก — กันค้างจากการกดหยุดรอบก่อน (ไม่งั้นฉากแรกถูกยกเลิกทันที)
    await sendTab({ action: 'pdFootageResetStop' });

    const clips = [];
    // v0.2 🚨 ชื่อไฟล์ ref UNIQUE ต่อสินค้า (req.tag = p0_.../p1_...) — สำคัญมาก!
    //   ถ้าทำต่อในโปรเจ็คเดิม (ไม่ขึ้นใหม่) ฉาก 2+ ค้นชื่อจาก gallery — ถ้าใช้ชื่อตายตัว 'pd-product.png'
    //   ทุกสินค้า → สินค้า 2 จะเจอรูปสินค้า 1 ที่ค้างใน gallery = ปนกัน! (บั๊กเดียวกับที่ VIP เคยแก้)
    //   tag unique → ชื่อต่างกันทุกสินค้า แต่คงที่ภายในสินค้าเดียว (ฉาก 2+ ค้นเจอของตัวเองเท่านั้น)
    const runTag = String(req.tag || Date.now()).replace(/[^a-z0-9]/gi, '');
    // ref ต่อฉาก — สินค้าแนบเฉพาะฉากที่โชว์สินค้า (showProduct) · ตัวละครแนบทุกฉาก (พรีเซนเตอร์คนเดิม)
    //   attach=true → แนบจริง · attach=false → uploadOnly (อัพเข้า gallery เฉยๆ ให้ฉากหลัง search-by-name เจอ)
    const prodRef = (attach) => req.productImage
      ? [{ base64: req.productImage, filename: `pd-product-${runTag}.png`, kind: 'product', uploadOnly: !attach }]
      : [];
    const charRef = req.characterImage
      ? [{ base64: req.characterImage, filename: `pd-character-${runTag}.png`, kind: 'model' }]
      : [];
    // v0.2 🐛 FIX: lock สินค้าให้ตรงรูปที่แนบ (เดิมลืม → AI มโนแพ็คเกจเอง ไม่ตรง) — แบบ PD Auto VIP
    const PRODUCT_LOCK = ' ⚠️ MANDATORY PRODUCT ACCURACY: The product in the scene MUST be the EXACT same product as the attached product reference image — identical packaging, label, brand name, all text/letters, colors, shape and design. Do NOT redesign, do NOT invent a different product, do NOT alter or translate the label. Only the scene, background, lighting and action around the product may change.';
    // lock ให้ภาพอิงตัวละครเดิม (เลียนแบบ PD Auto VIP) — ต่อท้าย imagePrompt ทุกฉากเมื่อมีตัวละคร
    const CHAR_LOCK = req.characterImage
      ? ' ⚠️ MANDATORY: The person in the scene MUST be the SAME person as the attached character reference image — same face, hairstyle, gender, body. Do NOT change the person, do NOT change gender. The character does NOT speak (mouth closed or natural smile, no lip movement).'
      : '';
    let consecutiveFails = 0;
    try {
      // เปิดโปรเจคใหม่ผ่าน UI จริง (เฉพาะเมื่อ doNewProject — ตอนนี้อยู่หน้า Flow หลักแล้ว ปุ่มถูกต้อง)
      if (doNewProject) {
        log('  🆕 เปิดโปรเจคใหม่บนหน้า Flow...');
        const np = await sendTab({ action: 'startNewProject' });
        if (np && np.success === false && np.error) log('  ⚠️ New project: ' + np.error, 'error');
        await sleep(2500);
      }

      // v0.2 🛡️ retry แบบ PD Auto VIP — 7 ครั้ง สลับ (คู่=กดปุ่ม Retry บน card, คี่=refresh หน้า)
      //   cooldown ขั้นบันได 30→180 วิ (ให้ reCAPTCHA score ฟื้น, ambient mouse ขยับตลอด session อยู่แล้ว)
      //   เช็คเฟลผ่าน engine (countAllFailedGenerations/detectErrorMessage ใน runMergeGenerateScene_v1)
      const MAX_SCENE_RETRIES = Math.max(1, Math.min(15, parseInt(req.maxRetries) || 7)); // v0.6.7 (กู้คืน): ปรับได้จาก UI · ดีฟอลต์ 7
      const RETRY_COOLDOWN_MS = [30000, 60000, 90000, 120000, 150000, 180000]; // 403/บล็อค — รอ score ฟื้น
      // v0.6.5: เฟลที่ "ไม่ใช่ 403" (audio fail/timeout/ทั่วไป) ไม่ต้องรอนาน — รีทายไวๆ ประหยัดเวลา
      const SHORT_RETRY_MS = [3000, 5000, 8000, 12000, 16000, 20000];
      // helper: ดึง base64 คลิปที่ hook ดักไว้ (poll เผื่อ hook ยังไม่ทันเซ็ต)
      const pullClip = async () => {
        let vid = await sendTab({ action: 'getFlowFinalVideo' });
        for (let w = 0; w < 5 && (!vid || !vid.base64); w++) {
          await sleep(1500);
          vid = await sendTab({ action: 'getFlowFinalVideo' });
        }
        return (vid && vid.base64) ? vid : null;
      };
      const isAborted = async () => {
        const s = await chrome.storage.local.get('pdFootageStop');
        return !!(s && s.pdFootageStop);
      };

      for (let i = 0; i < req.scenes.length; i++) {
        if (await isAborted()) { log('  ⏹️ หยุดโดยผู้ใช้'); break; }

        // v0.2: ฉากนี้โชว์สินค้าไหม → คุม ref + lock ต่อฉาก (AI ตัดสินว่าฉากไหนเหมาะมีสินค้า)
        const showProd = req.scenes[i].showProduct !== false;
        let sceneRefs;
        if (i === 0) {
          // ฉาก 1: ใส่สินค้าเสมอ (attach ถ้าโชว์ · ไม่โชว์ = uploadOnly อัพเข้า gallery ให้ฉากหลังหาเจอ) + ตัวละคร
          sceneRefs = prodRef(showProd).concat(charRef);
        } else {
          // ฉาก 2+: ใส่สินค้าเฉพาะฉากที่โชว์ (search by name) + ตัวละครทุกฉาก
          sceneRefs = (showProd ? prodRef(true) : []).concat(charRef);
        }
        const sceneLock = (showProd ? PRODUCT_LOCK : '') + CHAR_LOCK;
        const data = {
          sceneIndex: i + 1,
          sceneCount: req.scenes.length,
          isFirstScene: i === 0,
          imagePrompt: req.scenes[i].imagePrompt + sceneLock,
          videoPrompt: req.scenes[i].videoPrompt,
          speechText: '',
          productImages: sceneRefs,
          aspect: req.aspect,
          // v0.6.7 (กู้คืน): ใช้โมเดลที่เลือกจาก UI (ส่งมากับ req) — เดิม hardcode
          imageModel: req.imageModel || 'nano_banana_pro',
          videoModel: req.videoModel || 'veo_lite_lower',
          omniSeconds: req.omniSeconds || 8, // ⏱️ Omni Flash 8/10s
          quality: ($('clipQuality') ? $('clipQuality').value : '720p'), // v0.6.6: 720p/1080p/4k — 1080p+ รอ upscale (Merge Mode)
        };

        let gotClip = null;
        let lastErr = '';
        let userStop = false;
        let reuseImageUrl = null; // v0.6.3: ถ้ารูปฉากนี้เสร็จแล้ว (เก็บ url) → retry แค่คลิป (animate รูปเดิม) ไม่สร้างรูปใหม่
        for (let attempt = 1; attempt <= MAX_SCENE_RETRIES && !gotClip; attempt++) {
          if (await isAborted()) { userStop = true; break; }

          if (attempt === 1) {
            log('  🎬 ฉาก ' + (i + 1) + '/' + req.scenes.length + (showProd ? ' (มีสินค้า)' : ' (ไม่มีสินค้า)') + ' — สร้างภาพ+คลิป (คลิกจริง)...');
          } else {
            // ── cooldown — v0.6.5: แยกตามประเภทเฟล · 403/บล็อค/reCAPTCHA → รอยาว (รอ score ฟื้น) · อื่นๆ (audio fail/timeout) → รอสั้น รีทายไว ──
            const _leCd = String(lastErr || '').toLowerCase();
            const _is403 = /403|flow_blocked|unusual|recaptcha|บล็อค|429|rate limit|resource_exhausted/.test(_leCd);
            const cd = _is403
              ? RETRY_COOLDOWN_MS[Math.min(attempt - 2, RETRY_COOLDOWN_MS.length - 1)]
              : SHORT_RETRY_MS[Math.min(attempt - 2, SHORT_RETRY_MS.length - 1)];
            const cdLabel = cd >= 60000 ? (Math.round(cd / 60000) + ' นาที') : (Math.round(cd / 1000) + ' วิ');
            log('  🔄 ฉาก ' + (i + 1) + ' retry ' + attempt + '/' + MAX_SCENE_RETRIES + ' — พัก ' + cdLabel + (_is403 ? ' (403 รอ score ฟื้น)' : ' (เฟลทั่วไป รีทายไว)') + '...', 'warning');
            const cdStart = Date.now();
            while (Date.now() - cdStart < cd) { if (await isAborted()) break; await sleep(Math.min(5000, cd - (Date.now() - cdStart))); }
            if (await isAborted()) { userStop = true; break; }

            // ⚠️ Audio-fail (การ์ด "Audio generation failed" ไม่มีปุ่ม Retry) + Flow-reject (กดปุ่มแล้วเฟลซ้ำ)
            //   → ข้ามวิธีกดปุ่ม ใช้ refresh+animate อย่างเดียว (กันเสียรอบ retry ไปกับปุ่มที่ใช้ไม่ได้)
            const _fel = String(lastErr || '').toLowerCase();
            const _isAudioFail = _fel.includes('audio generation failed') || _fel.includes('audio failed');
            const _isFlowReject = _fel.includes('generate api') || _fel.includes('ปฏิเสธ') || _fel.includes('rejected');
            if (!_isAudioFail && !_isFlowReject && attempt % 2 === 0) {
              // ── Retry แบบ 1: กดปุ่ม Retry บนกรอบ fail (ไม่ refresh — เร็ว เหมือนคนกด) ──
              log('  🔁 กดปุ่ม Retry บนกรอบที่เฟล...', 'info');
              await sendTab({ action: 'clearFlowFinalVideo' });
              const cr = await sendTab({ action: 'mergeCardRetryAndCapture', data: { sceneIndex: i + 1, quality: ($('clipQuality') ? $('clipQuality').value : '720p') } });
              if (cr && cr.success) {
                const clip = await pullClip();
                if (clip) { gotClip = clip; log('  ✅ ฉาก ' + (i + 1) + ' สำเร็จด้วยปุ่ม Retry', 'success'); break; }
                lastErr = 'กด Retry แล้วดึงคลิปไม่ได้';
              } else { lastErr = (cr && cr.error) || 'กดปุ่ม Retry ไม่ได้'; }
              log('  ⚠️ ' + lastErr + ' — รอบหน้าจะ refresh', 'warning');
              continue; // ไปรอบถัดไป (คี่ = refresh)
            }

            // ── Retry แบบ 2: refresh หน้า Flow แล้วสร้างใหม่ (ล้าง failed clips) ──
            log('  🔄 Refresh หน้า Flow ก่อนสร้างใหม่...', 'info');
            try {
              await sendTab({ action: 'refreshPage' });
              await waitTabComplete(tabId, 20000);
              await sleep(3000);
              for (let p = 0; p < 5; p++) { const pr = await sendTab({ action: 'mergePing' }); if (pr && pr.success) break; await sleep(1000); }
              try { await chrome.tabs.update(tabId, { active: true }); } catch (_) {}
            } catch (rfErr) { log('  ⚠️ refresh มีปัญหา: ' + rfErr.message, 'warning'); }
          }

          // re-apply skip-download ทุก attempt (refresh ทำ flag หาย → คลิปหลุดลงเครื่อง) + clear ค่าเดิม
          await sendTab({ action: 'setSkipDownload', enabled: true });
          await sendTab({ action: 'clearFlowFinalVideo' });

          // v0.6.3: smart retry — มีรูปเดิมแล้ว (รอบก่อนรูปเสร็จ แต่คลิปเฟล) → ข้ามสร้างรูป animate รูปเดิมเลย (แบบ VIP)
          if (reuseImageUrl) { data.skipImageGen = true; data.existingImageUrl = reuseImageUrl; }
          else { data.skipImageGen = false; data.existingImageUrl = ''; }

          const r = await sendTab({ action: 'mergeGenerateScene', data });
          // เก็บ imageUrl ที่รูปสร้างสำเร็จไว้ (แม้คลิปเฟล) → รอบหน้า animate ซ้ำ ไม่สร้างรูปใหม่
          if (r && r.imageUrl) reuseImageUrl = r.imageUrl;
          if (!r || !r.success) {
            lastErr = (r && r.error) || 'ไม่ทราบสาเหตุ';
            if (r && r.flowBlocked) { log('  🚫 Flow บล็อค (unusual activity)', 'error'); state._fail403 = true; }
            log('  ⚠️ ฉาก ' + (i + 1) + ' attempt ' + attempt + ' เฟล: ' + lastErr, 'warning');
            continue;
          }
          const clip = await pullClip();
          if (clip) { gotClip = clip; }
          else { lastErr = 'สร้างคลิปได้แต่ดึงไฟล์ไม่ได้ (hook ไม่จับ)'; log('  ⚠️ ฉาก ' + (i + 1) + ' attempt ' + attempt + ': ' + lastErr, 'warning'); }
        }

        if (userStop) break;

        if (gotClip) {
          clips.push(gotClip.base64);
          consecutiveFails = 0;
          log('  ✅ ฉาก ' + (i + 1) + ' ได้คลิป (' + Math.round((gotClip.size || 0) / 1048576 * 10) / 10 + ' MB)', 'success');
        } else {
          consecutiveFails++;
          log('  ❌ ฉาก ' + (i + 1) + ' เฟลครบ ' + MAX_SCENE_RETRIES + ' รอบ: ' + lastErr + ' — ข้ามฉากนี้', 'error');
          if (consecutiveFails >= 3) throw new Error('เฟลติดกัน 3 ฉาก — หยุด (อาจโดน Flow บล็อคชั่วคราว ลองใหม่ภายหลัง)');
        }

        // v0.7.1: หายใจสุ่ม 4-9 วิ ระหว่างฉาก (ยกเว้นฉากสุดท้าย) — ลดความรัวที่ทำ reCAPTCHA score ดิ่ง
        //   score ร่วงเร็วสุดตอนยิงหลายฉากติดกันในสินค้าเดียว (เจอ 403 หลัง 2-3 สินค้า = สะสมจากตรงนี้)
        if (i < req.scenes.length - 1 && !(await isAborted())) {
          const breath = 4000 + Math.floor(Math.random() * 5000);
          for (let bt = 0; bt < breath && !(await isAborted()); bt += 1000) await sleep(Math.min(1000, breath - bt));
        }
      }
    } finally {
      // ปิด humanized session (detach debugger = yellow bar หาย) + ปิด skip-download
      await sendTab({ action: 'setSkipDownload', enabled: false });
      await chrome.runtime.sendMessage({ action: 'cdpAmbientStop', tabId }).catch(() => {});
      await sendTab({ action: 'mergeUpdateOverlay', hide: true });
    }
    if (clips.length === 0) throw new Error('Merge Mode ไม่ได้คลิปเลย — ลองใหม่ หรือสลับเป็น API Direct');
    return clips;
  }

  // ── เพลงพื้นหลัง: เพลงที่ user อัปโหลดเอง (ก่อน) → ไฟล์ bundle assets/music/<mood>.mp3 ──
  // v0.3: รายชื่อเพลง bundle — เพิ่มเพลงใหม่ → ใส่ชื่อไฟล์ (ไม่มี .mp3) ที่นี่ + เพิ่ม <option> ใน panel.html
  const MUSIC_MOODS = ['upbeat', 'happy', 'cinematic', 'luxury', 'chill', 'calm'];
  let _customMusicBlob = null;
  let _musicCache = {};
  async function loadBgMusic() {
    if (!$('bgMusicToggle').checked) return null;
    if (_customMusicBlob) return _customMusicBlob; // user อัปโหลดเอง = ใช้ตัวนี้ก่อน
    let mood = $('bgMusicMood').value;
    // v0.3: 🎲 สุ่มเพลง — สุ่มใหม่ทุกครั้งที่เรียก (= ต่อคลิป) จากเพลงที่มี
    if (mood === 'random') {
      mood = MUSIC_MOODS[Math.floor(Math.random() * MUSIC_MOODS.length)];
      log('🎲 สุ่มเพลง: ' + mood, 'info');
    }
    if (_musicCache[mood]) return _musicCache[mood]; // v0.6.4: cache เฉพาะที่โหลดสำเร็จ (เดิม cache null ถาวร → mood ที่พลาดครั้งเดียวจะไม่มีเพลงตลอด)
    try {
      const res = await fetch(chrome.runtime.getURL('assets/music/' + mood + '.mp3'));
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const blob = await res.blob();
      if (!blob || blob.size < 1000) throw new Error('ไฟล์ว่าง/เล็กผิดปกติ (' + (blob ? blob.size : 0) + ')');
      _musicCache[mood] = blob;
      log('🎵 เพลง ' + mood + ' พร้อม (' + Math.round(blob.size / 1024) + ' KB)', 'info'); // diagnostic: เห็นว่าโหลดได้ต่อสินค้า
      return blob;
    } catch (e) {
      log('🎵 โหลดเพลง ' + mood + ' ไม่ได้ (' + e.message + ') — คลิปนี้จะไม่มีเพลง', 'error'); // ไม่ cache → สินค้าถัดไปลองใหม่
      return null;
    }
  }

  // ── เสียงเอฟเฟกต์ (bundle assets/sfx/<name>.mp3) ──
  let _sfxCache = {};
  async function loadSfx() {
    if (!$('sfxToggle').checked) return null;
    const name = $('sfxSound').value;
    if (_sfxCache[name] !== undefined) return _sfxCache[name];
    try {
      const res = await fetch(chrome.runtime.getURL('assets/sfx/' + name + '.mp3'));
      if (!res.ok) throw new Error('no file');
      _sfxCache[name] = await res.blob();
    } catch (e) { _sfxCache[name] = null; }
    return _sfxCache[name];
  }

  // ── Settings ─────────────────────────────────────────────────────
  // v0.3: auto-save ทุกการแก้ค่าบนหน้าสร้างโฆษณา (ไม่ต้องกดบันทึก) + กัน save ระหว่าง restore
  let _restoring = false;
  let _autosaveTimer = null;
  function scheduleAutosave() {
    if (_restoring) return;
    clearTimeout(_autosaveTimer);
    _autosaveTimer = setTimeout(() => { try { saveSettings(); } catch (_) {} }, 700);
  }

  function restoreSettings() {
    chrome.storage.local.get(['pdMiniSettings'], (r) => {
      const s = r && r.pdMiniSettings;
      if (!s) return;
      _restoring = true; // กัน autosave ยิงตอน dispatch change ระหว่างคืนค่า
      if (s.apiKey) $('apiKeyInput').value = s.apiKey;
      ['adStructure', 'sceneCount', 'aspectRatio', 'clipQuality', 'imageModelSel', 'videoModelSel', 'maxRetries', 'visualMood', 'coverFontStyle', 'voiceSpeed',
       'ttsProvider', 'vcApiKey',
       'outputMode', 'loopCount', 'setDelay', 'bgMusicMood', 'genEngine',
       'subFont', 'subAnim', 'subSize', 'subOutline', 'subSplit', 'subPos',
       'bgMusicVolume', 'sfxSound', 'sfxVolume',
       'schedHour', 'schedMinute', 'schedInterval', 'schedRandMin', 'schedRandMax', 'postHashtags', 'omniSecondsSel'].forEach((id) => { // v0.3.1/0.4/0.6.7
        if (s[id] !== undefined && $(id)) {
          $(id).value = s[id];
          $(id).dispatchEvent(new Event('input'));
          $(id).dispatchEvent(new Event('change'));
        }
      });
      // v0.4: คืนค่าตั้งค่าการโพส (radio + checkbox)
      if (s.postType) { const r = document.querySelector('input[name="postType"][value="' + s.postType + '"]'); if (r) { r.checked = true; r.dispatchEvent(new Event('change')); } }
      if (s.discloseType) { const r = document.querySelector('input[name="discloseType"][value="' + s.discloseType + '"]'); if (r) r.checked = true; }
      if (s.schedRandom !== undefined && $('schedRandom')) { $('schedRandom').checked = s.schedRandom; $('schedRandom').dispatchEvent(new Event('change')); }
      if (s.postAIContent !== undefined && $('postAIContent')) $('postAIContent').checked = s.postAIContent;
      if (s.postDisclose !== undefined && $('postDisclose')) { $('postDisclose').checked = s.postDisclose; $('postDisclose').dispatchEvent(new Event('change')); }
      if (s.postNoCaption !== undefined && $('postNoCaption')) $('postNoCaption').checked = s.postNoCaption;
      if (s.aiBasketName !== undefined && $('aiBasketName')) $('aiBasketName').checked = s.aiBasketName;
      // v0.3.1: คืนเปิด/ปิด SFX + sync การแสดงผลกล่อง option ของเพลง/SFX
      if (s.sfx !== undefined && $('sfxToggle')) {
        $('sfxToggle').checked = s.sfx;
        if ($('sfxOptions')) $('sfxOptions').style.display = s.sfx ? 'flex' : 'none';
      }
      // v0.3: 'review' ถูกปิดชั่วคราว (Phase 2 ยังไม่ทำ) — ค่าเก่าที่เคยเซฟ → บังคับเป็น save
      if ($('outputMode') && $('outputMode').value === 'review') $('outputMode').value = 'save';
      if (s.voice) state.voice = s.voice;
      if (s.subStyle) {
        state.subStyle = s.subStyle;
        document.querySelectorAll('.sub-style').forEach((x) =>
          x.classList.toggle('selected', x.dataset.style === s.subStyle));
      }
      if (s.bgMusic !== undefined) {
        $('bgMusicToggle').checked = s.bgMusic;
        if ($('bgMusicOptions')) $('bgMusicOptions').style.display = s.bgMusic ? 'block' : 'none'; // v0.3.1: sync กล่อง option
      }
      if (s.silenceCut !== undefined) $('silenceCutToggle').checked = s.silenceCut;
      // ✍️ กราฟิกลายมือ (Handwritten Overlay)
      if (s.hwOverlay !== undefined) { state.hwOverlay = s.hwOverlay; if ($('hwOverlayToggle')) $('hwOverlayToggle').checked = s.hwOverlay; }
      if (s.newProjectEachSet !== undefined && $('newProjectEachSet')) $('newProjectEachSet').checked = s.newProjectEachSet; // v0.2
      // v0.2: คืนค่าติ๊กสุ่มโครงเรื่อง + โชว์ pool ถ้าเลือกสุ่ม
      if (Array.isArray(s.structurePool)) {
        document.querySelectorAll('.structure-pool-cb').forEach((c) => {
          c.checked = s.structurePool.includes(c.value);
        });
      }
      if ($('adStructure')) {
        const sp = $('structureRandomPool');
        if (sp) sp.style.display = $('adStructure').value === 'random' ? 'block' : 'none';
      }
      // v0.2: คืนค่าติ๊กสุ่มจำนวนฉาก + โชว์ pool ถ้าเลือกสุ่ม
      if (Array.isArray(s.scenePool)) {
        document.querySelectorAll('.scene-pool-cb').forEach((c) => {
          c.checked = s.scenePool.includes(parseInt(c.value));
        });
      }
      if ($('sceneCount')) {
        const sp = $('sceneRandomPool');
        if (sp) sp.style.display = $('sceneCount').value === 'random' ? 'block' : 'none';
      }
      // v0.2: คืนค่าตัวละครหลัก
      if (s.character) {
        state.character = Object.assign({ enabled: false, image: '', gender: 'female', desc: '' }, s.character);
        if ($('charToggle')) $('charToggle').checked = state.character.enabled;
        if ($('charOptions')) $('charOptions').style.display = state.character.enabled ? 'block' : 'none';
        if ($('charGender')) $('charGender').value = state.character.gender || 'female';
        if ($('charDesc')) $('charDesc').value = state.character.desc || '';
        if (state.character.image && $('charPreview')) {
          $('charPreview').src = state.character.image;
          $('charPreview').style.display = 'block';
          if ($('charPlaceholder')) $('charPlaceholder').style.display = 'none';
        }
      }
      renderVoices();
      updateSummary();
      _restoring = false; // คืนค่าเสร็จ — เปิด autosave
    });
  }

  function saveSettings() {
    const s = {
      apiKey: $('apiKeyInput').value.trim(),
      voice: state.voice,
      subStyle: state.subStyle,
      hwOverlay: state.hwOverlay, // ✍️ กราฟิกลายมือ (Handwritten Overlay)
      bgMusic: $('bgMusicToggle').checked,
      sfx: $('sfxToggle') ? $('sfxToggle').checked : false, // v0.3.1: จำเปิด/ปิด SFX
      silenceCut: $('silenceCutToggle').checked,
      character: state.character, // v0.2: เก็บตัวละคร (รูป base64 + เพศ + รายละเอียด)
      scenePool: Array.from(document.querySelectorAll('.scene-pool-cb:checked')).map((c) => parseInt(c.value)), // v0.2
      structurePool: Array.from(document.querySelectorAll('.structure-pool-cb:checked')).map((c) => c.value), // v0.2
      newProjectEachSet: $('newProjectEachSet') ? $('newProjectEachSet').checked : true, // v0.2
      // v0.4: ตั้งค่าการโพส
      postType: (document.querySelector('input[name="postType"]:checked') || {}).value || 'postNow',
      discloseType: (document.querySelector('input[name="discloseType"]:checked') || {}).value || 'your_brand',
      schedRandom: $('schedRandom') ? $('schedRandom').checked : false,
      postAIContent: $('postAIContent') ? $('postAIContent').checked : true,
      postDisclose: $('postDisclose') ? $('postDisclose').checked : false,
      postNoCaption: $('postNoCaption') ? $('postNoCaption').checked : false,
      aiBasketName: $('aiBasketName') ? $('aiBasketName').checked : false,
    };
    ['adStructure', 'sceneCount', 'aspectRatio', 'clipQuality', 'imageModelSel', 'videoModelSel', 'maxRetries', 'visualMood', 'coverFontStyle', 'voiceSpeed',
     'ttsProvider', 'vcApiKey',
     'outputMode', 'loopCount', 'setDelay', 'bgMusicMood', 'genEngine',
     'subFont', 'subAnim', 'subSize', 'subOutline', 'subSplit', 'subPos',
     'bgMusicVolume', 'sfxSound', 'sfxVolume',
     'schedHour', 'schedMinute', 'schedInterval', 'schedRandMin', 'schedRandMax', 'postHashtags', 'omniSecondsSel'].forEach((id) => { if ($(id)) s[id] = $(id).value; }); // v0.3.1/0.4/0.6.7: + โมเดล/รีทาย/ซับใหม่
    chrome.storage.local.set({ pdMiniSettings: s });
  }

  // ── Events ───────────────────────────────────────────────────────
  function bindEvents() {
    // v0.3: ตั้งค่า = popup modal (เปิด/ปิด + คลิกนอกกล่องปิด)
    const sModal = $('settingsModal');
    const openSettings = () => { if (sModal) sModal.style.display = 'flex'; };
    const closeSettings = () => { if (sModal) sModal.style.display = 'none'; };
    $('settingsBtn').addEventListener('click', openSettings);
    if ($('settingsClose')) $('settingsClose').addEventListener('click', closeSettings);
    if (sModal) sModal.addEventListener('click', (e) => { if (e.target === sModal) closeSettings(); });
    $('saveSettingsBtn').addEventListener('click', () => {
      saveSettings();
      log('💾 บันทึกตั้งค่าแล้ว', 'success');
      closeSettings();
    });
    const cu = $('checkUpdateBtn');
    if (cu) cu.addEventListener('click', () => checkForUpdate(true));

    // v0.3: แถบสลับโหมด — "รวมคลิปเอง" เปิดหน้าเต็มจอแยก (auto tab = อยู่ในแผงนี้แล้ว)
    const clipTab = $('modeClipTab');
    if (clipTab) clipTab.addEventListener('click', () => chrome.tabs.create({ url: chrome.runtime.getURL('panel/clipmerge.html') }));

    // v0.2: ตัวละครหลัก — toggle / อัปโหลดรูป / เพศ / รายละเอียด
    const charToggle = $('charToggle');
    if (charToggle) charToggle.addEventListener('change', () => {
      state.character.enabled = charToggle.checked;
      $('charOptions').style.display = charToggle.checked ? 'block' : 'none';
      updateSummary();
    });
    const charUpload = $('charUpload'), charInput = $('charFileInput');
    if (charUpload && charInput) {
      charUpload.addEventListener('click', () => charInput.click());
      charInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          state.character.image = ev.target.result;
          const pv = $('charPreview'), ph = $('charPlaceholder');
          if (pv) { pv.src = ev.target.result; pv.style.display = 'block'; }
          if (ph) ph.style.display = 'none';
          log('🧑 แนบรูปตัวละครหลักแล้ว — จะใช้ทุกคลิป', 'success');
          scheduleAutosave(); // v0.3: เซฟรูปตัวละคร (โหลดเสร็จแบบ async ต้องเซฟตรงนี้)
        };
        reader.readAsDataURL(file);
      });
    }
    // v0.2: สุ่มโครงเรื่อง — โชว์ช่องติ๊ก pool เมื่อเลือก "สุ่ม"
    const structSel = $('adStructure');
    if (structSel) {
      const toggleStructPool = () => {
        const pool = $('structureRandomPool');
        if (pool) pool.style.display = structSel.value === 'random' ? 'block' : 'none';
      };
      structSel.addEventListener('change', toggleStructPool);
      toggleStructPool();
    }

    // v0.2: สุ่มจำนวนฉาก — โชว์ช่องติ๊ก pool เมื่อเลือก "สุ่ม"
    const sceneSel = $('sceneCount');
    if (sceneSel) {
      const toggleScenePool = () => {
        const pool = $('sceneRandomPool');
        if (pool) pool.style.display = sceneSel.value === 'random' ? 'block' : 'none';
      };
      sceneSel.addEventListener('change', toggleScenePool);
      toggleScenePool();
    }

    const charGender = $('charGender');
    if (charGender) charGender.addEventListener('change', () => { state.character.gender = charGender.value; });
    const charDesc = $('charDesc');
    if (charDesc) charDesc.addEventListener('input', () => { state.character.desc = charDesc.value; });
    // ✍️ กราฟิกลายมือ (Handwritten Overlay) — sync state + autosave
    const hwOverlayToggle = $('hwOverlayToggle');
    if (hwOverlayToggle) hwOverlayToggle.addEventListener('change', () => { state.hwOverlay = hwOverlayToggle.checked; scheduleAutosave(); });
    // ⏱️ Omni Flash: โชว์ dropdown จำนวนวินาที เฉพาะตอนเลือก Omni Flash
    const _syncOmniSecUI = () => { const w = $('omniSecondsWrap'); if (w) w.style.display = ($('videoModelSel') && $('videoModelSel').value === 'omni_flash') ? 'flex' : 'none'; };
    const videoModelSelEl = $('videoModelSel');
    if (videoModelSelEl) videoModelSelEl.addEventListener('change', _syncOmniSecUI);
    _syncOmniSecUI();
    document.querySelectorAll('.api-eye').forEach((btn) => {
      btn.addEventListener('click', () => {
        const input = $(btn.dataset.target);
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.textContent = show ? '🙈' : '👁️';
      });
    });

    // ① สินค้า
    $('fetchBasketBtn').addEventListener('click', fetchBasket);
    $('pickFullBtn').addEventListener('click', () => {
      // เปิดหน้าเลือกเต็มจอจากข้อมูลที่ดึงไว้ล่าสุด (ไม่ต้องดึงใหม่)
      chrome.storage.local.get('pdMiniShowcase', (r) => {
        const items = (r.pdMiniShowcase && r.pdMiniShowcase.products) || [];
        if (!items.length) { log('⚠️ ยังไม่เคยดึงสินค้า — กด "🔄 ดึงจากตะกร้า" ก่อน', 'error'); return; }
        openFullPicker();
      });
    });
    $('clearProductsBtn').addEventListener('click', () => {
      state.products = [];
      renderProducts();
      updateSummary();
    });

    // ② วิธีสร้างคลิป — โชว์คำเตือน Merge Mode
    const ge = $('genEngine'), mh = $('mergeHint');
    if (ge && mh) {
      const upd = () => { mh.style.display = ge.value === 'merge' ? 'block' : 'none'; };
      ge.addEventListener('change', upd);
      upd();
    }

    // ③ ระบบเสียงพากย์ — สลับ gemini/voiceclone (โชว์/ซ่อนช่องตามที่เลือก)
    const tp = $('ttsProvider');
    if (tp) {
      const syncTts = () => {
        const clone = tp.value === 'voiceclone';
        if ($('voiceCloneOptions')) $('voiceCloneOptions').style.display = clone ? 'block' : 'none';
        if ($('geminiVoiceBox')) $('geminiVoiceBox').style.display = clone ? 'none' : 'block';
        if ($('geminiHint')) $('geminiHint').style.display = clone ? 'none' : 'block';
        updateSummary();
      };
      tp.addEventListener('change', syncTts);
      syncTts();
    }
    // ลิงก์ไปสมัคร/รับ API key ที่เว็บ VoiceClone (ชี้ไปเซิร์ฟเวอร์เดียวกับที่ฝังไว้)
    const vcLink = $('vcSignupLink');
    if (vcLink) vcLink.href = DEFAULT_VC_SERVER;

    // ปุ่มทดสอบเชื่อมต่อ VoiceClone + ฟังเสียงตัวอย่าง
    const vcTest = $('vcTestBtn');
    if (vcTest) vcTest.addEventListener('click', async () => {
      const orig = vcTest.textContent;
      vcTest.disabled = true; vcTest.textContent = '⏳ กำลังทดสอบ...';
      try {
        const r = await window.PDMiniTTS.synthesizeClone('สวัสดีค่ะ นี่คือตัวอย่างเสียงพากย์โฆษณา จากระบบเสียงโคลน', getVoiceCloneCfg());
        new Audio(URL.createObjectURL(r.blob)).play();
        log('🎙️ เชื่อมต่อ VoiceClone สำเร็จ — ได้เสียง ' + r.durationSec + ' วิ', 'success');
      } catch (e) {
        log('🔌 ทดสอบ VoiceClone ไม่สำเร็จ: ' + e.message, 'error');
      }
      vcTest.disabled = false; vcTest.textContent = orig;
    });

    // ④
    bindSubStyles();
    $('bgMusicToggle').addEventListener('change', () => {
      $('bgMusicOptions').style.display = $('bgMusicToggle').checked ? 'block' : 'none';
    });
    // อัปโหลดเพลงเอง
    $('uploadMusicBtn').addEventListener('click', () => $('musicFileInput').click());
    $('musicFileInput').addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      _customMusicBlob = f;
      $('customMusicName').textContent = '🎵 ' + f.name;
      log('🎵 ตั้งเพลง: ' + f.name, 'success');
    });

    // summary live update
    ['adStructure', 'sceneCount', 'aspectRatio', 'clipQuality', 'visualMood', 'coverFontStyle', 'outputMode', 'loopCount', 'setDelay']
      .forEach((id) => $(id).addEventListener('change', () => { updateSummary(); saveSettings(); }));

    // v0.4: ตั้งค่าการโพส — โชว์/ซ่อนกล่อง+ตั้งเวลา+disclosure ตามที่เลือก + ปุ่มวันที่
    (function setupPostOptions() {
      const om = $('outputMode'), box = $('postOptions');
      const fmtDate = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      const syncBox = () => { if (box) box.style.display = (om.value === 'post' || om.value === 'post_save') ? 'block' : 'none'; };
      om.addEventListener('change', syncBox); syncBox();
      const syncSched = () => {
        const v = (document.querySelector('input[name="postType"]:checked') || {}).value;
        if ($('scheduleSettings')) $('scheduleSettings').style.display = v === 'schedule' ? 'block' : 'none';
      };
      document.querySelectorAll('input[name="postType"]').forEach((r) => r.addEventListener('change', () => { syncSched(); updateSummary(); }));
      syncSched();
      if ($('schedRandom')) {
        const s = () => { if ($('schedRandomRow')) $('schedRandomRow').style.display = $('schedRandom').checked ? 'flex' : 'none'; };
        $('schedRandom').addEventListener('change', s); s();
      }
      if ($('postDisclose')) {
        const s = () => { if ($('discloseOptions')) $('discloseOptions').style.display = $('postDisclose').checked ? 'flex' : 'none'; };
        $('postDisclose').addEventListener('change', s); s();
      }
      if ($('schedToday')) $('schedToday').addEventListener('click', () => { $('schedDate').value = fmtDate(new Date()); saveSettings(); });
      if ($('schedTomorrow')) $('schedTomorrow').addEventListener('click', () => { const t = new Date(); t.setDate(t.getDate() + 1); $('schedDate').value = fmtDate(t); saveSettings(); });
    })();

    // ⑤
    const stop = () => {
      state.running = false;
      state._stopped = true;
      // ส่งสัญญาณหยุดไป content script + ม่านบนหน้า Flow
      try { chrome.storage.local.set({ pdFootageStop: true }); } catch (e) {}
      // v0.6.1: ล้าง flag "กำลังรัน" ทันที — กันม่าน auto-reshow โผล่ทุกครั้งที่รีเฟรชหน้า Flow หลังหยุด
      try { chrome.storage.local.remove('pdFootageRunning'); } catch (e) {}
      // v0.6.1: หยุด "ทันที" (in-memory flag — ไม่รอฉากจบ) + สั่งปิดม่านบนหน้า Flow เดี๋ยวนั้นเลย
      (async () => {
        try {
          const t = (await chrome.tabs.query({ url: ['https://labs.google/*', 'https://flow.google.com/*'] }))[0];
          if (t) {
            chrome.tabs.sendMessage(t.id, { action: 'pdFootageStopNow' }).catch(() => {});
            chrome.tabs.sendMessage(t.id, { action: 'pdHideCurtain' }).catch(() => {});
          }
        } catch (_) {}
      })();
      log('⛔ กำลังหยุด... (ยกเลิกทันที — รอ ~2-3 วิให้ฉากปัจจุบันถอยจบ แล้วค่อยกดเริ่มใหม่)', 'error');
      // v0.6.1: ไม่เปิดปุ่ม Start ที่นี่ — ปล่อยให้ loop เดิม unwind จบใน finally ก่อน (กันกดรันซ้อนตอนตัวเก่ายังไม่ตาย)
      $('stopBtn').disabled = true;
      showRunOverlay(false);
    };
    $('startBtn').addEventListener('click', () => { state._stopped = false; startRun(); });
    $('stopBtn').addEventListener('click', stop);
    $('roStop').addEventListener('click', stop);
    // v0.6.3: ปุ่ม FAB คลิปสอนใช้งาน — เปิดผ่าน chrome.tabs.create (ชัวร์กว่า <a> ในแผง side panel)
    if ($('pdTutorialFab')) $('pdTutorialFab').addEventListener('click', (e) => {
      e.preventDefault();
      try { chrome.tabs.create({ url: 'https://youtu.be/XB8S_nqZ5ws' }); } catch (_) { window.open('https://youtu.be/XB8S_nqZ5ws', '_blank'); }
    });
    $('sumClose').addEventListener('click', () => $('summaryOverlay').classList.remove('show'));
    $('clearLogBtn').addEventListener('click', () => { $('logBody').innerHTML = ''; });

    // ค่าตัวเลขข้างสไลเดอร์เสียงเพลง + เอฟเฟกต์
    const volLabel = () => { const el = $('bgMusicVolLabel'); if (el) el.textContent = $('bgMusicVolume').value + '%'; };
    $('bgMusicVolume').addEventListener('input', volLabel);
    volLabel();
    const sfxVolLabel = () => { const el = $('sfxVolLabel'); if (el) el.textContent = $('sfxVolume').value + '%'; };
    $('sfxVolume').addEventListener('input', sfxVolLabel);
    sfxVolLabel();
    $('sfxToggle').addEventListener('change', () => {
      $('sfxOptions').style.display = $('sfxToggle').checked ? 'flex' : 'none';
    });

    // v0.3: 💾 auto-save ทุกการแก้ค่า — change/input (dropdown/slider/checkbox/text) + click (การ์ดสไตล์/เสียง/pool)
    //   bubble phase = handler ของ element ทำงานก่อน (state.* อัปเดตแล้ว) → saveSettings อ่านค่าถูก · debounce กันยิงถี่
    document.addEventListener('change', scheduleAutosave);
    document.addEventListener('input', scheduleAutosave);
    document.addEventListener('click', (e) => {
      if (e.target.closest('.sub-style, .voice-item, .scene-pool-chip, .struct-pool-chip, #charToggle')) scheduleAutosave();
    });
  }

  // =================================================================
  // Phase 2: ดึงสินค้าตะกร้า TikTok จริง (API ตรง — port จาก PD Auto VIP)
  // =================================================================
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function waitTabComplete(tabId, timeoutMs) {
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        try { chrome.tabs.onUpdated.removeListener(listener); } catch (e) {}
        resolve();
      };
      const listener = (id, info) => { if (id === tabId && info.status === 'complete') finish(); };
      chrome.tabs.onUpdated.addListener(listener);
      setTimeout(finish, timeoutMs);
    });
  }

  // ════════════════════════════════════════════════════════════════════
  // 📤 โพส TikTok อัตโนมัติ (Phase 1) — port กลไกที่พิสูจน์แล้วจากบอทหลัก
  //   อัปวิดีโอ (chunk) → tiktok-content → กรอก caption/แฮชแท็ก/ปักตะกร้า → โพส
  // ════════════════════════════════════════════════════════════════════
  const TT_UPLOAD_URL = 'https://www.tiktok.com/tiktokstudio/upload';

  // หา/เปิดแท็บหน้า upload + inject content script (แบบเดียวกับ fetchBasket)
  async function ttOpenUploadTab() {
    let tab = (await chrome.tabs.query({
      url: ['https://www.tiktok.com/tiktokstudio/upload*', 'https://tiktok.com/tiktokstudio/upload*'],
    }))[0];
    if (!tab) {
      // มีแท็บ studio อื่น → navigate ไป upload
      tab = (await chrome.tabs.query({
        url: ['https://www.tiktok.com/tiktokstudio/*', 'https://tiktok.com/tiktokstudio/*'],
      }))[0];
      if (tab) {
        await chrome.tabs.update(tab.id, { active: true, url: TT_UPLOAD_URL });
      } else {
        tab = await chrome.tabs.create({ url: TT_UPLOAD_URL, active: true });
      }
      await waitTabComplete(tab.id, 30000);
      await sleep(3500); // เผื่อ React mount
    } else {
      await chrome.tabs.update(tab.id, { active: true });
    }
    // inject content script (ตัว script กัน inject ซ้ำเอง) + รอ ready
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content/tiktok-content.js'] }).catch(() => {});
    await sleep(500);
    return tab.id;
  }

  function ttSend(tabId, msg) {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, msg, (resp) => {
        if (chrome.runtime.lastError) { resolve({ success: false, error: chrome.runtime.lastError.message }); return; }
        resolve(resp);
      });
    });
  }

  async function ttEnsureReady(tabId, tries) {
    for (let i = 0; i < (tries || 25); i++) {
      const r = await ttSend(tabId, { action: 'ping' });
      if (r && r.pong) return true;
      await sleep(800);
    }
    return false;
  }

  function blobToBase64(blob) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(String(fr.result).split(',')[1]);
      fr.onerror = rej;
      fr.readAsDataURL(blob);
    });
  }

  // อัปวิดีโอ base64 → tiktok-content (chunk 10MB ถ้าไฟล์ใหญ่)
  async function ttUploadBase64(tabId, base64, filename) {
    const CHUNK = 10 * 1024 * 1024;
    if (base64.length <= CHUNK) {
      const r = await ttSend(tabId, { action: 'uploadVideoFromBase64', base64, filename });
      if (r && r.success) return r;
      throw new Error((r && r.error) || 'อัพโหลดไม่สำเร็จ');
    }
    const transferId = Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const total = Math.ceil(base64.length / CHUNK);
    let r = await ttSend(tabId, { action: 'videoChunkStart', transferId, filename, totalChunks: total });
    if (!r || !r.success) throw new Error('เริ่มส่งไฟล์ไม่สำเร็จ: ' + ((r && r.error) || ''));
    for (let i = 0; i < total; i++) {
      const data = base64.slice(i * CHUNK, Math.min((i + 1) * CHUNK, base64.length));
      r = await ttSend(tabId, { action: 'videoChunk', transferId, chunkIndex: i, data });
      if (!r || !r.success) throw new Error('ส่งไฟล์ชิ้นที่ ' + (i + 1) + '/' + total + ' ไม่สำเร็จ');
    }
    r = await ttSend(tabId, { action: 'videoChunkEnd', transferId, filename });
    if (r && r.success) return r;
    throw new Error((r && r.error) || 'อัพโหลดไม่สำเร็จ (chunk)');
  }

  // สั่งโพส + รอผล (tiktok-content ตอบ received ทันที แล้วยิง tiktokPostComplete ตอนเสร็จ)
  function ttPostAndWait(tabId, data, timeout) {
    return new Promise((resolve) => {
      let done = false;
      const to = setTimeout(() => {
        if (done) return; done = true;
        try { chrome.runtime.onMessage.removeListener(lis); } catch (e) {}
        resolve({ success: false, error: 'หมดเวลา — เช็คหน้า TikTok' });
      }, timeout || 180000);
      const lis = (m) => {
        if (m && m.action === 'tiktokPostComplete' && !done) {
          done = true; clearTimeout(to);
          try { chrome.runtime.onMessage.removeListener(lis); } catch (e) {}
          resolve({ success: !!m.success, error: m.error });
        }
      };
      chrome.runtime.onMessage.addListener(lis);
      ttSend(tabId, { action: 'postToTikTok', data }).then((r) => {
        // ส่งคำสั่งไม่ถึง content (ไม่มี received) → ล้มทันที
        if (!done && r && r.received !== true && r.success === false) {
          done = true; clearTimeout(to);
          try { chrome.runtime.onMessage.removeListener(lis); } catch (e) {}
          resolve({ success: false, error: r.error || 'ส่งคำสั่งโพสไม่สำเร็จ' });
        }
      });
    });
  }

  // อ่านตั้งค่าการโพสจาก UI (v0.4)
  function readPostConfig() {
    return {
      postType: (document.querySelector('input[name="postType"]:checked') || {}).value || 'postNow',
      userHashtags: ($('postHashtags') ? $('postHashtags').value : '').trim(),
      enableAIContent: $('postAIContent') ? $('postAIContent').checked : true,
      enableDisclose: $('postDisclose') ? $('postDisclose').checked : false,
      discloseType: (document.querySelector('input[name="discloseType"]:checked') || {}).value || 'your_brand',
      noCaption: $('postNoCaption') ? $('postNoCaption').checked : false,
      scheduleDate: '', scheduleTime: '',
    };
  }

  // คำนวณวัน-เวลาตั้งโพสของคลิปถัดไป (บวกสะสม + สุ่มได้) — advance state._schedOffsetMin
  function computeSchedule() {
    const baseDate = ($('schedDate') && $('schedDate').value) || (() => {
      const t = new Date(); return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
    })();
    const h = parseInt($('schedHour').value) || 9;
    const m = parseInt($('schedMinute').value) || 0;
    const d = new Date(baseDate + 'T00:00:00');
    d.setHours(h, m + (state._schedOffsetMin || 0), 0, 0);
    // บวก gap สำหรับคลิปถัดไป (สุ่ม หรือ คงที่)
    let gap;
    if ($('schedRandom') && $('schedRandom').checked) {
      const mn = parseInt($('schedRandMin').value) || 20;
      const mx = Math.max(mn, parseInt($('schedRandMax').value) || 60);
      gap = mn + Math.floor(Math.random() * (mx - mn + 1));
    } else {
      gap = parseInt($('schedInterval').value) || 30;
    }
    state._schedOffsetMin = (state._schedOffsetMin || 0) + gap;
    const date = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const time = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    return { date, time };
  }

  // โพสคลิป 1 ตัว — return {success, error}
  async function postClipToTikTok(mp4Blob, product, scenes, safeName, apiKey, postCfg) {
    postCfg = postCfg || readPostConfig();
    const tabId = await ttOpenUploadTab();
    const ready = await ttEnsureReady(tabId);
    if (!ready) throw new Error('เปิดหน้า TikTok Studio ไม่สำเร็จ — ล็อกอิน TikTok ก่อน');
    log('  ⬆️ อัปวิดีโอขึ้น TikTok Studio...');
    const b64 = await blobToBase64(mp4Blob);
    await ttUploadBase64(tabId, b64, safeName + '.mp4');
    // caption = ฮุก (บทฉากแรก) ถ้ามี ไม่งั้นชื่อสินค้า · ถ้าติ๊ก "ไม่ใส่แคปชั่น" → เว้นว่าง
    const caption = postCfg.noCaption ? '' : String((scenes && scenes[0] && scenes[0].voice) || product.name || '').trim().slice(0, 150);
    // แฮชแท็ก: ถ้า user กรอกเอง → ใช้ของ user · ไม่งั้น AI คิดจากชื่อสินค้า (fallback แท็กทั่วไป)
    let tags;
    if (postCfg.userHashtags) {
      tags = (postCfg.userHashtags.match(/#[^\s#]+/g)) || postCfg.userHashtags.split(/\s+/).filter(Boolean).map((t) => t[0] === '#' ? t : '#' + t);
    } else {
      tags = ['#fyp', '#ของมันต้องมี', '#ติ๊กต๊อกช้อป'];
      try { tags = await window.PDMiniAI.generateHashtags(product, apiKey); } catch (e) {}
    }
    log('  🏷️ แฮชแท็ก: ' + tags.join(' '));
    // v0.6.4: 🤖 ถ้าติ๊ก "AI คิดชื่อตะกร้า" → ให้ AI แต่งชื่อตะกร้าใหม่จากชื่อสินค้า (ไม่ติ๊ก = ใช้ชื่อสินค้าเดิม)
    let basketLabel = product.basketName || product.name || '';
    if ($('aiBasketName') && $('aiBasketName').checked && product.name) {
      try {
        const aiName = await window.PDMiniAI.generateBasketName(product.name, apiKey);
        if (aiName) { basketLabel = aiName; log('  🤖 ชื่อตะกร้า (AI): ' + aiName); }
      } catch (e) {}
    }
    log('  📝 กรอก caption + ปักตะกร้า + ' + (postCfg.postType === 'saveDraft' ? 'บันทึกร่าง' : postCfg.postType === 'schedule' ? 'ตั้งเวลา' : 'โพส') + '...');
    const pr = await ttPostAndWait(tabId, {
      caption,
      hashtags: tags,
      productId: product.productId || '',
      productLinkName: basketLabel,
      skipUpload: true,   // อัปไปแล้วด้านบน
      saveDraft: postCfg.postType === 'saveDraft',
      postNow: postCfg.postType === 'postNow',
      scheduleDate: postCfg.scheduleDate || '',
      scheduleTime: postCfg.scheduleTime || '',
      enableAIContent: postCfg.enableAIContent !== false,
      enableDisclose: !!postCfg.enableDisclose,
      discloseType: postCfg.discloseType || 'your_brand',
    }, 180000);
    // สลับกลับแท็บ Flow ให้สินค้าถัดไป (เลียนแบบ VIP กัน 403)
    try {
      const ft = (await chrome.tabs.query({ url: ['https://labs.google/*', 'https://flow.google.com/*'] }))[0];
      if (ft) await chrome.tabs.update(ft.id, { active: true });
    } catch (e) {}
    return pr;
  }

  async function fetchBasket() {
    const btn = $('fetchBasketBtn');
    btn.disabled = true;
    btn.textContent = '⏳ กำลังดึงสินค้า...';
    try {
      // 1) หา/เปิดแท็บ TikTok Studio (เปิดให้อัตโนมัติถ้าไม่มี — แบบ v4.6)
      log('🔍 ค้นหาแท็บ TikTok Studio...');
      let tab = (await chrome.tabs.query({
        url: ['https://www.tiktok.com/tiktokstudio/*', 'https://tiktok.com/tiktokstudio/*'],
      }))[0];
      if (!tab) {
        log('🆕 ไม่พบ — เปิด TikTok Studio ให้อัตโนมัติ...');
        tab = await chrome.tabs.create({ url: 'https://www.tiktok.com/tiktokstudio/content', active: false });
        await waitTabComplete(tab.id, 25000);
        await sleep(3000);
      }

      // 2) inject content script (กัน inject ซ้ำในตัว script เอง)
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content/mini-tiktok.js'] }).catch(() => {});
      await sleep(400);

      // 3) สั่งดึง — ผลลัพธ์ลง storage (เลี่ยง message ก้อนใหญ่)
      log('🔌 กำลังดึงสินค้าจาก Showcase API...');
      const resp = await chrome.tabs.sendMessage(tab.id, { action: 'miniFetchShowcase', limit: 100 })
        .catch((e) => ({ success: false, error: e.message }));
      if (!resp || !resp.success) {
        throw new Error((resp && resp.error) || 'ไม่ตอบกลับ — เช็คว่าล็อกอิน TikTok แล้ว ลองใหม่อีกครั้ง');
      }
      log('✅ ดึงสำเร็จ ' + resp.count + ' สินค้า — เปิดหน้าเลือกเต็มจอให้แล้ว', 'success');
      openFullPicker();
    } catch (e) {
      log('❌ ' + e.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '🔄 ดึงจากตะกร้า TikTok';
    }
  }

  // ── หน้าเลือกสินค้าเต็มจอ (v0.2.1 — user: modal ในแผงแคบไป) ─────
  function openFullPicker() {
    chrome.tabs.create({ url: chrome.runtime.getURL('panel/picker.html'), active: true });
  }

  // รับผลเลือกจากหน้าเต็มจอ → แปลงรูป base64 ทันที (ลิงก์ CDN หมดอายุได้) → ลง state
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.pdMiniPickResult) return;
    const res = changes.pdMiniPickResult.newValue;
    if (!res || !Array.isArray(res.ids)) return;
    chrome.storage.local.remove('pdMiniPickResult');
    chrome.storage.local.get('pdMiniShowcase', async (r) => {
      const all = (r.pdMiniShowcase && r.pdMiniShowcase.products) || [];
      const chosen = all.filter((p) => res.ids.includes(p.productId)).slice(0, 10);
      if (!chosen.length) return;
      log('🖼️ รับ ' + chosen.length + ' สินค้าจากหน้าเต็มจอ — กำลังโหลดรูป...');
      const picks = res.imagePicks || {};
      state.products = [];
      for (const p of chosen) {
        let img = '';
        const useUrl = picks[p.productId] || p.imageUrl; // รูปหลักที่ user เลือก > รูป default
        try { img = await imageUrlToBase64(useUrl); } catch (e) {}
        if (!img) log('⚠️ โหลดรูป "' + (p.productName || '').slice(0, 25) + '" ไม่ได้', 'error');
        state.products.push({
          id: 'tk_' + p.productId,
          name: p.productName,
          image: img || '',
          productId: p.productId,
          basketName: p.basketName,
          price: p.price,
        });
      }
      renderProducts();
      updateSummary();
      log('✅ พร้อมแล้ว ' + state.products.length + ' สินค้า', 'success');
    });
  });

  // (เก่า v0.2) Modal ในแผง — ถูกแทนด้วยหน้าเต็มจอแล้ว คงไว้เผื่อเรียกใช้ในอนาคต
  function openProductSelector(items) {
    document.getElementById('pdMiniSelector')?.remove();
    const selected = new Set(state.products.map((p) => p.id));

    const ov = document.createElement('div');
    ov.id = 'pdMiniSelector';
    ov.className = 'selector-overlay';
    ov.innerHTML =
      '<div class="selector-card">' +
        '<div class="selector-head">' +
          '<span>🛒 เลือกสินค้า (' + items.length + ' รายการ)</span>' +
          '<input type="text" class="selector-search" placeholder="🔍 ค้นหา...">' +
          '<button class="btn-mini" data-act="all">✓ ทั้งหมด</button>' +
          '<button class="btn-mini" data-act="none">✗ ล้าง</button>' +
          '<button class="btn-mini" data-act="close">✕</button>' +
        '</div>' +
        '<div class="selector-grid"></div>' +
        '<div class="selector-foot">' +
          '<span class="selector-count"></span>' +
          '<button class="btn btn-primary" data-act="apply">✅ ใช้ที่เลือก</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);

    const grid = ov.querySelector('.selector-grid');
    const countEl = ov.querySelector('.selector-count');
    const updateCount = () => { countEl.textContent = 'เลือก ' + selected.size + '/10'; };

    const renderGrid = () => {
      const q = ov.querySelector('.selector-search').value.trim().toLowerCase();
      grid.innerHTML = '';
      items.forEach((p) => {
        const id = 'tk_' + p.productId;
        if (q && !(p.productName || '').toLowerCase().includes(q)) return;
        const el = document.createElement('div');
        el.className = 'selector-item' + (selected.has(id) ? ' selected' : '');
        el.innerHTML =
          '<img src="' + p.imageUrl + '" loading="lazy" alt="">' +
          '<div class="si-name">' + escapeHtml(p.productName) + '</div>' +
          '<div class="si-meta">' + escapeHtml(p.price || '') + (p.commission ? ' · 💰' + escapeHtml(p.commission) : '') + '</div>' +
          '<span class="si-tick">✓</span>';
        el.addEventListener('click', () => {
          if (selected.has(id)) selected.delete(id);
          else if (selected.size < 10) selected.add(id);
          else { log('⚠️ เลือกได้สูงสุด 10 สินค้า', 'error'); return; }
          el.classList.toggle('selected', selected.has(id));
          updateCount();
        });
        grid.appendChild(el);
      });
    };

    ov.querySelector('.selector-search').addEventListener('input', renderGrid);
    ov.addEventListener('click', (e) => {
      const act = e.target.dataset && e.target.dataset.act;
      if (e.target === ov || act === 'close') { ov.remove(); return; }
      if (act === 'all') {
        items.forEach((p) => { if (selected.size < 10) selected.add('tk_' + p.productId); });
        renderGrid(); updateCount();
      }
      if (act === 'none') { selected.clear(); renderGrid(); updateCount(); }
      if (act === 'apply') applySelection();
    });

    async function applySelection() {
      const chosen = items.filter((p) => selected.has('tk_' + p.productId));
      if (!chosen.length) { log('⚠️ ยังไม่ได้เลือกสินค้า', 'error'); return; }
      ov.remove();
      // แปลงรูปเป็น base64 "ตอนนี้เลย" — ลิงก์ TikTok CDN มีหมดอายุ (บทเรียน v4.6)
      log('🖼️ โหลดรูปสินค้า ' + chosen.length + ' ตัว...');
      state.products = [];
      for (let i = 0; i < chosen.length; i++) {
        const p = chosen[i];
        let img = '';
        try { img = await imageUrlToBase64(p.imageUrl); } catch (e) {}
        if (!img) log('⚠️ โหลดรูป "' + (p.productName || '').slice(0, 25) + '" ไม่ได้', 'error');
        state.products.push({
          id: 'tk_' + p.productId,
          name: p.productName,
          image: img || '',
          productId: p.productId,
          basketName: p.basketName,
          price: p.price,
        });
      }
      renderProducts();
      updateSummary();
      log('✅ พร้อมแล้ว ' + state.products.length + ' สินค้า', 'success');
    }

    renderGrid();
    updateCount();
  }

  async function imageUrlToBase64(url) {
    if (!url) return '';
    const res = await fetch(url);
    if (!res.ok) return '';
    const blob = await res.blob();
    return new Promise((resolve) => {
      const fr = new FileReader();
      fr.onloadend = () => resolve(fr.result);
      fr.onerror = () => resolve('');
      fr.readAsDataURL(blob);
    });
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // รับ progress จาก content script Flow (mini-flow.js) → โชว์ใน log
  chrome.runtime.onMessage.addListener((m) => {
    if (m && m.action === 'miniFlowProgress') log('  🎬 ' + m.text);
  });

  document.addEventListener('DOMContentLoaded', init);
})();
