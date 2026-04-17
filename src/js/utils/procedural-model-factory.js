/**
 * Procedural Model Factory
 * Generates research-grade 3D models using Three.js geometry for 30+ educational concepts.
 * Each model has named sub-meshes for cognitive layer targeting, PBR materials, and animation data.
 * 
 * This replaces the need for external GLB model files — all geometry is generated programmatically.
 */

import * as THREE from 'three';

export class ProceduralModelFactory {
  constructor() {
    this.modelGenerators = new Map();
    this.materialPresets = {};
    this.generatedModels = new Map();
    this.stats = { modelsGenerated: 0, verticesCreated: 0 };
    this._registerAllGenerators();
    this._createMaterialPresets();
  }

  // ========== PUBLIC API ==========

  /**
   * Generate a 3D model for a concept
   * @param {string} concept - e.g. 'heart', 'motor', 'atom'
   * @param {string} learnerLevel - BEGINNER | INTERMEDIATE | ADVANCED | EXPERT
   * @returns {THREE.Group} - Named group with sub-meshes
   */
  generateModel(concept, learnerLevel = 'INTERMEDIATE') {
    const key = concept.toLowerCase();
    const generator = this.modelGenerators.get(key);

    if (!generator) {
      console.warn(`No generator for concept: ${concept}, using generic model`);
      return this._generateGenericModel(concept);
    }

    const cacheKey = `${key}_${learnerLevel}`;
    if (this.generatedModels.has(cacheKey)) {
      return this.generatedModels.get(cacheKey).clone();
    }

    const model = generator(learnerLevel);
    model.name = `model_${key}`;
    model.userData.concept = key;
    model.userData.learnerLevel = learnerLevel;
    model.userData.generated = true;

    this.generatedModels.set(cacheKey, model);
    this.stats.modelsGenerated++;
    return model.clone();
  }

  /**
   * Get list of all available concepts
   */
  getAvailableConcepts() {
    return Array.from(this.modelGenerators.keys());
  }

  /**
   * Check if a concept has a generator
   */
  hasConcept(concept) {
    return this.modelGenerators.has(concept.toLowerCase());
  }

  // ========== MATERIAL PRESETS ==========

