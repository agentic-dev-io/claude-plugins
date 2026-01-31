# Racing Starter Template

A Godot 4.6 template for racing games including vehicle physics, track system, checkpoints, and AI racers.

## Structure

```
racing-starter/
├── project.godot
├── scenes/
│   ├── main.tscn                 # Main race scene
│   ├── vehicles/
│   │   ├── vehicle_base.tscn     # Base vehicle (VehicleBody3D)
│   │   ├── player_car.tscn       # Player vehicle
│   │   └── ai_car.tscn           # AI vehicle
│   ├── track/
│   │   ├── track_base.tscn       # Track template
│   │   ├── checkpoint.tscn       # Checkpoint trigger
│   │   ├── start_line.tscn       # Race start
│   │   └── finish_line.tscn      # Race end
│   ├── camera/
│   │   └── race_camera.tscn      # Chase/cockpit camera
│   ├── effects/
│   │   ├── tire_smoke.tscn       # Drift smoke
│   │   ├── skid_marks.tscn       # Tire marks
│   │   └── sparks.tscn           # Collision sparks
│   └── ui/
│       ├── race_hud.tscn         # Speed, position, lap
│       ├── minimap.tscn          # Track minimap
│       ├── countdown.tscn        # Race start countdown
│       └── results.tscn          # Race results
├── scripts/
│   ├── vehicles/
│   │   ├── vehicle_controller.gd # Vehicle physics
│   │   ├── vehicle_input.gd      # Input handling
│   │   ├── vehicle_audio.gd      # Engine sounds
│   │   └── drift_controller.gd   # Drift mechanics
│   ├── track/
│   │   ├── checkpoint_manager.gd # Checkpoint tracking
│   │   ├── lap_counter.gd        # Lap/position tracking
│   │   └── race_line.gd          # AI racing line
│   ├── ai/
│   │   ├── ai_driver.gd          # AI vehicle control
│   │   └── racing_line_follower.gd
│   ├── camera/
│   │   └── race_camera.gd        # Dynamic camera
│   └── systems/
│       ├── race_manager.gd       # Race state (Autoload)
│       └── leaderboard.gd        # Position tracking
├── resources/
│   └── vehicles/
│       └── vehicle_data.gd       # Vehicle stats resource
└── materials/
    └── skid_mark.tres            # Tire mark material
```

## Features

### Vehicle Physics
- Realistic VehicleBody3D setup
- Engine power curves
- Gear shifting (auto/manual)
- Suspension tuning
- Tire grip model

### Drift System
- Drift initiation (handbrake + steering)
- Drift angle control
- Drift boost charging
- Visual effects (smoke, sparks)

### Track System
- Checkpoint validation
- Lap counting
- Split times
- Invalid lap detection
- Shortcuts prevention

### AI Racing
- Racing line following
- Rubber-banding (optional)
- Collision avoidance
- Difficulty levels

### Camera System
- Chase camera
- Cockpit view
- Replay camera
- Dynamic FOV based on speed

## Core Systems

