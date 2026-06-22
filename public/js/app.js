// Screen router + UI wiring (Issues #1–#4).
// Pure logic lives in profiles.js / conversation.js / api.js; persistence in storage.js.
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
import { sendChat } from './api.js';

const $ = (testid) => document.querySelector(`[data-testid="${testid}"]`);

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
  conversationBack: $('conversation-back'),
  transcript: $('transcript'),
  chatError: $('chat-error'),
  composer: document.getElementById('composer'),
  input: $('message-input'),
  endSession: $('end-session'),
  summaryHome: $('summary-home'),
};

let profiles = [];
let editingId = null;
let session = null;
let sending = false;

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

// ---- Conversation (Issues #2, #4) ----
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
}

function openConversation(id) {
  const profile = findProfile(profiles, id);
  if (!profile) return;
  session = createSession(profile);
  els.greeting.textContent = `Practice session with ${profile.name} (${profile.level})`;
  clearChatError();
  renderTranscript();
  showScreen('conversation');
  els.input.focus();
}

async function onSend(e) {
  e.preventDefault();
  if (!session || sending) return;
  const text = els.input.value.trim();
  if (!text) return;

  clearChatError();
  els.input.value = '';
  session.messages = appendTurn(session.messages, 'user', text);
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

function endSession() {
  showScreen('summary');
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
  els.conversationBack.addEventListener('click', () => showScreen('home'));
  els.composer.addEventListener('submit', onSend);
  els.endSession.addEventListener('click', endSession);
  els.summaryHome.addEventListener('click', () => showScreen('home'));
}

init();
