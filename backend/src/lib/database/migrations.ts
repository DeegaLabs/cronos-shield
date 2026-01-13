/**
 * Database Migrations
 * 
 * Creates tables for Observability logs and metrics
 */

import { query } from './db';

export async function runMigrations(): Promise<void> {
  console.log('🔄 Running database migrations...');

  try {
    // Create logs table
    await query(`
      CREATE TABLE IF NOT EXISTS logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        timestamp BIGINT NOT NULL,
        type VARCHAR(50) NOT NULL,
        service VARCHAR(50) NOT NULL,
        data JSONB NOT NULL,
        human_readable TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for performance
    await query(`
      CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp DESC)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_logs_type ON logs(type)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_logs_service ON logs(service)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_logs_type_service ON logs(type, service)
    `);

    // Create blocked_transactions table
    await query(`
      CREATE TABLE IF NOT EXISTS blocked_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        timestamp BIGINT NOT NULL,
        user_address VARCHAR(42) NOT NULL,
        target VARCHAR(42) NOT NULL,
        risk_score INTEGER NOT NULL,
        reason TEXT NOT NULL,
        service VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_blocked_tx_timestamp ON blocked_transactions(timestamp DESC)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_blocked_tx_service ON blocked_transactions(service)
    `);

    console.log('✅ Database migrations completed');
  } catch (error: any) {
    if (error.code === '42P07') {
      // Table already exists, that's fine
      console.log('ℹ️  Tables already exist, skipping migration');
    } else {
      console.error('❌ Migration error:', error);
      throw error;
    }
  }
}
