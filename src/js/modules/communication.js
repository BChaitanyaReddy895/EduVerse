// ============================================
// EduVerse — Communication Trainer (Real-Time)
// LCI computed from live speech/writing data
// ============================================

import { store } from '../utils/data-store.js';
import { calculateTypeTokenRatio, fleschReadingEase, detectFillerWords, showToast, animateValue } from '../utils/helpers.js';

let recognition = null;
let isRecording = false;
let speechText = '';

export function renderCommunication(container) {
  store.logSession('communication', 1);
  const sessions = store.getCommunicationSessions();
  const lastLCI = sessions.length > 0 ? sessions[sessions.length - 1].lci : 0;

  container.innerHTML = `
    <div class="communication-page">
      <div class="section-header">
        <div style="display:flex;align-items:center;gap:var(--space-3)">
          <div class="section-title">Feynman AR Simulator</div>
          <span class="badge badge-primary">NLP Academic Grading</span>
        </div>
        <div class="section-subtitle">Test your academic comprehension by verbally explaining the 3D models you exploded in the AR Lab. </div>
      </div>
      <div style="padding:var(--space-4);background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.2);border-radius:var(--radius-md);margin-bottom:var(--space-4);font-size:var(--text-sm)">
        💡 <strong>How it works:</strong> Click 🎤 to record speech → explain the 3D concepts you just learned → the NLP algorithm scores your: (1) vocabulary structure (Type-Token Ratio), (2) scientific readability (Flesch-Kincaid), and (3) terminology precision.
      </div>
      <!-- LCI Score -->
      <div class="lci-section">
        <div class="lci-score-ring">
          <svg viewBox="0 0 180 180">
            <defs><linearGradient id="lciGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#06B6D4"/><stop offset="100%" stop-color="#10B981"/></linearGradient></defs>
            <circle class="lci-score-bg" cx="90" cy="90" r="78"/>
            <circle class="lci-score-fill" cx="90" cy="90" r="78" id="lci-ring"
              stroke-dasharray="${2*Math.PI*78}"
              stroke-dashoffset="${2*Math.PI*78}" />
          </svg>
          <div class="lci-score-value">
            <div class="lci-score-number" id="lci-num">0</div>
            <div class="lci-score-label">LCI Score</div>
          </div>
        </div>
        <div class="lci-breakdown">
          <div class="lci-metric"><div class="lci-metric-value" id="lci-ttr">—</div><div class="lci-metric-name">Vocabulary Diversity (TTR)</div></div>
          <div class="lci-metric"><div class="lci-metric-value" id="lci-read">—</div><div class="lci-metric-name">Readability Score</div></div>
          <div class="lci-metric"><div class="lci-metric-value" id="lci-filler">—</div><div class="lci-metric-name">Filler Words Found</div></div>
        </div>
      </div>
      <!-- Scenarios -->
      <div>
        <div style="font-weight:700;font-size:var(--text-lg);margin-bottom:var(--space-4)">🎯 Academic Subjects</div>
        <div class="scenarios-grid">
          <div class="scenario-card" data-scenario="cs"><div class="scenario-icon"></div><div class="scenario-name">Computer Science</div><div class="scenario-desc">Explain Sorting Algorithms or Memory Management clearly.</div></div>
          <div class="scenario-card" data-scenario="physics"><div class="scenario-icon"></div><div class="scenario-name">Physics</div><div class="scenario-desc">Explain Thermodynamics or Newton's Laws.</div></div>
          <div class="scenario-card" data-scenario="biology"><div class="scenario-icon"></div><div class="scenario-name">Biology</div><div class="scenario-desc">Describe Cell Division using proper terminology.</div></div>
          <div class="scenario-card" data-scenario="chemistry"><div class="scenario-icon"></div><div class="scenario-name">Chemistry</div><div class="scenario-desc">Explain fluid dynamics or molecular bonding.</div></div>
        </div>
      </div>
      <!-- Speech + Writing -->
      <div class="speech-section">
        <div class="speech-panel">
          <h3 style="font-weight:700;margin-bottom:var(--space-3)">🎤 Speech Practice</h3>
          <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--space-4)">Click the microphone to start recording. Speak clearly — your speech is transcribed and analyzed in real-time.</p>
          <div class="speech-visualizer"><div class="speech-waveform" id="waveform">${Array.from({length:40},()=>'<div class="speech-bar" style="height:4px"></div>').join('')}</div></div>
          <div class="speech-controls">
            <button class="record-btn" id="record-btn" title="Click to start/stop recording">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            </button>
          </div>
          <div id="speech-result" style="margin-top:var(--space-4);font-size:var(--text-sm);color:var(--text-secondary);min-height:80px;padding:var(--space-3);background:var(--bg-tertiary);border-radius:var(--radius-md)">
            <span style="color:var(--text-muted)">Your transcribed speech will appear here...</span>
          </div>
        </div>
        <div class="writing-panel">
          <h3 style="font-weight:700;margin-bottom:var(--space-3)">✍️ Writing Practice</h3>
          <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--space-4)">Write a paragraph on any topic. Real-time analysis updates as you type.</p>
          <textarea class="writing-textarea" id="writing-input" placeholder="Start writing here... Try talking about your favorite subject, a project you worked on, or argue for/against an idea. The LCI algorithm analyzes vocabulary diversity, readability, structure, and filler words in real-time."></textarea>
          <div class="writing-stats" id="writing-stats">
            <div class="writing-stat">Words: <span id="ws-words">0</span></div>
            <div class="writing-stat">TTR: <span id="ws-ttr">0.00</span></div>
            <div class="writing-stat">Readability: <span id="ws-read">—</span></div>
            <div class="writing-stat">Fillers: <span id="ws-filler">0</span></div>
          </div>
          <button class="btn btn-primary btn-sm" id="save-writing" style="margin-top:var(--space-2)">💾 Save & Score Session</button>
        </div>
      </div>
      <!-- Feedback -->
      <div class="feedback-panel" id="feedback-panel">
        <h3 style="font-weight:700;margin-bottom:var(--space-4)">💡 AI Feedback</h3>
        <div style="color:var(--text-secondary);font-size:var(--text-sm)">Record speech or write text above, then save to get personalized feedback.</div>
      </div>
      <!-- Progress -->
      <div class="comm-progress">
        <h3 style="font-weight:700;margin-bottom:var(--space-4)">📊 LCI Progress (${sessions.length} sessions)</h3>
        <canvas id="comm-chart"></canvas>
      </div>
    </div>`;

  setupSpeech(container);
  setupWriting(container);
  setupScenarios(container);
  drawProgressChart(sessions);
}

