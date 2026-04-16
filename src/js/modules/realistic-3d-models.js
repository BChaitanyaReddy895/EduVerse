// ============================================
// EduVerse — Realistic 3D Model Library v3.0
// Research-Grade Scientific Visualizations
// New models with accurate geometry & physiology
// ============================================

import * as THREE from 'three';

// =============================================
// PHYSICS MODELS — Realistic & Scientifically Accurate
// =============================================

export const PhysicsModels = {
  // Newtonian Mechanics: Pendulum with Force Vectors
  newtonianPendulum: (scene) => {
    const group = new THREE.Group();

    // Fixed pivot point (steel gray)
    const pivotGeo = new THREE.SphereGeometry(0.08, 32, 32);
    const pivotMat = new THREE.MeshStandardMaterial({ color: 0x4B5563, metalness: 0.9, roughness: 0.2 });
    const pivot = new THREE.Mesh(pivotGeo, pivotMat);
    pivot.position.y = 2.5;
    group.add(pivot);

    // Rope (realistic cylindrical string)
    const ropeGeo = new THREE.CylinderGeometry(0.01, 0.01, 2.0, 16, 16);
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.8 });
    const rope = new THREE.Mesh(ropeGeo, ropeMat);
    rope.position.y = 1.5;
    rope.castShadow = true;
    group.add(rope);

    // Pendulum mass (shiny sphere, realistic)
    const massGeo = new THREE.SphereGeometry(0.2, 64, 64);
    const massMat = new THREE.MeshPhysicalMaterial({
      color: 0xD946EF,
      metalness: 0.7,
      roughness: 0.15,
      emissive: 0x6B21A8,
      emissiveIntensity: 0.3
    });
    const mass = new THREE.Mesh(massGeo, massMat);
    mass.position.y = 0.5;
    mass.castShadow = true;
    group.add(mass);

    // Gravity force vector arrow
    const gravityArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, -1, 0),
      mass.position.clone(),
      0.8,
      0xEF4444,
      0.2,
      0.15
    );
    group.add(gravityArrow);

    // Velocity tangent vector
    const velocityArrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      mass.position.clone(),
      0.6,
      0x3B82F6,
      0.15,
      0.12
    );
    group.add(velocityArrow);

    // Grid reference plane
    const gridHelper = new THREE.GridHelper(4, 20, 0x64748B, 0x1E293B);
    gridHelper.position.y = -0.5;
    gridHelper.position.z = 0;
    group.add(gridHelper);

    // Angle arc indicator
    const arcGeo = new THREE.BufferGeometry();
    const arcPoints = [];
    for (let i = -0.5; i <= 0.5; i += 0.1) {
      arcPoints.push(new THREE.Vector3(Math.sin(i) * 0.5, 0, Math.cos(i) * 0.5));
    }
    arcGeo.setFromPoints(arcPoints);
    const arcMat = new THREE.LineBasicMaterial({ color: 0xF59E0B, linewidth: 2 });
    const arc = new THREE.Line(arcGeo, arcMat);
    arc.position.copy(pivot.position);
    group.add(arc);

    group.userData.objects = { rope, mass, gravityArrow, velocityArrow, pivot };

    scene.add(group);

    return (time) => {
      const angle = Math.sin(time * 1.5) * 0.6;
      const x = Math.sin(angle) * 2.0;
      const y = 2.5 - Math.cos(angle) * 2.0;

      mass.position.set(x, y, 0);
      rope.position.y = (2.5 + y) / 2;
      rope.rotation.z = -angle;

      gravityArrow.position.copy(mass.position);
      const velocity = Math.cos(time * 1.5) * 1.5;
      velocityArrow.position.copy(mass.position);
      velocityArrow.setDirection(new THREE.Vector3(velocity, -Math.sin(angle), 0).normalize());
    };
  },

  // Projectile Motion: Ball trajectory with parabolic arc
  projectileMotion: (scene) => {
    const group = new THREE.Group();

    // Launch platform
    const platformGeo = new THREE.BoxGeometry(0.6, 0.1, 0.4);
    const platformMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.3 });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.set(-3, 0, 0);
    platform.castShadow = true;
    group.add(platform);

    // Launch angle indicator
    const launchAngle = 45 * Math.PI / 180;
    const angleArrow = new THREE.ArrowHelper(
      new THREE.Vector3(Math.cos(launchAngle), Math.sin(launchAngle), 0),
      platform.position.clone().add(new THREE.Vector3(0.3, 0.1, 0)),
      0.8,
      0xF59E0B,
      0.15,
      0.1
    );
    group.add(angleArrow);

    // Projectile sphere
    const projectileGeo = new THREE.SphereGeometry(0.15, 32, 32);
    const projectileMat = new THREE.MeshPhysicalMaterial({
      color: 0x10B981,
      metalness: 0.8,
      roughness: 0.1,
      emissive: 0x047857,
      emissiveIntensity: 0.4
    });
    const projectile = new THREE.Mesh(projectileGeo, projectileMat);
    group.add(projectile);

    // Trajectory curve (parabolic path)
    const trajectoryPoints = [];
    for (let t = 0; t <= 2; t += 0.05) {
      const x = -3 + (t * 3);
      const y = 0.1 + (t * 2 - 0.5 * 9.81 * t * t / 4);
      trajectoryPoints.push(new THREE.Vector3(x, Math.max(y, 0), 0));
    }
    const trajectoryGeo = new THREE.BufferGeometry().setFromPoints(trajectoryPoints);
    const trajectoryMat = new THREE.LineBasicMaterial({ color: 0x06B6D4, linewidth: 3, transparent: true, opacity: 0.7 });
    const trajectory = new THREE.Line(trajectoryGeo, trajectoryMat);
    group.add(trajectory);

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(8, 0.5);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x92400E, roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.25;
    ground.receiveShadow = true;
    group.add(ground);

    // Distance marker
    const distanceGeometry = new THREE.BoxGeometry(0.05, 0.02, 4);
    const distanceMat = new THREE.MeshBasicMaterial({ color: 0xEF4444 });
    const distanceMarker = new THREE.Mesh(distanceGeometry, distanceMat);
    distanceMarker.position.set(0, 0.1, 0);
    group.add(distanceMarker);

    scene.add(group);

    return (time) => {
      const t = (time * 0.5) % 2;
      const x = -3 + (t * 3);
      const y = 0.1 + (t * 2 - 0.5 * 9.81 * t * t / 4);
      projectile.position.set(x, Math.max(y, 0.15), 0);
      projectile.rotation.set(t * 10, t * 15, t * 8);
    };
  },

  // Circular Motion: Orbiting satellite with centripetal force
  circularMotion: (scene) => {
    const group = new THREE.Group();

    // Central mass (planet)
    const centralMassGeo = new THREE.SphereGeometry(0.4, 64, 64);
    const centralMassMat = new THREE.MeshPhysicalMaterial({
      color: 0x3B82F6,
      metalness: 0.3,
      roughness: 0.6,
      emissive: 0x1E40AF,
      emissiveIntensity: 0.2
    });
    const centralMass = new THREE.Mesh(centralMassGeo, centralMassMat);
    group.add(centralMass);

    // Orbital path
    const orbitalPathGeo = new THREE.TorusGeometry(2.0, 0.02, 32, 256);
    const orbitalPathMat = new THREE.MeshBasicMaterial({ color: 0x06B6D4, transparent: true, opacity: 0.5 });
    const orbitalPath = new THREE.Mesh(orbitalPathGeo, orbitalPathMat);
    group.add(orbitalPath);

    // Satellite
    const satelliteGeo = new THREE.BoxGeometry(0.2, 0.15, 0.25);
    const satelliteMat = new THREE.MeshPhysicalMaterial({
      color: 0xF59E0B,
      metalness: 0.7,
      roughness: 0.2,
      emissive: 0x92400E,
      emissiveIntensity: 0.3
    });
    const satellite = new THREE.Mesh(satelliteGeo, satelliteMat);
    satellite.castShadow = true;
    group.add(satellite);

    // Centripetal force arrow
    const centripetetalArrow = new THREE.ArrowHelper(
      new THREE.Vector3(-1, 0, 0),
      satellite.position.clone(),
      0.8,
      0xEF4444,
      0.2,
      0.15
    );
    group.add(centripetetalArrow);

    // Velocity vector
    const velocityArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      satellite.position.clone(),
      1.0,
      0x3B82F6,
      0.15,
      0.12
    );
    group.add(velocityArrow);

    // Solar array panels (for realism)
    const panelGeo = new THREE.PlaneGeometry(0.35, 0.15);
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x1F2937, metalness: 0.9, roughness: 0.1 });
    const panel1 = new THREE.Mesh(panelGeo, panelMat);
    panel1.position.set(0.2, 0, -0.2);
    satellite.add(panel1);
    const panel2 = new THREE.Mesh(panelGeo, panelMat);
    panel2.position.set(-0.2, 0, -0.2);
    satellite.add(panel2);

    scene.add(group);

    return (time) => {
      const angle = time * 0.8;
      const x = Math.cos(angle) * 2.0;
      const z = Math.sin(angle) * 2.0;
      satellite.position.set(x, 0, z);
      satellite.rotation.y = angle;

      centripetetalArrow.position.copy(satellite.position);
      centripetetalArrow.setDirection(new THREE.Vector3(-x, 0, -z).normalize());

      velocityArrow.position.copy(satellite.position);
      velocityArrow.setDirection(new THREE.Vector3(-z, 0, x).normalize());
    };
  }
};

