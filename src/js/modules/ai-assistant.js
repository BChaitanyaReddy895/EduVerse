// ============================================
// EduVerse — AI Teaching Assistant (Real-Time)
// Uses trained HNS-KGT, ACD-BKT models from JSON
// ============================================

import { store } from '../utils/data-store.js';
import { initializeInference, runInference, getHNS, getBKT, getBACP, isModelLoaded, getModelData } from '../utils/inference.js';
import { Graph, staggerAnimation, showToast } from '../utils/helpers.js';

let knowledgeGraph = null;
let chatMessages = [];
let inferenceResult = null;


export async function renderAIAssistant(container) {
  store.logSession('ai_assistant', 1);

  // Initialize trained models (loads JSON once)
  await initializeInference();
  const modelStatus = isModelLoaded() ? '🟢 Trained Models Loaded' : '🟡 Built-in Fallback';

  const kgData = store.getKnowledgeGraphData();
  knowledgeGraph = new Graph();
  kgData.nodes.forEach(n => knowledgeGraph.addNode(n.id, n));
  kgData.edges.forEach(e => knowledgeGraph.addEdge(e.from, e.to, e.weight, e.type));

  const mastery = store.getAllMastery();
  const student = store.getStudent();

  // Run trained model inference
  const hns = getHNS();
  if (hns) {
    hns.setStudentState(mastery);
    inferenceResult = runInference(mastery, student?.background || {});
  }

  // Update BKT with quiz history
  const bkt = getBKT();
  if (bkt) {
    const quizzes = store.get('quiz_results', []);
    quizzes.forEach(q => {
      const domain = kgData.nodes.find(n => n.label === q.subject)?.id;
      if (domain) bkt.update(domain, q.score > 60);
    });
  }

  const avgMastery = Object.values(mastery).length > 0 ? Math.round(Object.values(mastery).reduce((s,v)=>s+v,0) / Object.values(mastery).length * 100) : 0;
  const weakNodes = kgData.nodes.filter(n => n.mastery < 0.4).sort((a,b) => a.mastery - b.mastery);

  const greeting = student ? `Hello ${student.name}! 👋` : 'Hello! 👋 Please complete onboarding on the Home page to personalize recommendations.';

  // Use trained model recommendations if available
  let initialMsg;
  if (inferenceResult && inferenceResult.recommendations.length > 0) {
    const topRecs = inferenceResult.recommendations.slice(0, 3);
    initialMsg = `${greeting} I've analyzed your knowledge graph using the **trained HNS-KGT model** (loaded from \`trained_models.json\`).\n\n**Top recommendations** (attention-weighted):\n${topRecs.map(r => `• **${r.label}** — priority ${r.priority.toFixed(2)}, mastery ${Math.round(r.mastery*100)}% ${r.ready ? '✅ ready' : '⏳ prereqs needed'}`).join('\n')}\n\nAsk me anything about your learning path!`;
  } else if (weakNodes.length > 0) {
    initialMsg = `${greeting} Your weakest areas: ${weakNodes.slice(0,3).map(n=>`**${n.label}** (${Math.round(n.mastery*100)}%)`).join(', ')}. Take quizzes to build your profile!`;
  } else {
    initialMsg = `${greeting} Start taking quizzes in AR Learning to build your mastery profile!`;
  }

  // NOVELTY: The Generative AR Loop Hook
  const arInteractions = store.get('ar_interactions', []);
  const recentAR = arInteractions.length > 0 ? arInteractions[arInteractions.length - 1] : null;

  if (recentAR && (Date.now() - recentAR.timestamp < 3600000)) { // within 1 hour
    initialMsg = `${greeting} I noticed you were just examining the complex 3D engineering semantics of a **${recentAR.concept}** in the Cognitive AR environment! Based on your successful manual structural isolation of its internal mechanical components (confidence: ${Math.round(recentAR.confidence * 100)}%), I have implicitly upgraded your Engineering structural knowledge graph by +15% without needing a quiz! \n\nHow can I help you traverse your new knowledge graph?`;
  }

  chatMessages = [{ role: 'ai', message: initialMsg }];
  const recommendations = computeMDKGTRecommendations(kgData, mastery);


  container.innerHTML = `
    <div class="ai-assistant-page">
      <div class="section-header">
        <div style="display:flex;align-items:center;gap:var(--space-3)">
          <div class="section-title">AI Teaching Assistant</div>
          <span class="badge badge-primary">MDKGT</span>
        </div>
        <div class="section-subtitle">Multi-Dimensional Knowledge Graph Traversal — recommendations are computed from your real quiz scores and interaction data, not hardcoded.</div>
      </div>
      <div style="padding:var(--space-4);background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.2);border-radius:var(--radius-md);margin-bottom:var(--space-4);font-size:var(--text-sm)">
        💡 <strong>How it works:</strong> Take quizzes in the AR Learning module → your scores update the knowledge graph → the MDKGT algorithm traverses prerequisite and transfer edges to find optimal learning paths and identify bottleneck skills.
      </div>
      <div class="mdkgt-stats">
        <div class="mdkgt-stat-card"><div class="mdkgt-stat-value">${kgData.nodes.length}</div><div class="mdkgt-stat-label">Knowledge Nodes</div></div>
        <div class="mdkgt-stat-card"><div class="mdkgt-stat-value">${kgData.edges.length}</div><div class="mdkgt-stat-label">Connections</div></div>
        <div class="mdkgt-stat-card"><div class="mdkgt-stat-value">${avgMastery}%</div><div class="mdkgt-stat-label">Avg Mastery</div></div>
        <div class="mdkgt-stat-card"><div class="mdkgt-stat-value">${weakNodes.length}</div><div class="mdkgt-stat-label">Weak Areas</div></div>
      </div>
      <div class="knowledge-graph-container"><canvas class="knowledge-graph-canvas" id="kg-canvas"></canvas>
        <div class="kg-legend">
          <div class="kg-legend-item"><div class="kg-legend-dot" style="background:#7C3AED"></div><span>Math</span></div>
          <div class="kg-legend-item"><div class="kg-legend-dot" style="background:#06B6D4"></div><span>Physics</span></div>
          <div class="kg-legend-item"><div class="kg-legend-dot" style="background:#10B981"></div><span>CS</span></div>
          <div class="kg-legend-item"><div class="kg-legend-dot" style="background:#F59E0B"></div><span>Soft Skills</span></div>
        </div>
      </div>
      <div class="ai-chat-section">
        <div class="ai-chat-container">
          <div class="ai-chat-header"><div class="ai-status-dot"></div><div><div style="font-weight:600;font-size:var(--text-sm)">EduVerse AI</div><div style="font-size:var(--text-xs);color:var(--text-tertiary)">MDKGT-powered • responds from your real data</div></div></div>
          <div class="ai-chat-messages" id="chat-messages">${chatMessages.map(m => renderMsg(m)).join('')}</div>
          <div class="ai-chat-input-area">
            <input type="text" class="ai-chat-input" id="chat-input" placeholder="Ask about your learning path, weaknesses, recommendations..." />
            <button class="btn btn-primary" id="chat-send">➤</button>
          </div>
        </div>
        <div class="ai-recommendations">
          <div style="font-weight:700;margin-bottom:var(--space-2)">AI Recommendations</div>
          <div style="font-size:var(--text-xs);color:var(--text-secondary);margin-bottom:var(--space-4)">Computed via MDKGT from your real mastery data</div>
          ${recommendations.map(r => `
            <div class="recommendation-card">
              <div class="recommendation-type ${r.type}">${r.type}</div>
              <div class="recommendation-title">${r.title}</div>
              <div class="recommendation-desc">${r.desc}</div>
              <div class="recommendation-priority">${Array.from({length:5},(_,i)=>`<span class="${i<r.priority?'filled':''}"></span>`).join('')}</div>
            </div>`).join('')}
          <div style="margin-top:var(--space-4);border-top:1px solid var(--border-subtle);padding-top:var(--space-4)">
            <div style="font-weight:600;font-size:var(--text-sm);margin-bottom:var(--space-3)">Skill Mastery</div>
            <div class="skill-mastery-list">
              ${kgData.nodes.map(n => {
                const pct = Math.round(n.mastery * 100);
                const col = {math:'#7C3AED',physics:'#06B6D4',cs:'#10B981',soft:'#F59E0B'}[n.domain]||'#94A3B8';
                return `<div class="skill-mastery-item"><span class="skill-mastery-name">${n.label}</span><div class="skill-mastery-bar"><div class="skill-mastery-fill" style="width:${pct}%;background:${col}"></div></div><span class="skill-mastery-pct">${pct}%</span></div>`;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>`;

  setupChat(container);
  drawKnowledgeGraph(kgData);
}

