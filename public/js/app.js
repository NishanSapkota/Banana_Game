/**
 * ====================================================================
 * THEME: EVENT-DRIVEN PROGRAMMING & CLIENT-SIDE INTEROPERABILITY
 * File: public/js/app.js
 * Description:
 *   Handles DOM events, asynchronous HTTP fetch requests to the server,
 *   state updates, and rendering for the Banana Puzzle Game.
 * ====================================================================
 */

// Application State
let currentUser = null;
let currentScore = 0;
let currentRounds = 0;
let currentBalloons = 3;

// DOM Elements - Alerts & Forms
const alertBox = document.getElementById('alert-box');
const authSection = document.getElementById('auth-section');
const gameSection = document.getElementById('game-section');

const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

// DOM Elements - Game Board
const playerUsernameEl = document.getElementById('player-username');
const playerScoreEl = document.getElementById('player-score');
const playerRoundsEl = document.getElementById('player-rounds');
const balloonsDisplay = document.getElementById('balloons-display');
const btnLogout = document.getElementById('btn-logout');
const btnReset = document.getElementById('btn-reset');

const puzzleImage = document.getElementById('puzzle-image');
const imageLoading = document.getElementById('image-loading');
const feedbackBox = document.getElementById('feedback-box');
const gameOverBox = document.getElementById('game-over-box');
const gameOverScore = document.getElementById('game-over-score');
const gameOverRounds = document.getElementById('game-over-rounds');
const btnPlayAgain = document.getElementById('btn-play-again');

const controlsArea = document.getElementById('controls-area');
const digitButtons = document.querySelectorAll('.btn-digit');
const manualGuessInput = document.getElementById('manual-guess');
const btnSubmitManual = document.getElementById('btn-submit-manual');
const btnNextQuestion = document.getElementById('btn-next-question');

// DOM Elements - Data Tabs
const tabLeaderboard = document.getElementById('tab-leaderboard');
const tabHistory = document.getElementById('tab-history');
const tabThemes = document.getElementById('tab-themes');

const panelLeaderboard = document.getElementById('panel-leaderboard');
const panelHistory = document.getElementById('panel-history');
const panelThemes = document.getElementById('panel-themes');

const leaderboardBody = document.getElementById('leaderboard-body');
const historyTable = document.getElementById('history-table');
const historyBody = document.getElementById('history-body');
const historyLoginWarning = document.getElementById('history-login-warning');

// ====================================================================
// EVENT: INITIALIZATION (DOMContentLoaded Event)
// ====================================================================
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  checkAuthStatus();
  loadLeaderboard();
});

// ====================================================================
// EVENT LISTENERS REGISTRATION (Event-Driven Architecture)
// ====================================================================
function setupEventListeners() {
  // Auth Tab Toggles
  tabLogin.addEventListener('click', () => switchAuthTab('login'));
  tabRegister.addEventListener('click', () => switchAuthTab('register'));

  // Auth Form Submit Events
  loginForm.addEventListener('submit', handleLoginEvent);
  registerForm.addEventListener('submit', handleRegisterEvent);

  // Player Logout & Reset Events
  btnLogout.addEventListener('click', handleLogoutEvent);
  btnReset.addEventListener('click', handleResetEvent);
  btnPlayAgain.addEventListener('click', handleResetEvent);

  // Digit Button Click Events (0 through 9)
  digitButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const digit = e.target.getAttribute('data-digit');
      submitAnswerEvent(digit);
    });
  });

  // Manual Input Submit Event
  btnSubmitManual.addEventListener('click', () => {
    const value = manualGuessInput.value.trim();
    if (value === '' || isNaN(value)) {
      showAlert('Please enter a valid digit between 0 and 9.', 'error');
      return;
    }
    submitAnswerEvent(value);
  });

  // Next Question Button Click Event
  btnNextQuestion.addEventListener('click', () => {
    loadNewQuestion();
  });

  // Sub-tabs Click Events
  tabLeaderboard.addEventListener('click', () => switchSubTab('leaderboard'));
  tabHistory.addEventListener('click', () => switchSubTab('history'));
  tabThemes.addEventListener('click', () => switchSubTab('themes'));

  // Keyboard shortcut listener (Event-Driven)
  window.addEventListener('keydown', (e) => {
    // Only capture digits when game section is active and controls are visible
    if (!gameSection.classList.contains('hidden') && !controlsArea.classList.contains('hidden')) {
      if (e.key >= '0' && e.key <= '9') {
        submitAnswerEvent(e.key);
      }
    }
  });
}

// ====================================================================
// UI HELPER FUNCTIONS
// ====================================================================
function showAlert(message, type = 'info') {
  alertBox.textContent = message;
  alertBox.className = `alert-box alert-${type}`;
  alertBox.classList.remove('hidden');

  setTimeout(() => {
    alertBox.classList.add('hidden');
  }, 5000);
}

