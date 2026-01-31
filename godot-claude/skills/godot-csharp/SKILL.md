---
name: Godot C# Integration
description: This skill should be used when the user asks about "Godot C#", "C# in Godot", "GodotSharp", ".NET Godot", "partial class", "[Signal]", "EventHandler", "[Export]", "GetNode<T>", "async Task", "ToSignal", "Source Generator", "Translation Analyzer", or needs guidance on C# scripting in Godot 4.x, async patterns, signals in C#, and .NET integration.
---

# Godot C# Integration (4.x)

Godot 4.6 provides robust C# support via .NET 8, with improved Source Generators, Translation Analyzer for catching common mistakes, and seamless async/await integration.

## Core Syntax

### Node Scripts

```csharp
using Godot;

public partial class Player : CharacterBody3D
{
    [Export] public float Speed { get; set; } = 5.0f;
    [Export] public float JumpVelocity { get; set; } = 4.5f;

    private AnimationPlayer _animPlayer;
    private Sprite3D _sprite;

    public override void _Ready()
    {
        _animPlayer = GetNode<AnimationPlayer>("AnimationPlayer");
        _sprite = GetNode<Sprite3D>("Sprite3D");
    }

    public override void _PhysicsProcess(double delta)
    {
        Vector3 velocity = Velocity;

        if (!IsOnFloor())
            velocity.Y -= 9.8f * (float)delta;

        if (Input.IsActionJustPressed("jump") && IsOnFloor())
            velocity.Y = JumpVelocity;

        Vector2 inputDir = Input.GetVector("left", "right", "forward", "back");
        Vector3 direction = (Transform.Basis * new Vector3(inputDir.X, 0, inputDir.Y)).Normalized();

        if (direction != Vector3.Zero)
        {
            velocity.X = direction.X * Speed;
            velocity.Z = direction.Z * Speed;
        }
        else
        {
            velocity.X = Mathf.MoveToward(Velocity.X, 0, Speed);
            velocity.Z = Mathf.MoveToward(Velocity.Z, 0, Speed);
        }

        Velocity = velocity;
        MoveAndSlide();
    }
}
```

### Export Attributes

```csharp
public partial class Enemy : CharacterBody3D
{
    // Basic exports
    [Export] public int MaxHealth { get; set; } = 100;
    [Export] public float MoveSpeed { get; set; } = 3.0f;
    [Export] public string EnemyName { get; set; } = "Goblin";

    // Range exports
    [Export(PropertyHint.Range, "0,100,1")]
    public int Health { get; set; } = 100;

    [Export(PropertyHint.Range, "0.1,10.0,0.1")]
    public float AttackSpeed { get; set; } = 1.0f;

    // Enum exports
    [Export] public EnemyType Type { get; set; } = EnemyType.Melee;

    // Resource exports
    [Export] public PackedScene ProjectileScene { get; set; }
    [Export] public Texture2D Icon { get; set; }

    // File paths
    [Export(PropertyHint.File, "*.json")]
    public string ConfigPath { get; set; }

    // Export groups
    [ExportGroup("Combat")]
    [Export] public int Damage { get; set; } = 10;
    [Export] public float AttackRange { get; set; } = 2.0f;

    [ExportSubgroup("Resistances")]
    [Export] public float FireResist { get; set; } = 0.0f;
    [Export] public float IceResist { get; set; } = 0.0f;

    // Flags
    [Export(PropertyHint.Flags, "Fire,Ice,Lightning,Poison")]
    public int Immunities { get; set; }
}

public enum EnemyType { Melee, Ranged, Flying, Boss }
```

### Signals

