import Phaser from 'phaser';
import { gameStorage, type HikerSaveData, type GameSaveData } from '../storage/GameStorage';
import { bubbleSystem, type BubbleNPC } from '../systems/BubbleSystem';
import { journalSystem } from '../systems/JournalSystem';
import {
  SHELTERS, TOWNS, TERRAIN_ZONES, STATE_BOUNDARIES, PEAKS, TRAIL_TOTAL_MILES,
  getTerrainZone, getCurrentState, getNextShelter, getNextTown, getElevationAtMile,
  getZoneIdForMile,
  type Shelter, type Town, type TerrainZone
} from '../data/TrailData';
import { networkManager, MessageType, type PlayerState } from '../network/NetworkManager';
import { gpsService, type RealHikerGhost } from '../network/GPSService';
import { zoneManager } from '../network/ZoneManager';
import { getGlobalTime, globalTime, getSkyColor, getAmbientLight, formatGameTime, type GameTime } from '../systems/GlobalTime';
import { getWeatherForZone, formatWeather, getWeatherAlert, type Weather } from '../systems/DeterministicWeather';

interface GameData {
  hikerName: string;
  trailName?: string;
  build: string;
  loadSave?: boolean;
  multiplayer?: boolean;
  isHost?: boolean;
  mmoMode?: boolean;  // True = join global trail (UTC time, no speed controls)
}

export class GameScene extends Phaser.Scene {
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

  // Wildlife
  private wildlife: Phaser.GameObjects.Sprite[] = [];
  private nextWildlifeSpawn: number = 0;

  // Trail magic
  private trailMagicItems: Phaser.GameObjects.Container[] = [];
  private nextTrailMagicSpawn: number = 0;

  // Sky/atmosphere
  private skyOverlay!: Phaser.GameObjects.Rectangle;
  private sunMoon!: Phaser.GameObjects.Sprite;

  // Other hikers
  private otherHikers: Phaser.GameObjects.Container[] = [];
  private nextHikerSpawn: number = 0;

  // Bubble system - persistent NPC hikers
  private bubbleSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private lastBubbleSimulation: number = 0;
  private bubbleSimulationInterval: number = 5000; // 5 seconds

  // Viewpoints
  private viewpoints: Phaser.GameObjects.Container[] = [];

  // Trail plants
  private plants: Phaser.GameObjects.Sprite[] = [];

  // Random events
  private nextEventCheck: number = 0;
  private activeEvents: Set<string> = new Set();

  // Shelter system
  private nearShelter: boolean = false;
  private currentShelterName: string = '';

  // Night visibility
  private nightOverlay!: Phaser.GameObjects.Rectangle;
  private headlampLight!: Phaser.GameObjects.Graphics;

  // Elevation
  private elevationData: { mile: number; elevation: number }[] = [];
  private elevationText!: Phaser.GameObjects.Text;

  // Town system
  // Standard store inventory for towns with stores
  private storeInventory = [
    { id: 'ramen', name: 'Ramen Noodles', price: 1, type: 'food', calories: 400, weight: 0.1, servings: 1 },
    { id: 'oatmeal', name: 'Instant Oatmeal (3pk)', price: 4, type: 'food', calories: 300, weight: 0.3, servings: 3 },
    { id: 'trailMix', name: 'Trail Mix', price: 6, type: 'food', calories: 600, weight: 0.3, servings: 2 },
    { id: 'snickers', name: 'Snickers Bar', price: 2, type: 'food', calories: 250, weight: 0.1, servings: 1 },
    { id: 'tuna', name: 'Tuna Packet', price: 3, type: 'food', calories: 200, weight: 0.15, servings: 1 },
    { id: 'peanutButter', name: 'Peanut Butter', price: 5, type: 'food', calories: 800, weight: 0.4, servings: 4 },
    { id: 'tortillas', name: 'Tortillas (6pk)', price: 4, type: 'food', calories: 150, weight: 0.3, servings: 6 },
    { id: 'pepperoni', name: 'Pepperoni', price: 5, type: 'food', calories: 500, weight: 0.2, servings: 3 },
    { id: 'gatorade', name: 'Gatorade Powder', price: 4, type: 'food', calories: 100, weight: 0.2, servings: 4 },
    { id: 'cliff', name: 'Clif Bar', price: 3, type: 'food', calories: 250, weight: 0.1, servings: 1 },
  ];

  // Helper to get store inventory for any town with a store
  getTownStoreInventory(_town: Town) {
    return this.storeInventory;
  }

  // Helper to get hostel price (standard rate)
  getTownHostelPrice(_town: Town): number {
    return 45; // Standard hostel rate
  }
  private visitedTowns: Set<string> = new Set();
  private townPromptShown: boolean = false;

  // Camera follow offset
  private cameraTarget: number = 0;

  // Mobile controls
  private joystickBase!: Phaser.GameObjects.Arc;
  private joystickThumb!: Phaser.GameObjects.Arc;
  private joystickActive: boolean = false;
  private joystickVector: { x: number; y: number } = { x: 0, y: 0 };
  private isMobile: boolean = false;

  // Mobile buttons (stored for resize handling)
  private mobileButtons: {
    hike?: { button: Phaser.GameObjects.Arc; text: Phaser.GameObjects.Text };
    eat?: { button: Phaser.GameObjects.Arc; text: Phaser.GameObjects.Text };
    drink?: { button: Phaser.GameObjects.Arc; text: Phaser.GameObjects.Text };
    guide?: { button: Phaser.GameObjects.Arc; text: Phaser.GameObjects.Text };
  } = {};

  // Game state
  private isConnected: boolean = false;
  private gameState: any = null;
  private isIncapacitated: boolean = false;
  private deathOverlay: Phaser.GameObjects.Container | null = null;

  // Save system
  private autoSaveTimer: Phaser.Time.TimerEvent | null = null;
  private lastSaveTime: number = 0;
  private loadFromSave: boolean = false;

  // Game speed (Project Zomboid style - slower default for immersion)
  private gameSpeed: number = 0.5;
  private gameSpeedText!: Phaser.GameObjects.Text;
  private readonly SPEED_OPTIONS = [0.25, 0.5, 1, 2, 4, 8];

  // Multiplayer
  private isMultiplayer: boolean = false;
  private isHost: boolean = false;
  private isMMOMode: boolean = false;  // True = global time, no speed controls
  private otherPlayerSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private trailName: string = '';

  // Global time (MMO mode)
  private globalGameTime: GameTime | null = null;
  private globalWeather: Weather | null = null;
  private lastWeatherCheck: number = 0;
  private weatherText!: Phaser.GameObjects.Text;

