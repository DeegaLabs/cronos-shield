/**
 * Database Migration Script
 * 
 * Run this script to create database tables
 * 
 * Usage:
 *   pnpm run migrate
 *   or
 *   ts-node src/scripts/migrate.ts
 */

import 'dotenv/config';
import { runMigrations } from '../lib/database/migrations';
import { closePool } from '../lib/database/db';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set. Please configure it in your .env file.');
    process.exit(1);
  }

  console.log('🔄 Starting database migrations...');
  console.log(`📊 Database: ${process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@')}`);

  try {
    await runMigrations();
    console.log('✅ Migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();
