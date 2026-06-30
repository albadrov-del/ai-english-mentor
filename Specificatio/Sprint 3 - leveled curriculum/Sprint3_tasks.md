# GitHub Tasks — v1.1 improvements (after the first working version)

> For Claude Code. These are upgrades to the existing working MVP, NOT a new spec.
> The original specification (`specifikacija.md`) still applies — these tasks build on
> it and must stay aligned with it (references to spec sections below).
>
> **Language:** Code, UI, and all in-app text are in **English**. Task descriptions may
> be in Croatian or English — they are instructions for you, not app content.

## Workflow (same as spec section 11 — read before starting)
- Each task = one GitHub **Issue** with a title, description, and **Definition of Done**.
- **Propose the full issue list to the owner FIRST, do not open them yourself.** GitHub
  actions (creating issues, PRs, merges) are run/approved by the owner — Claude Code only
  prepares them and provides the `gh` commands.
- Per task: branch `feat/NN-name` → commits → PR with `Closes #N` → merge.
- After each task: `progress/NN-name.md` + update `PROGRESS.md`.
- At the start of each session: read `PROGRESS.md` first and continue from the last unfinished task.

---

## Issue #1 — Add logging (debug / observability)

**Description:** Structured logging of speech, recognition, and API calls.

**Definition of Done:**
- Log key events: recording start/stop, speech-to-text (interim + final), TTS start/stop, API request/response, errors.
- Log levels (DEBUG/INFO/WARN/ERROR), toggleable via `?debug=1` or a localStorage flag.
- Logs in the console + an optional in-app debug panel (hidden in production).
- **Security (spec section 4):** never log the `ANTHROPIC_API_KEY`, the full backend token, or headers containing secrets.

---

## Issue #2 — Voice recording stops too early + repeated phrases in transcript

**Description:** The Web Speech API (spec section 6) stops recognition on a short pause. The user needs to be able to speak longer, with natural pauses. Additionally, there is a bug where **interim results are concatenated instead of replaced**, so the same part of a sentence repeats many times (example from testing: "scream to filter scream to filter scream to filter...").

**Definition of Done:**
- `recognition.continuous = true` + manual control of when recording ends.
- A "silence timeout" (e.g. 2.5–3.5 s of silence before finishing, instead of the default ~1 s), value configurable.
- On `onend`, automatically restart until the user explicitly stops.
- **Interim results are REPLACED, not appended.** Handle `event.results` indices correctly (`resultIndex`, `isFinal`) so the current interim transcript is overwritten instead of growing; final segments are added once when `isFinal`.
- **Deduplication:** before sending to the model, remove repeated consecutive phrases/words (a safeguard in case the engine still returns repetitions).
- Final text is sent only after the silence timeout or a "Stop" click.
- A visual indicator that the app is still listening (next to the existing mic button, spec screen 3).

---

## Issue #3 — Voice is too robotic (more natural TTS)

**Description:** The current `SpeechSynthesis` voice sounds robotic. Goal: a more natural voice within the existing Web Speech API architecture (spec section 6).

**Definition of Done:**
- Inspect `speechSynthesis.getVoices()` and prefer more natural local voices (e.g. Google/Microsoft neural voices for en-US/en-GB if available on the device).
- Voice selection in the profile settings + rate/pitch adjustment.
- Fall back to the default voice if the preferred one is unavailable.

**Out of scope for this issue (open a separate follow-up issue, do NOT build now):**
- Cloud TTS via the backend proxy. It would give a much more natural voice, but it widens
  the backend scope (spec section 4 calls for a minimal proxy) and touches the spirit of
  section 8 (heavier AV out of v1). **This is the owner's decision** — document it as an
  option, do not implement without confirmation.

---

## Issue #4 — UI: not clear how to start a conversation

**Description:** Starting the chat is not intuitive.

**Definition of Done:**
- Add a **"Start conversation"** button next to the existing **"Edit"** button on the profile selection screen (spec screen 1 — do NOT add a new screen).
- The click leads directly to the conversation screen (spec screen 3) with the avatar active.
- The initial/empty state has a short hint explaining what the button does.

---

## Issue #5 — Saving conversations (continue where you left off)

**Description:** Conversations are saved so the user can continue from last time.

