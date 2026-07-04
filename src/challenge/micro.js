import { w, d } from '../env.js';
import { state } from '../state.js';
import { lsSet } from '../site-config.js';
import { _vlock, _vunlock, _vshowAbout } from '../about.js';
import { _vanalyze, _vupdSc, _vMB, _vSB, _vSc } from '../telemetry.js';
import { _behScore } from '../behavior.js';
import { _vemit } from '../events.js';
import { _botCheckEnabled } from '../bot-heuristics.js';
import { runChallenge } from './full.js';
import microCss from '../styles/challenge-micro.css?raw';

export function runMicroChallenge(onPass, onFail) {
  if (!_botCheckEnabled || state._verified) { onPass && onPass(); return; }
  _vlock();
  var overlay = d.createElement('div');
  overlay.id = '_vf_ch';
  var styleEl = d.createElement('style');
  styleEl.textContent = microCss;

  d.head.appendChild(styleEl);

  overlay.innerHTML =
    '<div id="_vf_micro">' +
      '<div id="_vf_mhead">' +
        '<div id="_vf_micon"><div id="_vf_mring"></div></div>' +
        '<div><div id="_vf_mtitle">verifying</div><div id="_vf_msub">checking your browser</div></div>' +
      '</div>' +
      '<div id="_vf_mbw"><div id="_vf_mbar"></div></div>' +
      '<div id="_vf_mexpanded"></div>' +
      '<div id="_vf_mattr">powered by <span onclick="_vshowAbout()" style="cursor:pointer;text-decoration:underline;text-underline-offset:2px">verifi</span></div>' +
    '</div>';

  d.body.appendChild(overlay); overlay.style.pointerEvents = 'auto';

  var box = d.getElementById('_vf_micro');
  var ring = d.getElementById('_vf_mring');
  var bar = d.getElementById('_vf_mbar');
  var title = d.getElementById('_vf_mtitle');
  var sub = d.getElementById('_vf_msub');
  var icon = d.getElementById('_vf_micon');
  var expanded = d.getElementById('_vf_mexpanded');
  var mstatus = null;


  var prog = 20;
  var pi = setInterval(function () { prog = Math.min(75, prog + (Math.random() * 5 + 2)); bar.style.width = prog + '%'; }, 300);


  var _mStart = Date.now();
  setTimeout(function () {
    clearInterval(pi);
    _vanalyze(); _vupdSc();
    var score = _behScore() + (_vSc.c > 0.2 ? _vSc.p * 40 : 0);
    var humanScore = 0;
    if (_vMB.length >= 5) humanScore += 30;
    if (_vSB.length >= 2) humanScore += 20;
    if (!navigator.webdriver) humanScore += 20;
    humanScore += Math.min(30, Math.round(_behScore() * 0.3));

    if (humanScore >= 55 || (_vSc.p >= 0.65 && _vSc.c >= 0.25)) {

      bar.style.width = '100%';
      bar.style.background = '#10b981';
      ring.style.display = 'none';
      icon.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
      title.style.color = '#10b981';
      title.textContent = 'verified';
      sub.textContent = 'all good';
      lsSet('_vf_v', '1');
      state._verified = true; state._isBot = false; state._challengePassed = true; _vemit('pass', { probability: _vSc.p, confidence: _vSc.c });
      setTimeout(function () {
        overlay.style.transition = 'opacity .3s'; overlay.style.opacity = '0';
        _vunlock(); setTimeout(function () { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); styleEl.remove(); onPass && onPass(); }, 300);
      }, 900);
    } else {

      bar.style.width = '15%';
      bar.style.background = '#ef4444';
      ring.style.display = 'none';
      icon.innerHTML = '<div id="_vf_mshield"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg></div>';
      title.textContent = 'one quick check';
      title.style.color = '#cdd6e0';
      sub.textContent = 'click the circle to continue';
      bar.style.background = '#00c8ff';


      box.style.animation = 'none';
      box.style.maxHeight = '500px';
      box.style.overflow = 'hidden';
      box.style.transition = 'max-height .3s ease';
      box.style.width = '300px';
      box.style.transition = 'max-height .3s ease, width .3s ease';


      expanded.style.display = 'block';
      expanded.innerHTML =
        '<div id="_vf_mbtn" onclick="_mHandleClick()">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' +
        '</div>' +
        '<div id="_vf_mstatus" style="font-size:11px;color:#3d4f63;margin-top:10px;min-height:14px"></div>';
      mstatus = d.getElementById('_vf_mstatus');

      setTimeout(function () { bar.style.width = '35%'; }, 200);

      w._mHandleClick = function () {
        bar.style.width = '80%';
        var mbtn = d.getElementById('_vf_mbtn');
        if (mbtn) mbtn.innerHTML = '<div style="width:14px;height:14px;border:1.5px solid rgba(0,200,255,.2);border-top-color:#00c8ff;border-radius:50%;animation:_spin .7s linear infinite"></div>';
        if (mstatus) mstatus.textContent = 'verifying…';
        setTimeout(function () {
          var elapsed2 = Date.now() - _mStart;
          var hs2 = 0;
          if (_vMB.length >= 5) hs2 += 35;
          if (!navigator.webdriver) hs2 += 25;
          hs2 += Math.min(40, Math.round(_behScore() * 0.4));
          if (elapsed2 > 400) hs2 += 20;
          if (hs2 >= 60) {
            bar.style.width = '100%'; bar.style.background = '#10b981';
            title.style.color = '#10b981'; title.textContent = 'verified';
            sub.textContent = 'you are in';
            if (mbtn) { mbtn.style.borderColor = 'rgba(16,185,129,.4)'; mbtn.style.background = 'rgba(16,185,129,.06)'; mbtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'; }
            if (mstatus) { mstatus.textContent = 'verified ✓'; mstatus.style.color = '#10b981'; }
            lsSet('_vf_v', '1'); state._verified = true; state._isBot = false; state._challengePassed = true; _vemit('pass', { probability: _vSc.p, confidence: _vSc.c });
            setTimeout(function () { overlay.style.transition = 'opacity .3s'; overlay.style.opacity = '0'; setTimeout(function () { _vunlock(); if (overlay.parentNode) overlay.parentNode.removeChild(overlay); styleEl.remove(); onPass && onPass(); }, 300); }, 900);
          } else {

            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            styleEl.remove();
            runChallenge(onPass, onFail);
          }
        }, 1400);
      };
    }
  }, 1800);
}
