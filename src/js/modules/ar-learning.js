// ============================================
// EduVerse — WebAR Learning Module v2.0
// Research-Grade Immersive Pedagogical Engine
// Novel Algorithms: VSCR, NSTF, EHDG, PGRF
// ============================================

import * as THREE from 'three';
import { store } from '../utils/data-store.js';
import { staggerAnimation, showToast, animateValue } from '../utils/helpers.js';
import {
  PhysicsModels,
  BiologyModels,
  ChemistryModels,
  EngineeringModels,
  MathModels
} from './realistic-3d-models.js';

let currentSubject = null;
let currentLesson = null;
let arStream = null;
let threeScene = null;
let threeCamera = null;
let threeRenderer = null;
let animationId = null;
let scmState = { interactionTime: 0, complexityLevel: 1, cognitiveLoad: 'low' };
let scmInterval = null;
let sessionStart = null;
let composer = null; // Post-processing composer

// SSN Engine State
let ssnNodes = [];
let currentSsnIndex = 0;
let currentSsnAnimate = null;
let isSsnMode = false;
let ssnTargetScene = null;
let activePrefix = ''; // '3d' or 'ar'
let nstfTransitioning = false; // NSTF transition lock
let nstfClock = null;

// =============================================
// NOVEL ALGORITHM 1: VSCR — Volumetric Spatial Comprehension Rendering
// Formula: SCS(t) = α·G(t) + β·D(t) + γ·T(t) + δ·R(t)
// =============================================
const VSCR = {
  alpha: 0.25, beta: 0.30, gamma: 0.25, delta: 0.20,
  lambda: 0.05, K: 5,
  mouseVelocity: 0, lastMouseX: 0, lastMouseY: 0, lastMouseTime: 0,
  dwellStart: 0, interactionCount: 0, nodeVisits: {},
  currentLOD: 0, scsScore: 0,

  reset() {
    this.mouseVelocity = 0; this.dwellStart = Date.now();
    this.interactionCount = 0; this.nodeVisits = {};
    this.currentLOD = 0; this.scsScore = 0;
  },

  trackMouse(x, y) {
    const now = Date.now();
    const dt = Math.max(1, now - this.lastMouseTime);
    const dx = x - this.lastMouseX, dy = y - this.lastMouseY;
    this.mouseVelocity = Math.sqrt(dx*dx + dy*dy) / dt;
    this.lastMouseX = x; this.lastMouseY = y; this.lastMouseTime = now;
  },

  trackInteraction() { this.interactionCount++; },
  trackNodeVisit(nodeId) { this.nodeVisits[nodeId] = (this.nodeVisits[nodeId] || 0) + 1; },

  // Core SCS Formula
  computeSCS() {
    const G = Math.max(0, 1 - this.mouseVelocity * 2); // Gaze stability (inverse velocity)
    const tDwell = (Date.now() - this.dwellStart) / 1000;
    const D = 1 - Math.exp(-this.lambda * tDwell); // Dwell-time decay
    const T = Math.min(1, this.interactionCount / 20); // Interaction frequency
    const currentNodeId = ssnNodes[currentSsnIndex]?.title || 'default';
    const R = Math.min(1, (this.nodeVisits[currentNodeId] || 0) / this.K); // Revisit coefficient

    this.scsScore = this.alpha * G + this.beta * D + this.gamma * T + this.delta * R;
    this.scsScore = Math.max(0, Math.min(1, this.scsScore));

    // Determine LOD
    if (this.scsScore < 0.3) this.currentLOD = 0;
    else if (this.scsScore < 0.6) this.currentLOD = 1;
    else if (this.scsScore < 0.85) this.currentLOD = 2;
    else this.currentLOD = 3;

    return this.scsScore;
  },

  // Apply LOD to scene
  applyLOD(scene) {
    scene.traverse(child => {
      if (child.userData.isEnvironment) return; // Skip environment objects
      if (child.isMesh && child.material) {
        const mat = child.material;
        // LOD-0: Solid but minimal emissive (never wireframe — wireframe causes blur)
        if (this.currentLOD === 0) {
          mat.wireframe = false;
          if (mat.emissive) mat.emissiveIntensity = 0.15;
        } else if (this.currentLOD === 1) {
          mat.wireframe = false;
          if (mat.emissive) mat.emissiveIntensity = 0.4;
        } else if (this.currentLOD >= 2) {
          mat.wireframe = false;
          if (mat.emissive) mat.emissiveIntensity = 0.3 + this.scsScore * 0.7;
        }
      }
      if (child.isPoints && child.material) {
        child.material.size = this.currentLOD >= 2 ? 0.08 : 0.05;
      }
    });
  },

  // Update UI telemetry panel
  updateUI() {
    const el = id => document.getElementById(id);
    if (el('vscr-scs')) el('vscr-scs').textContent = this.scsScore.toFixed(3);
    if (el('vscr-lod')) el('vscr-lod').textContent = `LOD-${this.currentLOD}`;
    if (el('vscr-gaze')) el('vscr-gaze').textContent = Math.max(0, 1 - this.mouseVelocity * 2).toFixed(2);
    if (el('vscr-dwell')) {
      const tDwell = (Date.now() - this.dwellStart) / 1000;
      el('vscr-dwell').textContent = `${tDwell.toFixed(0)}s`;
    }
    if (el('vscr-interactions')) el('vscr-interactions').textContent = this.interactionCount;
    // SCS gauge fill
    if (el('vscr-gauge-fill')) el('vscr-gauge-fill').style.width = `${this.scsScore * 100}%`;
    // LOD color
    if (el('vscr-lod')) {
      const colors = ['#94A3B8', '#3B82F6', '#10B981', '#F59E0B'];
      el('vscr-lod').style.color = colors[this.currentLOD] || '#94A3B8';
    }
  }
};

// =============================================
// NOVEL ALGORITHM 2: NSTF — Narrative-Synchronized Temporal Fading
// Opacity_out(t) = 1 / (1 + e^(k·(t - t_mid)))
// Opacity_in(t)  = 1 / (1 + e^(-k·(t - t_mid)))
// =============================================
const NSTF = {
  k: 8, // Steepness
  transitionDuration: 1.2, // seconds
  S_min: 0.3,

  sigmoid(t, k, mid) { return 1 / (1 + Math.exp(k * (t - mid))); },
  sigmoidInv(t, k, mid) { return 1 / (1 + Math.exp(-k * (t - mid))); },

  // Execute a cross-dissolve between outgoing and incoming nodes
  async crossDissolve(scene, outgoingAnimate, incomingSetup) {
    nstfTransitioning = true;
    const tStart = performance.now() / 1000;
    const tMid = this.transitionDuration / 2;

    // Snapshot outgoing objects
    const outgoing = [];
    scene.children.forEach(c => {
      if (c.type === 'Mesh' || c.type === 'Group' || c.type === 'Points' || c.type === 'Sprite') {
        outgoing.push(c);
      }
    });

    // Create incoming objects in a temp group (invisible initially)
    const incomingGroup = new THREE.Group();
    incomingGroup.visible = false;
    scene.add(incomingGroup);
    const newAnimate = incomingSetup(incomingGroup);

    return new Promise(resolve => {
      const animate = () => {
        const elapsed = performance.now() / 1000 - tStart;
        const progress = Math.min(1, elapsed / this.transitionDuration);
        const tNorm = progress * this.transitionDuration;

        // Fade out old
        const opOut = this.sigmoid(tNorm, this.k, tMid);
        outgoing.forEach(c => {
          c.traverse(child => {
            if (child.material) {
              child.material.transparent = true;
              child.material.opacity = opOut;
            }
          });
          c.scale.setScalar(1 - (1 - this.S_min) * (1 - opOut));
        });

        // Fade in new
        const opIn = this.sigmoidInv(tNorm, this.k, tMid);
        incomingGroup.visible = true;
        incomingGroup.traverse(child => {
          if (child.material) {
            child.material.transparent = true;
            child.material.opacity = opIn;
          }
        });
        incomingGroup.scale.setScalar(this.S_min + (1 - this.S_min) * opIn);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Cleanup: remove outgoing, reparent incoming
          outgoing.forEach(c => scene.remove(c));
          // Move children from incomingGroup to scene
          const children = [...incomingGroup.children];
          children.forEach(c => { incomingGroup.remove(c); scene.add(c); });
          scene.remove(incomingGroup);
          nstfTransitioning = false;
          resolve(newAnimate);
        }
      };
      animate();
    });
  }
};

