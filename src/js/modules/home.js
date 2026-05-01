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
        <p class="home-hero-subtitle" style="font-size:1.1rem;opacity:0.9;max-width:700px;margin:0 auto 10px auto;">Deploying equitable AR and AI to overcome financial constraints in Computer Science & Engineering education. No expensive lab equipment required.</p>
        
        ${isOnboarded ? `
          <div style="margin-top:var(--space-6);background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);padding:var(--space-4);border-radius:var(--radius-lg);display:inline-block">
            <p style="color:var(--text-secondary);font-size:var(--text-sm)">Welcome back, <strong>${student?.name || 'Learner'}</strong>! You've studied for <strong>${analytics.totalHours} hours</strong>.</p>
            <div style="margin-top:var(--space-3);display:flex;gap:var(--space-3);justify-content:center">
              <a href="#/ar-learning" class="btn btn-primary" style="padding:10px 24px">🔬 Resume Learning</a>
              <a href="#/ai-assistant" class="btn btn-secondary" style="padding:10px 24px">🤖 AI Feedback</a>
              <button class="btn btn-secondary" id="start-reviewer-demo" style="padding:10px 24px">🎯 Reviewer Demo</button>
            </div>
          </div>
        ` : `
          <div style="margin-top:var(--space-6)">
            <button class="btn btn-primary btn-lg" id="start-onboarding" style="padding:14px 32px;font-size:1.1rem;box-shadow:0 10px 30px rgba(124,58,237,0.3)">🚀 Set Up Profile</button>
            <div style="margin-top:var(--space-3)">
              <button class="btn btn-secondary" id="start-reviewer-demo" style="padding:10px 24px">🎯 Reviewer Demo</button>
            </div>
          </div>
        `}
      </div>

      <!-- Bento Box Module Grid -->
      <div style="margin-top:var(--space-6)">
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:var(--space-4);grid-auto-rows:1fr" class="stagger-children" id="bento-grid">
          <a href="#/ar-learning" class="glass-card bento-card" style="display:flex;flex-direction:column;justify-content:space-between;transition:transform 0.3s;text-decoration:none">
            <div>
              <div style="font-size:1.5rem;font-weight:bold;color:var(--accent-primary);margin-bottom:var(--space-2)">01 / VIRTUAL LAB</div>
              <h3 style="font-family:var(--font-display);font-size:1.2rem;color:var(--text-primary);margin-bottom:var(--space-2)">Cognitive AR Eruption</h3>
              <p style="color:var(--text-secondary);font-size:0.9rem;line-height:1.5">Replacing expensive physical engineering hardware with Neural-Parametric 3D Disassembly. Isolate complex machinery structurally at zero cost.</p>
            </div>
            <div style="margin-top:var(--space-4);padding-top:var(--space-3);border-top:1px solid rgba(255,255,255,0.05);display:flex;flex-direction:column;gap:var(--space-1)">
              <span class="badge badge-info" style="font-size:0.7rem;align-self:flex-start">SCCA Semantic Mesh Eruption</span>
              <span class="badge badge-warning" style="font-size:0.7rem;align-self:flex-start">Draco High-Fidelity Decoders</span>
            </div>
          </a>

          <a href="#/ai-assistant" class="glass-card bento-card" style="display:flex;flex-direction:column;justify-content:space-between;transition:transform 0.3s;background:linear-gradient(145deg, rgba(6,182,212,0.05), transparent);text-decoration:none">
            <div>
              <div style="font-size:1.5rem;font-weight:bold;color:var(--accent-secondary);margin-bottom:var(--space-2)">02 / TUTOR</div>
              <h3 style="font-family:var(--font-display);font-size:1.2rem;color:var(--text-primary);margin-bottom:var(--space-2)">Personalized AI Assistant</h3>
              <p style="color:var(--text-secondary);font-size:0.9rem;line-height:1.5">Solving the lack of personalized academic grading. The AI directly maps your AR 3D interactions to construct a Multi-Dimensional Knowledge Graph.</p>
            </div>
            <div style="margin-top:var(--space-4);padding-top:var(--space-3);border-top:1px solid rgba(255,255,255,0.05)">
              <span class="badge badge-primary" style="font-size:0.7rem">MDKGT Autonomous Pathways</span>
            </div>
          </a>

          <a href="#/skill-barter" class="glass-card bento-card" style="display:flex;flex-direction:column;justify-content:space-between;transition:transform 0.3s;text-decoration:none">
            <div>
              <div style="font-size:1.5rem;font-weight:bold;color:var(--accent-success);margin-bottom:var(--space-2)">03 / PEER NETWORK</div>
              <h3 style="font-family:var(--font-display);font-size:1.2rem;color:var(--text-primary);margin-bottom:var(--space-2)">Skill Barter Marketplace</h3>
              <p style="color:var(--text-secondary);font-size:0.9rem;line-height:1.5">Exchange CSE concepts peer-to-peer. Our Graph algorithm automatically pairs your weakest topics with matching mentors globally.</p>
            </div>
            <div style="margin-top:var(--space-4);padding-top:var(--space-3);border-top:1px solid rgba(255,255,255,0.05)">
              <span class="badge badge-success" style="font-size:0.7rem">N-Way Graph Cycling</span>
            </div>
          </a>

          <a href="#/communication" class="glass-card bento-card" style="display:flex;flex-direction:column;justify-content:space-between;transition:transform 0.3s;grid-column:1 / -1;display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);align-items:center;text-decoration:none;background:linear-gradient(90deg, rgba(124,58,237,0.05), rgba(6,182,212,0.05))">
            <div>
              <div style="font-size:1.5rem;font-weight:bold;color:var(--accent-warning);margin-bottom:var(--space-2)">04 / ACADEMIC SCORING</div>
              <h3 style="font-family:var(--font-display);font-size:1.5rem;color:var(--text-primary);margin-bottom:var(--space-2)">Feynman AR Simulator</h3>
              <p style="color:var(--text-secondary);font-size:0.95rem;line-height:1.5">Improve your academic comprehension. Verbally explain complex AR mechanics to the AI, and receive explicit grading on terminology precision and concept visualization mastery.</p>
              <div style="margin-top:var(--space-4)">
                <span class="badge badge-warning" style="font-size:0.75rem">NLP Terminological Analysis</span>
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

          <a href="#/analytics" class="glass-card bento-card" style="display:flex;flex-direction:column;justify-content:space-between;transition:transform 0.3s;text-decoration:none;background:linear-gradient(135deg, rgba(139,92,246,0.1), rgba(6,182,212,0.05))">
            <div>
              <div style="font-size:1.5rem;font-weight:bold;color:var(--accent-info);margin-bottom:var(--space-2)">05 / DASHBOARD</div>
              <h3 style="font-family:var(--font-display);font-size:1.2rem;color:var(--text-primary);margin-bottom:var(--space-2)">Performance Analytics</h3>
              <p style="color:var(--text-secondary);font-size:0.9rem;line-height:1.5">Academic grading visualizer tracking your exact conceptual mastery over time.</p>
            </div>
            <div style="margin-top:var(--space-4);padding-top:var(--space-3);border-top:1px solid rgba(255,255,255,0.05);display:flex;flex-wrap:wrap;gap:var(--space-1)">
              <span class="badge badge-primary" style="font-size:0.7rem">BACP Normalization</span>
            </div>
          </a>
        </div>
      </div>

      <!-- Research Contributions -->
      <div style="margin-top:var(--space-8)">
        <h2 style="font-family:var(--font-display);font-weight:700;text-align:center;margin-bottom:var(--space-6)">Architectural Problem Solving</h2>
        <div class="home-research-grid">
          <div class="glass-card" style="border-left:3px solid #7C3AED"><strong>Financial Constraints</strong> Avoids expensive lab gear by introducing Latent tensor-driven procedural AR Disassembly.</div>
          <div class="glass-card" style="border-left:3px solid #06B6D4"><strong>Rigid Pedagogy</strong> Creates dynamic academic scoring through the NLP-powered Feynman Simulator.</div>
          <div class="glass-card" style="border-left:3px solid #10B981"><strong>Tutoring Scarcity</strong> N-Way Graph Cycle resolves peer-to-peer barter matchups organically.</div>
          <div class="glass-card" style="border-left:3px solid #F59E0B"><strong>Data Abstraction</strong> Multi-Dimensional Knowledge Graph Traversal ensures implicit learning is strictly documented.</div>
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

  container.querySelector('#start-reviewer-demo')?.addEventListener('click', () => {
    sessionStorage.setItem('eduverse_reviewer_demo', '1');
    window.location.hash = '#/analytics';
  });

  setTimeout(() => staggerAnimation(container, '.home-modules-grid > *', 80), 100);
}
