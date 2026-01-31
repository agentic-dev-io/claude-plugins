---
name: Godot Audio
description: This skill should be used when the user asks about "AudioServer", "AudioStreamPlayer", "AudioStreamPlayer2D", "AudioStreamPlayer3D", "3D audio", "spatial audio", "positional audio", "audio bus", "sound effects", "music", "audio effects", "reverb", "delay", "EQ", "audio capture", "dynamic music", "adaptive audio", "music layers", "audio pooling", "ducking", "doppler", "attenuation", or needs guidance on implementing audio systems in Godot 4.x.
---

# Godot Audio System (4.6)

Godot provides a comprehensive audio system with AudioServer for bus management, multiple player types for 2D/3D spatial audio, and built-in effects.

## AudioServer Basics

### Bus Layout

```gdscript
# Audio buses are defined in default_bus_layout.tres
# Typical setup:
# Master
# ├── Music
# ├── SFX
# │   ├── UI
# │   ├── Ambient
# │   └── Footsteps
# └── Voice

# Access buses by name or index
func _ready() -> void:
    var master_idx: int = AudioServer.get_bus_index("Master")
    var sfx_idx: int = AudioServer.get_bus_index("SFX")

    # Set volume (in dB)
    AudioServer.set_bus_volume_db(sfx_idx, -6.0)

    # Mute/unmute
    AudioServer.set_bus_mute(sfx_idx, true)
```

### Volume Control System

```gdscript
class_name AudioManager
extends Node

const BUS_MASTER: String = "Master"
const BUS_MUSIC: String = "Music"
const BUS_SFX: String = "SFX"
const BUS_VOICE: String = "Voice"

# Convert linear (0-1) to dB
func linear_to_db(value: float) -> float:
    if value <= 0:
        return -80.0
    return 20.0 * log(value) / log(10.0)

# Convert dB to linear
func db_to_linear(db: float) -> float:
    return pow(10.0, db / 20.0)

func set_bus_volume(bus_name: String, linear_volume: float) -> void:
    var bus_idx: int = AudioServer.get_bus_index(bus_name)
    AudioServer.set_bus_volume_db(bus_idx, linear_to_db(linear_volume))

func get_bus_volume(bus_name: String) -> float:
    var bus_idx: int = AudioServer.get_bus_index(bus_name)
    return db_to_linear(AudioServer.get_bus_volume_db(bus_idx))

func toggle_mute(bus_name: String) -> void:
    var bus_idx: int = AudioServer.get_bus_index(bus_name)
    var is_muted: bool = AudioServer.is_bus_mute(bus_idx)
    AudioServer.set_bus_mute(bus_idx, not is_muted)
```

## AudioStreamPlayer Variants

### Basic AudioStreamPlayer

For non-positional audio (music, UI):

```gdscript
@onready var music_player: AudioStreamPlayer = $MusicPlayer
@onready var ui_sound: AudioStreamPlayer = $UISound

func play_music(track: AudioStream) -> void:
    music_player.stream = track
    music_player.bus = "Music"
    music_player.play()

func play_ui_sound(sound: AudioStream) -> void:
    ui_sound.stream = sound
    ui_sound.bus = "UI"
    ui_sound.play()
```

### AudioStreamPlayer2D

For 2D positional audio:

```gdscript
class_name Enemy2D
extends CharacterBody2D

@onready var audio: AudioStreamPlayer2D = $AudioStreamPlayer2D

func _ready() -> void:
    # Configure spatial settings
    audio.bus = "SFX"
    audio.max_distance = 1000.0
    audio.attenuation = 1.0  # Inverse distance
    audio.max_polyphony = 4

func play_sound(sound: AudioStream, volume_db: float = 0.0) -> void:
    audio.stream = sound
    audio.volume_db = volume_db
    audio.play()
```

### AudioStreamPlayer3D

For 3D positional audio:

```gdscript
class_name Enemy3D
extends CharacterBody3D

@onready var audio: AudioStreamPlayer3D = $AudioStreamPlayer3D

func _ready() -> void:
    # 3D audio configuration
    audio.bus = "SFX"
    audio.unit_size = 10.0  # Distance for full volume
    audio.max_distance = 50.0
    audio.max_db = 3.0
    audio.max_polyphony = 4

    # Attenuation model
    audio.attenuation_model = AudioStreamPlayer3D.ATTENUATION_INVERSE_DISTANCE
    audio.attenuation_filter_cutoff_hz = 5000.0
    audio.attenuation_filter_db = -24.0

    # Doppler effect
    audio.doppler_tracking = AudioStreamPlayer3D.DOPPLER_TRACKING_PHYSICS_STEP

func play_footstep() -> void:
    var footstep: AudioStream = footstep_sounds.pick_random()
    audio.stream = footstep
    audio.pitch_scale = randf_range(0.9, 1.1)
    audio.play()
```

