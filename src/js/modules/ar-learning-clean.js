// Professional AR Learning Module
// Integrates: WebXR Scene Understanding + Google Vision + Adaptive Visualization
// Features: Light estimation, plane detection, object recognition, physics

import * as THREE from 'three';
import { WebXRSceneUnderstanding } from '../utils/webxr-scene-understanding.js';
import { GoogleVisionARIntegration } from '../utils/google-vision-ar.js';
import { UniversalConceptAnalyzer } from '../utils/universal-concept-analyzer.js';
import { IntelligentVisualizationCoordinator } from '../utils/visualization-coordinator.js';

let webxrScene = null;
let googleVision = null;
let conceptAnalyzer = null;
let vizCoordinator = null;
let isWebXRActive = false;
let isObjectRecognitionActive = false;

// Initialize AR Learning Module
export async function initializeARLearning() {
  conceptAnalyzer = new UniversalConceptAnalyzer();
  vizCoordinator = new IntelligentVisualizationCoordinator();
  
  const apiKey = process.env.GOOGLE_VISION_API_KEY || localStorage.getItem('GOOGLE_VISION_API_KEY');
  if (apiKey) {
    googleVision = new GoogleVisionARIntegration(apiKey);
  }
  
  console.log('AR Learning Module initialized');
}

// Render AR Learning UI
export function renderARLearning(container) {
  container.innerHTML = `
    <div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; color: white;">
      <h2 style="margin: 0 0 15px 0; font-size: 1.5rem;">Professional AR Learning</h2>
      <p style="margin: 0 0 20px 0; opacity: 0.9;">Light Estimation • Object Recognition • Adaptive Visualization • Physics Simulation</p>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
        <button onclick="window.enableWebXR()" style="padding: 12px 20px; background: #00d4ff; color: #000; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.9rem;">
          Enter WebXR Mode
        </button>
        <button onclick="window.enableObjectRecognition()" style="padding: 12px 20px; background: #00ff88; color: #000; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.9rem;">
          Enable Object Recognition
        </button>
        <button onclick="window.disableWebXR()" style="padding: 12px 20px; background: #ff6b6b; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.9rem; grid-column: 1/-1;">
          Exit AR Mode
        </button>
      </div>
      
      <div id="ar-status" style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 4px; font-size: 0.9rem; font-family: monospace;">
        <div>Status: <strong id="status-indicator">Canvas Mode Ready</strong></div>
        <div id="planes-count" style="margin-top: 5px;">Planes: 0 detected</div>
        <div id="objects-count" style="margin-top: 5px;">Objects: 0 recognized</div>
        <div id="light-status" style="margin-top: 5px;">Light: Not estimated</div>
      </div>
    </div>
  `;
  
  window.addEventListener('ar-planes-updated', (e) => {
    document.getElementById('planes-count').textContent = `Planes: ${e.detail.count} detected`;
  });
  
  window.addEventListener('ar-objects-detected', (e) => {
    document.getElementById('objects-count').textContent = `Objects: ${e.detail.count} recognized`;
  });
  
  window.addEventListener('ar-light-updated', (e) => {
    const light = e.detail;
    document.getElementById('light-status').textContent = 
      `Light: Ambient ${light.ambientIntensity.toFixed(2)} | Direction (${light.direction.x.toFixed(2)}, ${light.direction.y.toFixed(2)}, ${light.direction.z.toFixed(2)})`;
  });
}

// Enable WebXR Mode
export async function enableWebXR() {
  try {
    if (isWebXRActive) {
      console.log('WebXR already active');
      return;
    }
    
    webxrScene = new WebXRSceneUnderstanding();
    const initialized = await webxrScene.initializeWebXR(
      new THREE.Scene(),
      new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000),
      new THREE.WebGLRenderer({ antialias: true, alpha: true })
    );
    
    if (initialized) {
      isWebXRActive = true;
      document.getElementById('status-indicator').textContent = 'WebXR Active';
      document.getElementById('status-indicator').style.color = '#00ff88';
      console.log('WebXR enabled successfully');
      
      // Show environment data in real-time
      displayWebXRData();
    }
  } catch (error) {
    console.error('WebXR initialization failed:', error);
    document.getElementById('status-indicator').textContent = 'WebXR Failed (Check browser support)';
  }
}

// Enable Object Recognition
export async function enableObjectRecognition() {
  try {
    if (isObjectRecognitionActive) {
      console.log('Object recognition already active');
      return;
    }
    
    if (!webxrScene) {
      console.warn('Enable WebXR first');
      return;
    }
    
    // Load COCO-SSD for real-time detection
    const model = await tf.loadGraphModel('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/coco-ssd.min.js');
    isObjectRecognitionActive = true;
    
    console.log('Object recognition enabled');
    document.getElementById('status-indicator').textContent = 'Object Recognition Active';
    
    // Start detection loop
    startObjectDetectionLoop(model);
  } catch (error) {
    console.error('Object recognition setup failed:', error);
  }
}

