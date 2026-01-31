---
name: Godot Asset Pipeline
description: This skill should be used when the user asks about "Godot import", "Blender to Godot", "GLTF import", "GLB export", "collision shape", "Jolt Physics", "material setup", "texture import", "mesh optimization", "LOD", "asset workflow", "-col suffix", "-trimesh", or needs guidance on Blender-to-Godot asset pipelines in Godot 4.x with Jolt Physics.
---

# Godot Asset Pipeline (4.x)

Godot 4.6 makes Jolt Physics the default for 3D projects, simplifies collision shape generation for primitives, and maintains excellent Blender integration. This skill covers professional asset workflows.

## Blender Integration

### Export Settings

For optimal Godot import, configure Blender export:

1. **File > Export > glTF 2.0 (.glb/.gltf)**
2. **Recommended settings**:
   - Format: glTF Binary (.glb)
   - Include: Selected Objects, Custom Properties
   - Transform: +Y Up
   - Geometry: Apply Modifiers, UVs, Normals, Tangents, Vertex Colors
   - Animation: Export (if needed), Group by NLA Track
   - Compression: Draco (for web) or None (for editing)

### Naming Conventions

Godot recognizes special suffixes for automatic setup:

```
# Collision shapes (suffix)
MeshName-col      # Convex collision
MeshName-colonly  # Collision only (no visual)
MeshName-convcol  # Convex collision (explicit)
MeshName-trimesh  # Triangle mesh collision

# LOD levels
MeshName_LOD0     # Highest detail
MeshName_LOD1     # Medium detail
MeshName_LOD2     # Low detail

# Animation
ArmatureName-loop  # Loop animation
ArmatureName-cycle # Cycle animation

# Navigation
MeshName-navmesh  # Navigation mesh
```

### Blender Scene Structure

```
Collection: Environment
├── Ground-trimesh          # Floor with trimesh collision
├── Wall_01-col             # Wall with convex collision
├── Pillar_01-col
│   ├── Pillar_01_LOD0
│   ├── Pillar_01_LOD1
│   └── Pillar_01_LOD2
└── Props
    ├── Barrel-col
    └── Crate-col

Collection: Characters
├── Player
│   └── Armature
│       └── Body
└── Enemy
    └── Armature
        └── Body
```

## Import Configuration

### Advanced Import Settings

Create `.import` preset or configure via Import dock:

```ini
# In project: .godot/imported/model.glb-hash.import

[remap]
importer="scene"
type="PackedScene"

[params]
nodes/root_type="Node3D"
nodes/root_name="Scene Root"

meshes/ensure_tangents=true
meshes/generate_lods=true
meshes/create_shadow_meshes=true
meshes/light_baking=1  # Static Lightmaps
meshes/lightmap_texel_size=0.2

skins/use_named_skins=true

animation/import=true
animation/fps=30
animation/trimming=true
animation/remove_immutable_tracks=true
```

### Import Script (Advanced)

```gdscript
# res://addons/import_scripts/character_import.gd
@tool
extends EditorScenePostImport

func _post_import(scene: Node) -> Object:
    # Process imported scene
    _setup_materials(scene)
    _setup_collisions(scene)
    _setup_animations(scene)
    return scene

func _setup_materials(node: Node) -> void:
    for child in node.get_children():
        if child is MeshInstance3D:
            var mesh = child.mesh
            for i in mesh.get_surface_count():
                var mat = mesh.surface_get_material(i)
                if mat is StandardMaterial3D:
                    # Configure PBR settings
                    mat.metallic_specular = 0.5
                    mat.roughness = 0.8
        _setup_materials(child)

func _setup_collisions(node: Node) -> void:
    for child in node.get_children():
        if child is MeshInstance3D and "-col" in child.name:
            child.create_convex_collision()
        _setup_collisions(child)

func _setup_animations(node: Node) -> void:
    var anim_player = node.get_node_or_null("AnimationPlayer")
    if anim_player:
        for anim_name in anim_player.get_animation_list():
            var anim = anim_player.get_animation(anim_name)
            if "-loop" in anim_name or "idle" in anim_name.to_lower():
                anim.loop_mode = Animation.LOOP_LINEAR
```

## Jolt Physics (4.6 Default)

### Automatic Collision Generation

Godot 4.6 simplifies collision shape creation for primitives:

```gdscript
# Automatic collision for CSG and primitives
var box = CSGBox3D.new()
box.size = Vector3(2, 1, 2)
box.use_collision = true  # Auto-generates BoxShape3D

var sphere = CSGSphere3D.new()
sphere.radius = 1.0
sphere.use_collision = true  # Auto-generates SphereShape3D

var cylinder = CSGCylinder3D.new()
cylinder.use_collision = true  # Auto-generates CylinderShape3D
```

### Collision Shape Generation

```gdscript
extends MeshInstance3D

func setup_collision(type: String = "convex") -> void:
    match type:
        "convex":
            # Single convex hull - fast but approximate
            create_convex_collision()

        "multiple_convex":
            # Multiple convex shapes - better fit for complex meshes
            create_multiple_convex_collisions()

        "trimesh":
            # Exact triangle mesh - slow, static only
            create_trimesh_collision()

        "simple":
            # Simple primitive shape based on AABB
            var static_body = StaticBody3D.new()
            var collision = CollisionShape3D.new()
            var box = BoxShape3D.new()
            box.size = mesh.get_aabb().size
            collision.shape = box
            static_body.add_child(collision)
            add_child(static_body)

# Note: create_convex_collision() and create_multiple_convex_collisions()
# are built-in MeshInstance3D methods that handle StaticBody3D creation
```

