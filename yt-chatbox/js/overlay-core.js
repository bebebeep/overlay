// overlay-core.js
const Overlay = (() => {
  const state = {
    container: null,
    maxMessages: 40,
    fadeAfterMs: 20000,
    userColorMode: 'random', // 'random' | 'fixed'
    fixedUserColor: '#ffffff',
  };

  function init(opts = {}) {
    Object.assign(state, opts);
    state.container = document.getElementById('chat-feed');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function colorForUser(username) {
    if (state.userColorMode === 'fixed') return state.fixedUserColor;
    let hash = 0;
    for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 68%)`;
  }

  function push({ username, text }) {
    if (!state.container) return;

    const row = document.createElement('div');
    row.className = 'msg';
    row.style.setProperty('--user-color', colorForUser(username));

    row.innerHTML = `<span class="msg__user">${escapeHtml(username)}</span><span class="msg__sep">:</span><span class="msg__text">${escapeHtml(text)}</span>`;

    state.container.appendChild(row);
    requestAnimationFrame(() => row.classList.add('msg--in'));

    trimOldMessages();

    if (state.fadeAfterMs > 0) {
      setTimeout(() => removeMessage(row), state.fadeAfterMs);
    }
  }

  function removeMessage(row) {
    if (!row || !row.parentNode) return;
    row.classList.add('msg--out');
    row.addEventListener('transitionend', () => row.remove(), { once: true });
  }

  function trimOldMessages() {
    const rows = state.container.children;
    while (rows.length > state.maxMessages) removeMessage(rows[0]);
  }

  function status(text) {
    let el = document.getElementById('status-line');
    if (!el) {
      el = document.createElement('div');
      el.id = 'status-line';
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.classList.add('visible');
    clearTimeout(status._t);
    status._t = setTimeout(() => el.classList.remove('visible'), 4000);
  }

  return { init, push, status };
})();
