/**
 * 3D Model Retrieval Engine
 * Uses cosine similarity search for concept→model matching.
 * Integrates with ProceduralModelFactory for actual 3D geometry generation.
 * 
 * Replaces broken FAISS dependency with efficient JS-native similarity search.
 */

import { proceduralModelFactory } from './procedural-model-factory.js';

export class ModelRetrievalEngine {
  constructor() {
    this.modelDatabase = new Map();
    this.isInitialized = false;
    this.stats = {
      modelsRetrieved: 0,
      queriesExecuted: 0,
      avgRetrievalTime: 0,
      proceduralGenerated: 0,
    };
  }

  async initialize() {
    console.log('[ModelRetrieval] Initializing...');
    this.loadModelDatabase();
    this._buildSearchIndex();
    this.isInitialized = true;
    console.log(`[ModelRetrieval] Ready with ${this.modelDatabase.size} concepts (procedural generation enabled)`);
    return true;
  }

  /**
   * Comprehensive 3D model database — metadata + procedural generation support
   */
  loadModelDatabase() {
    const models = {
      // BIOLOGY & ANATOMY
      'heart': {
        modelName: 'Human Heart', concept: 'heart', domain: 'BIOLOGY', category: 'ANATOMY',
        keywords: ['heart', 'cardiac', 'cardiovascular', 'blood', 'pump', 'organ', 'ventricle', 'atrium'],
        complexity: 0.8, animated: true,
        description: 'Anatomically accurate human heart with chambers, valves, and vessels',
      },
      'brain': {
        modelName: 'Human Brain', concept: 'brain', domain: 'NEUROSCIENCE', category: 'ANATOMY',
        keywords: ['brain', 'cerebrum', 'neuron', 'cortex', 'nervous', 'cognition', 'hemisphere', 'lobe'],
        complexity: 0.9, animated: false,
        description: 'Detailed brain with lobes, cerebellum, and neural network visualization',
      },
      'cell': {
        modelName: 'Animal Cell', concept: 'cell', domain: 'BIOLOGY', category: 'MICROSCOPY',
        keywords: ['cell', 'nucleus', 'mitochondria', 'organelle', 'membrane', 'cytoplasm', 'ribosome'],
        complexity: 0.7, animated: true,
        description: 'Cross-section showing organelles, nucleus, and cellular structure',
      },
      'plant': {
        modelName: 'Flowering Plant', concept: 'plant', domain: 'BOTANY', category: 'BIOLOGY',
        keywords: ['plant', 'flower', 'leaf', 'root', 'stem', 'photosynthesis', 'seed', 'petal'],
        complexity: 0.6, animated: false,
        description: 'Complete plant with roots, stem, leaves, and flower',
      },
      'dna': {
        modelName: 'DNA Double Helix', concept: 'dna', domain: 'GENETICS', category: 'MOLECULAR_BIOLOGY',
        keywords: ['dna', 'helix', 'gene', 'genetic', 'chromosome', 'nucleotide', 'base pair', 'rna'],
        complexity: 0.7, animated: true,
        description: 'Double helix with base pairs and strand structure',
      },
      'lung': {
        modelName: 'Human Lungs', concept: 'lung', domain: 'BIOLOGY', category: 'ANATOMY',
        keywords: ['lung', 'respiratory', 'breathing', 'alveoli', 'bronchi', 'trachea', 'oxygen'],
        complexity: 0.7, animated: true,
        description: 'Anatomical lungs with trachea, bronchi, and alveoli',
      },
      'eye': {
        modelName: 'Human Eye', concept: 'eye', domain: 'BIOLOGY', category: 'ANATOMY',
        keywords: ['eye', 'retina', 'lens', 'cornea', 'iris', 'pupil', 'vision', 'optic'],
        complexity: 0.65, animated: false,
        description: 'Cross-section eye with lens, retina, and optical components',
      },
      'microorganism': {
        modelName: 'Bacterium', concept: 'microorganism', domain: 'MICROBIOLOGY', category: 'MICROSCOPY',
        keywords: ['bacteria', 'microbe', 'microorganism', 'flagellum', 'virus', 'pathogen'],
        complexity: 0.5, animated: true,
        description: 'Bacterial cell with flagella and cell wall',
      },

      // ENGINEERING & MECHANICS
      'motor': {
        modelName: 'Electric Motor', concept: 'motor', domain: 'ENGINEERING', category: 'MECHANICS',
        keywords: ['motor', 'electric', 'stator', 'rotor', 'coil', 'magnet', 'shaft', 'torque', 'rpm', 'engine'],
        complexity: 0.75, animated: true,
        description: 'Detailed motor with rotor, stator, coils, and magnetic field visualization',
      },
      'circuit': {
        modelName: 'Electronic Circuit', concept: 'circuit', domain: 'ELECTRICAL_ENGINEERING', category: 'ELECTRONICS',
        keywords: ['circuit', 'pcb', 'resistor', 'capacitor', 'transistor', 'ic', 'electronic', 'board', 'wire'],
        complexity: 0.6, animated: false,
        description: 'PCB with components, traces, and current flow visualization',
      },
      'gear': {
        modelName: 'Gear Mechanism', concept: 'gear', domain: 'MECHANICAL_ENGINEERING', category: 'MECHANICS',
        keywords: ['gear', 'cog', 'teeth', 'mesh', 'transmission', 'torque', 'ratio', 'sprocket'],
        complexity: 0.55, animated: true,
        description: 'Meshed gear pair with teeth and axle',
      },
      'turbine': {
        modelName: 'Turbine', concept: 'turbine', domain: 'ENGINEERING', category: 'ENERGY',
        keywords: ['turbine', 'blade', 'wind', 'steam', 'power', 'generator', 'rotation', 'energy'],
        complexity: 0.7, animated: true,
        description: 'Turbine with blades, hub, and shaft',
      },
      'piston': {
        modelName: 'Piston Engine', concept: 'piston', domain: 'MECHANICAL_ENGINEERING', category: 'MECHANICS',
        keywords: ['piston', 'cylinder', 'engine', 'combustion', 'stroke', 'crankshaft', 'compression'],
        complexity: 0.7, animated: true,
        description: 'Piston with cylinder block and connecting rod',
      },
      'transformer': {
        modelName: 'Electrical Transformer', concept: 'transformer', domain: 'ELECTRICAL_ENGINEERING', category: 'POWER',
        keywords: ['transformer', 'coil', 'winding', 'core', 'voltage', 'step-up', 'step-down', 'induction'],
        complexity: 0.65, animated: false,
        description: 'Transformer with iron core, primary and secondary windings',
      },
      'pulley': {
        modelName: 'Pulley System', concept: 'pulley', domain: 'PHYSICS', category: 'MECHANICS',
        keywords: ['pulley', 'rope', 'mechanical advantage', 'simple machine', 'force', 'wheel', 'axle'],
        complexity: 0.5, animated: true,
        description: 'Pulley with wheel, axle, and rope',
      },
      'machine': {
        modelName: 'Compound Machine', concept: 'machine', domain: 'MECHANICAL_ENGINEERING', category: 'ENGINEERING',
        keywords: ['machine', 'mechanism', 'compound', 'lever', 'gear', 'industrial'],
        complexity: 0.8, animated: true,
        description: 'Compound machine combining gear and piston',
      },

      // CHEMISTRY
      'atom': {
        modelName: 'Atom Model', concept: 'atom', domain: 'CHEMISTRY', category: 'ATOMIC_STRUCTURE',
        keywords: ['atom', 'proton', 'neutron', 'electron', 'nucleus', 'orbital', 'element', 'subatomic'],
        complexity: 0.4, animated: true,
        description: 'Atom with nucleus, electron orbits, and proton/neutron structure',
      },
      'molecule': {
        modelName: 'Molecular Structure', concept: 'molecule', domain: 'CHEMISTRY', category: 'MOLECULAR_STRUCTURE',
        keywords: ['molecule', 'bond', 'chemical', 'compound', 'reaction', 'h2o', 'covalent', 'ionic'],
        complexity: 0.6, animated: false,
        description: 'Molecular structure with atoms and bonds',
      },
      'crystal': {
        modelName: 'Crystal Lattice', concept: 'crystal', domain: 'CHEMISTRY', category: 'MATERIALS',
        keywords: ['crystal', 'lattice', 'mineral', 'solid', 'structure', 'unit cell', 'symmetry'],
        complexity: 0.7, animated: false,
        description: 'Crystal lattice with nodes and bonds',
      },
      'water': {
        modelName: 'Water Molecule', concept: 'water', domain: 'CHEMISTRY', category: 'MOLECULAR_STRUCTURE',
        keywords: ['water', 'h2o', 'hydrogen', 'oxygen', 'liquid', 'solvent', 'polar'],
        complexity: 0.3, animated: true,
        description: 'Water molecule with hydrogen and oxygen atoms',
      },

      // PHYSICS
      'pendulum': {
        modelName: 'Simple Pendulum', concept: 'pendulum', domain: 'PHYSICS', category: 'MECHANICS',
        keywords: ['pendulum', 'oscillation', 'period', 'gravity', 'swing', 'harmonic', 'bob', 'frequency'],
        complexity: 0.4, animated: true,
        description: 'Pendulum with support frame, string, and bob',
      },
      'lens': {
        modelName: 'Convex Lens', concept: 'lens', domain: 'PHYSICS', category: 'OPTICS',
        keywords: ['lens', 'convex', 'concave', 'optics', 'refraction', 'focal', 'light', 'magnification'],
        complexity: 0.5, animated: false,
        description: 'Convex lens with light ray paths and focal point',
      },
      'magnet': {
        modelName: 'Horseshoe Magnet', concept: 'magnet', domain: 'PHYSICS', category: 'ELECTROMAGNETISM',
        keywords: ['magnet', 'magnetic', 'field', 'north', 'south', 'pole', 'flux', 'ferromagnetic'],
        complexity: 0.5, animated: false,
        description: 'U-shaped magnet with field line visualization',
      },
      'spring': {
        modelName: 'Helical Spring', concept: 'spring', domain: 'PHYSICS', category: 'MECHANICS',
        keywords: ['spring', 'hooke', 'elastic', 'oscillation', 'force', 'extension', 'compression'],
        complexity: 0.4, animated: true,
        description: 'Spring with retaining plates',
      },

      // ASTRONOMY
      'planet': {
        modelName: 'Earth Planet', concept: 'planet', domain: 'ASTRONOMY', category: 'CELESTIAL_BODIES',
        keywords: ['planet', 'earth', 'orbit', 'atmosphere', 'mars', 'jupiter', 'saturn', 'globe'],
        complexity: 0.6, animated: true,
        description: 'Earth with procedural surface, atmosphere, and internal layers',
      },
      'star': {
        modelName: 'Sun Star', concept: 'star', domain: 'ASTRONOMY', category: 'CELESTIAL_BODIES',
        keywords: ['star', 'sun', 'solar', 'fusion', 'corona', 'plasma', 'luminosity', 'nova'],
        complexity: 0.5, animated: true,
        description: 'Glowing star with corona',
      },
      'solar_system': {
        modelName: 'Solar System', concept: 'solar_system', domain: 'ASTRONOMY', category: 'CELESTIAL_BODIES',
        keywords: ['solar system', 'orbit', 'sun', 'planet', 'mercury', 'venus', 'mars', 'jupiter'],
        complexity: 0.7, animated: true,
        description: 'Solar system with star and orbiting planets',
      },

      // ARCHITECTURE & STRUCTURES
      'building': {
        modelName: 'Building Structure', concept: 'building', domain: 'ARCHITECTURE', category: 'STRUCTURES',
        keywords: ['building', 'house', 'structure', 'floor', 'wall', 'roof', 'window', 'architecture'],
        complexity: 0.6, animated: false,
        description: 'Multi-story building with foundation, windows, and roof',
      },
      'bridge': {
        modelName: 'Suspension Bridge', concept: 'bridge', domain: 'CIVIL_ENGINEERING', category: 'STRUCTURES',
        keywords: ['bridge', 'suspension', 'cable', 'deck', 'pillar', 'span', 'truss', 'arch'],
        complexity: 0.7, animated: false,
        description: 'Suspension bridge with towers, cables, and deck',
      },
      'arch': {
        modelName: 'Stone Arch', concept: 'arch', domain: 'ARCHITECTURE', category: 'STRUCTURES',
        keywords: ['arch', 'keystone', 'vault', 'dome', 'Roman', 'architecture', 'compression'],
        complexity: 0.5, animated: false,
        description: 'Stone arch with keystone and pillars',
      },
    };

    for (const [key, value] of Object.entries(models)) {
      this.modelDatabase.set(key, value);
    }
    console.log(`[ModelRetrieval] Loaded ${Object.keys(models).length} model definitions`);
  }

