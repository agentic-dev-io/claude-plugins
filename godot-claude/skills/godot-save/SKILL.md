---
name: Godot Save Systems
description: This skill should be used when the user asks about "save game", "load game", "persistence", "ConfigFile", "FileAccess", "serialization", "JSON save", "resource save", "user data", "settings", "preferences", "autosave", "checkpoint", "saveslot", "cloud saves", "encryption", or needs guidance on data persistence in Godot 4.x.
---

# Godot 4.6 Save Systems

This skill covers data persistence in Godot, including save/load patterns, serialization strategies, and configuration management.

## Save File Locations

```gdscript
# Standard paths
const SAVE_DIR := "user://saves/"
const CONFIG_PATH := "user://settings.cfg"
const PROFILE_PATH := "user://profile.tres"

# user:// maps to:
# Windows: %APPDATA%\Godot\app_userdata\[project_name]\
# macOS: ~/Library/Application Support/Godot/app_userdata/[project_name]/
# Linux: ~/.local/share/godot/app_userdata/[project_name]/
```

## JSON Save System

### Basic Structure

```gdscript
# save_manager.gd - Autoload
class_name SaveManager
extends Node

signal save_completed(slot: int)
signal load_completed(slot: int)
signal save_failed(error: String)
signal load_failed(error: String)

const SAVE_DIR := "user://saves/"
const SAVE_VERSION := 1

var current_save_data: Dictionary = {}


func _ready() -> void:
    _ensure_save_directory()


func _ensure_save_directory() -> void:
    if not DirAccess.dir_exists_absolute(SAVE_DIR):
        DirAccess.make_dir_recursive_absolute(SAVE_DIR)


func save_game(slot: int) -> bool:
    var save_data := _collect_save_data()
    save_data["_meta"] = {
        "version": SAVE_VERSION,
        "timestamp": Time.get_unix_time_from_system(),
        "playtime": _get_playtime(),
    }

    var path := _get_slot_path(slot)
    var json := JSON.stringify(save_data, "\t")

    var file := FileAccess.open(path, FileAccess.WRITE)
    if not file:
        var error := "Failed to open save file: %s" % FileAccess.get_open_error()
        save_failed.emit(error)
        return false

    file.store_string(json)
    file.close()

    current_save_data = save_data
    save_completed.emit(slot)
    return true


func load_game(slot: int) -> bool:
    var path := _get_slot_path(slot)

    if not FileAccess.file_exists(path):
        load_failed.emit("Save file not found")
        return false

    var file := FileAccess.open(path, FileAccess.READ)
    if not file:
        load_failed.emit("Failed to open save file")
        return false

    var json := file.get_as_text()
    file.close()

    var parsed = JSON.parse_string(json)
    if parsed == null:
        load_failed.emit("Invalid save file format")
        return false

    var save_data: Dictionary = parsed

    # Version migration
    save_data = _migrate_save(save_data)

    # Apply loaded data
    _apply_save_data(save_data)

    current_save_data = save_data
    load_completed.emit(slot)
    return true


func _collect_save_data() -> Dictionary:
    var data := {}

    # Collect from all saveable nodes
    for node in get_tree().get_nodes_in_group("saveable"):
        if node.has_method("get_save_data"):
            var node_path := str(node.get_path())
            data[node_path] = node.get_save_data()

    # Collect global state
    data["_global"] = {
        "player_stats": PlayerStats.get_save_data(),
        "inventory": Inventory.get_save_data(),
        "quests": QuestManager.get_save_data(),
        "world_state": WorldState.get_save_data(),
    }

    return data


func _apply_save_data(data: Dictionary) -> void:
    # Apply global state first
    if data.has("_global"):
        var global: Dictionary = data["_global"]
        if global.has("player_stats"):
            PlayerStats.load_save_data(global.player_stats)
        if global.has("inventory"):
            Inventory.load_save_data(global.inventory)
        if global.has("quests"):
            QuestManager.load_save_data(global.quests)
        if global.has("world_state"):
            WorldState.load_save_data(global.world_state)

    # Apply to scene nodes
    for node in get_tree().get_nodes_in_group("saveable"):
        var node_path := str(node.get_path())
        if data.has(node_path) and node.has_method("load_save_data"):
            node.load_save_data(data[node_path])


func _migrate_save(data: Dictionary) -> Dictionary:
    var version: int = data.get("_meta", {}).get("version", 0)

    # Apply migrations sequentially
    if version < 1:
        data = _migrate_v0_to_v1(data)

    return data


func _migrate_v0_to_v1(data: Dictionary) -> Dictionary:
    # Example migration: rename field
    if data.has("player_health"):
        data["_global"] = data.get("_global", {})
        data["_global"]["player_stats"] = {
            "health": data["player_health"]
        }
        data.erase("player_health")
    return data


func _get_slot_path(slot: int) -> String:
    return SAVE_DIR + "save_%02d.json" % slot


func _get_playtime() -> float:
    return Time.get_ticks_msec() / 1000.0  # Replace with actual tracking


func get_save_slots() -> Array[Dictionary]:
    var slots: Array[Dictionary] = []

    for i in range(10):  # 10 save slots
        var path := _get_slot_path(i)
        if FileAccess.file_exists(path):
            var file := FileAccess.open(path, FileAccess.READ)
            var data = JSON.parse_string(file.get_as_text())
            file.close()

            if data and data.has("_meta"):
                slots.append({
                    "slot": i,
                    "timestamp": data._meta.timestamp,
                    "playtime": data._meta.playtime,
                    "exists": true,
                })
            else:
                slots.append({"slot": i, "exists": false})
        else:
            slots.append({"slot": i, "exists": false})

    return slots


func delete_save(slot: int) -> bool:
    var path := _get_slot_path(slot)
    if FileAccess.file_exists(path):
        return DirAccess.remove_absolute(path) == OK
    return false
```

