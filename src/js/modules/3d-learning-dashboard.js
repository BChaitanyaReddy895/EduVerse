// ============================================
// EduVerse — 3D Real-Time Learning Dashboard
// Real-time visualization of knowledge graphs,
// quiz feedback, mastery growth, & lesson paths
// ============================================

import * as THREE from 'three';
import { store } from '../utils/data-store.js';
import { showToast } from '../utils/helpers.js';

let dashboardScene = null;
let dashboardCamera = null;
let dashboardRenderer = null;
let dashboardAnimId = null;
let knowledgeGraph3D = null;
let quizParticleSystem = null;
let masteryOrganism = null;
let lessonPathwayGroup = null;

const Dashboard3D = {
  // =============================================
  // Initialize the 3D dashboard container
  // =============================================
  init(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    dashboardScene = new THREE.Scene();
    dashboardScene.fog = new THREE.FogExp2(0x0F172A, 0.008);
    dashboardScene.background = new THREE.Color(0x0F172A);

    dashboardCamera = new THREE.PerspectiveCamera(
      60,
      container.offsetWidth / container.offsetHeight,
      0.1,
      1000
    );
    dashboardCamera.position.set(15, 8, 15);
    dashboardCamera.lookAt(0, 0, 0);

    dashboardRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    dashboardRenderer.setSize(container.offsetWidth, container.offsetHeight);
    dashboardRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    dashboardRenderer.shadowMap.enabled = true;
    container.appendChild(dashboardRenderer.domElement);

    // Cinematic lighting
    const ambLight = new THREE.AmbientLight(0xffffff, 0.5);
    dashboardScene.add(ambLight);

    const ptLight = new THREE.PointLight(0x06B6D4, 15, 100);
    ptLight.position.set(20, 15, 20);
    ptLight.castShadow = true;
    dashboardScene.add(ptLight);

    const ptLight2 = new THREE.PointLight(0x7C3AED, 12, 100);
    ptLight2.position.set(-20, 10, -20);
    ptLight2.castShadow = true;
    dashboardScene.add(ptLight2);

    // Start animation loop
    this.animate();

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize(container));

    return dashboardRenderer;
  },

  // =============================================
  // FEATURE 1: Interactive 3D Knowledge Graph
  // Subject nodes as floating spheres, edges as connections
  // Mastery reflected in sphere size, color intensity
  // =============================================
  buildKnowledgeGraph() {
    if (knowledgeGraph3D) {
      dashboardScene.remove(knowledgeGraph3D);
    }

    knowledgeGraph3D = new THREE.Group();
    const graphData = store.getKnowledgeGraphData();
    const mastery = store.getAllMastery();

    // Create node meshes
    const nodeMap = {};
    const nodeGroup = new THREE.Group();

    graphData.nodes.forEach(node => {
      const masteryVal = node.mastery || 0;
      const radius = 0.3 + masteryVal * 0.5; // Size = mastery
      const intensity = 0.3 + masteryVal * 0.7; // Glow = mastery

      // Create node sphere with glow based on mastery
      const geo = new THREE.SphereGeometry(radius, 32, 32);
      const mat = new THREE.MeshPhysicalMaterial({
        color: this.getNodeColor(node.domain),
        emissive: this.getNodeColor(node.domain),
        emissiveIntensity: intensity,
        roughness: 0.3 - masteryVal * 0.2,
        metalness: 0.6 + masteryVal * 0.2
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(node.x / 100, node.y / 100, Math.random() * 2 - 1);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { ...node, radius };

      // Add label above node
      const label = this.create3DLabel(node.label, '#E0E7FF', radius * 1.5);
      label.position.copy(mesh.position);
      label.position.y += radius + 0.5;
      nodeGroup.add(label);

      // Interactive hover = expand + highlight
      mesh.addEventListener = true;
      mesh.onHover = (isHovering) => {
        mat.emissiveIntensity = isHovering ? 1.0 : intensity;
        mesh.scale.setScalar(isHovering ? 1.3 : 1.0);
      };

      nodeGroup.add(mesh);
      nodeMap[node.id] = { mesh, label };
    });

    knowledgeGraph3D.add(nodeGroup);

    // Draw edges (prerequisite connections)
    const edgeGroup = new THREE.Group();
    graphData.edges.forEach(edge => {
      const fromNode = graphData.nodes.find(n => n.id === edge.from);
      const toNode = graphData.nodes.find(n => n.id === edge.to);

      if (fromNode && toNode) {
        const points = [
          new THREE.Vector3(fromNode.x / 100, fromNode.y / 100, 0),
          new THREE.Vector3(toNode.x / 100, toNode.y / 100, 0)
        ];
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({
          color: edge.type === 'prerequisite' ? 0x7C3AED : 0x06B6D4,
          linewidth: 2,
          transparent: true,
          opacity: 0.4
        });
        const line = new THREE.Line(geo, mat);
        edgeGroup.add(line);
      }
    });

    knowledgeGraph3D.add(edgeGroup);

    // Center the graph
    const centerGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const centerMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
    const center = new THREE.Mesh(centerGeometry, centerMat);
    knowledgeGraph3D.add(center);

    dashboardScene.add(knowledgeGraph3D);
  },

  // =============================================
  // FEATURE 2: Real-Time Mastery Growth Visualization
  // Subject mastery rendered as growing 3D organisms
  // =============================================
  buildMasteryOrganisms() {
    if (masteryOrganism) {
      dashboardScene.remove(masteryOrganism);
    }

    masteryOrganism = new THREE.Group();
    const progress = store.getSubjectProgress();

    let xPos = -12;
    progress.forEach(subject => {
      const topicAnalytics = store.computeAnalytics().topicAnalytics;
      const topic = topicAnalytics.find(t => t.id === subject.id);
      const accuracy = topic?.accuracy || 0;
      const completion = topic?.completion || 0;
      const avgMastery = subject.lessons.reduce((s, l) => s + l.mastery, 0) / subject.lessons.length;

      // Create subject organism (morphing based on mastery)
      const organism = this.createMasteryOrganism(subject.id, accuracy, completion);
      organism.position.x = xPos;
      organism.position.y = 0;
      organism.position.z = 0;
      masteryOrganism.add(organism);

      // Add subject label
      const label = this.create3DLabel(subject.icon + ' ' + subject.name, '#E0E7FF', 0.8);
      label.position.set(xPos, 3.5, 0);
      masteryOrganism.add(label);

      // Add progress ring around organism (accuracy visual)
      const ringGeo = new THREE.TorusGeometry(1.8, 0.15, 32, 16);
      const ringMat = new THREE.MeshStandardMaterial({
        color: this.getAccuracyColor(accuracy),
        emissive: this.getAccuracyColor(accuracy),
        emissiveIntensity: 0.5 + (accuracy / 100) * 0.5
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(xPos, 0, 0);
      ring.userData = { accuracy, completion };
      masteryOrganism.add(ring);

      xPos += 6;
    });

    dashboardScene.add(masteryOrganism);
  },

  createMasteryOrganism(subjectId, accuracy, completion) {
    const group = new THREE.Group();
    const scale = 0.6 + (accuracy / 150); // Scale with accuracy
    const masteryLevel = accuracy / 100; // 0-1 scale

    if (subjectId === 'physics') {
      // ===== REALISTIC BOHR ATOM MODEL =====
      const nucleus = new THREE.Mesh(
        new THREE.SphereGeometry(0.2 * scale, 32, 32),
        new THREE.MeshPhysicalMaterial({
          color: 0xFF6B6B,
          emissive: 0xFF6B6B,
          emissiveIntensity: 0.4 + masteryLevel * 0.6,
          roughness: 0.1,
          metalness: 0.8
        })
      );
      nucleus.castShadow = true;
      group.add(nucleus);

      // Electron shells with probability clouds
      const shellColors = [0x06B6D4, 0x10B981, 0xF59E0B];
      for (let shell = 0; shell < 3; shell++) {
        // Shell orbit ring
        const orbitRadius = (1 + shell * 0.8) * scale;
        const orbit = new THREE.Mesh(
          new THREE.TorusGeometry(orbitRadius, 0.04, 32, 64),
          new THREE.MeshBasicMaterial({
            color: shellColors[shell],
            transparent: true,
            opacity: 0.5 + masteryLevel * 0.5
          })
        );
        group.add(orbit);

        // Probability cloud (electrons)
        const electronCount = 2 + shell * 2;
        for (let e = 0; e < electronCount; e++) {
          const angle = (e / electronCount) * Math.PI * 2;
          const electron = new THREE.Mesh(
            new THREE.SphereGeometry(0.08 * scale, 16, 16),
            new THREE.MeshPhysicalMaterial({
              color: shellColors[shell],
              emissive: shellColors[shell],
              emissiveIntensity: masteryLevel,
              metalness: 0.6
            })
          );
          const x = Math.cos(angle) * orbitRadius;
          const z = Math.sin(angle) * orbitRadius;
          electron.position.set(x, Math.sin(angle) * 0.3, z);
          electron.userData = { shellIndex: shell, angle: angle };
          group.add(electron);
        }
      }

      // Add electron probability field (wire sphere)
      const fieldGeo = new THREE.IcosahedronGeometry(3.5 * scale, 4);
      const fieldMat = new THREE.MeshBasicMaterial({
        wireframe: true,
        color: 0x64748B,
        transparent: true,
        opacity: 0.15 + masteryLevel * 0.2
      });
      const field = new THREE.Mesh(fieldGeo, fieldMat);
      group.add(field);

      group.userData.animType = 'bohrAtom';
    } else if (subjectId === 'biology') {
      // ===== REALISTIC MITOCHONDRION =====
      const outerMembraineGeo = new THREE.IcosahedronGeometry(1.0 * scale, 4);
      const membraneMat = new THREE.MeshPhysicalMaterial({
        color: 0x059669,
        transparent: true,
        opacity: 0.7 + masteryLevel * 0.3,
        metalness: 0.3,
        roughness: 0.4
      });
      const outerMembrane = new THREE.Mesh(outerMembraineGeo, membraneMat);
      group.add(outerMembrane);

      // Inner cristae (folds)
      const cristaeCount = Math.ceil(8 * masteryLevel);
      for (let i = 0; i < cristaeCount; i++) {
        const angle = (i / cristaeCount) * Math.PI * 2;
        const cristaeGeo = new THREE.PlaneGeometry(1.5 * scale, 0.6 * scale);
        const cristaeMat = new THREE.MeshPhysicalMaterial({
          color: 0x10B981,
          transparent: true,
          opacity: 0.6 + masteryLevel * 0.4,
          side: THREE.DoubleSide,
          metalness: 0.5
        });
        const cristae = new THREE.Mesh(cristaeGeo, cristaeMat);
        cristae.position.set(
          Math.cos(angle) * 0.4 * scale,
          Math.sin(angle) * 0.4 * scale,
          Math.cos(angle * 1.5) * 0.2 * scale
        );
        cristae.rotation.z = angle;
        group.add(cristae);
      }

      // ATP production indicators (glowing particles)
      const atpCount = Math.ceil(12 * masteryLevel);
      for (let i = 0; i < atpCount; i++) {
        const atpGeo = new THREE.SphereGeometry(0.06 * scale, 8, 8);
        const atpMat = new THREE.MeshBasicMaterial({
          color: 0xFCD34D,
          emissive: 0xFCD34D
        });
        const atp = new THREE.Mesh(atpGeo, atpMat);
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 0.8 * scale;
        atp.position.set(
          Math.cos(angle) * radius,
          (Math.random() - 0.5) * 0.6 * scale,
          Math.sin(angle) * radius
        );
        atp.userData = { floatPhase: Math.random() * Math.PI * 2 };
        group.add(atp);
      }

      group.userData.animType = 'mitochondrion';
    } else if (subjectId === 'chemistry') {
      // ===== REALISTIC WATER MOLECULE (H2O) WITH QUANTUM ORBITALS =====
      // Oxygen nucleus
      const oxygen = new THREE.Mesh(
        new THREE.SphereGeometry(0.3 * scale, 32, 32),
        new THREE.MeshPhysicalMaterial({
          color: 0xEF4444,
          emissive: 0xEF4444,
          emissiveIntensity: 0.3 + masteryLevel * 0.7,
          roughness: 0.1,
          metalness: 0.9
        })
      );
      oxygen.castShadow = true;
      group.add(oxygen);

      // Hydrogen nuclei (with accurate bond angle ~104.5°)
      const hydrogenPositions = [
        { x: Math.cos((104.5 * Math.PI / 180) / 2) * 0.8 * scale, z: -0.6 * scale },
        { x: -Math.cos((104.5 * Math.PI / 180) / 2) * 0.8 * scale, z: -0.6 * scale }
      ];

      hydrogenPositions.forEach((pos, idx) => {
        const hydrogen = new THREE.Mesh(
          new THREE.SphereGeometry(0.15 * scale, 16, 16),
          new THREE.MeshPhysicalMaterial({
            color: 0xF8FAFC,
            emissive: 0xF8FAFC,
            emissiveIntensity: 0.2 + masteryLevel * 0.4,
            metalness: 0.7
          })
        );
        hydrogen.position.set(pos.x, 0, pos.z);
        hydrogen.castShadow = true;
        group.add(hydrogen);

        // Covalent bonds (cylinders)
        const bondLength = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
        const bond = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08 * scale, 0.08 * scale, bondLength, 16),
          new THREE.MeshBasicMaterial({
            color: 0xFF8C00,
            opacity: 0.6 + masteryLevel * 0.4,
            transparent: true
          })
        );
        bond.position.set(pos.x / 2, 0, pos.z / 2);
        bond.rotation.z = Math.atan2(pos.z, pos.x) - Math.PI / 2;
        group.add(bond);
      });

      // Electron density cloud (orbital visualization)
      const orbitalGeo = new THREE.IcosahedronGeometry(1.2 * scale, 3);
      const orbitalMat = new THREE.MeshBasicMaterial({
        wireframe: true,
        color: 0x3B82F6,
        transparent: true,
        opacity: 0.2 + masteryLevel * 0.3
      });
      const orbital = new THREE.Mesh(orbitalGeo, orbitalMat);
      group.add(orbital);

      // Dipole moment indicator (arrow showing polarity)
      const dipoleGeo = new THREE.ConeGeometry(0.1 * scale, 0.4 * scale, 16);
      const dipoleMat = new THREE.MeshBasicMaterial({
        color: 0xEC4899,
        emissive: 0xEC4899,
        opacity: 0.6 + masteryLevel * 0.4,
        transparent: true
      });
      const dipole = new THREE.Mesh(dipoleGeo, dipoleMat);
      dipole.position.set(0, 0.5 * scale, 0);
      group.add(dipole);

      group.userData.animType = 'waterMolecule';
    } else if (subjectId === 'engineering') {
      // ===== REALISTIC MECHANICAL ASSEMBLY =====
      // Main rotor shaft
      const shaftGeo = new THREE.CylinderGeometry(0.1 * scale, 0.1 * scale, 2 * scale, 32);
      const metalMat = new THREE.MeshPhysicalMaterial({
        color: 0x6B7280,
        metalness: 0.95,
        roughness: 0.1,
        emissive: 0x374151,
        emissiveIntensity: masteryLevel * 0.3
      });
      const shaft = new THREE.Mesh(shaftGeo, metalMat);
      group.add(shaft);

      // Turbine blades (3 blades, growing with mastery)
      const bladeCount = Math.ceil(3 * masteryLevel) || 1;
      for (let b = 0; b < 3; b++) {
        if (b < bladeCount) {
          const bladeGeo = new THREE.BoxGeometry(0.8 * scale, 0.6 * scale, 0.08 * scale);
          const bladeMat = new THREE.MeshPhysicalMaterial({
            color: 0x3B82F6,
            metalness: 0.9,
            roughness: 0.2
          });
          const blade = new THREE.Mesh(bladeGeo, bladeMat);
          const angle = (b / 3) * Math.PI * 2;
          blade.position.set(
            Math.cos(angle) * 0.3 * scale,
            0,
            Math.sin(angle) * 0.3 * scale
          );
          blade.rotation.y = angle;
          blade.castShadow = true;
          group.add(blade);
        }
      }

      // Bearing assembly (rings)
      const bearing1 = new THREE.Mesh(
        new THREE.TorusGeometry(0.4 * scale, 0.05, 32, 64),
        metalMat
      );
      bearing1.position.y = 0.8 * scale;
      group.add(bearing1);

      const bearing2 = new THREE.Mesh(
        new THREE.TorusGeometry(0.4 * scale, 0.05, 32, 64),
        metalMat
      );
      bearing2.position.y = -0.8 * scale;
      group.add(bearing2);

      // Power indicator (rotating ring with glow)
      const powerRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.2 * scale, 0.08, 32, 64),
        new THREE.MeshBasicMaterial({
          color: 0x10B981,
          transparent: true,
          opacity: 0.4 + masteryLevel * 0.6
        })
      );
      powerRing.userData = { rotationSpeed: 0.5 + masteryLevel * 1.5 };
      group.add(powerRing);

      group.userData.animType = 'turbineAssembly';
    } else if (subjectId === 'math') {
      // ===== REALISTIC MATHEMATICAL SURFACE (KLEIN BOTTLE APPROXIMATION) =====
      const surfaceGeo = new THREE.BufferGeometry();
      const vertices = [];
      const indices = [];

      // Generate parametric surface
      const uResolution = 40;
      const vResolution = 40;
      for (let u = 0; u <= uResolution; u++) {
        for (let v = 0; v <= vResolution; v++) {
          const uNorm = (u / uResolution) * Math.PI * 2;
          const vNorm = (v / vResolution) * Math.PI * 2;

          // Parametric surface formula (modified torus for visual interest)
          const x = (1 + 0.5 * Math.cos(vNorm)) * Math.cos(uNorm);
          const y = (1 + 0.5 * Math.cos(vNorm)) * Math.sin(uNorm);
          const z = 0.5 * Math.sin(vNorm) + 0.3 * Math.sin(uNorm * 2);

          vertices.push(x * scale, y * scale, z * scale);

          if (u < uResolution && v < vResolution) {
            const a = u * (vResolution + 1) + v;
            const b = (u + 1) * (vResolution + 1) + v;
            const c = (u + 1) * (vResolution + 1) + (v + 1);
            const d = u * (vResolution + 1) + (v + 1);

            indices.push(a, b, d);
            indices.push(b, c, d);
          }
        }
      }

      surfaceGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
      surfaceGeo.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
      surfaceGeo.computeVertexNormals();

      const surfaceMat = new THREE.MeshPhysicalMaterial({
        color: 0x8B5CF6,
        emissive: 0x8B5CF6,
        emissiveIntensity: 0.3 + masteryLevel * 0.5,
        metalness: 0.6,
        roughness: 0.15,
        wireframe: false,
        side: THREE.DoubleSide
      });

      const surface = new THREE.Mesh(surfaceGeo, surfaceMat);
      surface.castShadow = true;
      group.add(surface);

      // Wireframe overlay
      const wireGeo = new THREE.BufferGeometry();
      wireGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
      wireGeo.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));

      const wireMat = new THREE.MeshBasicMaterial({
        wireframe: true,
        color: 0x64748B,
        transparent: true,
        opacity: 0.2 + masteryLevel * 0.2
      });
      const wireframe = new THREE.Mesh(wireGeo, wireMat);
      group.add(wireframe);

      group.userData.animType = 'mathematicalSurface';
    }

    return group;
  },

  // =============================================
  // FEATURE 3: 3D Quiz Feedback with Particle Effects
  // Instant explosion on correct answers
  // =============================================
  triggerQuizFeedback(isCorrect, accuracy) {
    if (!dashboardScene) return;

    if (isCorrect) {
      // Particle explosion at center
      const particleCount = 50;
      const particles = [];

      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount;
        const speed = 3 + Math.random() * 5;
        const phi = Math.random() * Math.PI;

        const particle = new THREE.Mesh(
          new THREE.SphereGeometry(0.1, 8, 8),
          new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(Math.random(), 0.8, 0.6),
            transparent: true
          })
        );

        particle.position.set(0, 0, 0);
        particle.userData = {
          velocity: new THREE.Vector3(
            Math.sin(phi) * Math.cos(angle) * speed,
            Math.cos(phi) * speed,
            Math.sin(phi) * Math.sin(angle) * speed
          ),
          gravity: -0.15,
          lifespan: 1.0,
          maxLifespan: 1.0
        };

        particles.push(particle);
        dashboardScene.add(particle);
      }

      // Animate particles
      const particleAnimStart = Date.now();
      const particleAnimate = () => {
        const elapsed = (Date.now() - particleAnimStart) / 1000;
        let allDead = true;

        particles.forEach(p => {
          p.userData.lifespan -= 0.016; // 60fps
          if (p.userData.lifespan > 0) {
            allDead = false;
            p.userData.velocity.y += p.userData.gravity * 0.016;
            p.position.add(p.userData.velocity.clone().multiplyScalar(0.016));
            p.material.opacity = p.userData.lifespan / p.userData.maxLifespan;
          } else {
            dashboardScene.remove(p);
          }
        });

        if (!allDead) requestAnimationFrame(particleAnimate);
      };
      particleAnimate();

      showToast('✅ Correct! +' + Math.round(accuracy) + 'pts', 'success');
    } else {
      showToast('❌ Try again!', 'warning');
    }
  },

  // =============================================
  // FEATURE 4: 3D Lesson Pathway Navigator
  // Shows lesson progress as a 3D path with status
  // =============================================
  buildLessonPathway() {
    if (lessonPathwayGroup) {
      dashboardScene.remove(lessonPathwayGroup);
    }

    lessonPathwayGroup = new THREE.Group();
    const progress = store.getSubjectProgress();

    let lessonIndex = 0;
    progress.forEach((subject, subIdx) => {
      subject.lessons.forEach((lesson, lessonIdx) => {
        const x = (lessonIndex % 6) * 3 - 7.5;
        const y = Math.floor(lessonIndex / 6) * 3;
        const z = 0;

        const masteryPct = lesson.mastery || 0;
        let statusColor, statusGlow;

        if (masteryPct >= 70) {
          statusColor = 0x10B981; // Green = completed
          statusGlow = 0.8;
        } else if (masteryPct > 0) {
          statusColor = 0xF59E0B; // Orange = in progress
          statusGlow = 0.5;
        } else {
          statusColor = 0x64748B; // Gray = locked
          statusGlow = 0.1;
        }

        // Create lesson node
        const nodeMat = new THREE.MeshPhysicalMaterial({
          color: statusColor,
          emissive: statusColor,
          emissiveIntensity: statusGlow,
          roughness: 0.3,
          metalness: 0.5
        });
        const nodeGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const node = new THREE.Mesh(nodeGeo, nodeMat);
        node.position.set(x, y, z);
        node.castShadow = true;
        node.userData = { subject: subject.name, lesson: lesson.name, mastery: masteryPct };

        lessonPathwayGroup.add(node);

        // Add lesson label
        const label = this.create3DLabel(lesson.type, '#E0E7FF', 0.3);
        label.position.set(x, y - 0.7, z);
        lessonPathwayGroup.add(label);

        lessonIndex++;
      });

      lessonIndex += 2; // Space between subjects
    });

    dashboardScene.add(lessonPathwayGroup);
  },

  // =============================================
  // Helper: Get node color by domain
  // =============================================
  getNodeColor(domain) {
    const colors = {
      math: 0x3B82F6,
      soft: 0x06B6D4,
      physics: 0x7C3AED,
      cs: 0xEF4444
    };
    return colors[domain] || 0x94A3B8;
  },

  // =============================================
  // Helper: Get color based on accuracy
  // =============================================
  getAccuracyColor(accuracy) {
    if (accuracy >= 80) return 0x10B981; // Green
    if (accuracy >= 60) return 0xF59E0B; // Orange
    return 0xEF4444; // Red
  },

  // =============================================
  // Helper: Create 3D text label
  // =============================================
  create3DLabel(text, color, size) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;

    ctx.fillStyle = color;
    ctx.font = `bold ${80 * size}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(4 * size, size, 1);
    return sprite;
  },

  // =============================================
  // Animation Loop
  // =============================================
  animate() {
    dashboardAnimId = requestAnimationFrame(() => this.animate());
    const time = Date.now() * 0.001;

    // Rotate knowledge graph
    if (knowledgeGraph3D) {
      knowledgeGraph3D.rotation.y += 0.0005;

      // Animate floating nodes
      knowledgeGraph3D.children[0]?.children.forEach((node, idx) => {
        if (node.userData?.originalY !== undefined) {
          node.position.y = node.userData.originalY + Math.sin(time + idx) * 0.3;
        }
      });
    }

    // Animate mastery organisms
    if (masteryOrganism) {
      const animType = masteryOrganism.userData.animType;

      if (animType === 'bohrAtom') {
        // Electron shell rotation
        masteryOrganism.children.forEach((child, idx) => {
          if (child.userData.shellIndex !== undefined) {
            const shellSpeed = 0.3 + child.userData.shellIndex * 0.1;
            child.userData.angle += shellSpeed * 0.01;
            const orbitRadius = (1 + child.userData.shellIndex * 0.8) * 0.6;
            child.position.x = Math.cos(child.userData.angle) * orbitRadius;
            child.position.z = Math.sin(child.userData.angle) * orbitRadius;
          }
        });
        masteryOrganism.rotation.y += 0.002;

      } else if (animType === 'mitochondrion') {
        // Pulsing cristae and floating ATP
        masteryOrganism.children.forEach((child, idx) => {
          if (child.userData.floatPhase !== undefined) {
            const phase = child.userData.floatPhase + time * 0.5;
            child.position.y += Math.sin(phase) * 0.01;
          }
        });
        masteryOrganism.rotation.x += 0.001;
        masteryOrganism.rotation.z += 0.002;

      } else if (animType === 'waterMolecule') {
        // Gentle rotation showing molecular geometry
        masteryOrganism.rotation.x += 0.003;
        masteryOrganism.rotation.y += 0.004;
        masteryOrganism.rotation.z += 0.001;

        // Pulsing dipole moment indicator
        masteryOrganism.children.forEach(child => {
          if (child.geometry?.type === 'ConeGeometry') {
            child.scale.y = 0.8 + Math.sin(time * 2) * 0.2;
          }
        });

      } else if (animType === 'turbineAssembly') {
        // Rotating shaft and blades
        const rotationSpeed = masteryOrganism.children
          .find(c => c.userData.rotationSpeed)?.userData.rotationSpeed || 0.5;

        masteryOrganism.children.forEach(child => {
          if (child.geometry?.type === 'CylinderGeometry' || child.geometry?.type === 'BoxGeometry') {
            // Rotating shaft and rotating blades
            masteryOrganism.rotation.z += rotationSpeed * 0.01;
          }
        });

        // Power ring glow and rotation
        const powerRing = masteryOrganism.children.find(c => c.geometry?.type === 'TorusGeometry' && c.material.color.getHex() !== 0x6B7280);
        if (powerRing) {
          powerRing.rotation.x += 0.02;
          powerRing.material.opacity = 0.4 + Math.sin(time * 2) * 0.2;
        }

      } else if (animType === 'mathematicalSurface') {
        // Smooth rotation of mathematical surface
        masteryOrganism.rotation.x += 0.002;
        masteryOrganism.rotation.y += 0.004;
        masteryOrganism.rotation.z += 0.001;
      }

      // Gentle bob animation for all organisms
      const bobHeight = Math.sin(time * 0.8 + 0) * 0.2;
      masteryOrganism.position.y = bobHeight;
    }

    // Lesson pathway subtle rotation
    if (lessonPathwayGroup) {
      lessonPathwayGroup.rotation.z += 0.0001;
    }

    dashboardRenderer.render(dashboardScene, dashboardCamera);
  },

  // =============================================
  // Update all visualizations in real-time
  // =============================================
  updateRealTime() {
    this.buildKnowledgeGraph();
    this.buildMasteryOrganisms();
    this.buildLessonPathway();
  },

  // =============================================
  // Handle window resize
  // =============================================
  onWindowResize(container) {
    if (!dashboardCamera || !dashboardRenderer) return;

    const w = container.offsetWidth;
    const h = container.offsetHeight;

    dashboardCamera.aspect = w / h;
    dashboardCamera.updateProjectionMatrix();
    dashboardRenderer.setSize(w, h);
  },

  // =============================================
  // Cleanup
  // =============================================
  destroy() {
    if (dashboardAnimId) cancelAnimationFrame(dashboardAnimId);
    if (dashboardRenderer) {
      dashboardRenderer.dispose();
      dashboardRenderer.domElement.parentNode?.removeChild(dashboardRenderer.domElement);
    }
    dashboardScene = null;
  }
};

export { Dashboard3D };
