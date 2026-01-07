/**
 * Example 05: Microphone Recording (Browser)
 *
 * A simple server that serves a web page for recording audio from the
 * microphone and transcribing it using the Wispr Flow API.
 *
 * Usage:
 *   bun run examples/05-microphone-browser/server.ts
 *   Open http://localhost:3001 in your browser
 *
 * Required environment variables:
 *   WISPR_EMAIL, WISPR_PASSWORD
 *   SUPABASE_URL, SUPABASE_ANON_KEY
 *   BASETEN_URL, BASETEN_API_KEY
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { WisprClient } from '../../src';

const PORT = 3001;

// Get configuration
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

const config = getConfig();

// Initialize client
let client: WisprClient;

async function initializeClient() {
  console.log('Initializing Wispr client...');
  client = await WisprClient.create({
    email: config.email,
    password: config.password,
    supabaseUrl: config.supabaseUrl,
    supabaseAnonKey: config.supabaseAnonKey,
    basetenUrl: config.basetenUrl,
    basetenApiKey: config.basetenApiKey,
    debug: true,
  });
  await client.warmup();
  console.log('Client ready!');
}

/**
 * Convert WebM audio to WAV format using ffmpeg
 */
async function convertToWav(webmBuffer: ArrayBuffer): Promise<Buffer> {
  const inputPath = `/tmp/input-${Date.now()}.webm`;
  const outputPath = `/tmp/output-${Date.now()}.wav`;

  // Write input file
  await Bun.write(inputPath, webmBuffer);

  // Convert with ffmpeg
  const proc = Bun.spawn(
    [
      'ffmpeg',
      '-i',
      inputPath,
      '-ar',
      '16000',
      '-ac',
      '1',
      '-acodec',
      'pcm_s16le',
      '-y',
      outputPath,
    ],
    {
      stderr: 'pipe',
    }
  );

  await proc.exited;

  // Read output
  const outputBuffer = await readFile(outputPath);

  // Cleanup
  await Promise.all([Bun.spawn(['rm', inputPath]).exited, Bun.spawn(['rm', outputPath]).exited]);

  return outputBuffer;
}

// Start server
Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // Serve the HTML page
    if (url.pathname === '/' || url.pathname === '/index.html') {
      const htmlPath = join(import.meta.dir, 'index.html');
      const html = await readFile(htmlPath, 'utf-8');
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Handle transcription requests
    if (url.pathname === '/transcribe' && req.method === 'POST') {
      try {
        // Get the audio data from the request
        const formData = await req.formData();
        const audioBlob = formData.get('audio') as Blob;

        if (!audioBlob) {
          return Response.json({ error: 'No audio data provided' }, { status: 400 });
        }

        console.log('Received audio:', audioBlob.size, 'bytes, type:', audioBlob.type);

        // Convert to ArrayBuffer
        const webmBuffer = await audioBlob.arrayBuffer();

        // Convert WebM to WAV
        console.log('Converting to WAV...');
        const wavBuffer = await convertToWav(webmBuffer);
        console.log('WAV size:', wavBuffer.length, 'bytes');

        // Convert to base64
        const base64Audio = wavBuffer.toString('base64');

        // Transcribe
        console.log('Transcribing...');
        const result = await client.transcribe({
          audioData: base64Audio,
          languages: ['en'],
        });

        // Use llm_text (formatted) or fall back to asr_text (raw)
        const text = result.llm_text || result.asr_text || result.pipeline_text || '';
        console.log('Result:', result.status, '-', text?.slice(0, 50));

        return Response.json({
          success: true,
          text,
          status: result.status,
          stats: {
            asrTime: result.asr_time,
            llmTime: result.llm_time,
            totalTime: result.total_time,
            language: result.detected_language,
          },
        });
      } catch (error) {
        console.error('Transcription error:', error);
        return Response.json({ error: (error as Error).message }, { status: 500 });
      }
    }

    return new Response('Not Found', { status: 404 });
  },
});

// Initialize client before accepting requests
initializeClient().then(() => {
  console.log('');
  console.log('='.repeat(50));
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Open this URL in your browser to test microphone recording.');
  console.log('='.repeat(50));
});
