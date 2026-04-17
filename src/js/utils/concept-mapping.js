/**
 * Concept Mapping Engine
 * Maps detected objects to domain-specific knowledge and educational concepts
 */

export class ConceptMappingEngine {
  constructor() {
    this.conceptDatabase = new Map();
    this.domainKnowledgeBase = {};
    this.isInitialized = false;
    this.stats = {
      conceptsMapped: 0,
      domainsQueried: 0,
      cacheHits: 0
    };
  }

  async initialize() {
    console.log('Initializing Concept Mapping Engine...');
    this.loadConceptDatabase();
    this.loadDomainKnowledge();
    this.isInitialized = true;
    console.log('Concept mapper loaded with 26+ educational domains');
  }

  /**
   * Load comprehensive concept database
   */
  loadConceptDatabase() {
    const concepts = {
      // RESEARCH SCCA DATASET (CIFAR)
      'airplane': {
        domain: 'AERONAUTICS',
        category: 'ENGINEERING',
        embedding: [0.9, 0.4, 0.2, 0.8, 0.1],
        description: 'Aircraft driven by jet engines',
        components: { external: ['Wings', 'Fuselage'], internal: ['Jet engine', 'Cockpit'] },
        functions: ['Aerodynamic flight']
      },
      'automobile': {
        domain: 'AUTOMOTIVE',
        category: 'ENGINEERING',
        embedding: [0.8, 0.5, 0.3, 0.7, 0.2],
        description: 'Passenger road vehicle',
        components: { external: ['Chassis', 'Tires'], internal: ['Engine block', 'Transmission'] },
        functions: ['Road driving']
      },
      'ship': {
        domain: 'MARINE',
        category: 'ENGINEERING',
        embedding: [0.7, 0.6, 0.4, 0.6, 0.3],
        description: 'Large watercraft',
        components: { external: ['Hull', 'Deck'], internal: ['Diesel engine', 'Propeller'] },
        functions: ['Water navigation']
      },
      'heavy truck': {
        domain: 'AUTOMOTIVE',
        category: 'ENGINEERING',
        embedding: [0.8, 0.5, 0.3, 0.7, 0.2],
        description: 'Commercial cargo vehicle',
        components: { external: ['Cab', 'Trailer'], internal: ['Heavy engine', 'Drive shaft'] },
        functions: ['Cargo transport']
      },

      // BIOLOGY & LIFE SCIENCES
      'heart': {
        domain: 'BIOLOGY',
        category: 'ANATOMY',
        embedding: [0.9, 0.3, 0.2, 0.8, 0.4],
        description: 'Muscular organ pumping blood',
        components: ['atria', 'ventricles', 'valves', 'vessels'],
        functions: ['circulation', 'oxygenation', 'nutrient_distribution']
      },
      'brain': {
        domain: 'NEUROSCIENCE',
        category: 'ANATOMY',
        embedding: [0.7, 0.8, 0.4, 0.6, 0.5],
        description: 'Central nervous system control center',
        components: ['cerebrum', 'cerebellum', 'brainstem', 'neurons'],
        functions: ['cognition', 'memory', 'motor_control', 'sensory_processing']
      },
      'cell': {
        domain: 'BIOLOGY',
        category: 'MICROSCOPY',
        embedding: [0.8, 0.7, 0.3, 0.5, 0.6],
        description: 'Basic unit of life',
        components: ['nucleus', 'cytoplasm', 'mitochondria', 'ribosome'],
        functions: ['metabolism', 'growth', 'reproduction']
      },
      'plant': {
        domain: 'BOTANY',
        category: 'BIOLOGY',
        embedding: [0.8, 0.4, 0.6, 0.9, 0.2],
        description: 'Photosynthetic organism',
        components: ['roots', 'stem', 'leaves', 'flowers'],
        functions: ['photosynthesis', 'nutrient_uptake', 'reproduction']
      },
      'microorganism': {
        domain: 'MICROBIOLOGY',
        category: 'MICROSCOPY',
        embedding: [0.6, 0.8, 0.7, 0.4, 0.5],
        description: 'Microscopic living organism',
        components: ['cell_wall', 'flagella', 'pili'],
        functions: ['reproduction', 'metabolism', 'disease_transmission']
      },

      // PHYSICS & MECHANICS
      'motor': {
        domain: 'MECHANICAL_ENGINEERING',
        category: 'MECHANICS',
        embedding: [0.8, 0.2, 0.5, 0.3, 0.7],
        description: 'Device converting electrical energy to mechanical energy',
        components: {
          external: ['Housing', 'Cooling Fins', 'Shaft', 'Terminal Box'],
          internal: ['Stator', 'Rotor', 'Copper Coils', 'Bearings', 'Magnets']
        },
        functions: ['rotation', 'torque_generation', 'motion_transmission']
      },
      'circuit': {
        domain: 'COMPUTER_SCIENCE',
        category: 'ELECTRONICS',
        embedding: [0.6, 0.5, 0.9, 0.3, 0.2],
        description: 'Interconnected electrical logic components',
        components: {
          external: ['PCB Board', 'I/O Ports', 'Connectors'],
          internal: ['Microcontroller', 'Resistors', 'Capacitors', 'Copper Traces']
        },
        functions: ['current_flow', 'voltage_regulation', 'signal_processing']
      },
      'cpu': {
        domain: 'COMPUTER_SCIENCE',
        category: 'ELECTRONICS',
        embedding: [0.6, 0.5, 0.9, 0.8, 0.7],
        description: 'Central Processing Unit executing logic',
        components: {
          external: ['Heat Spreader', 'Contact Pads', 'Substrate PCB'],
          internal: ['Silicon Die', 'L1/L2 Cache', 'ALU', 'Transistors']
        },
        functions: ['logic_execution', 'data_calculation', 'instruction_fetching']
      },
      'motherboard': {
        domain: 'COMPUTER_SCIENCE',
        category: 'ELECTRONICS',
        embedding: [0.6, 0.7, 0.9, 0.8, 0.4],
        description: 'Main printed circuit board in general-purpose computers',
        components: {
          external: ['PCB', 'CPU Socket', 'RAM Slots', 'PCIe Slots', 'I/O Ports'],
          internal: ['Chipset', 'VRM', 'SATA Controllers', 'BIOS Chip']
        },
        functions: ['component_interconnection', 'power_distribution', 'data_buses']
      },
      'machine': {
        domain: 'MECHANICAL_ENGINEERING',
        category: 'ENGINEERING',
        embedding: [0.8, 0.6, 0.7, 0.4, 0.5],
        description: 'Device with moving parts for work',
        components: ['gears', 'bearings', 'actuators'],
        functions: ['force_transmission', 'motion_conversion', 'power_delivery']
      },
      'pulley': {
        domain: 'PHYSICS',
        category: 'MECHANICS',
        embedding: [0.7, 0.5, 0.6, 0.4, 0.3],
        description: 'Wheel with grooved rim for rope/cable',
        components: ['wheel', 'axle', 'rim', 'groove'],
        functions: ['force_distribution', 'direction_change', 'mechanical_advantage']
      },

      // CHEMISTRY
      'atom': {
        domain: 'CHEMISTRY',
        category: 'ATOMIC_STRUCTURE',
        embedding: [0.5, 0.9, 0.2, 0.7, 0.4],
        description: 'Smallest unit of matter',
        components: ['proton', 'neutron', 'electron', 'nucleus'],
        functions: ['bonding', 'reaction', 'electron_transfer']
      },
      'molecule': {
        domain: 'CHEMISTRY',
        category: 'MOLECULAR_STRUCTURE',
        embedding: [0.7, 0.6, 0.5, 0.8, 0.3],
        description: 'Group of atoms bonded together',
        components: ['atoms', 'bonds', 'functional_groups'],
        functions: ['reactions', 'properties', 'interactions']
      },
      'crystal': {
        domain: 'CHEMISTRY',
        category: 'MATERIALS',
        embedding: [0.9, 0.5, 0.4, 0.7, 0.3],
        description: 'Solid with ordered atomic structure',
        components: ['lattice', 'unit_cell', 'planes'],
        functions: ['light_refraction', 'vibration', 'electron_behavior']
      },

      // GEOLOGY & EARTH SCIENCE
      'rock': {
        domain: 'GEOLOGY',
        category: 'MINERALOGY',
        embedding: [0.7, 0.3, 0.8, 0.5, 0.6],
        description: 'Aggregate of minerals',
        components: ['minerals', 'crystals', 'matrix'],
        functions: ['Earth_formation', 'resource_storage', 'geologic_time']
      },
      'water': {
        domain: 'EARTH_SCIENCE',
        category: 'HYDROLOGY',
        embedding: [0.5, 0.8, 0.6, 0.3, 0.7],
        description: 'H2O molecule and its states',
        components: ['hydrogen', 'oxygen', 'states'],
        functions: ['dissolving', 'erosion', 'climate_regulation']
      },

      // ASTRONOMY & SPACE
      'planet': {
        domain: 'ASTRONOMY',
        category: 'CELESTIAL_BODIES',
        embedding: [0.6, 0.4, 0.7, 0.8, 0.2],
        description: 'Celestial body orbiting a star',
        components: ['core', 'mantle', 'crust', 'atmosphere'],
        functions: ['orbital_mechanics', 'rotation', 'gravity']
      },
      'star': {
        domain: 'ASTRONOMY',
        category: 'CELESTIAL_BODIES',
        embedding: [0.8, 0.9, 0.3, 0.6, 0.7],
        description: 'Massive luminous sphere of plasma',
        components: ['core', 'photosphere', 'corona'],
        functions: ['nuclear_fusion', 'light_emission', 'gravitational_pull']
      },

      // ARCHITECTURE & STRUCTURES
      'building': {
        domain: 'ARCHITECTURE',
        category: 'STRUCTURES',
        embedding: [0.6, 0.7, 0.5, 0.8, 0.3],
        description: 'Man-made structure for occupation',
        components: ['foundation', 'walls', 'roof', 'interior'],
        functions: ['shelter', 'protection', 'organization_of_space']
      },
      'bridge': {
        domain: 'CIVIL_ENGINEERING',
        category: 'STRUCTURES',
        embedding: [0.7, 0.6, 0.8, 0.4, 0.5],
        description: 'Structure spanning physical obstacle',
        components: ['deck', 'supports', 'cables', 'pylons'],
        functions: ['spanning', 'load_distribution', 'traffic_support']
      }
    };

    // Additional concepts for expanded coverage
    const additionalConcepts = {
      'dna': {
        domain: 'GENETICS', category: 'MOLECULAR_BIOLOGY',
        embedding: [0.75, 0.85, 0.3, 0.6, 0.5],
        description: 'Double helix molecule carrying genetic information',
        components: ['nucleotides', 'base_pairs', 'sugar_phosphate_backbone', 'hydrogen_bonds'],
        functions: ['genetic_storage', 'protein_synthesis', 'heredity', 'replication']
      },
      'lung': {
        domain: 'BIOLOGY', category: 'ANATOMY',
        embedding: [0.85, 0.35, 0.25, 0.75, 0.45],
        description: 'Respiratory organ for gas exchange',
        components: ['trachea', 'bronchi', 'alveoli', 'diaphragm'],
        functions: ['oxygen_intake', 'carbon_dioxide_removal', 'gas_exchange']
      },
      'eye': {
        domain: 'BIOLOGY', category: 'ANATOMY',
        embedding: [0.7, 0.4, 0.55, 0.8, 0.35],
        description: 'Organ for visual perception',
        components: ['cornea', 'iris', 'lens', 'retina', 'optic_nerve'],
        functions: ['light_detection', 'image_formation', 'color_perception']
      },
      'gear': {
        domain: 'MECHANICAL_ENGINEERING', category: 'MECHANICS',
        embedding: [0.75, 0.25, 0.6, 0.35, 0.65],
        description: 'Toothed wheel for transmitting motion',
        components: ['teeth', 'hub', 'axle', 'rim'],
        functions: ['torque_transmission', 'speed_reduction', 'direction_change']
      },
      'turbine': {
        domain: 'ENGINEERING', category: 'ENERGY',
        embedding: [0.8, 0.3, 0.7, 0.4, 0.6],
        description: 'Rotary engine extracting energy from fluid flow',
        components: ['blades', 'rotor', 'shaft', 'casing'],
        functions: ['energy_conversion', 'rotation', 'power_generation']
      },
      'piston': {
        domain: 'MECHANICAL_ENGINEERING', category: 'MECHANICS',
        embedding: [0.82, 0.28, 0.65, 0.38, 0.72],
        description: 'Component moving within a cylinder for work conversion',
        components: ['cylinder', 'piston_head', 'connecting_rod', 'crankshaft'],
        functions: ['compression', 'power_stroke', 'motion_conversion']
      },
      'transformer': {
        domain: 'ELECTRICAL_ENGINEERING', category: 'POWER',
        embedding: [0.65, 0.55, 0.85, 0.32, 0.28],
        description: 'Device transferring electrical energy between circuits via electromagnetic induction',
        components: ['iron_core', 'primary_winding', 'secondary_winding', 'insulation'],
        functions: ['voltage_transformation', 'impedance_matching', 'isolation']
      },
      'spring': {
        domain: 'PHYSICS', category: 'MECHANICS',
        embedding: [0.72, 0.45, 0.55, 0.42, 0.38],
        description: 'Elastic device that stores mechanical energy',
        components: ['coils', 'end_caps', 'wire'],
        functions: ['energy_storage', 'force_absorption', 'oscillation']
      },
      'magnet': {
        domain: 'PHYSICS', category: 'ELECTROMAGNETISM',
        embedding: [0.6, 0.7, 0.45, 0.55, 0.5],
        description: 'Object producing a magnetic field',
        components: ['north_pole', 'south_pole', 'magnetic_domains'],
        functions: ['attraction', 'repulsion', 'field_generation']
      },
      'lens': {
        domain: 'PHYSICS', category: 'OPTICS',
        embedding: [0.55, 0.65, 0.4, 0.7, 0.3],
        description: 'Transparent curved piece refracting light',
        components: ['curved_surface', 'optical_center', 'focal_point'],
        functions: ['refraction', 'magnification', 'focusing']
      },
      'pendulum': {
        domain: 'PHYSICS', category: 'MECHANICS',
        embedding: [0.68, 0.42, 0.52, 0.45, 0.4],
        description: 'Weight suspended from a pivot swinging freely',
        components: ['bob', 'string', 'pivot', 'support'],
        functions: ['oscillation', 'timekeeping', 'energy_conversion']
      },
      'solar_system': {
        domain: 'ASTRONOMY', category: 'CELESTIAL_BODIES',
        embedding: [0.65, 0.5, 0.75, 0.85, 0.3],
        description: 'Star system with orbiting planets',
        components: ['sun', 'planets', 'moons', 'asteroids'],
        functions: ['orbital_mechanics', 'gravitational_binding', 'planetary_evolution']
      },
      'arch': {
        domain: 'ARCHITECTURE', category: 'STRUCTURES',
        embedding: [0.62, 0.68, 0.55, 0.78, 0.35],
        description: 'Curved structure spanning an opening',
        components: ['keystone', 'voussoirs', 'abutments', 'pillars'],
        functions: ['load_distribution', 'spanning', 'compression_transfer']
      }
    };

    // Build concept map
    for (const [key, value] of Object.entries(concepts)) {
      this.conceptDatabase.set(key, value);
    }
    for (const [key, value] of Object.entries(additionalConcepts)) {
      this.conceptDatabase.set(key, value);
    }

    console.log(`Loaded ${this.conceptDatabase.size} base concepts`);
  }

