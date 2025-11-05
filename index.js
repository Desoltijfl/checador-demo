const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'demo_secret_change_me';

// In-memory storage (demo)
const users = []; // { id, email, passwordHash, name }
const checks = []; // { id, userId, type: 'IN'|'OUT', timestamp, device, location }

let userIdCounter = 1;
let checkIdCounter = 1;

app.use(morgan('dev'));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helpers
function generateToken(user) {
  return jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '8h' });
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing Authorization header' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Malformed Authorization header' });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = users.find(u => u.id === payload.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// API

// Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const existing = users.find(u => u.email === email.toLowerCase());
  if (existing) return res.status(409).json({ error: 'Email already in use' });
  const hash = await bcrypt.hash(password, 8);
  const user = { id: userIdCounter++, email: email.toLowerCase(), passwordHash: hash, name: name || '' };
  users.push(user);
  return res.json({ id: user.id, email: user.email, name: user.name });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const user = users.find(u => u.email === email.toLowerCase());
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = generateToken(user);
  return res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

// Checkin
app.post('/api/checkin', authMiddleware, (req, res) => {
  const { type, device, location } = req.body;
  if (!type || !['IN', 'OUT'].includes(type)) return res.status(400).json({ error: 'type must be IN or OUT' });
  const check = {
    id: checkIdCounter++,
    userId: req.user.id,
    type,
    timestamp: new Date().toISOString(),
    device: device || req.headers['user-agent'] || 'unknown',
    location: location || null
  };
  checks.push(check);
  return res.json(check);
});

// Get checks for current user (optionally ?from=&to= ISO)
app.get('/api/checks', authMiddleware, (req, res) => {
  const { from, to } = req.query;
  let userChecks = checks.filter(c => c.userId === req.user.id);
  if (from) {
    const fromD = new Date(from);
    userChecks = userChecks.filter(c => new Date(c.timestamp) >= fromD);
  }
  if (to) {
    const toD = new Date(to);
    userChecks = userChecks.filter(c => new Date(c.timestamp) <= toD);
  }
  // newest first
  userChecks.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return res.json(userChecks);
});

// Simple seed endpoint for demo (creates a test user)
// GET /seed -> returns { email, password } for quick login
app.get('/seed', async (req, res) => {
  // create a user only once
  let user = users.find(u => u.email === 'demo@empresa.test');
  if (!user) {
    const password = 'demo1234';
    const hash = await bcrypt.hash(password, 8);
    user = { id: userIdCounter++, email: 'demo@empresa.test', passwordHash: hash, name: 'Usuario Demo' };
    users.push(user);
    return res.json({ email: user.email, password });
  } else {
    return res.json({ email: user.email, note: 'ya existe' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Demo backend running on http://localhost:${PORT}`);
  console.log(`Seed user: GET http://localhost:${PORT}/seed`);
});
