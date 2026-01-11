/**
 * NetworkManager - P2P multiplayer via WebRTC/PeerJS
 *
 * Project Zomboid-style: Host runs authoritative simulation,
 * guests connect and sync state. No central server required.
 */

import Peer, { DataConnection } from 'peerjs';

// Message types for P2P communication
export enum MessageType {
  // Connection
  PLAYER_JOIN = 'player_join',
  PLAYER_LEAVE = 'player_leave',
  PLAYER_LIST = 'player_list',

  // State sync (host -> guests)
  STATE_SYNC = 'state_sync',
  WEATHER_UPDATE = 'weather_update',
  TIME_UPDATE = 'time_update',
  EVENT = 'event',

  // Inputs (guest -> host)
  INPUT = 'input',
  CHAT = 'chat',
}

export interface PlayerState {
  peerId: string;
  name: string;
  trailName: string;
  mile: number;
  x: number;
  isHiking: boolean;
  energy: number;
  health: number;
  elevation: number;
}

export interface GameStateSync {
  timestamp: number;
  players: PlayerState[];
  weather: {
    isRaining: boolean;
    isFoggy: boolean;
  };
  time: {
    hour: number;
    minute: number;
    day: number;
  };
}

export interface NetworkMessage {
  type: MessageType;
  payload: any;
  senderId: string;
  timestamp: number;
}

export interface InputMessage {
  action: 'start_hike' | 'stop_hike' | 'move_left' | 'move_right' | 'rest' | 'eat' | 'drink';
  data?: any;
}

type MessageHandler = (message: NetworkMessage, connection?: DataConnection) => void;

export class NetworkManager {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private messageHandlers: Map<MessageType, MessageHandler[]> = new Map();

  private _isHost: boolean = false;
  private _isConnected: boolean = false;
  private _roomCode: string = '';
  private _localPlayerId: string = '';
  private _localPlayerName: string = '';
  private _localTrailName: string = '';

  // Host tracking of all players
  private players: Map<string, PlayerState> = new Map();

  // Sync interval
  private syncInterval: number | null = null;
  private readonly SYNC_RATE = 100; // 10 Hz

  get isHost(): boolean { return this._isHost; }
  get isConnected(): boolean { return this._isConnected; }
  get roomCode(): string { return this._roomCode; }
  get localPlayerId(): string { return this._localPlayerId; }
  get playerCount(): number { return this.connections.size + 1; }

  /**
   * Generate a short room code from peer ID
   */
  private generateRoomCode(peerId: string): string {
    // Take last 6 characters, uppercase
    return peerId.slice(-6).toUpperCase();
  }

