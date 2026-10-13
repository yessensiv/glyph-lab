'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const samples = [
  { id: 'shell', name: 'Spiral study', ru: 'Спираль времени', width: 160, color: true, preset: 'sculpted' },
  { id: 'terrain', name: 'Quiet topography', ru: 'За горизонтом', width: 220, color: false, preset: 'detailed' },
  { id: 'arch', name: 'The space between', ru: 'Пространство между', width: 180, color: false, preset: 'detailed' },
  { id: 'orbit', name: 'A different orbit', ru: 'На своей орбите', width: 120, color: false, preset: 'terminal' }
];
const presets = {
  sculpted: { width: 160, style: 'detailed', color: true, contrast: 115 },
  minimal: { width: 80, style: 'simple', color: false, contrast: 135 },
  detailed: { width: 220, style: 'detailed', color: false, contrast: 120 },
  blocks: { width: 100, style: 'blocks', color: false, contrast: 115 },
  readme: { width: 80, style: 'simple', color: false, contrast: 140 },
  terminal: { width: 100, style: 'dense', color: false, contrast: 125 },
  editorial: { width: 240, style: 'detailed', color: true, contrast: 110 },
  chat: { width: 56, style: 'dense', color: false, contrast: 135 }
};
const ramps = {
  simple: ' .:-=+*#%@',
  dense: ' .,:;irsXA253hMHGS#9B&@',
  detailed: ' .\'`^",:;Il!i~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$',
  blocks: ' ░▒▓█',
  binary: ' 01'
};
const cache = new Map();
let lang = 'en';
let currentSample = 0;
let currentImage;
let currentName = 'Spiral study';
let currentOutput;
let currentPreset = 'sculpted';
let sourceToken = 0;
let frameQueued = false;
let slideshow;
let toastTimer;
let fileInfo = { sample: true, name: 'spiral-study.webp' };
const englishNodes = $$('[data-ru]').map(element => ({ element, html: element.innerHTML }));

function localized(en, ru) { return lang === 'ru' ? ru : en; }
function toast(en, ru = en) {
  const element = $('#toast');
  element.textContent = localized(en, ru);
  element.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('visible'), 3200);
}

function loadImage(src) {
  if (!cache.has(src)) {
    cache.set(src, new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => { cache.delete(src); reject(new Error('Image could not be decoded')); };
      image.src = src;
    }));
  }
  return cache.get(src);
}

// Sample each cell's luminance, correcting for the tall shape of a text cell.
// The same output drives the live preview, copy action, and all three exports.
function convert(image, settings) {
  const width = settings.width;
  const height = Math.max(1, Math.round(image.height / image.width * width * settings.aspect));
  const sampling = document.createElement('canvas');
  sampling.width = width;
  sampling.height = height;
  const ctx = sampling.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#0a0a0b';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(image, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height).data;
  const ramp = ramps[settings.style];
  const rows = [];
  const colors = [];
  let errorRow = new Float32Array(width + 2);
  for (let y = 0; y < height; y++) {
    const nextError = new Float32Array(width + 2);
    let row = '';
    const colorRow = [];
    for (let x = 0; x < width; x++) {
      const p = (y * width + x) * 4;
      let brightness = (.2126 * data[p] + .7152 * data[p + 1] + .0722 * data[p + 2]);
      brightness = (brightness - 128) * settings.contrast + 128 + settings.brightness;
      if (settings.invert) brightness = 255 - brightness;
      if (settings.dither) brightness += errorRow[x + 1];
      brightness = Math.max(0, Math.min(255, brightness));
      const index = Math.round(brightness / 255 * (ramp.length - 1));
      row += ramp[index];
      if (settings.color) colorRow.push([data[p], data[p + 1], data[p + 2]]);
      if (settings.dither) {
        const error = brightness - index / (ramp.length - 1) * 255;
        errorRow[x + 2] += error * 7 / 16;
        nextError[x] += error * 3 / 16;
        nextError[x + 1] += error * 5 / 16;
        nextError[x + 2] += error / 16;
      }
    }
    rows.push(row);
    if (settings.color) colors.push(colorRow);
    errorRow = nextError;
  }
  return { rows, colors, width, height, aspect: settings.aspect, color: settings.color, style: settings.style };
}

