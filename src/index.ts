/**
 * Wispr Flow SDK - Unofficial TypeScript SDK for Wispr Flow voice-to-text API
 *
 * All configuration must be passed explicitly - no environment variables are read.
 *
 * @example
 * ```typescript
 * import { WisprClient } from 'wispr-flow-sdk';
 *
 * // Create client with all config in one place
 * const client = await WisprClient.create({
 *   email: 'user@example.com',
 *   password: 'password123',
 *   supabaseUrl: 'https://xxx.supabase.co',
 *   supabaseAnonKey: 'your-anon-key',
 *   basetenUrl: 'https://xxx.api.baseten.co',
 *   basetenApiKey: 'your-baseten-key',
 * });
 *
 * // Warmup the service (reduces latency)
 * await client.warmup();
 *
 * // Transcribe audio (base64 encoded WAV)
 * const result = await client.transcribe({
 *   audioData: base64AudioData,
 * });
 *
 * console.log(result.pipeline_text);
 * ```
 *
 * @packageDocumentation
 */

// Main client
export { WisprClient, type WisprClientOptions, type WisprFlowConfig } from './core/client';

// Authentication
export {
  WisprAuth,
  createAuth,
  type AuthCredentials,
  type AuthSession,
  type SupabaseSession,
  type SupabaseUser,
  type WisprAuthOptions,
  type WisprSignInResponse,
  type UserStatus,
} from './core/auth';

// Constants
export {
  AUDIO_CONFIG,
  DEFAULT_API_BASE_URL,
  DEFAULT_CLIENT_VERSION,
  DEFAULT_TIMEOUT_MS,
  ENDPOINTS,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from './core/constants';

// Types and schemas
export {
  // Config
  WisprConfigSchema,
  type WisprConfig,
  // Request types
  AppContextSchema,
  type AppContext,
  TextboxContentsSchema,
  type TextboxContents,
  ConversationMessageSchema,
  type ConversationMessage,
  ConversationSchema,
  type Conversation,
  TranscriptionContextSchema,
  type TranscriptionContext,
  TranscriptionMetadataSchema,
  type TranscriptionMetadata,
  TranscriptionRequestSchema,
  type TranscriptionRequest,
  // Response types
  WarmupResponseSchema,
  type WarmupResponse,
  ComponentTimesSchema,
  type ComponentTimes,
  TranscriptionResponseSchema,
  type TranscriptionResponse,
  // Error classes
  WisprError,
  WisprAuthError,
  WisprApiError,
  WisprValidationError,
  WisprTimeoutError,
} from './types';

// Utilities
export {
  createLogger,
  createTimeoutSignal,
  fromBase64,
  fromBase64ToBytes,
  generateUuid,
  retry,
  sleep,
  toBase64,
  type Logger,
} from './utils';
