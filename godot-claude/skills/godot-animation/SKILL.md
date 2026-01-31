---
name: Godot Animation
description: This skill should be used when the user asks about "AnimationTree", "AnimationPlayer", "animation state machine", "AnimationNodeStateMachine", "blend tree", "BlendTree", "BlendSpace1D", "BlendSpace2D", "IK", "inverse kinematics", "Two-Bone IK", "FABRIK", "Spline IK", "root motion", "animation blending", "animation transitions", "OneShot", "animation callback", "animation events", or needs guidance on advanced animation systems in Godot 4.x.
---

# Godot Animation System (4.6)

Godot's animation system provides AnimationTree for complex state machines, blend trees, and Godot 4.6 introduces enhanced IK (Inverse Kinematics) support.

## AnimationTree Overview

### Basic Setup

```gdscript
class_name AnimatedCharacter
extends CharacterBody3D

@onready var anim_tree: AnimationTree = $AnimationTree
@onready var anim_player: AnimationPlayer = $AnimationPlayer

func _ready() -> void:
    # AnimationTree requires AnimationPlayer reference
    anim_tree.anim_player = anim_player.get_path()
    anim_tree.active = true

# Access state machine for transitions
func get_state_machine() -> AnimationNodeStateMachinePlayback:
    return anim_tree.get("parameters/playback")
```

## AnimationNodeStateMachine

### State Machine Structure

```gdscript
# State machine with states and transitions
# States: Idle, Walk, Run, Jump, Fall, Land

func _ready() -> void:
    var playback: AnimationNodeStateMachinePlayback = anim_tree.get("parameters/playback")

    # Travel to a state (follows transitions)
    playback.travel("Walk")

    # Start immediately (ignores transitions)
    playback.start("Idle")

    # Check current state
    var current: String = playback.get_current_node()

    # Check if traveling
    var is_traveling: bool = playback.is_playing()

func _physics_process(delta: float) -> void:
    var playback: AnimationNodeStateMachinePlayback = anim_tree.get("parameters/playback")

    # Transition based on movement
    if is_on_floor():
        if velocity.length() > 0.1:
            if Input.is_action_pressed("sprint"):
                playback.travel("Run")
            else:
                playback.travel("Walk")
        else:
            playback.travel("Idle")
    else:
        if velocity.y > 0:
            playback.travel("Jump")
        else:
            playback.travel("Fall")
```

### Transition Conditions

```gdscript
# Use conditions for automatic transitions
func update_conditions() -> void:
    # Set conditions in AnimationTree
    anim_tree.set("parameters/conditions/is_grounded", is_on_floor())
    anim_tree.set("parameters/conditions/is_moving", velocity.length() > 0.1)
    anim_tree.set("parameters/conditions/is_jumping", not is_on_floor() and velocity.y > 0)
```

## Blend Trees

### BlendSpace1D

Blend between animations based on single parameter:

```gdscript
# BlendSpace1D for speed-based blending (Idle -> Walk -> Run)
func _physics_process(delta: float) -> void:
    var speed: float = velocity.length()
    var max_speed: float = 10.0

    # Normalize to 0-1 range
    var blend_amount: float = clampf(speed / max_speed, 0.0, 1.0)

    # Set blend parameter
    anim_tree.set("parameters/locomotion/blend_position", blend_amount)
```

### BlendSpace2D

Blend between animations based on two parameters:

```gdscript
# BlendSpace2D for directional movement
func _physics_process(delta: float) -> void:
    # Get local movement direction
    var local_velocity: Vector3 = global_transform.basis.inverse() * velocity

    # Normalize
    var blend_pos: Vector2 = Vector2(
        local_velocity.x / max_speed,
        local_velocity.z / max_speed
    ).limit_length(1.0)

    # Set 2D blend position
    anim_tree.set("parameters/movement/blend_position", blend_pos)
```

### Add2 Node (Additive Blending)

```gdscript
# Layer additive animations (e.g., breathing on top of other anims)
func _ready() -> void:
    # Additive amount (0 = no additive, 1 = full additive)
    anim_tree.set("parameters/additive_breathing/add_amount", 1.0)

# Dynamic additive blending
func set_fatigue(amount: float) -> void:
    # More tired = heavier breathing animation
    anim_tree.set("parameters/additive_breathing/add_amount", amount)
```

### OneShot Node

Play one-shot animations on top of base animations:

```gdscript
# OneShot for actions (attack, reload, etc.)
func attack() -> void:
    # Fire the one-shot
    anim_tree.set("parameters/attack_oneshot/request", AnimationNodeOneShot.ONE_SHOT_REQUEST_FIRE)

func abort_attack() -> void:
    # Cancel the one-shot
    anim_tree.set("parameters/attack_oneshot/request", AnimationNodeOneShot.ONE_SHOT_REQUEST_ABORT)

func _process(delta: float) -> void:
    # Check if one-shot is active
    var is_attacking: bool = anim_tree.get("parameters/attack_oneshot/active")
    if is_attacking:
        # Disable movement during attack
        pass
```

### Transition Node

Smooth transitions between animation branches:

