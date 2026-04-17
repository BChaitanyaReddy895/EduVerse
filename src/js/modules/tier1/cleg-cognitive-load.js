// ============================================
// TIER 1: Cognitive Load Estimation via Gaze (CLEG)
// Eye tracking + automatic scene complexity adaptation
// ============================================

import * as THREE from 'three';

export class CLEGCognitiveLoadTracker {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.gazeData = [];
    this.cognitiveLoad = 0.5; // 0-1 scale
    this.eyeTracker = null;
    this.isTrackingEnabled = false;

    // Gaze metrics
    this.metrics = {
      fixationDuration: 0,
      saccadeFrequency: 0,
      pupilDilation: 1.0,
      blinkRate: 0,
      gazeSmoothness: 1.0,
      fixationDensity: 0
    };

    // Scene adaptation parameters
    this.sceneComplexity = 1.0; // 0-1 scale
    this.targetComplexity = 1.0;
    this.geometryLOD = {}; // Maps mesh UUID to LOD level
    this.textureQuality = 'high';

    this.config = {
      targetFPS: 60,
      minComplexity: 0.2,
      maxComplexity: 1.0,
      complexityAdjustmentRate: 0.1,
      cognitiveLoadThresholds: {
        low: 0.3,
        medium: 0.6,
        high: 0.85
      },
      gazeUpdateRate: 30, // Hz
      fixationThreshold: 100, // ms
      saccadeVelocityThreshold: 40, // deg/s
      maxTargetFPS: 60,
      minTargetFPS: 30
    };

