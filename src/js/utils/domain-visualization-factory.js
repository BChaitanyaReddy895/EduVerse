// ============================================
// Domain-Specific Realistic Visualizations v1.0
// CS, Biology, Physics, Chemistry, Math, Engineering
// ============================================

import * as THREE from 'three';
import { createEngineeringGradeVisualization } from './engineering-visualization.js';

export class DomainVisualizationFactory {
  constructor(scene) {
    this.scene = scene;
    this.meshes = [];
    this.animations = [];
    this.setupProfessionalLighting();
  }

  setupProfessionalLighting() {
    this.scene.children.forEach(child => {
      if (child instanceof THREE.Light) {
        this.scene.remove(child);
      }
    });

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
    keyLight.position.set(12, 16, 10);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x7799ff, 0.9);
    fillLight.position.set(-8, 10, -12);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.7);
    rimLight.position.set(0, -20, -15);
    this.scene.add(rimLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
  }

  // ==================== COMPUTER SCIENCE ====================

  // DATABASE SCHEMA VISUALIZATION
  async createDatabaseSchema(concept) {
    console.log(`🗄️ Creating database schema visualization`);
    
    const group = new THREE.Group();

    // 4 table structures with 3D representation
    const tables = [
      { name: 'Users', x: -3, color: 0x3498DB },
      { name: 'Orders', x: -1, color: 0xE74C3C },
      { name: 'Products', x: 1, color: 0x2ECC71 },
      { name: 'Transactions', x: 3, color: 0xF39C12 }
    ];

    tables.forEach(table => {
      // Table box (3D representation)
      const tableGeo = new THREE.BoxGeometry(1.2, 2.5, 0.8);
      const tableMat = new THREE.MeshStandardMaterial({
        color: table.color,
        metalness: 0.4,
        roughness: 0.6
      });
      const tableBox = new THREE.Mesh(tableGeo, tableMat);
      tableBox.position.x = table.x;
      tableBox.castShadow = true;
      tableBox.receiveShadow = true;
      group.add(tableBox);

      // Table label
      // Create a canvas texture for text
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(table.name, 256, 128);
      ctx.fillText('ID · Name · ...', 256, 200);
      
      const texture = new THREE.CanvasTexture(canvas);
      const labelGeo = new THREE.PlaneGeometry(1.2, 0.6);
      const labelMat = new THREE.MeshBasicMaterial({ map: texture });
      const label = new THREE.Mesh(labelGeo, labelMat);
      label.position.set(table.x, 1.5, 0.45);
      group.add(label);
    });

    // Relationship lines (Foreign Keys)
    const lineMat = new THREE.LineBasicMaterial({ color: 0x95A5A6, linewidth: 2 });
    
    // Users to Orders
    const points1 = [new THREE.Vector3(-3, 0, 0), new THREE.Vector3(-1, 0, 0)];
    const geo1 = new THREE.BufferGeometry().setFromPoints(points1);
    const line1 = new THREE.Line(geo1, lineMat);
    group.add(line1);

    // Products to Orders
    const points2 = [new THREE.Vector3(1, 0.5, 0), new THREE.Vector3(-1, -0.5, 0)];
    const geo2 = new THREE.BufferGeometry().setFromPoints(points2);
    const line2 = new THREE.Line(geo2, lineMat);
    group.add(line2);

    // Transactions to Orders
    const points3 = [new THREE.Vector3(3, 0, 0), new THREE.Vector3(1, 0, 0)];
    const geo3 = new THREE.BufferGeometry().setFromPoints(points3);
    const line3 = new THREE.Line(geo3, lineMat);
    group.add(line3);

    // Animated connection pulses
    this.animations.push({
      mesh: group,
      type: 'database-pulse',
      lines: [line1, line2, line3]
    });

    this.scene.add(group);
    this.meshes.push(group);
    return group;
  }

  // NETWORK TOPOLOGY VISUALIZATION
  async createNetworkTopology(concept) {
    console.log(`🌐 Creating network topology`);
    
    const group = new THREE.Group();

    // Central server
    const serverGeo = new THREE.BoxGeometry(1, 1, 1);
    const serverMat = new THREE.MeshStandardMaterial({
      color: 0xFF6B6B,
      metalness: 0.8,
      roughness: 0.2
    });
    const server = new THREE.Mesh(serverGeo, serverMat);
    server.castShadow = true;
    server.receiveShadow = true;
    group.add(server);

    // Client nodes (6 around server)
    const clients = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x = Math.cos(angle) * 4;
      const z = Math.sin(angle) * 4;

      const clientGeo = new THREE.SphereGeometry(0.4, 16, 16);
      const clientMat = new THREE.MeshPhongMaterial({
        color: 0x3498DB,
        metalness: 0.6,
        roughness: 0.4
      });
      const client = new THREE.Mesh(clientGeo, clientMat);
      client.position.set(x, 0, z);
      client.castShadow = true;
      client.receiveShadow = true;
      group.add(client);
      clients.push(client);

      // Connection line
      const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, 0, z)];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x2ECC71, linewidth: 2 });
      const line = new THREE.Line(geo, lineMat);
      group.add(line);
    }

    // Animated data packets
    this.animations.push({
      mesh: group,
      type: 'network-packets',
      clients,
      server,
      packetSpeed: 0.02
    });

    this.scene.add(group);
    this.meshes.push(group);
    return group;
  }

  // CRYPTOGRAPHY VISUALIZATION
  async createEncryptionFlow(concept) {
    console.log(`🔐 Creating encryption flow`);
    
    const group = new THREE.Group();

    // Plaintext block
    const plainGeo = new THREE.BoxGeometry(1.5, 0.5, 0.5);
    const plainMat = new THREE.MeshPhongMaterial({
      color: 0x2ECC71,
      metalness: 0.5,
      roughness: 0.5
    });
    const plaintext = new THREE.Mesh(plainGeo, plainMat);
    plaintext.position.x = -5;
    plaintext.castShadow = true;
    plaintext.receiveShadow = true;
    group.add(plaintext);

    // Encryption box (spinning)
    const encBoxGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const encBoxMat = new THREE.MeshStandardMaterial({
      color: 0xF39C12,
      metalness: 0.7,
      roughness: 0.3
    });
    const encBox = new THREE.Mesh(encBoxGeo, encBoxMat);
    encBox.castShadow = true;
    encBox.receiveShadow = true;
    group.add(encBox);

    // Ciphertext block
    const cipherGeo = new THREE.BoxGeometry(1.5, 0.5, 0.5);
    const cipherMat = new THREE.MeshPhongMaterial({
      color: 0xE74C3C,
      metalness: 0.5,
      roughness: 0.5
    });
    const ciphertext = new THREE.Mesh(cipherGeo, cipherMat);
    ciphertext.position.x = 5;
    ciphertext.castShadow = true;
    ciphertext.receiveShadow = true;
    group.add(ciphertext);

    // Connection arrows
    const arrowGeo = new THREE.ConeGeometry(0.2, 0.6, 8);
    const arrowMat = new THREE.MeshStandardMaterial({ color: 0x9B59B6 });
    
    const arrow1 = new THREE.Mesh(arrowGeo, arrowMat);
    arrow1.position.set(-2, 0, 0);
    arrow1.rotation.z = Math.PI / 2;
    group.add(arrow1);

    const arrow2 = new THREE.Mesh(arrowGeo, arrowMat);
    arrow2.position.set(2, 0, 0);
    arrow2.rotation.z = Math.PI / 2;
    group.add(arrow2);

    // Encryption key
    const keyGeo = new THREE.BoxGeometry(0.3, 1.5, 0.1);
    const keyMat = new THREE.MeshPhongMaterial({
      color: 0x1C2833,
      metalness: 0.9,
      roughness: 0.1
    });
    const key = new THREE.Mesh(keyGeo, keyMat);
    key.position.set(0, 2, 0);
    key.castShadow = true;
    key.receiveShadow = true;
    group.add(key);

    // Animation
    this.animations.push({
      mesh: encBox,
      type: 'encryption-spin',
      speed: 0.03
    });

    this.scene.add(group);
    this.meshes.push(group);
    return group;
  }

  // AGILE WORKFLOW VISUALIZATION
  async createAgileWorkflow(concept) {
    console.log(`📊 Creating agile workflow`);
    
    const group = new THREE.Group();

    // Sprint stages
    const stages = [
      { name: 'Backlog', x: -4, color: 0x95A5A6 },
      { name: 'To Do', x: -2, color: 0x3498DB },
      { name: 'In Progress', x: 0, color: 0xF39C12 },
      { name: 'Review', x: 2, color: 0x9B59B6 },
      { name: 'Done', x: 4, color: 0x2ECC71 }
    ];

    stages.forEach(stage => {
      // Stage box
      const stageGeo = new THREE.BoxGeometry(1.3, 3, 0.8);
      const stageMat = new THREE.MeshPhongMaterial({
        color: stage.color,
        metalness: 0.5,
        roughness: 0.5
      });
      const stageBox = new THREE.Mesh(stageGeo, stageMat);
      stageBox.position.x = stage.x;
      stageBox.castShadow = true;
      stageBox.receiveShadow = true;
      group.add(stageBox);

      // Task cards inside
      for (let i = 0; i < 3; i++) {
        const cardGeo = new THREE.BoxGeometry(1, 0.6, 0.2);
        const cardMat = new THREE.MeshPhongMaterial({
          color: 0xECF0F1,
          metalness: 0.3,
          roughness: 0.7
        });
        const card = new THREE.Mesh(cardGeo, cardMat);
        card.position.set(stage.x, 1 - i * 0.8, 0.5);
        group.add(card);
      }
    });

    // Arrow connections
    for (let i = 0; i < stages.length - 1; i++) {
      const x1 = stages[i].x;
      const x2 = stages[i + 1].x;
      const points = [new THREE.Vector3(x1 + 0.7, 0, 0), new THREE.Vector3(x2 - 0.7, 0, 0)];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x34495E, linewidth: 2 });
      const line = new THREE.Line(geo, lineMat);
      group.add(line);
    }

    this.scene.add(group);
    this.meshes.push(group);
    return group;
  }

  // NEURAL NETWORK VISUALIZATION
  async createNeuralNetwork(concept) {
    console.log(`🧠 Creating neural network`);
    
    const group = new THREE.Group();

    // Input layer (4 neurons)
    const layers = [
      { neurons: 4, x: -4, color: 0x3498DB },
      { neurons: 6, x: -2, color: 0xF39C12 },
      { neurons: 6, x: 0, color: 0xF39C12 },
      { neurons: 3, x: 2, color: 0x2ECC71 }
    ];

    const neuronMeshes = [];

    layers.forEach((layer, layerIdx) => {
      const layerNeurons = [];
      const spacing = 4 / layer.neurons;

      for (let i = 0; i < layer.neurons; i++) {
        const neuronGeo = new THREE.SphereGeometry(0.25, 16, 16);
        const neuronMat = new THREE.MeshPhongMaterial({
          color: layer.color,
          emissive: layer.color,
          metalness: 0.6,
          roughness: 0.4
        });
        const neuron = new THREE.Mesh(neuronGeo, neuronMat);
        neuron.position.set(
          layer.x,
          -2 + i * spacing,
          0
        );
        neuron.castShadow = true;
        neuron.receiveShadow = true;
        group.add(neuron);
        layerNeurons.push(neuron);
      }

      neuronMeshes.push(layerNeurons);

      // Connections to next layer
      if (layerIdx < layers.length - 1) {
        const nextLayer = layers[layerIdx + 1];
        const nextSpacing = 4 / nextLayer.neurons;

        for (let i = 0; i < layer.neurons; i++) {
          for (let j = 0; j < nextLayer.neurons; j++) {
            const x1 = layer.x;
            const y1 = -2 + i * spacing;
            const x2 = nextLayer.x;
            const y2 = -2 + j * nextSpacing;

            const points = [new THREE.Vector3(x1, y1, 0), new THREE.Vector3(x2, y2, 0)];
            const geo = new THREE.BufferGeometry().setFromPoints(points);
            const lineMat = new THREE.LineBasicMaterial({
              color: 0x95A5A6,
              transparent: true,
              opacity: 0.3
            });
            const line = new THREE.Line(geo, lineMat);
            group.add(line);
          }
        }
      }
    });

    // Animation
    this.animations.push({
      mesh: group,
      type: 'neural-pulse',
      neurons: neuronMeshes
    });

    this.scene.add(group);
    this.meshes.push(group);
    return group;
  }

  // ALGORITHM TREE VISUALIZATION
  async createAlgorithmTree(concept) {
    console.log(`⚙️ Creating algorithm tree`);
    
    const group = new THREE.Group();

    // Binary search tree
    const createTreeNode = (value, x, y, size = 0.5) => {
      const nodeGeo = new THREE.SphereGeometry(size, 16, 16);
      const nodeMat = new THREE.MeshPhongMaterial({
        color: 0x3498DB,
        metalness: 0.6,
        roughness: 0.4
      });
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.set(x, y, 0);
      node.castShadow = true;
      node.receiveShadow = true;
      return { mesh: node, x, y, value };
    };

    // Build tree structure
    const root = createTreeNode(50, 0, 3);
    group.add(root.mesh);

    const left = createTreeNode(30, -2, 1.5);
    const right = createTreeNode(70, 2, 1.5);
    group.add(left.mesh);
    group.add(right.mesh);

    const ll = createTreeNode(20, -3, 0);
    const lr = createTreeNode(40, -1, 0);
    const rl = createTreeNode(60, 1, 0);
    const rr = createTreeNode(80, 3, 0);
    group.add(ll.mesh);
    group.add(lr.mesh);
    group.add(rl.mesh);
    group.add(rr.mesh);

    // Connection lines
    const lineMat = new THREE.LineBasicMaterial({ color: 0x95A5A6, linewidth: 2 });

    const connections = [
      [root, left], [root, right],
      [left, ll], [left, lr],
      [right, rl], [right, rr]
    ];

    connections.forEach(([parent, child]) => {
      const points = [
        new THREE.Vector3(parent.x, parent.y, 0),
        new THREE.Vector3(child.x, child.y, 0)
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, lineMat);
      group.add(line);
    });

    this.scene.add(group);
    this.meshes.push(group);
    return group;
  }

  // ==================== PHYSICS ====================

  // WAVE SIMULATION
  async createWaveSimulation(concept) {
    console.log(`〰️ Creating wave simulation`);
    
    const group = new THREE.Group();

    // Create wave mesh
    const width = 8;
    const height = 8;
    const widthSegments = 64;
    const heightSegments = 64;

    const geometry = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);
    const material = new THREE.MeshPhongMaterial({
      color: 0x3498DB,
      wireframe: false,
      metalness: 0.4,
      roughness: 0.6
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 3;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    // Store original positions
    const positionAttribute = geometry.getAttribute('position');
    const originalPositions = new Float32Array(positionAttribute.array);

    this.animations.push({
      mesh,
      type: 'wave',
      geometry,
      originalPositions,
      time: 0
    });

    this.scene.add(group);
    this.meshes.push(group);
    return group;
  }

  // ELECTROMAGNETIC FIELD
  async createElectromagneticField(concept) {
    console.log(`⚛️ Creating electromagnetic field`);
    
    const group = new THREE.Group();

    // Positive charge (red)
    const posGeo = new THREE.SphereGeometry(0.4, 16, 16);
    const posMat = new THREE.MeshPhongMaterial({
      color: 0xE74C3C,
      emissive: 0xFF0000,
      metalness: 0.6,
      roughness: 0.4
    });
    const posCharge = new THREE.Mesh(posGeo, posMat);
    posCharge.position.x = -2;
    posCharge.castShadow = true;
    group.add(posCharge);

    // Negative charge (blue)
    const negGeo = new THREE.SphereGeometry(0.4, 16, 16);
    const negMat = new THREE.MeshPhongMaterial({
      color: 0x3498DB,
      emissive: 0x0000FF,
      metalness: 0.6,
      roughness: 0.4
    });
    const negCharge = new THREE.Mesh(negGeo, negMat);
    negCharge.position.x = 2;
    negCharge.castShadow = true;
    group.add(negCharge);

    // Field lines
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const radius = 1.5;

      // Lines radiating from positive charge
      const points = [
        new THREE.Vector3(-2, 0, 0),
        new THREE.Vector3(
          -2 + Math.cos(angle) * radius,
          Math.sin(angle) * radius * 0.5,
          Math.sin(angle) * radius * 0.5
        )
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({ color: 0xE74C3C, linewidth: 1 });
      const line = new THREE.Line(geo, lineMat);
      group.add(line);
    }

    this.scene.add(group);
    this.meshes.push(group);
    return group;
  }

  // ==================== BIOLOGY ====================

  // CELL STRUCTURE
  async createCellStructure(concept) {
    console.log(`🧬 Creating cell structure`);
    
    const group = new THREE.Group();

    // Cell membrane
    const membranGeo = new THREE.IcosahedronGeometry(3, 5);
    const membraneMat = new THREE.MeshPhongMaterial({
      color: 0xF39C12,
      transparent: true,
      opacity: 0.3,
      metalness: 0.4,
      roughness: 0.6
    });
    const membrane = new THREE.Mesh(membranGeo, membraneMat);
    membrane.castShadow = true;
    group.add(membrane);

    // Nucleus
    const nucleusGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const nucleusMat = new THREE.MeshPhongMaterial({
      color: 0xE74C3C,
      emissive: 0x8B0000,
      metalness: 0.5,
      roughness: 0.5
    });
    const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
    nucleus.castShadow = true;
    group.add(nucleus);

    // Mitochondria (multiple)
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x = Math.cos(angle) * 2;
      const z = Math.sin(angle) * 2;

      const mitoGeo = new THREE.CapsuleGeometry(0.3, 1, 8, 8);
      const mitoMat = new THREE.MeshPhongMaterial({
        color: 0x2ECC71,
        metalness: 0.5,
        roughness: 0.5
      });
      const mito = new THREE.Mesh(mitoGeo, mitoMat);
      mito.position.set(x, 0, z);
      mito.rotation.z = angle;
      mito.castShadow = true;
      group.add(mito);
    }

    // Ribosomes (small spheres)
    for (let i = 0; i < 10; i++) {
      const riboGeo = new THREE.SphereGeometry(0.15, 8, 8);
      const riboMat = new THREE.MeshPhongMaterial({
        color: 0x9B59B6,
        metalness: 0.6,
        roughness: 0.4
      });
      const ribo = new THREE.Mesh(riboGeo, riboMat);
      ribo.position.set(
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4
      );
      ribo.castShadow = true;
      group.add(ribo);
    }

    this.scene.add(group);
    this.meshes.push(group);
    return group;
  }

  // DNA REPLICATION
  async createDNAReplication(concept) {
    console.log(`🧬 Creating DNA replication`);
    
    const group = new THREE.Group();

    // Create DNA double helix
    const helix = (xOffset, color) => {
      const helixGroup = new THREE.Group();
      const radius = 0.8;
      const turns = 3;
      const points = 50;

      for (let i = 0; i < points; i++) {
        const t = (i / points) * turns * Math.PI * 2;
        const y = (i / points) * 4 - 2;

        const x = Math.cos(t) * radius;
        const z = Math.sin(t) * radius;

        const sphereGeo = new THREE.SphereGeometry(0.15, 8, 8);
        const sphereMat = new THREE.MeshPhongMaterial({
          color,
          metalness: 0.5,
          roughness: 0.5
        });
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        sphere.position.set(x + xOffset, y, z);
        sphere.castShadow = true;
        helixGroup.add(sphere);
      }

      return helixGroup;
    };

    // Two DNA strands
    const strand1 = helix(-1.5, 0x3498DB);
    const strand2 = helix(1.5, 0xE74C3C);
    group.add(strand1);
    group.add(strand2);

    // Base pair connections
    const lineMat = new THREE.LineBasicMaterial({ color: 0x2ECC71, linewidth: 1 });
    for (let i = 0; i < 30; i += 3) {
      const t = (i / 50) * 3 * Math.PI * 2;
      const y = (i / 50) * 4 - 2;
      const radius = 0.8;

      const x1 = Math.cos(t) * radius - 1.5;
      const z1 = Math.sin(t) * radius;
      const x2 = Math.cos(t) * radius + 1.5;
      const z2 = Math.sin(t) * radius;

      const points = [new THREE.Vector3(x1, y, z1), new THREE.Vector3(x2, y, z2)];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, lineMat);
      group.add(line);
    }

    this.scene.add(group);
    this.meshes.push(group);
    return group;
  }

  // ORBITAL MECHANICS & CELESTIAL MOTION
  async createOrbitalMechanics(concept) {
    console.log(`🌍 Creating orbital mechanics visualization`);
    
    const group = new THREE.Group();

    // Central star (sun)
    const starGeo = new THREE.SphereGeometry(1, 32, 32);
    const starMat = new THREE.MeshStandardMaterial({
      color: 0xFDB813,
      emissive: 0xFDB813,
      emissiveIntensity: 0.6,
      metalness: 0.2,
      roughness: 0.3
    });
    const star = new THREE.Mesh(starGeo, starMat);
    star.castShadow = true;
    group.add(star);

    // Planets with orbital paths
    const planets = [
      { name: 'Mercury', distance: 3, size: 0.2, color: 0x8C7853, speed: 0.04 },
      { name: 'Venus', distance: 5, size: 0.4, color: 0xFFC649, speed: 0.015 },
      { name: 'Earth', distance: 7, size: 0.45, color: 0x4A90E2, speed: 0.01 },
      { name: 'Mars', distance: 9.5, size: 0.3, color: 0xE27B58, speed: 0.008 },
      { name: 'Jupiter', distance: 12, size: 0.8, color: 0xC88B3A, speed: 0.002 },
      { name: 'Saturn', distance: 15, size: 0.6, color: 0xFAD5A5, speed: 0.0009 }
    ];

    planets.forEach((planet, index) => {
      const planetGeo = new THREE.SphereGeometry(planet.size, 16, 16);
      const planetMat = new THREE.MeshStandardMaterial({
        color: planet.color,
        metalness: 0.4,
        roughness: 0.6
      });
      const planetMesh = new THREE.Mesh(planetGeo, planetMat);
      planetMesh.castShadow = true;

      // Orbital ring (visual guide)
      const ringGeo = new THREE.BufferGeometry();
      const ringPoints = [];
      for (let i = 0; i <= 64; i++) {
        const angle = (i / 64) * Math.PI * 2;
        ringPoints.push(
          new THREE.Vector3(
            Math.cos(angle) * planet.distance,
            0,
            Math.sin(angle) * planet.distance
          )
        );
      }
      const ringMat = new THREE.LineBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.4 });
      const ringLine = new THREE.Line(ringGeo.setFromPoints(ringPoints), ringMat);
      group.add(ringLine);

      // Store planet data for animation
      planet.mesh = planetMesh;
      planet.angle = Math.random() * Math.PI * 2;
      group.add(planetMesh);
    });

    // Animation for orbital motion
    this.animations.push({
      mesh: group,
      type: 'orbital-motion',
      planets: planets,
      time: 0
    });

    this.scene.add(group);
    this.meshes.push(group);
    return group;
  }

  // ==================== MATHEMATICS ====================

  // GEOMETRIC TRANSFORMATION
  async createGeometricTransformation(concept) {
    console.log(`📐 Creating geometric transformation`);
    
    const group = new THREE.Group();

    // Original shape (cube)
    const origGeo = new THREE.BoxGeometry(1, 1, 1);
    const origMat = new THREE.MeshStandardMaterial({
      color: 0x3498DB,
      metalness: 0.5,
      roughness: 0.5
    });
    const orig = new THREE.Mesh(origGeo, origMat);
    orig.position.x = -4;
    orig.castShadow = true;
    group.add(orig);

    // Rotated shape
    const rotGeo = new THREE.BoxGeometry(1, 1, 1);
    const rotMat = new THREE.MeshPhongMaterial({
      color: 0xF39C12,
      metalness: 0.5,
      roughness: 0.5
    });
    const rot = new THREE.Mesh(rotGeo, rotMat);
    rot.position.x = -2;
    rot.rotation.z = Math.PI / 4;
    rot.castShadow = true;
    group.add(rot);

    // Scaled shape
    const scaleGeo = new THREE.BoxGeometry(1, 1, 1);
    const scaleMat = new THREE.MeshPhongMaterial({
      color: 0x2ECC71,
      metalness: 0.5,
      roughness: 0.5
    });
    const scale = new THREE.Mesh(scaleGeo, scaleMat);
    scale.position.x = 0;
    scale.scale.set(1.5, 1.5, 1.5);
    scale.castShadow = true;
    group.add(scale);

    // Translated shape
    const transGeo = new THREE.BoxGeometry(1, 1, 1);
    const transMat = new THREE.MeshPhongMaterial({
      color: 0xE74C3C,
      metalness: 0.5,
      roughness: 0.5
    });
    const trans = new THREE.Mesh(transGeo, transMat);
    trans.position.set(2, 1, 0);
    trans.castShadow = true;
    group.add(trans);

    // Complex transformation
    const complexGeo = new THREE.BoxGeometry(1, 1, 1);
    const complexMat = new THREE.MeshPhongMaterial({
      color: 0x9B59B6,
      metalness: 0.5,
      roughness: 0.5
    });
    const complex = new THREE.Mesh(complexGeo, complexMat);
    complex.position.x = 4;
    complex.scale.set(0.7, 1.3, 1);
    complex.rotation.z = Math.PI / 6;
    complex.castShadow = true;
    group.add(complex);

    // Animation
    this.animations.push({
      mesh: group,
      type: 'transform-demo',
      shapes: [orig, rot, scale, trans, complex]
    });

    this.scene.add(group);
    this.meshes.push(group);
    return group;
  }

  // ==================== ENGINEERING ====================

  // ENGINEERING GEAR SYSTEMS
  async createEngineeringGears(concept) {
    console.log(`⚙️ Creating engineering gear system`);
    try {
      const vizGen = await createEngineeringGradeVisualization(this.scene, 'GEAR_SYSTEM', concept);
      if (vizGen) this.meshes.push(vizGen);
      return vizGen;
    } catch (err) {
      console.warn('Gear visualization error:', err);
      return null;
    }
  }

  // ENGINEERING PISTON SYSTEMS
  async createEngineeringPiston(concept) {
    console.log(`🔧 Creating engineering piston mechanism`);
    try {
      const vizGen = await createEngineeringGradeVisualization(this.scene, 'PISTON', concept);
      if (vizGen) this.meshes.push(vizGen);
      return vizGen;
    } catch (err) {
      console.warn('Piston visualization error:', err);
      return null;
    }
  }

  // ENGINEERING HYDRAULIC SYSTEMS
  async createEngineeringHydraulic(concept) {
    console.log(`💧 Creating engineering hydraulic system`);
    try {
      const vizGen = await createEngineeringGradeVisualization(this.scene, 'HYDRAULIC', concept);
      if (vizGen) this.meshes.push(vizGen);
      return vizGen;
    } catch (err) {
      console.warn('Hydraulic visualization error:', err);
      return null;
    }
  }

  // ENGINEERING ROTOR SYSTEMS
  async createEngineeringRotor(concept) {
    console.log(`🌪️ Creating engineering rotor system`);
    try {
      const vizGen = await createEngineeringGradeVisualization(this.scene, 'ROTOR', concept);
      if (vizGen) this.meshes.push(vizGen);
      return vizGen;
    } catch (err) {
      console.warn('Rotor visualization error:', err);
      return null;
    }
  }

  // ENGINEERING BRIDGE STRUCTURES
  async createEngineeringBridge(concept) {
    console.log(`🌉 Creating engineering bridge structure`);
    try {
      const vizGen = await createEngineeringGradeVisualization(this.scene, 'BRIDGE', concept);
      if (vizGen) this.meshes.push(vizGen);
      return vizGen;
    } catch (err) {
      console.warn('Bridge visualization error:', err);
      return null;
    }
  }

  // ENGINEERING BUILDING STRUCTURES
  async createEngineeringBuilding(concept) {
    console.log(`🏢 Creating engineering building structure`);
    try {
      const vizGen = await createEngineeringGradeVisualization(this.scene, 'BUILDING', concept);
      if (vizGen) this.meshes.push(vizGen);
      return vizGen;
    } catch (err) {
      console.warn('Building visualization error:', err);
      return null;
    }
  }

  // UPDATE ANIMATIONS
  updateAnimations(elapsed) {
    if (!elapsed) return;
    
    this.animations.forEach(anim => {
      if (!anim) return;
      
      try {
        if (anim.type === 'wave' && anim.geometry) {
          const positionAttribute = anim.geometry.getAttribute('position');
          if (!positionAttribute) return;
          
          const positions = positionAttribute.array;
          for (let i = 0; i < positions.length; i += 3) {
            positions[i + 2] = anim.originalPositions[i + 2] +
              Math.sin(anim.originalPositions[i] + elapsed * 0.001) *
              Math.cos(anim.originalPositions[i + 1] + elapsed * 0.001) * 0.3;
          }
          positionAttribute.needsUpdate = true;
        } else if (anim.type === 'transform-demo' && anim.shapes) {
          anim.shapes.forEach((shape, idx) => {
            if (shape && shape.rotation) {
              shape.rotation.y += 0.005;
            }
          });
        } else if (anim.type === 'neural-pulse' && anim.neurons) {
          anim.neurons.forEach(layer => {
            if (layer && Array.isArray(layer)) {
              layer.forEach(neuron => {
                if (neuron && neuron.scale) {
                  const pulse = Math.sin(elapsed * 0.003) * 0.1 + 0.25;
                  neuron.scale.set(pulse, pulse, pulse);
                }
              });
            }
          });
        }
      } catch (err) {
        console.warn('Animation update error:', err);
      }
    });
  }

  // DISPOSE
  dispose() {
    this.meshes.forEach(mesh => {
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });
    this.animations = [];
    this.meshes = [];
  }
}

