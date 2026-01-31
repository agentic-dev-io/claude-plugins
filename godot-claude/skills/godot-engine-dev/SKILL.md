---
name: Godot Engine Development
description: This skill should be used when the user asks about "engine module", "custom module", "Godot source", "modify engine", "SCons", "SConstruct", "godot C++", "engine development", "custom node type", "register_types", "core classes", "servers", "RenderingServer", "PhysicsServer", "custom renderer", "compute shader", "rendering pipeline", "GDNative", "build Godot", "compile Godot", or needs guidance on modifying Godot Engine source code or creating custom engine modules.
---

# Godot Engine Development (4.6)

This skill covers creating custom engine modules, modifying Godot source code, understanding the engine architecture, and building custom renderers.

## Engine Module Development

### Module Structure

```
modules/
└── my_module/
    ├── SCsub                    # Build configuration
    ├── config.py                # Module configuration
    ├── register_types.cpp       # Type registration
    ├── register_types.h
    ├── my_custom_node.cpp       # Custom classes
    ├── my_custom_node.h
    └── doc_classes/             # Documentation
        └── MyCustomNode.xml
```

### SCsub (Build File)

```python
# modules/my_module/SCsub
Import("env")
Import("env_modules")

# Create module environment
env_my_module = env_modules.Clone()

# Add include paths
env_my_module.Append(CPPPATH=["#modules/my_module"])

# Add defines
env_my_module.Append(CPPDEFINES=["MY_MODULE_ENABLED"])

# Optional: Link external libraries
# env_my_module.Append(LIBS=["external_lib"])

# Compile source files
module_obj = []
env_my_module.add_source_files(module_obj, "*.cpp")

# Add to modules
env.modules_sources += module_obj
```

### config.py

```python
# modules/my_module/config.py

def can_build(env, platform):
    # Return True if module can build on this platform
    return True

def configure(env):
    pass

def get_doc_classes():
    return [
        "MyCustomNode",
        "MyCustomResource",
    ]

def get_doc_path():
    return "doc_classes"

def is_enabled():
    # Can be disabled via scons my_module=no
    return True
```

### Register Types

```cpp
// modules/my_module/register_types.h
#ifndef MY_MODULE_REGISTER_TYPES_H
#define MY_MODULE_REGISTER_TYPES_H

#include "modules/register_module_types.h"

void initialize_my_module_module(ModuleInitializationLevel p_level);
void uninitialize_my_module_module(ModuleInitializationLevel p_level);

#endif

// modules/my_module/register_types.cpp
#include "register_types.h"
#include "my_custom_node.h"
#include "my_custom_resource.h"
#include "core/object/class_db.h"

void initialize_my_module_module(ModuleInitializationLevel p_level) {
    if (p_level != MODULE_INITIALIZATION_LEVEL_SCENE) {
        return;
    }

    // Register classes
    GDREGISTER_CLASS(MyCustomNode);
    GDREGISTER_CLASS(MyCustomResource);

    // Register singletons
    // Engine::get_singleton()->add_singleton(
    //     Engine::Singleton("MySingleton", MySingleton::get_singleton())
    // );
}

void uninitialize_my_module_module(ModuleInitializationLevel p_level) {
    if (p_level != MODULE_INITIALIZATION_LEVEL_SCENE) {
        return;
    }
    // Cleanup if needed
}
```

### Custom Node Class

