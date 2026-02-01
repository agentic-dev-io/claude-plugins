---
name: Godot Testing
description: This skill should be used when the user asks about "testing", "unit test", "GUT", "gdUnit", "test framework", "TDD", "test driven", "integration test", "mock", "stub", "assertion", "test coverage", "automated testing", "CI testing", "test runner", or needs guidance on testing Godot 4.x projects.
---

# Godot 4.6 Testing

This skill covers testing strategies for Godot projects, including unit testing with GUT, integration testing, and CI/CD setup.

## GUT (Godot Unit Test)

### Installation

```bash
# Clone into addons folder
git clone https://github.com/bitwes/Gut.git addons/gut

# Or via AssetLib in Godot Editor
```

Enable in Project Settings > Plugins

### Basic Test Structure

```gdscript
# test/unit/test_health_component.gd
extends GutTest

var _health: HealthComponent


func before_each() -> void:
    _health = HealthComponent.new()
    _health.max_health = 100
    add_child_autofree(_health)  # Auto cleanup after test


func after_each() -> void:
    # Cleanup if needed (autofree handles most cases)
    pass


func test_initial_health() -> void:
    assert_eq(_health.current_health, 100, "Health should start at max")


func test_take_damage() -> void:
    _health.take_damage(30)
    assert_eq(_health.current_health, 70, "Health should be reduced by damage")


func test_take_damage_does_not_go_negative() -> void:
    _health.take_damage(150)
    assert_eq(_health.current_health, 0, "Health should not go below 0")


func test_heal() -> void:
    _health.take_damage(50)
    _health.heal(20)
    assert_eq(_health.current_health, 70, "Heal should increase health")


func test_heal_does_not_exceed_max() -> void:
    _health.take_damage(20)
    _health.heal(50)
    assert_eq(_health.current_health, 100, "Heal should not exceed max health")


func test_died_signal_emitted() -> void:
    watch_signals(_health)
    _health.take_damage(100)
    assert_signal_emitted(_health, "died")


func test_health_changed_signal() -> void:
    watch_signals(_health)
    _health.take_damage(25)
    assert_signal_emitted_with_parameters(_health, "health_changed", [75, 100])
```

### Test Organization

```
project/
├── test/
│   ├── unit/           # Unit tests
│   │   ├── test_health_component.gd
│   │   ├── test_inventory.gd
│   │   └── test_state_machine.gd
│   ├── integration/    # Integration tests
│   │   ├── test_combat_system.gd
│   │   └── test_save_load.gd
│   └── resources/      # Test fixtures
│       └── test_data.tres
└── .gutconfig.json     # GUT configuration
```

### GUT Configuration

```json
// .gutconfig.json
{
    "dirs": ["res://test/unit", "res://test/integration"],
    "double_strategy": "partial",
    "include_subdirs": true,
    "inner_class_name": "",
    "log_level": 1,
    "opacity": 100,
    "prefix": "test_",
    "selected": "",
    "should_exit": true,
    "should_exit_on_success": false,
    "should_maximize": false,
    "suffix": ".gd",
    "tests": []
}
```

### Running Tests

```bash
# Run all tests from command line
godot --headless -s addons/gut/gut_cmdln.gd

# Run specific test file
godot --headless -s addons/gut/gut_cmdln.gd -gtest=res://test/unit/test_health_component.gd

# Run tests matching pattern
godot --headless -s addons/gut/gut_cmdln.gd -ginclude_subdirs -gdir=res://test

# Run in editor: open GUT panel and click Run
```

## Common Test Patterns

### Testing Signals

```gdscript
func test_player_death_emits_signal() -> void:
    var player := Player.new()
    add_child_autofree(player)

    watch_signals(player)
    player.health = 0

    assert_signal_emitted(player, "died")
    assert_signal_emit_count(player, "died", 1)


func test_signal_parameters() -> void:
    var enemy := Enemy.new()
    add_child_autofree(enemy)

    watch_signals(enemy)
    enemy.take_damage(50, "player")

    assert_signal_emitted_with_parameters(
        enemy,
        "damaged",
        [50, "player"]  # Expected parameters
    )
```

### Testing State Machines

