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
  loadProgress,
  saveProgress,
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
import { sendChat, sendSummary, sendGrade } from './api.js';
import { lessonsForLevel, getLesson, lessonOpener, examForLevel } from './course.js';
import { isComplete, levelPercent, markComplete, resetLevel, clearProfile, getExam, setExam } from './progress.js';
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
  course: document.getElementById('screen-course'),
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
  finishLesson: $('finish-lesson'),
  summaryHome: $('summary-home'),
  summaryBody: $('summary-body'),
  historyList: $('history-list'),
  historyEmpty: $('history-empty'),
  historyTitle: $('history-title'),
  historyBack: $('history-back'),
  historyNew: $('history-new'),
  courseList: $('course-list'),
  courseTitle: $('course-title'),
  courseBack: $('course-back'),
  courseNote: $('course-note'),
  courseProgress: $('course-progress'),
  courseBarFill: $('course-bar-fill'),
  coursePercent: $('course-percent'),
  startOver: $('start-over'),
  clearProgress: $('clear-progress'),
  startExam: $('start-exam'),
  examStatus: $('exam-status'),
};

let profiles = [];
let history = [];
let progress = {}; // { [profileId]: { [level]: { completed:[], exam:{} } } } (#40)
let editingId = null;
let session = null;
let currentConvoId = null; // the saved conversation the live session maps to
let historyProfileId = null; // whose history the History screen is showing
let courseProfileId = null; // whose course the Course screen is showing
let lesson = null; // { lessonId } while in a grammar lesson, else null
let examState = null; // { level, profileId, items, idx, correctCount } during an exam, else null
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

    const course = document.createElement('button');
    course.type = 'button';
    course.className = 'btn btn-small';
    course.dataset.testid = 'course-profile';
    course.textContent = '📚 Course';
    course.addEventListener('click', () => openCourse(p.id));

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
    actions.append(start, course, hist, edit);

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
  const data = buildBackup({ profiles, history, progress });
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
  progress = parsed.progress ?? {};
  saveProgress(progress);
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
  if (examState) return submitExamAnswer(trimmed);

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
      lesson: lesson ? { lessonId: lesson.lessonId } : undefined,
    });
    session.messages = appendTurn(session.messages, 'assistant', reply);
    renderTranscript();
    persistSession();
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
  const lessonDef = lesson ? getLesson(lesson.lessonId) : null;
  const extra = lessonDef ? { curriculumId: lessonDef.id, title: `Lesson: ${lessonDef.grammarFocus}` } : {};
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
  els.finishLesson.hidden = true; // shown only in a grammar lesson
  examState = null;
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
  lesson = null;
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
  lesson = null; // resumed chats continue as free conversation
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

// ---- Course: grammar lessons (Issue #8) ----
function openCourse(profileId) {
  courseProfileId = profileId;
  renderCourse();
  showScreen('course');
}

function renderCourse() {
  const profile = findProfile(profiles, courseProfileId);
  const level = profile?.level ?? '';
  els.courseTitle.textContent = profile ? `Course — ${profile.name} (${level})` : 'Course';

  const lessons = lessonsForLevel(level);
  els.courseNote.textContent = lessons.length
    ? `Grammar lessons for your level (${level}), in order.`
    : `No grammar lessons for level ${level} yet — A1, A2 and B1 are available.`;

  // Progress bar + action buttons (#40) — only when this level has lessons.
  const pid = profile?.id;
  const pct = lessons.length ? levelPercent(progress, pid, level, lessons.length) : 0;
  const doneCount = lessons.filter((l) => isComplete(progress, pid, level, l.id)).length;
  els.courseProgress.hidden = lessons.length === 0;
  els.courseBarFill.style.width = `${pct}%`;
  els.coursePercent.textContent = `${pct}% (${doneCount}/${lessons.length})`;
  els.startOver.hidden = lessons.length === 0;
  els.clearProgress.hidden = lessons.length === 0;

  // Level exam entry + saved scores (#41).
  const exam = getExam(progress, pid, level);
  els.startExam.hidden = examForLevel(level).length === 0;
  els.startExam.textContent = exam.initial ? 'Retake the level test' : 'Take the level test';
  if (exam.initial || exam.final) {
    const parts = [];
    if (exam.initial) parts.push(`Placement ${exam.initial.score}/${exam.initial.total}`);
    if (exam.final) parts.push(`Latest ${exam.final.score}/${exam.final.total}`);
    els.examStatus.textContent = parts.join(' · ');
    els.examStatus.hidden = false;
  } else {
    els.examStatus.hidden = true;
    els.examStatus.textContent = '';
  }

  els.courseList.innerHTML = '';
  lessons.forEach((l, i) => {
    const done = isComplete(progress, pid, level, l.id);
    const li = document.createElement('li');
    li.className = done ? 'course-item completed' : 'course-item';
    li.dataset.testid = 'course-item';
    li.dataset.id = l.id;
    li.dataset.complete = done ? 'true' : 'false';

    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'course-open';
    open.dataset.testid = 'start-lesson';
    open.innerHTML =
      `<span class="course-num">${done ? '✓' : i + 1}</span>` +
      `<span class="course-text">` +
      `<span class="course-name">${escapeHtml(l.grammarFocus)}</span>` +
      `<span class="course-goal">${escapeHtml(l.goal)}</span></span>`;
    open.addEventListener('click', () => openLesson(courseProfileId, l.id));

    li.append(open);
    els.courseList.appendChild(li);
  });
}

