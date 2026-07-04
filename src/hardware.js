import { w, d } from './env.js';
import { _vP } from './storage.js';
import { _vbayes } from './nn.js';
import { _vsave } from './storage.js';
import { _vupdScore, _vupdSc } from './telemetry.js';

var _vHwDone = false;

export function _vgpu() {
  try {
    var c = d.createElement('canvas'); c.width = 64; c.height = 64;
    var gl = c.getContext('webgl'); if (!gl) return { s: 30, c: 0.4 };
    var vs = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(vs, 'attribute vec2 p;void main(){gl_Position=vec4(p,0,1);}'); gl.compileShader(vs);
    var fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, 'precision highp float;uniform float t;void main(){vec2 uv=gl_FragCoord.xy/64.0;float v=0.0;for(int i=1;i<32;i++){v+=sin(uv.x*float(i)*t+float(i))*cos(uv.y*float(i)*t);}gl_FragColor=vec4(abs(sin(v)),abs(cos(v*0.7)),abs(sin(v*1.3)),1.0);}');
    gl.compileShader(fs);
    var prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog); gl.useProgram(prog);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var tl = gl.getUniformLocation(prog, 't');

    gl.uniform1f(tl, 1.23); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); gl.finish();

    var px = new Uint8Array(4); gl.readPixels(32, 32, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    var hasColor = px[0] > 0 || px[1] > 0 || px[2] > 0;

    var t0 = performance.now();
    for (var i = 0; i < 8; i++) { gl.uniform1f(tl, i * 0.37 + 0.5); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); }
    gl.finish();
    var dt = performance.now() - t0;

    var dbg = gl.getExtension('WEBGL_debug_renderer_info');
    var renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : '';
    var isSw = /SwiftShader|llvmpipe|softpipe|Mesa OffScreen|Google SwiftShader/i.test(renderer);

    if (!hasColor || dt === 0) return { s: 40, c: 0.4, reason: 'no_render' };
    if (isSw) return { s: 0, c: 0.9, sw: true, renderer: renderer };
    var score = 70 + Math.min(30, Math.max(0, 30 - (dt - 5) * 2));
    return { s: Math.round(score), c: 0.85, sw: false, dt: Math.round(dt), renderer: renderer };
  } catch (e) { return { s: 30, c: 0.3 } }
}
export function _vjitter() {
  try {
    var samples = [], n = 500;
    for (var i = 0; i < n; i++) { var t = performance.now(); var x = 0; for (var j = 0; j < 1000; j++) x += Math.sin(j); samples.push(performance.now() - t + x * 0); }
    var diffs = samples.map(function (s, i) { return i ? Math.abs(s - samples[i - 1]) : 0 }).slice(1);
    var mean = diffs.reduce(function (a, b) { return a + b }, 0) / diffs.length;
    var vr = diffs.reduce(function (a, v) { return a + Math.pow(v - mean, 2) }, 0) / diffs.length;
    var sd = Math.sqrt(vr);
    var hist = new Array(20).fill(0); diffs.forEach(function (d) { hist[Math.min(19, Math.floor(d / mean * 5))]++ });
    var spread = hist.filter(function (b) { return b > 0 }).length;
    return { s: (sd > 0.02 ? 30 : 0) + (sd > 0.08 ? 30 : 0) + (spread > 5 ? 40 : 0), c: 0.75 };
  } catch (e) { return { s: 20, c: 0.2 } }
}
export function _vaud() {
  try {
    var ac = new (w.OfflineAudioContext || w.webkitOfflineAudioContext)(1, 4096, 44100);
    var osc = ac.createOscillator(), comp = ac.createDynamicsCompressor();
    osc.type = 'triangle'; osc.frequency.value = 10000;
    comp.threshold.value = -50; comp.knee.value = 40; comp.ratio.value = 12; comp.attack.value = 0; comp.release.value = 0.25;
    osc.connect(comp); comp.connect(ac.destination); osc.start(0);
    return ac.startRendering().then(function (buf) {
      var data = buf.getChannelData(0), sum = 0;
      for (var i = data.length - 512; i < data.length; i++) sum += Math.abs(data[i]);
      var fp = Math.round(sum * 1e8) / 1e8;
      var valid = fp > 0 && fp < 100 && !isNaN(fp);
      _vP.sig.aud = { s: valid ? 60 : 10, c: 0.7 }; _vupdScore(); _vsave();
    }).catch(function () { _vP.sig.aud = { s: 20, c: 0.2 }; });
  } catch (e) { _vP.sig.aud = { s: 20, c: 0.2 }; return Promise.resolve(); }
}

