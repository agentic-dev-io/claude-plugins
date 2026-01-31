---
name: Godot Genre Systems
description: This skill should be used when the user asks about "RPG system", "quest system", "dialogue system", "inventory system", "stats", "leveling", "FPS mechanics", "weapon system", "recoil", "hit registration", "platformer", "jump buffer", "coyote time", "wall jump", "RTS", "unit selection", "building placement", "fog of war", "racing game", "vehicle physics", "racing AI", "roguelike", "procedural generation", "permadeath", "run-based", or needs guidance on implementing genre-specific game systems in Godot 4.x.
---

# Genre-Specific Game Systems (Godot 4.6)

This skill covers implementation patterns for common game genres including RPG, FPS, platformer, RTS, racing, and roguelike systems.

## RPG Systems

### Quest System

```gdscript
# quest_data.gd
class_name QuestData
extends Resource

enum QuestState { INACTIVE, ACTIVE, COMPLETED, FAILED }

@export var id: String
@export var title: String
@export_multiline var description: String
@export var objectives: Array[QuestObjective] = []
@export var rewards: Array[RewardData] = []
@export var prerequisites: Array[String] = []  # Quest IDs

class QuestObjective:
    @export var id: String
    @export var description: String
    @export var target_count: int = 1
    var current_count: int = 0

    func is_complete() -> bool:
        return current_count >= target_count

class RewardData:
    @export var type: String  # "xp", "gold", "item"
    @export var amount: int
    @export var item_id: String
```

```gdscript
# quest_manager.gd - Autoload
extends Node

signal quest_started(quest_id: String)
signal quest_updated(quest_id: String, objective_id: String)
signal quest_completed(quest_id: String)

var active_quests: Dictionary = {}  # id -> QuestData
var completed_quests: Array[String] = []

func start_quest(quest: QuestData) -> bool:
    if quest.id in active_quests or quest.id in completed_quests:
        return false

    # Check prerequisites
    for prereq in quest.prerequisites:
        if prereq not in completed_quests:
            return false

    active_quests[quest.id] = quest
    quest_started.emit(quest.id)
    return true

func update_objective(quest_id: String, objective_id: String, amount: int = 1) -> void:
    var quest: QuestData = active_quests.get(quest_id)
    if not quest:
        return

    for objective in quest.objectives:
        if objective.id == objective_id:
            objective.current_count = mini(objective.current_count + amount, objective.target_count)
            quest_updated.emit(quest_id, objective_id)

            if check_quest_complete(quest):
                complete_quest(quest_id)
            break

func check_quest_complete(quest: QuestData) -> bool:
    for objective in quest.objectives:
        if not objective.is_complete():
            return false
    return true

func complete_quest(quest_id: String) -> void:
    var quest: QuestData = active_quests.get(quest_id)
    if not quest:
        return

    # Grant rewards
    for reward in quest.rewards:
        grant_reward(reward)

    active_quests.erase(quest_id)
    completed_quests.append(quest_id)
    quest_completed.emit(quest_id)

func grant_reward(reward: QuestData.RewardData) -> void:
    match reward.type:
        "xp":
            PlayerStats.add_xp(reward.amount)
        "gold":
            PlayerStats.add_gold(reward.amount)
        "item":
            Inventory.add_item(reward.item_id, reward.amount)
```

### Dialogue System

```gdscript
# dialogue_data.gd
class_name DialogueData
extends Resource

@export var id: String
@export var nodes: Array[DialogueNode] = []
@export var start_node_id: String = "start"

class DialogueNode:
    @export var id: String
    @export var speaker: String
    @export_multiline var text: String
    @export var choices: Array[DialogueChoice] = []
    @export var next_node_id: String = ""  # For linear progression
    @export var conditions: Array[String] = []  # Conditions to show this node
    @export var effects: Array[String] = []  # Effects when node is shown

class DialogueChoice:
    @export var text: String
    @export var next_node_id: String
    @export var conditions: Array[String] = []
    @export var effects: Array[String] = []
```

