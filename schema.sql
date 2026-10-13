

CREATE DATABASE IF NOT EXISTS `cybershield` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

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


CREATE TABLE IF NOT EXISTS public.users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "userName" TEXT NOT NULL,
    score INT DEFAULT 0,
    level TEXT DEFAULT 'Beginner',
    accuracy INT DEFAULT 0,
    "videoCompleted" BOOLEAN DEFAULT FALSE,
    "videoMarks" INT DEFAULT 0,
    "quizMarks" INT DEFAULT 0,
    "correctAnswers" INT DEFAULT 0,
    "totalQuestions" INT DEFAULT 0,
    activity TEXT DEFAULT 'Cybersecurity Awareness',
    "completionDate" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and public policies for Supabase
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON public.users;
DROP POLICY IF EXISTS "Allow public insert access" ON public.users;

CREATE POLICY "Allow public read access" ON public.users FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert access" ON public.users FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_users_score ON public.users (score DESC);
CREATE INDEX IF NOT EXISTS idx_users_createdat ON public.users ("createdAt" DESC);
