/**
 * AR Wall & Dynamic Learning Integration Module
 * Combines wall projection with adaptive concept learning
 * Production-ready with comprehensive error handling
 */

import { ARWallDetector } from './ar-wall-detector.js';
import { ARWallProjector } from './ar-wall-projector.js';
import '../../styles/wall-presentation.css';

export class ARWallLearningSystem {
  constructor(apiBaseUrl = 'http://127.0.0.1:5000') {
    this.apiBaseUrl = apiBaseUrl;
    this.wallDetector = null;
    this.wallProjector = null;
    this.videoStream = null;
    this.presentationConcepts = [];
    this.currentConceptIndex = 0;
    this.isInitialized = false;
    this.learningInProgress = false;
    this._projectionRetryTimers = new Map();
  }

  /**
   * Initialize AR wall system
   */
  async initialize() {
    try {
      console.log('🚀 Initializing AR Wall & Learning System...');

      // Create required DOM elements
      this._createCanvases();

      // Initialize wall projector
      this.wallProjector = new ARWallProjector('ar-wall-canvas');
      console.log('✓ Wall projector initialized');

      // Request camera permissions
      const cameraReady = await this._requestCameraAccess();

      // Initialize wall detector
      const videoElement = document.getElementById('camera-feed');
      const canvasElement = document.getElementById('wall-detection-canvas');
      this.wallDetector = new ARWallDetector(videoElement, canvasElement);
      console.log('✓ Wall detector initialized');

      if (!cameraReady) {
        console.warn('Camera unavailable; using virtual wall fallback mode');
      }

      // Start detection and rendering
      this.wallDetector.startDetection();
      this.wallProjector.animate();

      if (!cameraReady) {
        const virtualPlane = {
          centroid: { x: 0, y: 0 },
          normal: [0, 0, 1],
          distance: 3.2,
          confidence: 1.0,
          flatness: 1.0,
          pixelCount: 0,
          source: 'virtual-fallback',
        };

        // Preseed detector + projector with a deterministic virtual wall so presentation always works.
        this.wallDetector.detectedPlane = virtualPlane;
        this.wallProjector.initializeWallPlane(virtualPlane);
      }

      this.isInitialized = true;
      console.log('✅ AR Wall & Learning System ready!');

      return true;
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      this._showErrorMessage('Failed to initialize AR system: ' + error.message);
      return false;
    }
  }

  /**
   * Create required canvas elements
   */
  _createCanvases() {
    // AR wall canvas
    if (!document.getElementById('ar-wall-canvas')) {
      const canvas = document.createElement('canvas');
      canvas.id = 'ar-wall-canvas';
      document.body.appendChild(canvas);
    }

    // Camera feed for wall detection
    if (!document.getElementById('camera-feed')) {
      const video = document.createElement('video');
      video.id = 'camera-feed';
      video.autoplay = true;
      video.playsinline = true;
      video.style.display = 'none';
      document.body.appendChild(video);
    }

    // Wall detection canvas (small preview)
    if (!document.getElementById('wall-detection-canvas')) {
      const canvas = document.createElement('canvas');
      canvas.id = 'wall-detection-canvas';
      canvas.width = 200;
      canvas.height = 150;
      document.body.appendChild(canvas);
    }
  }

  /**
   * Request camera access
   */
  async _requestCameraAccess() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      const videoElement = document.getElementById('camera-feed');
      videoElement.srcObject = stream;
      this.videoStream = stream;

