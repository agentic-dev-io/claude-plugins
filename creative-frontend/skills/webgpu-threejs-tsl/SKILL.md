---
name: webgpu-threejs-tsl
description: This skill should be used when the user asks about "WebGPU", "Three.js", "TSL", "3D graphics", "shaders", "WGSL", "compute shaders", "particle system", "post-processing effects", "node materials", or needs to build WebGPU-enabled Three.js applications with TSL (Three.js Shading Language).
---

# WebGPU Three.js with TSL

TSL (Three.js Shading Language) is a node-based shader abstraction that lets you write GPU shaders in JavaScript instead of GLSL/WGSL strings.

## Quick Start

```javascript
import * as THREE from 'three/webgpu';
import { color, time, oscSine } from 'three/tsl';

const renderer = new THREE.WebGPURenderer();
await renderer.init();

const material = new THREE.MeshStandardNodeMaterial();
material.colorNode = color(0xff0000).mul(oscSine(time));
```

## Key Concepts

### Import Pattern

```javascript
// Always use the WebGPU entry point
import * as THREE from 'three/webgpu';
import { /* TSL functions */ } from 'three/tsl';
```

### Node Materials

Replace standard material properties with TSL nodes:

```javascript
material.colorNode = texture(map);        // instead of material.map
material.roughnessNode = float(0.5);      // instead of material.roughness
material.positionNode = displaced;        // vertex displacement
```

### Method Chaining

TSL uses method chaining for operations:

```javascript
// Instead of: sin(time * 2.0 + offset) * 0.5 + 0.5
time.mul(2.0).add(offset).sin().mul(0.5).add(0.5)
```

### Custom Functions

Use `Fn()` for reusable shader logic:

```javascript
const fresnel = Fn(([power = 2.0]) => {
  const nDotV = normalWorld.dot(viewDir).saturate();
  return float(1.0).sub(nDotV).pow(power);
});
```

## When to Use This Skill

- Setting up Three.js with WebGPU renderer
- Creating custom shader materials with TSL
- Writing GPU compute shaders
- Building post-processing pipelines
- Migrating from GLSL to TSL
- Implementing visual effects (particles, water, terrain, etc.)

## Common Patterns

### Fresnel Effect

```javascript
const viewDir = cameraPosition.sub(positionWorld).normalize();
const fresnel = float(1).sub(normalWorld.dot(viewDir).saturate()).pow(3);
```

### Animated UV

```javascript
const animUV = uv().add(vec2(time.mul(0.1), 0));
```

### Dissolve Effect

```javascript
const noise = hash(positionLocal.mul(50));
If(noise.lessThan(threshold), () => Discard());
```

### Color Gradient

```javascript
const gradient = mix(colorA, colorB, positionLocal.y.mul(0.5).add(0.5));
```

## Constraints

- Provide a WebGL fallback when target browsers do not support WebGPU
- Keep shader complexity proportional to the scene
- Avoid heavy postprocessing unless explicitly requested
- Isolate the 3D canvas in its own component
- Keep UI state separate from the render loop

## Additional Resources

### Reference Documentation

- **`references/core-concepts.md`** - Types, operators, uniforms, control flow
- **`references/materials.md`** - Node materials and all properties
- **`references/compute-shaders.md`** - GPU compute with instanced arrays
- **`references/post-processing.md`** - Built-in and custom effects
- **`references/wgsl-integration.md`** - Custom WGSL functions
- **`references/quick-reference.md`** - TSL cheatsheet

### Project Templates

- **`templates/webgpu-next-project/`** - Complete Next.js project with WebGPU renderer, TSL materials, and Tailwind CSS
- **`templates/types.ts`** - TypeScript interfaces for renderer, materials, compute, and post-processing
- **`templates/WebGPUCanvas.tsx`** - React canvas component with lifecycle management
- **`templates/NodeMaterial.tsx`** - TSL material factory functions and presets
- **`templates/ComputeShader.ts`** - Particle systems, boids, and GPU data processing
- **`templates/PostProcessing.tsx`** - Effect chain with vignette, grain, scanlines, color grading

### Scripts

- **`scripts/check-webgpu.ts`** - Check WebGPU support and adapter info

## External Resources

- [Three.js TSL Wiki](https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language)
- [WebGPU Examples](https://github.com/mrdoob/three.js/tree/master/examples) (files prefixed with `webgpu_`)
