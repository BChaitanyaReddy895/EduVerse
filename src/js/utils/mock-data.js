// ============================================
// EduVerse — Mock Data Generator
// Realistic demo data for all platform modules
// ============================================

export const studentProfile = {
  name: 'Arjun Mehta',
  university: 'IIT Hyderabad',
  semester: 5,
  branch: 'Computer Science',
  background: {
    schoolType: 'government',
    medium: 'regional',
    parentEducation: 'high_school',
    internetAccess: 'moderate',
    urbanRural: 'semi_urban',
    familyIncome: 'middle'
  }
};

export const subjects = [
  {
    id: 'physics',
    name: 'Physics',
    icon: '⚛️',
    color: '#7C3AED',
    description: 'Explore forces, optics, thermodynamics and quantum mechanics through interactive 3D models',
    topics: 12,
    models: 8,
    difficulty: 'Intermediate',
    lessons: [
      { id: 'newton', name: 'Newton\'s Laws', type: '3D', mastery: 72 },
      { id: 'optics', name: 'Ray Optics', type: 'AR', mastery: 45 },
      { id: 'waves', name: 'Wave Motion', type: '3D', mastery: 60 },
      { id: 'thermo', name: 'Thermodynamics', type: '3D', mastery: 30 }
    ]
  },
  {
    id: 'history',
    name: 'History',
    icon: '🏛️',
    color: '#F59E0B',
    description: 'Walk through ancient civilizations and historical events with immersive 3D timeline reconstructions',
    topics: 15,
    models: 10,
    difficulty: 'Beginner',
    lessons: [
      { id: 'indus', name: 'Indus Valley', type: 'AR', mastery: 88 },
      { id: 'mughal', name: 'Mughal Architecture', type: '3D', mastery: 55 },
      { id: 'renaissance', name: 'Renaissance Art', type: '3D', mastery: 40 },
      { id: 'revolution', name: 'Industrial Revolution', type: '3D', mastery: 65 }
    ]
  },
  {
    id: 'engineering',
    name: 'Engineering',
    icon: '⚙️',
    color: '#06B6D4',
    description: 'Understand mechanical systems, circuits, and structural engineering through hands-on AR experiments',
    topics: 10,
    models: 12,
    difficulty: 'Advanced',
    lessons: [
      { id: 'gears', name: 'Gear Mechanisms', type: 'AR', mastery: 38 },
      { id: 'bridges', name: 'Bridge Structures', type: '3D', mastery: 72 },
      { id: 'circuits', name: 'Circuit Design', type: '3D', mastery: 50 },
      { id: 'fluid', name: 'Fluid Dynamics', type: '3D', mastery: 25 }
    ]
  },
  {
    id: 'biology',
    name: 'Biology',
    icon: '🧬',
    color: '#10B981',
    description: 'Dive into cell structures, DNA replication, and human anatomy with molecular-level AR visualizations',
    topics: 14,
    models: 9,
    difficulty: 'Intermediate',
    lessons: [
      { id: 'cell', name: 'Cell Structure', type: 'AR', mastery: 78 },
      { id: 'dna', name: 'DNA Replication', type: '3D', mastery: 62 },
      { id: 'anatomy', name: 'Human Anatomy', type: 'AR', mastery: 45 },
      { id: 'eco', name: 'Ecosystems', type: '3D', mastery: 70 }
    ]
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    icon: '🧪',
    color: '#EF4444',
    description: 'Visualize molecular bonds, chemical reactions, and periodic trends in augmented 3D space',
    topics: 11,
    models: 7,
    difficulty: 'Intermediate',
    lessons: [
      { id: 'bonds', name: 'Chemical Bonds', type: 'AR', mastery: 55 },
      { id: 'reactions', name: 'Reaction Kinetics', type: '3D', mastery: 42 },
      { id: 'organic', name: 'Organic Chemistry', type: '3D', mastery: 33 },
      { id: 'periodic', name: 'Periodic Table', type: '3D', mastery: 80 }
    ]
  },
  {
    id: 'math',
    name: 'Mathematics',
    icon: '📐',
    color: '#3B82F6',
    description: 'Grasp calculus, linear algebra, and geometry through spatial 3D graph visualizations',
    topics: 13,
    models: 6,
    difficulty: 'Advanced',
    lessons: [
      { id: 'calculus', name: 'Calculus 3D', type: '3D', mastery: 48 },
      { id: 'linalg', name: 'Linear Algebra', type: '3D', mastery: 65 },
      { id: 'geometry', name: 'Solid Geometry', type: 'AR', mastery: 58 },
      { id: 'probability', name: 'Probability', type: '3D', mastery: 72 }
    ]
  }
];

