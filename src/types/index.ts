import { z } from 'zod';

// ============================================================================
// Configuration Types
// ============================================================================

export const WisprConfigSchema = z.object({
  /** Supabase JWT access token for authentication */
  accessToken: z.string().min(1),
  /** User UUID from Supabase */
  userUuid: z.string().uuid(),
  /** Optional custom Baseten API key (uses default if not provided) */
  basetenApiKey: z.string().optional(),
  /** Optional custom API base URL */
  apiBaseUrl: z.string().url().optional(),
  /** Optional custom Baseten URL */
  basetenUrl: z.string().url().optional(),
  /** Optional client version to report (uses default if not provided) */
  clientVersion: z.string().optional(),
  /** Request timeout in milliseconds */
  timeout: z.number().positive().optional().default(30000),
  /** Enable debug logging */
  debug: z.boolean().optional().default(false),
});

export type WisprConfig = z.infer<typeof WisprConfigSchema>;

// ============================================================================
// API Request Types
// ============================================================================

export const AppContextSchema = z.object({
  name: z.string().nullable().optional(),
  bundle_id: z.string().nullable().optional(),
  type: z.enum(['email', 'ai', 'other']).optional(),
  url: z.string().nullable().optional(),
});

export type AppContext = z.infer<typeof AppContextSchema>;

export const TextboxContentsSchema = z.object({
  before_text: z.string().optional(),
  selected_text: z.string().optional(),
  after_text: z.string().optional(),
});

export type TextboxContents = z.infer<typeof TextboxContentsSchema>;

export const ConversationMessageSchema = z.object({
  role: z.enum(['user', 'human', 'assistant']),
  content: z.string(),
});

export type ConversationMessage = z.infer<typeof ConversationMessageSchema>;

export const ConversationSchema = z.object({
  id: z.string(),
  participants: z.array(z.string()).optional(),
  messages: z.array(ConversationMessageSchema).optional(),
});

export type Conversation = z.infer<typeof ConversationSchema>;

export const TranscriptionContextSchema = z.object({
  app: AppContextSchema.optional(),
  ax_context: z.array(z.string()).optional(),
  variable_names: z.array(z.string()).optional(),
  file_names: z.array(z.string()).optional(),
  ocr_context: z.array(z.string()).optional(),
  dictionary_context: z.array(z.string()).optional(),
  dictionary_replacements: z.record(z.string()).optional(),
  user_identifier: z.string().nullable().optional(),
  user_first_name: z.string().nullable().optional(),
  user_last_name: z.string().nullable().optional(),
  textbox_contents: TextboxContentsSchema.nullable().optional(),
  content_text: z.string().nullable().optional(),
  screenshot: z.string().nullable().optional(),
  content_html: z.string().nullable().optional(),
  conversation: ConversationSchema.nullable().optional(),
});

export type TranscriptionContext = z.infer<typeof TranscriptionContextSchema>;

export const TranscriptionMetadataSchema = z.object({
  session_id: z.string().uuid(),
  environment: z.enum(['production', 'development', 'staging']).default('production'),
  client_platform: z.enum(['android', 'ios', 'darwin', 'windows', 'linux']),
  client_version: z.string(),
  transcript_entity_uuid: z.string().uuid(),
});

export type TranscriptionMetadata = z.infer<typeof TranscriptionMetadataSchema>;

export const TranscriptionRequestSchema = z.object({
  /** Base64 encoded audio data (16kHz PCM WAV) */
  audioData: z.string().optional(),
  /** Previous ASR text for context */
  prevAsrText: z.string().optional(),
  /** Transcription context */
  context: TranscriptionContextSchema.optional(),
  /** Language hints (ISO 639-1 codes) */
  languages: z.array(z.string()).optional(),
  /** Custom metadata */
  metadata: TranscriptionMetadataSchema.partial().optional(),
});

export type TranscriptionRequest = z.infer<typeof TranscriptionRequestSchema>;

// ============================================================================
// API Response Types
// ============================================================================

export const WarmupResponseSchema = z.object({
  status: z.string(),
});

export type WarmupResponse = z.infer<typeof WarmupResponseSchema>;

export const ComponentTimesSchema = z.object({
  wrap_up_call: z.number().optional(),
  total_call: z.number().optional(),
  asr_call: z.number().optional(),
  llm_call: z.number().optional(),
});

export type ComponentTimes = z.infer<typeof ComponentTimesSchema>;

export const TranscriptionResponseSchema = z.object({
  status: z.enum(['success', 'empty', 'error', 'formatted']),
  asr_time: z.number().nullable(),
  asr_text: z.string().nullable(),
  llm_time: z.number().nullable(),
  llm_text: z.string().nullable(),
  pipeline_time: z.number().nullable(),
  pipeline_text: z.string().nullable(),
  total_time: z.number(),
  detected_language: z.string().nullable(),
  average_log_prob: z.number().nullable(),
  starts_with_proper_noun: z.boolean().nullable(),
  component_times: ComponentTimesSchema.optional(),
  generated_tokens: z.number().nullable(),
  formatting_divergence_score: z.number().nullable(),
  error_message: z.string().nullable(),
  called_external_asr: z.boolean().nullable(),
  transcript_origin: z.string().nullable(),
  final_context: TranscriptionContextSchema.optional(),
  check_mic: z.boolean().nullable(),
  check_language: z.boolean().nullable(),
});

export type TranscriptionResponse = z.infer<typeof TranscriptionResponseSchema>;

export const ExtractWordsRequestSchema = z.object({
  textbox_text: z.string(),
});

export type ExtractWordsRequest = z.infer<typeof ExtractWordsRequestSchema>;

export const ExtractWordsResponseSchema = z.object({
  content: z.string(),
});

export type ExtractWordsResponse = z.infer<typeof ExtractWordsResponseSchema>;

// ============================================================================
// Error Types
// ============================================================================

export class WisprError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'WisprError';
  }
}

export class WisprAuthError extends WisprError {
  constructor(message: string, details?: unknown) {
    super(message, 'AUTH_ERROR', 401, details);
    this.name = 'WisprAuthError';
  }
}

export class WisprApiError extends WisprError {
  constructor(message: string, statusCode: number, details?: unknown) {
    super(message, 'API_ERROR', statusCode, details);
    this.name = 'WisprApiError';
  }
}

export class WisprValidationError extends WisprError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'WisprValidationError';
  }
}

export class WisprTimeoutError extends WisprError {
  constructor(message = 'Request timed out') {
    super(message, 'TIMEOUT_ERROR', 408);
    this.name = 'WisprTimeoutError';
  }
}
