// ============================================
// Visualization Generator v1.0
// Creates procedural 3D visualizations from concepts
// ============================================

import * as THREE from 'three';

export class VisualizationGenerator {
  constructor(scene) {
    this.scene = scene;
    this.meshes = [];
    this.animations = [];
  }

  clearScene() {
    this.meshes.forEach(m => {
      this.scene.remove(m);
      if (m.geometry) m.geometry.dispose();
      if (m.material) m.material.dispose();
    });
    this.meshes = [];
  }

  // ===== PROCEDURAL VISUALIZATION CREATORS =====

  createMoleculeVisualization(config, description) {
    this.clearScene();
    
    const particleCount = config.particles || 3;
    const center = new THREE.Vector3(0, 0, 0);
    
    // Central atom
    const centralMaterial = new THREE.MeshPhongMaterial({ 
      color: config.colors[0], 
      emissive: config.colors[0],
      emissiveIntensity: 0.3,
      shininess: 100
    });
    const centralGeom = new THREE.SphereGeometry(0.4, 32, 32);
    const centralAtom = new THREE.Mesh(centralGeom, centralMaterial);
    this.scene.add(centralAtom);
    this.meshes.push(centralAtom);
    
    // Surrounding atoms
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 1.2;
      
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = Math.cos(angle * 2) * 0.3;
      
      const atomMaterial = new THREE.MeshPhongMaterial({
        color: config.colors[(i + 1) % config.colors.length],
        emissive: config.colors[(i + 1) % config.colors.length],
        emissiveIntensity: 0.2
      });
      const atomGeom = new THREE.SphereGeometry(0.25, 24, 24);
      const atom = new THREE.Mesh(atomGeom, atomMaterial);
      atom.position.set(x, y, z);
      this.scene.add(atom);
      this.meshes.push(atom);
      
      // Bond line
      const bondGeom = new THREE.BufferGeometry().setFromPoints([
        center,
        new THREE.Vector3(x, y, z)
      ]);
      const bondMat = new THREE.LineBasicMaterial({ color: 0x888888 });
      const bond = new THREE.Line(bondGeom, bondMat);
      this.scene.add(bond);
      this.meshes.push(bond);
    }
    
