# GitHub zadaci — poboljšanja v1.1 (nakon prve radne verzije)

> Za Claude Code. Ovo su nadogradnje na postojeći radni MVP, NE nova specifikacija.
> Originalna specifikacija (`specifikacija.md`) i dalje vrijedi — ovi zadaci se na nju
> nadovezuju i moraju s njom biti usklađeni (reference na dijelove spec-a dolje).

## Workflow (isti kao spec dio 11 — pročitati prije početka)
- Svaki zadatak = jedan GitHub **Issue** s naslovom, opisom i **Definition of Done**.
- **Popis issuea PRVO predloži vlasniku, ne otvaraj sam.** GitHub radnje (kreiranje
  issuea, PR, merge) izvodi/odobrava vlasnik — Claude Code samo priprema + daje `gh` naredbe.
- Po zadatku: grana `feat/NN-naziv` → commitovi → PR s `Closes #N` → merge.
- Nakon svakog: `progress/NN-naziv.md` + ažuriraj `PROGRESS.md`.
- Na početku sesije: prvo pročitaj `PROGRESS.md` i nastavi od zadnjeg nezavršenog.

---

## Issue #1 — Dodati logove (debug/observability)

**Opis:** Strukturirano logiranje rada govora, prepoznavanja i API poziva.

**Definition of Done:**
- Logiranje ključnih događaja: start/stop snimanja, speech-to-text (interim + final), TTS start/stop, API request/response, greške.
- Log razine (DEBUG/INFO/WARN/ERROR), uključivo preko `?debug=1` ili localStorage flaga.
- Logovi u konzoli + opcionalni in-app debug panel (skriven u produkciji).
- **Sigurnost (spec dio 4):** nikad ne logirati `ANTHROPIC_API_KEY` niti puni backend token niti zaglavlja s tajnama.

---

## Issue #2 — Snimanje glasa staje prerano (pauze prekidaju)

**Opis:** Web Speech API (spec dio 6) prekida prepoznavanje na kratku pauzu. Korisnica treba moći govoriti duže, s prirodnim pauzama.

**Definition of Done:**
- `recognition.continuous = true` + ručno upravljanje krajem snimanja.
- "Silence timeout" (npr. 2.5–3.5 s tišine prije zaključenja umjesto default ~1 s), vrijednost konfigurabilna.
- Na `onend` automatski restart dok korisnik eksplicitno ne zaustavi.
- Interim rezultati se spajaju u jedan iskaz; finalni tekst se šalje tek nakon timeouta tišine ili klika "Stop".
- Vizualni indikator da app još sluša (uz postojeći gumb mikrofona, spec ekran 3).

---

## Issue #3 — Glas je previše robotski (prirodniji TTS)

**Opis:** Trenutni `SpeechSynthesis` glas zvuči robotski. Cilj: prirodniji glas u okviru postojeće Web Speech API arhitekture (spec dio 6).

**Definition of Done:**
- Pregledati `speechSynthesis.getVoices()` i preferirati prirodnije lokalne glasove (npr. Google/Microsoft neural za en-US/en-GB ako su na uređaju dostupni).
- Izbor glasa u postavkama profila + podešavanje rate/pitch.
- Fallback na default glas ako preferirani nije dostupan.

**Izvan opsega ovog issuea (otvoriti zaseban follow-up issue, NE graditi sad):**
- Cloud TTS preko backend proxyja. Dalo bi znatno prirodniji glas, ali širi opseg
  backenda (spec dio 4 traži minimalan posrednik) i dotiče duh dijela 8 (teži
  AV izvan v1). **Odluka o tome je na vlasniku** — dokumentirati kao mogućnost, ne implementirati bez potvrde.

---

## Issue #4 — UI: nije jasno kako započeti razgovor

**Opis:** Nije intuitivno pokrenuti chat.

**Definition of Done:**
- Dodati **"Start conversation"** gumb pored postojećeg **"Edit"** gumba na ekranu odabira profila (spec ekran 1 — NE uvoditi novi ekran).
- Klik vodi izravno na ekran razgovora (spec ekran 3) s aktivnim avatarom.
- Početno/prazno stanje ima kratku uputu što gumb radi.

---

## Issue #5 — Spremanje razgovora (nastavak gdje se stalo)

**Opis:** Razgovori se spremaju da korisnica može nastaviti od prošlog puta.

**Definition of Done:**
- **Lokalno spremanje (localStorage), bez logina/cloud synca** — u skladu sa spec dio 6 (profili lokalno) i dio 8 (cloud sync izričito izvan v1).
- Povijest po profilu: poruke, timestamp, sesija/tema, razina.
- Lista prošlih razgovora: nastavi / novi / obriši pojedini.
- Pri nastavku se prethodni kontekst šalje modelu (sažeto ako je predugo).
- Verzija u spremljenom objektu (otpornost na buduće schema promjene).

---

## Issue #6 — Tutor mode + kurikulum s razrađenim sesijama

**Opis:** App dobiva unaprijed pripremljene teme u kurikulumu i tutor-vođenje sesija. Namijenjeno supruzi za vježbanje business-level engleskog. Miks lakših i zahtjevnijih tema.