export async function createDomainVisualization(scene, domain, concept) {
  try {
    if (!scene) {
      throw new Error('Scene is required for visualization');
    }

    console.log(`🎨 Creating domain visualization: ${domain}`);
    
    const factory = new DomainVisualizationFactory(scene);

    const creators = {
      'CS_DATABASE': () => factory.createDatabaseSchema(concept),
      'CS_NETWORK_SECURITY': () => factory.createNetworkTopology(concept),
      'CS_CRYPTOGRAPHY': () => factory.createEncryptionFlow(concept),
      'CS_AGILE': () => factory.createAgileWorkflow(concept),
      'CS_ALGORITHMS': () => factory.createAlgorithmTree(concept),
      'CS_MACHINE_LEARNING': () => factory.createNeuralNetwork(concept),
      'PHYSICS_MECHANICS': () => factory.createOrbitalMechanics(concept),
      'PHYSICS_WAVES': () => factory.createWaveSimulation(concept),
      'PHYSICS_ELECTROMAGNETISM': () => factory.createElectromagneticField(concept),
      'BIOLOGY_CELL': () => factory.createCellStructure(concept),
      'BIOLOGY_GENETICS': () => factory.createDNAReplication(concept),
      'CHEMISTRY_MOLECULAR': () => factory.createMolecularStructure(concept),
      'CHEMISTRY_REACTIONS': () => factory.createChemicalReaction(concept),
      'MATH_GEOMETRY': () => factory.createGeometricTransformation(concept),
      'ENGINEERING_GEARS': () => factory.createEngineeringGears(concept),
      'ENGINEERING_PISTON': () => factory.createEngineeringPiston(concept),
      'ENGINEERING_HYDRAULIC': () => factory.createEngineeringHydraulic(concept),
      'ENGINEERING_ROTOR': () => factory.createEngineeringRotor(concept),
      'ENGINEERING_BRIDGE': () => factory.createEngineeringBridge(concept),
      'ENGINEERING_BUILDING': () => factory.createEngineeringBuilding(concept)
    };

    const creator = creators[domain];
    if (creator) {
      console.log(`✅ Calling creator for domain: ${domain}`);
      await creator();
    } else {
      console.warn(`⚠️ No creator found for domain: ${domain}, creating default visualization`);
      // Fallback to database schema
      await factory.createDatabaseSchema(concept);
    }

    console.log(`✨ Domain visualization created successfully`);
    return factory;
  } catch (err) {
    console.error(`❌ Error creating domain visualization for ${domain}:`, err);
    throw new Error(`Visualization error for ${domain}: ${err.message}`);
  }
}
