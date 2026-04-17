// ============================================
// TIER 3: Predictive Scene Transitions (PNSTF)
// AI predicts optimal next scene & pre-renders for smooth UX
// ============================================

export class PNSTFPredictiveTransitions {
  constructor(sceneGraph = {}, studentInteractionHistory = []) {
    this.sceneGraph = sceneGraph; // { scenes: [], transitions: [] }
    this.currentScene = null;
    this.nextScenePrediction = null;
    this.predictionConfidence = 0;
    
    this.interactionHistory = studentInteractionHistory;
    this.sceneVisitTimes = new Map();
    this.transitionPatterns = [];

    this.config = {
      predictionHorizon: 3, // Predict up to 3 scenes ahead
      preRenderBufferSize: 2,
      confidenceThreshold: 0.65,
      updateFrequency: 100 // ms
    };

    this.analytics = {
      correctPredictions: 0,
      incorrectPredictions: 0,
      averageConfidence: 0,
      predictionAccuracy: 0,
      transitionsSaved: 0
    };

    this.preRenderBuffer = new Map(); // Cache for pre-rendered scenes
    this.predictionModel = null;
  }

  /**
   * Initialize prediction model
   */
  initializeModel() {
    // Analyze historical patterns
    this.extractTransitionPatterns();
    this.buildMarkovChain();
    console.log('🔮 Predictive transition model initialized');
  }

  /**
   * Extract transition patterns from history
   */
  extractTransitionPatterns() {
    const patterns = new Map();

    for (let i = 0; i < this.interactionHistory.length - 1; i++) {
      const current = this.interactionHistory[i];
      const next = this.interactionHistory[i + 1];

      if (current.type === 'scene_visited' && next.type === 'scene_visited') {
        const key = `${current.sceneId}->${next.sceneId}`;
        patterns.set(key, (patterns.get(key) || 0) + 1);
      }
    }

    this.transitionPatterns = Array.from(patterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50);
  }

  /**
   * Build Markov chain for scene transitions
   */
  buildMarkovChain() {
    this.markovChain = new Map();

    this.transitionPatterns.forEach(([transition, count]) => {
      const [from, to] = transition.split('->');
      const transitions = this.markovChain.get(from) || [];
      transitions.push({ to, probability: count });
      this.markovChain.set(from, transitions);
    });

    // Normalize probabilities
    this.markovChain.forEach((transitions) => {
      const total = transitions.reduce((sum, t) => sum + t.probability, 0);
      transitions.forEach(t => {
        t.probability /= total;
      });
    });
  }

  /**
   * Predict next scene(s)
   */
  predictNextScenes(currentSceneId, studentState = {}) {
    if (!this.markovChain) {
      this.initializeModel();
    }

    const predictions = [];
    const { masteryDistribution = {}, recentActions = [] } = studentState;

    // Get Markov transitions
    const markovTransitions = this.markovChain.get(currentSceneId) || [];

    markovTransitions.forEach(transition => {
      let score = transition.probability;

      // Adjust score based on mastery
      const sceneMastery = masteryDistribution[transition.to] || 0;
      const difficultyBoost = sceneMastery < 0.5 ? 1.2 : 0.8; // Boost low-mastery scenes
      score *= difficultyBoost;

      // Consider recency (if recently visited, less likely)
      const lastVisit = this.sceneVisitTimes.get(transition.to) || -1000000;
      const timeSinceVisit = Date.now() - lastVisit;
      const recencyFactor = Math.min(1, timeSinceVisit / (24 * 60 * 60 * 1000)); // 1 day
      score *= recencyFactor;

      // Consider student action patterns
      if (recentActions.includes('struggle')) {
        // If struggling, suggest easier/related content
        score *= 0.9;
      } else if (recentActions.includes('quick_solve')) {
        // If quick solve, suggest harder content
        score *= 1.1;
      }

      predictions.push({
        sceneId: transition.to,
        score,
        confidence: Math.min(1, score),
        reason: this.explainPrediction(transition.to, currentSceneId, studentState)
      });
    });

    // Sort by score
    predictions.sort((a, b) => b.score - a.score);

    // Take top predictions
    const topPredictions = predictions.slice(0, this.config.predictionHorizon);

    this.nextScenePrediction = topPredictions[0];
    this.predictionConfidence = topPredictions[0]?.confidence || 0;

    return topPredictions;
  }

