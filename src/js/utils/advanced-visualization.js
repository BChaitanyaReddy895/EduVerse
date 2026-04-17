// ============================================
// Advanced Procedural 3D Visualization v1.0
// Complex, research-grade 3D generation
// ============================================

import * as THREE from 'three';

export class AdvancedVisualizationGenerator {
  constructor(scene) {
    this.scene = scene;
    this.meshes = [];
    this.animations = [];
    
    console.log('🎨 Advanced Visualization Generator initialized');
  }

  // Molecular structure with electron clouds
  async createMolecularStructure(concept, config = {}) {
    console.log(`⚛️ Creating molecular structure: ${concept.title}`);
    
    const group = new THREE.Group();
    
    // Nucleus (central sphere)
    const nucleusGeo = new THREE.IcosahedronGeometry(0.4, 5);
    const nucleusMat = new THREE.MeshPhongMaterial({
      color: 0xFF6B6B,
      emissive: 0xFF0000,
      shininess: 100
    });
    const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
    group.add(nucleus);
    
    // Electron clouds (torus with particles)
    const numOrbitals = config.numOrbitals || 3;
    const particlesPerOrbital = 100;
    
    for (let orbital = 0; orbital < numOrbitals; orbital++) {
      const radius = 1.5 + orbital * 0.8;
      const angle = (orbital / numOrbitals) * Math.PI * 2;
      
      // Orbital ring
      const torusGeo = new THREE.TorusGeometry(radius, 0.05, 16, 100);
      const torusMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.3 + orbital * 0.2, 0.8, 0.5),
        transparent: true,
        opacity: 0.4
      });
      const torus = new THREE.Mesh(torusGeo, torusMat);
      torus.rotation.x = angle;
      group.add(torus);
      
      // Electron particles
      for (let i = 0; i < particlesPerOrbital; i++) {
        const eAngle = (i / particlesPerOrbital) * Math.PI * 2;
        const ePhi = Math.random() * Math.PI * 0.5;
        
        const ePosGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const ePosMat = new THREE.MeshPhongMaterial({
          color: 0x3B82F6,
          emissive: 0x1e40af
        });
        const electron = new THREE.Mesh(ePosGeo, ePosMat);
        
        electron.position.set(
          Math.cos(eAngle) * radius * Math.cos(ePhi),
          Math.sin(ePhi) * radius,
          Math.sin(eAngle) * radius * Math.cos(ePhi)
        );
        
        this.animations.push({
          mesh: electron,
          type: 'orbital',
          radius,
          angle: eAngle,
          phi: ePhi,
          orbital
        });
        
        group.add(electron);
      }
    }
    
    this.scene.add(group);
    this.meshes.push({ group, concept });
    
    return group;
  }

  // Complex orbital mechanics with N-body simulation
  async createOrbitalSystem(concept, config = {}) {
    console.log(`🌌 Creating orbital system: ${concept.title}`);
    
    const group = new THREE.Group();
    
    // Central star
    const starGeo = new THREE.SphereGeometry(0.5, 32, 32);
    const starMat = new THREE.MeshBasicMaterial({
      color: 0xFDB813,
      emissive: 0xFDB813
    });
    const star = new THREE.Mesh(starGeo, starMat);
    group.add(star);
    
    // Glow effect around star
    const glowGeo = new THREE.SphereGeometry(0.6, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xFFED4E,
      transparent: true,
      opacity: 0.2
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    group.add(glow);
    
    // Planets and moons
    const numPlanets = config.numPlanets || 6;
    const planets = [];
    
    for (let p = 0; p < numPlanets; p++) {
      const orbitRadius = 3 + p * 1.2;
      const speed = Math.sqrt(1 / orbitRadius) * 0.3;
      const size = 0.2 + Math.random() * 0.2;
      const color = new THREE.Color().setHSL(p / numPlanets, 0.8, 0.6);
      
      // Planet
      const pGeo = new THREE.SphereGeometry(size, 16, 16);
      const pMat = new THREE.MeshPhongMaterial({ color, shininess: 50 });
      const planet = new THREE.Mesh(pGeo, pMat);
      
      planets.push({
        mesh: planet,
        orbitRadius,
        speed,
        angle: Math.random() * Math.PI * 2,
        size
      });
      
      group.add(planet);
      
      // Orbital path visualization
      const pathGeo = new THREE.BufferGeometry();
      const pathPoints = [];
      for (let i = 0; i <= 64; i++) {
        const a = (i / 64) * Math.PI * 2;
        pathPoints.push(
          new THREE.Vector3(
            Math.cos(a) * orbitRadius,
            0,
            Math.sin(a) * orbitRadius
          )
        );
      }
      pathGeo.setFromPoints(pathPoints);
      
      const pathMat = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.3
      });
      const path = new THREE.Line(pathGeo, pathMat);
      group.add(path);
    }
    
    this.scene.add(group);
    this.meshes.push({ group, concept });
    
    // Animation function
    this.animations.push({
      type: 'orbitalSystem',
      planets,
      update: (time) => {
        planets.forEach(p => {
          p.angle += p.speed * 0.01;
          p.mesh.position.x = Math.cos(p.angle) * p.orbitRadius;
          p.mesh.position.z = Math.sin(p.angle) * p.orbitRadius;
          p.mesh.rotation.x += 0.01;
          p.mesh.rotation.y += 0.015;
        });
      }
    });
    
    return group;
  }

  // DNA double helix with base pairs
  async createDNAHelix(concept, config = {}) {
    console.log(`🧬 Creating DNA helix: ${concept.title}`);
    
    const group = new THREE.Group();
    const numTurns = config.numTurns || 5;
    const basePairsPerTurn = 10;
    const radius = 1.5;
    const height = numTurns * 2;
    
    // Two sugar-phosphate backbones
    for (let strand = 0; strand < 2; strand++) {
      const positions = [];
      
      for (let i = 0; i < numTurns * basePairsPerTurn; i++) {
        const t = i / (numTurns * basePairsPerTurn);
        const z = -height / 2 + t * height;
        const angle = t * Math.PI * 2 * numTurns + (strand * Math.PI);
        
        positions.push(new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          z
        ));
      }
      
      const geo = new THREE.BufferGeometry();
      geo.setFromPoints(positions);
      
      const mat = new THREE.LineBasicMaterial({
        color: strand === 0 ? 0x3B82F6 : 0xFF6B6B,
        linewidth: 3
      });
      
      const line = new THREE.Line(geo, mat);
      group.add(line);
    }
    
    // Base pairs connecting strands
    for (let i = 0; i < numTurns * basePairsPerTurn; i++) {
      const t = i / (numTurns * basePairsPerTurn);
      const z = -height / 2 + t * height;
      const angle = t * Math.PI * 2 * numTurns;
      
      // Base pair geometry (cylinder)
      const geo = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
      const mat = new THREE.MeshPhongMaterial({
        color: new THREE.Color().setHSL(0.15 + Math.random() * 0.1, 0.8, 0.5),
        emissive: 0x1a1a2e
      });
      const basePair = new THREE.Mesh(geo, mat);
      
      basePair.position.z = z;
      basePair.position.x = Math.cos(angle) * radius;
      basePair.position.y = Math.sin(angle) * radius;
      basePair.rotation.z = angle;
      
      group.add(basePair);
    }
    
    this.scene.add(group);
    this.meshes.push({ group, concept });
    
    // Rotation animation
    this.animations.push({
      type: 'dna',
      mesh: group,
      speed: 0.01
    });
    
    return group;
  }

  // Cellular structure with organelles
  async createCellStructure(concept, config = {}) {
    console.log(`🧬 Creating cell structure: ${concept.title}`);
    
    const group = new THREE.Group();
    
    // Cell membrane (translucent outer sphere)
    const memGeo = new THREE.IcosahedronGeometry(2.5, 4);
    const memMat = new THREE.MeshPhongMaterial({
      color: 0x10B981,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide
    });
    const membrane = new THREE.Mesh(memGeo, memMat);
    group.add(membrane);
    
    // Nucleus (central large sphere)
    const nucGeo = new THREE.IcosahedronGeometry(0.8, 4);
    const nucMat = new THREE.MeshPhongMaterial({
      color: 0x8B5CF6,
      emissive: 0x6d28d9
    });
    const nucleus = new THREE.Mesh(nucGeo, nucMat);
    group.add(nucleus);
    
    // Mitochondria (3 rod-shaped organelles)
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const distance = 1.2;
      
      const mGeo = new THREE.CapsuleGeometry(0.15, 0.8, 4, 8);
      const mMat = new THREE.MeshPhongMaterial({
        color: 0xF59E0B,
        emissive: 0xd97706
      });
      const mitochondria = new THREE.Mesh(mGeo, mMat);
      
      mitochondria.position.x = Math.cos(angle) * distance;
      mitochondria.position.y = Math.sin(angle) * distance * 0.5;
      mitochondria.rotation.z = angle;
      
      this.animations.push({
        mesh: mitochondria,
        type: 'orbit',
        center: new THREE.Vector3(0, 0, 0),
        angle,
        radius: distance,
        speed: 0.02 + i * 0.01
      });
      
      group.add(mitochondria);
    }
    
    // Ribosomes (small spheres moving on paths)
    for (let i = 0; i < 6; i++) {
      const rGeo = new THREE.SphereGeometry(0.2, 8, 8);
      const rMat = new THREE.MeshPhongMaterial({
        color: 0xEF4444,
        emissive: 0x991b1b
      });
      const ribosome = new THREE.Mesh(rGeo, rMat);
      
      this.animations.push({
        mesh: ribosome,
        type: 'ribosome',
        baseAngle: (i / 6) * Math.PI * 2,
        height: -0.5 + (i % 2) * 1
      });
      
      group.add(ribosome);
    }
    
    // Endoplasmic reticulum (network of tubes)
    const tubeMat = new THREE.LineBasicMaterial({
      color: 0x06D6A0,
      transparent: true,
      opacity: 0.5
    });
    
    for (let i = 0; i < 4; i++) {
      const tubePoints = [];
      for (let j = 0; j < 20; j++) {
        const angle = (j / 20) * Math.PI * 2;
        const wobble = Math.sin(j) * 0.2;
        tubePoints.push(new THREE.Vector3(
          (Math.cos(angle) * 1.5 + wobble) * (0.8 + Math.sin(i) * 0.3),
          Math.sin(i) * 0.8,
          Math.sin(angle) * 1.5 * (0.8 + Math.cos(i) * 0.3)
        ));
      }
      
      const tubeGeo = new THREE.BufferGeometry();
      tubeGeo.setFromPoints(tubePoints);
      const tube = new THREE.Line(tubeGeo, tubeMat);
      group.add(tube);
    }
    
    this.scene.add(group);
    this.meshes.push({ group, concept });
    
    return group;
  }

  // Particle flow (processes, reactions, energy transfer)
  async createParticleFlow(concept, config = {}) {
    console.log(`💫 Creating particle flow: ${concept.title}`);
    
    const group = new THREE.Group();
    const particles = [];
    const emissionRate = config.emissionRate || 50;
    
    const emit = () => {
      for (let i = 0; i < emissionRate; i++) {
        const angle = Math.random() * Math.PI * 2;
        const elevation = Math.random() * Math.PI * 0.5;
        
        const pGeo = new THREE.SphereGeometry(0.05, 8, 8);
        const pMat = new THREE.MeshPhongMaterial({
          color: new THREE.Color().setHSL(Math.random(), 0.9, 0.6),
          emissive: 0x1a1a2e
        });
        const particle = new THREE.Mesh(pGeo, pMat);
        
        particle.userData = {
          velocity: new THREE.Vector3(
            Math.sin(elevation) * Math.cos(angle) * 5,
            Math.sin(elevation) * Math.sin(angle) * 5,
            Math.cos(elevation) * 5
          ),
          age: 0,
          lifetime: config.lifetime || 3
        };
        
        group.add(particle);
        particles.push(particle);
      }
    };
    
    // Initial emission
    for (let i = 0; i < 3; i++) emit();
    
    this.scene.add(group);
    this.meshes.push({ group, concept });
    
    // Update animation
    this.animations.push({
      type: 'particleFlow',
      emit,
      particles,
      group,
      emissionRate,
      update: () => {
        if (Math.random() > 0.7) emit();
        
        particles.forEach((p, idx) => {
          if (!p.userData) return;
          
          p.userData.age += 0.016;
          p.userData.velocity.multiplyScalar(0.98);
          p.position.add(p.userData.velocity.clone().multiplyScalar(0.016));
          
          if (p.userData.age > p.userData.lifetime) {
            group.remove(p);
            particles.splice(idx, 1);
          }
        });
      }
    });
    
    return group;
  }

  // Wave interference patterns
  async createWavePatterns(concept, config = {}) {
    console.log(`🌊 Creating wave patterns: ${concept.title}`);
    
    const group = new THREE.Group();
    const resolution = 64;
    
    // Create wave surface
    const geo = new THREE.BufferGeometry();
    const positions = [];
    const indices = [];
    
    for (let i = 0; i <= resolution; i++) {
      for (let j = 0; j <= resolution; j++) {
        const x = (i / resolution) * 4 - 2;
        const z = (j / resolution) * 4 - 2;
        positions.push(x, 0, z);
      }
    }
    
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const a = i * (resolution + 1) + j;
        const b = a + resolution + 1;
        
        indices.push(a, b, a + 1);
        indices.push(a + 1, b, b + 1);
      }
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    geo.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
    
    const mat = new THREE.MeshPhongMaterial({
      color: 0x3B82F6,
      emissive: 0x1e40af,
      wireframe: false,
      side: THREE.DoubleSide
    });
    
    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);
    
    this.scene.add(group);
    this.meshes.push({ group, concept });
    
    // Wave animation
    this.animations.push({
      type: 'wave',
      mesh,
      geo,
      time: 0,
      update: (time) => {
        const posAttr = geo.getAttribute('position');
        const posArray = posAttr.array;
        
        for (let i = 0; i <= resolution; i++) {
          for (let j = 0; j <= resolution; j++) {
            const idx = (i * (resolution + 1) + j) * 3;
            const x = posArray[idx];
            const z = posArray[idx + 2];
            
            const wave1 = Math.sin(x * 2 - time * 2) * 0.3;
            const wave2 = Math.sin(z * 2 - time * 3) * 0.3;
            const wave3 = Math.sin((x + z) - time * 4) * 0.2;
            
            posArray[idx + 1] = wave1 + wave2 + wave3;
          }
        }
        
        posAttr.needsUpdate = true;
      }
    });
    
    return group;
  }

  updateAnimations(time) {
    this.animations.forEach(anim => {
      if (anim.type === 'orbital') {
        const progress = (time * 0.5) % (Math.PI * 2);
        const newAngle = anim.angle + progress;
        
        anim.mesh.position.x = Math.cos(newAngle) * anim.radius * Math.cos(anim.phi);
        anim.mesh.position.y = Math.sin(anim.phi) * anim.radius;
        anim.mesh.position.z = Math.sin(newAngle) * anim.radius * Math.cos(anim.phi);
      } else if (anim.update) {
        anim.update(time);
      } else if (anim.mesh && anim.speed) {
        anim.mesh.rotation.x += anim.speed;
        anim.mesh.rotation.y += anim.speed * 1.5;
      }
    });
  }

  dispose() {
    this.meshes.forEach(m => {
      this.scene.remove(m.group);
      m.group.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    });
    
    this.meshes = [];
    this.animations = [];
  }
}

export async function createAdvancedVisualization(scene, conceptType, concept, config) {
  const generator = new AdvancedVisualizationGenerator(scene);
  
  const creators = {
    'MOLECULE': () => generator.createMolecularStructure(concept, config),
    'ORBIT': () => generator.createOrbitalSystem(concept, config),
    'HELIX': () => generator.createDNAHelix(concept, config),
    'CELL': () => generator.createCellStructure(concept, config),
    'PARTICLES': () => generator.createParticleFlow(concept, config),
    'WAVE': () => generator.createWavePatterns(concept, config)
  };
  
  const creator = creators[conceptType] || creators['PARTICLES'];
  await creator();
  
  return generator;
}