## Audio Effects

### Adding Effects to Buses

```gdscript
# Add effects programmatically
func setup_effects() -> void:
    var sfx_idx: int = AudioServer.get_bus_index("SFX")

    # Add reverb
    var reverb := AudioEffectReverb.new()
    reverb.room_size = 0.8
    reverb.damping = 0.5
    reverb.spread = 1.0
    reverb.wet = 0.3
    AudioServer.add_bus_effect(sfx_idx, reverb)

    # Add compressor
    var compressor := AudioEffectCompressor.new()
    compressor.threshold = -20.0
    compressor.ratio = 4.0
    compressor.attack_us = 20.0
    compressor.release_ms = 250.0
    AudioServer.add_bus_effect(sfx_idx, compressor)
```

### Common Effects Configuration

```gdscript
# Low-pass filter (muffled/underwater)
func create_lowpass() -> AudioEffectLowPassFilter:
    var filter := AudioEffectLowPassFilter.new()
    filter.cutoff_hz = 1000.0
    filter.resonance = 0.5
    return filter

# High-pass filter (radio/phone effect)
func create_highpass() -> AudioEffectHighPassFilter:
    var filter := AudioEffectHighPassFilter.new()
    filter.cutoff_hz = 500.0
    filter.resonance = 0.5
    return filter

# Delay (echo)
func create_delay() -> AudioEffectDelay:
    var delay := AudioEffectDelay.new()
    delay.tap1_active = true
    delay.tap1_delay_ms = 250.0
    delay.tap1_level_db = -6.0
    delay.tap1_pan = 0.0
    delay.feedback_active = true
    delay.feedback_delay_ms = 500.0
    delay.feedback_level_db = -12.0
    return delay

# Chorus (thickening)
func create_chorus() -> AudioEffectChorus:
    var chorus := AudioEffectChorus.new()
    chorus.voice_count = 2
    chorus.wet = 0.5
    return chorus

# Distortion
func create_distortion() -> AudioEffectDistortion:
    var distortion := AudioEffectDistortion.new()
    distortion.mode = AudioEffectDistortion.MODE_OVERDRIVE
    distortion.drive = 0.5
    return distortion

# EQ
func create_eq() -> AudioEffectEQ10:
    var eq := AudioEffectEQ10.new()
    eq.set_band_gain_db(0, -6.0)  # 31 Hz
    eq.set_band_gain_db(9, 3.0)   # 16 kHz
    return eq
```

### Dynamic Effect Control

```gdscript
class_name EnvironmentAudio
extends Node

var reverb_effect: AudioEffectReverb
var lowpass_effect: AudioEffectLowPassFilter

func _ready() -> void:
    var sfx_idx: int = AudioServer.get_bus_index("SFX")
    reverb_effect = AudioServer.get_bus_effect(sfx_idx, 0) as AudioEffectReverb
    lowpass_effect = AudioServer.get_bus_effect(sfx_idx, 1) as AudioEffectLowPassFilter

func enter_cave() -> void:
    # Increase reverb
    var tween := create_tween()
    tween.tween_property(reverb_effect, "wet", 0.6, 1.0)
    tween.parallel().tween_property(reverb_effect, "room_size", 0.9, 1.0)

func enter_underwater() -> void:
    # Apply low-pass
    var tween := create_tween()
    tween.tween_property(lowpass_effect, "cutoff_hz", 500.0, 0.5)

func exit_underwater() -> void:
    var tween := create_tween()
    tween.tween_property(lowpass_effect, "cutoff_hz", 20000.0, 0.5)
```

## Dynamic Music System

### Layered Music

