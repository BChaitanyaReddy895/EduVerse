/**
 * AR Wall Projection System
 * Projects 3D concepts onto detected wall planes.
 * Robust, error-tolerant implementation with gesture controls.
 */

import * as THREE from 'three';

export class ARWallProjector {
  constructor(containerId = 'ar-wall-canvas') {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container ${containerId} not found`);
    }

    this.scene = new THREE.Scene();
    this.camera = null;
    this.renderer = null;
    this.wallPlane = null;
    this.projectedModels = [];
    this.isWallMode = false;
    this.autoRotate = false;
    this.gestures = {};
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.calibration = {
      scale: 1.0,
      offsetX: 0.0,
      offsetY: 0.0,
      rotation: 0.0,
    };
    this.blurOverlay = null;
    this._prevClear = { color: 0x000000, alpha: 0.12 };
    this._prevSceneBackground = null;

    this._initRenderer();
    this._setupLighting();
    this._setupEventListeners();
  }

  /**
   * Initialize Three.js renderer
   */
  _initRenderer() {
    try {
      this.camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      this.camera.position.z = 5;

      this.renderer = new THREE.WebGLRenderer({
        canvas: this.container,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });

      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.setClearColor(0x000000, 0.12);

      window.addEventListener('resize', () => this._onWindowResize());
      console.log('✓ Three.js renderer initialized');
    } catch (error) {
      console.error('Renderer initialization failed:', error);
      throw error;
    }
  }

  /**
   * Setup scene lighting for wall projection
   */
  _setupLighting() {
    // Brighter 3-point lighting for wall mode readability.
    this.ambientLight = new THREE.AmbientLight(0xffffff, 1.15);
    this.scene.add(this.ambientLight);

    this.keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
    this.keyLight.position.set(5, 9, 6);
    this.keyLight.castShadow = false;
    this.scene.add(this.keyLight);

    this.fillLight = new THREE.DirectionalLight(0xdbeafe, 0.75);
    this.fillLight.position.set(-5, 4, 3);
    this.scene.add(this.fillLight);

    this.rimLight = new THREE.PointLight(0xffffff, 0.65, 30);
    this.rimLight.position.set(0, 4, -2);
    this.scene.add(this.rimLight);

    console.log('✓ Scene lighting configured');
  }

  /**
   * Setup event listeners for gestures and interactions
   */
  _setupEventListeners() {
    // Mouse events for desktop testing
    document.addEventListener('mousemove', (e) => this._onMouseMove(e));
    document.addEventListener('click', (e) => this._onMouseClick(e));

    // Touch events for mobile
    document.addEventListener('touchstart', (e) => this._onTouchStart(e));
    document.addEventListener('touchmove', (e) => this._onTouchMove(e));
    document.addEventListener('touchend', (e) => this._onTouchEnd(e));

    // Keyboard controls
    document.addEventListener('keydown', (e) => this._onKeyDown(e));
  }

  /**
   * Create wall plane in scene
   */
  initializeWallPlane(planeData) {
    try {
      if (!planeData || !planeData.normal) {
        console.warn('Invalid plane data');
        return false;
      }

      // Create plane geometry
      const geometry = new THREE.PlaneGeometry(10, 7.5);
      const material = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        transparent: true,
        opacity: 0.05,
        roughness: 0.8,
        metalness: 0.1,
      });

      if (this.wallPlane) {
        this.scene.remove(this.wallPlane);
        this.wallPlane.geometry.dispose();
        this.wallPlane.material.dispose();
        this.wallPlane = null;
      }

      this.wallPlane = new THREE.Mesh(geometry, material);

      // Orient plane to match detected normal
      const normal = new THREE.Vector3(...planeData.normal);
      this.wallPlane.position.copy(normal.clone().multiplyScalar(planeData.distance));
      this.wallPlane.lookAt(
        this.wallPlane.position.clone().add(normal)
      );

      this.scene.add(this.wallPlane);
      console.log('✓ Wall plane initialized:', {
        distance: planeData.distance,
        confidence: planeData.confidence,
      });

      return true;
    } catch (error) {
      console.error('Wall plane initialization failed:', error);
      return false;
    }
  }

  /**
   * Project a 3D model onto the wall
   */
  projectModelOnWall(model, conceptName) {
    try {
      if (!this.wallPlane) {
        throw new Error('Wall plane not initialized');
      }

      if (!model || typeof model.clone !== 'function') {
        throw new Error('Invalid model');
      }

      // Clone model to avoid modifying original and normalize transform for wall projection.
      const clonedModel = model.clone(true);
      clonedModel.updateMatrixWorld(true);

      // Normalize root transform to avoid carrying viewport-specific offsets/scales into wall mode.
      const initialBox = new THREE.Box3().setFromObject(clonedModel);
      if (initialBox.isEmpty()) {
        throw new Error('Invalid model bounds');
      }
      const initialCenter = initialBox.getCenter(new THREE.Vector3());
      clonedModel.position.sub(initialCenter);
      clonedModel.updateMatrixWorld(true);

      // Scale model to fit wall
      const wallWidth = 8;
      const wallHeight = 6;

      const bbox = new THREE.Box3().setFromObject(clonedModel);
      if (bbox.isEmpty()) {
        throw new Error('Invalid model bounds');
      }

      const modelWidth = bbox.max.x - bbox.min.x;
      const modelHeight = bbox.max.y - bbox.min.y;

      if (modelWidth > 0 && modelHeight > 0) {
        const scaleX = wallWidth / modelWidth;
        const scaleY = wallHeight / modelHeight;
        const scale = Math.min(scaleX, scaleY) * 0.72; // Keep extra margin to avoid camera clipping

        clonedModel.scale.set(scale, scale, scale);
      }

      // Position and orient on wall
      clonedModel.position.copy(this.wallPlane.position);
      clonedModel.quaternion.copy(this.wallPlane.quaternion);

      // Offset along the wall normal in the direction of the camera so model remains visible.
      const wallNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(this.wallPlane.quaternion).normalize();
      const cameraDirection = this.camera.position.clone().sub(this.wallPlane.position).normalize();
      const visibilitySign = wallNormal.dot(cameraDirection) >= 0 ? 1 : -1;
      clonedModel.position.add(wallNormal.multiplyScalar(0.26 * visibilitySign));

      // Add metadata
      clonedModel.userData = {
        conceptName,
        originalScale: clonedModel.scale.clone(),
        basePosition: clonedModel.position.clone(),
        baseQuaternion: clonedModel.quaternion.clone(),
        isProjected: true,
      };

      this._applyCalibrationToModel(clonedModel);
      this.scene.add(clonedModel);
      this.projectedModels.push(clonedModel);
      this._frameProjectedModel(clonedModel);

      console.log(`✓ Projected '${conceptName}' on wall`);
      return clonedModel;
    } catch (error) {
      console.error(`Failed to project model '${conceptName}':`, error);
      return null;
    }
  }

  /**
   * Enable interactive mode for a projected model
   */
  enableInteraction(model) {
    model.userData.interactive = true;
    model.userData.isDragging = false;
  }

  /**
   * Rotate model with gesture
   */
  rotateModel(model, deltaX, deltaY) {
    if (!model || !model.userData.interactive) return;

    const rotationSpeed = 0.01;
    model.rotation.y += deltaX * rotationSpeed;
    model.rotation.x += deltaY * rotationSpeed;
  }

  /**
   * Move model along wall plane
   */
  moveModelOnWall(model, deltaX, deltaY) {
    if (!model || !model.userData.interactive) return;

    const moveSpeed = 0.02;
    model.position.x += deltaX * moveSpeed;
    model.position.y -= deltaY * moveSpeed;
  }

  /**
   * Exploded view: decompose model into parts
   */
  explodeModel(model) {
    try {
      if (!model) return;
      const meshParts = [];
      model.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.computeBoundingBox?.();
          const size = child.geometry?.boundingBox?.getSize(new THREE.Vector3()).lengthSq() || 0;
          if (size > 1e-5) {
            meshParts.push(child);
          }
        }
      });

      if (meshParts.length < 2) {
        console.warn('Model has insufficient mesh parts for explosion');
        return;
      }

      const modelCenter = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
      const exploding = !model.userData.exploded;
      const duration = 650;

      meshParts.forEach((part, index) => {
        if (!part.userData.originalExplodePosition) {
          part.userData.originalExplodePosition = part.position.clone();
        }

        const worldCenter = new THREE.Box3().setFromObject(part).getCenter(new THREE.Vector3());
        const direction = worldCenter.clone().sub(modelCenter).normalize();
        if (!Number.isFinite(direction.length()) || direction.length() === 0) {
          direction.set(((index % 2) * 2 - 1) * 0.4, ((index % 3) - 1) * 0.3, 0.35).normalize();
        }

        const explodeDistance = 0.45 + Math.min(1.25, Math.sqrt(index + 1) * 0.07);
        const target = exploding
          ? part.userData.originalExplodePosition.clone().add(direction.multiplyScalar(explodeDistance))
          : part.userData.originalExplodePosition.clone();

        const startPos = part.position.clone();
        const startTime = Date.now();
        const animate = () => {
          const t = Math.min(1, (Date.now() - startTime) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          part.position.lerpVectors(startPos, target, eased);
          if (t < 1) requestAnimationFrame(animate);
        };
        animate();
      });

      model.userData.exploded = exploding;
      console.log(`✓ ${exploding ? 'Exploded' : 'Restored'} view: ${meshParts.length} parts`);
    } catch (error) {
      console.error('Explosion animation failed:', error);
    }
  }

  /**
   * Start auto-rotation
   */
  startAutoRotate(model) {
    if (!model) return;
    this.autoRotate = true;
    model.userData.rotating = true;
  }

  /**
   * Stop auto-rotation
   */
  stopAutoRotate() {
    this.autoRotate = false;
    this.projectedModels.forEach((m) => {
      if (m.userData) m.userData.rotating = false;
    });
  }

  /**
   * Start presentation mode
   */
  startPresentationMode() {
    this.isWallMode = true;
    this._applyPresentationBackground('white');
    this.container.style.display = 'block';
    this.container.classList.add('active');
    this._showPresentationControls();
    console.log('✓ Presentation mode started');
  }

  /**
   * Exit presentation mode
   */
  exitPresentationMode() {
    this.isWallMode = false;
    this.container.style.display = 'none';
    this.container.classList.remove('active');
    this._restorePresentationBackground();
    this._hidePresentationControls();
    console.log('✓ Presentation mode exited');
  }

  _applyPresentationBackground(mode = 'white') {
    // Save current renderer + scene background so we can restore cleanly.
    if (this.renderer) {
      const c = new THREE.Color();
      this.renderer.getClearColor(c);
      this._prevClear = { color: c.getHex(), alpha: this.renderer.getClearAlpha() };
    }
    this._prevSceneBackground = this.scene.background || null;

    if (mode === 'white') {
      // Full white background to maximize visibility on low-end displays.
      this.scene.background = new THREE.Color(0xffffff);
      if (this.renderer) this.renderer.setClearColor(0xffffff, 1.0);
      this._removeBlurOverlay();
    } else {
      this.scene.background = new THREE.Color(0x000000);
      if (this.renderer) this.renderer.setClearColor(0x000000, 0.12);
      this._ensureBlurOverlay();
    }
  }

  _restorePresentationBackground() {
    this.scene.background = this._prevSceneBackground;
    if (this.renderer) {
      this.renderer.setClearColor(this._prevClear.color, this._prevClear.alpha);
    }
    this._removeBlurOverlay();
  }

  /**
   * Show presentation controls
   */
  _showPresentationControls() {
    if (document.getElementById('presentation-controls')) {
      return; // Already shown
    }

    const controls = document.createElement('div');
    controls.id = 'presentation-controls';
    controls.className = 'presentation-controls';
    controls.innerHTML = `
      <div class="control-bar">
        <button id="prev-concept">← Prev</button>
        <span id="concept-counter">1 / 1</span>
        <button id="next-concept">Next →</button>
        <button id="explode-btn">Explode</button>
        <button id="rotate-btn">Auto-Rotate</button>
        <button id="exit-presentation">Exit (ESC)</button>
      </div>
      <div class="help-text">
        🖱 Drag to move | Scroll wheel to rotate | Double-click to explode
      </div>
      <div class="help-text" style="margin-top:8px;border-top:1px solid rgba(255,255,255,0.15);padding-top:8px;">
        Wall Calibration
        <div style="display:grid;grid-template-columns:1fr auto;gap:6px;align-items:center;margin-top:6px;font-size:12px;">
          <label>Scale</label><input id="wall-cal-scale" type="range" min="0.5" max="1.8" step="0.01" value="${this.calibration.scale}">
          <label>Offset X</label><input id="wall-cal-offset-x" type="range" min="-2.5" max="2.5" step="0.01" value="${this.calibration.offsetX}">
          <label>Offset Y</label><input id="wall-cal-offset-y" type="range" min="-2.5" max="2.5" step="0.01" value="${this.calibration.offsetY}">
          <label>Rotation</label><input id="wall-cal-rotation" type="range" min="-180" max="180" step="1" value="${this.calibration.rotation}">
        </div>
        <button id="wall-cal-reset" style="margin-top:8px;padding:6px 10px;border:none;border-radius:6px;background:#334155;color:#fff;cursor:pointer;">Reset Calibration</button>
      </div>
    `;
    document.body.appendChild(controls);
  }

  setCalibration(partialCalibration = {}) {
    this.calibration = {
      ...this.calibration,
      ...partialCalibration,
    };
    this.projectedModels.forEach((model) => this._applyCalibrationToModel(model));
  }

  resetCalibration() {
    this.calibration = {
      scale: 1.0,
      offsetX: 0.0,
      offsetY: 0.0,
      rotation: 0.0,
    };
    this.projectedModels.forEach((model) => this._applyCalibrationToModel(model));
  }

  _applyCalibrationToModel(model) {
    if (!model || !model.userData?.basePosition || !model.userData?.baseQuaternion || !model.userData?.originalScale) {
      return;
    }

    const basePosition = model.userData.basePosition.clone();
    const baseQuaternion = model.userData.baseQuaternion.clone();
    const baseScale = model.userData.originalScale.clone();

    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(baseQuaternion).normalize();
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(baseQuaternion).normalize();
    const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(baseQuaternion).normalize();

    const offset = right.multiplyScalar(this.calibration.offsetX).add(up.multiplyScalar(this.calibration.offsetY));
    model.position.copy(basePosition.clone().add(offset));
    model.scale.copy(baseScale.multiplyScalar(this.calibration.scale));

    const rotationRad = THREE.MathUtils.degToRad(this.calibration.rotation);
    const rotQuat = new THREE.Quaternion().setFromAxisAngle(normal, rotationRad);
    model.quaternion.copy(baseQuaternion).multiply(rotQuat);
    this._frameProjectedModel(model);
  }

  _frameProjectedModel(model) {
    if (!model || !this.camera || !this.wallPlane) return;

    const box = new THREE.Box3().setFromObject(model);
    if (box.isEmpty()) return;

    const center = box.getCenter(new THREE.Vector3());
    const sphere = box.getBoundingSphere(new THREE.Sphere());

    const planeNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(this.wallPlane.quaternion).normalize();
    const camDir = this.camera.position.clone().sub(this.wallPlane.position).normalize();
    const sign = planeNormal.dot(camDir) >= 0 ? 1 : -1;

    const vFov = THREE.MathUtils.degToRad(this.camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * this.camera.aspect);
    const fitFov = Math.min(vFov, hFov);
    const distance = Math.max(2.0, (sphere.radius / Math.sin(fitFov / 2)) * 1.08);
    const upOffset = 0;
    const targetCameraPos = center
      .clone()
      .add(planeNormal.clone().multiplyScalar(distance * sign))
      .add(new THREE.Vector3(0, upOffset, 0));

    this.camera.position.copy(targetCameraPos);
    this.camera.lookAt(center);
    this.camera.updateProjectionMatrix();
  }

  _ensureBlurOverlay() {
    if (this.blurOverlay) return;
    const overlay = document.createElement('div');
    overlay.id = 'ar-wall-blur-overlay';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 998;
      pointer-events: none;
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      background: rgba(2, 6, 23, 0.12);
    `;
    document.body.appendChild(overlay);
    this.blurOverlay = overlay;
  }

