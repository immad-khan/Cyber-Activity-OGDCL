// ==============================================================================
// CyberShield Database Auto-Provisioning Script
// Automatically sets up the database schema for XAMPP (MySQL) or Supabase
// ==============================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('------------------------------------------------------------');
console.log('🛡️ CyberShield Database Auto-Provisioning Tool');
console.log('------------------------------------------------------------');

async function setupXampp() {
  console.log('\n[XAMPP / MySQL Setup] Instructions:');
  console.log('1. Ensure XAMPP Control Panel has Apache and MySQL running.');
  console.log('2. Open phpMyAdmin in your web browser: http://localhost/phpmyadmin/');
  console.log('3. Click the "SQL" tab.');
  console.log(`4. Paste the SQL statements from schema-xampp.sql and click "Go".`);
  console.log('\nOr run via command line (if mysql client is in PATH):');
  console.log(`mysql -u root -p < "${path.join(__dirname, 'schema-xampp.sql')}"\n`);
}

async function setupSupabase() {
  console.log('\n[Supabase / PostgreSQL Setup] Instructions:');
  console.log('1. Go to https://supabase.com/dashboard and log into your project.');
  console.log('2. Navigate to "SQL Editor" on the left menu.');
  console.log('3. Click "New Query".');
  console.log(`4. Paste the contents of schema-supabase.sql and click "Run".`);
}

function main() {
  const xamppPath = path.join(__dirname, 'schema-xampp.sql');
  const supabasePath = path.join(__dirname, 'schema-supabase.sql');

  if (fs.existsSync(xamppPath)) {
    console.log(`✅ XAMPP Schema File: ${xamppPath}`);
  }
  if (fs.existsSync(supabasePath)) {
    console.log(`✅ Supabase Schema File: ${supabasePath}`);
  }

  setupXampp();
  setupSupabase();
}

main();