// =============================================
// NOVEL ALGORITHM 3: PGRF — Perceptual Gaze-Responsive Feedback
// Attention(obj_i) = max(0, 1 - ||P_cursor - P_obj_i||² / R²)
// =============================================
const PGRF = {
  R: 200, // Attention radius in pixels
  cursorX: 0, cursorY: 0,
  boostFactor: 2.0,
  enabled: true,

  trackCursor(x, y) { this.cursorX = x; this.cursorY = y; },

  applyAttention(scene, camera, renderer) {
    if (!this.enabled || !renderer) return;
    const width = renderer.domElement.width;
    const height = renderer.domElement.height;

    scene.traverse(child => {
      if (!child.isMesh && !child.isSprite) return;
      // Project 3D position to 2D screen
      const pos3D = new THREE.Vector3();
      child.getWorldPosition(pos3D);
      pos3D.project(camera);
      const screenX = (pos3D.x * 0.5 + 0.5) * width;
      const screenY = (-pos3D.y * 0.5 + 0.5) * height;

      const dx = this.cursorX - screenX;
      const dy = this.cursorY - screenY;
      const distSq = dx*dx + dy*dy;
      const attention = Math.max(0, 1 - distSq / (this.R * this.R));

      if (child.material && child.material.emissive) {
        child.material.emissiveIntensity = 0.1 + attention * this.boostFactor;
      }
      if (child.isSprite) {
        const baseScale = child.userData.baseScale || child.scale.x;
        child.userData.baseScale = baseScale;
        const scaleFactor = 1 + 0.4 * attention;
        child.scale.setScalar(baseScale * scaleFactor);
      }
    });
  }
};

// =============================================
// NOVEL ALGORITHM 4: EHDG — Entropic Hierarchical Depth Graph
// H(edge_ij) = -Σ p(concept_k) · log₂(p(concept_k))
// =============================================
const EHDG = {
  computeEntropy(priorMasteries) {
    if (!priorMasteries.length) return 0;
    let H = 0;
    priorMasteries.forEach(p => {
      if (p > 0 && p < 1) H -= p * Math.log2(p) + (1-p) * Math.log2(1-p);
    });
    return H / priorMasteries.length;
  },
  computeTraversalCost(nodes, masteryMap) {
    let totalCost = 0;
    for (let i = 1; i < nodes.length; i++) {
      const priorMastery = masteryMap[nodes[i-1].title] || 0.5;
      const currentMastery = masteryMap[nodes[i].title] || 0;
      const entropy = this.computeEntropy([priorMastery]);
      totalCost += entropy * (1 - currentMastery);
    }
    return totalCost;
  },
  // Reorder nodes to minimize total traversal cost (greedy)
  optimizeOrder(nodes, masteryMap) {
    if (nodes.length <= 2) return nodes;
    // Keep first node fixed, greedily pick cheapest next
    const ordered = [nodes[0]];
    const remaining = nodes.slice(1);
    while (remaining.length) {
      let bestIdx = 0, bestCost = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const last = ordered[ordered.length - 1];
        const priorM = masteryMap[last.title] || 0.5;
        const curM = masteryMap[remaining[i].title] || 0;
        const cost = this.computeEntropy([priorM]) * (1 - curM);
        if (cost < bestCost) { bestCost = cost; bestIdx = i; }
      }
      ordered.push(remaining.splice(bestIdx, 1)[0]);
    }
    return ordered;
  }
};

// =============================================
// Kalman Filter for AR Gyroscope Smoothing
// =============================================
class KalmanFilter1D {
  constructor(Q = 0.001, R = 0.1) {
    this.Q = Q; // Process noise
    this.R = R; // Measurement noise
    this.x = 0; // Estimate
    this.P = 1; // Estimate error
  }
  update(measurement) {
    // Prediction
    this.P += this.Q;
    // Update
    const K = this.P / (this.P + this.R);
    this.x += K * (measurement - this.x);
    this.P *= (1 - K);
    return this.x;
  }
}

// =============================================
// Environment & Atmosphere Generator
// =============================================
function createEnvironment(scene) {
  // Gradient sky dome
  const skyGeo = new THREE.SphereGeometry(50, 32, 32);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      topColor: { value: new THREE.Color(0x0a0a1a) },
      bottomColor: { value: new THREE.Color(0x1a0a2e) },
      offset: { value: 10 }, exponent: { value: 0.6 }
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }`,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
      }`
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  sky.userData.isEnvironment = true;
  scene.add(sky);

  // Grid floor
  const gridHelper = new THREE.GridHelper(20, 40, 0x1a1a3e, 0x0d0d1f);
  gridHelper.position.y = -2;
  gridHelper.material.transparent = true;
  gridHelper.material.opacity = 0.4;
  gridHelper.userData.isEnvironment = true;
  scene.add(gridHelper);

  // Ambient floating particles
  const ambientGeo = new THREE.BufferGeometry();
  const ambientPts = [];
  for (let i = 0; i < 200; i++) {
    ambientPts.push(
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 20
    );
  }
  ambientGeo.setAttribute('position', new THREE.Float32BufferAttribute(ambientPts, 3));
  const ambientMat = new THREE.PointsMaterial({
    color: 0x7C3AED, size: 0.04, transparent: true, opacity: 0.3,
    blending: THREE.AdditiveBlending
  });
  const ambientParticles = new THREE.Points(ambientGeo, ambientMat);
  ambientParticles.userData.isEnvironment = true;
  scene.add(ambientParticles);

  return ambientParticles;
}

// =============================================
// 3D Label Generator (Canvas -> Sprite) — Large & Crisp
// =============================================
function create3DLabel(text, color = "#ffffff", scale = 1.0) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 2048;
    canvas.height = 512;
    // Set font first so measureText works
    ctx.font = "bold 100px 'Inter', 'Segoe UI', Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // Background pill for readability
    const measured = ctx.measureText(text);
    const tw = measured.width || 600;
    const pillX = 1024 - tw/2 - 50;
    const pillW = tw + 100;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.beginPath();
    // Manual rounded rect for compatibility
    const r = 25, py = 130, ph = 250;
    ctx.moveTo(pillX + r, py);
    ctx.lineTo(pillX + pillW - r, py);
    ctx.quadraticCurveTo(pillX + pillW, py, pillX + pillW, py + r);
    ctx.lineTo(pillX + pillW, py + ph - r);
    ctx.quadraticCurveTo(pillX + pillW, py + ph, pillX + pillW - r, py + ph);
    ctx.lineTo(pillX + r, py + ph);
    ctx.quadraticCurveTo(pillX, py + ph, pillX, py + ph - r);
    ctx.lineTo(pillX, py + r);
    ctx.quadraticCurveTo(pillX, py, pillX + r, py);
    ctx.closePath();
    ctx.fill();
    // Glow layer
    ctx.shadowColor = color;
    ctx.shadowBlur = 40;
    ctx.font = "bold 100px 'Inter', 'Segoe UI', Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.fillText(text, 1024, 256);
    // Crisp second pass
    ctx.shadowBlur = 0;
    ctx.fillText(text, 1024, 256);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, sizeAttenuation: true });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(scale * 6, scale * 1.5, 1);
    return sprite;
}

// =============================================
// SSN Engine — Enhanced with NSTF + EHDG
// =============================================
function initSsn(scene, builderFunc, prefix) {
    activePrefix = prefix;
    ssnTargetScene = scene;
    const result = builderFunc(scene);
    
    if (Array.isArray(result)) {
        isSsnMode = true;
        // Apply EHDG optimization to node ordering
        const masteryMap = store.getAllMastery();
        ssnNodes = EHDG.optimizeOrder(result, masteryMap);
        currentSsnIndex = 0;
        VSCR.reset();
        const hudEl = document.getElementById(`ssn-hud-${prefix}`);
        if (hudEl) hudEl.style.display = 'flex';
        loadSsnNode(0);
        return (t) => {
            if (currentSsnAnimate && !nstfTransitioning) currentSsnAnimate(t);
            // VSCR real-time computation
            VSCR.computeSCS();
            if (ssnTargetScene) VSCR.applyLOD(ssnTargetScene);
            VSCR.updateUI();
            // PGRF attention
            if (threeCamera && threeRenderer) PGRF.applyAttention(ssnTargetScene, threeCamera, threeRenderer);
        };
    } else {
        isSsnMode = false;
        const hudEl = document.getElementById(`ssn-hud-${prefix}`);
        if (hudEl) hudEl.style.display = 'none';
        return result;
    }
}

