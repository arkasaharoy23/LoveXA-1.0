

const StorageService = (function () {
  'use strict';

  const KEY     = 'forever_yours';
  const PID_PARAM = 'pid';

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function save(data) {
    try {
      const merged = Object.assign({}, load(), data);
      localStorage.setItem(KEY, JSON.stringify(merged));
    } catch (e) {
      console.warn('[StorageService] save failed:', e);
    }
  }

  function get(field) {
    return load()[field] ?? null;
  }

  function clear() {
    try { localStorage.removeItem(KEY); } catch {  }
  }

  function readPidFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const pid    = params.get(PID_PARAM);
    return pid && pid.trim() ? pid.trim() : null;
  }

  function syncPidInUrl(id) {
    if (!id || !window.history || !window.history.replaceState) return;
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get(PID_PARAM) === id) return;
      url.searchParams.set(PID_PARAM, id);
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    } catch {  }
  }

  function saveProposalId(id) {
    if (!id) return;
    save({ proposalId: id });
    syncPidInUrl(id);
  }

  
  function getProposalId() {
    const fromUrl = readPidFromUrl();
    if (fromUrl) {
      save({ proposalId: fromUrl });
      return fromUrl;
    }
    return get('proposalId');
  }

  function saveExpiresAt(iso) {
    save({ expiresAt: iso });
  }

  function getExpiresAt() {
    return get('expiresAt');
  }

  function buildShareLink(id) {
    const pid  = id || getProposalId();
    const base = window.location.origin;
    return `${base}/enter-passcode.html?id=${encodeURIComponent(pid)}`;
  }

  
  function withPid(href) {
    const pid = getProposalId();
    if (!pid || !href || href.startsWith('http') || href.startsWith('#')) return href;
    try {
      const url = new URL(href, window.location.origin);
      url.searchParams.set(PID_PARAM, pid);
      return url.pathname + url.search + url.hash;
    } catch {
      return href;
    }
  }

  function redirectToCreate(reason) {
    if (reason) console.warn('[StorageService]', reason);
    window.location.replace('create-proposal.html');
  }

  return {
    load,
    save,
    get,
    clear,
    saveProposalId,
    getProposalId,
    saveExpiresAt,
    getExpiresAt,
    buildShareLink,
    withPid,
    redirectToCreate,
    PID_PARAM,
  };
})();

window.StorageService = StorageService;
