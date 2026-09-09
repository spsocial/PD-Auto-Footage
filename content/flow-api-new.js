/**
 * flow-api-new.js — Flow Direct API client สำหรับ "แอปใหม่" flow.google.com (Angular · batchexecute RPC)
 *
 * ต่างจาก flow-api.js (แอปเก่า labs.google · aisandbox-pa REST + Bearer ya29):
 *   - Endpoint: POST https://flow.google.com/_/AiSandboxAngularFrontend/data/batchexecute?rpcids=<id>&...
 *   - Body: f.req=<url-encoded nested array>&at=<xsrf token จาก WIZ_global_data.SNlM0e>
 *   - Auth: cookie same-origin (credentials:'include') — ไม่มี Bearer ให้ดัก · reCAPTCHA sitekey เดิม (ยืนยัน 2026-09-03)
 *   - Response: prefix )]}'  แล้ว chunk <len>\n<json> · payload อยู่ใน ["wrb.fr","<rpcid>","<json-string>"]
 *
 * โหลดใน MAIN world ต่อจาก flow-api.js · flow-api.js dispatch เช็ค window.__pdNewFlow.active → delegate มาที่นี่
 *   ⚠️ แอปเก่า (labs.google หรือ flow.google.com/fx/...) = active=false → เดินเส้นเดิม 100% ไม่กระทบ
 *
 * โครง RPC ทั้งหมดแกะจากของจริง 2026-09-03 (log console owner + ยิงทดสอบผ่าน client นี้ในโครม owner — ผ่านทุก op):
 *   jHPbke = สร้างโปรเจ็ค · maseQ = อัปโหลดรูป · ogiZ0b = เจนภาพ (sync · แนบ ref ได้) · eb1hJf = i2v submit (async)
 *   jwpduf = poll สถานะ · as29s = ดึง media รายตัว (URL ภาพ/วิดีโอ signed CDN flow-content.google) · nzlxg = เครดิต
 *   ยังไม่รองรับ (owner 2026-09-03: เอาเส้นสร้างปกติก่อน): r2v/Ingredients · ต่อฉาก extend/scene/concat · upsample · ลบโปรเจ็ค
 *
 * enum ที่ยืนยันแล้ว: aspect ภาพ 1=1:1 · 2=9:16 · 3=16:9 · 4=3:4 · 5=4:3 (วัดจาก [w,h] จริง)
 *   สถานะเจน (ช่องที่ 7 ของ record): [6]=เข้าคิว · [2]=กำลังเจน · [3]=เสร็จ · [4,[..,"msg"]]=เฟล
 */
