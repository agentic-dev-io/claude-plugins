---
name: godot-netcode
description: Setup multiplayer architecture for Godot 4.6 games
argument-hint: "[architecture: authoritative|p2p|rollback] [game-type]"
allowed-tools:
  - Write
  - Read
  - Glob
---

# Multiplayer Netcode Setup

Configure multiplayer networking architecture for Godot 4.6 games including connection handling, synchronization, and game-specific patterns.

## Arguments

Parse the user's arguments:
- `architecture`: Network architecture type - default: authoritative
  - `authoritative`: Server-authoritative (recommended for most games)
  - `p2p`: Peer-to-peer (good for co-op, turn-based)
  - `rollback`: Rollback netcode (fighting games, fast-paced action)
- `game-type`: Optional game type for specialized setup (fps, racing, rts)

## Execution

1. **Determine project root** by finding `project.godot`

2. **Create networking infrastructure based on architecture**:

### Server-Authoritative (Default)

**scripts/networking/network_manager.gd** - Autoload:
```gdscript
extends Node

## Network Manager - Autoload
## Handles connection management and network events

signal connection_succeeded
signal connection_failed
signal server_disconnected
signal player_connected(peer_id: int)
signal player_disconnected(peer_id: int)
signal all_players_ready

const DEFAULT_PORT: int = 7777
const MAX_PLAYERS: int = 8

var peer: ENetMultiplayerPeer
var player_info: Dictionary = {}  # peer_id -> PlayerInfo
var players_ready: Dictionary = {}  # peer_id -> bool

class PlayerInfo:
    var id: int
    var name: String
    var is_host: bool

func _ready() -> void:
    multiplayer.peer_connected.connect(_on_peer_connected)
    multiplayer.peer_disconnected.connect(_on_peer_disconnected)
    multiplayer.connected_to_server.connect(_on_connected_to_server)
    multiplayer.connection_failed.connect(_on_connection_failed)
    multiplayer.server_disconnected.connect(_on_server_disconnected)

## Connection Management

func host_game(port: int = DEFAULT_PORT, player_name: String = "Host") -> Error:
    peer = ENetMultiplayerPeer.new()
    var error := peer.create_server(port, MAX_PLAYERS)

    if error != OK:
        push_error("Failed to create server: " + str(error))
        return error

    multiplayer.multiplayer_peer = peer

    # Register host as player
    var info := PlayerInfo.new()
    info.id = 1
    info.name = player_name
    info.is_host = true
    player_info[1] = info

    print("Server started on port ", port)
    return OK

func join_game(address: String, port: int = DEFAULT_PORT, player_name: String = "Player") -> Error:
    peer = ENetMultiplayerPeer.new()
    var error := peer.create_client(address, port)

    if error != OK:
        push_error("Failed to connect: " + str(error))
        return error

    multiplayer.multiplayer_peer = peer

    # Store local player name (will be sent after connection)
    var info := PlayerInfo.new()
    info.name = player_name
    info.is_host = false
    player_info[0] = info  # Temporary, will update with real ID

    print("Connecting to ", address, ":", port)
    return OK

func disconnect_from_game() -> void:
    if peer:
        peer.close()
    multiplayer.multiplayer_peer = null
    player_info.clear()
    players_ready.clear()

## Callbacks

func _on_peer_connected(id: int) -> void:
    print("Peer connected: ", id)

    if multiplayer.is_server():
        # Send existing player info to new player
        for peer_id in player_info:
            _send_player_info.rpc_id(id, peer_id, player_info[peer_id].name)

    player_connected.emit(id)

func _on_peer_disconnected(id: int) -> void:
    print("Peer disconnected: ", id)
    player_info.erase(id)
    players_ready.erase(id)
    player_disconnected.emit(id)

func _on_connected_to_server() -> void:
    print("Connected to server")
    var my_id: int = multiplayer.get_unique_id()

    # Update local player info
    var info: PlayerInfo = player_info[0]
    info.id = my_id
    player_info.erase(0)
    player_info[my_id] = info

    # Send our info to server
    _register_player.rpc_id(1, info.name)

    connection_succeeded.emit()

func _on_connection_failed() -> void:
    print("Connection failed")
    connection_failed.emit()

func _on_server_disconnected() -> void:
    print("Server disconnected")
    disconnect_from_game()
    server_disconnected.emit()

## RPCs

@rpc("any_peer", "reliable")
func _register_player(player_name: String) -> void:
    var sender_id: int = multiplayer.get_remote_sender_id()

    var info := PlayerInfo.new()
    info.id = sender_id
    info.name = player_name
    info.is_host = false
    player_info[sender_id] = info

    # Broadcast to all clients
    _send_player_info.rpc(sender_id, player_name)

@rpc("authority", "reliable", "call_local")
func _send_player_info(peer_id: int, player_name: String) -> void:
    if peer_id not in player_info:
        var info := PlayerInfo.new()
        info.id = peer_id
        info.name = player_name
        player_info[peer_id] = info

@rpc("any_peer", "reliable")
func set_player_ready(ready: bool) -> void:
    var sender_id: int = multiplayer.get_remote_sender_id()
    if sender_id == 0:
        sender_id = multiplayer.get_unique_id()

    players_ready[sender_id] = ready

    # Check if all players ready
    if multiplayer.is_server():
        if _are_all_players_ready():
            all_players_ready.emit()

func _are_all_players_ready() -> bool:
    for peer_id in player_info:
        if not players_ready.get(peer_id, false):
            return false
    return player_info.size() >= 2  # At least 2 players

## Utilities

func is_server() -> bool:
    return multiplayer.is_server()

func get_my_id() -> int:
    return multiplayer.get_unique_id()

func get_player_count() -> int:
    return player_info.size()

func get_player_name(peer_id: int) -> String:
    if peer_id in player_info:
        return player_info[peer_id].name
    return "Unknown"
```

