/**
 * ====================================================================
 * THEME: EVENT-DRIVEN PROGRAMMING & INTEROPERABILITY
 * File: routes/gameRoutes.js
 * ====================================================================
 */

const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

// Game events and operations
router.get('/question', gameController.getNewQuestion);
router.post('/guess', gameController.submitGuess);
router.get('/leaderboard', gameController.getLeaderboard);
router.get('/history', gameController.getUserHistory);
router.post('/reset', gameController.resetScore);

module.exports = router;
