import { createPeerSocket, platformApi, requireAuthOrRedirect, getPlatformUser } from '../utils/platform-api.js';
import { showToast } from '../utils/helpers.js';

let socket = null;
let activeCode = null;
let sharedState = {
  concept: null,
  goal: '',
  component: null,
  ts: Date.now(),
};

export function renderPeerRoom(container) {
  if (!requireAuthOrRedirect()) return;

  const user = getPlatformUser();
  container.innerHTML = `
    <div class="peer-page">
      <div class="section-header">
        <div style="display:flex;align-items:center;gap:var(--space-3)">
          <div class="section-title">Peer Room</div>
          <span class="badge badge-primary">Join by Code</span>
        </div>
        <div class="section-subtitle">Share a code with a friend to review concepts, practice explanations, and give feedback — low bandwidth friendly.</div>
      </div>

      <div class="peer-grid">
        <div class="glass-card peer-card">
          <div class="peer-card-title">Session Code</div>
          <div class="peer-code-row">
            <button class="btn btn-primary" id="peer-create">Create Code</button>
            <input class="input-field" id="peer-code-input" placeholder="Enter code e.g. A7K2Q9" style="text-transform:uppercase;">
            <button class="btn btn-secondary" id="peer-join">Join</button>
          </div>
          <div class="peer-code-display" id="peer-active-code" style="display:none;">
            <div class="peer-code-pill"><span>Room</span> <strong id="peer-code-pill">—</strong></div>
            <div class="peer-code-hint">Share this code on WhatsApp/SMS to invite peers.</div>
          </div>
        </div>

        <div class="glass-card peer-card">
          <div class="peer-card-title">Shared Learning Context</div>
          <div class="peer-context">
            <div class="peer-context-item"><span>Concept</span><strong id="peer-concept">—</strong></div>
            <div class="peer-context-item"><span>Goal</span><strong id="peer-goal">—</strong></div>
            <div class="peer-context-item"><span>Highlighted component</span><strong id="peer-component">—</strong></div>
          </div>
          <div class="peer-actions">
            <button class="btn btn-secondary" id="peer-sync-from-ar">Sync from AR Learning</button>
            <button class="btn btn-ghost" id="peer-send-state">Send Update</button>
          </div>
        </div>

        <div class="glass-card peer-card peer-chat">
          <div class="peer-card-title">Room Chat</div>
          <div class="peer-chat-log" id="peer-chat-log"></div>
          <div class="peer-chat-row">
            <input class="input-field" id="peer-chat-input" placeholder="Ask your peer to explain a component...">
            <button class="btn btn-primary" id="peer-chat-send">Send</button>
          </div>
          <div class="peer-chat-hint">Tip: ask “Explain this in 30 seconds using Definition → Parts → Example → Summary”.</div>
        </div>
      </div>
    </div>
  `;

  setupPeerRoom(container, user);
}

function setupPeerRoom(container, user) {
  const el = (id) => container.querySelector(id);

  const updateContextUI = () => {
    el('#peer-concept').textContent = sharedState.concept || '—';
    el('#peer-goal').textContent = sharedState.goal || '—';
    el('#peer-component').textContent = sharedState.component || '—';
  };
  updateContextUI();

  const ensureSocket = () => {
    if (socket) return socket;
    socket = createPeerSocket();

    socket.on('system', (msg) => {
      if (msg?.message) showToast(`Peer: ${msg.message}`, 'info');
    });
    socket.on('chat', (m) => appendChat(container, m));
    socket.on('state_update', (m) => {
      if (!m?.state) return;
      sharedState = { ...sharedState, ...m.state, ts: Date.now() };
      updateContextUI();
      showToast('✅ Peer updated shared context', 'success');
    });
    socket.on('error', (e) => showToast(e?.error || 'Socket error', 'error'));
    return socket;
  };

  el('#peer-create')?.addEventListener('click', async () => {
    try {
      const data = await platformApi.createSession();
      joinRoom(data.code);
    } catch (e) {
      showToast(e.message || String(e), 'error');
    }
  });

  el('#peer-join')?.addEventListener('click', async () => {
    try {
      const code = el('#peer-code-input')?.value?.trim()?.toUpperCase();
      if (!code) return showToast('Enter a code to join.', 'warning');
      await platformApi.joinSession(code);
      joinRoom(code);
    } catch (e) {
      showToast(e.message || String(e), 'error');
    }
  });

  function joinRoom(code) {
    activeCode = code;
    el('#peer-active-code').style.display = 'block';
    el('#peer-code-pill').textContent = code;
    ensureSocket().emit('join_room', { code });
    showToast(`Joined room ${code}`, 'success');
  }

  el('#peer-sync-from-ar')?.addEventListener('click', () => {
    const last = window.__eduverse_last_visualization || null;
    if (!last) {
      showToast('Open AR Learning and generate a concept first.', 'warning');
      return;
    }
    sharedState = {
      concept: last?.concept?.name || last?.model?.concept || sharedState.concept,
      goal: last?.metadata?.learningGoal || sharedState.goal || '',
      component: last?.metadata?.activeComponent || sharedState.component,
      ts: Date.now(),
    };
    updateContextUI();
    showToast('Synced from AR Learning', 'info');
  });

  el('#peer-send-state')?.addEventListener('click', () => {
    if (!activeCode) return showToast('Create/join a room first.', 'warning');
    ensureSocket().emit('state_update', { code: activeCode, state: sharedState });
    showToast('Sent update to room', 'success');
  });

  el('#peer-chat-send')?.addEventListener('click', () => {
    if (!activeCode) return showToast('Create/join a room first.', 'warning');
    const message = el('#peer-chat-input')?.value?.trim();
    if (!message) return;
    ensureSocket().emit('chat', { code: activeCode, sender: user?.display_name || 'student', message });
    el('#peer-chat-input').value = '';
  });
  el('#peer-chat-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') el('#peer-chat-send')?.click();
  });
}

function appendChat(container, m) {
  const log = container.querySelector('#peer-chat-log');
  if (!log) return;
  const when = new Date(m.ts || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const row = document.createElement('div');
  row.className = 'peer-chat-msg';
  row.innerHTML = `<div class="peer-chat-meta"><strong>${m.sender || 'peer'}</strong><span>${when}</span></div><div class="peer-chat-text">${escapeHtml(m.message || '')}</div>`;
  log.appendChild(row);
  log.scrollTop = log.scrollHeight;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

