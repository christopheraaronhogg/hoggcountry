import Phaser from 'phaser';

interface Rock {
  x: number;
  y: number;
  sprite: Phaser.GameObjects.Sprite;
  isStable: boolean;
  revealed: boolean;
}

export class RiverCrossingScene extends Phaser.Scene {
  private grid: Rock[][] = [];
  private playerPos = { x: 2, y: 5 }; // Start at bottom middle
  private rows = 6;
  private cols = 5;
  private rockSize = 64;
  private startY = 100;
  private startX: number = 0;
  private messageText!: Phaser.GameObjects.Text;
  private canMove: boolean = true;

  constructor() {
    super({ key: 'RiverCrossingScene' });
  }

  create() {
    const { width, height } = this.cameras.main;
    this.startX = (width - (this.cols * this.rockSize)) / 2;

    // Background - Rushing River
    this.add.tileSprite(0, 0, width, height, 'deep_water').setOrigin(0).setScrollFactor(0);
    
    // Add some water effects
    const particles = this.add.particles(0, 0, 'water_splash', {
        x: { min: 0, max: width },
        y: { min: 0, max: height },
        lifespan: 600,
        angle: { min: 220, max: 320 },
        speed: { min: 100, max: 200 },
        scale: { start: 0.5, end: 0 },
        quantity: 2,
        blendMode: 'ADD'
    });

    // Title
    this.add.text(width / 2, 40, '🌊 RIVER CROSSING', {
      font: 'bold 28px Courier',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.messageText = this.add.text(width / 2, 80, 'Choose your path carefully...', {
      font: '18px Courier',
      color: '#aaddff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Generate Rocks
    this.createGrid();

    // Instructions
    this.add.text(width / 2, height - 50, 'Click adjacent rocks to move.\nDark rocks might be slippery!', {
        font: '14px Courier',
        color: '#ffffff',
        align: 'center',
        backgroundColor: '#00000088'
    }).setOrigin(0.5);
  }

  createGrid() {
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.cols; c++) {
        const x = this.startX + c * this.rockSize + this.rockSize/2;
        const y = this.startY + r * this.rockSize + this.rockSize/2;

        // Rock visual
        const sprite = this.add.sprite(x, y, 'boulder');
        sprite.setScale(1.5);
        
        // Random stability - higher rows (further away) might be harder
        // Visual cue: darker tint = more likely to be slippery (mossy)
        const isStable = Math.random() > 0.3; 
        if (!isStable) {
            sprite.setTint(0x88cc88); // Mossy green tint
        } else {
            sprite.setTint(0xaaaaaa); // Grey
        }

        sprite.setInteractive();
        sprite.on('pointerdown', () => this.tryMove(c, r));

        this.grid[r][c] = {
          x: c,
          y: r,
          sprite: sprite,
          isStable: isStable,
          revealed: false
        };
      }
    }

    // Highlight starting row options
    this.highlightMoves();
  }

  tryMove(targetX: number, targetY: number) {
    if (!this.canMove) return;

    // Check if move is valid (adjacent)
    // Only allow moving forward (up the screen, lower Y index) or sideways
    // Start is at row 5 (bottom), Goal is row -1 (top)
    
    // Initial move logic
    const currentY = this.playerPos.y;
    const currentX = this.playerPos.x;

    // Determine distance
    const dist = Math.abs(targetX - currentX) + Math.abs(targetY - currentY);
    
    // Valid moves: adjacent (dist 1) or diagonal (dist 2 but adjacent) 
    // Actually simpler: 1 step in any direction including diagonal
    const dx = Math.abs(targetX - currentX);
    const dy = Math.abs(targetY - currentY);
    
    const isValid = (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);
    
    // Special case for start: can pick any rock in bottom row
    const isStart = (currentY === this.rows - 1) && targetY === this.rows - 1; // Actually we want to move FROM bottom (imaginary row 6) TO row 5
    
    // Let's simplify: Player starts "off grid" at bottom. 
    // First move must be to bottom row (row index rows-1).
    if (this.playerPos.y === this.rows) { // Start state
        if (targetY !== this.rows - 1) return; // Must start at bottom row
    } else {
        if (!isValid) return;
    }

    this.canMove = false;
    const rock = this.grid[targetY][targetX];
    
    // Move player visual (tween) - imaginary player for now, just highlighting rocks
    
    // Check stability
    if (rock.isStable) {
        this.handleSuccessStep(targetX, targetY);
    } else {
        // Chance to slip based on agility? For now simple chance
        if (Math.random() < 0.6) {
            this.handleSlip(targetX, targetY);
        } else {
            this.handleSuccessStep(targetX, targetY, true); // Lucky save!
        }
    }
  }

  handleSuccessStep(x: number, y: number, lucky: boolean = false) {
    const rock = this.grid[y][x];
    rock.sprite.setTint(0x44ff44); // Green for safe
    this.playerPos = { x, y };
    
    if (lucky) {
        this.messageText.setText("Slipped but caught yourself!");
    } else {
        this.messageText.setText("Steady footing.");
    }

    // Check win
    if (y === 0) {
        this.time.delayedCall(500, () => this.win());
    } else {
        this.canMove = true;
        this.highlightMoves();
    }
  }

  handleSlip(x: number, y: number) {
    const rock = this.grid[y][x];
    rock.sprite.setTint(0xff4444); // Red for slip
    this.cameras.main.shake(200, 0.01);
    
    this.messageText.setText("SPLASH! You fell in!");
    this.messageText.setColor('#ff4444');

    const gameScene = this.scene.get('GameScene') as any;
    if (gameScene && gameScene.hikerData) {
        gameScene.hikerData.moodles.morale -= 15;
        // Add "Wet Feet" status logic if/when implemented
        // For now just morale/health
        gameScene.events.emit('game-event', { type: 'warning', message: 'Got soaked! Morale -15' });
    }

    this.time.delayedCall(1500, () => {
        this.scene.stop();
        this.scene.resume('GameScene');
    });
  }

  highlightMoves() {
    // Reset tints
    this.grid.forEach(row => row.forEach(rock => {
        if (rock.sprite.tintTopLeft !== 0x44ff44) { // Don't reset current spot
             rock.sprite.setTint(rock.isStable ? 0xaaaaaa : 0x88cc88);
        }
    }));

    // Highlight valid moves
    // ... logic to show valid rocks ...
  }

  win() {
    this.messageText.setText("Crossed safely!");
    this.messageText.setColor('#44ff44');
    
    const gameScene = this.scene.get('GameScene') as any;
    if (gameScene) {
        gameScene.events.emit('game-event', { type: 'success', message: 'River crossed dry! +10 XP' });
        // XP logic
    }

    this.time.delayedCall(1000, () => {
        this.scene.stop();
        this.scene.resume('GameScene');
    });
  }
}
