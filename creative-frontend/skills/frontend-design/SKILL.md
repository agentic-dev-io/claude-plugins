---
name: frontend-design
description: This skill should be used when the user asks about "frontend design", "web UI", "landing page", "dashboard", "React component", "Next.js page", "Tailwind styling", "shadcn component", "beautiful website", or needs to build distinctive, production-grade web interfaces that avoid generic AI aesthetics.
---

# Frontend Design

Create distinctive, production-grade frontend interfaces with high design quality. Generate creative, polished code that avoids generic "AI slop" aesthetics.

## Core Rules

- Use the required stack: Next.js + React + Tailwind + shadcn/ui
- Prefer built-in features and existing components over custom wrappers
- Avoid boilerplate and overengineering; keep solutions minimal, useful, and composable
- When unsure, ask a clarifying question
- For human-in-the-loop flows, return explicit UI selections back to the LLM (see references/human-in-loop.md)
- Use bunx for one-off CLI invocations when appropriate (see references/tooling.md)

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:

- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme - brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian
- **Constraints**: Technical requirements (framework, performance, accessibility)
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

## Workflow

1. Confirm: user intent, page type, content needs, and target devices
2. Choose a bold aesthetic direction and name it explicitly
3. Map layout structure and component hierarchy using shadcn/ui where it fits
4. Implement with Tailwind, using CSS variables and a tight palette
5. Add motion intentionally (staggered reveals or one primary animation)
6. Validate accessibility basics (contrast, focus, keyboard)
7. Ask for clarification when requirements are ambiguous

## Aesthetics Guidelines

### Typography
Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics. Pair a distinctive display font with a refined body font.

### Color & Theme
Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.

### Motion
Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals creates more delight than scattered micro-interactions.

### Spatial Composition
Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.

### Backgrounds & Visual Details
Create atmosphere and depth rather than defaulting to solid colors. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

## Anti-Patterns to Avoid

NEVER use generic AI-generated aesthetics:
- Overused font families (Inter, Roboto, Arial, system fonts)
- Cliched color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics.

## Implementation Complexity

Match implementation complexity to the aesthetic vision:
- **Maximalist designs** need elaborate code with extensive animations and effects
- **Minimalist designs** need restraint, precision, and careful attention to spacing, typography, and subtle details

Elegance comes from executing the vision well.

## Additional Resources

### Reference Documentation

- **`references/aesthetics-prompt.md`** - Distilled aesthetics prompt and isolated prompts
- **`references/human-in-loop.md`** - UI -> LLM selection patterns
- **`references/tooling.md`** - bunx and local tooling conventions

### Scripts

- **`scripts/setup-project.sh`** - Initialize Next.js project with Tailwind and shadcn/ui
- **`scripts/add-components.sh`** - Batch add shadcn/ui components
