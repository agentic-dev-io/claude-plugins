---
name: Godot Multiplayer
description: This skill should be used when the user asks about "multiplayer", "netcode", "networking", "RPC", "@rpc", "MultiplayerSpawner", "MultiplayerSynchronizer", "peer-to-peer", "client-server", "host", "ENet", "WebSocket", "rollback", "prediction", "interpolation", "lag compensation", "server reconciliation", "network synchronization", "authority", "multiplayer_authority", or needs guidance on implementing multiplayer games in Godot 4.x.
---

# Godot Multiplayer System (4.6)

Godot 4.x provides a high-level multiplayer API with SceneMultiplayer, automatic synchronization, and RPC support. This skill covers both basic networking and advanced netcode patterns.

## High-Level Multiplayer API

### Network Setup

```gdscript
# network_manager.gd - Autoload
extends Node

signal connection_succeeded
signal connection_failed
signal server_disconnected
signal player_connected(id: int)
signal player_disconnected(id: int)

const DEFAULT_PORT: int = 7777
const MAX_PLAYERS: int = 8

var peer: ENetMultiplayerPeer

func _ready() -> void:
    multiplayer.peer_connected.connect(_on_peer_connected)
    multiplayer.peer_disconnected.connect(_on_peer_disconnected)
    multiplayer.connected_to_server.connect(_on_connected_to_server)
    multiplayer.connection_failed.connect(_on_connection_failed)
    multiplayer.server_disconnected.connect(_on_server_disconnected)

func host_game(port: int = DEFAULT_PORT) -> Error:
    peer = ENetMultiplayerPeer.new()
    var error := peer.create_server(port, MAX_PLAYERS)
    if error != OK:
        return error

    multiplayer.multiplayer_peer = peer
    print("Server started on port ", port)
    return OK

func join_game(address: String, port: int = DEFAULT_PORT) -> Error:
    peer = ENetMultiplayerPeer.new()
    var error := peer.create_client(address, port)
    if error != OK:
        return error

    multiplayer.multiplayer_peer = peer
    print("Connecting to ", address, ":", port)
    return OK

func disconnect_game() -> void:
    if peer:
        peer.close()
    multiplayer.multiplayer_peer = null

func _on_peer_connected(id: int) -> void:
    print("Player connected: ", id)
    player_connected.emit(id)

func _on_peer_disconnected(id: int) -> void:
    print("Player disconnected: ", id)
    player_disconnected.emit(id)

func _on_connected_to_server() -> void:
    print("Connected to server")
    connection_succeeded.emit()

func _on_connection_failed() -> void:
    print("Connection failed")
    connection_failed.emit()

func _on_server_disconnected() -> void:
    print("Server disconnected")
    server_disconnected.emit()

func is_server() -> bool:
    return multiplayer.is_server()

func get_my_id() -> int:
    return multiplayer.get_unique_id()
```

### WebSocket Alternative

```gdscript
# For web exports
func host_websocket(port: int = DEFAULT_PORT) -> Error:
    var ws_peer := WebSocketMultiplayerPeer.new()
    var error := ws_peer.create_server(port)
    if error != OK:
        return error

    multiplayer.multiplayer_peer = ws_peer
    return OK

func join_websocket(url: String) -> Error:
    var ws_peer := WebSocketMultiplayerPeer.new()
    var error := ws_peer.create_client(url)
    if error != OK:
        return error

    multiplayer.multiplayer_peer = ws_peer
    return OK
```

## RPC System

### RPC Annotations

