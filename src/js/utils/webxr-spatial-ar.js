// ============================================
// WebXR Spatial AR Engine v1.0
// Real-world augmented reality learning
// ============================================

import * as THREE from 'three';

export class WebXRSpatialAREngine {
  constructor(containerElement) {
    this.container = containerElement;
    this.xrSession = null;
    this.isARSupported = false;
    this.visualizations = [];
    this.spatialAnchors = new Map();
    
    this.initializeXR();
  }

  async initializeXR() {
    console.log('🎯 Initializing WebXR Spatial AR Engine');
    
    try {
      // Check WebXR support
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test', 'dom-overlay'],
        domOverlay: { root: document.body }
      });
      
      this.xrSession = session;
      this.isARSupported = true;
      console.log('✅ WebXR AR Session created');
      
      this.setupARScene();
      
    } catch (err) {
      console.log('⚠️ WebXR not available, using fallback canvas mode');
      console.log('Error:', err.message);
      // Fallback to canvas mode handled by caller
    }
  }

  setupARScene() {
    const scene = new THREE.Scene();
    scene.background = null;
    
    const camera = new THREE.PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      xrCompatible: true 
    });
    
    renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    renderer.xr.enabled = true;
    renderer.xr.setSession(this.xrSession);
    
    this.container.appendChild(renderer.domElement);
    
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);
    
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    
    this.startARLoop();
  }

  async placeVisualizationOnSurface(concept, position, rotation = 0) {
    console.log(`🎯 Placing visualization for: ${concept.title}`);
    
    const mesh = await this.createConceptMesh(concept);
    
    if (position) {
      mesh.position.copy(position);
    }
    mesh.rotation.y = rotation;
    
    this.scene.add(mesh);
    this.visualizations.push({
      concept,
      mesh,
      created: Date.now()
    });
    
    return mesh;
  }

  async createConceptMesh(concept) {
    // Will be implemented in next file
    const geometry = new THREE.IcosahedronGeometry(0.5, 4);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0x3B82F6,
      emissive: 0x1e40af 
    });
    return new THREE.Mesh(geometry, material);
  }

  startARLoop() {
    const render = () => {
      this.xrSession.requestAnimationFrame((time, frame) => {
        this.updateVisualizations(time);
        this.renderer.render(this.scene, this.camera);
        render();
      });
    };
    render();
  }

  updateVisualizations(time) {
    this.visualizations.forEach(viz => {
      viz.mesh.rotation.x += 0.005;
      viz.mesh.rotation.y += 0.008;
      viz.mesh.scale.y = 0.8 + Math.sin(time * 0.001) * 0.2;
    });
  }

  getARMode() {
    return this.isARSupported ? 'ar' : 'canvas';
  }

  dispose() {
    if (this.xrSession) {
      this.xrSession.end();
    }
  }
}

export async function initWebXRAR(container) {
  const engine = new WebXRSpatialAREngine(container);
  return engine;
}
