(() => {
  'use strict';
  const svg = document.querySelector('#hero-title svg');
  const fallback = svg?.querySelector('rect');
  const toggle = document.querySelector('#toggle-title-motion');
  if (!svg || !fallback || !toggle) return;

  // Keep the existing letter mask and animate only the characters inside it.
  // A static SVG remains visible when scripts or animation are unavailable.
  const ns = 'http://www.w3.org/2000/svg';
  const texture = document.createElementNS(ns, 'g');
  texture.setAttribute('mask', 'url(#title-mask)');
  texture.setAttribute('fill', '#ededef');
  texture.setAttribute('font-family', 'monospace');
  texture.setAttribute('font-size', '5');
  texture.setAttribute('aria-hidden', 'true');
  texture.style.display = 'none';
  const columns = 180;
  const rowCount = 30;
  const rows = [];
  for (let y = 0; y < rowCount; y++) {
    const row = document.createElementNS(ns, 'text');
    row.setAttribute('x', '0');
    row.setAttribute('y', String(y * 5 + 4.5));
    row.setAttribute('textLength', '585');
    row.setAttribute('lengthAdjust', 'spacingAndGlyphs');
    texture.append(row);
    rows.push(row);
  }
  svg.append(texture);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = true;
  let paused = false;
  let frame = 0;
  let lastPaint = 0;
  let phase = 0;
  let lastTick = 0;
  const glyphs = '#%@MW&8XO+=*';

  function paint(time) {
    for (let y = 0; y < rowCount; y++) {
      let line = '';
      for (let x = 0; x < columns; x++) {
        const wave = Math.sin(x * .105 - time * 1.15 + y * .17);
        const ripple = Math.sin(y * .42 + x * .055 + time * .7);
        // A dense base keeps the word readable; a diagonal ribbon changes its texture.
        const index = Math.floor((wave * .5 + .5) * 6 + (ripple * .5 + .5) * 4);
        line += glyphs[index];
      }
      rows[y].textContent = line;
      rows[y].setAttribute('opacity', String(.78 + .22 * (Math.sin(y * .2 - time) * .5 + .5)));
    }
  }

  function tick(now) {
    frame = 0;
    if (lastTick) phase += Math.min(now - lastTick, 120) / 1000;
    lastTick = now;
    if (now - lastPaint >= 83) {
      paint(phase);
      lastPaint = now;
    }
    frame = requestAnimationFrame(tick);
  }

  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTick = 0;
    const enabled = !reduced.matches;
    toggle.hidden = !enabled;
    fallback.style.display = enabled ? 'none' : '';
    texture.style.display = enabled ? '' : 'none';
    toggle.textContent = paused ? '▷' : 'Ⅱ';
    toggle.setAttribute('aria-pressed', String(paused));
    const ru = document.documentElement.lang === 'ru';
    toggle.setAttribute('aria-label', paused
      ? (ru ? 'Продолжить анимацию заголовка' : 'Resume title animation')
      : (ru ? 'Приостановить анимацию заголовка' : 'Pause title animation'));
    toggle.title = toggle.getAttribute('aria-label');
    if (enabled && visible && !paused && !document.hidden) frame = requestAnimationFrame(tick);
  }

  toggle.addEventListener('click', () => { paused = !paused; sync(); });
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { rootMargin: '60px' }).observe(svg);
  paint(0);
  sync();
})();
