# Media Generation API for Deep Assistant

**OpenAI-compatible API specification for images, music, video and more**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![OpenAPI 3.1](https://img.shields.io/badge/OpenAPI-3.1-green.svg)](https://www.openapis.org/)

## Quick Start

This repository contains a comprehensive OpenAI-compatible API specification for media generation services, including images, audio (speech and transcription), music, and video.

### Files

- **[media-api-spec.yaml](media-api-spec.yaml)** - Complete OpenAPI 3.1 specification
- **[MEDIA_API.md](MEDIA_API.md)** - Full documentation with examples and implementation guide

## What's Inside

### Supported Media Types

#### 🖼️ Images
- **Generation**: Create images from text prompts
- **Editing**: Modify existing images with AI
- **Variations**: Generate similar versions of images

**Supported Providers**: DALL-E 2/3, GPT-Image-1, Midjourney, Flux, Stable Diffusion

#### 🎵 Audio
- **Text-to-Speech**: Convert text to natural-sounding audio
- **Speech-to-Text**: Transcribe audio with speaker identification
- **Translation**: Translate audio to English

**Supported Providers**: OpenAI (TTS-1, Whisper, GPT-4o models)

#### 🎼 Music
- **Music Generation**: Create original music from text descriptions
- **Style Control**: Specify genre, mood, and instrumentation

**Supported Providers**: Suno AI

#### 🎬 Video (Planned)
- **Text-to-Video**: Generate videos from descriptions
- **Image-to-Video**: Animate still images

**Planned Providers**: RunwayML, Stability AI

## API Overview

### Base URL
```
https://api.example.com/v1
```

### Authentication
```bash
# API Key
curl -H "X-API-Key: your-api-key" ...

# Bearer Token
curl -H "Authorization: Bearer your-token" ...
```

### Quick Examples

#### Generate an Image
```bash
curl https://api.example.com/v1/images/generations \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A serene mountain landscape at sunset",
    "model": "gpt-image-1",
    "size": "1536x1024",
    "quality": "high"
  }'
```

#### Transcribe Audio
```bash
curl https://api.example.com/v1/audio/transcriptions \
  -H "Authorization: Bearer $API_KEY" \
  -F file="@meeting.mp3" \
  -F model="gpt-4o-transcribe" \
  -F response_format="diarized_json"
```

#### Generate Speech
```bash
curl https://api.example.com/v1/audio/speech \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini-tts",
    "input": "Welcome to our service!",
    "voice": "alloy"
  }' \
  --output welcome.mp3
```

#### Create Music
```bash
curl https://api.example.com/v1/music/generations \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Upbeat electronic dance music with heavy bass",
    "duration": 120,
    "style": "electronic"
  }'
```

## Key Features

### 🔄 Provider Abstraction
Switch between different AI providers seamlessly using a unified interface. The API automatically handles provider-specific quirks and normalizes responses.

### 📡 Streaming Support
Progressive generation for images and audio, allowing you to show users partial results as they're created.

### 🎯 Async Task Management
Long-running operations (music, video) use task-based processing with status polling.

### ⚡ Auto Failover
Automatic fallback to alternative providers when the primary provider fails.

### 📊 Usage Tracking
Built-in token and cost tracking for all operations.

## Integration

### For Developers

Use this specification to:
1. **Build client SDKs** compatible with OpenAI libraries
2. **Integrate into existing applications** that use OpenAI APIs
3. **Switch providers** without changing application code

### For API Providers

Implement this specification to:
1. **Offer OpenAI-compatible endpoints** for easy adoption
2. **Support multiple AI providers** with unified routing
3. **Enable seamless migration** for OpenAI users

### For the Deep Assistant Ecosystem

This specification is designed to integrate with:
- **[API Gateway](https://github.com/deep-assistant/api-gateway)** - Central routing and failover
- **[Telegram Bot](https://github.com/deep-assistant/telegram-bot)** - User-facing media generation
- **[GPTutor](https://github.com/deep-assistant/GPTutor)** - Educational platform with image generation
- **[Web Capture](https://github.com/deep-assistant/web-capture)** - Content capture with media processing

## Documentation

### Full Documentation
See **[MEDIA_API.md](MEDIA_API.md)** for complete documentation including:
- Detailed endpoint specifications
- Request/response examples in multiple languages
- Implementation guide for API Gateway
- Error handling and best practices
- Provider integration patterns
- Database schemas
- Monitoring and observability

### OpenAPI Specification
See **[media-api-spec.yaml](media-api-spec.yaml)** for the machine-readable API specification.

You can:
- Generate client SDKs using [OpenAPI Generator](https://openapi-generator.tech/)
- Import into API testing tools like [Postman](https://www.postman.com/) or [Insomnia](https://insomnia.rest/)
- Generate documentation with [Swagger UI](https://swagger.io/tools/swagger-ui/)
- Validate requests/responses automatically

## Usage with OpenAI SDKs

This API is compatible with official OpenAI SDKs. Just change the base URL:

### Python
```python
from openai import OpenAI

client = OpenAI(
    api_key="your-api-key",
    base_url="https://api.example.com/v1"
)

# Use as normal
response = client.images.generate(
    prompt="A beautiful sunset",
    model="gpt-image-1"
)
```

### Node.js
```javascript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'your-api-key',
  baseURL: 'https://api.example.com/v1'
});

// Use as normal
const response = await client.images.generate({
  prompt: 'A beautiful sunset',
  model: 'gpt-image-1'
});
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/images/generations` | POST | Generate images from text |
| `/v1/images/edits` | POST | Edit/extend existing images |
| `/v1/images/variations` | POST | Create image variations |
| `/v1/audio/speech` | POST | Text-to-speech generation |
| `/v1/audio/transcriptions` | POST | Speech-to-text transcription |
| `/v1/audio/translations` | POST | Translate audio to English |
| `/v1/music/generations` | POST | Generate music (async) |
| `/v1/music/generations/{id}` | GET | Get music generation status |
| `/v1/video/generations` | POST | Generate video (async, planned) |

## Provider Comparison

### Image Generation

| Feature | DALL-E 2 | DALL-E 3 | GPT-Image-1 | Midjourney | Flux |
|---------|----------|----------|-------------|------------|------|
| Max Resolution | 1024x1024 | 1792x1024 | 4096x4096 | 2048x2048 | 1024x1024 |
| Multiple Images | ✅ (1-10) | ❌ (1 only) | ✅ (1-10) | ✅ | ✅ |
| Streaming | ❌ | ❌ | ✅ | ❌ | ✅ |
| Transparent BG | ❌ | ❌ | ✅ | ❌ | ❌ |
| Editing | ✅ | ❌ | ✅ | ✅ | ❌ |
| Speed | Fast | Medium | Medium | Slow | Very Fast |
| Cost | $ | $$ | $$$ | $$ | $ |

### Audio Models

| Feature | TTS-1 | TTS-1-HD | GPT-4o-TTS | Whisper-1 | GPT-4o-Transcribe |
|---------|-------|----------|------------|-----------|-------------------|
| Quality | Standard | High | Very High | Good | Excellent |
| Voices | 6 | 6 | 11 | N/A | N/A |
| Streaming | ✅ | ✅ | ✅ | N/A | ✅ |
| Diarization | N/A | N/A | N/A | ❌ | ✅ |
| Speed | Very Fast | Fast | Medium | Fast | Medium |
| Cost | $ | $$ | $$$ | $ | $$$ |

## Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Image Generation | ✅ Ready | Full OpenAI compatibility |
| Image Editing | ✅ Ready | Supports GPT-Image-1, DALL-E 2 |
| Image Variations | ✅ Ready | DALL-E 2 only |
| Text-to-Speech | ✅ Ready | Multiple voices and formats |
| Speech-to-Text | ✅ Ready | With diarization support |
| Audio Translation | ✅ Ready | Whisper-based |
| Music Generation | ✅ Ready | Async task-based |
| Video Generation | 🚧 Planned | Specification ready |

## Roadmap

### Phase 1: Core Media APIs ✅
- [x] OpenAPI 3.1 specification
- [x] Images (generation, editing, variations)
- [x] Audio (speech, transcription, translation)
- [x] Music generation
- [x] Video generation specification

### Phase 2: API Gateway Integration 🚧
- [ ] Implement provider abstraction layer
- [ ] Add failover logic
- [ ] Implement streaming endpoints
- [ ] Add task management for async operations
- [ ] Set up monitoring and logging

### Phase 3: Provider Integrations 🚧
- [ ] OpenAI (DALL-E, Whisper, TTS)
- [ ] Midjourney API integration
- [ ] Flux API integration
- [ ] Suno AI integration
- [ ] RunwayML integration

### Phase 4: Advanced Features 📋
- [ ] Batch processing
- [ ] Webhook notifications for async tasks
- [ ] Advanced caching
- [ ] CDN integration for media delivery
- [ ] Cost optimization strategies

### Phase 5: Client Libraries 📋
- [ ] Python SDK
- [ ] Node.js SDK
- [ ] Go SDK
- [ ] Ruby SDK

## Architecture Integration

This media API specification fits into the Deep Assistant architecture:

```
┌─────────────────┐
│  Client Apps    │
│ (Bot, Web, App) │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  API Gateway    │◄─── This Specification
│  (Media Router) │
└────────┬────────┘
         │
    ┌────┴─────┬─────────┬──────────┐
    ↓          ↓         ↓          ↓
┌────────┐ ┌────────┐ ┌───────┐ ┌────────┐
│ OpenAI │ │Midjourney│ │ Suno │ │Runway │
│Provider│ │Provider │ │ AI   │ │  ML   │
└────────┘ └────────┘ └───────┘ └────────┘
```

## Testing

### Validate OpenAPI Specification

```bash
# Using openapi-generator-cli
npx @openapitools/openapi-generator-cli validate -i media-api-spec.yaml

# Using swagger-cli
npx swagger-cli validate media-api-spec.yaml
```

### Generate Mock Server

```bash
# Using Prism
npx @stoplight/prism-cli mock media-api-spec.yaml
```

### Generate Documentation

```bash
# Using Redoc
npx @redocly/cli build-docs media-api-spec.yaml

# Using Swagger UI
docker run -p 8080:8080 -e SWAGGER_JSON=/spec/media-api-spec.yaml \
  -v $(pwd):/spec swaggerapi/swagger-ui
```

## Contributing

We welcome contributions! Please:

1. **Check existing issues** or create a new one
2. **Follow OpenAPI standards** and OpenAI conventions
3. **Add examples** for new features
4. **Update documentation** in both YAML and Markdown
5. **Test your changes** with validation tools

See the main [CONTRIBUTING](https://github.com/deep-assistant/master-plan/blob/main/CONTRIBUTING.md) guide for more details.

## License

This specification is released under the MIT License. See [LICENSE](LICENSE) for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/deep-assistant/master-plan/issues)
- **Discussions**: [GitHub Discussions](https://github.com/deep-assistant/master-plan/discussions)
- **Documentation**: [MEDIA_API.md](MEDIA_API.md)

## Related Projects

- **[master-plan](https://github.com/deep-assistant/master-plan)** - Main repository and roadmap
- **[api-gateway](https://github.com/deep-assistant/api-gateway)** - OpenAI-compatible API gateway
- **[telegram-bot](https://github.com/deep-assistant/telegram-bot)** - Telegram bot with media features
- **[GPTutor](https://github.com/deep-assistant/GPTutor)** - Educational AI with image generation
- **[web-capture](https://github.com/deep-assistant/web-capture)** - Web page capture service

## Acknowledgments

This specification is based on:
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [OpenAPI 3.1 Specification](https://spec.openapis.org/oas/v3.1.0)
- Community feedback and best practices

## See Also

- [OpenAI Images API](https://platform.openai.com/docs/api-reference/images)
- [OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [OpenAI API Best Practices](https://platform.openai.com/docs/guides/production-best-practices)
- [Suno AI](https://www.suno.ai/)
- [Midjourney](https://www.midjourney.com/)
- [Stability AI](https://stability.ai/)

---

**Built with ❤️ by the Deep Assistant team**

For questions or support, please open an issue or discussion on GitHub.
