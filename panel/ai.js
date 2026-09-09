// =====================================================================
// PD Auto Flow Mini — AI module (คิดบทโฆษณา)
// รองรับ 2 คีย์: pdvip_ (PD Gateway, OpenAI-compatible) / AIza (Gemini ตรง)
// =====================================================================
(function () {
  'use strict';

  const GATEWAY_URL = 'https://pd-auto-ai-gateway.filmbancha127.workers.dev/v1/chat/completions';
  // v0.7.4: Google ปิด gemini-2.5-flash สำหรับ API key ใหม่ (HTTP 404 "no longer available to new users")
  //   → default = gemini-flash-latest (alias ชี้รุ่นล่าสุดเสมอ) + โมเดลสำรองไล่ลำดับอัตโนมัติ
  //   เมื่อเฟลแบบที่เปลี่ยนโมเดลแล้วช่วยได้ (404 คีย์ใหม่ / 429 / 500 / 503 high demand) — pattern เดียวกับ PD Yum v1.9
  //   ⚠️ เฉพาะเส้น Gemini ตรง (AIza) — pdvip_ gateway และ TTS (tts.js) ไม่แตะ
  const GEMINI_FALLBACK_MODELS = ['gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-2.5-flash'];

  // 🧯 ซ่อม/กู้ JSON บทที่ AI ตอบเพี้ยน — คืน {scenes:[...]} หรือ null
  //   ชั้น 1: parse ตรง · ชั้น 2: เติม comma ระหว่าง }{ + ตัด trailing comma · ชั้น 3: สแกนกู้รายฉาก (object ที่ปิดครบ) ข้ามส่วนที่โดนตัด/พัง
  function parseScenesLoose(raw) {
    const txt = String(raw || '').replace(/```(?:json)?/gi, '');
    const m = txt.match(/\{[\s\S]*\}/);
    const cand = m ? m[0] : txt;
    try { const p = JSON.parse(cand); if (p && p.scenes) return p; } catch (_) {}
    const fixed = cand.replace(/\}\s*\{/g, '},{').replace(/,\s*([}\]])/g, '$1');
    try { const p = JSON.parse(fixed); if (p && p.scenes) return p; } catch (_) {}
    const start = txt.indexOf('"scenes"');
    if (start < 0) return null;
    const arrStart = txt.indexOf('[', start);
    if (arrStart < 0) return null;
    const objs = [];
    let depth = 0, objStart = -1, inStr = false, esc = false;
    for (let i = arrStart + 1; i < txt.length; i++) {
      const c = txt[i];
      if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
      if (c === '"') { inStr = true; continue; }
      if (c === '{') { if (depth === 0) objStart = i; depth++; }
      else if (c === '}') { depth--; if (depth === 0 && objStart >= 0) { try { objs.push(JSON.parse(txt.slice(objStart, i + 1))); } catch (_) {} objStart = -1; } }
      else if (c === ']' && depth === 0) break;
    }
    return objs.length ? { scenes: objs } : null;
  }

  async function callText(prompt, apiKey) {
    if (!apiKey) throw new Error('ยังไม่ได้ใส่ API Key — กด ⚙️ มุมขวาบน');

    if (apiKey.startsWith('pdvip_')) {
      const res = await fetch(GATEWAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4000,
          temperature: 0.8,
        }),
      });
      if (!res.ok) {
        // อ่าน "เหตุผลจริง" จาก gateway มาโชว์ — รองรับ OpenAI {error:{message}} / {detail} / {message} / raw text
        let detail = '';
        try {
          const t = await res.text();
          try {
            const e = JSON.parse(t);
            detail = (e && ((e.error && (e.error.message || e.error)) || e.detail || e.message)) || '';
          } catch (_) { detail = t; }
        } catch (_) {}
        detail = String(detail || '').trim().slice(0, 300);
        throw new Error('PD Gateway HTTP ' + res.status + (detail ? ' — ' + detail : ''));
      }
      const data = await res.json();
      return (data.choices && data.choices[0] && data.choices[0].message.content) || '';
    }

    // Gemini ตรง — v0.7.4: ลอง gemini-flash-latest ก่อน ถ้าเฟลแบบที่เปลี่ยนโมเดลแล้วช่วยได้
    //   (404/429/500/503) ค่อยไล่โมเดลสำรอง · เฟลแบบอื่น (คีย์ผิด/พารามิเตอร์ผิด) โยน error ทันที
    let lastErr = null;
    for (const model of GEMINI_FALLBACK_MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 4000 },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return (data.candidates && data.candidates[0] && data.candidates[0].content.parts[0].text) || '';
      }
      let detail = '';
      try {
        const t = await res.text();
        try { const e = JSON.parse(t); detail = (e && e.error && (e.error.message || e.error)) || ''; }
        catch (_) { detail = t; }
      } catch (_) {}
      detail = String(detail || '').trim().slice(0, 300);
      lastErr = new Error('Gemini HTTP ' + res.status + (detail ? ' — ' + detail : ''));
      if (![404, 429, 500, 503].includes(res.status)) throw lastErr; // เฟลที่โมเดลสำรองช่วยไม่ได้ → โยนเลย
    }
    throw lastErr;
  }

  // v0.3.1: คิดแฮชแท็ก TikTok จากชื่อสินค้า (AI) — fallback เป็นแท็กทั่วไปถ้าไม่มี key/พลาด
  const FALLBACK_TAGS = ['#fyp', '#ของมันต้องมี', '#ติ๊กต๊อกช้อป'];
  async function generateHashtags(product, apiKey) {
    if (!apiKey) return FALLBACK_TAGS;
    try {
      const prompt = `สร้างแฮชแท็ก TikTok ภาษาไทยสำหรับโพสขายสินค้านี้: "${product.name}"
กติกา:
- ตอบเป็นแฮชแท็ก 6-8 ตัว คั่นด้วยช่องว่าง ขึ้นต้นด้วย # ทุกตัว
- เกี่ยวข้องกับสินค้าโดยตรง (ประเภท/ประโยชน์/กลุ่มเป้าหมาย/โอกาสใช้) + ผสมแฮชแท็กดังที่คนค้นเยอะ เช่น #fyp #ติ๊กต๊อกช้อป #ของมันต้องมี
- ภาษาไทยเป็นหลัก (มีอังกฤษได้บ้าง) · ห้ามเว้นวรรคกลางแฮชแท็ก · ห้าม emoji
- ตอบเฉพาะบรรทัดแฮชแท็กอย่างเดียว ห้ามมีคำอธิบาย/หัวข้อ`;
      const txt = await callText(prompt, apiKey);
      const tags = (String(txt).match(/#[^\s#]+/g) || []).map((t) => t.trim()).filter(Boolean).slice(0, 10);
      return tags.length ? tags : FALLBACK_TAGS;
    } catch (e) {
      return FALLBACK_TAGS;
    }
  }

  // v0.6.4: 🤖 AI คิดชื่อตะกร้า (Product name บนคลิป) จากชื่อสินค้า — port prompt จาก PD Auto VIP
  //   สั้น ≤25 ตัว · ไทยล้วน · ไม่มีตัวเลข/อักขระพิเศษ · capped 30 · fallback = ชื่อสินค้าที่ clean แล้ว
  const _cleanBasket = (s) => String(s || '').replace(/[+\-*/\\|@#$%^&=<>\[\]{}"'()!?~`:;0-9]/g, '').replace(/\s+/g, ' ').trim().slice(0, 30);
  async function generateBasketName(productName, apiKey) {
    const fallback = _cleanBasket(productName) || 'สินค้าดีบอกต่อ';
    if (!apiKey || !productName) return fallback;
    try {
      const prompt = `แต่งชื่อตะกร้าสินค้าสำหรับ TikTok Shop จากชื่อสินค้านี้: "${productName}"

กฎ:
- ชื่อต้องสั้นกระชับ ไม่เกิน 25 ตัวอักษร
- ห้ามใช้ตัวเลข (0-9)
- ห้ามใช้อักขระพิเศษ เช่น + - * / @ # $ % & = ! ? " ' ( ) [ ] { }
- ใช้ภาษาไทยเท่านั้น
- ทำให้น่าสนใจ ดึงดูดให้คนกดซื้อ
- ห้ามใช้คำเกินจริง เช่น ที่สุด, อันดับ1, 100%

ตัวอย่าง:
- "ซอสพริก A1 รสเผ็ด 500ml" → "ซอสพริกรสเผ็ดอร่อย"
- "ชุดเครื่องครัว 5 ชิ้น" → "เครื่องครัวครบชุด"
- "หมอนรองคอ+ผ้าห่ม" → "หมอนผ้าห่มนุ่มสบาย"

ตอบแค่ชื่อตะกร้าอย่างเดียว ไม่ต้องอธิบาย:`;
      const txt = await callText(prompt, apiKey);
      const name = _cleanBasket(txt);
      return name.length >= 3 ? name : fallback;
    } catch (e) {
      return fallback;
    }
  }

  // โครงเรื่องโฆษณา — { desc: หน้าที่แต่ละฉาก, tone?: โทนบทพูด, cta?: ทิศทางคำปิด }
  //   ⚠️ บอกแค่ "แนวทาง/สิ่งที่ต้องการ" — ห้ามใส่ตัวอย่างบทพูด (API ชอบลอกตัวอย่าง → บทซ้ำจำเจ)
  //   tone/cta ไม่ใส่ = ใช้ default (ขายแรง + ปิดเร่งซื้อ)
  const DEFAULT_TONE = 'โทนบทพูด: ขายแรง มีพลัง โน้มน้าว เหมือนพิธีกรขายของเก่ง ไม่ใช่ AI อ่านข้อความ — กระตุก เร้าอารมณ์ จังหวะเร็ว';
  const DEFAULT_CTA = 'ฉากสุดท้าย: ปิดด้วยคำเชิญชวนซื้อที่เร่งเร้า กระตุ้นให้กดสั่ง/กดตะกร้าทันที';
  const STRUCTURES = {
    problem_solution: { desc: 'ฉากแรกเปิดด้วยปัญหาที่คนดูเจอ (ใกล้ตัว สะกิดใจ) → ฉากกลางตอกย้ำความเจ็บปวด แล้วเสนอสินค้าเป็นทางออก → ฉากท้ายปิดด้วยคำชวนซื้อชัดเจน' },
    hard_sell: { desc: 'ขายแรงตั้งแต่วิแรก: เปิดด้วยข้อเสนอ/จุดเด่นที่เด็ดสุด → ย้ำคุณค่าและเหตุผลที่ต้องซื้อ → ปิดด้วยคำชวนซื้อเร่งด่วน' },
    storytelling: { desc: 'เล่าเรื่อง: ชีวิตก่อนใช้สินค้า (ติดปัญหา) → จุดเปลี่ยนเมื่อเจอสินค้า → ชีวิตหลังใช้ดีขึ้นชัดเจน → ปิดเชิญชวนนุ่มๆ',
      tone: 'โทนบทพูด: เล่าเรื่องอบอุ่น จริงใจ เหมือนเล่าประสบการณ์ตัวเอง น้ำเสียงนุ่มน่าฟัง ไม่ฮาร์ดเซล',
      cta: 'ฉากสุดท้าย: ปิดด้วยคำเชิญชวนแบบนุ่มอบอุ่น ไม่เร่ง ไม่กดดัน' },
    lifestyle: { desc: 'Lifestyle: โชว์สินค้าในชีวิตประจำวันสวยๆ มีระดับ ไม่ฮาร์ดเซล → เน้นอารมณ์/ความรู้สึกดี → ปิดด้วยภาพลักษณ์แบรนด์',
      tone: 'โทนบทพูด: มีระดับ คูล สั้นกระชับ ให้ความรู้สึกพรีเมียม ไม่ขายแรง',
      cta: 'ฉากสุดท้าย: ปิดสั้นๆ มีระดับ ชวนแบบเบาๆ' },

    // ── v0.2 แนวใหม่ (ตลก/ใกล้ตัว/ไวรัล) — แนวทางล้วน ไม่มีตัวอย่างบทพูด ──
    funny: { desc: 'โฆษณาตลก/มุกป่วน: ฉากแรกเปิดด้วยสถานการณ์ขำหรือมุกที่คนไทยอิน (เกินจริงนิดๆ) → ฉากกลางเล่นมุกต่อ แล้วสินค้ามาแก้สถานการณ์แบบฮาๆ → ปิดด้วยมุกทิ้งท้ายพร้อมชวนซื้อ',
      tone: 'โทนบทพูด: ตลก กวนๆ ทีเล่นทีจริง ภาษาวัยรุ่น/มีมไทย จังหวะสนุก เหมือนเพื่อนจิกกัด ไม่ใช่ขายของจริงจัง',
      cta: 'ฉากสุดท้าย: ปิดแบบกวนๆ ตลกๆ ชวนซื้อทีเล่นทีจริง' },
    relatable: { desc: 'ใกล้ตัวชีวิตจริง: ฉากแรกเปิดด้วยสถานการณ์ในบ้าน/ที่ทำงาน/ชีวิตประจำวันที่ทุกคนเจอและสะกิดใจ → ฉากกลางตอกย้ำความน่ารำคาญนั้น แล้วสินค้าช่วยได้จริง → ปิดชวนแบบเพื่อนบอกเพื่อน',
      tone: 'โทนบทพูด: เป็นกันเองเหมือนเพื่อนเล่าให้เพื่อนฟัง จริงใจ ใกล้ตัว คุยสบายๆ ไม่ขายแรง',
      cta: 'ฉากสุดท้าย: ชวนแบบเพื่อนแนะนำกันเอง ไม่กดดัน' },
    ugc_review: { desc: 'รีวิวบอกต่อ (UGC): ฉากแรกเหมือนคนทั่วไปมารีวิวจากประสบการณ์จริง → ฉากกลางโชว์จุดที่ชอบจริง ดิบ ไม่เว่อร์ → ปิดแบบแนะนำเพื่อน น่าเชื่อถือ',
      tone: 'โทนบทพูด: เหมือนคนรีวิวจริงปากต่อปาก ดิบ จริงใจ ไม่เป๊ะเหมือนโฆษณา น่าเชื่อ',
      cta: 'ฉากสุดท้าย: แนะนำแบบจริงใจ ชวนคนที่ลังเลให้ลอง' },
    viral_trend: { desc: 'ตามกระแสไวรัล: ฉากแรก hook แรงสไตล์คลิปไวรัล TikTok สะกิดให้หยุดดูใน 1 วิ → ฉากกลางไต่ความอยากรู้แล้วเฉลยสินค้า → ปิดเร่งกระแสให้รีบมี',
      tone: 'โทนบทพูด: ไวรัลวัยรุ่น จังหวะเร็วปังๆ ใช้ภาษาเทรนด์ TikTok เร้าใจ ปลุกกระแส',
      cta: 'ฉากสุดท้าย: เร่งกระแส กระตุ้นให้รีบมีก่อนตกเทรนด์' },
    dm_close: { desc: 'ปิดด้วยทักแชท: ฉากแรก hook ปัญหา/ของเด็ด → ฉากกลางโชว์ผลลัพธ์และสร้างความอยากรู้ (เก็บวิธีสั่ง/โปรไว้ ยังไม่บอกหมด) → ปิดด้วยการชวนให้ทักแชท/อินบอกซ์',
      tone: 'โทนบทพูด: ชวนคุย เป็นกันเอง กระตุ้นความอยากรู้ เหมือนแม่ค้าออนไลน์เก่ง ให้คนอยากทักมาถาม',
      cta: 'ฉากสุดท้าย: ปิดด้วยการกระตุ้นให้ทักแชท/อินบอกซ์ (ไม่ใช่กดตะกร้า)' },

    // v0.3: 🥦 ละครผัก/ผลไม้หัวคน (มีมไวรัล TikTok ไทย) — ตัวละครลำตัวคน หัวเป็นผัก/ผลไม้ เล่นดราม่าเว่อร์
    veggie_drama: { desc: 'ละครดราม่าตลก "ผัก/ผลไม้หัวคน": ตัวละครลำตัวมนุษย์แต่หัวเป็นผัก/ผลไม้ → ฉากแรกเปิดดราม่ามีปม/สถานการณ์วุ่นวายเกินจริง → ฉากกลางตัวละครเดือดร้อน แล้วสินค้ามาช่วยพลิกสถานการณ์แบบละคร → ปิดจบแฮปปี้+ชวนซื้อ',
      tone: 'โทนบทพูด: ดราม่าเกินจริงตลกๆ สไตล์ละครหลังข่าว/ละครจักรๆวงศ์ๆ น้ำเสียงเว่อร์วังอลังการแต่ฮา จิกกัดสนุก',
      cta: 'ฉากสุดท้าย: ปิดแบบละครจบสวยๆ + ชวนซื้อกวนๆ ทีเล่นทีจริง' },

    // ── v0.5 แนวใหม่ (โชว์สินค้า/ฟอร์แมตขายดี) — เน้นให้ "ภาพ" เล่าเรื่อง เหมาะสินค้าที่ต้องเห็นผล/เห็นการใช้งาน ──
    before_after: { desc: 'ก่อน-หลัง (Before/After): ฉากแรกโชว์ "สภาพก่อนใช้" ที่เป็นปัญหา/ดูแย่ชัดเจน (สะกิดใจคนที่เจอปัญหาเดียวกัน) → ฉากกลางคือจุดเปลี่ยนตอนหยิบสินค้ามาใช้ → ฉากท้ายโชว์ "ผลลัพธ์หลังใช้" ที่ดีขึ้นต่างจากเดิมแบบเห็นชัด → ปิดชวนซื้อ · ⚠️ ฉากก่อน vs หลัง ต้องเป็นมุม/ฉาก/วัตถุเดียวกันให้เปรียบเทียบได้ ต่างกันแค่สภาพ',
      tone: 'โทนบทพูด: เน้นความเปลี่ยนแปลงที่เห็นชัด น่าทึ่ง ชวนเชื่อ "ก่อน-หลังต่างกันลิบ" ตอกย้ำว่าของได้ผลจริง',
      cta: 'ฉากสุดท้าย: ปิดด้วยการย้ำผลลัพธ์ + ชวนซื้อให้ลองเปลี่ยนเอง' },
    asmr_satisfying: { desc: 'ASMR/ฟินๆ (Satisfying): ปล่อยให้ "ภาพ" เป็นพระเอก — โคลสอัพจัดเต็มที่พื้นผิว/ดีเทล/เนื้อสัมผัสของสินค้า + จังหวะการเท/ราด/แกะ/บีบ/สัมผัสที่ดูแล้วฟินน่าพอใจ → ไล่ความน่ากิน/น่าใช้ทีละฉาก → ปิดชวนซื้อเบาๆ · บทพูดสั้นมาก ปล่อยให้ภาพ+เสียงทำงาน',
      tone: 'โทนบทพูด: น้อยคำ นุ่ม ชวนฟิน เน้นกระตุ้นประสาทสัมผัส/ความอยาก ไม่ขายแรง ปล่อยให้ภาพนำ',
      cta: 'ฉากสุดท้าย: ปิดเบาๆ ชวนลองแบบกระตุ้นความอยาก' },
    demo_howto: { desc: 'เดโม/วิธีใช้ (How-to): ฉากแรก hook ปัญหาที่สินค้านี้แก้ได้ → ฉากกลางโชว์ "ขั้นตอนการใช้งานจริง" ทีละสเต็ปให้เห็นว่าใช้ง่ายและได้ผล (เน้นโชว์มือใช้งาน/สินค้าทำงาน) → ฉากท้ายโชว์ผลลัพธ์ + ชวนซื้อ',
      tone: 'โทนบทพูด: ชัดเจน เป็นมิตร เหมือนพาทำ "ทำตามนี้เลย" กระชับเข้าใจง่าย น่าเชื่อถือ',
      cta: 'ฉากสุดท้าย: สรุปว่าใช้ง่ายแค่ไหน + ชวนซื้อไปลองเอง' },
    listicle: { desc: 'นับข้อ/เหตุผล (Listicle): ฉากแรกเปิดด้วยพาดหัวนับจำนวน เช่น "3 เหตุผลที่ต้องมี..." (hook) → แต่ละฉากกลางเล่าทีละข้อ (ข้อ 1 → ข้อ 2 → ข้อ 3) สั้นกระชับ เห็นภาพชัด → ฉากท้ายสรุป + ชวนซื้อ',
      tone: 'โทนบทพูด: กระชับ จังหวะเร็ว นับเป็นข้อๆ ชัดเจน ("ข้อแรก... ข้อสอง...") เร้าใจแบบคลิปสายให้ข้อมูลที่ไวรัล',
      cta: 'ฉากสุดท้าย: สรุปทุกข้อสั้นๆ + ชวนซื้อเร่งเร้า' },

    // v0.5+: 💊 ป้ายยา — โทน TikTok ไทยฮิต: อวยสินค้าจนคนดูอยากได้ตาม สร้าง FOMO เหมือนเพื่อนคลั่งของมาบอกต่อ
    pai_ya: { desc: 'ป้ายยา (อวยจนต้องกด): ฉากแรกเปิดแบบตื่นเต้นสุดๆ "ต้องมาป้ายยา..." / "ของมันต้องมี!" ดึงให้คนอยากรู้ว่าอะไร → ฉากกลางอวยจุดเด่นรัวๆ ด้วยความอินจัด โชว์ให้เห็นว่าดีจริงจนต้องบอกต่อ สร้างความอยากได้ (FOMO) → ฉากท้ายปิดด้วยการเร่งให้รีบกดก่อนพลาด/ของหมด',
      tone: 'โทนบทพูด: ตื่นเต้น อินสุดตัว อวยแบบเพื่อนติ่งที่คลั่งสินค้านี้มาบอกต่อด้วยความฟิน พูดรัวๆ เร้าใจ ชวนเชื่อ กระตุ้น FOMO "ไม่ได้ก็ไม่ได้แล้ว"',
      cta: 'ฉากสุดท้าย: เร่ง FOMO ปิดการขาย "รีบไปกดเลย ของแบบนี้ต้องมี เดี๋ยวหมด อย่าหาว่าไม่เตือน"',
      // v0.6: pai_ya ต้องดู "อินฟลูบ้านๆ เรียลๆ" ไม่ใช่หนังโฆษณาหรู — override ความอลังการ/หรูหราของกฎภาพ default
      imgFeel: 'โทนภาพแบบ "อินฟลู/รีวิวบ้านๆ เรียลๆ" (สำคัญ: ใช้ override กฎภาพด้านบนเรื่องความหรู/อลังการทั้งหมด): ถ่ายเหมือนคลิปรีวิวจริงที่คนทั่วไปถ่ายด้วยมือถือ — natural everyday Thai home/real-life setting (ห้องนั่งเล่นบ้านธรรมดา, ห้องนอน, ครัวบ้านทั่วไป, โต๊ะทำงาน/โต๊ะกินข้าว, ร้านสะดวกซื้อ, ในรถ) · natural soft indoor lighting หรือแสงธรรมชาติ · bright cheerful authentic UGC handheld look ดูเป็นกันเอง เข้าถึงง่าย. ❌ ห้ามเด็ดขาด: หรูหรา, หินอ่อน/marble, โทนทองอร่าม, โคมระย้า, studio set แพงๆ, ครัวพรีเมียม, cinematic dramatic lighting, ฉาก luxury — ให้เหมือนบ้าน/ชีวิตคนไทยทั่วไปจริงๆ' },

    // v0.6.4: 📦 โกดังขายส่ง (เห็นแค่มือ) — port จาก PD Auto VIP · POV มือหยิบสินค้าในโกดังจริง ไม่เห็นหน้าคน (ใช้ WAREHOUSE_IMG แทนกฎภาพปกติ + ไม่แนบ ref ตัวละคร)
    warehouse_hands: { desc: 'รีวิวขายส่งสไตล์โกดัง (เห็นแค่มือ): ทุกฉากมุม POV เห็นแค่มือคนหยิบ/โชว์/หมุนสินค้าในโกดังจริง ไม่เห็นหน้า → ฉากแรก hook ของดีของถูกพร้อมส่งจากโกดัง → ฉากกลางโชว์สินค้าใกล้ๆ ในมือ บอกจุดเด่น/ความคุ้ม/ของเยอะพร้อมส่ง → ฉากท้ายปิดแบบขายส่ง เร่งให้รีบสั่งก่อนหมดสต๊อก',
      tone: 'โทนบทพูด: แม่ค้าขายส่ง/เจ้าของโกดัง จริงใจ ตรงไปตรงมา เน้นของเยอะ-ถูก-พร้อมส่ง คุ้มค่า น่าเชื่อถือ เหมือนเจ้าของโกดังมาบอกเอง',
      cta: 'ฉากสุดท้าย: ปิดแบบขายส่ง "ของพร้อมส่งจากโกดัง สั่งเลยก่อนหมดสต๊อก" เร่งให้รีบสั่ง',
      handsOnly: true },

    // v0.6.7: 👗 เซลฟี่กระจกลองเสื้อ (mirror selfie / OOTD) — คนถือมือถือถ่ายกระจก ใส่สินค้าโชว์ · แนวขายเสื้อผ้า/แฟชั่น (ใช้ MIRROR_IMG/VIDEO แทนกฎภาพปกติ)
    mirror_selfie: { desc: 'รีวิวลองเสื้อสไตล์เซลฟี่กระจก (OOTD): คนถือมือถือถ่ายกระจกในห้อง ใส่สินค้า(เสื้อผ้า)โชว์บนตัว → ฉากแรกอวดลุค/ของใหม่ที่เพิ่งได้มา (hook สะดุดตา) → ฉากกลางโชว์เสื้อผ้าหลายมุม (หน้า/เอียงข้าง/ซูมดีเทลเนื้อผ้า) บอกจุดเด่น ทรงสวย/ใส่สบาย/แมตช์ง่าย → ฉากท้ายชวนซื้อแบบแฟชั่น',
      tone: 'โทนบทพูด: วัยรุ่น/สาวๆ รีวิวเสื้อผ้าเป็นกันเอง สดใส อวดลุคแบบเพื่อนบอกเพื่อน "ใส่แล้วปัง" ไม่ขายแรง',
      cta: 'ฉากสุดท้าย: ชวนซื้อแบบแฟชั่น "ตัวนี้ปังมาก รีบสอยก่อนหมดไซซ์/หมดสต๊อก"',
      clothingTryOn: true },

    // v0.7.2: 🤍 มินิมอลน่ารัก — ฟุตเทจบ้านโทนอุ่นสไตล์มูจิ/เกาหลี ภาพนำ คำน้อย ตัดจังหวะนุ่มๆ (ref: คลิปชามแมวขาช้าง — แคปชั่นน่ารักลอยข้างสินค้า)
    minimal_cute: { desc: 'มินิมอลน่ารัก (ภาพนำ คำน้อย): ทุกฉากโชว์สินค้าในบ้านมินิมอลโทนอุ่น บรรยากาศน่ารักสบายตา → ฉากแรกเปิดด้วยภาพสวยสะดุดตา + hook สั้นๆ น่ารักชวนหยุดดู → ฉากกลางโชว์จุดเด่น "ฉากละประเด็นเดียว" สั้นกระชับ ให้ภาพเล่าเรื่องเป็นหลัก (เช่น ทรงสวย / ใช้ง่าย / มีหลายสี / ทนแข็งแรง) → ฉากท้ายปิดชวนซื้อนุ่มๆ ไม่เร่งเร้า',
      tone: 'โทนบทพูด: นุ่ม น่ารัก อบอุ่น คำน้อยแต่ได้ใจความ เหมือนแคปชั่นสั้นๆ ในคลิปมินิมอล พูดสบายๆ ชิลๆ ไม่ตะโกนขาย ไม่เร่งจังหวะ',
      cta: 'ฉากสุดท้าย: ปิดเบาๆ น่ารักๆ ชวนซื้อแบบนุ่มนวล ไม่กดดัน',
      imgFeel: 'โทนภาพ "มินิมอลอบอุ่น" (สำคัญ: ใช้ override ความอลังการ/dramatic ของกฎภาพด้านบนทั้งหมด): บ้านมินิมอลสไตล์มูจิ/เกาหลี/ญี่ปุ่น — warm cozy minimal home interior, พื้นไม้สีอ่อน ผนังครีม/ขาว เฟอร์นิเจอร์ไม้เรียบๆ ต้นไม้กระถางเล็กๆ · แสงธรรมชาตินุ่มจากหน้าต่าง (soft warm natural daylight, airy bright, gentle shadows) · โทนสีครีม เบจ พาสเทลอ่อน สบายตา · องค์ประกอบโล่ง สะอาด ไม่รก สินค้าเด่นกลางเฟรม ฉากหลังเบลอนุ่ม (shallow depth of field) · ถ้าสินค้าเกี่ยวกับสัตว์เลี้ยง ให้มีแมว/หมาน่ารักร่วมเฟรมใช้สินค้าจริง. ❌ ห้ามเด็ดขาด: dramatic lighting, volumetric light rays, particles/splash/smoke, ฉากหรูอลังการ, สีจัดฉูดฉาด, โทนมืด, studio set — ทุกฉากต้องดูอบอุ่น นุ่ม น่ารัก แบบคลิปรีวิวมินิมอล',
      vidFeel: 'กล้องนิ่งหรือเคลื่อนช้ามากเท่านั้น — static locked shot, slow gentle push-in, subtle soft handheld · การเคลื่อนไหวในฉากเป็นธรรมชาติเบาๆ (สัตว์เลี้ยงเดิน/กินอาหาร, มือวาง/หยิบสินค้านุ่มๆ, แสงแดดไล้, ใบไม้ไหวเบาๆ) · ❌ ห้าม fast push-in, crash zoom, speed-ramp, crane, whip pan — จังหวะทั้งคลิปต้องนุ่ม ช้า สบายตา แบบคลิปมินิมอล' },
  };

  // v0.3.1 (v2): directive ภาพ veggie_drama — ตาม ref จริง: หน้า+ตัวคน ผมทำจากผลไม้ ผิวย้อมโทน 3D เรียลหนัง ดราม่าละคร
  // ใช้ "แทน" กฎภาพปกติทั้งหมด (ไม่แนบ ref คน — AI สร้างตัวละครผลไม้เอง — แต่ยังอิงรูปสินค้า)
  const VEGGIE_IMG = `🥦 กฎภาพ (ละครผัก/ผลไม้หัวคน) — ใช้แทนกฎภาพปกติ · image_prompt ทุกฉากเป็นภาษาอังกฤษ:
- **สไตล์:** hyper-realistic 3D cinematic CGI character render, dewy glossy skin, adult proportions, dramatic glamour makeup, moody filmic lighting, depth of field — ดูเหมือนโปสเตอร์ละคร/หนัง CGI ระดับสตูดิโอ **ไม่ใช่การ์ตูน/ไม่แบน**
- **ตัวละคร:** ใบหน้าและร่างกายเป็น "มนุษย์" สวย/หล่อปกติ แต่ **ทรงผม/ศีรษะถูกแทนด้วยผัก-ผลไม้** อย่างแนบเนียนสมจริง — เช่น a woman whose hair is a lush cluster of glossy purple grapes adorned with golden vines · a man with carved pumpkin-textured orange hair · broccoli-floret green hair · medusa-like green herb tendrils with parsley leaves · apple-shaped red hair with a stem and a leaf on top (แต่ละคนคนละชนิด)
- **ผิวย้อมโทนตามผล (เนียน นุ่ม ยังดูเป็นผิวคน):** องุ่น→ผิวม่วงนวล · บรอกโคลี/สมุนไพร→ผิวเขียว · ฟักทอง/ส้ม→ผิวส้ม
- **ทุกฉากมีตัวละคร 2 คนขึ้นไป** เล่น **ดราม่าแบบละครไทยหลังข่าว**: ร้องไห้ฟูมฟาย / ปลอบโยน / เผชิญหน้าจ้องตา / ตึงเครียดโรแมนติก — อารมณ์+ท่าทางจัดเต็มเกินจริง
- **ฉากหลังหรูดราม่า cinematic:** ห้องบอลรูมโคมระย้า · เมืองกลางคืนไฟระยิบ · คฤหาสน์ · ลานจอดรถใต้ดินมีหมอก — สลับตามฉาก พร้อม dramatic/rim lighting, bokeh
- **แอบขายสินค้าเนียนๆ:** ตัวละครถือ/ใช้/วางสินค้าให้เด่นชัดในเฟรม — สินค้าต้องตรงกับรูปที่แนบเป๊ะ (ถ้าฉากนั้นมีสินค้า)
- ตัวละครไม่อ้าปากพูด/ลิปซิงค์ (เสียงพากย์ทับ) — สื่ออารมณ์ด้วยสีหน้า/ท่าทางแทน
- 9:16 แนวตั้ง · ห้ามโลโก้ · ข้อความบนภาพเฉพาะฉากแรกตามกฎ 📌 ด้านล่าง
- (AI สร้างตัวละครผลไม้เอง ไม่อิงรูปคนที่แนบ — แต่ยังต้องอิงรูป "สินค้า" ที่แนบให้ตรง)`;

  // v0.6.4: directive ภาพ warehouse_hands (port VIP) — POV เห็นแค่มือในโกดังจริง · ใช้แทนกฎภาพปกติ · ไม่แนบ ref คน
  const WAREHOUSE_IMG = `📦 กฎภาพ (โกดังขายส่ง เห็นแค่มือ) — ใช้แทนกฎภาพปกติ · image_prompt ทุกฉากเป็นภาษาอังกฤษ:
- **มุมกล้อง POV เห็นแค่ "มือ" เท่านั้น** — first-person candid handheld, มือคนเดียวยื่นมาจับ/โชว์/หมุนสินค้าด้านหน้ากล้อง · **ไม่เห็นหน้า ไม่เห็นตัวคน ไม่เห็นลำตัว** · สินค้าต้องอยู่ในมือเด่นกลางเฟรมทุกฉาก (the hand must hold the product in frame at all times)
- ⚠️ **ANATOMY LOCK (สำคัญสุด):** realistic natural human hands only — มือมนุษย์ปกติของคนคนเดียว (1 หรือ 2 มือ), 5 นิ้วต่อมือ สัดส่วนถูกต้อง · **ห้ามมีแขน/มือเกิน, ห้ามนิ้วเกิน/นิ้วผิดรูป, ห้ามมือลอย/มือขาด/มือบิดเบี้ยว**
- **ฉากหลังโกดังจริง:** real working warehouse — blue and orange painted metal pallet racking (lived-in look, ไม่ใหม่เอี่ยม ไม่ทรุดโทรม) เต็มไปด้วยกล่องสินค้า/พาเลทของ/ลังกระดาษเรียงแบบใช้งานจริง, พื้นซีเมนต์, เพดานสูงโครงเหล็ก exposed steel rafters, ไฟ fluorescent warm white สว่างพอ · busy working warehouse ของเยอะพร้อมส่ง
- **โทน:** realistic candid amateur warehouse video — **NOT studio, NOT cinematic, NOT polished** · soft natural realism, shallow depth of field เน้นสินค้าในมือ · neutral tones
- ⚠️ **สินค้าต้องตรงรูปที่แนบเป๊ะ** (แพ็กเกจ/ฉลาก/แบรนด์/สี/ข้อความ) — มือถือสินค้าตัวจริงจากรูป ห้ามออกแบบใหม่
- ห้าม UI กล้อง/viewfinder/ปุ่มชัตเตอร์บนภาพ · ห้ามโลโก้ · 9:16 แนวตั้ง · ข้อความบนภาพเฉพาะฉากแรกตามกฎ 📌 ด้านล่าง · เสียงพากย์ทับ ไม่มีคนพูดในเฟรม`;

  // v0.6.4: กฎคลิป (video_prompt) เฉพาะ warehouse_hands — แค่ถือโชว์ ห้ามแกะ/ใช้สินค้า + ห้ามหมุนรอบ + สินค้าคงเดิม
  const WAREHOUSE_VIDEO = `🎥 กฎคลิป (video_prompt ภาษาอังกฤษ สั้น) — โกดังเห็นแค่มือ:
- มุม POV first-person handheld (subtle natural shake, candid amateur warehouse look) · **มือถือสินค้าโชว์ค้างกลางเฟรมตลอด** ขยับ/เอียงสินค้าเบาๆ ให้เห็นชัด · กล้อง slow push-in / gentle dolly เข้าหาสินค้า
- ⚠️ **แค่ "ถือโชว์" สินค้าเฉยๆ — ห้ามแกะ/เปิด/ฉีก/ใช้/บีบ/เท/ประกอบ สินค้าเด็ดขาด** (พอ animate ให้ "ใช้/แกะสินค้า" Veo จะมั่ว สินค้าเพี้ยนหนัก) · ห้ามหมุนสินค้ารอบด้าน/360 orbit (Veo มโนด้านหลังที่ไม่มีในรูป)
- ⚠️ **สินค้าต้องคงหน้าตาเดิมเป๊ะเหมือนเฟรมแรก (รูปที่แนบ) ตลอดคลิป — ห้าม morph/เปลี่ยนสี/ฉลาก/รูปทรง** · มือต้องอยู่ในเฟรมตลอด ไม่เห็นหน้า/ลำตัวคน
- ANATOMY: realistic natural human hands only — ห้ามมือ/นิ้ว/แขน เกินหรือผิดรูป
- จบทุกฉากด้วย: realistic natural ambient warehouse background sound, NO on-screen text, NO visible person/face, hands only, the product stays identical to the first frame`;

  // v0.6.7: directive ภาพ mirror_selfie — เซลฟี่กระจกลองเสื้อ (OOTD) · ใช้แทนกฎภาพปกติ · สินค้า = เสื้อผ้าที่ใส่บนตัว (แนบรูปเสื้อเป็น ref)
  const MIRROR_IMG = `👗 กฎภาพ (เซลฟี่กระจกลองเสื้อ OOTD) — ใช้แทนกฎภาพปกติ · image_prompt ทุกฉากเป็นภาษาอังกฤษ:
- **สไตล์:** authentic mirror selfie / OOTD, shot on a smartphone — เหมือนคนถ่ายกระจกลงโซเชียลจริง (casual UGC, NOT studio, NOT professional shoot)
- **ตัวแบบ:** a person standing in front of a large full-length mirror taking a mirror selfie with a smartphone — ⚠️ **ถือมือถือไว้ข้างลำตัว/ระดับอก ไม่บังหน้า → ให้เห็นใบหน้าชัดเจนเต็มหน้า** (the phone must NOT cover or block the face; face fully visible) — **ถ้ามี character reference image แนบมา ให้ใบหน้า/ผม/รูปร่าง/เพศ เป็นคนนั้นเป๊ะทุกฉาก (หน้าตรงตามรูป ref ห้ามเพี้ยน); ถ้าไม่มี ให้เป็น a natural good-looking Thai model คนเดิมทุกฉาก**
- ⚠️ **ใส่ "สินค้าเสื้อผ้า" จากรูป ref ที่แนบเป๊ะบนตัว** — ลาย/โลโก้/สี/ตัวอักษร/ดีเทลของเสื้อต้องตรงรูป ref ทุกอย่าง (ห้ามออกแบบเสื้อใหม่) · เสื้อสวมพอดีตัว เห็นชัด
- **ฉากหลัง:** ห้องนอน/หน้าตู้เสื้อผ้าที่เปิดมีเสื้อแขวน, แสงในบ้านธรรมชาติ, บรรยากาศบ้านจริงสบายๆ (ไม่ใช่สตูดิโอ)
- แต่ละฉากมุมต่างกัน: เต็มตัวหน้าตรง, เอียงข้างโชว์ทรง, ซูมใกล้ดีเทลเนื้อผ้า/ลายเสื้อ, เงาในกระจก
- 9:16 แนวตั้ง · ห้ามโลโก้แบรนด์บนภาพ · ข้อความบนภาพเฉพาะฉากแรกตามกฎ 📌 ด้านล่าง`;

  // v0.6.7: กฎคลิป mirror_selfie — อนุญาต pose/หมุนตัวโชว์ชุดได้ (ต่างจากสินค้าถือในมือ) แต่คงลายเสื้อตรง ref
  const MIRROR_VIDEO = `🎥 กฎคลิป (video_prompt ภาษาอังกฤษ สั้น) — เซลฟี่กระจกลองเสื้อ:
- ตัวแบบ pose ธรรมชาติหน้ากระจก: หมุนตัวเบาๆ โชว์ชุด, จับ/รูดเสื้อให้เข้าที่, ถือมือถือเซลฟี่, โยกตัวเล็กน้อย — เหมือนคนถ่ายกระจกจริง
- 📷 **กล้องล็อกมุม — เหมือนมือถือที่นางแบบถือ (fixed handheld phone POV):** ขยับ/โยก/แพนตามมือผู้ถือได้เบาๆ เป็นธรรมชาติ (subtle natural handheld sway) · ⚠️ **ห้ามซูมเข้าเด็ดขาด — NO zoom-in, NO push-in, NO dolly-in, NO crash zoom** · คงระยะ/เฟรมเดิมตลอดคลิป (locked framing, camera does NOT move closer) · หมุนตัวโชว์ชุดได้ (ลายด้านหน้าเสื้อต้องตรง ref เสมอ)
- ⚠️ **ลาย/สี/ทรงเสื้อต้องคงเดิมตรงรูป ref ตลอดคลิป — ห้าม morph เสื้อเป็นแบบอื่น** · ตัวแบบไม่อ้าปากพูด (ปากปิด/ยิ้ม)
- จบทุกฉากด้วย: static locked handheld phone framing, NO zoom-in, NO push-in, camera does not move closer, realistic natural ambient room sound, NO on-screen text, the outfit design stays identical to the reference, mouth closed no lip-sync`;

  // v0.7.2: กฎข้อความบนภาพเฉพาะ minimal_cute — ข้อความลายมือน่ารักฝังในภาพ "ทุกฉาก" (ใช้แทนกฎ 📌 พาดหัวเฉพาะฉากแรก) · ref คลิปชามแมวขาช้าง
  const MINIMAL_TEXT = `📝 ข้อความบนภาพ (มินิมอลน่ารัก) — สำคัญมาก: ต้องมี "ทุกฉาก" ไม่ใช่แค่ฉากแรก:
- ทุกฉากใน image_prompt ต้องสั่งให้มีข้อความภาษาไทยสั้นๆ 1-2 จุดต่อฉาก สไตล์ลายมือน่ารักกลมมน: cute rounded handwritten Thai text overlay, soft cream/white color with subtle warm brown outline (อ่านง่าย ลอยนุ่มๆ บนภาพ)
- เนื้อข้อความ = ใจความสั้นของบทพูด (voice) ฉากนั้น แค่ 2-6 คำ เช่น "ล้างง่าย มี 4 สี" / "กินง่าย สบายคอ" / "ฐานกว้าง ล้มยาก ไม่เลื่อน" — เป็นวลีสั้น ห้ามยาวเป็นประโยคเต็ม
- ตำแหน่ง: ลอยใกล้สินค้า/ใกล้จุดที่กำลังพูดถึง ไม่บังสินค้า ไม่บังหน้าสัตว์/คน · ฉากแรกเป็นข้อความ hook วางเด่นช่วงบนของภาพ ใหญ่กว่าฉากอื่นเล็กน้อย
- ประดับ doodle ลายเส้นวาดมือเล็กๆ รอบข้อความ/สินค้าให้ดูปุ๊กปิ๊ก: tiny hand-drawn white doodles — sparkles ✦, หัวใจเล็กๆ ♡, เส้นขีดเน้น (accent dashes), ลูกศรลายมือชี้จุดเด่น — แบบสติกเกอร์มินิมอล ไม่รกภาพ
- ⚠️ ระบุข้อความไทยตรงๆ ใน image_prompt ทุกฉาก เช่น: cute handwritten Thai text overlay reading "<ข้อความไทย>" — ต้องเป็นภาษาไทยเป๊ะตามที่เขียน ห้าม romanize ห้ามแปลอังกฤษ ห้ามสะกดเพี้ยน`;

  const MOODS = {
    cinematic: 'cinematic commercial photography, dramatic professional lighting, shallow depth of field, film color grading, premium TV advertisement look',
    luxury: 'luxury premium product photography, elegant gold and black tones, soft studio lighting, high-end sophisticated aesthetic',
    minimal: 'minimal clean product photography, bright soft light, simple uncluttered background, modern aesthetic',
    energetic: 'vibrant dynamic commercial photography, bold saturated colors, energetic youthful mood, punchy lighting',
    nature: 'natural organic photography, warm golden sunlight, soft natural tones, fresh outdoor atmosphere',
  };

  // v0.6: สไตล์ฟอนต์ "ข้อความพาดหัวฉากแรก" — key ตรงกับ <option> ใน panel.html (#coverFontStyle)
  //   ค่าว่าง ('' = AI เลือกเอง) → ไม่ฝังสไตล์ ปล่อย AI ตัดสินใจเหมือนเดิม (พฤติกรรม default ไม่เปลี่ยน)
  const COVER_FONTS = {
    casual_real: 'ฟอนต์แบบคนทั่วไปแปะข้อความบนคลิปรีวิว — bold rounded sans-serif ตัวหนา อ่านง่าย สีสดใส มีขอบ/เงาบางๆ ดูเป็นกันเองเรียลๆ ไม่ทางการ ไม่หรู เหมือนคลิปรีวิวชาวบ้านบน TikTok',
    tiktok_bold: 'TikTok-style bold sans-serif typography ตัวหนาสีขาว มีขอบดำหนา (stroke/outline) + เงาบางๆ สไตล์แคปชั่นคลิปไวรัล อ่านชัดเด่น',
    handwritten: 'ลายมือ marker เรียลๆ เหมือนเขียนเอง ตัวหนา เอียงเล็กน้อย ไม่เป๊ะ อบอุ่นเป็นกันเอง เหมือนป้ายเขียนมือ',
    pop_sale: 'ป้ายลด/โปรจ๊าบๆ — ตัวหนาสีสด อยู่ในกรอบดาว/ระเบิด (starburst) เอียงนิดๆ เพิ่มพลัง สไตล์โปสเตอร์เซลล์',
    news_banner: 'แบบข่าวด่วน — ตัวพิมพ์ใหญ่หนาสีขาวบนแถบสีแดงหรือดำ ดูเร่งด่วน น่าสนใจ สไตล์ breaking news',
    cute_bubble: 'ตัวอักษรกลมป่องน่ารักสดใส โทนพาสเทล/สีลูกกวาด มีขอบขาวหนา ดูสนุกเป็นมิตร เหมาะของน่ารัก/ขนม',
    bold_premium: 'ตัวหนาหนักแน่นดูพรีเมียมมีระดับ คมชัด มีมิติเล็กน้อย สไตล์โฆษณามืออาชีพ สะอาดทันสมัย',
    elegant_serif: 'ฟอนต์ serif สง่างามหรูหรา ตัวมีหาง letter-spacing กว้าง ดูพรีเมียมแบบนิตยสารแฟชั่น',
  };

  /**
   * คิดบทโฆษณา 1 สินค้า → [{ imagePrompt(EN), voice(TH) }]
   * แนวภาพ = ฟุตเทจสินค้าเป็นพระเอก (ไม่มีคนยืนถือพูดขาย) ตามคอนเซ็ปต์ Mini
   */
  // v0.6.7: ตัดคำแบรนด์/ลิขสิทธิ์/ทัวร์นาเมนต์ ออกจากชื่อสินค้าก่อนใส่ในพ้อม
  //   Flow บล็อก prompt ที่พาดพิง IP ("this prompt might violate our policies") เช่น "เสื้อบอลโลก / World Cup / ชื่อทีม / ลิขสิทธิ์แท้"
  //   ดีไซน์จริงของสินค้ามาจากรูป ref ที่แนบอยู่แล้ว → ตัดคำพวกนี้ออกจาก "ชื่อในพ้อม" ไม่กระทบความตรงของสินค้า
  function sanitizeProductName(raw) {
    let s = String(raw || '');
    // 1) ลบทิ้ง — คำลิขสิทธิ์/ของแท้/เครื่องหมายการค้า (ไม่มีประโยชน์ต่อบริบท)
    const del = [
      /ลิขสิทธิ์แท้/gi, /สินค้าลิขสิทธิ์/gi, /ลิขสิทธิ์ถูกต้อง/gi, /ลิขสิทธิ์/gi,
      /ของแท้\s*100\s*%?/gi, /ของแท้/gi, /แท้\s*100\s*%?/gi, /แท้ๆ/gi,
      /official(?:ly)?/gi, /licens(?:ed|e)/gi, /authentic/gi, /genuine/gi,
      /limited\s*edition/gi, /special\s*edition/gi,
      /[™®©]/g,
    ];
    for (const re of del) s = s.replace(re, ' ');
    // 2) แทนที่ด้วยคำกลางๆ ปลอดภัย — ทัวร์นาเมนต์/ลีกฟุตบอล (IP) → "ฟุตบอล"
    //    ⚠️ ห้ามลบทิ้งเฉยๆ! ("เสื้อบอลโลก" ลบแล้วเหลือ "เสื้อ" → AI ไม่รู้ว่าเสื้อบอล เลยมั่วโอกาส เช่น สงกรานต์)
    const toFootball = [
      /ฟุตบอลโลก/gi, /บอลโลก/gi, /world\s*cup/gi, /worldcup/gi,
      /พรีเมียร์ลีก/gi, /premier\s*league/gi, /แชมเปี(?:ย|้ย)นส์?ลีก/gi, /champions?\s*league/gi,
      /ลาลีกา/gi, /la\s*liga/gi, /บุนเดสลีกา/gi, /bundesliga/gi, /กัลโช/gi, /serie\s*a/gi,
      /ยูฟ่า/gi, /uefa/gi, /fifa/gi, /ฟีฟ่า/gi, /ยูโร\s*20\d\d/gi,
      /ทีมชาติ/gi, /national\s*team/gi,
    ];
    for (const re of toFootball) s = s.replace(re, 'ฟุตบอล');
    s = s.replace(/โอลิมปิก/gi, 'กีฬา').replace(/olympics?/gi, 'กีฬา');
    // 3) ยุบคำซ้ำที่ติดกัน (เช่น "ฟุตบอลฟุตบอล" / "ฟุตบอล ฟุตบอล") + ช่องว่างเกิน
    s = s.replace(/(ฟุตบอล)(\s*ฟุตบอล)+/gi, 'ฟุตบอล').replace(/(กีฬา)(\s*กีฬา)+/gi, 'กีฬา');
    s = s.replace(/\s{2,}/g, ' ').replace(/^[\s\-·|,]+|[\s\-·|,]+$/g, '').trim();
    return s.length >= 2 ? s : String(raw || '').trim(); // กันชื่อหายหมด → คืนชื่อเดิม
  }

  async function generateAdScript(product, opts, apiKey) {
    const safeName = sanitizeProductName(product.name); // v0.6.7: ใช้ชื่อนี้ในพ้อมแทน product.name (กัน Flow บล็อกลิขสิทธิ์)
    const structDef = STRUCTURES[opts.structure] || STRUCTURES.problem_solution;
    const structure = structDef.desc;
    const voiceTone = structDef.tone || DEFAULT_TONE;  // v0.2: โทนตามแนว (ตลก/ใกล้ตัว/ไวรัล) ไม่งั้น default ขายแรง
    const ctaLine = structDef.cta || DEFAULT_CTA;      // v0.2: CTA ตามแนว (ทักแชท/กวนๆ) ไม่งั้น default กดตะกร้า
    const mood = MOODS[opts.mood] || MOODS.cinematic;
    const coverFontDesc = COVER_FONTS[opts.coverFont] || ''; // v0.6: สไตล์ฟอนต์พาดหัวฉากแรก ('' = AI เลือกเอง)
    const n = opts.sceneCount;

    // v0.2: ตัวละครหลัก (ถ้ามี) — บอก AI ให้ใส่คนในฉาก + อิงรูป ref (เลียนแบบ PD Auto VIP)
    const ch = opts.character; // { gender, desc } หรือ null
    const genderTH = ch ? (ch.gender === 'male' ? 'ผู้ชาย' : ch.gender === 'female' ? 'ผู้หญิง' : 'บุคคล') : '';
    const genderEN = ch ? (ch.gender === 'male' ? 'a man' : ch.gender === 'female' ? 'a woman' : 'a person') : '';
    const charDescTH = (ch && ch.desc) ? ` (${ch.desc})` : '';

    // บล็อกแนวคลิป + กฎภาพ + lock วิดีโอ — สลับตาม "มีตัวละคร" หรือ "ฟุตเทจล้วน"
    const conceptLine = ch
      ? `แนวคลิป: โฆษณามี**ตัวละครหลักเป็น${genderTH}${charDescTH}** เป็นพรีเซนเตอร์ในทุกฉาก ใช้/ถือ/สัมผัส/นำเสนอสินค้าอย่างเป็นธรรมชาติ — **ตัวละครไม่พูด** (เสียงพากย์โฆษณาวางทับทีหลัง) ดูเรียลแบบ UGC/ไลฟ์สไตล์`
      : `แนวคลิป: ฟุตเทจโฆษณาระดับโลกแบบหนังโฆษณาทีวี/ซูเปอร์โบวล์ (premium B-roll cinematography) — **ไม่มีคนพูดในคลิป** มีเสียงพากย์โฆษณาวางทับทีหลัง`;

    const imageRule = ch
      ? `🎬 กฎภาพ (image_prompt ภาษาอังกฤษ):
- **ทุกฉากต้องมี ${genderEN} (the SAME main character) ปรากฏชัด** กำลังใช้/ถือ/นำเสนอสินค้า — สินค้ายังเด่นในเฟรม
- ⚠️ บรรยายตัวละครเป็น "${genderEN}" เสมอ (อ้างถึง character reference image ที่แนบ — หน้า/ผม/รูปร่าง/เพศ ต้องเป็นคนเดิมทุกฉาก) **ห้ามเปลี่ยนคน ห้ามเปลี่ยนเพศ**
- แต่ละฉาก **มุมกล้อง+ระยะ+ท่าทาง+ฉากหลังต่างกันชัดเจน**: close-up มือใช้สินค้า, medium shot คนนำเสนอ, over-the-shoulder, lifestyle wide
- แสง/บรรยากาศตามสไตล์: ${mood} · ห้ามโลโก้บนภาพ · ข้อความบนภาพทำเฉพาะฉากแรกตามกฎ 📌 ด้านล่าง · ตัวละครห้ามอ้าปากพูด/ลิปซิงค์ (หน้านิ่งหรือยิ้มธรรมชาติ)`
      : `🎬 กฎภาพ (image_prompt ภาษาอังกฤษ) — จัดเต็มระดับโฆษณาโลก:
- สินค้าเป็นพระเอกของเฟรมเสมอ · แต่ละฉาก **มุมกล้อง+ระยะ+องค์ประกอบต่างกันชัดเจน** สลับ: extreme macro close-up (เห็นดีเทล/พื้นผิว), dramatic low-angle hero shot, top-down flat lay, dynamic 45° angle, rim-lit silhouette, product floating with motion
- ใส่ความอลังการ: dramatic lighting, volumetric light rays, particles/splash/smoke/water droplets, bokeh, reflections, premium set design
- มีคนได้แค่ส่วนประกอบ (มือสัมผัส/ใช้งาน) ห้ามยืนถือพูด · ห้ามโลโก้บนภาพ · ข้อความบนภาพทำเฉพาะฉากแรกตามกฎ 📌 ด้านล่าง · สไตล์: ${mood}`;

    let videoLockEN = ch
      ? `realistic natural ambient background sound, NO lip movement, NO lip-sync, NO on-screen text, natural lifelike motion only`
      : `realistic natural ambient background sound, NO lip movement, NO on-screen text, cinematic camera motion only`;
    // v0.7.2: minimal_cute มีข้อความน่ารักฝังในภาพทุกฉาก → ห้ามสั่ง "NO on-screen text" (Veo จะพยายามลบ/เบลอข้อความ) — เปลี่ยนเป็นล็อกข้อความเดิมให้นิ่งแทน
    const KEEP_TEXT_EN = 'the cute Thai text overlay stays exactly as in the first frame (static, unchanged, no warping or morphing), NO new text added';
    if (opts.structure === 'minimal_cute') videoLockEN = videoLockEN.replace('NO on-screen text', KEEP_TEXT_EN);

    const prompt =
`คุณคือ Copywriter + Creative Director โฆษณามือรางวัลระดับโลก (Cannes Lions) เชี่ยวชาญคลิปไวรัล TikTok ที่ทำให้คนหยุดนิ้วโป้งใน 1 วินาที
สร้างสตอรี่บอร์ดโฆษณา TikTok ${n} ฉาก (ฉากละ ~8 วินาที) สำหรับสินค้า: "${safeName}"

🎯 ก่อนคิดบท — วิเคราะห์ "${safeName}" ให้ออกก่อน: สินค้านี้คืออะไร (ประเภท/หมวด) · ใช้ทำอะไร/ตอนไหน/โอกาสไหน · จุดขาย/ปัญหาที่มันแก้ · กลุ่มลูกค้า
⚠️ **กฎเหล็ก: ทุกฉาก + ทุก HOOK + พาดหัว ต้องผูกกับสินค้าตัวนี้โดยตรง** — ห้ามยกเรื่อง/ปัญหาที่ไม่เกี่ยวกับสินค้านี้เด็ดขาด (เช่น เสื้อฟุตบอล ต้องพูดเรื่องบอล/เชียร์บอล/แฟชั่นกีฬา — ห้ามพูดเรื่องเที่ยว/งบ/ลดน้ำหนัก/เทศกาลที่ไม่เกี่ยว เช่น สงกรานต์-ปีใหม่ · น้ำพริก ต้องพูดเรื่องกิน/รสชาติ — ห้ามพูดเรื่องผิว) · ถ้าชื่อสินค้ากำกวม ให้เดาประเภทจากชื่อแล้วยึดกับสินค้าเสมอ

โครงเรื่อง: ${structure}

${conceptLine}
${ch ? `\n👤 ตัวละครในเรื่อง: ${genderTH}${charDescTH} — ให้บทพูด/มุมเล่าอ้างอิงตัวละครนี้ได้ (เช่น เล่าจากมุมของ${genderTH}) แต่เป็นเสียงพากย์ ไม่ใช่ตัวละครพูดเอง\n` : ''}
🔴 กฎเหล็กบทพูด (voice) — คิดบทขึ้นมาใหม่เองทั้งหมด ห้ามลอกแพทเทิร์น/วลีสำเร็จรูป:
- **ฉากแรก = HOOK เด็ดสุด** ต้องทำให้คนหยุดดูใน 2 วินาที (คำถามสะกิดใจ / ความจริงที่คนไม่รู้ / ปัญหาที่โดนใจ) — ห้ามเปิดแบบเรียบๆ น่าเบื่อ
- **กระชับแต่เต็มอิ่ม** 18-26 คำต่อฉาก (พูดจบใน 6-8 วินาที ให้พอดีความยาวคลิป) — ห้ามสั้นกว่า 16 คำ (เสียงสั้นไปคลิปจะโหวงเหวง) แต่ห้ามยืดเยื้อน้ำท่วมทุ่ง พูดให้แน่นมีจังหวะ
- ${voiceTone}
- ${ctaLine}
- 🈲 คำต้องห้าม: ห้ามพูดราคา/ตัวเลขเงิน (ลูกค้าส่วนลดต่างกัน) · ห้ามใช้คำว่า "ดีลเด็ด" · ห้าม over-claim (100%, ที่สุดในโลก, การันตี) · ห้าม emoji
- 💡 คำพูดทุกฉากต้องสด เป็นธรรมชาติ หลากหลาย เข้ากับสินค้าตัวนี้โดยเฉพาะ — ไม่จำเจ ไม่ใช้สำนวนตายตัว

${opts.structure === 'veggie_drama' ? VEGGIE_IMG : opts.structure === 'warehouse_hands' ? WAREHOUSE_IMG : opts.structure === 'mirror_selfie' ? MIRROR_IMG : imageRule}
${structDef.imgFeel ? '\n🏡 โทนภาพพิเศษ (override ความหรู/อลังการของกฎภาพด้านบน): ' + structDef.imgFeel + '\n' : ''}
📦 กฎอ้างถึง "สินค้า" ใน image_prompt (สำคัญมาก — ให้สินค้าตรงรูป ref ที่แนบ ไม่เพี้ยน):
- อ้างถึงสินค้าด้วย "ชื่อ + ตามรูปที่แนบ" เช่น: the exact "${safeName}" product, identical to the attached product reference image
- ⚠️ **ห้ามบรรยายรูปลักษณ์สินค้าเอง** — ห้ามระบุ สี/แพ็กเกจ/ฉลาก/รูปทรง/โลโก้/ข้อความบนบรรจุภัณฑ์ของสินค้า (ปล่อยให้ "รูป ref ที่แนบ" เป็นตัวกำหนดหน้าตาสินค้า) · บรรยายได้แค่ ฉาก/มุมกล้อง/แสง/มือ-ท่าทาง/บรรยากาศรอบๆ สินค้า
- คิด image_prompt แบบ "สร้างภาพโฆษณาสินค้า ${safeName} ตามรูปที่แนบ วางใน[ฉาก/มุม]..." ไม่ใช่ไปวาด "กระปุก/ขวด/กล่องสี... ฉลาก..." เอง
- 🛡️ **ห้ามใส่ชื่อแบรนด์/ชื่อทีม/ชื่อทัวร์นาเมนต์/ชื่อคนดัง/โลโก้/คำลิขสิทธิ์** ลงใน image_prompt, video_prompt และข้อความพาดหัวเด็ดขาด (เช่น ห้ามเขียน "World Cup", "บอลโลก", ชื่อทีม, ชื่อยี่ห้อ, ชื่อดารา) — บรรยายแบบทั่วไปแทน (เช่น "เสื้อฟุตบอลสีแดง", "a red football jersey") ปล่อยให้ดีไซน์จริงมาจากรูป ref ที่แนบ ⚠️ Flow จะบล็อกพ้อมที่มีคำลิขสิทธิ์/IP
${opts.structure === 'minimal_cute' ? MINIMAL_TEXT : `📌 ข้อความพาดหัวบนภาพ — เฉพาะ "ฉากแรก (ฉากที่ 1)" เท่านั้น:
- ฉาก 1: ใน image_prompt ต้องสั่งให้มี "ข้อความพาดหัวภาษาไทยตัวใหญ่ หนา เด่นชัด" วางบนภาพ = ประโยค HOOK สั้นๆ สะดุดตา (สอดคล้องกับบทพูด hook ฉากแรก) วางตำแหน่งอ่านง่าย ไม่บังสินค้า/ตัวละคร
- ⚠️ **พาดหัวต้อง "เจาะจงกับสินค้าตัวนี้โดยเฉพาะ" — ห้ามเป็นประโยคกลางๆ ที่ใช้กับสินค้าอะไรก็ได้** ("เสื้อตัวโปรดหายากไหม", "ของดีต้องมี", "คุ้มสุดๆ" = ใช้ไม่ได้ กว้างไป) · ให้ดึง **ประเภทสินค้า + โอกาส/บริบท/เทศกาล/ปัญหาที่ตรงกับสินค้านั้น** มาเล่น เช่น:
  · เสื้อบอล → "มีเสื้อใส่เชียร์บอลยัง?" / "เชียร์บอลทั้งที ขาดเสื้อไม่ได้" (⚠️ ห้ามใส่ชื่อทัวร์นาเมนต์/ทีมจริง เช่น บอลโลก/ชื่อทีม)
  · ครีมกันแดด → "ผิวไหม้แดดทุกหน้าร้อนใช่ไหม?"
  · น้ำพริก → "ข้าวเปล่าจืดๆ กินไม่ลง?"
  · เคสมือถือ → "ทำมือถือตกจนจอแตกกี่รอบแล้ว?"
- ⚠️ ระบุข้อความไทยตรงๆ ใน image_prompt เช่น: big bold Thai headline text overlay reading "<ข้อความพาดหัวไทย>" — ต้องเป็นภาษาไทยตามที่เขียนเป๊ะ ห้าม romanize ห้ามแปลอังกฤษ ห้ามสะกดเพี้ยน${coverFontDesc ? '\n- 🎨 สไตล์ฟอนต์พาดหัว (บังคับใช้กับข้อความฉากแรก): ' + coverFontDesc : ''}
- ฉาก 2 เป็นต้นไป: ห้ามมีข้อความ/ตัวอักษรบนภาพเด็ดขาด (no text overlay)`}

${opts.structure === 'warehouse_hands' ? WAREHOUSE_VIDEO : opts.structure === 'mirror_selfie' ? MIRROR_VIDEO : `🎥 กฎคลิป (video_prompt ภาษาอังกฤษ สั้น) — กล้องเคลื่อนแบบมือโปร:
- ระบุการเคลื่อนกล้องเทพๆ สลับจังหวะเร็ว/ช้าในแต่ละฉาก: fast push-in (เร้าใจ), slow cinematic dolly, crash zoom, dramatic crane up, snappy speed-ramp (⚠️ ห้าม 360 orbit / ห้ามวนรอบสินค้า)
- + การเคลื่อนไหวในฉาก: ${ch ? 'ตัวละครถือ/โชว์สินค้าเป็นธรรมชาติ (ไม่หมุน ไม่แกะ)' : 'liquid pouring, steam/smoke rising, fabric flowing, light sweeping (สินค้านิ่ง ไม่หมุน)'}
- จบด้วย: "${videoLockEN}" (บังคับทุกฉาก)`}
${structDef.vidFeel ? '\n🎥 โทนกล้องพิเศษ (สำคัญ: ใช้ override การเคลื่อนกล้องเร้าใจของกฎคลิปด้านบน): ' + structDef.vidFeel + '\n' : ''}
📦 สินค้าในแต่ละฉาก (show_product: true/false):
- ระบุ show_product เป็น true เฉพาะฉากที่ "สินค้าปรากฏในภาพ" (โชว์/ถือ/ใช้/วางในเฟรม)
- ฉากเปิดปัญหา/hook/บรรยากาศที่ยังไม่ถึงสินค้า = false (ปล่อยให้เป็นฉากธรรมชาติ ไม่ต้องยัดสินค้าทุกฉาก ให้คลิปดูเนียนเหมือนโฆษณาจริง)
- ⚠️ ถ้า show_product=false: image_prompt ห้ามพูดถึง/บรรยายสินค้าในฉากนั้น · ถ้า true: ให้สินค้าเด่นชัดในเฟรม
- อย่างน้อยฉากท้ายๆ (ตอนปิดการขาย) ควรเป็น true

ตอบเป็น JSON เท่านั้น:
{"scenes":[{"image_prompt":"...","video_prompt":"...","voice":"...","show_product":true}]}`;

    // v0.7.5: AI ตอบ JSON เพี้ยนเป็นครั้งคราว (ลืม comma ระหว่างฉาก / โดนตัดกลางคัน) — เคสลูกค้าจริง
    //   "Expected ',' or ']' after array element" → เดิม parse ตรงๆ พังทั้งสินค้า · ตอนนี้ซ่อม 3 ชั้น + ขอบทใหม่อีก 1 รอบก่อนยอมเฟล
    let parsed = null;
    for (let att = 1; att <= 2 && !parsed; att++) {
      const raw = await callText(prompt, apiKey);
      parsed = parseScenesLoose(raw);
      if (!parsed && att === 1) { try { console.warn('[ai] บทรอบแรก JSON เพี้ยน — ขอบทใหม่'); } catch (_) {} }
    }
    if (!parsed || !(parsed.scenes || []).length) throw new Error('AI ตอบไม่เป็น JSON — ลองใหม่');
    // v0.2: lock ห้ามพูด — มีตัวละคร: คนขยับใช้สินค้าได้แต่ไม่พูด · ไม่มีตัวละคร: ฟุตเทจล้วน
    // v0.6.6: ล็อกสินค้า — ห้ามหมุน/ห้ามแกะ (กัน Veo มโนด้านที่ไม่มีในรูป → สินค้าเพี้ยน) · ต่อท้ายทุก video_prompt
    const PRODUCT_LOCK_VID = ' The product must stay identical to the reference image — do NOT rotate, spin or turn the product, do NOT open, unwrap, peel or disassemble the product, keep the product front (the exact side shown in the reference) facing the camera at all times.';
    // v0.6.7: mirror_selfie = ลองเสื้อ ต้องหมุนตัวโชว์ชุดได้ → ไม่ใส่ล็อกห้ามหมุนสินค้า (MIRROR_VIDEO คุมลายเสื้อคงเดิมเองแล้ว)
    let NO_SPEECH = (ch
      ? ' realistic natural ambient background sound, NO lip movement, NO lip-sync, NO on-screen text, natural lifelike motion only.'
      : ' realistic natural ambient background sound, NO lip movement, NO on-screen text, ambient cinematic motion only.') + (opts.structure === 'mirror_selfie' ? '' : PRODUCT_LOCK_VID);
    // v0.7.2: minimal_cute — ข้อความฝังทุกฉาก ต้องคงไว้ ไม่ใช่ห้าม (ใช้ล็อกเดียวกับ videoLockEN)
    if (opts.structure === 'minimal_cute') NO_SPEECH = NO_SPEECH.replace('NO on-screen text', KEEP_TEXT_EN);
    // ✍️ Handwritten Overlay — พรอมต์เสริม (ติ๊กเปิด) ต่อท้ายทุกพรอมต์วิดีโอ
    const OVERLAY_SUFFIX = opts.handwrittenOverlay ? ('\n\n' + `UNIVERSAL OVERLAY STYLE (graphics only — no text)

Enhance the video with premium hand-drawn white overlay graphics while preserving the original storyboard, product, camera, lighting, environment, narration, and scene timing.

At appropriate moments, briefly create thin hand-drawn white outline strokes that accurately trace the product's silhouette or important visible features, following the product naturally before fading away.

Occasionally add minimal hand-drawn accents such as arrows, circles, underlines, sparkles, stars, check marks, and simple scribbles to emphasize key product features or actions.

Keep all graphics subtle, clean, modern, playful, and premium. Use only one main highlight at a time, never cover the product, and avoid clutter.

⛔ Do NOT generate, write, or render ANY text, words, letters, Thai characters, captions, or subtitles of any kind — hand-drawn graphics and accents ONLY. Do not create subtitle bars, TV captions, karaoke subtitles, stickers, or speech bubbles.`) : '';
    const scenes = (parsed.scenes || []).slice(0, n).map((s) => ({
      imagePrompt: String(s.image_prompt || '').trim(),
      // กันเหนียว: ต่อท้าย lock ห้ามพูด/ห้าม text เสมอ แม้ AI ลืมใส่
      videoPrompt: (String(s.video_prompt || '').trim() + NO_SPEECH + OVERLAY_SUFFIX).trim(),
      voice: String(s.voice || '').trim().replace(/[\p{Extended_Pictographic}]/gu, ''),
      // v0.2: ฉากนี้โชว์สินค้าไหม (default true ถ้า AI ไม่ระบุ — กันแนบ ref ตกหล่น)
      showProduct: s.show_product !== false,
    })).filter((s) => s.imagePrompt && s.voice);
    if (scenes.length === 0) throw new Error('AI ไม่ให้ฉากที่ใช้ได้ — ลองใหม่');
    return scenes;
  }

  window.PDMiniAI = { callText, generateAdScript, generateHashtags, generateBasketName };
})();
