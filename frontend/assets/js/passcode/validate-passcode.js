(function () {
  'use strict';

  const API_BASE = (window.APP_CONFIG && window.APP_CONFIG.API_BASE) || 'https://lovexa-1-0.onrender.com/api';

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
      alert('No proposal found. Please start from the beginning.');
      window.location.href = 'create-proposal.html';
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

    function passcodesMatch() {
      return pass1 && pass2 &&
             pass1.value.length >= 4 &&
             pass1.value === pass2.value;
    }

    function updateMatch() {
      if (!matchEl || !pass2) return;
      const p2 = pass2.value;

      if (p2.length === 0) {
        matchEl.className = 'creator-match';
        matchEl.textContent = '';
        if (pass2) pass2.classList.remove('match', 'mismatch');
        return;
      }

      const ok = passcodesMatch();
      matchEl.className = `creator-match show ${ok ? 'match' : 'fail'}`;
      matchEl.textContent = ok ? '✦ Passcodes match' : '✦ Passcodes do not match';
      pass2.classList.toggle('match',    ok);
      pass2.classList.toggle('mismatch', !ok);
      if (btnSet) btnSet.disabled = !ok;
    }

    if (pass1) pass1.addEventListener('input', updateMatch);
    if (pass2) pass2.addEventListener('input', updateMatch);

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

        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Could not set passcode.');
        }

        btnSet.classList.remove('loading');
        if (successEl) successEl.classList.add('show');

        setTimeout(() => {
          window.location.href = 'generate-link.html';
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

  let digits      = Array(pinBoxes.length).fill('');
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
      btnUnlock.disabled =
        digits.filter(d => d !== '').length === 0 || locked;
    }
  }

  function getPasscode() {
    return digits.filter(d => d !== '').join('');
  }

  function focusInput() {
    if (!hiddenInput) return;

    hiddenInput.style.pointerEvents = 'all';
    hiddenInput.focus();
    hiddenInput.click();

    setTimeout(() => {
      hiddenInput.style.pointerEvents = 'none';
    }, 100);
  }

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

      if (getPasscode().length > 0) handleUnlock();
      return;
    }

    if (key.length === 1 && activeIndex < pinBoxes.length) {
      keydownHandled = true;

      digits[activeIndex] = key;

      if (activeIndex < pinBoxes.length - 1) {
        activeIndex++;
      }

      clearError();
      renderBoxes();
    }
  }

  pinBoxes.forEach((box, i) => {
    box.addEventListener('click', () => {
      const firstEmpty = digits.findIndex(d => d === '');

      activeIndex =
        firstEmpty === -1
          ? pinBoxes.length - 1
          : Math.min(i, firstEmpty);

      renderBoxes();
      focusInput();
    });
  });

  if (hiddenInput) {

    hiddenInput.addEventListener('keydown', handleKey);

    hiddenInput.addEventListener('input', () => {

      if (keydownHandled) {
        keydownHandled = false;
        hiddenInput.value = '';
        return;
      }

      if (locked) {
        hiddenInput.value = '';
        return;
      }

      const val = hiddenInput.value;
      hiddenInput.value = '';

      if (!val) return;

      for (const ch of val) {
        if (activeIndex < pinBoxes.length) {
          digits[activeIndex] = ch;

          if (activeIndex < pinBoxes.length - 1) {
            activeIndex++;
          }
        }
      }

      clearError();
      renderBoxes();
    });

    hiddenInput.addEventListener('input', (e) => {

      if (
        e.inputType === 'deleteContentBackward' &&
        !keydownHandled
      ) {

        if (digits[activeIndex] !== '') {
          digits[activeIndex] = '';
        } else if (activeIndex > 0) {
          activeIndex--;
          digits[activeIndex] = '';
        }

        hiddenInput.value = '';
        clearError();
        renderBoxes();
      }
    });
  }

  if (toggleReveal) {
    toggleReveal.addEventListener('click', () => {
      revealed = !revealed;

      if (pinBoxesWrap) {
        pinBoxesWrap.classList.toggle('reveal', revealed);
      }

      const label = toggleReveal.querySelector('span');

      if (label) {
        label.textContent = revealed
          ? 'Hide passcode'
          : 'Show passcode';
      }
    });
  }

  function showError(msg) {
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.classList.add('show');
    }
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

    setTimeout(() => {
      pinBoxes.forEach(box => box.classList.remove('error'));
    }, 600);
  }

  function resetPIN() {
    digits = Array(pinBoxes.length).fill('');
    activeIndex = 0;
    renderBoxes();
    focusInput();
  }

  function maybeShowHint() {
    if (attempts >= 2 && hintEl) {
      hintEl.classList.add('show');
    }
  }

  async function handleUnlock() {
    if (locked) return;

    const passcode = getPasscode();

    if (!passcode) return;

    if (btnUnlock) {
      btnUnlock.classList.add('loading');
      btnUnlock.disabled = true;
    }

    try {
      const res = await fetch(
        `${API_BASE}/proposals/${proposalId}/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ passcode }),
        }
      );

      const data = await res.json();

      if (res.ok && data.success && data.valid) {

        onSuccess(passcode);

      } else {

        if (btnUnlock) {
          btnUnlock.classList.remove('loading');
          btnUnlock.disabled = false;
        }

        attempts++;
        shakeBoxes();
        showError('Incorrect passcode. Please try again.');
        maybeShowHint();

        setTimeout(resetPIN, 650);
      }

    } catch (err) {

      console.error('[Recipient] Verify error:', err);

      if (btnUnlock) {
        btnUnlock.classList.remove('loading');
        btnUnlock.disabled = false;
      }

      showError(
        'Connection error. Please check your connection and try again.'
      );
    }
  }

  async function onSuccess(passcode) {

    try {
      sessionStorage.setItem('fy_pid',  proposalId);
      sessionStorage.setItem('fy_pass', passcode);
    } catch {}

    if (successEl) {
      successEl.classList.add('show');
    }

    try {
      const res = await fetch(
        `${API_BASE}/proposals/${proposalId}?passcode=${encodeURIComponent(passcode)}`
      );

      const data = await res.json();

      if (res.ok && data.success && data.proposal) {

        const {
          couplePhoto,
          senderName,
          recipientName
        } = data.proposal;

        const photoWrap = document.getElementById('couple-photo-wrap');
        const photoImg  = document.getElementById('couple-photo-img');
        const namesEl   = document.getElementById('unlock-names');

        if (couplePhoto && photoWrap && photoImg) {
          photoImg.src = couplePhoto;
          photoWrap.style.display = '';

          setTimeout(() => {
            photoWrap.classList.add('visible');
          }, 300);
        }

        if (namesEl && senderName && recipientName) {
          namesEl.innerHTML =
            `<span>${senderName}</span> &amp; <span>${recipientName}</span>`;

          namesEl.style.display = '';
        }
      }

    } catch (err) {

      console.warn(
        '[Passcode] Could not fetch couple photo:',
        err
      );
    }

    setTimeout(() => {
      window.location.href =
        `memory-lane.html?id=${encodeURIComponent(proposalId)}`;
    }, 3200);
  }

  if (btnUnlock) {
    btnUnlock.addEventListener('click', handleUnlock);
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.navbar--minimal')) {
      focusInput();
    }
  });

  (function spawnParticles() {

    const container =
      document.querySelector('.passcode-page__particles');

    if (!container) return;

    for (let i = 0; i < 12; i++) {

      const p = document.createElement('div');
      p.className = 'particle';

      const size = 40 + Math.random() * 120;

      p.style.cssText = `
        width:${size}px;
        height:${size}px;
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