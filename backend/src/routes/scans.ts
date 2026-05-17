import express from 'express';
import { BatchService } from '../services/batch.service';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = express.Router();
const batchService = new BatchService();

// Submit batch of venues
router.post('/batch', authMiddleware, requireRole(['contributor', 'validator', 'admin']), async (req, res) => {
  try {
    const { city_id, venues, session_id } = req.body;
    const user_id = (req as any).user.id;

    if (!city_id || !venues || !Array.isArray(venues) || venues.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid city_id or venues array' });
    }

    const result = await batchService.uploadBatch({
      user_id,
      city_id,
      venues,
      session_id
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Batch upload error:', error);
    res.status(500).json({ error: 'Failed to upload batch' });
  }
});

// Get batch status
router.get('/batch/:sessionId', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const sessionIdStr = Array.isArray(sessionId) ? sessionId[0] : sessionId;
    const status = await batchService.getBatchStatus(sessionIdStr);

    if (!status) {
      return res.status(404).json({ error: 'Batch session not found' });
    }

    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch batch status' });
  }
});

// Get venues by city
router.get('/city/:cityId', async (req, res) => {
  try {
    const { cityId } = req.params;
    const { limit } = req.query;

    const cityIdStr = typeof cityId === 'string' ? cityId : (Array.isArray(cityId) ? cityId[0] : '');
    let limitVal = 100;
    if (limit) {
      const limitStr = Array.isArray(limit) ? limit[0] : (typeof limit === 'string' ? limit : undefined);
      if (limitStr) {
        limitVal = parseInt(limitStr as string);
      }
    }
    const venues = await batchService.getVenuesByCity(cityIdStr, limitVal);

    res.json(venues);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch venues' });
  }
});

export default router;
