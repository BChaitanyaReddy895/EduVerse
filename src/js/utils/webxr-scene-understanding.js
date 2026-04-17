// ============================================
// WebXR Scene Understanding System v1.0
// Professional AR with light estimation, plane detection, object recognition
// ============================================

import * as THREE from 'three';

export class WebXRSceneUnderstanding {
  constructor() {
    this.xrSession = null;
    this.xrReferenceSpace = null;
    this.lightProbe = null;
    this.webglContext = null;
    
    this.detectedPlanes = [];
    this.detectedObjects = [];
    this.estimatedLight = null;
    this.depthMap = null;
    
    this.cocoModel = null;
    this.isInitialized = false;
    
    console.log('WebXR Scene Understanding System initialized');
  }

  // ============================================
  // PHASE 1: WEBXR SESSION INITIALIZATION
  // ============================================

  async initializeWebXR(scene, camera, renderer) {
    console.log('Initializing WebXR session...');
    
    try {
      // Check for XR support
      if (!navigator.xr) {
        console.warn('WebXR not available on this device');
        return this.initializeCanvasAR(scene, camera, renderer);
      }

      // Try with minimal required features first
      let sessionInit = {
        requiredFeatures: [],
        optionalFeatures: ['hit-test', 'light-estimation', 'plane-detection']
      };

      try {
        this.xrSession = await navigator.xr.requestSession('immersive-ar', sessionInit);
        console.log('WebXR session created successfully');
      } catch (xrError) {
        console.warn('WebXR immersive-ar not available, trying viewer mode');
        // Fallback to canvas-based AR
        return this.initializeCanvasAR(scene, camera, renderer);
      }

      // Get XR reference space for tracking
      this.xrReferenceSpace = await this.xrSession.requestReferenceSpace('local');
      console.log('Reference space established');

      // Request animation frame for XR
      this.xrSession.requestAnimationFrame((time, frame) => 
        this.onXRFrame(time, frame, scene, camera, renderer)
      );

      // Initialize light probe for environment lighting (if supported)
      if (this.xrSession.enableLightingEstimation) {
        await this.initializeLightProbe(scene);
      }
      
      // Initialize plane detection (if supported)
      if (this.xrSession.enablePlaneDetection) {
        await this.initializePlaneDetection();
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('WebXR initialization failed:', error.message);
      console.log('Switching to canvas-based AR mode');
      return this.initializeCanvasAR(scene, camera, renderer);
    }
  }

  // ============================================
  // CANVAS-BASED AR FALLBACK
  // ============================================

  initializeCanvasAR(scene, camera, renderer) {
    console.log('Initializing canvas-based AR mode');
    
    try {
      // Set up canvas renderer
      const canvas = renderer.domElement;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Simulate light estimation with default values
      this.estimatedLight = {
        ambientIntensity: 1.0,
        primaryLightDirection: { x: 0.5, y: 1, z: 0.5 },
        colorTemperature: 6500
      };

      // Simulate plane detection
      this.detectedPlanes = [
        {
          id: 'plane-floor',
          type: 'floor',
          position: { x: 0, y: -1, z: 0 },
          normal: { x: 0, y: 1, z: 0 },
          vertices: [
            { x: -5, y: -1, z: -5 },
            { x: 5, y: -1, z: -5 },
            { x: 5, y: -1, z: 5 },
            { x: -5, y: -1, z: 5 }
          ]
        }
      ];

      // Set up interactive camera controls
      let mouseX = 0, mouseY = 0;
      let rotationX = 0, rotationY = 0;

      canvas.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        
        rotationY = mouseX * Math.PI;
        rotationX = mouseY * Math.PI / 2;
      });

      canvas.addEventListener('touchmove', (event) => {
        const touch = event.touches[0];
        mouseX = (touch.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(touch.clientY / window.innerHeight) * 2 + 1;
        
        rotationY = mouseX * Math.PI;
        rotationX = mouseY * Math.PI / 2;
      });

      // Animation loop for canvas AR
      const animateCanvasAR = () => {
        // Apply simulated camera rotation
        camera.rotation.order = 'YXZ';
        camera.rotation.y = rotationY;
        camera.rotation.x = rotationX;

        // Render scene
        renderer.render(scene, camera);
        requestAnimationFrame(animateCanvasAR);
      };

      animateCanvasAR();
      this.isInitialized = true;
      console.log('Canvas-based AR mode initialized successfully');
      return true;
    } catch (error) {
      console.error('Canvas AR initialization failed:', error);
      return false;
    }
  }

  // ============================================
  // LIGHT ESTIMATION (Environment-Aware Rendering)
  // ============================================

