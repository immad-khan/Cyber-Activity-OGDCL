-- ==============================================================================
-- CyberShield Cybersecurity Awareness Platform - Local PostgreSQL Schema
-- Compatible with PostgreSQL 14, 15, 16, 17, and 18 on Windows
-- ==============================================================================

-- STEP 1: Run this query to create the database (if not already created in pgAdmin):
-- CREATE DATABASE cybershield;
-- (Make sure you switch to the 'cybershield' database before running the code below!)

-- STEP 2: Create Users Table (Stores quiz & activity completion data)
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

-- STEP 3: Create Indexes for fast leaderboard querying and real-time reporting
CREATE INDEX IF NOT EXISTS idx_users_score ON public.users (score DESC);
CREATE INDEX IF NOT EXISTS idx_users_createdat ON public.users ("createdAt" DESC);

-- STEP 4: Create Site Settings Table (Controls Site Lock & Activity Locks)
CREATE TABLE IF NOT EXISTS public.site_settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 5: Seed default lock settings (Unlock all activities initially)
INSERT INTO public.site_settings (key, value)
VALUES 
    ('site_locked', 'false'),
    ('activity_locks', '{"activity_1":false,"activity_2":false,"activity_3":false,"activity_4":false}')
ON CONFLICT (key) DO NOTHING;

-- STEP 6: Insert a test user so you can immediately see data on the Admin Dashboard
INSERT INTO public.users (
    "userName", score, level, accuracy, "videoCompleted", 
    "videoMarks", "quizMarks", "correctAnswers", "totalQuestions", 
    activity, "completionDate"
)
VALUES (
    'Test Employee', 150, 'Guardian', 100, TRUE, 
    50, 100, 5, 5, 
    'Activity 1: The Executive Target', TO_CHAR(NOW(), 'FMMonth DD, YYYY')
);