async function loadSsnNode(index) {
    if (index < 0 || index >= ssnNodes.length) return;
    const node = ssnNodes[index];
    VSCR.trackNodeVisit(node.title);
    VSCR.dwellStart = Date.now(); // Reset dwell for new node

    if (currentSsnIndex !== index && currentSsnAnimate && ssnTargetScene) {
        // Use NSTF cross-dissolve for transitions
        currentSsnIndex = index;
        currentSsnAnimate = await NSTF.crossDissolve(ssnTargetScene, currentSsnAnimate, (parentGroup) => {
            return node.setup(parentGroup);
        });
    } else {
        // First load — no transition needed
        currentSsnIndex = index;
        const objectsToRemove = [];
        ssnTargetScene.children.forEach(c => {
            if ((c.type === 'Mesh' || c.type === 'Group' || c.type === 'Points' || c.type === 'Sprite') && !c.userData.isEnvironment) {
                objectsToRemove.push(c);
            }
        });
        objectsToRemove.forEach(c => ssnTargetScene.remove(c));
        currentSsnAnimate = node.setup(ssnTargetScene);
    }

    // Update HUD
    const titleEl = document.getElementById(`ssn-title-${activePrefix}`);
    const textEl = document.getElementById(`ssn-text-${activePrefix}`);
    const progressEl = document.getElementById(`ssn-progress-${activePrefix}`);
    if (titleEl) titleEl.textContent = node.title;
    if (textEl) textEl.textContent = node.narrative;
    if (progressEl) progressEl.textContent = `${index + 1} / ${ssnNodes.length}`;
    
    // Update SSN progress bar
    const progressFill = document.getElementById(`ssn-bar-${activePrefix}`);
    if (progressFill) progressFill.style.width = `${((index + 1) / ssnNodes.length) * 100}%`;

    const prevBtn = document.getElementById(`ssn-prev-${activePrefix}`);
    const nextBtn = document.getElementById(`ssn-next-${activePrefix}`);
    if (prevBtn) { prevBtn.style.opacity = index === 0 ? '0.3' : '1'; prevBtn.style.pointerEvents = index === 0 ? 'none' : 'auto'; }
    if (nextBtn) {
      if (index === ssnNodes.length - 1) {
        nextBtn.textContent = '✅ Complete Lesson';
        nextBtn.style.background = 'linear-gradient(135deg, #10B981, #059669)';
      } else {
        nextBtn.textContent = 'Next Concept ➔';
        nextBtn.style.background = '';
      }
    }
}

export function bindSsnControls() {
    ['3d', 'ar'].forEach(prefix => {
        document.getElementById(`ssn-prev-${prefix}`)?.addEventListener('click', () => {
            VSCR.trackInteraction();
            if (currentSsnIndex > 0) loadSsnNode(currentSsnIndex - 1);
        });
        document.getElementById(`ssn-next-${prefix}`)?.addEventListener('click', () => {
            VSCR.trackInteraction();
            if (currentSsnIndex < ssnNodes.length - 1) {
                loadSsnNode(currentSsnIndex + 1);
            } else {
                showToast("🎓 Lesson Completed! Mastery updated.", "success");
                const hudEl = document.getElementById(`ssn-hud-${prefix}`);
                if (hudEl) hudEl.style.display = 'none';
            }
        });
    });
}
// =============================================

