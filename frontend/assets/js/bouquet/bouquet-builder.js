

(function () {
  'use strict';

  const API_BASE = '/api';

  
  const FLOWERS = [
    { id: 'rose',        emoji: '🌹', name: 'Rose',          meaning: 'Eternal love' },
    { id: 'tulip',       emoji: '🌷', name: 'Tulip',         meaning: 'Perfect love' },
    { id: 'lily',        emoji: '🌸', name: 'Lily',          meaning: 'Purity & devotion' },
    { id: 'sunflower',   emoji: '🌻', name: 'Sunflower',     meaning: 'Adoration & warmth' },
    { id: 'orchid',      emoji: '🪷', name: 'Orchid',        meaning: 'Rare beauty' },
    { id: 'lavender',    emoji: '💜', name: 'Lavender',      meaning: 'Serenity & grace' },
    { id: 'daisy',       emoji: '🌼', name: 'Daisy',         meaning: 'Innocence & joy' },
    { id: 'peony',       emoji: '🌺', name: 'Peony',         meaning: 'Romance & prosperity' },
    { id: 'babysbreath', emoji: '🤍', name: "Baby's Breath", meaning: 'Everlasting love' },
  ];

  const RIBBONS = [
    { id: 'satin-red',    name: 'Satin Red',    color: '#c0392b' },
    { id: 'satin-gold',   name: 'Satin Gold',   color: '#c9a84c' },
    { id: 'silk-white',   name: 'Silk White',   color: '#f0ece4' },
    { id: 'velvet-black', name: 'Velvet Black', color: '#1a1a1a' },
    { id: 'champagne',    name: 'Champagne',    color: '#e8d5a8' },
    { id: 'blush-pink',   name: 'Blush Pink',   color: '#e8a4a4' },
  ];

  const WRAPPINGS = [
    { id: 'kraft',       icon: '🟫', name: 'Kraft Paper',      desc: 'Rustic & natural' },
    { id: 'white',       icon: '🤍', name: 'White Tissue',     desc: 'Soft & delicate' },
    { id: 'gold-foil',   icon: '✨', name: 'Gold Foil',        desc: 'Luxurious & radiant' },
    { id: 'burlap',      icon: '🌾', name: 'Burlap',           desc: 'Earthy & romantic' },
    { id: 'cellophane',  icon: '🔮', name: 'Clear Cellophane', desc: 'Modern & sleek' },
  ];

  
  
  let flowerCounts  = {};
  let selectedRibbon   = null;
  let selectedWrapping = null;
  let currentStep   = 1;
  const TOTAL_STEPS = 3;

  
  const tabs         = Array.from(document.querySelectorAll('.step-tab'));
  const panels       = Array.from(document.querySelectorAll('.builder-panel'));
  const flowerGrid   = document.getElementById('flower-grid');
  const ribbonGrid   = document.getElementById('ribbon-grid');
  const wrappingGrid = document.getElementById('wrapping-grid');
  const flowerCountEl = document.getElementById('flower-count');

  
  const previewCard     = document.querySelector('.bouquet-preview-card');
  const previewFlowers  = document.getElementById('preview-flowers');
  const previewRibbon   = document.getElementById('preview-ribbon');
  const previewWrapping = document.getElementById('preview-wrapping');
  const previewStatus   = document.getElementById('preview-status');

  
  const btnNext1 = document.getElementById('btn-next-1');
  const btnNext2 = document.getElementById('btn-next-2');
  const btnBack2 = document.getElementById('btn-back-2');
  const btnBack3 = document.getElementById('btn-back-3');
  const btnBuild = document.getElementById('btn-build-bouquet');

  
  function renderFlowers() {
    if (!flowerGrid) return;
    flowerGrid.innerHTML = '';

    FLOWERS.forEach(flower => {
      const card = document.createElement('div');
      card.className = 'flower-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `${flower.name} — ${flower.meaning}`);
      card.dataset.id = flower.id;

      card.innerHTML = `
        <span class="flower-card__badge" aria-hidden="true">0</span>
        <span class="flower-card__emoji" aria-hidden="true">${flower.emoji}</span>
        <p class="flower-card__name">${flower.name}</p>
        <p class="flower-card__meaning">${flower.meaning}</p>
      `;

      card.addEventListener('click',    () => toggleFlower(flower.id, card));
      card.addEventListener('keydown',  e => { if (e.key === 'Enter' || e.key === ' ') toggleFlower(flower.id, card); });

      flowerGrid.appendChild(card);
    });
  }

  function toggleFlower(id, card) {
    flowerCounts[id] = (flowerCounts[id] || 0) + 1;

    
    
    
    card.classList.add('selected');

    const badge = card.querySelector('.flower-card__badge');
    if (badge) badge.textContent = flowerCounts[id];

    updateFlowerCounter();
    updatePreview();
    refreshNext1();
  }

  
  flowerGrid && flowerGrid.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const card = e.target.closest('.flower-card');
    if (!card) return;
    const id = card.dataset.id;
    if (!flowerCounts[id]) return;

    flowerCounts[id]--;
    if (flowerCounts[id] === 0) {
      delete flowerCounts[id];
      card.classList.remove('selected');
    }

    const badge = card.querySelector('.flower-card__badge');
    if (badge) badge.textContent = flowerCounts[id] || 0;

    updateFlowerCounter();
    updatePreview();
    refreshNext1();
  });

  function getTotalFlowers() {
    return Object.values(flowerCounts).reduce((a, b) => a + b, 0);
  }

  function updateFlowerCounter() {
    if (!flowerCountEl) return;
    const total = getTotalFlowers();
    flowerCountEl.innerHTML = `<span>${total}</span> flower${total !== 1 ? 's' : ''} selected`;
  }

  
  function renderRibbons() {
    if (!ribbonGrid) return;
    ribbonGrid.innerHTML = '';

    RIBBONS.forEach(ribbon => {
      const card = document.createElement('div');
      card.className = 'ribbon-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', ribbon.name);
      card.dataset.id = ribbon.id;

      card.innerHTML = `
        <div class="ribbon-card__swatch" style="background:${ribbon.color};" aria-hidden="true"></div>
        <p class="ribbon-card__name">${ribbon.name}</p>
      `;

      card.addEventListener('click',   () => selectRibbon(ribbon.id));
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') selectRibbon(ribbon.id); });

      ribbonGrid.appendChild(card);
    });
  }

  function selectRibbon(id) {
    selectedRibbon = RIBBONS.find(r => r.id === id);

    document.querySelectorAll('.ribbon-card').forEach(c => {
      c.classList.toggle('selected', c.dataset.id === id);
    });

    updatePreview();
    refreshNext2();
  }

  
  function renderWrappings() {
    if (!wrappingGrid) return;
    wrappingGrid.innerHTML = '';

    WRAPPINGS.forEach(wrap => {
      const card = document.createElement('div');
      card.className = 'wrapping-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `${wrap.name} — ${wrap.desc}`);
      card.dataset.id = wrap.id;

      card.innerHTML = `
        <span class="wrapping-card__icon" aria-hidden="true">${wrap.icon}</span>
        <div class="wrapping-card__info">
          <p class="wrapping-card__name">${wrap.name}</p>
          <p class="wrapping-card__desc">${wrap.desc}</p>
        </div>
        <span class="wrapping-card__check" aria-hidden="true">✓</span>
      `;

      card.addEventListener('click',   () => selectWrapping(wrap.id));
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') selectWrapping(wrap.id); });

      wrappingGrid.appendChild(card);
    });
  }

  function selectWrapping(id) {
    selectedWrapping = WRAPPINGS.find(w => w.id === id);

    document.querySelectorAll('.wrapping-card').forEach(c => {
      c.classList.toggle('selected', c.dataset.id === id);
    });

    updatePreview();
    refreshBuild();
  }

  
  function updatePreview() {
    
    if (previewFlowers) {
      const total = getTotalFlowers();
      if (total === 0) {
        previewFlowers.innerHTML = '<span class="preview-empty">No flowers yet…</span>';
      } else {
        previewFlowers.innerHTML = Object.entries(flowerCounts)
          .filter(([, count]) => count > 0)
          .map(([id, count]) => {
            const f = FLOWERS.find(f => f.id === id);
            return `<span class="flower-tag">${f.emoji} ${f.name}${count > 1 ? ` ×${count}` : ''}</span>`;
          })
          .join('');
      }
    }

    
    if (previewRibbon) {
      if (selectedRibbon) {
        previewRibbon.innerHTML = `
          <span class="preview-ribbon__swatch" style="background:${selectedRibbon.color};" aria-hidden="true"></span>
          <span class="preview-ribbon__name">${selectedRibbon.name}</span>
        `;
      } else {
        previewRibbon.innerHTML = '<span class="preview-empty">No ribbon yet…</span>';
      }
    }

    
    if (previewWrapping) {
      if (selectedWrapping) {
        previewWrapping.innerHTML = `
          <span aria-hidden="true">${selectedWrapping.icon}</span>
          <span>${selectedWrapping.name}</span>
        `;
      } else {
        previewWrapping.innerHTML = '<span class="preview-empty">No wrapping yet…</span>';
      }
    }

    
    const complete = getTotalFlowers() > 0 && selectedRibbon && selectedWrapping;
    if (previewCard)   previewCard.classList.toggle('ready', complete);
    if (previewStatus) {
      previewStatus.textContent = complete
        ? 'Your bouquet is ready ✦'
        : 'Your bouquet is taking shape…';
    }
  }

  
  function goToStep(step) {
    currentStep = step;

    tabs.forEach((tab, i) => {
      tab.classList.toggle('active', i + 1 === step);
      tab.classList.toggle('done',   i + 1 < step);
    });

    panels.forEach((panel, i) => {
      panel.classList.toggle('active', i + 1 === step);
    });
  }

  
  function refreshNext1() {
    if (btnNext1) btnNext1.disabled = getTotalFlowers() === 0;
  }

  function refreshNext2() {
    if (btnNext2) btnNext2.disabled = !selectedRibbon;
  }

  function refreshBuild() {
    if (btnBuild) btnBuild.disabled = !selectedWrapping;
  }

  
  async function handleBuild() {
    if (!selectedWrapping || !selectedRibbon || getTotalFlowers() === 0) return;

    const proposalId = window.StorageService
      ? window.StorageService.getProposalId()
      : null;

    if (!proposalId) {
      window.StorageService.redirectToCreate('No proposalId on bouquet');
      return;
    }

    const bouquetData = {
      flowers:  Object.entries(flowerCounts)
                  .filter(([, count]) => count > 0)
                  .map(([id, count]) => {
                    const f = FLOWERS.find(f => f.id === id);
                    return { id, name: f.name, emoji: f.emoji, meaning: f.meaning, count };
                  }),
      ribbon:   selectedRibbon,
      wrapping: selectedWrapping,
      builtAt:  new Date().toISOString(),
    };

    if (btnBuild) {
      btnBuild.disabled = true;
      const label = btnBuild.querySelector('span');
      if (label) label.textContent = 'Saving…';
    }

    try {
      const res = await fetch(`${API_BASE}/proposals/${proposalId}/bouquet`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ bouquet: bouquetData }),
      });

      const data = await res.json();

      if (res.status === 410) {
        throw new Error(data.message || 'This proposal has expired.');
      }

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Could not save bouquet.');
      }

      if (window.BouquetStorage) window.BouquetStorage.save(bouquetData);
      window.location.href = window.StorageService
        ? window.StorageService.withPid('bouquet-preview.html')
        : 'bouquet-preview.html';

    } catch (err) {
      alert('Could not save bouquet:\n' + err.message);
      if (btnBuild) {
        btnBuild.disabled = false;
        const label = btnBuild.querySelector('span');
        if (label) label.textContent = 'Preview Bouquet';
      }
    }
  }

  
  if (btnNext1) btnNext1.addEventListener('click', () => goToStep(2));
  if (btnNext2) btnNext2.addEventListener('click', () => goToStep(3));
  if (btnBack2) btnBack2.addEventListener('click', () => goToStep(1));
  if (btnBack3) btnBack3.addEventListener('click', () => goToStep(2));
  if (btnBuild) btnBuild.addEventListener('click', handleBuild);

  
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
      
      const targetStep = i + 1;
      if (targetStep < currentStep) goToStep(targetStep);
    });
  });

  
  renderFlowers();
  renderRibbons();
  renderWrappings();
  updateFlowerCounter();
  updatePreview();
  refreshNext1();
  refreshNext2();
  refreshBuild();
  goToStep(1);

})();
