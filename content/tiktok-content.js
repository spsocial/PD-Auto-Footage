// ============================================
// TikTok Studio Content Script
// PD Auto VIP v1.0
// ============================================

console.log('[TikTok] Content script loaded v9.4');

// === i18n: TikTok Content Script Translation ===
// v4.2.2: ใช้ var แทน let/const ทุกตัวที่ top-level — กัน SyntaxError ตอน Chrome inject ซ้ำ
var _tiktokLang = 'th';
var _tiktokI18n = {"PD Auto VIP กำลังทำงาน":"PD Auto VIP is working","กรุณาอย่ากดเล่นที่หน้าจอ":"Please do not interact with the screen","รอวิดีโออัพโหลด...":"Waiting for video upload...","กำลังโหลดวิดีโอ...":"Loading video...","รอสักครู่":"Please wait","ไม่พบช่องอัพโหลดวิดีโอ":"Upload field not found","อัพโหลดวิดีโอ...":"Uploading video...","กำลังประมวลผล":"Processing","ไม่สามารถอัพโหลดวิดีโอได้":"Cannot upload video","กำลังเตรียมระบบแฮชแท็ก...":"Preparing hashtags...","กำลังใส่แฮชแท็ก...":"Inserting hashtags...","ใส่แฮชแท็กเสร็จ":"Hashtags done","กำลังใส่แคปชั่น...":"Inserting caption...","กำลังเพิ่มสินค้า...":"Adding product...","กำลังค้นหาสินค้า...":"Searching product...","กำลังตรวจสอบสินค้า...":"Verifying product...","ไม่พบสินค้า!":"Product not found!","พบสินค้า!":"Product found!","กำลังกด Next...":"Clicking Next...","กำลังกรอกชื่อสินค้า...":"Entering product name...","กำลังกด Add...":"Clicking Add...","ยืนยันเพิ่มสินค้า":"Confirming addition","กำลังตั้งเวลาโพส...":"Setting schedule...","กำลังเลือกวันที่...":"Selecting date...","กำลังตั้งเวลา...":"Setting time...","กำลังดึงข้อมูลสินค้า...":"Fetching products...","เริ่มต้น...":"Starting...","กำลังดึงหน้า":"Fetching page","พบสินค้า":"Found products","รายการ":"items","กำลังแปลงรูปภาพ...":"Converting images...","แปลงรูป":"Converting image","กรุณาลากไฟล์วิดีโอมาวาง หรือกด Select videos":"Please drag video file or click Select videos","ตัว":"tags","เลือกประเภท Link...":"Selecting Link type...","กำลังเข้าหน้าสินค้า...":"Going to product page...","กด Next":"Clicking Next","เลือก Showcase products...":"Selecting Showcase products...","กด Tab":"Clicking Tab","ไม่พบในระบบ":"not found in system","สินค้าไม่ตรง!":"Product mismatch!","ต้องการ:":"Expected:","พบ:":"Found:","ไม่พบสินค้าที่ตรงกัน!":"No matching product found!","กำลังเลือก:":"Selecting:","ไปขั้นตอนถัดไป":"Going to next step","ข้าม":"Skip","เลือก Schedule":"Selecting Schedule","ไม่พบช่องเวลา":"Time field not found","ใช้เวลาอัตโนมัติแทน":"Using auto time instead","กำลังเปิด Disclose...":"Opening Disclose...","กำลังติ๊ก AI-generated...":"Checking AI-generated...","สำคัญมาก!":"Very important!","พบ Dialog ยืนยัน...":"Found confirm dialog...","กำลังกด Post now":"Clicking Post now","พบ Video Recovery...":"Found Video Recovery...","กำลังกด Continue":"Clicking Continue","กำลัง Recovery...":"Recovering...","รีโหลดหน้าเว็บ":"Reloading page","กำลังกู้คืน video...":"Recovering video...","รอ banner ขึ้น...":"Waiting for banner...","รอวีดีโอโหลด...":"Waiting for video...","รอเพิ่มอีก 3 วินาที...":"Waiting 3 more seconds...","กด Schedule ใหม่...":"Clicking Schedule again...","โพสตั้งเวลาแล้ว!":"Scheduled successfully!","Recovery ล้มเหลว":"Recovery failed","กำลังบันทึกฉบับร่าง...":"Saving draft...","เกือบเสร็จแล้ว!":"Almost done!","รอ TikTok ประมวลผล":"Waiting for TikTok processing","TikTok Draft เต็ม!":"TikTok Draft full!","ไม่สามารถบันทึกดราฟได้เกิน 30 โพส":"Cannot save more than 30 drafts","กำลังกด Schedule...":"Clicking Schedule...","TikTok Schedule เต็ม!":"TikTok Schedule full!","ไม่สามารถตั้งเวลาได้เกิน 30 โพส":"Cannot schedule more than 30 posts","พบ Error!":"Error found!","กำลังทำ Recovery...":"Running Recovery...","กำลังโพส...":"Posting...","โพสทันที":"Post now","เริ่มโพส TikTok...":"Starting TikTok post...","Recovery สำเร็จ!":"Recovery successful!","วิดีโออัพโหลดแล้ว":"Video uploaded","ดำเนินการต่อ...":"Continuing...","กำลังอัพโหลดวิดีโออัตโนมัติ...":"Auto uploading video...","กรุณาลากไฟล์มาวาง หรือดาวน์โหลดจาก Flow":"Please drag file or download from Flow","กรุณาดาวน์โหลดวิดีโอจาก Flow แล้วลากมาวาง":"Please download video from Flow and drag here","บันทึกฉบับร่างสำเร็จ!":"Draft saved!","โพสสำเร็จ!":"Posted!","ตั้งเวลาโพสสำเร็จ!":"Scheduled!","เกิดข้อผิดพลาด":"Error occurred","กำลังอัพโหลดคลิป...":"Uploading clip...","กำลังอัพโหลดวิดีโอ...":"Uploading video...","เตรียมไฟล์":"Preparing file","รอหน้าโหลด...":"Waiting for page...","กำลังหาช่องอัพโหลด":"Finding upload field","กำลังเตรียมไฟล์...":"Preparing file...","แปลงข้อมูล":"Converting data","อัพโหลดสำเร็จ!":"Upload successful!","รอ TikTok ประมวลผล...":"Waiting for TikTok processing...","อัพโหลดไม่สำเร็จ":"Upload failed","ดาวน์โหลดจาก URL":"Downloading from URL","กำลังโหลดวิดีโอ...":"Loading video..."};
function _tt(s){if(!s||typeof s!=='string'||_tiktokLang==='th')return s;if(_tiktokI18n[s])return _tiktokI18n[s];if(!/[\u0E00-\u0E7F]/.test(s))return s;let r=s;for(const[k,v]of Object.entries(_tiktokI18n)){if(k.length<3)continue;if(r.includes(k))r=r.split(k).join(v);if(!/[\u0E00-\u0E7F]/.test(r))break;}return r;}
try{chrome.storage.local.get(['uiLanguage'],function(r){if(r.uiLanguage==='en')_tiktokLang='en';});}catch(e){}

// ===== INJECT PAGE CONTEXT SCRIPT =====
// v6.0.4: Inject script เพื่อพิมพ์ hashtag ใน page context (ไม่ใช่ content script context)
// ทำให้ TikTok detect การพิมพ์เหมือนคนพิมพ์จริง

var injectedScriptReady = false;
var hashtagResultResolve = null;
var hashtagRequestId = 0;

function injectPageContextScript() {
  return new Promise((resolve) => {
    // เช็คว่า inject แล้วหรือยัง
    if (document.getElementById('tiktok-injected-script')) {
      console.log('[TikTok] Injected script already exists');
      resolve(true);
      return;
    }

    // สร้าง script element
    const script = document.createElement('script');
    script.id = 'tiktok-injected-script';
    script.src = chrome.runtime.getURL('content/tiktok-injected.js');

    // รอ script โหลดเสร็จ
    script.onload = () => {
      console.log('[TikTok] Injected script loaded');
      resolve(true);
    };

    script.onerror = (e) => {
      console.error('[TikTok] Failed to inject script:', e);
      resolve(false);
    };

    // Inject เข้าไปใน page
    (document.head || document.documentElement).appendChild(script);
  });
}

// รับ message จาก injected script
window.addEventListener('message', function(event) {
  if (event.source !== window) return;

  if (event.data && event.data.type === 'TIKTOK_INJECTED_READY') {
    console.log('[TikTok] Injected script is ready');
    injectedScriptReady = true;
  }

  if (event.data && event.data.type === 'TIKTOK_HASHTAG_RESULT') {
    console.log('[TikTok] Received hashtag result:', event.data);
    if (hashtagResultResolve) {
      hashtagResultResolve(event.data);
      hashtagResultResolve = null;
    }
  }
});

// ส่ง hashtag ไปให้ injected script พิมพ์
function typeHashtagViaInjectedScript(hashtag) {
  return new Promise((resolve) => {
    const myId = ++hashtagRequestId;
    hashtagResultResolve = resolve;

    // ตั้ง timeout — ใช้ requestId ป้องกัน race condition (timer จาก hashtag ก่อนหน้า resolve ผิดตัว)
    setTimeout(() => {
      if (hashtagResultResolve && hashtagRequestId === myId) {
        console.log('[TikTok] Hashtag typing timeout (request', myId, ')');
        hashtagResultResolve({ success: false, verified: false, timeout: true });
        hashtagResultResolve = null;
      }
    }, 15000);

    // ส่ง message ไป injected script
    window.postMessage({
      type: 'TIKTOK_TYPE_HASHTAG',
      hashtag: hashtag
    }, '*');
  });
}

// ===== UTILITIES =====

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// รอจน element ปรากฏ
async function waitForElement(selector, timeout = 10000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const element = document.querySelector(selector);
    if (element) return element;
    await delay(200);
  }
  console.log(`[TikTok] Element not found: ${selector}`);
  return null;
}

// รอจน element หลายตัว (return array)
async function waitForElements(selector, timeout = 10000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) return Array.from(elements);
    await delay(200);
  }
  return [];
}

// รอจน element มี text ที่ต้องการ (exact match หรือ includes)
async function waitForElementWithText(text, tag = '*', timeout = 10000, exact = false) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const elements = document.querySelectorAll(tag);
    for (const el of elements) {
      const content = el.textContent.trim();
      if (exact ? content === text : content.includes(text)) {
        return el;
      }
    }
    await delay(200);
  }
  console.log(`[TikTok] Element with text not found: "${text}"`);
  return null;
}

// หา clickable element (button, div ที่คลิกได้)
function findClickableElement(text) {
  // หาจาก button ก่อน
  const buttons = document.querySelectorAll('button, [role="button"]');
  for (const btn of buttons) {
    if (btn.textContent.trim().includes(text)) {
      return btn;
    }
  }

  // หาจาก div ที่มี onClick หรือ cursor pointer
  const divs = document.querySelectorAll('div, span');
  for (const div of divs) {
    if (div.textContent.trim() === text || div.textContent.trim().includes(text)) {
      const style = window.getComputedStyle(div);
      if (style.cursor === 'pointer') {
        return div;
      }
    }
  }

  return null;
}

// คลิก element - ใช้หลายวิธีพร้อมกันเพื่อให้แน่ใจว่าทำงาน
async function clickElement(element) {
  if (!element) return false;

  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await delay(300);

  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  // วิธีที่ 1: Focus ก่อน
  if (element.focus) {
    element.focus();
  }

  // วิธีที่ 2: Dispatch pointer events (สำหรับ React)
  const pointerDownEvent = new PointerEvent('pointerdown', {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: centerX,
    clientY: centerY,
    pointerId: 1,
    pointerType: 'mouse',
    isPrimary: true
  });
  element.dispatchEvent(pointerDownEvent);

  const pointerUpEvent = new PointerEvent('pointerup', {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: centerX,
    clientY: centerY,
    pointerId: 1,
    pointerType: 'mouse',
    isPrimary: true
  });
  element.dispatchEvent(pointerUpEvent);

  // วิธีที่ 3: Dispatch mouse events
  const mouseDownEvent = new MouseEvent('mousedown', {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: centerX,
    clientY: centerY,
    button: 0,
    buttons: 1
  });
  element.dispatchEvent(mouseDownEvent);

  await delay(50);

  const mouseUpEvent = new MouseEvent('mouseup', {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: centerX,
    clientY: centerY,
    button: 0,
    buttons: 0
  });
  element.dispatchEvent(mouseUpEvent);

  const clickEvent = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: centerX,
    clientY: centerY,
    button: 0
  });
  element.dispatchEvent(clickEvent);

  // วิธีที่ 4: Native click
  try {
    element.click();
  } catch (e) {
    // ignore
  }

  return true;
}

// ใส่ text ใน input/textarea หรือ contenteditable
async function setInputValue(element, value) {
  if (!element) return false;

  element.focus();
  await delay(100);

  // Clear ข้อมูลเดิม
  if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
    element.value = '';
    element.value = value;
  } else if (element.contentEditable === 'true' || element.isContentEditable) {
    // ContentEditable div
    element.innerHTML = '';
    element.textContent = value;
  }

  // Dispatch events
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

  return true;
}

// ===== OVERLAY =====

var tiktokOverlay = null;

function showTikTokOverlay(message, subtitle = '') {
  message = _tt(message); subtitle = _tt(subtitle);
  if (!tiktokOverlay) {
    tiktokOverlay = document.createElement('div');
    tiktokOverlay.id = 'tiktok-bot-overlay';
    tiktokOverlay.innerHTML = `
      <div class="tiktok-overlay-content">
        <div class="tiktok-header">${_tt('🎬 PD Auto Footage กำลังทำงาน')}</div>
        <div class="tiktok-status-row">
          <div class="tiktok-spinner"></div>
          <div class="tiktok-message"></div>
        </div>
        <div class="tiktok-subtitle"></div>
        <div class="tiktok-warning">${_tt('⚠️ กรุณาอย่ากดเล่นที่หน้าจอ')}</div>
      </div>
    `;
    document.body.appendChild(tiktokOverlay);

    // Add styles - v6.0: ม่านโปร่งใส + กล่องตรงกลาง
    const style = document.createElement('style');
    style.textContent = `
      #tiktok-bot-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        pointer-events: none;
      }
      .tiktok-overlay-content {
        background: linear-gradient(135deg, rgba(15,23,22,0.95), rgba(6,35,30,0.95));
        padding: 20px 28px;
        border-radius: 16px;
        text-align: center;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(16,185,129,0.15);
        border: 2px solid rgba(16,185,129,0.5);
        min-width: 300px;
        max-width: 400px;
        pointer-events: auto;
      }
      .tiktok-header {
        background: linear-gradient(90deg, #10b981, #d4a843);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        font-size: 16px;
        font-weight: 700;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(16,185,129,0.2);
      }
      .tiktok-status-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
      }
      .tiktok-spinner {
        width: 24px;
        height: 24px;
        border: 3px solid rgba(16,185,129,0.3);
        border-top: 3px solid #10b981;
        border-radius: 50%;
        animation: tiktok-spin 1s linear infinite;
        flex-shrink: 0;
      }
      @keyframes tiktok-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .tiktok-message {
        color: #fff;
        font-size: 14px;
        font-weight: 600;
      }
      .tiktok-subtitle {
        color: #d4a843;
        font-size: 12px;
        margin-top: 8px;
      }
      .tiktok-warning {
        color: #f59e0b;
        font-size: 11px;
        margin-top: 12px;
        padding-top: 8px;
        border-top: 1px solid rgba(212,168,67,0.3);
        text-align: center;
      }
    `;
    document.head.appendChild(style);
  }

  tiktokOverlay.querySelector('.tiktok-message').textContent = message;
  tiktokOverlay.querySelector('.tiktok-subtitle').textContent = subtitle;
  tiktokOverlay.style.display = 'flex';
}

function hideTikTokOverlay() {
  if (tiktokOverlay) {
    tiktokOverlay.style.display = 'none';
  }
}

function updateTikTokOverlay(message, subtitle = '') {
  message = _tt(message); subtitle = _tt(subtitle);
  if (tiktokOverlay) {
    tiktokOverlay.querySelector('.tiktok-message').textContent = message;
    tiktokOverlay.querySelector('.tiktok-subtitle').textContent = subtitle;
  } else {
    showTikTokOverlay(message, subtitle);
  }

  // v6.0: ส่ง status update กลับไป popup เพื่อ sync กับม่าน extension
  try {
    chrome.runtime.sendMessage({
      action: 'tiktokStatusUpdate',
      message: message,
      subtitle: subtitle
    });
  } catch (e) {
    // Ignore errors (popup อาจปิดอยู่)
  }
}

// ===== MAIN FUNCTIONS =====

