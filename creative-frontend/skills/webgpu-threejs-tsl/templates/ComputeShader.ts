/**
 * Compute Shader Template
 *
 * GPU compute pipelines using TSL for particle systems,
 * physics simulations, and data processing.
 */

import * as THREE from "three/webgpu";
import {
  float,
  vec3,
  vec4,
  uniform,
  instanceIndex,
  instancedArray,
  hash,
  time,
  sin,
  cos,
  Fn,
  If,
  Loop,
} from "three/tsl";
import type { ComputeConfig, StorageBufferConfig } from "./types";

// ============================================================================
// Type Definitions
// ============================================================================

interface ParticleSystemConfig {
  /** Number of particles */
  count: number;
  /** Spawn bounds */
  bounds?: {
    min: [number, number, number];
    max: [number, number, number];
  };
  /** Particle lifetime in seconds */
  lifetime?: number;
  /** Gravity vector */
  gravity?: [number, number, number];
  /** Initial velocity range */
  velocityRange?: {
    min: [number, number, number];
    max: [number, number, number];
  };
}

interface ParticleSystem {
  /** Position buffer (vec3 per particle) */
  positions: ReturnType<typeof instancedArray>;
  /** Velocity buffer (vec3 per particle) */
  velocities: ReturnType<typeof instancedArray>;
  /** Life buffer (float per particle: remaining life) */
  lifetimes: ReturnType<typeof instancedArray>;
  /** Update compute shader */
  updateCompute: ReturnType<typeof Fn>;
  /** Points mesh for rendering */
  mesh: THREE.Points;
  /** Execute one update step */
  update: (renderer: THREE.WebGPURenderer) => Promise<void>;
  /** Dispose resources */
  dispose: () => void;
}

// ============================================================================
// Particle System Factory
// ============================================================================

export function createParticleSystem(
  config: ParticleSystemConfig
): ParticleSystem {
  const {
    count,
    bounds = { min: [-5, 0, -5], max: [5, 10, 5] },
    lifetime = 5.0,
    gravity = [0, -9.8, 0],
    velocityRange = {
      min: [-1, 2, -1],
      max: [1, 5, 1],
    },
  } = config;

  // Create storage buffers
  const positions = instancedArray(count, "vec3");
  const velocities = instancedArray(count, "vec3");
  const lifetimes = instancedArray(count, "float");

  // Uniforms
  const uDeltaTime = uniform(0.016);
  const uTime = uniform(0.0);
  const uLifetime = uniform(lifetime);
  const uGravity = uniform(new THREE.Vector3(...gravity));
  const uBoundsMin = uniform(new THREE.Vector3(...bounds.min));
  const uBoundsMax = uniform(new THREE.Vector3(...bounds.max));
  const uVelMin = uniform(new THREE.Vector3(...velocityRange.min));
  const uVelMax = uniform(new THREE.Vector3(...velocityRange.max));

  // Initialize particles
  const initCompute = Fn(() => {
    const i = instanceIndex;

    // Random position within bounds
    const randPos = hash(i.add(uTime.mul(1000)));
    const pos = positions.element(i);
    pos.x.assign(uBoundsMin.x.add(randPos.mul(uBoundsMax.x.sub(uBoundsMin.x))));
    pos.y.assign(uBoundsMin.y.add(hash(i.add(1)).mul(uBoundsMax.y.sub(uBoundsMin.y))));
    pos.z.assign(uBoundsMin.z.add(hash(i.add(2)).mul(uBoundsMax.z.sub(uBoundsMin.z))));

    // Random velocity
    const randVel = hash(i.add(3));
    const vel = velocities.element(i);
    vel.x.assign(uVelMin.x.add(randVel.mul(uVelMax.x.sub(uVelMin.x))));
    vel.y.assign(uVelMin.y.add(hash(i.add(4)).mul(uVelMax.y.sub(uVelMin.y))));
    vel.z.assign(uVelMin.z.add(hash(i.add(5)).mul(uVelMax.z.sub(uVelMin.z))));

    // Random initial lifetime
    lifetimes.element(i).assign(hash(i.add(6)).mul(uLifetime));
  })().compute(count);

  // Update particles each frame
  const updateCompute = Fn(() => {
    const i = instanceIndex;
    const pos = positions.element(i);
    const vel = velocities.element(i);
    const life = lifetimes.element(i);

    // Apply gravity
    vel.addAssign(uGravity.mul(uDeltaTime));

    // Update position
    pos.addAssign(vel.mul(uDeltaTime));

    // Decrease lifetime
    life.subAssign(uDeltaTime);

    // Respawn if dead
    If(life.lessThan(0), () => {
      // Reset position
      const randPos = hash(i.add(uTime.mul(1000)));
      pos.x.assign(uBoundsMin.x.add(randPos.mul(uBoundsMax.x.sub(uBoundsMin.x))));
      pos.y.assign(uBoundsMax.y);
      pos.z.assign(uBoundsMin.z.add(hash(i.add(uTime)).mul(uBoundsMax.z.sub(uBoundsMin.z))));

      // Reset velocity
      const randVel = hash(i.add(uTime.mul(500)));
      vel.x.assign(uVelMin.x.add(randVel.mul(uVelMax.x.sub(uVelMin.x))));
      vel.y.assign(uVelMin.y.add(hash(i.add(uTime.mul(600))).mul(uVelMax.y.sub(uVelMin.y))));
      vel.z.assign(uVelMin.z.add(hash(i.add(uTime.mul(700))).mul(uVelMax.z.sub(uVelMin.z))));

      // Reset lifetime
      life.assign(uLifetime);
    });
  })().compute(count);

  // Create points material
  const material = new THREE.PointsNodeMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  // Use positions buffer for rendering
  material.positionNode = positions.toAttribute();

  // Color based on lifetime
  const lifeRatio = lifetimes.toAttribute().div(uLifetime);
  material.colorNode = vec4(
    lifeRatio,
    lifeRatio.mul(0.5),
    float(1).sub(lifeRatio),
    lifeRatio.mul(0.8)
  );

  // Point size
  material.sizeNode = lifeRatio.mul(10).add(2);

  // Create geometry
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(new Float32Array(count * 3), 3)
  );
  geometry.setDrawRange(0, count);

  const mesh = new THREE.Points(geometry, material);

  // Time tracking
  let lastTime = performance.now();

  return {
    positions,
    velocities,
    lifetimes,
    updateCompute,
    mesh,

    async update(renderer: THREE.WebGPURenderer) {
      const now = performance.now();
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;

      uDeltaTime.value = Math.min(deltaTime, 0.1); // Cap delta
      uTime.value = now / 1000;

      await renderer.computeAsync(updateCompute);
    },

    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}

