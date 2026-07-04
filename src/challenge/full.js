import { w, d } from '../env.js';
import { state } from '../state.js';
import { lsSet } from '../site-config.js';
import { _POW_URL, _SITE_ID } from '../site-config.js';
import { _vlock, _vunlock } from '../about.js';
import { _vSeq, _vSc } from '../telemetry.js';
import { _vlearn } from '../nn.js';
import { _vpushWeights } from '../weights-sync.js';
import { _vemit } from '../events.js';
import { _behScore, _beh } from '../behavior.js';
import { _vfetchToken } from '../network.js';
import { _botCheckEnabled } from '../bot-heuristics.js';
import challengeCss from '../styles/challenge-full.css?raw';

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
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Verifying you are human');
  var mousePoints = [], lastMouse = { x: 0, y: 0 }, moveEntropy = 0, startTime = Date.now();
  var stage = 0, attempts = 0, attempts2 = 0;

  var styleEl = d.createElement('style'); styleEl.textContent = challengeCss; d.head.appendChild(styleEl);

  overlay.innerHTML =
    '<div id="_vf_box">' +
      '<div id="_vf_shield" style="color:#00c8ff"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg></div>' +
      '<p id="_vf_title" aria-live="polite">one quick check</p>' +
      '<p id="_vf_sub" aria-live="polite">click the circle to continue</p>' +
      '<div id="_vf_prog"><div id="_vf_bar"></div></div>' +
      '<div id="_vf_targets"><svg id="_vf_trail" style="position:absolute;inset:0;width:100%;height:100%;opacity:.18;pointer-events:none" xmlns="http://www.w3.org/2000/svg"></svg></div>' +
      '<button type="button" id="_vf_btn" aria-label="Verify you are human" style="color:#00c8ff"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button>' +
      '<div id="_vf_status" aria-live="polite"></div>' +
      '<p id="_vf_attr">powered by <span onclick="_vshowAbout()" style="cursor:pointer;text-decoration:underline;text-underline-offset:2px">verifi</span></p>' +
      '<button type="button" id="_vf_kbfallback">trouble with mouse or touch? press and hold enter instead</button>' +
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

  var kbFallback = d.getElementById('_vf_kbfallback');
  if (kbFallback) kbFallback.addEventListener('click', function () { showKeyholdChallenge(); });

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

  function showKeyholdChallenge() {
    title.textContent = 'almost there';
    sub.textContent = 'press and hold enter or space for about a second and a half';
    shield.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="14" x2="18" y2="14"/></svg>';
    shield.style.borderColor = 'rgba(0,200,255,.2)';
    shield.style.background = 'rgba(0,200,255,.06)';
    shield.style.color = '#00c8ff';
    btn.style.display = 'none';
    targetsEl.style.display = 'none';
    var kbf = d.getElementById('_vf_kbfallback');
    if (kbf) kbf.remove();
    status.textContent = 'waiting for key press…';

    var TARGET_MIN = 900, TARGET_MAX = 2400;
    var holding = false, holdStart = 0;

    function onKeyDown(e) {
      if (e.repeat || (e.key !== 'Enter' && e.key !== ' ')) return;
      e.preventDefault();
      if (holding) return;
      holding = true;
      holdStart = Date.now();
      bar.style.width = '30%';
      status.textContent = 'holding… keep holding';
    }
    function onKeyUp(e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (!holding) return;
      holding = false;
      var dur = Date.now() - holdStart;
      if (dur >= TARGET_MIN && dur <= TARGET_MAX) {
        d.removeEventListener('keydown', onKeyDown);
        d.removeEventListener('keyup', onKeyUp);
        setVerifying();
        setTimeout(setSuccess, 1200);
      } else {
        attempts2++;
        if (attempts2 >= 3) {
          d.removeEventListener('keydown', onKeyDown);
          d.removeEventListener('keyup', onKeyUp);
          escalate();
          return;
        }
        bar.style.width = '15%';
        status.textContent = dur < TARGET_MIN ? 'too short — try again' : 'too long — try again';
        setTimeout(function () { status.textContent = 'waiting for key press…'; }, 1000);
      }
    }
    d.addEventListener('keydown', onKeyDown);
    d.addEventListener('keyup', onKeyUp);
  }

  function showHardChallenge() {
    stage = 1;
    var types = ['draw', 'slider', 'dots', 'dial', 'trace'];
    var pick = types[Math.floor(Math.random() * types.length)];
    if (pick === 'slider') showSliderChallenge();
    else if (pick === 'dots') showDotsChallenge();
    else if (pick === 'dial') showDialChallenge();
    else if (pick === 'trace') showTraceChallenge();
    else showDrawChallenge();
  }


  function showDrawChallenge() {
    title.textContent = 'almost there';
    var shape = Math.random() < 0.5 ? 'circle' : 'check';
    sub.textContent = shape === 'circle' ? 'draw a circle over the dotted line' : 'draw a checkmark over the dotted line';
    shield.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5L20 6"/></svg>';
    shield.style.borderColor = 'rgba(245,158,11,.2)';
    shield.style.background = 'rgba(245,158,11,.06)';
    shield.style.color = '#f59e0b';
    bar.style.background = '#f59e0b';
    btn.style.display = 'none';
    status.textContent = '';

    var W = 240, H = 140;
    targetsEl.style.display = 'block'; targetsEl.innerHTML = ''; targetsEl.style.padding = '10px';

    var cvs = d.createElement('canvas');
    cvs.width = W; cvs.height = H;
    cvs.style.cssText = 'display:block;margin:0 auto;border-radius:6px;background:#080d12;touch-action:none;cursor:crosshair';
    var ctx = cvs.getContext('2d');

    function drawGuide() {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(245,158,11,.25)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      if (shape === 'circle') {
        ctx.arc(W / 2, H / 2, 45, 0, Math.PI * 2);
      } else {
        ctx.moveTo(W / 2 - 40, H / 2 - 5);
        ctx.lineTo(W / 2 - 12, H / 2 + 25);
        ctx.lineTo(W / 2 + 40, H / 2 - 30);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
    drawGuide();
    targetsEl.appendChild(cvs);

    var hint = d.createElement('div');
    hint.style.cssText = 'text-align:center;font-size:10px;color:#3d4f63;margin-top:8px';
    hint.textContent = 'draw over the dotted line';
    targetsEl.appendChild(hint);

    var pts = [], drawing = false;

    function getXY(e) {
      var rect = cvs.getBoundingClientRect();
      var cx = e.touches ? e.touches[0].clientX : e.clientX;
      var cy = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: cx - rect.left, y: cy - rect.top };
    }
    function validateCircle(pts) {
      if (pts.length < 20) return false;
      var cx = 0, cy = 0;
      pts.forEach(function (p) { cx += p.x; cy += p.y; });
      cx /= pts.length; cy /= pts.length;
      var radii = pts.map(function (p) { return Math.hypot(p.x - cx, p.y - cy); });
      var avgR = radii.reduce(function (a, b) { return a + b; }, 0) / radii.length;
      if (avgR < 15) return false;
      var variance = radii.reduce(function (a, r) { return a + Math.pow(r - avgR, 2); }, 0) / radii.length;
      var relStd = Math.sqrt(variance) / avgR;
      var bins = new Array(16).fill(false);
      pts.forEach(function (p) {
        var ang = Math.atan2(p.y - cy, p.x - cx);
        var bi = Math.floor(((ang + Math.PI) / (Math.PI * 2)) * 16) % 16;
        bins[bi] = true;
      });
      var covered = bins.filter(Boolean).length;
      var closed = Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y) < avgR * 0.7;
      return relStd < 0.45 && covered >= 12 && closed;
    }
    function validateCheck(pts) {
      if (pts.length < 8) return false;
      var maxYIdx = 0;
      for (var i = 1; i < pts.length; i++) if (pts[i].y > pts[maxYIdx].y) maxYIdx = i;
      if (maxYIdx < 2 || maxYIdx > pts.length - 3) return false;
      var down = pts.slice(0, maxYIdx + 1);
      var up = pts.slice(maxYIdx);
      var downDx = down[down.length - 1].x - down[0].x, downDy = down[down.length - 1].y - down[0].y;
      var upDx = up[up.length - 1].x - up[0].x, upDy = up[up.length - 1].y - up[0].y;
      var downOk = downDx > 5 && downDy > 5;
      var upOk = upDx > 5 && upDy < -5;
      var upSteeper = Math.abs(upDy / (Math.abs(upDx) + 1)) > Math.abs(downDy / (Math.abs(downDx) + 1)) * 0.8;
      return downOk && upOk && upSteeper;
    }

    function onStart(e) {
      drawing = true; pts = [];
      pts.push(getXY(e));
      drawGuide();
      e.preventDefault();
    }
    function onMove(e) {
      if (!drawing) return;
      pts.push(getXY(e));
      var n = pts.length;
      if (n > 1) {
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(pts[n - 2].x, pts[n - 2].y);
        ctx.lineTo(pts[n - 1].x, pts[n - 1].y);
        ctx.stroke();
      }
      e.preventDefault();
    }
    function onEnd() {
      if (!drawing) return;
      drawing = false;
      var ok = shape === 'circle' ? validateCircle(pts) : validateCheck(pts);
      if (ok) {
        setVerifying();
        setTimeout(setSuccess, 1200);
      } else {
        attempts2++;
        if (attempts2 >= 3) { escalate(); return; }
        hint.textContent = 'try again'; hint.style.color = '#ef4444';
        setTimeout(function () { drawGuide(); hint.textContent = 'draw over the dotted line'; hint.style.color = '#3d4f63'; }, 700);
      }
    }

    cvs.addEventListener('mousedown', onStart);
    cvs.addEventListener('touchstart', onStart, { passive: false });
    d.addEventListener('mousemove', onMove);
    d.addEventListener('touchmove', onMove, { passive: false });
    d.addEventListener('mouseup', onEnd);
    d.addEventListener('touchend', onEnd);
  }

  var _reloadCount = 0;
  try { _reloadCount = parseInt(sessionStorage.getItem('_vf_rc') || '0'); } catch (e) {}

  function escalate() {
    _reloadCount++;
    try { sessionStorage.setItem('_vf_rc', String(_reloadCount)); } catch (e) {}
    targetsEl.style.display = 'none';
    if (_reloadCount >= 2) { permanentBlock(); } else { showWordChallenge(); }
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
            escalate();
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
            if (attempts2 >= 3) { escalate(); }
            else { current = 0; clickTimes = []; missCount = 0; renderDots(); hint.textContent = 'try again'; hint.style.color = '#f59e0b'; setTimeout(function () { hint.textContent = 'click each number in order'; hint.style.color = '#3d4f63'; }, 1200); }
          }
        }
      } else {
        missCount++;
        if (missCount > 8) { attempts2++; if (attempts2 >= 3) { escalate(); } else { current = 0; clickTimes = []; missCount = 0; renderDots(); } }
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
          if (attempts2 >= 3) { escalate(); }
        }, 500);
      }
    }
    d.addEventListener('mouseup', onEnd);
    d.addEventListener('touchend', onEnd);
  }

  function showTraceChallenge() {
    title.textContent = 'almost there';
    sub.textContent = 'drag the dot along the line to the end';
    shield.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12c3-6 6 6 9 0s6-6 9 0"/></svg>';
    shield.style.borderColor = 'rgba(16,185,129,.2)';
    shield.style.background = 'rgba(16,185,129,.06)';
    shield.style.color = '#10b981';
    btn.style.display = 'none';
    status.textContent = '';

    var W = 260, H = 100, PAD = 22;
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = d.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', W); svg.setAttribute('height', H);
    svg.style.cssText = 'display:block;margin:0 auto;touch-action:none;user-select:none';

    var N = 48, pts = [];
    var amp = 16 + Math.random() * 12, freq = 1.3 + Math.random() * 0.8;
    for (var i = 0; i < N; i++) {
      var t = i / (N - 1);
      pts.push({ x: PAD + t * (W - PAD * 2), y: H / 2 + Math.sin(t * Math.PI * freq) * amp });
    }
    var pathD = pts.map(function (p, i) { return (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' ');

    var lane = d.createElementNS(svgNS, 'path');
    lane.setAttribute('d', pathD);
    lane.setAttribute('fill', 'none'); lane.setAttribute('stroke', 'rgba(16,185,129,.15)'); lane.setAttribute('stroke-width', '22'); lane.setAttribute('stroke-linecap', 'round');

    var line = d.createElementNS(svgNS, 'path');
    line.setAttribute('d', pathD);
    line.setAttribute('fill', 'none'); line.setAttribute('stroke', 'rgba(16,185,129,.4)'); line.setAttribute('stroke-width', '1.5'); line.setAttribute('stroke-dasharray', '3 4');

    var endDot = d.createElementNS(svgNS, 'circle');
    endDot.setAttribute('cx', pts[N - 1].x); endDot.setAttribute('cy', pts[N - 1].y); endDot.setAttribute('r', '6');
    endDot.setAttribute('fill', 'rgba(16,185,129,.25)'); endDot.setAttribute('stroke', '#10b981');

    var puck = d.createElementNS(svgNS, 'circle');
    puck.setAttribute('cx', pts[0].x); puck.setAttribute('cy', pts[0].y); puck.setAttribute('r', '9');
    puck.setAttribute('fill', '#0c1018'); puck.setAttribute('stroke', '#10b981'); puck.setAttribute('stroke-width', '2');
    puck.style.cursor = 'grab';

    svg.appendChild(lane); svg.appendChild(line); svg.appendChild(endDot); svg.appendChild(puck);
    targetsEl.style.display = 'block'; targetsEl.innerHTML = ''; targetsEl.appendChild(svg);

    var dragging = false, progress = 0, samples = 0;
    var LANE_TOL = 17, END_TOL = 14;

    function nearestOnPath(x, y) {
      var best = Infinity, bi = 0;
      for (var i = 0; i < pts.length; i++) {
        var dx = pts[i].x - x, dy = pts[i].y - y, dist = dx * dx + dy * dy;
        if (dist < best) { best = dist; bi = i; }
      }
      return { dist: Math.sqrt(best), idx: bi };
    }
    function getXY(e) {
      var rect = svg.getBoundingClientRect();
      var cx = e.touches ? e.touches[0].clientX : e.clientX;
      var cy = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: cx - rect.left, y: cy - rect.top };
    }
    function resetPuck() {
      dragging = false; progress = 0; samples = 0;
      puck.setAttribute('cx', pts[0].x); puck.setAttribute('cy', pts[0].y);
    }
    function onStart(e) {
      var p = getXY(e);
      var n = nearestOnPath(p.x, p.y);
      if (n.dist < 20 && n.idx < 6) { dragging = true; puck.style.cursor = 'grabbing'; }
      e.preventDefault();
    }
    function onMove(e) {
      if (!dragging) return;
      var p = getXY(e);
      var n = nearestOnPath(p.x, p.y);
      samples++;
      if (n.dist > LANE_TOL) {
        resetPuck();
        attempts2++;
        if (attempts2 >= 3) { escalate(); return; }
        status.textContent = 'off the line — try again';
        status.style.color = '#f59e0b';
        setTimeout(function () { status.textContent = ''; }, 900);
        return;
      }
      progress = Math.max(progress, n.idx);
      puck.setAttribute('cx', p.x); puck.setAttribute('cy', p.y);
      bar.style.width = (20 + (progress / (pts.length - 1)) * 70) + '%';
      var endDist = Math.hypot(p.x - pts[pts.length - 1].x, p.y - pts[pts.length - 1].y);
      if (progress >= pts.length - 4 && endDist < END_TOL && samples > 15) {
        dragging = false;
        d.removeEventListener('mousemove', onMove);
        d.removeEventListener('touchmove', onMove);
        setVerifying();
        setTimeout(setSuccess, 1200);
      }
      e.preventDefault();
    }
    function onEnd() { dragging = false; puck.style.cursor = 'grab'; }

    puck.addEventListener('mousedown', onStart);
    puck.addEventListener('touchstart', onStart, { passive: false });
    d.addEventListener('mousemove', onMove);
    d.addEventListener('touchmove', onMove, { passive: false });
    d.addEventListener('mouseup', onEnd);
    d.addEventListener('touchend', onEnd);
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

    var wordFails = 0;
    function checkWord() {
      var val = inp.value.trim().toLowerCase();
      if (!val) {
        inp.focus();
        return;
      }
      if (val === word) {
        wrapEl.remove();
        setVerifying();
        setTimeout(setSuccess, 1200);
      } else {
        wordFails++;
        if (wordFails >= 3) {
          wrapEl.remove();
          permanentBlock();
          return;
        }
        inp.style.borderColor = 'rgba(239,68,68,.5)';
        inp.style.color = '#ef4444';
        status.textContent = 'incorrect — ' + (3 - wordFails) + ' attempt' + (3 - wordFails === 1 ? '' : 's') + ' left';
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

    status.textContent = '3 attempts remaining';
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