  /**
   * Get all concept labels for CLIP candidate matching
   */
  getAllConceptLabels() {
    return Array.from(this.conceptDatabase.keys());
  }

  /**
   * Look up concept by its label string (same as name in this system)
   */
  getConceptByLabel(label) {
    const normalized = label.toLowerCase().trim();
    const data = this.conceptDatabase.get(normalized);
    if (data) return { concept: normalized, ...data };
    // Fuzzy match
    for (const [key, value] of this.conceptDatabase) {
      if (key.includes(normalized) || normalized.includes(key)) {
        return { concept: key, ...value };
      }
    }
    return null;
  }

  /**
   * Look up concept by name
   */
  getConceptByName(name) {
    return this.getConceptByLabel(name);
  }

  /**
   * Load domain-specific knowledge
   */
  loadDomainKnowledge() {
    this.domainKnowledgeBase = {
      'BIOLOGY': {
        name: 'Biology',
        concepts: ['cell', 'heart', 'brain', 'plant', 'microorganism'],
        subdomains: ['ANATOMY', 'BOTANY', 'MICROBIOLOGY', 'NEUROSCIENCE'],
        explanation_templates: {
          'BEGINNER': 'Basic structure and simple functions',
          'INTERMEDIATE': 'Component interactions and biological processes',
          'ADVANCED': 'Molecular mechanisms and system interactions',
          'EXPERT': 'Cutting-edge research and emerging discoveries'
        }
      },
      'ENGINEERING': {
        name: 'Engineering',
        concepts: ['motor', 'circuit', 'machine', 'pulley', 'bridge'],
        subdomains: ['MECHANICAL', 'ELECTRICAL', 'CIVIL'],
        explanation_templates: {
          'BEGINNER': 'Basic principles and simple mechanisms',
          'INTERMEDIATE': 'System design and optimization',
          'ADVANCED': 'Advanced modeling and simulation',
          'EXPERT': 'Research frontiers and novel applications'
        }
      },
      'CHEMISTRY': {
        name: 'Chemistry',
        concepts: ['atom', 'molecule', 'crystal'],
        subdomains: ['ATOMIC_STRUCTURE', 'MOLECULAR_STRUCTURE', 'MATERIALS'],
        explanation_templates: {
          'BEGINNER': 'Basic particles and simple bonding',
          'INTERMEDIATE': 'Reaction mechanisms and equilibrium',
          'ADVANCED': 'Quantum chemistry and spectroscopy',
          'EXPERT': 'Computational chemistry and materials science'
        }
      },
      'PHYSICS': {
        name: 'Physics',
        concepts: ['motor', 'pulley', 'star', 'planet'],
        subdomains: ['MECHANICS', 'ELECTROMAGNETISM', 'QUANTUM', 'ASTROPHYSICS'],
        explanation_templates: {
          'BEGINNER': 'Fundamental laws and basic applications',
          'INTERMEDIATE': 'Complex systems and mathematical modeling',
          'ADVANCED': 'Advanced theories and computational physics',
          'EXPERT': 'Theoretical research and cutting-edge discoveries'
        }
      },
      'GEOLOGY': {
        name: 'Geology',
        concepts: ['rock', 'water'],
        subdomains: ['MINERALOGY', 'PETROLOGY', 'STRUCTURAL'],
        explanation_templates: {
          'BEGINNER': 'Rock types and basic formation processes',
          'INTERMEDIATE': 'Plate tectonics and mineral properties',
          'ADVANCED': 'Geochemistry and structural analysis',
          'EXPERT': 'Geodynamics and paleogenomics'
        }
      },
      'ASTRONOMY': {
        name: 'Astronomy',
        concepts: ['planet', 'star'],
        subdomains: ['OBSERVATIONAL', 'THEORETICAL', 'COSMOLOGY'],
        explanation_templates: {
          'BEGINNER': 'Celestial objects and orbital basics',
          'INTERMEDIATE': 'Stellar evolution and galactic structures',
          'ADVANCED': 'Astrophysical processes and modeling',
          'EXPERT': 'Cosmology and gravitational physics'
        }
      },
      'ARCHITECTURE': {
        name: 'Architecture',
        concepts: ['building', 'bridge'],
        subdomains: ['DESIGN', 'STRUCTURES', 'URBAN_PLANNING'],
        explanation_templates: {
          'BEGINNER': 'Basic design principles and function',
          'INTERMEDIATE': 'Advanced design and structural systems',
          'ADVANCED': 'Computational design and optimization',
          'EXPERT': 'Parametric architecture and AI-driven design'
        }
      }
    };
  }

