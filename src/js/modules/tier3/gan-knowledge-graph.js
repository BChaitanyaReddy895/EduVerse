// ============================================
// TIER 3: Graph Attention Networks for Knowledge Graph (GAN-KGT)
// Replaces simple HNS-KGT with attention-weighted graph traversal
// ============================================

export class GANKnowledgeGraphTraversal {
  constructor(knowledgeGraph, studentMasteryProfile) {
    this.graph = knowledgeGraph; // { nodes, edges }
    this.masteryProfile = studentMasteryProfile; // { [nodeId]: mastery_score }
    
    this.attentionWeights = new Map(); // Cache attention weights
    this.traversalPath = [];
    this.recommendations = [];

    this.config = {
      attentionHeads: 4,          // Multi-head attention
      attentionDepth: 2,          // Attention propagation depth
      learningRate: 0.01,
      maxRecommendations: 5,
      convergenceThreshold: 0.01
    };

    this.analytics = {
      traversalsCompleted: 0,
      averageAttentionWeight: 0,
      recommendationsGenerated: 0
    };
  }

  /**
   * Calculate attention weights between nodes
   * Attention(query, key, value) = softmax(query · key / sqrt(dim)) · value
   */
  calculateAttentionWeights(sourceNodeId) {
    const cacheKey = `attention-${sourceNodeId}`;
    if (this.attentionWeights.has(cacheKey)) {
      return this.attentionWeights.get(cacheKey);
    }

    const sourceNode = this.graph.nodes.find(n => n.id === sourceNodeId);
    if (!sourceNode) return [];

    const edges = this.graph.edges.filter(e => e.from === sourceNodeId);
    const attention = [];

    // Calculate attention scores for each neighbor
    edges.forEach(edge => {
      const targetNode = this.graph.nodes.find(n => n.id === edge.to);
      if (!targetNode) return;

      // Query: source node features
      const query = this.getNodeEmbedding(sourceNode);

      // Key: target node features
      const key = this.getNodeEmbedding(targetNode);

      // Compute attention score
      let score = this.dotProduct(query, key);

      // Normalize by dimension
      score /= Math.sqrt(query.length);

      // Incorporate mastery context
      const targetMastery = this.masteryProfile[edge.to] || 0;
      const sourceMastery = this.masteryProfile[sourceNodeId] || 0;

      // Boost attention for low-mastery targets (prioritize weak areas)
      const masteryFactor = (1 - targetMastery) / (1 - sourceMastery + 0.1);
      score *= masteryFactor;

      // Incorporate edge weight (prerequisite relationships)
      score *= (edge.weight || 0.5);

      attention.push({
        targetNodeId: edge.to,
        score,
        mastery: targetMastery,
        weight: edge.weight
      });
    });

    // Softmax normalization
    const maxScore = Math.max(...attention.map(a => a.score));
    attention.forEach(a => {
      a.score = Math.exp(a.score - maxScore);
    });

    const sumExp = attention.reduce((sum, a) => sum + a.score, 0);
    attention.forEach(a => {
      a.normalizedScore = a.score / sumExp;
    });

    this.attentionWeights.set(cacheKey, attention);
    return attention;
  }

  /**
   * Generate node embedding for attention calculation
   */
  getNodeEmbedding(node) {
    // Simple embedding based on node properties
    const embedding = [
      node.difficulty || 0.5,
      (this.masteryProfile[node.id] || 0),
      node.prerequisites?.length || 0,
      node.dependents?.length || 0
    ];

    return embedding;
  }

  /**
   * Dot product for attention scoring
   */
  dotProduct(a, b) {
    return a.reduce((sum, val, i) => sum + val * (b[i] || 0), 0);
  }

  /**
   * Multi-head attention propagation
   */
  multiHeadAttention(nodeId) {
    const heads = [];

    for (let h = 0; h < this.config.attentionHeads; h++) {
      const headAttention = this.calculateAttentionWeights(nodeId);

      // Apply different transformations per head (simplified)
      const transformedHead = headAttention.map(a => ({
        ...a,
        transformedScore: a.normalizedScore * Math.sin(h * Math.PI / this.config.attentionHeads)
      }));

      heads.push(transformedHead);
    }

    // Concatenate and combine heads
    const combined = [];
    this.graph.edges.filter(e => e.from === nodeId).forEach((edge, i) => {
      let totalScore = 0;
      heads.forEach(head => {
        const matching = head.find(a => a.targetNodeId === edge.to);
        if (matching) totalScore += matching.transformedScore;
      });

      combined.push({
        targetNodeId: edge.to,
        multiHeadScore: totalScore / this.config.attentionHeads
      });
    });

    return combined;
  }

