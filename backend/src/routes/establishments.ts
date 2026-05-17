import express from 'express';
import { EstablishmentService } from '../services/establishment.service';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = express.Router();
const establishmentService = new EstablishmentService();

// Get establishments by city
router.get('/city/:cityId', async (req, res) => {
  try {
    const { cityId } = req.params;
    const { rating_min, type, validated_only } = req.query;

    const ratingMinVal = Array.isArray(rating_min) ? rating_min[0] : rating_min;
    const typeVal = Array.isArray(type) ? type[0] : type;
    const validatedVal = Array.isArray(validated_only) ? validated_only[0] : validated_only;

    const establishments = await establishmentService.getEstablishmentsByCity(cityId, {
      rating_min: ratingMinVal ? parseFloat(ratingMinVal as string) : undefined,
      type: typeVal as string | undefined,
      validated_only: validatedVal === 'true'
    });

    res.json(establishments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch establishments' });
  }
});

// Get establishment by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const establishment = await establishmentService.getEstablishmentById(id);

    if (!establishment) {
      return res.status(404).json({ error: 'Establishment not found' });
    }

    res.json(establishment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch establishment' });
  }
});

// Get nearby establishments
router.get('/nearby/:latitude/:longitude', async (req, res) => {
  try {
    const { latitude, longitude } = req.params;
    const { radius } = req.query;

    const radiusStr = Array.isArray(radius) ? radius[0] : (typeof radius === 'string' ? radius : undefined);
    const establishments = await establishmentService.getNearbyEstablishments(
      parseFloat(latitude),
      parseFloat(longitude),
      radiusStr ? parseInt(radiusStr as string) : 5
    );

    res.json(establishments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch nearby establishments' });
  }
});

// Create establishment (contributors)
router.post('/', authMiddleware, requireRole(['contributor', 'validator', 'admin']), async (req, res) => {
  try {
    const establishment = await establishmentService.createEstablishment(req.body);
    res.status(201).json(establishment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create establishment' });
  }
});

// Update establishment
router.patch('/:id', authMiddleware, requireRole(['contributor', 'validator', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const idStr = Array.isArray(id) ? id[0] : id;
    const updated = await establishmentService.updateEstablishment(idStr, req.body);

    if (!updated) {
      return res.status(404).json({ error: 'Establishment not found' });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update establishment' });
  }
});

// Delete establishment (admin only)
router.delete('/:id', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const idStr = Array.isArray(id) ? id[0] : id;
    const deleted = await establishmentService.deleteEstablishment(idStr);

    if (!deleted) {
      return res.status(404).json({ error: 'Establishment not found' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete establishment' });
  }
});

export default router;
