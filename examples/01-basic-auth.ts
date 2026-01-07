/**
 * Example 01: Basic Authentication
 *
 * This example demonstrates how to:
 * 1. Check if a user exists
 * 2. Sign in with email/password
 * 3. Create a WisprClient with the session
 * 4. Warmup the transcription service
 *
 * Usage:
 *   bun run examples/01-basic-auth.ts
 *
 * Environment variables:
 *   WISPR_EMAIL - Your Wispr Flow email
 *   WISPR_PASSWORD - Your Wispr Flow password
 */

import { WisprAuth, WisprClient } from '../src';

// Get credentials from environment
function getCredentials(): { email: string; password: string } {
  const email = process.env.WISPR_EMAIL;
  const password = process.env.WISPR_PASSWORD;

  if (!email || !password) {
    console.error('Error: Please set WISPR_EMAIL and WISPR_PASSWORD environment variables');
    console.error('');
    console.error('Example:');
    console.error('  export WISPR_EMAIL="your-email@example.com"');
    console.error('  export WISPR_PASSWORD="your-password"');
    process.exit(1);
  }

  return { email, password };
}

const { email, password } = getCredentials();

async function main() {
  console.log('='.repeat(50));
  console.log('Wispr Flow SDK - Basic Authentication Example');
  console.log('='.repeat(50));
  console.log('');

  // Step 1: Create auth instance
  console.log('1. Creating WisprAuth instance...');
  const auth = new WisprAuth();

  // Step 2: Check if user exists
  console.log('');
  console.log('2. Checking if user exists...');
  const userStatus = await auth.checkUserStatus(email);
  console.log('   User status:', userStatus);

  if (!userStatus.exists) {
    console.error('   Error: User does not exist. Please sign up at https://wisprflow.ai');
    process.exit(1);
  }

  // Step 3: Sign in
  console.log('');
  console.log('3. Signing in...');
  const session = await auth.signIn({ email, password });
  console.log('   Success!');
  console.log('   User UUID:', session.userUuid);
  console.log('   Email:', session.email);
  console.log('   Token expires at:', new Date(session.expiresAt * 1000).toISOString());

  // Step 4: Create client with session
  console.log('');
  console.log('4. Creating WisprClient...');
  const client = new WisprClient({
    accessToken: session.accessToken,
    userUuid: session.userUuid,
    debug: true,
  });
  console.log('   Client created successfully!');

  // Step 5: Warmup the service
  console.log('');
  console.log('5. Warming up transcription service...');
  const warmupResponse = await client.warmup();
  console.log('   Warmup status:', warmupResponse.status);

  // Done!
  console.log('');
  console.log('='.repeat(50));
  console.log('Authentication complete! You can now use the client to transcribe audio.');
  console.log('='.repeat(50));

  // Optional: Sign out when done
  // auth.signOut();
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
