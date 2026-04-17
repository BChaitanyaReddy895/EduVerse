// ============================================
// Engineering Concept Auto-Detector v1.0
// Identifies engineering/mechanical concepts
// ============================================

export class EngineeringConceptDetector {
  constructor() {
    this.engineeringKeywords = {
      // Mechanical Engineering
      'GEAR_SYSTEM': [
        'gear', 'gears', 'gearbox', 'transmission', 'mesh', 'teeth',
        'rotational', 'torque', 'differential', 'power transmission',
        'mechanical advantage', 'speed ratio'
      ],
      
      'PISTON': [
        'piston', 'crankshaft', 'cylinder', 'internal combustion', 'engine',
        'reciprocating', 'connecting rod', 'stroke', 'compression',
        'motor', 'combustion', 'valve'
      ],
      
      'HYDRAULIC': [
        'hydraulic', 'hydraulics', 'fluid power', 'pressure', 'cylinder',
        'pump', 'actuator', 'servo', 'fluid mechanics', 'pascal',
        'pressure distribution', 'fluid dynamics'
      ],
      
      'ROTOR': [
        'rotor', 'rotor blade', 'turbine', 'turbulent', 'rotation',
        'spin', 'centrifugal', 'blades', 'impeller', 'propeller',
        'axial', 'radial', 'aerodynamic'
      ],
      
      // Civil Engineering
      'BRIDGE': [
        'bridge', 'beam', 'truss', 'suspension', 'cable', 'span',
        'cantilever', 'arch', 'load', 'stress', 'structural',
        'support', 'foundation', 'pylon', 'girder'
      ],
      
      'BUILDING': [
        'building', 'structure', 'framework', 'construction', 'floor',
        'column', 'beam', 'steel', 'concrete', 'architecture',
        'load bearing', 'foundation', 'floor system', 'framework'
      ],
      
      // Electrical Engineering
      'MOTOR': [
        'motor', 'electric motor', 'electromagnetic', 'stator', 'rotor',
        'armature', 'commutator', 'brushes', 'induction', 'synchronous',
        'torque', 'rpm', 'horsepower'
      ],
      
      // Thermodynamics
      'HEAT_TRANSFER': [
        'heat transfer', 'conduction', 'convection', 'radiation',
        'temperature', 'thermal', 'thermodynamic', 'entropy',
        'efficiency', 'heat exchanger'
      ],
      
      // Fluid Mechanics
      'FLUID_DYNAMICS': [
        'fluid', 'flow', 'velocity', 'pressure', 'navier-stokes',
        'turbulence', 'laminar', 'reynolds', 'aerodynamic',
        'hydrodynamic', 'lift', 'drag', 'streamline'
      ],
      
      // Materials Science
      'MATERIAL_STRUCTURE': [
        'material', 'crystalline', 'grain', 'microstructure', 'alloy',
        'composite', 'polymer', 'stress-strain', 'young modulus',
        'tensile', 'fatigue', 'fracture'
      ]
    };

    this.complexityScores = {
      'GEAR_SYSTEM': 8,
      'PISTON': 9,
      'HYDRAULIC': 8,
      'ROTOR': 7,
      'BRIDGE': 9,
      'BUILDING': 8,
      'MOTOR': 8,
      'HEAT_TRANSFER': 7,
      'FLUID_DYNAMICS': 9,
      'MATERIAL_STRUCTURE': 8
    };
  }

