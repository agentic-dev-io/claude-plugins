# Roguelike Starter Template

A Godot 4.6 template for roguelike games including procedural dungeon generation, run-based progression, permadeath, and meta-progression.

## Structure

```
roguelike-starter/
├── project.godot
├── scenes/
│   ├── main.tscn                 # Main game scene
│   ├── player/
│   │   ├── player.tscn           # Player character
│   │   └── player_stats_ui.tscn  # Stats display
│   ├── dungeon/
│   │   ├── room_base.tscn        # Room template
│   │   ├── room_start.tscn       # Starting room
│   │   ├── room_enemy.tscn       # Combat room
│   │   ├── room_treasure.tscn    # Loot room
│   │   ├── room_shop.tscn        # Shop room
│   │   └── room_boss.tscn        # Boss room
│   ├── enemies/
│   │   ├── enemy_base.tscn       # Base enemy
│   │   └── boss_base.tscn        # Boss enemy
│   ├── items/
│   │   ├── pickup_base.tscn      # Ground item
│   │   ├── weapon_pickup.tscn
│   │   └── power_up.tscn
│   └── ui/
│       ├── hud.tscn              # Game HUD
│       ├── minimap.tscn          # Dungeon map
│       ├── item_choice.tscn      # Item selection
│       ├── pause_menu.tscn
│       ├── death_screen.tscn     # Run end screen
│       └── meta_shop.tscn        # Permanent upgrades
├── scripts/
│   ├── player/
│   │   ├── player_controller.gd  # Player movement/combat
│   │   └── player_stats.gd       # Run stats
│   ├── dungeon/
│   │   ├── dungeon_generator.gd  # Procedural generation
│   │   ├── room_manager.gd       # Room logic
│   │   └── room_types.gd         # Room definitions
│   ├── enemies/
│   │   ├── enemy_base.gd         # Enemy behavior
│   │   └── boss_ai.gd            # Boss patterns
│   ├── items/
│   │   ├── item_manager.gd       # Item spawning
│   │   └── item_effects.gd       # Item behaviors
│   ├── systems/
│   │   ├── run_manager.gd        # Run state (Autoload)
│   │   ├── meta_progression.gd   # Permanent upgrades (Autoload)
│   │   └── rng_manager.gd        # Seeded RNG (Autoload)
│   └── ui/
│       ├── minimap_controller.gd
│       └── death_screen_controller.gd
├── resources/
│   ├── items/
│   │   └── item_data.gd          # Item resource class
│   ├── enemies/
│   │   └── enemy_data.gd         # Enemy resource class
│   └── rooms/
│       └── room_data.gd          # Room configuration
└── data/
    ├── items.json                # Item definitions
    └── enemies.json              # Enemy definitions
```

## Features

### Procedural Generation
- BSP-based dungeon layout
- Room-based progression
- Guaranteed path to exit
- Secret rooms (optional)
- Difficulty scaling per floor

### Run System
- Permadeath (run ends on death)
- Run-specific upgrades
- Resource management (health, gold, ammo)
- Floor-based progression

### Item System
- Passive items (permanent buffs)
- Active items (cooldown abilities)
- Weapons with unique behaviors
- Item synergies

### Meta Progression
- Persistent currency
- Unlockable characters
- Starting bonuses
- Achievement unlocks

### Combat
- Twin-stick or action combat
- Varied enemy types
- Boss fights with phases
- Damage/health scaling

## Core Systems

