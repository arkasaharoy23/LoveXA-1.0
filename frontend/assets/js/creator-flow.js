

(function () {
  'use strict';

  if (!window.StorageService) return;

  const page = window.location.pathname.split('/').pop() || '';
  const params = new URLSearchParams(window.location.search);
  const isRecipientPage = ['memory-lane.html', 'love-reveal.html', 'final-acceptance.html', 'received-bouquet.html', 'success.html'].includes(page)
    || (page === 'enter-passcode.html' && params.has('id'));
  if (isRecipientPage) return;

  const pid = window.StorageService.getProposalId();

  const CREATOR_PAGES = [
    'create-proposal.html',
    'upload-memories.html',
    'bouquet.html',
    'bouquet-preview.html',
    'enter-passcode.html',
    'generate-link.html',
  ];

  if (CREATOR_PAGES.includes(page) && !pid) {
    const isCreatePage        = page === 'create-proposal.html';
    if (!isCreatePage) {
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
