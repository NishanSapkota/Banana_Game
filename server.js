/**
 * ====================================================================
 * CIS046-3 Software For Enterprise - Assignment 1
 * BANANA GAME APPLICATION
 *
 * Core Themes Demonstrated:
 *  1. Version Control: Modular component architecture and separation of concerns.
 *  2. Event-Driven Programming: Asynchronous event handling for client requests and game state.
 *  3. Interoperability: Marc Conrad Banana REST API integration + MySQL Database connectivity.
 *  4. Virtual Identity: Secure user authentication, password hashing, and session management.
 * ====================================================================
 */

require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');
const { isDbConnected } = require('./config/db');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;

// Body Parsers & Cookie Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Stateful Session Management for Virtual Identity
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'banana_game_super_secret_key_123',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // Prevents client-side XSS access to session cookie
      secure: false,  // Set true if running under HTTPS
      maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
  })
);

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);

// System Health & Diagnostics endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    databaseConnected: isDbConnected(),
    databaseName: process.env.DB_NAME || 'bananagame2',
    themesCovered: [
      'Version Control (Git & Modular Architecture)',
      'Event-Driven Programming (DOM & Async Handlers)',
      'Interoperability (Banana REST API & MySQL)',
      'Virtual Identity (Bcrypt & Session Authentication)'
    ]
  });
});

// Fallback to index.html for SPA behavior
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server with dynamic fallback if port is in use
function startServer(portToTry) {
  const server = app.listen(portToTry, () => {
    console.log('====================================================');
    console.log(` Banana Game Server running at: http://localhost:${portToTry}`);
    console.log(` Database: ${process.env.DB_NAME || 'bananagame2'}`);
    console.log(' Press Ctrl+C to stop the server.');
    console.log('====================================================');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = parseInt(portToTry, 10) + 1;
      console.warn(`[Server Notice] Port ${portToTry} is in use, attempting port ${nextPort}...`);
      startServer(nextPort);
    } else {
      console.error('[Server Error]', err);
    }
  });
}

startServer(PORT);

