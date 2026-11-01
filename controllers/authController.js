/**
 * ====================================================================
 * THEME: VIRTUAL IDENTITY & AUTHENTICATION
 * File: controllers/authController.js
 * Description:
 *   Manages Virtual Identity through user registration, credential validation,
 *   cryptographic password hashing (bcrypt), and stateful session management
 *   using HTTP cookies.
 * ====================================================================
 */

const bcrypt = require('bcryptjs');
const { pool, isDbConnected } = require('../config/db');

/**
 * Register a new Virtual Identity
 */
async function register(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      return res.status(400).json({ error: 'Username must be between 3 and 30 characters.' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
    }

    // Check database connectivity
    if (!isDbConnected()) {
      return res.status(503).json({
        error: 'Database not connected. Please ensure MySQL is running and bananagame2 database exists.'
      });
    }

    // Check if username already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [trimmedUsername]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Username is already taken. Please choose another.' });
    }

    // Hash the password with bcrypt (10 salt rounds) for security
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new user into MySQL
    const [result] = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [trimmedUsername, passwordHash]
    );

    const newUser = {
      id: result.insertId,
      username: trimmedUsername
    };

    // Establish virtual identity session
    req.session.user = newUser;

    return res.status(201).json({
      message: 'Registration successful! Virtual identity established.',
      user: newUser
    });
  } catch (error) {
    console.error('[Auth Register Error]:', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
}

/**
 * Log in to an existing Virtual Identity
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const trimmedUsername = username.trim();

    if (!isDbConnected()) {
      return res.status(503).json({
        error: 'Database not connected. Please ensure MySQL is running and bananagame2 database exists.'
      });
    }

    // Retrieve user record from MySQL
    const [users] = await pool.query(
      'SELECT id, username, password_hash FROM users WHERE username = ?',
      [trimmedUsername]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const user = users[0];

    // Verify hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Set user session cookie (Virtual Identity)
    req.session.user = {
      id: user.id,
      username: user.username
    };

    return res.json({
      message: 'Login successful!',
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('[Auth Login Error]:', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
}

/**
 * Log out and destroy the session
 */
function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out at this time.' });
    }
    res.clearCookie('connect.sid');
    return res.json({ message: 'Logged out successfully.' });
  });
}

/**
 * Get current authenticated user session details
 */
async function getCurrentUser(req, res) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ authenticated: false });
  }

  // Fetch latest user score from database if connected
  let currentScore = 0;
  if (isDbConnected()) {
    try {
      const [scores] = await pool.query(
        'SELECT score FROM game_scores WHERE user_id = ? ORDER BY id DESC LIMIT 1',
        [req.session.user.id]
      );
      if (scores.length > 0) {
        currentScore = scores[0].score;
      }
    } catch (e) {
      // Non-critical score fetch failure
    }
  }

  return res.json({
    authenticated: true,
    user: {
      ...req.session.user,
      score: currentScore
    }
  });
}

module.exports = {
  register,
  login,
  logout,
  getCurrentUser
};
