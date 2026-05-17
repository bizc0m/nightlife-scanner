import express from 'express';
import pool from '../db/connection';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all pending contributions (for validators)
router.get('/pending', authMiddleware, requireRole(['validator', 'admin']), async (req: AuthRequest, res) => {
  try {
    const query = `
      SELECT c.*, e.name as establishment_name, u.username as contributor_name
      FROM contributions c
      JOIN establishments e ON c.establishment_id = e.id
      JOIN users u ON c.user_id = u.id
      WHERE c.status = 'pending'
      ORDER BY c.created_at DESC
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contributions' });
  }
});

// Get contributions for an establishment
router.get('/establishment/:establishmentId', async (req, res) => {
  try {
    const { establishmentId } = req.params;

    const query = `
      SELECT c.*, u.username as contributor_name
      FROM contributions c
      JOIN users u ON c.user_id = u.id
      WHERE c.establishment_id = $1 AND c.status = 'approved'
      ORDER BY c.created_at DESC
    `;

    const result = await pool.query(query, [establishmentId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contributions' });
  }
});

// Submit a contribution (edit proposal)
router.post('/', authMiddleware, requireRole(['contributor', 'validator', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { establishment_id, contribution_type, old_value, new_value } = req.body;

    if (!establishment_id || !contribution_type || !new_value) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuidv4();
    const query = `
      INSERT INTO contributions (
        id, establishment_id, user_id, contribution_type, old_value, new_value, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING *;
    `;

    const result = await pool.query(query, [
      id,
      establishment_id,
      req.user?.id,
      contribution_type,
      old_value ? JSON.stringify(old_value) : null,
      JSON.stringify(new_value)
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create contribution' });
  }
});

// Approve contribution (validators only)
router.patch('/:contributionId/approve', authMiddleware, requireRole(['validator', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { contributionId } = req.params;
    const { notes } = req.body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get the contribution
      const contribResult = await client.query('SELECT * FROM contributions WHERE id = $1', [contributionId]);
      if (contribResult.rows.length === 0) {
        return res.status(404).json({ error: 'Contribution not found' });
      }

      const contrib = contribResult.rows[0];

      // Update contribution status
      await client.query(
        'UPDATE contributions SET status = $1, validator_id = $2, validator_notes = $3, validated_at = CURRENT_TIMESTAMP WHERE id = $4',
        ['approved', req.user?.id, notes || null, contributionId]
      );

      // Apply the change to the establishment
      if (contrib.contribution_type === 'edit') {
        const newValue = JSON.parse(contrib.new_value);
        const updateQuery = `UPDATE establishments SET ${Object.keys(newValue).map((k, i) => `${k} = $${i + 1}`).join(', ')} WHERE id = $${Object.keys(newValue).length + 1}`;
        await client.query(updateQuery, [...Object.values(newValue), contrib.establishment_id]);
      }

      await client.query('COMMIT');

      res.json({ success: true });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve contribution' });
  }
});

// Reject contribution
router.patch('/:contributionId/reject', authMiddleware, requireRole(['validator', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { contributionId } = req.params;
    const { notes } = req.body;

    const query = `
      UPDATE contributions
      SET status = 'rejected', validator_id = $1, validator_notes = $2, validated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *;
    `;

    const result = await pool.query(query, [req.user?.id, notes || null, contributionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contribution not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject contribution' });
  }
});

export default router;
