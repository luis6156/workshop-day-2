import { Router, Request, Response } from 'express';
import { register } from '../utils/metrics';

const router = Router();

// Prometheus metrics endpoint
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

export default router;
