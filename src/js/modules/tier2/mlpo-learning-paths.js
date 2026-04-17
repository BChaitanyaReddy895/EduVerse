// ============================================
// TIER 2: Multi-Modal Learning Path Optimization (MLPO)
// Generate personalized learning paths by learning style
// ============================================

export class MLPOLearningPathOptimizer {
  constructor(knowledgeGraph) {
    this.knowledgeGraph = knowledgeGraph; // { nodes, edges }
    this.studentProfile = null;
    this.generatedPaths = [];

    // Learning style dimensions
    this.learningStyles = {
      visual: 0,      // Prefers 3D/visual content
      kinesthetic: 0, // Prefers interactive/gesture content
      auditory: 0,    // Prefers audio/spatial content
      readingWriting: 0 // Prefers text/exercises
    };

    // Content type preferences
    this.contentPreferences = {
      '3d': 0,       // 3D visualizations
      'ar': 0,       // AR experiences
      'interactive': 0, // Interactive elements
      'audio': 0,    // Audio content
      'text': 0,     // Reading material
      'quiz': 0      // Quiz/exercises
    };

    this.config = {
      pathLength: 10,           // Concepts in optimal path
      diversityFactor: 0.5,    // Balance between difficulty and variety
      retentionFactor: 0.3,    // Weight for retention
      engagementFactor: 0.4,   // Weight for engagement
      computeAlgorithm: 'dijkstra' // or 'astar', 'reinforcement'
    };

    this.analytics = {
      pathsGenerated: 0,
      avgPathRetention: 0,
      styleDistribution: {},
      optimalityMetrics: []
    };
  }

  /**
   * Assess student learning style
   */
  assessLearningStyle(interactionData) {
    const {
      gestureInteractions = 0,
      gazeFixations = 0,
      audioEngagement = 0,
      readingTime = 0,
      quizAttempts = 0,
      ar3dViewTime = 0
    } = interactionData;

    // Normalize interaction metrics
    const total = gestureInteractions + gazeFixations + audioEngagement + readingTime + quizAttempts + ar3dViewTime;
    if (total === 0) {
      // Default learning style (balanced)
      return { visual: 0.25, kinesthetic: 0.25, auditory: 0.25, readingWriting: 0.25 };
    }

    // Map interactions to learning styles
    this.learningStyles = {
      visual: (ar3dViewTime + gazeFixations * 0.5) / total,
      kinesthetic: (gestureInteractions + quizAttempts * 0.3) / total,
      auditory: audioEngagement / total,
      readingWriting: (readingTime + quizAttempts * 0.7) / total
    };

    return this.learningStyles;
  }

  /**
   * Map learning styles to content preferences
   */
  mapStylesToContentPreferences() {
    // Visual learners prefer 3D/AR
    this.contentPreferences['3d'] = this.learningStyles.visual * 0.7 + 0.3;
    this.contentPreferences['ar'] = this.learningStyles.visual * 0.6 + 0.2;

    // Kinesthetic learners prefer interactive
    this.contentPreferences['interactive'] = this.learningStyles.kinesthetic * 0.8 + 0.2;
    this.contentPreferences['quiz'] = this.learningStyles.kinesthetic * 0.6 + 0.3;

    // Auditory learners prefer audio
    this.contentPreferences['audio'] = this.learningStyles.auditory * 0.9 + 0.1;

    // Reading/Writing learners prefer text
    this.contentPreferences['text'] = this.learningStyles.readingWriting * 0.8 + 0.2;

    // Normalize
    const sum = Object.values(this.contentPreferences).reduce((a, b) => a + b, 0);
    Object.keys(this.contentPreferences).forEach(key => {
      this.contentPreferences[key] /= sum;
    });

    return this.contentPreferences;
  }

  /**
   * Generate optimized learning path
   * Objective: maximize_path(retention × engagement - difficulty)
   */
  generateOptimalPath(currentMastery, targetSkill, learningStyle = null) {
    if (!learningStyle) {
      learningStyle = this.learningStyles;
    }

    this.mapStylesToContentPreferences();

    let path;

    // Choose algorithm based on config
    if (this.config.computeAlgorithm === 'dijkstra') {
      path = this.dijkstraPath(currentMastery, targetSkill);
    } else if (this.config.computeAlgorithm === 'astar') {
      path = this.astarPath(currentMastery, targetSkill);
    } else if (this.config.computeAlgorithm === 'reinforcement') {
      path = this.reinforcementPath(currentMastery, targetSkill);
    }

    // Score the path based on learning style
    const scoredPath = this.scorePathByLearningStyle(path, learningStyle);

    // Add content recommendations
    const pathWithContent = this.addContentRecommendations(scoredPath);

    this.generatedPaths.push(pathWithContent);
    this.analytics.pathsGenerated++;

    return pathWithContent;
  }