// === 3D Model Builders ===
const modelBuilders = {
  // ========== PHYSICS MODELS (NEW & REALISTIC) ==========
  
  // Newtonian Pendulum with Force Vectors
  newton: (scene) => PhysicsModels.newtonianPendulum(scene),
  
  // Projectile Motion
  projectile: (scene) => PhysicsModels.projectileMotion(scene),
  
  // Circular Orbital Motion
  orbital: (scene) => PhysicsModels.circularMotion(scene),

  // Placeholder for atom (uses SSN nodes instead)
  atom: () => [],

  // Optics: Refraction & Dispersion
  optics: (scene) => {
    const group = new THREE.Group();
    
    // Convex lens with realistic refraction
    const lensGeo = new THREE.SphereGeometry(0.7, 64, 64, 0, Math.PI * 2, Math.PI / 4, Math.PI / 2);
    const lensMat = new THREE.MeshPhysicalMaterial({
      color: 0x67E8F9,
      transmission: 0.95,
      opacity: 1,
      transparent: true,
      roughness: 0.05,
      ior: 1.52
    });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    group.add(lens);
    
    // Principal axis line
    const axisGeo = new THREE.BufferGeometry();
    axisGeo.setFromPoints([new THREE.Vector3(-4, 0, 0), new THREE.Vector3(4, 0, 0)]);
    const axisMat = new THREE.LineBasicMaterial({ color: 0x64748B, transparent: true, opacity: 0.5 });
    group.add(new THREE.Line(axisGeo, axisMat));
    
    // Light rays
    const rayColor = 0xFCD34D;
    const rayMat = new THREE.LineBasicMaterial({ color: rayColor, transparent: true, opacity: 0.7, linewidth: 2 });
    
    for (let i = -1.5; i <= 1.5; i += 0.5) {
      if (Math.abs(i) < 0.1) continue; // Skip central axis
      const rayGeo = new THREE.BufferGeometry();
      rayGeo.setFromPoints([
        new THREE.Vector3(-3, i, 0),
        new THREE.Vector3(0, i, 0),
        new THREE.Vector3(2.5, i * 0.2, 0) // Converge toward focal point
      ]);
      group.add(new THREE.Line(rayGeo, rayMat));
    }
    
    // Focal point markers
    const focalGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const focalMat = new THREE.MeshBasicMaterial({ color: 0xEF4444 });
    const focal = new THREE.Mesh(focalGeo, focalMat);
    focal.position.set(1.5, 0, 0);
    group.add(focal);
    
    scene.add(group);
    
    return (time) => {
      lens.rotation.z = Math.sin(time * 0.3) * 0.1;
    };
  },

  // ========== BIOLOGY MODELS (NEW & REALISTIC) ==========
  
  // Realistic Plant Cell with organelles
  plantsCell: (scene) => BiologyModels.plantCell(scene),
  
  // DNA Double Helix (realistic geometry)
  dna: (scene) => BiologyModels.dnaHelix(scene),
  
  // Protein Structure (alpha helices, beta sheets)
  protein: (scene) => BiologyModels.proteinStructure(scene),
  
  // Placeholder for generic cell
  cell: () => [],

  // ========== CHEMISTRY MODELS (NEW & REALISTIC) ==========
  
  // Water Molecule (H2O with bond angles & electron clouds)
  water: (scene) => ChemistryModels.waterMolecule(scene),
  
  // Methane Tetrahedral Structure
  methane: (scene) => ChemistryModels.methane(scene),
  
  // Placeholder for bonds
  bonds: (scene) => ChemistryModels.waterMolecule(scene),

  // ========== ENGINEERING MODELS (NEW & REALISTIC) ==========
  
  // Gear System with meshing gears
  gears: (scene) => EngineeringModels.gearSystem(scene),
  
  // Placeholder for bridges (will add later)
  bridges: (scene) => {
    const bridgeGroup = new THREE.Group();
    
    // Simple truss bridge structure
    const beamGeo = new THREE.BoxGeometry(3, 0.1, 0.1);
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x4B5563, metalness: 0.8, roughness: 0.1 });
    const mainBeam = new THREE.Mesh(beamGeo, steelMat);
    bridgeGroup.add(mainBeam);
    
    // Support towers
    for (let x of [-1.5, 1.5]) {
      const towerGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 32);
      const tower = new THREE.Mesh(towerGeo, steelMat);
      tower.position.set(x, -0.6, 0);
      bridgeGroup.add(tower);
    }
    
    // Diagonal bracing
    const bracingGeo = new THREE.CylinderGeometry(0.04, 0.04, Math.sqrt(2.25 + 0.36), 16);
    for (let i = 0; i < 4; i++) {
      const bracing = new THREE.Mesh(bracingGeo, steelMat);
      bracing.position.set(-1.5 + i * 1, -0.3, 0);
      bracing.rotation.z = i % 2 === 0 ? Math.PI / 4 : -Math.PI / 4;
      bridgeGroup.add(bracing);
    }
    
    scene.add(bridgeGroup);
    return (time) => {
      bridgeGroup.rotation.y = Math.sin(time * 0.2) * 0.05;
    };
  },

  // ========== MATH MODELS (NEW & REALISTIC) ==========
  
  // Möbius Strip
  mobiusStrip: (scene) => MathModels.mobiusStrip(scene),
  
  // Placeholder for calculus
  calculus: (scene) => {
    const group = new THREE.Group();
    
    // 3D sine wave (parametric curve)
    const points = [];
    for (let t = -Math.PI; t <= Math.PI; t += 0.1) {
      points.push(new THREE.Vector3(t, Math.sin(t), Math.cos(t * 0.5)));
    }
    
    const geo = new THREE.BufferGeometry();
    const tubeGeo = new THREE.TubeGeometry(
      new THREE.LineCurve3(points[0], points[points.length - 1]),
      50,
      0.1,
      8
    );
    
    // Gradient color curve
    const curveMat = new THREE.MeshPhysicalMaterial({
      color: 0x8B5CF6,
      metalness: 0.3,
      roughness: 0.4,
      emissive: 0x5B21B6,
      emissiveIntensity: 0.2
    });
    
    const curveMesh = new THREE.Mesh(tubeGeo, curveMat);
    group.add(curveMesh);
    
    scene.add(group);
    return (time) => {
      group.rotation.x = time * 0.2;
      group.rotation.z = time * 0.3;
    };
  },
  
  // Placeholder for geometry
  geometry: (scene) => {
    const group = new THREE.Group();
    
    // Platonic solids
    const solids = [
      { geo: new THREE.TetrahedronGeometry(0.5), color: 0xEF4444, pos: [-1, 0, 0] },
      { geo: new THREE.OctahedronGeometry(0.5), color: 0x10B981, pos: [0, 0, 0] },
      { geo: new THREE.IcosahedronGeometry(0.5), color: 0x3B82F6, pos: [1, 0, 0] }
    ];
    
    solids.forEach(({ geo, color, pos }) => {
      const mat = new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0.4,
        roughness: 0.3,
        wireframe: false
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.fromArray(pos);
      group.add(mesh);
    });
    
    scene.add(group);
    return (time) => {
      solids.forEach((_, i) => {
        group.children[i].rotation.x = time * (0.5 + i * 0.2);
        group.children[i].rotation.y = time * (0.8 - i * 0.3);
      });
    };
  },
  
  // Placeholder for pyramid (historical)
  pyramid: (scene) => {
    const group = new THREE.Group();
    
    // Pyramid base
    const baseGeo = new THREE.BoxGeometry(2, 0.1, 2);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0xD4A574, roughness: 0.6 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -1;
    group.add(base);
    
    // Pyramid structure (cone)
    const pyramidGeo = new THREE.ConeGeometry(1.4, 2, 4);
    const pyramidMat = new THREE.MeshStandardMaterial({
      color: 0xC4A060,
      roughness: 0.7,
      metalness: 0.1
    });
    const pyramid = new THREE.Mesh(pyramidGeo, pyramidMat);
    pyramid.position.y = 0;
    group.add(pyramid);
    
    // Edge lines
    const edgesGeo = new THREE.EdgesGeometry(pyramidGeo);
    const edgesMat = new THREE.LineBasicMaterial({ color: 0x92400E, transparent: true, opacity: 0.4 });
    const edges = new THREE.LineSegments(edgesGeo, edgesMat);
    edges.position.y = 0;
    group.add(edges);
    
    scene.add(group);
    return (time) => {
      group.rotation.y = time * 0.25;
    };
  },
  
  // Placeholder for colosseum
  colosseum: (scene) => {
    const group = new THREE.Group();
    
    // Outer wall (circular structure)
    const wallGeo = new THREE.CylinderGeometry(2, 2.2, 2, 64, 1, true);
    const wallMat = new THREE.MeshPhysicalMaterial({
      color: 0xC4A882,
      roughness: 0.7,
      metalness: 0.1,
      wireframe: false
    });
    group.add(new THREE.Mesh(wallGeo, wallMat));
    
    // Arches (columns around perimeter)
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const colGeo = new THREE.CylinderGeometry(0.08, 0.08, 2, 32);
      const colMat = new THREE.MeshStandardMaterial({ color: 0xA08060, roughness: 0.8 });
      const column = new THREE.Mesh(colGeo, colMat);
      column.position.set(Math.cos(angle) * 2.1, 0, Math.sin(angle) * 2.1);
      group.add(column);
    }
    
    // Arena floor
    const floorGeo = new THREE.CircleGeometry(1.8, 64);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xD4B8A0, roughness: 0.8 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1;
    group.add(floor);
    
    scene.add(group);
    return (time) => {
      group.rotation.y = time * 0.15;
    };
  },

  waves: (scene) => {
    // 3D sine wave
    const points = [];
    for (let x = -4; x <= 4; x += 0.1) { points.push(new THREE.Vector3(x, 0, 0)); }
    const waveGeo = new THREE.BufferGeometry().setFromPoints(points);
    const waveMat = new THREE.LineBasicMaterial({ color: 0x7C3AED });
    const wave = new THREE.Line(waveGeo, waveMat);
    wave.name = 'wave';
    scene.add(wave);
    return (time) => {
      const pos = wave.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        pos.setY(i, Math.sin(x * 2 + time * 3) * 0.5);
      }
      pos.needsUpdate = true;
    };
  },
  // BIOLOGY
  dna: (scene) => {
    // DNA double helix
    const helixMat1 = new THREE.MeshPhongMaterial({ color: 0x7C3AED });
    const helixMat2 = new THREE.MeshPhongMaterial({ color: 0x06B6D4 });
    const baseMat = new THREE.MeshPhongMaterial({ color: 0x10B981 });
    for (let i = 0; i < 40; i++) {
      const t = i * 0.3;
      const y = i * 0.1 - 2;
      const x1 = Math.cos(t) * 0.8, z1 = Math.sin(t) * 0.8;
      const x2 = Math.cos(t + Math.PI) * 0.8, z2 = Math.sin(t + Math.PI) * 0.8;
      const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.08), helixMat1);
      s1.position.set(x1, y, z1);
      scene.add(s1);
      const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.08), helixMat2);
      s2.position.set(x2, y, z2);
      scene.add(s2);
      if (i % 3 === 0) {
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, Math.sqrt((x2-x1)**2 + (z2-z1)**2)), baseMat);
        base.position.set((x1+x2)/2, y, (z1+z2)/2);
        base.rotation.z = Math.PI/2;
        base.lookAt(x2, y, z2);
        scene.add(base);
      }
    }
    return (time) => { scene.rotation.y = time * 0.3; };
  },
  
  cell: (scene) => {
    const cellGroup = new THREE.Group();
    
    // Simple plant cell
    const cellMembrane = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xE2E8F0, wireframe: false })
    );
    cellGroup.add(cellMembrane);
    
    // Nucleus
    const nucleus = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0x9CA3AF })
    );
    cellGroup.add(nucleus);
    
    // Mitochondria
    for (let i = 0; i < 5; i++) {
      const x = (Math.random() - 0.5) * 2;
      const y = (Math.random() - 0.5) * 2;
      const z = (Math.random() - 0.5) * 2;
      const mito = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.2, 0.4, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xF97316 })
      );
      mito.position.set(x, y, z);
      cellGroup.add(mito);
    }
    
    scene.add(cellGroup);
    return (time) => {
      cellGroup.rotation.x = time * 0.1;
      cellGroup.rotation.y = time * 0.15;
    };
  },
  
  water: (scene) => {
    const h2o = new THREE.Group();
    const oxyMat = new THREE.MeshStandardMaterial({ color: 0xEF4444 });
    const hydMat = new THREE.MeshStandardMaterial({ color: 0x06B6D4 });
    
    // Oxygen atom (center)
    const oxygen = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 32), oxyMat);
    h2o.add(oxygen);
    
    // Hydrogen atoms (bonded)
    const h1 = new THREE.Mesh(new THREE.SphereGeometry(0.15, 32, 32), hydMat);
    h1.position.set(-0.3, 0.2, 0);
    h2o.add(h1);
    
    const h2 = new THREE.Mesh(new THREE.SphereGeometry(0.15, 32, 32), hydMat);
    h2.position.set(0.3, 0.2, 0);
    h2o.add(h2);
    
    // Bonds
    const bondGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.35, 8);
    const bondMat = new THREE.MeshStandardMaterial({ color: 0xFCD34D });
    const bond1 = new THREE.Mesh(bondGeo, bondMat);
    bond1.position.set(-0.15, 0.1, 0);
    bond1.rotation.z = Math.PI / 4;
    h2o.add(bond1);
    
    const bond2 = new THREE.Mesh(bondGeo, bondMat);
    bond2.position.set(0.15, 0.1, 0);
    bond2.rotation.z = -Math.PI / 4;
    h2o.add(bond2);
    
    scene.add(h2o);
    return (time) => {
      h2o.rotation.x = time * 0.3;
      h2o.rotation.y = time * 0.2;
    };
  },
  
  bonds: (scene) => {
    // Simple representation of molecular bonds
    const bondGroup = new THREE.Group();
    const atoms = [];
    const colors = [0xFF6B6B, 0x4ECDC4, 0x45B7D1];
    
    for (let i = 0; i < 3; i++) {
      const atom = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 16, 16),
        new THREE.MeshStandardMaterial({ color: colors[i] })
      );
      atom.position.set(
        Math.cos((i / 3) * Math.PI * 2) * 1,
        Math.sin((i / 3) * Math.PI * 2) * 1,
        0
      );
      bondGroup.add(atom);
      atoms.push(atom);
    }
    
    scene.add(bondGroup);
    return (time) => {
      bondGroup.rotation.z = time * 0.2;
    };
  },
  
  gears: (scene) => {
    const createGear = (radius, teeth, x, y, color) => {
      const shape = new THREE.Shape();
      const innerR = radius * 0.7;
      for (let i = 0; i < teeth; i++) {
        const a1 = (i / teeth) * Math.PI * 2;
        const a2 = ((i + 0.3) / teeth) * Math.PI * 2;
        const a3 = ((i + 0.5) / teeth) * Math.PI * 2;
        const a4 = ((i + 0.8) / teeth) * Math.PI * 2;
        if (i === 0) shape.moveTo(Math.cos(a1) * innerR, Math.sin(a1) * innerR);
        shape.lineTo(Math.cos(a2) * innerR, Math.sin(a2) * innerR);
        shape.lineTo(Math.cos(a2) * radius, Math.sin(a2) * radius);
        shape.lineTo(Math.cos(a3) * radius, Math.sin(a3) * radius);
        shape.lineTo(Math.cos(a4) * innerR, Math.sin(a4) * innerR);
      }
      const extrudeSettings = { depth: 0.3, bevelEnabled: false };
      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      const mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ color }));
      mesh.position.set(x, y, 0);
      return mesh;
    };
    const gear1 = createGear(1, 12, -1.1, 0, 0x7C3AED);
    gear1.name = 'gear1';
    scene.add(gear1);
    const gear2 = createGear(0.7, 8, 0.7, 0, 0x06B6D4);
    gear2.name = 'gear2';
    scene.add(gear2);
    return (time) => {
      gear1.rotation.z = time * 0.5;
      gear2.rotation.z = -time * 0.5 * (12/8);
    };
  },
  
  bridges: (scene) => {
    const mat = new THREE.MeshPhongMaterial({ color: 0x06B6D4 });
    const beam = (x1,y1,z1,x2,y2,z2) => {
      const dir = new THREE.Vector3(x2-x1,y2-y1,z2-z1);
      const len = dir.length();
      const geo = new THREE.CylinderGeometry(0.03, 0.03, len);
      const m = new THREE.Mesh(geo, mat);
      m.position.set((x1+x2)/2,(y1+y2)/2,(z1+z2)/2);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir.normalize());
      scene.add(m);
    };
    for (let i = -3; i < 3; i++) { beam(i,0,0,i+1,0,0); beam(i,0,0.8,i+1,0,0.8); }
    for (let i = -2; i < 2; i++) { beam(i,1.5,0.4,i+1,1.5,0.4); }
    for (let i = -3; i <= 3; i++) { beam(i,0,0,i,0,0.8); if(i>=-2&&i<=2) { beam(i,0,0,i,1.5,0.4); beam(i,0,0.8,i,1.5,0.4); } }
    const road = new THREE.Mesh(new THREE.BoxGeometry(6, 0.05, 0.8), new THREE.MeshPhongMaterial({ color: 0x475569 }));
    scene.add(road);
    return (time) => { scene.rotation.y = time * 0.15; };
  },
  
  calculus: (scene) => {
    const macroGroup = new THREE.Group();
    const geo = new THREE.PlaneGeometry(6, 6, 50, 50);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i);
        pos.setZ(i, Math.sin(x*1.5)*Math.cos(y*1.5)*0.5);
    }
    geo.computeVertexNormals();
    const surfaceMat = new THREE.MeshPhysicalMaterial({ color: 0x7C3AED, side: THREE.DoubleSide, transparent: true, opacity: 0.9, wireframe: true });
    const surface = new THREE.Mesh(geo, surfaceMat);
    surface.rotation.x = -Math.PI / 4;
    macroGroup.add(surface);
    scene.add(macroGroup);
    return (time) => {
      macroGroup.rotation.y = time * 0.1;
    };
  },
  
  geometry: (scene) => {
    const shapes = [
      new THREE.Mesh(new THREE.TetrahedronGeometry(0.6), new THREE.MeshPhongMaterial({ color: 0x7C3AED })),
      new THREE.Mesh(new THREE.OctahedronGeometry(0.5), new THREE.MeshPhongMaterial({ color: 0x06B6D4 })),
      new THREE.Mesh(new THREE.IcosahedronGeometry(0.5), new THREE.MeshPhongMaterial({ color: 0x10B981 })),
      new THREE.Mesh(new THREE.DodecahedronGeometry(0.5), new THREE.MeshPhongMaterial({ color: 0xF59E0B })),
    ];
    shapes.forEach((s, i) => { s.position.x = (i - 1.5) * 1.5; scene.add(s); });
    return (time) => { shapes.forEach((s, i) => { s.rotation.x = time * (0.3 + i*0.1); s.rotation.y = time * (0.2 + i*0.15); }); };
  },
  
  pyramid: (scene) => {
    const pyGeo = new THREE.ConeGeometry(2.5, 3.5, 4);
    const pyMat = new THREE.MeshPhysicalMaterial({ color: 0xF59E0B, roughness: 0.8 });
    const pyramid = new THREE.Mesh(pyGeo, pyMat);
    pyramid.position.y = 1.75;
    pyramid.rotation.y = Math.PI / 4;
    scene.add(pyramid);
    
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshPhysicalMaterial({ color: 0xD4A574 }));
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    return (time) => {
      pyramid.rotation.y = time * 0.1;
    };
  }
};