function drawASCII(canvas, output) {
  const ctx = canvas.getContext('2d');
  const fontSize = 12;
  ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
  const cellWidth = ctx.measureText('M').width;
  const cellHeight = cellWidth / output.aspect;
  canvas.width = Math.ceil(output.width * cellWidth);
  canvas.height = Math.ceil(output.height * cellHeight);
  ctx.fillStyle = '#0a0a0b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
  ctx.textBaseline = 'middle';
  if (!output.color) {
    ctx.fillStyle = '#d4d4da';
    output.rows.forEach((row, y) => ctx.fillText(row, 0, (y + .5) * cellHeight));
  } else {
    output.rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        if (row[x] === ' ') continue;
        const [r, g, b] = output.colors[y][x];
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillText(row[x], x * cellWidth, (y + .5) * cellHeight);
      }
    });
  }
}

function getSettings() {
  return { width: Number($('#width').value), style: $('#style').value, color: $('#color').checked,
    invert: $('#invert').checked, brightness: Number($('#brightness').value),
    contrast: Number($('#contrast').value) / 100, aspect: Number($('#aspect').value) / 100,
    dither: $('#dither').checked };
}

function updateOutput() {
  frameQueued = false;
  if (!currentImage) return;
  const settings = getSettings();
  currentOutput = convert(currentImage, settings);
  drawASCII($('#preview-canvas'), currentOutput);
  $('#width-value').textContent = `${settings.width} ${localized('columns', 'столбцов')}`;
  $('#brightness-value').textContent = settings.brightness;
  $('#contrast-value').textContent = settings.contrast.toFixed(2);
  $('#aspect-value').textContent = settings.aspect.toFixed(2);
  $('#output-spec').textContent = `${currentOutput.width} × ${currentOutput.height} chars`;
  $('#expanded-spec').textContent = `${currentOutput.width} × ${currentOutput.height} / ${settings.color ? 'color' : 'mono'} / ${settings.style}`;
  if ($('#expanded-preview').open) drawASCII($('#expanded-canvas'), currentOutput);
  for (const input of $$('input[type="range"]:not(.compare-range)')) {
    input.style.setProperty('--range-progress', `${(input.value - input.min) / (input.max - input.min) * 100}%`);
  }
}

function scheduleUpdate() {
  if (!frameQueued) { frameQueued = true; requestAnimationFrame(updateOutput); }
}

function highlightPreset() {
  for (const button of $$('#presets button')) {
    const active = button.dataset.preset === currentPreset;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  }
}

function applyPreset(name) {
  const preset = presets[name];
  if (!preset) return;
  currentPreset = name;
  $('#width').value = preset.width;
  $('#style').value = preset.style;
  $('#color').checked = preset.color;
  $('#contrast').value = preset.contrast;
  $('#brightness').value = 0;
  $('#aspect').value = 50;
  $('#invert').checked = false;
  $('#dither').checked = false;
  highlightPreset();
  updateOutput();
}

function scrollToStudio() {
  const studio = $('#studio');
  window.scrollTo({ top: studio.getBoundingClientRect().top + window.scrollY - 24, behavior: 'instant' });
}

function setStatus() {
  $('#file-status').textContent = fileInfo.sample
    ? localized(`> SAMPLE LOADED / ${fileInfo.name} / processed locally`, `> ОБРАЗЕЦ ЗАГРУЖЕН / ${fileInfo.name} / обработан локально`)
    : localized(`> YOUR FILE / ${fileInfo.name} / ${fileInfo.width} × ${fileInfo.height}px / stays on this device`, `> ВАШ ФАЙЛ / ${fileInfo.name} / ${fileInfo.width} × ${fileInfo.height}px / остаётся на устройстве`);
  const sample = samples[currentSample];
  $('#art-caption').textContent = fileInfo.sample
    ? `${String(currentSample + 1).padStart(2, '0')} / ${lang === 'ru' ? sample.ru : sample.name}`
    : `01 / ${currentName}`;
}

async function selectSample(id, recipe, scroll = false) {
  const token = ++sourceToken;
  const index = samples.findIndex(sample => sample.id === id);
  if (index < 0) return;
  const sample = samples[index];
  try {
    const image = await loadImage(`assets/${id}.webp`);
    if (token !== sourceToken) return;
    currentSample = index;
    currentImage = image;
    currentName = sample.name;
    fileInfo = { sample: true, name: `${id}-study.webp` };
    $('#studio-original').src = image.src;
    $('#studio-original').alt = `${sample.name} original image`;
    applyPreset(recipe || sample.preset);
    if (!recipe) { $('#width').value = sample.width; $('#color').checked = sample.color; updateOutput(); }
    setStatus();
    if (scroll) scrollToStudio();
  } catch {
    toast('This sample could not load. Please choose a local file.', 'Не удалось загрузить образец. Выберите локальный файл.');
  }
}

