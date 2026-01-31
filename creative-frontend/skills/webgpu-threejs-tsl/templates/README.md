# WebGPU Three.js TSL Templates

TypeScript templates for building WebGPU-enabled Three.js applications with TSL.

## Project Template

**`webgpu-next-project/`** — Complete Next.js project with:
- WebGPU renderer setup with WebGL fallback
- TSL node materials
- TypeScript interfaces
- React component patterns
- Tailwind CSS styling

## Component Templates

| Template | Description |
|----------|-------------|
| `WebGPUCanvas.tsx` | React canvas component with renderer lifecycle |
| `NodeMaterial.tsx` | Custom TSL material with uniforms |
| `ComputeShader.ts` | GPU compute pipeline template |
| `PostProcessing.tsx` | Post-processing effects chain |

## Usage

Copy templates to your project and adapt:

```bash
# Copy project template
cp -r templates/webgpu-next-project/ my-project/
cd my-project && bun install

# Or copy individual components
cp templates/WebGPUCanvas.tsx components/
```
