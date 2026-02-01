---
name: Godot Input System
description: This skill should be used when the user asks about "input", "controls", "keyboard", "mouse", "gamepad", "controller", "joystick", "Input.is_action", "InputMap", "action mapping", "rebind", "key remapping", "input buffer", "combo", "gesture", "touch input", "InputEvent", or needs guidance on handling player input in Godot 4.x.
---

# Godot 4.6 Input System

This skill covers input handling in Godot, including action mapping, controller support, rebinding, and advanced input patterns.

## Input Actions

### Project Settings Setup

Configure in Project Settings > Input Map:

```
# Common action names
move_left, move_right, move_up, move_down
jump, attack, interact, dodge, sprint
pause, inventory, map
ui_accept, ui_cancel, ui_focus_next, ui_focus_prev
```

### Reading Input

```gdscript
# Action-based input (recommended)
func _process(delta: float) -> void:
    # Pressed this frame
    if Input.is_action_just_pressed("jump"):
        jump()

    # Held down
    if Input.is_action_pressed("sprint"):
        speed_multiplier = 2.0

    # Released this frame
    if Input.is_action_just_released("attack"):
        release_charged_attack()

    # Analog value (0.0 to 1.0, or -1.0 to 1.0 for axes)
    var move_strength: float = Input.get_action_strength("move_right")

    # 2D movement vector
    var direction := Input.get_vector("move_left", "move_right", "move_up", "move_down")


func _unhandled_input(event: InputEvent) -> void:
    # For one-time actions, prevents UI from receiving
    if event.is_action_pressed("pause"):
        toggle_pause()
        get_viewport().set_input_as_handled()
```

### Input Event Types

```gdscript
func _input(event: InputEvent) -> void:
    # Keyboard
    if event is InputEventKey:
        var key_event := event as InputEventKey
        if key_event.pressed and key_event.keycode == KEY_ESCAPE:
            # Direct key check (avoid when possible, use actions)
            pass

    # Mouse button
    if event is InputEventMouseButton:
        var mouse_event := event as InputEventMouseButton
        if mouse_event.pressed and mouse_event.button_index == MOUSE_BUTTON_LEFT:
            shoot()

    # Mouse motion
    if event is InputEventMouseMotion:
        var motion := event as InputEventMouseMotion
        rotate_camera(motion.relative * mouse_sensitivity)

    # Gamepad button
    if event is InputEventJoypadButton:
        var joy_event := event as InputEventJoypadButton
        # Use actions instead of direct button checks

    # Gamepad stick
    if event is InputEventJoypadMotion:
        var joy_motion := event as InputEventJoypadMotion
        # Axis indices: 0=left_x, 1=left_y, 2=right_x, 3=right_y
        if joy_motion.axis == JOY_AXIS_RIGHT_X:
            camera_input.x = joy_motion.axis_value
```

## Input Manager

```gdscript
# input_manager.gd - Autoload
class_name InputManagerClass
extends Node

signal input_device_changed(device_type: DeviceType)
signal action_rebind_completed(action: String, event: InputEvent)

enum DeviceType { KEYBOARD_MOUSE, GAMEPAD }

var current_device: DeviceType = DeviceType.KEYBOARD_MOUSE
var _last_input_device: DeviceType = DeviceType.KEYBOARD_MOUSE


func _input(event: InputEvent) -> void:
    _detect_device_change(event)


func _detect_device_change(event: InputEvent) -> void:
    var new_device: DeviceType

    if event is InputEventKey or event is InputEventMouse:
        new_device = DeviceType.KEYBOARD_MOUSE
    elif event is InputEventJoypadButton or event is InputEventJoypadMotion:
        # Filter out tiny stick movements
        if event is InputEventJoypadMotion:
            if abs(event.axis_value) < 0.2:
                return
        new_device = DeviceType.GAMEPAD
    else:
        return

    if new_device != current_device:
        current_device = new_device
        input_device_changed.emit(current_device)


func is_using_gamepad() -> bool:
    return current_device == DeviceType.GAMEPAD


func get_connected_joypads() -> Array[int]:
    var pads: Array[int] = []
    for i in Input.get_connected_joypads():
        pads.append(i)
    return pads


func get_joypad_name(device: int = 0) -> String:
    return Input.get_joy_name(device)


# Vibration
func vibrate_controller(device: int, weak: float, strong: float, duration: float) -> void:
    Input.start_joy_vibration(device, weak, strong, duration)


func stop_vibration(device: int = 0) -> void:
    Input.stop_joy_vibration(device)
```

## Key Rebinding

