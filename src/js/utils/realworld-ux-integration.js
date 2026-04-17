// ============================================
// Real-World UX Integration Layer v1.0
// Integrates all UX optimization systems
// ============================================

import { PerformanceOptimizer } from './performance-optimizer.js';
import { LearningAnalytics } from './learning-analytics.js';
import { QuizSystem } from './quiz-system.js';
import { AccessibilitySystem } from './accessibility-system.js';
import { MobileOptimizationSystem } from './mobile-optimization.js';
import { OfflineSupportSystem } from './offline-support.js';
import { ProgressDashboard } from './progress-dashboard.js';

export class RealWorldUXIntegration {
  constructor() {
    this.performanceOptimizer = new PerformanceOptimizer();
    this.analytics = new LearningAnalytics();
    this.quizSystem = new QuizSystem();
    this.accessibility = new AccessibilitySystem();
    this.mobileOptimization = new MobileOptimizationSystem();
    this.offlineSupport = new OfflineSupportSystem();
    this.progressDashboard = new ProgressDashboard();

    this.isInitialized = true;
    console.log('🚀 Real-World UX Integration initialized');
  }

  // Initialize for lesson
  initializeForLesson(lessonKey, lessonData) {
    // Start analytics session
    const session = this.analytics.startSession(lessonData);

    // Initialize progress tracking
    this.progressDashboard.initializeLesson(lessonKey, lessonData);

    // Prefetch adjacent content for offline support
    if (lessonData.concepts) {
      const topics = lessonData.concepts.map(c => c.topic);
      this.offlineSupport.prefetchContent(topics);
    }

    console.log(`📝 Lesson initialized: ${lessonKey}`);
    return session;
  }

  // Start concept view with analytics
  startConceptView(conceptIndex, concept, container) {
    const startTime = Date.now();

    // Track analytics
    this.analytics.trackConceptView(conceptIndex, concept);

    // Record interaction
    this.analytics.recordInteraction('concept_view', { conceptIndex });

    // Apply performance optimization
    const quality = this.mobileOptimization.getRecommendedQuality();

    // Cache concept for offline
    this.offlineSupport.cacheConcept(`concept_${conceptIndex}`, concept);

    return { startTime, quality };
  }

  // End concept view with stats
  endConceptView(conceptIndex, startTime) {
    const duration = (Date.now() - startTime) / 1000; // Convert to seconds

    // Record time
    this.analytics.recordConceptTime(conceptIndex, duration);

    // Update progress
    this.progressDashboard.trackConceptCompletion(
      this.currentLessonKey,
      conceptIndex,
      duration,
      true
    );

    return { duration };
  }

  // Track user interaction
  recordUserInteraction(type, metadata) {
    this.analytics.recordInteraction(type, metadata);
  }

  // Get quiz for topic
  getQuizForTopic(topic) {
    return this.quizSystem.getQuiz(topic);
  }

  // Submit quiz answer
  submitQuizAnswer(quizTopic, questionId, answer) {
    const result = this.quizSystem.checkAnswer(quizTopic, questionId, answer);

    if (result) {
      this.analytics.recordInteraction('quiz_answer', {
        quizTopic,
        isCorrect: result.isCorrect
      });
    }

    return result;
  }

  // Complete quiz
  completeQuiz(quizTopic) {
    const score = this.quizSystem.calculateScore(quizTopic);
    const report = this.quizSystem.getPerformanceReport(quizTopic);

    this.analytics.recordInteraction('quiz_complete', {
      quizTopic,
      score,
      report
    });

    return report;
  }

  // End lesson with full report
  endLesson(lessonKey) {
    // End analytics session
    const sessionReport = this.analytics.endSession();

    // Get progress
    const progressReport = this.progressDashboard.lessons.get(lessonKey);

    // Combine reports
    const fullReport = {
      session: sessionReport,
      progress: progressReport,
      recommendations: this.analytics.getLearningRecommendations(),
      insights: this.progressDashboard.getLearningInsights()
    };

    console.log('📊 Lesson completed with report:', fullReport);
    return fullReport;
  }

  // Create UI elements
  createProgressBar(container, currentConcept, totalConcepts) {
    const percentage = (currentConcept / totalConcepts) * 100;

    const bar = document.createElement('div');
    bar.style.cssText = `
      width: 100%;
      height: 8px;
      background: rgba(255,255,255,0.1);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 16px;
    `;

    const fill = document.createElement('div');
    fill.style.cssText = `
      height: 100%;
      background: linear-gradient(90deg, #3B82F6, #8B5CF6);
      width: ${percentage}%;
      transition: width 0.3s ease;
    `;

    bar.appendChild(fill);
    container.appendChild(bar);

    return bar;
  }