```gdscript
# dialogue_manager.gd
class_name DialogueManager
extends CanvasLayer

signal dialogue_started(dialogue_id: String)
signal dialogue_ended(dialogue_id: String)

@onready var dialogue_box: Control = $DialogueBox
@onready var speaker_label: Label = $DialogueBox/SpeakerLabel
@onready var text_label: RichTextLabel = $DialogueBox/TextLabel
@onready var choices_container: VBoxContainer = $DialogueBox/ChoicesContainer

var current_dialogue: DialogueData
var current_node: DialogueData.DialogueNode

func start_dialogue(dialogue: DialogueData) -> void:
    current_dialogue = dialogue
    dialogue_box.show()
    dialogue_started.emit(dialogue.id)
    show_node(dialogue.start_node_id)

func show_node(node_id: String) -> void:
    current_node = find_node(node_id)
    if not current_node:
        end_dialogue()
        return

    # Check conditions
    for condition in current_node.conditions:
        if not evaluate_condition(condition):
            # Skip to next or end
            if current_node.next_node_id:
                show_node(current_node.next_node_id)
            else:
                end_dialogue()
            return

    # Apply effects
    for effect in current_node.effects:
        apply_effect(effect)

    # Display
    speaker_label.text = current_node.speaker
    text_label.text = current_node.text

    # Show choices or continue button
    clear_choices()
    if current_node.choices.is_empty():
        add_continue_button()
    else:
        for choice in current_node.choices:
            if check_choice_conditions(choice):
                add_choice_button(choice)

func find_node(node_id: String) -> DialogueData.DialogueNode:
    for node in current_dialogue.nodes:
        if node.id == node_id:
            return node
    return null

func select_choice(choice: DialogueData.DialogueChoice) -> void:
    for effect in choice.effects:
        apply_effect(effect)
    show_node(choice.next_node_id)

func continue_dialogue() -> void:
    if current_node.next_node_id:
        show_node(current_node.next_node_id)
    else:
        end_dialogue()

func end_dialogue() -> void:
    dialogue_box.hide()
    dialogue_ended.emit(current_dialogue.id)
    current_dialogue = null
    current_node = null

func evaluate_condition(condition: String) -> bool:
    # Parse condition like "has_item:key" or "quest_complete:intro"
    var parts: PackedStringArray = condition.split(":")
    match parts[0]:
        "has_item":
            return Inventory.has_item(parts[1])
        "quest_complete":
            return QuestManager.is_complete(parts[1])
        "stat_gte":
            return PlayerStats.get_stat(parts[1]) >= int(parts[2])
    return true

func apply_effect(effect: String) -> void:
    var parts: PackedStringArray = effect.split(":")
    match parts[0]:
        "give_item":
            Inventory.add_item(parts[1], int(parts[2]) if parts.size() > 2 else 1)
        "start_quest":
            QuestManager.start_quest_by_id(parts[1])
        "set_flag":
            GameState.set_flag(parts[1], true)
```

### Inventory System

