// ============================================
// TRAIL LEGS - Character Creation Scene
// ============================================

import Phaser from 'phaser';
import { network } from '../network/NetworkManager';
import { CharacterBuild, CharacterTrait, BUILD_STATS } from '@trail-legs/shared';

const BUILD_INFO: Record<CharacterBuild, { name: string; desc: string }> = {
  weekend_warrior: { 
    name: 'Weekend Warrior', 
    desc: 'Decent fitness, good budget, but lacks experience' 
  },
  scout_leader: { 
    name: 'Scout Leader', 
    desc: 'Strong camp skills and first aid, modest fitness' 
  },
  ultra_runner: { 
    name: 'Ultra Runner', 
    desc: 'Exceptional fitness, bad at pacing, minimal gear knowledge' 
  },
  gear_head: { 
    name: 'Gear Head', 
    desc: 'Great equipment knowledge, poor fitness, overthinks' 
  },
  broke_college_kid: { 
    name: 'Broke College Kid', 
    desc: 'High motivation, learns fast, no money' 
  },
  retiree: { 
    name: 'Retiree', 
    desc: 'Unlimited time, great mental game, moderate fitness' 
  }
};

export class CharacterCreateScene extends Phaser.Scene {
  private nameInput: string = '';
  private selectedBuild: CharacterBuild = 'weekend_warrior';
  private selectedTraits: CharacterTrait[] = [];
  private buildButtons: Map<CharacterBuild, Phaser.GameObjects.Container> = new Map();
  private buildDescription!: Phaser.GameObjects.Text;
  private nameText!: Phaser.GameObjects.Text;
  
  constructor() {
    super({ key: 'CharacterCreateScene' });
  }
  
  create() {
    const { width, height } = this.cameras.main;
    
    // Title
    this.add.text(width / 2, 30, 'CREATE YOUR HIKER', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Name section
    this.add.text(width / 2, 70, 'Trail Name:', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#8fbc8f'
    }).setOrigin(0.5);
    
    // Name display/input area
    const nameBox = this.add.graphics();
    nameBox.fillStyle(0x2a3a2a);
    nameBox.fillRoundedRect(width / 2 - 100, 85, 200, 30, 4);
    nameBox.lineStyle(1, 0x4a7d5a);
    nameBox.strokeRoundedRect(width / 2 - 100, 85, 200, 30, 4);
    
    this.nameText = this.add.text(width / 2, 100, 'Click to enter name', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#666'
    }).setOrigin(0.5);
    
    // Make name area clickable
    const nameHitArea = this.add.rectangle(width / 2, 100, 200, 30, 0x000000, 0);
    nameHitArea.setInteractive({ useHandCursor: true });
    nameHitArea.on('pointerdown', () => this.promptForName());
    
