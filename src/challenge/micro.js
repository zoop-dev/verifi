import { w, d } from '../env.js';
import { state } from '../state.js';
import { lsSet } from '../site-config.js';
import { _vlock, _vunlock, _vshowAbout } from '../about.js';
import { _vanalyze, _vupdSc, _vMB, _vSB, _vSc } from '../telemetry.js';
import { _behScore } from '../behavior.js';
import { _vemit } from '../events.js';
import { _botCheckEnabled } from '../bot-heuristics.js';
import { runChallenge } from './full.js';

export function runMicroChallenge(onPass, onFail) {
  if (!_botCheckEnabled || state._verified) { onPass && onPass(); return; }
  _vlock();
  var overlay = d.createElement('div');
  overlay.id = '_st4ts_ch';
  var styleEl = d.createElement('style');
  styleEl.textContent =
    '#_st4ts_ch{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:20px}' +
    '@keyframes _spin{to{transform:rotate(360deg)}}' +
    '@keyframes _mfade{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}' +
    '@keyframes _mexpand{from{max-height:140px}to{max-height:500px}}' +
    '#_st4ts_micro{background:#0c1018;border:0.5px solid #1e2738;border-radius:12px;width:260px;overflow:hidden;animation:_mfade .2s ease;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;user-select:none;-webkit-user-select:none}' +
    '#_st4ts_micro.expanding{animation:_mexpand .3s ease;max-height:500px}' +
    '#_st4ts_mring{width:14px;height:14px;border:1.5px solid rgba(0,200,255,.2);border-top-color:#00c8ff;border-radius:50%;animation:_spin .7s linear infinite;flex-shrink:0}' +
    '#_st4ts_mbw{height:2px;background:#111820;border-radius:1px;overflow:hidden;margin:0 14px 12px}' +
    '#_st4ts_mbar{height:100%;border-radius:1px;background:#00c8ff;width:20%;transition:width .6s ease,background .3s}' +
    '#_st4ts_mattr{font-size:10px;color:#1e2738;padding:0 14px 10px;text-align:center}' +
    '#_st4ts_mattr a{color:#2d3748;text-decoration:underline;text-underline-offset:2px}' +
    '#_st4ts_mhead{padding:14px 14px 10px;display:flex;align-items:center;gap:10px}' +
    '#_st4ts_micon{flex-shrink:0}' +
    '#_st4ts_mtitle{font-size:12px;font-weight:500;color:#cdd6e0;margin-bottom:2px}' +
    '#_st4ts_msub{font-size:10px;color:#3d4f63}' +
    '#_st4ts_mexpanded{display:none;padding:0 14px 14px;text-align:center}' +
    '#_st4ts_mbtn{width:48px;height:48px;border-radius:50%;border:1.5px solid rgba(0,200,255,.5);background:rgba(0,200,255,.05);display:flex;align-items:center;justify-content:center;margin:12px auto 0;cursor:pointer;color:#00c8ff;font-size:18px}' +
    '#_st4ts_mshield{width:40px;height:40px;border-radius:50%;background:rgba(0,200,255,.06);border:0.5px solid rgba(0,200,255,.2);display:flex;align-items:center;justify-content:center;color:#00c8ff}' +
    '#_st4ts_mstatus{font-size:11px;color:#3d4f63;margin-top:8px;min-height:14px}';

  d.head.appendChild(styleEl);

  overlay.innerHTML =
    '<div id="_st4ts_micro">' +
      '<div id="_st4ts_mhead">' +
        '<div id="_st4ts_micon"><div id="_st4ts_mring"></div></div>' +
        '<div><div id="_st4ts_mtitle">verifying</div><div id="_st4ts_msub">checking your browser</div></div>' +
      '</div>' +
      '<div id="_st4ts_mbw"><div id="_st4ts_mbar"></div></div>' +
      '<div id="_st4ts_mexpanded"></div>' +
      '<div id="_st4ts_mattr">powered by <span onclick="_vshowAbout()" style="cursor:pointer;text-decoration:underline;text-underline-offset:2px">verifi</span></div>' +
    '</div>';

  d.body.appendChild(overlay); overlay.style.pointerEvents = 'auto';

  var box = d.getElementById('_st4ts_micro');
  var ring = d.getElementById('_st4ts_mring');
  var bar = d.getElementById('_st4ts_mbar');
  var title = d.getElementById('_st4ts_mtitle');
  var sub = d.getElementById('_st4ts_msub');
  var icon = d.getElementById('_st4ts_micon');
  var expanded = d.getElementById('_st4ts_mexpanded');
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
      lsSet('_st4ts_v', '1');
      state._verified = true; state._isBot = false; state._challengePassed = true; _vemit('pass', { probability: _vSc.p, confidence: _vSc.c });
      setTimeout(function () {
        overlay.style.transition = 'opacity .3s'; overlay.style.opacity = '0';
        _vunlock(); setTimeout(function () { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); styleEl.remove(); onPass && onPass(); }, 300);
      }, 900);
    } else {

      bar.style.width = '15%';
      bar.style.background = '#ef4444';
      ring.style.display = 'none';
      icon.innerHTML = '<div id="_st4ts_mshield"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg></div>';
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
        '<div id="_st4ts_mbtn" onclick="_mHandleClick()">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' +
        '</div>' +
        '<div id="_st4ts_mstatus" style="font-size:11px;color:#3d4f63;margin-top:10px;min-height:14px"></div>';
      mstatus = d.getElementById('_st4ts_mstatus');

      setTimeout(function () { bar.style.width = '35%'; }, 200);

      w._mHandleClick = function () {
        bar.style.width = '80%';
        var mbtn = d.getElementById('_st4ts_mbtn');
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
            lsSet('_st4ts_v', '1'); state._verified = true; state._isBot = false; state._challengePassed = true; _vemit('pass', { probability: _vSc.p, confidence: _vSc.c });
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