```gdscript
# item_data.gd
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
@export var stats: Dictionary = {}  # stat_name -> value
@export var effects: Array[String] = []

# inventory.gd
class_name Inventory
extends Node

signal item_added(item_id: String, amount: int)
signal item_removed(item_id: String, amount: int)
signal inventory_changed

@export var max_slots: int = 20

var slots: Array[InventorySlot] = []

class InventorySlot:
    var item: ItemData = null
    var count: int = 0

    func is_empty() -> bool:
        return item == null

    func can_add(new_item: ItemData, amount: int) -> bool:
        if is_empty():
            return true
        if item.id != new_item.id:
            return false
        if not item.stackable:
            return false
        return count + amount <= item.max_stack

func _ready() -> void:
    for i in max_slots:
        slots.append(InventorySlot.new())

func add_item(item: ItemData, amount: int = 1) -> int:
    var remaining: int = amount

    # Try to stack with existing
    if item.stackable:
        for slot in slots:
            if not slot.is_empty() and slot.item.id == item.id:
                var can_add: int = item.max_stack - slot.count
                var to_add: int = mini(remaining, can_add)
                slot.count += to_add
                remaining -= to_add
                if remaining == 0:
                    break

    # Add to empty slots
    while remaining > 0:
        var empty_slot: InventorySlot = find_empty_slot()
        if not empty_slot:
            break  # Inventory full

        empty_slot.item = item
        var to_add: int = mini(remaining, item.max_stack if item.stackable else 1)
        empty_slot.count = to_add
        remaining -= to_add

    var added: int = amount - remaining
    if added > 0:
        item_added.emit(item.id, added)
        inventory_changed.emit()

    return remaining  # Return amount that couldn't be added

func remove_item(item_id: String, amount: int = 1) -> bool:
    var remaining: int = amount

    for slot in slots:
        if slot.is_empty() or slot.item.id != item_id:
            continue

        var to_remove: int = mini(remaining, slot.count)
        slot.count -= to_remove
        remaining -= to_remove

        if slot.count == 0:
            slot.item = null

        if remaining == 0:
            break

    if remaining < amount:
        item_removed.emit(item_id, amount - remaining)
        inventory_changed.emit()
        return remaining == 0

    return false

func get_item_count(item_id: String) -> int:
    var total: int = 0
    for slot in slots:
        if not slot.is_empty() and slot.item.id == item_id:
            total += slot.count
    return total

func has_item(item_id: String, amount: int = 1) -> bool:
    return get_item_count(item_id) >= amount

func find_empty_slot() -> InventorySlot:
    for slot in slots:
        if slot.is_empty():
            return slot
    return null
```

### Stats and Leveling

```gdscript
# player_stats.gd - Autoload
extends Node

signal level_up(new_level: int)
signal stat_changed(stat_name: String, new_value: int)
signal xp_changed(current: int, needed: int)

var level: int = 1
var current_xp: int = 0
var stats: Dictionary = {
    "max_health": 100,
    "max_mana": 50,
    "strength": 10,
    "defense": 5,
    "speed": 10
}

# XP curve: level * 100 * level
func xp_for_level(lvl: int) -> int:
    return lvl * 100 * lvl

func add_xp(amount: int) -> void:
    current_xp += amount
    xp_changed.emit(current_xp, xp_for_level(level))

    while current_xp >= xp_for_level(level):
        current_xp -= xp_for_level(level)
        level += 1
        apply_level_up()
        level_up.emit(level)

func apply_level_up() -> void:
    # Increase stats
    modify_stat("max_health", 10)
    modify_stat("max_mana", 5)
    modify_stat("strength", 2)
    modify_stat("defense", 1)
    modify_stat("speed", 1)

func get_stat(stat_name: String) -> int:
    return stats.get(stat_name, 0)

func modify_stat(stat_name: String, amount: int) -> void:
    if stat_name in stats:
        stats[stat_name] += amount
        stat_changed.emit(stat_name, stats[stat_name])

func get_computed_stat(stat_name: String) -> int:
    var base: int = get_stat(stat_name)
    var bonus: int = Equipment.get_stat_bonus(stat_name)
    var multiplier: float = Buffs.get_stat_multiplier(stat_name)
    return int((base + bonus) * multiplier)
```

## FPS Mechanics

### Weapon System

```gdscript
# weapon_data.gd
class_name WeaponData
extends Resource

enum WeaponType { HITSCAN, PROJECTILE, MELEE }
enum FireMode { SEMI, AUTO, BURST }

@export var id: String
@export var name: String
@export var type: WeaponType
@export var fire_mode: FireMode
@export var damage: int = 25
@export var fire_rate: float = 10.0  # Rounds per second
@export var magazine_size: int = 30
@export var reload_time: float = 2.0
@export var spread: float = 1.0  # Degrees
@export var recoil_pattern: Array[Vector2] = []
@export var projectile_scene: PackedScene  # For projectile weapons
@export var projectile_speed: float = 100.0
```

