# Specifikacija: Govorni asistent za vježbanje engleskog (PWA)

> Dokument za Claude Code. Cilj je izgraditi v1 (MVP) aplikacije za vježbanje
> govornog engleskog. Ova specifikacija opisuje ŠTO graditi, ne nužno svaki
> tehnički detalj — gdje postoji izbor, odaberi najjednostavnije rješenje koje radi.

---

## 1. Što je proizvod

Mobilna aplikacija (PWA, instalabilna na Android početni zaslon) u kojoj korisnik
**glasom** vježba razgovorni engleski s AI mentorom. Mentor je prikazan kao
jednostavan animirani robot-lik koji se "pomiče" dok govori. Razgovor se prilagođava
razini znanja koju korisnik odabere te interesima i struci iz njegovog profila.

Primarni korisnik (test profil): Josipa — inženjerka kemije, radi na održavanju
uređaja za obradu pitke i otpadne vode u mesnoj industriji; voli turske serije i
korejske drame; ima troje djece; kupuje na Vintedu. Aplikacija mora podržati i
**druge profile** (cijela obitelj), ne samo nju.

---

## 2. Ključni zahtjevi (must-have za v1)

1. **Glasovni razgovor** — korisnik govori (mikrofon → tekst), agent odgovara naglas (tekst → govor).
2. **Odabir razine** na početku: A1, A2, B1, B2, C1. Razgovor se vodi u skladu s razinom (vokabular, duljina rečenica, tempo, složenost).
3. **Profili** — promjenjivi. Svaki profil ima: ime, razinu, interese/struku (slobodan tekst). Agent koristi te podatke za odabir tema.
4. **Animirani robot-mentor** — jednostavan lik koji se vizualno animira dok govori (npr. pomicanje usta / pulsiranje / kimanje). Ne treba pravi video ni lip-sync.
5. **Pravi AI mozak** — odgovori dolaze od Claude modela preko Anthropic API-ja (model: `claude-haiku-4-5-20251001`).
6. **PWA** — instalabilna na Android, radi preko cijelog ekrana, ima ikonu i manifest.

---

## 3. Pedagoški zahtjevi (kako agent vodi razgovor)

- Agent vodi prirodan razgovor, **ne ispituje kao test**. Postavlja pitanja, reagira, drži temu živom.
- Teme bira prema profilu korisnika (za Josipu: obrada voda, kemija, serije/drame, obitelj, kupovina) — ali ne forsira sve odjednom.
- **Prilagodba razini je ključna:**
  - A1/A2: kratke jednostavne rečenice, čest, sporiji tempo, osnovni vokabular, puno ohrabrenja.
  - B1/B2: normalan razgovorni tempo, složenije teme, idiomi se uvode polako.
  - C1: prirodan, nijansiran razgovor, izazovne teme.
- **Ispravljanje grešaka — nježno, ne prekidati stalno.** Kad korisnik pogriješi, agent može prirodno ponoviti rečenicu u ispravnom obliku ("Oh, you mean...?") umjesto da prekida i drži lekciju.
- Na kraju sesije (kad korisnik završi): kratak sažetak — što je išlo dobro + 2-3 konkretne stvari za vježbati. Ohrabrujući ton.

---

## 4. Sigurnost API ključa (VAŽNO)

Anthropic API ključ **ne smije** biti u frontend kodu (svatko bi ga vidio i zloupotrijebio).
Napravi mali **backend posrednik** (serverless funkcija ili lagani server) koji:
- drži API ključ u environment varijabli (npr. `ANTHROPIC_API_KEY`),
- prima poruke iz aplikacije, prosljeđuje ih Anthropic API-ju, vraća odgovor.

Frontend nikad ne vidi ključ. Predloži vlasniku gdje to hostati (npr. besplatni tier nekog servisa) i kako postaviti env varijablu.

---

## 5. Sustavni prompt za agenta (osnova, doraditi)

Agent treba sustavni prompt koji uključuje varijable iz profila. Skica:

```
You are a warm, patient English conversation tutor speaking with {name}.
Their English level is {level}. Adapt your vocabulary, sentence length, and
pace strictly to this level.

About them (use to choose natural conversation topics, do not interrogate):
{interests}

Rules:
- Keep a natural spoken conversation. Ask follow-up questions. One idea at a time.
- Match {level}: at A1/A2 use short simple sentences; at B2/C1 speak naturally.
- When they make a mistake, gently model the correct form in your reply instead
  of stopping to lecture. Don't correct every small thing — keep it encouraging.
- Keep your turns short (this is spoken, not written). 1-3 sentences usually.
- When the user signals they want to stop, give a short, encouraging summary:
  what went well + 2-3 things to practice.
```

---

## 6. Tehnološke smjernice (prijedlog, Claude Code može prilagoditi)

- **Glas:** Web Speech API u pregledniku — `SpeechRecognition` za slušanje, `SpeechSynthesis` za govor. Besplatno, radi na Androidu/Chrome. Postavi jezik prepoznavanja na `en-US` / `en-GB`. (Ako se pokaže nepouzdano, dokumentiraj alternativu.)
- **Frontend:** jednostavan, mobile-first. Velik gumb mikrofona, robot-avatar u centru, polje za prikaz transkripta (koristan kao podrška).
- **Avatar:** dovoljan je SVG/CSS animirani lik — usta/tijelo se animiraju dok traje `SpeechSynthesis`. Bez teških 3D/video biblioteka.
- **Profili:** spremati lokalno na uređaju (npr. localStorage) — bez obaveznog logina za v1.
- **PWA:** manifest.json + service worker + ikone, da se može "Add to Home Screen".