  /**
   * Dijkstra-based shortest path to target skill
   */
  dijkstraPath(currentMastery, targetSkillId) {
    const nodes = this.knowledgeGraph.nodes || [];
    const edges = this.knowledgeGraph.edges || [];

    // Find starting node (highest current mastery)
    const startNodeId = Object.entries(currentMastery)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || nodes[0]?.id;

    // Dijkstra's algorithm
    const distances = {};
    const previous = {};
    const unvisited = new Set();

    nodes.forEach(node => {
      distances[node.id] = node.id === startNodeId ? 0 : Infinity;
      unvisited.add(node.id);
    });

    while (unvisited.size > 0) {
      // Find unvisited node with minimum distance
      let current = null;
      let minDist = Infinity;

      unvisited.forEach(nodeId => {
        if (distances[nodeId] < minDist) {
          minDist = distances[nodeId];
          current = nodeId;
        }
      });

      if (current === null || distances[current] === Infinity) break;

      if (current === targetSkillId) break; // Reached target

      unvisited.delete(current);

      // Update distances for neighbors
      edges
        .filter(e => e.from === current)
        .forEach(edge => {
          if (unvisited.has(edge.to)) {
            const newDist = distances[current] + (1 - (edge.weight || 0.5));
            if (newDist < distances[edge.to]) {
              distances[edge.to] = newDist;
              previous[edge.to] = current;
            }
          }
        });
    }

    // Reconstruct path
    const path = [];
    let current = targetSkillId;

    while (current !== undefined) {
      path.unshift(current);
      current = previous[current];
    }

    return path;
  }

  /**
   * A* algorithm (heuristic-guided search)
   */
  astarPath(currentMastery, targetSkillId) {
    // For simplicity, using heuristic that target skill difficulty acts as heuristic
    const dijkstraPath = this.dijkstraPath(currentMastery, targetSkillId);
    
    // A* would refine this with heuristic values
    // For now, return Dijkstra's result
    return dijkstraPath;
  }

  /**
   * Reinforcement learning-based path
   * Learns from rewards/penalties during path traversal
   */
  reinforcementPath(currentMastery, targetSkillId) {
    const nodes = this.knowledgeGraph.nodes || [];
    const edges = this.knowledgeGraph.edges || [];

    // Simple Q-learning approach
    const qValues = {};
    const rewards = {};

    // Initialize
    nodes.forEach(node => {
      qValues[node.id] = {};
      nodes.forEach(node2 => {
        qValues[node.id][node2.id] = 0;
      });
    });

    // Simulate learning episodes
    const episodes = 50;
    const learningRate = 0.1;
    const discountFactor = 0.9;

    for (let episode = 0; episode < episodes; episode++) {
      let current = Object.entries(currentMastery)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || nodes[0]?.id;

      while (current !== targetSkillId) {
        // Choose next action (exploit/explore)
        const neighbors = edges
          .filter(e => e.from === current)
          .map(e => e.to);

        if (neighbors.length === 0) break;

        const next = neighbors[Math.floor(Math.random() * neighbors.length)];

        // Calculate reward
        const skillNode = nodes.find(n => n.id === next);
        const mastery = currentMastery[next] || 0;
        const reward = mastery > 0 ? 1 : -0.1; // Positive if already has mastery

        // Q-learning update
        const maxNextQ = Math.max(...Object.values(qValues[next] || {}));
        qValues[current][next] += learningRate * (reward + discountFactor * maxNextQ - qValues[current][next]);

        current = next;
      }
    }

    // Extract greedy path from learned Q-values
    const path = [];
    let current = Object.entries(currentMastery)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || nodes[0]?.id;

    for (let step = 0; step < 15; step++) {
      path.push(current);

      if (current === targetSkillId) break;

      // Choose best next action
      const neighbors = edges
        .filter(e => e.from === current)
        .map(e => e.to);

      if (neighbors.length === 0) break;

      current = neighbors.reduce((best, neighbor) =>
        (qValues[current][neighbor] || 0) > (qValues[current][best] || 0) ? neighbor : best
      );
    }

    return path;
  }

