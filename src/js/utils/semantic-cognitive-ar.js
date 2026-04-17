/**
 * Semantic-to-Spatial Cognitive AR Visualization System
 * 
 * Core orchestrator that converts raw user input (images) into meaningful AR experiences
 * by integrating: CLIP vision → concept mapping → 3D model retrieval → cognitive layers → AR rendering.
 * 
 * Pipeline: Image → CLIP Embedding → Concept Match → 3D Model (Procedural) → Cognitive Layers → AR Render
 */

import * as THREE from 'three';
import { CLIPImageEncoder } from './clip-image-encoder.js';
import { ConceptMappingEngine } from './concept-mapping.js';
import { ModelRetrievalEngine } from './model-retrieval-engine.js';
import { CognitiveLayerGenerator } from './cognitive-layer-generator.js';
import { ARRealismEngine } from './ar-realism-engine.js';
import { proceduralModelFactory } from './procedural-model-factory.js';

export class SemanticCognitiveARSystem {
  constructor() {
    this.clipEncoder = new CLIPImageEncoder();
    this.conceptMapper = new ConceptMappingEngine();
    this.modelRetriever = new ModelRetrievalEngine();
    this.cognitiveGenerator = new CognitiveLayerGenerator();
    this.realismEngine = new ARRealismEngine();
    
    this.isInitialized = false;
    this.initializationStage = '';
    this.visualizationCache = new Map();
    this.activeVisualization = null;
    
    this.learnerProfile = {
      level: 'INTERMEDIATE',
      domain: 'GENERAL',
      history: [],
    };
    
    this.stats = {
      imagesProcessed: 0,
      conceptsIdentified: 0,
      modelsRetrieved: 0,
      visualizationsGenerated: 0,
      avgProcessingTime: 0,
    };

    // Event callbacks
    this.onProgress = null;     // (stage: string, progress: number) => void
    this.onConceptFound = null; // (concept: object) => void
    this.onModelReady = null;   // (model: THREE.Group) => void
    this.onError = null;        // (error: string) => void
  }

  /**
   * Initialize all subsystems
   */
  async initialize(scene, camera, renderer, progressCallback = null) {
    this.onProgress = progressCallback;
    console.log('[SemanticAR] Initializing full pipeline...');

    try {
      // Stage 1: CLIP Model
      this._emitProgress('Loading AI model...', 0.05);
      this.initializationStage = 'clip';
      await this.clipEncoder.initialize((p) => {
        this._emitProgress('Loading AI model...', 0.05 + p * 0.35);
      });
      console.log('[SemanticAR] ✓ CLIP encoder ready');

      // Stage 2: Concept Mapping
      this._emitProgress('Loading knowledge base...', 0.42);
      this.initializationStage = 'concepts';
      await this.conceptMapper.initialize();
      console.log('[SemanticAR] ✓ Concept mapper ready');

      // Stage 3: Model Retrieval
      this._emitProgress('Initializing 3D engine...', 0.55);
      this.initializationStage = 'models';
      await this.modelRetriever.initialize();
      console.log('[SemanticAR] ✓ Model retrieval engine ready');

      // Stage 4: Cognitive Layer Generator
      this._emitProgress('Loading cognitive layers...', 0.70);
      this.initializationStage = 'cognitive';
      this.cognitiveGenerator.initialize();
      console.log('[SemanticAR] ✓ Cognitive layer generator ready');

      // Stage 5: AR Realism Engine
      this._emitProgress('Setting up AR realism...', 0.85);
      this.initializationStage = 'realism';
      if (scene && camera && renderer) {
        this.realismEngine.initialize(scene, camera, renderer);
        console.log('[SemanticAR] ✓ AR realism engine ready');
      }

      this._emitProgress('System ready', 1.0);
      this.isInitialized = true;
      this.initializationStage = 'ready';
      console.log('[SemanticAR] ✓ Full pipeline initialized');
      return true;
    } catch (error) {
      console.error('[SemanticAR] Initialization failed:', error);
      this._emitProgress('Initialization failed', -1);
      if (this.onError) this.onError(error.message);
      return false;
    }
  }

  _emitProgress(stage, progress) {
    if (this.onProgress) this.onProgress(stage, progress);
  }

