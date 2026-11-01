-- ====================================================================
-- BANANA GAME 2 - MySQL Database Schema
-- CIS046-3 Software For Enterprise
-- Database Name: bananagame2
-- ====================================================================

-- 1. Create the Database if it doesn't already exist
CREATE DATABASE IF NOT EXISTS `bananagame2`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `bananagame2`;

-- ====================================================================
-- Table 1: users
-- Represents the Virtual Identity of players.
-- Stores login credentials with salted cryptographic password hash (bcrypt).
-- ====================================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- Table 2: game_scores
-- Stores high scores and completed game summaries for leaderboard and statistics.
-- Foreign key references users(id) to maintain referential integrity.
-- ====================================================================
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

-- ====================================================================
-- Table 3: game_rounds
-- Detailed audit log for individual rounds played by users.
-- Stores external Banana API puzzle image URLs, user answers, and solutions.
-- Demonstrates Interoperability history and event verification.
-- ====================================================================
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

-- ====================================================================
-- Helpful Indexes for Fast Leaderboard and History Lookups
-- ====================================================================
CREATE INDEX IF NOT EXISTS `idx_scores_user` ON `game_scores` (`user_id`);
CREATE INDEX IF NOT EXISTS `idx_scores_score` ON `game_scores` (`score` DESC);
CREATE INDEX IF NOT EXISTS `idx_rounds_user` ON `game_rounds` (`user_id`);

-- ====================================================================
-- Sample Seed Data (Optional Test User)
-- Username: player1
-- Password: password123 (hashed with bcrypt)
-- ====================================================================
INSERT INTO `users` (`id`, `username`, `password_hash`)
VALUES (
  1,
  'player1',
  '$2a$10$w3U0KkXQ/a0o5R4R3qg.Z.H3iP.pE9WJ7QGZJk0g1n6G3hM.6nN1u' -- password123
)
ON DUPLICATE KEY UPDATE `username`=`username`;

INSERT INTO `game_scores` (`user_id`, `score`, `rounds_completed`)
VALUES (1, 50, 5)
ON DUPLICATE KEY UPDATE `score`=`score`;