```gdscript
# weapon.gd
class_name Weapon
extends Node3D

signal fired
signal reloading
signal reloaded

@export var data: WeaponData
@onready var muzzle: Marker3D = $Muzzle
@onready var anim_player: AnimationPlayer = $AnimationPlayer

var current_ammo: int
var is_reloading: bool = false
var can_fire: bool = true
var fire_timer: float = 0.0
var recoil_index: int = 0

func _ready() -> void:
    current_ammo = data.magazine_size

func _process(delta: float) -> void:
    if fire_timer > 0:
        fire_timer -= delta
        if fire_timer <= 0:
            can_fire = true

func try_fire() -> bool:
    if is_reloading or not can_fire or current_ammo <= 0:
        return false

    fire()
    return true

func fire() -> void:
    current_ammo -= 1
    can_fire = false
    fire_timer = 1.0 / data.fire_rate

    # Apply spread
    var spread_rad: float = deg_to_rad(data.spread)
    var spread_offset := Vector2(
        randf_range(-spread_rad, spread_rad),
        randf_range(-spread_rad, spread_rad)
    )

    match data.type:
        WeaponData.WeaponType.HITSCAN:
            fire_hitscan(spread_offset)
        WeaponData.WeaponType.PROJECTILE:
            fire_projectile(spread_offset)

    # Apply recoil
    var recoil := get_recoil()
    get_parent().apply_recoil(recoil)

    anim_player.play("fire")
    fired.emit()

func fire_hitscan(spread: Vector2) -> void:
    var camera: Camera3D = get_viewport().get_camera_3d()
    var origin: Vector3 = muzzle.global_position
    var direction: Vector3 = -camera.global_transform.basis.z
    direction = direction.rotated(camera.global_transform.basis.x, spread.y)
    direction = direction.rotated(camera.global_transform.basis.y, spread.x)

    var space_state := get_world_3d().direct_space_state
    var query := PhysicsRayQueryParameters3D.create(origin, origin + direction * 1000)
    query.exclude = [get_parent().get_rid()]
    var result := space_state.intersect_ray(query)

    if result:
        if result.collider.has_method("take_damage"):
            var is_headshot: bool = result.collider.is_in_group("head")
            var damage: int = data.damage * (2 if is_headshot else 1)
            result.collider.take_damage(damage, result.position, direction)

func fire_projectile(spread: Vector2) -> void:
    var projectile: Node3D = data.projectile_scene.instantiate()
    get_tree().root.add_child(projectile)
    projectile.global_transform = muzzle.global_transform

    var direction: Vector3 = -muzzle.global_transform.basis.z
    direction = direction.rotated(muzzle.global_transform.basis.x, spread.y)
    direction = direction.rotated(muzzle.global_transform.basis.y, spread.x)

    projectile.setup(direction, data.projectile_speed, data.damage)

func get_recoil() -> Vector2:
    if data.recoil_pattern.is_empty():
        return Vector2.ZERO

    var recoil: Vector2 = data.recoil_pattern[recoil_index]
    recoil_index = (recoil_index + 1) % data.recoil_pattern.size()
    return recoil

func reload() -> void:
    if is_reloading or current_ammo == data.magazine_size:
        return

    is_reloading = true
    reloading.emit()
    anim_player.play("reload")

    await get_tree().create_timer(data.reload_time).timeout

    current_ammo = data.magazine_size
    is_reloading = false
    recoil_index = 0
    reloaded.emit()
```

### Recoil System

