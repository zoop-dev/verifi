import { w, d } from './env.js';
import { state } from './state.js';
import { lsSet } from './site-config.js';
import { _POW_URL } from './site-config.js';
import { _vlock, _vunlock, _vshowAbout } from './about.js';
import { _vCfg } from './config.js';
import { _vEvts, _vemit } from './events.js';
import { _vanalyze, _vupdSc, _vSc } from './telemetry.js';
import { _behScore } from './behavior.js';
import { _botCheckEnabled, _getTier } from './bot-heuristics.js';
import { runMicroChallenge } from './challenge/micro.js';
import { runChallenge } from './challenge/full.js';

w.verifi = {
  version: '1.0.0',
  on: function (ev, fn) { (_vEvts[ev] || (_vEvts[ev] = [])).push(fn); return w.verifi; },
  off: function (ev, fn) { if (_vEvts[ev]) _vEvts[ev] = _vEvts[ev].filter(function (f) { return f !== fn; }); return w.verifi; },
  config: function (opts) {
    if (opts.threshold !== undefined) _vCfg.threshold = opts.threshold;
    if (opts.onPass) _vCfg.onPass = opts.onPass;
    if (opts.onFail) _vCfg.onFail = opts.onFail;
    if (opts.autoChallenge !== undefined) _vCfg.autoChallenge = opts.autoChallenge;
    return w.verifi;
  },
  check: function (opts) {

    var threshold = (opts && opts.threshold != null) ? opts.threshold : _vCfg.threshold;
    var onPass = opts && opts.onPass;
    var onFail = opts && opts.onFail;
    lsSet('_vf_v', '0');
    state._verified = false;
    try { sessionStorage.removeItem('_vf_blocked'); sessionStorage.removeItem('_vf_rc'); } catch (e) {}
    var tier = _getTier();
    var pass = function () {
      _vupdSc();
      var r = { probability: _vSc.p, confidence: _vSc.c };
      if (onPass) onPass(r);
      return r;
    };
    var fail = function () {
      _vupdSc();
      var r = { probability: _vSc.p, confidence: _vSc.c, reason: 'challenge' };
      if (onFail) onFail(r);
      return r;
    };
    if (tier <= 1 && !state._forceFailFirst) { runMicroChallenge(pass, fail); }
    else { state._isBot = true; runChallenge(pass, fail); }
    return new Promise(function (resolve, reject) {
      var _origPass = onPass, _origFail = onFail;
      opts = opts || {};
      opts.onPass = function (r) { if (_origPass) _origPass(r); resolve(r); };
      opts.onFail = function (r) { if (_origFail) _origFail(r); reject(r); };
    });
  },
  botCheck: function (autoFail) {
    lsSet('_vf_v', '0');
    try { sessionStorage.removeItem('_vf_blocked'); sessionStorage.removeItem('_vf_rc'); } catch (e) {}
    state._verified = false; state._isBot = false;
    if (autoFail === true) state._forceFailFirst = true;
    var pass = function () { console.log('%c[verifi]%c check passed', 'color:#00c8ff;font-weight:700', 'color:#48bb78'); };
    var fail = function () { console.log('%c[verifi]%c check failed', 'color:#00c8ff;font-weight:700', 'color:#f56565'); };
    var tier = _getTier();
    if (tier <= 2 && !state._forceFailFirst) { runMicroChallenge(pass, fail); }
    else { state._isBot = true; runChallenge(pass, fail); }
  },
  fullscreenTest: function (autoFail) {
    lsSet('_vf_v', '0');
    try { sessionStorage.removeItem('_vf_blocked'); sessionStorage.removeItem('_vf_rc'); } catch (e) {}
    state._verified = false; state._isBot = true;
    if (autoFail === true) state._forceFailFirst = true;
    var g = d.getElementById('_vfgate'); if (g && g.parentNode) g.parentNode.removeChild(g);
    var GCSS = '#_vfgate{position:fixed;inset:0;z-index:2147483647;background:#070a0e;display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:20px}@keyframes _vfgate_spin{to{transform:rotate(360deg)}}@keyframes _vfgate_fi{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}#_vfgate_card{background:#0c1018;border:0.5px solid #1e2738;border-radius:14px;padding:28px 24px;max-width:300px;width:100%;text-align:center;animation:_vfgate_fi .25s ease;user-select:none}#_vfgate_icon{width:44px;height:44px;border-radius:50%;background:rgba(0,200,255,.06);border:0.5px solid rgba(0,200,255,.2);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;color:#00c8ff}#_vfgate_spinner{width:20px;height:20px;border:2px solid rgba(0,200,255,.2);border-top-color:#00c8ff;border-radius:50%;animation:_vfgate_spin .8s linear infinite}#_vfgate_title{font-size:14px;font-weight:500;color:#cdd6e0;margin:0 0 5px}#_vfgate_sub{font-size:11px;color:#3d4f63;margin:0 0 20px;line-height:1.65}#_vfgate_bw{height:2px;background:#111820;border-radius:1px;overflow:hidden}#_vfgate_bar{height:100%;background:#00c8ff;border-radius:1px;width:0%;transition:width .4s ease,background .3s}#_vfgate_attr{font-size:10px;color:#1e2738;margin-top:18px}#_vfgate_attr a{color:#2d3748;text-decoration:underline}';
    var gs = d.createElement('style'); gs.textContent = GCSS; d.head.appendChild(gs);
    var g2 = d.createElement('div'); g2.id = '_vfgate';
    g2.innerHTML = '<div id="_vfgate_card"><div id="_vfgate_icon"><div id="_vfgate_spinner"></div></div><p id="_vfgate_title">checking your browser</p><p id="_vfgate_sub">this may take a moment</p><div id="_vfgate_bw"><div id="_vfgate_bar"></div></div><p id="_vfgate_attr">protected by <span onclick="_vshowAbout()" style="cursor:pointer;text-decoration:underline;text-underline-offset:2px">verifi</span></p></div>';
    _vlock(); d.body.appendChild(g2);
    var bar = d.getElementById('_vfgate_bar'), prog = 0;
    var pi = setInterval(function () { prog = Math.min(80, prog + (Math.random() * 6 + 2)); if (bar) bar.style.width = prog + '%'; }, 250);
    setTimeout(function () {
      clearInterval(pi);
      runChallenge(
        function () { if (bar) bar.style.width = '100%'; setTimeout(function () { g2.style.transition = 'opacity .35s'; g2.style.opacity = '0'; _vunlock(); setTimeout(function () { if (g2.parentNode) g2.parentNode.removeChild(g2); gs.remove(); }, 360); }, 250); },
        function () { clearInterval(pi); if (bar) { bar.style.width = '100%'; bar.style.background = '#ef4444'; } var t = d.getElementById('_vfgate_title'), s = d.getElementById('_vfgate_sub'); if (t) t.textContent = 'access denied'; if (s) s.textContent = 'your browser did not pass our security check.'; }
      );
    }, 1000);
  },
  botScore: function () {
    return { score: state._botScore, behavioural: _behScore(), verified: state._verified, isBot: state._isBot, version: '1.0.0' };
  },
  profile: function () {
    _vupdSc();
    return { probability: _vSc.p, confidence: _vSc.c, signals: _vSc.sig, sessions: _vSc.ts, nn: _vSc.nn };
  },
  verify: function (opts) {
    var threshold = (opts && opts.threshold != null ? opts.threshold : _vCfg.threshold);
    var timeout = (opts && opts.timeout) || 8000;
    if (state._verified) return Promise.resolve({ human: true, probability: _vSc.p, confidence: _vSc.c });
    if (state._isBot && _vSc.c > 0.45) return Promise.reject({ human: false, probability: _vSc.p, confidence: _vSc.c });
    return new Promise(function (resolve, reject) {
      var t0 = Date.now();
      function check() {
        _vanalyze(); _vupdSc();
        var p = _vSc.p, c = _vSc.c, el = Date.now() - t0;
        if (state._verified) { resolve({ human: true, probability: p, confidence: c }); return; }
        if (c > 0.2 || el > 3000) {
          if (p >= threshold) resolve({ human: true, probability: p, confidence: c, signals: _vSc.sig, nn: _vSc.nn });
          else reject({ human: false, probability: p, confidence: c, signals: _vSc.sig });
          return;
        }
        if (el > timeout) {
          if (p >= threshold) resolve({ human: true, probability: p, confidence: c, low_confidence: true });
          else reject({ human: false, probability: p, confidence: c, timed_out: true });
          return;
        }
        setTimeout(check, 500);
      }
      setTimeout(check, 300);
    });
  },
  powVerify: function () {
    if (!state._powResult) return Promise.resolve({ ok: false, reason: 'not solved' });
    return fetch(_POW_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state._powResult)
    }).then(function (r) { return r.json(); });
  },
  getToken: function () { return state._vToken; },
  tokenExpiry: function () { return state._vTokenExp > 0 ? new Date(state._vTokenExp) : null; },
  isTokenValid: function () { return state._vToken && state._vTokenExp > Date.now(); },
  waitForToken: function (timeout) {
    if (state._vToken) return Promise.resolve(state._vToken);
    var ms = timeout || 10000;
    return new Promise(function (resolve, reject) {
      var t = setTimeout(function () { reject(new Error('token timeout')); }, ms);
      w.verifi.on('token', function (d) { clearTimeout(t); resolve(d.token); });
    });
  },
  embed: function () { return w.verifi; }
};

