# Implementation Specification: Voice/Audio Message Generation

This document provides detailed code-level specifications for implementing voice/audio message generation in the telegram-bot repository.

## Prerequisites

The implementation assumes:
1. Access to `/v1/audio/speech` API endpoint (already available in api-gateway)
2. `pydub` library for Python (already in requirements.txt)
3. Admin token for internal API calls (already configured in bot)

## Implementation Phases

### Phase 1: Core Voice Generation Functions

#### Python Implementation (`bot/gpt/voice_utils.py`) - NEW FILE

```python
"""Voice/audio message generation utilities."""
import io
import logging
from typing import Optional

import aiohttp
from pydub import AudioSegment

from config import PROXY_URL, ADMIN_TOKEN

logger = logging.getLogger(__name__)


async def generate_voice_from_text(
    text: str,
    model: str = "tts-1",
    voice: str = "alloy"
) -> Optional[bytes]:
    """
    Generate voice/audio from text using TTS API.

    Args:
        text: Text to convert to speech (max 4096 chars)
        model: TTS model to use (default: "tts-1")
        voice: Voice to use (alloy, echo, fable, onyx, nova, shimmer)

    Returns:
        Audio bytes in OGG/Opus format, or None if generation failed
    """
    # Truncate text if too long
    if len(text) > 4096:
        logger.warning(f"Text truncated from {len(text)} to 4096 characters")
        text = text[:4093] + "..."

    url = f"{PROXY_URL}/v1/audio/speech"
    headers = {
        "Authorization": f"Bearer {ADMIN_TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model,
        "input": text,
        "voice": voice
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=headers, json=payload, timeout=30) as response:
                if response.status == 200:
                    mp3_bytes = await response.read()
                    logger.info(f"Generated voice message: {len(mp3_bytes)} bytes (MP3)")

                    # Convert MP3 to OGG/Opus for Telegram
                    ogg_bytes = convert_mp3_to_ogg(mp3_bytes)
                    logger.info(f"Converted to OGG: {len(ogg_bytes)} bytes")

                    return ogg_bytes
                else:
                    error_text = await response.text()
                    logger.error(f"TTS API error {response.status}: {error_text}")
                    return None

    except Exception as e:
        logger.error(f"Voice generation failed: {e}", exc_info=True)
        return None


def convert_mp3_to_ogg(mp3_bytes: bytes) -> bytes:
    """
    Convert MP3 audio to OGG/Opus format for Telegram.

    Args:
        mp3_bytes: MP3 audio data

    Returns:
        OGG/Opus audio data
    """
    try:
        # Load MP3 from bytes
        audio = AudioSegment.from_mp3(io.BytesIO(mp3_bytes))

        # Export to OGG/Opus
        ogg_buffer = io.BytesIO()
        audio.export(ogg_buffer, format="ogg", codec="libopus")

        return ogg_buffer.getvalue()

    except Exception as e:
        logger.error(f"Audio conversion failed: {e}", exc_info=True)
        # Fallback: return original MP3
        # Telegram might accept it, though OGG is preferred
        return mp3_bytes


def should_generate_voice(user_id: int, message) -> bool:
    """
    Determine if voice message should be generated for this response.

    Args:
        user_id: User ID
        message: Incoming Telegram message

    Returns:
        True if voice should be generated, False otherwise
    """
    # Check persistent voice mode setting
    from services.voice_service import voiceService
    if voiceService.is_voice_mode_enabled(user_id):
        return True

    # Check if replying to user's voice message (auto-voice reply)
    if hasattr(message, 'voice') and message.voice is not None:
        return True

    return False
```

#### Python Voice Service (`services/voice_service.py`) - NEW FILE

```python
"""Voice mode state management service."""
from typing import Dict


class VoiceService:
    """Manages voice mode settings for users."""

    def __init__(self):
        # In-memory storage: user_id -> voice_mode_enabled
        # TODO: Persist to database in production
        self._voice_mode_settings: Dict[int, bool] = {}

    def is_voice_mode_enabled(self, user_id: int) -> bool:
        """Check if voice mode is enabled for user."""
        return self._voice_mode_settings.get(user_id, False)

    def toggle_voice_mode(self, user_id: int) -> bool:
        """
        Toggle voice mode for user.

        Returns:
            New state (True if now enabled, False if now disabled)
        """
        current = self.is_voice_mode_enabled(user_id)
        new_state = not current
        self._voice_mode_settings[user_id] = new_state
        return new_state

    def enable_voice_mode(self, user_id: int) -> None:
        """Enable voice mode for user."""
        self._voice_mode_settings[user_id] = True

    def disable_voice_mode(self, user_id: int) -> None:
        """Disable voice mode for user."""
        self._voice_mode_settings[user_id] = False


# Global instance
voiceService = VoiceService()
```