function stopSlideshow() {
  clearInterval(slideshow);
  slideshow = undefined;
  $('#play').textContent = '▷';
  $('#play').setAttribute('aria-pressed', 'false');
  $('#play').setAttribute('aria-label', 'Play sample slideshow');
}

async function importFile(file) {
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
    toast('Choose a JPG, PNG, WebP, or GIF image.', 'Выберите изображение JPG, PNG, WebP или GIF.');
    return;
  }
  if (file.size > 30 * 1024 * 1024) {
    toast('Please choose an image smaller than 30 MB.', 'Выберите изображение меньше 30 МБ.');
    return;
  }
  stopSlideshow();
  const token = ++sourceToken;
  $('#file-status').textContent = localized('> READING YOUR IMAGE / on this device…', '> ЧТЕНИЕ ИЗОБРАЖЕНИЯ / на этом устройстве…');
  let bitmap;
  try {
    // ImageBitmap decodes the default (first) GIF frame rather than animating it.
    bitmap = await createImageBitmap(file);
    if (token !== sourceToken) return;
    const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
    const snapshot = document.createElement('canvas');
    snapshot.width = Math.max(1, Math.round(bitmap.width * scale));
    snapshot.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = snapshot.getContext('2d');
    ctx.fillStyle = '#0a0a0b';
    ctx.fillRect(0, 0, snapshot.width, snapshot.height);
    ctx.drawImage(bitmap, 0, 0, snapshot.width, snapshot.height);
    currentImage = snapshot;
    currentName = file.name;
    fileInfo = { sample: false, name: file.name, width: bitmap.width, height: bitmap.height };
    $('#studio-original').src = snapshot.toDataURL('image/png');
    $('#studio-original').alt = `Your image: ${file.name}`;
    updateOutput();
    setStatus();
    scrollToStudio();
    toast('Image loaded. Make it yours.', 'Изображение загружено. Настройте его под себя.');
  } catch {
    setStatus();
    toast('The image could not be decoded. Try a different file.', 'Не удалось прочитать изображение. Попробуйте другой файл.');
  } finally {
    bitmap?.close();
    $('#file-input').value = '';
  }
}

async function copyText() {
  if (!currentOutput) return;
  const text = currentOutput.rows.join('\n');
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const field = document.createElement('textarea');
    field.value = text;
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.append(field);
    field.select();
    const success = document.execCommand('copy');
    field.remove();
    if (!success) {
      toast('Clipboard access is unavailable. Download TXT instead.', 'Буфер обмена недоступен. Скачайте TXT.');
      return;
    }
  }
  toast('ASCII copied. Keep it in a monospace font.', 'ASCII скопирован. Используйте моноширинный шрифт.');
}

function escapeXML(text) {
  return text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]));
}

