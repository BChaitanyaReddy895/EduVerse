// ============================================
// TIER 1: Stress Field Mastery Visualization (SFVM)
// Render mastery data as 3D navigable terrain
// ============================================

import * as THREE from 'three';

export class SFVMMasteryLandscape {
  constructor(scene, camera, masterData = {}) {
    this.scene = scene;
    this.camera = camera;
    this.masterData = masterData; // { skillName: masteryLevel }
    this.terrain = null;
    this.student = null;
    this.particleSystem = null;
    this.stressFieldMesh = null;
    
    this.config = {
      gridSize: 64,
      scale: 50,
      heightMultiplier: 10,
      smoothingIterations: 3,
      updateFrequency: 100 // ms
    };

    this.analytics = {
      studentPosition: { x: 0, y: 0, z: 0 },
      pathTraversed: [],
      timeOnWeakAreas: 0,
      timeOnStrongAreas: 0,
      gravitationEvents: []
    };
  }

  /**
   * Generate stress field from mastery data
   */
  generateStressField(masteryDict) {
    // Convert discrete mastery values to continuous height field
    const heightMap = this.createHeightMap(masteryDict);
    
    // Smooth the height map for natural terrain
    for (let i = 0; i < this.config.smoothingIterations; i++) {
      this.smoothHeightMap(heightMap);
    }

    // Create terrain mesh from height map
    this.createTerrainMesh(heightMap);
    
    // Visualize stress field (gradient)
    this.visualizeStressGradient(heightMap);
    
    // Place student avatar
    this.placeStudentAvatar();
  }

