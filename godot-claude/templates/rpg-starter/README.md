# RPG Starter Template

A Godot 4.6 template for RPG games including quest system, dialogue, inventory, stats, and save/load.

## Structure

```
rpg-starter/
├── project.godot
├── scenes/
│   ├── main.tscn                 # Main game scene
│   ├── player/
│   │   ├── player.tscn           # Player character
│   │   └── player_camera.tscn    # Follow camera
│   ├── npcs/
│   │   └── npc_base.tscn         # NPC template
│   ├── world/
│   │   ├── level_base.tscn       # Level template
│   │   └── interactable.tscn     # Interactable objects
│   └── ui/
│       ├── hud.tscn              # Game HUD
│       ├── inventory_ui.tscn     # Inventory screen
│       ├── dialogue_box.tscn     # Dialogue display
│       ├── quest_log.tscn        # Quest journal
│       └── stats_panel.tscn      # Character stats
├── scripts/
│   ├── player/
│   │   ├── player_controller.gd  # Movement and interaction
│   │   └── player_stats.gd       # RPG stats and leveling
│   ├── systems/
│   │   ├── quest_manager.gd      # Quest tracking (Autoload)
│   │   ├── dialogue_manager.gd   # Dialogue system (Autoload)
│   │   ├── inventory.gd          # Inventory management (Autoload)
│   │   ├── save_manager.gd       # Save/Load (Autoload)
│   │   └── game_events.gd        # Event bus (Autoload)
│   ├── npcs/
│   │   ├── npc_base.gd           # Base NPC behavior
│   │   └── shop_keeper.gd        # Shop functionality
│   └── ui/
│       ├── hud_controller.gd
│       ├── inventory_slot.gd
│       ├── dialogue_choice.gd
│       └── quest_entry.gd
├── resources/
│   ├── items/
│   │   ├── item_data.gd          # Item resource class
│   │   ├── potion_health.tres
│   │   └── sword_iron.tres
│   ├── quests/
│   │   ├── quest_data.gd         # Quest resource class
│   │   └── main_quest_1.tres
│   └── dialogues/
│       ├── dialogue_data.gd      # Dialogue resource class
│       └── npc_shopkeeper.tres
└── autoload/
    └── globals.gd                # Global constants
```

## Features

### Quest System
- Multi-objective quests
- Quest prerequisites
- Reward system (XP, gold, items)
- Quest log UI

### Dialogue System
- Branching dialogues
- Condition-based options
- Effect triggers (start quest, give item)
- Speaker portraits

### Inventory System
- Slot-based inventory
- Item stacking
- Equipment slots
- Item categories (consumable, equipment, quest, material)

### Stats & Leveling
- Core stats (STR, DEF, SPD, etc.)
- XP and level progression
- Equipment stat bonuses
- Buff/debuff system

### Save/Load
- Player stats and inventory
- Quest progress
- World state (chests opened, NPCs talked to)
- Multiple save slots

## Core Systems

### Item Data Resource
```gdscript
# resources/items/item_data.gd
class_name ItemData
extends Resource

enum ItemType { CONSUMABLE, EQUIPMENT, QUEST, MATERIAL }
enum EquipSlot { NONE, WEAPON, ARMOR, ACCESSORY }

@export var id: String
@export var name: String
@export_multiline var description: String
@export var icon: Texture2D
@export var type: ItemType
@export var equip_slot: EquipSlot = EquipSlot.NONE
@export var stackable: bool = true
@export var max_stack: int = 99
@export var value: int = 0
@export var stats: Dictionary = {}
```

### Quest Data Resource
```gdscript
# resources/quests/quest_data.gd
class_name QuestData
extends Resource

@export var id: String
@export var title: String
@export_multiline var description: String
@export var objectives: Array[QuestObjective]
@export var rewards: Array[QuestReward]
@export var prerequisites: Array[String]
```

### Dialogue Data Resource
```gdscript
# resources/dialogues/dialogue_data.gd
class_name DialogueData
extends Resource

@export var id: String
@export var speaker_name: String
@export var portrait: Texture2D
@export var nodes: Array[DialogueNode]
```

## Setup

1. Copy this folder to your project
2. Register autoloads in Project Settings:
   - `GameEvents` → `res://scripts/systems/game_events.gd`
   - `QuestManager` → `res://scripts/systems/quest_manager.gd`
   - `DialogueManager` → `res://scripts/systems/dialogue_manager.gd`
   - `Inventory` → `res://scripts/systems/inventory.gd`
   - `SaveManager` → `res://scripts/systems/save_manager.gd`
3. Create your item/quest/dialogue resources
4. Configure input actions (interact, inventory, menu)

## Usage Examples

### Starting a Quest
```gdscript
func talk_to_npc():
    QuestManager.start_quest(preload("res://resources/quests/main_quest_1.tres"))
```

### Updating Quest Progress
```gdscript
func on_enemy_killed(enemy_type: String):
    QuestManager.update_objective("kill_slimes", "slimes", 1)
```

### Starting Dialogue
```gdscript
func interact():
    var dialogue = preload("res://resources/dialogues/npc_shopkeeper.tres")
    DialogueManager.start_dialogue(dialogue)
```

### Adding Items
```gdscript
func open_chest():
    var sword = preload("res://resources/items/sword_iron.tres")
    var overflow = Inventory.add_item(sword, 1)
    if overflow > 0:
        # Inventory full - spawn item in world
        pass
```

## Requirements

- Godot 4.6+
- Input actions: "interact", "inventory", "menu", "movement" (WASD/arrows)