```csharp
public partial class HealthComponent : Node
{
    // Signal declaration (Source Generator creates emit method)
    [Signal] public delegate void HealthChangedEventHandler(int newHealth);
    [Signal] public delegate void DiedEventHandler();
    [Signal] public delegate void DamageTakenEventHandler(int amount, Node source);

    private int _health = 100;

    public int Health
    {
        get => _health;
        set
        {
            int oldHealth = _health;
            _health = Mathf.Clamp(value, 0, MaxHealth);

            if (_health != oldHealth)
                EmitSignal(SignalName.HealthChanged, _health);

            if (_health <= 0 && oldHealth > 0)
                EmitSignal(SignalName.Died);
        }
    }

    [Export] public int MaxHealth { get; set; } = 100;

    public void TakeDamage(int amount, Node source = null)
    {
        EmitSignal(SignalName.DamageTaken, amount, source);
        Health -= amount;
    }
}

// Connecting signals
public partial class Player : CharacterBody3D
{
    private HealthComponent _health;

    public override void _Ready()
    {
        _health = GetNode<HealthComponent>("HealthComponent");

        // Method 1: Connect with method name
        _health.HealthChanged += OnHealthChanged;
        _health.Died += OnDied;

        // Method 2: Lambda
        _health.DamageTaken += (amount, source) =>
            GD.Print($"Took {amount} damage from {source?.Name ?? "unknown"}");
    }

    private void OnHealthChanged(int newHealth)
    {
        GD.Print($"Health: {newHealth}");
    }

    private void OnDied()
    {
        QueueFree();
    }
}
```

### Async/Await Patterns

```csharp
public partial class GameManager : Node
{
    // Awaiting signals
    public async Task ShowDialogAsync(string text)
    {
        var dialog = GetNode<Control>("DialogBox");
        dialog.GetNode<Label>("Text").Text = text;
        dialog.Show();

        await ToSignal(dialog, "closed");
        dialog.Hide();
    }

    // Awaiting timers
    public async Task FlashDamageAsync()
    {
        Modulate = Colors.Red;
        await ToSignal(GetTree().CreateTimer(0.1), SceneTreeTimer.SignalName.Timeout);
        Modulate = Colors.White;
    }

    // Awaiting tweens
    public async Task MoveToAsync(Vector3 target, float duration = 1.0f)
    {
        var tween = CreateTween();
        tween.TweenProperty(this, "position", target, duration);
        await ToSignal(tween, Tween.SignalName.Finished);
    }

    // Complex async flow
    public async Task PlayCutsceneAsync()
    {
        await FadeOutAsync();
        await LoadSceneAsync("res://scenes/next_level.tscn");
        await FadeInAsync();
    }

    // Parallel async operations
    public async Task LoadResourcesAsync()
    {
        var tasks = new[]
        {
            LoadTextureAsync("res://textures/player.png"),
            LoadAudioAsync("res://audio/music.ogg"),
            LoadSceneAsync("res://scenes/enemy.tscn")
        };

        await Task.WhenAll(tasks);
    }
}
```

### Translation Analyzer (4.6)

The Translation Analyzer catches signal and method name mistakes at compile time:

```csharp
// ERROR: Translation Analyzer catches wrong signal name in Callable
_health.Connect("health_changed", new Callable(this, "OnHealthChanged"));
// CORRECT: Use SignalName constants (generated by Source Generator)
_health.Connect(HealthComponent.SignalName.HealthChanged, new Callable(this, MethodName.OnHealthChanged));

// ERROR: Wrong method name in Callable - typo caught at compile time
new Callable(this, "OnHealthChagned");  // Typo detected!
// CORRECT: Use MethodName constants
new Callable(this, MethodName.OnHealthChanged);

// NOTE: Node paths are resolved at runtime, not compile time
// Use GetNodeOrNull for optional nodes:
var player = GetNodeOrNull<Player>("Player");
if (player != null) { /* use player */ }
```

## Resource Classes

```csharp
// Define custom resource
[GlobalClass]  // Makes it visible in editor
public partial class WeaponData : Resource
{
    [Export] public string Name { get; set; } = "";
    [Export] public int Damage { get; set; } = 10;
    [Export] public float AttackSpeed { get; set; } = 1.0f;
    [Export] public Texture2D Icon { get; set; }
    [Export(PropertyHint.MultilineText)] public string Description { get; set; } = "";

    // Calculated properties
    public float DPS => Damage * AttackSpeed;
}

// Using resources
public partial class Weapon : Node3D
{
    [Export] public WeaponData Data { get; set; }

    public void Attack(Node target)
    {
        if (target is IDamageable damageable)
        {
            damageable.TakeDamage(Data.Damage);
        }
    }
}
```

