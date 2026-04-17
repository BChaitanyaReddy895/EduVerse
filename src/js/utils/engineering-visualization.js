// ============================================
// Engineering-Grade Realistic 3D Visualization v2.0
// CAD-like, professional mechanical models
// ============================================

import * as THREE from 'three';

export class EngineeringGradeVisualization {
  constructor(scene) {
    this.scene = scene;
    this.meshes = [];
    this.animations = [];
    this.animationID = null;
    
    this.setupRealisticLighting();
    console.log('🏭 Engineering-Grade Visualization initialized');
  }

  // Professional lighting setup
  setupRealisticLighting() {
    // Remove old lights
    this.scene.children.forEach(child => {
      if (child instanceof THREE.Light) {
        this.scene.remove(child);
      }
    });

    // Key light (main illumination)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(10, 15, 10);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.left = -50;
    keyLight.shadow.camera.right = 50;
    keyLight.shadow.camera.top = 50;
    keyLight.shadow.camera.bottom = -50;
    this.scene.add(keyLight);

    // Fill light (secondary)
    const fillLight = new THREE.DirectionalLight(0x8899ff, 0.8);
    fillLight.position.set(-10, 8, -10);
    this.scene.add(fillLight);

    // Rim light (edge highlighting)
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
    rimLight.position.set(0, -20, -20);
    this.scene.add(rimLight);

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
  }

  // ENGINEERING: Mechanical Gears System
  async createGearSystem(concept, config = {}) {
    console.log(`⚙️ Creating gear system: ${concept.title}`);
    
    const group = new THREE.Group();
    
    // Create 3 interlocking gears
    const gears = [
      { radius: 2, teeth: 20, position: [-3, 0, 0], speed: 1 },
      { radius: 1.5, teeth: 15, position: [1.5, 0, 0], speed: -1.33 },
      { radius: 1, teeth: 10, position: [4, 0, 0], speed: 2 }
    ];

    gears.forEach((gearConfig, idx) => {
      const gear = this.createGear(gearConfig, idx);
      group.add(gear);

      // Setup animation
      this.animations.push({
        mesh: gear,
        type: 'gear-rotation',
        speed: gearConfig.speed * 0.02,
        axis: 'z'
      });
    });

    // Connection rods
    const rodMat = new THREE.MeshPhongMaterial({
      color: 0x2C3E50,
      metalness: 0.7,
      roughness: 0.3
    });

    // Rod between gear 1 and 2
    const rod1Geo = new THREE.CylinderGeometry(0.15, 0.15, 4.5, 16);
    const rod1 = new THREE.Mesh(rod1Geo, rodMat);
    rod1.rotation.z = Math.PI / 2;
    rod1.position.set(-0.75, 0, 0);
    group.add(rod1);

    // Rod between gear 2 and 3
    const rod2Geo = new THREE.CylinderGeometry(0.15, 0.15, 2.5, 16);
    const rod2 = new THREE.Mesh(rod2Geo, rodMat);
    rod2.rotation.z = Math.PI / 2;
    rod2.position.set(2.75, 0, 0);
    group.add(rod2);

    this.scene.add(group);
    this.meshes.push(group);
    return group;
  }

  // Create individual gear
  createGear(config, index) {
    const group = new THREE.Group();

    // Gear body (central hub)
    const hubGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 32);
    const hubMat = new THREE.MeshPhongMaterial({
      color: 0x34495E,
      metalness: 0.8,
      roughness: 0.2
    });
    const hub = new THREE.Mesh(hubGeo, hubMat);
    hub.castShadow = true;
    hub.receiveShadow = true;
    group.add(hub);

    // Teeth (using repeated boxes)
    const teeth = config.teeth;
    const toothHeight = config.radius * 0.4;
    
    for (let i = 0; i < teeth; i++) {
      const angle = (i / teeth) * Math.PI * 2;
      
      // Tooth geometry
      const toothGeo = new THREE.BoxGeometry(0.3, toothHeight, 0.3);
      const toothMat = new THREE.MeshPhongMaterial({
        color: 0x2C3E50,
        metalness: 0.85,
        roughness: 0.15
      });
      const tooth = new THREE.Mesh(toothGeo, toothMat);
      
      const toothRadius = config.radius - toothHeight / 2;
      tooth.position.set(
        Math.cos(angle) * toothRadius,
        0,
        Math.sin(angle) * toothRadius
      );
      tooth.castShadow = true;
      tooth.receiveShadow = true;
      
      group.add(tooth);
    }

