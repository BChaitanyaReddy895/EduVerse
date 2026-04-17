// ============================================
// Intelligent Visualization Coordinator v3.0
// Universal multi-domain routing system
// ============================================

import { EngineeringConceptDetector } from './engineering-concept-detector.js';
import { UniversalConceptAnalyzer } from './universal-concept-analyzer.js';
import { createEngineeringGradeVisualization } from './engineering-visualization.js';
import { createDomainVisualization } from './domain-visualization-factory.js';
import * as advancedViz from './advanced-visualization.js';
import * as THREE from 'three';

export class IntelligentVisualizationCoordinator {
  constructor(scene) {
    this.scene = scene;
    this.engineeringDetector = new EngineeringConceptDetector();
    this.universalAnalyzer = new UniversalConceptAnalyzer();
    this.currentViz = null;
    this.visualizationMode = 'auto'; // 'auto', 'specialized', 'simple'
    this.meshes = [];
    
    console.log('🎯 Intelligent Visualization Coordinator v3.0 initialized - Multi-Domain');
  }

  // Main method: choose and create visualization
  async createVisualization(concept, forceMode = null) {
    console.log(`🎨 Creating visualization for: ${concept.title}`);
    
    // Clear previous visualization
    this.clearVisualization();

    // Determine mode
    const mode = forceMode || this.visualizationMode;

    // First try universal analyzer (covers all domains)
    const analysis = this.universalAnalyzer.analyzeConcept(
      concept.topic,
      concept.description,
      concept.keywords || []
    );

    let visualization;

    if (mode === 'auto' && analysis.domain !== 'GENERIC') {
      // Auto-route to specialized domain
      console.log(`🎯 Concept detected: ${analysis.domain} (confidence: ${analysis.confidence.toFixed(2)})`);
      visualization = await this.createSpecializedVisualization(
        analysis.domain,
        concept,
        analysis
      );
    } else if (mode === 'specialized') {
      // Force specialized mode
      if (analysis.domain !== 'GENERIC') {
        visualization = await this.createSpecializedVisualization(
          analysis.domain,
          concept,
          analysis
        );
      } else {
        // Fallback to simple
        visualization = await this.createSimpleVisualization(concept);
      }
    } else {
      // Simple mode
      visualization = await this.createSimpleVisualization(concept);
    }

    this.currentViz = visualization;
    return visualization;
  }

  // Create specialized domain-specific visualization
  async createSpecializedVisualization(domain, concept, analysis) {
    console.log(`🌟 Creating specialized visualization for domain: ${domain}`);

    const domainConfig = analysis.config;
    
    let vizGen;

    try {
      // Route through domain factory for all universal domains
      console.log(`📦 Using domain visualization factory for: ${domain}`);
      vizGen = await createDomainVisualization(this.scene, domain, concept);
      
      if (!vizGen) {
        throw new Error(`Domain visualization factory returned null for ${domain}`);
      }
    } catch (err) {
      console.error(`❌ Domain visualization failed: ${err.message}, falling back to simple`);
      // Fallback to simple visualization
      return await this.createSimpleVisualization(concept);
    }

    // Apply quality recommendations
    const quality = this.getQualityRecommendation(domain);
    const camera = this.getRecommendedCameraAngle(domain);

    this.adjustCamera(camera);
    this.applyQualitySettings(quality);

    return {
      type: 'specialized',
      domain,
      subType: domainConfig.visualizationType,
      generator: vizGen,
      quality,
      camera,
      keywords: domainConfig.keywords || [],
      description: domainConfig.description,
      complexity: domainConfig.complexity,
      icon: domainConfig.icon,
      analysis
    };
  }

  // Create simple visualization (fallback)
  async createSimpleVisualization(concept) {
    try {
      console.log(`✨ Creating simple visualization: ${concept.title}`);

      // Use existing basic visualization system
      const generator = new advancedViz.AdvancedVisualizationGenerator(this.scene);

      // Map concept type to visualization type
      const typeMap = {
        'MOLECULE': 'createMolecularStructure',
        'ORBIT': 'createOrbitalSystem',
        'MOTION': 'createParticleFlow',
        'PROCESS': 'createProcessFlow',
        'CELL': 'createCellStructure',
        'HELIX': 'createDNAHelix'
      };

      const method = typeMap[concept.visualType] || 'createMolecularStructure';

      if (generator[method]) {
        await generator[method](concept);
      }

      return {
        type: 'simple',
        subType: concept.visualType,
        generator,
        quality: { renderScale: 1.0, shadowQuality: 'medium' }
      };
    } catch (err) {
      console.error('Error creating simple visualization:', err);
      throw err;
    }
  }