### Vehicle Controller
```gdscript
# scripts/vehicles/vehicle_controller.gd
class_name RacingVehicle
extends VehicleBody3D

@export var data: VehicleData

# Engine
var current_rpm: float = 0.0
var current_gear: int = 1
var throttle: float = 0.0
var brake_input: float = 0.0
var steering_input: float = 0.0

# Wheels
@onready var wheel_fl: VehicleWheel3D = $WheelFL
@onready var wheel_fr: VehicleWheel3D = $WheelFR
@onready var wheel_rl: VehicleWheel3D = $WheelRL
@onready var wheel_rr: VehicleWheel3D = $WheelRR

func _physics_process(delta: float) -> void:
    update_engine(delta)
    update_steering(delta)
    update_wheels(delta)
    check_drift()

func update_engine(delta: float) -> void:
    # Calculate RPM from wheel speed
    var wheel_rpm = (wheel_rl.get_rpm() + wheel_rr.get_rpm()) / 2.0
    var gear_ratio = data.gear_ratios[current_gear - 1]
    current_rpm = abs(wheel_rpm * gear_ratio * data.final_drive)
    current_rpm = clamp(current_rpm, data.idle_rpm, data.max_rpm)

    # Calculate engine force
    var torque = get_torque_at_rpm(current_rpm)
    var engine_force = torque * gear_ratio * data.final_drive * throttle
    engine_force -= get_drag_force()

    self.engine_force = engine_force

func update_steering(delta: float) -> void:
    var target_angle = steering_input * data.max_steer_angle
    var speed_factor = clamp(1.0 - linear_velocity.length() / 50.0, 0.3, 1.0)
    target_angle *= speed_factor

    steering = lerp(steering, deg_to_rad(target_angle), delta * data.steering_speed)

func get_torque_at_rpm(rpm: float) -> float:
    # Simple torque curve
    var normalized_rpm = (rpm - data.idle_rpm) / (data.max_rpm - data.idle_rpm)
    var torque_mult = 1.0 - pow(normalized_rpm - 0.7, 2)
    return data.max_torque * torque_mult

func get_drag_force() -> float:
    var speed = linear_velocity.length()
    return data.drag_coefficient * speed * speed

func get_speed_kmh() -> float:
    return linear_velocity.length() * 3.6

func auto_shift() -> void:
    var shift_up_rpm = data.max_rpm * 0.9
    var shift_down_rpm = data.max_rpm * 0.4

    if current_rpm > shift_up_rpm and current_gear < data.gear_ratios.size():
        current_gear += 1
    elif current_rpm < shift_down_rpm and current_gear > 1:
        current_gear -= 1
```

### Drift System
```gdscript
# scripts/vehicles/drift_controller.gd
class_name DriftController
extends Node

@export var vehicle: RacingVehicle
@export var drift_angle_threshold: float = 15.0
@export var boost_charge_rate: float = 10.0
@export var max_boost: float = 100.0

var is_drifting: bool = false
var drift_angle: float = 0.0
var drift_boost: float = 0.0

signal drift_started
signal drift_ended
signal boost_ready

func _physics_process(delta: float) -> void:
    calculate_drift_angle()

    if abs(drift_angle) > drift_angle_threshold and vehicle.is_on_ground():
        if not is_drifting:
            start_drift()

        # Charge boost while drifting
        drift_boost = min(drift_boost + boost_charge_rate * delta, max_boost)
    else:
        if is_drifting:
            end_drift()

func calculate_drift_angle() -> void:
    var velocity_dir = vehicle.linear_velocity.normalized()
    var forward_dir = -vehicle.global_transform.basis.z

    if vehicle.linear_velocity.length() > 5.0:
        drift_angle = rad_to_deg(velocity_dir.signed_angle_to(forward_dir, Vector3.UP))
    else:
        drift_angle = 0.0

func start_drift() -> void:
    is_drifting = true
    drift_started.emit()

func end_drift() -> void:
    is_drifting = false
    drift_ended.emit()

    if drift_boost >= max_boost:
        boost_ready.emit()

func use_boost() -> float:
    var boost = drift_boost
    drift_boost = 0.0
    return boost
```

