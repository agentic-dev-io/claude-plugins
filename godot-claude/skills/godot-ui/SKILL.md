---
name: Godot UI Systems
description: This skill should be used when the user asks about "UI", "user interface", "HUD", "menu", "Control nodes", "Theme", "responsive layout", "MarginContainer", "VBoxContainer", "HBoxContainer", "GridContainer", "popup", "dialog", "button", "label", "TextureRect", "NinePatchRect", "anchors", "focus", "navigation", "accessibility", or needs guidance on building user interfaces in Godot 4.x.
---

# Godot 4.6 UI Systems

This skill covers UI development in Godot, including Control nodes, theming, responsive layouts, and common UI patterns.

## Control Node Hierarchy

### Layout Containers

```gdscript
# Container hierarchy for responsive UI
# Control (root)
# └── MarginContainer (screen padding)
#     └── VBoxContainer (vertical stack)
#         ├── HBoxContainer (horizontal items)
#         ├── GridContainer (grid layout)
#         └── PanelContainer (styled section)

# Common container setup
func setup_main_menu() -> Control:
    var root := Control.new()
    root.set_anchors_preset(Control.PRESET_FULL_RECT)

    var margin := MarginContainer.new()
    margin.set_anchors_preset(Control.PRESET_FULL_RECT)
    margin.add_theme_constant_override("margin_left", 40)
    margin.add_theme_constant_override("margin_right", 40)
    margin.add_theme_constant_override("margin_top", 40)
    margin.add_theme_constant_override("margin_bottom", 40)
    root.add_child(margin)

    var vbox := VBoxContainer.new()
    vbox.add_theme_constant_override("separation", 20)
    margin.add_child(vbox)

    return root
```

### Anchors and Presets

```gdscript
# Anchor presets for common layouts
enum Anchor {
    TOP_LEFT,      # PRESET_TOP_LEFT
    TOP_RIGHT,     # PRESET_TOP_RIGHT
    BOTTOM_LEFT,   # PRESET_BOTTOM_LEFT
    BOTTOM_RIGHT,  # PRESET_BOTTOM_RIGHT
    CENTER,        # PRESET_CENTER
    FULL_RECT,     # PRESET_FULL_RECT (fill parent)
}

func position_hud_element(control: Control, position: String) -> void:
    match position:
        "top_left":
            control.set_anchors_preset(Control.PRESET_TOP_LEFT)
        "top_right":
            control.set_anchors_preset(Control.PRESET_TOP_RIGHT)
        "bottom_left":
            control.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
        "bottom_right":
            control.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
        "center":
            control.set_anchors_preset(Control.PRESET_CENTER)
        "fill":
            control.set_anchors_preset(Control.PRESET_FULL_RECT)
```

### Size Flags

```gdscript
# Expand and fill behavior
func configure_flexible_button(button: Button) -> void:
    # Expand horizontally to fill available space
    button.size_flags_horizontal = Control.SIZE_EXPAND_FILL

    # Don't expand vertically, keep minimum size
    button.size_flags_vertical = Control.SIZE_SHRINK_CENTER

    # Stretch ratio (relative size in container)
    button.size_flags_stretch_ratio = 1.0
```

## Theme System

### Creating Themes

