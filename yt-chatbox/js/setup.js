// setup.js
(function () {
  const els = {
    youtube: document.getElementById('youtube'),
    ytkey: document.getElementById('ytkey'),
    fontSize: document.getElementById('fontSize'),
    fontSizeOut: document.getElementById('fontSize-out'),
    strokeWidth: document.getElementById('strokeWidth'),
    strokeWidthOut: document.getElementById('strokeWidth-out'),
    strokeColor: document.getElementById('strokeColor'),
    userColorMode: document.getElementById('userColorMode'),
    userColorWrap: document.getElementById('userColor-wrap'),
    userColor: document.getElementById('userColor'),
    shadow: document.getElementById('shadow'),
    shadowControls: document.getElementById('shadow-controls'),
    shadowColor: document.getElementById('shadowColor'),
    shadowBlur: document.getElementById('shadowBlur'),
    shadowBlurOut: document.getElementById('shadowBlur-out'),
    animation: document.getElementById('animation'),
    align: document.getElementById('align'),
    duration: document.getElementById('duration'),
    durationOut: document.getElementById('duration-out'),
    max: document.getElementById('max'),
    maxOut: document.getElementById('max-out'),
    outputUrl: document.getElementById('output-url'),
    copyBtn: document.getElementById('copy-btn'),
    openBtn: document.getElementById('open-btn'),
    preview: document.getElementById('preview'),
    tally: document.getElementById('tally'),
    tallyText: document.getElementById('tally-text'),
  };

  // Channel fields get a longer debounce than style fields, since a channel
  // change triggers real API calls in the preview - style changes are just CSS.
  const CHANNEL_DEBOUNCE_MS = 1200;
  const STYLE_DEBOUNCE_MS = 250;
  let debounceTimer = null;

  function buildParams() {
    const p = new URLSearchParams();
    if (els.youtube.value.trim()) p.set('youtube', els.youtube.value.trim());
    if (els.ytkey.value.trim()) p.set('ytkey', els.ytkey.value.trim());

    p.set('fontSize', els.fontSize.value);
    p.set('strokeWidth', els.strokeWidth.value);
    p.set('strokeColor', els.strokeColor.value);
    p.set('userColorMode', els.userColorMode.value);
    p.set('userColor', els.userColor.value);
    p.set('shadow', els.shadow.checked ? 'true' : 'false');
    p.set('shadowColor', els.shadowColor.value);
    p.set('shadowBlur', els.shadowBlur.value);
    p.set('animation', els.animation.value);
    p.set('align', els.align.value);
    p.set('duration', els.duration.value);
    p.set('max', els.max.value);
    return p;
  }

  function hasChannel() {
    return !!(els.youtube.value.trim() && els.ytkey.value.trim());
  }

  function updateVisibility() {
    els.userColorWrap.hidden = els.userColorMode.value !== 'fixed';
    els.shadowControls.hidden = !els.shadow.checked;
  }

  function refresh() {
    updateVisibility();
    const params = buildParams();

    const base = new URL('index.html', window.location.href);
    base.search = params.toString();
    els.outputUrl.value = base.toString();

    els.fontSizeOut.textContent = `${params.get('fontSize')}px`;
    els.strokeWidthOut.textContent = `${params.get('strokeWidth')}px`;
    els.shadowBlurOut.textContent = `${params.get('shadowBlur')}px`;
    els.durationOut.textContent = params.get('duration') === '0' ? 'never' : `${Math.round(params.get('duration') / 1000)}s`;
    els.maxOut.textContent = params.get('max') === '0' ? 'unlimited' : params.get('max');

    if (hasChannel()) {
      els.tally.classList.add('tally--live');
      els.tallyText.textContent = 'ON AIR';
    } else {
      els.tally.classList.remove('tally--live');
      els.tallyText.textContent = 'STANDBY';
    }
  }

  function refreshPreview() {
    const params = buildParams();
    if (!hasChannel()) params.set('demo', '1');
    els.preview.src = `index.html?${params.toString()}`;
  }

  function scheduleRefresh(delay) {
    refresh(); // cheap, instant - safe to run on every keystroke
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(refreshPreview, delay);
  }

  [els.youtube, els.ytkey].forEach((el) =>
    el.addEventListener('input', () => scheduleRefresh(CHANNEL_DEBOUNCE_MS))
  );

  [
    els.fontSize,
    els.strokeWidth,
    els.strokeColor,
    els.userColorMode,
    els.userColor,
    els.shadow,
    els.shadowColor,
    els.shadowBlur,
    els.animation,
    els.align,
    els.duration,
    els.max,
  ].forEach((el) => el.addEventListener('input', () => scheduleRefresh(STYLE_DEBOUNCE_MS)));

  els.copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(els.outputUrl.value);
      els.copyBtn.textContent = 'Copied';
      setTimeout(() => (els.copyBtn.textContent = 'Copy'), 1400);
    } catch {
      els.outputUrl.select();
    }
  });

  els.openBtn.addEventListener('click', () => window.open(els.outputUrl.value, '_blank'));

  refresh();
})();
