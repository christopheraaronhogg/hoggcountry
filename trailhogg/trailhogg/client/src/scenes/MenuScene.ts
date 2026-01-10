import Phaser from 'phaser';
import { gameStorage } from '../storage/GameStorage';

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
  private hasSave: boolean = false;
  private saveInfo: { hikerName?: string; mile?: number; daysOnTrail?: number } = {};
  private isMobile: boolean = false;

  constructor() {
    super({ key: 'MenuScene' });
  }

  async create() {
    const { width, height } = this.cameras.main;

    // Detect mobile
    this.isMobile = this.sys.game.device.os.android || this.sys.game.device.os.iOS ||
                    this.sys.game.device.os.iPad || this.sys.game.device.os.iPhone ||
                    ('ontouchstart' in window) || width < 768;

    // Check for existing save
    const saveData = await gameStorage.getSaveInfo('autosave');
    this.hasSave = saveData.exists;
    if (saveData.exists) {
      this.saveInfo = saveData;
    }

    // Responsive sizing
    const titleSize = this.isMobile ? '32px' : '48px';
    const subtitleSize = this.isMobile ? '12px' : '16px';
    const titleY = this.isMobile ? 30 : 50;
    const subtitleY = this.isMobile ? 60 : 90;

    // Title
    this.add.text(width / 2, titleY, 'TRAILHOGG', {
      font: `${titleSize} Courier`,
      color: '#2e5339'
    }).setOrigin(0.5);

    this.add.text(width / 2, subtitleY, 'An Appalachian Trail Simulation', {
      font: `${subtitleSize} Courier`,
      color: '#666666',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    // Continue button (if save exists)
    const buttonHeight = this.isMobile ? 40 : 50;
    const buttonWidth = this.isMobile ? Math.min(250, width - 40) : 300;

    if (this.hasSave) {
      const continueY = this.isMobile ? 90 : 130;

      const continueButton = this.add.rectangle(width / 2, continueY, buttonWidth, buttonHeight, 0x4a7d5a);
      const continueText = this.add.text(width / 2, continueY - 5, 'CONTINUE', {
        font: this.isMobile ? '16px Courier' : '20px Courier',
        color: '#ffffff'
      }).setOrigin(0.5);

      const saveInfoText = this.add.text(width / 2, continueY + 15,
        `${this.saveInfo.hikerName} - Mile ${this.saveInfo.mile?.toFixed(1)} - Day ${this.saveInfo.daysOnTrail}`, {
        font: this.isMobile ? '10px Courier' : '12px Courier',
        color: '#cccccc'
      }).setOrigin(0.5);

      continueButton.setInteractive();
      continueButton.on('pointerover', () => continueButton.setFillStyle(0x5a9d6a));
      continueButton.on('pointerout', () => continueButton.setFillStyle(0x4a7d5a));
      continueButton.on('pointerdown', () => this.continueGame());
    }

    // Adjust Y positions based on whether continue button exists
    const offsetY = this.hasSave ? (this.isMobile ? 50 : 60) : 0;

    // Name input area
    const nameY = this.isMobile ? 120 + offsetY : 140 + offsetY;
    this.add.text(width / 2, nameY, 'Your Name:', {
      font: this.isMobile ? '14px Courier' : '18px Courier',
      color: '#4a7d5a'
    }).setOrigin(0.5);

    // Name display (simulated input)
    const nameBoxY = nameY + 30;
    const nameBox = this.add.rectangle(width / 2, nameBoxY, Math.min(200, width - 40), 30, 0x333333);
    this.nameText = this.add.text(width / 2, nameBoxY, this.hikerName, {
      font: this.isMobile ? '14px Courier' : '18px Courier',
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
    const buildTitleY = nameBoxY + 50;
    this.add.text(width / 2, buildTitleY, 'Choose Your Background:', {
      font: this.isMobile ? '14px Courier' : '18px Courier',
      color: '#4a7d5a'
    }).setOrigin(0.5);

    // Build options
    const startY = buildTitleY + 40;
    const spacing = this.isMobile ? 28 : 35;

    BUILDS.forEach((build, index) => {
      const y = startY + index * spacing;
      const text = this.add.text(width / 2, y, build.name, {
        font: this.isMobile ? '13px Courier' : '16px Courier',
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
    const descY = startY + BUILDS.length * spacing + 30;
    const descBoxWidth = this.isMobile ? width - 40 : 600;
    const descBoxHeight = this.isMobile ? 100 : 80;

    this.add.rectangle(width / 2, descY + 10, descBoxWidth, descBoxHeight, 0x222222, 0.8);

    this.descriptionText = this.add.text(width / 2, descY - 10, BUILDS[0].description, {
      font: this.isMobile ? '11px Courier' : '14px Courier',
      color: '#cccccc',
      wordWrap: { width: descBoxWidth - 20 },
      align: 'center'
    }).setOrigin(0.5);

    this.statsText = this.add.text(width / 2, descY + 20, BUILDS[0].stats, {
      font: this.isMobile ? '11px Courier' : '14px Courier',
      color: '#4a7d5a',
      align: 'center'
    }).setOrigin(0.5);

    // Start button (new game)
    const startButtonY = descY + descBoxHeight;
    const startButton = this.add.rectangle(width / 2, startButtonY, buttonWidth, buttonHeight, 0x2e5339);
    const startText = this.add.text(width / 2, startButtonY, this.hasSave ? 'NEW GAME' : 'HIT THE TRAIL', {
      font: this.isMobile ? '14px Courier' : '18px Courier',
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
      if (this.hasSave) {
        // Confirm overwrite
        if (confirm('Start a new game? Your current save will be overwritten.')) {
          this.startGame();
        }
      } else {
        this.startGame();
      }
    });

    // Instructions
    if (!this.isMobile) {
      this.add.text(width / 2, height - 20, 'Click a build to select, then HIT THE TRAIL', {
        font: '12px Courier',
        color: '#666666'
      }).setOrigin(0.5);
    }

    // Keyboard controls
    this.input.keyboard?.on('keydown-UP', () => {
      this.selectBuild((this.selectedBuild - 1 + BUILDS.length) % BUILDS.length);
    });
    this.input.keyboard?.on('keydown-DOWN', () => {
      this.selectBuild((this.selectedBuild + 1) % BUILDS.length);
    });
    this.input.keyboard?.on('keydown-ENTER', () => {
      if (this.hasSave) {
        this.continueGame();
      } else {
        this.startGame();
      }
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

  continueGame() {
    // Start game with save loading flag
    this.scene.start('GameScene', {
      hikerName: this.saveInfo.hikerName || 'Hiker',
      build: 'loaded',
      loadSave: true
    });
    this.scene.start('UIScene');
  }

  startGame() {
    const build = BUILDS[this.selectedBuild];

    // Pass data to game scene
    this.scene.start('GameScene', {
      hikerName: this.hikerName,
      build: build.id,
      loadSave: false
    });
    this.scene.start('UIScene');
  }
}