```gdscript
# Player controller with network authority
class_name NetworkPlayer
extends CharacterBody3D

@export var move_speed: float = 5.0

func _ready() -> void:
    # Only process input for local player
    set_physics_process(is_multiplayer_authority())

func _physics_process(delta: float) -> void:
    if not is_multiplayer_authority():
        return

    var input_dir := Input.get_vector("left", "right", "forward", "back")
    var direction := (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()

    if direction:
        velocity.x = direction.x * move_speed
        velocity.z = direction.z * move_speed
    else:
        velocity.x = move_toward(velocity.x, 0, move_speed)
        velocity.z = move_toward(velocity.z, 0, move_speed)

    move_and_slide()

# RPC - called on all peers
@rpc("any_peer", "call_local", "reliable")
func chat_message(message: String) -> void:
    var sender_id: int = multiplayer.get_remote_sender_id()
    print("[", sender_id, "]: ", message)

# RPC - called only on server
@rpc("any_peer", "call_remote", "reliable")
func request_spawn(player_name: String) -> void:
    if not multiplayer.is_server():
        return
    var sender_id: int = multiplayer.get_remote_sender_id()
    spawn_player(sender_id, player_name)

# RPC - called from server to all clients
@rpc("authority", "call_local", "reliable")
func take_damage(amount: int) -> void:
    health -= amount
    $HealthBar.value = health
```

### RPC Modes Explained

```gdscript
# Authority modes:
# "any_peer" - any connected peer can call this RPC
# "authority" - only the multiplayer authority can call this RPC

# Call modes:
# "call_local" - also execute on the caller
# "call_remote" - only execute on remote peers

# Transfer modes:
# "reliable" - guaranteed delivery, ordered (TCP-like)
# "unreliable" - fast but may be lost (UDP-like)
# "unreliable_ordered" - unreliable but ordered

# Examples:
@rpc("any_peer", "call_local", "reliable")     # Chat message
@rpc("authority", "call_remote", "reliable")   # Server spawning
@rpc("any_peer", "call_remote", "unreliable")  # Position updates
```

## MultiplayerSpawner

Automatic scene synchronization:

```gdscript
# Game scene setup
# GameWorld
# ├── MultiplayerSpawner
# ├── Players (spawn path)
# └── Enemies (spawn path)

@onready var spawner: MultiplayerSpawner = $MultiplayerSpawner
@onready var players_container: Node = $Players

func _ready() -> void:
    # Configure spawner
    spawner.spawn_path = players_container.get_path()
    spawner.spawn_function = spawn_player_custom

    # Add spawnable scenes
    spawner.add_spawnable_scene("res://scenes/player.tscn")
    spawner.add_spawnable_scene("res://scenes/enemy.tscn")

    if multiplayer.is_server():
        NetworkManager.player_connected.connect(_on_player_joined)
        NetworkManager.player_disconnected.connect(_on_player_left)

func spawn_player_custom(data: Variant) -> Node:
    var player: Node = preload("res://scenes/player.tscn").instantiate()
    player.name = str(data)  # Use peer ID as name
    player.set_multiplayer_authority(data)
    return player

func _on_player_joined(id: int) -> void:
    # Spawn will automatically sync to all clients
    spawner.spawn(id)

func _on_player_left(id: int) -> void:
    var player: Node = players_container.get_node_or_null(str(id))
    if player:
        player.queue_free()
```

## MultiplayerSynchronizer

Automatic property synchronization:

```gdscript
# Player scene structure:
# Player (CharacterBody3D)
# ├── MultiplayerSynchronizer
# ├── Mesh
# └── CollisionShape

# In editor, configure MultiplayerSynchronizer:
# - Replication: position, rotation, velocity, health
# - Visibility: public (all see) or filtered

# player.gd
class_name SyncedPlayer
extends CharacterBody3D

# Properties to sync (configured in MultiplayerSynchronizer)
var health: int = 100
var current_weapon: int = 0

@onready var sync: MultiplayerSynchronizer = $MultiplayerSynchronizer

func _ready() -> void:
    # Set visibility for authority
    sync.set_visibility_for(multiplayer.get_unique_id(), true)

# Server authoritative health
@rpc("authority", "call_local", "reliable")
func set_health(value: int) -> void:
    health = value
    if health <= 0:
        die()
```

### Sync Configuration in Code

```gdscript
func setup_synchronizer() -> void:
    var sync := MultiplayerSynchronizer.new()

    # Configure what to sync
    var config := SceneReplicationConfig.new()

    # Add properties to sync
    config.add_property(":position")
    config.add_property(":rotation")
    config.add_property(":velocity")
    config.add_property("health")

    # Set replication interval (lower = more updates)
    sync.replication_interval = 0.05  # 20 Hz

    # Sync mode
    sync.replication_config = config

    add_child(sync)
```