export const knowledgeGraphData = {
  nodes: [
    { id: 'algebra', label: 'Algebra', mastery: 0.75, domain: 'math', x: 200, y: 150 },
    { id: 'calculus', label: 'Calculus', mastery: 0.48, domain: 'math', x: 350, y: 100 },
    { id: 'linalg', label: 'Linear Algebra', mastery: 0.65, domain: 'math', x: 300, y: 250 },
    { id: 'physics_mech', label: 'Mechanics', mastery: 0.72, domain: 'physics', x: 500, y: 150 },
    { id: 'physics_em', label: 'Electromagnetics', mastery: 0.35, domain: 'physics', x: 600, y: 250 },
    { id: 'optics', label: 'Optics', mastery: 0.45, domain: 'physics', x: 550, y: 350 },
    { id: 'programming', label: 'Programming', mastery: 0.82, domain: 'cs', x: 150, y: 350 },
    { id: 'algorithms', label: 'Algorithms', mastery: 0.58, domain: 'cs', x: 250, y: 450 },
    { id: 'datastructs', label: 'Data Structures', mastery: 0.70, domain: 'cs', x: 400, y: 400 },
    { id: 'stats', label: 'Statistics', mastery: 0.55, domain: 'math', x: 450, y: 300 },
    { id: 'ml', label: 'Machine Learning', mastery: 0.30, domain: 'cs', x: 350, y: 350 },
    { id: 'communication', label: 'Communication', mastery: 0.40, domain: 'soft', x: 100, y: 250 },
    { id: 'teamwork', label: 'Teamwork', mastery: 0.60, domain: 'soft', x: 50, y: 350 },
    { id: 'critical_think', label: 'Critical Thinking', mastery: 0.55, domain: 'soft', x: 100, y: 450 }
  ],
  edges: [
    { from: 'algebra', to: 'calculus', weight: 0.9, type: 'prerequisite' },
    { from: 'algebra', to: 'linalg', weight: 0.8, type: 'prerequisite' },
    { from: 'calculus', to: 'physics_mech', weight: 0.7, type: 'prerequisite' },
    { from: 'linalg', to: 'physics_em', weight: 0.6, type: 'prerequisite' },
    { from: 'physics_mech', to: 'optics', weight: 0.5, type: 'prerequisite' },
    { from: 'calculus', to: 'stats', weight: 0.4, type: 'transfer' },
    { from: 'programming', to: 'algorithms', weight: 0.85, type: 'prerequisite' },
    { from: 'programming', to: 'datastructs', weight: 0.8, type: 'prerequisite' },
    { from: 'algorithms', to: 'ml', weight: 0.6, type: 'prerequisite' },
    { from: 'stats', to: 'ml', weight: 0.7, type: 'prerequisite' },
    { from: 'linalg', to: 'ml', weight: 0.65, type: 'prerequisite' },
    { from: 'communication', to: 'teamwork', weight: 0.5, type: 'transfer' },
    { from: 'critical_think', to: 'algorithms', weight: 0.3, type: 'transfer' },
    { from: 'communication', to: 'critical_think', weight: 0.4, type: 'transfer' }
  ]
};

export const barterUsers = [
  {
    id: 'u1', name: 'Priya Sharma', avatar: 'PS',
    offering: 'Python Programming', offeringLevel: 'Advanced',
    seeking: 'UI/UX Design', seekingLevel: 'Beginner',
    rating: 4.8, exchanges: 12, tags: ['Backend', 'Data Science', 'ML'],
    color: '#7C3AED'
  },
  {
    id: 'u2', name: 'Rahul Verma', avatar: 'RV',
    offering: 'UI/UX Design', offeringLevel: 'Intermediate',
    seeking: 'Machine Learning', seekingLevel: 'Beginner',
    rating: 4.5, exchanges: 8, tags: ['Figma', 'Prototyping', 'CSS'],
    color: '#06B6D4'
  },
  {
    id: 'u3', name: 'Sneha Patel', avatar: 'SP',
    offering: 'Machine Learning', offeringLevel: 'Intermediate',
    seeking: 'Public Speaking', seekingLevel: 'Beginner',
    rating: 4.7, exchanges: 6, tags: ['TensorFlow', 'NLP', 'Statistics'],
    color: '#10B981'
  },
  {
    id: 'u4', name: 'Aditya Kumar', avatar: 'AK',
    offering: 'Public Speaking', offeringLevel: 'Advanced',
    seeking: 'Web Development', seekingLevel: 'Intermediate',
    rating: 4.9, exchanges: 15, tags: ['Debate', 'Anchoring', 'Content'],
    color: '#F59E0B'
  },
  {
    id: 'u5', name: 'Meera Nair', avatar: 'MN',
    offering: 'Photography', offeringLevel: 'Advanced',
    seeking: 'Python Programming', seekingLevel: 'Beginner',
    rating: 4.6, exchanges: 10, tags: ['Portrait', 'Landscape', 'Editing'],
    color: '#EF4444'
  },
  {
    id: 'u6', name: 'Karthik Reddy', avatar: 'KR',
    offering: 'Web Development', offeringLevel: 'Advanced',
    seeking: 'Photography', seekingLevel: 'Intermediate',
    rating: 4.4, exchanges: 9, tags: ['React', 'Node.js', 'CSS'],
    color: '#3B82F6'
  }
];