// =============================================
// BIOLOGY MODELS — Realistic Cellular/Molecular
// =============================================

export const BiologyModels = {
  // Realistic Plant Cell with labeled organelles
  plantCell: (scene) => {
    const cellGroup = new THREE.Group();

    // Cell wall (outer rigid layer - cellulose)
    const wallGeo = new THREE.SphereGeometry(1.5, 64, 64);
    const wallMat = new THREE.MeshPhysicalMaterial({
      color: 0xA7F3D0,
      metalness: 0.1,
      roughness: 0.4,
      transmission: 0.3,
      opacity: 0.9
    });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    cellGroup.add(wall);

    // Cell membrane (inner phospholipid bilayer)
    const membraneGeo = new THREE.SphereGeometry(1.45, 64, 64);
    const membraneMat = new THREE.MeshBasicMaterial({ color: 0xDDD6FE, wireframe: true, transparent: true, opacity: 0.3 });
    const membrane = new THREE.Mesh(membraneGeo, membraneMat);
    cellGroup.add(membrane);

    // Vacuole (large central storage)
    const vacuoleGeo = new THREE.SphereGeometry(1.0, 64, 64);
    const vacuoleMat = new THREE.MeshPhysicalMaterial({
      color: 0x86EFAC,
      metalness: 0.05,
      roughness: 0.7,
      transmission: 0.6,
      opacity: 0.7
    });
    const vacuole = new THREE.Mesh(vacuoleGeo, vacuoleMat);
    cellGroup.add(vacuole);

    // Nucleus (control center)
    const nucleusGeo = new THREE.SphereGeometry(0.35, 48, 48);
    const nucleusMat = new THREE.MeshPhysicalMaterial({
      color: 0xA78BFA,
      metalness: 0.3,
      roughness: 0.5,
      emissive: 0x5B21B6,
      emissiveIntensity: 0.3
    });
    const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
    nucleus.position.set(0, 0.2, 0);
    cellGroup.add(nucleus);

    // Nucleolus (within nucleus)
    const nucleolusGeo = new THREE.SphereGeometry(0.12, 32, 32);
    const nucleolusMat = new THREE.MeshStandardMaterial({ color: 0x7C3AED, metalness: 0.4 });
    const nucleolus = new THREE.Mesh(nucleolusGeo, nucleolusMat);
    nucleolus.position.set(0.05, 0.25, 0.05);
    nucleus.add(nucleolus);

    // Mitochondria (elongated organelles - energy production)
    for (let i = 0; i < 5; i++) {
      const mitoGeo = new THREE.CapsuleGeometry(0.08, 0.25, 16, 16);
      const mitoMat = new THREE.MeshStandardMaterial({
        color: 0xEF4444,
        metalness: 0.5,
        roughness: 0.3,
        emissive: 0x7F1D1D,
        emissiveIntensity: 0.2
      });
      const mito = new THREE.Mesh(mitoGeo, mitoMat);
      const angle = (i / 5) * Math.PI * 2;
      mito.position.set(
        Math.cos(angle) * 0.8,
        -0.3 + (i % 2) * 0.3,
        Math.sin(angle) * 0.8
      );
      mito.rotation.set(Math.random() * Math.PI, angle, 0);
      cellGroup.add(mito);
    }

    // Chloroplasts (photosynthesis - green organelles)
    for (let i = 0; i < 8; i++) {
      const chloroGeo = new THREE.OctahedronGeometry(0.15, 2);
      const chloroMat = new THREE.MeshPhysicalMaterial({
        color: 0x10B981,
        metalness: 0.2,
        roughness: 0.5,
        emissive: 0x065F46,
        emissiveIntensity: 0.4
      });
      const chloro = new THREE.Mesh(chloroGeo, chloroMat);
      const angle = (i / 8) * Math.PI * 2;
      chloro.position.set(
        Math.cos(angle) * 1.1,
        Math.sin(angle * 2) * 0.3,
        Math.sin(angle) * 1.1
      );
      chloro.rotation.set(Math.random() * Math.PI, angle, Math.random() * Math.PI);
      cellGroup.add(chloro);
    }

    // Ribosomes (small protein synthesis units)
    for (let i = 0; i < 12; i++) {
      const riboGeo = new THREE.SphereGeometry(0.04, 16, 16);
      const riboMat = new THREE.MeshStandardMaterial({ color: 0xFCD34D, metalness: 0.7 });
      const ribo = new THREE.Mesh(riboGeo, riboMat);
      ribo.position.set(
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 1.0,
        (Math.random() - 0.5) * 1.5
      );
      cellGroup.add(ribo);
    }

    scene.add(cellGroup);

    return (time) => {
      cellGroup.rotation.y += 0.0005;
      // Subtle vacuole pulsing
      const scale = 0.98 + Math.sin(time * 2) * 0.02;
      vacuole.scale.setScalar(scale);
    };
  },

  // DNA Double Helix - scientifically accurate
  dnaHelix: (scene) => {
    const helixGroup = new THREE.Group();

    // Sugar-phosphate backbone strands
    const backboneRadius = 1.2;
    const helixPitch = 3.4; // Angstroms (one full turn)
    const turns = 8;

    const backbone1Points = [];
    const backbone2Points = [];

    for (let t = 0; t < turns * Math.PI * 2; t += 0.1) {
      const y = (t / (Math.PI * 2)) * helixPitch;
      const x = Math.cos(t) * backboneRadius;
      const z = Math.sin(t) * backboneRadius;

      backbone1Points.push(new THREE.Vector3(x, y - helixPitch * turns / 2, z));
      backbone2Points.push(new THREE.Vector3(-x, y - helixPitch * turns / 2, -z));
    }

    // Backbone strands (darker, thicker lines)
    const backbones = [
      { color: 0x3B82F6, pts: backbone1Points },
      { color: 0x06B6D4, pts: backbone2Points }
    ];

    backbones.forEach(backbone => {
      const geo = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(backbone.pts),
        100,
        0.08,
        8
      );
      const mat = new THREE.MeshStandardMaterial({
        color: backbone.color,
        metalness: 0.5,
        roughness: 0.3
      });
      const mesh = new THREE.Mesh(geo, mat);
      helixGroup.add(mesh);
    });

    // Base pairs (connecting rungs)
    for (let i = 0; i < backbone1Points.length - 1; i += 2) {
      const p1 = backbone1Points[i];
      const p2 = backbone2Points[i];
      const midpoint = p1.clone().add(p2).multiplyScalar(0.5);

      const baseGeo = new THREE.CylinderGeometry(0.04, 0.04, p1.distanceTo(p2) * 1.1, 8);
      const baseColors = [0xEF4444, 0xFCD34D, 0x10B981, 0x3B82F6];
      const baseMat = new THREE.MeshStandardMaterial({
        color: baseColors[i % 4],
        metalness: 0.6,
        roughness: 0.2
      });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.copy(midpoint);
      base.lookAt(p2);
      base.rotation.z = Math.PI / 2;
      helixGroup.add(base);
    }

    scene.add(helixGroup);

    return (time) => {
      helixGroup.rotation.y = time * 0.5;
      helixGroup.rotation.x = Math.sin(time * 0.3) * 0.1;
    };
  },

  // Protein Folding - realistic 3D structure
  proteinStructure: (scene) => {
    const proteinGroup = new THREE.Group();

    // Alpha helix (coiled secondary structure)
    const helixRadius = 0.15;
    const helixPoints = [];
    for (let t = 0; t < Math.PI * 8; t += 0.1) {
      const y = (t / (Math.PI * 2)) * 0.8;
      const x = Math.cos(t) * helixRadius;
      const z = Math.sin(t) * helixRadius;
      helixPoints.push(new THREE.Vector3(x - 0.5, y, z));
    }

    const helixGeo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(helixPoints),
      50,
      0.06,
      6
    );
    const helixMat = new THREE.MeshPhysicalMaterial({
      color: 0x8B5CF6,
      metalness: 0.4,
      roughness: 0.4,
      emissive: 0x5B21B6,
      emissiveIntensity: 0.3
    });
    const helix = new THREE.Mesh(helixGeo, helixMat);
    proteinGroup.add(helix);

    // Beta sheet (extended structure)
    const sheetPoints = [
      new THREE.Vector3(0.5, 0, 0),
      new THREE.Vector3(0.5, 0.3, 0),
      new THREE.Vector3(0.5, 0.6, 0)
    ];

    const sheetGeo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(sheetPoints),
      10,
      0.08,
      6
    );
    const sheetMat = new THREE.MeshPhysicalMaterial({
      color: 0x06B6D4,
      metalness: 0.4,
      roughness: 0.4,
      emissive: 0x0369A1,
      emissiveIntensity: 0.2
    });
    const sheet = new THREE.Mesh(sheetGeo, sheetMat);
    proteinGroup.add(sheet);

    // Random coil (disordered region)
    const coilPoints = [];
    let pos = new THREE.Vector3(0, -0.5, 0);
    for (let i = 0; i < 20; i++) {
      coilPoints.push(pos.clone());
      pos = pos.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2
      ));
    }

    const coilGeo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(coilPoints),
      40,
      0.05,
      6
    );
    const coilMat = new THREE.MeshPhysicalMaterial({
      color: 0x10B981,
      metalness: 0.3,
      roughness: 0.5
    });
    const coil = new THREE.Mesh(coilGeo, coilMat);
    proteinGroup.add(coil);

    scene.add(proteinGroup);

    return (time) => {
      proteinGroup.rotation.y = time * 0.3;
      proteinGroup.rotation.z = Math.sin(time * 0.5) * 0.1;
    };
  }
};