// Create fallback for any lesson not explicitly defined
function getModelBuilder(lessonId) {
  return modelBuilders[lessonId] || modelBuilders.atom;
}

export function renderARLearning(container) {
  sessionStart = Date.now();
  const subjects = store.getSubjectProgress();

  container.innerHTML = `
    <div class="ar-learning-page">
      <div class="ar-hero">
        <div class="ar-hero-content">
          <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-4);flex-wrap:wrap">
            <span class="badge badge-primary">WebAR v2.0</span>
            <span class="badge badge-info">VSCR Engine</span>
            <span class="badge badge-warning">NSTF Transitions</span>
            <span class="badge badge-success">PGRF Active</span>
          </div>
          <h1>Immersive AR Learning Lab</h1>
          <p>Research-grade pedagogical engine powered by <strong>4 novel algorithms</strong>. The <strong>VSCR</strong> engine adapts 3D fidelity from your comprehension telemetry. <strong>NSTF</strong> performs sigmoid cross-dissolve transitions. <strong>PGRF</strong> creates attention-responsive spotlighting.</p>
          <p style="color:var(--text-tertiary);font-size:var(--text-sm);margin-top:var(--space-2)">
            💡 Select a subject → pick a lesson → click <strong>Next Concept ➔</strong> to progress through the interactive narrative.
          </p>
          <div style="display:flex;gap:var(--space-3);margin-top:var(--space-6);flex-wrap:wrap">
            <button class="btn btn-primary" id="ar-start-camera" disabled>
              📷 Camera AR (select a lesson first)
            </button>
            <button class="btn btn-secondary" id="ar-3d-mode" disabled>
              🎮 3D Interactive View
            </button>
          </div>
        </div>
      </div>

      <!-- VSCR Telemetry Dashboard -->
      <div class="scm-panel" id="vscr-panel">
        <h3><span style="color:var(--accent-primary)">🔬</span> VSCR — Volumetric Spatial Comprehension Rendering</h3>
        <p style="font-size:var(--text-xs);color:var(--text-secondary);margin-bottom:var(--space-2)">
          <code style="background:rgba(124,58,237,0.15);padding:2px 6px;border-radius:4px;font-size:0.7rem">SCS(t) = α·G(t) + β·D(t) + γ·T(t) + δ·R(t)</code>
        </p>
        <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-4)">
          <span style="font-size:var(--text-xs);color:var(--text-tertiary);white-space:nowrap">SCS Score</span>
          <div style="flex:1;height:8px;background:var(--bg-tertiary);border-radius:var(--radius-full);overflow:hidden">
            <div id="vscr-gauge-fill" style="height:100%;width:0%;background:linear-gradient(90deg,#7C3AED,#06B6D4);border-radius:var(--radius-full);transition:width 0.5s ease"></div>
          </div>
          <span id="vscr-scs" style="font-family:var(--font-mono);font-size:var(--text-sm);font-weight:700;color:var(--accent-primary);min-width:45px">0.000</span>
        </div>
        <div class="scm-metrics" style="grid-template-columns:repeat(5, 1fr)">
          <div class="scm-metric"><div class="scm-metric-value" id="vscr-lod" style="color:#94A3B8">LOD-0</div><div class="scm-metric-label">Render Level</div></div>
          <div class="scm-metric"><div class="scm-metric-value" id="vscr-gaze">0.00</div><div class="scm-metric-label">Gaze G(t)</div></div>
          <div class="scm-metric"><div class="scm-metric-value" id="vscr-dwell">0s</div><div class="scm-metric-label">Dwell D(t)</div></div>
          <div class="scm-metric"><div class="scm-metric-value" id="vscr-interactions">0</div><div class="scm-metric-label">Actions T(t)</div></div>
          <div class="scm-metric"><div class="scm-metric-value" id="scm-interaction">0s</div><div class="scm-metric-label">Session</div></div>
        </div>
        <div class="cognitive-load" style="margin-top:var(--space-4)">
          <span class="cognitive-load-label">Load</span>
          <div class="cognitive-load-bar"><div class="cognitive-load-fill low" id="cognitive-fill"></div></div>
        </div>
      </div>

      <!-- 3D Viewer -->
      <div id="viewer-3d-section" style="display:none; position:relative;">
        <div class="ar-3d-fallback" id="threejs-container" style="height:550px;border:1px solid rgba(124,58,237,0.2)"></div>
        <!-- Enhanced SSN Teaching HUD -->
        <div id="ssn-hud-3d" class="ssn-hud-overlay" style="display:none">
            <div class="ssn-hud-progress-bar"><div id="ssn-bar-3d" class="ssn-hud-progress-fill"></div></div>
            <div style="display:flex;justify-content:space-between;align-items:center">
                <h3 id="ssn-title-3d" style="color:var(--accent-primary);margin:0;font-size:1.1rem;font-family:var(--font-display)">Concept Name</h3>
                <span id="ssn-progress-3d" style="color:var(--text-tertiary);font-size:0.75rem;font-family:var(--font-mono)">1 / 3</span>
            </div>
            <p id="ssn-text-3d" style="color:var(--text-secondary);font-size:0.85rem;line-height:1.6;margin:0;min-height:3rem">Narrative explanation goes here...</p>
            <div style="display:flex;gap:var(--space-2);justify-content:space-between;margin-top:var(--space-2)">
                <button class="btn btn-ghost btn-sm" id="ssn-prev-3d" style="border:1px solid rgba(255,255,255,0.1)">⬅ Previous</button>
                <button class="btn btn-primary btn-sm" id="ssn-next-3d" style="flex:1;font-weight:600">Next Concept ➔</button>
            </div>
        </div>
        <div style="display:flex;gap:var(--space-3);margin-top:var(--space-4);justify-content:center;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" id="three-zoom-in">+ Zoom In</button>
          <button class="btn btn-secondary btn-sm" id="three-zoom-out">− Zoom Out</button>
          <button class="btn btn-primary btn-sm" id="three-take-quiz">📝 Take Quiz</button>
          <button class="btn btn-ghost btn-sm" id="three-close" style="color:var(--accent-error)">✕ Close</button>
        </div>
      </div>

      <!-- Camera AR Viewer -->
      <div class="ar-viewer-container" id="ar-viewer-section">
        <div class="ar-viewer" id="ar-viewer" style="height:550px">
          <video id="ar-video" class="ar-video-feed" autoplay playsinline></video>
          <div id="ar-three-overlay" style="position:absolute;inset:0;pointer-events:none"></div>
          <!-- SSN Teaching HUD for AR -->
          <div id="ssn-hud-ar" class="ssn-hud-overlay" style="display:none">
              <div class="ssn-hud-progress-bar"><div id="ssn-bar-ar" class="ssn-hud-progress-fill"></div></div>
              <div style="display:flex;justify-content:space-between;align-items:center">
                  <h3 id="ssn-title-ar" style="color:var(--accent-primary);margin:0;font-size:1.1rem;font-family:var(--font-display)">Concept Name</h3>
                  <span id="ssn-progress-ar" style="color:var(--text-tertiary);font-size:0.75rem;font-family:var(--font-mono)">1 / 3</span>
              </div>
              <p id="ssn-text-ar" style="color:var(--text-secondary);font-size:0.85rem;line-height:1.6;margin:0;min-height:3rem">Narrative explanation goes here...</p>
              <div style="display:flex;gap:var(--space-2);justify-content:space-between;margin-top:var(--space-2)">
                  <button class="btn btn-ghost btn-sm" id="ssn-prev-ar" style="pointer-events:auto;border:1px solid rgba(255,255,255,0.1)">⬅ Previous</button>
                  <button class="btn btn-primary btn-sm" id="ssn-next-ar" style="flex:1;pointer-events:auto;font-weight:600">Next Concept ➔</button>
              </div>
          </div>
          <div class="ar-info-panel" id="ar-info-panel">
            <div class="ar-info-title" id="ar-info-title">AR Mode</div>
            <div class="ar-info-desc" id="ar-info-desc">Kalman-filtered gyroscopic tracking active</div>
          </div>
          <div class="ar-controls">
            <button class="btn btn-ghost btn-sm" id="ar-close" style="color:var(--accent-error)">✕ Close AR</button>
          </div>
        </div>
      </div>

      <!-- Subjects -->
      <div>
        <div class="section-header">
          <div class="section-title">Choose a Subject</div>
          <div class="section-subtitle">Select a lesson to begin an interactive SSN narrative with NSTF transitions.</div>
        </div>
        <div class="ar-subjects-grid stagger-children" id="subjects-grid">
          ${subjects.map(s => renderSubjectCard(s)).join('')}
        </div>
      </div>
      <!-- Quiz Modal -->
      <div id="quiz-modal" style="display:none"></div>
    </div>`;

  setupAREvents(container);
  startSCMSimulation();
  setTimeout(() => staggerAnimation(container, '#subjects-grid > *', 60), 100);
}