export const barterCycles = [
  {
    id: 'c1',
    users: ['u1', 'u2', 'u3'],
    skills: ['Python → UI/UX → ML → Python'],
    score: 92
  },
  {
    id: 'c2',
    users: ['u4', 'u6', 'u5', 'u1'],
    skills: ['Speaking → WebDev → Photo → Python → Speaking'],
    score: 78
  }
];

export const analyticsData = {
  overallScore: 72,
  rank: 'Top 18%',
  streakDays: 14,
  totalHours: 156,
  skills: {
    technical: { score: 78, cohortAvg: 65, percentile: 82 },
    analytical: { score: 70, cohortAvg: 68, percentile: 55 },
    communication: { score: 45, cohortAvg: 62, percentile: 28 },
    leadership: { score: 55, cohortAvg: 50, percentile: 62 },
    creativity: { score: 65, cohortAvg: 58, percentile: 70 },
    adaptability: { score: 60, cohortAvg: 55, percentile: 58 }
  },
  weeklyActivity: [3, 5, 4, 7, 2, 6, 4, 5, 8, 3, 6, 7, 4, 5, 6, 8, 7, 3, 5, 4, 6, 7, 5, 8, 4, 3, 6, 7],
  growthData: {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
    technical: [55, 58, 62, 65, 68, 72, 75, 78],
    communication: [30, 32, 33, 35, 38, 40, 42, 45],
    overall: [48, 50, 53, 56, 60, 63, 66, 72]
  },
  roadmap: [
    { title: 'Complete Python Basics', desc: 'Finish all introductory Python exercises', date: 'Completed', completed: true },
    { title: 'Data Structures Mastery', desc: 'Practice trees, graphs, and hash tables', date: 'Completed', completed: true },
    { title: 'Communication Workshop', desc: 'Join weekly presentation practice sessions', date: 'In Progress', completed: false },
    { title: 'ML Fundamentals', desc: 'Complete supervised learning module', date: 'Week 9-10', completed: false },
    { title: 'Capstone Project', desc: 'Apply learned skills in a team research project', date: 'Week 11-14', completed: false }
  ]
};

export const communicationData = {
  lciScore: 62,
  speechPatterns: { score: 58, label: 'Speech Clarity' },
  vocabularyDiversity: { score: 71, label: 'Vocabulary' },
  structuralCoherence: { score: 55, label: 'Coherence' },
  sessions: [
    { date: 'Apr 8', lci: 48 },
    { date: 'Apr 9', lci: 52 },
    { date: 'Apr 10', lci: 50 },
    { date: 'Apr 11', lci: 56 },
    { date: 'Apr 12', lci: 58 },
    { date: 'Apr 13', lci: 60 },
    { date: 'Apr 14', lci: 62 }
  ],
  scenarios: [
    {
      id: 'presentation',
      name: 'Presentation',
      icon: '🎤',
      desc: 'Practice delivering a 3-minute research pitch with real-time feedback'
    },
    {
      id: 'interview',
      name: 'Interview',
      icon: '💼',
      desc: 'Simulate technical and HR interview scenarios with AI evaluation'
    },
    {
      id: 'discussion',
      name: 'Group Discussion',
      icon: '👥',
      desc: 'Practice structured argumentation and consensus-building skills'
    },
    {
      id: 'elevator',
      name: 'Elevator Pitch',
      icon: '🚀',
      desc: 'Craft and deliver a 60-second pitch about your project or idea'
    },
    {
      id: 'debate',
      name: 'Debate',
      icon: '⚖️',
      desc: 'Develop persuasive arguments on assigned topics with counterpoints'
    },
    {
      id: 'storytelling',
      name: 'Storytelling',
      icon: '📖',
      desc: 'Structure and deliver compelling narratives for team communication'
    }
  ],
  feedback: [
    { type: 'positive', text: 'Good use of transitional phrases between ideas.' },
    { type: 'suggestion', text: 'Try varying sentence length for better rhythm and engagement.' },
    { type: 'negative', text: 'Frequent filler words detected ("um", "like"). Practice pausing instead.' },
    { type: 'positive', text: 'Strong opening hook — captures attention immediately.' },
    { type: 'suggestion', text: 'Use more domain-specific vocabulary to demonstrate expertise.' }
  ]
};

export const aiChatHistory = [
  {
    role: 'ai',
    message: 'Hello Arjun! 👋 I\'ve analyzed your knowledge graph using the MDKGT algorithm. I notice your **communication skills** (mastery: 40%) and **ML foundations** (mastery: 30%) have the highest growth potential. Would you like personalized recommendations?'
  },
  {
    role: 'user',
    message: 'Yes, I want to improve my ML skills. What should I focus on first?'
  },
  {
    role: 'ai',
    message: 'Great choice! Based on your knowledge graph, I recommend this **optimized learning path**:\n\n1. **Statistics** (55% → target 75%) — foundation for ML\n2. **Linear Algebra** (65% → target 80%) — matrix operations for models\n3. **ML Fundamentals** (30% → target 60%) — supervised learning first\n\nYour *cross-domain transfer score* from Programming (82%) gives you a strong advantage. Shall I create a 4-week study plan?'
  }
];
