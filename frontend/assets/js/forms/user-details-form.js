

(function () {
  'use strict';

  const API_BASE = 'https://lovexa-1-0.onrender.com/api';

  
  const progressBar  = document.getElementById('progress-bar');
  const steps        = Array.from(document.querySelectorAll('.step'));
  const previewCard  = document.querySelector('.preview-card');

  const inputName    = document.getElementById('input-name');
  const inputFor     = document.getElementById('input-for');
  const inputMessage = document.getElementById('input-message');
  const charCount    = document.getElementById('char-count');

  const btnNext1     = document.getElementById('btn-next-1');
  const btnNext2     = document.getElementById('btn-next-2');
  const btnBack2     = document.getElementById('btn-back-2');
  const btnBack3     = document.getElementById('btn-back-3');
  const btnSubmit    = document.getElementById('btn-submit');
  const btnEdit      = document.getElementById('btn-edit');

  const previewFrom  = document.getElementById('preview-from');
  const previewTo    = document.getElementById('preview-to');
  const previewMsg   = document.getElementById('preview-msg');

  
  let currentStep = 1;
  const TOTAL     = 3;
  const MAX_CHARS = 2000;

  
  function setProgress(step) {
    if (!progressBar) return;
    progressBar.style.width = ((step / TOTAL) * 100) + '%';
    const wrap = progressBar.closest('[role="progressbar"]');
    if (wrap) wrap.setAttribute('aria-valuenow', Math.round((step / TOTAL) * 100));
  }

  
  function goTo(next) {
    const current = steps[currentStep - 1];
    if (!current) return;
    current.classList.add('fade-out');
    setTimeout(() => {
      current.classList.remove('active', 'fade-out');
      currentStep = next;
      const nextEl = steps[currentStep - 1];
      if (nextEl) {
        nextEl.classList.add('active');
        const first = nextEl.querySelector('input, textarea');
        if (first) setTimeout(() => first.focus(), 80);
      }
      setProgress(currentStep);
    }, 350);
  }

  
  function hasValue(el) { return el && el.value.trim().length > 0; }

  function refreshNext1() { if (btnNext1)  btnNext1.disabled  = !hasValue(inputName); }
  function refreshNext2() { if (btnNext2)  btnNext2.disabled  = !hasValue(inputFor); }
  function refreshSubmit(){ if (btnSubmit) btnSubmit.disabled = !hasValue(inputMessage); }

  
  function updateCharCount() {
    if (!inputMessage || !charCount) return;
    const len = inputMessage.value.length;
    charCount.textContent = len + ' / ' + MAX_CHARS;
    charCount.classList.toggle('near-limit', len > MAX_CHARS * 0.85);
    if (len > MAX_CHARS) inputMessage.value = inputMessage.value.slice(0, MAX_CHARS);
  }

  
  async function handleSubmit() {
    if (!hasValue(inputMessage)) return;

    btnSubmit.disabled = true;
    btnSubmit.querySelector('span').textContent = 'Saving…';

    const payload = {
      senderName:    inputName.value.trim(),
      recipientName: inputFor.value.trim(),
      message:       inputMessage.value.trim(),
    };

    try {
  let existingId = window.StorageService
    ? window.StorageService.getProposalId()
    : null;
  let url = `${API_BASE}/proposals`;
  let method = 'POST';
  if (existingId) {
    url = `${API_BASE}/proposals/${existingId}`;
    method = 'PATCH';
  }
  let res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload),
  });
  if (res.status === 404) {
    localStorage.clear();
    res = await fetch(`${API_BASE}/proposals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
    });
  }
  const data = await res.json();
  if (!res.ok || !data.success) {
    const msg = data.errors
      ? data.errors.join('\n')
      : (data.message || 'Something went wrong.');

    throw new Error(msg);
  }
  const proposalId = data.proposalId;
  window.StorageService.saveProposalId(proposalId);
  showPreview(payload, proposalId);

} catch (err) {
  console.error('[Form] Submit error:', err);
  alert('Could not save your proposal:\n' + err.message);
  btnSubmit.disabled = false;
  btnSubmit.querySelector('span').textContent = 'Save & Continue';
}
  }

  
  function showPreview(payload, proposalId) {
    if (previewFrom) previewFrom.textContent = payload.senderName;
    if (previewTo)   previewTo.textContent   = payload.recipientName;
    if (previewMsg)  previewMsg.textContent  = payload.message;

    const btnContinue = document.getElementById('btn-continue');
    if (btnContinue && window.StorageService && proposalId) {
      btnContinue.href = window.StorageService.withPid('upload-memories.html');
    }

    const wrapper = document.querySelector('.steps-wrapper');
    if (wrapper)     wrapper.style.display = 'none';
    if (previewCard) previewCard.classList.add('visible');
    setProgress(TOTAL);
  }

  
  function resetToEdit() {
    const wrapper = document.querySelector('.steps-wrapper');
    if (wrapper)     wrapper.style.display = '';
    if (previewCard) previewCard.classList.remove('visible');
    steps.forEach(s => s.classList.remove('active', 'fade-out'));
    currentStep = 1;
    steps[0].classList.add('active');
    setProgress(1);
    if (inputName) inputName.focus();
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.querySelector('span').textContent = 'Save & Continue';
    }
  }

  
  if (inputName) {
    inputName.addEventListener('input', refreshNext1);
    inputName.addEventListener('keydown', e => { if (e.key === 'Enter' && !btnNext1.disabled) goTo(2); });
  }
  if (btnNext1) btnNext1.addEventListener('click', () => goTo(2));

  if (inputFor) {
    inputFor.addEventListener('input', refreshNext2);
    inputFor.addEventListener('keydown', e => { if (e.key === 'Enter' && !btnNext2.disabled) goTo(3); });
  }
  if (btnNext2) btnNext2.addEventListener('click', () => goTo(3));
  if (btnBack2) btnBack2.addEventListener('click', () => goTo(1));

  if (inputMessage) {
    inputMessage.addEventListener('input', () => { updateCharCount(); refreshSubmit(); });
  }
  if (btnBack3)  btnBack3.addEventListener('click', () => goTo(2));
  if (btnSubmit) btnSubmit.addEventListener('click', handleSubmit);
  if (btnEdit)   btnEdit.addEventListener('click',  resetToEdit);

  
  setProgress(1);
  refreshNext1();
  refreshNext2();
  refreshSubmit();

})();