```cpp
// modules/my_module/my_custom_node.h
#ifndef MY_CUSTOM_NODE_H
#define MY_CUSTOM_NODE_H

#include "scene/3d/node_3d.h"
#include "core/object/ref_counted.h"

class MyCustomNode : public Node3D {
    GDCLASS(MyCustomNode, Node3D);

private:
    float custom_value = 1.0f;
    String custom_string;
    Ref<Resource> custom_resource;

protected:
    static void _bind_methods();
    void _notification(int p_what);

public:
    MyCustomNode();
    ~MyCustomNode();

    // Virtual overrides
    void _process(double p_delta);
    void _physics_process(double p_delta);

    // Property getters/setters
    void set_custom_value(float p_value);
    float get_custom_value() const;

    void set_custom_string(const String &p_string);
    String get_custom_string() const;

    // Custom methods
    void do_custom_operation();
    Vector3 calculate_something(const Vector3 &p_input);

    // Signals declared in _bind_methods
};

#endif

// modules/my_module/my_custom_node.cpp
#include "my_custom_node.h"
#include "core/config/engine.h"

void MyCustomNode::_bind_methods() {
    // Properties
    ClassDB::bind_method(D_METHOD("set_custom_value", "value"), &MyCustomNode::set_custom_value);
    ClassDB::bind_method(D_METHOD("get_custom_value"), &MyCustomNode::get_custom_value);
    ADD_PROPERTY(PropertyInfo(Variant::FLOAT, "custom_value", PROPERTY_HINT_RANGE, "0,100,0.1"),
                 "set_custom_value", "get_custom_value");

    ClassDB::bind_method(D_METHOD("set_custom_string", "string"), &MyCustomNode::set_custom_string);
    ClassDB::bind_method(D_METHOD("get_custom_string"), &MyCustomNode::get_custom_string);
    ADD_PROPERTY(PropertyInfo(Variant::STRING, "custom_string"),
                 "set_custom_string", "get_custom_string");

    // Methods
    ClassDB::bind_method(D_METHOD("do_custom_operation"), &MyCustomNode::do_custom_operation);
    ClassDB::bind_method(D_METHOD("calculate_something", "input"), &MyCustomNode::calculate_something);

    // Signals
    ADD_SIGNAL(MethodInfo("custom_event",
        PropertyInfo(Variant::FLOAT, "value"),
        PropertyInfo(Variant::STRING, "message")));

    // Constants
    BIND_CONSTANT(MY_CONSTANT_VALUE);

    // Enums
    BIND_ENUM_CONSTANT(MODE_ONE);
    BIND_ENUM_CONSTANT(MODE_TWO);
}

void MyCustomNode::_notification(int p_what) {
    switch (p_what) {
        case NOTIFICATION_READY: {
            set_process(true);
            set_physics_process(true);
        } break;

        case NOTIFICATION_PROCESS: {
            // Called every frame if set_process(true)
        } break;

        case NOTIFICATION_PHYSICS_PROCESS: {
            // Called every physics tick
        } break;

        case NOTIFICATION_ENTER_TREE: {
            // Node entered the scene tree
        } break;

        case NOTIFICATION_EXIT_TREE: {
            // Node exited the scene tree
        } break;
    }
}

MyCustomNode::MyCustomNode() {
    // Constructor
}

MyCustomNode::~MyCustomNode() {
    // Destructor
}

void MyCustomNode::_process(double p_delta) {
    // Frame update logic
}

void MyCustomNode::_physics_process(double p_delta) {
    // Physics update logic
}

void MyCustomNode::set_custom_value(float p_value) {
    custom_value = p_value;
    emit_signal("custom_event", custom_value, "Value changed");
}

float MyCustomNode::get_custom_value() const {
    return custom_value;
}

void MyCustomNode::set_custom_string(const String &p_string) {
    custom_string = p_string;
}

String MyCustomNode::get_custom_string() const {
    return custom_string;
}

void MyCustomNode::do_custom_operation() {
    // Implementation
}

Vector3 MyCustomNode::calculate_something(const Vector3 &p_input) {
    return p_input * custom_value;
}
```

## Godot Engine Architecture

### Core Class Hierarchy

```
Object
├── RefCounted
│   ├── Resource
│   │   ├── Texture
│   │   ├── Material
│   │   ├── Mesh
│   │   └── Script
│   └── Reference (deprecated, use RefCounted)
├── Node
│   ├── Node2D
│   │   ├── Sprite2D
│   │   ├── CharacterBody2D
│   │   └── Area2D
│   ├── Node3D (formerly Spatial)
│   │   ├── MeshInstance3D
│   │   ├── CharacterBody3D
│   │   └── Camera3D
│   ├── Control
│   │   ├── Button
│   │   ├── Label
│   │   └── Container
│   └── Viewport
└── MainLoop
    └── SceneTree
```

### Servers Architecture

```cpp
// Godot uses server/client architecture for major subsystems

// RenderingServer - all rendering operations
RenderingServer *rs = RenderingServer::get_singleton();
RID mesh_rid = rs->mesh_create();
rs->mesh_add_surface_from_arrays(mesh_rid, RenderingServer::PRIMITIVE_TRIANGLES, arrays);

// PhysicsServer3D - 3D physics
PhysicsServer3D *ps = PhysicsServer3D::get_singleton();
RID body_rid = ps->body_create();
ps->body_set_mode(body_rid, PhysicsServer3D::BODY_MODE_RIGID);
ps->body_add_shape(body_rid, shape_rid);

// AudioServer
AudioServer *as = AudioServer::get_singleton();
int bus_idx = as->get_bus_index("Master");
as->set_bus_volume_db(bus_idx, -6.0);

// NavigationServer3D
NavigationServer3D *ns = NavigationServer3D::get_singleton();
RID map_rid = ns->map_create();
ns->map_set_active(map_rid, true);
```

