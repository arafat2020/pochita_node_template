// src/core/ws/ws-driver.ts
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import { RedisClientType, createClient } from 'redis';
import { EventEmitter } from 'events';
import { logger } from '../logger';

export interface WSDriverOptions {
  server: HTTPServer;        // Shared HTTP/Express server
  useSocketIO?: boolean;     // true → Socket.IO, false → native WS
  redis?: {
    host: string;
    port: number;
    password?: string;
  };
}

export interface PubSubMessage {
  channel: string;
  room?: string;   // Optional room
  data: any;
}

export class WSDriver {
  private io?: SocketIOServer;
  private wss?: WebSocketServer;
  private pubsub: EventEmitter;
  private redisClient?: RedisClientType;
  private redisSubscriber?: RedisClientType;

  // Map for native WS room subscriptions: room -> set of ws clients
  private wsRooms: Map<string, Set<WebSocket>> = new Map();

  constructor(private options: WSDriverOptions) {
    if (!options.server) {
      throw new Error('HTTP server instance is required');
    }
    this.pubsub = new EventEmitter();
  }

  /**
   * Start WebSocket server
   */
  async start() {
    if (this.options.redis) {
      await this.initRedis(this.options.redis);
    }

    if (this.options.useSocketIO) {
      this.initSocketIO();
    } else {
      this.initNativeWS();
    }

    logger.info('WebSocket server initialized on shared HTTP server');
  }

  /**
   * Initialize Socket.IO
   */
  private initSocketIO() {
    this.io = new SocketIOServer(this.options.server, { cors: { origin: '*' } });

    this.io.on('connection', (socket) => {
      logger.info(`Socket.IO client connected: ${socket.id}`);

      // Subscribe to a room
      socket.on('subscribe', (room: string) => {
        socket.join(room);
        logger.info(`Client ${socket.id} subscribed to room: ${room}`);
      });

      // Unsubscribe from a room
      socket.on('unsubscribe', (room: string) => {
        socket.leave(room);
        logger.info(`Client ${socket.id} unsubscribed from room: ${room}`);
      });

      // Publish message
      socket.on('publish', (msg: PubSubMessage) => {
        const room = msg.room;
        if (room && this.io) {
          this.io.to(room).emit(msg.channel, msg.data);
        } else {
          this.io?.emit(msg.channel, msg.data);
        }

        if (this.redisClient) {
          this.redisClient.publish(msg.channel, JSON.stringify(msg.data));
        }
      });

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  }

  /**
   * Initialize native WebSocket
   */
  private initNativeWS() {
    this.wss = new WebSocketServer({ server: this.options.server });

    this.wss.on('connection', (ws: WebSocket) => {
      logger.info('WebSocket client connected');

      const clientRooms = new Set<string>();

      ws.on('message', (raw: WebSocket.RawData) => {
        let msg: PubSubMessage & { action?: string };
        try {
          msg = JSON.parse(raw.toString());
        } catch {
          return;
        }

        // Subscribe to a room
        if (msg.action === 'subscribe' && msg.room) {
          if (!this.wsRooms.has(msg.room)) this.wsRooms.set(msg.room, new Set());
          this.wsRooms.get(msg.room)!.add(ws);
          clientRooms.add(msg.room);
          logger.info(`Client subscribed to room: ${msg.room}`);
          return;
        }

        // Unsubscribe
        if (msg.action === 'unsubscribe' && msg.room) {
          this.wsRooms.get(msg.room)?.delete(ws);
          clientRooms.delete(msg.room);
          return;
        }

        // Publish message
        if (msg.channel) {
          const targets = msg.room ? this.wsRooms.get(msg.room) : new Set([ws]);
          targets?.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ channel: msg.channel, data: msg.data }));
            }
          });

          if (this.redisClient) {
            this.redisClient.publish(msg.channel, JSON.stringify(msg.data));
          }
        }
      });

      ws.on('close', () => {
        // Remove client from all rooms
        clientRooms.forEach((room) => this.wsRooms.get(room)?.delete(ws));
        logger.info('Client disconnected');
      });
    });
  }

  /**
   * Initialize Redis Pub/Sub
   */
  private async initRedis(config: { host: string; port: number; password?: string }) {
    this.redisClient = createClient({ socket: { host: config.host, port: config.port }, password: config.password });
    this.redisSubscriber = this.redisClient.duplicate();
    await this.redisClient.connect();
    await this.redisSubscriber.connect();

    this.redisSubscriber.on('message', (channel, message) => {
      try {
        const data = JSON.parse(message);
        this.pubsub.emit(channel, data);
      } catch {
        this.pubsub.emit(channel, message);
      }
    });
  }

  /**
   * Stop WebSocket server and close connections
   */
  async stop() {
    if (this.io) {
      this.io.close();
    }
    if (this.wss) {
      await new Promise<void>((resolve) => this.wss!.close(() => resolve()));
    }
    if (this.redisClient) {
      await this.redisClient.quit();
    }
    if (this.redisSubscriber) {
      await this.redisSubscriber.quit();
    }
  }

  /**
   * Publish to a channel, optionally to a room
   */
  publish(channel: string, data: any, room?: string) {
    if (this.io && room) this.io.to(room).emit(channel, data);
    else if (this.io) this.io.emit(channel, data);

    if (!this.options.useSocketIO) {
      let targets: Set<WebSocket> = room ? this.wsRooms.get(room) || new Set() : new Set();
      if (!room) {
        // broadcast to all clients
        this.wsRooms.forEach((clients) => clients.forEach((ws) => targets.add(ws)));
      }
      targets.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ channel, data }));
      });
    }

    this.pubsub.emit(channel, data);
    if (this.redisClient) this.redisClient.publish(channel, JSON.stringify(data));
  }

  /**
   * Broadcast to filtered clients
   */
  broadcast(channel: string, data: any, filterFn?: (client: WebSocket | any) => boolean, room?: string) {
    // Socket.IO
    if (this.io) {
      const clients = room ? this.io.sockets.adapter.rooms.get(room) : this.io.sockets.sockets;
      clients?.forEach((clientId: any) => {
        const socket = this.io?.sockets.sockets.get(clientId);
        if (!socket) return;
        if (!filterFn || filterFn(socket)) socket.emit(channel, data);
      });
    }

    // Native WS
    if (!this.options.useSocketIO) {
      let targets: Set<WebSocket> = room ? this.wsRooms.get(room) || new Set() : new Set();
      if (!room) {
        targets = new Set();
        this.wsRooms.forEach((clients) => clients.forEach((ws) => targets.add(ws)));
      }

      targets.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN && (!filterFn || filterFn(ws))) {
          ws.send(JSON.stringify({ channel, data }));
        }
      });
    }

    this.pubsub.emit(channel, data);
    if (this.redisClient) this.redisClient.publish(channel, JSON.stringify(data));
  }

  subscribe(channel: string, listener: (data: any) => void) {
    this.pubsub.on(channel, listener);
    return () => this.pubsub.off(channel, listener);
  }
}
