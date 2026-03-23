import type { Response } from 'express';

const HEARTBEAT_INTERVAL = 30_000; // 30 seconds

class SseConnectionManager {
  private connections = new Map<string, Set<Response>>();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startHeartbeat();
  }

  addConnection(userId: string, res: Response) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId)!.add(res);
  }

  removeConnection(userId: string, res: Response) {
    const userConnections = this.connections.get(userId);
    if (!userConnections) return;

    userConnections.delete(res);
    if (userConnections.size === 0) {
      this.connections.delete(userId);
    }
  }

  broadcastToUser(userId: string, event: string, data: unknown) {
    const userConnections = this.connections.get(userId);
    if (!userConnections) return;

    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

    for (const res of userConnections) {
      try {
        res.write(payload);
      } catch {
        userConnections.delete(res);
      }
    }
  }

  broadcastToUsers(userIds: string[], event: string, data: unknown) {
    for (const userId of userIds) {
      this.broadcastToUser(userId, event, data);
    }
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      const payload = `event: heartbeat\ndata: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`;

      for (const [userId, connections] of this.connections) {
        for (const res of connections) {
          try {
            res.write(payload);
          } catch {
            connections.delete(res);
          }
        }
        if (connections.size === 0) {
          this.connections.delete(userId);
        }
      }
    }, HEARTBEAT_INTERVAL);
  }

  getConnectionCount() {
    let count = 0;
    for (const connections of this.connections.values()) {
      count += connections.size;
    }
    return count;
  }

  destroy() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    this.connections.clear();
  }
}

export const sseManager = new SseConnectionManager();