```gdscript
# theme_manager.gd
class_name ThemeManager
extends Node

static func create_game_theme() -> Theme:
    var theme := Theme.new()

    # Define colors
    var colors := {
        "primary": Color("#3498db"),
        "secondary": Color("#2ecc71"),
        "danger": Color("#e74c3c"),
        "warning": Color("#f1c40f"),
        "dark": Color("#2c3e50"),
        "light": Color("#ecf0f1"),
        "text": Color("#ffffff"),
        "text_disabled": Color("#7f8c8d"),
    }

    # Button styles
    _setup_button_theme(theme, colors)

    # Panel styles
    _setup_panel_theme(theme, colors)

    # Label styles
    _setup_label_theme(theme, colors)

    return theme


static func _setup_button_theme(theme: Theme, colors: Dictionary) -> void:
    # Normal state
    var normal := StyleBoxFlat.new()
    normal.bg_color = colors.primary
    normal.set_corner_radius_all(8)
    normal.set_content_margin_all(16)
    theme.set_stylebox("normal", "Button", normal)

    # Hover state
    var hover := normal.duplicate()
    hover.bg_color = colors.primary.lightened(0.1)
    theme.set_stylebox("hover", "Button", hover)

    # Pressed state
    var pressed := normal.duplicate()
    pressed.bg_color = colors.primary.darkened(0.1)
    theme.set_stylebox("pressed", "Button", pressed)

    # Disabled state
    var disabled := normal.duplicate()
    disabled.bg_color = colors.dark
    theme.set_stylebox("disabled", "Button", disabled)

    # Focus (keyboard navigation)
    var focus := StyleBoxFlat.new()
    focus.draw_center = false
    focus.border_color = colors.secondary
    focus.set_border_width_all(2)
    focus.set_corner_radius_all(8)
    theme.set_stylebox("focus", "Button", focus)

    # Font
    theme.set_color("font_color", "Button", colors.text)
    theme.set_color("font_hover_color", "Button", colors.text)
    theme.set_color("font_disabled_color", "Button", colors.text_disabled)
    theme.set_font_size("font_size", "Button", 18)


static func _setup_panel_theme(theme: Theme, colors: Dictionary) -> void:
    var panel := StyleBoxFlat.new()
    panel.bg_color = colors.dark.darkened(0.3)
    panel.set_corner_radius_all(12)
    panel.set_content_margin_all(20)
    theme.set_stylebox("panel", "PanelContainer", panel)


static func _setup_label_theme(theme: Theme, colors: Dictionary) -> void:
    theme.set_color("font_color", "Label", colors.text)
    theme.set_font_size("font_size", "Label", 16)
```

### Theme Variations

```gdscript
# Create button variations using theme type variations
func add_button_variations(theme: Theme) -> void:
    # Danger button (red)
    var danger := StyleBoxFlat.new()
    danger.bg_color = Color("#e74c3c")
    danger.set_corner_radius_all(8)
    danger.set_content_margin_all(16)
    theme.set_stylebox("normal", "DangerButton", danger)
    theme.set_type_variation("DangerButton", "Button")

    # Ghost button (transparent)
    var ghost := StyleBoxFlat.new()
    ghost.bg_color = Color.TRANSPARENT
    ghost.border_color = Color("#ffffff")
    ghost.set_border_width_all(2)
    ghost.set_corner_radius_all(8)
    ghost.set_content_margin_all(16)
    theme.set_stylebox("normal", "GhostButton", ghost)
    theme.set_type_variation("GhostButton", "Button")

# Usage in scene:
# button.theme_type_variation = "DangerButton"
```

## Common UI Patterns

### Main Menu

```gdscript
# main_menu.gd
class_name MainMenu
extends Control

signal play_pressed
signal settings_pressed
signal quit_pressed

@onready var _play_button: Button = %PlayButton
@onready var _settings_button: Button = %SettingsButton
@onready var _quit_button: Button = %QuitButton
@onready var _animation_player: AnimationPlayer = $AnimationPlayer


func _ready() -> void:
    _play_button.pressed.connect(_on_play_pressed)
    _settings_button.pressed.connect(_on_settings_pressed)
    _quit_button.pressed.connect(_on_quit_pressed)

    # Set initial focus for keyboard navigation
    _play_button.grab_focus()


func show_menu() -> void:
    show()
    _animation_player.play("fade_in")
    await _animation_player.animation_finished
    _play_button.grab_focus()


func hide_menu() -> void:
    _animation_player.play("fade_out")
    await _animation_player.animation_finished
    hide()


func _on_play_pressed() -> void:
    play_pressed.emit()


func _on_settings_pressed() -> void:
    settings_pressed.emit()


func _on_quit_pressed() -> void:
    quit_pressed.emit()
```

### HUD

