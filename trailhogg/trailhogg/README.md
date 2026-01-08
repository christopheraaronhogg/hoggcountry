# TrailHogg

**An Appalachian Trail Thru-Hiking Simulation**

*"Every mile is earned."*

TrailHogg is a deep simulation game inspired by Project Zomboid's systemic depth, but set on the Appalachian Trail. Instead of zombies, you face the trail itself—weather, navigation, fatigue, and the mental challenge of a 2,190-mile journey.

## MVP Scope

This prototype covers the first ~30 miles of the AT:
- **Springer Mountain** (southern terminus) to **Neels Gap** (Mountain Crossings)
- ~1 week of hiking
- 6 shelters, 12 water sources, 1 trail town
- Full white blaze navigation system
- Dynamic weather, skill progression, status effects

## Tech Stack

- **Client:** Phaser 3 (2D game framework)
- **Server:** Colyseus (multiplayer game server)
- **Language:** TypeScript throughout
- **Mobile:** Ready for Capacitor wrapping

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone/download the project
cd trail-legs

# Install dependencies
npm install
cd shared && npm install && npm run build && cd ..
cd server && npm install && cd ..
cd client && npm install && cd ..

# Start development servers
# Terminal 1 - Server
cd server && npm run dev

# Terminal 2 - Client  
cd client && npm run dev
```

Open `http://localhost:3000` in your browser.

### Offline Mode

The client automatically falls back to offline mode if it can't connect to the server. All core gameplay works without a server connection.

## Controls

| Key | Action |
|-----|--------|
| `SPACE` | Start/Stop Hiking |
| `1` | Slow pace (1.5 mph) |
| `2` | Normal pace (2.0 mph) |
| `3` | Fast pace (2.5 mph) |
| `4` | Rush pace (3.0 mph) |
| `E` | Eat food |
| `D` | Drink water |
| `R` | Rest/Make camp |
| `S` | Search for blaze (when lost) |
| `B` | Backtrack (when lost) |

## Game Systems

### Navigation
- Follow white blazes painted on trees
- Double blazes indicate turns or junctions
- Moving too fast increases chance of missing blazes
- Weather (fog, rain) reduces blaze visibility
- If you lose the trail, search or backtrack to find it

### Status Effects (Moodles)
- **Hunger:** Depletes from hiking, restored by eating
- **Thirst:** Depletes quickly, refill at water sources
- **Fatigue:** Builds over the day, rest to recover
- **Morale:** Affected by conditions, weather, progress
- **Anxiety:** Increases when lost

### Skills (Build Through Use)
- **Trail Legs:** Miles capacity, stamina
- **Navigation:** Blaze detection, map reading
- **Camp Craft:** Setup speed, shelter quality
- **And more...**

### Weather
- Clear, Cloudy, Light Rain, Heavy Rain, Fog, Storm
- Affects visibility, morale, temperature
- Changes dynamically throughout the day

## Project Structure

```
trailhogg/
├── shared/           # Shared types, trail data
│   └── src/
│       ├── types.ts      # Game types & constants
│       └── trailData.ts  # Real AT data (shelters, water, etc.)
├── server/           # Colyseus game server
│   └── src/
│       ├── index.ts      # Server entry point
│       ├── schema/       # Colyseus state schemas
│       └── rooms/        # Game room logic
├── client/           # Phaser game client
│   └── src/
│       ├── main.ts       # Game entry point
│       └── scenes/       # Phaser scenes
│           ├── BootScene.ts   # Asset loading
│           ├── MenuScene.ts   # Character creation
│           ├── GameScene.ts   # Main game
│           └── UIScene.ts     # HUD overlay
└── README.md
```

## Multiplayer

The game supports PZ-style multiplayer:
- **Self-hosted:** Run your own server for friends
- **Official servers:** (future) Large "bubble" servers
- **Single player:** Local server runs transparently

### Hosting a Server

```bash
cd server
npm run build
npm start
# Server runs on port 2567
```

Players connect by changing the server URL in the client.

## Real AT Data

The game uses authentic Appalachian Trail data:
- Real shelter names and locations
- Accurate mile markers
- Real elevation profiles
- Actual water source locations

### MVP Section Highlights
- **Mile 0:** Springer Mountain Summit (3,782 ft)
- **Mile 0.9:** Springer Mountain Shelter
- **Mile 8.0:** Hawk Mountain Shelter
- **Mile 15.8:** Gooch Mountain Shelter
- **Mile 29.5:** Blood Mountain (4,458 ft - highest in GA)
- **Mile 30.7:** Neels Gap / Walasi-Yi Center

## Design Philosophy

- **Challenge without cruelty:** ~25% completion target, but fair
- **Every mile matters:** Progress is celebrated, not just completion
- **Teach real skills:** Navigation, pacing, preparation
- **Rest is not weakness:** Sabbath rest mechanics matter
- **The trail provides:** Community and trail magic

## Future Development

- [ ] Complete Georgia section
- [ ] Full injury/illness system
- [ ] Trail name system
- [ ] Tramily (trail family) mechanics
- [ ] Seasonal variations
- [ ] Mobile apps (iOS/Android via Capacitor)
- [ ] Additional trails (PCT, CDT)

## License

MIT License - See LICENSE file

## Credits

Inspired by:
- Project Zomboid (systemic depth)
- The Appalachian Trail and its community
- The ~25% who finish, and the 75% who tried

---

*"The mountain doesn't care about your plans. Climb it anyway."*
