---
name: Godot Shaders 4.6
description: This skill should be used when the user asks about "Godot shader", "shader_type", "GLSL", "VisualShader", "SSR", "screen space reflection", "PBR shader", "toon shader", "post-process", "uniform", "varying", "fragment shader", "vertex shader", "render_mode", or needs guidance on writing shaders in Godot 4.6 with improved SSR support.
---

# Godot Shaders (4.x)

Godot uses a GLSL-like shading language with built-in support for spatial (3D), canvas_item (2D), particles, sky, and fog shaders. Godot 4.6 features significantly improved Screen Space Reflection (SSR) with full and half-resolution modes.

## Shader Types

```glsl
// 3D objects
shader_type spatial;

// 2D sprites and UI
shader_type canvas_item;

// GPU particles
shader_type particles;

// Sky rendering
shader_type sky;

// Volumetric fog
shader_type fog;
```

## Spatial Shaders (3D)

### Basic PBR Shader

```glsl
shader_type spatial;
render_mode blend_mix, depth_draw_opaque, cull_back, diffuse_burley, specular_schlick_ggx;

uniform vec4 albedo_color : source_color = vec4(1.0);
uniform sampler2D albedo_texture : source_color, filter_linear_mipmap, repeat_enable;
uniform float metallic : hint_range(0.0, 1.0) = 0.0;
uniform float roughness : hint_range(0.0, 1.0) = 0.5;
uniform sampler2D normal_map : hint_normal, filter_linear_mipmap, repeat_enable;
uniform float normal_strength : hint_range(0.0, 2.0) = 1.0;

void fragment() {
    vec4 albedo_tex = texture(albedo_texture, UV);
    ALBEDO = albedo_color.rgb * albedo_tex.rgb;
    METALLIC = metallic;
    ROUGHNESS = roughness;

    NORMAL_MAP = texture(normal_map, UV).rgb;
    NORMAL_MAP_DEPTH = normal_strength;
}
```

### Toon/Cel Shader

```glsl
shader_type spatial;
render_mode diffuse_toon, specular_toon;

uniform vec4 base_color : source_color = vec4(1.0);
uniform vec4 shadow_color : source_color = vec4(0.3, 0.3, 0.4, 1.0);
uniform float shadow_threshold : hint_range(0.0, 1.0) = 0.5;
uniform float shadow_smoothness : hint_range(0.0, 0.5) = 0.05;
uniform float rim_amount : hint_range(0.0, 1.0) = 0.5;
uniform vec4 rim_color : source_color = vec4(1.0);

void fragment() {
    ALBEDO = base_color.rgb;
    ROUGHNESS = 1.0;
    METALLIC = 0.0;
}

void light() {
    // Toon shading
    float NdotL = dot(NORMAL, LIGHT);
    float toon = smoothstep(shadow_threshold - shadow_smoothness,
                           shadow_threshold + shadow_smoothness, NdotL);

    vec3 diffuse = mix(shadow_color.rgb, ALBEDO, toon);

    // Rim lighting
    float rim = 1.0 - dot(NORMAL, VIEW);
    rim = pow(rim, 3.0) * rim_amount;

    DIFFUSE_LIGHT += diffuse * LIGHT_COLOR * ATTENUATION;
    DIFFUSE_LIGHT += rim_color.rgb * rim * LIGHT_COLOR * ATTENUATION;
}
```

### Dissolve Effect

```glsl
shader_type spatial;
render_mode blend_mix, cull_disabled;

uniform sampler2D noise_texture : filter_linear_mipmap;
uniform float dissolve_amount : hint_range(0.0, 1.0) = 0.0;
uniform float edge_width : hint_range(0.0, 0.2) = 0.05;
uniform vec4 edge_color : source_color = vec4(1.0, 0.5, 0.0, 1.0);
uniform vec4 albedo_color : source_color = vec4(1.0);

void fragment() {
    float noise = texture(noise_texture, UV).r;

    // Discard dissolved pixels
    if (noise < dissolve_amount) {
        discard;
    }

    // Edge glow
    float edge = smoothstep(dissolve_amount, dissolve_amount + edge_width, noise);
    vec3 final_color = mix(edge_color.rgb, albedo_color.rgb, edge);

    ALBEDO = final_color;
    EMISSION = (1.0 - edge) * edge_color.rgb * 2.0;
}
```

