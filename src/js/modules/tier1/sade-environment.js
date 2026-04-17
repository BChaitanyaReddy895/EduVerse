// ============================================
// TIER 1: Surface-Aware Didactic Environments (SADE)
// WebXR surface detection + lesson placement
// ============================================

import * as THREE from 'three';

export class SADEEnvironment {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.xrSession = null;
    this.xrRefSpace = null;
    this.detectedPlanes = new Map();
    this.placedLessons = [];
    this.isXREnabled = false;
    this.surfaceGeometries = new Map();
    
    this.config = {
      minPlaneSize: 0.1,
      maxPlaneSize: 100,
      updateFrequency: 100, // ms
      visualizeDetection: true
    };

    this.analytics = {
      planesDetected: 0,
      lessonsPlaced: 0,
      userInteractions: []
    };
  }

  /**
   * Initialize WebXR session
   */
  async initXR() {
    if (!navigator.xr) {
      console.warn('WebXR not supported. Using fallback mode.');
      return false;
    }

    try {
      const xrSession = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test', 'dom-overlay', 'dom-overlay-for-handheld-ar'],
        domOverlay: { root: document.body },
        optionalFeatures: ['plane-detection', 'dom-plane-detection']
      });

      this.xrSession = xrSession;
      this.isXREnabled = true;

      // Get XR reference space
      this.xrRefSpace = await xrSession.requestReferenceSpace('local');

      // Setup XR event listeners
      this.setupXREventListeners();

      console.log('✅ WebXR session initialized');
      return true;
    } catch (error) {
      console.error('WebXR initialization failed:', error);
      return false;
    }
  }

  /**
   * Setup XR event listeners for plane detection
   */
  setupXREventListeners() {
    if (!this.xrSession) return;

    // Plane detection events
    this.xrSession.addEventListener('plane-detected', (event) => {
      this.handlePlaneDetected(event);
    });

    this.xrSession.addEventListener('plane-updated', (event) => {
      this.handlePlaneUpdated(event);
    });

    this.xrSession.addEventListener('plane-removed', (event) => {
      this.handlePlaneRemoved(event);
    });

    // Frame update loop
    const animate = (time, frame) => {
      if (!this.isXREnabled) return;
      
      this.updateDetectedPlanes(frame);
      this.xrSession.requestAnimationFrame(animate);
    };

    this.xrSession.requestAnimationFrame(animate);
  }

  /**
   * Handle detected planes
   */
  handlePlaneDetected(event) {
    const plane = event.plane;
    const planeId = plane.id;
    
    this.detectedPlanes.set(planeId, {
      id: planeId,
      polygon: plane.polygon,
      xrPlane: plane,
      detectedAt: Date.now(),
      surfaceType: this.classifySurface(plane),
      isVertical: this.isVerticalSurface(plane),
      area: this.calculatePolygonArea(plane.polygon)
    });

    this.analytics.planesDetected++;

    // Visualize detected surface if enabled
    if (this.config.visualizeDetection) {
      this.visualizePlane(planeId);
    }

    console.log(`📍 Plane detected: ${planeId} (${this.detectedPlanes.get(planeId).surfaceType})`);
  }

  /**
   * Handle plane updates
   */
  handlePlaneUpdated(event) {
    const plane = event.plane;
    const existing = this.detectedPlanes.get(plane.id);
    if (existing) {
      existing.polygon = plane.polygon;
      existing.area = this.calculatePolygonArea(plane.polygon);
    }
  }

  /**
   * Handle plane removal
   */
  handlePlaneRemoved(event) {
    const planeId = event.plane.id;
    this.detectedPlanes.delete(planeId);
    
    // Remove visualization
    const geometry = this.surfaceGeometries.get(planeId);
    if (geometry) {
      this.scene.remove(geometry);
      this.surfaceGeometries.delete(planeId);
    }
  }

  /**
   * Classify surface type based on normal vector
   */
  classifySurface(plane) {
    const normal = plane.orientation || { x: 0, y: 1, z: 0 };
    const normalVec = new THREE.Vector3(normal.x, normal.y, normal.z);
    
    // Horizontal (floor/ceiling)
    if (Math.abs(normalVec.y) > 0.8) {
      return normalVec.y > 0 ? 'ceiling' : 'floor';
    }
    // Vertical (wall)
    else if (Math.abs(normalVec.y) < 0.2) {
      return 'wall';
    }
    // Tilted surface
    return 'tilted';
  }

  /**
   * Determine if surface is vertical
   */
  isVerticalSurface(plane) {
    const normal = plane.orientation || { x: 0, y: 1, z: 0 };
    return Math.abs(normal.y) < 0.2;
  }

  /**
   * Calculate area of polygon
   */
  calculatePolygonArea(polygon) {
    if (!polygon || polygon.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < polygon.length; i++) {
      const p1 = polygon[i];
      const p2 = polygon[(i + 1) % polygon.length];
      area += (p1.x * p2.z - p2.x * p1.z) / 2;
    }
    return Math.abs(area);
  }

  /**
   * Visualize detected surfaces
   */
  visualizePlane(planeId) {
    const planeData = this.detectedPlanes.get(planeId);
    if (!planeData) return;

    const { polygon, surfaceType } = planeData;
    const points = polygon.map(p => new THREE.Vector3(p.x, 0, p.z));
    
    // Create mesh from polygon
    const shape = new THREE.Shape();
    if (points.length > 0) {
      shape.moveTo(points[0].x, points[0].z);
      for (let i = 1; i < points.length; i++) {
        shape.lineTo(points[i].x, points[i].z);
      }
    }

    const geometry = new THREE.ShapeGeometry(shape);
    
    // Color based on surface type
    const colors = {
      floor: 0x10B981,
      ceiling: 0x6366F1,
      wall: 0xF59E0B,
      tilted: 0x8B5CF6
    };

    const material = new THREE.MeshBasicMaterial({
      color: colors[surfaceType] || 0x64748B,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);
    this.surfaceGeometries.set(planeId, mesh);
  }

  /**
   * Update detected planes each frame
   */
  updateDetectedPlanes(frame) {
    if (!frame.detectedPlanes) return;

    frame.detectedPlanes.forEach(plane => {
      if (!this.detectedPlanes.has(plane.id)) {
        this.handlePlaneDetected({ plane });
      } else {
        this.handlePlaneUpdated({ plane });
      }
    });
  }

  /**
   * Place lesson on detected surface
   * @param {string} planeId - ID of surface plane
   * @param {Object} lesson - Lesson object with geometry/model
   * @param {Object} options - Placement options { anchor, offset, scale, interactive }
   */
  placeLessonOnSurface(planeId, lesson, options = {}) {
    const plane = this.detectedPlanes.get(planeId);
    if (!plane) {
      console.error('Plane not found:', planeId);
      return null;
    }

    const {
      anchor = 'center',
      offset = { x: 0, y: 0, z: 0 },
      scale = 1,
      interactive = true
    } = options;

    // Calculate placement position
    const position = this.calculatePlacementPosition(plane, anchor, offset);

    // Create lesson visual
    const lessonGroup = new THREE.Group();
    lessonGroup.position.copy(position);
    lessonGroup.scale.setScalar(scale);
    lessonGroup.add(lesson.mesh);

    // Add interactive handlers if enabled
    if (interactive) {
      this.addInteractivityToLesson(lessonGroup, lesson);
    }

    this.scene.add(lessonGroup);

    const placement = {
      id: `lesson-${Date.now()}`,
      planeId,
      lessonGroup,
      lesson,
      position,
      placedAt: Date.now(),
      interactions: 0
    };

    this.placedLessons.push(placement);
    this.analytics.lessonsPlaced++;

    console.log(`🎓 Lesson placed on ${plane.surfaceType}: ${placement.id}`);
    return placement;
  }

  /**
   * Calculate placement position on surface
   */
  calculatePlacementPosition(plane, anchor, offset) {
    const polygon = plane.polygon;
    let position = new THREE.Vector3(0, 0, 0);

    if (anchor === 'center' && polygon.length > 0) {
      // Calculate centroid
      let cx = 0, cz = 0;
      polygon.forEach(p => {
        cx += p.x;
        cz += p.z;
      });
      cx /= polygon.length;
      cz /= polygon.length;
      position = new THREE.Vector3(cx, 0, cz);
    } else if (anchor === 'corner' && polygon.length > 0) {
      position = new THREE.Vector3(polygon[0].x, 0, polygon[0].z);
    }

    // Apply offset
    position.x += offset.x;
    position.y += offset.y;
    position.z += offset.z;

    return position;
  }

  /**
   * Add interactivity to placed lesson
   */
  addInteractivityToLesson(group, lesson) {
    // Enable manipulation (rotate, scale, translate)
    group.userData.isInteractive = true;
    group.userData.isDragging = false;
    group.userData.dragPlane = new THREE.Plane(
      new THREE.Vector3(0, 0, 1),
      0
    );

    // Track interactions for analytics
    group.addEventListener('click', () => {
      const placement = this.placedLessons.find(p => p.lessonGroup === group);
      if (placement) placement.interactions++;
    });
  }

  /**
   * Create context-aware lesson for detected object
   * Students point at real object → lesson auto-generates
   */
  generateContextualLesson(realWorldObject, objectType = 'generic') {
    const lesson = {
      title: `Learning: ${objectType}`,
      objectType,
      mesh: null, // Will be populated based on object type
      concepts: [],
      interactiveElements: []
    };

    // Generate lesson based on object type
    if (objectType === 'bottle') {
      lesson.concepts = ['geometry', 'physics', 'volume', 'surface area'];
      lesson.mesh = this.createBottleLesson();
    } else if (objectType === 'book') {
      lesson.concepts = ['geometry', 'stacking', 'balance'];
      lesson.mesh = this.createBookLesson();
    } else if (objectType === 'pen') {
      lesson.concepts = ['rolling', 'friction', 'dynamics'];
      lesson.mesh = this.createPenLesson();
    } else {
      lesson.concepts = ['basic shapes', 'geometry'];
      lesson.mesh = this.createGenericLesson();
    }

    return lesson;
  }

  /**
   * Create visualizations for lessons
   */
  createBottleLesson() {
    const group = new THREE.Group();
    
    // Bottle body
    const bodyGeo = new THREE.CylinderGeometry(0.5, 0.4, 2, 32);
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: 0x06B6D4,
      transmission: 0.5,
      thickness: 0.1
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Show volume calculation
    const volumeLabel = document.createElement('div');
    volumeLabel.innerHTML = 'V = πr²h';
    
    return group;
  }

  createBookLesson() {
    const group = new THREE.Group();
    
    const bookGeo = new THREE.BoxGeometry(2, 3, 0.1);
    const bookMat = new THREE.MeshStandardMaterial({ color: 0x7C3AED });
    const book = new THREE.Mesh(bookGeo, bookMat);
    group.add(book);
    
    return group;
  }

  createPenLesson() {
    const group = new THREE.Group();
    
    const penGeo = new THREE.CylinderGeometry(0.05, 0.05, 2, 16);
    const penMat = new THREE.MeshStandardMaterial({ color: 0xEF4444 });
    const pen = new THREE.Mesh(penGeo, penMat);
    group.add(pen);
    
    return group;
  }

  createGenericLesson() {
    const group = new THREE.Group();
    
    const geoGeo = new THREE.IcosahedronGeometry(1, 4);
    const geoMat = new THREE.MeshPhysicalMaterial({ color: 0x10B981 });
    const geo = new THREE.Mesh(geoGeo, geoMat);
    group.add(geo);
    
    return group;
  }

  /**
   * Get analytics about surface-aware learning
   */
  getAnalytics() {
    return {
      ...this.analytics,
      averageLessonsPerPlane: this.analytics.planesDetected > 0 ?
        this.analytics.lessonsPlaced / this.analytics.planesDetected : 0,
      activePlacements: this.placedLessons.length,
      totalInteractions: this.placedLessons.reduce((sum, p) => sum + p.interactions, 0),
      surfaceTypes: this.getSurfaceTypeDistribution()
    };
  }

  /**
   * Get distribution of surface types
   */
  getSurfaceTypeDistribution() {
    const distribution = { floor: 0, ceiling: 0, wall: 0, tilted: 0 };
    this.detectedPlanes.forEach(plane => {
      distribution[plane.surfaceType]++;
    });
    return distribution;
  }

  /**
   * Exit AR mode
   */
  exitXR() {
    if (this.xrSession) {
      this.xrSession.end();
      this.isXREnabled = false;
    }
  }
}

export default SADEEnvironment;
