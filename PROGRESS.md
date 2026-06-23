# PROGRESS — AI English Mentor

State index for the whole project. **Read this first at the start of every session**, then the
latest file in [`progress/`](progress/), to find the last unfinished task and continue from there.
Workflow is defined in [`specifikacija.md`](specifikacija.md) §11.

- **Repo:** https://github.com/albadrov-del/ai-english-mentor
- **Spec:** [`specifikacija.md`](specifikacija.md)
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
| 6  | Animated robot avatar tied to speech | ⬜ TODO | [#6](https://github.com/albadrov-del/ai-english-mentor/issues/6) | — |
| 7  | Level adaptation + session summary + prompt refinement | ⬜ TODO | [#7](https://github.com/albadrov-del/ai-english-mentor/issues/7) | — |
| 8  | PWA wrapper (manifest, service worker, icons) | ⬜ TODO | [#8](https://github.com/albadrov-del/ai-english-mentor/issues/8) | — |
| 9  | README + hosting + Android install docs | ⬜ TODO | [#9](https://github.com/albadrov-del/ai-english-mentor/issues/9) | — |

## Per-task workflow
Branch `feat/NN-slug` → frequent commits (each a safe checkpoint) → PR with `Closes #N` →
**self-merge** to `main` → write `progress/NN-slug.md` → update this table. GitHub actions run via
the owner's authenticated `gh` (`albadrov-del`); **self-merge is authorized** for this project, so no
per-merge approval is needed. The build runs in a self-paced `/loop` — the owner re-runs it after each
usage reset and work resumes from `PROGRESS.md` + the latest `progress/` note.
