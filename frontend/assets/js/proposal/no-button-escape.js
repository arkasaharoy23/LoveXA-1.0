window.NoButtonEscape = (function () {
  'use strict';

  let attempts  = 0;
  const MAX_ATTEMPTS = 3;

  function init(btnNo) {
    if (!btnNo) return;

    btnNo.addEventListener('mouseenter', () => escape(btnNo));
    btnNo.addEventListener('click',      (e) => {
      e.preventDefault();
      e.stopPropagation();
      attempts++;
      if (attempts >= MAX_ATTEMPTS) {
        btnNo.style.transition = 'opacity 0.5s, transform 0.5s';
        btnNo.style.opacity    = '0';
        btnNo.style.transform  = 'scale(0)';
        setTimeout(() => btnNo.remove(), 600);
        return;
      }
      escape(btnNo, true);
    });
  }

  function escape(btn, forceMove) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rect = btn.getBoundingClientRect();

    
    let x, y;
    const zones = [
      { xMin: 0.05, xMax: 0.25, yMin: 0.1,  yMax: 0.4  },
      { xMin: 0.7,  xMax: 0.9,  yMin: 0.1,  yMax: 0.4  },
      { xMin: 0.05, xMax: 0.25, yMin: 0.6,  yMax: 0.9  },
      { xMin: 0.7,  xMax: 0.9,  yMin: 0.6,  yMax: 0.9  },
      { xMin: 0.3,  xMax: 0.65, yMin: 0.75, yMax: 0.92 },
    ];

    const zone = zones[Math.floor(Math.random() * zones.length)];
    x = vw * (zone.xMin + Math.random() * (zone.xMax - zone.xMin));
    y = vh * (zone.yMin + Math.random() * (zone.yMax - zone.yMin));

    
    btn.style.position   = 'fixed';
    btn.style.transition = 'left 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94), top 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    btn.style.left       = `${x}px`;
    btn.style.top        = `${y}px`;
    btn.style.bottom     = 'auto';
    btn.style.right      = 'auto';
    btn.style.zIndex     = '200';
  }

  return { init };
})();
