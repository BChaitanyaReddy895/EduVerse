// ============================================
// Universal Multi-Domain Concept Analyzer v1.0
// Detects and routes ALL academic topics
// ============================================

export class UniversalConceptAnalyzer {
  constructor() {
    this.domains = {
      // Computer Science - Databases
      'CS_DATABASE': {
        keywords: [
          'database', 'relational', 'table', 'schema', 'sql', 'nosql',
          'index', 'query', 'transaction', 'acid', 'normalization',
          'foreign key', 'primary key', 'join', 'aggregation'
        ],
        complexity: 8,
        visualizationType: 'database-schema-3d',
        icon: '🗄️',
        description: 'Database structure and relationships'
      },

      // Computer Science - Cryptography
      'CS_CRYPTOGRAPHY': {
        keywords: [
          'cryptography', 'encryption', 'decryption', 'algorithm', 'cipher',
          'aes', 'rsa', 'hash', 'public key', 'private key', 'ssl', 'tls',
          'symmetric', 'asymmetric', 'key exchange', 'diffie-hellman'
        ],
        complexity: 9,
        visualizationType: 'encryption-flow-3d',
        icon: '🔐',
        description: 'Encryption algorithm visualization'
      },

      // Computer Science - Network Security
      'CS_NETWORK_SECURITY': {
        keywords: [
          'network', 'security', 'firewall', 'intrusion', 'packet',
          'routing', 'protocol', 'ip', 'tcp', 'udp', 'dns', 'http',
          'bandwidth', 'latency', 'throughput', 'topology'
        ],
        complexity: 8,
        visualizationType: 'network-topology-3d',
        icon: '🌐',
        description: 'Network architecture and data flow'
      },

      // Computer Science - Agile Methodology
      'CS_AGILE': {
        keywords: [
          'agile', 'scrum', 'sprint', 'backlog', 'velocity', 'kanban',
          'user story', 'burndown', 'standupmeeting', 'iteration',
          'retrospective', 'workflow', 'process', 'methodology'
        ],
        complexity: 6,
        visualizationType: 'agile-workflow-3d',
        icon: '📊',
        description: 'Agile project workflow visualization'
      },

      // Computer Science - Algorithms
      'CS_ALGORITHMS': {
        keywords: [
          'algorithm', 'sorting', 'search', 'tree', 'graph', 'dynamic',
          'recursion', 'fibonacci', 'merge', 'quicksort', 'bfs', 'dfs',
          'traversal', 'complexity', 'big o', 'optimization'
        ],
        complexity: 8,
        visualizationType: 'algorithm-execution-3d',
        icon: '⚙️',
        description: 'Algorithm execution and data structure'
      },

      // Computer Science - Machine Learning
      'CS_MACHINE_LEARNING': {
        keywords: [
          'machine learning', 'neural network', 'deep learning', 'training',
          'model', 'classification', 'regression', 'clustering', 'supervised',
          'unsupervised', 'activation', 'layer', 'optimization', 'gradient'
        ],
        complexity: 9,
        visualizationType: 'neural-network-3d',
        icon: '🧠',
        description: 'Neural network architecture visualization'
      },

      // Chemistry - Molecular Structure
      'CHEMISTRY_MOLECULAR': {
        keywords: [
          'molecule', 'atom', 'bond', 'chemical', 'element', 'valence',
          'orbital', 'electron', 'ionic', 'covalent', 'compound',
          'structure', 'symmetry', 'geometry'
        ],
        complexity: 7,
        visualizationType: 'molecular-structure-3d',
        icon: '⚛️',
        description: 'Molecular bonding and structure'
      },

      // Chemistry - Reactions
      'CHEMISTRY_REACTION': {
        keywords: [
          'reaction', 'catalyst', 'combustion', 'oxidation', 'reduction',
          'equilibrium', 'kinetics', 'thermodynamic', 'energy', 'rate',
          'activation', 'exothermic', 'endothermic', 'yield'
        ],
        complexity: 7,
        visualizationType: 'reaction-mechanism-3d',
        icon: '🔬',
        description: 'Chemical reaction mechanism'
      },

      // Physics - Mechanics
      'PHYSICS_MECHANICS': {
        keywords: [
          'mechanics', 'force', 'acceleration', 'velocity', 'motion',
          'newton', 'momentum', 'energy', 'work', 'power', 'friction',
          'spring', 'pendulum', 'collision', 'kinetic', 'potential'
        ],
        complexity: 7,
        visualizationType: 'physics-mechanics-3d',
        icon: '⚡',
        description: 'Mechanical motion and forces'
      },

      // Physics - Waves
      'PHYSICS_WAVES': {
        keywords: [
          'wave', 'frequency', 'wavelength', 'amplitude', 'oscillation',
          'sound', 'light', 'interference', 'diffraction', 'resonance',
          'propagation', 'speed', 'doppler', 'harmonic'
        ],
        complexity: 7,
        visualizationType: 'wave-simulation-3d',
        icon: '〰️',
        description: 'Wave propagation and interference'
      },

      // Physics - Electromagnetism
      'PHYSICS_ELECTROMAGNETISM': {
        keywords: [
          'electric', 'magnetic', 'field', 'charge', 'coulomb', 'gauss',
          'induction', 'flux', 'capacitor', 'inductor', 'faraday',
          'maxwell', 'electromagnetic', 'radiation'
        ],
        complexity: 8,
        visualizationType: 'electromagnetic-field-3d',
        icon: '⚛️',
        description: 'Electromagnetic field visualization'
      },

      // Biology - Cell Structure
      'BIOLOGY_CELL': {
        keywords: [
          'cell', 'nucleus', 'organelle', 'membrane', 'ribosome',
          'mitochondria', 'chloroplast', 'golgi', 'endoplasmic',
          'lysosome', 'vesicle', 'cytoplasm', 'chromosome'
        ],
        complexity: 6,
        visualizationType: 'cell-structure-3d',
        icon: '🧬',
        description: 'Cellular structure and organelles'
      },

      // Biology - DNA/Genetics
      'BIOLOGY_GENETICS': {
        keywords: [
          'dna', 'rna', 'gene', 'protein', 'codon', 'transcription',
          'translation', 'replication', 'mutation', 'inheritance',
          'chromosome', 'allele', 'phenotype', 'genotype'
        ],
        complexity: 8,
        visualizationType: 'dna-replication-3d',
        icon: '🧬',
        description: 'DNA replication and expression'
      },

      // Biology - Ecology
      'BIOLOGY_ECOLOGY': {
        keywords: [
          'ecology', 'ecosystem', 'predator', 'prey', 'food', 'chain',
          'energy', 'flow', 'nutrient', 'cycle', 'population',
          'biome', 'habitat', 'species', 'biodiversity'
        ],
        complexity: 6,
        visualizationType: 'ecosystem-network-3d',
        icon: '🌳',
        description: 'Ecosystem relationships and flows'
      },

      // Mathematics - Geometry
      'MATH_GEOMETRY': {
        keywords: [
          'geometry', 'shape', 'polygon', 'circle', 'sphere', 'angle',
          'triangle', 'square', 'coordinate', 'vector', 'transform',
          'rotation', 'scaling', 'translation', 'symmetry'
        ],
        complexity: 6,
        visualizationType: 'geometric-transformation-3d',
        icon: '📐',
        description: 'Geometric shapes and transformations'
      },

      // Mathematics - Calculus
      'MATH_CALCULUS': {
        keywords: [
          'calculus', 'derivative', 'integral', 'limit', 'function',
          'tangent', 'slope', 'area', 'volume', 'gradient', 'divergence',
          'curl', 'optimization', 'extrema', 'series'
        ],
        complexity: 8,
        visualizationType: 'calculus-visualization-3d',
        icon: '∫',
        description: 'Calculus functions and analysis'
      },

      // Mathematics - Linear Algebra
      'MATH_LINEAR_ALGEBRA': {
        keywords: [
          'matrix', 'vector', 'linear', 'algebra', 'transformation',
          'eigenvalue', 'eigenvector', 'determinant', 'inverse',
          'rank', 'span', 'basis', 'dimension', 'orthogonal'
        ],
        complexity: 8,
        visualizationType: 'matrix-transformation-3d',
        icon: '⊞',
        description: 'Linear transformations and matrices'
      },

      // Economics - Market Systems
      'ECON_MARKET': {
        keywords: [
          'market', 'supply', 'demand', 'price', 'equilibrium', 'elastic',
          'consumer', 'producer', 'surplus', 'shortage', 'competition',
          'monopoly', 'profit', 'revenue', 'cost'
        ],
        complexity: 6,
        visualizationType: 'economic-model-3d',
        icon: '💹',
        description: 'Market dynamics and equilibrium'
      },

      // Philosophy - Logic Systems
      'PHILOSOPHY_LOGIC': {
        keywords: [
          'logic', 'proposition', 'argument', 'inference', 'valid',
          'premise', 'conclusion', 'contradiction', 'tautology',
          'boolean', 'operator', 'truth', 'falsehood'
        ],
        complexity: 6,
        visualizationType: 'logic-gate-3d',
        icon: '🔀',
        description: 'Logical systems and operations'
      },

      // Engineering - Gear Systems
      'ENGINEERING_GEARS': {
        keywords: [
          'gear', 'transmission', 'tooth', 'interlocking', 'mechanical',
          'torque', 'power', 'ratio', 'speed', 'spur', 'bevel', 'helical',
          'planetary', 'efficiency', 'backlash', 'meshing'
        ],
        complexity: 9,
        visualizationType: 'gear-system-3d',
        icon: '⚙️',
        description: 'Gear transmission mechanisms'
      },

      // Engineering - Piston Systems
      'ENGINEERING_PISTON': {
        keywords: [
          'piston', 'crankshaft', 'connecting rod', 'engine', 'displacement',
          'stroke', 'bore', 'combustion', 'valve', 'timing', 'reciprocating',
          'mechanical advantage', 'motion conversion'
        ],
        complexity: 8,
        visualizationType: 'piston-mechanism-3d',
        icon: '🔧',
        description: 'Piston and crankshaft mechanisms'
      },

      // Engineering - Hydraulic Systems
      'ENGINEERING_HYDRAULIC': {
        keywords: [
          'hydraulic', 'pressure', 'cylinder', 'fluid', 'pump', 'valve',
          'pascal', 'force', 'area', 'flow', 'viscosity', 'actuator',
          'dynamics', 'energy transmission'
        ],
        complexity: 8,
        visualizationType: 'hydraulic-system-3d',
        icon: '💧',
        description: 'Hydraulic pressure and fluid systems'
      },

      // Engineering - Turbine Rotors
      'ENGINEERING_ROTOR': {
        keywords: [
          'rotor', 'blade', 'turbine', 'rotation', 'centrifugal', 'shaft',
          'rpm', 'power transmission', 'aerodynamics', 'efficiency',
          'momentum', 'angular velocity', 'gyroscopic'
        ],
        complexity: 9,
        visualizationType: 'rotor-system-3d',
        icon: '🌪️',
        description: 'Turbine rotor mechanics'
      },

      // Engineering - Bridge Structures
      'ENGINEERING_BRIDGE': {
        keywords: [
          'bridge', 'structure', 'suspension', 'cable', 'beam', 'span',
          'load', 'support', 'foundation', 'compression', 'tension',
          'truss', 'arch', 'engineering'
        ],
        complexity: 8,
        visualizationType: 'bridge-structure-3d',
        icon: '🌉',
        description: 'Bridge structural design and forces'
      },

      // Engineering - Building Design
      'ENGINEERING_BUILDING': {
        keywords: [
          'building', 'architecture', 'structure', 'column', 'beam',
          'floor', 'foundation', 'load bearing', 'construction', 'design',
          'materials', 'structural', 'civil', 'engineering'
        ],
        complexity: 7,
        visualizationType: 'building-structure-3d',
        icon: '🏢',
        description: 'Building structural design'
      }
    };
  }

