---
name: GDExtension Development
description: This skill should be used when the user asks about "GDExtension", "native module", "C++ Godot", "Rust Godot", "godot-cpp", "gdext", "JSON binding", "extension_api.json", "GDExtensionInterface", "performance-critical Godot", or needs guidance on creating native Godot 4.x extensions using C++, Rust, or other compiled languages.
---

# GDExtension Development (Godot 4.x)

GDExtension is Godot 4's system for creating native extensions without modifying the engine. Godot 4.6 introduces JSON-based interface descriptions for easier automatic binding generation.

## Overview

GDExtension allows writing performance-critical code in C++, Rust, or other compiled languages while integrating seamlessly with GDScript/C#.

### When to Use GDExtension

- Performance-critical algorithms (pathfinding, physics, procedural generation)
- Wrapping existing C/C++ libraries
- Platform-specific native code
- Real-time audio/video processing
- Large-scale simulations

## C++ with godot-cpp

### Project Setup

```
my_extension/
├── src/
│   ├── register_types.cpp
│   ├── register_types.h
│   └── my_node.cpp
│   └── my_node.h
├── godot-cpp/              # Submodule
├── SConstruct
└── my_extension.gdextension
```

### SConstruct Build File

```python
#!/usr/bin/env python
import os
import sys

env = SConscript("godot-cpp/SConstruct")

# Add source files
env.Append(CPPPATH=["src/"])
sources = Glob("src/*.cpp")

# Platform-specific settings
if env["platform"] == "windows":
    env.Append(LIBS=["user32"])
elif env["platform"] == "linux":
    env.Append(LIBS=["pthread"])

# Build the library
library = env.SharedLibrary(
    "bin/my_extension{}{}".format(env["suffix"], env["SHLIBSUFFIX"]),
    source=sources,
)

Default(library)
```

### Extension Manifest (.gdextension)

```ini
[configuration]
entry_symbol = "my_extension_library_init"
compatibility_minimum = "4.3"

[libraries]
windows.debug.x86_64 = "res://bin/my_extension.windows.template_debug.x86_64.dll"
windows.release.x86_64 = "res://bin/my_extension.windows.template_release.x86_64.dll"
linux.debug.x86_64 = "res://bin/libmy_extension.linux.template_debug.x86_64.so"
linux.release.x86_64 = "res://bin/libmy_extension.linux.template_release.x86_64.so"
macos.debug = "res://bin/libmy_extension.macos.template_debug.framework"
macos.release = "res://bin/libmy_extension.macos.template_release.framework"

[dependencies]
windows.debug.x86_64 = {}
windows.release.x86_64 = {}
```

### Register Types

```cpp
// register_types.h
#ifndef MY_EXTENSION_REGISTER_TYPES_H
#define MY_EXTENSION_REGISTER_TYPES_H

#include <godot_cpp/core/class_db.hpp>

void initialize_my_extension(godot::ModuleInitializationLevel p_level);
void uninitialize_my_extension(godot::ModuleInitializationLevel p_level);

#endif

// register_types.cpp
#include "register_types.h"
#include "my_node.h"

#include <gdextension_interface.h>
#include <godot_cpp/core/defs.hpp>
#include <godot_cpp/godot.hpp>

using namespace godot;

void initialize_my_extension(ModuleInitializationLevel p_level) {
    if (p_level != MODULE_INITIALIZATION_LEVEL_SCENE) {
        return;
    }

    GDREGISTER_CLASS(MyNode);
}

void uninitialize_my_extension(ModuleInitializationLevel p_level) {
    if (p_level != MODULE_INITIALIZATION_LEVEL_SCENE) {
        return;
    }
}

extern "C" {
GDExtensionBool GDE_EXPORT my_extension_library_init(
    GDExtensionInterfaceGetProcAddress p_get_proc_address,
    const GDExtensionClassLibraryPtr p_library,
    GDExtensionInitialization *r_initialization
) {
    godot::GDExtensionBinding::InitObject init_obj(p_get_proc_address, p_library, r_initialization);

    init_obj.register_initializer(initialize_my_extension);
    init_obj.register_terminator(uninitialize_my_extension);
    init_obj.set_minimum_library_initialization_level(MODULE_INITIALIZATION_LEVEL_SCENE);

    return init_obj.init();
}
}
```

