# Architecture Decision Record — AI English Mentor (v1)

**Status:** Accepted · **Date:** 2026-06-22 · **Spec:** [`Sprint1_specifikacija.md`](../Specificatio/Sprint%201%20-%20getting%20started/Sprint1_specifikacija.md)

Decisions for v1, made before coding so any session can build consistently. The guiding
rule (from the spec) is **"the simplest thing that works."** Research notably *removed*
complexity here — see the notes per decision.

## Context
A mobile-first PWA where the user practices spoken English by voice with a Claude-powered
tutor. ~4 screens, multiple local profiles, voice in/out, a Claude backend. Single developer,
public portfolio repo, family-scale traffic. No login, no DB, no cloud sync (out of scope).

## Decisions

| Area | Decision | Why |
|---|---|---|
| **Frontend** | Plain HTML/CSS/**vanilla JS**, mobile-first. No framework. | ~4 screens — a framework is over-engineering. |
| **Frontend structure** | Split JS into small **ES modules**: `profiles`, `conversation`, `speech`, `avatar`, `api`, `app`. | The one structural choice worth making; pays off as voice + avatar + PWA accumulate. |
| **Backend** | One small **Node/Express** server that serves the static PWA **and** exposes `POST /api/chat`. | One repo, one deploy, HTTPS for Web Speech + PWA install. Matches owner's Node/Express background. |
| **Hosting** | Single Express app on a **free tier (Render/Railway)**. | Simplest mental model. Note: free tier sleeps → ~30–60s cold start on first hit after idle. |
| **SDK** | Official **`@anthropic-ai/sdk`** (Node). `new Anthropic()` reads `ANTHROPIC_API_KEY` from env. | Canonical; key stays server-side. |
| **Model** | `claude-haiku-4-5-20251001`. No `thinking`, no `effort` (Haiku rejects `effort`). `max_tokens` ≈ 256–320. | Fast, cheap, short spoken turns. Per spec §2.5. |
| **Streaming** | **Non-streaming** in v1. | Replies are 1–3 sentences — well under any timeout. Streaming is a documented later upgrade if time-to-first-word feels slow. |
| **Prompt caching** | **None.** | Caching has a **4096-token minimum on Haiku 4.5**; our system prompt (pedagogy + short profile) is a few hundred tokens, so `cache_control` would silently do nothing. |
| **Conversation state** | Stateless backend. Frontend holds the message array and sends full history each turn. | The Messages API is stateless; no server session store needed. |
| **Profiles** | `localStorage` only. | No login for v1 (spec §6). |

## `/api/chat` contract
```
POST /api/chat
Headers: x-app-pin: <shared passphrase>
Body:    { profile: { name, level, interests }, messages: [ { role, content }, ... ] }
Resp:    { reply: "<assistant text>" }    // 401 if PIN missing/wrong
```
The backend **builds the system prompt** from `profile` (per spec §5) and calls Claude with
`messages`. The end-of-session summary (Issue #7) reuses this proxy — via a mode flag or a
second endpoint; decide at #7.

## Security model (the part the spec under-emphasizes)
A public repo + a discoverable deployed proxy + a paid key = an abuse vector. Three guards:
1. **Backend builds the system prompt** — the client never sends an arbitrary `system` string
   (otherwise the proxy is an open, jailbreakable Claude relay).
2. **Shared PIN gate** on `/api/chat` (`x-app-pin` header) — blocks casual abuse cheaply.
3. **Low monthly spend cap** on the Anthropic key (set in the console) — bounds the worst case
   regardless. → affects **Issue #3** DoD.

## Voice handling (research-driven) → affects Issue #5
`SpeechRecognition` is solid on **Android Chrome** (primary target) + Safari; Firefox is behind
a flag. Known quirks: ~60s silent auto-stop, `no-speech` on pauses, **unreliable continuous mode**.
Therefore: **press-to-talk / tap-to-toggle discrete utterances** (not always-on listening),
handle `onend`/`onerror`, and show a fallback message on unsupported browsers. `SpeechSynthesis`
(TTS) is broadly supported.

## Intentionally out of scope for v1 (avoid over-engineering)
No framework · no database · no login/accounts · no state-management library · no prompt caching ·
no streaming · no TypeScript build step · no microservices.

## Sources
- [MDN — Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Taming the Web Speech API](https://webreflection.medium.com/taming-the-web-speech-api-ef64f5a245e1)
- Anthropic API reference (SDK, Haiku 4.5 limits, caching minimums) via the `claude-api` skill.
