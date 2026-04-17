// ============================================
// Physics Simulation Engine v1.0
// Real scientific behavior for visualizations
// ============================================

import * as THREE from 'three';

export class PhysicsSimulator {
  constructor() {
    this.particles = [];
    this.forces = [];
    this.constraints = [];
    this.dt = 0.016; // 60 FPS
    
    console.log('🔬 Physics Engine initialized');
  }

  // Molecular dynamics simulation
  createMolecularDynamics(atoms = 5, bondStrength = 100) {
    console.log(`⚛️ Creating molecular dynamics: ${atoms} atoms`);
    
    const particles = [];
    const radius = 2;
    
    // Create atom particles
    for (let i = 0; i < atoms; i++) {
      const angle = (i / atoms) * Math.PI * 2;
      particles.push({
        id: i,
        position: new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius * 0.5,
          Math.sin(angle) * radius * 0.3
        ),
        velocity: new THREE.Vector3(0, 0, 0),
        acceleration: new THREE.Vector3(0, 0, 0),
        mass: 1,
        charge: i === 0 ? 2 : 1, // Central nucleus stronger
        radius: i === 0 ? 0.3 : 0.15
      });
    }
    
    // Create bond constraints
    const bonds = [];
    for (let i = 1; i < atoms; i++) {
      bonds.push({
        p1: particles[0],
        p2: particles[i],
        restLength: radius,
        stiffness: bondStrength
      });
    }
    
    // Add repulsion between non-bonded atoms
    const repulsionForces = [];
    for (let i = 1; i < atoms; i++) {
      for (let j = i + 1; j < atoms; j++) {
        repulsionForces.push({
          p1: particles[i],
          p2: particles[j],
          strength: 50
        });
      }
    }
    
