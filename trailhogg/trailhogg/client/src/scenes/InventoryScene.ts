import Phaser from 'phaser';

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

interface InventoryData {
  water: number;
  waterCapacity: number;
  money: number;
  gear: GearItem[];
  food: FoodItem[];
}

export class InventoryScene extends Phaser.Scene {
  private inventoryData: InventoryData | null = null;
  private scrollY: number = 0;
  private maxScroll: number = 0;
  private contentContainer!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'InventoryScene' });
  }

  init(data: { inventory: InventoryData }) {
    this.inventoryData = data.inventory;
    this.scrollY = 0;
  }

  create() {
    const { width, height } = this.cameras.main;

    // Semi-transparent background overlay
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.85);
    overlay.setOrigin(0, 0);
    overlay.setInteractive();

    // Panel background
    const panelWidth = Math.min(width - 40, 400);
    const panelHeight = height - 80;
    const panelX = (width - panelWidth) / 2;
    const panelY = 40;

    const panel = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x1a1a1a);
    panel.setOrigin(0, 0);
    panel.setStrokeStyle(2, 0x4a7d5a);

    // Title
    this.add.text(width / 2, panelY + 15, 'INVENTORY', {
      font: '24px Courier',
      color: '#4a7d5a'
    }).setOrigin(0.5, 0);

    // Close button
    const closeBtn = this.add.text(panelX + panelWidth - 15, panelY + 10, 'X', {
      font: '20px Courier',
      color: '#ff6666'
    }).setOrigin(0.5, 0).setInteractive();

    closeBtn.on('pointerover', () => closeBtn.setColor('#ff9999'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#ff6666'));
    closeBtn.on('pointerdown', () => this.closeInventory());

    // Create scrollable content container
    this.contentContainer = this.add.container(panelX + 15, panelY + 50);

    // Mask for scrolling
    const maskGraphics = this.add.graphics();
    maskGraphics.fillStyle(0xffffff);
    maskGraphics.fillRect(panelX, panelY + 45, panelWidth, panelHeight - 60);
    const mask = maskGraphics.createGeometryMask();
    this.contentContainer.setMask(mask);

    // Build inventory content
    this.buildContent(panelWidth - 30);

    // Enable scrolling
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any[], deltaX: number, deltaY: number) => {
      this.scrollY = Phaser.Math.Clamp(this.scrollY + deltaY * 0.5, 0, this.maxScroll);
      this.contentContainer.y = panelY + 50 - this.scrollY;
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
        this.contentContainer.y = panelY + 50 - this.scrollY;
        lastY = pointer.y;
      }
    });

    this.input.on('pointerup', () => {
      isDragging = false;
    });

    // Keyboard close
    this.input.keyboard?.on('keydown-I', () => this.closeInventory());
    this.input.keyboard?.on('keydown-ESC', () => this.closeInventory());
  }

  buildContent(contentWidth: number) {
    if (!this.inventoryData) return;

    let yOffset = 0;
    const lineHeight = 24;
    const sectionGap = 20;

    // === MONEY ===
    const moneyText = this.add.text(0, yOffset, `MONEY: $${this.inventoryData.money}`, {
      font: '16px Courier',
      color: '#66ff66'
    });
    this.contentContainer.add(moneyText);
    yOffset += lineHeight + sectionGap;

    // === WATER ===
    const waterHeader = this.add.text(0, yOffset, 'WATER', {
      font: '14px Courier',
      color: '#4a7d5a'
    });
    this.contentContainer.add(waterHeader);
    yOffset += lineHeight;

    // Water bar
    const waterPercent = this.inventoryData.water / this.inventoryData.waterCapacity;
    const barWidth = contentWidth - 80;

    const waterBarBg = this.add.rectangle(0, yOffset + 6, barWidth, 14, 0x333333);
    waterBarBg.setOrigin(0, 0);
    this.contentContainer.add(waterBarBg);

    const waterBarFill = this.add.rectangle(0, yOffset + 6, barWidth * waterPercent, 14, 0x6699ff);
    waterBarFill.setOrigin(0, 0);
    this.contentContainer.add(waterBarFill);

    const waterText = this.add.text(barWidth + 10, yOffset + 4,
      `${this.inventoryData.water.toFixed(1)} / ${this.inventoryData.waterCapacity.toFixed(1)} L`, {
      font: '12px Courier',
      color: '#aaaaaa'
    });
    this.contentContainer.add(waterText);
    yOffset += lineHeight + sectionGap;

    // === GEAR ===
    const gearHeader = this.add.text(0, yOffset, 'GEAR', {
      font: '14px Courier',
      color: '#4a7d5a'
    });
    this.contentContainer.add(gearHeader);
    yOffset += lineHeight;

    let totalWeight = 0;

    for (const item of this.inventoryData.gear) {
      totalWeight += item.weight;

      // Item name and condition
      const conditionColor = item.condition >= 80 ? '#66ff66' :
                            item.condition >= 50 ? '#ffff66' : '#ff6666';

      const itemText = this.add.text(10, yOffset, item.name, {
        font: '13px Courier',
        color: '#cccccc'
      });
      this.contentContainer.add(itemText);

      const condText = this.add.text(contentWidth - 60, yOffset, `${item.condition}%`, {
        font: '13px Courier',
        color: conditionColor
      });
      condText.setOrigin(1, 0);
      this.contentContainer.add(condText);

      const weightText = this.add.text(contentWidth, yOffset, `${item.weight.toFixed(1)} lb`, {
        font: '11px Courier',
        color: '#888888'
      });
      weightText.setOrigin(1, 0);
      this.contentContainer.add(weightText);

      yOffset += lineHeight - 4;
    }

    // Gear weight total
    const gearWeightText = this.add.text(contentWidth, yOffset + 5,
      `Gear: ${totalWeight.toFixed(1)} lb`, {
      font: '12px Courier',
      color: '#4a7d5a'
    });
    gearWeightText.setOrigin(1, 0);
    this.contentContainer.add(gearWeightText);
    yOffset += lineHeight + sectionGap;

    // === FOOD ===
    const foodHeader = this.add.text(0, yOffset, 'FOOD', {
      font: '14px Courier',
      color: '#4a7d5a'
    });
    this.contentContainer.add(foodHeader);
    yOffset += lineHeight;

    let totalCalories = 0;
    let totalFoodWeight = 0;

    for (const item of this.inventoryData.food) {
      const itemCalories = item.calories * item.servings;
      const itemWeight = item.weight * item.servings;
      totalCalories += itemCalories;
      totalFoodWeight += itemWeight;

      const itemText = this.add.text(10, yOffset, `${item.name} x${item.servings}`, {
        font: '13px Courier',
        color: '#cccccc'
      });
      this.contentContainer.add(itemText);

      const calText = this.add.text(contentWidth - 60, yOffset, `${itemCalories} cal`, {
        font: '12px Courier',
        color: '#ffaa66'
      });
      calText.setOrigin(1, 0);
      this.contentContainer.add(calText);

      const weightText = this.add.text(contentWidth, yOffset, `${itemWeight.toFixed(1)} lb`, {
        font: '11px Courier',
        color: '#888888'
      });
      weightText.setOrigin(1, 0);
      this.contentContainer.add(weightText);

      yOffset += lineHeight - 4;
    }

    // Food totals
    const foodTotalText = this.add.text(contentWidth, yOffset + 5,
      `Food: ${totalCalories} cal / ${totalFoodWeight.toFixed(1)} lb`, {
      font: '12px Courier',
      color: '#4a7d5a'
    });
    foodTotalText.setOrigin(1, 0);
    this.contentContainer.add(foodTotalText);
    yOffset += lineHeight + sectionGap;

    // === TOTAL PACK WEIGHT ===
    const totalPackWeight = totalWeight + totalFoodWeight + (this.inventoryData.water * 2.2); // Water ~2.2 lb per liter
    const packWeightText = this.add.text(0, yOffset, `PACK WEIGHT: ${totalPackWeight.toFixed(1)} lb`, {
      font: '16px Courier',
      color: '#ffffff'
    });
    this.contentContainer.add(packWeightText);
    yOffset += lineHeight * 2;

    // Calculate max scroll
    const visibleHeight = this.cameras.main.height - 140;
    this.maxScroll = Math.max(0, yOffset - visibleHeight);
  }

  closeInventory() {
    this.scene.stop('InventoryScene');
    this.scene.resume('GameScene');
    this.scene.resume('UIScene');
  }
}