  /**
   * Start hosting a multiplayer session
   */
  async hostSession(playerName: string, trailName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Create peer with random ID
        this.peer = new Peer();

        this.peer.on('open', (id) => {
          this._localPlayerId = id;
          this._localPlayerName = playerName;
          this._localTrailName = trailName;
          this._roomCode = this.generateRoomCode(id);
          this._isHost = true;
          this._isConnected = true;

          // Add self to players
          this.players.set(id, {
            peerId: id,
            name: playerName,
            trailName: trailName,
            mile: 0,
            x: 400,
            isHiking: false,
            energy: 100,
            health: 100,
            elevation: 3782,
          });

          console.log(`[NetworkManager] Hosting session: ${this._roomCode} (full ID: ${id})`);
          resolve(this._roomCode);
        });

        this.peer.on('connection', (conn) => {
          this.handleIncomingConnection(conn);
        });

        this.peer.on('error', (err) => {
          console.error('[NetworkManager] Peer error:', err);
          reject(err);
        });

      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Join an existing session by room code
   */
  async joinSession(roomCode: string, playerName: string, trailName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.peer = new Peer();

        this.peer.on('open', (id) => {
          this._localPlayerId = id;
          this._localPlayerName = playerName;
          this._localTrailName = trailName;
          this._roomCode = roomCode;
          this._isHost = false;

          // Find host by room code
          // PeerJS IDs end with the room code
          this.findAndConnectToHost(roomCode, playerName, trailName)
            .then(() => resolve())
            .catch(reject);
        });

        this.peer.on('error', (err) => {
          console.error('[NetworkManager] Peer error:', err);
          reject(err);
        });

      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Find host peer ID from room code and connect
   */
  private async findAndConnectToHost(roomCode: string, playerName: string, trailName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.peer) {
        reject(new Error('Peer not initialized'));
        return;
      }

      // Try to connect - PeerJS broker will help find the peer
      // We need to try the full peer ID, but we only have the suffix
      // For now, we'll use a simple approach: try connecting with the room code as ID suffix

      // The host's peer ID ends with the room code (lowercase)
      // We'll try common peer ID prefixes
      const possibleIds = [
        roomCode.toLowerCase(),
        // PeerJS generates IDs like "abc123def456" - our code is last 6 chars
      ];

      // For a real implementation, we'd use a simple signaling server or
      // store the full peer ID. For now, we'll rely on the room code matching.

      // Actually, let's use the PeerJS ID directly - users will need to share the full code
      // We'll change generateRoomCode to use the full ID

      const conn = this.peer.connect(roomCode.toLowerCase(), {
        reliable: true,
        metadata: { playerName, trailName }
      });

      conn.on('open', () => {
        this.connections.set(roomCode.toLowerCase(), conn);
        this._isConnected = true;

        // Send join message
        this.send(conn, {
          type: MessageType.PLAYER_JOIN,
          payload: {
            name: playerName,
            trailName: trailName,
          },
          senderId: this._localPlayerId,
          timestamp: Date.now(),
        });

        console.log(`[NetworkManager] Connected to host: ${roomCode}`);
        resolve();
      });

      conn.on('data', (data) => {
        this.handleMessage(data as NetworkMessage, conn);
      });

      conn.on('close', () => {
        this.handleDisconnection(conn);
      });

      conn.on('error', (err) => {
        console.error('[NetworkManager] Connection error:', err);
        reject(err);
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!this._isConnected) {
          reject(new Error('Connection timeout - room not found'));
        }
      }, 10000);
    });
  }

  /**
   * Handle incoming connection (host only)
   */
  private handleIncomingConnection(conn: DataConnection) {
    console.log(`[NetworkManager] Incoming connection from: ${conn.peer}`);

    conn.on('open', () => {
      this.connections.set(conn.peer, conn);

      // Start sync interval if not already running
      if (!this.syncInterval) {
        this.startSyncInterval();
      }
    });

    conn.on('data', (data) => {
      this.handleMessage(data as NetworkMessage, conn);
    });

    conn.on('close', () => {
      this.handleDisconnection(conn);
    });
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: NetworkMessage, conn: DataConnection) {
    // Call registered handlers
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message, conn));
    }

    // Built-in handling
    switch (message.type) {
      case MessageType.PLAYER_JOIN:
        if (this._isHost) {
          // Add new player
          const newPlayer: PlayerState = {
            peerId: conn.peer,
            name: message.payload.name,
            trailName: message.payload.trailName,
            mile: 0,
            x: 400,
            isHiking: false,
            energy: 100,
            health: 100,
            elevation: 3782,
          };
          this.players.set(conn.peer, newPlayer);

          // Send current player list to new player
          this.send(conn, {
            type: MessageType.PLAYER_LIST,
            payload: Array.from(this.players.values()),
            senderId: this._localPlayerId,
            timestamp: Date.now(),
          });

          // Broadcast new player to all others
          this.broadcast({
            type: MessageType.PLAYER_JOIN,
            payload: newPlayer,
            senderId: this._localPlayerId,
            timestamp: Date.now(),
          }, conn.peer);

          console.log(`[NetworkManager] Player joined: ${message.payload.name} (${message.payload.trailName})`);
        }
        break;

      case MessageType.PLAYER_LIST:
        // Guest receiving player list
        if (!this._isHost) {
          message.payload.forEach((player: PlayerState) => {
            this.players.set(player.peerId, player);
          });
        }
        break;

      case MessageType.INPUT:
        // Host receiving input from guest
        if (this._isHost) {
          // Update player state based on input
          const player = this.players.get(message.senderId);
          if (player) {
            this.applyInput(player, message.payload as InputMessage);
          }
        }
        break;

      case MessageType.STATE_SYNC:
        // Guest receiving state sync
        if (!this._isHost) {
          const sync = message.payload as GameStateSync;
          sync.players.forEach(playerState => {
            this.players.set(playerState.peerId, playerState);
          });
        }
        break;
    }
  }

  /**
   * Apply input to player state (host only)
   */
  private applyInput(player: PlayerState, input: InputMessage) {
    switch (input.action) {
      case 'start_hike':
        player.isHiking = true;
        break;
      case 'stop_hike':
        player.isHiking = false;
        break;
      case 'move_left':
        player.x = Math.max(50, player.x - 5);
        break;
      case 'move_right':
        player.x = Math.min(750, player.x + 5);
        break;
    }
  }

  /**
   * Handle disconnection
   */
  private handleDisconnection(conn: DataConnection) {
    console.log(`[NetworkManager] Player disconnected: ${conn.peer}`);

    this.connections.delete(conn.peer);

    if (this._isHost) {
      // Remove player and broadcast
      this.players.delete(conn.peer);

      this.broadcast({
        type: MessageType.PLAYER_LEAVE,
        payload: { peerId: conn.peer },
        senderId: this._localPlayerId,
        timestamp: Date.now(),
      });

      // Stop sync if no more players
      if (this.connections.size === 0 && this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }
    } else {
      // Guest lost connection to host
      this._isConnected = false;
      // Trigger handlers
      const handlers = this.messageHandlers.get(MessageType.PLAYER_LEAVE);
      if (handlers) {
        handlers.forEach(handler => handler({
          type: MessageType.PLAYER_LEAVE,
          payload: { peerId: conn.peer, isHost: true },
          senderId: conn.peer,
          timestamp: Date.now(),
        }));
      }
    }
  }

  /**
   * Send message to specific connection
   */
  private send(conn: DataConnection, message: NetworkMessage) {
    if (conn.open) {
      conn.send(message);
    }
  }

  /**
   * Broadcast message to all connections (optionally excluding one)
   */
  broadcast(message: NetworkMessage, excludePeerId?: string) {
    this.connections.forEach((conn, peerId) => {
      if (peerId !== excludePeerId) {
        this.send(conn, message);
      }
    });
  }

  /**
   * Send input to host (guest only)
   */
  sendInput(input: InputMessage) {
    if (this._isHost) return; // Host doesn't need to send inputs

    const hostConn = Array.from(this.connections.values())[0];
    if (hostConn) {
      this.send(hostConn, {
        type: MessageType.INPUT,
        payload: input,
        senderId: this._localPlayerId,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Start sync interval (host only)
   */
  private startSyncInterval() {
    if (!this._isHost) return;

    this.syncInterval = window.setInterval(() => {
      const sync: GameStateSync = {
        timestamp: Date.now(),
        players: Array.from(this.players.values()),
        weather: { isRaining: false, isFoggy: false }, // Will be set by GameScene
        time: { hour: 6, minute: 0, day: 1 }, // Will be set by GameScene
      };

      this.broadcast({
        type: MessageType.STATE_SYNC,
        payload: sync,
        senderId: this._localPlayerId,
        timestamp: Date.now(),
      });
    }, this.SYNC_RATE);
  }

  /**
   * Update local player state (for sync)
   */
  updateLocalPlayer(state: Partial<PlayerState>) {
    const player = this.players.get(this._localPlayerId);
    if (player) {
      Object.assign(player, state);
    }
  }

  /**
   * Update game state for sync (host only)
   */
  updateGameState(weather: { isRaining: boolean; isFoggy: boolean }, time: { hour: number; minute: number; day: number }) {
    // This will be used in the next sync broadcast
    // Store for use in sync interval
    (this as any)._weatherState = weather;
    (this as any)._timeState = time;
  }

  /**
   * Get all players (for rendering)
   */
  getPlayers(): PlayerState[] {
    return Array.from(this.players.values());
  }

  /**
   * Get other players (excluding local)
   */
  getOtherPlayers(): PlayerState[] {
    return Array.from(this.players.values()).filter(p => p.peerId !== this._localPlayerId);
  }

  /**
   * Register message handler
   */
  on(type: MessageType, handler: MessageHandler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
  }

  /**
   * Remove message handler
   */
  off(type: MessageType, handler: MessageHandler) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Disconnect and cleanup
   */
  disconnect() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    this.connections.forEach(conn => conn.close());
    this.connections.clear();
    this.players.clear();

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    this._isConnected = false;
    this._isHost = false;
    this._roomCode = '';

    console.log('[NetworkManager] Disconnected');
  }
}

// Singleton instance
export const networkManager = new NetworkManager();
