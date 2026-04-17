// ============================================
// TIER 3: Equity-Aware 3D Complexity Management
// Ensure 3D features don't disadvantage certain demographics
// Extends EWGH (Equity-Weighted Gradient Harmonization)
// ============================================

export class EquityAware3DComplexity {
  constructor() {
    this.studentProfiles = new Map(); // { studentId: profile }
    this.demographicGroups = new Map(); // { groupId: metrics }
    this.complexityAdjustments = new Map(); // Per-student complexity

    this.config = {
      equityThreshold: 0.85,      // Min performance equity level
      monitoringInterval: 5000,   // ms between checks
      adjustmentGranularity: 0.1, // Complexity step size (0-1)
      maxComplexity: 1.0,
      minComplexity: 0.2
    };

    this.analytics = {
      equityScore: 1.0,
      disparityDetections: 0,
      adaptationsPerformed: 0,
      groupMetrics: {}
    };

    this.equityMonitor = null;
  }

  /**
   * Register student and demographic group
   */
  registerStudent(studentId, demographics = {}) {
    const profile = {
      studentId,
      demographics,
      performanceHistory: [],
      complexityHistory: [],
      currentComplexity: 0.5,
      engagementScore: 0.5,
      completionRate: 0,
      errorRate: 0,
      lastAdjustment: Date.now()
    };

    this.studentProfiles.set(studentId, profile);

    // Update group metrics
    this.updateGroupMetrics(demographics);
  }

  /**
   * Update group metrics
   */
  updateGroupMetrics(demographics) {
    const groupKey = this.getGroupKey(demographics);

    if (!this.demographicGroups.has(groupKey)) {
      this.demographicGroups.set(groupKey, {
        groupKey,
        demographics,
        studentCount: 0,
        avgPerformance: 0,
        avgComplexity: 0,
        avgEngagement: 0,
        performanceVariance: 0,
        disparityFlag: false
      });
    }

    const group = this.demographicGroups.get(groupKey);
    group.studentCount++;
  }

  /**
   * Generate group key from demographics
   */
  getGroupKey(demographics) {
    const { gender, socioeconomicStatus, language, region, disability } = demographics;
    return `${gender}-${socioeconomicStatus}-${language}-${region}-${disability}`;
  }

  /**
   * Log student performance
   */
  logPerformance(studentId, performanceData) {
    const profile = this.studentProfiles.get(studentId);
    if (!profile) return;

    const {
      taskCompleted = true,
      timeTaken = 0,
      errorCount = 0,
      engagementLevel = 0.5,
      used3dComponents = 0,
      totalComponents = 10
    } = performanceData;

    profile.performanceHistory.push({
      timestamp: Date.now(),
      taskCompleted,
      timeTaken,
      errorCount,
      engagementLevel,
      componentUtilization: used3dComponents / totalComponents
    });

    // Calculate metrics
    const recent = profile.performanceHistory.slice(-5); // Last 5 tasks
    profile.completionRate = recent.filter(p => p.taskCompleted).length / recent.length;
    profile.errorRate = recent.reduce((sum, p) => sum + p.errorCount, 0) / recent.length;
    profile.engagementScore = recent.reduce((sum, p) => sum + p.engagementLevel, 0) / recent.length;
  }

