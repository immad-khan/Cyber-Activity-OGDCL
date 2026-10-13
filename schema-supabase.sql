

-- Create Users Table 
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

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop if re-running
DROP POLICY IF EXISTS "Allow public read access" ON public.users;
DROP POLICY IF EXISTS "Allow public insert access" ON public.users;

-- Policy 1: Allow anonymous public read access (for /api/get-users and Admin Panel)
CREATE POLICY "Allow public read access" ON public.users 
    FOR SELECT 
    TO anon, authenticated 
    USING (true);

-- Policy 2: Allow anonymous public insert access (for /api/save-username activity submissions)
CREATE POLICY "Allow public insert access" ON public.users 
    FOR INSERT 
    TO anon, authenticated 
    WITH CHECK (true);

-- Create Indexes for fast sorting and filtering
CREATE INDEX IF NOT EXISTS idx_users_score ON public.users (score DESC);
CREATE INDEX IF NOT EXISTS idx_users_createdat ON public.users ("createdAt" DESC);

-- Insert Sample Demo Row
INSERT INTO public.users ("userName", score, level, accuracy, "videoCompleted", "videoMarks", "quizMarks", "correctAnswers", "totalQuestions", activity, "completionDate")
VALUES ('Demo User', 150, 'Guardian', 100, TRUE, 50, 100, 5, 5, 'Activity 1: The Executive Target', TO_CHAR(NOW(), 'FMMonth DD, YYYY'));