// Step 0: คลิกปุ่ม "Select videos" (ถ้าอยู่หน้า upload ใหม่)
// v15: เพิ่ม retry 5 ครั้ง รอ 3 วินาทีต่อครั้ง
async function clickSelectVideosButton(maxRetries = 5, retryDelay = 3000) {
  console.log('[TikTok] Step 0: Looking for Select videos button...');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[TikTok] Attempt ${attempt}/${maxRetries} - Looking for Select videos button...`);

    // หาปุ่ม Select videos
    const selectBtn = findClickableElement('Select video') ||
                      findClickableElement('Select videos') ||
                      findClickableElement('เลือกวิดีโอ');

    if (selectBtn) {
      console.log('[TikTok] Found Select videos button, clicking...');
      await clickElement(selectBtn);
      await delay(1000);
      return true;
    }

    // ลองหาจาก input file โดยตรง
    const fileInput = document.querySelector('input[type="file"][accept*="video"]');
    if (fileInput) {
      console.log('[TikTok] Found file input directly');
      return true;
    }

    // ถ้ายังไม่เจอและยังไม่ครบ retry
    if (attempt < maxRetries) {
      console.log(`[TikTok] Button not found, waiting ${retryDelay/1000}s before retry...`);
      await delay(retryDelay);
    }
  }

  console.log('[TikTok] Select videos button not found after all retries (may already uploaded)');
  return false;
}

// Step 1: รอให้หน้า Upload พร้อม (วิดีโออัพโหลดแล้ว)
async function waitForVideoUploaded(timeout = 60000) {
  console.log('[TikTok] Step 1: Wait for video uploaded');
  updateTikTokOverlay('รอวิดีโออัพโหลด...', 'กรุณาลากไฟล์วิดีโอมาวาง หรือกด Select videos');

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    // ตรวจสอบว่ามี video preview หรือ upload complete
    const videoPreview = document.querySelector('video[src], [class*="video-preview"], [class*="uploaded"]');

    // ตรวจสอบว่ามี Description section (แปลว่าอัพโหลดเสร็จแล้ว)
    const descSection = document.querySelector('[class*="description"], [class*="caption"]');

    // ตรวจสอบว่ามี Settings section
    const settingsSection = await waitForElementWithText('Settings', '*', 1000) ||
                            await waitForElementWithText('When to post', '*', 1000);

    // ตรวจสอบว่าปุ่ม Post/Schedule มีแล้ว
    const postBtn = findClickableElement('Post') || findClickableElement('Schedule');

    if (videoPreview || settingsSection || (postBtn && postBtn.offsetParent !== null)) {
      console.log('[TikTok] Video uploaded, UI ready');
      await delay(2000); // รอให้ UI stable
      return true;
    }

    // ตรวจจาก description box ที่ปรากฏ
    const descBox = document.querySelector('[contenteditable="true"]');
    if (descBox && descBox.offsetParent !== null) {
      console.log('[TikTok] Description box found, video uploaded');
      await delay(2000);
      return true;
    }

    await delay(1000);
  }

  throw new Error('รอวิดีโออัพโหลดนานเกินไป กรุณาอัพโหลดวิดีโอก่อน');
}

// ฟังก์ชันอัพโหลดวิดีโอจาก URL (ใช้ fetch + File API)
async function uploadVideoFromUrl(videoUrl) {
  console.log('[TikTok] Uploading video from URL:', videoUrl);
  updateTikTokOverlay('กำลังโหลดวิดีโอ...', 'รอสักครู่');

  try {
    // Fetch video
    const response = await fetch(videoUrl);
    const blob = await response.blob();

    // สร้าง File object
    const filename = `video_${Date.now()}.mp4`;
    const file = new File([blob], filename, { type: 'video/mp4' });

    console.log('[TikTok] Video file created:', file.name, file.size);

    // หา file input
    const fileInput = document.querySelector('input[type="file"][accept*="video"]');
    if (!fileInput) {
      throw new Error('ไม่พบช่องอัพโหลดวิดีโอ');
    }

    // สร้าง DataTransfer และใส่ไฟล์
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;

    // Trigger events
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    fileInput.dispatchEvent(new Event('input', { bubbles: true }));

    console.log('[TikTok] Video file uploaded to input');
    updateTikTokOverlay('อัพโหลดวิดีโอ...', 'กำลังประมวลผล');

    return true;

  } catch (error) {
    console.error('[TikTok] Upload error:', error);
    throw new Error('ไม่สามารถอัพโหลดวิดีโอได้: ' + error.message);
  }
}

// v6.0.4: ฟังก์ชันพิมพ์ hashtag ผ่าน injected script (page context)
// ทำให้ TikTok detect การพิมพ์เหมือนคนพิมพ์จริง และแสดง dropdown ให้เลือก verified hashtag
async function typeVerifiedHashtags(descInput, userHashtags) {
  console.log('[TikTok] v6.0.4: Starting verified hashtags input via injected script');
  console.log('[TikTok] User hashtags string:', userHashtags);

  // แยก hashtags จาก string (คั่นด้วยเว้นวรรค)
  // รองรับทั้งแบบมี # นำหน้าและไม่มี
  const hashtagList = userHashtags.split(/\s+/)
    .filter(h => h.trim())
    .slice(0, 5) // จำกัดสูงสุด 5 ตัว
    .map(h => h.startsWith('#') ? h : '#' + h);

  console.log('[TikTok] Parsed hashtags:', hashtagList);

  if (hashtagList.length === 0) {
    console.log('[TikTok] No hashtags to verify');
    return;
  }

  // v6.0.4: Inject script ถ้ายังไม่ได้ inject
  console.log('[TikTok] v6.0.4: Injecting page context script...');
  updateTikTokOverlay('กำลังเตรียมระบบแฮชแท็ก...', 'inject script');

  const injected = await injectPageContextScript();
  if (!injected) {
    console.error('[TikTok] Failed to inject script, falling back to normal method');
    // Fallback: ใส่ hashtag แบบเดิม (ไม่ verify)
    for (const hashtag of hashtagList) {
      document.execCommand('insertText', false, hashtag + ' ');
    }
    return;
  }

  // รอให้ injected script พร้อม
  await delay(500);
  console.log('[TikTok] Injected script ready status:', injectedScriptReady);

  updateTikTokOverlay('กำลังใส่แฮชแท็ก...', `0/${hashtagList.length} ตัว`);

  let verifiedCount = 0;

  for (let i = 0; i < hashtagList.length; i++) {
    const hashtag = hashtagList[i];
    console.log(`[TikTok] v6.0.4: Sending hashtag ${i + 1}/${hashtagList.length}: ${hashtag}`);
    updateTikTokOverlay('กำลังใส่แฮชแท็ก...', `${hashtag} (${i + 1}/${hashtagList.length})`);

    // ส่ง hashtag ไปให้ injected script พิมพ์
    const result = await typeHashtagViaInjectedScript(hashtag);

    if (result.success) {
      if (result.verified) {
        console.log('[TikTok] ✅ Hashtag verified via injected script!', hashtag);
        verifiedCount++;
      } else {
        console.log('[TikTok] Hashtag typed but not verified:', hashtag);
      }
    } else {
      console.log('[TikTok] Failed to type hashtag:', hashtag, result.error || '');
    }

    await delay(300);
  }

  console.log(`[TikTok] v6.0.4: All hashtags processed. Verified: ${verifiedCount}/${hashtagList.length}`);
  updateTikTokOverlay('ใส่แฮชแท็กเสร็จ', `✅ ${verifiedCount}/${hashtagList.length} verified`);
  await delay(500);
}

// Step 2: ใส่ Description (ใช้วิธีเดิมที่ทำงานได้)
// v6.1: กลับไปใช้แบบเดิม - ใส่ caption + hashtags รวมกัน (ไม่ใช้ verified hashtag)
async function setDescription(caption, hashtags, userHashtags = '') {
  console.log('[TikTok] Step 2: Set description');
  console.log('[TikTok] Caption:', caption);
  console.log('[TikTok] Hashtags:', hashtags);
  console.log('[TikTok] User Hashtags:', userHashtags);
  updateTikTokOverlay('กำลังใส่แคปชั่น...', caption.substring(0, 30) + '...');

  // v7.3.4: ถ้า user กรอกไม่ครบ 5 แฮชแท็ก ให้ AI เติมให้ครบ (สูงสุด 5)
  // เตรียม hashtags string
  let hashtagString = '';
  const MAX_HASHTAGS = 5;
  const defaultHashtags = ['คลิปai', 'aiคอนเท้นครีเอเตอร์', 'ai', 'ฟีดดดๆ', 'fyp', 'tiktokshop'];

  // Parse userHashtags - แยกโดยเว้นวรรคหรือเครื่องหมาย #
  let userTagList = [];
  if (userHashtags && userHashtags.trim()) {
    // แยก hashtags: #tag1 #tag2 หรือ tag1 tag2
    userTagList = userHashtags.trim().split(/\s+/)
      .map(h => h.replace(/^#/, '').trim()) // ลบ # นำหน้าออก
      .filter(h => h.length > 0);
    console.log('[TikTok] v7.3.4: User hashtags parsed:', userTagList);
  }

  // เตรียม AI hashtags (ลบ # นำหน้าออก)
  // v7.5: ป้องกัน error ถ้า hashtags ไม่ใช่ array
  let hashtagsArray = defaultHashtags;
  if (Array.isArray(hashtags) && hashtags.length > 0) {
    hashtagsArray = hashtags;
  } else if (typeof hashtags === 'string' && hashtags.trim()) {
    // กรณี hashtags เป็น string ให้แยกเป็น array
    hashtagsArray = hashtags.split(/\s+/).filter(h => h.trim());
  }
  const aiTagList = hashtagsArray
    .map(h => String(h).replace(/^#/, '').trim())
    .filter(h => h.length > 0);
  console.log('[TikTok] v7.3.4: AI hashtags available:', aiTagList);

  // v4.5.9: กฎแฮชแท็ก — "ลูกค้ากรอกเอง = ใช้ของลูกค้าเท่านั้น ห้ามเติม AI/default"
  //   ✅ กรอก       → ใช้ของลูกค้าล้วน (ตัดเหลือ 5)
  //   ❌ ไม่กรอก+API → AI คิดจากชื่อสินค้า (aiTagList = hashtags ที่ popup ส่งมา)
  //   ❌ ไม่กรอก+NoAPI→ ค่า default (popup ส่ง hashtags ว่าง → aiTagList = defaultHashtags)
  // เดิม: เติม AI/default ให้ครบ 5 เสมอ → แฮชแท็ก default โผล่ทับของลูกค้าทุกสินค้า (bug)
  let finalTagList;
  if (userTagList.length > 0) {
    finalTagList = userTagList.slice(0, MAX_HASHTAGS);
    console.log(`[TikTok] v4.5.9: ล็อกใช้แฮชแท็กลูกค้าเท่านั้น (ไม่เติม AI/default):`, finalTagList);
  } else {
    // ไม่กรอก → เติมจาก AI/default ให้ครบ 5 (dedup AI ซ้ำกันเอง)
    finalTagList = [];
    const usedTagLower = new Set();
    for (const aiTag of aiTagList) {
      if (finalTagList.length >= MAX_HASHTAGS) break;
      const aiLower = aiTag.toLowerCase();
      if (!usedTagLower.has(aiLower)) {
        usedTagLower.add(aiLower);
        finalTagList.push(aiTag);
      }
    }
    console.log(`[TikTok] v4.5.9: ลูกค้าไม่กรอก → ใช้ AI/default:`, finalTagList);
  }

  // สร้าง string พร้อม #
  hashtagString = finalTagList.map(h => '#' + h).join(' ');
  console.log(`[TikTok] v7.3.4: Final hashtags (${finalTagList.length}):`, hashtagString);

  // v16: ใส่เฉพาะ caption ก่อน แล้วจะใส่ hashtags ทีละตัวผ่าน verified flow ทีหลัง
  let fullCaption = caption;
  // v3.9 fix: ถ้า caption ว่าง (skip caption) → ล้าง filename ค้างแล้วข้ามไปใส่ hashtags เลย
  const isSkipCaption = !caption || !caption.trim();

  console.log('[TikTok] Full caption to insert:', fullCaption, 'isSkipCaption:', isSkipCaption);

  // หา description input - TikTok ใช้ DraftJS contenteditable
  // ต้องหา .public-DraftEditor-content หรือ [data-contents="true"]
  let descInput = null;

  // ลองหาหลาย selector
  const selectors = [
    '.public-DraftEditor-content[contenteditable="true"]',
    '[data-contents="true"]',
    '.DraftEditor-editorContainer [contenteditable="true"]',
    'div[contenteditable="true"][role="textbox"]',
    'div[contenteditable="true"]'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      descInput = element;
      console.log(`[TikTok] Found description input: ${selector}`);
      break;
    }
  }

  if (!descInput) {
    // รอให้ element ปรากฏ
    for (const selector of selectors) {
      const element = await waitForElement(selector, 5000);
      if (element) {
        descInput = element;
        console.log(`[TikTok] Found description input (after wait): ${selector}`);
        break;
      }
    }
  }

  if (!descInput) {
    console.error('[TikTok] Description input not found!');
    throw new Error('ไม่พบช่อง Description');
  }

  // v16.2: รอให้ TikTok insert filename เสร็จก่อน — poll จนเจอ หรือ timeout
  // v16.2.1: เพิ่ม initial delay 1 วิ ให้ TikTok settle ก่อน (Post Clip mode อาจแทรก filename ช้า)
  await delay(1000);
  descInput.focus();
  await delay(300);
  descInput.click();
  await delay(300);

  // v16.4: DraftJS-aware caption insertion
  // ============================================================
  // Root cause: execCommand('selectAll') changes browser selection
  // but DraftJS internal SelectionState stays at cursor-end position.
  // Fix: Selection API + dispatch 'select' event on editor element
  // → triggers DraftJS onSelect handler → reads browser selection
  // → syncs internal SelectionState → paste REPLACES instead of APPENDS.
  // ============================================================

  const filenamePattern = /\.(mp4|mov|webm|avi|mkv)|clip_\d{10,}/i;

  const reQueryDescInput = () => {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return descInput;
  };

  // v16.4: Select all in DraftJS with proper internal state sync
  const draftJSSelectAll = async (editorEl) => {
    const sel = window.getSelection();
    sel.removeAllRanges();
    const range = document.createRange();
    range.selectNodeContents(editorEl);
    sel.addRange(range);
    // CRITICAL: Dispatch events to trigger DraftJS onSelect handler
    // DraftJS reads document.getSelection() → syncs internal SelectionState
    editorEl.dispatchEvent(new Event('select', { bubbles: true }));
    document.dispatchEvent(new Event('selectionchange'));
    await delay(500);
    return (sel.toString() || '').length;
  };

  // v16.4: Paste text via ClipboardEvent
  const draftJSPaste = async (editorEl, text) => {
    const dt = new DataTransfer();
    dt.setData('text/plain', text);
    editorEl.dispatchEvent(new ClipboardEvent('paste', {
      clipboardData: dt,
      bubbles: true,
      cancelable: true
    }));
    await delay(600);
    window.getSelection()?.collapseToEnd();
    await delay(200);
  };

  // v16.4: Select all + paste to replace all content
  const draftJSReplaceAll = async (editorEl, text) => {
    editorEl.focus();
    await delay(200);
    const existing = editorEl.textContent?.trim() || '';
    if (existing.length > 0) {
      const selectedLen = await draftJSSelectAll(editorEl);
      console.log(`[TikTok] v16.4: Selected ${selectedLen}/${existing.length} chars`);
    }
    await draftJSPaste(editorEl, text);
    const result = editorEl.textContent?.trim() || '';
    return {
      hasCaption: result.includes(text.substring(0, 15)),
      hasFilename: filenamePattern.test(result),
      tooLong: result.length > text.length * 1.5,
      length: result.length
    };
  };

  // v16.4: Pre-clear stale content from previous clip
  const existingBefore = descInput.textContent?.trim() || '';
  if (existingBefore.length > 0) {
    console.log(`[TikTok] v16.4: Pre-clear stale content (${existingBefore.length} chars): "${existingBefore.substring(0, 50)}"`);
    descInput.focus();
    await delay(200);
    await draftJSSelectAll(descInput);
    await draftJSPaste(descInput, ' ');
    descInput = reQueryDescInput();
    console.log(`[TikTok] v16.4: Pre-clear done, remaining: ${(descInput.textContent?.trim() || '').length} chars`);
  }

  // v16.4: Poll for filename (TikTok auto-inserts after video upload)
  let waitedForFilename = false;
  for (let w = 0; w < 16; w++) {
    descInput = reQueryDescInput();
    const currentContent = descInput.textContent?.trim() || '';
    if (filenamePattern.test(currentContent)) {
      console.log(`[TikTok] v16.4: Filename detected after ${(w + 1) * 500}ms: "${currentContent.substring(0, 50)}"`);
      waitedForFilename = true;
      break;
    }
    await delay(500);
  }
  if (!waitedForFilename) {
    console.log('[TikTok] v16.4: No filename detected after 8s — proceeding');
  }

  // v16.4: Main caption insertion — select all + paste (max 3 attempts, 1.5s apart)
  let success = false;

  // v4.2.2 BUGFIX: ถ้า skipCaption → ข้าม v16.4 loop + fallbacks (execCommand/innerHTML)
  // เพราะ:
  // 1. fullCaption='' → tooLong logic เพี้ยน (result.length > 0*1.5 = true เสมอ) → 3 fails
  // 2. execCommand + innerHTML fallback ทำลาย DraftJS state → typeVerifiedHashtags พัง
  // → ปล่อยให้ v3.9/v4.0 paste-clear flow ด้านล่างจัดการ filename clearing แทน (DraftJS-safe)
  // ตามที่ CRITICAL-TECHNIQUES.md section 2 บอก: ห้ามใช้ execCommand/innerHTML กับ DraftJS!
  if (isSkipCaption) {
    console.log('[TikTok] v4.2.2: Skip caption mode — bypass v16.4 loop & fallbacks → ใช้ v4.0 paste-clear');
  } else {
    for (let attempt = 1; attempt <= 3; attempt++) {
      descInput = reQueryDescInput();
      const existing = descInput.textContent?.trim() || '';
      console.log(`[TikTok] v16.4: Attempt ${attempt}/3, existing: "${existing.substring(0, 50)}" (${existing.length} chars)`);

      try {
        const result = await draftJSReplaceAll(descInput, fullCaption);

        if (result.hasCaption && !result.hasFilename && !result.tooLong) {
          console.log(`[TikTok] v16.4: Caption inserted successfully (${result.length} chars)`);
          success = true;
          break;
        }

        if (result.hasCaption && (result.hasFilename || result.tooLong)) {
          console.log(`[TikTok] v16.4: Paste appended instead of replaced (${result.length} chars), retrying...`);
        } else {
          console.log(`[TikTok] v16.4: Paste failed, retrying...`);
        }
      } catch (e) {
        console.log(`[TikTok] v16.4: Error on attempt ${attempt}:`, e.message);
      }

      await delay(1500);
    }
  }

  // v16.4: Post-paste monitoring — catch late filename insertion by TikTok
  // 15 rounds × 2s = 30s max, need 3 consecutive clean checks to pass
  if (success) {
    let consecutiveClean = 0;
    for (let round = 1; round <= 15; round++) {
      await delay(2000);
      descInput = reQueryDescInput();
      const currentText = descInput.textContent?.trim() || '';

      if (filenamePattern.test(currentText)) {
        console.log(`[TikTok] v16.4: Monitor ${round}/15: filename detected! "${currentText.substring(0, 60)}"`);
        consecutiveClean = 0;

        // Select all + replace with clean caption (using synced DraftJS selection)
        descInput = reQueryDescInput();
        await draftJSReplaceAll(descInput, fullCaption);
        descInput = reQueryDescInput();
        const afterFix = descInput.textContent?.trim() || '';
        console.log(`[TikTok] v16.4: Monitor ${round}/15: after fix — ${afterFix.length} chars, clean: ${!filenamePattern.test(afterFix)}`);

        await delay(1000); // Don't rush next check
      } else {
        consecutiveClean++;
        console.log(`[TikTok] v16.4: Monitor ${round}/15: clean (${consecutiveClean} consecutive)`);
        if (consecutiveClean >= 3) {
          console.log('[TikTok] v16.4: 3 consecutive clean — monitoring done');
          break;
        }
      }
    }
  }

  // v16.4: Final deselect — reset cursor for hashtag insertion
  if (success) {
    descInput = reQueryDescInput();
    descInput.focus();
    descInput.click();
    window.getSelection()?.collapseToEnd();
    await delay(300);
    console.log('[TikTok] v16.4: Caption ready, cursor reset for hashtag insertion');
  }

  // ===== วิธีที่ 2: execCommand insertText (fallback) =====
  // v4.2.2 BUGFIX: ข้าม fallback ถ้า skipCaption (ทำลาย DraftJS state → hashtags พัง)
  if (!success && !isSkipCaption) {
    console.warn('[TikTok] Falling back to execCommand (hashtag verification may not work)');

    descInput.focus();
    await delay(200);

    document.execCommand('selectAll', false, null);
    document.execCommand('delete', false, null);
    await delay(100);

    document.execCommand('insertText', false, fullCaption);
    await delay(300);

    if (descInput.textContent && descInput.textContent.trim().length > 10) {
      console.log('[TikTok] Caption inserted via execCommand');
      success = true;
    }
  }

  // ===== วิธีที่ 3: innerHTML (last resort) =====
  // v4.2.2 BUGFIX: ข้าม fallback ถ้า skipCaption (ทำลาย DraftJS state → hashtags พัง)
  if (!success && !isSkipCaption) {
    console.warn('[TikTok] Falling back to innerHTML (hashtag verification will not work)');

    const innerBlock = descInput.querySelector('[data-block="true"]') ||
                       descInput.querySelector('[data-text="true"]') ||
                       descInput.querySelector('span[data-offset-key]') ||
                       descInput;

    const htmlContent = fullCaption.replace(/\n/g, '<br>');

    if (innerBlock !== descInput) {
      innerBlock.innerHTML = htmlContent;
    } else {
      descInput.innerHTML = `<div data-block="true"><span data-text="true">${htmlContent}</span></div>`;
    }

    descInput.dispatchEvent(new Event('input', { bubbles: true }));
    descInput.dispatchEvent(new Event('change', { bubbles: true }));

    await delay(300);

    if (descInput.textContent && descInput.textContent.length > 5) {
      console.log('[TikTok] Caption inserted via innerHTML');
      success = true;
    }
  }

  // v3.9 fix: ถ้า skip caption → ล้าง filename แล้วใส่ hashtags เลย (ไม่ต้องรอ paste caption สำเร็จ)
  if (isSkipCaption && !success) {
    console.log('[TikTok] v4.2.2b: Skip caption mode — clearing via InputEvent (DraftJS-aware)');
    descInput = reQueryDescInput();
    descInput.focus();
    await delay(200);

    // v4.2.2b: เปลี่ยนจาก ClipboardEvent → InputEvent insertFromPaste
    // เหตุผล: ClipboardEvent paste ทำให้ DraftJS internal handler crash ("null.length")
    //         InputEvent insertFromPaste = pattern ที่ proven ใน Flow's prompt input (Slate.js)
    //         DraftJS ก็ listen beforeinput เหมือนกัน → handle replacement ตรงกว่า
    const selectAllInDescInput = async () => {
      const sel = window.getSelection();
      sel.removeAllRanges();
      const range = document.createRange();
      range.selectNodeContents(descInput);
      sel.addRange(range);
      descInput.dispatchEvent(new Event('select', { bubbles: true }));
      document.dispatchEvent(new Event('selectionchange'));
      await delay(200);
    };

    const clearViaInputEvent = async () => {
      await selectAllInDescInput();
      const dt = new DataTransfer();
      dt.setData('text/plain', '');
      descInput.dispatchEvent(new InputEvent('beforeinput', {
        inputType: 'insertFromPaste',
        data: '',
        dataTransfer: dt,
        bubbles: true,
        cancelable: true
      }));
      descInput.dispatchEvent(new InputEvent('input', {
        inputType: 'insertFromPaste',
        data: '',
        dataTransfer: dt,
        bubbles: true,
        cancelable: false
      }));
      await delay(300);
    };

    const clearViaDeleteContent = async () => {
      await selectAllInDescInput();
      descInput.dispatchEvent(new InputEvent('beforeinput', {
        inputType: 'deleteContentBackward',
        bubbles: true,
        cancelable: true
      }));
      descInput.dispatchEvent(new InputEvent('input', {
        inputType: 'deleteContentBackward',
        bubbles: true,
        cancelable: false
      }));
      await delay(300);
    };

    const filenamePattern = /\.(mp4|mov|webm|avi|mkv)|clip_\d{10,}/i;
    const checkStillHasFilename = () => {
      descInput = reQueryDescInput();
      return filenamePattern.test(descInput.textContent || '');
    };

    // Attempt 1: InputEvent insertFromPaste (proven pattern จาก prompt input)
    await clearViaInputEvent();
    let stillHas = checkStillHasFilename();

    // Attempt 2: retry InputEvent ครั้งที่ 2 (เผื่อ DraftJS settle ช้า)
    if (stillHas) {
      console.log('[TikTok] v4.2.2b: รอบ 1 ยังไม่เคลียร์ — retry InputEvent');
      await delay(300);
      await clearViaInputEvent();
      stillHas = checkStillHasFilename();
    }

    // Attempt 3: deleteContentBackward fallback
    if (stillHas) {
      console.log('[TikTok] v4.2.2b: InputEvent ยังไม่ได้ผล — ลอง deleteContentBackward');
      await delay(300);
      await clearViaDeleteContent();
      stillHas = checkStillHasFilename();
    }

    if (stillHas) {
      // SAFETY NET: clear failed → ห้ามข้าม hashtag flow! (worst case: filename ค้างก่อน hashtag)
      // (เก่า: success=false → trigger "All caption methods failed" → skip hashtag = pre-v4.0 bug!)
      const remaining = (descInput.textContent || '').substring(0, 80);
      console.warn(`[TikTok] v4.2.2b: ⚠️ Filename clear failed — caption ยังเหลือ: "${remaining}" (ใส่ hashtag ต่อ ดีกว่าข้ามหมด)`);
      success = true; // ปล่อยให้ hashtag flow ทำงาน
    } else {
      success = true;
      const finalLen = (descInput.textContent || '').length;
      console.log(`[TikTok] v4.2.2b: ✅ Filename cleared (length: ${finalLen})`);
    }
  }

  if (!success) {
    console.error('[TikTok] All caption methods failed!');
    console.log('[TikTok] descInput.textContent:', descInput.textContent);
  } else {
    console.log('[TikTok] Caption set successfully!');
    console.log('[TikTok] Caption length:', descInput.textContent?.length);

    // v16: ใส่ hashtags ทีละตัวผ่าน verified flow (กดปุ่ม # → พิมพ์ → เลือก dropdown)
    if (hashtagString && hashtagString.trim()) {
      console.log('[TikTok] v16: Starting verified hashtag insertion:', hashtagString);
      await typeVerifiedHashtags(descInput, hashtagString);
    }
  }

  await delay(500);
  return success;
}

// Step 3: เพิ่ม Product Link (ปักตะกร้า)
// Flow: กด "+ Add" → เลือกสินค้า → กด "Next" (สีแดง) → กรอก Product name (ถ้ามี) → กด "Add" (สีแดง)
// v5.9.3: เพิ่ม productLinkName สำหรับกรอกใน dialog "Add product links"
async function addProductLink(productId, productLinkName = '') {
  console.log('[TikTok] Step 3: Add product link, ID:', productId, 'Product Name:', productLinkName || '(ไม่กรอก)');
  updateTikTokOverlay('กำลังเพิ่มสินค้า...', `Product ID: ${productId}`);

  // เลื่อนลงไปหา Add link section
  window.scrollTo(0, document.body.scrollHeight / 2);
  await delay(500);

  // หาส่วน "Add link"
  const addLinkSection = await waitForElementWithText('Add link', '*', 5000);

  if (!addLinkSection) {
    console.log('[TikTok] Add link section not found, skipping...');
    return true;
  }

  // กดปุ่ม "+ Add" เพื่อเปิด modal เลือกสินค้า
  console.log('[TikTok] Looking for "+ Add" button...');
  const addButtons = document.querySelectorAll('button, [role="button"]');
  let openModalBtn = null;

  for (const btn of addButtons) {
    const text = btn.textContent.trim();
    if (text === '+ Add' || text === 'Add' || text.includes('+ Add')) {
      // ต้องไม่ใช่ปุ่มใน modal (ปุ่มใน modal มักอยู่ใน dialog)
      if (!btn.closest('[role="dialog"], [class*="modal"], [class*="Modal"]')) {
        openModalBtn = btn;
        break;
      }
    }
  }

  if (openModalBtn) {
    console.log('[TikTok] Clicking "+ Add" to open product modal...');
    await clickElement(openModalBtn);
    await delay(2000);
  }

  // รอ modal ปรากฏ - ลองหาหลายวิธี
  await delay(2000); // รอให้ modal แสดง

  let modal = document.querySelector('[role="dialog"]');
  if (!modal) {
    // ลองหาจาก class
    modal = document.querySelector('[class*="modal"], [class*="Modal"], [class*="dialog"], [class*="Dialog"], [class*="drawer"], [class*="Drawer"]');
  }

  if (!modal) {
    // ลองหาจาก title text
    const modalTitle = await waitForElementWithText('Add product links', '*', 3000) ||
                       await waitForElementWithText('Select product', '*', 2000) ||
                       await waitForElementWithText('Product', '*', 2000);
    if (modalTitle) {
      modal = modalTitle.closest('[role="dialog"], [class*="modal"], [class*="Modal"]') || modalTitle.parentElement?.parentElement;
    }
  }

  if (!modal) {
    console.log('[TikTok] Product modal not opened, skipping product link');
    return true;
  }

  console.log('[TikTok] Product modal opened!');
  await delay(1000);

  // === Step 0.5: เลือก "Products" จาก Link type dropdown (ถ้ามี) ===
  // v6.1: ต้องหาใน "Add link" modal เท่านั้น และต้องอยู่ใกล้ "Link type" label
  console.log('[TikTok] Step 0.5: Check for Link type dropdown...');
  updateTikTokOverlay('เลือกประเภท Link...', 'Products');

  // หา dropdown "Link type" ที่แสดง "Select"
  let linkTypeDropdown = null;

  // v6.1: หา "Add link" modal ก่อน - ต้องหาใน modal นี้เท่านั้น!
  const addLinkModal = document.querySelector('[class*="modal"], [class*="Modal"], [role="dialog"]');
  const modalContent = addLinkModal || document;

  // ตรวจสอบว่าอยู่ใน Add link modal จริงๆ (มี text "Add link" และ "Link type")
  const modalText = modalContent.textContent || '';
  const isAddLinkModal = modalText.includes('Add link') && modalText.includes('Link type');
  console.log(`[TikTok] Is Add link modal: ${isAddLinkModal}`);

  if (isAddLinkModal) {
    // วิธีที่ 1: หา "Link type" label ก่อน แล้วหา dropdown ที่เป็น sibling
    const allElements = modalContent.querySelectorAll('*');
    for (const el of allElements) {
      const directText = el.childNodes[0]?.textContent?.trim();
      if (directText === 'Link type') {
        console.log('[TikTok] Found "Link type" label');
        // หา sibling หรือ parent ที่มี dropdown
        let parent = el.parentElement;
        for (let i = 0; i < 5 && parent; i++) {
          // หา element ที่มี text "Select" ใน parent
          const selectEl = parent.querySelector('div, span');
          if (selectEl) {
            const children = parent.querySelectorAll('div, span');
            for (const child of children) {
              const childText = child.textContent?.trim();
              // ต้องเป็น "Select" เท่านั้น ไม่ใช่ "Search locations" หรืออื่นๆ
              if (childText === 'Select') {
                linkTypeDropdown = child.closest('[class*="select"], [class*="Select"]') || child;
                console.log('[TikTok] Found Link type dropdown near label');
                break;
              }
            }
          }
          if (linkTypeDropdown) break;
          parent = parent.parentElement;
        }
        break;
      }
    }

    // วิธีที่ 2: หาจาก structure - "Link type" → ถัดไปคือ dropdown
    if (!linkTypeDropdown) {
      const linkTypeLabel = await waitForElementWithText('Link type', '*', 1000);
      if (linkTypeLabel) {
        // หา nextElementSibling ที่เป็น dropdown
        let sibling = linkTypeLabel.nextElementSibling;
        while (sibling) {
          const sibText = sibling.textContent?.trim();
          if (sibText === 'Select' || sibText?.startsWith('Select')) {
            linkTypeDropdown = sibling;
            console.log('[TikTok] Found Link type dropdown via sibling');
            break;
          }
          // หาลึกลงไปใน sibling
          const selectInside = sibling.querySelector('div, span');
          if (selectInside && selectInside.textContent?.trim() === 'Select') {
            linkTypeDropdown = sibling;
            console.log('[TikTok] Found Link type dropdown inside sibling');
            break;
          }
          sibling = sibling.nextElementSibling;
        }

        // หา parent แล้วหา Select ใน children
        if (!linkTypeDropdown) {
          const parent = linkTypeLabel.closest('div');
          if (parent) {
            const selectInParent = Array.from(parent.querySelectorAll('div, span'))
              .find(el => el.textContent?.trim() === 'Select');
            if (selectInParent) {
              linkTypeDropdown = selectInParent.closest('[class*="select"], [class*="Select"]') || selectInParent;
              console.log('[TikTok] Found Link type dropdown in parent container');
            }
          }
        }
      }
    }
  } else {
    console.log('[TikTok] Not in Add link modal, skipping Link type selection');
  }

  if (linkTypeDropdown) {
    console.log('[TikTok] Found Link type dropdown, clicking...');
    await clickElement(linkTypeDropdown);
    await delay(800);

    // หาและกด "Products" option
    let productsOption = null;

    // วิธีที่ 1: หาจาก .select-option-label ที่มีข้อความ "Products" (TikTok structure)
    const optionLabels = document.querySelectorAll('.select-option-label, [class*="select-option-label"]');
    console.log(`[TikTok] Found ${optionLabels.length} option labels`);

    for (const label of optionLabels) {
      const text = (label.textContent || '').trim();
      console.log(`[TikTok] Option label: "${text}"`);
      if (text === 'Products') {
        // กด li parent ที่เป็น [role="option"]
        productsOption = label.closest('li[role="option"]') || label.closest('.TUXSelect-menuOption') || label.parentElement;
        console.log('[TikTok] Found Products option via .select-option-label');
        break;
      }
    }

    // วิธีที่ 2: หาจาก li[role="option"] ที่มี Products
    if (!productsOption) {
      const menuOptions = document.querySelectorAll('li[role="option"], .TUXSelect-menuOption');
      console.log(`[TikTok] Found ${menuOptions.length} menu options`);

      for (const opt of menuOptions) {
        const text = (opt.textContent || '').trim();
        // ต้องมี Products แต่ไม่ใช่ Games
        if (text.includes('Products') && !text.includes('Games')) {
          productsOption = opt;
          console.log('[TikTok] Found Products option via li[role="option"]');
          break;
        }
      }
    }

    // วิธีที่ 3: หาจาก [role="option"] ทั่วไป
    if (!productsOption) {
      const options = document.querySelectorAll('[role="option"]');
      for (const opt of options) {
        const text = (opt.textContent || '').trim().toLowerCase();
        if (text === 'products' || (text.includes('products') && !text.includes('games'))) {
          productsOption = opt;
          console.log('[TikTok] Found Products option via [role="option"]');
          break;
        }
      }
    }

    if (productsOption) {
      console.log('[TikTok] Clicking "Products" option...');
      await clickElement(productsOption);
      await delay(1000);
    } else {
      console.log('[TikTok] Products option not found in dropdown');
    }
  } else {
    console.log('[TikTok] Link type dropdown not found (might not need it)');
  }

  // === Step 1: กด Next ครั้งแรก เพื่อเข้าหน้ารายการสินค้า ===
  console.log('[TikTok] Looking for first "Next" button to enter product list...');
  updateTikTokOverlay('กำลังเข้าหน้าสินค้า...', 'กด Next');

  let firstNextBtn = null;
  const allBtns1 = document.querySelectorAll('button');
  for (const btn of allBtns1) {
    if (btn.textContent.trim() === 'Next' && btn.offsetParent !== null && !btn.disabled) {
      firstNextBtn = btn;
      break;
    }
  }

  if (firstNextBtn) {
    console.log('[TikTok] Clicking first Next button...');
    await clickElement(firstNextBtn);
    await delay(3000); // รอนานขึ้นให้หน้า product list โหลด
  } else {
    console.log('[TikTok] First Next button not found, trying to continue...');
  }

  // === Step 2: เลือก Tab "Showcase products" (บางคนมี My shop มาก่อน) ===
  console.log('[TikTok] Step 2: Click "Showcase products" tab...');
  updateTikTokOverlay('เลือก Showcase products...', 'กด Tab');

  // หาและกด Tab "Showcase products"
  let showcaseTabClicked = false;

  // วิธีที่ 1: หาจาก TUXTabBar-itemTitle ที่มีข้อความ "Showcase products"
  const tabButtons = document.querySelectorAll('.TUXTabBar-itemTitle, .TUXTabBar-item button, [class*="TabBar"] button');
  for (const btn of tabButtons) {
    const text = (btn.textContent || '').trim().toLowerCase();
    if (text.includes('showcase') || text.includes('products')) {
      console.log('[TikTok] Found Showcase products tab:', btn.textContent.trim());
      await clickElement(btn);
      showcaseTabClicked = true;
      await delay(1500);
      break;
    }
  }

  // วิธีที่ 2: หาจาก div ที่มี text "Showcase products" แล้วกด parent button
  if (!showcaseTabClicked) {
    const allDivs = document.querySelectorAll('div');
    for (const div of allDivs) {
      if (div.textContent.trim() === 'Showcase products') {
        const parentBtn = div.closest('button');
        if (parentBtn) {
          console.log('[TikTok] Found Showcase products via div text');
          await clickElement(parentBtn);
          showcaseTabClicked = true;
          await delay(1500);
          break;
        }
      }
    }
  }

  // วิธีที่ 3: หาจาก aria-orientation="horizontal" TabBar
  if (!showcaseTabClicked) {
    const tabBar = document.querySelector('[aria-orientation="horizontal"]');
    if (tabBar) {
      const tabs = tabBar.querySelectorAll('button');
      for (const tab of tabs) {
        const text = (tab.textContent || '').toLowerCase();
        if (text.includes('showcase')) {
          console.log('[TikTok] Found Showcase tab in horizontal TabBar');
          await clickElement(tab);
          showcaseTabClicked = true;
          await delay(1500);
          break;
        }
      }
    }
  }

  if (showcaseTabClicked) {
    console.log('[TikTok] ✅ Clicked Showcase products tab');
  } else {
    console.log('[TikTok] ⚠️ Showcase products tab not found, continuing anyway...');
  }

  // === Step 3: ค้นหาสินค้าด้วย Product ID ===
  console.log('[TikTok] Step 3: Search for product...');
  updateTikTokOverlay('กำลังค้นหาสินค้า...', productId);

  // หา modal/container ใหม่หลังจากกด Next (เพราะหน้าเปลี่ยนแล้ว)
  let currentModal = document.querySelector('[role="dialog"]');
  if (!currentModal) {
    currentModal = document.querySelector('[class*="modal"], [class*="Modal"], [class*="dialog"], [class*="Dialog"], [class*="drawer"], [class*="Drawer"]');
  }
  if (!currentModal) {
    currentModal = document.body; // fallback ใช้ทั้งหน้า
  }
  console.log('[TikTok] Current modal/container:', currentModal.tagName, currentModal.className?.substring(0, 50));

  // หาช่อง Search products - TikTok ใช้ class TUXTextInputCore-input
  console.log('[TikTok] Looking for search input...');

  let searchInput = null;

  // วิธีที่ 1: หาจาก TUXTextInputCore-input (class ที่ถูกต้อง)
  searchInput = document.querySelector('input.TUXTextInputCore-input');
  if (searchInput && searchInput.offsetParent !== null) {
    console.log('[TikTok] Found search input via TUXTextInputCore-input');
  } else {
    searchInput = null;
  }

  // วิธีที่ 2: หาจาก placeholder
  if (!searchInput) {
    searchInput = document.querySelector('input[placeholder*="Search"]');
    if (searchInput && searchInput.offsetParent !== null) {
      console.log('[TikTok] Found search input via placeholder');
    } else {
      searchInput = null;
    }
  }

  if (searchInput) {
    console.log('[TikTok] Typing product ID in search:', productId);
    console.log('[TikTok] Search input class:', searchInput.className);

    // Focus และ click
    searchInput.focus();
    searchInput.click();
    await delay(500);

    // ใช้ Native Value Setter + execCommand สำหรับ React input
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;

    // Clear ค่าเดิม
    nativeInputValueSetter.call(searchInput, '');
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    await delay(200);

    // ใส่ค่าใหม่
    nativeInputValueSetter.call(searchInput, productId);
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    searchInput.dispatchEvent(new Event('change', { bubbles: true }));

    await delay(500);
    console.log('[TikTok] Input value after set:', searchInput.value);

    // ถ้าค่ายังไม่เข้า ลองใช้ execCommand
    if (searchInput.value !== productId) {
      console.log('[TikTok] Value not set, trying execCommand...');
      searchInput.focus();
      searchInput.select();
      document.execCommand('insertText', false, productId);
    }

    await delay(500);

    // กด Enter เพื่อค้นหา - ใช้ทั้ง keydown และ submit event
    console.log('[TikTok] Pressing Enter to search...');

    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true,
      view: window
    });
    searchInput.dispatchEvent(enterEvent);

    await delay(200);

    // ลองหาปุ่ม search icon และคลิก (ถ้ามี)
    const searchIcon = document.querySelector('[class*="search"] svg, [class*="Search"] svg, button[class*="search"]');
    if (searchIcon) {
      console.log('[TikTok] Found search icon, clicking...');
      const searchBtn = searchIcon.closest('button') || searchIcon.closest('div') || searchIcon;
      searchBtn.click();
    }

    // รอผลการค้นหาโหลด
    await delay(3000);
    console.log('[TikTok] Search completed');
  } else {
    console.log('[TikTok] Search input not found, will select first product');
  }

  // === Step 3: ติ๊กเลือกสินค้า (v4.7 - เพิ่ม validation ตรวจสอบ Product ID) ===
  console.log('[TikTok] Step 3: Select product with validation...');
  updateTikTokOverlay('กำลังตรวจสอบสินค้า...', `ค้นหา: ${productId}`);
  await delay(1000);

  let productSelected = false;
  let verifiedProductId = null;

  // === ค้นหาและ verify Product ID ก่อนเลือก ===
  // หา table rows ที่มีสินค้า
  const tbody = document.querySelector('tbody');
  const productRows = tbody ? Array.from(tbody.querySelectorAll('tr')).filter(r => r.offsetParent !== null) : [];

  console.log('[TikTok] Found product rows:', productRows.length);

  // ถ้าไม่พบสินค้าเลย = ABORT
  if (productRows.length === 0) {
    console.error('[TikTok] ❌ ABORT: ไม่พบสินค้าในรายการ! อาจเป็นเพราะ Product ID ผิด หรือ search ไม่ทำงาน');
    updateTikTokOverlay('❌ ไม่พบสินค้า!', `Product ID: ${productId} ไม่พบในระบบ`);
    await delay(2000);
    return false; // ABORT - ไม่ปักตระกร้า
  }

  // === หา row ที่มี Product ID ตรงกัน ===
  let matchingRow = null;
  let foundProductIds = [];

  for (const row of productRows) {
    // หา Product ID ใน row - TikTok แสดง ID ในหลายที่
    const rowText = row.textContent || '';

    // วิธีที่ 1: หา ID จาก text ใน row โดยตรง
    // Product ID มักเป็นตัวเลขยาวๆ (17-19 หลัก)
    const idMatches = rowText.match(/\d{17,19}/g) || [];

    // วิธีที่ 2: หา ID จาก cell ที่มี class หรือ data attribute
    const idCells = row.querySelectorAll('[class*="id"], [class*="ID"], [data-id]');
    for (const cell of idCells) {
      const cellText = cell.textContent.trim();
      if (/^\d{17,19}$/.test(cellText)) {
        idMatches.push(cellText);
      }
    }

    // เก็บ ID ที่พบเพื่อ log
    foundProductIds = foundProductIds.concat(idMatches);

    // ตรวจสอบว่า ID ที่ต้องการอยู่ใน row นี้หรือไม่
    if (idMatches.includes(productId) || rowText.includes(productId)) {
      matchingRow = row;
      verifiedProductId = productId;
      console.log('[TikTok] ✅ FOUND matching product! ID:', productId);
      break;
    }
  }

  // Log ข้อมูล debug
  console.log('[TikTok] Product IDs found in table:', [...new Set(foundProductIds)]);
  console.log('[TikTok] Looking for:', productId);

  // === ถ้าค้นหาแล้วเจอ 1 row พอดี = น่าจะถูกต้อง (fallback) ===
  if (!matchingRow && productRows.length === 1) {
    console.log('[TikTok] ⚠️ Single result fallback - ใช้ row เดียวที่เจอ');
    matchingRow = productRows[0];

    // พยายามดึง ID จาก row เดียวนี้
    const singleRowText = matchingRow.textContent || '';
    const singleIdMatch = singleRowText.match(/\d{17,19}/);
    if (singleIdMatch) {
      verifiedProductId = singleIdMatch[0];
      console.log('[TikTok] Extracted ID from single row:', verifiedProductId);

      // Double-check ว่าตรงกันหรือไม่
      if (verifiedProductId !== productId) {
        console.error('[TikTok] ❌ ABORT: Single result ID ไม่ตรง! ต้องการ:', productId, 'ได้:', verifiedProductId);
        updateTikTokOverlay('❌ สินค้าไม่ตรง!', `ต้องการ: ${productId}\nพบ: ${verifiedProductId}`);
        await delay(3000);
        return false; // ABORT - ป้องกันปักผิด
      }
    }
  }

  // === ถ้ายังไม่เจอ = ABORT ===
  if (!matchingRow) {
    console.error('[TikTok] ❌ ABORT: ไม่พบสินค้าที่มี Product ID ตรงกัน!');
    console.error('[TikTok] ต้องการ:', productId);
    console.error('[TikTok] พบใน table:', [...new Set(foundProductIds)]);
    updateTikTokOverlay('❌ ไม่พบสินค้าที่ตรงกัน!', `ID: ${productId}`);
    await delay(3000);
    return false; // ABORT - ไม่ปักตระกร้า
  }

  // === เลือก radio ใน row ที่ verify แล้ว ===
  console.log('[TikTok] ✅ Verified! Selecting product:', verifiedProductId);
  updateTikTokOverlay('✅ พบสินค้า!', `กำลังเลือก: ${verifiedProductId}`);

  const radioInMatchingRow = matchingRow.querySelector('input[type="radio"], .TUXRadioStandalone-input, input.TUXRadioStandalone-input');

  if (radioInMatchingRow) {
    console.log('[TikTok] Clicking verified radio button...');

    // Focus และ click
    radioInMatchingRow.focus();
    radioInMatchingRow.click();

    // ถ้า click ไม่ทำงาน ลอง dispatch events
    if (!radioInMatchingRow.checked) {
      console.log('[TikTok] Direct click did not work, trying events...');
      radioInMatchingRow.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      radioInMatchingRow.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      radioInMatchingRow.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      // Force check
      radioInMatchingRow.checked = true;
      radioInMatchingRow.dispatchEvent(new Event('change', { bubbles: true }));
      radioInMatchingRow.dispatchEvent(new Event('input', { bubbles: true }));
    }

    await delay(500);
    productSelected = radioInMatchingRow.checked;
    console.log('[TikTok] Radio checked status:', productSelected);
  } else {
    // Fallback: ลองคลิกที่ row โดยตรง
    console.log('[TikTok] No radio in row, trying to click row directly...');
    matchingRow.click();
    await delay(500);

    // ตรวจสอบอีกครั้งว่ามี radio ถูกเลือกหรือยัง
    const anyCheckedRadio = document.querySelector('input[type="radio"]:checked');
    productSelected = !!anyCheckedRadio;
  }

  if (productSelected) {
    console.log('[TikTok] ✅ Product selected successfully! Verified ID:', verifiedProductId);
  } else {
    console.log('[TikTok] ⚠️ WARNING: Radio selection may have failed, but proceeding...');
  }

  await delay(1500);

  // === Step 4: กดปุ่ม "Next" (สีแดง ด้านล่างขวาของ modal) ===
  console.log('[TikTok] Looking for "Next" button (red)...');
  updateTikTokOverlay('กำลังกด Next...', 'ไปขั้นตอนถัดไป');

  // ปุ่ม Next อยู่ใน common-modal-footer
  let nextBtn = null;

  // วิธีที่ 1: หาจาก modal footer
  const modalFooter = document.querySelector('[class*="common-modal-footer"], [class*="modal-footer"], [class*="Modal-footer"]');
  if (modalFooter) {
    console.log('[TikTok] Found modal footer');
    const footerButtons = modalFooter.querySelectorAll('button');
    for (const btn of footerButtons) {
      if (btn.textContent.includes('Next')) {
        nextBtn = btn;
        console.log('[TikTok] Found Next button in footer');
        break;
      }
    }
  }

  // วิธีที่ 2: หาจาก TUXButton-label ที่มีข้อความ Next
  if (!nextBtn) {
    const tuxLabels = document.querySelectorAll('.TUXButton-label');
    console.log('[TikTok] Found TUXButton-label elements:', tuxLabels.length);

    for (const label of tuxLabels) {
      if (label.textContent.trim() === 'Next') {
        nextBtn = label.closest('button');
        if (nextBtn && nextBtn.offsetParent !== null) {
          console.log('[TikTok] Found Next button via TUXButton-label');
          break;
        }
        nextBtn = null;
      }
    }
  }

  // วิธีที่ 3: หาจาก button โดยตรง
  if (!nextBtn) {
    console.log('[TikTok] Trying to find Next button directly...');
    const allButtons = document.querySelectorAll('button');
    for (const btn of allButtons) {
      if (btn.textContent.trim() === 'Next' && btn.offsetParent !== null) {
        nextBtn = btn;
        console.log('[TikTok] Found Next button directly');
        break;
      }
    }
  }

  if (nextBtn) {
    console.log('[TikTok] Found Next button, clicking...');
    console.log('[TikTok] Button classes:', nextBtn.className);

    // Scroll ให้เห็นปุ่ม
    nextBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await delay(300);

    // ลองหลายวิธีคลิก
    // วิธี 1: Native click
    nextBtn.focus();
    nextBtn.click();
    await delay(500);

    // วิธี 2: MouseEvent
    const rect = nextBtn.getBoundingClientRect();
    const clickX = rect.left + rect.width / 2;
    const clickY = rect.top + rect.height / 2;

    nextBtn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: clickX, clientY: clickY }));
    nextBtn.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: clickX, clientY: clickY }));
    nextBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: clickX, clientY: clickY }));

    await delay(2500);
  } else {
    console.log('[TikTok] Next button not found!');
  }

  // === Step 5: กรอก Product name (ถ้ามี) + กดปุ่ม "Add" (สีแดง) ===
  // v5.9.3: กรอก "Product name" (ชื่อตระกร้า) ก่อนกด Add
  console.log('[TikTok] Step 5: Fill Product name (if provided) and click Add...');
  updateTikTokOverlay('กำลังกรอกชื่อสินค้า...', productLinkName || 'ข้าม');

  await delay(1000);

  // === กรอก Product name (ถ้ามี) ===
  if (productLinkName && productLinkName.trim()) {
    console.log('[TikTok] Looking for Product name input field...');

    // หา input field สำหรับ Product name
    // จาก screenshot: dialog "Add product links" มี input พร้อม placeholder "Product name will appear on your video"
    let productNameInput = null;

    // วิธีที่ 1: หาจาก placeholder
    productNameInput = document.querySelector('input[placeholder*="Product name"]');
    if (productNameInput && productNameInput.offsetParent !== null) {
      console.log('[TikTok] Found Product name input via placeholder');
    } else {
      productNameInput = null;
    }

    // วิธีที่ 2: หาจาก TUXTextInputCore-input ใน modal
    if (!productNameInput) {
      const currentModal = document.querySelector('[role="dialog"], [class*="modal"], [class*="Modal"]');
      if (currentModal) {
        const inputs = currentModal.querySelectorAll('input.TUXTextInputCore-input, input[type="text"]');
        for (const inp of inputs) {
          // ไม่ใช่ search input (search มักมี placeholder = "Search")
          const placeholder = (inp.placeholder || '').toLowerCase();
          if (!placeholder.includes('search') && inp.offsetParent !== null) {
            productNameInput = inp;
            console.log('[TikTok] Found Product name input in modal');
            break;
          }
        }
      }
    }

    // วิธีที่ 3: หา input ที่อยู่ใกล้ label "Product name"
    if (!productNameInput) {
      const labels = document.querySelectorAll('label, div, span');
      for (const label of labels) {
        if (label.textContent.includes('Product name')) {
          const container = label.closest('div');
          if (container) {
            productNameInput = container.querySelector('input');
            if (productNameInput && productNameInput.offsetParent !== null) {
              console.log('[TikTok] Found Product name input near label');
              break;
            }
          }
        }
      }
    }

    if (productNameInput) {
      console.log('[TikTok] Filling Product name:', productLinkName);

      // Focus และ click
      productNameInput.focus();
      productNameInput.click();
      await delay(300);

      // ใช้ Native Value Setter สำหรับ React input
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;

      // Clear ค่าเดิม
      nativeInputValueSetter.call(productNameInput, '');
      productNameInput.dispatchEvent(new Event('input', { bubbles: true }));
      await delay(200);

      // ใส่ค่าใหม่
      nativeInputValueSetter.call(productNameInput, productLinkName.trim());
      productNameInput.dispatchEvent(new Event('input', { bubbles: true }));
      productNameInput.dispatchEvent(new Event('change', { bubbles: true }));

      await delay(300);
      console.log('[TikTok] Product name input value:', productNameInput.value);

      // ถ้าค่ายังไม่เข้า ลองใช้ execCommand
      if (productNameInput.value !== productLinkName.trim()) {
        console.log('[TikTok] Value not set, trying execCommand...');
        productNameInput.focus();
        productNameInput.select();
        document.execCommand('insertText', false, productLinkName.trim());
      }

      await delay(500);
      console.log('[TikTok] ✅ Product name filled:', productLinkName);
    } else {
      console.log('[TikTok] ⚠️ Product name input not found, skipping...');
    }
  } else {
    console.log('[TikTok] No Product name provided, skipping fill step');
  }

  // === กดปุ่ม "Add" (สีแดง) เพื่อยืนยันเพิ่มสินค้า ===
  console.log('[TikTok] Looking for "Add" button (red) to confirm...');
  updateTikTokOverlay('กำลังกด Add...', 'ยืนยันเพิ่มสินค้า');

  await delay(500);

  // หาปุ่ม Add จาก TUXButton-label
  let addBtn = null;

  for (const label of document.querySelectorAll('.TUXButton-label')) {
    const text = label.textContent.trim();
    // ต้องเป็น "Add" แบบ exact (ไม่ใช่ "+ Add")
    if (text === 'Add') {
      addBtn = label.closest('button');
      if (addBtn && addBtn.offsetParent !== null && !addBtn.disabled) {
        console.log('[TikTok] Found Add button via TUXButton-label');
        break;
      }
      addBtn = null;
    }
  }

  // Fallback: หาจาก button โดยตรง
  if (!addBtn) {
    const allBtns = document.querySelectorAll('button');
    for (const btn of allBtns) {
      const text = btn.textContent.trim();
      if (text === 'Add' && btn.offsetParent !== null && !btn.disabled) {
        addBtn = btn;
        console.log('[TikTok] Found Add button directly');
        break;
      }
    }
  }

  if (addBtn) {
    console.log('[TikTok] Clicking Add button to confirm...');
    // ใช้หลายวิธีคลิก
    addBtn.focus();
    addBtn.click();

    // ถ้า click ไม่ทำงาน ลอง dispatch events
    addBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    addBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    addBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await delay(2000);
  } else {
    console.log('[TikTok] Add button not found!');
  }

  // รอ modal ปิด
  await delay(1000);

  console.log('[TikTok] Product link added successfully!');
  return true;
}

// หาปุ่มใน modal (dialog)
function findButtonInModal(buttonText) {
  // หาใน modal/dialog ก่อน
  const modals = document.querySelectorAll('[role="dialog"], [class*="modal"], [class*="Modal"], [class*="Dialog"]');

  for (const modal of modals) {
    const buttons = modal.querySelectorAll('button');
    for (const btn of buttons) {
      const text = btn.textContent.trim();
      if (text === buttonText) {
        // ตรวจสอบว่าปุ่มไม่ disabled
        if (!btn.disabled && btn.offsetParent !== null) {
          console.log(`[TikTok] Found "${buttonText}" button in modal`);
          return btn;
        }
      }
    }
  }

  // Fallback: หาจากทั้งหน้า
  const allButtons = document.querySelectorAll('button');
  for (const btn of allButtons) {
    const text = btn.textContent.trim();
    if (text === buttonText && !btn.disabled && btn.offsetParent !== null) {
      // ตรวจสอบว่าเป็นปุ่มสีแดง (primary)
      const style = window.getComputedStyle(btn);
      const bgColor = style.backgroundColor;
      // สีแดง TikTok ประมาณ rgb(254, 44, 85)
      if (bgColor.includes('254') || bgColor.includes('fe') ||
          btn.className.includes('primary') || btn.className.includes('Primary')) {
        return btn;
      }
    }
  }

  // Last fallback
  return findClickableElement(buttonText);
}

// Step 4: ตั้งค่า Schedule
// v7.3: เพิ่ม scheduleTime parameter สำหรับตั้งเวลาเอง (HH:MM)
async function setSchedule(minutesFromNow = 20, scheduleDate = '', scheduleTime = '') {
  console.log('[TikTok] Step 4: Set schedule');
  console.log('[TikTok] scheduleDate:', scheduleDate);
  console.log('[TikTok] scheduleTime:', scheduleTime);
  updateTikTokOverlay('กำลังตั้งเวลาโพส...', 'เลือก Schedule');

  // เลื่อนลงไปดู settings
  window.scrollTo(0, document.body.scrollHeight / 2);
  await delay(500);

  // หา "When to post" section
  const whenToPost = await waitForElementWithText('When to post', '*', 5000);
  if (whenToPost) {
    whenToPost.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await delay(300);
  }

  // TikTok ใช้ Radio__innerCircle สำหรับ radio button
  // <span class="Radio__innerCircle Radio__innerCircle--checked-false">
  console.log('[TikTok] Looking for Schedule radio button...');

  // วิธีที่ 1: หา Radio__innerCircle ที่อยู่ใกล้ข้อความ "Schedule"
  const allLabels = document.querySelectorAll('label, span, div');
  let scheduleRadio = null;

  for (const el of allLabels) {
    const text = el.textContent.trim();
    if (text === 'Schedule') {
      // หา Radio__innerCircle ใน parent container
      const container = el.closest('label') || el.parentElement?.parentElement;
      if (container) {
        scheduleRadio = container.querySelector('.Radio__innerCircle, input[type="radio"]');
        if (scheduleRadio) {
          console.log('[TikTok] Found Schedule radio near label');
          break;
        }
      }
    }
  }

  // วิธีที่ 2: หาจาก class Radio__innerCircle--checked-false
  if (!scheduleRadio) {
    const uncheckedRadios = document.querySelectorAll('.Radio__innerCircle--checked-false');
    console.log('[TikTok] Found unchecked Radio__innerCircle:', uncheckedRadios.length);

    // หาตัวที่อยู่ใน When to post section
    for (const radio of uncheckedRadios) {
      const parentText = radio.closest('label')?.textContent || radio.parentElement?.parentElement?.textContent || '';
      if (parentText.includes('Schedule')) {
        scheduleRadio = radio;
        console.log('[TikTok] Found Schedule radio by class');
        break;
      }
    }
  }

  if (scheduleRadio) {
    console.log('[TikTok] Clicking Schedule radio...');
    scheduleRadio.click();
    await delay(1000);
  } else {
    console.log('[TikTok] Schedule radio not found, trying parent label...');
    // Fallback: หา label ที่มี Schedule แล้วคลิก
    for (const el of allLabels) {
      if (el.textContent.trim() === 'Schedule') {
        el.click();
        console.log('[TikTok] Clicked Schedule label');
        break;
      }
    }
    await delay(1000);
  }

  // === v7.3.4: สลับลำดับ - ตั้งวันที่ก่อน แล้วค่อยตั้งเวลา ===
  // เหตุผล: เมื่อเปลี่ยนวันที่ TikTok จะ reset เวลากลับไป default (+20 นาที)
  // ถ้าตั้งเวลาก่อนแล้วค่อยเปลี่ยนวัน เวลาจะถูก reset หายไป

  // Step 1: เลือกวันที่ก่อน (ถ้ามี)
  if (scheduleDate) {
    console.log('[TikTok] v7.3.4: Selecting date FIRST:', scheduleDate);
    updateTikTokOverlay('กำลังเลือกวันที่...', scheduleDate);
    await selectScheduleDate(scheduleDate);
    await delay(800); // รอให้ UI settle หลังเปลี่ยนวัน
  }

  // Step 2: ตั้งเวลาหลังจากเลือกวันที่แล้ว
  if (scheduleTime) {
    console.log('[TikTok] v7.3.4: Setting time AFTER date:', scheduleTime);
    await setCustomScheduleTime(scheduleTime);
  } else {
    // TikTok ต้องการเวลาอย่างน้อย 15 นาทีจากตอนนี้
    console.log('[TikTok] Adjusting schedule time automatically...');
    await adjustScheduleTime();
  }

  await delay(500);
  console.log('[TikTok] Schedule mode selected');
  return true;
}

// v7.1: ปรับเวลา Schedule ให้มากกว่า 20 นาที (TikTok ต้องการ >= 15 นาที แต่เผื่อ buffer)
async function adjustScheduleTime() {
  console.log('[TikTok] Adjusting schedule time to be > 20 minutes...');

  // รอให้ UI พร้อม
  await delay(500);

  // v7.1: คำนวณเวลาเป้าหมาย = ปัจจุบัน + 25 นาที (เผื่อ buffer เพิ่ม)
  const now = new Date();
  const targetTime = new Date(now.getTime() + 25 * 60 * 1000);
  const targetHour = targetTime.getHours();
  const targetMinute = targetTime.getMinutes();
  // ปัดนาทีขึ้นให้ลงตัว 5 นาที (TikTok มักให้เลือกทีละ 5 นาที)
  const roundedMinute = Math.ceil(targetMinute / 5) * 5;
  const finalHour = roundedMinute >= 60 ? (targetHour + 1) % 24 : targetHour;
  const finalMinute = roundedMinute >= 60 ? 0 : roundedMinute;

  console.log(`[TikTok] Current time: ${now.getHours()}:${now.getMinutes()}`);
  console.log(`[TikTok] Target time: ${finalHour}:${finalMinute.toString().padStart(2, '0')}`);

  // หา input เวลา (TUXTextInputCore-input ที่มี value เป็นเวลา เช่น "07:45")
  const timeInputs = document.querySelectorAll('input.TUXTextInputCore-input[readonly]');
  let timeInput = null;

  for (const input of timeInputs) {
    if (input.value && input.value.match(/^\d{2}:\d{2}$/)) {
      timeInput = input;
      console.log('[TikTok] Found time input with value:', input.value);
      break;
    }
  }

  if (!timeInput) {
    console.log('[TikTok] Time input not found');
    return;
  }

  // คลิกที่ input เพื่อเปิด dropdown
  console.log('[TikTok] Clicking time input to open dropdown...');
  timeInput.click();
  await delay(500);

  // v7.1: เลือกชั่วโมงก่อน (ถ้าต้องเปลี่ยน)
  const hourOptions = document.querySelectorAll('.tiktok-timepicker-option-text.tiktok-timepicker-left');
  if (hourOptions.length > 0) {
    // หา option ที่ตรงกับชั่วโมงเป้าหมาย
    for (const opt of hourOptions) {
      const hourText = opt.textContent.trim();
      const hourNum = parseInt(hourText);
      if (hourNum === finalHour) {
        console.log('[TikTok] Selecting hour:', hourText);
        opt.click();
        await delay(300);
        break;
      }
    }
  }

  // v7.1: เลือกนาทีที่ >= เป้าหมาย
  const minuteOptions = document.querySelectorAll('.tiktok-timepicker-option-text.tiktok-timepicker-right');
  console.log('[TikTok] Found minute options:', minuteOptions.length);

  if (minuteOptions.length > 0) {
    let selectedMinute = false;
    for (const opt of minuteOptions) {
      const minText = opt.textContent.trim();
      const minNum = parseInt(minText);
      if (minNum >= finalMinute) {
        console.log('[TikTok] Selecting minute:', minText);
        opt.click();
        selectedMinute = true;
        await delay(300);
        break;
      }
    }
    // ถ้าไม่เจอนาทีที่มากกว่า ให้เลือกตัวสุดท้าย (นาทีมากที่สุด)
    if (!selectedMinute && minuteOptions.length > 0) {
      const lastOpt = minuteOptions[minuteOptions.length - 1];
      console.log('[TikTok] Selecting last minute option:', lastOpt.textContent);
      lastOpt.click();
      await delay(300);
    }
  } else {
    // ลองหาแบบอื่น - tiktok-timepicker-option-item
    const allOptions = document.querySelectorAll('.tiktok-timepicker-option-item');
    console.log('[TikTok] Found timepicker options:', allOptions.length);

    // หา column ขวา (นาที) และเลือกตัวที่มากกว่า
    if (allOptions.length > 0) {
      // สมมติว่าครึ่งหลังคือนาที
      const halfIndex = Math.floor(allOptions.length / 2);
      for (let i = halfIndex + 4; i < allOptions.length; i++) { // +4 ขั้น = +20 นาที
        const opt = allOptions[i];
        if (opt.offsetParent !== null) {
          console.log('[TikTok] Clicking option:', opt.textContent);
          opt.click();
          await delay(300);
          break;
        }
      }
    }
  }

  // คลิกที่อื่นเพื่อปิด dropdown
  await delay(300);
  document.body.click();

  console.log('[TikTok] Time adjustment complete');
}

// v7.3: ตั้งเวลา Schedule ตามที่กำหนด (HH:MM)
async function setCustomScheduleTime(timeStr) {
  console.log('[TikTok] Setting custom schedule time:', timeStr);
  updateTikTokOverlay('กำลังตั้งเวลา...', timeStr);

  // แยก hour และ minute จาก timeStr (format: HH:MM)
  const [hourStr, minuteStr] = timeStr.split(':');
  const targetHour = parseInt(hourStr);
  const targetMinute = parseInt(minuteStr);

  console.log(`[TikTok] Target time: ${targetHour}:${targetMinute.toString().padStart(2, '0')}`);

  // v7.3.1: ใช้ retry loop แทน fixed delay - รอให้ UI พร้อมจริงๆ
  let timeInput = null;
  const maxAttempts = 10;
  const attemptDelay = 500;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`[TikTok] Finding time input attempt ${attempt}/${maxAttempts}...`);

    // วิธี 1: TUXTextInputCore-input[readonly] ที่มี value เป็นเวลา
    const timeInputs = document.querySelectorAll('input.TUXTextInputCore-input[readonly]');

    for (const input of timeInputs) {
      // รองรับ 24h format (HH:MM)
      if (input.value && input.value.match(/^\d{2}:\d{2}$/)) {
        timeInput = input;
        console.log('[TikTok] ✓ Found time input (24h format):', input.value);
        break;
      }
      // รองรับ 12h AM/PM format
      if (input.value && input.value.match(/^\d{1,2}:\d{2}\s*(AM|PM)?$/i)) {
        timeInput = input;
        console.log('[TikTok] ✓ Found time input (12h format):', input.value);
        break;
      }
    }

    // วิธี 2: หา input ทั้งหมดที่ readonly และมีค่าเป็นเวลา
    if (!timeInput) {
      const allInputs = document.querySelectorAll('input[readonly]');
      for (const input of allInputs) {
        const val = input.value || '';
        if (val.includes(':') && val.length <= 10 && !val.includes('-')) {
          console.log('[TikTok] ✓ Found time input (fallback):', val);
          timeInput = input;
          break;
        }
      }
    }

    if (timeInput) {
      break;
    }

    if (attempt < maxAttempts) {
      console.log(`[TikTok] Time input not found yet, waiting ${attemptDelay}ms...`);
      await delay(attemptDelay);
    }
  }

  if (!timeInput) {
    console.log('[TikTok] ❌ Time input not found after all attempts');
    updateTikTokOverlay('⚠️ ไม่พบช่องเวลา', 'ใช้เวลาอัตโนมัติแทน');
    // Fallback: ใช้ adjustScheduleTime แทน
    await adjustScheduleTime();
    return;
  }

  // คลิกที่ input เพื่อเปิด dropdown
  console.log('[TikTok] Clicking time input to open dropdown...');
  timeInput.click();
  await delay(500);

  // เลือกชั่วโมง
  const hourOptions = document.querySelectorAll('.tiktok-timepicker-option-text.tiktok-timepicker-left');
  if (hourOptions.length > 0) {
    let hourFound = false;
    for (const opt of hourOptions) {
      const hourText = opt.textContent.trim();
      const hourNum = parseInt(hourText);
      if (hourNum === targetHour) {
        console.log('[TikTok] Selecting hour:', hourText);
        opt.click();
        hourFound = true;
        await delay(300);
        break;
      }
    }
    if (!hourFound) {
      console.log('[TikTok] Target hour not found in dropdown');
    }
  }

  // เลือกนาที - TikTok รองรับแค่ 00, 05, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55
  const minuteOptions = document.querySelectorAll('.tiktok-timepicker-option-text.tiktok-timepicker-right');
  if (minuteOptions.length > 0) {
    let minuteFound = false;
    // v10.0: ปัดนาทีให้ลงตัว 5 และจัดการกรณีเกิน 60
    let roundedMinute = Math.round(targetMinute / 5) * 5;
    let adjustedHour = targetHour;

    // ถ้าปัดแล้วเกิน 60 ต้องเพิ่มชั่วโมง (แม้ว่า popup.js ควรจัดการแล้ว แต่เผื่อ edge case)
    if (roundedMinute >= 60) {
      roundedMinute = 0;
      adjustedHour = (targetHour + 1) % 24;
      console.log(`[TikTok] v10.0: Minute overflow! Adjusted to ${adjustedHour}:00`);
      // ต้องเลือกชั่วโมงใหม่ด้วย
      for (const opt of hourOptions) {
        const hourText = opt.textContent.trim();
        const hourNum = parseInt(hourText);
        if (hourNum === adjustedHour) {
          console.log('[TikTok] Re-selecting hour due to minute overflow:', hourText);
          opt.click();
          await delay(300);
          break;
        }
      }
    }
    console.log(`[TikTok] Target minute: ${targetMinute} -> Rounded: ${roundedMinute}`);

    for (const opt of minuteOptions) {
      const minText = opt.textContent.trim();
      const minNum = parseInt(minText);
      if (minNum === roundedMinute) {
        console.log('[TikTok] Selecting minute:', minText);
        opt.click();
        minuteFound = true;
        await delay(300);
        break;
      }
    }
    // ถ้าไม่เจอตรงๆ ลองหาตัวที่มากกว่าหรือเท่ากับ
    if (!minuteFound) {
      for (const opt of minuteOptions) {
        const minText = opt.textContent.trim();
        const minNum = parseInt(minText);
        if (minNum >= roundedMinute) {
          console.log('[TikTok] Selecting nearest minute:', minText);
          opt.click();
          await delay(300);
          break;
        }
      }
    }
  }

  // คลิกที่อื่นเพื่อปิด dropdown
  await delay(300);
  document.body.click();

  console.log('[TikTok] Custom time setting complete');
}

// v6.0.2: เลือกวันที่โพสล่วงหน้า
async function selectScheduleDate(targetDate) {
  console.log('[TikTok] Selecting schedule date:', targetDate);

  // targetDate format: YYYY-MM-DD
  // TikTok date input มี format เดียวกัน

  // หา date input (TUXTextInputCore-input ที่มี value เป็นวันที่ เช่น "2025-12-10")
  const dateInputs = document.querySelectorAll('input.TUXTextInputCore-input[readonly]');
  let dateInput = null;

  for (const input of dateInputs) {
    if (input.value && input.value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      dateInput = input;
      console.log('[TikTok] Found date input with value:', input.value);
      break;
    }
  }

  if (!dateInput) {
    console.log('[TikTok] Date input not found');
    return false;
  }

  // ถ้าวันที่ตรงกันแล้ว ไม่ต้องเปลี่ยน
  if (dateInput.value === targetDate) {
    console.log('[TikTok] Date already matches, skipping');
    return true;
  }

  // v8.3: คลิก parent container ของ date input เพื่อเปิด calendar
  console.log('[TikTok] Clicking date input to open calendar...');

  // หา scheduled-picker container (parent ของ date input)
  const scheduledPicker = dateInput.closest('[class*="scheduled-picker"]') || dateInput.closest('[class*="date"]');
  if (scheduledPicker) {
    console.log('[TikTok] Found scheduled-picker, clicking...');
    scheduledPicker.click();
    await delay(1000);
  } else {
    // Fallback: คลิก input โดยตรง
    dateInput.click();
    await delay(800);
  }

  // v8.3: ลองคลิก input อีกครั้งถ้า calendar ยังไม่เปิด
  let calendarWrapper = document.querySelector('[class*="calendar-wrapper"], [class*="calendar"]');
  if (!calendarWrapper) {
    console.log('[TikTok] Calendar not open, clicking input again...');
    dateInput.focus();
    dateInput.click();
    await delay(1000);
  }

  // หา wrapper ที่มี arrow icon แล้วคลิก
  const dateWrapper = dateInput.closest('.TUXTextInputCore');
  if (dateWrapper && !document.querySelector('[class*="calendar-wrapper"]')) {
    const arrowIcon = dateWrapper.querySelector('[data-icon="ArrowDown"], .TUXTextInputCore-trailingIconWrapper, svg');
    if (arrowIcon) {
      console.log('[TikTok] Clicking arrow icon...');
      arrowIcon.click();
      await delay(1000);
    }
  }

  // Parse target date
  const [targetYear, targetMonth, targetDay] = targetDate.split('-').map(Number);
  const targetDateObj = new Date(targetYear, targetMonth - 1, targetDay);

  console.log('[TikTok] Target date:', targetYear, targetMonth, targetDay);

  // v8.3: รอให้ calendar เปิด และ debug
  await delay(500);

  // Debug: แสดง calendar wrapper ที่เจอ
  calendarWrapper = document.querySelector('[class*="calendar-wrapper"], [class*="calendar"]');
  console.log('[TikTok] Calendar wrapper found:', calendarWrapper ? 'YES' : 'NO');
  if (calendarWrapper) {
    console.log('[TikTok] Calendar wrapper classes:', calendarWrapper.className);
  }

  // หา calendar grid - TikTok อาจใช้ table หรือ div grid
  await delay(500);

  // v8.3: TikTok calendar structure (จาก DevTools):
  // - div.day-span-container > span.day.valid
  // - class มี prefix jsx-xxx เช่น "jsx-1793871833 day-span-container"

  // Pattern 1: TikTok specific - หา span ที่มี class "day" และ "valid" (clickable days)
  let dayCells = document.querySelectorAll('span[class*="day"][class*="valid"]');
  console.log('[TikTok] Pattern 1 (span.day.valid):', dayCells.length);

  // Pattern 2: หา span ภายใน day-span-container
  if (dayCells.length === 0) {
    dayCells = document.querySelectorAll('[class*="day-span-container"] span');
    console.log('[TikTok] Pattern 2 (day-span-container span):', dayCells.length);
  }

  // Pattern 3: หา span ภายใน calendar-wrapper
  if (dayCells.length === 0 && calendarWrapper) {
    dayCells = calendarWrapper.querySelectorAll('span');
    console.log('[TikTok] Pattern 3 (calendar-wrapper span):', dayCells.length);
  }

  // Pattern 4: หา td[role="gridcell"] (fallback)
  if (dayCells.length === 0) {
    dayCells = document.querySelectorAll('td[role="gridcell"], [role="gridcell"]');
    console.log('[TikTok] Pattern 4 (gridcell):', dayCells.length);
  }

  // Pattern 5: หา div/span ที่มี class calendar/day
  if (dayCells.length === 0) {
    dayCells = document.querySelectorAll('[class*="calendar"] [class*="day"], [class*="datepicker"] [class*="cell"]');
    console.log('[TikTok] Pattern 5 (calendar day):', dayCells.length);
  }

  // Pattern 6: หา span ที่มี textContent เป็นเลข 1-31 (ภายใน calendar area)
  if (dayCells.length === 0) {
    const allSpans = document.querySelectorAll('[class*="calendar"] span, [class*="days"] span');
    dayCells = Array.from(allSpans).filter(span => {
      const text = span.textContent.trim();
      const num = parseInt(text);
      return !isNaN(num) && num >= 1 && num <= 31 && span.offsetWidth > 0;
    });
    console.log('[TikTok] Pattern 6 (calendar span with number):', dayCells.length);
  }

  console.log('[TikTok] Found potential day cells:', dayCells.length);

  // v8.3: Debug - แสดง element ทั้งหมดที่อาจเป็น calendar
  if (dayCells.length === 0) {
    const calendarElements = document.querySelectorAll('[class*="calendar"], [class*="picker"], [class*="days"]');
    console.log('[TikTok] DEBUG - Calendar-like elements found:', calendarElements.length);
    calendarElements.forEach((el, i) => {
      console.log(`[TikTok] DEBUG element ${i}:`, el.className, el.tagName);
    });
  }

  // หาวันที่ตรงกับ target day
  // v8.3: ต้องเช็ค text content ให้ตรงทั้งตัว (ไม่ใช่แค่ includes)
  for (const cell of dayCells) {
    const text = cell.textContent.trim();
    // ต้องเป็นเลขตัวเดียวที่ตรงกับ targetDay พอดี
    if (text === String(targetDay)) {
      // เช็คว่าไม่ใช่วันที่ disabled
      const isDisabled = cell.classList.contains('disabled') ||
                         cell.getAttribute('aria-disabled') === 'true' ||
                         cell.closest('[class*="disabled"]');

      // v8.3: เช็คว่ามี class "valid" หรือไม่ (ถ้ามี แสดงว่าเลือกได้)
      const hasValidClass = cell.className.includes('valid');

      if (!isDisabled) {
        console.log('[TikTok] Found target day cell:', text, 'valid:', hasValidClass, 'classes:', cell.className);
        cell.click();
        await delay(500);

        // เช็คว่าค่าเปลี่ยนหรือยัง
        if (dateInput.value === targetDate) {
          console.log('[TikTok] Date successfully changed to:', targetDate);
          return true;
        } else {
          console.log('[TikTok] Date input value after click:', dateInput.value, '(expected:', targetDate, ')');
        }
      }
    }
  }

  // v3.5: ถ้าไม่เจอวันที่ → ต้องเปลี่ยนเดือนก่อน
  console.log('[TikTok v3.5] Target day not found in current month, navigating to correct month...');

  const MONTH_NAMES = ['January','February','March','April','May','June',
                       'July','August','September','October','November','December'];

  // อ่านเดือน/ปีที่แสดงอยู่ใน picker
  function getCurrentPickerMonth() {
    const titleWrap = document.querySelector('.calendar-wrapper .title-wrapper');
    if (!titleWrap) return null;
    const spans = titleWrap.querySelectorAll('span');
    const monthName = spans[0]?.textContent?.trim();
    const yearText = spans[2]?.textContent?.trim();
    const year = parseInt(yearText, 10);
    const monthIndex = MONTH_NAMES.indexOf(monthName);
    if (monthIndex < 0 || isNaN(year)) return null;
    return { monthIndex, year };
  }

  // นำทางไปยังเดือนที่ต้องการ
  const targetMonthIndex = targetMonth - 1;
  const MAX_NAV_STEPS = 12;

  for (let step = 0; step < MAX_NAV_STEPS; step++) {
    const cur = getCurrentPickerMonth();
    if (!cur) {
      console.log('[TikTok v3.5] Cannot read current picker month');
      break;
    }

    const delta = (targetYear - cur.year) * 12 + (targetMonthIndex - cur.monthIndex);
    console.log(`[TikTok v3.5] Current: ${MONTH_NAMES[cur.monthIndex]} ${cur.year}, Target: ${MONTH_NAMES[targetMonthIndex]} ${targetYear}, delta: ${delta}`);

    if (delta === 0) break; // ถึงเดือนที่ต้องการแล้ว

    // กดปุ่มลูกศร
    const arrows = document.querySelectorAll('.month-header-wrapper .arrow');
    if (arrows.length < 2) {
      console.log('[TikTok v3.5] Arrow buttons not found');
      break;
    }

    const btn = delta > 0 ? arrows[1] : arrows[0]; // > = next, < = prev
    console.log(`[TikTok v3.5] Clicking ${delta > 0 ? 'next' : 'prev'} arrow...`);
    btn.click();
    await delay(300); // รอ React re-render
  }

  // ลองเลือกวันที่อีกครั้งหลังเปลี่ยนเดือน
  await delay(300);
  const dayCellsRetry = document.querySelectorAll('span[class*="day"][class*="valid"]');
  console.log(`[TikTok v3.5] After nav: found ${dayCellsRetry.length} valid day cells`);

  for (const cell of dayCellsRetry) {
    const text = cell.textContent.trim();
    if (text === String(targetDay)) {
      console.log('[TikTok v3.5] Found target day after month navigation:', text);
      cell.click();
      await delay(500);

      if (dateInput.value === targetDate) {
        console.log('[TikTok v3.5] ✅ Date successfully changed to:', targetDate);
        return true;
      }
    }
  }

  // Fallback: ปิด picker
  await delay(300);
  document.body.click();
  console.log('[TikTok v3.5] Date selection complete (may not have found target day)');
  return false;
}

// Step 5a: Disclose post content
// v2.3: คลิก TikTok checkbox — ใช้ exact structure จาก TikTok Studio
// Structure: div.title-line > [label.Checkbox__root, span.TUXText("Your brand"), div.Tooltip]
// text เป็น SIBLING ของ label (ไม่ได้อยู่ข้างใน!)
async function clickTikTokCheckboxByText(targetText) {
  console.log(`[TikTok v2.3] Looking for checkbox: "${targetText}"`);

  // หา span.TUXText ที่มี text ตรงกัน
  const textSpans = document.querySelectorAll('span[class*="TUXText"]');
  for (const span of textSpans) {
    if ((span.textContent || '').trim() !== targetText) continue;
    if (!span.offsetParent) continue;

    console.log(`[TikTok v2.3] ✅ Found TUXText "${targetText}"`);

    // หา label.Checkbox__root ใน parent เดียวกัน (div.title-line)
    const titleLine = span.parentElement;
    if (!titleLine) continue;

    const label = titleLine.querySelector('label[class*="Checkbox__root"]');
    if (!label) {
      console.log(`[TikTok v2.3] ⚠️ No Checkbox__root in title-line`);
      continue;
    }

    const isChecked = label.getAttribute('data-checked') === 'true';
    if (isChecked) {
      console.log(`[TikTok v2.3] ✅ "${targetText}" already checked`);
      return true;
    }

    // คลิก label (React จัดการ toggle)
    label.click();
    console.log(`[TikTok v2.3] Clicked label sibling of "${targetText}"`);
    await delay(800);

    if (label.getAttribute('data-checked') === 'true') {
      console.log(`[TikTok v2.3] ✅ "${targetText}" checked successfully!`);
      return true;
    }

    // fallback: คลิก input โดยตรง
    const input = label.querySelector('input[type="checkbox"]');
    if (input) {
      input.click();
      await delay(500);
      console.log(`[TikTok v2.3] Fallback: clicked input`);
    }
    return true;
  }

  console.log(`[TikTok v2.3] ⚠️ No TUXText found for "${targetText}"`);
  return false;
}

// legacy wrapper for old code
async function clickTikTokCheckbox(wrapper) {
  if (!wrapper) return false;
  const label = wrapper.closest('label[class*="Checkbox__root"]');
  if (label) { label.click(); await delay(500); return true; }
  wrapper.click(); await delay(500);
  return true;
}

async function setDiscloseContent(discloseType = 'your_brand') {
  console.log('[TikTok] Step 5a: Set Disclose post content');
  updateTikTokOverlay('กำลังเปิด Disclose...', discloseType);

  // เลื่อนลง + กด Show more
  window.scrollTo(0, document.body.scrollHeight);
  await delay(500);

  const allSpans = document.querySelectorAll('span');
  for (const span of allSpans) {
    if (span.textContent.trim() === 'Show more') {
      span.click();
      await delay(1000);
      break;
    }
  }

  window.scrollTo(0, document.body.scrollHeight);
  await delay(500);

  // หา Disclose post content toggle
  let discloseToggle = null;

  // วิธี 1: หาจากข้อความ "Disclose post content"
  const labels = document.querySelectorAll('span, div, label');
  for (const el of labels) {
    const text = el.textContent.trim();
    if (text === 'Disclose post content') {
      console.log('[TikTok] Found "Disclose post content" label');
      let parent = el.parentElement;
      for (let i = 0; i < 5 && parent; i++) {
        const switchEl = parent.querySelector('[data-part="thumb"], .Switch__content, .Switch__input');
        if (switchEl) {
          discloseToggle = switchEl;
          console.log('[TikTok] Found Disclose toggle near label');
          break;
        }
        parent = parent.parentElement;
      }
      if (discloseToggle) break;
    }
  }

  // วิธี 2: หา switch ตัวแรก (Disclose มักอยู่ก่อน AI-generated)
  if (!discloseToggle) {
    const switches = document.querySelectorAll('[data-part="thumb"]');
    if (switches.length > 0) {
      // Disclose คือตัวแรก
      discloseToggle = switches[0];
      console.log('[TikTok] Using first switch as Disclose');
    }
  }

  if (!discloseToggle) {
    // Fallback: หา Switch__content-checked-false ตัวแรก
    const unchecked = document.querySelectorAll('.Switch__content--checked-false');
    if (unchecked.length > 0) {
      discloseToggle = unchecked[0];
      console.log('[TikTok] Using first unchecked switch as Disclose');
    }
  }

  if (discloseToggle) {
    // เช็คว่าเปิดอยู่หรือยัง
    const isChecked = discloseToggle.getAttribute('data-state') === 'checked' ||
                      discloseToggle.classList.contains('Switch__thumb--checked-true') ||
                      discloseToggle.classList.contains('Switch__content--checked-true');

    if (!isChecked) {
      console.log('[TikTok] Clicking Disclose toggle to turn ON...');
      discloseToggle.click();
      await delay(500);

      // ถ้า click ไม่ทำงาน ลองหา input ข้างใน
      const innerInput = discloseToggle.closest('[data-part="root"]')?.querySelector('input');
      if (innerInput && !innerInput.checked) {
        innerInput.click();
        console.log('[TikTok] Clicked Disclose inner input');
      }
      await delay(1000);
    } else {
      console.log('[TikTok] Disclose already ON');
    }

    // เลือก Your brand หรือ Branded content
    const targetText = discloseType === 'branded_content' ? 'Branded content' : 'Your brand';
    console.log(`[TikTok] Selecting disclose type: ${targetText}`);
    await delay(1000);

    // v2.3: วิธีใหม่ — หาจาก text + คลิก label.Checkbox__root ตรงๆ
    const directResult = await clickTikTokCheckboxByText(targetText);
    if (directResult) {
      console.log(`[TikTok v2.3] ✅ Direct method worked for "${targetText}"`);
      console.log('[TikTok] Disclose post content set');
      await delay(500);
      return true;
    }

    // === Fallback: วิธีเดิม (กรณี structure เปลี่ยน) ===
    console.log(`[TikTok v2.3] Direct method failed, trying legacy methods...`);

    // === หา Disclose section ก่อน — จำกัด scope ไม่ให้ไปเจอ checkbox อื่น (Comment, Reuse) ===
    // หา container ของ Disclose โดยขึ้นจาก toggle ที่เจอ (ไม่เกิน 8 ชั้น)
    // จนเจอ container ที่มีทั้ง "Your brand" และ "Branded content"
    let discloseSection = null;
    let searchParent = discloseToggle.parentElement;
    for (let i = 0; i < 8 && searchParent; i++) {
      const text = searchParent.textContent || '';
      if (text.includes('Your brand') && text.includes('Branded content')) {
        discloseSection = searchParent;
        console.log(`[TikTok] Found Disclose section at parent level ${i}`);
        break;
      }
      searchParent = searchParent.parentElement;
    }

    let clicked = false;

    if (discloseSection) {
      // หา checkbox เฉพาะใน Disclose section
      const sectionWrappers = discloseSection.querySelectorAll('[class*="Checkbox__inputWrapper"]');
      console.log(`[TikTok] Found ${sectionWrappers.length} checkboxes in Disclose section`);

      // วิธี 1: จับคู่ checkbox กับ text ใกล้เคียง (วน wrapper แล้วดู text ใน parent)
      for (const w of sectionWrappers) {
        // ดู text ใน parent ที่ใกล้ที่สุด (container ตรง)
        const container = w.parentElement;
        if (!container) continue;
        const containerText = container.textContent || '';
        const wrappersInContainer = container.querySelectorAll('[class*="Checkbox__inputWrapper"]');

        if (wrappersInContainer.length === 1 && containerText.includes(targetText)) {
          const isChecked = w.getAttribute('aria-checked') === 'true' ||
                           w.getAttribute('data-checked') === 'true' ||
                           w.classList.contains('Checkbox__inputWrapper--checked-true');
          if (!isChecked) {
            console.log(`[TikTok] Clicking checkbox for "${targetText}" (section container match)`);
            await clickTikTokCheckbox(w);
          } else {
            console.log(`[TikTok] "${targetText}" already checked (section)`);
          }
          clicked = true;
          break;
        }
      }

      // วิธี 2: index ภายใน Disclose section (Your brand = 0, Branded content = 1)
      if (!clicked && sectionWrappers.length >= 2) {
        const idx = discloseType === 'branded_content' ? (sectionWrappers.length - 1) : 0;
        console.log(`[TikTok] Section index-based: ${sectionWrappers.length} wrappers, using index ${idx}`);
        const w = sectionWrappers[idx];
        const isChecked = w.getAttribute('aria-checked') === 'true' ||
                         w.getAttribute('data-checked') === 'true' ||
                         w.classList.contains('Checkbox__inputWrapper--checked-true');
        if (!isChecked) {
          console.log(`[TikTok] Section index: clicking wrapper[${idx}] for "${targetText}"`);
          await clickTikTokCheckbox(w);
        } else {
          console.log(`[TikTok] Section index: wrapper[${idx}] already checked`);
        }
        clicked = true;
      }
    }

    // วิธี 3: หาจาก text "Branded content" / "Your brand" แล้วหา checkbox ใกล้ที่สุด
    if (!clicked) {
      console.log(`[TikTok] Method 3: text proximity search...`);
      const allEls = document.querySelectorAll('span, label, p, div');
      for (const el of allEls) {
        const t = (el.textContent || '').trim();
        // ต้อง exact match หรือ el เป็น leaf node (ไม่มี child element ที่มี text)
        if (t !== targetText) continue;
        // ต้องเป็น leaf-like (ไม่มี child ที่มี checkbox)
        if (el.querySelector && el.querySelector('[class*="Checkbox__inputWrapper"]')) continue;

        console.log(`[TikTok] Found exact text "${targetText}" in <${el.tagName}>`);

        // หา checkbox: ดู sibling, parent's children
        const siblings = el.parentElement ? Array.from(el.parentElement.children) : [];
        let wrapper = null;
        for (const sib of siblings) {
          if (sib !== el && sib.matches && sib.matches('[class*="Checkbox__inputWrapper"]')) {
            wrapper = sib;
            break;
          }
          // ลอง querySelector ใน sibling
          if (sib !== el && sib.querySelector) {
            const inner = sib.querySelector('[class*="Checkbox__inputWrapper"]');
            if (inner) { wrapper = inner; break; }
          }
        }

        if (wrapper) {
          const isChecked = wrapper.getAttribute('aria-checked') === 'true' ||
                           wrapper.getAttribute('data-checked') === 'true' ||
                           wrapper.classList.contains('Checkbox__inputWrapper--checked-true');
          if (!isChecked) {
            console.log(`[TikTok] Text proximity: clicking checkbox for "${targetText}"`);
            await clickTikTokCheckbox(wrapper);
          } else {
            console.log(`[TikTok] Text proximity: "${targetText}" already checked`);
          }
          clicked = true;
          break;
        }
      }
    }

    // v2.3 วิธี 4: Fallback — หา input[type="checkbox"] ใกล้ text targetText
    if (!clicked) {
      console.log(`[TikTok] Method 4: input[type=checkbox] near text...`);
      const allTexts = document.querySelectorAll('span, label, p');
      for (const el of allTexts) {
        if ((el.textContent || '').trim() !== targetText) continue;
        // หา checkbox ใน parent chain (สูงสุด 5 ชั้น)
        let p = el.parentElement;
        for (let d = 0; d < 5 && p; d++) {
          const cb = p.querySelector('input[type="checkbox"]');
          if (cb && !cb.checked) {
            console.log(`[TikTok] Method 4: clicking input[checkbox] near "${targetText}"`);
            cb.click();
            await delay(500);
            clicked = true;
            break;
          } else if (cb && cb.checked) {
            console.log(`[TikTok] Method 4: "${targetText}" already checked`);
            clicked = true;
            break;
          }
          p = p.parentElement;
        }
        if (clicked) break;
      }
    }

    // v2.3 วิธี 5: Nuclear fallback — หา container ที่มี targetText แล้ว click ตัว container เลย
    if (!clicked) {
      console.log(`[TikTok] Method 5: click container with text "${targetText}"...`);
      const containers = document.querySelectorAll('div, label');
      for (const c of containers) {
        const t = (c.textContent || '').trim();
        const rect = c.getBoundingClientRect();
        if (t === targetText && rect.width > 0 && rect.width < 300 && rect.height < 50) {
          console.log(`[TikTok] Method 5: clicking container <${c.tagName}> with "${targetText}"`);
          c.click();
          await delay(500);
          clicked = true;
          break;
        }
      }
    }

    if (!clicked) {
      console.log(`[TikTok] ⚠️ Could not find checkbox for "${targetText}" after 5 methods`);
    }

    console.log('[TikTok] Disclose post content set');
  } else {
    console.log('[TikTok] Disclose toggle not found, skipping');
  }

  await delay(500);
  return true;
}

// Step 5b: ติ๊ก AI-generated content
async function setAIContent() {
  console.log('[TikTok] Step 5: Set AI-generated content');
  updateTikTokOverlay('กำลังติ๊ก AI-generated...', 'สำคัญมาก!');

  // เลื่อนลงไปดู settings
  window.scrollTo(0, document.body.scrollHeight);
  await delay(500);

  // === ต้องกด "Show more" ก่อน ===
  console.log('[TikTok] Looking for "Show more" button...');

  let showMoreBtn = null;
  const allSpans = document.querySelectorAll('span');
  for (const span of allSpans) {
    if (span.textContent.trim() === 'Show more') {
      showMoreBtn = span;
      console.log('[TikTok] Found "Show more" span');
      break;
    }
  }

  if (showMoreBtn) {
    console.log('[TikTok] Clicking "Show more"...');
    showMoreBtn.click();
    await delay(1000);
  } else {
    console.log('[TikTok] "Show more" not found, maybe already expanded');
  }

  // เลื่อนลงอีกครั้งหลังกด Show more
  window.scrollTo(0, document.body.scrollHeight);
  await delay(500);

  // หา AI-generated content toggle
  // สำคัญ: ต้องหาตัวที่อยู่ใกล้ข้อความ "AI-generated" หรือ "aigc"
  // ไม่ใช่ตัวแรกที่เจอ (เพราะมี Disclose post content อยู่ก่อน)
  console.log('[TikTok] Looking for AI-generated content toggle...');

  let aiToggle = null;

  // วิธีที่ 1: หาจากข้อความ "Add this label for aigc." แล้วหา switch ที่ใกล้ที่สุด
  const aigcHint = Array.from(document.querySelectorAll('span')).find(
    el => el.textContent.includes('aigc') || el.textContent.includes('AI-generated')
  );

  if (aigcHint) {
    console.log('[TikTok] Found aigc hint text');
    // หา switch ใน parent container
    let parent = aigcHint.parentElement;
    for (let i = 0; i < 5 && parent; i++) {
      const switchEl = parent.querySelector('.Switch__content, .Switch__input');
      if (switchEl) {
        aiToggle = switchEl;
        console.log('[TikTok] Found AI toggle near aigc hint');
        break;
      }
      parent = parent.parentElement;
    }
  }

  // วิธีที่ 2: หาจากข้อความ "AI-generated content"
  if (!aiToggle) {
    const aiLabels = document.querySelectorAll('span, div, label');
    for (const el of aiLabels) {
      const text = el.textContent.trim();
      if (text === 'AI-generated content') {
        console.log('[TikTok] Found "AI-generated content" label');
        // หา switch ใน parent
        let parent = el.parentElement;
        for (let i = 0; i < 5 && parent; i++) {
          const switchEl = parent.querySelector('.Switch__content, .Switch__input');
          if (switchEl) {
            aiToggle = switchEl;
            console.log('[TikTok] Found AI toggle near label');
            break;
          }
          parent = parent.parentElement;
        }
        if (aiToggle) break;
      }
    }
  }

  // วิธีที่ 3: หา switch ตัวสุดท้าย (AI-generated มักอยู่หลัง Disclose)
  if (!aiToggle) {
    const allSwitches = document.querySelectorAll('.Switch__content--checked-false');
    console.log('[TikTok] Found unchecked switches:', allSwitches.length);

    if (allSwitches.length >= 2) {
      // เอาตัวที่ 2 (index 1) เพราะตัวแรกคือ Disclose
      aiToggle = allSwitches[1];
      console.log('[TikTok] Using second switch (AI-generated)');
    } else if (allSwitches.length === 1) {
      aiToggle = allSwitches[0];
      console.log('[TikTok] Using only switch found');
    }
  }

  if (aiToggle) {
    // เช็คว่าเปิดอยู่หรือยัง
    const isChecked = aiToggle.classList.contains('Switch__content--checked-true') ||
                      aiToggle.getAttribute('aria-checked') === 'true' ||
                      aiToggle.getAttribute('data-state') === 'checked';

    if (!isChecked) {
      console.log('[TikTok] Clicking AI toggle to turn ON...');
      aiToggle.click();
      await delay(300);

      // ถ้า click ที่ div ไม่ทำงาน ลองหา input ข้างใน
      const innerInput = aiToggle.querySelector('input[type="checkbox"]');
      if (innerInput && !innerInput.checked) {
        innerInput.click();
        console.log('[TikTok] Clicked inner checkbox');
      }

      console.log('[TikTok] AI-generated toggled ON');
    } else {
      console.log('[TikTok] AI-generated already ON');
    }
  } else {
    console.log('[TikTok] AI toggle not found, skipping...');
  }

  await delay(500);
  return true;
}

// === v5.5: Handle "Continue to post?" dialog ===
// Dialog ถามว่าจะโพสต่อไหมขณะ TikTok ยังเช็ควิดีโออยู่
async function handleContinueToPostDialog() {
  console.log('[TikTok] Checking for "Continue to post?" dialog...');

  // หา dialog ที่มีข้อความ "Continue to post?"
  const allText = document.body.innerText || '';
  if (!allText.includes('Continue to post?')) {
    console.log('[TikTok] No "Continue to post?" dialog found');
    return false;
  }

  console.log('[TikTok] Found "Continue to post?" dialog!');
  updateTikTokOverlay('พบ Dialog ยืนยัน...', 'กำลังกด Post now');

  // หาปุ่ม "Post now" - ใช้ TUXButton-label
  let postNowBtn = null;

  // วิธีที่ 1: หาจาก TUXButton-label ที่มีข้อความ "Post now"
  const tuxLabels = document.querySelectorAll('.TUXButton-label');
  for (const label of tuxLabels) {
    if (label.textContent.trim() === 'Post now') {
      postNowBtn = label.closest('button');
      if (postNowBtn && postNowBtn.offsetParent !== null) {
        console.log('[TikTok] Found "Post now" button via TUXButton-label');
        break;
      }
      postNowBtn = null;
    }
  }

  // วิธีที่ 2: หาจาก button ที่มี class TUXButton--primary และ text "Post now"
  if (!postNowBtn) {
    const primaryBtns = document.querySelectorAll('.TUXButton--primary, button[class*="primary"]');
    for (const btn of primaryBtns) {
      if (btn.textContent.trim().includes('Post now')) {
        postNowBtn = btn;
        console.log('[TikTok] Found "Post now" button via primary class');
        break;
      }
    }
  }

  // วิธีที่ 3: หาจาก button โดยตรง
  if (!postNowBtn) {
    const allBtns = document.querySelectorAll('button');
    for (const btn of allBtns) {
      if (btn.textContent.trim() === 'Post now' && btn.offsetParent !== null) {
        postNowBtn = btn;
        console.log('[TikTok] Found "Post now" button directly');
        break;
      }
    }
  }

  if (postNowBtn) {
    console.log('[TikTok] Clicking "Post now" button...');

    // คลิกปุ่ม
    postNowBtn.focus();
    postNowBtn.click();

    // ถ้า click ไม่ทำงาน ลอง dispatch events
    postNowBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    postNowBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    postNowBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await delay(1000);
    console.log('[TikTok] "Post now" clicked!');
    return true;
  } else {
    console.log('[TikTok] "Post now" button not found in dialog');
    return false;
  }
}

// ===== v9.4: VIDEO LOADING ERROR RECOVERY =====
// ตรวจจับ error "Something went wrong" และทำ recovery อัตโนมัติ

// ตรวจจับว่ามี "Something went wrong" error หรือไม่
function checkSomethingWentWrongError() {
  const allText = document.body.innerText || '';
  // ตรวจจับ error message จาก TikTok
  if (allText.includes('Something went wrong') ||
      allText.includes('You can try again or replace it with a different video')) {
    console.log('[TikTok] Detected "Something went wrong" error!');
    return true;
  }
  return false;
}

// v11: ตรวจจับว่า TikTok แจ้ง schedule limit เต็ม 30 โพสหรือไม่
function checkScheduleLimitError() {
  // วิธีที่ 1: หา Toast element โดยเฉพาะ (TUXTopToast)
  const toastElements = document.querySelectorAll('.TUXTopToast-content, [class*="TopToast"], [class*="toast"], [class*="Toast"]');
  for (const toast of toastElements) {
    const text = toast.textContent || '';
    if (text.includes('only schedule up to 30') ||
        text.includes('schedule up to 30 posts') ||
        text.includes('can only schedule')) {
      console.log('[TikTok] Detected "Schedule limit 30 posts" in Toast!');
      return true;
    }
  }

  // วิธีที่ 2: หาจาก body text (fallback)
  const allText = document.body.innerText || '';
  if (allText.includes('You can only schedule up to 30 posts') ||
      allText.includes('schedule up to 30') ||
      allText.includes('can only schedule up to')) {
    console.log('[TikTok] Detected "Schedule limit 30 posts" in body text!');
    return true;
  }
  return false;
}

// ตรวจจับ "A video you were editing wasn't saved" banner และกด Continue
async function handleVideoRecoveryBanner() {
  console.log('[TikTok] Checking for video recovery banner...');

  const allText = document.body.innerText || '';
  if (!allText.includes("A video you were editing wasn't saved") &&
      !allText.includes("Continue editing?")) {
    console.log('[TikTok] No recovery banner found');
    return false;
  }

  console.log('[TikTok] Found "A video you were editing wasn\'t saved" banner!');
  updateTikTokOverlay('พบ Video Recovery...', 'กำลังกด Continue');

  // หาปุ่ม Continue (อยู่ข้าง Discard)
  let continueBtn = null;

  // วิธีที่ 1: หาจาก button ที่มีข้อความ "Continue"
  const allButtons = document.querySelectorAll('button');
  for (const btn of allButtons) {
    const text = btn.textContent.trim();
    if (text === 'Continue' && btn.offsetParent !== null) {
      continueBtn = btn;
      console.log('[TikTok] Found Continue button via text');
      break;
    }
  }

  // วิธีที่ 2: หาจาก TUXButton-label
  if (!continueBtn) {
    const tuxLabels = document.querySelectorAll('.TUXButton-label');
    for (const label of tuxLabels) {
      if (label.textContent.trim() === 'Continue') {
        continueBtn = label.closest('button');
        if (continueBtn && continueBtn.offsetParent !== null) {
          console.log('[TikTok] Found Continue button via TUXButton-label');
          break;
        }
        continueBtn = null;
      }
    }
  }

  if (continueBtn) {
    console.log('[TikTok] Clicking Continue button...');
    continueBtn.focus();
    continueBtn.click();

    // Dispatch events เพิ่มเติม
    continueBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    continueBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    continueBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await delay(1000);
    console.log('[TikTok] Continue button clicked!');
    return true;
  } else {
    console.log('[TikTok] Continue button not found');
    return false;
  }
}

// ทำ Recovery: Reload หน้าเว็บและเตรียม state
async function initiateVideoLoadingRecovery(recoveryData) {
  console.log('[TikTok] Initiating video loading recovery...');
  updateTikTokOverlay('กำลัง Recovery...', 'รีโหลดหน้าเว็บ');

  // เก็บ recovery state ลงใน sessionStorage
  const recoveryState = {
    timestamp: Date.now(),
    action: 'video_loading_recovery',
    data: recoveryData
  };
  sessionStorage.setItem('pd_tiktok_recovery', JSON.stringify(recoveryState));
  console.log('[TikTok] Saved recovery state:', recoveryState);

  await delay(1000);

  // Bypass "Leave site?" dialog ของ TikTok Studio (inject เข้า MAIN world)
  const bypassScript = document.createElement('script');
  bypassScript.textContent = `
    window.onbeforeunload = null;
    window.addEventListener('beforeunload', function(e) {
      e.stopImmediatePropagation();
      delete e.returnValue;
    }, true);
  `;
  (document.head || document.documentElement).appendChild(bypassScript);
  bypassScript.remove();

  console.log('[TikTok] Reloading page for recovery...');
  location.reload();
}

// เช็คและทำ auto-recovery เมื่อ page load
async function checkAndPerformRecovery() {
  const recoveryJson = sessionStorage.getItem('pd_tiktok_recovery');
  if (!recoveryJson) {
    return false;
  }

  let recoveryState;
  try {
    recoveryState = JSON.parse(recoveryJson);
  } catch (e) {
    console.log('[TikTok] Invalid recovery state');
    sessionStorage.removeItem('pd_tiktok_recovery');
    return false;
  }

  // เช็คว่า recovery state ไม่เก่าเกิน 5 นาที
  if (Date.now() - recoveryState.timestamp > 5 * 60 * 1000) {
    console.log('[TikTok] Recovery state expired');
    sessionStorage.removeItem('pd_tiktok_recovery');
    return false;
  }

  console.log('[TikTok] Found recovery state:', recoveryState);

  // แสดง overlay
  showTikTokOverlay('Recovery Mode', 'กำลังกู้คืน video...');
  updateTikTokOverlay('Recovery Mode', 'รอ banner ขึ้น...');

  // รอให้หน้าโหลดเสร็จ
  await delay(2000);

  // หา "A video you were editing wasn't saved" banner และกด Continue
  let bannerHandled = false;
  for (let i = 0; i < 10; i++) {
    bannerHandled = await handleVideoRecoveryBanner();
    if (bannerHandled) {
      console.log('[TikTok] Recovery banner handled!');
      break;
    }
    await delay(1000);
  }

  if (!bannerHandled) {
    console.log('[TikTok] Recovery banner not found, aborting recovery');
    sessionStorage.removeItem('pd_tiktok_recovery');
    hideTikTokOverlay();
    return false;
  }

  // รอให้กลับไปหน้า upload
  updateTikTokOverlay('Recovery Mode', 'รอวีดีโอโหลด...');
  await delay(3000);

  // รอให้วีดีโอโหลดเสร็จ (ไม่มี Loading...)
  let videoReady = false;
  for (let i = 0; i < 30; i++) {
    const loadingText = document.body.innerText || '';
    if (!loadingText.includes('Loading...') &&
        !loadingText.includes('Uploading') &&
        !loadingText.includes('Processing')) {
      // เช็คว่ามี video preview หรือไม่
      const videoPreview = document.querySelector('video[src]');
      const uploadProgress = document.querySelector('[class*="upload"][class*="progress"]');

      if (videoPreview && !uploadProgress) {
        videoReady = true;
        console.log('[TikTok] Video is ready!');
        break;
      }
    }
    console.log('[TikTok] Waiting for video to load... attempt', i + 1);
    await delay(1000);
  }

  if (!videoReady) {
    console.log('[TikTok] Video still loading, but will try to proceed');
  }

  // เพิ่มเวลารอพิเศษเพื่อให้แน่ใจว่าวีดีโอโหลดเสร็จจริงๆ
  updateTikTokOverlay('Recovery Mode', 'รอเพิ่มอีก 3 วินาที...');
  await delay(3000);

  // กด Schedule อีกครั้ง
  updateTikTokOverlay('Recovery Mode', 'กด Schedule ใหม่...');

  // Clear recovery state ก่อนกด Schedule
  sessionStorage.removeItem('pd_tiktok_recovery');

  try {
    await clickScheduleButton(true); // true = skip recovery (ป้องกัน infinite loop)
    updateTikTokOverlay('Recovery สำเร็จ!', 'โพสตั้งเวลาแล้ว!');
    await delay(2000);
    hideTikTokOverlay();

    // ส่ง message กลับไปบอก popup ว่าสำเร็จ
    chrome.runtime.sendMessage({
      action: 'tiktokPostComplete',
      success: true,
      recovered: true
    });

    return true;
  } catch (error) {
    console.error('[TikTok] Recovery Schedule failed:', error);
    updateTikTokOverlay('Recovery ล้มเหลว', error.message);
    await delay(3000);
    hideTikTokOverlay();

    chrome.runtime.sendMessage({
      action: 'tiktokPostComplete',
      success: false,
      error: 'Recovery failed: ' + error.message
    });

    return false;
  }
}

// Step 6: กด Schedule button
// v6.2: กดปุ่ม Save draft (สีเทา)
async function clickSaveDraftButton() {
  console.log('[TikTok] Step 6: Click Save draft button');
  updateTikTokOverlay('กำลังบันทึกฉบับร่าง...', 'เกือบเสร็จแล้ว!');

  let saveDraftBtn = null;

  // วิธีที่ 1: หาจาก data-e2e="save_draft_button"
  saveDraftBtn = document.querySelector('button[data-e2e="save_draft_button"]');
  if (saveDraftBtn) {
    console.log('[TikTok] Found Save draft button via data-e2e');
  }

  // วิธีที่ 2: หาจาก Button__content ที่มีข้อความ "Save draft"
  if (!saveDraftBtn) {
    const btnContents = document.querySelectorAll('.Button__content');
    for (const content of btnContents) {
      if (content.textContent.trim() === 'Save draft') {
        saveDraftBtn = content.closest('button');
        if (saveDraftBtn) {
          console.log('[TikTok] Found Save draft button via Button__content');
          break;
        }
      }
    }
  }

  // วิธีที่ 3: หาจาก Button__root--type-neutral ที่มีข้อความ Save draft
  if (!saveDraftBtn) {
    const neutralBtns = document.querySelectorAll('.Button__root--type-neutral, button[data-type="neutral"]');
    for (const btn of neutralBtns) {
      if (btn.textContent.includes('Save draft')) {
        saveDraftBtn = btn;
        console.log('[TikTok] Found Save draft button via type-neutral');
        break;
      }
    }
  }

  // วิธีที่ 4: Fallback หาจาก text
  if (!saveDraftBtn) {
    const allBtns = document.querySelectorAll('button');
    for (const btn of allBtns) {
      const text = btn.textContent.trim();
      if (text === 'Save draft' && btn.offsetParent !== null) {
        saveDraftBtn = btn;
        console.log('[TikTok] Found Save draft button by text');
        break;
      }
    }
  }

  if (!saveDraftBtn) {
    throw new Error('ไม่พบปุ่ม Save draft');
  }

  // เช็คว่าปุ่ม disabled หรือไม่
  const isDisabled = saveDraftBtn.disabled ||
                     saveDraftBtn.getAttribute('aria-disabled') === 'true' ||
                     saveDraftBtn.getAttribute('data-disabled') === 'true';

  if (isDisabled) {
    throw new Error('ปุ่ม Save draft ถูก disabled');
  }

  // คลิก!
  console.log('[TikTok] Clicking Save draft button...');
  saveDraftBtn.click();
  console.log('[TikTok] Save draft button clicked!');

  // v11: ตรวจจับ "30 posts limit" error ทันทีหลังกดปุ่ม
  // Toast จะขึ้นมาแค่ 3-5 วินาทีแล้วหายไป ต้องเช็คเร็วๆ ถี่ๆ
  console.log('[TikTok] Checking for 30 posts limit error (fast check for Save Draft)...');
  updateTikTokOverlay('กำลังบันทึกฉบับร่าง...', 'รอ TikTok ประมวลผล');

  for (let i = 0; i < 10; i++) { // เช็ค 10 ครั้ง x 500ms = 5 วินาที
    if (checkScheduleLimitError()) {
      console.log('[TikTok] Detected "30 posts limit" error on Save Draft! Stopping...');
      updateTikTokOverlay('❌ TikTok Draft เต็ม!', 'ไม่สามารถบันทึกดราฟได้เกิน 30 โพส');
      await delay(2000);
      throw new Error('SCHEDULE_LIMIT_REACHED: TikTok ไม่สามารถตั้งเวลา/บันทึกดราฟได้เกิน 30 โพส กรุณารอให้โพสที่ตั้งเวลาไว้ถูกเผยแพร่ก่อน หรือเปลี่ยนไปใช้ "โพสทันที" แทน');
    }
    await delay(500); // เช็คทุก 500ms
  }

  // เช็คเร็วๆ ว่าปุ่มยังอยู่ไหม หรือมี error ไหม
  const stillExists = document.querySelector('button[data-e2e="save_draft_button"]') ||
                      Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Save draft');

  // ถ้าปุ่มหายไปแล้ว = สำเร็จแน่นอน
  if (!stillExists) {
    console.log('[TikTok] Save draft button gone - completed!');
    return true;
  }

  // ถ้าปุ่มยังอยู่ รออีก 2 วินาที
  console.log('[TikTok] Button still exists, waiting 2 more seconds...');
  await delay(2000);

  // เช็คอีกครั้ง
  const stillExists2 = document.querySelector('button[data-e2e="save_draft_button"]') ||
                       Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Save draft');

  if (!stillExists2) {
    console.log('[TikTok] Save draft button gone after wait - completed!');
  } else {
    // ถ้ายังอยู่ ถือว่าสำเร็จอยู่ดี เพราะกดไปแล้ว
    // TikTok อาจใช้เวลา process นานกว่านี้ แต่ไม่ต้องรอ
    console.log('[TikTok] Save draft button still exists but assuming success (clicked already)');
  }

  return true;
}

async function clickScheduleButton(skipRecovery = false) {
  console.log('[TikTok] Step 6: Click Schedule button (skipRecovery:', skipRecovery, ')');
  updateTikTokOverlay('กำลังกด Schedule...', 'เกือบเสร็จแล้ว!');

  // TikTok ใช้ <button data-e2e="post_video_button"> สำหรับปุ่ม Schedule/Post
  // และมี class Button__root--type-primary (สีแดง)
  let submitBtn = null;

  // วิธีที่ 1: หาจาก data-e2e="post_video_button"
  submitBtn = document.querySelector('button[data-e2e="post_video_button"]');
  if (submitBtn) {
    console.log('[TikTok] Found Schedule button via data-e2e');
  }

  // วิธีที่ 2: หาจาก class Button__root--type-primary ที่มีข้อความ Schedule
  if (!submitBtn) {
    const primaryBtns = document.querySelectorAll('.Button__root--type-primary, button[class*="primary"]');
    console.log('[TikTok] Found primary buttons:', primaryBtns.length);

    for (const btn of primaryBtns) {
      const text = btn.textContent.trim();
      if (text === 'Schedule' || text === 'Post' || text === 'Publish') {
        submitBtn = btn;
        console.log('[TikTok] Found Schedule button via class:', text);
        break;
      }
    }
  }

  // วิธีที่ 3: หาจาก Button__content ที่มีข้อความ Schedule
  if (!submitBtn) {
    const btnContents = document.querySelectorAll('.Button__content');
    for (const content of btnContents) {
      if (content.textContent.trim() === 'Schedule') {
        submitBtn = content.closest('button');
        if (submitBtn) {
          console.log('[TikTok] Found Schedule button via Button__content');
          break;
        }
      }
    }
  }

  // วิธีที่ 4: Fallback หาจาก text
  if (!submitBtn) {
    const allBtns = document.querySelectorAll('button');
    for (const btn of allBtns) {
      const text = btn.textContent.trim();
      if ((text === 'Schedule' || text === 'Post') && btn.offsetParent !== null) {
        submitBtn = btn;
        console.log('[TikTok] Found button by text:', text);
        break;
      }
    }
  }

  if (!submitBtn) {
    throw new Error('ไม่พบปุ่ม Schedule/Post');
  }

  // เช็คว่าปุ่ม disabled หรือไม่
  const isDisabled = submitBtn.disabled ||
                     submitBtn.getAttribute('aria-disabled') === 'true' ||
                     submitBtn.getAttribute('data-disabled') === 'true';

  if (isDisabled) {
    throw new Error('ปุ่ม Schedule ถูก disabled (เวลาอาจน้อยกว่า 15 นาที หรือข้อมูลไม่ครบ)');
  }

  // คลิก!
  console.log('[TikTok] Clicking Schedule button...');
  submitBtn.click();
  console.log('[TikTok] Schedule button clicked!');

  // v11: ตรวจจับ "30 posts limit" error ทันทีหลังกดปุ่ม
  // Toast จะขึ้นมาแค่ 3-5 วินาทีแล้วหายไป ต้องเช็คเร็วๆ ถี่ๆ
  console.log('[TikTok] Checking for 30 posts limit error (fast check)...');
  for (let i = 0; i < 10; i++) { // เช็ค 10 ครั้ง x 500ms = 5 วินาที
    if (checkScheduleLimitError()) {
      console.log('[TikTok] Detected "30 posts limit" error! Stopping...');
      updateTikTokOverlay('❌ TikTok Schedule เต็ม!', 'ไม่สามารถตั้งเวลาได้เกิน 30 โพส');
      await delay(2000);
      throw new Error('SCHEDULE_LIMIT_REACHED: TikTok ไม่สามารถตั้งเวลา/บันทึกดราฟได้เกิน 30 โพส กรุณารอให้โพสที่ตั้งเวลาไว้ถูกเผยแพร่ก่อน หรือเปลี่ยนไปใช้ "โพสทันที" แทน');
    }
    await delay(500); // เช็คทุก 500ms
  }

  // === v5.5: ตรวจจับ "Continue to post?" dialog ===
  // TikTok อาจแสดง dialog ถามว่าจะโพสต่อไหมขณะยังเช็ควิดีโออยู่
  // ต้องเช็คหลายครั้งเพราะ dialog อาจขึ้นช้า
  console.log('[TikTok] Checking for confirmation dialogs...');
  for (let i = 0; i < 5; i++) {
    // v11: เช็ค 30 posts limit ควบคู่ไปด้วย
    if (checkScheduleLimitError()) {
      console.log('[TikTok] Detected "30 posts limit" error during dialog check! Stopping...');
      updateTikTokOverlay('❌ TikTok Schedule เต็ม!', 'ไม่สามารถตั้งเวลาได้เกิน 30 โพส');
      await delay(2000);
      throw new Error('SCHEDULE_LIMIT_REACHED: TikTok ไม่สามารถตั้งเวลา/บันทึกดราฟได้เกิน 30 โพส กรุณารอให้โพสที่ตั้งเวลาไว้ถูกเผยแพร่ก่อน หรือเปลี่ยนไปใช้ "โพสทันที" แทน');
    }

    const dialogHandled = await handleContinueToPostDialog();
    if (dialogHandled) {
      console.log('[TikTok] Handled "Continue to post?" dialog');
      await delay(2000);
      break;
    }
    await delay(2000); // รอ 2 วินาทีก่อนเช็คอีกครั้ง
  }

  // === v9.4: ตรวจจับ "Something went wrong" error และทำ recovery ===
  if (!skipRecovery) {
    for (let i = 0; i < 5; i++) {
      // v11: เช็ค 30 posts limit ควบคู่ไปด้วย
      if (checkScheduleLimitError()) {
        console.log('[TikTok] Detected "30 posts limit" error during recovery check! Stopping...');
        updateTikTokOverlay('❌ TikTok Schedule เต็ม!', 'ไม่สามารถตั้งเวลาได้เกิน 30 โพส');
        await delay(2000);
        throw new Error('SCHEDULE_LIMIT_REACHED: TikTok ไม่สามารถตั้งเวลา/บันทึกดราฟได้เกิน 30 โพส กรุณารอให้โพสที่ตั้งเวลาไว้ถูกเผยแพร่ก่อน หรือเปลี่ยนไปใช้ "โพสทันที" แทน');
      }

      if (checkSomethingWentWrongError()) {
        console.log('[TikTok] Detected "Something went wrong" error! Initiating recovery...');
        updateTikTokOverlay('พบ Error!', 'กำลังทำ Recovery...');

        // ทำ recovery
        await initiateVideoLoadingRecovery({
          reason: 'Something went wrong error',
          timestamp: Date.now()
        });

        // หลังจาก reload หน้าเว็บ script จะ re-run และทำ recovery ใน checkAndPerformRecovery()
        // ดังนั้น return false ที่นี่ (แต่จริงๆ แล้ว reload จะทำให้ code หยุดทำงาน)
        return false;
      }
      await delay(1000);
    }
  }

  // ตรวจสอบว่าสำเร็จหรือไม่
  const successIndicator = await waitForElementWithText('scheduled', '*', 5000) ||
                           await waitForElementWithText('success', '*', 5000);

  if (successIndicator) {
    console.log('[TikTok] Post scheduled successfully!');
  }

  return true;
}

// v7.3: กดปุ่ม Post Now (โพสทันที ไม่ตั้งเวลา)
async function clickPostNowButton() {
  console.log('[TikTok] Step 6: Click Post button (Post Now mode)');
  updateTikTokOverlay('กำลังโพส...', 'โพสทันที');

  // TikTok "When to post" section มี radio button: "Now" และ "Schedule"
  // ถ้าเป็น Post Now จะต้องเลือก "Now" radio ก่อน (ถ้ายังไม่ได้เลือก)

  // เลื่อนลงไปดู settings
  window.scrollTo(0, document.body.scrollHeight / 2);
  await delay(500);

  // หา "When to post" section และเลือก "Now" radio
  const allLabels = document.querySelectorAll('label, span, div');
  for (const el of allLabels) {
    const text = el.textContent.trim();
    if (text === 'Now') {
      // หา Radio__innerCircle ใน parent container
      const container = el.closest('label') || el.parentElement?.parentElement;
      if (container) {
        const nowRadio = container.querySelector('.Radio__innerCircle, input[type="radio"]');
        if (nowRadio) {
          console.log('[TikTok] Clicking "Now" radio...');
          nowRadio.click();
          await delay(500);
          break;
        }
      }
      // Fallback: คลิกที่ label
      el.click();
      console.log('[TikTok] Clicked "Now" label');
      await delay(500);
      break;
    }
  }

  // หาปุ่ม Post (สีแดง primary button)
  let postBtn = null;

  // วิธีที่ 1: หาจาก data-e2e="post_video_button"
  postBtn = document.querySelector('button[data-e2e="post_video_button"]');
  if (postBtn) {
    console.log('[TikTok] Found Post button via data-e2e');
  }

  // วิธีที่ 2: หาจาก class Button__root--type-primary ที่มีข้อความ Post
  if (!postBtn) {
    const primaryBtns = document.querySelectorAll('.Button__root--type-primary, button[class*="primary"]');
    for (const btn of primaryBtns) {
      const text = btn.textContent.trim();
      if (text === 'Post' || text === 'Publish') {
        postBtn = btn;
        console.log('[TikTok] Found Post button via class:', text);
        break;
      }
    }
  }

  // วิธีที่ 3: Fallback หาจาก text
  if (!postBtn) {
    const allBtns = document.querySelectorAll('button');
    for (const btn of allBtns) {
      const text = btn.textContent.trim();
      if (text === 'Post' && btn.offsetParent !== null) {
        postBtn = btn;
        console.log('[TikTok] Found Post button by text');
        break;
      }
    }
  }

  if (!postBtn) {
    throw new Error('ไม่พบปุ่ม Post');
  }

  // เช็คว่าปุ่ม disabled หรือไม่
  const isDisabled = postBtn.disabled ||
                     postBtn.getAttribute('aria-disabled') === 'true' ||
                     postBtn.getAttribute('data-disabled') === 'true';

  if (isDisabled) {
    throw new Error('ปุ่ม Post ถูก disabled (ข้อมูลอาจไม่ครบ)');
  }

  // คลิก!
  console.log('[TikTok] Clicking Post button...');
  postBtn.click();
  console.log('[TikTok] Post button clicked!');

  // รอให้ process
  await delay(2000);

  // === v5.5: ตรวจจับ "Continue to post?" dialog ===
  console.log('[TikTok] Checking for confirmation dialogs...');
  for (let i = 0; i < 5; i++) {
    const dialogHandled = await handleContinueToPostDialog();
    if (dialogHandled) {
      console.log('[TikTok] Handled "Continue to post?" dialog');
      await delay(2000);
      break;
    }
    await delay(2000);
  }

  // ตรวจสอบว่าสำเร็จหรือไม่
  const successIndicator = await waitForElementWithText('success', '*', 5000) ||
                           await waitForElementWithText('published', '*', 5000);

  if (successIndicator) {
    console.log('[TikTok] Post published successfully!');
  }

  return true;
}

// ===== v4.5.2: 🎵 Music Mode — แทนเสียงต้นฉบับด้วยเพลงจาก TikTok Studio Sound Library =====
// flow ที่ research แล้ว verified จริง (claude-in-chrome 2026-05-27):
//   1. กดปุ่ม Sounds — button[data-button-name="sounds"] (เปิด clip-forge-editor)
//   2. รอ editor โหลด — .clip-forge-editor-container ปรากฏ
//   3. ปิดเสียงต้นฉบับ — click button ที่มี [data-icon="VolumeUp"] (เปลี่ยนเป็น VolumeMute)
//   4. กรอกชื่อเพลงใน search — input[placeholder="Search sounds"]
//      • ใช้ native setter (React controlled) + dispatch 'input' event
//      • dispatch Enter keydown/keypress/keyup เพื่อ submit search
//   5. รอผลลัพธ์ — .MusicPanelMusicItem__wrap ปรากฏ
//   6. กด + เพลงแรก — .MusicPanelMusicItem__wrap:first-child button[class*="type-primary"]
//   7. กด Save — button text === "Save" ใน .TopBar__rightBox
//   8. รอ editor ปิด → กลับ post details
async function applyMusicMode(songName) {
  console.log('[TikTok Music v4.5.2] Start applyMusicMode:', songName);

  // === STEP 1: กดปุ่ม Sounds ===
  const soundsBtn = document.querySelector('button[data-button-name="sounds"]');
  if (!soundsBtn) {
    throw new Error('ไม่พบปุ่ม Sounds — TikTok Studio อาจไม่รองรับ sound editor (region/account)');
  }
  console.log('[TikTok Music] ✓ Found Sounds button — clicking');
  soundsBtn.click();
  await delay(1500); // v4.5.2 delay-bump: รอ click event บอท→Flow + animation เริ่ม

  // === STEP 2: รอ editor โหลด ===
  const editorRoot = await waitForSelector('.clip-forge-editor-container', 10000);
  if (!editorRoot) throw new Error('Sound editor ไม่เปิด (timeout)');
  console.log('[TikTok Music] ✓ Editor loaded');
  await delay(2500); // v4.5.2 delay-bump: ให้ editor settle + default track selected (คอมช้าใช้เวลา ~2 วิ)

  // === STEP 3: ปิดเสียงต้นฉบับ ===
  // หา button ที่มี [data-icon="VolumeUp"] ภายใน TrackOperation
  const volumeUpIcon = document.querySelector('[data-icon="VolumeUp"]');
  if (volumeUpIcon) {
    const muteBtn = volumeUpIcon.closest('button');
    if (muteBtn) {
      console.log('[TikTok Music] ✓ Found VolumeUp button — clicking to mute');
      muteBtn.click();
      await delay(1500); // v4.5.2 delay-bump: ให้ Flow update icon + state
      // verify เปลี่ยนเป็น VolumeMute
      const muted = !!document.querySelector('[data-icon="VolumeMute"]');
      console.log('[TikTok Music]', muted ? '✓ Muted' : '⚠️ Mute may not have applied');
    } else {
      console.warn('[TikTok Music] VolumeUp icon found but no parent button');
    }
  } else {
    console.warn('[TikTok Music] No VolumeUp icon — เสียงต้นฉบับอาจถูกปิดอยู่แล้ว');
  }
  await delay(800); // settle ก่อนไปขั้นต่อไป

  // === STEP 4: กรอก search query ===
  const searchInput = document.querySelector('input[placeholder="Search sounds"]') ||
                      document.querySelector('.MusicPanelSearchBar__wrap input.TextInput__input');
  if (!searchInput) throw new Error('ไม่พบช่องค้นหาเพลง');

  console.log('[TikTok Music] ✓ Found search input — typing:', songName);
  // v4.5.2: focus ก่อนพิมพ์ — บางกรณี React listener ต้อง element focused ก่อน
  try { searchInput.focus(); } catch (_) {}
  await delay(400);

  // React controlled input — ต้องใช้ native setter + dispatch input event
  const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  nativeSetter.call(searchInput, songName);
  searchInput.dispatchEvent(new Event('input', { bubbles: true }));
  await delay(1500); // v4.5.2 delay-bump: ให้ autocomplete suggestions ขึ้น + debounce settle

  // Submit ด้วย Enter
  ['keydown', 'keypress', 'keyup'].forEach(t => {
    searchInput.dispatchEvent(new KeyboardEvent(t, {
      key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true
    }));
  });
  await delay(1000); // v4.5.2 delay-bump: ให้ Flow ส่ง search request + เริ่ม render

  // === STEP 5: รอผลลัพธ์ ===
  console.log('[TikTok Music] รอผลลัพธ์ค้นหา...');
  const firstResult = await waitForSelector('.MusicPanelMusicItem__wrap', 12000);
  if (!firstResult) {
    throw new Error(`หาเพลง "${songName}" ไม่เจอ (timeout)`);
  }
  await delay(1500); // v4.5.2 delay-bump: ให้ list settle (เผื่อ virtual scroll + image load)

  // === STEP 6: กดปุ่ม + เพลงแรก ===
  const items = document.querySelectorAll('.MusicPanelMusicItem__wrap');
  if (items.length === 0) {
    throw new Error(`ไม่มีเพลงในผลค้นหา "${songName}"`);
  }
  console.log('[TikTok Music] พบเพลง:', items.length, 'รายการ — เลือกตัวแรก');

  const firstItem = items[0];
  // หา title เพื่อ log
  const titleEl = firstItem.querySelector('.MusicPanelMusicItem__infoBasicTitle');
  const firstTitle = (titleEl?.textContent || '').trim();
  console.log('[TikTok Music] เพลงแรก:', firstTitle);

  // หา + button ภายใน item แรก
  const plusBtn = firstItem.querySelector('.MusicPanelMusicItem__operation button[class*="type-primary"]') ||
                  firstItem.querySelector('button:has([data-icon="PlusBold"])');
  if (!plusBtn) {
    throw new Error('ไม่พบปุ่ม + ใน track item แรก');
  }
  console.log('[TikTok Music] ✓ Clicking + button');
  plusBtn.click();
  await delay(3500); // v4.5.2 delay-bump: ให้ Flow apply เพลง + right pane update + audio track render (สำคัญสุด)

  // === STEP 7: กดปุ่ม Save ===
  const headerRight = document.querySelector('.TopBar__rightBox') ||
                      document.querySelector('.clip-forge-editor-header-right');
  let saveBtn = null;
  if (headerRight) {
    const btns = headerRight.querySelectorAll('button');
    for (const b of btns) {
      const t = (b.textContent || '').trim();
      if (t === 'Save') { saveBtn = b; break; }
    }
  }
  if (!saveBtn) {
    // fallback global
    const allBtns = document.querySelectorAll('button[class*="type-primary"]');
    for (const b of allBtns) {
      if ((b.textContent || '').trim() === 'Save') { saveBtn = b; break; }
    }
  }
  if (!saveBtn) throw new Error('ไม่พบปุ่ม Save');
  if (saveBtn.getAttribute('aria-disabled') === 'true') {
    // v4.5.2: รอเพิ่มอีก 2 วินาทีเผื่อ Save ยังไม่พร้อม (audio track ยัง render)
    console.warn('[TikTok Music] ⚠️ Save disabled — รออีก 2 วิ');
    await delay(2000);
    if (saveBtn.getAttribute('aria-disabled') === 'true') {
      throw new Error('ปุ่ม Save disabled — อาจมีปัญหากับเพลง');
    }
  }
  console.log('[TikTok Music] ✓ Clicking Save');
  saveBtn.click();
  await delay(3500); // v4.5.2 delay-bump: ให้ editor ปิด + กลับหน้า post details (คอมช้าใช้ ~3 วิ)

  // === STEP 8: verify editor ปิดแล้ว ===
  const stillOpen = document.querySelector('.clip-forge-editor-container');
  if (stillOpen) {
    console.warn('[TikTok Music] ⚠️ Editor still open — รออีก 3 วิ');
    await delay(3000);
  }
  console.log('[TikTok Music] ✅ Music applied:', firstTitle, '→ กลับสู่ post details');
}

// v4.5.2: helper รอ selector โผล่ภายใน timeout
async function waitForSelector(selector, timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const el = document.querySelector(selector);
    if (el) return el;
    await delay(200);
  }
  return null;
}

// ===== MAIN FLOW =====

async function postToTikTok(data) {
  const { caption, hashtags, productId, productLinkName, userHashtags, videoUrl, skipUpload = false, scheduleDate = '', scheduleTime = '', saveDraft = false, postNow = false, enableAIContent = true, enableDisclose = false, discloseType = 'your_brand', music = null } = data;

  console.log('[TikTok] Starting post flow...');
  console.log('[TikTok] Data:', JSON.stringify(data, null, 2));
  console.log('[TikTok] skipUpload:', skipUpload);
  console.log('[TikTok] scheduleDate:', scheduleDate);
  console.log('[TikTok] scheduleTime:', scheduleTime);
  console.log('[TikTok] saveDraft:', saveDraft);
  console.log('[TikTok] postNow:', postNow);

  showTikTokOverlay('เริ่มโพส TikTok...', 'PD Auto Footage');

  try {
    // Step 0: ถ้า skipUpload = true แปลว่าวิดีโอถูกอัพโหลดไปแล้ว
    if (skipUpload) {
      console.log('[TikTok] skipUpload=true, video already uploaded');
      updateTikTokOverlay('วิดีโออัพโหลดแล้ว', 'ดำเนินการต่อ...');
    } else if (videoUrl && videoUrl.startsWith('http')) {
      console.log('[TikTok] Attempting auto upload from URL:', videoUrl);
      updateTikTokOverlay('กำลังอัพโหลดวิดีโออัตโนมัติ...', 'รอสักครู่');

      // กดปุ่ม Select videos ก่อน (ถ้ามี)
      await clickSelectVideosButton();
      await delay(1000);

      // ลอง upload จาก URL
      try {
        await uploadVideoFromUrl(videoUrl);
        console.log('[TikTok] Auto upload initiated');

        // รอให้อัพโหลดเสร็จ
        await delay(5000);
      } catch (uploadError) {
        console.log('[TikTok] Auto upload failed:', uploadError.message);
        updateTikTokOverlay('รอวิดีโออัพโหลด...', 'กรุณาลากไฟล์มาวาง หรือดาวน์โหลดจาก Flow');
      }
    } else {
      // ไม่มี video URL - แจ้งให้ user ดาวน์โหลดและลากไฟล์
      console.log('[TikTok] No video URL provided, waiting for manual upload');
      updateTikTokOverlay('รอวิดีโออัพโหลด...', 'กรุณาดาวน์โหลดวิดีโอจาก Flow แล้วลากมาวาง');
    }

    // Step 1: รอวิดีโออัพโหลด (รอจนกว่า UI จะพร้อม)
    // ถ้า skipUpload=true ก็รอแค่ให้ UI พร้อม ไม่ต้องรอนาน
    const uploadTimeout = skipUpload ? 30000 : 180000;
    await waitForVideoUploaded(uploadTimeout);

    // v4.5.2: 🎵 Music Mode — แทนเสียงต้นฉบับด้วยเพลงจาก TikTok Sound Library (BETA)
    //         flow: Sounds → mute original → search → click + on first result → Save
    //         ทำก่อน Step 2 (กรอกแคปชั่น) — กลับมาหน้า post details แล้วต่อปกติ
    if (music && music.enabled && music.songName) {
      try {
        updateTikTokOverlay('🎵 ใส่เพลง...', music.songName);
        await applyMusicMode(music.songName);
      } catch (musicErr) {
        console.warn('[TikTok Music v4.5.2] applyMusicMode failed (non-fatal):', musicErr.message);
        updateTikTokOverlay('⚠️ ใส่เพลงไม่สำเร็จ', 'ใช้เสียงต้นฉบับแทน');
        await delay(1500);
      }
    }

    // Step 2: ใส่ Description + Verified Hashtags
    // v6.0: ถ้ามี userHashtags จะพิมพ์แฮชแท็กทีละตัวแล้วคลิก dropdown เพื่อยืนยัน
    await setDescription(caption, hashtags || [], userHashtags || '');

    // Step 3: เพิ่ม Product Link (ถ้ามี)
    // v5.9.3: ส่ง productLinkName ไปด้วยสำหรับกรอกชื่อตระกร้าใน TikTok
    if (productId) {
      try {
        await addProductLink(productId, productLinkName || '');
      } catch (e) {
        console.log('[TikTok] Product link error (non-fatal):', e.message);
      }
    }

    // Step 4: ตั้งค่า Schedule (ข้ามถ้าเป็น saveDraft หรือ postNow mode)
    if (!saveDraft && !postNow) {
      // v7.3: ถ้ามี scheduleTime จะใช้เวลาที่กำหนด ถ้าไม่มีจะคำนวณเอง 20 นาที
      await setSchedule(20, scheduleDate, scheduleTime);
    }

    // Step 5a: Disclose post content (ถ้าเปิด)
    if (enableDisclose) {
      await setDiscloseContent(discloseType);
    }

    // Step 5b: ติ๊ก AI-generated (ถ้าเปิด)
    if (enableAIContent) {
      await setAIContent();
    } else {
      console.log('[TikTok] AI-generated content: ปิด (ไม่ติ๊ก)');
    }

    // Step 6: กด Schedule/Post/Save draft
    if (saveDraft) {
      await clickSaveDraftButton();
      updateTikTokOverlay('บันทึกฉบับร่างสำเร็จ!', '📝');
    } else if (postNow) {
      // v7.3: Post Now - กดปุ่ม Post โดยไม่ตั้งเวลา
      await clickPostNowButton();
      updateTikTokOverlay('โพสสำเร็จ!', '🎉');
    } else {
      await clickScheduleButton();
      updateTikTokOverlay('ตั้งเวลาโพสสำเร็จ!', '📅');
    }
    await delay(2000);
    hideTikTokOverlay();

    return { success: true };

  } catch (error) {
    console.error('[TikTok] Error:', error);
    updateTikTokOverlay('เกิดข้อผิดพลาด', error.message);
    await delay(3000);
    hideTikTokOverlay();
    return { success: false, error: error.message };
  }
}

// ===== MESSAGE LISTENER =====

// เก็บ chunks ระหว่าง chunked transfer (ต้องอยู่นอก listener เพื่อ persist ข้ามข้อความ)
// v4.2.2: var แทน const — กัน redeclaration error ตอน inject ซ้ำ
var videoChunkStorage = {};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[TikTok] Received message:', message.action);

  if (message.action === 'postToTikTok') {
    console.log('[TikTok] *** Starting postToTikTok flow ***');
    console.log('[TikTok] Data received:', JSON.stringify(message.data));

    // ส่ง received ก่อน แล้วทำงานใน background
    sendResponse({ received: true });

    // ทำงานจริง
    postToTikTok(message.data)
      .then(result => {
        console.log('[TikTok] *** postToTikTok completed ***', result);
        chrome.runtime.sendMessage({
          action: 'tiktokPostComplete',
          ...result
        });
      })
      .catch(error => {
        console.error('[TikTok] *** postToTikTok error ***', error);
        chrome.runtime.sendMessage({
          action: 'tiktokPostComplete',
          success: false,
          error: error.message
        });
      });
    return true;
  }

  if (message.action === 'ping') {
    sendResponse({ pong: true, page: 'tiktok-studio' });
    return true;
  }

  if (message.action === 'checkVideoUploaded') {
    // ตรวจสอบว่ามีวิดีโออัพโหลดแล้วหรือยัง
    const descBox = document.querySelector('[contenteditable="true"]');
    const videoPreview = document.querySelector('video[src]');
    sendResponse({
      ready: !!(descBox || videoPreview)
    });
    return true;
  }

  if (message.action === 'showOverlay') {
    showTikTokOverlay(message.message, message.subtitle || '');
    sendResponse({ success: true });
    return true;
  }

  if (message.action === 'hideOverlay') {
    hideTikTokOverlay();
    sendResponse({ success: true });
    return true;
  }

  // *** AUTO UPLOAD FROM SOURCE URL ***
  // รับ URL จาก background เมื่อดาวน์โหลดเสร็จ แล้วอัพโหลดเข้า TikTok อัตโนมัติ
  if (message.action === 'uploadVideoFromSource') {
    console.log('[TikTok] Received video to upload:', message.sourceUrl);
    showTikTokOverlay('กำลังอัพโหลดวิดีโออัตโนมัติ...', 'รอสักครู่');

    autoUploadFromSourceUrl(message.sourceUrl, message.filename)
      .then(result => {
        console.log('[TikTok] Auto upload result:', result);
        sendResponse(result);
      })
      .catch(error => {
        console.error('[TikTok] Auto upload error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  // *** CHUNKED VIDEO TRANSFER (สำหรับไฟล์ > 10MB ที่เกิน Chrome message limit) ***
  if (message.action === 'videoChunkStart') {
    console.log(`[TikTok] Chunk transfer START: ${message.transferId}, ${message.totalChunks} chunks, file: ${message.filename}`);
    videoChunkStorage[message.transferId] = {
      filename: message.filename,
      totalChunks: message.totalChunks,
      chunks: new Array(message.totalChunks),
      received: 0
    };
    sendResponse({ success: true });
    return true;
  }

  if (message.action === 'videoChunk') {
    const store = videoChunkStorage[message.transferId];
    if (!store) {
      sendResponse({ success: false, error: 'Unknown transferId: ' + message.transferId });
      return true;
    }
    store.chunks[message.chunkIndex] = message.data;
    store.received++;
    console.log(`[TikTok] Chunk ${message.chunkIndex + 1}/${store.totalChunks} received`);
    sendResponse({ success: true });
    return true;
  }

  if (message.action === 'videoChunkEnd') {
    const store = videoChunkStorage[message.transferId];
    if (!store) {
      sendResponse({ success: false, error: 'Unknown transferId: ' + message.transferId });
      return true;
    }
    console.log(`[TikTok] Chunk transfer END: ${message.transferId}, received ${store.received}/${store.totalChunks}`);
    const fullBase64 = store.chunks.join('');
    delete videoChunkStorage[message.transferId];

    showTikTokOverlay('กำลังอัพโหลดวิดีโออัตโนมัติ...', 'รอสักครู่');
    autoUploadFromBase64(fullBase64, message.filename)
      .then(result => {
        console.log('[TikTok] Chunked upload result:', result);
        sendResponse(result);
      })
      .catch(error => {
        console.error('[TikTok] Chunked upload error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  // *** AUTO UPLOAD FROM BASE64 ***
  // รับ base64 โดยตรง (สำหรับกรณี blob URL ที่ใช้ไม่ได้)
  if (message.action === 'uploadVideoFromBase64') {
    console.log('[TikTok] Received base64 video, length:', message.base64?.length);
    showTikTokOverlay('กำลังอัพโหลดวิดีโออัตโนมัติ...', 'รอสักครู่');

    autoUploadFromBase64(message.base64, message.filename)
      .then(result => {
        console.log('[TikTok] Auto upload result:', result);
        sendResponse(result);
      })
      .catch(error => {
        console.error('[TikTok] Auto upload error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  // *** v5.9.3: BASKET MODE - UPLOAD AND POST CLIP ***
  // รับคลิป base64 พร้อม product info แล้วอัพโหลด + โพส + ปักตระกร้า
  if (message.action === 'uploadAndPostClip') {
    console.log('[TikTok] uploadAndPostClip received');
    console.log('[TikTok] Product ID:', message.productId);
    console.log('[TikTok] Product Link Name:', message.productLinkName || '(ไม่ระบุ)');
    console.log('[TikTok] Filename:', message.filename);

    showTikTokOverlay('กำลังอัพโหลดคลิป...', message.filename);

    // อัพโหลดคลิปก่อน แล้วค่อยโพส
    (async () => {
      try {
        // Step 1: อัพโหลดคลิปจาก base64
        const uploadResult = await autoUploadFromBase64(message.clipBase64, message.filename);
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'อัพโหลดไม่สำเร็จ');
        }

        console.log('[TikTok] Upload complete, starting post flow...');

        // Step 2: โพสไป TikTok พร้อมปักตระกร้า
        // v4.5: forward scheduling/draft/disclose fields จาก caller (Merge Mode)
        const postResult = await postToTikTok({
          caption: message.productName || '',
          hashtags: [],
          productId: message.productId,
          productLinkName: message.productLinkName || '', // v5.9.3: ชื่อตระกร้า
          skipUpload: true, // วิดีโออัพโหลดไปแล้ว
          // v4.5: passthrough scheduling/posting options
          postNow: !!message.postNow,
          scheduleDate: message.scheduleDate || '',
          scheduleTime: message.scheduleTime || '',
          saveDraft: !!message.saveDraft,
          userHashtags: message.userHashtags || '',
          enableAIContent: message.enableAIContent !== false,
          enableDisclose: !!message.enableDisclose,
          discloseType: message.discloseType || 'your_brand',
        });

        sendResponse(postResult);
      } catch (error) {
        console.error('[TikTok] uploadAndPostClip error:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();

    return true; // keep channel open for async
  }

  // *** v6.9.1: SHOWCASE - ดึงสินค้าจาก Showcase ***
  // v12: รองรับ keyword search
  if (message.action === 'fetchShowcaseProducts') {
    const keyword = message.keyword || ''; // v12: keyword จาก popup
    const limit = message.limit || 0; // v3.7: จำกัดจำนวน (0 = ทั้งหมด)
    console.log('[TikTok] fetchShowcaseProducts received, keyword:', keyword || '(none)', 'limit:', limit);

    (async () => {
      try {
        const products = await fetchAllShowcaseProducts((progress) => {
          chrome.runtime.sendMessage({
            action: 'showcaseFetchProgress',
            progress: progress
          });
        }, keyword, limit);

        // v4.1: แบ่งส่งทีละ chunk เพื่อป้องกัน "Message exceeded 64MiB" error
        const CHUNK_SIZE = 50;
        if (products.length > CHUNK_SIZE) {
          console.log(`[TikTok] Sending ${products.length} products in chunks of ${CHUNK_SIZE}`);
          const totalChunks = Math.ceil(products.length / CHUNK_SIZE);
          // v4.1.1: ส่ง response ก่อน → ให้ popup ตั้ง listener → แล้วค่อยส่ง chunks
          sendResponse({ success: true, chunked: true, totalProducts: products.length, totalChunks: totalChunks });

          // รอ 500ms ให้ popup ตั้ง listener ก่อน
          await new Promise(r => setTimeout(r, 500));

          for (let i = 0; i < totalChunks; i++) {
            const chunk = products.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
            chrome.runtime.sendMessage({
              action: 'showcaseProductChunk',
              chunk: chunk,
              chunkIndex: i,
              totalChunks: totalChunks,
              totalProducts: products.length
            });
            console.log(`[TikTok] Sent chunk ${i + 1}/${totalChunks} (${chunk.length} products)`);
            await new Promise(r => setTimeout(r, 100)); // delay ระหว่าง chunk
          }
        } else {
          sendResponse({ success: true, products: products });
        }
      } catch (error) {
        console.error('[TikTok] fetchShowcaseProducts error:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();

    return true;
  }

  // *** v6.9.1: SHOWCASE - ดึงสินค้าหน้าปัจจุบัน ***
  if (message.action === 'fetchCurrentPageProducts') {
    console.log('[TikTok] fetchCurrentPageProducts received');

    try {
      const products = scrapeCurrentPageProducts();
      sendResponse({ success: true, products: products });
    } catch (error) {
      console.error('[TikTok] fetchCurrentPageProducts error:', error);
      sendResponse({ success: false, error: error.message });
    }

    return true;
  }

  // ===== v4.1: INSIGHT API — ดึง Analytics จาก TikTok Studio =====

  if (message.action === 'fetchInsightOverview') {
    const days = message.days || 7;
    const range = days <= 7 ? 1 : 2;
    console.log(`[TikTok Insight] Fetching overview analytics (${days} days)...`);
    (async () => {
      try {
        const params = 'aid=1988&app_name=tiktok_creator_center&device_platform=web_pc&channel=tiktok_web&tz_offset=25200';
        const typeRequests = JSON.stringify([
          { insigh_type: 'follower_num' },
          { insigh_type: 'unique_viewer_num', range: range },
          { insigh_type: 'vv_history', days: days, end_days: 1 },
          { insigh_type: 'follower_num_history', days: days, end_days: 1 },
          { insigh_type: 'like_history', days: days, end_days: 1 },
          { insigh_type: 'comment_history', days: days, end_days: 1 },
          { insigh_type: 'share_history', days: days, end_days: 1 },
          { insigh_type: 'video_page_percent' }
        ]);
        const url = `/aweme/v2/data/insight/?${params}&type_requests=${encodeURIComponent(typeRequests)}`;
        const resp = await fetch(url, { credentials: 'include' });
        const data = await resp.json();
        console.log('[TikTok Insight] Overview data:', data);
        sendResponse({ success: true, data: data });
      } catch (e) {
        console.error('[TikTok Insight] Error:', e);
        sendResponse({ success: false, error: e.message });
      }
    })();
    return true;
  }

  if (message.action === 'fetchInsightRevenue') {
    console.log('[TikTok Insight] Fetching revenue/monetization...');
    (async () => {
      try {
        // v4.1: ดึง device_id จาก __UNIVERSAL_DATA_FOR_REHYDRATION__ + odinId จาก user API
        let deviceId = '0';
        let odinId = '';

        // วิธี 1: ดึง device_id จาก universal data
        try {
          const uniEl = document.querySelector('#__UNIVERSAL_DATA_FOR_REHYDRATION__');
          if (uniEl) {
            const uniData = JSON.parse(uniEl.textContent);
            deviceId = uniData?.__DEFAULT_SCOPE__?.['webapp.app-context']?.wid || '0';
          }
        } catch(e) {}

        // วิธี 2: fallback จาก cookie
        if (deviceId === '0') {
          const ttwidMatch = document.cookie.match(/ttwid=([^;]+)/);
          if (ttwidMatch) deviceId = ttwidMatch[1];
        }

        // ดึง odinId (user id) จาก user API
        try {
          const userResp = await fetch('/tiktokstudio/api/web/user', { credentials: 'include' });
          const userData = await userResp.json();
          odinId = userData?.userInfo?.user?.id || '';
          console.log('[TikTok Insight] Got userId:', odinId);
        } catch(e) {}

        const params = `aid=1988&app_name=tiktok_creator_center&device_platform=web_pc&channel=tiktok_web&scene=156&device_id=${deviceId}&odinId=${odinId}&tz_name=Asia/Bangkok&priority_region=TH&region=TH&app_language=en&locale=en&version_code=*`;
        const url = `/tiktok/v1/creator/m10n_center/reward_analytics?${params}`;
        const resp = await fetch(url, { credentials: 'include' });
        const data = await resp.json();
        console.log('[TikTok Insight] Revenue status:', data.status_code);
        sendResponse({ success: true, data: data });
      } catch (e) {
        console.error('[TikTok Insight] Revenue error:', e);
        sendResponse({ success: false, error: e.message });
      }
    })();
    return true;
  }

  if (message.action === 'fetchInsightPosts') {
    console.log('[TikTok Insight] Fetching posts list...');
    (async () => {
      try {
        const params = 'aid=1988&app_name=tiktok_creator_center&device_platform=web_pc&channel=tiktok_web';
        const sortField = message.sortBy || 'play_count';
        const body = {
          cursor: message.cursor || 0,
          size: message.size || 20,
          query: {
            sort_orders: [{ field_name: sortField, order: 2 }],
            conditions: [],
            is_recent_posts: false
          }
        };
        const url = `/tiktok/creator/manage/item_list/v1/?${params}`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body)
        });
        const data = await resp.json();
        console.log('[TikTok Insight] Posts:', data.item_list?.length || 0, 'items');
        sendResponse({ success: true, data: data });
      } catch (e) {
        console.error('[TikTok Insight] Error:', e);
        sendResponse({ success: false, error: e.message });
      }
    })();
    return true;
  }

  // v4.2: Tier 1 — เวลาที่ดีสุด + Demographics + Search Terms + Top Posts
  if (message.action === 'fetchInsightAudience') {
    const days = message.days || 7;
    const range = days <= 7 ? 1 : 2;
    console.log(`[TikTok Insight] Fetching audience data (${days} days)...`);
    (async () => {
      try {
        const params = 'aid=1988&app_name=tiktok_creator_center&device_platform=web_pc&channel=tiktok_web&tz_offset=25200';
        const typeRequests = JSON.stringify([
          { insigh_type: 'viewer_active_history_hours', days: 8, end_days: 1 },
          { insigh_type: 'follower_active_history_hours', days: 8, end_days: 1 },
          { insigh_type: 'viewer_gender_percent', range: range },
          { insigh_type: 'viewer_age_distribution', range: range },
          { insigh_type: 'viewer_country_city_percent', range: range },
          { insigh_type: 'follower_gender_percent', range: range },
          { insigh_type: 'follower_age_distribution', range: range },
          { insigh_type: 'user_search_terms', range: range },
          { insigh_type: 'top_items', range: range, filter: 1 },
          { insigh_type: 'top_items', range: range, filter: 3 }
        ]);
        const url = `/aweme/v2/data/insight/?${params}&type_requests=${encodeURIComponent(typeRequests)}`;
        const resp = await fetch(url, { credentials: 'include' });
        const data = await resp.json();
        console.log('[TikTok Insight] Audience data received');
        sendResponse({ success: true, data: data });
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
    })();
    return true;
  }

  if (message.action === 'fetchInsightVideo') {
    console.log('[TikTok Insight] Fetching video analytics:', message.awemeId);
    (async () => {
      try {
        const params = 'aid=1988&app_name=tiktok_creator_center&device_platform=web_pc&channel=tiktok_web&tz_offset=25200';
        const awemeId = message.awemeId;
        const typeRequests = JSON.stringify([
          { insigh_type: 'video_info', aweme_id: awemeId },
          { insigh_type: 'video_traffic_source_percent_realtime', aweme_id: awemeId },
          { insigh_type: 'item_search_terms', aweme_id: awemeId },
          { insigh_type: 'video_vv_history_7d', aweme_id: awemeId }
        ]);
        const url = `/aweme/v2/data/insight/?${params}&type_requests=${encodeURIComponent(typeRequests)}`;
        const resp = await fetch(url, { credentials: 'include' });
        const data = await resp.json();
        sendResponse({ success: true, data: data });
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
    })();
    return true;
  }
});

// ===== v6.9.1: SHOWCASE FUNCTIONS =====

// v7.0.1: แปลง image URL เป็น base64 สำหรับ export
async function imageUrlToBase64(url) {
  if (!url) return null;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log('[Showcase] Failed to fetch image:', response.status);
      return null;
    }

    const blob = await response.blob();

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.log('[Showcase] Error converting image to base64:', e.message);
    return null;
  }
}

// v7.0: สร้าง/แสดง overlay ทึบขณะดึงสินค้า
function showShowcaseOverlay() {
  // ลบ overlay เก่า (ถ้ามี)
  removeShowcaseOverlay();

  const overlay = document.createElement('div');
  overlay.id = 'pd-showcase-overlay';
  overlay.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      z-index: 999999;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <div style="font-size: 48px; margin-bottom: 20px;">💎</div>
      <div style="font-size: 24px; font-weight: bold; background: linear-gradient(90deg, #10b981, #d4a843); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 10px;">PD AUTO FOOTAGE</div>
      <div id="pd-overlay-status" style="font-size: 18px; margin-bottom: 20px; color: #10b981;">${_tt('กำลังดึงข้อมูลสินค้า...')}</div>
      <div style="width: 300px; height: 8px; background: #333; border-radius: 4px; overflow: hidden;">
        <div id="pd-overlay-progress" style="width: 0%; height: 100%; background: linear-gradient(90deg, #10b981, #d4a843); transition: width 0.3s;"></div>
      </div>
      <div id="pd-overlay-detail" style="margin-top: 15px; font-size: 14px; color: #888;">${_tt('เริ่มต้น...')}</div>
    </div>
  `;
  document.body.appendChild(overlay);
}

