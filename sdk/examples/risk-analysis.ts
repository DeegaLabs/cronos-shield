/**
 * Risk Analysis Example
 * 
 * This example shows how to analyze contract risk
 */

import { CronosShieldClient, PaymentRequiredError } from '../src';

const client = new CronosShieldClient({
  backendUrl: 'https://cronos-shield-backend-production.up.railway.app',
});

async function analyzeContract(contractAddress: string) {
  try {
    // Analyze contract risk
    const analysis = await client.risk.analyze(contractAddress);
    
    console.log('Risk Analysis:');
    console.log(`  Contract: ${analysis.contract}`);
    console.log(`  Risk Score: ${analysis.score}/100`);
    console.log(`  Has Proof: ${analysis.hasProof}`);
    
    if (analysis.details) {
      console.log('  Details:');
      console.log(`    Holders: ${analysis.details.holders || 'N/A'}`);
      console.log(`    Contract Age: ${analysis.details.contractAge || 'N/A'} days`);
      console.log(`    Verified: ${analysis.details.verified ? 'Yes' : 'No'}`);
      console.log(`    Liquidity: ${analysis.details.liquidity || 'N/A'}`);
    }

    // Verify proof if available
    if (analysis.proof) {
      const isValid = await client.risk.verifyProof(analysis.proof);
      console.log(`  Proof Valid: ${isValid}`);
    }
  } catch (error) {
    if (error instanceof PaymentRequiredError) {
      console.error('Payment required:', error.challenge);
      // Handle payment challenge
    } else {
      console.error('Error:', error);
    }
  }
}

// Example usage
analyzeContract('0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0');