  /**
   * MAIN PIPELINE: Image → Concept → 3D Model → Cognitive Layers
   * @param {string|Blob|HTMLImageElement|HTMLCanvasElement} imageData
   * @param {string} learnerLevel - BEGINNER | INTERMEDIATE | ADVANCED | EXPERT
   * @returns {object} Complete visualization specification
   */
  async processImageToVisualization(imageData, learnerLevel = null) {
    const effectiveLevel = learnerLevel || this.learnerProfile.level;
    const startTime = Date.now();

    try {
      if (!this.isInitialized) {
        throw new Error('System not initialized. Call initialize() first.');
      }

      console.log(`[SemanticAR] Processing image for ${effectiveLevel} level...`);

      // ━━━ STEP 1: Image Classification (CLIP) ━━━
      this._emitProgress('Analyzing image...', 0.1);
      const candidateLabels = this.conceptMapper.getAllConceptLabels();
      const classificationResults = await this.clipEncoder.classifyImage(imageData, candidateLabels);
      
      if (!classificationResults || classificationResults.length === 0) {
        throw new Error('Image classification returned no results');
      }

      const topResult = classificationResults[0];
      console.log(`[SemanticAR] Image classified as: "${topResult.label}" (confidence: ${(topResult.score * 100).toFixed(1)}%)`);

      // ━━━ STEP 2: Concept Mapping ━━━
      this._emitProgress('Mapping concept...', 0.3);
      const conceptData = this.conceptMapper.getConceptByLabel(topResult.label);
      
      if (!conceptData) {
        console.warn(`[SemanticAR] No concept data for "${topResult.label}", using generic`);
      }

      const concept = {
        name: conceptData ? conceptData.concept : topResult.label,
        label: topResult.label,
        domain: conceptData ? conceptData.domain : 'GENERAL',
        category: conceptData ? conceptData.category : 'UNKNOWN',
        confidence: topResult.score,
        description: conceptData ? conceptData.description : `Concept: ${topResult.label}`,
        components: conceptData ? conceptData.components : [],
        functions: conceptData ? conceptData.functions : [],
        allResults: classificationResults.slice(0, 5),
      };

      if (this.onConceptFound) this.onConceptFound(concept);
      this.stats.conceptsIdentified++;

      // ━━━ STEP 3: 3D Model Retrieval ━━━
      this._emitProgress('Generating 3D model...', 0.5);
      const modelResult = await this.modelRetriever.retrieveModelForConcept(concept.name, effectiveLevel);
      console.log(`[SemanticAR] 3D model: "${modelResult.modelName}" (${modelResult.generationMethod})`);
      this.stats.modelsRetrieved++;

      // ━━━ STEP 4: Cognitive Layer Generation ━━━
      this._emitProgress('Building cognitive layers...', 0.7);
      const cognitiveRepresentation = this.cognitiveGenerator.generateLayers(
        concept.name,
        modelResult,
        effectiveLevel
      );
      console.log(`[SemanticAR] Generated ${cognitiveRepresentation.layers.length} cognitive layers`);

      // ━━━ STEP 5: Apply Realism to 3D Model ━━━
      this._emitProgress('Applying realism...', 0.85);
      if (modelResult.model3D) {
        this.realismEngine.enhanceModel(modelResult.model3D);
      }

      // ━━━ Build Result ━━━
      const processingTime = Date.now() - startTime;
      this.stats.imagesProcessed++;
      this.stats.visualizationsGenerated++;
      this.stats.avgProcessingTime = this.stats.avgProcessingTime * 0.8 + processingTime * 0.2;

      const result = {
        concept,
        model: modelResult,
        cognitiveRepresentation,
        metadata: {
          processingTime,
          learnerLevel: effectiveLevel,
          timestamp: Date.now(),
          clipAvailable: this.clipEncoder.stats.clipAvailable,
          pipelineVersion: '2.0',
        },
      };

      // Cache
      const cacheKey = `${concept.name}_${effectiveLevel}`;
      this.visualizationCache.set(cacheKey, result);
      this.activeVisualization = result;

      // Record in learner history
      this.learnerProfile.history.push({
        concept: concept.name,
        domain: concept.domain,
        timestamp: Date.now(),
        level: effectiveLevel,
      });

      this._emitProgress('Complete', 1.0);
      if (this.onModelReady) this.onModelReady(modelResult.model3D);

      console.log(`[SemanticAR] Pipeline complete in ${processingTime}ms`);
      return result;
    } catch (error) {
      console.error('[SemanticAR] Pipeline failed:', error);
      this._emitProgress('Error', -1);
      if (this.onError) this.onError(error.message);
      return null;
    }
  }

