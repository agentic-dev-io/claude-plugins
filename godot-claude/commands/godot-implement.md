---
name: godot-implement
description: Implement a game feature from specification
argument-hint: '"Inventory system with drag-and-drop"'
allowed-tools:
  - Write
  - Read
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
---

# Feature Implementation Command

Implement a complete game feature in Godot 4.6 based on a specification or description.

## Arguments

Parse user input:
- Feature description (required)
- Scope hints (e.g., "simple", "full", "MVP")
- Integration targets (e.g., "for the player", "in the HUD")

## Execution

### 1. Analyze Requirements

Before implementing:
1. Search for existing related code
2. Check project structure
3. Identify dependencies
4. Determine scope

```bash
# Find existing project structure
find . -name "project.godot" -type f

# Search for related code
grep -r "class_name" --include="*.gd" | head -20
```

### 2. Plan Implementation

Create implementation checklist:

```markdown
## Feature: {Feature Name}

### Components Needed
- [ ] Scene: {scene_name.tscn}
- [ ] Script: {script_name.gd}
- [ ] Resource: {resource_name.tres} (if needed)

### Dependencies
- Requires: {existing_system}
- Signals to: {other_systems}

### Implementation Order
1. {Step 1}
2. {Step 2}
3. {Step 3}
```

### 3. Implement Feature

Follow Godot 4.6 best practices:

#### Script Template
```gdscript
class_name FeatureName
extends Node

## Brief description of this feature
##
## Longer description if needed, explaining
## how this integrates with other systems.

signal feature_event(data: Dictionary)

const MAX_VALUE: int = 100

@export_group("Configuration")
@export var enabled: bool = true
@export var setting: float = 1.0

var _internal_state: Dictionary = {}

@onready var _dependency: Node = $Dependency


func _ready() -> void:
    _initialize()


func _initialize() -> void:
    pass


## Public API method
func public_method(param: String) -> bool:
    return _private_helper(param)


func _private_helper(data: String) -> bool:
    return data.length() > 0
```

#### Scene Structure
```
FeatureRoot (Node/Control/Node2D/Node3D)
├── Components
│   ├── ComponentA
│   └── ComponentB
├── UI (if needed)
└── Debug (remove in production)
```

### 4. Integration

Connect feature to existing systems:

```gdscript
# In autoload or main scene
func _ready() -> void:
    feature.feature_event.connect(_on_feature_event)


func _on_feature_event(data: Dictionary) -> void:
    # Handle event
    pass
```

### 5. Verify Implementation

After implementing:
1. List created files
2. Show key code sections
3. Explain integration points
4. Suggest testing approach

## Common Features Reference

### Inventory System
```gdscript
# Core classes needed:
# - Inventory (container)
# - InventoryItem (resource)
# - InventorySlot (UI)
# - InventoryUI (display)
```

### Health System
```gdscript
# Core classes needed:
# - HealthComponent (node)
# - DamageInfo (resource)
# - HealthBar (UI)
```

### Dialogue System
```gdscript
# Core classes needed:
# - DialogueManager (autoload)
# - DialogueData (resource)
# - DialogueUI (display)
# - DialogueChoice (UI element)
```

### Save System
```gdscript
# Core classes needed:
# - SaveManager (autoload)
# - SaveData (resource)
# - SaveableComponent (marker)
```

### Input Buffer
```gdscript
# Core classes needed:
# - InputBuffer (node)
# - BufferedAction (data)
```

## Skills to Reference

When implementing, invoke relevant skills:
- `godot-patterns` - For FSM, behavior trees, ECS
- `godot-ui` - For UI-heavy features
- `godot-save` - For persistence
- `godot-input` - For input handling
- `godot-gdscript` - For language features

## Tips

- Start with the data model (resources)
- Build core logic before UI
- Use signals for loose coupling
- Add @export vars for easy tuning
- Include debug helpers (remove later)
- Write code that's testable
