import Phaser from 'phaser';
import { type Town } from '../data/TrailData';
import { bubbleSystem, type BubbleNPC, type YardSaleItem } from '../systems/BubbleSystem';

interface StoreItem {
  id: string;
  name: string;
  price: number;
  type: 'food' | 'gear' | 'water';
  calories?: number;
  weight: number;
  servings?: number;
}

// Standard store inventory available at towns with stores
const STORE_INVENTORY: StoreItem[] = [
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
];

// Standard hostel price
const HOSTEL_PRICE = 45;

export class TownScene extends Phaser.Scene {
  private townData!: Town;
  private hikerData: any;
  private gameTime: { hour: number; day: number } = { hour: 12, day: 1 };
  private selectedCategory: string = 'main';
  private menuItems: Phaser.GameObjects.Container[] = [];
  private cartItems: StoreItem[] = [];
  private cartTotal: number = 0;
  private isMobile: boolean = false;

  constructor() {
    super({ key: 'TownScene' });
  }

  init(data: { town: Town; hiker: any; gameTime?: { hour: number; day: number } }) {
    this.townData = data.town;
    this.hikerData = data.hiker;
    this.gameTime = data.gameTime || { hour: 12, day: 1 };
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

    // Town description from notes or services
    const description = this.townData.notes || `${this.townData.distance} - ${this.townData.services.join(', ')}`;
    this.add.text(width / 2, 55, description, {
      font: 'italic 12px Courier',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    // Money display
    this.add.text(width - 20, 30, `💵 $${this.hikerData?.inventory?.money || 0}`, {
      font: '16px Courier',
      color: '#4aff4a'
    }).setOrigin(1, 0.5);

    // Handle resize events
    this.scale.on('resize', this.onResize, this);

    // Show main menu
    this.showMainMenu();
  }

  onResize(gameSize: Phaser.Structs.Size) {
    // Update mobile detection
    this.isMobile = this.sys.game.device.os.android || this.sys.game.device.os.iOS ||
                    ('ontouchstart' in window) || gameSize.width < 768;

    // Recreate the scene - simplest approach for modal scene
    this.scene.restart({ town: this.townData, hiker: this.hikerData });
  }

  showMainMenu() {
    this.clearMenu();
    this.selectedCategory = 'main';

    const { width, height } = this.cameras.main;
    const startY = 120;
    const spacing = 70;

    // Check for evening hours (campfire time!)
    const isEvening = this.gameTime.hour >= 18 || this.gameTime.hour < 6;
    const npcsInTown = bubbleSystem.getNPCsInTown(this.townData.name);
    const hasYardSale = bubbleSystem.hasYardSaleItems();

    const options: { id: string; label: string; available: boolean; price?: number; subtext?: string }[] = [
      { id: 'store', label: '🏪 General Store', available: this.townData.hasStore },
      { id: 'hostel', label: '🛏️ Hostel', available: this.townData.hasHostel, price: HOSTEL_PRICE },
      { id: 'restaurant', label: '🍔 Restaurant', available: this.townData.hasRestaurant },
      { id: 'outfitter', label: '🎒 Outfitter', available: this.townData.hasOutfitter },
    ];

    // Add campfire stories if evening and there are NPCs around
    if (isEvening && npcsInTown.length > 0) {
      options.push({ id: 'campfire', label: '🔥 Campfire Stories', available: true, subtext: `${npcsInTown.length} hikers here` });
    }

    // Add yard sale if items available
    if (hasYardSale) {
      const itemCount = bubbleSystem.getYardSaleItems().length;
      options.push({ id: 'yardsale', label: '🏷️ Gear Yard Sale', available: true, subtext: `${itemCount} items` });
    }

    // Add town special if available
    if (this.townData.special) {
      const costText = this.townData.special.cost > 0 ? `$${this.townData.special.cost}` : 'Free';
      options.push({ id: 'special', label: `⭐ ${this.townData.special.label}`, available: true, subtext: costText });
    }

    options.push({ id: 'leave', label: '🥾 Hit the Trail', available: true });

    options.forEach((option, index) => {
      const y = startY + index * spacing;
      const subtextDisplay = option.price ? `$${option.price}/night` : option.subtext;
      const container = this.createMenuButton(
        width / 2, y,
        option.label,
        option.available,
        subtextDisplay
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
      case 'campfire':
        this.showCampfireStories();
        break;
      case 'yardsale':
        this.showYardSale();
        break;
      case 'special':
        this.doTownSpecial();
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
    const visibleItems = Math.min(8, STORE_INVENTORY.length);

    STORE_INVENTORY.forEach((item, index) => {
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
    const price = HOSTEL_PRICE;

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

    this.add.text(width / 2, 140, 'Gear, safety equipment, and services', {
      font: 'italic 12px Courier',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    // Check what the hiker already has
    const hasPLB = this.hikerData?.inventory?.gear?.some((g: any) => g.id === 'plb');
    const hasInsurance = this.hikerData?.inventory?.rescueInsurance || false;

    // Gear options - dynamic based on what player has
    const gearOptions: { name: string; price: number; effect: string; description?: string; owned?: boolean }[] = [
      { name: 'Replace Worn Shoes', price: 120, effect: 'shoes' },
      { name: 'New Water Filter', price: 40, effect: 'filter' },
      { name: 'Repair Tent', price: 25, effect: 'tent' },
      { name: 'Upgrade Sleeping Bag', price: 200, effect: 'sleepingBag' },
    ];

    // Add PLB option if player doesn't have one
    if (!hasPLB) {
      gearOptions.unshift({
        name: '📡 Garmin InReach Mini',
        price: 350,
        effect: 'plb',
        description: 'Satellite SOS beacon - call for rescue anywhere!'
      });
    }

    // Add rescue insurance option
    if (!hasInsurance) {
      gearOptions.unshift({
        name: '🏥 Rescue Insurance',
        price: 50,
        effect: 'insurance',
        description: 'Covers SAR costs - only $100 copay for rescues'
      });
    } else {
      gearOptions.unshift({
        name: '✅ Rescue Insurance',
        price: 0,
        effect: 'insurance',
        description: 'ACTIVE - You\'re covered!',
        owned: true
      });
    }

    gearOptions.forEach((gear, index) => {
      const y = 175 + index * (gear.description ? 55 : 45);
      const canAfford = (this.hikerData?.inventory?.money || 0) >= gear.price || gear.owned;

      const container = this.add.container(width / 2, y);

      // Taller box for items with descriptions
      const boxHeight = gear.description ? 48 : 40;
      const bgColor = gear.owned ? 0x225522 : (canAfford ? 0x2e5339 : 0x333333);
      const bg = this.add.rectangle(0, 0, width - 60, boxHeight, bgColor);
      bg.setStrokeStyle(1, gear.owned ? 0x44aa44 : 0x4a7d5a);
      container.add(bg);

      // Item name and price
      const priceText = gear.owned ? '(OWNED)' : `$${gear.price}`;
      const text = this.add.text(-width / 2 + 50, gear.description ? -10 : 0, `${gear.name} - ${priceText}`, {
        font: '13px Courier',
        color: gear.owned ? '#44ff44' : (canAfford ? '#ffffff' : '#666666')
      }).setOrigin(0, 0.5);
      container.add(text);

      // Description if present
      if (gear.description) {
        const desc = this.add.text(-width / 2 + 50, 10, gear.description, {
          font: '10px Courier',
          color: '#888888'
        }).setOrigin(0, 0.5);
        container.add(desc);
      }

      if (canAfford && !gear.owned) {
        container.setInteractive(new Phaser.Geom.Rectangle(-width / 2 + 30, -boxHeight / 2, width - 60, boxHeight), Phaser.Geom.Rectangle.Contains);
        container.on('pointerdown', () => this.buyGear(gear));
        container.on('pointerover', () => bg.setFillStyle(0x4a7d5a));
        container.on('pointerout', () => bg.setFillStyle(0x2e5339));
      }

      this.menuItems.push(container);
    });

    this.showStats();
  }

  buyGear(gear: { name: string; price: number; effect: string; owned?: boolean }) {
    if (!this.hikerData?.inventory) return;

    // Already owned - do nothing
    if (gear.owned) {
      this.showMessage('You already have this!', 'info');
      return;
    }

    this.hikerData.inventory.money -= gear.price;

    // Handle special purchases
    if (gear.effect === 'insurance') {
      // Activate rescue insurance
      this.hikerData.inventory.rescueInsurance = true;
      this.showMessage('🏥 Rescue Insurance activated! SAR rescues now only $100 copay.', 'success');
      this.showOutfitter();
      return;
    }

    if (gear.effect === 'plb') {
      // Add Garmin InReach to gear
      this.hikerData.inventory.gear.push({
        id: 'plb',
        name: 'Garmin InReach Mini',
        weight: 0.1,
        condition: 100,
        category: 'safety',
        description: 'Satellite communicator with SOS button. Press H in emergencies.'
      });
      this.showMessage('📡 Garmin InReach Mini acquired! Press H for emergency SOS.', 'success');
      this.showOutfitter();
      return;
    }

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

  showCampfireStories() {
    this.clearMenu();
    this.selectedCategory = 'campfire';

    const { width, height } = this.cameras.main;

    // Back button
    const backBtn = this.createMenuButton(80, 100, '← Back', true);
    backBtn.setInteractive(new Phaser.Geom.Rectangle(-60, -20, 120, 40), Phaser.Geom.Rectangle.Contains);
    backBtn.on('pointerdown', () => this.showMainMenu());
    this.menuItems.push(backBtn);

    this.add.text(width / 2, 100, '🔥 Campfire Stories', {
      font: 'bold 18px Courier',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(width / 2, 125, 'Share stories, make friends, get trail tips', {
      font: 'italic 11px Courier',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    // Get NPCs in town
    const npcsInTown = bubbleSystem.getNPCsInTown(this.townData.name);

    if (npcsInTown.length === 0) {
      this.add.text(width / 2, height / 2, 'The campfire is quiet tonight...\nNo other hikers around.', {
        font: '14px Courier',
        color: '#888888',
        align: 'center'
      }).setOrigin(0.5);
      this.showStats();
      return;
    }

    // Show each NPC with their trail tips
    const startY = 160;
    const cardHeight = 80;

    npcsInTown.slice(0, 4).forEach((npc, index) => {
      const y = startY + index * cardHeight;
      const container = this.add.container(width / 2, y);

      // Card background
      const bg = this.add.rectangle(0, 0, width - 40, 70, 0x1a1a2e);
      bg.setStrokeStyle(1, 0x4a4a6a);
      container.add(bg);

      // NPC name and relationship status
      const encounters = npc.relationship.encounters;
      const relationshipIcon = encounters === 0 ? '👋' : (encounters < 3 ? '🤝' : '❤️');
      const nameText = this.add.text(-width / 2 + 40, -20, `${relationshipIcon} ${npc.trailName}`, {
        font: 'bold 14px Courier',
        color: '#ffffff'
      });
      container.add(nameText);

      // NPC hometown
      const hometown = this.add.text(-width / 2 + 40, 0, `${npc.realName} from ${npc.hometown}`, {
        font: '11px Courier',
        color: '#888888'
      });
      container.add(hometown);

      // Get trail tip from NPC
      const tip = bubbleSystem.getTrailTip(npc.id) || "Just enjoying the trail...";
      const tipText = this.add.text(-width / 2 + 40, 18, `"${tip.substring(0, 50)}${tip.length > 50 ? '...' : ''}"`, {
        font: 'italic 10px Courier',
        color: '#aaddaa'
      });
      container.add(tipText);

      // Chat button
      const chatBtn = this.add.rectangle(width / 2 - 60, 0, 60, 35, 0x2e5339);
      chatBtn.setStrokeStyle(1, 0x4a7d5a);
      container.add(chatBtn);

      const chatText = this.add.text(width / 2 - 60, 0, 'Chat', {
        font: '12px Courier',
        color: '#ffffff'
      }).setOrigin(0.5);
      container.add(chatText);

      chatBtn.setInteractive();
      chatBtn.on('pointerdown', () => this.chatWithNPC(npc));
      chatBtn.on('pointerover', () => chatBtn.setFillStyle(0x4a7d5a));
      chatBtn.on('pointerout', () => chatBtn.setFillStyle(0x2e5339));

      this.menuItems.push(container);
    });

    // Morale boost message
    this.add.text(width / 2, height - 100, '🌟 Spending time with trail friends boosts morale!', {
      font: '11px Courier',
      color: '#88aa88'
    }).setOrigin(0.5);

    this.showStats();
  }

  chatWithNPC(npc: BubbleNPC) {
    // Record the encounter
    bubbleSystem.recordEncounter(npc.id, this.gameTime.day, `Campfire chat in ${this.townData.name}`);

    // Get greeting based on relationship
    const greeting = bubbleSystem.getGreeting(npc.id);

    // Boost player morale
    this.hikerData.moodles.morale = Math.min(100, (this.hikerData.moodles.morale || 50) + 5);

    // Show the interaction
    this.showMessage(`${npc.trailName}: "${greeting}" (+5 morale)`, 'success');

    // Refresh the view after a moment
    this.time.delayedCall(1500, () => {
      this.showCampfireStories();
    });
  }

  showYardSale() {
    this.clearMenu();
    this.selectedCategory = 'yardsale';

    const { width, height } = this.cameras.main;

    // Back button
    const backBtn = this.createMenuButton(80, 100, '← Back', true);
    backBtn.setInteractive(new Phaser.Geom.Rectangle(-60, -20, 120, 40), Phaser.Geom.Rectangle.Contains);
    backBtn.on('pointerdown', () => this.showMainMenu());
    this.menuItems.push(backBtn);

    this.add.text(width / 2, 100, '🏷️ Hiker Gear Yard Sale', {
      font: 'bold 18px Courier',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(width / 2, 125, 'Used gear from hikers who left the trail', {
      font: 'italic 11px Courier',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    const items = bubbleSystem.getYardSaleItems();

    if (items.length === 0) {
      this.add.text(width / 2, height / 2, 'No gear for sale right now.\nCheck back later!', {
        font: '14px Courier',
        color: '#888888',
        align: 'center'
      }).setOrigin(0.5);
      this.showStats();
      return;
    }

    // Show items
    const startY = 160;
    const itemHeight = 65;

    items.slice(0, 5).forEach((item, index) => {
      const y = startY + index * itemHeight;
      const canAfford = (this.hikerData?.inventory?.money || 0) >= item.salePrice;

      const container = this.add.container(width / 2, y);

      // Card background
      const bg = this.add.rectangle(0, 0, width - 40, 55, canAfford ? 0x222222 : 0x1a1a1a);
      bg.setStrokeStyle(1, 0x444444);
      container.add(bg);

      // Item name and condition
      const condition = item.condition >= 70 ? 'Good' : (item.condition >= 50 ? 'Fair' : 'Worn');
      const condColor = item.condition >= 70 ? '#4aff4a' : (item.condition >= 50 ? '#ffff4a' : '#ff8844');
      const nameText = this.add.text(-width / 2 + 40, -12, `${item.name} (${condition})`, {
        font: '13px Courier',
        color: canAfford ? '#ffffff' : '#666666'
      });
      container.add(nameText);

      // Seller info and reason
      const sellerText = this.add.text(-width / 2 + 40, 6, `From: ${item.seller} - "${item.reason}"`, {
        font: '10px Courier',
        color: '#888888'
      });
      container.add(sellerText);

      // Price comparison
      const priceText = this.add.text(width / 2 - 110, -8, `$${item.salePrice}`, {
        font: 'bold 14px Courier',
        color: canAfford ? '#4aff4a' : '#ff4a4a'
      }).setOrigin(0.5);
      container.add(priceText);

      const originalPrice = this.add.text(width / 2 - 110, 8, `was $${item.originalPrice}`, {
        font: '9px Courier',
        color: '#666666'
      }).setOrigin(0.5);
      container.add(originalPrice);

      // Buy button
      if (canAfford) {
        const buyBtn = this.add.rectangle(width / 2 - 45, 0, 50, 35, 0x2e5339);
        buyBtn.setStrokeStyle(1, 0x4a7d5a);
        container.add(buyBtn);

        const buyText = this.add.text(width / 2 - 45, 0, 'BUY', {
          font: 'bold 11px Courier',
          color: '#ffffff'
        }).setOrigin(0.5);
        container.add(buyText);

        buyBtn.setInteractive();
        buyBtn.on('pointerdown', () => this.buyYardSaleItem(item));
        buyBtn.on('pointerover', () => buyBtn.setFillStyle(0x4a7d5a));
        buyBtn.on('pointerout', () => buyBtn.setFillStyle(0x2e5339));
      }

      this.menuItems.push(container);
    });

    this.showStats();
  }

  buyYardSaleItem(item: YardSaleItem) {
    if (!this.hikerData?.inventory) return;

    const money = this.hikerData.inventory.money || 0;
    if (money < item.salePrice) {
      this.showMessage('Not enough money!', 'error');
      return;
    }

    // Deduct money
    this.hikerData.inventory.money -= item.salePrice;

    // Remove from yard sale
    bubbleSystem.purchaseYardSaleItem(item.id);

    // Add to gear (simplified - just adds as generic gear)
    this.hikerData.inventory.gear.push({
      id: item.id,
      name: item.name,
      weight: item.weight,
      condition: item.condition,
      category: 'gear'
    });

    this.showMessage(`Bought ${item.name} from ${item.seller}!`, 'success');
    this.showYardSale();
  }

  doTownSpecial() {
    if (!this.townData.special) return;

    const special = this.townData.special;
    const money = this.hikerData?.inventory?.money || 0;

    if (special.cost > 0 && money < special.cost) {
      this.showMessage(`Need $${special.cost} for ${special.label}!`, 'error');
      return;
    }

    // Deduct cost
    if (special.cost > 0) {
      this.hikerData.inventory.money -= special.cost;
    }

    // Apply effects
    if (special.effects.morale) {
      this.hikerData.moodles.morale = Math.min(100, (this.hikerData.moodles.morale || 50) + special.effects.morale);
    }
    if (special.effects.energy) {
      this.hikerData.energy = Math.min(100, (this.hikerData.energy || 50) + special.effects.energy);
    }
    if (special.effects.calories) {
      this.hikerData.calories = Math.min(3000, (this.hikerData.calories || 1000) + special.effects.calories);
    }

    // Build effect message
    const effectParts: string[] = [];
    if (special.effects.morale) effectParts.push(`+${special.effects.morale} morale`);
    if (special.effects.energy) effectParts.push(`+${special.effects.energy} energy`);
    if (special.effects.calories) effectParts.push(`+${special.effects.calories} cal`);

    this.showMessage(`${special.label}! ${special.description} (${effectParts.join(', ')})`, 'success');
    this.showMainMenu();
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