// v7.0: อัพเดต overlay
// v12: เพิ่ม customStatus parameter
function updateShowcaseOverlay(currentPage, totalPages, productCount, customStatus = '') {
  const statusEl = document.getElementById('pd-overlay-status');
  const progressEl = document.getElementById('pd-overlay-progress');
  const detailEl = document.getElementById('pd-overlay-detail');

  if (customStatus) {
    // v12: แสดงข้อความ custom (เช่น กำลังค้นหา)
    if (statusEl) statusEl.textContent = customStatus;
    if (progressEl) progressEl.style.width = '0%';
    if (detailEl) detailEl.textContent = '';
  } else {
    if (statusEl) statusEl.textContent = _tt('กำลังดึงหน้า') + ` ${currentPage}/${totalPages}`;
    if (progressEl) progressEl.style.width = `${Math.min((currentPage / totalPages) * 100, 100)}%`;
    if (detailEl) detailEl.textContent = _tt('พบสินค้า') + ` ${productCount} ` + _tt('รายการ');
  }
}

// v12: ค้นหาสินค้าใน Showcase ด้วย keyword (เปิด modal อัตโนมัติถ้ายังไม่เปิด)
async function searchShowcaseByKeyword(keyword) {
  console.log('[Showcase] 🔍 Searching for keyword:', keyword);

  // === Step 0: ตรวจสอบว่า modal "Add product link" เปิดอยู่หรือยัง ===
  console.log('[Showcase] Step 0: Checking if product modal is open...');

  // เช็คว่ามี modal เปิดอยู่ไหม (หา Showcase products tab หรือ product table)
  let modalOpen = false;
  const showcaseTab = document.querySelector('[class*="TUXTabBar-itemTitle"]');
  const productTable = document.querySelector('tr[class*="product-tb-row"], .product-table, table[class*="product"]');

  if (showcaseTab || productTable) {
    console.log('[Showcase] ✅ Modal/product list already visible');
    modalOpen = true;
  }

  // ถ้า modal ยังไม่เปิด ให้คลิกปุ่ม "Add product link" ก่อน
  if (!modalOpen) {
    console.log('[Showcase] Modal not open, trying to click "Add product link" button...');

    // หาปุ่ม Add product link (เหมือน selectProductInBasket)
    const addProductButtons = document.querySelectorAll('button, [role="button"]');
    let clickedButton = false;

    for (const btn of addProductButtons) {
      const text = btn.textContent?.toLowerCase() || '';
      if ((text.includes('add') && text.includes('product')) ||
          text.includes('เพิ่มสินค้า') ||
          btn.querySelector('svg[class*="add"], svg[class*="plus"]')) {
        if (btn.offsetParent !== null) {
          console.log('[Showcase] Found "Add product link" button, clicking...');
          btn.click();
          clickedButton = true;
          await delay(2000); // รอ modal เปิด
          break;
        }
      }
    }

    if (!clickedButton) {
      console.log('[Showcase] ⚠️ "Add product link" button not found - continuing anyway');
    }
  }

  // === Step 1: คลิก Tab "Showcase products" (ถ้ามี) ===
  console.log('[Showcase] Step 1: Looking for Showcase products tab...');

  const tabButtons = document.querySelectorAll('[class*="TUXTabBar-itemTitle"], [role="tab"], .tab-button');
  for (const btn of tabButtons) {
    const text = btn.textContent?.toLowerCase() || '';
    if (text.includes('showcase') || text.includes('products')) {
      if (btn.offsetParent !== null) {
        console.log('[Showcase] Found Showcase products tab, clicking...');
        btn.click();
        await delay(1000);
        break;
      }
    }
  }

  // === Step 2: หาช่อง Search (ใช้หลาย selector) ===
  console.log('[Showcase] Step 2: Looking for search input...');

  let searchInput = null;

  // Helper: ตรวจสอบว่าเป็น time input หรือไม่ (ค่าเป็น XX:XX)
  const isTimeInput = (inp) => {
    const val = inp.value || '';
    return /^\d{1,2}:\d{2}$/.test(val);
  };

  // วิธีที่ 1: หาจาก placeholder "Search" ก่อน (น่าเชื่อถือที่สุด)
  const placeholderInputs = document.querySelectorAll('input[placeholder*="Search"], input[placeholder*="search"], input[placeholder*="ค้นหา"]');
  for (const inp of placeholderInputs) {
    if (inp.offsetParent !== null && !isTimeInput(inp)) {
      searchInput = inp;
      console.log('[Showcase] ✅ Found search input via placeholder:', inp.placeholder);
      break;
    }
  }

  // วิธีที่ 2: หา input ที่อยู่ใกล้ search icon (svg)
  if (!searchInput) {
    const searchContainers = document.querySelectorAll('[class*="search"], [class*="Search"]');
    for (const container of searchContainers) {
      if (container.offsetParent !== null) {
        const inp = container.querySelector('input');
        if (inp && inp.offsetParent !== null && !isTimeInput(inp)) {
          searchInput = inp;
          console.log('[Showcase] ✅ Found search input near search container');
          break;
        }
      }
    }
  }

  // วิธีที่ 3: หา input ใน modal/dialog ที่มี product table
  if (!searchInput) {
    const modals = document.querySelectorAll('[role="dialog"], [class*="modal"], [class*="Modal"], [class*="drawer"], [class*="Drawer"]');
    for (const modal of modals) {
      if (modal.offsetParent !== null) {
        // เช็คว่า modal นี้มี product table หรือเปล่า
        const hasProductTable = modal.querySelector('tr[class*="product"], table, tbody');
        if (hasProductTable) {
          const modalInputs = modal.querySelectorAll('input[type="text"], input[type="search"], input:not([type])');
          for (const inp of modalInputs) {
            if (inp.offsetParent !== null && !isTimeInput(inp) && !inp.readOnly) {
              searchInput = inp;
              console.log('[Showcase] ✅ Found search input in product modal');
              break;
            }
          }
        }
        if (searchInput) break;
      }
    }
  }

  // วิธีที่ 4: หา TUXTextInputCore-input ที่ไม่ใช่ time input
  if (!searchInput) {
    const tuxInputs = document.querySelectorAll('input.TUXTextInputCore-input');
    for (const inp of tuxInputs) {
      if (inp.offsetParent !== null && !isTimeInput(inp) && !inp.readOnly) {
        // ตรวจสอบว่าอยู่ใกล้ search icon หรือเปล่า
        const parent = inp.closest('[class*="search"], [class*="Search"]') || inp.parentElement;
        const hasSvg = parent?.querySelector('svg');
        if (hasSvg || inp.placeholder.toLowerCase().includes('search')) {
          searchInput = inp;
          console.log('[Showcase] ✅ Found search input via TUXTextInputCore-input (near svg)');
          break;
        }
      }
    }
  }

  // วิธีที่ 5: หา input ที่ visible และไม่ใช่ time input
  if (!searchInput) {
    const allInputs = document.querySelectorAll('input');
    for (const inp of allInputs) {
      if (inp.offsetParent !== null &&
          (inp.type === 'text' || inp.type === 'search' || inp.type === '' || !inp.type) &&
          !inp.readOnly && !inp.disabled && !isTimeInput(inp)) {
        const rect = inp.getBoundingClientRect();
        // หา input ที่มีขนาดพอเหมาะ (ไม่เล็กเกินไป ไม่ใหญ่เกินไป)
        if (rect.width > 100 && rect.width < 500 && rect.height > 20 && rect.height < 60) {
          searchInput = inp;
          console.log('[Showcase] ✅ Found search input via visible input scan, class:', inp.className);
          break;
        }
      }
    }
  }

  if (!searchInput) {
    console.log('[Showcase] ❌ Search input not found!');
    // Debug: แสดง inputs ทั้งหมด
    const allInputs = document.querySelectorAll('input');
    console.log('[Showcase] Total inputs on page:', allInputs.length);
    allInputs.forEach((inp, i) => {
      const rect = inp.getBoundingClientRect();
      console.log(`[Showcase] Input ${i}: visible=${inp.offsetParent !== null}, type="${inp.type}", class="${inp.className}", placeholder="${inp.placeholder}", value="${inp.value}", size=${rect.width}x${rect.height}`);
    });
    return false;
  }

  // === Step 3: พิมพ์ keyword ผ่าน execCommand (React-friendly) ===
  console.log('[Showcase] Step 3: Typing keyword in search:', keyword);
  console.log('[Showcase] Search input details:', {
    class: searchInput.className,
    placeholder: searchInput.placeholder,
    type: searchInput.type
  });

  // Focus และ click
  searchInput.focus();
  searchInput.click();
  await delay(300);

  // Select all & delete ค่าเดิม
  searchInput.select();
  document.execCommand('delete', false, null);
  await delay(200);

  // พิมพ์ keyword ผ่าน execCommand — trigger React onChange ได้จริง
  document.execCommand('insertText', false, keyword);
  await delay(500);

  console.log('[Showcase] Input value after execCommand:', searchInput.value);

  // Fallback: ถ้า execCommand ไม่ work → ใช้ nativeInputValueSetter + InputEvent
  if (searchInput.value !== keyword) {
    console.log('[Showcase] execCommand failed, trying nativeInputValueSetter...');
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(searchInput, keyword);
    searchInput.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: keyword }));
    searchInput.dispatchEvent(new Event('change', { bubbles: true }));
    await delay(500);
  }

  console.log('[Showcase] Final input value:', searchInput.value);

  await delay(500);

  // === Step 4: กด Enter เพื่อค้นหา ===
  console.log('[Showcase] Step 4: Pressing Enter to search...');

  // ส่ง keydown event
  const enterKeydown = new KeyboardEvent('keydown', {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true,
    view: window
  });
  searchInput.dispatchEvent(enterKeydown);

  // ส่ง keyup event ด้วย
  const enterKeyup = new KeyboardEvent('keyup', {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true,
    view: window
  });
  searchInput.dispatchEvent(enterKeyup);

  await delay(200);

  // ลองหาปุ่ม search icon และคลิก (ถ้ามี)
  const searchIcons = document.querySelectorAll('[class*="search"] svg, [class*="Search"] svg, button[class*="search"], [class*="search-btn"], [class*="searchBtn"]');
  for (const icon of searchIcons) {
    const searchBtn = icon.closest('button') || icon.closest('[role="button"]') || icon.closest('div');
    if (searchBtn && searchBtn.offsetParent !== null) {
      const rect = searchBtn.getBoundingClientRect();
      if (rect.width > 0 && rect.width < 100) {
        console.log('[Showcase] Found search icon, clicking...');
        searchBtn.click();
        break;
      }
    }
  }

  // รอผลการค้นหาโหลด
  await delay(3000);
  console.log('[Showcase] ✅ Search completed for keyword:', keyword);

  return true;
}

