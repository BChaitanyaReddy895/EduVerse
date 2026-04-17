// ============================================
// Concept Flow Renderer v1.0
// Interactive visual explanation of concept progressions
// ============================================

import * as THREE from 'three';
import { VisualizationGenerator } from './visualization-generator.js';

export class ConceptFlowRenderer {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a);
    
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);
    
    // Lighting
    const light1 = new THREE.PointLight(0xffffff, 1, 100);
    light1.position.set(5, 5, 5);
    this.scene.add(light1);
    
    const light2 = new THREE.PointLight(0x7c3aed, 0.5, 100);
    light2.position.set(-5, -5, 5);
    this.scene.add(light2);
    
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambient);
    
    this.visualizer = new VisualizationGenerator(this.scene);
    this.currentConcept = null;
    this.currentAnimation = null;
    this.startTime = Date.now();
  }

  async renderConceptFlow(conceptFlow) {
    console.log(`🎨 Rendering concept flow with ${conceptFlow.concepts.length} concepts`);
    
    this.conceptFlow = conceptFlow;
    this.currentConceptIndex = 0;
    
    // Create interactive UI for concept navigation
    this.createConceptNavigationUI();
    
    // Start with first concept
    await this.displayConcept(0);
    
    return this;
  }

  createConceptNavigationUI() {
    const uiContainer = document.createElement('div');
    uiContainer.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 10px;
      z-index: 100;
    `;
    
    this.conceptFlow.concepts.forEach((concept, index) => {
      const btn = document.createElement('button');
      btn.textContent = `${index + 1}. ${concept.title.substring(0, 15)}`;
      btn.style.cssText = `
        padding: 8px 12px;
        background: rgba(99, 102, 241, 0.3);
        border: 1px solid rgba(99, 102, 241, 0.5);
        border-radius: 4px;
        color: white;
        cursor: pointer;
        font-size: 0.8rem;
        transition: all 0.2s;
      `;
      
      btn.addEventListener('mouseenter', () => {
        btn.style.background = 'rgba(99, 102, 241, 0.6)';
      });
      
      btn.addEventListener('mouseleave', () => {
        btn.style.background = index === this.currentConceptIndex 
          ? 'rgba(34, 197, 94, 0.5)' 
          : 'rgba(99, 102, 241, 0.3)';
      });
      
      btn.addEventListener('click', () => this.displayConcept(index));
      
      uiContainer.appendChild(btn);
    });
    
    this.container.appendChild(uiContainer);
    this.navigationUI = uiContainer;
  }

  async displayConcept(index) {
    const concept = this.conceptFlow.concepts[index];
    console.log(`📚 Displaying concept: ${concept.title}`);
    
    this.currentConceptIndex = index;
    this.currentConcept = concept;
    
    // Import visualization config
    const { getVisualizationConfig } = await import('./concept-engine.js');
    const config = getVisualizationConfig(concept);
    
    // Generate visualization
    const animateFn = await this.visualizer.createVisualizationFromConfig(config, concept);
    this.currentAnimation = animateFn;
    
    // Update UI
    this.updateNavigationUI();
    
    // Start animation loop
    this.startAnimationLoop();
  }

  updateNavigationUI() {
    if (this.navigationUI) {
      const buttons = this.navigationUI.querySelectorAll('button');
      buttons.forEach((btn, i) => {
        btn.style.background = i === this.currentConceptIndex
          ? 'rgba(34, 197, 94, 0.5)'
          : 'rgba(99, 102, 241, 0.3)';
      });
    }
  }

  startAnimationLoop() {
    const animate = () => {
      requestAnimationFrame(animate);
      
      const elapsed = (Date.now() - this.startTime) / 1000;
      
      if (this.currentAnimation) {
        this.currentAnimation(elapsed);
      }
      
      this.renderer.render(this.scene, this.camera);
    };
    
    animate();
  }

  createVisualizationTimeline() {
    const timeline = document.createElement('div');
    timeline.style.cssText = `
      position: absolute;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 3px;
      align-items: center;
    `;
    
    this.conceptFlow.timeline.forEach((step, i) => {
      const indicator = document.createElement('div');
      indicator.style.cssText = `
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: rgba(99, 102, 241, 0.4);
        cursor: pointer;
        transition: all 0.2s;
      `;
      
      indicator.addEventListener('click', () => this.displayConcept(i));
      indicator.addEventListener('mouseenter', () => {
        indicator.style.transform = 'scale(1.5)';
        indicator.style.background = 'rgba(34, 197, 94, 0.8)';
      });
      indicator.addEventListener('mouseleave', () => {
        indicator.style.transform = 'scale(1)';
        indicator.style.background = i === this.currentConceptIndex 
          ? 'rgba(34, 197, 94, 0.8)'
          : 'rgba(99, 102, 241, 0.4)';
      });
      
      timeline.appendChild(indicator);
    });
    
    this.container.appendChild(timeline);
    this.timeline = timeline;
  }

  dispose() {
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement.parentElement === this.container) {
        this.container.removeChild(this.renderer.domElement);
      }
    }
    if (this.navigationUI && this.navigationUI.parentElement === this.container) {
      this.container.removeChild(this.navigationUI);
    }
    if (this.timeline && this.timeline.parentElement === this.container) {
      this.container.removeChild(this.timeline);
    }
  }
}

export async function createConceptFlow(topic) {
  const { fetchConceptContent, createConceptFlow: buildFlow, getVisualizationConfig } = await import('./concept-engine.js');
  
  const concepts = await fetchConceptContent(topic);
  const flow = buildFlow(concepts);
  
  return flow;
}
