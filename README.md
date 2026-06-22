# AI English Mentor 🤖🗣️

A voice-based English conversation practice **Progressive Web App (PWA)**. You talk to a
Claude-powered tutor out loud, a simple animated robot avatar responds, and the conversation
adapts to your CEFR level (A1–C1) and personal interests.

> **Status: 🚧 v1 in active development.** Built in public as a portfolio project, task by task.
> See [`PROGRESS.md`](PROGRESS.md) for current status and [`specifikacija.md`](specifikacija.md)
> for the full specification (Croatian).

## Features (v1 goals)
- 🎙️ **Voice conversation** — speak into the mic, the tutor replies aloud (Web Speech API).
- 🎚️ **Level-adaptive** — choose A1–C1; vocabulary, pace, and complexity adjust.
- 👤 **Profiles** — multiple local profiles (name, level, interests) tailor the topics.
- 🤖 **Animated robot mentor** — a simple SVG/CSS avatar that animates while speaking.
- 🧠 **Real AI** — powered by Claude (`claude-haiku-4-5-20251001`) via a secure backend proxy.
- 📱 **Installable PWA** — add to your Android home screen, runs full-screen.

## Tech stack
- **Frontend:** mobile-first HTML / CSS / vanilla JavaScript.
- **Backend:** small Node.js/Express server that serves the app and proxies the Anthropic API,
  keeping the API key server-side — it is **never** shipped to the browser.
- **Voice:** Web Speech API (`SpeechRecognition` + `SpeechSynthesis`).

## Getting started
> ⚠️ Full setup, hosting, and Android install instructions are completed in the final task (#9).
> The steps below are a placeholder.

### Prerequisites
- Node.js 18+ and npm
- An Anthropic API key

### Run locally
```bash
# 1. Install dependencies
npm install

# 2. Configure your API key
cp .env.example .env
#    then edit .env and paste your key into ANTHROPIC_API_KEY

# 3. Start the server
npm start
```

## Configuration
This app needs an Anthropic API key. Copy `.env.example` to `.env` and set:

```
ANTHROPIC_API_KEY=your-key-here   # 👈 owner inserts the key here
```

The key is read by the **backend only** and is never exposed to the frontend.

## Out of scope for v1 (possibly later)
Real video / 3D / lip-sync avatar · app-store publishing · cloud accounts & cross-device sync ·
payments / subscriptions · languages other than English.

## License
TBD.
