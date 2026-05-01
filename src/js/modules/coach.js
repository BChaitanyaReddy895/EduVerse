import { platformApi, requireAuthOrRedirect, getPlatformUser } from '../utils/platform-api.js';
import { showToast } from '../utils/helpers.js';
import { store } from '../utils/data-store.js';

let mediaRecorder = null;
let chunks = [];
let recordingStart = 0;
let lastTranscript = '';

export function renderCoach(container) {
  if (!requireAuthOrRedirect()) return;
  const user = getPlatformUser();
  const preferredLanguage = user?.preferred_language || 'en';

  container.innerHTML = `
    <div class="coach-page">
      <div class="section-header">
        <div style="display:flex;align-items:center;gap:var(--space-3)">
          <div class="section-title">Avatar Coach</div>
          <span class="badge badge-primary">Communication + Presentation</span>
        </div>
        <div class="section-subtitle">Practice speaking. Get measurable, personalized feedback — designed for rural/low-resource contexts.</div>
      </div>

      <div class="coach-grid">
        <div class="glass-card coach-card">
          <div class="coach-card-title">Your prompt</div>
          <div class="coach-prompt-row">
            <select class="input-field" id="coach-prompt-type">
              <option value="explain_concept" selected>Explain a concept (Definition → Parts → Example → Summary)</option>
              <option value="interview_intro">Interview intro (“Tell me about yourself”)</option>
              <option value="star_story">STAR story (Situation → Task → Action → Result)</option>
              <option value="presentation_pitch">1-minute presentation pitch</option>
            </select>
            <select class="input-field" id="coach-language">
              <option value="en" ${preferredLanguage === 'en' ? 'selected' : ''}>English</option>
              <option value="hi" ${preferredLanguage === 'hi' ? 'selected' : ''}>Hindi</option>
              <option value="te" ${preferredLanguage === 'te' ? 'selected' : ''}>Telugu</option>
              <option value="ta" ${preferredLanguage === 'ta' ? 'selected' : ''}>Tamil</option>
              <option value="kn" ${preferredLanguage === 'kn' ? 'selected' : ''}>Kannada</option>
              <option value="ml" ${preferredLanguage === 'ml' ? 'selected' : ''}>Malayalam</option>
              <option value="mr" ${preferredLanguage === 'mr' ? 'selected' : ''}>Marathi</option>
              <option value="bn" ${preferredLanguage === 'bn' ? 'selected' : ''}>Bengali</option>
            </select>
          </div>

          <div class="coach-avatar-stage">
            <div class="coach-avatar" id="coach-avatar">
              <div class="coach-face">
                <div class="coach-eye"></div>
                <div class="coach-eye"></div>
                <div class="coach-mouth" id="coach-mouth"></div>
              </div>
              <div class="coach-pulse" id="coach-pulse"></div>
            </div>
            <div class="coach-status">
              <div class="coach-status-title" id="coach-status-title">Ready</div>
              <div class="coach-status-sub" id="coach-status-sub">Press record and speak for ~60 seconds.</div>
            </div>
          </div>

          <div class="coach-actions">
            <button class="btn btn-primary" id="coach-record">🎙️ Record</button>
            <button class="btn btn-secondary" id="coach-stop" disabled>Stop</button>
            <button class="btn btn-ghost" id="coach-use-ar">Use latest AR concept</button>
          </div>

          <div class="coach-transcript">
            <div class="coach-transcript-title">Transcript (browser speech-to-text)</div>
            <textarea class="input-field" id="coach-transcript" rows="6" placeholder="Your transcript will appear here. You can edit it if needed."></textarea>
            <div class="coach-transcript-hint">If speech-to-text is unavailable, type your response and press Analyze.</div>
            <button class="btn btn-primary" id="coach-analyze">Analyze</button>
          </div>
        </div>

        <div class="glass-card coach-card">
          <div class="coach-card-title">Feedback</div>
          <div class="coach-score">
            <div class="coach-score-ring">
              <div class="coach-score-num" id="coach-score">—</div>
              <div class="coach-score-label">Coach Score</div>
            </div>
            <div class="coach-metrics" id="coach-metrics"></div>
          </div>

          <div class="coach-lists">
            <div class="coach-list">
              <div class="coach-list-title">Strengths</div>
              <div id="coach-strengths" class="coach-list-items"></div>
            </div>
            <div class="coach-list">
              <div class="coach-list-title">Improvements</div>
              <div id="coach-improvements" class="coach-list-items"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  setupCoach(container);
}

function setupCoach(container) {
  const btnRecord = container.querySelector('#coach-record');
  const btnStop = container.querySelector('#coach-stop');
  const btnAnalyze = container.querySelector('#coach-analyze');
  const btnUseAR = container.querySelector('#coach-use-ar');
  const transcriptEl = container.querySelector('#coach-transcript');
  const statusTitle = container.querySelector('#coach-status-title');
  const statusSub = container.querySelector('#coach-status-sub');
  const pulse = container.querySelector('#coach-pulse');
  const mouth = container.querySelector('#coach-mouth');

  const promptTypeEl = container.querySelector('#coach-prompt-type');
  const langEl = container.querySelector('#coach-language');

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;
  if (recognition) {
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (e) => {
      const text = Array.from(e.results).map((r) => r[0].transcript).join(' ');
      lastTranscript = text;
      if (transcriptEl) transcriptEl.value = text;
    };
    recognition.onerror = () => {
      showToast('Speech recognition error. You can type your transcript instead.', 'warning');
    };
  }

  btnUseAR?.addEventListener('click', () => {
    const last = window.__eduverse_last_visualization || null;
    if (!last?.concept?.name) return showToast('No recent AR concept found. Use AR Learning first.', 'warning');
    const hint = `Concept: ${last.concept.name}\nGoal: ${last.metadata?.learningGoal || ''}\n\nExplain this in your own words.`;
    transcriptEl.value = hint + '\n\n' + (transcriptEl.value || '');
    showToast('Added AR context to transcript prompt', 'success');
  });

  btnRecord?.addEventListener('click', async () => {
    try {
      chunks = [];
      recordingStart = Date.now();
      statusTitle.textContent = 'Listening';
      statusSub.textContent = 'Speak clearly. Aim for 45–90 seconds.';
      pulse.classList.add('active');
      mouth.classList.add('talking');

      if (recognition) {
        const lang = langEl.value || 'en';
        const map = {
          en: 'en-US',
          hi: 'hi-IN',
          te: 'te-IN',
          ta: 'ta-IN',
          kn: 'kn-IN',
          ml: 'ml-IN',
          mr: 'mr-IN',
          bn: 'bn-IN',
        };
        recognition.lang = map[lang] || 'en-US';
        recognition.start();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorder.start();

      btnRecord.disabled = true;
      btnStop.disabled = false;
      showToast('Recording started', 'info');
    } catch (e) {
      showToast('Microphone permission denied. Type your response instead.', 'error');
      statusTitle.textContent = 'Mic blocked';
      statusSub.textContent = 'Enable microphone permissions or type transcript.';
      pulse.classList.remove('active');
      mouth.classList.remove('talking');
    }
  });

  btnStop?.addEventListener('click', () => stopRecording(container, { recognition, btnRecord, btnStop, statusTitle, statusSub, pulse, mouth }));

  btnAnalyze?.addEventListener('click', async () => {
    const transcript = (transcriptEl.value || '').trim();
    if (transcript.length < 10) return showToast('Transcript too short.', 'warning');
    const duration_ms = recordingStart ? Date.now() - recordingStart : 0;
    const language = langEl.value || 'en';
    const prompt_type = promptTypeEl.value || 'explain_concept';
    try {
      statusTitle.textContent = 'Analyzing';
      statusSub.textContent = 'Generating feedback…';
      const res = await platformApi.analyzeCoach({ transcript, duration_ms, language, prompt_type });
      renderFeedback(container, res);
      store.saveCommunicationSession({
        type: 'coach',
        text: transcript.slice(0, 800),
        lci: Math.round((res.score || 0) * 100),
        wordCount: res.metrics?.word_count,
        date: Date.now(),
      });
      showToast('✅ Feedback ready', 'success');
      statusTitle.textContent = 'Ready';
      statusSub.textContent = 'Try again and improve your score.';
    } catch (e) {
      showToast(e.message || String(e), 'error');
      statusTitle.textContent = 'Error';
      statusSub.textContent = 'Could not analyze. Check server.';
    }
  });
}

function stopRecording(container, ctx) {
  const { recognition, btnRecord, btnStop, statusTitle, statusSub, pulse, mouth } = ctx;
  try {
    if (recognition) recognition.stop();
  } catch {}
  try {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  } catch {}

  btnRecord.disabled = false;
  btnStop.disabled = true;
  pulse.classList.remove('active');
  mouth.classList.remove('talking');
  statusTitle.textContent = 'Recorded';
  statusSub.textContent = 'Edit transcript if needed, then press Analyze.';
  showToast('Recording stopped', 'info');
}

function renderFeedback(container, res) {
  const scoreEl = container.querySelector('#coach-score');
  const strengthsEl = container.querySelector('#coach-strengths');
  const improvementsEl = container.querySelector('#coach-improvements');
  const metricsEl = container.querySelector('#coach-metrics');

  if (scoreEl) scoreEl.textContent = `${Math.round((res.score || 0) * 100)}`;

  const m = res.metrics || {};
  if (metricsEl) {
    metricsEl.innerHTML = `
      <div class="coach-metric"><span>WPM</span><strong>${m.wpm ?? '—'}</strong></div>
      <div class="coach-metric"><span>Words</span><strong>${m.word_count ?? '—'}</strong></div>
      <div class="coach-metric"><span>Fillers</span><strong>${m.filler_count ?? '—'}</strong></div>
      <div class="coach-metric"><span>Sentence len</span><strong>${m.avg_sentence_len ?? '—'}</strong></div>
    `;
  }

  strengthsEl.innerHTML = (res.strengths || []).map((s) => `<div class="coach-chip good">✅ ${escapeHtml(s)}</div>`).join('') || `<div class="coach-empty">No strengths detected yet — try a longer response.</div>`;
  improvementsEl.innerHTML = (res.improvements || []).map((s) => `<div class="coach-chip warn">💡 ${escapeHtml(s)}</div>`).join('') || `<div class="coach-empty">Great job — keep practicing.</div>`;
}

function escapeHtml(s) {
  return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