    return {
      type: 'MOLECULAR',
      particles,
      bonds,
      repulsionForces,
      update: (time) => this.updateMolecularSystem(particles, bonds, repulsionForces, time)
    };
  }

  updateMolecularSystem(particles, bonds, repulsionForces, time) {
    // Coulomb repulsion between atoms
    repulsionForces.forEach(force => {
      const delta = force.p2.position.clone().sub(force.p1.position);
      const dist = delta.length() + 0.1;
      const f = force.strength / (dist * dist);
      
      delta.normalize().multiplyScalar(f);
      force.p1.acceleration.sub(delta);
      force.p2.acceleration.add(delta);
    });
    
    // Spring forces (bonds)
    bonds.forEach(bond => {
      const delta = bond.p2.position.clone().sub(bond.p1.position);
      const dist = delta.length();
      const force = bond.stiffness * (dist - bond.restLength) / dist;
      
      delta.normalize().multiplyScalar(force);
      bond.p1.acceleration.add(delta);
      bond.p2.acceleration.sub(delta);
    });
    
    // Damping and position updates
    particles.forEach(p => {
      p.velocity.multiplyScalar(0.99); // Damping
      p.velocity.add(p.acceleration.clone().multiplyScalar(this.dt));
      p.position.add(p.velocity.clone().multiplyScalar(this.dt));
      p.acceleration.set(0, 0, 0);
    });
    
    return particles.map((p, i) => ({
      id: i,
      position: p.position.clone(),
      radius: p.radius
    }));
  }

  // Orbital mechanics
  createOrbitalMechanics(bodies = 5) {
    console.log(`🌍 Creating orbital system: ${bodies} bodies`);
    
    const particles = [];
    const orbits = [];
    
    // Central star
    particles.push({
      id: 0,
      position: new THREE.Vector3(0, 0, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      mass: 1000,
      radius: 0.3,
      type: 'star'
    });
    
    // Orbiting planets
    for (let i = 1; i < bodies; i++) {
      const orbitRadius = 1 + i * 0.8;
      const speed = Math.sqrt(1000 / orbitRadius) * 0.5;
      const angle = (i / bodies) * Math.PI * 2;
      
      particles.push({
        id: i,
        position: new THREE.Vector3(
          Math.cos(angle) * orbitRadius,
          0,
          Math.sin(angle) * orbitRadius
        ),
        velocity: new THREE.Vector3(
          -Math.sin(angle) * speed,
          0,
          Math.cos(angle) * speed
        ),
        mass: 10,
        radius: 0.2,
        type: 'planet',
        orbitRadius,
        angle
      });
      
      orbits.push({ id: i, radius: orbitRadius, particles: [] });
    }
    
    return {
      type: 'ORBIT',
      particles,
      orbits,
      update: (time) => this.updateOrbitalSystem(particles, time)
    };
  }

  updateOrbitalSystem(particles, time) {
    // N-body gravity simulation
    particles.forEach((p, i) => {
      if (i === 0) return; // Sun doesn't move
      
      // Gravitational acceleration toward sun
      const delta = particles[0].position.clone().sub(p.position);
      const dist = delta.length();
      const a = 1000 / (dist * dist);
      
      p.velocity.add(delta.clone().normalize().multiplyScalar(a * this.dt));
      p.position.add(p.velocity.clone().multiplyScalar(this.dt));
    });
    
    return particles.map(p => ({
      id: p.id,
      position: p.position.clone(),
      radius: p.radius,
      velocity: p.velocity.clone().length()
    }));
  }

  // Particle system (for processes, reactions, etc)
  createParticleSystem(config = {}) {
    console.log('💫 Creating particle system');
    
    const emissionRate = config.emissionRate || 100;
    const particles = [];
    let emissionTime = 0;
    
    return {
      type: 'PARTICLES',
      particles,
      emissionTime,
      update: (time) => this.updateParticleSystem(
        particles, 
        time, 
        emissionRate,
        config
      )
    };
  }

  updateParticleSystem(particles, time, emissionRate, config) {
    // Emit new particles
    const newParticles = Math.floor(emissionRate * this.dt);
    
    for (let i = 0; i < newParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      const elevation = Math.random() * Math.PI;
      
      particles.push({
        id: particles.length,
        position: new THREE.Vector3(0, 0, 0),
        velocity: new THREE.Vector3(
          Math.sin(elevation) * Math.cos(angle) * 5,
          Math.sin(elevation) * Math.sin(angle) * 5,
          Math.cos(elevation) * 5
        ),
        age: 0,
        lifetime: config.lifetime || 3,
        color: new THREE.Color().setHSL(
          Math.random(),
          0.8,
          0.5
        )
      });
    }
    
    // Update existing particles
    return particles.filter(p => {
      p.age += this.dt;
      p.velocity.multiplyScalar(0.95); // Air resistance
      p.position.add(p.velocity.clone().multiplyScalar(this.dt));
      
      return p.age < p.lifetime;
    });
  }

  // Cellular automata (for biological processes)
  createCellularAutomata(size = 10) {
    console.log('🧬 Creating cellular automata');
    
    const grid = Array(size).fill(null).map(() => 
      Array(size).fill(0).map(() => Math.random() > 0.7 ? 1 : 0)
    );
    
    return {
      type: 'AUTOMATA',
      grid,
      size,
      update: (time) => this.updateAutomata(grid, size)
    };
  }

  updateAutomata(grid, size) {
    const newGrid = grid.map(row => [...row]);
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        // Count neighbors
        let neighbors = 0;
        for (let di = -1; di <= 1; di++) {
          for (let dj = -1; dj <= 1; dj++) {
            if (di === 0 && dj === 0) continue;
            neighbors += grid[(i + di + size) % size][(j + dj + size) % size];
          }
        }
        
        // Conway's Game of Life
        if (grid[i][j] === 1) {
          newGrid[i][j] = neighbors === 2 || neighbors === 3 ? 1 : 0;
        } else {
          newGrid[i][j] = neighbors === 3 ? 1 : 0;
        }
      }
    }
    
    return newGrid;
  }

  // Wave simulation (for vibration, sound, light)
  createWaveSimulation(resolution = 64) {
    console.log('🌊 Creating wave simulation');
    
    const heightField = Array(resolution * resolution).fill(0);
    const velocityField = Array(resolution * resolution).fill(0);
    
    return {
      type: 'WAVE',
      heightField,
      velocityField,
      resolution,
      update: (time) => this.updateWaveSimulation(
        heightField,
        velocityField,
        resolution,
        time
      )
    };
  }

  updateWaveSimulation(heightField, velocityField, resolution, time) {
    const damping = 0.99;
    
    // Perturbation - add wave source
    const centerIdx = (Math.floor(resolution / 2)) * resolution + Math.floor(resolution / 2);
    heightField[centerIdx] += Math.sin(time * 5) * 0.1;
    
    // Wave equation: next_h = 2*h - prev_h + c^2 * laplacian(h)
    for (let i = 1; i < resolution - 1; i++) {
      for (let j = 1; j < resolution - 1; j++) {
        const idx = i * resolution + j;
        const left = (i * resolution + j - 1);
        const right = (i * resolution + j + 1);
        const top = ((i - 1) * resolution + j);
        const bottom = ((i + 1) * resolution + j);
        
        const laplacian = (
          heightField[left] +
          heightField[right] +
          heightField[top] +
          heightField[bottom] -
          4 * heightField[idx]
        );
        
        velocityField[idx] = (velocityField[idx] + laplacian) * damping;
        heightField[idx] += velocityField[idx];
      }
    }
    
    return heightField;
  }
}

export async function createPhysicsSimulation(conceptType) {
  const simulator = new PhysicsSimulator();
  
  const simulations = {
    'MOLECULE': () => simulator.createMolecularDynamics(6, 150),
    'ORBIT': () => simulator.createOrbitalMechanics(8),
    'MOTION': () => simulator.createParticleSystem({ lifetime: 2 }),
    'PROCESS': () => simulator.createParticleSystem({ emissionRate: 200, lifetime: 3 }),
    'CELL': () => simulator.createCellularAutomata(15),
    'HELIX': () => simulator.createWaveSimulation(32),
    'DEFAULT': () => simulator.createParticleSystem()
  };
  
  const simulator_fn = simulations[conceptType] || simulations['DEFAULT'];
  const simulation = simulator_fn();
  
  console.log(`🎯 Created simulation: ${simulation.type}`);
  return simulation;
}