  /**
   * Map image embedding to concept with domain
   */
  async mapImageToConceptWithDomain(imageEmbedding) {
    this.stats.conceptsMapped++;
    
    if (!this.isInitialized) {
      throw new Error('Concept mapper not initialized');
    }

    // Find closest concept using cosine similarity
    let bestMatch = null;
    let bestSimilarity = -1;

    for (const [conceptName, conceptData] of this.conceptDatabase) {
      const similarity = this.cosineSimilarity(imageEmbedding, conceptData.embedding);
      
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = {
          concept: conceptName,
          ...conceptData,
          similarity: similarity
        };
      }
    }

    if (!bestMatch) {
      return {
        concept: 'unknown',
        domain: 'GENERAL',
        confidence: 0,
        similarity: 0
      };
    }

    return {
      concept: bestMatch.concept,
      domain: bestMatch.domain,
      category: bestMatch.category,
      confidence: Math.max(0, Math.min(1, bestMatch.similarity)),
      description: bestMatch.description,
      components: bestMatch.components,
      functions: bestMatch.functions
    };
  }

  /**
   * Get concept explanation for learner level
   */
  getConceptExplanation(concept, learnerLevel = 'INTERMEDIATE') {
    const conceptData = this.conceptDatabase.get(concept);
    
    if (!conceptData) {
      return {
        concept: concept,
        definition: 'Concept not found in knowledge base',
        applications: [],
        learnerLevel: learnerLevel
      };
    }

    const domain = this.domainKnowledgeBase[conceptData.domain];
    const template = domain?.explanation_templates[learnerLevel] || 'Standard explanation';

    return {
      concept: concept,
      domain: conceptData.domain,
      category: conceptData.category,
      definition: conceptData.description,
      template: template,
      components: conceptData.components,
      functions: conceptData.functions,
      applications: this.generateApplications(concept, learnerLevel),
      learnerLevel: learnerLevel
    };
  }

  /**
   * Generate real-world applications
   */
  generateApplications(concept, learnerLevel) {
    const applications = {
      'heart': {
        'BEGINNER': ['Pumps blood around body', 'Delivers oxygen'],
        'INTERMEDIATE': ['Cardiac cycles', 'Blood pressure regulation', 'Heart murmurs'],
        'ADVANCED': ['Electrophysiology', 'Hemodynamics', 'Disease modeling'],
        'EXPERT': ['Gene therapy', 'Artificial hearts', 'Regenerative medicine']
      },
      'motor': {
        'BEGINNER': ['Fans', 'Toys', 'Drills'],
        'INTERMEDIATE': ['Industrial motors', 'Efficiency optimization', 'Speed control'],
        'ADVANCED': ['Vector control', 'Power electronics', 'Thermal modeling'],
        'EXPERT': ['Quantum motors', 'Exotic materials', 'Superefficient designs']
      },
      'circuit': {
        'BEGINNER': ['Simple circuits', 'LED control', 'Batteries'],
        'INTERMEDIATE': ['Complex circuits', 'Signal processing', 'Digital logic'],
        'ADVANCED': ['IC design', 'EMI/EMC', 'Power distribution'],
        'EXPERT': ['Quantum circuits', '5G design', 'Neuromorphic chips']
      }
    };

    return applications[concept]?.[learnerLevel] || ['General application'];
  }

  /**
   * Cosine similarity between embeddings
   */
  cosineSimilarity(vec1, vec2) {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) return 0;
    
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
    
    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Get all concepts in domain
   */
  getConceptsByDomain(domain) {
    this.stats.domainsQueried++;
    const domainData = this.domainKnowledgeBase[domain];
    
    if (!domainData) return [];
    
    return domainData.concepts.map(concept => this.conceptDatabase.get(concept));
  }

  /**
   * Get domain information
   */
  getDomainInfo(domain) {
    return this.domainKnowledgeBase[domain] || null;
  }

  /**
   * Add custom concept to database
   */
  addCustomConcept(conceptName, data) {
    this.conceptDatabase.set(conceptName, data);
    console.log(`Added custom concept: ${conceptName}`);
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      totalConcepts: this.conceptDatabase.size,
      totalDomains: Object.keys(this.domainKnowledgeBase).length,
      isInitialized: this.isInitialized
    };
  }
}

// Export for use
window.ConceptMappingEngine = ConceptMappingEngine;
