import { w, d } from './env.js';
import { state } from './state.js';
import { _botCheckEnabled, _getTier } from './bot-heuristics.js';
import { _vlock } from './about.js';
import { _vCfg } from './config.js';
import { _vupdSc, _vSc } from './telemetry.js';
import { _vP } from './storage.js';
import { runMicroChallenge } from './challenge/micro.js';
import { runChallenge } from './challenge/full.js';

(function () {
  function _vautoinit() {
    if (!_botCheckEnabled || state._verified) return;

    try {
      if (sessionStorage.getItem('_vf_blocked') === '1') {
        if (!d.body) { setTimeout(_vautoinit, 30); return; }
        var gs = d.createElement('style'), g = d.createElement('div');
        gs.textContent = '#_vfgate{position:fixed;inset:0;z-index:2147483647;background:#070a0e;display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}';
        d.head.appendChild(gs);
        g.id = '_vfgate'; g.innerHTML = '<div style="background:#0c1018;border:0.5px solid rgba(239,68,68,.15);border-radius:14px;padding:28px 24px;max-width:300px;width:100%;text-align:center"><p style="font-size:14px;font-weight:500;color:#cdd6e0;margin:0 0 5px">access blocked</p><p style="font-size:11px;color:#3d4f63;line-height:1.65;margin:0">close this tab and reopen to try again.</p></div>';
        _vlock(); d.body.appendChild(g); return;
      }
    } catch (e) {}
    if (!_vCfg.autoChallenge) return;
    _vupdSc();
    var _cb_pass = _vCfg.onPass ? function () { _vCfg.onPass({ probability: _vSc.p, confidence: _vSc.c }); } : null;
    var _cb_fail = _vCfg.onFail ? function () { _vCfg.onFail({ probability: _vSc.p, confidence: _vSc.c, reason: 'challenge' }); } : null;

    var _clearBot = false;
    try { if (navigator.webdriver) _clearBot = true; } catch (e) {}
    try { if (w.outerWidth === 0 && w.outerHeight === 0) _clearBot = true; } catch (e) {}

    if (state._vIpFlags.indexOf('fast_challenge') >= 0) _clearBot = true;
    if (_clearBot) { runChallenge(_cb_pass, _cb_fail); return; }

    if (_vSc.p >= 0.85 && _vP.ts > 0) { if (_cb_pass) _cb_pass(); return; }

    var _graceDone = false;
    var _graceChecks = [
      { delay: 4000, threshold: 0.28, conf: 0.25 },
      { delay: 10000, threshold: 0.42, conf: 0.20 },
    ];
    _graceChecks.forEach(function (chk, i) {
      setTimeout(function () {
        if (_graceDone || state._verified) return;
        _vupdSc();
        var p = _vSc.p, c = _vSc.c, tier = _getTier();

        if (p >= 0.85) { _graceDone = true; if (_cb_pass) _cb_pass(); return; }

        if (p < chk.threshold && c > chk.conf) {
          _graceDone = true;
          if (tier === 2) { runMicroChallenge(_cb_pass, _cb_fail); }
          else { runChallenge(_cb_pass, _cb_fail); }
          return;
        }

        if (i === _graceChecks.length - 1) {
          _graceDone = true;
          if (tier === 0) { if (_cb_pass) _cb_pass(); }
          else if (tier === 2) { setTimeout(function () { runMicroChallenge(_cb_pass, _cb_fail); }, 200); }
          else if (state._isBot || tier >= 3) { runChallenge(_cb_pass, _cb_fail); }
        }
      }, chk.delay);
    });
  }
  if (d.body) { _vautoinit(); }
  else { d.addEventListener('DOMContentLoaded', _vautoinit); }
})();
