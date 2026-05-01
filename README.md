# EduVerse: Semantic-Cognitive Augmented Reality (SCCA) Platform

## 📚 Overview

**EduVerse** is a production-ready immersive educational platform integrating deeply entangled machine-vision algorithms and structural 3D Augmented Reality. Designed for higher education and structural engineering, EduVerse abandons static 3D models in favor of real-time mathematically driven physics parameterization entirely controlled by latent tensors from a Vision framework.

**Version**: 3.0.0 (Research Edition)  
**Status**: Production Ready ✅  
**License**: Research/Educational Use  

---

## 🎯 Key Innovation: Cognitive Mesh Eruption (CME)

Traditional Educational AR applications are static: an AI classifies an image, and a single, unmovable 3D model loads. 
In EduVerse, we introduce **Dynamic Semantic-Vector Disassembly** (Cognitive Mesh Eruption).

1. The Python **SCCA Server** (ResNet/Vision Transformer) analyzes the spatial features of an uploaded 2D image and extracts a multi-dimensional generative blueprint array.
2. The Javascript 3D Engine dynamically traverses the geometric node hierarchy of high-fidelity HD `.glb` assets.
3. Without relying on pre-baked `.gltf` animations, the engine forces deep mechanical subcomponents (engines, transmissions, wiring) outward exactly along calculated physical coordinate vectors.
4. The severity and expansion physics of this **Real-time Exploded View** are controlled directly by the AI's neural output tensor.

This represents a highly robust research novelty: **"AI-Latent controlled geometric disassembly"**, connecting Computer Vision Feature Extraction directly to Procedural XR Physics.

---

## 📦 System Architecture

```
EduVerse System
│
├─ Python Machine Learning Pipeline (SCCA Server)
│  ├─ Multi-label CIFAR-10 Identification
│  ├─ High-dimensional cosine similarity mappings
│  └─ Latent Blueprint Tensor Extraction
│
├─ WebXR Subsystems
│  ├─ Cognitive Layer Generator (Procedural AR Lexicons)
│  ├─ Generative Parametric Assembly (Legacy fallback)
│  └─ Semantic-Cognitive Model Retrieval Engine
│
└─ Visual Rendering Features
   ├─ Dynamic Holographic Extrusion (Zero-Shot)
   ├─ X-Ray Translucency Mapping
   ├─ Semantic Highlight Eruption (CME)
   └─ DRACO High-Fidelity Geometry Decompression
```

---

## 🚀 Quick Start

### Installation

```bash
# Clone repository
git clone https://github.com/BChaitanyaReddy895/EduVerse.git
cd EduVerse

# Install Web dependencies
npm install

# Install AI dependencies
pip install Flask flask-cors torch torchvision numpy transformers pillow
```

### Running the System

You must run TWO separate terminals for the dual-architecture to operate.

**Terminal 1: Python ML Server**
```bash
python scca_server.py
```
*(Wait until it says "HIGH-LEVEL RESEARCH SCCA SERVER READY")*

**Terminal 2: Web Server**
```bash
npm run dev
```

---

## 🧪 Research-Grade Upgrade Workflow

For paper evidence and real-world validation, use the new scripts:

1. Fine-tune/evaluate CLIP with parameter updates:

```bash
python notebooks/clip_finetune_research.py --dataset-root <dataset_root> --epochs 8
```

2. Generate paper-ready metric plots:

```bash
python notebooks/plot_clip_research_metrics.py --metrics-csv notebooks/clip_research_outputs/training_metrics.csv --summary-json notebooks/clip_research_outputs/summary.json
```

3. Run real-world/OOD deterministic benchmark:

```bash
python notebooks/clip_realworld_benchmark.py --model-dir scca_finetuned --in-domain-dir <in_domain_test> --ood-dir <ood_images>
```

See `CLIP_RESEARCH_UPGRADE_GUIDE.md` and `RESEARCH_LIMITATIONS_UPGRADE.md` for full protocol.

---

## 🔬 Component Breakdown

### 1. **Model Retrieval Engine** (`model-retrieval-engine.js`)
- **Capability**: Handles Draco-compressed GLB asset decompression.
- **Novelty**: Applies the CME Physics calculation. Determines distance from the geometric bounding box center and explodes child meshes `(position.addScaledVector(direction, explosionSeverity))`. 

### 2. **Semantic-Cognitive AR Processor** (`semantic-cognitive-ar.js`)
- **Capability**: Connects the 2D web front-end to the Python Neural Network.
- **Mechanisms**: Bypasses traditional image caching to securely fetch `[0.0, 1.0]` tensor arrays to feed directly into the AR physics loop.

### 3. **Python SCCA Integrator** (`scca_server.py`)
- **Capability**: Pre-trained ResNet computer vision bridging.
- **Mechanisms**: Handles raw bytes from HTTP streams, computes structural tensors directly tied to visual confidence parameters. 

---

## 🎓 Research Contributions (For Paper Formatting)

### Academic Novelty Core
**Title Suggestion**: *“Dynamic Semantic-Vector Disassembly: Parameterizing WebAR Exploded Views via Vision Transformer Latent Encodings”*
**Summary**: Instead of utilizing fixed artist-generated Keyframe animations, EduVerse demonstrates the algorithmic separation of 3D polygon nodes parameterized entirely by contextual vision tensors, thereby enabling fully autonomous AR educational platforms for any mechanical dataset.

### Patent Opportunities
- AI-Driven Exploded-View generation parsing geometric centroids.
- Automated structural text-mapping utilizing isolated semantic sub-meshes.

---

## 📚 Adding Custom Models to Your Dataset

Because the Cognitive Mesh Eruption (CME) algorithm is universally implemented, you can instantly upgrade any of the 10 CIFAR-10 classes by simply downloading models.

1. Go to Sketchfab or Khronos-Group.
2. Download a high-quality `.glb` or `.gltf` model (Draco-compressed is perfectly fine).
3. Rename the file to an accepted SCCA label (e.g., `airplane.glb`, `ship.glb`, `truck.glb`).
4. Place the file inside `EduVerse/public/models/`.

The Javascript CME Engine automatically handles the rest.

---

## 📞 Contact & Support

**Project Repository**: https://github.com/BChaitanyaReddy895/EduVerse  
**Issues & Feature Requests**: GitHub Issues  
**Status**: Production Ready ✅  
