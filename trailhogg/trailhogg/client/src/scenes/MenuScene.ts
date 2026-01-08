import Phaser from 'phaser';

interface BuildInfo {
  id: string;
  name: string;
  description: string;
  stats: string;
}

const BUILDS: BuildInfo[] = [
  { id: 'weekend_warrior', name: 'Weekend Warrior', description: 'Decent fitness and budget, lacks trail experience.', stats: 'Trail Legs +25, Navigation +10' },
  { id: 'scout_leader', name: 'Scout Leader', description: 'Strong outdoor skills, modest fitness.', stats: 'Camp Craft +35, First Aid +30' },
  { id: 'ultra_runner', name: 'Ultra Runner', description: 'Incredible fitness, tends to push too hard.', stats: 'Trail Legs +50, Fortitude +30' },
  { id: 'gear_head', name: 'Gear Head', description: 'Top equipment, needs to build fitness.', stats: 'Gear +40, Premium Equipment' },
  { id: 'broke_college_kid', name: 'Broke College Kid', description: 'High motivation, strapped for cash.', stats: 'Fortitude +25, Social +30' },
  { id: 'retiree', name: 'Retiree', description: 'Unlimited time, wise pacing.', stats: 'Fortitude +40, Weather +25' }
];

export class MenuScene extends Phaser.Scene {
  private selectedBuild: number = 0;
  private hikerName: string = 'Hiker';
  private buildTexts: Phaser.GameObjects.Text[] = [];
  private descriptionText!: Phaser.GameObjects.Text;
  private statsText!: Phaser.GameObjects.Text;
  private nameText!: Phaser.GameObjects.Text;
  
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = this.cameras.main;
    
    // Title
    this.add.text(width / 2, 50, 'TRAIL LEGS', {
      font: '48px Courier',
      color: '#2e5339'
    }).setOrigin(0.5);
    
    this.add.text(width / 2, 90, 'An Appalachian Trail Simulation', {
      font: '16px Courier',
      color: '#666666',
      fontStyle: 'italic'
    }).setOrigin(0.5);
    
    // Name input area
    this.add.text(width / 2, 140, 'Your Name:', {
      font: '18px Courier',
      color: '#4a7d5a'
    }).setOrigin(0.5);
    
    // Name display (simulated input)
    const nameBox = this.add.rectangle(width / 2, 170, 200, 30, 0x333333);
    this.nameText = this.add.text(width / 2, 170, this.hikerName, {
      font: '18px Courier',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Make it interactive for name input
    nameBox.setInteractive();
    nameBox.on('pointerdown', () => {
      const name = prompt('Enter your hiker name:', this.hikerName);
      if (name && name.trim()) {
        this.hikerName = name.trim().substring(0, 20);
        this.nameText.setText(this.hikerName);
      }
    });
    
    // Build selection
    this.add.text(width / 2, 220, 'Choose Your Background:', {
      font: '18px Courier',
      color: '#4a7d5a'
    }).setOrigin(0.5);
    
    // Build options
    const startY = 260;
    const spacing = 35;
    
    BUILDS.forEach((build, index) => {
      const y = startY + index * spacing;
      const text = this.add.text(width / 2, y, build.name, {
        font: '16px Courier',
        color: index === this.selectedBuild ? '#ffffff' : '#888888'
      }).setOrigin(0.5);
      
      text.setInteractive();
      text.on('pointerover', () => {
        if (index !== this.selectedBuild) {
          text.setColor('#aaaaaa');
        }
      });
      text.on('pointerout', () => {
        text.setColor(index === this.selectedBuild ? '#ffffff' : '#888888');
      });
      text.on('pointerdown', () => {
        this.selectBuild(index);
      });
      
      this.buildTexts.push(text);
    });
    
    // Description box
    this.add.rectangle(width / 2, 500, 600, 80, 0x222222, 0.8);
    
    this.descriptionText = this.add.text(width / 2, 480, BUILDS[0].description, {
      font: '14px Courier',
      color: '#cccccc',
      wordWrap: { width: 580 },
      align: 'center'
    }).setOrigin(0.5);
    
    this.statsText = this.add.text(width / 2, 510, BUILDS[0].stats, {
      font: '14px Courier',
      color: '#4a7d5a',
      align: 'center'
    }).setOrigin(0.5);
    
    // Start button
    const startButton = this.add.rectangle(width / 2, 560, 200, 40, 0x2e5339);
    const startText = this.add.text(width / 2, 560, 'BEGIN HIKE', {
      font: '18px Courier',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    startButton.setInteractive();
    startButton.on('pointerover', () => {
      startButton.setFillStyle(0x4a7d5a);
    });
    startButton.on('pointerout', () => {
      startButton.setFillStyle(0x2e5339);
    });
    startButton.on('pointerdown', () => {
      this.startGame();
    });
    
    // Instructions
    this.add.text(width / 2, height - 20, 'Click a build to select, then BEGIN HIKE', {
      font: '12px Courier',
      color: '#666666'
    }).setOrigin(0.5);
    
    // Keyboard controls
    this.input.keyboard?.on('keydown-UP', () => {
      this.selectBuild((this.selectedBuild - 1 + BUILDS.length) % BUILDS.length);
    });
    this.input.keyboard?.on('keydown-DOWN', () => {
      this.selectBuild((this.selectedBuild + 1) % BUILDS.length);
    });
    this.input.keyboard?.on('keydown-ENTER', () => {
      this.startGame();
    });
  }
  
  selectBuild(index: number) {
    // Update old selection
    this.buildTexts[this.selectedBuild].setColor('#888888');
    
    // Update new selection
    this.selectedBuild = index;
    this.buildTexts[index].setColor('#ffffff');
    
    // Update description
    const build = BUILDS[index];
    this.descriptionText.setText(build.description);
    this.statsText.setText(build.stats);
  }
  
  startGame() {
    const build = BUILDS[this.selectedBuild];
    
    // Pass data to game scene
    this.scene.start('GameScene', {
      hikerName: this.hikerName,
      build: build.id
    });
    this.scene.start('UIScene');
  }
}
