/**
 * PD Auto VIP — Flow Direct API client (v4.4.5)
 *
 * Bypasses Flow's UI clicks by calling Google Flow's internal API directly.
 * Reverse-engineered 2026-05-20 (Flow update day).
 *
 * Architecture:
 *   - Runs in MAIN world (declared in manifest.json content_scripts).
 *   - Auto-captures Authorization Bearer header from Flow's own outgoing
 *     fetch requests (TTL ~1h, refreshed by Flow's session).
 *   - Exposes window.PDFlowAPI for MAIN-world code; bridges to isolated
 *     world (content.js) via window.postMessage (see "Bridge protocol" below).
 *
 * Bridge protocol (isolated -> MAIN):
 *   window.postMessage({__pdFlowAPI: true, id, fn, args}, '*')
 *   reply -> {__pdFlowAPIResult: true, id, result?, error?}
 *
 * See helper `callFlowAPI()` at bottom of this file for content.js to copy.
 *
 * Status: WIP — library only. Not yet wired into content.js's Auto Mode.
 */
(function () {
  'use strict';

  if (window.PDFlowAPI) return;   // idempotent

  // ============ Constants (captured from Flow 2026-05-20) ============
  const SITEKEY = '6LdsFiUsAAAAAIjVDZcuLhaHiDn5nnHVXVRQGeMV';
  const BASE = 'https://aisandbox-pa.googleapis.com/v1';
  const FLOW_BASE = 'https://labs.google/fx/api';
  const TOOL = 'PINHOLE';
  const RECAPTCHA_APP_TYPE = 'RECAPTCHA_APPLICATION_TYPE_WEB';

  // recaptcha actions
  const ACT_IMAGE = 'IMAGE_GENERATION';
  const ACT_VIDEO = 'VIDEO_GENERATION';   // also used for extend

  // ============ Auth capture ============
  // Flow uses Authorization: Bearer <oauth>. We snapshot it from any
  // outgoing fetch so direct calls can replay it.
  let _authHeader = null;
  let _userPaygateTier = null;

  const _origFetch = window.fetch;
  window.fetch = function () {
    try {
      const arg0 = arguments[0];
      const arg1 = arguments[1] || {};
      let url = '';
      let headers = null;
      if (arg0 instanceof Request) {
        url = arg0.url;
        headers = arg0.headers;
      } else {
        url = typeof arg0 === 'string' ? arg0 : (arg0 && arg0.url) || '';
        if (arg1.headers instanceof Headers) headers = arg1.headers;
        else if (arg1.headers && typeof arg1.headers === 'object') {
          // plain object — normalize to Headers
          headers = new Headers(arg1.headers);
        }
      }
      if (url.indexOf('aisandbox-pa.googleapis.com') !== -1 && headers) {
        const auth = headers.get && headers.get('Authorization');
        if (auth && auth.length > 50) _authHeader = auth;
      }
    } catch (_) { /* never throw from hook */ }
    return _origFetch.apply(this, arguments);
  };

  // ============ Helpers ============
  function makeCtx(projectId, sessionId, token) {
    const ctx = { projectId, tool: TOOL, sessionId: sessionId || (';' + Date.now()) };
    if (token) ctx.recaptchaContext = { token, applicationType: RECAPTCHA_APP_TYPE };
    return ctx;
  }

  async function getToken(action) {
    if (!window.grecaptcha || !window.grecaptcha.enterprise) {
      throw new Error('grecaptcha.enterprise not ready');
    }
    return window.grecaptcha.enterprise.execute(SITEKEY, { action });
  }

  function requireAuth() {
    if (!_authHeader) throw new Error('Auth header not captured yet — interact with Flow once to seed.');
    return _authHeader;
  }

  /** v4.4.5: simple retry wrapper for transient network errors / 5xx */
  async function _fetchWithRetry(url, init, maxRetries) {
    const max = typeof maxRetries === 'number' ? maxRetries : 2;
    let lastErr = null;
    for (let attempt = 0; attempt <= max; attempt++) {
      try {
        const r = await _origFetch(url, init);
        // Retry on 5xx / 429 / 408
        if (r.status === 429 || r.status === 408 || (r.status >= 500 && r.status <= 599)) {
          if (attempt < max) {
            const wait = 1500 * Math.pow(2, attempt);
            console.warn('[v4.4.5 FlowAPI] HTTP ' + r.status + ' — retry in ' + wait + 'ms (attempt ' + (attempt + 1) + '/' + max + ')');
            await new Promise(res => setTimeout(res, wait));
            continue;
          }
        }
        return r;
      } catch (err) {
        // Network-level error (TypeError: Failed to fetch / ERR_CONNECTION_CLOSED)
        lastErr = err;
        if (attempt < max) {
          const wait = 2000 * Math.pow(2, attempt);
          console.warn('[v4.4.5 FlowAPI] network err: ' + err.message + ' — retry in ' + wait + 'ms (attempt ' + (attempt + 1) + '/' + max + ')');
          await new Promise(res => setTimeout(res, wait));
          continue;
        }
        throw err;
      }
    }
    throw lastErr || new Error('fetch failed');
  }

  async function post(path, body) {
    const r = await _fetchWithRetry(BASE + path, {
      method: 'POST',
      headers: { Authorization: requireAuth(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    });
    const text = await r.text();
    let json = null;
    try { json = JSON.parse(text); } catch (_) {}
    if (!r.ok) {
      // v4.4.5: dump full error body + offending request snippet to console
      // (ใช้ JSON.stringify เพื่อให้ copy ได้ตรง — ไม่ใช่ collapsible object)
      try {
        console.warn('[v4.4.5 FlowAPI] ❌ ' + r.status + ' ' + path);
        const respStr = (typeof json === 'object' && json !== null) ? JSON.stringify(json, null, 2) : String(text || '').slice(0, 2000);
        console.warn('[v4.4.5 FlowAPI] Response body (string):\n' + respStr);
        // hide recaptcha token but show body shape for diagnosis
        const safeBody = JSON.parse(JSON.stringify(body));
        const stripToken = (o) => {
          if (!o || typeof o !== 'object') return;
          if (o.recaptchaContext && o.recaptchaContext.token) {
            o.recaptchaContext = { token: '[len=' + o.recaptchaContext.token.length + ']', applicationType: o.recaptchaContext.applicationType };
          }
          // also strip very long strings (>200 chars) like imageBytes
          for (const k of Object.keys(o)) {
            if (typeof o[k] === 'string' && o[k].length > 200) {
              o[k] = '[truncated len=' + o[k].length + ' head=' + o[k].slice(0, 60) + ']';
            } else {
              stripToken(o[k]);
            }
          }
        };
        stripToken(safeBody);
        console.warn('[v4.4.5 FlowAPI] Request body (string):\n' + JSON.stringify(safeBody, null, 2));
      } catch (_) {}
      const err = new Error('Flow API ' + r.status + ' ' + (json && json.error && json.error.message || text.slice(0, 200)));
      err.status = r.status;
      err.body = json || text;
      throw err;
    }
    return json;
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => {
        // strip "data:<mime>;base64," prefix
        const s = String(fr.result);
        const comma = s.indexOf(',');
        resolve(comma >= 0 ? s.slice(comma + 1) : s);
      };
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
  }

  // ============ Public API ============
  const API = {

    /** Whether auth header has been captured yet. */
    isReady() { return !!_authHeader; },

    /** Captured Authorization header (for diagnostics). */
    getAuth() { return _authHeader; },

    // ---------- Credits (pre-flight check, free) ----------
    async getCredits() {
      // The /v1/credits endpoint uses ?key= API key + Authorization Bearer.
      // We rely on Flow having issued at least one fetch so we have auth.
      const r = await _origFetch(BASE + '/credits?key=AIzaSyBtrm0o5ab1c-Ec8ZuLcGt3oJAA5VWt3pY', {
        method: 'GET',
        headers: { Authorization: requireAuth() },
        credentials: 'include',
      });
      if (!r.ok) throw new Error('credits ' + r.status);
      const j = await r.json();
      // v4.4.5: เก็บ tier ไว้ใช้ตอน animate/extend (ของจริงจาก server ไม่ใช่ hardcode)
      if (j && j.userPaygateTier) _userPaygateTier = j.userPaygateTier;
      return j;   // {credits, userPaygateTier, sku, serviceTier, topUpCredits, subscriptionCredits}
    },

    // ---------- Create new Flow project (no recaptcha) ----------
    // projectId ถูก generate ฝั่ง client ก่อนเรียก — server แค่ register session
    // verified 2026-05-20:
    //   POST /v1/flowCreationAgent/sessions
    //   body: {projectId: "projects/<UUID>"}
    //   res:  {sessionInfo: {agentSessionId, sessionContext: {creationTime, lastUpdatedTime, agentMode}}}
    async createProject(projectUUID) {
      const uuid = projectUUID || crypto.randomUUID();
      const r = await _fetchWithRetry(BASE + '/flowCreationAgent/sessions', {
        method: 'POST',
        headers: { Authorization: requireAuth(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: 'projects/' + uuid }),
        credentials: 'include',
      });
      if (!r.ok) {
        const t = await r.text();
        const err = new Error('createProject ' + r.status + ' ' + t.slice(0, 200));
        err.status = r.status;
        throw err;
      }
      const j = await r.json();
      return { projectId: uuid, agentSessionId: j.sessionInfo && j.sessionInfo.agentSessionId, raw: j };
    },

    // ---------- Upload reference image (no recaptcha) ----------
    async uploadImage({ projectId, fileBlob, fileName, mimeType }) {
      const imageBytes = await blobToBase64(fileBlob);
      const body = {
        clientContext: { projectId, tool: TOOL },
        imageBytes,
        isUserUploaded: true,
        isHidden: false,
        mimeType: mimeType || fileBlob.type || 'image/png',
        fileName: fileName || ('upload-' + Date.now() + '.png'),
      };
      const j = await post('/flow/uploadImage', body);
      return j.media;   // {name, projectId, workflowId, workflowStepId, mediaMetadata}
    },

    // ---------- Generate image (Imagen / Nano Banana Pro) ----------
    async generateImage({
      projectId, sessionId, prompt, refUUIDs,
      imageModelName, aspectRatio, seed,
    }) {
      const token = await getToken(ACT_IMAGE);
      const ctx = makeCtx(projectId, sessionId, token);
      const body = {
        clientContext: ctx,
        mediaGenerationContext: { batchId: crypto.randomUUID() },
        useNewMedia: true,
        requests: [{
          clientContext: ctx,
          imageModelName: imageModelName || 'IMAGEN_4',   // or 'GEM_PIX_2' for Nano Banana Pro
          imageAspectRatio: aspectRatio || 'IMAGE_ASPECT_RATIO_PORTRAIT',
          structuredPrompt: { parts: [{ text: prompt }] },
          seed: typeof seed === 'number' ? seed : Math.floor(Math.random() * 1000000),
          imageInputs: (refUUIDs || []).map(name => ({
            imageInputType: 'IMAGE_INPUT_TYPE_REFERENCE',
            name,
          })),
        }],
      };
      const j = await post('/projects/' + projectId + '/flowMedia:batchGenerateImages', body);
      // j.media[0] = {name, image:{generatedImage:{fifeUrl, seed, ...}}, workflowId, ...}
      return { media: j.media, workflows: j.workflows, remainingCredits: j.remainingCredits };
    },

    // ---------- Create scene container (for extend chains) ----------
    async createScene({ projectId, workflowIds }) {
      const r = await _fetchWithRetry(BASE + '/flow/projects/' + projectId + '/scenes', {
        method: 'POST',
        headers: { Authorization: requireAuth(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowIds }),
        credentials: 'include',
      });
      if (!r.ok) throw new Error('createScene ' + r.status);
      return r.json();   // {scene:{sceneId,displayName,...}, sceneWorkflows:[...]}
    },

    // ---------- Animate image -> video (scene 1) ----------
    async animateImage({
      projectId, sessionId, prompt, imageMediaId,
      aspectRatio, seed, videoModelKey, cropCoordinates, userPaygateTier,
    }) {
      const token = await getToken(ACT_VIDEO);
      const ctx = makeCtx(projectId, sessionId, token);
      if (userPaygateTier) ctx.userPaygateTier = userPaygateTier;
      else if (_userPaygateTier) ctx.userPaygateTier = _userPaygateTier;
      const body = {
        mediaGenerationContext: {
          batchId: crypto.randomUUID(),
          audioFailurePreference: 'BLOCK_SILENCED_VIDEOS',
        },
        clientContext: ctx,
        requests: [{
          aspectRatio: aspectRatio || 'VIDEO_ASPECT_RATIO_PORTRAIT',
          textInput: { structuredPrompt: { parts: [{ text: prompt }] } },
          // v4.4.9b: default model fallback ใช้ interpolation_lite_low_priority (ฟรี 0 เครดิต ของบอท default)
          videoModelKey: videoModelKey || 'veo_3_1_i2v_lite_low_priority',
          seed: typeof seed === 'number' ? seed : Math.floor(Math.random() * 1000000),
          metadata: {},
          // 🩹 2026-08-10: ห้ามแนบ cropCoordinates — เว็บ Flow จริงส่งแค่ mediaId แล้ว (จับ payload สด · แก้พร้อม PD App v1.1.3)
          startImage: { mediaId: imageMediaId },
        }],
        useV2ModelConfig: true,
      };
      const j = await post('/video:batchAsyncGenerateVideoStartImage', body);
      // async: poll later with pollVideoStatus(j.media[0].name)
      return { media: j.media, workflows: j.workflows, remainingCredits: j.remainingCredits };
    },

    // ---------- Extend an existing video ----------
    async extendVideo({
      projectId, sessionId, sceneId, position, prompt, sourceVideoMediaId,
      aspectRatio, seed, videoModelKey, userPaygateTier,
    }) {
      const token = await getToken(ACT_VIDEO);
      const ctx = makeCtx(projectId, sessionId, token);
      if (userPaygateTier) ctx.userPaygateTier = userPaygateTier;
      else if (_userPaygateTier) ctx.userPaygateTier = _userPaygateTier;
      const body = {
        mediaGenerationContext: {
          batchId: crypto.randomUUID(),
          audioFailurePreference: 'BLOCK_SILENCED_VIDEOS',
          sceneContext: { sceneId, position },
        },
        clientContext: ctx,
        requests: [{
          aspectRatio: aspectRatio || 'VIDEO_ASPECT_RATIO_PORTRAIT',
          textInput: { structuredPrompt: { parts: [{ text: prompt }] } },
          // v4.4.9b: default model fallback ใช้ interpolation_lite_low_priority (ฟรี 0 เครดิต ของบอท default)
          videoModelKey: videoModelKey || 'veo_3_1_i2v_lite_low_priority',
          seed: typeof seed === 'number' ? seed : Math.floor(Math.random() * 1000000),
          metadata: { sceneId },
          videoInput: { mediaId: sourceVideoMediaId },
        }],
        useV2ModelConfig: true,
      };
      const j = await post('/video:batchAsyncGenerateVideoExtendVideo', body);
      return { media: j.media, workflows: j.workflows, remainingCredits: j.remainingCredits };
    },

    // ---------- Upsample (upscale) video → 1080p / 4K ----------
    // verified 2026-05-22 (captured via Claude in Chrome — Flow UI click "Download → 1080p" บนคลิปที่ยังไม่ upscale):
    //   POST /v1/video:batchAsyncGenerateVideoUpsampleVideo
    //   req: { mediaGenerationContext:{batchId,audioFailurePreference}, clientContext, requests:[
    //           {resolution, aspectRatio, videoModelKey, seed, metadata:{workflowId}, videoInput:{mediaId}}
    //         ], useV2ModelConfig:true }
    //   res: { media:[{name:"<mediaId>_upsampled", workflowId, ...}], workflows, remainingCredits }
    // หลัง trigger → poll ผ่าน pollVideoStatus({mediaId:"<mediaId>_upsampled"}) จนกว่า status SUCCESSFUL
    // แล้วค่อย fetch /fx/api/trpc/media.getMediaUrlRedirect?name=<mediaId>_upsampled เพื่อโหลดไฟล์จริง
    async upsampleVideo({
      projectId, sessionId, videoMediaId, videoWorkflowId,
      aspectRatio, seed, resolution, userPaygateTier,
    }) {
      const token = await getToken(ACT_VIDEO);
      const ctx = makeCtx(projectId, sessionId, token);
      if (userPaygateTier) ctx.userPaygateTier = userPaygateTier;
      else if (_userPaygateTier) ctx.userPaygateTier = _userPaygateTier;
      const res = resolution || 'VIDEO_RESOLUTION_1080P';
      // model key map: 1080P → veo_3_1_upsampler_1080p, 4K → veo_3_1_upsampler_4k (เดา)
      const modelKey = res === 'VIDEO_RESOLUTION_4K' ? 'veo_3_1_upsampler_4k' : 'veo_3_1_upsampler_1080p';
      const body = {
        mediaGenerationContext: {
          batchId: crypto.randomUUID(),
          audioFailurePreference: 'BLOCK_SILENCED_VIDEOS',
        },
        clientContext: ctx,
        requests: [{
          resolution: res,
          aspectRatio: aspectRatio || 'VIDEO_ASPECT_RATIO_PORTRAIT',
          videoModelKey: modelKey,
          seed: typeof seed === 'number' ? seed : Math.floor(Math.random() * 1000000),
          metadata: { workflowId: videoWorkflowId },
          videoInput: { mediaId: videoMediaId },
        }],
        useV2ModelConfig: true,
      };
      const j = await post('/video:batchAsyncGenerateVideoUpsampleVideo', body);
      // async: poll later with pollVideoStatus({mediaId: "<videoMediaId>_upsampled"})
      return { media: j.media, workflows: j.workflows, remainingCredits: j.remainingCredits };
    },

    // ---------- Poll video status ----------
    async pollVideoStatus({ projectId, mediaId }) {
      const token = await getToken(ACT_VIDEO);
      const body = {
        clientContext: makeCtx(projectId, null, token),
        media: [{ name: mediaId }],
      };
      const j = await post('/video:batchCheckAsyncVideoGenerationStatus', body);
      return j;   // {remainingCredits, media:[{name, mediaMetadata:{mediaStatus:{mediaGenerationStatus}}, video:{...}}]}
    },

    /** Helper: poll until SUCCESSFUL/FAILED. Throws on FAILED. */
    async waitForVideo({ projectId, mediaId, intervalMs, timeoutMs, onProgress }) {
      const start = Date.now();
      const interval = intervalMs || 3000;
      const timeout = timeoutMs || 10 * 60 * 1000;
      for (;;) {
        const j = await API.pollVideoStatus({ projectId, mediaId });
        const m = j.media && j.media[0];
        const status = m && m.mediaMetadata && m.mediaMetadata.mediaStatus && m.mediaMetadata.mediaStatus.mediaGenerationStatus;
        if (onProgress) try { onProgress(status, m); } catch (_) {}
        if (status === 'MEDIA_GENERATION_STATUS_SUCCESSFUL') return m;
        if (status && /FAIL|ERROR|CANCEL/i.test(status)) {
          const err = new Error('Video gen failed: ' + status);
          err.status = status;
          err.media = m;
          throw err;
        }
        if (Date.now() - start > timeout) throw new Error('waitForVideo timeout (' + timeout + 'ms)');
        await new Promise(r => setTimeout(r, interval));
      }
    },

    // ---------- Update scene workflow offsets (trim clips before concat) ----------
    // verified 2026-05-21 (captured via Claude in Chrome on real Flow UI):
    //   POST /v1/flow/scene/sceneWorkflows:update
    //   req:  {sceneId, projectId, sceneWorkflows:[{sceneId, workflow:{name:<workflowId>}, sceneWorkflowMetadata:{startTime,endTime,position,totalDuration}}]}
    //   res:  echoes scene + sceneWorkflows
    // UI ใช้ตัด 1s แรกของ extended clip — เก็บ offset metadata บน scene แล้ว concat อ่านต่อ
    async updateSceneWorkflowsOffsets({ sceneId, projectId, sceneWorkflows }) {
      const r = await _fetchWithRetry(BASE + '/flow/scene/sceneWorkflows:update', {
        method: 'POST',
        headers: { Authorization: requireAuth(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceneId, projectId, sceneWorkflows }),
        credentials: 'include',
      });
      const text = await r.text();
      let json = null;
      try { json = JSON.parse(text); } catch (_) {}
      if (!r.ok) {
        const err = new Error('updateSceneWorkflowsOffsets ' + r.status);
        err.status = r.status;
        err.body = json || text;
        throw err;
      }
      return json;
    },

    // ---------- Concatenate clips → final video ----------
    // verified 2026-05-20:
    //   req:  {inputVideos:[{mediaGenerationId, length:"8000000000", startTimeOffset:"0s", endTimeOffset:"8s"}, ...]}
    //   res:  {operation:{operation:{name:"projects/.../jobs/<jobId>"}}}
    // ใช้ name นี้ poll ใน checkConcatenationStatus
    async concatenate({ inputVideos }) {
      const r = await _fetchWithRetry(BASE + ':runVideoFxConcatenation', {
        method: 'POST',
        headers: { Authorization: requireAuth(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputVideos }),
        credentials: 'include',
      });
      const text = await r.text();
      let json = null;
      try { json = JSON.parse(text); } catch (_) {}
      if (!r.ok) {
        const err = new Error('concat ' + r.status);
        err.status = r.status;
        err.body = json || text;
        throw err;
      }
      return json;
    },

    // ---------- Check concat status ----------
    // verified 2026-05-20:
    //   req:  {operation:{operation:{name:"projects/.../jobs/<jobId>"}}}
    //   res (in progress): {status:"MEDIA_GENERATION_STATUS_ACTIVE", outputUri:"", mediaGenerationId:"", inputsCount:0}
    //   res (done):        {status:"MEDIA_GENERATION_STATUS_SUCCESSFUL", inputsCount:N, encodedVideo:"<MP4 base64>"}
    async checkConcatenationStatus({ operationName }) {
      const r = await _fetchWithRetry(BASE + ':runVideoFxCheckConcatenationStatus', {
        method: 'POST',
        headers: { Authorization: requireAuth(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: { operation: { name: operationName } } }),
        credentials: 'include',
      });
      const text = await r.text();
      let json = null;
      try { json = JSON.parse(text); } catch (_) {}
      if (!r.ok) {
        const err = new Error('checkConcat ' + r.status);
        err.status = r.status;
        err.body = json || text;
        throw err;
      }
      return json;   // {status, encodedVideo?, outputUri?, mediaGenerationId?, inputsCount}
    },

    /**
     * Helper: เรียก concatenate() → poll จน SUCCESSFUL → คืน encodedVideo
     * onProgress(status, response) — เรียกทุกรอบที่ poll
     */
    async concatAndWait({ inputVideos, intervalMs, timeoutMs, onProgress }) {
      const op = await API.concatenate({ inputVideos });
      const operationName = op && op.operation && op.operation.operation && op.operation.operation.name;
      if (!operationName) throw new Error('concat did not return operation.name');
      const interval = intervalMs || 3000;
      const timeout = timeoutMs || 10 * 60 * 1000;
      const start = Date.now();
      let last = null;
      for (;;) {
        const r = await API.checkConcatenationStatus({ operationName });
        if (onProgress) { try { onProgress(r.status, r); } catch (_) {} }
        if (r.status === 'MEDIA_GENERATION_STATUS_SUCCESSFUL') return r;   // มี r.encodedVideo (MP4 base64)
        if (r.status && /FAIL|ERROR|CANCEL/i.test(r.status)) {
          const err = new Error('concat failed: ' + r.status);
          err.status = r.status;
          err.body = r;
          throw err;
        }
        if (Date.now() - start > timeout) throw new Error('concat timeout ' + timeout + 'ms');
        last = r;
        await new Promise(res => setTimeout(res, interval));
      }
    },

    /** Helper: convert base64 MP4 → Blob (สำหรับ download / TikTok upload) */
    encodedVideoToBlob(base64) {
      const bin = atob(base64);
      const buf = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      return new Blob([buf], { type: 'video/mp4' });
    },

    // ---------- Get URL of finished media (image fifeUrl or video CDN) ----------
    /** tRPC redirect endpoint — returns a 302 to actual CDN. Use as <video src>. */
    getMediaUrlRedirect(mediaId) {
      return FLOW_BASE + '/trpc/media.getMediaUrlRedirect?name=' + encodeURIComponent(mediaId);
    },

    // ---------- v4.5.2: Delete a Flow project ----------
    // verified 2026-05-26 by other team:
    //   POST https://labs.google/fx/api/trpc/project.deleteProject
    //   headers: content-type: application/json   (no Bearer — uses session cookie)
    //   body:    {"json":{"projectToDeleteId":"<uuid>"}}
    //   res:     200 OK
    async deleteProject(projectId) {
      if (!projectId) throw new Error('deleteProject: projectId required');
      const r = await _fetchWithRetry(FLOW_BASE + '/trpc/project.deleteProject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: { projectToDeleteId: projectId } }),
        credentials: 'include',
      });
      const text = await r.text();
      let json = null;
      try { json = JSON.parse(text); } catch (_) {}
      if (!r.ok) {
        const err = new Error('deleteProject ' + r.status);
        err.status = r.status;
        err.body = json || text;
        throw err;
      }
      return json || { ok: true };
    },

    // ---------- v4.5.9: เปิด/ปิด Flow AI Agent toggle ของ project ----------
    // ปัญหา: บางบัญชี (เมลลูกค้า) พอเข้า New Project → Flow เปิด "Agent" panel มาเอง
    //   → ช่อง prompt หลักเพี้ยน/ถูกบดบัง บอททำงานพัง ต้องปิดก่อนเริ่มทุกครั้ง
    // verified curl (ดักจาก network 2026-06-10):
    //   PATCH .../projects/<id>/agentInfo?updateMask=agent_toggle_state
    //   content-type: text/plain;charset=UTF-8   (เลี่ยง preflight)
    //   body: {"agentToggleState":"AGENT_TOGGLE_STATE_DISABLED"}  (หรือ _ENABLED)
    //   auth: Bearer (จับอัตโนมัติ) — ไม่ต้องใช้ recaptcha
    // ใช้ได้ทุกโหมด (Auto/Express/Merge/Story/Podcast) เพราะเป็น server-side
    async setAgentToggle(projectId, enabled) {
      if (!projectId) throw new Error('setAgentToggle: projectId required');
      const state = enabled ? 'AGENT_TOGGLE_STATE_ENABLED' : 'AGENT_TOGGLE_STATE_DISABLED';
      const url = BASE + '/projects/' + projectId + '/agentInfo?updateMask=agent_toggle_state';
      const r = await _fetchWithRetry(url, {
        method: 'PATCH',
        headers: { Authorization: requireAuth(), 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify({ agentToggleState: state }),
        credentials: 'include',
      });
      const text = await r.text();
      let json = null;
      try { json = JSON.parse(text); } catch (_) {}
      if (!r.ok) {
        const err = new Error('setAgentToggle ' + r.status + ' ' + String(text || '').slice(0, 200));
        err.status = r.status;
        err.body = json || text;
        throw err;
      }
      return json || { ok: true };
    },
  };

  window.PDFlowAPI = API;

  // ============ Bridge: isolated world (content.js) -> MAIN ============
  window.addEventListener('message', async (e) => {
    if (e.source !== window) return;
    const d = e.data;
    if (!d || d.__pdFlowAPI !== true) return;
    const { id, fn, args } = d;
    /* 🌐 Flow แอปใหม่ (flow.google.com) — API คนละชุดกันสิ้นเชิง
       มี flow-api-new.js คอยคุยกับแอปใหม่แทน · อยู่แอปเก่า = active=false เดินเส้นเดิม 100% */
    const NF = window.__pdNewFlow;
    if (NF && NF.active) {
      try {
        if (fn === 'isReady') { window.postMessage({ __pdFlowAPIResult: true, id, result: true }, '*'); return; }
        if (fn === 'getAuth') { window.postMessage({ __pdFlowAPIResult: true, id, result: 'cookie' }, '*'); return; }
        const rNew = await NF.call(fn, args || []);
        window.postMessage({ __pdFlowAPIResult: true, id, result: rNew }, '*');
      } catch (errNew) {
        window.postMessage({
          __pdFlowAPIResult: true, id,
          error: (errNew && errNew.message) || String(errNew),
          errorStatus: errNew && errNew.status,
          errorBody: errNew && errNew.body,
        }, '*');
      }
      return;
    }
    if (typeof API[fn] !== 'function') {
      window.postMessage({ __pdFlowAPIResult: true, id, error: 'Unknown fn: ' + fn }, '*');
      return;
    }
    try {
      const result = await API[fn].apply(API, args || []);
      window.postMessage({ __pdFlowAPIResult: true, id, result }, '*');
    } catch (err) {
      window.postMessage({
        __pdFlowAPIResult: true, id,
        error: err && err.message || String(err),
        errorStatus: err && err.status,
        errorBody: err && err.body,
      }, '*');
    }
  });

  // ============ Snippet for content.js (isolated world) ============
  // function callFlowAPI(fn, ...args) {
  //   return new Promise((resolve, reject) => {
  //     const id = 'pdf-' + Math.random().toString(36).slice(2);
  //     const handler = (e) => {
  //       if (e.source !== window) return;
  //       const d = e.data;
  //       if (!d || !d.__pdFlowAPIResult || d.id !== id) return;
  //       window.removeEventListener('message', handler);
  //       if (d.error) {
  //         const err = new Error(d.error);
  //         err.status = d.errorStatus;
  //         err.body = d.errorBody;
  //         reject(err);
  //       } else {
  //         resolve(d.result);
  //       }
  //     };
  //     window.addEventListener('message', handler);
  //     window.postMessage({__pdFlowAPI: true, id, fn, args}, '*');
  //   });
  // }

  console.log('[v4.4.5] PDFlowAPI ready — auth captured?', API.isReady());
})();
