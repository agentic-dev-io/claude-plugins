# Multiplayer Lobby Template

A Godot 4.6 template for multiplayer games with lobby system, matchmaking, and synchronized gameplay.

## Structure

```
multiplayer-lobby/
├── project.godot
├── scenes/
│   ├── main_menu.tscn         # Main menu with lobby
│   ├── lobby.tscn             # Lobby UI
│   ├── game.tscn              # Game scene
│   └── player.tscn            # Networked player
├── scripts/
│   ├── network_manager.gd     # Connection handling
│   ├── lobby_manager.gd       # Lobby state
│   ├── player_spawner.gd      # MultiplayerSpawner
│   ├── game_state.gd          # Synchronized state
│   └── player_controller.gd   # Networked input
├── ui/
│   ├── lobby_player_list.gd
│   ├── chat.gd
│   └── server_browser.gd
└── autoload/
    └── multiplayer_events.gd  # Global network events
```

## Features

- ENet peer-to-peer networking
- Host/Join lobby system
- Player synchronization
- Chat system
- Ready-up mechanism
- Graceful disconnect handling
- Server browser (LAN)

## Network Architecture

```
Host (Server + Client)
├── Lobby state authority
├── Game state authority
└── Player spawning

Clients
├── Input authority (own player)
├── State replication
└── Interpolation/prediction
```

## Setup

1. Copy this folder to your project
2. Configure port in `network_manager.gd`
3. Customize player scene
4. Add game-specific sync properties

## Usage

```gdscript
# Host a game
NetworkManager.host_game(port)

# Join a game
NetworkManager.join_game(address, port)

# In lobby
LobbyManager.set_ready(true)
LobbyManager.start_game()  # Host only
```

## Requirements

- Godot 4.6+
- Network access for multiplayer
- Port forwarding for WAN play
