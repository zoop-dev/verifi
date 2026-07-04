import { _VNN } from './nn.js';
import { _vP } from './storage.js';
import { _vsave } from './storage.js';

var _SB_URL = 'https://ymfgcndmekugcwiivrof.supabase.co';
var _SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZmdjbmRtZWt1Z2N3aWl2cm9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzODMwNTksImV4cCI6MjA5Mzk1OTA1OX0.sMR3ooeVVvEuW_R1GwcrNscLr94iFrF_GK614rME-m4';
export var _vSynced = false;

export function _vfetchWeights() {
  try {
    fetch(_SB_URL + '/rest/v1/verifi_weights?order=created_at.desc&limit=100', {
      headers: { apikey: _SB_KEY, Authorization: 'Bearer ' + _SB_KEY }
    }).then(function (r) { return r.json(); }).then(function (rows) {
      if (!rows || !rows.length) return;

      var avgWo = new Float32Array(16), avgBo = 0, totalW = 0;
      rows.forEach(function (row) {
        var wo = row.wo || [];
        var isBot = row.label === 'bot' || row.label === 'bot_trained';
        var w = isBot ? 0.5 : 1.0;
        totalW += w;
        for (var i = 0; i < 16; i++) avgWo[i] += (wo[i] || 0) * w;
        avgBo += (row.bo || 0) * w;
      });
      if (totalW > 0) {
        for (var i = 0; i < 16; i++) avgWo[i] /= totalW;
        avgBo /= totalW;
      }

      for (var i = 0; i < 16; i++) _VNN.Wo[i] = _VNN.Wo[i] * 0.35 + avgWo[i] * 0.65;
      _VNN.bo = _VNN.bo * 0.35 + avgBo * 0.65;
      _vsave();
    }).catch(function () {});
  } catch (e) {}
}

export function _vpushWeights(label) {
  if (_vP.ts < 0) return;
  try {
    fetch(_SB_URL + '/rest/v1/verifi_weights', {
      method: 'POST',
      headers: { apikey: _SB_KEY, Authorization: 'Bearer ' + _SB_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ wo: Array.from(_VNN.Wo), bo: _VNN.bo, sessions: _vP.ts, label: label || 'human' })
    }).catch(function () {});
  } catch (e) {}
}
