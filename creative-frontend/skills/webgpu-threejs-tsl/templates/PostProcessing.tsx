"use client";

/**
 * Post-Processing Pipeline Template
 *
 * TSL-based post-processing effects with composition support.
 */

import { useMemo, useEffect, useCallback } from "react";
import * as THREE from "three/webgpu";
import {
  float,
  vec2,
  vec3,
  vec4,
  color,
  uniform,
  uv,
  time,
  texture,
  screenUV,
  sin,
  cos,
  abs,
  max,
  min,
  mix,
  step,
  smoothstep,
  fract,
  length,
  dot,
  Fn,
  Loop,
} from "three/tsl";
import { pass } from "three/tsl";
import type { PostProcessingConfig, TSLNode } from "./types";

// ============================================================================
// Type Definitions
// ============================================================================

interface EffectConfig {
  enabled?: boolean;
  intensity?: number;
}

interface VignetteConfig extends EffectConfig {
  /** Vignette radius (0-1) */
  radius?: number;
  /** Softness of the vignette edge */
  softness?: number;
}

interface ChromaticAberrationConfig extends EffectConfig {
  /** Offset amount in pixels */
  offset?: number;
}

interface FilmGrainConfig extends EffectConfig {
  /** Grain size */
  size?: number;
}

interface ScanlineConfig extends EffectConfig {
  /** Line density */
  density?: number;
  /** Line opacity */
  opacity?: number;
}

interface GlitchConfig extends EffectConfig {
  /** Glitch frequency */
  frequency?: number;
  /** Block size */
  blockSize?: number;
}

// ============================================================================
// Effect Factory Functions
// ============================================================================

/**
 * Creates a vignette effect node
 */
export function createVignetteEffect(config: VignetteConfig = {}): TSLNode {
  const { radius = 0.5, softness = 0.5, intensity = 1.0 } = config;

  const uRadius = uniform(radius);
  const uSoftness = uniform(softness);
  const uIntensity = uniform(intensity);

  return Fn(([inputColor]: [TSLNode]) => {
    const uv = screenUV;
    const center = vec2(0.5, 0.5);
    const dist = length(uv.sub(center));
    const vignette = smoothstep(uRadius, uRadius.sub(uSoftness), dist);
    return inputColor.mul(mix(float(1), vignette, uIntensity));
  });
}

/**
 * Creates a chromatic aberration effect
 */
export function createChromaticAberrationEffect(
  config: ChromaticAberrationConfig = {}
): TSLNode {
  const { offset = 2.0, intensity = 1.0 } = config;

  const uOffset = uniform(offset);
  const uIntensity = uniform(intensity);

  return Fn(([inputTexture]: [TSLNode]) => {
    const uv = screenUV;
    const direction = uv.sub(vec2(0.5)).normalize();
    const offsetVec = direction.mul(uOffset).mul(0.001).mul(uIntensity);

    // Sample RGB channels with offset
    const r = texture(inputTexture, uv.add(offsetVec)).r;
    const g = texture(inputTexture, uv).g;
    const b = texture(inputTexture, uv.sub(offsetVec)).b;

    return vec4(r, g, b, float(1));
  });
}

/**
 * Creates a film grain effect
 */
export function createFilmGrainEffect(config: FilmGrainConfig = {}): TSLNode {
  const { size = 1.0, intensity = 0.1 } = config;

  const uSize = uniform(size);
  const uIntensity = uniform(intensity);

  return Fn(([inputColor]: [TSLNode]) => {
    const uv = screenUV;

    // Generate noise based on UV and time
    const noise = fract(
      sin(
        dot(uv.mul(uSize).add(time.mul(100)), vec2(12.9898, 78.233))
      ).mul(43758.5453)
    );

    // Apply grain
    const grain = noise.sub(0.5).mul(uIntensity);
    return inputColor.add(vec4(grain, grain, grain, float(0)));
  });
}

/**
 * Creates a scanline effect
 */