```gdscript
# fps_camera.gd
class_name FPSCamera
extends Node3D

@export var mouse_sensitivity: float = 0.002
@export var recoil_recovery_speed: float = 5.0

var current_recoil: Vector2 = Vector2.ZERO
var target_recoil: Vector2 = Vector2.ZERO

func _input(event: InputEvent) -> void:
    if event is InputEventMouseMotion:
        rotate_y(-event.relative.x * mouse_sensitivity)
        $Camera3D.rotate_x(-event.relative.y * mouse_sensitivity)
        $Camera3D.rotation.x = clamp($Camera3D.rotation.x, -PI/2, PI/2)

func _process(delta: float) -> void:
    # Apply recoil
    if target_recoil.length() > 0.001:
        var recoil_step: Vector2 = target_recoil * delta * 20
        current_recoil += recoil_step
        target_recoil -= recoil_step

        rotate_y(-recoil_step.x)
        $Camera3D.rotate_x(-recoil_step.y)

    # Recover from recoil
    if current_recoil.length() > 0.001:
        var recovery: Vector2 = current_recoil * delta * recoil_recovery_speed
        current_recoil -= recovery
        rotate_y(recovery.x)
        $Camera3D.rotate_x(recovery.y)

func apply_recoil(recoil: Vector2) -> void:
    target_recoil += recoil * 0.01  # Scale recoil values
```

## Platformer Mechanics

### Advanced Player Controller

```gdscript
# platformer_player.gd
class_name PlatformerPlayer
extends CharacterBody2D

# Movement
@export var move_speed: float = 200.0
@export var acceleration: float = 1500.0
@export var friction: float = 1000.0
@export var air_friction: float = 200.0

# Jumping
@export var jump_velocity: float = -400.0
@export var gravity: float = 980.0
@export var fall_gravity_multiplier: float = 1.5
@export var max_fall_speed: float = 600.0
@export var jump_buffer_time: float = 0.1
@export var coyote_time: float = 0.1

# Wall mechanics
@export var wall_slide_speed: float = 100.0
@export var wall_jump_velocity: Vector2 = Vector2(300, -350)
@export var wall_jump_time: float = 0.2

# Dash
@export var dash_speed: float = 500.0
@export var dash_duration: float = 0.15
@export var dash_cooldown: float = 0.5

# State
var coyote_timer: float = 0.0
var jump_buffer_timer: float = 0.0
var wall_jump_timer: float = 0.0
var dash_timer: float = 0.0
var dash_cooldown_timer: float = 0.0
var is_dashing: bool = false
var dash_direction: Vector2 = Vector2.RIGHT
var facing: int = 1
var was_on_floor: bool = false

func _physics_process(delta: float) -> void:
    update_timers(delta)

    var input_dir: float = Input.get_axis("left", "right")

    # Handle dash
    if is_dashing:
        velocity = dash_direction * dash_speed
        dash_timer -= delta
        if dash_timer <= 0:
            is_dashing = false
    else:
        # Horizontal movement
        if wall_jump_timer <= 0:
            apply_horizontal_movement(input_dir, delta)

        # Gravity
        apply_gravity(delta)

        # Wall slide
        if is_on_wall() and not is_on_floor() and input_dir != 0:
            velocity.y = minf(velocity.y, wall_slide_speed)

        # Jump buffer
        if Input.is_action_just_pressed("jump"):
            jump_buffer_timer = jump_buffer_time

        # Jump
        handle_jump()

        # Dash input
        if Input.is_action_just_pressed("dash") and dash_cooldown_timer <= 0:
            start_dash(input_dir)

    # Update facing
    if input_dir != 0:
        facing = sign(input_dir)

    move_and_slide()

    # Update floor state
    was_on_floor = is_on_floor()

func update_timers(delta: float) -> void:
    # Coyote time
    if was_on_floor and not is_on_floor():
        coyote_timer = coyote_time
    elif is_on_floor():
        coyote_timer = 0.0
    else:
        coyote_timer = maxf(coyote_timer - delta, 0.0)

    # Other timers
    jump_buffer_timer = maxf(jump_buffer_timer - delta, 0.0)
    wall_jump_timer = maxf(wall_jump_timer - delta, 0.0)
    dash_cooldown_timer = maxf(dash_cooldown_timer - delta, 0.0)

func apply_horizontal_movement(input_dir: float, delta: float) -> void:
    if input_dir != 0:
        velocity.x = move_toward(velocity.x, input_dir * move_speed, acceleration * delta)
    else:
        var fric: float = friction if is_on_floor() else air_friction
        velocity.x = move_toward(velocity.x, 0, fric * delta)

func apply_gravity(delta: float) -> void:
    if not is_on_floor():
        var grav: float = gravity
        if velocity.y > 0:
            grav *= fall_gravity_multiplier
        velocity.y = minf(velocity.y + grav * delta, max_fall_speed)

func handle_jump() -> void:
    # Regular jump
    if jump_buffer_timer > 0 and (is_on_floor() or coyote_timer > 0):
        velocity.y = jump_velocity
        jump_buffer_timer = 0
        coyote_timer = 0

    # Wall jump
    elif jump_buffer_timer > 0 and is_on_wall():
        var wall_normal: Vector2 = get_wall_normal()
        velocity = Vector2(wall_normal.x * wall_jump_velocity.x, wall_jump_velocity.y)
        wall_jump_timer = wall_jump_time
        jump_buffer_timer = 0

    # Variable jump height
    if Input.is_action_just_released("jump") and velocity.y < 0:
        velocity.y *= 0.5

func start_dash(input_dir: float) -> void:
    is_dashing = true
    dash_timer = dash_duration
    dash_cooldown_timer = dash_cooldown

    if input_dir != 0:
        dash_direction = Vector2(input_dir, 0)
    else:
        dash_direction = Vector2(facing, 0)

    # Optional: Add vertical dash
    var vertical: float = Input.get_axis("up", "down")
    if vertical != 0:
        dash_direction = Vector2(input_dir, vertical).normalized()
```