  /**
   * Build keyword-based search index for fast concept matching
   */
  _buildSearchIndex() {
    this.keywordIndex = new Map(); // keyword → [concept keys]
    for (const [key, model] of this.modelDatabase) {
      model.keywords.forEach(kw => {
        const lowerKw = kw.toLowerCase();
        if (!this.keywordIndex.has(lowerKw)) this.keywordIndex.set(lowerKw, []);
        this.keywordIndex.get(lowerKw).push(key);
      });
    }
    console.log(`[ModelRetrieval] Built keyword index with ${this.keywordIndex.size} terms`);
  }

  /**
   * Retrieve best 3D model for a concept string
   * @param {string} concept - e.g. 'electric motor', 'heart', 'atom'
   * @returns {object} - model metadata + Three.js Group from procedural factory
   */
  async retrieveModelForConcept(concept, learnerLevel = 'INTERMEDIATE') {
    const startTime = Date.now();
    this.stats.queriesExecuted++;
    const normalizedConcept = concept.toLowerCase().trim();

    // Strategy 1: Direct match
    if (this.modelDatabase.has(normalizedConcept)) {
      return this._buildResult(normalizedConcept, 1.0, learnerLevel, startTime);
    }

    // Strategy 2: Keyword search
    const keywordMatch = this._searchByKeywords(normalizedConcept);
    if (keywordMatch) {
      return this._buildResult(keywordMatch.key, keywordMatch.score, learnerLevel, startTime);
    }

    // Strategy 3: Fuzzy string similarity
    const fuzzyMatch = this._fuzzySearch(normalizedConcept);
    if (fuzzyMatch && fuzzyMatch.score > 0.3) {
      return this._buildResult(fuzzyMatch.key, fuzzyMatch.score, learnerLevel, startTime);
    }

    // Fallback: return generic model
    console.warn(`[ModelRetrieval] No match found for "${concept}", using generic model`);
    return this._buildGenericResult(concept, learnerLevel, startTime);
  }

