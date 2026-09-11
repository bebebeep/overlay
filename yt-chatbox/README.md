# YouTube Chatbox (with style controls)

A standalone, YouTube-only chat overlay for OBS. Adjustable font size, text
stroke (width + colour), username colour (random per user, or one fixed
colour), and text shadow — all set through `setup.html`, no code editing
needed.

## Files

```
yt-chatbox/
├── index.html          ← the overlay — paste this URL into OBS
├── setup.html           ← open this to configure & preview it
├── README.md
├── assets/
│   ├── style.css          overlay look
│   └── setup.css           setup page look
└── js/
    ├── overlay-core.js     renders messages, applies username colour
    ├── youtube-connector.js  talks to the YouTube Data API
    ├── app.js               reads the URL config, starts everything
    └── setup.js             builds the URL, drives the live preview
```

## Hosting on GitHub Pages

1. Put everything in this folder at the root of a repo (or in a `docs/`
   folder if sharing a repo — then set Pages' source folder to `/docs`).
2. Settings → Pages → Source: **Deploy from a branch** → your branch → `/ (root)` (or `/docs`).
3. Your pages will be live at:
   - `https://<you>.github.io/<repo>/setup.html`
   - `https://<you>.github.io/<repo>/index.html`

Push the **whole folder at once** (drag it in, or use `git add .`) rather
than uploading files one at a time — that's the most common cause of a
broken overlay (missing `assets/`/`js/` subfolders → no styling, no script).

## Using it

1. Open `setup.html`. Enter your channel handle and a YouTube Data API key
   (get a free one at console.cloud.google.com → enable "YouTube Data API v3"
   → Credentials → Create API key).
2. Adjust font size, stroke, username colour, and shadow — the preview
   updates live.
3. Copy the generated URL into an OBS Browser Source.

Query parameters, if you want to edit the URL by hand:

| Param | Meaning | Default |
|---|---|---|
| `youtube` | channel handle, with or without `@` | — |
| `ytkey` | YouTube Data API key | — |
| `fontSize` | px | `22` |
| `strokeWidth` | px, `0` = no stroke | `0` |
| `strokeColor` | hex | `#000000` |
| `userColorMode` | `random` or `fixed` | `random` |
| `userColor` | hex, used when mode is `fixed` | `#ffffff` |
| `shadow` | `true`/`false` | `true` |
| `shadowColor` | hex | `#000000` |
| `shadowBlur` | px | `4` |
| `duration` | ms before a message fades out, `0` = never | `20000` |
| `max` | max messages kept on screen | `40` |

## Why it needs an API key, and what that means for quota

YouTube Live Chat is only accessible through the official YouTube Data API —
there's no anonymous/public way to read it (unlike Twitch). Since this is a
static site with no server, the key lives in the URL you paste into OBS.
Treat it as a low-stakes secret: restrict it to the YouTube Data API in
Google Cloud Console, and don't paste your OBS URL somewhere public.

Typical usage stays well within the free 10,000 units/day quota: finding the
live video costs 100 units once per connection (retried with growing backoff
if you're offline), and each chat poll after that costs about 5 units.

## About the earlier freeze

If typing a handle into a setup page ever froze the tab before, it was most
likely many rapid keystrokes each triggering a new API lookup or preview
reload before the last one finished. This version specifically guards
against that:
- Channel fields wait 1.2s after you stop typing before the preview reloads
  (style sliders only wait ~250ms, since those are just CSS, no network).
- Every API call has an 8-second timeout, so a stalled request can't hang
  indefinitely.
- A bad/incomplete handle or key backs off with growing delays (30s → 45s →
  ... up to 3 minutes) instead of retrying immediately in a loop.

## Not included (yet)

- Emote images / custom channel emoji.
- Message moderation or word filtering.
- Membership badges or Super Chat highlighting (the chat shows all public
  messages as plain text for now).

Happy to add any of these next.
