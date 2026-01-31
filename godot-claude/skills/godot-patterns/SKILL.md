---
name: Godot Design Patterns
description: This skill should be used when the user asks about "state machine", "FSM", "finite state machine", "hierarchical state machine", "behavior tree", "BT", "ECS", "entity component system", "composition", "design pattern", "command pattern", "observer pattern", "mediator", "service locator", "singleton alternative", "game architecture", "decoupling", "event bus", or needs guidance on software design patterns and architecture in Godot 4.x.
---

# Game Design Patterns in Godot (4.6)

This skill covers essential design patterns for game development in Godot, including state machines, behavior trees, and architectural patterns.

## Finite State Machine (FSM)

### Basic State Pattern

```gdscript
# state.gd - Base State
class_name State
extends Node

var state_machine: StateMachine

func enter() -> void:
    pass

func exit() -> void:
    pass

func update(delta: float) -> void:
    pass

func physics_update(delta: float) -> void:
    pass

func handle_input(event: InputEvent) -> void:
    pass
```

```gdscript
# state_machine.gd
class_name StateMachine
extends Node

@export var initial_state: State

var current_state: State
var states: Dictionary = {}

func _ready() -> void:
    for child in get_children():
        if child is State:
            states[child.name.to_lower()] = child
            child.state_machine = self

    if initial_state:
        current_state = initial_state
        current_state.enter()

func _process(delta: float) -> void:
    if current_state:
        current_state.update(delta)

func _physics_process(delta: float) -> void:
    if current_state:
        current_state.physics_update(delta)

func _unhandled_input(event: InputEvent) -> void:
    if current_state:
        current_state.handle_input(event)

func transition_to(state_name: String) -> void:
    var new_state: State = states.get(state_name.to_lower())
    if not new_state:
        push_error("State not found: " + state_name)
        return

    if current_state:
        current_state.exit()

    current_state = new_state
    current_state.enter()
```

### Concrete States Example

```gdscript
# player_idle.gd
class_name PlayerIdle
extends State

@onready var player: CharacterBody3D = owner

func enter() -> void:
    player.anim_tree.set("parameters/conditions/is_idle", true)

func exit() -> void:
    player.anim_tree.set("parameters/conditions/is_idle", false)

func physics_update(delta: float) -> void:
    if player.velocity.length() > 0.1:
        state_machine.transition_to("walk")

    if Input.is_action_just_pressed("jump") and player.is_on_floor():
        state_machine.transition_to("jump")

func handle_input(event: InputEvent) -> void:
    if event.is_action_pressed("attack"):
        state_machine.transition_to("attack")
```

```gdscript
# player_walk.gd
class_name PlayerWalk
extends State

@export var move_speed: float = 5.0

@onready var player: CharacterBody3D = owner

func physics_update(delta: float) -> void:
    var input_dir := Input.get_vector("left", "right", "forward", "back")
    var direction := (player.transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()

    if direction:
        player.velocity.x = direction.x * move_speed
        player.velocity.z = direction.z * move_speed
    else:
        state_machine.transition_to("idle")

    if Input.is_action_just_pressed("jump") and player.is_on_floor():
        state_machine.transition_to("jump")

    if Input.is_action_pressed("sprint"):
        state_machine.transition_to("run")

    player.move_and_slide()
```

## Hierarchical State Machine

```gdscript
# hierarchical_state.gd
class_name HierarchicalState
extends State

var sub_state_machine: StateMachine

func _ready() -> void:
    # Find child state machine
    for child in get_children():
        if child is StateMachine:
            sub_state_machine = child
            break

func enter() -> void:
    if sub_state_machine:
        sub_state_machine.current_state.enter()

func exit() -> void:
    if sub_state_machine and sub_state_machine.current_state:
        sub_state_machine.current_state.exit()

func update(delta: float) -> void:
    if sub_state_machine:
        sub_state_machine.current_state.update(delta)

func physics_update(delta: float) -> void:
    if sub_state_machine:
        sub_state_machine.current_state.physics_update(delta)
```

```gdscript
# Usage - Scene structure:
# Player
# └── StateMachine
#     ├── Grounded (HierarchicalState)
#     │   └── GroundedStateMachine
#     │       ├── Idle
#     │       ├── Walk
#     │       └── Run
#     ├── Airborne (HierarchicalState)
#     │   └── AirborneStateMachine
#     │       ├── Jump
#     │       └── Fall
#     └── Combat (HierarchicalState)
#         └── CombatStateMachine
#             ├── Attack
#             └── Block
```