#### Update `services/__init__.py`

Add to imports:
```python
from services.voice_service import voiceService
```

Add to `__all__`:
```python
__all__ = [
    # ... existing exports ...
    "voiceService",
]
```

### Phase 2: Command Handler

#### Add `/voice` Command (`bot/commands.py`)

Add constants:
```python
# Voice command
VOICE_COMMAND = "voice"
VOICE_TEXT = "🔊 Голос"
```

#### Add Voice Command Handler (`bot/gpt/router.py`)

Add to imports:
```python
from aiogram import F
from aiogram.filters import Command
from bot.gpt.voice_utils import generate_voice_from_text, should_generate_voice
from services import voiceService
```

Add command handler (before text message handlers):
```python
@gptRouter.message(Command("voice"))
async def voice_command_handler(message: Message):
    """Toggle voice response mode for user."""
    user_id = message.from_user.id

    # Toggle voice mode
    new_state = voiceService.toggle_voice_mode(user_id)

    if new_state:
        response_text = """🔊 **Голосовой режим включен**

Теперь бот будет отвечать голосовыми сообщениями в дополнение к тексту.

Для выключения используйте /voice снова."""
    else:
        response_text = """🔇 **Голосовой режим выключен**

Бот будет отвечать только текстом.

Для включения используйте /voice."""

    await message.answer(response_text)
```

### Phase 3: Modify Response Flow

#### Update `handle_gpt_request()` in `bot/gpt/router.py`

Find the section after sending text response (after `await send_markdown_message()`), and add voice generation:

```python
async def handle_gpt_request(message: Message, text: str):
    # ... existing code until after sending markdown message ...

    # After sending text response:
    format_text = format_image_from_request(answer.get("response"))
    image = format_text["image"]

    messages = await send_markdown_message(message, format_text["text"])

    if len(messages) > 1:
        await answer_markdown_file(message, format_text["text"])

    if image is not None:
        await message.answer_photo(image)
        await send_photo_as_file(message, image, "Вот картинка в оригинальном качестве")

    # ====== ADD VOICE GENERATION HERE ======
    # Check if voice response should be generated
    if should_generate_voice(user_id, message):
        try:
            # Generate voice from text (without markdown/formatting)
            # Remove markdown formatting for better TTS
            clean_text = format_text["text"].replace("**", "").replace("*", "").replace("`", "")

            # Limit text length for cost control
            if len(clean_text) > 1000:
                logger.warning(f"Text too long for voice ({len(clean_text)} chars), truncating")
                clean_text = clean_text[:997] + "..."

            voice_bytes = await generate_voice_from_text(clean_text)

            if voice_bytes:
                # Send as voice message
                voice_file = BufferedInputFile(voice_bytes, filename="response.ogg")
                await message.answer_voice(voice_file)
                logger.info(f"Sent voice message to user {user_id}")
            else:
                logger.error(f"Failed to generate voice for user {user_id}")

        except Exception as e:
            logger.error(f"Voice generation error: {e}", exc_info=True)
            # Fail gracefully - text response was already sent
    # ====== END VOICE GENERATION ======

    await asyncio.sleep(0.5)
    await message_loading.delete()

    # ... rest of existing code ...
```

### Phase 4: JavaScript Implementation

#### JavaScript Voice Utils (`js/src/bot/gpt/voice_utils.js`) - NEW FILE

```javascript
import fetch from 'node-fetch';
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough } from 'stream';
import { config } from '../../config.js';

/**
 * Generate voice/audio from text using TTS API
 * @param {string} text - Text to convert to speech (max 4096 chars)
 * @param {string} model - TTS model (default: "tts-1")
 * @param {string} voice - Voice name (alloy, echo, fable, onyx, nova, shimmer)
 * @returns {Promise<Buffer|null>} Audio bytes in OGG format, or null if failed
 */
