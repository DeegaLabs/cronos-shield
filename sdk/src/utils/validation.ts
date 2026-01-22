/**
 * Input validation utilities
 */

export function validateAddress(address: string): void {
  if (!address || typeof address !== 'string') {
    throw new Error('Address is required');
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error('Invalid address format');
  }
}

export function validateTokenPair(pair: string): void {
  if (!pair || typeof pair !== 'string') {
    throw new Error('Token pair is required');
  }
  if (!/^[A-Z0-9]+-[A-Z0-9]+$/.test(pair)) {
    throw new Error('Invalid token pair format. Must be like ETH-USDT');
  }
}
