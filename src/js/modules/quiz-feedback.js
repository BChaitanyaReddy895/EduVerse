// ============================================
// EduVerse — Quiz Feedback Integration
// Bridges quiz scoring with 3D particle effects
// ============================================

import { Dashboard3D } from './3d-learning-dashboard.js';

/**
 * Trigger 3D quiz feedback when students submit quiz answers
 * Call this whenever a quiz is completed or question is answered
 * 
 * @param {boolean} isCorrect - Whether the answer was correct
 * @param {number} accuracy - Accuracy percentage (0-100)
 * @param {string} subject - Subject name (optional)
 */
export function triggerQuizFeedback(isCorrect, accuracy = 0, subject = '') {
  Dashboard3D.triggerQuizFeedback(isCorrect, accuracy);
}

/**
 * Real-time update hook - call this whenever student progress changes
 * This will update all 3D visualizations in the dashboard
 */
export function updateLearningVisualizations() {
  Dashboard3D.updateRealTime();
}

/**
 * Open the 3D dashboard and show a specific visualization
 * @param {string} mode - 'knowledge', 'mastery', 'pathway', or 'all'
 */
export function showLearningDashboard(mode = 'all') {
  // Navigate to dashboard (router will handle this)
  window.location.hash = '#/3d-dashboard';
  
  // Small delay to let page render, then trigger view mode
  setTimeout(() => {
    const modeFns = {
      knowledge: () => Dashboard3D.buildKnowledgeGraph(),
      mastery: () => Dashboard3D.buildMasteryOrganisms(),
      pathway: () => Dashboard3D.buildLessonPathway(),
      all: () => {
        Dashboard3D.buildKnowledgeGraph();
        Dashboard3D.buildMasteryOrganisms();
        Dashboard3D.buildLessonPathway();
      }
    };
    modeFns[mode]?.();
  }, 300);
}

export default {
  triggerQuizFeedback,
  updateLearningVisualizations,
  showLearningDashboard
};
