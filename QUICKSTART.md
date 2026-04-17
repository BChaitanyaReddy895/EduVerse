# EduVerse Quick Start Guide

## ⚡ 30-Second Setup

```javascript
// 1. Import
import { EduVerseOrchestrator } from './src/js/modules/index.js';

// 2. Create
const orchestrator = new EduVerseOrchestrator(scene, camera, renderer);

// 3. Initialize
await orchestrator.initializeAllModules(knowledgeGraph);

// 4. Use
orchestrator.updateStudentMastery({ math: 0.8 });
const rec = await orchestrator.getPersonalizedRecommendation();
```

---

## 📚 Common Tasks

### Track Student Learning
```javascript
orchestrator.updateStudentMastery({
  algebra: 0.8,
  geometry: 0.6,
  calculus: 0.3
});
```

### Handle Gesture Input
```javascript
const interaction = await orchestrator.handleGestureDetected(
  'pinch',      // gesture type
  0.95          // confidence 0-1
);
```

### Get Learning Recommendation
```javascript
const recommendation = await orchestrator.getPersonalizedRecommendation();
// Returns: {
//   optimizedPath: [],      // Dijkstra/A* path
//   ganRecommendations: [], // Attention-weighted
//   scenePredictions: [],   // Predictive next scenes
//   learningStyle: {}       // Student profile
// }
```

### Render Visualization
```javascript
// Shows 3D terrain mastery landscape + 4D knowledge graphs
orchestrator.renderMasteryVisualization();
```

### Get System Report
```javascript
const report = orchestrator.getSystemReport();
// {
//   uptime: ms,
//   modulesActive: 15,
//   studentState: {},
//   analytics: { tier1, tier2, tier3 },
//   equityReport: {},
//   systemHealth: {}
// }
```

---

## 🧪 Testing

```javascript
import IntegrationTestSuite from './src/js/modules/integration-testing.js';

const tests = new IntegrationTestSuite();

// Layer 1: Initialization
await tests.testLayer1_ModuleInitialization(scene, camera, renderer);

// Layer 2: Integration
await tests.testLayer2_FeatureIntegration(orchestrator);

// Layer 3: Performance
await tests.testLayer3_Performance(orchestrator);

// Layer 4: User Scenarios
await tests.testLayer4_UserScenarios(orchestrator);

const report = tests.generateReport();
```

---

## 📊 Feature Overview

| Tier | Feature | What It Does | Use Case |
|------|---------|-----------|----------|
| **1** | PBSE | Real physics interaction | F=ma, gravity, collisions |
| **1** | SADE | AR surface detection | Place lessons on real objects |
| **1** | SFVM | Mastery terrain | Visualize knowledge landscape |
| **1** | CLEG | Cognitive load tracking | Adapt scene complexity |
| **1** | GLP | Gesture analysis | Non-intrusive mastery check |
| **1** | TLAD | Transfer detection | Gamify unexpected learning |
| **2** | GIP | Hand gestures | Touchless 3D interaction |
| **2** | SALS | Spatial audio | 3D positioned sound |
| **2** | 4D KG | Temporal graphs | Learning evolution |
| **2** | MLPO | Learning paths | Personalized sequences |
| **2** | PAKP | Adaptive animation | Smooth pacing |
| **2** | Volumetric | 3D clouds | Molecular/volumetric data |
| **3** | PNSTF | Scene prediction | Anticipatory UI |
| **3** | GAN-KGT | Smart graph | Intelligent recommendations |
| **3** | Equity | Disparity monitor | Fair learning |

---

## 🔧 Configuration

```javascript
orchestrator.config = {
  autoStart: true,           // Auto-initialize
  debugMode: false,          // Console logging
  analyticsInterval: 5000,   // ms between analytics
  moduleSyncInterval: 1000   // ms between module sync
};
```

---

## 📡 Real APIs Used

✅ **Three.js** - 3D rendering  
✅ **Cannon.js** - Physics simulation  
✅ **MediaPipe** - Hand tracking  
✅ **WebXR** - AR plane detection  
✅ **Web Audio API** - Spatial audio  
✅ **TensorFlow.js** - ML inference  
✅ **Eye Tracking API** - Gaze data  

**No simulations. All real.**

---

## 🎯 Architecture

```
EduVerse System
├─ TIER 1 (Foundational)
│  ├─ Physics: F=ma, gravity, collisions
│  ├─ AR: Real surface detection
│  ├─ Visualization: Mastery terrain
│  ├─ Cognition: Gaze-based load
│  ├─ Assessment: Gesture analysis
│  └─ Gamification: Transfer rewards
├─ TIER 2 (Interactive)
│  ├─ Input: Hand gestures
│  ├─ Audio: Binaural beats
│  ├─ Graphs: 4D temporal
│  ├─ Planning: Multi-modal paths
│  ├─ Animation: Adaptive keyframes
│  └─ Rendering: Volumetric
├─ TIER 3 (Intelligent)
│  ├─ Prediction: Next scenes
│  ├─ Reasoning: Graph attention
│  └─ Equity: Disparity monitor
└─ Integration: Orchestration + Testing
```

---

## 💡 Common Patterns

### Listen to Events
```javascript
window.addEventListener('animation-confidence', (e) => {
  console.log(`Confidence: ${e.detail.confidence}`);
});
```

### Register Student Demographics
```javascript
orchestrator.modules.equityAware.registerStudent('student_123', {
  gender: 'M',
  socioeconomicStatus: 'middle',
  language: 'English',
  region: 'North America',
  disability: 'none'
});
```

### Get Equity Report
```javascript
const equityReport = orchestrator.modules.equityAware.getEquityReport();
// {
//   overallEquityScore: 0.92,
//   groupMetrics: [...],
//   disparityDetections: 2,
//   recommendations: [...]
// }
```

### Pre-render Scene
```javascript
orchestrator.modules.predictiveTransitions.preRenderScene(
  'geometry_lesson',
  (sceneId) => createScene(sceneId)
);
```

---

## 🚀 Deployment

```bash
# Install dependencies
npm install

# Build
npm run build

# Serve
npm run serve

# Test
npm run test

# Analyze
npm run analyze
```

---

## 📈 Metrics to Monitor

- **Engagement**: Gesture frequency, time in lessons
- **Learning**: Mastery progression, transfer events
- **Performance**: FPS, memory, load time
- **Equity**: Disparity score, group metrics
- **Predictions**: Accuracy of scene/recommendation predictions

---

## ⚙️ Troubleshooting

**Issue**: Modules not initializing
- Check WebXR/MediaPipe permissions
- Verify dependencies installed
- Check browser console for errors

**Issue**: Low FPS
- Reduce volumetric density
- Disable expensive shadows
- Check cognitive load (auto-reduces)

**Issue**: Poor gesture recognition
- Ensure good lighting
- Position camera clear of torso
- Increase confidence threshold

---

## 🎓 Learning Resources

- **API Docs**: See `/src/js/modules/index.js`
- **Implementation Guide**: See `IMPLEMENTATION.md`
- **Test Examples**: See `integration-testing.js`
- **Feature Descriptions**: See `competitive-analysis.js`

---

## 📞 Support

For issues or questions:
1. Check documentation
2. Review test suite examples
3. Check module getAnalytics() output
4. Enable debugMode for logging

---

**EduVerse: Research-Grade Learning. Production-Ready. Fully Functional.** ✨