function computeLCI(text) {
  if (!text || text.trim().length < 10) return { lci: 0, ttr: 0, readability: 0, fillerCount: 0, wordCount: 0 };
  const words = text.split(/\s+/).filter(w => w);
  const wordCount = words.length;
  const ttr = calculateTypeTokenRatio(text);
  const readability = fleschReadingEase(text);
  const fillers = detectFillerWords(text);
  const fillerCount = fillers.count;
  const fillerPenalty = Math.max(0, 1 - fillerCount / Math.max(1, wordCount) * 5);
  const ttrScore = Math.min(1, ttr);
  const readScore = Math.min(1, Math.max(0, readability / 100));
  const lengthBonus = Math.min(1, wordCount / 50);
  const lci = Math.round((ttrScore * 30 + readScore * 30 + fillerPenalty * 25 + lengthBonus * 15));
  return { lci: Math.min(100, Math.max(0, lci)), ttr, readability, fillerCount, wordCount, fillerWords: fillers.words };
}

function updateDisplay(analysis) {
  const el = id => document.getElementById(id);
  if (el('ws-words')) el('ws-words').textContent = analysis.wordCount;
  if (el('ws-ttr')) el('ws-ttr').textContent = analysis.ttr.toFixed(3);
  if (el('ws-read')) el('ws-read').textContent = Math.round(analysis.readability);
  if (el('ws-filler')) el('ws-filler').textContent = analysis.fillerCount;
  if (el('lci-ttr')) el('lci-ttr').textContent = analysis.ttr.toFixed(2);
  if (el('lci-read')) el('lci-read').textContent = Math.round(analysis.readability);
  if (el('lci-filler')) el('lci-filler').textContent = analysis.fillerCount;
  if (el('lci-num')) el('lci-num').textContent = analysis.lci;
  // Update ring
  const ring = el('lci-ring');
  if (ring) ring.setAttribute('stroke-dashoffset', 2 * Math.PI * 78 * (1 - analysis.lci / 100));
}