// =============================================
// CHEMISTRY MODELS — Realistic Molecules
// =============================================

export const ChemistryModels = {
  // Water molecule with accurate geometry
  waterMolecule: (scene) => {
    const waterGroup = new THREE.Group();

    // Oxygen nucleus (larger red sphere)
    const oxygenGeo = new THREE.SphereGeometry(0.35, 48, 48);
    const oxygenMat = new THREE.MeshPhysicalMaterial({
      color: 0xDC2626,
      metalness: 0.4,
      roughness: 0.3,
      emissive: 0x7F1D1D,
      emissiveIntensity: 0.3
    });
    const oxygen = new THREE.Mesh(oxygenGeo, oxygenMat);
    waterGroup.add(oxygen);

    // Electron cloud around oxygen (faint sphere)
    const cloudGeo = new THREE.SphereGeometry(0.6, 32, 32);
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0xDC2626,
      transparent: true,
      opacity: 0.15,
      wireframe: true
    });
    const cloud = new THREE.Mesh(cloudGeo, cloudMat);
    waterGroup.add(cloud);

    // Two hydrogen atoms (H-O-H bond angle = 104.5°)
    const bondAngle = 104.5 * Math.PI / 180;
    const bondLength = 0.96; // Angstroms (realistic O-H distance)

    const hydrogens = [];
    for (let i = 0; i < 2; i++) {
      const h1Angle = (Math.PI - bondAngle) / 2;
      const angle = h1Angle + (i * bondAngle);

      const hGeo = new THREE.SphereGeometry(0.2, 32, 32);
      const hMat = new THREE.MeshPhysicalMaterial({
        color: 0xF1F5F9,
        metalness: 0.5,
        roughness: 0.2,
        emissive: 0x94A3B8,
        emissiveIntensity: 0.2
      });
      const h = new THREE.Mesh(hGeo, hMat);
      h.position.set(
        Math.sin(angle) * bondLength,
        Math.cos(angle) * bondLength,
        0
      );
      waterGroup.add(h);
      hydrogens.push(h);

      // Covalent bond (cylinder connecting O-H)
      const bondGeo = new THREE.CylinderGeometry(0.05, 0.05, bondLength, 16);
      const bondMat = new THREE.MeshStandardMaterial({
        color: 0x64748B,
        metalness: 0.7,
        roughness: 0.2
      });
      const bond = new THREE.Mesh(bondGeo, bondMat);
      bond.position.copy(h.position.clone().multiplyScalar(0.5));
      bond.lookAt(h.position);
      bond.rotation.z = Math.PI / 2;
      waterGroup.add(bond);
    }

    // Partial charge visualization
    const positiveCloud = new THREE.Points(
      new THREE.BufferGeometry().setAttribute('position',
        new THREE.Float32BufferAttribute([
          0.2, 0.2, 0.1, -0.15, 0.15, 0.1, 0.1, -0.15, 0.1
        ], 3)
      ),
      new THREE.PointsMaterial({ color: 0x3B82F6, size: 0.03 })
    );
    positiveCloud.position.set(0, 0.1, 0);
    waterGroup.add(positiveCloud);

    scene.add(waterGroup);

    return (time) => {
      waterGroup.rotation.y = time * 0.4;
      waterGroup.rotation.x = Math.sin(time * 0.3) * 0.15;
    };
  },

  // Methane (CH4) with tetrahedral geometry
  methane: (scene) => {
    const methaneGroup = new THREE.Group();

    // Carbon center
    const carbonGeo = new THREE.SphereGeometry(0.2, 32, 32);
    const carbonMat = new THREE.MeshPhysicalMaterial({
      color: 0x1F2937,
      metalness: 0.4,
      roughness: 0.3
    });
    const carbon = new THREE.Mesh(carbonGeo, carbonMat);
    methaneGroup.add(carbon);

    // Four hydrogens in tetrahedral arrangement
    const tetracheraldPositions = [
      [1, 1, 1],
      [1, -1, -1],
      [-1, 1, -1],
      [-1, -1, 1]
    ];

    tetracheraldPositions.forEach(pos => {
      const hGeo = new THREE.SphereGeometry(0.15, 32, 32);
      const hMat = new THREE.MeshPhysicalMaterial({
        color: 0xF1F5F9,
        metalness: 0.5,
        roughness: 0.2
      });
      const h = new THREE.Mesh(hGeo, hMat);
      const norm = Math.sqrt(pos[0] * pos[0] + pos[1] * pos[1] + pos[2] * pos[2]);
      h.position.set(
        (pos[0] / norm) * 0.7,
        (pos[1] / norm) * 0.7,
        (pos[2] / norm) * 0.7
      );
      methaneGroup.add(h);

      // C-H bonds
      const bondGeo = new THREE.CylinderGeometry(0.04, 0.04, h.position.length(), 16);
      const bondMat = new THREE.MeshStandardMaterial({ color: 0x64748B, metalness: 0.6 });
      const bond = new THREE.Mesh(bondGeo, bondMat);
      bond.position.copy(h.position.clone().multiplyScalar(0.5));
      bond.lookAt(h.position);
      bond.rotation.z = Math.PI / 2;
      methaneGroup.add(bond);
    });

    scene.add(methaneGroup);

    return (time) => {
      methaneGroup.rotation.x = time * 0.3;
      methaneGroup.rotation.y = time * 0.4;
      methaneGroup.rotation.z = time * 0.2;
    };
  }
};

