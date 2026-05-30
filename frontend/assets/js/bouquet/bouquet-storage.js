

const BouquetStorage = (function () {
  'use strict';

  const KEY = 'forever_yours_bouquet';

  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('[BouquetStorage] save failed:', e);
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function clear() {
    try { localStorage.removeItem(KEY); } catch {  }
  }

  return { save, load, clear };
})();

window.BouquetStorage = BouquetStorage;
