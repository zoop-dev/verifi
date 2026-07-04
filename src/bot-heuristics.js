import { w, d } from './env.js';
import { state } from './state.js';
import { lsGet } from './site-config.js';
import { _vSc } from './telemetry.js';

state._botScore = 0;
state._forceFailFirst = false;
state._verified = lsGet('_vf_v') === '1';
export var _botCheckEnabled = (function () {
  try {
    var scripts = d.querySelectorAll('script[src*="v.js"]');
    for (var i = 0; i < scripts.length; i++) {
      var v = scripts[i].dataset && scripts[i].dataset.botCheck;
      if (v === 'false' || v === '0') return false;
    }
  } catch (e) {}
  return true;
})();

(function () {
  try { if (navigator.webdriver) state._botScore += 40; } catch (e) {}
  try { if (!navigator.plugins || navigator.plugins.length === 0) state._botScore += 20; } catch (e) {}
  try { if (!w.chrome && /chrome/i.test(navigator.userAgent)) state._botScore += 20; } catch (e) {}
  try { if (/bot|crawler|spider|scraper|headless|phantom|selenium|puppeteer|playwright/i.test(navigator.userAgent)) state._botScore += 60; } catch (e) {}
  try { var c = d.createElement('canvas'); var ctx = c.getContext('2d'); ctx.fillText('test', 0, 10); if (!c.toDataURL().length) state._botScore += 20; } catch (e) { state._botScore += 10; }
  try { if (!navigator.getBattery) state._botScore += 10; } catch (e) {}

  try { if (w.outerWidth === 0 || w.outerHeight === 0) state._botScore += 30; } catch (e) {}
  try { if (history.length <= 1) state._botScore += 10; } catch (e) {}

  try {
    var gl = d.createElement('canvas').getContext('webgl') || d.createElement('canvas').getContext('experimental-webgl');
    if (gl) {
      var dbg = gl.getExtension('WEBGL_debug_renderer_info');
      if (dbg) {
        var renderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '';
        var vendor = gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) || '';
        if (/SwiftShader|llvmpipe|softpipe|Mesa OffScreen|ANGLE.*SwiftShader/i.test(renderer + vendor)) state._botScore += 35;
        if (/Google.*ANGLE|Chromium/i.test(vendor) && /ANGLE.*D3D|ANGLE.*OpenGL/i.test(renderer)) state._botScore += 5;
      }
    }
  } catch (e) {}

  try {
    var el = d.createElement('div');
    d.body ? d.body.appendChild(el) : null;
    var cs = w.getComputedStyle(el);
    if (cs && cs.getPropertyValue('-webkit-app-region') === 'none') state._botScore -= 5;
    if (d.body) d.body.removeChild(el);
  } catch (e) {}

  try {
    if (w.Notification && w.Notification.permission === 'granted' && !navigator.userActivation?.hasBeenActive) state._botScore += 15;
  } catch (e) {}

  try {
    var perfEntries = performance.getEntriesByType('navigation');
    if (!perfEntries || perfEntries.length === 0) state._botScore += 15;
    else if (perfEntries[0] && perfEntries[0].type === 'navigate' && perfEntries[0].duration < 10) state._botScore += 10;
  } catch (e) {}

  try {
    if (!w.requestAnimationFrame) state._botScore += 20;
    if (!w.IntersectionObserver) state._botScore += 10;
    if (!w.ResizeObserver) state._botScore += 10;
  } catch (e) {}

  try {
    var ua = navigator.userAgent;
    var vendor = navigator.vendor || '';
    if (/Chrome/i.test(ua) && !/Chromium|HeadlessChrome/i.test(ua) && /Google Inc/i.test(vendor)) state._botScore -= 10;
  } catch (e) {}

  try {
    if (navigator.languages && navigator.languages.length === 0) state._botScore += 15;
    if (navigator.languages && navigator.languages[0] !== navigator.language) state._botScore += 5;
  } catch (e) {}

  try {
    if (screen.colorDepth < 24) state._botScore += 10;
    if (screen.width === screen.availWidth && screen.height === screen.availHeight && screen.width > 1024) state._botScore += 8;
  } catch (e) {}

  try {
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn && conn.rtt === 0 && conn.downlink > 100) state._botScore += 15;
  } catch (e) {}

  try {
    if (typeof w.callPhantom !== 'undefined' || typeof w._phantom !== 'undefined') state._botScore += 60;
    if (typeof w.__nightmare !== 'undefined') state._botScore += 60;
    if (typeof d.__selenium_evaluate !== 'undefined') state._botScore += 60;
    if (typeof w.domAutomation !== 'undefined' || typeof w.domAutomationController !== 'undefined') state._botScore += 60;
  } catch (e) {}

})();

(function () {
  try {
    var hp = d.createElement('input');
    hp.name = '_hp_field'; hp.type = 'text'; hp.tabIndex = -1; hp.autocomplete = 'nope';
    hp.style.cssText = 'position:absolute;left:-9999px;top:-9999px;opacity:0;height:0;width:0;pointer-events:none;';
    hp.setAttribute('aria-hidden', 'true');
    function attachHp() { if (d.body) { d.body.appendChild(hp); } }
    if (d.body) attachHp(); else d.addEventListener('DOMContentLoaded', attachHp);
    hp.addEventListener('input', function () { if (hp.value) { state._hpFilled = true; state._botScore += 80; state._isBot = true; } });
  } catch (e) {}
})();

state._isBot = state._botScore >= 60 && !state._verified;
state._challengePassed = false;

export function _getTier() {
  var p = _vSc.p, c = _vSc.c;
  if (state._verified) return 0;
  if (p >= 0.85 && c >= 0.6) return 0;
  if (p >= 0.55 && c >= 0.3) return 2;
  if (p >= 0.35 || c < 0.3) return 3;
  return 4;
}
