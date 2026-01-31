---
name: Godot GDScript 4.6
description: This skill should be used when the user asks about "GDScript", "Godot script", "typed variable", "typed array", "Array[", "typed dictionary", "Dictionary[", "signal connection", "@export", "@onready", "await", "coroutine", "match statement", "class_name", "extends", "preload", "load", "get_node", "$", "setter", "getter", "autoload", or needs guidance on GDScript 4.x syntax, patterns, best practices, and typed programming in Godot Engine.
---

# GDScript 4.x Development

GDScript is Godot's high-level, dynamically typed programming language optimized for game development. Godot 4.6 brings refined typed syntax, improved signal handling, and enhanced coroutine support.

## Core Syntax (4.6)

### Type Annotations

Use static typing for better performance and editor support:

```gdscript
# Typed variables
var health: int = 100
var speed: float = 5.5
var player_name: String = "Hero"
var position: Vector3 = Vector3.ZERO

# Typed arrays
var inventory: Array[Item] = []
var scores: Array[int] = [10, 20, 30]

# Typed dictionaries (Godot 4.4+)
var stats: Dictionary[String, int] = {"hp": 100, "mp": 50}
var player_data: Dictionary[String, Variant] = {"name": "Hero", "level": 1}

# Inferred types
var velocity := Vector2.ZERO  # Inferred as Vector2

# Nullable/variant when needed
var target: Node = null
var data  # Variant type
```

### Functions

```gdscript
# Typed parameters and return
func calculate_damage(base: int, multiplier: float) -> int:
    return int(base * multiplier)

# Optional parameters
func spawn_enemy(type: String, count: int = 1) -> Array[Enemy]:
    var enemies: Array[Enemy] = []
    for i in count:
        enemies.append(Enemy.new(type))
    return enemies

# Static functions
static func clamp_health(value: int) -> int:
    return clampi(value, 0, 100)
```

### Signals

```gdscript
# Signal declaration
signal health_changed(new_health: int)
signal item_collected(item: Item, amount: int)
signal game_over

# Emitting signals
func take_damage(amount: int) -> void:
    health -= amount
    health_changed.emit(health)
    if health <= 0:
        game_over.emit()

# Connecting signals (preferred callable syntax)
func _ready() -> void:
    health_changed.connect(_on_health_changed)
    $Button.pressed.connect(_on_button_pressed)

    # One-shot connection
    game_over.connect(_on_game_over, CONNECT_ONE_SHOT)

    # Deferred connection
    child_entered_tree.connect(_on_child_entered, CONNECT_DEFERRED)

func _on_health_changed(new_health: int) -> void:
    $HealthBar.value = new_health
```

### Coroutines and Await

```gdscript
# Awaiting signals
func show_dialog(text: String) -> void:
    $DialogBox.text = text
    $DialogBox.show()
    await $DialogBox.closed  # Wait for signal
    $DialogBox.hide()

# Awaiting timers
func flash_damage() -> void:
    modulate = Color.RED
    await get_tree().create_timer(0.1).timeout
    modulate = Color.WHITE

# Awaiting tweens
func move_to(target: Vector3) -> void:
    var tween := create_tween()
    tween.tween_property(self, "position", target, 1.0)
    await tween.finished

# Chained coroutines
func cutscene() -> void:
    await fade_out()
    await load_next_scene()
    await fade_in()
```

### Node References

```gdscript
# @onready - initialize when node enters tree
@onready var sprite: Sprite2D = $Sprite2D
@onready var anim: AnimationPlayer = $AnimationPlayer
@onready var collision: CollisionShape2D = $CollisionShape2D

# $ shorthand (get_node)
var child := $ChildNode
var nested := $Parent/Child/Grandchild

# Typed get_node
var player := get_node("Player") as CharacterBody3D

# get_node_or_null for optional nodes
var optional := get_node_or_null("MaybeExists")
if optional:
    optional.do_something()
```

### Export Variables

```gdscript
# Basic exports
@export var max_health: int = 100
@export var move_speed: float = 5.0
@export var character_name: String = ""

# Range exports
@export_range(0, 100, 1) var health: int = 100
@export_range(0.0, 10.0, 0.1) var speed: float = 5.0

# Enum exports
@export_enum("Warrior", "Mage", "Rogue") var class_type: int = 0

# Resource exports
@export var weapon: PackedScene
@export var texture: Texture2D
@export var stats: Resource

# Export groups
@export_group("Movement")
@export var walk_speed: float = 5.0
@export var run_speed: float = 10.0

@export_subgroup("Jumping")
@export var jump_height: float = 2.0
@export var double_jump: bool = false

# Flags
@export_flags("Fire", "Water", "Earth", "Air") var elements: int = 0

# File/Dir paths
@export_file("*.png") var texture_path: String
@export_dir var save_directory: String

# Multiline text
@export_multiline var description: String
```