**Definition of Done:**
- **Local storage via IndexedDB** (not localStorage) — more robust, larger capacity, structured data. No login/cloud sync, in line with spec section 8 (cloud out of v1).
- History per profile: messages, timestamp, session/topic, level.
- List of past conversations: continue / new / delete a single one.
- When continuing, the previous context is sent to the model (summarized if too long).
- A version field in the saved object (resilience to future schema changes).
- **Export/Import:** a button to export all data (profiles + history + progress) to a JSON file, and import from it. A backup in case the browser data is cleared.

> Note: IndexedDB still does not survive "clear all site data" or a reinstall. True permanent storage (backend/database or native storage) is recorded in Issue #9 as a future owner decision.

---

## Issue #6 — Tutor mode + curriculum with detailed sessions

**Description:** The app gets pre-built topics in a curriculum and tutor-led sessions. Intended for the wife to practice business-level English. A mix of lighter and more challenging topics.

**IMPORTANT — align with the pedagogy from spec sections 3 and 5:**
The spec explicitly says the agent **"does not quiz like a test"** and chooses topics
naturally, with gentle error correction. Tutor mode adds **structure** (session phases and
target vocabulary), but the tone must stay **conversational, not test-like**. The structured
phases are an internal guide for the agent, not a rigid questionnaire for the user. The
system prompt from spec section 5 is **extended** (the current session/phase/goal is added
as context), **not replaced**.

