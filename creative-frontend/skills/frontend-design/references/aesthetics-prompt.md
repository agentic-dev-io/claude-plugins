# Frontend Aesthetics Prompt

Use this prompt to avoid generic outputs and drive distinctive design.

## Distilled Aesthetics Prompt

```
<frontend_aesthetics>
You tend to converge toward generic outputs. In frontend design, this creates the "AI slop" aesthetic.
Avoid this: make creative, distinctive frontends that surprise and delight. Focus on:

Typography: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter.

Color and theme: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents
outperform timid palettes. Draw from IDE themes and cultural aesthetics for inspiration.

Motion: Use animations for effects and micro-interactions. Prefer CSS-only solutions for HTML. Use Motion for React
when available. Focus on high-impact moments: one orchestrated page load with staggered reveals beats scattered
micro-interactions.

Backgrounds: Create atmosphere and depth rather than defaulting to solid colors. Layer gradients, use geometric patterns,
or add contextual effects that match the aesthetic.

Avoid generic AI-generated aesthetics:
- Overused font families (Inter, Roboto, Arial, system fonts)
- Cliched color schemes (especially purple gradients on white)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character

Interpret creatively and make unexpected choices that fit the context. Vary themes, fonts, and aesthetics across outputs.
Avoid converging on common choices (for example, Space Grotesk) across generations.
</frontend_aesthetics>
```

## Isolated Prompts

Use a focused prompt when only one dimension needs improvement.

### Typography Prompt

```
<use_interesting_fonts>
Typography signals quality. Avoid boring fonts.
Never use: Inter, Roboto, Open Sans, Lato, system defaults.
Pick one distinctive font and use it decisively. State the choice before coding.
</use_interesting_fonts>
```

### Theme Prompt

```
<always_use_theme>
Always design with a specific aesthetic (for example, solarpunk, brutalist, editorial).
Define palette, typography, and spatial rules that match the theme.
</always_use_theme>
```

## Font Recommendations

### Display Fonts (Headlines)
- Playfair Display (elegant serif)
- Clash Display (bold geometric)
- Cabinet Grotesk (modern sans)
- Fraunces (quirky serif)
- Satoshi (clean contemporary)

### Body Fonts
- Source Serif Pro (readable serif)
- DM Sans (friendly sans)
- Outfit (geometric sans)
- Plus Jakarta Sans (professional)

### Monospace (Code/Data)
- JetBrains Mono
- Fira Code
- IBM Plex Mono

## Color Palette Ideas

### Dark Themes
- Carbon Night: #0a0a0a, #1a1a2e, #16213e
- Forest Depths: #0d1117, #161b22, #21262d
- Obsidian: #0f0f0f, #1c1c1c, #2d2d2d

### Light Themes
- Paper: #fafaf9, #f5f5f4, #e7e5e4
- Cream: #fffbeb, #fef3c7, #fde68a
- Cool Gray: #f8fafc, #f1f5f9, #e2e8f0

### Accent Colors
- Electric: #00ffff, #ff00ff, #ffff00
- Earth: #d97706, #059669, #7c3aed
- Neon: #22d3ee, #f472b6, #a3e635