  // Adjust camera position
  adjustCamera(cameraConfig) {
    const camera = this.scene.children.find(c => c.isCamera);
    
    if (!camera) return;

    const distance = cameraConfig.distance || 15;
    const x = Math.cos(cameraConfig.y) * Math.cos(cameraConfig.x) * distance;
    const y = Math.sin(cameraConfig.x) * distance;
    const z = Math.sin(cameraConfig.y) * Math.cos(cameraConfig.x) * distance;

    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }

  // Apply quality settings
  applyQualitySettings(quality) {
    // Adjust renderer scale
    if (quality.renderScale) {
      this.scene.renderScale = quality.renderScale;
    }

    // Set shadow quality
    const directionalLight = this.scene.children.find(
      l => l instanceof THREE.DirectionalLight
    );
    
    if (directionalLight && quality.shadowQuality) {
      switch (quality.shadowQuality) {
        case 'high':
          directionalLight.shadow.mapSize.width = 2048;
          directionalLight.shadow.mapSize.height = 2048;
          break;
        case 'medium':
          directionalLight.shadow.mapSize.width = 1024;
          directionalLight.shadow.mapSize.height = 1024;
          break;
        case 'low':
          directionalLight.shadow.mapSize.width = 512;
          directionalLight.shadow.mapSize.height = 512;
          break;
      }
    }
  }

  // Update animation
  updateAnimation(elapsed) {
    if (!this.currentViz || !this.currentViz.generator) return;

    const generator = this.currentViz.generator;

    if (generator.updateAnimations) {
      generator.updateAnimations(elapsed);
    }

    if (generator.animations) {
      generator.animations.forEach(anim => {
        // Handle different animation types
        if (anim.type === 'gear-rotation') {
          anim.mesh.rotation[anim.axis] += anim.speed;
        } else if (anim.type === 'rotor-spin') {
          anim.mesh.rotation[anim.axis] += anim.speed;
        } else if (anim.type === 'orbital') {
          // Original orbital animation
          const x = anim.radius * Math.cos(anim.angle + elapsed * 0.0005);
          const z = anim.radius * Math.sin(anim.angle + elapsed * 0.0005);
          anim.mesh.position.set(x, anim.mesh.position.y, z);
        }
      });
    }
  }

