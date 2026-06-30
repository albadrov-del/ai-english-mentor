// Screen router + UI wiring (Issues #1–#5).
// Pure logic lives in profiles.js / conversation.js / api.js / speech.js; persistence in storage.js.
import {
  LEVELS,
  VOICE_RATE,
  VOICE_PITCH,
  createProfile,
  validateProfile,
  upsertProfile,
  deleteProfile,
  findProfile,
  withVoiceDefaults,
} from './profiles.js';
import {
  loadProfiles,
  saveProfiles,
  loadPin,
  savePin,
  loadHistory,
  saveHistory,
  loadPushToTalk,
  savePushToTalk,
} from './storage.js';
import { createSession, appendTurn } from './conversation.js';
import {
  createConversation,
  updateConversation,
  upsertConversation,
  deleteConversation,
  findConversation,
  listByProfile,
  migrateConversation,
  selectResumeContext,
  buildResumeMessages,
} from './history.js';
import { sendChat, sendSummary } from './api.js';
import { CURRICULUM, getSession, firstPhase, phaseForExchange, levelMatches } from './curriculum.js';
import { buildBackup, parseBackup } from './backup.js';
import {
  getSpeechRecognition,
  isSynthesisSupported,
  createMic,
  speak,
  getVoices,
  pickVoice,
  listEnglishVoices,
} from './speech.js';
import { log, mountDebugPanel } from './log.js';

const $ = (testid) => document.querySelector(`[data-testid="${testid}"]`);
const SPEECH_LANG = 'en-US';
const MIC_SILENCE_MS = 3000; // quiet time before a spoken turn is finalized (#22)
const MIC_MIN_CONFIDENCE = 0.6; // drop final results below this confidence (#33)
const LISTENING_HINT = 'Listening… speak naturally; tap to stop.';

const screens = {
  home: document.getElementById('screen-home'),
  editor: document.getElementById('screen-editor'),
  conversation: document.getElementById('screen-conversation'),
  history: document.getElementById('screen-history'),
  curriculum: document.getElementById('screen-curriculum'),
  summary: document.getElementById('screen-summary'),
};

const els = {
  list: $('profile-list'),
  emptyHint: $('empty-hint'),
  listHint: $('list-hint'),
  newBtn: $('new-profile'),
  pinInput: $('pin-input'),
  pushToTalk: $('push-to-talk'),
  exportBtn: $('export-data'),
  importInput: $('import-file'),
  backupStatus: $('backup-status'),
  form: document.getElementById('profile-form'),
  editorTitle: $('editor-title'),
  name: $('profile-name'),
  level: $('profile-level'),
  interests: $('profile-interests'),
  voice: $('profile-voice'),
  rate: $('profile-rate'),
  pitch: $('profile-pitch'),
  rateValue: $('rate-value'),
  pitchValue: $('pitch-value'),
  delete: $('delete-profile'),
  editorBack: $('editor-back'),
  errName: $('error-name'),
  errLevel: $('error-level'),
  greeting: $('conversation-greeting'),
  avatar: $('avatar'),
  conversationBack: $('conversation-back'),
  transcript: $('transcript'),
  chatError: $('chat-error'),
  mic: $('mic-button'),
  micStatus: $('mic-status'),
  voiceNote: $('voice-unsupported'),
  composer: document.getElementById('composer'),
  input: $('message-input'),
  endSession: $('end-session'),
  summaryHome: $('summary-home'),
  summaryBody: $('summary-body'),
  historyList: $('history-list'),
  historyEmpty: $('history-empty'),
  historyTitle: $('history-title'),
  historyBack: $('history-back'),
  historyNew: $('history-new'),
  curriculumList: $('curriculum-list'),
  curriculumTitle: $('curriculum-title'),
  curriculumBack: $('curriculum-back'),
  curriculumNote: $('curriculum-note'),
  toggleAllLevels: $('toggle-all-levels'),
};

let profiles = [];
let history = [];
let editingId = null;
let session = null;
let currentConvoId = null; // the saved conversation the live session maps to
let historyProfileId = null; // whose history the History screen is showing
let curriculumProfileId = null; // whose lessons the Lessons screen is showing
let curriculumShowAll = false; // override level-gating to show every lesson (#35)
let tutor = null; // { sessionId, phase, exchanges } while in a guided lesson, else null
let sending = false;
let mic = null;
let voiceOut = false;
let availableVoices = [];