### Custom Node Class

```cpp
// my_node.h
#ifndef MY_NODE_H
#define MY_NODE_H

#include <godot_cpp/classes/node3d.hpp>
#include <godot_cpp/core/class_db.hpp>

namespace godot {

class MyNode : public Node3D {
    GDCLASS(MyNode, Node3D)

private:
    float speed;
    Vector3 velocity;

protected:
    static void _bind_methods();

public:
    MyNode();
    ~MyNode();

    void _process(double delta) override;
    void _physics_process(double delta) override;

    // Properties
    void set_speed(float p_speed);
    float get_speed() const;

    // Methods callable from GDScript
    void move_toward(Vector3 target);
    float calculate_distance(Vector3 point);

    // Signals
    // Declared in _bind_methods
};

}

#endif

// my_node.cpp
#include "my_node.h"

#include <godot_cpp/core/class_db.hpp>
#include <godot_cpp/variant/utility_functions.hpp>

using namespace godot;

void MyNode::_bind_methods() {
    // Properties
    ClassDB::bind_method(D_METHOD("get_speed"), &MyNode::get_speed);
    ClassDB::bind_method(D_METHOD("set_speed", "speed"), &MyNode::set_speed);
    ADD_PROPERTY(PropertyInfo(Variant::FLOAT, "speed", PROPERTY_HINT_RANGE, "0,100,0.1"),
                 "set_speed", "get_speed");

    // Methods
    ClassDB::bind_method(D_METHOD("move_toward", "target"), &MyNode::move_toward);
    ClassDB::bind_method(D_METHOD("calculate_distance", "point"), &MyNode::calculate_distance);

    // Signals
    ADD_SIGNAL(MethodInfo("target_reached", PropertyInfo(Variant::VECTOR3, "position")));
    ADD_SIGNAL(MethodInfo("speed_changed", PropertyInfo(Variant::FLOAT, "new_speed")));

    // Constants
    BIND_CONSTANT(MAX_SPEED);

    // Enums
    BIND_ENUM_CONSTANT(STATE_IDLE);
    BIND_ENUM_CONSTANT(STATE_MOVING);
    BIND_ENUM_CONSTANT(STATE_ATTACKING);
}

MyNode::MyNode() : speed(5.0f), velocity(Vector3()) {}
MyNode::~MyNode() {}

void MyNode::_process(double delta) {
    // Called every frame
}

void MyNode::_physics_process(double delta) {
    // Called every physics tick
    Vector3 pos = get_position();
    pos += velocity * delta;
    set_position(pos);
}

void MyNode::set_speed(float p_speed) {
    speed = p_speed;
    emit_signal("speed_changed", speed);
}

float MyNode::get_speed() const {
    return speed;
}

void MyNode::move_toward(Vector3 target) {
    Vector3 direction = (target - get_position()).normalized();
    velocity = direction * speed;
}

float MyNode::calculate_distance(Vector3 point) {
    return get_position().distance_to(point);
}
```

## Rust with gdext

### Project Setup

```toml
# Cargo.toml
[package]
name = "my_extension"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
godot = "0.4"  # Check https://crates.io/crates/godot for latest
```

### Extension Entry Point

```rust
// src/lib.rs
use godot::prelude::*;

struct MyExtension;

#[gdextension]
unsafe impl ExtensionLibrary for MyExtension {}
```

### Custom Node Class

