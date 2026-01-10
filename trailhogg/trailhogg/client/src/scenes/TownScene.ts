import Phaser from 'phaser';

interface TownData {
  name: string;
  mile: number;
  hasStore: boolean;
  hasHostel: boolean;
  hasRestaurant: boolean;
  hasOutfitter: boolean;
  storeInventory: StoreItem[];
  hostelPrice: number;
  description: string;
}

interface StoreItem {
  id: string;
  name: string;
  price: number;
  type: 'food' | 'gear' | 'water';
  calories?: number;
  weight: number;
  servings?: number;
}

// Town data for the first 30 miles
const TOWNS: TownData[] = [
  {
    name: 'Neels Gap',
    mile: 30.7,
    hasStore: true,
    hasHostel: true,
    hasRestaurant: false,
    hasOutfitter: true,
    hostelPrice: 45,
    description: 'Mountain Crossings - the AT goes through the building!',
    storeInventory: [
      { id: 'ramen', name: 'Ramen Noodles', price: 1, type: 'food', calories: 400, weight: 0.1, servings: 1 },
      { id: 'oatmeal', name: 'Instant Oatmeal (3pk)', price: 4, type: 'food', calories: 300, weight: 0.3, servings: 3 },
      { id: 'trailMix', name: 'Trail Mix', price: 6, type: 'food', calories: 600, weight: 0.3, servings: 2 },
      { id: 'snickers', name: 'Snickers Bar', price: 2, type: 'food', calories: 250, weight: 0.1, servings: 1 },
      { id: 'tuna', name: 'Tuna Packet', price: 3, type: 'food', calories: 200, weight: 0.15, servings: 1 },
      { id: 'peanutButter', name: 'Peanut Butter', price: 5, type: 'food', calories: 800, weight: 0.4, servings: 4 },
      { id: 'tortillas', name: 'Tortillas (6pk)', price: 4, type: 'food', calories: 150, weight: 0.3, servings: 6 },
      { id: 'pepperoni', name: 'Pepperoni', price: 5, type: 'food', calories: 500, weight: 0.2, servings: 3 },
      { id: 'gatorade', name: 'Gatorade Powder', price: 4, type: 'food', calories: 100, weight: 0.2, servings: 4 },
      { id: 'cliff', name: 'Clif Bar', price: 3, type: 'food', calories: 250, weight: 0.1, servings: 1 },
    ]
  }
];

export class TownScene extends Phaser.Scene {
  private townData!: TownData;
  private hikerData: any;
  private selectedCategory: string = 'main';
  private menuItems: Phaser.GameObjects.Container[] = [];
  private cartItems: StoreItem[] = [];
  private cartTotal: number = 0;
  private isMobile: boolean = false;

  constructor() {
    super({ key: 'TownScene' });
  }

  init(data: { town: TownData; hiker: any }) {
    this.townData = data.town;
    this.hikerData = data.hiker;
    this.cartItems = [];
    this.cartTotal = 0;
  }

  create() {
    const { width, height } = this.cameras.main;

    this.isMobile = this.sys.game.device.os.android || this.sys.game.device.os.iOS ||
                    ('ontouchstart' in window) || width < 768;

    // Semi-transparent background
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);

