

window.HeartsAnimation = (function () {
  'use strict';

  let canvas, ctx, rafId;
  let hearts    = [];
  let intensity = 0;   
  let running   = false;

  const COLORS = [
    'rgba(220, 60,  80,  VAL)',
    'rgba(240, 100, 120, VAL)',
    'rgba(201, 168, 76,  VAL)',
    'rgba(255, 150, 150, VAL)',
    'rgba(240, 80,  100, VAL)',
    'rgba(255, 200, 200, VAL)',
  ];

  
  function drawHeart(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.3);
    ctx.bezierCurveTo(
       size * 0.5, -size,
       size,        size * 0.2,
       0,           size * 0.8
    );
    ctx.bezierCurveTo(
      -size,        size * 0.2,
      -size * 0.5, -size,
       0,           -size * 0.3
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  
  class Heart {
    constructor() { this.reset(true); }

    reset(initial = false) {
      this.x       = Math.random() * canvas.width;
      this.y       = initial
                      ? canvas.height + Math.random() * canvas.height
                      : canvas.height + 20;
      this.size    = 6 + Math.random() * 18;
      this.speedY  = 0.6 + Math.random() * 1.4;
      this.speedX  = (Math.random() - 0.5) * 0.6;
      this.wobble  = Math.random() * Math.PI * 2;
      this.wobbleS = 0.015 + Math.random() * 0.02;
      this.opacity = 0.2 + Math.random() * 0.55;
      this.color   = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.rotation= (Math.random() - 0.5) * 0.4;
    }

    update() {
      this.wobble  += this.wobbleS;
      this.x       += this.speedX + Math.sin(this.wobble) * 0.7;
      this.y       -= this.speedY;
      this.opacity -= 0.0012;
      if (this.y < -40 || this.opacity <= 0) this.reset();
    }

    draw() {
      const col = this.color.replace('VAL', this.opacity.toFixed(3));
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.fillStyle = col;
      drawHeart(ctx, 0, 0, this.size);
      ctx.restore();
    }
  }

  
  function maybeSpawn() {
    
    const target = Math.floor(15 + intensity * 85);
    while (hearts.length < target) hearts.push(new Heart());
  }

  
  function resize() {
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  
  function loop() {
    if (!running) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    maybeSpawn();
    hearts.forEach(h => { h.update(); h.draw(); });
    rafId = requestAnimationFrame(loop);
  }

  
  function init(canvasEl) {
    canvas = canvasEl;
    ctx    = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize, { passive: true });
  }

  function start() {
    if (running) return;
    running = true;
    loop();
  }

  function setIntensity(val) {
    intensity = Math.max(0, Math.min(1, val));
  }

  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (running === false && hearts.length > 0) { running = true; loop(); }
  });

  return { init, start, stop, setIntensity };
})();
