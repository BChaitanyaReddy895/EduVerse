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
    const scale = 0.5 + (accuracy / 200); // Scale with accuracy

    if (subjectId === 'physics') {
      // Rotating atom core with orbiting particles
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.6 * scale, 32, 32),
        new THREE.MeshPhysicalMaterial({
          color: 0xEF4444,
          emissive: 0xEF4444,
          emissiveIntensity: 0.3 + (accuracy / 100) * 0.7,
          roughness: 0.2
        })
      );
      core.castShadow = true;
      group.add(core);

      for (let i = 0; i < 3; i++) {
        const orbit = new THREE.Mesh(
          new THREE.TorusGeometry(1.2 * scale + i * 0.3, 0.05, 32, 64),
          new THREE.MeshBasicMaterial({ color: 0x06B6D4, transparent: true, opacity: 0.6 })
        );
        orbit.userData = { speed: 2 + i, radius: 1.2 * scale + i * 0.3 };
        group.add(orbit);
      }
      group.userData.animType = 'atomOrbit';
    } else if (subjectId === 'biology') {
      // Growing DNA helix
      for (let i = 0; i < Math.ceil((accuracy / 100) * 20); i++) {
        const angle = i * 0.3;
        const x = Math.cos(angle) * 0.8 * scale;
        const z = Math.sin(angle) * 0.8 * scale;
        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(0.15 * scale, 16, 16),
          new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? 0x10B981 : 0x3B82F6 })
        );
        sphere.position.set(x, i * 0.15, z);
        group.add(sphere);
      }
      group.userData.animType = 'dnaHelix';
    } else if (subjectId === 'chemistry') {
      // Shrinking/Growing molecules
      const o = new THREE.Mesh(
        new THREE.SphereGeometry(0.7 * scale, 32, 32),
        new THREE.MeshStandardMaterial({
          color: 0xEF4444,
          roughness: 0.2,
          emissive: 0xEF4444,
          emissiveIntensity: (accuracy / 100) * 0.5
        })
      );
      group.add(o);

      for (let i = 0; i < 2; i++) {
        const h = new THREE.Mesh(
          new THREE.SphereGeometry(0.4 * scale, 16, 16),
          new THREE.MeshStandardMaterial({ color: 0xF8FAFC })
        );
        h.position.set((i === 0 ? 1 : -1) * 1.0 * scale, 0.5 * scale, 0);
        group.add(h);
      }
      group.userData.animType = 'molecule';
    } else if (subjectId === 'engineering') {
      // Rotating gears
      const g1 = new THREE.Mesh(
        new THREE.TorusGeometry(0.8 * scale, 0.2, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0x9CA3AF, metalness: 1.0, roughness: 0.2 })
      );
      g1.position.x = -0.6 * scale;
      group.add(g1);

      const g2 = new THREE.Mesh(
        new THREE.TorusGeometry(0.8 * scale, 0.2, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 1.0, roughness: 0.2 })
      );
      g2.position.x = 0.6 * scale;
      group.add(g2);

      group.userData.animType = 'gears';
    } else if (subjectId === 'math') {
      // Torus knot that grows with mastery
      const geo = new THREE.TorusKnotGeometry(0.8 * scale, 0.2 + (accuracy / 200), 256, 64);
      const mat = new THREE.MeshPhysicalMaterial({
        color: 0x8B5CF6,
        metalness: 0.6,
        roughness: 0.1,
        emissive: 0x8B5CF6,
        emissiveIntensity: (accuracy / 200)
      });
      const knot = new THREE.Mesh(geo, mat);
      group.add(knot);
      group.userData.animType = 'torusKnot';
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

    // Rotate knowledge graph
    if (knowledgeGraph3D) {
      knowledgeGraph3D.rotation.y += 0.0005;
    }

    // Animate mastery organisms
    if (masteryOrganism) {
      masteryOrganism.children.forEach(child => {
        if (child.userData.animType === 'atomOrbit') {
          child.children.forEach((orbit, idx) => {
            if (orbit.userData.speed) {
              orbit.rotation.z += 0.01 * orbit.userData.speed;
              child.children[0].rotation.y += 0.005; // Core rotation
            }
          });
        } else if (child.userData.animType === 'dnaHelix') {
          child.rotation.y += 0.02;
        } else if (child.userData.animType === 'gears') {
          child.children[0].rotation.z += 0.03;
          child.children[1].rotation.z -= 0.03;
        } else if (child.userData.animType === 'torusKnot') {
          child.rotation.x += 0.005;
          child.rotation.y += 0.008;
        }
      });
    }

    // Gentle bob animation for all organisms
    if (masteryOrganism) {
      const time = Date.now() * 0.001;
      masteryOrganism.children.forEach((child, idx) => {
        if (child.position.x !== undefined && !child.userData?.noFloat) {
          child.position.y = Math.sin(time + idx * 0.5) * 0.3;
        }
      });
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