    // Central shaft
    const shaftGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 16);
    const shaftMat = new THREE.MeshPhongMaterial({
      color: 0x1C2833,
      metalness: 0.9,
      roughness: 0.1
    });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    group.add(shaft);

    group.position.copy(new THREE.Vector3().fromArray(config.position));
    group.rotation.x = Math.PI / 2;

    return group;
  }

  // ENGINEERING: Piston-Crankshaft System
  async createPistonSystem(concept, config = {}) {
    console.log(`🔧 Creating piston system: ${concept.title}`);
    
    const group = new THREE.Group();

    // Crankshaft (center rotating part)
    const crankGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
    const crankMat = new THREE.MeshPhongMaterial({
      color: 0x1C2833,
      metalness: 0.9,
      roughness: 0.1
    });
    const crank = new THREE.Mesh(crankGeo, crankMat);
    crank.castShadow = true;
    crank.receiveShadow = true;
    group.add(crank);

    // Crankshaft extended arm
    const armGeo = new THREE.CylinderGeometry(0.15, 0.15, 2, 16);
    const arm = new THREE.Mesh(armGeo, crankMat);
    arm.rotation.z = Math.PI / 2;
    arm.position.x = 1;
    arm.castShadow = true;
    arm.receiveShadow = true;
    group.add(arm);

    // Connecting rod
    const rodGeo = new THREE.CylinderGeometry(0.2, 0.2, 3, 16);
    const rod = new THREE.Mesh(rodGeo, crankMat);
    rod.rotation.z = Math.PI / 2.5;
    rod.position.set(1.5, 1, 0);
    rod.castShadow = true;
    rod.receiveShadow = true;
    group.add(rod);

    // Piston
    const pistonGeo = new THREE.BoxGeometry(1, 0.6, 0.4);
    const pistonMat = new THREE.MeshPhongMaterial({
      color: 0x95A5A6,
      metalness: 0.7,
      roughness: 0.4
    });
    const piston = new THREE.Mesh(pistonGeo, pistonMat);
    piston.position.set(3, 2.5, 0);
    piston.castShadow = true;
    piston.receiveShadow = true;
    group.add(piston);

    // Cylinder walls
    const cylinderGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.15, 16);
    const cylinderMat = new THREE.MeshPhongMaterial({
      color: 0x34495E,
      metalness: 0.6,
      roughness: 0.5
    });
    const cylinder = new THREE.Mesh(cylinderGeo, cylinderMat);
    cylinder.position.set(3, 2.5, 0);
    cylinder.castShadow = true;
    cylinder.receiveShadow = true;
    group.add(cylinder);

    // Animation setup
    this.animations.push({
      mesh: group,
      type: 'piston-crank',
      cranks: [crank, arm],
      rod,
      piston,
      pistonStart: 3,
      pistonEnd: 5,
      speed: 0.03
    });

    this.scene.add(group);
    this.meshes.push(group);
    return group;
  }

  // ENGINEERING: Bridge Structure (Civil Engineering)
  async createBridgeStructure(concept, config = {}) {
    console.log(`🌉 Creating bridge structure: ${concept.title}`);
    
    const group = new THREE.Group();

    // Foundation pillars
    const pillarGeo = new THREE.BoxGeometry(1, 6, 0.8);
    const pillarMat = new THREE.MeshPhongMaterial({
      color: 0x7F8C8D,
      metalness: 0.5,
      roughness: 0.6
    });

    for (let i = -2; i <= 2; i++) {
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(i * 3, -3, 0);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      group.add(pillar);
    }

    // Horizontal beam (deck)
    const beamGeo = new THREE.BoxGeometry(15, 0.5, 3);
    const beamMat = new THREE.MeshPhongMaterial({
      color: 0x2C3E50,
      metalness: 0.7,
      roughness: 0.4
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 0;
    beam.castShadow = true;
    beam.receiveShadow = true;
    group.add(beam);

    // Suspension cables (steel wire effect)
    const cableMat = new THREE.LineBasicMaterial({ color: 0x34495E, linewidth: 2 });
    
    for (let i = 0; i < 8; i++) {
      const points = [
        new THREE.Vector3(-7.5 + i * 2.2, 3, 0),
        new THREE.Vector3(-7.5 + i * 2.2, 0.3, 0)
      ];
      const cableGeo = new THREE.BufferGeometry().setFromPoints(points);
      const cable = new THREE.Line(cableGeo, cableMat);
      group.add(cable);
    }

    // Truss work (X patterns)
    const trussMat = new THREE.LineBasicMaterial({ color: 0x2C3E50, linewidth: 1.5 });
    
    for (let section = 0; section < 5; section++) {
      const baseX = -7.5 + section * 3;
      const points = [
        new THREE.Vector3(baseX, 0, -1),
        new THREE.Vector3(baseX + 1.5, -2, -1),
        new THREE.Vector3(baseX + 3, 0, -1)
      ];
      const trussGeo = new THREE.BufferGeometry().setFromPoints(points);
      const truss = new THREE.Line(trussGeo, trussMat);
      group.add(truss);
    }

    this.scene.add(group);
    this.meshes.push(group);
    return group;
  }

  // ENGINEERING: Motor/Turbine Rotor
  async createRotorSystem(concept, config = {}) {
    console.log(`🌀 Creating rotor system: ${concept.title}`);
    
    const group = new THREE.Group();

    // Central shaft
    const shaftGeo = new THREE.CylinderGeometry(0.3, 0.3, 8, 16);
    const shaftMat = new THREE.MeshPhongMaterial({
      color: 0x1C2833,
      metalness: 0.9,
      roughness: 0.1
    });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    group.add(shaft);

    // Rotor blades (turbine-like)
    const blades = 4;
    const bladeMat = new THREE.MeshPhongMaterial({
      color: 0xE74C3C,
      metalness: 0.6,
      roughness: 0.4
    });

    for (let i = 0; i < blades; i++) {
      const angle = (i / blades) * Math.PI * 2;
      
      // Blade geometry (swept wing-like)
      const bladeGeo = new THREE.BoxGeometry(0.4, 2, 0.1);
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      
      blade.position.set(
        Math.cos(angle) * 1.5,
        0,
        Math.sin(angle) * 1.5
      );
      blade.rotation.y = angle;
      blade.castShadow = true;
      blade.receiveShadow = true;
      
      group.add(blade);
    }

    // Rotor disc
    const discGeo = new THREE.CylinderGeometry(2.2, 2.2, 0.5, 32);
    const discMat = new THREE.MeshPhongMaterial({
      color: 0x2C3E50,
      metalness: 0.8,
      roughness: 0.3
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.position.z = 0;
    disc.castShadow = true;
    disc.receiveShadow = true;
    group.add(disc);

    // Animation
    this.animations.push({
      mesh: group,
      type: 'rotor-spin',
      speed: 0.04,
      axis: 'y'
    });

    this.scene.add(group);
    this.meshes.push(group);
    return group;
  }

  // ENGINEERING: Building Structure (3-layer framework)
  async createBuildingStructure(concept, config = {}) {
    console.log(`🏢 Creating building structure: ${concept.title}`);
    
    const group = new THREE.Group();

    const frameMat = new THREE.MeshPhongMaterial({
      color: 0x2C3E50,
      metalness: 0.7,
      roughness: 0.4
    });

    // 3 levels
    for (let level = 0; level < 3; level++) {
      const y = level * 3;

      // Vertical columns
      for (let i = 0; i < 4; i++) {
        const x = (i - 1.5) * 3;
        
        const colGeo = new THREE.CylinderGeometry(0.3, 0.3, 2.8, 16);
        const col = new THREE.Mesh(colGeo, frameMat);
        col.position.set(x, y + 1.4, 0);
        col.castShadow = true;
        col.receiveShadow = true;
        group.add(col);
      }

      // Horizontal beams
      const beamGeo = new THREE.BoxGeometry(9, 0.4, 3);
      const beam = new THREE.Mesh(beamGeo, frameMat);
      beam.position.y = y;
      beam.castShadow = true;
      beam.receiveShadow = true;
      group.add(beam);

      // Floor slabs (semi-transparent)
      const slabGeo = new THREE.BoxGeometry(9, 0.15, 3);
      const slabMat = new THREE.MeshPhongMaterial({
        color: 0x95A5A6,
        metalness: 0.5,
        roughness: 0.5,
        transparent: true,
        opacity: 0.7
      });
      const slab = new THREE.Mesh(slabGeo, slabMat);
      slab.position.set(0, y - 0.3, 0);
      slab.castShadow = true;
      slab.receiveShadow = true;
      group.add(slab);
    }

    this.scene.add(group);
    this.meshes.push(group);
    return group;
  }

  // ENGINEERING: Hydraulic Cylinder System
  async createHydraulicSystem(concept, config = {}) {
    console.log(`💪 Creating hydraulic system: ${concept.title}`);
    
    const group = new THREE.Group();

    // Main cylinder barrel
    const barrelGeo = new THREE.CylinderGeometry(0.8, 0.8, 6, 32);
    const barrelMat = new THREE.MeshPhongMaterial({
      color: 0x3498DB,
      metalness: 0.8,
      roughness: 0.2
    });
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.rotation.z = Math.PI / 2;
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    group.add(barrel);

    // Piston rod
    const rodGeo = new THREE.CylinderGeometry(0.3, 0.3, 8, 16);
    const rodMat = new THREE.MeshPhongMaterial({
      color: 0x1C2833,
      metalness: 0.9,
      roughness: 0.1
    });
    const rod = new THREE.Mesh(rodGeo, rodMat);
    rod.rotation.z = Math.PI / 2;
    rod.castShadow = true;
    rod.receiveShadow = true;
    group.add(rod);

    // Piston head (inside barrel)
    const headGeo = new THREE.SphereGeometry(0.75, 16, 16);
    const headMat = new THREE.MeshPhongMaterial({
      color: 0x95A5A6,
      metalness: 0.7,
      roughness: 0.3
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.x = -1.5;
    head.castShadow = true;
    head.receiveShadow = true;
    group.add(head);

    // End cap
    const capGeo = new THREE.SphereGeometry(0.85, 16, 16);
    const capMat = new THREE.MeshPhongMaterial({
      color: 0x34495E,
      metalness: 0.7,
      roughness: 0.4
    });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.x = 3;
    cap.castShadow = true;
    cap.receiveShadow = true;
    group.add(cap);

    // Mounting brackets
    const bracketGeo = new THREE.BoxGeometry(0.3, 0.5, 0.3);
    const bracketMat = new THREE.MeshPhongMaterial({
      color: 0x2C3E50,
      metalness: 0.7,
      roughness: 0.4
    });

    const bracket1 = new THREE.Mesh(bracketGeo, bracketMat);
    bracket1.position.set(-3.5, -1, 0);
    group.add(bracket1);

    const bracket2 = new THREE.Mesh(bracketGeo, bracketMat);
    bracket2.position.set(4.5, 1, 0);
    group.add(bracket2);

    // Animation
    this.animations.push({
      mesh: head,
      type: 'hydraulic-extend',
      startPos: -1.5,
      endPos: 1.5,
      speed: 0.02
    });

    this.scene.add(group);
    this.meshes.push(group);
    return group;
  }

  // Update all animations
  updateAnimations(elapsedTime) {
    this.animations.forEach(anim => {
      if (anim.type === 'gear-rotation') {
        anim.mesh.rotation[anim.axis] += anim.speed;
      } else if (anim.type === 'rotor-spin') {
        anim.mesh.rotation[anim.axis] += anim.speed;
      } else if (anim.type === 'piston-crank') {
        const angle = elapsedTime * anim.speed;
        anim.cranks.forEach(crank => {
          crank.rotation.z = angle;
        });
        
        // Piston follows crank motion (simplified harmonic)
        const pistonPos = anim.pistonStart + 
          Math.sin(angle) * (anim.pistonEnd - anim.pistonStart) * 0.3;
        anim.piston.position.x = pistonPos;
      } else if (anim.type === 'hydraulic-extend') {
        const offset = Math.sin(elapsedTime * anim.speed) * 2;
        anim.mesh.position.x = anim.startPos + offset;
      }
    });
  }

  // Dispose resources
  dispose() {
    this.meshes.forEach(mesh => {
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });
    
    this.animations = [];
    this.meshes = [];
    
    if (this.animationID) {
      cancelAnimationFrame(this.animationID);
    }
  }
}

export async function createEngineeringGradeVisualization(scene, conceptType, concept) {
  const vizGen = new EngineeringGradeVisualization(scene);

  const typeMap = {
    'GEAR_SYSTEM': () => vizGen.createGearSystem(concept),
    'PISTON': () => vizGen.createPistonSystem(concept),
    'BRIDGE': () => vizGen.createBridgeStructure(concept),
    'ROTOR': () => vizGen.createRotorSystem(concept),
    'BUILDING': () => vizGen.createBuildingStructure(concept),
    'HYDRAULIC': () => vizGen.createHydraulicSystem(concept)
  };

  const creator = typeMap[conceptType];
  if (creator) {
    await creator();
  }

  return vizGen;
}