function switchAuthTab(tab) {
  if (tab === 'login') {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
  } else {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  }
}

function switchSubTab(tab) {
  [tabLeaderboard, tabHistory, tabThemes].forEach(t => t.classList.remove('active'));
  [panelLeaderboard, panelHistory, panelThemes].forEach(p => p.classList.add('hidden'));

  if (tab === 'leaderboard') {
    tabLeaderboard.classList.add('active');
    panelLeaderboard.classList.remove('hidden');
    loadLeaderboard();
  } else if (tab === 'history') {
    tabHistory.classList.add('active');
    panelHistory.classList.remove('hidden');
    loadHistory();
  } else if (tab === 'themes') {
    tabThemes.classList.add('active');
    panelThemes.classList.remove('hidden');
  }
}

function renderBalloons(count) {
  currentBalloons = (count !== undefined) ? count : 3;
  let balloonsHtml = '';
  for (let i = 0; i < 3; i++) {
    if (i < currentBalloons) {
      balloonsHtml += '🎈 ';
    } else {
      balloonsHtml += '💥 ';
    }
  }
  balloonsDisplay.textContent = balloonsHtml.trim();
}

function triggerGameOver(score, rounds) {
  controlsArea.classList.add('hidden');
  btnNextQuestion.classList.add('hidden');
  puzzleImage.style.display = 'none';
  imageLoading.classList.add('hidden');
  renderBalloons(0);

  gameOverScore.textContent = score;
  gameOverRounds.textContent = rounds;
  gameOverBox.classList.remove('hidden');
}

function updateGameStateUI(username, score, rounds) {
  playerUsernameEl.textContent = username;
  playerScoreEl.textContent = score;
  playerRoundsEl.textContent = rounds;
}

// ====================================================================
// THEME: VIRTUAL IDENTITY & AUTHENTICATION HANDLERS
// ====================================================================
async function checkAuthStatus() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();

    if (data.authenticated) {
      currentUser = data.user;
      currentScore = data.user.score || 0;
      showGameView();
      loadNewQuestion();
    } else {
      showAuthView();
    }
  } catch (err) {
    console.error('Auth status check error:', err);
    showAuthView();
  }
}

async function handleLoginEvent(e) {
  e.preventDefault();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showAlert(data.error || 'Login failed.', 'error');
      return;
    }

    currentUser = data.user;
    showAlert(`Welcome back, ${currentUser.username}!`, 'success');
    loginForm.reset();
    showGameView();
    loadNewQuestion();
    loadLeaderboard();
  } catch (err) {
    showAlert('Server communication error during login.', 'error');
  }
}

async function handleRegisterEvent(e) {
  e.preventDefault();
  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value;

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showAlert(data.error || 'Registration failed.', 'error');
      return;
    }

    currentUser = data.user;
    showAlert('Registration successful! Virtual identity created.', 'success');
    registerForm.reset();
    showGameView();
    loadNewQuestion();
    loadLeaderboard();
  } catch (err) {
    showAlert('Server communication error during registration.', 'error');
  }
}

async function handleLogoutEvent() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    currentUser = null;
    currentScore = 0;
    currentRounds = 0;
    showAlert('You have been logged out.', 'info');
    showAuthView();
  } catch (err) {
    showAlert('Error logging out.', 'error');
  }
}

function showAuthView() {
  authSection.classList.remove('hidden');
  gameSection.classList.add('hidden');
  historyLoginWarning.classList.remove('hidden');
  historyTable.classList.add('hidden');
}

function showGameView() {
  authSection.classList.add('hidden');
  gameSection.classList.remove('hidden');
  updateGameStateUI(currentUser.username, currentScore, currentRounds);
  historyLoginWarning.classList.add('hidden');
  historyTable.classList.remove('hidden');
}

// ====================================================================
// THEME: EVENT-DRIVEN QUESTION LOADING & ANSWER SUBMISSION
// ====================================================================
async function loadNewQuestion() {
  feedbackBox.classList.add('hidden');
  btnNextQuestion.classList.add('hidden');
  gameOverBox.classList.add('hidden');
  controlsArea.classList.remove('hidden');
  manualGuessInput.value = '';

  puzzleImage.style.display = 'none';
  imageLoading.classList.remove('hidden');

  try {
    const res = await fetch('/api/game/question');
    const data = await res.json();

    if (!res.ok) {
      showAlert(data.error || 'Failed to load puzzle.', 'error');
      imageLoading.textContent = 'Failed to load puzzle from Banana API.';
      return;
    }

    if (data.gameOver) {
      triggerGameOver(data.score, data.roundsPlayed);
      return;
    }

    // Set Image src from external Banana API (Interoperability)
    puzzleImage.onload = () => {
      imageLoading.classList.add('hidden');
      puzzleImage.style.display = 'block';
    };
    puzzleImage.onerror = () => {
      imageLoading.textContent = 'Error displaying image from Banana API.';
    };

    puzzleImage.src = data.question;
    currentScore = data.score;
    currentRounds = data.roundsPlayed;
    renderBalloons(data.balloons);
    updateGameStateUI(currentUser.username, currentScore, currentRounds);
  } catch (err) {
    imageLoading.textContent = 'Connection error loading puzzle.';
  }
}