  /**
   * Process a concept name directly (no image needed)
   */
  async processConceptDirectly(conceptName, learnerLevel = null) {
    const effectiveLevel = learnerLevel || this.learnerProfile.level;
    const startTime = Date.now();

    try {
      const conceptData = this.conceptMapper.getConceptByName(conceptName);
      const concept = {
        name: conceptName,
        label: conceptName,
        domain: conceptData ? conceptData.domain : 'GENERAL',
        category: conceptData ? conceptData.category : 'UNKNOWN',
        confidence: 1.0,
        description: conceptData ? conceptData.description : `Concept: ${conceptName}`,
        components: conceptData ? conceptData.components : [],
        functions: conceptData ? conceptData.functions : [],
        allResults: [{ label: conceptName, score: 1.0 }],
      };

      if (this.onConceptFound) this.onConceptFound(concept);

      const modelResult = await this.modelRetriever.retrieveModelForConcept(conceptName, effectiveLevel);
      const cognitiveRepresentation = this.cognitiveGenerator.generateLayers(conceptName, modelResult, effectiveLevel);

      if (modelResult.model3D) {
        this.realismEngine.enhanceModel(modelResult.model3D);
      }

      this.stats.visualizationsGenerated++;
      this.stats.modelsRetrieved++;

      const result = {
        concept,
        model: modelResult,
        cognitiveRepresentation,
        metadata: {
          processingTime: Date.now() - startTime,
          learnerLevel: effectiveLevel,
          timestamp: Date.now(),
          inputMethod: 'direct',
          pipelineVersion: '2.0',
        },
      };

      this.activeVisualization = result;
      if (this.onModelReady) this.onModelReady(modelResult.model3D);

      return result;
    } catch (error) {
      console.error('[SemanticAR] Direct concept processing failed:', error);
      if (this.onError) this.onError(error.message);
      return null;
    }
  }

  /**
   * Get concept explanation adapted to learner level
   */
  explainConcept(conceptName, learnerLevel = null) {
    const level = learnerLevel || this.learnerProfile.level;
    const explanation = this.conceptMapper.getConceptExplanation(conceptName, level);
    const layers = this.cognitiveGenerator.describeLayersForLearner(conceptName, level);

    return {
      concept: conceptName,
      definition: explanation.definition,
      components: explanation.components,
      functions: explanation.functions,
      applications: explanation.applications,
      template: explanation.template,
      structuralLayers: layers.structure,
      functionalLayers: layers.function,
      interactionLayers: layers.interaction,
      simulationParams: layers.simulation,
      learnerLevel: level,
    };
  }

  /**
   * Update learner profile
   */
  setLearnerLevel(level) {
    this.learnerProfile.level = level;
    console.log(`[SemanticAR] Learner level set to: ${level}`);
  }

  /**
   * Get all available concepts for UI
   */
  getAvailableConcepts() {
    return this.modelRetriever.getAvailableConcepts();
  }

  /**
   * Get system statistics
   */
  getSystemStats() {
    return {
      pipeline: this.stats,
      clip: this.clipEncoder.getStats(),
      concepts: this.conceptMapper.getStats(),
      models: this.modelRetriever.getStats(),
      cognitive: this.cognitiveGenerator.getStats(),
      realism: this.realismEngine.getStats(),
      learnerProfile: this.learnerProfile,
      isInitialized: this.isInitialized,
      initializationStage: this.initializationStage,
      cacheSize: this.visualizationCache.size,
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.visualizationCache.clear();
    this.clipEncoder.clearCache();
    proceduralModelFactory.clearCache();
    console.log('[SemanticAR] All caches cleared');
  }

  /**
   * Dispose all resources
   */
  dispose() {
    this.realismEngine.dispose();
    this.clearCache();
    this.isInitialized = false;
    console.log('[SemanticAR] Disposed');
  }
}

window.SemanticCognitiveARSystem = SemanticCognitiveARSystem;