## Client-Side Prediction

```gdscript
class_name PredictedPlayer
extends CharacterBody3D

const BUFFER_SIZE: int = 64

var input_buffer: Array[InputState] = []
var state_buffer: Array[PlayerState] = []
var tick: int = 0

class InputState:
    var tick: int
    var direction: Vector2
    var jump: bool

class PlayerState:
    var tick: int
    var position: Vector3
    var velocity: Vector3

func _physics_process(delta: float) -> void:
    if is_multiplayer_authority():
        # Gather input
        var input := InputState.new()
        input.tick = tick
        input.direction = Input.get_vector("left", "right", "forward", "back")
        input.jump = Input.is_action_just_pressed("jump")

        # Store input
        input_buffer.append(input)
        if input_buffer.size() > BUFFER_SIZE:
            input_buffer.pop_front()

        # Apply input locally (prediction)
        apply_input(input, delta)

        # Send to server
        send_input.rpc_id(1, input.tick, input.direction, input.jump)

        # Store predicted state
        var state := PlayerState.new()
        state.tick = tick
        state.position = global_position
        state.velocity = velocity
        state_buffer.append(state)
        if state_buffer.size() > BUFFER_SIZE:
            state_buffer.pop_front()

        tick += 1

func apply_input(input: InputState, delta: float) -> void:
    var direction := (transform.basis * Vector3(input.direction.x, 0, input.direction.y)).normalized()
    velocity.x = direction.x * move_speed
    velocity.z = direction.z * move_speed

    if input.jump and is_on_floor():
        velocity.y = jump_velocity

    velocity.y -= gravity * delta
    move_and_slide()

@rpc("any_peer", "call_remote", "unreliable_ordered")
func send_input(input_tick: int, direction: Vector2, jump: bool) -> void:
    # Server receives and processes input
    pass

@rpc("authority", "call_remote", "unreliable_ordered")
func server_state(server_tick: int, pos: Vector3, vel: Vector3) -> void:
    # Find matching predicted state
    var predicted: PlayerState = null
    for state in state_buffer:
        if state.tick == server_tick:
            predicted = state
            break

    if not predicted:
        return

    # Check prediction error
    var position_error: float = pos.distance_to(predicted.position)

    if position_error > 0.1:  # Threshold
        # Reconcile - snap to server state
        global_position = pos
        velocity = vel

        # Re-simulate all inputs after this tick
        for input in input_buffer:
            if input.tick > server_tick:
                apply_input(input, get_physics_process_delta_time())
```

## Server Reconciliation

```gdscript
# server_player.gd - Server-side player processing
class_name ServerPlayer
extends CharacterBody3D

var pending_inputs: Array[Dictionary] = []
var last_processed_tick: int = 0

func _physics_process(delta: float) -> void:
    # Process all pending inputs
    for input in pending_inputs:
        process_input(input, delta)

    pending_inputs.clear()

    # Send authoritative state to client
    var client_id: int = get_multiplayer_authority()
    send_state.rpc_id(client_id, last_processed_tick, global_position, velocity)

func receive_input(tick: int, direction: Vector2, jump: bool) -> void:
    pending_inputs.append({
        "tick": tick,
        "direction": direction,
        "jump": jump
    })
    last_processed_tick = tick

func process_input(input: Dictionary, delta: float) -> void:
    var direction := (transform.basis * Vector3(input.direction.x, 0, input.direction.y)).normalized()
    velocity.x = direction.x * move_speed
    velocity.z = direction.z * move_speed

    if input.jump and is_on_floor():
        velocity.y = jump_velocity

    velocity.y -= gravity * delta
    move_and_slide()

@rpc("authority", "call_remote", "unreliable_ordered")
func send_state(tick: int, pos: Vector3, vel: Vector3) -> void:
    pass  # Client receives this
```

## Interpolation

Smooth remote player movement:

```gdscript
class_name InterpolatedPlayer
extends CharacterBody3D

const INTERPOLATION_OFFSET: float = 0.1  # 100ms buffer

var position_buffer: Array[PositionSnapshot] = []

class PositionSnapshot:
    var timestamp: float
    var position: Vector3
    var rotation: Vector3

func _process(delta: float) -> void:
    if is_multiplayer_authority():
        return  # Local player doesn't interpolate

    interpolate_position()

func interpolate_position() -> void:
    var render_time: float = Time.get_unix_time_from_system() - INTERPOLATION_OFFSET

    # Find surrounding snapshots
    var before: PositionSnapshot = null
    var after: PositionSnapshot = null

    for i in range(position_buffer.size() - 1):
        if position_buffer[i].timestamp <= render_time and position_buffer[i + 1].timestamp >= render_time:
            before = position_buffer[i]
            after = position_buffer[i + 1]
            break

    if before and after:
        var t: float = (render_time - before.timestamp) / (after.timestamp - before.timestamp)
        global_position = before.position.lerp(after.position, t)
        rotation = Vector3(
            lerp_angle(before.rotation.x, after.rotation.x, t),
            lerp_angle(before.rotation.y, after.rotation.y, t),
            lerp_angle(before.rotation.z, after.rotation.z, t)
        )

    # Clean old snapshots
    while position_buffer.size() > 2 and position_buffer[0].timestamp < render_time - 1.0:
        position_buffer.pop_front()

@rpc("authority", "call_remote", "unreliable_ordered")
func receive_snapshot(timestamp: float, pos: Vector3, rot: Vector3) -> void:
    var snapshot := PositionSnapshot.new()
    snapshot.timestamp = timestamp
    snapshot.position = pos
    snapshot.rotation = rot
    position_buffer.append(snapshot)
```

## Lag Compensation

Server-side hit detection with lag compensation:

```gdscript
class_name LagCompensatedServer
extends Node

const HISTORY_LENGTH: float = 1.0  # 1 second of history

var player_history: Dictionary = {}  # peer_id -> Array[PositionSnapshot]

func record_player_state(peer_id: int, position: Vector3) -> void:
    if not player_history.has(peer_id):
        player_history[peer_id] = []

    var snapshot := {
        "timestamp": Time.get_unix_time_from_system(),
        "position": position
    }

    player_history[peer_id].append(snapshot)

    # Clean old history
    var cutoff: float = Time.get_unix_time_from_system() - HISTORY_LENGTH
    player_history[peer_id] = player_history[peer_id].filter(func(s): return s.timestamp > cutoff)

func get_player_position_at_time(peer_id: int, timestamp: float) -> Vector3:
    var history: Array = player_history.get(peer_id, [])

    if history.is_empty():
        return Vector3.ZERO

    # Find surrounding snapshots
    for i in range(history.size() - 1):
        if history[i].timestamp <= timestamp and history[i + 1].timestamp >= timestamp:
            var t: float = (timestamp - history[i].timestamp) / (history[i + 1].timestamp - history[i].timestamp)
            return history[i].position.lerp(history[i + 1].position, t)

    # Return most recent if timestamp is in the future
    return history[-1].position

@rpc("any_peer", "call_remote", "reliable")
func request_hit_check(target_id: int, client_timestamp: float, shot_origin: Vector3, shot_direction: Vector3) -> void:
    var shooter_id: int = multiplayer.get_remote_sender_id()

    # Estimate client's perceived time (accounting for RTT)
    var rtt: float = get_player_rtt(shooter_id)
    var server_time: float = client_timestamp + rtt / 2

    # Get target's position at that time
    var target_position: Vector3 = get_player_position_at_time(target_id, server_time)

    # Perform hit check
    var space_state := get_world_3d().direct_space_state
    var query := PhysicsRayQueryParameters3D.create(shot_origin, shot_origin + shot_direction * 100)
    var result := space_state.intersect_ray(query)

    # Check if hit matches rewound position
    if result and result.position.distance_to(target_position) < 1.0:
        # Valid hit
        confirm_hit.rpc(target_id, 25)  # 25 damage

@rpc("authority", "call_local", "reliable")
func confirm_hit(target_id: int, damage: int) -> void:
    var target: Node = get_node_or_null("/root/Game/Players/" + str(target_id))
    if target and target.has_method("take_damage"):
        target.take_damage(damage)
```

