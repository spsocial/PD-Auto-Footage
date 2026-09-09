// v3.5: Hook ดักจับ Final video blob จาก Google Flow
// รันใน MAIN world ที่ document_start เพื่อ hook ก่อน Flow โหลด
// Hook 1: HTMLAnchorElement.prototype.click — สำหรับ Extend Scene (ได้ 15 วิ Final)
// Hook 2: URL.createObjectURL — สำหรับ Add-to-Scene / Scene Builder (ได้ 16 วิ raw)
(function() {
  if (window.__flowHookInstalled__) return;
  window.__flowHookInstalled__ = true;
  window.__flowCapturedBlobs__ = [];
  window.__skipVideoDownload__ = true;  // default = บล็อกเซฟคลิปดิบลงดิสก์เสมอ (ยัง capture base64 ได้) — กันคลิป "ไม่มีเสียง" หลุดตอน refresh ทำ flag หาย

  // v4.4.1: helper — ตรวจ response body หาสัญญาณ FAILURE
  // คืนค่า { field, value } ถ้าเจอ, null ถ้าไม่เจอ
  // ดักครอบคลุม Flow update wording: status=FAILED, state=FAILED, error{}, errorCode, failureReason
  function _flowCheckBodyFailure(json) {
    if (!json || typeof json !== 'object') return null;
    var FAIL_STATES = ['FAILED', 'ERROR', 'FAILURE', 'CANCELLED', 'CANCELED'];
    function walk(obj, depth) {
      if (depth > 12 || !obj || typeof obj !== 'object') return null;
      // Array
      if (Array.isArray(obj)) {
        for (var i = 0; i < obj.length; i++) {
          var r = walk(obj[i], depth + 1);
          if (r) return r;
        }
        return null;
      }
      for (var k in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
        var v = obj[k];
        // field ที่ระบุ status/state — ค่าต้องตรง FAIL_STATES (ไม่ใช่ RUNNING/PENDING)
        if ((k === 'status' || k === 'state' || k === 'operationStatus' || k === 'mediaGenerationStatus' || k === 'generationStatus')
            && typeof v === 'string'
            && FAIL_STATES.indexOf(v.toUpperCase()) !== -1) {
          return { field: k, value: v };
        }
        // error object — มี code/message
        if (k === 'error' && v && typeof v === 'object' && (v.code || v.message || v.status)) {
          return { field: 'error', value: (v.message || ('code:' + v.code) || v.status) };
        }
        // errorCode/failureReason — มีค่าไม่ว่าง
        if ((k === 'errorCode' || k === 'failureReason' || k === 'failureMessage') && v && (typeof v === 'string' || typeof v === 'number')) {
          return { field: k, value: v };
        }
        // recurse
        if (typeof v === 'object' && v !== null) {
          var found = walk(v, depth + 1);
          if (found) return found;
        }
      }
      return null;
    }
    return walk(json, 0);
  }

  // v4.4.1: helper — scan raw response text หา critical fail keywords (last resort)
  // ใช้เมื่อ JSON parsing fail / structure แปลก
  function _flowCheckTextFailure(text) {
    if (!text || typeof text !== 'string' || text.length > 500000) return null;
    var CRITICAL_PATTERNS = [
      /audio generation failed/i,
      /video generation failed/i,
      /generation\s+failed/i,
      /have not been charged/i,        // "you have not been charged for this generation"
      /could not generate/i,
      /try a different prompt/i,       // Flow error: "try a different prompt or send feedback"
      // v4.4.4: Flow quota exceeded — Google account-level quota
      /error code 253/i,               // "The number of requests sent exceeds the quota limit. Error code 253"
      /exceeds the quota limit/i,
      /number of requests sent exceeds/i,
      /quota.*exceeded/i,
      /daily limit reached/i,
      /rate limit exceeded/i
    ];
    for (var i = 0; i < CRITICAL_PATTERNS.length; i++) {
      var m = text.match(CRITICAL_PATTERNS[i]);
      if (m) {
        // v4.4.4: ระบุประเภท fail ให้ชัด → content.js handle ต่างกันได้
        var isQuotaIssue = /quota|253|exceeds|limit reached|rate limit/i.test(m[0]);
        return {
          field: isQuotaIssue ? 'quota-exceeded' : 'text-pattern',
          value: m[0]
        };
      }
    }
    return null;
  }

  // v4.0.1: รับ flag จาก content.js (ISOLATED → MAIN) ผ่าน CustomEvent
  window.addEventListener('__flow_skip_download__', function(e) {
    window.__skipVideoDownload__ = e.detail && e.detail.enabled;
    console.log('[v4.0.1 Hook] Skip download flag:', window.__skipVideoDownload__);
  });

  // === v4.3: MAIN world click — bypass yellow bar (chrome.debugger) ===
  // ทำงาน: รับ event จาก content.js → หา element → click ผ่าน React Fiber/native
  // ข้อดี: ไม่มี yellow bar + อาจ bypass isTrusted check ของ Flow
  window.addEventListener('__flow_main_click__', function(e) {
    var detail = e.detail || {};
    var x = detail.x;
    var y = detail.y;
    var requestId = detail.requestId;
    var result = { success: false, method: null, error: null, requestId: requestId };

    try {
      // หา element ที่ตำแหน่งนั้น
      var el = document.elementFromPoint(x, y);
      if (!el) {
        result.error = 'no element at (' + x + ', ' + y + ')';
        window.dispatchEvent(new CustomEvent('__flow_main_click_result__', { detail: result }));
        return;
      }

      // หา button parent (ถ้า el เป็น icon/span ใน button)
      var btn = el.closest && el.closest('button') ? el.closest('button') : el;
      console.log('[v4.3 MAIN-click] target:', btn.tagName, btn.className.substring(0, 50));

      // === Method 1: React Fiber onClick (PRIMARY — Flow's React listens at fiber level) ===
      // Native click ไม่พอ — Flow's React onClick ไม่รับเหตุการณ์จาก HTMLElement.click()
      // ต้องเรียก React Fiber's onClick โดยตรงให้ Flow process click
      var fiberKey = null;
      var keys = Object.keys(btn);
      for (var i = 0; i < keys.length; i++) {
        if (keys[i].indexOf('__reactFiber') === 0 || keys[i].indexOf('__reactInternalInstance') === 0) {
          fiberKey = keys[i];
          break;
        }
      }
      if (fiberKey) {
        var fiber = btn[fiberKey];
        var node = fiber;
        var found = false;
        while (node && !found) {
          if (node.memoizedProps && typeof node.memoizedProps.onClick === 'function') {
            try {
              var fakeEvent = {
                type: 'click',
                target: btn,
                currentTarget: btn,
                preventDefault: function() {},
                stopPropagation: function() {},
                isPropagationStopped: function() { return false; },
                isDefaultPrevented: function() { return false; },
                nativeEvent: { isTrusted: true, type: 'click', target: btn },
                isTrusted: true
              };
              node.memoizedProps.onClick(fakeEvent);
              result = { success: true, method: 'react-fiber', requestId: requestId };
              found = true;
              console.log('[v4.3 MAIN-click] ✅ React Fiber onClick fired');
              break;
            } catch (errFiber) {
              console.warn('[v4.3 MAIN-click] React Fiber error:', errFiber.message);
            }
          }
          node = node.return;
        }
      }

      // === Method 2: Native click() (fallback) ===
      if (!result.success) {
        try {
          HTMLElement.prototype.click.call(btn);
          result = { success: true, method: 'native-click', requestId: requestId };
          console.log('[v4.3 MAIN-click] ✅ Native click() fired (fallback)');
        } catch (errNative) {
          console.warn('[v4.3 MAIN-click] Native click failed:', errNative.message);
        }
      }

      // === Method 3: Dispatch event sequence (last resort) ===
      if (!result.success) {
        try {
          var btnRectM3 = btn.getBoundingClientRect();
          var cxM3 = btnRectM3.left + btnRectM3.width / 2;
          var cyM3 = btnRectM3.top + btnRectM3.height / 2;
          var opts = { bubbles: true, cancelable: true, view: window, clientX: cxM3, clientY: cyM3, button: 0 };
          btn.dispatchEvent(new MouseEvent('mousedown', opts));
          btn.dispatchEvent(new MouseEvent('mouseup', opts));
          btn.dispatchEvent(new MouseEvent('click', opts));
          result = { success: true, method: 'dispatch-events', requestId: requestId };
          console.log('[v4.3 MAIN-click] ✅ Dispatched mouse events (last resort)');
        } catch (errDispatch) {
          console.warn('[v4.3 MAIN-click] Dispatch failed:', errDispatch.message);
        }
      }

      if (!result.success) {
        result.error = 'all 3 methods failed';
      }
    } catch (err) {
      result.error = err.message;
      console.warn('[v4.3 MAIN-click] Exception:', err.message);
    }

    // ส่ง result กลับไปที่ content.js
    window.dispatchEvent(new CustomEvent('__flow_main_click_result__', { detail: result }));
  });

  // === v0.6.1 (port VIP v4.6.7): Merge fallback — content.js สั่ง MAIN world fetch video URL ตรงๆ ===
  // ใช้เมื่อ download-hook ดักไฟล์ไม่ติด (Flow ปล่อย A/B เปลี่ยนวิธี download)
  // ADDITIVE: event listener ใหม่ล้วน — ไม่แตะ hook เดิม → ไม่กระทบ Auto/Story/Podcast
  // รันใน MAIN world → fetch blob: ได้ชัวร์ + reuse path เดิม (dispatch __flow_final_video__)
  window.addEventListener('__flow_fetch_video_url__', function(e) {
    var detail = e.detail || {};
    var url = detail.url;
    var sceneIndex = detail.sceneIndex;
    function reply(ok, extra) {
      var d = { ok: ok, sceneIndex: sceneIndex };
      if (extra) for (var k in extra) d[k] = extra[k];
      window.dispatchEvent(new CustomEvent('__flow_fetch_video_result__', { detail: d }));
    }
    if (!url) { reply(false, { error: 'no url' }); return; }
    try {
      fetch(url).then(function(r) { return r.blob(); }).then(function(blob) {
        if (!blob || blob.size < 100000) { // <100KB = ไม่ใช่วิดีโอจริง (poster/preview)
          reply(false, { error: 'blob too small (' + (blob ? blob.size : 0) + ')' });
          return;
        }
        var reader = new FileReader();
        reader.onloadend = function() {
          // ส่งเข้า path เดิม → content.js listener จะ set window.__flowFinalVideoData__ ให้เอง
          window.dispatchEvent(new CustomEvent('__flow_final_video__', {
            detail: { base64: reader.result, size: blob.size, filename: 'merge_fallback_' + sceneIndex + '.mp4', source: 'dom-fallback' }
          }));
          reply(true, { size: blob.size });
        };
        reader.onerror = function() { reply(false, { error: 'FileReader error' }); };
        reader.readAsDataURL(blob);
      }).catch(function(err) {
        reply(false, { error: (err && err.message) || 'fetch failed' });
      });
    } catch (err) {
      reply(false, { error: (err && err.message) || 'exception' });
    }
  });

  // === Hook 1: anchorClick — ดัก Extend Scene download (Final 15 วิ) ===
  var _origClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function() {
    if (this.href && this.href.startsWith('blob:') && this.download && this.download.endsWith('.mp4')) {
      var href = this.href;
      var filename = this.download;
      console.log('[v3.5 Hook] Intercepted anchor download: ' + filename);

      // v4.0.1: ถ้าตั้ง flag ไม่เซฟคลิป → บล็อค download (video ได้จาก apiIntercept แล้ว)
      if (window.__skipVideoDownload__) {
        console.log('[v4.0.1 Hook] ⏭️ Skip download to disk (apiIntercept มี video แล้ว)');
        // ยัง dispatch event เผื่อ apiIntercept ไม่ทัน (fallback)
        fetch(href).then(function(r) { return r.blob(); }).then(function(blob) {
          var reader = new FileReader();
          reader.onloadend = function() {
            window.dispatchEvent(new CustomEvent('__flow_final_video__', {
              detail: { base64: reader.result, size: blob.size, filename: filename, source: 'anchorClick' }
            }));
          };
          reader.readAsDataURL(blob);
        }).catch(function(e) {});
        return; // ไม่เรียก _origClick → ไม่ download ลงเครื่อง!
      }

      fetch(href).then(function(r) { return r.blob(); }).then(function(blob) {
        var reader = new FileReader();
        reader.onloadend = function() {
          window.dispatchEvent(new CustomEvent('__flow_final_video__', {
            detail: { base64: reader.result, size: blob.size, filename: filename, source: 'anchorClick' }
          }));
        };
        reader.readAsDataURL(blob);
      }).catch(function(e) {
        console.log('[v3.5 Hook] Anchor fetch error: ' + e.message);
      });
    }
    return _origClick.call(this);
  };

  // === Hook 2: createObjectURL — ดัก Add-to-Scene / Scene Builder download ===
  var _origCreate = URL.createObjectURL.bind(URL);
  URL.createObjectURL = function(blob) {
    var url = _origCreate(blob);
    if (blob instanceof Blob && blob.type && blob.type.startsWith('video/')) {
      console.log('[v3.5 Hook] Intercepted createObjectURL: ' + blob.type + ' size=' + blob.size);
      var reader = new FileReader();
      reader.onloadend = function() {
        window.__flowCapturedBlobs__.push({
          base64: reader.result,
          size: blob.size,
          type: blob.type,
          url: url,
          ts: Date.now()
        });
        window.dispatchEvent(new CustomEvent('__flow_final_video__', {
          detail: { base64: reader.result, size: blob.size, filename: '', source: 'createObjectURL', blobUrl: url }
        }));
      };
      reader.readAsDataURL(blob);
    }
    return url;
  };

  // === Hook 3: fetch API intercept — ดัก Extend Scene Final video จาก API response ===
  // v4.0.1: ดัก response จาก runVideoFxCheckConcatenationStatus
  // response JSON มี "encodedVideo" = base64 video พร้อมใช้เลย (ไม่ต้อง fetch blob + FileReader)
  var _origFetch = window.fetch;
  window.fetch = function() {
    var url = arguments[0];
    var urlStr = typeof url === 'string' ? url : (url && url.url ? url.url : '');

    // เช็คว่าเป็น API ที่ต้องการดักหรือไม่
    if (urlStr.indexOf('runVideoFxCheckConcatenationStatus') !== -1) {
      console.log('[v4.0.1 Hook] Intercepted ConcatenationStatus API call');

      return _origFetch.apply(this, arguments).then(function(response) {
        // Clone response เพื่ออ่าน body โดยไม่กระทบ original
        var cloned = response.clone();

        cloned.json().then(function(json) {
          // หา encodedVideo ใน response
          var encodedVideo = null;

          // อาจอยู่ที่ json.encodedVideo หรือ json.response.encodedVideo
          if (json && json.encodedVideo) {
            encodedVideo = json.encodedVideo;
          } else if (json && json.response && json.response.encodedVideo) {
            encodedVideo = json.response.encodedVideo;
          }

          // ค้นหาลึกขึ้น ถ้ายังไม่เจอ
          if (!encodedVideo) {
            var jsonStr = JSON.stringify(json);
            var match = jsonStr.match(/"encodedVideo"\s*:\s*"([A-Za-z0-9+/=]{1000,})"/);
            if (match) {
              encodedVideo = match[1];
              console.log('[v4.0.1 Hook] Found encodedVideo via regex search');
            }
          }

          if (encodedVideo && encodedVideo.length > 10000) {
            console.log('[v4.0.1 Hook] ✅ Got encodedVideo from API! Length: ' + encodedVideo.length);

            // แปลง raw base64 → data URL
            var dataUrl = 'data:video/mp4;base64,' + encodedVideo;
            var size = Math.round(encodedVideo.length * 3 / 4); // ประมาณขนาดไฟล์จริง

            window.dispatchEvent(new CustomEvent('__flow_final_video__', {
              detail: {
                base64: dataUrl,
                size: size,
                filename: 'extend_final_' + Date.now() + '.mp4',
                source: 'apiIntercept'
              }
            }));

            console.log('[v4.0.1 Hook] ✅ Dispatched Final video from API! (' + Math.round(size / 1024 / 1024 * 10) / 10 + ' MB)');
          } else {
            console.log('[v4.0.1 Hook] ConcatenationStatus response — no encodedVideo yet (status check)');
          }
        }).catch(function(e) {
          console.log('[v4.0.1 Hook] JSON parse error (non-fatal):', e.message);
        });

        return response; // คืน original response ให้ Flow ใช้ปกติ
      });
    }

    // v4.2.2: ดัก generate API ทั้งหมด — image, video, extend scene
    // ถ้า 403/4xx/5xx → แจ้ง content.js ทันที (ไม่ต้องรอ timeout 30-60s)
    // verified endpoints (Flow update 2026-05-07):
    //   - flowMedia:batchGenerateImages (image gen)
    //   - video:batchAsyncGenerateVideoExtendVideo (extend scene)
    //   - และ pattern อื่นๆ
    var isGenerateAPI = urlStr.indexOf('batchGenerateImages') !== -1
                     || urlStr.indexOf('batchAsyncGenerate') !== -1   // ← ใหม่ครอบคลุม video extend
                     || urlStr.indexOf('ExtendVideo') !== -1          // ← extend scene specific
                     || urlStr.indexOf('flowMedia:batch') !== -1
                     || (urlStr.indexOf('runVideoFx') !== -1 && urlStr.indexOf('runVideoFxCheck') === -1)
                     || urlStr.indexOf('generateVideo') !== -1
                     || urlStr.indexOf('extendScene') !== -1
                     || urlStr.indexOf('flowMedia:extend') !== -1
                     || (urlStr.indexOf('aisandbox-pa.googleapis.com') !== -1 && urlStr.indexOf(':batch') !== -1);
    // v4.4.1: เช็คว่า URL เป็น extend endpoint ไหม → ถ้าใช่ skip body-based detection ใหม่
    // เหตุผล: Extend Mode มี retry/detection ของตัวเองที่ทำงานดีอยู่แล้ว (DOM-based)
    // ห้าม raise flag _flowGenerateFailed จาก hook ใหม่ตอน extend phase
    // → ยังคง HTTP error detection (4xx/5xx) ของเก่าไว้ ไม่กระทบพฤติกรรมเดิม
    var isExtendEndpoint = urlStr.indexOf('ExtendVideo') !== -1
                        || urlStr.indexOf('extendScene') !== -1
                        || urlStr.indexOf('flowMedia:extend') !== -1
                        || urlStr.indexOf('batchAsyncGenerateVideoExtendVideo') !== -1;
    // v0.6.1: ⚠️ endpoint สร้าง "วิดีโอ" (Veo) — response 200 เป็น async batch envelope ที่ _flowCheckBodyFailure
    //   อ่านผิดเป็น fail บ่อย (false positive "Generate API 200 — Flow ปฏิเสธสร้างคลิป" ทั้งที่คลิปเสร็จ)
    //   → ข้าม body-scan สำหรับ video-gen เหมือนที่ข้าม extend (ของจริงที่เฟลยังจับได้จาก HTTP error + การ์ด Failed บน DOM)
    var isVideoGenEndpoint = urlStr.indexOf('GenerateVideoStartImage') !== -1
                          || urlStr.indexOf('batchAsyncGenerateVideo') !== -1
                          || urlStr.indexOf('generateVideo') !== -1
                          || urlStr.indexOf('runVideoFx') !== -1;

    if (isGenerateAPI) {
      return _origFetch.apply(this, arguments).then(function(response) {
        if (!response.ok) {
          console.log('[v4.2.2 Hook] ⚠️ Generate API failed: ' + response.status + ' (' + urlStr.substring(0, 80) + ')');
          window.dispatchEvent(new CustomEvent('__flow_generate_failed__', {
            detail: {
              status: response.status,
              url: urlStr,
              api: 'batchGenerateImages',
              timestamp: Date.now()
            }
          }));
        } else if (!isExtendEndpoint && !isVideoGenEndpoint) {
          // v4.4.1: response 200 OK แต่ body อาจบอกว่าเฟล (Veo audio gen failed, etc.)
          // เฉพาะ endpoint สร้าง "ภาพ" (batchGenerateImages) — extend/video-gen ใช้ DOM-detect ของเดิม (กัน false-positive)
          response.clone().json().then(function(json) {
            var failInfo = _flowCheckBodyFailure(json);
            if (failInfo) {
              console.log('[v4.4.1 Hook] ⚠️ Generate API 200 OK but body indicates FAIL: ' + failInfo.field + '=' + JSON.stringify(failInfo.value));
              window.dispatchEvent(new CustomEvent('__flow_generate_failed__', {
                detail: {
                  status: 200,
                  url: urlStr,
                  api: 'body-status-fail',
                  error: failInfo.field + '=' + (typeof failInfo.value === 'object' ? JSON.stringify(failInfo.value) : failInfo.value),
                  source: 'body-json',
                  timestamp: Date.now()
                }
              }));
            }
          }).catch(function() { /* ไม่ใช่ JSON — ลอง text scan */
            response.clone().text().then(function(txt) {
              var hit = _flowCheckTextFailure(txt);
              if (hit) {
                console.log('[v4.4.1 Hook] ⚠️ Generate API 200 OK but TEXT indicates FAIL: ' + hit.value);
                window.dispatchEvent(new CustomEvent('__flow_generate_failed__', {
                  detail: { status: 200, url: urlStr, api: 'body-text-fail', error: hit.value, source: 'body-text', timestamp: Date.now() }
                }));
              }
            }).catch(function() {});
          });
        }
        return response;
      }).catch(function(err) {
        console.log('[v4.2.2 Hook] ⚠️ Generate API exception: ' + err.message);
        window.dispatchEvent(new CustomEvent('__flow_generate_failed__', {
          detail: {
            status: 0,
            url: urlStr,
            api: 'batchGenerateImages',
            error: err.message,
            timestamp: Date.now()
          }
        }));
        throw err;
      });
    }

    // v4.4.4: ระบบ track extend API state (Flow update 2026-05-20)
  // ดัก batchAsyncGenerateVideoExtendVideo (request) → store batchId
  // ดัก batchCheckAsyncVideoGenerationStatus (response) → update status per batchId
  // expose: window._flowExtendApiState = { [batchId]: { status, sceneId, mediaId, startedAt } }
  if (!window._flowExtendApiState) window._flowExtendApiState = {};

  if (urlStr.indexOf('batchAsyncGenerateVideoExtendVideo') !== -1) {
    return _origFetch.apply(this, arguments).then(function(response) {
      // Parse outgoing request body
      try {
        var reqBody = arguments[1] && arguments[1].body;
        if (typeof reqBody === 'string') {
          var reqJson = JSON.parse(reqBody);
          var ctx = reqJson && reqJson.mediaGenerationContext;
          var batchId = ctx && ctx.batchId;
          var sceneId = ctx && ctx.sceneContext && ctx.sceneContext.sceneId;
          var position = ctx && ctx.sceneContext && ctx.sceneContext.position;
          if (batchId) {
            window._flowExtendApiState[batchId] = {
              status: 'pending',
              sceneId: sceneId,
              position: position,
              startedAt: Date.now()
            };
            console.log('[v4.4.4 ExtendAPI] 🎬 Started — batchId=' + batchId + ' scene=' + sceneId + ' pos=' + position);
            window.dispatchEvent(new CustomEvent('__flow_extend_started__', {
              detail: { batchId: batchId, sceneId: sceneId, position: position }
            }));
          }
        }
      } catch (e) { console.log('[v4.4.4 ExtendAPI] parse request body fail:', e.message); }
      return response;
    });
  }

  // v4.4.4: Concatenation API — รวม clips เป็น final video (อาจ fail ถ้า scene เฟล)
  // endpoint: runVideoFxConcatenation
  // Response error shape (verified 2026-05-20):
  //   { "error": { "code": 500, "message": "Internal error encountered.", "status": "INTERNAL" } }
  if (urlStr.indexOf('runVideoFxConcatenation') !== -1) {
    return _origFetch.apply(this, arguments).then(function(response) {
      // ดึง body ตรวจ structure error — แม้ HTTP status = 200 อาจมี body error
      var status = response.status;
      response.clone().text().then(function(txt) {
        var errDetail = null;
        try {
          var json = JSON.parse(txt);
          if (json && json.error) {
            errDetail = {
              code: json.error.code,
              message: json.error.message,
              status: json.error.status
            };
          }
        } catch (e) {}
        if (!response.ok || errDetail) {
          console.log('[v4.4.4 ExtendAPI] 🚨 Concatenation fail HTTP ' + status + (errDetail ? ' — ' + errDetail.message : ''));
          window.dispatchEvent(new CustomEvent('__flow_concatenation_failed__', {
            detail: { status: status, url: urlStr, error: errDetail, timestamp: Date.now() }
          }));
        }
      }).catch(function() {
        // text() failed (rare)
        if (!response.ok) {
          window.dispatchEvent(new CustomEvent('__flow_concatenation_failed__', {
            detail: { status: status, url: urlStr, timestamp: Date.now() }
          }));
        }
      });
      return response;
    }).catch(function(err) {
      console.log('[v4.4.4 ExtendAPI] 🚨 Concatenation network error: ' + err.message);
      window.dispatchEvent(new CustomEvent('__flow_concatenation_failed__', {
        detail: { status: 0, url: urlStr, error: err.message, timestamp: Date.now() }
      }));
      throw err;
    });
  }

  if (urlStr.indexOf('batchCheckAsyncVideoGenerationStatus') !== -1) {
    return _origFetch.apply(this, arguments).then(function(response) {
      if (!response.ok) return response;
      response.clone().json().then(function(json) {
        try {
          var workflows = json && json.workflows;
          var media = json && json.media;
          if (!Array.isArray(workflows) || !Array.isArray(media)) return;
          // map mediaName → workflow.batchId
          var mediaNameToBatch = {};
          workflows.forEach(function(wf) {
            if (wf && wf.metadata && wf.metadata.batchId && wf.metadata.primaryMediaId) {
              mediaNameToBatch[wf.metadata.primaryMediaId] = wf.metadata.batchId;
            }
          });
          media.forEach(function(m) {
            var mediaName = m && m.name;
            var batchId = mediaNameToBatch[mediaName];
            if (!batchId) return;
            var status = m && m.mediaMetadata && m.mediaMetadata.mediaStatus && m.mediaMetadata.mediaStatus.mediaGenerationStatus;
            var prev = window._flowExtendApiState[batchId];
            if (!prev) {
              // ครั้งแรกที่ check (อาจไม่ดัก request ทัน) — สร้าง state ขึ้นมา
              window._flowExtendApiState[batchId] = {
                status: 'pending',
                sceneId: m.sceneId,
                mediaId: mediaName,
                startedAt: Date.now()
              };
              prev = window._flowExtendApiState[batchId];
            }
            // อัปเดต state
            var normalizedStatus = 'pending';
            if (typeof status === 'string') {
              var s = status.toUpperCase();
              // CRITICAL FIX (verified 2026-05-20): Flow ใช้ "MEDIA_GENERATION_STATUS_SUCCESSFUL"
              // ไม่ใช่ COMPLETED/SUCCEEDED ที่เดาไว้
              if (s.indexOf('SUCCESSFUL') !== -1 || s.indexOf('COMPLETED') !== -1 || s.indexOf('SUCCEEDED') !== -1 || s.indexOf('READY') !== -1) {
                normalizedStatus = 'success';
              } else if (s.indexOf('FAILED') !== -1 || s.indexOf('ERROR') !== -1 || s.indexOf('CANCELLED') !== -1 || s.indexOf('CANCELED') !== -1) {
                normalizedStatus = 'failed';
              }
            }
            if (prev.status !== normalizedStatus && normalizedStatus !== 'pending') {
              console.log('[v4.4.4 ExtendAPI] 📡 batchId=' + batchId + ' status: ' + prev.status + ' → ' + normalizedStatus + ' (raw: ' + status + ')');
              prev.status = normalizedStatus;
              prev.rawStatus = status;
              prev.mediaId = mediaName;
              prev.completedAt = Date.now();
              window.dispatchEvent(new CustomEvent('__flow_extend_status__', {
                detail: { batchId: batchId, status: normalizedStatus, rawStatus: status, mediaId: mediaName, sceneId: m.sceneId }
              }));
            }
          });
        } catch (e) { console.log('[v4.4.4 ExtendAPI] parse check response fail:', e.message); }
      }).catch(function() {});
      return response;
    });
  }

  // v4.4.1: NOTE — เคยพิจารณาเพิ่ม Hook สำหรับ polling endpoints (runVideoFxCheck*)
    // แต่ poll endpoint ใช้ร่วม first-scene + extend แยกไม่ได้จาก URL → เสี่ยงรบกวน extend retry
    // เลื่อนไป v4.4.2 — จะ wire up state จาก content.js (skipPollFailDetect flag ตอน extend phase)
    // ตอนนี้ใช้ body detection ใน isGenerateAPI (initial response) เป็นหลัก
    // + HTTP 4xx/5xx detection ของเก่า + DOM-based detection ใน content.js
    // = ครอบ first-scene fail ได้ส่วนใหญ่ ไม่กระทบ extend

    // URL อื่นๆ ผ่านไปปกติ
    return _origFetch.apply(this, arguments);
  };

  // === Delay revokeObjectURL 60 วินาที เพื่อให้ fetch ทัน ===
  var _origRevoke = URL.revokeObjectURL.bind(URL);
  URL.revokeObjectURL = function(url) {
    setTimeout(function() { _origRevoke(url); }, 60000);
  };

  console.log('[v4.0.1 Hook] Flow video hooks installed! (anchorClick + createObjectURL + apiIntercept)');
})();
