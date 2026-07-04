import { d } from './env.js';

export let _POW_URL = 'https://verifi.zo0p.dev/pow-verify';
export let _SITE_ID = '';

(function () {
  try {
    var s = d.currentScript || d.querySelector('script[src*="v.js"]');
    if (s) {
      _SITE_ID = s.getAttribute('data-site') || '';
      var pu = s.getAttribute('data-pow-url');
      if (pu) _POW_URL = pu;
    }
  } catch (e) {}
})();

export function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
export function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

(function migrateLegacyStorage() {
  try {
    if (localStorage.getItem('_vf_v') === null) {
      var legacyV = localStorage.getItem('_st4ts_v');
      if (legacyV !== null) { localStorage.setItem('_vf_v', legacyV); localStorage.removeItem('_st4ts_v'); }
    }
  } catch (e) {}
  try {
    if (sessionStorage.getItem('_vf_blocked') === null) {
      var legacyBlocked = sessionStorage.getItem('_st4ts_blocked');
      if (legacyBlocked !== null) { sessionStorage.setItem('_vf_blocked', legacyBlocked); sessionStorage.removeItem('_st4ts_blocked'); }
    }
  } catch (e) {}
  try {
    if (sessionStorage.getItem('_vf_rc') === null) {
      var legacyRc = sessionStorage.getItem('_st4ts_rc');
      if (legacyRc !== null) { sessionStorage.setItem('_vf_rc', legacyRc); sessionStorage.removeItem('_st4ts_rc'); }
    }
  } catch (e) {}
})();
