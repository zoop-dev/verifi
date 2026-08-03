import { w, d } from './env.js';
import { _vP, _vsave } from './storage.js';
import { _vbayes } from './nn.js';
import { _vupdSc } from './telemetry.js';
import { _vTB } from './telemetry.js';

function _vvar(arr) {
  if (!arr.length) return 0;
  var m = arr.reduce(function (a, b) { return a + b; }, 0) / arr.length;
  return arr.reduce(function (a, v) { return a + (v - m) * (v - m); }, 0) / arr.length;
}

export function _vaccel() {
  if (!('DeviceMotionEvent' in w)) {
    _vP.sig.acc = { s: 15, c: 0.65, r: 'no_api' };
    _vP.hp = _vbayes(_vP.hp, 0.15, 0.45);
    _vsave(); _vupdSc();
    return;
  }

  var xs = [], ys = [], zs = [], count = 0;
  var done = false;

  function handler(e) {
    var a = e.accelerationIncludingGravity || e.acceleration;
    if (!a) return;
    xs.push(a.x || 0); ys.push(a.y || 0); zs.push(a.z || 0);
    count++;
  }

  w.addEventListener('devicemotion', handler, { passive: true });

  setTimeout(function () {
    if (done) return;
    done = true;
    w.removeEventListener('devicemotion', handler);

    if (count < 3) {
      _vP.sig.acc = { s: 20, c: 0.55, r: 'no_events' };
      _vP.hp = _vbayes(_vP.hp, 0.2, 0.4);
      _vsave(); _vupdSc();
      return;
    }

    var totalVar = _vvar(xs) + _vvar(ys) + _vvar(zs);
    var allZero = xs.every(function (v) { return v === 0; }) &&
                  ys.every(function (v) { return v === 0; }) &&
                  zs.every(function (v) { return v === 0; });

    var s, c;
    if (allZero) {
      s = 10; c = 0.7;
    } else if (totalVar > 0.5) {
      s = 88; c = 0.8;
    } else if (totalVar > 0.05) {
      s = 70; c = 0.7;
    } else {
      s = 40; c = 0.55;
    }

    _vP.sig.acc = { s: s, c: c, v: totalVar, n: count };
    _vP.hp = _vbayes(_vP.hp, s / 100, c * 0.5);
    _vsave(); _vupdSc();
  }, 4000);
}

export function _vptr() {
  try {
    var coarse = w.matchMedia('(pointer: coarse)').matches;
    var noHover = w.matchMedia('(hover: none)').matches;
    var maxTP = navigator.maxTouchPoints || 0;
    var ua = /mobile|android|iphone|ipad/i.test(navigator.userAgent);

    var consistent = coarse && noHover && maxTP >= 2;
    var mismatch = ua && (!coarse || !noHover);

    var s, c;
    if (mismatch) {
      s = 20; c = 0.6;
    } else if (consistent && maxTP >= 5) {
      s = 82; c = 0.65;
    } else if (consistent) {
      s = 68; c = 0.55;
    } else {
      s = 50; c = 0.3;
    }

    _vP.sig.ptr = { s: s, c: c };
    _vP.hp = _vbayes(_vP.hp, s / 100, c * 0.4);
    _vsave(); _vupdSc();
  } catch (e) {}
}

export function _vtouchdur() {
  var durations = [];

  d.addEventListener('touchstart', function (e) {
    var t0 = Date.now();
    var id = e.changedTouches[0] ? e.changedTouches[0].identifier : -1;

    function onEnd(e2) {
      for (var i = 0; i < e2.changedTouches.length; i++) {
        if (e2.changedTouches[i].identifier === id) {
          durations.push(Date.now() - t0);
          cleanup();
          score();
          break;
        }
      }
    }
    function cleanup() {
      d.removeEventListener('touchend', onEnd);
      d.removeEventListener('touchcancel', onEnd);
    }
    d.addEventListener('touchend', onEnd, { passive: true });
    d.addEventListener('touchcancel', onEnd, { passive: true });
  }, { passive: true });

  function score() {
    if (durations.length < 3) return;
    var valid = durations.filter(function (d) { return d > 0 && d < 3000; });
    if (valid.length < 3) return;

    var mean = valid.reduce(function (a, b) { return a + b; }, 0) / valid.length;
    var vr = _vvar(valid);

    var instantaneous = valid.filter(function (d) { return d < 16; }).length;
    var roboticRatio = instantaneous / valid.length;

    var inHumanRange = valid.filter(function (d) { return d >= 50 && d <= 600; }).length / valid.length;

    var s, c;
    if (roboticRatio > 0.5) {
      s = 10; c = 0.7;
    } else if (inHumanRange > 0.6 && vr > 200) {
      s = 85; c = Math.min(0.85, valid.length / 8);
    } else if (inHumanRange > 0.4) {
      s = 60; c = Math.min(0.7, valid.length / 10);
    } else {
      s = 35; c = Math.min(0.5, valid.length / 12);
    }

    _vP.sig.tdur = { s: s, c: c, n: valid.length, mean: Math.round(mean) };
    _vP.hp = _vbayes(_vP.hp, s / 100, c * 0.45);
    _vsave(); _vupdSc();
  }
}

export function _vvkb() {
  var baseH = w.innerHeight;
  var shrinks = 0;

  function onFocus(e) {
    var tag = e.target && e.target.tagName;
    if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') return;
    setTimeout(function () {
      var delta = baseH - w.innerHeight;
      if (delta > 100) {
        shrinks++;
        if (shrinks === 1) {
          _vP.sig.vkb = { s: 85, c: 0.75 };
          _vP.hp = _vbayes(_vP.hp, 0.85, 0.5);
          _vsave(); _vupdSc();
        }
      }
    }, 400);
  }

  function onBlur() {
    setTimeout(function () { baseH = w.innerHeight; }, 500);
  }

  d.addEventListener('focusin', onFocus, { passive: true });
  d.addEventListener('focusout', onBlur, { passive: true });
}