async function submitAnswerEvent(digit) {
  // Disable buttons while submitting
  digitButtons.forEach(b => b.disabled = true);
  btnSubmitManual.disabled = true;

  try {
    const res = await fetch('/api/game/guess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guess: digit })
    });

    const data = await res.json();

    if (!res.ok) {
      showAlert(data.error || 'Could not verify guess.', 'error');
      digitButtons.forEach(b => b.disabled = false);
      btnSubmitManual.disabled = false;
      return;
    }

    // Update state
    currentScore = data.newScore;
    currentRounds = data.roundsPlayed;
    updateGameStateUI(currentUser.username, currentScore, currentRounds);
    renderBalloons(data.balloons);

    // Display feedback
    feedbackBox.textContent = data.message;
    feedbackBox.className = `feedback-box ${data.isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`;
    feedbackBox.classList.remove('hidden');

    // Hide input controls
    controlsArea.classList.add('hidden');

    if (data.gameOver) {
      // 3 wrong answers - Game Over event!
      btnNextQuestion.classList.add('hidden');
      triggerGameOver(currentScore, currentRounds);
    } else {
      // Show "Next Puzzle" button
      btnNextQuestion.classList.remove('hidden');
    }

    // Refresh leaderboard in background
    loadLeaderboard();
  } catch (err) {
    showAlert('Error submitting guess to server.', 'error');
  } finally {
    digitButtons.forEach(b => b.disabled = false);
    btnSubmitManual.disabled = false;
  }
}

async function handleResetEvent() {
  try {
    const res = await fetch('/api/game/reset', { method: 'POST' });
    const data = await res.json();
    currentScore = data.score;
    currentRounds = data.roundsPlayed;
    renderBalloons(data.balloons || 3);
    gameOverBox.classList.add('hidden');
    updateGameStateUI(currentUser.username, currentScore, currentRounds);
    showAlert('Game restarted with 3 balloons!', 'info');
    loadNewQuestion();
  } catch (err) {
    showAlert('Error restarting game.', 'error');
  }
}

// ====================================================================
// LEADERBOARD & HISTORY DATA FETCHING (Interoperability with MySQL)
// ====================================================================
async function loadLeaderboard() {
  try {
    const res = await fetch('/api/game/leaderboard');
    const data = await res.json();

    if (!data.leaderboard || data.leaderboard.length === 0) {
      leaderboardBody.innerHTML = '<tr><td colspan="4">No scores recorded yet. Be the first!</td></tr>';
      return;
    }

    let rowsHtml = '';
    data.leaderboard.forEach((item, index) => {
      const isCurrent = currentUser && currentUser.username === item.username;
      rowsHtml += `
        <tr style="${isCurrent ? 'background-color: #fffbe6; font-weight: bold;' : ''}">
          <td>#${index + 1}</td>
          <td>${escapeHtml(item.username)} ${isCurrent ? '(You)' : ''}</td>
          <td>${item.high_score}</td>
          <td>${item.rounds}</td>
        </tr>
      `;
    });

    leaderboardBody.innerHTML = rowsHtml;
  } catch (err) {
    leaderboardBody.innerHTML = '<tr><td colspan="4">Error loading leaderboard.</td></tr>';
  }
}

async function loadHistory() {
  if (!currentUser) return;

  try {
    const res = await fetch('/api/game/history');
    const data = await res.json();

    if (!data.history || data.history.length === 0) {
      historyBody.innerHTML = '<tr><td colspan="4">No rounds played yet in this session.</td></tr>';
      return;
    }

    let rowsHtml = '';
    data.history.forEach((round) => {
      const dateStr = new Date(round.created_at).toLocaleTimeString();
      const statusText = round.is_correct ? '✅ Correct' : '❌ Wrong';
      rowsHtml += `
        <tr>
          <td>${dateStr}</td>
          <td><strong>${round.user_answer}</strong></td>
          <td>${round.correct_answer}</td>
          <td>${statusText}</td>
        </tr>
      `;
    });

    historyBody.innerHTML = rowsHtml;
  } catch (err) {
    historyBody.innerHTML = '<tr><td colspan="4">Error loading round history.</td></tr>';
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