// Start a grammar lesson: open with the tutor stating today's goal (lessonOpener, shown locally),
// then practice that grammar via the backend lesson prompt (lessonId). "Finish lesson" returns here.
function openLesson(profileId, lessonId) {
  const profile = findProfile(profiles, profileId);
  const lessonDef = getLesson(lessonId);
  if (!profile || !lessonDef) return;
  currentConvoId = null;
  lesson = { lessonId };
  startConversation(profile);
  els.greeting.textContent = `Lesson: ${lessonDef.grammarFocus} — ${profile.name} (${profile.level})`;
  els.finishLesson.hidden = false;

  const opener = lessonOpener(lessonDef);
  session.messages = appendTurn(session.messages, 'assistant', opener);
  renderTranscript();
  persistSession();
  speakReply(opener);
  els.input.focus();
}

// ---- Level exam (Issue #41) ----
function examPromptText(item, i, n) {
  return `Question ${i + 1} of ${n}: ${item.prompt}`;
}

function openExam(profileId) {
  const profile = findProfile(profiles, profileId);
  const items = examForLevel(profile?.level);
  if (!profile || !items.length) return;
  currentConvoId = null;
  lesson = null;
  examState = { level: profile.level, profileId: profile.id, items, idx: 0, correctCount: 0 };
  session = createSession(profile);
  els.greeting.textContent = `Exam: ${profile.level} — answer each question by speaking or typing`;
  els.finishLesson.hidden = true;
  clearChatError();
  setSpeaking(false);
  if (mic) updateMicUI('idle');
  session.messages = appendTurn(session.messages, 'assistant', examPromptText(items[0], 0, items.length));
  renderTranscript();
  showScreen('conversation');
  els.input.focus();
}

async function submitExamAnswer(answer) {
  const item = examState.items[examState.idx];
  clearChatError();
  session.messages = appendTurn(session.messages, 'user', answer);
  renderTranscript();
  setSending(true);
  let verdict;
  try {
    verdict = await sendGrade({ profile: session.profile, itemId: item.id, answer, pin: loadPin() });
  } catch {
    showChatError('Could not grade that answer — check your connection and try again.');
    setSending(false);
    return;
  }
  if (verdict.correct) examState.correctCount += 1;
  const mark = verdict.correct ? '✓ Correct' : '✗ Not quite';
  session.messages = appendTurn(session.messages, 'assistant', verdict.note ? `${mark} — ${verdict.note}` : mark);
  examState.idx += 1;
  if (examState.idx < examState.items.length) {
    const next = examState.items[examState.idx];
    session.messages = appendTurn(session.messages, 'assistant', examPromptText(next, examState.idx, examState.items.length));
    renderTranscript();
  } else {
    finalizeExam();
  }
  setSending(false);
  els.input.focus();
}

function finalizeExam() {
  const total = examState.items.length;
  const score = examState.correctCount;
  const prior = getExam(progress, examState.profileId, examState.level);
  const which = prior.initial ? 'final' : 'initial';
  progress = setExam(progress, examState.profileId, examState.level, which, { score, total, at: Date.now() });
  saveProgress(progress);
  let msg = `Exam complete — you scored ${score}/${total}.`;
  if (which === 'final' && prior.initial) {
    msg += ` Start ${prior.initial.score}/${prior.initial.total} → End ${score}/${total}.`;
  } else {
    msg += ' Saved as your placement — take it again after some lessons to see your progress.';
  }
  session.messages = appendTurn(session.messages, 'assistant', msg);
  renderTranscript();
  examState = null;
}

function finishLesson() {
  stopVoice();
  if (lesson && session?.profile) {
    const lessonDef = getLesson(lesson.lessonId);
    if (lessonDef) {
      progress = markComplete(progress, session.profile.id, lessonDef.level, lessonDef.id);
      saveProgress(progress);
    }
  }
  lesson = null;
  if (courseProfileId) openCourse(courseProfileId);
  else goHome();
}

function leaveConversation(target) {
  examState = null;
  stopVoice();
  showScreen(target);
}

async function endSession() {
  examState = null;
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
  progress = loadProgress();
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
  els.finishLesson.addEventListener('click', finishLesson);
  els.summaryHome.addEventListener('click', () => showScreen('home'));
  els.historyBack.addEventListener('click', goHome);
  els.historyNew.addEventListener('click', () => openConversation(historyProfileId));
  els.courseBack.addEventListener('click', goHome);
  els.startExam.addEventListener('click', () => openExam(courseProfileId));
  els.startOver.addEventListener('click', () => {
    const profile = findProfile(profiles, courseProfileId);
    if (!profile) return;
    if (!window.confirm('Start this level over? Your completed lessons will be unmarked.')) return;
    progress = resetLevel(progress, profile.id, profile.level);
    saveProgress(progress);
    renderCourse();
  });
  els.clearProgress.addEventListener('click', () => {
    const profile = findProfile(profiles, courseProfileId);
    if (!profile) return;
    if (!window.confirm('This will reset your progress. Are you sure?')) return;
    progress = clearProfile(progress, profile.id);
    saveProgress(progress);
    renderCourse();
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