// Disable WebXR
export function disableWebXR() {
  if (webxrScene) {
    webxrScene.exitXRMode?.();
  }
  
  isWebXRActive = false;
  isObjectRecognitionActive = false;
  document.getElementById('status-indicator').textContent = 'Canvas Mode Ready';
  document.getElementById('status-indicator').style.color = '#fff';
  console.log('WebXR disabled');
}

// Display WebXR environment data
function displayWebXRData() {
  setInterval(() => {
    if (!isWebXRActive || !webxrScene) return;
    
    const envData = webxrScene.getEnvironmentData?.();
    if (!envData) return;
    
    // Update planes
    window.dispatchEvent(new CustomEvent('ar-planes-updated', {
      detail: { count: envData.planes?.length || 0 }
    }));
    
    // Update light
    if (envData.lighting) {
      window.dispatchEvent(new CustomEvent('ar-light-updated', {
        detail: {
          ambientIntensity: envData.lighting.ambientIntensity || 1.0,
          direction: envData.lighting.primaryLightDirection || { x: 0, y: 1, z: 0 }
        }
      }));
    }
  }, 500); // Update every 500ms
}

// Start object detection loop
function startObjectDetectionLoop(model) {
  const video = document.querySelector('video');
  if (!video) return;
  
  setInterval(async () => {
    if (!isObjectRecognitionActive) return;
    
    try {
      const predictions = await model.estimateObjects(video, 0.5);
      
      // Map objects to educational concepts
      const concepts = predictions.map(pred => {
        const domain = conceptAnalyzer.analyzeConcept(pred.class);
        return {
          object: pred.class,
          confidence: pred.score,
          domain: domain.domain,
          confidence_score: domain.confidence
        };
      });
      
      window.dispatchEvent(new CustomEvent('ar-objects-detected', {
        detail: { count: concepts.length, objects: concepts }
      }));
      
      console.log('Recognized objects:', concepts);
      
      // Generate adaptive visualization for highest confidence object
      if (concepts.length > 0) {
        const topObject = concepts[0];
        const config = generateAdaptiveARVisualization(topObject.object, 'INTERMEDIATE');
        console.log('Adaptive viz config:', config);
      }
    } catch (error) {
      console.error('Object detection error:', error);
    }
  }, 1000); // Run every second
}

// Generate adaptive visualization based on learner level
export function generateAdaptiveARVisualization(concept, learnerLevel) {
  const levels = {
    BEGINNER: { complexity: 0.3, components: 1, animations: false },
    INTERMEDIATE: { complexity: 0.6, components: 3, animations: true },
    ADVANCED: { complexity: 0.8, components: 6, animations: true },
    EXPERT: { complexity: 1.0, components: 10, animations: true }
  };
  
  const level = levels[learnerLevel] || levels.INTERMEDIATE;
  
  return {
    concept,
    learnerLevel,
    visualizationConfig: {
      complexity: level.complexity,
      componentCount: level.components,
      animationsEnabled: level.animations,
      physicsEnabled: level.complexity > 0.5,
      interactivityLevel: level.complexity * 100
    },
    renderingConfig: {
      qualityScale: level.complexity,
      shadowQuality: level.complexity > 0.6 ? 'high' : 'medium',
      particleCount: Math.floor(1000 * level.complexity),
      lightingQuality: level.complexity > 0.7 ? 'pbr' : 'basic'
    }
  };
}

// Start lesson with specific concept
export async function startLesson(concept, learnerLevel = 'INTERMEDIATE') {
  console.log(`Starting lesson: ${concept} at ${learnerLevel} level`);
  
  // Analyze domain
  const analysis = conceptAnalyzer.analyzeConcept(concept);
  console.log('Domain analysis:', analysis);
  
  // Generate visualization
  const vizConfig = generateAdaptiveARVisualization(concept, learnerLevel);
  console.log('Visualization config:', vizConfig);
  
  // Get detailed visualization from coordinator
  const detailedViz = vizCoordinator.generateVisualization(
    analysis.domain,
    vizConfig.visualizationConfig.complexity
  );
  
  console.log('Ready to render:', detailedViz);
}

// Expose global functions for buttons
window.enableWebXR = enableWebXR;
window.enableObjectRecognition = enableObjectRecognition;
window.disableWebXR = disableWebXR;
window.generateAdaptiveARVisualization = generateAdaptiveARVisualization;
window.startLesson = startLesson;

// Public API
export const ARLearning = {
  initialize: initializeARLearning,
  render: renderARLearning,
  enableWebXR,
  enableObjectRecognition,
  disableWebXR,
  generateAdaptiveARVisualization,
  startLesson,
  getWebXRStatus: () => isWebXRActive,
  getObjectRecognitionStatus: () => isObjectRecognitionActive
};

export default ARLearning;
