# RTS Starter Template

A Godot 4.6 template for real-time strategy games including unit selection, building placement, fog of war, and basic AI.

## Structure

```
rts-starter/
├── project.godot
├── scenes/
│   ├── main.tscn                 # Main game scene
│   ├── camera/
│   │   └── rts_camera.tscn       # Pan/zoom camera
│   ├── units/
│   │   ├── unit_base.tscn        # Base unit scene
│   │   ├── worker.tscn           # Resource gatherer
│   │   ├── soldier.tscn          # Combat unit
│   │   └── selection_circle.tscn # Visual selection
│   ├── buildings/
│   │   ├── building_base.tscn    # Base building
│   │   ├── headquarters.tscn     # Main building
│   │   ├── barracks.tscn         # Unit production
│   │   └── resource_depot.tscn   # Resource storage
│   ├── resources/
│   │   └── resource_node.tscn    # Mineable resources
│   ├── effects/
│   │   └── fog_of_war.tscn       # FoW layer
│   └── ui/
│       ├── hud.tscn              # Game HUD
│       ├── minimap.tscn          # Minimap display
│       ├── selection_box.tscn    # Drag selection visual
│       ├── command_panel.tscn    # Unit commands
│       └── build_menu.tscn       # Building menu
├── scripts/
│   ├── camera/
│   │   └── rts_camera.gd         # Camera controls
│   ├── units/
│   │   ├── unit_base.gd          # Base unit logic
│   │   ├── unit_movement.gd      # Pathfinding movement
│   │   ├── unit_combat.gd        # Combat behavior
│   │   └── worker_ai.gd          # Gathering behavior
│   ├── buildings/
│   │   ├── building_base.gd      # Base building
│   │   ├── production_building.gd # Unit training
│   │   └── building_placement.gd # Ghost placement
│   ├── systems/
│   │   ├── selection_manager.gd  # Selection (Autoload)
│   │   ├── command_manager.gd    # Commands (Autoload)
│   │   ├── resource_manager.gd   # Resources (Autoload)
│   │   ├── fog_of_war.gd         # FoW system
│   │   └── team_manager.gd       # Team/faction
│   ├── ai/
│   │   └── simple_ai.gd          # Basic enemy AI
│   └── ui/
│       ├── minimap_controller.gd
│       └── selection_box.gd
├── resources/
│   ├── units/
│   │   └── unit_data.gd          # Unit stats resource
│   └── buildings/
│       └── building_data.gd      # Building data resource
└── shaders/
    └── fog_of_war.gdshader       # FoW shader
```

## Features

### Selection System
- Click to select single unit
- Box drag to select multiple
- Shift+click to add/remove from selection
- Double-click to select all of type
- Control groups (Ctrl+1-9, 1-9 to recall)

### Unit Commands
- Right-click to move/attack
- Attack-move command
- Patrol waypoints
- Stop/hold position
- Formation movement

### Building System
- Ghost preview with validity check
- Placement validation (terrain, collision)
- Build queue
- Unit rally points

### Fog of War
- Unexplored (black)
- Explored but not visible (dark)
- Visible (clear)
- Per-unit sight radius
- GPU-accelerated

### Resource System
- Multiple resource types
- Gathering mechanics
- Storage limits
- Income display

### Minimap
- Real-time unit positions
- Click to move camera
- Fog of war overlay
- Building/unit icons

## Core Systems

### Selection Manager
```gdscript
# scripts/systems/selection_manager.gd
extends Node

signal selection_changed(units: Array[Unit])

var selected_units: Array[Unit] = []
var control_groups: Dictionary = {}  # 1-9 -> Array[Unit]

func select_single(unit: Unit, additive: bool = false) -> void:
    if not additive:
        deselect_all()

    if unit not in selected_units:
        selected_units.append(unit)
        unit.select()

    selection_changed.emit(selected_units)

func select_multiple(units: Array[Unit]) -> void:
    deselect_all()
    for unit in units:
        selected_units.append(unit)
        unit.select()
    selection_changed.emit(selected_units)

func deselect_all() -> void:
    for unit in selected_units:
        unit.deselect()
    selected_units.clear()

func set_control_group(group_number: int) -> void:
    control_groups[group_number] = selected_units.duplicate()

func recall_control_group(group_number: int) -> void:
    if group_number in control_groups:
        select_multiple(control_groups[group_number])
```

### Unit Base
```gdscript
# scripts/units/unit_base.gd
class_name Unit
extends CharacterBody3D

@export var data: UnitData
@export var team: int = 0

var is_selected: bool = false
var current_command: Command
var nav_agent: NavigationAgent3D

signal died

func select() -> void:
    is_selected = true
    $SelectionCircle.show()

func deselect() -> void:
    is_selected = false
    $SelectionCircle.hide()

func command_move(target: Vector3) -> void:
    current_command = MoveCommand.new(target)
    nav_agent.target_position = target

func command_attack(target: Unit) -> void:
    current_command = AttackCommand.new(target)

func get_sight_radius() -> float:
    return data.sight_radius
```

