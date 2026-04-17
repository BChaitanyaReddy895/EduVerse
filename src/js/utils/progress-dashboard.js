// ============================================
// Progress Dashboard & Visualization v1.0
// Visual progress tracking & analytics display
// ============================================

export class ProgressDashboard {
  constructor() {
    this.lessons = new Map();
    this.userProgress = {
      totalLessonsStarted: 0,
      totalLessonsCompleted: 0,
      totalConceptsViewed: 0,
      totalStudyTime: 0,
      averageEngagement: 0,
      streakDays: 0,
      lastStudyDate: null
    };

    this.loadProgress();
    console.log('📊 Progress Dashboard initialized');
  }

  // Initialize lesson tracking
  initializeLesson(lessonKey, lessonData) {
    this.lessons.set(lessonKey, {
      key: lessonKey,
      title: lessonData.title,
      topic: lessonData.topic,
      complexity: lessonData.complexity,
      concepts: lessonData.concepts || [],
      startedAt: Date.now(),
      completedAt: null,
      progress: 0,
      conceptProgress: new Map(),
      timeSpent: 0,
      engagementScore: 0,
      isCompleted: false
    });

    this.userProgress.totalLessonsStarted++;
    this.saveProgress();
  }

  // Update lesson progress
  updateLessonProgress(lessonKey, currentConceptIndex, totalConcepts) {
    const lesson = this.lessons.get(lessonKey);
    if (!lesson) return;

    lesson.progress = Math.round((currentConceptIndex / totalConcepts) * 100);

    // Mark as completed if 100%
    if (lesson.progress === 100 && !lesson.isCompleted) {
      lesson.isCompleted = true;
      lesson.completedAt = Date.now();
      lesson.timeSpent = lesson.completedAt - lesson.startedAt;
      this.userProgress.totalLessonsCompleted++;
      this.updateStreak();
    }

    this.saveProgress();
  }

  // Track concept completion
  trackConceptCompletion(lessonKey, conceptIndex, duration, engaged) {
    const lesson = this.lessons.get(lessonKey);
    if (!lesson) return;

    lesson.conceptProgress.set(conceptIndex, {
      completedAt: Date.now(),
      duration,
      engaged,
      mastered: duration > 120 // >2 minutes = mastered
    });

    lesson.timeSpent += duration;
    this.userProgress.totalConceptsViewed++;
    this.userProgress.totalStudyTime += duration;

    this.saveProgress();
  }

  // Update streak
  updateStreak() {
    const today = new Date().toDateString();
    const lastStudy = this.userProgress.lastStudyDate;

    if (lastStudy === today) {
      return; // Already counted today
    }

    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (lastStudy === yesterday) {
      this.userProgress.streakDays++;
    } else {
      this.userProgress.streakDays = 1;
    }

    this.userProgress.lastStudyDate = today;
    this.saveProgress();
  }