### Working with RenderingServer

```cpp
// Create mesh from code
void create_procedural_mesh() {
    RenderingServer *rs = RenderingServer::get_singleton();

    // Create mesh RID
    RID mesh = rs->mesh_create();

    // Prepare arrays
    Vector<Vector3> vertices;
    Vector<Vector3> normals;
    Vector<Vector2> uvs;
    Vector<int> indices;

    // Add vertices (example: quad)
    vertices.push_back(Vector3(-1, 0, -1));
    vertices.push_back(Vector3(1, 0, -1));
    vertices.push_back(Vector3(1, 0, 1));
    vertices.push_back(Vector3(-1, 0, 1));

    normals.push_back(Vector3(0, 1, 0));
    normals.push_back(Vector3(0, 1, 0));
    normals.push_back(Vector3(0, 1, 0));
    normals.push_back(Vector3(0, 1, 0));

    indices.push_back(0);
    indices.push_back(1);
    indices.push_back(2);
    indices.push_back(0);
    indices.push_back(2);
    indices.push_back(3);

    // Create surface arrays
    Array arrays;
    arrays.resize(RenderingServer::ARRAY_MAX);
    arrays[RenderingServer::ARRAY_VERTEX] = vertices;
    arrays[RenderingServer::ARRAY_NORMAL] = normals;
    arrays[RenderingServer::ARRAY_TEX_UV] = uvs;
    arrays[RenderingServer::ARRAY_INDEX] = indices;

    // Add surface to mesh
    rs->mesh_add_surface_from_arrays(mesh, RenderingServer::PRIMITIVE_TRIANGLES, arrays);

    // Create instance
    RID instance = rs->instance_create();
    rs->instance_set_base(instance, mesh);
    rs->instance_set_scenario(instance, get_world_3d()->get_scenario());
    rs->instance_set_transform(instance, get_global_transform());
}
```

## Custom Renderer Components

### Custom Render Pass

```cpp
// Adding a custom post-process effect

// In your module's header
class MyPostProcess : public RefCounted {
    GDCLASS(MyPostProcess, RefCounted);

private:
    RID shader;
    RID material;

protected:
    static void _bind_methods();

public:
    void initialize();
    void render(RID p_render_target, RID p_source_texture);
};

// Implementation
void MyPostProcess::initialize() {
    RenderingServer *rs = RenderingServer::get_singleton();

    // Create shader
    shader = rs->shader_create();

    String shader_code = R"(
        shader_type canvas_item;

        uniform sampler2D screen_texture : hint_screen_texture, filter_linear;
        uniform float intensity : hint_range(0.0, 1.0) = 0.5;

        void fragment() {
            vec4 color = texture(screen_texture, SCREEN_UV);
            // Custom effect
            color.rgb = mix(color.rgb, vec3(dot(color.rgb, vec3(0.299, 0.587, 0.114))), intensity);
            COLOR = color;
        }
    )";

    rs->shader_set_code(shader, shader_code);

    // Create material
    material = rs->material_create();
    rs->material_set_shader(material, shader);
}
```

### Compute Shaders

```cpp
// Using compute shaders for GPU computation
void run_compute_shader() {
    RenderingDevice *rd = RenderingServer::get_singleton()->get_rendering_device();

    // Load shader
    Ref<RDShaderFile> shader_file = ResourceLoader::load("res://compute_shader.glsl");
    Ref<RDShaderSPIRV> shader_spirv = shader_file->get_spirv();
    RID shader = rd->shader_create_from_spirv(shader_spirv);

    // Create uniform buffer
    PackedFloat32Array params;
    params.push_back(1.0f);  // param1
    params.push_back(2.0f);  // param2
    PackedByteArray params_bytes = params.to_byte_array();

    RID uniform_buffer = rd->uniform_buffer_create(params_bytes.size(), params_bytes);

    // Create storage buffer for output
    PackedFloat32Array output_data;
    output_data.resize(1024);
    PackedByteArray output_bytes = output_data.to_byte_array();

    RID storage_buffer = rd->storage_buffer_create(output_bytes.size(), output_bytes);

    // Create uniform set
    Array uniforms;

    RDUniform uniform_params;
    uniform_params.uniform_type = RenderingDevice::UNIFORM_TYPE_UNIFORM_BUFFER;
    uniform_params.binding = 0;
    uniform_params.add_id(uniform_buffer);
    uniforms.push_back(uniform_params);

    RDUniform uniform_output;
    uniform_output.uniform_type = RenderingDevice::UNIFORM_TYPE_STORAGE_BUFFER;
    uniform_output.binding = 1;
    uniform_output.add_id(storage_buffer);
    uniforms.push_back(uniform_output);

    RID uniform_set = rd->uniform_set_create(uniforms, shader, 0);

    // Create compute pipeline
    RID pipeline = rd->compute_pipeline_create(shader);

    // Run compute shader
    int64_t compute_list = rd->compute_list_begin();
    rd->compute_list_bind_compute_pipeline(compute_list, pipeline);
    rd->compute_list_bind_uniform_set(compute_list, uniform_set, 0);
    rd->compute_list_dispatch(compute_list, 32, 1, 1);  // 32 workgroups
    rd->compute_list_end();

    // Sync and read results
    rd->submit();
    rd->sync();

    PackedByteArray result_bytes = rd->buffer_get_data(storage_buffer);
    PackedFloat32Array results = result_bytes.to_float32_array();
}
```

