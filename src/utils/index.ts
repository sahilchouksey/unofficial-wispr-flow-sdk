/**
 * Generate a UUID v4
 */
export function generateUuid(): string {
  return crypto.randomUUID();
}

/**
 * Create an abort signal with timeout
 */
export function createTimeoutSignal(timeoutMs: number): AbortSignal {
  return AbortSignal.timeout(timeoutMs);
}

/**
 * Base64 encode a string or buffer
 */
export function toBase64(data: string | ArrayBuffer | Uint8Array): string {
  if (typeof data === "string") {
    return btoa(data);
  }
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

/**
 * Base64 decode to string
 */
export function fromBase64(base64: string): string {
  return atob(base64);
}

/**
 * Base64 decode to Uint8Array
 */
export function fromBase64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Simple debug logger
 */
export function createLogger(debug: boolean) {
  return {
    debug: (...args: unknown[]) => {
      if (debug) {
        console.debug("[WisprSDK]", ...args);
      }
    },
    info: (...args: unknown[]) => {
      if (debug) {
        console.info("[WisprSDK]", ...args);
      }
    },
    warn: (...args: unknown[]) => {
      console.warn("[WisprSDK]", ...args);
    },
    error: (...args: unknown[]) => {
      console.error("[WisprSDK]", ...args);
    },
  };
}

export type Logger = ReturnType<typeof createLogger>;

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
  } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 1000, maxDelayMs = 10000 } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        break;
      }

      const delay = Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
      await sleep(delay);
    }
  }

  throw lastError;
}
