/**
 * Example 04: Error Handling
 *
 * This example demonstrates proper error handling patterns with the SDK,
 * including handling auth errors, API errors, validation errors, and timeouts.
 *
 * Usage:
 *   bun run examples/04-error-handling.ts
 */

import {
  WisprApiError,
  WisprAuthError,
  WisprClient,
  WisprError,
  WisprTimeoutError,
  WisprValidationError,
} from '../src';

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
  const { email, password } = getCredentials();

  console.log('='.repeat(50));
  console.log('Wispr Flow SDK - Error Handling Example');
  console.log('='.repeat(50));
  console.log('');

  // ========================================
  // Example 1: Handle authentication errors
  // ========================================
  console.log('1. Handling authentication errors...');
  console.log('');

  // Try with wrong password
  console.log('   a) Wrong password:');
  try {
    await WisprClient.create({
      email,
      password: 'wrong-password',
    });
  } catch (error) {
    if (error instanceof WisprAuthError) {
      console.log('      Caught WisprAuthError:', error.message);
      console.log('      Code:', error.code);
    }
  }

  // ========================================
  // Example 2: Handle validation errors
  // ========================================
  console.log('');
  console.log('2. Handling validation errors...');
  console.log('');

  // Try creating client without required fields
  console.log('   a) Missing email:');
  try {
    await WisprClient.create({
      email: '', // Missing!
      password,
    });
  } catch (error) {
    if (error instanceof WisprValidationError) {
      console.log('      Caught WisprValidationError:', error.message);
    }
  }

  // ========================================
  // Example 3: Proper sign-in with error handling
  // ========================================
  console.log('');
  console.log('3. Proper sign-in with comprehensive error handling...');
  console.log('');

  let client: WisprClient | null = null;

  try {
    // Create client - just email and password needed!
    client = await WisprClient.create({
      email,
      password,
    });
    console.log('   Client created successfully!');

    // Warmup
    await client.warmup();
    console.log('   Service warmed up!');
  } catch (error) {
    if (error instanceof WisprAuthError) {
      console.error('   Authentication failed:', error.message);
      console.error('   Please check your credentials.');
    } else if (error instanceof WisprApiError) {
      console.error('   API error:', error.message);
      console.error('   Status code:', error.statusCode);
    } else if (error instanceof WisprTimeoutError) {
      console.error('   Request timed out:', error.message);
    } else if (error instanceof WisprError) {
      console.error('   Wispr error:', error.message);
      console.error('   Code:', error.code);
    } else {
      console.error('   Unexpected error:', error);
    }
    process.exit(1);
  }

  // ========================================
  // Example 4: Handle API errors during transcription
  // ========================================
  console.log('');
  console.log('4. Handling transcription errors...');
  console.log('');

  // Try transcribing with empty audio
  console.log('   a) Empty audio data:');
  try {
    const result = await client.transcribe({ audioData: '' });
    console.log('      Result status:', result.status);
    if (result.status === 'empty') {
      console.log('      No speech detected in audio');
    }
  } catch (error) {
    if (error instanceof WisprApiError) {
      console.log('      Caught WisprApiError:', error.message);
    }
  }

  // ========================================
  // Example 5: Using try-catch pattern for production
  // ========================================
  console.log('');
  console.log('5. Production-ready error handling pattern:');
  console.log('');

  async function transcribeWithRetry(
    client: WisprClient,
    audioData: string,
    maxRetries = 3
  ): Promise<string | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await client.transcribe({ audioData });

        if (result.status === 'success' && result.pipeline_text) {
          return result.pipeline_text;
        }

        if (result.status === 'empty') {
          console.log(`      Attempt ${attempt}: No speech detected`);
          return null;
        }

        if (result.status === 'error') {
          console.log(`      Attempt ${attempt}: Error - ${result.error_message}`);
        }
      } catch (error) {
        if (error instanceof WisprAuthError) {
          // Auth errors should not retry - re-throw
          throw error;
        }

        if (error instanceof WisprTimeoutError) {
          console.log(`      Attempt ${attempt}: Timeout, retrying...`);
          continue;
        }

        if (error instanceof WisprApiError && error.statusCode && error.statusCode >= 500) {
          console.log(`      Attempt ${attempt}: Server error, retrying...`);
          await new Promise((r) => setTimeout(r, 1000 * attempt)); // Exponential backoff
          continue;
        }

        throw error; // Re-throw unknown errors
      }
    }

    throw new Error('Max retries exceeded');
  }

  console.log('   Running transcribe with retry...');
  try {
    // This will likely return empty since there's no actual audio
    const text = await transcribeWithRetry(client, '');
    console.log('   Result:', text ?? '(no text)');
  } catch (error) {
    console.log('   Final error:', (error as Error).message);
  }

  // Done
  console.log('');
  console.log('='.repeat(50));
  console.log('Error handling examples complete!');
  console.log('');
  console.log('Key error types:');
  console.log('- WisprAuthError: Authentication/token issues');
  console.log('- WisprApiError: API request failures');
  console.log('- WisprValidationError: Invalid input/config');
  console.log('- WisprTimeoutError: Request timeouts');
  console.log('- WisprError: Base class for all SDK errors');
  console.log('='.repeat(50));
}

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
