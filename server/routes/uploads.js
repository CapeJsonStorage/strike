const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db');

const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

const uploadDir = path.join(__dirname, '../uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// POST /api/specifications/:id/files
router.post('/specifications/:id/files', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  const { file_type, uploaded_by } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO spec_files (specification_id, filename, original_name, file_type, uploaded_by)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.params.id, req.file.filename, req.file.originalname, file_type || 'reference', uploaded_by || 'unknown']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/specifications/:id/files
router.get('/specifications/:id/files', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM spec_files WHERE specification_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /api/files/:id
router.delete('/files/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM spec_files WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'File not found.' });
    const filePath = path.join(uploadDir, result.rows[0].filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await pool.query('DELETE FROM spec_files WHERE id = $1', [req.params.id]);
    res.json({ message: 'File deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
