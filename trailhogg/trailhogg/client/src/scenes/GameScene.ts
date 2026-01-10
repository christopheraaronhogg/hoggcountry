import Phaser from 'phaser';
import * as Colyseus from 'colyseus.js';
import { gameStorage, type HikerSaveData, type GameSaveData } from '../storage/GameStorage';

interface GameData {
  hikerName: string;
  build: string;
  loadSave?: boolean;
}

export class GameScene extends Phaser.Scene {
  private client!: Colyseus.Client;
  private room!: Colyseus.Room;
  private hiker!: Phaser.GameObjects.Sprite;
  public hikerData: any = null;  // Public so UIScene can access inventory
  private trees: Phaser.GameObjects.Sprite[] = [];
  private blazes: Phaser.GameObjects.Sprite[] = [];
  private trail!: Phaser.GameObjects.TileSprite;
  private ground!: Phaser.GameObjects.TileSprite;
  private rainEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private fogSprites: Phaser.GameObjects.Sprite[] = [];

  // Trail features
  private obstacles: Phaser.GameObjects.Sprite[] = [];
  private landmarks: Phaser.GameObjects.Container[] = [];
  private waterSources: Phaser.GameObjects.Sprite[] = [];
  private offTrailWarning!: Phaser.GameObjects.Text;
  private lastMileLandmark: number = 0;
  private nextObstacleSpawn: number = 0;
  private nextWaterSpawn: number = 0;

  // Camera follow offset
  private cameraTarget: number = 0;

  // Mobile controls
  private joystickBase!: Phaser.GameObjects.Arc;
  private joystickThumb!: Phaser.GameObjects.Arc;
  private joystickActive: boolean = false;
  private joystickVector: { x: number; y: number } = { x: 0, y: 0 };
  private isMobile: boolean = false;

  // Game state
  private isConnected: boolean = false;
  private gameState: any = null;

