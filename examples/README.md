# Wispr Flow SDK Examples

This folder contains examples demonstrating how to use the Wispr Flow SDK.

## Prerequisites

1. Install dependencies from the project root:
   ```bash
   bun install
   ```

2. Set up your credentials (create `.env` file or set environment variables):
   ```bash
   export WISPR_EMAIL="your-email@example.com"
   export WISPR_PASSWORD="your-password"
   ```

## Examples

### 1. Basic Authentication (`01-basic-auth.ts`)
Demonstrates how to authenticate with the Wispr Flow API using email/password.

```bash
bun run examples/01-basic-auth.ts
```

### 2. Auto Token Refresh (`02-auto-refresh.ts`)
Shows how to use the SDK with automatic token refresh for long-running applications.

```bash
bun run examples/02-auto-refresh.ts
```

### 3. Transcribe Audio File (`03-transcribe-file.ts`)
Transcribe a WAV audio file to text.

```bash
bun run examples/03-transcribe-file.ts path/to/audio.wav
```

### 4. Microphone Recording (`04-microphone-browser/`)
A browser-based example that records from the microphone and transcribes in real-time.

```bash
bun run examples/04-microphone-browser/server.ts
# Open http://localhost:3001 in your browser
```

### 5. Error Handling (`05-error-handling.ts`)
Demonstrates proper error handling patterns with the SDK.

```bash
bun run examples/05-error-handling.ts
```

## Audio Format Requirements

The Wispr Flow API expects audio in the following format:
- **Format:** WAV (PCM)
- **Sample Rate:** 16000 Hz
- **Channels:** Mono (1 channel)
- **Bit Depth:** 16-bit

You can convert audio files using ffmpeg:
```bash
ffmpeg -i input.mp3 -ar 16000 -ac 1 -acodec pcm_s16le output.wav
```

## Notes

- All examples use the SDK from the parent directory (`../src`)
- Make sure to build the SDK first: `bun run build`
- Credentials are loaded from environment variables for security
