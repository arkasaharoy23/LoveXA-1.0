

(function () {
  'use strict';

  const API_BASE = 'https://lovexa-1-0.onrender.com/api';

  const proposalId = window.StorageService
    ? window.StorageService.getProposalId()
    : null;

  if (!proposalId) {
    window.StorageService.redirectToCreate('No proposalId on generate-link');
    return;
  }

  const shareLink = window.StorageService.buildShareLink(proposalId);

  const badge           = document.getElementById('genlink-badge');
  const title           = document.getElementById('genlink-title');
  const sub             = document.getElementById('genlink-sub');
  const privacyNotice   = document.getElementById('privacy-notice');
  const privacyExpires  = document.getElementById('privacy-expires-at');
  const linkCard        = document.getElementById('link-card');
  const urlEl           = document.getElementById('link-url');
  const btnCopy         = document.getElementById('btn-copy');
  const shareRow        = document.getElementById('share-row');
  const btnWA           = document.getElementById('btn-whatsapp');
  const btnEmail        = document.getElementById('btn-email');
  const btnQR           = document.getElementById('btn-qr');
  const qrWrap          = document.getElementById('qr-wrap');
  const qrContainer     = document.getElementById('qr-container');
  const summaryCard     = document.getElementById('summary-card');
  const summaryFrom     = document.getElementById('summary-from');
  const summaryTo       = document.getElementById('summary-to');
  const summaryMsg      = document.getElementById('summary-msg');
  const summaryBouquet  = document.getElementById('summary-bouquet');
  const genFooter       = document.getElementById('genlink-footer');

  function formatExpiry(iso) {
    if (!iso) return '';
    try {
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'full',
        timeStyle: 'short',
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }

  function showExpiry(iso) {
    if (!privacyExpires || !iso) return;
    privacyExpires.textContent = `Deletes permanently after: ${formatExpiry(iso)}`;
    privacyExpires.hidden = false;
  }

  function renderBouquetSummary(bouquet) {
    if (!summaryBouquet || !bouquet) return;
    const flowers = bouquet.flowers || [];
    let html = flowers.map(f =>
      `<span class="summary-bouquet-flower" title="${f.name}">${f.emoji}</span>`
    ).join('');
    if (bouquet.ribbon) {
      html += `<span class="summary-bouquet-detail">· ${bouquet.ribbon.name} ribbon</span>`;
    }
    if (bouquet.wrapping) {
      html += `<span class="summary-bouquet-detail">· ${bouquet.wrapping.name}</span>`;
    }
    summaryBouquet.innerHTML = html || '<span style="font-size:0.75rem;color:var(--text-muted);font-style:italic;">No bouquet saved</span>';
  }

  function populateSummaryFromData(summary) {
    if (!summary) return;
    if (summaryFrom) summaryFrom.textContent = summary.senderName    || '—';
    if (summaryTo)   summaryTo.textContent   = summary.recipientName || '—';
    if (summaryMsg && summary.message) {
      const preview = summary.message.length > 120
        ? summary.message.slice(0, 120) + '…'
        : summary.message;
      summaryMsg.textContent = preview;
    }
    if (summary.bouquet) renderBouquetSummary(summary.bouquet);
    if (summary.expiresAt) {
      showExpiry(summary.expiresAt);
      if (window.StorageService) window.StorageService.saveExpiresAt(summary.expiresAt);
    }
  }

  function typeWriter(el, text, speed, onDone) {
    if (!el) return;
    let i = 0;
    el.innerHTML = '<span class="cursor"></span>';
    const cursor = el.querySelector('.cursor');

    function type() {
      if (i < text.length) {
        const charNode = document.createTextNode(text[i]);
        el.insertBefore(charNode, cursor);
        i++;
        setTimeout(type, speed + (Math.random() * 20));
      } else {
        setTimeout(() => {
          if (cursor && cursor.parentNode) cursor.remove();
          if (onDone) onDone();
        }, 400);
      }
    }

    type();
  }

  function handleCopy() {
    if (!shareLink) return;

    navigator.clipboard.writeText(shareLink).then(() => {
      if (!btnCopy) return;
      const span = btnCopy.querySelector('span');
      btnCopy.classList.add('copied-state');
      if (span) span.textContent = 'Copied ✓';
      if (linkCard) linkCard.classList.add('copied');

      setTimeout(() => {
        btnCopy.classList.remove('copied-state');
        if (span) span.textContent = 'Copy Link';
        if (linkCard) linkCard.classList.remove('copied');
      }, 2500);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = shareLink;
      ta.style.cssText = 'position:fixed;opacity:0;';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    });
  }

  if (btnCopy) btnCopy.addEventListener('click', handleCopy);

  const expiryNote = 'Note: This link expires in 24 hours — then everything is permanently deleted for your privacy.';

  if (btnWA) {
    btnWA.addEventListener('click', () => {
      const msg = encodeURIComponent(
        `I made something special for you. Open this when you're ready 💛\n\n${shareLink}\n\n${expiryNote}`
      );
      window.open(`https://wa.me/?text=${msg}`, '_blank');
    });
  }

  if (btnEmail) {
    btnEmail.addEventListener('click', () => {
      const subject = encodeURIComponent('Something I made for you…');
      const body    = encodeURIComponent(
        `I created something just for you.\n\nOpen this when the moment feels right:\n${shareLink}\n\n${expiryNote}\n\nWith love ♥`
      );
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    });
  }

  let qrGenerated = false;

  if (btnQR) {
    btnQR.addEventListener('click', () => {
      if (!qrWrap) return;
      const isVisible = qrWrap.classList.contains('visible');

      if (isVisible) {
        qrWrap.classList.remove('visible');
        btnQR.classList.remove('active');
      } else {
        qrWrap.classList.add('visible');
        btnQR.classList.add('active');
        if (!qrGenerated) generateQR();
      }
    });
  }

  function generateQR() {
    if (!qrContainer || !shareLink) return;
    qrContainer.innerHTML = '';

    if (typeof QRCode !== 'undefined') {
      new QRCode(qrContainer, {
        text:          shareLink,
        width:         180,
        height:        180,
        colorDark:     '#0a0a0a',
        colorLight:    '#f5e6c8',
        correctLevel:  QRCode.CorrectLevel.H,
      });
      qrGenerated = true;
    } else {
      qrContainer.textContent = shareLink;
      qrContainer.style.cssText = 'font-size:0.7rem;color:var(--champagne);word-break:break-all;';
    }
  }

  async function fetchSummary() {
    try {
      const res  = await fetch(`${API_BASE}/proposals/${proposalId}/summary`);
      const data = await res.json();

      if (res.status === 410) {
        alert(data.message || 'This proposal has expired.');
        window.location.href = 'create-proposal.html';
        return;
      }

      if (res.ok && data.success && data.summary) {
        populateSummaryFromData(data.summary);
        return;
      }
    } catch (err) {
      console.warn('[GenerateLink] Could not fetch summary:', err);
    }

    const cachedExpiry = window.StorageService && window.StorageService.getExpiresAt();
    if (cachedExpiry) showExpiry(cachedExpiry);

    const bouquet = window.BouquetStorage ? window.BouquetStorage.load() : null;
    if (bouquet) renderBouquetSummary(bouquet);
  }

  function runReveal() {
    setTimeout(() => { if (badge) badge.classList.add('visible'); }, 100);
    setTimeout(() => { if (title) title.classList.add('visible'); }, 200);
    setTimeout(() => { if (sub) sub.classList.add('visible'); }, 400);
    setTimeout(() => { if (privacyNotice) privacyNotice.classList.add('visible'); }, 550);
    setTimeout(() => { if (linkCard) linkCard.classList.add('visible'); }, 700);

    setTimeout(() => {
      typeWriter(urlEl, shareLink, 28, () => {
        if (btnCopy) btnCopy.style.opacity = '1';
        if (shareRow) shareRow.classList.add('visible');
      });
    }, 1000);

    setTimeout(() => { if (summaryCard) summaryCard.classList.add('visible'); }, 2400);
    setTimeout(() => { if (genFooter) genFooter.classList.add('visible'); }, 2800);
  }

  fetchSummary();
  setTimeout(runReveal, 400);

})();