  /**
   * Create height map from mastery values
   * Height = mastery level, Gradient = learning difficulty
   */
  createHeightMap(masteryDict) {
    const gridSize = this.config.gridSize;
    const heightMap = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));
    
    const skills = Object.entries(masteryDict);
    const skillsPerCell = Math.ceil(skills.length / (gridSize * gridSize));

    for (let i = 0; i < skills.length; i++) {
      const [skillName, mastery] = skills[i];
      
      // Distribute skills across grid
      const cellIndex = i;
      const x = (cellIndex % gridSize);
      const z = Math.floor(cellIndex / gridSize);

      if (x < gridSize && z < gridSize) {
        // Height = mastery * heightMultiplier
        const height = mastery * this.config.heightMultiplier;
        
        // Spread height to nearby cells (smooth transition)
        for (let dx = -1; dx <= 1; dx++) {
          for (let dz = -1; dz <= 1; dz++) {
            const nx = x + dx;
            const nz = z + dz;
            if (nx >= 0 && nx < gridSize && nz >= 0 && nz < gridSize) {
              const distance = Math.sqrt(dx * dx + dz * dz);
              const influence = Math.exp(-distance * distance / 2);
              heightMap[nz][nx] += height * influence;
            }
          }
        }
      }
    }

    return heightMap;
  }

  /**
   * Smooth height map using Laplacian filter
   */
  smoothHeightMap(heightMap) {
    const gridSize = this.config.gridSize;
    const smoothed = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));

    for (let i = 1; i < gridSize - 1; i++) {
      for (let j = 1; j < gridSize - 1; j++) {
        // Laplacian smoothing
        smoothed[i][j] = (
          heightMap[i][j] * 4 +
          heightMap[i-1][j] +
          heightMap[i+1][j] +
          heightMap[i][j-1] +
          heightMap[i][j+1]
        ) / 8;
      }
    }

    // Copy smoothed values back
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        heightMap[i][j] = smoothed[i][j];
      }
    }
  }

  /**
   * Create terrain mesh from height map
   */
  createTerrainMesh(heightMap) {
    const gridSize = this.config.gridSize;
    const scale = this.config.scale;
    
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const colors = [];
    const indices = [];

    // Create vertices
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = (i - gridSize / 2) * scale / gridSize;
        const z = (j - gridSize / 2) * scale / gridSize;
        const y = heightMap[i][j];
        
        vertices.push(x, y, z);

        // Color based on height (mastery level)
        const hue = y / (this.config.heightMultiplier * 10); // Normalize to 0-1
        const color = new THREE.Color().setHSL(hue * 0.3, 1, 0.5); // Green to Red
        colors.push(color.r, color.g, color.b);
      }
    }

    // Create indices (triangles)
    for (let i = 0; i < gridSize - 1; i++) {
      for (let j = 0; j < gridSize - 1; j++) {
        const a = i * gridSize + j;
        const b = a + 1;
        const c = a + gridSize;
        const d = c + 1;

        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
    geometry.computeVertexNormals();

    const material = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      metalness: 0.3,
      roughness: 0.6,
      emissiveIntensity: 0.2
    });

    this.stressFieldMesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.stressFieldMesh);
  }

  /**
   * Visualize stress field gradients (areas needing practice)
   */
  visualizeStressGradient(heightMap) {
    const gridSize = this.config.gridSize;
    const scale = this.config.scale;

    // Create gradient arrows showing direction of steepest descent
    for (let i = 1; i < gridSize - 1; i += 4) {
      for (let j = 1; j < gridSize - 1; j += 4) {
        const x = (i - gridSize / 2) * scale / gridSize;
        const z = (j - gridSize / 2) * scale / gridSize;
        const y = heightMap[i][j];

        // Calculate gradient
        const gx = (heightMap[i+1][j] - heightMap[i-1][j]) / 2;
        const gz = (heightMap[i][j+1] - heightMap[i][j-1]) / 2;
        const magnitude = Math.sqrt(gx * gx + gz * gz);

        if (magnitude > 0.1) {
          const direction = new THREE.Vector3(-gx, 0, -gz).normalize();
          const arrowColor = magnitude > 1 ? 0xFF6B6B : 0xFFA94D; // Red = steep, Orange = gradual
          
          const arrow = new THREE.ArrowHelper(
            direction,
            new THREE.Vector3(x, y + 0.5, z),
            magnitude * 2,
            arrowColor,
            0.3,
            0.2
          );

          this.scene.add(arrow);
        }
      }
    }
  }

  /**
   * Place student avatar on terrain
   */
  placeStudentAvatar() {
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x7C3AED,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x7C3AED,
      emissiveIntensity: 0.5
    });

    this.student = new THREE.Mesh(geometry, material);
    
    // Position at center (average mastery)
    const avgMastery = Object.values(this.masterData).length > 0 ?
      Object.values(this.masterData).reduce((a, b) => a + b, 0) / Object.values(this.masterData).length :
      0.5;
    
    this.student.position.set(0, avgMastery * this.config.heightMultiplier + 1, 0);
    this.analytics.studentPosition = {
      x: this.student.position.x,
      y: this.student.position.y,
      z: this.student.position.z
    };

    // Add name/label above student
    const label = this.createLabel('YOU', 0xFFFFFF);
    label.position.set(0, 1.5, 0);
    this.student.add(label);

    this.scene.add(this.student);
  }

  /**
   * Create text label for visualization
   */
  createLabel(text, color = 0xFFFFFF) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    ctx.font = 'Bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    return new THREE.Sprite(material);
  }

  /**
   * Physics simulation: Student avatar "rolls" down valleys
   * Low mastery areas attract the student (gravity effect)
   */
  applyMasteryGravity(deltaTime = 0.016) {
    if (!this.student || !this.stressFieldMesh) return;

    const studentPos = this.student.position;
    const weakAreasRadius = 15;

    // Find nearby weak areas (low height points on terrain)
    const weakAreas = this.findWeakAreasNear(studentPos, weakAreasRadius);

    if (weakAreas.length > 0) {
      // Calculate gravitational pull from weak areas
      let gravityForce = new THREE.Vector3(0, 0, 0);

      weakAreas.forEach(area => {
        const direction = new THREE.Vector3().subVectors(area.position, studentPos).normalize();
        const distance = studentPos.distanceTo(area.position);
        const strength = (1 - distance / weakAreasRadius) * 0.5; // Inverse distance falloff
        
        gravityForce.addScaledVector(direction, strength);

        // Track time on weak areas
        this.analytics.timeOnWeakAreas += deltaTime;
      });

      // Apply gravity force
      const velocity = new THREE.Vector3();
      velocity.addScaledVector(gravityForce, deltaTime);
      studentPos.addScaledVector(velocity, deltaTime);

      this.analytics.gravitationEvents.push({
        timestamp: Date.now(),
        position: studentPos.clone(),
        force: gravityForce.length()
      });
    }

    // Track strong areas (high mastery)
    const strongAreas = this.findStrongAreasNear(studentPos, weakAreasRadius);
    if (strongAreas.length > 0) {
      this.analytics.timeOnStrongAreas += deltaTime;
    }

    // Record path
    this.analytics.pathTraversed.push(studentPos.clone());
  }

  /**
   * Find weak areas (valleys) near student
   */
  findWeakAreasNear(position, radius) {
    const weakAreas = [];
    
    if (!this.stressFieldMesh) return weakAreas;

    // Sample terrain around student
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
      for (let dist = 2; dist < radius; dist += 2) {
        const x = position.x + Math.cos(angle) * dist;
        const z = position.z + Math.sin(angle) * dist;
        const terrainPoint = this.getTerrainHeightAt(x, z);

        if (terrainPoint < position.y - 2) { // Below student = weak area
          weakAreas.push({
            position: new THREE.Vector3(x, terrainPoint, z),
            height: terrainPoint,
            weakness: (position.y - terrainPoint) / this.config.heightMultiplier
          });
        }
      }
    }

    return weakAreas;
  }

  /**
   * Find strong areas (peaks) near student
   */
  findStrongAreasNear(position, radius) {
    const strongAreas = [];
    
    if (!this.stressFieldMesh) return strongAreas;

    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
      for (let dist = 2; dist < radius; dist += 2) {
        const x = position.x + Math.cos(angle) * dist;
        const z = position.z + Math.sin(angle) * dist;
        const terrainPoint = this.getTerrainHeightAt(x, z);

        if (terrainPoint > position.y + 1) { // Above student = strong area
          strongAreas.push({
            position: new THREE.Vector3(x, terrainPoint, z),
            height: terrainPoint,
            strength: (terrainPoint - position.y) / this.config.heightMultiplier
          });
        }
      }
    }

    return strongAreas;
  }

  /**
   * Get terrain height at specific X,Z coordinates
   */
  getTerrainHeightAt(x, z) {
    if (!this.stressFieldMesh) return 0;

    // Use raycasting to find terrain height
    const raycaster = new THREE.Raycaster();
    const direction = new THREE.Vector3(0, -1, 0);
    raycaster.set(new THREE.Vector3(x, 100, z), direction);

    const intersects = raycaster.intersectObject(this.stressFieldMesh);
    if (intersects.length > 0) {
      return intersects[0].point.y;
    }

    return 0;
  }

  /**
   * Animate student movement toward weak areas
   */
  moveStudentToward(targetSkill) {
    if (!this.student) return;

    // Find position of target skill on terrain
    const skillIndex = Object.keys(this.masterData).indexOf(targetSkill);
    const gridSize = this.config.gridSize;
    const scale = this.config.scale;

    const x = ((skillIndex % gridSize) - gridSize / 2) * scale / gridSize;
    const z = (Math.floor(skillIndex / gridSize) - gridSize / 2) * scale / gridSize;

    // Animate movement
    const startPos = this.student.position.clone();
    const endPos = new THREE.Vector3(x, this.getTerrainHeightAt(x, z) + 1, z);
    const duration = 2000; // 2 seconds
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (easeInOutCubic)
      const t = progress < 0.5 ?
        4 * progress * progress * progress :
        1 - Math.pow(-2 * progress + 2, 3) / 2;

      this.student.position.lerpVectors(startPos, endPos, t);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  /**
   * Get learning insights from landscape
   */
  getLandscapeInsights() {
    const insights = [];
    const masteryEntries = Object.entries(this.masterData);
    
    // Find weakest skills (valleys)
    const weakest = masteryEntries.sort((a, b) => a[1] - b[1]).slice(0, 3);
    insights.push({
      type: 'weakness',
      skills: weakest.map(e => e[0]),
      recommendation: `Focus on: ${weakest.map(e => e[0]).join(', ')}`
    });

    // Find strongest skills (peaks)
    const strongest = masteryEntries.sort((a, b) => b[1] - a[1]).slice(0, 3);
    insights.push({
      type: 'strength',
      skills: strongest.map(e => e[0]),
      recommendation: `You excel at: ${strongest.map(e => e[0]).join(', ')}`
    });

    // Find steep transitions (rapid change areas)
    const transitions = [];
    for (let i = 0; i < masteryEntries.length - 1; i++) {
      const diff = Math.abs(masteryEntries[i][1] - masteryEntries[i + 1][1]);
      if (diff > 0.3) {
        transitions.push({
          from: masteryEntries[i][0],
          to: masteryEntries[i + 1][0],
          steepness: diff
        });
      }
    }

    if (transitions.length > 0) {
      insights.push({
        type: 'transition',
        data: transitions,
        recommendation: `Build bridges: ${transitions.slice(0, 2).map(t => `${t.from} → ${t.to}`).join(', ')}`
      });
    }

    return insights;
  }

  /**
   * Get analytics
   */
  getAnalytics() {
    return {
      ...this.analytics,
      weakToStrongRatio: this.analytics.timeOnWeakAreas > 0 ?
        this.analytics.timeOnStrongAreas / this.analytics.timeOnWeakAreas : 0,
      pathLength: this.analytics.pathTraversed.length,
      insights: this.getLandscapeInsights()
    };
  }
}

export default SFVMMasteryLandscape;
