import { w, d } from './env.js';

var _vAboutPrivacy = [
  ['<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>', 'no PII collected'],
  ['<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>', 'no cookies or persistent identifiers'],
  ['<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/><line x1="2" y1="2" x2="22" y2="22"/></svg>', 'no cross-site tracking'],
  ['<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>', 'analysis runs on your device only'],
];

export function _vshowAbout() {
  if (d.getElementById('_vAbout')) return;
  var o = d.createElement('div');
  o.id = '_vAbout';
  o.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:20px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;pointer-events:auto';

  var items = _vAboutPrivacy.map(function (row) {
    return '<li style="display:flex;align-items:center;gap:10px;font-size:11px;color:#4a6070;line-height:1.5">' +
      '<span style="flex-shrink:0;width:22px;height:22px;border-radius:50%;background:rgba(0,200,255,.06);border:0.5px solid rgba(0,200,255,.12);display:flex;align-items:center;justify-content:center;color:#2a7a9a">' + row[0] + '</span>' +
      row[1] + '</li>';
  }).join('');

  o.innerHTML =
    '<div style="background:#0c1018;border:0.5px solid #1e2738;border-radius:14px;padding:24px;max-width:300px;width:100%;position:relative;pointer-events:auto">' +
      '<button id="_vAboutClose" style="position:absolute;top:12px;right:12px;background:none;border:none;color:#2d3d4d;cursor:pointer;font-size:15px;line-height:1;padding:4px 6px;pointer-events:auto">&#x2715;</button>' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">' +
        '<div style="width:36px;height:36px;border-radius:50%;background:rgba(0,200,255,.06);border:0.5px solid rgba(0,200,255,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#00c8ff">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>' +
        '</div>' +
        '<div>' +
          '<div style="font-size:15px;font-weight:700;font-style:italic;color:#00c8ff;line-height:1">verifi</div>' +
          '<div style="font-size:10px;color:#3d4f63;margin-top:2px">human verification</div>' +
        '</div>' +
        '<span style="margin-left:auto;font-size:9px;font-weight:600;letter-spacing:.04em;color:#b45309;background:rgba(245,158,11,.08);border:0.5px solid rgba(245,158,11,.2);border-radius:4px;padding:2px 6px">BETA</span>' +
      '</div>' +
      '<p style="font-size:11.5px;color:#4a6070;line-height:1.7;margin-bottom:16px">verifi continuously checks browser signals to tell humans from bots — without watching what you do or who you are.</p>' +
      '<ul style="padding:0;list-style:none;display:flex;flex-direction:column;gap:8px;margin-bottom:16px">' + items + '</ul>' +
      '<div style="padding-top:12px;border-top:0.5px solid #1e2738;display:flex;justify-content:space-between;align-items:center">' +
        '<div style="display:flex;gap:14px">' +
          '<a href="https://verifi.zo0p.dev/privacy" target="_blank" style="color:#2a6a8a;font-size:11px;text-decoration:underline;text-underline-offset:2px">privacy policy</a>' +
          '<a href="https://verifi.zo0p.dev/changelog" target="_blank" style="color:#2a6a8a;font-size:11px;text-decoration:underline;text-underline-offset:2px">changelog</a>' +
        '</div>' +
      '</div>' +
    '</div>';

  function close() { if (o.parentNode) o.parentNode.removeChild(o); }
  o.addEventListener('click', function (e) { if (e.target === o) close(); });
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
