import Phaser from 'phaser';

export class BearEncounterScene extends Phaser.Scene {
  private timeLeft: number = 10; // seconds
  private timerEvent!: Phaser.Time.TimerEvent;
  private timerText!: Phaser.GameObjects.Text;
  private bearSprite!: Phaser.GameObjects.Sprite;
  private actionsContainer!: Phaser.GameObjects.Container;
  private resultText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'BearEncounterScene' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // Semi-transparent red overlay to indicate danger
    this.add.rectangle(width / 2, height / 2, width, height, 0x330000, 0.7);

    // Bear Sprite (using existing bear asset)
    this.bearSprite = this.add.sprite(width / 2, height * 0.3, 'bear');
    this.bearSprite.setScale(3); // Make it big and scary
    
    // Animate the bear slightly to make it feel alive
    this.tweens.add({
      targets: this.bearSprite,
      y: this.bearSprite.y + 10,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Encounter Title
    this.add.text(width / 2, height * 0.1, '🐻 BEAR ENCOUNTER!', {
      font: 'bold 32px Courier',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Timer
    this.timeLeft = 10;
    this.timerText = this.add.text(width / 2, height * 0.18, `Time: ${this.timeLeft}`, {
      font: '24px Courier',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true
    });

    // Actions Container
    this.actionsContainer = this.add.container(0, 0);
    this.createActions(width, height);

    // Result Text (hidden initially)
    this.resultText = this.add.text(width / 2, height * 0.8, '', {
      font: 'bold 20px Courier',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: width - 60 }
    }).setOrigin(0.5).setAlpha(0);
  }

  updateTimer() {
    this.timeLeft--;
    this.timerText.setText(`Time: ${this.timeLeft}`);
    if (this.timeLeft <= 5) {
        this.timerText.setColor('#ff0000');
    }

    if (this.timeLeft <= 0) {
      this.handleTimeout();
    }
  }

  createActions(width: number, height: number) {
    const startY = height * 0.5;
    const spacing = 70;

    const actions = [
      { 
        label: 'YELL & WAVE', 
        desc: 'High success, high energy cost', 
        color: 0xffaa00, 
        callback: () => this.resolveEncounter('yell') 
      },
      { 
        label: 'BACK AWAY SLOWLY', 
        desc: 'Low risk, loses time', 
        color: 0x44aaff, 
        callback: () => this.resolveEncounter('back_away') 
      },
      { 
        label: 'RUN AWAY', 
        desc: 'High injury risk!', 
        color: 0xff4444, 
        callback: () => this.resolveEncounter('run') 
      }
    ];

    actions.forEach((action, index) => {
      const y = startY + index * spacing;
      
      const btn = this.add.rectangle(width / 2, y, 300, 60, action.color);
      btn.setStrokeStyle(2, 0xffffff);
      btn.setInteractive();
      
      const label = this.add.text(width / 2, y - 10, action.label, {
        font: 'bold 20px Courier',
        color: '#000000'
      }).setOrigin(0.5);

      const desc = this.add.text(width / 2, y + 15, action.desc, {
        font: '12px Courier',
        color: '#333333'
      }).setOrigin(0.5);

      btn.on('pointerdown', action.callback);
      btn.on('pointerover', () => btn.setAlpha(0.8));
      btn.on('pointerout', () => btn.setAlpha(1));

      this.actionsContainer.add([btn, label, desc]);
    });
  }

  resolveEncounter(action: 'yell' | 'back_away' | 'run') {
    this.timerEvent.remove();
    this.actionsContainer.setVisible(false);
    this.resultText.setAlpha(1);

    let message = '';
    let success = false;
    let outcomeData = { energy: 0, health: 0, morale: 0, time: 0 };

    switch (action) {
      case 'yell':
        if (Math.random() < 0.9) {
            message = "You shouted and waved your arms! The bear looked annoyed but lumbered away.";
            outcomeData.energy = -15;
            outcomeData.morale = 5; // Adrenaline boost!
            success = true;
        } else {
            message = "The bear wasn't impressed. It bluff charged before leaving! Terrifying!";
            outcomeData.energy = -20;
            outcomeData.morale = -10;
            success = true; // Still survived
        }
        break;
      case 'back_away':
        message = "You slowly backed away, keeping your eyes on the bear. It took a while, but you're safe.";
        outcomeData.time = 30; // Lost 30 mins
        outcomeData.energy = -5;
        success = true;
        break;
      case 'run':
        if (Math.random() < 0.4) {
            message = "You ran like the wind! You escaped, but you're exhausted.";
            outcomeData.energy = -40;
            outcomeData.morale = -5;
            success = true;
        } else {
            message = "Bad idea! You tripped while running and scraped your knee. The bear lost interest, thankfully.";
            outcomeData.energy = -30;
            outcomeData.health = -10;
            outcomeData.morale = -15;
            success = false;
        }
        break;
    }

    this.resultText.setText(message);

    // Apply effects to GameScene
    const gameScene = this.scene.get('GameScene') as any; // Access safely
    if (gameScene && gameScene.hikerData) {
        const hiker = gameScene.hikerData;
        hiker.energy = Math.max(0, hiker.energy + outcomeData.energy);
        hiker.health = Math.max(0, hiker.health + outcomeData.health);
        hiker.moodles.morale = Math.max(0, Math.min(100, hiker.moodles.morale + outcomeData.morale));
        
        // If time lost, advance clock
        if (outcomeData.time > 0 && gameScene.gameState) {
             gameScene.gameState.time.minute += outcomeData.time;
             // Handle hour rollover if needed (simplified)
             if (gameScene.gameState.time.minute >= 60) {
                 gameScene.gameState.time.hour += Math.floor(gameScene.gameState.time.minute / 60);
                 gameScene.gameState.time.minute %= 60;
             }
        }
    }

    this.time.delayedCall(3000, () => {
        this.scene.stop();
        this.scene.resume('GameScene');
    });
  }

  handleTimeout() {
    this.actionsContainer.setVisible(false);
    this.resultText.setAlpha(1);
    this.resultText.setText("You froze in panic! The bear sniffed your pack and wandered off. You lost precious time.");
    
    const gameScene = this.scene.get('GameScene') as any;
    if (gameScene && gameScene.gameState) {
        gameScene.gameState.time.minute += 60; // Lost an hour
        gameScene.hikerData.moodles.morale -= 10;
    }

    this.time.delayedCall(3000, () => {
        this.scene.stop();
        this.scene.resume('GameScene');
    });
  }
}
