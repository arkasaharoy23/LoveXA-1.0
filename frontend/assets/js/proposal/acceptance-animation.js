(function () {
  'use strict';

  const API_BASE = '/api';

  const params     = new URLSearchParams(window.location.search);
  const proposalId = params.get('id') || sessionStorage.getItem('fy_pid');
  const passcode   = sessionStorage.getItem('fy_pass');

  const fwCanvas    = document.getElementById('fireworksCanvas');
  const cfCanvas    = document.getElementById('confettiCanvas');
  const htCanvas    = document.getElementById('heartsCanvas');
  const glow        = document.querySelector('.success-page__glow');
  const tapOverlay  = document.getElementById('tap-to-start');
  const audio       = document.getElementById('bg-music');

  const yesText     = document.getElementById('success-yes');
  const labelEl     = document.getElementById('success-label');
  const namesEl     = document.getElementById('success-names');
  const senderEl    = document.getElementById('success-sender');
  const recipientEl = document.getElementById('success-recipient');
  const dateEl      = document.getElementById('success-date');
  const ornamentEl  = document.getElementById('success-ornament');
  const actionsEl   = document.getElementById('success-actions');
  const btnShare    = document.getElementById('btn-share-success');

  let W = window.innerWidth;
  let H = window.innerHeight;

  function resizeAll() {
    W = window.innerWidth;
    H = window.innerHeight;
    [fwCanvas, cfCanvas, htCanvas].forEach(c => {
      if (c) { c.width = W; c.height = H; }
    });
  }

  resizeAll();
  window.addEventListener('resize', resizeAll, { passive: true });

  const fwCtx = fwCanvas ? fwCanvas.getContext('2d') : null;
  const cfCtx = cfCanvas ? cfCanvas.getContext('2d') : null;
  const htCtx = htCanvas ? htCanvas.getContext('2d') : null;

  const SPARK_COLORS = [
    '#c9a84c','#e2c47a','#f5e6c8',
    '#c0392b','#e74c3c','#ff6b6b',
    '#ffffff','#ffd700','#ffaa00',
  ];

  class Spark {
    constructor(x, y, color) {
      const angle  = Math.random() * Math.PI * 2;
      const speed  = 2 + Math.random() * 6;
      this.x  = x; this.y = y;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.alpha   = 1;
      this.color   = color;
      this.size    = 1.5 + Math.random() * 2.5;
      this.gravity = 0.08 + Math.random() * 0.06;
      this.fade    = 0.012 + Math.random() * 0.016;
      this.trail   = [];
    }

    update() {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 6) this.trail.shift();
      this.vy    += this.gravity;
      this.vx    *= 0.99;
      this.x     += this.vx;
      this.y     += this.vy;
      this.alpha -= this.fade;
    }

    draw(ctx) {
      ctx.save();
      this.trail.forEach((pt, i) => {
        const a = (i / this.trail.length) * this.alpha * 0.4;
        ctx.globalAlpha = a;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, this.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle   = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    isDead() { return this.alpha <= 0; }
  }

  let sparks  = [];
  let fwTimer = null;

  function burst(x, y) {
    const color = SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)];
    const count = 60 + Math.floor(Math.random() * 40);
    for (let i = 0; i < count; i++) {
      sparks.push(new Spark(x, y, color));
    }
  }

  function scheduleFireworks() {
    setTimeout(() => burst(W * 0.5,  H * 0.35), 0);
    setTimeout(() => burst(W * 0.2,  H * 0.4),  400);
    setTimeout(() => burst(W * 0.8,  H * 0.4),  700);
    setTimeout(() => burst(W * 0.35, H * 0.25), 1100);
    setTimeout(() => burst(W * 0.65, H * 0.25), 1400);

    fwTimer = setInterval(() => {
      burst(
        W * (0.1 + Math.random() * 0.8),
        H * (0.1 + Math.random() * 0.5)
      );
    }, 1800);
  }

  function drawFireworks() {
    if (!fwCtx) return;
    fwCtx.clearRect(0, 0, W, H);
    sparks = sparks.filter(s => !s.isDead());
    sparks.forEach(s => { s.update(); s.draw(fwCtx); });
  }

  const CONFETTI_COLORS = [
    '#c9a84c','#e2c47a','#f5e6c8',
    '#c0392b','#e74c3c',
    '#ffffff','#f0ece4',
    '#ffd700','#ff69b4',
    '#9b59b6','#3498db',
  ];

  class Confetto {
    constructor() { this.reset(true); }

    reset(initial) {
      this.x      = Math.random() * W;
      this.y      = initial ? Math.random() * H * -1 : -20;
      this.w      = 6 + Math.random() * 8;
      this.h      = 3 + Math.random() * 4;
      this.color  = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      this.speedY = 1.5 + Math.random() * 3;
      this.speedX = (Math.random() - 0.5) * 2;
      this.rot    = Math.random() * Math.PI * 2;
      this.rotS   = (Math.random() - 0.5) * 0.15;
      this.wobble = Math.random() * Math.PI * 2;
      this.wobbleS= 0.03 + Math.random() * 0.03;
      this.alpha  = 0.7 + Math.random() * 0.3;
    }

    update() {
      this.wobble += this.wobbleS;
      this.x      += this.speedX + Math.sin(this.wobble) * 1.2;
      this.y      += this.speedY;
      this.rot    += this.rotS;
      if (this.y > H + 20) this.reset(false);
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle   = this.color;
      ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
      ctx.restore();
    }
  }

  const confettos = Array.from({ length: 180 }, () => new Confetto());

  function drawConfetti() {
    if (!cfCtx) return;
    cfCtx.clearRect(0, 0, W, H);
    confettos.forEach(c => { c.update(); c.draw(cfCtx); });
  }

  const HEART_COLORS = [
    'rgba(220,60,80,VAL)',
    'rgba(255,100,130,VAL)',
    'rgba(201,168,76,VAL)',
    'rgba(255,160,180,VAL)',
    'rgba(255,200,210,VAL)',
  ];

  class Heart {
    constructor() { this.reset(true); }

    reset(initial) {
      this.x       = Math.random() * W;
      this.y       = initial ? H + Math.random() * H : H + 20;
      this.size    = 8 + Math.random() * 20;
      this.speedY  = 1 + Math.random() * 2;
      this.speedX  = (Math.random() - 0.5) * 1;
      this.wobble  = Math.random() * Math.PI * 2;
      this.wobbleS = 0.02 + Math.random() * 0.025;
      this.alpha   = 0.25 + Math.random() * 0.55;
      this.color   = HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)];
      this.rot     = (Math.random() - 0.5) * 0.5;
    }

    update() {
      this.wobble += this.wobbleS;
      this.x      += this.speedX + Math.sin(this.wobble) * 0.8;
      this.y      -= this.speedY;
      this.alpha  -= 0.001;
      if (this.y < -40 || this.alpha <= 0) this.reset(false);
    }

    draw(ctx) {
      const col = this.color.replace('VAL', this.alpha.toFixed(3));
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);
      ctx.fillStyle = col;
      ctx.beginPath();
      const s = this.size;
      ctx.moveTo(0, -s * 0.3);
      ctx.bezierCurveTo( s * 0.5, -s,  s,  s * 0.2,  0,  s * 0.8);
      ctx.bezierCurveTo(-s,        s * 0.2, -s * 0.5, -s, 0, -s * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  const hearts = Array.from({ length: 60 }, () => new Heart());

  function drawHearts() {
    if (!htCtx) return;
    htCtx.clearRect(0, 0, W, H);
    hearts.forEach(h => { h.update(); h.draw(htCtx); });
  }

  let rafId;

  function loop() {
    drawFireworks();
    drawConfetti();
    drawHearts();
    rafId = requestAnimationFrame(loop);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(rafId);
    else { rafId = requestAnimationFrame(loop); }
  });

  function fadeAudioIn() {
    if (!audio) return;
    audio.volume = 0;
    const step = () => {
      audio.volume = Math.min(audio.volume + 0.015, 0.8);
      if (audio.volume < 0.8) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function playMusic() {
    if (!audio) return Promise.resolve();
    audio.loop   = true;
    audio.volume = 0;
    return audio.play();
  }

  if (tapOverlay) {
    tapOverlay.addEventListener('click', () => {
      tapOverlay.classList.add('hidden');
      playMusic().then(fadeAudioIn).catch(() => {});
    });
  }

  async function fetchNames() {
    if (!proposalId || !passcode) return null;
    try {
      const res  = await fetch(
        `${API_BASE}/proposals/${proposalId}?passcode=${encodeURIComponent(passcode)}`
      );
      const data = await res.json();
      return (res.ok && data.success) ? data.proposal : null;
    } catch { return null; }
  }

  function populateNames(proposal) {
    const sender    = proposal ? proposal.senderName    : '—';
    const recipient = proposal ? proposal.recipientName : '—';

    if (senderEl)    senderEl.textContent    = sender;
    if (recipientEl) recipientEl.textContent = recipient;

    if (dateEl) {
      const now = new Date();
      dateEl.textContent = 'Forever begins today · ' + now.toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    }

  }

  function getSharePhotoData() {
    const sender    = senderEl?.textContent?.trim()    || '';
    const recipient = recipientEl?.textContent?.trim() || '';
    const names     = sender && recipient
      ? `${sender}  ♥  ${recipient}`
      : (namesEl?.textContent?.trim() || '');

    return {
      yes:   yesText?.textContent?.trim()  || 'Yes!',
      label: labelEl?.textContent?.trim()   || 'She Said Yes',
      names,
      date:  dateEl?.textContent?.trim()   || '',
    };
  }

  function setShareState(loading) {
    if (!btnShare) return;
    const span = btnShare.querySelector('span');
    btnShare.disabled = loading;
    if (span) span.textContent = loading ? 'Creating photo…' : 'Share Moment';
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function captureSharePhoto() {
    if (!window.SharePhotoRenderer) {
      throw new Error('Share photo renderer is not available.');
    }
    return window.SharePhotoRenderer.renderSharePhoto(getSharePhotoData());
  }

  async function captureAndShare() {
    const canvas = await captureSharePhoto();
    const shareText = 'She said YES! Our forever starts today. 💛';

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Could not create image.'))), 'image/png', 1);
    });

    const file = new File([blob], 'forever-yours-yes.png', { type: 'image/png' });

    if (navigator.canShare) {
      try {
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'She Said Yes! 💛',
            text:  shareText,
            files: [file],
          });
          return;
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.warn('[Share] File share failed:', err);
      }
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'She Said Yes! 💛',
          text:  shareText,
        });
        downloadBlob(blob, 'forever-yours-yes.png');
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    downloadBlob(blob, 'forever-yours-yes.png');
    const span = btnShare?.querySelector('span');
    if (btnShare && span) {
      btnShare.classList.add('copied');
      span.textContent = 'Photo Saved ✓';
      setTimeout(() => {
        btnShare.classList.remove('copied');
        span.textContent = 'Share Moment';
      }, 2800);
    }
  }

  if (btnShare) {
    btnShare.addEventListener('click', async () => {
      setShareState(true);
      try {
        await captureAndShare();
      } catch (err) {
        console.error('[Share]', err);
        alert('Could not create your share photo. Please try again in a moment.');
      } finally {
        setShareState(false);
      }
    });
  }

  function runReveal() {
    rafId = requestAnimationFrame(loop);
    scheduleFireworks();
    if (glow) glow.classList.add('lit');

    setTimeout(() => {
      if (yesText) yesText.classList.add('burst');
    }, 1500);

    setTimeout(() => {
      if (labelEl) labelEl.classList.add('visible');
    }, 2200);

    setTimeout(() => {
      if (namesEl) namesEl.classList.add('visible');
    }, 3000);

    setTimeout(() => {
      if (dateEl) dateEl.classList.add('visible');
    }, 3800);

    setTimeout(() => {
      if (ornamentEl) ornamentEl.classList.add('visible');
    }, 4400);

    setTimeout(() => {
      if (actionsEl) actionsEl.classList.add('visible');
    }, 5000);
  }

  async function init() {
    const proposal = await fetchNames();
    populateNames(proposal);

    playMusic()
      .then(() => {
        fadeAudioIn();
        if (tapOverlay) tapOverlay.classList.add('hidden');
      })
      .catch(() => {
        if (tapOverlay) tapOverlay.classList.remove('hidden');
      });

    setTimeout(runReveal, 400);
  }

  setTimeout(init, 500);

})();
