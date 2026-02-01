---
name: godot-structure
description: Plan and create Godot project directory structure based on game type
argument-hint: "--type [rpg|fps|platformer|puzzle|rts] [project-name]"
allowed-tools:
  - Write
  - Read
  - Glob
  - Bash
---

# Godot Project Structure Generator

Plan and optionally create a well-organized Godot 4.6 project structure based on game type and scope.

## Arguments

Parse user input:
- `--type`: Game type (rpg, fps, platformer, puzzle, rts, or custom)
- `--create`: Actually create directories (default: just show plan)
- `project-name`: Name for the project (optional)

## Execution

### 1. Determine Project Type

Match game type to appropriate structure:

#### RPG Structure
```
res://
├── scenes/
│   ├── actors/
│   │   ├── player/
│   │   ├── npcs/
│   │   └── enemies/
│   ├── levels/
│   │   ├── overworld/
│   │   └── dungeons/
│   ├── ui/
│   │   ├── hud/
│   │   ├── menus/
│   │   ├── dialogs/
│   │   └── inventory/
│   └── systems/
│       ├── combat/
│       └── interaction/
├── scripts/
│   ├── autoload/
│   │   ├── game_manager.gd
│   │   ├── save_manager.gd
│   │   ├── quest_manager.gd
│   │   └── dialog_manager.gd
│   ├── actors/
│   ├── systems/
│   │   ├── inventory/
│   │   ├── combat/
│   │   ├── quests/
│   │   └── stats/
│   └── resources/
├── assets/
│   ├── sprites/
│   ├── tilesets/
│   ├── portraits/
│   ├── audio/
│   │   ├── music/
│   │   ├── sfx/
│   │   └── voice/
│   └── fonts/
├── data/
│   ├── items/
│   ├── enemies/
│   ├── quests/
│   ├── dialogs/
│   └── i18n/
└── addons/
```

#### FPS Structure
```
res://
├── scenes/
│   ├── player/
│   │   ├── player.tscn
│   │   └── weapons/
│   ├── enemies/
│   ├── levels/
│   ├── pickups/
│   ├── projectiles/
│   └── ui/
│       ├── hud/
│       └── menus/
├── scripts/
│   ├── autoload/
│   │   ├── game_manager.gd
│   │   ├── weapon_manager.gd
│   │   └── audio_manager.gd
│   ├── player/
│   ├── weapons/
│   ├── enemies/
│   └── systems/
│       ├── damage/
│       └── ammo/
├── assets/
│   ├── models/
│   ├── textures/
│   ├── materials/
│   ├── audio/
│   └── shaders/
└── data/
    ├── weapons/
    └── levels/
```

#### Platformer Structure
```
res://
├── scenes/
│   ├── player/
│   ├── levels/
│   │   ├── world_1/
│   │   └── world_2/
│   ├── enemies/
│   ├── hazards/
│   ├── collectibles/
│   ├── interactables/
│   └── ui/
├── scripts/
│   ├── autoload/
│   │   ├── game_manager.gd
│   │   └── level_manager.gd
│   ├── player/
│   ├── enemies/
│   └── components/
│       ├── movement/
│       └── state_machine/
├── assets/
│   ├── sprites/
│   ├── tilesets/
│   ├── backgrounds/
│   ├── audio/
│   └── particles/
└── data/
    └── levels/
```

#### Puzzle Structure
```
res://
├── scenes/
│   ├── puzzles/
│   │   ├── elements/
│   │   └── levels/
│   ├── ui/
│   │   ├── puzzle_ui/
│   │   └── menus/
│   └── effects/
├── scripts/
│   ├── autoload/
│   │   ├── puzzle_manager.gd
│   │   ├── progress_manager.gd
│   │   └── hint_system.gd
│   ├── puzzle_elements/
│   └── systems/
│       ├── validation/
│       └── hint/
├── assets/
│   ├── sprites/
│   ├── audio/
│   └── themes/
└── data/
    ├── puzzles/
    └── solutions/
```

#### RTS Structure
```
res://
├── scenes/
│   ├── units/
│   │   ├── military/
│   │   └── workers/
│   ├── buildings/
│   ├── maps/
│   ├── ui/
│   │   ├── hud/
│   │   ├── minimap/
│   │   └── build_menu/
│   └── systems/
├── scripts/
│   ├── autoload/
│   │   ├── game_manager.gd
│   │   ├── resource_manager.gd
│   │   └── faction_manager.gd
│   ├── units/
│   ├── buildings/
│   ├── ai/
│   └── systems/
│       ├── selection/
│       ├── pathfinding/
│       └── fog_of_war/
├── assets/
│   ├── sprites/
│   ├── tilesets/
│   ├── portraits/
│   └── audio/
└── data/
    ├── units/
    ├── buildings/
    ├── tech_trees/
    └── maps/
```

### 2. Generate Structure Plan

Create `docs/PROJECT_STRUCTURE.md`:

```markdown
# Project Structure

## Overview
{Diagram of main folders}

## Directory Purposes

### scenes/
{Description of each subfolder}

### scripts/
{Description of each subfolder}

### assets/
{Description of each subfolder}

### data/
{Description of each subfolder}

## Autoload Singletons
| Name | Path | Purpose |
|------|------|---------|
| GameManager | res://scripts/autoload/game_manager.gd | {Purpose} |

## Key Scenes
| Scene | Path | Description |
|-------|------|-------------|
| Main Menu | res://scenes/ui/menus/main_menu.tscn | Entry point |

## Naming Conventions
- Scenes: `snake_case.tscn`
- Scripts: `snake_case.gd`
- Resources: `snake_case.tres`
- Classes: `PascalCase`
```

### 3. Create Directories (if --create)

If user requests creation:
```bash
mkdir -p scenes/{actors,levels,ui} scripts/{autoload,systems} assets/{sprites,audio} data
```

Create placeholder files:
- `project.godot` updates (if exists)
- Basic `game_manager.gd` autoload
- `.gitignore` for Godot

### 4. Suggest Next Steps

1. Configure autoloads in Project Settings
2. Set up version control
3. Use `/godot-scene` to create initial scenes
4. Use `godot-developer` agent to implement systems

## Tips

- Adapt structure to actual project needs
- Keep scenes and scripts mirrored
- Use subdirectories when folders grow large
- Document any deviations from standard
