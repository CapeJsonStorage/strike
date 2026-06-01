const express = require('express');
const pool = require('../db');

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated.' });
  next();
}

// GET /api/projects
router.get('/projects', requireAuth, async (req, res) => {
  const { status, section } = req.query;
  try {
    let query = 'SELECT * FROM projects WHERE 1=1';
    const params = [];
    if (status) { params.push(status); query += ` AND status = $${params.length}`; }
    if (section) { params.push(section); query += ` AND section = $${params.length}`; }
    query += ' ORDER BY updated_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/projects
router.post('/projects', requireAuth, async (req, res) => {
  const { name, client, lead_producer, assistant_producer, project_overview, timeline, ros, budget, section } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO projects (name, client, lead_producer, assistant_producer, project_overview, timeline, ros, budget, section)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [name, client, lead_producer, assistant_producer, project_overview, timeline, ros, budget, section || 'sandbox']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/projects/:id
router.get('/projects/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Project not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /api/projects/:id
router.put('/projects/:id', requireAuth, async (req, res) => {
  const { name, client, lead_producer, assistant_producer, project_overview, timeline, ros, budget, status, section } = req.body;
  try {
    const result = await pool.query(
      `UPDATE projects SET
        name=$1, client=$2, lead_producer=$3, assistant_producer=$4,
        project_overview=$5, timeline=$6, ros=$7, budget=$8,
        status=$9, section=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [name, client, lead_producer, assistant_producer, project_overview, timeline, ros, budget, status, section, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Project not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /api/projects/:id (soft delete → trash)
router.delete('/projects/:id', requireAuth, async (req, res) => {
  try {
    await pool.query(`UPDATE projects SET status='trash', updated_at=NOW() WHERE id=$1`, [req.params.id]);
    res.json({ message: 'Project moved to trash.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/projects/:id/status-summary
router.get('/projects/:id/status-summary', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.status, COUNT(*) as count
       FROM specifications s
       JOIN assets a ON s.asset_id = a.id
       WHERE a.project_id = $1
       GROUP BY s.status`,
      [req.params.id]
    );
    const summary = {};
    result.rows.forEach(r => { summary[r.status] = parseInt(r.count); });
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
