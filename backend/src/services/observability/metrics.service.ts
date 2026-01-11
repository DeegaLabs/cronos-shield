/**
 * Metrics Service
 */

import { store } from '../../lib/storage/in-memory.store';
import type { Metrics } from '../../types/observability.types';

export class MetricsService {
  getMetrics(): Metrics {
    return store.getMetrics();
  }
}