// v7.0: ลบ overlay
function removeShowcaseOverlay() {
  const overlay = document.getElementById('pd-showcase-overlay');
  if (overlay) {
    overlay.remove();
  }
}

// v13: ดึงสินค้าจาก API ตรงๆ (เร็ว + เสถียร ไม่ต้องเปิด UI)
async function fetchShowcaseProductsViaAPI(keyword = '', limit = 0) {
  console.log(`[Showcase API] Fetching products via API... limit=${limit}`);

  const allProducts = [];
  let offset = 0;
  const count = limit > 0 ? Math.min(limit, 100) : 100; // v3.7: ถ้ามี limit ดึงแค่ที่ต้องการ
  let hasMore = true;

  while (hasMore) {
    // v3.7: หยุดเมื่อครบ limit
    if (limit > 0 && allProducts.length >= limit) {
      console.log(`[Showcase API] Reached limit ${limit}, stopping`);
      break;
    }
    const url = `https://shop.tiktok.com/api/v1/streamer_desktop/showcase_product/list?offset=${offset}&count=${count}`;
    console.log(`[Showcase API] Fetching offset=${offset} count=${count}`);

    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error(`API HTTP ${res.status}`);

    const data = await res.json();
    if (data.code !== 0) throw new Error(data.message || `API error code: ${data.code}`);

    const products = data.data?.products || [];
    console.log(`[Showcase API] Got ${products.length} products (offset=${offset})`);

    if (products.length === 0) {
      hasMore = false;
      break;
    }

    // Map API response → existing product format
    // v3.7: ใช้รูป HD 1620x1620 — เปลี่ยนตัวเลขใน URL ทุก pattern
    const getBestUrl = (urlObj) => {
      const urls = urlObj?.url_list || [];
      const baseUrl = urls[urls.length - 1] || urls[0] || urlObj?.thumb_url_list?.[0] || '';
      if (!baseUrl) return '';
      // Pattern 1: resize-jpeg:300:300 → resize-jpeg:1620:1620
      // Pattern 2: resize:300:300 → resize:1620:1620
      const hdUrl = baseUrl
        .replace(/resize-jpeg:\d+:\d+/, 'resize-jpeg:1620:1620')
        .replace(/resize:\d+:\d+/, 'resize:1620:1620');
      return hdUrl;
    };

    for (const p of products) {
      allProducts.push({
        productId: p.product_id || '',
        productName: p.title || '',
        basketName: (p.title || '').substring(0, 30),
        imageUrl: getBestUrl(p.cover),
        // v13: เก็บรูปทั้งหมดจาก API (v3.7: ใช้ URL ที่ใหญ่สุด)
        allImageUrls: (p.images || []).map(img => getBestUrl(img)).filter(Boolean),
        price: p.format_available_price || '',
        stock: String(p.stock_num ?? 0),
        status: p.review_status === 1 ? 'Active' : 'Inactive',
        canAdded: p.can_added,
        sellerName: p.seller_info?.shop_name || '',
        category: p.category_info?.name || '',
        commission: p.affiliate_info?.est_commission_expense || '',
        commissionRate: p.affiliate_info?.commission_rate || ''
      });
    }

    // Pagination: ถ้าได้น้อยกว่า count = หน้าสุดท้าย
    if (products.length < count) {
      hasMore = false;
    } else {
      offset += count;
    }
  }

  console.log(`[Showcase API] Total fetched: ${allProducts.length} products`);

  // Client-side keyword filter
  if (keyword) {
    const kw = keyword.toLowerCase();
    const filtered = allProducts.filter(p =>
      p.productName.toLowerCase().includes(kw) ||
      p.productId.includes(kw)
    );
    console.log(`[Showcase API] Filtered by "${keyword}": ${filtered.length}/${allProducts.length}`);
    return filtered;
  }

  return allProducts;
}