## RTS Systems

### Unit Selection

```gdscript
# selection_manager.gd
class_name SelectionManager
extends Node

signal selection_changed(units: Array[Unit])

var selected_units: Array[Unit] = []
var selection_box: Rect2
var is_selecting: bool = false

@onready var selection_rect: ColorRect = $SelectionRect

func _input(event: InputEvent) -> void:
    if event is InputEventMouseButton:
        if event.button_index == MOUSE_BUTTON_LEFT:
            if event.pressed:
                start_selection(event.position)
            else:
                end_selection(event.position)

    elif event is InputEventMouseMotion and is_selecting:
        update_selection_box(event.position)

func start_selection(pos: Vector2) -> void:
    is_selecting = true
    selection_box.position = pos
    selection_box.size = Vector2.ZERO

    if not Input.is_key_pressed(KEY_SHIFT):
        clear_selection()

func update_selection_box(pos: Vector2) -> void:
    selection_box.size = pos - selection_box.position
    update_selection_rect()

func end_selection(pos: Vector2) -> void:
    is_selecting = false
    selection_rect.hide()

    if selection_box.size.length() < 5:
        # Click selection
        select_at_point(pos)
    else:
        # Box selection
        select_in_box()

func select_at_point(screen_pos: Vector2) -> void:
    var camera: Camera3D = get_viewport().get_camera_3d()
    var from: Vector3 = camera.project_ray_origin(screen_pos)
    var to: Vector3 = from + camera.project_ray_normal(screen_pos) * 1000

    var space_state := get_world_3d().direct_space_state
    var query := PhysicsRayQueryParameters3D.create(from, to)
    query.collision_mask = 2  # Units layer
    var result := space_state.intersect_ray(query)

    if result and result.collider is Unit:
        add_to_selection(result.collider)

func select_in_box() -> void:
    var camera: Camera3D = get_viewport().get_camera_3d()
    var rect := selection_box.abs()

    for unit in get_tree().get_nodes_in_group("units"):
        if not unit is Unit:
            continue

        var screen_pos: Vector2 = camera.unproject_position(unit.global_position)
        if rect.has_point(screen_pos):
            add_to_selection(unit)

func add_to_selection(unit: Unit) -> void:
    if unit not in selected_units:
        selected_units.append(unit)
        unit.select()
    selection_changed.emit(selected_units)

func clear_selection() -> void:
    for unit in selected_units:
        unit.deselect()
    selected_units.clear()
    selection_changed.emit(selected_units)

func update_selection_rect() -> void:
    var rect := selection_box.abs()
    selection_rect.position = rect.position
    selection_rect.size = rect.size
    selection_rect.show()
```

