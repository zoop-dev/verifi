var _vToastContainer = null;

function _getContainer() {
  if (_vToastContainer && document.body.contains(_vToastContainer)) return _vToastContainer;
  _vToastContainer = document.createElement('div');
  _vToastContainer.style.cssText = 'position:fixed;top:20px;left:20px;z-index:2147483646;display:flex;flex-direction:column;gap:8px;pointer-events:none;font-family:inherit';
  document.body.appendChild(_vToastContainer);
  return _vToastContainer;
}

export function _vtoast(icon, message, opts) {
  var duration = (opts && opts.duration) || 4000;

  var el = document.createElement('div');
  el.style.cssText = 'background:#0c1018;border:0.5px solid #1e2738;border-radius:14px;padding:12px 14px;display:flex;align-items:center;gap:12px;max-width:300px;pointer-events:auto;opacity:0;transform:translateX(-16px);transition:opacity .2s ease,transform .2s ease;box-shadow:0 4px 24px rgba(0,0,0,.4);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';

  var iconEl = document.createElement('div');
  iconEl.style.cssText = 'width:44px;height:44px;flex-shrink:0;border-radius:50%;background:rgba(0,200,255,.06);border:0.5px solid rgba(0,200,255,.2);display:flex;align-items:center;justify-content:center;font-size:18px;color:#00c8ff';
  iconEl.textContent = icon;

  var textEl = document.createElement('div');
  textEl.style.cssText = 'display:flex;flex-direction:column;gap:2px';

  var headerEl = document.createElement('div');
  headerEl.style.cssText = 'font-size:12px;font-weight:600;color:#cdd6e0;line-height:1.3';
  headerEl.textContent = opts && opts.header ? opts.header : '';

  var bodyEl = document.createElement('div');
  bodyEl.style.cssText = 'font-size:11px;color:#3d4f63;line-height:1.5';
  bodyEl.textContent = message;

  if (opts && opts.header) textEl.appendChild(headerEl);
  textEl.appendChild(bodyEl);

  el.appendChild(iconEl);
  el.appendChild(textEl);
  _getContainer().appendChild(el);

  requestAnimationFrame(function () {
    el.style.opacity = '1';
    el.style.transform = 'translateX(0)';
  });

  setTimeout(function () {
    el.style.opacity = '0';
    el.style.transform = 'translateX(-16px)';
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 220);
  }, duration);
}
