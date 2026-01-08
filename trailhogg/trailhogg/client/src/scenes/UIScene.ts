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
  
  // State
  private currentState: any = null;
  
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    const { width, height } = this.cameras.main;
    
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
    this.lostIndicator = this.add.text(width / 2, 60, '⚠ LOST - Press S to search, B to backtrack', {
      font: '16px Courier',
      color: '#ff6b6b',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setVisible(false).setDepth(100);
  }
  
  createStatsPanel() {
    const { width } = this.cameras.main;
    
    // Background
    const bg = this.add.rectangle(0, 0, 200, 180, 0x000000, 0.7);
    bg.setOrigin(0, 0);
    
    // Time display
    this.timeText = this.add.text(10, 10, 'Day 1, 6:00 AM', {
      font: '14px Courier',
      color: '#4a7d5a'
    });
    
    // Weather
    this.weatherText = this.add.text(10, 28, '☀ Clear 55°F', {
      font: '12px Courier',
      color: '#888888'
    });
    
    // Mile marker
    this.mileText = this.add.text(10, 48, 'Mile: 0.0 / 30.7', {
      font: '14px Courier',
      color: '#ffffff'
    });
    
    // Elevation
    this.elevationText = this.add.text(10, 66, 'Elev: 3,782 ft', {
      font: '12px Courier',
      color: '#aaaaaa'
    });
    
    // Status bars labels
    this.add.text(10, 90, 'Cal', { font: '10px Courier', color: '#ff9999' });
    this.add.text(10, 106, 'H2O', { font: '10px Courier', color: '#99ccff' });
    this.add.text(10, 122, 'Nrg', { font: '10px Courier', color: '#99ff99' });
    
    // Status bars (graphics for fill)
    this.caloriesBar = this.add.graphics();
    this.hydrationBar = this.add.graphics();
    this.energyBar = this.add.graphics();
    
    this.drawStatusBar(this.caloriesBar, 40, 90, 150, 12, 1.0, 0xff6666);
    this.drawStatusBar(this.hydrationBar, 40, 106, 150, 12, 1.0, 0x6699ff);
    this.drawStatusBar(this.energyBar, 40, 122, 150, 12, 1.0, 0x66ff66);
    
    // Pace display
    this.paceText = this.add.text(10, 142, 'Pace: Normal (2.0 mph)', {
      font: '12px Courier',
      color: '#cccccc'
    });
    
    // Current status
    this.statusText = this.add.text(10, 160, 'Status: Ready', {
      font: '12px Courier',
      color: '#4a7d5a'
    });
    
    this.statsPanel = this.add.container(0, 0, [
      bg, this.timeText, this.weatherText, this.mileText, this.elevationText,
      this.caloriesBar, this.hydrationBar, this.energyBar,
      this.paceText, this.statusText
    ]);
  }
  
  createControlsPanel() {
    const { width, height } = this.cameras.main;
    
    const bg = this.add.rectangle(0, 0, 200, 140, 0x000000, 0.7);
    bg.setOrigin(0, 0);
    
    const title = this.add.text(10, 5, 'CONTROLS', {
      font: '12px Courier',
      color: '#4a7d5a'
    });
    
    const controls = [
      '[SPACE] Start/Stop Hiking',
      '[1-4] Set Pace',
      '[E] Eat  [D] Drink',
      '[R] Rest/Camp',
      '[S] Search (if lost)',
      '[B] Backtrack (if lost)'
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
    
    const bg = this.add.rectangle(0, 0, width, 80, 0x000000, 0.6);
    bg.setOrigin(0, 0);
    
    const title = this.add.text(10, 5, 'EVENT LOG', {
      font: '10px Courier',
      color: '#4a7d5a'
    });
    
    // Create 4 lines for events
    for (let i = 0; i < 4; i++) {
      const text = this.add.text(10, 20 + i * 14, '', {
        font: '11px Courier',
        color: '#aaaaaa'
      });
      this.eventTexts.push(text);
    }
    
    this.eventLog = this.add.container(0, height - 80, [bg, title, ...this.eventTexts]);
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
    
    // Update status bars
    this.drawStatusBar(this.caloriesBar, 40, 90, 150, 12, hiker.calories / 3000, 0xff6666);
    this.drawStatusBar(this.hydrationBar, 40, 106, 150, 12, hiker.hydration / 100, 0x6699ff);
    this.drawStatusBar(this.energyBar, 40, 122, 150, 12, hiker.energy / 100, 0x66ff66);
    
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
