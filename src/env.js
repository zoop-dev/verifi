export const w = window;
export const d = document;
export const _vIsMobile = (function () {
  try {
    return /mobile|android|iphone|ipad|ipod/i.test(navigator.userAgent)
      || (navigator.maxTouchPoints > 1 && /macintosh|windows/i.test(navigator.userAgent))
      || (w.matchMedia && w.matchMedia('(pointer: coarse)').matches);
  } catch (e) { return false; }
})();