// =============================================
// ENGINEERING MODELS — Realistic Machines
// =============================================

export const EngineeringModels = {
  // Gear system with realistic tooth geometry
  gearSystem: (scene) => {
    const gearGroup = new THREE.Group();

    // Helper to create realistic gear
    const createGear = (radius, teeth, position, color, speed) => {
      const group = new THREE.Group();

      // Main gear body (cylinder)
      const bodyGeo = new THREE.CylinderGeometry(radius * 0.9, radius * 0.9, 0.2, 64);
      const bodyMat = new THREE.MeshStandardMaterial({
        color,
        metalness: 0.8,
        roughness: 0.1
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.castShadow = true;
      group.add(body);

      // Teeth (using boxes arranged radially)
      for (let i = 0; i < teeth; i++) {
        const angle = (i / teeth) * Math.PI * 2;
        const toothGeo = new THREE.BoxGeometry(radius * 0.2, 0.3, 0.15);
        const toothMat = new THREE.MeshStandardMaterial({
          color,
          metalness: 0.8,
          roughness: 0.15
        });
        const tooth = new THREE.Mesh(toothGeo, toothMat);
        tooth.position.set(
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        );
        tooth.rotation.z = angle;
        tooth.castShadow = true;
        group.add(tooth);
      }

      // Axle (steel shaft)
      const axleGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 32);
      const axleMat = new THREE.MeshStandardMaterial({
        color: 0x4B5563,
        metalness: 0.95,
        roughness: 0.05
      });
      const axle = new THREE.Mesh(axleGeo, axleMat);
      group.add(axle);

      group.position.copy(position);
      group.userData = { speed, rotation: 0 };
      gearGroup.add(group);

      return group;
    };

    // Create three gears meshing together
    const gear1 = createGear(0.6, 16, new THREE.Vector3(-0.8, 0, 0), 0x06B6D4, 1.0);
    const gear2 = createGear(0.4, 12, new THREE.Vector3(0.6, 0, 0), 0xF59E0B, -1.5);
    const gear3 = createGear(0.5, 14, new THREE.Vector3(0, 0.9, 0), 0xEF4444, 1.2);

    // Base platform
    const baseGeo = new THREE.BoxGeometry(3, 0.1, 2);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1F2937,
      metalness: 0.2,
      roughness: 0.6
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -0.5;
    base.receiveShadow = true;
    gearGroup.add(base);

    // Support brackets
    for (let pos of [gear1.position, gear2.position, gear3.position]) {
      const bracketGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.4, 16);
      const bracketMat = new THREE.MeshStandardMaterial({ color: 0x4B5563, metalness: 0.6 });
      const bracket = new THREE.Mesh(bracketGeo, bracketMat);
      bracket.position.copy(pos);
      bracket.position.y = -0.3;
      gearGroup.add(bracket);
    }

    scene.add(gearGroup);

    return (time) => {
      [gear1, gear2, gear3].forEach(gear => {
        gear.rotation.z += gear.userData.speed * 0.04;
      });
    };
  }
};

