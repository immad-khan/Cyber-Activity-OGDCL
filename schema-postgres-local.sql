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
    email TEXT,
    "certificateId" TEXT,
    "employeeId" TEXT,
    department TEXT,
    designation TEXT,
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

-- Upgrade existing table if already created previously
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "employeeId" TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "certificateId" TEXT;
UPDATE public.users
SET "certificateId" = 'OGDCL-LEGACY-' || id::TEXT
WHERE "certificateId" IS NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS designation TEXT;

-- STEP 3: Create Indexes for fast leaderboard querying and real-time reporting
CREATE INDEX IF NOT EXISTS idx_users_score ON public.users (score DESC);
CREATE INDEX IF NOT EXISTS idx_users_createdat ON public.users ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_users_empid ON public.users ("employeeId");
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_certificate_id ON public.users ("certificateId") WHERE "certificateId" IS NOT NULL;

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

-- STEP 6: Insert sample user for preview
INSERT INTO public.users (
    "userName", "employeeId", department, designation, 
    score, level, accuracy, "videoCompleted", 
    "videoMarks", "quizMarks", "correctAnswers", "totalQuestions", 
    activity, "completionDate"
)
VALUES (
    'Test Employee', 'OGDCL-1024', 'Information Technology', 'Security Specialist',
    150, 'Guardian', 100, TRUE, 
    50, 100, 5, 5, 
    'Activity 1: The Executive Target', TO_CHAR(NOW(), 'FMMonth DD, YYYY')
);