### Fog of War

```gdscript
# fog_of_war.gd
class_name FogOfWar
extends Node2D

@export var map_size: Vector2i = Vector2i(100, 100)
@export var cell_size: float = 10.0

var visibility: PackedByteArray
var explored: PackedByteArray

@onready var fog_texture: ImageTexture
@onready var fog_sprite: Sprite2D = $FogSprite

func _ready() -> void:
    visibility = PackedByteArray()
    visibility.resize(map_size.x * map_size.y)
    explored = PackedByteArray()
    explored.resize(map_size.x * map_size.y)

    create_fog_texture()

func create_fog_texture() -> void:
    var image := Image.create(map_size.x, map_size.y, false, Image.FORMAT_RGBA8)
    image.fill(Color(0, 0, 0, 1))  # Fully black
    fog_texture = ImageTexture.create_from_image(image)
    fog_sprite.texture = fog_texture
    fog_sprite.scale = Vector2.ONE * cell_size

func _process(delta: float) -> void:
    update_visibility()
    update_fog_texture()

func update_visibility() -> void:
    # Reset visibility
    visibility.fill(0)

    # Update from all viewer units
    for unit in get_tree().get_nodes_in_group("player_units"):
        if unit.has_method("get_view_range"):
            reveal_area(unit.global_position, unit.get_view_range())

func reveal_area(world_pos: Vector2, radius: float) -> void:
    var cell: Vector2i = world_to_cell(world_pos)
    var cell_radius: int = int(radius / cell_size)

    for x in range(-cell_radius, cell_radius + 1):
        for y in range(-cell_radius, cell_radius + 1):
            var check: Vector2i = cell + Vector2i(x, y)
            if not is_valid_cell(check):
                continue

            var dist: float = Vector2(x, y).length() * cell_size
            if dist <= radius:
                var idx: int = check.y * map_size.x + check.x
                visibility[idx] = 255
                explored[idx] = 255

func update_fog_texture() -> void:
    var image := fog_texture.get_image()

    for y in map_size.y:
        for x in map_size.x:
            var idx: int = y * map_size.x + x
            var color: Color

            if visibility[idx] > 0:
                color = Color(0, 0, 0, 0)  # Visible
            elif explored[idx] > 0:
                color = Color(0, 0, 0, 0.5)  # Explored but not visible
            else:
                color = Color(0, 0, 0, 1)  # Unexplored

            image.set_pixel(x, y, color)

    fog_texture.update(image)

func world_to_cell(world_pos: Vector2) -> Vector2i:
    return Vector2i(int(world_pos.x / cell_size), int(world_pos.y / cell_size))

func is_valid_cell(cell: Vector2i) -> bool:
    return cell.x >= 0 and cell.x < map_size.x and cell.y >= 0 and cell.y < map_size.y

func is_visible(world_pos: Vector2) -> bool:
    var cell: Vector2i = world_to_cell(world_pos)
    if not is_valid_cell(cell):
        return false
    return visibility[cell.y * map_size.x + cell.x] > 0
```

## Roguelike Systems

### Procedural Room Generation

