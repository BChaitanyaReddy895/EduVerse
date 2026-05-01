/**
 * 3D Model Retrieval Engine
 * Uses cosine similarity search for concept→model matching.
 * Integrates with ProceduralModelFactory for actual 3D geometry generation.
 * 
 * Replaces broken FAISS dependency with efficient JS-native similarity search.
 */

import { proceduralModelFactory } from './procedural-model-factory.js';
import { modelProviderAdapters } from './model-provider-adapters.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

export class ModelRetrievalEngine {
  constructor() {
    this.modelDatabase = new Map();
    this.openModelIndex = [];
    this.isInitialized = false;
    this.stats = {
      modelsRetrieved: 0,
      queriesExecuted: 0,
      avgRetrievalTime: 0,
      proceduralGenerated: 0,
      providerGenerated: 0,
      openIndexHits: 0,
    };

    this.openSourceCatalog = {
      default: [
        {
          provider: 'Sketchfab',
          license: 'CC / Editorial (varies per model)',
          buildSearchUrl: (concept) => `https://sketchfab.com/search?type=models&q=${encodeURIComponent(concept)}`,
        },
        {
          provider: 'Poly Pizza',
          license: 'CC0 / permissive library',
          buildSearchUrl: (concept) => `https://poly.pizza/search/${encodeURIComponent(concept)}`,
        },
        {
          provider: 'Smithsonian 3D',
          license: 'Open access subsets available',
          buildSearchUrl: (concept) => `https://3d.si.edu/search?edan_q=${encodeURIComponent(concept)}`,
        },
      ],
    };
    this.providerAdapters = modelProviderAdapters;

    this.conceptAliases = new Map([
      ['human heart', 'heart'],
      ['cardiac', 'heart'],
      ['cardiac muscle', 'heart'],
      ['heart anatomy', 'heart'],
      ['human brain', 'brain'],
      ['cerebrum', 'brain'],
      ['cerebral cortex', 'brain'],
      ['human lungs', 'lung'],
      ['human lung', 'lung'],
      ['lungs', 'lung'],
      ['human eye', 'eye'],
      ['eyeball', 'eye'],
      ['animal cell', 'cell'],
      ['plant cell', 'cell'],
      ['dna helix', 'dna'],
      ['double helix', 'dna'],
      ['solar system', 'solar_system'],
      ['truck', 'heavy truck'],
      ['cargo truck', 'heavy truck'],
      ['car', 'automobile'],
      ['vehicle', 'automobile'],
      ['aircraft', 'airplane'],
      ['aeroplane', 'airplane'],
      ['plane', 'airplane'],
      ['bus', 'bus'],
      ['school bus', 'bus'],
      ['city bus', 'bus'],
      ['boat', 'ship'],
      ['database management system', 'database'],
      ['database management', 'database'],
      ['dbms', 'database'],
      ['sql database', 'database'],
      ['machine learning', 'machine_learning'],
      ['ml', 'machine_learning'],
      ['artificial intelligence', 'machine_learning'],
      ['web server', 'web_server'],
      ['client server', 'web_server'],
      ['document object model', 'dom_tree'],
      ['dom tree', 'dom_tree'],
      ['h2o', 'water'],
      ['water molecule', 'water'],
      ['optical lens', 'lens'],
      ['magnetic field', 'magnet'],
    ]);
  }

  async initialize() {
    console.log('[ModelRetrieval] Initializing...');
    this.loadModelDatabase();
    this._buildSearchIndex();
    await this.providerAdapters.initialize();
    await this._loadOpenModelIndex();
    this.isInitialized = true;
    console.log(
      `[ModelRetrieval] Ready with ${this.modelDatabase.size} concepts and ${this.openModelIndex.length} open-model entries`
    );
    return true;
  }