  async initializeLightProbe(scene) {
    console.log('Initializing light estimation system...');
    
    try {
      // Create light probe from XR
      this.lightProbe = await this.xrSession.requestLightProbe();
      
      // Setup lighting based on environment
      this.updateEnvironmentLighting(scene);
      
      console.log('Light probe initialized - environment lighting active');
    } catch (error) {
      console.warn('Light probe unavailable, using default lighting:', error);
      this.setupDefaultLighting(scene);
    }
  }

  updateEnvironmentLighting(scene) {
    // Extract lighting from environment
    if (!this.lightProbe) return;

    // Ambient intensity (0.0-1.0)
    const ambientIntensity = this.lightProbe.ambientIntensity ?? 0.8;
    
    // Primary light direction & color
    const primaryLightDirection = this.lightProbe.primaryLightDirection || 
      new THREE.Vector3(1, 1, 1).normalize();
    const primaryLightIntensity = this.lightProbe.primaryLightIntensity ?? 1.0;
    
    // Color temperature (warm/cool)
    const colorTemperature = this.lightProbe.colorTemperature ?? 6500; // Daylight

    // Update scene lighting
    const ambient = new THREE.AmbientLight(0xffffff, ambientIntensity);
    scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, primaryLightIntensity);
    directional.position.copy(primaryLightDirection).normalize().multiplyScalar(10);
    directional.castShadow = true;
    directional.shadow.mapSize.width = 2048;
    directional.shadow.mapSize.height = 2048;
    scene.add(directional);

