/**
 * Basic Usage Example
 * 
 * This example shows how to initialize the SDK and use basic features
 */

import { CronosShieldClient } from '../src';

// Initialize the client
const client = new CronosShieldClient({
  backendUrl: 'https://cronos-shield-backend-production.up.railway.app',
  network: 'cronos-testnet',
});

async function main() {
  try {
    // Get available trading pairs
    const pairs = await client.divergence.getAvailablePairs();
    console.log('Available pairs:', pairs);

    // Get system metrics
    const metrics = await client.observability.getMetrics();
    console.log('System metrics:', metrics);

    // Get recent divergence alerts
    const alerts = await client.divergence.getAlerts(5);
    console.log('Recent alerts:', alerts);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
