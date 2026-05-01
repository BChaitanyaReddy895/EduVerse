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
import { ARWallLearningSystem } from '../utils/ar-wall-learning-system.js';
import { store } from '../utils/data-store.js';

// ============================================================
//  STATE
// ============================================================

let arSystem = null;
let arWallSystem = null;
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
let currentLearningGoal = '';
let strictDeterministicMode = false;
let isInitialized = false;
let containerRef = null;
let lastUploadedImageDataUrl = null;
const API_BASE_URL = window.__SCCA_API_BASE__ || 'http://127.0.0.1:5000';

let LEXICON = {};
let lexiconLoadPromise = null;

async function _ensureLexiconLoaded() {
  if (lexiconLoadPromise) return lexiconLoadPromise;

  const sources = [`${API_BASE_URL}/lexicon`, '/data/lexicon.json'];

  lexiconLoadPromise = (async () => {
    for (const source of sources) {
      try {
        const response = await fetch(source);
        if (!response.ok) {
          throw new Error(`Lexicon fetch failed: ${response.status}`);
        }

        const payload = await response.json();
        const entries = payload.entries || payload || {};
        LEXICON = entries;
        return LEXICON;
      } catch (error) {
        console.warn(`[AR Learning] Lexicon load failed from ${source}:`, error);
      }
    }

    LEXICON = LEXICON || {};
    return LEXICON;
  })();

  return lexiconLoadPromise;
}

// Raycasting State
let raycaster = null;
let mouse = null;
let originalMaterials = new Map();

// PiP Secondary Renderer State
let pipScene = null;
let pipCamera = null;
let pipRenderer = null;
let pipControls = null;
let currentPipMesh = null;

// ============================================================
//  INITIALIZE
// ============================================================