## Rollback Networking

For fighting games and fast-paced action:

```gdscript
class_name RollbackManager
extends Node

const ROLLBACK_FRAMES: int = 7
const INPUT_DELAY: int = 2

var frame: int = 0
var game_state_history: Array[GameState] = []
var input_history: Dictionary = {}  # frame -> {peer_id: input}
var confirmed_frame: int = 0

class GameState:
    var frame: int
    var players: Dictionary  # peer_id -> PlayerData
    var objects: Array

func _physics_process(delta: float) -> void:
    # Gather local input with delay
    var local_input := gather_local_input()
    schedule_input(frame + INPUT_DELAY, multiplayer.get_unique_id(), local_input)

    # Send input to other players
    broadcast_input.rpc(frame + INPUT_DELAY, local_input)

    # Process frame
    if can_simulate_frame(frame):
        simulate_frame(frame)
        save_game_state(frame)
        frame += 1

    # Cleanup old states
    cleanup_old_states()

func can_simulate_frame(f: int) -> bool:
    # Need input from all players for this frame
    if not input_history.has(f):
        return false

    var required_peers: Array = multiplayer.get_peers()
    required_peers.append(multiplayer.get_unique_id())

    for peer_id in required_peers:
        if not input_history[f].has(peer_id):
            return false

    return true

func receive_remote_input(remote_frame: int, peer_id: int, input: Dictionary) -> void:
    schedule_input(remote_frame, peer_id, input)

    # Check if we need to rollback
    if remote_frame < frame:
        rollback_to_frame(remote_frame)

func rollback_to_frame(target_frame: int) -> void:
    # Find saved state
    var state: GameState = null
    for s in game_state_history:
        if s.frame == target_frame:
            state = s
            break

    if not state:
        push_error("Cannot rollback: state not found")
        return

    # Restore state
    restore_game_state(state)

    # Re-simulate frames
    for f in range(target_frame, frame):
        if can_simulate_frame(f):
            simulate_frame(f)
            save_game_state(f)

func simulate_frame(f: int) -> void:
    var inputs: Dictionary = input_history[f]

    for peer_id in inputs:
        var player: Node = get_player(peer_id)
        if player:
            player.apply_input(inputs[peer_id])

    # Update physics
    get_tree().physics_frame  # or manual physics step

@rpc("any_peer", "call_remote", "unreliable_ordered")
func broadcast_input(input_frame: int, input: Dictionary) -> void:
    var sender_id: int = multiplayer.get_remote_sender_id()
    receive_remote_input(input_frame, sender_id, input)
```

## Best Practices

```gdscript
# 1. Minimize bandwidth
# Only sync what's necessary
var synced_position: Vector3:
    set(value):
        # Round to reduce precision (saves bandwidth)
        synced_position = Vector3(
            snappedf(value.x, 0.01),
            snappedf(value.y, 0.01),
            snappedf(value.z, 0.01)
        )

# 2. Use appropriate transfer modes
@rpc("any_peer", "call_remote", "unreliable_ordered")  # Position updates
@rpc("any_peer", "call_remote", "reliable")            # Important events

# 3. Validate all client input on server
@rpc("any_peer", "call_remote", "reliable")
func request_action(action: String, target_id: int) -> void:
    var sender_id: int = multiplayer.get_remote_sender_id()

    # Validate sender can perform action
    if not can_player_do_action(sender_id, action, target_id):
        return

    # Execute action server-side
    execute_action(sender_id, action, target_id)

# 4. Handle disconnections gracefully
func _on_peer_disconnected(id: int) -> void:
    # Clean up player
    var player: Node = get_node_or_null("Players/" + str(id))
    if player:
        player.queue_free()

    # Notify other players
    player_left.rpc(id)
```