// ดึงสินค้าจากทุกหน้า
// v13: ลอง API ก่อน → fallback UI scrape
async function fetchAllShowcaseProducts(onProgress, keyword = '', limit = 0) {
  // v7.0: แสดง overlay ทึบ
  showShowcaseOverlay();

  // ============================================================
  // v13: ลอง API ก่อน (เร็ว + เสถียร ไม่ต้องเปิด UI)
  // ============================================================
  try {
    updateShowcaseOverlay(0, 0, 0, limit > 0 ? `🔌 กำลังดึงสินค้า ${limit} ชิ้น...` : '🔌 กำลังดึงสินค้าจาก API...');

    const apiProducts = await fetchShowcaseProductsViaAPI(keyword, limit);

    // v3.7: ตัดให้ครบ limit
    if (limit > 0 && apiProducts.length > limit) {
      apiProducts.length = limit;
      console.log(`[Showcase] Trimmed to limit: ${limit}`);
    }

    if (apiProducts.length > 0) {
      console.log(`[Showcase] ✅ API success: ${apiProducts.length} products${limit > 0 ? ` (limit ${limit})` : ''}`);


      if (onProgress) {
        onProgress({ status: 'converting', currentPage: 1, totalPages: 1, productCount: apiProducts.length });
      }

      // แปลง imageUrl → base64 (เหมือน UI scrape flow)
      const statusEl = document.getElementById('pd-overlay-status');
      const detailEl = document.getElementById('pd-overlay-detail');
      if (statusEl) statusEl.textContent = _tt('กำลังแปลงรูปภาพ...');

      let convertedCount = 0;
      for (const product of apiProducts) {
        if (product.imageUrl) {
          if (detailEl) detailEl.textContent = _tt('แปลงรูป') + ` ${convertedCount + 1}/${apiProducts.length}`;
          const base64 = await imageUrlToBase64(product.imageUrl);
          if (base64) {
            product.imageBase64 = base64;
            convertedCount++;
          }
        }
      }
      console.log(`[Showcase] Converted ${convertedCount}/${apiProducts.length} images to base64`);

      if (onProgress) {
        onProgress({ status: 'complete', currentPage: 1, totalPages: 1, productCount: apiProducts.length });
      }

      removeShowcaseOverlay();
      console.log('[Showcase] Total products (via API):', apiProducts.length);
      return apiProducts;
    }

    console.log('[Showcase] API returned 0 products, falling back to UI scraping...');
  } catch (apiError) {
    console.warn('[Showcase] ⚠️ API failed:', apiError.message, '— falling back to UI scraping');
  }

  // ============================================================
  // Fallback: UI scraping (เดิม — ต้องเปิด Add product links ก่อน)
  // ============================================================
  updateShowcaseOverlay(0, 0, 0, '📋 ใช้วิธี UI scrape (กรุณาเปิด Add product links)');

  const allProducts = [];
  let currentPage = 1;
  let totalPages = 1;
  let hasMorePages = true;
  let noNewProductsCount = 0;

  // v12: ถ้ามี keyword ให้ค้นหาก่อน (UI scrape path)
  if (keyword) {
    console.log('[Showcase] Searching for keyword:', keyword);
    updateShowcaseOverlay(0, 0, 0, `🔍 กำลังค้นหา "${keyword}"...`);

    const searchSuccess = await searchShowcaseByKeyword(keyword);
    if (!searchSuccess) {
      console.log('[Showcase] Search may have failed, continuing anyway...');
    }

    await delay(2000);
  }

  // หาจำนวนหน้าทั้งหมด
  totalPages = getTotalPages();
  console.log('[Showcase] Total pages:', totalPages);

  if (onProgress) {
    onProgress({ status: 'starting', currentPage: 0, totalPages: totalPages, productCount: 0 });
  }

  while (hasMorePages && currentPage <= Math.max(totalPages, 50)) { // จำกัด 50 หน้า
    console.log(`[Showcase] Fetching page ${currentPage}/${totalPages}`);

    if (onProgress) {
      onProgress({ status: 'fetching', currentPage: currentPage, totalPages: totalPages, productCount: allProducts.length });
    }

    // v7.0: อัพเดต overlay
    updateShowcaseOverlay(currentPage, totalPages, allProducts.length);

    // ดึงสินค้าจากหน้าปัจจุบัน
    const pageProducts = scrapeCurrentPageProducts();
    console.log(`[Showcase] Page ${currentPage}: Found ${pageProducts.length} products`);

    // เพิ่มเข้า array (ป้องกันซ้ำโดยเช็ค productId)
    let newCount = 0;
    for (const product of pageProducts) {
      if (!allProducts.some(p => p.productId === product.productId)) {
        allProducts.push(product);
        newCount++;
      }
    }
    console.log(`[Showcase] Page ${currentPage}: Added ${newCount} new products, total: ${allProducts.length}`);

    // ถ้าไม่มีสินค้าใหม่ 2 ครั้งติด = จบ
    if (newCount === 0) {
      noNewProductsCount++;
      if (noNewProductsCount >= 2) {
        console.log('[Showcase] No new products for 2 pages, stopping');
        hasMorePages = false;
        break;
      }
    } else {
      noNewProductsCount = 0;
    }

    // หาปุ่ม Next - ลองหลายวิธี
    const nextButton = findNextButton();
    console.log('[Showcase] Next button found:', !!nextButton);

    if (nextButton && currentPage < Math.max(totalPages, 50)) {
      // กดปุ่ม Next
      console.log('[Showcase] Clicking next button...');
      nextButton.click();
      await delay(2000); // รอโหลดข้อมูลนานขึ้น
      currentPage++;

      // อัพเดท totalPages หลังกด next (อาจเปลี่ยน)
      const newTotalPages = getTotalPages();
      if (newTotalPages > totalPages) {
        totalPages = newTotalPages;
        console.log('[Showcase] Updated total pages:', totalPages);
      }
    } else {
      console.log('[Showcase] No next button or reached last page');
      hasMorePages = false;
    }
  }

  if (onProgress) {
    onProgress({ status: 'complete', currentPage: currentPage, totalPages: totalPages, productCount: allProducts.length });
  }

  // v7.0.1: แปลง imageUrl เป็น base64 สำหรับทุกสินค้า
  console.log('[Showcase] Converting images to base64...');
  const statusEl = document.getElementById('pd-overlay-status');
  const detailEl = document.getElementById('pd-overlay-detail');

  if (statusEl) statusEl.textContent = _tt('กำลังแปลงรูปภาพ...');

  let convertedCount = 0;
  for (const product of allProducts) {
    if (product.imageUrl) {
      if (detailEl) detailEl.textContent = _tt('แปลงรูป') + ` ${convertedCount + 1}/${allProducts.length}`;

      const base64 = await imageUrlToBase64(product.imageUrl);
      if (base64) {
        product.imageBase64 = base64;
        convertedCount++;
      }
    }
  }
  console.log(`[Showcase] Converted ${convertedCount}/${allProducts.length} images to base64`);

  // v7.0: ลบ overlay เมื่อเสร็จ
  removeShowcaseOverlay();

  console.log('[Showcase] Total products fetched:', allProducts.length);
  return allProducts;
}

