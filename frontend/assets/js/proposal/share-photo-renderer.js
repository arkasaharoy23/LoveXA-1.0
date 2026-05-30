(function (global) {
  'use strict';

  const OUT_W = 1080;
  const OUT_H = 1920;

  function getScale() {
    const mem = navigator.deviceMemory;
    const narrow = typeof window !== 'undefined' && window.innerWidth < 520;
    if (narrow || (mem && mem < 4)) return 2;
    return 3;
  }

  const COLORS = {
    black:     '#0a0a0a',
    gold:      '#e2c47a',
    goldDim:   '#9a7a35',
    champagne: '#f5e6c8',
    heart:     '#c0392b',
    muted:     'rgba(201, 168, 76, 0.55)',
    brand:     'rgba(201, 168, 76, 0.42)',
  };

  const FONT_DISPLAY = '"Cormorant Garamond", "Times New Roman", Georgia, serif';
  const FONT_BODY    = '"Raleway", "Segoe UI", Helvetica, Arial, sans-serif';

  let fontsReady = false;

  async function ensureFonts() {
    if (fontsReady) return;
    if (!document.fonts) {
      await new Promise(r => setTimeout(r, 400));
      fontsReady = true;
      return;
    }
    const loads = [
      document.fonts.load('300 italic 320px ' + FONT_DISPLAY),
      document.fonts.load('300 72px ' + FONT_DISPLAY),
      document.fonts.load('400 32px ' + FONT_BODY),
      document.fonts.load('300 26px ' + FONT_BODY),
      document.fonts.load('300 22px ' + FONT_BODY),
    ];
    await Promise.all(loads.map(p => p.catch(() => {})));
    await document.fonts.ready;
    fontsReady = true;
  }

  function s(px, scale) {
    return px * scale;
  }

  function drawBackground(ctx, W, H) {
    ctx.fillStyle = COLORS.black;
    ctx.fillRect(0, 0, W, H);

    const cx = W * 0.5;
    const cy = H * 0.34;

    const g1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, H * 0.55);
    g1.addColorStop(0,   'rgba(201, 168, 76, 0.28)');
    g1.addColorStop(0.4, 'rgba(201, 168, 76, 0.08)');
    g1.addColorStop(1,   'rgba(10, 10, 10, 0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, H);

    const g2 = ctx.createRadialGradient(cx, H * 0.78, 0, cx, H * 0.78, H * 0.45);
    g2.addColorStop(0,   'rgba(192, 57, 43, 0.14)');
    g2.addColorStop(1,   'rgba(10, 10, 10, 0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);

    const g3 = ctx.createRadialGradient(cx, H * 0.5, H * 0.2, cx, H * 0.5, H * 0.85);
    g3.addColorStop(0,   'rgba(20, 20, 20, 0)');
    g3.addColorStop(0.7, 'rgba(5, 5, 5, 0.35)');
    g3.addColorStop(1,   'rgba(0, 0, 0, 0.65)');
    ctx.fillStyle = g3;
    ctx.fillRect(0, 0, W, H);
  }

  function drawParticles(ctx, W, H, scale) {
    const spots = [
      [0.12, 0.18, 8,  0.5],
      [0.78, 0.22, 5,  0.35],
      [0.88, 0.38, 12, 0.25],
      [0.08, 0.42, 6,  0.4],
      [0.22, 0.68, 10, 0.45],
      [0.65, 0.72, 4,  0.3],
      [0.45, 0.12, 14, 0.2],
      [0.92, 0.58, 7,  0.35],
      [0.05, 0.58, 9,  0.42],
      [0.55, 0.82, 6,  0.38],
    ];

    spots.forEach(([nx, ny, r, a]) => {
      const x = nx * W;
      const y = ny * H;
      const rad = s(r, scale);
      const grd = ctx.createRadialGradient(x, y, 0, x, y, rad);
      grd.addColorStop(0, `rgba(226, 196, 122, ${a})`);
      grd.addColorStop(1, 'rgba(226, 196, 122, 0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawLetterSpaced(ctx, text, x, y, spacingPx) {
    const chars = text.split('');
    let totalW = 0;
    chars.forEach(ch => { totalW += ctx.measureText(ch).width + spacingPx; });
    totalW -= spacingPx;
    let cx = x - totalW / 2;
    chars.forEach(ch => {
      ctx.fillText(ch, cx, y);
      cx += ctx.measureText(ch).width + spacingPx;
    });
  }

  function wrapLines(ctx, text, maxWidth) {
    const words = text.split(/\s+/);
    const lines = [];
    let line = '';
    words.forEach(word => {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    return lines;
  }

  function drawYes(ctx, W, y, scale, text) {
    const yes = (text || 'Yes!').trim() || 'Yes!';
    const size = s(200, scale);
    ctx.save();
    ctx.font = `italic ${size}px ${FONT_DISPLAY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(201, 168, 76, 0.7)';
    ctx.shadowBlur = s(56, scale);
    ctx.fillStyle = COLORS.gold;
    ctx.fillText(yes, W / 2, y);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#f5e8c4';
    ctx.fillText(yes, W / 2, y);
    ctx.restore();
  }

  function drawOrnament(ctx, W, y, scale) {
    const lineW = s(120, scale);
    const gap   = s(24, scale);
    const midX  = W / 2;

    ctx.strokeStyle = COLORS.goldDim;
    ctx.lineWidth = s(2, scale);

    const leftGrd = ctx.createLinearGradient(midX - lineW - gap, 0, midX - gap, 0);
    leftGrd.addColorStop(0, 'rgba(154, 122, 53, 0)');
    leftGrd.addColorStop(1, COLORS.goldDim);
    ctx.strokeStyle = leftGrd;
    ctx.beginPath();
    ctx.moveTo(midX - lineW - gap, y);
    ctx.lineTo(midX - gap, y);
    ctx.stroke();

    const rightGrd = ctx.createLinearGradient(midX + gap, 0, midX + lineW + gap, 0);
    rightGrd.addColorStop(0, COLORS.goldDim);
    rightGrd.addColorStop(1, 'rgba(154, 122, 53, 0)');
    ctx.strokeStyle = rightGrd;
    ctx.beginPath();
    ctx.moveTo(midX + gap, y);
    ctx.lineTo(midX + lineW + gap, y);
    ctx.stroke();

    ctx.font = `${s(36, scale)}px ${FONT_BODY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.heart;
    ctx.fillText('♥', midX, y);
  }

  function paintSharePhoto(data, scale) {
    const W = OUT_W * scale;
    const H = OUT_H * scale;
    const canvas = document.createElement('canvas');
    canvas.width  = W;
    canvas.height = H;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas is not supported.');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    drawBackground(ctx, W, H);
    drawParticles(ctx, W, H, scale);

    const labelText = (data.label || 'She Said Yes').trim().toUpperCase();
    const namesText = (data.names || '').trim();
    const dateText  = (data.date  || '').trim().toUpperCase();

    const centerY = H * 0.46;

    drawYes(ctx, W, centerY - s(200, scale), scale, data.yes);

    ctx.save();
    ctx.font = `400 ${s(28, scale)}px ${FONT_BODY}`;
    ctx.fillStyle = COLORS.goldDim;
    ctx.textBaseline = 'middle';
    drawLetterSpaced(ctx, labelText, W / 2, centerY - s(60, scale), s(12, scale));
    ctx.restore();

    ctx.font = `italic ${s(64, scale)}px ${FONT_DISPLAY}`;
    ctx.fillStyle = COLORS.champagne;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const nameLines = namesText
      ? wrapLines(ctx, namesText.replace(/\s*♥\s*/g, '  ♥  '), W - s(160, scale))
      : [];
    let nameY = centerY + s(80, scale);
    nameLines.forEach(line => {
      ctx.fillText(line, W / 2, nameY);
      nameY += s(78, scale);
    });

    if (dateText) {
      ctx.font = `300 ${s(24, scale)}px ${FONT_BODY}`;
      ctx.fillStyle = COLORS.muted;
      const dateY = nameLines.length ? nameY + s(20, scale) : centerY + s(100, scale);
      drawLetterSpaced(ctx, dateText, W / 2, dateY, s(8, scale));
    }

    drawOrnament(ctx, W, H * 0.72, scale);

    ctx.font = `300 ${s(22, scale)}px ${FONT_BODY}`;
    ctx.fillStyle = COLORS.brand;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawLetterSpaced(ctx, 'FOREVER YOURS', W / 2, H * 0.82, s(10, scale));

    return canvas;
  }

  async function renderSharePhoto(data) {
    await ensureFonts();
    const scale = getScale();
    try {
      return paintSharePhoto(data, scale);
    } catch (err) {
      if (scale > 2) return paintSharePhoto(data, 2);
      throw err;
    }
  }

  global.SharePhotoRenderer = {
    OUT_W,
    OUT_H,
    getScale,
    renderSharePhoto,
  };
})(window);
