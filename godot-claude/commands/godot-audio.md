---
name: godot-audio
description: Setup audio bus layout and audio management for Godot 4.6
argument-hint: "[preset: game|music|cinematic]"
allowed-tools:
  - Write
  - Read
  - Glob
---

# Audio Bus Setup

Configure audio bus layout with effects and create an audio management system for Godot 4.6.

## Arguments

Parse the user's arguments:
- `preset`: Audio preset configuration - default: game
  - `game`: Standard game audio (Master, Music, SFX, UI, Voice, Ambient)
  - `music`: Music-focused (Master, Music layers, Effects)
  - `cinematic`: Film-like (Master, Music, Dialogue, Foley, Ambience)

## Execution

1. **Determine project root** by finding `project.godot`

2. **Create audio bus layout and management scripts based on preset**:

### Game Preset (Default)

**Create bus layout info** (User should create in Godot Editor):
```
Bus Layout:
- Master (idx: 0)
  ├── Music (idx: 1)
  ├── SFX (idx: 2)
  │   ├── UI (idx: 3)
  │   ├── Footsteps (idx: 4)
  │   └── Weapons (idx: 5)
  ├── Voice (idx: 6)
  └── Ambient (idx: 7)
```

**scripts/audio/audio_manager.gd** - Autoload:
```gdscript
extends Node

## Audio Manager - Autoload
## Manages all game audio including music, SFX, and dynamic mixing

signal music_changed(track_name: String)
signal volume_changed(bus_name: String, volume: float)

# Bus names
const BUS_MASTER: String = "Master"
const BUS_MUSIC: String = "Music"
const BUS_SFX: String = "SFX"
const BUS_UI: String = "UI"
const BUS_VOICE: String = "Voice"
const BUS_AMBIENT: String = "Ambient"

# Settings
const MIN_DB: float = -80.0
const MAX_DB: float = 0.0

# Music players
@onready var music_player_a: AudioStreamPlayer
@onready var music_player_b: AudioStreamPlayer
var active_music_player: AudioStreamPlayer
var crossfade_tween: Tween

# SFX pool
var sfx_pool: Array[AudioStreamPlayer] = []
var sfx_pool_size: int = 16

# Volume settings (linear 0-1)
var volume_settings: Dictionary = {
    BUS_MASTER: 1.0,
    BUS_MUSIC: 0.8,
    BUS_SFX: 1.0,
    BUS_UI: 1.0,
    BUS_VOICE: 1.0,
    BUS_AMBIENT: 0.7
}

func _ready() -> void:
    _setup_music_players()
    _setup_sfx_pool()
    _load_settings()

func _setup_music_players() -> void:
    music_player_a = AudioStreamPlayer.new()
    music_player_a.bus = BUS_MUSIC
    add_child(music_player_a)

    music_player_b = AudioStreamPlayer.new()
    music_player_b.bus = BUS_MUSIC
    music_player_b.volume_db = MIN_DB
    add_child(music_player_b)

    active_music_player = music_player_a

func _setup_sfx_pool() -> void:
    for i in sfx_pool_size:
        var player := AudioStreamPlayer.new()
        player.bus = BUS_SFX
        add_child(player)
        sfx_pool.append(player)

## Volume Control

func set_bus_volume(bus_name: String, linear_volume: float) -> void:
    linear_volume = clampf(linear_volume, 0.0, 1.0)
    volume_settings[bus_name] = linear_volume

    var bus_idx: int = AudioServer.get_bus_index(bus_name)
    if bus_idx >= 0:
        AudioServer.set_bus_volume_db(bus_idx, linear_to_db(linear_volume))
        volume_changed.emit(bus_name, linear_volume)

func get_bus_volume(bus_name: String) -> float:
    return volume_settings.get(bus_name, 1.0)

func linear_to_db(linear: float) -> float:
    if linear <= 0:
        return MIN_DB
    return 20.0 * log(linear) / log(10.0)

func db_to_linear(db: float) -> float:
    return pow(10.0, db / 20.0)

func toggle_mute(bus_name: String) -> void:
    var bus_idx: int = AudioServer.get_bus_index(bus_name)
    if bus_idx >= 0:
        var is_muted: bool = AudioServer.is_bus_mute(bus_idx)
        AudioServer.set_bus_mute(bus_idx, not is_muted)

## Music

func play_music(stream: AudioStream, crossfade_duration: float = 1.0) -> void:
    if crossfade_tween and crossfade_tween.is_running():
        crossfade_tween.kill()

    var new_player: AudioStreamPlayer
    var old_player: AudioStreamPlayer

    if active_music_player == music_player_a:
        new_player = music_player_b
        old_player = music_player_a
    else:
        new_player = music_player_a
        old_player = music_player_b

    new_player.stream = stream
    new_player.volume_db = MIN_DB
    new_player.play()

    crossfade_tween = create_tween()
    crossfade_tween.set_parallel(true)
    crossfade_tween.tween_property(old_player, "volume_db", MIN_DB, crossfade_duration)
    crossfade_tween.tween_property(new_player, "volume_db", 0.0, crossfade_duration)

    await crossfade_tween.finished
    old_player.stop()
    active_music_player = new_player

    music_changed.emit(stream.resource_path.get_file())

func stop_music(fade_duration: float = 1.0) -> void:
    if crossfade_tween and crossfade_tween.is_running():
        crossfade_tween.kill()

    crossfade_tween = create_tween()
    crossfade_tween.tween_property(active_music_player, "volume_db", MIN_DB, fade_duration)
    await crossfade_tween.finished
    active_music_player.stop()

func set_music_paused(paused: bool) -> void:
    active_music_player.stream_paused = paused

## SFX

func play_sfx(stream: AudioStream, volume_db: float = 0.0, pitch: float = 1.0, bus: String = BUS_SFX) -> void:
    var player: AudioStreamPlayer = _get_available_sfx_player()
    if player:
        player.stream = stream
        player.volume_db = volume_db
        player.pitch_scale = pitch
        player.bus = bus
        player.play()

func play_sfx_random(streams: Array[AudioStream], volume_db: float = 0.0, pitch_variance: float = 0.1) -> void:
    if streams.is_empty():
        return

    var stream: AudioStream = streams.pick_random()
    var pitch: float = 1.0 + randf_range(-pitch_variance, pitch_variance)
    play_sfx(stream, volume_db, pitch)

func _get_available_sfx_player() -> AudioStreamPlayer:
    for player in sfx_pool:
        if not player.playing:
            return player
    # All players busy, return first (oldest sound)
    return sfx_pool[0]

## Settings

func _load_settings() -> void:
    # Load from ConfigFile or similar
    for bus_name in volume_settings:
        set_bus_volume(bus_name, volume_settings[bus_name])

func save_settings() -> void:
    # Save to ConfigFile
    pass
```