// ============================================================================
// Boid Simulation
// ============================================================================

interface BoidConfig {
  /** Number of boids */
  count: number;
  /** Perception radius for neighbors */
  perceptionRadius?: number;
  /** Separation force weight */
  separation?: number;
  /** Alignment force weight */
  alignment?: number;
  /** Cohesion force weight */
  cohesion?: number;
  /** Maximum speed */
  maxSpeed?: number;
  /** Maximum steering force */
  maxForce?: number;
}

export function createBoidSystem(config: BoidConfig) {
  const {
    count,
    perceptionRadius = 2.5,
    separation = 1.5,
    alignment = 1.0,
    cohesion = 1.0,
    maxSpeed = 3.0,
    maxForce = 0.5,
  } = config;

  // Storage buffers
  const positions = instancedArray(count, "vec3");
  const velocities = instancedArray(count, "vec3");

  // Uniforms
  const uDeltaTime = uniform(0.016);
  const uPerceptionRadius = uniform(perceptionRadius);
  const uSeparation = uniform(separation);
  const uAlignment = uniform(alignment);
  const uCohesion = uniform(cohesion);
  const uMaxSpeed = uniform(maxSpeed);
  const uMaxForce = uniform(maxForce);

  // Boid update compute shader
  const updateBoids = Fn(() => {
    const i = instanceIndex;
    const pos = positions.element(i);
    const vel = velocities.element(i);

    // Accumulate forces from neighbors
    const separationForce = vec3(0, 0, 0).toVar();
    const alignmentForce = vec3(0, 0, 0).toVar();
    const cohesionCenter = vec3(0, 0, 0).toVar();
    const neighborCount = float(0).toVar();

    // Check all other boids
    Loop(count, ({ i: j }) => {
      If(j.notEqual(i), () => {
        const otherPos = positions.element(j);
        const otherVel = velocities.element(j);
        const diff = pos.sub(otherPos);
        const dist = diff.length();

        If(dist.lessThan(uPerceptionRadius), () => {
          // Separation: steer away from close neighbors
          separationForce.addAssign(diff.normalize().div(dist.max(0.001)));

          // Alignment: match velocity of neighbors
          alignmentForce.addAssign(otherVel);

          // Cohesion: move towards center of neighbors
          cohesionCenter.addAssign(otherPos);

          neighborCount.addAssign(1);
        });
      });
    });

    // Average and apply forces
    If(neighborCount.greaterThan(0), () => {
      // Separation
      const sepForce = separationForce.div(neighborCount).normalize().mul(uSeparation);

      // Alignment
      const alignForce = alignmentForce.div(neighborCount).normalize().mul(uAlignment);

      // Cohesion
      const cohCenter = cohesionCenter.div(neighborCount);
      const cohForce = cohCenter.sub(pos).normalize().mul(uCohesion);

      // Apply forces
      vel.addAssign(sepForce.add(alignForce).add(cohForce).mul(uMaxForce).mul(uDeltaTime));
    });

    // Limit speed
    const speed = vel.length();
    If(speed.greaterThan(uMaxSpeed), () => {
      vel.assign(vel.div(speed).mul(uMaxSpeed));
    });

    // Update position
    pos.addAssign(vel.mul(uDeltaTime));

    // Wrap around bounds
    const bounds = float(20);
    If(pos.x.greaterThan(bounds), () => pos.x.assign(bounds.negate()));
    If(pos.x.lessThan(bounds.negate()), () => pos.x.assign(bounds));
    If(pos.y.greaterThan(bounds), () => pos.y.assign(bounds.negate()));
    If(pos.y.lessThan(bounds.negate()), () => pos.y.assign(bounds));
    If(pos.z.greaterThan(bounds), () => pos.z.assign(bounds.negate()));
    If(pos.z.lessThan(bounds.negate()), () => pos.z.assign(bounds));
  })().compute(count);

  return {
    positions,
    velocities,
    compute: updateBoids,
    uniforms: {
      deltaTime: uDeltaTime,
      perceptionRadius: uPerceptionRadius,
      separation: uSeparation,
      alignment: uAlignment,
      cohesion: uCohesion,
      maxSpeed: uMaxSpeed,
      maxForce: uMaxForce,
    },
  };
}

