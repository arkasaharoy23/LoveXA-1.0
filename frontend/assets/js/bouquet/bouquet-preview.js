

(function () {
  'use strict';

  
  const bouquet = window.BouquetStorage ? window.BouquetStorage.load() : null;

  if (!bouquet || !bouquet.flowers || bouquet.flowers.length === 0) {
    const back = window.StorageService
      ? window.StorageService.withPid('bouquet.html')
      : 'bouquet.html';
    window.location.href = back;
    return;
  }

  const { flowers, ribbon, wrapping } = bouquet;

  
  const flowersEl   = document.getElementById('bouquet-flowers');
  const ribbonEl    = document.getElementById('bouquet-ribbon');
  const wrappingEl  = document.getElementById('bouquet-wrapping');
  const haloEl      = document.getElementById('bouquet-halo');

  
  const titleEl     = document.getElementById('preview-title');
  const subtitleEl  = document.getElementById('preview-subtitle');
  const detailsEl   = document.getElementById('bouquet-details');
  const actionsEl   = document.getElementById('preview-actions');

  
  const flowerListEl    = document.getElementById('detail-flowers');
  const ribbonDetailEl  = document.getElementById('detail-ribbon');
  const wrappingDetailEl= document.getElementById('detail-wrapping');


  

  
  function buildFlowerIllustration() {
    if (!flowersEl) return;
    flowersEl.innerHTML = '';

    
    const expanded = [];
    flowers.forEach(f => {
      for (let i = 0; i < Math.min(f.count, 3); i++) {
        expanded.push(f); 
      }
    });

    
    const display = expanded.slice(0, 9);

    display.forEach((f) => {
      const span = document.createElement('span');
      span.className = 'bouquet-flower';
      span.textContent = f.emoji;
      span.setAttribute('aria-hidden', 'true');
      flowersEl.appendChild(span);
    });
  }

  
  function buildRibbonIllustration() {
    if (!ribbonEl) return;
    const lineStyle = `background:${ribbon.color};`;
    ribbonEl.innerHTML = `
      <span class="bouquet-ribbon__line" style="${lineStyle}" aria-hidden="true"></span>
      <span class="bouquet-ribbon__bow" aria-hidden="true">🎀</span>
      <span class="bouquet-ribbon__line" style="${lineStyle}" aria-hidden="true"></span>
    `;
  }

  
  function buildWrappingIllustration() {
    if (!wrappingEl) return;
    wrappingEl.textContent = wrapping.icon;
    wrappingEl.setAttribute('aria-label', `Wrapped in ${wrapping.name}`);
  }


  

  function buildFlowerList() {
    if (!flowerListEl) return;
    flowerListEl.innerHTML = '';

    flowers.forEach(f => {
      const item = document.createElement('div');
      item.className = 'flower-list__item';
      item.innerHTML = `
        <span class="flower-list__item-emoji" aria-hidden="true">${f.emoji}</span>
        <span>${f.name}</span>
        ${f.count > 1 ? `<span class="flower-list__item-count">×${f.count}</span>` : ''}
        <span aria-hidden="true"> — </span>
        <span class="flower-list__item-meaning">${f.meaning}</span>
      `;
      flowerListEl.appendChild(item);
    });
  }

  function buildRibbonDetail() {
    if (!ribbonDetailEl) return;
    ribbonDetailEl.innerHTML = `
      <span class="details-ribbon__swatch"
            style="background:${ribbon.color};"
            aria-hidden="true"></span>
      <span class="details-ribbon__name">${ribbon.name}</span>
    `;
  }

  function buildWrappingDetail() {
    if (!wrappingDetailEl) return;
    wrappingDetailEl.innerHTML = `
      <span aria-hidden="true">${wrapping.icon}</span>
      <span>${wrapping.name}</span>
      <span class="details-wrapping__desc">— ${wrapping.desc}</span>
    `;
  }


  
  function runReveal() {

    
    setTimeout(() => {
      if (wrappingEl) wrappingEl.classList.add('visible');
    }, 400);

    
    setTimeout(() => {
      if (ribbonEl) ribbonEl.classList.add('visible');
    }, 900);

    
    setTimeout(() => {
      const flowerEls = flowersEl
        ? Array.from(flowersEl.querySelectorAll('.bouquet-flower'))
        : [];

      flowerEls.forEach((el, i) => {
        setTimeout(() => {
          el.classList.add('visible');
        }, i * 100); 
      });
    }, 1200);

    
    setTimeout(() => {
      if (haloEl) haloEl.classList.add('visible');
    }, 1600);

    
    setTimeout(() => {
      if (titleEl) titleEl.classList.add('visible');
    }, 2000);

    
    setTimeout(() => {
      if (subtitleEl) subtitleEl.classList.add('visible');
    }, 2300);

    
    setTimeout(() => {
      if (detailsEl) detailsEl.classList.add('visible');
    }, 2700);

    
    setTimeout(() => {
      if (actionsEl) actionsEl.classList.add('visible');
    }, 3100);
  }


  
  buildFlowerIllustration();
  buildRibbonIllustration();
  buildWrappingIllustration();
  buildFlowerList();
  buildRibbonDetail();
  buildWrappingDetail();

  
  setTimeout(runReveal, 500);

})();