  /**
   * Search by keyword overlap
   */
  _searchByKeywords(query) {
    const queryWords = query.split(/[\s,_-]+/).filter(w => w.length > 2);
    const scores = new Map();

    queryWords.forEach(word => {
      const lw = word.toLowerCase();
      // Exact keyword match
      if (this.keywordIndex.has(lw)) {
        this.keywordIndex.get(lw).forEach(key => {
          scores.set(key, (scores.get(key) || 0) + 1.0);
        });
      }
      // Partial keyword match
      for (const [kw, keys] of this.keywordIndex) {
        if (kw.includes(lw) || lw.includes(kw)) {
          keys.forEach(key => {
            scores.set(key, (scores.get(key) || 0) + 0.5);
          });
        }
      }
    });

    if (scores.size === 0) return null;

    // Find best match
    let bestKey = null, bestScore = 0;
    for (const [key, score] of scores) {
      const normalized = score / queryWords.length;
      if (normalized > bestScore) {
        bestScore = normalized;
        bestKey = key;
      }
    }

    return bestKey ? { key: bestKey, score: Math.min(1.0, bestScore) } : null;
  }

  /**
   * Fuzzy string similarity (Jaccard on character trigrams)
   */
  _fuzzySearch(query) {
    const queryTrigrams = this._getTrigrams(query);
    let bestKey = null, bestScore = 0;

    for (const [key, model] of this.modelDatabase) {
      // Compare against concept key and model name
      const targets = [key, model.modelName.toLowerCase(), ...model.keywords];
      let maxSim = 0;

      targets.forEach(target => {
        const targetTrigrams = this._getTrigrams(target.toLowerCase());
        const intersection = new Set([...queryTrigrams].filter(t => targetTrigrams.has(t)));
        const union = new Set([...queryTrigrams, ...targetTrigrams]);
        const sim = union.size > 0 ? intersection.size / union.size : 0;
        if (sim > maxSim) maxSim = sim;
      });

      if (maxSim > bestScore) {
        bestScore = maxSim;
        bestKey = key;
      }
    }

    return bestKey ? { key: bestKey, score: bestScore } : null;
  }

