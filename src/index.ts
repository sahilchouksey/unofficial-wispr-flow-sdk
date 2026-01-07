/**
 * Wispr Flow SDK - Unofficial TypeScript SDK for Wispr Flow voice-to-text API
 *
 * @example
 * ```typescript
 * import { WisprAuth, WisprClient } from 'wispr-flow-sdk';
 *
 * // Authenticate
 * const auth = new WisprAuth();
 * const session = await auth.signIn({
 *   email: 'user@example.com',
 *   password: 'password123',
 * });
 *
 * // Create client with session
 * const client = new WisprClient({
 *   accessToken: session.accessToken,
 *   userUuid: session.userUuid,
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
export { WisprClient } from './core/client';

// Authentication
export {
  WisprAuth,
  createAuth,
  SUPABASE_ANON_KEY,
  type AuthCredentials,
  type AuthSession,
  type SupabaseSession,
  type SupabaseUser,
  type WisprSignInResponse,
  type UserStatus,
} from './core/auth';

// Constants
export {
  AUDIO_CONFIG,
  BASETEN_API_URL,
  DEFAULT_BASETEN_API_KEY,
  DEFAULT_CLIENT_VERSION,
  DEFAULT_TIMEOUT_MS,
  ENDPOINTS,
  SUPPORTED_LANGUAGES,
  SUPABASE_URL,
  WISPR_API_BASE_URL,
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