    // Town header
    this.add.text(width / 2, 30, `🏘️ ${this.townData.name}`, {
      font: 'bold 24px Courier',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(width / 2, 55, this.townData.description, {
      font: 'italic 12px Courier',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    // Money display
    this.add.text(width - 20, 30, `💵 $${this.hikerData?.inventory?.money || 0}`, {
      font: '16px Courier',
      color: '#4aff4a'
    }).setOrigin(1, 0.5);

    // Show main menu
    this.showMainMenu();
  }

  showMainMenu() {
    this.clearMenu();
    this.selectedCategory = 'main';

    const { width, height } = this.cameras.main;
    const startY = 120;
    const spacing = 70;

    const options = [
      { id: 'store', label: '🏪 General Store', available: this.townData.hasStore },
      { id: 'hostel', label: '🛏️ Hostel', available: this.townData.hasHostel, price: this.townData.hostelPrice },
      { id: 'restaurant', label: '🍔 Restaurant', available: this.townData.hasRestaurant },
      { id: 'outfitter', label: '🎒 Outfitter', available: this.townData.hasOutfitter },
      { id: 'leave', label: '🥾 Hit the Trail', available: true },
    ];

    options.forEach((option, index) => {
      const y = startY + index * spacing;
      const container = this.createMenuButton(
        width / 2, y,
        option.label,
        option.available,
        option.price ? `$${option.price}/night` : undefined
      );

      if (option.available) {
        container.setInteractive(
          new Phaser.Geom.Rectangle(-150, -25, 300, 50),
          Phaser.Geom.Rectangle.Contains
        );
        container.on('pointerdown', () => this.selectOption(option.id));
        container.on('pointerover', () => {
          const bg = container.getAt(0) as Phaser.GameObjects.Rectangle;
          bg.setFillStyle(0x4a7d5a);
        });
        container.on('pointerout', () => {
          const bg = container.getAt(0) as Phaser.GameObjects.Rectangle;
          bg.setFillStyle(0x2e5339);
        });
      }

      this.menuItems.push(container);
    });

    // Stats display at bottom
    this.showStats();
  }

  createMenuButton(x: number, y: number, label: string, available: boolean, subtext?: string): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 300, 50, available ? 0x2e5339 : 0x333333);
    bg.setStrokeStyle(2, available ? 0x4a7d5a : 0x555555);
    container.add(bg);

    const text = this.add.text(0, subtext ? -8 : 0, label, {
      font: '16px Courier',
      color: available ? '#ffffff' : '#666666'
    }).setOrigin(0.5);
    container.add(text);

    if (subtext) {
      const sub = this.add.text(0, 12, subtext, {
        font: '11px Courier',
        color: '#aaaaaa'
      }).setOrigin(0.5);
      container.add(sub);
    }

    return container;
  }

  selectOption(id: string) {
    switch (id) {
      case 'store':
        this.showStore();
        break;
      case 'hostel':
        this.stayAtHostel();
        break;
      case 'restaurant':
        this.showRestaurant();
        break;
      case 'outfitter':
        this.showOutfitter();
        break;
      case 'leave':
        this.leaveTown();
        break;
    }
  }

  showStore() {
    this.clearMenu();
    this.selectedCategory = 'store';

    const { width, height } = this.cameras.main;

    // Back button
    const backBtn = this.createMenuButton(80, 100, '← Back', true);
    backBtn.setInteractive(new Phaser.Geom.Rectangle(-60, -20, 120, 40), Phaser.Geom.Rectangle.Contains);
    backBtn.on('pointerdown', () => this.showMainMenu());
    this.menuItems.push(backBtn);

    // Store title
    this.add.text(width / 2, 100, '🏪 General Store', {
      font: 'bold 18px Courier',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Cart total
    const cartText = this.add.text(width - 20, 100, `Cart: $${this.cartTotal}`, {
      font: '14px Courier',
      color: '#4aff4a'
    }).setOrigin(1, 0.5);

    // Scrollable item list
    const startY = 140;
    const itemHeight = 45;
    const visibleItems = Math.min(8, this.townData.storeInventory.length);

    this.townData.storeInventory.forEach((item, index) => {
      if (index >= visibleItems) return; // Simplified - no scroll for now

      const y = startY + index * itemHeight;
      const canAfford = (this.hikerData?.inventory?.money || 0) >= item.price;

      const container = this.add.container(width / 2, y);

      // Item background
      const bg = this.add.rectangle(0, 0, width - 40, 40, 0x222222);
      bg.setStrokeStyle(1, 0x444444);
      container.add(bg);

      // Item name
      const name = this.add.text(-width / 2 + 30, -8, item.name, {
        font: '12px Courier',
        color: canAfford ? '#ffffff' : '#666666'
      });
      container.add(name);

      // Item details
      const details = this.add.text(-width / 2 + 30, 8, `${item.calories} cal | ${item.weight}oz`, {
        font: '10px Courier',
        color: '#888888'
      });
      container.add(details);

      // Price
      const price = this.add.text(width / 2 - 100, 0, `$${item.price}`, {
        font: '14px Courier',
        color: canAfford ? '#4aff4a' : '#ff4a4a'
      }).setOrigin(0.5);
      container.add(price);

      // Buy button
      if (canAfford) {
        const buyBtn = this.add.rectangle(width / 2 - 40, 0, 60, 30, 0x2e5339);
        buyBtn.setStrokeStyle(1, 0x4a7d5a);
        container.add(buyBtn);

        const buyText = this.add.text(width / 2 - 40, 0, 'BUY', {
          font: 'bold 11px Courier',
          color: '#ffffff'
        }).setOrigin(0.5);
        container.add(buyText);

        buyBtn.setInteractive();
        buyBtn.on('pointerdown', () => this.buyItem(item));
        buyBtn.on('pointerover', () => buyBtn.setFillStyle(0x4a7d5a));
        buyBtn.on('pointerout', () => buyBtn.setFillStyle(0x2e5339));
      }

      this.menuItems.push(container);
    });

    this.showStats();
  }

  buyItem(item: StoreItem) {
    if (!this.hikerData?.inventory) return;

    const money = this.hikerData.inventory.money || 0;
    if (money < item.price) {
      this.showMessage('Not enough money!', 'error');
      return;
    }

    // Deduct money
    this.hikerData.inventory.money -= item.price;

    // Add food to inventory
    if (item.type === 'food') {
      // Check if we already have this item
      const existing = this.hikerData.inventory.food.find((f: any) => f.id === item.id);
      if (existing) {
        existing.servings += item.servings || 1;
      } else {
        this.hikerData.inventory.food.push({
          id: item.id,
          name: item.name,
          calories: item.calories,
          weight: item.weight,
          servings: item.servings || 1
        });
      }
    }

    this.showMessage(`Bought ${item.name}!`, 'success');

    // Refresh the store display
    this.showStore();
  }

  stayAtHostel() {
    if (!this.hikerData?.inventory) return;

    const money = this.hikerData.inventory.money || 0;
    const price = this.townData.hostelPrice;

    if (money < price) {
      this.showMessage(`Need $${price} for a bunk!`, 'error');
      return;
    }

    // Pay for hostel
    this.hikerData.inventory.money -= price;

    // Full recovery!
    this.hikerData.energy = 100;
    this.hikerData.health = Math.min(100, this.hikerData.health + 20);

    // Reset moodles
    this.hikerData.moodles.fatigue = 0;
    this.hikerData.moodles.hunger = 0;
    this.hikerData.moodles.morale = Math.min(100, this.hikerData.moodles.morale + 30);

    // Shower and laundry boost
    this.showMessage('🚿 Hot shower! 🧺 Clean clothes! Full rest!', 'success');

    // Advance time (overnight)
    // The GameScene will handle this when we return

    // Update display
    this.showMainMenu();
  }

  showRestaurant() {
    this.clearMenu();
    this.selectedCategory = 'restaurant';

    const { width, height } = this.cameras.main;

    // Back button
    const backBtn = this.createMenuButton(80, 100, '← Back', true);
    backBtn.setInteractive(new Phaser.Geom.Rectangle(-60, -20, 120, 40), Phaser.Geom.Rectangle.Contains);
    backBtn.on('pointerdown', () => this.showMainMenu());
    this.menuItems.push(backBtn);

    this.add.text(width / 2, 100, '🍔 Restaurant', {
      font: 'bold 18px Courier',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Restaurant menu
    const meals = [
      { name: 'Burger & Fries', price: 12, calories: 1200 },
      { name: 'All-You-Can-Eat Buffet', price: 18, calories: 2500 },
      { name: 'Pancake Breakfast', price: 10, calories: 1000 },
      { name: 'Pizza (whole)', price: 15, calories: 2000 },
    ];

    meals.forEach((meal, index) => {
      const y = 160 + index * 50;
      const canAfford = (this.hikerData?.inventory?.money || 0) >= meal.price;

      const container = this.add.container(width / 2, y);

      const bg = this.add.rectangle(0, 0, width - 60, 40, canAfford ? 0x2e5339 : 0x333333);
      bg.setStrokeStyle(1, 0x4a7d5a);
      container.add(bg);

      const text = this.add.text(-100, 0, `${meal.name} - $${meal.price}`, {
        font: '14px Courier',
        color: canAfford ? '#ffffff' : '#666666'
      }).setOrigin(0, 0.5);
      container.add(text);

      const cals = this.add.text(100, 0, `+${meal.calories} cal`, {
        font: '12px Courier',
        color: '#4aff4a'
      }).setOrigin(0, 0.5);
      container.add(cals);

      if (canAfford) {
        container.setInteractive(new Phaser.Geom.Rectangle(-150, -20, 300, 40), Phaser.Geom.Rectangle.Contains);
        container.on('pointerdown', () => this.eatMeal(meal));
        container.on('pointerover', () => bg.setFillStyle(0x4a7d5a));
        container.on('pointerout', () => bg.setFillStyle(0x2e5339));
      }

      this.menuItems.push(container);
    });

    this.showStats();
  }

  eatMeal(meal: { name: string; price: number; calories: number }) {
    if (!this.hikerData?.inventory) return;

    this.hikerData.inventory.money -= meal.price;
    this.hikerData.calories = Math.min(3000, this.hikerData.calories + meal.calories);
    this.hikerData.moodles.hunger = 0;
    this.hikerData.moodles.morale = Math.min(100, this.hikerData.moodles.morale + 10);

    this.showMessage(`Ate ${meal.name}! Delicious! (+${meal.calories} cal)`, 'success');
    this.showRestaurant();
  }

  showOutfitter() {
    this.clearMenu();
    this.selectedCategory = 'outfitter';

    const { width, height } = this.cameras.main;

    // Back button
    const backBtn = this.createMenuButton(80, 100, '← Back', true);
    backBtn.setInteractive(new Phaser.Geom.Rectangle(-60, -20, 120, 40), Phaser.Geom.Rectangle.Contains);
    backBtn.on('pointerdown', () => this.showMainMenu());
    this.menuItems.push(backBtn);

    this.add.text(width / 2, 100, '🎒 Outfitter', {
      font: 'bold 18px Courier',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(width / 2, 140, 'Gear shakedown and replacements', {
      font: 'italic 12px Courier',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    // Gear options (simplified for now)
    const gearOptions = [
      { name: 'Replace Worn Shoes', price: 120, effect: 'shoes' },
      { name: 'New Water Filter', price: 40, effect: 'filter' },
      { name: 'Repair Tent', price: 25, effect: 'tent' },
      { name: 'Upgrade Sleeping Bag', price: 200, effect: 'sleepingBag' },
    ];

    gearOptions.forEach((gear, index) => {
      const y = 180 + index * 50;
      const canAfford = (this.hikerData?.inventory?.money || 0) >= gear.price;

      const container = this.add.container(width / 2, y);

      const bg = this.add.rectangle(0, 0, width - 60, 40, canAfford ? 0x2e5339 : 0x333333);
      bg.setStrokeStyle(1, 0x4a7d5a);
      container.add(bg);

      const text = this.add.text(-100, 0, `${gear.name} - $${gear.price}`, {
        font: '14px Courier',
        color: canAfford ? '#ffffff' : '#666666'
      }).setOrigin(0, 0.5);
      container.add(text);

      if (canAfford) {
        container.setInteractive(new Phaser.Geom.Rectangle(-150, -20, 300, 40), Phaser.Geom.Rectangle.Contains);
        container.on('pointerdown', () => this.buyGear(gear));
        container.on('pointerover', () => bg.setFillStyle(0x4a7d5a));
        container.on('pointerout', () => bg.setFillStyle(0x2e5339));
      }

      this.menuItems.push(container);
    });

    this.showStats();
  }

  buyGear(gear: { name: string; price: number; effect: string }) {
    if (!this.hikerData?.inventory) return;

    this.hikerData.inventory.money -= gear.price;

    // Apply gear effect (restore condition or add new item)
    const existingGear = this.hikerData.inventory.gear.find((g: any) =>
      g.id === gear.effect || g.id.includes(gear.effect.toLowerCase())
    );

    if (existingGear) {
      existingGear.condition = 100;
    }

    this.showMessage(`Got ${gear.name}! Ready to hike!`, 'success');
    this.showOutfitter();
  }

  showStats() {
    const { width, height } = this.cameras.main;

    // Stats bar at bottom
    const statsY = height - 60;

    const statsContainer = this.add.container(width / 2, statsY);

    const statsBg = this.add.rectangle(0, 0, width - 20, 50, 0x111111, 0.9);
    statsBg.setStrokeStyle(1, 0x333333);
    statsContainer.add(statsBg);

    // Energy
    const energy = this.hikerData?.energy || 0;
    statsContainer.add(this.add.text(-width / 2 + 30, 0, `⚡ ${Math.round(energy)}%`, {
      font: '12px Courier',
      color: energy > 50 ? '#4aff4a' : (energy > 25 ? '#ffff4a' : '#ff4a4a')
    }).setOrigin(0, 0.5));

    // Calories
    const calories = this.hikerData?.calories || 0;
    statsContainer.add(this.add.text(-width / 2 + 100, 0, `🍎 ${Math.round(calories)}`, {
      font: '12px Courier',
      color: '#ffaa4a'
    }).setOrigin(0, 0.5));

    // Water
    const water = this.hikerData?.inventory?.water || 0;
    statsContainer.add(this.add.text(-width / 2 + 180, 0, `💧 ${water.toFixed(1)}L`, {
      font: '12px Courier',
      color: '#4aaaff'
    }).setOrigin(0, 0.5));

    // Money
    const money = this.hikerData?.inventory?.money || 0;
    statsContainer.add(this.add.text(width / 2 - 30, 0, `💵 $${money}`, {
      font: '12px Courier',
      color: '#4aff4a'
    }).setOrigin(1, 0.5));

    this.menuItems.push(statsContainer);
  }

  showMessage(text: string, type: 'success' | 'error' | 'info') {
    const { width, height } = this.cameras.main;

    const colors: Record<string, string> = {
      success: '#4aff4a',
      error: '#ff4a4a',
      info: '#4aaaff'
    };

    const msg = this.add.text(width / 2, height / 2, text, {
      font: 'bold 16px Courier',
      color: colors[type],
      backgroundColor: '#000000',
      padding: { x: 12, y: 8 }
    }).setOrigin(0.5).setDepth(1000);

    this.tweens.add({
      targets: msg,
      alpha: 0,
      y: height / 2 - 50,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => msg.destroy()
    });
  }

  clearMenu() {
    this.menuItems.forEach(item => item.destroy());
    this.menuItems = [];
  }

  leaveTown() {
    // Return to game with updated hiker data
    this.scene.stop('TownScene');

    // Emit event to GameScene with updated data
    const gameScene = this.scene.get('GameScene');
    gameScene.events.emit('town-exit', {
      hiker: this.hikerData,
      stayedOvernight: false // Could track this
    });
  }
}
