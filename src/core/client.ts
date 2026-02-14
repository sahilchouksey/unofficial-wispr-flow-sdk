import type { ZodType } from 'zod';
import {
  type TranscriptionContext,
  type TranscriptionRequest,
  type TranscriptionResponse,
  TranscriptionResponseSchema,
  type WarmupResponse,
  WarmupResponseSchema,
  WisprApiError,
  WisprAuthError,
  type WisprConfig,
  WisprConfigSchema,
  WisprTimeoutError,
  WisprValidationError,
} from '../types';
import { type Logger, createLogger, createTimeoutSignal, generateUuid } from '../utils';
import { WisprAuth } from './auth';
import {
  DEFAULT_API_BASE_URL,
  DEFAULT_CLIENT_VERSION,
  DEFAULT_TIMEOUT_MS,
  ENDPOINTS,
  WISPR_INFRASTRUCTURE,
} from './constants';

/**
 * Configuration options for WisprClient (advanced usage)
 * For simpler usage, use WisprClient.create() with WisprFlowConfig
 */
export interface WisprClientOptions extends Partial<WisprConfig> {
  /** Supabase JWT access token (required if auth not provided) */
  accessToken?: string;
  /** User UUID from Supabase (required if auth not provided) */
  userUuid?: string;
  /** WisprAuth instance for automatic token refresh */
  auth?: WisprAuth;
  /** Buffer time in seconds before token expiry to trigger refresh (default: 60) */
  tokenRefreshBuffer?: number;
}

/**
 * Simplified configuration for creating WisprClient
 *
 * Only email and password are required! Infrastructure values are
 * automatically configured using the same values as the official
 * Wispr Flow desktop app.
 *
 * @example
 * ```typescript
 * const client = await WisprClient.create({
 *   email: 'user@example.com',
 *   password: 'your-password',
 * });
 * ```
 */
export interface WisprFlowConfig {
  /** Wispr Flow email for authentication (required) */
  email: string;
  /** Wispr Flow password for authentication (required) */
  password: string;
  /** Request timeout in milliseconds (optional, default: 30000) */
  timeout?: number;
  /** Enable debug logging (optional, default: false) */
  debug?: boolean;
  /** Buffer time in seconds before token expiry to trigger refresh (optional, default: 60) */
  tokenRefreshBuffer?: number;
  /** Wispr API base URL (optional, uses default) */
  apiBaseUrl?: string;
  /** Client version to report (optional, uses default) */
  clientVersion?: string;
}

/**
 * Wispr Flow SDK Client
 *
 * Provides methods to interact with the unofficial Wispr Flow API
 * for voice-to-text transcription.
 *
 * @example
 * ```typescript
 * // Simple usage - just email and password!
 * const client = await WisprClient.create({
 *   email: 'user@example.com',
 *   password: 'password123',
 * });
 *
 * await client.warmup();
 * const result = await client.transcribe({ audioData: base64AudioData });
 * console.log(result.pipeline_text);
 * ```
 */
export class WisprClient {
  private config: WisprConfig;
  private readonly logger: Logger;
  private readonly apiBaseUrl: string;
  private readonly basetenUrl: string;
  private readonly basetenApiKey: string;
  private readonly clientVersion: string;
  private readonly auth?: WisprAuth;
  private readonly tokenRefreshBuffer: number;

  constructor(options: WisprClientOptions) {
    // If auth is provided, get tokens from auth session
    if (options.auth) {
      const session = options.auth.getSession();
      if (!session) {
        throw new WisprValidationError(
          'WisprAuth has no active session. Please sign in first.',
          'No session found'
        );
      }
      options.accessToken = session.accessToken;
      options.userUuid = session.userUuid;
      this.auth = options.auth;
    }

    // Validate required fields
    if (!options.accessToken || !options.userUuid) {
      throw new WisprValidationError(
        'Either provide accessToken and userUuid, or provide an authenticated WisprAuth instance',
        'Missing required configuration'
      );
    }

    if (!options.basetenUrl) {
      throw new WisprValidationError('basetenUrl is required', 'Missing basetenUrl');
    }

    if (!options.basetenApiKey) {
      throw new WisprValidationError('basetenApiKey is required', 'Missing basetenApiKey');
    }

    // Validate and parse config
    const parseResult = WisprConfigSchema.safeParse({
      accessToken: options.accessToken,
      userUuid: options.userUuid,
      basetenApiKey: options.basetenApiKey,
      apiBaseUrl: options.apiBaseUrl,
      basetenUrl: options.basetenUrl,
      clientVersion: options.clientVersion,
      timeout: options.timeout,
      debug: options.debug,
    });

    if (!parseResult.success) {
      throw new WisprValidationError('Invalid configuration', parseResult.error.errors);
    }

    this.config = parseResult.data;
    this.logger = createLogger(this.config.debug ?? false);
    this.apiBaseUrl = this.config.apiBaseUrl ?? DEFAULT_API_BASE_URL;
    this.basetenUrl = this.config.basetenUrl!;
    this.basetenApiKey = this.config.basetenApiKey!;
    this.clientVersion = this.config.clientVersion ?? DEFAULT_CLIENT_VERSION;
    this.tokenRefreshBuffer = options.tokenRefreshBuffer ?? 60;

    this.logger.debug('WisprClient initialized', {
      apiBaseUrl: this.apiBaseUrl,
      basetenUrl: this.basetenUrl,
      clientVersion: this.clientVersion,
      userUuid: this.config.userUuid,
      autoRefresh: !!this.auth,
    });
  }

