---
name: Godot XR & Virtual Production
description: This skill should be used when the user asks about "OpenXR", "VR Godot", "AR Godot", "XR Controller", "XROrigin3D", "virtual production", "VP", "motion capture", "LibGodot", "WebXR", "Meta Quest", "SteamVR", or needs guidance on XR development and virtual production workflows in Godot 4.6 with OpenXR 1.1 support.
---

# Godot XR & Virtual Production (4.6)

Godot 4.6 expands XR capabilities with built-in OpenXR 1.1 support, enabling coherent cross-platform deployment. LibGodot integration allows embedding Godot's tech in production pipelines.

## OpenXR Setup (4.6)

### Project Configuration

1. **Enable XR in Project Settings**:
   - `XR > OpenXR > Enabled = true`
   - `XR > Shaders > Enabled = true`

2. **Rendering Settings** for XR:
   - `Rendering > Renderer > Rendering Method = Forward+` (recommended)
   - `Rendering > VRS > Mode = XR` (Variable Rate Shading)
   - `Rendering > Anti-Aliasing > MSAA 3D = 4x` (minimum for VR)

### Basic XR Scene Structure

```
XROrigin3D
├── XRCamera3D
├── XRController3D (left)
│   └── HandModel (optional)
│   └── Laser pointer
├── XRController3D (right)
│   └── HandModel (optional)
│   └── Laser pointer
└── Environment
```

### XR Initialization

```gdscript
extends Node3D

var xr_interface: XRInterface

func _ready() -> void:
    xr_interface = XRServer.find_interface("OpenXR")
    if xr_interface and xr_interface.is_initialized():
        print("OpenXR initialized successfully")

        # Configure viewport for XR
        get_viewport().use_xr = true

        # Optional: set refresh rate (Quest 2 supports 72, 90, 120 Hz)
        if xr_interface.get_capabilities() & XRInterface.XR_PLAY_AREA:
            var refresh_rates = xr_interface.get_supported_refresh_rates()
            if 90.0 in refresh_rates:
                xr_interface.set_display_refresh_rate(90.0)
    else:
        print("OpenXR not initialized")
```

### Controller Input

```gdscript
extends XRController3D

signal trigger_pressed
signal grip_pressed
signal button_a_pressed
signal button_b_pressed

func _ready() -> void:
    # Connect to input events
    button_pressed.connect(_on_button_pressed)
    button_released.connect(_on_button_released)
    input_float_changed.connect(_on_input_float_changed)
    input_vector2_changed.connect(_on_input_vector2_changed)

func _on_button_pressed(name: String) -> void:
    match name:
        "trigger_click":
            trigger_pressed.emit()
        "grip_click":
            grip_pressed.emit()
        "ax_button":  # A/X button
            button_a_pressed.emit()
        "by_button":  # B/Y button
            button_b_pressed.emit()
        "menu_button":
            _show_pause_menu()

func _on_input_float_changed(name: String, value: float) -> void:
    match name:
        "trigger":
            # Analog trigger value 0.0 - 1.0
            _update_grab_strength(value)
        "grip":
            # Analog grip value
            _update_grip(value)

func _on_input_vector2_changed(name: String, value: Vector2) -> void:
    match name:
        "primary":
            # Thumbstick/touchpad input
            _handle_movement(value)

func _process(delta: float) -> void:
    # Direct input polling (alternative)
    if is_button_pressed("trigger_click"):
        _continuous_action()
```

### Hand Tracking

```gdscript
extends XRController3D

@onready var hand_mesh: MeshInstance3D = $HandMesh
var hand_tracker: XRHandTracker

func _ready() -> void:
    # Get hand tracker for this controller
    var tracker_name = "/user/hand/left" if tracker == "left" else "/user/hand/right"
    hand_tracker = XRServer.get_tracker(tracker_name) as XRHandTracker

func _process(delta: float) -> void:
    if hand_tracker and hand_tracker.get_has_tracking_data():
        # Get individual finger joint positions
        var thumb_tip = hand_tracker.get_hand_joint_transform(XRHandTracker.HAND_JOINT_THUMB_TIP)
        var index_tip = hand_tracker.get_hand_joint_transform(XRHandTracker.HAND_JOINT_INDEX_FINGER_TIP)

        # Detect pinch gesture
        var pinch_distance = thumb_tip.origin.distance_to(index_tip.origin)
        if pinch_distance < 0.02:  # 2cm threshold
            _on_pinch_detected()
```

### Teleportation

```gdscript
extends XRController3D

@export var teleport_ray: RayCast3D
@export var teleport_marker: Node3D
@export var max_distance: float = 10.0
@export var valid_layers: int = 1  # Floor collision layer

var can_teleport: bool = false
var teleport_target: Vector3

func _process(delta: float) -> void:
    if teleport_ray.is_colliding():
        var collision_point = teleport_ray.get_collision_point()
        var collision_normal = teleport_ray.get_collision_normal()

        # Check if surface is walkable (mostly horizontal)
        if collision_normal.dot(Vector3.UP) > 0.7:
            can_teleport = true
            teleport_target = collision_point
            teleport_marker.global_position = collision_point
            teleport_marker.visible = true
        else:
            can_teleport = false
            teleport_marker.visible = false
    else:
        can_teleport = false
        teleport_marker.visible = false

func _on_button_pressed(name: String) -> void:
    if name == "trigger_click" and can_teleport:
        _teleport()

func _teleport() -> void:
    var xr_origin = get_parent() as XROrigin3D
    var camera_offset = xr_origin.get_node("XRCamera3D").global_position - xr_origin.global_position
    camera_offset.y = 0
    xr_origin.global_position = teleport_target - camera_offset
```

