"use client";

/**
 * TSL Node Material Component
 *
 * React component demonstrating custom TSL materials with uniforms,
 * animations, and common shader patterns.
 */

import { useEffect, useRef, useMemo } from "react";
import * as THREE from "three/webgpu";
import {
  float,
  vec3,
  vec4,
  color,
  uniform,
  uv,
  time,
  normalWorld,
  positionWorld,
  cameraPosition,
  sin,
  cos,
  mix,
  Fn,
} from "three/tsl";
import type { TSLNode, MaterialNodeConfig } from "./types";

// ============================================================================
// Material Factory Functions
// ============================================================================

interface AnimatedMaterialConfig {
  /** Base color */
  baseColor?: number;
  /** Secondary color for effects */
  secondaryColor?: number;
  /** Animation speed multiplier */
  speed?: number;
  /** Roughness value (0-1) */
  roughness?: number;
  /** Metalness value (0-1) */
  metalness?: number;
}

/**
 * Creates an animated gradient material
 */
export function createGradientMaterial(
  config: AnimatedMaterialConfig = {}
): THREE.MeshStandardNodeMaterial {
  const {
    baseColor = 0x4a90d9,
    secondaryColor = 0xd94a90,
    speed = 1.0,
    roughness = 0.5,
    metalness = 0.0,
  } = config;

  const material = new THREE.MeshStandardNodeMaterial();

  // Animated color gradient based on world position
  const gradient = mix(
    color(baseColor),
    color(secondaryColor),
    positionWorld.y.mul(0.5).add(0.5).add(sin(time.mul(speed)).mul(0.2))
  );

  material.colorNode = gradient;
  material.roughnessNode = float(roughness);
  material.metalnessNode = float(metalness);

  return material;
}

/**
 * Creates a fresnel rim-lit material
 */
export function createFresnelMaterial(
  config: AnimatedMaterialConfig = {}
): THREE.MeshStandardNodeMaterial {
  const {
    baseColor = 0x1a1a2e,
    secondaryColor = 0x00ffff,
    roughness = 0.3,
    metalness = 0.0,
  } = config;

  const material = new THREE.MeshStandardNodeMaterial();

  // Fresnel calculation
  const viewDir = cameraPosition.sub(positionWorld).normalize();
  const fresnel = float(1).sub(normalWorld.dot(viewDir).saturate()).pow(3);

  // Apply fresnel to color
  const baseCol = color(baseColor);
  const rimCol = color(secondaryColor);
  material.colorNode = mix(baseCol, rimCol, fresnel);

  // Add emissive rim
  material.emissiveNode = rimCol.mul(fresnel.mul(0.5));

  material.roughnessNode = float(roughness);
  material.metalnessNode = float(metalness);

  return material;
}

/**
 * Creates a pulsing emissive material
 */
export function createPulsingMaterial(
  config: AnimatedMaterialConfig = {}
): THREE.MeshStandardNodeMaterial {
  const {
    baseColor = 0x2a2a3a,
    secondaryColor = 0xff6b35,
    speed = 2.0,
    roughness = 0.4,
    metalness = 0.1,
  } = config;

  const material = new THREE.MeshStandardNodeMaterial();

  // Pulsing intensity
  const pulse = sin(time.mul(speed)).mul(0.5).add(0.5);

  material.colorNode = color(baseColor);
  material.emissiveNode = color(secondaryColor).mul(pulse);
  material.roughnessNode = float(roughness);
  material.metalnessNode = float(metalness);

  return material;
}

/**
 * Creates a UV-animated texture material
 */
export function createAnimatedUVMaterial(
  texture: THREE.Texture,
  scrollSpeed: [number, number] = [0.1, 0.0]
): THREE.MeshStandardNodeMaterial {
  const material = new THREE.MeshStandardNodeMaterial();

  // Animated UV coordinates
  const animatedUV = uv().add(
    vec3(
      time.mul(scrollSpeed[0]),
      time.mul(scrollSpeed[1]),
      float(0)
    ).xy
  );

  // Sample texture with animated UVs
  const tex = new THREE.TextureNode(texture);
  material.colorNode = tex.uv(animatedUV);

  return material;
}

// ============================================================================
// Custom Shader Functions
// ============================================================================

/**
 * Simple noise function for shader effects
 */
export const hash = Fn(([p]: [TSLNode]) => {
  return p.dot(vec3(12.9898, 78.233, 45.543)).sin().mul(43758.5453).fract();
});

/**
 * Dissolve effect function
 */
export const dissolve = Fn(([threshold]: [TSLNode]) => {
  const noise = hash(positionWorld.mul(50));
  return noise.greaterThan(threshold);
});

// ============================================================================
// React Component
// ============================================================================

interface NodeMaterialDemoProps {
  /** Material type to demonstrate */
  type?: "gradient" | "fresnel" | "pulsing";
  /** Material configuration */
  config?: AnimatedMaterialConfig;
  /** Geometry to use */
  geometry?: THREE.BufferGeometry;
  /** Position */
  position?: [number, number, number];
  /** Scale */
  scale?: number;
  /** Called with mesh ref */
  onMeshReady?: (mesh: THREE.Mesh) => void;
}

export function NodeMaterialDemo({
  type = "fresnel",
  config = {},
  geometry,
  position = [0, 0, 0],
  scale = 1,
  onMeshReady,
}: NodeMaterialDemoProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const material = useMemo(() => {
    switch (type) {
      case "gradient":
        return createGradientMaterial(config);
      case "pulsing":
        return createPulsingMaterial(config);
      case "fresnel":
      default:
        return createFresnelMaterial(config);
    }
  }, [type, config]);

  const geo = useMemo(() => {
    return geometry ?? new THREE.SphereGeometry(1, 64, 64);
  }, [geometry]);

  useEffect(() => {
    if (meshRef.current) {
      onMeshReady?.(meshRef.current);
    }
  }, [onMeshReady]);

  useEffect(() => {
    return () => {
      material.dispose();
      if (!geometry) {
        geo.dispose();
      }
    };
  }, [material, geo, geometry]);

  // Note: This component returns mesh data for use with r3f or manual scene management
  // For vanilla Three.js, use the factory functions directly

  return null; // Render handled externally
}

// ============================================================================
// Material Presets
// ============================================================================

export const materialPresets = {
  neon: {
    baseColor: 0x0a0a0f,
    secondaryColor: 0x00ff88,
    roughness: 0.1,
    metalness: 0.0,
  },
  lava: {
    baseColor: 0x1a0a00,
    secondaryColor: 0xff4400,
    speed: 0.5,
    roughness: 0.8,
    metalness: 0.0,
  },
  ice: {
    baseColor: 0xc4e0f0,
    secondaryColor: 0x4080ff,
    roughness: 0.05,
    metalness: 0.1,
  },
  hologram: {
    baseColor: 0x001020,
    secondaryColor: 0x00ffff,
    speed: 3.0,
    roughness: 0.0,
    metalness: 0.0,
  },
  bronze: {
    baseColor: 0x8b4513,
    secondaryColor: 0xffd700,
    roughness: 0.4,
    metalness: 0.8,
  },
} as const;

export type MaterialPreset = keyof typeof materialPresets;

export default NodeMaterialDemo;
