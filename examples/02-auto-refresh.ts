/**
 * Example 02: Auto Token Refresh
 *
 * This example demonstrates how to use WisprClient with automatic
 * token refresh for long-running applications.
 *
 * When you pass a WisprAuth instance to WisprClient, it will automatically
 * refresh the access token before it expires.
 *
 * Usage:
 *   bun run examples/02-auto-refresh.ts
 *
 * Environment variables:
 *   WISPR_EMAIL - Your Wispr Flow email
 *   WISPR_PASSWORD - Your Wispr Flow password
 */

import { WisprAuth, WisprClient } from '../src';

function getCredentials(): { email: string; password: string } {
  const email = process.env.WISPR_EMAIL;
  const password = process.env.WISPR_PASSWORD;

  if (!email || !password) {
    console.error('Error: Please set WISPR_EMAIL and WISPR_PASSWORD environment variables');
    process.exit(1);
  }

  return { email, password };
}

const { email, password } = getCredentials();

async function main() {
  console.log('='.repeat(50));
  console.log('Wispr Flow SDK - Auto Token Refresh Example');
  console.log('='.repeat(50));
  console.log('');

  // Step 1: Create and sign in with WisprAuth
  console.log('1. Creating WisprAuth and signing in...');
  const auth = new WisprAuth();
  await auth.signIn({ email, password });
  console.log('   Signed in successfully!');

  // Step 2: Create WisprClient with auth instance
  // This enables automatic token refresh
  console.log('');
  console.log('2. Creating WisprClient with auto-refresh...');
  const client = new WisprClient({
    auth, // Pass the auth instance for auto-refresh
    tokenRefreshBuffer: 300, // Refresh 5 minutes before expiry
    debug: true,
  });
  console.log('   Client created with auto-refresh enabled!');

  // Step 3: Check session status
  console.log('');
  console.log('3. Session info:');
  const session = auth.getSession();
  if (session) {
    console.log('   User:', session.email);
    console.log('   Expires at:', new Date(session.expiresAt * 1000).toISOString());
    console.log('   Is expired:', auth.isSessionExpired());
  }

  // Step 4: Make API calls - token is refreshed automatically if needed
  console.log('');
  console.log('4. Making API call (token auto-refreshed if needed)...');
  const warmupResponse = await client.warmup();
  console.log('   Warmup status:', warmupResponse.status);

  // Step 5: Simulate long-running application
  console.log('');
  console.log('5. Simulating long-running app with periodic calls...');
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
  console.log('- Pass WisprAuth instance to WisprClient for auto-refresh');
  console.log('- Set tokenRefreshBuffer to control when tokens refresh');
  console.log('- Token is automatically refreshed before each API call if needed');
  console.log('='.repeat(50));
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