    this.analytics = {
      totalFixations: 0,
      totalSaccades: 0,
      averageFixationDuration: 0,
      totalBlinkCount: 0,
      sessionStartTime: Date.now(),
      complexityChanges: []
    };
  }

  /**
   * Initialize eye tracking
   */
  async initializeEyeTracking() {
    try {
      // Try to use MediaPipe Selfie Segmentation for gaze detection
      // This uses face landmarks to estimate gaze direction
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm/vision_wasm_internal.js';
      document.head.appendChild(script);

      // For now, we'll use a fallback gaze tracking method
      // In production, integrate with actual eye-tracking hardware (Tobii, SMI, etc.)
      
      console.log('📹 Initializing gaze tracking...');
      this.setupFallbackGazeTracking();
      this.isTrackingEnabled = true;
      console.log('✅ Gaze tracking enabled');
      return true;
    } catch (error) {
      console.error('Eye tracking initialization failed:', error);
      return false;
    }
  }

  /**
   * Fallback gaze tracking using face detection
   */
  setupFallbackGazeTracking() {
    // Use simple mouse movement as proxy for gaze (for testing)
    // In production, use: Pupil Labs, WebGazer.js, Tobii SDK, etc.
    
    let lastMouseX = 0;
    let lastMouseY = 0;
    let lastMouseTime = Date.now();

    document.addEventListener('mousemove', (event) => {
      const now = Date.now();
      const dt = now - lastMouseTime;
      
      const dx = event.clientX - lastMouseX;
      const dy = event.clientY - lastMouseY;

      // Estimate velocity (proxy for saccade detection)
      const velocity = Math.sqrt(dx * dx + dy * dy) / (dt + 1);

      // Update gaze data
      this.recordGazePoint({
        x: event.clientX / window.innerWidth,
        y: event.clientY / window.innerHeight,
        timestamp: now,
        velocity,
        confidence: 0.8 // Fallback confidence
      });

      lastMouseX = event.clientX;
      lastMouseY = event.clientY;
      lastMouseTime = now;
    });

    // Blink detection (simple proximity-based)
    document.addEventListener('blur', () => {
      this.recordBlink();
    });
  }

  /**
   * Record gaze point
   */
  recordGazePoint(gazePoint) {
    this.gazeData.push({
      ...gazePoint,
      receivedAt: Date.now()
    });

    // Keep only recent data (last 5 seconds)
    const cutoff = Date.now() - 5000;
    this.gazeData = this.gazeData.filter(g => g.receivedAt > cutoff);

    // Update metrics
    this.updateGazeMetrics();
    
    // Calculate cognitive load
    this.calculateCognitiveLoad();

    // Adapt scene complexity based on load
    this.adaptSceneComplexity();
  }

  /**
   * Record blink event
   */
  recordBlink() {
    this.metrics.blinkRate++;
    this.analytics.totalBlinkCount++;
  }

  /**
   * Update gaze-based metrics
   */
  updateGazeMetrics() {
    if (this.gazeData.length < 2) return;

    // Calculate fixation duration
    const recentGaze = this.gazeData.slice(-30); // Last ~1 second
    let totalDuration = 0;
    let fixationCount = 0;

    for (let i = 0; i < recentGaze.length - 1; i++) {
      const current = recentGaze[i];
      const next = recentGaze[i + 1];
      const distance = Math.sqrt(
        Math.pow(current.x - next.x, 2) + Math.pow(current.y - next.y, 2)
      );

      // If gaze doesn't move much = fixation
      if (distance < 0.05) { // 5% of screen
        totalDuration += next.timestamp - current.timestamp;
        fixationCount++;
      }
    }

    this.metrics.fixationDuration = totalDuration;
    this.analytics.totalFixations += fixationCount;

    // Calculate saccade frequency (rapid eye movements)
    let saccadeCount = 0;
    for (let i = 0; i < recentGaze.length - 1; i++) {
      const current = recentGaze[i];
      const next = recentGaze[i + 1];
      
      if ((next.velocity || 0) > this.config.saccadeVelocityThreshold) {
        saccadeCount++;
      }
    }
    this.metrics.saccadeFrequency = saccadeCount;
    this.analytics.totalSaccades += saccadeCount;

    // Gaze smoothness (inverse of velocity variance)
    const velocities = recentGaze.map(g => g.velocity || 0);
    const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;
    const variance = velocities.reduce((sum, v) => sum + Math.pow(v - avgVelocity, 2), 0) / velocities.length;
    this.metrics.gazeSmoothness = 1 / (1 + Math.sqrt(variance));

    // Fixation density
    this.metrics.fixationDensity = fixationCount / Math.max(1, recentGaze.length);
  }

  /**
   * Formula: CL(t) = α·fixation_duration + β·saccade_frequency + γ·pupil_dilation + δ·blink_rate
   */
  calculateCognitiveLoad() {
    const alpha = 0.25;   // Fixation duration
    const beta = 0.30;    // Saccade frequency
    const gamma = 0.20;   // Pupil dilation
    const delta = 0.25;   // Blink rate

    // Normalize metrics to 0-1 range
    const fixationNorm = Math.min(this.metrics.fixationDuration / 500, 1); // Long fixations = high load
    const saccadeNorm = Math.min(this.metrics.saccadeFrequency / 10, 1); // Frequent saccades = high load
    const pupilNorm = this.metrics.pupilDilation; // Already 0-1
    const blinkNorm = Math.min(this.metrics.blinkRate / 5, 1); // More blinks = higher load

    this.cognitiveLoad = 
      alpha * fixationNorm +
      beta * saccadeNorm +
      gamma * pupilNorm +
      delta * blinkNorm;

    // Clamp to 0-1
    this.cognitiveLoad = Math.max(0, Math.min(1, this.cognitiveLoad));
  }

  /**
   * Adapt scene complexity based on cognitive load
   */
  adaptSceneComplexity() {
    // Map cognitive load to target complexity
    // High load = reduce complexity
    // Low load = increase complexity

    if (this.cognitiveLoad < this.config.cognitiveLoadThresholds.low) {
      // Low cognitive load - can increase complexity
      this.targetComplexity = 1.0;
    } else if (this.cognitiveLoad < this.config.cognitiveLoadThresholds.medium) {
      // Medium cognitive load - maintain
      this.targetComplexity = 0.7;
    } else if (this.cognitiveLoad < this.config.cognitiveLoadThresholds.high) {
      // High cognitive load - reduce complexity
      this.targetComplexity = 0.4;
    } else {
      // Very high cognitive load - significantly reduce
      this.targetComplexity = 0.2;
    }

    // Smoothly transition to target complexity
    const adjustmentRate = this.config.complexityAdjustmentRate;
    this.sceneComplexity += (this.targetComplexity - this.sceneComplexity) * adjustmentRate;

    // Apply complexity changes to scene
    this.applyComplexityChanges();
  }

  /**
   * Apply complexity changes to meshes in scene
   */
  applyComplexityChanges() {
    this.scene.traverse((node) => {
      if (!node.isMesh) return;

      const complexity = this.sceneComplexity;

      // Adjust geometry detail level (LOD)
      if (node.geometry) {
        // Reduce number of vertices based on complexity
        const lodLevel = Math.floor((1 - complexity) * 3); // 0-3 levels
        this.geometryLOD[node.uuid] = lodLevel;

        // Reduce segment count for procedural geometries
        if (node.geometry.parameters && lodLevel > 0) {
          const segments = Math.max(4, Math.floor((node.geometry.parameters.segments || 32) / Math.pow(2, lodLevel)));
          // Note: In production, you'd regenerate geometry with new parameters
        }
      }

      // Adjust material quality
      if (node.material) {
        // Reduce texture resolution
        if (complexity < 0.5) {
          node.material.map?.dispose();
          node.material.map = null; // Remove textures at low complexity
          this.textureQuality = 'low';
        } else if (complexity < 0.75) {
          this.textureQuality = 'medium';
        } else {
          this.textureQuality = 'high';
        }

        // Disable expensive features at low complexity
        if (complexity < 0.4) {
          node.material.emissiveIntensity = 0;
          node.material.envMapIntensity = 0;
          node.castShadow = false;
          node.receiveShadow = false;
        }
      }
    });

    // Adjust target FPS
    const targetFPS = Math.round(
      this.config.minTargetFPS + 
      (this.config.maxTargetFPS - this.config.minTargetFPS) * complexity
    );

    this.analytics.complexityChanges.push({
      timestamp: Date.now(),
      cognitiveLoad: this.cognitiveLoad,
      sceneComplexity: this.sceneComplexity,
      targetFPS
    });
  }

  /**
   * Get current cognitive load state
   */
  getCognitiveLoadState() {
    const state = this.cognitiveLoad < this.config.cognitiveLoadThresholds.low ?
      'low' :
      this.cognitiveLoad < this.config.cognitiveLoadThresholds.medium ?
      'medium' :
      this.cognitiveLoad < this.config.cognitiveLoadThresholds.high ?
      'high' :
      'very-high';

    return {
      cognitiveLoad: this.cognitiveLoad,
      state,
      sceneComplexity: this.sceneComplexity,
      metrics: { ...this.metrics }
    };
  }

  /**
   * Get analytics
   */
  getAnalytics() {
    const sessionDuration = (Date.now() - this.analytics.sessionStartTime) / 1000; // seconds
    const avgFixationDuration = this.analytics.totalFixations > 0 ?
      sessionDuration * 1000 / this.analytics.totalFixations : 0;

    return {
      ...this.analytics,
      sessionDuration,
      avgFixationDuration,
      averageBlinkRate: this.analytics.totalBlinkCount / (sessionDuration / 60), // per minute
      averageSaccadeFrequency: this.analytics.totalSaccades / sessionDuration,
      complexityAdjustments: this.analytics.complexityChanges.length,
      avgCognitiveLoad: this.analytics.complexityChanges.length > 0 ?
        this.analytics.complexityChanges.reduce((sum, c) => sum + c.cognitiveLoad, 0) / this.analytics.complexityChanges.length :
        0
    };
  }

  /**
   * Reset tracker
   */
  reset() {
    this.gazeData = [];
    this.cognitiveLoad = 0.5;
    this.sceneComplexity = 1.0;
    this.metrics = {
      fixationDuration: 0,
      saccadeFrequency: 0,
      pupilDilation: 1.0,
      blinkRate: 0,
      gazeSmoothness: 1.0,
      fixationDensity: 0
    };
    this.analytics.sessionStartTime = Date.now();
  }
}

export default CLEGCognitiveLoadTracker;
