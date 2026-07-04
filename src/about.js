import { w, d } from './env.js';

export function _vshowAbout() {
  if (d.getElementById('_vAbout')) return;
  var o = d.createElement('div');
  o.id = '_vAbout';
  o.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",ui-monospace,monospace;pointer-events:auto';
  o.innerHTML = '<div style="background:#0c1018;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:24px;max-width:300px;width:100%;position:relative;pointer-events:auto"><button id="_vAboutClose" style="position:absolute;top:12px;right:12px;background:none;border:none;color:#3d4f63;cursor:pointer;font-size:16px;line-height:1;padding:4px 6px;pointer-events:auto">&#x2715;</button><div style="font-size:18px;font-weight:700;font-style:italic;color:#00c8ff;margin-bottom:12px">verifi</div><p style="font-size:12px;color:#4a5568;line-height:1.75;margin-bottom:12px">verifi is a <span style="color:#f59e0b">(beta)</span> human verification system. it uses several factors to continuously determine if you are a bot.</p><ul style="padding-left:0;list-style:none;display:flex;flex-direction:column;gap:6px;margin-bottom:14px"><li style="font-size:11px;color:#3d4f63">&#10003;&nbsp;&nbsp;no PII collected</li><li style="font-size:11px;color:#3d4f63">&#10003;&nbsp;&nbsp;no cookies</li><li style="font-size:11px;color:#3d4f63">&#10003;&nbsp;&nbsp;no cross-site tracking</li><li style="font-size:11px;color:#3d4f63">&#10003;&nbsp;&nbsp;everything analyzed on device &mdash; never leaves in identifiable form</li></ul><div style="padding-top:12px;border-top:1px solid rgba(255,255,255,.06)"><a href="https://verifi.zo0p.dev/privacy" target="_blank" style="color:#00c8ff;font-size:11px;text-decoration:underline;text-underline-offset:2px">full privacy policy &#8594;</a></div></div>';
  function close() { if (o.parentNode) o.parentNode.removeChild(o); }
  o.addEventListener('click', function (e) { if (e.target === o) close(); });
  d.getElementById('_vAboutClose') && d.getElementById('_vAboutClose').addEventListener('click', close);
  d.body.appendChild(o);

  var btn = o.querySelector('#_vAboutClose');
  if (btn) btn.addEventListener('click', close);
}
w._vshowAbout = _vshowAbout;

var _vScrollY = 0, _vLocked = false;
export function _vlock() {
  if (_vLocked || !d.body) return;
  _vLocked = true;
  _vScrollY = w.scrollY || 0;
  d.body.style.overflow = 'hidden';
  d.body.style.pointerEvents = 'none';
  d.body.style.userSelect = 'none';
  d.body.style.top = '-' + _vScrollY + 'px';
  d.body.style.position = 'fixed';
  d.body.style.width = '100%';
}
export function _vunlock() {
  if (!_vLocked || !d.body) return;
  _vLocked = false;
  d.body.style.overflow = '';
  d.body.style.pointerEvents = '';
  d.body.style.userSelect = '';
  d.body.style.position = '';
  d.body.style.top = '';
  d.body.style.width = '';
  w.scrollTo(0, _vScrollY);
}
