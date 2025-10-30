# Design: Voice/Audio Message Generation Support (Issue #19)

## Overview
Add support for the Telegram bot to generate and send voice/audio messages as responses to users.

## Current Architecture

### Existing Components
1. **API Gateway**: Has `/v1/audio/speech` endpoint (TTS)
   - Input: `{ model: "tts-1", input: "text", voice: "alloy" }`
   - Output: MP3 audio file
   - Cost: 0.5 tokens per character

2. **Telegram Bot** (Python & JavaScript):
   - Handles incoming voice messages (transcription)
   - Does NOT currently generate voice responses

## Proposed Solution

### Feature Design: Voice Response Mode

#### User Interface Options

**Option 1: Toggle Command (Recommended)**
- Add `/voice` command to toggle voice response mode on/off
- When enabled, bot responds with both text and voice messages
- Stored in user settings/state

**Option 2: Per-Message Command**
- Add `/tts <text>` command to generate voice from specific text
- User explicitly requests TTS for each message

**Option 3: Automatic Voice Reply**
- When user sends voice message, bot responds with voice
- Mirrors user's communication preference

**Chosen Approach: Combination of Options 1 and 3**
- Default: text-only responses
- `/voice` toggles persistent voice mode for user
- Auto-voice: if user sends voice, next response includes voice (one-time)

### Implementation Details

#### 1. New State Management
```python
# Python
StateTypes.VoiceMode = "voice_mode"

# Storage: user_id -> bool (voice_mode_enabled)
voice_mode_settings = {}
```

#### 2. New Command Handler
```python
# /voice command handler
@router.message(Command("voice"))
async def voice_command_handler(message: Message):
    user_id = message.from_user.id
    current = voice_mode_settings.get(user_id, False)
    new_state = not current
    voice_mode_settings[user_id] = new_state

    if new_state:
        await message.answer("🔊 Голосовой режим включен. Ответы будут приходить голосом.")
    else:
        await message.answer("🔇 Голосовой режим выключен. Ответы будут текстовые.")
```

#### 3. TTS Integration Function
```python
async def generate_voice_message(text: str, user_id: int) -> bytes:
    """
    Generate voice message using API Gateway TTS endpoint

    Args:
        text: Text to convert to speech
        user_id: User ID for token billing

    Returns:
        Audio bytes (MP3 format)
    """
    url = f"{PROXY_URL}/v1/audio/speech"

    # Use admin token for internal API calls
    headers = {
        "Authorization": f"Bearer {ADMIN_TOKEN}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "tts-1",
        "input": text[:4096],  # Limit text length
        "voice": "alloy"  # TODO: make voice selectable
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(url, headers=headers, json=payload) as resp:
            if resp.status == 200:
                return await resp.read()
            else:
                error = await resp.text()
                raise Exception(f"TTS API error: {error}")
```

#### 4. Modified Response Flow
```python
async def handle_gpt_request(message: Message, text: str):
    # ... existing GPT request logic ...

    # After getting text response:
    response_text = answer.get("response")

    # Send text response
    await send_markdown_message(message, response_text)

    # Check if voice mode is enabled
    user_id = message.from_user.id
    should_send_voice = (
        voice_mode_settings.get(user_id, False) or  # Persistent mode
        isinstance(message, Message) and message.voice  # Auto-reply to voice
    )

    if should_send_voice:
        try:
            # Generate and send voice
            audio_bytes = await generate_voice_message(response_text, user_id)

            # Send as voice message
            voice_file = BufferedInputFile(audio_bytes, filename="response.ogg")
            await message.answer_voice(voice_file)

        except Exception as e:
            logging.error(f"Voice generation failed: {e}")
            # Fail gracefully - text was already sent
```

### Technical Considerations

#### 1. Voice Format
- API returns MP3, but Telegram voice messages use OGG/Opus
- **Solution**: Convert MP3 to OGG using `pydub` (already in requirements)

```python
from pydub import AudioSegment
import io

def convert_mp3_to_ogg(mp3_bytes: bytes) -> bytes:
    """Convert MP3 to OGG/Opus format for Telegram"""
    audio = AudioSegment.from_mp3(io.BytesIO(mp3_bytes))
    ogg_buffer = io.BytesIO()
    audio.export(ogg_buffer, format="ogg", codec="libopus")
    return ogg_buffer.getvalue()
```

#### 2. Text Length Limits
- Long responses need truncation or chunking
- OpenAI TTS has ~4096 character limit
- **Solution**: Truncate with ellipsis or split into multiple voice messages

#### 3. Cost Management
- Voice generation costs 0.5 tokens/character
- Long responses could be expensive
- **Solution**: Add warning if text > 1000 chars, ask user to confirm

#### 4. Error Handling
- TTS API failures should not break text response
- Always send text first, then voice
- Log errors for debugging

#### 5. Voice Selection
- Currently hardcoded to "alloy"
- **Future enhancement**: Add `/voice_settings` to choose voice (alloy, echo, fable, onyx, nova, shimmer)

### File Changes Required

#### Python Implementation (`/bot/gpt/router.py`)
1. Import voice-related utilities
2. Add voice mode state storage
3. Add `/voice` command handler
4. Add `generate_voice_message()` function
5. Add `convert_mp3_to_ogg()` function
6. Modify `handle_gpt_request()` to conditionally send voice

#### JavaScript Implementation (`/js/src/bot/gpt/router.js`)
1. Same structure as Python
2. Use `node-fetch` for API calls
3. Use `fluent-ffmpeg` for audio conversion

### Testing Strategy

#### Unit Tests
1. Test voice mode toggle
2. Test TTS API integration
3. Test audio format conversion
4. Test error handling (API failures)

#### Integration Tests
1. Test end-to-end voice generation flow
2. Test voice mode persistence
3. Test auto-voice reply to voice messages

#### Manual Testing
1. Send `/voice` command, verify mode toggles
2. Send text message in voice mode, verify voice response
3. Send voice message, verify bot replies with voice once
4. Test with long text (>1000 chars)
5. Test error scenarios (API down, no balance)

## Implementation Plan

1. **Phase 1**: Core voice generation
   - Implement `generate_voice_message()` function
   - Add audio format conversion
   - Add basic error handling

2. **Phase 2**: Command and state management
   - Add `/voice` command
   - Implement voice mode toggle state
   - Add auto-voice reply logic

3. **Phase 3**: Polish and testing
   - Add comprehensive error handling
   - Create test scripts
   - Test both Python and JavaScript implementations
   - Add logging and monitoring

4. **Phase 4**: Documentation
   - Update docs.md with voice examples
   - Add usage instructions
   - Update README if needed

## Future Enhancements
1. Voice selection settings (`/voice_settings`)
2. Voice model selection (tts-1 vs tts-1-hd)
3. Voice cloning (if API supports)
4. Speed/pitch controls
5. Multi-language voice support
6. Voice history/playback

## Risk Mitigation
1. **High cost**: Limit voice length, add cost warnings
2. **API failures**: Always send text first, voice is optional
3. **Format issues**: Robust audio conversion with fallbacks
4. **State persistence**: Use existing state service patterns
