

(function () {
  'use strict';

  
  const params     = new URLSearchParams(window.location.search);
  const proposalId = params.get('id') || sessionStorage.getItem('fy_pid');
  const NEXT_PAGE  = proposalId
    ? `received-bouquet.html?id=${encodeURIComponent(proposalId)}`
    : 'received-bouquet.html';

  
  const canvas     = document.getElementById('heartsCanvas');
  const loveText   = document.getElementById('love-text');
  const langLabel  = document.getElementById('language-label');
  const bgEl       = document.querySelector('.reveal-page__bg');
  const revealPage = document.querySelector('.reveal-page');
  const tapOverlay = document.getElementById('tap-to-start');
  const audio      = document.getElementById('bg-music');

  
  const LANGS = window.LOVE_LANGUAGES;
  if (!LANGS || LANGS.length === 0) {
    console.error('[LoveReveal] language-data.js not loaded');
    return;
  }

  
  const GROW_DURATION  = 18000;  
  const MIN_FONT       = 1;      
  const MAX_FONT       = 11;     
  const LANG_INTERVAL  = 900;    
  const LANG_OUT_MS    = 150;    
  const TOTAL_DURATION = 21000;  

  
  let startTime  = null;
  let langIndex  = 0;
  let langTimer  = null;
  let growRaf    = null;
  let started    = false;

  
  if (canvas && window.HeartsAnimation) {
    window.HeartsAnimation.init(canvas);
  }


  
  function fadeAudioIn() {
    if (!audio) return;
    audio.volume = 0;
    const step = () => {
      audio.volume = Math.min(audio.volume + 0.015, 0.75);
      if (audio.volume < 0.75) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function fadeAudioOut(cb) {
    if (!audio || audio.paused) { if (cb) cb(); return; }
    const step = () => {
      audio.volume = Math.max(audio.volume - 0.02, 0);
      if (audio.volume > 0) requestAnimationFrame(step);
      else { audio.pause(); if (cb) cb(); }
    };
    requestAnimationFrame(step);
  }

  function playMusic() {
    if (!audio) return Promise.resolve();
    audio.loop   = true;
    audio.volume = 0;
    return audio.play();
  }


  
  function showTapOverlay() {
    if (tapOverlay) tapOverlay.classList.remove('hidden');
  }

  function hideTapOverlay() {
    if (tapOverlay) tapOverlay.classList.add('hidden');
  }

  function handleTap() {
    if (started) return;
    hideTapOverlay();
    playMusic().then(fadeAudioIn).catch(() => {});
    beginSequence();
  }

  if (tapOverlay) {
    tapOverlay.addEventListener('click',      handleTap);
    tapOverlay.addEventListener('touchstart', handleTap, { passive: true });
  }


  
  function setLanguage(index) {
    if (!loveText || !langLabel) return;
    const entry = LANGS[index % LANGS.length];

    
    loveText.classList.remove('lang-in');
    loveText.classList.add('lang-out');

    
    setTimeout(() => {
      loveText.textContent = entry.text;
      langLabel.textContent = entry.lang;

      
      loveText.classList.remove('lang-out');
      loveText.classList.add('lang-in');

      
      setTimeout(() => {
        loveText.classList.remove('lang-in');
      }, 300);

    }, LANG_OUT_MS);
  }

  function startLanguageCycling() {
    
    if (loveText) loveText.textContent = LANGS[0].text;
    if (langLabel) {
      langLabel.textContent = LANGS[0].lang;
      langLabel.classList.add('visible');
    }

    langTimer = setInterval(() => {
      langIndex = (langIndex + 1) % LANGS.length;
      setLanguage(langIndex);
    }, LANG_INTERVAL);
  }


  
  function easeInOutQuart(t) {
    return t < 0.5
      ? 8 * t * t * t * t
      : 1 - Math.pow(-2 * t + 2, 4) / 2;
  }

  function growLoop(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed  = Math.min(timestamp - startTime, GROW_DURATION);
    const progress = elapsed / GROW_DURATION;
    const eased    = easeInOutQuart(progress);

    
    const fontSize = MIN_FONT + (MAX_FONT - MIN_FONT) * eased;
    if (loveText) loveText.style.fontSize = `${fontSize}rem`;

    
    if (window.HeartsAnimation) {
      window.HeartsAnimation.setIntensity(eased);
    }

    
    if (bgEl && progress > 0.08) bgEl.classList.add('lit');

    
    if (loveText && progress >= 0.8) {
      loveText.classList.add('glowing');
    }

    if (progress < 1) {
      growRaf = requestAnimationFrame(growLoop);
    }
  }


  
  function beginSequence() {
    if (started) return;
    started = true;

    
    if (window.HeartsAnimation) window.HeartsAnimation.start();

    
    setTimeout(() => {
      if (loveText) {
        loveText.classList.add('visible');
      }
      startLanguageCycling();
      growRaf = requestAnimationFrame(growLoop);
    }, 800);

    
    setTimeout(() => {
      clearInterval(langTimer);
      cancelAnimationFrame(growRaf);
      fadeAudioOut();
      if (revealPage) revealPage.classList.add('fading-out');
      setTimeout(() => {
        window.location.href = NEXT_PAGE;
      }, 1800);
    }, TOTAL_DURATION - 2500);
  }


  
  function init() {
    playMusic()
      .then(() => {
        fadeAudioIn();
        hideTapOverlay();
        beginSequence();
      })
      .catch(() => {
        
        showTapOverlay();
      });
  }

  
  setTimeout(init, 700);

})();
