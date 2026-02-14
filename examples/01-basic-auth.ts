/**
 * Example 01: Basic Authentication
 *
 * This example demonstrates how to:
 * 1. Create a WisprClient with just email and password
 * 2. Warmup the transcription service
 *
 * Usage:
 *   bun run examples/01-basic-auth.ts
 *
 * Required: Set WISPR_EMAIL and WISPR_PASSWORD environment variables
 */

import { WisprClient } from '../src';

// Get credentials from environment
function getCredentials() {
  const email = process.env.WISPR_EMAIL;
  const password = process.env.WISPR_PASSWORD;

  if (!email || !password) {
    console.error('Error: Please set required environment variables:');
    console.error('  WISPR_EMAIL, WISPR_PASSWORD');
    process.exit(1);
  }

  return { email, password };
}

async function main() {
  console.log('='.repeat(50));
  console.log('Wispr Flow SDK - Basic Authentication Example');
  console.log('='.repeat(50));
  console.log('');

  const { email, password } = getCredentials();

  // Step 1: Create client with just email and password!
  console.log('1. Creating WisprClient...');
  const client = await WisprClient.create({
    email,
    password,
    debug: true,
  });
  console.log('   Client created and authenticated successfully!');

  // Step 2: Get client config (without sensitive data)
  console.log('');
  console.log('2. Client configuration:');
  const clientConfig = client.getConfig();
  console.log('   User UUID:', clientConfig.userUuid);
  console.log('   API Base URL:', clientConfig.apiBaseUrl);
  console.log('   Client Version:', clientConfig.clientVersion);

  // Step 3: Warmup the service
  console.log('');
  console.log('3. Warming up transcription service...');
  const warmupResponse = await client.warmup();
  console.log('   Warmup status:', warmupResponse.status);

  // Done!
  console.log('');
  console.log('='.repeat(50));
  console.log('Authentication complete! You can now use the client to transcribe audio.');
  console.log('='.repeat(50));
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
