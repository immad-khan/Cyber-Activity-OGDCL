

-- Create Database
CREATE DATABASE IF NOT EXISTS `cybershield` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Switch to CyberShield Database
USE `cybershield`;

CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `userName` VARCHAR(255) NOT NULL,
    `score` INT DEFAULT 0,
    `level` VARCHAR(50) DEFAULT 'Beginner',
    `accuracy` INT DEFAULT 0,
    `videoCompleted` TINYINT(1) DEFAULT 0,
    `videoMarks` INT DEFAULT 0,
    `quizMarks` INT DEFAULT 0,
    `correctAnswers` INT DEFAULT 0,
    `totalQuestions` INT DEFAULT 0,
    `activity` VARCHAR(255) DEFAULT 'Cybersecurity Awareness',
    `completionDate` VARCHAR(100) DEFAULT NULL,
    `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (`userName`, `score`, `level`, `accuracy`, `videoCompleted`, `videoMarks`, `quizMarks`, `correctAnswers`, `totalQuestions`, `activity`, `completionDate`) 
VALUES ('Demo User', 150, 'Guardian', 100, 1, 50, 100, 5, 5, 'Activity 1: The Executive Target', DATE_FORMAT(NOW(), '%c/%e/%Y'));
