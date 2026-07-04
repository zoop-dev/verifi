import { state } from './state.js';
import { _SITE_ID } from './site-config.js';
import { _vload, _vP } from './storage.js';
import { _vupdSc, _vanalyze } from './telemetry.js';
import { _vfetchWeights, _vpushWeights } from './weights-sync.js';
import { _vraf, _vhw } from './hardware.js';
import { _makePowChallenge, _solvePow } from './pow.js';
import { VERIFI_VERSION } from './version.js';

import './behavior.js';
import './bot-heuristics.js';
import './network.js';
import './gate.js';
import './autoinit.js';
import './public-api.js';

_vload().then(function () {
  _vupdSc();
  _vfetchWeights();
  _vraf();
  setTimeout(_vhw, 300);
  setTimeout(_vanalyze, 1500);
  setTimeout(_vanalyze, 4000);
  setInterval(_vanalyze, 6000);
  if (_vP.ts > 0 && _vP.ts % 5 === 0) setTimeout(_vpushWeights, 2000);

  setTimeout(function () {
    if (!state._powResult) {
      var ch = _makePowChallenge();
      _solvePow(ch, 14).then(function (r) { state._powResult = r; state._powDone = true; });
    }
  }, 2000);

  if (_SITE_ID) {
    fetch('https://ymfgcndmekugcwiivrof.supabase.co/rest/v1/verifi_sites?id=eq.' + encodeURIComponent(_SITE_ID) + '&select=id', {
      headers: { 'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZmdjbmRtZWt1Z2N3aWl2cm9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzODMwNTksImV4cCI6MjA5Mzk1OTA1OX0.sMR3ooeVVvEuW_R1GwcrNscLr94iFrF_GK614rME-m4', 'Content-Type': 'application/json' },
    }).then(function (r) { return r.json(); }).then(function (rows) {
      if (!rows || !rows.length) console.warn('%c[verifi] unknown site id: ' + _SITE_ID + ' — register at verifi.zo0p.dev', 'color:#f59e0b');
    }).catch(function () {});
  }
});

console.log('%c verifi %c v' + VERIFI_VERSION + ' — verifi.zo0p.dev', 'background:#00c8ff;color:#070a0e;font-weight:700;font-style:italic;padding:2px 6px;border-radius:3px', 'color:inherit');