// หาปุ่ม Next (ลูกศรขวา >)
function findNextButton() {
  // วิธี 1: TikTok pagination - ปุ่มลูกศรขวา (ตรงตาม DOM จริง)
  let btn = document.querySelector('li.tiktok-pagination-item-right-arrow');
  if (btn) {
    console.log('[Showcase] Found next via tiktok-pagination-item-right-arrow');
    return btn;
  }

  // วิธี 2: หา li ที่มี class right-arrow
  btn = document.querySelector('li[class*="right-arrow"]');
  if (btn) {
    console.log('[Showcase] Found next via right-arrow class');
    return btn;
  }

  // วิธี 3: หา li ที่มี svg ลูกศรขวา (path มี 43.4142)
  const allLi = document.querySelectorAll('li[class*="pagination-item"]');
  for (const li of allLi) {
    const svg = li.querySelector('svg');
    if (svg && svg.innerHTML.includes('43.4142')) {
      console.log('[Showcase] Found next via svg path');
      return li;
    }
  }

  // วิธี 4: Fallback - arco pagination
  btn = document.querySelector('li.arco-pagination-item-next:not(.arco-pagination-item-disabled)');
  if (btn) {
    console.log('[Showcase] Found next via arco-pagination');
    return btn;
  }

  console.log('[Showcase] Next button not found');
  return null;
}