function svgExport(output) {
  const measuring = document.createElement('canvas').getContext('2d');
  measuring.font = '12px "JetBrains Mono", monospace';
  const cellWidth = measuring.measureText('M').width;
  const cellHeight = cellWidth / output.aspect;
  const w = Math.ceil(output.width * cellWidth);
  const h = Math.ceil(output.height * cellHeight);
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><title>GLYPH LAB ASCII artwork</title><rect width="100%" height="100%" fill="#0a0a0b"/><g font-family="JetBrains Mono,monospace" font-size="12" xml:space="preserve">`;
  output.rows.forEach((row, y) => {
    const baseline = (y + .5) * cellHeight;
    if (!output.color) {
      svg += `<text x="0" y="${baseline}" dominant-baseline="central" fill="#d4d4da" textLength="${output.width * cellWidth}" lengthAdjust="spacing">${escapeXML(row)}</text>`;
    } else {
      for (let x = 0; x < row.length; x++) {
        if (row[x] === ' ') continue;
        const [r, g, b] = output.colors[y][x];
        svg += `<text x="${x * cellWidth}" y="${baseline}" dominant-baseline="central" fill="rgb(${r},${g},${b})">${escapeXML(row[x])}</text>`;
      }
    }
  });
  return svg + '</g></svg>';
}

function downloadBlob(blob, extension) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = currentName.replace(/\.[^.]+$/, '').replace(/[^a-zа-яё0-9_-]+/gi, '-').slice(0, 60) || 'artwork';
  link.download = `${safeName}-ascii.${extension}`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  toast(`${extension.toUpperCase()} exported.`, `${extension.toUpperCase()} сохранён.`);
}

function exportFile(format) {
  if (!currentOutput) return;
  if (format === 'txt') downloadBlob(new Blob([currentOutput.rows.join('\n')], { type: 'text/plain;charset=utf-8' }), 'txt');
  if (format === 'svg') downloadBlob(new Blob([svgExport(currentOutput)], { type: 'image/svg+xml' }), 'svg');
  if (format === 'png') {
    const canvas = document.createElement('canvas');
    drawASCII(canvas, currentOutput);
    canvas.toBlob(blob => {
      if (blob) downloadBlob(blob, 'png');
      else toast('PNG export failed. Try SVG instead.', 'Не удалось сохранить PNG. Попробуйте SVG.');
    }, 'image/png');
  }
}

function initializeCompare(element) {
  const range = $('.compare-range', element);
  range.value = element.dataset.start || 50;
  const update = () => element.style.setProperty('--split', `${range.value}%`);
  range.addEventListener('input', update);
  update();
}

function renderTextOutput(element, output) {
  const pre = $('pre', element);
  if (!output.color) { pre.textContent = output.rows.join('\n'); }
  else {
    const fragment = document.createDocumentFragment();
    output.rows.forEach((row, y) => {
      let buffer = '';
      let lastColor = '';
      function flush() {
        if (!buffer) return;
        const span = document.createElement('span');
        span.style.color = lastColor;
        span.textContent = buffer;
        fragment.append(span);
        buffer = '';
      }
      for (let x = 0; x < row.length; x++) {
        const [r, g, b] = output.colors[y][x].map(value => Math.round(value / 24) * 24);
        const color = `rgb(${r},${g},${b})`;
        if (color !== lastColor) { flush(); lastColor = color; }
        buffer += row[x];
      }
      flush();
      fragment.append(document.createTextNode('\n'));
    });
    pre.replaceChildren(fragment);
  }
  const resize = () => {
    const size = Math.min((element.clientWidth - 36) / (output.width * .61), (element.clientHeight - 60) / (output.height * (1 / output.aspect) * .61));
    pre.style.fontSize = `${size}px`;
    pre.style.lineHeight = `${.61 / output.aspect}`;
  };
  new ResizeObserver(resize).observe(element);
  resize();
}

async function initializeArtwork() {
  for (const element of $$('.compare')) initializeCompare(element);
  const defaults = { style: 'detailed', brightness: 0, contrast: 1.15, aspect: .5, invert: false, dither: false };
  const tasks = $$('[data-art], [data-output]').map(async element => {
    const id = element.dataset.art || element.dataset.output;
    try {
      const image = await loadImage(`assets/${id}.webp`);
      const output = convert(image, { ...defaults, width: Number(element.dataset.width), color: element.dataset.color === 'true' });
      if (element.dataset.output) renderTextOutput(element, output);
      else drawASCII($('canvas', element), output);
    } catch { /* A user upload remains available if a bundled demo fails. */ }
  });
  await Promise.allSettled(tasks);
}

function changeLanguage(value) {
  lang = value;
  document.documentElement.lang = value;
  for (const { element, html } of englishNodes) element.innerHTML = value === 'ru' ? element.dataset.ru : html;
  for (const button of $$('[data-lang]')) {
    button.classList.toggle('active', button.dataset.lang === value);
    button.setAttribute('aria-pressed', String(button.dataset.lang === value));
  }
  const labels = value === 'ru'
    ? ['Подробный / $@B%8&WM#*', 'Простой / .:-=+*#%@', 'Плотный / .,:;ox%#@', 'Блоки / ░▒▓█', 'Двоичный / 01']
    : ['Detailed / $@B%8&WM#*', 'Simple / .:-=+*#%@', 'Dense / .,:;ox%#@', 'Blocks / ░▒▓█', 'Binary / 01'];
  $$('#style option').forEach((option, index) => option.textContent = labels[index]);
  setStatus();
  updateOutput();
  try { localStorage.setItem('glyph-lab-language', value); } catch { /* Storage is optional. */ }
}

// Bind stable controls once; language changes replace only their inner copy.
for (const button of $$('[data-upload]')) button.addEventListener('click', () => $('#file-input').click());
$('#file-input').addEventListener('change', event => importFile(event.target.files[0]));
for (const button of $$('[data-load]')) button.addEventListener('click', () => { stopSlideshow(); selectSample(button.dataset.load, button.dataset.recipe, true); });
for (const button of $$('#presets button')) button.addEventListener('click', () => applyPreset(button.dataset.preset));
for (const button of $$('[data-preset-link]')) button.addEventListener('click', () => { applyPreset(button.dataset.presetLink); scrollToStudio(); });
for (const input of $$('.controls input, .controls select, .advanced input')) {
  input.addEventListener('input', () => { currentPreset = ''; highlightPreset(); scheduleUpdate(); });
}
$('#reset').addEventListener('click', () => { applyPreset('sculpted'); toast('Settings reset. Your image stays.', 'Настройки сброшены. Изображение сохранено.'); });
$('#copy').addEventListener('click', copyText);
$('#expanded-copy').addEventListener('click', copyText);
for (const button of $$('[data-export]')) button.addEventListener('click', () => exportFile(button.dataset.export));
$('#previous').addEventListener('click', () => { stopSlideshow(); selectSample(samples[(currentSample + samples.length - 1) % samples.length].id); });
$('#next').addEventListener('click', () => { stopSlideshow(); selectSample(samples[(currentSample + 1) % samples.length].id); });
$('#play').addEventListener('click', () => {
  if (slideshow) { stopSlideshow(); return; }
  $('#play').textContent = 'Ⅱ';
  $('#play').setAttribute('aria-pressed', 'true');
  $('#play').setAttribute('aria-label', 'Pause sample slideshow');
  slideshow = setInterval(() => selectSample(samples[(currentSample + 1) % samples.length].id), 5000);
});
document.addEventListener('visibilitychange', () => { if (document.hidden) stopSlideshow(); });
$('#use-style').addEventListener('click', () => {
  const sample = samples[currentSample];
  applyPreset(sample.preset);
  $('#width').value = sample.width;
  $('#color').checked = sample.color;
  updateOutput();
  toast('Sample settings applied to your current image.', 'Настройки образца применены к вашему изображению.');
});
$('#expand').addEventListener('click', () => {
  if (!currentOutput) return;
  drawASCII($('#expanded-canvas'), currentOutput);
  $('#expanded-preview').showModal();
});
$('#close-preview').addEventListener('click', () => $('#expanded-preview').close());
$('#expanded-preview').addEventListener('click', event => { if (event.target === $('#expanded-preview')) $('#expanded-preview').close(); });
for (const button of $$('[data-lang]')) button.addEventListener('click', () => changeLanguage(button.dataset.lang));

const dropzone = $('#dropzone');
for (const name of ['dragenter', 'dragover']) dropzone.addEventListener(name, event => { event.preventDefault(); dropzone.classList.add('dragging'); });
dropzone.addEventListener('dragleave', event => { if (!dropzone.contains(event.relatedTarget)) dropzone.classList.remove('dragging'); });
dropzone.addEventListener('drop', event => { event.preventDefault(); dropzone.classList.remove('dragging'); importFile(event.dataTransfer.files[0]); });
// Keep a dropped image outside the upload panel from navigating away from the app.
document.addEventListener('dragover', event => { if (event.dataTransfer.types.includes('Files')) event.preventDefault(); });
document.addEventListener('drop', event => { if (event.dataTransfer.types.includes('Files')) event.preventDefault(); });
document.addEventListener('paste', event => {
  const file = [...(event.clipboardData?.items || [])].find(item => item.type.startsWith('image/'))?.getAsFile();
  if (file) { event.preventDefault(); importFile(file); }
});

async function initialize() {
  await document.fonts.ready;
  let preferredLanguage;
  try { preferredLanguage = localStorage.getItem('glyph-lab-language'); } catch { /* No persistence required. */ }
  if (preferredLanguage === 'ru') changeLanguage('ru');
  await Promise.all([initializeArtwork(), selectSample('shell')]);
}
initialize();