  _getTrigrams(str) {
    const trigrams = new Set();
    const padded = `  ${str}  `;
    for (let i = 0; i < padded.length - 2; i++) {
      trigrams.add(padded.substring(i, i + 3));
    }
    return trigrams;
  }

  /**
   * Build result with procedural 3D model
   */
  _buildResult(conceptKey, confidence, learnerLevel, startTime) {
    const modelData = this.modelDatabase.get(conceptKey);
    
    // Generate procedural 3D model
    let model3D = null;
    if (proceduralModelFactory.hasConcept(conceptKey)) {
      model3D = proceduralModelFactory.generateModel(conceptKey, learnerLevel);
      this.stats.proceduralGenerated++;
    }

    this.stats.modelsRetrieved++;
    this.stats.avgRetrievalTime = this.stats.avgRetrievalTime * 0.8 + (Date.now() - startTime) * 0.2;

    return {
      ...modelData,
      confidence,
      model3D,
      retrievalTime: Date.now() - startTime,
      generationMethod: 'procedural',
    };
  }

  _buildGenericResult(concept, learnerLevel, startTime) {
    const model3D = proceduralModelFactory.generateModel(concept, learnerLevel);
    this.stats.modelsRetrieved++;
    this.stats.proceduralGenerated++;

    return {
      modelName: concept,
      concept: concept,
      domain: 'GENERAL',
      category: 'UNKNOWN',
      keywords: [concept],
      complexity: 0.5,
      animated: false,
      description: `Visualization for: ${concept}`,
      confidence: 0.3,
      model3D,
      retrievalTime: Date.now() - startTime,
      generationMethod: 'generic',
    };
  }

  /**
   * Retrieve k nearest models to a concept
   */
  async retrieveKNearestModels(concept, k = 3) {
    const normalizedConcept = concept.toLowerCase().trim();
    const results = [];

    for (const [key, model] of this.modelDatabase) {
      const keywordMatch = this._searchByKeywords(key);
      const score = keywordMatch ? keywordMatch.score : 0;
      const fuzzy = this._fuzzySearch(key);
      const combinedScore = Math.max(score, fuzzy ? fuzzy.score : 0);
      results.push({ key, model, score: combinedScore });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, k).map(r => r.model);
  }

  /**
   * Get all available concepts
   */
  getAvailableConcepts() {
    return Array.from(this.modelDatabase.keys());
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      totalModels: this.modelDatabase.size,
      isInitialized: this.isInitialized,
      proceduralAvailable: proceduralModelFactory.getAvailableConcepts().length,
    };
  }
}

window.ModelRetrievalEngine = ModelRetrievalEngine;