**scripts/audio/sfx_player.gd** - Component for objects:
```gdscript
class_name SFXPlayer
extends Node

@export var sounds: Array[AudioStream] = []
@export var bus: String = "SFX"
@export var volume_db: float = 0.0
@export var pitch_variance: float = 0.1
@export var randomize_pitch: bool = true

var last_played_index: int = -1

func play() -> void:
    if sounds.is_empty():
        return

    var stream: AudioStream = _get_random_sound()
    var pitch: float = 1.0
    if randomize_pitch:
        pitch += randf_range(-pitch_variance, pitch_variance)

    AudioManager.play_sfx(stream, volume_db, pitch, bus)

func _get_random_sound() -> AudioStream:
    if sounds.size() == 1:
        return sounds[0]

    var index: int = randi() % sounds.size()
    while index == last_played_index and sounds.size() > 1:
        index = randi() % sounds.size()

    last_played_index = index
    return sounds[index]
```

**scripts/audio/ambient_zone.gd** - Spatial ambient audio:
```gdscript
class_name AmbientZone
extends Area3D

@export var ambient_sound: AudioStream
@export var volume_db: float = 0.0
@export var fade_time: float = 1.0

@onready var player: AudioStreamPlayer3D = $AudioStreamPlayer3D

var is_active: bool = false

func _ready() -> void:
    player.stream = ambient_sound
    player.volume_db = -80.0
    player.bus = "Ambient"
    player.autoplay = true

    body_entered.connect(_on_body_entered)
    body_exited.connect(_on_body_exited)

func _on_body_entered(body: Node3D) -> void:
    if body.is_in_group("player") and not is_active:
        is_active = true
        var tween := create_tween()
        tween.tween_property(player, "volume_db", volume_db, fade_time)

func _on_body_exited(body: Node3D) -> void:
    if body.is_in_group("player") and is_active:
        is_active = false
        var tween := create_tween()
        tween.tween_property(player, "volume_db", -80.0, fade_time)
```

