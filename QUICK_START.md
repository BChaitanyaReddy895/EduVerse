# 🚀 Quick Start: EduVerse Professional AR - 5 Minutes to Active

## STEP 1: Install Dependencies (2 min)
```bash
cd EduVerse
npm install
```
✅ This adds WebXR, TensorFlow.js, Google Vision API

---

## STEP 2: Get Google Vision API Key (2 min)

**Option A: Fast (Use existing key)**
```bash
# If you already have a Google Cloud project:
export GOOGLE_VISION_API_KEY="your_existing_key"
```

**Option B: New Setup**
1. Go: https://console.cloud.google.com
2. Click: "Create Project" → Name: "EduVerse"
3. Search: "Vision API" → Click "Enable"
4. Go: "Credentials" → "Create Credentials" → "API Key"
5. Copy key and run:
   ```bash
   export GOOGLE_VISION_API_KEY="your_new_key"
   ```

---

## STEP 3: Start Server (1 min)
```bash
npm run dev
```
✅ Opens at http://localhost:5174

---

## STEP 4: Test AR (30 sec)
1. Open http://localhost:5174
2. Click: "AR Learning" in menu
3. Click: "🥽 Enter WebXR AR Mode"
4. Check: Console shows "✅ WebXR session created"
5. Check: Status shows "🟢 Active"

---

## WHAT YOU NOW HAVE

```
✅ Light Estimation
   - Virtual objects match room lighting
   - Shadows adapt to environment
   
✅ Object Recognition
   - System sees: microscope, beaker, circuit, etc.
   - Recognizes 90+ object categories
   
✅ Adaptive Visualization
   - Shows appropriate detail for learner level
   - Beginner → Advanced → Expert progression
   
✅ Physics Simulation
   - Objects interact with real surfaces
   - Gravity, collision, realistic motion
   
✅ Environment Mapping
   - Detects tables, walls, surfaces
   - Places objects on real geometry
```

---

## QUICK TESTS

### Test Light Estimation (30 sec)
```
1. WebXR active
2. Dim the room lights
3. Watch visualization get darker
4. Brighten lights
5. Watch visualization brighten
```

### Test Object Recognition (30 sec)
```
1. Click "👁️ Object Recognition"
2. Point at any object
3. Check console: "👁️ Objects detected: [name]"
4. Watch suggestion: Related lesson appears
```

### Test Adaptive Visualization (1 min)
```
1. Click any lesson
2. System detects domain (PHYSICS, ENGINEERING, etc.)
3. Generates visualization at INTERMEDIATE level
4. Try other lessons to see different domains
```

---

## TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| "WebXR not supported" | Use Chrome/Edge, enable in flags |
| "API key not configured" | Set GOOGLE_VISION_API_KEY env var |
| Low FPS | Close other tabs, disable object detection |
| Objects not recognized | Ensure good lighting, try different objects |

---

## FILE LOCATIONS

```
Main Implementation:
├── package.json (WebXR deps)
├── src/js/modules/ar-learning.js (v6.0 - WebXR controls)
├── src/js/utils/webxr-scene-understanding.js (380 lines)
└── src/js/utils/google-vision-ar.js (320 lines)

Documentation:
├── PROFESSIONAL_AR_SETUP.md (600+ line guide)
├── PROJECT_SUMMARY.md (Executive summary)
├── IMPLEMENTATION_COMPLETE.md (Testing checklist)
└── QUICK_START.md (This file)
```

---

## WHAT'S IMPLEMENTED

### Layer 1: Scene Understanding ✅
- Light probe with ambient/directional light
- Plane detection (horizontal + vertical)
- Depth sensing for occlusion
- Hit testing for placement

### Layer 2: Object Recognition ✅
- COCO-SSD (real-time detection)
- 90+ object categories
- Google Vision API (professional fallback)
- Educational concept mapping

### Layer 3: Physics Simulation ✅
- Gravity + collision
- Surface interaction
- Realistic motion equations
- Force visualization

### Layer 4: Adaptive Rendering ✅
- 4 complexity levels (Beginner→Expert)
- 26 academic domains
- Procedurally generated visualizations
- Context-aware adaptation

---

## COMMAND REFERENCE

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Set API key (Linux/Mac)
export GOOGLE_VISION_API_KEY="your_key"

# Set API key (Windows PowerShell)
$env:GOOGLE_VISION_API_KEY = "your_key"

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## EXPECTED CONSOLE OUTPUT

When WebXR active, you should see:
```
✅ WebXR session created successfully
💡 Light Probe: ambient = 1.2, direction = (0.5, -0.7, 0.3)
📍 Planes: 2 detected (1 horizontal, 1 vertical)
👁️ Objects: 3 detected (microscope: 0.95, beaker: 0.87, circuit: 0.92)
🎬 Frame rate: 58 FPS
```

If you see these, everything is working!

---

## NEXT AFTER QUICK TEST

1. **Read:** PROFESSIONAL_AR_SETUP.md (understand features)
2. **Test:** Run all 6 tests in IMPLEMENTATION_COMPLETE.md
3. **Optimize:** Check performance metrics
4. **Deploy:** Follow Phase 2 roadmap

---

## SUPPORT

**Stuck?** Check these files in order:
1. QUICK_START.md (you are here)
2. PROFESSIONAL_AR_SETUP.md (detailed explanation)
3. IMPLEMENTATION_COMPLETE.md (troubleshooting section)
4. PROJECT_SUMMARY.md (overall architecture)

---

**Status:** ✅ READY TO GO
**Time to working AR:** ~5 minutes
**No hardware needed:** Works on desktop, needs WebXR-capable phone for full experience

🚀 **Let's go!**