### Saveable Component

```gdscript
# saveable_component.gd - Attach to saveable objects
class_name SaveableComponent
extends Node

@export var save_id: String = ""  # Unique ID for this object

var _parent: Node


func _ready() -> void:
    _parent = get_parent()
    add_to_group("saveable")

    if save_id.is_empty():
        save_id = str(_parent.get_path()).md5_text().substr(0, 8)


func get_save_data() -> Dictionary:
    var data := {}

    # Save transform
    if _parent is Node2D:
        data["position"] = var_to_str(_parent.position)
        data["rotation"] = _parent.rotation
    elif _parent is Node3D:
        data["transform"] = var_to_str(_parent.transform)

    # Save custom data from parent
    if _parent.has_method("_get_custom_save_data"):
        data["custom"] = _parent._get_custom_save_data()

    return data


func load_save_data(data: Dictionary) -> void:
    # Restore transform
    if _parent is Node2D and data.has("position"):
        _parent.position = str_to_var(data.position)
        _parent.rotation = data.get("rotation", 0.0)
    elif _parent is Node3D and data.has("transform"):
        _parent.transform = str_to_var(data.transform)

    # Restore custom data
    if data.has("custom") and _parent.has_method("_load_custom_save_data"):
        _parent._load_custom_save_data(data.custom)
```

## Resource-Based Saves

```gdscript
# save_data.gd - Custom Resource for saves
class_name SaveData
extends Resource

@export var version: int = 1
@export var timestamp: int = 0
@export var playtime_seconds: float = 0.0

@export var player_position: Vector3
@export var player_health: int = 100
@export var player_level: int = 1
@export var player_xp: int = 0

@export var inventory_items: Array[String] = []
@export var completed_quests: Array[String] = []
@export var unlocked_abilities: Array[String] = []

@export var world_flags: Dictionary = {}


static func create_new() -> SaveData:
    var save := SaveData.new()
    save.timestamp = int(Time.get_unix_time_from_system())
    return save


# save_manager_resource.gd
class_name ResourceSaveManager
extends Node

const SAVE_DIR := "user://saves/"


func save_game(slot: int, data: SaveData) -> bool:
    _ensure_save_directory()

    data.timestamp = int(Time.get_unix_time_from_system())
    var path := _get_slot_path(slot)

    var error := ResourceSaver.save(data, path)
    if error != OK:
        push_error("Failed to save: %s" % error)
        return false

    return true


func load_game(slot: int) -> SaveData:
    var path := _get_slot_path(slot)

    if not ResourceLoader.exists(path):
        return null

    var data = ResourceLoader.load(path)
    if data is SaveData:
        return data

    return null


func _get_slot_path(slot: int) -> String:
    return SAVE_DIR + "save_%02d.tres" % slot


func _ensure_save_directory() -> void:
    if not DirAccess.dir_exists_absolute(SAVE_DIR):
        DirAccess.make_dir_recursive_absolute(SAVE_DIR)
```