(function () {
  function renderWidget(el, theme, size, onPass, onFail) {
    if (typeof el === 'string') el = d.querySelector(el);
    if (!el) return;
    theme = theme || 'dark'; size = size || 'normal';
    var compact = size === 'compact';
    var isDark = theme !== 'light';
    var bg = isDark ? '#0c1018' : '#fff';
    var bd = isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.12)';
    var text = isDark ? '#cdd6e0' : '#1a202c';
    var muted = isDark ? '#3d4f63' : '#718096';
    var blue = '#00c8ff';
    var state2 = 'idle';
    var wEl = d.createElement('div');
    wEl.style.cssText = 'display:inline-flex;align-items:center;gap:' + (compact ? '10' : '12') + 'px;background:' + bg + ';border:1px solid ' + bd + ';border-radius:8px;padding:' + (compact ? '8px 14px' : '12px 16px') + ';font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",ui-monospace,monospace;user-select:none;box-sizing:border-box;min-width:' + (compact ? 200 : 260) + 'px;cursor:pointer;transition:border-color .2s';
    var box = d.createElement('div');
    box.style.cssText = 'width:' + (compact ? '18' : '22') + 'px;height:' + (compact ? '18' : '22') + 'px;border-radius:5px;border:1.5px solid ' + bd + ';background:' + (isDark ? '#111820' : '#f7fafc') + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:.2s';
    var label = d.createElement('div');
    label.style.cssText = 'display:flex;flex-direction:column;';
    var lt = d.createElement('span');
    lt.style.cssText = 'font-size:' + (compact ? '11' : '12') + 'px;font-weight:600;color:' + text + ';';
    lt.textContent = 'I am human';
    var lb = d.createElement('span');
    lb.style.cssText = 'font-size:9px;color:' + muted + ';margin-top:1px;cursor:pointer;text-decoration:underline;text-underline-offset:2px';
    lb.onclick = function (e) { e.stopPropagation(); _vshowAbout(); };
    lb.textContent = 'verifi';
    label.appendChild(lt);
    if (!compact) label.appendChild(lb);
    var logo = d.createElement('div');
    logo.style.cssText = 'margin-left:auto;font-size:9px;font-weight:700;font-style:italic;color:' + blue + ';letter-spacing:.02em;flex-shrink:0;cursor:pointer';
    logo.onclick = function (e) { e.stopPropagation(); _vshowAbout(); };
    logo.textContent = 'verifi';
    wEl.appendChild(box); wEl.appendChild(label); wEl.appendChild(logo);
    el.innerHTML = ''; el.appendChild(wEl);
    var spinner = '<svg width="12" height="12" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="animation:_vw_spin .7s linear infinite"><style>@keyframes _vw_spin{to{transform:rotate(360deg)}}</style><circle cx="12" cy="12" r="10" fill="none" stroke="' + blue + '" stroke-width="3" stroke-dasharray="31.4" stroke-dashoffset="10"/></svg>';
    var check = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
    var cross = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    function setState(s, data) {
      state2 = s;
      if (s === 'checking') {
        box.innerHTML = spinner; box.style.borderColor = blue;
        lt.textContent = 'verifying…'; wEl.style.cursor = 'default';
        wEl.style.borderColor = 'rgba(0,200,255,.25)';
      } else if (s === 'pass') {
        box.innerHTML = check; box.style.borderColor = '#10b981';
        box.style.background = 'rgba(16,185,129,.1)';
        lt.textContent = 'verified'; lt.style.color = '#10b981';
        lb.textContent = 'human verified ✓'; lb.style.textDecoration = 'none';
        wEl.style.cursor = 'default'; wEl.style.borderColor = 'rgba(16,185,129,.3)';
        el.dispatchEvent(new CustomEvent('verifi:pass', { bubbles: true, detail: data }));
        if (onPass) onPass(data);
      } else if (s === 'fail') {
        box.innerHTML = cross; box.style.borderColor = '#ef4444';
        lt.textContent = 'try again'; lt.style.color = '#ef4444';
        wEl.style.cursor = 'pointer'; wEl.style.borderColor = 'rgba(239,68,68,.2)';
        state2 = 'idle';
        if (onFail) onFail(data);
      }
    }
    wEl.addEventListener('click', function () {
      if (state2 !== 'idle') return;
      setState('checking');
      _vupdSc();
      var tier = _getTier();
      var pass = function () {
        var data = { probability: _vSc.p, confidence: _vSc.c };
        w.verifi.waitForToken(5000).then(function (tok) { setState('pass', { token: tok, probability: _vSc.p, confidence: _vSc.c }); }).catch(function () { setState('pass', { probability: _vSc.p, confidence: _vSc.c }); });
      };
      var fail = function () { setState('fail', { probability: _vSc.p, confidence: _vSc.c, reason: 'challenge' }); };
      if (tier <= 1) {
        setTimeout(function () {
          _vupdSc();
          if (_vSc.p >= (_vCfg.threshold || 0.45)) { pass(); }
          else { runChallenge(pass, fail); }
        }, 1200);
      } else { runChallenge(pass, fail); }
    });
  }
  w.verifi = w.verifi || {};
  w.verifi.embed = function (el, theme, size, onPass, onFail) { renderWidget(el, theme, size, onPass, onFail); return w.verifi; };
})();
