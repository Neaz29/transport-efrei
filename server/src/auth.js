const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { pool } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const TOKEN_COOKIE = 'transport_token';

function signUser(user) {
  return jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, {
    expiresIn: '7d',
  });
}

function setAuthCookie(res, token) {
  res.cookie(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookie(res) {
  res.clearCookie(TOKEN_COOKIE);
}

function getUserFromToken(req) {
  const token = req.cookies[TOKEN_COOKIE];
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function requireAuth(req, res, next) {
  const payload = getUserFromToken(req);
  if (!payload) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.user = payload;
  return next();
}

async function registerUser({ name, email, password }) {
  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length) {
    throw new Error('EMAIL_TAKEN');
  }
  const passwordHash = bcrypt.hashSync(password, 10);
  const [insert] = await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    [name, email, passwordHash],
  );
  const [userRows] = await pool.query('SELECT id, name, email FROM users WHERE id = ?', [
    insert.insertId,
  ]);
  return userRows[0];
}

async function loginUser({ email, password }) {
  const [rows] = await pool.query(
    'SELECT id, name, email, password_hash FROM users WHERE email = ? LIMIT 1',
    [email],
  );
  const user = rows[0];
  if (!user) {
    throw new Error('INVALID_CREDENTIALS');
  }
  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) {
    throw new Error('INVALID_CREDENTIALS');
  }
  return { id: user.id, name: user.name, email: user.email };
}

module.exports = {
  TOKEN_COOKIE,
  signUser,
  requireAuth,
  setAuthCookie,
  clearAuthCookie,
  getUserFromToken,
  registerUser,
  loginUser,
};
