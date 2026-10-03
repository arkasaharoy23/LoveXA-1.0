

const StorageService = (function () {
  'use strict';

  const KEY     = 'forever_yours';
  const PID_PARAM = 'pid';
  const API_BASE = 'https://lovexa-1-0.onrender.com/api';

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
    if (field === 'proposalId' || field === 'creatorKey') return null;
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
      if (url.searchParams.get(PID_PARAM) === id || url.searchParams.get('id') === id) return;
      url.searchParams.set(PID_PARAM, id);
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    } catch {  }
  }

  function saveCreatorKey(key) {
    if (!key) return;
    try { sessionStorage.setItem('fy_creator_key', key); } catch { }
  }
  function getCreatorKey() {
    try { return sessionStorage.getItem('fy_creator_key'); } catch { return null; }
  }
  function clearCreatorKey() {
    try { sessionStorage.removeItem('fy_creator_key'); } catch { }
  }
  function clearCreatorDraft() {
    try {
      sessionStorage.removeItem('fy_creator_key');
      sessionStorage.removeItem('fy_creator_pid');
      sessionStorage.removeItem('fy_viewer_pid');
      sessionStorage.removeItem('fy_viewer_token');
      sessionStorage.removeItem('fy_pid');
      sessionStorage.removeItem('fy_accepted');
    } catch { }
    clear();
  }

  function saveProposalId(id) {
    if (!id) return;
    try { sessionStorage.setItem('fy_creator_pid', id); } catch { }
    syncPidInUrl(id);
  }

  
  function getProposalId() {
    const explicitId = new URLSearchParams(window.location.search).get('id');
    if (explicitId && explicitId.trim()) {
      try { sessionStorage.setItem('fy_viewer_pid', explicitId.trim()); } catch { }
      return explicitId.trim();
    }
    const fromUrl = readPidFromUrl();
    if (fromUrl) {
      try { sessionStorage.setItem('fy_viewer_pid', fromUrl); } catch { }
      return fromUrl;
    }
    try { return sessionStorage.getItem('fy_viewer_pid') || sessionStorage.getItem('fy_creator_pid'); } catch { return null; }
  }

  function getCreatorProposalId() {
    try { return sessionStorage.getItem('fy_creator_pid'); } catch { return null; }
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

  async function fetchProposal(id) {
    const viewerToken = sessionStorage.getItem('fy_viewer_token');
    const response = viewerToken
      ? await fetch(`${API_BASE}/proposals/${encodeURIComponent(id || getProposalId())}/view`, { method:'POST', headers:{'Content-Type':'application/json','X-Viewer-Token':viewerToken}, body:'{}' })
      : await fetch(`${API_BASE}/proposals/${encodeURIComponent(id || getProposalId())}/summary`, { headers:{'X-Creator-Key':getCreatorKey() || ''} });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || 'Could not load proposal.');
    return data.proposal || data.summary;
  }

  
  function withPid(href) {
    const pid = getProposalId();
    if (!pid || !href || href.startsWith('http') || href.startsWith('#')) return href;
    try {
      const url = new URL(href, window.location.origin);
      const receiverPage = url.pathname.endsWith('enter-passcode.html')
        || url.pathname.endsWith('memory-lane.html')
        || url.pathname.endsWith('love-reveal.html')
        || url.pathname.endsWith('final-acceptance.html')
        || url.pathname.endsWith('received-bouquet.html')
        || url.pathname.endsWith('success.html');
      url.searchParams.set(receiverPage ? 'id' : PID_PARAM, pid);
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
    saveCreatorKey,
    getCreatorKey,
    clearCreatorKey,
    clearCreatorDraft,
    getProposalId,
    getCreatorProposalId,
    saveExpiresAt,
    getExpiresAt,
    buildShareLink,
    fetchProposal,
    withPid,
    redirectToCreate,
    PID_PARAM,
  };
})();

window.StorageService = StorageService;