// หาจำนวนหน้าทั้งหมด
function getTotalPages() {
  let maxPage = 1;

  // วิธี 1: TikTok pagination - หาตัวเลขสูงสุดจาก pagination items
  const pageItems = document.querySelectorAll('li.tiktok-pagination-item');
  pageItems.forEach(item => {
    const text = item.textContent?.trim();
    const num = parseInt(text);
    if (!isNaN(num) && num > maxPage) {
      maxPage = num;
    }
  });

  // วิธี 2: หาจาก class ทั่วไป
  if (maxPage === 1) {
    const allItems = document.querySelectorAll('li[class*="pagination-item"]');
    allItems.forEach(item => {
      const text = item.textContent?.trim();
      const num = parseInt(text);
      if (!isNaN(num) && num > maxPage) {
        maxPage = num;
      }
    });
  }

  console.log('[Showcase] getTotalPages:', maxPage);
  return maxPage || 1;
}

// ดึงสินค้าจากหน้าปัจจุบัน
function scrapeCurrentPageProducts() {
  const products = [];

  // หา table rows - ลองหลาย selector
  let rows = document.querySelectorAll('tr[class*="product-tb-row"]');

  // ถ้าไม่เจอ ลองหาใน modal/dialog
  if (rows.length === 0) {
    rows = document.querySelectorAll('.product-table tbody tr');
  }
  if (rows.length === 0) {
    rows = document.querySelectorAll('table[class*="product-table"] tbody tr');
  }
  if (rows.length === 0) {
    // หา tbody ที่มี class jsx-*
    rows = document.querySelectorAll('tbody[class*="jsx-"] tr');
  }

  console.log('[Showcase] Found rows:', rows.length);

  rows.forEach((row, index) => {
    try {
      // ดึงข้อมูลจากแต่ละ cell
      const cells = row.querySelectorAll('td');
      if (cells.length < 4) return;

      // รูปสินค้า
      const imgElement = row.querySelector('img');
      const imageUrl = imgElement?.src || '';

      // ชื่อสินค้า - อยู่ใน cell แรกที่มี text ยาวๆ
      let productName = '';
      for (const cell of cells) {
        const text = cell.textContent?.trim();
        // ชื่อสินค้ามักยาวกว่า 10 ตัวและไม่ใช่ตัวเลขล้วน
        if (text && text.length > 10 && !/^\d+$/.test(text) && !/^[฿B]/.test(text) && text !== 'Active' && text !== 'Inactive') {
          productName = text;
          break;
        }
      }

      // Product ID - หา div ที่มี class product-tb-cell หรือตัวเลข 17 หลัก
      let productId = '';
      const productIdCell = row.querySelector('.product-tb-cell, [class*="product-tb-cell"]');
      if (productIdCell) {
        productId = productIdCell.textContent?.trim() || '';
      }

      // ถ้ายังไม่เจอ หาจาก cell ทั้งหมด
      if (!productId) {
        cells.forEach(cell => {
          const text = cell.textContent?.trim();
          // Product ID มักเป็นตัวเลข 17-19 หลัก
          if (/^\d{15,20}$/.test(text)) {
            productId = text;
          }
        });
      }

      // ราคา - หาจาก pattern ฿XXX.XX หรือ BXXX.XX
      let price = '';
      cells.forEach(cell => {
        const text = cell.textContent?.trim();
        if (/^[฿B]?\d{1,3}(?:,\d{3})*(?:\.\d{2})?$/.test(text)) {
          price = text;
        }
      });

      // Stock - หาตัวเลขที่น่าจะเป็น stock
      let stock = '';
      cells.forEach((cell, i) => {
        const text = cell.textContent?.trim();
        // Stock มักเป็นตัวเลขล้วน และอยู่ก่อน status
        if (/^\d+$/.test(text) && i > 1 && i < cells.length - 1) {
          stock = text;
        }
      });

      // Status - cell สุดท้าย
      let status = 'Unknown';
      const statusCell = cells[cells.length - 1];
      if (statusCell) {
        status = statusCell.textContent?.trim() || 'Unknown';
      }

      console.log(`[Showcase] Row ${index}: ID=${productId}, Name=${productName?.substring(0,30)}, Price=${price}, Stock=${stock}`);

      if (productId && productName) {
        products.push({
          productId,
          productName,
          basketName: productName.substring(0, 30), // ตัดเหลือ 30 ตัวอักษร
          imageUrl,
          price,
          stock,
          status
        });
      }
    } catch (e) {
      console.error('[Showcase] Error parsing row:', e);
    }
  });

  return products;
}