function computeMDKGTRecommendations(kgData, mastery) {
  const recs = [];
  const nodes = kgData.nodes;
  const edges = kgData.edges;

  // Find weakest nodes with highest incoming prerequisite weight (bottlenecks)
  const weakNodes = nodes.filter(n => n.mastery < 0.4).sort((a,b) => a.mastery - b.mastery);
  const strongNodes = nodes.filter(n => n.mastery > 0.6).sort((a,b) => b.mastery - a.mastery);

  // Bottleneck detection: weak node that blocks many downstream nodes
  weakNodes.forEach(node => {
    const downstream = edges.filter(e => e.from === node.id);
    if (downstream.length > 0) {
      recs.push({
        type: 'weakness',
        title: `Bottleneck: ${node.label}`,
        desc: `At ${Math.round(node.mastery*100)}% mastery, this blocks ${downstream.length} downstream skill(s): ${downstream.map(d => nodes.find(n=>n.id===d.to)?.label).join(', ')}`,
        priority: Math.min(5, downstream.length + 2)
      });
    }
  });

  // Cross-domain transfer opportunities
  edges.filter(e => e.type === 'transfer').forEach(edge => {
    const from = nodes.find(n => n.id === edge.from);
    const to = nodes.find(n => n.id === edge.to);
    if (from && to && from.mastery > 0.5 && to.mastery < 0.4) {
      recs.push({
        type: 'opportunity',
        title: `Transfer: ${from.label} → ${to.label}`,
        desc: `Your ${from.label} (${Math.round(from.mastery*100)}%) knowledge can accelerate ${to.label} (${Math.round(to.mastery*100)}%) via cross-domain transfer`,
        priority: 3
      });
    }
  });

  // Strengths to leverage
  strongNodes.slice(0, 2).forEach(node => {
    recs.push({
      type: 'strength',
      title: `Strength: ${node.label}`,
      desc: `At ${Math.round(node.mastery*100)}% mastery. Consider teaching this on the Skill Barter marketplace to reinforce your knowledge.`,
      priority: 2
    });
  });

  // If no data yet
  if (recs.length === 0) {
    recs.push({ type: 'opportunity', title: 'Start Building Your Profile', desc: 'Take quizzes in the AR Learning module to build your knowledge graph. The AI will then generate personalized recommendations.', priority: 5 });
  }

  return recs.sort((a,b) => b.priority - a.priority).slice(0, 6);
}

