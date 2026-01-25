import Phaser from 'phaser';
import { TRAIL_TOTAL_MILES } from '../data/TrailData';
import { TRAIL_DATA, TrailLocation } from '../data/UnifiedTrailData';
import { binarySearchStartIndex } from '../utils/searchUtils';

// Trail tips based on current section
const TRAIL_TIPS: { minMile: number; maxMile: number; tips: string[] }[] = [
  {
    minMile: 0, maxMile: 50,
    tips: [
      'Take it slow! Your body is adapting.',
      'Neels Gap at mile 31 offers gear shakedowns.',
      'Blood Mountain is tough - save energy.',
      'Stay hydrated even when cold.',
      'Blisters? Treat them immediately.'
    ]
  },
  {
    minMile: 50, maxMile: 165,
    tips: [
      'NOC at mile 137 is a great resupply.',
      'Fontana Dam has "Hilton" shelter with showers!',
      'Smokies require permit - get it online.',
      'Bear cables required in Smokies.',
      'Watch for hypothermia in spring Smokies.'
    ]
  },
  {
    minMile: 165, maxMile: 274,
    tips: [
      'Kuwohi is the AT\'s highest point at 6,643 ft.',
      'Hot Springs is a full trail town walkthrough.',
      'Standing Bear Farm is a classic stop.',
      'Watch elevation gains - big climbs here.',
      'Spring wildflowers peak March-April.'
    ]
  },
  {
    minMile: 274, maxMile: 469,
    tips: [
      'Damascus is "Trail Town USA" - enjoy it!',
      'Trail Days festival in mid-May.',
      'Roan Highlands have amazing balds.',
      'Highest shelter on AT at Roan High Knob.',
      'Virginia is the longest state - 550+ miles.'
    ]
  },
  {
    minMile: 469, maxMile: 880,
    tips: [
      'Grayson Highlands has wild ponies!',
      'The Priest is a brutal climb.',
      'Shenandoah has waysides for food.',
      'Bears are active in Shenandoah.',
      'Fast miles possible in central VA.'
    ]
  },
  {
    minMile: 880, maxMile: 1024,
    tips: [
      'Roller Coaster in NoVA is aptly named.',
      'Harpers Ferry is the "psychological halfway".',
      'ATC HQ is worth a visit.',
      'Historic battlefields nearby.',
      'Watch for ticks in this section.'
    ]
  },
  {
    minMile: 1024, maxMile: 1298,
    tips: [
      'Pennsylvania rocks will test your feet.',
      'Half Gallon Challenge at Pine Grove Furnace!',
      'Doyle Hotel in Duncannon is "an experience".',
      'Ankle protection recommended.',
      'Heat and humidity peak in summer.'
    ]
  },
  {
    minMile: 1298, maxMile: 1791,
    tips: [
      'States fall fast through NY, NJ, CT, MA, VT.',
      'Tom Levardi in Dalton is legendary.',
      'Hanover is a great college town.',
      'Vermont mud is real - gaiters help.',
      'Prepare mentally for the Whites.'
    ]
  },
  {
    minMile: 1791, maxMile: 1912,
    tips: [
      'WHITE MOUNTAINS - hardest terrain on AT.',
      'Above-treeline exposure is dangerous.',
      'Weather can change in minutes.',
      'AMC huts: work-for-stay or tent.',
      'Mt. Washington has world\'s worst weather.',
      'Finish Whites = you WILL finish the trail.'
    ]
  },
  {
    minMile: 1912, maxMile: TRAIL_TOTAL_MILES,
    tips: [
      'Maine is slow - adjust expectations.',
      'Monson: last resupply before 100-Mile.',
      '100-Mile Wilderness: 8-10 days food.',
      'Roots and rocks are relentless.',
      'Baxter rangers may turn you back in weather.',
      'Build 2-3 buffer days before summit.'
    ]
  }
];

export class GuideScene extends Phaser.Scene {
  private currentMile: number = 0;
  private activeTab: string = 'upcoming';
  private tabButtons: Phaser.GameObjects.Container[] = [];
  private contentContainer!: Phaser.GameObjects.Container;
  private scrollY: number = 0;
  private maxScrollY: number = 0;
  private isMobile: boolean = false;