## Interfaces and Composition

```csharp
// Interfaces for game systems
public interface IDamageable
{
    void TakeDamage(int amount, Node source = null);
    int Health { get; }
    bool IsDead { get; }
}

public interface IInteractable
{
    void Interact(Node interactor);
    string GetInteractionPrompt();
}

public interface ISaveable
{
    Dictionary<string, Variant> Save();
    void Load(Dictionary<string, Variant> data);
}

// Implementation
public partial class Chest : StaticBody3D, IInteractable, ISaveable
{
    [Export] public PackedScene[] LootTable { get; set; }
    private bool _opened = false;

    public void Interact(Node interactor)
    {
        if (_opened) return;
        _opened = true;
        SpawnLoot();
        GetNode<AnimationPlayer>("AnimationPlayer").Play("open");
    }

    public string GetInteractionPrompt() => _opened ? "" : "Press E to open";

    public Dictionary<string, Variant> Save() => new()
    {
        ["opened"] = _opened,
        ["position"] = GlobalPosition
    };

    public void Load(Dictionary<string, Variant> data)
    {
        _opened = data["opened"].AsBool();
        GlobalPosition = data["position"].AsVector3();
    }
}
```

## Autoload Singletons

```csharp
// Add to Project Settings > AutoLoad
public partial class GameEvents : Node
{
    public static GameEvents Instance { get; private set; }

    [Signal] public delegate void PlayerDiedEventHandler();
    [Signal] public delegate void EnemyKilledEventHandler(Node enemy);
    [Signal] public delegate void ScoreChangedEventHandler(int newScore);
    [Signal] public delegate void LevelCompletedEventHandler(int levelId);

    public override void _Ready()
    {
        Instance = this;
    }

    // Helper methods for cleaner emission
    public void NotifyPlayerDied() => EmitSignal(SignalName.PlayerDied);
    public void NotifyEnemyKilled(Node enemy) => EmitSignal(SignalName.EnemyKilled, enemy);
}

// Usage anywhere
public partial class Enemy : CharacterBody3D
{
    private void Die()
    {
        GameEvents.Instance.NotifyEnemyKilled(this);
        QueueFree();
    }
}
```

## Performance Patterns

### Object Pooling

```csharp
public partial class ObjectPool<T> : Node where T : Node
{
    [Export] public PackedScene Prefab { get; set; }
    [Export] public int InitialSize { get; set; } = 20;

    private readonly Queue<T> _available = new();

    public override void _Ready()
    {
        for (int i = 0; i < InitialSize; i++)
        {
            var obj = CreateInstance();
            _available.Enqueue(obj);
        }
    }

    private T CreateInstance()
    {
        var obj = Prefab.Instantiate<T>();
        obj.ProcessMode = ProcessModeEnum.Disabled;
        AddChild(obj);
        return obj;
    }

    public T Get()
    {
        var obj = _available.Count > 0 ? _available.Dequeue() : CreateInstance();
        obj.ProcessMode = ProcessModeEnum.Inherit;
        return obj;
    }

    public void Return(T obj)
    {
        obj.ProcessMode = ProcessModeEnum.Disabled;
        _available.Enqueue(obj);
    }
}
```

### Struct-based Components

```csharp
// Use structs for value-type data to reduce GC pressure
public struct DamageInfo
{
    public int Amount;
    public DamageType Type;
    public Vector3 Direction;
    public Node Source;
}

public enum DamageType { Physical, Fire, Ice, Lightning }
```

## Additional Resources

For general project templates (multiplayer, XR, etc.), see the plugin's `templates/` directory. C# works with all templates.