  /**
   * Ensure access token is valid, refresh if needed
   */
  private async ensureValidToken(): Promise<void> {
    if (!this.auth) {
      return; // No auth instance, can't auto-refresh
    }

    if (this.auth.isSessionExpired(this.tokenRefreshBuffer)) {
      this.logger.debug('Token expired or expiring soon, refreshing...');
      try {
        const newSession = await this.auth.refreshSession();
        this.config.accessToken = newSession.accessToken;
        this.logger.debug('Token refreshed successfully');
      } catch (error) {
        this.logger.warn('Token refresh failed', error);
        throw new WisprAuthError('Failed to refresh access token. Please sign in again.', error);
      }
    }
  }

  /**
   * Get common headers for Wispr API requests
   */
  private getWisprHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      Authorization: this.config.accessToken,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    };
  }

  /**
   * Get headers for Baseten API requests
   */
  private getBasetenHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      Authorization: `Api-Key ${this.basetenApiKey}`,
      'Accept-Encoding': 'identity',
    };
  }

  /**
   * Make an HTTP request with error handling
   */
  private async request<T>(url: string, options: RequestInit, schema?: ZodType<T>): Promise<T> {
    const timeout = this.config.timeout ?? DEFAULT_TIMEOUT_MS;

    try {
      this.logger.debug('Making request', { url, method: options.method });

      const response = await fetch(url, {
        ...options,
        signal: createTimeoutSignal(timeout),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new WisprAuthError('Authentication failed. Token may be expired.');
        }
        const errorBody = await response.text().catch(() => 'Unknown error');
        throw new WisprApiError(
          `API request failed: ${response.statusText}`,
          response.status,
          errorBody
        );
      }

      const data = await response.json();

      if (schema) {
        const parseResult = schema.safeParse(data);
        if (!parseResult.success) {
          this.logger.warn('Response validation failed', parseResult.error.errors);
          // Return data anyway, just log the warning
          return data as T;
        }
        return parseResult.data;
      }

      return data as T;
    } catch (error) {
      if (error instanceof WisprApiError || error instanceof WisprAuthError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
          throw new WisprTimeoutError(`Request timed out after ${timeout}ms`);
        }
        throw new WisprApiError(error.message, 0, error);
      }

      throw new WisprApiError('Unknown error occurred', 0, error);
    }
  }

  /**
   * Warmup the transcription service
   *
   * Call this before making transcription requests to reduce latency.
   *
   * @returns Warmup status response
   */
  async warmup(): Promise<WarmupResponse> {
    // Ensure token is valid before making request
    await this.ensureValidToken();

    this.logger.debug('Warming up service');

    const response = await this.request<WarmupResponse>(
      `${this.apiBaseUrl}${ENDPOINTS.WARMUP}`,
      {
        method: 'GET',
        headers: this.getWisprHeaders(),
      },
      WarmupResponseSchema
    );

    this.logger.debug('Warmup complete', response);
    return response;
  }

  /**
   * Transcribe audio to text
   *
   * @param request - Transcription request options
   * @returns Transcription response with text results
   */
  async transcribe(request: TranscriptionRequest = {}): Promise<TranscriptionResponse> {
    // Ensure token is valid before making request
    await this.ensureValidToken();

    const sessionId = generateUuid();
    const transcriptEntityUuid = generateUuid();

    this.logger.debug('Starting transcription', { sessionId });

    // Build the request payload matching the captured API format
    const payload = {
      request: {
        access_token: this.config.accessToken,
        user: {
          uuid: this.config.userUuid,
        },
        metadata: {
          session_id: request.metadata?.session_id ?? sessionId,
          environment: request.metadata?.environment ?? 'production',
          client_platform: request.metadata?.client_platform ?? 'android',
          client_version: request.metadata?.client_version ?? this.clientVersion,
          transcript_entity_uuid: request.metadata?.transcript_entity_uuid ?? transcriptEntityUuid,
        },
        // Audio data - base64 encoded WAV (16kHz mono PCM)
        audio: request.audioData ?? '',
        audio_encoding: 'wav',
        prev_asr_text: request.prevAsrText ?? '',
        context: this.buildContext(request.context),
        languages: request.languages ?? ['en'],
      },
    };

    const response = await this.request<TranscriptionResponse>(
      `${this.basetenUrl}${ENDPOINTS.BASETEN_TRANSCRIBE}`,
      {
        method: 'POST',
        headers: this.getBasetenHeaders(),
        body: JSON.stringify(payload),
      },
      TranscriptionResponseSchema
    );

    this.logger.debug('Transcription complete', {
      status: response.status,
      hasText: !!response.pipeline_text,
      totalTime: response.total_time,
    });

    return response;
  }

  /**
   * Build context object for transcription
   */
  private buildContext(context?: TranscriptionContext): TranscriptionContext {
    return {
      app: context?.app ?? {
        name: null,
        bundle_id: null,
        type: 'other',
        url: null,
      },
      ax_context: context?.ax_context ?? [],
      variable_names: context?.variable_names ?? [],
      file_names: context?.file_names ?? [],
      ocr_context: context?.ocr_context ?? [],
      dictionary_context: context?.dictionary_context ?? [],
      dictionary_replacements: context?.dictionary_replacements ?? {},
      user_identifier: context?.user_identifier ?? null,
      user_first_name: context?.user_first_name ?? null,
      user_last_name: context?.user_last_name ?? null,
      textbox_contents: context?.textbox_contents ?? null,
      content_text: context?.content_text ?? null,
      screenshot: context?.screenshot ?? null,
      content_html: context?.content_html ?? null,
      conversation: context?.conversation ?? null,
    };
  }

  /**
   * Get the current configuration (without sensitive data)
   */
  getConfig(): Omit<WisprConfig, 'accessToken' | 'basetenApiKey'> {
    return {
      userUuid: this.config.userUuid,
      apiBaseUrl: this.config.apiBaseUrl,
      basetenUrl: this.config.basetenUrl,
      clientVersion: this.config.clientVersion,
      timeout: this.config.timeout,
      debug: this.config.debug,
    };
  }

  /**
   * Update the access token (e.g., after token refresh)
   */
  updateAccessToken(newToken: string): void {
    (this.config as { accessToken: string }).accessToken = newToken;
    this.logger.debug('Access token updated');
  }

  /**
   * Create a WisprClient with email/password authentication
   *
   * This is the recommended way to create a client. Only email and password
   * are required - all infrastructure values are automatically configured.
   *
   * @example
   * ```typescript
   * // Simple usage - just email and password!
   * const client = await WisprClient.create({
   *   email: 'user@example.com',
   *   password: 'password123',
   * });
   *
   * // With optional settings
   * const client = await WisprClient.create({
   *   email: 'user@example.com',
   *   password: 'password123',
   *   timeout: 60000,  // 60 second timeout
   *   debug: true,     // enable debug logging
   * });
   *
   * await client.warmup();
   * const result = await client.transcribe({ audioData: base64Audio });
   * ```
   *
   * @param config - Configuration with email and password
   * @returns Authenticated WisprClient instance
   */
  static async create(config: WisprFlowConfig): Promise<WisprClient> {
    // Validate required fields
    if (!config.email) {
      throw new WisprValidationError('email is required', 'Missing email');
    }
    if (!config.password) {
      throw new WisprValidationError('password is required', 'Missing password');
    }

    // Create auth using hardcoded infrastructure values
    const auth = new WisprAuth({
      supabaseUrl: WISPR_INFRASTRUCTURE.SUPABASE_URL,
      supabaseAnonKey: WISPR_INFRASTRUCTURE.SUPABASE_ANON_KEY,
      wisprApiUrl: config.apiBaseUrl ?? DEFAULT_API_BASE_URL,
    });

    // Sign in
    await auth.signIn({
      email: config.email,
      password: config.password,
    });

    // Create client with auth and hardcoded infrastructure values
    return new WisprClient({
      auth,
      apiBaseUrl: config.apiBaseUrl,
      basetenUrl: WISPR_INFRASTRUCTURE.BASETEN_URL,
      basetenApiKey: WISPR_INFRASTRUCTURE.BASETEN_API_KEY,
      clientVersion: config.clientVersion,
      timeout: config.timeout,
      debug: config.debug,
      tokenRefreshBuffer: config.tokenRefreshBuffer,
    });
  }
}
