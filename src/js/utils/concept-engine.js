// ============================================
// Concept Engine v1.0
// Fetches real educational content from Wikipedia
// and structures it for visualization
// ============================================

const CACHE = {};
const API_TIMEOUT = 5000;

// Wikipedia API endpoint
const WIKI_API = 'https://en.wikipedia.org/w/api.php';

export async function fetchConceptContent(topic) {
  if (CACHE[topic]) return CACHE[topic];
  
  try {
    console.log(`📚 Fetching concept: ${topic}`);
    
    // Simplify topic name for better Wikipedia matching
    let searchTopic = simplifyTopicName(topic);
    console.log(`🔍 Searching Wikipedia for: "${searchTopic}"`);
    
    const response = await fetch(`${WIKI_API}?action=query&titles=${encodeURIComponent(searchTopic)}&prop=extracts&exintro=true&explaintext=true&format=json&origin=*`, {
      signal: AbortSignal.timeout(API_TIMEOUT)
    });
    
    const data = await response.json();
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    const extract = pages[pageId].extract || '';
    
    if (!extract) throw new Error('No content found');
    
    const concepts = parseConceptContent(extract, topic);
    CACHE[topic] = concepts;
    
    console.log(`✅ Fetched ${concepts.length} concepts for ${topic}`);
    return concepts;
  } catch (error) {
    console.error(`❌ Failed to fetch ${topic}:`, error);
    return generateFallbackConcepts(topic);
  }
}

function simplifyTopicName(topic) {
  // Extract core concept from verbose titles
  // "Gear transmission mechanism with interlocking gears" → "Gear"
  // "Definition of Motion" → "Motion"
  
  const simplifications = {
    'definition': '', // Remove "Definition of"
    'mechanism': '',
    'with': ' ',
    'interlocking': '',
    'system': ''
  };
  
  let simplified = topic.toLowerCase();
  
  // First try: extract single important word
  const importantWords = ['gear', 'piston', 'hydraulic', 'rotor', 'bridge', 'building',
    'database', 'network', 'encryption', 'algorithm', 'neural', 'cell', 'dna',
    'wave', 'motion', 'force', 'energy', 'atom', 'molecule', 'reaction'];
  
  for (const word of importantWords) {
    if (simplified.includes(word)) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
  }
  
  // Second try: extract first meaningful word (not "a", "the", "of", etc)
  const words = topic.split(/[\s\-,]+/).filter(w => w.length > 3);
  if (words.length > 0) {
    return words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase();
  }
  
  return topic;
}

function parseConceptContent(text, topic) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const concepts = [];
  
  // Split into key concept sections
  for (let i = 0; i < Math.min(sentences.length, 8); i++) {
    const sentence = sentences[i].trim();
    if (sentence.length > 30) {
      const title = extractConceptTitle(sentence, topic);
      concepts.push({
        id: `concept_${i}`,
        title: title,
        description: sentence,
        keywords: extractKeywords(sentence),
        order: i,
        visualType: determineVisualizationType(sentence, topic)
      });
    }
  }
  
  return concepts;
}

function extractConceptTitle(sentence, topic) {
  const words = sentence.split(' ');
  const titleWords = words.slice(0, Math.min(4, words.length));
  return titleWords.join(' ').replace(/[^a-zA-Z\s]/g, '');
}

function extractKeywords(text) {
  const words = text.toLowerCase().split(/\s+/);
  const stopWords = new Set(['the', 'is', 'a', 'an', 'and', 'or', 'of', 'in', 'to', 'for', 'from', 'by', 'on', 'at', 'with']);
  return words
    .filter(w => w.length > 4 && !stopWords.has(w))
    .map(w => w.replace(/[^a-z]/g, ''))
    .slice(0, 5);
}

function determineVisualizationType(sentence, topic) {
  const lowerSentence = sentence.toLowerCase();
  const lowerTopic = topic.toLowerCase();
  
  if (lowerSentence.includes('structure') || lowerSentence.includes('atom') || lowerSentence.includes('molecule')) 
    return 'MOLECULE';
  if (lowerSentence.includes('orbit') || lowerSentence.includes('circular') || lowerSentence.includes('rotation'))
    return 'ORBIT';
  if (lowerSentence.includes('motion') || lowerSentence.includes('move') || lowerSentence.includes('force'))
    return 'MOTION';
  if (lowerSentence.includes('energy') || lowerSentence.includes('process') || lowerSentence.includes('flow'))
    return 'PROCESS';
  if (lowerTopic.includes('cell') || lowerSentence.includes('cell'))
    return 'CELL';
  if (lowerTopic.includes('dna') || lowerSentence.includes('dna') || lowerSentence.includes('helix'))
    return 'HELIX';
  
  return 'NODE';
}