export function createScanlineEffect(config: ScanlineConfig = {}): TSLNode {
  const { density = 100, opacity = 0.1, intensity = 1.0 } = config;

  const uDensity = uniform(density);
  const uOpacity = uniform(opacity);
  const uIntensity = uniform(intensity);

  return Fn(([inputColor]: [TSLNode]) => {
    const uv = screenUV;

    // Create scanlines
    const scanline = sin(uv.y.mul(uDensity).mul(3.14159)).mul(0.5).add(0.5);
    const scanlineEffect = mix(float(1), scanline, uOpacity.mul(uIntensity));

    return inputColor.mul(scanlineEffect);
  });
}

/**
 * Creates a glitch effect
 */
export function createGlitchEffect(config: GlitchConfig = {}): TSLNode {
  const { frequency = 0.1, blockSize = 0.1, intensity = 1.0 } = config;

  const uFrequency = uniform(frequency);
  const uBlockSize = uniform(blockSize);
  const uIntensity = uniform(intensity);

  return Fn(([inputTexture]: [TSLNode]) => {
    const uv = screenUV;

    // Random glitch trigger
    const glitchTime = time.mul(uFrequency);
    const glitchActive = step(0.95, fract(glitchTime.mul(17.0)));

    // Block displacement
    const blockY = fract(uv.y.div(uBlockSize)).mul(uBlockSize);
    const noise = fract(sin(blockY.add(glitchTime).mul(12345.6789)).mul(43758.5453));
    const offset = noise.sub(0.5).mul(uIntensity).mul(glitchActive).mul(0.1);

    // Displaced UV
    const glitchUV = vec2(uv.x.add(offset), uv.y);

    // Color separation during glitch
    const r = texture(inputTexture, glitchUV.add(vec2(offset.mul(0.5), 0))).r;
    const g = texture(inputTexture, glitchUV).g;
    const b = texture(inputTexture, glitchUV.sub(vec2(offset.mul(0.5), 0))).b;

    // Mix with original
    const glitched = vec4(r, g, b, float(1));
    const original = texture(inputTexture, uv);

    return mix(original, glitched, glitchActive.mul(uIntensity));
  });
}

/**
 * Creates a color grading LUT-style effect
 */
export function createColorGradingEffect(config: {
  shadows?: number;
  midtones?: number;
  highlights?: number;
  saturation?: number;
  contrast?: number;
} = {}): TSLNode {
  const {
    shadows = 0x1a1a2e,
    midtones = 0x4a4a6a,
    highlights = 0xffffff,
    saturation = 1.0,
    contrast = 1.0,
  } = config;

  const uShadows = uniform(new THREE.Color(shadows));
  const uMidtones = uniform(new THREE.Color(midtones));
  const uHighlights = uniform(new THREE.Color(highlights));
  const uSaturation = uniform(saturation);
  const uContrast = uniform(contrast);

  return Fn(([inputColor]: [TSLNode]) => {
    // Extract RGB
    const col = inputColor.rgb;

    // Calculate luminance
    const luma = dot(col, vec3(0.299, 0.587, 0.114));

    // Apply three-way color grading
    const shadowWeight = float(1).sub(luma).pow(2);
    const highlightWeight = luma.pow(2);
    const midtoneWeight = float(1).sub(shadowWeight).sub(highlightWeight).max(0);

    const graded = col
      .mul(uShadows.mul(shadowWeight))
      .add(col.mul(uMidtones.mul(midtoneWeight)))
      .add(col.mul(uHighlights.mul(highlightWeight)));

    // Apply saturation
    const desaturated = vec3(luma, luma, luma);
    const saturated = mix(desaturated, graded, uSaturation);

    // Apply contrast
    const contrasted = saturated.sub(0.5).mul(uContrast).add(0.5);

    return vec4(contrasted.clamp(0, 1), inputColor.a);
  });
}

// ============================================================================
// Post-Processing Pipeline
// ============================================================================

interface PostProcessingPipeline {
  /** Three.js PostProcessing instance */
  postProcessing: THREE.PostProcessing;
  /** Update uniforms */
  update: (deltaTime: number) => void;
  /** Render the pipeline */
  render: () => void;
  /** Dispose resources */
  dispose: () => void;
}

interface PipelineConfig {
  renderer: THREE.WebGPURenderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
  effects?: {
    vignette?: VignetteConfig | false;
    chromaticAberration?: ChromaticAberrationConfig | false;
    filmGrain?: FilmGrainConfig | false;
    scanlines?: ScanlineConfig | false;
    glitch?: GlitchConfig | false;
    colorGrading?: Parameters<typeof createColorGradingEffect>[0] | false;
  };
}

