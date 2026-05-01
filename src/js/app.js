// ============================================
// EduVerse — Main Application Entry
// ============================================

import { Router } from './router.js';
import { renderHome } from './modules/home.js';
import { renderARLearning } from './modules/ar-learning.js';
import { renderAIAssistant } from './modules/ai-assistant.js';
import { renderSkillBarter } from './modules/skill-barter.js';
import { renderAnalytics } from './modules/analytics.js';
import { renderCommunication } from './modules/communication.js';
import { render3DLearningDashboard } from './modules/3d-dashboard-view.js';
import { renderAuth } from './modules/auth.js';
import { renderPeerRoom } from './modules/peer-room.js';
import { renderCoach } from './modules/coach.js';
import { refreshSidebarAuthUI } from './utils/platform-ui.js';
import { getToken, requireAuthOrRedirect } from './utils/platform-api.js';

// Initialize Router
const router = new Router();
const protectedRoute = (renderFn) => (container) => {
  if (!requireAuthOrRedirect()) return;
  renderFn(container);
};

// Register Routes
router.register('/', protectedRoute(renderHome));
router.register('/ar-learning', protectedRoute(renderARLearning));
router.register('/ai-assistant', protectedRoute(renderAIAssistant));
router.register('/skill-barter', protectedRoute(renderSkillBarter));
router.register('/analytics', protectedRoute(renderAnalytics));
router.register('/communication', protectedRoute(renderCommunication));
router.register('/3d-dashboard', protectedRoute(render3DLearningDashboard));
router.register('/peer', protectedRoute(renderPeerRoom));
router.register('/coach', protectedRoute(renderCoach));
router.register('/auth', (container) => {
  if (getToken()) {
    window.location.hash = '#/';
    return;
  }
  renderAuth(container);
});

// Start
if (!getToken()) {
  window.location.hash = '#/auth';
} else if (!window.location.hash || window.location.hash === '#/auth') {
  window.location.hash = '#/';
}
router.start();
refreshSidebarAuthUI();

// Refresh sidebar auth UI on navigation (hash change)
window.addEventListener('hashchange', () => refreshSidebarAuthUI());

// Global namespace
window.EduVerse = window.EduVerse || {};

console.log('%c EduVerse v1.0 ', 'background: linear-gradient(135deg, #7C3AED, #06B6D4); color: white; font-size: 14px; font-weight: bold; padding: 4px 12px; border-radius: 4px;');
console.log('Research-level Education & Skill Development Platform');
