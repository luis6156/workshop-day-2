import { Router, Request, Response } from 'express';
import { notificationService } from '../services/notification.service';
import { redisService } from '../services/redis.service';
import { logger } from '../utils/logger';

const router = Router();

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    redis: redisService.isReady() ? 'connected' : 'disconnected',
  };
  
  res.json(health);
});

// Get notifications (with Redis caching)
router.get('/notifications', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const notifications = await notificationService.getNotifications(limit);
    
    res.json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
    });
  }
});

// Create notification
router.post('/notifications', async (req: Request, res: Response) => {
  try {
    const { message, type, metadata } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    const notification = await notificationService.createNotification(
      message,
      type || 'info',
      metadata
    );

    res.status(201).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    logger.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create notification',
    });
  }
});

// Clear notifications cache
router.delete('/notifications', async (req: Request, res: Response) => {
  try {
    await notificationService.clearNotifications();
    
    res.json({
      success: true,
      message: 'Notifications cache cleared',
    });
  } catch (error) {
    logger.error('Error clearing notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear notifications',
    });
  }
});

// SSE endpoint for notifications
router.get('/sse/notifications', (req: Request, res: Response) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  logger.info('SSE client connected');

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE stream established' })}\n\n`);

  // Subscribe to notifications
  notificationService.subscribeToNotifications((notification) => {
    res.write(`data: ${JSON.stringify(notification)}\n\n`);
  });

  // Send periodic heartbeat
  const heartbeatInterval = setInterval(() => {
    res.write(`:heartbeat ${Date.now()}\n\n`);
  }, 30000); // Every 30 seconds

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    logger.info('SSE client disconnected');
    res.end();
  });
});

// Cache test endpoint
router.get('/cache-test', async (req: Request, res: Response) => {
  try {
    const key = 'test:counter';
    const value = await redisService.increment(key);
    
    res.json({
      success: true,
      message: 'Cache test successful',
      counter: value,
    });
  } catch (error) {
    logger.error('Cache test error:', error);
    res.status(500).json({
      success: false,
      error: 'Cache test failed',
    });
  }
});

export default router;
