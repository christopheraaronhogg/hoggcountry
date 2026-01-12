import Phaser from 'phaser';
import { gameStorage } from '../storage/GameStorage';
import { networkManager } from '../network/NetworkManager';

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

type MenuView = 'main' | 'multiplayer' | 'host' | 'join';

export class MenuScene extends Phaser.Scene {
  private selectedBuild: number = 0;
  private hikerName: string = 'Hiker';
  private trailName: string = '';
  private buildTexts: Phaser.GameObjects.Text[] = [];
  private descriptionText!: Phaser.GameObjects.Text;
  private statsText!: Phaser.GameObjects.Text;
  private nameText!: Phaser.GameObjects.Text;
  private hasSave: boolean = false;
  private saveInfo: { hikerName?: string; mile?: number; daysOnTrail?: number } = {};
  private isMobile: boolean = false;

  // Multiplayer state
  private currentView: MenuView = 'main';
  private menuContainer!: Phaser.GameObjects.Container;
  private roomCode: string = '';
  private roomCodeText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private isConnecting: boolean = false;

  constructor() {
    super({ key: 'MenuScene' });
  }

  async create() {
    const { width, height } = this.cameras.main;

    // Check for reset parameter in URL (?reset=true)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reset') === 'true') {
      await gameStorage.deleteSave('autosave');
      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
      console.log('Save data reset via URL parameter');
    }

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

    // Generate random trail name if not set
    if (!this.trailName) {
      const trailNames = ['Blaze', 'Rambler', 'Moonshine', 'Sherpa', 'Tortoise', 'Wildflower', 'Nomad', 'Dirtbag'];
      this.trailName = trailNames[Math.floor(Math.random() * trailNames.length)];
    }

    // Container for all menu elements (makes view switching easy)
    this.menuContainer = this.add.container(0, 0);

    // Handle resize events
    this.scale.on('resize', this.onResize, this);