export function createPostProcessingPipeline(
  config: PipelineConfig
): PostProcessingPipeline {
  const { renderer, scene, camera, effects = {} } = config;

  const postProcessing = new THREE.PostProcessing(renderer);

  // Create scene pass
  const scenePass = pass(scene, camera);
  let outputNode: TSLNode = scenePass.getTextureNode("output");

  // Chain effects
  if (effects.vignette !== false) {
    const vignetteEffect = createVignetteEffect(effects.vignette ?? {});
    outputNode = vignetteEffect(outputNode);
  }

  if (effects.filmGrain !== false && effects.filmGrain) {
    const grainEffect = createFilmGrainEffect(effects.filmGrain);
    outputNode = grainEffect(outputNode);
  }

  if (effects.scanlines !== false && effects.scanlines) {
    const scanlineEffect = createScanlineEffect(effects.scanlines);
    outputNode = scanlineEffect(outputNode);
  }

  if (effects.colorGrading !== false && effects.colorGrading) {
    const gradingEffect = createColorGradingEffect(effects.colorGrading);
    outputNode = gradingEffect(outputNode);
  }

  // Note: Chromatic aberration and glitch require texture input, not color
  // These would need different handling in a full implementation

  postProcessing.outputNode = outputNode;

  return {
    postProcessing,

    update(deltaTime: number) {
      // Update any animated uniforms here
    },

    render() {
      postProcessing.render();
    },

    dispose() {
      // Cleanup
    },
  };
}

// ============================================================================
// React Hook
// ============================================================================

interface UsePostProcessingOptions {
  renderer: THREE.WebGPURenderer | null;
  scene: THREE.Scene | null;
  camera: THREE.Camera | null;
  effects?: PipelineConfig["effects"];
}

export function usePostProcessing(options: UsePostProcessingOptions) {
  const { renderer, scene, camera, effects } = options;

  const pipeline = useMemo(() => {
    if (!renderer || !scene || !camera) return null;

    return createPostProcessingPipeline({
      renderer,
      scene,
      camera,
      effects,
    });
  }, [renderer, scene, camera, effects]);

  useEffect(() => {
    return () => {
      pipeline?.dispose();
    };
  }, [pipeline]);

  const render = useCallback(() => {
    pipeline?.render();
  }, [pipeline]);

  return { pipeline, render };
}

// ============================================================================
// Preset Configurations
// ============================================================================

export const postProcessingPresets = {
  cinematic: {
    vignette: { radius: 0.6, softness: 0.4, intensity: 0.8 },
    filmGrain: { intensity: 0.05, size: 1.0 },
    colorGrading: {
      shadows: 0x1a1a2e,
      highlights: 0xfff5e6,
      contrast: 1.1,
      saturation: 0.9,
    },
  },
  retro: {
    vignette: { radius: 0.4, softness: 0.6, intensity: 1.0 },
    scanlines: { density: 150, opacity: 0.15 },
    filmGrain: { intensity: 0.1, size: 2.0 },
    colorGrading: {
      saturation: 0.7,
      contrast: 1.2,
    },
  },
  cyberpunk: {
    vignette: { radius: 0.5, softness: 0.3, intensity: 0.6 },
    chromaticAberration: { offset: 3.0, intensity: 0.8 },
    scanlines: { density: 200, opacity: 0.08 },
    colorGrading: {
      shadows: 0x0a0a1f,
      midtones: 0x4a2a6a,
      highlights: 0x00ffff,
      saturation: 1.2,
    },
  },
  horror: {
    vignette: { radius: 0.3, softness: 0.5, intensity: 1.0 },
    filmGrain: { intensity: 0.15, size: 1.5 },
    colorGrading: {
      shadows: 0x0a0a0a,
      midtones: 0x2a2a2a,
      saturation: 0.5,
      contrast: 1.3,
    },
  },
  clean: {
    vignette: { radius: 0.7, softness: 0.5, intensity: 0.3 },
    colorGrading: {
      saturation: 1.0,
      contrast: 1.0,
    },
  },
} as const;

export type PostProcessingPreset = keyof typeof postProcessingPresets;

export default createPostProcessingPipeline;