---

## 7. Ekrani (minimalno za v1)

1. **Početni / odabir profila** — popis profila + "novi profil".
2. **Uređivanje profila** — ime, razina (A1–C1), interesi/struka (tekst).
3. **Razgovor** — robot-avatar, gumb mikrofona (pritisni-govori ili tap-toggle), transkript, gumb "završi sesiju".
4. **Sažetak sesije** — prikaz onoga što je agent rezimirao.

---

## 8. Izričito IZVAN opsega za v1 (ne raditi sad)

- Pravi video / 3D / lip-sync mentor.
- Objava na Google Play / App Store (ostaje PWA).
- Login/računi u oblaku, sinkronizacija među uređajima.
- Plaćanje, pretplate, više jezika osim engleskog.

Ove stvari dokumentirati kao "moguće kasnije", ne graditi.

---

## 9. Što isporučiti

- Radni PWA frontend.
- Backend posrednik za Anthropic API.
- Kratak README: kako pokrenuti lokalno, kako postaviti `ANTHROPIC_API_KEY`, kako hostati, kako instalirati na Android telefon.
- Jasno označiti gdje vlasnik treba upisati svoj API ključ.

---

## 10. Redoslijed gradnje (preporuka)

1. Osnovni frontend + odabir profila + ekran razgovora (bez glasa, samo tekst) — da se vidi tok.
2. Spajanje na Claude API preko backend posrednika — da razgovor radi tekstualno.
3. Dodavanje glasa (slušanje + govor).
4. Animacija robot-avatara vezana uz govor.
5. Prilagodba razini + sažetak sesije + dorada prompta.
6. PWA omotač (manifest, service worker, ikone, instalacija).
7. README + upute.
```

---

## 11. Radni proces (workflow, GitHub) — VAŽNO

Projekt se vodi javno na GitHubu (svrha je i portfolio vlasnika). Rad mora biti
**segmentiran na taskove** tako da se može raditi u zasebnim sesijama: kad jednoj
sesiji ponestane konteksta/tokena, sljedeća mora moći nastaviti bez gubitka.

### 11.1 Taskovi kao GitHub Issues
- Na početku razlomi cijelu specifikaciju (dijelovi 1–10) u **taskove**, otprilike po koracima iz dijela 10, dodatno razbijene gdje su preveliki.
- Svaki task = jedan **GitHub Issue** s: jasnim naslovom, kratkim opisom, i **"Definition of Done"** (popis uvjeta da se task smatra gotovim).
- Predloži cijeli popis issuea vlasniku PRIJE otvaranja, da ih potvrdi.

### 11.2 PR workflow (grana → PR → merge)
Za svaki task:
1. Nova grana s imenom po tasku (npr. `feat/02-claude-api-proxy`).
2. Rad + commitovi smislenih poruka.
3. **Pull Request** koji u opisu sadrži `Closes #<broj issuea>` da se issue automatski zatvori pri mergeu.
4. Merge u glavnu granu nakon što je task gotov.

### 11.3 Granica ovlasti (pročitati pažljivo)
Stvarne GitHub radnje — **objava repozitorija, kreiranje issuea, otvaranje PR-a, merge** — zahtijevaju autentikaciju i odobrenje vlasnika; ne izvode se automatski u pozadini.
- Claude Code **priprema** sve lokalno: kod, commitove, tekst issuea, opis PR-a, te po potrebi gotove `gh` (GitHub CLI) naredbe.
- **Vlasnik pokreće/odobrava** objavu (pokretanjem naredbe ili klikom). Tako vlasnik ostaje kontrolor svega što ide na njegov javni profil.
- Na početku rada: provjeri je li `gh` dostupan i autenticiran; ako nije, daj vlasniku točne upute kako to postaviti, umjesto da pretpostavljaš pristup.

### 11.4 Artefakti napretka (ključno za rad kroz više sesija)
Artefakti **moraju biti u repozitoriju** — nova sesija ne pamti prošlu, vidi samo
datoteke u repou.

- Nakon svakog završenog taska napravi zaseban zapis: `progress/NN-naziv.md`
  (npr. `progress/02-claude-api-proxy.md`), koji sadrži:
  - što je u tasku napravljeno,
  - što radi / kako se testira,
  - što slijedi,
  - poznati problemi / odluke / napomene.
- Održavaj glavni **`PROGRESS.md`** u korijenu repoa kao **kazalo stanja**: popis svih taskova sa statusom (TODO / u tijeku / gotovo), link na issue i na zapis u `progress/`.
- `PROGRESS.md` je uvijek ažuran nakon svakog taska.

### 11.5 Pravilo za početak svake nove sesije
Na početku svake sesije Claude Code **prvo pročita `PROGRESS.md`** (i zadnji zapis u `progress/`), utvrdi zadnji nezavršeni task i nastavi od njega. Ne počinje ispočetka i ne pretpostavlja stanje napamet.

### 11.6 Redoslijed na samom početku projekta
Prije pisanja koda (kao "task 0"):
1. Inicijaliziraj git repo, napravi `README.md` (skica) i `PROGRESS.md` (prazno kazalo).
2. Pripremi popis svih issuea i predloži ga vlasniku.
3. Tek nakon potvrde kreni s task 1.