### Checkpoint Manager
```gdscript
# scripts/track/checkpoint_manager.gd
class_name CheckpointManager
extends Node

signal checkpoint_passed(vehicle: RacingVehicle, checkpoint_index: int)
signal lap_completed(vehicle: RacingVehicle, lap_time: float)
signal race_finished(vehicle: RacingVehicle, total_time: float)

@export var total_laps: int = 3
@export var checkpoints: Array[Area3D] = []

var vehicle_progress: Dictionary = {}  # vehicle -> {lap, checkpoint, times}

func register_vehicle(vehicle: RacingVehicle) -> void:
    vehicle_progress[vehicle] = {
        "current_lap": 0,
        "current_checkpoint": 0,
        "lap_times": [],
        "lap_start_time": 0.0,
        "total_time": 0.0,
        "finished": false
    }

func _on_checkpoint_entered(checkpoint_index: int, vehicle: RacingVehicle) -> void:
    var progress = vehicle_progress[vehicle]

    if progress.finished:
        return

    # Validate checkpoint order
    if checkpoint_index == progress.current_checkpoint:
        progress.current_checkpoint += 1
        checkpoint_passed.emit(vehicle, checkpoint_index)

        # Check for lap completion
        if progress.current_checkpoint >= checkpoints.size():
            complete_lap(vehicle)

func complete_lap(vehicle: RacingVehicle) -> void:
    var progress = vehicle_progress[vehicle]
    var lap_time = Time.get_ticks_msec() / 1000.0 - progress.lap_start_time

    progress.lap_times.append(lap_time)
    progress.current_checkpoint = 0
    progress.current_lap += 1
    progress.lap_start_time = Time.get_ticks_msec() / 1000.0

    lap_completed.emit(vehicle, lap_time)

    if progress.current_lap >= total_laps:
        finish_race(vehicle)

func finish_race(vehicle: RacingVehicle) -> void:
    var progress = vehicle_progress[vehicle]
    progress.finished = true
    progress.total_time = progress.lap_times.reduce(func(a, b): return a + b)

    race_finished.emit(vehicle, progress.total_time)
```

### AI Driver
```gdscript
# scripts/ai/ai_driver.gd
class_name AIDriver
extends Node

@export var vehicle: RacingVehicle
@export var racing_line: Path3D
@export var look_ahead_distance: float = 20.0
@export var difficulty: float = 1.0  # 0-1

var path_follow: PathFollow3D
var current_speed_target: float = 0.0

func _ready() -> void:
    path_follow = PathFollow3D.new()
    racing_line.add_child(path_follow)

func _physics_process(delta: float) -> void:
    update_path_position()
    calculate_inputs()

func update_path_position() -> void:
    # Find closest point on racing line
    var vehicle_pos = vehicle.global_position
    path_follow.progress = racing_line.curve.get_closest_offset(
        racing_line.to_local(vehicle_pos)
    )

func calculate_inputs() -> void:
    # Look ahead on racing line
    var look_ahead_progress = path_follow.progress + look_ahead_distance
    path_follow.progress = look_ahead_progress
    var target_point = path_follow.global_position
    path_follow.progress -= look_ahead_distance

    # Calculate steering
    var to_target = target_point - vehicle.global_position
    var forward = -vehicle.global_transform.basis.z
    var angle = forward.signed_angle_to(to_target.normalized(), Vector3.UP)

    vehicle.steering_input = clamp(angle * 2.0, -1.0, 1.0) * difficulty

    # Calculate throttle
    var speed = vehicle.get_speed_kmh()
    var target_speed = get_target_speed_at_position()

    if speed < target_speed * difficulty:
        vehicle.throttle = 1.0
        vehicle.brake_input = 0.0
    else:
        vehicle.throttle = 0.0
        vehicle.brake_input = clamp((speed - target_speed) / 50.0, 0.0, 1.0)

func get_target_speed_at_position() -> float:
    # Calculate safe speed based on upcoming curve
    var curve_radius = estimate_curve_radius()
    return sqrt(curve_radius * 10) * 3.6  # Simple approximation
```

## Setup

1. Copy this folder to your project
2. Configure input actions:
   - `accelerate`, `brake`, `steer_left`, `steer_right`
   - `handbrake`, `shift_up`, `shift_down`
   - `camera_switch`, `look_back`
3. Set up collision layers:
   - Layer 1: Track surface
   - Layer 2: Vehicles
   - Layer 3: Barriers
   - Layer 4: Checkpoints
4. Create racing line Path3D for AI
5. Place checkpoints around track

## Requirements

- Godot 4.6+
- Vehicle 3D models with wheel positions
- Track geometry with collision
- Racing line path for AI