### Building Placement
```gdscript
# scripts/buildings/building_placement.gd
class_name BuildingPlacement
extends Node3D

var ghost_building: Node3D
var building_data: BuildingData
var is_valid_placement: bool = false

func start_placement(data: BuildingData) -> void:
    building_data = data
    ghost_building = data.ghost_scene.instantiate()
    add_child(ghost_building)
    set_process(true)

func _process(delta: float) -> void:
    var mouse_pos = get_world_position_from_mouse()
    ghost_building.global_position = snap_to_grid(mouse_pos)

    is_valid_placement = check_placement_valid()
    update_ghost_color()

func check_placement_valid() -> bool:
    # Check terrain, collision, resources
    var space_state = get_world_3d().direct_space_state
    # ... collision checks
    return true

func confirm_placement() -> void:
    if is_valid_placement:
        var building = building_data.scene.instantiate()
        building.global_position = ghost_building.global_position
        get_tree().current_scene.add_child(building)
        ResourceManager.spend(building_data.cost)
        cancel_placement()

func cancel_placement() -> void:
    if ghost_building:
        ghost_building.queue_free()
        ghost_building = null
    set_process(false)
```

### Fog of War
```gdscript
# scripts/systems/fog_of_war.gd
extends Node2D

@export var map_size: Vector2i = Vector2i(256, 256)
@export var cell_size: float = 4.0

var visibility: Image
var explored: Image
var fog_texture: ImageTexture

func _ready() -> void:
    visibility = Image.create(map_size.x, map_size.y, false, Image.FORMAT_R8)
    explored = Image.create(map_size.x, map_size.y, false, Image.FORMAT_R8)
    fog_texture = ImageTexture.create_from_image(visibility)

func _process(delta: float) -> void:
    update_visibility()
    fog_texture.update(visibility)

func update_visibility() -> void:
    visibility.fill(Color(0, 0, 0, 1))

    for unit in get_tree().get_nodes_in_group("player_units"):
        reveal_area(unit.global_position, unit.get_sight_radius())

func reveal_area(world_pos: Vector3, radius: float) -> void:
    var cell = world_to_cell(world_pos)
    var cell_radius = int(radius / cell_size)

    for x in range(-cell_radius, cell_radius + 1):
        for y in range(-cell_radius, cell_radius + 1):
            var check = cell + Vector2i(x, y)
            if Vector2(x, y).length() * cell_size <= radius:
                if is_valid_cell(check):
                    visibility.set_pixel(check.x, check.y, Color.WHITE)
                    explored.set_pixel(check.x, check.y, Color.WHITE)

func is_visible(world_pos: Vector3) -> bool:
    var cell = world_to_cell(world_pos)
    return visibility.get_pixel(cell.x, cell.y).r > 0.5
```

## Setup

1. Copy this folder to your project
2. Configure input actions:
   - Camera: `pan_up`, `pan_down`, `pan_left`, `pan_right`, `zoom_in`, `zoom_out`
   - Selection: `select`, `select_add`, `command`
   - Groups: `group_1` - `group_9`, `set_group`
3. Set up collision layers:
   - Layer 1: Terrain
   - Layer 2: Units
   - Layer 3: Buildings
   - Layer 4: Resources
4. Create team materials/colors
5. Set up navigation mesh for pathfinding

## Usage Examples

### Spawn Unit from Building
```gdscript
# production_building.gd
func train_unit(unit_data: UnitData) -> void:
    if ResourceManager.can_afford(unit_data.cost):
        ResourceManager.spend(unit_data.cost)
        build_queue.append(unit_data)
        if not is_training:
            start_training()

func start_training() -> void:
    is_training = true
    current_training = build_queue.pop_front()
    train_timer = current_training.build_time
```

### Right-Click Command
```gdscript
# command_manager.gd
func handle_right_click(world_position: Vector3) -> void:
    var target = get_target_at_position(world_position)

    if target is Unit and target.team != player_team:
        # Attack enemy
        for unit in SelectionManager.selected_units:
            unit.command_attack(target)
    elif target is ResourceNode:
        # Gather resource
        for unit in SelectionManager.selected_units:
            if unit is Worker:
                unit.command_gather(target)
    else:
        # Move to position
        var positions = get_formation_positions(world_position)
        for i in SelectionManager.selected_units.size():
            SelectionManager.selected_units[i].command_move(positions[i])
```

## Requirements

- Godot 4.6+
- Navigation mesh for pathfinding
- Unit/building models
- Minimap render setup
