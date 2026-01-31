---
name: godot-fsm
description: Generate a Finite State Machine implementation for Godot 4.6
argument-hint: "[language: gdscript|csharp] [name] [states...]"
allowed-tools:
  - Write
  - Read
  - Glob
---

# State Machine Generator

Generate production-ready Finite State Machine implementation for Godot 4.6 in GDScript or C#.

## Arguments

Parse the user's arguments:
- `language`: Target language (gdscript or csharp) - default: gdscript
- `name`: Base name for the state machine (e.g., "Player", "Enemy")
- `states`: List of state names (e.g., "idle walk run jump attack")

If states are not provided, use default: idle, walk, run

## Execution

1. **Determine project root** by finding `project.godot`:
   ```bash
   find . -name "project.godot" -type f 2>/dev/null | head -1
   ```

2. **Create files based on language**:

### GDScript Output

Create the following files:

**scripts/state_machine/state.gd** - Base State class:
```gdscript
class_name State
extends Node

var state_machine: StateMachine

func enter() -> void:
    pass

func exit() -> void:
    pass

func update(delta: float) -> void:
    pass

func physics_update(delta: float) -> void:
    pass

func handle_input(event: InputEvent) -> void:
    pass
```

**scripts/state_machine/state_machine.gd** - StateMachine class:
```gdscript
class_name StateMachine
extends Node

@export var initial_state: State

var current_state: State
var states: Dictionary = {}

func _ready() -> void:
    for child in get_children():
        if child is State:
            states[child.name.to_lower()] = child
            child.state_machine = self

    if initial_state:
        current_state = initial_state
        current_state.enter()

func _process(delta: float) -> void:
    if current_state:
        current_state.update(delta)

func _physics_process(delta: float) -> void:
    if current_state:
        current_state.physics_update(delta)

func _unhandled_input(event: InputEvent) -> void:
    if current_state:
        current_state.handle_input(event)

func transition_to(state_name: String) -> void:
    var new_state: State = states.get(state_name.to_lower())
    if not new_state:
        push_error("State not found: " + state_name)
        return

    if current_state:
        current_state.exit()

    current_state = new_state
    current_state.enter()

func get_current_state_name() -> String:
    return current_state.name if current_state else ""
```

**scripts/state_machine/{name}_{state}.gd** - For each state:
```gdscript
class_name {Name}{State}
extends State

@onready var entity: CharacterBody3D = owner

func enter() -> void:
    print("Entering {State} state")
    # TODO: Add enter logic

func exit() -> void:
    print("Exiting {State} state")
    # TODO: Add exit logic

func physics_update(delta: float) -> void:
    # TODO: Add state logic
    # Example transition:
    # if some_condition:
    #     state_machine.transition_to("other_state")
    pass

func handle_input(event: InputEvent) -> void:
    # TODO: Handle input specific to this state
    pass
```

### C# Output

Create the following files:

**scripts/StateMachine/State.cs**:
```csharp
using Godot;

public partial class State : Node
{
    protected StateMachine StateMachine { get; set; }

    public virtual void Enter() { }
    public virtual void Exit() { }
    public virtual void Update(double delta) { }
    public virtual void PhysicsUpdate(double delta) { }
    public virtual void HandleInput(InputEvent @event) { }

    public void Initialize(StateMachine stateMachine)
    {
        StateMachine = stateMachine;
    }
}
```

**scripts/StateMachine/StateMachine.cs**:
```csharp
using Godot;
using System.Collections.Generic;

public partial class StateMachine : Node
{
    [Export]
    public State InitialState { get; set; }

    private State _currentState;
    private Dictionary<string, State> _states = new();

    public override void _Ready()
    {
        foreach (var child in GetChildren())
        {
            if (child is State state)
            {
                _states[state.Name.ToLower()] = state;
                state.Initialize(this);
            }
        }

        if (InitialState != null)
        {
            _currentState = InitialState;
            _currentState.Enter();
        }
    }

    public override void _Process(double delta)
    {
        _currentState?.Update(delta);
    }

    public override void _PhysicsProcess(double delta)
    {
        _currentState?.PhysicsUpdate(delta);
    }

    public override void _UnhandledInput(InputEvent @event)
    {
        _currentState?.HandleInput(@event);
    }

    public void TransitionTo(string stateName)
    {
        if (!_states.TryGetValue(stateName.ToLower(), out var newState))
        {
            GD.PushError($"State not found: {stateName}");
            return;
        }

        _currentState?.Exit();
        _currentState = newState;
        _currentState.Enter();
    }

    public string GetCurrentStateName() => _currentState?.Name ?? "";
}
```

**scripts/StateMachine/{Name}{State}State.cs** - For each state:
```csharp
using Godot;

public partial class {Name}{State}State : State
{
    private CharacterBody3D _entity;

    public override void _Ready()
    {
        _entity = Owner as CharacterBody3D;
    }

    public override void Enter()
    {
        GD.Print("Entering {State} state");
        // TODO: Add enter logic
    }

    public override void Exit()
    {
        GD.Print("Exiting {State} state");
        // TODO: Add exit logic
    }

    public override void PhysicsUpdate(double delta)
    {
        // TODO: Add state logic
        // Example transition:
        // if (someCondition)
        //     StateMachine.TransitionTo("other_state");
    }

    public override void HandleInput(InputEvent @event)
    {
        // TODO: Handle input specific to this state
    }
}
```

## Output

After creation, report:
- Files created
- Scene structure recommendation:
```
{Name}
└── StateMachine
    ├── Idle
    ├── Walk
    ├── Run
    └── ...
```
- Next steps for implementation

## Example Usage

```
/godot-fsm gdscript Player idle walk run jump attack
```

Creates:
- `scripts/state_machine/state.gd`
- `scripts/state_machine/state_machine.gd`
- `scripts/state_machine/player_idle.gd`
- `scripts/state_machine/player_walk.gd`
- `scripts/state_machine/player_run.gd`
- `scripts/state_machine/player_jump.gd`
- `scripts/state_machine/player_attack.gd`