  _createMaterialPresets() {
    this.materialPresets = {
      metal: new THREE.MeshStandardMaterial({ color: 0x8899aa, metalness: 0.9, roughness: 0.15 }),
      metalDark: new THREE.MeshStandardMaterial({ color: 0x444455, metalness: 0.85, roughness: 0.2 }),
      copper: new THREE.MeshStandardMaterial({ color: 0xb87333, metalness: 0.95, roughness: 0.1 }),
      organicRed: new THREE.MeshStandardMaterial({ color: 0xcc3344, metalness: 0.0, roughness: 0.7 }),
      organicPink: new THREE.MeshStandardMaterial({ color: 0xff6688, metalness: 0.0, roughness: 0.6 }),
      tissue: new THREE.MeshStandardMaterial({ color: 0xffccbb, metalness: 0.0, roughness: 0.8 }),
      bone: new THREE.MeshStandardMaterial({ color: 0xf5f0e0, metalness: 0.0, roughness: 0.9 }),
      blood: new THREE.MeshStandardMaterial({ color: 0x990022, metalness: 0.1, roughness: 0.5 }),
      cellMembrane: new THREE.MeshStandardMaterial({ color: 0x88ccaa, metalness: 0.0, roughness: 0.4, transparent: true, opacity: 0.7, side: THREE.DoubleSide }),
      nucleus: new THREE.MeshStandardMaterial({ color: 0x5544aa, metalness: 0.1, roughness: 0.6 }),
      glass: new THREE.MeshStandardMaterial({ color: 0xaaddff, metalness: 0.1, roughness: 0.0, transparent: true, opacity: 0.4 }),
      plastic: new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.0, roughness: 0.7 }),
      greenPlant: new THREE.MeshStandardMaterial({ color: 0x228833, metalness: 0.0, roughness: 0.8 }),
      wood: new THREE.MeshStandardMaterial({ color: 0x8b6914, metalness: 0.0, roughness: 0.9 }),
      water: new THREE.MeshStandardMaterial({ color: 0x2288cc, metalness: 0.2, roughness: 0.1, transparent: true, opacity: 0.6 }),
      rock: new THREE.MeshStandardMaterial({ color: 0x888877, metalness: 0.0, roughness: 0.95 }),
      gold: new THREE.MeshStandardMaterial({ color: 0xffdd33, metalness: 1.0, roughness: 0.05 }),
      concrete: new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.0, roughness: 0.95 }),
      lava: new THREE.MeshStandardMaterial({ color: 0xff4400, metalness: 0.3, roughness: 0.4, emissive: 0xff2200, emissiveIntensity: 0.5 }),
      energy: new THREE.MeshStandardMaterial({ color: 0x44aaff, metalness: 0.1, roughness: 0.2, emissive: 0x2266ff, emissiveIntensity: 0.8, transparent: true, opacity: 0.6 }),
      wire: new THREE.MeshStandardMaterial({ color: 0xcc6633, metalness: 0.7, roughness: 0.3 }),
    };
  }

  _mat(name) {
    return (this.materialPresets[name] || this.materialPresets.plastic).clone();
  }

  // ========== REGISTER ALL CONCEPT GENERATORS ==========

  _registerAllGenerators() {
    // BIOLOGY
    this.modelGenerators.set('heart', (level) => this._generateHeart(level));
    this.modelGenerators.set('brain', (level) => this._generateBrain(level));
    this.modelGenerators.set('cell', (level) => this._generateCell(level));
    this.modelGenerators.set('plant', (level) => this._generatePlant(level));
    this.modelGenerators.set('dna', (level) => this._generateDNA(level));
    this.modelGenerators.set('lung', (level) => this._generateLung(level));
    this.modelGenerators.set('eye', (level) => this._generateEye(level));
    this.modelGenerators.set('microorganism', (level) => this._generateMicroorganism(level));

    // ENGINEERING
    this.modelGenerators.set('motor', (level) => this._generateMotor(level));
    this.modelGenerators.set('circuit', (level) => this._generateCircuit(level));
    this.modelGenerators.set('gear', (level) => this._generateGear(level));
    this.modelGenerators.set('turbine', (level) => this._generateTurbine(level));
    this.modelGenerators.set('piston', (level) => this._generatePiston(level));
    this.modelGenerators.set('transformer', (level) => this._generateTransformer(level));
    this.modelGenerators.set('pulley', (level) => this._generatePulley(level));
    this.modelGenerators.set('machine', (level) => this._generateMachine(level));

    // CHEMISTRY
    this.modelGenerators.set('atom', (level) => this._generateAtom(level));
    this.modelGenerators.set('molecule', (level) => this._generateMolecule(level));
    this.modelGenerators.set('crystal', (level) => this._generateCrystal(level));
    this.modelGenerators.set('water', (level) => this._generateWaterMolecule(level));

    // PHYSICS
    this.modelGenerators.set('pendulum', (level) => this._generatePendulum(level));
    this.modelGenerators.set('lens', (level) => this._generateLens(level));
    this.modelGenerators.set('magnet', (level) => this._generateMagnet(level));
    this.modelGenerators.set('spring', (level) => this._generateSpring(level));

    // ASTRONOMY
    this.modelGenerators.set('planet', (level) => this._generatePlanet(level));
    this.modelGenerators.set('star', (level) => this._generateStar(level));
    this.modelGenerators.set('solar_system', (level) => this._generateSolarSystem(level));

    // ARCHITECTURE
    this.modelGenerators.set('building', (level) => this._generateBuilding(level));
    this.modelGenerators.set('bridge', (level) => this._generateBridge(level));
    this.modelGenerators.set('arch', (level) => this._generateArch(level));

    // SCCA RESEARCH CIFAR DATASET
    this.modelGenerators.set('airplane', (level) => this._generateAirplane(level));
    this.modelGenerators.set('automobile', (level) => this._generateAutomobile(level));
    this.modelGenerators.set('ship', (level) => this._generateShip(level));
    this.modelGenerators.set('heavy truck', (level) => this._generateHeavyTruck(level));
  }

  // ========== BIOLOGY GENERATORS ==========

  _generateHeart(level) {
    const group = new THREE.Group();
    const detail = { BEGINNER: 0.3, INTERMEDIATE: 0.6, ADVANCED: 0.85, EXPERT: 1.0 }[level] || 0.6;
    const segments = Math.floor(16 + detail * 32);

    // Main heart shape using merged spheres
    const heartShape = new THREE.Group();
    heartShape.name = 'structure_outer';

    // Left ventricle (larger)
    const leftV = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, segments, segments),
      this._mat('organicRed')
    );
    leftV.position.set(-0.2, -0.15, 0);
    leftV.scale.set(1, 1.3, 0.9);
    leftV.name = 'left_ventricle';
    heartShape.add(leftV);

    // Right ventricle
    const rightV = new THREE.Mesh(
      new THREE.SphereGeometry(0.48, segments, segments),
      this._mat('organicRed')
    );
    rightV.position.set(0.25, -0.1, 0);
    rightV.scale.set(0.9, 1.2, 0.85);
    rightV.name = 'right_ventricle';
    heartShape.add(rightV);

    // Left atrium
    const leftA = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, segments, segments),
      this._mat('organicPink')
    );
    leftA.position.set(-0.2, 0.45, 0);
    leftA.name = 'left_atrium';
    heartShape.add(leftA);

    // Right atrium
    const rightA = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, segments, segments),
      this._mat('organicPink')
    );
    rightA.position.set(0.25, 0.42, 0);
    rightA.name = 'right_atrium';
    heartShape.add(rightA);

    group.add(heartShape);

    // Aorta (main artery)
    if (detail > 0.3) {
      const aortaPath = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.1, 0.6, 0),
        new THREE.Vector3(-0.15, 0.9, 0.05),
        new THREE.Vector3(0.0, 1.1, 0),
        new THREE.Vector3(0.25, 1.0, -0.05),
        new THREE.Vector3(0.35, 0.8, 0),
      ]);
      const aorta = new THREE.Mesh(
        new THREE.TubeGeometry(aortaPath, 20, 0.08, 8, false),
        this._mat('blood')
      );
      aorta.name = 'aorta';
      group.add(aorta);

      // Pulmonary artery
      const pulmonaryPath = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.1, 0.55, 0.05),
        new THREE.Vector3(0.15, 0.8, 0.15),
        new THREE.Vector3(0.05, 0.95, 0.1),
      ]);
      const pulmonary = new THREE.Mesh(
        new THREE.TubeGeometry(pulmonaryPath, 15, 0.06, 8, false),
        this._mat('blood')
      );
      pulmonary.name = 'pulmonary_artery';
      group.add(pulmonary);
    }

    // Internal structure (valves) - intermediate+
    if (detail > 0.5) {
      const valveGroup = new THREE.Group();
      valveGroup.name = 'function_valves';
      const valveGeo = new THREE.RingGeometry(0.05, 0.15, 8);
      const valveMat = this._mat('tissue');

      [-0.15, 0.2].forEach((x, i) => {
        const valve = new THREE.Mesh(valveGeo, valveMat);
        valve.position.set(x, 0.15, 0.1);
        valve.rotation.x = -Math.PI / 6;
        valve.name = i === 0 ? 'mitral_valve' : 'tricuspid_valve';
        valveGroup.add(valve);
      });
      group.add(valveGroup);
    }

    // Blood flow particles - advanced+
    if (detail > 0.7) {
      const flowGroup = new THREE.Group();
      flowGroup.name = 'behavior_bloodflow';
      const particleGeo = new THREE.SphereGeometry(0.02, 4, 4);
      const particleMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x660000, emissiveIntensity: 0.5 });
      for (let i = 0; i < 30; i++) {
        const p = new THREE.Mesh(particleGeo, particleMat);
        const angle = (i / 30) * Math.PI * 2;
        p.position.set(Math.cos(angle) * 0.3, Math.sin(angle) * 0.5, 0.1);
        p.userData.flowAngle = angle;
        p.userData.flowSpeed = 0.02 + Math.random() * 0.01;
        flowGroup.add(p);
      }
      group.add(flowGroup);
    }

    // Coronary arteries - expert
    if (detail > 0.9) {
      const coronaryGroup = new THREE.Group();
      coronaryGroup.name = 'interaction_coronary';
      for (let i = 0; i < 5; i++) {
        const path = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.2 + i * 0.12, 0.3, 0.45),
          new THREE.Vector3(-0.15 + i * 0.1, 0.0, 0.5),
          new THREE.Vector3(-0.1 + i * 0.08, -0.3, 0.42),
        ]);
        const tube = new THREE.Mesh(
          new THREE.TubeGeometry(path, 8, 0.015, 6, false),
          new THREE.MeshStandardMaterial({ color: 0xff4444, emissive: 0x330000 })
        );
        tube.name = `coronary_artery_${i}`;
        coronaryGroup.add(tube);
      }
      group.add(coronaryGroup);
    }

    group.userData.animationData = {
      type: 'pulse', rate: 1.2, amplitude: 0.05,
      flowGroups: ['behavior_bloodflow'],
    };
    return group;
  }

  _generateBrain(level) {
    const group = new THREE.Group();
    const detail = { BEGINNER: 0.3, INTERMEDIATE: 0.6, ADVANCED: 0.85, EXPERT: 1.0 }[level] || 0.6;
    const segments = Math.floor(16 + detail * 32);

    // Cerebrum — two hemispheres
    const brainMat = this._mat('organicPink');
    brainMat.color.setHex(0xeebb99);
    brainMat.roughness = 0.85;

    const leftHemi = new THREE.Mesh(new THREE.SphereGeometry(0.6, segments, segments, 0, Math.PI), brainMat);
    leftHemi.position.set(-0.02, 0.1, 0);
    leftHemi.scale.set(1, 0.85, 1.1);
    leftHemi.name = 'left_hemisphere';

    const rightHemi = new THREE.Mesh(new THREE.SphereGeometry(0.6, segments, segments, Math.PI, Math.PI), brainMat.clone());
    rightHemi.position.set(0.02, 0.1, 0);
    rightHemi.scale.set(1, 0.85, 1.1);
    rightHemi.name = 'right_hemisphere';

    const outerGroup = new THREE.Group();
    outerGroup.name = 'structure_outer';
    outerGroup.add(leftHemi, rightHemi);
    group.add(outerGroup);

    // Cerebellum
    if (detail > 0.3) {
      const cerebellum = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, segments, segments),
        brainMat.clone()
      );
      cerebellum.position.set(0, -0.25, -0.35);
      cerebellum.scale.set(1.2, 0.7, 0.9);
      cerebellum.name = 'cerebellum';
      outerGroup.add(cerebellum);
    }

    // Brain stem
    if (detail > 0.3) {
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.08, 0.4, segments),
        this._mat('tissue')
      );
      stem.position.set(0, -0.5, -0.2);
      stem.name = 'brainstem';
      outerGroup.add(stem);
    }

    // Lobe regions - intermediate+
    if (detail > 0.5) {
      const lobeGroup = new THREE.Group();
      lobeGroup.name = 'function_lobes';
      const lobeData = [
        { name: 'frontal_lobe', color: 0xff6666, pos: [0, 0.25, 0.35], scale: [0.55, 0.4, 0.35] },
        { name: 'parietal_lobe', color: 0x66ff66, pos: [0, 0.35, -0.05], scale: [0.55, 0.3, 0.35] },
        { name: 'temporal_lobe', color: 0x6666ff, pos: [-0.45, -0.05, 0.1], scale: [0.2, 0.3, 0.45] },
        { name: 'occipital_lobe', color: 0xffff66, pos: [0, 0.15, -0.45], scale: [0.4, 0.35, 0.2] },
      ];
      lobeData.forEach(({ name, color, pos, scale }) => {
        const mat = new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 12), mat);
        mesh.position.set(...pos);
        mesh.scale.set(...scale);
        mesh.name = name;
        lobeGroup.add(mesh);
      });
      group.add(lobeGroup);
    }

    // Neural network visualization - advanced+
    if (detail > 0.7) {
      const neuralGroup = new THREE.Group();
      neuralGroup.name = 'interaction_neural';
      const neuronMat = new THREE.MeshStandardMaterial({ color: 0x44ddff, emissive: 0x0088ff, emissiveIntensity: 0.6, transparent: true, opacity: 0.7 });
      for (let i = 0; i < 40; i++) {
        const pos = new THREE.Vector3(
          (Math.random() - 0.5) * 0.8,
          (Math.random() - 0.3) * 0.6,
          (Math.random() - 0.5) * 0.8
        );
        const neuron = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), neuronMat);
        neuron.position.copy(pos);
        neuralGroup.add(neuron);
      }
      group.add(neuralGroup);
    }

    group.userData.animationData = { type: 'glow', rate: 0.5, groups: ['interaction_neural'] };
    return group;
  }

  _generateCell(level) {
    const group = new THREE.Group();
    const detail = { BEGINNER: 0.3, INTERMEDIATE: 0.6, ADVANCED: 0.85, EXPERT: 1.0 }[level] || 0.6;

    // Cell membrane
    const membrane = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 32, 32),
      this._mat('cellMembrane')
    );
    membrane.name = 'cell_membrane';
    const outerGroup = new THREE.Group();
    outerGroup.name = 'structure_outer';
    outerGroup.add(membrane);
    group.add(outerGroup);

    // Nucleus
    const nucleusGroup = new THREE.Group();
    nucleusGroup.name = 'function_nucleus';
    const nucleusMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 24, 24),
      this._mat('nucleus')
    );
    nucleusMesh.name = 'nucleus';
    nucleusGroup.add(nucleusMesh);

    // Nucleolus
    if (detail > 0.3) {
      const nucleolus = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0x331166 })
      );
      nucleolus.position.set(0.08, 0.05, 0);
      nucleolus.name = 'nucleolus';
      nucleusGroup.add(nucleolus);
    }
    group.add(nucleusGroup);

    // Organelles - intermediate+
    if (detail > 0.4) {
      const organelleGroup = new THREE.Group();
      organelleGroup.name = 'function_organelles';

      // Mitochondria
      for (let i = 0; i < 5; i++) {
        const mito = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.04, 0.12, 8, 8),
          new THREE.MeshStandardMaterial({ color: 0xdd6633 })
        );
        const angle = (i / 5) * Math.PI * 2;
        mito.position.set(Math.cos(angle) * 0.5, Math.sin(angle) * 0.5, (Math.random() - 0.5) * 0.3);
        mito.rotation.set(Math.random(), Math.random(), Math.random());
        mito.name = `mitochondria_${i}`;
        organelleGroup.add(mito);
      }

      // Endoplasmic reticulum (wavy tube network)
      if (detail > 0.5) {
        const erMat = new THREE.MeshStandardMaterial({ color: 0x88aa55, transparent: true, opacity: 0.5 });
        for (let i = 0; i < 3; i++) {
          const pts = [];
          for (let j = 0; j < 8; j++) {
            pts.push(new THREE.Vector3(
              0.15 + j * 0.05, (Math.sin(j * 1.5) * 0.1) + i * 0.12 - 0.15, 0.1 * Math.cos(j)
            ));
          }
          const curve = new THREE.CatmullRomCurve3(pts);
          const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.015, 6, false), erMat);
          tube.name = `er_${i}`;
          organelleGroup.add(tube);
        }
      }

      // Ribosomes
      if (detail > 0.6) {
        const riboMat = new THREE.MeshStandardMaterial({ color: 0x334466 });
        for (let i = 0; i < 20; i++) {
          const ribo = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), riboMat);
          ribo.position.set(
            (Math.random() - 0.5) * 1.2,
            (Math.random() - 0.5) * 1.2,
            (Math.random() - 0.5) * 1.2
          ).multiplyScalar(0.5);
          organelleGroup.add(ribo);
        }
      }

      group.add(organelleGroup);
    }

    group.userData.animationData = { type: 'float', rate: 0.3, amplitude: 0.02 };
    return group;
  }

  _generatePlant(level) {
    const group = new THREE.Group();
    const detail = { BEGINNER: 0.3, INTERMEDIATE: 0.6, ADVANCED: 0.85, EXPERT: 1.0 }[level] || 0.6;

    // Stem
    const stemPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.02, 0.4, 0),
      new THREE.Vector3(-0.01, 0.8, 0.01),
      new THREE.Vector3(0.01, 1.2, 0),
    ]);
    const stem = new THREE.Mesh(
      new THREE.TubeGeometry(stemPath, 16, 0.03, 8, false),
      this._mat('greenPlant')
    );
    stem.name = 'stem';
    const outerGroup = new THREE.Group();
    outerGroup.name = 'structure_outer';
    outerGroup.add(stem);

    // Leaves
    const leafGeo = new THREE.SphereGeometry(0.15, 8, 6);
    leafGeo.scale(1, 0.15, 0.6);
    const leafMat = this._mat('greenPlant');
    const leavePositions = [
      { pos: [0.15, 0.4, 0], rot: [0, 0, -0.5] },
      { pos: [-0.15, 0.6, 0], rot: [0, 0, 0.5] },
      { pos: [0.12, 0.85, 0.05], rot: [0, 0, -0.4] },
      { pos: [-0.1, 1.0, -0.03], rot: [0, 0, 0.3] },
    ];
    leavePositions.forEach(({ pos, rot }, i) => {
      const leaf = new THREE.Mesh(leafGeo, leafMat.clone());
      leaf.position.set(...pos);
      leaf.rotation.set(...rot);
      leaf.name = `leaf_${i}`;
      outerGroup.add(leaf);
    });
    group.add(outerGroup);

    // Roots
    if (detail > 0.3) {
      const rootGroup = new THREE.Group();
      rootGroup.name = 'function_roots';
      const rootMat = new THREE.MeshStandardMaterial({ color: 0x665533 });
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const rootPath = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(Math.cos(angle) * 0.15, -0.2, Math.sin(angle) * 0.15),
          new THREE.Vector3(Math.cos(angle) * 0.25, -0.45, Math.sin(angle) * 0.2),
        ]);
        const root = new THREE.Mesh(new THREE.TubeGeometry(rootPath, 8, 0.012, 6, false), rootMat);
        root.name = `root_${i}`;
        rootGroup.add(root);
      }
      group.add(rootGroup);
    }

    // Flower
    if (detail > 0.5) {
      const flowerGroup = new THREE.Group();
      flowerGroup.name = 'function_flower';
      flowerGroup.position.set(0, 1.25, 0);
      const petalMat = new THREE.MeshStandardMaterial({ color: 0xff66aa, side: THREE.DoubleSide });
      for (let i = 0; i < 6; i++) {
        const petalGeo = new THREE.SphereGeometry(0.08, 8, 6);
        petalGeo.scale(1, 0.2, 0.5);
        const petal = new THREE.Mesh(petalGeo, petalMat);
        const angle = (i / 6) * Math.PI * 2;
        petal.position.set(Math.cos(angle) * 0.08, 0, Math.sin(angle) * 0.08);
        petal.rotation.set(0, angle, Math.PI / 4);
        petal.name = `petal_${i}`;
        flowerGroup.add(petal);
      }
      // Center of flower
      const center = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xffcc00 })
      );
      center.name = 'stamen';
      flowerGroup.add(center);
      group.add(flowerGroup);
    }

    group.userData.animationData = { type: 'sway', rate: 0.5, amplitude: 0.03 };
    return group;
  }

  _generateDNA(level) {
    const group = new THREE.Group();
    const detail = { BEGINNER: 0.3, INTERMEDIATE: 0.6, ADVANCED: 0.85, EXPERT: 1.0 }[level] || 0.6;
    const turns = 2 + detail * 3;
    const stepsPerTurn = 10;
    const totalSteps = Math.floor(turns * stepsPerTurn);
    const height = 2.0;
    const radius = 0.3;

    const helixGroup = new THREE.Group();
    helixGroup.name = 'structure_outer';

    const strand1Mat = new THREE.MeshStandardMaterial({ color: 0x4488ff, emissive: 0x112244, emissiveIntensity: 0.3 });
    const strand2Mat = new THREE.MeshStandardMaterial({ color: 0xff4488, emissive: 0x441122, emissiveIntensity: 0.3 });
    const basePairColors = [0x44dd44, 0xffdd44, 0xff8844, 0xdd44ff];

    for (let i = 0; i < totalSteps; i++) {
      const t = i / totalSteps;
      const angle = t * Math.PI * 2 * turns;
      const y = t * height - height / 2;

      // Strand 1 node
      const node1 = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), strand1Mat);
      node1.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      helixGroup.add(node1);

      // Strand 2 node (opposite side)
      const node2 = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), strand2Mat);
      node2.position.set(Math.cos(angle + Math.PI) * radius, y, Math.sin(angle + Math.PI) * radius);
      helixGroup.add(node2);

      // Base pair connecting rung
      if (i % 2 === 0 && detail > 0.3) {
        const pairMat = new THREE.MeshStandardMaterial({ color: basePairColors[i % 4] });
        const dist = node1.position.distanceTo(node2.position);
        const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, dist, 6), pairMat);
        rung.position.lerpVectors(node1.position, node2.position, 0.5);
        rung.lookAt(node2.position);
        rung.rotateX(Math.PI / 2);
        rung.name = `base_pair_${i}`;
        helixGroup.add(rung);
      }
    }

    group.add(helixGroup);
    group.userData.animationData = { type: 'rotate', rate: 0.3, axis: 'y' };
    return group;
  }

  _generateLung(level) {
    const group = new THREE.Group();
    const detail = { BEGINNER: 0.3, INTERMEDIATE: 0.6, ADVANCED: 0.85, EXPERT: 1.0 }[level] || 0.6;

    const lungMat = this._mat('organicPink');
    lungMat.color.setHex(0xffaaaa);

    // Left lung
    const leftLung = new THREE.Mesh(new THREE.SphereGeometry(0.4, 24, 24), lungMat);
    leftLung.scale.set(0.7, 1.0, 0.6);
    leftLung.position.set(-0.35, 0, 0);
    leftLung.name = 'left_lung';

    // Right lung (slightly larger)
    const rightLung = new THREE.Mesh(new THREE.SphereGeometry(0.45, 24, 24), lungMat.clone());
    rightLung.scale.set(0.75, 1.0, 0.6);
    rightLung.position.set(0.35, 0, 0);
    rightLung.name = 'right_lung';

    const outerGroup = new THREE.Group();
    outerGroup.name = 'structure_outer';
    outerGroup.add(leftLung, rightLung);

    // Trachea & bronchi
    const tracheaPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.8, 0),
      new THREE.Vector3(0, 0.4, 0),
    ]);
    const trachea = new THREE.Mesh(
      new THREE.TubeGeometry(tracheaPath, 8, 0.05, 8, false),
      this._mat('tissue')
    );
    trachea.name = 'trachea';
    outerGroup.add(trachea);

    if (detail > 0.4) {
      // Bronchi branches
      [[-0.35, 0.15, 0], [0.35, 0.15, 0]].forEach(([x, y, z], i) => {
        const path = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0.4, 0),
          new THREE.Vector3(x * 0.5, y + 0.1, z),
          new THREE.Vector3(x, y, z),
        ]);
        const bronchus = new THREE.Mesh(
          new THREE.TubeGeometry(path, 8, 0.03, 8, false),
          this._mat('tissue')
        );
        bronchus.name = `bronchus_${i === 0 ? 'left' : 'right'}`;
        outerGroup.add(bronchus);
      });
    }

    group.add(outerGroup);

    // Alveoli - advanced+
    if (detail > 0.7) {
      const alveoliGroup = new THREE.Group();
      alveoliGroup.name = 'function_alveoli';
      const alvMat = new THREE.MeshStandardMaterial({ color: 0xffdddd, transparent: true, opacity: 0.5 });
      for (let i = 0; i < 25; i++) {
        const side = i < 12 ? -0.35 : 0.35;
        const alv = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), alvMat);
        alv.position.set(
          side + (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.6,
          (Math.random() - 0.5) * 0.3
        );
        alveoliGroup.add(alv);
      }
      group.add(alveoliGroup);
    }

    group.userData.animationData = { type: 'breathe', rate: 0.4, amplitude: 0.08 };
    return group;
  }

  _generateEye(level) {
    const group = new THREE.Group();
    const detail = { BEGINNER: 0.3, INTERMEDIATE: 0.6, ADVANCED: 0.85, EXPERT: 1.0 }[level] || 0.6;

    // Eyeball (sclera)
    const sclera = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    );
    sclera.name = 'sclera';
    const outerGroup = new THREE.Group();
    outerGroup.name = 'structure_outer';
    outerGroup.add(sclera);

    // Iris
    const iris = new THREE.Mesh(
      new THREE.CircleGeometry(0.18, 32),
      new THREE.MeshStandardMaterial({ color: 0x336699, side: THREE.DoubleSide })
    );
    iris.position.set(0, 0, 0.49);
    iris.name = 'iris';
    outerGroup.add(iris);

    // Pupil
    const pupil = new THREE.Mesh(
      new THREE.CircleGeometry(0.08, 32),
      new THREE.MeshStandardMaterial({ color: 0x111111, side: THREE.DoubleSide })
    );
    pupil.position.set(0, 0, 0.495);
    pupil.name = 'pupil';
    outerGroup.add(pupil);

    // Cornea (transparent dome)
    if (detail > 0.4) {
      const cornea = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 24, 24, 0, Math.PI * 2, 0, Math.PI / 3),
        this._mat('glass')
      );
      cornea.position.set(0, 0, 0.35);
      cornea.name = 'cornea';
      outerGroup.add(cornea);
    }

    group.add(outerGroup);

    // Lens - intermediate+
    if (detail > 0.5) {
      const lensGroup = new THREE.Group();
      lensGroup.name = 'function_lens';
      const lens = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xddddff, transparent: true, opacity: 0.4 })
      );
      lens.scale.set(1, 1, 0.5);
      lens.position.set(0, 0, 0.28);
      lens.name = 'lens';
      lensGroup.add(lens);
      group.add(lensGroup);
    }

    // Retina layer - advanced+
    if (detail > 0.7) {
      const retina = new THREE.Mesh(
        new THREE.SphereGeometry(0.48, 24, 24, Math.PI * 0.6, Math.PI * 1.4),
        new THREE.MeshStandardMaterial({ color: 0xcc6644, side: THREE.BackSide })
      );
      retina.name = 'retina';
      const retinaGroup = new THREE.Group();
      retinaGroup.name = 'function_retina';
      retinaGroup.add(retina);
      group.add(retinaGroup);
    }

    group.userData.animationData = { type: 'none' };
    return group;
  }

  _generateMicroorganism(level) {
    const group = new THREE.Group();
    const detail = { BEGINNER: 0.3, INTERMEDIATE: 0.6, ADVANCED: 0.85, EXPERT: 1.0 }[level] || 0.6;

    // Cell body (elongated capsule)
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.2, 0.6, 16, 16),
      this._mat('cellMembrane')
    );
    body.rotation.z = Math.PI / 2;
    body.name = 'cell_body';
    const outerGroup = new THREE.Group();
    outerGroup.name = 'structure_outer';
    outerGroup.add(body);

    // Flagellum
    if (detail > 0.3) {
      const flagPoints = [];
      for (let i = 0; i < 20; i++) {
        const t = i / 20;
        flagPoints.push(new THREE.Vector3(0.5 + t * 0.8, Math.sin(t * Math.PI * 4) * 0.05, Math.cos(t * Math.PI * 4) * 0.05));
      }
      const flagCurve = new THREE.CatmullRomCurve3(flagPoints);
      const flagellum = new THREE.Mesh(
        new THREE.TubeGeometry(flagCurve, 20, 0.008, 6, false),
        new THREE.MeshStandardMaterial({ color: 0x66aa88 })
      );
      flagellum.name = 'flagellum';
      outerGroup.add(flagellum);
    }

    group.add(outerGroup);
    group.userData.animationData = { type: 'wiggle', rate: 1.0, amplitude: 0.05 };
    return group;
  }

  // ========== ENGINEERING GENERATORS ==========

  _generateMotor(level) {
    const group = new THREE.Group();
    const detail = { BEGINNER: 0.3, INTERMEDIATE: 0.6, ADVANCED: 0.85, EXPERT: 1.0 }[level] || 0.6;
    const segments = Math.floor(16 + detail * 16);

    // Housing (outer cylinder)
    const housing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 0.8, segments),
      this._mat('metalDark')
    );
    housing.rotation.x = Math.PI / 2;
    housing.name = 'housing';
    const outerGroup = new THREE.Group();
    outerGroup.name = 'structure_outer';
    outerGroup.add(housing);

    // End caps
    const capGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.05, segments);
    const capMat = this._mat('metal');
    const frontCap = new THREE.Mesh(capGeo, capMat);
    frontCap.rotation.x = Math.PI / 2;
    frontCap.position.z = 0.42;
    frontCap.name = 'front_cap';
    outerGroup.add(frontCap);

    const rearCap = new THREE.Mesh(capGeo, capMat.clone());
    rearCap.rotation.x = Math.PI / 2;
    rearCap.position.z = -0.42;
    rearCap.name = 'rear_cap';
    outerGroup.add(rearCap);
    group.add(outerGroup);

    // Shaft
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 1.4, segments),
      this._mat('metal')
    );
    shaft.rotation.x = Math.PI / 2;
    shaft.name = 'shaft';
    const shaftGroup = new THREE.Group();
    shaftGroup.name = 'function_shaft';
    shaftGroup.add(shaft);
    group.add(shaftGroup);

    // Rotor / Armature coils - intermediate+
    if (detail > 0.4) {
      const rotorGroup = new THREE.Group();
      rotorGroup.name = 'function_rotor';

      // Rotor core
      const rotorCore = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 0.6, segments),
        this._mat('metalDark')
      );
      rotorCore.rotation.x = Math.PI / 2;
      rotorCore.name = 'rotor_core';
      rotorGroup.add(rotorCore);

      // Coils (copper wire wrappings)
      if (detail > 0.5) {
        const coilMat = this._mat('copper');
        for (let i = 0; i < 3; i++) {
          const angle = (i / 3) * Math.PI * 2;
          const coil = new THREE.Mesh(
            new THREE.TorusGeometry(0.18, 0.025, 8, 12),
            coilMat
          );
          coil.position.set(Math.cos(angle) * 0.02, Math.sin(angle) * 0.02, 0);
          coil.rotation.y = angle;
          coil.name = `coil_${i}`;
          rotorGroup.add(coil);
        }
      }

      group.add(rotorGroup);
    }

    // Stator magnets - advanced+
    if (detail > 0.6) {
      const statorGroup = new THREE.Group();
      statorGroup.name = 'interaction_stator';
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const magnet = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.3, 0.5),
          new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? 0xcc2222 : 0x2222cc })
        );
        magnet.position.set(Math.cos(angle) * 0.38, Math.sin(angle) * 0.38, 0);
        magnet.rotation.z = angle;
        magnet.name = `stator_magnet_${i}`;
        statorGroup.add(magnet);
      }
      group.add(statorGroup);
    }

    // Magnetic field lines - expert
    if (detail > 0.85) {
      const fieldGroup = new THREE.Group();
      fieldGroup.name = 'behavior_field';
      const fieldMat = new THREE.MeshStandardMaterial({ color: 0x44aaff, emissive: 0x2266ff, emissiveIntensity: 0.8, transparent: true, opacity: 0.4 });
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const pts = [];
        for (let j = 0; j < 10; j++) {
          const t = j / 9;
          const r = 0.25 + Math.sin(t * Math.PI) * 0.2;
          pts.push(new THREE.Vector3(Math.cos(angle) * r, Math.sin(angle) * r, (t - 0.5) * 0.6));
        }
        const curve = new THREE.CatmullRomCurve3(pts);
        const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 10, 0.005, 4, false), fieldMat);
        tube.name = `field_line_${i}`;
        fieldGroup.add(tube);
      }
      group.add(fieldGroup);
    }

    // Commutator & brushes - expert
    if (detail > 0.85) {
      const commGroup = new THREE.Group();
      commGroup.name = 'function_commutator';
      const comm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.1, segments),
        this._mat('copper')
      );
      comm.rotation.x = Math.PI / 2;
      comm.position.z = -0.35;
      comm.name = 'commutator';
      commGroup.add(comm);

      // Brushes
      for (let i = 0; i < 2; i++) {
        const brush = new THREE.Mesh(
          new THREE.BoxGeometry(0.04, 0.08, 0.04),
          new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        brush.position.set(i === 0 ? 0.1 : -0.1, 0, -0.35);
        brush.name = `brush_${i}`;
        commGroup.add(brush);
      }
      group.add(commGroup);
    }

    group.userData.animationData = { type: 'rotate', rate: 2.0, axis: 'z', groups: ['function_rotor', 'function_shaft'] };
    return group;
  }

  _generateCircuit(level) {
    const group = new THREE.Group();
    const detail = { BEGINNER: 0.3, INTERMEDIATE: 0.6, ADVANCED: 0.85, EXPERT: 1.0 }[level] || 0.6;

    // PCB board
    const pcb = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.04, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x116633, roughness: 0.6 })
    );
    pcb.name = 'pcb_board';
    const outerGroup = new THREE.Group();
    outerGroup.name = 'structure_outer';
    outerGroup.add(pcb);
    group.add(outerGroup);

    // Components
    const compGroup = new THREE.Group();
    compGroup.name = 'function_components';

    // Resistors
    const resistorPositions = [[-0.4, 0.06, -0.2], [0.2, 0.06, 0.1], [0.5, 0.06, -0.3]];
    resistorPositions.forEach(([x, y, z], i) => {
      const resistor = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.12, 8),
        new THREE.MeshStandardMaterial({ color: 0xaa8844 })
      );
      resistor.position.set(x, y, z);
      resistor.rotation.z = Math.PI / 2;
      resistor.name = `resistor_${i}`;
      compGroup.add(resistor);

      // Color bands
      if (detail > 0.4) {
        const colors = [0xff0000, 0x0000ff, 0xffaa00];
        colors.forEach((c, bi) => {
          const band = new THREE.Mesh(
            new THREE.CylinderGeometry(0.032, 0.032, 0.008, 8),
            new THREE.MeshStandardMaterial({ color: c })
          );
          band.position.set(x + (bi - 1) * 0.025, y, z);
          band.rotation.z = Math.PI / 2;
          compGroup.add(band);
        });
      }
    });

    // Capacitors
    if (detail > 0.3) {
      [[-0.1, 0.08, 0.25], [0.35, 0.08, -0.1]].forEach(([x, y, z], i) => {
        const cap = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 0.08, 12),
          new THREE.MeshStandardMaterial({ color: 0x2244aa })
        );
        cap.position.set(x, y, z);
        cap.name = `capacitor_${i}`;
        compGroup.add(cap);
      });
    }

    // IC chip
    if (detail > 0.5) {
      const ic = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.03, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
      );
      ic.position.set(0, 0.05, 0);
      ic.name = 'ic_chip';
      compGroup.add(ic);

      // IC pins
      for (let i = 0; i < 8; i++) {
        const pin = new THREE.Mesh(
          new THREE.BoxGeometry(0.005, 0.02, 0.015),
          this._mat('metal')
        );
        pin.position.set(-0.06 + i * 0.017, 0.04, i < 4 ? 0.05 : -0.05);
        compGroup.add(pin);
      }
    }

    group.add(compGroup);

    // Traces (wire paths on PCB)
    if (detail > 0.4) {
      const traceGroup = new THREE.Group();
      traceGroup.name = 'interaction_traces';
      const traceMat = new THREE.MeshStandardMaterial({ color: 0xccaa44, metalness: 0.8 });
      const traceRoutes = [
        [[-0.5, 0.025, -0.2], [-0.1, 0.025, -0.2], [-0.1, 0.025, 0]],
        [[0, 0.025, 0], [0.2, 0.025, 0], [0.2, 0.025, 0.1]],
        [[0.35, 0.025, -0.1], [0.5, 0.025, -0.1], [0.5, 0.025, -0.3]],
      ];
      traceRoutes.forEach((route, i) => {
        const pts = route.map(p => new THREE.Vector3(...p));
        const curve = new THREE.CatmullRomCurve3(pts);
        const trace = new THREE.Mesh(new THREE.TubeGeometry(curve, 8, 0.004, 4, false), traceMat);
        trace.name = `trace_${i}`;
        traceGroup.add(trace);
      });
      group.add(traceGroup);
    }

    // Current flow particles - expert
    if (detail > 0.85) {
      const flowGroup = new THREE.Group();
      flowGroup.name = 'behavior_current';
      const particleMat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffaa00, emissiveIntensity: 1.0 });
      for (let i = 0; i < 15; i++) {
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.008, 4, 4), particleMat);
        p.position.set((Math.random() - 0.5) * 1.2, 0.03, (Math.random() - 0.5) * 0.8);
        p.userData.flowSpeed = 0.01 + Math.random() * 0.02;
        flowGroup.add(p);
      }
      group.add(flowGroup);
    }

    group.userData.animationData = { type: 'currentFlow', rate: 1.0, flowGroups: ['behavior_current'] };
    return group;
  }

  _generateGear(level) {
    const group = new THREE.Group();
    const detail = { BEGINNER: 0.3, INTERMEDIATE: 0.6, ADVANCED: 0.85, EXPERT: 1.0 }[level] || 0.6;
    const teeth = Math.floor(12 + detail * 12);

    // Create gear shape using extrusion
    const gearShape = new THREE.Shape();
    const innerR = 0.35;
    const outerR = 0.5;
    const toothHeight = 0.08;

    for (let i = 0; i < teeth; i++) {
      const a1 = (i / teeth) * Math.PI * 2;
      const a2 = ((i + 0.3) / teeth) * Math.PI * 2;
      const a3 = ((i + 0.5) / teeth) * Math.PI * 2;
      const a4 = ((i + 0.8) / teeth) * Math.PI * 2;

      const r1 = outerR;
      const r2 = outerR + toothHeight;

      if (i === 0) gearShape.moveTo(Math.cos(a1) * r1, Math.sin(a1) * r1);
      gearShape.lineTo(Math.cos(a2) * r2, Math.sin(a2) * r2);
      gearShape.lineTo(Math.cos(a3) * r2, Math.sin(a3) * r2);
      gearShape.lineTo(Math.cos(a4) * r1, Math.sin(a4) * r1);
    }

    const extrudeSettings = { depth: 0.1, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.005 };
    const gearMesh = new THREE.Mesh(
      new THREE.ExtrudeGeometry(gearShape, extrudeSettings),
      this._mat('metal')
    );
    gearMesh.position.z = -0.05;
    gearMesh.name = 'gear_body';

    const outerGroup = new THREE.Group();
    outerGroup.name = 'structure_outer';
    outerGroup.add(gearMesh);

    // Center hole
    const axle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.15, 16),
      this._mat('metalDark')
    );
    axle.rotation.x = Math.PI / 2;
    axle.name = 'axle';
    outerGroup.add(axle);

    group.add(outerGroup);

    // Second gear (meshed) - intermediate+
    if (detail > 0.5) {
      const gear2Group = new THREE.Group();
      gear2Group.name = 'interaction_meshed_gear';
      const gear2 = gearMesh.clone();
      gear2.scale.set(0.6, 0.6, 1);
      gear2.position.set(0.75, 0.3, -0.05);
      gear2.name = 'gear2_body';
      gear2Group.add(gear2);
      group.add(gear2Group);
    }

    group.userData.animationData = { type: 'rotate', rate: 1.0, axis: 'z' };
    return group;
  }

  _generateTurbine(level) {
    const group = new THREE.Group();
    const detail = { BEGINNER: 0.3, INTERMEDIATE: 0.6, ADVANCED: 0.85, EXPERT: 1.0 }[level] || 0.6;

    // Hub
    const hub = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 16, 16),
      this._mat('metal')
    );
    hub.name = 'hub';
    const outerGroup = new THREE.Group();
    outerGroup.name = 'structure_outer';
    outerGroup.add(hub);

    // Blades
    const bladeCount = Math.floor(4 + detail * 6);
    for (let i = 0; i < bladeCount; i++) {
      const angle = (i / bladeCount) * Math.PI * 2;
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.02, 0.12),
        this._mat('metalDark')
      );
      blade.position.set(Math.cos(angle) * 0.35, 0, Math.sin(angle) * 0.35);
      blade.rotation.y = angle;
      blade.rotation.x = 0.3;
      blade.name = `blade_${i}`;
      outerGroup.add(blade);
    }

    // Shaft
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8),
      this._mat('metal')
    );
    shaft.rotation.x = Math.PI / 2;
    shaft.position.z = -0.3;
    shaft.name = 'shaft';
    outerGroup.add(shaft);

    group.add(outerGroup);
    group.userData.animationData = { type: 'rotate', rate: 3.0, axis: 'z' };
    return group;
  }

  _generatePiston(level) {
    const group = new THREE.Group();
    const detail = { BEGINNER: 0.3, INTERMEDIATE: 0.6, ADVANCED: 0.85, EXPERT: 1.0 }[level] || 0.6;

    // Cylinder block
    const cylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.8, 24, 1, true),
      this._mat('metalDark')
    );
    cylinder.name = 'cylinder_block';
    const outerGroup = new THREE.Group();
    outerGroup.name = 'structure_outer';
    outerGroup.add(cylinder);

    // Piston head
    const pistonHead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.28, 0.1, 24),
      this._mat('metal')
    );
    pistonHead.position.y = 0.0;
    pistonHead.name = 'piston_head';
    const pistonGroup = new THREE.Group();
    pistonGroup.name = 'function_piston';
    pistonGroup.add(pistonHead);

    // Connecting rod
    if (detail > 0.4) {
      const rod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8),
        this._mat('metal')
      );
      rod.position.y = -0.3;
      rod.name = 'connecting_rod';
      pistonGroup.add(rod);
    }

    group.add(pistonGroup);
    group.add(outerGroup);

    group.userData.animationData = { type: 'reciprocate', rate: 2.0, axis: 'y', amplitude: 0.2, groups: ['function_piston'] };
    return group;
  }

  _generateTransformer(level) {
    const group = new THREE.Group();
    const detail = { BEGINNER: 0.3, INTERMEDIATE: 0.6, ADVANCED: 0.85, EXPERT: 1.0 }[level] || 0.6;

    // Iron core (E-shape)
    const coreMat = this._mat('metalDark');
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.3), coreMat);
    topBar.position.y = 0.3;
    const botBar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.3), coreMat.clone());
    botBar.position.y = -0.3;
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.52, 0.3), coreMat.clone());
    leftLeg.position.x = -0.36;
    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.52, 0.3), coreMat.clone());
    rightLeg.position.x = 0.36;
    const centerLeg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.52, 0.3), coreMat.clone());

    const coreGroup = new THREE.Group();
    coreGroup.name = 'structure_outer';
    [topBar, botBar, leftLeg, rightLeg, centerLeg].forEach(m => { m.name = 'iron_core'; coreGroup.add(m); });
    group.add(coreGroup);

    // Primary winding (left)
    if (detail > 0.3) {
      const windingGroup = new THREE.Group();
      windingGroup.name = 'function_windings';
      const coilMat = this._mat('copper');
      for (let i = 0; i < 8; i++) {
        const coil = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.015, 6, 12), coilMat);
        coil.position.set(-0.2, -0.2 + i * 0.05, 0);
        coil.rotation.y = Math.PI / 2;
        coil.name = `primary_coil_${i}`;
        windingGroup.add(coil);
      }
      // Secondary winding (right, fewer turns)
      for (let i = 0; i < 4; i++) {
        const coil = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 6, 12), this._mat('wire'));
        coil.position.set(0.2, -0.1 + i * 0.07, 0);
        coil.rotation.y = Math.PI / 2;
        coil.name = `secondary_coil_${i}`;
        windingGroup.add(coil);
      }
      group.add(windingGroup);
    }

    group.userData.animationData = { type: 'glow', rate: 0.8, groups: ['function_windings'] };
    return group;
  }

  _generatePulley(level) {
    const group = new THREE.Group();
    const detail = { BEGINNER: 0.3, INTERMEDIATE: 0.6, ADVANCED: 0.85, EXPERT: 1.0 }[level] || 0.6;

    // Wheel
    const wheel = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.05, 12, 32),
      this._mat('metal')
    );
    wheel.name = 'wheel';
    const outerGroup = new THREE.Group();
    outerGroup.name = 'structure_outer';
    outerGroup.add(wheel);

    // Axle
    const axle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.15, 12),
      this._mat('metalDark')
    );
    axle.rotation.x = Math.PI / 2;
    axle.name = 'axle';
    outerGroup.add(axle);
    group.add(outerGroup);

    // Rope
    if (detail > 0.3) {
      const ropePath = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.3, 0.5, 0),
        new THREE.Vector3(-0.3, 0.0, 0),
        new THREE.Vector3(0, -0.3, 0),
        new THREE.Vector3(0.3, 0.0, 0),
        new THREE.Vector3(0.3, -0.8, 0),
      ]);
      const rope = new THREE.Mesh(
        new THREE.TubeGeometry(ropePath, 20, 0.015, 6, false),
        new THREE.MeshStandardMaterial({ color: 0x886644, roughness: 0.95 })
      );
      rope.name = 'rope';
      const ropeGroup = new THREE.Group();
      ropeGroup.name = 'function_rope';
      ropeGroup.add(rope);
      group.add(ropeGroup);
    }

    group.userData.animationData = { type: 'rotate', rate: 1.5, axis: 'z' };
    return group;
  }

  _generateMachine(level) {
    // Compound machine (gears + levers)
    const group = new THREE.Group();
    const gearModel = this._generateGear(level);
    gearModel.position.set(-0.3, 0, 0);
    group.add(gearModel);

    const pistonModel = this._generatePiston(level);
    pistonModel.position.set(0.5, 0, 0);
    pistonModel.scale.set(0.6, 0.6, 0.6);
    group.add(pistonModel);

    group.userData.animationData = { type: 'compound', rate: 1.0 };
    return group;
  }

  // ========== CHEMISTRY GENERATORS ==========

  _generateAtom(level) {
    const group = new THREE.Group();
    const detail = { BEGINNER: 0.3, INTERMEDIATE: 0.6, ADVANCED: 0.85, EXPERT: 1.0 }[level] || 0.6;

    // Nucleus
    const nucleusGroup = new THREE.Group();
    nucleusGroup.name = 'structure_outer';

    const protonMat = new THREE.MeshStandardMaterial({ color: 0xff4444, emissive: 0x440000 });
    const neutronMat = new THREE.MeshStandardMaterial({ color: 0x4444ff, emissive: 0x000044 });

    const protonCount = 3 + Math.floor(detail * 5);
    const neutronCount = protonCount;

    for (let i = 0; i < protonCount; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), protonMat);
      const phi = Math.acos(1 - 2 * (i + 0.5) / protonCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      p.position.set(
        Math.sin(phi) * Math.cos(theta) * 0.12,
        Math.sin(phi) * Math.sin(theta) * 0.12,
        Math.cos(phi) * 0.12
      );
      p.name = `proton_${i}`;
      nucleusGroup.add(p);
    }

    for (let i = 0; i < neutronCount; i++) {
      const n = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), neutronMat);
      const phi = Math.acos(1 - 2 * (i + 0.5) / neutronCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i + 0.5;
      n.position.set(
        Math.sin(phi) * Math.cos(theta) * 0.14,
        Math.sin(phi) * Math.sin(theta) * 0.14,
        Math.cos(phi) * 0.14
      );
      n.name = `neutron_${i}`;
      nucleusGroup.add(n);
    }
    group.add(nucleusGroup);

    // Electron orbits
    const electronGroup = new THREE.Group();
    electronGroup.name = 'function_electrons';
    const orbitCount = Math.max(1, Math.floor(detail * 3));
    const electronMat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffaa00, emissiveIntensity: 0.8 });

    for (let i = 0; i < orbitCount; i++) {
      const orbitR = 0.3 + i * 0.18;

      // Orbit ring (visual guide)
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(orbitR, 0.003, 6, 64),
        new THREE.MeshStandardMaterial({ color: 0x888888, transparent: true, opacity: 0.3 })
      );
      ring.rotation.x = Math.PI / 2 + i * 0.5;
      ring.rotation.y = i * 0.8;
      ring.name = `orbit_ring_${i}`;
      electronGroup.add(ring);

      // Electrons
      const ePerOrbit = (i + 1) * 2;
      for (let j = 0; j < ePerOrbit; j++) {
        const electron = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), electronMat);
        electron.userData.orbitRadius = orbitR;
        electron.userData.orbitAngle = (j / ePerOrbit) * Math.PI * 2;
        electron.userData.orbitSpeed = 1.5 / (i + 1);
        electron.userData.orbitTiltX = Math.PI / 2 + i * 0.5;
        electron.userData.orbitTiltY = i * 0.8;
        electron.name = `electron_${i}_${j}`;
        electronGroup.add(electron);
      }
    }
    group.add(electronGroup);

    group.userData.animationData = { type: 'orbit', rate: 1.0, groups: ['function_electrons'] };
    return group;
  }

  _generateMolecule(level) {
    const group = new THREE.Group();
    const detail = { BEGINNER: 0.3, INTERMEDIATE: 0.6, ADVANCED: 0.85, EXPERT: 1.0 }[level] || 0.6;

    // Water molecule structure (H2O) used as example molecule
    const atoms = [
      { pos: [0, 0, 0], color: 0xff0000, r: 0.12, name: 'oxygen' },
      { pos: [-0.25, 0.15, 0], color: 0xffffff, r: 0.08, name: 'hydrogen_1' },
      { pos: [0.25, 0.15, 0], color: 0xffffff, r: 0.08, name: 'hydrogen_2' },
    ];

    const outerGroup = new THREE.Group();
    outerGroup.name = 'structure_outer';
    atoms.forEach(({ pos, color, r, name }) => {
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(r, 16, 16),
        new THREE.MeshStandardMaterial({ color, metalness: 0.1, roughness: 0.4 })
      );
      sphere.position.set(...pos);
      sphere.name = name;
      outerGroup.add(sphere);
    });

    // Bonds
    if (detail > 0.3) {
      [[0, 1], [0, 2]].forEach(([a, b], i) => {
        const from = new THREE.Vector3(...atoms[a].pos);
        const to = new THREE.Vector3(...atoms[b].pos);
        const dist = from.distanceTo(to);
        const bond = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.02, dist, 8),
          new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.3 })
        );
        bond.position.lerpVectors(from, to, 0.5);
        bond.lookAt(to);
        bond.rotateX(Math.PI / 2);
        bond.name = `bond_${i}`;
        outerGroup.add(bond);
      });
    }

    group.add(outerGroup);

    // Electron density cloud - advanced+
    if (detail > 0.7) {
      const cloudGroup = new THREE.Group();
      cloudGroup.name = 'interaction_electron_cloud';
      const cloudMat = new THREE.MeshStandardMaterial({ color: 0x4488ff, transparent: true, opacity: 0.15 });
      const cloud = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), cloudMat);
      cloud.name = 'electron_cloud';
      cloudGroup.add(cloud);
      group.add(cloudGroup);
    }

    group.userData.animationData = { type: 'vibrate', rate: 0.5, amplitude: 0.01 };
    return group;
  }

  _generateCrystal(level) {
    const group = new THREE.Group();
    const detail = { BEGINNER: 0.3, INTERMEDIATE: 0.6, ADVANCED: 0.85, EXPERT: 1.0 }[level] || 0.6;
    const gridSize = Math.floor(2 + detail * 3);

    const outerGroup = new THREE.Group();
    outerGroup.name = 'structure_outer';
    const atomMat = new THREE.MeshStandardMaterial({ color: 0x6688cc, metalness: 0.3, roughness: 0.4 });
    const bondMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.5 });
    const spacing = 0.25;

    // Lattice nodes
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        for (let z = 0; z < gridSize; z++) {
          const atom = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), atomMat);
          atom.position.set(
            (x - gridSize / 2) * spacing,
            (y - gridSize / 2) * spacing,
            (z - gridSize / 2) * spacing
          );
          atom.name = `lattice_${x}_${y}_${z}`;
          outerGroup.add(atom);

          // Bonds to neighbors
          if (detail > 0.4) {
            if (x < gridSize - 1) {
              const bond = new THREE.Mesh(
                new THREE.CylinderGeometry(0.008, 0.008, spacing, 4),
                bondMat
              );
              bond.position.copy(atom.position);
              bond.position.x += spacing / 2;
              bond.rotation.z = Math.PI / 2;
              outerGroup.add(bond);
            }
            if (y < gridSize - 1) {
              const bond = new THREE.Mesh(
                new THREE.CylinderGeometry(0.008, 0.008, spacing, 4),
                bondMat
              );
              bond.position.copy(atom.position);
              bond.position.y += spacing / 2;
              outerGroup.add(bond);
            }
          }
        }
      }
    }

    group.add(outerGroup);
    group.userData.animationData = { type: 'rotate', rate: 0.3, axis: 'y' };
    return group;
  }

  _generateWaterMolecule(level) {
    return this._generateMolecule(level); // Water is the default molecule
  }

  // ========== PHYSICS GENERATORS ==========

  _generatePendulum(level) {
    const group = new THREE.Group();
    const detail = { BEGINNER: 0.3, INTERMEDIATE: 0.6, ADVANCED: 0.85, EXPERT: 1.0 }[level] || 0.6;

    // Support beam
    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.04, 0.04),
      this._mat('wood')
    );
    beam.position.y = 0.8;
    beam.name = 'support_beam';
    const outerGroup = new THREE.Group();
    outerGroup.name = 'structure_outer';
    outerGroup.add(beam);

    // Support legs
    [[-0.38, 0, 0], [0.38, 0, 0]].forEach(([x, y, z], i) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.8, 0.04), this._mat('wood'));
      leg.position.set(x, 0.4, z);
      leg.name = `support_leg_${i}`;
      outerGroup.add(leg);
    });
    group.add(outerGroup);

    // Pendulum arm + bob
    const pendulumGroup = new THREE.Group();
    pendulumGroup.name = 'function_pendulum';

    const string = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, 0.6, 6),
      new THREE.MeshStandardMaterial({ color: 0x887766 })
    );
    string.position.y = 0.5;
    string.name = 'string';
    pendulumGroup.add(string);

    const bob = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 16, 16),
      this._mat('metal')
    );
    bob.position.y = 0.2;
    bob.name = 'bob';
    pendulumGroup.add(bob);

    pendulumGroup.position.y = 0;
    group.add(pendulumGroup);

    group.userData.animationData = { type: 'pendulum', rate: 1.0, amplitude: 0.5, pivot: [0, 0.8, 0] };
    return group;
  }

  _generateLens(level) {
    const group = new THREE.Group();
    const detail = { BEGINNER: 0.3, INTERMEDIATE: 0.6, ADVANCED: 0.85, EXPERT: 1.0 }[level] || 0.6;

    // Convex lens shape
    const lensGeo = new THREE.SphereGeometry(0.5, 32, 32);
    lensGeo.scale(1, 1, 0.15);
    const lens = new THREE.Mesh(lensGeo, this._mat('glass'));
    lens.name = 'lens_body';
    const outerGroup = new THREE.Group();
    outerGroup.name = 'structure_outer';
    outerGroup.add(lens);
    group.add(outerGroup);

    // Light rays
    if (detail > 0.4) {
      const rayGroup = new THREE.Group();
      rayGroup.name = 'function_rays';
      const rayMat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffaa00, emissiveIntensity: 1.0, transparent: true, opacity: 0.6 });

      const rayOffsets = [-0.2, 0, 0.2];
      rayOffsets.forEach((offset, i) => {
        // Incoming ray
        const inPts = [new THREE.Vector3(-0.8, offset, 0), new THREE.Vector3(-0.05, offset, 0)];
        const inCurve = new THREE.CatmullRomCurve3(inPts);
        const inRay = new THREE.Mesh(new THREE.TubeGeometry(inCurve, 4, 0.008, 4, false), rayMat);
        inRay.name = `ray_in_${i}`;
        rayGroup.add(inRay);

        // Outgoing ray (converging to focal point)
        const outPts = [new THREE.Vector3(0.05, offset, 0), new THREE.Vector3(0.6, 0, 0)];
        const outCurve = new THREE.CatmullRomCurve3(outPts);
        const outRay = new THREE.Mesh(new THREE.TubeGeometry(outCurve, 4, 0.008, 4, false), rayMat);
        outRay.name = `ray_out_${i}`;
        rayGroup.add(outRay);
      });

      // Focal point
      const focal = new THREE.Mesh(
        new THREE.SphereGeometry(0.02, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff4400, emissiveIntensity: 2.0 })
      );
      focal.position.set(0.6, 0, 0);
      focal.name = 'focal_point';
      rayGroup.add(focal);

      group.add(rayGroup);
    }

    group.userData.animationData = { type: 'none' };
    return group;
  }

  _generateMagnet(level) {
    const group = new THREE.Group();
    const detail = { BEGINNER: 0.3, INTERMEDIATE: 0.6, ADVANCED: 0.85, EXPERT: 1.0 }[level] || 0.6;

    // U-shaped magnet
    const outerGroup = new THREE.Group();
    outerGroup.name = 'structure_outer';

    // Left arm
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.6, 0.12), new THREE.MeshStandardMaterial({ color: 0xcc0000 }));
    leftArm.position.set(-0.2, 0, 0);
    leftArm.name = 'north_pole';

    // Right arm
    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.6, 0.12), new THREE.MeshStandardMaterial({ color: 0x0000cc }));
    rightArm.position.set(0.2, 0, 0);
    rightArm.name = 'south_pole';

    // Top bridge
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.12, 0.12), new THREE.MeshStandardMaterial({ color: 0x888888 }));
    bridge.position.y = 0.35;
    bridge.name = 'bridge';

    outerGroup.add(leftArm, rightArm, bridge);
    group.add(outerGroup);

    // Field lines
    if (detail > 0.4) {
      const fieldGroup = new THREE.Group();
      fieldGroup.name = 'interaction_field';
      const fieldMat = new THREE.MeshStandardMaterial({ color: 0x44aaff, emissive: 0x2266ff, emissiveIntensity: 0.6, transparent: true, opacity: 0.4 });

      for (let i = 0; i < 6; i++) {
        const spread = i * 0.06;
        const pts = [];
        for (let j = 0; j <= 20; j++) {
          const t = j / 20;
          const x = Math.sin(t * Math.PI) * (0.15 + spread);
          const y = -0.3 + Math.cos(t * Math.PI) * (0.3 + spread * 2);
          pts.push(new THREE.Vector3(x, y, spread * 0.5));
        }
        const curve = new THREE.CatmullRomCurve3(pts);
        const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.004, 4, false), fieldMat);
        tube.name = `field_line_${i}`;
        fieldGroup.add(tube);
      }
      group.add(fieldGroup);
    }

    group.userData.animationData = { type: 'glow', rate: 0.5, groups: ['interaction_field'] };
    return group;
  }

  _generateSpring(level) {
    const group = new THREE.Group();
    const detail = { BEGINNER: 0.3, INTERMEDIATE: 0.6, ADVANCED: 0.85, EXPERT: 1.0 }[level] || 0.6;
    const coils = Math.floor(5 + detail * 10);

    // Spring helix
    const pts = [];
    for (let i = 0; i <= coils * 12; i++) {
      const t = i / (coils * 12);
      const angle = t * coils * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(angle) * 0.15, t * 1.0 - 0.5, Math.sin(angle) * 0.15));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const spring = new THREE.Mesh(
      new THREE.TubeGeometry(curve, coils * 12, 0.015, 8, false),
      this._mat('metal')
    );
    spring.name = 'spring_coil';
    const outerGroup = new THREE.Group();
    outerGroup.name = 'structure_outer';
    outerGroup.add(spring);

    // Top plate
    const topPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 16), this._mat('metalDark'));
    topPlate.position.y = 0.52;
    topPlate.name = 'top_plate';
    outerGroup.add(topPlate);

    // Bottom plate
    const bottomPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 16), this._mat('metalDark'));
    bottomPlate.position.y = -0.52;
    bottomPlate.name = 'bottom_plate';
    outerGroup.add(bottomPlate);

    group.add(outerGroup);
    group.userData.animationData = { type: 'spring', rate: 1.5, amplitude: 0.15, axis: 'y' };
    return group;
  }

  // ========== ASTRONOMY GENERATORS ==========

  _generatePlanet(level) {
    const group = new THREE.Group();
    const detail = { BEGINNER: 0.3, INTERMEDIATE: 0.6, ADVANCED: 0.85, EXPERT: 1.0 }[level] || 0.6;
    const segments = Math.floor(24 + detail * 40);

    // Planet surface with procedural texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Draw procedural earth-like texture
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.2, '#4488cc');
    grad.addColorStop(0.35, '#338844');
    grad.addColorStop(0.5, '#886622');
    grad.addColorStop(0.65, '#338844');
    grad.addColorStop(0.8, '#4488cc');
    grad.addColorStop(1.0, '#ffffff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    // Add continent-like patches
    ctx.fillStyle = '#228833';
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * 512;
      const y = 50 + Math.random() * 156;
      const rx = 20 + Math.random() * 60;
      const ry = 15 + Math.random() * 40;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    const planetMat = new THREE.MeshStandardMaterial({ map: texture, metalness: 0.0, roughness: 0.8 });
    const planet = new THREE.Mesh(new THREE.SphereGeometry(0.6, segments, segments), planetMat);
    planet.name = 'planet_surface';

    const outerGroup = new THREE.Group();
    outerGroup.name = 'structure_outer';
    outerGroup.add(planet);

    // Atmosphere
    if (detail > 0.4) {
      const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.65, segments, segments),
        new THREE.MeshStandardMaterial({ color: 0x88bbff, transparent: true, opacity: 0.15, side: THREE.DoubleSide })
      );
      atmosphere.name = 'atmosphere';
      outerGroup.add(atmosphere);
    }

    group.add(outerGroup);

    // Internal layers - advanced+
    if (detail > 0.6) {
      const layerGroup = new THREE.Group();
      layerGroup.name = 'function_internal';
      const layers = [
        { name: 'crust', r: 0.58, color: 0x886644 },
        { name: 'mantle', r: 0.45, color: 0xcc6622 },
        { name: 'outer_core', r: 0.3, color: 0xff8800 },
        { name: 'inner_core', r: 0.15, color: 0xffcc00 },
      ];
      layers.forEach(({ name, r, color }) => {
        const layer = new THREE.Mesh(
          new THREE.SphereGeometry(r, 16, 16, 0, Math.PI),
          new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
        );
        layer.rotation.y = -Math.PI / 2;
        layer.name = name;
        layerGroup.add(layer);
      });
      group.add(layerGroup);
    }

    group.userData.animationData = { type: 'rotate', rate: 0.1, axis: 'y' };
    return group;
  }

  _generateStar(level) {
    const group = new THREE.Group();
    const detail = { BEGINNER: 0.3, INTERMEDIATE: 0.6, ADVANCED: 0.85, EXPERT: 1.0 }[level] || 0.6;

    // Star body (glowing sphere)
    const starMat = new THREE.MeshStandardMaterial({
      color: 0xffcc44,
      emissive: 0xff8800,
      emissiveIntensity: 1.5,
      metalness: 0.0,
      roughness: 0.3,
    });
    const star = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), starMat);
    star.name = 'star_body';
    const outerGroup = new THREE.Group();
    outerGroup.name = 'structure_outer';
    outerGroup.add(star);

    // Corona
    if (detail > 0.3) {
      const corona = new THREE.Mesh(
        new THREE.SphereGeometry(0.65, 32, 32),
        new THREE.MeshStandardMaterial({
          color: 0xffaa00,
          emissive: 0xff6600,
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.2,
          side: THREE.DoubleSide,
        })
      );
      corona.name = 'corona';
      outerGroup.add(corona);
    }

    group.add(outerGroup);

    // Point light for glow effect
    const light = new THREE.PointLight(0xffaa44, 1.0, 5);
    light.name = 'star_light';
    group.add(light);

    group.userData.animationData = { type: 'pulse', rate: 0.3, amplitude: 0.03 };
    return group;
  }

  _generateSolarSystem(level) {
    const group = new THREE.Group();
    const detail = { BEGINNER: 0.3, INTERMEDIATE: 0.6, ADVANCED: 0.85, EXPERT: 1.0 }[level] || 0.6;

    // Sun at center
    const sun = this._generateStar(level);
    sun.scale.set(0.5, 0.5, 0.5);
    group.add(sun);

    // Planets
    const planets = [
      { name: 'mercury', dist: 0.6, size: 0.03, color: 0x888888 },
      { name: 'venus', dist: 0.8, size: 0.05, color: 0xddaa44 },
      { name: 'earth', dist: 1.1, size: 0.055, color: 0x2266cc },
      { name: 'mars', dist: 1.4, size: 0.04, color: 0xcc4422 },
    ];
    if (detail > 0.5) {
      planets.push(
        { name: 'jupiter', dist: 1.8, size: 0.12, color: 0xddaa66 },
        { name: 'saturn', dist: 2.2, size: 0.1, color: 0xccbb66 },
      );
    }

    const planetGroup = new THREE.Group();
    planetGroup.name = 'function_planets';
    planets.forEach(({ name, dist, size, color }) => {
      const planet = new THREE.Mesh(
        new THREE.SphereGeometry(size, 12, 12),
        new THREE.MeshStandardMaterial({ color, metalness: 0.0, roughness: 0.7 })
      );
      planet.position.x = dist;
      planet.name = name;
      planet.userData.orbitRadius = dist;
      planet.userData.orbitSpeed = 0.3 / dist;
      planetGroup.add(planet);

      // Orbit ring
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(dist, 0.003, 6, 64),
        new THREE.MeshStandardMaterial({ color: 0x444444, transparent: true, opacity: 0.3 })
      );
      ring.rotation.x = Math.PI / 2;
      planetGroup.add(ring);
    });

    group.add(planetGroup);
    group.userData.animationData = { type: 'orbit', rate: 1.0, groups: ['function_planets'] };
    return group;
  }

  // ========== ARCHITECTURE GENERATORS ==========

  _generateBuilding(level) {
    const group = new THREE.Group();
    const detail = { BEGINNER: 0.3, INTERMEDIATE: 0.6, ADVANCED: 0.85, EXPERT: 1.0 }[level] || 0.6;

    // Main structure
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 1.0, 0.4),
      this._mat('concrete')
    );
    body.position.y = 0.5;
    body.name = 'main_body';
    const outerGroup = new THREE.Group();
    outerGroup.name = 'structure_outer';
    outerGroup.add(body);

    // Roof
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(0.45, 0.3, 4),
      new THREE.MeshStandardMaterial({ color: 0x884422 })
    );
    roof.position.y = 1.15;
    roof.rotation.y = Math.PI / 4;
    roof.name = 'roof';
    outerGroup.add(roof);

    // Windows
    if (detail > 0.3) {
      const windowMat = new THREE.MeshStandardMaterial({ color: 0x668899, metalness: 0.3, roughness: 0.1 });
      const floors = Math.floor(2 + detail * 4);
      for (let f = 0; f < floors; f++) {
        for (let w = 0; w < 3; w++) {
          const win = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.01), windowMat);
          win.position.set(-0.15 + w * 0.15, 0.2 + f * 0.2, 0.205);
          win.name = `window_f${f}_w${w}`;
          outerGroup.add(win);
        }
      }
    }

    // Door
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.2, 0.01),
      this._mat('wood')
    );
    door.position.set(0, 0.1, 0.205);
    door.name = 'door';
    outerGroup.add(door);

    // Foundation
    const foundation = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.05, 0.5),
      this._mat('concrete')
    );
    foundation.position.y = -0.025;
    foundation.name = 'foundation';
    outerGroup.add(foundation);

    group.add(outerGroup);
    group.userData.animationData = { type: 'none' };
    return group;
  }

  _generateBridge(level) {
    const group = new THREE.Group();
    const detail = { BEGINNER: 0.3, INTERMEDIATE: 0.6, ADVANCED: 0.85, EXPERT: 1.0 }[level] || 0.6;

    // Deck
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.06, 0.5),
      this._mat('concrete')
    );
    deck.name = 'deck';
    const outerGroup = new THREE.Group();
    outerGroup.name = 'structure_outer';
    outerGroup.add(deck);

    // Support pillars
    const pillarMat = this._mat('concrete');
    [[-0.6, -0.35, 0], [0.6, -0.35, 0]].forEach(([x, y, z], i) => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.64, 0.3), pillarMat);
      pillar.position.set(x, y, z);
      pillar.name = `pillar_${i}`;
      outerGroup.add(pillar);
    });
    group.add(outerGroup);

    // Cables (suspension bridge) - intermediate+
    if (detail > 0.5) {
      const cableGroup = new THREE.Group();
      cableGroup.name = 'function_cables';
      const cableMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7 });

      // Towers
      [[-0.6, 0], [0.6, 0]].forEach(([x, z], i) => {
        const tower = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.7, 0.06), this._mat('metal'));
        tower.position.set(x, 0.35, z);
        tower.name = `tower_${i}`;
        cableGroup.add(tower);
      });

      // Main cable
      const cablePts = [];
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        const x = (t - 0.5) * 2;
        const y = 0.65 - Math.abs(x) * 0.15 + Math.pow(x, 2) * 0.15;
        cablePts.push(new THREE.Vector3(x, y, 0));
      }
      const cableCurve = new THREE.CatmullRomCurve3(cablePts);
      const cable = new THREE.Mesh(new THREE.TubeGeometry(cableCurve, 20, 0.01, 6, false), cableMat);
      cable.name = 'main_cable';
      cableGroup.add(cable);

      // Vertical suspenders
      if (detail > 0.6) {
        for (let i = 1; i < 10; i++) {
          const t = i / 10;
          const x = (t - 0.5) * 2;
          const topY = 0.65 - Math.abs(x) * 0.15 + Math.pow(x, 2) * 0.15;
          const susp = new THREE.Mesh(
            new THREE.CylinderGeometry(0.003, 0.003, topY - 0.03, 4),
            cableMat
          );
          susp.position.set(x, (topY + 0.03) / 2, 0);
          susp.name = `suspender_${i}`;
          cableGroup.add(susp);
        }
      }

      group.add(cableGroup);
    }

    group.userData.animationData = { type: 'none' };
    return group;
  }

  _generateArch(level) {
    const group = new THREE.Group();
    const detail = { BEGINNER: 0.3, INTERMEDIATE: 0.6, ADVANCED: 0.85, EXPERT: 1.0 }[level] || 0.6;

    // Arch curve
    const archPts = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const angle = t * Math.PI;
      archPts.push(new THREE.Vector3(Math.cos(angle) * 0.5, Math.sin(angle) * 0.7, 0));
    }
    const archCurve = new THREE.CatmullRomCurve3(archPts);
    const arch = new THREE.Mesh(
      new THREE.TubeGeometry(archCurve, 20, 0.06, 8, false),
      this._mat('rock')
    );
    arch.name = 'arch_structure';
    const outerGroup = new THREE.Group();
    outerGroup.name = 'structure_outer';
    outerGroup.add(arch);

    // Pillars
    [[-0.5, 0, 0], [0.5, 0, 0]].forEach(([x, y, z], i) => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.12), this._mat('rock'));
      pillar.position.set(x, -0.25, z);
      pillar.name = `pillar_${i}`;
      outerGroup.add(pillar);
    });

    group.add(outerGroup);

    // Keystone - intermediate+
    if (detail > 0.5) {
      const keystone = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.12, 0.14),
        new THREE.MeshStandardMaterial({ color: 0xaaaa88, roughness: 0.9 })
      );
      keystone.position.set(0, 0.68, 0);
      keystone.name = 'keystone';
      outerGroup.add(keystone);
    }

    group.userData.animationData = { type: 'none' };
    return group;
  }

  // ========== GENERIC FALLBACK ==========

  _generateGenericModel(concept) {
    const group = new THREE.Group();
    const outerGroup = new THREE.Group();
    outerGroup.name = 'structure_outer';

    // Create a labeled cube as placeholder
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.6, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x6688cc, metalness: 0.2, roughness: 0.5 })
    );
    cube.name = 'generic_body';
    outerGroup.add(cube);

    // Label
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(concept.toUpperCase(), 128, 42);
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.y = 0.5;
    sprite.scale.set(1.0, 0.25, 1);
    outerGroup.add(sprite);

    group.add(outerGroup);
    group.userData.animationData = { type: 'rotate', rate: 0.5, axis: 'y' };
    return group;
  }

  // ========== STATISTICS ==========

  getStats() {
    return {
      ...this.stats,
      availableConcepts: this.modelGenerators.size,
      cachedModels: this.generatedModels.size,
    };
  }

  // ========== SCCA RESEARCH DATASET MODELS ==========

  _generateAirplane(level) {
    const group = new THREE.Group();
    const bodyMat = this._mat('metal');
    const glassMat = this._mat('glass');
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });

    // Fuselage (External)
    const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.2, 16), bodyMat);
    fuselage.rotation.z = Math.PI / 2;
    fuselage.name = 'Fuselage';
    
    // Wings (External)
    const wings = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 1.4), bodyMat);
    wings.position.set(0, -0.05, 0);
    wings.name = 'Wings';
    
    // Tail
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.05), bodyMat);
    tail.position.set(-0.5, 0.15, 0);
    tail.name = 'Tail';

    const externalGroup = new THREE.Group();
    externalGroup.name = 'structure_external';
    externalGroup.add(fuselage, wings, tail);
    group.add(externalGroup);

    // Jet Engine (Internal)
    const internalGroup = new THREE.Group();
    internalGroup.name = 'function_internal';
    [-0.35, 0.35].forEach((z, i) => {
        const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.3, 16), blackMat);
        engine.rotation.z = Math.PI / 2;
        engine.position.set(-0.1, -0.1, z);
        engine.name = i === 0 ? 'Jet engine' : 'Jet engine_2';
        internalGroup.add(engine);
    });
    
    // Cockpit
    const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16, 0, Math.PI, 0, Math.PI/2), glassMat);
    cockpit.position.set(0.4, 0.1, 0);
    cockpit.rotation.z = -Math.PI / 6;
    cockpit.name = 'Cockpit';
    internalGroup.add(cockpit);
    
    group.add(internalGroup);

    group.userData.animationData = { type: 'float', rate: 1.5, amplitude: 0.1 };
    return group;
  }

  _generateAutomobile(level) {
    const group = new THREE.Group();
    const bodyMat = this._mat('metalDark');
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });

    const externalGroup = new THREE.Group();
    externalGroup.name = 'structure_external';

    // Chassis
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.2, 0.45), bodyMat);
    chassis.position.set(0, 0.1, 0);
    chassis.name = 'Chassis';
    externalGroup.add(chassis);
    
    // Top Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.4), this._mat('glass'));
    cabin.position.set(-0.1, 0.3, 0);
    externalGroup.add(cabin);

    // Tires
    [[-0.3, 0.25], [-0.3, -0.25], [0.3, 0.25], [0.3, -0.25]].forEach(([x, z], i) => {
        const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 16), blackMat);
        tire.rotation.x = Math.PI / 2;
        tire.position.set(x, 0, z);
        tire.name = `Tires_${i}`;
        externalGroup.add(tire);
    });
    group.add(externalGroup);

    // Internal Blocks
    const internalGroup = new THREE.Group();
    internalGroup.name = 'function_internal';
    const engineBlock = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.15, 0.2), this._mat('copper'));
    engineBlock.position.set(0.35, 0.1, 0);
    engineBlock.name = 'Engine block';
    
    const transmission = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8), this._mat('metal'));
    transmission.rotation.z = Math.PI / 2;
    transmission.position.set(0, 0.1, 0);
    transmission.name = 'Transmission';
    
    internalGroup.add(engineBlock, transmission);
    group.add(internalGroup);

    group.userData.animationData = { type: 'wiggle', rate: 2.0, amplitude: 0.02 };
    return group;
  }

  _generateShip(level) {
    const group = new THREE.Group();
    
    const externalGroup = new THREE.Group();
    externalGroup.name = 'structure_external';
    
    const hullMat = new THREE.MeshStandardMaterial({ color: 0x882222, roughness: 0.8 });
    const hull = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.2, 4), hullMat);
    hull.rotation.z = -Math.PI / 2;
    hull.rotation.y = Math.PI / 4;
    hull.position.set(0, 0, 0);
    hull.name = 'Hull';
    externalGroup.add(hull);
    
    const deck = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.4), this._mat('metalDark'));
    deck.position.set(-0.1, 0.15, 0);
    deck.name = 'Deck';
    externalGroup.add(deck);
    group.add(externalGroup);

    const internalGroup = new THREE.Group();
    internalGroup.name = 'function_internal';
    const dieselEngine = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.2), this._mat('metal'));
    dieselEngine.position.set(-0.2, 0.2, 0);
    dieselEngine.name = 'Diesel engine';
    
    const propeller = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8), this._mat('copper'));
    propeller.position.set(-0.6, 0, 0);
    propeller.rotation.z = Math.PI / 2;
    propeller.name = 'Propeller';
    
    internalGroup.add(dieselEngine, propeller);
    group.add(internalGroup);

    group.userData.animationData = { type: 'float', rate: 0.5, amplitude: 0.05 };
    return group;
  }
  
  _generateHeavyTruck(level) {
    const group = new THREE.Group();
    
    const externalGroup = new THREE.Group();
    externalGroup.name = 'structure_external';
    
    const cab = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.4), this._mat('plastic'));
    cab.position.set(0.6, 0.25, 0);
    cab.name = 'Cab';
    
    const trailer = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.42), this._mat('metalDark'));
    trailer.position.set(-0.2, 0.3, 0);
    trailer.name = 'Trailer';

    // Tires
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    [[-0.6, 0.25], [-0.6, -0.25], [-0.3, 0.25], [-0.3, -0.25], [0.6, 0.25], [0.6, -0.25]].forEach(([x, z], i) => {
        const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 16), blackMat);
        tire.rotation.x = Math.PI / 2;
        tire.position.set(x, 0, z);
        tire.name = `Tires_${i}`;
        externalGroup.add(tire);
    });
    
    externalGroup.add(cab, trailer);
    group.add(externalGroup);

    const internalGroup = new THREE.Group();
    internalGroup.name = 'function_internal';
    const engine = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.2), this._mat('copper'));
    engine.position.set(0.6, 0.1, 0);
    engine.name = 'Heavy engine';
    
    internalGroup.add(engine);
    group.add(internalGroup);

    group.userData.animationData = { type: 'wiggle', rate: 1.0, amplitude: 0.02 };
    return group;
  }

  clearCache() {
  }
}

// Export singleton
export const proceduralModelFactory = new ProceduralModelFactory();
window.ProceduralModelFactory = ProceduralModelFactory;
