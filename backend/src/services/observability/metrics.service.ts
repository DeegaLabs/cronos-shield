/**
 * Metrics Service
 */

import { store } from '../../lib/storage/in-memory.store';
import { PostgresStore } from '../../lib/storage/postgres.store';
import type { Metrics } from '../../types/observability.types';

// Use PostgreSQL if DATABASE_URL is set, otherwise fallback to in-memory
const usePostgres = !!process.env.DATABASE_URL;
const postgresStore = usePostgres ? new PostgresStore() : null;

export class MetricsService {
  async getMetrics(): Promise<Metrics> {
    if (usePostgres && postgresStore) {
      return await postgresStore.getMetrics();
    }
    return store.getMetrics();
  }
}