### Dungeon Generator
```gdscript
# scripts/dungeon/dungeon_generator.gd
class_name DungeonGenerator
extends Node

signal floor_generated(rooms: Array[Room])
signal room_entered(room: Room)

@export var floor_width: int = 6
@export var floor_height: int = 6
@export var min_rooms: int = 8
@export var max_rooms: int = 12

var current_floor: int = 0
var rooms: Array[Room] = []
var current_room: Room

class Room:
    var position: Vector2i
    var type: RoomType
    var connections: Dictionary = {}  # direction -> Room
    var cleared: bool = false
    var visited: bool = false

enum RoomType { START, ENEMY, TREASURE, SHOP, BOSS, SECRET }
enum Direction { NORTH, SOUTH, EAST, WEST }

func generate_floor(floor_number: int) -> void:
    current_floor = floor_number
    rooms.clear()

    # Generate room layout
    var layout = generate_layout()

    # Assign room types
    assign_room_types(layout)

    # Connect rooms
    connect_rooms(layout)

    floor_generated.emit(rooms)

func generate_layout() -> Array[Vector2i]:
    var layout: Array[Vector2i] = []
    var start_pos = Vector2i(floor_width / 2, floor_height / 2)
    layout.append(start_pos)

    var room_count = randi_range(min_rooms, max_rooms)

    while layout.size() < room_count:
        # Pick random existing room
        var base = layout.pick_random()

        # Try to add adjacent room
        var directions = [Vector2i.UP, Vector2i.DOWN, Vector2i.LEFT, Vector2i.RIGHT]
        directions.shuffle()

        for dir in directions:
            var new_pos = base + dir
            if is_valid_position(new_pos) and new_pos not in layout:
                layout.append(new_pos)
                break

    return layout

func assign_room_types(layout: Array[Vector2i]) -> void:
    # Start room
    var start_room = Room.new()
    start_room.position = layout[0]
    start_room.type = RoomType.START
    rooms.append(start_room)

    # Boss room (furthest from start)
    var boss_pos = get_furthest_room(layout, layout[0])

    # Assign other rooms
    for pos in layout:
        if pos == layout[0]:
            continue

        var room = Room.new()
        room.position = pos

        if pos == boss_pos:
            room.type = RoomType.BOSS
        else:
            room.type = weighted_random_room_type()

        rooms.append(room)

func weighted_random_room_type() -> RoomType:
    var weights = {
        RoomType.ENEMY: 60,
        RoomType.TREASURE: 15,
        RoomType.SHOP: 10
    }
    # Scale based on floor
    weights[RoomType.ENEMY] += current_floor * 5

    return weighted_choice(weights)

func get_room_at(pos: Vector2i) -> Room:
    for room in rooms:
        if room.position == pos:
            return room
    return null

func enter_room(room: Room) -> void:
    current_room = room
    room.visited = true
    room_entered.emit(room)
```

### Run Manager
```gdscript
# scripts/systems/run_manager.gd - Autoload
extends Node

signal run_started(seed: int)
signal floor_changed(floor_number: int)
signal run_ended(success: bool, stats: RunStats)

var is_run_active: bool = false
var current_floor: int = 0
var run_seed: int = 0
var stats: RunStats

class RunStats:
    var floors_cleared: int = 0
    var enemies_killed: int = 0
    var damage_taken: int = 0
    var gold_collected: int = 0
    var items_collected: Array[String] = []
    var time_elapsed: float = 0.0
    var death_cause: String = ""

func start_run(custom_seed: int = -1) -> void:
    if custom_seed == -1:
        run_seed = randi()
    else:
        run_seed = custom_seed

    seed(run_seed)
    RNGManager.set_seed(run_seed)

    stats = RunStats.new()
    current_floor = 0
    is_run_active = true

    # Reset player
    PlayerStats.reset_for_new_run()

    # Apply meta-progression bonuses
    MetaProgression.apply_starting_bonuses()

    run_started.emit(run_seed)
    advance_floor()

func advance_floor() -> void:
    current_floor += 1
    stats.floors_cleared = current_floor

    DungeonGenerator.generate_floor(current_floor)
    floor_changed.emit(current_floor)

func end_run(success: bool, death_cause: String = "") -> void:
    if not is_run_active:
        return

    is_run_active = false
    stats.death_cause = death_cause

    # Award meta currency
    var currency_earned = calculate_currency_reward()
    MetaProgression.add_currency(currency_earned)

    # Check unlocks
    MetaProgression.check_unlocks(stats)

    run_ended.emit(success, stats)

func calculate_currency_reward() -> int:
    var base = stats.floors_cleared * 10
    base += stats.enemies_killed * 2
    return base

func _process(delta: float) -> void:
    if is_run_active:
        stats.time_elapsed += delta
```

