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

// Initialize Router
const router = new Router();

// Register Routes
router.register('/', renderHome);
router.register('/ar-learning', renderARLearning);
router.register('/ai-assistant', renderAIAssistant);
router.register('/skill-barter', renderSkillBarter);
router.register('/analytics', renderAnalytics);
router.register('/communication', renderCommunication);
router.register('/3d-dashboard', render3DLearningDashboard);

// Start
router.start();

// Global namespace
window.EduVerse = window.EduVerse || {};

console.log('%c EduVerse v1.0 ', 'background: linear-gradient(135deg, #7C3AED, #06B6D4); color: white; font-size: 14px; font-weight: bold; padding: 4px 12px; border-radius: 4px;');
console.log('Research-level Education & Skill Development Platform');
