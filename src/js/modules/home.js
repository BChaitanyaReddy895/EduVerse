// ============================================
// EduVerse — Home Page with Onboarding
// ============================================

import { store } from '../utils/data-store.js';
import { staggerAnimation, showToast, animateValue } from '../utils/helpers.js';

export function renderHome(container) {
  store.logSession('home', 1);
  const isOnboarded = store.isOnboarded();
  const student = store.getStudent();
  const analytics = store.computeAnalytics();

  container.innerHTML = `
    <div class="home-page" style="max-width:1200px;margin:0 auto">
      <!-- Minimal Hero -->
      <div class="home-hero" style="text-align:center;padding:var(--space-8) var(--space-4);background:radial-gradient(circle at 50% -20%, rgba(124,58,237,0.15), transparent 60%)">
        <div class="home-hero-badge" style="justify-content:center;margin-bottom:var(--space-4)">
          <span class="badge badge-primary">Research-Level Platform</span>
        </div>
        <h1 class="home-hero-title" style="font-size:3.5rem;margin-bottom:var(--space-2)">
          <span style="background:var(--gradient-primary);-webkit-background-clip:text;-webkit-text-fill-color:transparent">EduVerse</span>
        </h1>
        <p class="home-hero-subtitle" style="font-size:1.1rem;opacity:0.8;max-width:600px;margin:0 auto">AI-Powered Immersive Learning Platform with adaptive 3D algorithms.</p>
        
        ${isOnboarded ? `
          <div style="margin-top:var(--space-6);background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);padding:var(--space-4);border-radius:var(--radius-lg);display:inline-block">
            <p style="color:var(--text-secondary);font-size:var(--text-sm)">Welcome back, <strong>${student?.name || 'Learner'}</strong>! You've studied for <strong>${analytics.totalHours} hours</strong>.</p>
            <div style="margin-top:var(--space-3);display:flex;gap:var(--space-3);justify-content:center">
              <a href="#/ar-learning" class="btn btn-primary" style="padding:10px 24px">🔬 Resume Learning</a>
              <a href="#/ai-assistant" class="btn btn-secondary" style="padding:10px 24px">🤖 AI Feedback</a>
            </div>
          </div>
        ` : `
          <div style="margin-top:var(--space-6)">
            <button class="btn btn-primary btn-lg" id="start-onboarding" style="padding:14px 32px;font-size:1.1rem;box-shadow:0 10px 30px rgba(124,58,237,0.3)">🚀 Set Up Profile</button>
          </div>
        `}
      </div>

      <!-- Bento Box Module Grid -->
      <div style="margin-top:var(--space-6)">
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:var(--space-4);grid-auto-rows:1fr" class="stagger-children" id="bento-grid">
          <a href="#/ar-learning" class="glass-card bento-card" style="display:flex;flex-direction:column;justify-content:space-between;transition:transform 0.3s;text-decoration:none">
            <div>
              <div style="font-size:2.5rem;margin-bottom:var(--space-3)">🔬</div>
              <h3 style="font-family:var(--font-display);font-size:1.2rem;color:var(--text-primary);margin-bottom:var(--space-2)">AR Learning Lab v2.0</h3>
              <p style="color:var(--text-secondary);font-size:0.9rem;line-height:1.5">Powered by <strong style="color:var(--accent-primary)">4 novel algorithms</strong>: VSCR adapts rendering fidelity from comprehension. NSTF performs sigmoid model transitions. PGRF creates attention-responsive spotlighting.</p>
            </div>
            <div style="margin-top:var(--space-4);padding-top:var(--space-3);border-top:1px solid rgba(255,255,255,0.05);display:flex;flex-direction:column;gap:var(--space-1)">
              <span class="badge badge-info" style="font-size:0.7rem;align-self:flex-start">VSCR (Comprehension-Adaptive LOD)</span>
              <span class="badge badge-warning" style="font-size:0.7rem;align-self:flex-start">NSTF (Sigmoid Cross-Dissolve)</span>
              <span class="badge badge-success" style="font-size:0.7rem;align-self:flex-start">PGRF + EHDG (Attention + Entropy)</span>
            </div>
          </a>

          <a href="#/ai-assistant" class="glass-card bento-card" style="display:flex;flex-direction:column;justify-content:space-between;transition:transform 0.3s;background:linear-gradient(145deg, rgba(6,182,212,0.05), transparent);text-decoration:none">
            <div>
              <div style="font-size:2.5rem;margin-bottom:var(--space-3)">🤖</div>
              <h3 style="font-family:var(--font-display);font-size:1.2rem;color:var(--text-primary);margin-bottom:var(--space-2)">AI Teaching Assistant</h3>
              <p style="color:var(--text-secondary);font-size:0.9rem;line-height:1.5">MDKGT algorithm finds prerequisite bottlenecks from your quiz history.</p>
            </div>
            <div style="margin-top:var(--space-4);padding-top:var(--space-3);border-top:1px solid rgba(255,255,255,0.05)">
              <span class="badge badge-primary" style="font-size:0.7rem">MDKGT + BKT Trained Models</span>
            </div>
          </a>

          <a href="#/skill-barter" class="glass-card bento-card" style="display:flex;flex-direction:column;justify-content:space-between;transition:transform 0.3s;text-decoration:none">
            <div>
              <div style="font-size:2.5rem;margin-bottom:var(--space-3)">🤝</div>
              <h3 style="font-family:var(--font-display);font-size:1.2rem;color:var(--text-primary);margin-bottom:var(--space-2)">Skill Barter</h3>
              <p style="color:var(--text-secondary);font-size:0.9rem;line-height:1.5">Peer-to-peer exchange network via Hamiltonian cycle resolution.</p>
            </div>
            <div style="margin-top:var(--space-4);padding-top:var(--space-3);border-top:1px solid rgba(255,255,255,0.05)">
              <span class="badge badge-success" style="font-size:0.7rem">N-Way Graph Cycling</span>
            </div>
          </a>

          <a href="#/analytics" class="glass-card bento-card" style="display:flex;flex-direction:column;justify-content:space-between;transition:transform 0.3s;grid-column:1 / -1;display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);align-items:center;text-decoration:none;background:linear-gradient(90deg, rgba(124,58,237,0.05), rgba(6,182,212,0.05))">
            <div>
              <h3 style="font-family:var(--font-display);font-size:1.5rem;color:var(--text-primary);margin-bottom:var(--space-2)">Analytics Dashboard</h3>
              <p style="color:var(--text-secondary);font-size:0.95rem;line-height:1.5">BACP algorithm normalizes your performance against systemic baselines for equitable percentile mapping.</p>
              <div style="margin-top:var(--space-4)">
                <span class="badge badge-warning" style="font-size:0.75rem">Equity-Weighted Gradient Harmonization (EWGH)</span>
              </div>
            </div>
            <div style="display:flex;gap:var(--space-2);justify-content:flex-end">
              <div style="background:rgba(255,255,255,0.05);padding:var(--space-3);border-radius:var(--radius-md);text-align:center">
                <div style="font-size:1.5rem;font-weight:700;color:var(--accent-primary)">24/7</div>
                <div style="font-size:0.7rem;color:var(--text-tertiary)">Real-time Tracking</div>
              </div>
              <div style="background:rgba(255,255,255,0.05);padding:var(--space-3);border-radius:var(--radius-md);text-align:center">
                <div style="font-size:1.5rem;font-weight:700;color:var(--accent-secondary)">100%</div>
                <div style="font-size:0.7rem;color:var(--text-tertiary)">BACP Normalized</div>
              </div>
            </div>
          </a>

          <a href="#/3d-dashboard" class="glass-card bento-card" style="display:flex;flex-direction:column;justify-content:space-between;transition:transform 0.3s;text-decoration:none;background:linear-gradient(135deg, rgba(139,92,246,0.1), rgba(6,182,212,0.05))">
            <div>
              <div style="font-size:2.5rem;margin-bottom:var(--space-3)">🎓</div>
              <h3 style="font-family:var(--font-display);font-size:1.2rem;color:var(--text-primary);margin-bottom:var(--space-2)">3D Learning Visualizer</h3>
              <p style="color:var(--text-secondary);font-size:0.9rem;line-height:1.5">Interactive real-time 3D visualizations of your knowledge graph, mastery growth, quiz feedback, and lesson pathways.</p>
            </div>
            <div style="margin-top:var(--space-4);padding-top:var(--space-3);border-top:1px solid rgba(255,255,255,0.05);display:flex;flex-wrap:wrap;gap:var(--space-1)">
              <span class="badge badge-primary" style="font-size:0.7rem">Real-Time Updates</span>
              <span class="badge badge-success" style="font-size:0.7rem">3D Knowledge Graph</span>
              <span class="badge badge-info" style="font-size:0.7rem">Mastery Growth</span>
              <span class="badge badge-warning" style="font-size:0.7rem">Particle Effects</span>
            </div>
          </a>
        </div>
      </div>

      <!-- Research Contributions -->
      <div style="margin-top:var(--space-8)">
        <h2 style="font-family:var(--font-display);font-weight:700;text-align:center;margin-bottom:var(--space-6)">📄 Novel Research Contributions</h2>
        <div class="home-research-grid">
          <div class="glass-card" style="border-left:3px solid #7C3AED"><strong>VSCR</strong> Volumetric Spatial Comprehension Rendering — adapts 3D LOD from real-time learner comprehension telemetry via SCS(t) = α·G(t) + β·D(t) + γ·T(t) + δ·R(t)</div>
          <div class="glass-card" style="border-left:3px solid #06B6D4"><strong>NSTF</strong> Narrative-Synchronized Temporal Fading — sigmoid cross-dissolve transitions: Opacity(t) = 1/(1+e^(k·(t-t_mid)))</div>
          <div class="glass-card" style="border-left:3px solid #10B981"><strong>PGRF</strong> Perceptual Gaze-Responsive Feedback — attention spotlight: Attention(obj) = max(0, 1 - ||P_cursor - P_obj||²/R²)</div>
          <div class="glass-card" style="border-left:3px solid #F59E0B"><strong>EHDG</strong> Entropic Hierarchical Depth Graph — optimal teaching path via entropy-weighted DAG traversal: H(edge) = -Σp·log₂(p)</div>
          <div class="glass-card" style="border-left:3px solid #EF4444"><strong>SSN</strong> Spatial Sequential Narrative Engine — multi-node interactive lesson delivery with scene-swap and narrative synchronization</div>
          <div class="glass-card" style="border-left:3px solid #3B82F6"><strong>ODT</strong> Ontological Depth Traversal — hierarchical fractal zoom for infinite-scale model exploration</div>
          <div class="glass-card" style="border-left:3px solid #06B6D4"><strong>MDKGT</strong> Multi-Dimensional Knowledge Graph Traversal — prerequisite-aware path optimization through skill hypergraphs</div>
          <div class="glass-card" style="border-left:3px solid #10B981"><strong>BACP</strong> Background-Adaptive Competence Profiling — equity-weighted performance normalization across socioeconomic variables</div>
        </div>
      </div>

      <!-- Onboarding Modal Layer -->
      ${!isOnboarded ? `
      <div id="onboarding-section" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.8);backdrop-filter:blur(10px);z-index:100;align-items:center;justify-content:center;overflow-y:auto;padding:var(--space-4)">
        <div class="glass-card" style="width:100%;max-width:600px;position:relative;animation:slideUp 0.4s ease forwards">
          <button id="close-ob-modal" style="position:absolute;top:20px;right:20px;background:none;border:none;color:var(--text-tertiary);cursor:pointer;font-size:1.2rem">✕</button>
          <div style="text-align:center;margin-bottom:var(--space-6)">
            <h2 style="font-family:var(--font-display);font-size:1.8rem;font-weight:700;color:var(--text-primary)">Set Up Profile</h2>
            <p style="font-size:0.9rem;color:var(--text-secondary);margin-top:var(--space-2)">Enhances personalization with BACP normalizations.</p>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4)">
            <div class="input-group" style="grid-column:1/-1"><label class="input-label">Your Name</label><input class="input-field" id="ob-name" placeholder="E.g., John Doe" required/></div>
            <div class="input-group"><label class="input-label">School Base</label>
              <select class="input-field" id="ob-school"><option value="government">Government</option><option value="private">Private</option><option value="international">International</option></select>
            </div>
            <div class="input-group"><label class="input-label">Location</label>
              <select class="input-field" id="ob-location"><option value="rural">Rural</option><option value="semi_urban">Semi-Urban</option><option value="urban">Urban</option></select>
            </div>
            <div class="input-group"><label class="input-label">Medium</label>
              <select class="input-field" id="ob-medium"><option value="regional">Regional</option><option value="english">English</option></select>
            </div>
            <div class="input-group"><label class="input-label">Internet Status</label>
              <select class="input-field" id="ob-internet"><option value="limited">Limited</option><option value="high">High Speed</option></select>
            </div>
          </div>
          <button class="btn btn-primary" style="margin-top:var(--space-6);width:100%;padding:14px" id="save-profile">✅ Save Profile & Initialize Models</button>
        </div>
      </div>` : ''}

      <style>
        .bento-card:hover { transform: translateY(-5px); border-color: rgba(255,255,255,0.15); box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 768px) {
          .bento-card[style*="grid-column:1 / -1"] { grid-template-columns: 1fr !important; }
        }
      </style>
    </div>`;

  // Event handlers
  container.querySelector('#start-onboarding')?.addEventListener('click', () => {
    document.getElementById('onboarding-section').style.display = 'flex';
  });
  
  container.querySelector('#close-ob-modal')?.addEventListener('click', () => {
    document.getElementById('onboarding-section').style.display = 'none';
  });

  container.querySelector('#save-profile')?.addEventListener('click', () => {
    const name = document.getElementById('ob-name')?.value?.trim();
    if (!name) { showToast('Please enter your name', 'warning'); return; }
    store.saveStudent({
      name,
      email: document.getElementById('ob-email')?.value?.trim() || '',
      level: document.getElementById('ob-level')?.value || '',
      interests: document.getElementById('ob-interests')?.value?.split(',').map(s=>s.trim()) || [],
      background: {
        schoolType: document.getElementById('ob-school')?.value || 'government',
        medium: document.getElementById('ob-medium')?.value || 'regional',
        urbanRural: document.getElementById('ob-location')?.value || 'semi_urban',
        internetAccess: document.getElementById('ob-internet')?.value || 'moderate',
      }
    });
    showToast(`Welcome, ${name}! Your profile is saved. Start exploring!`, 'success');
    renderHome(container); // Re-render
  });

  setTimeout(() => staggerAnimation(container, '.home-modules-grid > *', 80), 100);
}
