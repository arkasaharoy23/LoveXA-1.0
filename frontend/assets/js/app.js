

(function () {
  'use strict';

  
  const revealEls = document.querySelectorAll('.reveal, .fade-up, .stagger-children');

  if ('IntersectionObserver' in window && revealEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => observer.observe(el));
  } else {
    
    revealEls.forEach(el => el.classList.add('visible'));
  }

})();