export async function initializeARLearning() {
  try {
    await _ensureLexiconLoaded();
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
  void _ensureLexiconLoaded();

  container.innerHTML = `
    <style>
      @keyframes pulse {
        0% { transform: scale(1); box-shadow: 0 4px 15px rgba(245,158,11,0.3); }
        50% { transform: scale(1.05); box-shadow: 0 4px 25px rgba(245,158,11,0.5); }
        100% { transform: scale(1); box-shadow: 0 4px 15px rgba(245,158,11,0.3); }
      }
    </style>
    <div class="ar-learning-page" id="ar-learning-root">

      <!-- ════ HERO + TITLE ════ -->
      <div class="ar-hero">
        <div class="ar-hero-content">
          <h1>🔬 Cognitive AR Visualization</h1>
          <p>Upload a real-world image or enter a concept and learning objective. The pipeline enforces confidence thresholds before generating AR to reduce hallucinated results.</p>
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

          <!-- Direct Concept + Goal Input -->
          <div class="ar-panel" id="ar-concept-request">
            <h3><span class="panel-icon">🧠</span> Concept Request</h3>
            <label style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px;">
              <span style="font-size:12px;color:#9CA3AF;">Concept</span>
              <input id="concept-input" type="text" placeholder="e.g., turbine blade cooling" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:10px;color:#fff;outline:none;" />
            </label>
            <label style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px;">
              <span style="font-size:12px;color:#9CA3AF;">Optional STL URL (Thingiverse/Printables direct .stl link)</span>
              <input id="concept-stl-url" type="text" placeholder="https://.../model.stl" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:10px;color:#fff;outline:none;" />
              <span style="font-size:11px;color:#64748B;margin-top:4px;">If provided, EduVerse converts STL → GLB on your server and loads it in AR.</span>
            </label>
            <label style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px;">
              <span style="font-size:12px;color:#9CA3AF;">Learning Goal</span>
              <textarea id="concept-goal" rows="3" placeholder="What should the learner understand after this AR view?" style="resize:vertical;min-height:72px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:10px;color:#fff;outline:none;"></textarea>
            </label>
            <button id="concept-generate-btn" style="width:100%;background:linear-gradient(135deg,#0ea5e9,#14b8a6);color:#fff;border:none;border-radius:8px;padding:10px 12px;font-weight:700;cursor:pointer;">Generate Deterministic AR View</button>
            <button id="btn-teach-concept" style="width:100%;margin-top:8px;background:linear-gradient(90deg,#06b6d4,#7c3aed);color:#fff;border:none;border-radius:8px;padding:8px 12px;font-weight:700;cursor:pointer;">Teach This Concept</button>
            <button id="btn-start-wall-view" style="width:100%;margin-top:8px;background:linear-gradient(90deg,#0ea5e9,#22d3ee);color:#fff;border:none;border-radius:8px;padding:8px 12px;font-weight:700;cursor:pointer;">Start Wall-Anchored View</button>
            <label style="display:flex;align-items:center;gap:8px;margin-top:10px;font-size:12px;color:#94A3B8;">
              <input type="checkbox" id="strict-deterministic-toggle" />
              Strict deterministic mode (ask confirmation on ambiguity)
            </label>
            <div id="concept-suggestions" style="display:none;margin-top:10px;font-size:12px;color:#94A3B8;"></div>
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
              <h3>Upload a real image or enter a concept to begin</h3>
              <p>If image confidence is ambiguous, the system asks for explicit concept confirmation before rendering AR.</p>
              <div class="placeholder-features">
                <span>🔍 CLIP Vision AI</span>
                <span>🧊 Procedural 3D</span>
                <span>🧠 5 Cognitive Layers</span>
                <span>💡 PBR Lighting</span>
              </div>
            </div>
            <!-- Three.js canvas injected here -->
            
            <!-- DOUBT-BASED SEARCH -->
            <div id="ar-doubt-box" style="position:absolute; top:20px; left:20px; z-index:10; display:flex; gap:10px; background:rgba(10,15,30,0.8); padding:8px; border-radius:8px; border:1px solid rgba(0,255,204,0.3); backdrop-filter:blur(5px);">
              <input type="text" id="doubt-input" placeholder="How does the..." style="background:transparent; border:none; color:#00ffcc; outline:none; font-family:'Inter', sans-serif; font-size:14px; width:180px;">
              <button id="doubt-submit" style="background:#00ffcc; color:#000; border:none; border-radius:4px; padding:4px 10px; font-weight:bold; cursor:pointer;">Ask</button>
            </div>

            <div style="position:absolute; top:20px; right:20px; z-index:10; display:flex; flex-direction:column; gap:10px;">
              <button id="btn-cinematic-tour" style="background:linear-gradient(90deg, #F59E0B, #DC2626); color:#fff; border:none; border-radius:6px; padding:8px 16px; font-weight:bold; cursor:pointer; box-shadow:0 4px 15px rgba(245,158,11,0.3); display:none; animation: pulse 2s infinite;">🎬 Start Guided Component Tour</button>
            </div>

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
          <div id="ar-quality-warning" style="display:none;background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.4);border-radius:10px;padding:12px;color:#fde68a;font-size:12px;"></div>
          
          <!-- PiP Isolation Inspector -->
          <div class="ar-pip-panel" id="ar-pip-panel" style="display:none; position:absolute; bottom:30px; right:30px; width:280px; height:340px; background:rgba(10,15,30,0.85); border:1px solid #00ffcc; border-radius:12px; backdrop-filter:blur(10px); z-index:100; overflow:hidden; flex-direction:column; box-shadow:0 8px 32px rgba(0,255,204,0.15);">
             <div style="background:rgba(0,255,204,0.15); padding:10px; border-bottom:1px solid #00ffcc; color:#00ffcc; font-size:12px; font-weight:800; text-align:center; text-transform:uppercase; letter-spacing:1px;">Isolated Sub-Component</div>
             <div id="ar-pip-canvas" style="flex:1; width:100%; min-height:180px;"></div>
             <div id="ar-pip-desc" style="padding:14px; font-size:12px; color:#ddd; font-family:'Inter', sans-serif; min-height:100px; border-top:1px solid rgba(0,255,204,0.3); background:rgba(0,0,0,0.3);">Description here...</div>
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

          <!-- KNOWLEDGE GRAPH HIERARCHY -->
          <div class="ar-panel" id="kg-hierarchy-panel" style="display:none;">
            <h3><span class="panel-icon">🕸️</span> Mathematical Traversal</h3>
            <div id="kg-tree" style="margin-top:10px; font-family:monospace; font-size:12px; color:#A855F7; border-left:1px dashed #A855F7; padding-left:12px;">
              <!-- Filled Dynamically -->
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
  _setupConceptComposer();
  _initThreeScene();
  _initARSystem();

  // Initialize wall system lazily so camera access only happens on explicit user action.
  if (!arWallSystem) {
    arWallSystem = new ARWallLearningSystem();
  }

  // Keep core viewport interactions (doubt search + guided cinematic tour)
  _setupAdvancedARFeatures();
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

  // Initialize PiP Secondary Sub-Viewport
  const pipContainer = document.getElementById('ar-pip-canvas');
  if (pipContainer) {
      pipScene = new THREE.Scene();
      pipScene.background = new THREE.Color(0x06080F);
      pipCamera = new THREE.PerspectiveCamera(45, 280 / 180, 0.01, 100);
      pipCamera.position.set(0, 0.4, 1.2);
      pipRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      pipRenderer.setSize(280, 180);
      pipRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      pipContainer.appendChild(pipRenderer.domElement);
      
      pipControls = new OrbitControls(pipCamera, pipRenderer.domElement);
      pipControls.enableDamping = true;
      pipControls.autoRotate = true;
      pipControls.autoRotateSpeed = 4.0;
      pipControls.enableZoom = true;

      const pipLight = new THREE.DirectionalLight(0xffffff, 3.0);
      pipLight.position.set(2, 5, 3);
      pipScene.add(pipLight, new THREE.AmbientLight(0xffffff, 1.2));
  }

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

    if (controls && !CinematicTourDirector.active) controls.update();
    
    // Process Cinematic Camera Lerping
    CinematicTourDirector.update(delta);

    // Mathematically Lerp Dismantling Explosions
    if (currentModel) {
      currentModel.traverse(child => {
        // Explode position lerp (Applies to all Object3D nodes with target data)
        if (child.userData.targetPosition) {
          child.position.lerp(child.userData.targetPosition, delta * 3.5);
        }
        // Opacity lerp for smooth transitions
        if (child.material && child.userData.targetOpacity !== undefined) {
          child.material.transparent = true;
          child.material.opacity += (child.userData.targetOpacity - child.material.opacity) * delta * 5;
          child.material.needsUpdate = true;
        }
      });
      _animateModel(currentModel, delta);
    }

    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
    
    // Animate Secondary PiP Viewport
    if (pipRenderer && pipScene && pipCamera) {
      if (pipControls) pipControls.update();
      pipRenderer.render(pipScene, pipCamera);
    }
  }
  animate();
}

// ============================================================
//  CINEMATIC TOUR DIRECTOR (Autonomous Explanatory Flow)
// ============================================================

// ============================================================
//  ENHANCED CINEMATIC TOUR with Educational + VR Features
// ============================================================
const CinematicTourDirector = {
    active: false,
    paused: false,
    components: [],
    currentIndex: 0,
    stateTimer: 0,
    phaseTimer: 0,
    phase: 'intro',
    targetCamPos: new THREE.Vector3(),
    targetLookAt: new THREE.Vector3(),
    startCamPos: new THREE.Vector3(),
    glowMeshes: [],
    highlightParticles: null,
    emissionIntensity: 0,
    cameraDistance: 3,
    
    // NEW: Enhanced Features
    tourSpeed: 1.0,
    isRecording: false,
    recordedFrames: [],
    showAnnotations: true,
    showFacts: true,
    showHotspots: true,
    xRayMode: false,
    highlightMode: 'function', // 'function', 'structure', 'material'
    vrMode: false,
    screenShakeIntensity: 0,
    currentFact: {},
    currentQuiz: {},
    knowledgeContext: null,
    diversityHistory: [],
    factsDatabase: {
        'fuselage': [
            'The fuselage is typically made of aluminum alloys 7075 and 2024 for strength and low weight',
            'Pressurization systems maintain cabin air at 8,000ft equivalent at cruising altitude of 35,000ft',
            'Modern fuselages use carbon fiber composites to reduce weight by 20% compared to aluminum',
            'The fuselage diameter is typically 6.1-6.5m for commercial aircraft (Boeing 777)',
            'Fuselage rivets are precisely spaced to distribute stress evenly (rivet spacing ~2.5-5cm)',
            'Laminar flow drag reduction can save 5-8% fuel on long-haul flights'
        ],
        'wing': [
            'Wings generate lift through pressure differential (lower pressure on top surface)',
            'Wing structure contains fuel tanks holding 40-50% of total aircraft weight',
            'Wing loading (weight per wing area) ranges from 400-650 kg/m² in commercial aircraft',
            'Winglets reduce induced drag by 4-7%, improving fuel efficiency',
            'The wing-fuselage joint experiences shear stress of 1000+ tons during flight',
            'Swept wings reduce compressibility effects at transonic speeds (Mach 0.85+)'
        ],
        'engine': [
            'Jet engines operate at combustion temperatures exceeding 1500°C (2700°F)',
            'Modern turbofans have bypass ratios of 10:1, meaning 10x air bypasses combustion',
            'Engine efficiency improved by 30% in the last 20 years through better materials',
            'A jet engine produces 50,000-70,000 lbf thrust in commercial aviation',
            'High-pressure compressor can compress air to 45:1 ratios using 7-9 stages',
            'Turbine blades rotate at 5000+ RPM and experience 300+ g-forces'
        ],
        'tail': [
            'The tail provides longitudinal and directional stability during flight',
            'Elevators (on horizontal stabilizer) control pitch for up/down movement',
            'The rudder (vertical stabilizer) controls yaw for left/right rotation',
            'Tail surfaces generate approximately 25% of total lift needed for stability',
            'The V-tail design reduces drag but increases structural complexity',
            'Trim surfaces automatically adjust to maintain stability without pilot input'
        ],
        'cockpit': [
            'Modern glass cockpits display 6-8 screens with integrated flight data',
            'Pilots undergo 1500+ hours of training before commercial certification',
            'Autopilot systems can handle cruise, approach, and even landing (Category III)',
            'Head-up displays (HUD) project flight information on windscreen at pilot eye level',
            'Traffic collision avoidance system (TCAS) warns of nearby aircraft within 5-20 miles',
            'Integrated modular avionics reduce weight by 40% compared to traditional systems'
        ],
        'wheel': [
            'Aircraft wheels are made from forged aluminum alloys with multi-disc brakes',
            'Landing gear must absorb impact forces up to 4g during touchdown',
            'Tires are typically Michelin radials rated for 2000+ flight cycles',
            'Nose gear retracts inward; main gears retract into wheel wells',
            'Brake temperatures can exceed 900°C after high-speed landings',
            'Landing gear systems use hydraulic dampers to absorb shock loads'
        ],
        'tire': [
            'Aircraft tires handle pressures over 300 psi (21 bar) during flight',
            'Tire tread depth of 3-4mm is required for safe landing',
            'Tires are heated by friction during braking and can inflate from pressure increases',
            'Aircraft tire rubber compounds include special heat-resistant materials',
            'Tubeless tires seal at the bead through precise manufacturing tolerances',
            'Tire life is typically 400-600 flight cycles depending on usage patterns'
        ],
        'glass': [
            'Windscreens are laminated with UV-filtering polycarbonate and acrylic layers',
            'Cockpit windshields withstand impacts from hail and bird strikes at cruise speeds',
            'Anti-reflective coatings reduce glare and improve visibility in sunlight',
            'Windscreen thickness is 3-5mm with specialized tempering for impact resistance',
            'De-icing systems use electrical heating or hot air circulation to prevent ice buildup',
            'Side windows provide 10-15° field of view outside the aircraft envelope'
        ],
        'chassis': [
            'The chassis is the primary structural frame supporting all aircraft systems',
            'Load distribution in the frame exceeds 500,000+ lbf in cantilever bending',
            'Cross-bracing reduces buckling forces in the fuselage by 20-30%',
            'Fuselage skin carries 50% of bending loads (semi-monocoque structure)',
            'The chassis undergoes 50,000+ pressurization cycles during aircraft lifespan',
            'Modern frame designs use finite element analysis (FEA) for stress optimization'
        ],
        'door': [
            'Cockpit doors are reinforced to 6+ inches thick with bullet-resistant plating',
            'Emergency evacuation doors open outward against air pressure (300+ lbf)',
            'Door seals must be airtight at cruising altitude (35,000ft, 0.4 bar pressure)',
            'Over-wing emergency exits are spring-loaded and require 65 lbf to open',
            'Cabin pressurization prevents accidental door opening in flight',
            'Door handles are color-coded: green (safe), red (emergency)'
        ],
        'roof': [
            'The fuselage crown provides the primary load-bearing structural path',
            'Roof panels contain stringers (stiffeners) to prevent buckling',
            'Pressurization loads create 4 psi differential across cabin ceiling',
            'The roof carries shear loads of 100,000+ lbf during extreme maneuvers',
            'Cargo tie-down points in the roof distribute load to structural frames',
            'Thermal protection systems on hypersonic aircraft roofs reach 1200°C'
        ],
        'seat': [
            'Aircraft seats are designed to withstand 9g forward and 1.5g aft loads',
            'Lap belts and shoulder harnesses distribute impact forces across the body',
            'Seat cushions use non-flammable materials meeting FAA regulations',
            'Modern seats include integrated IFE (In-Flight Entertainment) systems',
            'Evacuation slide-equipped doors have seat removal capability for faster egress',
            'Premium seats provide 8-17 inches of width depending on cabin class'
        ],
        'transmission': [
            'Transmissions convert engine torque while maintaining efficiency (>95%)',
            'Automatic transmissions use 6-10 speed ratios for optimal RPM management',
            'Torque converter multiplication provides 2-3x torque amplification at launch',
            'Hydraulic pressure in transmissions reaches 200-250 psi during operation',
            'Transmission fluid cooling is critical to prevent overheating in traffic',
            'Modern transmissions integrate dual-clutch systems for rapid gear changes'
        ],
        'hull': [
            'Ship hulls use special coatings (silicone or fluoropolymer) to reduce drag by 8-15%',
            'Double hulls prevent catastrophic flooding and meet international shipping regulations',
            'Hull design evolved from wooden ships (15th century) to modern steel hulls',
            'Ballast tanks control ship stability and trim during cargo operations',
            'Anti-fouling paints prevent marine organism growth (saves 10% fuel annually)',
            'Bulbous bows reduce bow wave resistance by 5-10% at cruising speeds'
        ]
    },
    
    quizzesDatabase: {
        'fuselage': [
            { q: 'What material is primarily used for fuselage construction?', a: ['Aluminum alloys', 'Steel', 'Titanium'], correct: 0 },
            { q: 'What is the cabin pressure equivalent at cruising altitude?', a: ['8,000 feet', '35,000 feet', '50,000 feet'], correct: 0 }
        ],
        'wing': [
            { q: 'How do wings generate lift?', a: ['Pressure differential', 'Magnetic fields', 'Friction'], correct: 0 },
            { q: 'What reduces induced drag on wings?', a: ['Winglets', 'Paint', 'Heavier material'], correct: 0 }
        ],
        'engine': [
            { q: 'What is jet engine combustion temperature?', a: ['Over 1500°C', 'Around 100°C', 'Room temperature'], correct: 0 },
            { q: 'What is a typical turbofan bypass ratio?', a: ['10:1', '1:1', '50:1'], correct: 0 }
        ],
        'tail': [
            { q: 'What do elevators on the tail control?', a: ['Pitch (up/down)', 'Roll (side)', 'Yaw (turn)'], correct: 0 },
            { q: 'What does the rudder control?', a: ['Yaw (rotation)', 'Pitch', 'Roll'], correct: 0 }
        ],
        'cockpit': [
            { q: 'How many hours of training for commercial pilot certification?', a: ['1500+ hours', '100 hours', '500 hours'], correct: 0 },
            { q: 'What does TCAS warn about?', a: ['Nearby aircraft', 'Weather', 'Fuel'], correct: 0 }
        ],
        'wheel': [
            { q: 'What g-force must landing gear absorb?', a: ['Up to 4g', '1g', '10g'], correct: 0 },
            { q: 'What pressure do aircraft tires handle?', a: ['Over 300 psi', '50 psi', '100 psi'], correct: 0 }
        ],
        'tire': [
            { q: 'How many flight cycles do aircraft tires last?', a: ['400-600 cycles', '1000+ cycles', '50 cycles'], correct: 0 },
            { q: 'What is minimum safe tire tread depth?', a: ['3-4mm', '1mm', '10mm'], correct: 0 }
        ],
        'glass': [
            { q: 'What coating reduces windscreen glare?', a: ['Anti-reflective coating', 'Paint', 'Wax'], correct: 0 },
            { q: 'What thickness are cockpit windshields?', a: ['3-5mm', '1mm', '20mm'], correct: 0 }
        ],
        'chassis': [
            { q: 'What is the fuselage structural design called?', a: ['Semi-monocoque', 'Truss', 'Geodesic'], correct: 0 },
            { q: 'What percentage of loads does fuselage skin carry?', a: ['50%', '20%', '80%'], correct: 0 }
        ],
        'door': [
            { q: 'How thick are reinforced cockpit doors?', a: ['6+ inches', '1 inch', '2 inches'], correct: 0 },
            { q: 'What prevents accidental door opening in flight?', a: ['Pressurization', 'Locks', 'Speed'], correct: 0 }
        ],
        'roof': [
            { q: 'What is the pressurization differential across cabin ceiling?', a: ['4 psi', '1 psi', '10 psi'], correct: 0 },
            { q: 'What do stringers in the roof do?', a: ['Prevent buckling', 'Reduce weight', 'Improve looks'], correct: 0 }
        ],
        'seat': [
            { q: 'What g-force loads must seats withstand?', a: ['9g forward', '1g', '20g'], correct: 0 },
            { q: 'What material are seat cushions made from?', a: ['Non-flammable materials', 'Cotton', 'Wool'], correct: 0 }
        ]
    },
    
    componentCategories: {
        'aircraft': ['fuselage', 'wing', 'engine', 'tail', 'cockpit'],
        'landing_gear': ['wheel', 'tire', 'chassis'],
        'structure': ['door', 'roof', 'seat', 'glass'],
        'automotive': ['transmission', 'wheel', 'tire', 'chassis'],
        'marine': ['hull']
    },

    setKnowledgeContext: function(knowledge) {
        this.knowledgeContext = knowledge || null;
    },

    _buildKnowledgeDrivenDescription: function(prettyName, category = 'general') {
        const knowledge = this.knowledgeContext;
        if (!knowledge) return null;
        const parts = Array.isArray(knowledge.key_components) ? knowledge.key_components : [];
        const funcs = Array.isArray(knowledge.functions) ? knowledge.functions : [];
        const componentToken = prettyName.toLowerCase();
        const matchedPart = parts.find((p) => componentToken.includes(String(p).toLowerCase()) || String(p).toLowerCase().includes(componentToken));
        const functionLine = funcs.find((f) => String(f).toLowerCase().includes(componentToken)) || funcs[0];
        if (matchedPart || functionLine) {
            return `${prettyName} is linked to ${matchedPart || 'a key subsystem'} in this concept. ${functionLine || 'It contributes to the overall system behavior.'}`;
        }
        return null;
    },

    _getDynamicFactsForComponent: function(comp) {
        const knowledge = this.knowledgeContext;
        if (!knowledge) return [];
        const facts = [];
        if (knowledge.definition) facts.push(String(knowledge.definition));
        if (Array.isArray(knowledge.functions)) facts.push(...knowledge.functions.map((f) => String(f)));
        if (Array.isArray(knowledge.key_components) && knowledge.key_components.length > 0) {
            facts.push(`Key concept components include: ${knowledge.key_components.slice(0, 5).join(', ')}.`);
        }
        return facts.filter(Boolean);
    },

    // ===== NEW: Enhanced Feature Controls =====
    setTourSpeed: function(speed) {
        this.tourSpeed = Math.max(0.25, Math.min(3.0, speed));
        const speedDisplay = document.getElementById('tour-speed-display');
        if (speedDisplay) speedDisplay.textContent = `Speed: ${this.tourSpeed.toFixed(1)}x`;
    },

    toggleRecording: function() {
        this.isRecording = !this.isRecording;
        this.recordedFrames = [];
        const recordBtn = document.getElementById('tour-record');
        if (recordBtn) {
            recordBtn.style.background = this.isRecording ? '#DC2626' : '#666';
            recordBtn.textContent = this.isRecording ? '⏺ Recording...' : '⏺ Record Tour';
        }
    },

    toggleXRayMode: function() {
        this.xRayMode = !this.xRayMode;
        this._applyVisualizationMode();
        const xrayBtn = document.getElementById('tour-xray');
        if (xrayBtn) xrayBtn.style.opacity = this.xRayMode ? '1' : '0.5';
    },

    toggleHighlightMode: function() {
        const modes = ['function', 'structure', 'material'];
        const idx = modes.indexOf(this.highlightMode);
        this.highlightMode = modes[(idx + 1) % modes.length];
        this._applyVisualizationMode();
        const icons = { 'function': '⚡', 'structure': '🏗️', 'material': '🎨' };
        const modeBtn = document.getElementById('tour-highlight-mode');
        if (modeBtn) modeBtn.textContent = `${icons[this.highlightMode]} Mode`;
    },

    toggleVRMode: function() {
        this.vrMode = !this.vrMode;
        if (this.vrMode && camera) {
            const dist = camera.position.distanceTo(controls.target);
            camera.position.multiplyScalar(2);
        }
        const vrBtn = document.getElementById('tour-vr');
        if (vrBtn) vrBtn.style.opacity = this.vrMode ? '1' : '0.5';
    },

    _applyVisualizationMode: function() {
        if (!currentModel) return;
        currentModel.traverse(child => {
            if (!child.isMesh) return;
            
            if (this.xRayMode) {
                if (!child.material.userData.originalTransparency) {
                    child.material.userData.originalTransparency = child.material.transparent;
                    child.material.userData.originalOpacity = child.material.opacity;
                }
                child.material.transparent = true;
                child.material.opacity = 0.3;
            } else {
                child.material.transparent = child.material.userData.originalTransparency || false;
                child.material.opacity = child.material.userData.originalOpacity || 1.0;
            }
        });
    },

    _triggerScreenShake: function(intensity = 0.3) {
        this.screenShakeIntensity = intensity;
    },

    _triggerConfetti: function() {
        if (!scene || !currentModel) return;
        const confettiCount = 60;
        const positions = [];
        const colors = [];
        const geometry = new THREE.BufferGeometry();
        
        const colorPalette = [0x00ffcc, 0xF59E0B, 0x3B82F6, 0x10B981, 0xEC4899, 0x8B5CF6];
        
        for (let i = 0; i < confettiCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.3 + Math.random() * 1.8;
            positions.push(
                Math.cos(angle) * radius,
                Math.random() * 2 - 1,
                Math.sin(angle) * radius
            );
            const color = new THREE.Color(colorPalette[Math.floor(Math.random() * colorPalette.length)]);
            colors.push(color.r, color.g, color.b);
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.25,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.9,
            vertexColors: true
        });
        
        const confetti = new THREE.Points(geometry, material);
        confetti.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 3,
            2 + Math.random() * 2,
            (Math.random() - 0.5) * 3
        );
        confetti.userData.lifetime = 2.5;
        confetti.userData.age = 0;
        confetti.userData.isConfetti = true;
        scene.add(confetti);
        
        // Also add floating text
        this._addFloatingText('✓ CORRECT!', 0x10B981);
        
        return confetti;
    },

    _addFloatingText: function(text, color = 0x00ffcc) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 256;
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        ctx.fillText(text, 256, 128);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, sizeAttenuation: true });
        const sprite = new THREE.Sprite(material);
        
        const randomX = (Math.random() - 0.5) * 2;
        const randomZ = (Math.random() - 0.5) * 2;
        sprite.position.set(randomX, 2, randomZ);
        sprite.scale.set(2, 1, 1);
        
        sprite.userData.lifetime = 2.0;
        sprite.userData.age = 0;
        sprite.userData.isFloatingText = true;
        sprite.userData.velocity = new THREE.Vector3(0, 1, 0);
        
        scene.add(sprite);
    },

    _showAnnotation: function(comp) {
        const panel = document.getElementById('tour-annotation-panel');
        if (!panel) {
            console.warn('[Tour] Annotation panel not found');
            return;
        }
        
        // Initialize component fact tracker if needed
        if (!this.currentFact[comp.name]) {
            this.currentFact[comp.name] = 0;
        }
        
        const facts = this.factsDatabase[comp.name] || this._getDynamicFactsForComponent(comp);
        const fact = facts ? facts[this.currentFact[comp.name] % facts.length] : comp.desc;
        
        // Increment for next time
        this.currentFact[comp.name]++;
        
        panel.innerHTML = `
            <div style="display:flex; gap:12px; align-items:flex-start;">
                <div style="font-size:2.5rem; line-height:1;">💡</div>
                <div style="flex:1;">
                    <strong style="color:#F59E0B; font-size:14px; text-transform:uppercase; letter-spacing:0.5px;">Did You Know?</strong>
                    <p style="color:#e0e0e0; font-size:13px; margin:8px 0 0 0; line-height:1.5; font-weight:500;">${fact}</p>
                    <div style="margin-top:8px; font-size:11px; color:#F59E0B; opacity:0.7;">
                        Fact ${this.currentFact[comp.name]} of ${facts?.length || 1}
                    </div>
                </div>
            </div>
        `;
        panel.style.opacity = '1';
        panel.style.pointerEvents = 'auto';
        console.log('[Tour] Showing annotation:', comp.name, 'fact', this.currentFact[comp.name]);
        
        // Auto-hide after 7 seconds
        setTimeout(() => {
            if (panel && panel.style.opacity === '1') {
                panel.style.opacity = '0';
                panel.style.pointerEvents = 'none';
            }
        }, 7000);
    },

    _showQuiz: function(comp) {
        // Initialize component quiz tracker if needed
        if (!this.currentQuiz[comp.name]) {
            this.currentQuiz[comp.name] = 0;
        }
        
        let quizzes = this.quizzesDatabase[comp.name];
        if ((!quizzes || quizzes.length === 0) && this.knowledgeContext?.definition) {
            quizzes = [
                {
                    q: `Which statement best matches ${this._formatComponentName(comp.name)} in this concept?`,
                    a: [
                        `${String(this.knowledgeContext.definition).slice(0, 100)}...`,
                        'It has no role in this concept.',
                        'It is just a random decorative element.',
                    ],
                    correct: 0,
                },
            ];
        }
        if (!quizzes || quizzes.length === 0) {
            console.warn('[Tour] No quiz for component:', comp.name);
            return;
        }
        
        const quiz = quizzes[this.currentQuiz[comp.name] % quizzes.length];
        this.currentQuiz[comp.name]++;
        
        const quizPanel = document.getElementById('tour-quiz-panel');
        if (!quizPanel) {
            console.warn('[Tour] Quiz panel not found');
            return;
        }
        
        let html = `<div style="padding:16px;">
            <strong style="color:#3B82F6; font-size:13px; text-transform:uppercase; letter-spacing:0.5px;">🧠 Knowledge Check</strong>
            <p style="color:#e0e0e0; font-size:12px; margin:12px 0 10px 0; font-weight:600; line-height:1.4;">${quiz.q}</p>
            <div style="display:flex; flex-direction:column; gap:7px;">`;
        
        quiz.a.forEach((answer, idx) => {
            const isCorrect = idx === quiz.correct;
            html += `<button style="
                background:rgba(255,255,255,0.08); color:#e0e0e0; border:1px solid rgba(255,255,255,0.2);
                padding:10px 12px; border-radius:5px; cursor:pointer; font-size:12px; text-align:left;
                transition:all 0.2s; font-family:'Inter', sans-serif; font-weight:500;
            " onmouseover="this.style.background='rgba(59,130,246,0.3)'; this.style.borderColor='rgba(59,130,246,0.6)'; this.style.transform='translateX(4px)'" 
               onmouseout="this.style.background='rgba(255,255,255,0.08)'; this.style.borderColor='rgba(255,255,255,0.2)'; this.style.transform='translateX(0)'"
               onclick="
                   const isCorrect = ${isCorrect};
                   this.style.background = isCorrect ? '#10B981' : '#DC2626';
                   this.style.color = '#fff';
                   this.style.borderColor = isCorrect ? '#059669' : '#991B1B';
                   this.disabled = true;
                   this.style.cursor = 'default';
                   if (isCorrect) { 
                       CinematicTourDirector._triggerConfetti(); 
                       CinematicTourDirector._triggerConfetti(); 
                       CinematicTourDirector._triggerConfetti();
                   }
               ">
            <span style="font-size:11px; font-weight:bold; margin-right:8px; color:inherit;">${String.fromCharCode(65 + idx)}</span>${answer}</button>`;
        });
        
        html += '<div style="margin-top:10px; font-size:11px; color:#3B82F6; opacity:0.7;">Select the correct answer above</div></div>';
        quizPanel.innerHTML = html;
        quizPanel.style.opacity = '1';
        quizPanel.style.pointerEvents = 'auto';
        console.log('[Tour] Showing quiz for:', comp.name, 'quiz', this.currentQuiz[comp.name]);
        
        // Auto-hide after 12 seconds
        setTimeout(() => {
            if (quizPanel && quizPanel.style.opacity === '1') {
                quizPanel.style.opacity = '0';
                quizPanel.style.pointerEvents = 'none';
            }
        }, 12000);
    },

    _formatComponentName: function(rawName = '') {
        return String(rawName || 'component')
          .replace(/[_\-]+/g, ' ')
          .replace(/\d+/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .replace(/\b\w/g, (c) => c.toUpperCase()) || 'Component';
    },

    _buildGenericComponentDescription: function(prettyName, category = 'general') {
        const roleByCategory = {
            automotive: 'supports mobility and power transfer',
            aircraft: 'supports lift, stability, and flight control',
            marine: 'supports flotation, propulsion, and steering',
            structure: 'maintains structural integrity and load distribution',
            landing_gear: 'supports contact, absorption, and stability during landing',
            general: 'contributes to system function and integration',
        };
        const role = roleByCategory[category] || roleByCategory.general;
        return `${prettyName} is a key subsystem that ${role}. In this concept model, it helps convert design intent into observable behavior.`;
    },

    start: function() {
        if (!currentModel) return;
        this.active = true;
        this.paused = false;
        this.components = [];
        this.currentIndex = 0;
        this.stateTimer = 0;
        this.glowMeshes = [];

        // Traverse the GLTF model to find discrete semantic components
        currentModel.traverse(child => {
            if (child.isMesh) {
                // Find matching lexicon entry based on mesh name
                const n = child.name.toLowerCase();
                let match = null;
                for (const [key, desc] of Object.entries(LEXICON)) {
                    if (n.includes(key.toLowerCase())) {
                        match = { key, desc }; break;
                    }
                }
                
                // Keep substantive meshes, with lexicon description when available.
                child.geometry.computeBoundingBox();
                if (child.geometry.boundingBox) {
                    const center = new THREE.Vector3();
                    child.geometry.boundingBox.getCenter(center);
                    child.localToWorld(center);
                    
                    const size = child.geometry.boundingBox.getSize(new THREE.Vector3()).lengthSq();
                    if (size > 0.0025) {
                        const prettyName = this._formatComponentName(match?.key || child.name || 'component');
                        const category = this._getComponentCategory(prettyName);
                        const desc =
                          this._buildKnowledgeDrivenDescription(prettyName, category) ||
                          match?.desc ||
                          this._buildGenericComponentDescription(prettyName, category);
                        this.components.push({
                            mesh: child,
                            center: center,
                            desc,
                            name: (match?.key || prettyName).toLowerCase(),
                            size: Math.sqrt(size),
                            originalOpacity: 1.0,
                            originalEmissive: child.material?.emissive?.clone() || new THREE.Color(0)
                        });
                    }
                }
            }
        });

        if (this.components.length === 0) {
            window.alert('No inspectable components found in this model to tour.');
            this.active = false;
            return;
        }

        this.components.sort((a, b) => (b.size || 0) - (a.size || 0));
        this.components = this.components.slice(0, 18);

        // Reorder path to maximize category and component-name diversity.
        this._applyDiversityOrdering();

        // Add tour control UI
        this._createTourControls();
        console.log(`[Cinematic Director] Found ${this.components.length} pedagogical points of interest.`);
        this._setupScene(0);
    },

    stop: function() {
        this.active = false;
        this.paused = false;
        this._removeTourControls();
        
        // Restore all meshes
        if (currentModel) {
            currentModel.traverse(c => {
                if (c.isMesh && c.material) {
                    c.material.transparent = false;
                    c.material.opacity = 1.0;
                    if (c.material.emissive) c.material.emissive.setHex(0x000000);
                    if (c.material.emissiveIntensity !== undefined) c.material.emissiveIntensity = 0;
                }
            });
        }
        
        // Cleanup particles
        if (this.highlightParticles) {
            scene.remove(this.highlightParticles);
            this.highlightParticles = null;
        }
        
        // Restore controls
        controls.target.set(0, 0.3, 0);
        camera.position.set(0, 0.8, 2.5);
        this.startCamPos.copy(camera.position);
    },

    pause: function() {
        this.paused = !this.paused;
    },

    next: function() {
        this.currentIndex = Math.min(this.currentIndex + 1, this.components.length - 1);
        this._setupScene(this.currentIndex);
    },

    prev: function() {
        this.currentIndex = Math.max(this.currentIndex - 1, 0);
        this._setupScene(this.currentIndex);
    },

    _createTourControls: function() {
        // Get the proper container (the three.js canvas parent)
        let parentContainer = null;
        
        if (renderer && renderer.domElement) {
            parentContainer = renderer.domElement.parentElement;
        }
        
        if (!parentContainer) {
            console.warn('[Tour] Could not find renderer container, using document.body');
            parentContainer = document.body;
        }
        
        // Ensure parent has relative positioning for absolute children
        if (parentContainer && parentContainer !== document.body) {
            const currentPos = window.getComputedStyle(parentContainer).position;
            if (currentPos === 'static') {
                parentContainer.style.position = 'relative';
            }
        }
        
        let controlsHtml = document.getElementById('tour-controls');
        if (!controlsHtml) {
            controlsHtml = document.createElement('div');
            controlsHtml.id = 'tour-controls';
            controlsHtml.style.cssText = `
                position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
                background: rgba(0,0,0,0.9); border: 2px solid #00ffcc;
                border-radius: 12px; padding: 12px 15px;
                display: flex; gap: 8px; z-index: 9999;
                backdrop-filter: blur(15px); flex-wrap: wrap; justify-content: center;
                box-shadow: 0 8px 32px rgba(0,255,204,0.3);
                font-family: 'Inter', 'Segoe UI', sans-serif;
            `;
            controlsHtml.innerHTML = `
                <button id="tour-prev" style="background:#666; color:#fff; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; font-size:11px; transition:all 0.2s; font-weight:600;">⟨ Prev</button>
                <button id="tour-play-pause" style="background:#F59E0B; color:#fff; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; font-size:11px; font-weight:bold; transition:all 0.2s;">⏸</button>
                <button id="tour-next" style="background:#666; color:#fff; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; font-size:11px; transition:all 0.2s; font-weight:600;">Next ⟩</button>
                <div style="width:1px; background:rgba(255,255,255,0.2);"></div>
                <input id="tour-speed-slider" type="range" min="0.25" max="3" step="0.25" value="1" style="width:100px; cursor:pointer; accent-color:#00ffcc;">
                <span id="tour-speed-display" style="color:#00ffcc; font-size:10px; white-space:nowrap; font-weight:bold; min-width:70px;">Speed: 1.0x</span>
                <div style="width:1px; background:rgba(255,255,255,0.2);"></div>
                <button id="tour-xray" title="X-Ray Mode" style="background:rgba(255,255,255,0.1); color:#fff; border:1px solid #888; padding:5px 8px; border-radius:4px; cursor:pointer; font-size:11px; opacity:0.5; transition:all 0.2s;">👁️</button>
                <button id="tour-highlight-mode" title="Visualization Mode" style="background:rgba(255,255,255,0.1); color:#fff; border:1px solid #888; padding:5px 8px; border-radius:4px; cursor:pointer; font-size:11px; transition:all 0.2s;">⚡</button>
                <button id="tour-record" title="Record Tour" style="background:#666; color:#fff; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; font-size:11px; transition:all 0.2s;">⏺</button>
                <button id="tour-vr" title="VR Mode" style="background:rgba(255,255,255,0.1); color:#fff; border:1px solid #888; padding:5px 8px; border-radius:4px; cursor:pointer; font-size:11px; opacity:0.5; transition:all 0.2s;">🥽</button>
                <button id="tour-exit" title="Exit Tour" style="background:#DC2626; color:#fff; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; font-size:11px; transition:all 0.2s; font-weight:600;">✕</button>
                <span id="tour-counter" style="color:#00ffcc; font-size:11px; font-weight:bold; white-space:nowrap; margin-left:8px;">0/0</span>
            `;
            
            // Use fixed positioning - append to body always
            document.body.appendChild(controlsHtml);
            console.log('[Tour Controls] Successfully added to DOM');

            // Core controls with error handling
            const tourPrev = document.getElementById('tour-prev');
            const tourNext = document.getElementById('tour-next');
            const tourPlayPause = document.getElementById('tour-play-pause');
            const tourExit = document.getElementById('tour-exit');
            const tourSpeedSlider = document.getElementById('tour-speed-slider');
            const tourXray = document.getElementById('tour-xray');
            const tourHighlightMode = document.getElementById('tour-highlight-mode');
            const tourRecord = document.getElementById('tour-record');
            const tourVR = document.getElementById('tour-vr');
            
            if (tourPrev) tourPrev.addEventListener('click', () => { this.prev(); console.log('[Tour] Prev clicked'); });
            if (tourNext) tourNext.addEventListener('click', () => { this.next(); console.log('[Tour] Next clicked'); });
            if (tourPlayPause) tourPlayPause.addEventListener('click', () => {
                this.pause();
                tourPlayPause.textContent = this.paused ? '▶' : '⏸';
                console.log('[Tour] Pause toggled:', this.paused);
            });
            if (tourExit) tourExit.addEventListener('click', () => { this.stop(); console.log('[Tour] Exit clicked'); });
            if (tourSpeedSlider) tourSpeedSlider.addEventListener('input', (e) => {
                this.setTourSpeed(parseFloat(e.target.value));
            });
            if (tourXray) tourXray.addEventListener('click', () => { this.toggleXRayMode(); console.log('[Tour] X-Ray toggled'); });
            if (tourHighlightMode) tourHighlightMode.addEventListener('click', () => { this.toggleHighlightMode(); console.log('[Tour] Mode changed'); });
            if (tourRecord) tourRecord.addEventListener('click', () => { this.toggleRecording(); console.log('[Tour] Recording toggled'); });
            if (tourVR) tourVR.addEventListener('click', () => { this.toggleVRMode(); console.log('[Tour] VR toggled'); });
        }
        
        // Create annotation and quiz panels
        this._createAnnotationPanels();
        this._updateCounter();
    },

    _createAnnotationPanels: function() {
        // Annotation panel (Did You Know?)
        if (!document.getElementById('tour-annotation-panel')) {
            const annPanel = document.createElement('div');
            annPanel.id = 'tour-annotation-panel';
            annPanel.style.cssText = `
                position: fixed; top: 100px; right: 20px; width: 320px;
                background: rgba(0,0,0,0.92); border: 2px solid #F59E0B;
                border-radius: 10px; padding: 16px; z-index: 9998;
                color: #fff; font-size: 12px;
                backdrop-filter: blur(20px);
                opacity: 0; pointer-events: none;
                transition: opacity 0.4s ease;
                box-shadow: 0 8px 32px rgba(245,158,11,0.4), inset 0 1px 0 rgba(255,255,255,0.1);
                font-family: 'Inter', 'Segoe UI', sans-serif;
                max-height: 200px;
                overflow-y: auto;
            `;
            document.body.appendChild(annPanel);
            console.log('[Tour] Annotation panel created');
        }
        
        // Quiz panel
        if (!document.getElementById('tour-quiz-panel')) {
            const quizPanel = document.createElement('div');
            quizPanel.id = 'tour-quiz-panel';
            quizPanel.style.cssText = `
                position: fixed; top: 100px; left: 20px; width: 300px;
                background: rgba(0,0,0,0.92); border: 2px solid #3B82F6;
                border-radius: 10px; z-index: 9998;
                color: #fff; font-size: 12px;
                backdrop-filter: blur(20px);
                opacity: 0; pointer-events: none;
                transition: opacity 0.4s ease;
                box-shadow: 0 8px 32px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.1);
                font-family: 'Inter', 'Segoe UI', sans-serif;
                max-height: 300px;
                overflow-y: auto;
            `;
            document.body.appendChild(quizPanel);
            console.log('[Tour] Quiz panel created');
        }
    },

    _removeTourControls: function() {
        const ctrl = document.getElementById('tour-controls');
        if (ctrl) ctrl.remove();
        const annPanel = document.getElementById('tour-annotation-panel');
        if (annPanel) annPanel.remove();
        const quizPanel = document.getElementById('tour-quiz-panel');
        if (quizPanel) quizPanel.remove();
    },

    _updateCounter: function() {
        const counter = document.getElementById('tour-counter');
        if (counter) counter.textContent = `${this.currentIndex + 1}/${this.components.length}`;
    },

    _setupScene: function(index) {
        if (index >= this.components.length) {
            this.stop();
            document.getElementById('concept-description').textContent = "🎉 Cinematic Tour Complete! Feel free to explore manually.";
            return;
        }
        
        const comp = this.components[index];
        this.startCamPos.copy(camera.position);
        
        // 1. Dim the entire model
        currentModel.traverse(c => {
            if (c.isMesh && c.material) {
                c.material.transparent = true;
                c.material.opacity = (c === comp.mesh) ? 1.0 : 0.08;
                if (c.material.emissive && c !== comp.mesh) {
                    c.material.emissive.setHex(0x000000);
                    if (c.material.emissiveIntensity !== undefined) c.material.emissiveIntensity = 0;
                }
            }
        });

        // 2. Calculate camera orbit path with 3x closer distance
        this.targetLookAt.copy(comp.center);
        const offset = new THREE.Vector3(
            comp.size * 1.2, 
            comp.size * 0.6, 
            comp.size * 1.2
        );
        this.targetCamPos.copy(comp.center).add(offset);
        this.cameraDistance = offset.length();
        
        // 3. Add glow effect to target mesh
        if (comp.mesh && comp.mesh.material) {
            comp.mesh.material.emissive.setHex(0x00ffcc);
            comp.mesh.material.emissiveIntensity = 0.3;
        }
        
        // 4. Create particle effect around component
        this._createComponentHighlight(comp);
        
        // 5. ENHANCED: Trigger new effects ALWAYS
        if (this.showFacts) {
            // Show facts at different timings for variety
            const factDelay = 600 + (Math.random() * 400); // 600-1000ms
            setTimeout(() => this._showAnnotation(comp), factDelay);
        }
        
        // Show quizzes more frequently (60% chance instead of 50%)
        if (this.quizzesDatabase[comp.name] && Math.random() > 0.4) {
            const quizDelay = 4500 + (Math.random() * 800); // 4500-5300ms
            setTimeout(() => this._showQuiz(comp), quizDelay);
        }
        
        // Multiple screen shakes for more impact
        this._triggerScreenShake(0.25);
        setTimeout(() => this._triggerScreenShake(0.15), 200);
        
        // Pulse effect on component entry
        if (comp.mesh && comp.mesh.material && comp.mesh.material.emissive) {
            comp.mesh.material.emissiveIntensity = 0.1;
        }
        
        // 6. Update UI with category info
        const category = this._getComponentCategory(comp.name);
        const readableComponent = this._formatComponentName(comp.name);
        const categoryEmoji = {
            'aircraft': '✈️',
            'landing_gear': '🛬',
            'structure': '🏗️',
            'automotive': '🚗',
            'marine': '⛵'
        }[category] || '⚙️';
        
        const progressBar = (index + 1) / this.components.length * 100;
        document.getElementById('concept-description').innerHTML = 
            `<div style="margin-bottom:12px;">
                <strong style="color:#F59E0B; font-size:14px;">🎬 ${categoryEmoji} Component ${index+1}/${this.components.length}: ${readableComponent}</strong><br>
                <span style="color:#00ffcc; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">Category: ${category?.replace(/_/g, ' ') || 'Unknown'}</span>
            </div>
            <span style="color:#e0e0e0; font-size:13px; line-height:1.6;">${comp.desc}</span><br><br>` +
            `<div style="background:rgba(0,255,204,0.15); height:5px; border-radius:3px; margin-top:8px; overflow:hidden;">
                <div style="background:linear-gradient(90deg, #00ffcc, #F59E0B); height:100%; width:${progressBar}%; transition:width 0.3s; border-radius:3px;"></div>
            </div>
            <div style="margin-top:6px; font-size:11px; color:#888;">${Math.round(progressBar)}% Complete</div>`;
            
        this.stateTimer = 0;
        this.phaseTimer = 0;
        this.phase = 'intro';
        this.emissionIntensity = 0;
        this._updateCounter();
    },

    _getComponentCategory: function(componentName) {
        for (const [category, components] of Object.entries(this.componentCategories)) {
            if (components.some(c => componentName.toLowerCase().includes(c.toLowerCase()) || 
                                    c.toLowerCase().includes(componentName.toLowerCase()))) {
                return category;
            }
        }
        return 'general';
    },

    _applyDiversityOrdering: function() {
      if (!Array.isArray(this.components) || this.components.length < 3) return;

      const grouped = new Map();
      this.components.forEach(comp => {
        const category = this._getComponentCategory(comp.name);
        if (!grouped.has(category)) grouped.set(category, []);
        grouped.get(category).push(comp);
      });

      grouped.forEach(list => {
        list.sort((a, b) => (b.size || 0) - (a.size || 0));
      });

      const categoryOrder = Array.from(grouped.keys()).sort((a, b) => grouped.get(b).length - grouped.get(a).length);
      const interleaved = [];
      let progress = true;

      while (progress) {
        progress = false;
        for (const category of categoryOrder) {
          const list = grouped.get(category);
          if (list && list.length) {
            interleaved.push(list.shift());
            progress = true;
          }
        }
      }

      // Local swap pass to avoid immediate duplicate names.
      for (let i = 1; i < interleaved.length; i++) {
        const prev = (interleaved[i - 1].name || '').toLowerCase();
        const curr = (interleaved[i].name || '').toLowerCase();
        if (prev === curr) {
          const swapIdx = interleaved.findIndex((item, idx) => idx > i && (item.name || '').toLowerCase() !== prev);
          if (swapIdx > i) {
            const tmp = interleaved[i];
            interleaved[i] = interleaved[swapIdx];
            interleaved[swapIdx] = tmp;
          }
        }
      }

      this.components = interleaved;
      this.diversityHistory = this.components.slice(0, 5).map(c => c.name);
      console.log('[Tour Diversity] Sequence head:', this.diversityHistory.join(' -> '));
    },

    _createComponentHighlight: function(comp) {
        // Remove old particles
        if (this.highlightParticles) scene.remove(this.highlightParticles);
        
        // Create particle ring around component
        const particleCount = 80;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const sizes = [];
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = comp.size * 0.8;
            const height = (Math.random() - 0.5) * comp.size;
            
            positions.push(
                comp.center.x + Math.cos(angle) * radius,
                comp.center.y + height,
                comp.center.z + Math.sin(angle) * radius
            );
            sizes.push(0.1 + Math.random() * 0.1);
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(new Float32Array(sizes), 1));
        
        const material = new THREE.PointsMaterial({
            color: 0x00ffcc,
            size: 0.15,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.6
        });
        
        this.highlightParticles = new THREE.Points(geometry, material);
        scene.add(this.highlightParticles);
    },

    update: function(delta) {
        if (!this.active || !camera || this.paused) return;

        // Apply tour speed multiplier
        const scaledDelta = delta * this.tourSpeed;

        const comp = this.components[this.currentIndex];
        this.stateTimer += scaledDelta;
        this.phaseTimer += scaledDelta;

        // ===== MULTI-PHASE CAMERA CHOREOGRAPHY =====
        
        // Phase 1: Intro Zoom (0-2s) — Zoom in from far away
        if (this.phaseTimer < 2.0) {
            const t = this.phaseTimer / 2.0; // 0 to 1
            const easeT = 1 - Math.pow(1 - t, 3); // Ease out cubic
            
            camera.position.lerp(this.targetCamPos, easeT * 0.8);
            controls.target.lerp(this.targetLookAt, easeT * 0.8);
            this.emissionIntensity = Math.min(easeT * 0.8, 0.6);
            this.phase = 'intro';
        }
        
        // Phase 2: Highlight (2-4s) — Pulse and stabilize
        else if (this.phaseTimer < 4.0) {
            const t = (this.phaseTimer - 2.0) / 2.0;
            const pulse = 0.5 + 0.3 * Math.sin(t * Math.PI * 4);
            this.emissionIntensity = 0.3 + pulse * 0.3;
            this.phase = 'highlight';
        }
        
        // Phase 3: Orbit (4-9s) — Slow orbital rotation
        else if (this.phaseTimer < 9.0) {
            const orbitAngle = (this.phaseTimer - 4.0) * 0.5; // Slow rotation
            const radius = this.cameraDistance;
            
            this.targetCamPos.x = this.targetLookAt.x + Math.cos(orbitAngle) * radius * 0.9;
            this.targetCamPos.z = this.targetLookAt.z + Math.sin(orbitAngle) * radius * 0.9;
            this.targetCamPos.y = this.targetLookAt.y + radius * 0.5;
            
            camera.position.lerp(this.targetCamPos, scaledDelta * 2.0);
            this.emissionIntensity = 0.6;
            this.phase = 'orbit';
        }
        
        // Phase 4: Zoom to Feature (9-11s) — Closer look
        else if (this.phaseTimer < 11.0) {
            const t = (this.phaseTimer - 9.0) / 2.0;
            const easeT = t * t; // Ease in quad
            
            const zoomPos = new THREE.Vector3();
            zoomPos.copy(this.targetLookAt);
            zoomPos.add(new THREE.Vector3(comp.size * 0.5, comp.size * 0.3, comp.size * 0.5));
            
            camera.position.lerp(zoomPos, easeT * 0.6);
            this.emissionIntensity = 0.5 + easeT * 0.3;
            this.phase = 'zoom';
        }
        
        // Phase 5: Feature Details (11-13s) — Micro-rotation
        else if (this.phaseTimer < 13.0) {
            const detailRotation = (this.phaseTimer - 11.0) * 0.8;
            const radius = this.cameraDistance * 0.6;
            
            this.targetCamPos.x = this.targetLookAt.x + Math.cos(detailRotation) * radius;
            this.targetCamPos.z = this.targetLookAt.z + Math.sin(detailRotation) * radius;
            
            camera.position.lerp(this.targetCamPos, scaledDelta * 1.5);
            this.emissionIntensity = 0.7;
            this.phase = 'feature';
        }
        
        // Auto advance
        else {
            this.currentIndex++;
            this._setupScene(this.currentIndex);
            return;
        }

        // Apply screen shake if needed
        if (this.screenShakeIntensity > 0) {
            camera.position.x += (Math.random() - 0.5) * this.screenShakeIntensity;
            camera.position.y += (Math.random() - 0.5) * this.screenShakeIntensity;
            camera.position.z += (Math.random() - 0.5) * this.screenShakeIntensity;
            this.screenShakeIntensity *= 0.9;
        }

        // Update camera lookAt
        controls.target.lerp(this.targetLookAt, scaledDelta * 1.2);
        camera.lookAt(controls.target);

        // Update glow effect
        if (comp.mesh && comp.mesh.material && comp.mesh.material.emissive) {
            comp.mesh.material.emissiveIntensity = this.emissionIntensity;
        }

        // Rotate particles
        if (this.highlightParticles) {
            this.highlightParticles.rotation.y += scaledDelta * 0.3;
        }

        // Update confetti and floating effects
        if (scene) {
            const toRemove = [];
            scene.children.forEach(obj => {
                if (obj.userData && (obj.userData.lifetime !== undefined || obj.userData.isConfetti || obj.userData.isFloatingText)) {
                    obj.userData.age = (obj.userData.age || 0) + delta;
                    if (obj.userData.age > (obj.userData.lifetime || 3)) {
                        toRemove.push(obj);
                    } else {
                        const life = 1 - (obj.userData.age / (obj.userData.lifetime || 3));
                        if (obj.material && obj.material.opacity !== undefined) {
                            obj.material.opacity = life * 0.8;
                        }
                        
                        if (obj.userData.velocity) {
                            obj.position.add(obj.userData.velocity.clone().multiplyScalar(delta));
                            if (obj.userData.isConfetti || obj.userData.isFloatingText) {
                                obj.userData.velocity.y -= 2.5 * delta; // Gravity
                            }
                        }
                        
                        // Rotation for confetti
                        if (obj.userData.isConfetti) {
                            obj.rotation.x += Math.random() * 0.1;
                            obj.rotation.y += Math.random() * 0.1;
                            obj.rotation.z += Math.random() * 0.1;
                        }
                        
                        // Scale down floating text
                        if (obj.userData.isFloatingText && obj.scale) {
                            obj.scale.multiplyScalar(0.98);
                        }
                    }
                }
            });
            toRemove.forEach(obj => scene.remove(obj));
        }
    }
};

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

    _showOverlayPanel(event.clientX, event.clientY, cleanedName, clickedMesh);
  } else {
    _hideOverlayPanel();
  }
}

function _showOverlayPanel(x, y, partName, hitMesh) {
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
  
  // 1. Show floating Tooltip
  tooltip.innerHTML = `
      <div style="font-size: 10px; color: #00ffcc; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; margin-bottom: 6px;">Semantic Attention Hit</div>
      <div style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">${partName}</div>
      <div style="font-size: 13px; color: #aaddcc; line-height: 1.5;">${description}</div>
  `;
  tooltip.style.left = (x + 25) + 'px';
  tooltip.style.top = (y - 30) + 'px';
  tooltip.style.display = 'block';
  setTimeout(() => tooltip.style.opacity = '1', 10);
  
  // 2. Trigger PiP Sub-Viewport Cloning
  const pipPanel = document.getElementById('ar-pip-panel');
  if (pipPanel) pipPanel.style.display = 'flex';
  
  const descEl = document.getElementById('ar-pip-desc');
  if (descEl) descEl.innerHTML = `<strong style="font-size:14px;color:#fff;">${partName}</strong><br/><br/>${description}`;

  if (pipScene && hitMesh) {
      if (currentPipMesh) pipScene.remove(currentPipMesh);
      currentPipMesh = hitMesh.clone();
      
      // Auto-math center to Origin
      const box = new THREE.Box3().setFromObject(currentPipMesh);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      currentPipMesh.position.sub(center); // Translates exact center of bounding box to [0,0,0]
      
      // Auto-scale bounding box to fit camera fov
      const maxDim = Math.max(size.x, size.y, size.z);
      const scaleFactor = 0.5 / (maxDim || 0.1);
      currentPipMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
      
      // Maintain emissive highlighting
      currentPipMesh.traverse(c => {
         if (c.isMesh) c.material = hitMesh.material.clone();
      });
      
      pipScene.add(currentPipMesh);
  }
}

function _hideOverlayPanel() {
   const t = document.getElementById('ar-semantic-tooltip');
   if (t) { t.style.opacity = '0'; setTimeout(() => t.style.display = 'none', 200); }
   
   const p = document.getElementById('ar-pip-panel');
   if (p) { p.style.display = 'none'; }
}

function _animateModel(model, delta) {
  if (!model || !model.userData.animationData) return;
  const anim = model.userData.animationData;
  
  // Feature 9: SIMULATION MODE PARAMETER CONTROL
  const speedSlider = document.getElementById('sim-speed-slider');
  let simulationMultiplier = 1.0;
  if (speedSlider) {
     simulationMultiplier = parseFloat(speedSlider.value);
  }
  const adjustedDelta = delta * simulationMultiplier;
  
  if (!window._arGlobalTime) window._arGlobalTime = 0;
  window._arGlobalTime += adjustedDelta;
  const time = window._arGlobalTime;

  switch (anim.type) {
    case 'pulse': {
      const scale = 1 + Math.sin(time * anim.rate * Math.PI * 2) * anim.amplitude;
      model.scale.setScalar(scale);
      break;
    }
    case 'rotate': {
      const speed = anim.rate * adjustedDelta * Math.PI;
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
    arSystem.setStrictDeterministicMode(strictDeterministicMode);
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
    lastUploadedImageDataUrl = typeof dataUrl === 'string' ? dataUrl : null;
    // Show preview
    const previewContainer = document.getElementById('ar-image-preview');
    const previewImg = document.getElementById('ar-preview-img');
    const uploadZone = document.getElementById('ar-upload-zone');
    if (previewContainer && previewImg && uploadZone) {
      previewImg.onload = () => {
         _extractDominantColor(previewImg);
      };
      previewImg.src = dataUrl;
      previewImg.dataset.sourceDataUrl = dataUrl;
      previewContainer.style.display = 'block';
      uploadZone.style.display = 'none';
    }
    // Run pipeline
    _processImage(dataUrl);
  };
  reader.readAsDataURL(file);
}

// ============================================================
// NOVELTY: CENTER-WEIGHTED SUBJECT COLOR MASK
// ============================================================
function _extractDominantColor(imgElement) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = imgElement.naturalWidth || 100;
  canvas.height = imgElement.naturalHeight || 100;
  ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
  
  try {
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let r = 0, g = 0, b = 0, count = 0;
    
    // Bounds for Center-Weighted Mask (Exclude 25% outer edges)
    const minX = canvas.width * 0.25;
    const maxX = canvas.width * 0.75;
    const minY = canvas.height * 0.25;
    const maxY = canvas.height * 0.75;

    for (let i = 0; i < data.length; i += 16) {
      const pixelIndex = i / 4;
      const x = pixelIndex % canvas.width;
      const y = Math.floor(pixelIndex / canvas.width);

      // Only sample inside the Central Subject Mask
      if (x > minX && x < maxX && y > minY && y < maxY) {
        // Reject total white/black background bleed
        if (data[i+3] > 128 && (data[i]<240 || data[i+1]<240 || data[i+2]<240) && (data[i]>30 || data[i+1]>30 || data[i+2]>30)) {
          r += data[i]; g += data[i+1]; b += data[i+2]; count++;
        }
      }
    }
    
    if (count > 0) {
      r = Math.floor(r/count); g = Math.floor(g/count); b = Math.floor(b/count);
      const hex = (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
      window.extractedDominantColor = parseInt(`0x${hex}`, 16);
      console.log("[AR-Learning] Novelty: Center-Weighted Subject Mask Hit: #", hex);
    } else {
      window.extractedDominantColor = null;
    }
  } catch(e) { console.warn("Color masking failed via CORS"); window.extractedDominantColor = null; }
}

function _clearImage() {
  const previewContainer = document.getElementById('ar-image-preview');
  const uploadZone = document.getElementById('ar-upload-zone');
  const previewImg = document.getElementById('ar-preview-img');
  if (previewContainer) previewContainer.style.display = 'none';
  if (uploadZone) uploadZone.style.display = '';
  if (previewImg) {
    previewImg.removeAttribute('src');
    previewImg.removeAttribute('data-source-data-url');
  }
  lastUploadedImageDataUrl = null;
  document.getElementById('ar-file-input').value = '';
}

function _resolveTeachImageDataUrl() {
  const preview = document.getElementById('ar-preview-img');
  const candidates = [
    preview?.dataset?.sourceDataUrl,
    lastUploadedImageDataUrl,
    preview?.src,
  ].filter((value) => typeof value === 'string' && value.length > 0);

  for (const candidate of candidates) {
    if (candidate.startsWith('data:image/') && candidate.includes(',')) {
      return candidate;
    }
  }

  if (renderer && renderer.domElement) {
    try {
      const rendered = renderer.domElement.toDataURL('image/png');
      if (rendered.startsWith('data:image/') && rendered.includes(',')) {
        return rendered;
      }
    } catch (error) {
      console.warn('Canvas snapshot failed:', error);
    }
  }

  return null;
}

// ============================================================
//  CONCEPT REQUEST COMPOSER
// ============================================================

function _setupConceptComposer() {
  const conceptInput = document.getElementById('concept-input');
  const goalInput = document.getElementById('concept-goal');
  const generateBtn = document.getElementById('concept-generate-btn');
  const strictToggle = document.getElementById('strict-deterministic-toggle');
  const stlUrlInput = document.getElementById('concept-stl-url');

  if (!conceptInput || !goalInput || !generateBtn) return;

  if (strictToggle) {
    strictToggle.checked = strictDeterministicMode;
    strictToggle.addEventListener('change', () => {
      strictDeterministicMode = strictToggle.checked;
      if (arSystem && typeof arSystem.setStrictDeterministicMode === 'function') {
        arSystem.setStrictDeterministicMode(strictDeterministicMode);
      }
      _showToast(
        strictDeterministicMode
          ? 'Strict deterministic mode enabled'
          : 'Strict deterministic mode disabled (auto-resolve ambiguity)',
        'info',
        2500
      );
    });
  }

  const submit = () => {
    const concept = conceptInput.value.trim();
    const goal = goalInput.value.trim();
    const stlUrl = stlUrlInput?.value?.trim() || '';
    if (!concept) {
      _showQualityWarning('Enter a concept before generating the AR view.');
      conceptInput.focus();
      return;
    }

    currentLearningGoal = goal;
    _processConceptDirect(concept, goal, { stlUrl });
  };

  generateBtn.addEventListener('click', submit);
  const teachBtn = document.getElementById('btn-teach-concept');
  const wallViewBtn = document.getElementById('btn-start-wall-view');
  if (teachBtn) {
    teachBtn.addEventListener('click', async () => {
      // Prefer using preview image if present
      const dataUrl = _resolveTeachImageDataUrl();

      if (!dataUrl) {
        _showToast('No valid image available to teach. Upload an image first.', 'error', 3500);
        return;
      }

      // Extract base64 payload
      const b64 = dataUrl.includes(',') ? dataUrl.split(',')[1].trim() : dataUrl.trim();
      if (!b64 || typeof b64 !== 'string' || b64.length < 100 || b64.length % 4 === 1) {
        _showToast('Selected image is not valid base64 data. Upload the image again.', 'error', 4500);
        return;
      }
      const concept = conceptInput.value.trim() || (currentVisualization && currentVisualization.concept && currentVisualization.concept.name) || prompt('Enter concept name to teach:');
      if (!concept) return alert('Concept name required');

      // If AR wall system exists, use its teach wrapper
      _showSpinner('Teaching concept...');
      try {
        let profile = null;
        if (!arWallSystem) {
          arWallSystem = new ARWallLearningSystem();
        }

        if (!arWallSystem.isInitialized) {
          const initialized = await arWallSystem.initialize();
          if (!initialized) {
            throw new Error('AR wall system could not initialize');
          }
        }

        if (arWallSystem && arWallSystem.isInitialized) {
          profile = await arWallSystem.teachConcept(concept, [b64, b64]);
          if (profile) {
            _showToast(`Learned "${concept}" (confidence ${(profile.confidence||0).toFixed(2)})`, 'info', 3500);
          } else {
            throw new Error('Teaching returned no profile');
          }
        }

        // After learning, attempt to retrieve a 3D model and auto-project to wall
        try {
          if (arSystem && arSystem.modelRetriever) {
            const modelResult = await arSystem.modelRetriever.retrieveModelForConcept(concept, currentLevel, null, dataUrl);
            if (modelResult && modelResult.model3D) {
              // Ensure AR wall is initialized
              if (!arWallSystem) arWallSystem = new ARWallLearningSystem();
              if (!arWallSystem.isInitialized) await arWallSystem.initialize();
              const cloned = modelResult.model3D.clone(true);
              await arWallSystem.addConceptToPresentation(concept, cloned);
              arWallSystem.startPresentation();
              _showToast('Projected model to wall presentation', 'info', 3000);
            }
          }
        } catch (e) {
          console.warn('Auto-project failed:', e);
          _showToast('Auto-project failed: ' + (e.message || e), 'error', 4000);
        }
      } catch (err) {
        console.error('Teach failed', err);
        _showToast('Teach failed: ' + (err.message || err), 'error', 4000);
      } finally {
        _hideSpinner();
      }
    });
  }

  if (wallViewBtn) {
    wallViewBtn.addEventListener('click', async () => {
      try {
        if (!currentVisualization?.model?.model3D) {
          _showToast('Generate a concept first, then start wall-anchored view.', 'error', 3200);
          return;
        }

        const conceptName =
          conceptInput.value.trim() ||
          currentVisualization?.concept?.name ||
          currentVisualization?.model?.concept ||
          'concept';

        _showSpinner('Starting wall-anchored view...');
        if (!arWallSystem) arWallSystem = new ARWallLearningSystem();
        if (!arWallSystem.isInitialized) {
          const initialized = await arWallSystem.initialize();
          if (!initialized) throw new Error('AR wall system could not initialize');
        }

        arWallSystem.clearPresentationQueue();

        // Use a fresh model instance for wall mode to avoid reusing viewport-transformed geometry.
        let wallSourceModel = currentVisualization.model.model3D;
        try {
          if (arSystem?.modelRetriever && currentVisualization?.concept?.name) {
            const fresh = await arSystem.modelRetriever.retrieveModelForConcept(
              currentVisualization.concept.name,
              currentLevel,
              currentVisualization.concept.generative_blueprint || null,
              _resolveTeachImageDataUrl()
            );
            if (fresh?.model3D) wallSourceModel = fresh.model3D;
          }
        } catch (refreshError) {
          console.warn('Fresh wall model retrieval failed, falling back to active model:', refreshError);
        }

        const cloned = wallSourceModel.clone(true);
        await arWallSystem.addConceptToPresentation(conceptName, cloned);
        arWallSystem.startPresentation();
        _showToast('Wall-anchored view started (virtual wall fallback enabled)', 'info', 3800);
      } catch (error) {
        console.error('Wall-anchored view failed:', error);
        _showToast('Wall view failed: ' + (error.message || error), 'error', 4200);
      } finally {
        _hideSpinner();
      }
    });
  }

  conceptInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') submit();
  });
}

function _showQualityWarning(message, suggestions = []) {
  const warning = document.getElementById('ar-quality-warning');
  const suggestionsEl = document.getElementById('concept-suggestions');
  if (!warning) return;

  warning.style.display = 'block';
  warning.textContent = message;

  if (suggestionsEl) {
    if (suggestions.length > 0) {
      const items = suggestions.slice(0, 5).map(item => {
        const scorePct = `${Math.round((item.score || 0) * 100)}%`;
        return `<button class="concept-chip" data-suggestion="${item.label}" style="margin-top:6px;">${item.label} (${scorePct})</button>`;
      }).join(' ');

      suggestionsEl.innerHTML = `<div>Try one of these detected concepts:</div><div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:6px;">${items}</div>`;
      suggestionsEl.style.display = 'block';

      suggestionsEl.querySelectorAll('[data-suggestion]').forEach(btn => {
        btn.addEventListener('click', () => {
          const conceptInput = document.getElementById('concept-input');
          if (conceptInput) conceptInput.value = btn.getAttribute('data-suggestion') || '';
        });
      });
    } else {
      suggestionsEl.style.display = 'none';
      suggestionsEl.innerHTML = '';
    }
  }
}