function renderMsg(m) {
  return `<div class="chat-message ${m.role}"><div class="chat-avatar ${m.role}">${m.role==='ai'?'AI':'U'}</div><div class="chat-bubble">${m.message.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br/>')}</div></div>`;
}

function setupChat(container) {
  const input = container.querySelector('#chat-input');
  const sendBtn = container.querySelector('#chat-send');
  const msgDiv = container.querySelector('#chat-messages');

  const send = () => {
    const text = input.value.trim();
    if (!text) return;
    chatMessages.push({ role: 'user', message: text });
    msgDiv.innerHTML += renderMsg({ role: 'user', message: text });
    input.value = '';
    msgDiv.scrollTop = msgDiv.scrollHeight;

    // Typing indicator
    const typing = document.createElement('div');
    typing.className = 'chat-message ai';
    typing.innerHTML = `<div class="chat-avatar ai">AI</div><div class="chat-typing"><span></span><span></span><span></span></div>`;
    msgDiv.appendChild(typing);
    msgDiv.scrollTop = msgDiv.scrollHeight;

    setTimeout(() => {
      typing.remove();
      const response = generateResponse(text);
      chatMessages.push({ role: 'ai', message: response });
      msgDiv.innerHTML += renderMsg({ role: 'ai', message: response });
      msgDiv.scrollTop = msgDiv.scrollHeight;
      speakResponse(response);
    }, 800 + Math.random() * 700);
  };

  sendBtn?.addEventListener('click', send);
  input?.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
}