## ConfigFile for Settings

```gdscript
# settings_manager.gd - Autoload
class_name SettingsManager
extends Node

const CONFIG_PATH := "user://settings.cfg"

var config: ConfigFile


func _ready() -> void:
    config = ConfigFile.new()
    load_settings()


func load_settings() -> void:
    var error := config.load(CONFIG_PATH)
    if error != OK:
        _create_default_settings()


func _create_default_settings() -> void:
    # Audio
    config.set_value("audio", "master_volume", 1.0)
    config.set_value("audio", "music_volume", 0.8)
    config.set_value("audio", "sfx_volume", 1.0)
    config.set_value("audio", "voice_volume", 1.0)

    # Video
    config.set_value("video", "fullscreen", false)
    config.set_value("video", "vsync", true)
    config.set_value("video", "resolution", "1920x1080")
    config.set_value("video", "quality_preset", "high")

    # Controls
    config.set_value("controls", "mouse_sensitivity", 1.0)
    config.set_value("controls", "invert_y", false)

    # Accessibility
    config.set_value("accessibility", "subtitles", true)
    config.set_value("accessibility", "colorblind_mode", "none")
    config.set_value("accessibility", "screen_shake", true)

    save_settings()


func save_settings() -> void:
    config.save(CONFIG_PATH)


# Getters with type safety
func get_float(section: String, key: String, default: float = 0.0) -> float:
    return config.get_value(section, key, default)


func get_bool(section: String, key: String, default: bool = false) -> bool:
    return config.get_value(section, key, default)


func get_string(section: String, key: String, default: String = "") -> String:
    return config.get_value(section, key, default)


func get_int(section: String, key: String, default: int = 0) -> int:
    return config.get_value(section, key, default)


# Setters
func set_value(section: String, key: String, value: Variant) -> void:
    config.set_value(section, key, value)
    save_settings()


# Apply settings to game systems
func apply_audio_settings() -> void:
    AudioServer.set_bus_volume_db(0, linear_to_db(get_float("audio", "master_volume", 1.0)))

    var music_bus := AudioServer.get_bus_index("Music")
    if music_bus >= 0:
        AudioServer.set_bus_volume_db(music_bus, linear_to_db(get_float("audio", "music_volume", 0.8)))

    var sfx_bus := AudioServer.get_bus_index("SFX")
    if sfx_bus >= 0:
        AudioServer.set_bus_volume_db(sfx_bus, linear_to_db(get_float("audio", "sfx_volume", 1.0)))


func apply_video_settings() -> void:
    var fullscreen := get_bool("video", "fullscreen", false)
    if fullscreen:
        DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN)
    else:
        DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_WINDOWED)

    var vsync := get_bool("video", "vsync", true)
    DisplayServer.window_set_vsync_mode(
        DisplayServer.VSYNC_ENABLED if vsync else DisplayServer.VSYNC_DISABLED
    )
```

## Encrypted Saves

```gdscript
# encrypted_save_manager.gd
class_name EncryptedSaveManager
extends Node

const SAVE_DIR := "user://saves/"
const ENCRYPTION_KEY := "your-secret-key-here"  # In production, derive from hardware ID


func save_encrypted(slot: int, data: Dictionary) -> bool:
    var json := JSON.stringify(data)
    var path := _get_slot_path(slot)

    var file := FileAccess.open_encrypted_with_pass(path, FileAccess.WRITE, ENCRYPTION_KEY)
    if not file:
        push_error("Failed to create encrypted save")
        return false

    file.store_string(json)
    file.close()
    return true


func load_encrypted(slot: int) -> Dictionary:
    var path := _get_slot_path(slot)

    if not FileAccess.file_exists(path):
        return {}

    var file := FileAccess.open_encrypted_with_pass(path, FileAccess.READ, ENCRYPTION_KEY)
    if not file:
        push_error("Failed to open encrypted save")
        return {}

    var json := file.get_as_text()
    file.close()

    var parsed = JSON.parse_string(json)
    if parsed == null:
        return {}

    return parsed


func _get_slot_path(slot: int) -> String:
    return SAVE_DIR + "save_%02d.sav" % slot
```

