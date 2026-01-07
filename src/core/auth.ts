/**
 * Wispr Flow Authentication Module
 *
 * Handles user authentication via Supabase or Wispr API.
 * Supports email/password login and token refresh.
 */

import { z } from 'zod';
import { WisprAuthError, WisprApiError } from '../types';
import { DEFAULT_API_BASE_URL } from './constants';

// ============================================================================
// Types
// ============================================================================

export const SupabaseUserSchema = z.object({
  id: z.string().uuid(),
  aud: z.string(),
  role: z.string(),
  email: z.string().email(),
  email_confirmed_at: z.string().nullable().optional(),
  phone: z.string().optional(),
  confirmed_at: z.string().nullable().optional(),
  last_sign_in_at: z.string().nullable().optional(),
  app_metadata: z.object({
    provider: z.string(),
    providers: z.array(z.string()),
  }),
  user_metadata: z.object({
    email: z.string().email(),
    email_verified: z.boolean(),
    full_name: z.string().optional(),
    phone_verified: z.boolean().optional(),
    sub: z.string().uuid(),
  }),
  identities: z.array(z.unknown()).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type SupabaseUser = z.infer<typeof SupabaseUserSchema>;

export const SupabaseSessionSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  expires_at: z.number(),
  refresh_token: z.string(),
  user: SupabaseUserSchema,
});

export type SupabaseSession = z.infer<typeof SupabaseSessionSchema>;

export const WisprSignInResponseSchema = z.object({
  message: z.string(),
  access_token: z.string(),
  refresh_token: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  onboarding_completed: z.boolean(),
  error: z.string().nullable(),
});

export type WisprSignInResponse = z.infer<typeof WisprSignInResponseSchema>;

export const UserStatusSchema = z.object({
  exists: z.boolean(),
  provider: z.string().optional(),
  verified: z.boolean().optional(),
});

export type UserStatus = z.infer<typeof UserStatusSchema>;

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  userUuid: string;
  email: string;
  expiresAt: number;
  firstName?: string;
  lastName?: string;
}

/**
 * Configuration options for WisprAuth
 * All values must be provided explicitly - no environment variables are read.
 */
export interface WisprAuthOptions {
  /** Supabase URL (required) */
  supabaseUrl: string;
  /** Supabase anonymous key (required) */
  supabaseAnonKey: string;
  /** Wispr API URL (optional, defaults to https://api.wisprflow.ai) */
  wisprApiUrl?: string;
}

// ============================================================================
// Auth Client
// ============================================================================

/**
 * Wispr Flow Authentication Client
 *
 * Provides methods to authenticate users and manage sessions.
 * All configuration must be passed explicitly - no environment variables are read.
 *
 * @example
 * ```typescript
 * const auth = new WisprAuth({
 *   supabaseUrl: 'https://your-project.supabase.co',
 *   supabaseAnonKey: 'your-anon-key',
 * });
 *
 * // Sign in with email/password
 * const session = await auth.signIn({
 *   email: 'user@example.com',
 *   password: 'password123',
 * });
 *
 * console.log('Access token:', session.accessToken);
 * console.log('User ID:', session.userUuid);
 * ```
 */
export class WisprAuth {
  private readonly supabaseUrl: string;
  private readonly supabaseAnonKey: string;
  private readonly wisprApiUrl: string;
  private currentSession: AuthSession | null = null;

  constructor(options: WisprAuthOptions) {
    if (!options.supabaseUrl) {
      throw new WisprAuthError('supabaseUrl is required');
    }
    if (!options.supabaseAnonKey) {
      throw new WisprAuthError('supabaseAnonKey is required');
    }

    this.supabaseUrl = options.supabaseUrl;
    this.supabaseAnonKey = options.supabaseAnonKey;
    this.wisprApiUrl = options.wisprApiUrl ?? DEFAULT_API_BASE_URL;
  }

