/**
 * Example 03: Transcribe Audio File
 *
 * This example demonstrates how to transcribe a WAV audio file to text.
 *
 * Usage:
 *   bun run examples/03-transcribe-file.ts <path-to-wav-file>
 *
 * Example:
 *   bun run examples/03-transcribe-file.ts ./audio/sample.wav
 *
 * Audio Requirements:
 *   - Format: WAV (PCM)
 *   - Sample Rate: 16000 Hz
 *   - Channels: Mono (1 channel)
 *   - Bit Depth: 16-bit
 *
 * Convert with ffmpeg:
 *   ffmpeg -i input.mp3 -ar 16000 -ac 1 -acodec pcm_s16le output.wav
 *
 * Environment variables:
 *   WISPR_EMAIL - Your Wispr Flow email
 *   WISPR_PASSWORD - Your Wispr Flow password
 */

import { readFile } from 'node:fs/promises';
import { WisprAuth, WisprClient, toBase64 } from '../src';

function getCredentials(): { email: string; password: string } {
  const email = process.env.WISPR_EMAIL;
  const password = process.env.WISPR_PASSWORD;

  if (!email || !password) {
    console.error('Error: Please set WISPR_EMAIL and WISPR_PASSWORD environment variables');
    process.exit(1);
  }

  return { email, password };
}

async function main() {
  // Get audio file path from command line
  const audioPath = process.argv[2];

  if (!audioPath) {
    console.error('Usage: bun run examples/03-transcribe-file.ts <path-to-wav-file>');
    console.error('');
    console.error('Example:');
    console.error('  bun run examples/03-transcribe-file.ts ./audio/sample.wav');
    process.exit(1);
  }

  const { email, password } = getCredentials();

  console.log('='.repeat(50));
  console.log('Wispr Flow SDK - Transcribe Audio File');
  console.log('='.repeat(50));
  console.log('');

  // Step 1: Read the audio file
  console.log('1. Reading audio file:', audioPath);
  let audioBuffer: Buffer;
  try {
    audioBuffer = await readFile(audioPath);
    console.log('   File size:', (audioBuffer.length / 1024).toFixed(2), 'KB');
  } catch (error) {
    console.error('   Error: Could not read file:', (error as Error).message);
    process.exit(1);
  }

  // Step 2: Convert to base64
  console.log('');
  console.log('2. Converting to base64...');
  const base64Audio = toBase64(audioBuffer);
  console.log('   Base64 length:', base64Audio.length, 'chars');

  // Step 3: Sign in
  console.log('');
  console.log('3. Signing in...');
  const auth = new WisprAuth();
  await auth.signIn({ email, password });
  console.log('   Signed in successfully!');

  // Step 4: Create client
  console.log('');
  console.log('4. Creating client...');
  const client = new WisprClient({ auth });

  // Step 5: Warmup (optional but recommended)
  console.log('');
  console.log('5. Warming up service...');
  await client.warmup();
  console.log('   Service ready!');

  // Step 6: Transcribe
  console.log('');
  console.log('6. Transcribing audio...');
  const startTime = Date.now();

  const result = await client.transcribe({
    audioData: base64Audio,
    languages: ['en'], // You can add more languages: ['en', 'es', 'fr']
  });

  const elapsed = Date.now() - startTime;

  // Step 7: Display results
  console.log('');
  console.log('='.repeat(50));
  console.log('TRANSCRIPTION RESULT');
  console.log('='.repeat(50));
  console.log('');
  console.log('Text:', result.pipeline_text || '(no text detected)');
  console.log('');
  console.log('Stats:');
  console.log('  - Status:', result.status);
  console.log('  - Processing time:', result.total_time?.toFixed(3), 's');
  console.log('  - Client time:', elapsed, 'ms');

  console.log('');
  console.log('Component times:');
  if (result.asr_time) {
    console.log('  - ASR:', result.asr_time.toFixed(3), 's');
  }
  if (result.llm_time) {
    console.log('  - LLM:', result.llm_time.toFixed(3), 's');
  }
  if (result.pipeline_time) {
    console.log('  - Pipeline:', result.pipeline_time.toFixed(3), 's');
  }
  if (result.detected_language) {
    console.log('  - Language:', result.detected_language);
  }

  console.log('');
  console.log('='.repeat(50));
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
