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

    // Handle movement (keyboard or joystick)
    const moveSpeed = 200 * (delta / 1000); // pixels per second
    let moveX = 0;
    let moveY = 0;

    // Keyboard movement
    const keys = this.input.keyboard;
    if (keys) {
      const keyW = keys.addKey('W');
      const keyA = keys.addKey('A');
      const keyS = keys.addKey('S');
      const keyD = keys.addKey('D');
      const cursors = keys.createCursorKeys();

      // Horizontal movement (A/D or Left/Right)
      if (keyA?.isDown || cursors.left?.isDown) {
        moveX = -1;
      } else if (keyD?.isDown || cursors.right?.isDown) {
        moveX = 1;
      }

      // Vertical movement (W/S or Up/Down)
      if (keyW?.isDown || cursors.up?.isDown) {
        moveY = -1;
      } else if (keyS?.isDown || cursors.down?.isDown) {
        moveY = 1;
      }
    }

    // Joystick movement (mobile)
    if (this.isMobile && this.joystickActive) {
      moveX = this.joystickVector.x;
      moveY = this.joystickVector.y;
    }

    // Apply movement with bounds checking
    if (moveX !== 0) {
      this.hiker.x = Phaser.Math.Clamp(
        this.hiker.x + moveX * moveSpeed,
        width * 0.32,
        width * 0.68
      );
    }

    if (moveY !== 0) {
      this.hiker.y = Phaser.Math.Clamp(
        this.hiker.y + moveY * moveSpeed,
        height * 0.3,
        height * 0.8
      );
    }

    // Scroll the trail to simulate forward movement
    if (this.hikerData?.isHiking) {
      const scrollSpeed = 0.5 * delta / 16; // Adjust for frame rate
      this.ground.tilePositionY -= scrollSpeed;
      this.trail.tilePositionY -= scrollSpeed;

      // Move trees up (parallax)
      this.trees.forEach(tree => {
        tree.y -= scrollSpeed * 0.8;
        if (tree.y < -50) {
          tree.y = this.cameras.main.height + 50;
          tree.x = tree.x < this.cameras.main.width / 2
            ? Phaser.Math.Between(20, this.cameras.main.width * 0.25)
            : Phaser.Math.Between(this.cameras.main.width * 0.75, this.cameras.main.width - 20);
        }
      });

      // Move blazes
      this.blazes.forEach(blaze => {
        blaze.y -= scrollSpeed;
        if (blaze.y < -20) {
          blaze.y = this.cameras.main.height + 20;
        }
      });

      // Hiker bob animation when hiking
      const baseY = this.hiker.y;
      this.hiker.y = baseY + Math.sin(time / 100) * 2;
    }

    // Fog movement
    this.fogSprites.forEach(fog => {
      fog.x += Math.sin(time / 1000 + fog.y) * 0.2;
    });
  }
}
