// =====================================================================
// PD Auto Footage — TTS module (Gemini TTS — เสียงพากย์โฆษณา)
// 2 ทาง: pdvip_ → ยิงผ่าน PD Gateway (/v1/audio/speech) · AIza → Gemini ตรง
// Gemini ตอบ PCM 24kHz → ห่อ WAV header ให้เล่น/ใช้ต่อได้
// =====================================================================
(function () {
  'use strict';

  const TTS_MODEL = 'gemini-2.5-flash-preview-tts';
  const GATEWAY_TTS_URL = 'https://pd-auto-ai-gateway.filmbancha127.workers.dev/v1/audio/speech';
  // map id เสียงในแผง → ชื่อเสียงจริงของ Gemini
  const VOICE_MAP = { charon: 'Charon', kore: 'Kore', aoede: 'Aoede', puck: 'Puck' };

  function pcmToWavBlob(pcmBase64, sampleRate) {
    const bin = atob(pcmBase64);
    const pcm = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) pcm[i] = bin.charCodeAt(i);

    const header = new ArrayBuffer(44);
    const v = new DataView(header);
    const writeStr = (off, s) => { for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i)); };
    writeStr(0, 'RIFF');
    v.setUint32(4, 36 + pcm.length, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    v.setUint32(16, 16, true);
    v.setUint16(20, 1, true);          // PCM
    v.setUint16(22, 1, true);          // mono
    v.setUint32(24, sampleRate, true);
    v.setUint32(28, sampleRate * 2, true);
    v.setUint16(32, 2, true);
    v.setUint16(34, 16, true);         // 16-bit
    writeStr(36, 'data');
    v.setUint32(40, pcm.length, true);
    return new Blob([header, pcm], { type: 'audio/wav' });
  }

  /**
   * สร้างเสียงพากย์ → { blob (audio/wav), durationSec }
   */
  // ยิง Gemini TTS ตรง (คีย์ AIza) → { data(base64 PCM), mimeType }
  async function ttsViaGemini(text, voiceName, apiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: text }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } } },
        },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error('TTS HTTP ' + res.status + (body.includes('API_KEY') ? ' — เช็คคีย์ Gemini' : ''));
    }
    const data = await res.json();
    const part = data.candidates && data.candidates[0] && data.candidates[0].content.parts[0];
    const inline = part && part.inlineData;
    if (!inline || !inline.data) throw new Error('TTS ไม่ส่งเสียงกลับมา — ลองใหม่');
    return { data: inline.data, mimeType: inline.mimeType };
  }

  // ยิงผ่าน PD Gateway (คีย์ pdvip_) → { data(base64 PCM), mimeType }
  async function ttsViaGateway(text, voiceId, apiKey) {
    const res = await fetch(GATEWAY_TTS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
      body: JSON.stringify({ input: text, voice: voiceId, model: TTS_MODEL }),
    });
    if (!res.ok) {
      let msg = 'PD Gateway TTS HTTP ' + res.status;
      try { const e = await res.json(); if (e && e.error && e.error.message) msg += ' — ' + e.error.message; } catch (_) {}
      if (res.status === 402) msg = 'เครดิต PD Gateway ไม่พอสำหรับเสียงพากย์';
      throw new Error(msg);
    }
    const data = await res.json();
    if (!data.audioBase64) throw new Error('TTS ไม่ส่งเสียงกลับมา — ลองใหม่');
    return { data: data.audioBase64, mimeType: data.mimeType };
  }

  /**
   * สร้างเสียงพากย์ → { blob (audio/wav), durationSec }
   */
  async function synthesize(text, voiceId, apiKey) {
    if (!apiKey) throw new Error('ยังไม่ได้ใส่ API Key');
    const voiceName = VOICE_MAP[voiceId] || 'Charon';
    // pdvip → Gateway · AIza → Gemini ตรง
    const inline = apiKey.startsWith('pdvip_')
      ? await ttsViaGateway(text, voiceId, apiKey)
      : await ttsViaGemini(text, voiceName, apiKey);

    // mimeType เช่น "audio/L16;codec=pcm;rate=24000" → ดึง sample rate
    const rateMatch = /rate=(\d+)/.exec(inline.mimeType || '');
    const sampleRate = rateMatch ? parseInt(rateMatch[1]) : 24000;
    const blob = pcmToWavBlob(inline.data, sampleRate);
    const durationSec = (blob.size - 44) / (sampleRate * 2); // 16-bit mono
    return { blob: blob, durationSec: Math.round(durationSec * 100) / 100 };
  }

  // =====================================================================
  // 🎙️ VoiceClone (XTTS v2) — เสียงโคลนของลูกค้าเอง ผ่าน Public API /api/v1/tts
  //   ส่งแค่ text + API key → server ดึง "เสียง default" ที่ลูกค้าผูกบัญชีไว้มาพากย์
  //   คืนไฟล์ WAV ตรงๆ (synchronous) → คำนวณ duration จากไฟล์ (ไว้ทำ timing ซับ)
  // =====================================================================

  // หาความยาว (วิ) ของ WAV blob — parse header ก่อน (เป๊ะ ไม่ต้อง decode) → fallback AudioContext
  async function wavDurationSec(blob) {
    try {
      const buf = new Uint8Array(await blob.arrayBuffer());
      if (buf.length >= 44) {
        const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
        let sampleRate = 24000, channels = 1, bits = 16, byteRate = 0, dataBytes = 0;
        let off = 12; // ข้าม "RIFF"(4)+size(4)+"WAVE"(4)
        while (off + 8 <= buf.length) {
          const id = String.fromCharCode(buf[off], buf[off + 1], buf[off + 2], buf[off + 3]);
          const sz = dv.getUint32(off + 4, true);
          if (id === 'fmt ') {
            channels = dv.getUint16(off + 10, true);
            sampleRate = dv.getUint32(off + 12, true);
            byteRate = dv.getUint32(off + 16, true);
            bits = dv.getUint16(off + 22, true);
          } else if (id === 'data') { dataBytes = sz; break; }
          off += 8 + sz + (sz & 1);
        }
        if (!byteRate) byteRate = sampleRate * channels * (bits / 8);
        if (byteRate > 0 && dataBytes > 0) return Math.round((dataBytes / byteRate) * 100) / 100;
      }
    } catch (_) { /* ตกไป fallback */ }
    try {
      const ab = await blob.arrayBuffer();
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const b = await ctx.decodeAudioData(ab);
      const d = b.duration; try { ctx.close(); } catch (_) {}
      return Math.round(d * 100) / 100;
    } catch (_) { return 0; }
  }

  /**
   * cfg: { serverUrl, apiKey, speed, language, instruct }
   * → { blob (audio/wav), durationSec }
   */
  async function synthesizeClone(text, cfg) {
    cfg = cfg || {};
    if (!cfg.serverUrl) throw new Error('ยังไม่ได้ตั้งค่า Server URL ของ VoiceClone');
    if (!cfg.apiKey) throw new Error('ยังไม่ได้ใส่ VoiceClone API Key');
    const base = String(cfg.serverUrl).trim().replace(/\/+$/, '');
    const fd = new FormData();
    fd.append('text', text);
    fd.append('language', cfg.language || 'th');
    fd.append('speed', String(cfg.speed || 1.0));
    if (cfg.instruct) fd.append('instruct', cfg.instruct);
    // ไม่แนบ reference → server ใช้เสียง default ของเจ้าของ key
    let res;
    try {
      res = await fetch(base + '/api/v1/tts', { method: 'POST', headers: { 'X-API-Key': cfg.apiKey }, body: fd });
    } catch (e) {
      throw new Error('ต่อ VoiceClone ไม่ได้ — เช็ค Server URL/เน็ต (' + e.message + ')');
    }
    if (!res.ok) {
      let detail = '';
      try { const e = await res.json(); detail = (e && e.detail) || ''; } catch (_) {}
      if (res.status === 401) throw new Error('VoiceClone API Key ไม่ถูกต้อง/ถูกยกเลิก');
      if (res.status === 402) throw new Error('เครดิต/แพ็กเกจ VoiceClone หมด — เติมก่อนใช้งาน' + (detail ? ' (' + detail + ')' : ''));
      if (res.status === 429) throw new Error('VoiceClone คิวเต็ม/เกินโควต้า — รอสักครู่' + (detail ? ' (' + detail + ')' : ''));
      if (res.status === 400 && /เสียงต้นแบบ|reference/i.test(detail)) throw new Error('บัญชีนี้ยังไม่มีเสียงต้นแบบ — อัปเสียงในเว็บ VoiceClone ก่อน');
      throw new Error('VoiceClone HTTP ' + res.status + (detail ? ' — ' + detail : ''));
    }
    const blob = await res.blob();
    if (!blob || blob.size < 1000) throw new Error('VoiceClone คืนไฟล์เสียงว่าง/เล็กผิดปกติ');
    const durationSec = await wavDurationSec(blob);
    return { blob: blob, durationSec: durationSec };
  }

  window.PDMiniTTS = { synthesize: synthesize, synthesizeClone: synthesizeClone };
})();