function speakResponse(text) {
  if (!window.speechSynthesis) return;
  // Clean markdown out before speaking
  const cleanText = text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/[^\w\s.,?!]/g, '').slice(0, 300);
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = 1.05;
  utterance.pitch = 1.0;
  
  // Try to use a natural English voice
  const voices = window.speechSynthesis.getVoices();
  const bestVoice = voices.find(v => v.name.includes('Google UK English Female') || v.name.includes('Samantha')) || voices.find(v => v.lang === 'en-US');
  if (bestVoice) utterance.voice = bestVoice;
  
  window.speechSynthesis.speak(utterance);
}

function generateResponse(input) {
  const lower = input.toLowerCase();
  const kgData = store.getKnowledgeGraphData();
  const mastery = store.getAllMastery();
  const analytics = store.computeAnalytics();
  const student = store.getStudent();
  const hns = getHNS();
  const bkt = getBKT();
  const bacp = getBACP();

  if (lower.includes('path') || lower.includes('plan') || lower.includes('roadmap')) {
    if (hns) {
      hns.setStudentState(mastery);
      // Use trained HNS-KGT for optimal path
      const weakHighLevel = hns.nodes.filter(n => n.level >= 3 && (mastery[n.id] || 0) < 0.5)
        .sort((a, b) => (mastery[a.id] || 0) - (mastery[b.id] || 0));
      if (weakHighLevel.length === 0) return 'Your mastery levels look great! Keep practicing to maintain skills.';
      const target = weakHighLevel[0];
      const path = hns.findOptimalPath(target.id);
      const bottlenecks = hns.findBottlenecks();
      return `**HNS-KGT Trained Model Analysis:**\n\nTarget: **${target.label}** (${Math.round((mastery[target.id]||0)*100)}%)\n\n**Optimal path** (attention-weighted by trained neural layer):\n${path.map((p,i) => `${i+1}. **${hns.nodes.find(n=>n.id===p)?.label||p}** — ${Math.round((mastery[p]||0)*100)}%`).join('\n')}\n\n${bottlenecks.length > 0 ? `**⚠️ Bottlenecks** blocking progress:\n${bottlenecks.slice(0,3).map(b => `• **${b.label}** — ${Math.round(b.mastery*100)}% (blocks ${b.downstream} skills)`).join('\n')}` : ''}\n\nGo to AR Learning → take quizzes in these topics.`;
    }
    // Fallback
    const weakest = kgData.nodes.filter(n => n.mastery < 0.4).sort((a,b) => a.mastery - b.mastery);
    if (weakest.length === 0) return 'Mastery looks good! Try the Communication Trainer.';
    const prereqs = kgData.edges.filter(e => e.to === weakest[0].id).map(e => kgData.nodes.find(n => n.id === e.from)).filter(Boolean);
    return `Your weakest: **${weakest[0].label}** (${Math.round(weakest[0].mastery*100)}%).\n\nPrerequisites: ${prereqs.map(p=>`**${p.label}** ${Math.round(p.mastery*100)}%`).join(', ')}`;
  }

  if (lower.includes('predict') || lower.includes('future') || lower.includes('forget') || lower.includes('decay')) {
    if (bkt) {
      const skills = Object.keys(mastery).filter(k => mastery[k] > 0);
      if (skills.length === 0) return 'Take some quizzes first so ACD-BKT can model your forgetting curves!';
      return `**ACD-BKT Trained Model — Forgetting Predictions:**\n\n${skills.slice(0,6).map(s => {
        const k = bkt.getKnowledge(s);
        const h24 = bkt.predictFuture(s, 24);
        const h72 = bkt.predictFuture(s, 72);
        const decayRate = bkt.getDecayRate(s);
        return `• **${kgData.nodes.find(n=>n.id===s)?.label||s}**: Now ${Math.round(k*100)}% → 24h: ${Math.round(h24*100)}% → 72h: ${Math.round(h72*100)}% (decay: ${decayRate.toFixed(3)})`;
      }).join('\n')}\n\n💡 Skills you practice more decay slower (meta-learning). Keep practicing weak skills!`;
    }
    return 'ACD-BKT model not loaded. Run the notebook and refresh.';
  }

  if (lower.includes('bacp') || lower.includes('background') || lower.includes('equit') || lower.includes('fair')) {
    if (bacp && student?.background) {
      const bg = student.background;
      const result = inferenceResult?.bacpScores || {};
      return `**BACP Normalization** (trained from real UCI/xAPI data):\n\nYour background: **${bg.schoolType}** school, **${bg.medium}** medium, **${bg.urbanRural}** area\n\n${Object.entries(result).map(([d, v]) => `• **${d.charAt(0).toUpperCase()+d.slice(1)}**: Raw ${v.raw}% → BACP Percentile: P**${v.percentile}**`).join('\n')}\n\n💡 BACP adjusts for socioeconomic factors using the **EWGH algorithm** trained on real student data.`;
    }
    return 'Complete your profile on the Home page to enable BACP normalization.';
  }

  if (lower.includes('weak') || lower.includes('improve') || lower.includes('help')) {
    if (hns) {
      hns.setStudentState(mastery);
      const recs = hns.recommend(5);
      return `**HNS-KGT Recommendations** (attention-weighted):\n\n${recs.map(r => `• **${r.label}** — priority ${r.priority.toFixed(2)}, mastery ${Math.round(r.mastery*100)}% ${r.ready?'✅ ready':'⏳ prereqs needed'} (att: ${r.attScore.toFixed(2)})`).join('\n')}\n\nThe neural attention layer weighs each edge based on YOUR specific mastery pattern.`;
    }
    const weak = kgData.nodes.filter(n => n.mastery < 0.4).sort((a,b) => a.mastery - b.mastery);
    if (weak.length === 0) return 'No significant weaknesses!';
    return `Weakest areas:\n${weak.slice(0,5).map(n => `• **${n.label}** — ${Math.round(n.mastery*100)}%`).join('\n')}`;
  }

  if (lower.includes('strength') || lower.includes('good') || lower.includes('best')) {
    const strong = kgData.nodes.filter(n => n.mastery > 0.5).sort((a,b) => b.mastery - a.mastery);
    if (strong.length === 0) return 'Take quizzes in AR Learning to reveal your strengths!';
    return `**Your strengths:**\n${strong.map(n => `• **${n.label}** — ${Math.round(n.mastery*100)}% ✅`).join('\n')}\n\nShare these on **Skill Barter** to teach others!`;
  }

  if (lower.includes('model') || lower.includes('algorithm') || lower.includes('trained')) {
    return `**Loaded Models** (from \`trained_models.json\`):\n\n1. **HNS-KGT** — Neural attention weights (5→16→1 network) trained on ${getModelData()?.datasets?.length || 2} datasets\n2. **ACD-BKT** — Bayesian knowledge tracing with adaptive decay (α/β posteriors)\n3. **BACP/EWGH** — Background-adaptive baselines from equity-weighted training\n\n**Knowledge Graph:** ${kgData.nodes.length} nodes, ${kgData.edges.length} edges\n\n💡 Re-train in Colab → download \`trained_models.json\` → place in \`public/models/\` → reload`;
  }

  if (lower.includes('analytics') || lower.includes('score') || lower.includes('progress')) {
    return `**Your stats:**\n• Overall: **${analytics.overallScore}%**\n• Study Hours: **${analytics.totalHours}**\n• Streak: **${analytics.streakDays}** days\n• Quizzes: **${analytics.totalQuizzes}** (avg: ${analytics.avgQuizScore}%)\n\nVisit **Analytics** for BACP-normalized comparisons.`;
  }

  // Default
  const nodeCount = kgData.nodes.length;
  const modelInfo = isModelLoaded() ? '🟢 Trained models active' : '🟡 Using fallback';
  return `${modelInfo} | Knowledge graph: ${nodeCount} nodes\n\nTry asking:\n• "What's my **learning path**?"\n• "**Predict** my forgetting curve"\n• "Show **BACP** normalization"\n• "What are my **weaknesses**?"\n• "What **models** are loaded?"`;
}


