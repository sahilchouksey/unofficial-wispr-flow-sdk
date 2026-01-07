# Unofficial Wispr Flow SDK

Unofficial TypeScript SDK for the Wispr Flow voice-to-text API.

```
+-------------------+     +--------------------+     +------------------+
|  Your Application |---->|  Unofficial SDK    |---->|  Wispr Flow API  |
+-------------------+     +--------------------+     +------------------+
                                |
                                v
                          +-------------+
                          |  Supabase   |
                          |  Auth       |
                          +-------------+
```

---

## Disclaimer

- **Unofficial**: This is an unofficial library. It is not affiliated with, endorsed by, or connected to Wispr Inc. or Wispr Flow.
- **No Warranty**: This is open source software distributed under the MIT License. No warranty or technical support is provided. Use at your own risk.
- **Reverse Engineered**: This library uses a reverse-engineered API that is not officially documented. The API may change at any time without notice.
- **Terms of Service**: Users are responsible for reviewing and complying with Wispr Flow's Terms of Service.

---

## Features

- Full authentication support via Supabase (email/password)
- Automatic token refresh for long-running applications
- Voice-to-text transcription with the Wispr Flow pipeline
- TypeScript with full type safety (Zod schemas)
- Multiple language support
- Context-aware transcription (app context, dictionary, OCR)

---

## Installation

```bash
# Using bun
bun add unofficial-wispr-flow-sdk

# Using npm
npm install unofficial-wispr-flow-sdk

# Using pnpm
pnpm add unofficial-wispr-flow-sdk
```

---

## Environment Setup

This SDK requires environment variables for API configuration. Create a `.env` file:

```bash
# Required - User credentials
WISPR_EMAIL=your-email@example.com
WISPR_PASSWORD=your-password

# Required - API configuration (obtain these values separately)
SUPABASE_URL=
SUPABASE_ANON_KEY=
BASETEN_URL=
BASETEN_API_KEY=

# Optional
WISPR_API_URL=https://api.wisprflow.ai
```

---

## Quick Start

```typescript
import { WisprAuth, WisprClient } from 'unofficial-wispr-flow-sdk';

// 1. Authenticate
const auth = new WisprAuth();
const session = await auth.signIn({
  email: process.env.WISPR_EMAIL,
  password: process.env.WISPR_PASSWORD,
});

// 2. Create client with auto-refresh
const client = new WisprClient({ auth });

// 3. Warmup the service (reduces latency)
await client.warmup();

// 4. Transcribe audio (base64 encoded WAV, 16kHz mono)
const result = await client.transcribe({
  audioData: base64AudioData,
  languages: ['en'],
});

// Use llm_text (formatted) or asr_text (raw)
console.log(result.llm_text || result.asr_text);
```

---

## Authentication

The SDK supports authentication via Supabase. You can sign in with email/password:

```typescript
import { WisprAuth } from 'unofficial-wispr-flow-sdk';

const auth = new WisprAuth();

// Check if user exists
const status = await auth.checkUserStatus('user@example.com');
console.log(status); // { exists: true, provider: 'email', verified: true }

// Sign in
const session = await auth.signIn({
  email: 'user@example.com',
  password: 'password123',
});

console.log(session.accessToken);  // JWT token
console.log(session.userUuid);     // User UUID
console.log(session.expiresAt);    // Token expiry timestamp

// Refresh token manually (or use auto-refresh with WisprClient)
const newSession = await auth.refreshSession();

// Sign out
await auth.signOut();
```

---

## Client Options

### Manual Token Management

```typescript
const client = new WisprClient({
  accessToken: 'your-jwt-token',
  userUuid: 'your-user-uuid',
  timeout: 30000,  // Request timeout in ms (default: 30000)
  debug: true,     // Enable debug logging
});
```

### Automatic Token Refresh

```typescript
const auth = new WisprAuth();
await auth.signIn({ email, password });

const client = new WisprClient({
  auth,                    // Pass auth instance for auto-refresh
  tokenRefreshBuffer: 300, // Refresh 5 minutes before expiry (default: 60)
  debug: true,
});
```

---

## Transcription

### Basic Transcription

```typescript
const result = await client.transcribe({
  audioData: base64AudioData,  // Base64 encoded WAV (16kHz, mono, PCM)
  languages: ['en'],           // ISO 639-1 language codes
});

console.log(result.llm_text);          // Formatted text (use this)
console.log(result.asr_text);          // Raw ASR output (fallback)
console.log(result.detected_language); // Detected language
console.log(result.total_time);        // Processing time in seconds
```