function showScreen(name) {
  for (const [key, el] of Object.entries(screens)) el.hidden = key !== name;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]),
  );
}

// ---- Profiles (Issue #1) ----
function populateLevels() {
  els.level.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Select…';
  els.level.appendChild(placeholder);
  for (const lvl of LEVELS) {
    const opt = document.createElement('option');
    opt.value = lvl;
    opt.textContent = lvl;
    els.level.appendChild(opt);
  }
}

function renderHome() {
  els.list.innerHTML = '';
  for (const p of profiles) {
    const li = document.createElement('li');
    li.className = 'profile-item';
    li.dataset.testid = 'profile-item';
    li.dataset.id = p.id;

    const select = document.createElement('button');
    select.type = 'button';
    select.className = 'profile-select';
    select.dataset.testid = 'select-profile';
    select.innerHTML =
      `<span class="profile-name">${escapeHtml(p.name)}</span>` +
      `<span class="profile-level">${escapeHtml(p.level)}</span>`;
    select.addEventListener('click', () => openConversation(p.id));

    const start = document.createElement('button');
    start.type = 'button';
    start.className = 'btn btn-small btn-primary';
    start.dataset.testid = 'start-profile';
    start.textContent = '▶ Start conversation';
    start.addEventListener('click', () => openConversation(p.id));

    const lessons = document.createElement('button');
    lessons.type = 'button';
    lessons.className = 'btn btn-small';
    lessons.dataset.testid = 'lessons-profile';
    lessons.textContent = '📚 Lessons';
    lessons.addEventListener('click', () => openCurriculum(p.id));

    const hist = document.createElement('button');
    hist.type = 'button';
    hist.className = 'btn btn-small';
    hist.dataset.testid = 'history-profile';
    hist.textContent = 'History';
    hist.addEventListener('click', () => openHistory(p.id));

    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'btn btn-small';
    edit.dataset.testid = 'edit-profile';
    edit.textContent = 'Edit';
    edit.addEventListener('click', () => openEditor(p.id));

    const actions = document.createElement('div');
    actions.className = 'profile-actions';
    actions.append(start, lessons, hist, edit);

    li.append(select, actions);
    els.list.appendChild(li);
  }
  els.emptyHint.hidden = profiles.length > 0;
  els.listHint.hidden = profiles.length === 0;
}

function clearErrors() {
  els.errName.hidden = true;
  els.errName.textContent = '';
  els.errLevel.hidden = true;
  els.errLevel.textContent = '';
}

function openEditor(id = null) {
  editingId = id;
  clearErrors();
  const found = id ? findProfile(profiles, id) : null;
  const existing = found ? withVoiceDefaults(found) : null;
  els.editorTitle.textContent = existing ? 'Edit profile' : 'New profile';
  els.name.value = existing ? existing.name : '';
  els.level.value = existing ? existing.level : '';
  els.interests.value = existing ? existing.interests : '';
  els.rate.value = existing ? existing.rate : VOICE_RATE.default;
  els.pitch.value = existing ? existing.pitch : VOICE_PITCH.default;
  populateVoiceOptions(existing ? existing.voiceURI : '');
  syncRangeLabels();
  els.delete.hidden = !existing;
  showScreen('editor');
  els.name.focus();
}

// Fill the voice <select> with English voices (best-ranked first) + an Automatic
// option. Voices are device-provided; a saved voice missing on this device → Automatic.
function populateVoiceOptions(selectedURI = '') {
  availableVoices = getVoices(window);
  els.voice.innerHTML = '';
  const auto = document.createElement('option');
  auto.value = '';
  auto.textContent = 'Automatic (best available)';
  els.voice.appendChild(auto);
  for (const v of listEnglishVoices(availableVoices, SPEECH_LANG)) {
    const opt = document.createElement('option');
    opt.value = v.voiceURI;
    opt.textContent = `${v.name} (${v.lang})`;
    els.voice.appendChild(opt);
  }
  els.voice.value = selectedURI;
  if (els.voice.value !== selectedURI) els.voice.value = ''; // saved voice gone → Automatic
}

