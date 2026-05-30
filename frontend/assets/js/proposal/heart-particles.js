

(function () {
  'use strict';

  const canvas = document.getElementById('petalCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  
  function resize() {
    
    
    
    const hero = canvas.closest('.hero') || canvas.parentElement;
    canvas.width  = hero ? hero.offsetWidth  : window.innerWidth;
    canvas.height = hero ? hero.offsetHeight : window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  
  const COLORS = [
    'rgba(180, 60,  60,  VAL)',
    'rgba(210, 90,  90,  VAL)',
    'rgba(201, 168, 76,  VAL)',
    'rgba(230, 130, 100, VAL)',
    'rgba(200, 80,  80,  VAL)',
  ];

  
  class Petal {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x     = Math.random() * canvas.width;
      this.y     = initial ? Math.random() * canvas.height : -20;
      this.size  = 5 + Math.random() * 9;
      this.speedY = 0.5 + Math.random() * 1.2;
      this.speedX = (Math.random() - 0.5) * 0.8;
      this.rotation   = Math.random() * Math.PI * 2;
      this.rotSpeed   = (Math.random() - 0.5) * 0.03;
      this.opacity    = 0.15 + Math.random() * 0.5;
      this.wobble     = Math.random() * Math.PI * 2;
      this.wobbleSpeed= 0.02 + Math.random() * 0.02;
      this.colorBase  = COLORS[Math.floor(Math.random() * COLORS.length)];
    }

    update() {
      this.wobble += this.wobbleSpeed;
      this.x += this.speedX + Math.sin(this.wobble) * 0.5;
      this.y += this.speedY;
      this.rotation += this.rotSpeed;

      if (this.y > canvas.height + 30) this.reset();
    }

    draw() {
      const color = this.colorBase.replace('VAL', this.opacity);
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.fillStyle = color;

      
      ctx.beginPath();
      ctx.ellipse(0, 0, this.size * 0.55, this.size, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  
  const COUNT  = window.innerWidth < 600 ? 28 : 55;
  const petals = Array.from({ length: COUNT }, () => new Petal());

  
  let rafId;

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    petals.forEach(p => { p.update(); p.draw(); });
    rafId = requestAnimationFrame(animate);
  }

  
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      animate();
    }
  });

  animate();
})();
