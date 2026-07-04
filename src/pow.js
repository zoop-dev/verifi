import { state } from './state.js';

export function _makePowChallenge() {
  var arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, function (b) { return b.toString(16).padStart(2, '0'); }).join('');
}

export async function _solvePow(challenge, difficulty) {
  var nonce = 0;
  var target = Math.pow(2, 32 - difficulty);
  while (true) {
    var input = challenge + ':' + nonce;
    var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
    var view = new DataView(buf);
    var first = view.getUint32(0, false);
    if (first < target) {
      state._powSolved = true;
      state._powNonce = nonce;
      state._powChallenge = challenge;
      return { challenge: challenge, nonce: nonce, difficulty: difficulty };
    }
    nonce++;
    if (nonce % 5000 === 0) await new Promise(function (r) { setTimeout(r, 0); });
  }
}

export function _getDifficulty() {
  if (state._botScore >= 80) return 18;
  if (state._botScore >= 60) return 16;
  if (state._botScore >= 40) return 14;
  return 12;
}
