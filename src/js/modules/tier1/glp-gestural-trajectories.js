// ============================================
// TIER 1: Gestural Learning Trajectories (GLP)
// Hand movement analysis for non-intrusive assessment
// ============================================

export class GLPGesturalTrajectories {
  constructor() {
    this.trajectories = [];
    this.currentTrajectory = null;
    this.handTracker = null;
    this.isTracking = false;

    // Gesture features for LSTM
    this.trajectoryFeatures = {
      smoothness: 0,
      speedVariance: 0,
      curvature: 0,
      accelerationProfile: 0,
      pauseFrequency: 0,
      directionChanges: 0,
      amplitude: 0,
      duration: 0
    };

    // ML model for mastery prediction
    this.masteryPredictor = null;
    this.trainingData = [];

    this.config = {
      minTrajectoryLength: 10,
      minTrajectoryDuration: 300, // ms
      samplingRate: 30, // Hz
      smoothingFactor: 0.7,
      curveThreshold: 0.1
    };

    this.analytics = {
      totalGestures: 0,
      confidenceCorrect: [],
      confidenceWrong: [],
      gesturePatterns: [],
      masteryPredictions: []
    };
  }

  /**
   * Initialize hand tracking via MediaPipe
   */
  async initializeHandTracking() {
    try {
      // Load MediaPipe Hands solution
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.4/camera_utils.js';
      document.head.appendChild(script);

      console.log('🤲 Hand tracking initialized');
      this.isTracking = true;
      return true;
    } catch (error) {
      console.error('Hand tracking initialization failed:', error);
      return false;
    }
  }

  /**
   * Record hand position
   */
  recordHandPosition(handLandmarks, timestamp = Date.now()) {
    if (!this.isTracking) return;

    if (!this.currentTrajectory) {
      this.startNewTrajectory(timestamp);
    }

    // Extract hand position (wrist or palm center)
    const wrist = handLandmarks[0];
    const position = {
      x: wrist.x,
      y: wrist.y,
      z: wrist.z || 0,
      timestamp,
      confidence: wrist.confidence || 0.8
    };

    this.currentTrajectory.points.push(position);
  }

  /**
   * Start recording new gesture trajectory
   */
  startNewTrajectory(timestamp) {
    this.currentTrajectory = {
      id: `trajectory-${Date.now()}`,
      startTime: timestamp,
      points: [],
      metadata: {}
    };
  }

  /**
   * End trajectory and analyze gesture
   */
  endTrajectory(timestamp = Date.now()) {
    if (!this.currentTrajectory) return null;

    this.currentTrajectory.endTime = timestamp;
    this.currentTrajectory.duration = timestamp - this.currentTrajectory.startTime;

    // Only analyze if trajectory is significant
    if (this.currentTrajectory.points.length < this.config.minTrajectoryLength ||
        this.currentTrajectory.duration < this.config.minTrajectoryDuration) {
      this.currentTrajectory = null;
      return null;
    }

    // Extract features from trajectory
    const features = this.extractTrajectoryFeatures(this.currentTrajectory);
    this.currentTrajectory.features = features;

    // Predict mastery from gesture
    const masteryPrediction = this.predictMasteryFromGesture(features);
    this.currentTrajectory.masteryPrediction = masteryPrediction;

    this.trajectories.push(this.currentTrajectory);
    this.analytics.totalGestures++;
    this.analytics.masteryPredictions.push(masteryPrediction);

    const completed = this.currentTrajectory;
    this.currentTrajectory = null;

    return completed;
  }

  /**
   * Extract features from hand trajectory
   * Formula: Temporal + Spatial + Kinematic features
   */
  extractTrajectoryFeatures(trajectory) {
    const points = trajectory.points;
    if (points.length < 2) return this.trajectoryFeatures;

    // Calculate features
    let smoothness = this.calculateSmoothness(points);
    let speedVariance = this.calculateSpeedVariance(points);
    let curvature = this.calculateCurvature(points);
    let accelerationProfile = this.calculateAccelerationProfile(points);
    let pauseFrequency = this.calculatePauseFrequency(points);
    let directionChanges = this.calculateDirectionChanges(points);
    let amplitude = this.calculateAmplitude(points);
    let duration = trajectory.duration;

    const features = {
      smoothness,
      speedVariance,
      curvature,
      accelerationProfile,
      pauseFrequency,
      directionChanges,
      amplitude,
      duration,
      pointCount: points.length
    };

    // Normalize features to 0-1
    features.smoothness = Math.min(smoothness / 10, 1);
    features.speedVariance = Math.min(speedVariance / 1, 1);
    features.curvature = Math.min(curvature / 5, 1);
    features.accelerationProfile = Math.min(accelerationProfile / 2, 1);
    features.pauseFrequency = Math.min(pauseFrequency / 5, 1);
    features.directionChanges = Math.min(directionChanges / 20, 1);
    features.amplitude = Math.min(amplitude / 2, 1);
    features.duration = Math.min(duration / 5000, 1);

    return features;
  }

