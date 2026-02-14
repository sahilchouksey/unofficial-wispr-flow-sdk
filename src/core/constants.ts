/**
 * Default API endpoints and configuration constants
 *
 * Infrastructure values are extracted from the official Wispr Flow desktop app
 * and are the same for all users. Authentication is still per-user via JWT.
 */

/** Default Wispr Flow API base URL */
export const DEFAULT_API_BASE_URL = 'https://api.wisprflow.ai';

/**
 * Wispr Flow Infrastructure Configuration
 *
 * These values are hardcoded in the official Wispr Flow desktop app
 * (extracted from /Applications/Wispr Flow.app/Contents/Resources/app.asar)
 * and are identical for all users.
 *
 * Security model:
 * - Layer 1 (Baseten): API key in header - blocks unauthorized callers
 * - Layer 2 (Wispr): User JWT in payload - verifies user authentication
 *
 * Even with these values exposed, a valid user JWT is still required.
 */
export const WISPR_INFRASTRUCTURE = {
  /** Supabase project URL for authentication */
  SUPABASE_URL: 'https://dodjkfqhwrzqjwkfnthl.supabase.co',
  /** Supabase anonymous key for client-side auth */
  SUPABASE_ANON_KEY:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvZGprZnFod3J6cWp3a2ZudGhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTk4ODQzMDcsImV4cCI6MjAzNTQ2MDMwN30.h6EeQ_6kqFeznH25icVUX0Szn9__kc8HoSXAsxxBWG8',
  /** Baseten API endpoint for transcription */
  BASETEN_URL: 'https://chain-o232k03l.api.baseten.co',
  /** Baseten API key for service access */
  BASETEN_API_KEY: 'aEXAlxkF.cIvt1vqaijttubIVIWqr8T7npyYUXBOp',
} as const;

/** Default client version to report */
export const DEFAULT_CLIENT_VERSION = '1.4.154';

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