function generateFallbackConcepts(topic) {
  const fallbacks = {
    'motion': [
      { id: 'c1', title: 'Definition of Motion', description: 'Motion is the change of position over time', visualType: 'MOTION', keywords: ['change', 'position', 'time'], order: 0 },
      { id: 'c2', title: 'Velocity', description: 'Velocity is the rate of change of position', visualType: 'MOTION', keywords: ['velocity', 'rate', 'change'], order: 1 }
    ],
    'forces': [
      { id: 'c1', title: 'Newtons First Law', description: 'An object at rest stays at rest unless acted upon by force', visualType: 'MOTION', keywords: ['force', 'acceleration'], order: 0 },
      { id: 'c2', title: 'Force and Acceleration', description: 'Force equals mass times acceleration', visualType: 'MOTION', keywords: ['force', 'mass'], order: 1 }
    ],
    'atom': [
      { id: 'c1', title: 'Atomic Structure', description: 'Atoms consist of a nucleus surrounded by electrons', visualType: 'MOLECULE', keywords: ['nucleus', 'electrons'], order: 0 },
      { id: 'c2', title: 'Electron Shells', description: 'Electrons occupy shells at different energy levels', visualType: 'MOLECULE', keywords: ['electron', 'shell'], order: 1 }
    ]
  };
  
  return fallbacks[topic.toLowerCase()] || fallbacks['motion'];
}

export function createConceptFlow(concepts) {
  return {
    concepts: concepts,
    nodes: concepts.map(c => ({
      id: c.id,
      label: c.title,
      description: c.description,
      connections: []
    })),
    flow: generateConceptFlow(concepts),
    timeline: createTimeline(concepts)
  };
}

function generateConceptFlow(concepts) {
  const flow = [];
  for (let i = 0; i < concepts.length - 1; i++) {
    flow.push({
      from: concepts[i].id,
      to: concepts[i + 1].id,
      relationship: 'leads to'
    });
  }
  return flow;
}

function createTimeline(concepts) {
  return concepts.map((c, i) => ({
    step: i + 1,
    concept: c.title,
    duration: 3 + (i * 0.5),
    visualType: c.visualType
  }));
}

export function getVisualizationConfig(concept) {
  const configs = {
    MOLECULE: {
      type: 'molecule',
      scale: 1.5,
      rotation: true,
      particles: extractParticleCount(concept.description),
      colors: ['#3B82F6', '#EF4444', '#10B981']
    },
    ORBIT: {
      type: 'orbit',
      scale: 1.2,
      rotation: true,
      orbits: extractOrbits(concept.description),
      colors: ['#FCD34D', '#3B82F6', '#EF4444']
    },
    MOTION: {
      type: 'motion',
      scale: 1.0,
      animation: true,
      vectors: true,
      colors: ['#3B82F6', '#EF4444']
    },
    PROCESS: {
      type: 'flow',
      scale: 1.0,
      steps: 5,
      colors: ['#06B6D4', '#10B981', '#F59E0B']
    },
    CELL: {
      type: 'cell',
      scale: 2.0,
      organelles: extractOrganelles(concept.description),
      colors: ['#F1A208', '#8B5CF6', '#10B981', '#EF4444']
    },
    HELIX: {
      type: 'helix',
      scale: 1.5,
      turns: 6,
      colors: ['#3B82F6', '#EF4444']
    },
    NODE: {
      type: 'node',
      scale: 1.0,
      size: 1.0,
      colors: ['#6366F1']
    }
  };
  
  return configs[concept.visualType] || configs.NODE;
}

function extractParticleCount(description) {
  const matches = description.match(/\d+/g);
  return matches ? Math.min(parseInt(matches[0]), 8) : 3;
}

function extractOrbits(description) {
  const matches = description.match(/\d+/g);
  return matches ? Math.min(parseInt(matches[0]), 4) : 2;
}

function extractOrganelles(description) {
  const organelles = ['mitochondria', 'ribosome', 'nucleus', 'vacuole', 'golgi'];
  return organelles.filter(o => description.toLowerCase().includes(o));
}

export function generateVisualizationScript(concept, config) {
  return {
    concept: concept.title,
    config: config,
    animationDuration: 3,
    steps: concept.keywords.map((kw, i) => ({
      order: i,
      highlight: kw,
      duration: 0.6
    })),
    narrative: `
      ${concept.title}: ${concept.description}
      Key concepts: ${concept.keywords.join(', ')}
    `.trim()
  };
}
