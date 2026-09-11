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
    if (!row || !row.parentNode || row.dataset.removing) return;
    row.dataset.removing = 'true';
    row.classList.add('msg--out');
    row.addEventListener('transitionend', () => row.remove(), { once: true });
    // Safety net: if transitionend never fires for any reason (e.g. the
    // prefers-reduced-motion media query disables the transition entirely),
    // force removal anyway so the element can't linger in the DOM forever.
    setTimeout(() => row.remove(), 400);
  }

  function trimOldMessages() {
    // IMPORTANT: state.container.children is a *live* collection, and
    // removeMessage() doesn't remove the element immediately - it waits for
    // the fade-out transition to finish. A while-loop re-checking
    // rows.length here would spin forever re-targeting the same
    // not-yet-removed element the instant the count goes over the limit -
    // that was the cause of the freeze. Snapshotting the list up front and
    // removing a fixed number of elements avoids that entirely.
    const rows = Array.from(state.container.children);
    const excess = rows.length - state.maxMessages;
    for (let i = 0; i < excess; i++) {
      removeMessage(rows[i]);
    }
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

    // "Connected" messages are good news - fade them after a few seconds.
    // Anything else (waiting, retrying, errors) stays on screen until the
    // next status update, so a stuck connection is always visible instead
    // of silently disappearing and looking like nothing is happening.
    if (/connected/i.test(text)) {
      status._t = setTimeout(() => el.classList.remove('visible'), 4000);
    }
  }

  return { init, push, status };
})();
