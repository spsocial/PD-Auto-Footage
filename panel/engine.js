// =====================================================================
// PD Auto Flow Mini — Render Engine (ffmpeg.wasm)
// Phase 4: รวมร่าง 1 สินค้า:
//   ฟุตเทจเงียบ N คลิป + เสียงพากย์ N ท่อน (รู้ duration) + เพลง duck + ซับเผา + ตัดเงียบ
//   → MP4 พร้อมโพส
// =====================================================================
(function (global) {
  'use strict';

  let _ff = null;
  const SIZES = {
    '9:16': [720, 1280], '16:9': [1280, 720], '1:1': [720, 720],
  };
  const FONTS = {
    kanit: 'assets/fonts/kanit.ttf',          // Kanit ExtraBold — หนาแน่น TikTok ฮิตสุด
    itim: 'assets/fonts/itim.ttf',            // Itim — ลายมือน่ารัก กลมมน
    prompt: 'assets/fonts/prompt.ttf',        // Prompt Bold — โมเดิร์น คม
    mitr: 'assets/fonts/mitr.ttf',            // Mitr Bold — หนา อ่านง่าย
    chonburi: 'assets/fonts/chonburi.ttf',    // Chonburi — มีสไตล์ เก๋
    sriracha: 'assets/fonts/sriracha.ttf',    // Sriracha — ลายมือสนุก
    baijamjuree: 'assets/fonts/baijamjuree.ttf', // Bai Jamjuree Bold — เทคโนโลยี
    chakra: 'assets/fonts/chakra.ttf',        // Chakra Petch — เหลี่ยม เกมมิ่ง
    k2d: 'assets/fonts/k2d.ttf',              // K2D Bold — กลม สะอาด
    mali: 'assets/fonts/mali.ttf',            // Mali Bold — ลายมือนุ่ม
    bold: 'assets/fonts/thai-bold.ttf',       // Leelawadee UI Bold (เดิม)
  };

  // v0.2: โหลดฟอนต์เป็น FontFace ในหน้า panel เพื่อวัดความกว้างจริงด้วย Canvas measureText
  //   → ตัดบรรทัดแม่นระดับพิกเซล (เลิกเดาจากจำนวนตัวอักษร ซึ่งพังกับภาษาไทย)
  const _measureFamily = {}; // { fontKey: 'pdsub_<key>' }
  let _fontsRegistering = null;
  async function ensureMeasureFonts() {
    if (_fontsRegistering) return _fontsRegistering;
    _fontsRegistering = (async () => {
      if (typeof FontFace === 'undefined' || !document.fonts) return;
      await Promise.all(Object.entries(FONTS).map(async ([k, p]) => {
        const fam = 'pdsub_' + k;
        try {
          const face = new FontFace(fam, 'url(' + chrome.runtime.getURL(p) + ')');
          await face.load();
          document.fonts.add(face);
          _measureFamily[k] = fam;
        } catch (e) { /* ฟอนต์ไหนโหลดไม่ได้ → ข้าม ใช้ fallback วัด */ }
      }));
    })();
    return _fontsRegistering;
  }

  // v0.3: ตัดเป็น "คำ" จริง ไม่หักกลางคำ
  //   ปัญหาเดิม: regex ตัดแบบ cluster (สระ+พยัญชนะ+วรรณยุกต์) → ตัดกลางคำได้ เศษคำไปขึ้นการ์ดหน้าถัดไป
  //   ใหม่: ใช้ Intl.Segmenter('th', {granularity:'word'}) — Chrome มี ICU dictionary ตัดคำไทยในตัว
  //         = ขอบเขตคำจริง ไม่หักกลางคำ (fallback เป็น cluster regex ถ้าเบราว์เซอร์ไม่รองรับ)
  let _thSeg = null;
  function _getThaiSegmenter() {
    if (_thSeg !== null) return _thSeg;
    try {
      _thSeg = (typeof Intl !== 'undefined' && Intl.Segmenter)
        ? new Intl.Segmenter('th', { granularity: 'word' }) : false;
    } catch (_) { _thSeg = false; }
    return _thSeg;
  }
  function splitTokens(text) {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    if (!clean) return [];
    // 1) Intl.Segmenter — ตัดคำไทยตาม dictionary (ไม่หักกลางคำ)
    const seg = _getThaiSegmenter();
    if (seg) {
      const toks = [];
      try {
        for (const s of seg.segment(clean)) {
          const w = s.segment;
          if (w && w.trim()) toks.push(w); // ทิ้ง segment ที่เป็นช่องว่างล้วน
        }
        if (toks.length) return toks;
      } catch (_) { /* ตกไป fallback */ }
    }
    // 2) fallback: cluster regex (เบราว์เซอร์เก่าไม่มี Segmenter)
    const re = /[เ-ไ]?[ก-ฮ][ัิ-ฺ็-๎]*|[A-Za-z0-9][A-Za-z0-9'._%-]*|[^\s]/g;
    const raw = clean.match(re) || [];
    const toks = [];
    for (const t of raw) {
      if (toks.length && /^[ัิ-ฺ็-๎]/.test(t)) toks[toks.length - 1] += t;
      else toks.push(t);
    }
    return toks;
  }

  // v0.2: รวม token เป็นข้อความ — ไทยติดกัน, อังกฤษเว้นวรรค
  function joinTokens(toks) {
    let out = '';
    for (const t of toks) {
      if (!out) { out = t; continue; }
      const prevEN = /[A-Za-z0-9]$/.test(out);
      const curEN = /^[A-Za-z0-9]/.test(t);
      out += (prevEN && curEN) ? ' ' + t : (curEN || prevEN ? ' ' + t : t);
    }
    return out;
  }

  async function loadFF(log) {
    if (_ff) return _ff;
    log && log('⏳ โหลด FFmpeg...');
    if (!global.FFmpegWASM) throw new Error('FFmpeg ไม่ได้โหลด — เช็ค panel.html');
    const { FFmpeg } = global.FFmpegWASM;
    const ff = new FFmpeg();
    await ff.load({
      coreURL: chrome.runtime.getURL('lib/ffmpeg/ffmpeg-core.js'),
      wasmURL: chrome.runtime.getURL('lib/ffmpeg/ffmpeg-core.wasm'),
    });
    // โหลดฟอนต์ไทยทุกแบบเข้า FS
    ff._fonts = {};
    for (const [k, p] of Object.entries(FONTS)) {
      try {
        const fb = new Uint8Array(await (await fetch(chrome.runtime.getURL(p))).arrayBuffer());
        await ff.writeFile(k + '.ttf', fb);
        ff._fonts[k] = k + '.ttf';
      } catch (e) {}
    }
    ff._fontOk = Object.keys(ff._fonts).length > 0;
    _ff = ff;
    log && log('✅ FFmpeg พร้อม');
    return ff;
  }

  // ── ตัดบทพูดเป็น "การ์ดซับ" สั้นๆ ไม่ล้นจอ (วัดความกว้างจริงด้วย measureFn) ──
  // v0.2 REWRITE: เดิม split(/\s+/) → ภาษาไทยไม่มีเว้นวรรค = ทั้งประโยคเป็น "คำเดียว" ตัดไม่ได้ → ล้นจอ
  //   ใหม่: tokenize แบบ cluster ไทย + วัดพิกเซลจริง → ตัดพอดีกรอบเป๊ะทุกภาษา
  //   measureFn(str) → ความกว้างพิกเซลของ str ด้วยฟอนต์+ขนาดจริง · maxWidthPx = งบความกว้างต่อการ์ด
  //   softCapUnits = จำนวน token สูงสุดต่อการ์ด (กันการ์ดยาวเกินแม้จะพอดีจอ — คงฟีล "การ์ดสั้น")
  function chunkText(text, measureFn, maxWidthPx, softCapUnits) {
    const toks = splitTokens(text);
    if (toks.length === 0) return [];
    const cap = softCapUnits || 99;
    const cards = [];
    let cur = [];
    for (const tk of toks) {
      const trial = cur.concat([tk]);
      const tooWide = cur.length > 0 && measureFn(joinTokens(trial)) > maxWidthPx;
      const tooMany = cur.length >= cap;
      if (tooWide || tooMany) {
        cards.push(joinTokens(cur));
        cur = [tk];
      } else {
        cur = trial;
      }
    }
    if (cur.length) cards.push(joinTokens(cur));
    return cards;
  }
  function freeFF() { try { if (_ff) _ff.terminate(); } catch (e) {} _ff = null; }

  const u8 = async (blobOrBuf) =>
    new Uint8Array(blobOrBuf instanceof Blob ? await blobOrBuf.arrayBuffer() : blobOrBuf);

  // base64 dataURL/raw → Uint8Array
  function b64ToU8(b64) {
    const comma = b64.indexOf(',');
    const raw = comma >= 0 ? b64.slice(comma + 1) : b64;
    const bin = atob(raw);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return arr;
  }

  // escape ข้อความสำหรับ drawtext
  function escDraw(s) {
    return String(s || '')
      .replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "’")
      .replace(/%/g, '\\%').replace(/\n/g, ' ');
  }

  // สไตล์ซับ → พารามิเตอร์ drawtext
  //   รองรับ: fontcolor, border(borderw)+bordercolor, box+boxcolor(+boxpad), shadow{color,x,y}
  // v0.2: เพิ่มสไตล์แปลกใหม่ 6 แบบ (เหลืองไวรัล/แดงเดือด/นีออนฟ้า/กล่องดำ/พาสเทล/เขียวเงิน)
  const SUB_STYLE = {
    tiktok_bold:  { fontcolor: 'white',   border: 7, bordercolor: 'black', box: 0 },
    clean_white:  { fontcolor: 'white',   border: 0, box: 1, boxcolor: 'black@0.55' },
    gold_premium: { fontcolor: '#f5c842', border: 4, bordercolor: 'black@0.85', box: 0, shadow: { color: 'black@0.6', x: 2, y: 2 } },
    // ── ใหม่ v0.2 ──
    yellow_viral: { fontcolor: '#ffe600', border: 9, bordercolor: 'black', box: 0, shadow: { color: 'black@0.5', x: 3, y: 3 } }, // เหลืองไวรัล (MrBeast)
    red_hot:      { fontcolor: 'white',   border: 0, box: 1, boxcolor: '#e11d2a@0.92', boxpad: 22 },                              // แดงเดือด ลดราคา
    neon_cyan:    { fontcolor: '#00f0ff', border: 6, bordercolor: '#063b46', box: 0, shadow: { color: '#00f0ff@0.45', x: 0, y: 0 } }, // นีออนฟ้าเรืองแสง
    black_caption:{ fontcolor: 'white',   border: 0, box: 1, boxcolor: 'black@0.82', boxpad: 20 },                                // กล่องดำ CapCut/Netflix
    pastel_cute:  { fontcolor: '#ff7ab5', border: 6, bordercolor: 'white', box: 0, shadow: { color: 'black@0.35', x: 2, y: 2 } }, // พาสเทลน่ารัก
    green_money:  { fontcolor: '#27e36a', border: 7, bordercolor: '#04361b', box: 0, shadow: { color: 'black@0.5', x: 2, y: 2 } }, // เขียวเงิน โปรโมชั่น
  };

  // ═══════════════════════════════════════════════════════════════════
  // v0.7: ซับระบบใหม่ ASS/libass (พอร์ตจาก PD Yum Clip — เหนือกว่า drawtext เดิม)
  //   ได้: เอฟเฟกต์ขึ้นซับ 4 แบบ (จาง/เด้ง/ซูม/ฉ่า) + ซับทีละคำสไตล์ CapCut + เลือกตำแหน่งซับ
  //   ⚠️ กติกาจาก Yum Clip: เบิร์น ASS ต้อง "แยก pass" เสมอ (ass ใน filter_complex รอบเดียว = เงียบหายบน ffmpeg.wasm)
  // ═══════════════════════════════════════════════════════════════════
  // สไตล์ → พารามิเตอร์ ASS (&HAABBGGRR) — ค่าเดียวกับ Yum Clip เป๊ะ · borderStyle 3 = กล่องทึบ (outlineColour = สีกล่อง)
  const ASS_STYLE = {
    tiktok_bold:  { primaryColour: '&H00FFFFFF', outlineColour: '&H00000000', borderStyle: 1, outline: 6 },
    yellow_viral: { primaryColour: '&H0000E6FF', outlineColour: '&H00000000', borderStyle: 1, outline: 7 },
    red_hot:      { primaryColour: '&H00FFFFFF', outlineColour: '&H002A1DE1', borderStyle: 3, outline: 6 },
    neon_cyan:    { primaryColour: '&H00FFF000', outlineColour: '&H00463B06', borderStyle: 1, outline: 5 },
    black_caption:{ primaryColour: '&H00FFFFFF', outlineColour: '&H00000000', borderStyle: 3, outline: 6 },
    pastel_cute:  { primaryColour: '&H00B57AFF', outlineColour: '&H00FFFFFF', borderStyle: 1, outline: 5 },
    green_money:  { primaryColour: '&H006AE327', outlineColour: '&H001B3604', borderStyle: 1, outline: 6 },
    clean_white:  { primaryColour: '&H00FFFFFF', outlineColour: '&H64000000', borderStyle: 3, outline: 4 },
    gold_premium: { primaryColour: '&H0042C8F5', outlineColour: '&H00000000', borderStyle: 1, outline: 4, shadow: 2 },
  };
  // ชื่อ family ภายในไฟล์ฟอนต์จริง (อ่านจาก name table — libass จับคู่ตามนี้เป๊ะ ไม่มี fontconfig)
  const FONT_FAMILY = {
    kanit: 'Kanit ExtraBold', itim: 'Itim', prompt: 'Prompt', mitr: 'Mitr', chonburi: 'Chonburi',
    sriracha: 'Sriracha', baijamjuree: 'Bai Jamjuree', chakra: 'Chakra Petch', k2d: 'K2D', mali: 'Mali',
    bold: 'Leelawadee UI',
  };
  // เอฟเฟกต์ตอนซับขึ้น → ASS override tag (ใส่หน้าทุกซับ)
  function subEffectTag(effect) {
    switch (effect) {
      case 'fade':    return '{\\fad(160,0)}';
      case 'pop':     return '{\\fscx118\\fscy118\\t(0,150,\\fscx100\\fscy100)}';
      case 'zoom':    return '{\\fscx55\\fscy55\\fad(90,0)\\t(0,170,\\fscx100\\fscy100)}';
      case 'fadepop': return '{\\fad(140,0)\\fscx122\\fscy122\\t(0,160,\\fscx100\\fscy100)}';
      default:        return '';
    }
  }
  // เวลา ASS: H:MM:SS.CC (centisecond)
  function fmtAssTime(t) {
    const cs = Math.max(0, Math.round(t * 100));
    const p = (v, n) => String(v).padStart(n || 2, '0');
    return `${Math.floor(cs / 360000)}:${p(Math.floor((cs % 360000) / 6000))}:${p(Math.floor((cs % 6000) / 100))}.${p(cs % 100)}`;
  }
  // ตัดข้อความเป็นคำไทยทีละคำ (ซับสไตล์ CapCut รัวๆ) — เก็บสระ/คำจิ๋วติดคำเดิม
  function splitWordsThai(text) {
    const toks = splitTokens(text);
    const out = [];
    for (const t of toks) {
      const w = String(t).trim();
      if (!w) continue;
      if (out.length && (w.length <= 1 || /^[ัิ-ฺ็-๎ๆฯ]/.test(w))) out[out.length - 1] += w;
      else out.push(w);
    }
    return out.length ? out : toks;
  }
  // ประกอบไฟล์ .ass ทั้งใบจาก blocks [{start,end,text}] (เวลา absolute บนไทม์ไลน์รวม)
  function buildAssDoc(blocks, W, H, o) {
    const st = ASS_STYLE[o.styleKey] || ASS_STYLE.tiktok_bold;
    const outline = (o.outline != null && o.outline !== '') ? Math.max(0, Math.min(12, Number(o.outline))) : st.outline;
    const marginV = Math.floor(H * (o.posRatio || 0.24)); // 0.24 ≈ ตำแหน่งเดิมของ drawtext (y=72% จากบน)
    const marginH = Math.floor(W * 0.07);
    const fx = subEffectTag(o.effect);
    const header =
      `[Script Info]\nScriptType: v4.00+\nPlayResX: ${W}\nPlayResY: ${H}\n` +
      `WrapStyle: 2\nYCbCr Matrix: TV.709\n\n` + // WrapStyle 2 = ไม่ตัดบรรทัดเอง (กัน libass ผ่ากลางคำไทย)
      `[V4+ Styles]\n` +
      `Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, ` +
      `Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, ` +
      `Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n` +
      `Style: Default,${o.fontName},${o.fontSize},${st.primaryColour},&H00000000,${st.outlineColour},&H80000000,` +
      `-1,0,0,0,100,100,0,0,${st.borderStyle},${outline},${st.shadow || 0},2,${marginH},${marginH},${marginV},1\n\n` +
      `[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;
    let events = '';
    for (const b of blocks) {
      const text = String(b.text || '').replace(/[\r\n]+/g, ' ').trim();
      if (!text) continue;
      events += `Dialogue: 0,${fmtAssTime(b.start)},${fmtAssTime(Math.max(b.start + 0.05, b.end))},Default,,0,0,0,,${fx}${text}\n`;
    }
    return header + events;
  }

  /**
   * build 1 สินค้า → Blob(mp4)
   * req: { clips:[base64 mp4], scenes:[{voice, durationSec, audioBlob}], aspect, subStyle, music:{enabled,blob,volume}, silenceCut }
   */
  async function buildVideo(req, log) {
    const ff = await loadFF(log);
    try { await ensureMeasureFonts(); } catch (e) {} // v0.2: โหลดฟอนต์เพื่อวัดความกว้างจริง
    // v0.6.6: ความละเอียด output ตาม quality ที่เลือก (เดิม fix 720×1280 → คลิป 1080p ก็ถูก scale ลง 720p)
    //   720p ×1 (720×1280) · 1080p ×1.5 (1080×1920) · 4k ×3 (2160×3840) — บังคับเลขคู่ให้ libx264
    const [_bw, _bh] = SIZES[req.aspect] || SIZES['9:16'];
    const _qMult = req.quality === '4k' ? 3 : req.quality === '1080p' ? 1.5 : 1;
    const W = Math.round(_bw * _qMult / 2) * 2, H = Math.round(_bh * _qMult / 2) * 2;
    // v0.6.7: ยึด "จำนวนฉาก (เสียงพากย์)" เป็นความยาวจริงของวิดีโอ — ไม่ใช่จำนวนคลิป
    //   เดิม n = จำนวนคลิป → ถ้าบางฉากเฟล (ได้คลิปไม่ครบ) เสียงฉากที่เหลือถูกทิ้ง + วิดีโอสั้นกว่าเสียง (เสียฟุตเทจฟรี)
    //   ใหม่: วนคลิปที่มี (clips[i % clipCount]) เติมให้ครบทุกฉาก → เสียงพากย์ครบ ไม่ตัดทิ้ง
    const clipCount = req.clips.length;
    if (!clipCount) throw new Error('ไม่มีคลิปสำหรับรวม (ทุกฉากเฟล)');
    const n = req.scenes.length;
    if (log && clipCount < n) log(`⚠️ ได้คลิป ${clipCount}/${n} ฉาก — วนคลิปที่มีเติมให้ครบเสียงพากย์ทุกฉาก (ไม่ตัดเสียงทิ้ง)`);
    const CLIP_LEN = req.maxClipSec || 8;   // 8 (Veo/Omni8s) หรือ 10 (Omni Flash 10 วิ) — ตามโมเดลที่เลือก
    const MIN_SCENE = req.minSceneSec || 5;  // ⏱️ ขั้นต่ำต่อฉาก — กันคลิปสั้นเวลาเสียงพากย์สั้น (เสียงจบแล้วภาพ+เพลงเล่นต่อ)
    const clipHead = new Array(clipCount).fill(0); // playhead ต่อคลิป — เลื่อนไปเรื่อยๆ เวลาใช้ซ้ำ (โชว์ครบ 8 วิให้คุ้ม)
    const cleanup = [];

    try {
      // ── เขียน clips (วิดีโอเงียบ) + voiceover wav ──
      const durs = [];
      for (let i = 0; i < n; i++) {
        await ff.writeFile('v' + i + '.mp4', b64ToU8(req.clips[i % clipCount])); // v0.6.7: คลิปไม่ครบ → วนใช้ซ้ำ
        cleanup.push('v' + i + '.mp4');
        await ff.writeFile('a' + i + '.wav', await u8(req.scenes[i].audioBlob));
        cleanup.push('a' + i + '.wav');
        // ความยาวฉาก = เสียงพากย์ + หาง 0.4s · แต่ไม่ต่ำกว่า MIN_SCENE (กันคลิปสั้น) · ไม่เกิน CLIP_LEN (ความยาวคลิปจริง)
        durs.push(Math.min(Math.max((req.scenes[i].durationSec || 6) + 0.4, MIN_SCENE), CLIP_LEN));
      }

      const subOn = req.subStyle && req.subStyle !== 'none' && ff._fontOk;
      const st = Object.assign({}, SUB_STYLE[req.subStyle] || SUB_STYLE.tiktok_bold);
      // ปรับเส้นขอบจาก UI (0-12) ถ้ามีค่าส่งมา — ทับค่า default ของสไตล์
      if (req.subOutline != null && req.subOutline !== '') {
        st.border = Math.max(0, Math.min(12, Number(req.subOutline)));
      }
      const fontFile = (ff._fonts && ff._fonts[req.subFont]) || (ff._fonts && ff._fonts.kanit) || (ff._fonts && ff._fonts.bold) || 'kanit.ttf';
      const anim = req.subAnim || 'fade'; // 'fade' | 'pop' | 'none'
      // ขนาดซับจาก UI: subSize = อัตราส่วนความกว้างจอ (0.045 เล็ก – 0.075 ใหญ่), default 0.06
      const sizeRatio = (req.subSize != null && req.subSize !== '') ? Number(req.subSize) : 0.06;
      const fs = Math.round(W * sizeRatio);            // ตัวใหญ่ขึ้น เด่นแบบ TikTok
      const yPos = Math.round(H * 0.72);               // วาง ~72% ของจอ (ค่อนล่าง)

      // v0.2: วัดความกว้างจริงด้วย Canvas measureText (ฟอนต์+ขนาดเดียวกับที่ render)
      //   งบความกว้างต่อการ์ด = 86% ของจอ − เผื่อเส้นขอบซ้ายขวา (border ทำให้ตัวอักษรกว้างขึ้น)
      const measFam = (_measureFamily && _measureFamily[req.subFont]) || (_measureFamily && _measureFamily.kanit) || '';
      let measureFn;
      try {
        const mctx = document.createElement('canvas').getContext('2d');
        // ไม่ใส่ weight (ไฟล์ฟอนต์เป็น Bold/ExtraBold อยู่แล้ว — ใส่ 700 จะ faux-bold วัดกว้างเกิน)
        mctx.font = `${fs}px "${measFam}", Tahoma, sans-serif`;
        measureFn = (s) => mctx.measureText(s).width;
      } catch (e) {
        measureFn = (s) => String(s).length * fs * 0.55; // fallback ถ้าไม่มี canvas
      }
      const maxWidthPx = Math.max(fs * 2, W * 0.86 - st.border * 2);

      // ── filter: ต่อวิดีโอ (ตัดตามความยาวเสียง + scale/crop) — v0.7: ซับไม่เผาตรงนี้แล้ว (แยกไปเบิร์น ASS pass 2) ──
      const wordMode = req.subSplit === 'word'; // ⚡ ซับทีละคำรัวๆ สไตล์ CapCut
      const vlabels = [];
      const parts = [];
      const cardOnsets = []; // เวลาเริ่มของแต่ละการ์ด (absolute timeline) — สำหรับเสียงเอฟเฟกต์
      const srtBlocks = [];  // การ์ดซับทั้งไทม์ไลน์ [{start,end,text}] — ไปเบิร์นเป็น ASS ใน pass 2
      let elapsed = 0;
      for (let i = 0; i < n; i++) {
        // v0.3: ยำ — รับตำแหน่งเริ่มสุ่มต่อฉาก (req.clipStarts[i]) → ตัด "ช่วงสุ่ม" ของคลิป (ไม่ใช่จากวิ 0 เสมอ)
        // v0.6.7: ถ้าไม่มี clipStarts และคลิปถูกใช้ซ้ำ (คลิปไม่ครบ) → เลื่อน playhead ไปช่วงถัดไปของคลิป
        //   โชว์คนละส่วนของคลิป 8 วิให้ครบ ไม่ซ้ำจำเจ · เคสคลิปครบ (ใช้คลิปละครั้ง) → playhead=0 = พฤติกรรมเดิม ไม่เปลี่ยน
        const _ci = i % clipCount;
        let cs;
        if (req.clipStarts && req.clipStarts[i] > 0) {
          cs = req.clipStarts[i];
        } else {
          cs = clipHead[_ci];
          if (cs + durs[i] > CLIP_LEN) cs = Math.max(0, CLIP_LEN - durs[i]); // ไม่ให้เลยปลายคลิป
          clipHead[_ci] = (cs + durs[i] >= CLIP_LEN - 0.05) ? 0 : cs + durs[i]; // เลื่อนต่อ / วนกลับต้นคลิป
        }
        parts.push(`[${i}:v]trim=${cs.toFixed(2)}:${(cs + durs[i]).toFixed(2)},setpts=PTS-STARTPTS,` +
          `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,fps=24[v${i}]`);
        vlabels.push(`[v${i}]`);
        if (subOn) {
          if (wordMode) {
            // ⚡ การ์ดละคำ — เวลาเกลี่ยตามสัดส่วนความยาวคำในท่อนพูด (ขั้นต่ำ 0.12s รัวตามจังหวะจริง)
            const words = splitWordsThai(req.scenes[i].voice);
            const total = words.reduce((t, w) => t + w.length, 0) || 1;
            let tt = elapsed;
            cardOnsets.push(elapsed); // SFX เด้งตามต้นท่อนพูด (ทุกคำ = หนวกหู)
            words.forEach((w, wi) => {
              const d = Math.max(0.12, durs[i] * (w.length / total));
              const end = wi === words.length - 1 ? elapsed + durs[i] : Math.min(elapsed + durs[i], tt + d);
              srtBlocks.push({ start: tt, end: Math.max(end, tt + 0.12), text: w });
              tt += d;
            });
          } else {
            // v0.2: ตัดการ์ดตามความกว้างจริง (ไม่ล้นจอแน่นอน) + ไม่เกิน 14 token/การ์ด (คงฟีลการ์ดสั้น)
            const cards = chunkText(req.scenes[i].voice, measureFn, maxWidthPx, 14);
            const slot = durs[i] / Math.max(cards.length, 1);
            cards.forEach((card, ci) => {
              cardOnsets.push(elapsed + ci * slot);
              srtBlocks.push({ start: elapsed + ci * slot, end: elapsed + (ci + 1) * slot, text: card });
            });
          }
        }
        elapsed += durs[i];
      }
      parts.push(`${vlabels.join('')}concat=n=${n}:v=1:a=0[vout]`);

      // ── เสียง: ต่อ voiceover ทุกท่อน ──
      const alabels = [];
      for (let i = 0; i < n; i++) {
        parts.push(`[${n + i}:a]atrim=0:${durs[i].toFixed(2)},asetpts=PTS-STARTPTS,aresample=48000[a${i}]`);
        alabels.push(`[a${i}]`);
      }
      parts.push(`${alabels.join('')}concat=n=${n}:v=0:a=1[voice]`);

      const inputs = [];
      for (let i = 0; i < n; i++) inputs.push('-i', 'v' + i + '.mp4');
      for (let i = 0; i < n; i++) inputs.push('-i', 'a' + i + '.wav');

      // เก็บ label เสียงทุกแหล่งที่จะ mix รวมกัน (voice ก่อนเสมอ — voice ดังสุด)
      const mixLabels = ['[voice]'];
      let nextIdx = 2 * n;

      // ── เพลงพื้นหลัง (เบา ใต้เสียงพากย์) ──
      const musicOn = req.music && req.music.enabled && req.music.blob;
      if (musicOn) {
        const idx = nextIdx++;
        await ff.writeFile('bg.mp3', await u8(req.music.blob));
        cleanup.push('bg.mp3');
        inputs.push('-stream_loop', '-1', '-i', 'bg.mp3');
        const vol = ((req.music.volume || 18) / 100).toFixed(2);
        parts.push(`[${idx}:a]volume=${vol},aresample=48000[bg]`);
        mixLabels.push('[bg]');
      }

      // ── เสียงเอฟเฟกต์ตอนซับขึ้น (click/pop เด้งตามการ์ด) ──
      const sfxOn = req.sfx && req.sfx.enabled && req.sfx.blob && cardOnsets.length > 0;
      if (sfxOn) {
        const idx = nextIdx++;
        await ff.writeFile('sfx.mp3', await u8(req.sfx.blob));
        cleanup.push('sfx.mp3');
        inputs.push('-i', 'sfx.mp3');
        const svol = ((req.sfx.volume || 50) / 100).toFixed(2);
        // จำกัดจำนวนเอฟเฟกต์ไม่เกิน 24 ครั้ง (กัน filter graph ใหญ่เกิน)
        const onsets = cardOnsets.slice(0, 24);
        // แตกสำเนา sfx เท่าจำนวนการ์ด → adelay แต่ละตัวไปตรงเวลาที่ซับขึ้น
        const splitOuts = onsets.map((_, k) => `[sfxsrc${k}]`).join('');
        parts.push(`[${idx}:a]volume=${svol},aresample=48000,asplit=${onsets.length}${splitOuts}`);
        const sfxLabels = [];
        onsets.forEach((t, k) => {
          const ms = Math.max(0, Math.round(t * 1000));
          parts.push(`[sfxsrc${k}]adelay=${ms}|${ms}[sfx${k}]`);
          sfxLabels.push(`[sfx${k}]`);
        });
        mixLabels.push(...sfxLabels);
      }

      // ── mix ทุกแหล่งเข้าด้วยกัน (normalize=0 = ไม่ลดวอลุ่มตามจำนวน input) ──
      let audioOutLabel = '[voice]';
      if (mixLabels.length > 1) {
        parts.push(`${mixLabels.join('')}amix=inputs=${mixLabels.length}:duration=first:normalize=0:dropout_transition=0[aout]`);
        audioOutLabel = '[aout]';
      }

      const filter = parts.join(';');
      log && log(`🎬 รวมร่าง ${n} ฉาก + เสียงพากย์${musicOn ? ' + เพลง' : ''}${sfxOn ? ' + เอฟเฟกต์' : ''}${subOn ? ' + ซับ' : ''}...`);

      // v0.6.4: คุมความยาว output ด้วย -t (เท่าผลรวมเสียงพากย์) แทน -shortest
      //   เหตุ: -stream_loop -1 (เพลงวนไม่จำกัด) + -shortest → FFmpeg.wasm บางครั้งทิ้ง stream เพลงแบบสุ่ม
      //   (บั๊ก "สินค้าบางชิ้นไม่มีเพลง") · ใช้ -t = deterministic วิดีโอ+เพลงยาวเท่ากันเป๊ะทุกครั้ง
      const totalDur = durs.reduce((a, b) => a + b, 0);
      // v0.7: ถ้าจะเบิร์นซับต่อ (pass 2) → ไฟล์กลางตั้ง crf แน่นขึ้น กันเบลอจาก encode ซ้ำ
      const willBurn = subOn && srtBlocks.length > 0;
      const args = [...inputs, '-filter_complex', filter, '-map', '[vout]', '-map', audioOutLabel,
        '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', willBurn ? '19' : '23',
        '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-pix_fmt', 'yuv420p',
        '-t', totalDur.toFixed(2), 'out.mp4'];
      await ff.exec(args);
      cleanup.push('out.mp4');

      let outName = 'out.mp4';

      // ── v0.7 PASS 2: เบิร์นซับ ASS (แยก pass เสมอ — กติกาจาก Yum Clip, รวมใน filter_complex = เงียบหาย) ──
      if (willBurn) {
        try {
          // เตรียมฟอนต์ใน /assfonts (libass หาใน fontsdir ตามชื่อ family จริง)
          try { await ff.createDir('/assfonts'); } catch (_) {}
          const fKey = FONT_FAMILY[req.subFont] ? req.subFont : 'kanit';
          const fPath = FONTS[fKey] || FONTS.kanit;
          const fBytes = new Uint8Array(await (await fetch(chrome.runtime.getURL(fPath))).arrayBuffer());
          await ff.writeFile('/assfonts/' + fKey + '.ttf', fBytes);
          const ass = buildAssDoc(srtBlocks, W, H, {
            styleKey: req.subStyle,
            fontName: FONT_FAMILY[fKey],
            fontSize: fs,
            outline: req.subOutline,
            effect: anim,                       // fade/pop/zoom/fadepop/none
            posRatio: req.subPos ? Number(req.subPos) : 0.24, // 0.24 = ตำแหน่งเดิม (drawtext y 72% จากบน)
          });
          await ff.writeFile('sub.ass', new TextEncoder().encode(ass));
          cleanup.push('sub.ass');
          log && log(`✍️ เบิร์นซับ ${srtBlocks.length} การ์ด${wordMode ? ' (ทีละคำ ⚡)' : ''}...`);
          await ff.exec(['-y', '-i', 'out.mp4', '-vf', 'ass=sub.ass:fontsdir=/assfonts:shaping=complex',
            '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23', '-c:a', 'copy', 'subbed.mp4']);
          cleanup.push('subbed.mp4');
          outName = 'subbed.mp4';
        } catch (e) {
          log && log('⚠️ เบิร์นซับไม่สำเร็จ — ได้คลิปไม่มีซับ: ' + e.message);
        }
      }
      // ── ตัดช่วงเงียบ (optional) — silencedetect แล้ว trim+concat (port QuickCut) ──
      if (req.silenceCut) {
        try {
          const before = outName; // v0.7: ตัดเงียบจากไฟล์ที่เบิร์นซับแล้ว (เดิม hardcode out.mp4)
          outName = await silenceCutPass(ff, before, log);
          if (outName !== before) cleanup.push(outName);
        } catch (e) { log && log('⚠️ ตัดเงียบไม่ได้ — ใช้คลิปเต็ม: ' + e.message); }
      }

      const data = await ff.readFile(outName);
      return new Blob([data], { type: 'video/mp4' });
    } finally {
      for (const f of cleanup) { try { await ff.deleteFile(f); } catch (e) {} }
      freeFF();
    }
  }

  // ── ตัดช่วงเงียบ (port PD QuickCut: silencedetect → trim+concat) ──
  //   ค่า default ตรงกับ QuickCut เป๊ะ: -20dB / ขั้นต่ำ 0.3 วิ / เผื่อหัวท้าย 0.15 วิ
  async function silenceCutPass(ff, input, log) {
    const NOISE_DB = -20;     // ความไวจับเสียงเงียบ (QuickCut default)
    const MIN_SIL = 0.3;      // ช่วงเงียบขั้นต่ำที่จะตัด (วิ)
    const PAD = 0.15;         // เผื่อหัวท้ายรอบเสียงพูด (วิ)
    log && log(`✂️ ตรวจช่วงเงียบ (${NOISE_DB}dB / ${MIN_SIL}วิ / เผื่อ ${PAD}วิ)...`);
    let logTxt = '';
    const onLog = ({ message }) => { logTxt += message + '\n'; };
    ff.on('log', onLog);
    await ff.exec(['-i', input, '-af', `silencedetect=noise=${NOISE_DB}dB:d=${MIN_SIL}`, '-f', 'null', '-']);
    ff.off('log', onLog);

    const starts = [...logTxt.matchAll(/silence_start:\s*([\d.]+)/g)].map((m) => parseFloat(m[1]));
    const ends = [...logTxt.matchAll(/silence_end:\s*([\d.]+)/g)].map((m) => parseFloat(m[1]));
    const durMatch = logTxt.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
    const total = durMatch ? (+durMatch[1] * 3600 + +durMatch[2] * 60 + parseFloat(durMatch[3])) : 0;
    if (!total || starts.length === 0) { log && log('  ไม่พบช่วงเงียบที่ต้องตัด'); return input; }

    // สร้าง "ช่วงที่ไม่เงียบ" (keep) — หดช่วงเงียบเข้าด้านในข้างละ PAD (กันตัดติดคำพูด)
    const keep = [];
    let cur = 0;
    for (let i = 0; i < starts.length; i++) {
      const silStart = starts[i] + PAD;            // เก็บเสียงไว้อีก PAD ก่อนเงียบ
      const silEnd = ((i < ends.length) ? ends[i] : total) - PAD; // ตัดเงียบให้สั้นลง PAD ก่อนเสียงถัดไป
      if (silStart - cur > 0.05) keep.push([cur, silStart]);
      cur = Math.max(silEnd, cur);
    }
    if (total - cur > 0.05) keep.push([cur, total]);
    if (keep.length === 0) return input;
    const cutSec = total - keep.reduce((a, [s, e]) => a + (e - s), 0);
    log && log(`  ตัดเงียบออก ${cutSec.toFixed(1)} วิ (เหลือ ${keep.length} ช่วง จาก ${total.toFixed(1)} วิ)`, 'success');

    // trim แต่ละช่วง + concat
    const vparts = [], aparts = [], vlab = [], alab = [];
    keep.forEach(([s, e], i) => {
      vparts.push(`[0:v]trim=${s.toFixed(2)}:${e.toFixed(2)},setpts=PTS-STARTPTS[kv${i}]`);
      aparts.push(`[0:a]atrim=${s.toFixed(2)}:${e.toFixed(2)},asetpts=PTS-STARTPTS[ka${i}]`);
      vlab.push(`[kv${i}]`); alab.push(`[ka${i}]`);
    });
    const filter = [...vparts, ...aparts].join(';') + ';' +
      vlab.map((v, i) => v + alab[i]).join('') + `concat=n=${keep.length}:v=1:a=1[cv][ca]`;
    log && log(`  ตัดเหลือ ${keep.length} ช่วง (จาก ${total.toFixed(1)} วิ)`);
    await ff.exec(['-i', input, '-filter_complex', filter, '-map', '[cv]', '-map', '[ca]',
      '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23', '-c:a', 'aac', '-b:a', '160k',
      '-movflags', '+faststart', '-pix_fmt', 'yuv420p', 'cut.mp4']);
    return 'cut.mp4';
  }

  // ===========================================================================
  // v0.3: 🎬 รวมคลิปของผู้ใช้เอง (Clip Merge Mode) — ผู้ใช้อัปคลิปหลายฉาก → ต่อให้เป็นคลิปเดียว
  //   files = [Blob/File] เรียงตามลำดับที่ user เลือก (ฉาก 1..N) · สูงสุด 20
  //   opts = { aspect, silenceCut, music:{enabled,blob,volume} }
  //   2-pass (normalize ทีละคลิป → concat copy) — memory คงที่ ไม่ระเบิดแม้ 20 คลิป (บทเรียนจาก VIP)
  //   เก็บเสียงเดิมของคลิป + ตัดเงียบ(option) + เพลงแบ็คกราวด์(option) คลุมเสียงเดิม
  // ===========================================================================
  async function mergeUserClips(files, opts, log) {
    if (!files || files.length === 0) throw new Error('ไม่มีคลิป');
    opts = opts || {};
    const ff = await loadFF(log);
    const [W, H] = SIZES[opts.aspect] || SIZES['9:16'];
    const cleanup = [];
    const normalized = [];
    try {
      // ── Pass 1: normalize ทีละคลิป (scale/crop/fps/sar + เก็บเสียงเดิม 48k stereo) — memory คงที่ ──
      for (let i = 0; i < files.length; i++) {
        log && log(`📥 ปรับคลิป ${i + 1}/${files.length}...`);
        const inName = 'u' + i + '.mp4';
        const outName = 'n' + i + '.mp4';
        try {
          await ff.writeFile(inName, await u8(files[i]));
          // v0.3: ยำ — ตัด "ช่วงสุ่ม" ของคลิป: เริ่มที่ opts.starts[i] (สุ่ม) ยาว opts.trims[i] วิ (0/undefined = เต็ม)
          const trimSec = (opts.trims && opts.trims[i] > 0) ? opts.trims[i] : 0;
          const startSec = (opts.starts && opts.starts[i] > 0) ? opts.starts[i] : 0;
          const args = [];
          if (startSec > 0) args.push('-ss', startSec.toFixed(2)); // ข้ามไปตำแหน่งเริ่ม (ก่อน -i = seek เร็ว)
          args.push('-i', inName,
            '-vf', `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,fps=24`,
            '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23',
            '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-ac', '2',
            '-pix_fmt', 'yuv420p', '-video_track_timescale', '24000');
          if (trimSec > 0) args.push('-t', trimSec.toFixed(2)); // ความยาวช่วงที่หยิบ
          args.push(outName);
          await ff.exec(args);
          normalized.push(outName); cleanup.push(outName);
        } catch (e) {
          log && log(`⚠️ คลิป ${i + 1} ปรับไม่สำเร็จ — ข้ามคลิปนี้ (รวมที่เหลือต่อ)`);
        }
        try { await ff.deleteFile(inName); } catch (_) {}
      }
      if (normalized.length === 0) throw new Error('ปรับคลิปไม่สำเร็จสักอัน (ไฟล์อาจเสีย/decode ไม่ได้)');

      // ── Pass 2: concat demuxer + copy (ไม่ decode = เบา + เร็ว) ──
      const listText = normalized.map((n) => `file '${n}'`).join('\n');
      await ff.writeFile('cm_list.txt', new TextEncoder().encode(listText)); cleanup.push('cm_list.txt');
      log && log(`🎬 รวม ${normalized.length} คลิปตามลำดับ...`);
      await ff.exec(['-f', 'concat', '-safe', '0', '-i', 'cm_list.txt', '-c', 'copy', '-movflags', '+faststart', 'cm_merged.mp4']);
      cleanup.push('cm_merged.mp4');
      let cur = 'cm_merged.mp4';

      // ── Pass 3 (option): ตัดช่วงเงียบ — ทำก่อนใส่เพลง (กันตัดเพลงไปด้วย) ──
      if (opts.silenceCut) {
        try {
          const out = await silenceCutPass(ff, cur, log);
          if (out !== cur) { cur = out; cleanup.push(out); }
        } catch (e) { log && log('⚠️ ตัดเงียบไม่ได้ — ใช้คลิปเต็ม: ' + e.message); }
      }

      // ── Pass 4 (option): เพลงแบ็คกราวด์ คลุมเสียงเดิม (video copy = เบา) ──
      if (opts.music && opts.music.enabled && opts.music.blob) {
        log && log('🎵 ใส่เพลงแบ็คกราวด์...');
        await ff.writeFile('cm_bg.mp3', await u8(opts.music.blob)); cleanup.push('cm_bg.mp3');
        const vol = ((opts.music.volume || 18) / 100).toFixed(2);
        try {
          await ff.exec([
            '-i', cur, '-stream_loop', '-1', '-i', 'cm_bg.mp3',
            '-filter_complex', `[0:a]aresample=48000[a0];[1:a]volume=${vol},aresample=48000[a1];[a0][a1]amix=inputs=2:duration=first:normalize=0:dropout_transition=0[aout]`,
            '-map', '0:v', '-map', '[aout]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k',
            '-movflags', '+faststart', '-shortest', 'cm_music.mp4',
          ]);
          cleanup.push('cm_music.mp4'); cur = 'cm_music.mp4';
        } catch (e) { log && log('⚠️ ใส่เพลงไม่สำเร็จ — ใช้เสียงเดิม: ' + e.message); }
      }

      const data = await ff.readFile(cur);
      log && log(`✅ รวมเสร็จ ${(data.length / 1048576).toFixed(1)} MB`);
      return new Blob([data], { type: 'video/mp4' });
    } finally {
      for (const f of cleanup) { try { await ff.deleteFile(f); } catch (e) {} }
      freeFF();
    }
  }

  global.PDMiniEngine = { buildVideo, mergeUserClips };
})(window);
