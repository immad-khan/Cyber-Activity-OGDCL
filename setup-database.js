// ==============================================================================
// CyberShield Database Auto-Provisioning Script for Local & Cloud PostgreSQL
// Run: npm run db:setup  (or: node setup-database.js)
// ==============================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './api/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('============================================================');
console.log('🛡️ CyberShield Local Database Setup Tool');
console.log('============================================================\n');

async function runSetup() {
  try {
    console.log('⏳ Connecting to database...');
    const connCheck = await pool.query('SELECT current_database(), current_user, version()');
    const { current_database, current_user, version } = connCheck.rows[0];
    console.log(`✅ Connected successfully!`);
    console.log(`   Database : ${current_database}`);
    console.log(`   User     : ${current_user}`);
    console.log(`   Version  : ${version.split(' on ')[0]}\n`);

    console.log('⏳ Creating tables and indexes...');

    // 1. Users Table
    await pool.query(`
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
    `);
    console.log('   ✅ Table "public.users" created/verified.');

    // 2. Indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_score ON public.users (score DESC);
      CREATE INDEX IF NOT EXISTS idx_users_createdat ON public.users ("createdAt" DESC);
    `);
    console.log('   ✅ Indexes "idx_users_score" & "idx_users_createdat" ready.');

    // 3. Site Settings Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.site_settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('   ✅ Table "public.site_settings" created/verified.');

    // 4. Default Settings Seed
    await pool.query(`
      INSERT INTO public.site_settings (key, value)
      VALUES 
        ('site_locked', 'false'),
        ('activity_locks', '{"activity_1":false,"activity_2":false,"activity_3":false,"activity_4":false}')
      ON CONFLICT (key) DO NOTHING;
    `);
    console.log('   ✅ Default settings seeded (All activities unlocked).');

    // 5. Test Demo Row Check
    const userCountRes = await pool.query('SELECT COUNT(*) as count FROM public.users');
    const userCount = parseInt(userCountRes.rows[0].count, 10);
    if (userCount === 0) {
      await pool.query(`
        INSERT INTO public.users (
          "userName", score, level, accuracy, "videoCompleted", 
          "videoMarks", "quizMarks", "correctAnswers", "totalQuestions", 
          activity, "completionDate"
        )
        VALUES (
          'Demo Employee', 150, 'Guardian', 100, TRUE, 
          50, 100, 5, 5, 
          'Activity 1: The Executive Target', TO_CHAR(NOW(), 'FMMonth DD, YYYY')
        );
      `);
      console.log('   ✅ Seeded sample employee record for Admin Dashboard preview.');
    } else {
      console.log(`   ℹ️ Users table already contains ${userCount} existing record(s).`);
    }

    console.log('\n============================================================');
    console.log('🎉 Database setup completed successfully!');
    console.log('You can now launch the platform with:');
    console.log('   start-server.bat   (or: npm start)');
    console.log('============================================================\n');

  } catch (err) {
    console.error('\n❌ Database setup error:', err.message);
    console.error('\n💡 Troubleshooting Tips:');
    console.error('1. Did you create the "cybershield" database in pgAdmin or psql?');
    console.error('   Query: CREATE DATABASE cybershield;');
    console.error('2. Check your password in .env file (DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/cybershield)');
    console.error('3. Make sure the "postgresql-x64-..." Windows Service is running in services.msc.\n');
  } finally {
    await pool.end();
  }
}

runSetup();
