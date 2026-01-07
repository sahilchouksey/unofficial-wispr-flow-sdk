/**
 * Example 01: Basic Authentication
 *
 * This example demonstrates how to:
 * 1. Create a WisprClient with all config in one place
 * 2. Warmup the transcription service
 *
 * Usage:
 *   bun run examples/01-basic-auth.ts
 *
 * Required: Set environment variables or pass directly to the SDK
 */

import { WisprClient } from '../src';

// Get configuration from environment (for this example)
// In production, you can pass these values directly
function getConfig() {
  const email = process.env.WISPR_EMAIL;
  const password = process.env.WISPR_PASSWORD;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const basetenUrl = process.env.BASETEN_URL;
  const basetenApiKey = process.env.BASETEN_API_KEY;

  if (!email || !password || !supabaseUrl || !supabaseAnonKey || !basetenUrl || !basetenApiKey) {
    console.error('Error: Please set required environment variables:');
    console.error('  WISPR_EMAIL, WISPR_PASSWORD');
    console.error('  SUPABASE_URL, SUPABASE_ANON_KEY');
    console.error('  BASETEN_URL, BASETEN_API_KEY');
    process.exit(1);
  }

  return { email, password, supabaseUrl, supabaseAnonKey, basetenUrl, basetenApiKey };
}

async function main() {
  console.log('='.repeat(50));
  console.log('Wispr Flow SDK - Basic Authentication Example');
  console.log('='.repeat(50));
  console.log('');

  const config = getConfig();

  // Step 1: Create client with all config in one place
  console.log('1. Creating WisprClient with unified config...');
  const client = await WisprClient.create({
    email: config.email,
    password: config.password,
    supabaseUrl: config.supabaseUrl,
    supabaseAnonKey: config.supabaseAnonKey,
    basetenUrl: config.basetenUrl,
    basetenApiKey: config.basetenApiKey,
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