### Physics Materials

```gdscript
# Create physics material for Jolt
var physics_mat = PhysicsMaterial.new()
physics_mat.friction = 0.8
physics_mat.bounce = 0.2

# Apply to collision shape
$StaticBody3D/CollisionShape3D.physics_material_override = physics_mat

# Or via resource
# res://materials/physics/ice.tres
@export var physics_material: PhysicsMaterial
```

## Material Setup

### StandardMaterial3D Configuration

```gdscript
func create_pbr_material(
    albedo_path: String,
    normal_path: String = "",
    orm_path: String = ""  # Occlusion, Roughness, Metallic
) -> StandardMaterial3D:
    var mat = StandardMaterial3D.new()

    # Albedo
    mat.albedo_texture = load(albedo_path)

    # Normal map
    if normal_path:
        mat.normal_enabled = true
        mat.normal_texture = load(normal_path)
        mat.normal_scale = 1.0

    # ORM texture (packed)
    if orm_path:
        var orm = load(orm_path)
        mat.ao_enabled = true
        mat.ao_texture = orm
        mat.ao_texture_channel = BaseMaterial3D.TEXTURE_CHANNEL_RED

        mat.roughness_texture = orm
        mat.roughness_texture_channel = BaseMaterial3D.TEXTURE_CHANNEL_GREEN

        mat.metallic_texture = orm
        mat.metallic_texture_channel = BaseMaterial3D.TEXTURE_CHANNEL_BLUE

    return mat
```

### Texture Import Settings

```ini
# For albedo/diffuse
[params]
compress/mode=2  # VRAM Compressed
compress/high_quality=true
mipmaps/generate=true
mipmaps/limit=-1

# For normal maps
[params]
compress/mode=2
compress/high_quality=true
compress/normal_map=1  # Optimize for normal
mipmaps/generate=true
roughness/mode=0
roughness/src_normal=""

# For UI/pixel art
[params]
compress/mode=0  # Lossless
mipmaps/generate=false
process/fix_alpha_border=true
```

## LOD System

### Automatic LOD Generation

```gdscript
# Enable in import settings or configure manually
func setup_lods(mesh_instance: MeshInstance3D) -> void:
    mesh_instance.lod_bias = 1.0  # Adjust LOD distance

    # Manual LOD setup
    var lod_group = VisibleOnScreenNotifier3D.new()
    mesh_instance.add_child(lod_group)

# Or use MeshInstance3D's built-in LOD
var mesh = mesh_instance.mesh
if mesh is ArrayMesh:
    mesh.generate_lods(25.0, 0.7)  # Normal merge angle, screen coverage
```

### HLOD (Hierarchical LOD)

```gdscript
# For large environments
extends Node3D

@export var hlod_distance: float = 100.0
@export var combined_mesh: Mesh

var original_children: Array[Node3D] = []
var hlod_instance: MeshInstance3D

func _ready() -> void:
    # Cache children
    for child in get_children():
        if child is MeshInstance3D:
            original_children.append(child)

    # Create HLOD mesh
    hlod_instance = MeshInstance3D.new()
    hlod_instance.mesh = combined_mesh
    hlod_instance.visible = false
    add_child(hlod_instance)

func _process(delta: float) -> void:
    var camera = get_viewport().get_camera_3d()
    var distance = global_position.distance_to(camera.global_position)

    var use_hlod = distance > hlod_distance
    hlod_instance.visible = use_hlod

    for child in original_children:
        child.visible = not use_hlod
```

## Asset Validation

```gdscript
@tool
extends EditorScript

func _run() -> void:
    validate_assets("res://assets/models/")

func validate_assets(path: String) -> void:
    var dir = DirAccess.open(path)
    if not dir:
        push_error("Cannot open: " + path)
        return

    dir.list_dir_begin()
    var file_name = dir.get_next()

    while file_name:
        if not dir.current_is_dir() and file_name.ends_with(".glb"):
            validate_model(path + file_name)
        elif dir.current_is_dir() and file_name != "." and file_name != "..":
            validate_assets(path + file_name + "/")
        file_name = dir.get_next()

func validate_model(model_path: String) -> void:
    var scene = load(model_path)
    if not scene:
        push_warning("Failed to load: " + model_path)
        return

    var instance = scene.instantiate()
    var issues: Array[String] = []

    # Check mesh complexity
    for node in _get_all_nodes(instance):
        if node is MeshInstance3D:
            var mesh = node.mesh
            if mesh:
                var vertex_count = 0
                for i in mesh.get_surface_count():
                    var arrays = mesh.surface_get_arrays(i)
                    vertex_count += arrays[Mesh.ARRAY_VERTEX].size()

                if vertex_count > 50000:
                    issues.append("High vertex count: %d in %s" % [vertex_count, node.name])

                # Check materials
                for i in mesh.get_surface_count():
                    var mat = mesh.surface_get_material(i)
                    if not mat:
                        issues.append("Missing material on surface %d of %s" % [i, node.name])

    if issues:
        print("Issues in %s:" % model_path)
        for issue in issues:
            print("  - " + issue)

    instance.queue_free()

func _get_all_nodes(node: Node) -> Array[Node]:
    var nodes: Array[Node] = [node]
    for child in node.get_children():
        nodes.append_array(_get_all_nodes(child))
    return nodes
```

## Additional Resources

For asset pipeline templates, see the plugin's `templates/blender-pipeline/` directory.
