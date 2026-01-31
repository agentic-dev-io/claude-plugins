# WebGPU Next.js Project

A Next.js 15 project template with WebGPU-enabled Three.js and TSL (Three.js Shading Language).

## Features

- **WebGPU Rendering** with automatic WebGL fallback
- **TSL Node Materials** for shader authoring in JavaScript
- **TypeScript** with strict mode
- **Tailwind CSS** for styling
- **React 19** with Server Components

## Getting Started

```bash
# Install dependencies
bun install

# Start development server
bun dev

# Build for production
bun build

# Type check
bun typecheck
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx      # Root layout with fonts
│   ├── page.tsx        # Main page with 3D scene
│   └── globals.css     # Global styles and CSS variables
├── components/
│   └── WebGPUScene.tsx # Reusable WebGPU scene component
└── lib/
    └── utils.ts        # Utility functions
```

## WebGPU Scene Component

The `WebGPUScene` component handles:

- Renderer initialization with WebGL fallback
- Resize handling
- Animation loop
- Error states

```tsx
import { WebGPUScene } from "@/components/WebGPUScene";

<WebGPUScene
  createContent={(scene, camera) => {
    // Add objects to scene
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Return optional frame callback
    return (deltaTime) => {
      mesh.rotation.y += deltaTime;
    };
  }}
  onFrame={(time, deltaTime) => {
    // Called each frame
  }}
  onReady={(renderer) => {
    // Renderer is ready
  }}
  background={0x000000}
  cameraPosition={[0, 0, 5]}
/>
```

## TSL Materials

Create custom materials using TSL:

```tsx
import * as THREE from "three/webgpu";
import { color, time, oscSine, normalWorld } from "three/tsl";

const material = new THREE.MeshStandardNodeMaterial();
material.colorNode = color(0xff0000).mul(oscSine(time));
```

## Browser Support

- **Chrome 113+** with WebGPU
- **Edge 113+** with WebGPU
- **Safari 18+** with WebGPU (macOS Sequoia, iOS 18)
- **Firefox** with WebGPU flag enabled

Falls back to WebGL 2 on unsupported browsers.