### Screen Space Reflection (SSR) - 4.6 Improved

```glsl
// SSR is now improved in Godot 4.6 with full and half-resolution modes
// Configure in WorldEnvironment or Camera3D

shader_type spatial;
render_mode specular_schlick_ggx;

uniform float roughness : hint_range(0.0, 1.0) = 0.1;
uniform float metallic : hint_range(0.0, 1.0) = 0.9;
uniform vec4 base_color : source_color = vec4(0.8, 0.8, 0.9, 1.0);

void fragment() {
    ALBEDO = base_color.rgb;
    METALLIC = metallic;
    ROUGHNESS = roughness;

    // SSR quality is controlled by environment settings:
    // - ssr_enabled = true
    // - ssr_max_steps = 64 (higher = better quality)
    // - ssr_fade_in/out = smooth transitions
    // - ssr_depth_tolerance = artifact control
}
```

## Canvas Item Shaders (2D)

### Blur Effect

```glsl
shader_type canvas_item;

uniform float blur_amount : hint_range(0.0, 10.0) = 2.0;
uniform int samples : hint_range(1, 20) = 10;

void fragment() {
    vec2 pixel_size = TEXTURE_PIXEL_SIZE;
    vec4 color = vec4(0.0);
    float total_weight = 0.0;

    for (int x = -samples; x <= samples; x++) {
        for (int y = -samples; y <= samples; y++) {
            vec2 offset = vec2(float(x), float(y)) * pixel_size * blur_amount;
            float weight = 1.0 / (1.0 + length(vec2(x, y)));
            color += texture(TEXTURE, UV + offset) * weight;
            total_weight += weight;
        }
    }

    COLOR = color / total_weight;
}
```

### Outline Effect

```glsl
shader_type canvas_item;

uniform vec4 outline_color : source_color = vec4(0.0, 0.0, 0.0, 1.0);
uniform float outline_width : hint_range(0.0, 10.0) = 2.0;

void fragment() {
    vec2 size = TEXTURE_PIXEL_SIZE * outline_width;
    float outline = texture(TEXTURE, UV + vec2(-size.x, 0)).a;
    outline += texture(TEXTURE, UV + vec2(size.x, 0)).a;
    outline += texture(TEXTURE, UV + vec2(0, -size.y)).a;
    outline += texture(TEXTURE, UV + vec2(0, size.y)).a;
    outline += texture(TEXTURE, UV + vec2(-size.x, -size.y)).a;
    outline += texture(TEXTURE, UV + vec2(size.x, -size.y)).a;
    outline += texture(TEXTURE, UV + vec2(-size.x, size.y)).a;
    outline += texture(TEXTURE, UV + vec2(size.x, size.y)).a;
    outline = min(outline, 1.0);

    vec4 tex_color = texture(TEXTURE, UV);
    COLOR = mix(outline_color * outline, tex_color, tex_color.a);
}
```

### Chromatic Aberration

```glsl
shader_type canvas_item;

uniform float aberration_amount : hint_range(0.0, 0.1) = 0.01;
uniform vec2 aberration_direction = vec2(1.0, 0.0);

void fragment() {
    vec2 offset = aberration_amount * aberration_direction;

    float r = texture(TEXTURE, UV + offset).r;
    float g = texture(TEXTURE, UV).g;
    float b = texture(TEXTURE, UV - offset).b;
    float a = texture(TEXTURE, UV).a;

    COLOR = vec4(r, g, b, a);
}
```

## Particle Shaders

### Custom Particle Behavior