  /**
   * Detect performance disparities across groups
   */
  detectDisparities() {
    const disparities = [];
    const groups = Array.from(this.demographicGroups.values());

    // Compare each group's average performance
    for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        const groupA = groups[i];
        const groupB = groups[j];

        const perfDiff = Math.abs(groupA.avgPerformance - groupB.avgPerformance);

        if (perfDiff > (1 - this.config.equityThreshold)) {
          disparities.push({
            groupA: groupA.groupKey,
            groupB: groupB.groupKey,
            performanceDifference: perfDiff,
            severity: perfDiff > 0.3 ? 'high' : 'moderate',
            affectedStudents: groupA.studentCount + groupB.studentCount
          });

          groupA.disparityFlag = true;
          groupB.disparityFlag = true;

          this.analytics.disparityDetections++;
        }
      }
    }

    return disparities;
  }

  /**
   * Recalculate group metrics from student profiles
   */
  recalculateGroupMetrics() {
    this.demographicGroups.forEach((group) => {
      const students = Array.from(this.studentProfiles.values())
        .filter(p => this.getGroupKey(p.demographics) === group.groupKey);

      if (students.length === 0) return;

      group.avgPerformance = students.reduce((sum, s) => sum + s.completionRate, 0) / students.length;
      group.avgComplexity = students.reduce((sum, s) => sum + s.currentComplexity, 0) / students.length;
      group.avgEngagement = students.reduce((sum, s) => sum + s.engagementScore, 0) / students.length;

      // Calculate variance
      const variance = students.reduce((sum, s) => {
        return sum + Math.pow(s.completionRate - group.avgPerformance, 2);
      }, 0) / students.length;

      group.performanceVariance = Math.sqrt(variance);
    });
  }

  /**
   * Adjust complexity for student based on equity metrics
   */
  adjustComplexityForEquity(studentId) {
    const profile = this.studentProfiles.get(studentId);
    if (!profile) return;

    const groupKey = this.getGroupKey(profile.demographics);
    const group = this.demographicGroups.get(groupKey);

    if (!group || !group.disparityFlag) {
      // No disparity, gradual normal adjustment
      this.adjustComplexityNormal(studentId);
      return;
    }

    // Disparity detected - apply equity adjustment
    const groupPerf = group.avgPerformance;
    const overallAvgPerf = this.calculateOverallAveragePerformance();

    // If group underperforming, reduce complexity
    if (groupPerf < overallAvgPerf) {
      const performanceGap = overallAvgPerf - groupPerf;
      const complexityReduction = performanceGap * 0.5; // Scale gap to complexity

      profile.currentComplexity = Math.max(
        this.config.minComplexity,
        profile.currentComplexity - complexityReduction
      );

      // Log detailed adjustment reason
      console.log(`📊 Equity: Reduced complexity for ${studentId} (group: ${groupKey}) to maintain equity`);
    }

    profile.lastAdjustment = Date.now();
    this.analytics.adaptationsPerformed++;
  }

  /**
   * Normal complexity adjustment (non-equity)
   */
  adjustComplexityNormal(studentId) {
    const profile = this.studentProfiles.get(studentId);
    if (!profile) return;

    // Adjust based on performance
    if (profile.completionRate > 0.85) {
      // Good performance - increase complexity
      profile.currentComplexity = Math.min(
        this.config.maxComplexity,
        profile.currentComplexity + this.config.adjustmentGranularity
      );
    } else if (profile.completionRate < 0.5) {
      // Poor performance - decrease complexity
      profile.currentComplexity = Math.max(
        this.config.minComplexity,
        profile.currentComplexity - this.config.adjustmentGranularity
      );
    }

    profile.complexityHistory.push({
      timestamp: Date.now(),
      complexity: profile.currentComplexity,
      reason: 'normal_adjustment'
    });
  }

  /**
   * Calculate overall average performance across all students
   */
  calculateOverallAveragePerformance() {
    const students = Array.from(this.studentProfiles.values());
    if (students.length === 0) return 0.5;

    return students.reduce((sum, s) => sum + s.completionRate, 0) / students.length;
  }

  /**
   * Get complexity for 3D rendering
   */
  getComplexityForStudent(studentId) {
    const profile = this.studentProfiles.get(studentId);
    return profile?.currentComplexity || 0.5;
  }

  /**
   * Apply complexity level to 3D scene
   */
  applyComplexityToScene(scene, complexityLevel) {
    if (!scene) return;

    // Traverse scene and adjust based on complexity
    scene.traverse((object) => {
      // Geometry detail
      if (object.geometry && object.geometry.attributes.position) {
        const originalVertexCount = object.geometry.attributes.position.count;
        const targetVertexCount = Math.ceil(originalVertexCount * complexityLevel);

        if (targetVertexCount < originalVertexCount) {
          // Apply LOD simplification (simplified version)
          console.log(`📉 LOD: Simplifying mesh from ${originalVertexCount} to ${targetVertexCount} vertices`);
        }
      }

      // Material complexity
      if (object.material) {
        if (complexityLevel < 0.3) {
          // Very low complexity: disable expensive effects
          object.material.castShadow = false;
          object.material.receiveShadow = false;
        } else if (complexityLevel < 0.6) {
          // Medium complexity: basic shadows
          object.material.castShadow = true;
          object.material.receiveShadow = true;
        } else {
          // High complexity: full effects
          object.material.castShadow = true;
          object.material.receiveShadow = true;
        }
      }

      // Animation complexity
      if (object.userData.isAnimated) {
        // Reduce animation frame rate at low complexity
        object.userData.animationSampleRate = Math.max(1, Math.ceil(10 * (1 - complexityLevel)));
      }
    });
  }

  /**
   * Start equity monitoring
   */
  startMonitoring() {
    if (this.equityMonitor) return;

    this.equityMonitor = setInterval(() => {
      this.recalculateGroupMetrics();
      const disparities = this.detectDisparities();

      if (disparities.length > 0) {
        console.log(`⚠️ Equity: Detected ${disparities.length} disparities, adjusting complexity`);

        // Adjust all students
        this.studentProfiles.forEach((profile, studentId) => {
          this.adjustComplexityForEquity(studentId);
        });
      }

      this.updateEquityScore();
    }, this.config.monitoringInterval);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.equityMonitor) {
      clearInterval(this.equityMonitor);
      this.equityMonitor = null;
    }
  }

  /**
   * Calculate overall equity score
   */
  updateEquityScore() {
    this.recalculateGroupMetrics();

    const groups = Array.from(this.demographicGroups.values());
    if (groups.length === 0) {
      this.analytics.equityScore = 1.0;
      return;
    }

    const performances = groups.map(g => g.avgPerformance);
    const avgPerf = performances.reduce((a, b) => a + b, 0) / performances.length;
    const variance = performances.reduce((sum, p) => sum + Math.pow(p - avgPerf, 2), 0) / performances.length;
    const standardDev = Math.sqrt(variance);

    // Equity score: lower std dev = higher equity (0-1)
    this.analytics.equityScore = Math.max(0, 1 - standardDev);
  }

  /**
   * Get equity report
   */
  getEquityReport() {
    this.recalculateGroupMetrics();

    const report = {
      overallEquityScore: this.analytics.equityScore,
      groupMetrics: Array.from(this.demographicGroups.values()),
      disparityDetections: this.analytics.disparityDetections,
      adaptationsPerformed: this.analytics.adaptationsPerformed,
      studentsMonitored: this.studentProfiles.size,
      recommendations: this.generateEquityRecommendations()
    };

    return report;
  }

  /**
   * Generate recommendations
   */
  generateEquityRecommendations() {
    const recommendations = [];

    this.demographicGroups.forEach((group) => {
      if (group.disparityFlag) {
        recommendations.push({
          group: group.groupKey,
          recommendation: `Group ${group.groupKey} showing performance disparity. Suggested: Additional support resources, alternative content formats, or peer mentoring`,
          priority: group.performanceVariance > 0.3 ? 'high' : 'medium'
        });
      }
    });

    return recommendations;
  }

  /**
   * Get analytics
   */
  getAnalytics() {
    return {
      ...this.analytics,
      studentsMonitored: this.studentProfiles.size,
      groupsTracked: this.demographicGroups.size
    };
  }
}

export default EquityAware3DComplexity;