export async function generateVoiceFromText(text, model = 'tts-1', voice = 'alloy') {
  // Truncate if too long
  if (text.length > 4096) {
    console.warn(`Text truncated from ${text.length} to 4096 characters`);
    text = text.substring(0, 4093) + '...';
  }

  const url = `${config.PROXY_URL}/v1/audio/speech`;
  const headers = {
    'Authorization': `Bearer ${config.ADMIN_TOKEN}`,
    'Content-Type': 'application/json'
  };
  const payload = {
    model,
    input: text,
    voice
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      timeout: 30000
    });

    if (response.ok) {
      const mp3Buffer = await response.buffer();
      console.log(`Generated voice message: ${mp3Buffer.length} bytes (MP3)`);

      // Convert MP3 to OGG/Opus
      const oggBuffer = await convertMp3ToOgg(mp3Buffer);
      console.log(`Converted to OGG: ${oggBuffer.length} bytes`);

      return oggBuffer;
    } else {
      const errorText = await response.text();
      console.error(`TTS API error ${response.status}: ${errorText}`);
      return null;
    }
  } catch (err) {
    console.error('Voice generation failed:', err);
    return null;
  }
}

/**
 * Convert MP3 to OGG/Opus format for Telegram
 * @param {Buffer} mp3Buffer - MP3 audio data
 * @returns {Promise<Buffer>} OGG/Opus audio data
 */
function convertMp3ToOgg(mp3Buffer) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const inputStream = new PassThrough();
    const outputStream = new PassThrough();

    outputStream.on('data', chunk => chunks.push(chunk));
    outputStream.on('end', () => resolve(Buffer.concat(chunks)));
    outputStream.on('error', reject);

    ffmpeg(inputStream)
      .inputFormat('mp3')
      .audioCodec('libopus')
      .format('ogg')
      .on('error', (err) => {
        console.error('Audio conversion failed:', err);
        // Fallback: return original MP3
        resolve(mp3Buffer);
      })
      .pipe(outputStream);

    inputStream.end(mp3Buffer);
  });
}

/**
 * Check if voice should be generated for this response
 * @param {number} userId - User ID
 * @param {object} message - Telegram message object
 * @returns {boolean} True if voice should be generated
 */
export function shouldGenerateVoice(userId, message) {
  // Check persistent voice mode
  if (voiceService.isVoiceModeEnabled(userId)) {
    return true;
  }

  // Auto-voice reply to voice messages
  if (message.voice) {
    return true;
  }

  return false;
}
```

#### JavaScript Voice Service (`js/src/services/voice_service.js`) - NEW FILE

```javascript
/**
 * Voice mode state management service
 */
class VoiceService {
  constructor() {
    // In-memory storage: userId -> voiceModeEnabled
    // TODO: Persist to database in production
    this._voiceModeSettings = new Map();
  }

  /**
   * Check if voice mode is enabled for user
   * @param {number} userId - User ID
   * @returns {boolean} True if enabled
   */
  isVoiceModeEnabled(userId) {
    return this._voiceModeSettings.get(userId) || false;
  }

  /**
   * Toggle voice mode for user
   * @param {number} userId - User ID
   * @returns {boolean} New state (true if now enabled)
   */
  toggleVoiceMode(userId) {
    const current = this.isVoiceModeEnabled(userId);
    const newState = !current;
    this._voiceModeSettings.set(userId, newState);
    return newState;
  }

  /**
   * Enable voice mode for user
   * @param {number} userId - User ID
   */
  enableVoiceMode(userId) {
    this._voiceModeSettings.set(userId, true);
  }

  /**
   * Disable voice mode for user
   * @param {number} userId - User ID
   */
  disableVoiceMode(userId) {
    this._voiceModeSettings.set(userId, false);
  }
}

