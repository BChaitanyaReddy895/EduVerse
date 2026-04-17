// ============================================
// TIER 2: 4D Knowledge Hypergraphs
// Add temporal dimension to knowledge graph visualization
// ============================================

import * as THREE from 'three';

export class KnowledgeHypergraph4D {
  constructor(scene, camera, knowledgeGraph) {
    this.scene = scene;
    this.camera = camera;
    this.knowledgeGraph = knowledgeGraph; // { nodes, edges }
    
    this.timeAxis = null;
    this.learningHistory = []; // Time-stamped mastery snapshots
    this.currentTimeSlice = 0;
    this.maxTimeSlices = 50; // Maximum history points

    this.visualization = {
      nodes3D: new Map(),
      edges3D: new Map(),
      historyTrail: null,
      timeIndicator: null,
      animationRunning: false
    };

    this.config = {
      timeScale: 1.0,
      nodeSize: 1.0,
      edgeWidth: 2,
      historyTrailLength: 20,
      autoPlaySpeed: 1000, // ms per frame
      showTimeline: true
    };

    this.analytics = {
      learningSequences: [],
      conceptBirthTime: {},
      conceptMasteryEvolution: {},
      temporalClusters: []
    };
  }

  /**
   * Record learning history snapshot
   * Captures mastery state at a point in time
   */
  recordLearningSnapshot(masteryDict, timestamp = Date.now()) {
    const snapshot = {
      timestamp,
      mastery: { ...masteryDict },
      nodeCount: Object.keys(masteryDict).length
    };

    this.learningHistory.push(snapshot);

    // Trim old history
    if (this.learningHistory.length > this.maxTimeSlices) {
      this.learningHistory.shift();
    }

    // Analyze learning sequence
    this.analyzeSequence(snapshot);

    return snapshot;
  }

  /**
   * Analyze learning sequence from snapshots
   */
  analyzeSequence(latestSnapshot) {
    if (this.learningHistory.length < 2) return;

    const previous = this.learningHistory[this.learningHistory.length - 2];
    const current = latestSnapshot;

    // Find skills that improved
    const skillsImproved = [];
    const skillsWeakened = [];
    const skillsNewlyLearned = [];

    Object.entries(current.mastery).forEach(([skillId, currentMastery]) => {
      const previousMastery = previous.mastery[skillId] || 0;

      if (previousMastery === 0 && currentMastery > 0) {
        skillsNewlyLearned.push({ skillId, mastery: currentMastery });
        if (!this.analytics.conceptBirthTime[skillId]) {
          this.analytics.conceptBirthTime[skillId] = current.timestamp;
        }
      } else if (currentMastery > previousMastery) {
        skillsImproved.push({
          skillId,
          delta: currentMastery - previousMastery,
          previousMastery,
          currentMastery
        });
      } else if (currentMastery < previousMastery) {
        skillsWeakened.push({
          skillId,
          delta: previousMastery - currentMastery
        });
      }
    });

    const sequence = {
      timestamp: current.timestamp,
      improved: skillsImproved,
      weakened: skillsWeakened,
      newlyLearned: skillsNewlyLearned
    };

    this.analytics.learningSequences.push(sequence);
  }

  /**
   * Build 4D graph visualization
   * Time axis goes along Z, learning progression along Y
   */
  build4DVisualization() {
    if (!this.knowledgeGraph || this.learningHistory.length === 0) return;

    // Create time axis (Z direction)
    this.createTimeAxis();

    // Create 3D nodes for each time slice
    this.visualizeTemporalNodes();

    // Connect nodes across time (show learning progression)
    this.visualizeTemporalConnections();

    // Show current "time slice"
    this.highlightCurrentTimeSlice();
  }