```gdscript
# hud.gd
class_name HUD
extends CanvasLayer

@onready var _health_bar: ProgressBar = %HealthBar
@onready var _score_label: Label = %ScoreLabel
@onready var _ammo_label: Label = %AmmoLabel
@onready var _message_label: Label = %MessageLabel

var _message_tween: Tween


func update_health(current: int, maximum: int) -> void:
    _health_bar.max_value = maximum
    _health_bar.value = current

    # Flash red when low
    if current < maximum * 0.25:
        _flash_element(_health_bar, Color.RED)


func update_score(score: int) -> void:
    _score_label.text = "Score: %d" % score
    _pop_element(_score_label)


func update_ammo(current: int, max_ammo: int) -> void:
    _ammo_label.text = "%d / %d" % [current, max_ammo]

    if current == 0:
        _ammo_label.add_theme_color_override("font_color", Color.RED)
    else:
        _ammo_label.remove_theme_color_override("font_color")


func show_message(text: String, duration: float = 2.0) -> void:
    if _message_tween:
        _message_tween.kill()

    _message_label.text = text
    _message_label.modulate.a = 1.0
    _message_label.show()

    _message_tween = create_tween()
    _message_tween.tween_interval(duration)
    _message_tween.tween_property(_message_label, "modulate:a", 0.0, 0.5)
    _message_tween.tween_callback(_message_label.hide)


func _flash_element(element: Control, color: Color) -> void:
    var tween := create_tween()
    tween.tween_property(element, "modulate", color, 0.1)
    tween.tween_property(element, "modulate", Color.WHITE, 0.1)


func _pop_element(element: Control) -> void:
    var tween := create_tween()
    tween.tween_property(element, "scale", Vector2(1.2, 1.2), 0.1)
    tween.tween_property(element, "scale", Vector2.ONE, 0.1)
```

### Popup Dialog

```gdscript
# confirmation_dialog.gd
class_name GameConfirmDialog
extends Control

signal confirmed
signal cancelled

@onready var _panel: PanelContainer = $Panel
@onready var _title_label: Label = %TitleLabel
@onready var _message_label: Label = %MessageLabel
@onready var _confirm_button: Button = %ConfirmButton
@onready var _cancel_button: Button = %CancelButton


func _ready() -> void:
    _confirm_button.pressed.connect(_on_confirmed)
    _cancel_button.pressed.connect(_on_cancelled)
    hide()


func show_dialog(title: String, message: String, confirm_text: String = "Confirm", cancel_text: String = "Cancel") -> void:
    _title_label.text = title
    _message_label.text = message
    _confirm_button.text = confirm_text
    _cancel_button.text = cancel_text

    # Animate in
    _panel.scale = Vector2(0.8, 0.8)
    _panel.modulate.a = 0.0
    show()

    var tween := create_tween().set_parallel()
    tween.tween_property(_panel, "scale", Vector2.ONE, 0.2).set_ease(Tween.EASE_OUT)
    tween.tween_property(_panel, "modulate:a", 1.0, 0.2)

    await tween.finished
    _confirm_button.grab_focus()


func _on_confirmed() -> void:
    _close_and_emit(confirmed)


func _on_cancelled() -> void:
    _close_and_emit(cancelled)


func _close_and_emit(sig: Signal) -> void:
    var tween := create_tween().set_parallel()
    tween.tween_property(_panel, "scale", Vector2(0.8, 0.8), 0.15)
    tween.tween_property(_panel, "modulate:a", 0.0, 0.15)
    await tween.finished
    hide()
    sig.emit()


func _unhandled_input(event: InputEvent) -> void:
    if visible and event.is_action_pressed("ui_cancel"):
        _on_cancelled()
        get_viewport().set_input_as_handled()
```

### Settings Menu