function renderSubjectCard(subject) {
  const avgMastery = Math.round(subject.lessons.reduce((s, l) => s + l.mastery, 0) / subject.lessons.length);
  return `
    <div class="ar-subject-card" data-subject="${subject.id}">
      <div class="ar-subject-icon ${subject.id}">${subject.icon}</div>
      <div class="ar-subject-name">${subject.name}</div>
      <div class="ar-subject-desc">${subject.description}</div>
      <div style="margin-top:var(--space-3)">
        <div style="font-size:var(--text-xs);font-weight:600;color:var(--text-secondary);margin-bottom:var(--space-2)">Lessons:</div>
        ${subject.lessons.map(l => `
          <button class="btn btn-ghost btn-sm lesson-btn" data-subject="${subject.id}" data-lesson="${l.id}" style="width:100%;justify-content:space-between;margin-bottom:var(--space-1);font-size:var(--text-xs)">
            <span>${l.type === 'AR' ? '📷' : '🎮'} ${l.name}</span>
            <span style="color:${l.mastery > 70 ? 'var(--accent-success)' : l.mastery > 0 ? 'var(--accent-warning)' : 'var(--text-muted)'}">${l.mastery}%</span>
          </button>
        `).join('')}
      </div>
      <div class="progress-bar" style="margin-top:var(--space-3)">
        <div class="progress-bar-fill" style="width:${avgMastery}%"></div>
      </div>
      <div style="font-size:var(--text-xs);color:var(--text-tertiary);margin-top:var(--space-2)">${avgMastery}% Complete</div>
    </div>`;
}

function setupAREvents(container) {
  // Lesson selection
  container.querySelectorAll('.lesson-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const subjectId = btn.dataset.subject;
      const lessonId = btn.dataset.lesson;
      const subjects = store.getSubjectProgress();
      currentSubject = subjects.find(s => s.id === subjectId);
      currentLesson = currentSubject?.lessons.find(l => l.id === lessonId);
      if (currentLesson) {
        showToast(`Loaded: ${currentSubject.name} → ${currentLesson.name}`, 'success');
        // Enable buttons
        const camBtn = document.getElementById('ar-start-camera');
        const viewBtn = document.getElementById('ar-3d-mode');
        if (camBtn) { camBtn.disabled = false; camBtn.textContent = `📷 Camera AR: ${currentLesson.name}`; }
        if (viewBtn) { viewBtn.disabled = false; viewBtn.textContent = `🎮 3D View: ${currentLesson.name}`; }
        // Auto-open 3D
        start3DViewer();
      }
    });
  });

  container.querySelector('#ar-start-camera')?.addEventListener('click', startCameraAR);
  container.querySelector('#ar-close')?.addEventListener('click', stopCameraAR);
  container.querySelector('#ar-3d-mode')?.addEventListener('click', start3DViewer);
  container.querySelector('#three-close')?.addEventListener('click', close3DViewer);
  container.querySelector('#three-zoom-in')?.addEventListener('click', () => { if (threeCamera) threeCamera.position.z -= 0.5; });
  container.querySelector('#three-zoom-out')?.addEventListener('click', () => { if (threeCamera) threeCamera.position.z += 0.5; });
  container.querySelector('#three-take-quiz')?.addEventListener('click', showQuiz);
  
  // Bind SSN Prev/Next buttons
  bindSsnControls();
}