```gdscript
# rebind_manager.gd
class_name RebindManager
extends Node

signal rebind_started(action: String)
signal rebind_completed(action: String, event: InputEvent)
signal rebind_cancelled

const SAVE_PATH := "user://keybinds.cfg"

var _is_rebinding: bool = false
var _rebind_action: String = ""
var _original_bindings: Dictionary = {}  # action -> Array[InputEvent]


func _ready() -> void:
    _save_original_bindings()
    load_custom_bindings()


func _save_original_bindings() -> void:
    for action in InputMap.get_actions():
        if not action.begins_with("ui_"):  # Skip built-in UI actions
            _original_bindings[action] = InputMap.action_get_events(action).duplicate()


func start_rebind(action: String) -> void:
    _is_rebinding = true
    _rebind_action = action
    rebind_started.emit(action)


func cancel_rebind() -> void:
    _is_rebinding = false
    _rebind_action = ""
    rebind_cancelled.emit()


func _input(event: InputEvent) -> void:
    if not _is_rebinding:
        return

    # Cancel with Escape
    if event is InputEventKey and event.keycode == KEY_ESCAPE:
        cancel_rebind()
        get_viewport().set_input_as_handled()
        return

    # Accept valid input events
    if _is_valid_rebind_event(event):
        _apply_rebind(event)
        get_viewport().set_input_as_handled()


func _is_valid_rebind_event(event: InputEvent) -> bool:
    if event is InputEventKey:
        return event.pressed and not event.echo

    if event is InputEventMouseButton:
        return event.pressed

    if event is InputEventJoypadButton:
        return event.pressed

    if event is InputEventJoypadMotion:
        return abs(event.axis_value) > 0.5

    return false


func _apply_rebind(event: InputEvent) -> void:
    # Remove old events for this action (keep only gamepad/keyboard based on event type)
    var events := InputMap.action_get_events(_rebind_action)
    var is_gamepad := event is InputEventJoypadButton or event is InputEventJoypadMotion

    for old_event in events:
        var old_is_gamepad := old_event is InputEventJoypadButton or old_event is InputEventJoypadMotion
        if old_is_gamepad == is_gamepad:
            InputMap.action_erase_event(_rebind_action, old_event)

    # Add new event
    InputMap.action_add_event(_rebind_action, event)

    _is_rebinding = false
    rebind_completed.emit(_rebind_action, event)
    _rebind_action = ""

    save_custom_bindings()


func reset_to_defaults() -> void:
    for action in _original_bindings:
        InputMap.action_erase_events(action)
        for event in _original_bindings[action]:
            InputMap.action_add_event(action, event)

    save_custom_bindings()


func save_custom_bindings() -> void:
    var config := ConfigFile.new()

    for action in InputMap.get_actions():
        if action.begins_with("ui_"):
            continue

        var events := InputMap.action_get_events(action)
        for i in events.size():
            var event := events[i]
            var event_data := _serialize_event(event)
            if not event_data.is_empty():
                config.set_value(action, "event_%d" % i, event_data)

    config.save(SAVE_PATH)


func load_custom_bindings() -> void:
    var config := ConfigFile.new()
    if config.load(SAVE_PATH) != OK:
        return

    for action in config.get_sections():
        if not InputMap.has_action(action):
            continue

        InputMap.action_erase_events(action)

        for key in config.get_section_keys(action):
            var event_data: Dictionary = config.get_value(action, key)
            var event := _deserialize_event(event_data)
            if event:
                InputMap.action_add_event(action, event)


func _serialize_event(event: InputEvent) -> Dictionary:
    if event is InputEventKey:
        return {
            "type": "key",
            "keycode": event.keycode,
            "physical_keycode": event.physical_keycode,
        }

    if event is InputEventMouseButton:
        return {
            "type": "mouse_button",
            "button_index": event.button_index,
        }

    if event is InputEventJoypadButton:
        return {
            "type": "joypad_button",
            "button_index": event.button_index,
        }

    if event is InputEventJoypadMotion:
        return {
            "type": "joypad_motion",
            "axis": event.axis,
            "axis_value": sign(event.axis_value),
        }

    return {}


func _deserialize_event(data: Dictionary) -> InputEvent:
    match data.get("type", ""):
        "key":
            var event := InputEventKey.new()
            event.keycode = data.keycode
            event.physical_keycode = data.get("physical_keycode", 0)
            return event

        "mouse_button":
            var event := InputEventMouseButton.new()
            event.button_index = data.button_index
            return event

        "joypad_button":
            var event := InputEventJoypadButton.new()
            event.button_index = data.button_index
            return event

        "joypad_motion":
            var event := InputEventJoypadMotion.new()
            event.axis = data.axis
            event.axis_value = data.axis_value
            return event

    return null
```

## Input Buffer

