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
      });
    }

    if (pass2) {
      pass2.maxLength = 6;
      pass2.addEventListener('input', () => {
        pass2.value = pass2.value.replace(/\D/g, '').slice(0, 6);
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
      const p2 = pass2.value;

      if (p2.length === 0) {
        matchEl.className = 'creator-match';
        matchEl.textContent = '';
        if (pass2) pass2.classList.remove('match', 'mismatch');
        if (btnSet) btnSet.disabled = true;
        return;
      }

      if (pass1 && pass1.value.length > 0 && pass1.value.length < 6) {
        matchEl.className = 'creator-match show fail';
        matchEl.textContent = '✦ Passcode must be exactly 6 digits';
        pass2.classList.remove('match');
        pass2.classList.add('mismatch');
        if (btnSet) btnSet.disabled = true;
        return;
      }

      if (p2.length > 0 && p2.length < 6) {
        matchEl.className = 'creator-match show fail';
        matchEl.textContent = '✦ Passcode must be exactly 6 digits';
        pass2.classList.remove('match');
        pass2.classList.add('mismatch');
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

    if (pass1) pass1.addEventListener('input', updateMatch);
    if (pass2) pass2.addEventListener('input', updateMatch);

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

  function renderBoxes() {
    pinBoxes.forEach((box, i) => {
      const val = digits[i];
      if (revealed) {
        box.textContent = val || '';
      } else {
        box.textContent = val ? '•' : '';
      }
      box.classList.toggle('filled', val !== '');
      box.classList.toggle('active', i === activeIndex);
    });

    if (hiddenInput) {
      hiddenInput.value = digits.join('');
    }

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
    if (hiddenInput) hiddenInput.focus();
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
        if (getPinLength() < PIN_LENGTH) {
          digits[activeIndex] = e.key;
          activeIndex = Math.min(activeIndex + 1, PIN_LENGTH - 1);
          setError('');
        }
        e.preventDefault();
        renderBoxes();
        return;
      }

      if (e.key === 'Backspace') {
        if (digits[activeIndex] !== '') {
          digits[activeIndex] = '';
        } else if (activeIndex > 0) {
          activeIndex--;
          digits[activeIndex] = '';
        }
        setError('');
        e.preventDefault();
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

      if (!/^[0-9]$/.test(e.key) && e.key !== 'Tab') {
        e.preventDefault();
      }
    });

    hiddenInput.addEventListener('input', (e) => {
      const val = (e.target.value || '').replace(/\D/g, '').slice(0, PIN_LENGTH);
      digits = Array(PIN_LENGTH).fill('');
      for (let i = 0; i < val.length; i++) {
        digits[i] = val[i];
      }
      activeIndex = Math.min(val.length, PIN_LENGTH - 1);
      hiddenInput.value = '';
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
      activeIndex = Math.min(pasted.length, PIN_LENGTH - 1);
      setError('');
      renderBoxes();
    });
  }

  if (toggleReveal) {
    toggleReveal.addEventListener('click', () => {
      revealed = !revealed;
      toggleReveal.textContent = revealed ? '🙈' : '👁';
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
      const res = await fetch(`${API_BASE}/proposals/${proposalId}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Incorrect passcode.');
      }

      if (btnUnlock) btnUnlock.classList.remove('loading');
      if (successEl) successEl.classList.add('show');

      setTimeout(() => {
        window.location.href = `proposal.html?id=${proposalId}`;
      }, 2000);

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