## Behavior Trees

### Node Types

```gdscript
# bt_node.gd - Base Behavior Tree Node
class_name BTNode
extends Node

enum Status { SUCCESS, FAILURE, RUNNING }

var blackboard: Dictionary  # Shared data

func tick(delta: float) -> Status:
    return Status.SUCCESS

func reset() -> void:
    pass
```

### Composite Nodes

```gdscript
# bt_selector.gd - Tries children until one succeeds
class_name BTSelector
extends BTNode

var current_child: int = 0

func tick(delta: float) -> Status:
    while current_child < get_child_count():
        var child: BTNode = get_child(current_child)
        var status := child.tick(delta)

        match status:
            Status.SUCCESS:
                reset()
                return Status.SUCCESS
            Status.RUNNING:
                return Status.RUNNING
            Status.FAILURE:
                current_child += 1

    reset()
    return Status.FAILURE

func reset() -> void:
    current_child = 0
    for child in get_children():
        if child is BTNode:
            child.reset()
```

```gdscript
# bt_sequence.gd - Runs children until one fails
class_name BTSequence
extends BTNode

var current_child: int = 0

func tick(delta: float) -> Status:
    while current_child < get_child_count():
        var child: BTNode = get_child(current_child)
        var status := child.tick(delta)

        match status:
            Status.FAILURE:
                reset()
                return Status.FAILURE
            Status.RUNNING:
                return Status.RUNNING
            Status.SUCCESS:
                current_child += 1

    reset()
    return Status.SUCCESS

func reset() -> void:
    current_child = 0
    for child in get_children():
        if child is BTNode:
            child.reset()
```

### Decorator Nodes

```gdscript
# bt_inverter.gd
class_name BTInverter
extends BTNode

func tick(delta: float) -> Status:
    var child: BTNode = get_child(0)
    var status := child.tick(delta)

    match status:
        Status.SUCCESS:
            return Status.FAILURE
        Status.FAILURE:
            return Status.SUCCESS
        _:
            return Status.RUNNING

# bt_repeat.gd
class_name BTRepeat
extends BTNode

@export var times: int = 3

var count: int = 0

func tick(delta: float) -> Status:
    var child: BTNode = get_child(0)

    while count < times:
        var status := child.tick(delta)

        match status:
            Status.SUCCESS:
                count += 1
                child.reset()
            Status.FAILURE:
                reset()
                return Status.FAILURE
            Status.RUNNING:
                return Status.RUNNING

    reset()
    return Status.SUCCESS

func reset() -> void:
    count = 0
```

### Leaf Nodes (Actions/Conditions)

```gdscript
# bt_condition.gd - Check condition
class_name BTCondition
extends BTNode

func tick(delta: float) -> Status:
    if check_condition():
        return Status.SUCCESS
    return Status.FAILURE

func check_condition() -> bool:
    return false  # Override in subclass

# bt_action.gd - Perform action
class_name BTAction
extends BTNode

func tick(delta: float) -> Status:
    return execute(delta)

func execute(delta: float) -> Status:
    return Status.SUCCESS  # Override in subclass
```

### Example AI Behavior

```gdscript
# enemy_can_see_player.gd
class_name EnemyCanSeePlayer
extends BTCondition

func check_condition() -> bool:
    var enemy: Node3D = blackboard.get("owner")
    var player: Node3D = blackboard.get("player")

    if not player:
        return false

    var distance := enemy.global_position.distance_to(player.global_position)
    if distance > 20.0:
        return false

    # Raycast visibility check
    var space_state := enemy.get_world_3d().direct_space_state
    var query := PhysicsRayQueryParameters3D.create(
        enemy.global_position + Vector3.UP,
        player.global_position + Vector3.UP
    )
    var result := space_state.intersect_ray(query)

    return result.is_empty() or result.collider == player

# enemy_chase_player.gd
class_name EnemyChasePlayer
extends BTAction

func execute(delta: float) -> Status:
    var enemy: CharacterBody3D = blackboard.get("owner")
    var player: Node3D = blackboard.get("player")
    var nav_agent: NavigationAgent3D = blackboard.get("nav_agent")

    if not player:
        return Status.FAILURE

    nav_agent.target_position = player.global_position

    if nav_agent.is_navigation_finished():
        return Status.SUCCESS

    var next_pos := nav_agent.get_next_path_position()
    var direction := (next_pos - enemy.global_position).normalized()
    enemy.velocity = direction * blackboard.get("chase_speed", 5.0)
    enemy.move_and_slide()

    return Status.RUNNING
```