    this.showMainMenu();
  }

  private onResize(gameSize: Phaser.Structs.Size) {
    const width = gameSize.width;

    // Update mobile detection
    this.isMobile = this.sys.game.device.os.android || this.sys.game.device.os.iOS ||
                    this.sys.game.device.os.iPad || this.sys.game.device.os.iPhone ||
                    ('ontouchstart' in window) || width < 768;

    // Recreate current view with new dimensions
    switch (this.currentView) {
      case 'main':
        this.showMainMenu();
        break;
      case 'multiplayer':
        this.showMultiplayerMenu();
        break;
      case 'host':
        // Don't recreate host menu to avoid losing room code state
        break;
      case 'join':
        // Don't recreate join menu to avoid losing room code input
        break;
    }
  }

  private clearMenu() {
    this.menuContainer.removeAll(true);
    this.buildTexts = [];
  }

  private showMainMenu() {
    this.clearMenu();
    this.currentView = 'main';

    const { width, height } = this.cameras.main;

    // Responsive sizing
    const titleSize = this.isMobile ? '32px' : '48px';
    const subtitleSize = this.isMobile ? '12px' : '16px';
    const titleY = this.isMobile ? 30 : 50;
    const subtitleY = this.isMobile ? 60 : 90;

    // Title
    this.menuContainer.add(this.add.text(width / 2, titleY, 'TRAILHOGG', {
      font: `${titleSize} Courier`,
      color: '#2e5339'
    }).setOrigin(0.5));

    this.menuContainer.add(this.add.text(width / 2, subtitleY, 'An Appalachian Trail Simulation', {
      font: `${subtitleSize} Courier`,
      color: '#666666',
      fontStyle: 'italic'
    }).setOrigin(0.5));

    // Continue button (if save exists)
    const buttonHeight = this.isMobile ? 40 : 50;
    const buttonWidth = this.isMobile ? Math.min(250, width - 40) : 300;

    let offsetY = 0;

    if (this.hasSave) {
      const continueY = this.isMobile ? 90 : 130;
      offsetY = this.isMobile ? 70 : 80;

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

      this.menuContainer.add([continueButton, continueText, saveInfoText]);

      // Delete Save button (small, below continue)
      const deleteY = continueY + 45;
      const deleteButton = this.add.rectangle(width / 2, deleteY, 120, 25, 0x442222);
      const deleteText = this.add.text(width / 2, deleteY, '🗑️ Delete Save', {
        font: '11px Courier',
        color: '#aa6666'
      }).setOrigin(0.5);

      deleteButton.setInteractive();
      deleteButton.on('pointerover', () => {
        deleteButton.setFillStyle(0x663333);
        deleteText.setColor('#ff8888');
      });
      deleteButton.on('pointerout', () => {
        deleteButton.setFillStyle(0x442222);
        deleteText.setColor('#aa6666');
      });
      deleteButton.on('pointerdown', () => this.deleteSave());

      this.menuContainer.add([deleteButton, deleteText]);
    }

    // Name input area
    const nameY = this.isMobile ? 120 + offsetY : 140 + offsetY;
    this.menuContainer.add(this.add.text(width / 2, nameY, 'Your Name:', {
      font: this.isMobile ? '14px Courier' : '18px Courier',
      color: '#4a7d5a'
    }).setOrigin(0.5));

    // Name display (simulated input)
    const nameBoxY = nameY + 30;
    const nameBox = this.add.rectangle(width / 2, nameBoxY, Math.min(200, width - 40), 30, 0x333333);
    this.nameText = this.add.text(width / 2, nameBoxY, this.hikerName, {
      font: this.isMobile ? '14px Courier' : '18px Courier',
      color: '#ffffff'
    }).setOrigin(0.5);

    nameBox.setInteractive();
    nameBox.on('pointerdown', () => {
      const name = prompt('Enter your hiker name:', this.hikerName);
      if (name && name.trim()) {
        this.hikerName = name.trim().substring(0, 20);
        this.nameText.setText(this.hikerName);
      }
    });

    this.menuContainer.add([nameBox, this.nameText]);

    // Build selection
    const buildTitleY = nameBoxY + 50;
    this.menuContainer.add(this.add.text(width / 2, buildTitleY, 'Choose Your Background:', {
      font: this.isMobile ? '14px Courier' : '18px Courier',
      color: '#4a7d5a'
    }).setOrigin(0.5));

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
      this.menuContainer.add(text);
    });

    // Description box
    const descY = startY + BUILDS.length * spacing + 30;
    const descBoxWidth = this.isMobile ? width - 40 : 600;
    const descBoxHeight = this.isMobile ? 80 : 60;

    this.menuContainer.add(this.add.rectangle(width / 2, descY + 10, descBoxWidth, descBoxHeight, 0x222222, 0.8));

    this.descriptionText = this.add.text(width / 2, descY - 5, BUILDS[0].description, {
      font: this.isMobile ? '11px Courier' : '14px Courier',
      color: '#cccccc',
      wordWrap: { width: descBoxWidth - 20 },
      align: 'center'
    }).setOrigin(0.5);
    this.menuContainer.add(this.descriptionText);

    this.statsText = this.add.text(width / 2, descY + 20, BUILDS[0].stats, {
      font: this.isMobile ? '11px Courier' : '14px Courier',
      color: '#4a7d5a',
      align: 'center'
    }).setOrigin(0.5);
    this.menuContainer.add(this.statsText);

    // Buttons row
    const buttonsY = descY + descBoxHeight + 10;
    const smallButtonWidth = this.isMobile ? (width - 60) / 2 : 145;

    // Start Solo button
    const soloButton = this.add.rectangle(width / 2 - smallButtonWidth / 2 - 5, buttonsY, smallButtonWidth, buttonHeight, 0x2e5339);
    const soloText = this.add.text(width / 2 - smallButtonWidth / 2 - 5, buttonsY, 'SOLO', {
      font: this.isMobile ? '14px Courier' : '16px Courier',
      color: '#ffffff'
    }).setOrigin(0.5);

    soloButton.setInteractive();
    soloButton.on('pointerover', () => soloButton.setFillStyle(0x4a7d5a));
    soloButton.on('pointerout', () => soloButton.setFillStyle(0x2e5339));
    soloButton.on('pointerdown', () => {
      if (this.hasSave) {
        if (confirm('Start a new game? Your current save will be overwritten.')) {
          this.startGame(false);
        }
      } else {
        this.startGame(false);
      }
    });

    this.menuContainer.add([soloButton, soloText]);

    // Multiplayer button
    const mpButton = this.add.rectangle(width / 2 + smallButtonWidth / 2 + 5, buttonsY, smallButtonWidth, buttonHeight, 0x2e5339);
    const mpText = this.add.text(width / 2 + smallButtonWidth / 2 + 5, buttonsY, 'CO-OP', {
      font: this.isMobile ? '14px Courier' : '16px Courier',
      color: '#ffffff'
    }).setOrigin(0.5);

    mpButton.setInteractive();
    mpButton.on('pointerover', () => mpButton.setFillStyle(0x4a7d5a));
    mpButton.on('pointerout', () => mpButton.setFillStyle(0x2e5339));
    mpButton.on('pointerdown', () => this.showMultiplayerMenu());

    this.menuContainer.add([mpButton, mpText]);

    // Keyboard controls
    this.input.keyboard?.removeAllListeners();
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
        this.startGame(false);
      }
    });
  }

  private showMultiplayerMenu() {
    this.clearMenu();
    this.currentView = 'multiplayer';

    const { width, height } = this.cameras.main;
    const buttonHeight = this.isMobile ? 50 : 60;
    const buttonWidth = this.isMobile ? width - 60 : 300;

    // Title
    this.menuContainer.add(this.add.text(width / 2, 50, 'MULTIPLAYER', {
      font: this.isMobile ? '28px Courier' : '36px Courier',
      color: '#2e5339'
    }).setOrigin(0.5));

    this.menuContainer.add(this.add.text(width / 2, 90, 'Hike with friends - no server needed!', {
      font: this.isMobile ? '12px Courier' : '14px Courier',
      color: '#888888',
      fontStyle: 'italic'
    }).setOrigin(0.5));

    // === GLOBAL TRAIL (MMO) ===
    const globalY = 140;
    const globalButton = this.add.rectangle(width / 2, globalY, buttonWidth, buttonHeight, 0x2277aa);
    this.menuContainer.add(globalButton);

    this.menuContainer.add(this.add.text(width / 2, globalY - 8, '🌐 JOIN GLOBAL TRAIL', {
      font: this.isMobile ? '16px Courier' : '20px Courier',
      color: '#ffffff'
    }).setOrigin(0.5));

    this.menuContainer.add(this.add.text(width / 2, globalY + 12, 'One trail, all hikers, real-time sync', {
      font: this.isMobile ? '10px Courier' : '12px Courier',
      color: '#aaddff'
    }).setOrigin(0.5));

    globalButton.setInteractive();
    globalButton.on('pointerover', () => globalButton.setFillStyle(0x3399cc));
    globalButton.on('pointerout', () => globalButton.setFillStyle(0x2277aa));
    globalButton.on('pointerdown', () => this.startGlobalTrail());

    // === CO-OP SECTION ===
    this.menuContainer.add(this.add.text(width / 2, 200, '— OR CO-OP WITH FRIENDS —', {
      font: this.isMobile ? '10px Courier' : '12px Courier',
      color: '#666666'
    }).setOrigin(0.5));

    // Host button
    const hostY = 240;
    const hostButton = this.add.rectangle(width / 2, hostY, buttonWidth, buttonHeight, 0x4a7d5a);
    this.menuContainer.add(hostButton);

    this.menuContainer.add(this.add.text(width / 2, hostY - 8, 'HOST SESSION', {
      font: this.isMobile ? '16px Courier' : '20px Courier',
      color: '#ffffff'
    }).setOrigin(0.5));

    this.menuContainer.add(this.add.text(width / 2, hostY + 12, 'Start a session for friends to join', {
      font: this.isMobile ? '10px Courier' : '12px Courier',
      color: '#cccccc'
    }).setOrigin(0.5));

    hostButton.setInteractive();
    hostButton.on('pointerover', () => hostButton.setFillStyle(0x5a9d6a));
    hostButton.on('pointerout', () => hostButton.setFillStyle(0x4a7d5a));
    hostButton.on('pointerdown', () => this.showHostMenu());

    // Join button
    const joinY = 320;
    const joinButton = this.add.rectangle(width / 2, joinY, buttonWidth, buttonHeight, 0x2e5339);
    this.menuContainer.add(joinButton);

    this.menuContainer.add(this.add.text(width / 2, joinY - 8, 'JOIN SESSION', {
      font: this.isMobile ? '16px Courier' : '20px Courier',
      color: '#ffffff'
    }).setOrigin(0.5));

    this.menuContainer.add(this.add.text(width / 2, joinY + 12, 'Enter a room code to join a friend', {
      font: this.isMobile ? '10px Courier' : '12px Courier',
      color: '#cccccc'
    }).setOrigin(0.5));

    joinButton.setInteractive();
    joinButton.on('pointerover', () => joinButton.setFillStyle(0x4a7d5a));
    joinButton.on('pointerout', () => joinButton.setFillStyle(0x2e5339));
    joinButton.on('pointerdown', () => this.showJoinMenu());

    // Back button
    const backY = height - 60;
    const backButton = this.add.rectangle(width / 2, backY, 150, 40, 0x333333);
    this.menuContainer.add(backButton);

    this.menuContainer.add(this.add.text(width / 2, backY, '< BACK', {
      font: this.isMobile ? '14px Courier' : '16px Courier',
      color: '#aaaaaa'
    }).setOrigin(0.5));

    backButton.setInteractive();
    backButton.on('pointerover', () => backButton.setFillStyle(0x444444));
    backButton.on('pointerout', () => backButton.setFillStyle(0x333333));
    backButton.on('pointerdown', () => this.showMainMenu());

    // Keyboard
    this.input.keyboard?.removeAllListeners();
    this.input.keyboard?.on('keydown-ESC', () => this.showMainMenu());
  }

  private async showHostMenu() {
    this.clearMenu();
    this.currentView = 'host';

    const { width, height } = this.cameras.main;

    // Title
    this.menuContainer.add(this.add.text(width / 2, 50, 'HOST SESSION', {
      font: this.isMobile ? '28px Courier' : '36px Courier',
      color: '#2e5339'
    }).setOrigin(0.5));

    // Status
    this.statusText = this.add.text(width / 2, 100, 'Creating session...', {
      font: this.isMobile ? '14px Courier' : '16px Courier',
      color: '#888888'
    }).setOrigin(0.5);
    this.menuContainer.add(this.statusText);

    // Room code display area
    const codeBoxY = 180;
    this.menuContainer.add(this.add.rectangle(width / 2, codeBoxY, 250, 80, 0x222222));
    this.menuContainer.add(this.add.rectangle(width / 2, codeBoxY, 250, 80, 0x333333, 0).setStrokeStyle(3, 0x4a7d5a));

    this.menuContainer.add(this.add.text(width / 2, codeBoxY - 25, 'ROOM CODE', {
      font: '12px Courier',
      color: '#888888'
    }).setOrigin(0.5));

    this.roomCodeText = this.add.text(width / 2, codeBoxY + 10, '------', {
      font: 'bold 32px Courier',
      color: '#4aff4a'
    }).setOrigin(0.5);
    this.menuContainer.add(this.roomCodeText);

    // Instructions
    this.menuContainer.add(this.add.text(width / 2, 260, 'Share this code with your hiking buddies!', {
      font: this.isMobile ? '12px Courier' : '14px Courier',
      color: '#aaaaaa'
    }).setOrigin(0.5));

    // Player count
    const playerCountText = this.add.text(width / 2, 300, 'Players: 1', {
      font: this.isMobile ? '14px Courier' : '16px Courier',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.menuContainer.add(playerCountText);

    // Start button (disabled until ready)
    const startY = 360;
    const startButton = this.add.rectangle(width / 2, startY, 200, 50, 0x2e5339);
    const startText = this.add.text(width / 2, startY, 'START HIKE', {
      font: this.isMobile ? '16px Courier' : '18px Courier',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.menuContainer.add([startButton, startText]);

    startButton.setInteractive();
    startButton.on('pointerover', () => startButton.setFillStyle(0x4a7d5a));
    startButton.on('pointerout', () => startButton.setFillStyle(0x2e5339));
    startButton.on('pointerdown', () => {
      if (networkManager.isConnected) {
        this.startGame(true);
      }
    });

    // Back button
    const backY = height - 60;
    const backButton = this.add.rectangle(width / 2, backY, 150, 40, 0x333333);
    this.menuContainer.add(backButton);

    this.menuContainer.add(this.add.text(width / 2, backY, '< BACK', {
      font: this.isMobile ? '14px Courier' : '16px Courier',
      color: '#aaaaaa'
    }).setOrigin(0.5));

    backButton.setInteractive();
    backButton.on('pointerover', () => backButton.setFillStyle(0x444444));
    backButton.on('pointerout', () => backButton.setFillStyle(0x333333));
    backButton.on('pointerdown', () => {
      networkManager.disconnect();
      this.showMultiplayerMenu();
    });

    // Actually host the session
    try {
      const roomCode = await networkManager.hostSession(this.hikerName, this.trailName);
      this.roomCode = roomCode;
      this.roomCodeText.setText(roomCode);
      this.statusText.setText('Session ready! Waiting for players...');
      this.statusText.setColor('#4aff4a');

      // Update player count periodically
      this.time.addEvent({
        delay: 1000,
        callback: () => {
          if (this.currentView === 'host') {
            playerCountText.setText(`Players: ${networkManager.playerCount}`);
          }
        },
        loop: true
      });

    } catch (err: any) {
      this.statusText.setText(`Error: ${err.message}`);
      this.statusText.setColor('#ff4a4a');
    }

    // Keyboard
    this.input.keyboard?.removeAllListeners();
    this.input.keyboard?.on('keydown-ESC', () => {
      networkManager.disconnect();
      this.showMultiplayerMenu();
    });
  }

  private showJoinMenu() {
    this.clearMenu();
    this.currentView = 'join';

    const { width, height } = this.cameras.main;

    // Title
    this.menuContainer.add(this.add.text(width / 2, 50, 'JOIN SESSION', {
      font: this.isMobile ? '28px Courier' : '36px Courier',
      color: '#2e5339'
    }).setOrigin(0.5));

    // Status
    this.statusText = this.add.text(width / 2, 100, 'Enter room code from host', {
      font: this.isMobile ? '14px Courier' : '16px Courier',
      color: '#888888'
    }).setOrigin(0.5);
    this.menuContainer.add(this.statusText);

    // Room code input
    const codeBoxY = 180;
    const codeBox = this.add.rectangle(width / 2, codeBoxY, 250, 80, 0x222222);
    this.menuContainer.add(codeBox);
    this.menuContainer.add(this.add.rectangle(width / 2, codeBoxY, 250, 80, 0x333333, 0).setStrokeStyle(3, 0x4a7d5a));

    this.menuContainer.add(this.add.text(width / 2, codeBoxY - 25, 'ROOM CODE', {
      font: '12px Courier',
      color: '#888888'
    }).setOrigin(0.5));

    this.roomCodeText = this.add.text(width / 2, codeBoxY + 10, this.roomCode || 'CLICK TO ENTER', {
      font: 'bold 24px Courier',
      color: this.roomCode ? '#ffffff' : '#666666'
    }).setOrigin(0.5);
    this.menuContainer.add(this.roomCodeText);

    codeBox.setInteractive();
    codeBox.on('pointerdown', () => {
      const code = prompt('Enter room code:', this.roomCode);
      if (code && code.trim()) {
        this.roomCode = code.trim().toUpperCase();
        this.roomCodeText.setText(this.roomCode);
        this.roomCodeText.setColor('#ffffff');
      }
    });

    // Join button
    const joinY = 280;
    const joinButton = this.add.rectangle(width / 2, joinY, 200, 50, 0x4a7d5a);
    const joinText = this.add.text(width / 2, joinY, 'JOIN', {
      font: this.isMobile ? '16px Courier' : '18px Courier',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.menuContainer.add([joinButton, joinText]);

    joinButton.setInteractive();
    joinButton.on('pointerover', () => {
      if (!this.isConnecting) joinButton.setFillStyle(0x5a9d6a);
    });
    joinButton.on('pointerout', () => {
      if (!this.isConnecting) joinButton.setFillStyle(0x4a7d5a);
    });
    joinButton.on('pointerdown', () => this.attemptJoin());

    // Back button
    const backY = height - 60;
    const backButton = this.add.rectangle(width / 2, backY, 150, 40, 0x333333);
    this.menuContainer.add(backButton);

    this.menuContainer.add(this.add.text(width / 2, backY, '< BACK', {
      font: this.isMobile ? '14px Courier' : '16px Courier',
      color: '#aaaaaa'
    }).setOrigin(0.5));

    backButton.setInteractive();
    backButton.on('pointerover', () => backButton.setFillStyle(0x444444));
    backButton.on('pointerout', () => backButton.setFillStyle(0x333333));
    backButton.on('pointerdown', () => {
      networkManager.disconnect();
      this.showMultiplayerMenu();
    });

    // Keyboard
    this.input.keyboard?.removeAllListeners();
    this.input.keyboard?.on('keydown-ESC', () => {
      networkManager.disconnect();
      this.showMultiplayerMenu();
    });
    this.input.keyboard?.on('keydown-ENTER', () => this.attemptJoin());
  }

  private async attemptJoin() {
    if (!this.roomCode || this.isConnecting) return;

    this.isConnecting = true;
    this.statusText.setText('Connecting...');
    this.statusText.setColor('#ffff4a');

    try {
      await networkManager.joinSession(this.roomCode, this.hikerName, this.trailName);
      this.statusText.setText('Connected! Starting hike...');
      this.statusText.setColor('#4aff4a');

      // Start game after short delay
      this.time.delayedCall(1000, () => {
        this.startGame(true);
      });

    } catch (err: any) {
      this.statusText.setText(`Error: ${err.message}`);
      this.statusText.setColor('#ff4a4a');
      this.isConnecting = false;
    }
  }

  selectBuild(index: number) {
    // Update old selection
    if (this.buildTexts[this.selectedBuild]) {
      this.buildTexts[this.selectedBuild].setColor('#888888');
    }

    // Update new selection
    this.selectedBuild = index;
    if (this.buildTexts[index]) {
      this.buildTexts[index].setColor('#ffffff');
    }

    // Update description
    const build = BUILDS[index];
    if (this.descriptionText) {
      this.descriptionText.setText(build.description);
    }
    if (this.statsText) {
      this.statsText.setText(build.stats);
    }
  }

  continueGame() {
    // Start game with save loading flag
    this.scene.start('GameScene', {
      hikerName: this.saveInfo.hikerName || 'Hiker',
      build: 'loaded',
      loadSave: true,
      multiplayer: false
    });
    this.scene.start('UIScene');
  }

  async deleteSave() {
    if (confirm('Delete your save? This cannot be undone!\n\nYour hiker will be gone forever.')) {
      await gameStorage.deleteSave('autosave');
      this.hasSave = false;
      this.saveInfo = {};
      // Refresh the menu
      this.showMainMenu();
    }
  }

  startGame(multiplayer: boolean) {
    const build = BUILDS[this.selectedBuild];

    // Pass data to game scene
    this.scene.start('GameScene', {
      hikerName: this.hikerName,
      trailName: this.trailName,
      build: build.id,
      loadSave: false,
      multiplayer: multiplayer,
      isHost: networkManager.isHost
    });
    this.scene.start('UIScene');
  }

  /**
   * Start the game in Global Trail (MMO) mode
   * - Uses UTC-based global time (no speed controls)
   * - Deterministic weather per zone
   * - Zone-based P2P clustering
   * - Real hiker ghosts (GPS data)
   */
  startGlobalTrail() {
    const build = BUILDS[this.selectedBuild];

    // Start game in MMO mode
    this.scene.start('GameScene', {
      hikerName: this.hikerName,
      trailName: this.trailName,
      build: build.id,
      loadSave: false,
      multiplayer: true,
      mmoMode: true,   // Key flag: enables global time, disables speed controls
      isHost: false    // In MMO, everyone is a peer (no single host)
    });
    this.scene.start('UIScene');
  }
}
