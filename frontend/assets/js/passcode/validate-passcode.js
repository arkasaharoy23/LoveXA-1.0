(function () {
  'use strict';

  const API_BASE = (window.APP_CONFIG && window.APP_CONFIG.API_BASE) || 'https://lovexa-1-0.onrender.com/api';

  const params = new URLSearchParams(window.location.search);
  const urlId = params.get('id');
  const isRecipient = !!urlId;
  const isCreator = !isRecipient;

  function showMode() {
    const creatorMode = document.getElementById('creator-mode');
    const recipientMode = document.getElementById('recipient-mode');
    const creatorNav = document.getElementById('creator-navbar');
    const recipientNav = document.getElementById('recipient-navbar');
    const creatorProgress = document.getElementById('creator-progress');

    if (isCreator) {
      if (creatorMode) creatorMode.style.display = '';
      if (creatorNav) creatorNav.style.display = '';
      if (creatorProgress) creatorProgress.style.display = '';
      document.title = 'Set Your Passcode — Forever Yours';
    } else {
      if (recipientMode) recipientMode.style.display = '';
      if (recipientNav) recipientNav.style.display = '';
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

    const pass1 = document.getElementById('creator-pass1');
    const pass2 = document.getElementById('creator-pass2');
    const eye1 = document.getElementById('eye-creator1');
    const eye2 = document.getElementById('eye-creator2');
    const matchEl = document.getElementById('creator-match');
    const btnSet = document.getElementById('btn-set-creator');
    const successEl = document.getElementById('creator-success');

    function toggleEye(btn, input) {
      if (!btn || !input) return;
      btn.addEventListener('click', () => {
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.textContent = show ? '🙈' : '👁';
      });
    }

    toggleEye(eye1, pass1);
    toggleEye(eye2, pass2);

    if (pass1) {
      pass1.maxLength = 6;
      pass1.addEventListener('input', () => {
        pass1.value = pass1.value.replace(/\D/g, '').slice(0, 6);
        updateMatch();
      });
    }

    if (pass2) {
      pass2.maxLength = 6;
      pass2.addEventListener('input', () => {
        pass2.value = pass2.value.replace(/\D/g, '').slice(0, 6);
        updateMatch();
      });
    }

    function passcodesMatch() {
      return pass1 && pass2 &&
        pass1.value.length === 6 &&
        pass2.value.length === 6 &&
        pass1.value === pass2.value;
    }

    function updateMatch() {
      if (!matchEl || !pass2) return;
      const p1 = pass1 ? pass1.value : '';
      const p2 = pass2.value;

      if (p1.length === 0 && p2.length === 0) {
        matchEl.className = 'creator-match';
        matchEl.textContent = '';
        pass2.classList.remove('match', 'mismatch');
        if (btnSet) btnSet.disabled = true;
        return;
      }

      if (p1.length > 0 && p1.length < 6) {
        matchEl.className = 'creator-match show fail';
        matchEl.textContent = '✦ Passcode must be exactly 6 digits';
        pass2.classList.remove('match');
        pass2.classList.add('mismatch');
        if (btnSet) btnSet.disabled = true;
        return;
      }

      if (p2.length > 0 && p2.length < 6) {
        matchEl.className = 'creator-match show fail';
        matchEl.textContent = '✦ Confirm passcode must be exactly 6 digits';
        pass2.classList.remove('match');
        pass2.classList.add('mismatch');
        if (btnSet) btnSet.disabled = true;
        return;
      }

      if (p2.length === 0) {
        matchEl.className = 'creator-match';
        matchEl.textContent = '';
        pass2.classList.remove('match', 'mismatch');
        if (btnSet) btnSet.disabled = true;
        return;
      }

      const ok = passcodesMatch();
      matchEl.className = `creator-match show ${ok ? 'match' : 'fail'}`;
      matchEl.textContent = ok ? '✦ Passcodes match' : '✦ Passcodes do not match';
      pass2.classList.toggle('match', ok);
      pass2.classList.toggle('mismatch', !ok);
      if (btnSet) btnSet.disabled = !ok;
    }

    async function handleSetPasscode() {
      if (!passcodesMatch()) {
        if (pass1 && pass1.value.length !== 6) {
          alert('Passcode must be exactly 6 digits.');
        } else if (pass2 && pass2.value.length !== 6) {
          alert('Confirm passcode must be exactly 6 digits.');
        } else {
          alert('Passcodes do not match.');
        }
        return;
      }

      btnSet.disabled = true;
      btnSet.classList.add('loading');

      try {
        const res = await fetch(`${API_BASE}/proposals/${proposalId}/passcode`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passcode: pass1.value }),
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

  const pinBoxes = Array.from(document.querySelectorAll('.pin-box'));
  const pinBoxesWrap = document.querySelector('.pin-boxes');
  const hiddenInput = document.getElementById('pin-hidden-input');
  const toggleReveal = document.getElementById('pin-toggle');
  const errorEl = document.getElementById('passcode-error');
  const hintEl = document.getElementById('passcode-hint-msg');
  const btnUnlock = document.getElementById('btn-unlock');
  const successEl = document.getElementById('unlock-success');

  const PIN_LENGTH = 6;

  let digits = Array(PIN_LENGTH).fill('');
  let activeIndex = 0;
  let revealed = false;
  let attempts = 0;
  let locked = false;

  function getPinLength() {
    return digits.filter(d => d !== '').length;
  }

  function isDigit(value) {
    return /^\d$/.test(value);
  }

  function syncFromDigits() {
    if (hiddenInput) {
      hiddenInput.value = digits.join('');
    }
  }

  function renderBoxes() {
    pinBoxes.forEach((box, i) => {
      const val = digits[i];
      const dotEl = box.querySelector('.pin-dot');
      const charEl = box.querySelector('.pin-char');

      if (revealed) {
        if (dotEl) dotEl.style.display = 'none';
        if (charEl) {
          charEl.style.display = val ? '' : 'none';
          charEl.textContent = val || '';
        }
      } else {
        if (dotEl) dotEl.style.display = val ? '' : 'none';
        if (charEl) {
          charEl.style.display = 'none';
          charEl.textContent = '';
        }
      }

      box.classList.toggle('filled', val !== '');
      box.classList.toggle('active', i === activeIndex);
    });

    syncFromDigits();

    if (btnUnlock) {
      btnUnlock.disabled = getPinLength() !== PIN_LENGTH || locked;
    }
  }

  function setError(msg) {
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.style.display = msg ? '' : 'none';
    }
  }

  function setHint(msg) {
    if (hintEl) {
      hintEl.textContent = msg;
      hintEl.style.display = msg ? '' : 'none';
    }
  }

  function focusHidden() {
    if (hiddenInput) {
      hiddenInput.focus();
      try {
        const len = hiddenInput.value.length;
        hiddenInput.setSelectionRange(len, len);
      } catch (e) {}
    }
  }

  if (pinBoxesWrap) {
    pinBoxesWrap.addEventListener('click', () => {
      focusHidden();
    });
  }

  pinBoxes.forEach((box, i) => {
    box.addEventListener('click', (e) => {
      e.stopPropagation();
      activeIndex = Math.min(i, getPinLength());
      renderBoxes();
      focusHidden();
    });
  });

  if (hiddenInput) {
    hiddenInput.setAttribute('maxlength', PIN_LENGTH);
    hiddenInput.setAttribute('inputmode', 'numeric');
    hiddenInput.setAttribute('pattern', '[0-9]*');

    hiddenInput.addEventListener('keydown', (e) => {
      if (locked) return;

      if (isDigit(e.key)) {
        e.preventDefault();
        if (getPinLength() < PIN_LENGTH) {
          digits[activeIndex] = e.key;
          activeIndex = Math.min(activeIndex + 1, PIN_LENGTH - 1);
          setError('');
          renderBoxes();
        }
        return;
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        if (digits[activeIndex] !== '') {
          digits[activeIndex] = '';
        } else if (activeIndex > 0) {
          activeIndex--;
          digits[activeIndex] = '';
        }
        setError('');
        renderBoxes();
        return;
      }

      if (e.key === 'ArrowLeft' && activeIndex > 0) {
        activeIndex--;
        renderBoxes();
        return;
      }

      if (e.key === 'ArrowRight' && activeIndex < PIN_LENGTH - 1) {
        activeIndex++;
        renderBoxes();
        return;
      }

      if (e.key === 'Enter') {
        if (getPinLength() === PIN_LENGTH) {
          handleUnlock();
        } else {
          setError('Please enter all 6 digits.');
        }
        return;
      }

      if (!/^[0-9]$/.test(e.key) && !['Tab', 'ArrowLeft', 'ArrowRight', 'Backspace', 'Delete'].includes(e.key)) {
        e.preventDefault();
      }
    });

    hiddenInput.addEventListener('input', () => {
      if (locked) return;

      const raw = hiddenInput.value.replace(/\D/g, '').slice(0, PIN_LENGTH);

      digits = Array(PIN_LENGTH).fill('');
      for (let i = 0; i < raw.length; i++) {
        digits[i] = raw[i];
      }

      activeIndex = raw.length >= PIN_LENGTH ? PIN_LENGTH - 1 : Math.max(raw.length, 0);

      hiddenInput.value = raw;

      setError('');
      renderBoxes();
    });

    hiddenInput.addEventListener('paste', (e) => {
      e.preventDefault();
      if (locked) return;
      const pasted = (e.clipboardData || window.clipboardData)
        .getData('text')
        .replace(/\D/g, '')
        .slice(0, PIN_LENGTH);

      digits = Array(PIN_LENGTH).fill('');
      for (let i = 0; i < pasted.length; i++) {
        digits[i] = pasted[i];
      }
      activeIndex = pasted.length >= PIN_LENGTH ? PIN_LENGTH - 1 : Math.max(pasted.length - 1, 0);
      setError('');
      renderBoxes();
    });
  }

  if (toggleReveal) {
    const toggleSpan = toggleReveal.querySelector('span');
    toggleReveal.addEventListener('click', () => {
      revealed = !revealed;
      if (toggleSpan) toggleSpan.textContent = revealed ? 'Hide passcode' : 'Show passcode';
      renderBoxes();
    });
  }

  async function handleUnlock() {
    if (locked) return;

    if (getPinLength() !== PIN_LENGTH) {
      setError('Please enter all 6 digits.');
      return;
    }

    const passcode = digits.join('');

    if (btnUnlock) {
      btnUnlock.disabled = true;
      btnUnlock.classList.add('loading');
    }
    setError('');

    try {
      const res = await fetch(`${API_BASE}/proposals/${proposalId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Incorrect passcode.');
      }

      sessionStorage.setItem('fy_pass', passcode);
      sessionStorage.setItem('fy_pid', proposalId);

      if (btnUnlock) btnUnlock.classList.remove('loading');

      try {
        const proposalRes = await fetch(
          `${API_BASE}/proposals/${proposalId}?passcode=${encodeURIComponent(passcode)}`
        );
        const proposalData = await proposalRes.json();

        if (proposalRes.ok && proposalData.success && proposalData.proposal) {
          const proposal = proposalData.proposal;

          const photoWrap = document.getElementById('couple-photo-wrap');
          const photoImg  = document.getElementById('couple-photo-img');
          const namesEl   = document.getElementById('unlock-names');

          if (proposal.couplePhoto && photoWrap && photoImg) {
            photoImg.src = proposal.couplePhoto;
            photoWrap.style.display = '';
            // Wait for image to load before adding .visible so the CSS transition fires
            photoImg.onload = () => photoWrap.classList.add('visible');
            // Fallback: if image is already cached or src is a data URI it may not fire onload
            if (photoImg.complete) photoWrap.classList.add('visible');
          }

          if (namesEl && proposal.senderName && proposal.recipientName) {
            namesEl.textContent = `${proposal.senderName} & ${proposal.recipientName}`;
            namesEl.style.display = '';
          }
        }
      } catch (e) {}

      // Show the success overlay AFTER the proposal fetch so photo is ready
      if (successEl) successEl.classList.add('show');

      setTimeout(() => {
        window.location.href = `memory-lane.html?id=${proposalId}`;
      }, 3000);

    } catch (err) {
      attempts++;
      if (btnUnlock) {
        btnUnlock.disabled = false;
        btnUnlock.classList.remove('loading');
      }

      if (attempts >= 5) {
        locked = true;
        setError('Too many attempts. Please try again later.');
        setHint('');
        if (btnUnlock) btnUnlock.disabled = true;
      } else {
        setError(err.message || 'Incorrect passcode. Please try again.');
        const remaining = 5 - attempts;
        setHint(`${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
        digits = Array(PIN_LENGTH).fill('');
        activeIndex = 0;
        if (hiddenInput) hiddenInput.value = '';
        renderBoxes();
        focusHidden();
      }
    }
  }

  if (btnUnlock) {
    btnUnlock.addEventListener('click', () => {
      if (getPinLength() !== PIN_LENGTH) {
        setError('Please enter all 6 digits.');
        return;
      }
      handleUnlock();
    });
  }

  renderBoxes();
  setTimeout(focusHidden, 500);

})();