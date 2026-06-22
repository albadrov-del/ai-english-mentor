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
| 1  | Frontend scaffold — profile select + edit (localStorage) | ⬜ TODO | _pending_ | — |
| 2  | Conversation screen shell (text-only) + navigation | ⬜ TODO | _pending_ | — |
| 3  | Backend proxy for Anthropic API | ⬜ TODO | _pending_ | — |
| 4  | Wire frontend to Claude (text conversation works) | ⬜ TODO | _pending_ | — |
| 5  | Voice input + output (Web Speech API) | ⬜ TODO | _pending_ | — |
| 6  | Animated robot avatar tied to speech | ⬜ TODO | _pending_ | — |
| 7  | Level adaptation + session summary + prompt refinement | ⬜ TODO | _pending_ | — |
| 8  | PWA wrapper (manifest, service worker, icons) | ⬜ TODO | _pending_ | — |
| 9  | README + hosting + Android install docs | ⬜ TODO | _pending_ | — |

## Per-task workflow
Branch `feat/NN-slug` → meaningful commits → PR with `Closes #N` → merge to `main` →
write `progress/NN-slug.md` → update this table. GitHub actions run via the owner's
authenticated `gh` (account `albadrov-del`); the owner approves each.
