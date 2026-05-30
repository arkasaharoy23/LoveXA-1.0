(function () {
  'use strict';

  const API_BASE = 'https://lovexa-1-0.onrender.com/api';

  
  const params     = new URLSearchParams(window.location.search);
  const proposalId = params.get('id') || sessionStorage.getItem('fy_pid');
  const passcode   = sessionStorage.getItem('fy_pass');
  const NEXT_PAGE  = proposalId
    ? `success.html?id=${encodeURIComponent(proposalId)}`
    : 'success.html';

  
  const page            = document.querySelector('.proposal-page');
  const letterCard      = document.getElementById('letter-card');
  const waxSeal         = document.getElementById('wax-seal');
  const letterDate      = document.getElementById('letter-date');
  const letterSalutation= document.getElementById('letter-salutation');
  const salutationName  = document.getElementById('salutation-name');
  const letterBody      = document.getElementById('letter-body');
  const letterDivider   = document.getElementById('letter-divider');
  const proposalQ       = document.getElementById('proposal-question');
  const proposalBtns    = document.getElementById('proposal-buttons');
  const letterSignature = document.getElementById('letter-signature');
  const signatureName   = document.getElementById('signature-name');
  const btnYes          = document.getElementById('btn-yes');
  const btnNo           = document.getElementById('btn-no');
  const tapOverlay      = document.getElementById('tap-to-start');
  const audio           = document.getElementById('bg-music');


  
  function fadeAudioIn(targetVol) {
    if (!audio) return;
    audio.volume = 0;
    const target = targetVol || 0.6;
    const step   = () => {
      audio.volume = Math.min(audio.volume + 0.012, target);
      if (audio.volume < target) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function swellAudio() {
    if (!audio) return;
    const step = () => {
      audio.volume = Math.min(audio.volume + 0.025, 1.0);
      if (audio.volume < 1.0) requestAnimationFrame(step);
    };
    step();
  }

  function fadeAudioOut(cb) {
    if (!audio || audio.paused) { if (cb) cb(); return; }
    const step = () => {
      audio.volume = Math.max(audio.volume - 0.025, 0);
      if (audio.volume > 0) requestAnimationFrame(step);
      else { audio.pause(); if (cb) cb(); }
    };
    step();
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

  if (tapOverlay) {
    tapOverlay.addEventListener('click', () => {
      hideTapOverlay();
      playMusic().then(() => fadeAudioIn()).catch(() => {});
    });
  }


  
  async function fetchProposal() {
    if (!proposalId || !passcode) return null;
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

      return (res.ok && data.success) ? data.proposal : null;
    } catch {
      return null;
    }
  }


  
  function buildLines(message) {
    if (!letterBody || !message) return [];

    
    const raw   = message.trim();
    const paras = raw.split('\n').filter(p => p.trim() !== '');
    const lines = [];

    paras.forEach(para => {
      const words  = para.split(' ');
      let current  = '';
      words.forEach(word => {
        if ((current + ' ' + word).trim().length <= 65) {
          current = (current + ' ' + word).trim();
        } else {
          if (current) lines.push(current);
          current = word;
        }
      });
      if (current) lines.push(current);
      lines.push(''); 
    });

    
    while (lines.length && lines[lines.length - 1] === '') lines.pop();

    const fragments = [];
    lines.forEach(text => {
      const span = document.createElement('span');
      span.className   = 'letter-line';
      span.textContent = text;
      letterBody.appendChild(span);
      fragments.push(span);
    });

    return fragments;
  }


  
  function runReveal(proposal) {
    const senderName    = proposal ? proposal.senderName    : 'Someone special';
    const recipientName = proposal ? proposal.recipientName : 'You';
    const message       = proposal ? proposal.message       : '';

    
    if (salutationName) salutationName.textContent = recipientName + ',';
    if (signatureName)  signatureName.textContent  = senderName;

    
    if (letterDate) {
      const now = new Date();
      letterDate.textContent = now.toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    }

    const lines = buildLines(message);
    let delay   = 0;

    
    setTimeout(() => {
      if (letterCard) letterCard.classList.add('visible');
    }, 100);

    
    delay = 400;
    setTimeout(() => {
      if (waxSeal) waxSeal.classList.add('visible');
    }, delay);

    
    delay = 900;
    setTimeout(() => {
      if (letterDate) letterDate.classList.add('visible');
    }, delay);

    
    delay = 1300;
    setTimeout(() => {
      if (letterSalutation) letterSalutation.classList.add('visible');
    }, delay);

    
    delay = 1800;
    lines.forEach((line, i) => {
      const lineDelay = delay + i * 400;
      setTimeout(() => line.classList.add('visible'), lineDelay);
    });

    
    const afterLines = delay + lines.length * 400 + 300;

    
    setTimeout(() => {
      if (letterSignature) letterSignature.classList.add('visible');
    }, afterLines);

    
    setTimeout(() => {
      if (letterDivider) letterDivider.classList.add('visible');
    }, afterLines + 600);

    
    setTimeout(() => {
      if (proposalQ) proposalQ.classList.add('visible');
    }, afterLines + 1300);

    
    setTimeout(() => {
      if (proposalBtns) proposalBtns.classList.add('visible');
      
      if (window.NoButtonEscape && btnNo) {
        window.NoButtonEscape.init(btnNo);
      }
    }, afterLines + 2000);
  }


  
  function handleYes() {
    if (btnYes) {
      btnYes.textContent = '♥ Yes ♥';
      btnYes.style.transform = 'scale(1.15)';
      btnYes.style.boxShadow = '0 0 80px rgba(201,168,76,0.7), 0 0 160px rgba(201,168,76,0.3)';
    }

    swellAudio();

    setTimeout(() => {
      if (page) page.classList.add('fading-out');
    }, 600);

    setTimeout(() => {
      window.location.href = NEXT_PAGE;
    }, 1600);
  }

  if (btnYes) btnYes.addEventListener('click', handleYes);


  
  async function init() {
    
    playMusic()
      .then(() => { fadeAudioIn(); hideTapOverlay(); })
      .catch(() => showTapOverlay());

    const proposal = await fetchProposal();
    runReveal(proposal);
  }

  setTimeout(init, 500);

})();
