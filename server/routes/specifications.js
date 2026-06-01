const express = require('express');
const pool = require('../db');

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated.' });
  next();
}

const STATUS_ORDER = ['producer_input', 'for_revision', 'for_client_revision', 'approved'];

// GET /api/assets/:id/specifications
router.get('/assets/:id/specifications', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM specifications WHERE asset_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/assets/:id/specifications
router.post('/assets/:id/specifications', requireAuth, async (req, res) => {
  const { designer, copy, width, height, format, producer_notes } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO specifications (asset_id, designer, copy, width, height, format, producer_notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.params.id, designer, copy, width, height, format, producer_notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /api/specifications/:id
router.put('/specifications/:id', requireAuth, async (req, res) => {
  const { designer, copy, width, height, format, producer_notes, designer_notes, client_notes, internal_notes } = req.body;
  try {
    const result = await pool.query(
      `UPDATE specifications SET
        designer=$1, copy=$2, width=$3, height=$4, format=$5,
        producer_notes=$6, designer_notes=$7, client_notes=$8, internal_notes=$9,
        updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [designer, copy, width, height, format, producer_notes, designer_notes, client_notes, internal_notes, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Spec not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /api/specifications/:id/status
router.put('/specifications/:id/status', requireAuth, async (req, res) => {
  const { status } = req.body;
  try {
    let newStatus = status;
    if (!status) {
      // Auto-advance
      const current = await pool.query('SELECT status FROM specifications WHERE id = $1', [req.params.id]);
      if (!current.rows[0]) return res.status(404).json({ error: 'Spec not found.' });
      const idx = STATUS_ORDER.indexOf(current.rows[0].status);
      if (idx === -1 || idx === STATUS_ORDER.length - 1) {
        return res.status(400).json({ error: 'Already at final status.' });
      }
      newStatus = STATUS_ORDER[idx + 1];
    }
    const result = await pool.query(
      'UPDATE specifications SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
      [newStatus, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
