/**
 * ====================================================================
 * THEMES: EVENT-DRIVEN PROGRAMMING & INTEROPERABILITY
 * File: controllers/gameController.js
 * Description:
 *   Handles game state transitions, event processing for user guesses,
 *   external Banana API question retrieval, and MySQL persistence
 *   for scores and audit logs.
 * ====================================================================
 */

const { fetchBananaQuestion } = require('../services/bananaService');
const { pool, isDbConnected } = require('../config/db');

/**
 * Event: Player requests a new puzzle question
 * Interoperates with external Banana API and securely caches solution in session.
 */
async function getNewQuestion(req, res) {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Please log in to play.' });
    }

    // Call external REST API
    const puzzle = await fetchBananaQuestion();

    // Store solution securely on the server-side session to prevent cheating
    req.session.currentQuestion = {
      question: puzzle.question,
      solution: puzzle.solution,
      startedAt: Date.now()
    };

    // Initialize in-memory score for the session if not set
    if (req.session.gameScore === undefined) {
      req.session.gameScore = 0;
      req.session.roundsPlayed = 0;
    }

    // Return only the question URL to the client
    return res.json({
      question: puzzle.question,
      score: req.session.gameScore,
      roundsPlayed: req.session.roundsPlayed
    });
  } catch (error) {
    console.error('[Game Controller] Error fetching question:', error);
    return res.status(500).json({ error: 'Failed to fetch question from Banana API.' });
  }
}

/**
 * Event: Player submits a guess (Answer Event)
 * Validates the answer against the server session, updates score,
 * and persists round history into MySQL.
 */
async function submitGuess(req, res) {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Please log in to play.' });
    }

    if (!req.session.currentQuestion) {
      return res.status(400).json({ error: 'No active question found. Please request a new question.' });
    }

    const { guess } = req.body;
    const parsedGuess = parseInt(guess, 10);

    if (isNaN(parsedGuess) || parsedGuess < 0 || parsedGuess > 9) {
      return res.status(400).json({ error: 'Invalid answer. Must be a single digit between 0 and 9.' });
    }

    const { question, solution } = req.session.currentQuestion;
    const isCorrect = (parsedGuess === solution);

    // Update session game state
    req.session.roundsPlayed = (req.session.roundsPlayed || 0) + 1;
    if (isCorrect) {
      req.session.gameScore = (req.session.gameScore || 0) + 10;
    }

    const currentScore = req.session.gameScore;
    const roundsPlayed = req.session.roundsPlayed;

    // Reset current question so same question cannot be submitted twice
    req.session.currentQuestion = null;

    // Persist event to MySQL if database is active (Virtual Identity & Interoperability)
    if (isDbConnected()) {
      try {
        const userId = req.session.user.id;

        // Log round details
        await pool.query(
          `INSERT INTO game_rounds (user_id, question_image_url, user_answer, correct_answer, is_correct)
           VALUES (?, ?, ?, ?, ?)`,
          [userId, question, parsedGuess, solution, isCorrect ? 1 : 0]
        );

        // Update or insert score record
        await pool.query(
          `INSERT INTO game_scores (user_id, score, rounds_completed)
           VALUES (?, ?, ?)`,
          [userId, currentScore, roundsPlayed]
        );
      } catch (dbErr) {
        console.warn('[Game Controller] Database record write error:', dbErr.message);
      }
    }

    return res.json({
      isCorrect,
      correctAnswer: solution,
      userAnswer: parsedGuess,
      newScore: currentScore,
      roundsPlayed: roundsPlayed,
      message: isCorrect ? 'Correct! Well done! (+10 pts)' : `Incorrect! The correct answer was ${solution}.`
    });
  } catch (error) {
    console.error('[Game Controller] Error handling guess event:', error);
    return res.status(500).json({ error: 'Internal server error processing guess.' });
  }
}

/**
 * Retrieve Leaderboard rankings from MySQL
 */
async function getLeaderboard(req, res) {
  try {
    if (!isDbConnected()) {
      return res.json({
        leaderboard: [
          { username: 'player1 (Sample)', high_score: 50, rounds: 5 }
        ],
        dbActive: false
      });
    }

    const query = `
      SELECT u.username, MAX(s.score) AS high_score, MAX(s.rounds_completed) AS rounds
      FROM users u
      JOIN game_scores s ON u.id = s.user_id
      GROUP BY u.id, u.username
      ORDER BY high_score DESC
      LIMIT 10
    `;

    const [rows] = await pool.query(query);

    return res.json({
      leaderboard: rows,
      dbActive: true
    });
  } catch (error) {
    console.error('[Game Controller] Error fetching leaderboard:', error);
    return res.status(500).json({ error: 'Failed to retrieve leaderboard.' });
  }
}

/**
 * Retrieve recent game history for the logged-in user
 */
async function getUserHistory(req, res) {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    if (!isDbConnected()) {
      return res.json({ history: [], dbActive: false });
    }

    const query = `
      SELECT question_image_url, user_answer, correct_answer, is_correct, created_at
      FROM game_rounds
      WHERE user_id = ?
      ORDER BY id DESC
      LIMIT 10
    `;

    const [rows] = await pool.query(query, [req.session.user.id]);

    return res.json({
      history: rows,
      dbActive: true
    });
  } catch (error) {
    console.error('[Game Controller] Error fetching history:', error);
    return res.status(500).json({ error: 'Failed to retrieve user history.' });
  }
}

/**
 * Reset current game score
 */
function resetScore(req, res) {
  if (req.session) {
    req.session.gameScore = 0;
    req.session.roundsPlayed = 0;
    req.session.currentQuestion = null;
  }
  return res.json({ message: 'Score reset successfully.', score: 0, roundsPlayed: 0 });
}

module.exports = {
  getNewQuestion,
  submitGuess,
  getLeaderboard,
  getUserHistory,
  resetScore
};
