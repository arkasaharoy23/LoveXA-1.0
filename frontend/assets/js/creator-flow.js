

(function () {
  'use strict';

  if (!window.StorageService) return;

  const pid = window.StorageService.getProposalId();

  const CREATOR_PAGES = [
    'create-proposal.html',
    'upload-memories.html',
    'bouquet.html',
    'bouquet-preview.html',
    'enter-passcode.html',
    'generate-link.html',
  ];

  const page = window.location.pathname.split('/').pop() || '';

  if (CREATOR_PAGES.includes(page) && !pid) {
    const params = new URLSearchParams(window.location.search);
    const isRecipientPasscode = page === 'enter-passcode.html' && params.has('id');
    const isCreatePage        = page === 'create-proposal.html';
    if (!isRecipientPasscode && !isCreatePage) {
      window.StorageService.redirectToCreate(`missing pid on ${page}`);
      return;
    }
  }

  if (!pid) return;

  document.querySelectorAll('a[href]').forEach((anchor) => {
    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto')) return;
    if (href.includes('enter-passcode.html?id=')) return;
    if (!href.endsWith('.html') && !href.includes('.html?')) return;
    anchor.setAttribute('href', window.StorageService.withPid(href));
  });

})();
