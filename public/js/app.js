// Screen router + UI wiring (Issues #1–#5).
// Pure logic lives in profiles.js / conversation.js / api.js / speech.js; persistence in storage.js.
import {
  LEVELS,
  createProfile,
  validateProfile,
  upsertProfile,
  deleteProfile,
  findProfile,
} from './profiles.js';
import { loadProfiles, saveProfiles, loadPin, savePin } from './storage.js';
import { createSession, appendTurn } from './conversation.js';
import { sendChat, sendSummary } from './api.js';
import { getSpeechRecognition, isSynthesisSupported, createMic, speak } from './speech.js';

const $ = (testid) => document.querySelector(`[data-testid="${testid}"]`);
const SPEECH_LANG = 'en-US';

const screens = {
  home: document.getElementById('screen-home'),
  editor: document.getElementById('screen-editor'),
  conversation: document.getElementById('screen-conversation'),
  summary: document.getElementById('screen-summary'),
};

const els = {
  list: $('profile-list'),
  emptyHint: $('empty-hint'),
  newBtn: $('new-profile'),
  pinInput: $('pin-input'),
  form: document.getElementById('profile-form'),
  editorTitle: $('editor-title'),
  name: $('profile-name'),
  level: $('profile-level'),
  interests: $('profile-interests'),
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
  voiceNote: $('voice-unsupported'),
  composer: document.getElementById('composer'),
  input: $('message-input'),
  endSession: $('end-session'),
  summaryHome: $('summary-home'),
  summaryBody: $('summary-body'),
};

let profiles = [];
let editingId = null;
let session = null;
let sending = false;
let mic = null;
let voiceOut = false;

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

    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'btn btn-small';
    edit.dataset.testid = 'edit-profile';
    edit.textContent = 'Edit';
    edit.addEventListener('click', () => openEditor(p.id));

    li.append(select, edit);
    els.list.appendChild(li);
  }
  els.emptyHint.hidden = profiles.length > 0;
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
  const existing = id ? findProfile(profiles, id) : null;
  els.editorTitle.textContent = existing ? 'Edit profile' : 'New profile';
  els.name.value = existing ? existing.name : '';
  els.level.value = existing ? existing.level : '';
  els.interests.value = existing ? existing.interests : '';
  els.delete.hidden = !existing;
  showScreen('editor');
  els.name.focus();
}

function goHome() {
  editingId = null;
  renderHome();
  showScreen('home');
}

function onSave(e) {
  e.preventDefault();
  clearErrors();
  const normalized = editingId
    ? {
        id: editingId,
        name: els.name.value.trim(),
        level: els.level.value,
        interests: els.interests.value.trim(),
      }
    : createProfile({
        name: els.name.value,
        level: els.level.value,
        interests: els.interests.value,
      });

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
  speak({
    text,
    speechSynthesis: window.speechSynthesis,
    Utterance: window.SpeechSynthesisUtterance,
    lang: SPEECH_LANG,
    onStart: () => setSpeaking(true),
    onEnd: () => setSpeaking(false),
  });
}

async function submitText(text) {
  const trimmed = (text ?? '').trim();
  if (!session || sending || !trimmed) return;

  clearChatError();
  session.messages = appendTurn(session.messages, 'user', trimmed);
  renderTranscript();
  setSending(true);

  try {
    const reply = await sendChat({
      profile: session.profile,
      messages: session.messages, // full history → multi-turn context
      pin: loadPin(),
    });
    session.messages = appendTurn(session.messages, 'assistant', reply);
    renderTranscript();
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
  els.mic.dataset.state = state;
  els.mic.textContent = state === 'listening' ? '● Listening…' : '🎤 Speak';
  els.mic.classList.toggle('listening', state === 'listening');
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

function openConversation(id) {
  const profile = findProfile(profiles, id);
  if (!profile) return;
  session = createSession(profile);
  els.greeting.textContent = `Practice session with ${profile.name} (${profile.level})`;
  clearChatError();
  setSpeaking(false);
  if (mic) updateMicUI('idle');
  renderTranscript();
  showScreen('conversation');
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
      onResult: (text) => submitText(text),
      onStateChange: updateMicUI,
      onError: (errType) => {
        // no-speech / aborted are normal (user paused or stopped) — ignore quietly.
        if (errType !== 'no-speech' && errType !== 'aborted') {
          showChatError('Microphone error — please try again or type your message.');
        }
      },
    });
    els.mic.hidden = false;
    els.mic.addEventListener('click', () => mic.toggle());
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
  renderHome();
  showScreen('home');

  els.pinInput.value = loadPin();
  els.pinInput.addEventListener('input', () => savePin(els.pinInput.value.trim()));

  els.newBtn.addEventListener('click', () => openEditor(null));
  els.form.addEventListener('submit', onSave);
  els.delete.addEventListener('click', onDelete);
  els.editorBack.addEventListener('click', goHome);
  els.conversationBack.addEventListener('click', () => leaveConversation('home'));
  els.composer.addEventListener('submit', onSend);
  els.endSession.addEventListener('click', endSession);
  els.summaryHome.addEventListener('click', () => showScreen('home'));

  setupVoice();
  registerServiceWorker();
}

init();