```glsl
shader_type particles;

uniform float spread : hint_range(0.0, 180.0) = 45.0;
uniform float initial_speed : hint_range(0.0, 100.0) = 10.0;
uniform float gravity : hint_range(-50.0, 50.0) = 9.8;
uniform sampler2D color_ramp : source_color;

void start() {
    // Initial velocity with spread using RANDOM_SEED
    float angle = radians(spread) * (hash(float(RANDOM_SEED)) - 0.5);
    vec3 direction = vec3(sin(angle), cos(angle), 0.0);
    VELOCITY = direction * initial_speed;

    // Random rotation
    TRANSFORM[0].xyz = vec3(1.0, 0.0, 0.0);
    TRANSFORM[1].xyz = vec3(0.0, 1.0, 0.0);
    TRANSFORM[2].xyz = vec3(0.0, 0.0, 1.0);
}

void process() {
    // Apply gravity
    VELOCITY.y -= gravity * DELTA;

    // Normalized lifetime progress (0 at start, 1 at end)
    float life_progress = 1.0 - LIFETIME;

    // Color over lifetime
    COLOR = texture(color_ramp, vec2(life_progress, 0.0));

    // Scale over lifetime (shrink toward end)
    float scale = 1.0 - life_progress * 0.5;
    TRANSFORM[0].x = scale;
    TRANSFORM[1].y = scale;
    TRANSFORM[2].z = scale;
}
```

## Post-Processing

### Full Screen Effects (via SubViewport)

```glsl
// Apply via ColorRect in CanvasLayer with SubViewport texture
shader_type canvas_item;

uniform sampler2D screen_texture : hint_screen_texture, filter_linear_mipmap;
uniform float vignette_strength : hint_range(0.0, 1.0) = 0.4;
uniform float saturation : hint_range(0.0, 2.0) = 1.0;
uniform float contrast : hint_range(0.0, 2.0) = 1.0;

void fragment() {
    vec4 color = texture(screen_texture, SCREEN_UV);

    // Saturation
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    color.rgb = mix(vec3(gray), color.rgb, saturation);

    // Contrast
    color.rgb = (color.rgb - 0.5) * contrast + 0.5;

    // Vignette
    vec2 uv = SCREEN_UV * 2.0 - 1.0;
    float vignette = 1.0 - dot(uv, uv) * vignette_strength;
    color.rgb *= vignette;

    COLOR = color;
}
```

## Uniforms Reference

### Hint Types

```glsl
// Colors
uniform vec4 color : source_color;  // sRGB color picker

// Textures
uniform sampler2D tex : source_color;  // sRGB texture
uniform sampler2D tex : hint_normal;   // Normal map
uniform sampler2D tex : hint_roughness; // Roughness map
uniform sampler2D tex : hint_default_white; // Default white
uniform sampler2D tex : hint_default_black; // Default black

// Ranges
uniform float val : hint_range(0.0, 1.0);
uniform float val : hint_range(0.0, 100.0, 0.1); // With step

// Screen textures (post-processing)
uniform sampler2D screen : hint_screen_texture;
uniform sampler2D depth : hint_depth_texture;
uniform sampler2D normal : hint_normal_roughness_texture;

// Texture filtering
uniform sampler2D tex : filter_nearest;
uniform sampler2D tex : filter_linear;
uniform sampler2D tex : filter_linear_mipmap;
uniform sampler2D tex : filter_linear_mipmap_anisotropic;

// Texture repeat
uniform sampler2D tex : repeat_enable;
uniform sampler2D tex : repeat_disable;
```

### Built-in Variables

```glsl
// Vertex shader
VERTEX      // Local vertex position
NORMAL      // Vertex normal
UV          // UV coordinates
UV2         // Secondary UV
COLOR       // Vertex color
MODELVIEW_MATRIX
PROJECTION_MATRIX
TIME        // Shader time

// Fragment shader
FRAGCOORD   // Screen position
UV          // Interpolated UV
NORMAL      // Interpolated normal
ALBEDO      // Output: base color
METALLIC    // Output: metallic
ROUGHNESS   // Output: roughness
EMISSION    // Output: emission
ALPHA       // Output: transparency
NORMAL_MAP  // Output: normal map
```

## Additional Resources

For shader templates and collections, see the plugin's `templates/shader-library/` directory.
