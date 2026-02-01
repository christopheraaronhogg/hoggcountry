import Phaser from 'phaser';
import { networkManager, MessageType } from '../network/NetworkManager';

// We'll reuse the inventory interfaces since items are the same
interface GearItem {
  id: string;
  name: string;
  weight: number;
  condition: number;
  category: string;
}

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  weight: number;
  servings: number;
}

interface BoxItem {
  id: string;
  name: string;
  type: 'food' | 'gear';
  value: number; // calories or condition
  weight: number;
  quantity: number;
  leftBy: string;
  timestamp: number;
}

interface HikerBoxData {
  boxId: string;
  locationName: string;
  items: BoxItem[];
}

export class HikerBoxScene extends Phaser.Scene {
  private boxData: HikerBoxData | null = null;
  private playerInventory: any = null; // Reference to player inventory
  private scrollY: number = 0;
  private maxScroll: number = 0;
  private contentContainer!: Phaser.GameObjects.Container;
  private activeTab: 'box' | 'inventory' = 'box';
  private tabs: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: 'HikerBoxScene' });
  }

  init(data: { boxData: HikerBoxData, playerInventory: any }) {
    this.boxData = data.boxData;
    this.playerInventory = data.playerInventory;
    this.scrollY = 0;
    this.activeTab = 'box';
  }

  create() {
    const { width, height } = this.cameras.main;

    // Semi-transparent background overlay
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.85);
    overlay.setOrigin(0, 0);
    overlay.setInteractive();

    // Panel background
    const panelWidth = Math.min(width - 40, 500);
    const panelHeight = height - 80;
    const panelX = (width - panelWidth) / 2;
    const panelY = 40;

    const panel = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x1a1a1a);
    panel.setOrigin(0, 0);
    panel.setStrokeStyle(2, 0x4a7d5a);

    // Title
    const titleText = this.boxData ? `HIKER BOX: ${this.boxData.locationName}` : 'HIKER BOX';
    this.add.text(width / 2, panelY + 15, titleText, {
      font: '20px Courier',
      color: '#4a7d5a'
    }).setOrigin(0.5, 0);

    // Close button
    const closeBtn = this.add.text(panelX + panelWidth - 15, panelY + 10, 'X', {
      font: '20px Courier',
      color: '#ff6666'
    }).setOrigin(0.5, 0).setInteractive();

    closeBtn.on('pointerover', () => closeBtn.setColor('#ff9999'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#ff6666'));
    closeBtn.on('pointerdown', () => this.closeBox());

    // Tabs
    this.createTabs(panelX, panelY + 50, panelWidth);

    // Create scrollable content container
    this.contentContainer = this.add.container(panelX + 15, panelY + 100);

    // Mask for scrolling
    const maskGraphics = this.add.graphics();
    maskGraphics.fillStyle(0xffffff);
    maskGraphics.fillRect(panelX, panelY + 95, panelWidth, panelHeight - 110);
    const mask = maskGraphics.createGeometryMask();
    this.contentContainer.setMask(mask);

    // Render initial content
    this.renderContent(panelWidth - 30);

    // Enable scrolling
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any[], deltaX: number, deltaY: number) => {
      this.scrollY = Phaser.Math.Clamp(this.scrollY + deltaY * 0.5, 0, this.maxScroll);
      this.contentContainer.y = panelY + 100 - this.scrollY;
    });

    // Touch drag scrolling
    let lastY = 0;
    let isDragging = false;

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      lastY = pointer.y;
      isDragging = true;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (isDragging) {
        const deltaY = lastY - pointer.y;
        this.scrollY = Phaser.Math.Clamp(this.scrollY + deltaY, 0, this.maxScroll);
        this.contentContainer.y = panelY + 100 - this.scrollY;
        lastY = pointer.y;
      }
    });

    this.input.on('pointerup', () => {
      isDragging = false;
    });

    // Keyboard close
    this.input.keyboard?.on('keydown-ESC', () => this.closeBox());
  }

  createTabs(x: number, y: number, width: number) {
    const tabWidth = width / 2;
    
    // Box Tab
    const boxTab = this.add.container(x + tabWidth / 2, y);
    const boxBg = this.add.rectangle(0, 0, tabWidth - 4, 35, this.activeTab === 'box' ? 0x4a7d5a : 0x333333);
    const boxText = this.add.text(0, 0, 'IN THE BOX', {
      font: '16px Courier',
      color: this.activeTab === 'box' ? '#ffffff' : '#888888'
    }).setOrigin(0.5);
    boxTab.add([boxBg, boxText]);
    boxBg.setInteractive();
    boxBg.on('pointerdown', () => this.switchTab('box'));
    this.tabs.push(boxTab);

    // Inventory Tab
    const invTab = this.add.container(x + tabWidth * 1.5, y);
    const invBg = this.add.rectangle(0, 0, tabWidth - 4, 35, this.activeTab === 'inventory' ? 0x4a7d5a : 0x333333);
    const invText = this.add.text(0, 0, 'MY PACK', {
      font: '16px Courier',
      color: this.activeTab === 'inventory' ? '#ffffff' : '#888888'
    }).setOrigin(0.5);
    invTab.add([invBg, invText]);
    invBg.setInteractive();
    invBg.on('pointerdown', () => this.switchTab('inventory'));
    this.tabs.push(invTab);
  }

  switchTab(tab: 'box' | 'inventory') {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    this.scrollY = 0;
    
    // Redraw scene to update tabs and content
    this.scene.restart({ boxData: this.boxData, playerInventory: this.playerInventory });
  }

  renderContent(contentWidth: number) {
    this.contentContainer.removeAll(true);
    let yOffset = 0;
    const lineHeight = 40;

    if (this.activeTab === 'box') {
      if (!this.boxData || this.boxData.items.length === 0) {
        this.add.text(contentWidth / 2, 50, 'The box is empty.', {
          font: '16px Courier',
          color: '#888888'
        }).setOrigin(0.5);
        return;
      }

      this.boxData.items.forEach(item => {
        const container = this.add.container(0, yOffset);
        
        // Background
        const bg = this.add.rectangle(contentWidth / 2, lineHeight / 2, contentWidth, lineHeight - 4, 0x222222);
        container.add(bg);

        // Item Name & Quantity
        const nameText = this.add.text(10, 8, `${item.name} ${item.quantity > 1 ? `x${item.quantity}` : ''}`, {
          font: '14px Courier',
          color: '#ffffff'
        });
        
        // Item Details
        const details = item.type === 'food' 
          ? `${item.value} cal` 
          : `${item.value}% cond`;
        
        const subText = this.add.text(10, 24, `${item.type.toUpperCase()} | ${details} | ${item.weight}lb | Left by: ${item.leftBy}`, {
          font: '10px Courier',
          color: '#888888'
        });

        // Take Button
        const takeBtn = this.add.rectangle(contentWidth - 40, lineHeight / 2, 60, 24, 0x4a7d5a);
        const takeLabel = this.add.text(contentWidth - 40, lineHeight / 2, 'TAKE', {
          font: '12px Courier',
          color: '#ffffff'
        }).setOrigin(0.5);
        
        takeBtn.setInteractive();
        takeBtn.on('pointerdown', () => this.takeItem(item));
        takeBtn.on('pointerover', () => takeBtn.setFillStyle(0x5a9d6a));
        takeBtn.on('pointerout', () => takeBtn.setFillStyle(0x4a7d5a));

        container.add([nameText, subText, takeBtn, takeLabel]);
        this.contentContainer.add(container);
        yOffset += lineHeight + 5;
      });

    } else {
      // Inventory View (for leaving items)
      if (!this.playerInventory) return;

      const allItems: any[] = [
        ...this.playerInventory.food.map((f: any) => ({ ...f, type: 'food' })),
        ...this.playerInventory.gear.map((g: any) => ({ ...g, type: 'gear' }))
      ];

      if (allItems.length === 0) {
        this.add.text(contentWidth / 2, 50, 'Your pack is empty.', {
          font: '16px Courier',
          color: '#888888'
        }).setOrigin(0.5);
        return;
      }

      this.add.text(10, -20, 'Select an item to leave in the box:', {
        font: '12px Courier',
        color: '#aaaaaa'
      });

      allItems.forEach(item => {
        const container = this.add.container(0, yOffset);
        
        // Background
        const bg = this.add.rectangle(contentWidth / 2, lineHeight / 2, contentWidth, lineHeight - 4, 0x222222);
        container.add(bg);

        // Item Name
        const nameText = this.add.text(10, 8, `${item.name} ${item.servings ? `x${item.servings}` : ''}`, {
          font: '14px Courier',
          color: '#cccccc'
        });

        // Leave Button
        const leaveBtn = this.add.rectangle(contentWidth - 40, lineHeight / 2, 60, 24, 0xaa6644);
        const leaveLabel = this.add.text(contentWidth - 40, lineHeight / 2, 'LEAVE', {
          font: '12px Courier',
          color: '#ffffff'
        }).setOrigin(0.5);
        
        leaveBtn.setInteractive();
        leaveBtn.on('pointerdown', () => this.leaveItem(item));
        leaveBtn.on('pointerover', () => leaveBtn.setFillStyle(0xcc7755));
        leaveBtn.on('pointerout', () => leaveBtn.setFillStyle(0xaa6644));

        container.add([nameText, leaveBtn, leaveLabel]);
        this.contentContainer.add(container);
        yOffset += lineHeight + 5;
      });
    }

    this.maxScroll = Math.max(0, yOffset - (this.cameras.main.height - 150));
  }

  takeItem(item: BoxItem) {
    if (!this.boxData) return;

    // Remove from local box data (optimistic update)
    const index = this.boxData.items.indexOf(item);
    if (index > -1) {
      this.boxData.items.splice(index, 1);
    }

    // Add to player inventory
    if (item.type === 'food') {
      this.playerInventory.food.push({
        id: item.id,
        name: item.name,
        calories: item.value,
        weight: item.weight,
        servings: item.quantity
      });
    } else {
      this.playerInventory.gear.push({
        id: item.id,
        name: item.name,
        weight: item.weight,
        condition: item.value,
        category: 'misc' // Default category
      });
    }

    // Send to server (placeholder - we need to implement the actual call)
    // networkManager.sendHikerBoxTake(this.boxData.boxId, item.id);
    
    // Refresh view
    this.renderContent(this.cameras.main.width - 40 - 30);
  }

  leaveItem(item: any) {
    if (!this.boxData) return;

    // Remove from player inventory
    if (item.type === 'food') {
      const idx = this.playerInventory.food.indexOf(item);
      if (idx > -1) this.playerInventory.food.splice(idx, 1);
    } else {
      const idx = this.playerInventory.gear.indexOf(item);
      if (idx > -1) this.playerInventory.gear.splice(idx, 1);
    }

    // Add to box (optimistic)
    const boxItem: BoxItem = {
      id: item.id,
      name: item.name,
      type: item.type,
      value: item.type === 'food' ? item.calories : item.condition,
      weight: item.weight,
      quantity: item.servings || 1,
      leftBy: 'You',
      timestamp: Date.now()
    };
    this.boxData.items.push(boxItem);

    // Send to server
    networkManager.updateHikerBox(this.boxData.boxId, this.boxData.items);

    // Refresh view
    this.renderContent(this.cameras.main.width - 40 - 30);
  }

  closeBox() {
    this.scene.stop('HikerBoxScene');
    this.scene.resume('GameScene');
    this.scene.resume('UIScene');
  }
}