  /**
   * Score path based on learning style
   */
  scorePathByLearningStyle(path, learningStyle) {
    const nodes = this.knowledgeGraph.nodes || [];
    const scored = [];

    path.forEach((nodeId, index) => {
      const node = nodes.find(n => n.id === nodeId);

      // Assign content type based on learning style
      let contentType = 'mixed';

      const rand = Math.random();
      let cumulative = 0;

      Object.entries(this.contentPreferences).forEach(([type, weight]) => {
        cumulative += weight;
        if (rand < cumulative && contentType === 'mixed') {
          contentType = type;
        }
      });

      scored.push({
        nodeId,
        nodeName: node?.label || nodeId,
        position: index,
        contentType,
        difficulty: node?.difficulty || 0.5,
        estimatedTime: Math.round(30 + Math.random() * 90), // 30-120 minutes
        retentionScore: 0.7 + Math.random() * 0.25,
        engagementScore: this.contentPreferences[contentType] || 0.5
      });
    });

    return scored;
  }

  /**
   * Add specific content recommendations
   */
  addContentRecommendations(scoredPath) {
    return scoredPath.map(step => ({
      ...step,
      recommendations: this.getContentRecommendations(step)
    }));
  }

  /**
   * Get content recommendations for learning style
   */
  getContentRecommendations(pathStep) {
    const recommendations = [];

    if (pathStep.contentType === '3d' || this.contentPreferences['3d'] > 0.3) {
      recommendations.push({
        type: '3d',
        description: '3D Interactive Model',
        tool: 'Three.js 3D Visualization',
        estimatedTime: 15
      });
    }

    if (pathStep.contentType === 'ar' || this.contentPreferences['ar'] > 0.3) {
      recommendations.push({
        type: 'ar',
        description: 'Augmented Reality Experience',
        tool: 'WebXR + SADE',
        estimatedTime: 20
      });
    }

    if (pathStep.contentType === 'interactive' || this.contentPreferences['interactive'] > 0.3) {
      recommendations.push({
        type: 'interactive',
        description: 'Interactive Physics Simulation',
        tool: 'PBSE Engine',
        estimatedTime: 25
      });
    }

    if (pathStep.contentType === 'audio' || this.contentPreferences['audio'] > 0.3) {
      recommendations.push({
        type: 'audio',
        description: 'Spatial Audio Lesson',
        tool: 'SALS - Spatial Audio',
        estimatedTime: 10
      });
    }

    if (pathStep.contentType === 'text' || this.contentPreferences['text'] > 0.3) {
      recommendations.push({
        type: 'text',
        description: 'Reading Material',
        tool: 'Markdown/HTML Content',
        estimatedTime: 20
      });
    }

    if (pathStep.contentType === 'quiz' || this.contentPreferences['quiz'] > 0.3) {
      recommendations.push({
        type: 'quiz',
        description: 'Quiz + Assessment',
        tool: 'Interactive Quiz Engine',
        estimatedTime: 15
      });
    }

    return recommendations;
  }

  /**
   * Calculate path optimality score
   * Formula: optimality = (retention + engagement) - (difficulty + time_cost)
   */
  calculatePathOptimality(path) {
    const avgRetention = path.reduce((sum, step) => sum + step.retentionScore, 0) / path.length;
    const avgEngagement = path.reduce((sum, step) => sum + step.engagementScore, 0) / path.length;
    const avgDifficulty = path.reduce((sum, step) => sum + step.difficulty, 0) / path.length;
    const totalTime = path.reduce((sum, step) => sum + step.estimatedTime, 0);

    const optimality = (avgRetention + avgEngagement) - (avgDifficulty * 0.5 + totalTime / 500);

    return Math.max(0, Math.min(1, (optimality + 1) / 2)); // Normalize to 0-1
  }

  /**
   * Get analytics
   */
  getAnalytics() {
    const optimalityScores = this.generatedPaths.map(path => this.calculatePathOptimality(path));
    const avgOptimality = optimalityScores.length > 0 ?
      optimalityScores.reduce((a, b) => a + b, 0) / optimalityScores.length : 0;

    return {
      ...this.analytics,
      learningStyles: this.learningStyles,
      contentPreferences: this.contentPreferences,
      pathsGenerated: this.generatedPaths.length,
      avgPathOptimality: avgOptimality,
      optimalityMetrics: optimalityScores
    };
  }
}

export default MLPOLearningPathOptimizer;