## Autosave System

```gdscript
# autosave_manager.gd
class_name AutosaveManager
extends Node

signal autosave_started
signal autosave_completed

@export var autosave_interval: float = 300.0  # 5 minutes
@export var autosave_slot: int = 99  # Dedicated autosave slot
@export var save_on_level_change: bool = true

var _timer: Timer
var _is_saving: bool = false


func _ready() -> void:
    _timer = Timer.new()
    _timer.wait_time = autosave_interval
    _timer.timeout.connect(_on_autosave_timer)
    add_child(_timer)
    _timer.start()

    if save_on_level_change:
        get_tree().node_added.connect(_on_node_added)


func _on_autosave_timer() -> void:
    trigger_autosave()


func trigger_autosave() -> void:
    if _is_saving:
        return

    _is_saving = true
    autosave_started.emit()

    # Defer to next frame to avoid hitching
    await get_tree().process_frame

    SaveManager.save_game(autosave_slot)

    _is_saving = false
    autosave_completed.emit()


func _on_node_added(node: Node) -> void:
    # Autosave when entering new level
    if node.is_in_group("level"):
        # Small delay for level to initialize
        await get_tree().create_timer(1.0).timeout
        trigger_autosave()


func pause_autosave() -> void:
    _timer.paused = true


func resume_autosave() -> void:
    _timer.paused = false
```

## Cloud Save Integration

```gdscript
# cloud_save_interface.gd - Abstract interface
class_name CloudSaveInterface
extends RefCounted

signal upload_completed(success: bool)
signal download_completed(success: bool, data: Dictionary)
signal sync_conflict(local_data: Dictionary, cloud_data: Dictionary)


func upload_save(slot: int, data: Dictionary) -> void:
    push_error("CloudSaveInterface.upload_save not implemented")


func download_save(slot: int) -> void:
    push_error("CloudSaveInterface.download_save not implemented")


func get_cloud_timestamp(slot: int) -> int:
    push_error("CloudSaveInterface.get_cloud_timestamp not implemented")
    return 0


# steam_cloud_save.gd - Steam implementation
class_name SteamCloudSave
extends CloudSaveInterface


func upload_save(slot: int, data: Dictionary) -> void:
    var json := JSON.stringify(data)
    var filename := "save_%02d.json" % slot

    # Steam.fileWrite returns bool
    var success := Steam.fileWrite(filename, json.to_utf8_buffer())
    upload_completed.emit(success)


func download_save(slot: int) -> void:
    var filename := "save_%02d.json" % slot

    if not Steam.fileExists(filename):
        download_completed.emit(false, {})
        return

    var size := Steam.getFileSize(filename)
    var buffer := Steam.fileRead(filename, size)
    var json := buffer.get_string_from_utf8()
    var data = JSON.parse_string(json)

    download_completed.emit(data != null, data if data else {})


func get_cloud_timestamp(slot: int) -> int:
    var filename := "save_%02d.json" % slot
    if Steam.fileExists(filename):
        return Steam.getFileTimestamp(filename)
    return 0
```

## Best Practices

1. **Version your saves** - Always include version metadata for migration support
2. **Validate on load** - Check data integrity before applying
3. **Backup before overwrite** - Keep previous save as `.bak`
4. **Handle missing data gracefully** - Use `.get()` with defaults
5. **Test save corruption** - Verify game handles corrupt files
6. **Async for large saves** - Use threads for large data to avoid hitching
7. **Encrypt sensitive data** - Prevent easy save editing if desired
8. **Provide manual backup** - Let users export/import saves
