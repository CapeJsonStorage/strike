const express = require('express');
const pool = require('../db');

const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

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
  const { name, client, lead_producer, assistant_producer, project_overview, timeline, ros, budget, status, section, timeline_start, timeline_end, venue_name, venue_location, venue_contact } = req.body;
  try {
    const result = await pool.query(
      `UPDATE projects SET
        name=$1, client=$2, lead_producer=$3, assistant_producer=$4,
        project_overview=$5, timeline=$6, ros=$7, budget=$8,
        status=$9, section=$10,
        timeline_start=$11, timeline_end=$12,
        venue_name=$13, venue_location=$14, venue_contact=$15,
        updated_at=NOW()
       WHERE id=$16 RETURNING *`,
      [name, client, lead_producer, assistant_producer, project_overview, timeline, ros, budget, status, section, timeline_start || null, timeline_end || null, venue_name, venue_location, venue_contact, req.params.id]
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

// GET /api/projects/:id/vendors
router.get('/projects/:id/vendors', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM vendors WHERE project_id=$1 ORDER BY sort_order, created_at', [req.params.id]);
  res.json(rows);
});

// POST /api/projects/:id/vendors
router.post('/projects/:id/vendors', requireAuth, async (req, res) => {
  const { vendor_name, vendor_type, vendor_contact } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO vendors (project_id, vendor_name, vendor_type, vendor_contact) VALUES ($1,$2,$3,$4) RETURNING *',
    [req.params.id, vendor_name, vendor_type, vendor_contact]
  );
  res.status(201).json(rows[0]);
});

// PUT /api/vendors/:id
router.put('/vendors/:id', requireAuth, async (req, res) => {
  const { vendor_name, vendor_type, vendor_contact } = req.body;
  const { rows } = await pool.query(
    'UPDATE vendors SET vendor_name=$1, vendor_type=$2, vendor_contact=$3 WHERE id=$4 RETURNING *',
    [vendor_name, vendor_type, vendor_contact, req.params.id]
  );
  res.json(rows[0]);
});

// DELETE /api/vendors/:id
router.delete('/vendors/:id', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM vendors WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