// =============================================
// MATH MODELS — Abstract but Educational
// =============================================

export const MathModels = {
  // 3D Parametric surface (Mobius strip)
  mobiusStrip: (scene) => {
    const stripGroup = new THREE.Group();

    // Generate Mobius strip geometry
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];

    const u_max = Math.PI * 2;
    const v_max = 1;
    const u_segments = 100;
    const v_segments = 20;

    for (let u_i = 0; u_i <= u_segments; u_i++) {
      for (let v_i = 0; v_i <= v_segments; v_i++) {
        const u = (u_i / u_segments) * u_max;
        const v = (v_i / v_segments) * v_max - 0.5;
        const r = 1 + v * Math.cos(u / 2);
        const x = r * Math.cos(u);
        const y = v * Math.sin(u / 2);
        const z = r * Math.sin(u);
        vertices.push(x, y, z);
      }
    }

    for (let u_i = 0; u_i < u_segments; u_i++) {
      for (let v_i = 0; v_i < v_segments; v_i++) {
        const a = u_i * (v_segments + 1) + v_i;
        const b = a + 1;
        const c = (u_i + 1) * (v_segments + 1) + v_i;
        const d = c + 1;
        indices.push(a, b, c);
        indices.push(b, d, c);
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
    geometry.computeVertexNormals();

    const material = new THREE.MeshPhysicalMaterial({
      color: 0x8B5CF6,
      metalness: 0.4,
      roughness: 0.4,
      emissive: 0x5B21B6,
      emissiveIntensity: 0.2,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    stripGroup.add(mesh);

    scene.add(stripGroup);

    return (time) => {
      stripGroup.rotation.x = time * 0.3;
      stripGroup.rotation.y = time * 0.5;
    };
  }
};

export default {
  PhysicsModels,
  BiologyModels,
  ChemistryModels,
  EngineeringModels,
  MathModels
};