**scripts/audio/audio_ducking.gd** - Duck music during voice:
```gdscript
class_name AudioDucker
extends Node

@export var duck_bus: String = "Music"
@export var duck_amount_db: float = -12.0
@export var duck_time: float = 0.1
@export var release_time: float = 0.5

var original_volume: float
var is_ducking: bool = false
var duck_tween: Tween

func _ready() -> void:
    var bus_idx: int = AudioServer.get_bus_index(duck_bus)
    original_volume = AudioServer.get_bus_volume_db(bus_idx)

func duck() -> void:
    if is_ducking:
        return
    is_ducking = true

    if duck_tween and duck_tween.is_running():
        duck_tween.kill()

    var bus_idx: int = AudioServer.get_bus_index(duck_bus)
    duck_tween = create_tween()
    duck_tween.tween_method(
        func(vol: float): AudioServer.set_bus_volume_db(bus_idx, vol),
        original_volume,
        original_volume + duck_amount_db,
        duck_time
    )

func release() -> void:
    if not is_ducking:
        return
    is_ducking = false

    if duck_tween and duck_tween.is_running():
        duck_tween.kill()

    var bus_idx: int = AudioServer.get_bus_index(duck_bus)
    duck_tween = create_tween()
    duck_tween.tween_method(
        func(vol: float): AudioServer.set_bus_volume_db(bus_idx, vol),
        original_volume + duck_amount_db,
        original_volume,
        release_time
    )
```

### Music Preset

Additional files for layered music:

**scripts/audio/layered_music.gd**:
```gdscript
class_name LayeredMusic
extends Node

@export var layers: Array[AudioStream] = []
@export var fade_time: float = 0.5

var players: Array[AudioStreamPlayer] = []
var layer_volumes: Array[float] = []

func _ready() -> void:
    for i in layers.size():
        var player := AudioStreamPlayer.new()
        player.stream = layers[i]
        player.bus = "Music"
        player.volume_db = -80.0 if i > 0 else 0.0
        add_child(player)
        players.append(player)
        layer_volumes.append(1.0 if i == 0 else 0.0)

func play() -> void:
    for player in players:
        player.play()

func stop() -> void:
    for player in players:
        player.stop()

func set_layer_volume(layer_index: int, volume: float) -> void:
    if layer_index < 0 or layer_index >= players.size():
        return

    layer_volumes[layer_index] = clampf(volume, 0.0, 1.0)
    var target_db: float = -80.0 if volume <= 0 else 20.0 * log(volume) / log(10.0)

    var tween := create_tween()
    tween.tween_property(players[layer_index], "volume_db", target_db, fade_time)

func set_intensity(intensity: float) -> void:
    # Fade in layers based on intensity 0-1
    for i in layers.size():
        var threshold: float = float(i) / float(layers.size())
        var layer_volume: float = clampf((intensity - threshold) * layers.size(), 0.0, 1.0)
        set_layer_volume(i, layer_volume)
```

## Output

After creation, report:
- Files created
- Instructions to create bus layout in Godot Editor
- How to register AudioManager as autoload
- Usage examples

## Tips

- Create default_bus_layout.tres in Project > Project Settings > Audio
- Use bus effects (Reverb, Compressor, EQ) for polish
- Consider using AudioEffectCapture for visualization
- Test on target platforms (mobile audio behaves differently)