  async _loadOpenModelIndex() {
    try {
      const res = await fetch('/data/open-model-index.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`index http ${res.status}`);
      const payload = await res.json();
      const rawEntries = Array.isArray(payload?.models) ? payload.models : [];
      this.openModelIndex = rawEntries
        .map((entry) => this._normalizeOpenModelEntry(entry))
        .filter(Boolean);
      console.log(`[ModelRetrieval] Loaded open model index entries: ${this.openModelIndex.length}`);
    } catch (error) {
      this.openModelIndex = [];
      console.warn('[ModelRetrieval] Open model index unavailable. Using local procedural fallback.', error);
    }
  }

  _normalizeOpenModelEntry(entry) {
    if (!entry || typeof entry !== 'object') return null;
    const url = String(entry.url || '').trim();
    const concept = this._normalizeConcept(entry.concept || '');
    if (!url || !concept) return null;
    const keywords = Array.isArray(entry.keywords)
      ? entry.keywords.map((k) => this._normalizeConcept(k)).filter(Boolean)
      : [];
    return {
      concept,
      modelName: String(entry.modelName || concept),
      domain: String(entry.domain || 'GENERAL'),
      category: String(entry.category || 'OPEN_SOURCE'),
      description: String(entry.description || `Open-source model for ${concept}`),
      keywords: Array.from(new Set([concept, ...keywords])),
      source: String(entry.source || 'Open Source'),
      license: String(entry.license || 'See source'),
      url,
      previewUrl: String(entry.previewUrl || ''),
    };
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

      // SCCA RESEARCH CIFAR DATASET
      'airplane': {
        modelName: 'Commercial Airplane', concept: 'airplane', domain: 'AERONAUTICS', category: 'ENGINEERING',
        keywords: ['airplane', 'plane', 'aircraft', 'jet', 'flight', 'aeronautics', 'wings', 'engine', 'cockpit'],
        complexity: 0.9, animated: true,
        description: 'Commercial aircraft with fuselage, wings, jet engines, and cockpit',
      },
      'automobile': {
        modelName: 'Automobile', concept: 'automobile', domain: 'AUTOMOTIVE', category: 'ENGINEERING',
        keywords: ['automobile', 'car', 'vehicle', 'chassis', 'tires', 'engine', 'transmission', 'cab'],
        complexity: 0.8, animated: true,
        description: 'Passenger vehicle with visible chassis, engine block, and transmission',
      },
      'ship': {
        modelName: 'Marine Vessel', concept: 'ship', domain: 'MARINE', category: 'ENGINEERING',
        keywords: ['ship', 'boat', 'vessel', 'marine', 'hull', 'deck', 'propeller', 'diesel engine'],
        complexity: 0.8, animated: true,
        description: 'Naval vessel showing hull structure and internal diesel propulsion',
      },
      'heavy truck': {
        modelName: 'Heavy Cargo Truck', concept: 'heavy truck', domain: 'AUTOMOTIVE', category: 'ENGINEERING',
        keywords: ['heavy truck', 'truck', 'cargo', 'trailer', 'cab', 'engine', 'transport', 'wheels'],
        complexity: 0.8, animated: true,
        description: 'Commercial heavy transport truck with cab, trailer, and internal engine',
      },
      'bus': {
        modelName: 'Passenger Bus', concept: 'bus', domain: 'AUTOMOTIVE', category: 'ENGINEERING',
        keywords: ['bus', 'passenger', 'transport', 'vehicle', 'public transport', 'wheels', 'chassis'],
        complexity: 0.75, animated: true,
        description: 'Passenger transport bus with body, cabin, and chassis',
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

      // CSE / WEB TECHNOLOGIES
      'web_server': {
        modelName: 'Client-Server Architecture', concept: 'web_server', domain: 'COMPUTER_SCIENCE', category: 'WEB_TECH',
        keywords: ['server', 'client', 'web', 'http', 'request', 'response', 'network', 'cloud', 'routing', 'architecture'],
        complexity: 0.9, animated: true,
        description: 'Multi-node client-server topology representing asynchronous request lifecycles.',
      },
      'database': {
        modelName: 'Relational Database', concept: 'database', domain: 'COMPUTER_SCIENCE', category: 'DATA_SYSTEMS',
        keywords: ['database', 'sql', 'nosql', 'relational', 'disk', 'storage', 'data', 'lake', 'query'],
        complexity: 0.8, animated: true,
        description: 'Spinning memory clusters with querying pipeline visualization.',
      },
      'dom_tree': {
        modelName: 'DOM Hierarchy Tree', concept: 'dom_tree', domain: 'COMPUTER_SCIENCE', category: 'WEB_TECH',
        keywords: ['dom', 'html', 'javascript', 'tree', 'node', 'element', 'document', 'object', 'model'],
        complexity: 0.85, animated: true,
        description: 'Holographic hierarchy of the Document Object Model translating raw HTML.',
      },
      'machine_learning': {
        modelName: 'Machine Learning Pipeline', concept: 'machine_learning', domain: 'COMPUTER_SCIENCE', category: 'AI',
        keywords: ['machine learning', 'ml', 'ai', 'model', 'training', 'inference', 'dataset', 'feature', 'neural'],
        complexity: 0.85, animated: true,
        description: 'Data-to-model pipeline with training and inference flow visualization.',
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
  async retrieveModelForConcept(concept, learnerLevel = 'INTERMEDIATE', generative_blueprint = null, sourceImageData = null) {
    const startTime = Date.now();
    this.stats.queriesExecuted++;
    const normalizedConcept = this._normalizeConcept(concept);
    const canonicalConcept = this._resolveCanonicalConcept(normalizedConcept);

    // Strategy 0: external provider adapters (hybrid/API-first when configured)
    const providerResult = await this._tryProviderModel(canonicalConcept, sourceImageData, learnerLevel, startTime);
    if (providerResult) return providerResult;

    // Strategy 1: Direct match
    if (this.modelDatabase.has(canonicalConcept)) {
      return await this._buildResult(canonicalConcept, 1.0, learnerLevel, startTime, generative_blueprint, sourceImageData);
    }

    // Strategy 2: Keyword search
    const keywordMatch = this._searchByKeywords(canonicalConcept);
    if (keywordMatch) {
      return await this._buildResult(keywordMatch.key, keywordMatch.score, learnerLevel, startTime, generative_blueprint, sourceImageData);
    }

    // Strategy 3: Fuzzy string similarity
    const fuzzyMatch = this._fuzzySearch(canonicalConcept);
    if (fuzzyMatch && fuzzyMatch.score > 0.3) {
      return await this._buildResult(fuzzyMatch.key, fuzzyMatch.score, learnerLevel, startTime, generative_blueprint, sourceImageData);
    }

    // Strategy 4: Dynamic open-source GLB index (data-driven, no code hardcoding per concept)
    const openMatch = this._searchOpenModelIndex(canonicalConcept);
    if (openMatch) {
      this.stats.openIndexHits++;
      return await this._buildOpenModelResult(openMatch, learnerLevel, startTime);
    }

    // Fallback: return generic model
    console.warn(`[ModelRetrieval] No match found for "${concept}", using generic model`);
    return await this._buildGenericResult(canonicalConcept, learnerLevel, startTime, generative_blueprint, sourceImageData);
  }

  _normalizeConcept(concept) {
    return (concept || '')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, ' ')
      .replace(/\s+/g, ' ');
  }

  _resolveCanonicalConcept(query) {
    if (!query) return '';
    if (this.modelDatabase.has(query)) return query;
    if (this.conceptAliases.has(query)) return this.conceptAliases.get(query);

    for (const [alias, canonical] of this.conceptAliases) {
      if (query.includes(alias)) return canonical;
    }

    const spaceToUnderscore = query.replace(/\s+/g, '_');
    if (this.modelDatabase.has(spaceToUnderscore)) return spaceToUnderscore;

    return query;
  }

  /**
   * Search by keyword overlap
   */
  _searchByKeywords(query) {
    const queryWords = query
      .split(/[\s,_-]+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 2);
    if (queryWords.length === 0) return null;
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

    for (const [key, model] of this.modelDatabase) {
      const keyText = key.toLowerCase();
      const modelName = model.modelName.toLowerCase();
      if (query === keyText || query === modelName) {
        scores.set(key, (scores.get(key) || 0) + 4.0);
      } else if (query.includes(keyText) || keyText.includes(query)) {
        scores.set(key, (scores.get(key) || 0) + 2.0);
      }
    }

    if (scores.size === 0) return null;

    // Find best match
    let bestKey = null, bestScore = 0;
    for (const [key, score] of scores) {
      const normalized = score / queryWords.length;
      if (
        normalized > bestScore ||
        (normalized === bestScore && bestKey && key.localeCompare(bestKey) < 0)
      ) {
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

  _searchOpenModelIndex(query) {
    if (!Array.isArray(this.openModelIndex) || this.openModelIndex.length === 0) return null;
    const normalizedQuery = this._normalizeConcept(query);
    if (!normalizedQuery) return null;

    let best = null;
    let bestScore = 0;
    for (const entry of this.openModelIndex) {
      const targets = [entry.concept, entry.modelName.toLowerCase(), ...(entry.keywords || [])];
      let localScore = 0;
      for (const target of targets) {
        const t = this._normalizeConcept(target);
        if (!t) continue;
        if (normalizedQuery === t) localScore = Math.max(localScore, 1.0);
        else if (normalizedQuery.includes(t) || t.includes(normalizedQuery)) localScore = Math.max(localScore, 0.85);
        else {
          const sim = this._jaccardTokenSimilarity(normalizedQuery, t);
          localScore = Math.max(localScore, sim);
        }
      }
      if (localScore > bestScore) {
        bestScore = localScore;
        best = entry;
      }
    }
    return bestScore >= 0.45 ? { ...best, confidence: bestScore } : null;
  }

  async _tryProviderModel(concept, sourceImageData, learnerLevel, startTime) {
    try {
      const generated = await this.providerAdapters.tryGenerateFromProviders({
        concept,
        imageData: sourceImageData,
        timeoutMs: 20000,
      });
      if (!generated?.url) return null;
      return await this._buildProviderResult(generated, concept, learnerLevel, startTime);
    } catch (error) {
      console.warn('[ModelRetrieval] Provider generation unavailable, continuing fallback chain:', error);
      return null;
    }
  }

  _jaccardTokenSimilarity(a, b) {
    const aSet = new Set(a.split(/[\s_-]+/).filter(Boolean));
    const bSet = new Set(b.split(/[\s_-]+/).filter(Boolean));
    if (aSet.size === 0 || bSet.size === 0) return 0;
    const intersection = [...aSet].filter((token) => bSet.has(token)).length;
    const union = new Set([...aSet, ...bSet]).size;
    return union > 0 ? intersection / union : 0;
  }

  async _buildOpenModelResult(openEntry, learnerLevel, startTime) {
    const gltf = await this._loadExternalGLTF(openEntry.url);
    const model3D = gltf.scene;
    this.stats.modelsRetrieved++;
    this.stats.avgRetrievalTime = this.stats.avgRetrievalTime * 0.8 + (Date.now() - startTime) * 0.2;
    return {
      modelName: openEntry.modelName,
      concept: openEntry.concept,
      domain: openEntry.domain,
      category: openEntry.category,
      keywords: openEntry.keywords,
      complexity: 0.75,
      animated: true,
      description: openEntry.description,
      confidence: openEntry.confidence,
      model3D,
      retrievalTime: Date.now() - startTime,
      generationMethod: 'open-source-index-glb',
      modelSource: openEntry.source,
      openSourceAlternatives: this._getOpenSourceAlternatives(openEntry.concept),
      license: openEntry.license,
      previewUrl: openEntry.previewUrl,
    };
  }

  async _buildProviderResult(providerEntry, concept, learnerLevel, startTime) {
    const gltf = await this._loadExternalGLTF(providerEntry.url);
    const model3D = gltf.scene;
    this.stats.modelsRetrieved++;
    this.stats.providerGenerated++;
    this.stats.avgRetrievalTime = this.stats.avgRetrievalTime * 0.8 + (Date.now() - startTime) * 0.2;
    return {
      modelName: providerEntry.modelName || concept,
      concept,
      domain: providerEntry.domain || 'GENERAL',
      category: providerEntry.category || 'EXTERNAL',
      keywords: providerEntry.keywords || [concept],
      complexity: 0.8,
      animated: true,
      description: providerEntry.description || `Generated model for ${concept}`,
      confidence: 0.92,
      model3D,
      retrievalTime: Date.now() - startTime,
      generationMethod: 'external-provider-glb',
      modelSource: providerEntry.source || providerEntry.provider || 'External Provider',
      openSourceAlternatives: this._getOpenSourceAlternatives(concept),
      license: providerEntry.license || 'Provider-defined',
      previewUrl: providerEntry.previewUrl || '',
    };
  }

  _getOpenSourceAlternatives(concept) {
    const entries = this.openSourceCatalog.default || [];
    return entries.map(entry => ({
      provider: entry.provider,
      license: entry.license,
      searchUrl: entry.buildSearchUrl(concept),
    }));
  }

  /**
   * Build result and dynamically inject High-Fidelity CAD models
   */
  async _buildResult(conceptKey, confidence, learnerLevel, startTime, generative_blueprint = null, sourceImageData = null) {
    const modelData = this.modelDatabase.get(conceptKey);
    let model3D = null;
    let method = 'procedural';

    try {
      // Phase 1: Try loading a high-fidelity external .GLB CAD file
      const url = `/models/${conceptKey.replace(' ', '_')}.glb`;

      const gltf = await this._loadExternalGLTF(url);
      model3D = gltf.scene;
      
      // ==========================================
      // HEURISTIC SPATIAL CLASSIFIER FOR RAW GLB
      // ==========================================
      const boundingBox = new THREE.Box3().setFromObject(model3D);
      const center = boundingBox.getCenter(new THREE.Vector3());
      const maxVolume = boundingBox.getSize(new THREE.Vector3()).lengthSq();

      model3D.traverse((child) => {
        if (child.isMesh) {
          const n = child.name.toLowerCase();
          
          // Calculate volumetric parameters to guess component purpose
          child.geometry.computeBoundingBox();
          let vol = 0;
          if (child.geometry.boundingBox) {
             vol = child.geometry.boundingBox.getSize(new THREE.Vector3()).lengthSq();
          }
           
          // Semantic & Spatial Injection
          if (n.includes('body') || n.includes('chassis') || n.includes('hull') || vol > (maxVolume * 0.4)) {
              child.name = 'structure_geom_' + child.name; // Tag as outer structure
              child.material = new THREE.MeshPhysicalMaterial({
                  color: window.extractedDominantColor ? window.extractedDominantColor : 0xcccccc,
                  transmission: 0.9, opacity: 0.25, transparent: true,
                  roughness: 0.1, metalness: 0.9, clearcoat: 1.0, side: THREE.DoubleSide
              });
          } else if (n.includes('engine') || n.includes('motor') || n.includes('tire') || n.includes('wheel') || vol < (maxVolume * 0.1)) {
              child.name = 'function_internal_' + child.name; // Tag as functioning internal
          } else {
              child.name = 'interaction_node_' + child.name; // Fallback to interaction layer
          }
        }
      });
      method = 'glb-heuristic-classified';
      model3D.userData.animationData = { type: 'wiggle', rate: 1.0, amplitude: 0.05 };
      console.log(`[ModelRetrieval] Successfully loaded and classified High-Fidelity CAD for ${conceptKey}`);
      
    } catch (e) {
      console.warn('[ModelRetrieval] No local GLB found. Spawning Generative Mathematical Geometry for:', conceptKey);
      
      // Removed Meshy API Prompt as per user constraint.
      // Phase 3: Fallback directly to the mathematical CSG L-System
      if (proceduralModelFactory.hasConcept(conceptKey)) {
          model3D = await proceduralModelFactory.generateModel(conceptKey, learnerLevel, generative_blueprint, sourceImageData);
          this.stats.proceduralGenerated++;
          method = 'procedural-csg';
      }
    }

    this.stats.modelsRetrieved++;
    this.stats.avgRetrievalTime = this.stats.avgRetrievalTime * 0.8 + (Date.now() - startTime) * 0.2;

    return {
      ...modelData,
      confidence,
      model3D,
      retrievalTime: Date.now() - startTime,
      generationMethod: method,
      modelSource: method.startsWith('glb') ? 'local-glb' : 'procedural',
      openSourceAlternatives: this._getOpenSourceAlternatives(modelData.concept || conceptKey),
    };
  }

  _loadExternalGLTF(url) {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
      loader.setDRACOLoader(dracoLoader);
      loader.load(url, resolve, undefined, reject);
    });
  }

  async _spawnMeshyModel(concept, apiKey) {
    // 1. Initiate Task
    const startRes = await fetch('https://api.meshy.ai/v2/text-to-3d', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mode: "preview",
        prompt: `A highly detailed, isolated 3D model of ${concept}, suitable for academic simulation, solid white background`,
        art_style: "realistic",
        should_remesh: true
      })
    });

    if (!startRes.ok) {
       const errTxt = await startRes.text();
       throw new Error("Failed to start Mesh Task: " + startRes.status + " " + errTxt);
    }
    
    const startData = await startRes.json();
    const taskId = startData.result;

    if (!taskId) throw new Error("No Task ID returned");

    // 2. Poll Task
    return new Promise((resolve, reject) => {
       const poll = async () => {
          const checkRes = await fetch(`https://api.meshy.ai/v2/text-to-3d/${taskId}`, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
          });
          const checkData = await checkRes.json();

          if (checkData.status === 'SUCCEEDED') {
              resolve(checkData.model_urls.glb);
          } else if (checkData.status === 'FAILED') {
              reject(new Error("Meshy failed to generate concept: " + checkData.task_error?.message));
          } else {
              // IN_PROGRESS or PENDING -- update UI with progress if possible
              const el = document.getElementById('ar-loading');
              if (el) el.innerHTML = `Spawning AI 3D Model...<br><span style="font-size:12px">Progress: ${checkData.progress || 0}%</span>`;
              setTimeout(poll, 4000); // Check every 4 seconds
          }
       };
       setTimeout(poll, 3000);
    });
  }

  async _buildGenericResult(concept, learnerLevel, startTime, generative_blueprint = null, sourceImageData = null) {
    const model3D = await proceduralModelFactory.generateModel(concept, learnerLevel, generative_blueprint, sourceImageData);
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
      modelSource: 'procedural-generic',
      openSourceAlternatives: this._getOpenSourceAlternatives(concept),
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
