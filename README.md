# 🍌 Banana Puzzle Game (CIS046-3 Software For Enterprise)

An enterprise-standard, modular web application developed for **Unit CIS046-3: Software For Enterprise (Assignment 1)**.

The application integrates with **Marc Conrad's Banana REST API**, connects to a **MySQL relational database (`bananagame2`)**, features a **simple and clean user interface**, and provides clear evidence across the four core themes:
1. **Version Control**
2. **Event-Driven Programming**
3. **Interoperability**
4. **Virtual Identity**

---

## 🗄️ Database Setup Instructions (MySQL: `bananagame2`)

The database script is located at [`database.sql`](file:///c:/Users/sapko/OneDrive/Documents/Desktop/Banana%20Game%202/database.sql).

### Option A: Using phpMyAdmin (XAMPP / WAMP)
1. Open phpMyAdmin (`http://localhost/phpmyadmin`).
2. Click the **Import** tab at the top.
3. Click **Choose File** and select `database.sql` from this project folder.
4. Click **Import** (or **Go**) at the bottom.
5. The database `bananagame2` and the three tables (`users`, `game_scores`, `game_rounds`) will be created automatically!

### Option B: Using MySQL Command Line Client / Workbench
Run the following SQL commands (or execute `database.sql` directly):

```sql
CREATE DATABASE IF NOT EXISTS `bananagame2`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `bananagame2`;

-- Table 1: users (Virtual Identity & Passwords)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 2: game_scores (High Scores & Leaderboard)
CREATE TABLE IF NOT EXISTS `game_scores` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `score` INT NOT NULL DEFAULT 0,
  `rounds_completed` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_game_scores_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 3: game_rounds (Audit Trail & Interoperability Log)
CREATE TABLE IF NOT EXISTS `game_rounds` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `question_image_url` VARCHAR(255) NOT NULL,
  `user_answer` INT NOT NULL,
  `correct_answer` INT NOT NULL,
  `is_correct` TINYINT(1) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_game_rounds_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS `idx_scores_user` ON `game_scores` (`user_id`);
CREATE INDEX IF NOT EXISTS `idx_scores_score` ON `game_scores` (`score` DESC);
CREATE INDEX IF NOT EXISTS `idx_rounds_user` ON `game_rounds` (`user_id`);

-- Optional Seed User
INSERT INTO `users` (`id`, `username`, `password_hash`)
VALUES (1, 'player1', '$2a$10$w3U0KkXQ/a0o5R4R3qg.Z.H3iP.pE9WJ7QGZJk0g1n6G3hM.6nN1u')
ON DUPLICATE KEY UPDATE `username`=`username`;
```

---

## 🚀 How to Run the Application

1. Open your terminal in this project directory:
   ```bash
   cd "Banana Game 2"
   ```

2. Start the application:
   ```bash
   npm start
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

4. Log in using the test account:
   - **Username**: `player1`
   - **Password**: `password123`
   *(Or register any new account on the Register tab!)*

---

## 📁 Project Architecture & Components

```
Banana Game 2/
├── database.sql                  # Complete MySQL schema for bananagame2
├── .env                          # Local database & server configurations
├── .env.example                  # Template configuration file
├── .gitignore                    # Excludes node_modules and sensitive configs
├── package.json                  # Dependencies (express, mysql2, bcryptjs, etc.)
├── server.js                     # Main Express HTTP server & middleware entry point
├── config/
│   └── db.js                     # MySQL connection pooling & resilience layer
├── services/
│   └── bananaService.js          # REST Client consuming Marc Conrad's Banana API
├── controllers/
│   ├── authController.js         # Virtual Identity: Bcrypt hashing, sessions & login
│   └── gameController.js         # Event processing, scoring, MySQL audit logging
├── routes/
│   ├── authRoutes.js             # Authentication API routes
│   └── gameRoutes.js             # Game state API routes
└── public/                       # Simple, clean user interface
    ├── index.html                # Accessible HTML5 structure
    ├── css/
    │   └── style.css             # Lightweight, clear, clean styling
    └── js/
        └── app.js                # Client-side DOM event listeners & async fetch calls
```

---

## 🎥 10-Minute Video Presentation Guide (The 4 Themes)

Use the following outline and talking points for your 10-minute video submission:

### 1. Introduction & Demonstration (~2 minutes)
- Introduce yourself and the unit: **CIS046-3 Software For Enterprise**.
- Demonstrate the working application:
  - Register a new user and log in (demonstrating **Virtual Identity**).
  - Show the Banana math puzzle image dynamically loaded from the external API (demonstrating **Interoperability**).
  - Click digits (0–9) or press a keyboard key to submit an answer and observe instant feedback and score increment (demonstrating **Event-Driven Programming**).
  - Open the **Leaderboard** and **History** tabs to demonstrate database persistence in MySQL.

### 2. Theme 1: Version Control (~2 minutes)
- **Modularity & Separation of Concerns**: Explain how the application is decomposed into MVC components: `config/`, `services/`, `controllers/`, `routes/`, and `public/`.
- **Git Practices**:
  - Show your Git log: `git log --oneline`.
  - Explain granular commits: each commit represents a single logical unit of change (database configuration, API service, authentication, UI).
  - Discuss branching (`main`/`feature-auth`/`feature-gameplay`), tagging for releases, and `.gitignore` preventing sensitive secrets (`.env`) and bloated dependencies (`node_modules`) from polluting the repository.

### 3. Theme 2: Event-Driven Programming (~2 minutes)
- **Client-Side Events**:
  - Explain the event listeners in [`public/js/app.js`](file:///c:/Users/sapko/OneDrive/Documents/Desktop/Banana%20Game%202/public/js/app.js): `DOMContentLoaded`, form `submit`, button `click`, and `keydown` events.
  - Explain how the UI updates reactively based on user actions without reloading the page (Single-Page App behavior).
- **Server-Side Event Loop**:
  - Explain Node.js's non-blocking, single-threaded event loop.
  - Explain asynchronous `Promise` and `async/await` handling when waiting for HTTP responses from the external Banana API and queries from MySQL.

### 4. Theme 3: Interoperability (~2 minutes)
- **External Web Service Integration**:
  - Explain [`services/bananaService.js`](file:///c:/Users/sapko/OneDrive/Documents/Desktop/Banana%20Game%202/services/bananaService.js).
  - The application interoperates with Marc Conrad's external Banana API (`https://marcconrad.com/uob/banana/api.php?out=json`) using standard HTTP GET requests and parsing JSON payloads.
- **Relational Database Interoperability**:
  - Explain how the Node.js application communicates across network boundaries with the MySQL database engine (`bananagame2`) using the standard SQL wire protocol via `mysql2`.
  - Explain fault tolerance: if the remote API or MySQL is temporarily unreachable, defensive error handling and fallbacks ensure the software does not crash.

### 5. Theme 4: Virtual Identity (~2 minutes)
- **Identity Modeling & Storage**:
  - Explain the `users` table in `database.sql`.
  - Virtual identity is established through unique usernames and salted cryptographic password hashes generated with `bcrypt` (10 rounds of salting), protecting against rainbow table attacks.
- **Stateful Session Authentication**:
  - Explain HTTP cookies and server-side session management (`express-session`).
  - The session cookie is configured with `httpOnly: true` to prevent Cross-Site Scripting (XSS) attacks from stealing user credentials.
  - All game scores and audit logs in `game_scores` and `game_rounds` are securely associated with the authenticated virtual identity via foreign keys.

---

## 📚 References & External Libraries Used
- **Banana API**: Conrad, M. (2020) *Banana Game API Documentation*. Available at: https://marcconrad.com/uob/banana/doc.php
- **Bcryptjs**: Pure JavaScript implementation of bcrypt for password hashing.
- **Express.js**: Fast, unopinionated web framework for Node.js.
- **MySQL2**: MySQL client for Node.js with support for Promises and prepared statements.