**scripts/networking/game_state_sync.gd** - Autoload:
```gdscript
extends Node

## Synchronizes game state between server and clients

signal game_started
signal game_ended(winner_id: int)

var game_in_progress: bool = false

func _ready() -> void:
    NetworkManager.all_players_ready.connect(_on_all_players_ready)

func _on_all_players_ready() -> void:
    if NetworkManager.is_server():
        start_game.rpc()

@rpc("authority", "reliable", "call_local")
func start_game() -> void:
    game_in_progress = true
    game_started.emit()

@rpc("authority", "reliable", "call_local")
func end_game(winner_id: int) -> void:
    game_in_progress = false
    game_ended.emit(winner_id)
```

**scripts/networking/networked_player.gd** - Player with sync:
```gdscript
class_name NetworkedPlayer
extends CharacterBody3D

@export var move_speed: float = 5.0
@export var sync_rate: float = 0.05  # 20 Hz

@onready var sync: MultiplayerSynchronizer = $MultiplayerSynchronizer

var player_name: String = ""
var sync_timer: float = 0.0

# Synced properties (configured in MultiplayerSynchronizer)
var synced_position: Vector3
var synced_rotation: float
var health: int = 100

func _ready() -> void:
    # Only process input for local player
    set_physics_process(is_multiplayer_authority())

    if is_multiplayer_authority():
        # Local player setup
        $Camera3D.current = true
    else:
        # Remote player - interpolate
        set_process(true)

func _physics_process(delta: float) -> void:
    if not is_multiplayer_authority():
        return

    # Handle input
    var input_dir := Input.get_vector("left", "right", "forward", "back")
    var direction := (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()

    if direction:
        velocity.x = direction.x * move_speed
        velocity.z = direction.z * move_speed
    else:
        velocity.x = move_toward(velocity.x, 0, move_speed)
        velocity.z = move_toward(velocity.z, 0, move_speed)

    move_and_slide()

    # Update synced properties
    synced_position = global_position
    synced_rotation = rotation.y

func _process(delta: float) -> void:
    if is_multiplayer_authority():
        return

    # Interpolate remote players
    global_position = global_position.lerp(synced_position, 10 * delta)
    rotation.y = lerp_angle(rotation.y, synced_rotation, 10 * delta)

@rpc("authority", "reliable", "call_local")
func take_damage(amount: int) -> void:
    health -= amount
    if health <= 0:
        die()

func die() -> void:
    # Handle death
    pass
```

**scripts/networking/spawner_setup.gd** - MultiplayerSpawner helper:
```gdscript
extends Node

## Attach to MultiplayerSpawner to handle custom spawn logic

@export var player_scene: PackedScene

@onready var spawner: MultiplayerSpawner = $"."
@onready var spawn_container: Node = $"../Players"

func _ready() -> void:
    spawner.spawn_function = _custom_spawn
    spawner.spawn_path = spawn_container.get_path()

    if NetworkManager.is_server():
        NetworkManager.player_connected.connect(_on_player_connected)
        NetworkManager.player_disconnected.connect(_on_player_disconnected)

        # Spawn existing players (including host)
        for peer_id in NetworkManager.player_info:
            spawn_player(peer_id)

func _on_player_connected(peer_id: int) -> void:
    spawn_player(peer_id)

func _on_player_disconnected(peer_id: int) -> void:
    var player: Node = spawn_container.get_node_or_null(str(peer_id))
    if player:
        player.queue_free()

func spawn_player(peer_id: int) -> void:
    spawner.spawn(peer_id)

func _custom_spawn(peer_id: int) -> Node:
    var player: Node = player_scene.instantiate()
    player.name = str(peer_id)
    player.set_multiplayer_authority(peer_id)

    # Set spawn position
    var spawn_points: Array = get_tree().get_nodes_in_group("spawn_points")
    if not spawn_points.is_empty():
        var spawn_index: int = peer_id % spawn_points.size()
        player.global_position = spawn_points[spawn_index].global_position

    player.player_name = NetworkManager.get_player_name(peer_id)
    return player
```

### Rollback Architecture

Additional files for rollback netcode:

**scripts/networking/rollback/rollback_manager.gd**:
```gdscript
extends Node

## Rollback Network Manager
## For fighting games and fast-paced action

const ROLLBACK_FRAMES: int = 7
const INPUT_DELAY: int = 2
const MAX_PREDICTION: int = 8

signal simulation_started
signal rollback_occurred(frames: int)

var frame: int = 0
var confirmed_frame: int = 0

var local_inputs: Dictionary = {}  # frame -> input
var remote_inputs: Dictionary = {}  # frame -> {peer_id: input}
var predicted_inputs: Dictionary = {}  # frame -> {peer_id: input}

var state_history: Array[Dictionary] = []

func _physics_process(delta: float) -> void:
    if not GameStateSync.game_in_progress:
        return

    # Gather local input
    var local_input := _gather_input()
    local_inputs[frame + INPUT_DELAY] = local_input

    # Send input to peers
    _broadcast_input.rpc(frame + INPUT_DELAY, local_input)

    # Simulate frame
    if _can_simulate(frame):
        _simulate_frame(frame)
        _save_state(frame)
        frame += 1

    # Check for rollback
    _check_rollback()

func _gather_input() -> Dictionary:
    return {
        "direction": Input.get_vector("left", "right", "up", "down"),
        "attack": Input.is_action_pressed("attack"),
        "jump": Input.is_action_pressed("jump"),
        "block": Input.is_action_pressed("block")
    }

func _can_simulate(f: int) -> bool:
    # Need confirmed or predicted input from all players
    return true  # Simplified - add proper checks

func _simulate_frame(f: int) -> void:
    var inputs: Dictionary = _get_inputs_for_frame(f)

    for peer_id in inputs:
        var player: Node = _get_player(peer_id)
        if player and player.has_method("apply_input"):
            player.apply_input(inputs[peer_id])

    # Advance physics
    # get_tree().physics_frame  # Manual step if needed

func _save_state(f: int) -> void:
    var state: Dictionary = {}

    for player in get_tree().get_nodes_in_group("rollback_sync"):
        if player.has_method("get_state"):
            state[player.get_path()] = player.get_state()

    state_history.append({"frame": f, "state": state})

    # Cleanup old states
    while state_history.size() > ROLLBACK_FRAMES + MAX_PREDICTION:
        state_history.pop_front()

func _check_rollback() -> void:
    # Check if received input differs from prediction
    for f in remote_inputs:
        if f in predicted_inputs:
            for peer_id in remote_inputs[f]:
                if peer_id in predicted_inputs[f]:
                    if remote_inputs[f][peer_id] != predicted_inputs[f][peer_id]:
                        _perform_rollback(f)
                        return

func _perform_rollback(target_frame: int) -> void:
    # Find state for target frame
    var state: Dictionary = null
    for s in state_history:
        if s.frame == target_frame:
            state = s.state
            break

    if not state:
        push_error("Cannot rollback: state not found for frame " + str(target_frame))
        return

    # Restore state
    for path in state:
        var node: Node = get_node_or_null(path)
        if node and node.has_method("set_state"):
            node.set_state(state[path])

    # Re-simulate all frames
    var frames_to_resim: int = frame - target_frame
    rollback_occurred.emit(frames_to_resim)

    for f in range(target_frame, frame):
        _simulate_frame(f)
        _save_state(f)

func _get_inputs_for_frame(f: int) -> Dictionary:
    var inputs: Dictionary = {}

    # Local input
    inputs[NetworkManager.get_my_id()] = local_inputs.get(f, {})

    # Remote inputs (confirmed or predicted)
    for peer_id in NetworkManager.player_info:
        if peer_id == NetworkManager.get_my_id():
            continue

        if f in remote_inputs and peer_id in remote_inputs[f]:
            inputs[peer_id] = remote_inputs[f][peer_id]
        else:
            # Predict: repeat last known input
            inputs[peer_id] = _predict_input(peer_id, f)
            if f not in predicted_inputs:
                predicted_inputs[f] = {}
            predicted_inputs[f][peer_id] = inputs[peer_id]

    return inputs

func _predict_input(peer_id: int, f: int) -> Dictionary:
    # Find most recent input
    for check_frame in range(f - 1, f - MAX_PREDICTION, -1):
        if check_frame in remote_inputs and peer_id in remote_inputs[check_frame]:
            return remote_inputs[check_frame][peer_id]
    return {}

@rpc("any_peer", "unreliable_ordered")
func _broadcast_input(input_frame: int, input: Dictionary) -> void:
    var sender_id: int = multiplayer.get_remote_sender_id()

    if input_frame not in remote_inputs:
        remote_inputs[input_frame] = {}

    remote_inputs[input_frame][sender_id] = input

func _get_player(peer_id: int) -> Node:
    return get_tree().get_first_node_in_group("player_" + str(peer_id))
```

## Output

After creation, report:
- Files created
- How to register autoloads in project settings
- Recommended scene structure
- Testing steps for local multiplayer

## Tips

- Always test with simulated latency (ENet has built-in simulation)
- Validate all client input on the server
- Use unreliable_ordered for frequent updates (position)
- Use reliable for important events (damage, spawns)
- Consider WebSocket for web exports
