

(function () {
  'use strict';

  const API_BASE = 'https://lovexa-1-0.onrender.com/api';
  const PIN_LENGTH = 6;
  const PIN_PATTERN = /^\d{6}$/;

  function isDigit(char) {
    return char && char.length === 1 && char >= '0' && char <= '9';
  }

  function sanitizeDigits(value, maxLen) {
    return String(value || '').replace(/\D/g, '').slice(0, maxLen);
  }

  
  const params     = new URLSearchParams(window.location.search);
  const urlId      = params.get('id');
  const isRecipient = !!urlId;
  const isCreator   = !isRecipient;

  
  function showMode() {
    const creatorMode    = document.getElementById('creator-mode');
    const recipientMode  = document.getElementById('recipient-mode');
    const creatorNav     = document.getElementById('creator-navbar');
    const recipientNav   = document.getElementById('recipient-navbar');
    const creatorProgress= document.getElementById('creator-progress');

    if (isCreator) {
      if (creatorMode)    creatorMode.style.display    = '';
      if (creatorNav)     creatorNav.style.display     = '';
      if (creatorProgress)creatorProgress.style.display= '';
      document.title = 'Set Your Passcode — Forever Yours';
    } else {
      if (recipientMode) recipientMode.style.display   = '';
      if (recipientNav)  recipientNav.style.display    = '';
      document.title = 'Unlock Your Moment — Forever Yours';
    }
  }

  showMode();


  
  if (isCreator) {

    
    const proposalId = window.StorageService
      ? window.StorageService.getProposalId()
      : null;

    if (!proposalId) {
      window.StorageService.redirectToCreate('No proposalId on enter-passcode (creator)');
      return;
    }

    
    const pass1    = document.getElementById('creator-pass1');
    const pass2    = document.getElementById('creator-pass2');
    const eye1     = document.getElementById('eye-creator1');
    const eye2     = document.getElementById('eye-creator2');
    const matchEl  = document.getElementById('creator-match');
    const btnSet   = document.getElementById('btn-set-creator');
    const successEl= document.getElementById('creator-success');

    
    function toggleEye(btn, input) {
      if (!btn || !input) return;
      btn.addEventListener('click', () => {
        const show  = input.type === 'password';
        input.type  = show ? 'text' : 'password';
        btn.textContent = show ? '🙈' : '👁';
      });
    }

    toggleEye(eye1, pass1);
    toggleEye(eye2, pass2);

    
    function bindCreatorDigits(input) {
      if (!input) return;
      input.addEventListener('input', () => {
        const clean = sanitizeDigits(input.value, PIN_LENGTH);
        if (input.value !== clean) input.value = clean;
        updateMatch();
      });
    }

    function passcodesMatch() {
      if (!pass1 || !pass2) return false;
      const a = pass1.value;
      const b = pass2.value;
      return PIN_PATTERN.test(a) && a === b;
    }

    function updateMatch() {
      if (!matchEl || !pass2) return;
      const p1 = pass1 ? pass1.value : '';
      const p2 = pass2.value;

      if (p2.length === 0 && p1.length === 0) {
        matchEl.className = 'creator-match';
        matchEl.textContent = '';
        pass2.classList.remove('match', 'mismatch');
        if (btnSet) btnSet.disabled = true;
        return;
      }

      const ok = passcodesMatch();
      if (!ok && (p1.length === PIN_LENGTH || p2.length === PIN_LENGTH)) {
        if (p1 !== p2) {
          matchEl.className = 'creator-match show fail';
          matchEl.textContent = '✦ Passcodes do not match';
        } else if (!PIN_PATTERN.test(p1)) {
          matchEl.className = 'creator-match show fail';
          matchEl.textContent = '✦ Use numbers only (6 digits)';
        } else {
          matchEl.className = 'creator-match show';
          matchEl.textContent = `✦ Enter ${PIN_LENGTH} digits in both fields`;
        }
      } else if (ok) {
        matchEl.className = 'creator-match show match';
        matchEl.textContent = '✦ Passcodes match';
      } else {
        matchEl.className = 'creator-match show';
        matchEl.textContent = `✦ ${PIN_LENGTH} digits required`;
      }

      pass2.classList.toggle('match',    ok);
      pass2.classList.toggle('mismatch', !ok && p2.length > 0);
      if (btnSet) btnSet.disabled = !ok;
    }

    bindCreatorDigits(pass1);
    bindCreatorDigits(pass2);
    updateMatch();

    async function handleSetPasscode() {
      if (!passcodesMatch()) return;

      btnSet.disabled = true;
      btnSet.classList.add('loading');

      try {
        const res  = await fetch(`${API_BASE}/proposals/${proposalId}/passcode`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ passcode: pass1.value }),
        });

        const data = await res.json();

        if (res.status === 410) {
          throw new Error(data.message || 'This proposal has expired.');
        }

        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Could not set passcode.');
        }

        if (data.expiresAt && window.StorageService) {
          window.StorageService.saveExpiresAt(data.expiresAt);
        }

        try {
          sessionStorage.setItem('fy_pass', pass1.value);
        } catch {  }

        
        btnSet.classList.remove('loading');
        if (successEl) successEl.classList.add('show');

        setTimeout(() => {
          window.location.href = window.StorageService
            ? window.StorageService.withPid('generate-link.html')
            : `generate-link.html?pid=${encodeURIComponent(proposalId)}`;
        }, 2000);

      } catch (err) {
        console.error('[Creator] Set passcode error:', err);
        alert('Could not set passcode:\n' + err.message);
        btnSet.disabled = false;
        btnSet.classList.remove('loading');
      }
    }

    if (btnSet) btnSet.addEventListener('click', handleSetPasscode);

    
    [pass1, pass2].forEach(input => {
      if (input) {
        input.addEventListener('keydown', e => {
          if (e.key === 'Enter' && passcodesMatch()) handleSetPasscode();
        });
      }
    });

    
    setTimeout(() => { if (pass1) pass1.focus(); }, 1000);

    return; 
  }


  

  const proposalId = urlId;

  
  const pinBoxes     = Array.from(document.querySelectorAll('.pin-box'));
  const pinBoxesWrap = document.querySelector('.pin-boxes');
  const hiddenInput  = document.getElementById('pin-hidden-input');
  const toggleReveal = document.getElementById('pin-toggle');
  const errorEl      = document.getElementById('passcode-error');
  const hintEl       = document.getElementById('passcode-hint-msg');
  const btnUnlock    = document.getElementById('btn-unlock');
  const successEl    = document.getElementById('unlock-success');

  
  if (pinBoxes.length !== PIN_LENGTH) {
    console.error(`[Passcode] Expected ${PIN_LENGTH} pin boxes, found ${pinBoxes.length}`);
  }

  let digits      = Array(PIN_LENGTH).fill('');
  let activeIndex = 0;
  let revealed    = false;
  let attempts    = 0;
  let locked      = false;

  
  function renderBoxes() {
    pinBoxes.forEach((box, i) => {
      box.classList.toggle('filled', digits[i] !== '');
      box.classList.toggle('active', i === activeIndex);
      const char = box.querySelector('.pin-char');
      if (char) char.textContent = digits[i] || '';
    });
    if (btnUnlock) {
      btnUnlock.disabled = locked || getPasscode().length !== PIN_LENGTH;
    }
  }

  function getPasscode() { return digits.join(''); }

  function isPinComplete() {
    return digits.every(d => d !== '') && digits.length === PIN_LENGTH;
  }

  function focusInput() { if (hiddenInput) hiddenInput.focus(); }

  
  
  let keydownHandled = false;

  function handleKey(e) {
    if (locked) return;
    const key = e.key;

    if (key === 'Backspace') {
      e.preventDefault();
      keydownHandled = true;
      if (digits[activeIndex] !== '') {
        digits[activeIndex] = '';
      } else if (activeIndex > 0) {
        activeIndex--;
        digits[activeIndex] = '';
      }
      clearError();
      renderBoxes();
      return;
    }

    if (key === 'Enter') {
      e.preventDefault();
      keydownHandled = true;
      if (isPinComplete()) handleUnlock();
      else if (getPasscode().length > 0) showError(`Enter all ${PIN_LENGTH} digits.`);
      return;
    }

    if (key.length === 1) {
      if (!isDigit(key)) return;
      if (isPinComplete()) return;
      keydownHandled = true;
      if (activeIndex >= PIN_LENGTH) return;
      digits[activeIndex] = key;
      if (activeIndex < PIN_LENGTH - 1) activeIndex++;
      clearError();
      renderBoxes();
      if (isPinComplete()) handleUnlock();
    }
  }

  
  pinBoxes.forEach((box, i) => {
    box.addEventListener('click', () => {
      const firstEmpty = digits.findIndex(d => d === '');
      activeIndex = firstEmpty === -1 ? pinBoxes.length - 1 : Math.min(i, firstEmpty);
      renderBoxes();
      focusInput();
    });
  });

  
  if (hiddenInput) {
    hiddenInput.addEventListener('keydown', handleKey);

    
    
    hiddenInput.addEventListener('input', (e) => {
      if (keydownHandled) {
        keydownHandled = false;
        hiddenInput.value = '';
        return;
      }
      if (locked) return;

      const pasted = sanitizeDigits(e.data || hiddenInput.value, PIN_LENGTH);
      hiddenInput.value = '';

      if (!pasted) return;

      digits = Array(PIN_LENGTH).fill('');
      for (let i = 0; i < pasted.length && i < PIN_LENGTH; i++) {
        digits[i] = pasted[i];
      }
      activeIndex = pasted.length >= PIN_LENGTH ? PIN_LENGTH - 1 : pasted.length;
      clearError();
      renderBoxes();
      if (isPinComplete()) handleUnlock();
    });
  }

  
  if (toggleReveal) {
    toggleReveal.addEventListener('click', () => {
      revealed = !revealed;
      if (pinBoxesWrap) pinBoxesWrap.classList.toggle('reveal', revealed);
      const label = toggleReveal.querySelector('span');
      if (label) label.textContent = revealed ? 'Hide passcode' : 'Show passcode';
    });
  }

  
  function showError(msg) {
    if (errorEl) { errorEl.textContent = msg; errorEl.classList.add('show'); }
  }

  function clearError() {
    if (errorEl) errorEl.classList.remove('show');
  }

  function shakeBoxes() {
    pinBoxes.forEach(box => {
      box.classList.remove('error');
      void box.offsetWidth;
      box.classList.add('error');
    });
    setTimeout(() => pinBoxes.forEach(box => box.classList.remove('error')), 600);
  }

  function resetPIN() {
    digits = Array(PIN_LENGTH).fill('');
    activeIndex = 0;
    renderBoxes();
    focusInput();
  }

  function maybeShowHint() {
    if (attempts >= 2 && hintEl) hintEl.classList.add('show');
  }

  
  async function handleUnlock() {
    if (locked) return;
    const passcode = getPasscode();
    if (!isPinComplete()) {
      showError(`Enter exactly ${PIN_LENGTH} digits.`);
      return;
    }

    if (btnUnlock) { btnUnlock.classList.add('loading'); btnUnlock.disabled = true; }

    try {
      const res  = await fetch(`${API_BASE}/proposals/${proposalId}/verify`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ passcode }),
      });

      const data = await res.json();

      if (res.status === 410) {
        if (btnUnlock) { btnUnlock.classList.remove('loading'); btnUnlock.disabled = false; }
        showError(data.message || 'This link has expired and all data has been deleted.');
        return;
      }

      if (res.ok && data.success && data.valid) {
        onSuccess(passcode);
      } else {
        if (btnUnlock) { btnUnlock.classList.remove('loading'); btnUnlock.disabled = false; }
        attempts++;
        shakeBoxes();
        showError(data.message || 'Incorrect passcode. Please try again.');
        maybeShowHint();
        setTimeout(resetPIN, 650);
      }

    } catch (err) {
      console.error('[Recipient] Verify error:', err);
      if (btnUnlock) { btnUnlock.classList.remove('loading'); btnUnlock.disabled = false; }
      showError('Connection error. Please check your connection and try again.');
    }
  }

  
  async function onSuccess(passcode) {
    
    try {
      sessionStorage.setItem('fy_pid',  proposalId);
      sessionStorage.setItem('fy_pass', passcode);
    } catch {  }

    
    if (successEl) successEl.classList.add('show');

    
    try {
      const res  = await fetch(
        `${API_BASE}/proposals/${proposalId}?passcode=${encodeURIComponent(passcode)}`
      );
      const data = await res.json();

      if (res.status === 410) {
        return;
      }

      if (res.ok && data.success && data.proposal) {
        const { couplePhoto, senderName, recipientName } = data.proposal;

        
        const photoWrap = document.getElementById('couple-photo-wrap');
        const photoImg  = document.getElementById('couple-photo-img');
        const namesEl   = document.getElementById('unlock-names');

        if (couplePhoto && photoWrap && photoImg) {
          photoImg.src = couplePhoto;
          photoWrap.style.display = '';
          
          setTimeout(() => photoWrap.classList.add('visible'), 300);
        }

        if (namesEl && senderName && recipientName) {
          namesEl.innerHTML = `<span>${senderName}</span> &amp; <span>${recipientName}</span>`;
          namesEl.style.display = '';
        }
      }
    } catch (err) {
      console.warn('[Passcode] Could not fetch couple photo:', err);
      
    }

    
    setTimeout(() => {
      window.location.href = `memory-lane.html?id=${encodeURIComponent(proposalId)}`;
    }, 3200);
  }

  if (btnUnlock) btnUnlock.addEventListener('click', handleUnlock);

  
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.navbar--minimal')) focusInput();
  });

  
  (function spawnParticles() {
    const container = document.querySelector('.passcode-page__particles');
    if (!container) return;
    for (let i = 0; i < 12; i++) {
      const p    = document.createElement('div');
      p.className = 'particle';
      const size  = 40 + Math.random() * 120;
      p.style.cssText = `
        width:${size}px; height:${size}px;
        left:${Math.random() * 100}%;
        animation-duration:${12 + Math.random() * 18}s;
        animation-delay:${Math.random() * 15}s;
      `;
      container.appendChild(p);
    }
  })();

  
  renderBoxes();
  setTimeout(focusInput, 1600);

})();