## Virtual Production

### LibGodot Integration (4.6+)

LibGodot allows embedding Godot in external applications. This is an evolving feature - check official Godot documentation for the current API.

**Conceptual workflow:**
1. Initialize Godot runtime in host application
2. Load Godot project
3. Create render targets for external windows
4. Process input and render frames
5. Composite rendered output with external video

**Note:** LibGodot API is under active development. Consult [Godot LibGodot PR](https://github.com/godotengine/godot/pull/72883) and official documentation for current implementation details.

### Real-Time LED Wall (Virtual Production)

```gdscript
extends Node3D

## LED wall configuration
@export var wall_resolution: Vector2i = Vector2i(3840, 2160)
@export var wall_size: Vector2 = Vector2(10.0, 5.0)  # meters
@export var tracking_source: Node3D

## Frustum matching for camera
@export var real_camera_fov: float = 35.0
@export var real_camera_sensor: Vector2 = Vector2(36.0, 24.0)  # Full frame

@onready var virtual_camera: Camera3D = $VirtualCamera
@onready var wall_viewport: SubViewport = $WallViewport

func _ready() -> void:
    # Match virtual camera to real camera specs
    virtual_camera.fov = real_camera_fov
    virtual_camera.keep_aspect = Camera3D.KEEP_WIDTH

    # Set viewport resolution
    wall_viewport.size = wall_resolution

func _process(delta: float) -> void:
    if tracking_source:
        # Sync virtual camera to tracked real camera
        virtual_camera.global_transform = tracking_source.global_transform

        # Calculate frustum for LED wall content
        update_wall_frustum()

func update_wall_frustum() -> void:
    # Compute what the LED wall should display
    # based on camera position relative to wall
    var cam_pos = virtual_camera.global_position
    var wall_center = $LEDWall.global_position

    # Perspective-correct projection for in-camera VFX
    var offset = cam_pos - wall_center
    # ... frustum calculations
```

### Motion Capture Integration

```gdscript
extends Node3D

## VRPN/OSC motion capture receiver
@export var mocap_server: String = "192.168.1.100"
@export var mocap_port: int = 3883

var udp_peer: PacketPeerUDP
var skeleton_data: Dictionary = {}

func _ready() -> void:
    udp_peer = PacketPeerUDP.new()
    udp_peer.bind(mocap_port)

func _process(delta: float) -> void:
    while udp_peer.get_available_packet_count() > 0:
        var packet = udp_peer.get_packet()
        parse_mocap_data(packet)

    apply_mocap_to_skeleton()

func parse_mocap_data(packet: PackedByteArray) -> void:
    # Parse OSC or custom mocap protocol
    var stream = StreamPeerBuffer.new()
    stream.data_array = packet

    # Example: read bone transforms
    var bone_count = stream.get_32()
    for i in bone_count:
        var bone_name = stream.get_string()
        var pos = Vector3(stream.get_float(), stream.get_float(), stream.get_float())
        var rot = Quaternion(stream.get_float(), stream.get_float(),
                            stream.get_float(), stream.get_float())
        skeleton_data[bone_name] = {"position": pos, "rotation": rot}

func apply_mocap_to_skeleton() -> void:
    var skeleton: Skeleton3D = $Character/Skeleton3D
    for bone_name in skeleton_data:
        var bone_idx = skeleton.find_bone(bone_name)
        if bone_idx >= 0:
            var data = skeleton_data[bone_name]
            skeleton.set_bone_pose_position(bone_idx, data.position)
            skeleton.set_bone_pose_rotation(bone_idx, data.rotation)
```

### NDI Output for Broadcast

NDI (Network Device Interface) requires a third-party GDExtension plugin. Example workflow:

```gdscript
extends Node

## NDI output for live broadcast integration
## Requires: GDExtension NDI plugin (not included in Godot core)

# var ndi_sender  # Type depends on plugin

func _ready() -> void:
    # Initialize NDI sender via plugin
    # ndi_sender = NDIPlugin.create_sender("Godot VP Output")

    # Connect to viewport
    var viewport = get_viewport()
    viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS

func _process(delta: float) -> void:
    # Send frame via NDI plugin
    var image = get_viewport().get_texture().get_image()
    # ndi_sender.send_frame(image)
```

**Note:** Search for "Godot NDI GDExtension" for community plugins implementing NDI support.

## WebXR Support

```gdscript
extends Node3D

var webxr_interface: XRInterface

func _ready() -> void:
    webxr_interface = XRServer.find_interface("WebXR")
    if webxr_interface:
        # WebXR requires user gesture to start
        webxr_interface.session_supported.connect(_on_session_supported)
        webxr_interface.session_started.connect(_on_session_started)
        webxr_interface.session_ended.connect(_on_session_ended)

        # Check VR support
        webxr_interface.is_session_supported("immersive-vr")

func _on_session_supported(session_mode: String, supported: bool) -> void:
    if supported:
        $UI/StartVRButton.visible = true

func start_vr() -> void:
    # Called from UI button click (user gesture required)
    webxr_interface.session_mode = "immersive-vr"
    webxr_interface.requested_reference_space_types = "local-floor"
    webxr_interface.required_features = "local-floor"
    webxr_interface.optional_features = "hand-tracking"

    get_viewport().use_xr = true
    webxr_interface.initialize()
```

## Additional Resources

For XR and VP project templates, see the plugin's `templates/xr-interaction/` and `templates/vp-starter/` directories.
