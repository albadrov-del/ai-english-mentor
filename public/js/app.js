// Screen router + UI wiring for profile selection/editing (Issue #1).
// Pure logic lives in profiles.js; persistence in storage.js. This file is the DOM glue.
import {
  LEVELS,
  createProfile,
  validateProfile,
  upsertProfile,
  deleteProfile,
  findProfile,
} from './profiles.js';
import { loadProfiles, saveProfiles } from './storage.js';

const $ = (testid) => document.querySelector(`[data-testid="${testid}"]`);

const screens = {
  home: document.getElementById('screen-home'),
  editor: document.getElementById('screen-editor'),
  conversation: document.getElementById('screen-conversation'),
};

const els = {
  list: $('profile-list'),
  emptyHint: $('empty-hint'),
  newBtn: $('new-profile'),
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
};

let profiles = [];
let editingId = null;

function showScreen(name) {
  for (const [key, el] of Object.entries(screens)) el.hidden = key !== name;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]),
  );
}

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

function openConversation(id) {
  const p = findProfile(profiles, id);
  if (!p) return;
  els.greeting.textContent = `Practice session with ${p.name} (${p.level})`;
  showScreen('conversation');
}

function init() {
  populateLevels();
  profiles = loadProfiles();
  renderHome();
  showScreen('home');

  els.newBtn.addEventListener('click', () => openEditor(null));
  els.form.addEventListener('submit', onSave);
  els.delete.addEventListener('click', onDelete);
  els.editorBack.addEventListener('click', goHome);
  els.conversationBack.addEventListener('click', () => showScreen('home'));
}

init();