  /**
   * Graph attention-based traversal
   */
  traverseWithAttention(startNodeId, depth = this.config.attentionDepth) {
    const visited = new Set();
    const path = [];
    const queue = [{ nodeId: startNodeId, depth, attention: 1.0 }];

    while (queue.length > 0) {
      const { nodeId, depth: currentDepth, attention } = queue.shift();

      if (visited.has(nodeId) || currentDepth === 0) continue;

      visited.add(nodeId);
      path.push({ nodeId, attention, depth: currentDepth });

      // Get attention-weighted neighbors
      const attentionScores = this.multiHeadAttention(nodeId);

      attentionScores.forEach(({ targetNodeId, multiHeadScore }) => {
        if (!visited.has(targetNodeId)) {
          queue.push({
            nodeId: targetNodeId,
            depth: currentDepth - 1,
            attention: attention * multiHeadScore
          });
        }
      });

      // Sort queue by attention score (greedy traversal)
      queue.sort((a, b) => b.attention - a.attention);
    }

    this.traversalPath = path;
    this.analytics.traversalsCompleted++;

    return path;
  }

  /**
   * Generate recommendations using attention weights
   */
  generateRecommendations(currentNodeId, count = this.config.maxRecommendations) {
    const attentionScores = this.calculateAttentionWeights(currentNodeId);

    const recommendations = attentionScores
      .map(({ targetNodeId, normalizedScore, mastery }) => {
        const targetNode = this.graph.nodes.find(n => n.id === targetNodeId);

        return {
          nodeId: targetNodeId,
          nodeName: targetNode?.label || targetNodeId,
          attentionWeight: normalizedScore,
          currentMastery: mastery,
          recommendedAction: this.recommendAction(mastery, targetNode?.difficulty || 0.5),
          timeToMastery: Math.ceil((1 - mastery) * 120), // minutes
          relatedSkills: this.findRelatedSkills(targetNodeId).slice(0, 3)
        };
      })
      .sort((a, b) => b.attentionWeight - a.attentionWeight)
      .slice(0, count);

    this.recommendations = recommendations;
    this.analytics.recommendationsGenerated += recommendations.length;

    return recommendations;
  }

  /**
   * Recommend action based on mastery
   */
  recommendAction(mastery, difficulty) {
    if (mastery < 0.2) {
      return 'Learn fundamentals';
    } else if (mastery < 0.5) {
      return 'Practice & strengthen';
    } else if (mastery < 0.8) {
      return 'Apply in context';
    } else {
      return 'Teach/mentor others';
    }
  }

  /**
   * Find related skills through graph
   */
  findRelatedSkills(nodeId) {
    const related = [];
    const visited = new Set();

    const traverse = (id, depth = 2) => {
      if (visited.has(id) || depth === 0) return;
      visited.add(id);

      this.graph.edges
        .filter(e => e.from === id || e.to === id)
        .forEach(edge => {
          const relatedId = edge.from === id ? edge.to : edge.from;
          if (relatedId !== nodeId && !visited.has(relatedId)) {
            const relatedNode = this.graph.nodes.find(n => n.id === relatedId);
            related.push({
              nodeId: relatedId,
              label: relatedNode?.label || relatedId,
              edgeType: edge.type,
              mastery: this.masteryProfile[relatedId] || 0
            });

            traverse(relatedId, depth - 1);
          }
        });
    };

    traverse(nodeId);
    return related.sort((a, b) => a.mastery - b.mastery);
  }

  /**
   * Update graph based on new mastery data
   */
  updateMasteryProfile(newMasteryData) {
    Object.assign(this.masteryProfile, newMasteryData);

    // Clear attention cache (needs recalculation)
    this.attentionWeights.clear();
  }

  /**
   * Iteratively refine recommendations
   */
  refineRecommendations(feedback) {
    // Use feedback to adjust attention weights
    feedback.forEach(({ nodeId, feedback: fb }) => {
      // Positive feedback: increase attention
      // Negative feedback: decrease attention
      const factor = fb === 'positive' ? 1.05 : 0.95;

      // Adjust via learning rate
      const edges = this.graph.edges.filter(e => e.to === nodeId);
      edges.forEach(edge => {
        const adjustment = (factor - 1) * this.config.learningRate;
        edge.weight = (edge.weight || 1) * (1 + adjustment);
      });
    });

    // Recalculate cache
    this.attentionWeights.clear();
  }

  /**
   * Get analytics
   */
  getAnalytics() {
    const avgAttention = this.traversalPath.length > 0 ?
      this.traversalPath.reduce((sum, p) => sum + p.attention, 0) / this.traversalPath.length : 0;

    return {
      ...this.analytics,
      averageAttentionWeight: avgAttention,
      currentPathLength: this.traversalPath.length,
      recommendationsReady: this.recommendations.length
    };
  }
}

export default GANKnowledgeGraphTraversal;
