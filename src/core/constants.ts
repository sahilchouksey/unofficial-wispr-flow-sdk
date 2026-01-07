/**
 * Default API endpoints and configuration
 *
 * All sensitive values are loaded from environment variables.
 * Set these in your .env file or environment.
 */

/** Get environment variable with fallback */
const getEnv = (key: string, fallback = ''): string => {
  // Works in Node.js, Bun, and bundlers that support process.env
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || fallback;
  }
  return fallback;
};

/** Wispr Flow API base URL */
export const WISPR_API_BASE_URL = getEnv('WISPR_API_URL', 'https://api.wisprflow.ai');

/** Baseten transcription API URL */
export const BASETEN_API_URL = getEnv('BASETEN_URL');

/** Default Baseten API key */
export const DEFAULT_BASETEN_API_KEY = getEnv('BASETEN_API_KEY');

/** Supabase instance URL for authentication */
export const SUPABASE_URL = getEnv('SUPABASE_URL');

/** Supabase anonymous key */
export const SUPABASE_ANON_KEY = getEnv('SUPABASE_ANON_KEY');

/** Default client version to report */
export const DEFAULT_CLIENT_VERSION = getEnv('WISPR_CLIENT_VERSION', '1.4.154');

/** Default request timeout in milliseconds */
export const DEFAULT_TIMEOUT_MS = 30000;

/** API endpoints */
export const ENDPOINTS = {
  /** Warmup endpoint to prepare the service */
  WARMUP: '/warmup',
  /** Baseten transcription endpoint */
  BASETEN_TRANSCRIBE: '/environments/production/run_remote',
} as const;

/** Supported audio formats */
export const AUDIO_CONFIG = {
  /** Sample rate in Hz */
  SAMPLE_RATE: 16000,
  /** Number of audio channels */
  CHANNELS: 1,
  /** Bits per sample */
  BITS_PER_SAMPLE: 16,
  /** Audio format */
  FORMAT: 'pcm_wav',
  /** Maximum audio duration in seconds */
  MAX_DURATION_SECONDS: 360, // 6 minutes
  /** Maximum audio size in bytes */
  MAX_SIZE_BYTES: 25 * 1024 * 1024, // 25MB
} as const;

/** Supported languages (ISO 639-1 codes) */
export const SUPPORTED_LANGUAGES = [
  'en', // English
  'es', // Spanish
  'fr', // French
  'de', // German
  'it', // Italian
  'pt', // Portuguese
  'nl', // Dutch
  'pl', // Polish
  'ru', // Russian
  'ja', // Japanese
  'ko', // Korean
  'zh', // Chinese
  'ar', // Arabic
  'hi', // Hindi
  'tr', // Turkish
  'vi', // Vietnamese
  'th', // Thai
  'id', // Indonesian
  'ms', // Malay
  'sv', // Swedish
  'da', // Danish
  'no', // Norwegian
  'fi', // Finnish
  'cs', // Czech
  'sk', // Slovak
  'hu', // Hungarian
  'ro', // Romanian
  'bg', // Bulgarian
  'uk', // Ukrainian
  'he', // Hebrew
  'el', // Greek
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Validate that required environment variables are set
 */
export function validateEnvConfig(): { valid: boolean; missing: string[] } {
  const required = ['BASETEN_URL', 'BASETEN_API_KEY', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'];

  const missing = required.filter((key) => !getEnv(key));

  return {
    valid: missing.length === 0,
    missing,
  };
}
