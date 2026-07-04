import { w, d } from '../env.js';
import { state } from '../state.js';
import { lsSet } from '../site-config.js';
import { _POW_URL, _SITE_ID } from '../site-config.js';
import { _vlock, _vunlock } from '../about.js';
import { _vSeq, _vTB, _vSc } from '../telemetry.js';
import { _vlearn } from '../nn.js';
import { _vpushWeights } from '../weights-sync.js';
import { _vemit } from '../events.js';
import { _behScore, _beh } from '../behavior.js';
import { _vfetchToken } from '../network.js';
import { _botCheckEnabled } from '../bot-heuristics.js';
import { _vP } from '../storage.js';
import { _vupdScore } from '../telemetry.js';

export function runChallenge(onPass, onFail) {
  if (!_botCheckEnabled) { state._isBot = false; onPass && onPass(); return; }
  if (state._verified) { state._isBot = false; onPass && onPass(); return; }

  try {
    if (sessionStorage.getItem('_vf_blocked') === '1') {
      _vunlock();
      state._isBot = true;
      onFail && onFail();
      return;
    }
  } catch (e) {}

  _vlock();
  var overlay = d.createElement('div');
  overlay.id = '_vf_ch';
  var mousePoints = [], lastMouse = { x: 0, y: 0 }, moveEntropy = 0, startTime = Date.now();
  var stage = 0, attempts = 0, attempts2 = 0;

  var CSS =
    '#_vf_ch{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:20px}' +
    '@keyframes _spin{to{transform:rotate(360deg)}}' +
    '@keyframes _shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}' +
    '@keyframes _fadein{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}' +
    '@keyframes _pop{0%{transform:scale(0)}70%{transform:scale(1.1)}100%{transform:scale(1)}}' +
    '#_vf_box{background:#0c1018;border:0.5px solid #1e2738;border-radius:14px;padding:28px 24px;max-width:310px;width:100%;text-align:center;animation:_fadein .2s ease;user-select:none;-webkit-user-select:none}' +
    '#_vf_shield{width:44px;height:44px;border-radius:50%;background:rgba(0,200,255,.06);border:0.5px solid rgba(0,200,255,.2);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:20px;color:#00c8ff}' +
    '#_vf_title{font-size:14px;font-weight:500;color:#cdd6e0;margin:0 0 5px}' +
    '#_vf_sub{font-size:11px;color:#3d4f63;margin:0 0 20px;line-height:1.65}' +
    '#_vf_prog{height:2px;background:#111820;border-radius:1px;margin-bottom:22px;overflow:hidden}' +
    '#_vf_bar{height:100%;background:#00c8ff;border-radius:1px;width:30%;transition:width .5s ease,background .3s}' +
    '#_vf_btn{width:54px;height:54px;border-radius:50%;border:1.5px solid rgba(0,200,255,.5);background:rgba(0,200,255,.05);display:flex;align-items:center;justify-content:center;cursor:pointer;margin:0 auto;transition:background .15s,transform .12s;font-size:20px;color:#00c8ff}' +
    '#_vf_btn:hover{background:rgba(0,200,255,.1);transform:scale(1.05)}' +
    '#_vf_btn:active{transform:scale(.96)}' +
    '.vf_ring{width:20px;height:20px;border:2px solid rgba(0,200,255,.2);border-top-color:#00c8ff;border-radius:50%;animation:_spin .7s linear infinite}' +
    '#_vf_status{font-size:11px;color:#3d4f63;margin-top:10px;min-height:16px}' +
    '#_vf_attr{font-size:10px;color:#1e2738;margin-top:18px}' +
    '#_vf_attr a{color:#2d3748;text-decoration:underline;text-underline-offset:2px}' +
    '#_vf_targets{position:relative;min-height:90px;background:#080d12;border-radius:8px;border:0.5px solid #111820;margin-bottom:10px;display:none;overflow:visible}' +
    '.vf_target{position:absolute;width:32px;height:32px;border-radius:50%;border:1.5px solid #f59e0b;background:rgba(245,158,11,.08);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px;color:#f59e0b;transition:background .1s;animation:_pop .25s ease;touch-action:manipulation}' +
    '.vf_target:hover{background:rgba(245,158,11,.18)}';

  var styleEl = d.createElement('style'); styleEl.textContent = CSS; d.head.appendChild(styleEl);

  overlay.innerHTML =
    '<div id="_vf_box">' +
      '<div id="_vf_shield" style="color:#00c8ff"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg></div>' +
      '<p id="_vf_title">one quick check</p>' +
      '<p id="_vf_sub">click the circle to continue</p>' +
      '<div id="_vf_prog"><div id="_vf_bar"></div></div>' +
      '<div id="_vf_targets"><svg id="_vf_trail" style="position:absolute;inset:0;width:100%;height:100%;opacity:.18;pointer-events:none" xmlns="http://www.w3.org/2000/svg"></svg></div>' +
      '<div id="_vf_btn" style="color:#00c8ff"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>' +
      '<div id="_vf_status"></div>' +
      '<p id="_vf_attr">powered by <span onclick="_vshowAbout()" style="cursor:pointer;text-decoration:underline;text-underline-offset:2px">verifi</span></p>' +
    '</div>';

  d.body.appendChild(overlay); overlay.style.pointerEvents = 'auto';

  var bar = d.getElementById('_vf_bar');
  var btn = d.getElementById('_vf_btn');
  var status = d.getElementById('_vf_status');
  var title = d.getElementById('_vf_title');
  var sub = d.getElementById('_vf_sub');
  var targetsEl = d.getElementById('_vf_targets');
  var shield = d.getElementById('_vf_shield');
  setTimeout(function () { bar.style.width = '40%'; }, 300);

  var mouseMoveHandler = function (e) {
    var dx = e.clientX - lastMouse.x, dy = e.clientY - lastMouse.y;
    if (Math.sqrt(dx * dx + dy * dy) > 5) {
      mousePoints.push(1);
      if (mousePoints.length > 3) {
        var angle = Math.atan2(dy, dx);
        moveEntropy += 0.1;
      }
      lastMouse = { x: e.clientX, y: e.clientY };
    }
  };
  d.addEventListener('mousemove', mouseMoveHandler);

  function setVerifying() {
    btn.style.cursor = 'default';
    btn.style.borderColor = 'rgba(0,200,255,.25)';
    btn.innerHTML = '<div class="vf_ring"></div>';
    status.textContent = 'verifying…';
    bar.style.width = '75%';
  }

  function setSuccess() {
    try { if (_vSeq.length >= 2) { _vlearn(_vSeq, 1); _vpushWeights(); } } catch (e) {}
    bar.style.width = '100%';
    bar.style.background = '#10b981';
    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
    btn.style.borderColor = 'rgba(16,185,129,.4)';
    btn.style.background = 'rgba(16,185,129,.06)';
    shield.style.borderColor = 'rgba(16,185,129,.2)';
    shield.style.background = 'rgba(16,185,129,.06)';
    shield.style.color = '#10b981';
    shield.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>';
    shield.style.color = '#10b981';
    status.style.color = '#10b981';
    status.textContent = 'verified ✓';
    lsSet('_vf_v', '1');
    state._verified = true; state._isBot = false; state._challengePassed = true; _vemit('pass', { probability: _vSc.p, confidence: _vSc.c });

    (function () {
      try {
        function doTokenFetch() {
          if (!state._powResult) { setTimeout(doTokenFetch, 300); return; }
          var payload = { site_id: _SITE_ID, pow: state._powResult, probability: _vSc.p, confidence: _vSc.c };
          fetch(_POW_URL.replace('/pow-verify', '/token'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }).then(function (r) { return r.json(); }).then(function (data) {
            if (data.token) {
              state._vToken = data.token;
              state._vTokenExp = Date.now() + (data.expires_in || 300) * 1000;
              _vemit('token', { token: data.token, expires_in: data.expires_in, probability: _vSc.p, confidence: _vSc.c });
              if (!state._vTokenRefreshInterval) {
                state._vTokenRefreshInterval = setInterval(_vfetchToken, 60000);
              }
            }
          }).catch(function () {});
        }
        doTokenFetch();
      } catch (e) {}
    })();
    setTimeout(function () {
      _vunlock();
      overlay.style.transition = 'opacity .25s'; overlay.style.opacity = '0';
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        styleEl.remove();
        d.removeEventListener('mousemove', mouseMoveHandler);
        onPass && onPass();
      }, 250);
    }, 900);
  }

  function setFail() {
    try { if (_vSeq.length >= 2) { _vlearn(_vSeq, 0); _vpushWeights('bot'); } } catch (e) {} _vemit('fail', { reason: 'challenge', probability: _vSc.p, confidence: _vSc.c });

    (function () { try { fetch(_POW_URL.replace('/pow-verify', '/ping'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ site_id: _SITE_ID, p: _vSc.p, fail: true }) }).catch(function () {}); } catch (e) {} })();
    bar.style.background = '#ef4444';
    bar.style.width = '10%';
    btn.style.animation = '_shake .4s ease';
    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    btn.style.borderColor = 'rgba(239,68,68,.5)';
    status.style.color = '#ef4444';
    status.textContent = '';
    setTimeout(function () {
      bar.style.background = '#00c8ff';
      bar.style.width = '20%';
      btn.style.animation = '';
      showHardChallenge();
    }, 800);
  }

  var _hasPressure = (function () {
    try {
      if (!('ontouchstart' in w)) return false;

      var _fpTest = false;
      var _fpHandler = function (e) {
        var t = e.touches[0];
        if (t && t.force > 0 && t.force < 1) _fpTest = true;
      };
      d.addEventListener('touchstart', _fpHandler, { once: true, passive: true });
      setTimeout(function () { d.removeEventListener('touchstart', _fpHandler); }, 3000);

      return true;
    } catch (e) { return false }
  })();
  var _forceSupported = false;


  function showHardChallenge() {
    stage = 1;
    if (_hasPressure) { showPressureChallenge(); return; }
    var types = ['targets', 'slider', 'dots', 'dial'];
    var pick = types[Math.floor(Math.random() * types.length)];
    if (pick === 'slider') showSliderChallenge();
    else if (pick === 'dots') showDotsChallenge();
    else if (pick === 'dial') showDialChallenge();
    else showTargetsChallenge();
  }


  function showTargetsChallenge() {
    title.textContent = 'almost there';
    sub.textContent = 'click each target before it disappears';
    shield.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>';
    shield.style.borderColor = 'rgba(245,158,11,.2)';
    shield.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>';
    shield.style.borderColor = 'rgba(245,158,11,.2)';
    shield.style.background = 'rgba(245,158,11,.06)';
    shield.style.color = '#f59e0b';
    bar.style.background = '#f59e0b';
    btn.style.display = 'none';
    status.textContent = '';
    targetsEl.style.display = 'block';
    var needed = 4, clicked2 = 0;
    var missClicks = 0, missPositions = [], lastTargetPos = { x: -1, y: -1 }, hitVelocities = [];
    var missHandler = function (e) {
      var tx = e.clientX, ty = e.clientY;

      if (e.target === targetsEl || e.target.tagName === 'svg' || e.target.tagName === 'polyline') {
        missClicks++;
        var rect = targetsEl.getBoundingClientRect();
        missPositions.push({ x: tx - rect.left, y: ty - rect.top, t: Date.now() });
      }
    };
    targetsEl.addEventListener('click', missHandler);

    var cursorTrail = []; var lastCX = 0, lastCY = 0, lastCT = 0, trailAcc = 0, trailSamples = 0;
    var trailHandler = function (e) {
      var now = Date.now(), x = e.clientX || (_beh.lastMX), y = e.clientY || (_beh.lastMY);
      if (lastCT) {
        var dt = now - lastCT, dx = x - lastCX, dy = y - lastCY;
        if (dt > 0 && dt < 500) {
          var speed = Math.sqrt(dx * dx + dy * dy) / dt;
          cursorTrail.push(speed);
          if (cursorTrail.length > 2) {
            trailAcc += Math.abs(speed - cursorTrail[cursorTrail.length - 2]);
            trailSamples++;
          }
        }
      }
      lastCX = x; lastCY = y; lastCT = now;
    };
    d.addEventListener('mousemove', trailHandler);
    d.addEventListener('touchmove', function (e) {
      if (e.touches[0]) trailHandler({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
    }, { passive: true });

    function cursorEntropy() {
      if (!trailSamples) return 0;
      return Math.min(100, Math.round((trailAcc / trailSamples) * 500));
    }

    function spawnTarget() {
      if (clicked2 >= needed) {
        d.removeEventListener('mousemove', trailHandler);
        targetsEl.removeEventListener('click', missHandler);
        var entropy = cursorEntropy();

        var missBonus = Math.min(30, missClicks * 10);

        var velVariance = 0;
        if (hitVelocities.length > 1) {
          var vMean = hitVelocities.reduce(function (a, b) { return a + b; }, 0) / hitVelocities.length;
          velVariance = hitVelocities.reduce(function (a, v) { return a + Math.abs(v - vMean); }, 0) / hitVelocities.length;
        }
        var velBonus = Math.min(20, Math.round(velVariance * 200));
        var totalEntropy = Math.min(100, entropy + missBonus + velBonus);
        status.textContent = '';
        if (totalEntropy < 5 && trailSamples > 3) {
          attempts2++;
          if (attempts2 >= 2) { setTimeout(hardFail, 800); return; }
        }
        setVerifying();
        setTimeout(setSuccess, 1200);
        return;
      }
      var t = d.createElement('div');
      t.className = 'vf_target';
      t.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
      var maxX = Math.max(0, targetsEl.offsetWidth - 40);
      var maxY = Math.max(0, targetsEl.offsetHeight - 40);
      t.style.left = Math.max(0, Math.random() * maxX) + 'px';
      t.style.top = Math.max(0, Math.random() * maxY) + 'px';
      targetsEl.appendChild(t);
      lastTargetPos = { x: parseFloat(t.style.left) + 20, y: parseFloat(t.style.top) + 20 };
      var life = setTimeout(function () {
        if (t.parentNode) t.parentNode.removeChild(t);
        attempts2++;
        if (attempts2 >= 3) { d.removeEventListener('mousemove', trailHandler); hardFail(); }
        else spawnTarget();
      }, 2200);
      function hit() {
        clearTimeout(life);

        if (cursorTrail.length > 0) hitVelocities.push(cursorTrail[cursorTrail.length - 1]);
        t.style.background = 'rgba(16,185,129,.2)';
        t.style.borderColor = '#10b981';
        t.style.color = '#10b981';
        clicked2++;
        bar.style.width = (20 + clicked2 / needed * 70) + '%';
        setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); spawnTarget(); }, 180);
      }
      t.addEventListener('click', hit);
      t.addEventListener('touchend', function (e) { e.preventDefault(); hit(); }, { passive: false });
    }

    spawnTarget();
  }

  var _reloadCount = 0;
  try { _reloadCount = parseInt(sessionStorage.getItem('_vf_rc') || '0'); } catch (e) {}

  function hardFail() {
    _reloadCount++;
    try { sessionStorage.setItem('_vf_rc', String(_reloadCount)); } catch (e) {}
    targetsEl.style.display = 'none';
    status.textContent = '';
    if (_reloadCount >= 2) {
      permanentBlock();
    } else {
      showWordChallenge();
    }
  }


  function showSliderChallenge() {
    title.textContent = 'almost there';
    sub.textContent = 'drag the slider into the green zone';
    shield.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="12" x2="20" y2="12"/><circle cx="12" cy="12" r="3"/></svg>';
    shield.style.borderColor = 'rgba(16,185,129,.2)';
    shield.style.background = 'rgba(16,185,129,.06)';
    shield.style.color = '#10b981';
    btn.style.display = 'none';

    var sliderW = 220, handleW = 28, zoneW = 50;
    var zoneStart = Math.floor(Math.random() * (sliderW - zoneW - 40)) + 20;
    var sliderEl = d.createElement('div');
    sliderEl.style.cssText = 'margin:20px auto 8px;position:relative;width:' + sliderW + 'px;height:32px;background:#111820;border-radius:16px;border:1px solid rgba(255,255,255,.07);overflow:hidden;cursor:grab;touch-action:none;user-select:none';

    var zone = d.createElement('div');
    zone.style.cssText = 'position:absolute;top:0;left:' + zoneStart + 'px;width:' + zoneW + 'px;height:100%;background:rgba(16,185,129,.15);border-left:1px solid rgba(16,185,129,.3);border-right:1px solid rgba(16,185,129,.3)';

    var track = d.createElement('div');
    track.style.cssText = 'position:absolute;top:50%;left:0;right:0;height:2px;background:rgba(255,255,255,.06);transform:translateY(-50%)';

    var handle = d.createElement('div');
    handle.style.cssText = 'position:absolute;top:50%;left:0;width:' + handleW + 'px;height:' + handleW + 'px;border-radius:50%;background:#1e2738;border:1.5px solid rgba(0,200,255,.4);transform:translate(0,-50%);transition:border-color .15s;cursor:grab';

    sliderEl.appendChild(zone); sliderEl.appendChild(track); sliderEl.appendChild(handle);
    targetsEl.style.display = 'block';
    targetsEl.innerHTML = ''; targetsEl.appendChild(sliderEl);

    var hint = d.createElement('div');
    hint.style.cssText = 'text-align:center;font-size:11px;color:#3d4f63;margin-top:4px';
    hint.textContent = 'drag to the green zone';
    targetsEl.appendChild(hint);

    var dragging = false, startX = 0, startLeft = 0, velocities = [], lastX = 0, lastT = 0;
    var maxLeft = sliderW - handleW;

    function getLeft() { return parseInt(handle.style.left) || 0; }
    function setLeft(x) { handle.style.left = Math.max(0, Math.min(maxLeft, x)) + 'px'; }

    function onStart(e) {
      dragging = true;
      var cx = e.touches ? e.touches[0].clientX : e.clientX;
      startX = cx; startLeft = getLeft(); lastX = cx; lastT = Date.now();
      handle.style.cursor = 'grabbing'; sliderEl.style.cursor = 'grabbing';
      e.preventDefault();
    }
    function onMove(e) {
      if (!dragging) return;
      var cx = e.touches ? e.touches[0].clientX : e.clientX;
      var now = Date.now(), dt = now - lastT;
      if (dt > 0) velocities.push(Math.abs(cx - lastX) / dt);
      lastX = cx; lastT = now;
      setLeft(startLeft + (cx - startX));
      e.preventDefault();
    }
    function onEnd() {
      if (!dragging) return;
      dragging = false;
      handle.style.cursor = 'grab'; sliderEl.style.cursor = 'grab';
      var left = getLeft();
      var inZone = left >= zoneStart - 4 && left + handleW <= zoneStart + zoneW + 4;

      var hasDecel = false;
      if (velocities.length > 3) {
        var lastThree = velocities.slice(-3);
        var firstThree = velocities.slice(0, 3);
        var endSpeed = lastThree.reduce(function (a, b) { return a + b; }, 0) / 3;
        var startSpeed = firstThree.reduce(function (a, b) { return a + b; }, 0) / 3;
        hasDecel = startSpeed > endSpeed * 1.5;
      }
      if (inZone) {

        handle.style.borderColor = 'rgba(16,185,129,.8)';
        setTimeout(function () { setSuccess(); }, 400);
      } else {
        handle.style.borderColor = 'rgba(239,68,68,.6)';
        setTimeout(function () {
          handle.style.borderColor = 'rgba(0,200,255,.4)';
          attempts2++;
          if (attempts2 >= 3) {
            targetsEl.style.display = 'none';
            if (_reloadCount >= 2) permanentBlock(); else showWordChallenge();
          }
        }, 500);
      }
    }
    sliderEl.addEventListener('mousedown', onStart);
    d.addEventListener('mousemove', onMove);
    d.addEventListener('mouseup', onEnd);
    sliderEl.addEventListener('touchstart', onStart, { passive: false });
    d.addEventListener('touchmove', onMove, { passive: false });
    d.addEventListener('touchend', onEnd);
  }



  function showDotsChallenge() {
    title.textContent = 'almost there';
    sub.textContent = 'click the dots in order';
    shield.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="12" cy="19" r="2"/><line x1="7" y1="5" x2="17" y2="5"/><line x1="17" y1="5" x2="14" y2="17"/></svg>';
    shield.style.borderColor = 'rgba(139,92,246,.2)';
    shield.style.background = 'rgba(139,92,246,.06)';
    shield.style.color = '#8b5cf6';
    btn.style.display = 'none';
    targetsEl.style.display = 'block';
    var PAD = 28, DOT_R = 16, HIT_R = 24;
    var areaW = 240, areaH = 160;
    var svgEl = d.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgEl.setAttribute('width', areaW); svgEl.setAttribute('height', areaH);
    svgEl.style.cssText = 'display:block;margin:0 auto;border-radius:8px;background:#0c1018;border:1px solid rgba(255,255,255,.06);cursor:pointer;touch-action:manipulation';
    targetsEl.innerHTML = '';
    targetsEl.style.padding = '10px';
    var hint = d.createElement('div');
    hint.style.cssText = 'text-align:center;font-size:10px;color:#3d4f63;margin-bottom:8px';
    hint.textContent = 'click each number in order';
    targetsEl.appendChild(hint); targetsEl.appendChild(svgEl);
    var dots = [], tries = 0;
    while (dots.length < 5 && tries < 500) {
      tries++;
      var x = PAD + Math.random() * (areaW - PAD * 2), y = PAD + Math.random() * (areaH - PAD * 2);
      var ok = dots.every(function (p) { return Math.hypot(p.x - x, p.y - y) > 50; });
      if (ok) dots.push({ x: Math.round(x), y: Math.round(y) });
    }
    var current = 0, clickTimes = [], missCount = 0;
    function renderDots() {
      svgEl.innerHTML = '';
      for (var li = 0; li < current && li + 1 < dots.length; li++) {
        var ln = d.createElementNS('http://www.w3.org/2000/svg', 'line');
        ln.setAttribute('x1', dots[li].x); ln.setAttribute('y1', dots[li].y);
        ln.setAttribute('x2', dots[li + 1].x); ln.setAttribute('y2', dots[li + 1].y);
        ln.setAttribute('stroke', 'rgba(16,185,129,.3)'); ln.setAttribute('stroke-width', '1.5'); ln.setAttribute('stroke-dasharray', '4 3');
        svgEl.appendChild(ln);
      }
      dots.forEach(function (p, i) {
        var done = i < current, active = i === current;
        var g = d.createElementNS('http://www.w3.org/2000/svg', 'g');
        var c = d.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('cx', p.x); c.setAttribute('cy', p.y); c.setAttribute('r', active ? DOT_R : DOT_R - 3);
        c.setAttribute('fill', done ? 'rgba(16,185,129,.18)' : active ? 'rgba(139,92,246,.18)' : 'rgba(255,255,255,.04)');
        c.setAttribute('stroke', done ? '#10b981' : active ? '#8b5cf6' : 'rgba(255,255,255,.15)');
        c.setAttribute('stroke-width', '1.5');
        var t = d.createElementNS('http://www.w3.org/2000/svg', 'text');
        t.setAttribute('x', p.x); t.setAttribute('y', p.y);
        t.setAttribute('text-anchor', 'middle'); t.setAttribute('dominant-baseline', 'central');
        t.setAttribute('fill', done ? '#10b981' : active ? '#8b5cf6' : '#3d4f63');
        t.setAttribute('font-size', '12'); t.setAttribute('font-weight', '700');
        t.setAttribute('font-family', 'monospace'); t.setAttribute('pointer-events', 'none');
        t.textContent = i + 1;
        g.appendChild(c); g.appendChild(t); svgEl.appendChild(g);
      });
    }
    renderDots();
    svgEl.addEventListener('click', function (e) {
      var rect = svgEl.getBoundingClientRect();
      var mx = e.clientX - rect.left, my = e.clientY - rect.top;
      var target = dots[current]; if (!target) return;
      var dist = Math.hypot(mx - target.x, my - target.y);
      if (dist < HIT_R) {
        clickTimes.push(Date.now()); current++; renderDots();
        if (current >= dots.length) {
          var intervals = [];
          for (var ii = 1; ii < clickTimes.length; ii++) intervals.push(clickTimes[ii] - clickTimes[ii - 1]);
          var mean = intervals.reduce(function (a, b) { return a + b; }, 0) / intervals.length;
          var variance = intervals.reduce(function (a, v) { return a + Math.pow(v - mean, 2); }, 0) / intervals.length;
          if (mean > 120 && variance > 800) { setTimeout(function () { setSuccess(); }, 350); }
          else {
            attempts2++;
            if (attempts2 >= 3) { targetsEl.style.display = 'none'; if (_reloadCount >= 2) permanentBlock(); else showWordChallenge(); }
            else { current = 0; clickTimes = []; missCount = 0; renderDots(); hint.textContent = 'try again'; hint.style.color = '#f59e0b'; setTimeout(function () { hint.textContent = 'click each number in order'; hint.style.color = '#3d4f63'; }, 1200); }
          }
        }
      } else {
        missClicks++; missCount++;
        if (missCount > 8) { attempts2++; if (attempts2 >= 3) { targetsEl.style.display = 'none'; if (_reloadCount >= 2) permanentBlock(); else showWordChallenge(); } else { current = 0; clickTimes = []; missCount = 0; renderDots(); } }
      }
    });
  }

  function showDialChallenge() {
    title.textContent = 'almost there';
    sub.textContent = 'rotate the dial to match the marker';
    shield.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="3" x2="12" y2="7"/><line x1="12" y1="12" x2="16" y2="8"/></svg>';
    shield.style.borderColor = 'rgba(0,200,255,.2)';
    shield.style.background = 'rgba(0,200,255,.06)';
    shield.style.color = '#00c8ff';
    btn.style.display = 'none';

    var size = 140;
    var targetAngle = Math.round(Math.random() * 300 - 150);
    var currentAngle = 0, dragging = false, startAngle = 0, angles = [], overshoots = 0;

    var wrap = d.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px;margin:16px 0';

    var hint = d.createElement('div');
    hint.style.cssText = 'font-size:11px;color:#3d4f63';
    hint.textContent = 'drag to rotate';

    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = d.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', size); svg.setAttribute('height', size);
    svg.style.cssText = 'cursor:grab;touch-action:none;user-select:none';

    var cx = size / 2, cy = size / 2, r = size / 2 - 8;


    var ring = d.createElementNS(svgNS, 'circle');
    ring.setAttribute('cx', cx); ring.setAttribute('cy', cy); ring.setAttribute('r', r);
    ring.setAttribute('fill', '#0c1018'); ring.setAttribute('stroke', 'rgba(255,255,255,.08)'); ring.setAttribute('stroke-width', '1.5');


    var tRad = (targetAngle - 90) * Math.PI / 180;
    var tLine = d.createElementNS(svgNS, 'line');
    tLine.setAttribute('x1', cx + Math.cos(tRad) * (r - 4)); tLine.setAttribute('y1', cy + Math.sin(tRad) * (r - 4));
    tLine.setAttribute('x2', cx + Math.cos(tRad) * (r - 14)); tLine.setAttribute('y2', cy + Math.sin(tRad) * (r - 14));
    tLine.setAttribute('stroke', '#10b981'); tLine.setAttribute('stroke-width', '3'); tLine.setAttribute('stroke-linecap', 'round');


    var arcPath = d.createElementNS(svgNS, 'path');
    var a1 = (targetAngle - 15 - 90) * Math.PI / 180, a2 = (targetAngle + 15 - 90) * Math.PI / 180, ar = r - 2;
    arcPath.setAttribute('d', 'M ' + (cx + Math.cos(a1) * ar) + ' ' + (cy + Math.sin(a1) * ar) + ' A ' + ar + ' ' + ar + ' 0 0 1 ' + (cx + Math.cos(a2) * ar) + ' ' + (cy + Math.sin(a2) * ar));
    arcPath.setAttribute('fill', 'none'); arcPath.setAttribute('stroke', 'rgba(16,185,129,.25)'); arcPath.setAttribute('stroke-width', '6');


    var needle = d.createElementNS(svgNS, 'line');
    needle.setAttribute('x1', cx); needle.setAttribute('y1', cy);
    needle.setAttribute('x2', cx); needle.setAttribute('y2', cy - r + 12);
    needle.setAttribute('stroke', '#00c8ff'); needle.setAttribute('stroke-width', '2'); needle.setAttribute('stroke-linecap', 'round');


    var dot = d.createElementNS(svgNS, 'circle');
    dot.setAttribute('cx', cx); dot.setAttribute('cy', cy); dot.setAttribute('r', '4');
    dot.setAttribute('fill', '#1e2738'); dot.setAttribute('stroke', 'rgba(0,200,255,.4)'); dot.setAttribute('stroke-width', '1.5');

    svg.appendChild(ring); svg.appendChild(arcPath); svg.appendChild(tLine); svg.appendChild(needle); svg.appendChild(dot);
    wrap.appendChild(svg); wrap.appendChild(hint);
    targetsEl.style.display = 'block'; targetsEl.innerHTML = ''; targetsEl.appendChild(wrap);

    function updateNeedle(a) {
      var rad = (a - 90) * Math.PI / 180;
      needle.setAttribute('x2', cx + Math.cos(rad) * (r - 12));
      needle.setAttribute('y2', cy + Math.sin(rad) * (r - 12));
    }
    updateNeedle(0);

    function getAngle(e) {
      var rect = svg.getBoundingClientRect();
      var ex = e.touches ? e.touches[0].clientX : e.clientX;
      var ey = e.touches ? e.touches[0].clientY : e.clientY;
      return Math.atan2(ey - (rect.top + cy), ex - (rect.left + cx)) * 180 / Math.PI + 90;
    }

    svg.addEventListener('mousedown', function (e) { dragging = true; startAngle = getAngle(e) - currentAngle; svg.style.cursor = 'grabbing'; e.preventDefault(); });
    svg.addEventListener('touchstart', function (e) { dragging = true; startAngle = getAngle(e) - currentAngle; e.preventDefault(); }, { passive: false });
    function onDialMove(e) {
      if (!dragging) return;
      var prev = currentAngle; currentAngle = getAngle(e) - startAngle;
      angles.push(currentAngle);

      if (angles.length > 2) {
        var diff = currentAngle - prev;
        if (Math.abs(currentAngle - targetAngle) < 20 && Math.abs(diff) < 0.5) overshoots++;
      }
      updateNeedle(currentAngle);
      if (e.touches) e.preventDefault();
    }
    d.addEventListener('mousemove', onDialMove);
    d.addEventListener('touchmove', onDialMove, { passive: false });
    function onEnd() {
      if (!dragging) return; dragging = false; svg.style.cursor = 'grab';
      var diff = Math.abs(((currentAngle - targetAngle) + 540) % 360 - 180);
      if (diff < 15) {

        needle.setAttribute('stroke', '#10b981');
        setTimeout(function () { setSuccess(); }, 400);
      } else {
        needle.setAttribute('stroke', '#ef4444');
        setTimeout(function () {
          needle.setAttribute('stroke', '#00c8ff');
          attempts2++;
          if (attempts2 >= 3) { targetsEl.style.display = 'none'; if (_reloadCount >= 2) permanentBlock(); else showWordChallenge(); }
        }, 500);
      }
    }
    d.addEventListener('mouseup', onEnd);
    d.addEventListener('touchend', onEnd);
  }

  function showPressureChallenge() {
    shield.style.borderColor = 'rgba(0,200,255,.2)';
    shield.style.background = 'rgba(0,200,255,.06)';
    shield.style.color = '#00c8ff';
    shield.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>';
    title.textContent = 'almost there';
    sub.textContent = 'press and hold the circle';
    btn.style.display = 'none';
    status.textContent = '';

    var pWrap = d.createElement('div');
    pWrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px;margin-bottom:8px;';

    var TARGET_MIN = 0.3, TARGET_MAX = 0.7, HOLD_MS = 1200;
    var holdStart = null, passed = false, forceHistory = [], forceDetected = false;

    var pressBtn = d.createElement('div');
    pressBtn.style.cssText = 'width:72px;height:72px;border-radius:50%;border:1.5px solid rgba(0,200,255,.4);background:rgba(0,200,255,.06);display:flex;align-items:center;justify-content:center;touch-action:none;user-select:none;cursor:pointer;position:relative;';
    pressBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00c8ff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>';

    var pressBar = d.createElement('div');
    pressBar.style.cssText = 'width:100%;height:4px;background:#111820;border-radius:2px;overflow:hidden;';
    var pressBarFill = d.createElement('div');
    pressBarFill.style.cssText = 'height:100%;width:0%;background:#00c8ff;border-radius:2px;transition:width .1s,background .2s;';
    pressBar.appendChild(pressBarFill);

    var targetZone = d.createElement('div');
    targetZone.style.cssText = 'width:100%;position:relative;height:4px;margin-top:-4px;pointer-events:none;';
    var zoneEl = d.createElement('div');
    zoneEl.style.cssText = 'position:absolute;left:' + Math.round(TARGET_MIN * 100) + '%;width:' + Math.round((TARGET_MAX - TARGET_MIN) * 100) + '%;height:100%;background:rgba(0,200,255,.3);border-radius:2px;';
    targetZone.appendChild(zoneEl);


    var fallbackBtn = d.createElement('button');
    fallbackBtn.textContent = 'not working? tap here';
    fallbackBtn.style.cssText = 'display:none;margin-top:4px;background:none;border:none;font-size:11px;color:rgba(0,200,255,.4);cursor:pointer;font-family:inherit;padding:4px 0;text-decoration:underline;text-underline-offset:2px;';
    fallbackBtn.addEventListener('click', function () {
      _vP.sig.to = { s: 20, c: 0.4 };
      _vupdScore();
      pWrap.remove();
      _hasPressure = false;
      showHardChallenge();
    });

    pWrap.appendChild(pressBtn);
    pWrap.appendChild(pressBar);
    pWrap.appendChild(targetZone);
    pWrap.appendChild(fallbackBtn);

    var box = d.getElementById('_vf_box');
    box.insertBefore(pWrap, d.getElementById('_vf_attr'));

    function onPressMove(e) {
      if (passed) return;
      var t = e.touches && e.touches[0];
      if (!t) return;
      var rawForce = t.force || 0;
      var radius = (t.radiusX || 0) + (t.radiusY || 0);
      if (rawForce > 0 && rawForce < 1) { forceDetected = true; _forceSupported = true; }
      var f = _forceSupported ? rawForce : Math.min(1, Math.max(0, (radius - 5) / 30));
      _vTB.push({ force: f, r: radius, t: Date.now() });
      forceHistory.push(f);
      var pct = Math.round(f * 100);
      pressBarFill.style.width = pct + '%';
      var inZone = f >= TARGET_MIN && f <= TARGET_MAX;
      pressBarFill.style.background = inZone ? '#10b981' : '#00c8ff';
      if (inZone) {
        if (!holdStart) holdStart = Date.now();
        var elapsed = Date.now() - holdStart;
        bar.style.width = Math.round(20 + Math.min(60, elapsed / HOLD_MS * 60)) + '%';
        if (elapsed >= HOLD_MS && !passed) {
          passed = true;
          var fMean = forceHistory.reduce(function (a, b) { return a + b }, 0) / forceHistory.length;
          var fVar = forceHistory.reduce(function (a, v) { return a + Math.pow(v - fMean, 2) }, 0) / forceHistory.length;
          if (fVar < 0.00001) { pWrap.remove(); setFail(); }
          else { pWrap.remove(); setVerifying(); setTimeout(setSuccess, 1200); }
        }
      } else { holdStart = null; }
    }

    pressBtn.addEventListener('touchmove', onPressMove, { passive: true });
    pressBtn.addEventListener('touchend', function () { if (!passed) holdStart = null; }, { passive: true });
    pressBtn.addEventListener('touchstart', function (e) {
      var t = e.touches[0];
      if (t) _vTB.push({ force: t.force || 0, r: (t.radiusX || 0) + (t.radiusY || 0), t: Date.now() });
    }, { passive: true });


    setTimeout(function () {
      if (!forceDetected && !passed) {
        fallbackBtn.style.display = 'block';
        status.textContent = 'device may not support pressure';
        status.style.color = 'rgba(0,200,255,.3)';
      }
    }, 3000);

    status.style.color = 'rgba(205,214,224,.4)';
  }

  function showWordChallenge() {
    var WORDS = [
      'river', 'cloud', 'seven', 'plant', 'frame', 'table', 'stone', 'light', 'brush', 'dream',
      'flint', 'grove', 'prism', 'blaze', 'crisp', 'drift', 'ghost', 'hinge', 'knack', 'lunar',
      'mirth', 'notch', 'oxide', 'plumb', 'quirk', 'raven', 'scalp', 'trove', 'umbra', 'vexed',
      'waltz', 'oxide', 'yacht', 'zonal', 'abyss', 'brisk', 'cinch', 'delve', 'ember', 'froth',
      'glint', 'helix', 'inert', 'joust', 'karma', 'lyric', 'marsh', 'nexus', 'optic', 'pixel',
      'quell', 'redux', 'scorn', 'tryst', 'ulcer', 'vivid', 'wrath', 'xenon', 'yearn', 'zilch',
      'dusk', 'fern', 'grit', 'husk', 'iris', 'jolt', 'kelp', 'loft', 'meld', 'numb',
      'opal', 'pith', 'quay', 'rift', 'silt', 'tusk', 'urge', 'void', 'whim', 'zinc'
    ];
    var word = WORDS[Math.floor(Math.random() * WORDS.length)];
    title.textContent = 'one more step';
    sub.textContent = 'type the word shown below';
    shield.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="10" x2="6" y2="10"/><line x1="10" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="14" y2="10"/><line x1="18" y1="10" x2="18" y2="10"/><line x1="6" y1="14" x2="18" y2="14"/></svg>';
    shield.style.borderColor = 'rgba(167,139,250,.2)';
    shield.style.background = 'rgba(167,139,250,.06)';
    shield.style.color = '#a78bfa';
    bar.style.background = '#a78bfa';
    btn.style.display = 'none';
    status.textContent = '';

    var wrapEl = d.createElement('div');
    wrapEl.id = '_vf_word';
    wrapEl.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px;margin-bottom:8px;';

    var cvs = d.createElement('canvas');
    cvs.width = 200; cvs.height = 60; cvs.style.cssText = 'border-radius:6px;display:block;';
    var cx = cvs.getContext('2d');
    cvs.width = 220; cvs.height = 70; cvs.style.cssText = 'border-radius:6px;display:block;';
    cx.fillStyle = '#080c12'; cx.fillRect(0, 0, 220, 70);
    var rf = function (a, b) { return a + (Math.random() * (b - a)); };

    for (var bi = 0; bi < 60; bi++) {
      cx.fillStyle = 'rgba(167,139,250,' + rf(.01, .04) + ')';
      cx.fillRect(Math.random() * 220, Math.random() * 70, rf(1, 3), rf(1, 3));
    }

    var waveAmp = rf(3, 7), waveFreq = rf(0.04, 0.09), wavePhase = Math.random() * Math.PI * 2;

    cx.save();
    cx.translate(110 + rf(-10, 10), 38 + rf(-8, 8));
    cx.rotate(rf(-.3, .3));
    cx.transform(1 + rf(-.12, .12), rf(-.1, .1), rf(-.1, .1), 1 + rf(-.1, .1), 0, 0);
    var spacing = rf(12, 16), fontSize = Math.round(rf(17, 24));
    cx.font = 'bold ' + fontSize + 'px monospace';
    cx.textAlign = 'center';
    cx.shadowColor = 'rgba(167,139,250,.6)'; cx.shadowBlur = rf(6, 12);
    for (var li = 0; li < word.length; li++) {
      cx.save();
      var lx = (-word.length / 2 + li + .5) * spacing;
      var ly = Math.sin(li * waveFreq * 30 + wavePhase) * waveAmp;
      cx.translate(lx + rf(-3, 3), ly + rf(-4, 4));
      cx.rotate(rf(-.18, .18));
      cx.transform(1 + rf(-.1, .1), rf(-.08, .08), rf(-.08, .08), 1 + rf(-.08, .08), 0, 0);

      var hue = rf(260, 300), alpha = rf(.8, .98);
      cx.fillStyle = 'hsla(' + hue + ',80%,75%,' + alpha + ')';
      cx.shadowColor = 'hsla(' + hue + ',80%,60%,.5)';
      cx.fillText(word[li], 0, 0);
      cx.restore();
    }
    cx.restore();
    cx.shadowBlur = 0;

    for (var n = 0; n < 18; n++) {
      cx.beginPath();
      var nx = Math.random() * 220, ny = Math.random() * 70;
      cx.moveTo(nx, ny);
      var r2 = Math.random();
      if (r2 < .4) { cx.lineTo(Math.random() * 220, Math.random() * 70); }
      else if (r2 < .7) { cx.arc(nx, ny, rf(3, 22), 0, Math.PI * 2); }
      else { cx.bezierCurveTo(Math.random() * 220, Math.random() * 70, Math.random() * 220, Math.random() * 70, Math.random() * 220, Math.random() * 70); }
      cx.strokeStyle = 'rgba(167,139,250,' + rf(.02, .12) + ')';
      cx.lineWidth = rf(.3, 2); cx.stroke();
    }

    for (var d2 = 0; d2 < 12; d2++) {
      cx.fillStyle = 'rgba(167,139,250,' + rf(.02, .07) + ')';
      cx.fillRect(0, Math.floor(Math.random() * 70), 220, rf(.5, 2));
    }

    for (var v2 = 0; v2 < 4; v2++) {
      cx.fillStyle = 'rgba(167,139,250,' + rf(.01, .05) + ')';
      cx.fillRect(Math.floor(Math.random() * 220), 0, rf(.5, 1.5), 70);
    }

    var inp = d.createElement('input');
    inp.type = 'text'; inp.placeholder = 'type the word'; inp.autocomplete = 'off'; inp.spellcheck = false;
    inp.style.cssText = 'width:100%;padding:9px 12px;border-radius:6px;border:1px solid rgba(167,139,250,.2);background:#111820;color:#cdd6e0;font-family:monospace;font-size:14px;text-align:center;outline:none;box-sizing:border-box;';

    var submitW = d.createElement('button');
    submitW.textContent = 'verify';
    submitW.style.cssText = 'width:100%;padding:9px;border-radius:6px;border:1px solid rgba(167,139,250,.25);background:rgba(167,139,250,.08);color:#a78bfa;font-weight:700;cursor:pointer;font-size:13px;';

    wrapEl.appendChild(cvs); wrapEl.appendChild(inp); wrapEl.appendChild(submitW);

    var box = d.getElementById('_vf_box');
    box.insertBefore(wrapEl, d.getElementById('_vf_attr'));

    function checkWord() {
      var val = inp.value.trim().toLowerCase();
      if (val === word) {
        wrapEl.remove();
        setVerifying();
        setTimeout(setSuccess, 1200);
      } else {
        inp.style.borderColor = 'rgba(239,68,68,.5)';
        inp.style.color = '#ef4444';
        status.textContent = 'incorrect — try again';
        status.style.color = '#ef4444';
        setTimeout(function () {
          inp.style.borderColor = 'rgba(0,200,255,.2)';
          inp.style.color = '#cdd6e0';
          inp.value = '';
          status.textContent = '';
          status.style.color = '';
        }, 700);
      }
    }
    submitW.addEventListener('click', checkWord);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') checkWord(); });
    inp.focus();

    var left = 3 - _reloadCount;
    status.textContent = left + ' attempt' + (left === 1 ? '' : 's') + ' remaining';
    status.style.color = 'rgba(205,214,224,.4)';
  }

  function permanentBlock() {
    title.textContent = 'access blocked';
    sub.textContent = 'close this tab and reopen to try again.';
    shield.style.borderColor = 'rgba(239,68,68,.2)';
    shield.style.background = 'rgba(239,68,68,.06)';
    shield.style.color = '#ef4444';
    shield.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>';
    bar.style.width = '100%';
    bar.style.background = '#ef4444';
    btn.style.display = 'none';
    status.style.color = '#ef4444';
    status.textContent = 'session blocked';
    try { sessionStorage.setItem('_vf_blocked', '1'); } catch (e) {}
  }

  btn.addEventListener('click', function () {
    if (stage !== 0) return;
    var elapsed = Date.now() - startTime;
    setVerifying();
    setTimeout(function () {
      if (state._forceFailFirst) { state._forceFailFirst = false; setFail(); return; }
      var humanScore = 0;
      if (mousePoints.length >= 3) humanScore += 25;
      if (moveEntropy > 0.2) humanScore += 15;
      if (elapsed > 300 && elapsed < 20000) humanScore += 20;
      if (!navigator.webdriver) humanScore += 10;
      humanScore += Math.min(30, Math.round(_behScore() * 0.3));
      if (humanScore >= 65) { setSuccess(); }
      else { setFail(); }
    }, 1600);
  }, { once: true });
}