  // Create dashboard UI
  createDashboard(container) {
    const dashboard = document.createElement('div');
    dashboard.id = 'progress-dashboard';
    dashboard.style.cssText = `
      background: linear-gradient(135deg, #0a1929 0%, #1a2332 100%);
      border: 2px solid #3B82F6;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      color: white;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    header.textContent = '📊 Your Learning Progress';
    dashboard.appendChild(header);

    // Stats grid
    const statsGrid = document.createElement('div');
    statsGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    `;

    const stats = [
      { label: 'Lessons Completed', value: this.userProgress.totalLessonsCompleted, icon: '✅' },
      { label: 'Concepts Viewed', value: this.userProgress.totalConceptsViewed, icon: '👁️' },
      { label: 'Study Time', value: `${Math.round(this.userProgress.totalStudyTime / 60)}m`, icon: '⏱️' },
      { label: 'Current Streak', value: `${this.userProgress.streakDays} days`, icon: '🔥' }
    ];

    stats.forEach(stat => {
      const card = document.createElement('div');
      card.style.cssText = `
        background: rgba(59, 130, 246, 0.1);
        border: 1px solid #3B82F6;
        border-radius: 8px;
        padding: 16px;
        text-align: center;
      `;
      
      card.innerHTML = `
        <div style="font-size: 24px; margin-bottom: 8px;">${stat.icon}</div>
        <div style="font-size: 28px; font-weight: bold; margin-bottom: 4px;">${stat.value}</div>
        <div style="font-size: 12px; color: #9CA3AF;">${stat.label}</div>
      `;
      statsGrid.appendChild(card);
    });

    dashboard.appendChild(statsGrid);

    // Lessons progress
    const lessonsHeader = document.createElement('div');
    lessonsHeader.style.cssText = `
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 16px;
      margin-top: 20px;
    `;
    lessonsHeader.textContent = '📚 Lesson Progress';
    dashboard.appendChild(lessonsHeader);

    const lessonsList = document.createElement('div');
    lessonsList.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
    `;

    this.lessons.forEach(lesson => {
      const lessonCard = this.createLessonProgressCard(lesson);
      lessonsList.appendChild(lessonCard);
    });

    dashboard.appendChild(lessonsList);

    return dashboard;
  }

  // Create lesson progress card
  createLessonProgressCard(lesson) {
    const card = document.createElement('div');
    card.style.cssText = `
      background: rgba(59, 130, 246, 0.05);
      border: 1px solid #3B82F6;
      border-radius: 8px;
      padding: 12px;
    `;

    const titleRow = document.createElement('div');
    titleRow.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    `;

    titleRow.innerHTML = `
      <div style="font-weight: 600;">${lesson.title}</div>
      <div style="font-size: 12px; color: #9CA3AF;">${lesson.progress}%</div>
    `;

    card.appendChild(titleRow);

    // Progress bar
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
      width: 100%;
      height: 8px;
      background: rgba(255,255,255,0.1);
      border-radius: 4px;
      overflow: hidden;
    `;

    const progressFill = document.createElement('div');
    progressFill.style.cssText = `
      height: 100%;
      background: linear-gradient(90deg, #3B82F6, #8B5CF6);
      width: ${lesson.progress}%;
      transition: width 0.3s ease;
    `;
    progressBar.appendChild(progressFill);
    card.appendChild(progressBar);

    // Details row
    const detailsRow = document.createElement('div');
    detailsRow.style.cssText = `
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 12px;
      color: #9CA3AF;
    `;

    const concepts = lesson.conceptProgress.size;
    const masteredConcepts = Array.from(lesson.conceptProgress.values()).filter(c => c.mastered).length;

    detailsRow.innerHTML = `
      <span>🧠 ${masteredConcepts}/${concepts} concepts mastered</span>
      <span>⏱️ ${Math.round(lesson.timeSpent / 60)}m spent</span>
      ${lesson.isCompleted ? '<span style="color: #10B981;">✅ Completed</span>' : '<span style="color: #F59E0B;">🔄 In Progress</span>'}
    `;

    card.appendChild(detailsRow);

    return card;
  }

  // Get learning insights
  getLearningInsights() {
    const insights = [];

    // Calculation: total concepts / total study time
    const learningVelocity = this.userProgress.totalConceptsViewed / 
                            (this.userProgress.totalStudyTime / 3600);

    if (learningVelocity > 5) {
      insights.push({
        type: 'positive',
        message: '🚀 You\'re learning at a great pace!',
        emoji: '⚡'
      });
    }

    if (this.userProgress.streakDays >= 7) {
      insights.push({
        type: 'achievement',
        message: `🔥 ${this.userProgress.streakDays}-day learning streak! Keep it up!`,
        emoji: '🎯'
      });
    }

    if (this.userProgress.totalLessonsCompleted === 0) {
      insights.push({
        type: 'motivation',
        message: '📚 Start your first lesson to build your learning journey!',
        emoji: '💪'
      });
    }

    // Find most completed subject
    let maxCompleted = 0;
    let topSubject = null;

    this.lessons.forEach(lesson => {
      if (lesson.conceptProgress.size > maxCompleted) {
        maxCompleted = lesson.conceptProgress.size;
        topSubject = lesson.title;
      }
    });

    if (topSubject) {
      insights.push({
        type: 'info',
        message: `📌 You're most engaged with "${topSubject}"`,
        emoji: '⭐'
      });
    }

    return insights;
  }

  // Get milestones
  getMilestones() {
    const milestones = [
      { threshold: 1, label: 'First Lesson', emoji: '🎓', unlocked: this.userProgress.totalLessonsCompleted >= 1 },
      { threshold: 5, label: 'Lesson Warrior', emoji: '⚔️', unlocked: this.userProgress.totalLessonsCompleted >= 5 },
      { threshold: 10, label: 'Lesson Master', emoji: '🏆', unlocked: this.userProgress.totalLessonsCompleted >= 10 },
      { threshold: 100, label: 'Concept Expert', emoji: '🧠', unlocked: this.userProgress.totalConceptsViewed >= 100 },
      { threshold: 300, label: 'Study Marathon', emoji: '🏃', unlocked: this.userProgress.totalStudyTime >= 300 },
      { threshold: 7, label: 'Streak Master', emoji: '🔥', unlocked: this.userProgress.streakDays >= 7 }
    ];

    return milestones;
  }

  // Create achievements UI
  createAchievementsUI(container) {
    const milestones = this.getMilestones();
    
    const ui = document.createElement('div');
    ui.style.cssText = `
      background: rgba(59, 130, 246, 0.1);
      border: 2px solid #3B82F6;
      border-radius: 12px;
      padding: 16px;
      margin: 16px 0;
    `;

    const title = document.createElement('div');
    title.style.cssText = `
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 12px;
      color: white;
    `;
    title.textContent = '🏆 Achievements';
    ui.appendChild(title);

    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
      gap: 12px;
    `;

    milestones.forEach(milestone => {
      const badge = document.createElement('div');
      badge.style.cssText = `
        text-align: center;
        padding: 12px;
        border-radius: 8px;
        background: ${milestone.unlocked ? 'rgba(16, 185, 129, 0.2)' : 'rgba(107, 114, 128, 0.2)'};
        border: 1px solid ${milestone.unlocked ? '#10B981' : '#6B7280'};
        opacity: ${milestone.unlocked ? 1 : 0.6};
        cursor: pointer;
        transition: all 0.3s ease;
      `;

      badge.innerHTML = `
        <div style="font-size: 24px; margin-bottom: 4px;">${milestone.emoji}</div>
        <div style="font-size: 11px; color: white; font-weight: 600;">${milestone.label}</div>
        ${milestone.unlocked ? '<div style="font-size: 10px; color: #10B981; margin-top: 4px;">✓ Unlocked</div>' : ''}
      `;

      grid.appendChild(badge);
    });

    ui.appendChild(grid);
    return ui;
  }

  // Save/load progress
  saveProgress() {
    const progressData = {
      lessons: Array.from(this.lessons.entries()),
      userProgress: this.userProgress,
      timestamp: Date.now()
    };

    localStorage.setItem('eduverse_progress', JSON.stringify(progressData));
  }

  loadProgress() {
    const stored = localStorage.getItem('eduverse_progress');
    
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.lessons = new Map(data.lessons || []);
        this.userProgress = data.userProgress || this.userProgress;
        console.log('✅ Progress loaded');
      } catch (err) {
        console.log('⚠️ Error loading progress:', err);
      }
    }
  }

  // Export progress
  exportProgress() {
    const data = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      lessons: Array.from(this.lessons.entries()),
      userProgress: this.userProgress
    };

    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `eduverse-progress-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Reset progress
  resetProgress() {
    if (confirm('Are you sure you want to reset your progress? This cannot be undone.')) {
      this.lessons.clear();
      this.userProgress = {
        totalLessonsStarted: 0,
        totalLessonsCompleted: 0,
        totalConceptsViewed: 0,
        totalStudyTime: 0,
        averageEngagement: 0,
        streakDays: 0,
        lastStudyDate: null
      };
      this.saveProgress();
      console.log('✅ Progress reset');
    }
  }
}

export function createProgressDashboard() {
  return new ProgressDashboard();
}