  // Real hiker ghosts (GPS data)
  private ghostSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private lastGhostUpdate: number = 0;
  private readonly GHOST_UPDATE_INTERVAL = 5000; // Update ghosts every 5 seconds

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: GameData) {
    this.registry.set('hikerName', data.hikerName);
    this.registry.set('build', data.build);
    this.loadFromSave = data.loadSave || false;
    this.isMultiplayer = data.multiplayer || false;
    this.isHost = data.isHost || false;
    this.isMMOMode = data.mmoMode || false;
    this.trailName = data.trailName || '';
  }

  create() {
    const { width, height } = this.cameras.main;

    // Create sky overlay for day/night cycle (behind everything)
    this.skyOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x87CEEB, 0.3);
    this.skyOverlay.setDepth(-10);

    // Create sun/moon indicator
    this.sunMoon = this.add.sprite(width - 40, 40, 'sun');
    this.sunMoon.setDepth(200);
    this.sunMoon.setScale(0.8);

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

    // Create hiker sprite with animation
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

    // Spawn initial wildlife
    this.generateWildlife();

    // Generate trail plants for visual variety
    this.generatePlants();

    // Night overlay (for darkness effect)
    this.nightOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000033, 0);
    this.nightOverlay.setDepth(150);

    // Headlamp light (visible at night)
    this.headlampLight = this.add.graphics();
    this.headlampLight.setDepth(149);

    // Elevation text (bottom left)
    this.elevationText = this.add.text(10, height - 30, '⛰️ 3,782 ft', {
      font: '12px Courier',
      color: '#aaaaaa',
      backgroundColor: '#000000aa',
      padding: { x: 4, y: 2 }
    }).setScrollFactor(0).setDepth(200);

    // Game speed indicator (top right, below sun/moon)
    // In MMO mode, show global time instead of speed controls
    if (this.isMMOMode) {
      const time = getGlobalTime();
      this.gameSpeedText = this.add.text(width - 10, 70, `🌐 ${formatGameTime(time)}`, {
        font: '14px Courier',
        color: '#44aaff',
        backgroundColor: '#000000aa',
        padding: { x: 6, y: 3 }
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(200);

      // Subscribe to global time updates
      globalTime.start();
      globalTime.onTimeChange((gameTime) => {
        this.globalGameTime = gameTime;
        this.gameSpeedText.setText(`🌐 ${formatGameTime(gameTime)}`);

        // Sync gameState.time from global time
        if (this.gameState) {
          this.gameState.time.hour = gameTime.hour;
          this.gameState.time.minute = gameTime.minute;
          this.gameState.time.day = gameTime.day;
          this.gameState.phase = gameTime.phase;
        }
      });
    } else {
      this.gameSpeedText = this.add.text(width - 10, 70, '▷ 0.5x', {
        font: '14px Courier',
        color: '#88aacc',
        backgroundColor: '#000000aa',
        padding: { x: 6, y: 3 }
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(200);
    }

    // Weather display (MMO mode shows zone-specific weather)
    if (this.isMMOMode) {
      this.weatherText = this.add.text(width - 10, 95, '☀️ Clear 65°F', {
        font: '12px Courier',
        color: '#aaddff',
        backgroundColor: '#000000aa',
        padding: { x: 4, y: 2 }
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(200);
    }

    // Start hiking hint (shown until player starts hiking)
    const startHint = this.add.text(width / 2, height * 0.25,
      'Press SPACE to start hiking\n\n' +
      'A/D or ←/→ to stay on trail\n' +
      '1-4 to set hiking pace\n' +
      '[ ] or +/- to change game speed\n' +
      'G to open Field Guide', {
      font: '14px Courier',
      color: '#4a7d5a',
      backgroundColor: '#000000cc',
      padding: { x: 16, y: 12 },
      align: 'center'
    }).setOrigin(0.5).setDepth(200);

    // Hide hint once hiking starts
    this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        if (this.hikerData?.isHiking) {
          startHint.destroy();
        }
      }
    });

    // Initialize elevation data for the first 30 miles
    this.initElevationData();

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

    // Handle resize events for responsive layout
    this.scale.on('resize', this.onResize, this);

    // Listen for town exit events
    this.events.on('town-exit', (data: { hiker: any }) => {
      // Update hiker data from town
      this.hikerData = data.hiker;
      this.townPromptShown = false;

      // Resume the game
      this.events.emit('state-update', {
        hiker: this.hikerData,
        game: this.gameState
      });
    });

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
    const obstacleTypes = ['rock', 'roots', 'mud_puddle', 'boulder', 'fallen_log', 'river_crossing']; // Added river_crossing
    
    // River crossing more common in Maine/North
    let type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    if (this.hikerData && this.hikerData.mile > 2000 && Math.random() < 0.2) {
       type = 'river_crossing';
    }

    // Spawn at top of screen, random position on trail
    const x = width * 0.35 + Math.random() * (width * 0.3);
    const y = -30;

    const obstacle = this.add.sprite(x, y, type === 'river_crossing' ? 'stream_crossing' : type); // Use stream sprite for river
    obstacle.setDepth(5);
    obstacle.setScale(type === 'river_crossing' ? 1.2 : 0.8);
    obstacle.setData('type', type);
    obstacle.setData('hit', false);
    this.obstacles.push(obstacle);
  }

  spawnLandmark(mile: number, name: string, hasWater: boolean = false, isTown: boolean = false) {
    const { width } = this.cameras.main;
    const container = this.add.container(width / 2, -60);

    const bg = this.add.rectangle(0, 0, 200, 50, 0x2e5339, 0.9);
    bg.setStrokeStyle(2, 0x4a7d5a);
    container.add(bg);

    const nameText = this.add.text(0, -8, name, {
      font: '12px Courier',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(nameText);

    const mileText = this.add.text(0, 10, `Mile ${mile.toFixed(1)}`, {
      font: '10px Courier',
      color: '#aaffaa'
    }).setOrigin(0.5);
    container.add(mileText);

    if (hasWater) {
      const waterIcon = this.add.text(80, 0, '💧', {
        font: '16px Arial'
      }).setOrigin(0.5);
      container.add(waterIcon);
    }

    // Add Hiker Box for shelters and towns
    if (name.includes('Shelter') || isTown) {
      const boxBtn = this.add.rectangle(-80, 0, 30, 30, 0x8b4513);
      boxBtn.setStrokeStyle(1, 0xcd853f);
      boxBtn.setInteractive();
      
      const boxIcon = this.add.text(-80, 0, '📦', { font: '16px Arial' }).setOrigin(0.5);
      
      boxBtn.on('pointerdown', () => this.openHikerBox(name, mile));
      boxBtn.on('pointerover', () => boxBtn.setFillStyle(0xa0522d));
      boxBtn.on('pointerout', () => boxBtn.setFillStyle(0x8b4513));
      
      container.add([boxBtn, boxIcon]);
    }

    container.setDepth(50);
    container.setData('mile', mile);
    container.setData('hasWater', hasWater);
    
    this.landmarks.push(container);
  }

  async openHikerBox(locationName: string, mile: number) {
    if (!this.hikerData) return;
    
    // Create a deterministic ID for this box based on location
    const boxId = `box_${mile.toFixed(1).replace('.', '_')}`;
    
    // Pause game loop
    this.scene.pause('GameScene');
    
    // Fetch box data (async)
    const boxData = await networkManager.getHikerBox(boxId, locationName);
    
    // Launch scene
    this.scene.launch('HikerBoxScene', {
      boxData: boxData,
      playerInventory: this.hikerData.inventory
    });
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

  generateWildlife() {
    const { width, height } = this.cameras.main;

    // Spawn a few initial wildlife in the woods
    for (let i = 0; i < 3; i++) {
      this.spawnWildlife(Phaser.Math.Between(0, height));
    }
  }

  spawnWildlife(startY: number = -50) {
    const { width } = this.cameras.main;

    // Wildlife types with their behaviors
    const wildlifeTypes = [
      { sprite: 'deer', scale: 0.8, speed: 0.3, side: 'either', rare: false },
      { sprite: 'chipmunk', scale: 0.5, speed: 0.8, side: 'either', rare: false },
      { sprite: 'cardinal', scale: 0.4, speed: 1.2, side: 'either', rare: false },
      { sprite: 'blue_jay', scale: 0.4, speed: 1.0, side: 'either', rare: false },
      { sprite: 'turkey', scale: 0.7, speed: 0.4, side: 'either', rare: false },
      { sprite: 'bear', scale: 1.0, speed: 0.2, side: 'either', rare: true },
      { sprite: 'snake', scale: 0.5, speed: 0.1, side: 'trail', rare: true },
    ];

    // Pick a wildlife type (rare ones less likely)
    let type;
    if (Math.random() < 0.1) {
      // 10% chance for rare wildlife
      type = wildlifeTypes.filter(w => w.rare)[Math.floor(Math.random() * 2)];
    } else {
      type = wildlifeTypes.filter(w => !w.rare)[Math.floor(Math.random() * 5)];
    }

    // Determine position
    let x: number;
    if (type.side === 'trail') {
      // On or near the trail (for snakes)
      x = width * 0.35 + Math.random() * (width * 0.3);
    } else {
      // In the woods on either side
      x = Math.random() < 0.5
        ? Phaser.Math.Between(20, width * 0.28)
        : Phaser.Math.Between(width * 0.72, width - 20);
    }

    const animal = this.add.sprite(x, startY, type.sprite);
    animal.setScale(type.scale);
    animal.setDepth(7);
    animal.setData('type', type.sprite);
    animal.setData('speed', type.speed);
    animal.setData('movementTimer', 0);
    animal.setData('targetX', x);

    // Flip sprite based on which side it's on
    if (x > width / 2) {
      animal.setFlipX(true);
    }

    this.wildlife.push(animal);

    // Bear encounter warning
    if (type.sprite === 'bear') {
      // Log bear encounter to journal
      if (this.hikerData && this.gameState) {
        journalSystem.addEntry(
          'encounter',
          'Bear encounter!',
          'A black bear appeared on the trail! Heart pounding...',
          this.gameState.time.day,
          this.gameState.time.hour,
          this.hikerData.mile
        );
      }

      // Pause game and launch encounter
      this.scene.pause();
      this.scene.launch('BearEncounterScene');
    }
  }

  spawnTrailMagic() {
    const { width } = this.cameras.main;

    // Trail magic items
    const magicTypes = [
      { name: 'Cooler of Sodas', emoji: '🥤', calories: 150, water: 0.5 },
      { name: 'Box of Snacks', emoji: '🍪', calories: 400, water: 0 },
      { name: 'Fresh Fruit', emoji: '🍎', calories: 200, water: 0.2 },
      { name: 'Cold Beer', emoji: '🍺', calories: 150, water: 0.3 },
      { name: 'Homemade Cookies', emoji: '🍪', calories: 300, water: 0 },
      { name: 'Hot Dogs!', emoji: '🌭', calories: 500, water: 0 },
    ];

    const magic = magicTypes[Math.floor(Math.random() * magicTypes.length)];

    // Create container for trail magic
    const container = this.add.container(width / 2, -60);

    // Background
    const bg = this.add.rectangle(0, 0, 180, 60, 0x4a7d5a, 0.9);
    bg.setStrokeStyle(2, 0xffd700);
    container.add(bg);

    // Emoji
    const emoji = this.add.text(-60, 0, magic.emoji, {
      font: '28px Arial'
    }).setOrigin(0.5);
    container.add(emoji);

    // Text
    const text = this.add.text(10, -10, 'TRAIL MAGIC!', {
      font: 'bold 12px Courier',
      color: '#ffd700'
    }).setOrigin(0.5);
    container.add(text);

    const nameText = this.add.text(10, 8, magic.name, {
      font: '10px Courier',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(nameText);

    container.setDepth(50);
    container.setData('magic', magic);
    container.setData('collected', false);

    this.trailMagicItems.push(container);
  }

  updateDayNightCycle() {
    if (!this.gameState) return;

    const { width } = this.cameras.main;
    let hour: number;
    let skyColor: number;
    let skyAlpha: number;
    let useSun = true;

    // In MMO mode, use GlobalTime for accurate sky colors
    if (this.isMMOMode && this.globalGameTime) {
      hour = this.globalGameTime.hour;
      skyColor = getSkyColor(this.globalGameTime);

      // Ambient light determines alpha (brighter = more transparent overlay)
      const ambient = getAmbientLight(this.globalGameTime);
      skyAlpha = 0.1 + (1 - ambient) * 0.4; // 0.1 at day, 0.5 at night

      useSun = !this.globalGameTime.isNight;
    } else {
      hour = this.gameState.time.hour;

      // Determine time of day colors (legacy mode)
      if (hour >= 6 && hour < 8) {
        // Sunrise
        skyColor = 0xFFB347; // Orange
        skyAlpha = 0.3;
        useSun = true;
      } else if (hour >= 8 && hour < 17) {
        // Daytime
        skyColor = 0x87CEEB; // Light blue
        skyAlpha = 0.2;
        useSun = true;
      } else if (hour >= 17 && hour < 19) {
        // Sunset
        skyColor = 0xFF6B6B; // Pink/red
        skyAlpha = 0.35;
        useSun = true;
      } else if (hour >= 19 && hour < 21) {
        // Dusk
        skyColor = 0x4B0082; // Indigo
        skyAlpha = 0.4;
        useSun = false;
      } else {
        // Night
        skyColor = 0x191970; // Midnight blue
        skyAlpha = 0.5;
        useSun = false;
      }
    }

    // Update sky overlay
    this.skyOverlay.setFillStyle(skyColor, skyAlpha);

    // Update sun/moon
    if (useSun) {
      this.sunMoon.setTexture('sun');
      // Sun position based on hour (arc across top)
      const progress = (hour - 6) / 12; // 0 at 6am, 1 at 6pm
      this.sunMoon.x = 60 + progress * (width - 120);
      this.sunMoon.y = 40 + Math.sin(progress * Math.PI) * -20;
    } else {
      this.sunMoon.setTexture('moon');
      // Moon position
      const progress = (hour >= 21 ? hour - 21 : hour + 3) / 9;
      this.sunMoon.x = 60 + progress * (width - 120);
      this.sunMoon.y = 40;
    }
  }

  generatePlants() {
    const { width, height } = this.cameras.main;

    // Plant types available from sprites
    const plantTypes = [
      'fern', 'small_bush', 'tall_grass', 'mountain_laurel',
      'rhododendron', 'bluebells', 'trillium'
    ];

    // Scatter plants along the trail edges
    for (let i = 0; i < 20; i++) {
      const type = plantTypes[Math.floor(Math.random() * plantTypes.length)];
      const side = Math.random() < 0.5 ? 'left' : 'right';
      const x = side === 'left'
        ? Phaser.Math.Between(width * 0.22, width * 0.32)
        : Phaser.Math.Between(width * 0.68, width * 0.78);
      const y = Phaser.Math.Between(0, height);

      const plant = this.add.sprite(x, y, type);
      plant.setScale(Phaser.Math.FloatBetween(0.5, 0.8));
      plant.setDepth(3);
      plant.setAlpha(0.9);
      this.plants.push(plant);
    }
  }

  spawnOtherHiker() {
    const { width } = this.cameras.main;

    // Hiker names and trail names
    const trailNames = [
      'Trailblazer', 'Wanderer', 'Happy Feet', 'Mountain Goat',
      'Barefoot', 'Nemo', 'Turtle', 'Roadrunner', 'Sherpa',
      'Patches', 'Compass', 'Maverick', 'Steady', 'Blaze'
    ];

    const greetings = [
      'Hey there! Beautiful day, huh?',
      'How many miles you doing today?',
      'There\'s water about a mile ahead!',
      'Watch out for the rocks up ahead.',
      'I just saw a deer back there!',
      'Happy trails!',
      'Stay hydrated out there!',
      'The shelter up ahead has a great view!',
      'You got this! Keep going!',
      'Trail magic at the next road crossing!'
    ];

    const name = trailNames[Math.floor(Math.random() * trailNames.length)];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];

    // Create hiker container
    const container = this.add.container(width / 2, -80);

    // Hiker sprite (use same hiker sprite but tinted)
    const hikerSprite = this.add.sprite(0, 0, 'hiker');
    hikerSprite.setScale(1.5);
    hikerSprite.setTint(Phaser.Math.Between(0x888888, 0xffffff));
    container.add(hikerSprite);

    // Trail name above
    const nameTag = this.add.text(0, -30, `"${name}"`, {
      font: 'bold 10px Courier',
      color: '#ffffff',
      backgroundColor: '#2e5339',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);
    container.add(nameTag);

    container.setDepth(9);
    container.setData('name', name);
    container.setData('greeting', greeting);
    container.setData('greeted', false);
    container.setData('direction', Math.random() < 0.7 ? 'nobo' : 'sobo'); // 70% northbound

    this.otherHikers.push(container);
  }

  spawnViewpoint() {
    const { width } = this.cameras.main;

    const viewNames = [
      'Springer Mountain View',
      'Blood Mountain Vista',
      'Sunrise Overlook',
      'Blue Ridge Panorama',
      'Valley View',
      'Mountain Majesty Point'
    ];

    const name = viewNames[Math.floor(Math.random() * viewNames.length)];

    // Create viewpoint container
    const container = this.add.container(width / 2, -60);

    // Background (scenic view represented)
    const bg = this.add.rectangle(0, 0, 220, 70, 0x355E3B, 0.9);
    bg.setStrokeStyle(3, 0x87CEEB);
    container.add(bg);

    // View emoji
    const emoji = this.add.text(-80, 0, '🏔️', {
      font: '24px Arial'
    }).setOrigin(0.5);
    container.add(emoji);

    // Text
    const viewLabel = this.add.text(10, -15, '📍 VIEWPOINT', {
      font: 'bold 11px Courier',
      color: '#87CEEB'
    }).setOrigin(0.5);
    container.add(viewLabel);

    const nameText = this.add.text(10, 5, name, {
      font: '10px Courier',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(nameText);

    const bonusText = this.add.text(10, 20, '+Morale', {
      font: '9px Courier',
      color: '#aaffaa'
    }).setOrigin(0.5);
    container.add(bonusText);

    container.setDepth(50);
    container.setData('name', name);
    container.setData('visited', false);

    this.viewpoints.push(container);
  }

  checkRandomEvents() {
    if (!this.hikerData?.isHiking) return;

    // Random trail events that can occur
    const events = [
      {
        id: 'blister',
        chance: 0.02,
        condition: () => this.hikerData.currentDayMiles > 10,
        trigger: () => {
          if (!this.activeEvents.has('blister')) {
            this.activeEvents.add('blister');
            this.hikerData.energy = Math.max(0, this.hikerData.energy - 10);
            this.hikerData.moodles.fatigue = Math.min(3, this.hikerData.moodles.fatigue + 1);
            this.events.emit('game-event', {
              type: 'warning',
              message: '🦶 Developed a blister! Pace yourself...'
            });
          }
        }
      },
      {
        id: 'second_wind',
        chance: 0.01,
        condition: () => this.hikerData.energy < 40,
        trigger: () => {
          this.hikerData.energy = Math.min(100, this.hikerData.energy + 20);
          this.hikerData.moodles.morale = Math.min(100, this.hikerData.moodles.morale + 10);
          this.events.emit('game-event', {
            type: 'success',
            message: '💪 Second wind! Feeling energized!'
          });
        }
      },
      {
        id: 'scenic_moment',
        chance: 0.03,
        condition: () => true,
        trigger: () => {
          this.hikerData.moodles.morale = Math.min(100, this.hikerData.moodles.morale + 5);
          const sights = [
            { msg: '🦌 Spotted a doe with her fawn!', title: 'Wildlife sighting' },
            { msg: '🌈 Beautiful rainbow in the distance!', title: 'Rainbow on trail' },
            { msg: '🦅 Eagle soaring overhead!', title: 'Eagle sighting' },
            { msg: '🌸 Wildflowers blooming trailside!', title: 'Wildflower bloom' },
            { msg: '🍄 Interesting mushrooms on a log!', title: 'Trail treasures' },
            { msg: '🦋 Butterflies dancing around!', title: 'Butterfly moment' }
          ];
          const sight = sights[Math.floor(Math.random() * sights.length)];
          this.events.emit('game-event', {
            type: 'info',
            message: sight.msg
          });

          // Log scenic moments to journal (occasionally)
          if (Math.random() < 0.5) {
            journalSystem.addEntry(
              'scenic',
              sight.title,
              sight.msg,
              this.gameState.time.day,
              this.gameState.time.hour,
              this.hikerData.mile,
              { weather: this.gameState.weather }
            );
          }
        }
      },
      {
        id: 'stumble',
        chance: 0.02,
        condition: () => this.hikerData.pace === 'rush' || this.hikerData.pace === 'fast',
        trigger: () => {
          this.hikerData.energy = Math.max(0, this.hikerData.energy - 3);
          this.events.emit('game-event', {
            type: 'warning',
            message: '😰 Nearly twisted an ankle! Slow down?'
          });
        }
      },
      {
        id: 'good_vibes',
        chance: 0.02,
        condition: () => this.hikerData.moodles.morale > 60,
        trigger: () => {
          this.hikerData.moodles.morale = Math.min(100, this.hikerData.moodles.morale + 10);
          const vibes = [
            '🎵 Humming a trail song!',
            '😊 Feeling grateful to be out here!',
            '✨ In the zone! Great hiking today!',
            '🌲 Loving the forest vibes!'
          ];
          this.events.emit('game-event', {
            type: 'success',
            message: vibes[Math.floor(Math.random() * vibes.length)]
          });
        }
      }
    ];

    // Check each event
    events.forEach(event => {
      if (Math.random() < event.chance && event.condition()) {
        event.trigger();
      }
    });
  }

  initElevationData() {
    // Build elevation data from real shelter elevations for accurate interpolation
    this.elevationData = SHELTERS.map(s => ({
      mile: s.mile,
      elevation: s.elevation
    }));
  }

  getCurrentElevation(): number {
    if (!this.hikerData) return 3782;

    const mile = this.hikerData.mile;

    // Use real trail data for elevation
    return getElevationAtMile(mile);
  }

  // Get current terrain zone for visual/gameplay changes
  getCurrentTerrainZone(): TerrainZone | undefined {
    if (!this.hikerData) return undefined;
    return getTerrainZone(this.hikerData.mile);
  }

  // Get current state
  getCurrentTrailState(): string {
    if (!this.hikerData) return 'GA';
    return getCurrentState(this.hikerData.mile);
  }

  // Terrain zone color palettes for visual variety across 2,197 miles
  private lastZoneType: string = '';

  getTerrainColors(zoneType: string): { tree: number; ground: number; sky: number } {
    const palettes: Record<string, { tree: number; ground: number; sky: number }> = {
      // Georgia
      'ga_forest': { tree: 0x2e5339, ground: 0x4a3728, sky: 0x87CEEB },
      'ga_highlands': { tree: 0x355E3B, ground: 0x3d2817, sky: 0x7EC8E3 },

      // North Carolina
      'nc_nantahala': { tree: 0x2d4a35, ground: 0x453020, sky: 0x87CEEB },
      'nc_approach': { tree: 0x3a5540, ground: 0x4a3525, sky: 0x82C4E3 },

      // Great Smokies - misty, spruce-fir
      'smokies': { tree: 0x1a3d2a, ground: 0x2d1f14, sky: 0x708090 },

      // NC/TN Highlands
      'nc_tn_highlands': { tree: 0x3d5c45, ground: 0x4d3d2d, sky: 0x87CEEB },
      'roan_highlands': { tree: 0x4a6b52, ground: 0x6b7d5a, sky: 0x99D9EA },
      'tn_damascus': { tree: 0x355E3B, ground: 0x4a3728, sky: 0x87CEEB },

      // Virginia
      'va_grayson': { tree: 0x4d6b54, ground: 0x6b7d5a, sky: 0xA3E4F8 },
      'va_central': { tree: 0x3a5d42, ground: 0x5a4a3a, sky: 0x87CEEB },
      'va_blue_ridge': { tree: 0x3d5a45, ground: 0x554535, sky: 0x7BC8EB },
      'va_priest': { tree: 0x2d4a35, ground: 0x4a3a2a, sky: 0x87CEEB },
      'shenandoah': { tree: 0x4a6b52, ground: 0x5d4d3d, sky: 0x89D0EF },
      'va_roller': { tree: 0x3d5a45, ground: 0x5a4a3a, sky: 0x87CEEB },

      // Mid-Atlantic
      'harpers_md': { tree: 0x4a6352, ground: 0x6a5a4a, sky: 0x87CEEB },
      'pa_south': { tree: 0x3a5540, ground: 0x6a5a4a, sky: 0x7EC8E3 },
      'pa_rocks': { tree: 0x4a5a4a, ground: 0x7a6a5a, sky: 0x87CEEB },

      // NJ/NY
      'nj_ridges': { tree: 0x3d5c45, ground: 0x4a4a3a, sky: 0x87CEEB },
      'ny_highlands': { tree: 0x3a5540, ground: 0x5a4a3a, sky: 0x7BC8EB },

      // New England
      'ct_ridges': { tree: 0x4a6b52, ground: 0x6a5a4a, sky: 0x89D0EF },
      'ma_berkshires': { tree: 0x3d5c45, ground: 0x5a5a4a, sky: 0x7BC8EB },
      'vt_green': { tree: 0x2d5a35, ground: 0x4a3a2a, sky: 0x87CEEB },

      // White Mountains - granite, alpine
      'nh_approach': { tree: 0x3d5c45, ground: 0x6a6a5a, sky: 0x7BC8EB },
      'whites': { tree: 0x3a4a3a, ground: 0x8a8a7a, sky: 0x99D9EA },

      // Maine
      'me_mahoosuc': { tree: 0x2a4a32, ground: 0x5a4a3a, sky: 0x7EC8E3 },
      'me_lakes': { tree: 0x1a4a28, ground: 0x4a3a28, sky: 0x89D0EF },
      'me_100mile': { tree: 0x1a3d25, ground: 0x3a2a1a, sky: 0x87CEEB },
      'katahdin': { tree: 0x3a4a3a, ground: 0x7a7a6a, sky: 0xA3E4F8 },
    };

    return palettes[zoneType] || { tree: 0x355E3B, ground: 0x4a3728, sky: 0x87CEEB };
  }

  updateTerrainVisuals() {
    const zone = this.getCurrentTerrainZone();
    if (!zone || zone.type === this.lastZoneType) return;

    this.lastZoneType = zone.type;
    const colors = this.getTerrainColors(zone.type);

    // Update tree tints based on zone
    this.trees.forEach(tree => {
      tree.setTint(colors.tree);
    });

    // Update ground tint
    this.ground?.setTint(colors.ground);

    // Update sky overlay
    this.skyOverlay?.setFillStyle(colors.sky, 0.3);

    // Emit zone change event
    this.events.emit('game-event', {
      type: 'zone',
      message: `📍 ${zone.name} - ${zone.description}`
    });
  }

  updateNightVisibility() {
    if (!this.gameState) return;

    const hour = this.gameState.time.hour;
    const { width, height } = this.cameras.main;

    // Determine darkness level
    let darkness = 0;

    if (hour >= 21 || hour < 5) {
      // Full night
      darkness = 0.7;
    } else if (hour >= 19 && hour < 21) {
      // Dusk
      darkness = (hour - 19) / 2 * 0.7;
    } else if (hour >= 5 && hour < 7) {
      // Dawn
      darkness = (7 - hour) / 2 * 0.7;
    }

    // Update night overlay
    this.nightOverlay.setAlpha(darkness);

    // Update headlamp effect
    this.headlampLight.clear();

    if (darkness > 0.3 && this.hikerData?.isHiking) {
      // Draw headlamp cone
      this.headlampLight.fillStyle(0xffffcc, 0.3);
      this.headlampLight.beginPath();

      // Cone shape pointing up from hiker
      const hikerX = this.hiker.x;
      const hikerY = this.hiker.y;

      this.headlampLight.moveTo(hikerX, hikerY - 20);
      this.headlampLight.lineTo(hikerX - 80, hikerY - 200);
      this.headlampLight.lineTo(hikerX + 80, hikerY - 200);
      this.headlampLight.closePath();
      this.headlampLight.fillPath();

      // Add some glow around the cone
      this.headlampLight.fillStyle(0xffffcc, 0.1);
      this.headlampLight.fillCircle(hikerX, hikerY - 100, 100);
    }

    // Night hiking is harder!
    if (darkness > 0.5 && this.hikerData?.isHiking) {
      // Slower progress at night
      // (handled in offlineTick by checking time)
      // More likely to trip on obstacles
    }
  }

  checkShelterProximity() {
    // Check if near a shelter landmark
    this.nearShelter = false;
    this.currentShelterName = '';

    this.landmarks.forEach(landmark => {
      const dist = Math.abs(landmark.y - this.hiker.y);
      const name = landmark.getData('mile') ? `Mile ${landmark.getData('mile')}` : '';

      // Check if this is a shelter (has water = likely a shelter)
      if (dist < 100 && landmark.getData('hasWater') !== undefined) {
        this.nearShelter = true;
        // Try to get the name from the landmark
        const children = landmark.getAll();
        children.forEach((child: any) => {
          if (child.text && !child.text.includes('Mile') && !child.text.includes('💧')) {
            this.currentShelterName = child.text;
          }
        });
      }
    });

    // Bonus recovery when resting near shelter
    if (this.nearShelter && this.hikerData?.isResting) {
      // Double energy recovery at shelters
      this.hikerData.energy = Math.min(100, this.hikerData.energy + 0.2);
      // Better morale at shelters
      this.hikerData.moodles.morale = Math.min(100, this.hikerData.moodles.morale + 0.05);
    }
  }

  checkTownProximity() {
    if (!this.hikerData) return;

    const currentMile = this.hikerData.mile;

    // Check if near any town from real TOWNS data
    TOWNS.forEach(town => {
      const distance = Math.abs(currentMile - town.mile);

      // If within 0.2 miles of town and haven't shown prompt yet
      if (distance < 0.2 && !this.visitedTowns.has(town.name) && !this.townPromptShown) {
        this.townPromptShown = true;
        this.showTownPrompt(town);
      }
    });
  }

  showTownPrompt(town: Town) {
    const { width, height } = this.cameras.main;

    // Stop hiking
    if (this.hikerData) {
      this.hikerData.isHiking = false;
    }

    // Create prompt overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    overlay.setDepth(500);

    const promptBg = this.add.rectangle(width / 2, height / 2, 350, 200, 0x2e5339);
    promptBg.setStrokeStyle(3, 0x4a7d5a);
    promptBg.setDepth(501);

    const title = this.add.text(width / 2, height / 2 - 60, `🏘️ ${town.name}`, {
      font: 'bold 20px Courier',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(502);

    const townDesc = town.notes || `${town.distance} - Services: ${town.services.join(', ')}`;
    const desc = this.add.text(width / 2, height / 2 - 25, townDesc, {
      font: '11px Courier',
      color: '#aaaaaa',
      wordWrap: { width: 300 },
      align: 'center'
    }).setOrigin(0.5).setDepth(502);

    // Enter town button
    const enterBtn = this.add.rectangle(width / 2 - 80, height / 2 + 40, 130, 40, 0x4a7d5a);
    enterBtn.setStrokeStyle(2, 0x6a9d7a);
    enterBtn.setDepth(502);
    enterBtn.setInteractive();

    const enterText = this.add.text(width / 2 - 80, height / 2 + 40, 'Enter Town', {
      font: '14px Courier',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(503);

    // Skip button
    const skipBtn = this.add.rectangle(width / 2 + 80, height / 2 + 40, 130, 40, 0x555555);
    skipBtn.setStrokeStyle(2, 0x777777);
    skipBtn.setDepth(502);
    skipBtn.setInteractive();

    const skipText = this.add.text(width / 2 + 80, height / 2 + 40, 'Keep Hiking', {
      font: '14px Courier',
      color: '#cccccc'
    }).setOrigin(0.5).setDepth(503);

    // Button interactions
    enterBtn.on('pointerover', () => enterBtn.setFillStyle(0x5a9d6a));
    enterBtn.on('pointerout', () => enterBtn.setFillStyle(0x4a7d5a));
    enterBtn.on('pointerdown', () => {
      // Clean up prompt
      overlay.destroy();
      promptBg.destroy();
      title.destroy();
      desc.destroy();
      enterBtn.destroy();
      enterText.destroy();
      skipBtn.destroy();
      skipText.destroy();

      // Enter town
      this.enterTown(town);
    });

    skipBtn.on('pointerover', () => skipBtn.setFillStyle(0x666666));
    skipBtn.on('pointerout', () => skipBtn.setFillStyle(0x555555));
    skipBtn.on('pointerdown', () => {
      // Clean up prompt
      overlay.destroy();
      promptBg.destroy();
      title.destroy();
      desc.destroy();
      enterBtn.destroy();
      enterText.destroy();
      skipBtn.destroy();
      skipText.destroy();

      // Mark as visited (skipped)
      this.visitedTowns.add(town.name);
      this.townPromptShown = false;

      this.events.emit('game-event', {
        type: 'info',
        message: `Passed through ${town.name}`
      });
    });
  }

  enterTown(town: any) {
    // Mark as visiting
    this.visitedTowns.add(town.name);
    
    // Dismiss companion (they wait at edge of town / do their own thing)
    // In a full implementation, they might rejoin later, but for now we reset.
    // Or we could keep them "invited" but inactive.
    // For simplicity: dismiss with message.
    const companion = bubbleSystem.getActiveCompanion();
    if (companion) {
        this.events.emit('game-event', {
            type: 'info',
            message: `${companion.trailName}: "I'm gonna go resupply. Catch you later!"`
        });
        bubbleSystem.dismissCompanion();
    }

    // Launch TownScene as overlay
    this.scene.launch('TownScene', {
      town: town,
      hiker: this.hikerData,
      gameTime: { hour: this.gameState.time.hour, day: this.gameState.time.day }
    });

    this.events.emit('game-event', {
      type: 'success',
      message: `Welcome to ${town.name}!`
    });
  }

  async connectToServer() {
    // For P2P multiplayer, we connect via NetworkManager (already done in MenuScene)
    // For solo play, we just run in offline mode
    if (this.isMultiplayer) {
      this.setupMultiplayer();
    }

    // Always run offline mode for local simulation
    // (In multiplayer, host runs authoritative sim, guests just render)
    this.runOfflineMode();
  }

  /**
   * Setup multiplayer networking
   */
  setupMultiplayer() {
    console.log(`[GameScene] Setting up multiplayer (isHost: ${this.isHost})`);

    // Register for state sync updates (guest only)
    if (!this.isHost) {
      networkManager.on(MessageType.STATE_SYNC, (message) => {
        const players = message.payload.players as PlayerState[];
        // Update local player states from host
        players.forEach(playerState => {
          if (playerState.peerId !== networkManager.localPlayerId) {
            // Store for rendering
            this.updateOtherPlayerSprite(playerState);
          }
        });
      });

      // Receive game speed changes from host
      networkManager.on(MessageType.TIME_UPDATE, (message) => {
        if (message.payload.gameSpeed !== undefined) {
          this.setGameSpeed(message.payload.gameSpeed);
        }
      });
    }

    // Handle new player joining
    networkManager.on(MessageType.PLAYER_JOIN, (message) => {
      const player = message.payload as PlayerState;
      console.log(`[GameScene] Player joined: ${player.name}`);
      this.events.emit('game-event', {
        type: 'success',
        message: `🎒 ${player.name} "${player.trailName}" joined the trail!`
      });
    });

    // Handle player leaving
    networkManager.on(MessageType.PLAYER_LEAVE, (message) => {
      const peerId = message.payload.peerId;
      console.log(`[GameScene] Player left: ${peerId}`);

      // Remove their sprite
      const sprite = this.otherPlayerSprites.get(peerId);
      if (sprite) {
        sprite.destroy();
        this.otherPlayerSprites.delete(peerId);
      }

      // If host left and we're a guest, show disconnect message
      if (message.payload.isHost && !this.isHost) {
        this.events.emit('game-event', {
          type: 'warning',
          message: '⚠️ Host disconnected - returning to menu'
        });
        this.time.delayedCall(2000, () => {
          networkManager.disconnect();
          this.scene.stop('UIScene');
          this.scene.start('MenuScene');
        });
      }
    });
  }

  /**
   * Create or update sprite for another player
   */
  updateOtherPlayerSprite(playerState: PlayerState) {
    const { width, height } = this.cameras.main;

    let container = this.otherPlayerSprites.get(playerState.peerId);

    if (!container) {
      // Create new player container
      container = this.add.container(playerState.x, height * 0.65);
      container.setDepth(9); // Just below local player

      // Player sprite
      const sprite = this.add.sprite(0, 0, 'hiker');
      sprite.setScale(1.8);
      sprite.setTint(0x88aaff); // Blue tint for other players
      container.add(sprite);

      // Name label
      const nameLabel = this.add.text(0, -40, `${playerState.trailName}`, {
        font: '10px Courier',
        color: '#88aaff',
        backgroundColor: '#000000aa',
        padding: { x: 4, y: 2 }
      }).setOrigin(0.5);
      container.add(nameLabel);

      container.setData('sprite', sprite);
      container.setData('nameLabel', nameLabel);
      this.otherPlayerSprites.set(playerState.peerId, container);
    }

    // Update position based on mile difference from local player
    const localMile = this.hikerData?.mile || 0;
    const mileDiff = playerState.mile - localMile;

    // Convert mile difference to Y position (negative = ahead, positive = behind)
    // Each mile is roughly 5000 feet, so scale appropriately
    const yOffset = -mileDiff * 200; // pixels per mile difference
    container.y = (height * 0.65) + yOffset;
    container.x = playerState.x;

    // Only show if within reasonable distance
    const visible = Math.abs(mileDiff) < 0.5; // Within half a mile
    container.setVisible(visible);

    // Animate if hiking
    const sprite = container.getData('sprite') as Phaser.GameObjects.Sprite;
    if (sprite && playerState.isHiking && this.anims.exists('hiker_walk')) {
      sprite.play('hiker_walk', true);
    } else if (sprite) {
      sprite.stop();
      sprite.setTexture('hiker');
    }
  }

  /**
   * Create or update sprite for a real hiker ghost (GPS data)
   * Green tint, semi-transparent - they're hiking IRL!
   */
  updateGhostSprite(ghost: RealHikerGhost) {
    const { width, height } = this.cameras.main;

    let container = this.ghostSprites.get(ghost.id);

    if (!container) {
      // Create new ghost container
      container = this.add.container(width / 2, height * 0.65);
      container.setDepth(8); // Below players but above NPCs

      // Ghost sprite (green tint, semi-transparent)
      const sprite = this.add.sprite(0, 0, 'hiker');
      sprite.setScale(1.6);
      sprite.setTint(0x44ff44); // Green = real hiker!
      sprite.setAlpha(0.6); // Semi-transparent (they're a ghost)
      container.add(sprite);

      // Name label with trail name or "Real Hiker"
      const displayName = ghost.trailName || 'Real Hiker';
      const nameLabel = this.add.text(0, -35, displayName, {
        font: '9px Courier',
        color: '#44ff44',
        backgroundColor: '#000000aa',
        padding: { x: 3, y: 1 }
      }).setOrigin(0.5);
      container.add(nameLabel);

      // Direction badge (NOBO/SOBO)
      const dirBadge = this.add.text(0, -22, ghost.direction, {
        font: '7px Courier',
        color: '#88ff88'
      }).setOrigin(0.5);
      container.add(dirBadge);

      container.setData('sprite', sprite);
      container.setData('nameLabel', nameLabel);
      this.ghostSprites.set(ghost.id, container);
    }

    // Update position based on mile difference from local player
    const localMile = this.hikerData?.mile || 0;
    const mileDiff = ghost.mile - localMile;

    // Convert mile difference to Y position
    const yOffset = -mileDiff * 200; // pixels per mile difference
    container.y = (height * 0.65) + yOffset;
    container.x = width / 2 + (Math.sin(ghost.mile * 10) * 50); // Slight zigzag

    // Only show if within 2 miles (expanded range for ghosts)
    const visible = Math.abs(mileDiff) < 2;
    container.setVisible(visible);

    // Ghosts are always "hiking" since they're real hikers on trail
    const sprite = container.getData('sprite') as Phaser.GameObjects.Sprite;
    if (sprite && this.anims.exists('hiker_walk')) {
      sprite.play('hiker_walk', true);
    }
  }

  /**
   * Update all ghost sprites from GPS service
   */
  updateGhosts() {
    if (!this.hikerData) return;

    const localMile = this.hikerData.mile;
    const nearbyGhosts = gpsService.getHikersInRange(localMile, 5);

    // Track which ghosts we've seen this update
    const seenGhosts = new Set<string>();

    // Update or create ghost sprites
    nearbyGhosts.forEach(ghost => {
      this.updateGhostSprite(ghost);
      seenGhosts.add(ghost.id);
    });

    // Remove ghosts that are no longer nearby
    this.ghostSprites.forEach((container, id) => {
      if (!seenGhosts.has(id)) {
        container.destroy();
        this.ghostSprites.delete(id);
      }
    });
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

        // Restore bubble NPCs if saved
        if (saveData.game.bubbleData) {
          bubbleSystem.deserialize(saveData.game.bubbleData);
          console.log('Restored bubble NPCs from save');
        } else {
          // Generate bubble for existing save without bubble data
          bubbleSystem.generateBubble(this.hikerData.mile, this.hikerData.daysOnTrail);
        }

        // Restore journal entries if saved
        if (saveData.game.journalData) {
          journalSystem.deserialize(saveData.game.journalData);
          console.log('Restored journal entries from save');
        }

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

    // Start GPS service to fetch real hiker data
    gpsService.startPolling();

    // Initialize zone manager with starting mile
    zoneManager.initializeZone(this.hikerData?.mile || 0, networkManager.localPlayerId);

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
          { id: 'headlamp', name: 'Headlamp', weight: 0.2, condition: 100, category: 'misc' },
          { id: 'plb', name: 'Garmin InReach Mini', weight: 0.1, condition: 100, category: 'safety',
            description: 'Satellite communicator with SOS button. Press H in emergencies.' }
        ],
        rescueInsurance: false,  // Can buy in towns for cheaper rescues
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

    // Generate bubble of NPC hikers around the player
    bubbleSystem.generateBubble(this.hikerData.mile, this.hikerData.daysOnTrail);
  }

  private handleBeforeUnload = () => {
    // Synchronous save attempt on page close
    this.saveGame();
  };

  async saveGame(): Promise<void> {
    if (!this.hikerData || !this.gameState) return;

    try {
      // Include bubble and journal data in save
      const gameStateWithSystems = {
        ...this.gameState,
        bubbleData: bubbleSystem.serialize(),
        journalData: journalSystem.serialize()
      };

      await gameStorage.save(
        this.hikerData as HikerSaveData,
        gameStateWithSystems as GameSaveData,
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
    // Stop global time manager if in MMO mode
    if (this.isMMOMode) {
      globalTime.stop();
    }
    if (this.autoSaveTimer) {
      this.autoSaveTimer.destroy();
    }
    // Final save
    this.saveGame();
  }
  
  offlineTick() {
    if (!this.hikerData) return;

    // In MMO mode, time is handled by GlobalTime - skip local time advancement
    if (!this.isMMOMode) {
      // Advance time (scaled by game speed)
      this.gameState.time.minute += this.gameSpeed;
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
    } else {
      // MMO mode: Update deterministic weather based on zone
      const now = Date.now();
      if (now - this.lastWeatherCheck > 30000) { // Check every 30 real seconds
        this.lastWeatherCheck = now;
        const zoneId = getZoneIdForMile(this.hikerData.mile);
        if (zoneId) {
          const weather = getWeatherForZone(zoneId);
          this.globalWeather = weather;
          this.gameState.weather = weather.type;
          this.gameState.temperature = weather.temperature;

          // Update weather display
          if (this.weatherText) {
            this.weatherText.setText(`${weather.icon} ${weather.description} ${weather.temperature}°F`);
          }

          // Update visual effects
          this.updateWeatherEffects(weather.type);

          // Check for weather alerts
          const alert = getWeatherAlert(weather);
          if (alert) {
            this.events.emit('game-event', { type: 'warning', message: alert });
          }
        }
      }
    }

    // Process hiking
    if (this.hikerData.isHiking) {
      const paceSpeed: Record<string, number> = {
        slow: 1.5, normal: 2.0, fast: 2.5, rush: 3.0
      };
      let speed = paceSpeed[this.hikerData.pace] || 2.0;

      // Get speed/energy modifiers from weather
      let speedMod = 1.0;
      let energyMod = 1.0;

      if (this.isMMOMode && this.globalWeather) {
        // Use deterministic weather modifiers
        speedMod = this.globalWeather.hikingSpeedMod;
        energyMod = this.globalWeather.energyDrainMod;
      } else {
        // Use local weather modifiers
        const weatherSpeedMod: Record<string, number> = {
          'clear': 1.0, 'cloudy': 1.0, 'rain_light': 0.85,
          'rain_heavy': 0.7, 'fog': 0.75, 'storm': 0.5
        };
        const weatherEnergyMod: Record<string, number> = {
          'clear': 1.0, 'cloudy': 1.0, 'rain_light': 1.3,
          'rain_heavy': 1.5, 'fog': 1.1, 'storm': 2.0
        };
        speedMod = weatherSpeedMod[this.gameState.weather] || 1.0;
        energyMod = weatherEnergyMod[this.gameState.weather] || 1.0;
      }

      speed *= speedMod;
      const distance = speed / 60; // miles per minute

      this.hikerData.mile = Math.min(TRAIL_TOTAL_MILES, this.hikerData.mile + distance);
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
      
      // Check for end - Katahdin summit!
      if (this.hikerData.mile >= TRAIL_TOTAL_MILES) {
        this.hikerData.isHiking = false;
        this.events.emit('game-event', {
          type: 'milestone',
          message: 'YOU SUMMITED KATAHDIN! Thru-hike complete!'
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

    // Check for incapacitation (death) - player has no resources and no way to recover
    if (!this.isIncapacitated) {
      const hasNoEnergy = this.hikerData.energy <= 0;
      const hasNoCalories = this.hikerData.calories <= 0;
      const hasNoHydration = this.hikerData.hydration <= 0;
      const hasNoFood = !this.hikerData.inventory?.food?.some((f: any) => f.servings > 0);
      const hasNoWater = (this.hikerData.inventory?.water || 0) < 0.25;

      // Incapacitated if: no energy AND (no food OR no calories) AND (no water OR no hydration)
      if (hasNoEnergy && hasNoCalories && hasNoHydration && hasNoFood && hasNoWater) {
        this.triggerIncapacitation();
      }
    }

    // Simulate bubble NPCs (every 5 seconds)
    const now = Date.now();
    if (now - this.lastBubbleSimulation >= this.bubbleSimulationInterval) {
      this.lastBubbleSimulation = now;
      bubbleSystem.simulateNPCs(
        this.hikerData.mile,
        this.gameState.time.hour,
        this.gameState.time.day
      );
      this.updateBubbleNPCSprites();
      
      // Companion Logic
      const companion = bubbleSystem.getActiveCompanion();
      if (companion) {
          // Morale boost from companion (+1 per game hour ~ 5 real seconds? No, update rate is fast)
          // Just small trickle
          this.hikerData.moodles.morale = Math.min(100, this.hikerData.moodles.morale + 0.05);
          
          // Random companion dialogue (5% chance every 5s)
          if (Math.random() < 0.05) {
              const dialogues = [
                  "Beautiful day for hiking!",
                  "Only a few more miles to the shelter!",
                  "Want to take a break soon?",
                  "Look at that view!",
                  "I'm craving pizza.",
                  "Did you hear that bird?",
                  "My pack feels heavy today."
              ];
              const msg = dialogues[Math.floor(Math.random() * dialogues.length)];
              this.events.emit('game-event', {
                  type: 'info',
                  message: `${companion.trailName}: "${msg}"`
              });
          }
      }
    }

    // Emit update
    this.events.emit('state-update', {
      hiker: this.hikerData,
      game: this.gameState
    });

    // Multiplayer: sync state to network
    if (this.isMultiplayer) {
      networkManager.updateLocalPlayer({
        mile: this.hikerData.mile,
        x: this.hiker?.x || 400,
        isHiking: this.hikerData.isHiking,
        energy: this.hikerData.energy,
        health: this.hikerData.health,
        elevation: this.hikerData.elevation || 3782,
      });

      // Host also sends weather/time state
      if (this.isHost) {
        networkManager.updateGameState(
          {
            isRaining: this.gameState.weather === 'rain_light' ||
                       this.gameState.weather === 'rain_heavy' ||
                       this.gameState.weather === 'storm',
            isFoggy: this.gameState.weather === 'fog'
          },
          {
            hour: this.gameState.time.hour,
            minute: this.gameState.time.minute,
            day: this.gameState.time.day
          }
        );
      }
    }

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
    // This method was used for Colyseus server sync - now handled locally
    // In P2P multiplayer, guests receive state via NetworkManager
    if (state.hikers) {
      this.hikerData = state.hiker;
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

    // G to open field guide
    this.input.keyboard?.on('keydown-G', () => this.openGuide());

    // J to open trail journal
    this.input.keyboard?.on('keydown-J', () => this.openJournal());

    // H for emergency help/rescue (when in critical condition)
    this.input.keyboard?.on('keydown-H', () => this.requestEmergencyRescue());

    // Game speed controls (Project Zomboid style)
    this.input.keyboard?.on('keydown-PLUS', () => this.changeGameSpeed(1));
    this.input.keyboard?.on('keydown-MINUS', () => this.changeGameSpeed(-1));
    this.input.keyboard?.on('keydown-EQUAL', () => this.changeGameSpeed(1)); // = key (shift for +)
    this.input.keyboard?.on('keydown-OPEN_BRACKET', () => this.changeGameSpeed(-1));
    this.input.keyboard?.on('keydown-CLOSED_BRACKET', () => this.changeGameSpeed(1));
  }

  changeGameSpeed(direction: number) {
    // In MMO mode, speed controls are disabled - everyone uses global time
    if (this.isMMOMode) {
      this.events.emit('game-event', {
        type: 'info',
        message: 'Global Trail uses real-time sync - speed controls disabled'
      });
      return;
    }

    // In multiplayer co-op, only host can change speed
    if (this.isMultiplayer && !this.isHost) {
      this.events.emit('game-event', {
        type: 'warning',
        message: 'Only the host can change game speed'
      });
      return;
    }

    const currentIndex = this.SPEED_OPTIONS.indexOf(this.gameSpeed);
    const newIndex = Phaser.Math.Clamp(currentIndex + direction, 0, this.SPEED_OPTIONS.length - 1);
    this.setGameSpeed(this.SPEED_OPTIONS[newIndex]);

    // Broadcast to guests if we're host
    if (this.isMultiplayer && this.isHost) {
      networkManager.broadcast({
        type: MessageType.TIME_UPDATE,
        payload: { gameSpeed: this.gameSpeed },
        senderId: networkManager.localPlayerId,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Set game speed (used by host and when receiving from host)
   */
  setGameSpeed(speed: number) {
    this.gameSpeed = speed;

    // Update display
    const speedSymbol = this.gameSpeed >= 1 ? '▶'.repeat(Math.min(this.gameSpeed, 4)) : '▷';
    const hostLabel = this.isMultiplayer && !this.isHost ? ' (host)' : '';
    this.gameSpeedText.setText(`${speedSymbol} ${this.gameSpeed}x${hostLabel}`);

    // Color based on speed (more deliberate = cooler colors)
    if (this.gameSpeed <= 0.25) {
      this.gameSpeedText.setColor('#6699bb'); // Very slow - deep blue
    } else if (this.gameSpeed <= 0.5) {
      this.gameSpeedText.setColor('#88aacc'); // Slow - blue (default PZ feel)
    } else if (this.gameSpeed <= 1) {
      this.gameSpeedText.setColor('#aaaaaa'); // Normal - gray
    } else if (this.gameSpeed <= 2) {
      this.gameSpeedText.setColor('#cccc88'); // Fast - yellow
    } else {
      this.gameSpeedText.setColor('#cc8866'); // Very fast - orange
    }

    this.events.emit('game-event', {
      type: 'info',
      message: `Game speed: ${this.gameSpeed}x`
    });
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
    this.createMobileActionButtons();
  }

  createMobileActionButtons() {
    const { width, height } = this.cameras.main;
    const buttonSize = Math.min(50, width * 0.1);
    const buttonX = width - Math.max(70, width * 0.1);
    const buttonSpacing = Math.min(60, height * 0.12);

    // Hike button (SPACE equivalent)
    const hikeButton = this.add.circle(buttonX, height - buttonSpacing * 3, buttonSize / 2, 0x2e5339, 0.7);
    hikeButton.setDepth(1000);
    hikeButton.setScrollFactor(0);
    hikeButton.setInteractive();
    const hikeText = this.add.text(buttonX, height - buttonSpacing * 3, '▶', {
      font: `${Math.max(18, buttonSize * 0.48)}px Arial`,
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(1001).setScrollFactor(0);

    hikeButton.on('pointerdown', () => {
      this.toggleHiking();
      hikeButton.setFillStyle(0x4a7d5a, 0.9);
    });
    hikeButton.on('pointerup', () => {
      hikeButton.setFillStyle(0x2e5339, 0.7);
    });

    this.mobileButtons.hike = { button: hikeButton, text: hikeText };

    // Eat button (E equivalent)
    const eatButton = this.add.circle(buttonX, height - buttonSpacing * 2, buttonSize / 2, 0x4a7d5a, 0.7);
    eatButton.setDepth(1000);
    eatButton.setScrollFactor(0);
    eatButton.setInteractive();
    const eatText = this.add.text(buttonX, height - buttonSpacing * 2, '🍽', {
      font: `${Math.max(16, buttonSize * 0.4)}px Arial`,
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(1001).setScrollFactor(0);

    eatButton.on('pointerdown', () => {
      this.eat();
      eatButton.setFillStyle(0x5a9d6a, 0.9);
    });
    eatButton.on('pointerup', () => {
      eatButton.setFillStyle(0x4a7d5a, 0.7);
    });

    this.mobileButtons.eat = { button: eatButton, text: eatText };

    // Drink button (Q equivalent)
    const drinkButton = this.add.circle(buttonX, height - buttonSpacing, buttonSize / 2, 0x4a7d5a, 0.7);
    drinkButton.setDepth(1000);
    drinkButton.setScrollFactor(0);
    drinkButton.setInteractive();
    const drinkText = this.add.text(buttonX, height - buttonSpacing, '💧', {
      font: `${Math.max(16, buttonSize * 0.4)}px Arial`,
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(1001).setScrollFactor(0);

    drinkButton.on('pointerdown', () => {
      this.drink();
      drinkButton.setFillStyle(0x5a9d6a, 0.9);
    });
    drinkButton.on('pointerup', () => {
      drinkButton.setFillStyle(0x4a7d5a, 0.7);
    });

    this.mobileButtons.drink = { button: drinkButton, text: drinkText };

    // Guide button (G equivalent) - top left corner, offset for stats panel on desktop
    const guideX = this.isMobile ? 50 : 220;
    const guideButton = this.add.circle(guideX, 50, buttonSize / 2, 0x557799, 0.8);
    guideButton.setDepth(1000);
    guideButton.setScrollFactor(0);
    guideButton.setInteractive();
    const guideText = this.add.text(guideX, 50, '📖', {
      font: `${Math.max(18, buttonSize * 0.44)}px Arial`,
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(1001).setScrollFactor(0);

    guideButton.on('pointerdown', () => {
      this.openGuide();
      guideButton.setFillStyle(0x6688aa, 0.9);
    });
    guideButton.on('pointerup', () => {
      guideButton.setFillStyle(0x557799, 0.8);
    });

    this.mobileButtons.guide = { button: guideButton, text: guideText };
  }

  onResize(gameSize: Phaser.Structs.Size) {
    const width = gameSize.width;
    const height = gameSize.height;

    // Update joystick position if mobile
    if (this.isMobile && this.joystickBase) {
      const joystickSize = Math.min(80, width * 0.15);
      const joystickX = joystickSize + 20;
      const joystickY = height - joystickSize - 20;

      this.joystickBase.setPosition(joystickX, joystickY);
      this.joystickBase.setRadius(joystickSize / 2);
      this.joystickThumb.setPosition(joystickX, joystickY);
      this.joystickThumb.setRadius(joystickSize / 4);
    }

    // Update mobile action buttons position
    if (this.isMobile) {
      const buttonSize = Math.min(50, width * 0.1);
      const buttonX = width - Math.max(70, width * 0.1);
      const buttonSpacing = Math.min(60, height * 0.12);

      if (this.mobileButtons.hike) {
        this.mobileButtons.hike.button.setPosition(buttonX, height - buttonSpacing * 3);
        this.mobileButtons.hike.button.setRadius(buttonSize / 2);
        this.mobileButtons.hike.text.setPosition(buttonX, height - buttonSpacing * 3);
      }

      if (this.mobileButtons.eat) {
        this.mobileButtons.eat.button.setPosition(buttonX, height - buttonSpacing * 2);
        this.mobileButtons.eat.button.setRadius(buttonSize / 2);
        this.mobileButtons.eat.text.setPosition(buttonX, height - buttonSpacing * 2);
      }

      if (this.mobileButtons.drink) {
        this.mobileButtons.drink.button.setPosition(buttonX, height - buttonSpacing);
        this.mobileButtons.drink.button.setRadius(buttonSize / 2);
        this.mobileButtons.drink.text.setPosition(buttonX, height - buttonSpacing);
      }

      if (this.mobileButtons.guide) {
        const guideX = this.isMobile ? 50 : 220;
        this.mobileButtons.guide.button.setPosition(guideX, 50);
        this.mobileButtons.guide.button.setRadius(buttonSize / 2);
        this.mobileButtons.guide.text.setPosition(guideX, 50);
      }
    }

    // Update game speed text position
    if (this.gameSpeedText) {
      this.gameSpeedText.setPosition(width / 2, 30);
    }

    // Emit resize event for UIScene
    this.events.emit('game-resize', { width, height });
  }

  toggleHiking() {
    if (this.isIncapacitated) {
      this.events.emit('game-event', {
        type: 'warning',
        message: 'You are incapacitated! Press H for emergency rescue.'
      });
      return;
    }

    if (this.hikerData) {
      this.hikerData.isHiking = !this.hikerData.isHiking;
      this.events.emit('game-event', {
        type: 'info',
        message: this.hikerData.isHiking ? 'Started hiking' : 'Stopped hiking'
      });

      // In multiplayer, send input to host
      if (this.isMultiplayer && !this.isHost) {
        networkManager.sendInput({
          action: this.hikerData.isHiking ? 'start_hike' : 'stop_hike'
        });
      }
    }
  }

  setPace(pace: string) {
    if (this.hikerData) {
      this.hikerData.pace = pace;
      this.events.emit('game-event', {
        type: 'info',
        message: `Pace set to ${pace}`
      });
    }
  }

  eat() {
    if (this.hikerData?.inventory?.food) {
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
    if (this.hikerData?.inventory) {
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

        // Notify host in multiplayer
        if (this.isMultiplayer && !this.isHost) {
          networkManager.sendInput({ action: 'drink' });
        }
      } else {
        this.events.emit('game-event', {
          type: 'warning',
          message: 'Need more water!'
        });
      }
    }
  }

  toggleCamp() {
    if (this.hikerData) {
      // Toggle resting state
      this.hikerData.isResting = !this.hikerData.isResting;

      // Can't hike and rest at the same time
      if (this.hikerData.isResting) {
        this.hikerData.isHiking = false;
        this.events.emit('game-event', {
          type: 'info',
          message: 'Taking a break to rest and recover...'
        });

        // Notify host in multiplayer
        if (this.isMultiplayer && !this.isHost) {
          networkManager.sendInput({ action: 'rest' });
        }
      } else {
        this.events.emit('game-event', {
          type: 'info',
          message: 'Packed up and ready to hike!'
        });
      }
    }
  }

  searchBlaze() {
    if (this.hikerData && this.hikerData.lostState !== 'on_trail') {
      // Blaze search
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
    if (this.hikerData && this.hikerData.lostState !== 'on_trail') {
      this.hikerData.mile = Math.max(0, this.hikerData.mile - 0.1);
      this.hikerData.energy -= 5;
      this.events.emit('game-event', {
        type: 'info',
        message: 'Backtracking...'
      });
    }
  }

  openGuide() {
    // Pause the game scene and launch the guide
    this.scene.pause('GameScene');
    this.scene.launch('GuideScene', {
      currentMile: this.hikerData?.mile || 0
    });
  }

  openJournal() {
    // Pause the game scene and launch the journal
    this.scene.pause('GameScene');
    this.scene.pause('UIScene');
    this.scene.launch('JournalScene');
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

    // Calculate scroll speed based on pace and game speed multiplier
    const paceScrollSpeed: Record<string, number> = {
      slow: 60, normal: 100, fast: 150, rush: 200
    };
    const baseScrollSpeed = paceScrollSpeed[this.hikerData?.pace || 'normal'] || 100;

    // Continuous vertical scrolling when hiking (the main game mechanic)
    if (this.hikerData?.isHiking) {
      // Apply game speed multiplier (Project Zomboid style)
      const scrollSpeed = baseScrollSpeed * (delta / 1000) * this.gameSpeed;

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
      for (let i = this.obstacles.length - 1; i >= 0; i -= 1) {
        const s = this.obstacles[i];
        s.y += scrollSpeed;

        // OPTIMIZATION: Use squared distance to avoid expensive square root
        if (!s.getData('hit') && Phaser.Math.Distance.Squared(this.hiker.x, this.hiker.y, s.x, s.y) < 625) { // 25^2
          s.setData('hit', true);
          const type = s.getData('type');

          if (type === 'river_crossing') {
            this.scene.pause();
            this.scene.launch('RiverCrossingScene');
          } else {
            s.setTint(0xff6666);
            let damage = 2;
            let msg = 'Tripped on a rock!';

            if (type === 'roots') {
              damage = 3;
              msg = 'Caught foot on roots!';
            } else if (type === 'mud_puddle') {
              damage = 1;
              msg = 'Stepped in mud!';
            } else if (type === 'boulder') {
              damage = 4;
              msg = 'Stumbled over boulder!';
            } else if (type === 'fallen_log') {
              damage = 2;
              msg = 'Tripped on fallen log!';
            }

            if (this.hikerData) {
              this.hikerData.energy = Math.max(0, this.hikerData.energy - damage);
            }

            this.events.emit('game-event', {
              type: 'warning',
              message: msg,
            });
          }
        }

        if (s.y > height + 50) {
          s.destroy();
          this.obstacles.splice(i, 1);
        }
      }
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
          // OPTIMIZATION: Use squared distance
          const distSq = Phaser.Math.Distance.Squared(
            this.hiker.x, this.hiker.y,
            water.x, water.y
          );
          if (distSq < 1600) { // 40^2
            // Auto-fill water
            water.setData('used', true);
            water.setTint(0x666666); // Visual feedback - used stream
            if (this.hikerData?.inventory) {
              const oldWater = this.hikerData.inventory.water;
              this.hikerData.inventory.water = this.hikerData.inventory.waterCapacity;
              const gained = this.hikerData.inventory.water - oldWater;

              this.events.emit('game-event', {
                type: 'success',
                message: `Filled up at stream! (+${gained.toFixed(1)}L)`
              });

              // Update UI with new state
              this.events.emit('state-update', {
                hiker: this.hikerData,
                game: this.gameState
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

          // Check for real shelters near this mile
          const shelter = SHELTERS.find(s => Math.floor(s.mile) === currentMile);
          if (shelter) {
            this.spawnLandmark(currentMile, shelter.name, shelter.hasWater);
            const waterIcon = shelter.hasWater ? '💧' : '';
            const privyIcon = shelter.hasPrivy ? '🚻' : '';
            this.events.emit('game-event', {
              type: 'shelter',
              message: `🏕️ ${shelter.name} ${waterIcon}${privyIcon} (${shelter.elevation.toLocaleString()} ft)`
            });
          } else {
            // Check for town near this mile
            const town = TOWNS.find(t => Math.floor(t.mile) === currentMile);
            if (town) {
              this.spawnLandmark(currentMile, town.name, true, true);
              const services = [];
              if (town.hasStore) services.push('🏪');
              if (town.hasRestaurant) services.push('🍔');
              if (town.hasHostel) services.push('🛏️');
              if (town.hasOutfitter) services.push('🎒');
              this.events.emit('game-event', {
                type: 'town',
                message: `🏘️ ${town.name} ${services.join('')} - ${town.distance}`
              });
            } else {
              // Check for peak near this mile
              const peak = PEAKS.find(p => Math.floor(p.mile) === currentMile);
              if (peak) {
                this.spawnLandmark(currentMile, peak.name, false);
                this.events.emit('game-event', {
                  type: 'peak',
                  message: `⛰️ ${peak.name} (${peak.elevation.toLocaleString()} ft)${peak.notes ? ' - ' + peak.notes : ''}`
                });
              } else if (currentMile % 5 === 0) {
                // Mile markers every 5 miles if no major landmark
                this.spawnLandmark(currentMile, `Mile ${currentMile}`, false);
              }
            }
          }

          // Check for state boundary crossings
          const stateBoundary = STATE_BOUNDARIES.find(b => Math.floor(b.mile) === currentMile);
          if (stateBoundary && stateBoundary.prevState) {
            this.events.emit('game-event', {
              type: 'milestone',
              message: `🎉 ${stateBoundary.name}! Welcome to ${stateBoundary.state}!`
            });

            // Log to journal
            const milestoneTitle = `Crossed into ${stateBoundary.state}!`;
            if (!journalSystem.hasMilestone(milestoneTitle)) {
              journalSystem.addEntry(
                'milestone',
                milestoneTitle,
                `${stateBoundary.name} - State #${STATE_BOUNDARIES.filter(b => b.mile <= currentMile).length} of 14`,
                this.gameState.time.day,
                this.gameState.time.hour,
                currentMile,
                { location: stateBoundary.name, state: stateBoundary.state }
              );
            }
          }

          // Log 100-mile markers to journal
          if (currentMile % 100 === 0 && currentMile > 0) {
            const milestoneTitle = `Reached ${currentMile} miles!`;
            if (!journalSystem.hasMilestone(milestoneTitle)) {
              journalSystem.addEntry(
                'milestone',
                milestoneTitle,
                `${Math.round((currentMile / TRAIL_TOTAL_MILES) * 100)}% of the AT complete!`,
                this.gameState.time.day,
                this.gameState.time.hour,
                currentMile
              );
            }
          }
        }
      }

      // Move wildlife down and animate
      this.wildlife.forEach((animal, index) => {
        animal.y += scrollSpeed * 0.9;

        // Random movement for wildlife
        const movementTimer = animal.getData('movementTimer') - delta;
        animal.setData('movementTimer', movementTimer);

        if (movementTimer <= 0) {
          // Random horizontal movement
          const type = animal.getData('type');
          const speed = animal.getData('speed');

          if (Math.random() < 0.3) {
            const moveAmount = (Math.random() - 0.5) * 30 * speed;
            animal.x = Phaser.Math.Clamp(animal.x + moveAmount, 20, width - 20);

            // Flip based on movement direction
            if (moveAmount > 0) {
              animal.setFlipX(true);
            } else if (moveAmount < 0) {
              animal.setFlipX(false);
            }
          }

          animal.setData('movementTimer', Phaser.Math.Between(500, 2000));
        }

        // Check for snake collision
        if (animal.getData('type') === 'snake') {
          // OPTIMIZATION: Use squared distance
          const distSq = Phaser.Math.Distance.Squared(
            this.hiker.x, this.hiker.y,
            animal.x, animal.y
          );
          if (distSq < 900 && !animal.getData('encountered')) { // 30^2
            animal.setData('encountered', true);
            if (this.hikerData) {
              this.hikerData.energy = Math.max(0, this.hikerData.energy - 5);
              this.hikerData.moodles.anxiety = Math.min(3, this.hikerData.moodles.anxiety + 1);
            }
            this.events.emit('game-event', {
              type: 'warning',
              message: '🐍 Snake on the trail! Startled you!'
            });
          }
        }

        // Remove when off screen
        if (animal.y > height + 50) {
          animal.destroy();
          this.wildlife.splice(index, 1);
        }
      });

      // Spawn new wildlife periodically
      this.nextWildlifeSpawn -= delta;
      if (this.nextWildlifeSpawn <= 0) {
        this.spawnWildlife();
        // Wildlife every 5-15 seconds
        this.nextWildlifeSpawn = Phaser.Math.Between(5000, 15000);
      }

      // Move trail magic items and check collection
      this.trailMagicItems.forEach((magic, index) => {
        magic.y += scrollSpeed;

        // Check if hiker collects trail magic
        if (!magic.getData('collected')) {
          // OPTIMIZATION: Use squared distance
          const distSq = Phaser.Math.Distance.Squared(
            this.hiker.x, this.hiker.y,
            magic.x, magic.y
          );
          if (distSq < 2500) { // 50^2
            magic.setData('collected', true);
            const magicData = magic.getData('magic');

            if (this.hikerData) {
              // Apply trail magic benefits
              this.hikerData.calories = Math.min(3000, this.hikerData.calories + magicData.calories);
              if (this.hikerData.inventory && magicData.water > 0) {
                this.hikerData.inventory.water = Math.min(
                  this.hikerData.inventory.waterCapacity,
                  this.hikerData.inventory.water + magicData.water
                );
              }
              // Boost morale!
              this.hikerData.moodles.morale = Math.min(100, this.hikerData.moodles.morale + 20);
            }

            this.events.emit('game-event', {
              type: 'success',
              message: `✨ Trail Magic! ${magicData.name} (+${magicData.calories} cal)`
            });

            // Log trail magic to journal
            journalSystem.addEntry(
              'memory',
              'Trail Magic!',
              `Found ${magicData.name} left by a kind trail angel. The hiking community is amazing!`,
              this.gameState.time.day,
              this.gameState.time.hour,
              this.hikerData.mile
            );

            // Visual feedback
            this.tweens.add({
              targets: magic,
              alpha: 0,
              scale: 1.5,
              duration: 500,
              onComplete: () => magic.destroy()
            });
          }
        }

        // Remove when off screen
        if (magic.y > height + 100) {
          magic.destroy();
          this.trailMagicItems.splice(index, 1);
        }
      });

      // Spawn trail magic rarely
      this.nextTrailMagicSpawn -= delta;
      if (this.nextTrailMagicSpawn <= 0) {
        // Only 30% chance when timer hits
        if (Math.random() < 0.3) {
          this.spawnTrailMagic();
        }
        // Check again in 30-60 seconds
        this.nextTrailMagicSpawn = Phaser.Math.Between(30000, 60000);
      }

      // Move plants down (slower parallax)
      this.plants.forEach(plant => {
        plant.y += scrollSpeed * 0.7;
        if (plant.y > height + 30) {
          plant.y = -30;
          // Randomize position
          const side = Math.random() < 0.5 ? 'left' : 'right';
          plant.x = side === 'left'
            ? Phaser.Math.Between(width * 0.22, width * 0.32)
            : Phaser.Math.Between(width * 0.68, width * 0.78);
        }
      });

      // Move other hikers and handle greetings
      this.otherHikers.forEach((hiker, index) => {
        const direction = hiker.getData('direction');
        // NOBO hikers move down slower (same direction as us)
        // SOBO hikers move down faster (coming toward us)
        const hikerSpeed = direction === 'nobo' ? scrollSpeed * 0.3 : scrollSpeed * 1.5;
        hiker.y += hikerSpeed;

        // Check for greeting when close
        if (!hiker.getData('greeted')) {
          // OPTIMIZATION: Use squared distance
          const distSq = Phaser.Math.Distance.Squared(
            this.hiker.x, this.hiker.y,
            hiker.x, hiker.y
          );
          if (distSq < 6400) { // 80^2
            hiker.setData('greeted', true);
            const name = hiker.getData('name');
            const greeting = hiker.getData('greeting');

            // Show greeting
            this.events.emit('game-event', {
              type: 'info',
              message: `"${name}": "${greeting}"`
            });

            // Small morale boost from social interaction
            if (this.hikerData?.moodles) {
              this.hikerData.moodles.morale = Math.min(100, this.hikerData.moodles.morale + 3);
            }
          }
        }

        // Remove when off screen
        if (hiker.y > height + 100 || hiker.y < -200) {
          hiker.destroy();
          this.otherHikers.splice(index, 1);
        }
      });

      // Spawn other hikers periodically
      this.nextHikerSpawn -= delta;
      if (this.nextHikerSpawn <= 0) {
        this.spawnOtherHiker();
        // Other hikers every 20-40 seconds
        this.nextHikerSpawn = Phaser.Math.Between(20000, 40000);
      }

      // Move viewpoints and check visits
      this.viewpoints.forEach((viewpoint, index) => {
        viewpoint.y += scrollSpeed;

        // Check if hiker visits viewpoint
        if (!viewpoint.getData('visited')) {
          // OPTIMIZATION: Use squared distance
          const distSq = Phaser.Math.Distance.Squared(
            this.hiker.x, this.hiker.y,
            viewpoint.x, viewpoint.y
          );
          if (distSq < 3600) { // 60^2
            viewpoint.setData('visited', true);
            const name = viewpoint.getData('name');

            // Morale boost!
            if (this.hikerData?.moodles) {
              this.hikerData.moodles.morale = Math.min(100, this.hikerData.moodles.morale + 15);
            }

            this.events.emit('game-event', {
              type: 'success',
              message: `🏔️ ${name} - What a view! (+15 morale)`
            });
          }
        }

        // Remove when off screen
        if (viewpoint.y > height + 100) {
          viewpoint.destroy();
          this.viewpoints.splice(index, 1);
        }
      });

      // Spawn viewpoints at certain miles (every ~5 miles)
      if (this.hikerData) {
        const mile = this.hikerData.mile;
        const viewpointMiles = [2.5, 7, 12, 17, 22, 27];
        viewpointMiles.forEach(vm => {
          if (Math.abs(mile - vm) < 0.1 && this.viewpoints.length === 0) {
            this.spawnViewpoint();
          }
        });
      }

      // Check random events periodically
      this.nextEventCheck -= delta;
      if (this.nextEventCheck <= 0) {
        this.checkRandomEvents();
        this.nextEventCheck = 5000; // Check every 5 seconds
      }

      // Hiker walking animation
      if (this.anims.exists('hiker_walk')) {
        this.hiker.play('hiker_walk', true);
      }

      // Hiker bob animation while hiking
      this.hiker.y = height * 0.65 + Math.sin(time / 80) * 3;
    } else {
      // Stop walking animation when not hiking
      if (this.hiker.anims.isPlaying) {
        this.hiker.stop();
        this.hiker.setTexture('hiker');
      }
      // Keep hiker centered when not hiking
      this.hiker.y = height * 0.65;
    }

    // Update day/night cycle visuals
    this.updateDayNightCycle();

    // Update night visibility and headlamp
    this.updateNightVisibility();

    // Update elevation display
    const elevation = this.getCurrentElevation();
    this.elevationText.setText(`⛰️ ${elevation.toLocaleString()} ft`);
    if (this.hikerData) {
      this.hikerData.elevation = elevation;
    }

    // Update terrain visuals based on current zone
    this.updateTerrainVisuals();

    // Check shelter proximity for bonus rest
    this.checkShelterProximity();

    // Check for town entry
    this.checkTownProximity();

    // Fog movement
    this.fogSprites.forEach(fog => {
      fog.x += Math.sin(time / 1000 + fog.y) * 0.2;
    });

    // Multiplayer: render other players (host renders from local state)
    if (this.isMultiplayer && this.isHost) {
      const otherPlayers = networkManager.getOtherPlayers();
      otherPlayers.forEach(playerState => {
        this.updateOtherPlayerSprite(playerState);
      });
    }

    // Update real hiker ghosts (GPS data) - periodically, not every frame
    if (time - this.lastGhostUpdate > this.GHOST_UPDATE_INTERVAL) {
      this.updateGhosts();
      this.lastGhostUpdate = time;

      // Also update zone if mile changed significantly
      if (this.hikerData) {
        zoneManager.updatePlayerPosition(this.hikerData.mile, networkManager.localPlayerId);
      }
    }
  }

  /**
   * Trigger incapacitation (death) when resources are fully depleted
   * Shows overlay with restart options
   */
  triggerIncapacitation() {
    this.isIncapacitated = true;
    this.hikerData.isHiking = false;
    this.hikerData.isResting = false;

    // Emit death event
    this.events.emit('game-event', {
      type: 'warning',
      message: 'You have collapsed from exhaustion...'
    });

    // Show death overlay
    this.showDeathOverlay();
  }

  /**
   * Show the death/game-over overlay with restart options
   */
  showDeathOverlay() {
    if (this.deathOverlay) return;

    const { width, height } = this.cameras.main;

    // Check if player has PLB and calculate rescue cost
    const hasPLB = this.hikerData?.inventory?.gear?.some((g: any) => g.id === 'plb');
    const hasInsurance = this.hikerData?.inventory?.rescueInsurance || false;

    // Real rescue costs: $5,000-$50,000 without insurance
    // With insurance: $0-500 copay
    // With PLB but no insurance: Search is free but medical transport still costs
    const rescueCost = hasInsurance ? 100 : (hasPLB ? 2500 : 10000);

    this.deathOverlay = this.add.container(0, 0);
    this.deathOverlay.setDepth(2000);
    this.deathOverlay.setScrollFactor(0);

    // Dark background
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
    this.deathOverlay.add(bg);

    // Death message
    const deathTitle = this.add.text(width / 2, height * 0.18, '💀 INCAPACITATED', {
      font: 'bold 36px Courier',
      color: '#ff4444'
    }).setOrigin(0.5);
    this.deathOverlay.add(deathTitle);

    const deathMessage = this.add.text(width / 2, height * 0.28,
      'Your body has given out.\nNo food, no water, no energy.\nThe trail has claimed another.', {
      font: '14px Courier',
      color: '#cccccc',
      align: 'center'
    }).setOrigin(0.5);
    this.deathOverlay.add(deathMessage);

    // Stats
    const statsText = this.add.text(width / 2, height * 0.40,
      `Mile ${this.hikerData?.mile?.toFixed(1) || 0} | Day ${this.hikerData?.daysOnTrail || 0} | ${this.hikerData?.totalMilesHiked?.toFixed(1) || 0} miles total`, {
      font: '12px Courier',
      color: '#888888',
      align: 'center'
    }).setOrigin(0.5);
    this.deathOverlay.add(statsText);

    const buttonWidth = 300;
    const buttonHeight = 55;

    // PLB / SOS Button - the main rescue option
    const rescueY = height * 0.52;
    const rescueButton = this.add.rectangle(width / 2, rescueY, buttonWidth, buttonHeight, 0xcc3333);

    // SOS button styling (like real PLB)
    const sosLabel = hasPLB ? '📡 ACTIVATE SOS BEACON' : '📞 CALL 911';
    const rescueText = this.add.text(width / 2, rescueY - 5, sosLabel, {
      font: 'bold 16px Courier',
      color: '#ffffff'
    }).setOrigin(0.5);

    const costLabel = hasInsurance
      ? `Rescue Insurance Active - $${rescueCost} copay`
      : hasPLB
        ? `InReach SOS → Helicopter Rescue - $${rescueCost.toLocaleString()}`
        : `No PLB - Full rescue cost $${rescueCost.toLocaleString()}`;

    const rescueCostText = this.add.text(width / 2, rescueY + 15, costLabel, {
      font: '10px Courier',
      color: '#ffaaaa'
    }).setOrigin(0.5);

    rescueButton.setInteractive();
    rescueButton.on('pointerover', () => rescueButton.setFillStyle(0xee4444));
    rescueButton.on('pointerout', () => rescueButton.setFillStyle(0xcc3333));
    rescueButton.on('pointerdown', () => this.activateSOSBeacon(rescueCost));

    this.deathOverlay.add([rescueButton, rescueText, rescueCostText]);

    // What happens text
    const processText = this.add.text(width / 2, rescueY + 40,
      hasPLB ? 'Signal sent → SAR dispatched → Helicopter inbound' : 'Waiting for a passing hiker to find you...',
      {
        font: '9px Courier',
        color: '#666666',
        fontStyle: 'italic'
      }).setOrigin(0.5);
    this.deathOverlay.add(processText);

    // Restart from Springer button
    const restartY = height * 0.72;
    const restartButton = this.add.rectangle(width / 2, restartY, buttonWidth, buttonHeight - 10, 0x442222);
    const restartText = this.add.text(width / 2, restartY, '🏔️ RESTART FROM SPRINGER', {
      font: 'bold 14px Courier',
      color: '#ffffff'
    }).setOrigin(0.5);

    restartButton.setInteractive();
    restartButton.on('pointerover', () => restartButton.setFillStyle(0x663333));
    restartButton.on('pointerout', () => restartButton.setFillStyle(0x442222));
    restartButton.on('pointerdown', () => this.restartFromSpringer());

    this.deathOverlay.add([restartButton, restartText]);

    const restartDesc = this.add.text(width / 2, restartY + 30,
      'Your thru-hike ends here. Start over from mile 0.', {
      font: '10px Courier',
      color: '#666666'
    }).setOrigin(0.5);
    this.deathOverlay.add(restartDesc);

    // Quit to Menu button
    const quitY = height * 0.88;
    const quitButton = this.add.rectangle(width / 2, quitY, 150, 35, 0x333333);
    const quitText = this.add.text(width / 2, quitY, 'QUIT TO MENU', {
      font: '12px Courier',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    quitButton.setInteractive();
    quitButton.on('pointerover', () => quitButton.setFillStyle(0x444444));
    quitButton.on('pointerout', () => quitButton.setFillStyle(0x333333));
    quitButton.on('pointerdown', () => this.quitToMenu());

    this.deathOverlay.add([quitButton, quitText]);
  }

  /**
   * Activate SOS beacon - shows helicopter rescue animation
   */
  activateSOSBeacon(rescueCost: number) {
    if (!this.hikerData) return;

    const { width, height } = this.cameras.main;

    // Check if player has enough money
    const playerMoney = this.hikerData.inventory?.money || 0;
    if (playerMoney < rescueCost) {
      // Can't afford rescue - go into debt or alternative
      const goIntoDebt = confirm(
        `You don't have $${rescueCost.toLocaleString()} for the rescue.\n\n` +
        `Current funds: $${playerMoney}\n\n` +
        `Take on medical debt? You'll owe $${(rescueCost - playerMoney).toLocaleString()} when you reach town.`
      );
      if (!goIntoDebt) return;
    }

    // Clear the death overlay for rescue animation
    if (this.deathOverlay) {
      this.deathOverlay.destroy();
      this.deathOverlay = null;
    }

    // Create rescue animation container
    const rescueContainer = this.add.container(0, 0);
    rescueContainer.setDepth(2000);
    rescueContainer.setScrollFactor(0);

    // Dark background
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9);
    rescueContainer.add(bg);

    // SOS activation sequence
    const sosText = this.add.text(width / 2, height * 0.3, '📡 SOS BEACON ACTIVATED', {
      font: 'bold 28px Courier',
      color: '#ff6666'
    }).setOrigin(0.5);
    rescueContainer.add(sosText);

    // Blink the SOS text
    this.tweens.add({
      targets: sosText,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: 3
    });

    // Status messages that appear sequentially
    const statusMessages = [
      { delay: 500, text: '📶 Signal transmitted to satellite...', color: '#aaaaaa' },
      { delay: 1500, text: '🛰️ GEOS receiving coordinates...', color: '#aaaaaa' },
      { delay: 2500, text: '📞 Notifying Search & Rescue...', color: '#aaaaaa' },
      { delay: 3500, text: '🚁 HELICOPTER DISPATCHED', color: '#44ff44' }
    ];

    statusMessages.forEach((msg, i) => {
      this.time.delayedCall(msg.delay, () => {
        const statusText = this.add.text(width / 2, height * 0.45 + i * 25, msg.text, {
          font: '14px Courier',
          color: msg.color
        }).setOrigin(0.5).setAlpha(0);
        rescueContainer.add(statusText);

        this.tweens.add({
          targets: statusText,
          alpha: 1,
          duration: 300
        });
      });
    });

    // Helicopter animation after status messages
    this.time.delayedCall(4500, () => {
      // Create helicopter (simple text-based for now)
      const helicopter = this.add.text(-100, height * 0.6, '🚁', {
        font: '64px Arial'
      }).setOrigin(0.5);
      rescueContainer.add(helicopter);

      // Helicopter flies across screen
      this.tweens.add({
        targets: helicopter,
        x: width / 2,
        duration: 2000,
        ease: 'Quad.easeOut',
        onComplete: () => {
          // Hover and lower rope
          const ropeText = this.add.text(width / 2, height * 0.75, '🪢', {
            font: '32px Arial'
          }).setOrigin(0.5).setAlpha(0);
          rescueContainer.add(ropeText);

          this.tweens.add({
            targets: ropeText,
            alpha: 1,
            y: height * 0.85,
            duration: 1000,
            onComplete: () => {
              // Rescue complete message
              this.time.delayedCall(800, () => {
                const rescueComplete = this.add.text(width / 2, height * 0.35,
                  '✅ RESCUE SUCCESSFUL', {
                  font: 'bold 24px Courier',
                  color: '#44ff44'
                }).setOrigin(0.5).setAlpha(0);
                rescueContainer.add(rescueComplete);

                this.tweens.add({
                  targets: rescueComplete,
                  alpha: 1,
                  duration: 500
                });

                // Complete the rescue after animation
                this.time.delayedCall(1500, () => {
                  rescueContainer.destroy();
                  this.completeRescue(rescueCost);
                });
              });
            }
          });
        }
      });
    });
  }

  /**
   * Complete the rescue - teleport to nearest town with resources restored
   * Called after the helicopter animation completes
   */
  completeRescue(rescueCost: number) {
    if (!this.hikerData) return;

    // Find nearest town
    const currentMile = this.hikerData.mile;
    let nearestTown = TOWNS[0];
    let minDistance = Math.abs(currentMile - TOWNS[0].mile);

    TOWNS.forEach(town => {
      const dist = Math.abs(currentMile - town.mile);
      if (dist < minDistance) {
        minDistance = dist;
        nearestTown = town;
      }
    });

    // Apply rescue - deduct money (can go negative = debt), restore resources, move to town
    const currentMoney = this.hikerData.inventory?.money || 0;
    this.hikerData.inventory.money = currentMoney - rescueCost;

    // Move to nearest town
    this.hikerData.mile = nearestTown.mile;

    // Restore resources (hospital patched you up)
    this.hikerData.calories = 2000;
    this.hikerData.hydration = 100;
    this.hikerData.energy = 80;
    this.hikerData.health = 100;
    this.hikerData.inventory.water = 2.0;

    // Give some basic food if they have none
    if (!this.hikerData.inventory.food || this.hikerData.inventory.food.length === 0) {
      this.hikerData.inventory.food = [
        { id: 'ramen', name: 'Ramen Noodles', calories: 400, weight: 0.1, servings: 3 },
        { id: 'snickers', name: 'Snickers Bar', calories: 250, weight: 0.1, servings: 2 }
      ];
    }

    // Reset moodles
    this.hikerData.moodles.hunger = 0;
    this.hikerData.moodles.thirst = 0;
    this.hikerData.moodles.fatigue = 1;
    this.hikerData.moodles.anxiety = 2; // Traumatic experience

    // Clear incapacitated state
    this.isIncapacitated = false;

    // Remove overlay if it exists
    if (this.deathOverlay) {
      this.deathOverlay.destroy();
      this.deathOverlay = null;
    }

    // Notify player with details
    const debtMessage = this.hikerData.inventory.money < 0
      ? ` (Debt: $${Math.abs(this.hikerData.inventory.money).toLocaleString()})`
      : '';

    this.events.emit('game-event', {
      type: 'success',
      message: `🏥 Rescued and treated at ${nearestTown.name}!${debtMessage}`
    });

    // Add a follow-up message about the experience
    this.time.delayedCall(2000, () => {
      this.events.emit('game-event', {
        type: 'info',
        message: 'The SAR team says: "Take it easy out there. Eat, drink, rest."'
      });
    });

    // Save the game
    this.saveGame();
  }

  /**
   * Restart the game from Springer Mountain (mile 0)
   */
  restartFromSpringer() {
    // Clear save data
    gameStorage.deleteSave('autosave');

    // Return to menu - they'll start fresh
    this.scene.stop('UIScene');
    this.scene.start('MenuScene');
  }

  /**
   * Quit to main menu
   */
  quitToMenu() {
    // Save current state (even incapacitated) so they can retry
    if (this.hikerData && !this.isIncapacitated) {
      this.saveGame();
    }

    this.scene.stop('UIScene');
    this.scene.start('MenuScene');
  }

  /**
   * Request emergency rescue - can be called anytime with H key
   * Useful when stuck but not yet incapacitated
   */
  requestEmergencyRescue() {
    if (!this.hikerData) return;

    // If already incapacitated and overlay is showing, just let them use the overlay
    if (this.isIncapacitated && this.deathOverlay) {
      return;
    }

    // If incapacitated but overlay not showing, show it
    if (this.isIncapacitated) {
      this.showDeathOverlay();
      return;
    }

    // Check if player is in critical condition (low resources)
    const isCritical =
      this.hikerData.energy < 20 ||
      this.hikerData.calories < 300 ||
      this.hikerData.hydration < 15;

    const hasNoResources =
      (!this.hikerData.inventory?.food?.some((f: any) => f.servings > 0)) &&
      (this.hikerData.inventory?.water || 0) < 0.25;

    // Check if player has PLB
    const hasPLB = this.hikerData.inventory?.gear?.some((g: any) => g.id === 'plb');

    if (isCritical || hasNoResources) {
      // Show SOS confirmation
      const msg = hasPLB
        ? '📡 ACTIVATE SOS BEACON?\n\nYour Garmin InReach will send an emergency signal.\nSearch & Rescue will be dispatched.\n\nThis should only be used in true emergencies.'
        : '📞 CALL FOR HELP?\n\nYou will need to wait for another hiker to find you,\nor attempt to self-rescue.';

      if (confirm(msg)) {
        // Trigger incapacitation to show the full rescue overlay with options
        this.isIncapacitated = true;
        this.hikerData.isHiking = false;
        this.showDeathOverlay();
      }
    } else {
      // Not in critical condition - show PLB reminder
      if (hasPLB) {
        this.events.emit('game-event', {
          type: 'info',
          message: '📡 InReach ready. SOS available in emergencies (H key when critical)'
        });
      } else {
        this.events.emit('game-event', {
          type: 'warning',
          message: 'No PLB/InReach! Consider buying one in town for emergencies.'
        });
      }
    }
  }

  // ========================================
  // BUBBLE SYSTEM - Persistent NPC Hikers
  // ========================================

  updateBubbleNPCSprites() {
    if (!this.hikerData) return;

    const { width, height } = this.cameras.main;
    const playerMile = this.hikerData.mile;
    const activeCompanion = bubbleSystem.getActiveCompanion();

    // Get NPCs within 2 miles (visible range)
    const nearbyNPCs = bubbleSystem.getNPCsNearMile(playerMile, 2);

    // Track which NPCs we've seen this update
    const seenIds = new Set<string>();

    nearbyNPCs.forEach(npc => {
      // Skip active companion in general loop (handled separately)
      if (activeCompanion && npc.id === activeCompanion.id) return;

      seenIds.add(npc.id);

      const mileDiff = npc.mile - playerMile;
      const yOffset = -mileDiff * 200; // 200 pixels per mile
      const yPos = height * 0.65 + yOffset;

      // Skip if off screen
      if (yPos < -100 || yPos > height + 100) {
        if (this.bubbleSprites.has(npc.id)) {
          this.bubbleSprites.get(npc.id)?.setVisible(false);
        }
        return;
      }

      let container = this.bubbleSprites.get(npc.id);

      if (!container) {
        // Create new sprite for this NPC
        container = this.createBubbleNPCSprite(npc);
        this.bubbleSprites.set(npc.id, container);
      }

      // Update position
      container.setY(yPos);
      container.setX(width * 0.5 + (Math.sin(npc.id.charCodeAt(4) * 0.5) * 60)); // Slight horizontal variation
      container.setVisible(true);

      // Check for close encounter (within 0.1 miles, ~20 pixels)
      if (Math.abs(yOffset) < 25 && npc.relationship.encounters === 0) {
        this.triggerBubbleEncounter(npc);
      }
    });

    // Handle Active Companion
    if (activeCompanion) {
        seenIds.add(activeCompanion.id);
        let compContainer = this.bubbleSprites.get(activeCompanion.id);
        
        if (!compContainer) {
            compContainer = this.createBubbleNPCSprite(activeCompanion);
            this.bubbleSprites.set(activeCompanion.id, compContainer);
        }
        
        // Companion is always beside player
        // Oscillate slightly for walking effect
        const bob = this.hikerData.isHiking ? Math.sin(this.time.now / 200) * 5 : 0;
        compContainer.setY(height * 0.65 + bob);
        compContainer.setX(width * 0.5 + 50); // 50px to the right
        compContainer.setVisible(true);
        
        // Highlight companion
        const sprite = compContainer.list[0] as Phaser.GameObjects.Rectangle;
        if (sprite) sprite.setFillStyle(0x44ff44); // Green for buddy
    }

    // Hide sprites for NPCs no longer nearby
    this.bubbleSprites.forEach((sprite, id) => {
      if (!seenIds.has(id)) {
        sprite.setVisible(false);
      }
    });
  }

  createBubbleNPCSprite(npc: BubbleNPC): Phaser.GameObjects.Container {
    const { width, height } = this.cameras.main;

    const container = this.add.container(width * 0.5, height * 0.5);
    container.setDepth(9); // Between obstacles and player

    // Create hiker sprite (use existing hiker sprite or simple shape)
    const sprite = this.add.rectangle(0, 0, 16, 24, 0xffaa44); // Orange tint for bubble NPCs
    sprite.setStrokeStyle(1, 0xcc8833);
    container.add(sprite);

    // Add name label
    const nameLabel = this.add.text(0, -20, npc.trailName, {
      font: 'bold 9px Courier',
      color: '#ffdd88',
      backgroundColor: '#00000088',
      padding: { x: 2, y: 1 }
    }).setOrigin(0.5);
    container.add(nameLabel);

    // Store NPC id in container data
    container.setData('npcId', npc.id);
    container.setData('trailName', npc.trailName);

    return container;
  }

  triggerBubbleEncounter(npc: BubbleNPC) {
    // Record the encounter
    bubbleSystem.recordEncounter(npc.id, this.gameState.time.day);

    // Get greeting
    const greeting = bubbleSystem.getGreeting(npc.id);

    // Show speech bubble / event
    this.events.emit('game-event', {
      type: 'info',
      message: `${npc.trailName}: "${greeting}"`
    });

    // Small morale boost from social interaction
    this.hikerData.moodles.morale = Math.min(100, (this.hikerData.moodles.morale || 50) + 2);
  }
}