  // Analyze concept across all domains
  analyzeConcept(topic, description, keywords = []) {
    const text = `${topic} ${description} ${keywords.join(' ')}`.toLowerCase();
    const words = text.split(/[\s,.\-()]+/);

    const scores = new Map();

    // Score each domain with increased weight
    for (const [domainKey, domain] of Object.entries(this.domains)) {
      let score = 0;
      
      domain.keywords.forEach(keyword => {
        const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = text.match(keywordRegex) || [];
        score += matches.length * 5; // Increased from 2 to 5 for better matching
      });

      if (score > 0) {
        scores.set(domainKey, score);
      }
    }

    // Return top match
    if (scores.size === 0) return this.getDefaultDomain();

    const topDomain = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])[0][0];

    const topScore = scores.get(topDomain);
    // Improved confidence: normalize to 0.0-1.0 based on score magnitude
    const confidence = Math.min(1.0, Math.pow(topScore / 10, 0.5)); // Non-linear scaling for better curve
    
    return {
      domain: topDomain,
      config: this.domains[topDomain],
      confidence: Math.max(0.5, confidence), // Minimum 50% confidence if any match found
      allMatches: Array.from(scores.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([d, s]) => ({ domain: d, score: s }))
    };
  }

  // Get visualization type
  getVisualizationType(domain) {
    if (this.domains[domain]) {
      return this.domains[domain].visualizationType;
    }
    return 'generic-3d';
  }

  // Get complexity level
  getComplexity(domain) {
    if (this.domains[domain]) {
      return this.domains[domain].complexity;
    }
    return 5;
  }

  // Get description
  getDescription(domain) {
    if (this.domains[domain]) {
      return this.domains[domain].description;
    }
    return 'Concept visualization';
  }

  // Get icon
  getIcon(domain) {
    if (this.domains[domain]) {
      return this.domains[domain].icon;
    }
    return '🔍';
  }

  // Get all domains
  getAllDomains() {
    return Object.entries(this.domains).map(([key, config]) => ({
      id: key,
      ...config
    }));
  }

  // Get default domain
  getDefaultDomain() {
    return {
      domain: 'GENERIC',
      config: {
        keywords: [],
        complexity: 5,
        visualizationType: 'generic-3d',
        icon: '📚',
        description: 'Concept visualization'
      },
      confidence: 0
    };
  }

  // Check if specialized visualization available
  hasSpecializedVisualization(domain) {
    return this.domains.hasOwnProperty(domain);
  }

  // Get keywords for domain
  getDomainKeywords(domain) {
    if (this.domains[domain]) {
      return this.domains[domain].keywords;
    }
    return [];
  }
}

export function createUniversalConceptAnalyzer() {
  return new UniversalConceptAnalyzer();
}
