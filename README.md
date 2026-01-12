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
- **No environment variables required** - pass all config via SDK interface

---

## Installation

```bash
# Using bun
bun add wispr-flow-sdk-unofficial

# Using npm
npm install wispr-flow-sdk-unofficial

# Using pnpm
pnpm add wispr-flow-sdk-unofficial
```

---

## Quick Start

All configuration is passed directly to the SDK - no `.env` file needed:

```typescript
import { WisprClient } from 'wispr-flow-sdk-unofficial';

// Create client with all config in one place
const client = await WisprClient.create({
  // Required: Authentication
  email: 'user@example.com',
  password: 'password123',
  
  // Required: API Configuration
  supabaseUrl: 'https://xxx.supabase.co',
  supabaseAnonKey: 'your-supabase-anon-key',
  basetenUrl: 'https://xxx.api.baseten.co',
  basetenApiKey: 'your-baseten-api-key',
  
  // Optional settings
  apiBaseUrl: 'https://api.wisprflow.ai',  // default
  clientVersion: '1.4.154',                 // default
  timeout: 30000,                           // default (ms)
  debug: false,                             // default
});

// Warmup the service (reduces latency)
await client.warmup();

// Transcribe audio (base64 encoded WAV, 16kHz mono)
const result = await client.transcribe({
  audioData: base64AudioData,
  languages: ['en'],
});

// Use llm_text (formatted) or asr_text (raw)
console.log(result.llm_text || result.asr_text);
```

---

## Configuration Options

| Option | Required | Description |
|--------|----------|-------------|
| `email` | Yes | Wispr Flow account email |
| `password` | Yes | Wispr Flow account password |
| `supabaseUrl` | Yes | Supabase project URL |
| `supabaseAnonKey` | Yes | Supabase anonymous key |
| `basetenUrl` | Yes | Baseten API URL |
| `basetenApiKey` | Yes | Baseten API key |
| `apiBaseUrl` | No | Wispr API URL (default: `https://api.wisprflow.ai`) |
| `clientVersion` | No | Client version to report (default: `1.4.154`) |
| `timeout` | No | Request timeout in ms (default: `30000`) |
| `debug` | No | Enable debug logging (default: `false`) |
| `tokenRefreshBuffer` | No | Seconds before expiry to refresh token (default: `60`) |

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
import { toBase64 } from 'wispr-flow-sdk-unofficial';
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
} from 'wispr-flow-sdk-unofficial';

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
    // Invalid input or missing required config
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
# Set environment variables (for examples only)
export WISPR_EMAIL="your-email"
export WISPR_PASSWORD="your-password"
export SUPABASE_URL="https://xxx.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
export BASETEN_URL="https://xxx.api.baseten.co"
export BASETEN_API_KEY="your-baseten-key"

# Run examples
bun run examples/01-basic-auth.ts
bun run examples/03-transcribe-file.ts path/to/audio.wav
```

---

## API Reference

### WisprClient

| Method | Description |
|--------|-------------|
| `WisprClient.create(config)` | Create authenticated client (recommended) |
| `warmup()` | Warmup transcription service |
| `transcribe(request)` | Transcribe audio to text |
| `getConfig()` | Get client configuration |
| `updateAccessToken(token)` | Update access token |

### WisprAuth (Advanced Usage)

For advanced use cases, you can use `WisprAuth` directly:

```typescript
import { WisprAuth, WisprClient } from 'wispr-flow-sdk-unofficial';

const auth = new WisprAuth({
  supabaseUrl: 'https://xxx.supabase.co',
  supabaseAnonKey: 'your-anon-key',
});

await auth.signIn({ email: 'user@example.com', password: 'password' });

const client = new WisprClient({
  auth,
  basetenUrl: 'https://xxx.api.baseten.co',
  basetenApiKey: 'your-baseten-key',
});
```

| Method | Description |
|--------|-------------|
| `signIn(credentials)` | Sign in with email/password |
| `refreshSession()` | Refresh the access token |
| `signOut()` | Sign out and clear session |
| `getSession()` | Get current session |
| `isSessionExpired(buffer?)` | Check if session is expired |

---

## Development

```bash
# Install dependencies
bun install

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