```rust
// src/my_node.rs
use godot::prelude::*;
use godot::classes::{Node3D, INode3D};

#[derive(GodotClass)]
#[class(init, base=Node3D)]
pub struct MyNode {
    base: Base<Node3D>,

    #[export]
    speed: f32,

    velocity: Vector3,
}

#[godot_api]
impl INode3D for MyNode {
    fn init(base: Base<Node3D>) -> Self {
        Self {
            base,
            speed: 5.0,
            velocity: Vector3::ZERO,
        }
    }

    fn process(&mut self, delta: f64) {
        // Called every frame
    }

    fn physics_process(&mut self, delta: f64) {
        let pos = self.base().get_position();
        let new_pos = pos + self.velocity * delta as f32;
        self.base_mut().set_position(new_pos);
    }
}

#[godot_api]
impl MyNode {
    #[signal]
    fn target_reached(position: Vector3);

    #[signal]
    fn speed_changed(new_speed: f32);

    #[func]
    fn move_toward(&mut self, target: Vector3) {
        let pos = self.base().get_position();
        let direction = (target - pos).normalized();
        self.velocity = direction * self.speed;
    }

    #[func]
    fn calculate_distance(&self, point: Vector3) -> f32 {
        self.base().get_position().distance_to(point)
    }

    #[func]
    fn set_speed(&mut self, speed: f32) {
        self.speed = speed;
        self.base_mut().emit_signal("speed_changed", &[speed.to_variant()]);
    }

    #[func]
    fn get_speed(&self) -> f32 {
        self.speed
    }
}
```

## JSON-Based Bindings (4.6 Feature)

Godot 4.6 uses `extension_api.json` for automatic binding generation:

```bash
# Generate extension_api.json from Godot editor
godot --dump-extension-api

# The JSON describes all classes, methods, properties, signals
# Binding generators parse this to create language-specific bindings
```

### JSON Structure Example

```json
{
    "classes": [{
        "name": "Node3D",
        "is_refcounted": false,
        "is_instantiable": true,
        "inherits": "Node",
        "methods": [{
            "name": "set_position",
            "is_const": false,
            "is_static": false,
            "arguments": [{
                "name": "position",
                "type": "Vector3"
            }]
        }],
        "properties": [{
            "name": "position",
            "type": "Vector3",
            "getter": "get_position",
            "setter": "set_position"
        }],
        "signals": [{
            "name": "visibility_changed"
        }]
    }]
}
```

## Building Extensions

### C++ Build Commands

```bash
# Clone godot-cpp
git submodule add https://github.com/godotengine/godot-cpp.git
cd godot-cpp
git checkout 4.3  # or latest stable tag
git submodule update --init

# Build godot-cpp
scons platform=linux target=template_debug
scons platform=linux target=template_release

# Build extension
cd ..
scons platform=linux target=template_debug
scons platform=linux target=template_release
```

### Rust Build Commands

```bash
# Debug build
cargo build

# Release build
cargo build --release

# Copy to project
cp target/release/libmy_extension.so project/bin/
```

## Performance Tips

### Memory Management

```cpp
// Use Ref<> for RefCounted objects
Ref<Resource> resource = memnew(Resource);

// Use raw pointers for Node-based objects (managed by scene tree)
Node3D *node = memnew(Node3D);
add_child(node);  // Scene tree takes ownership

// Manual memory for non-RefCounted, non-Node objects
MyData *data = memnew(MyData);
memdelete(data);  // Must delete manually
```

### Threading

```cpp
#include <godot_cpp/classes/thread.hpp>
#include <godot_cpp/classes/mutex.hpp>

Ref<Thread> thread;
Ref<Mutex> mutex;

void start_background_work() {
    thread.instantiate();
    mutex.instantiate();
    thread->start(callable_mp(this, &MyNode::background_work));
}

void background_work() {
    mutex->lock();
    // Thread-safe work
    mutex->unlock();

    // Call back to main thread
    call_deferred("work_completed");
}
```

## Additional Resources

For GDExtension project setup, consult the official godot-cpp and gdext documentation.