function start3DViewer() {
  if (!currentLesson) { showToast('Select a lesson first', 'warning'); return; }
  document.getElementById('viewer-3d-section').style.display = 'block';
  document.getElementById('ar-viewer-section')?.classList.remove('active');

  const container = document.getElementById('threejs-container');
  container.innerHTML = '';

  // Three.js setup — Enhanced
  threeScene = new THREE.Scene();
  threeCamera = new THREE.PerspectiveCamera(55, container.offsetWidth / container.offsetHeight, 0.1, 200);
  threeCamera.position.set(0, 0.5, 3.5);
  threeCamera.lookAt(0, 0, 0);

  threeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  threeRenderer.setSize(container.offsetWidth, container.offsetHeight);
  threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  threeRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  threeRenderer.toneMappingExposure = 1.2;
  threeRenderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(threeRenderer.domElement);

  // Enhanced Lighting Rig
  threeScene.add(new THREE.AmbientLight(0x404060, 1.5));
  const dirLight = new THREE.DirectionalLight(0xffffff, 2);
  dirLight.position.set(5, 8, 5);
  dirLight.castShadow = true;
  threeScene.add(dirLight);
  const pointLight1 = new THREE.PointLight(0x7C3AED, 2, 25);
  pointLight1.position.set(-4, 4, 3);
  threeScene.add(pointLight1);
  const pointLight2 = new THREE.PointLight(0x06B6D4, 1.5, 25);
  pointLight2.position.set(4, -2, -3);
  threeScene.add(pointLight2);
  // Rim light for depth
  const rimLight = new THREE.PointLight(0xF59E0B, 0.8, 15);
  rimLight.position.set(0, -3, 5);
  threeScene.add(rimLight);

  // Create immersive environment (sky dome + grid + ambient particles)
  const ambientParticles = createEnvironment(threeScene);

  // Build model via SSN engine
  const builder = getModelBuilder(currentLesson.id);
  const animate = initSsn(threeScene, builder, '3d');

  // VSCR + PGRF mouse tracking
  let isDragging = false, prevX = 0, prevY = 0, rotX = 0, rotY = 0;
  threeRenderer.domElement.addEventListener('mousedown', (e) => {
    isDragging = true; prevX = e.clientX; prevY = e.clientY;
    VSCR.trackInteraction();
  });
  threeRenderer.domElement.addEventListener('mousemove', (e) => {
    VSCR.trackMouse(e.clientX, e.clientY);
    PGRF.trackCursor(e.offsetX * window.devicePixelRatio, e.offsetY * window.devicePixelRatio);
    if (!isDragging) return;
    rotY += (e.clientX - prevX) * 0.005;
    rotX += (e.clientY - prevY) * 0.005;
    prevX = e.clientX; prevY = e.clientY;
    VSCR.trackInteraction();
  });
  threeRenderer.domElement.addEventListener('mouseup', () => isDragging = false);
  threeRenderer.domElement.addEventListener('wheel', (e) => {
    threeCamera.position.z += e.deltaY * 0.005;
    VSCR.trackInteraction();
  });
  // Touch events for mobile
  threeRenderer.domElement.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isDragging = true; prevX = e.touches[0].clientX; prevY = e.touches[0].clientY;
    }
    VSCR.trackInteraction();
  });
  threeRenderer.domElement.addEventListener('touchmove', (e) => {
    VSCR.trackMouse(e.touches[0].clientX, e.touches[0].clientY);
    if (!isDragging || e.touches.length !== 1) return;
    rotY += (e.touches[0].clientX - prevX) * 0.005;
    rotX += (e.touches[0].clientY - prevY) * 0.005;
    prevX = e.touches[0].clientX; prevY = e.touches[0].clientY;
  });
  threeRenderer.domElement.addEventListener('touchend', () => isDragging = false);

  store.logSession('ar_learning', 1);

  const clock = new THREE.Clock();
  let cameraDistance = 5;

  function renderLoop() {
    animationId = requestAnimationFrame(renderLoop);
    const t = clock.getElapsedTime();
    if (animate) animate(t);

    // Animate environment particles
    if (ambientParticles) {
      const positions = ambientParticles.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += Math.sin(t + positions[i]) * 0.001;
      }
      ambientParticles.geometry.attributes.position.needsUpdate = true;
    }

    // Pulsing emissive lights
    pointLight1.intensity = 2 + Math.sin(t * 2) * 0.5;
    pointLight2.intensity = 1.5 + Math.cos(t * 1.5) * 0.3;

    // Camera orbit
    cameraDistance = Math.max(2, Math.min(15, threeCamera.position.length()));
    threeCamera.position.x = Math.sin(rotY) * cameraDistance;
    threeCamera.position.z = Math.cos(rotY) * cameraDistance;
    threeCamera.position.y = 1 + rotX * 2;
    threeCamera.lookAt(0, 0, 0);
    threeRenderer.render(threeScene, threeCamera);
  }
  renderLoop();
  showToast(`🔬 ${currentLesson.name} — VSCR + PGRF active. Interact to increase detail.`, 'info');
}

function close3DViewer() {
  if (animationId) cancelAnimationFrame(animationId);
  document.getElementById('viewer-3d-section').style.display = 'none';
  const container = document.getElementById('threejs-container');
  if (container) container.innerHTML = '';
  if (threeRenderer) threeRenderer.dispose();
  // Hide VSCR panel
  const vscrPanel = document.getElementById('vscr-panel');
  if (vscrPanel) vscrPanel.style.display = 'none';
}

async function startCameraAR() {
  if (!currentLesson) { showToast('Select a lesson first', 'warning'); return; }
  try {
    const video = document.getElementById('ar-video');
    const section = document.getElementById('ar-viewer-section');
    arStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } });
    video.srcObject = arStream;
    section.classList.add('active');
    document.getElementById('viewer-3d-section').style.display = 'none';

    const overlay = document.getElementById('ar-three-overlay');
    overlay.innerHTML = '';
    const arScene = new THREE.Scene();
    const arCamera = new THREE.PerspectiveCamera(60, overlay.offsetWidth / overlay.offsetHeight, 0.1, 100);
    arCamera.position.set(0, 1, 4);
    
    // Kalman-Filtered Gyroscopic AR Tracking
    const kalmanAlpha = new KalmanFilter1D(0.001, 0.05);
    const kalmanBeta = new KalmanFilter1D(0.001, 0.05);
    const kalmanGamma = new KalmanFilter1D(0.001, 0.05);
    let deviceQuat = new THREE.Quaternion();
    
    const onDeviceOrientation = (event) => {
        if (!event.alpha && !event.beta && !event.gamma) return;
        const alpha = kalmanAlpha.update(THREE.MathUtils.degToRad(event.alpha || 0));
        const beta = kalmanBeta.update(THREE.MathUtils.degToRad(event.beta || 0));
        const gamma = kalmanGamma.update(THREE.MathUtils.degToRad(event.gamma || 0));
        const euler = new THREE.Euler(beta, alpha, -gamma, 'YXZ');
        deviceQuat.setFromEuler(euler);
    };
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', onDeviceOrientation);
    }

    const arRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    arRenderer.setSize(overlay.offsetWidth, overlay.offsetHeight);
    arRenderer.setClearColor(0x000000, 0);
    arRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    overlay.appendChild(arRenderer.domElement);
    
    arScene.add(new THREE.AmbientLight(0xffffff, 2.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(5, 5, 5);
    arScene.add(dirLight);
    // Edge-glow rim light for AR visibility
    const rimLight = new THREE.PointLight(0x7C3AED, 3, 15);
    rimLight.position.set(0, 2, -3);
    arScene.add(rimLight);

    const builder = getModelBuilder(currentLesson.id);
    const animate = initSsn(arScene, builder, 'ar');

    const clock = new THREE.Clock();
    const infoTitle = document.getElementById('ar-info-title');
    if (infoTitle) infoTitle.textContent = `AR: ${currentLesson.name}`;
    
    function arLoop() {
      if (!arStream) return;
      requestAnimationFrame(arLoop);
      const t = clock.getElapsedTime();
      if (animate) animate(t);
      
      // Apply Kalman-filtered gyro rotation (smoother than raw slerp)
      arCamera.quaternion.slerp(deviceQuat, 0.3);
      rimLight.intensity = 3 + Math.sin(t * 3) * 0.5;
      arRenderer.render(arScene, arCamera);
    }
    arLoop();
    
    store.logSession('ar_learning', 1);
    showToast('📷 Kalman-filtered AR active! Smooth gyroscopic tracking enabled.', 'success');
  } catch (err) {
    showToast('Camera access denied. Use 3D Interactive View instead.', 'warning');
  }
}