// Global instance
export const voiceService = new VoiceService();
```

#### Update JavaScript Router (`js/src/bot/gpt/router.js`)

Add imports:
```javascript
import { generateVoiceFromText, shouldGenerateVoice } from './voice_utils.js';
import { voiceService } from '../../services/voice_service.js';
import { InputFile } from 'grammy';
```

Add `/voice` command handler:
```javascript
gptRouter.command('voice', async (ctx) => {
  const userId = ctx.from.id;
  const newState = voiceService.toggleVoiceMode(userId);

  if (newState) {
    await ctx.reply(
      '🔊 **Голосовой режим включен**\n\n' +
      'Теперь бот будет отвечать голосовыми сообщениями в дополнение к тексту.\n\n' +
      'Для выключения используйте /voice снова.',
      { parse_mode: 'Markdown' }
    );
  } else {
    await ctx.reply(
      '🔇 **Голосовой режим выключен**\n\n' +
      'Бот будет отвечать только текстом.\n\n' +
      'Для включения используйте /voice.',
      { parse_mode: 'Markdown' }
    );
  }
});
```

Add voice generation to `handleGptRequest()`:
```javascript
// After sending text response
if (shouldGenerateVoice(userId, message)) {
  try {
    // Clean markdown for better TTS
    const cleanText = respText.replace(/\*\*/g, '').replace(/\*/g, '').replace(/`/g, '');

    // Limit length
    let ttsText = cleanText;
    if (cleanText.length > 1000) {
      console.warn(`Text too long for voice (${cleanText.length} chars), truncating`);
      ttsText = cleanText.substring(0, 997) + '...';
    }

    const voiceBytes = await generateVoiceFromText(ttsText);

    if (voiceBytes) {
      await message.replyWithVoice(new InputFile(voiceBytes, 'response.ogg'));
      console.log(`Sent voice message to user ${userId}`);
    } else {
      console.error(`Failed to generate voice for user ${userId}`);
    }
  } catch (err) {
    console.error('Voice generation error:', err);
    // Fail gracefully
  }
}
```

## Testing

### Test Script (`experiments/test_voice_generation.py`)

```python
"""Test voice generation functionality."""
import asyncio
from bot.gpt.voice_utils import generate_voice_from_text, convert_mp3_to_ogg


async def test_voice_generation():
    """Test generating voice from text."""
    print("Testing voice generation...")

    test_text = "Привет! Это тестовое голосовое сообщение."

    voice_bytes = await generate_voice_from_text(test_text)

    if voice_bytes:
        # Save to file
        with open("experiments/test_voice.ogg", "wb") as f:
            f.write(voice_bytes)
        print(f"✅ Voice generated successfully: {len(voice_bytes)} bytes")
        print("   Saved to experiments/test_voice.ogg")
    else:
        print("❌ Voice generation failed")


if __name__ == "__main__":
    asyncio.run(test_voice_generation())
```

### Test Script (`experiments/test_voice_generation.js`)

```javascript
import { generateVoiceFromText } from '../js/src/bot/gpt/voice_utils.js';
import fs from 'fs/promises';

async function testVoiceGeneration() {
  console.log('Testing voice generation...');

  const testText = 'Привет! Это тестовое голосовое сообщение.';

  const voiceBytes = await generateVoiceFromText(testText);

  if (voiceBytes) {
    await fs.writeFile('experiments/test_voice.ogg', voiceBytes);
    console.log(`✅ Voice generated successfully: ${voiceBytes.length} bytes`);
    console.log('   Saved to experiments/test_voice.ogg');
  } else {
    console.log('❌ Voice generation failed');
  }
}

testVoiceGeneration();
```

## Dependencies

### Python
Already in requirements.txt:
- `pydub~=0.25.1`
- `aiohttp`

### JavaScript
Add to package.json:
```json
{
  "dependencies": {
    "fluent-ffmpeg": "^2.1.2"
  }
}
```

Also requires `ffmpeg` binary installed on system:
```bash
# Ubuntu/Debian
sudo apt-get install ffmpeg

# macOS
brew install ffmpeg
```

## Deployment Checklist

- [ ] Add new Python files to repository
- [ ] Add new JavaScript files to repository
- [ ] Update `services/__init__.py` to export `voiceService`
- [ ] Test voice generation with experiments
- [ ] Test `/voice` command
- [ ] Test auto-voice reply to voice messages
- [ ] Verify audio format compatibility with Telegram
- [ ] Check error handling (API failures, conversion errors)
- [ ] Verify cost management (character limits)
- [ ] Test in both Python and JavaScript implementations
- [ ] Update documentation (README, docs.md)

## Rollout Strategy

1. **Development Testing**: Test with development bot first
2. **Beta Testing**: Enable for limited users
3. **Monitoring**: Watch logs for errors, API failures
4. **Cost Monitoring**: Track TTS API usage and costs
5. **Full Rollout**: Enable for all users once stable
6. **Documentation**: Update user-facing docs with `/voice` command info

## Future Enhancements

1. **Voice Selection**: Add `/voice_settings` command to choose voice (alloy, echo, fable, etc.)
2. **Model Selection**: Support tts-1-hd for higher quality
3. **Language Detection**: Auto-select appropriate voice based on response language
4. **Cost Warnings**: Warn user if response text is very long (high cost)
5. **Database Persistence**: Store voice mode settings in database
6. **Voice History**: Keep track of generated voice messages
7. **Speed Control**: Add playback speed options
8. **Batch Processing**: Generate multiple voice messages in parallel