  // Detect engineering concept type
  detectEngineeringType(topic, description) {
    const text = `${topic} ${description}`.toLowerCase();
    const words = text.split(/[\s,.\-()]+/);

    const scores = new Map();

    // Score each engineering type
    for (const [type, keywords] of Object.entries(this.engineeringKeywords)) {
      let score = 0;
      
      keywords.forEach(keyword => {
        const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = text.match(keywordRegex) || [];
        score += matches.length * 2;
      });

      if (score > 0) {
        scores.set(type, score);
      }
    }

    // Return highest scoring type or null
    if (scores.size === 0) return null;

    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])[0][0];
  }

  // Check if concept is engineering-grade
  isEngineeringConcept(topic, description) {
    const type = this.detectEngineeringType(topic, description);
    return type !== null;
  }

  // Get visualization type for concept
  getVisualizationType(topic, description) {
    return this.detectEngineeringType(topic, description);
  }

  // Get complexity level
  getComplexityLevel(type) {
    return this.complexityScores[type] || 5;
  }

  // Get description of engineering type
  getTypeDescription(type) {
    const descriptions = {
      'GEAR_SYSTEM': 'Mechanical transmission system with interlocking gears',
      'PISTON': 'Reciprocating piston engine mechanism',
      'HYDRAULIC': 'Fluid pressure-based power transmission system',
      'ROTOR': 'Rotating turbine or rotor blade system',
      'BRIDGE': 'Structural bridge framework with load distribution',
      'BUILDING': 'Multi-level building structure and framework',
      'MOTOR': 'Electromagnetic rotating motor',
      'HEAT_TRANSFER': 'Heat transfer mechanisms and thermodynamics',
      'FLUID_DYNAMICS': 'Fluid flow and aerodynamic simulation',
      'MATERIAL_STRUCTURE': 'Microscopic material structure visualization'
    };

    return descriptions[type] || 'Engineering visualization';
  }

  // Get recommended quality settings for type
  getQualityRecommendation(type) {
    return {
      'GEAR_SYSTEM': {
        renderScale: 1.0,
        shadowQuality: 'high',
        reflections: true,
        particleCount: 500
      },
      'PISTON': {
        renderScale: 1.1,
        shadowQuality: 'high',
        reflections: true,
        particleCount: 600
      },
      'HYDRAULIC': {
        renderScale: 1.0,
        shadowQuality: 'medium',
        reflections: true,
        particleCount: 400
      },
      'ROTOR': {
        renderScale: 1.1,
        shadowQuality: 'high',
        reflections: true,
        particleCount: 800
      },
      'BRIDGE': {
        renderScale: 0.9,
        shadowQuality: 'high',
        reflections: false,
        particleCount: 200
      },
      'BUILDING': {
        renderScale: 1.0,
        shadowQuality: 'high',
        reflections: false,
        particleCount: 300
      }
    }[type] || {
      renderScale: 1.0,
      shadowQuality: 'medium',
      reflections: false,
      particleCount: 400
    };
  }

  // Get recommended camera angle
  getRecommendedCameraAngle(type) {
    const angles = {
      'GEAR_SYSTEM': { x: 0.4, y: 0.8, z: 0.8, distance: 15 },
      'PISTON': { x: 0.3, y: 1.2, z: 0.6, distance: 12 },
      'HYDRAULIC': { x: 0.2, y: 0.6, z: 0.9, distance: 14 },
      'ROTOR': { x: 0.5, y: 1.0, z: 0.7, distance: 13 },
      'BRIDGE': { x: 0.1, y: 0.4, z: 1.0, distance: 20 },
      'BUILDING': { x: 0.3, y: 0.7, z: 0.9, distance: 18 }
    };

    return angles[type] || { x: 0.4, y: 0.8, z: 0.7, distance: 15 };
  }

  // Generate engineering-specific keywords
  getEngineeringKeywords(type) {
    const keywordMap = {
      'GEAR_SYSTEM': [
        'Gear Ratio', 'Torque Transfer', 'Mechanical Advantage',
        'Power Transmission', 'Teeth Engagement', 'Speed Reduction'
      ],
      'PISTON': [
        'Stroke Volume', 'Compression Ratio', 'Internal Combustion',
        'Reciprocating Motion', 'Crankshaft Rotation', 'Power Cycle'
      ],
      'HYDRAULIC': [
        'Fluid Pressure', 'Hydraulic Power', 'Force Multiplication',
        'Valve Control', 'Actuator Motion', 'Fluid Flow Rate'
      ],
      'ROTOR': [
        'Rotational Speed', 'Centrifugal Force', 'Blade Efficiency',
        'Aerodynamic Lift', 'Torque Output', 'Angular Velocity'
      ],
      'BRIDGE': [
        'Load Distribution', 'Structural Support', 'Tension Forces',
        'Compression Forces', 'Span Length', 'Safety Factor'
      ],
      'BUILDING': [
        'Structural Frame', 'Load Bearing', 'Floor Systems',
        'Column Support', 'Foundation Design', 'Lateral Forces'
      ]
    };

    return keywordMap[type] || [];
  }

  // Get animation description
  getAnimationDescription(type) {
    const descriptions = {
      'GEAR_SYSTEM': 'Watch the gears mesh and transfer rotational power with proper speed ratios',
      'PISTON': 'See the crankshaft rotate the connecting rod, moving the piston in and out',
      'HYDRAULIC': 'Observe hydraulic pressure extending and retracting the cylinder',
      'ROTOR': 'The rotor spins, demonstrating centrifugal and aerodynamic forces',
      'BRIDGE': 'View the structural framework distributing loads from top to supports',
      'BUILDING': 'See the building structure with columns supporting multiple floors'
    };

    return descriptions[type] || 'Observe the mechanical system in motion';
  }

  // Get technical specifications
  getTechnicalSpecs(type) {
    const specs = {
      'GEAR_SYSTEM': {
        'Number of Gears': '3',
        'Gear Ratio': '1:1.33:2',
        'Material': 'Steel (high-carbon)',
        'Surface Finish': 'Ground and hardened',
        'Application': 'Power transmission and speed control'
      },
      'PISTON': {
        'Cylinder Count': '1',
        'Stroke Type': 'Double-acting reciprocating',
        'Bore Diameter': '80mm',
        'Displacement': 'Multi-cycle',
        'Compression Ratio': 'Variable'
      },
      'HYDRAULIC': {
        'Pressure Rating': '210 bar (3000 psi)',
        'Bore Size': '40mm',
        'Stroke Length': '600mm',
        'Flow Rate': '60 L/min',
        'Mounting': 'Standard ISO'
      },
      'ROTOR': {
        'Blade Count': '4',
        'Rotor Diameter': '4.4m',
        'Rotational Speed': '1800 RPM',
        'Material': 'Composite/Steel',
        'Power Output': 'Mechanical/Electrical'
      },
      'BRIDGE': {
        'Main Span': '800m',
        'Total Length': '2000m',
        'Width': '35m',
        'Material': 'Steel + Concrete',
        'Load Capacity': '10,000 vehicles/day'
      },
      'BUILDING': {
        'Number of Floors': '3',
        'Floor Area': '2,500 m²',
        'Height': '12m per floor',
        'Material': 'Steel frame + Concrete',
        'Design Standard': 'IBC 2021'
      }
    };

    return specs[type] || {};
  }
}

export function createEngineeringConceptDetector() {
  return new EngineeringConceptDetector();
}
