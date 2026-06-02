const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');

const router = express.Router();

const ALLOWED_DOMAIN = 'capecreative.co';
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'strike-dev-secret';
const APP_URL = process.env.APP_URL || 'http://localhost:3001';

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: APP_URL + '/auth/google/callback',
}, (_at, _rt, profile, done) => {
  const email = profile.emails?.[0]?.value || '';
  if (!email.endsWith('@' + ALLOWED_DOMAIN)) {
    return done(null, false, { message: 'Unauthorized domain' });
  }
  done(null, { email, name: profile.displayName });
}));

passport.serializeUser((u, done) => done(null, u));
passport.deserializeUser((u, done) => done(null, u));

// GET /auth/google — start OAuth flow
router.get('/google', passport.authenticate('google', { scope: ['email', 'profile'] }));

// GET /auth/google/callback
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=unauthorized' }),
  (req, res) => {
    const token = jwt.sign(req.user, JWT_SECRET, { expiresIn: '30d' });
    // Redirect to frontend with token in URL; frontend stores it
    res.redirect('/?token=' + token);
  }
);

// GET /api/auth/me — validate JWT from Authorization header
router.get('/me', (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not authenticated.' });
  try {
    const user = jwt.verify(token, JWT_SECRET);
    res.json({ name: user.name, email: user.email });
  } catch {
    res.status(401).json({ error: 'Invalid token.' });
  }
});

// POST /api/auth/logout — client just drops the token; this is a no-op confirmation
router.post('/logout', (_req, res) => {
  res.json({ message: 'Logged out.' });
});

module.exports = { router, passport };