  constructor() {
    super({ key: 'GuideScene' });
  }

  init(data: { currentMile?: number }) {
    this.currentMile = data.currentMile || 0;
  }

  create() {
    const { width, height } = this.cameras.main;

    this.isMobile = this.sys.game.device.os.android || this.sys.game.device.os.iOS ||
                    ('ontouchstart' in window) || width < 768;

    // Dark overlay background
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.92);
    overlay.setInteractive();

    // Header
    const headerHeight = 60;
    this.add.rectangle(width / 2, headerHeight / 2, width, headerHeight, 0x2e5339);

    this.add.text(width / 2, headerHeight / 2, 'AT FIELD GUIDE', {
      font: this.isMobile ? '20px Courier' : '24px Courier',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Current position indicator
    this.add.text(width / 2, headerHeight / 2 + 22, `Mile ${this.currentMile.toFixed(1)} of ${TRAIL_TOTAL_MILES.toLocaleString()}`, {
      font: this.isMobile ? '11px Courier' : '13px Courier',
      color: '#aaccaa'
    }).setOrigin(0.5);

    // Close button
    const closeBtn = this.add.text(width - 20, headerHeight / 2, 'X', {
      font: '24px Courier',
      color: '#ffffff'
    }).setOrigin(0.5).setInteractive();
    closeBtn.on('pointerdown', () => this.closeGuide());
    closeBtn.on('pointerover', () => closeBtn.setColor('#ff6666'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#ffffff'));

    // Tab bar
    const tabY = headerHeight + 30;
    const tabs = ['upcoming', 'towns', 'shelters', 'peaks', 'tips'];
    const tabWidth = (width - 20) / tabs.length;

    tabs.forEach((tab, i) => {
      const x = 10 + i * tabWidth + tabWidth / 2;
      const container = this.add.container(x, tabY);

      const bg = this.add.rectangle(0, 0, tabWidth - 4, 30,
        tab === this.activeTab ? 0x4a7d5a : 0x333333);
      bg.setInteractive();

      const label = this.add.text(0, 0, tab.toUpperCase(), {
        font: this.isMobile ? '10px Courier' : '12px Courier',
        color: tab === this.activeTab ? '#ffffff' : '#888888'
      }).setOrigin(0.5);

      container.add([bg, label]);
      container.setData('tab', tab);
      container.setData('bg', bg);
      container.setData('label', label);

      bg.on('pointerdown', () => this.switchTab(tab));
      bg.on('pointerover', () => {
        if (tab !== this.activeTab) bg.setFillStyle(0x444444);
      });
      bg.on('pointerout', () => {
        if (tab !== this.activeTab) bg.setFillStyle(0x333333);
      });

      this.tabButtons.push(container);
    });

    // Content area
    const contentY = tabY + 40;
    const contentHeight = height - contentY - 60;

    // Mask for scrolling content
    const maskShape = this.make.graphics({});
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(10, contentY, width - 20, contentHeight);
    const mask = maskShape.createGeometryMask();

    this.contentContainer = this.add.container(0, contentY);
    this.contentContainer.setMask(mask);

    // Render initial content
    this.renderContent();

    // Scroll handling
    this.input.on('wheel', (pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
      this.scrollY = Phaser.Math.Clamp(this.scrollY + deltaY * 0.5, 0, this.maxScrollY);
      this.contentContainer.setY(tabY + 40 - this.scrollY);
    });

    // Touch drag for mobile scroll
    let dragStartY = 0;
    let dragStartScroll = 0;

    overlay.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      dragStartY = pointer.y;
      dragStartScroll = this.scrollY;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        const delta = dragStartY - pointer.y;
        this.scrollY = Phaser.Math.Clamp(dragStartScroll + delta, 0, this.maxScrollY);
        this.contentContainer.setY(tabY + 40 - this.scrollY);
      }
    });

    // Keyboard controls
    this.input.keyboard?.on('keydown-ESC', () => this.closeGuide());
    this.input.keyboard?.on('keydown-G', () => this.closeGuide());

    // Handle resize events
    this.scale.on('resize', this.onResize, this);
  }

