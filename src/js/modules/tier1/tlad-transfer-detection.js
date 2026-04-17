// ============================================
// TIER 1: Transfer Learning Anomaly Detection (TLAD)
// Detect unexpected mastery connections (transfer learning)
// ============================================

export class TLADTransferDetector {
  constructor(knowledgeGraph) {
    this.knowledgeGraph = knowledgeGraph; // { nodes, edges }
    this.studentMastery = {};
    this.transferEvents = [];
    this.expectedPerformance = {};
    this.anomalies = [];

    this.config = {
      anomalyThreshold: 0.25, // 25% above expected = transfer detected
      confidenceThreshold: 0.6,
      minSampleSize: 5,
      updateFrequency: 1000 // ms
    };

    this.analytics = {
      totalTransfersDetected: 0,
      highConfidenceTransfers: 0,
      transferRewards: 0,
      studentRecommendations: []
    };
  }

  /**
   * Update student mastery and check for transfers
   */
  updateMastery(masteryDict) {
    this.studentMastery = masteryDict;
    this.detectTransfers();
  }

  /**
   * Main transfer learning detection algorithm
   * Formula: anomaly = actual - expected(mastery_in_prerequisites)
   */
  detectTransfers() {
    if (!this.knowledgeGraph) return;

    const nodes = this.knowledgeGraph.nodes || [];
    const edges = this.knowledgeGraph.edges || [];

    // For each node, calculate expected mastery based on prerequisites
    nodes.forEach(node => {
      const currentMastery = this.studentMastery[node.id] || 0;
      
      // Find prerequisite nodes
      const prerequisites = edges
        .filter(e => e.to === node.id && e.type === 'prerequisite')
        .map(e => e.from);

      if (prerequisites.length === 0) return; // No prerequisites

      // Calculate expected mastery
      const expectedMastery = this.calculateExpectedMastery(node.id, prerequisites);
      this.expectedPerformance[node.id] = expectedMastery;

      // Detect anomaly (transfer)
      const anomaly = currentMastery - expectedMastery;
      
      if (anomaly > this.config.anomalyThreshold) {
        // Unexpected high performance = transfer learning detected
        this.recordTransferEvent({
          nodeId: node.id,
          nodeName: node.label,
          currentMastery,
          expectedMastery,
          anomaly,
          prerequisites,
          confidence: this.calculateAnomalyConfidence(anomaly, prerequisites.length),
          timestamp: Date.now()
        });
      }
    });
  }

  /**
   * Calculate expected mastery based on prerequisite performance
   * Formula: E[mastery(C)] = α·mastery(prereq1) + β·mastery(prereq2) + ...
   */
  calculateExpectedMastery(nodeId, prerequisites) {
    if (prerequisites.length === 0) return 0;

    // Weighted average of prerequisite masteries
    let totalWeight = 0;
    let weightedSum = 0;

    prerequisites.forEach((prereqId, index) => {
      const prereqMastery = this.studentMastery[prereqId] || 0;
      // Weight inversely by position (more direct prerequisites weighted more)
      const weight = 1 / (index + 1);
      
      weightedSum += prereqMastery * weight;
      totalWeight += weight;
    });

    // Add base level (some transfer expected)
    const baseTransferRate = 0.3; // 30% baseline transfer
    const expectedMastery = (weightedSum / totalWeight) * baseTransferRate;

    return Math.min(expectedMastery, 1.0);
  }

  /**
   * Calculate confidence in anomaly detection
   */
  calculateAnomalyConfidence(anomaly, numPrerequisites) {
    // Higher anomaly + more prerequisites = higher confidence
    const anomalyFactor = Math.min(anomaly / 0.5, 1); // Normalize by anomaly threshold
    const prerequisiteFactor = Math.min(numPrerequisites / 5, 1); // More constraints = more reliable
    
    const confidence = 0.6 * anomalyFactor + 0.4 * prerequisiteFactor;
    return Math.min(confidence, 1.0);
  }

  /**
   * Record transfer event and generate reward
   */
  recordTransferEvent(event) {
    if (event.confidence < this.config.confidenceThreshold) return;

    this.transferEvents.push(event);
    this.analytics.totalTransfersDetected++;

    if (event.confidence > 0.8) {
      this.analytics.highConfidenceTransfers++;
    }

    // Generate reward
    this.generateTransferReward(event);

    // Generate recommendation for related skills
    this.generateTransferRecommendation(event);
  }

  /**
   * Generate reward for transfer learning
   */
  generateTransferReward(event) {
    const reward = {
      id: `transfer-reward-${Date.now()}`,
      studentId: 'current',
      type: 'transfer-learning',
      title: '🌉 Transfer Learning Detected!',
      description: `You've unexpectedly mastered **${event.nodeName}** at ${Math.round(event.currentMastery * 100)}% after learning ${event.prerequisites.map(p => this.getNodeName(p)).join(', ')}!`,
      points: Math.round(50 * event.confidence), // Points based on confidence
      badges: this.generateBadges(event),
      message: this.generateTransferMessage(event),
      timestamp: Date.now()
    };

    this.analytics.transferRewards += reward.points;
    return reward;
  }

  /**
   * Generate badges for transfer achievement
   */
  generateBadges(event) {
    const badges = [];

    // Badge types based on transfer type
    if (event.anomaly > 0.5) {
      badges.push({
        name: '🚀 Super Connector',
        description: 'Exceptional transfer between domains'
      });
    }

    if (event.prerequisites.length >= 3) {
      badges.push({
        name: '🌍 Integrator',
        description: 'Successfully integrated multiple prerequisite skills'
      });
    }

    badges.push({
      name: `✨ ${event.nodeName} Mastery`,
      description: `Achieved mastery in ${event.nodeName}`
    });

    return badges;
  }