// ============================================================================
// Data Processing Compute
// ============================================================================

interface DataProcessConfig {
  /** Input data length */
  length: number;
  /** Processing function type */
  operation: "sum" | "average" | "max" | "min" | "normalize";
}

export function createDataProcessor(config: DataProcessConfig) {
  const { length, operation } = config;

  const input = instancedArray(length, "float");
  const output = instancedArray(length, "float");
  const result = instancedArray(1, "float"); // Single result for reductions

  // Different compute operations
  const operations = {
    normalize: Fn(() => {
      const i = instanceIndex;
      const val = input.element(i);
      // Simple normalization to 0-1 range (assumes data is 0-100)
      output.element(i).assign(val.div(100).clamp(0, 1));
    })().compute(length),

    sum: Fn(() => {
      // Note: True parallel reduction requires more complex implementation
      // This is a simplified version
      const i = instanceIndex;
      If(i.equal(0), () => {
        const sum = float(0).toVar();
        Loop(length, ({ i: j }) => {
          sum.addAssign(input.element(j));
        });
        result.element(0).assign(sum);
      });
    })().compute(1),

    average: Fn(() => {
      const i = instanceIndex;
      If(i.equal(0), () => {
        const sum = float(0).toVar();
        Loop(length, ({ i: j }) => {
          sum.addAssign(input.element(j));
        });
        result.element(0).assign(sum.div(float(length)));
      });
    })().compute(1),

    max: Fn(() => {
      const i = instanceIndex;
      If(i.equal(0), () => {
        const maxVal = float(-999999).toVar();
        Loop(length, ({ i: j }) => {
          const val = input.element(j);
          If(val.greaterThan(maxVal), () => {
            maxVal.assign(val);
          });
        });
        result.element(0).assign(maxVal);
      });
    })().compute(1),

    min: Fn(() => {
      const i = instanceIndex;
      If(i.equal(0), () => {
        const minVal = float(999999).toVar();
        Loop(length, ({ i: j }) => {
          const val = input.element(j);
          If(val.lessThan(minVal), () => {
            minVal.assign(val);
          });
        });
        result.element(0).assign(minVal);
      });
    })().compute(1),
  };

  return {
    input,
    output,
    result,
    compute: operations[operation],
  };
}

export default createParticleSystem;