function syncRangeLabels() {
  els.rateValue.textContent = Number(els.rate.value).toFixed(1);
  els.pitchValue.textContent = Number(els.pitch.value).toFixed(1);
}

function goHome() {
  editingId = null;
  renderHome();
  showScreen('home');
}

function onSave(e) {
  e.preventDefault();
  clearErrors();
  const fields = {
    name: els.name.value.trim(),
    level: els.level.value,
    interests: els.interests.value.trim(),
    voiceURI: els.voice.value,
    rate: Number(els.rate.value),
    pitch: Number(els.pitch.value),
  };
  const normalized = editingId
    ? withVoiceDefaults({ id: editingId, ...fields })
    : createProfile(fields);

  const { valid, errors } = validateProfile(normalized);
  if (!valid) {
    if (errors.name) {
      els.errName.textContent = errors.name;
      els.errName.hidden = false;
    }
    if (errors.level) {
      els.errLevel.textContent = errors.level;
      els.errLevel.hidden = false;
    }
    return;
  }

  profiles = upsertProfile(profiles, normalized);
  saveProfiles(profiles);
  goHome();
}

function onDelete() {
  if (!editingId) return;
  profiles = deleteProfile(profiles, editingId);
  saveProfiles(profiles);
  goHome();
}

// ---- Backup: export / import (Issue #34) ----
function setBackupStatus(msg, isError = false) {
  els.backupStatus.textContent = msg;
  els.backupStatus.classList.toggle('error', isError);
}

function exportData() {
  const data = buildBackup({ profiles, history });
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ai-english-mentor-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  setBackupStatus(`Exported ${profiles.length} profile(s) and ${history.length} conversation(s).`);
}

async function importData(file) {
  if (!file) return;
  let parsed;
  try {
    parsed = parseBackup(await file.text());
  } catch (err) {
    setBackupStatus(err?.message || 'Could not read that backup.', true);
    return;
  }
  if (
    (profiles.length || history.length) &&
    !window.confirm('Importing will replace your current profiles and conversations. Continue?')
  ) {
    return;
  }
  profiles = parsed.profiles;
  saveProfiles(profiles);
  history = parsed.history;
  saveHistory(history);
  renderHome();
  showScreen('home');
  setBackupStatus(`Imported ${profiles.length} profile(s) and ${history.length} conversation(s).`);
}

// ---- Conversation (Issues #2, #4, #5) ----
function renderTranscript() {
  els.transcript.innerHTML = '';
  for (const m of session.messages) {
    const li = document.createElement('li');
    li.className = `turn turn-${m.role}`;
    li.dataset.role = m.role;
    li.textContent = m.content;
    els.transcript.appendChild(li);
  }
  els.transcript.scrollTop = els.transcript.scrollHeight;
}

function clearChatError() {
  els.chatError.hidden = true;
  els.chatError.textContent = '';
}

function showChatError(msg) {
  els.chatError.textContent = msg;
  els.chatError.hidden = false;
}

function setSending(on) {
  sending = on;
  els.input.disabled = on;
  if (mic) els.mic.disabled = on;
}

function setSpeaking(on) {
  els.avatar.dataset.speaking = on ? 'true' : 'false';
  els.avatar.classList.toggle('speaking', on);
}

function speakReply(text) {
  if (!voiceOut || !text) return;
  const p = withVoiceDefaults(session?.profile ?? {});
  speak({
    text,
    speechSynthesis: window.speechSynthesis,
    Utterance: window.SpeechSynthesisUtterance,
    lang: SPEECH_LANG,
    voice: pickVoice(getVoices(window), { voiceURI: p.voiceURI, lang: SPEECH_LANG }),
    rate: p.rate,
    pitch: p.pitch,
    onStart: () => setSpeaking(true),
    onEnd: () => setSpeaking(false),
  });
}