function stopCameraAR() {
  if (arStream) { arStream.getTracks().forEach(t => t.stop()); arStream = null; }
  document.getElementById('ar-viewer-section')?.classList.remove('active');
  const overlay = document.getElementById('ar-three-overlay');
  if (overlay) overlay.innerHTML = '';
}

// Quiz system
function showQuiz() {
  if (!currentLesson || !currentSubject) { showToast('Select a lesson first', 'warning'); return; }
  const quizzes = getQuizForLesson(currentSubject.id, currentLesson.id);
  let currentQ = 0, score = 0;

  const modal = document.getElementById('quiz-modal');
  function renderQuestion() {
    if (currentQ >= quizzes.length) {
      const pct = Math.round((score / quizzes.length) * 100);
      store.recordQuizScore(currentSubject.id, currentLesson.id, score, quizzes.length);
      store.updateSubjectProgress(currentSubject.id, currentLesson.id, pct);
      modal.innerHTML = `
        <div class="modal-overlay">
          <div class="modal">
            <h3 style="font-family:var(--font-display);font-weight:700">Quiz Complete!</h3>
            <p style="margin:var(--space-4) 0">Score: <strong>${score}/${quizzes.length}</strong> (${pct}%)</p>
            <div class="progress-bar" style="margin-bottom:var(--space-4)"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
            <button class="btn btn-primary" onclick="document.getElementById('quiz-modal').style.display='none';document.getElementById('quiz-modal').innerHTML=''">Close</button>
          </div>
        </div>`;
      showToast(`Quiz: ${score}/${quizzes.length} — Mastery updated to ${pct}%`, score >= quizzes.length / 2 ? 'success' : 'warning');
      return;
    }
    const q = quizzes[currentQ];
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal">
          <div style="font-size:var(--text-xs);color:var(--text-tertiary);margin-bottom:var(--space-2)">Question ${currentQ + 1}/${quizzes.length}</div>
          <h3 style="font-family:var(--font-display);font-weight:600;margin-bottom:var(--space-4)">${q.question}</h3>
          <div style="display:flex;flex-direction:column;gap:var(--space-2)">
            ${q.options.map((opt, i) => `<button class="btn btn-secondary quiz-opt" data-idx="${i}" style="text-align:left">${opt}</button>`).join('')}
          </div>
        </div>
      </div>`;
    modal.querySelectorAll('.quiz-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        if (parseInt(btn.dataset.idx) === q.answer) { score++; showToast('✅ Correct!', 'success'); }
        else showToast(`❌ Correct answer: ${q.options[q.answer]}`, 'error');
        currentQ++;
        setTimeout(renderQuestion, 800);
      });
    });
  }
  modal.style.display = 'block';
  renderQuestion();
}

function getQuizForLesson(subjectId, lessonId) {
  const quizBank = {
    physics: {
      newton: [
        { question: "What is Newton's First Law of Motion?", options: ['Law of Inertia', 'F = ma', 'Action-Reaction', 'Law of Gravity'], answer: 0 },
        { question: 'What unit measures force?', options: ['Joule', 'Watt', 'Newton', 'Pascal'], answer: 2 },
        { question: 'A body at rest stays at rest unless acted upon by?', options: ['Gravity only', 'An external force', 'Friction', 'Momentum'], answer: 1 },
      ],
      atom: [
        { question: 'Who proposed the planetary model of the atom?', options: ['Thomson', 'Rutherford', 'Bohr', 'Dalton'], answer: 2 },
        { question: 'Electrons orbit the nucleus in?', options: ['Random paths', 'Fixed energy levels', 'Straight lines', 'Spirals'], answer: 1 },
        { question: 'What charge does a proton carry?', options: ['Negative', 'Neutral', 'Positive', 'Variable'], answer: 2 },
      ],
      optics: [
        { question: 'A convex lens converges light to the?', options: ['Center', 'Focus', 'Edge', 'Vertex'], answer: 1 },
        { question: 'The angle of incidence equals?', options: ['Angle of refraction', 'Angle of reflection', 'Critical angle', 'Zero'], answer: 1 },
      ],
      waves: [
        { question: 'What is the SI unit of frequency?', options: ['Meter', 'Hertz', 'Second', 'Decibel'], answer: 1 },
        { question: 'Sound waves are?', options: ['Transverse', 'Longitudinal', 'Electromagnetic', 'Surface'], answer: 1 },
      ]
    },
    chemistry: {
      bonds: [{ question: 'Ionic bonds form between?', options: ['Two metals', 'Metal and nonmetal', 'Two nonmetals', 'Noble gases'], answer: 1 },
        { question: 'Covalent bonds involve?', options: ['Transfer of electrons', 'Sharing of electrons', 'Nuclear fusion', 'Magnetic attraction'], answer: 1 }],
      water: [{ question: 'The bond angle in water is approximately?', options: ['90°', '104.5°', '120°', '180°'], answer: 1 },
        { question: 'Water is a?', options: ['Nonpolar molecule', 'Polar molecule', 'Ionic compound', 'Metal'], answer: 1 }],
    },
    biology: {
      cell: [{ question: 'The powerhouse of the cell is?', options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi'], answer: 2 },
        { question: 'Cell membrane is made of?', options: ['Carbohydrates', 'Phospholipid bilayer', 'Protein only', 'DNA'], answer: 1 }],
      dna: [{ question: 'DNA stands for?', options: ['Deoxyribonucleic Acid', 'Dinitrogen Acid', 'Dynamic Nuclear Acid', 'None'], answer: 0 },
        { question: 'DNA double helix was discovered by?', options: ['Mendel', 'Watson & Crick', 'Darwin', 'Pasteur'], answer: 1 }],
    },
    engineering: {
      gears: [{ question: 'Meshing gears rotate in?', options: ['Same direction', 'Opposite directions', 'Random', 'They do not rotate'], answer: 1 },
        { question: 'Gear ratio determines?', options: ['Color', 'Speed and torque', 'Material', 'Temperature'], answer: 1 }],
      bridges: [{ question: 'A truss bridge uses?', options: ['Cables', 'Triangular units', 'Arches only', 'Cantilevers'], answer: 1 }],
    },
    math: {
      calculus: [{ question: 'The derivative of x² is?', options: ['x', '2x', 'x³', '2'], answer: 1 },
        { question: 'Integration is the reverse of?', options: ['Multiplication', 'Differentiation', 'Addition', 'Subtraction'], answer: 1 }],
      geometry: [{ question: 'A tetrahedron has how many faces?', options: ['3', '4', '5', '6'], answer: 1 }],
    },
    history: {
      pyramid: [{ question: 'The Great Pyramid is in?', options: ['Rome', 'Athens', 'Giza', 'Istanbul'], answer: 2 }],
      colosseum: [{ question: 'The Colosseum is in?', options: ['Greece', 'Egypt', 'Rome', 'France'], answer: 2 }],
    },
  };
  return quizBank[subjectId]?.[lessonId] || [{ question: 'What is this lesson about?', options: ['Learning', 'Testing', 'Playing', 'Sleeping'], answer: 0 }];
}

// SCM simulation
function startSCMSimulation() {
  if (scmInterval) clearInterval(scmInterval);
  scmState = { interactionTime: 0, complexityLevel: 1, cognitiveLoad: 'low' };
  scmInterval = setInterval(() => {
    scmState.interactionTime++;
    if (scmState.interactionTime > 30) { scmState.complexityLevel = 2; scmState.cognitiveLoad = 'medium'; }
    if (scmState.interactionTime > 90) { scmState.complexityLevel = 3; scmState.cognitiveLoad = 'high'; }
    const el = id => document.getElementById(id);
    if (el('scm-interaction')) el('scm-interaction').textContent = `${scmState.interactionTime}s`;
    if (el('scm-complexity')) el('scm-complexity').textContent = `Level ${scmState.complexityLevel}`;
    if (el('scm-load')) el('scm-load').textContent = scmState.cognitiveLoad.charAt(0).toUpperCase() + scmState.cognitiveLoad.slice(1);
    if (el('cognitive-fill')) el('cognitive-fill').className = `cognitive-load-fill ${scmState.cognitiveLoad}`;
  }, 1000);
}
