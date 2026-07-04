import { w, d } from './env.js';
import { state } from './state.js';
import { _botCheckEnabled } from './bot-heuristics.js';
import { _makePowChallenge, _solvePow, _getDifficulty } from './pow.js';
import { runChallenge } from './challenge/full.js';
import gateCss from './styles/gate.css?raw';
import permBlockCss from './styles/perm-block.css?raw';

(function () {
  if (!_botCheckEnabled || state._verified) return;
  try {
    if (sessionStorage.getItem('_vf_blocked') === '1') {
      try { w.stop(); } catch (e) {}
      function showPermBlock() {
        if (!d.body) { setTimeout(showPermBlock, 50); return; }
        var s = d.createElement('style');
        s.textContent = permBlockCss;
        d.head.appendChild(s);
        var g = d.createElement('div'); g.id = '_vfgate'; g.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#070a0e;display:flex;align-items:center;justify-content:center;padding:20px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
        g.innerHTML = '<div style="background:#0c1018;border:0.5px solid rgba(239,68,68,.15);border-radius:14px;padding:28px 24px;max-width:300px;width:100%;text-align:center"><div style="width:44px;height:44px;border-radius:50%;background:rgba(239,68,68,.06);border:0.5px solid rgba(239,68,68,.2);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;color:#ef4444"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg></div><p style="font-size:14px;font-weight:500;color:#cdd6e0;margin:0 0 5px">access blocked</p><p style="font-size:11px;color:#3d4f63;line-height:1.65;margin:0 0 18px">close this tab and reopen to try again.</p><div style="height:2px;background:#ef4444;border-radius:1px"></div><p style="font-size:10px;color:#1e2738;margin-top:18px">protected by <span onclick="_vshowAbout()" style="cursor:pointer;text-decoration:underline;text-underline-offset:2px">verifi</span></p></div>';
        d.body.style.overflow = 'hidden';
        d.body.appendChild(g);
      }
      showPermBlock(); return;
    }
  } catch (e) {}
  if (!state._isBot) return;

  function attachGate() {
    if (!d.head || !d.body) { setTimeout(attachGate, 30); return; }
    var gs = d.createElement('style'); gs.textContent = gateCss; d.head.appendChild(gs);
    var g = d.createElement('div'); g.id = '_vfgate';
    g.innerHTML = '<div id="_vfgate_card">' +
        '<div id="_vfgate_icon"><div id="_vfgate_spinner"></div></div>' +
        '<p id="_vfgate_title">checking your browser</p>' +
        '<p id="_vfgate_sub">this may take a moment</p>' +
        '<div id="_vfgate_bw"><div id="_vfgate_bar"></div></div>' +
        '<p id="_vfgate_attr">protected by <span onclick="_vshowAbout()" style="cursor:pointer;text-decoration:underline;text-underline-offset:2px">verifi</span></p>' +
      '</div>';
    d.body.style.overflow = 'hidden';
    d.body.appendChild(g);

    var bar = d.getElementById('_vfgate_bar');
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
          var ring = d.getElementById('_vfgate_spinner');
          var title = d.getElementById('_vfgate_title');
          var sub = d.getElementById('_vfgate_sub');
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
