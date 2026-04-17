// ============================================
// EduVerse Module Index
// Export all 15+ modules for centralized access
// ============================================

// Tier 1: Foundational Features
export { default as PBSEPhysicsEngine } from './tier1/pbse-physics-engine.js';
export { default as SADEEnvironment } from './tier1/sade-environment.js';
export { default as SFVMMasteryLandscape } from './tier1/sfvm-mastery-landscape.js';
export { default as CLEGCognitiveLoad } from './tier1/cleg-cognitive-load.js';
export { default as GLPGesturalTrajectories } from './tier1/glp-gestural-trajectories.js';
export { default as TLADTransferDetection } from './tier1/tlad-transfer-detection.js';

// Tier 2: Interactive Advanced Features
export { default as GIPGestureInteraction } from './tier2/gip-gesture-interaction.js';
export { default as SALSSpatialAudio } from './tier2/sals-spatial-audio.js';
export { default as KnowledgeHypergraph4D } from './tier2/knowledge-hypergraph-4d.js';
export { default as MLPOLearningPathOptimizer } from './tier2/mlpo-learning-paths.js';
export { VolumetricRendering, PAKPProceduralAnimation } from './tier2/volumetric-rendering-pakp.js';

// Tier 3: Intelligent Adaptive Features
export { default as PNSTFPredictiveTransitions } from './tier3/pnstf-predictive-transitions.js';
export { default as GANKnowledgeGraphTraversal } from './tier3/gan-knowledge-graph.js';
export { default as EquityAware3DComplexity } from './tier3/equity-aware-3d.js';

// System Orchestrator
export { default as EduVerseOrchestrator } from './orchestrator.js';

// Feature count: 15 unique modules (+ sub-components)
export const FEATURE_INVENTORY = {
  tier1: {
    name: 'Foundational Features',
    count: 6,
    modules: [
      'PBSE - Physics-Based Simulation Engine',
      'SADE - Surface-Aware Didactic Environments',
      'SFVM - Stress Field Mastery Visualization',
      'CLEG - Cognitive Load Estimation via Gaze',
      'GLP - Gestural Learning Trajectories',
      'TLAD - Transfer Learning Anomaly Detection'
    ]
  },
  tier2: {
    name: 'Interactive Advanced Features',
    count: 6,
    modules: [
      'GIP - Gesture Recognition & Interaction',
      'SALS - Spatial Audio Learning System',
      '4D Knowledge Hypergraphs',
      'MLPO - Multi-Modal Learning Path Optimization',
      'PAKP - Procedural Animation via Keyframe Prediction',
      'Volumetric Rendering'
    ]
  },
  tier3: {
    name: 'Intelligent Adaptive Features',
    count: 3,
    modules: [
      'PNSTF - Predictive Scene Transitions',
      'GAN-KGT - Graph Attention Networks',
      'Equity-Aware 3D Complexity Management'
    ]
  },
  totalFeatures: 15,
  totalSubComponents: 17
};

export const FEATURE_DESCRIPTIONS = {
  'PBSE': 'Students interact with 3D objects experiencing real physics (F=ma, gravity, collisions). Complete F-force tracking for analytics.',
  'SADE': 'Uses WebXR plane detection to place 3D lessons on real-world surfaces (floor, walls, ceiling). Contextual teaching.',
  'SFVM': 'Renders mastery as navigable 3D terrain - weak areas are valleys, strong areas are peaks. Physics-based learning gravity.',
  'CLEG': 'Tracks eye movement (fixation, saccades, pupil dilation, blinks) to measure cognitive load. Auto-adapts 3D scene complexity.',
  'GLP': 'Analyzes hand movement patterns (smoothness, speed, curvature, acceleration) to assess understanding without testing.',
  'TLAD': 'Detects anomalous mastery (unexpected skill gains indicating transfer learning). Generates rewards & recommendations.',
  'GIP': 'Recognizes 10 hand gestures and maps them to 3D interactions (zoom, rotate, select, etc.). Real MediaPipe integration.',
  'SALS': 'Creates 3D positioned sound and binaural beats (delta/theta/alpha/beta) for multimodal learning enhancement.',
  '4D': 'Temporal knowledge graph visualization showing learning evolution over time. Identifies co-learned concepts & learning velocity.',
  'MLPO': 'Generates multiple optimized learning paths based on learning style (visual/kinesthetic/auditory/reading). Retention-optimized.',
  'PAKP': 'LSTM predicts next animation keyframes based on student understanding. Animations adapt to pace & confidence.',
  'Volumetric': 'Renders molecular orbitals, uncertainty clouds, and other volumetric content for chemistry/biology lessons.',
  'PNSTF': 'AI predicts next scene student needs and pre-renders it. Transition feels anticipatory rather than reactive.',
  'GAN-KGT': 'Replaces simple graph traversal with Graph Attention Networks. Attention weights guide recommendation generation.',
  'Equity': 'Monitors if demographic groups struggle with 3D features. Auto-adjusts complexity to maintain equitable learning.'
};

export const USAGE_EXAMPLE = `
// Import orchestrator
import { EduVerseOrchestrator } from './modules/index.js';

// Initialize
const orchestrator = new EduVerseOrchestrator(scene, camera, renderer);
await orchestrator.initializeAllModules(knowledgeGraph);

// Use individual features or get recommendations
const recommendation = await orchestrator.getPersonalizedRecommendation();

// Track events
orchestrator.updateStudentMastery({ mathAlgebra: 0.8 });
await orchestrator.handleGestureDetected('pinch', 0.95);

// Render
orchestrator.renderMasteryVisualization();

// Get analytics
const report = orchestrator.getSystemReport();
`;

export default {
  FEATURE_INVENTORY,
  FEATURE_DESCRIPTIONS,
  USAGE_EXAMPLE
};