```gdscript
# test_player_state_machine.gd
extends GutTest

var _player: Player
var _state_machine: StateMachine


func before_each() -> void:
    _player = preload("res://scenes/player.tscn").instantiate()
    add_child_autofree(_player)
    _state_machine = _player.get_node("StateMachine")


func test_initial_state_is_idle() -> void:
    assert_eq(_state_machine.current_state.name, "Idle")


func test_transition_to_walk_on_movement() -> void:
    # Simulate input
    Input.action_press("move_right")
    await wait_frames(2)
    Input.action_release("move_right")

    assert_eq(_state_machine.current_state.name, "Walk")


func test_transition_to_jump_from_idle() -> void:
    _player.position.y = 0  # Ensure on ground

    Input.action_press("jump")
    await wait_frames(2)
    Input.action_release("jump")

    assert_eq(_state_machine.current_state.name, "Jump")
```

### Testing Resources

```gdscript
# test_item_database.gd
extends GutTest


func test_load_item_by_id() -> void:
    var database := ItemDatabase.new()

    var sword := database.get_item("sword_01")

    assert_not_null(sword, "Item should exist")
    assert_eq(sword.name, "Iron Sword")
    assert_eq(sword.damage, 10)


func test_invalid_item_returns_null() -> void:
    var database := ItemDatabase.new()

    var item := database.get_item("nonexistent")

    assert_null(item, "Nonexistent item should return null")
```

### Mocking and Doubles

```gdscript
# test_combat_with_mocks.gd
extends GutTest


func test_attack_calls_target_take_damage() -> void:
    var attacker := Player.new()
    add_child_autofree(attacker)
    attacker.attack_damage = 25

    # Create a double (mock) of Enemy
    var enemy_double := double(Enemy).new()
    add_child_autofree(enemy_double)

    attacker.attack(enemy_double)

    assert_called(enemy_double, "take_damage")
    assert_call_count(enemy_double, "take_damage", 1)


func test_attack_damage_amount() -> void:
    var attacker := Player.new()
    add_child_autofree(attacker)
    attacker.attack_damage = 25

    var enemy_double := double(Enemy).new()
    add_child_autofree(enemy_double)

    attacker.attack(enemy_double)

    # Verify the parameter passed to take_damage
    var params := get_call_parameters(enemy_double, "take_damage", 0)
    assert_eq(params[0], 25)


func test_with_stubbed_return() -> void:
    var inventory := double(Inventory).new()

    # Stub method to return specific value
    stub(inventory, "has_item").to_return(true)

    assert_true(inventory.has_item("key"))
```

### Async Testing

```gdscript
# test_async_operations.gd
extends GutTest


func test_scene_loading() -> void:
    var loader := SceneLoader.new()
    add_child_autofree(loader)

    watch_signals(loader)
    loader.load_scene_async("res://scenes/level_01.tscn")

    # Wait for signal with timeout
    await wait_for_signal(loader.scene_loaded, 5.0)

    assert_signal_emitted(loader, "scene_loaded")


func test_timed_operation() -> void:
    var timer_manager := TimerManager.new()
    add_child_autofree(timer_manager)

    watch_signals(timer_manager)
    timer_manager.start_countdown(0.1)  # 100ms

    await wait_seconds(0.15)

    assert_signal_emitted(timer_manager, "countdown_finished")


func test_animation_completion() -> void:
    var player := preload("res://scenes/player.tscn").instantiate()
    add_child_autofree(player)

    var anim_player: AnimationPlayer = player.get_node("AnimationPlayer")
    watch_signals(anim_player)

    anim_player.play("attack")

    await wait_for_signal(anim_player.animation_finished, 2.0)

    assert_signal_emitted(anim_player, "animation_finished")
```

## Integration Testing

### Scene-Based Tests

```gdscript
# test_level_integration.gd
extends GutTest

var _level: Node2D


func before_each() -> void:
    _level = preload("res://scenes/levels/level_01.tscn").instantiate()
    add_child_autofree(_level)
    await wait_frames(2)  # Let _ready complete


func test_player_spawns_at_start_position() -> void:
    var player := _level.get_node("Player")
    var spawn_point := _level.get_node("SpawnPoint")

    assert_almost_eq(
        player.global_position,
        spawn_point.global_position,
        Vector2(1, 1)  # Tolerance
    )


func test_all_enemies_have_health_component() -> void:
    var enemies := get_tree().get_nodes_in_group("enemies")

    for enemy in enemies:
        var health := enemy.get_node_or_null("HealthComponent")
        assert_not_null(health, "Enemy %s missing HealthComponent" % enemy.name)


func test_collectibles_give_points() -> void:
    var player := _level.get_node("Player")
    var coin := _level.get_node("Coins/Coin1")
    var initial_score := GameManager.score

    # Move player to coin
    player.global_position = coin.global_position
    await wait_frames(5)

    assert_gt(GameManager.score, initial_score)
```