```gdscript
# input_buffer.gd - For fighting games / responsive controls
class_name InputBuffer
extends Node

@export var buffer_window: float = 0.15  # Seconds to buffer input

var _buffer: Array[BufferedInput] = []


class BufferedInput:
    var action: String
    var timestamp: float
    var consumed: bool = false

    func _init(p_action: String, p_timestamp: float) -> void:
        action = p_action
        timestamp = p_timestamp


func _process(_delta: float) -> void:
    _cleanup_expired()


func _cleanup_expired() -> void:
    var current_time := Time.get_ticks_msec() / 1000.0
    _buffer = _buffer.filter(func(input: BufferedInput) -> bool:
        return current_time - input.timestamp < buffer_window and not input.consumed
    )


func buffer_action(action: String) -> void:
    var current_time := Time.get_ticks_msec() / 1000.0
    _buffer.append(BufferedInput.new(action, current_time))


func consume_action(action: String) -> bool:
    for input in _buffer:
        if input.action == action and not input.consumed:
            input.consumed = true
            return true
    return false


func has_buffered(action: String) -> bool:
    for input in _buffer:
        if input.action == action and not input.consumed:
            return true
    return false


func clear() -> void:
    _buffer.clear()


# Usage in player:
# func _unhandled_input(event: InputEvent) -> void:
#     if event.is_action_pressed("jump"):
#         input_buffer.buffer_action("jump")
#
# func _physics_process(delta: float) -> void:
#     if is_on_floor() and input_buffer.consume_action("jump"):
#         velocity.y = jump_force
```

## Combo System

```gdscript
# combo_input.gd
class_name ComboInput
extends Node

signal combo_executed(combo_name: String)

@export var combo_timeout: float = 0.5  # Time between inputs

var _input_history: Array[String] = []
var _last_input_time: float = 0.0

# Define combos: action sequence -> combo name
var _combos: Dictionary = {
    ["attack", "attack", "attack"]: "triple_slash",
    ["down", "right", "attack"]: "hadouken",
    ["right", "right"]: "dash",
    ["attack", "special"]: "power_attack",
}


func _process(_delta: float) -> void:
    var current_time := Time.get_ticks_msec() / 1000.0
    if current_time - _last_input_time > combo_timeout:
        _input_history.clear()


func register_input(action: String) -> void:
    var current_time := Time.get_ticks_msec() / 1000.0
    _last_input_time = current_time

    _input_history.append(action)

    # Check for combos (longest first)
    var matched := _check_combos()
    if not matched.is_empty():
        combo_executed.emit(matched)
        _input_history.clear()

    # Limit history size
    if _input_history.size() > 10:
        _input_history.pop_front()


func _check_combos() -> String:
    for combo_sequence in _combos:
        var seq: Array = combo_sequence

        if _input_history.size() < seq.size():
            continue

        # Check if history ends with this sequence
        var history_slice := _input_history.slice(-seq.size())
        var matches := true

        for i in seq.size():
            if history_slice[i] != seq[i]:
                matches = false
                break

        if matches:
            return _combos[combo_sequence]

    return ""


func add_combo(sequence: Array[String], name: String) -> void:
    _combos[sequence] = name


func remove_combo(name: String) -> void:
    for key in _combos:
        if _combos[key] == name:
            _combos.erase(key)
            return
```

## Touch Input

```gdscript
# touch_input.gd
class_name TouchInput
extends Node

signal tap(position: Vector2)
signal double_tap(position: Vector2)
signal swipe(direction: Vector2, velocity: float)
signal pinch(scale: float)
signal drag(position: Vector2, relative: Vector2)

@export var tap_threshold: float = 10.0  # Max movement for tap
@export var double_tap_time: float = 0.3
@export var swipe_threshold: float = 50.0  # Min distance for swipe

var _touches: Dictionary = {}  # finger_index -> TouchData
var _last_tap_time: float = 0.0
var _last_tap_position: Vector2


class TouchData:
    var start_position: Vector2
    var current_position: Vector2
    var start_time: float


func _input(event: InputEvent) -> void:
    if event is InputEventScreenTouch:
        _handle_touch(event)
    elif event is InputEventScreenDrag:
        _handle_drag(event)


func _handle_touch(event: InputEventScreenTouch) -> void:
    if event.pressed:
        var data := TouchData.new()
        data.start_position = event.position
        data.current_position = event.position
        data.start_time = Time.get_ticks_msec() / 1000.0
        _touches[event.index] = data

        # Check for pinch start
        if _touches.size() == 2:
            pass  # Pinch gesture started

    else:
        # Touch released
        if _touches.has(event.index):
            var data: TouchData = _touches[event.index]
            var distance := data.start_position.distance_to(event.position)
            var duration := Time.get_ticks_msec() / 1000.0 - data.start_time

            if distance < tap_threshold:
                # It's a tap
                _handle_tap(event.position)
            elif distance > swipe_threshold and duration < 0.5:
                # It's a swipe
                var direction := (event.position - data.start_position).normalized()
                var velocity := distance / duration
                swipe.emit(direction, velocity)

            _touches.erase(event.index)


func _handle_drag(event: InputEventScreenDrag) -> void:
    if _touches.has(event.index):
        _touches[event.index].current_position = event.position

    # Single finger drag
    if _touches.size() == 1:
        drag.emit(event.position, event.relative)

    # Two finger pinch
    if _touches.size() == 2:
        var keys := _touches.keys()
        var touch1: TouchData = _touches[keys[0]]
        var touch2: TouchData = _touches[keys[1]]

        var prev_distance := touch1.current_position.distance_to(touch2.current_position)

        if event.index == keys[0]:
            touch1.current_position = event.position
        else:
            touch2.current_position = event.position

        var new_distance := touch1.current_position.distance_to(touch2.current_position)

        if prev_distance > 0:
            var scale := new_distance / prev_distance
            pinch.emit(scale)


func _handle_tap(position: Vector2) -> void:
    var current_time := Time.get_ticks_msec() / 1000.0

    if current_time - _last_tap_time < double_tap_time:
        if position.distance_to(_last_tap_position) < tap_threshold * 2:
            double_tap.emit(position)
            _last_tap_time = 0.0  # Reset to prevent triple tap
            return

    tap.emit(position)
    _last_tap_time = current_time
    _last_tap_position = position
```