    // Rotation animation
    return (time) => {
      this.meshes.forEach(m => {
        if (m.position.length && m.position.length() > 0) {
          const angle = time * 0.5 + Math.atan2(m.position.y, m.position.x);
          const r = Math.sqrt(m.position.x * m.position.x + m.position.y * m.position.y);
          m.position.x = Math.cos(angle) * r;
          m.position.y = Math.sin(angle) * r;
        }
      });
    };
  }

  createOrbitVisualization(config, description) {
    this.clearScene();
    
    const orbitCount = config.orbits || 2;
    
    // Central star/nucleus
    const centerMat = new THREE.MeshPhongMaterial({
      color: config.colors[0],
      emissive: config.colors[0],
      emissiveIntensity: 0.6
    });
    const centerGeom = new THREE.SphereGeometry(0.3, 32, 32);
    const center = new THREE.Mesh(centerGeom, centerMat);
    this.scene.add(center);
    this.meshes.push(center);
    
    // Orbits
    for (let orbit = 0; orbit < orbitCount; orbit++) {
      const radius = 1.5 + orbit * 0.8;
      
      // Orbit path
      const orbitGeom = new THREE.BufferGeometry();
      const points = [];
      for (let i = 0; i <= 64; i++) {
        const angle = (i / 64) * Math.PI * 2;
        points.push(new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius * 0.3,
          0
        ));
      }
      orbitGeom.setFromPoints(points);
      const orbitMat = new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 1 });
      const orbitLine = new THREE.Line(orbitGeom, orbitMat);
      this.scene.add(orbitLine);
      this.meshes.push(orbitLine);
      
      // Orbiting bodies
      for (let i = 0; i < 2; i++) {
        const bodyMat = new THREE.MeshPhongMaterial({
          color: config.colors[(orbit + i + 1) % config.colors.length],
          emissive: config.colors[(orbit + i + 1) % config.colors.length],
          emissiveIntensity: 0.3
        });
        const bodyGeom = new THREE.SphereGeometry(0.2, 16, 16);
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.userData = { radius, orbitIndex: orbit, bodyIndex: i };
        this.scene.add(body);
        this.meshes.push(body);
      }
    }
    
    // Animation function
    return (time) => {
      this.meshes.forEach(m => {
        if (m.userData && m.userData.radius) {
          const speed = 0.8 / (1 + m.userData.orbitIndex * 0.3);
          const angle = time * speed + (m.userData.bodyIndex * Math.PI);
          const r = m.userData.radius;
          m.position.x = Math.cos(angle) * r;
          m.position.y = Math.sin(angle) * r * 0.3;
        }
      });
    };
  }

  createMotionVisualization(config, description) {
    this.clearScene();
    
    // Moving object
    const objMat = new THREE.MeshPhongMaterial({
      color: config.colors[0],
      emissive: config.colors[0],
      emissiveIntensity: 0.4
    });
    const objGeom = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const movingObj = new THREE.Mesh(objGeom, objMat);
    this.scene.add(movingObj);
    this.meshes.push(movingObj);
    
    // Path visualization
    const pathPoints = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      pathPoints.push(new THREE.Vector3(t * 4 - 2, 0, 0));
    }
    const pathGeom = new THREE.BufferGeometry().setFromPoints(pathPoints);
    const pathMat = new THREE.LineBasicMaterial({ color: config.colors[1] });
    const pathLine = new THREE.Line(pathGeom, pathMat);
    this.scene.add(pathLine);
    this.meshes.push(pathLine);
    
    // Velocity vectors
    const arrowMat = new THREE.MeshPhongMaterial({ color: config.colors[1] });
    const arrowGeom = new THREE.ConeGeometry(0.15, 0.4, 8);
    const velocityArrow = new THREE.Mesh(arrowGeom, arrowMat);
    this.scene.add(velocityArrow);
    this.meshes.push(velocityArrow);
    
    return (time) => {
      const t = (time % 4) / 4;
      const x = t * 4 - 2;
      const v = Math.cos(t * Math.PI * 2) * 2;
      
      movingObj.position.x = x;
      movingObj.rotation.y += 0.05;
      
      velocityArrow.position.set(x + 0.5, 0.5, 0);
      velocityArrow.scale.x = Math.abs(v);
      velocityArrow.rotation.z = v > 0 ? 0 : Math.PI;
    };
  }

  createProcessVisualization(config, description) {
    this.clearScene();
    
    const stepCount = config.steps || 5;
    
    for (let i = 0; i < stepCount; i++) {
      const x = (i / (stepCount - 1)) * 4 - 2;
      
      const stepMat = new THREE.MeshPhongMaterial({
        color: config.colors[i % config.colors.length],
        emissive: config.colors[i % config.colors.length],
        emissiveIntensity: 0.3
      });
      const stepGeom = new THREE.IcosahedronGeometry(0.3, 2);
      const step = new THREE.Mesh(stepGeom, stepMat);
      step.position.x = x;
      this.scene.add(step);
      this.meshes.push(step);
      
      if (i < stepCount - 1) {
        const nextX = ((i + 1) / (stepCount - 1)) * 4 - 2;
        const arrowGeom = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x + 0.3, 0, 0),
          new THREE.Vector3(nextX - 0.3, 0, 0)
        ]);
        const arrowMat = new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 2 });
        const arrow = new THREE.Line(arrowGeom, arrowMat);
        this.scene.add(arrow);
        this.meshes.push(arrow);
      }
    }
    
    return (time) => {
      this.meshes.forEach((m, i) => {
        if (m.geometry && m.geometry.type === 'IcosahedronGeometry') {
          m.rotation.x += 0.02;
          m.rotation.y += 0.03;
          m.scale.y = 0.8 + Math.sin(time * 2 + i) * 0.3;
        }
      });
    };
  }

  createCellVisualization(config, description) {
    this.clearScene();
    
    // Cell membrane
    const membraneMat = new THREE.MeshPhongMaterial({
      color: config.colors[0],
      emissive: config.colors[0],
      emissiveIntensity: 0.1,
      transparent: true,
      opacity: 0.6
    });
    const membraneGeom = new THREE.IcosahedronGeometry(1.5, 3);
    const membrane = new THREE.Mesh(membraneGeom, membraneMat);
    this.scene.add(membrane);
    this.meshes.push(membrane);
    
    // Nucleus
    const nucleusMat = new THREE.MeshPhongMaterial({
      color: config.colors[1],
      emissive: config.colors[1],
      emissiveIntensity: 0.4
    });
    const nucleusGeom = new THREE.SphereGeometry(0.6, 32, 32);
    const nucleus = new THREE.Mesh(nucleusGeom, nucleusMat);
    this.scene.add(nucleus);
    this.meshes.push(nucleus);
    
    // Mitochondria
    const mitMat = new THREE.MeshPhongMaterial({
      color: config.colors[2],
      emissive: config.colors[2],
      emissiveIntensity: 0.3
    });
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const mitGeom = new THREE.CapsuleGeometry(0.2, 0.5, 4, 8);
      const mit = new THREE.Mesh(mitGeom, mitMat);
      mit.position.set(
        Math.cos(angle) * 0.8,
        Math.sin(angle) * 0.8,
        0
      );
      mit.rotation.z = angle;
      this.scene.add(mit);
      this.meshes.push(mit);
    }
    
    // Ribosomes
    const ribMat = new THREE.MeshPhongMaterial({
      color: config.colors[3],
      emissive: config.colors[3]
    });
    for (let i = 0; i < 6; i++) {
      const ribGeom = new THREE.SphereGeometry(0.15, 16, 16);
      const rib = new THREE.Mesh(ribGeom, ribMat);
      rib.position.set(
        Math.random() * 1.4 - 0.7,
        Math.random() * 1.4 - 0.7,
        Math.random() * 1.4 - 0.7
      );
      this.scene.add(rib);
      this.meshes.push(rib);
    }
    
    return (time) => {
      this.meshes.forEach((m, i) => {
        if (m.geometry && m.geometry.type === 'SphereGeometry' && i > 1) {
          m.position.y += Math.sin(time * 2 + i) * 0.02;
        }
      });
      membrane.rotation.x += 0.002;
      membrane.rotation.y += 0.003;
    };
  }

  createHelixVisualization(config, description) {
    this.clearScene();
    
    const turns = config.turns || 6;
    const points = [];
    const points2 = [];
    
    for (let i = 0; i < 100; i++) {
      const t = i / 100;
      const y = (t * 4) - 2;
      const x = Math.cos(t * Math.PI * 2 * turns) * 0.8;
      const z = Math.sin(t * Math.PI * 2 * turns) * 0.8;
      
      points.push(new THREE.Vector3(x, y, z));
      points2.push(new THREE.Vector3(-x, y, -z));
    }
    
    // DNA strands
    const strand1Geom = new THREE.BufferGeometry().setFromPoints(points);
    const strand1Mat = new THREE.LineBasicMaterial({ color: config.colors[0], linewidth: 3 });
    const strand1 = new THREE.Line(strand1Geom, strand1Mat);
    this.scene.add(strand1);
    this.meshes.push(strand1);
    
    const strand2Geom = new THREE.BufferGeometry().setFromPoints(points2);
    const strand2Mat = new THREE.LineBasicMaterial({ color: config.colors[1], linewidth: 3 });
    const strand2 = new THREE.Line(strand2Geom, strand2Mat);
    this.scene.add(strand2);
    this.meshes.push(strand2);
    
    // Base pairs
    for (let i = 0; i < 50; i++) {
      const t = i / 50;
      const y = (t * 4) - 2;
      const x1 = Math.cos(t * Math.PI * 2 * turns) * 0.8;
      const z1 = Math.sin(t * Math.PI * 2 * turns) * 0.8;
      
      const pairGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x1, y, z1),
        new THREE.Vector3(-x1, y, -z1)
      ]);
      const pairMat = new THREE.LineBasicMaterial({ color: 0x888888 });
      const pair = new THREE.Line(pairGeom, pairMat);
      this.scene.add(pair);
      this.meshes.push(pair);
    }
    
    return (time) => {
      strand1.rotation.y += 0.01;
      strand2.rotation.y += 0.01;
    };
  }

  createNodeVisualization(config, description) {
    this.clearScene();
    
    const nodeMat = new THREE.MeshPhongMaterial({
      color: config.colors[0],
      emissive: config.colors[0],
      emissiveIntensity: 0.5
    });
    const nodeGeom = new THREE.OctahedronGeometry(0.4, 2);
    const node = new THREE.Mesh(nodeGeom, nodeMat);
    this.scene.add(node);
    this.meshes.push(node);
    
    return (time) => {
      node.rotation.x += 0.02;
      node.rotation.y += 0.03;
      node.scale.x = 0.8 + Math.sin(time * 2) * 0.3;
      node.scale.y = 0.8 + Math.cos(time * 2) * 0.3;
    };
  }

  // ===== GENERIC VISUALIZATION =====

  async createVisualizationFromConfig(config, concept) {
    const visualType = config.type.toUpperCase();
    
    switch (visualType) {
      case 'MOLECULE':
        return this.createMoleculeVisualization(config, concept.description);
      case 'ORBIT':
        return this.createOrbitVisualization(config, concept.description);
      case 'MOTION':
        return this.createMotionVisualization(config, concept.description);
      case 'PROCESS':
        return this.createProcessVisualization(config, concept.description);
      case 'CELL':
        return this.createCellVisualization(config, concept.description);
      case 'HELIX':
        return this.createHelixVisualization(config, concept.description);
      case 'NODE':
      default:
        return this.createNodeVisualization(config, concept.description);
    }
  }

  getMeshCount() {
    return this.meshes.length;
  }
}