    // Build selection
    this.add.text(width / 2, 140, 'Choose Your Background:', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#8fbc8f'
    }).setOrigin(0.5);
    
    // Create build buttons in a grid
    const builds = Object.keys(BUILD_INFO) as CharacterBuild[];
    const startY = 170;
    const buttonHeight = 35;
    const gap = 5;
    
    builds.forEach((build, index) => {
      const y = startY + index * (buttonHeight + gap);
      const button = this.createBuildButton(width / 2, y, build, BUILD_INFO[build].name);
      this.buildButtons.set(build, button);
    });
    
    // Build description
    this.buildDescription = this.add.text(width / 2, 420, BUILD_INFO[this.selectedBuild].desc, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#aaa',
      wordWrap: { width: 280 },
      align: 'center'
    }).setOrigin(0.5);
    
    // Stats preview
    this.add.text(width / 2, 460, 'Starting Stats:', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#8fbc8f'
    }).setOrigin(0.5);
    
    this.updateStatsPreview();
    
    // Start button
    this.createStartButton(width / 2, height - 50);
    
    // Select default build
    this.selectBuild('weekend_warrior');
    
    // Generate a random trail name to start
    this.generateRandomName();
  }
  
  private createBuildButton(x: number, y: number, build: CharacterBuild, label: string): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    
    const bg = this.add.graphics();
    bg.fillStyle(0x2a3a2a);
    bg.fillRoundedRect(-140, -15, 280, 30, 4);
    bg.lineStyle(1, 0x3a4a3a);
    bg.strokeRoundedRect(-140, -15, 280, 30, 4);
    
    const text = this.add.text(0, 0, label, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#aaa'
    }).setOrigin(0.5);
    
    container.add([bg, text]);
    container.setSize(280, 30);
    container.setInteractive({ useHandCursor: true });
    
    container.on('pointerdown', () => this.selectBuild(build));
    
    container.setData('bg', bg);
    container.setData('text', text);
    
    return container;
  }
  
  private selectBuild(build: CharacterBuild) {
    this.selectedBuild = build;
    
    // Update all buttons
    this.buildButtons.forEach((container, buttonBuild) => {
      const bg = container.getData('bg') as Phaser.GameObjects.Graphics;
      const text = container.getData('text') as Phaser.GameObjects.Text;
      
      bg.clear();
      
      if (buttonBuild === build) {
        bg.fillStyle(0x4a7d5a);
        bg.fillRoundedRect(-140, -15, 280, 30, 4);
        bg.lineStyle(2, 0x6b9b6b);
        bg.strokeRoundedRect(-140, -15, 280, 30, 4);
        text.setColor('#ffffff');
      } else {
        bg.fillStyle(0x2a3a2a);
        bg.fillRoundedRect(-140, -15, 280, 30, 4);
        bg.lineStyle(1, 0x3a4a3a);
        bg.strokeRoundedRect(-140, -15, 280, 30, 4);
        text.setColor('#aaa');
      }
    });
    
    // Update description
    this.buildDescription.setText(BUILD_INFO[build].desc);
    
    // Update stats preview
    this.updateStatsPreview();
  }
  
  private updateStatsPreview() {
    const { width } = this.cameras.main;
    const stats = BUILD_STATS[this.selectedBuild];
    
    // Clear existing stats text
    this.children.list
      .filter(child => child.getData('isStatText'))
      .forEach(child => child.destroy());
    
    // Show key stats
    const statsY = 480;
    const statsList = [
      `💪 Fitness: ${stats.fitness}`,
      `💰 Budget: $${stats.money}`,
      `🎒 Pack: ${stats.packWeight} lbs`
    ];
    
    statsList.forEach((stat, i) => {
      const text = this.add.text(width / 2, statsY + i * 18, stat, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#888'
      }).setOrigin(0.5);
      text.setData('isStatText', true);
    });
  }
  
  private createStartButton(x: number, y: number) {
    const container = this.add.container(x, y);
    
    const bg = this.add.graphics();
    bg.fillStyle(0x4a7d5a);
    bg.fillRoundedRect(-80, -20, 160, 40, 8);
    bg.lineStyle(2, 0x6b9b6b);
    bg.strokeRoundedRect(-80, -20, 160, 40, 8);
    
    const text = this.add.text(0, 0, 'HIT THE TRAIL', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    container.add([bg, text]);
    container.setSize(160, 40);
    container.setInteractive({ useHandCursor: true });
    
    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x5a8d6a);
      bg.fillRoundedRect(-80, -20, 160, 40, 8);
      bg.lineStyle(2, 0x7bab7b);
      bg.strokeRoundedRect(-80, -20, 160, 40, 8);
    });
    
    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x4a7d5a);
      bg.fillRoundedRect(-80, -20, 160, 40, 8);
      bg.lineStyle(2, 0x6b9b6b);
      bg.strokeRoundedRect(-80, -20, 160, 40, 8);
    });
    
    container.on('pointerdown', () => this.startGame());
  }
  
  private promptForName() {
    const name = window.prompt('Enter your hiker name:', this.nameInput || 'Hiker');
    if (name && name.trim()) {
      this.nameInput = name.trim();
      this.nameText.setText(this.nameInput);
      this.nameText.setColor('#fff');
    }
  }
  
  private generateRandomName() {
    const firstNames = ['Alex', 'Sam', 'Jordan', 'Casey', 'Riley', 'Morgan', 'Taylor', 'Quinn'];
    const name = firstNames[Math.floor(Math.random() * firstNames.length)];
    this.nameInput = name;
    this.nameText.setText(name);
    this.nameText.setColor('#fff');
  }
  
  private async startGame() {
    if (!this.nameInput) {
      this.generateRandomName();
    }
    
    try {
      // Join the game server
      await network.joinGame(this.nameInput, this.selectedBuild, this.selectedTraits);
      
      // Start the game scene
      this.scene.start('GameScene');
      this.scene.start('UIScene');
    } catch (error) {
      console.error('Failed to join game:', error);
      // Start in offline mode
      this.scene.start('GameScene', { 
        offline: true,
        playerName: this.nameInput,
        build: this.selectedBuild,
        traits: this.selectedTraits
      });
      this.scene.start('UIScene');
    }
  }
}
