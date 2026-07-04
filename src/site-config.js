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
