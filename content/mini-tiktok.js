// =====================================================================
// PD Auto Flow Mini — TikTok Studio content script
// v0.2: ดึงสินค้า Showcase ผ่าน API ตรง (port จาก PD Auto VIP v13/v3.7)
//
// ทำงานบนหน้า tiktok.com/tiktokstudio/* (inject โดย panel ผ่าน chrome.scripting)
// ผลลัพธ์เซฟลง chrome.storage.local key 'pdMiniShowcase' (เลี่ยง message ก้อนใหญ่)
// =====================================================================
(function () {
  'use strict';
  if (window.__pdMiniTiktokInstalled__) return; // กัน inject ซ้ำ
  window.__pdMiniTiktokInstalled__ = true;

  const TAG = '[PD Mini]';

  // ── ดึงสินค้า Showcase ผ่าน API (เร็ว เสถียร ไม่ต้องเปิด UI) ──
  async function fetchShowcaseViaAPI(limit = 0) {
    const all = [];
    let offset = 0;
    const count = limit > 0 ? Math.min(limit, 100) : 100;
    let hasMore = true;

    // เลือก URL รูปใหญ่สุด + อัพเป็น HD 1620
    const getBestUrl = (urlObj) => {
      const urls = (urlObj && urlObj.url_list) || [];
      const base = urls[urls.length - 1] || urls[0] || (urlObj && urlObj.thumb_url_list && urlObj.thumb_url_list[0]) || '';
      if (!base) return '';
      return base
        .replace(/resize-jpeg:\d+:\d+/, 'resize-jpeg:1620:1620')
        .replace(/resize:\d+:\d+/, 'resize:1620:1620');
    };

    while (hasMore) {
      if (limit > 0 && all.length >= limit) break;
      const url = `https://shop.tiktok.com/api/v1/streamer_desktop/showcase_product/list?offset=${offset}&count=${count}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error(`API HTTP ${res.status} — ลองล็อกอิน TikTok ใหม่`);
      const data = await res.json();
      if (data.code !== 0) throw new Error(data.message || `API error ${data.code}`);

      const products = (data.data && data.data.products) || [];
      if (products.length === 0) break;

      for (const p of products) {
        all.push({
          productId: p.product_id || '',
          productName: p.title || '',
          basketName: (p.title || '').substring(0, 30),
          imageUrl: getBestUrl(p.cover),
          allImageUrls: (p.images || []).map(getBestUrl).filter(Boolean),
          price: p.format_available_price || '',
          stock: String(p.stock_num ?? 0),
          commission: (p.affiliate_info && p.affiliate_info.est_commission_expense) || '',
        });
      }
      if (products.length < count) hasMore = false;
      else offset += count;
    }

    if (limit > 0 && all.length > limit) all.length = limit;
    console.log(`${TAG} fetched ${all.length} products`);
    return all;
  }

  // ── Message handler ──
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'miniPing') {
      sendResponse({ ok: true });
      return true;
    }
    if (message.action === 'miniFetchShowcase') {
      (async () => {
        try {
          const products = await fetchShowcaseViaAPI(message.limit || 0);
          // เซฟลง storage — panel อ่านต่อเอง (เลี่ยงส่ง payload ใหญ่ผ่าน message)
          await chrome.storage.local.set({ pdMiniShowcase: { ts: Date.now(), products } });
          sendResponse({ success: true, count: products.length });
        } catch (e) {
          console.error(`${TAG} fetch error:`, e);
          sendResponse({ success: false, error: e.message });
        }
      })();
      return true; // async
    }
  });

  console.log(`${TAG} tiktok content script ready`);
})();