## Component Pattern (ECS-like)

### Component Base

```gdscript
# component.gd
class_name GameComponent
extends Node

var entity: Node

func _ready() -> void:
    entity = get_parent()

func component_ready() -> void:
    pass

# health_component.gd
class_name HealthComponent
extends GameComponent

signal died
signal health_changed(current: int, max_health: int)

@export var max_health: int = 100

var current_health: int

func _ready() -> void:
    super()
    current_health = max_health

func take_damage(amount: int) -> void:
    current_health = maxi(0, current_health - amount)
    health_changed.emit(current_health, max_health)

    if current_health == 0:
        died.emit()

func heal(amount: int) -> void:
    current_health = mini(max_health, current_health + amount)
    health_changed.emit(current_health, max_health)
```

```gdscript
# hitbox_component.gd
class_name HitboxComponent
extends Area3D

signal hit(damage: int, source: Node)

@export var damage: int = 10

func _ready() -> void:
    area_entered.connect(_on_area_entered)

func _on_area_entered(area: Area3D) -> void:
    if area is HurtboxComponent:
        hit.emit(damage, owner)
        area.receive_hit(damage, owner)

# hurtbox_component.gd
class_name HurtboxComponent
extends Area3D

func receive_hit(damage: int, source: Node) -> void:
    var health: HealthComponent = owner.get_node_or_null("HealthComponent")
    if health:
        health.take_damage(damage)
```

### Component Registry

```gdscript
# component_entity.gd
class_name ComponentEntity
extends Node3D

var components: Dictionary = {}

func _ready() -> void:
    # Register all components
    for child in get_children():
        if child is GameComponent:
            components[child.get_class()] = child
            child.entity = self

    # Initialize after all registered
    for component in components.values():
        component.component_ready()

func get_component(component_class: String) -> GameComponent:
    return components.get(component_class)

func has_component(component_class: String) -> bool:
    return components.has(component_class)
```

## Command Pattern

For undo/redo and input buffering:

```gdscript
# command.gd
class_name Command
extends RefCounted

func execute() -> void:
    pass

func undo() -> void:
    pass

# move_command.gd
class_name MoveCommand
extends Command

var entity: Node3D
var direction: Vector3
var previous_position: Vector3

func _init(p_entity: Node3D, p_direction: Vector3) -> void:
    entity = p_entity
    direction = p_direction

func execute() -> void:
    previous_position = entity.global_position
    entity.global_position += direction

func undo() -> void:
    entity.global_position = previous_position
```

```gdscript
# command_manager.gd
class_name CommandManager
extends Node

var history: Array[Command] = []
var redo_stack: Array[Command] = []
var max_history: int = 100

func execute(command: Command) -> void:
    command.execute()
    history.append(command)
    redo_stack.clear()

    if history.size() > max_history:
        history.pop_front()

func undo() -> void:
    if history.is_empty():
        return

    var command: Command = history.pop_back()
    command.undo()
    redo_stack.append(command)

func redo() -> void:
    if redo_stack.is_empty():
        return

    var command: Command = redo_stack.pop_back()
    command.execute()
    history.append(command)
```

## Event Bus (Observer Pattern)

```gdscript
# events.gd - Autoload
extends Node

# Define all game events as signals
signal player_died
signal enemy_killed(enemy: Node, killer: Node)
signal item_collected(item_id: String, amount: int)
signal score_changed(new_score: int)
signal level_completed(level_id: int)
signal game_paused(is_paused: bool)
signal cutscene_started(cutscene_id: String)
signal cutscene_ended(cutscene_id: String)
signal achievement_unlocked(achievement_id: String)

# Typed event data for complex events
signal combat_event(data: CombatEventData)

class CombatEventData:
    var attacker: Node
    var target: Node
    var damage: int
    var damage_type: String
    var is_critical: bool
```

