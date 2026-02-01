import Phaser from 'phaser';
import { journalSystem, type JournalEntry, type JournalCategory } from '../systems/JournalSystem';

type TabFilter = 'all' | JournalCategory;

export class JournalScene extends Phaser.Scene {
  private scrollY: number = 0;
  private maxScroll: number = 0;
  private contentContainer!: Phaser.GameObjects.Container;
  private activeTab: TabFilter = 'all';
  private tabButtons: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: 'JournalScene' });
  }

  init() {
    this.scrollY = 0;
    this.activeTab = 'all';
  }

  create() {
    const { width, height } = this.cameras.main;

    // Semi-transparent background overlay
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.85);
    overlay.setOrigin(0, 0);
    overlay.setInteractive();

    // Panel background
    const panelWidth = Math.min(width - 40, 450);
    const panelHeight = height - 80;
    const panelX = (width - panelWidth) / 2;
    const panelY = 40;

    const panel = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x1a1a1a);
    panel.setOrigin(0, 0);
    panel.setStrokeStyle(2, 0x4a7d5a);

    // Title
    this.add.text(width / 2, panelY + 15, 'TRAIL JOURNAL', {
      font: '24px Courier',
      color: '#4a7d5a'
    }).setOrigin(0.5, 0);

    // Entry count
    const entryCount = journalSystem.getEntryCount();
    this.add.text(width / 2, panelY + 42, `${entryCount} entries`, {
      font: '11px Courier',
      color: '#888888'
    }).setOrigin(0.5, 0);

    // Close button
    const closeBtn = this.add.text(panelX + panelWidth - 15, panelY + 10, 'X', {
      font: '20px Courier',
      color: '#ff6666'
    }).setOrigin(0.5, 0).setInteractive();

    closeBtn.on('pointerover', () => closeBtn.setColor('#ff9999'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#ff6666'));
    closeBtn.on('pointerdown', () => this.closeJournal());

    // Tab bar
    this.createTabs(panelX, panelY + 60, panelWidth);

    // Create scrollable content container
    this.contentContainer = this.add.container(panelX + 15, panelY + 100);

    // Mask for scrolling
    const maskGraphics = this.add.graphics();
    maskGraphics.fillStyle(0xffffff);
    maskGraphics.fillRect(panelX, panelY + 95, panelWidth, panelHeight - 115);
    const mask = maskGraphics.createGeometryMask();
    this.contentContainer.setMask(mask);

    // Build journal content
    this.buildContent(panelWidth - 30);

    // Enable scrolling
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: any[], _deltaX: number, deltaY: number) => {
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
    this.input.keyboard?.on('keydown-J', () => this.closeJournal());
    this.input.keyboard?.on('keydown-ESC', () => this.closeJournal());

    // Handle resize events
    this.scale.on('resize', this.onResize, this);
  }

  onResize() {
    this.scene.restart();
  }

  createTabs(panelX: number, y: number, panelWidth: number) {
    const tabs: { id: TabFilter; label: string; emoji: string }[] = [
      { id: 'all', label: 'All', emoji: '📔' },
      { id: 'milestone', label: 'Miles', emoji: '🏔️' },
      { id: 'scenic', label: 'Scenic', emoji: '🌅' },
      { id: 'encounter', label: 'People', emoji: '👥' },
    ];

    const tabWidth = (panelWidth - 30) / tabs.length;

    tabs.forEach((tab, index) => {
      const x = panelX + 15 + (index * tabWidth) + (tabWidth / 2);
      const container = this.add.container(x, y);

      const isActive = this.activeTab === tab.id;
      const bgColor = isActive ? 0x4a7d5a : 0x2a2a2a;

      const bg = this.add.rectangle(0, 0, tabWidth - 6, 28, bgColor);
      bg.setStrokeStyle(1, isActive ? 0x6a9d7a : 0x444444);
      container.add(bg);

      const label = this.add.text(0, 0, `${tab.emoji} ${tab.label}`, {
        font: '11px Courier',
        color: isActive ? '#ffffff' : '#888888'
      }).setOrigin(0.5);
      container.add(label);

      container.setInteractive(
        new Phaser.Geom.Rectangle(-tabWidth / 2 + 3, -14, tabWidth - 6, 28),
        Phaser.Geom.Rectangle.Contains
      );

      container.on('pointerdown', () => {
        this.activeTab = tab.id;
        this.scrollY = 0;
        this.scene.restart();
      });

      container.on('pointerover', () => {
        if (!isActive) bg.setFillStyle(0x3a3a3a);
      });

      container.on('pointerout', () => {
        if (!isActive) bg.setFillStyle(0x2a2a2a);
      });

      this.tabButtons.push(container);
    });
  }

  buildContent(contentWidth: number) {
    const entries = this.activeTab === 'all'
      ? journalSystem.getEntries()
      : journalSystem.getEntries(this.activeTab as JournalCategory);

    if (entries.length === 0) {
      const emptyText = this.add.text(contentWidth / 2, 50, 'No entries yet...\n\nYour journey is just beginning!', {
        font: '14px Courier',
        color: '#666666',
        align: 'center'
      }).setOrigin(0.5, 0);
      this.contentContainer.add(emptyText);
      this.maxScroll = 0;
      return;
    }

    let yOffset = 0;
    const entryHeight = 75;
    const entryGap = 10;

    entries.forEach((entry, index) => {
      const entryContainer = this.createEntryCard(entry, contentWidth, yOffset);
      this.contentContainer.add(entryContainer);
      yOffset += entryHeight + entryGap;
    });

    // Calculate max scroll
    const visibleHeight = this.cameras.main.height - 200;
    this.maxScroll = Math.max(0, yOffset - visibleHeight);
  }

  createEntryCard(entry: JournalEntry, contentWidth: number, yOffset: number): Phaser.GameObjects.Container {
    const container = this.add.container(0, yOffset);

    // Card background
    const categoryColors: Record<JournalCategory, number> = {
      milestone: 0x2a3d4a,
      scenic: 0x3a4a2a,
      encounter: 0x4a3a2a,
      memory: 0x3a2a4a,
    };

    const bg = this.add.rectangle(contentWidth / 2, 35, contentWidth, 70, categoryColors[entry.category]);
    bg.setStrokeStyle(1, 0x555555);
    container.add(bg);

    // Emoji and title row
    const emojiText = this.add.text(10, 10, entry.emoji, {
      font: '20px Arial'
    });
    container.add(emojiText);

    const titleText = this.add.text(40, 12, entry.title, {
      font: 'bold 13px Courier',
      color: '#ffffff'
    });
    container.add(titleText);

    // Date and mile info
    const dateStr = `Day ${entry.gameDay}, ${this.formatHour(entry.gameHour)}`;
    const mileStr = `Mile ${entry.playerMile.toFixed(1)}`;
    const metaText = this.add.text(contentWidth - 10, 12, `${dateStr} | ${mileStr}`, {
      font: '10px Courier',
      color: '#888888'
    }).setOrigin(1, 0);
    container.add(metaText);

    // Message (truncated if too long)
    const maxMessageLen = 80;
    const displayMessage = entry.message.length > maxMessageLen
      ? entry.message.substring(0, maxMessageLen) + '...'
      : entry.message;

    const messageText = this.add.text(10, 38, displayMessage, {
      font: '11px Courier',
      color: '#cccccc',
      wordWrap: { width: contentWidth - 20 }
    });
    container.add(messageText);

    // Location/NPC info if present
    if (entry.data?.location || entry.data?.npcName) {
      const extraInfo = entry.data.location || entry.data.npcName;
      const extraText = this.add.text(10, 58, `📍 ${extraInfo}`, {
        font: '9px Courier',
        color: '#6a9d7a'
      });
      container.add(extraText);
    }

    return container;
  }

  formatHour(hour: number): string {
    if (hour === 0) return '12:00 AM';
    if (hour === 12) return '12:00 PM';
    if (hour < 12) return `${hour}:00 AM`;
    return `${hour - 12}:00 PM`;
  }

  closeJournal() {
    this.scene.stop('JournalScene');
    this.scene.resume('GameScene');
    this.scene.resume('UIScene');
  }
}
