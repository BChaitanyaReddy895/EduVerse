// ============================================
// Concept Graph Visualization v1.0
// Shows concept relationships and dependencies
// ============================================

import * as THREE from 'three';

export class ConceptGraphRenderer {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a1929);
    
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 8;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    this.camera = camera;
    this.renderer = renderer;
    this.nodes = [];
    this.links = [];
    this.simulation = null;
    
    this.setupLighting();
    this.setupControls();
    
    console.log('🔗 Concept Graph Renderer initialized');
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    const pointLight1 = new THREE.PointLight(0x3B82F6, 1, 100);
    pointLight1.position.set(10, 10, 10);
    this.scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0x8B5CF6, 0.8, 100);
    pointLight2.position.set(-10, -10, 10);
    this.scene.add(pointLight2);
  }

  setupControls() {
    this.isDragging = false;
    this.draggedNode = null;
    
    this.container.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.container.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.container.addEventListener('mouseup', (e) => this.onMouseUp(e));
  }

  async buildConceptGraph(concepts) {
    console.log(`🔗 Building concept graph with ${concepts.length} concepts`);
    
    // Clear existing
    this.nodes.forEach(node => this.scene.remove(node.mesh));
    this.links.forEach(link => this.scene.remove(link.line));
    this.nodes = [];
    this.links = [];
    
    // Create graph structure using force-directed layout
    const nodeData = concepts.map((concept, i) => ({
      id: i,
      concept,
      x: Math.random() * 10 - 5,
      y: Math.random() * 10 - 5,
      z: Math.random() * 2 - 1,
      vx: 0,
      vy: 0,
      vz: 0
    }));
    
    // Detect relationships between concepts
    const relationships = this.detectRelationships(concepts);
    
    // Create link visualization
    relationships.forEach(rel => {
      const source = nodeData[rel.source];
      const target = nodeData[rel.target];
      
      const lineMaterial = new THREE.LineBasicMaterial({
        color: this.getRelationshipColor(rel.type),
        linewidth: 2,
        fog: false
      });
      
      const lineGeometry = new THREE.BufferGeometry();
      const positions = [
        source.x, source.y, source.z,
        target.x, target.y, target.z
      ];
      lineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
      
      const line = new THREE.Line(lineGeometry, lineMaterial);
      this.scene.add(line);
      
      this.links.push({
        source,
        target,
        line,
        type: rel.type,
        strength: rel.strength
      });
    });
    
    // Create node visualization
    nodeData.forEach((node, i) => {
      const geometry = new THREE.IcosahedronGeometry(0.3, 3);
      const material = new THREE.MeshPhongMaterial({
        color: this.getConceptColor(node.concept),
        emissive: 0x1a1a2e,
        shininess: 100
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(node.x, node.y, node.z);
      
      this.scene.add(mesh);
      
      this.nodes.push({
        id: i,
        mesh,
        data: node,
        concept: node.concept
      });
    });
    
    this.startSimulation();
    this.animate();
  }

  detectRelationships(concepts) {
    const relationships = [];
    const keywords = concepts.map(c => c.keywords || []);
    
    for (let i = 0; i < concepts.length; i++) {
      for (let j = i + 1; j < concepts.length; j++) {
        // Find common keywords
        const common = keywords[i].filter(k => keywords[j].includes(k));
        
        if (common.length > 0) {
          relationships.push({
            source: i,
            target: j,
            type: 'similar',
            strength: Math.min(common.length / 3, 1)
          });
        }
        
        // Check sequential relationships
        const title_i = concepts[i].title.toLowerCase();
        const title_j = concepts[j].title.toLowerCase();
        
        if (this.isSequential(title_i, title_j)) {
          relationships.push({
            source: i,
            target: j,
            type: 'prerequisite',
            strength: 0.8
          });
        }
      }
    }
    
    return relationships;
  }

  isSequential(title1, title2) {
    const sequences = [
      ['atom', 'molecule'],
      ['cell', 'organelle'],
      ['dna', 'gene', 'protein'],
      ['force', 'motion', 'energy'],
      ['electron', 'atom', 'element'],
      ['photon', 'light', 'energy']
    ];
    
    for (const seq of sequences) {
      const idx1 = seq.indexOf(title1);
      const idx2 = seq.indexOf(title2);
      if (idx1 !== -1 && idx2 !== -1 && Math.abs(idx1 - idx2) === 1) {
        return true;
      }
    }
    
    return false;
  }

  getRelationshipColor(type) {
    const colors = {
      'similar': 0x3B82F6,     // Blue
      'prerequisite': 0x10B981, // Green
      'related': 0xF59E0B,      // Amber
      'contrast': 0xEF4444     // Red
    };
    return colors[type] || 0x6B7280;
  }

  getConceptColor(concept) {
    const colorMap = {
      'atom': 0xFF6B6B,
      'molecule': 0xFF8C42,
      'cell': 0x06D6A0,
      'dna': 0x118AB2,
      'orbit': 0x073B4C,
      'motion': 0xF72585,
      'energy': 0xFFD60A,
      'force': 0xFCA311
    };
    
    const keywords = (concept.keywords || []).map(k => k.toLowerCase());
    
    for (const [keyword, color] of Object.entries(colorMap)) {
      if (keywords.some(k => k.includes(keyword)) || 
          concept.title.toLowerCase().includes(keyword)) {
        return color;
      }
    }
    
    return 0x6366F1; // Default indigo
  }

  startSimulation() {
    // Force-directed graph layout (Barnes-Hut approximation)
    const alpha = 0.1;
    const iterations = 50;
    
    for (let iter = 0; iter < iterations; iter++) {
      // Repulsive forces between all nodes
      for (let i = 0; i < this.nodes.length; i++) {
        for (let j = i + 1; j < this.nodes.length; j++) {
          const n1 = this.nodes[i].data;
          const n2 = this.nodes[j].data;
          
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dz = n2.z - n1.z;
          const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) + 0.1;
          
          const force = 0.5 / (dist * dist);
          
          n1.vx -= (dx / dist) * force * alpha;
          n1.vy -= (dy / dist) * force * alpha;
          n1.vz -= (dz / dist) * force * alpha;
          
          n2.vx += (dx / dist) * force * alpha;
          n2.vy += (dy / dist) * force * alpha;
          n2.vz += (dz / dist) * force * alpha;
        }
      }
      
      // Attractive forces along links
      this.links.forEach(link => {
        const s = link.source;
        const t = link.target;
        
        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const dz = t.z - s.z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) + 0.1;
        
        const targetDist = 3;
        const force = (dist - targetDist) * 0.1 * link.strength;
        
        s.vx += (dx / dist) * force * alpha;
        s.vy += (dy / dist) * force * alpha;
        s.vz += (dz / dist) * force * alpha;
        
        t.vx -= (dx / dist) * force * alpha;
        t.vy -= (dy / dist) * force * alpha;
        t.vz -= (dz / dist) * force * alpha;
      });
      
      // Update positions
      this.nodes.forEach(node => {
        const d = node.data;
        d.vx *= 0.95;
        d.vy *= 0.95;
        d.vz *= 0.95;
        d.x += d.vx;
        d.y += d.vy;
        d.z += d.vz;
        
        // Bounds checking
        d.x = Math.max(-8, Math.min(8, d.x));
        d.y = Math.max(-8, Math.min(8, d.y));
        d.z = Math.max(-3, Math.min(3, d.z));
      });
    }
  }

  onMouseDown(event) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, this.camera);
    
    const meshes = this.nodes.map(n => n.mesh);
    const intersects = raycaster.intersectObjects(meshes);
    
    if (intersects.length > 0) {
      this.isDragging = true;
      this.draggedNode = this.nodes.find(n => n.mesh === intersects[0].object);
    }
  }

  onMouseMove(event) {
    if (!this.isDragging || !this.draggedNode) return;
    
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);
    
    // Move node on z=0 plane
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);
    
    this.draggedNode.data.x = intersection.x;
    this.draggedNode.data.y = intersection.y;
  }

  onMouseUp() {
    this.isDragging = false;
    this.draggedNode = null;
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    // Update node and link positions
    this.nodes.forEach(node => {
      node.mesh.position.set(node.data.x, node.data.y, node.data.z);
      
      // Rotation
      node.mesh.rotation.x += 0.003;
      node.mesh.rotation.y += 0.005;
    });
    
    this.links.forEach(link => {
      const positions = link.line.geometry.attributes.position.array;
      positions[0] = link.source.x;
      positions[1] = link.source.y;
      positions[2] = link.source.z;
      positions[3] = link.target.x;
      positions[4] = link.target.y;
      positions[5] = link.target.z;
      link.line.geometry.attributes.position.needsUpdate = true;
    });
    
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.renderer.dispose();
    this.nodes.forEach(n => {
      n.mesh.geometry.dispose();
      n.mesh.material.dispose();
    });
    this.links.forEach(l => {
      l.line.geometry.dispose();
      l.line.material.dispose();
    });
  }
}

export async function renderConceptGraph(container, concepts) {
  const renderer = new ConceptGraphRenderer(container);
  await renderer.buildConceptGraph(concepts);
  return renderer;
}