function generateFeedback(analysis) {
  const feedback = [];
  if (analysis.wordCount < 20) feedback.push({ type: 'tip', text: 'Try to say or write more to get accurate analysis. Aim for at least 50 words.' });
  if (analysis.ttr > 0.7) feedback.push({ type: 'positive', text: `Excellent scientific vocabulary diversity (TTR: ${analysis.ttr.toFixed(2)})! You are explaining concepts clearly without repeating keywords.` });
  else if (analysis.ttr > 0.5) feedback.push({ type: 'tip', text: `Good vocabulary diversity (TTR: ${analysis.ttr.toFixed(2)}). Try using explicit structural names to push above 0.7.` });
  else if (analysis.ttr > 0) feedback.push({ type: 'negative', text: `Low vocabulary diversity (TTR: ${analysis.ttr.toFixed(2)}). You're repeating many terms. Try the Feynman Technique to simplify.` });

  if (analysis.readability > 60) feedback.push({ type: 'positive', text: `Great readability score (${Math.round(analysis.readability)}). Your text is clear and accessible.` });
  else if (analysis.readability > 30) feedback.push({ type: 'tip', text: `Moderate readability (${Math.round(analysis.readability)}). Try shorter sentences for clarity.` });
  else if (analysis.readability > 0) feedback.push({ type: 'negative', text: `Low readability (${Math.round(analysis.readability)}). Simplify sentence structure for better communication.` });

  if (analysis.fillerCount === 0 && analysis.wordCount > 10) feedback.push({ type: 'positive', text: 'No filler words detected! Excellent speech discipline.' });
  else if (analysis.fillerCount > 0) feedback.push({ type: 'negative', text: `Found ${analysis.fillerCount} filler word(s): ${analysis.fillerWords?.slice(0,5).join(', ')}. Practice pausing instead of using fillers.` });

  if (analysis.lci >= 70) feedback.push({ type: 'positive', text: `Strong LCI score of ${analysis.lci}! You communicate effectively.` });
  else if (analysis.lci >= 40) feedback.push({ type: 'tip', text: `LCI of ${analysis.lci} — room to improve. Focus on vocabulary variety and reducing fillers.` });

  return feedback;
}

function setupSpeech(container) {
  const btn = container.querySelector('#record-btn');
  const resultDiv = container.querySelector('#speech-result');
  if (!btn) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    btn.addEventListener('click', () => showToast('Speech API not supported. Try Chrome/Edge.', 'warning'));
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = false; // FIXED: Stops random partial garbage text
  recognition.lang = 'en-US';

  recognition.onresult = (e) => {
    speechText = Array.from(e.results).map(r => r[0].transcript).join(' ');
    if (resultDiv) { resultDiv.textContent = speechText; resultDiv.style.color = 'var(--text-primary)'; }
    updateWaveform(true);
    const analysis = computeLCI(speechText);
    updateDisplay(analysis);
  };

  recognition.onerror = (e) => showToast(`Speech error: ${e.error}. Make sure microphone is allowed.`, 'error');
  recognition.onend = () => {
    if (isRecording) {
      isRecording = false;
      btn.classList.remove('recording');
      updateWaveform(false);
      // Auto-save speech session
      if (speechText.trim().length > 10) {
        const analysis = computeLCI(speechText);
        saveSession('speech', speechText, analysis);
        showFeedback(analysis);
      }
    }
  };

  btn.addEventListener('click', () => {
    if (isRecording) {
      recognition.stop();
      isRecording = false;
      btn.classList.remove('recording');
      showToast('Recording stopped. Session saved.', 'info');
    } else {
      recognition.start();
      isRecording = true;
      btn.classList.add('recording');
      speechText = '';
      showToast('🎤 Recording... Speak clearly. Click again to stop.', 'info');
      updateWaveform(true);
    }
  });
}

function updateWaveform(active) {
  const bars = document.querySelectorAll('.speech-bar');
  if (active) {
    const animate = () => {
      bars.forEach(b => { b.style.height = `${4 + Math.random() * 56}px`; });
      if (isRecording) requestAnimationFrame(() => setTimeout(animate, 80));
    };
    animate();
  } else {
    bars.forEach(b => { b.style.height = '4px'; });
  }
}

function setupWriting(container) {
  const ta = container.querySelector('#writing-input');
  if (!ta) return;
  ta.addEventListener('input', () => {
    const analysis = computeLCI(ta.value);
    updateDisplay(analysis);
  });

  container.querySelector('#save-writing')?.addEventListener('click', () => {
    const text = ta?.value?.trim();
    if (!text || text.length < 10) { showToast('Write at least a few sentences to analyze.', 'warning'); return; }
    const analysis = computeLCI(text);
    saveSession('writing', text, analysis);
    showFeedback(analysis);
    showToast(`✅ Session saved! LCI Score: ${analysis.lci}`, 'success');
  });
}