  // Create estimated time UI
  createTimeEstimate(container, conceptIndex, totalConcepts) {
    const estimatedMinutesPerConcept = 5;
    const remaining = totalConcepts - conceptIndex;
    const estimatedTime = remaining * estimatedMinutesPerConcept;

    const timeUI = document.createElement('div');
    timeUI.style.cssText = `
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid #3B82F6;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 16px;
      color: white;
      font-size: 14px;
    `;

    timeUI.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span>⏱️ <strong>Estimated time:</strong></span>
        <span style="font-weight: bold; color: #3B82F6;">${estimatedTime} min</span>
      </div>
      <div style="font-size: 12px; color: #9CA3AF; margin-top: 4px;">
        ${conceptIndex + 1} of ${totalConcepts} concepts
      </div>
    `;

    container.appendChild(timeUI);
    return timeUI;
  }

  // Create difficulty badge
  createDifficultyBadge(container, complexity) {
    const badge = document.createElement('div');
    
    const colorMap = {
      'beginner': '#10B981',
      'intermediate': '#F59E0B',
      'advanced': '#F87171',
      'expert': '#8B5CF6'
    };

    const emoji = {
      'beginner': '🟢',
      'intermediate': '🟡',
      'advanced': '🔴',
      'expert': '🟣'
    };

    badge.style.cssText = `
      display: inline-block;
      padding: 6px 12px;
      background: rgba(${colorMap[complexity] || '#3B82F6'}, 0.2);
      border: 1px solid ${colorMap[complexity] || '#3B82F6'};
      border-radius: 6px;
      color: white;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 12px;
    `;

    badge.textContent = `${emoji[complexity] || '⚪'} ${complexity || 'Medium'}`;
    container.appendChild(badge);
    return badge;
  }

  // Create quiz button
  createQuizButton(container, quizTopic, onClickCallback) {
    const btn = document.createElement('button');
    btn.style.cssText = `
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, #8B5CF6, #3B82F6);
      border: none;
      border-radius: 8px;
      color: white;
      font-weight: 600;
      cursor: pointer;
      margin-top: 12px;
      transition: all 0.3s ease;
    `;

    btn.textContent = '❓ Take Quiz';
    btn.onclick = () => onClickCallback(quizTopic);

    btn.onmouseover = () => {
      btn.style.transform = 'scale(1.05)';
    };

    btn.onmouseout = () => {
      btn.style.transform = 'scale(1)';
    };

    container.appendChild(btn);
    return btn;
  }

  // Create accessibility panel shortcut
  createAccessibilityShortcut(container) {
    const btn = document.createElement('button');
    btn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: linear-gradient(135deg, #8B5CF6, #3B82F6);
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      z-index: 1000;
      transition: all 0.3s ease;
    `;

    btn.textContent = '♿';
    btn.title = 'Accessibility Settings';

    btn.onclick = () => {
      const panel = this.accessibility.createAccessibilityPanel();
      document.body.appendChild(panel);
    };

    btn.onmouseover = () => {
      btn.style.transform = 'scale(1.1)';
    };

    btn.onmouseout = () => {
      btn.style.transform = 'scale(1)';
    };

    document.body.appendChild(btn);
    return btn;
  }

  // Create dashboard
  createDashboard(container) {
    const dashboardUI = this.progressDashboard.createDashboard(container);
    const achievementsUI = this.progressDashboard.createAchievementsUI(container);

    const wrapper = document.createElement('div');
    wrapper.appendChild(dashboardUI);
    wrapper.appendChild(achievementsUI);

    return wrapper;
  }

  // Get device recommendations
  getDeviceRecommendations() {
    const capabilities = this.mobileOptimization.getCapabilities();
    const quality = this.mobileOptimization.getRecommendedQuality();

    return {
      capabilities,
      quality,
      recommendations: {
        shouldReduceParticles: capabilities.performance.cores <= 2,
        shouldLowerResolution: capabilities.screen.pixelRatio > 2,
        shouldOptimizeNetwork: capabilities.performance.network === '2g' || capabilities.performance.network === '3g',
        shouldEnableOfflineMode: false
      }
    };
  }

  // Setup all systems
  setupAllSystems() {
    console.log('🔧 Setting up all UX systems...');

    // Apply accessibility settings
    this.accessibility.applySettings();

    // Setup mobile responsiveness
    this.mobileOptimization.setupViewportMeta();
    this.mobileOptimization.setupResponsiveLayout();
    this.mobileOptimization.setupNetworkMonitoring();

    // Setup offline support
    this.offlineSupport.setupNetworkMonitoring();
    this.offlineSupport.setupOfflineMode();

    // Create accessibility shortcut
    this.createAccessibilityShortcut(document.body);

    console.log('✅ All systems ready');
  }

  // Cleanup
  dispose() {
    this.performanceOptimizer.dispose();
    this.analytics.clearAllData();
    this.quizSystem.clearAllQuizzes();
  }
}

export function createRealWorldUXIntegration() {
  return new RealWorldUXIntegration();
}
