import { d } from './env.js';
import { state } from './state.js';
import { _botCheckEnabled } from './bot-heuristics.js';
import { _makePowChallenge, _solvePow, _getDifficulty } from './pow.js';
import { runChallenge } from './challenge/full.js';

(function () {
  if (!_botCheckEnabled || state._verified) return;
  try {
    if (sessionStorage.getItem('_st4ts_blocked') === '1') {
      function showPermBlock() {
        if (!d.body) { setTimeout(showPermBlock, 50); return; }
        var s = d.createElement('style');
        s.textContent = '#_stg{position:fixed;inset:0;z-index:2147483647;background:#070a0e;display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}#_stg_box{text-align:center;padding:0 24px;max-width:320px}';
        d.head.appendChild(s);
        var g = d.createElement('div'); g.id = '_stg'; g.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#070a0e;display:flex;align-items:center;justify-content:center;padding:20px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
        g.innerHTML = '<div style="background:#0c1018;border:0.5px solid rgba(239,68,68,.15);border-radius:14px;padding:28px 24px;max-width:300px;width:100%;text-align:center"><div style="width:44px;height:44px;border-radius:50%;background:rgba(239,68,68,.06);border:0.5px solid rgba(239,68,68,.2);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;color:#ef4444"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg></div><p style="font-size:14px;font-weight:500;color:#cdd6e0;margin:0 0 5px">access blocked</p><p style="font-size:11px;color:#3d4f63;line-height:1.65;margin:0 0 18px">close this tab and reopen to try again.</p><div style="height:2px;background:#ef4444;border-radius:1px"></div><p style="font-size:10px;color:#1e2738;margin-top:18px">protected by <span onclick="_vshowAbout()" style="cursor:pointer;text-decoration:underline;text-underline-offset:2px">verifi</span></p></div>';
        d.body.style.overflow = 'hidden';
        d.body.appendChild(g);
      }
      showPermBlock(); return;
    }
  } catch (e) {}
  if (!state._isBot) return;

  var GATE_CSS =
    '#_stg{position:fixed;inset:0;z-index:2147483647;background:#070a0e;display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:20px}' +
    '@keyframes _stg_spin{to{transform:rotate(360deg)}}' +
    '@keyframes _stg_fi{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}' +
    '#_stg_card{background:#0c1018;border:0.5px solid #1e2738;border-radius:14px;padding:28px 24px;max-width:300px;width:100%;text-align:center;animation:_stg_fi .25s ease;user-select:none;-webkit-user-select:none}' +
    '#_stg_icon{width:44px;height:44px;border-radius:50%;background:rgba(0,200,255,.06);border:0.5px solid rgba(0,200,255,.2);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;color:#00c8ff}' +
    '#_stg_spinner{width:20px;height:20px;border:2px solid rgba(0,200,255,.2);border-top-color:#00c8ff;border-radius:50%;animation:_stg_spin .8s linear infinite}' +
    '#_stg_title{font-size:14px;font-weight:500;color:#cdd6e0;margin:0 0 5px}' +
    '#_stg_sub{font-size:11px;color:#3d4f63;margin:0 0 20px;line-height:1.65}' +
    '#_stg_bw{height:2px;background:#111820;border-radius:1px;overflow:hidden}' +
    '#_stg_bar{height:100%;background:#00c8ff;border-radius:1px;width:0%;transition:width .4s ease,background .3s}' +
    '#_stg_attr{font-size:10px;color:#1e2738;margin-top:18px}' +
    '#_stg_attr a{color:#2d3748;text-decoration:underline;text-underline-offset:2px}';

  function attachGate() {
    if (!d.head || !d.body) { setTimeout(attachGate, 30); return; }
    var gs = d.createElement('style'); gs.textContent = GATE_CSS; d.head.appendChild(gs);
    var g = d.createElement('div'); g.id = '_stg';
    g.innerHTML = '<div id="_stg_card">' +
        '<div id="_stg_icon"><div id="_stg_spinner"></div></div>' +
        '<p id="_stg_title">checking your browser</p>' +
        '<p id="_stg_sub">this may take a moment</p>' +
        '<div id="_stg_bw"><div id="_stg_bar"></div></div>' +
        '<p id="_stg_attr">protected by <span onclick="_vshowAbout()" style="cursor:pointer;text-decoration:underline;text-underline-offset:2px">verifi</span></p>' +
      '</div>';
    d.body.style.overflow = 'hidden';
    d.body.appendChild(g);

    var bar = d.getElementById('_stg_bar');
    var prog = 0;
    var pi = setInterval(function () { prog = Math.min(80, prog + (Math.random() * 6 + 2)); if (bar) bar.style.width = prog + '%'; }, 250);

    state._powResult = null;
    state._powDone = false;
    var _challenge = _makePowChallenge();
    var _diff = _getDifficulty();
    _solvePow(_challenge, _diff).then(function (r) { state._powResult = r; state._powDone = true; });

    var _minWait = 1200;
    var _startT = Date.now();
    function _tryLaunch() {
      if (!state._powDone) { setTimeout(_tryLaunch, 100); return; }
      clearInterval(pi);
      runChallenge(
        function () {
          if (bar) { bar.style.width = '100%'; }
          setTimeout(function () {
            g.style.transition = 'opacity .35s ease'; g.style.opacity = '0';
            d.body.style.overflow = '';
            setTimeout(function () { if (g.parentNode) g.parentNode.removeChild(g); gs.remove(); }, 360);
          }, 250);
        },
        function () {
          clearInterval(pi);
          if (bar) { bar.style.width = '100%'; bar.style.background = '#ef4444'; }
          var ring = d.getElementById('_stg_spinner');
          var title = d.getElementById('_stg_title');
          var sub = d.getElementById('_stg_sub');
          if (ring) { ring.style.borderColor = 'rgba(239,68,68,.2)'; ring.style.borderTopColor = '#ef4444'; ring.style.animation = 'none'; }
          if (title) { title.textContent = 'access denied'; }
          if (sub) { sub.textContent = 'your browser did not pass our security check. close this tab and reopen.'; }
        }
      );
    }
    setTimeout(_tryLaunch, _minWait);
  }

  if (d.readyState === 'loading') { d.addEventListener('DOMContentLoaded', attachGate); }
  else { attachGate(); }
})();