async function submitText(text) {
  const trimmed = (text ?? '').trim();
  if (!session || sending || !trimmed) return;

  log.debug('chat.send', { chars: trimmed.length });
  clearChatError();
  session.messages = appendTurn(session.messages, 'user', trimmed);
  renderTranscript();
  persistSession(); // keep the user turn even if the reply fails
  setSending(true);

  try {
    const reply = await sendChat({
      profile: session.profile,
      messages: session.messages, // full history → multi-turn context
      pin: loadPin(),
      tutor: tutor ? { sessionId: tutor.sessionId, phase: tutor.phase } : undefined,
    });
    session.messages = appendTurn(session.messages, 'assistant', reply);
    renderTranscript();
    persistSession();
    if (tutor) {
      tutor.exchanges += 1; // drift to the next phase as the lesson progresses
      tutor.phase = phaseForExchange(tutor.exchanges);
    }
    speakReply(reply);
  } catch (err) {
    showChatError(
      err && err.status === 401
        ? 'Wrong or missing PIN — set it in Settings on the home screen.'
        : 'Could not reach the tutor. Check your connection and try again.',
    );
  } finally {
    setSending(false);
    els.input.focus();
  }
}

function onSend(e) {
  e.preventDefault();
  const text = els.input.value;
  els.input.value = '';
  submitText(text);
}

function updateMicUI(state) {
  const listening = state === 'listening';
  els.mic.dataset.state = state;
  els.mic.textContent = listening ? '● Listening…' : '🎤 Speak';
  els.mic.classList.toggle('listening', listening);
  els.micStatus.hidden = !listening;
  if (!listening) els.micStatus.textContent = '';
  else if (!els.micStatus.textContent) els.micStatus.textContent = LISTENING_HINT;
}

// Live partial transcript while the mic is open — shows the app is still capturing.
function showInterim(partial) {
  if (!mic || mic.getState() !== 'listening') return;
  els.micStatus.textContent = partial ? `“${partial}”` : LISTENING_HINT;
}

function stopVoice() {
  if (mic) mic.stop();
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* ignore */
  }
  setSpeaking(false);
}

// Save the live session as a conversation (created on first turn, updated thereafter).
function persistSession() {
  if (!session || session.messages.length === 0) return;
  const lesson = tutor ? getSession(tutor.sessionId) : null;
  const extra = lesson ? { curriculumId: lesson.id, title: lesson.title } : {};
  const existing = currentConvoId ? findConversation(history, currentConvoId) : null;
  const convo = existing
    ? updateConversation(existing, session.messages)
    : createConversation(session.profile, session.messages, extra);
  currentConvoId = convo.id;
  history = upsertConversation(history, convo);
  saveHistory(history);
}

function startConversation(profile) {
  session = createSession(profile);
  els.greeting.textContent = `Practice session with ${profile.name} (${profile.level})`;
  clearChatError();
  setSpeaking(false);
  if (mic) updateMicUI('idle');
  renderTranscript();
  showScreen('conversation');
  els.input.focus();
}

// Start a NEW free conversation for a profile.
function openConversation(id) {
  const profile = findProfile(profiles, id);
  if (!profile) return;
  currentConvoId = null;
  tutor = null;
  startConversation(profile);
}

// ---- History (Issue #25) ----
function openHistory(profileId) {
  historyProfileId = profileId;
  renderHistory();
  showScreen('history');
}

function renderHistory() {
  const profile = findProfile(profiles, historyProfileId);
  els.historyTitle.textContent = profile ? `Past conversations — ${profile.name}` : 'Past conversations';
  const items = listByProfile(history, historyProfileId);
  els.historyList.innerHTML = '';
  for (const c of items) {
    const li = document.createElement('li');
    li.className = 'history-item';
    li.dataset.testid = 'history-item';
    li.dataset.id = c.id;

    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'history-open';
    open.dataset.testid = 'history-continue';
    const when = new Date(c.updatedAt || c.createdAt || Date.now()).toLocaleDateString();
    open.innerHTML =
      `<span class="history-name">${escapeHtml(c.title)}</span>` +
      `<span class="history-meta">${escapeHtml(c.level || '')} · ${escapeHtml(when)}</span>`;
    open.addEventListener('click', () => resumeConversation(c.id));

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'btn btn-small btn-danger';
    del.dataset.testid = 'history-delete';
    del.textContent = 'Delete';
    del.addEventListener('click', () => {
      history = deleteConversation(history, c.id);
      saveHistory(history);
      renderHistory();
    });

    li.append(open, del);
    els.historyList.appendChild(li);
  }
  els.historyEmpty.hidden = items.length > 0;
}

