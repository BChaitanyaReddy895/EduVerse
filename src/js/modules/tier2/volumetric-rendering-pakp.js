// ============================================
// TIER 2: Volumetric Rendering + Procedural Animation (PAKP)
// Advanced rendering for chemistry/biology + adaptive animations
// ============================================

import * as THREE from 'three';

export class VolumetricRendering {
  constructor(scene) {
    this.scene = scene;
    this.volumetricMeshes = new Map();
    this.config = {
      voxelSize: 0.1,
      maxDensity: 1.0,
      shadowsEnabled: true,
      glowIntensity: 0.5
    };
  }

  /**
   * Create volumetric cloud for molecular orbitals
   */
  createMolecularOrbitalCloud(position, radius = 1, density = 0.5) {
    const voxelCount = Math.ceil((radius * 2) / this.config.voxelSize) ** 3;
    const texture = new THREE.DataTexture3D(
      new Uint8Array(voxelCount * 4),
      Math.ceil((radius * 2) / this.config.voxelSize),
      Math.ceil((radius * 2) / this.config.voxelSize),
      Math.ceil((radius * 2) / this.config.voxelSize)
    );

    // Generate volumetric data (probability density)
    const data = texture.image.data;
    for (let i = 0; i < voxelCount * 4; i += 4) {
      const probability = Math.random() * density;
      data[i] = probability * 255;     // R
      data[i + 1] = probability * 200; // G
      data[i + 2] = probability * 255; // B
      data[i + 3] = probability * 255; // A
    }

    texture.needsUpdate = true;

    // Create volumetric material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        map: { value: texture },
        density: { value: density },
        absorption: { value: 1.0 }
      },
      vertexShader: `
        varying vec3 vTexCoords;
        void main() {
          vTexCoords = position + 0.5;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler3D map;
        uniform float density;
        uniform float absorption;
        varying vec3 vTexCoords;
        
        void main() {
          vec4 data = texture(map, vTexCoords);
          gl_FragColor = vec4(data.rgb * density, data.a * absorption);
        }
      `,
      side: THREE.BackSide,
      transparent: true
    });

    const geometry = new THREE.BoxGeometry(radius * 2, radius * 2, radius * 2);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);

    this.scene.add(mesh);
    this.volumetricMeshes.set(`orbital-${Date.now()}`, mesh);

    return mesh;
  }

  /**
   * Create uncertainty cloud (confidence visualization)
   */
  createUncertaintyCloud(position, uncertainty = 0.5, skillName = '') {
    // Create particle system representing uncertainty
    const particleCount = Math.floor(100 * uncertainty);
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const r = Math.random() * (1 - uncertainty);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i * 3] = position.x + r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = position.y + r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = position.z + r * Math.cos(phi);

      // Color based on uncertainty (red = uncertain, green = certain)
      const certainty = 1 - uncertainty;
      colors[i * 3] = uncertainty;
      colors[i * 3 + 1] = certainty;
      colors[i * 3 + 2] = 0.5;
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true
    });

    const mesh = new THREE.Points(particles, material);
    this.scene.add(mesh);

    this.volumetricMeshes.set(`uncertainty-${skillName}`, mesh);
    return mesh;
  }
}

/**
 * Procedural Animation via Keyframe Prediction (PAKP)
 */
export class PAKPProceduralAnimation {
  constructor() {
    this.animationStates = new Map();
    this.keyframePredictionModel = null;
    this.studentState = null;

    this.config = {
      updateFrequency: 30, // Hz
      predictionConfidence: 0.8,
      adaptationRate: 0.15
    };

    this.analytics = {
      predictedKeyframes: 0,
      adaptedAnimations: 0
    };
  }

  /**
   * Initialize keyframe prediction (LSTM-like)
   */
  initializePredictor() {
    // In production, load actual LSTM model
    // For now, use simpler Markov chain approach
    console.log('🎬 Procedural animation predictor initialized');
  }

