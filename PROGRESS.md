# PROGRESS — AI English Mentor

State index for the whole project. **Read this first at the start of every session**, then the
latest file in [`progress/`](progress/), to find the last unfinished task and continue from there.
Workflow is defined in [`Sprint1_specifikacija.md`](Specificatio/Sprint%201%20-%20getting%20started/Sprint1_specifikacija.md) §11.

- **Repo:** https://github.com/albadrov-del/ai-english-mentor
- **Spec:** [`Sprint1_specifikacija.md`](Specificatio/Sprint%201%20-%20getting%20started/Sprint1_specifikacija.md)
- **Model:** `claude-haiku-4-5-20251001`

## Status legend
✅ done · 🟡 in progress · ⬜ TODO

## Tasks

| #  | Task | Status | Issue | Progress note |
|----|------|--------|-------|---------------|
| 0  | Project & workflow setup (git, repo, docs, issues) | ✅ done | — | [00-setup.md](progress/00-setup.md) |
| 1  | Frontend scaffold — profile select + edit (localStorage) | ✅ done | [#1](https://github.com/albadrov-del/ai-english-mentor/issues/1) | [01-profile-screens.md](progress/01-profile-screens.md) |
| 2  | Conversation screen shell (text-only) + navigation | ✅ done | [#2](https://github.com/albadrov-del/ai-english-mentor/issues/2) | [02-conversation-shell.md](progress/02-conversation-shell.md) |
| 3  | Backend proxy for Anthropic API | ✅ done | [#3](https://github.com/albadrov-del/ai-english-mentor/issues/3) | [03-anthropic-proxy.md](progress/03-anthropic-proxy.md) |
| 4  | Wire frontend to Claude (text conversation works) | ✅ done | [#4](https://github.com/albadrov-del/ai-english-mentor/issues/4) | [04-wire-claude.md](progress/04-wire-claude.md) |
| 5  | Voice input + output (Web Speech API) | ✅ done | [#5](https://github.com/albadrov-del/ai-english-mentor/issues/5) | [05-voice.md](progress/05-voice.md) |
| 6  | Animated robot avatar tied to speech | ✅ done | [#6](https://github.com/albadrov-del/ai-english-mentor/issues/6) | [06-avatar.md](progress/06-avatar.md) |
| 7  | Level adaptation + session summary + prompt refinement | ✅ done | [#7](https://github.com/albadrov-del/ai-english-mentor/issues/7) | [07-level-summary.md](progress/07-level-summary.md) |
| 8  | PWA wrapper (manifest, service worker, icons) | ✅ done | [#8](https://github.com/albadrov-del/ai-english-mentor/issues/8) | [08-pwa.md](progress/08-pwa.md) |
| 9  | README + hosting + Android install docs | ✅ done | [#9](https://github.com/albadrov-del/ai-english-mentor/issues/9) | [09-readme-docs.md](progress/09-readme-docs.md) |

🎉 **v1 complete — all 9 issues merged & deployed live on Render** (auto-deploys on push to `main`; `ANTHROPIC_API_KEY` + `APP_PIN` + spend cap configured).

## Sprint 2 — v1.1 (curriculum + UX/voice)
Spec: [Sprint2_addingCurriculum.md](Specificatio/Sprint%202%20-%20adding%20curriculim/Sprint2_addingCurriculum.md). Built **dependencies-first** via the autonomous loop (self-merge on green CI; each merge auto-deploys to Render). Same status legend.

| #    | Task | Status | Issue | Progress note |
|------|------|--------|-------|---------------|
| S2-1 | Logging / observability | ✅ done | [#21](https://github.com/albadrov-del/ai-english-mentor/issues/21) | [21-logging.md](progress/21-logging.md) |
| S2-2 | Mic continuous capture + silence-timeout | ✅ done | [#22](https://github.com/albadrov-del/ai-english-mentor/issues/22) | [22-mic-continuous.md](progress/22-mic-continuous.md) |
| S2-3 | More natural TTS (voice / rate / pitch) | ⬜ TODO | [#23](https://github.com/albadrov-del/ai-english-mentor/issues/23) | — |
| S2-4 | "Start conversation" button | ⬜ TODO | [#24](https://github.com/albadrov-del/ai-english-mentor/issues/24) | — |
| S2-5 | Save conversations (history + resume) | ⬜ TODO | [#25](https://github.com/albadrov-del/ai-english-mentor/issues/25) | — |
| S2-6 | Tutor mode + curriculum | ⬜ TODO | [#26](https://github.com/albadrov-del/ai-english-mentor/issues/26) | — |

## Per-task workflow
Branch `feat/NN-slug` → frequent commits (each a safe checkpoint) → PR with `Closes #N` →
**self-merge** to `main` → write `progress/NN-slug.md` → update this table. GitHub actions run via
the owner's authenticated `gh` (`albadrov-del`); **self-merge is authorized** for this project, so no
per-merge approval is needed. The build runs in a self-paced `/loop` — the owner re-runs it after each
usage reset and work resumes from `PROGRESS.md` + the latest `progress/` note.
