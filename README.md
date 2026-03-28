# Agetopia

A lightweight Growtopia-inspired sandbox with optional online multiplayer.

## Features

- Side-view 2D world with chunks of terrain
- Player movement with gravity and jumping
- Break blocks with left click
- Place blocks with right click
- Hotbar inventory (keys 1-5)
- Simple camera and HUD
- Separate block and item texture folders for easy editing
- Account system (register/login)
- Online multiplayer sync over WebSocket
- File-backed database persistence for accounts and world edits
- Punch animation when mining and fighting
- Player health bars with multiplayer punch damage and respawn
- Punch knockback impulse on player hits
- New placeable `123 Block` item (hotbar slot 6)
- Visible 123 badge in HUD and status line
- 1-2-3 keyboard combo behavior (+10 HP mini boost)

## Assets

- Block textures are in `assets/blocks/`
- Item icons are in `assets/items/`

You can replace any SVG with your own PNG/SVG file and keep the same filename.
If an image is missing, the game falls back to a solid color tile.

## Run Singleplayer

Open `index.html` in a browser.

For best results, use a local static server so browser security policies are predictable.

## Run Online Multiplayer

1. Install dependencies:

	npm install

2. Start the game server:

	npm run server

	If npm/node are not recognized in your terminal yet, use one of these:

	- PowerShell: .\start-server.ps1
	- CMD: start-server.cmd

3. Open the login page:

	http://localhost:3002/login.html

4. Register or login.

5. After authentication you are redirected into the game:

	http://localhost:3002/index.html?online=1

### Database

- Database files are created in `data/`
- Stored data:
  - user accounts
  - persisted world block changes
  - last player spawn position
