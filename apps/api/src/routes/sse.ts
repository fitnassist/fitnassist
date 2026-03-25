import { Router } from 'express';
import { auth } from '../lib/auth';
import { sseManager } from '../lib/sse';

export const sseRouter = Router();

sseRouter.get('/messages', async (req, res) => {
  try {
    // Authenticate via Better Auth session
    const session = await auth.api.getSession({
      headers: new Headers(req.headers as Record<string, string>),
    });

    if (!session?.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userId = session.user.id;

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    });

    // Send initial connection event
    res.write(`event: connected\ndata: ${JSON.stringify({ userId })}\n\n`);

    // Register connection
    sseManager.addConnection(userId, res);

    // Clean up on disconnect
    req.on('close', () => {
      sseManager.removeConnection(userId, res);
    });
  } catch (error) {
    console.error('[SSE] Connection error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'SSE connection failed' });
    }
  }
});