### With Context

```typescript
const result = await client.transcribe({
  audioData: base64AudioData,
  languages: ['en'],
  context: {
    app: {
      name: 'My App',
      bundle_id: 'com.example.myapp',
      type: 'other',
    },
    dictionary_context: ['technical', 'terms', 'here'],
    user_first_name: 'John',
    user_last_name: 'Doe',
  },
  prevAsrText: 'Previous transcription for context',
});
```

### Response Structure

```typescript
interface TranscriptionResponse {
  status: 'success' | 'empty' | 'error' | 'formatted';
  llm_text: string | null;         // Formatted text (recommended)
  asr_text: string | null;         // Raw ASR output
  pipeline_text: string | null;    // Legacy field (usually null)
  asr_time: number | null;         // ASR processing time
  llm_time: number | null;         // LLM processing time
  total_time: number;              // Total processing time
  detected_language: string | null;
  error_message: string | null;
}
```

---

## Audio Requirements

The Wispr Flow API expects audio in the following format:

| Property    | Value           |
|-------------|-----------------|
| Format      | WAV (PCM)       |
| Sample Rate | 16000 Hz        |
| Channels    | Mono (1)        |
| Bit Depth   | 16-bit          |
| Encoding    | Base64          |

### Converting Audio with FFmpeg

```bash
ffmpeg -i input.mp3 -ar 16000 -ac 1 -acodec pcm_s16le output.wav
```

### Converting in Code

```typescript
import { toBase64 } from 'unofficial-wispr-flow-sdk';
import { readFile } from 'fs/promises';

const audioBuffer = await readFile('audio.wav');
const base64Audio = toBase64(audioBuffer);
```

---

## Error Handling

The SDK provides specific error classes for different failure modes:

```typescript
import {
  WisprAuthError,
  WisprApiError,
  WisprValidationError,
  WisprTimeoutError,
} from 'unofficial-wispr-flow-sdk';

try {
  await client.transcribe({ audioData });
} catch (error) {
  if (error instanceof WisprAuthError) {
    // Authentication failed - token expired or invalid
    console.error('Auth error:', error.message);
  } else if (error instanceof WisprApiError) {
    // API request failed
    console.error('API error:', error.message, error.statusCode);
  } else if (error instanceof WisprTimeoutError) {
    // Request timed out
    console.error('Timeout:', error.message);
  } else if (error instanceof WisprValidationError) {
    // Invalid input
    console.error('Validation error:', error.message);
  }
}
```

---

## Examples

See the [examples](./examples) directory for complete usage examples:

| Example | Description |
|---------|-------------|
| [01-basic-auth.ts](./examples/01-basic-auth.ts) | Basic authentication flow |
| [02-auto-refresh.ts](./examples/02-auto-refresh.ts) | Automatic token refresh |
| [03-transcribe-file.ts](./examples/03-transcribe-file.ts) | Transcribe audio files |
| [04-error-handling.ts](./examples/04-error-handling.ts) | Error handling patterns |
| [05-microphone-browser](./examples/05-microphone-browser/) | Browser microphone recording |

### Running Examples

```bash
# Set up environment variables in .env file first
cp .env.example .env
# Edit .env with your credentials

# Run examples
bun run examples/01-basic-auth.ts
bun run examples/03-transcribe-file.ts path/to/audio.wav
```

---

## API Reference

### WisprAuth

| Method | Description |
|--------|-------------|
| `signIn(credentials)` | Sign in with email/password |
| `signInWithSupabase(credentials)` | Sign in via Supabase directly |
| `signInWithWisprApi(credentials)` | Sign in via Wispr API |
| `refreshSession()` | Refresh the access token |
| `signOut()` | Sign out and clear session |
| `getSession()` | Get current session |
| `isSessionExpired(buffer?)` | Check if session is expired |
| `getValidAccessToken()` | Get valid token, refreshing if needed |
| `checkUserStatus(email)` | Check if user exists |

### WisprClient

| Method | Description |
|--------|-------------|
| `warmup()` | Warmup transcription service |
| `transcribe(request)` | Transcribe audio to text |
| `getConfig()` | Get client configuration |
| `updateAccessToken(token)` | Update access token |

---

## Development

```bash
# Install dependencies
bun install

# Set up environment
cp .env.example .env
# Edit .env with your values

# Run type check
bun run typecheck

# Build
bun run build

# Run examples
bun run examples/01-basic-auth.ts
```

---

## Contributing

Contributions are welcome. Please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Note**: This SDK is unofficial and not affiliated with Wispr Inc.
