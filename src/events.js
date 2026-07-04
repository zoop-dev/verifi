export var _vEvts = {};

export function _vemit(ev, data) {
  (_vEvts[ev] || []).forEach(function (fn) { try { fn(data); } catch (e) {} });
}
