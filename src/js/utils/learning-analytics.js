// ============================================
// Learning Analytics & Progress Tracking v1.0
// User progress, mastery, time tracking
// ============================================

export class LearningAnalytics {
  constructor() {
    this.sessions = [];
    this.conceptProgress = new Map();
    this.userStats = {
      totalLearningTime: 0,
      lessonsCompleted: 0,
      conceptsMastered: 0,
      lastSessionDate: null,
      totalSessions: 0,
      averageAccuracy: 0
    };
    
    this.loadFromStorage();
    console.log('📊 Learning Analytics initialized');
  }

  // Start a learning session
  startSession(lesson) {
    const session = {
      id: this.generateSessionId(),
      lesson,
      startTime: Date.now(),
      concepts: new Map(),
      timePerConcept: new Map(),
      interactionsCount: 0,
      gesturesCount: 0,
      voiceCommandsCount: 0,
      conceptsViewed: []
    };
    
    this.currentSession = session;
    return session;
  }

  // Track concept viewing
  trackConceptView(conceptIndex, concept) {
    if (!this.currentSession) return;
    
    const viewData = {
      conceptIndex,
      conceptTitle: concept.title,
      viewedAt: Date.now(),
      duration: 0
    };
    
    if (!this.conceptProgress.has(conceptIndex)) {
      this.conceptProgress.set(conceptIndex, {
        title: concept.title,
        viewCount: 0,
        totalTimeSpent: 0,
        lastViewed: null,
        mastered: false,
        difficulty: 'medium'
      });
    }
    
    const progress = this.conceptProgress.get(conceptIndex);
    progress.viewCount++;
    progress.lastViewed = Date.now();
    
    this.currentSession.conceptsViewed.push(viewData);
  }

  // Track time spent on concept
  recordConceptTime(conceptIndex, timeSpent) {
    const progress = this.conceptProgress.get(conceptIndex);
    if (progress) {
      progress.totalTimeSpent += timeSpent;
      
      // Mastery calculation: >2 minutes = likely mastered
      if (progress.totalTimeSpent > 120) {
        progress.mastered = true;
      }
    }
  }

  // Track user interactions
  recordInteraction(type, metadata = {}) {
    if (!this.currentSession) return;
    
    this.currentSession.interactionsCount++;
    
    if (type === 'gesture') this.currentSession.gesturesCount++;
    if (type === 'voice') this.currentSession.voiceCommandsCount++;
    
    console.log(`📈 Interaction tracked: ${type}`, metadata);
  }

  // End session and calculate stats
  endSession() {
    if (!this.currentSession) return;
    
    this.currentSession.endTime = Date.now();
    this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;
    
    // Update user stats
    this.userStats.totalLearningTime += this.currentSession.duration;
    this.userStats.totalSessions++;
    this.userStats.lastSessionDate = new Date().toISOString();
    
    this.sessions.push(this.currentSession);
    this.saveToStorage();
    
    return this.generateSessionReport();
  }

  // Generate session report
  generateSessionReport() {
    const session = this.currentSession;
    
    const report = {
      duration: Math.round(session.duration / 1000), // seconds
      conceptsViewed: session.conceptsViewed.length,
      averageTimePerConcept: Math.round((session.duration / session.conceptsViewed.length) / 1000),
      interactions: session.interactionsCount,
      gestures: session.gesturesCount,
      voiceCommands: session.voiceCommandsCount,
      engagementScore: this.calculateEngagementScore(session),
      learningEfficiency: this.calculateEfficiency(session)
    };
    
    return report;
  }

  // Calculate engagement score (0-100)
  calculateEngagementScore(session) {
    let score = 0;
    
    // Time spent (max 30 points)
    score += Math.min((session.duration / 60000) * 10, 30);
    
    // Interactions (max 30 points)
    score += Math.min((session.interactionsCount / 10) * 10, 30);
    
    // Concept exploration (max 40 points)
    score += Math.min((session.conceptsViewed.length / 8) * 40, 40);
    
    return Math.round(score);
  }

  // Calculate learning efficiency
  calculateEfficiency(session) {
    const concepts = session.conceptsViewed.length;
    const time = session.duration / 1000; // seconds
    
    return Math.round((concepts / time) * 100); // concepts per 100 seconds
  }

  // Mastery level
  getMasteryLevel(conceptIndex) {
    const progress = this.conceptProgress.get(conceptIndex);
    if (!progress) return 'novice';
    
    if (progress.totalTimeSpent < 30) return 'novice';
    if (progress.totalTimeSpent < 60) return 'beginner';
    if (progress.totalTimeSpent < 120) return 'intermediate';
    if (progress.totalTimeSpent < 240) return 'advanced';
    return 'expert';
  }

  // Get learning recommendations
  getLearningRecommendations() {
    const recommendations = [];
    
    // Check for inconsistent learning
    if (this.userStats.totalSessions > 5) {
      const avgSessionLength = this.userStats.totalLearningTime / this.userStats.totalSessions;
      
      if (avgSessionLength < 30000) { // Less than 30 seconds
        recommendations.push({
          type: 'engagement',
          message: 'Try spending more time on each concept for better understanding',
          priority: 'low'
        });
      }
    }
    
    // Check for concept gaps
    const masteredCount = Array.from(this.conceptProgress.values())
      .filter(p => p.mastered).length;
    
    const totalConcepts = this.conceptProgress.size;
    
    if (masteredCount < totalConcepts * 0.5) {
      recommendations.push({
        type: 'focus',
        message: `You've mastered ${masteredCount}/${totalConcepts} concepts. Keep going!`,
        priority: 'medium'
      });
    }
    
    return recommendations;
  }

  // Storage methods
  saveToStorage() {
    const data = {
      sessions: this.sessions,
      conceptProgress: Array.from(this.conceptProgress.entries()),
      userStats: this.userStats
    };
    
    localStorage.setItem('eduverse_analytics', JSON.stringify(data));
  }

  loadFromStorage() {
    const stored = localStorage.getItem('eduverse_analytics');
    if (!stored) return;
    
    try {
      const data = JSON.parse(stored);
      this.sessions = data.sessions || [];
      this.conceptProgress = new Map(data.conceptProgress || []);
      this.userStats = data.userStats || this.userStats;
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
  }

  // Get user dashboard data
  getDashboardData() {
    return {
      stats: this.userStats,
      masteredConcepts: Array.from(this.conceptProgress.entries())
        .filter(([_, p]) => p.mastered)
        .map(([idx, p]) => ({ index: idx, ...p })),
      recommendedNext: this.getRecommendedConcepts(),
      recentActivity: this.sessions.slice(-5)
    };
  }

  // Get recommended concepts to study
  getRecommendedConcepts() {
    return Array.from(this.conceptProgress.entries())
      .filter(([_, p]) => !p.mastered && p.viewCount < 3)
      .sort((a, b) => b[1].viewCount - a[1].viewCount)
      .slice(0, 3);
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Clear all data
  clearAllData() {
    this.sessions = [];
    this.conceptProgress.clear();
    this.userStats = {
      totalLearningTime: 0,
      lessonsCompleted: 0,
      conceptsMastered: 0,
      lastSessionDate: null,
      totalSessions: 0
    };
    localStorage.removeItem('eduverse_analytics');
  }
}

export function createLearningAnalytics() {
  return new LearningAnalytics();
}