**Definition of Done:**
- Tutor mode leads the session through phases, but via natural conversation; transitions between phases are smooth, it does not announce "now it's the vocabulary phase".
- Curriculum as a data structure (JSON/TS), easily extensible.
- Each session: `id`, `title`, `level` (CEFR), `type` (light/challenging), `goal`, phases (`warmup`, `vocabulary`, `guided_questions`, `roleplay`, `recap`), target vocabulary and phrases.
- The user picks a session from a list; the tutor leads it.
- Per-session progress is saved (linked to Issue #5, same storage approach).
- The recap at the end uses the format from spec section 3/5: what went well + 2–3 things to practice, encouraging tone.
- A mix of lighter and more challenging topics in the ordering.

**Pedagogical basis (reference business English model B1–C1):** a communicative/task-based
approach; each unit mixes vocabulary, speaking activities, and ends with application to a
scenario (role-play / case study). Session structure: warm-up → target vocabulary →
guided speaking → role-play/free speaking → recap+feedback.

**Detailed sessions (seed data):**

### Session 1 — Traveling with the family (LIGHT, A2–B1)
- **Goal:** Self-introduction, present/past simple, describing plans and past trips.
- **Warm-up:** "How was your last trip? Where did you go?"
- **Vocabulary:** trip, journey, flight, book (a hotel), luggage, sightseeing, departure, delay, itinerary.
- **Guided questions:** Where would you like to travel with Alan and the kids? Have you traveled with David, Dunja and Jelena? Best trip? What was hard traveling with children?
- **Role-play:** Booking a hotel room / asking directions at the airport. Tutor = receptionist.
- **Recap:** 3 new phrases; feedback on past tense.

### Session 2 — Chemicals & equipment at water treatment facilities (CHALLENGING, B2)
- **Goal:** Technical vocabulary, explaining a process, describing function and purpose.
- **Warm-up:** "Describe your job to someone who knows nothing about water treatment."
- **Vocabulary:** coagulant, flocculation, sedimentation, chlorination, dosing pump, filtration, pH adjustment, sludge, effluent, disinfection byproducts.
- **Guided questions:** Which chemicals do you use most and why? How do you control dosing? Which equipment needs the most maintenance?
- **Role-play:** Explain the process to an English-speaking auditor/supplier.
- **Recap:** Process connectors (first, then, once, as a result); feedback on the passive ("the water is treated…").

### Session 3 — Pool water purification (LIGHT–MID, B1)
- **Goal:** Comparing methods, simple explanations, modals for recommendation.
- **Vocabulary:** chlorine, salt chlorination, pH balance, algae, filter, backwash, test strip, safe levels.
- **Guided questions:** How is pool treatment different from industrial water? What would you recommend for a home pool?
- **Role-play:** Advising a friend on keeping pool water clean.
- **Recap:** should/shouldn't, need to, recommend + -ing.

### Session 4 — Cleaning & disinfection of meat industry equipment (CHALLENGING, B2)
- **Goal:** Describing procedures, sequencing, hygiene/safety.
- **Vocabulary:** CIP (clean-in-place), sanitization, residue, contamination, hygiene standard, HACCP, rinse cycle, detergent, food-grade.
- **Guided questions:** Walk me through cleaning a line after a prosciutto/kulen shift. Why is each step important?
- **Role-play:** Training a new colleague on the disinfection protocol.
- **Recap:** Imperatives and sequencing language; feedback on clarity.

### Session 5 — Wastewater from the meat industry (CHALLENGING, B2–C1)
- **Goal:** Explaining problems and solutions, cause/effect, persuading.
- **Vocabulary:** organic load, BOD/COD, fats and grease, screening, biological treatment, discharge limits, compliance, regulation.
- **Guided questions:** What makes meat-industry wastewater hard to treat? How do you meet discharge limits? What would you improve at your site?
- **Role-play:** Presenting a proposed improvement to management (persuasive).
- **Recap:** Cause/effect and persuasion language (because, therefore, this would allow us to…).

### Session 6 — Free conversation: Turkish & Korean dramas (LIGHT, B1)
- **Goal:** Opinions, retelling a plot, expressing preference — relaxed fluency.
- **Vocabulary:** plot, character, episode, season, subtitle, cliffhanger, recommend.
- **Guided questions:** What are you watching now? Tell me the story. Why do you like it?
- **Role-play:** Recommending a show to a friend.
- **Recap:** Opinion phrases; positive feedback to build confidence.

> Further sessions follow the same pattern, alternating light/challenging and gradually
> raising the CEFR level. The curriculum is extensible so new units can be added easily.

---

## Issue #7 — Filter background noise / gibberish from the transcript

**Description:** The Web Speech API picks up background noise and writes nonsense into the transcript. Goal: reduce this by filtering on the app side (the quality of recognition itself is on the service side and out of our control).

**Definition of Done:**
- **Confidence threshold:** drop results with `confidence` below a threshold (e.g. 0.6); threshold configurable.
- Send only `isFinal` results to the model; interim results are not sent.
- Filter out too-short/nonsense utterances (e.g. 1–2 characters, pure punctuation, empty strings).
- Set `getUserMedia` audio constraints `noiseSuppression: true` and `echoCancellation: true` if the app touches the audio stream.
- Consider **push-to-talk** (hold-to-speak) as an option instead of constant listening — the most effective against background noise; linked to Issue #2 (controlling when recording ends).

**Out of scope for this issue (open a separate follow-up, do NOT build now):**
- Cloud STT (speech-to-text) via the backend proxy. It would give much better control over
  noise handling and accents, but widens the backend scope (spec section 4) — the same kind
  of decision as cloud TTS in Issue #3. **This is the owner's decision;** exhaust the filters
  above first.

---

## Issue #8 — Level-driven grammar curriculum + progress + exam

**Description:** Restructure the curriculum to be led like a real teacher would: a sequence
of lessons in a logical order, each covering one grammar unit, practiced in the context of
topics from the profile. Lessons are offered **only for the level the user has selected**.
This also fixes the earlier level-mismatch bug (Filip A1 → B2 session).

**Organizing principle:** grammar is the backbone (it determines which lessons exist and
their order); the topics from the profile (water treatment, disinfection, dramas, family,
travel) are the context within each lesson. The thematic seed from Issue #6 is reused as
context, not as a separate set of sessions.

### Definition of Done

**Curriculum structure**
- A curriculum per CEFR level (A1, A2, B1, B2, C1); each level has its own lesson sequence.
- Each lesson covers **one grammar unit** (e.g. A1: present simple → there is/are → can/can't → past simple…).
- Lessons **sorted in a logical order** as in a standard curriculum (simpler → more complex, material builds up).
- Lesson as a data structure: `id`, `level`, `order`, `grammarFocus`, `goal`, `contextTopic` (from the profile), phases (warmup/teaching/practice/recap).
- Only lessons for the user's **selected level** are offered.

**Leading a lesson (teacher tone)**
- At the **start of the lesson the agent clearly states the goal** ("Today we'll practice the past simple — talking about things you did last week").
- Through conversation, it practices the user **in the context of that grammar unit**, using a profile topic as the content.
- The tone stays conversational and encouraging (spec section 3/5), but structured around the lesson goal; the system prompt is extended with the current lesson/grammar/goal.
- At the end: a short recap — what went well + 2–3 things to practice.

**Progress**
- After passing a lesson, the lesson gets a **checkmark** (completed).
- **Per-level progress indicator:** e.g. 10 grammar topics, the user is on 5 → 50%. A visible percentage/bar.
- Progress is **saved locally via IndexedDB (linked to Issue #5)** — this is core: the user must be able to come back and **continue where they left off**. Included in the export/import from #5.
- A **"Start over"** option within the lesson/curriculum → resets that unit's progress.
- A **"Clear progress"** option → a mandatory **confirmation pop-up** with text along the lines of: "This will reset your progress. Are you sure?" before deleting.

**Changing level**
- If the user changes level, the lessons change to the **new** level.
- Progress for each level is **saved separately** — if the user returns to an old level, they continue where they left off (progress is not erased by changing level).

**Exam / measuring progress**
- An **initial exam** at the start of a level (placement/baseline) — optional but recommended.
- A **final exam** as the last "lesson" in the sequence — **the same** as the initial one, so the results can be compared and the user sees their progress.
- The exam covers the **key grammar units of the selected level** (the ones practiced through that level's lessons).
- The result is shown and saved; comparison of initial vs. final (e.g. "Start: 6/10 → End: 9/10").
- The exam may be in a test format (unlike the lessons, which stay conversational) — clearly separated from the conversational lessons.

**Note on seed content**
- Define the grammar sequence at least for A1, A2, B1 (B2/C1 can come later).
- For each grammar lesson, attach a suitable profile topic as context (e.g. past simple → "your last family trip"; passive voice → "how water is treated"; modals of recommendation → "advising on pool care").

---

## Issue #9 — True permanent storage (FOLLOW-UP, owner decides)

> Recorded as a future decision. Do NOT build now. Changes spec section 8.

**Description:** IndexedDB (#5/#8) is a short-term solution — more robust than localStorage, but still lost on "clear all site data" or a reinstall. For true persistence of progress there are two routes, both widening the scope beyond v1 (spec section 8 currently puts cloud and app-store publishing out of scope):

**Route A — Cloud backend + database:** progress tied to a user, sync across devices, survives everything. Requires identity/login and database hosting. The existing backend proxy (for Anthropic) could be extended with a database.

**Route B — Capacitor (PWA → Android app):** packages the existing web code into a native Android app with native storage / SQLite that survives cache clearing. The least wasted work (keeps the existing code), enables the Play Store. Risk: the Web Speech API (listening/speaking, #2/#7) may behave differently in a WebView — may need a native speech plugin.

**This is the owner's decision.** Once the v1 web version is stable, choose a route (likely B for this project) and open a detailed issue. Until then, IndexedDB + export/import stands.

---

## Sprint 3 build note (added by Claude Code)

This spec is an evolved **superset** of `Sprint2_addingCurriculum.md`. As of the Sprint 3 kickoff:

- **Already shipped in Sprint 2:** #1 (logging, #21), #3 (natural TTS, #23), #4 (start button, #24),
  #6 (tutor mode + curriculum, #26); #2 core (continuous + silence-timeout + interim-replace via
  `resultIndex`, #22); #5 core (save/resume — implemented with **localStorage**, #25).
- **Sprint 3 (this batch) — the delta:**
  - **S3-1** — voice robustness: dedup safeguard (#2-delta) + noise/gibberish filtering (#7).
  - **S3-2** — Export/Import JSON backup (#5-delta). Storage stays localStorage (owner decision); no IndexedDB migration.
  - **S3-3** — level-gated lessons (fixes the A1→B2 mismatch; precursor to #8).
- **Sprint 4 (deferred, its own design):** #8 — leveled grammar curriculum + per-level progress + initial/final exam.
- **Owner decisions / follow-ups (not built):** cloud TTS (#3), cloud STT (#7), permanent storage via Capacitor/cloud (#9).
