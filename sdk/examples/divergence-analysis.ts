/**
 * Divergence Analysis Example
 * 
 * This example shows how to analyze CEX-DEX price divergence
 */

import { CronosShieldClient, PaymentRequiredError } from '../src';

const client = new CronosShieldClient({
  backendUrl: 'https://cronos-shield-backend-production.up.railway.app',
});

async function analyzeDivergence(pair: string) {
  try {
    // Analyze divergence
    const result = await client.divergence.analyze(pair);
    
    console.log('Divergence Analysis:');
    console.log(`  Pair: ${result.token}`);
    console.log(`  CEX Price: $${result.cexPrice}`);
    console.log(`  DEX Price: $${result.dexPrice}`);
    console.log(`  Divergence: ${result.divergence}%`);
    console.log(`  Recommendation: ${result.recommendation}`);
    
    // Get history
    const history = await client.divergence.getHistory(pair, 7);
    console.log(`  History (7 days): ${history.length} data points`);
    
    // Get alerts
    const alerts = await client.divergence.getAlerts(5);
    console.log(`  Recent Alerts: ${alerts.length}`);
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
analyzeDivergence('ETH-USDT');
