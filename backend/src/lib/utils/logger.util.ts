/**
 * Logger Utility
 * 
 * Centralized logging utility for sending logs to Observability service
 */

// Logger utility for consolidated backend
// In a consolidated backend, we can call the service directly

interface LogData {
  type: 'x402_payment' | 'risk_analysis' | 'transaction_blocked' | 'transaction_allowed' | 'divergence_analysis' | 'error';
  service: 'risk-oracle' | 'shielded-vault' | 'cex-dex-synergy' | 'observability';
  data: Record<string, any>;
}

/**
 * Send log to observability service
 * 
 * This is a fire-and-forget operation to avoid blocking the main flow
 */
// Singleton logger instance
let loggerInstance: any = null;

async function getLogger() {
  if (!loggerInstance) {
    const logService = await import('../../services/observability/log.service');
    const { LogService } = logService;
    loggerInstance = new LogService();
  }
  return loggerInstance;
}

export async function logEvent(logData: LogData): Promise<void> {
  try {
    const logger = await getLogger();
    logger.addLog(logData.type, logData.service, logData.data);
  } catch (error) {
    // Silently fail to avoid breaking the main flow
    console.error('Failed to log event:', error);
  }
}

/**
 * Log x402 payment event
 */
export function logPayment(service: LogData['service'], data: {
  paymentId: string;
  amount?: string;
  txHash?: string;
  reason?: string;
}): void {
  logEvent({
    type: 'x402_payment',
    service,
    data,
  });
}

/**
 * Log risk analysis event
 */
export function logRiskAnalysis(service: LogData['service'], data: {
  contract: string;
  score: number;
  proof?: string;
  verified?: boolean;
}): void {
  logEvent({
    type: 'risk_analysis',
    service,
    data,
  });
}

/**
 * Log transaction blocked event
 */
export function logTransactionBlocked(service: LogData['service'], data: {
  user?: string;
  target: string;
  contract?: string;
  score: number;
  reason: string;
}): void {
  logEvent({
    type: 'transaction_blocked',
    service,
    data,
  });
}

/**
 * Log transaction allowed event
 */
export function logTransactionAllowed(service: LogData['service'], data: {
  user?: string;
  target: string;
  contract?: string;
  score?: number;
}): void {
  logEvent({
    type: 'transaction_allowed',
    service,
    data,
  });
}

/**
 * Log divergence analysis event
 */
export function logDivergenceAnalysis(service: LogData['service'], data: {
  token: string;
  pair?: string;
  divergence: number;
  recommendation: string;
  action?: string;
}): void {
  logEvent({
    type: 'divergence_analysis',
    service,
    data,
  });
}

/**
 * Log error event
 */
export function logError(service: LogData['service'], data: {
  error: string;
  message?: string;
  context?: Record<string, any>;
}): void {
  logEvent({
    type: 'error',
    service,
    data,
  });
}
