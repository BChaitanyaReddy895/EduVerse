// ============================================
// Performance Optimizer v1.0
// Lazy loading, caching, geometry pooling
// ============================================

import * as THREE from 'three';

export class PerformanceOptimizer {
  constructor() {
    this.geometryPool = new Map();
    this.materialCache = new Map();
    this.textureCache = new Map();
    this.conceptCache = new Map();
    this.geometryPool = new Map();
    
    console.log('⚡ Performance Optimizer initialized');
  }

  // Lazy load concepts on demand
  async lazyLoadConcept(concept, index, totalConcepts) {
    console.log(`📦 Lazy loading concept ${index + 1}/${totalConcepts}`);
    
    return {
      id: concept.id,
      title: concept.title,
      description: concept.description,
      keywords: concept.keywords,
      visualType: concept.visualType,
      index,
      priority: this.calculatePriority(index, totalConcepts),
      loaded: Date.now()
    };
  }

  calculatePriority(index, total) {
    // First concept: high priority
    // Adjacent concepts: medium
    // Others: low
    if (index === 0) return 'high';
    if (index === 1) return 'medium';
    return 'low';
  }

  // Geometry pooling to reduce memory allocation
  getOrCreateGeometry(type, config = {}) {
    const key = `${type}_${JSON.stringify(config)}`;
    
    if (this.geometryPool.has(key)) {
      return this.geometryPool.get(key);
    }
    
    let geometry;
    
    switch (type) {
      case 'sphere':
        geometry = new THREE.SphereGeometry(
          config.radius || 1,
          config.widthSegments || 16,
          config.heightSegments || 16
        );
        break;
      
      case 'box':
        geometry = new THREE.BoxGeometry(
          config.width || 1,
          config.height || 1,
          config.depth || 1
        );
        break;
      
      case 'icosahedron':
        geometry = new THREE.IcosahedronGeometry(config.radius || 1, config.detail || 4);
        break;
      
      default:
        geometry = new THREE.IcosahedronGeometry(1, 3);
    }
    
    // Cache geometry
    this.geometryPool.set(key, geometry);
    console.log(`💾 Cached geometry: ${type}`);
    
    return geometry;
  }

  // Material pooling
  getOrCreateMaterial(type, config = {}) {
    const key = `${type}_${JSON.stringify(config)}`;
    
    if (this.materialCache.has(key)) {
      return this.materialCache.get(key).clone();
    }
    
    let material;
    
    if (type === 'phong') {
      material = new THREE.MeshPhongMaterial({
        color: config.color || 0x3B82F6,
        emissive: config.emissive || 0x1e40af,
        shininess: config.shininess || 100
      });
    } else if (type === 'lambert') {
      material = new THREE.MeshLambertMaterial({
        color: config.color || 0x3B82F6
      });
    } else {
      material = new THREE.MeshBasicMaterial({
        color: config.color || 0x3B82F6
      });
    }
    
    this.materialCache.set(key, material);
    return material;
  }

  // LOD (Level of Detail) system
  createLODMesh(type, config = {}) {
    const lod = new THREE.LOD();
    
    // High detail (close)
    const highDetail = new THREE.Mesh(
      this.getOrCreateGeometry(type, { ...config, detail: 4 }),
      this.getOrCreateMaterial('phong', config)
    );
    lod.addLevel(highDetail, 0);
    
    // Medium detail (medium distance)
    const mediumDetail = new THREE.Mesh(
      this.getOrCreateGeometry(type, { ...config, detail: 2 }),
      this.getOrCreateMaterial('lambert', config)
    );
    lod.addLevel(mediumDetail, 10);
    
    // Low detail (far away)
    const lowDetail = new THREE.Mesh(
      this.getOrCreateGeometry(type, { ...config, detail: 1 }),
      this.getOrCreateMaterial('basic', config)
    );
    lod.addLevel(lowDetail, 20);
    
    return lod;
  }

  // Concept prefetching
  prefetchAdjacentConcepts(concepts, currentIndex) {
    const next = currentIndex + 1;
    const prev = currentIndex - 1;
    const toFetch = [];
    
    if (next < concepts.length) toFetch.push(next);
    if (prev >= 0) toFetch.push(prev);
    
    toFetch.forEach(idx => {
      if (!this.conceptCache.has(idx)) {
        this.conceptCache.set(idx, {
          concept: concepts[idx],
          prefetched: Date.now(),
          ready: false
        });
      }
    });
    
    return toFetch;
  }

  // Viewport culling - only render visible objects
  cullOutOfViewport(scene, camera) {
    const frustum = new THREE.Frustum();
    const cameraViewProjectionMatrix = new THREE.Matrix4();
    camera.updateMatrixWorld();
    cameraViewProjectionMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(cameraViewProjectionMatrix);
    
    let visibleCount = 0;
    scene.traverse(child => {
      if (child.geometry) {
        const visible = frustum.intersectsObject(child);
        child.visible = visible;
        if (visible) visibleCount++;
      }
    });
    
    return visibleCount;
  }

  // Smart caching strategy
  shouldCacheConcept(index, totalConcepts) {
    // Cache first 3 concepts always
    if (index < 3) return true;
    
    // Cache adjacent concepts
    if (index % 2 === 0) return true;
    
    // Cache last concept
    if (index === totalConcepts - 1) return true;
    
    return false;
  }

  // Memory profiling
  getMemoryUsage() {
    return {
      geometries: this.geometryPool.size,
      materials: this.materialCache.size,
      textures: this.textureCache.size,
      cachedConcepts: this.conceptCache.size,
      timestamp: Date.now()
    };
  }

  // Cleanup
  dispose() {
    this.geometryPool.forEach(geo => geo.dispose());
    this.materialCache.forEach(mat => mat.dispose());
    this.geometryPool.clear();
    this.materialCache.clear();
    this.textureCache.clear();
    this.conceptCache.clear();
  }
}
