(function () {
  'use strict';

  const API_BASE = '/api';

  
  const params     = new URLSearchParams(window.location.search);
  const proposalId = params.get('id') || sessionStorage.getItem('fy_pid');
  const passcode   = sessionStorage.getItem('fy_pass');
  const NEXT_PAGE  = proposalId
    ? `final-acceptance.html?id=${encodeURIComponent(proposalId)}`
    : 'final-acceptance.html';

  let bouquet = window.BouquetStorage ? window.BouquetStorage.load() : null;

  
  const page            = document.querySelector('.bouquet-receive-page');
  const glow            = document.querySelector('.bouquet-receive-page__glow');
  const stage           = document.getElementById('bouquet-stage');
  const halo            = document.getElementById('bouquet-halo');
  const giftWrap        = document.getElementById('gift-box-wrap');
  const lid             = document.getElementById('box-lid');
  const bow             = document.getElementById('box-bow');
  const bodyGlow        = document.getElementById('box-body-glow');
  const flowersContainer= document.getElementById('flowers-container');
  const ribbonBand      = document.getElementById('bouquet-ribbon-band');
  const ribbonLine1     = document.getElementById('ribbon-line-1');
  const ribbonLine2     = document.getElementById('ribbon-line-2');
  const ribbonBowIcon   = document.getElementById('ribbon-bow-icon');
  const tapHint         = document.getElementById('tap-hint');

  async function loadBouquetFromAPI() {
    if (!proposalId || !passcode) return bouquet;

    try {
      const res  = await fetch(
        `${API_BASE}/proposals/${proposalId}?passcode=${encodeURIComponent(passcode)}`
      );
      const data = await res.json();

      if (res.status === 410) {
        alert(data.message || 'This link has expired.');
        window.location.href = `enter-passcode.html?id=${encodeURIComponent(proposalId)}`;
        return null;
      }

      if (res.ok && data.success && data.proposal && data.proposal.bouquet) {
        return data.proposal.bouquet;
      }
    } catch (err) {
      console.warn('[BouquetRender] API fetch failed:', err);
    }

    return bouquet;
  }

  
  function buildFlowers() {
    if (!flowersContainer || !bouquet) return [];

    const expanded = [];
    (bouquet.flowers || []).forEach(f => {
      const count = Math.min(f.count || 1, 3);
      for (let i = 0; i < count; i++) expanded.push(f);
    });

    const display = expanded.slice(0, 9);
    const total   = display.length;
    const flowerEls = [];

    display.forEach((f, i) => {
      const span = document.createElement('span');
      span.className = 'rising-flower';
      span.textContent = f.emoji;
      span.setAttribute('aria-hidden', 'true');

      const angle  = total <= 1 ? 0 : ((i / (total - 1)) - 0.5) * 60;
      const riseY  = -90 - Math.cos((i / Math.max(total - 1, 1)) * Math.PI) * 30;

      span.style.setProperty('--rot-start', `${angle * 0.3}deg`);
      span.style.setProperty('--rot-end',   `${angle}deg`);
      span.style.setProperty('--rise-y',    `${riseY}px`);

      flowersContainer.appendChild(span);
      flowerEls.push(span);
    });

    return flowerEls;
  }

  function setRibbon() {
    if (!bouquet || !bouquet.ribbon) return;
    const color = bouquet.ribbon.color || '#c9a84c';
    if (ribbonLine1) ribbonLine1.style.background = color;
    if (ribbonLine2) ribbonLine2.style.background = color;
    if (ribbonBowIcon) ribbonBowIcon.textContent   = '🎀';
    if (ribbonBand) ribbonBand.style.color = color;
  }

  function runSequence() {
    const flowerEls = buildFlowers();
    setRibbon();

    setTimeout(() => {
      if (giftWrap) giftWrap.classList.add('visible');
    }, 0);

    setTimeout(() => {
      if (lid) lid.classList.add('open');
      if (bow) bow.classList.add('open');
      if (bodyGlow) bodyGlow.classList.add('lit');
    }, 1200);

    setTimeout(() => {
      flowerEls.forEach((el, i) => {
        setTimeout(() => {
          el.style.animation = 'flowerRise 0.75s cubic-bezier(0.16, 1, 0.3, 1) forwards';
          el.style.animationDelay = '0ms';
        }, i * 130);
      });
    }, 2000);

    const flowersDuration = 2000 + (flowerEls.length * 130) + 750;
    setTimeout(() => {
      if (ribbonBand) ribbonBand.classList.add('visible');
    }, flowersDuration);

    setTimeout(() => {
      if (flowersContainer) flowersContainer.classList.add('floating');
    }, flowersDuration + 400);

    setTimeout(() => {
      if (glow) glow.classList.add('lit');
      if (halo) halo.classList.add('visible');
    }, flowersDuration + 200);

    setTimeout(() => {
      if (tapHint) tapHint.classList.add('visible');
    }, flowersDuration + 800);
  }

  function runFallback() {
    const defaultFlowers = ['🌹','🌷','🌸','💐','🌺'];
    if (flowersContainer) {
      defaultFlowers.forEach((emoji, i) => {
        const span = document.createElement('span');
        span.className = 'rising-flower';
        span.textContent = emoji;
        const angle = ((i / (defaultFlowers.length - 1)) - 0.5) * 50;
        span.style.setProperty('--rot-start', `${angle * 0.3}deg`);
        span.style.setProperty('--rot-end',   `${angle}deg`);
        span.style.setProperty('--rise-y',    '-85px');
        flowersContainer.appendChild(span);
      });
    }

    if (ribbonLine1)  ribbonLine1.style.background  = '#c9a84c';
    if (ribbonLine2)  ribbonLine2.style.background  = '#c9a84c';
    if (ribbonBowIcon) ribbonBowIcon.textContent     = '🎀';

    runSequence();
  }

  let tapped = false;

  function handleTap() {
    if (tapped) return;
    tapped = true;

    if (stage) stage.classList.add('tapped');
    if (page)  {
      setTimeout(() => page.classList.add('fading-out'), 300);
    }
    setTimeout(() => {
      window.location.href = NEXT_PAGE;
    }, 1400);
  }

  if (stage) {
    stage.addEventListener('click',      handleTap);
    stage.addEventListener('touchstart', handleTap, { passive: true });
  }

  async function init() {
    bouquet = await loadBouquetFromAPI();
    if (bouquet === null) return;

    setTimeout(() => {
      if (bouquet && bouquet.flowers && bouquet.flowers.length > 0) {
        runSequence();
      } else {
        runFallback();
      }
    }, 500);
  }

  init();

})();
