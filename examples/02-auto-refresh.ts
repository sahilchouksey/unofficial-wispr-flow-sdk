/**
 * Example 02: Auto Token Refresh
 *
 * This example demonstrates how to use WisprClient with automatic
 * token refresh for long-running applications.
 *
 * When you use WisprClient.create(), it automatically handles token refresh.
 *
 * Usage:
 *   bun run examples/02-auto-refresh.ts
 */

import { WisprClient } from '../src';

function getCredentials() {
  const email = process.env.WISPR_EMAIL;
  const password = process.env.WISPR_PASSWORD;

  if (!email || !password) {
    console.error('Error: Please set WISPR_EMAIL and WISPR_PASSWORD');
    process.exit(1);
  }

  return { email, password };
}

async function main() {
  console.log('='.repeat(50));
  console.log('Wispr Flow SDK - Auto Token Refresh Example');
  console.log('='.repeat(50));
  console.log('');

  const { email, password } = getCredentials();

  // Step 1: Create client with auto-refresh enabled
  console.log('1. Creating WisprClient with auto-refresh...');
  const client = await WisprClient.create({
    email,
    password,
    tokenRefreshBuffer: 300, // Refresh 5 minutes before expiry
    debug: true,
  });
  console.log('   Client created with auto-refresh enabled!');

  // Step 2: Get client info
  console.log('');
  console.log('2. Client info:');
  const clientConfig = client.getConfig();
  console.log('   User UUID:', clientConfig.userUuid);

  // Step 3: Make API calls - token is refreshed automatically if needed
  console.log('');
  console.log('3. Making API call (token auto-refreshed if needed)...');
  const warmupResponse = await client.warmup();
  console.log('   Warmup status:', warmupResponse.status);

  // Step 4: Simulate long-running application
  console.log('');
  console.log('4. Simulating long-running app with periodic calls...');
  console.log('   (In a real app, tokens would be refreshed automatically)');

  for (let i = 1; i <= 3; i++) {
    console.log(`   Call ${i}/3...`);
    await client.warmup(); // Each call checks token validity
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log('');
  console.log('='.repeat(50));
  console.log('Auto-refresh demo complete!');
  console.log('');
  console.log('Key points:');
  console.log('- WisprClient.create() handles authentication and auto-refresh');
  console.log('- Set tokenRefreshBuffer to control when tokens refresh');
  console.log('- Token is automatically refreshed before each API call if needed');
  console.log('='.repeat(50));
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