```gdscript
class_name LayeredMusicPlayer
extends Node

@export var base_layer: AudioStream
@export var action_layer: AudioStream
@export var danger_layer: AudioStream

@onready var base_player: AudioStreamPlayer = $BasePlayer
@onready var action_player: AudioStreamPlayer = $ActionPlayer
@onready var danger_player: AudioStreamPlayer = $DangerPlayer

var target_action_volume: float = -80.0
var target_danger_volume: float = -80.0

func _ready() -> void:
    # Start all layers (some silent)
    base_player.stream = base_layer
    action_player.stream = action_layer
    danger_player.stream = danger_layer

    base_player.volume_db = 0.0
    action_player.volume_db = -80.0
    danger_player.volume_db = -80.0

    # Sync playback
    base_player.play()
    action_player.play()
    danger_player.play()

func _process(delta: float) -> void:
    # Smooth volume transitions
    action_player.volume_db = lerpf(action_player.volume_db, target_action_volume, delta * 3.0)
    danger_player.volume_db = lerpf(danger_player.volume_db, target_danger_volume, delta * 3.0)

func set_intensity(combat: float, danger: float) -> void:
    # combat/danger are 0-1
    target_action_volume = -80.0 + combat * 80.0
    target_danger_volume = -80.0 + danger * 80.0
```

### Horizontal Re-sequencing

```gdscript
class_name AdaptiveMusicPlayer
extends Node

enum MusicState { EXPLORE, COMBAT, VICTORY, DEFEAT }

@export var explore_tracks: Array[AudioStream] = []
@export var combat_tracks: Array[AudioStream] = []
@export var transition_stinger: AudioStream

@onready var main_player: AudioStreamPlayer = $MainPlayer
@onready var stinger_player: AudioStreamPlayer = $StingerPlayer

var current_state: MusicState = MusicState.EXPLORE
var beat_duration: float = 0.5  # 120 BPM

func change_state(new_state: MusicState) -> void:
    if new_state == current_state:
        return

    current_state = new_state

    # Wait for next beat
    var position: float = main_player.get_playback_position()
    var next_beat: float = ceil(position / beat_duration) * beat_duration
    var wait_time: float = next_beat - position

    await get_tree().create_timer(wait_time).timeout

    # Play stinger and transition
    stinger_player.stream = transition_stinger
    stinger_player.play()

    # Crossfade to new track
    var new_track: AudioStream
    match current_state:
        MusicState.EXPLORE:
            new_track = explore_tracks.pick_random()
        MusicState.COMBAT:
            new_track = combat_tracks.pick_random()

    var tween := create_tween()
    tween.tween_property(main_player, "volume_db", -80.0, 0.5)
    await tween.finished

    main_player.stream = new_track
    main_player.play()
    tween = create_tween()
    tween.tween_property(main_player, "volume_db", 0.0, 0.5)
```

### Beat Synchronization

```gdscript
class_name BeatSync
extends Node

signal beat
signal measure

@export var bpm: float = 120.0
@export var beats_per_measure: int = 4

@onready var music: AudioStreamPlayer = $MusicPlayer

var beat_interval: float
var last_beat_time: float = 0.0
var beat_count: int = 0

func _ready() -> void:
    beat_interval = 60.0 / bpm

func _process(delta: float) -> void:
    if not music.playing:
        return

    var playback_time: float = music.get_playback_position()
    var current_beat: int = int(playback_time / beat_interval)

    if current_beat > beat_count:
        beat_count = current_beat
        beat.emit()

        if beat_count % beats_per_measure == 0:
            measure.emit()
```

## Audio Pooling

```gdscript
class_name SFXPool
extends Node

@export var pool_size: int = 16
@export var bus: String = "SFX"

var players: Array[AudioStreamPlayer] = []
var current_index: int = 0

func _ready() -> void:
    for i in pool_size:
        var player := AudioStreamPlayer.new()
        player.bus = bus
        add_child(player)
        players.append(player)

func play(sound: AudioStream, volume_db: float = 0.0, pitch: float = 1.0) -> void:
    var player: AudioStreamPlayer = players[current_index]
    player.stream = sound
    player.volume_db = volume_db
    player.pitch_scale = pitch
    player.play()

    current_index = (current_index + 1) % pool_size

# 3D variant
class_name SFXPool3D
extends Node3D

@export var pool_size: int = 16

var players: Array[AudioStreamPlayer3D] = []
var current_index: int = 0

func _ready() -> void:
    for i in pool_size:
        var player := AudioStreamPlayer3D.new()
        player.bus = "SFX"
        add_child(player)
        players.append(player)

func play_at(sound: AudioStream, position: Vector3, volume_db: float = 0.0) -> void:
    var player: AudioStreamPlayer3D = players[current_index]
    player.global_position = position
    player.stream = sound
    player.volume_db = volume_db
    player.play()

    current_index = (current_index + 1) % pool_size
```

## Ducking (Sidechain)

