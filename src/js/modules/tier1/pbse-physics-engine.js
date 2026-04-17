// ============================================
// TIER 1: Physics-Based Educational Simulation Engine (PBSE)
// Real-time physics simulation for interactive learning
// ============================================

import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export class PBSEPhysicsEngine {
  constructor(scene, gravity = -9.81) {
    this.scene = scene;
    this.world = new CANNON.World();
    this.world.gravity.set(0, gravity, 0);
    this.world.defaultContactMaterial.friction = 0.4;
    this.world.defaultContactMaterial.restitution = 0.7;
    
    this.bodyMap = new Map(); // Maps THREE.Mesh to CANNON.Body
    this.constraints = new Map();
    this.sessionData = {
      forceApplied: [],
      collisionsDetected: [],
      trajectoryData: [],
      massPairs: []
    };
    
    this.timeStep = 1 / 60;
    this.isRunning = false;
    this.animationId = null;
  }

  /**
   * Create a rigid body for physics simulation
   * @param {THREE.Mesh} mesh - The visual mesh
   * @param {Object} options - { shape, mass, linearDamping, angularDamping, material, bounciness }
   */
  createRigidBody(mesh, options = {}) {
    const {
      shape = 'sphere',
      mass = 1,
      linearDamping = 0.3,
      angularDamping = 0.3,
      bounciness = 0.5
    } = options;

    let cannonShape;
    const meshPosition = mesh.position;
    const meshQuaternion = mesh.quaternion;

    // Create appropriate physics shape matching visual mesh
    if (shape === 'sphere' && mesh.geometry instanceof THREE.SphereGeometry) {
      const radius = mesh.geometry.parameters.radius * mesh.scale.x;
      cannonShape = new CANNON.Sphere(radius);
    } else if (shape === 'box' && mesh.geometry instanceof THREE.BoxGeometry) {
      const { width, height, depth } = mesh.geometry.parameters;
      cannonShape = new CANNON.Box(
        new CANNON.Vec3(width * mesh.scale.x / 2, height * mesh.scale.y / 2, depth * mesh.scale.z / 2)
      );
    } else if (shape === 'cylinder') {
      const radius = mesh.geometry.parameters.radiusTop || 0.5;
      const height = mesh.geometry.parameters.height || 1;
      cannonShape = new CANNON.Cylinder(radius * mesh.scale.x, radius * mesh.scale.x, height * mesh.scale.y, 8);
    } else {
      cannonShape = new CANNON.Sphere(1); // Default fallback
    }

    // Create body
    const body = new CANNON.Body({
      mass: mass,
      shape: cannonShape,
      linearDamping: linearDamping,
      angularDamping: angularDamping
    });

    body.position.copy(meshPosition);
    body.quaternion.copy(meshQuaternion);
    this.world.addBody(body);

    // Store mapping
    this.bodyMap.set(mesh.uuid, { mesh, body });

    // Track learning data
    mesh.userData.physicsBody = body;
    mesh.userData.mass = mass;

    return body;
  }

  /**
   * Apply force to object (F = ma)
   * Educational: Students see real-time effects of forces
   */
  applyForce(meshUuid, forceVector, applicationPoint = null) {
    const entry = this.bodyMap.get(meshUuid);
    if (!entry) return;

    const { body, mesh } = entry;
    const force = new CANNON.Vec3(forceVector.x, forceVector.y, forceVector.z);
    const point = applicationPoint ? 
      new CANNON.Vec3(applicationPoint.x, applicationPoint.y, applicationPoint.z) :
      body.position;

    body.applyForce(force, point);

    // Log force application for learning analytics
    this.sessionData.forceApplied.push({
      timestamp: Date.now(),
      meshUuid,
      forceVector: { x: forceVector.x, y: forceVector.y, z: forceVector.z },
      magnitude: Math.sqrt(forceVector.x ** 2 + forceVector.y ** 2 + forceVector.z ** 2),
      resultingAcceleration: Math.sqrt(forceVector.x ** 2 + forceVector.y ** 2 + forceVector.z ** 2) / mesh.userData.mass
    });
  }

  /**
   * Apply velocity directly (for teaching momentum)
   */
  setVelocity(meshUuid, velocityVector) {
    const entry = this.bodyMap.get(meshUuid);
    if (!entry) return;

    const { body } = entry;
    body.velocity.set(velocityVector.x, velocityVector.y, velocityVector.z);
  }

  /**
   * Create constraint between two bodies
   * Educational: Teaches concepts like hinges, springs, ropes
   */
  createConstraint(meshUuid1, meshUuid2, constraintType = 'point') {
    const entry1 = this.bodyMap.get(meshUuid1);
    const entry2 = this.bodyMap.get(meshUuid2);
    
    if (!entry1 || !entry2) return null;

    let constraint;
    const { body: body1 } = entry1;
    const { body: body2 } = entry2;
    const midpoint = new CANNON.Vec3(
      (body1.position.x + body2.position.x) / 2,
      (body1.position.y + body2.position.y) / 2,
      (body1.position.z + body2.position.z) / 2
    );

    if (constraintType === 'point') {
      // Point-to-point constraint (distance joint)
      constraint = new CANNON.PointToPointConstraint(
        body1, new CANNON.Vec3(0, 0, 0),
        body2, new CANNON.Vec3(0, 0, 0)
      );
    } else if (constraintType === 'hinge') {
      // Hinge constraint
      constraint = new CANNON.HingeConstraint(
        body1, body2,
        { position: body1.position },
        { position: body2.position },
        new CANNON.Vec3(0, 1, 0),
        new CANNON.Vec3(0, 1, 0)
      );
    } else if (constraintType === 'spring') {
      // Spring constraint
      const distance = body1.position.distanceTo(body2.position);
      constraint = new CANNON.Spring(body1, body2, {
        restLength: distance,
        stiffness: 100,
        damping: 5
      });
    }

    if (constraint) {
      this.world.addConstraint(constraint);
      this.constraints.set(`${meshUuid1}-${meshUuid2}`, constraint);
    }

    return constraint;
  }

  /**
   * Detect collisions and trigger educational callbacks
   */
  onCollision(meshUuid, callback) {
    const entry = this.bodyMap.get(meshUuid);
    if (!entry) return;

    const { body } = entry;
    const listener = (event) => {
      event.pairs.forEach(pair => {
        if (pair.body === body) {
          const otherBody = pair.bodyA === body ? pair.bodyB : pair.bodyA;
          const otherMeshUuid = Array.from(this.bodyMap.entries())
            .find(([_, val]) => val.body === otherBody)?.[0];
          
          if (otherMeshUuid) {
            this.sessionData.collisionsDetected.push({
              timestamp: Date.now(),
              collisionWith: otherMeshUuid,
              impactVelocity: body.velocity.length(),
              relativeVelocity: pair.getImpactVelocityAlongNormal()
            });

            callback?.({
              otherMeshUuid,
              impactVelocity: body.velocity.length(),
              impactForce: Math.abs(pair.getImpactVelocityAlongNormal())
            });
          }
        }
      });
    };

    this.world.addEventListener('collide', listener);
  }

  /**
   * Synchronize physics bodies with visual meshes
   */
  step() {
    if (!this.isRunning) return;

    this.world.step(this.timeStep);

    // Update mesh positions and rotations from physics bodies
    this.bodyMap.forEach(({ mesh, body }) => {
      mesh.position.copy(body.position);
      mesh.quaternion.copy(body.quaternion);

      // Track trajectory for learning analytics
      this.sessionData.trajectoryData.push({
        timestamp: Date.now(),
        meshUuid: mesh.uuid,
        position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
        velocity: { x: body.velocity.x, y: body.velocity.y, z: body.velocity.z }
      });
    });
  }

  /**
   * Start physics simulation
   */
  start() {
    this.isRunning = true;
    const animate = () => {
      this.step();
      this.animationId = requestAnimationFrame(animate);
    };
    animate();
  }

  /**
   * Stop physics simulation
   */
  stop() {
    this.isRunning = false;
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }

  /**
   * Reset all physics bodies to initial state
   */
  reset() {
    this.bodyMap.forEach(({ body }) => {
      body.velocity.set(0, 0, 0);
      body.angularVelocity.set(0, 0, 0);
      body.position.set(0, 0, 0);
    });
  }

  /**
   * Get learning analytics from physics session
   */
  getSessionAnalytics() {
    return {
      totalForces: this.sessionData.forceApplied.length,
      averageForceApplied: this.sessionData.forceApplied.length > 0 ?
        this.sessionData.forceApplied.reduce((sum, f) => sum + f.magnitude, 0) / this.sessionData.forceApplied.length :
        0,
      totalCollisions: this.sessionData.collisionsDetected.length,
      maxImpactVelocity: this.sessionData.collisionsDetected.length > 0 ?
        Math.max(...this.sessionData.collisionsDetected.map(c => c.impactVelocity)) :
        0,
      averageImpactVelocity: this.sessionData.collisionsDetected.length > 0 ?
        this.sessionData.collisionsDetected.reduce((sum, c) => sum + c.impactVelocity, 0) / this.sessionData.collisionsDetected.length :
        0,
      trajectoryPointCount: this.sessionData.trajectoryData.length
    };
  }

  /**
   * Lesson-specific: Pendulum simulation
   * Students learn: T = 2π√(L/g)
   */
  createPendulumLesson(scene, length = 2, mass = 1) {
    // Create visual components
    const pivotGeometry = new THREE.SphereGeometry(0.1, 32, 32);
    const pivotMaterial = new THREE.MeshStandardMaterial({ color: 0x64748B, metalness: 0.9 });
    const pivot = new THREE.Mesh(pivotGeometry, pivotMaterial);
    pivot.position.y = 2.5;
    scene.add(pivot);

    // Rope
    const ropeGeometry = new THREE.CylinderGeometry(0.02, 0.02, length, 16);
    const ropeMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355 });
    const rope = new THREE.Mesh(ropeGeometry, ropeMaterial);
    rope.position.y = 2.5 - length / 2;
    scene.add(rope);

    // Pendulum mass
    const massGeometry = new THREE.SphereGeometry(0.15 + mass * 0.1, 32, 32);
    const massMaterial = new THREE.MeshPhysicalMaterial({ color: 0xEF4444, metalness: 0.7 });
    const massObj = new THREE.Mesh(massGeometry, massMaterial);
    massObj.position.set(0, 2.5 - length, 0);
    scene.add(massObj);

    // Create physics body
    const body = this.createRigidBody(massObj, { shape: 'sphere', mass, bounciness: 0.3 });

    // Constraint: rope connection
    this.createConstraint(pivot.uuid, massObj.uuid, 'point');

    // Interactive: Student can adjust length/mass and observe period
    return {
      pivot, rope, mass: massObj, body,
      setLength: (newLength) => {
        rope.scale.y = newLength / length;
        massObj.position.y = 2.5 - newLength;
      },
      setMass: (newMass) => {
        body.mass = newMass;
      },
      calculatePeriod: () => {
        // T = 2π√(L/g)
        return 2 * Math.PI * Math.sqrt(length / 9.81);
      }
    };
  }

  /**
   * Lesson-specific: Projectile motion
   * Students learn: y = y0 + v0*sin(θ)*t - (1/2)*g*t²
   */
  createProjectileMotion(scene, initialVelocity = 20, angle = 45) {
    const angleRad = angle * Math.PI / 180;
    
    // Launch platform
    const platformGeo = new THREE.BoxGeometry(0.6, 0.2, 0.6);
    const platformMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.set(-3, 0, 0);
    scene.add(platform);

    // Projectile
    const projectileGeo = new THREE.SphereGeometry(0.2, 32, 32);
    const projectileMat = new THREE.MeshPhysicalMaterial({ color: 0x10B981, metalness: 0.8 });
    const projectile = new THREE.Mesh(projectileGeo, projectileMat);
    projectile.position.set(-3, 0.2, 0);
    scene.add(projectile);

    // Create physics body
    const body = this.createRigidBody(projectile, { shape: 'sphere', mass: 0.5 });
    
    // Set initial velocity
    const vx = initialVelocity * Math.cos(angleRad);
    const vy = initialVelocity * Math.sin(angleRad);
    body.velocity.set(vx, vy, 0);

    // Trajectory prediction line
    const trajectoryPoints = [];
    for (let t = 0; t <= 4; t += 0.1) {
      const x = -3 + vx * t;
      const y = 0.2 + vy * t - 0.5 * 9.81 * t * t;
      if (y > 0) trajectoryPoints.push(new THREE.Vector3(x, y, 0));
    }
    const trajectoryGeo = new THREE.BufferGeometry().setFromPoints(trajectoryPoints);
    const trajectoryMat = new THREE.LineBasicMaterial({ color: 0xF59E0B, linewidth: 2 });
    const trajectory = new THREE.Line(trajectoryGeo, trajectoryMat);
    scene.add(trajectory);

    return {
      platform, projectile, body, trajectory,
      getMaxHeight: () => vy * vy / (2 * 9.81),
      getRange: () => 2 * vx * vy / 9.81,
      getFlightTime: () => 2 * vy / 9.81
    };
  }
}

export default PBSEPhysicsEngine;