```gdscript
# Usage - Emitting events
func _on_player_death() -> void:
    Events.player_died.emit()

func kill_enemy(enemy: Node) -> void:
    Events.enemy_killed.emit(enemy, self)

# Usage - Listening to events
func _ready() -> void:
    Events.player_died.connect(_on_player_died)
    Events.enemy_killed.connect(_on_enemy_killed)

func _on_player_died() -> void:
    show_game_over_screen()

func _on_enemy_killed(enemy: Node, killer: Node) -> void:
    score += enemy.score_value
```

## Service Locator

Alternative to singletons/autoloads:

```gdscript
# service_locator.gd - Autoload
extends Node

var _services: Dictionary = {}

func register_service(service_name: String, service: Object) -> void:
    _services[service_name] = service

func unregister_service(service_name: String) -> void:
    _services.erase(service_name)

func get_service(service_name: String) -> Object:
    return _services.get(service_name)

func has_service(service_name: String) -> bool:
    return _services.has(service_name)
```

```gdscript
# Usage
# In audio_manager.gd
func _ready() -> void:
    ServiceLocator.register_service("audio", self)

# Anywhere else
func play_sound(sound: AudioStream) -> void:
    var audio: AudioManager = ServiceLocator.get_service("audio")
    if audio:
        audio.play(sound)
```

## Mediator Pattern

Centralized communication:

```gdscript
# game_mediator.gd
class_name GameMediator
extends Node

var player: Node
var enemies: Array[Node] = []
var ui: Control

func register_player(p: Node) -> void:
    player = p
    p.damaged.connect(_on_player_damaged)
    p.died.connect(_on_player_died)

func register_enemy(e: Node) -> void:
    enemies.append(e)
    e.died.connect(_on_enemy_died.bind(e))

func register_ui(u: Control) -> void:
    ui = u

func _on_player_damaged(damage: int) -> void:
    if ui:
        ui.update_health(player.health)

    # Alert nearby enemies
    for enemy in enemies:
        if enemy.global_position.distance_to(player.global_position) < 20:
            enemy.alert()

func _on_player_died() -> void:
    for enemy in enemies:
        enemy.celebrate()
    if ui:
        ui.show_game_over()

func _on_enemy_died(enemy: Node) -> void:
    enemies.erase(enemy)
    if ui:
        ui.update_score(enemy.score_value)
```

## Object Pool Pattern

```gdscript
# object_pool.gd
class_name ObjectPool
extends Node

@export var pooled_scene: PackedScene
@export var initial_size: int = 20
@export var can_grow: bool = true

var available: Array[Node] = []
var in_use: Array[Node] = []

func _ready() -> void:
    for i in initial_size:
        create_instance()

func create_instance() -> Node:
    var instance: Node = pooled_scene.instantiate()
    instance.set_process(false)
    instance.set_physics_process(false)
    instance.hide()
    add_child(instance)
    available.append(instance)
    return instance

func get_instance() -> Node:
    var instance: Node

    if available.is_empty():
        if can_grow:
            instance = create_instance()
            available.pop_back()  # Remove from available
        else:
            return null
    else:
        instance = available.pop_back()

    in_use.append(instance)
    instance.set_process(true)
    instance.set_physics_process(true)
    instance.show()
    return instance

func release_instance(instance: Node) -> void:
    if instance not in in_use:
        return

    in_use.erase(instance)
    available.append(instance)
    instance.set_process(false)
    instance.set_physics_process(false)
    instance.hide()

    # Reset instance state
    if instance.has_method("reset"):
        instance.reset()
```

## Resource-Based Configuration

```gdscript
# enemy_config.gd
class_name EnemyConfig
extends Resource

@export var name: String
@export var max_health: int = 100
@export var move_speed: float = 5.0
@export var attack_damage: int = 10
@export var attack_range: float = 2.0
@export var detection_range: float = 15.0
@export var loot_table: Array[LootEntry] = []
@export var behavior_tree: PackedScene

class LootEntry:
    @export var item: Resource
    @export var chance: float = 0.5
    @export var min_amount: int = 1
    @export var max_amount: int = 1
```

```gdscript
# enemy.gd
class_name Enemy
extends CharacterBody3D

@export var config: EnemyConfig

func _ready() -> void:
    $HealthComponent.max_health = config.max_health
    $NavigationAgent3D.max_speed = config.move_speed

    var bt: BTNode = config.behavior_tree.instantiate()
    bt.blackboard = {
        "owner": self,
        "attack_damage": config.attack_damage,
        "attack_range": config.attack_range,
        "detection_range": config.detection_range
    }
    add_child(bt)
```
