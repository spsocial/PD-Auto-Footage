// =====================================================================
// PD Auto Footage — Clip Merge Mode (v0.3)
//   ผู้ใช้อัปคลิปหลายฉากเอง → บอทต่อให้เป็นคลิปเดียว เรียงตามลำดับในลิสต์
//   สูงสุด 20 ฉาก/ชุด · 5 ชุด · ตัดเงียบ + เพลงแบ็คกราวด์ (option)
//   ใช้ window.PDMiniEngine.mergeUserClips (engine.js) — 2-pass กัน memory ระเบิด
// =====================================================================
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const MAX_SETS = 5;
  const MAX_CLIPS = 20;

  let _seq = 0;
  const state = { sets: [], running: false, stop: false };

  // ── เพลง ──
  let _customMusic = null;
  const _musicCache = {};
  async function loadMusic() {
    if (!$('cmMusicToggle').checked) return null;
    if (_customMusic) return _customMusic;
    const mood = $('cmMusicMood').value;
    if (_musicCache[mood] !== undefined) return _musicCache[mood];
    try {
      const res = await fetch(chrome.runtime.getURL('assets/music/' + mood + '.mp3'));
      _musicCache[mood] = res.ok ? await res.blob() : null;
    } catch (_) { _musicCache[mood] = null; }
    return _musicCache[mood];
  }

  function log(msg, type) {
    const el = $('cmLog');
    el.style.display = 'block';
    const d = document.createElement('div');
    if (type) d.className = type;
    d.textContent = msg;
    el.appendChild(d);
    el.scrollTop = el.scrollHeight;
  }

  // ── Sets ──
  function addSet() {
    if (state.sets.length >= MAX_SETS) return;
    state.sets.push({ id: ++_seq, clips: [] });
    render();
  }
  function removeSet(id) {
    state.sets = state.sets.filter((s) => s.id !== id);
    if (state.sets.length === 0) addSet();
    render();
  }
  function addClips(setId, fileList) {
    const set = state.sets.find((s) => s.id === setId);
    if (!set) return;
    for (const f of fileList) {
      if (set.clips.length >= MAX_CLIPS) { log(`⚠️ ชุดนี้เต็ม ${MAX_CLIPS} ฉากแล้ว`, 'warn'); break; }
      if (!/^video\//.test(f.type) && !/\.(mp4|mov|webm|m4v)$/i.test(f.name)) continue;
      set.clips.push({ file: f, name: f.name, url: URL.createObjectURL(f) });
    }
    render();
  }
  function moveClip(setId, idx, dir) {
    const set = state.sets.find((s) => s.id === setId);
    if (!set) return;
    const j = idx + dir;
    if (j < 0 || j >= set.clips.length) return;
    const t = set.clips[idx]; set.clips[idx] = set.clips[j]; set.clips[j] = t;
    render();
  }
  function delClip(setId, idx) {
    const set = state.sets.find((s) => s.id === setId);
    if (!set) return;
    try { URL.revokeObjectURL(set.clips[idx].url); } catch (_) {}
    set.clips.splice(idx, 1);
    render();
  }

  function render() {
    const wrap = $('cmSetsWrap');
    wrap.innerHTML = '';
    state.sets.forEach((set, si) => {
      const card = document.createElement('div');
      card.className = 'cm-set';
      card.innerHTML =
        '<div class="cm-set-head">' +
          '<span class="cm-set-title">📦 ชุดที่ ' + (si + 1) + '</span>' +
          '<span class="cm-setcount">' + set.clips.length + '/' + MAX_CLIPS + ' ฉาก' +
            (state.sets.length > 1 ? ' · <button class="btn-mini danger" data-delset="' + set.id + '">🗑️ ลบชุด</button>' : '') +
          '</span>' +
        '</div>' +
        '<div class="cm-drop" data-drop="' + set.id + '">⬆️ คลิกหรือลากคลิปมาวาง (เลือกได้หลายไฟล์) — เรียงเป็นฉาก 1→' + MAX_CLIPS + '</div>' +
        '<input type="file" accept="video/*" multiple hidden data-file="' + set.id + '">' +
        '<div class="cm-cliplist" data-list="' + set.id + '"></div>';
      wrap.appendChild(card);

      const list = card.querySelector('[data-list="' + set.id + '"]');
      set.clips.forEach((c, idx) => {
        const row = document.createElement('div');
        row.className = 'cm-clip';
        row.innerHTML =
          '<span class="num">' + (idx + 1) + '</span>' +
          '<video src="' + c.url + '" muted preload="metadata"></video>' +
          '<span class="nm" title="' + c.name + '">' + c.name + '</span>' +
          '<span class="ops">' +
            '<button data-up="' + idx + '" title="ขึ้น">▲</button>' +
            '<button data-down="' + idx + '" title="ลง">▼</button>' +
            '<button class="del" data-del="' + idx + '" title="ลบ">✕</button>' +
          '</span>';
        list.appendChild(row);
        row.querySelector('[data-up]').onclick = () => moveClip(set.id, idx, -1);
        row.querySelector('[data-down]').onclick = () => moveClip(set.id, idx, 1);
        row.querySelector('[data-del]').onclick = () => delClip(set.id, idx);
      });

      // events
      const fileInput = card.querySelector('[data-file="' + set.id + '"]');
      const drop = card.querySelector('[data-drop="' + set.id + '"]');
      drop.onclick = () => fileInput.click();
      fileInput.onchange = (e) => { addClips(set.id, e.target.files); fileInput.value = ''; };
      drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('over'); };
      drop.ondragleave = () => drop.classList.remove('over');
      drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove('over'); if (e.dataTransfer.files) addClips(set.id, e.dataTransfer.files); };
      const delSetBtn = card.querySelector('[data-delset="' + set.id + '"]');
      if (delSetBtn) delSetBtn.onclick = () => removeSet(set.id);
    });

    $('cmAddSetBtn').style.display = state.sets.length < MAX_SETS ? 'block' : 'none';
    const totalClips = state.sets.reduce((n, s) => n + s.clips.length, 0);
    const setsWithClips = state.sets.filter((s) => s.clips.length > 0).length;
    $('cmSummary').textContent = totalClips > 0 ? (setsWithClips + ' ชุด · ' + totalClips + ' คลิปรวม') : 'ยังไม่มีคลิป';
  }

  // ── v0.3: กองคลิปสำหรับยำ (Remix pool) ──
  const pool = [];
  function addPoolClips(fileList) {
    for (const f of fileList) {
      if (pool.length >= 30) { log('⚠️ กองยำเต็ม 30 คลิปแล้ว', 'warn'); break; }
      if (!/^video\//.test(f.type) && !/\.(mp4|mov|webm|m4v)$/i.test(f.name)) continue;
      pool.push({ file: f, name: f.name, url: URL.createObjectURL(f) });
    }
    renderPool();
  }
  function renderPool() {
    const list = $('cmPoolList');
    if (!list) return;
    list.innerHTML = '';
    pool.forEach((c, idx) => {
      const row = document.createElement('div');
      row.className = 'cm-clip';
      row.innerHTML = '<span class="num">' + (idx + 1) + '</span>' +
        '<video src="' + c.url + '" muted preload="metadata"></video>' +
        '<span class="nm" title="' + c.name + '">' + c.name + '</span>' +
        '<span class="ops"><button class="del" data-del="' + idx + '" title="ลบ">✕</button></span>';
      list.appendChild(row);
      row.querySelector('[data-del]').onclick = () => { try { URL.revokeObjectURL(pool[idx].url); } catch (_) {} pool.splice(idx, 1); renderPool(); };
    });
    $('cmPoolCount').textContent = pool.length + ' คลิป';
  }
  const rnd = (a, b) => a + Math.random() * (b - a);
  const rndInt = (a, b) => Math.floor(rnd(a, b + 1));
  function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function fileToDataUrl(file) { return new Promise((res, rej) => { const r = new FileReader(); r.onloadend = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); }); }
  // v0.3: probe ความยาวคลิป (อ่าน metadata) — ใช้คำนวณตำแหน่งสุ่มยำ (ไม่ให้เกินคลิป)
  function probeDur(file) {
    return new Promise((res) => {
      const v = document.createElement('video'); v.preload = 'metadata'; v.muted = true;
      const url = URL.createObjectURL(file); let done = false;
      const fin = (d) => { if (done) return; done = true; try { URL.revokeObjectURL(url); } catch (_) {} res(isFinite(d) && d > 0 ? d : 8); };
      v.onloadedmetadata = () => fin(v.duration); v.onerror = () => fin(8);
      setTimeout(() => fin(8), 5000); v.src = url;
    });
  }
  // สุ่มตำแหน่งเริ่ม ให้ start+seg ไม่เกินคลิป (ยำจริง — หยิบช่วงกลาง/ท้ายได้)
  function randStart(clipLen, segLen) { const room = Math.max(0, clipLen - segLen); return room > 0.3 ? +rnd(0, room).toFixed(2) : 0; }
  // cache ความยาวคลิป (กัน probe ซ้ำตอนยำหลายช่วง/หลายผลลัพธ์)
  async function getDur(clipObj) { if (clipObj._dur == null) clipObj._dur = await probeDur(clipObj.file); return clipObj._dur; }
  const pick1 = (arr) => arr[Math.floor(Math.random() * arr.length)];
  async function getApiKey() { const r = await chrome.storage.local.get(['pdMiniSettings']); return (r && r.pdMiniSettings && r.pdMiniSettings.apiKey) || ''; }

  // ── ยำ A: สุ่ม + ตัดความยาว (ไม่มีเสียง) ──
  async function remixSimple(N, music) {
    const minC = parseInt($('cmRemixMinClips').value) || 3;
    const maxC = Math.max(minC, parseInt($('cmRemixMaxClips').value) || 6);
    const durMode = $('cmRemixDurMode').value;
    const dMin = parseFloat($('cmRemixDurMin').value) || 2;
    const dMax = Math.max(dMin, parseFloat($('cmRemixDurMax').value) || 4);
    const opts = { aspect: $('cmAspect').value, silenceCut: $('cmSilenceCut').checked };
    let done = 0;
    for (let k = 1; k <= N; k++) {
      if (state.stop) { log('⏹️ หยุดโดยผู้ใช้', 'warn'); break; }
      // ยำจริง: ตัดหลายช่วงสั้นๆ (2-3 วิ) จากคลิปในกอง — สุ่มคลิป (ซ้ำได้) + สุ่มตำแหน่งเริ่ม + สลับเรียง
      const K = rndInt(minC, maxC); // จำนวนช่วง (ไม่จำกัดที่จำนวนคลิป — หยิบจากคลิปเดิมหลายช่วงได้)
      const files = []; const trims = []; const starts = [];
      for (let j = 0; j < K; j++) {
        const c = pick1(pool); // สุ่มคลิป (ซ้ำได้ → ตัดคลิปเดียวหลายช่วง)
        const seg = durMode === 'full' ? 0 : durMode === 'fixed' ? dMin : +rnd(dMin, dMax).toFixed(2);
        files.push(c.file); trims.push(seg);
        starts.push(seg > 0 ? randStart(await getDur(c), seg) : 0);
      }
      log('━━ 🥗 ยำคลิป ' + k + '/' + N + ' (ตัด ' + K + ' ช่วง' + (durMode === 'full' ? ' เต็ม' : ' ช่วงละ ' + (durMode === 'fixed' ? dMin + ' วิ' : dMin + '-' + dMax + ' วิ')) + ' สลับกัน)');
      const merged = await window.PDMiniEngine.mergeUserClips(
        files,
        Object.assign({}, opts, { trims, starts, music: { enabled: $('cmMusicToggle').checked && !!music, blob: music, volume: parseInt($('cmMusicVol').value) } }),
        (m) => log('  ' + m)
      );
      const url = URL.createObjectURL(merged);
      await chrome.downloads.download({ url, filename: 'PD-Footage-Remix/ยำ-' + k + '-' + Date.now() + '.mp4', saveAs: false, conflictAction: 'uniquify' });
      setTimeout(() => URL.revokeObjectURL(url), 120000);
      log('  💾 เซฟแล้ว (' + (merged.size / 1048576).toFixed(1) + ' MB)', 'ok'); done++;
    }
    return done;
  }

  // ── ยำ B: AI คิดบท + พากย์ + ซับ + ยำคลิปให้พอดีเสียง ──
  async function remixWithVoice(N, music) {
    const apiKey = await getApiKey();
    if (!apiKey) { log('❌ ยังไม่ได้ใส่ API Key — ไปใส่ในแผงบอทหลักก่อน (โหมดยำ+พากย์ต้องใช้คิดบท+พากย์)', 'err'); return 0; }
    const topic = ($('cmRemixTopic').value || '').trim();
    if (!topic) { log('❌ ใส่หัวข้อ/สินค้า ให้ AI คิดบทก่อน', 'err'); return 0; }
    const sceneSel = $('cmRemixScenes').value; // 'random' = สุ่ม 3-5 ต่อคลิป (ไม่ล็อค)
    const voiceId = $('cmRemixVoiceId').value;
    const subStyle = $('cmRemixSubStyle').value;
    const aspect = $('cmAspect').value;
    let done = 0;
    for (let k = 1; k <= N; k++) {
      if (state.stop) { log('⏹️ หยุดโดยผู้ใช้', 'warn'); break; }
      // v0.3: สุ่มจำนวนฉากต่อคลิป (ถ้าเลือก "สุ่ม") — ไม่ล็อคตายตัวทุกคลิป
      const sceneCount = sceneSel === 'random' ? rndInt(3, 5) : (parseInt(sceneSel) || 4);
      log('━━ 🥗🎙️ ยำ+พากย์ ' + k + '/' + N + ' (' + sceneCount + ' ฉาก)');
      try {
        log('  🧠 AI คิดบท...');
        const scenes = await window.PDMiniAI.generateAdScript({ name: topic }, { structure: 'problem_solution', mood: 'energetic', sceneCount }, apiKey);
        const useScenes = scenes.slice(0, sceneCount);
        // พากย์ + เลือกคลิปสุ่มจาก pool ต่อฉาก (ยำให้พอดีความยาวเสียง — buildVideo ตัดคลิปตาม durationSec)
        const picks = shuffle(pool);
        const clipsB64 = [];
        const clipStarts = [];
        for (let si = 0; si < useScenes.length; si++) {
          if (state.stop) break;
          log('  🎙️ พากย์ฉาก ' + (si + 1) + '/' + useScenes.length + '...');
          const r = await window.PDMiniTTS.synthesize(useScenes[si].voice, voiceId, apiKey);
          useScenes[si].audioBlob = r.blob; useScenes[si].durationSec = r.durationSec;
          const pf = picks[si % picks.length].file; // วนคลิปถ้าฉาก > จำนวนคลิป
          clipsB64.push(await fileToDataUrl(pf));
          // ยำจริง: สุ่มตำแหน่งเริ่มในคลิป ให้ช่วงยาวเท่าเสียงฉากนี้ (buildVideo ตัด clipStarts → +durationSec)
          const segLen = Math.min((r.durationSec || 6) + 0.4, 8);
          const L = await probeDur(pf);
          clipStarts.push(randStart(L, segLen));
        }
        log('  🎬 ยำคลิป (สุ่มช่วง) + รวมเสียง + ซับ...');
        const mp4 = await window.PDMiniEngine.buildVideo({
          clips: clipsB64, scenes: useScenes, aspect, subStyle, clipStarts,
          subFont: 'kanit', subAnim: 'fade', subSize: 0.06, subOutline: 7,
          music: { enabled: $('cmMusicToggle').checked && !!music, blob: music, volume: parseInt($('cmMusicVol').value) },
          sfx: { enabled: false }, silenceCut: $('cmSilenceCut').checked,
        }, (m) => log('  ' + m));
        const url = URL.createObjectURL(mp4);
        await chrome.downloads.download({ url, filename: 'PD-Footage-Remix/ยำพากย์-' + k + '-' + Date.now() + '.mp4', saveAs: false, conflictAction: 'uniquify' });
        setTimeout(() => URL.revokeObjectURL(url), 120000);
        log('  💾 เซฟแล้ว (' + (mp4.size / 1048576).toFixed(1) + ' MB)', 'ok'); done++;
      } catch (e) { log('  ❌ ยำ ' + k + ' เฟล: ' + (e && e.message || e) + ' — ข้าม', 'err'); }
    }
    return done;
  }

  // ── การ์ดสรุปผลตอนจบ ──
  function fmtTime(ms) {
    const s = Math.round(ms / 1000);
    return s >= 60 ? (Math.floor(s / 60) + ' นาที ' + (s % 60) + ' วิ') : (s + ' วินาที');
  }
  function showSummary(o) {
    document.getElementById('cmSummaryOverlay')?.remove();
    const stopped = !!o.stopped;
    const failed = Math.max(0, o.total - o.done);
    const allOk = failed === 0 && o.done >= o.total && !stopped;
    const icon = stopped ? '⏹️' : allOk ? '🎉' : (o.done > 0 ? '✅' : '⚠️');
    const title = stopped ? 'หยุดแล้ว' : allOk ? 'เสร็จเรียบร้อย!' : (o.done > 0 ? 'เสร็จ — บางส่วนไม่สำเร็จ' : 'ไม่สำเร็จ');
    const ov = document.createElement('div');
    ov.id = 'cmSummaryOverlay';
    ov.className = 'modal-overlay';
    ov.innerHTML =
      '<div class="modal-box" style="max-width:380px; text-align:center;">' +
        '<div style="padding:24px 22px;">' +
          '<div style="font-size:48px; margin-bottom:6px;">' + icon + '</div>' +
          '<div style="font-size:18px; font-weight:800; margin-bottom:4px; color:var(--gold);">' + title + '</div>' +
          '<div style="font-size:13px; color:var(--muted); margin-bottom:16px;">' + o.subtitle + '</div>' +
          '<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:16px;">' +
            '<div style="background:rgba(52,211,153,0.1); border:1px solid rgba(52,211,153,0.3); border-radius:10px; padding:10px 4px;"><div style="font-size:22px; font-weight:800; color:#34d399;">' + o.done + '</div><div style="font-size:10px; color:var(--muted);">✅ สำเร็จ</div></div>' +
            '<div style="background:rgba(248,113,113,0.1); border:1px solid rgba(248,113,113,0.3); border-radius:10px; padding:10px 4px;"><div style="font-size:22px; font-weight:800; color:#f87171;">' + failed + '</div><div style="font-size:10px; color:var(--muted);">❌ เฟล</div></div>' +
            '<div style="background:rgba(245,200,66,0.1); border:1px solid rgba(245,200,66,0.3); border-radius:10px; padding:10px 4px;"><div style="font-size:15px; font-weight:800; color:var(--gold); margin-top:3px;">' + fmtTime(o.elapsed) + '</div><div style="font-size:10px; color:var(--muted);">⏱️ เวลา</div></div>' +
          '</div>' +
          (o.done > 0 ? '<div style="font-size:11.5px; color:#86efac; background:rgba(16,185,129,0.08); border-radius:8px; padding:8px; margin-bottom:14px;">💾 เซฟแล้วที่ Downloads/' + o.folder + '/</div>' : '') +
          '<button class="btn btn-primary full" id="cmSumClose">ปิด</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);
    const close = () => ov.remove();
    ov.querySelector('#cmSumClose').onclick = close;
    ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
  }

  // ── Run ──
  async function run() {
    if (state.running) return;
    const remixOn = $('cmRemixToggle').checked;
    const t0 = Date.now();

    // โหมดยำ
    if (remixOn) {
      if (pool.length < 2) { log('⚠️ ใส่คลิปในกองยำอย่างน้อย 2 อันก่อน', 'warn'); return; }
      const N = Math.max(1, Math.min(20, parseInt($('cmRemixCount').value) || 5));
      state.running = true; state.stop = false;
      $('cmRunBtn').disabled = true; $('cmStopBtn').style.display = 'inline-block';
      $('cmLog').innerHTML = '';
      const voice = $('cmRemixVoice').checked;
      log('🥗 เริ่มยำ ' + N + ' คลิป' + (voice ? ' (+ พากย์+ซับ)' : '') + ' จากกอง ' + pool.length + ' คลิป', 'ok');
      let done = 0;
      try {
        const music = await loadMusic();
        done = voice ? await remixWithVoice(N, music) : await remixSimple(N, music);
        log('🎉 ยำเสร็จ! ได้ ' + done + '/' + N + ' คลิป', 'ok');
      } catch (e) { log('❌ ' + (e && e.message || e), 'err'); }
      finally {
        state.running = false; $('cmRunBtn').disabled = false; $('cmStopBtn').style.display = 'none';
        showSummary({ total: N, done, elapsed: Date.now() - t0, stopped: state.stop, folder: 'PD-Footage-Remix', subtitle: 'ยำคลิป' + (voice ? ' + พากย์ + ซับ' : '') + ' จากกอง ' + pool.length + ' คลิป' });
      }
      return;
    }

    // โหมดปกติ (5 ชุดเรียงเอง)
    const sets = state.sets.filter((s) => s.clips.length > 0);
    if (sets.length === 0) { log('⚠️ ยังไม่มีคลิป — เพิ่มคลิปก่อน', 'warn'); return; }

    state.running = true; state.stop = false;
    $('cmRunBtn').disabled = true; $('cmStopBtn').style.display = 'inline-block';
    $('cmLog').innerHTML = '';
    log('🚀 เริ่มรวมคลิป ' + sets.length + ' ชุด', 'ok');

    const opts = {
      aspect: $('cmAspect').value,
      silenceCut: $('cmSilenceCut').checked,
    };
    let done = 0;
    try {
      for (let i = 0; i < sets.length; i++) {
        if (state.stop) { log('⏹️ หยุดโดยผู้ใช้', 'warn'); break; }
        const set = sets[i];
        log('━━ 📦 ชุด ' + (i + 1) + '/' + sets.length + ' (' + set.clips.length + ' ฉาก)');
        const music = await loadMusic();
        const merged = await window.PDMiniEngine.mergeUserClips(
          set.clips.map((c) => c.file),
          Object.assign({}, opts, { music: { enabled: $('cmMusicToggle').checked && !!music, blob: music, volume: parseInt($('cmMusicVol').value) } }),
          (m) => log('  ' + m)
        );
        const url = URL.createObjectURL(merged);
        await chrome.downloads.download({ url, filename: 'PD-Footage-Merge/รวมคลิป-ชุด' + (i + 1) + '-' + Date.now() + '.mp4', saveAs: false, conflictAction: 'uniquify' });
        setTimeout(() => URL.revokeObjectURL(url), 120000);
        log('  💾 เซฟแล้ว → Downloads/PD-Footage-Merge/ (' + (merged.size / 1048576).toFixed(1) + ' MB)', 'ok');
        done++;
      }
      log('🎉 เสร็จ! รวมสำเร็จ ' + done + '/' + sets.length + ' ชุด', 'ok');
    } catch (e) {
      log('❌ ' + (e && e.message || e), 'err');
    } finally {
      state.running = false;
      $('cmRunBtn').disabled = false; $('cmStopBtn').style.display = 'none';
      showSummary({ total: sets.length, done, elapsed: Date.now() - t0, stopped: state.stop, folder: 'PD-Footage-Merge', subtitle: 'รวมคลิป ' + sets.length + ' ชุด' });
    }
  }

  // ── Init ──
  document.addEventListener('DOMContentLoaded', () => {
    addSet(); // เริ่มชุดแรก
    $('cmAddSetBtn').onclick = addSet;
    $('cmRunBtn').onclick = run;
    $('cmStopBtn').onclick = () => { state.stop = true; log('⏳ จะหยุดหลังชุดปัจจุบันเสร็จ...', 'warn'); };
    $('cmMusicToggle').onchange = () => { $('cmMusicOpts').style.display = $('cmMusicToggle').checked ? 'block' : 'none'; };
    $('cmMusicVol').oninput = () => { $('cmMusicVolLabel').textContent = $('cmMusicVol').value + '%'; };
    $('cmMusicUploadBtn').onclick = () => $('cmMusicFile').click();
    $('cmMusicFile').onchange = (e) => {
      const f = e.target.files && e.target.files[0];
      if (f) { _customMusic = f; $('cmMusicName').textContent = '🎵 ' + f.name; }
    };

    // v0.3: โหมดยำ — สลับ normal/remix
    $('cmRemixToggle').onchange = () => {
      const on = $('cmRemixToggle').checked;
      $('cmNormalWrap').style.display = on ? 'none' : 'block';
      $('cmRemixWrap').style.display = on ? 'block' : 'none';
      $('cmRunBtn').textContent = on ? '🥗 ยำเลย!' : '🚀 รวมคลิปทั้งหมด';
    };
    // ยำ — toggle เสียงพากย์ (B) → ซ่อนตั้งความยาวต่อคลิป (B ใช้ความยาวตามเสียง)
    $('cmRemixVoice').onchange = () => {
      const on = $('cmRemixVoice').checked;
      $('cmRemixVoiceOpts').style.display = on ? 'block' : 'none';
      $('cmRemixDurRow').style.display = on ? 'none' : 'block';
    };
    $('cmRemixDurMode').onchange = () => {
      $('cmRemixDurVals').style.display = $('cmRemixDurMode').value === 'full' ? 'none' : 'flex';
    };
    // ยำ — กองคลิป upload/drop
    const pd = $('cmPoolDrop'), pf = $('cmPoolFile');
    pd.onclick = () => pf.click();
    pf.onchange = (e) => { addPoolClips(e.target.files); pf.value = ''; };
    pd.ondragover = (e) => { e.preventDefault(); pd.classList.add('over'); };
    pd.ondragleave = () => pd.classList.remove('over');
    pd.ondrop = (e) => { e.preventDefault(); pd.classList.remove('over'); if (e.dataTransfer.files) addPoolClips(e.dataTransfer.files); };
  });
})();