  /**
   * Get common headers for Supabase requests
   */
  private getSupabaseHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json;charset=UTF-8',
      apikey: this.supabaseAnonKey,
      'x-client-info': 'wispr-flow-sdk/1.0.0',
      'x-supabase-api-version': '2024-01-01',
    };
  }

  /**
   * Check if a user exists by email
   *
   * @param email - User email address
   * @returns User status
   */
  async checkUserStatus(email: string): Promise<UserStatus> {
    const response = await fetch(
      `${this.wisprApiUrl}/user_status?email=${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new WisprApiError(
        `Failed to check user status: ${response.statusText}`,
        response.status
      );
    }

    const data = await response.json();
    return UserStatusSchema.parse(data);
  }

  /**
   * Sign in with email and password using Supabase directly
   *
   * This is the recommended method as it returns the full session
   * including refresh token and user details.
   *
   * @param credentials - Email and password
   * @returns Authentication session
   */
  async signInWithSupabase(credentials: AuthCredentials): Promise<AuthSession> {
    const response = await fetch(`${this.supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: this.getSupabaseHeaders(),
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
        gotrue_meta_security: {},
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error');
      if (response.status === 400) {
        throw new WisprAuthError('Invalid email or password', errorBody);
      }
      throw new WisprAuthError(`Authentication failed: ${response.statusText}`, errorBody);
    }

    const data = await response.json();
    const session = SupabaseSessionSchema.parse(data);

    this.currentSession = {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      userUuid: session.user.id,
      email: session.user.email,
      expiresAt: session.expires_at,
      firstName: session.user.user_metadata.full_name?.split(' ')[0],
      lastName: session.user.user_metadata.full_name?.split(' ').slice(1).join(' '),
    };

    return this.currentSession;
  }

  /**
   * Sign in with email and password using Wispr API
   *
   * Alternative method that goes through Wispr's backend.
   *
   * @param credentials - Email and password
   * @returns Authentication session
   */
  async signInWithWisprApi(credentials: AuthCredentials): Promise<AuthSession> {
    const response = await fetch(`${this.wisprApiUrl}/email/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error');
      if (response.status === 401 || response.status === 400) {
        throw new WisprAuthError('Invalid email or password', errorBody);
      }
      throw new WisprAuthError(`Authentication failed: ${response.statusText}`, errorBody);
    }

    const data = await response.json();
    const result = WisprSignInResponseSchema.parse(data);

    if (result.error) {
      throw new WisprAuthError(result.error);
    }

    // Decode JWT to get user info and expiry
    const tokenPayload = this.decodeJwtPayload(result.access_token);

    this.currentSession = {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      userUuid: tokenPayload.sub,
      email: tokenPayload.email,
      expiresAt: tokenPayload.exp,
      firstName: result.first_name ?? undefined,
      lastName: result.last_name ?? undefined,
    };

    return this.currentSession;
  }

  /**
   * Sign in with email and password (uses Supabase by default)
   *
   * @param credentials - Email and password
   * @returns Authentication session
   */
  async signIn(credentials: AuthCredentials): Promise<AuthSession> {
    return this.signInWithSupabase(credentials);
  }

  /**
   * Refresh the access token using the refresh token
   *
   * @param refreshToken - Optional refresh token (uses current session if not provided)
   * @returns New authentication session
   */
  async refreshSession(refreshToken?: string): Promise<AuthSession> {
    const token = refreshToken ?? this.currentSession?.refreshToken;

    if (!token) {
      throw new WisprAuthError('No refresh token available. Please sign in first.');
    }

    const response = await fetch(`${this.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: this.getSupabaseHeaders(),
      body: JSON.stringify({
        refresh_token: token,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error');
      if (response.status === 400 || response.status === 401) {
        throw new WisprAuthError(
          'Refresh token expired or invalid. Please sign in again.',
          errorBody
        );
      }
      throw new WisprAuthError(`Token refresh failed: ${response.statusText}`, errorBody);
    }

    const data = await response.json();
    const session = SupabaseSessionSchema.parse(data);

    this.currentSession = {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      userUuid: session.user.id,
      email: session.user.email,
      expiresAt: session.expires_at,
      firstName: session.user.user_metadata.full_name?.split(' ')[0],
      lastName: session.user.user_metadata.full_name?.split(' ').slice(1).join(' '),
    };

    return this.currentSession;
  }

  /**
   * Sign out and clear the current session
   */
  async signOut(): Promise<void> {
    if (this.currentSession) {
      try {
        // Optionally revoke the session on the server
        await fetch(`${this.supabaseUrl}/auth/v1/logout`, {
          method: 'POST',
          headers: {
            ...this.getSupabaseHeaders(),
            Authorization: `Bearer ${this.currentSession.accessToken}`,
          },
        });
      } catch {
        // Ignore logout errors, just clear local session
      }
    }

    this.currentSession = null;
  }

  /**
   * Get the current session
   *
   * @returns Current session or null if not signed in
   */
  getSession(): AuthSession | null {
    return this.currentSession;
  }

  /**
   * Check if the current session is expired
   *
   * @param bufferSeconds - Buffer time in seconds before actual expiry (default: 60)
   * @returns True if session is expired or will expire within buffer time
   */
  isSessionExpired(bufferSeconds = 60): boolean {
    if (!this.currentSession) {
      return true;
    }

    const now = Math.floor(Date.now() / 1000);
    return this.currentSession.expiresAt - bufferSeconds <= now;
  }

  /**
   * Get a valid access token, refreshing if necessary
   *
   * @returns Valid access token
   */
  async getValidAccessToken(): Promise<string> {
    if (!this.currentSession) {
      throw new WisprAuthError('Not signed in. Please sign in first.');
    }

    if (this.isSessionExpired()) {
      await this.refreshSession();
    }

    return this.currentSession!.accessToken;
  }

  /**
   * Decode JWT payload (without verification)
   */
  private decodeJwtPayload(token: string): {
    sub: string;
    email: string;
    exp: number;
    iat: number;
    [key: string]: unknown;
  } {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const payload = parts[1];
      if (!payload) {
        throw new Error('Invalid JWT: missing payload');
      }
      // Handle base64url encoding
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = atob(base64);
      return JSON.parse(decoded);
    } catch (error) {
      throw new WisprAuthError('Failed to decode access token', error);
    }
  }
}

/**
 * Create a new auth client instance
 */
export function createAuth(options: WisprAuthOptions): WisprAuth {
  return new WisprAuth(options);
}