      console.log('✓ Camera access granted');
      return true;
    } catch (error) {
      console.warn('Camera access denied; continuing without live wall tracking:', error.message);
      return false;
    }
  }

  /**
   * Start wall presentation mode
   */
  startPresentation() {
    try {
      if (!this.isInitialized) {
        throw new Error('System not initialized');
      }

      if (this.presentationConcepts.length === 0) {
        throw new Error('No concepts to present');
      }

      this.wallProjector.startPresentationMode();
      this._setupPresentationControls();
      this._showFirstConcept();

      console.log('✓ Presentation started');
      return true;
    } catch (error) {
      console.error('Presentation start failed:', error);
      this._showErrorMessage(error.message);
      return false;
    }
  }

  /**
   * Add concept to presentation
   */
  async addConceptToPresentation(conceptName, model3D) {
    try {
      if (!this.isInitialized) {
        throw new Error('System not initialized');
      }

      if (!conceptName || typeof conceptName !== 'string') {
        throw new Error('Invalid concept name');
      }

      if (!model3D) {
        throw new Error('3D model required');
      }

      this.presentationConcepts.push({
        name: conceptName,
        model: model3D,
        projectedModel: null,
      });

      console.log(`✓ Added '${conceptName}' to presentation`);
      return true;
    } catch (error) {
      console.error('Failed to add concept:', error);
      return false;
    }
  }

  clearPresentationQueue() {
    this.presentationConcepts = [];
    this.currentConceptIndex = 0;

    if (this.wallProjector && Array.isArray(this.wallProjector.projectedModels)) {
      this.wallProjector.projectedModels.forEach((model) => {
        this.wallProjector.scene.remove(model);
      });
      this.wallProjector.projectedModels = [];
    }
  }

  /**
   * Show current concept in presentation
   */
  _showFirstConcept() {
    if (this.presentationConcepts.length === 0) return;

    this.currentConceptIndex = 0;
    this._displayConcept(0);
  }

  /**
   * Display a specific concept
   */
  _displayConcept(index) {
    try {
      if (index < 0 || index >= this.presentationConcepts.length) {
        console.warn('Concept index out of bounds');
        return;
      }

      const concept = this.presentationConcepts[index];

      // Update wall plane if detected
      const plane = this.wallDetector.getDetectedPlane();
      const hasHighConfidencePlane = typeof this.wallDetector.hasHighConfidencePlane === 'function'
        ? this.wallDetector.hasHighConfidencePlane(0.5)
        : !!(plane && plane.confidence >= 0.5);

      if (plane && hasHighConfidencePlane) {
        if (!this.wallProjector.wallPlane) {
          this.wallProjector.initializeWallPlane(plane);
        }
      } else if (plane && !this.wallProjector.wallPlane && plane.confidence >= 0.35) {
        // Fall back to a softer threshold so projection can still proceed when detection is stable but not perfect.
        this.wallProjector.initializeWallPlane(plane);
      }

      if (!this.wallProjector.wallPlane) {
        if (this._projectionRetryTimers.has(index)) {
          return;
        }

        console.warn('Wall plane not ready yet; using a fallback plane so the concept is still visible');
        const fallbackPlane = plane || {
          centroid: { x: 0, y: 0 },
          normal: [0, 0, 1],
          distance: 3.0,
          confidence: 0.25,
          flatness: 0.25,
          pixelCount: 0,
        };
        this.wallProjector.initializeWallPlane(fallbackPlane);

        const retryTimer = setTimeout(() => {
          this._projectionRetryTimers.delete(index);
          const latestPlane = this.wallDetector.getDetectedPlane();
          if (latestPlane && latestPlane.confidence >= 0.5) {
            if (this.wallProjector.wallPlane) {
              this.wallProjector.scene.remove(this.wallProjector.wallPlane);
              this.wallProjector.wallPlane = null;
            }
            this.wallProjector.initializeWallPlane(latestPlane);
          }
        }, 1500);
        this._projectionRetryTimers.set(index, retryTimer);
      }

      // Clear previous projection
      if (this.wallProjector.projectedModels.length > 0) {
        this.wallProjector.projectedModels.forEach((m) => {
          this.wallProjector.scene.remove(m);
        });
        this.wallProjector.projectedModels = [];
      }

      // Project new concept
      const projectedModel = this.wallProjector.projectModelOnWall(
        concept.model,
        concept.name
      );

      if (projectedModel) {
        this.wallProjector.enableInteraction(projectedModel);
        concept.projectedModel = projectedModel;
      }

      // Update counter
      document.getElementById('concept-counter').textContent =
        `${index + 1} / ${this.presentationConcepts.length}`;

      this.currentConceptIndex = index;
      console.log(`📍 Displaying concept: ${concept.name}`);
    } catch (error) {
      console.error('Failed to display concept:', error);
    }
  }

  /**
   * Navigate to next concept
   */
  nextConcept() {
    const nextIndex = this.currentConceptIndex + 1;
    if (nextIndex < this.presentationConcepts.length) {
      this._displayConcept(nextIndex);
    }
  }

  /**
   * Navigate to previous concept
   */
  previousConcept() {
    const prevIndex = this.currentConceptIndex - 1;
    if (prevIndex >= 0) {
      this._displayConcept(prevIndex);
    }
  }

  /**
   * Setup presentation controls
   */
  _setupPresentationControls() {
    try {
      setTimeout(() => {
        const prevBtn = document.getElementById('prev-concept');
        const nextBtn = document.getElementById('next-concept');
        const explodeBtn = document.getElementById('explode-btn');
        const rotateBtn = document.getElementById('rotate-btn');
        const exitBtn = document.getElementById('exit-presentation');
        const scaleRange = document.getElementById('wall-cal-scale');
        const offsetXRange = document.getElementById('wall-cal-offset-x');
        const offsetYRange = document.getElementById('wall-cal-offset-y');
        const rotationRange = document.getElementById('wall-cal-rotation');
        const resetCalibrationBtn = document.getElementById('wall-cal-reset');

        if (prevBtn) prevBtn.addEventListener('click', () => this.previousConcept());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextConcept());
        if (explodeBtn)
          explodeBtn.addEventListener('click', () => {
            if (this.wallProjector.projectedModels.length > 0) {
              this.wallProjector.explodeModel(this.wallProjector.projectedModels[0]);
            }
          });
        if (rotateBtn)
          rotateBtn.addEventListener('click', () => {
            if (this.wallProjector.projectedModels.length > 0) {
              if (this.wallProjector.autoRotate) {
                this.wallProjector.stopAutoRotate();
              } else {
                this.wallProjector.startAutoRotate(this.wallProjector.projectedModels[0]);
              }
            }
          });
        if (exitBtn)
          exitBtn.addEventListener('click', () => this.stopPresentation());

        const onCalibrationChange = () => {
          if (!this.wallProjector) return;
          this.wallProjector.setCalibration({
            scale: parseFloat(scaleRange?.value || '1') || 1,
            offsetX: parseFloat(offsetXRange?.value || '0') || 0,
            offsetY: parseFloat(offsetYRange?.value || '0') || 0,
            rotation: parseFloat(rotationRange?.value || '0') || 0,
          });
        };

        if (scaleRange) scaleRange.addEventListener('input', onCalibrationChange);
        if (offsetXRange) offsetXRange.addEventListener('input', onCalibrationChange);
        if (offsetYRange) offsetYRange.addEventListener('input', onCalibrationChange);
        if (rotationRange) rotationRange.addEventListener('input', onCalibrationChange);
        if (resetCalibrationBtn) {
          resetCalibrationBtn.addEventListener('click', () => {
            if (scaleRange) scaleRange.value = '1';
            if (offsetXRange) offsetXRange.value = '0';
            if (offsetYRange) offsetYRange.value = '0';
            if (rotationRange) rotationRange.value = '0';
            if (this.wallProjector) this.wallProjector.resetCalibration();
          });
        }
      }, 100);
    } catch (error) {
      console.error('Failed to setup controls:', error);
    }
  }

  /**
   * Stop presentation mode
   */
  stopPresentation() {
    try {
      this.wallProjector.exitPresentationMode();
      this.currentConceptIndex = 0;
      console.log('✓ Presentation stopped');
      return true;
    } catch (error) {
      console.error('Failed to stop presentation:', error);
      return false;
    }
  }

  /**
   * Teach system a new concept with sample images
   */
  async teachConcept(conceptName, imageBase64Array) {
    if (this.learningInProgress) {
      this._showErrorMessage('Learning already in progress');
      return false;
    }

    try {
      this.learningInProgress = true;

      if (!conceptName || typeof conceptName !== 'string') {
        throw new Error('Invalid concept name');
      }

      if (!Array.isArray(imageBase64Array) || imageBase64Array.length < 2) {
        throw new Error('Minimum 2 images required');
      }

      if (imageBase64Array.length > 10) {
        throw new Error('Maximum 10 images allowed');
      }

      console.log(`📚 Teaching concept: '${conceptName}' with ${imageBase64Array.length} images`);

      const response = await fetch(`${this.apiBaseUrl}/learn-concept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: conceptName,
          images: imageBase64Array,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Learning failed');
      }

      const result = await response.json();
      console.log(`✓ Learned concept: ${result.message}`);
      this._showSuccessMessage(`✓ Learned "${conceptName}" with confidence ${result.profile.confidence?.toFixed(2) || 'N/A'}`);

      this.learningInProgress = false;
      return result.profile;
    } catch (error) {
      console.error('Teaching failed:', error);
      this._showErrorMessage('Failed to teach concept: ' + error.message);
      this.learningInProgress = false;
      return null;
    }
  }

  /**
   * Provide feedback on classification
   */
  async provideFeedback(conceptName, wasCorrect, cosine, visualQuality) {
    try {
      if (!conceptName || typeof wasCorrect !== 'boolean') {
        throw new Error('Invalid feedback parameters');
      }

      const response = await fetch(`${this.apiBaseUrl}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: conceptName,
          was_correct: wasCorrect,
          cosine,
          visual_quality: visualQuality,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Feedback submission failed');
      }

      const result = await response.json();
      console.log(`✓ Feedback recorded: ${result.message}`);
      return true;
    } catch (error) {
      console.error('Feedback submission failed:', error);
      return false;
    }
  }

  /**
   * Show error message to user
   */
  _showErrorMessage(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(244, 67, 54, 0.9);
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10000;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    notification.textContent = '❌ ' + message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 4000);
  }

  /**
   * Show success message to user
   */
  _showSuccessMessage(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(76, 175, 80, 0.9);
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10000;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
  }

  /**
   * Cleanup and destroy system
   */
  destroy() {
    try {
      if (this.wallDetector) {
        this.wallDetector.stopDetection();
      }

      if (this.videoStream) {
        this.videoStream.getTracks().forEach((track) => track.stop());
      }

      if (this.wallProjector && this.wallProjector.renderer) {
        this.wallProjector.renderer.dispose();
      }

      this.isInitialized = false;
      console.log('✓ AR Wall & Learning System destroyed');
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

// Export for global use
window.ARWallLearningSystem = ARWallLearningSystem;