function drawKnowledgeGraph(kgData) {
  const canvas = document.getElementById('kg-canvas');
  if (!canvas) return;
  const cont = canvas.parentElement;
  canvas.width = cont.offsetWidth;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  const nodes = kgData.nodes.map(n => ({ ...n, x: n.x*(canvas.width/700), y: n.y*(canvas.height/500), radius: 18 + n.mastery * 18 }));
  let hovered = null, dragged = null, ox = 0, oy = 0;

  canvas.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect(); const mx = e.clientX-r.left, my = e.clientY-r.top;
    if (dragged) { dragged.x = mx-ox; dragged.y = my-oy; return; }
    hovered = null;
    for (const n of nodes) { if (Math.hypot(mx-n.x, my-n.y) < n.radius+5) { hovered = n; canvas.style.cursor='pointer'; return; } }
    canvas.style.cursor = 'grab';
  });
  canvas.addEventListener('mousedown', e => { if (hovered) { dragged=hovered; const r=canvas.getBoundingClientRect(); ox=e.clientX-r.left-hovered.x; oy=e.clientY-r.top-hovered.y; } });
  canvas.addEventListener('mouseup', () => { dragged = null; });

  const domColor = d => ({math:'#7C3AED',physics:'#06B6D4',cs:'#10B981',soft:'#F59E0B'}[d]||'#94A3B8');

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Edges
    kgData.edges.forEach(edge => {
      const from = nodes.find(n=>n.id===edge.from), to = nodes.find(n=>n.id===edge.to);
      if (!from||!to) return;
      ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y);
      if (edge.type==='transfer') { ctx.setLineDash([5,5]); ctx.strokeStyle=`rgba(245,158,11,${0.15+edge.weight*0.2})`; }
      else { ctx.setLineDash([]); ctx.strokeStyle=`rgba(148,163,184,${0.1+edge.weight*0.2})`; }
      ctx.lineWidth=1+edge.weight; ctx.stroke(); ctx.setLineDash([]);
    });
    // Nodes
    nodes.forEach(node => {
      const col = domColor(node.domain); const isH = hovered===node;
      if (isH) { const g=ctx.createRadialGradient(node.x,node.y,0,node.x,node.y,node.radius+20); g.addColorStop(0,col+'40'); g.addColorStop(1,'transparent'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(node.x,node.y,node.radius+20,0,Math.PI*2); ctx.fill(); }
      const grad=ctx.createRadialGradient(node.x,node.y,0,node.x,node.y,node.radius); grad.addColorStop(0,col+'60'); grad.addColorStop(1,col+'20');
      ctx.fillStyle=grad; ctx.beginPath(); ctx.arc(node.x,node.y,node.radius,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle=isH?col:col+'60'; ctx.lineWidth=isH?2.5:1.5; ctx.stroke();
      // Mastery ring
      ctx.beginPath(); ctx.arc(node.x,node.y,node.radius+4,-Math.PI/2,-Math.PI/2+Math.PI*2*node.mastery); ctx.strokeStyle=col; ctx.lineWidth=2; ctx.stroke();
      // Labels
      ctx.fillStyle=isH?'#F1F5F9':'#94A3B8'; ctx.font=`${isH?'600':'500'} ${isH?'11px':'10px'} Inter`; ctx.textAlign='center';
      ctx.fillText(node.label, node.x, node.y+node.radius+16);
      ctx.fillStyle='#F1F5F9'; ctx.font='bold 11px Inter'; ctx.fillText(`${Math.round(node.mastery*100)}%`, node.x, node.y+4);
    });
    requestAnimationFrame(render);
  }
  render();
}
