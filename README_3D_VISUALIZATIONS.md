# 🎓 EduVerse 3D Real-Time Learning Visualizations

## Overview
Real-time 3D visualization dashboard showing your learning journey in stunning interactive graphics. Watch as your knowledge grows, see your learning pathways, and celebrate quiz victories with particle effects!

---

## 🎨 Features Implemented

### 1. **Interactive 3D Knowledge Graph**
**Location:** Dashboard → "Knowledge Graph" mode

- **Visualization:** Floating nodes representing concepts in different domains
  - **Size** = Your mastery % (larger = more mastered)
  - **Color** = Domain: Math (Blue), Soft Skills (Cyan), Physics (Purple), CS (Red)
  - **Glow intensity** = Proficiency level
  - **Connecting lines** = Prerequisite relationships (Purple = prerequisite, Cyan = transfer)

- **Interactivity:**
  - Gentle auto-rotation around center
  - Hover effects highlight relevant concepts
  - Real-time updates as mastery improves

---

### 2. **Real-Time Mastery Growth Visualization**
**Location:** Dashboard → "Mastery Growth" mode

Watch each subject transform as your accuracy increases:

- **Physics** → Rotating atom core with orbiting electrons
  - Scale and glow intensity grow with accuracy %
- **Biology** → Growing DNA helix
  - More helical segments appear as accuracy increases
- **Chemistry** → Expanding H₂O molecules
  - Bond angles animate and scale with progress
- **Engineering** → Rotating meshing gears
  - Faster rotation + metallic sheen as mastery grows
- **Mathematics** → Morphing torus knot
  - Thickness and complexity increase with proficiency
  - Emissive glow shows current level

**Accuracy Rings:**
- 🟢 Green ring (≥80%) = Strong performance
- 🟠 Orange ring (60-80%) = Solid progress
- 🔴 Red ring (<60%) = Area for growth

---

### 3. **3D Quiz Feedback with Particle Effects**
**Trigger:** Automatically fires when quizzes are completed in AR Learning

- **Correct Answer:** 50 particles explode outward with rainbow colors
  - Particles follow physics (gravity, velocity decay)
  - Range: 3-8 units/sec outward velocity
  - Lifespan: 1 second with opacity fade
  - Celebratory toast: ✅ Correct! +{accuracy}pts

- **Incorrect Answer:** Warning feedback
  - Toast: ❌ Try again!
  - Encourages retrying without punishment

**Integration Points:**
- Called from quiz submission in AR Learning
- Works in standalone dashboard or any page
- Real-time accuracy calculation included

---

### 4. **3D Lesson Pathway Navigator**
**Location:** Dashboard → "Lesson Pathways" mode

Interactive 3D grid showing lesson progress across all subjects:

- **🟢 Green boxes** = Completed (≥70% mastery)
- **🟠 Orange boxes** = In Progress (1-69% mastery)  
- **⚩ Gray boxes** = Locked (not started)

- **Labels:** Shows lesson type (AR/3D)
- **Navigation:** Pan and rotate to explore
- **Color-coded:** By completion status for quick overview

---

## 📍 How to Access

### From Home Page
Click the **"🎓 3D Learning Visualizer"** card in the bento box grid.

### From Code
```javascript
import { showLearningDashboard } from './modules/quiz-feedback.js';

// Show all visualizations
showLearningDashboard('all');

// Show specific mode
showLearningDashboard('knowledge');  // Knowledge graph only
showLearningDashboard('mastery');    // Mastery growth only
showLearningDashboard('pathway');    // Lesson pathways only
```

---

## 🚀 Using Quiz Feedback

### Manual Integration (if needed)
```javascript
import { triggerQuizFeedback } from './modules/quiz-feedback.js';

// When quiz is submitted
const isCorrect = score >= 70;
const accuracy = Math.round((score / maxScore) * 100);

triggerQuizFeedback(isCorrect, accuracy, 'Physics');
```

### Dashboard Auto-Updates
Whenever you:
- ✅ Complete a quiz
- 📝 Update subject progress
- 🎯 Change mastery levels

The visualizations automatically refresh to show your latest metrics.

---

## 🎮 Controls & Interactions

### General
- **Mouse wheel / Pinch:** Zoom in/out
- **Right-click drag:** Pan camera
- **Buttons:** Switch between visualization modes

### Knowledge Graph
- **Auto-rotation:** Gentle Y-axis spin
- **Hover over nodes:** Expand + highlight
- **Color legend:** Via tooltip on startup

### Mastery Organisms
- **Floating animation:** Smooth Y-position bobbing
- **Scaling:** Accuracy-based size changes in real-time
- **Color rings:** Accuracy percentile rings around each organism
- **Label visibility:** Subject name + icon above each organism

