// app.js
(function () {
  const params = new URLSearchParams(window.location.search);

  // --- style params -> CSS custom properties ---
  const root = document.documentElement.style;
  root.setProperty('--font-size', `${Number(params.get('fontSize')) || 22}px`);
  root.setProperty('--stroke-width', `${Number(params.get('strokeWidth')) || 0}px`);
  root.setProperty('--stroke-color', params.get('strokeColor') || '#000000');

  const shadowOn = params.get('shadow') !== 'false';
  const shadowColor = params.get('shadowColor') || '#000000';
  const shadowBlur = Number(params.get('shadowBlur')) || 4;
  root.setProperty(
    '--text-shadow',
    shadowOn ? `0 1px ${shadowBlur}px ${shadowColor}, 0 0 ${Math.round(shadowBlur / 2)}px ${shadowColor}` : 'none'
  );

  // Horizontal position of the whole chat block within the browser source.
  const alignMap = { left: 'flex-start', middle: 'center', right: 'flex-end' };
  document.body.style.justifyContent = alignMap[params.get('align')] || 'flex-start';

  const validAnimations = ['fade', 'left', 'right', 'bottom'];
  const animation = validAnimations.includes(params.get('animation')) ? params.get('animation') : 'fade';

  // --- behavior params ---
  // Defaults: messages never disappear (max=0 -> unlimited, duration=0 -> never fades).
  Overlay.init({
    maxMessages: Number(params.get('max')) || 0,
    fadeAfterMs: params.has('duration') ? Number(params.get('duration')) : 0,
    userColorMode: params.get('userColorMode') === 'fixed' ? 'fixed' : 'random',
    fixedUserColor: params.get('userColor') || '#ffffff',
    animation,
  });

  const handle = params.get('youtube');
  const apiKey = params.get('ytkey');
  const demo = params.get('demo') === '1';

  if (demo) {
    runDemo();
  } else if (handle && apiKey) {
    Overlay.status(`YouTube: connecting to ${handle}...`);
    connectYouTubeChat(handle, apiKey, Overlay.push);
  } else {
    Overlay.status('Missing channel or API key — open setup.html.');
  }

  function runDemo() {
    const samples = [
      { username: 'MorningCoffee', text: 'been waiting all week for this stream' },
      { username: 'quiet_reef', text: 'chat is way too fast today lol' },
      { username: 'pixel_pat', text: 'this angle is INSANE' },
      { username: 'ohitsjune', text: 'clip that!!' },
      { username: 'nova.exe', text: 'lets goooo' },
    ];
    let i = 0;
    const tick = () => {
      Overlay.push(samples[i % samples.length]);
      i++;
      setTimeout(tick, 1500 + Math.random() * 1200);
    };
    tick();
  }
})();