```gdscript
# dungeon_generator.gd
class_name DungeonGenerator
extends Node

@export var map_width: int = 50
@export var map_height: int = 50
@export var min_room_size: int = 5
@export var max_room_size: int = 12
@export var max_rooms: int = 15

var rooms: Array[Rect2i] = []
var tilemap: TileMapLayer

class Room:
    var rect: Rect2i
    var connections: Array[Room] = []

    func center() -> Vector2i:
        return rect.position + rect.size / 2

func generate() -> void:
    rooms.clear()
    generate_rooms()
    connect_rooms()
    carve_rooms()
    carve_corridors()
    place_doors()

func generate_rooms() -> void:
    for i in max_rooms:
        var width: int = randi_range(min_room_size, max_room_size)
        var height: int = randi_range(min_room_size, max_room_size)
        var x: int = randi_range(1, map_width - width - 1)
        var y: int = randi_range(1, map_height - height - 1)

        var new_room := Rect2i(x, y, width, height)

        # Check overlap
        var overlaps: bool = false
        for room in rooms:
            if new_room.grow(1).intersects(room):
                overlaps = true
                break

        if not overlaps:
            rooms.append(new_room)

func connect_rooms() -> void:
    # Simple MST-like connection
    var connected: Array[Rect2i] = [rooms[0]]
    var unconnected: Array[Rect2i] = rooms.slice(1)

    while not unconnected.is_empty():
        var best_dist: float = INF
        var best_connected: Rect2i
        var best_unconnected: Rect2i

        for c_room in connected:
            for u_room in unconnected:
                var dist: float = get_room_center(c_room).distance_to(get_room_center(u_room))
                if dist < best_dist:
                    best_dist = dist
                    best_connected = c_room
                    best_unconnected = u_room

        connected.append(best_unconnected)
        unconnected.erase(best_unconnected)

        carve_corridor(get_room_center(best_connected), get_room_center(best_unconnected))

func carve_corridor(start: Vector2i, end: Vector2i) -> void:
    var current: Vector2i = start

    # L-shaped corridor
    if randf() < 0.5:
        # Horizontal first
        while current.x != end.x:
            set_floor(current)
            current.x += sign(end.x - current.x)
        while current.y != end.y:
            set_floor(current)
            current.y += sign(end.y - current.y)
    else:
        # Vertical first
        while current.y != end.y:
            set_floor(current)
            current.y += sign(end.y - current.y)
        while current.x != end.x:
            set_floor(current)
            current.x += sign(end.x - current.x)

func carve_rooms() -> void:
    for room in rooms:
        for x in range(room.position.x, room.position.x + room.size.x):
            for y in range(room.position.y, room.position.y + room.size.y):
                set_floor(Vector2i(x, y))

func get_room_center(room: Rect2i) -> Vector2i:
    return room.position + room.size / 2

func set_floor(pos: Vector2i) -> void:
    tilemap.set_cell(pos, 0, Vector2i(1, 0))  # Floor tile

func get_spawn_room() -> Rect2i:
    return rooms[0]

func get_exit_room() -> Rect2i:
    return rooms[-1]
```

### Run-Based Progression

```gdscript
# run_manager.gd - Autoload
extends Node

signal run_started
signal run_ended(success: bool)

var current_floor: int = 0
var run_stats: RunStats

class RunStats:
    var floors_cleared: int = 0
    var enemies_killed: int = 0
    var damage_taken: int = 0
    var gold_collected: int = 0
    var items_found: Array[String] = []
    var run_time: float = 0.0
    var seed: int = 0

func start_run(seed: int = -1) -> void:
    if seed == -1:
        seed = randi()

    run_stats = RunStats.new()
    run_stats.seed = seed
    seed(seed)

    current_floor = 1
    PlayerStats.reset_to_defaults()
    Inventory.clear()

    run_started.emit()
    load_floor(current_floor)

func advance_floor() -> void:
    current_floor += 1
    run_stats.floors_cleared += 1

    if current_floor > MAX_FLOORS:
        end_run(true)
    else:
        load_floor(current_floor)

func load_floor(floor_num: int) -> void:
    var generator := DungeonGenerator.new()
    generator.generate()

    # Scale difficulty
    var enemy_count: int = 5 + floor_num * 2
    var enemy_health_mult: float = 1.0 + floor_num * 0.2

    spawn_enemies(generator.rooms, enemy_count, enemy_health_mult)
    spawn_items(generator.rooms)
    spawn_player(generator.get_spawn_room())
    spawn_exit(generator.get_exit_room())

func end_run(success: bool) -> void:
    run_stats.run_time = Time.get_ticks_msec() / 1000.0

    # Unlock meta progression
    if success:
        MetaProgression.unlock_next_character()

    MetaProgression.add_currency(run_stats.gold_collected)

    run_ended.emit(success)

func _process(delta: float) -> void:
    if run_stats:
        run_stats.run_time += delta
```