### Lesson Pathways
- **3D grid layout:** 6 lessons per row, staggered by subject
- **Tooltip on hover:** Subject name + lesson name + mastery %
- **Slow rotation:** Z-axis subtle rotation for visual interest

---

## 🔄 Real-Time Sync

The dashboard listens to your data store for real-time updates:

```javascript
// Automatic subscriptions active:
store.subscribe('subject_progress', () => Dashboard3D.updateRealTime());
store.subscribe('quiz_scores', () => Dashboard3D.updateRealTime());
store.subscribe('knowledge_mastery', () => Dashboard3D.updateRealTime());
```

**When to see updates:**
- Immediately after quiz submission
- After completing a lesson
- When mastery scores change in AR Learning
- After BACP recalculation in Analytics

---

## 🎨 Technical Details

### Libraries Used
- **Three.js:** 3D rendering engine
- **OrbitControls:** Camera control for holograms
- **Canvas Texture:** Dynamic label rendering

### Algorithms
- **LOD (Level of Detail):** VSCR adapts rendering based on comprehension
- **Sigmoid Curves:** Smooth transitions between states
- **Physics Simulation:** Particle gravity and decay
- **Entropy Weighting:** Node ordering optimization (EHDG)

### Performance
- **WebGL optimization:** Batched geometry, reduced material count
- **Efficient updates:** Only modified attributes re-render
- **Frame rate:** 60 FPS target (scales to monitor refresh rate)
- **Memory:** Cleanup on page navigation

---

## 📊 Data PointsVisualized

Each visualization pulls from your real data:

**Knowledge Graph**
- Source: `store.getKnowledgeGraphData()` + `store.getAllMastery()`
- Updates: Every 30 seconds OR on quiz completion

**Mastery Growth**
- Source: `store.getSubjectProgress()` + `store.computeAnalytics()`
- Metrics: Accuracy %, Completion %
- Color: Based on `getAccuracyColor()`

**Quiz Feedback**
- Source: Quiz submission scores
- Accuracy: `Math.round((score / maxScore) * 100)`
- Particles: 50 per correct answer

**Lesson Pathways**
- Source: `store.getSubjectProgress()` → lessons array
- Status: Based on `lesson.mastery` value
- Total: 6 + 5 + 2 + 2 + 2 + 2 = 21 lessons visualized

---

## 🛠️ Customization

### Change particle color on quiz success
File: `src/js/modules/3d-learning-dashboard.js`, line ~310
```javascript
color: new THREE.Color().setHSL(Math.random(), 0.8, 0.6),
```
Modify `setHSL(hue, saturation, lightness)` values.

### Adjust knowledge graph rotation speed
File: `src/js/modules/3d-learning-dashboard.js`, line ~382
```javascript
knowledgeGraph3D.rotation.y += 0.0005;  // Increase this value
```

### Change mastery organism scaling
File: `src/js/modules/3d-learning-dashboard.js`, line ~165
```javascript
const scale = 0.5 + (accuracy / 200);  // Adjust denominator
```

---

## 🐛 Troubleshooting

### Dashboard not showing?
1. Check browser console (F12) for errors
2. Ensure WebGL is enabled in browser
3. Clear localStorage: `localStorage.clear()`

### Visualizations not updating?
1. Verify data store subscriptions are active
2. Check that `triggerQuizFeedback()` is called
3. Run: `Dashboard3D.updateRealTime()` manually

### Low FPS?
1. Reduce particle count: `const particleCount = 30;` (from 50)
2. Lower mesh resolution: Use `16` instead of `32` segments
3. Disable auto-rotation on some visualizations

### Particles not showing?
1. Check if scene is null: `if (!dashboardScene) return;`
2. Verify Three.js is loaded before dashboard module
3. Set particle size: `.size = 0.1;` (increase if too small)

---

## 📚 Educational Value

These real-time visualizations support evidence-based learning:

✅ **Immediate Feedback Loop** — See quiz results instantly transformed into 3D particles
✅ **Knowledge Visualization** — Understand prerequisite chains visually  
✅ **Progress Tracking** — Watch organisms grow as you master subjects
✅ **Motivation** — Gamification through stunning visuals and particle effects
✅ **Data-Driven** — 100% of data comes from real learner metrics, no mock data

---

## 🔗 Integration Points

Used by:
- `analytics.js` — Hologram viewer for subject comparison
- `ar-learning.js` — Quiz feedback triggers
- `home.js` — Dashboard card naviga

---

**Version:** 2.0  
**Last Updated:** April 2026  
**Status:** Research-Grade Production Ready ✓