  // Save system
  private autoSaveTimer: Phaser.Time.TimerEvent | null = null;
  private lastSaveTime: number = 0;
  private loadFromSave: boolean = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: GameData) {
    this.registry.set('hikerName', data.hikerName);
    this.registry.set('build', data.build);
    this.loadFromSave = data.loadSave || false;
  }

  create() {
    const { width, height } = this.cameras.main;
    
    // Create ground layer
    this.ground = this.add.tileSprite(0, 0, width * 3, height, 'ground');
    this.ground.setOrigin(0, 0);
    
    // Create trail
    this.trail = this.add.tileSprite(width * 0.3, 0, width * 0.4, height, 'trail');
    this.trail.setOrigin(0, 0);
    
    // Generate trees on both sides
    this.generateTrees();
    
    // Generate initial blazes
    this.generateBlazes();
    
    // Create hiker sprite
    this.hiker = this.add.sprite(width / 2, height * 0.6, 'hiker');
    this.hiker.setScale(2);
    this.hiker.setDepth(10);

    // Create off-trail warning (hidden by default)
    this.offTrailWarning = this.add.text(width / 2, height * 0.4, '⚠ OFF TRAIL - Move back to center!', {
      font: '14px Courier',
      color: '#ff6b6b',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setAlpha(0).setDepth(100);

    // Generate initial obstacles
    this.generateObstacles();

    // Set up camera
    this.cameras.main.setBackgroundColor(0x355E3B);
    
    // Connect to server
    this.connectToServer();
    
    // Input handlers
    this.setupInputHandlers();

    // Detect mobile and setup touch controls
    this.isMobile = this.sys.game.device.os.android || this.sys.game.device.os.iOS ||
                    this.sys.game.device.os.iPad || this.sys.game.device.os.iPhone ||
                    ('ontouchstart' in window);

    if (this.isMobile) {
      this.setupMobileControls();
    }

    // Emit event that game scene is ready
    this.events.emit('scene-ready');
  }
  
  generateTrees() {
    const { width, height } = this.cameras.main;
    
    // Left side trees
    for (let i = 0; i < 15; i++) {
      const x = Phaser.Math.Between(20, width * 0.25);
      const y = Phaser.Math.Between(0, height);
      const tree = this.add.sprite(x, y, 'tree');
      tree.setScale(Phaser.Math.FloatBetween(0.8, 1.5));
      tree.setDepth(y / height * 5); // Depth based on Y position
      this.trees.push(tree);
    }
    
    // Right side trees
    for (let i = 0; i < 15; i++) {
      const x = Phaser.Math.Between(width * 0.75, width - 20);
      const y = Phaser.Math.Between(0, height);
      const tree = this.add.sprite(x, y, 'tree');
      tree.setScale(Phaser.Math.FloatBetween(0.8, 1.5));
      tree.setDepth(y / height * 5);
      this.trees.push(tree);
    }
  }
  
  generateBlazes() {
    const { width, height } = this.cameras.main;
    
    // Create blazes at intervals along the visible trail
    const blazeInterval = 80; // pixels between blazes
    for (let y = 0; y < height; y += blazeInterval) {
      // Randomly place on left or right tree
      const side = Math.random() < 0.5 ? 'left' : 'right';
      const x = side === 'left' ? width * 0.28 : width * 0.72;
      
      // Choose blaze type
      const blazeType = Math.random() < 0.85 ? 'blaze_single' : 
                        (Math.random() < 0.7 ? 'blaze_double' : 'blaze_blue');
      
      const blaze = this.add.sprite(x, y, blazeType);
      blaze.setDepth(6);
      blaze.setData('visible', true);
      this.blazes.push(blaze);
    }
  }

  generateObstacles() {
    const { width, height } = this.cameras.main;

    // Create initial obstacles scattered on the trail
    // Use actual sprite names from AssetGenerator
    const obstacleTypes = ['rock', 'roots', 'mud_puddle', 'boulder', 'fallen_log'];

    for (let i = 0; i < 5; i++) {
      const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
      const x = width * 0.35 + Math.random() * (width * 0.3); // On trail area
      const y = Phaser.Math.Between(-height, height);

      const obstacle = this.add.sprite(x, y, type);
      obstacle.setDepth(5);
      obstacle.setScale(0.8); // Slightly smaller for trail
      obstacle.setData('type', type);
      obstacle.setData('hit', false);
      this.obstacles.push(obstacle);
    }
  }

  spawnObstacle() {
    const { width } = this.cameras.main;
    const obstacleTypes = ['rock', 'roots', 'mud_puddle', 'boulder', 'fallen_log'];
    const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];

    // Spawn at top of screen, random position on trail
    const x = width * 0.35 + Math.random() * (width * 0.3);
    const y = -30;

    const obstacle = this.add.sprite(x, y, type);
    obstacle.setDepth(5);
    obstacle.setScale(0.8);
    obstacle.setData('type', type);
    obstacle.setData('hit', false);
    this.obstacles.push(obstacle);
  }

  spawnLandmark(mile: number, name: string, hasWater: boolean = false) {
    const { width } = this.cameras.main;

    // Create a container for the landmark
    const container = this.add.container(width / 2, -60);

    // Shelter/sign background
    const bg = this.add.rectangle(0, 0, 200, 50, 0x2e5339, 0.9);
    bg.setStrokeStyle(2, 0x4a7d5a);
    container.add(bg);

    // Landmark text
    const text = this.add.text(0, -8, name, {
      font: '12px Courier',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(text);

    // Mile marker
    const mileText = this.add.text(0, 10, `Mile ${mile.toFixed(1)}`, {
      font: '10px Courier',
      color: '#aaffaa'
    }).setOrigin(0.5);
    container.add(mileText);

    // Water indicator if available
    if (hasWater) {
      const waterIcon = this.add.text(80, 0, '💧', {
        font: '16px Arial'
      }).setOrigin(0.5);
      container.add(waterIcon);
    }

    container.setDepth(50);
    container.setData('mile', mile);
    container.setData('hasWater', hasWater);
    this.landmarks.push(container);
  }

  spawnWaterSource() {
    const { width } = this.cameras.main;

    // Stream crosses the trail - use stream_crossing sprite
    const x = width / 2;
    const y = -40;

    const water = this.add.sprite(x, y, 'stream_crossing');
    water.setDepth(4);
    water.setData('used', false);
    water.setScale(1.5, 1);

    // Add a water indicator icon above it
    const indicator = this.add.text(x, y - 25, '💧', {
      font: '16px Arial'
    }).setOrigin(0.5).setDepth(50);
    water.setData('indicator', indicator);

    this.waterSources.push(water);
  }

  async connectToServer() {
    try {
      // Connect to Colyseus server
      const serverUrl = window.location.hostname === 'localhost' 
        ? 'ws://localhost:2567' 
        : `wss://${window.location.hostname}`;
      
      this.client = new Colyseus.Client(serverUrl);
      
      // Join or create a room
      this.room = await this.client.joinOrCreate('trail', {});
      
      console.log('Connected to room:', this.room.id);
      this.isConnected = true;
      
      // Create our hiker
      this.room.send('create_hiker', {
        name: this.registry.get('hikerName'),
        build: this.registry.get('build')
      });
      
      // Listen for state changes
      this.room.onStateChange((state) => {
        this.gameState = state;
        this.updateFromState(state);
      });
      
      // Listen for events
      this.room.onMessage('hiker_created', (data) => {
        console.log('Hiker created:', data);
      });
      
      this.room.onError((code, message) => {
        console.error('Room error:', code, message);
      });
      
      this.room.onLeave((code) => {
        console.log('Left room:', code);
        this.isConnected = false;
      });
      
    } catch (error) {
      console.error('Connection failed:', error);
      // Run in offline mode with simulated state
      this.runOfflineMode();
    }
  }
  
  async runOfflineMode() {
    console.log('Running in offline mode');

    // Check if we should load from save
    if (this.loadFromSave) {
      const saveData = await gameStorage.load('autosave');
      if (saveData) {
        console.log('Loading saved game...');
        this.hikerData = saveData.hiker;
        this.gameState = saveData.game;
        this.events.emit('game-event', {
          type: 'success',
          message: `Welcome back, ${saveData.hikerName}!`
        });
      } else {
        // No save found, create new game
        this.createNewGame();
      }
    } else {
      // Create new game
      this.createNewGame();
    }

    // Start offline simulation loop
    this.time.addEvent({
      delay: 100,
      callback: this.offlineTick,
      callbackScope: this,
      loop: true
    });

    // Set up auto-save every 30 seconds
    this.autoSaveTimer = this.time.addEvent({
      delay: 30000,
      callback: this.autoSave,
      callbackScope: this,
      loop: true
    });

    // Save on page unload
    window.addEventListener('beforeunload', this.handleBeforeUnload);

    // Emit initial state to UI
    this.events.emit('state-update', {
      hiker: this.hikerData,
      game: this.gameState
    });
  }

  private createNewGame() {
    this.hikerData = {
      name: this.registry.get('hikerName'),
      build: this.registry.get('build'),
      mile: 0,
      elevation: 3782,
      calories: 2000,
      hydration: 100,
      energy: 100,
      health: 100,
      pace: 'normal',
      lostState: 'on_trail',
      isHiking: false,
      isResting: false,
      currentDayMiles: 0,
      totalMilesHiked: 0,
      daysOnTrail: 1,
      skills: {
        trailLegs: 10, navigation: 15, campCraft: 10,
        firstAid: 10, mentalFortitude: 20
      },
      moodles: {
        hunger: 0, thirst: 0, fatigue: 0, morale: 50, anxiety: 0
      },
      inventory: {
        water: 2.0,
        waterCapacity: 3.0,
        money: 500,
        gear: [
          { id: 'backpack', name: 'Backpack', weight: 2.5, condition: 95, category: 'misc' },
          { id: 'tent', name: '2-Person Tent', weight: 3.2, condition: 90, category: 'shelter' },
          { id: 'sleepingBag', name: 'Sleeping Bag', weight: 2.0, condition: 88, category: 'sleep' },
          { id: 'sleepingPad', name: 'Sleeping Pad', weight: 1.0, condition: 92, category: 'sleep' },
          { id: 'stove', name: 'Camp Stove', weight: 0.5, condition: 100, category: 'cook' },
          { id: 'headlamp', name: 'Headlamp', weight: 0.2, condition: 100, category: 'misc' }
        ],
        food: [
          { id: 'oatmeal', name: 'Instant Oatmeal', calories: 300, weight: 0.2, servings: 4 },
          { id: 'ramen', name: 'Ramen Noodles', calories: 400, weight: 0.1, servings: 3 },
          { id: 'trailMix', name: 'Trail Mix', calories: 600, weight: 0.3, servings: 2 },
          { id: 'snickers', name: 'Snickers Bar', calories: 250, weight: 0.1, servings: 3 }
        ]
      }
    };

    this.gameState = {
      time: { day: 1, hour: 6, minute: 0 },
      phase: 'morning',
      weather: 'clear',
      temperature: 55,
      events: []
    };
  }

  private handleBeforeUnload = () => {
    // Synchronous save attempt on page close
    this.saveGame();
  };

  async saveGame(): Promise<void> {
    if (!this.hikerData || !this.gameState) return;

    try {
      await gameStorage.save(
        this.hikerData as HikerSaveData,
        this.gameState as GameSaveData,
        'autosave'
      );
      this.lastSaveTime = Date.now();
      this.events.emit('game-saved');
    } catch (error) {
      console.error('Failed to save game:', error);
    }
  }

  private async autoSave() {
    await this.saveGame();
    this.events.emit('game-event', {
      type: 'info',
      message: 'Game saved'
    });
  }

  // Clean up on scene shutdown
  shutdown() {
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    if (this.autoSaveTimer) {
      this.autoSaveTimer.destroy();
    }
    // Final save
    this.saveGame();
  }
  
  offlineTick() {
    if (!this.hikerData) return;
    
    // Advance time
    this.gameState.time.minute += 1;
    if (this.gameState.time.minute >= 60) {
      this.gameState.time.minute = 0;
      this.gameState.time.hour++;
      if (this.gameState.time.hour >= 24) {
        this.gameState.time.hour = 0;
        this.gameState.time.day++;
        this.hikerData.daysOnTrail++;
        this.hikerData.currentDayMiles = 0;
      }
    }
    
    // Update phase
    const hour = this.gameState.time.hour;
    if (hour >= 5 && hour < 8) this.gameState.phase = 'morning';
    else if (hour >= 8 && hour < 18) this.gameState.phase = 'hiking';
    else if (hour >= 18 && hour < 21) this.gameState.phase = 'evening';
    else this.gameState.phase = 'night';

    // Random weather changes (check every ~30 minutes of game time)
    if (this.gameState.time.minute === 0 || this.gameState.time.minute === 30) {
      this.maybeChangeWeather();
    }
    
    // Process hiking
    if (this.hikerData.isHiking) {
      const paceSpeed: Record<string, number> = {
        slow: 1.5, normal: 2.0, fast: 2.5, rush: 3.0
      };
      let speed = paceSpeed[this.hikerData.pace] || 2.0;

      // Weather affects hiking speed and resource consumption
      const weatherSpeedMod: Record<string, number> = {
        'clear': 1.0, 'cloudy': 1.0, 'rain_light': 0.85,
        'rain_heavy': 0.7, 'fog': 0.75, 'storm': 0.5
      };
      const weatherEnergyMod: Record<string, number> = {
        'clear': 1.0, 'cloudy': 1.0, 'rain_light': 1.3,
        'rain_heavy': 1.5, 'fog': 1.1, 'storm': 2.0
      };

      const speedMod = weatherSpeedMod[this.gameState.weather] || 1.0;
      const energyMod = weatherEnergyMod[this.gameState.weather] || 1.0;

      speed *= speedMod;
      const distance = speed / 60; // miles per minute

      this.hikerData.mile = Math.min(30.7, this.hikerData.mile + distance);
      this.hikerData.currentDayMiles += distance;
      this.hikerData.totalMilesHiked += distance;

      // Consume resources (modified by weather)
      this.hikerData.calories -= 3 * energyMod;
      this.hikerData.hydration -= 0.5;
      this.hikerData.energy -= 0.1 * energyMod;
      
      // Clamp values
      this.hikerData.calories = Math.max(0, this.hikerData.calories);
      this.hikerData.hydration = Math.max(0, this.hikerData.hydration);
      this.hikerData.energy = Math.max(0, this.hikerData.energy);
      
      // Update moodles based on values
      this.hikerData.moodles.hunger = this.hikerData.calories < 1000 ? 
        (this.hikerData.calories < 500 ? 3 : 2) : 
        (this.hikerData.calories < 1500 ? 1 : 0);
      this.hikerData.moodles.thirst = this.hikerData.hydration < 40 ? 
        (this.hikerData.hydration < 20 ? 3 : 2) : 
        (this.hikerData.hydration < 60 ? 1 : 0);
      this.hikerData.moodles.fatigue = this.hikerData.energy < 40 ? 
        (this.hikerData.energy < 20 ? 3 : 2) : 
        (this.hikerData.energy < 60 ? 1 : 0);
      
      // Skill gain
      this.hikerData.skills.trailLegs = Math.min(100, 
        this.hikerData.skills.trailLegs + 0.01);
      
      // Check for end
      if (this.hikerData.mile >= 30.7) {
        this.hikerData.isHiking = false;
        this.events.emit('game-event', {
          type: 'milestone',
          message: 'You reached Neels Gap! MVP Complete!'
        });
      }
    }

    // Process resting
    if (this.hikerData.isResting) {
      // Recover energy faster while resting
      this.hikerData.energy = Math.min(100, this.hikerData.energy + 0.3);

      // Still consume calories/hydration but slowly
      this.hikerData.calories -= 0.5;
      this.hikerData.hydration -= 0.1;

      // Clamp values
      this.hikerData.calories = Math.max(0, this.hikerData.calories);
      this.hikerData.hydration = Math.max(0, this.hikerData.hydration);

      // Update fatigue moodle
      this.hikerData.moodles.fatigue = this.hikerData.energy < 40 ?
        (this.hikerData.energy < 20 ? 3 : 2) :
        (this.hikerData.energy < 60 ? 1 : 0);

      // Recover morale slowly
      this.hikerData.moodles.morale = Math.min(100, this.hikerData.moodles.morale + 0.1);
    }

    // Emit update
    this.events.emit('state-update', {
      hiker: this.hikerData,
      game: this.gameState
    });

    // Update visual weather effects
    this.updateWeatherEffects(this.gameState.weather);
  }

  maybeChangeWeather() {
    // 20% chance to change weather each check
    if (Math.random() > 0.2) return;

    const weatherTypes = ['clear', 'cloudy', 'rain_light', 'rain_heavy', 'fog', 'storm'];
    const currentIndex = weatherTypes.indexOf(this.gameState.weather);

    // Weather tends to transition gradually
    const transitions: Record<string, string[]> = {
      'clear': ['clear', 'clear', 'cloudy'],
      'cloudy': ['clear', 'cloudy', 'rain_light', 'fog'],
      'rain_light': ['cloudy', 'rain_light', 'rain_heavy'],
      'rain_heavy': ['rain_light', 'rain_heavy', 'storm'],
      'storm': ['rain_heavy', 'storm', 'rain_light'],
      'fog': ['fog', 'cloudy', 'clear']
    };

    const possibilities = transitions[this.gameState.weather] || ['clear'];
    const newWeather = possibilities[Math.floor(Math.random() * possibilities.length)];

    if (newWeather !== this.gameState.weather) {
      this.gameState.weather = newWeather;

      // Update temperature based on weather
      const tempMods: Record<string, number> = {
        'clear': 0, 'cloudy': -5, 'rain_light': -10,
        'rain_heavy': -15, 'fog': -8, 'storm': -20
      };
      this.gameState.temperature = 55 + (tempMods[newWeather] || 0);

      // Emit weather change event
      const weatherNames: Record<string, string> = {
        'clear': 'sunny', 'cloudy': 'overcast', 'rain_light': 'drizzling',
        'rain_heavy': 'raining hard', 'fog': 'foggy', 'storm': 'stormy'
      };
      this.events.emit('game-event', {
        type: newWeather === 'clear' ? 'success' : 'warning',
        message: `Weather turning ${weatherNames[newWeather] || newWeather}...`
      });
    }
  }

  updateFromState(state: any) {
    // Find our hiker in the state
    const sessionId = this.room?.sessionId;
    if (sessionId && state.hikers) {
      const hiker = state.hikers.get(sessionId);
      if (hiker) {
        this.hikerData = hiker;
      }
    }
    
    // Emit to UI
    this.events.emit('state-update', {
      hiker: this.hikerData,
      game: {
        time: state.time,
        phase: state.phase,
        weather: state.weather,
        temperature: state.temperature,
        events: state.events
      }
    });
    
    // Update weather effects
    this.updateWeatherEffects(state.weather);
  }
  
  updateWeatherEffects(weather: string) {
    // Clear existing effects
    if (this.rainEmitter) {
      this.rainEmitter.stop();
      this.rainEmitter = null;
    }
    this.fogSprites.forEach(f => f.destroy());
    this.fogSprites = [];
    
    const { width, height } = this.cameras.main;
    
    if (weather === 'rain_light' || weather === 'rain_heavy' || weather === 'storm') {
      // Create rain particles
      const particles = this.add.particles(0, 0, 'rain', {
        x: { min: 0, max: width },
        y: -10,
        lifespan: 1000,
        speedY: { min: 300, max: 500 },
        quantity: weather === 'storm' ? 5 : (weather === 'rain_heavy' ? 3 : 1),
        alpha: 0.6
      });
      this.rainEmitter = particles;
    }
    
    if (weather === 'fog') {
      // Create fog sprites
      for (let i = 0; i < 20; i++) {
        const fog = this.add.sprite(
          Phaser.Math.Between(0, width),
          Phaser.Math.Between(0, height),
          'fog'
        );
        fog.setAlpha(0.3);
        fog.setDepth(20);
        this.fogSprites.push(fog);
        
        // Animate fog
        this.tweens.add({
          targets: fog,
          x: fog.x + Phaser.Math.Between(-50, 50),
          y: fog.y + Phaser.Math.Between(-30, 30),
          alpha: { from: 0.2, to: 0.4 },
          duration: 3000,
          yoyo: true,
          repeat: -1
        });
      }
    }
  }
  
  setupInputHandlers() {
    // Keyboard controls
    const cursors = this.input.keyboard?.createCursorKeys();

    // WASD keys for movement
    const keyW = this.input.keyboard?.addKey('W');
    const keyA = this.input.keyboard?.addKey('A');
    const keyS = this.input.keyboard?.addKey('S');
    const keyD = this.input.keyboard?.addKey('D');

    // Space to toggle hiking
    this.input.keyboard?.on('keydown-SPACE', () => {
      this.toggleHiking();
    });

    // Number keys for pace
    this.input.keyboard?.on('keydown-ONE', () => this.setPace('slow'));
    this.input.keyboard?.on('keydown-TWO', () => this.setPace('normal'));
    this.input.keyboard?.on('keydown-THREE', () => this.setPace('fast'));
    this.input.keyboard?.on('keydown-FOUR', () => this.setPace('rush'));

    // E to eat
    this.input.keyboard?.on('keydown-E', () => this.eat());

    // R to rest/camp (changed from D which conflicts with movement)
    this.input.keyboard?.on('keydown-R', () => this.toggleCamp());

    // Q to drink (changed from D which is now movement)
    this.input.keyboard?.on('keydown-Q', () => this.drink());

    // F to search for blaze (changed from S which is now movement)
    this.input.keyboard?.on('keydown-F', () => this.searchBlaze());

    // B to backtrack (when lost)
    this.input.keyboard?.on('keydown-B', () => this.backtrack());
  }

  setupMobileControls() {
    const { width, height } = this.cameras.main;

    // Create virtual joystick on left side
    const joystickSize = 80;
    const joystickX = joystickSize + 20;
    const joystickY = height - joystickSize - 20;

    // Joystick base (outer circle)
    this.joystickBase = this.add.circle(joystickX, joystickY, joystickSize / 2, 0x333333, 0.4);
    this.joystickBase.setDepth(1000);
    this.joystickBase.setScrollFactor(0);
    this.joystickBase.setStrokeStyle(2, 0x666666, 0.6);

    // Joystick thumb (inner circle)
    this.joystickThumb = this.add.circle(joystickX, joystickY, joystickSize / 4, 0x4a7d5a, 0.7);
    this.joystickThumb.setDepth(1001);
    this.joystickThumb.setScrollFactor(0);

    // Touch controls for joystick
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const distance = Phaser.Math.Distance.Between(
        pointer.x, pointer.y, this.joystickBase.x, this.joystickBase.y
      );

      // Check if touch is on joystick
      if (distance < joystickSize) {
        this.joystickActive = true;
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.joystickActive) {
        const distance = Phaser.Math.Distance.Between(
          pointer.x, pointer.y, this.joystickBase.x, this.joystickBase.y
        );

        const angle = Phaser.Math.Angle.Between(
          this.joystickBase.x, this.joystickBase.y, pointer.x, pointer.y
        );

        // Limit thumb movement to base radius
        const maxDistance = joystickSize / 2;
        const clampedDistance = Math.min(distance, maxDistance);

        // Update thumb position
        this.joystickThumb.x = this.joystickBase.x + Math.cos(angle) * clampedDistance;
        this.joystickThumb.y = this.joystickBase.y + Math.sin(angle) * clampedDistance;

        // Calculate normalized vector for movement
        this.joystickVector.x = (this.joystickThumb.x - this.joystickBase.x) / maxDistance;
        this.joystickVector.y = (this.joystickThumb.y - this.joystickBase.y) / maxDistance;
      }
    });

    this.input.on('pointerup', () => {
      if (this.joystickActive) {
        this.joystickActive = false;

        // Reset thumb to center
        this.joystickThumb.x = this.joystickBase.x;
        this.joystickThumb.y = this.joystickBase.y;
        this.joystickVector.x = 0;
        this.joystickVector.y = 0;
      }
    });

    // Mobile action buttons (right side)
    const buttonSize = 50;
    const buttonX = width - 70;
    const buttonSpacing = 60;

    // Hike button (SPACE equivalent)
    const hikeButton = this.add.circle(buttonX, height - buttonSpacing * 3, buttonSize / 2, 0x2e5339, 0.7);
    hikeButton.setDepth(1000);
    hikeButton.setScrollFactor(0);
    hikeButton.setInteractive();
    const hikeText = this.add.text(buttonX, height - buttonSpacing * 3, '▶', {
      font: '24px Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(1001).setScrollFactor(0);

    hikeButton.on('pointerdown', () => {
      this.toggleHiking();
      hikeButton.setFillStyle(0x4a7d5a, 0.9);
    });
    hikeButton.on('pointerup', () => {
      hikeButton.setFillStyle(0x2e5339, 0.7);
    });

    // Eat button (E equivalent)
    const eatButton = this.add.circle(buttonX, height - buttonSpacing * 2, buttonSize / 2, 0x4a7d5a, 0.7);
    eatButton.setDepth(1000);
    eatButton.setScrollFactor(0);
    eatButton.setInteractive();
    const eatText = this.add.text(buttonX, height - buttonSpacing * 2, '🍽', {
      font: '20px Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(1001).setScrollFactor(0);

    eatButton.on('pointerdown', () => {
      this.eat();
      eatButton.setFillStyle(0x5a9d6a, 0.9);
    });
    eatButton.on('pointerup', () => {
      eatButton.setFillStyle(0x4a7d5a, 0.7);
    });

    // Drink button (Q equivalent)
    const drinkButton = this.add.circle(buttonX, height - buttonSpacing, buttonSize / 2, 0x4a7d5a, 0.7);
    drinkButton.setDepth(1000);
    drinkButton.setScrollFactor(0);
    drinkButton.setInteractive();
    const drinkText = this.add.text(buttonX, height - buttonSpacing, '💧', {
      font: '20px Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(1001).setScrollFactor(0);

    drinkButton.on('pointerdown', () => {
      this.drink();
      drinkButton.setFillStyle(0x5a9d6a, 0.9);
    });
    drinkButton.on('pointerup', () => {
      drinkButton.setFillStyle(0x4a7d5a, 0.7);
    });
  }

  toggleHiking() {
    if (this.isConnected && this.room) {
      const isHiking = this.hikerData?.isHiking;
      this.room.send(isHiking ? 'stop_hiking' : 'start_hiking');
    } else if (this.hikerData) {
      this.hikerData.isHiking = !this.hikerData.isHiking;
      this.events.emit('game-event', {
        type: 'info',
        message: this.hikerData.isHiking ? 'Started hiking' : 'Stopped hiking'
      });
    }
  }
  
  setPace(pace: string) {
    if (this.isConnected && this.room) {
      this.room.send('set_pace', { pace });
    } else if (this.hikerData) {
      this.hikerData.pace = pace;
      this.events.emit('game-event', {
        type: 'info',
        message: `Pace set to ${pace}`
      });
    }
  }
  
  eat() {
    if (this.isConnected && this.room) {
      // Eat first available food
      this.room.send('eat', { foodId: 'oatmeal_1' });
    } else if (this.hikerData?.inventory?.food) {
      // Find food item with servings remaining
      const food = this.hikerData.inventory.food.find((f: any) => f.servings > 0);
      if (food) {
        food.servings--;
        const caloriesGained = food.calories;
        this.hikerData.calories = Math.min(3000, this.hikerData.calories + caloriesGained);

        // Remove item if no servings left
        if (food.servings <= 0) {
          const idx = this.hikerData.inventory.food.indexOf(food);
          this.hikerData.inventory.food.splice(idx, 1);
        }

        // Update hunger moodle
        if (this.hikerData.moodles.hunger > 0) {
          this.hikerData.moodles.hunger = Math.max(0, this.hikerData.moodles.hunger - 1);
        }

        this.events.emit('game-event', {
          type: 'success',
          message: `Ate ${food.name} (+${caloriesGained} cal)`
        });
      } else {
        this.events.emit('game-event', {
          type: 'warning',
          message: 'No food left!'
        });
      }
    }
  }

  drink() {
    if (this.isConnected && this.room) {
      this.room.send('drink', { amount: 0.5 });
    } else if (this.hikerData?.inventory) {
      if (this.hikerData.inventory.water >= 0.25) {
        this.hikerData.inventory.water -= 0.25;
        this.hikerData.hydration = Math.min(100, this.hikerData.hydration + 10);

        // Update thirst moodle
        if (this.hikerData.moodles.thirst > 0) {
          this.hikerData.moodles.thirst = Math.max(0, this.hikerData.moodles.thirst - 1);
        }

        this.events.emit('game-event', {
          type: 'success',
          message: `Drank water (${this.hikerData.inventory.water.toFixed(1)}L left)`
        });
      } else {
        this.events.emit('game-event', {
          type: 'warning',
          message: 'Need more water!'
        });
      }
    }
  }
  
  toggleCamp() {
    if (this.isConnected && this.room) {
      const isResting = this.hikerData?.isResting;
      this.room.send(isResting ? 'break_camp' : 'make_camp');
    } else if (this.hikerData) {
      // Toggle resting state
      this.hikerData.isResting = !this.hikerData.isResting;

      // Can't hike and rest at the same time
      if (this.hikerData.isResting) {
        this.hikerData.isHiking = false;
        this.events.emit('game-event', {
          type: 'info',
          message: 'Taking a break to rest and recover...'
        });
      } else {
        this.events.emit('game-event', {
          type: 'info',
          message: 'Packed up and ready to hike!'
        });
      }
    }
  }
  
  searchBlaze() {
    if (this.isConnected && this.room) {
      this.room.send('search_blaze');
    } else if (this.hikerData && this.hikerData.lostState !== 'on_trail') {
      // Offline blaze search
      if (Math.random() < 0.3) {
        this.hikerData.lostState = 'on_trail';
        this.events.emit('game-event', {
          type: 'success',
          message: 'Found a white blaze! Back on trail!'
        });
      } else {
        this.events.emit('game-event', {
          type: 'warning',
          message: 'Still searching for the trail...'
        });
      }
    }
  }
  
  backtrack() {
    if (this.isConnected && this.room) {
      this.room.send('backtrack');
    } else if (this.hikerData && this.hikerData.lostState !== 'on_trail') {
      this.hikerData.mile = Math.max(0, this.hikerData.mile - 0.1);
      this.hikerData.energy -= 5;
      this.events.emit('game-event', {
        type: 'info',
        message: 'Backtracking...'
      });
    }
  }
  
  update(time: number, delta: number) {
    const { width, height } = this.cameras.main;

    // Handle horizontal movement (keyboard or joystick)
    const moveSpeed = 250 * (delta / 1000); // pixels per second
    let moveX = 0;

    // Keyboard movement - left/right only for trail navigation
    const keys = this.input.keyboard;
    if (keys) {
      const keyA = keys.addKey('A');
      const keyD = keys.addKey('D');
      const cursors = keys.createCursorKeys();

      if (keyA?.isDown || cursors.left?.isDown) {
        moveX = -1;
      } else if (keyD?.isDown || cursors.right?.isDown) {
        moveX = 1;
      }
    }

    // Joystick movement (mobile) - horizontal component
    if (this.isMobile && this.joystickActive) {
      moveX = this.joystickVector.x;
    }

    // Apply horizontal movement - stay on the trail
    if (moveX !== 0) {
      this.hiker.x = Phaser.Math.Clamp(
        this.hiker.x + moveX * moveSpeed,
        width * 0.25,  // Can go a bit off trail left
        width * 0.75   // Can go a bit off trail right
      );
    }

    // Check if hiker is off-trail (outside the main trail path)
    const trailLeft = width * 0.35;
    const trailRight = width * 0.65;
    const isOffTrail = this.hiker.x < trailLeft || this.hiker.x > trailRight;

    // Show/hide off-trail warning and apply penalty
    if (isOffTrail && this.hikerData?.isHiking) {
      this.offTrailWarning.setAlpha(1);
      // Energy penalty for being off-trail
      this.hikerData.energy = Math.max(0, this.hikerData.energy - 0.05);
      // Extra fatigue
      if (this.hikerData.moodles) {
        this.hikerData.moodles.fatigue = Math.min(3, this.hikerData.moodles.fatigue + 0.01);
      }
    } else {
      this.offTrailWarning.setAlpha(0);
    }

    // Calculate scroll speed based on pace
    const paceScrollSpeed: Record<string, number> = {
      slow: 60, normal: 100, fast: 150, rush: 200
    };
    const baseScrollSpeed = paceScrollSpeed[this.hikerData?.pace || 'normal'] || 100;

    // Continuous vertical scrolling when hiking (the main game mechanic)
    if (this.hikerData?.isHiking) {
      const scrollSpeed = baseScrollSpeed * (delta / 1000);

      // Scroll ground and trail textures
      this.ground.tilePositionY -= scrollSpeed;
      this.trail.tilePositionY -= scrollSpeed;

      // Move trees down (they scroll toward player, parallax effect)
      this.trees.forEach(tree => {
        tree.y += scrollSpeed * 0.8;
        // Respawn at top when they go off screen
        if (tree.y > height + 50) {
          tree.y = -50;
          // Randomize X position on left or right side
          tree.x = tree.x < width / 2
            ? Phaser.Math.Between(20, width * 0.28)
            : Phaser.Math.Between(width * 0.72, width - 20);
          tree.setScale(Phaser.Math.FloatBetween(0.8, 1.5));
        }
      });

      // Move blazes down
      this.blazes.forEach(blaze => {
        blaze.y += scrollSpeed;
        if (blaze.y > height + 20) {
          blaze.y = -20;
          // Randomize which side of trail
          blaze.x = Math.random() > 0.5
            ? width * 0.3 + Phaser.Math.Between(-20, 10)
            : width * 0.7 + Phaser.Math.Between(-10, 20);
        }
      });

      // Move obstacles down and check collisions
      this.obstacles.forEach((obstacle, index) => {
        obstacle.y += scrollSpeed;

        // Check collision with hiker
        if (!obstacle.getData('hit')) {
          const dist = Phaser.Math.Distance.Between(
            this.hiker.x, this.hiker.y,
            obstacle.x, obstacle.y
          );
          if (dist < 25) {
            // Hit obstacle!
            obstacle.setData('hit', true);
            obstacle.setTint(0xff6666);

            // Apply penalty based on obstacle type
            const type = obstacle.getData('type');
            let penalty = 2;
            let message = 'Tripped on a rock!';

            if (type === 'roots') {
              penalty = 3;
              message = 'Caught foot on roots!';
            } else if (type === 'mud_puddle') {
              penalty = 1;
              message = 'Stepped in mud!';
            } else if (type === 'boulder') {
              penalty = 4;
              message = 'Stumbled over boulder!';
            } else if (type === 'fallen_log') {
              penalty = 2;
              message = 'Tripped on fallen log!';
            }

            if (this.hikerData) {
              this.hikerData.energy = Math.max(0, this.hikerData.energy - penalty);
            }
            this.events.emit('game-event', {
              type: 'warning',
              message
            });
          }
        }

        // Remove when off screen
        if (obstacle.y > height + 50) {
          obstacle.destroy();
          this.obstacles.splice(index, 1);
        }
      });

      // Spawn new obstacles periodically
      this.nextObstacleSpawn -= delta;
      if (this.nextObstacleSpawn <= 0) {
        this.spawnObstacle();
        // Random interval between 2-5 seconds
        this.nextObstacleSpawn = Phaser.Math.Between(2000, 5000);
      }

      // Move water sources down and check for interaction
      this.waterSources.forEach((water, index) => {
        water.y += scrollSpeed;
        const indicator = water.getData('indicator') as Phaser.GameObjects.Text;
        if (indicator) {
          indicator.y = water.y - 25;
        }

        // Check if hiker walks over water source
        if (!water.getData('used')) {
          const dist = Phaser.Math.Distance.Between(
            this.hiker.x, this.hiker.y,
            water.x, water.y
          );
          if (dist < 40) {
            // Auto-fill water
            water.setData('used', true);
            if (this.hikerData?.inventory) {
              const oldWater = this.hikerData.inventory.water;
              this.hikerData.inventory.water = this.hikerData.inventory.waterCapacity;
              this.events.emit('game-event', {
                type: 'success',
                message: `Filled up at stream! (+${(this.hikerData.inventory.water - oldWater).toFixed(1)}L)`
              });
            }
          }
        }

        // Remove when off screen
        if (water.y > height + 50) {
          if (indicator) indicator.destroy();
          water.destroy();
          this.waterSources.splice(index, 1);
        }
      });

      // Spawn water sources periodically
      this.nextWaterSpawn -= delta;
      if (this.nextWaterSpawn <= 0) {
        this.spawnWaterSource();
        // Water sources every 15-30 seconds
        this.nextWaterSpawn = Phaser.Math.Between(15000, 30000);
      }

      // Move landmarks down
      this.landmarks.forEach((landmark, index) => {
        landmark.y += scrollSpeed;

        // Remove when off screen
        if (landmark.y > height + 100) {
          landmark.destroy();
          this.landmarks.splice(index, 1);
        }
      });

      // Check for landmark spawning at mile intervals
      if (this.hikerData) {
        const currentMile = Math.floor(this.hikerData.mile);
        if (currentMile > this.lastMileLandmark && currentMile > 0) {
          this.lastMileLandmark = currentMile;

          // Spawn a landmark every mile
          const landmarks = [
            { mile: 1, name: 'Stover Creek Shelter', hasWater: true },
            { mile: 2, name: 'Three Forks', hasWater: true },
            { mile: 3, name: 'Long Creek Falls', hasWater: true },
            { mile: 5, name: 'Hawk Mountain Shelter', hasWater: true },
            { mile: 8, name: 'Springer Mountain', hasWater: false },
            { mile: 10, name: 'Black Gap Shelter', hasWater: true },
            { mile: 15, name: 'Gooch Mountain Shelter', hasWater: true },
            { mile: 20, name: 'Woody Gap', hasWater: false },
            { mile: 25, name: 'Blood Mountain', hasWater: false },
            { mile: 30, name: 'Neels Gap', hasWater: true },
          ];

          const landmark = landmarks.find(l => l.mile === currentMile);
          if (landmark) {
            this.spawnLandmark(currentMile, landmark.name, landmark.hasWater);
            this.events.emit('game-event', {
              type: 'milestone',
              message: `Approaching ${landmark.name}!`
            });
          } else {
            // Generic mile marker
            this.spawnLandmark(currentMile, `Mile ${currentMile}`, false);
          }
        }
      }

      // Hiker bob animation while hiking
      this.hiker.y = height * 0.65 + Math.sin(time / 80) * 3;
    } else {
      // Keep hiker centered when not hiking
      this.hiker.y = height * 0.65;
    }

    // Fog movement
    this.fogSprites.forEach(fog => {
      fog.x += Math.sin(time / 1000 + fog.y) * 0.2;
    });
  }
}
