# AI English Mentor 🤖🗣️

[![CI](https://github.com/albadrov-del/ai-english-mentor/actions/workflows/ci.yml/badge.svg)](https://github.com/albadrov-del/ai-english-mentor/actions/workflows/ci.yml)

A voice-based English conversation-practice **Progressive Web App (PWA)**: you talk to a
Claude-powered tutor out loud, a simple animated robot avatar moves while it speaks, and the
conversation adapts to your CEFR level (A1–C1) and personal interests.

Built in public as a portfolio project — see [`PROGRESS.md`](PROGRESS.md) for the task-by-task
history, [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the design decisions, and
[`specifikacija.md`](specifikacija.md) for the original specification (Croatian).

## Features
- 🎙️ **Voice conversation** — speak into the mic (speech → text), the tutor replies aloud (text → speech), via the Web Speech API.
- 🎚️ **Level-adaptive** — choose A1–C1; vocabulary, sentence length, and pace adjust per band.
- 👤 **Profiles** — multiple local profiles (name, level, interests) tailor the topics; stored on your device.
- 🤖 **Animated robot** — an SVG/CSS avatar that animates only while the tutor is speaking.
- 🧠 **Real AI** — Claude (`claude-haiku-4-5-20251001`) via a secure backend proxy.
- 📝 **Session summary** — end a session for an encouraging recap (what went well + 2–3 things to practice).
- 📱 **Installable PWA** — Add to Home Screen, runs full-screen, with an offline app shell.

## Tech stack
- **Frontend:** mobile-first HTML / CSS / vanilla JavaScript (ES modules) — no framework.
- **Backend:** a small Node/Express server that serves the app **and** proxies the Anthropic API,
  keeping the API key server-side — it is **never** shipped to the browser.
- **Voice:** Web Speech API (`SpeechRecognition` + `SpeechSynthesis`).
- **Tests:** Jest (unit) + Supertest (API) + Playwright (E2E), run on GitHub Actions.

## Run locally
Prerequisites: **Node.js 18+** (CI uses 22) and npm, plus an **Anthropic API key**.

```bash
npm install
cp .env.example .env     # then edit .env — see Configuration below
npm start                # serves the app + API on http://localhost:3000
```

Open <http://localhost:3000>, open **Settings** on the home screen and enter your `APP_PIN`,
create a profile, then start talking (or typing).

## Configuration
Two environment variables, used by the **backend only** (never exposed to the browser). In `.env`:

```
ANTHROPIC_API_KEY=your-key-here    # 👈 owner inserts the Anthropic key here
APP_PIN=choose-a-shared-pin        # gate for the proxy (sent as the x-app-pin header)
# PORT=3000                        # optional; the server reads process.env.PORT
```

- **`ANTHROPIC_API_KEY`** — read by the backend only; never reaches the browser.
- **`APP_PIN`** — the proxy returns `401` without a matching `x-app-pin` header. Enter the same
  value in the app's **Settings**, and share it with whoever uses the app.
- ⚠️ **Set a low monthly spend cap** on your Anthropic key in the console — the deployed proxy is
  reachable from the internet, and the cap bounds worst-case abuse.

### Smoke-test the proxy
With the server running (`npm start`):

```bash
curl -s http://localhost:3000/api/chat \
  -H "content-type: application/json" -H "x-app-pin: $APP_PIN" \
  -d '{"profile":{"name":"Josipa","level":"B1","interests":"water treatment"},
       "messages":[{"role":"user","content":"Hi, can we practice?"}]}'
# -> {"reply":"..."}
```

## Tests
```bash
npm test             # Jest unit + Supertest API tests
npx playwright test  # Playwright E2E (first run: npx playwright install chromium)
```
CI (GitHub Actions) runs the unit/API and E2E suites on every push and pull request.

## Deploy (free hosting)
The app is a single Node process that serves the static frontend **and** the `/api/chat` +
`/api/summary` proxy, so any Node host works. **HTTPS is required** — the microphone and
"Add to Home Screen" only work over a secure origin.

**Recommended: [Render](https://render.com) or [Railway](https://railway.app) — free web service.**
1. Create a new **Web Service** from this GitHub repo.
2. Runtime **Node**; build command *(none)* or `npm ci`; **start command `npm start`**.
3. Set env vars: **`ANTHROPIC_API_KEY`** and **`APP_PIN`** (the host provides `PORT` automatically).
4. Deploy — you'll get an `https://…` URL.

Notes:
- Free tiers **sleep when idle**, so the first request after a pause can take ~30–60s (cold start).
- Prefer serverless? Vercel/Netlify also work — serve `public/` as static and expose `server/app.js`'s
  `/api/*` as a function. That's a little more wiring than the single Express service above.

## Install on Android
1. Deploy somewhere with **HTTPS** (see above).
2. Open the URL in **Chrome** on the phone.
3. Menu **⋮ → Add to Home screen** → confirm. It launches full-screen, like an app.
4. Open **Settings** in the app and enter the `APP_PIN`. Allow the microphone when prompted, pick a
   profile, and start talking.

> Voice input is best on **Android Chrome** (the primary target). Some browsers (e.g. Firefox) don't
> support `SpeechRecognition` — the app shows a note and you can still type.

## Out of scope for v1 (maybe later)
Real video / 3D / lip-sync avatar · publishing to Google Play / App Store · cloud accounts &
cross-device sync · payments / subscriptions · languages other than English.

## Project layout
```
public/            static PWA (index.html, styles.css, js/ ES modules, sw.js, manifest, icons)
server/            Express app factory (app.js) + pure logic (prompt.js)
server.js          entry point — wires the Anthropic client and starts the server
tests/             unit/ (Jest) · api/ (Supertest) · e2e/ (Playwright)
docs/ARCHITECTURE.md   design decisions (ADR)
progress/          per-task progress notes; PROGRESS.md is the index
```

## License
TBD.