  /**
   * Generate personalized message about transfer
   */
  generateTransferMessage(event) {
    const transferPercentage = Math.round(event.anomaly * 100);
    const messages = [
      `🎯 Amazing! You transferred **${transferPercentage}%** more knowledge than expected from ${event.prerequisites.map(p => this.getNodeName(p)).join(' & ')}.`,
      `🧠 Your brain made an unexpected connection! You mastered ${event.nodeName} by applying concepts from related skills.`,
      `💡 Insight unlocked! The foundations you built in ${event.prerequisites.slice(0, 1).map(p => this.getNodeName(p)).join(', ')} accelerated your learning in ${event.nodeName}.`,
      `🌟 Exceptional transfer learning! You're building a more interconnected knowledge network.`
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Generate recommendation for related skills
   */
  generateTransferRecommendation(event) {
    const recommendation = {
      id: `transfer-rec-${Date.now()}`,
      type: 'transfer-learning',
      skill: event.nodeName,
      relatedSkills: this.findRelatedSkills(event.nodeId),
      recommendation: `Since you've shown exceptional transfer in ${event.nodeName}, try these related skills:`,
      suggestions: this.generateSuggestions(event),
      confidence: event.confidence
    };

    this.analytics.studentRecommendations.push(recommendation);
    return recommendation;
  }

  /**
   * Find skills that could benefit from this transfer
   */
  findRelatedSkills(nodeId) {
    if (!this.knowledgeGraph) return [];

    const edges = this.knowledgeGraph.edges || [];
    const nodes = this.knowledgeGraph.nodes || [];

    // Find outgoing edges (downstream skills)
    const downstreamIds = edges
      .filter(e => e.from === nodeId && e.type === 'transfer')
      .map(e => e.to);

    return downstreamIds
      .map(id => nodes.find(n => n.id === id))
      .filter(n => n);
  }

  /**
   * Generate specific skill suggestions
   */
  generateSuggestions(event) {
    const suggestions = [];
    const relatedSkills = this.findRelatedSkills(event.nodeId);

    relatedSkills.forEach(skill => {
      const skillMastery = this.studentMastery[skill.id] || 0;
      
      if (skillMastery < 0.8) { // Not yet mastered
        suggestions.push({
          skillName: skill.label,
          currentMastery: skillMastery,
          transferPotential: event.confidence * (1 - skillMastery),
          difficulty: this.estimateDifficulty(skill.id),
          expectedTimeToMastery: this.estimateTimeToMastery(event.nodeId, skill.id)
        });
      }
    });

    // Sort by transfer potential
    return suggestions.sort((a, b) => b.transferPotential - a.transferPotential);
  }

  /**
   * Estimate difficulty of a skill based on prerequisites
   */
  estimateDifficulty(nodeId) {
    if (!this.knowledgeGraph) return 0.5;

    const edges = this.knowledgeGraph.edges || [];
    const prerequisiteCount = edges.filter(e => e.to === nodeId && e.type === 'prerequisite').length;

    // More prerequisites = higher difficulty
    return Math.min(prerequisiteCount * 0.15, 1.0);
  }

  /**
   * Estimate time to mastery using transfer learning
   */
  estimateTimeToMastery(sourceNodeId, targetNodeId) {
    // Base time: 2 hours
    // With transfer: reduced by transfer factor
    const baseTiming = 120; // minutes
    const transferFactor = this.calculateTransferFactor(sourceNodeId, targetNodeId);
    
    return Math.round(baseTiming * (1 - transferFactor * 0.5));
  }

  /**
   * Calculate transfer factor between two skills
   */
  calculateTransferFactor(sourceNodeId, targetNodeId) {
    if (!this.knowledgeGraph) return 0;

    const edges = this.knowledgeGraph.edges || [];
    
    // Direct connection = strong transfer
    const directEdge = edges.find(e => 
      e.from === sourceNodeId && e.to === targetNodeId && e.type === 'transfer'
    );

    if (directEdge) return directEdge.weight || 0.5;

    // No direct connection = weak transfer
    return 0.1;
  }

  /**
   * Get node name from ID
   */
  getNodeName(nodeId) {
    if (!this.knowledgeGraph) return nodeId;
    
    const node = this.knowledgeGraph.nodes?.find(n => n.id === nodeId);
    return node?.label || nodeId;
  }

  /**
   * Get detected transfers
   */
  getDetectedTransfers(minConfidence = 0) {
    return this.transferEvents.filter(e => e.confidence >= minConfidence);
  }

  /**
   * Get analytics
   */
  getAnalytics() {
    return {
      ...this.analytics,
      totalEvents: this.transferEvents.length,
      transferEventDetails: this.transferEvents.map(e => ({
        skill: e.nodeName,
        anomaly: e.anomaly,
        confidence: e.confidence,
        timestamp: e.timestamp
      })),
      averageAnomalyMagnitude: this.transferEvents.length > 0 ?
        this.transferEvents.reduce((sum, e) => sum + e.anomaly, 0) / this.transferEvents.length :
        0
    };
  }

  /**
   * Reset detector
   */
  reset() {
    this.transferEvents = [];
    this.expectedPerformance = {};
    this.anomalies = [];
    this.analytics = {
      totalTransfersDetected: 0,
      highConfidenceTransfers: 0,
      transferRewards: 0,
      studentRecommendations: []
    };
  }
}

export default TLADTransferDetector;
