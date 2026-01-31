# FPS Starter Template

A Godot 4.6 template for first-person shooter games including weapon system, recoil, hit detection, and HUD.

## Structure

```
fps-starter/
├── project.godot
├── scenes/
│   ├── main.tscn                 # Main game scene
│   ├── player/
│   │   ├── player.tscn           # FPS player (CharacterBody3D)
│   │   ├── fps_camera.tscn       # First-person camera
│   │   └── weapon_holder.tscn    # Weapon attachment point
│   ├── weapons/
│   │   ├── weapon_base.tscn      # Base weapon scene
│   │   ├── pistol.tscn
│   │   ├── rifle.tscn
│   │   └── shotgun.tscn
│   ├── projectiles/
│   │   └── bullet.tscn           # For projectile weapons
│   ├── effects/
│   │   ├── muzzle_flash.tscn
│   │   ├── bullet_impact.tscn
│   │   └── blood_splatter.tscn
│   ├── enemies/
│   │   └── enemy_base.tscn       # Basic enemy with hitboxes
│   └── ui/
│       ├── hud.tscn              # Game HUD
│       ├── crosshair.tscn        # Dynamic crosshair
│       ├── ammo_display.tscn
│       └── health_bar.tscn
├── scripts/
│   ├── player/
│   │   ├── fps_controller.gd     # Movement (sprint, crouch, jump)
│   │   ├── fps_camera.gd         # Look, recoil, sway
│   │   └── weapon_manager.gd     # Weapon switching
│   ├── weapons/
│   │   ├── weapon_base.gd        # Base weapon class
│   │   ├── hitscan_weapon.gd     # Raycast weapons
│   │   ├── projectile_weapon.gd  # Projectile weapons
│   │   └── recoil_pattern.gd     # Recoil system
│   ├── enemies/
│   │   ├── enemy_base.gd         # Enemy AI
│   │   ├── hitbox.gd             # Damage areas
│   │   └── hurtbox.gd            # Damage reception
│   └── ui/
│       ├── hud_controller.gd
│       └── crosshair_controller.gd
├── resources/
│   └── weapons/
│       ├── weapon_data.gd        # Weapon resource class
│       ├── pistol_data.tres
│       ├── rifle_data.tres
│       └── shotgun_data.tres
└── materials/
    └── effects/
        ├── muzzle_flash.tres
        └── bullet_trail.tres
```

## Features

### Player Controller
- WASD movement with acceleration/friction
- Sprint, crouch, slide
- Jump with coyote time
- Headbob and camera sway
- Mouse look with sensitivity

### Weapon System
- Hitscan and projectile weapons
- Weapon switching with animations
- Magazine-based reloading
- Weapon sway and bob

### Recoil System
- Per-weapon recoil patterns
- Spray patterns (like CS)
- Recoil recovery
- Spread/bloom

### Hit Detection
- Raycast for hitscan
- Hitbox multipliers (headshot)
- Penetration system
- Hit feedback

### HUD
- Health and armor display
- Ammo counter
- Dynamic crosshair
- Damage indicators
- Kill feed

## Core Systems

### Weapon Data Resource
```gdscript
# resources/weapons/weapon_data.gd
class_name WeaponData
extends Resource

enum WeaponType { HITSCAN, PROJECTILE }
enum FireMode { SEMI, AUTO, BURST }

@export var id: String
@export var name: String
@export var type: WeaponType = WeaponType.HITSCAN
@export var fire_mode: FireMode = FireMode.SEMI

@export_group("Damage")
@export var damage: int = 25
@export var headshot_multiplier: float = 2.0
@export var range: float = 100.0
@export var penetration: int = 0

@export_group("Fire Rate")
@export var fire_rate: float = 10.0  # Rounds per second
@export var burst_count: int = 3

@export_group("Ammo")
@export var magazine_size: int = 30
@export var reserve_ammo: int = 90
@export var reload_time: float = 2.0

@export_group("Accuracy")
@export var base_spread: float = 1.0
@export var max_spread: float = 5.0
@export var spread_increase: float = 0.5
@export var spread_recovery: float = 2.0

@export_group("Recoil")
@export var recoil_pattern: Array[Vector2] = []
@export var recoil_recovery_speed: float = 5.0

@export_group("Projectile")
@export var projectile_scene: PackedScene
@export var projectile_speed: float = 100.0
@export var projectile_count: int = 1  # For shotguns

@export_group("Visuals")
@export var view_model: PackedScene
@export var world_model: Mesh
@export var muzzle_flash: PackedScene
@export var fire_sound: AudioStream
@export var reload_sound: AudioStream
```

### FPS Controller
```gdscript
# Key mechanics included:
# - Smooth acceleration/deceleration
# - Sprint with stamina
# - Crouch with smooth transitions
# - Slide (sprint + crouch)
# - Air control
# - Stair stepping
```

### Recoil System
```gdscript
# Recoil pattern following:
# - Predefined patterns per weapon
# - Visual kick (camera rotation)
# - Pattern resets on stop firing
# - Recovery when not firing
```

## Setup

1. Copy this folder to your project
2. Configure input actions:
   - Movement: `forward`, `back`, `left`, `right`
   - Actions: `fire`, `aim`, `reload`, `jump`, `crouch`, `sprint`
   - Weapons: `weapon_1`, `weapon_2`, `weapon_3`
3. Set up collision layers:
   - Layer 1: World geometry
   - Layer 2: Player
   - Layer 3: Enemies
   - Layer 4: Projectiles
4. Import weapon models and configure data resources

## Usage Examples

### Fire Weapon
```gdscript
# Handled in weapon_base.gd
func try_fire() -> bool:
    if can_fire and current_ammo > 0:
        fire()
        return true
    return false
```

### Switch Weapon
```gdscript
# In weapon_manager.gd
func switch_to_weapon(index: int):
    if index == current_weapon_index:
        return
    play_holster_animation()
    await holster_complete
    current_weapon.hide()
    current_weapon = weapons[index]
    current_weapon.show()
    play_draw_animation()
```

### Apply Damage with Hitbox
```gdscript
# In hitbox.gd
func hit(damage: int, hit_position: Vector3):
    var final_damage = damage * damage_multiplier
    owner.take_damage(final_damage)
    spawn_impact_effect(hit_position)
```

## Requirements

- Godot 4.6+
- Mouse/keyboard input
- 3D weapon models (view and world)
- Sound effects for weapons
