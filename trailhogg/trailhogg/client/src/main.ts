import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { InventoryScene } from './scenes/InventoryScene';
import { TownScene } from './scenes/TownScene';
import { GuideScene } from './scenes/GuideScene';
import { HikerBoxScene } from './scenes/HikerBoxScene';
import { BearEncounterScene } from './scenes/BearEncounterScene';
import { RiverCrossingScene } from './scenes/RiverCrossingScene';
import { JournalScene } from './scenes/JournalScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: window.innerWidth,
  height: window.innerHeight,
  pixelArt: true,
  backgroundColor: '#1a1a1a',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: '100%',
    height: '100%',
    min: {
      width: 320,
      height: 480
    },
    max: {
      width: 2560,
      height: 1440
    }
  },
  scene: [BootScene, MenuScene, GameScene, UIScene, InventoryScene, TownScene, GuideScene, HikerBoxScene, BearEncounterScene, RiverCrossingScene, JournalScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  }
};

// Hide loading screen
const loading = document.getElementById('loading');
if (loading) {
  loading.style.display = 'none';
}

// Create game instance
const game = new Phaser.Game(config);

// Export for debugging
(window as any).game = game;