// Continue a saved conversation. Long ones are compacted: summarize the older part
// (via the proxy) and keep the recent turns; short ones resume verbatim.
async function resumeConversation(convoId) {
  const convo = findConversation(history, convoId);
  if (!convo) return;
  const profile = findProfile(profiles, convo.profileId);
  if (!profile) return;

  currentConvoId = convoId;
  tutor = null; // resumed chats continue as free conversation
  const { needsSummary, older, recent } = selectResumeContext(convo.messages);
  startConversation(profile);

  if (!needsSummary) {
    session.messages = buildResumeMessages(recent, '');
    renderTranscript();
    return;
  }

  // Summarize the older part for a brief recap, then resume.
  els.greeting.textContent = `Resuming with ${profile.name} (${profile.level})…`;
  let recap = '';
  try {
    recap = await sendSummary({ profile, messages: older, pin: loadPin() });
  } catch {
    recap = '';
  }
  session.messages = buildResumeMessages(recent, recap);
  els.greeting.textContent = `Practice session with ${profile.name} (${profile.level})`;
  renderTranscript();
}

// ---- Curriculum / tutor mode (Issue #26) ----
function openCurriculum(profileId) {
  curriculumProfileId = profileId;
  curriculumShowAll = false; // default to the learner's level each visit
  renderCurriculum();
  showScreen('curriculum');
}

function renderCurriculum() {
  const profile = findProfile(profiles, curriculumProfileId);
  const level = profile?.level ?? '';
  els.curriculumTitle.textContent = profile ? `Lessons — ${profile.name}` : 'Lessons';

  // Only offer lessons for the learner's level by default (#35); never dead-end on an empty list.
  const matching = CURRICULUM.filter((s) => levelMatches(s.level, level));
  const noMatches = matching.length === 0;
  const showAll = curriculumShowAll || noMatches;
  const list = showAll ? CURRICULUM : matching;

  if (noMatches) els.curriculumNote.textContent = `No lessons tuned to level ${level} yet — showing all.`;
  else if (curriculumShowAll) els.curriculumNote.textContent = 'Showing all levels.';
  else els.curriculumNote.textContent = `Showing lessons for your level (${level}).`;

  const hiddenCount = CURRICULUM.length - matching.length;
  const hasHidden = matching.length > 0 && hiddenCount > 0;
  els.toggleAllLevels.hidden = !hasHidden;
  els.toggleAllLevels.textContent = curriculumShowAll
    ? 'Show only my level'
    : `Show all levels (${hiddenCount} more)`;

  els.curriculumList.innerHTML = '';
  for (const s of list) {
    const li = document.createElement('li');
    li.className = 'curriculum-item';
    li.dataset.testid = 'curriculum-item';
    li.dataset.id = s.id;

    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'curriculum-open';
    open.dataset.testid = 'start-lesson';
    open.innerHTML =
      `<span class="curriculum-name">${escapeHtml(s.title)}</span>` +
      `<span class="curriculum-badges"><span class="badge">${escapeHtml(s.level)}</span>` +
      `<span class="badge badge-${s.type}">${escapeHtml(s.type)}</span></span>` +
      `<span class="curriculum-goal">${escapeHtml(s.goal)}</span>`;
    open.addEventListener('click', () => openTutorSession(curriculumProfileId, s.id));

    li.append(open);
    els.curriculumList.appendChild(li);
  }
}

// Start a guided lesson: open with the curriculum's warm-up as the tutor's first turn,
// then steer through phases via the backend tutor prompt (sessionId + phase).
function openTutorSession(profileId, sessionId) {
  const profile = findProfile(profiles, profileId);
  const lesson = getSession(sessionId);
  if (!profile || !lesson) return;
  currentConvoId = null;
  tutor = { sessionId, phase: firstPhase(), exchanges: 0 };
  startConversation(profile);
  els.greeting.textContent = `Lesson: ${lesson.title} — ${profile.name} (${profile.level})`;

  const warmup = lesson.phases?.warmup;
  if (warmup) {
    session.messages = appendTurn(session.messages, 'assistant', warmup);
    renderTranscript();
    persistSession();
    speakReply(warmup);
  }
  els.input.focus();
}

function leaveConversation(target) {
  stopVoice();
  showScreen(target);
}