(function () {
  'use strict';
  if (window.__pdNewFlowInstalled) return;
  window.__pdNewFlowInstalled = true;

  // ---------- ตรวจว่าเป็นแอปใหม่ไหม ----------
  //   แอปใหม่ = host flow.google.com + ไม่ใช่ path /fx/ (แอปเก่าที่เสิร์ฟบนโดเมนใหม่ยังใช้ /fx/tools/flow)
  function isNewApp() {
    try {
      if (location.hostname !== 'flow.google.com') return false;
      if (/^\/fx(\/|$)/.test(location.pathname)) return false;
      return true;
    } catch (_) { return false; }
  }

  var TOOL_ENUM = 22;               // PINHOLE
  var SITEKEY = '6LdsFiUsAAAAAIjVDZcuLhaHiDn5nnHVXVRQGeMV'; // ตัวเดียวกับ flow-api.js — ทดสอบแล้ว execute ได้บนแอปใหม่
  var FRONTEND = 'AiSandboxAngularFrontend';
  var TAG = '[PD new-flow]';

  // ---------- batchexecute client ----------
  function wiz() { try { return window.WIZ_global_data || null; } catch (_) { return null; } }
  function getAt() {
    var w = wiz(); if (w && w.SNlM0e) return w.SNlM0e;
    try { var m = document.documentElement.innerHTML.match(/"SNlM0e":"([^"]+)"/); if (m) return m[1]; } catch (_) {}
    return null;
  }
  // รอ at token (หน้าเพิ่งโหลด WIZ_global_data อาจยังไม่มา)
  async function ensureAt(ms) {
    var dl = Date.now() + (ms || 20000);
    while (!getAt() && Date.now() < dl) await sleep(300);
    var at = getAt();
    if (!at) throw new Error('หน้า Flow ใหม่ยังโหลดไม่เสร็จ (ไม่พบ token SNlM0e) — รีเฟรชแท็บ Flow แล้วลองใหม่');
    return at;
  }

  var _reqid = Math.floor(Math.random() * 900000) + 100000;
  function bxUrl(rpcid) {
    _reqid += 100000;
    var w = wiz() || {};
    var q = 'rpcids=' + encodeURIComponent(rpcid)
      + '&source-path=' + encodeURIComponent(location.pathname)
      + (w.cfb2h ? '&bl=' + encodeURIComponent(w.cfb2h) : '')
      + (w.FdrFJe ? '&f.sid=' + encodeURIComponent(w.FdrFJe) : '')
      + '&hl=en&_reqid=' + _reqid + '&rt=c';
    return 'https://flow.google.com/_/' + FRONTEND + '/data/batchexecute?' + q;
  }

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  var _origFetch = window.fetch; // จับก่อน hook อื่น (flow-api.js hook fetch ไว้ดัก auth — ไม่กระทบ แต่ใช้ตัวดิบชัวร์กว่า)

  // ยิง 1 rpc · innerArg = array (จะ stringify ให้) · คืน payload ที่ parse แล้ว
  async function callRpc(rpcid, innerArg, opts) {
    opts = opts || {};
    var at = await ensureAt();
    var innerStr = typeof innerArg === 'string' ? innerArg : JSON.stringify(innerArg);
    var freq = JSON.stringify([[[rpcid, innerStr, null, 'generic']]]);
    var body = 'f.req=' + encodeURIComponent(freq) + '&at=' + encodeURIComponent(at) + '&';
    var max = typeof opts.retries === 'number' ? opts.retries : 2;
    var lastErr = null;
    for (var attempt = 0; attempt <= max; attempt++) {
      var r, text;
      try {
        r = await _origFetch(bxUrl(rpcid), {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', 'X-Same-Domain': '1' },
          body: body,
          credentials: 'include',
        });
        text = await r.text();
      } catch (e) {
        lastErr = e;
        if (attempt < max) { await sleep(2000 * Math.pow(2, attempt)); continue; }
        throw e;
      }
      if (!r.ok) {
        // 5xx/429 = ลองใหม่ · อื่น = โยนพร้อม body (400 = payload ผิด · 403 = reCAPTCHA/สิทธิ์)
        if ((r.status === 429 || r.status >= 500) && attempt < max) { await sleep(1500 * Math.pow(2, attempt)); continue; }
        var err = new Error('Flow API ' + r.status + ' (' + rpcid + ') ' + _errHint(text));
        err.status = r.status; err.body = String(text || '').slice(0, 1500); throw err;
      }
      return parseBatch(text, rpcid);
    }
    throw lastErr || new Error('batchexecute failed');
  }
  function _errHint(text) {
    try { var m = String(text || '').match(/"([^"]{8,160})"/); return m ? m[1] : String(text || '').slice(0, 120); } catch (_) { return ''; }
  }

  // parse: strip )]}'  → chunk <len>\n<json> → หา ["wrb.fr","<rpcid>","<payload-string>"] · ["er",...] = error
  function parseBatch(text, wantRpc) {
    text = String(text).replace(/^\)\]\}'\s*/, '');
    var pos = 0, payloadStr = null, errRow = null;
    while (pos < text.length) {
      var nl = text.indexOf('\n', pos);
      if (nl < 0) break;
      var lenTok = text.slice(pos, nl).trim();
      if (!/^\d+$/.test(lenTok)) { pos = nl + 1; continue; }
      var len = parseInt(lenTok, 10);
      var jsonStr = text.slice(nl + 1, nl + 1 + len);
      pos = nl + 1 + len;
      var chunk; try { chunk = JSON.parse(jsonStr); } catch (_) { continue; }
      if (!Array.isArray(chunk)) continue;
      for (var i = 0; i < chunk.length; i++) {
        var row = chunk[i];
        if (!Array.isArray(row)) continue;
        if (row[0] === 'wrb.fr' && row[1] === wantRpc && typeof row[2] === 'string') payloadStr = row[2];
        if (row[0] === 'wrb.fr' && row[1] === wantRpc && row[2] == null && row[5] != null) errRow = row; // rpc error: payload null + error tuple
        if (row[0] === 'er') errRow = row;
      }
    }
    if (payloadStr == null) {
      var re = new RegExp('"wrb\\.fr","' + wantRpc + '","((?:[^"\\\\]|\\\\.)*)"');
      var m = text.match(re);
      if (m) { try { payloadStr = JSON.parse('"' + m[1] + '"'); } catch (_) {} }
    }
    if (payloadStr == null) {
      /* 🩺 owner 2026-09-09 (ลูกค้าแจ้งกันหลายราย): "Flow API (ogiZ0b) ไม่คืนผลลัพธ์ · Google ตอบ: ,null,null,null,[8,null,[["
         ตัวเลขตัวแรกในก้อน error = โค้ดมาตรฐานของ Google → แปลเป็นภาษาคนให้รู้ว่าต้องทำอะไรต่อ
         (สำคัญมาก: ข้อความต้องมีคำว่า "ลิมิต/โควตา" เพื่อให้ระบบสลับบัญชี Flow อัตโนมัติทำงาน) */
      var codeM = String(text || '').match(new RegExp('"wrb\\.fr","' + wantRpc + '"(?:,null){3},\\[(\\d+)'))
        || (errRow && Array.isArray(errRow[5]) ? [null, String(errRow[5][0])] : null);
      var code = codeM ? parseInt(codeM[1], 10) : null;
      var CODE_MSG = {
        3: 'คำสั่งไม่ถูกต้อง (พรอมต์อาจยาวเกิน/มีคำที่ Google ไม่รับ) — ระบบจะย่อพรอมต์แล้วลองใหม่',
        7: 'บัญชี Flow นี้ไม่มีสิทธิ์ใช้โมเดล/ฟีเจอร์นี้ — สลับบัญชีหรือเปลี่ยนโมเดล',
        8: 'บัญชี Flow นี้ชนลิมิต/โควตาของ Google แล้ว (เครดิตเหลือก็ชนได้ถ้าเจนถี่เกิน) — พักบัญชีนี้แล้วสลับบัญชีอื่น',
        13: 'ฝั่ง Google ขัดข้องชั่วคราว — รอสักครู่แล้วลองใหม่',
        14: 'บริการ Flow ไม่พร้อมชั่วคราว — รอสักครู่แล้วลองใหม่',
        16: 'เซสชัน Flow หมดอายุ — เปิดหน้า Flow แล้วล็อกอินใหม่',
      };
      if (code && CODE_MSG[code]) {
        var e2 = new Error('Flow ปฏิเสธคำสั่ง (' + wantRpc + ' · code ' + code + '): ' + CODE_MSG[code]);
        e2.body = String(text).slice(0, 1500); e2.code = code; throw e2;
      }
    }
    if (payloadStr == null) {
      /* 🔎 owner 2026-09-08: ลูกค้าแจ้ง "Flow API (eb1hJf) ไม่คืนผลลัพธ์" 4 ราย ติดกัน 2 วัน + โดนหักเครดิตทุกครั้ง
         ข้อความเดิมไม่บอกอะไรเลยเมื่อไม่มี errRow → แกะไม่ได้ว่า Google ตอบอะไรกลับมา
         → แนบเศษคำตอบจริงมาด้วย (ตัดสั้น) เพื่อให้รายงานรอบหน้าบอกรูปแบบที่ต้องรองรับ */
      var e = new Error('Flow API (' + wantRpc + ') ไม่คืนผลลัพธ์' + (errRow ? ': ' + JSON.stringify(errRow).slice(0, 300) : (text ? ' · Google ตอบ: ' + _errHint(text).slice(0, 160) : ' · คำตอบว่างเปล่า')));
      e.body = String(text).slice(0, 1500); throw e;
    }
    try { return JSON.parse(payloadStr); } catch (_) { return payloadStr; }
  }

  function uuid() { return (window.crypto && crypto.randomUUID) ? crypto.randomUUID().toUpperCase() : ('XXXXXXXX-XXXX-4XXX-YXXX-XXXXXXXXXXXX'.replace(/[XY]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'X' ? r : (r & 0x3 | 0x8)).toString(16); }).toUpperCase()); }
  function seedOf(s) { return (typeof s === 'number') ? s : Math.floor(Math.random() * 2000000000); }

  // 🩹 2026-09-06 (ลูกค้าเจอจริงบนแอปใหม่: "อัปโหลดรูป: grecaptcha.enterprise not ready"):
  //    แอปใหม่โหลด recaptcha แบบ lazy — ถ้ายิงงานทันทีหลังเปิดหน้า สคริปต์ยังมาไม่ถึง = เจนไม่ได้เลย
  //    → รอสั้นๆ ก่อน ถ้ายังไม่มาให้ "ฉีดสคริปต์ recaptcha enterprise เอง" (ตัวเดียว/คีย์เดียวกับที่หน้าเว็บใช้) แล้วรอต่อ
  var _rcInjected = false;
  function injectRecaptcha() {
    if (_rcInjected) return;
    _rcInjected = true;
    try {
      var sc = document.createElement('script');
      sc.src = 'https://www.google.com/recaptcha/enterprise.js?render=' + SITEKEY;
      sc.async = true; sc.defer = true;
      (document.head || document.documentElement).appendChild(sc);
    } catch (_) {}
  }
  function rcReady() { return !!(window.grecaptcha && window.grecaptcha.enterprise && window.grecaptcha.enterprise.execute); }
  async function recaptcha(action) {
    var dl = Date.now() + 8000;
    while (!rcReady() && Date.now() < dl) await sleep(250);
    if (!rcReady()) {
      injectRecaptcha();                                   // หน้าเว็บยังไม่โหลดให้ → โหลดเอง
      var dl2 = Date.now() + 25000;
      while (!rcReady() && Date.now() < dl2) await sleep(300);
    }
    if (!rcReady()) throw new Error('grecaptcha.enterprise not ready (โหลด recaptcha ไม่สำเร็จ — ลองรีเฟรชหน้า Flow 1 ครั้ง)');
    // grecaptcha.enterprise.ready() ทำให้ชัวร์ว่า execute ใช้ได้จริง (บางจังหวะ object มาแล้วแต่ยังไม่พร้อม)
    try { await new Promise(function (res) { var t = setTimeout(res, 4000); window.grecaptcha.enterprise.ready(function () { clearTimeout(t); res(); }); }); } catch (_) {}
    return window.grecaptcha.enterprise.execute(SITEKEY, { action: action });
  }
  function ctxOf(pid, token) { return [null, TOOL_ENUM, null, null, null, pid, null, null, null, null, [token, 1]]; }
  function pageProjectId() {
    try { var m = location.pathname.match(/\/project\/([0-9a-f-]{36})/i); if (m) return m[1]; } catch (_) {}
    return null;
  }
  function unesc(u) { return String(u || '').replace(/\\u003d/g, '=').replace(/\\u0026/g, '&'); }
  function blobToBase64(blob) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () { var s = String(fr.result); var c = s.indexOf(','); resolve(c >= 0 ? s.slice(c + 1) : s); };
      fr.onerror = reject; fr.readAsDataURL(blob);
    });
  }

  // ---------- map ค่าจาก flow-content (ชื่อ enum แบบแอปเก่า) → enum ตัวเลขแอปใหม่ ----------
  var IMG_ASPECT = { IMAGE_ASPECT_RATIO_SQUARE: 1, IMAGE_ASPECT_RATIO_PORTRAIT: 2, IMAGE_ASPECT_RATIO_LANDSCAPE: 3 };
  function imgAspect(a) { if (typeof a === 'number') return a; return IMG_ASPECT[a] || 2; }
  // ⚠️ enum สัดส่วน "วิดีโอ" คนละชุดกับภาพ: 1=9:16 แนวตั้ง · 2=16:9 แนวนอน (จับจาก UI จริง: เลือก 9:16 ส่ง 1 · เลือก 16:9 ส่ง 2)
  var VID_ASPECT = { VIDEO_ASPECT_RATIO_PORTRAIT: 1, VIDEO_ASPECT_RATIO_LANDSCAPE: 2 };
  function vidAspect(a) { if (typeof a === 'number') return a; return VID_ASPECT[a] || 1; }

  // ---------- แกะ media record ----------
  //   ภาพ (ogiZ0b): [[ [mediaId,null,sessionId,null,null,null,[[null,seed,...,status,prompt,29,null,null,sessionId,null,URL,aspect,...]],null,[w,h] ] ], [[session...]]]
  //   วิดีโอ/media (jwpduf · as29s · eb1hJf): [opId, projectId, mediaId, "CAE", null, [ [ts], prompt, ..., [null,[[model,aspect,..],[[null,1,refMediaId]]],...], null, [status], 1, imageUrl?, [], null, size ], null, [[...,videoUrl?,...],[null,null,[sec]],[opId]]]
  function findUrls(obj, kind) {
    var out = [];
    try {
      // payload ผ่าน JSON.parse มาแล้ว = URL เป็นตัวจริง (= และ & ไม่ escape) · stringify อีกรอบไม่ escape / เพิ่ม
      var re = new RegExp('"(https://flow-content\\.google/' + kind + '/[^"]+)"', 'g');
      var str = JSON.stringify(obj), m;
      while ((m = re.exec(str))) out.push(unesc(m[1]));
    } catch (_) {}
    return out;
  }
  function uuidsIn(v) { var s = JSON.stringify(v); return (s.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g) || []); }
  // สถานะจาก record วิดีโอ → ชื่อแบบแอปเก่า (flow-content เทียบ string เดิม)
  //   rec[5] = [ [ts], prompt, null,null,null,null, {model/ref}, null, [status], 1, imageUrl?, [], null, size? ]  → status ที่ index 8
  function statusOf(rec) {
    try {
      var d = rec && rec[5];
      var st = d && d[8];
      if (Array.isArray(st)) {
        var code = st[0];
        if (code === 3) return 'MEDIA_GENERATION_STATUS_SUCCESSFUL';
        if (code === 4) { var msg = ''; try { msg = JSON.stringify(st[1]).slice(0, 200); } catch (_) {} return 'MEDIA_GENERATION_STATUS_FAILED' + (msg ? ' ' + msg : ''); }
        if (code === 2) return 'MEDIA_GENERATION_STATUS_ACTIVE';
        if (code === 6 || code === 1) return 'MEDIA_GENERATION_STATUS_PENDING';
        return 'MEDIA_GENERATION_STATUS_' + code;
      }
    } catch (_) {}
    return 'MEDIA_GENERATION_STATUS_UNKNOWN';
  }
  function videoRecords(payload) {
    // jwpduf: [null, credits, [rec, rec...]] · eb1hJf: [null, credits, [[mediaId..]], [rec...]] · as29s: rec เดี่ยว
    if (!Array.isArray(payload)) return [];
    if (typeof payload[0] === 'string' && payload[3] === 'CAE') return [payload];
    var list = Array.isArray(payload[3]) ? payload[3] : (Array.isArray(payload[2]) ? payload[2] : []);
    return list.filter(function (r) { return Array.isArray(r) && typeof r[0] === 'string'; });
  }
  // 🧠 ความจำ op → media (ต่อฉากต้องอ้าง "mediaId" (rec[2]) ไม่ใช่ opId · scene ต้องอ้าง clone ของมัน)
  var _opMedia = {};   // opId → mediaId (rec[2])
  var _durOf = {};     // mediaId/opId → วินาที
  var _modelOf = {};   // mediaId/opId → model key
  var _sceneClone = {}; // sceneId → mediaId ของ clone ที่ scene สร้างตอน createScene (ใช้เป็นต้นทาง extend แรก)
  var _aspectOf = {};  // opId/mediaId → aspect วิดีโอที่สั่งเจน (1/2) — ใช้ตอน createScene (flow-content ไม่ส่ง aspect มา)
  function recordToMedia(rec) {
    var st = statusOf(rec);
    var vid = findUrls(rec, 'video')[0] || null;
    var img = findUrls(rec, 'image')[0] || null;
    try {
      if (rec[2]) _opMedia[rec[0]] = rec[2];
      var sec = rec[7] && rec[7][1] && rec[7][1][2] && rec[7][1][2][0];
      if (typeof sec === 'number') { _durOf[rec[0]] = sec; if (rec[2]) _durOf[rec[2]] = sec; }
      var mk = rec[7] && rec[7][0] && rec[7][0][12];
      if (typeof mk === 'string') { _modelOf[rec[0]] = mk; if (rec[2]) _modelOf[rec[2]] = mk; }
    } catch (_) {}
    return {
      name: rec[0], projectId: rec[1], mediaId: rec[2], workflowId: rec[2],
      mediaMetadata: { mediaStatus: { mediaGenerationStatus: st } },
      video: vid ? { fifeUrl: vid, url: vid } : undefined,
      image: img ? { fifeUrl: img } : undefined,
      status: st, videoUrl: vid, imageUrl: img,
    };
  }

  // ---------- OPS (interface = ชื่อ/รูปผลลัพธ์เดียวกับ flow-api.js เพื่อให้ flow-content.js ใช้ได้โดยไม่ต้องแยกโค้ด) ----------
  var _credits = null;
  var API = {
    isNewApp: isNewApp,
    isReady: function () { return true; },     // auth = cookie ไม่ต้องดัก
    getAuth: function () { return 'cookie'; },
    authDiag: function () { return { ready: true, newApp: true, at: !!getAt(), summary: 'new-app (batchexecute · cookie auth)' }; },

    // เครดิต (nzlxg) → [credits,2,3,3,null,credits]
    getCredits: async function () {
      var p = await callRpc('nzlxg', []);
      var credits = Array.isArray(p) ? p[0] : null;
      _credits = credits;
      return { credits: credits, userPaygateTier: 'NEW_APP', raw: p };
    },

    // สร้างโปรเจ็ค (jHPbke): ["projects/*",[null,["<ชื่อ>"]],[null,22]] → ["<projectId>",["<ชื่อ>"]]
    createProject: async function (title) {
      var name = (typeof title === 'string' && title) ? title : ('PD ' + new Date().toISOString().slice(5, 16).replace('T', ' '));
      var p = await callRpc('jHPbke', ['projects/*', [null, [name]], [null, TOOL_ENUM]]);
      var pid = Array.isArray(p) ? p[0] : null;
      if (!pid || !/^[0-9a-f-]{36}$/i.test(pid)) throw new Error('createProject: ไม่ได้ projectId (' + JSON.stringify(p).slice(0, 200) + ')');
      return { projectId: pid, agentSessionId: null, raw: p };
    },

    // อัปโหลดรูป (maseQ): [ctx, base64, mime, 1, null×4, fileName, null, uuid, uuid] → [[mediaId, projectId, sceneId, "CAE", ...], [...]]
    uploadImage: async function (o) {
      o = o || {};
      var pid = o.projectId || pageProjectId();
      if (!pid) throw new Error('uploadImage: projectId required');
      var b64 = o.imageBytes || (o.fileBlob ? await blobToBase64(o.fileBlob) : null);
      if (!b64) throw new Error('uploadImage: no image');
      var mime = o.mimeType || (o.fileBlob && o.fileBlob.type) || 'image/png';
      var token = await recaptcha('IMAGE_UPLOAD');
      var arg = [ctxOf(pid, token), b64, mime, 1, null, null, null, null, o.fileName || ('upload-' + Date.now() + '.png'), null, uuid(), uuid()];
      var p = await callRpc('maseQ', arg, { retries: 1 });
      var rec = Array.isArray(p) && Array.isArray(p[0]) ? p[0] : null;
      var mediaId = rec && rec[0];
      if (!mediaId) throw new Error('uploadImage: ไม่ได้ mediaId (' + JSON.stringify(p).slice(0, 200) + ')');
      return { name: mediaId, projectId: rec[1] || pid, workflowId: rec[2] || null, workflowStepId: null, mediaMetadata: {}, raw: p };
    },

    // เจนภาพ (ogiZ0b) — sync คืน URL เลย · แนบ ref ได้ (refUUIDs = mediaId ที่อัปโหลด/เจนในโปรเจ็ค)
    //   record: [null, null, refs|null, seed, aspect, model, null, ctx, [[["prompt"]]], null, null, null, uuid, uuid]
    //   refs: [[mediaId, null, null, null, 1]] (1 = reference)
    generateImage: async function (o) {
      o = o || {};
      var pid = o.projectId || pageProjectId();
      if (!pid) throw new Error('generateImage: projectId required');
      var r = await _genImages(pid, [{ prompt: o.prompt || '', refUUIDs: o.refUUIDs, seed: o.seed }], o.imageModelName, o.aspectRatio);
      var m = r[0];
      if (!m) throw new Error('generateImage: ไม่ได้ภาพ');
      if (m.error) throw m.error;
      return { media: [m], workflows: [], remainingCredits: _credits };
    },
    // หลายใบ (การ์ตูน): ยิงขนานทีละชุด · media[] เรียงตาม items (ใบเฟล = null → flow-content นับเป็นเฟลรายใบ)
    batchGenerateImages: async function (o) {
      o = o || {};
      var pid = o.projectId || pageProjectId();
      if (!pid) throw new Error('batchGenerateImages: projectId required');
      var items = (o.items || []).map(function (it) { return { prompt: String(it.prompt || ''), refUUIDs: it.refUUIDs || o.refUUIDs }; });
      var r = await _genImages(pid, items, o.imageModelName, o.aspectRatio);
      var firstErr = null;
      var media = r.map(function (m) { if (m && m.error) { firstErr = firstErr || m.error; return null; } return m; });
      if (media.length && media.every(function (m) { return !m; }) && firstErr) throw firstErr; // เฟลหมด = โยน (ให้ retry ชั้นบน)
      return { media: media, workflows: [], remainingCredits: _credits };
    },

    // ทำวิดีโอจากภาพ (eb1hJf) — async · คืน media[0].name = operationId (ใช้ poll + ดึง URL)
    //   arg: [[[ [null,null,[[["prompt"]]]], model, 1, null, [null, imageMediaId], [null,null,null,null, uuid, uuid] ]], ctx, [uuid, 2]]
    //   ช่อง aspect: 1=แนวตั้ง · 2=แนวนอน (vidAspect) — ภาพเจนตามสัดส่วนที่เลือกไว้แล้ว ส่งให้ตรงกัน
    animateImage: async function (o) {
      o = o || {};
      var pid = o.projectId || pageProjectId();
      if (!pid) throw new Error('animateImage: projectId required');
      if (!o.imageMediaId) throw new Error('animateImage: imageMediaId required');
      var model = o.videoModelKey || 'veo_3_1_i2v_lite_low_priority';
      var token = await recaptcha('VIDEO_GENERATION');
      var arg = [[[[null, null, [[[String(o.prompt || '')]]]], model, vidAspect(o.aspectRatio), null, [null, o.imageMediaId], [null, null, null, null, uuid(), uuid()]]], ctxOf(pid, token), [uuid(), 2]];
      var p = await callRpc('eb1hJf', arg, { retries: 0 });
      if (Array.isArray(p) && typeof p[1] === 'number') _credits = p[1];
      var recs = videoRecords(p).map(recordToMedia);
      if (!recs.length) throw new Error('animateImage: ไม่คืน media (' + JSON.stringify(p).slice(0, 200) + ')');
      recs.forEach(function (m) { _aspectOf[m.name] = vidAspect(o.aspectRatio); if (m.mediaId) _aspectOf[m.mediaId] = vidAspect(o.aspectRatio); _modelOf[m.name] = model; if (m.mediaId) _modelOf[m.mediaId] = model; });
      return { media: recs, workflows: [], remainingCredits: _credits };
    },

    // poll (jwpduf): [null,null,[[opId]]] → [null, credits?, [rec...]]
    pollVideoStatus: async function (o) {
      o = o || {};
      var id = o.mediaId || o.operationId;
      if (!id) throw new Error('pollVideoStatus: mediaId required');
      var p = await callRpc('jwpduf', [null, null, [[id]]]);
      if (Array.isArray(p) && typeof p[1] === 'number') _credits = p[1];
      var recs = videoRecords(p).map(recordToMedia);
      if (!recs.length) throw new Error('pollVideoStatus: ไม่พบ media ' + id);
      return { media: recs, remainingCredits: _credits };
    },
    waitForVideo: async function (o) {
      o = o || {};
      var start = Date.now(), interval = o.intervalMs || 4000, timeout = o.timeoutMs || 10 * 60 * 1000;
      for (;;) {
        var j = await API.pollVideoStatus({ mediaId: o.mediaId });
        var m = j.media[0];
        var status = m.mediaMetadata.mediaStatus.mediaGenerationStatus;
        if (o.onProgress) try { o.onProgress(status, m); } catch (_) {}
        if (/SUCCESSFUL/.test(status)) return m;
        if (/FAIL|ERROR|CANCEL/i.test(status)) { var err = new Error('Video gen failed: ' + status); err.status = status; err.media = m; throw err; }
        if (Date.now() - start > timeout) throw new Error('waitForVideo timeout (' + timeout + 'ms)');
        await sleep(interval);
      }
    },

    // ดึง media รายตัว (as29s): [id] → record (มี URL ภาพ + URL วิดีโอ signed CDN เมื่อเสร็จ)
    getMedia: async function (id) {
      var p = await callRpc('as29s', [id]);
      var recs = videoRecords(p).map(recordToMedia);
      if (!recs.length) throw new Error('getMedia: ไม่พบ ' + id);
      return recs[0];
    },
    // URL ไฟล์จริง (แอปเก่าคืน redirect endpoint · แอปใหม่ต้องถาม as29s แล้วคืน signed URL — flow-content await อยู่แล้ว)
    getMediaUrlRedirect: async function (id) {
      var m = await API.getMedia(id);
      var u = m.videoUrl || m.imageUrl;
      if (!u) throw new Error('ไม่พบ URL ไฟล์ของ ' + id + ' (สถานะ ' + m.status + ')');
      return u;
    },

    // 🥕 Ingredients / r2v (MZZa6b) — ภาพสำเร็จรูปหลายใบเป็น "ส่วนผสม" → วิดีโอ (จับจาก UI ใหม่ 2026-09-03)
    //   arg: [[[ [null,null,[[["prompt"]]]], [[null,mediaId],...], model, aspect, null, [null,null,null,null,uuid,uuid] ]], ctx, [uuid, 2]]
    //   aspect: 2=9:16 · 3=16:9 (UI ส่ง 1=auto → ได้แนวนอน — เราส่งชัดตามที่บอทเลือก)
    //   prompt: 🔗 2026-09-07 — เลิกตัด @ref-N แล้ว
    //     กลไกจริงของ @ref-N (สูตร storymix บน gateway) = "ข้อความธรรมดาที่ตรงกับชื่อไฟล์ ref-N.png ที่อัปเข้าโปรเจ็ค"
    //     ไม่ใช่ API พิเศษของแอปเก่า → แอปใหม่ก็อัปชื่อ ref-N.png เหมือนกัน ส่งไปตรงๆ ได้เลย
    //     (ตอนพอร์ตแอปใหม่ v1.6.0 ตัดทิ้งเพราะเข้าใจว่าเป็น reference part ของ API — เข้าใจผิด)
    //     ใช้เฉพาะ Story mix โหมดหนัง (ล็อกหน้าตัวละครหลายคน) · บอทอื่นไม่มี @ref ในพรอมต์อยู่แล้ว
    generateWithIngredients: async function (o) {
      o = o || {};
      var pid = o.projectId || pageProjectId();
      if (!pid) throw new Error('generateWithIngredients: projectId required');
      var ids = (Array.isArray(o.imageMediaIds) ? o.imageMediaIds : [o.imageMediaIds]).filter(Boolean);
      if (!ids.length) throw new Error('generateWithIngredients: imageMediaIds required');
      var model = o.videoModelKey || 'abra_r2v_10s';
      var prompt = String(o.prompt || '').replace(/\s{2,}/g, ' ').trim();
      // 🔗 2026-09-07 (แกะ payload จริงจาก network ที่ owner ส่งมา): พรอมต์ของแอปใหม่ = "ลิสต์ชิ้นส่วน" ไม่ใช่ข้อความก้อนเดียว
      //    ชิ้นข้อความ = ["ข้อความ"] · ชิ้นอ้างรูป (ชิปเทาๆ) = [null,[["<mediaId>","<ชื่อไฟล์>"]]]
      //    → แปลง @ref-N ในพรอมต์เป็นชิปจริงที่ผูกกับรูปใบนั้น (เท่ากับคนกด @ เลือกไฟล์เอง)
      //    ไม่มี @ref = ชิ้นข้อความเดียวเหมือนเดิมเป๊ะ
      var names = Array.isArray(o.refNames) ? o.refNames : [];
      var nameOf = function (i) { return String(names[i] || ('ref-' + i + '.png')); };
      var parts = (function () {
        var out = [], re = /@ref-(\d+)/g, last = 0, m;
        while ((m = re.exec(prompt))) {
          var k = +m[1];
          if (!(k >= 0 && k < ids.length)) continue;       // ไม่มีรูปใบนั้น = ปล่อยเป็นข้อความไป
          var before = prompt.slice(last, m.index);
          if (before) out.push([before]);
          out.push([null, [[ids[k], nameOf(k)]]]);          // ← ชิปอ้างรูป
          out.push([' ']);
          last = m.index + m[0].length;
        }
        var tail = prompt.slice(last);
        if (tail) out.push([tail]);
        return out.length ? out : [[prompt]];
      })();
      var token = await recaptcha('VIDEO_GENERATION');
      var arg = [[[[null, null, [parts]], ids.map(function (id) { return [null, id]; }), model, vidAspect(o.aspectRatio), null, [null, null, null, null, uuid(), uuid()]]], ctxOf(pid, token), [uuid(), 2]];
      var p = await callRpc('MZZa6b', arg, { retries: 0 });
      if (Array.isArray(p) && typeof p[1] === 'number') _credits = p[1];
      var recs = videoRecords(p).map(recordToMedia);
      if (!recs.length) throw new Error('generateWithIngredients: ไม่คืน media (' + JSON.stringify(p).slice(0, 200) + ')');
      recs.forEach(function (m) { _aspectOf[m.name] = vidAspect(o.aspectRatio); if (m.mediaId) _aspectOf[m.mediaId] = vidAspect(o.aspectRatio); _modelOf[m.name] = model; if (m.mediaId) _modelOf[m.mediaId] = model; });
      return { media: recs, workflows: [], remainingCredits: _credits };
    },

    // ---------- 🎞️ ต่อฉาก (SceneBuilder) — จับจาก UI ใหม่ 2026-09-03 ----------
    // createScene (rqZuUc): ["projects/<pid>", ["<mediaId ของคลิปฉาก 1 = rec[2]>"], null, null, <vidAspect>]
    //   → [[sceneId, title, null, ts, ts, aspect, null, []], [[[sceneWorkflowId, null, null, [title, ts, null, null, <cloneMediaId>, <id2>], pid], sceneId, [...]]]]
    //   ⚠️ scene สร้าง "clone" ของคลิป → extend แรกต้องอ้าง clone ไม่ใช่คลิปเดิม (UI ทำแบบนี้)
    createScene: async function (o) {
      o = o || {};
      var pid = o.projectId || pageProjectId();
      var ids = (o.workflowIds || []).filter(Boolean);
      if (!pid || !ids.length) throw new Error('createScene: projectId + workflowIds required');
      // workflowIds ที่ flow-content ส่ง = media[0].workflowId = rec[2] (mediaId) อยู่แล้ว · เผื่อส่ง opId มาก็แปลงให้
      ids = ids.map(function (id) { return _opMedia[id] || id; });
      var asp = (typeof o.aspectRatio === 'number') ? o.aspectRatio : (o.aspectRatio ? vidAspect(o.aspectRatio) : (_aspectOf[ids[0]] || _aspectOf[o.workflowIds[0]] || 1));
      var p = await callRpc('rqZuUc', ['projects/' + pid, ids, null, null, asp], { retries: 1 });
      var sceneId = p && p[0] && p[0][0];
      if (!sceneId) throw new Error('createScene: ไม่ได้ sceneId (' + JSON.stringify(p).slice(0, 200) + ')');
      var sws = [];
      try {
        (p[1] || []).forEach(function (row) {
          var wf = row[0]; var clone = wf && wf[3] && wf[3][4];
          sws.push({ sceneId: sceneId, workflow: { name: wf && wf[0] }, cloneMediaId: clone || null });
        });
      } catch (_) {}
      if (sws[0] && sws[0].cloneMediaId) { _sceneClone[sceneId] = sws[0].cloneMediaId; _durOf[sws[0].cloneMediaId] = _durOf[ids[0]] || 8; _modelOf[sws[0].cloneMediaId] = _modelOf[ids[0]] || ''; }
      return { scene: { sceneId: sceneId, displayName: p[0][1] || '' }, sceneWorkflows: sws, raw: p };
    },
    // extendVideo (fZytfe): [[[ [null, <srcMediaId>, <startFrame>, <endFrame>], [null,null,[[["prompt"]]]], "<extension model>", <vidAspect>, null, [sceneId,null,null,null,uuid,uuid] ]], ctx, [uuid, 2, null, [sceneId, position]]]
    //   src: ต่อแรก = clone ของ scene · ต่อถัดไป = mediaId (rec[2]) ของคลิปต่อฉากก่อนหน้า (flow-content ส่ง opId มา → แปลงผ่าน _opMedia)
    //   frame: คลิป 8 วิ @24fps = 192 → UI ส่ง 169,192 (23 เฟรมท้ายเป็นบริบท) · คำนวณจากความยาวจริง
    //   model: extension มีคีย์ของตัวเอง — ฟรี = veo_3_1_extension_lite_low_priority (ทดสอบผ่าน 0 เครดิต) · จ่าย = veo_3_1_extension_lite (UI ใช้)
    //   ⚠️ คลิป Omni (abra_*) ต่อฉากไม่ได้ (UI เทา) → โยน unsupported ทันที ให้ flow-content ถอยเป็นคลิปฉาก 1
    extendVideo: async function (o) {
      o = o || {};
      var pid = o.projectId || pageProjectId();
      if (!pid || !o.sceneId) throw new Error('extendVideo: projectId + sceneId required');
      var pos = (typeof o.position === 'number') ? o.position : 1;
      var srcIn = o.sourceVideoMediaId;
      // 🔗 กฎ chain (พิสูจน์จาก Zzl0ze sceneWorkflows 2026-09-03): ต่อแรก = clone ของ scene · ต่อถัดไป = "opId" (rec[0]) ของคลิปต่อฉากก่อนหน้า (= ค่าที่ flow-content ส่งมาเป็น clipIds[last] อยู่แล้ว)
      //    ⚠️ ห้ามแปลงเป็น rec[2] (mediaId) — เคยลอง = server รับแล้วเจนเฟล NOT_FOUND
      var src = (pos <= 1 && _sceneClone[o.sceneId]) ? _sceneClone[o.sceneId] : srcIn;
      if (!src) throw new Error('extendVideo: sourceVideoMediaId required');
      var srcModel = _modelOf[src] || _modelOf[srcIn] || '';
      if (/^abra_/.test(srcModel)) throw _unsupported('ต่อฉากจากคลิป Omni Flash (Flow ใหม่ต่อได้เฉพาะคลิป Veo)');
      var sec = _durOf[src] || _durOf[srcIn] || 8;
      var endF = Math.round(sec * 24), startF = Math.max(0, endF - 23);
      var model = /low_priority/.test(String(o.videoModelKey || '')) || !o.videoModelKey ? 'veo_3_1_extension_lite_low_priority' : 'veo_3_1_extension_lite';
      var token = await recaptcha('VIDEO_GENERATION');
      var arg = [[[[null, src, startF, endF], [null, null, [[[String(o.prompt || '')]]]], model, vidAspect(o.aspectRatio), null, [o.sceneId, null, null, null, uuid(), uuid()]]], ctxOf(pid, token), [uuid(), 2, null, [o.sceneId, pos]]];
      var p = await callRpc('fZytfe', arg, { retries: 0 });
      if (Array.isArray(p) && typeof p[1] === 'number') _credits = p[1];
      var recs = videoRecords(p).map(recordToMedia);
      if (!recs.length) throw new Error('extendVideo: ไม่คืน media (' + JSON.stringify(p).slice(0, 200) + ')');
      recs.forEach(function (m) { _durOf[m.name] = _durOf[m.name] || 8; if (m.mediaId) _durOf[m.mediaId] = _durOf[m.mediaId] || 8; });
      return { media: recs, workflows: [], remainingCredits: _credits };
    },
    updateSceneWorkflowsOffsets: async function () { return { ok: true, skipped: true }; }, // แอปใหม่ไม่ต้องตัดหัวคลิปต่อฉาก (แอปเก่าก็ส่ง 0 อยู่แล้ว)
    // รวมคลิป: แอปใหม่ไม่มี concat API ให้ยิงตรง → คืน URL ไฟล์รายคลิป (ตามลำดับ inputVideos) ให้ background โหลด → main.js ต่อด้วย ffmpeg (ท่าเดียวกับ Merge)
    concatAndWait: async function (o) {
      o = o || {};
      var ids = (o.inputVideos || []).map(function (v) { return v && (v.mediaGenerationId || v.mediaId || v.name); }).filter(Boolean);
      if (!ids.length) throw new Error('concatAndWait: inputVideos required');
      var urls = [];
      for (var i = 0; i < ids.length; i++) {
        var m = await API.getMedia(ids[i]);
        if (!m.videoUrl) throw new Error('รวมคลิป: คลิป ' + (i + 1) + ' ยังไม่มีไฟล์ (สถานะ ' + m.status + ')');
        urls.push(m.videoUrl);
      }
      return { status: 'MEDIA_GENERATION_STATUS_SUCCESSFUL', videoUrls: urls, inputsCount: urls.length };
    },
    concatenate: async function () { throw _unsupported('รวมคลิป (concat ตรง — ใช้ concatAndWait)'); },
    checkConcatenationStatus: async function () { throw _unsupported('รวมคลิป (concat ตรง — ใช้ concatAndWait)'); },
    // ---------- ยังไม่รองรับบนแอปใหม่ (flow-content จับ error แล้ว fallback / ข้าม) ----------
    // 🔼 อัปสเกล 1080p (p0UkFb — จับจากเมนูการ์ด Download ▸ 1080p 2026-09-03) · เฉพาะคลิปเดี่ยว (ต่อฉาก concat ในแอปแล้วอัปไม่ได้ — owner)
    //   rec: [[null,"<opId>"], null, <aspect>, null, [null,"<mediaId rec[2]>",null,null,uuid], null, 2, null×24, "veo_3_1_upsampler_1080p"] · arg: [[rec], ctx, [uuid]]
    //   resp: [[["<opId>_upsampled"],"",null,null,1]], credits, [...], [[rec "<opId>_upsampled" ...]]] → poll jwpduf ด้วย "<opId>_upsampled" (ท่าเดียวกับแอปเก่า) → as29s ได้ URL
    upsampleVideo: async function (o) {
      o = o || {};
      var pid = o.projectId || pageProjectId();
      var op = o.videoMediaId;
      if (!pid || !op) throw new Error('upsampleVideo: projectId + videoMediaId required');
      var mediaId = _opMedia[op];
      if (!mediaId) { try { var mm = await API.getMedia(op); mediaId = mm.mediaId; } catch (_) {} }
      if (!mediaId) throw new Error('upsampleVideo: หา mediaId ของ ' + op + ' ไม่เจอ');
      var res = o.resolution === 'VIDEO_RESOLUTION_4K' ? 'veo_3_1_upsampler_4k' : 'veo_3_1_upsampler_1080p';
      var asp = _aspectOf[op] || _aspectOf[mediaId] || vidAspect(o.aspectRatio);
      var token = await recaptcha('VIDEO_GENERATION');
      var rec = [[null, op], null, asp, null, [null, mediaId, null, null, uuid()], null, 2];
      while (rec.length < 31) rec.push(null);
      rec.push(res);
      var p = await callRpc('p0UkFb', [[rec], ctxOf(pid, token), [uuid()]], { retries: 0 });
      if (Array.isArray(p) && typeof p[1] === 'number') _credits = p[1];
      var upId = null; try { upId = p[0][0][0][0]; } catch (_) {}
      var recs = videoRecords(p).map(recordToMedia);
      if (!upId && recs[0]) upId = recs[0].name;
      if (!upId) throw new Error('upsampleVideo: ไม่คืน id (' + JSON.stringify(p).slice(0, 200) + ')');
      return { media: [{ name: upId, workflowId: mediaId }], workflows: [], remainingCredits: _credits };
    },
    upsampleImage: async function () { throw _unsupported('อัปสเกลภาพ'); },
    // ลบโปรเจ็ค (QI2zvc): ["projects/<id>"] → [] (จับจาก UI ใหม่ 2026-09-03)
    deleteProject: async function (projectId) {
      if (!projectId) throw new Error('deleteProject: projectId required');
      var p = await callRpc('QI2zvc', ['projects/' + projectId], { retries: 1 });
      return { ok: true, raw: p };
    },
    setAgentToggle: async function () { return { ok: true, skipped: true, reason: 'new-app' }; }, // แอปใหม่ Agent ไม่แย่งช่องพรอมต์ของ API-direct
    encodedVideoToBlob: function (base64) {
      var bin = atob(base64); var buf = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      return new Blob([buf], { type: 'video/mp4' });
    },
    _callRpc: callRpc,
  };
  function _unsupported(what) { var e = new Error('แอป Flow ใหม่ (flow.google.com): ' + what + ' ยังไม่รองรับในเวอร์ชันนี้'); e.unsupported = true; return e; }

  // เจนภาพหลายใบขนาน (ทีละใบ = 1 rpc · sync) — คืน array เรียงตาม items · ใบเฟล = {error}
  async function _genImages(pid, items, modelName, aspect) {
    var model = modelName || 'GEM_PIX_2';
    var asp = imgAspect(aspect);
    var results = await Promise.all(items.map(async function (it, idx) {
      try {
        if (idx) await sleep(300 * idx); // เว้นจังหวะเล็กน้อย
        var token = await recaptcha('IMAGE_GENERATION');
        var ctx = ctxOf(pid, token);
        var refs = (it.refUUIDs || []).filter(Boolean).map(function (id) { return [id, null, null, null, 1]; });
        var rec = [null, null, refs.length ? refs : null, seedOf(it.seed), asp, model, null, ctx, [[[String(it.prompt || '')]]], null, null, null, uuid(), uuid()];
        var arg = [null, [rec], 1, ctx, [uuid()]];
        var p = await callRpc('ogiZ0b', arg, { retries: 0 });
        return _imageFromPayload(p);
      } catch (e) { return { error: e }; }
    }));
    return results;
  }
  function _imageFromPayload(p) {
    // [[ [mediaId, null, sessionId, ..., [[...,URL,...]], null, [w,h]] ], [[session]]]
    var rec = null;
    try { rec = p[0][0]; } catch (_) {}
    if (!rec || typeof rec[0] !== 'string') throw new Error('generateImage: โครงผลลัพธ์ไม่รู้จัก (' + JSON.stringify(p).slice(0, 200) + ')');
    var url = findUrls(rec, 'image')[0] || null;
    var dims = null; try { var d = rec[rec.length - 1]; if (Array.isArray(d) && d.length === 2 && typeof d[0] === 'number') dims = d; } catch (_) {}
    var seed = null; try { seed = rec[6][0][1]; } catch (_) {}
    if (!url) throw new Error('generateImage: ไม่พบ URL ภาพในผลลัพธ์ (' + JSON.stringify(rec).slice(0, 200) + ')');
    return { name: rec[0], workflowId: rec[2] || null, image: { generatedImage: { fifeUrl: url, seed: seed, width: dims && dims[0], height: dims && dims[1] } }, mediaMetadata: { mediaStatus: { mediaGenerationStatus: 'MEDIA_GENERATION_STATUS_SUCCESSFUL' } } };
  }

  window.__pdNewFlow = {
    get active() { return isNewApp(); },
    api: API,
    call: function (fn, args) {
      if (typeof API[fn] !== 'function') throw new Error('Unknown fn (new-app): ' + fn);
      return API[fn].apply(API, args || []);
    },
  };
  try { console.log(TAG + ' loaded · active=' + isNewApp() + ' · ' + location.pathname); } catch (_) {}
})();
