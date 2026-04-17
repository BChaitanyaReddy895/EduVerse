/**
 * AR Learning Module v4.0 — Complete Pipeline UI
 * 
 * Provides the full user-facing interface for the Semantic-to-Spatial Cognitive Visualization System:
 *  1. Image Upload (drag & drop / file select / concept gallery)
 *  2. Pipeline Progress Dashboard (CLIP → Concept → Model → Layers → Render)
 *  3. Three.js 3D Viewport with OrbitControls
 *  4. Cognitive Layer Controls (toggle: Structure / Function / Interaction / Behavior / Simulation)
 *  5. Learner Level Selector (Beginner → Expert)
 *  6. Concept Info Panel with adaptive explanations
 *  7. System Stats Dashboard
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SemanticCognitiveARSystem } from '../utils/semantic-cognitive-ar.js';
import { store } from '../utils/data-store.js';

// ============================================================
//  STATE
// ============================================================

let arSystem = null;
let scene = null;
let camera = null;
let renderer = null;
let controls = null;
let currentModel = null;
let currentVisualization = null;
let animationFrameId = null;
let clock = null;
let activeLayers = { STRUCTURE: true, FUNCTION: true, INTERACTION: true, BEHAVIOR: true, SIMULATION: true };
let currentLevel = 'INTERMEDIATE';
let isInitialized = false;
let containerRef = null;

// Raycasting State
let raycaster = null;
let mouse = null;
let originalMaterials = new Map();

// SCCA Engineering Lexicon
const LEXICON = {
    'Fuselage': 'The main body of the aircraft, holding passenger and cargo payloads while offering aerodynamic structure.',
    'Wings': 'Generates lift by utilizing aerodynamic pressure differences as the vehicle thrusts forward.',
    'Tail': 'Provides essential stability and directional control during atmospheric flight.',
    'Jet engine': 'Draws in air, compresses it, ignites fuel, and blasts it out the back to generate massive forward thrust.',
    'Cockpit': 'The control center where pilots manage navigation, communication, and mechanical systems.',
    'Chassis': 'The structural framework that supports the entire vehicle load and mounting points.',
    'Tires': 'Provides traction, shock absorption, and directional friction against the road surface.',
    'Engine block': 'Houses the internal combustion cylinders where fuel explosions create kinetic energy.',
    'Transmission': 'Adapts the output of the engine to the drive wheels using complex gear ratios.',
    'Cab': 'The operator cabin protecting the driver and housing vehicle telemetry systems.',
    'Trailer': 'A massive rear enclosure designed strictly for towing high volumes of physical freight.',
    'Heavy engine': 'A highly torqued diesel power block optimized for pulling massive structural weight.',
    'Hull': 'The watertight body of the ship that displaces fluid to create buoyancy.',
    'Deck': 'The primary horizontal surface above the hull for operational navigation and payload mounting.',
    'Diesel engine': 'The massive internal combustion generator that provides long-distance marine propulsion.',
    'Propeller': 'Converts rotational motion from the engine into hydraulic thrust to push the vessel forward.'
};

// ============================================================
//  INITIALIZE
// ============================================================

export async function initializeARLearning() {
  try {
    arSystem = new SemanticCognitiveARSystem();
    clock = new THREE.Clock();
    console.log('[AR Learning] Module created — will initialize on render');
  } catch (error) {
    console.error('[AR Learning] Module creation failed:', error);
  }
}

// ============================================================
//  RENDER — Main Entry Point
// ============================================================

export function renderARLearning(container) {
  if (!container) return;
  containerRef = container;

  container.innerHTML = `
    <div class="ar-learning-page" id="ar-learning-root">

      <!-- ════ HERO + TITLE ════ -->
      <div class="ar-hero">
        <div class="ar-hero-content">
          <h1>🔬 Cognitive AR Visualization</h1>
          <p>Upload an image or select a concept — our AI identifies it, generates a 3D model, and creates interactive cognitive layers for deep learning.</p>
        </div>
      </div>

      <!-- ════ MAIN GRID ════ -->
      <div class="ar-main-grid">

        <!-- LEFT: Input / Controls -->
        <div class="ar-sidebar">

          <!-- Image Upload -->
          <div class="ar-panel" id="ar-upload-panel">
            <h3><span class="panel-icon">📷</span> Image Input</h3>
            <div class="ar-upload-zone" id="ar-upload-zone">
              <div class="upload-icon">📤</div>
              <p>Drop image here or <span class="upload-link">browse</span></p>
              <span class="upload-hint">JPG, PNG — any photo of a concept</span>
              <input type="file" id="ar-file-input" accept="image/*" hidden />
            </div>
            <div id="ar-image-preview" class="ar-image-preview" style="display:none;">
              <img id="ar-preview-img" src="" alt="Preview" />
              <button class="btn-clear-image" id="ar-clear-image">✕</button>
            </div>
          </div>

          <!-- OR: Direct Concept Selector -->
          <div class="ar-panel" id="ar-concept-gallery">
            <h3><span class="panel-icon">🧠</span> Quick Concepts</h3>
            <div class="concept-chips" id="concept-chips">
              <!-- Filled dynamically -->
            </div>
          </div>

          <!-- Learner Level -->
          <div class="ar-panel" id="ar-level-panel">
            <h3><span class="panel-icon">🎓</span> Learner Level</h3>
            <div class="level-selector" id="level-selector">
              <button data-level="BEGINNER" class="level-btn">Beginner</button>
              <button data-level="INTERMEDIATE" class="level-btn active">Intermediate</button>
              <button data-level="ADVANCED" class="level-btn">Advanced</button>
              <button data-level="EXPERT" class="level-btn">Expert</button>
            </div>
          </div>

          <!-- Cognitive Layer Controls -->
          <div class="ar-panel" id="ar-layers-panel" style="display:none;">
            <h3><span class="panel-icon">🧩</span> Cognitive Layers</h3>
            <div class="layer-toggles" id="layer-toggles">
              <!-- Filled dynamically -->
            </div>
          </div>
        </div>

        <!-- CENTER: 3D Viewport + Pipeline -->
        <div class="ar-viewport-area">

          <!-- Pipeline Progress -->
          <div class="pipeline-stepper" id="pipeline-stepper" style="display:none;">
            <div class="pipeline-step" data-step="clip"><span class="step-dot"></span> CLIP Analysis</div>
            <div class="pipeline-connector"></div>
            <div class="pipeline-step" data-step="concept"><span class="step-dot"></span> Concept Map</div>
            <div class="pipeline-connector"></div>
            <div class="pipeline-step" data-step="model"><span class="step-dot"></span> 3D Model</div>
            <div class="pipeline-connector"></div>
            <div class="pipeline-step" data-step="layers"><span class="step-dot"></span> Cognitive</div>
            <div class="pipeline-connector"></div>
            <div class="pipeline-step" data-step="render"><span class="step-dot"></span> Render</div>
          </div>

          <!-- 3D Viewport -->
          <div class="ar-3d-viewport" id="ar-3d-viewport">
            <div class="viewport-placeholder" id="viewport-placeholder">
              <div class="placeholder-icon">🎯</div>
              <h3>Upload an image or select a concept to begin</h3>
              <p>The AI pipeline will identify the concept and generate an interactive 3D cognitive visualization</p>
              <div class="placeholder-features">
                <span>🔍 CLIP Vision AI</span>
                <span>🧊 Procedural 3D</span>
                <span>🧠 5 Cognitive Layers</span>
                <span>💡 PBR Lighting</span>
              </div>
            </div>
            <!-- Three.js canvas injected here -->
          </div>

          <!-- Concept Info Panel -->
          <div class="concept-info-panel" id="concept-info-panel" style="display:none;">
            <div class="concept-info-header">
              <div class="concept-badge" id="concept-badge">—</div>
              <div class="concept-details">
                <h3 id="concept-name">—</h3>
                <span class="concept-domain" id="concept-domain">—</span>
                <span class="concept-confidence" id="concept-confidence">—</span>
              </div>
            </div>
            <p class="concept-description" id="concept-description">—</p>
            <div class="concept-components" id="concept-components"></div>
          </div>
        </div>

        <!-- RIGHT: Stats -->
        <div class="ar-stats-panel">
          <div class="ar-panel">
            <h3><span class="panel-icon">📊</span> System Stats</h3>
            <div class="stats-grid" id="stats-grid">
              <div class="stat-item">
                <span class="stat-value" id="stat-images">0</span>
                <span class="stat-label">Images Analyzed</span>
              </div>
              <div class="stat-item">
                <span class="stat-value" id="stat-concepts">0</span>
                <span class="stat-label">Concepts Found</span>
              </div>
              <div class="stat-item">
                <span class="stat-value" id="stat-models">0</span>
                <span class="stat-label">3D Models</span>
              </div>
              <div class="stat-item">
                <span class="stat-value" id="stat-time">0ms</span>
                <span class="stat-label">Avg. Time</span>
              </div>
              <div class="stat-item">
                <span class="stat-value" id="stat-clip">—</span>
                <span class="stat-label">CLIP Status</span>
              </div>
              <div class="stat-item">
                <span class="stat-value" id="stat-available">0</span>
                <span class="stat-label">Concepts DB</span>
              </div>
            </div>
          </div>

          <!-- Init Progress -->
          <div class="ar-panel" id="init-progress-panel">
            <h3><span class="panel-icon">⚡</span> Pipeline Init</h3>
            <div class="init-progress">
              <div class="init-bar"><div class="init-fill" id="init-fill" style="width:0%"></div></div>
              <span class="init-label" id="init-label">Starting...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // ── Wire up event listeners ──
  _setupUploadZone();
  _setupLevelSelector();
  _populateConceptChips();
  _initThreeScene();
  _initARSystem();
}

// ============================================================
//  THREE.JS SCENE SETUP
// ============================================================

function _initThreeScene() {
  const viewport = document.getElementById('ar-3d-viewport');
  if (!viewport) return;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a14);

  camera = new THREE.PerspectiveCamera(55, viewport.clientWidth / viewport.clientHeight, 0.01, 100);
  camera.position.set(0, 0.5, 2.5);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setSize(viewport.clientWidth, viewport.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.domElement.style.borderRadius = 'var(--radius-xl)';
  renderer.domElement.style.display = 'none'; // Hidden until model loaded
  viewport.appendChild(renderer.domElement);

  // Initialize Raycaster
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  renderer.domElement.addEventListener('pointerdown', _onPointerDown);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.0;
  controls.minDistance = 0.5;
  controls.maxDistance = 8;
  controls.target.set(0, 0.2, 0);

  // Basic lighting before realism engine
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xfff5e0, 1.0);
  dirLight.position.set(5, 10, 5);
  scene.add(dirLight);

  // Grid helper
  const grid = new THREE.GridHelper(4, 20, 0x222233, 0x111122);
  grid.material.opacity = 0.3;
  grid.material.transparent = true;
  scene.add(grid);

  // Resize handler
  const resizeObserver = new ResizeObserver(() => {
    const w = viewport.clientWidth;
    const h = viewport.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
  resizeObserver.observe(viewport);

  _startRenderLoop();
}

function _startRenderLoop() {
  function animate() {
    animationFrameId = requestAnimationFrame(animate);
    const delta = clock ? clock.getDelta() : 0.016;

    if (controls) controls.update();

    // Animate model
    if (currentModel) {
      _animateModel(currentModel, delta);
    }

    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }
  animate();
}

// ============================================================
//  RAYCASTING INTERACTIVE MESH LOGIC
// ============================================================

function _onPointerDown(event) {
  if (!renderer || !camera || !currentModel) return;

  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(currentModel, true);

  // Restore previous materials
  originalMaterials.forEach((originalMat, mesh) => {
    mesh.material = originalMat;
  });
  originalMaterials.clear();

  if (intersects.length > 0) {
    let clickedMesh = intersects[0].object;
    if (!clickedMesh.name) return;

    // Clean generated names (e.g., "Tires_1" -> "Tires", "Jet engine_2" -> "Jet engine")
    const cleanedName = clickedMesh.name.replace(/_\d+$/, '');

    // Cache original material and apply glowing neon overlay
    originalMaterials.set(clickedMesh, clickedMesh.material);
    clickedMesh.material = new THREE.MeshPhysicalMaterial({
        color: 0x00ffcc, emissive: 0x00aa88, emissiveIntensity: 0.6,
        roughness: 0.1, metalness: 0.8, clearcoat: 1.0
    });

    _showOverlayPanel(event.clientX, event.clientY, cleanedName);
  } else {
    _hideOverlayPanel();
  }
}

function _showOverlayPanel(x, y, partName) {
  let tooltip = document.getElementById('ar-semantic-tooltip');
  if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'ar-semantic-tooltip';
      document.body.appendChild(tooltip);
      Object.assign(tooltip.style, {
          position: 'absolute', background: 'rgba(10, 15, 30, 0.90)',
          border: '1px solid #00ffcc', color: '#fff',
          padding: '16px', borderRadius: '8px', zIndex: '9999',
          boxShadow: '0 8px 32px rgba(0, 255, 204, 0.15)',
          backdropFilter: 'blur(8px)', pointerEvents: 'none',
          maxWidth: '300px', fontFamily: 'Inter, sans-serif',
          transition: 'opacity 0.2s ease', opacity: '0'
      });
  }
  
  const description = LEXICON[partName] || `Functional cognitive geometry isolating the [${partName}] sub-system.`;
  
  tooltip.innerHTML = `
      <div style="font-size: 10px; color: #00ffcc; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; margin-bottom: 6px;">Semantic Attention Hit</div>
      <div style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">${partName}</div>
      <div style="font-size: 13px; color: #aaddcc; line-height: 1.5;">${description}</div>
  `;
  
  tooltip.style.left = (x + 25) + 'px';
  tooltip.style.top = (y - 30) + 'px';
  tooltip.style.display = 'block';
  setTimeout(() => tooltip.style.opacity = '1', 10);
}

function _hideOverlayPanel() {
   const t = document.getElementById('ar-semantic-tooltip');
   if (t) { t.style.opacity = '0'; setTimeout(() => t.style.display = 'none', 200); }
}

function _animateModel(model, delta) {
  if (!model || !model.userData.animationData) return;
  const anim = model.userData.animationData;
  const time = clock ? clock.elapsedTime : 0;

  switch (anim.type) {
    case 'pulse': {
      const scale = 1 + Math.sin(time * anim.rate * Math.PI * 2) * anim.amplitude;
      model.scale.setScalar(scale);
      break;
    }
    case 'rotate': {
      const speed = anim.rate * delta * Math.PI;
      if (anim.groups) {
        model.traverse(child => {
          if (anim.groups.includes(child.name)) {
            child.rotation[anim.axis || 'y'] += speed;
          }
        });
      } else {
        model.rotation[anim.axis || 'y'] += speed;
      }
      break;
    }
    case 'float': {
      model.position.y = 0.2 + Math.sin(time * anim.rate * Math.PI * 2) * anim.amplitude;
      break;
    }
    case 'breathe': {
      const breathe = 1 + Math.sin(time * anim.rate * Math.PI * 2) * anim.amplitude;
      model.scale.set(breathe, 1, breathe);
      break;
    }
    case 'sway': {
      model.rotation.z = Math.sin(time * anim.rate * Math.PI * 2) * anim.amplitude;
      break;
    }
    case 'orbit': {
      model.traverse(child => {
        if (child.userData.orbitRadius) {
          const angle = (child.userData.orbitAngle || 0) + time * (child.userData.orbitSpeed || 0.5);
          const r = child.userData.orbitRadius;
          const tiltX = child.userData.orbitTiltX || 0;
          const tiltY = child.userData.orbitTiltY || 0;
          child.position.x = Math.cos(angle) * r;
          child.position.y = Math.sin(angle) * r * Math.cos(tiltX);
          child.position.z = Math.sin(angle) * r * Math.sin(tiltX);
        }
      });
      break;
    }
    case 'pendulum': {
      model.traverse(child => {
        if (child.name === 'function_pendulum') {
          child.rotation.z = Math.sin(time * anim.rate * Math.PI * 2) * (anim.amplitude || 0.5);
        }
      });
      break;
    }
    case 'reciprocate': {
      if (anim.groups) {
        model.traverse(child => {
          if (anim.groups.includes(child.name)) {
            child.position[anim.axis || 'y'] = Math.sin(time * anim.rate * Math.PI * 2) * (anim.amplitude || 0.2);
          }
        });
      }
      break;
    }
    case 'spring': {
      const springScale = 1 + Math.sin(time * anim.rate * Math.PI * 2) * (anim.amplitude || 0.1);
      model.scale[anim.axis || 'y'] = springScale;
      break;
    }
    case 'vibrate': {
      model.position.x = Math.sin(time * 20) * (anim.amplitude || 0.005);
      model.position.y = Math.cos(time * 25) * (anim.amplitude || 0.005) + 0.2;
      break;
    }
    case 'wiggle': {
      model.rotation.z = Math.sin(time * anim.rate * Math.PI * 4) * (anim.amplitude || 0.05);
      model.position.x = Math.sin(time * anim.rate * Math.PI * 2) * 0.1;
      break;
    }
    case 'glow': {
      if (anim.groups) {
        model.traverse(child => {
          if (child.material && child.material.emissiveIntensity !== undefined) {
            child.material.emissiveIntensity = 0.3 + Math.sin(time * anim.rate * Math.PI * 2) * 0.5;
          }
        });
      }
      break;
    }
    default:
      break;
  }
}

// ============================================================
//  AR SYSTEM INIT
// ============================================================

async function _initARSystem() {
  if (!arSystem) {
    arSystem = new SemanticCognitiveARSystem();
  }

  const initLabel = document.getElementById('init-label');
  const initFill = document.getElementById('init-fill');

  const ok = await arSystem.initialize(scene, camera, renderer, (stage, progress) => {
    if (initLabel) initLabel.textContent = stage;
    if (initFill) initFill.style.width = `${Math.max(0, progress * 100).toFixed(0)}%`;
  });

  if (ok) {
    isInitialized = true;
    const initPanel = document.getElementById('init-progress-panel');
    if (initPanel) {
      initPanel.querySelector('.init-label').textContent = '✓ Ready';
      initPanel.querySelector('.init-fill').style.width = '100%';
      initPanel.querySelector('.init-fill').style.background = 'var(--accent-success, #10B981)';
    }
    _updateStats();
  }
}

// ============================================================
//  UPLOAD ZONE
// ============================================================

function _setupUploadZone() {
  const zone = document.getElementById('ar-upload-zone');
  const fileInput = document.getElementById('ar-file-input');
  const clearBtn = document.getElementById('ar-clear-image');

  if (!zone || !fileInput) return;

  zone.addEventListener('click', () => fileInput.click());

  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) _handleImageFile(file);
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) _handleImageFile(e.target.files[0]);
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      _clearImage();
    });
  }
}

function _handleImageFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    // Show preview
    const previewContainer = document.getElementById('ar-image-preview');
    const previewImg = document.getElementById('ar-preview-img');
    const uploadZone = document.getElementById('ar-upload-zone');
    if (previewContainer && previewImg && uploadZone) {
      previewImg.src = dataUrl;
      previewContainer.style.display = 'block';
      uploadZone.style.display = 'none';
    }
    // Run pipeline
    _processImage(dataUrl);
  };
  reader.readAsDataURL(file);
}

function _clearImage() {
  const previewContainer = document.getElementById('ar-image-preview');
  const uploadZone = document.getElementById('ar-upload-zone');
  if (previewContainer) previewContainer.style.display = 'none';
  if (uploadZone) uploadZone.style.display = '';
  document.getElementById('ar-file-input').value = '';
}

// ============================================================
//  CONCEPT GALLERY CHIPS
// ============================================================

function _populateConceptChips() {
  const container = document.getElementById('concept-chips');
  if (!container) return;

  const concepts = [
    { name: 'heart', emoji: '❤️', color: '#EF4444' },
    { name: 'brain', emoji: '🧠', color: '#A855F7' },
    { name: 'cell', emoji: '🔬', color: '#10B981' },
    { name: 'motor', emoji: '⚡', color: '#F59E0B' },
    { name: 'atom', emoji: '⚛️', color: '#3B82F6' },
    { name: 'dna', emoji: '🧬', color: '#EC4899' },
    { name: 'planet', emoji: '🌍', color: '#06B6D4' },
    { name: 'circuit', emoji: '💡', color: '#8B5CF6' },
    { name: 'gear', emoji: '⚙️', color: '#64748B' },
    { name: 'bridge', emoji: '🌉', color: '#78716C' },
    { name: 'pendulum', emoji: '🔄', color: '#0EA5E9' },
    { name: 'magnet', emoji: '🧲', color: '#DC2626' },
    { name: 'lens', emoji: '🔎', color: '#7C3AED' },
    { name: 'turbine', emoji: '💨', color: '#059669' },
    { name: 'star', emoji: '⭐', color: '#EAB308' },
    { name: 'lung', emoji: '🫁', color: '#F472B6' },
    { name: 'eye', emoji: '👁️', color: '#2563EB' },
    { name: 'plant', emoji: '🌿', color: '#16A34A' },
    { name: 'spring', emoji: '🔩', color: '#94A3B8' },
    { name: 'crystal', emoji: '💎', color: '#818CF8' },
  ];

  container.innerHTML = concepts.map(c => `
    <button class="concept-chip" data-concept="${c.name}" style="--chip-color: ${c.color}">
      <span class="chip-emoji">${c.emoji}</span>
      <span class="chip-name">${c.name}</span>
    </button>
  `).join('');

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.concept-chip');
    if (btn) {
      const concept = btn.dataset.concept;
      // Highlight selected
      container.querySelectorAll('.concept-chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      _processConceptDirect(concept);
    }
  });
}

// ============================================================
//  LEVEL SELECTOR
// ============================================================

function _setupLevelSelector() {
  const container = document.getElementById('level-selector');
  if (!container) return;

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.level-btn');
    if (!btn) return;

    container.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentLevel = btn.dataset.level;

    if (arSystem) arSystem.setLearnerLevel(currentLevel);

    // Re-process if we have an active concept
    if (currentVisualization) {
      _processConceptDirect(currentVisualization.concept.name);
    }
  });
}

// ============================================================
//  PIPELINE: IMAGE → VISUALIZATION
// ============================================================

async function _processImage(dataUrl) {
  if (!isInitialized || !arSystem) {
    console.warn('[AR Learning] System not ready');
    return;
  }

  _showPipelineStepper();
  _setPipelineStep('clip');

  arSystem.onConceptFound = (concept) => {
    _setPipelineStep('concept');
    _updateConceptPanel(concept);
  };

  arSystem.onModelReady = (model3D) => {
    _setPipelineStep('render');
  };

  const result = await arSystem.processImageToVisualization(dataUrl, currentLevel);

  if (result) {
    currentVisualization = result;
    _displayVisualization(result);
    _setPipelineStep('done');
    _showLayerControls(result);
    _updateStats();
    store.logSession('ar_concept_visualized', 30);
  }
}

async function _processConceptDirect(conceptName) {
  if (!isInitialized || !arSystem) {
    console.warn('[AR Learning] System not ready');
    return;
  }

  _showPipelineStepper();
  _setPipelineStep('concept');

  arSystem.onConceptFound = (concept) => {
    _updateConceptPanel(concept);
  };

  arSystem.onModelReady = () => {
    _setPipelineStep('render');
  };

  const result = await arSystem.processConceptDirectly(conceptName, currentLevel);

  if (result) {
    currentVisualization = result;
    _displayVisualization(result);
    _setPipelineStep('done');
    _showLayerControls(result);
    _updateConceptPanel(result.concept);
    _updateStats();
    store.logSession('ar_concept_direct', 30);
  }
}

// ============================================================
//  DISPLAY VISUALIZATION IN 3D VIEWPORT
// ============================================================

function _displayVisualization(result) {
  if (!result || !result.model || !result.model.model3D) return;

  // Remove old model
  if (currentModel) {
    scene.remove(currentModel);
    currentModel = null;
  }

  currentModel = result.model.model3D;

  // Auto-scale model to fit viewport
  const box = new THREE.Box3().setFromObject(currentModel);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim > 0) {
    const scale = 1.5 / maxDim;
    currentModel.scale.multiplyScalar(scale);
  }

  // Center model
  const center = box.getCenter(new THREE.Vector3());
  currentModel.position.sub(center.multiplyScalar(currentModel.scale.x));
  currentModel.position.y = 0.2;

  scene.add(currentModel);

  // Show canvas, hide placeholder
  const placeholder = document.getElementById('viewport-placeholder');
  if (placeholder) placeholder.style.display = 'none';
  if (renderer) renderer.domElement.style.display = 'block';

  // Reset camera to look at model
  controls.target.set(0, 0.3, 0);
  camera.position.set(0, 0.8, 2.5);
  controls.update();
}

// ============================================================
//  PIPELINE STEPPER UI
// ============================================================

function _showPipelineStepper() {
  const stepper = document.getElementById('pipeline-stepper');
  if (stepper) {
    stepper.style.display = 'flex';
    stepper.querySelectorAll('.pipeline-step').forEach(s => {
      s.classList.remove('active', 'done');
    });
  }
}

function _setPipelineStep(step) {
  const stepper = document.getElementById('pipeline-stepper');
  if (!stepper) return;

  const steps = ['clip', 'concept', 'model', 'layers', 'render'];
  const targetIdx = step === 'done' ? steps.length : steps.indexOf(step);

  stepper.querySelectorAll('.pipeline-step').forEach((el, i) => {
    if (i < targetIdx) el.classList.replace('active', 'done') || el.classList.add('done');
    else if (i === targetIdx) el.classList.add('active');
    else { el.classList.remove('active', 'done'); }
  });
}

// ============================================================
//  CONCEPT INFO PANEL
// ============================================================

function _updateConceptPanel(concept) {
  const panel = document.getElementById('concept-info-panel');
  if (!panel || !concept) return;

  panel.style.display = 'flex';

  document.getElementById('concept-badge').textContent = concept.name?.[0]?.toUpperCase() || '?';
  document.getElementById('concept-name').textContent = concept.name || '—';
  document.getElementById('concept-domain').textContent = concept.domain || 'General';
  document.getElementById('concept-confidence').textContent = concept.confidence
    ? `${(concept.confidence * 100).toFixed(0)}% confidence`
    : '';
  document.getElementById('concept-description').textContent = concept.description || '';

  // Components
  const compEl = document.getElementById('concept-components');
  if (compEl && concept.components) {
    if (Array.isArray(concept.components)) {
      compEl.innerHTML = concept.components.map(c =>
        `<span class="component-tag">${c.replace(/_/g, ' ')}</span>`
      ).join('');
    } else {
      let html = '';
      if (concept.components.external) {
        html += `<div class="component-section"><div class="section-title">External Structure:</div><div class="tag-row">${concept.components.external.map(c => `<span class="component-tag external-tag">${c}</span>`).join('')}</div></div>`;
      }
      if (concept.components.internal) {
        html += `<div class="component-section"><div class="section-title">Internal Components:</div><div class="tag-row">${concept.components.internal.map(c => `<span class="component-tag internal-tag">${c}</span>`).join('')}</div></div>`;
      }
      compEl.innerHTML = html;
    }
  }
}

// ============================================================
//  COGNITIVE LAYER CONTROLS
// ============================================================

function _showLayerControls(result) {
  const panel = document.getElementById('ar-layers-panel');
  const container = document.getElementById('layer-toggles');
  if (!panel || !container || !result.cognitiveRepresentation) return;

  panel.style.display = 'block';
  const layers = result.cognitiveRepresentation.layers;

  container.innerHTML = layers.map(layer => `
    <label class="layer-toggle" style="--layer-color: #${(layer.color || 0x888888).toString(16).padStart(6, '0')}">
      <input type="checkbox" data-layer="${layer.type}" checked />
      <span class="toggle-dot"></span>
      <span class="toggle-label">${layer.name || layer.type}</span>
    </label>
  `).join('');

  container.addEventListener('change', (e) => {
    if (e.target.type !== 'checkbox') return;
    const layerType = e.target.dataset.layer;
    const enabled = e.target.checked;
    activeLayers[layerType] = enabled;
    _toggleLayerVisibility(layerType, enabled);
  });
}

function _toggleLayerVisibility(layerType, visible) {
  if (!currentModel) return;

  const prefix = layerType.toLowerCase();
  currentModel.traverse(child => {
    const name = (child.name || '').toLowerCase();
    // Match group names like 'structure_outer', 'function_valves', etc.
    if (name.startsWith(prefix.toLowerCase()) ||
        name.startsWith(`${prefix}_`) ||
        name.includes(`_${prefix}`)) {
      child.visible = visible;
    }
  });
}

// ============================================================
//  STATS
// ============================================================

function _updateStats() {
  if (!arSystem) return;
  const stats = arSystem.getSystemStats();

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  set('stat-images', stats.pipeline.imagesProcessed);
  set('stat-concepts', stats.pipeline.conceptsIdentified);
  set('stat-models', stats.pipeline.modelsRetrieved);
  set('stat-time', `${stats.pipeline.avgProcessingTime.toFixed(0)}ms`);
  set('stat-clip', stats.clip.clipAvailable ? '✓ CLIP' : '⚡ Fallback');
  set('stat-available', stats.concepts.totalConcepts || '—');
}

// ============================================================
//  CLEANUP
// ============================================================

export function destroyARLearning() {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  if (renderer) renderer.dispose();
  if (arSystem) arSystem.dispose();
  currentModel = null;
  currentVisualization = null;
  isInitialized = false;
}

// Expose for external routing
window.enableWebXR = () => console.log('[AR] WebXR would require HTTPS + compatible device');
window.disableWebXR = () => console.log('[AR] No active AR session');