async function endSession() {
  stopVoice();
  showScreen('summary');
  if (!session) {
    els.summaryBody.textContent = 'Session ended.';
    return;
  }
  els.summaryBody.dataset.state = 'loading';
  els.summaryBody.textContent = 'Preparing your summary…';
  try {
    const summary = await sendSummary({
      profile: session.profile,
      messages: session.messages,
      pin: loadPin(),
    });
    els.summaryBody.textContent = summary || 'Great work today — keep it up!';
    els.summaryBody.dataset.state = 'ready';
  } catch {
    els.summaryBody.textContent = 'Could not load your summary right now — but great work today! 🎉';
    els.summaryBody.dataset.state = 'error';
  }
}

function setupVoice() {
  const Recognition = getSpeechRecognition(window);
  voiceOut = isSynthesisSupported(window);

  if (Recognition) {
    mic = createMic({
      Recognition,
      lang: SPEECH_LANG,
      silenceMs: MIC_SILENCE_MS,
      minConfidence: MIC_MIN_CONFIDENCE,
      onResult: (text) => submitText(text),
      onInterim: showInterim,
      onStateChange: updateMicUI,
      onError: (errType) => {
        log.warn('mic.error', errType);
        // no-speech / aborted are normal (user paused or stopped) — ignore quietly.
        if (errType !== 'no-speech' && errType !== 'aborted') {
          showChatError('Microphone error — please try again or type your message.');
        }
      },
    });
    els.mic.hidden = false;
    // Tap-to-toggle by default; hold-to-talk when push-to-talk is enabled (#33).
    els.mic.addEventListener('click', () => {
      if (!loadPushToTalk()) mic.toggle();
    });
    els.mic.addEventListener('pointerdown', (e) => {
      if (loadPushToTalk()) {
        e.preventDefault();
        mic.start();
      }
    });
    const releasePtt = () => {
      if (loadPushToTalk() && mic.getState() === 'listening') mic.stop();
    };
    els.mic.addEventListener('pointerup', releasePtt);
    els.mic.addEventListener('pointerleave', releasePtt);
    els.mic.addEventListener('pointercancel', releasePtt);
  } else {
    els.voiceNote.hidden = false;
  }
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const register = () => navigator.serviceWorker.register('sw.js').catch(() => {});
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register);
}

function init() {
  populateLevels();
  profiles = loadProfiles();
  history = loadHistory().map(migrateConversation);
  renderHome();
  showScreen('home');

  els.pinInput.value = loadPin();
  els.pinInput.addEventListener('input', () => savePin(els.pinInput.value.trim()));
  els.pushToTalk.checked = loadPushToTalk();
  els.pushToTalk.addEventListener('change', () => savePushToTalk(els.pushToTalk.checked));
  els.exportBtn.addEventListener('click', exportData);
  els.importInput.addEventListener('change', (e) => {
    importData(e.target.files?.[0]);
    e.target.value = ''; // allow re-importing the same file
  });

  els.newBtn.addEventListener('click', () => openEditor(null));
  els.form.addEventListener('submit', onSave);
  els.rate.addEventListener('input', syncRangeLabels);
  els.pitch.addEventListener('input', syncRangeLabels);
  els.delete.addEventListener('click', onDelete);
  els.editorBack.addEventListener('click', goHome);
  els.conversationBack.addEventListener('click', () => leaveConversation('home'));
  els.composer.addEventListener('submit', onSend);
  els.endSession.addEventListener('click', endSession);
  els.summaryHome.addEventListener('click', () => showScreen('home'));
  els.historyBack.addEventListener('click', goHome);
  els.historyNew.addEventListener('click', () => openConversation(historyProfileId));
  els.curriculumBack.addEventListener('click', goHome);
  els.toggleAllLevels.addEventListener('click', () => {
    curriculumShowAll = !curriculumShowAll;
    renderCurriculum();
  });

  setupVoice();
  // TTS voices often load asynchronously — refresh the cache when they arrive.
  availableVoices = getVoices(window);
  try {
    window.speechSynthesis?.addEventListener?.('voiceschanged', () => {
      availableVoices = getVoices(window);
    });
  } catch {
    /* ignore — synthesis not available */
  }
  registerServiceWorker();
  mountDebugPanel(window);
  log.debug('app ready');
}

init();
