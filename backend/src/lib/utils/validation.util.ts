/**
 * Validation Utilities
 * 
 * Centralized validation functions for inputs
 */

import { ethers } from 'ethers';

/**
 * Validates Ethereum address format
 */
export function isValidAddress(address: string): boolean {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
}

/**
 * Validates Ethereum address and throws if invalid
 */
export function validateAddress(address: string, fieldName: string = 'address'): void {
  if (!address || typeof address !== 'string') {
    throw new Error(`${fieldName} is required`);
  }
  
  // Normalize address to lowercase for validation (ethers.isAddress is case-sensitive for checksums)
  const normalizedAddress = address.toLowerCase();
  
  if (!isValidAddress(normalizedAddress)) {
    throw new Error(`${fieldName} must be a valid Ethereum address`);
  }
}

/**
 * Validates amount (must be positive number)
 */
export function validateAmount(amount: string | number, fieldName: string = 'amount'): void {
  if (!amount) {
    throw new Error(`${fieldName} is required`);
  }
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new Error(`${fieldName} must be a positive number`);
  }
  
  if (numAmount > 1e18) {
    throw new Error(`${fieldName} is too large`);
  }
}

/**
 * Validates hex string (for calldata, etc.)
 */
export function validateHexString(hex: string, fieldName: string = 'hex'): void {
  if (!hex || typeof hex !== 'string') {
    throw new Error(`${fieldName} is required`);
  }
  
  if (!hex.startsWith('0x')) {
    throw new Error(`${fieldName} must start with 0x`);
  }
  
  if (!/^0x[0-9a-fA-F]*$/.test(hex)) {
    throw new Error(`${fieldName} must be a valid hex string`);
  }
}

/**
 * Validates risk score (0-100)
 */
export function validateRiskScore(score: number, fieldName: string = 'riskScore'): void {
  if (typeof score !== 'number' || isNaN(score)) {
    throw new Error(`${fieldName} must be a number`);
  }
  
  if (score < 0 || score > 100) {
    throw new Error(`${fieldName} must be between 0 and 100`);
  }
}

/**
 * Sanitizes string input (removes dangerous characters)
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove null bytes and control characters
  let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized.trim();
}

/**
 * Validates token symbol or trading pair
 * Accepts both single tokens (e.g., "ETH") and pairs (e.g., "ETH-USDT")
 */
export function validateTokenSymbol(symbol: string): void {
  if (!symbol || typeof symbol !== 'string') {
    throw new Error('Token symbol is required');
  }
  
  // Check if it's a trading pair (contains hyphen)
  if (symbol.includes('-')) {
    const parts = symbol.split('-');
    if (parts.length !== 2) {
      throw new Error('Trading pair must be in format TOKEN-QUOTE (e.g., ETH-USDT)');
    }
    
    const [token, quote] = parts;
    
    // Validate token part
    if (!token || token.length === 0 || token.length > 10) {
      throw new Error('Token symbol must be between 1 and 10 characters');
    }
    
    if (!/^[A-Z0-9]+$/.test(token)) {
      throw new Error('Token symbol must contain only uppercase letters and numbers');
    }
    
    // Validate quote part
    if (!quote || quote.length === 0 || quote.length > 10) {
      throw new Error('Quote symbol must be between 1 and 10 characters');
    }
    
    if (!/^[A-Z0-9]+$/.test(quote)) {
      throw new Error('Quote symbol must contain only uppercase letters and numbers');
    }
  } else {
    // Single token validation
    if (symbol.length > 10) {
      throw new Error('Token symbol must be 10 characters or less');
    }
    
    if (!/^[A-Z0-9]+$/.test(symbol)) {
      throw new Error('Token symbol must contain only uppercase letters and numbers');
    }
  }
}

/**
 * Validates pagination parameters
 */
export function validatePagination(limit?: number, offset?: number): { limit: number; offset: number } {
  const validatedLimit = limit !== undefined 
    ? Math.max(1, Math.min(100, Math.floor(limit))) 
    : 20;
  
  const validatedOffset = offset !== undefined 
    ? Math.max(0, Math.floor(offset)) 
    : 0;
  
  return { limit: validatedLimit, offset: validatedOffset };
}
