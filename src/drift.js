import { w } from './env.js';
import { state } from './state.js';
import { _vupdSc, _vSc } from './telemetry.js';
import { _vemit } from './events.js';

var _interval = null;
var _emitted = false;
var _consecutive = 0;
var _passP = 0;

export function startDriftWatch(passP) {
  if (_interval) return;
  _emitted = false;
  _consecutive = 0;
  _passP = passP || 0;

  _interval = setInterval(function () {
    if (!state._verified || _emitted) { _stop(); return; }
    _vupdSc();
    var p = _vSc.p, c = _vSc.c;
    if (p < 0.30 && c > 0.25) {
      _consecutive++;
      if (_consecutive >= 2) {
        _emitted = true;
        _vemit('drift', { probability: p, confidence: c, passedAt: _passP });
        _stop();
      }
    } else {
      _consecutive = 0;
    }
  }, 25000);

  w.addEventListener('beforeunload', _stop);
}

function _stop() {
  if (_interval) { clearInterval(_interval); _interval = null; }
  w.removeEventListener('beforeunload', _stop);
}
