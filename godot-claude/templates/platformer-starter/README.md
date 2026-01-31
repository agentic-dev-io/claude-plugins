# Platformer Starter Template

A Godot 4.6 template for 2D platformer games with advanced movement mechanics including jump buffer, coyote time, wall mechanics, and responsive controls.

## Structure

```
platformer-starter/
├── project.godot
├── scenes/
│   ├── main.tscn                 # Main game scene
│   ├── player/
│   │   ├── player.tscn           # Player (CharacterBody2D)
│   │   └── player_animations.tscn # Animation components
│   ├── levels/
│   │   ├── level_base.tscn       # Level template
│   │   └── level_1.tscn          # Example level
│   ├── objects/
│   │   ├── platform_moving.tscn  # Moving platform
│   │   ├── platform_falling.tscn # Falling platform
│   │   ├── spike.tscn            # Hazard
│   │   ├── checkpoint.tscn       # Respawn point
│   │   ├── collectible.tscn      # Coins/gems
│   │   └── spring.tscn           # Bounce pad
│   ├── enemies/
│   │   ├── enemy_base.tscn       # Base enemy
│   │   └── enemy_walker.tscn     # Walking enemy
│   └── ui/
│       ├── hud.tscn              # Game HUD
│       └── pause_menu.tscn
├── scripts/
│   ├── player/
│   │   ├── player_controller.gd  # Full movement system
│   │   ├── player_states.gd      # State machine states
│   │   └── player_animations.gd  # Animation control
│   ├── objects/
│   │   ├── moving_platform.gd
│   │   ├── falling_platform.gd
│   │   ├── checkpoint.gd
│   │   └── spring.gd
│   ├── enemies/
│   │   ├── enemy_base.gd
│   │   └── patrol_behavior.gd
│   ├── camera/
│   │   └── platform_camera.gd    # Smooth follow camera
│   └── systems/
│       ├── game_manager.gd       # Game state (Autoload)
│       └── level_manager.gd      # Level loading
├── tilesets/
│   └── tileset.tres              # Main tileset
└── sprites/
    ├── player/
    ├── tiles/
    └── objects/
```

## Features

### Advanced Movement
- **Jump Buffer**: Press jump slightly before landing, still jumps
- **Coyote Time**: Jump briefly after leaving platform
- **Variable Jump Height**: Release jump early for shorter jump
- **Wall Slide**: Slow descent on walls
- **Wall Jump**: Jump off walls
- **Dash**: Quick horizontal burst
- **Ground Pound**: Fast downward attack

### Physics Feel
- Separate acceleration for ground/air
- Different gravity for rising/falling
- Snappy direction changes
- Max fall speed capping

### Level Objects
- Moving platforms (horizontal, vertical, circular)
- Falling platforms with delay
- One-way platforms
- Springs/bounce pads
- Spikes and hazards
- Checkpoints

### Camera
- Smooth follow with look-ahead
- Room transitions
- Camera bounds/limits
- Shake effects

## Core Systems

### Player Controller
```gdscript
# scripts/player/player_controller.gd
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
@export var fall_gravity_mult: float = 1.5
@export var max_fall_speed: float = 600.0
@export var jump_buffer_time: float = 0.1
@export var coyote_time: float = 0.1

# Wall mechanics
@export var wall_slide_speed: float = 100.0
@export var wall_jump_velocity: Vector2 = Vector2(300, -350)
@export var wall_jump_lock_time: float = 0.2

# Dash
@export var dash_speed: float = 500.0
@export var dash_duration: float = 0.15
@export var dash_cooldown: float = 0.5

# State tracking
var coyote_timer: float = 0.0
var jump_buffer_timer: float = 0.0
var was_on_floor: bool = false
var facing: int = 1
```

### Key Mechanics Implementation

**Jump Buffer:**
```gdscript
# Store jump input even before landing
if Input.is_action_just_pressed("jump"):
    jump_buffer_timer = jump_buffer_time

# Execute buffered jump when landing
if jump_buffer_timer > 0 and is_on_floor():
    velocity.y = jump_velocity
    jump_buffer_timer = 0
```

**Coyote Time:**
```gdscript
# Start coyote timer when leaving ground
if was_on_floor and not is_on_floor():
    coyote_timer = coyote_time

# Allow jump during coyote time
if Input.is_action_just_pressed("jump") and coyote_timer > 0:
    velocity.y = jump_velocity
    coyote_timer = 0
```

**Variable Jump Height:**
```gdscript
# Cut jump short if button released
if Input.is_action_just_released("jump") and velocity.y < 0:
    velocity.y *= 0.5
```

**Wall Slide:**
```gdscript
if is_on_wall() and not is_on_floor() and velocity.y > 0:
    velocity.y = min(velocity.y, wall_slide_speed)
```

**Wall Jump:**
```gdscript
if Input.is_action_just_pressed("jump") and is_on_wall():
    var wall_normal = get_wall_normal()
    velocity = Vector2(wall_normal.x * wall_jump_velocity.x, wall_jump_velocity.y)
```

## Setup

1. Copy this folder to your project
2. Configure input actions:
   - Movement: `left`, `right`, `up`, `down`
   - Actions: `jump`, `dash`
3. Set up collision layers:
   - Layer 1: World/Tiles
   - Layer 2: Player
   - Layer 3: Enemies
   - Layer 4: Hazards
   - Layer 5: Collectibles
4. Configure tileset with collision shapes
5. Add player to "player" group

## Usage Examples

### Create Moving Platform
```gdscript
# moving_platform.gd
@export var move_distance: Vector2 = Vector2(100, 0)
@export var move_duration: float = 2.0

var start_position: Vector2
var tween: Tween

func _ready():
    start_position = position
    start_movement()

func start_movement():
    tween = create_tween().set_loops()
    tween.tween_property(self, "position", start_position + move_distance, move_duration)
    tween.tween_property(self, "position", start_position, move_duration)
```

### Create Checkpoint
```gdscript
# checkpoint.gd
func _on_body_entered(body):
    if body.is_in_group("player"):
        GameManager.set_checkpoint(global_position)
        activate_visual()
```

### Bounce Pad
```gdscript
# spring.gd
@export var bounce_force: float = 600.0

func _on_body_entered(body):
    if body is CharacterBody2D:
        body.velocity.y = -bounce_force
        $AnimationPlayer.play("bounce")
```

## Camera System
```gdscript
# platform_camera.gd
@export var look_ahead: float = 50.0
@export var smoothing: float = 5.0

var target: Node2D

func _physics_process(delta):
    if not target:
        return

    var target_pos = target.global_position
    target_pos.x += target.facing * look_ahead

    global_position = global_position.lerp(target_pos, smoothing * delta)
```

## Requirements

- Godot 4.6+
- Input actions configured
- Sprite assets for player and tiles
- TileMap setup with collision shapes
