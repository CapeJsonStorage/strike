try { require('dotenv').config(); } catch (e) {}
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const pool = require('./db');

const { router: authRoutes, passport } = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const assetRoutes = require('./routes/assets');
const specRoutes = require('./routes/specifications');
const uploadRoutes = require('./routes/uploads');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173',
  credentials: true,
}));

app.use(passport.initialize());

app.use(session({
  secret: process.env.SESSION_SECRET || 'strike-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// OAuth routes (not under /api — callback URL must match Google Console)
app.use('/auth', authRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', projectRoutes);
app.use('/api', assetRoutes);
app.use('/api', specRoutes);
app.use('/api', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Seed endpoint
app.post('/api/seed', async (req, res) => {
  const bcrypt = require('bcrypt');
  try {
    const hash = await bcrypt.hash('strike123', 10);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET password_hash = $3`,
      ['Admin User', 'admin@strike.com', hash, 'producer']
    );
    res.json({ message: 'Seed complete. Email: admin@strike.com, Password: strike123' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Initialize DB schema then start server
async function initDb() {
  const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  try {
    await pool.query(schemaSQL);
    console.log('Database schema initialized.');
  } catch (err) {
    console.error('Schema init error:', err.message);
  }
}

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`STRIKE server running on port ${PORT}`);
  });
});