## Building Godot

### Build Commands

```bash
# Clone repository
git clone https://github.com/godotengine/godot.git
cd godot
git checkout 4.6-stable

# Install dependencies (example for Ubuntu)
# sudo apt-get install build-essential scons pkg-config libx11-dev libxcursor-dev \
#     libxinerama-dev libgl1-mesa-dev libglu-dev libasound2-dev libpulse-dev \
#     libdbus-1-dev libudev-dev libxi-dev libxrandr-dev yasm

# Build editor (debug)
scons platform=linuxbsd target=editor

# Build editor (release)
scons platform=linuxbsd target=editor production=yes

# Build export templates
scons platform=linuxbsd target=template_debug
scons platform=linuxbsd target=template_release

# Build with custom module
scons platform=linuxbsd target=editor custom_modules="../my_modules"

# Disable built-in modules
scons platform=linuxbsd target=editor module_mono_enabled=no

# Cross-compile for Windows (requires mingw)
scons platform=windows target=editor

# Build with LTO (slower compile, faster binary)
scons platform=linuxbsd target=editor lto=full
```

### Custom Build Configuration

```python
# custom.py - Place in godot root
# Override default build settings

# Disable modules
module_mono_enabled = "no"
module_webrtc_enabled = "no"

# Enable optimizations
use_lto = "yes"
production = "yes"

# Custom defines
extra_suffix = "_custom"
```

### Platform-Specific Building

```bash
# Windows (MSVC)
scons platform=windows target=editor vsproj=yes

# macOS
scons platform=macos target=editor arch=universal

# Android
export ANDROID_SDK_ROOT=/path/to/android-sdk
scons platform=android target=template_release arch=arm64

# iOS
scons platform=ios target=template_release arch=arm64

# Web
scons platform=web target=template_release
```

## Debugging Engine Code

```cpp
// Use print functions for debugging
print_line("Debug message: " + itos(value));
print_verbose("Verbose message (only with --verbose)");
WARN_PRINT("Warning message");
ERR_PRINT("Error message");
ERR_FAIL_COND(condition);  // Fails if condition is true
ERR_FAIL_COND_V(condition, return_value);
ERR_FAIL_NULL(pointer);
ERR_FAIL_INDEX(index, size);

// Crash with message
CRASH_NOW_MSG("Critical error occurred");

// Debug break
OS::get_singleton()->debug_break();
```

## Best Practices

```cpp
// 1. Memory management
// Use Ref<> for RefCounted objects
Ref<Resource> res = memnew(Resource);

// Use raw pointers for Node objects (managed by scene tree)
Node *node = memnew(Node);
add_child(node);

// Manual memory for other objects
MyClass *obj = memnew(MyClass);
memdelete(obj);

// 2. String handling
// Use StringName for frequent comparisons
static const StringName action_jump = "jump";
if (Input::get_singleton()->is_action_pressed(action_jump)) {}

// 3. Thread safety
// Use MutexLock for thread-safe operations
Mutex mutex;
void thread_safe_method() {
    MutexLock lock(mutex);
    // Safe operations
}

// 4. Avoid allocations in hot paths
// Pre-allocate vectors
Vector<Vector3> vertices;
vertices.resize(expected_size);

// 5. Use proper initialization levels
// LEVEL_CORE - Before anything else
// LEVEL_SERVERS - After core, before scene
// LEVEL_SCENE - Main level for most classes
// LEVEL_EDITOR - Editor-only classes
```
