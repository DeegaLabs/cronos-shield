/**
 * Error handling utilities
 */

export class CronosShieldError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'CronosShieldError';
  }
}

export class PaymentRequiredError extends CronosShieldError {
  constructor(
    message: string,
    public challenge?: any
  ) {
    super(message, 'PAYMENT_REQUIRED', 402);
    this.name = 'PaymentRequiredError';
  }
}

export class NetworkError extends CronosShieldError {
  constructor(message: string) {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}
