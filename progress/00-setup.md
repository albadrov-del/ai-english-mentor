# Task 0 — Project & workflow setup

**Status:** ✅ done
**Issue:** — (bootstrap task, no issue)
**Committed to:** `main` directly (setup precedes the branch/PR workflow)

## What was done
- Initialized git repository on branch `main` with repo-local identity
  (`Alan Badrov <albadrov@gmail.com>` — set locally, not globally).
- Created project scaffolding:
  - `README.md` — project overview + placeholder run/config sections (completed fully in #9).
  - `PROGRESS.md` — task status index; **read first each session**.
  - `.gitignore` — ignores `node_modules/`, `.env`, OS/editor junk.
  - `.env.example` — documents `ANTHROPIC_API_KEY` (owner inserts the real key into `.env`).
  - `progress/` — per-task progress artifacts (this is the first).
- Created the **public** GitHub repo `albadrov-del/ai-english-mentor` and pushed `main`.
- Opened GitHub issues **#1–#9** covering the v1 build, each with a Definition of Done
  (links + statuses in `PROGRESS.md`).

## How it was verified
- `git log` shows the setup commits on `main`.
- `gh repo view` → public repo exists; `gh issue list` → 9 open issues.
- `PROGRESS.md` lists all tasks with issue links.

## What's next
- **Issue #1 — Frontend scaffold (profile select + edit).** Create branch `feat/01-profile-screens`,
  build the profile list + editor backed by `localStorage` (mobile-first), no AI/voice yet.

## Decisions / notes
- **Stack:** vanilla HTML/CSS/JS frontend + Node/Express server (serves the static app **and**
  the `/api/chat` proxy). Final hosting decided around #3/#9 (free tier: Render/Railway; Vercel
  serverless documented as the alternative).
- **GitHub actions** are executed via the owner's authenticated `gh` (`albadrov-del`); the owner
  approves each one.
- **Model:** `claude-haiku-4-5-20251001` (per spec §2.5).