  /**
   * Calculate smoothness (derivative of velocity)
   * High smoothness = confident, low = hesitant
   */
  calculateSmoothness(points) {
    const velocities = [];
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i-1].x;
      const dy = points[i].y - points[i-1].y;
      const dz = points[i].z - points[i-1].z;
      const dt = (points[i].timestamp - points[i-1].timestamp) / 1000;
      
      if (dt > 0) {
        velocities.push(Math.sqrt(dx*dx + dy*dy + dz*dz) / dt);
      }
    }

    // Calculate velocity variance (inverse of smoothness)
    const avgVel = velocities.reduce((a, b) => a + b, 0) / velocities.length;
    const variance = velocities.reduce((sum, v) => sum + Math.pow(v - avgVel, 2), 0) / velocities.length;
    
    return 1 / (1 + Math.sqrt(variance)); // Smooth = high value
  }

  /**
   * Calculate speed variance
   * Consistent speed = confident understanding
   */
  calculateSpeedVariance(points) {
    const speeds = [];
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i-1].x;
      const dy = points[i].y - points[i-1].y;
      const dz = points[i].z - points[i-1].z;
      const dt = (points[i].timestamp - points[i-1].timestamp) / 1000;
      
      if (dt > 0) {
        speeds.push(Math.sqrt(dx*dx + dy*dy + dz*dz) / dt);
      }
    }

    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    const variance = speeds.reduce((sum, s) => sum + Math.pow(s - avgSpeed, 2), 0) / speeds.length;
    
    return Math.sqrt(variance);
  }

  /**
   * Calculate curvature (how curved the path is)
   * Straight path = direct/confident, curved = exploring/hesitant
   */
  calculateCurvature(points) {
    let totalCurvature = 0;
    
    for (let i = 1; i < points.length - 1; i++) {
      const p0 = { x: points[i-1].x, y: points[i-1].y, z: points[i-1].z };
      const p1 = { x: points[i].x, y: points[i].y, z: points[i].z };
      const p2 = { x: points[i+1].x, y: points[i+1].y, z: points[i+1].z };

      // Calculate angle between segments
      const v1 = { x: p1.x - p0.x, y: p1.y - p0.y, z: p1.z - p0.z };
      const v2 = { x: p2.x - p1.x, y: p2.y - p1.y, z: p2.z - p1.z };

      const len1 = Math.sqrt(v1.x*v1.x + v1.y*v1.y + v1.z*v1.z);
      const len2 = Math.sqrt(v2.x*v2.x + v2.y*v2.y + v2.z*v2.z);

      if (len1 > 0 && len2 > 0) {
        const dot = (v1.x*v2.x + v1.y*v2.y + v1.z*v2.z) / (len1 * len2);
        totalCurvature += Math.acos(Math.max(-1, Math.min(1, dot)));
      }
    }

    return totalCurvature;
  }

  /**
   * Calculate acceleration profile
   */
  calculateAccelerationProfile(points) {
    const accelerations = [];
    
    for (let i = 2; i < points.length; i++) {
      const vel1 = {
        x: points[i-1].x - points[i-2].x,
        y: points[i-1].y - points[i-2].y,
        z: points[i-1].z - points[i-2].z
      };
      const vel2 = {
        x: points[i].x - points[i-1].x,
        y: points[i].y - points[i-1].y,
        z: points[i].z - points[i-1].z
      };

      const accel = Math.sqrt(
        Math.pow(vel2.x - vel1.x, 2) +
        Math.pow(vel2.y - vel1.y, 2) +
        Math.pow(vel2.z - vel1.z, 2)
      );

      accelerations.push(accel);
    }

    const avgAccel = accelerations.reduce((a, b) => a + b, 0) / accelerations.length;
    return avgAccel;
  }

  /**
   * Calculate pause frequency (moments of stillness)
   */
  calculatePauseFrequency(points) {
    let pauseCount = 0;
    const speedThreshold = 0.01; // Very slow movement = pause

    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i-1].x;
      const dy = points[i].y - points[i-1].y;
      const dz = points[i].z - points[i-1].z;
      const dt = (points[i].timestamp - points[i-1].timestamp) / 1000;
      
      const speed = Math.sqrt(dx*dx + dy*dy + dz*dz) / (dt + 0.001);
      if (speed < speedThreshold) {
        pauseCount++;
      }
    }

    return pauseCount;
  }

  /**
   * Calculate direction changes (corners/turns)
   */
  calculateDirectionChanges(points) {
    let changeCount = 0;
    const angleThreshold = Math.PI / 4; // 45 degrees

    for (let i = 1; i < points.length - 1; i++) {
      const v1 = {
        x: points[i].x - points[i-1].x,
        y: points[i].y - points[i-1].y,
        z: points[i].z - points[i-1].z
      };
      const v2 = {
        x: points[i+1].x - points[i].x,
        y: points[i+1].y - points[i].y,
        z: points[i+1].z - points[i].z
      };

      const len1 = Math.sqrt(v1.x*v1.x + v1.y*v1.y + v1.z*v1.z);
      const len2 = Math.sqrt(v2.x*v2.x + v2.y*v2.y + v2.z*v2.z);

      if (len1 > 0 && len2 > 0) {
        const dot = (v1.x*v2.x + v1.y*v2.y + v1.z*v2.z) / (len1 * len2);
        const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
        
        if (angle > angleThreshold) {
          changeCount++;
        }
      }
    }

    return changeCount;
  }

  /**
   * Calculate amplitude (how far the hand moved)
   */
  calculateAmplitude(points) {
    const start = points[0];
    const end = points[points.length - 1];
    
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dz = end.z - start.z;
    
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
  }

  /**
   * Predict mastery level from gesture features
   * Uses LSTM-like analysis (for now, simple heuristic)
   */
  predictMasteryFromGesture(features) {
    // Mastery indicators from features:
    // High smoothness = confident = high mastery
    // Low speed variance = focused = high mastery
    // Low pause frequency = no hesitation = high mastery
    // Straight path (low curvature) = direct approach = high mastery
    // Consistent acceleration = controlled = high mastery

    const confidence = 
      0.25 * features.smoothness +           // Smooth = confident
      0.20 * (1 - features.speedVariance) +  // Consistent speed = confident
      0.20 * (1 - features.pauseFrequency) + // No pauses = confident
      0.20 * (1 - features.curvature) +      // Straight path = confident
      0.15 * (1 - features.accelerationProfile); // Controlled = confident

    return {
      masteryLevel: Math.max(0, Math.min(1, confidence)),
      features,
      confidence: confidence,
      interpretation: this.interpretGestureConfidence(confidence)
    };
  }

  /**
   * Interpret gesture confidence level
   */
  interpretGestureConfidence(confidence) {
    if (confidence > 0.8) {
      return 'Very Confident (Expert)';
    } else if (confidence > 0.6) {
      return 'Confident (Proficient)';
    } else if (confidence > 0.4) {
      return 'Moderate (Developing)';
    } else if (confidence > 0.2) {
      return 'Hesitant (Learning)';
    } else {
      return 'Very Hesitant (Novice)';
    }
  }

  /**
   * Get gesture pattern analysis
   */
  getGesturePatterns() {
    if (this.trajectories.length === 0) return [];

    // Group similar gestures
    const patterns = {};

    this.trajectories.forEach(traj => {
      if (!traj.features) return;

      // Simple clustering based on features
      const featureVector = Object.values(traj.features).slice(0, 5).join(',');
      if (!patterns[featureVector]) {
        patterns[featureVector] = {
          count: 0,
          avgMastery: 0,
          trajectories: []
        };
      }

      patterns[featureVector].count++;
      patterns[featureVector].avgMastery += traj.masteryPrediction.masteryLevel;
      patterns[featureVector].trajectories.push(traj);
    });

    // Calculate averages
    Object.keys(patterns).forEach(key => {
      patterns[key].avgMastery /= patterns[key].count;
    });

    return patterns;
  }

  /**
   * Train mastery predictor with labeled data
   */
  trainMasteryPredictor(labeledTrajectories) {
    // In production, use TensorFlow.js + LSTM
    // For now, collect training data
    labeledTrajectories.forEach(({ trajectory, actualMastery }) => {
      this.trainingData.push({
        features: trajectory.features,
        label: actualMastery
      });
    });

    console.log(`📊 Training data collected: ${this.trainingData.length} samples`);
  }

  /**
   * Get analytics
   */
  getAnalytics() {
    const avgPredictedMastery = this.analytics.masteryPredictions.length > 0 ?
      this.analytics.masteryPredictions.reduce((a, b) => a + b.masteryLevel, 0) / this.analytics.masteryPredictions.length :
      0;

    return {
      ...this.analytics,
      totalTrajectories: this.trajectories.length,
      avgPredictedMastery,
      gesturePatterns: this.getGesturePatterns(),
      trainingDataSize: this.trainingData.length
    };
  }

  /**
   * Reset tracker
   */
  reset() {
    this.trajectories = [];
    this.currentTrajectory = null;
    this.analytics.masteryPredictions = [];
    this.analytics.totalGestures = 0;
  }
}

export default GLPGesturalTrajectories;