  // Clear current visualization
  clearVisualization() {
    if (this.currentViz && this.currentViz.generator) {
      if (this.currentViz.generator.dispose) {
        this.currentViz.generator.dispose();
      }
    }

    // Clear scene meshes
    const toRemove = [];
    this.scene.traverse(child => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Group) {
        if (child !== this.scene) {
          toRemove.push(child);
        }
      }
    });

    toRemove.forEach(mesh => {
      this.scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });

    this.currentViz = null;
  }

  // Get visualization metadata for UI
  getVisualizationMetadata() {
    if (!this.currentViz) return null;

    return {
      type: this.currentViz.type,
      subType: this.currentViz.subType,
      description: this.currentViz.description,
      animation: this.currentViz.animation,
      keywords: this.currentViz.keywords || [],
      specs: this.currentViz.specs || {},
      quality: this.currentViz.quality || {}
    };
  }

  // Set visualization mode
  setVisualizationMode(mode) {
    if (['auto', 'specialized', 'simple'].includes(mode)) {
      this.visualizationMode = mode;
      console.log(`📊 Visualization mode changed to: ${mode}`);
    }
  }

  // Get quality recommendations for all domains
  getQualityRecommendation(domain) {
    const recommendations = {
      // Computer Science
      'CS_DATABASE': { renderScale: 1.0, shadowQuality: 'high', reflections: true, particleCount: 400 },
      'CS_CRYPTOGRAPHY': { renderScale: 1.1, shadowQuality: 'high', reflections: true, particleCount: 500 },
      'CS_NETWORK_SECURITY': { renderScale: 1.0, shadowQuality: 'high', reflections: true, particleCount: 600 },
      'CS_AGILE': { renderScale: 0.9, shadowQuality: 'medium', reflections: false, particleCount: 300 },
      'CS_ALGORITHMS': { renderScale: 1.0, shadowQuality: 'medium', reflections: true, particleCount: 350 },
      'CS_MACHINE_LEARNING': { renderScale: 1.2, shadowQuality: 'high', reflections: true, particleCount: 800 },
      
      // Physics
      'PHYSICS_MECHANICS': { renderScale: 1.0, shadowQuality: 'high', reflections: true, particleCount: 500 },
      'PHYSICS_WAVES': { renderScale: 1.1, shadowQuality: 'high', reflections: true, particleCount: 700 },
      'PHYSICS_ELECTROMAGNETISM': { renderScale: 1.0, shadowQuality: 'high', reflections: true, particleCount: 600 },
      
      // Chemistry
      'CHEMISTRY_MOLECULAR': { renderScale: 1.0, shadowQuality: 'high', reflections: true, particleCount: 400 },
      'CHEMISTRY_REACTION': { renderScale: 1.1, shadowQuality: 'high', reflections: true, particleCount: 500 },
      
      // Biology
      'BIOLOGY_CELL': { renderScale: 0.95, shadowQuality: 'medium', reflections: true, particleCount: 350 },
      'BIOLOGY_GENETICS': { renderScale: 1.0, shadowQuality: 'high', reflections: true, particleCount: 450 },
      'BIOLOGY_ECOLOGY': { renderScale: 0.9, shadowQuality: 'medium', reflections: false, particleCount: 400 },
      
      // Mathematics
      'MATH_GEOMETRY': { renderScale: 1.0, shadowQuality: 'high', reflections: true, particleCount: 350 },
      'MATH_CALCULUS': { renderScale: 1.1, shadowQuality: 'high', reflections: true, particleCount: 500 },
      'MATH_LINEAR_ALGEBRA': { renderScale: 1.0, shadowQuality: 'medium', reflections: true, particleCount: 400 },
      
      // Engineering
      'ENGINEERING_GEARS': { renderScale: 1.1, shadowQuality: 'high', reflections: true, particleCount: 500 },
      'ENGINEERING_PISTON': { renderScale: 1.0, shadowQuality: 'high', reflections: true, particleCount: 450 },
      'ENGINEERING_HYDRAULIC': { renderScale: 1.0, shadowQuality: 'high', reflections: true, particleCount: 400 },
      'ENGINEERING_ROTOR': { renderScale: 1.1, shadowQuality: 'high', reflections: true, particleCount: 600 },
      'ENGINEERING_BRIDGE': { renderScale: 0.95, shadowQuality: 'medium', reflections: true, particleCount: 350 },
      'ENGINEERING_BUILDING': { renderScale: 0.9, shadowQuality: 'medium', reflections: false, particleCount: 300 },
      
      // Economics & Philosophy
      'ECON_MARKET': { renderScale: 0.95, shadowQuality: 'medium', reflections: false, particleCount: 300 },
      'PHILOSOPHY_LOGIC': { renderScale: 1.0, shadowQuality: 'medium', reflections: true, particleCount: 300 }
    };

    return recommendations[domain] || {
      renderScale: 1.0,
      shadowQuality: 'medium',
      reflections: false,
      particleCount: 400
    };
  }

  // Get recommended camera angle for domain
  getRecommendedCameraAngle(domain) {
    const angles = {
      'CS_DATABASE': { x: 0.3, y: 0.8, z: 0.7, distance: 12 },
      'CS_CRYPTOGRAPHY': { x: 0.4, y: 1.0, z: 0.6, distance: 10 },
      'CS_NETWORK_SECURITY': { x: 0.5, y: 0.8, z: 0.8, distance: 15 },
      'CS_AGILE': { x: 0.1, y: 0.5, z: 1.0, distance: 14 },
      'CS_ALGORITHMS': { x: 0.3, y: 0.7, z: 0.8, distance: 10 },
      'CS_MACHINE_LEARNING': { x: 0.4, y: 0.9, z: 0.7, distance: 16 },
      
      'PHYSICS_MECHANICS': { x: 0.3, y: 0.8, z: 0.8, distance: 12 },
      'PHYSICS_WAVES': { x: 0.6, y: 0.4, z: 0.8, distance: 14 },
      'PHYSICS_ELECTROMAGNETISM': { x: 0.4, y: 0.7, z: 0.8, distance: 11 },
      
      'CHEMISTRY_MOLECULAR': { x: 0.4, y: 0.8, z: 0.7, distance: 10 },
      'CHEMISTRY_REACTION': { x: 0.3, y: 0.9, z: 0.8, distance: 12 },
      
      'BIOLOGY_CELL': { x: 0.5, y: 0.8, z: 0.8, distance: 9 },
      'BIOLOGY_GENETICS': { x: 0.2, y: 0.6, z: 0.9, distance: 10 },
      'BIOLOGY_ECOLOGY': { x: 0.3, y: 0.7, z: 0.9, distance: 14 },
      
      'MATH_GEOMETRY': { x: 0.4, y: 0.8, z: 0.7, distance: 10 },
      'MATH_CALCULUS': { x: 0.5, y: 1.0, z: 0.6, distance: 12 },
      'MATH_LINEAR_ALGEBRA': { x: 0.3, y: 0.8, z: 0.8, distance: 11 },
      
      'ENGINEERING_GEARS': { x: 0.4, y: 0.8, z: 0.7, distance: 13 },
      'ENGINEERING_PISTON': { x: 0.3, y: 0.7, z: 0.8, distance: 12 },
      'ENGINEERING_HYDRAULIC': { x: 0.5, y: 0.8, z: 0.6, distance: 10 },
      'ENGINEERING_ROTOR': { x: 0.4, y: 0.9, z: 0.7, distance: 14 },
      'ENGINEERING_BRIDGE': { x: 0.2, y: 0.5, z: 0.9, distance: 16 },
      'ENGINEERING_BUILDING': { x: 0.3, y: 0.6, z: 0.8, distance: 15 }
    };

    return angles[domain] || { x: 0.4, y: 0.8, z: 0.7, distance: 12 };
  }

  // Get available visualization modes
  getAvailableModes() {
    return [
      {
        name: 'auto',
        label: 'Automatic',
        description: 'Auto-detects domain and uses specialized visualization'
      },
      {
        name: 'specialized',
        label: 'Specialized',
        description: 'High-quality domain-specific visualizations (CS, Physics, Biology, Math, etc.)'
      },
      {
        name: 'simple',
        label: 'Simple',
        description: 'Basic geometric visualizations (fastest, mobile-friendly)'
      }
    ];
  }

  // Create visualization selector UI
  createVisualizationModeUI(container, onModeChange) {
    const ui = document.createElement('div');
    ui.style.cssText = `
      display: flex;
      gap: 8px;
      padding: 12px;
      background: rgba(59, 130, 246, 0.1);
      border-radius: 8px;
      margin-bottom: 12px;
    `;

    this.getAvailableModes().forEach(mode => {
      const btn = document.createElement('button');
      btn.style.cssText = `
        flex: 1;
        padding: 8px 12px;
        border: 2px solid ${this.visualizationMode === mode.name ? '#3B82F6' : '#6B7280'};
        background: ${this.visualizationMode === mode.name ? 'rgba(59, 130, 246, 0.3)' : 'transparent'};
        color: white;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 12px;
        transition: all 0.3s ease;
      `;

      btn.textContent = mode.label;
      btn.title = mode.description;

      btn.onclick = () => {
        this.setVisualizationMode(mode.name);
        onModeChange(mode.name);
        
        // Update button styles
        ui.querySelectorAll('button').forEach(b => {
          b.style.border = '2px solid #6B7280';
          b.style.background = 'transparent';
        });
        btn.style.border = '2px solid #3B82F6';
        btn.style.background = 'rgba(59, 130, 246, 0.3)';
      };

      ui.appendChild(btn);
    });

    container.appendChild(ui);
    return ui;
  }

  // Get concept analysis across all domains
  analyzeConcept(topic, description) {
    const analysis = this.universalAnalyzer.analyzeConcept(topic, description);

    if (analysis.domain === 'GENERIC') {
      return {
        isSpecialized: false,
        domain: 'GENERIC',
        confidence: 0,
        description: 'General concept visualization'
      };
    }

    return {
      isSpecialized: true,
      domain: analysis.domain,
      confidence: analysis.confidence,
      description: analysis.config.description,
      complexity: analysis.config.complexity,
      icon: analysis.config.icon,
      type: analysis.config.visualizationType
    };
  }

  // Dispose resources
  dispose() {
    this.clearVisualization();
  }
}

export function createIntelligentVisualizationCoordinator(scene) {
  return new IntelligentVisualizationCoordinator(scene);
}