```gdscript
class_name AudioDucker
extends Node

@export var duck_bus: String = "Music"  # Bus to duck
@export var duck_amount_db: float = -12.0
@export var duck_time: float = 0.1
@export var release_time: float = 0.5

var original_volume: float
var is_ducking: bool = false

func _ready() -> void:
    var bus_idx: int = AudioServer.get_bus_index(duck_bus)
    original_volume = AudioServer.get_bus_volume_db(bus_idx)

func duck() -> void:
    if is_ducking:
        return
    is_ducking = true

    var bus_idx: int = AudioServer.get_bus_index(duck_bus)
    var tween := create_tween()
    tween.tween_method(
        func(vol: float): AudioServer.set_bus_volume_db(bus_idx, vol),
        original_volume,
        original_volume + duck_amount_db,
        duck_time
    )

func release() -> void:
    if not is_ducking:
        return
    is_ducking = false

    var bus_idx: int = AudioServer.get_bus_index(duck_bus)
    var tween := create_tween()
    tween.tween_method(
        func(vol: float): AudioServer.set_bus_volume_db(bus_idx, vol),
        original_volume + duck_amount_db,
        original_volume,
        release_time
    )

# Usage: Duck music when voice plays
func play_voiceover(clip: AudioStream) -> void:
    ducker.duck()
    voice_player.stream = clip
    voice_player.play()
    await voice_player.finished
    ducker.release()
```

## Audio Capture

```gdscript
class_name VoiceRecorder
extends Node

var recording: AudioEffectRecord
var capture: AudioEffectCapture

func _ready() -> void:
    # Get capture effect from bus
    var bus_idx: int = AudioServer.get_bus_index("Record")
    recording = AudioServer.get_bus_effect(bus_idx, 0) as AudioEffectRecord

func start_recording() -> void:
    recording.set_recording_active(true)

func stop_recording() -> AudioStreamWAV:
    recording.set_recording_active(false)
    return recording.get_recording()

func save_recording(path: String) -> void:
    var audio := stop_recording()
    audio.save_to_wav(path)
```

## Sound Randomization

```gdscript
class_name RandomizedAudio
extends Node

@export var sounds: Array[AudioStream] = []
@export var volume_variance: float = 3.0  # dB
@export var pitch_variance: float = 0.1

@onready var player: AudioStreamPlayer = $AudioStreamPlayer

var last_sound_index: int = -1

func play_random() -> void:
    # Avoid repeating same sound
    var index: int = randi() % sounds.size()
    if sounds.size() > 1:
        while index == last_sound_index:
            index = randi() % sounds.size()
    last_sound_index = index

    player.stream = sounds[index]
    player.volume_db = randf_range(-volume_variance, volume_variance)
    player.pitch_scale = 1.0 + randf_range(-pitch_variance, pitch_variance)
    player.play()
```

## Ambient Sound System

```gdscript
class_name AmbientZone
extends Area3D

@export var ambient_sound: AudioStream
@export var volume_db: float = 0.0
@export var fade_time: float = 1.0

@onready var player: AudioStreamPlayer = $AudioStreamPlayer

func _ready() -> void:
    player.stream = ambient_sound
    player.volume_db = -80.0
    player.bus = "Ambient"

    body_entered.connect(_on_body_entered)
    body_exited.connect(_on_body_exited)

func _on_body_entered(body: Node3D) -> void:
    if body.is_in_group("player"):
        if not player.playing:
            player.play()
        var tween := create_tween()
        tween.tween_property(player, "volume_db", volume_db, fade_time)

func _on_body_exited(body: Node3D) -> void:
    if body.is_in_group("player"):
        var tween := create_tween()
        tween.tween_property(player, "volume_db", -80.0, fade_time)
        await tween.finished
        if player.volume_db <= -79.0:
            player.stop()
```

## Performance Tips

```gdscript
# Limit simultaneous sounds
@export var max_concurrent: int = 8
var active_count: int = 0

func play_sound(sound: AudioStream) -> void:
    if active_count >= max_concurrent:
        return  # Skip or queue

    active_count += 1
    var player: AudioStreamPlayer = get_pooled_player()
    player.stream = sound
    player.play()
    player.finished.connect(func(): active_count -= 1, CONNECT_ONE_SHOT)

# Disable distant audio
func _physics_process(delta: float) -> void:
    var distance: float = global_position.distance_to(player_pos)
    audio_player.stream_paused = distance > audio_player.max_distance * 1.5
```
