// =====================================================================
// PD Auto Flow Mini — หน้าเลือกสินค้าเต็มจอ
// อ่านรายการจาก chrome.storage 'pdMiniShowcase' (panel ดึงไว้แล้ว)
// ยืนยัน → เขียน 'pdMiniPickResult' {ts, ids} → panel ฟัง onChanged รับต่อ
// =====================================================================
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const MAX = 50;
  let items = [];
  const selected = new Set();
  const imagePicks = {}; // productId → url ของรูปหลักที่ user เลือก

  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ดึงตัวเลขจาก string ราคา/ค่าคอม ("฿1,290", "10%", "100-200" เอาเลขแรก) — ไม่มีค่า = -1
  function parseNum(v) {
    const m = String(v == null ? '' : v).replace(/,/g, '').match(/\d+(\.\d+)?/);
    return m ? parseFloat(m[0]) : -1;
  }
  function cmpNum(a, b, desc) {
    const x = parseNum(a), y = parseNum(b);
    if (x < 0 && y < 0) return 0;
    if (x < 0) return 1; if (y < 0) return -1; // ไม่มีค่า → ท้ายสุดเสมอ
    return desc ? y - x : x - y;
  }

  function visible() {
    const q = $('searchInput').value.trim().toLowerCase();
    let list = q ? items.filter((p) => (p.productName || '').toLowerCase().includes(q)) : items.slice();
    const sort = $('sortSelect') ? $('sortSelect').value : 'default';
    if (sort === 'comm_desc') list.sort((a, b) => cmpNum(a.commission, b.commission, true));
    else if (sort === 'comm_asc') list.sort((a, b) => cmpNum(a.commission, b.commission, false));
    else if (sort === 'price_desc') list.sort((a, b) => cmpNum(a.price, b.price, true));
    else if (sort === 'price_asc') list.sort((a, b) => cmpNum(a.price, b.price, false));
    return list;
  }

  function render() {
    const grid = $('grid');
    const list = visible();
    $('countPill').textContent = list.length + ' / ' + items.length + ' รายการ';
    if (!items.length) {
      grid.innerHTML = '<div class="empty">📭 ไม่พบข้อมูลสินค้า<br><span style="font-size:12px;">กลับไปที่แผงบอท → กด "🔄 ดึงจากตะกร้า TikTok" ก่อน</span></div>';
      return;
    }
    if (!list.length) {
      grid.innerHTML = '<div class="empty">🔍 ไม่พบสินค้าที่ค้นหา</div>';
      return;
    }
    grid.innerHTML = list.map((p) => {
      const sel = selected.has(p.productId);
      const mainImg = imagePicks[p.productId] || p.imageUrl;
      const imgCount = (p.allImageUrls && p.allImageUrls.length) || 0;
      return (
        '<div class="card' + (sel ? ' selected' : '') + '" data-id="' + esc(p.productId) + '">' +
          '<div class="imgwrap"><img src="' + esc(mainImg) + '" loading="lazy" alt=""><div class="tick">✓</div>' +
            (imgCount > 1 ? '<button class="img-btn" data-pick="' + esc(p.productId) + '">🔍 ดูรูป ' + imgCount + '</button>' : '') +
          '</div>' +
          '<div class="meta">' +
            '<div class="name">' + esc(p.productName || '(ไม่มีชื่อ)') + '</div>' +
            '<div class="chips">' +
              (p.price ? '<span class="chip price">' + esc(p.price) + '</span>' : '') +
              (p.commission ? '<span class="chip">💰 ' + esc(p.commission) + '</span>' : '') +
              (p.stock ? '<span class="chip">📦 ' + esc(p.stock) + '</span>' : '') +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    grid.querySelectorAll('.card').forEach((card) => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('[data-pick]')) return; // กดปุ่มดูรูป ไม่ใช่ติ๊กเลือก
        const id = card.dataset.id;
        if (selected.has(id)) selected.delete(id);
        else if (selected.size < MAX) selected.add(id);
        else { toast('⚠️ เลือกได้สูงสุด ' + MAX + ' สินค้า'); return; }
        card.classList.toggle('selected', selected.has(id));
        updateBar();
      });
    });
    grid.querySelectorAll('[data-pick]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const p = items.find((x) => x.productId === btn.dataset.pick);
        if (p) openImagePicker(p);
      });
    });
  }

  // ── เลือกรูปหลักของสินค้า (จาก allImageUrls) ──
  function openImagePicker(p) {
    document.getElementById('imgPickerOv')?.remove();
    const imgs = (p.allImageUrls && p.allImageUrls.length) ? p.allImageUrls : [p.imageUrl];
    const cur = imagePicks[p.productId] || p.imageUrl;
    const ov = document.createElement('div');
    ov.id = 'imgPickerOv';
    ov.className = 'imgpick-overlay';
    ov.innerHTML =
      '<div class="imgpick-card">' +
        '<div class="imgpick-head">🖼️ เลือกรูปหลัก — ' + esc((p.productName || '').slice(0, 40)) +
          '<button class="ctl" data-close="1">✕</button></div>' +
        '<div class="imgpick-grid">' +
          imgs.map((u) => '<img src="' + esc(u) + '" class="' + (u === cur ? 'sel' : '') + '" data-url="' + esc(u) + '">').join('') +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', (e) => {
      if (e.target === ov || e.target.dataset.close) { ov.remove(); return; }
      const url = e.target.dataset && e.target.dataset.url;
      if (url) {
        imagePicks[p.productId] = url;
        selected.add(p.productId); // เลือกรูป = ตั้งใจใช้สินค้านี้ → ติ๊กให้เลย
        ov.remove();
        render(); updateBar();
        toast('✅ ตั้งรูปหลักแล้ว');
      }
    });
  }

  function updateBar() {
    $('selCount').textContent = selected.size;
    $('applyBtn').disabled = selected.size === 0;
  }

  function closeSelf() {
    try {
      chrome.tabs.getCurrent((tab) => {
        if (tab && tab.id) chrome.tabs.remove(tab.id);
        else window.close();
      });
    } catch (e) { window.close(); }
  }

  async function apply() {
    if (!selected.size) return;
    await chrome.storage.local.set({
      pdMiniPickResult: { ts: Date.now(), ids: Array.from(selected), imagePicks: imagePicks },
    });
    $('applyBtn').textContent = '✅ ส่งให้บอทแล้ว';
    $('applyBtn').disabled = true;
    toast('✅ ส่ง ' + selected.size + ' สินค้าให้แผงบอทแล้ว');
    setTimeout(closeSelf, 900);
  }

  // ── init ──
  chrome.storage.local.get(['pdMiniShowcase'], (r) => {
    items = (r.pdMiniShowcase && r.pdMiniShowcase.products) || [];
    render();
    updateBar();
  });

  $('searchInput').addEventListener('input', render);
  if ($('sortSelect')) $('sortSelect').addEventListener('change', render);
  $('selectAllBtn').addEventListener('click', () => {
    selected.clear();
    visible().slice(0, MAX).forEach((p) => selected.add(p.productId));
    render(); updateBar();
  });
  $('clearBtn').addEventListener('click', () => { selected.clear(); render(); updateBar(); });
  $('closeBtn').addEventListener('click', closeSelf);
  $('cancelBtn').addEventListener('click', closeSelf);
  $('applyBtn').addEventListener('click', apply);
})();
