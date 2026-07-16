import { d } from './env.js';
import { state } from './state.js';
import { _vP } from './storage.js';
import { _vsave } from './storage.js';
import { _vSc, _vupdSc } from './telemetry.js';
import { _vCfg } from './config.js';
import { _vemit } from './events.js';
import { _POW_URL, _SITE_ID } from './site-config.js';

(function () {
  try {
    fetch(_POW_URL.replace('/pow-verify', '/ping'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site_id: _SITE_ID, p: _vSc && _vSc.p != null ? _vSc.p : null }),
    }).then(function (r) { return r.json(); }).then(function (data) {
      state._vIpPenalty = data.penalty || 0;
      state._vIpFlags = data.flags || [];
      if (state._vIpPenalty !== 0) {
        _vP.hp = Math.max(0.01, Math.min(0.99, _vP.hp + state._vIpPenalty));
        _vsave(); _vupdSc();
      }
      if (data.dc || data.bot_score > 75) { state._vIpFlags.push('fast_challenge'); }
    }).catch(function () {});
  } catch (e) {}
})();

(function () {
  var act = function () { state._vLastActivity = Date.now(); };
  d.addEventListener('mousemove', act, { passive: true, capture: true });
  d.addEventListener('keydown', act, { passive: true, capture: true });
  d.addEventListener('scroll', act, { passive: true, capture: true });
  d.addEventListener('touchstart', act, { passive: true, capture: true });
})();

export function _vfetchToken() {
  _vupdSc();
  var idle = (Date.now() - state._vLastActivity) / 1000;
  if (idle > 180) {
    if (state._vTokenRefreshInterval) { clearInterval(state._vTokenRefreshInterval); state._vTokenRefreshInterval = null; }
    return;
  }
  if (_vSc.p < (_vCfg.threshold || 0.45)) return;
  function doFetch() {
    if (!state._powResult) { setTimeout(doFetch, 500); return; }
    var payload = { site_id: _SITE_ID, pow: state._powResult, probability: _vSc.p, confidence: _vSc.c };
    fetch(_POW_URL.replace('/pow-verify', '/token'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(function (r) { return r.json(); }).then(function (data) {
      if (data.token) {
        state._vToken = data.token;
        state._vTokenExp = Date.now() + (data.expires_in || 300) * 1000;
        _vemit('token', { token: data.token, expires_in: data.expires_in, probability: _vSc.p, confidence: _vSc.c, refreshed: true });
      }
    }).catch(function () {});
  }
  doFetch();
}
