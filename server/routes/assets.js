const express = require('express');
const pool = require('../db');

const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// GET /api/projects/:id/assets
router.get('/projects/:id/assets', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM assets WHERE project_id = $1 ORDER BY sort_order, created_at',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/projects/:id/assets
router.post('/projects/:id/assets', requireAuth, async (req, res) => {
  const { name, type, sort_order } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO assets (project_id, name, type, sort_order) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.params.id, name, type || 'digital', sort_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /api/assets/:id
router.delete('/assets/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM assets WHERE id = $1', [req.params.id]);
    res.json({ message: 'Asset deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