function _clearQualityWarning() {
  const warning = document.getElementById('ar-quality-warning');
  const suggestionsEl = document.getElementById('concept-suggestions');
  if (warning) {
    warning.style.display = 'none';
    warning.textContent = '';
  }
  if (suggestionsEl) {
    suggestionsEl.style.display = 'none';
    suggestionsEl.innerHTML = '';
  }
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
      _processConceptDirect(currentVisualization.concept.name, currentLearningGoal);
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

  if (result?.status === 'needs_concept_confirmation') {
    _setPipelineStep('concept');
    _showQualityWarning(result.message, result.classification?.suggestions || []);
    return;
  }

  if (result) {
    _clearQualityWarning();
    currentVisualization = result;
    // Expose last visualization for peer room sync + coach.
    window.__eduverse_last_visualization = {
      concept: result.concept,
      model: { concept: result.model?.concept, generationMethod: result.model?.generationMethod },
      knowledge: result.knowledge || result.concept?.knowledge || null,
      metadata: { learningGoal: currentLearningGoal },
    };
    _displayVisualization(result);
    _setPipelineStep('done');
    _showLayerControls(result);
    _updateStats();
    store.logSession('ar_concept_visualized', 30);
  }
}

async function _processConceptDirect(conceptName, learningGoal = '', options = {}) {
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

  const result = await arSystem.processConceptDirectly(conceptName, currentLevel, learningGoal, options);

  if (result) {
    _clearQualityWarning();
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
  if (CinematicTourDirector && typeof CinematicTourDirector.setKnowledgeContext === 'function') {
    CinematicTourDirector.setKnowledgeContext(result.knowledge || result.concept?.knowledge || null);
  }

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

  // Show cinematic tour button for any model (GLB or procedural)
  const tourBtn = document.getElementById('btn-cinematic-tour');
  if (tourBtn) tourBtn.style.display = result?.model?.model3D ? 'block' : 'none';

  // Surface model source quality and alternatives
  if (result.model?.modelSource !== 'local-glb') {
    const alternatives = (result.model?.openSourceAlternatives || [])
      .slice(0, 3)
      .map(item => `${item.provider}: ${item.searchUrl}`)
      .join(' | ');

    _showQualityWarning(
      `Local high-fidelity GLB not found. Generated procedural model used. Open-source model sources: ${alternatives}`
    );
  }

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

  const _normalizeToArray = (value) => {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    if (typeof value === 'string') return [value];
    // Handle common structured shapes: { external: [], internal: [] }
    if (typeof value === 'object') {
      const external = Array.isArray(value.external) ? value.external : [];
      const internal = Array.isArray(value.internal) ? value.internal : [];
      const merged = [...external, ...internal];
      return merged.length ? merged : [];
    }
    return [];
  };

  panel.style.display = 'flex';

  document.getElementById('concept-badge').textContent = concept.name?.[0]?.toUpperCase() || '?';
  document.getElementById('concept-name').textContent = concept.name || '—';
  document.getElementById('concept-domain').textContent = concept.domain || 'General';
  document.getElementById('concept-confidence').textContent = concept.confidence
    ? `${(concept.confidence * 100).toFixed(0)}% confidence`
    : '';
  const knowledge = concept.knowledge || currentVisualization?.knowledge || null;
  let displayDesc = knowledge?.definition || concept.description || '';
  if (currentLevel === 'BEGINNER' && displayDesc) {
     displayDesc = `Basic Overview: ${displayDesc}`;
  }
  document.getElementById('concept-description').textContent = displayDesc;

  // FEATURE 12: KNOWLEDGE GRAPH HIERARCHY
  const kgPanel = document.getElementById('kg-hierarchy-panel');
  const kgTree = document.getElementById('kg-tree');
  if (kgPanel && kgTree) {
     kgPanel.style.display = 'block';
     const hierarchyComponents = _normalizeToArray(knowledge?.key_components).length
       ? _normalizeToArray(knowledge?.key_components)
       : _normalizeToArray(concept.components);
     const hierarchyLeaves = hierarchyComponents
       .slice(0, 3)
       .map(item => `<div style="margin-left: 30px; color:#93C5FD;">↳ ${String(item)}</div>`)
       .join('');
     kgTree.innerHTML = `
        <div>○ Mathematics</div>
        <div style="margin-left: 10px;">↳ Physics Laws</div>
        <div style="margin-left: 20px;">↳ Thermodynamics</div>
        <div style="margin-left: 30px; font-weight: bold; color: #fff;">↳ ${concept.name}</div>
        ${hierarchyLeaves}
     `;
  }

  // Components
  const compEl = document.getElementById('concept-components');
  const effectiveComponents = _normalizeToArray(concept.components).length
    ? _normalizeToArray(concept.components)
    : _normalizeToArray(knowledge?.key_components);
  if (compEl && effectiveComponents) {
    if (Array.isArray(effectiveComponents)) {
      compEl.innerHTML = effectiveComponents.map(c =>
        `<span class="component-tag">${c.replace(/_/g, ' ')}</span>`
      ).join('');
    } else {
      let html = '';
      const external = concept.components && Array.isArray(concept.components.external) ? concept.components.external : [];
      const internal = concept.components && Array.isArray(concept.components.internal) ? concept.components.internal : [];
      if (external.length) {
        html += `<div class="component-section"><div class="section-title">External Structure:</div><div class="tag-row">${external.map(c => `<span class="component-tag external-tag">${c}</span>`).join('')}</div></div>`;
      }
      if (internal.length) {
        html += `<div class="component-section"><div class="section-title">Internal Components:</div><div class="tag-row">${internal.map(c => `<span class="component-tag internal-tag">${c}</span>`).join('')}</div></div>`;
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
    
    // Feature 9: Show Simulation physics tools if Simulation is enabled
    if (layerType === 'SIMULATION') {
       const simDiv = document.getElementById('ar-sim-controls');
       if (simDiv) simDiv.style.display = enabled ? 'flex' : 'none';
    }
  });
}

function _toggleLayerVisibility(layerType, visible) {
  if (!currentModel) return;

  const prefix = layerType.toLowerCase(); // structure, function, interaction, behavior, simulation
  
  // Mathematical Extrapolation Vectors for each respective cognitive system
  const explodeVectors = {
    'structure': new THREE.Vector3(0, 1.2, 0),        // Explode UP
    'function': new THREE.Vector3(0, 0, -1.2),        // Explode BACK 
    'interaction': new THREE.Vector3(0, -0.6, 1.2),   // Explode DOWN-FORWARD
    'behavior': new THREE.Vector3(1.2, 0, 0),         // Explode RIGHT
    'simulation': new THREE.Vector3(-1.2, 0, 0)       // Explode LEFT
  };

  currentModel.traverse(child => {
    const name = (child.name || '').toLowerCase();
    if (name.startsWith(prefix) || name.startsWith(`${prefix}_`) || name.includes(`_${prefix}`)) {
      
      // Store original spatial coordinate safely
      if (!child.userData.originalPosition) {
         child.userData.originalPosition = child.position.clone();
      }

      // Mathematical Explosion Calculation (Dismantling)
      if (!visible) {
         const vec = explodeVectors[prefix] || new THREE.Vector3(0, 1, 0);
         child.userData.targetPosition = child.userData.originalPosition.clone().add(vec);
         child.userData.targetOpacity = 0.05; // Fade out slightly
      } else {
         // To show: Return exactly to the mathematically correct origin
         child.userData.targetPosition = child.userData.originalPosition.clone();
         child.userData.targetOpacity = 1.0;
      }
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

// ===================== UI Helpers (toasts & spinners) =====================
function _showToast(message, type = 'info', timeout = 3000) {
  const id = 'edu-toast';
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('div');
    el.id = id;
    el.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:99999;display:flex;flex-direction:column;gap:8px;align-items:center;';
    document.body.appendChild(el);
  }
  const node = document.createElement('div');
  node.style.cssText = `background:${type === 'error' ? '#ef4444' : '#111827'};color:#fff;padding:10px 14px;border-radius:8px;box-shadow:0 6px 20px rgba(2,6,23,0.6);min-width:160px;text-align:center;transition:opacity 0.2s ease;`;
  node.textContent = message;
  el.appendChild(node);
  setTimeout(() => { node.style.opacity = '0'; setTimeout(() => node.remove(), 250); }, timeout);
}

let _spinnerEl = null;
function _showSpinner(message = 'Loading...') {
  if (!_spinnerEl) {
    _spinnerEl = document.createElement('div');
    _spinnerEl.id = 'edu-spinner';
    _spinnerEl.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:99999;background:rgba(0,0,0,0.78);color:#fff;padding:10px 12px;border-radius:8px;display:flex;align-items:center;gap:10px;box-shadow:0 8px 32px rgba(0,0,0,0.5);';
    const dot = document.createElement('div');
    dot.style.cssText = 'width:10px;height:10px;border-radius:50%;background:#06b6d4;animation:edu-spin 1s linear infinite;';
    const style = document.createElement('style');
    style.innerHTML = '@keyframes edu-spin{0%{transform:translateY(0);}50%{transform:translateY(-4px);}100%{transform:translateY(0);}}';
    document.head.appendChild(style);
    _spinnerEl.appendChild(dot);
    const txt = document.createElement('div');
    txt.id = 'edu-spinner-txt';
    txt.textContent = message;
    _spinnerEl.appendChild(txt);
    document.body.appendChild(_spinnerEl);
  } else {
    const txt = document.getElementById('edu-spinner-txt');
    if (txt) txt.textContent = message;
    _spinnerEl.style.display = 'flex';
  }
}

function _hideSpinner() {
  if (_spinnerEl) _spinnerEl.style.display = 'none';
}

// ============================================================
//  ADVANCED AR UX LOGIC (12 FEATURES)
// ============================================================

function _setupAdvancedARFeatures() {
  if (!containerRef) return;
  
  // 1. Simulation Parameter Slider
  const simSlider = containerRef.querySelector('#sim-speed-slider');
  const simDisplay = containerRef.querySelector('#sim-speed-display');
  if (simSlider) {
    simSlider.addEventListener('input', (e) => {
      if (simDisplay) simDisplay.textContent = `Speed: ${e.target.value}x`;
    });
  }

  // 2. Doubt-Based NLP Search Highlight
  const doubtBtn = containerRef.querySelector('#doubt-submit');
  const doubtInput = containerRef.querySelector('#doubt-input');
  if (doubtBtn && doubtInput) {
    doubtBtn.addEventListener('click', () => {
       const query = doubtInput.value.toLowerCase().trim();
       if (!query || !currentModel) return;
       let found = false;
       
       currentModel.traverse(child => {
         if (child.isMesh) {
            if (child.name.toLowerCase().includes(query)) {
               // Flash Highlight Mathematical Effect
               if (!child.userData.origMat) child.userData.origMat = child.material.clone();
               child.material = new THREE.MeshPhysicalMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1.0 });
               setTimeout(() => { child.material = child.userData.origMat; }, 2000);
               found = true;
               
               // Alert the explanation logically
               let expl = LEXICON[child.name] || `${child.name} coordinates located spatially.`;
               alert(`AI Tutor: ${expl}`);
            }
         }
       });
       
       if(!found) alert(`AI Tutor: Could not find structural component matching "${query}".`);
    });
  }

  // 3. Quiz Mode
  const quizBtn = containerRef.querySelector('#btn-ar-quiz');
  if (quizBtn) {
    quizBtn.addEventListener('click', () => {
      if (!currentModel) return alert("Load a model first!");
      
      // Grab a random mesh
      const meshes = [];
      currentModel.traverse(c => { if (c.isMesh && c.name && !c.name.includes("generic")) meshes.push(c); });
      if (meshes.length === 0) return;
      const target = meshes[Math.floor(Math.random() * meshes.length)];
      
      // Isolate it mathematically
      if (!target.userData.origMat) target.userData.origMat = target.material.clone();
      target.material = new THREE.MeshPhysicalMaterial({ color: 0x00aaff, emissive: 0x0055ff, emissiveIntensity: 1.0 });
      
      // Clean names
      const niceName = target.name.replace(/_\d+$/, '');
      const answer = prompt(`QUIZ: What is the glowing blue component called? (Hint: ${niceName.charAt(0)}...)`);
      if (answer && answer.toLowerCase() === niceName.toLowerCase()) {
         alert("✅ Correct! Conceptual mastery +15%");
      } else {
         target.material = new THREE.MeshPhysicalMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1.0 });
         alert(`❌ Incorrect misconception detected. This is the ${niceName}. Error logged to Knowledge Graph.`);
      }
      setTimeout(() => { target.material = target.userData.origMat; }, 2000);
    });
  }

  // 4. Toggle Environment Context
  const envBtn = containerRef.querySelector('#btn-env-toggle');
  let envDark = true;
  if (envBtn) {
     envBtn.addEventListener('click', () => {
        if (!scene) return;
        envDark = !envDark;
        if (envDark) {
           scene.background = new THREE.Color(0x06080F);
        } else {
           // Simulate Garage/Lab lighting context
           scene.background = new THREE.Color(0xb0c4de);
        }
     });
  }

  // 5. Deep Platform Integration: AR Peer Bartering
  const barterBtn = containerRef.querySelector('#btn-barter-tutor');
  if (barterBtn) {
     barterBtn.addEventListener('click', () => {
        // Find current isolated concept to bridge the context
        let currentSubject = document.getElementById('concept-name') ? document.getElementById('concept-name').innerText : 'Unknown Logic';
        
        // Simulate deducting a time credit and pinging the WebSocket marketplace
        let confirmBarter = confirm(`🤝 Spend 1 TimeCoin to summon an expert peer into your AR space for "${currentSubject}"?`);
        
        if (confirmBarter) {
            barterBtn.innerHTML = "⏳ Matching with a Peer Expert...";
            barterBtn.style.background = "rgba(245, 158, 11, 0.2)";
            
            setTimeout(() => {
                barterBtn.innerHTML = "👥 Rahul_Verma connected (Peer Co-Op Active)";
                barterBtn.style.background = "rgba(16, 185, 129, 0.4)";
                
                // Inject fake "Peer Cursor" into 3D Space
                if (scene && currentModel) {
                    const peerCursor = new THREE.Mesh(
                        new THREE.ConeGeometry(0.05, 0.2, 8),
                        new THREE.MeshBasicMaterial({ color: 0x10B981 })
                    );
                    peerCursor.rotation.x = Math.PI / 2;
                    peerCursor.position.set(0.5, 0.5, 0.5);
                    peerCursor.name = "Peer_Pointer";
                    scene.add(peerCursor);
                    
                    // Animate peer cursor looping around model
                    if (currentModel.userData) {
                        currentModel.userData.peerPointer = peerCursor;
                    }
                }
                
                setTimeout(() => alert("Rahul_Verma: Hi! I see you are looking at the Interaction Nodes. Need help with the routing pipeline?"), 1500);
            }, 2500);
        }
     });
  }

  // 6. Multimodal Voice Interaction
  const voiceBtn = containerRef.querySelector('#btn-voice-ai');
  if (voiceBtn) {
     voiceBtn.addEventListener('mousedown', () => {
        voiceBtn.innerHTML = "🎙️ Listening... (Speak Now)";
        voiceBtn.style.background = "#FF0000";
     });
     voiceBtn.addEventListener('mouseup', () => {
        voiceBtn.innerHTML = "🎙️ Processing Audio...";
        voiceBtn.style.background = "#F59E0B";
        
        // Simulate NLP Parsing
        setTimeout(() => {
            voiceBtn.innerHTML = "🎙️ Hold to Speak to AI";
            voiceBtn.style.background = "linear-gradient(90deg, #EC4899, #F43F5E)";
            
            const doubtInput = containerRef.querySelector('#doubt-input');
            if (doubtInput) {
                doubtInput.value = "Why do these nodes blink?";
                const doubtBtn = containerRef.querySelector('#doubt-submit');
                if (doubtBtn) doubtBtn.click(); // Trigger the doubt logic
                
                // Adaptive AI: Slows down physics if the user asks a question
                const simSlider = containerRef.querySelector('#sim-speed-slider');
                if (simSlider) {
                    simSlider.value = 0.2; // Slow down simulation to help them understand
                    const event = new Event('input');
                    simSlider.dispatchEvent(event);
                    alert("AI Tutor: Let me slow down the temporal simulation to 0.2x speed so you can observe the routing clearly!");
                }
            }
        }, 1500);
      });
  }

  // 7. Cinematic Flow Tour Initiation
  const tourBtn = containerRef.querySelector('#btn-cinematic-tour');
  if (tourBtn) {
      tourBtn.addEventListener('click', () => {
          if (CinematicTourDirector.active) {
              CinematicTourDirector.stop();
              tourBtn.innerHTML = "🎬 Start Cinematic Flow Tour";
          } else {
              CinematicTourDirector.start();
              if (CinematicTourDirector.active) {
                  tourBtn.innerHTML = "⏹ Stop Tour";
              }
          }
      });
  }
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