  /**
   * Explain why a scene is predicted
   */
  explainPrediction(nextSceneId, currentSceneId, studentState) {
    const reasons = [];

    // Check prerequisites
    if (this.sceneGraph.transitions) {
      const transition = this.sceneGraph.transitions.find(
        t => t.from === currentSceneId && t.to === nextSceneId
      );

      if (transition?.type === 'prerequisite_completion') {
        reasons.push('natural_progression');
      }
    }

    // Check mastery
    const mastery = studentState.masteryDistribution?.[nextSceneId] || 0;
    if (mastery < 0.3) {
      reasons.push('reinforcement_needed');
    } else if (mastery > 0.8) {
      reasons.push('expertise_deepening');
    }

    // Check frequency
    const frequency = this.sceneVisitTimes.get(nextSceneId);
    if (!frequency) {
      reasons.push('not_yet_visited');
    } else if (Date.now() - frequency > 30 * 60 * 1000) {
      reasons.push('review_recommended');
    }

    return reasons.join(', ') || 'based_on_learning_patterns';
  }

  /**
   * Pre-render predicted scene
   */
  preRenderScene(sceneId, renderFunction) {
    if (this.preRenderBuffer.has(sceneId)) {
      return this.preRenderBuffer.get(sceneId);
    }

    try {
      const rendered = renderFunction(sceneId);
      this.preRenderBuffer.set(sceneId, rendered);

      // Trim buffer if too large
      if (this.preRenderBuffer.size > this.config.preRenderBufferSize) {
        const firstKey = this.preRenderBuffer.keys().next().value;
        this.preRenderBuffer.delete(firstKey);
      }

      return rendered;
    } catch (error) {
      console.error(`Failed to pre-render scene ${sceneId}:`, error);
      return null;
    }
  }

  /**
   * Smoothly transition to predicted scene
   */
  transitionToScene(nextSceneId, currentScene, transitionDuration = 800) {
    return new Promise((resolve) => {
      const startTime = Date.now();

      // Get pre-rendered scene if available
      const nextScene = this.preRenderBuffer.get(nextSceneId);

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / transitionDuration, 1);

        // Fade out current
        if (currentScene) {
          currentScene.opacity = 1 - progress;
        }

        // Fade in next
        if (nextScene) {
          nextScene.opacity = progress;
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.currentScene = nextSceneId;
          this.sceneVisitTimes.set(nextSceneId, Date.now());

          // Track prediction accuracy
          if (this.nextScenePrediction?.sceneId === nextSceneId) {
            this.analytics.correctPredictions++;
          } else {
            this.analytics.incorrectPredictions++;
          }

          resolve();
        }
      };

      animate();
    });
  }

  /**
   * Proactive pre-render of likely next scenes
   */
  proactivePreRender(currentSceneId, studentState, renderFunction) {
    const predictions = this.predictNextScenes(currentSceneId, studentState);

    predictions.slice(0, 2).forEach(prediction => {
      this.preRenderScene(prediction.sceneId, renderFunction);
    });
  }

  /**
   * Log scene visit for learning
   */
  logSceneVisit(sceneId, visitDuration) {
    this.interactionHistory.push({
      type: 'scene_visited',
      sceneId,
      timestamp: Date.now(),
      duration: visitDuration
    });

    // Update visit time
    this.sceneVisitTimes.set(sceneId, Date.now());
  }

  /**
   * Get analytics
   */
  getAnalytics() {
    const total = this.analytics.correctPredictions + this.analytics.incorrectPredictions;
    const accuracy = total > 0 ? this.analytics.correctPredictions / total : 0;

    return {
      ...this.analytics,
      predictionAccuracy: accuracy,
      averageConfidence: this.predictionConfidence,
      transitionsSaved: this.preRenderBuffer.size,
      totalPredictions: total
    };
  }
}

export default PNSTFPredictiveTransitions;
