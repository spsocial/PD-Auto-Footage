// tiktok-injected.js - ทำงานใน page context (ไม่ใช่ content script context)
// v19.0: ไม่กดปุ่ม # toolbar อีกต่อไป! พิมพ์ #hashtag ตรงๆ → dropdown ขึ้นเอง → คลิกเลือก
//        แก้ root cause ของ "Something went wrong" (React crash จากการกดปุ่ม # หลังลบข้อความ)
//
// ⚠️ ไฟล์นี้ต้อง inject ผ่าน script.src (CSP block inline scripts)

(function() {
  'use strict';

  console.log('[TikTok Injected] Script loaded in page context v19.0');

  if (window.__tiktokInjectedV18) {
    console.log('[TikTok Injected] Already loaded, skipping');
    return;
  }
  window.__tiktokInjectedV18 = true;

  // รับ message จาก content script
  window.addEventListener('message', async function(event) {
    if (event.source !== window) return;
    if (!event.data || event.data.type !== 'TIKTOK_TYPE_HASHTAG') return;

    const hashtag = event.data.hashtag;
    console.log('[TikTok Injected] v19: Received hashtag:', hashtag);

    try {
      const result = await typeHashtagInPageContext(hashtag);
      window.postMessage({
        type: 'TIKTOK_HASHTAG_RESULT',
        hashtag: hashtag,
        success: result.success,
        verified: result.verified
      }, '*');
    } catch (error) {
      console.error('[TikTok Injected] v19: Error:', error);
      window.postMessage({
        type: 'TIKTOK_HASHTAG_RESULT',
        hashtag: hashtag,
        success: false,
        verified: false,
        error: error.message
      }, '*');
    }
  });

  // Helper: full mouse click ด้วย real coordinates (สำหรับ dropdown item)
  async function fullMouseClick(element, delayMs = 50) {
    const d = ms => new Promise(r => setTimeout(r, ms));
    const rect = element.getBoundingClientRect();
    const opts = {
      bubbles: true, cancelable: true, view: window,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2
    };
    element.dispatchEvent(new MouseEvent('mousedown', opts));
    await d(delayMs);
    element.dispatchEvent(new MouseEvent('mouseup', opts));
    await d(delayMs);
    element.dispatchEvent(new MouseEvent('click', opts));
  }

  // Helper: หา dropdown item — v19: match ด้วย .hash-tag-topic text (ไม่ไว้ใจ .focused)
  function findDropdownItem(hashtagName) {
    // 1: หาจาก .hash-tag-topic ที่ text ตรงกับชื่อ hashtag (แม่นที่สุด)
    const allItems = document.querySelectorAll('.hashtag-suggestion-item[role="option"]');
    for (const item of allItems) {
      const topicEl = item.querySelector('.hash-tag-topic');
      if (topicEl) {
        const text = topicEl.textContent.trim().replace(/^#/, '');
        if (text.toLowerCase() === hashtagName.toLowerCase()) {
          console.log('[TikTok Injected] v19: Found exact match:', text);
          return item;
        }
      }
    }

    // 2: first hashtag-suggestion-item (fallback — เอาตัวแรกที่ขึ้น)
    const firstItem = document.querySelector('.hashtag-suggestion-item[role="option"]');
    if (firstItem) {
      console.log('[TikTok Injected] v19: Using first suggestion item');
      return firstItem;
    }

    // 3: ใน mention-list-popover container
    const container = document.querySelector('[class*="mention-list-popover"]') ||
                      document.querySelector('[class*="mentionListPopover"]');
    if (container) {
      const item = container.querySelector('[role="option"]');
      if (item) { console.log('[TikTok Injected] v19: Found via mention-list container'); return item; }
    }

    // 4: role="listbox" > role="option"
    const listboxes = document.querySelectorAll('[role="listbox"]');
    for (const lb of listboxes) {
      const opt = lb.querySelector('[role="option"]');
      if (opt) { console.log('[TikTok Injected] v19: Found via listbox>option'); return opt; }
    }

    return null;
  }

  /**
   * v19.0: ใส่ hashtag ทีละตัว — ไม่กดปุ่ม # toolbar อีกต่อไป!
   *
   * Flow ใหม่: Focus → cursor-to-end → พิมพ์ #ชื่อ ตรงๆ ด้วย execCommand
   *            → รอ dropdown ขึ้นเอง → คลิกเลือก → verified!
   *
   * กฎทอง:
   * 1. ห้ามกดปุ่ม Hashtag toolbar เด็ดขาด (ทำ React crash)
   * 2. ห้ามใช้ innerHTML/textContent กับ editor
   * 3. พิมพ์ผ่าน execCommand เท่านั้น
   * 4. match dropdown ด้วย .hash-tag-topic text (ไม่ไว้ใจ .focused)
   * 5. verify ด้วย [data-testid="mentionText"] หรือ span.mention
   */
  async function typeHashtagInPageContext(hashtag) {
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    const hashtagName = hashtag.startsWith('#') ? hashtag.substring(1) : hashtag;

    console.log('[TikTok Injected] v19: Processing hashtag:', hashtagName);

    // หา DraftJS editor
    const input = document.querySelector('div.public-DraftEditor-content[role="combobox"]') ||
                  document.querySelector('div.public-DraftEditor-content') ||
                  document.querySelector('[contenteditable="true"]');
    if (!input) {
      console.error('[TikTok Injected] v19: Editor not found!');
      return { success: false, verified: false };
    }

    const mentionCountBefore = input.querySelectorAll('span.mention, [data-testid="mentionText"]').length;
    console.log('[TikTok Injected] v19: Mentions before:', mentionCountBefore);

    // ============================================================
    // Step 1: Focus แบบ v18 (ไม่ใช้ MouseEvent mousedown — ทำ React crash!)
    // ============================================================
    input.focus();
    input.click();
    await delay(300);

    try {
      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        range.selectNodeContents(input);
        range.collapse(false); // collapse to end
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } catch (e) {
      console.warn('[TikTok Injected] v19: Could not move cursor to end:', e.message);
    }
    await delay(150);

    // ============================================================
    // Step 2: พิมพ์ #ชื่อ ด้วย ClipboardEvent paste (ไม่ใช้ execCommand — ทำ DraftJS crash!)
    // ============================================================
    // v19.2: ใช้ ClipboardEvent paste เหมือนกับการใส่แคปชั่น — DraftJS handle ผ่าน pipeline ปกติ
    const textToInsert = '#' + hashtagName;
    const dt = new DataTransfer();
    dt.setData('text/plain', textToInsert);
    const pasteEvent = new ClipboardEvent('paste', {
      clipboardData: dt,
      bubbles: true,
      cancelable: true
    });
    input.dispatchEvent(pasteEvent);
    await delay(500); // รอ DraftJS process + network fetch dropdown
    console.log('[TikTok Injected] v19: Pasted directly: #' + hashtagName);

    // ============================================================
    // Step 3: รอ dropdown ขึ้น (8 × 400ms = 3.2s)
    // ============================================================
    console.log('[TikTok Injected] v19: Waiting for dropdown...');
    let dropdownItem = null;
    for (let attempt = 1; attempt <= 8; attempt++) {
      await delay(400);
      dropdownItem = findDropdownItem(hashtagName);
      if (dropdownItem) {
        console.log(`[TikTok Injected] v19: Dropdown found on attempt ${attempt}/8`);
        break;
      }
      if (attempt <= 4) {
        console.log(`[TikTok Injected] v19: Poll ${attempt}/8 - not yet`);
      }
    }

    if (!dropdownItem) {
      console.warn('[TikTok Injected] v19: No dropdown found — hashtag will be unverified text');
    }

    // ============================================================
    // Step 4: คลิก dropdown item (full mouse events) + retry
    // ============================================================
    if (dropdownItem) {
      // รอเพิ่มเพื่อให้ dropdown stable
      await delay(200);

      console.log('[TikTok Injected] v19: Clicking dropdown item...');
      await fullMouseClick(dropdownItem);
      await delay(600);

      let mentionCountMid = input.querySelectorAll('span.mention, [data-testid="mentionText"]').length;

      if (mentionCountMid <= mentionCountBefore) {
        // Retry: ลอง Enter
        console.log('[TikTok Injected] v19: Click failed, trying Enter...');
        input.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
          bubbles: true, cancelable: true
        }));
        await delay(500);

        mentionCountMid = input.querySelectorAll('span.mention, [data-testid="mentionText"]').length;
        if (mentionCountMid <= mentionCountBefore) {
          // Retry: re-query + click
          console.log('[TikTok Injected] v19: Enter failed, re-query + click...');
          const freshItem = findDropdownItem(hashtagName);
          if (freshItem) {
            await fullMouseClick(freshItem);
            await delay(600);
          }
        }
      }
    } else {
      // ไม่เจอ dropdown → กด Space เพื่อปิด search mode + ปล่อยเป็นข้อความธรรมดา
      document.execCommand('insertText', false, ' ');
      await delay(200);
    }

    // ============================================================
    // Step 5: Verify — เช็คว่ามี mention เพิ่มขึ้นจริง
    // ============================================================
    await delay(300);

    const mentionCountAfter = input.querySelectorAll('span.mention, [data-testid="mentionText"]').length;
    const verified = mentionCountAfter > mentionCountBefore;

    console.log('[TikTok Injected] v19: Mentions after:', mentionCountAfter, '| Verified:', verified);

    // Space หลัง verified hashtag (TikTok อาจ auto-add แล้ว แต่เผื่อไว้)
    if (verified) {
      // เช็คว่ามี space ต่อท้ายหรือยัง
      const editorText = input.textContent || '';
      if (!editorText.endsWith(' ')) {
        document.execCommand('insertText', false, ' ');
      }
    }

    await delay(200);

    return { success: true, verified: verified };
  }

  // แจ้งว่า script พร้อม
  window.postMessage({ type: 'TIKTOK_INJECTED_READY' }, '*');
  console.log('[TikTok Injected] Ready v19.0');

})();