    console.log(`Environment lighting applied:
      - Ambient: ${(ambientIntensity * 100).toFixed(0)}%
      - Primary Light: ${(primaryLightIntensity * 100).toFixed(0)}%
      - Color Temp: ${colorTemperature}K`);
  }

  setupDefaultLighting(scene) {
    // Fallback lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    const directional = new THREE.DirectionalLight(0xffffff, 1.0);
    directional.position.set(5, 10, 5);
    scene.add(ambient);
    scene.add(directional);
  }

  // ============================================
  // PLANE DETECTION (Surface Anchoring)
  // ============================================

  async initializePlaneDetection() {
    console.log('Initializing plane detection...');
    
    if (!this.xrSession.requestPlaneDetection) {
      console.warn('Plane detection not available on this device');
      return;
    }

    try {
      this.planeDetection = await this.xrSession.requestPlaneDetection();
      console.log('Plane detection enabled');
    } catch (error) {
      console.warn('Plane detection initialization failed:', error);
    }
  }

  updateDetectedPlanes(frame) {
    if (!this.planeDetection) return;

    // Get detected planes from XR frame
    const detectedPlanes = frame.detectedPlanes;
    if (!detectedPlanes) return;

    this.detectedPlanes = Array.from(detectedPlanes).map(plane => ({
      id: plane.id,
      center: new THREE.Vector3().copy(plane.polygon.center),
      normal: new THREE.Vector3().copy(plane.normal),
      vertices: plane.polygon.vertices,
      type: plane.orientedBoundingBox?.xExtent ? 'horizontal' : 'vertical',
      area: this.calculatePolygonArea(plane.polygon.vertices)
    }));

    if (this.detectedPlanes.length > 0) {
      console.log(`Detected ${this.detectedPlanes.length} planes:
        ${this.detectedPlanes.map(p => `${p.type} (${(p.area).toFixed(2)}m²)`).join(', ')}`);
    }

    return this.detectedPlanes;
  }

  calculatePolygonArea(vertices) {
    if (vertices.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < vertices.length; i++) {
      const v1 = vertices[i];
      const v2 = vertices[(i + 1) % vertices.length];
      area += v1.x * v2.z - v2.x * v1.z;
    }
    return Math.abs(area) / 2;
  }

  // ============================================
  // DEPTH SENSING (Surface Occlusion & Physics)
  // ============================================

  async initializeDepthSensing() {
    console.log('Initializing depth sensing...');
    
    if (!this.xrSession.requestDepthSensing) {
      console.warn('Depth sensing not available on this device');
      return;
    }

    try {
      this.depthData = await this.xrSession.requestDepthSensing();
      console.log('Depth sensing enabled');
    } catch (error) {
      console.warn('Depth sensing initialization failed:', error);
    }
  }

  updateDepthMap(frame) {
    if (!frame.depthInformation) return null;

    const depthData = frame.depthInformation;
    this.depthMap = {
      width: depthData.width,
      height: depthData.height,
      data: new Float32Array(depthData.getDepthInMeters()),
      getNearestObject: (x, y) => {
        const index = (Math.floor(y) * depthData.width + Math.floor(x));
        return depthData.getDepthInMeters(x, y);
      }
    };

    return this.depthMap;
  }

  // ============================================
  // OBJECT RECOGNITION (TensorFlow.js COCO-SSD)
  // ============================================

  async initializeObjectDetection() {
    console.log('Loading COCO-SSD object detection model...');
    
    try {
      // Load TensorFlow.js and COCO-SSD from CDN
      if (!window.tf) {
        const tfScript = document.createElement('script');
        tfScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0';
        await new Promise((resolve) => {
          tfScript.onload = resolve;
          document.head.appendChild(tfScript);
        });
      }
      
      if (!window.cocoSsd) {
        const cocoScript = document.createElement('script');
        cocoScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3';
        await new Promise((resolve) => {
          cocoScript.onload = resolve;
          document.head.appendChild(cocoScript);
        });
      }
      
      this.cocoModel = await window.cocoSsd.load();
      console.log('COCO-SSD model loaded successfully');
      return true;
    } catch (error) {
      console.error('Failed to load object detection model:', error);
      return false;
    }
  }

  async detectObjects(canvas) {
    if (!this.cocoModel) {
      console.warn('Object detection model not loaded');
      return [];
    }

    try {
      const predictions = await this.cocoModel.estimateObjects(canvas);
      
      this.detectedObjects = predictions.map(pred => ({
        class: pred.class,
        score: pred.score,
        bbox: {
          x: pred.bbox[0],
          y: pred.bbox[1],
          width: pred.bbox[2],
          height: pred.bbox[3]
        },
        confidence: Math.round(pred.score * 100)
      })).filter(obj => obj.score > 0.5); // Filter by confidence threshold

      if (this.detectedObjects.length > 0) {
        console.log(`👁️ Objects detected: ${this.detectedObjects
          .map(o => `${o.class} (${o.confidence}%)`)
          .join(', ')}`);
      }

      return this.detectedObjects;
    } catch (error) {
      console.error('❌ Object detection failed:', error);
      return [];
    }
  }

  // ============================================
  // HIT TESTING (Object Placement on Real Surfaces)
  // ============================================

  async performHitTest(frame, position) {
    if (!this.xrSession.requestHitTestSource) {
      console.warn('⚠️ Hit testing not available');
      return null;
    }

    try {
      const hitTestSource = await this.xrSession.requestHitTestSource({
        space: this.xrReferenceSpace,
        offsetRay: new XRRay(new DOMPoint(0, 0, 0), new DOMPoint(0, 0, -1))
      });

      const hitResults = frame.getHitTestResults(hitTestSource);

      if (hitResults.length > 0) {
        const hit = hitResults[0];
        const pose = hit.getPose(this.xrReferenceSpace);
        
        return {
          position: new THREE.Vector3().fromArray(pose.transform.position),
          rotation: new THREE.Quaternion().fromArray(pose.transform.orientation),
          plane: hit.inputSource?.handedness || 'none'
        };
      }
    } catch (error) {
      console.error('❌ Hit test failed:', error);
    }

    return null;
  }

  // ============================================
  // MAIN XR FRAME LOOP
  // ============================================

  onXRFrame(time, frame, scene, camera, renderer) {
    if (!this.xrSession) return;

    // Get viewer pose
    const pose = frame.getViewerPose(this.xrReferenceSpace);
    if (!pose) return;

    // Update camera from XR
    camera.matrix.fromArray(pose.transform.matrix);
    camera.matrix.decompose(camera.position, camera.quaternion, camera.scale);

    // Update environmental data
    this.updateDetectedPlanes(frame);
    this.updateDepthMap(frame);

    // Detect objects from camera feed
    if (renderer.domElement) {
      this.detectObjects(renderer.domElement);
    }

    // Render scene
    renderer.render(scene, camera);

    // Continue XR frame loop
    this.xrSession.requestAnimationFrame((t, f) => this.onXRFrame(t, f, scene, camera, renderer));
  }

  // ============================================
  // EXIT XR MODE
  // ============================================

  async exitXRMode() {
    if (this.xrSession) {
      await this.xrSession.end();
      this.xrSession = null;
      console.log('✅ Exited XR mode');
    }
  }

  // ============================================
  // PUBLIC API
  // ============================================

  getEnvironmentData() {
    return {
      planes: this.detectedPlanes,
      objects: this.detectedObjects,
      lighting: this.estimatedLight,
      depth: this.depthMap ? {
        width: this.depthMap.width,
        height: this.depthMap.height
      } : null,
      isActive: this.isInitialized
    };
  }
}