```gdscript
# settings_menu.gd
class_name SettingsMenu
extends Control

signal settings_changed(settings: Dictionary)

@onready var _master_slider: HSlider = %MasterVolumeSlider
@onready var _music_slider: HSlider = %MusicVolumeSlider
@onready var _sfx_slider: HSlider = %SFXVolumeSlider
@onready var _fullscreen_check: CheckBox = %FullscreenCheck
@onready var _vsync_check: CheckBox = %VSyncCheck
@onready var _resolution_option: OptionButton = %ResolutionOption

var _settings: Dictionary = {}


func _ready() -> void:
    _setup_resolution_options()
    _load_settings()
    _connect_signals()


func _setup_resolution_options() -> void:
    var resolutions := [
        Vector2i(1280, 720),
        Vector2i(1920, 1080),
        Vector2i(2560, 1440),
        Vector2i(3840, 2160),
    ]

    for res in resolutions:
        _resolution_option.add_item("%dx%d" % [res.x, res.y])
        _resolution_option.set_item_metadata(_resolution_option.item_count - 1, res)


func _load_settings() -> void:
    # Load from ConfigFile or use defaults
    _settings = {
        "master_volume": 1.0,
        "music_volume": 0.8,
        "sfx_volume": 1.0,
        "fullscreen": false,
        "vsync": true,
        "resolution": Vector2i(1920, 1080),
    }

    _apply_to_ui()


func _apply_to_ui() -> void:
    _master_slider.value = _settings.master_volume
    _music_slider.value = _settings.music_volume
    _sfx_slider.value = _settings.sfx_volume
    _fullscreen_check.button_pressed = _settings.fullscreen
    _vsync_check.button_pressed = _settings.vsync


func _connect_signals() -> void:
    _master_slider.value_changed.connect(_on_master_changed)
    _music_slider.value_changed.connect(_on_music_changed)
    _sfx_slider.value_changed.connect(_on_sfx_changed)
    _fullscreen_check.toggled.connect(_on_fullscreen_toggled)
    _vsync_check.toggled.connect(_on_vsync_toggled)
    _resolution_option.item_selected.connect(_on_resolution_selected)


func _on_master_changed(value: float) -> void:
    _settings.master_volume = value
    AudioServer.set_bus_volume_db(0, linear_to_db(value))
    _emit_changed()


func _on_music_changed(value: float) -> void:
    _settings.music_volume = value
    var bus_idx := AudioServer.get_bus_index("Music")
    if bus_idx >= 0:
        AudioServer.set_bus_volume_db(bus_idx, linear_to_db(value))
    _emit_changed()


func _on_sfx_changed(value: float) -> void:
    _settings.sfx_volume = value
    var bus_idx := AudioServer.get_bus_index("SFX")
    if bus_idx >= 0:
        AudioServer.set_bus_volume_db(bus_idx, linear_to_db(value))
    _emit_changed()


func _on_fullscreen_toggled(pressed: bool) -> void:
    _settings.fullscreen = pressed
    if pressed:
        DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN)
    else:
        DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_WINDOWED)
    _emit_changed()


func _on_vsync_toggled(pressed: bool) -> void:
    _settings.vsync = pressed
    DisplayServer.window_set_vsync_mode(
        DisplayServer.VSYNC_ENABLED if pressed else DisplayServer.VSYNC_DISABLED
    )
    _emit_changed()


func _on_resolution_selected(index: int) -> void:
    var res: Vector2i = _resolution_option.get_item_metadata(index)
    _settings.resolution = res
    DisplayServer.window_set_size(res)
    _emit_changed()


func _emit_changed() -> void:
    settings_changed.emit(_settings)
```

## Focus and Navigation

```gdscript
# Proper keyboard/controller navigation setup
func setup_menu_navigation(buttons: Array[Button]) -> void:
    for i in buttons.size():
        var button := buttons[i]

        # Set focus neighbors
        if i > 0:
            button.focus_neighbor_top = buttons[i - 1].get_path()
        if i < buttons.size() - 1:
            button.focus_neighbor_bottom = buttons[i + 1].get_path()

        # Wrap around
        if i == 0:
            button.focus_neighbor_top = buttons[-1].get_path()
        if i == buttons.size() - 1:
            button.focus_neighbor_bottom = buttons[0].get_path()


# Focus sounds
func _on_button_focus_entered() -> void:
    $FocusSound.play()


func _on_button_pressed() -> void:
    $ClickSound.play()
```

## Responsive Design

```gdscript
# Handle different screen sizes
func _ready() -> void:
    get_tree().root.size_changed.connect(_on_window_resized)
    _on_window_resized()


func _on_window_resized() -> void:
    var viewport_size := get_viewport_rect().size

    # Adjust UI scale based on resolution
    if viewport_size.x < 1280:
        _set_ui_scale(0.75)
    elif viewport_size.x < 1920:
        _set_ui_scale(1.0)
    else:
        _set_ui_scale(1.25)


func _set_ui_scale(scale: float) -> void:
    # Apply to root control
    $UIRoot.scale = Vector2(scale, scale)
```

## Accessibility

```gdscript
# High contrast mode
func set_high_contrast(enabled: bool) -> void:
    if enabled:
        var hc_theme := _create_high_contrast_theme()
        theme = hc_theme
    else:
        theme = _default_theme


# Screen reader support (custom implementation)
func announce(text: String) -> void:
    # For platforms with TTS
    if DisplayServer.tts_is_speaking():
        DisplayServer.tts_stop()
    DisplayServer.tts_speak(text)


# Large text option
func set_text_scale(scale: float) -> void:
    var sizes := {
        "font_size": int(16 * scale),
        "title_font_size": int(24 * scale),
        "header_font_size": int(20 * scale),
    }

    for node in get_tree().get_nodes_in_group("scalable_text"):
        if node is Label:
            node.add_theme_font_size_override("font_size", sizes.font_size)
```