  _removeBlurOverlay() {
    if (this.blurOverlay) {
      this.blurOverlay.remove();
      this.blurOverlay = null;
    }
  }

  /**
   * Hide presentation controls
   */
  _hidePresentationControls() {
    const controls = document.getElementById('presentation-controls');
    if (controls) {
      controls.remove();
    }
  }

  /**
   * Animation loop
   */
  animate() {
    requestAnimationFrame(() => this.animate());

    // Auto-rotate if enabled
    if (this.autoRotate) {
      this.projectedModels.forEach((model) => {
        if (model.userData && model.userData.rotating) {
          model.rotation.y += 0.008;
        }
      });
    }

    try {
      this.renderer.render(this.scene, this.camera);
    } catch (error) {
      console.error('Render error:', error);
    }
  }

  /**
   * Resize handler
   */
  _onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Mouse move handler
   */
  _onMouseMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  /**
   * Mouse click handler
   */
  _onMouseClick(event) {
    // Raycasting to select models
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.projectedModels, true);

    if (intersects.length > 0) {
      let model = intersects[0].object;
      while (model && !this.projectedModels.includes(model)) {
        model = model.parent;
      }
      if (model.userData && model.userData.interactive) {
        this.explodeModel(model);
      }
    }
  }

  /**
   * Touch start handler
   */
  _onTouchStart(event) {
    this.gestures.startX = event.touches[0].clientX;
    this.gestures.startY = event.touches[0].clientY;

    if (event.touches.length === 2) {
      const dx = event.touches[1].clientX - event.touches[0].clientX;
      const dy = event.touches[1].clientY - event.touches[0].clientY;
      this.gestures.initialDistance = Math.sqrt(dx * dx + dy * dy);
    }
  }

  /**
   * Touch move handler
   */
  _onTouchMove(event) {
    if (event.touches.length === 1 && this.projectedModels.length > 0) {
      const model = this.projectedModels[0];
      const deltaX = event.touches[0].clientX - this.gestures.startX;
      const deltaY = event.touches[0].clientY - this.gestures.startY;

      this.moveModelOnWall(model, deltaX, deltaY);
      this.gestures.startX = event.touches[0].clientX;
      this.gestures.startY = event.touches[0].clientY;
    } else if (event.touches.length === 2 && this.projectedModels.length > 0) {
      const model = this.projectedModels[0];
      const dx = event.touches[1].clientX - event.touches[0].clientX;
      const dy = event.touches[1].clientY - event.touches[0].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (this.gestures.initialDistance) {
        const scale = distance / this.gestures.initialDistance;
        model.rotation.z += (scale - 1) * 0.1;
      }
    }
  }

  /**
   * Touch end handler
   */
  _onTouchEnd(event) {
    this.gestures = {};
  }

  /**
   * Keyboard handler
   */
  _onKeyDown(event) {
    if (event.key === 'Escape') {
      this.exitPresentationMode();
    } else if (event.key === 'r' || event.key === 'R') {
      if (this.projectedModels.length > 0) {
        if (this.autoRotate) {
          this.stopAutoRotate();
        } else {
          this.startAutoRotate(this.projectedModels[0]);
        }
      }
    } else if (event.key === 'e' || event.key === 'E') {
      if (this.projectedModels.length > 0) {
        this.explodeModel(this.projectedModels[0]);
      }
    }
  }
}
