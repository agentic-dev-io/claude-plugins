# Creative Frontend

Create distinctive, production-grade frontend interfaces with optional WebGPU 3D graphics.

## Skills

| Skill | Description |
|-------|-------------|
| frontend-design | Bold UI design with Next.js, React, Tailwind, shadcn/ui |
| webgpu-threejs-tsl | WebGPU 3D graphics with Three.js and TSL shaders |

## Features

- **Anti-AI-Slop Aesthetics** - Bold creative choices, distinctive typography, cohesive themes
- **Production Stack** - Next.js + React + Tailwind CSS + shadcn/ui
- **WebGPU 3D** - Three.js with TSL (Three.js Shading Language)
- **GPU Compute** - Particle systems, physics, instancing
- **Post-Processing** - Bloom, DOF, motion blur, custom effects

## Templates

### webgpu-next-project

Complete Next.js 15 project with:

```
src/
├── app/
│   ├── layout.tsx      # Root layout with fonts
│   ├── page.tsx        # Demo scene with TSL materials
│   └── globals.css     # CSS variables and utility classes
├── components/
│   └── WebGPUScene.tsx # Reusable WebGPU canvas component
└── lib/
    └── utils.ts        # Math and utility functions
```

### Component Templates

| Template | Description |
|----------|-------------|
| `WebGPUCanvas.tsx` | React canvas with renderer lifecycle |
| `NodeMaterial.tsx` | TSL material factories (fresnel, gradient, pulsing) |
| `ComputeShader.ts` | Particle systems, boids simulation, data processing |
| `PostProcessing.tsx` | Effect chain with presets (cinematic, retro, cyberpunk) |
| `types.ts` | TypeScript interfaces for all WebGPU components |

## Scripts

### Frontend Design

```bash
# Initialize new project
bash scripts/setup-project.sh my-app

# Add shadcn/ui components
bash scripts/add-components.sh
```

### WebGPU

```bash
# Check WebGPU support
bun run scripts/check-webgpu.ts
```

## Installation

```bash
cc --plugin-dir ./creative-frontend
```

## License

MIT