function setupScenarios(container) {
  container.querySelectorAll('.scenario-card').forEach(card => {
    card.addEventListener('click', () => {
      container.querySelectorAll('.scenario-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const id = card.dataset.scenario;
      const prompts = {
        interview: 'Practice: "Tell me about yourself and why you are a good fit for this role." Speak or write your response.',
        presentation: 'Practice: Give a 2-minute pitch about a project or idea you\'re passionate about.',
        debate: 'Practice: Argue for or against "AI will replace most jobs in 10 years."',
        storytelling: 'Practice: Tell a story about a challenge you overcame and what you learned.'
      };
      showToast(`📋 ${prompts[id] || 'Start practicing!'}`, 'info');
    });
  });
}

function saveSession(type, text, analysis) {
  store.saveCommunicationSession({
    type, text: text.slice(0, 500),
    lci: analysis.lci, ttr: analysis.ttr,
    readability: analysis.readability,
    fillerCount: analysis.fillerCount,
    wordCount: analysis.wordCount
  });
  // Update communication mastery
  const mastery = store.getAllMastery();
  mastery.communication = Math.max(mastery.communication || 0, analysis.lci / 100);
  store.set('knowledge_mastery', mastery);

  // Refresh progress chart
  drawProgressChart(store.getCommunicationSessions());
}

function showFeedback(analysis) {
  const panel = document.getElementById('feedback-panel');
  if (!panel) return;
  const feedback = generateFeedback(analysis);
  panel.innerHTML = `<h3 style="font-weight:700;margin-bottom:var(--space-4)">💡 AI Feedback</h3>
    ${feedback.map(f => `
      <div class="feedback-item ${f.type}" style="padding:var(--space-3);background:var(--bg-tertiary);border-radius:var(--radius-md);margin-bottom:var(--space-2);font-size:var(--text-sm);border-left:3px solid ${f.type==='positive'?'var(--accent-success)':f.type==='negative'?'var(--accent-error)':'var(--accent-warning)'}">
        <span style="font-weight:600;color:${f.type==='positive'?'var(--accent-success)':f.type==='negative'?'var(--accent-error)':'var(--accent-warning)'}">${f.type==='positive'?'✅':f.type==='negative'?'⚠️':'💡'}</span> ${f.text}
      </div>`).join('')}`;
}

function drawProgressChart(sessions) {
  const c = document.getElementById('comm-chart');
  if (!c) return;
  const p = c.parentElement; c.width = p.offsetWidth - 48; c.height = 250;
  const ctx = c.getContext('2d');
  if (sessions.length < 2) {
    ctx.fillStyle = '#475569'; ctx.font = '14px Inter'; ctx.textAlign = 'center';
    ctx.fillText('Complete 2+ sessions to see your LCI progress chart', c.width/2, 125);
    return;
  }
  const pad = { t:20, r:20, b:40, l:40 }; const w = c.width-pad.l-pad.r, h = c.height-pad.t-pad.b;
  for(let i=0;i<=5;i++){const y=pad.t+(h/5)*i;ctx.fillStyle='#475569';ctx.font='10px Inter';ctx.textAlign='right';ctx.fillText(100-i*20,pad.l-8,y+4);ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(c.width-pad.r,y);ctx.strokeStyle='rgba(255,255,255,0.04)';ctx.stroke()}
  sessions.forEach((pt,i)=>{const x=pad.l+(w/(sessions.length-1))*i;ctx.fillStyle='#475569';ctx.textAlign='center';ctx.font='9px Inter';ctx.fillText(`S${i+1}`,x,c.height-10)});
  // Area
  ctx.beginPath();sessions.forEach((pt,i)=>{const x=pad.l+(w/(sessions.length-1))*i,y=pad.t+h-(pt.lci/100)*h;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)});
  ctx.lineTo(pad.l+w,pad.t+h);ctx.lineTo(pad.l,pad.t+h);ctx.closePath();ctx.fillStyle='rgba(6,182,212,0.08)';ctx.fill();
  // Line
  ctx.beginPath();sessions.forEach((pt,i)=>{const x=pad.l+(w/(sessions.length-1))*i,y=pad.t+h-(pt.lci/100)*h;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)});ctx.strokeStyle='#06B6D4';ctx.lineWidth=2.5;ctx.stroke();
  sessions.forEach((pt,i)=>{const x=pad.l+(w/(sessions.length-1))*i,y=pad.t+h-(pt.lci/100)*h;ctx.fillStyle='#06B6D4';ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#0a0a0f';ctx.beginPath();ctx.arc(x,y,2,0,Math.PI*2);ctx.fill()});
}
