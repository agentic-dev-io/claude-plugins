---
name: godot-gdd
description: Generate a Game Design Document from a concept description
argument-hint: '"Tower Defense with RPG elements"'
allowed-tools:
  - Write
  - Read
  - Glob
  - WebSearch
---

# Game Design Document Generator

Generate a comprehensive Game Design Document (GDD) from a game concept description.

## Arguments

Parse the user's input to extract:
- Game concept/description (required)
- Target platform hints (optional)
- Scope indicators (optional)

## Execution

### 1. Analyze Concept

Extract from the description:
- Core genre(s)
- Key mechanics
- Setting/theme
- Target audience

### 2. Generate GDD Structure

Create `docs/GDD.md` with:

```markdown
# {GAME_TITLE} - Game Design Document

**Version:** 1.0
**Date:** {DATE}
**Status:** Draft

---

## 1. Executive Summary

### Concept Statement
{One paragraph describing the game}

### Core Pillars
1. {Pillar 1}
2. {Pillar 2}
3. {Pillar 3}

### Target Audience
{Demographics, player types}

### Target Platforms
{PC, Console, Mobile, Web}

---

## 2. Gameplay

### Core Loop
```
{ASCII diagram of main gameplay loop}
```

### Primary Mechanics
| Mechanic | Description | Player Interaction |
|----------|-------------|-------------------|
| {Name} | {What it does} | {How player uses it} |

### Secondary Mechanics
- {Supporting mechanic 1}
- {Supporting mechanic 2}

### Progression Systems
{How player advances, unlocks, levels up}

---

## 3. Game Systems

### System Overview
```
{Diagram showing system interactions}
```

### {System 1 Name}
**Purpose:** {Why it exists}
**Components:**
- {Component A}
- {Component B}
**Interactions:** {How it connects to other systems}

### {System 2 Name}
...

---

## 4. Content

### World/Levels
| Level | Theme | Mechanics Introduced | Estimated Time |
|-------|-------|---------------------|----------------|
| {Name} | {Theme} | {New mechanics} | {Minutes} |

### Characters/Entities
{Player character, enemies, NPCs}

### Items/Collectibles
{Weapons, power-ups, resources}

---

## 5. Technical Requirements

### Engine/Framework
Godot 4.6

### Required Systems
- [ ] {Core system 1}
- [ ] {Core system 2}
- [ ] {Supporting system}

### Performance Targets
| Platform | Target FPS | Resolution |
|----------|-----------|------------|
| PC | 60 | 1080p-4K |
| Web | 60 | 720p-1080p |

---

## 6. Art Direction

### Visual Style
{Description of art style}

### Color Palette
{Primary and accent colors}

### Reference Images
{Links or descriptions of visual references}

---

## 7. Audio

### Music
{Style, mood, adaptive elements}

### Sound Effects
{Key sound categories}

---

## 8. UI/UX

### Key Screens
- Main Menu
- HUD
- Pause Menu
- {Game-specific screens}

### Control Scheme
| Action | Keyboard | Controller |
|--------|----------|------------|
| {Action} | {Key} | {Button} |

---

## 9. Scope & Milestones

### MVP Features
- [ ] {Essential feature 1}
- [ ] {Essential feature 2}
- [ ] {Essential feature 3}

### Post-MVP Features
- [ ] {Nice to have 1}
- [ ] {Nice to have 2}

### Milestones
1. **Prototype:** {Core loop playable}
2. **Alpha:** {All systems functional}
3. **Beta:** {Content complete}
4. **Release:** {Polished, bug-free}

---

## 10. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| {Risk} | {H/M/L} | {H/M/L} | {Strategy} |

---

## Appendix

### Glossary
{Game-specific terms}

### References
{Inspirations, similar games}
```

### 3. Suggest Next Steps

After creating the GDD:
1. Review and refine with user
2. Use `/godot-structure` to plan project layout
3. Use `godot-architect` agent for technical architecture

## Tips

- Ask clarifying questions if concept is vague
- Scale scope suggestions to implied team size
- Reference existing successful games in the genre
- Highlight unique selling points
- Keep initial scope achievable
