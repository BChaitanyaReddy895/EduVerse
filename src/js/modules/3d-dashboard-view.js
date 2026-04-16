// ============================================
// EduVerse — 3D Learning Dashboard Renderer
// Renders the real-time 3D dashboard page
// ============================================

import { Dashboard3D } from './3d-learning-dashboard.js';
import { store } from '../utils/data-store.js';
import { showToast } from '../utils/helpers.js';

export function render3DLearningDashboard(container) {
  store.logSession('3d-learning-dashboard', 1);

  container.innerHTML = `
    <div class="learning-dashboard-page">
      <div class="section-header">
        <div style="display:flex;align-items:center;gap:var(--space-3)">
          <div class="section-title">🎓 3D Learning Visualization</div>
          <span class="badge badge-primary">Real-Time</span>
        </div>
        <div class="section-subtitle">Interactive knowledge graph, mastery growth, and lesson pathways in stunning 3D.</div>
      </div>

      <!-- Control Panel -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:var(--space-3); margin-bottom:var(--space-5); padding:var(--space-4); background:rgba(59,130,246,0.08); border-radius:var(--radius-lg); border:1px solid rgba(59,130,246,0.2);">
        <button class="btn btn-primary" id="btn-show-knowledge">📊 Knowledge Graph</button>
        <button class="btn btn-secondary" id="btn-show-mastery">🌱 Mastery Growth</button>
        <button class="btn btn-secondary" id="btn-show-pathway">🛣️ Lesson Pathways</button>
        <button class="btn btn-secondary" id="btn-show-all">✨ View All</button>
        <button class="btn btn-secondary" id="btn-reset-view">🔄 Reset View</button>
      </div>

      <!-- 3D Viewport -->
      <div id="dashboard-3d-container" style="
        width:100%;
        height:600px;
        border-radius:var(--radius-xl);
        border:2px solid rgba(139,92,246,0.3);
        overflow:hidden;
        box-shadow:0 0 40px rgba(139,92,246,0.2);
        margin-bottom:var(--space-5);
        background:linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%);
      "></div>

      <!-- Info Panel -->
      <div class="glass-card" style="padding:var(--space-4);">
        <div style="font-weight:700;font-size:var(--text-lg);margin-bottom:var(--space-3)">🔍 Dashboard Guide</div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(250px, 1fr)); gap:var(--space-4);">
          <div>
            <div style="font-weight:600; color:var(--accent-primary); margin-bottom:var(--space-2)">📊 Knowledge Graph</div>
            <div style="font-size:var(--text-sm); color:var(--text-secondary);">Floating nodes represent concepts. Size = mastery %, glow intensity = proficiency. Prerequisites shown as purple/cyan connections.</div>
          </div>
          <div>
            <div style="font-weight:600; color:var(--accent-success); margin-bottom:var(--space-2)">🌱 Mastery Growth</div>
            <div style="font-size:var(--text-sm); color:var(--text-secondary);">Watch subjects transform as your accuracy grows. Physics = rotating atom, Biology = DNA helix, Chemistry = molecules, Engineering = gears. Colored rings show accuracy %.</div>
          </div>
          <div>
            <div style="font-weight:600; color:var(--accent-warning); margin-bottom:var(--space-2)">🛣️ Lesson Pathways</div>
            <div style="font-size:var(--text-sm); color:var(--text-secondary);">Green boxes = completed (≥70%), Orange = in-progress, Gray = locked. Navigate your learning journey step by step.</div>
          </div>
          <div>
            <div style="font-weight:600; color:var(--accent-info); margin-bottom:var(--space-2)">⚡ Real-Time Updates</div>
            <div style="font-size:var(--text-sm); color:var(--text-secondary);">Take a quiz, complete a lesson, and see the 3D visualizations update instantly. Particle effects celebrate correct answers!</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Initialize the 3D dashboard
  const dashboard = Dashboard3D.init('dashboard-3d-container');

  // Build initial visualizations
  Dashboard3D.buildKnowledgeGraph();
  Dashboard3D.buildMasteryOrganisms();
  Dashboard3D.buildLessonPathway();

  // Button handlers
  const infoText = {
    knowledge: '📊 <strong>Knowledge Graph Mode:</strong> Hover over nodes to expand. Prerequisites are shown as colored links. Size reflects your mastery %.',
    mastery: '🌱 <strong>Mastery Mode:</strong> Each subject morphs as you complete lessons. Purple = weakest, Green = strongest.',
    pathway: '🛣️ <strong>Lesson Mode:</strong> Green tiles = ✅ completed, Orange = 🟠 in-progress, Gray = 🔒 not started.',
    all: '✨ <strong>Full View:</strong> All three visualizations together—knowledge, mastery, and pathways.'
  };

  const viewModes = {
    knowledge: () => {
      Dashboard3D.buildKnowledgeGraph();
      showToast(infoText.knowledge, 'info');
    },
    mastery: () => {
      Dashboard3D.buildMasteryOrganisms();
      showToast(infoText.mastery, 'info');
    },
    pathway: () => {
      Dashboard3D.buildLessonPathway();
      showToast(infoText.pathway, 'info');
    },
    all: () => {
      Dashboard3D.buildKnowledgeGraph();
      Dashboard3D.buildMasteryOrganisms();
      Dashboard3D.buildLessonPathway();
      showToast(infoText.all, 'info');
    }
  };

  container.querySelector('#btn-show-knowledge')?.addEventListener('click', viewModes.knowledge);
  container.querySelector('#btn-show-mastery')?.addEventListener('click', viewModes.mastery);
  container.querySelector('#btn-show-pathway')?.addEventListener('click', viewModes.pathway);
  container.querySelector('#btn-show-all')?.addEventListener('click', viewModes.all);

  container.querySelector('#btn-reset-view')?.addEventListener('click', () => {
    Dashboard3D.destroy();
    Dashboard3D.init('dashboard-3d-container');
    viewModes.all();
  });

  // Listen for real-time updates from store
  store.subscribe('subject_progress', () => Dashboard3D.updateRealTime());
  store.subscribe('quiz_scores', () => Dashboard3D.updateRealTime());
  store.subscribe('knowledge_mastery', () => Dashboard3D.updateRealTime());
}
