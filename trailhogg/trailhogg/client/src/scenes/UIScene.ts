import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  // UI Elements
  private statsPanel!: Phaser.GameObjects.Container;
  private controlsPanel!: Phaser.GameObjects.Container;
  private eventLog!: Phaser.GameObjects.Container;
  private moodleIcons!: Phaser.GameObjects.Container;
  
  // Text displays
  private timeText!: Phaser.GameObjects.Text;
  private mileText!: Phaser.GameObjects.Text;
  private elevationText!: Phaser.GameObjects.Text;
  private caloriesBar!: Phaser.GameObjects.Graphics;
  private hydrationBar!: Phaser.GameObjects.Graphics;
  private energyBar!: Phaser.GameObjects.Graphics;
  private paceText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private weatherText!: Phaser.GameObjects.Text;
  private eventTexts: Phaser.GameObjects.Text[] = [];
  private lostIndicator!: Phaser.GameObjects.Text;
  private saveIndicator!: Phaser.GameObjects.Text;

  // State
  private currentState: any = null;
  private isMobile: boolean = false;

  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // Detect mobile
    this.isMobile = this.sys.game.device.os.android || this.sys.game.device.os.iOS ||
                    this.sys.game.device.os.iPad || this.sys.game.device.os.iPhone ||
                    ('ontouchstart' in window) || width < 768;
    
    // Create UI panels
    this.createStatsPanel();
    this.createControlsPanel();
    this.createEventLog();
    this.createMoodleIcons();
    
    // Listen for state updates from GameScene
    const gameScene = this.scene.get('GameScene');
    gameScene.events.on('state-update', this.onStateUpdate, this);
    gameScene.events.on('game-event', this.onGameEvent, this);
    
    // Create lost indicator (hidden by default)
    this.lostIndicator = this.add.text(width / 2, 60, '⚠ LOST - Press F to search, B to backtrack', {
      font: '16px Courier',
      color: '#ff6b6b',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setVisible(false).setDepth(100);

    // Create save indicator (hidden by default)
    this.saveIndicator = this.add.text(width - 10, 10, 'Saved', {
      font: '12px Courier',
      color: '#4a7d5a',
      backgroundColor: '#000000',
      padding: { x: 6, y: 3 }
    }).setOrigin(1, 0).setAlpha(0).setDepth(100);

    // Listen for save events
    gameScene.events.on('game-saved', this.onGameSaved, this);

    // Inventory button (hide on mobile, we have limited screen space)
    if (!this.isMobile) {
      const invBtn = this.add.rectangle(width - 50, height - 160, 80, 30, 0x4a7d5a);
      invBtn.setInteractive();
      const invText = this.add.text(width - 50, height - 160, 'PACK', {
        font: '14px Courier',
        color: '#ffffff'
      }).setOrigin(0.5);

      invBtn.on('pointerover', () => invBtn.setFillStyle(0x5a9d6a));
      invBtn.on('pointerout', () => invBtn.setFillStyle(0x4a7d5a));
      invBtn.on('pointerdown', () => this.openInventory());
    }

    // Keyboard handler for inventory
    this.input.keyboard?.on('keydown-I', () => this.openInventory());
  }

  openInventory() {
    const gameScene = this.scene.get('GameScene') as any;
    if (gameScene.hikerData?.inventory) {
      this.scene.pause('GameScene');
      this.scene.pause('UIScene');
      this.scene.launch('InventoryScene', { inventory: gameScene.hikerData.inventory });
    }
  }

  onGameSaved() {
    // Show save indicator with fade out
    this.saveIndicator.setAlpha(1);
    this.tweens.add({
      targets: this.saveIndicator,
      alpha: 0,
      duration: 1500,
      delay: 500,
      ease: 'Power2'
    });
  }
  
  createStatsPanel() {
    const { width } = this.cameras.main;

    // Responsive sizing
    const panelWidth = this.isMobile ? Math.min(180, width - 10) : 200;
    const panelHeight = this.isMobile ? 150 : 180;
    const fontSize = this.isMobile ? '10px' : '12px';
    const titleSize = this.isMobile ? '12px' : '14px';
    const padding = this.isMobile ? 5 : 10;
    const barWidth = this.isMobile ? 110 : 150;

    // Background
    const bg = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x000000, 0.6);
    bg.setOrigin(0, 0);

    // Time display
    this.timeText = this.add.text(padding, padding, 'Day 1, 6:00 AM', {
      font: `${titleSize} Courier`,
      color: '#4a7d5a'
    });

    // Weather
    this.weatherText = this.add.text(padding, padding + 18, '☀ Clear 55°F', {
      font: `${fontSize} Courier`,
      color: '#888888'
    });

    // Mile marker
    this.mileText = this.add.text(padding, padding + 36, 'Mile: 0.0 / 30.7', {
      font: `${titleSize} Courier`,
      color: '#ffffff'
    });

    // Elevation
    this.elevationText = this.add.text(padding, padding + 54, 'Elev: 3,782 ft', {
      font: `${fontSize} Courier`,
      color: '#aaaaaa'
    });

    // Status bars labels
    const barY1 = padding + 76;
    const barY2 = barY1 + 14;
    const barY3 = barY2 + 14;

    this.add.text(padding, barY1, 'Cal', { font: `${fontSize} Courier`, color: '#ff9999' });
    this.add.text(padding, barY2, 'H2O', { font: `${fontSize} Courier`, color: '#99ccff' });
    this.add.text(padding, barY3, 'Nrg', { font: `${fontSize} Courier`, color: '#99ff99' });

    // Status bars (graphics for fill)
    this.caloriesBar = this.add.graphics();
    this.hydrationBar = this.add.graphics();
    this.energyBar = this.add.graphics();

    const barX = this.isMobile ? 35 : 40;
    this.drawStatusBar(this.caloriesBar, barX, barY1, barWidth, 10, 1.0, 0xff6666);
    this.drawStatusBar(this.hydrationBar, barX, barY2, barWidth, 10, 1.0, 0x6699ff);
    this.drawStatusBar(this.energyBar, barX, barY3, barWidth, 10, 1.0, 0x66ff66);

    // Pace display (hide on mobile to save space)
    if (!this.isMobile) {
      this.paceText = this.add.text(padding, 142, 'Pace: Normal (2.0 mph)', {
        font: `${fontSize} Courier`,
        color: '#cccccc'
      });

      // Current status
      this.statusText = this.add.text(padding, 160, 'Status: Ready', {
        font: `${fontSize} Courier`,
        color: '#4a7d5a'
      });

      this.statsPanel = this.add.container(0, 0, [
        bg, this.timeText, this.weatherText, this.mileText, this.elevationText,
        this.caloriesBar, this.hydrationBar, this.energyBar,
        this.paceText, this.statusText
      ]);
    } else {
      // Mobile: status only, no pace
      this.statusText = this.add.text(padding, barY3 + 18, 'Ready', {
        font: `${fontSize} Courier`,
        color: '#4a7d5a'
      });

      this.paceText = this.add.text(0, 0, '', { font: `${fontSize} Courier` }); // Placeholder

      this.statsPanel = this.add.container(0, 0, [
        bg, this.timeText, this.weatherText, this.mileText, this.elevationText,
        this.caloriesBar, this.hydrationBar, this.energyBar,
        this.statusText
      ]);
    }
  }
  
  createControlsPanel() {
    const { width, height } = this.cameras.main;

    // Hide controls panel on mobile (we have touch controls)
    if (this.isMobile) {
      this.controlsPanel = this.add.container(0, 0, []);
      return;
    }

    const bg = this.add.rectangle(0, 0, 200, 140, 0x000000, 0.7);
    bg.setOrigin(0, 0);

    const title = this.add.text(10, 5, 'CONTROLS', {
      font: '12px Courier',
      color: '#4a7d5a'
    });

    const controls = [
      '[WASD/Arrows] Move',
      '[SPACE] Start/Stop Hiking',
      '[1-4] Set Pace',
      '[E] Eat  [Q] Drink',
      '[R] Rest/Camp  [I] Pack',
      '[F] Search (lost)'
    ];

    const controlTexts = controls.map((text, i) => {
      return this.add.text(10, 22 + i * 18, text, {
        font: '11px Courier',
        color: '#888888'
      });
    });

    this.controlsPanel = this.add.container(width - 200, height - 140, [bg, title, ...controlTexts]);
  }
  
  createEventLog() {
    const { width, height } = this.cameras.main;

    // Responsive sizing
    const logHeight = this.isMobile ? 60 : 80;
    const fontSize = this.isMobile ? '9px' : '11px';
    const lineHeight = this.isMobile ? 12 : 14;
    const numLines = this.isMobile ? 3 : 4;

    const bg = this.add.rectangle(0, 0, width, logHeight, 0x000000, 0.6);
    bg.setOrigin(0, 0);

    const title = this.add.text(10, 3, 'EVENT LOG', {
      font: this.isMobile ? '9px Courier' : '10px Courier',
      color: '#4a7d5a'
    });

    // Create lines for events
    for (let i = 0; i < numLines; i++) {
      const text = this.add.text(10, 16 + i * lineHeight, '', {
        font: `${fontSize} Courier`,
        color: '#aaaaaa'
      });
      this.eventTexts.push(text);
    }

    this.eventLog = this.add.container(0, height - logHeight, [bg, title, ...this.eventTexts]);
  }
  
  createMoodleIcons() {
    const { width } = this.cameras.main;
    
    // Moodle display area (right side, under stats)
    const bg = this.add.rectangle(0, 0, 100, 120, 0x000000, 0.5);
    bg.setOrigin(0, 0);
    
    const title = this.add.text(5, 5, 'STATUS', {
      font: '10px Courier',
      color: '#666666'
    });
    
    this.moodleIcons = this.add.container(width - 105, 5, [bg, title]);
  }
  
  drawStatusBar(graphics: Phaser.GameObjects.Graphics, x: number, y: number, 
                maxWidth: number, height: number, percent: number, color: number) {
    graphics.clear();
    
    // Background
    graphics.fillStyle(0x333333);
    graphics.fillRect(x, y, maxWidth, height);
    
    // Fill
    graphics.fillStyle(color);
    graphics.fillRect(x, y, maxWidth * Math.max(0, Math.min(1, percent)), height);
    
    // Border
    graphics.lineStyle(1, 0x666666);
    graphics.strokeRect(x, y, maxWidth, height);
  }
  
  onStateUpdate(data: { hiker: any, game: any }) {
    this.currentState = data;
    
    const { hiker, game } = data;
    if (!hiker || !game) return;
    
    // Update time
    const hour12 = game.time.hour % 12 || 12;
    const ampm = game.time.hour < 12 ? 'AM' : 'PM';
    const minute = game.time.minute.toString().padStart(2, '0');
    this.timeText.setText(`Day ${game.time.day}, ${hour12}:${minute} ${ampm}`);
    
    // Update weather
    const weatherIcons: Record<string, string> = {
      clear: '☀', cloudy: '☁', rain_light: '🌧', rain_heavy: '⛈', 
      fog: '🌫', storm: '⛈'
    };
    const icon = weatherIcons[game.weather] || '☀';
    this.weatherText.setText(`${icon} ${game.weather.replace('_', ' ')} ${game.temperature}°F`);
    
    // Update mile
    this.mileText.setText(`Mile: ${hiker.mile.toFixed(1)} / 30.7`);
    
    // Update elevation
    this.elevationText.setText(`Elev: ${hiker.elevation?.toLocaleString() || 3782} ft`);
    
    // Update status bars (use responsive sizing)
    const barX = this.isMobile ? 35 : 40;
    const barWidth = this.isMobile ? 110 : 150;
    const padding = this.isMobile ? 5 : 10;
    const barY1 = padding + 76;
    const barY2 = barY1 + 14;
    const barY3 = barY2 + 14;

    this.drawStatusBar(this.caloriesBar, barX, barY1, barWidth, 10, hiker.calories / 3000, 0xff6666);
    this.drawStatusBar(this.hydrationBar, barX, barY2, barWidth, 10, hiker.hydration / 100, 0x6699ff);
    this.drawStatusBar(this.energyBar, barX, barY3, barWidth, 10, hiker.energy / 100, 0x66ff66);
    
    // Update pace
    const paceSpeed: Record<string, number> = {
      slow: 1.5, normal: 2.0, fast: 2.5, rush: 3.0
    };
    const speed = paceSpeed[hiker.pace] || 2.0;
    this.paceText.setText(`Pace: ${hiker.pace} (${speed} mph)`);
    
    // Update status text
    let status = 'Ready';
    if (hiker.isHiking) status = 'Hiking...';
    else if (hiker.isResting) status = 'Resting...';
    else if (hiker.lostState !== 'on_trail') status = 'LOST!';
    
    this.statusText.setText(`Status: ${status}`);
    this.statusText.setColor(hiker.lostState !== 'on_trail' ? '#ff6b6b' : '#4a7d5a');
    
    // Show/hide lost indicator
    this.lostIndicator.setVisible(hiker.lostState !== 'on_trail');
    
    // Update moodles
    this.updateMoodles(hiker.moodles);
  }
  
  updateMoodles(moodles: any) {
    // Clear existing moodle texts
    this.moodleIcons.each((child: Phaser.GameObjects.GameObject) => {
      if (child instanceof Phaser.GameObjects.Text && child.getData('isMoodle')) {
        child.destroy();
      }
    });
    
    let y = 22;
    const moodleConfig: Array<{ key: string, label: string, color: string }> = [
      { key: 'hunger', label: '🍽 Hungry', color: '#ffaa66' },
      { key: 'thirst', label: '💧 Thirsty', color: '#66aaff' },
      { key: 'fatigue', label: '😴 Tired', color: '#aa66ff' },
      { key: 'anxiety', label: '😰 Anxious', color: '#ff6666' },
      { key: 'pain', label: '🤕 Pain', color: '#ff4444' }
    ];
    
    for (const cfg of moodleConfig) {
      const level = moodles[cfg.key] || 0;
      if (level > 0) {
        const severity = level >= 3 ? '!!!' : (level >= 2 ? '!' : '');
        const text = this.add.text(5, y, `${cfg.label}${severity}`, {
          font: '10px Courier',
          color: cfg.color
        });
        text.setData('isMoodle', true);
        this.moodleIcons.add(text);
        y += 14;
      }
    }
    
    // Morale indicator
    const morale = moodles.morale || 50;
    let moraleText = '😐 OK';
    let moraleColor = '#888888';
    if (morale >= 70) { moraleText = '😊 Good'; moraleColor = '#66ff66'; }
    else if (morale >= 40) { moraleText = '😐 OK'; moraleColor = '#ffff66'; }
    else if (morale >= 20) { moraleText = '😟 Low'; moraleColor = '#ffaa66'; }
    else { moraleText = '😢 Bad'; moraleColor = '#ff6666'; }
    
    const moraleDisplay = this.add.text(5, y, moraleText, {
      font: '10px Courier',
      color: moraleColor
    });
    moraleDisplay.setData('isMoodle', true);
    this.moodleIcons.add(moraleDisplay);
  }
  
  onGameEvent(event: { type: string, message: string }) {
    // Shift existing events up
    for (let i = this.eventTexts.length - 1; i > 0; i--) {
      this.eventTexts[i].setText(this.eventTexts[i - 1].text);
      this.eventTexts[i].setColor(this.eventTexts[i - 1].style.color as string);
    }
    
    // Add new event at top
    let color = '#aaaaaa';
    if (event.type === 'success') color = '#66ff66';
    else if (event.type === 'warning') color = '#ffaa66';
    else if (event.type === 'danger' || event.type === 'lost') color = '#ff6666';
    else if (event.type === 'milestone') color = '#66ffff';
    
    this.eventTexts[0].setText(`> ${event.message}`);
    this.eventTexts[0].setColor(color);
  }
}