**VAŽNO — uskladiti s pedagogijom iz spec dio 3 i 5:**
Spec izričito kaže agent **"ne ispituje kao test"** i bira teme prirodno, s nježnim
ispravljanjem grešaka. Tutor mode dodaje **strukturu** (faze sesije i ciljani vokabular),
ali ton mora ostati **razgovoran, ne ispitni**. Strukturirane faze su interni vodič za
agenta, ne kruti upitnik za korisnicu. Sustavni prompt iz spec dio 5 se **proširuje**
(dodaje se trenutna sesija/faza/cilj kao kontekst), **ne zamjenjuje**.

**Definition of Done:**
- Tutor mode vodi sesiju kroz faze, ali prirodnim razgovorom; prelazi između faza glatko, ne najavljuje "sada je faza vokabulara".
- Kurikulum kao podatkovna struktura (JSON/TS), lako proširiva.
- Svaka sesija: `id`, `title`, `level` (CEFR), `type` (light/challenging), `goal`, faze (`warmup`, `vocabulary`, `guided_questions`, `roleplay`, `recap`), ciljani vokabular i fraze.
- Korisnica bira sesiju iz liste; tutor je vodi.
- Napredak po sesiji se sprema (povezano s Issue #5, isti localStorage pristup).
- Recap na kraju koristi format iz spec dio 3/5: što je išlo dobro + 2–3 stvari za vježbati, ohrabrujući ton.
- Miks lakših i zahtjevnijih tema u redoslijedu.

**Pedagoška osnova (referentni business English model B1–C1):** komunikacijski/task-based
pristup; svaka jedinica miješa vokabular, govorne aktivnosti i završava primjenom na
scenarij (role-play / studija slučaja). Struktura sesije: warm-up → ciljani vokabular →
vođeni govor → role-play/slobodni govor → recap+feedback.

**Razrađene sesije (seed podaci):**

### Session 1 — Traveling with the family (LIGHT, A2–B1)
- **Goal:** Self-introduction, present/past simple, opisivanje planova i prošlih putovanja.
- **Warm-up:** "How was your last trip? Where did you go?"
- **Vocabulary:** trip, journey, flight, book (a hotel), luggage, sightseeing, departure, delay, itinerary.
- **Guided questions:** Where would you like to travel with Alan and the kids? Have you traveled with David, Dunja and Jelena? Best trip? What was hard traveling with children?
- **Role-play:** Booking a hotel room / asking directions at airport. Tutor = receptionist.
- **Recap:** 3 nove fraze; feedback na past tense.

### Session 2 — Chemicals & equipment at water treatment facilities (CHALLENGING, B2)
- **Goal:** Tehnički vokabular, objašnjavanje procesa, opis funkcije i svrhe.
- **Warm-up:** "Describe your job to someone who knows nothing about water treatment."
- **Vocabulary:** coagulant, flocculation, sedimentation, chlorination, dosing pump, filtration, pH adjustment, sludge, effluent, disinfection byproducts.
- **Guided questions:** Which chemicals do you use most and why? How do you control dosing? Which equipment needs most maintenance?
- **Role-play:** Objasniti proces engleskom auditoru/dobavljaču.
- **Recap:** Process connectors (first, then, once, as a result); feedback na pasiv ("the water is treated…").

### Session 3 — Pool water purification (LIGHT–MID, B1)
- **Goal:** Uspoređivanje metoda, jednostavna objašnjenja, modali za preporuku.
- **Vocabulary:** chlorine, salt chlorination, pH balance, algae, filter, backwash, test strip, safe levels.
- **Guided questions:** How is pool treatment different from industrial water? What would you recommend for a home pool?
- **Role-play:** Savjetovati prijatelja o održavanju vode u bazenu.
- **Recap:** should/shouldn't, need to, recommend + -ing.

### Session 4 — Cleaning & disinfection of meat industry equipment (CHALLENGING, B2)
- **Goal:** Opis procedura, redoslijed, higijena/sigurnost.
- **Vocabulary:** CIP (clean-in-place), sanitization, residue, contamination, hygiene standard, HACCP, rinse cycle, detergent, food-grade.
- **Guided questions:** Walk me through cleaning a line after a prosciutto/kulen shift. Why is each step important?
- **Role-play:** Obučiti novog kolegu na protokolu dezinfekcije.
- **Recap:** Imperativi i sequencing language; feedback na jasnoću.

### Session 5 — Wastewater from the meat industry (CHALLENGING, B2–C1)
- **Goal:** Objašnjavanje problema i rješenja, uzrok/posljedica, uvjeravanje.
- **Vocabulary:** organic load, BOD/COD, fats and grease, screening, biological treatment, discharge limits, compliance, regulation.
- **Guided questions:** What makes meat-industry wastewater hard to treat? How do you meet discharge limits? What would you improve at your site?
- **Role-play:** Predstaviti predloženo poboljšanje upravi (persuasive).
- **Recap:** Cause/effect i persuasion language (because, therefore, this would allow us to…).

### Session 6 — Free conversation: Turkish & Korean dramas (LIGHT, B1)
- **Goal:** Mišljenja, prepričavanje radnje, izražavanje preferencije — opuštena fluentnost.
- **Vocabulary:** plot, character, episode, season, subtitle, cliffhanger, recommend.
- **Guided questions:** What are you watching now? Tell me the story. Why do you like it?
- **Role-play:** Preporučiti seriju prijatelju.
- **Recap:** Opinion fraze; pozitivan feedback za samopouzdanje.

> Daljnje sesije slijede isti obrazac, izmjenjujući light/challenging i postupno dižući
> CEFR razinu. Kurikulum proširiv da se lako dodaju nove jedinice.
