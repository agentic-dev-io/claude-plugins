/**
 * WebGPU Three.js TSL Type Definitions
 */

import type { Object3D, Camera, Scene, WebGPURenderer } from 'three/webgpu';
import type { ShaderNodeObject, Node } from 'three/tsl';

// ============================================================================
// Renderer Types
// ============================================================================

export interface WebGPURendererConfig {
  /** Canvas element or selector */
  canvas?: HTMLCanvasElement | string;
  /** Enable antialiasing */
  antialias?: boolean;
  /** Pixel ratio (defaults to window.devicePixelRatio) */
  pixelRatio?: number;
  /** Enable alpha channel */
  alpha?: boolean;
  /** Power preference for GPU selection */
  powerPreference?: 'high-performance' | 'low-power' | 'default';
}

export interface RendererState {
  renderer: WebGPURenderer | null;
  isWebGPU: boolean;
  isInitialized: boolean;
  error: Error | null;
}

// ============================================================================
// Scene Types
// ============================================================================

export interface SceneConfig {
  /** Background color (hex or null for transparent) */
  background?: number | null;
  /** Enable fog */
  fog?: FogConfig | null;
  /** Environment map */
  environment?: EnvironmentConfig | null;
}

export interface FogConfig {
  type: 'linear' | 'exponential';
  color: number;
  near?: number;
  far?: number;
  density?: number;
}

export interface EnvironmentConfig {
  /** HDR environment map URL */
  url?: string;
  /** Environment intensity */
  intensity?: number;
  /** Use as background */
  background?: boolean;
}

// ============================================================================
// Camera Types
// ============================================================================

export interface CameraConfig {
  type: 'perspective' | 'orthographic';
  position?: [number, number, number];
  lookAt?: [number, number, number];
  fov?: number;
  near?: number;
  far?: number;
  zoom?: number;
}

// ============================================================================
// TSL Node Types
// ============================================================================

export type TSLNode = ShaderNodeObject<Node>;

export interface MaterialNodeConfig {
  /** Color node (replaces map/color) */
  colorNode?: TSLNode;
  /** Opacity node */
  opacityNode?: TSLNode;
  /** Roughness node (0-1) */
  roughnessNode?: TSLNode;
  /** Metalness node (0-1) */
  metalnessNode?: TSLNode;
  /** Normal map node */
  normalNode?: TSLNode;
  /** Emissive node */
  emissiveNode?: TSLNode;
  /** Position displacement node */
  positionNode?: TSLNode;
}

export interface PhysicalMaterialNodeConfig extends MaterialNodeConfig {
  /** Clearcoat intensity (0-1) */
  clearcoatNode?: TSLNode;
  /** Clearcoat roughness (0-1) */
  clearcoatRoughnessNode?: TSLNode;
  /** Transmission for glass (0-1) */
  transmissionNode?: TSLNode;
  /** Index of refraction */
  iorNode?: TSLNode;
  /** Iridescence intensity (0-1) */
  iridescenceNode?: TSLNode;
  /** Sheen intensity (0-1) */
  sheenNode?: TSLNode;
  /** Sheen color */
  sheenColorNode?: TSLNode;
}

// ============================================================================
// Uniform Types
// ============================================================================

export interface UniformValue<T> {
  value: T;
  node: TSLNode;
}

export interface AnimatedUniform<T> extends UniformValue<T> {
  /** Update function called each frame */
  update: (time: number, deltaTime: number) => T;
}

// ============================================================================
// Compute Shader Types
// ============================================================================

export interface ComputeConfig {
  /** Number of work groups or total invocations */
  count: number;
  /** Work group size [x, y, z] */
  workgroupSize?: [number, number, number];
}

export interface StorageBufferConfig {
  /** Number of elements */
  count: number;
  /** Element type */
  type: 'float' | 'vec2' | 'vec3' | 'vec4' | 'int' | 'uint';
  /** Initial data */
  data?: ArrayLike<number>;
}

export interface ComputePipeline {
  /** Compute shader node */
  compute: TSLNode;
  /** Storage buffers */
  buffers: Map<string, StorageBufferConfig>;
  /** Execute compute shader */
  dispatch: () => Promise<void>;
}

// ============================================================================
// Post-Processing Types
// ============================================================================

export interface PostProcessingConfig {
  /** Enable bloom effect */
  bloom?: BloomConfig;
  /** Enable depth of field */
  dof?: DepthOfFieldConfig;
  /** Enable motion blur */
  motionBlur?: MotionBlurConfig;
  /** Custom effect nodes */
  customEffects?: TSLNode[];
}

export interface BloomConfig {
  /** Bloom intensity */
  intensity?: number;
  /** Luminance threshold */
  threshold?: number;
  /** Blur radius */
  radius?: number;
}

export interface DepthOfFieldConfig {
  /** Focus distance */
  focus?: number;
  /** Aperture size */
  aperture?: number;
  /** Maximum blur */
  maxBlur?: number;
}

export interface MotionBlurConfig {
  /** Blur intensity */
  intensity?: number;
  /** Number of samples */
  samples?: number;
}

// ============================================================================
// Animation Types
// ============================================================================

export interface AnimationLoop {
  /** Start the animation loop */
  start: () => void;
  /** Stop the animation loop */
  stop: () => void;
  /** Check if running */
  isRunning: boolean;
  /** Current frame time */
  time: number;
  /** Delta time since last frame */
  deltaTime: number;
}

export type FrameCallback = (time: number, deltaTime: number) => void;

// ============================================================================
// React Hook Types
// ============================================================================

export interface UseWebGPURendererResult {
  /** Canvas ref to attach */
  canvasRef: React.RefObject<HTMLCanvasElement>;
  /** Renderer instance (null until initialized) */
  renderer: WebGPURenderer | null;
  /** Whether WebGPU is supported and initialized */
  isReady: boolean;
  /** Whether using WebGPU (vs WebGL fallback) */
  isWebGPU: boolean;
  /** Any initialization error */
  error: Error | null;
}

export interface UseAnimationLoopResult {
  /** Start animation */
  start: () => void;
  /** Stop animation */
  stop: () => void;
  /** Whether animation is running */
  isRunning: boolean;
}

export interface UseThreeSceneResult {
  /** Scene instance */
  scene: Scene;
  /** Camera instance */
  camera: Camera;
  /** Add object to scene */
  add: (object: Object3D) => void;
  /** Remove object from scene */
  remove: (object: Object3D) => void;
  /** Update camera aspect ratio */
  updateAspect: (width: number, height: number) => void;
}