```gdscript
# Transition between combat and exploration states
func enter_combat() -> void:
    anim_tree.set("parameters/combat_transition/transition_request", "combat")

func exit_combat() -> void:
    anim_tree.set("parameters/combat_transition/transition_request", "exploration")
```

## Inverse Kinematics (Godot 4.6)

### Two-Bone IK (SkeletonIK3D)

For arms and legs:

```gdscript
class_name IKCharacter
extends CharacterBody3D

@onready var skeleton: Skeleton3D = $Skeleton3D
@onready var left_foot_ik: SkeletonIK3D = $Skeleton3D/LeftFootIK
@onready var right_foot_ik: SkeletonIK3D = $Skeleton3D/RightFootIK

func _ready() -> void:
    # Configure IK
    left_foot_ik.start()
    right_foot_ik.start()

func _physics_process(delta: float) -> void:
    update_foot_ik()

func update_foot_ik() -> void:
    var space_state := get_world_3d().direct_space_state

    # Left foot
    var left_origin: Vector3 = skeleton.global_position + Vector3(-0.2, 1.0, 0)
    var left_ray := PhysicsRayQueryParameters3D.create(
        left_origin,
        left_origin + Vector3.DOWN * 1.5
    )
    var left_result := space_state.intersect_ray(left_ray)

    if left_result:
        var target := Transform3D()
        target.origin = left_result.position
        target.basis = Basis.looking_at(-left_result.normal)
        left_foot_ik.target = target
        left_foot_ik.interpolation = 1.0
    else:
        left_foot_ik.interpolation = 0.0

    # Repeat for right foot...
```

### Look At IK (Head Tracking)

```gdscript
class_name HeadTracker
extends Node3D

@export var head_bone: String = "Head"
@export var max_angle: float = 60.0
@export var turn_speed: float = 5.0

@onready var skeleton: Skeleton3D = $"../Skeleton3D"

var target: Node3D
var head_bone_idx: int

func _ready() -> void:
    head_bone_idx = skeleton.find_bone(head_bone)

func _process(delta: float) -> void:
    if not target:
        return

    var head_global := skeleton.global_transform * skeleton.get_bone_global_pose(head_bone_idx)
    var direction := (target.global_position - head_global.origin).normalized()

    # Clamp rotation
    var forward := -skeleton.global_transform.basis.z
    var angle := rad_to_deg(forward.angle_to(direction))

    if angle > max_angle:
        return

    # Apply rotation
    var current_pose := skeleton.get_bone_pose(head_bone_idx)
    var target_basis := Basis.looking_at(skeleton.global_transform.basis.inverse() * direction)
    current_pose.basis = current_pose.basis.slerp(target_basis, delta * turn_speed)
    skeleton.set_bone_pose(head_bone_idx, current_pose)
```

### FABRIK (Forward And Backward Reaching IK)

For chains and tentacles (Godot 4.6+):

```gdscript
class_name TentacleIK
extends Node3D

@export var chain_length: int = 5
@export var iterations: int = 10

@onready var skeleton: Skeleton3D = $Skeleton3D

var bone_indices: Array[int] = []
var target_position: Vector3

func _ready() -> void:
    # Get bone chain
    for i in range(chain_length):
        bone_indices.append(skeleton.find_bone("Tentacle_%d" % i))

func _process(delta: float) -> void:
    solve_fabrik()

func solve_fabrik() -> void:
    # Get current positions
    var positions: Array[Vector3] = []
    var lengths: Array[float] = []

    for i in bone_indices.size():
        var pose := skeleton.get_bone_global_pose(bone_indices[i])
        positions.append(pose.origin)
        if i > 0:
            lengths.append(positions[i].distance_to(positions[i - 1]))

    # FABRIK iterations
    for iter in iterations:
        # Backward pass
        positions[-1] = target_position
        for i in range(positions.size() - 2, -1, -1):
            var dir := (positions[i] - positions[i + 1]).normalized()
            positions[i] = positions[i + 1] + dir * lengths[i]

        # Forward pass
        positions[0] = skeleton.get_bone_global_pose(bone_indices[0]).origin
        for i in range(1, positions.size()):
            var dir := (positions[i] - positions[i - 1]).normalized()
            positions[i] = positions[i - 1] + dir * lengths[i - 1]

    # Apply to skeleton
    for i in range(1, bone_indices.size()):
        var pose := skeleton.get_bone_global_pose(bone_indices[i])
        pose.origin = positions[i]
        # Calculate rotation to point to next bone
        if i < bone_indices.size() - 1:
            pose.basis = Basis.looking_at(positions[i + 1] - positions[i])
        skeleton.set_bone_global_pose_override(bone_indices[i], pose, 1.0, true)
```

### Spline IK

For tails and spines:

```gdscript
class_name SplineIK
extends Path3D

@export var bone_chain: Array[String] = []
@export var follow_speed: float = 5.0

@onready var skeleton: Skeleton3D = $"../Skeleton3D"

var bone_indices: Array[int] = []

func _ready() -> void:
    for bone_name in bone_chain:
        bone_indices.append(skeleton.find_bone(bone_name))

func _process(delta: float) -> void:
    update_spine()

func update_spine() -> void:
    var path_length: float = curve.get_baked_length()

    for i in bone_indices.size():
        var t: float = float(i) / float(bone_indices.size() - 1)
        var offset: float = t * path_length

        var pos: Vector3 = curve.sample_baked(offset)
        var tangent: Vector3 = curve.sample_baked_with_rotation(offset).basis.z

        var pose := Transform3D()
        pose.origin = skeleton.global_transform.affine_inverse() * (global_transform * pos)
        pose.basis = Basis.looking_at(tangent)

        skeleton.set_bone_pose_rotation(bone_indices[i], pose.basis.get_rotation_quaternion())
```

## Root Motion

Extract movement from animations:

```gdscript
class_name RootMotionCharacter
extends CharacterBody3D

@onready var anim_tree: AnimationTree = $AnimationTree

func _ready() -> void:
    # Enable root motion in AnimationTree
    anim_tree.advance_expression_base_node = get_path()

func _physics_process(delta: float) -> void:
    # Get root motion from animation
    var root_motion: Vector3 = anim_tree.get_root_motion_position()
    var root_rotation: Quaternion = anim_tree.get_root_motion_rotation()

    # Apply root motion
    velocity = root_motion / delta
    velocity = global_transform.basis * velocity

    # Apply rotation
    global_transform.basis = global_transform.basis * Basis(root_rotation)

    move_and_slide()
```

## Animation Callbacks/Events

### Method Call Track

```gdscript
# Called from animation timeline
func spawn_effect() -> void:
    var effect := preload("res://effects/hit.tscn").instantiate()
    add_child(effect)
    effect.global_position = $EffectSpawnPoint.global_position

func play_sound(sound_name: String) -> void:
    var stream: AudioStream = load("res://audio/" + sound_name + ".ogg")
    $AudioPlayer.stream = stream
    $AudioPlayer.play()

func deal_damage() -> void:
    # Called at the exact frame damage should apply
    var hitbox: Area3D = $AttackHitbox
    for body in hitbox.get_overlapping_bodies():
        if body.has_method("take_damage"):
            body.take_damage(attack_damage)
```

### Animation Finished Signal

```gdscript
func _ready() -> void:
    anim_player.animation_finished.connect(_on_animation_finished)

func _on_animation_finished(anim_name: StringName) -> void:
    match anim_name:
        "attack":
            is_attacking = false
        "death":
            queue_free()
        "reload":
            ammo = max_ammo
```

## Advanced Patterns

### Layered Animation

```gdscript
# Upper body / Lower body separation
func _physics_process(delta: float) -> void:
    # Lower body follows movement
    var move_blend: float = velocity.length() / max_speed
    anim_tree.set("parameters/lower_body/blend_position", move_blend)

    # Upper body can be independent (aiming, attacking)
    if is_aiming:
        anim_tree.set("parameters/upper_body_blend/blend_amount", 1.0)
    else:
        anim_tree.set("parameters/upper_body_blend/blend_amount", 0.0)
```

### Procedural + Animated Hybrid

```gdscript
class_name HybridCharacter
extends CharacterBody3D

@onready var skeleton: Skeleton3D = $Skeleton3D
@onready var anim_tree: AnimationTree = $AnimationTree

var spine_bone_idx: int

func _ready() -> void:
    spine_bone_idx = skeleton.find_bone("Spine")

func _process(delta: float) -> void:
    # Let animation play normally
    # Then apply procedural modifications on top
    apply_procedural_lean()

func apply_procedural_lean() -> void:
    # Lean into turns
    var turn_amount: float = velocity.x / max_speed

    var current_pose := skeleton.get_bone_pose(spine_bone_idx)
    var lean_rotation := Quaternion(Vector3.FORWARD, turn_amount * 0.2)
    current_pose.basis = current_pose.basis * Basis(lean_rotation)
    skeleton.set_bone_pose(spine_bone_idx, current_pose)
```

### Animation State Machine with Sub-States

```gdscript
# Nested state machines for complex behaviors
func _ready() -> void:
    # Main state machine: Locomotion, Combat, Interaction
    # Combat has sub-state machine: Idle, Attack, Block, Dodge
    pass

func enter_combat_attack() -> void:
    # Navigate to nested state
    var main_playback := anim_tree.get("parameters/main/playback") as AnimationNodeStateMachinePlayback
    main_playback.travel("Combat")

    var combat_playback := anim_tree.get("parameters/main/Combat/playback") as AnimationNodeStateMachinePlayback
    combat_playback.travel("Attack")
```

## Performance Tips

```gdscript
# Disable AnimationTree when not visible
func _on_visibility_changed() -> void:
    anim_tree.active = is_visible_in_tree()

# Use animation libraries for shared animations
# Reduces memory when many characters use same anims

# Limit IK updates for distant characters
func _process(delta: float) -> void:
    var distance_to_camera: float = global_position.distance_to(camera.global_position)
    if distance_to_camera > 20.0:
        # Skip IK for distant characters
        ik_node.stop()
    else:
        ik_node.start()
```