## Virtual Joystick

```gdscript
# virtual_joystick.gd
class_name VirtualJoystick
extends Control

signal joystick_input(direction: Vector2)

@export var deadzone: float = 0.2
@export var max_distance: float = 64.0

@onready var _base: TextureRect = $Base
@onready var _stick: TextureRect = $Stick

var _is_pressed: bool = false
var _touch_index: int = -1
var _center: Vector2


func _ready() -> void:
    _center = _base.position + _base.size / 2


func _input(event: InputEvent) -> void:
    if event is InputEventScreenTouch:
        if event.pressed:
            if _get_local_rect().has_point(event.position - global_position):
                _is_pressed = true
                _touch_index = event.index
                _update_stick(event.position)
        else:
            if event.index == _touch_index:
                _release()

    elif event is InputEventScreenDrag:
        if event.index == _touch_index and _is_pressed:
            _update_stick(event.position)


func _update_stick(touch_position: Vector2) -> void:
    var local_pos := touch_position - global_position
    var direction := local_pos - _center
    var distance := direction.length()

    if distance > max_distance:
        direction = direction.normalized() * max_distance

    _stick.position = _center + direction - _stick.size / 2

    # Emit normalized direction with deadzone
    var normalized := direction / max_distance
    if normalized.length() < deadzone:
        normalized = Vector2.ZERO

    joystick_input.emit(normalized)


func _release() -> void:
    _is_pressed = false
    _touch_index = -1
    _stick.position = _center - _stick.size / 2
    joystick_input.emit(Vector2.ZERO)


func _get_local_rect() -> Rect2:
    return Rect2(Vector2.ZERO, size)
```

## Mouse Capture

```gdscript
# mouse_manager.gd
class_name MouseManager
extends Node

signal mouse_mode_changed(mode: Input.MouseMode)

var _previous_mode: Input.MouseMode = Input.MOUSE_MODE_VISIBLE


func capture_mouse() -> void:
    _previous_mode = Input.mouse_mode
    Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
    mouse_mode_changed.emit(Input.MOUSE_MODE_CAPTURED)


func release_mouse() -> void:
    Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
    mouse_mode_changed.emit(Input.MOUSE_MODE_VISIBLE)


func restore_mouse() -> void:
    Input.mouse_mode = _previous_mode
    mouse_mode_changed.emit(_previous_mode)


func confine_mouse() -> void:
    Input.mouse_mode = Input.MOUSE_MODE_CONFINED
    mouse_mode_changed.emit(Input.MOUSE_MODE_CONFINED)


func is_captured() -> bool:
    return Input.mouse_mode == Input.MOUSE_MODE_CAPTURED


# Auto-release on window unfocus
func _notification(what: int) -> void:
    if what == NOTIFICATION_APPLICATION_FOCUS_OUT:
        if is_captured():
            release_mouse()
    elif what == NOTIFICATION_APPLICATION_FOCUS_IN:
        if _previous_mode == Input.MOUSE_MODE_CAPTURED:
            capture_mouse()
```

## Best Practices

1. **Always use actions** - Never hardcode keys, always use Input.is_action_*
2. **Provide rebinding** - Players expect control customization
3. **Support multiple devices** - Keyboard, mouse, gamepad simultaneously
4. **Use deadzone for analog** - Prevent drift on sticks
5. **Buffer important inputs** - Improves responsiveness
6. **Show correct prompts** - Display keyboard/gamepad icons based on last input
7. **Handle focus loss** - Release captured mouse when window loses focus
