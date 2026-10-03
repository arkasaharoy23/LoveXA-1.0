(function () {
  'use strict';
  const api = 'https://lovexa-1-0.onrender.com/api/proposals';
  const flowers = [
    { id: 'rose', name: 'Rose', icon: '🌹', note: 'A timeless expression of love' },
    { id: 'peony', name: 'Peony', icon: '🌺', note: 'Warmth and joyful beginnings' },
    { id: 'tulip', name: 'Tulip', icon: '🌷', note: 'A tender kind of affection' },
    { id: 'daisy', name: 'Daisy', icon: '🌼', note: 'Bright, easy happiness' },
    { id: 'lily', name: 'Lily', icon: '🪷', note: 'Grace and devotion' },
    { id: 'orchid', name: 'Orchid', icon: '🪻', note: 'Something rare and beautiful' },
    { id: 'camellia', name: 'Camellia', icon: '🌸', note: 'Care that stays' },
    { id: 'lotus', name: 'Lotus', icon: '🪷', note: 'A thoughtful new chapter' },
  ];
  const greenery = [
    { id: 'leafy', name: 'Soft leafy', icon: '🌿', note: 'Full and romantic' },
    { id: 'fern', name: 'Fern', icon: '🌱', note: 'Wild garden feeling' },
    { id: 'eucalyptus', name: 'Eucalyptus', icon: '🍃', note: 'Quiet and graceful' },
    { id: 'willow', name: 'Willow', icon: '☘️', note: 'Light, trailing detail' },
  ];
  const cards = [
    { id: 'classic', name: 'Soft cream', icon: '🤍', note: 'Quiet and timeless' },
    { id: 'vintage', name: 'Keepsake', icon: '📜', note: 'A little old-world charm' },
    { id: 'midnight', name: 'Midnight', icon: '🌙', note: 'Deep, dark romance' },
    { id: 'rose', name: 'Rose blush', icon: '🌹', note: 'Warm and tender' },
  ];
  const themes = [
    { id: 'dark', name: 'Midnight garden', icon: '🌌', note: 'Dark luxury · romantic' },
    { id: 'blush', name: 'Soft blush', icon: '🌸', note: 'Gentle rose tones' },
    { id: 'gold', name: 'Golden hour', icon: '✨', note: 'Warm and luminous' },
    { id: 'lavender', name: 'Lavender dusk', icon: '💜', note: 'Dreamy violet tones' },
  ];
  const steps = [
    { label: 'STEP 01 · FLOWERS', title: 'Pick your flowers', hint: 'Choose at least three blooms for your arrangement.', cta: 'Choose greenery' },
    { label: 'STEP 02 · GREENERY', title: 'Add a little greenery', hint: 'Choose the finishing foliage for your bouquet.', cta: 'Choose a card' },
    { label: 'STEP 03 · CARD', title: 'Choose your card', hint: 'Pick the look that feels right for your note.', cta: 'Set the mood' },
    { label: 'STEP 04 · THEME', title: 'Set the mood', hint: 'Give your bouquet its own little atmosphere.', cta: 'Preview bouquet' },
    { label: 'STEP 05 · PREVIEW', title: 'A bouquet made by you', hint: 'Your earlier proposal message will appear on this card.', cta: 'Save bouquet & continue' },
  ];
  const state = { step: 1, selected: new Set(['rose', 'tulip', 'peony']), foliage: 'leafy', card: 'classic', theme: 'dark', proposal: null };
  const byId = id => document.getElementById(id);
  const grid = byId('flower-grid'), options = byId('option-grid'), preview = byId('preview-layout');
  const params = new URLSearchParams(location.search);
  const proposalId = params.get('pid') || window.StorageService.getProposalId();
  if (!proposalId || !window.StorageService.getCreatorKey()) { location.replace('create-proposal.html'); return; }
  window.StorageService.saveProposalId(proposalId);

  async function fetchProposal() {
    const res = await fetch(`${api}/${encodeURIComponent(proposalId)}/summary`, { headers: { 'X-Creator-Key': window.StorageService.getCreatorKey() } });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Could not load this proposal.');
    state.proposal = data.summary;
    if (data.summary.bouquet) {
      const b = data.summary.bouquet;
      state.selected = new Set((b.flowers || []).map(f => f.id).filter(id => flowers.some(f => f.id === id)));
      if (b.greenery) state.foliage = b.greenery.id;
      if (b.card) state.card = b.card.id;
      if (b.theme) state.theme = b.theme.id;
    } else {
      state.proposal.couplePhoto = data.summary.couplePhoto;
      state.proposal.memoryPhotos = data.summary.memoryPhotos || [];
    }
  }

  function renderFlowers() {
    grid.hidden = state.step !== 1;
    grid.innerHTML = '';
    flowers.forEach(item => {
      const card = document.createElement('button');
      card.type = 'button'; card.className = `flower-card${state.selected.has(item.id) ? ' selected' : ''}`;
      card.setAttribute('aria-pressed', state.selected.has(item.id));
      card.innerHTML = `<span class="check" aria-hidden="true">✓</span><div class="flower-visual" aria-hidden="true">${item.icon}</div><h3>${item.name}</h3><p>${item.note}</p>`;
      card.addEventListener('click', () => {
        if (state.selected.has(item.id)) state.selected.delete(item.id); else state.selected.add(item.id);
        render();
      });
      grid.append(card);
    });
  }

  function renderOptions() {
    const collection = state.step === 2 ? greenery : state.step === 3 ? cards : themes;
    options.hidden = state.step < 2 || state.step > 4;
    options.innerHTML = '';
    collection.forEach(item => {
      const prop = state.step === 2 ? 'foliage' : state.step === 3 ? 'card' : 'theme';
      const card = document.createElement('button');
      card.type = 'button'; card.className = `option-card${state[prop] === item.id ? ' selected' : ''}`;
      card.setAttribute('aria-pressed', state[prop] === item.id);
      card.innerHTML = `<span class="visual" aria-hidden="true">${item.icon}</span><strong>${item.name}</strong><small>${item.note}</small>`;
      card.addEventListener('click', () => { state[prop] = item.id; render(); });
      options.append(card);
    });
  }

  function renderPreview() {
    preview.hidden = state.step !== 5;
    if (state.step !== 5) return;
    const choices = flowers.filter(f => state.selected.has(f.id));
    byId('art-flowers').replaceChildren(...choices.map((f, i) => {
      const span = document.createElement('span'); span.className = 'art-flower'; span.textContent = f.icon;
      span.style.setProperty('--r', `${(i - choices.length / 2) * 9}deg`); span.style.setProperty('--y', `${Math.abs(i - choices.length / 2) * 12}px`); return span;
    }));
    byId('art-greenery').textContent = ({ leafy: '❧', fern: '♧', eucalyptus: '❦', willow: '☘' })[state.foliage] || '❧';
    const flowerData = flowers.filter(f => state.selected.has(f.id));
    byId('card-blooms').textContent = flowerData.map(f => f.icon).join(' ');
    byId('card-to').textContent = `For ${state.proposal?.recipientName || 'someone wonderful'}`;
    byId('card-from').textContent = `With love, ${state.proposal?.senderName || 'always'}`;
    byId('card-message').textContent = state.proposal?.message || 'A little reminder of how much you mean to me.';
    const portrait = byId('bouquet-main-photo');
    if (portrait && state.proposal?.couplePhoto) { portrait.src = state.proposal.couplePhoto; portrait.hidden = false; }
    byId('card-preview').className = `card-preview ${state.card}`;
    byId('bouquet-art').style.background = ({ dark: '', blush: 'radial-gradient(ellipse,#86535c,#3a282e 70%)', gold: 'radial-gradient(ellipse,#8c7046,#342920 70%)', lavender: 'radial-gradient(ellipse,#594568,#29232f 70%)' })[state.theme];
    byId('selection-count').textContent = `${state.selected.size} blooms`;
  }

  function render() {
    const config = steps[state.step - 1];
    byId('step-label').textContent = config.label; byId('step-title').textContent = config.title; byId('step-hint').textContent = config.hint;
    byId('next-button').innerHTML = `${config.cta} <span>→</span>`;
    byId('next-button').disabled = state.step === 1 && state.selected.size < 3;
    byId('back-button').hidden = state.step === 1;
    byId('prev-link').hidden = state.step !== 1;
    byId('fine-print').textContent = state.step === 5 ? 'Your message is taken from the proposal you already wrote.' : 'You can change your choices at any time.';
    document.querySelectorAll('.step').forEach(el => { const n = Number(el.dataset.step); el.classList.toggle('active', n === state.step); el.classList.toggle('done', n < state.step); });
    byId('selection-count').textContent = `${state.selected.size} selected`;
    renderFlowers(); renderOptions(); renderPreview();
  }

  function bouquetPayload() {
    const flowerList = flowers.filter(f => state.selected.has(f.id)).map(f => ({ id:f.id, name:f.name, emoji:f.icon, meaning:f.note, count:1 }));
    const find = (list, id) => { const item = list.find(x => x.id === id); return { id:item.id, name:item.name, emoji:item.icon }; };
    const bouquet = { flowers: flowerList, greenery: find(greenery, state.foliage), card: find(cards, state.card), theme: find(themes, state.theme), message: state.proposal.message, builtAt: new Date().toISOString() };
    bouquet.ribbon = { id: state.theme, name: bouquet.theme.name, color: state.theme === 'blush' ? '#c9828b' : state.theme === 'gold' ? '#d8b77c' : state.theme === 'lavender' ? '#9b84b3' : '#6c8f70' };
    bouquet.wrapping = { id: state.card, name: bouquet.card.name };
    return bouquet;
  }

  async function next() {
    byId('builder-error').textContent = '';
    if (state.step < 5) { state.step++; render(); return; }
    const button = byId('next-button'); button.disabled = true; button.innerHTML = 'Saving bouquet…';
    try {
      const response = await fetch(`${api}/${encodeURIComponent(proposalId)}/bouquet`, { method:'PATCH', headers:{ 'Content-Type':'application/json', 'X-Creator-Key':window.StorageService.getCreatorKey() }, body:JSON.stringify({ bouquet:bouquetPayload() }) });
      const data = await response.json(); if (!response.ok || !data.success) throw new Error(data.message || 'Could not save your bouquet.');
      if (window.BouquetStorage) window.BouquetStorage.save(bouquetPayload());
      location.href = window.StorageService.withPid('enter-passcode.html');
    } catch (error) { byId('builder-error').textContent = error.message; button.disabled = false; button.innerHTML = `${steps[4].cta} <span>→</span>`; }
  }

  byId('next-button').addEventListener('click', next);
  byId('back-button').addEventListener('click', () => { if (state.step > 1) { state.step--; render(); } });
  document.querySelectorAll('.step').forEach(el => el.addEventListener('click', () => { const n = Number(el.dataset.step); if (n <= state.step) { state.step = n; render(); } }));
  fetchProposal().then(render).catch(err => { byId('builder-error').textContent = err.message; render(); });
})();
