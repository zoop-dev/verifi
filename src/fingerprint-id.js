import { state } from './state.js';
import { _vP } from './storage.js';
import { _vsave } from './storage.js';
import { _vupdSc } from './telemetry.js';
import { _POW_URL, _SITE_ID } from './site-config.js';

var _FP_KEY = 'identifi-history';

function _safe(fn, fb) { try { return fn(); } catch (e) { return fb; } }

function _sha256(str) {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)).then(function (buf) {
    return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  });
}

function _canvas() {
  return _safe(function () {
    var c = document.createElement('canvas');
    c.width = 240; c.height = 60;
    var ctx = c.getContext('2d');
    if (!ctx) return null;
    ctx.textBaseline = 'top';
    ctx.font = "16px Arial";
    ctx.fillStyle = '#f60'; ctx.fillRect(0, 0, 100, 20);
    ctx.fillStyle = '#069'; ctx.fillText('verifi 😀 0xACE', 2, 15);
    ctx.fillStyle = 'rgba(102,204,0,0.7)'; ctx.fillText('verifi 😀 0xACE', 4, 30);
    return c.toDataURL();
  }, null);
}

function _fonts() {
  return _safe(function () {
    var bases = ['monospace', 'sans-serif', 'serif'];
    var test = ['Arial', 'Calibri', 'Comic Sans MS', 'Consolas', 'Courier New', 'Georgia',
      'Helvetica', 'Impact', 'Menlo', 'Monaco', 'Roboto', 'Segoe UI', 'Tahoma',
      'Times New Roman', 'Verdana'];
    var span = document.createElement('span');
    span.style.cssText = 'position:absolute;left:-9999px;font-size:72px';
    span.textContent = 'mmmmmmmmmmlli';
    document.body.appendChild(span);
    var base = {};
    bases.forEach(function (b) { span.style.fontFamily = b; base[b] = { w: span.offsetWidth, h: span.offsetHeight }; });
    var count = test.filter(function (f) {
      return bases.some(function (b) {
        span.style.fontFamily = "'" + f + "'," + b;
        return span.offsetWidth !== base[b].w || span.offsetHeight !== base[b].h;
      });
    }).length;
    document.body.removeChild(span);
    return count;
  }, 0);
}

function _webgl() {
  return _safe(function () {
    var gl = document.createElement('canvas').getContext('webgl') ||
              document.createElement('canvas').getContext('experimental-webgl');
    if (!gl) return { vendor: null, renderer: null };
    var dbg = gl.getExtension('WEBGL_debug_renderer_info');
    return {
      vendor: String(dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR)),
      renderer: String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)),
    };
  }, { vendor: null, renderer: null });
}

export function initFingerprint() {
  try {
    var nav = navigator, scr = screen;
    var canvasData = _canvas();
    var wgl = _webgl();

    var fontCount = _fonts();
    (canvasData ? _sha256(canvasData) : Promise.resolve(null)).then(function (canvasHash) {

      var stable = {
        platform: nav.platform || null,
        hardwareConcurrency: nav.hardwareConcurrency || null,
        deviceMemory: nav.deviceMemory || null,
        screenResolution: scr.width + 'x' + scr.height,
        colorDepth: scr.colorDepth,
        timezone: _safe(function () { return Intl.DateTimeFormat().resolvedOptions().timeZone; }, null),
        product: nav.product || null,
        vendor: nav.vendor || null,
        vendorSub: nav.vendorSub || null,
        canvasHash: canvasHash,
        fontCount: fontCount,
        webglVendor: wgl.vendor,
        webglRenderer: wgl.renderer,
      };

      return _sha256(JSON.stringify(stable)).then(function (resilientId) {
        var now = Date.now();
        var history = null;
        try { history = JSON.parse(localStorage.getItem(_FP_KEY) || 'null'); } catch (e) {}
        var visitCount = (history ? history.visitCount : 0) + 1;
        try {
          localStorage.setItem(_FP_KEY, JSON.stringify({
            stable: stable,
            resilientId: resilientId,
            firstSeen: history ? history.firstSeen : now,
            lastSeen: now,
            visitCount: visitCount,
          }));
        } catch (e) {}
        state._resilientId = resilientId;
        state._fpVisitCount = visitCount;

        try {
          fetch(_POW_URL.replace('/pow-verify', '/api/fp-check'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fingerprint_id: resilientId }),
          }).then(function (r) { return r.json(); }).then(function (data) {
            if (data.penalty) {
              _vP.hp = Math.max(0.01, Math.min(0.99, _vP.hp + data.penalty));
              _vsave(); _vupdSc();
            }
            if (data.flags && data.flags.length) {
              state._vIpFlags = [...new Set([...state._vIpFlags, ...data.flags])];
            }
            if (data.fast_challenge) {
              state._vIpFlags = [...new Set([...state._vIpFlags, 'fast_challenge'])];
            }
          }).catch(function () {});
        } catch (e) {}
      });
    }).catch(function () {});
  } catch (e) {}
}