  onResize() {
    // Restart scene with current state to rebuild layout
    this.scene.restart({ currentMile: this.currentMile });
  }

  switchTab(tab: string) {
    this.activeTab = tab;
    this.scrollY = 0;

    // Update tab visuals
    this.tabButtons.forEach(container => {
      const t = container.getData('tab');
      const bg = container.getData('bg') as Phaser.GameObjects.Rectangle;
      const label = container.getData('label') as Phaser.GameObjects.Text;

      bg.setFillStyle(t === tab ? 0x4a7d5a : 0x333333);
      label.setColor(t === tab ? '#ffffff' : '#888888');
    });

    this.renderContent();
  }

  renderContent() {
    const { width, height } = this.cameras.main;

    // Clear existing content
    this.contentContainer.removeAll(true);

    let items: TrailLocation[] = [];
    let yOffset = 10;
    const itemHeight = this.isMobile ? 65 : 75;
    const contentWidth = width - 40;

    switch (this.activeTab) {
      case 'upcoming':
        // Show next 10 locations from current mile
        const upcomingIndex = binarySearchStartIndex(TRAIL_DATA, this.currentMile, item => item.mile);
        items = TRAIL_DATA.slice(upcomingIndex, upcomingIndex + 10);
        break;
      case 'towns':
        const townIndex = binarySearchStartIndex(TRAIL_DATA, this.currentMile - 50, item => item.mile);
        items = TRAIL_DATA.slice(townIndex).filter(loc => loc.type === 'town');
        break;
      case 'shelters':
        const shelterIndex = binarySearchStartIndex(TRAIL_DATA, this.currentMile - 20, item => item.mile);
        items = TRAIL_DATA.slice(shelterIndex).filter(loc => loc.type === 'shelter');
        break;
      case 'peaks':
        // Peaks are sparse, filtering all is acceptable
        items = TRAIL_DATA.filter(loc => loc.type === 'peak');
        break;
      case 'tips':
        this.renderTips();
        return;
    }

    items.forEach((item, i) => {
      const y = yOffset + i * itemHeight;
      const container = this.add.container(20, y);

      // Background
      const isPast = item.mile < this.currentMile;
      const bgColor = isPast ? 0x222222 : (this.getTypeColor(item.type));
      const bg = this.add.rectangle(contentWidth / 2, itemHeight / 2 - 5, contentWidth, itemHeight - 8, bgColor, 0.3);
      bg.setStrokeStyle(1, this.getTypeColor(item.type));

      // Mile marker
      const mileText = this.add.text(10, 8, `Mile ${item.mile.toFixed(1)}`, {
        font: this.isMobile ? '10px Courier' : '12px Courier',
        color: isPast ? '#666666' : '#4a7d5a'
      });

      // Distance from current position
      const distFromHere = item.mile - this.currentMile;
      const distText = distFromHere > 0
        ? `${distFromHere.toFixed(1)} mi ahead`
        : distFromHere < 0
          ? `${Math.abs(distFromHere).toFixed(1)} mi back`
          : 'YOU ARE HERE';

      const distDisplay = this.add.text(contentWidth - 10, 8, distText, {
        font: this.isMobile ? '9px Courier' : '11px Courier',
        color: distFromHere === 0 ? '#ffcc00' : '#888888'
      }).setOrigin(1, 0);

      // Location name
      const nameText = this.add.text(10, 24, item.name, {
        font: this.isMobile ? '13px Courier' : '15px Courier',
        color: isPast ? '#888888' : '#ffffff',
        fontStyle: 'bold'
      });

      // Type badge
      const badge = this.add.text(contentWidth - 10, 24, item.type.toUpperCase(), {
        font: this.isMobile ? '9px Courier' : '10px Courier',
        color: '#000000',
        backgroundColor: this.getTypeColorHex(item.type),
        padding: { x: 4, y: 2 }
      }).setOrigin(1, 0);

      // Description
      const descText = this.add.text(10, 42, item.description, {
        font: this.isMobile ? '10px Courier' : '11px Courier',
        color: '#aaaaaa',
        wordWrap: { width: contentWidth - 20 }
      });

      // Elevation if available
      if (item.elevation) {
        const elevText = this.add.text(contentWidth - 10, itemHeight - 18, `⛰️ ${item.elevation.toLocaleString()} ft`, {
          font: this.isMobile ? '9px Courier' : '10px Courier',
          color: '#7799aa'
        }).setOrigin(1, 0);
        container.add(elevText);
      }

      // Services if available
      if (item.services && item.services.length > 0) {
        const servicesText = this.add.text(10, itemHeight - 18, item.services.slice(0, 4).join(' | '), {
          font: this.isMobile ? '8px Courier' : '9px Courier',
          color: '#77aa77'
        });
        container.add(servicesText);
      }

      container.add([bg, mileText, distDisplay, nameText, badge, descText]);
      this.contentContainer.add(container);
    });

    this.maxScrollY = Math.max(0, items.length * itemHeight - (height - 160));
  }