  /**
   * Create visual time axis
   */
  createTimeAxis() {
    const axisLength = this.learningHistory.length * 5;
    
    // Create line
    const points = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, axisLength)
    ];

    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x64748B,
      linewidth: 2,
      transparent: true,
      opacity: 0.6
    });

    this.timeAxis = new THREE.Line(lineGeo, lineMat);
    this.scene.add(this.timeAxis);

    // Add time markers
    this.learningHistory.forEach((snapshot, index) => {
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x7C3AED })
      );
      marker.position.z = index * 5;
      this.scene.add(marker);

      // Label with time
      const label = this.createTimeLabel(index, snapshot.timestamp);
      label.position.z = index * 5;
      this.scene.add(label);
    });
  }

  /**
   * Create time label
   */
  createTimeLabel(index, timestamp) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const date = new Date(timestamp);
    const timeStr = date.toLocaleTimeString();

    ctx.fillStyle = '#94A3B8';
    ctx.font = 'Bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${index}. ${timeStr}`, 64, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, sizeAttenuation: true });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2, 1, 1);

    return sprite;
  }

  /**
   * Visualize nodes at each time slice
   */
  visualizeTemporalNodes() {
    const nodes = this.knowledgeGraph.nodes || [];

    this.learningHistory.forEach((snapshot, timeIndex) => {
      const zPos = timeIndex * 5;

      nodes.forEach((node, nodeIndex) => {
        const mastery = snapshot.mastery[node.id] || 0;

        if (mastery === 0) return; // Skip unlearned concepts

        // Calculate position
        const angle = (nodeIndex / nodes.length) * Math.PI * 2;
        const radius = 5 + mastery * 3; // Mastery affects radius

        const x = Math.cos(angle) * radius;
        const y = mastery * 5; // Height = mastery
        const z = zPos;

        // Create node
        const nodeSize = 0.3 + mastery * 0.4;
        const nodeGeo = new THREE.SphereGeometry(nodeSize, 32, 32);

        // Color based on mastery
        const color = new THREE.Color().setHSL(mastery * 0.3, 1, 0.5); // Green to Red

        const nodeMat = new THREE.MeshPhysicalMaterial({
          color,
          metalness: 0.6,
          roughness: 0.2,
          emissive: color,
          emissiveIntensity: mastery * 0.5
        });

        const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
        nodeMesh.position.set(x, y, z);
        nodeMesh.userData = { nodeId: node.id, timeIndex, mastery };

        this.scene.add(nodeMesh);

        // Store reference
        const key = `${node.id}-${timeIndex}`;
        this.visualization.nodes3D.set(key, nodeMesh);
      });
    });
  }

  /**
   * Draw connections showing temporal progression
   */
  visualizeTemporalConnections() {
    const nodes = this.knowledgeGraph.nodes || [];

    // Draw vertical connections (same concept across time)
    nodes.forEach((node) => {
      const points = [];

      this.learningHistory.forEach((snapshot, timeIndex) => {
        const mastery = snapshot.mastery[node.id] || 0;
        if (mastery === 0) return;

        const nodeIndex = nodes.indexOf(node);
        const angle = (nodeIndex / nodes.length) * Math.PI * 2;
        const radius = 5 + mastery * 3;

        const x = Math.cos(angle) * radius;
        const y = mastery * 5;
        const z = timeIndex * 5;

        points.push(new THREE.Vector3(x, y, z));
      });

      if (points.length > 1) {
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineBasicMaterial({
          color: 0x06B6D4,
          linewidth: 1,
          transparent: true,
          opacity: 0.4
        });

        const line = new THREE.Line(lineGeo, lineMat);
        this.scene.add(line);
      }
    });

    // Draw prerequisite edges within each time slice
    const edges = this.knowledgeGraph.edges || [];

    this.learningHistory.forEach((snapshot, timeIndex) => {
      const zPos = timeIndex * 5;

      edges.forEach((edge) => {
        const fromMastery = snapshot.mastery[edge.from] || 0;
        const toMastery = snapshot.mastery[edge.to] || 0;

        if (fromMastery === 0 || toMastery === 0) return;

        // Calculate positions
        const fromNodeIndex = (this.knowledgeGraph.nodes || []).findIndex(n => n.id === edge.from);
        const toNodeIndex = (this.knowledgeGraph.nodes || []).findIndex(n => n.id === edge.to);

        const fromAngle = (fromNodeIndex / (this.knowledgeGraph.nodes || []).length) * Math.PI * 2;
        const toAngle = (toNodeIndex / (this.knowledgeGraph.nodes || []).length) * Math.PI * 2;

        const fromRadius = 5 + fromMastery * 3;
        const toRadius = 5 + toMastery * 3;

        const fromPos = new THREE.Vector3(
          Math.cos(fromAngle) * fromRadius,
          fromMastery * 5,
          zPos
        );

        const toPos = new THREE.Vector3(
          Math.cos(toAngle) * toRadius,
          toMastery * 5,
          zPos
        );

        const edgeGeo = new THREE.BufferGeometry().setFromPoints([fromPos, toPos]);
        const edgeColor = edge.type === 'prerequisite' ? 0x7C3AED : 0x10B981;
        const edgeMat = new THREE.LineBasicMaterial({
          color: edgeColor,
          linewidth: this.config.edgeWidth,
          transparent: true,
          opacity: 0.3
        });

        const edgeLine = new THREE.Line(edgeGeo, edgeMat);
        this.scene.add(edgeLine);
      });
    });
  }

  /**
   * Highlight current time slice
   */
  highlightCurrentTimeSlice() {
    if (this.learningHistory.length === 0) return;

    const currentSnapshot = this.learningHistory[this.currentTimeSlice];
    const zPos = this.currentTimeSlice * 5;

    // Create highlighting plane
    const planeGeo = new THREE.PlaneGeometry(20, 10);
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0x06B6D4,
      transparent: true,
      opacity: 0.05
    });

    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.position.z = zPos;
    this.scene.add(plane);

    this.visualization.currentPlane = plane;
  }

  /**
   * Animate through time
   */
  animateTimeProgression(duration = 10000) {
    if (this.visualization.animationRunning) return;

    this.visualization.animationRunning = true;

    const startTime = Date.now();
    const maxTimeIndex = this.learningHistory.length - 1;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = (elapsed % duration) / duration;
      const timeIndex = Math.floor(progress * maxTimeIndex);

      this.setCurrentTimeSlice(timeIndex);

      if (elapsed < duration * 3) { // Play 3 times
        requestAnimationFrame(animate);
      } else {
        this.visualization.animationRunning = false;
      }
    };

    animate();
  }

  /**
   * Set current time slice
   */
  setCurrentTimeSlice(timeIndex) {
    this.currentTimeSlice = Math.min(timeIndex, this.learningHistory.length - 1);
    this.highlightCurrentTimeSlice();

    // Update camera position to follow time progression
    if (this.camera) {
      this.camera.position.z = this.currentTimeSlice * 5 - 10;
    }
  }

  /**
   * Get temporal clustering patterns
   * Identifies which concepts are learned together
   */
  getTemporalClusters() {
    const clusters = [];

    this.learningHistory.forEach((snapshot, timeIndex) => {
      const learningEvent = {
        timeIndex,
        timestamp: snapshot.timestamp,
        skillsLearned: [],
        skillsImproved: []
      };

      if (timeIndex > 0) {
        const previous = this.learningHistory[timeIndex - 1];

        Object.entries(snapshot.mastery).forEach(([skillId, mastery]) => {
          const prevMastery = previous.mastery[skillId] || 0;

          if (prevMastery === 0 && mastery > 0) {
            learningEvent.skillsLearned.push(skillId);
          } else if (mastery > prevMastery) {
            learningEvent.skillsImproved.push({ skillId, delta: mastery - prevMastery });
          }
        });
      }

      if (learningEvent.skillsLearned.length > 0 || learningEvent.skillsImproved.length > 0) {
        clusters.push(learningEvent);
      }
    });

    this.analytics.temporalClusters = clusters;
    return clusters;
  }

  /**
   * Get learning velocity (rate of mastery increase)
   */
  getLearningVelocity() {
    if (this.learningHistory.length < 2) return 0;

    let totalMasteryIncrease = 0;
    const uniqueSkills = new Set();

    for (let i = 1; i < this.learningHistory.length; i++) {
      const prev = this.learningHistory[i - 1].mastery;
      const current = this.learningHistory[i].mastery;

      Object.entries(current).forEach(([skillId, mastery]) => {
        const prevMastery = prev[skillId] || 0;
        totalMasteryIncrease += mastery - prevMastery;
        uniqueSkills.add(skillId);
      });
    }

    return totalMasteryIncrease / (this.learningHistory.length - 1) / uniqueSkills.size;
  }

  /**
   * Get analytics
   */
  getAnalytics() {
    return {
      ...this.analytics,
      historySnapshots: this.learningHistory.length,
      learningVelocity: this.getLearningVelocity(),
      temporalClusters: this.getTemporalClusters(),
      conceptBirthTimes: this.analytics.conceptBirthTime
    };
  }
}

export default KnowledgeHypergraph4D;
