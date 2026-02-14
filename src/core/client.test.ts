/**
 * WisprClient Tests
 *
 * Tests the simplified SDK interface.
 * Integration tests require WISPR_EMAIL and WISPR_PASSWORD environment variables.
 */

import { describe, expect, test } from 'bun:test';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { WisprAuthError, WisprValidationError } from '../types';
import { toBase64 } from '../utils';
import { WisprClient } from './client';
import { WISPR_INFRASTRUCTURE } from './constants';

// Test credentials from environment variables
const TEST_EMAIL = process.env.WISPR_EMAIL || '';
const TEST_PASSWORD = process.env.WISPR_PASSWORD || '';
const HAS_CREDENTIALS = TEST_EMAIL !== '' && TEST_PASSWORD !== '';

// Use test.skip for integration tests when no credentials
const integrationTest = HAS_CREDENTIALS ? test : test.skip;

describe('WISPR_INFRASTRUCTURE', () => {
  test('should have all required values', () => {
    expect(WISPR_INFRASTRUCTURE.SUPABASE_URL).toBeDefined();
    expect(WISPR_INFRASTRUCTURE.SUPABASE_URL).toStartWith('https://');
    expect(WISPR_INFRASTRUCTURE.SUPABASE_ANON_KEY).toBeDefined();
    expect(WISPR_INFRASTRUCTURE.BASETEN_URL).toBeDefined();
    expect(WISPR_INFRASTRUCTURE.BASETEN_URL).toStartWith('https://');
    expect(WISPR_INFRASTRUCTURE.BASETEN_API_KEY).toBeDefined();
  });
});

describe('WisprClient.create() - Validation', () => {
  test('should require email', async () => {
    await expect(
      WisprClient.create({
        email: '',
        password: 'some-password',
      })
    ).rejects.toThrow(WisprValidationError);
  });

  test('should require password', async () => {
    await expect(
      WisprClient.create({
        email: 'test@example.com',
        password: '',
      })
    ).rejects.toThrow(WisprValidationError);
  });

  test('should fail with invalid credentials', async () => {
    await expect(
      WisprClient.create({
        email: 'invalid@example.com',
        password: 'wrong-password',
      })
    ).rejects.toThrow(WisprAuthError);
  });
});

describe('WisprClient.create() - Integration', () => {
  integrationTest('should create client with only email and password', async () => {
    const client = await WisprClient.create({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    expect(client).toBeDefined();
    const config = client.getConfig();
    expect(config.userUuid).toBeDefined();
    expect(config.userUuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  integrationTest('should accept optional debug flag', async () => {
    const client = await WisprClient.create({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      debug: true,
    });

    expect(client).toBeDefined();
  });

  integrationTest('should accept optional timeout', async () => {
    const client = await WisprClient.create({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      timeout: 60000,
    });

    expect(client).toBeDefined();
  });
});

describe('WisprClient API Methods', () => {
  integrationTest('warmup() should return status', async () => {
    const client = await WisprClient.create({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    const result = await client.warmup();
    expect(result).toBeDefined();
    expect(result.status).toBe('warmed');
  });

  integrationTest('transcribe() with valid audio should return text', async () => {
    const client = await WisprClient.create({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    // Create test audio using macOS TTS
    const audioPath = '/tmp/wispr-test-audio.wav';
    const aiffPath = '/tmp/wispr-test-audio.aiff';

    try {
      execSync(`say -o ${aiffPath} "Hello world, testing the SDK."`);
      execSync(
        `ffmpeg -y -i ${aiffPath} -ar 16000 -ac 1 -acodec pcm_s16le ${audioPath} 2>/dev/null`
      );

      const audioBuffer = readFileSync(audioPath);
      const base64Audio = toBase64(audioBuffer);

      const result = await client.transcribe({
        audioData: base64Audio,
        languages: ['en'],
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('formatted');
      expect(result.llm_text || result.asr_text).toBeTruthy();
      expect((result.llm_text || result.asr_text)?.toLowerCase()).toContain('hello');
    } finally {
      // Cleanup
      if (existsSync(aiffPath)) unlinkSync(aiffPath);
      if (existsSync(audioPath)) unlinkSync(audioPath);
    }
  });

  integrationTest('getConfig() should return config without sensitive data', async () => {
    const client = await WisprClient.create({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    const config = client.getConfig();
    expect(config.userUuid).toBeDefined();
    // Should NOT contain sensitive data
    expect((config as any).accessToken).toBeUndefined();
    expect((config as any).basetenApiKey).toBeUndefined();
  });
});