  renderTips() {
    const { width, height } = this.cameras.main;
    const contentWidth = width - 40;
    let yOffset = 10;

    // Find relevant tips for current location
    const relevantSection = TRAIL_TIPS.find(
      section => this.currentMile >= section.minMile && this.currentMile <= section.maxMile
    ) || TRAIL_TIPS[0];

    // Section header
    const header = this.add.text(20, yOffset, `Tips for Miles ${relevantSection.minMile} - ${relevantSection.maxMile}`, {
      font: this.isMobile ? '14px Courier' : '16px Courier',
      color: '#4a7d5a',
      fontStyle: 'bold'
    });
    this.contentContainer.add(header);
    yOffset += 35;

    // Tips
    relevantSection.tips.forEach((tip, i) => {
      const tipContainer = this.add.container(20, yOffset + i * 45);

      const bullet = this.add.text(0, 0, '•', {
        font: this.isMobile ? '14px Courier' : '16px Courier',
        color: '#4a7d5a'
      });

      const tipText = this.add.text(20, 0, tip, {
        font: this.isMobile ? '11px Courier' : '13px Courier',
        color: '#cccccc',
        wordWrap: { width: contentWidth - 40 }
      });

      tipContainer.add([bullet, tipText]);
      this.contentContainer.add(tipContainer);
    });

    yOffset += relevantSection.tips.length * 45 + 30;

    // General reminders
    const generalHeader = this.add.text(20, yOffset, 'Always Remember:', {
      font: this.isMobile ? '14px Courier' : '16px Courier',
      color: '#aa7755',
      fontStyle: 'bold'
    });
    this.contentContainer.add(generalHeader);
    yOffset += 30;

    const generalTips = [
      'Hydrate before you\'re thirsty.',
      'Never skip treating water.',
      'Check weather before exposed ridges.',
      'Tell someone your plan.',
      'Respect your limits - the trail will wait.'
    ];

    generalTips.forEach((tip, i) => {
      const tipText = this.add.text(20, yOffset + i * 28, `• ${tip}`, {
        font: this.isMobile ? '11px Courier' : '13px Courier',
        color: '#999999'
      });
      this.contentContainer.add(tipText);
    });

    this.maxScrollY = Math.max(0, yOffset + generalTips.length * 28 - (height - 160));
  }

  getTypeColor(type: string): number {
    const colors: Record<string, number> = {
      town: 0x4a7d5a,
      shelter: 0x557799,
      water: 0x3377aa,
      peak: 0x996633,
      landmark: 0x666666
    };
    return colors[type] || 0x444444;
  }

  getTypeColorHex(type: string): string {
    const colors: Record<string, string> = {
      town: '#4a7d5a',
      shelter: '#557799',
      water: '#3377aa',
      peak: '#996633',
      landmark: '#888888'
    };
    return colors[type] || '#444444';
  }

  closeGuide() {
    // Stop this scene
    this.scene.stop('GuideScene');

    // Resume game scene
    this.scene.resume('GameScene');
  }
}