### Match Statement (Pattern Matching)

```gdscript
func handle_input(action: String) -> void:
    match action:
        "jump":
            jump()
        "attack", "alt_attack":  # Multiple patterns
            attack()
        "move_left", "move_right":
            move(action)
        _:  # Default
            print("Unknown action")

# Match with binding
func process_event(event: Dictionary) -> void:
    match event:
        {"type": "damage", "amount": var amt}:
            take_damage(amt)
        {"type": "heal", "amount": var amt}:
            heal(amt)
        {"type": "buff", ..}:  # Rest pattern
            apply_buff(event)
```

## Project Structure (Standard)

```
res://
├── scenes/
│   ├── characters/
│   │   ├── player.tscn
│   │   └── enemy.tscn
│   ├── levels/
│   │   ├── level_1.tscn
│   │   └── level_2.tscn
│   └── ui/
│       ├── hud.tscn
│       └── menu.tscn
├── scripts/
│   ├── characters/
│   │   ├── player.gd
│   │   └── enemy.gd
│   ├── managers/
│   │   ├── game_manager.gd
│   │   └── audio_manager.gd
│   └── resources/
│       └── item_data.gd
├── assets/
│   ├── sprites/
│   ├── audio/
│   └── fonts/
└── autoload/
    ├── globals.gd
    └── events.gd
```

## Best Practices

### Avoid God Classes

Split large scripts into focused components:

```gdscript
# BAD: One script doing everything
class_name Player
extends CharacterBody3D
# 500+ lines handling movement, combat, inventory, quests...

# GOOD: Composition with child nodes
# player.gd - orchestration only
class_name Player
extends CharacterBody3D

@onready var movement: PlayerMovement = $Movement
@onready var combat: PlayerCombat = $Combat
@onready var inventory: PlayerInventory = $Inventory

# player_movement.gd
class_name PlayerMovement
extends Node
# Only movement logic

# player_combat.gd
class_name PlayerCombat
extends Node
# Only combat logic
```

### Use Autoloads for Global State

```gdscript
# autoload/game_state.gd
extends Node

signal score_changed(new_score: int)

var score: int = 0:
    set(value):
        score = value
        score_changed.emit(score)

var current_level: int = 1
var player_data: Dictionary = {}

func reset() -> void:
    score = 0
    current_level = 1
```

### Resource-Based Data

```gdscript
# scripts/resources/weapon_data.gd
class_name WeaponData
extends Resource

@export var name: String
@export var damage: int
@export var attack_speed: float
@export var icon: Texture2D
@export_multiline var description: String

# Usage in code
@export var weapon: WeaponData

func attack() -> void:
    deal_damage(weapon.damage)
```

### Signal Bus Pattern

```gdscript
# autoload/events.gd
extends Node

signal player_died
signal enemy_killed(enemy: Node)
signal item_collected(item_id: String, amount: int)
signal level_completed(level_id: int)
signal game_paused(is_paused: bool)

# Usage anywhere
func _on_player_death() -> void:
    Events.player_died.emit()

# Listening
func _ready() -> void:
    Events.player_died.connect(_on_player_died)
```

## Performance Tips

### Object Pooling

```gdscript
class_name BulletPool
extends Node

var pool: Array[Bullet] = []
var pool_size: int = 50

func _ready() -> void:
    for i in pool_size:
        var bullet := preload("res://scenes/bullet.tscn").instantiate()
        bullet.hide()
        add_child(bullet)
        pool.append(bullet)

func get_bullet() -> Bullet:
    for bullet in pool:
        if not bullet.active:
            return bullet
    return null  # Pool exhausted
```

### Avoid Creating Objects in _process

```gdscript
# BAD
func _process(delta: float) -> void:
    var dir := Vector2(Input.get_axis("left", "right"), 0)  # Creates new Vector2 every frame

# GOOD
var move_direction: Vector2

func _process(delta: float) -> void:
    move_direction.x = Input.get_axis("left", "right")
    move_direction.y = 0
```

## Additional Resources

For project templates including player controllers, state machines, and more, see the plugin's `templates/` directory.