### Meta Progression
```gdscript
# scripts/systems/meta_progression.gd - Autoload
extends Node

signal currency_changed(amount: int)
signal unlock_achieved(unlock_id: String)

const SAVE_PATH = "user://meta_progress.json"

var currency: int = 0
var unlocked_characters: Array[String] = ["default"]
var unlocked_items: Array[String] = []
var purchased_upgrades: Dictionary = {}
var achievements: Array[String] = []

var upgrades = {
    "starting_health_1": {"cost": 50, "effect": {"max_health": 10}},
    "starting_health_2": {"cost": 100, "effect": {"max_health": 20}, "requires": "starting_health_1"},
    "starting_gold": {"cost": 75, "effect": {"gold": 25}},
    "extra_life": {"cost": 200, "effect": {"extra_lives": 1}},
    "item_choice": {"cost": 150, "effect": {"item_choices": 1}}
}

func _ready() -> void:
    load_progress()

func add_currency(amount: int) -> void:
    currency += amount
    currency_changed.emit(currency)
    save_progress()

func purchase_upgrade(upgrade_id: String) -> bool:
    if upgrade_id in purchased_upgrades:
        return false

    var upgrade = upgrades[upgrade_id]

    # Check requirements
    if "requires" in upgrade:
        if upgrade.requires not in purchased_upgrades:
            return false

    if currency < upgrade.cost:
        return false

    currency -= upgrade.cost
    purchased_upgrades[upgrade_id] = true
    currency_changed.emit(currency)
    save_progress()
    return true

func apply_starting_bonuses() -> void:
    for upgrade_id in purchased_upgrades:
        var effect = upgrades[upgrade_id].effect

        if "max_health" in effect:
            PlayerStats.max_health += effect.max_health
            PlayerStats.health = PlayerStats.max_health
        if "gold" in effect:
            PlayerStats.gold += effect.gold
        if "extra_lives" in effect:
            PlayerStats.extra_lives += effect.extra_lives
        if "item_choices" in effect:
            ItemManager.choices_per_reward += effect.item_choices

func check_unlocks(stats: RunStats) -> void:
    # Example unlocks
    if stats.floors_cleared >= 5 and "survivor" not in achievements:
        achievements.append("survivor")
        unlock_achieved.emit("survivor")

    if stats.enemies_killed >= 100 and "slayer" not in achievements:
        achievements.append("slayer")
        unlocked_characters.append("warrior")
        unlock_achieved.emit("slayer")

    save_progress()

func save_progress() -> void:
    var data = {
        "currency": currency,
        "unlocked_characters": unlocked_characters,
        "unlocked_items": unlocked_items,
        "purchased_upgrades": purchased_upgrades,
        "achievements": achievements
    }

    var file = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
    file.store_string(JSON.stringify(data))

func load_progress() -> void:
    if not FileAccess.file_exists(SAVE_PATH):
        return

    var file = FileAccess.open(SAVE_PATH, FileAccess.READ)
    var data = JSON.parse_string(file.get_as_text())

    currency = data.get("currency", 0)
    unlocked_characters = data.get("unlocked_characters", ["default"])
    unlocked_items = data.get("unlocked_items", [])
    purchased_upgrades = data.get("purchased_upgrades", {})
    achievements = data.get("achievements", [])
```

### Item System
```gdscript
# scripts/items/item_manager.gd
class_name ItemManager
extends Node

var choices_per_reward: int = 3
var player_items: Array[ItemData] = []

func generate_item_choices() -> Array[ItemData]:
    var available = get_available_items()
    available.shuffle()
    return available.slice(0, choices_per_reward)

func get_available_items() -> Array[ItemData]:
    var all_items = load_all_items()
    var available: Array[ItemData] = []

    for item in all_items:
        # Check if unlocked
        if item.requires_unlock and item.id not in MetaProgression.unlocked_items:
            continue

        # Check if already owned (for unique items)
        if item.unique and has_item(item.id):
            continue

        available.append(item)

    return available

func add_item(item: ItemData) -> void:
    player_items.append(item)
    item.apply_effect()
    RunManager.stats.items_collected.append(item.id)

func has_item(item_id: String) -> bool:
    for item in player_items:
        if item.id == item_id:
            return true
    return false
```

## Setup

1. Copy this folder to your project
2. Register autoloads:
   - `RunManager` → `res://scripts/systems/run_manager.gd`
   - `MetaProgression` → `res://scripts/systems/meta_progression.gd`
   - `RNGManager` → `res://scripts/systems/rng_manager.gd`
3. Configure input actions
4. Create item and enemy data files
5. Design room layouts

## Requirements

- Godot 4.6+
- Room scene templates
- Enemy sprites/models
- Item icons and effects
