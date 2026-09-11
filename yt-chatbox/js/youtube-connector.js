// youtube-connector.js
// Resolves a handle -> channelId -> active live chat, then polls for messages.
// Needs a YouTube Data API key since this is a static site with no server to
// hide one. All calls are wrapped with a timeout so a stalled network request
// can never hang the page indefinitely.

function connectYouTubeChat(handle, apiKey, onMessage) {
  const API = 'https://www.googleapis.com/youtube/v3';
  let stopped = false;
  let pollTimer = null;
  let nextPageToken = '';
  let liveChatId = null;

  async function apiGet(path, params, timeoutMs = 8000) {
    const url = new URL(`${API}/${path}`);
    url.searchParams.set('key', apiKey);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url.toString(), { signal: controller.signal });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
      return data;
    } finally {
      clearTimeout(timer);
    }
  }

  async function resolveChannelId() {
    const clean = handle.replace(/^@/, '').trim();
    if (!clean) throw new Error('No channel handle given');
    try {
      const byHandle = await apiGet('channels', { part: 'id', forHandle: clean });
      if (byHandle.items?.length) return byHandle.items[0].id;
    } catch {
      /* fall through to legacy username lookup */
    }
    const byUsername = await apiGet('channels', { part: 'id', forUsername: clean });
    if (byUsername.items?.length) return byUsername.items[0].id;
    throw new Error(`No YouTube channel found for "${handle}"`);
  }

  async function resolveLiveChatId(channelId) {
    const search = await apiGet('search', {
      part: 'id',
      channelId,
      eventType: 'live',
      type: 'video',
    });
    if (!search.items?.length) throw new Error('Channel is not currently live');
    const videoId = search.items[0].id.videoId;

    const videos = await apiGet('videos', { part: 'liveStreamingDetails', id: videoId });
    const chatId = videos.items?.[0]?.liveStreamingDetails?.activeLiveChatId;
    if (!chatId) throw new Error('Live video has no active chat');
    return chatId;
  }

  async function pollMessages() {
    if (stopped || !liveChatId) return;
    try {
      const params = { liveChatId, part: 'snippet,authorDetails' };
      if (nextPageToken) params.pageToken = nextPageToken;
      const data = await apiGet('liveChat/messages', params);
      nextPageToken = data.nextPageToken || '';

      for (const item of data.items || []) {
        const author = item.authorDetails || {};
        const text = item.snippet?.displayMessage;
        if (!text) continue;
        onMessage({ username: author.displayName || handle, text });
      }

      // Never let the API's suggested interval go below 3s, whatever it says.
      const delay = Math.max(data.pollingIntervalMillis || 5000, 3000);
      pollTimer = setTimeout(pollMessages, delay);
    } catch (err) {
      Overlay.status(`YouTube: ${err.message}`);
      liveChatId = null;
      pollTimer = setTimeout(init, 20000);
    }
  }

  let initRetryDelay = 30000; // backs off up to a few minutes when offline/misconfigured

  async function init() {
    if (stopped) return;
    try {
      const channelId = await resolveChannelId();
      liveChatId = await resolveLiveChatId(channelId);
      nextPageToken = '';
      initRetryDelay = 30000;
      Overlay.status(`YouTube: connected to ${handle}`);
      pollMessages();
    } catch (err) {
      Overlay.status(`YouTube: ${err.message}`);
      pollTimer = setTimeout(init, initRetryDelay);
      initRetryDelay = Math.min(initRetryDelay * 1.5, 180000);
    }
  }

  if (!apiKey) {
    Overlay.status('YouTube: missing API key');
  } else {
    init();
  }

  return {
    close: () => {
      stopped = true;
      clearTimeout(pollTimer);
    },
  };
}