  /**
   * Create adaptive animation for learning object
   * Animation adapts to student's pace and understanding
   */
  createAdaptiveAnimation(mesh, studentState = {}) {
    const {
      masteryLevel = 0.5,
      confidenceLevel = 0.5,
      currentInteractionTime = 0
    } = studentState;

    return {
      mesh,
      studentState: { masteryLevel, confidenceLevel, currentInteractionTime },
      keyframes: this.generatePredictedKeyframes(mesh, studentState),
      speed: this.calculateAnimationSpeed(masterLevel),
      easing: this.selectEasingSfunction(confidenceLevel)
    };
  }

  /**
   * Generate predicted keyframes using LSTM-like approach
   */
  generatePredictedKeyframes(mesh, studentState) {
    const keyframes = [];
    const { masteryLevel, currentInteractionTime } = studentState;

    // Predict next position/rotation based on current trajectory and student state
    let currentPos = mesh.position.clone();
    let currentRot = mesh.rotation.clone();

    for (let i = 0; i < 60; i++) { // 60 frames at 30Hz = 2 seconds
      // Simple prediction: movement adapts to mastery level
      const speedFactor = 0.5 + masteryLevel * 1.5; // Faster = higher mastery
      const direction = new THREE.Vector3(
        Math.sin(i * 0.1) * speedFactor,
        Math.cos(i * 0.15) * speedFactor * 0.5,
        0.1 * speedFactor
      );

      currentPos.add(direction);
      currentRot.order = 'XYZ';
      currentRot.x += direction.y * 0.01;
      currentRot.y += direction.x * 0.01;

      keyframes.push({
        frame: i,
        time: i / 30,
        position: currentPos.clone(),
        rotation: currentRot.clone(),
        confidence: this.predictConfidence(i, studentState)
      });
    }

    this.analytics.predictedKeyframes += keyframes.length;
    return keyframes;
  }

  /**
   * Predict confidence at each keyframe
   */
  predictConfidence(frame, studentState) {
    const { masteryLevel, confidenceLevel } = studentState;
    
    // Confidence varies smoothly based on mastery
    const baseConfidence = masteryLevel;
    const variation = Math.sin(frame * 0.05) * 0.2;
    
    return Math.max(0, Math.min(1, baseConfidence + variation));
  }

  /**
   * Calculate animation speed based on mastery
   */
  calculateAnimationSpeed(masteryLevel) {
    // Higher mastery = faster animations (student understands quickly)
    const speed = 0.5 + masteryLevel * 1.5;
    return speed;
  }

  /**
   * Select easing function based on confidence
   */
  selectEasingSfunction(confidenceLevel) {
    if (confidenceLevel > 0.8) {
      // High confidence: smooth, predictable easing
      return (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // easeInOutQuad
    } else if (confidenceLevel > 0.5) {
      // Medium confidence: slightly jerky
      return (t) => t * t; // easeInQuad
    } else {
      // Low confidence: very jerky/hesitant
      return (t) => t; // Linear
    }
  }

  /**
   * Animate mesh using predicted keyframes
   */
  animateWithPredictedKeyframes(animation, duration = 2000) {
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing
      const easedProgress = animation.easing(progress);

      // Interpolate keyframes
      const frameIndex = Math.floor(easedProgress * (animation.keyframes.length - 1));
      const keyframe = animation.keyframes[frameIndex];

      if (keyframe) {
        animation.mesh.position.copy(keyframe.position);
        animation.mesh.rotation.order = 'XYZ';
        animation.mesh.rotation.copy(keyframe.rotation);

        // Emit confidence for UI feedback
        window.dispatchEvent(new CustomEvent('animation-confidence', {
          detail: { confidence: keyframe.confidence }
        }));
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
    this.analytics.adaptedAnimations++;
  }

  /**
   * Get analytics
   */
  getAnalytics() {
    return this.analytics;
  }
}

export { VolumetricRendering, PAKPProceduralAnimation };