export function _vfontTiming() {
  try {
    var canvas = d.createElement('canvas');
    var ctx = canvas.getContext('2d');
    if (!ctx) return { s: 30, c: 0.2 };
    var t0 = performance.now();
    var fonts = ['monospace', 'serif', 'sans-serif', 'cursive', 'fantasy'];
    var refs = fonts.map(function (f) { ctx.font = '16px ' + f; return ctx.measureText('mmmmmmmmmmlli').width; });
    var t1 = performance.now();

    var mean = refs.reduce(function (a, b) { return a + b; }, 0) / refs.length;
    var vr = refs.reduce(function (a, v) { return a + Math.pow(v - mean, 2); }, 0) / refs.length;
    var renderTime = t1 - t0;
    var hasVariance = vr > 2;
    var s = (hasVariance ? 50 : 10) + Math.min(30, renderTime * 5) + 20;
    return { s: Math.min(100, s), c: 0.65 };
  } catch (e) { return { s: 30, c: 0.2 }; }
}

export function _vhw() {
  if (_vHwDone) return; _vHwDone = true;
  var isMob = /mobile|android|iphone|ipad/i.test(navigator.userAgent);
  var gpu = _vgpu(), jtr = _vjitter();
  _vP.sig.gpu = gpu; _vP.sig.jtr = jtr;
  if (gpu.c > 0.5) _vP.hp = _vbayes(_vP.hp, gpu.s / 100, gpu.c * 0.45);
  if (jtr.c > 0.5) _vP.hp = _vbayes(_vP.hp, jtr.s / 100, jtr.c * (isMob ? 0.5 : 0.35));
  _vaud().then(function () {
    if (isMob && _vP.sig.aud && _vP.sig.aud.c > 0.5) _vP.hp = _vbayes(_vP.hp, _vP.sig.aud.s / 100, _vP.sig.aud.c * 0.6);
  });

  var ft = _vfontTiming();
  _vP.sig.font = ft;
  if (ft.c > 0.3) _vP.hp = _vbayes(_vP.hp, ft.s / 100, ft.c * 0.3);

  try {
    if (navigator.getBattery) {
      navigator.getBattery().then(function (b) {
        var s = b != null ? 70 : 10;
        _vP.sig.batt = { s: s, c: 0.6 };
        if (b != null) _vP.hp = _vbayes(_vP.hp, s / 100, 0.25);
        _vsave(); _vupdSc();
      }).catch(function () { _vP.sig.batt = { s: 40, c: 0.2 }; });
    } else { _vP.sig.batt = { s: 40, c: 0.2 }; }
  } catch (e) { _vP.sig.batt = { s: 40, c: 0.2 }; }

  try {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then(function (devs) {
        var s = devs && devs.length > 0 ? 75 : 15;
        _vP.sig.media = { s: s, c: 0.65 };
        _vP.hp = _vbayes(_vP.hp, s / 100, 0.3);
        _vsave(); _vupdSc();
      }).catch(function () { _vP.sig.media = { s: 40, c: 0.2 }; });
    } else { _vP.sig.media = { s: 15, c: 0.5 }; }
  } catch (e) { _vP.sig.media = { s: 15, c: 0.5 }; }

  if (performance.memory) {
    var m0 = performance.memory.usedJSHeapSize;
    setTimeout(function () {
      var m1 = performance.memory.usedJSHeapSize;
      var delta = Math.abs(m1 - m0);
      var s = delta > 50000 ? 70 : delta > 5000 ? 50 : 20;
      _vP.sig.mem = { s: s, c: 0.5 };
      if (s > 40) _vP.hp = _vbayes(_vP.hp, s / 100, 0.2);
      _vsave(); _vupdSc();
    }, 2000);
  }
  _vsave(); _vupdSc();
}

export function _vraf() {
  if (!w.requestAnimationFrame) return;
  var samples = [], last = 0, count = 0;
  function frame(t) {
    if (last > 0) { var d = t - last; if (d > 10 && d < 50) samples.push(d); }
    last = t; count++;
    if (count < 120) { requestAnimationFrame(frame); }
    else {
      if (samples.length < 30) return;
      var mean = samples.reduce(function (a, b) { return a + b; }, 0) / samples.length;
      var stddev = Math.sqrt(samples.reduce(function (a, v) { return a + Math.pow(v - mean, 2); }, 0) / samples.length);

      var s = stddev > 0.8 ? 90 : stddev > 0.4 ? 70 : stddev > 0.15 ? 35 : 5;
      var c = 0.8;
      _vP.sig.raf = { s: s, c: c, stddev: stddev };
      _vP.hp = _vbayes(_vP.hp, s / 100, c * 0.45);
      _vsave(); _vupdSc();
    }
  }
  requestAnimationFrame(frame);
}
