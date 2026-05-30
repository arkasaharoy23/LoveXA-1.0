

(function () {
  'use strict';

  const loader = document.querySelector('.page-loader');
  if (!loader) return;

  function hideLoader() {
    loader.classList.add('hidden');
    
    loader.addEventListener('transitionend', () => loader.remove(), { once: true });
  }

  if (document.readyState === 'complete') {
    setTimeout(hideLoader, 300);
  } else {
    window.addEventListener('load', () => setTimeout(hideLoader, 350));
  }
})();