// ฟังก์ชันอัพโหลดอัตโนมัติจาก Base64 data
// v15.4: เพิ่ม retry logic สำหรับหา file input (รอปุ่มโหลด)
async function autoUploadFromBase64(base64Data, filename) {
  console.log('[TikTok] Auto uploading from base64, length:', base64Data?.length);

  try {
    showTikTokOverlay('กำลังอัพโหลดวิดีโอ...', 'เตรียมไฟล์');

    // v15.4: Step 0 - กดปุ่ม Select videos ก่อน (ถ้ามี) และรอให้ file input พร้อม
    await clickSelectVideosButton(5, 3000); // retry 5 ครั้ง x 3 วิ = 15 วินาที
    await delay(500);

    // Step 1: หา file input พร้อม retry
    // v15.4: เพิ่ม retry loop รอให้ file input ปรากฏ (บางเครื่องโหลดช้า 10-15 วิ)
    const maxRetries = 10;
    const retryDelay = 2000; // 2 วินาทีต่อครั้ง
    let fileInput = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`[TikTok] Looking for file input, attempt ${attempt}/${maxRetries}`);

      fileInput = document.querySelector('input[type="file"][accept*="video"]');
      if (!fileInput) {
        fileInput = document.querySelector('input[type="file"]');
      }

      if (fileInput) {
        console.log('[TikTok] Found file input!');
        break;
      }

      if (attempt < maxRetries) {
        updateTikTokOverlay('รอหน้าโหลด...', `กำลังหาช่องอัพโหลด (${attempt}/${maxRetries})`);
        await delay(retryDelay);
      }
    }

    if (!fileInput) {
      throw new Error('ไม่พบช่องอัพโหลดวิดีโอ (รอนานเกินไป)');
    }

    console.log('[TikTok] Found file input:', fileInput);

    // Step 2: แปลง base64 กลับเป็น Blob
    updateTikTokOverlay('กำลังเตรียมไฟล์...', 'แปลงข้อมูล');

    const blob = base64ToBlob(base64Data);
    console.log('[TikTok] Converted to blob, size:', blob.size);

    // Step 3: สร้าง File object
    // v4.2.2b: filename hack — basename ว่าง (.mp4) → TikTok ไม่มี basename จะแทรกลง caption
    // (เก่า: clip_${Date.now()}.mp4 → TikTok แทรก "clip_xxxx" → ต้อง clear DraftJS ที่ไม่ยอม clear)
    const safeFilename = `.mp4`;
    console.log(`[TikTok] v4.2.2b: Filename hack: "${filename}" → "${safeFilename}" (basename empty)`);
    const videoFile = new File(
      [blob],
      safeFilename,
      { type: 'video/mp4' }
    );

    console.log('[TikTok] Created file:', videoFile.name, videoFile.size);

    // Step 4: ใส่ไฟล์เข้า input ด้วย DataTransfer
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(videoFile);
    fileInput.files = dataTransfer.files;

    // Step 5: Dispatch events ให้ TikTok รู้
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    fileInput.dispatchEvent(new Event('input', { bubbles: true }));

    console.log('[TikTok] File set to input!');
    updateTikTokOverlay('อัพโหลดสำเร็จ!', 'รอ TikTok ประมวลผล...');

    // รอให้ TikTok process
    await delay(2000);
    hideTikTokOverlay();

    return { success: true };

  } catch (error) {
    console.error('[TikTok] Auto upload failed:', error);
    updateTikTokOverlay('อัพโหลดไม่สำเร็จ', error.message);
    throw error;
  }
}

// แปลง base64 data URL เป็น Blob
function base64ToBlob(base64Data) {
  // รองรับทั้ง 2 รูปแบบ:
  // 1. data:video/mp4;base64,xxxxxxx (มี prefix)
  // 2. xxxxxxx (raw base64 ไม่มี prefix)

  let contentType = 'video/mp4';
  let base64 = base64Data;

  if (base64Data.includes(',')) {
    // มี prefix - แยกออก
    const parts = base64Data.split(',');
    contentType = parts[0].match(/:(.*?);/)?.[1] || 'video/mp4';
    base64 = parts[1];
  }

  const byteCharacters = atob(base64);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);

    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    byteArrays.push(new Uint8Array(byteNumbers));
  }

  return new Blob(byteArrays, { type: contentType });
}

// Legacy function - redirect to base64 method
async function autoUploadFromSourceUrl(sourceUrl, filename) {
  console.log('[TikTok] autoUploadFromSourceUrl called with:', sourceUrl);

  // ถ้าเป็น blob URL จะไม่สามารถ fetch ได้ - ต้องใช้ base64
  if (sourceUrl.startsWith('blob:')) {
    throw new Error('Blob URL ใช้ไม่ได้ - ต้องใช้ base64 แทน');
  }

  // ถ้าเป็น data URL (base64) ให้ใช้ฟังก์ชัน base64
  if (sourceUrl.startsWith('data:')) {
    return autoUploadFromBase64(sourceUrl, filename);
  }

  // ถ้าเป็น URL ปกติ ลอง fetch
  try {
    showTikTokOverlay('กำลังโหลดวิดีโอ...', 'ดาวน์โหลดจาก URL');

    const response = await fetch(sourceUrl);
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`);
    }

    const blob = await response.blob();
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        try {
          const result = await autoUploadFromBase64(reader.result, filename);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'));
      reader.readAsDataURL(blob);
    });

  } catch (error) {
    console.error('[TikTok] Fetch failed:', error);
    throw error;
  }
}

// ===== AUTO DETECT PAGE STATE =====

function checkPageState() {
  const isUploadPage = window.location.href.includes('/upload');
  const isPostPage = window.location.href.includes('/post');

  console.log('[TikTok] Page state - Upload:', isUploadPage, 'Post:', isPostPage);

  return { isUploadPage, isPostPage };
}

// ===== INIT =====

console.log('[TikTok] Ready for commands');
checkPageState();

// v9.4: เช็ค recovery state เมื่อ page load
(async function initRecovery() {
  // รอให้หน้าโหลดสักครู่
  await delay(1500);

  // เช็คว่ามี recovery state หรือไม่
  const recovered = await checkAndPerformRecovery();
  if (recovered) {
    console.log('[TikTok] Recovery completed successfully!');
  }
})();
