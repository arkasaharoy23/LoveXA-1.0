

(function () {
  'use strict';

  const API_BASE = '/api';

  
  const params     = new URLSearchParams(window.location.search);
  const proposalId = params.get('id') || sessionStorage.getItem('fy_pid');
  const passcode   = sessionStorage.getItem('fy_pass');

  if (!proposalId || !passcode) {
    const idParam = proposalId ? `?id=${encodeURIComponent(proposalId)}` : '';
    window.location.href = `enter-passcode.html${idParam}`;
    return;
  }

  
  const polaroidWrap  = document.getElementById('polaroid-wrap');
  const polaroidImg   = document.getElementById('polaroid-img');
  const finalCard     = document.getElementById('final-card');
  const fallbackCard  = document.getElementById('fallback-card');
  const navRow        = document.getElementById('nav-row');
  const dotTrack      = document.getElementById('dot-track');
  const btnPrev       = document.getElementById('btn-prev');
  const btnNext       = document.getElementById('btn-next');
  const counter       = document.getElementById('slide-counter');
  const counterCur    = document.getElementById('counter-current');
  const counterTot    = document.getElementById('counter-total');
  const introSweep    = document.getElementById('intro-sweep');
  const introFrom     = document.getElementById('intro-from');
  const introSender   = document.getElementById('intro-sender');
  const swipeHint     = document.getElementById('swipe-hint');
  const btnToReveal   = document.getElementById('btn-to-reveal');
  const btnFallback   = document.getElementById('btn-fallback-reveal');

  
  let photos      = [];
  let current     = 0;
  let isAnimating = false;
  let isFinal     = false;

  const NEXT_PAGE = `love-reveal.html?id=${encodeURIComponent(proposalId)}`;

  
  if (btnToReveal)  btnToReveal.href  = NEXT_PAGE;
  if (btnFallback)  btnFallback.href  = NEXT_PAGE;

  
  async function fetchProposal() {
    try {
      const res  = await fetch(
        `${API_BASE}/proposals/${proposalId}?passcode=${encodeURIComponent(passcode)}`
      );
      const data = await res.json();

      if (res.status === 410) {
        alert(data.message || 'This link has expired and all data has been deleted.');
        window.location.href = `enter-passcode.html?id=${encodeURIComponent(proposalId)}`;
        return null;
      }

      if (!res.ok || !data.success) throw new Error(data.message);
      return data.proposal;
    } catch (err) {
      console.error('[MemoryLane] Fetch error:', err);
      return null;
    }
  }

  
  function buildDots(count) {
    if (!dotTrack) return;
    dotTrack.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const dot = document.createElement('button');
      dot.className = 'dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Memory ${i + 1}`);
      dot.addEventListener('click', () => {
        if (i !== current && !isAnimating && !isFinal) goTo(i);
      });
      dotTrack.appendChild(dot);
    }
  }

  function updateDots(index) {
    if (!dotTrack) return;
    Array.from(dotTrack.children).forEach((d, i) =>
      d.classList.toggle('active', i === index)
    );
  }

  function updateCounter(index) {
    if (!counter) return;
    counter.classList.toggle('visible', !isFinal);
    if (counterCur) counterCur.textContent = index + 1;
    if (counterTot) counterTot.textContent = photos.length;
  }

  function updateArrows(index) {
    if (btnPrev) btnPrev.disabled = index === 0;
    if (btnNext) btnNext.disabled = false; 
  }

  
  function swapImage(src) {
    return new Promise(resolve => {
      if (!polaroidImg) { resolve(); return; }
      polaroidImg.style.opacity = '0';
      polaroidImg.style.transition = 'opacity 0.25s';
      setTimeout(() => {
        polaroidImg.src = src;
        polaroidImg.onload = () => {
          polaroidImg.style.opacity = '1';
          resolve();
        };
        
        setTimeout(resolve, 400);
      }, 250);
    });
  }

  
  function showFinal() {
    isFinal = true;

    
    if (polaroidWrap) {
      polaroidWrap.classList.remove('visible');
      polaroidWrap.classList.add('exit-left');
      setTimeout(() => {
        polaroidWrap.style.display = 'none';
        polaroidWrap.classList.remove('exit-left');
      }, 500);
    }

    
    if (counter) counter.classList.remove('visible');
    if (navRow)  navRow.classList.remove('visible');

    
    setTimeout(() => {
      if (finalCard) finalCard.classList.add('visible');
    }, 400);
  }

  
  async function goTo(index, dir) {
    if (isAnimating || isFinal) return;

    const direction = dir || (index > current ? 'next' : 'prev');
    isAnimating = true;

    
    if (polaroidWrap) {
      const exitClass = direction === 'next' ? 'exit-left' : 'exit-right';
      polaroidWrap.classList.remove('visible');
      polaroidWrap.classList.add(exitClass);

      await new Promise(r => setTimeout(r, 480));
      polaroidWrap.classList.remove(exitClass);
    }

    
    current = index;
    updateDots(current);
    updateCounter(current);
    updateArrows(current);

    
    await swapImage(photos[current]);

    
    if (polaroidWrap) {
      const enterClass = direction === 'next' ? 'enter-right' : 'enter-left';
      polaroidWrap.classList.add(enterClass);
      
      if (polaroidImg) {
        polaroidImg.style.transform = 'scale(1.04)';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (polaroidImg) polaroidImg.style.transform = 'scale(1)';
          });
        });
      }
      await new Promise(r => setTimeout(r, 600));
      polaroidWrap.classList.remove(enterClass);
      polaroidWrap.classList.add('visible');
    }

    isAnimating = false;
  }

  function next() {
    if (isAnimating || isFinal) return;
    if (current < photos.length - 1) {
      goTo(current + 1, 'next');
    } else {
      showFinal();
    }
  }

  function prev() {
    if (isAnimating || isFinal) return;
    if (current > 0) goTo(current - 1, 'prev');
  }

  
  if (btnPrev) btnPrev.addEventListener('click', prev);
  if (btnNext) btnNext.addEventListener('click', next);

  
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft')  prev();
  });

  
  let touchStartX = 0;
  let touchStartY = 0;

  const stage = document.getElementById('memory-page');
  if (stage) {
    stage.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    stage.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        if (dx < 0) next();
        else         prev();
      }
    }, { passive: true });
  }

  
  function runIntro(senderName) {
    if (introSender && senderName) introSender.textContent = senderName;

    
    setTimeout(() => {
      if (introSweep) introSweep.classList.add('animate');
    }, 300);

    
    setTimeout(() => {
      if (polaroidWrap) polaroidWrap.classList.add('visible');
    }, 900);

    
    setTimeout(() => {
      if (introFrom) introFrom.classList.add('visible');
    }, 1300);

    
    setTimeout(() => {
      if (swipeHint) swipeHint.classList.add('visible');
      if (navRow)    navRow.classList.add('visible');
      if (counter)   counter.classList.add('visible');
    }, 2000);

    
    setTimeout(() => {
      if (introFrom) {
        introFrom.style.transition = 'opacity 1.5s';
        introFrom.style.opacity    = '0';
        setTimeout(() => {
          if (introFrom) introFrom.style.display = 'none';
        }, 1500);
      }
    }, 4500);
  }

  
  async function init() {
    const proposal = await fetchProposal();

    const senderName = proposal ? proposal.senderName : '';
    photos = (proposal && proposal.memoryPhotos && proposal.memoryPhotos.length > 0)
      ? proposal.memoryPhotos
      : [];

    if (senderName) {
      document.title = `For ${proposal.recipientName || 'You'} — Forever Yours`;
    }

    if (photos.length === 0) {
      
      if (polaroidWrap)  polaroidWrap.style.display  = 'none';
      if (navRow)        navRow.style.display         = 'none';
      if (counter)       counter.style.display        = 'none';
      if (fallbackCard)  fallbackCard.style.display   = 'flex';

      setTimeout(() => {
        if (introSweep) introSweep.classList.add('animate');
      }, 400);
      return;
    }

    
    polaroidImg.src = photos[0];

    
    buildDots(photos.length);
    updateCounter(0);
    updateArrows(0);

    
    if (polaroidImg) {
      polaroidImg.style.transition = 'transform 7s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.25s';
    }

    runIntro(senderName);
  }

  init();

})();