### Save/Load Testing

```gdscript
# test_save_system.gd
extends GutTest


func test_save_and_load_player_data() -> void:
    var save_manager := SaveManager.new()
    add_child_autofree(save_manager)

    # Set up test data
    var test_data := {
        "player_position": Vector3(10, 0, 20),
        "player_health": 75,
        "inventory": ["sword", "potion"]
    }

    # Save
    save_manager.save_game(99, test_data)  # Use test slot

    # Load
    var loaded := save_manager.load_game(99)

    assert_eq(loaded.player_position, test_data.player_position)
    assert_eq(loaded.player_health, test_data.player_health)
    assert_eq(loaded.inventory, test_data.inventory)

    # Cleanup
    save_manager.delete_save(99)


func test_save_handles_missing_directory() -> void:
    var save_manager := SaveManager.new()
    add_child_autofree(save_manager)

    # Delete save directory if exists
    DirAccess.remove_absolute("user://saves/")

    var result := save_manager.save_game(0, {"test": true})

    assert_true(result, "Save should succeed even with missing directory")
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Run Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    container:
      image: barichello/godot-ci:4.6

    steps:
      - uses: actions/checkout@v4

      - name: Import project
        run: |
          mkdir -p ~/.local/share/godot/
          godot --headless --import --quit

      - name: Run GUT tests
        run: |
          godot --headless -s addons/gut/gut_cmdln.gd \
            -gdir=res://test \
            -ginclude_subdirs \
            -gexit

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: user://gut_results.xml
```

### Exit Codes

```gdscript
# gut_cmdln.gd automatically exits with:
# 0 = All tests passed
# 1 = Some tests failed
# Use --should_exit_on_success=false to keep window open on success
```

## Test Utilities

### Custom Assertions

```gdscript
# test/utils/custom_assertions.gd
extends GutTest


func assert_vector_eq(v1: Vector3, v2: Vector3, tolerance: float = 0.001) -> void:
    var diff := (v1 - v2).length()
    assert_lt(diff, tolerance, "Vectors differ by %f" % diff)


func assert_node_in_group(node: Node, group: String) -> void:
    assert_true(
        node.is_in_group(group),
        "Node %s should be in group %s" % [node.name, group]
    )


func assert_scene_valid(path: String) -> void:
    assert_true(
        ResourceLoader.exists(path),
        "Scene should exist: %s" % path
    )

    var scene: PackedScene = load(path)
    assert_not_null(scene, "Scene should load: %s" % path)

    var instance := scene.instantiate()
    assert_not_null(instance, "Scene should instantiate: %s" % path)
    instance.queue_free()
```

### Test Fixtures

```gdscript
# test/utils/fixtures.gd
class_name TestFixtures
extends RefCounted


static func create_player(health: int = 100, position: Vector3 = Vector3.ZERO) -> Player:
    var player := Player.new()
    player.health = health
    player.global_position = position
    return player


static func create_enemy(type: String = "basic") -> Enemy:
    var path := "res://scenes/enemies/%s.tscn" % type
    var scene: PackedScene = load(path)
    return scene.instantiate()


static func create_inventory_with_items(items: Array[String]) -> Inventory:
    var inventory := Inventory.new()
    for item in items:
        inventory.add_item(item)
    return inventory
```

## Best Practices

1. **Test one thing per test** - Clear, focused assertions
2. **Use descriptive names** - `test_player_dies_when_health_reaches_zero`
3. **Arrange-Act-Assert** - Setup, perform action, verify result
4. **Use `add_child_autofree`** - Automatic cleanup prevents leaks
5. **Test edge cases** - Zero, negative, max values, null inputs
6. **Mock external dependencies** - Isolate units under test
7. **Run tests in CI** - Catch regressions early
8. **Test public interfaces** - Don't test private implementation details
9. **Keep tests fast** - Avoid unnecessary waits
10. **Test signals** - Watch and verify signal emissions
