# Media Generation API Specification

OpenAI-compatible API specification for generating images, music, video and more using various AI providers.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [API Endpoints](#api-endpoints)
  - [Image Generation](#image-generation)
  - [Image Editing](#image-editing)
  - [Image Variations](#image-variations)
  - [Text-to-Speech](#text-to-speech)
  - [Speech-to-Text](#speech-to-text)
  - [Audio Translation](#audio-translation)
  - [Music Generation](#music-generation)
  - [Video Generation](#video-generation)
- [Provider Support](#provider-support)
- [Authentication](#authentication)
- [Usage Examples](#usage-examples)
- [Implementation Guide](#implementation-guide)
- [Error Handling](#error-handling)

## Overview

This API specification provides a unified, OpenAI-compatible interface for various media generation services. It enables developers to:

- Generate images from text prompts
- Edit and create variations of existing images
- Convert text to speech
- Transcribe audio to text with speaker diarization
- Translate audio to English
- Generate music from descriptions
- Create videos from text or images

The API follows OpenAI's standards, making it easy to integrate with existing applications and switch between different providers seamlessly.

## Features

### Image Generation
- Multiple AI models: DALL-E 2, DALL-E 3, GPT-Image-1, Midjourney, Flux, Stable Diffusion
- Flexible sizing and quality options
- Streaming support for progressive image generation
- Transparent backgrounds (PNG/WebP)
- Style control (vivid vs. natural)

### Audio Services
- **Text-to-Speech**: Multiple voices, streaming support, various audio formats
- **Speech-to-Text**: High-accuracy transcription with speaker diarization
- **Translation**: Automatic translation to English from any language

### Music Generation
- Text-to-music generation
- Style and genre control
- Instrumental or vocal options
- Async task-based processing

### Video Generation (Planned)
- Text-to-video generation
- Image-to-video animation
- Multiple resolution and FPS options

## API Endpoints

### Image Generation

#### POST `/v1/images/generations`

Generate images from text prompts.

**Request Body:**
```json
{
  "prompt": "A cute baby sea otter",
  "model": "gpt-image-1",
  "n": 1,
  "size": "1024x1024",
  "quality": "high",
  "response_format": "b64_json"
}
```

**Response:**
```json
{
  "created": 1713833628,
  "data": [
    {
      "b64_json": "iVBORw0KGgoAAAANSUhEUgA...",
      "revised_prompt": "A cute baby sea otter floating on its back..."
    }
  ],
  "usage": {
    "total_tokens": 100,
    "input_tokens": 50,
    "output_tokens": 50
  }
}
```

**Supported Models:**
- `dall-e-2`: Fast, economical, basic quality
- `dall-e-3`: High quality, single image only
- `gpt-image-1`: Latest model, supports streaming and advanced features
- `midjourney`: Artistic style generation
- `flux`: Fast generation
- `stable-diffusion`: Open-source alternative

### Image Editing

#### POST `/v1/images/edits`

Edit or extend images with AI assistance.

**Request Body (multipart/form-data):**
```
image[]: <binary file data>
image[]: <binary file data> (optional, multiple images)
mask: <binary file data> (optional)
prompt: "Add a festive red bow"
model: "gpt-image-1"
stream: true
```

**Streaming Response:**
```
event: image_edit.partial_image
data: {"type":"image_edit.partial_image","b64_json":"...","partial_image_index":0}

event: image_edit.completed
data: {"type":"image_edit.completed","b64_json":"...","usage":{"total_tokens":100}}
```

### Image Variations

#### POST `/v1/images/variations`

Create variations of an existing image.

**Request Body (multipart/form-data):**
```
image: <binary PNG file>
model: "dall-e-2"
n: 2
size: "1024x1024"
```

**Response:**
```json
{
  "created": 1589478378,
  "data": [
    {
      "url": "https://..."
    },
    {
      "url": "https://..."
    }
  ]
}
```

### Text-to-Speech

#### POST `/v1/audio/speech`

Generate audio from text.

**Request Body:**
```json
{
  "model": "gpt-4o-mini-tts",
  "input": "The quick brown fox jumped over the lazy dog.",
  "voice": "alloy",
  "response_format": "mp3",
  "speed": 1.0
}
```

**Response:**
Binary audio data (application/octet-stream)

**Available Voices:**
- `alloy`, `ash`, `ballad`, `coral`, `echo`, `fable`, `onyx`, `nova`, `sage`, `shimmer`, `verse`

**Supported Formats:**
- `mp3` (default), `opus`, `aac`, `flac`, `wav`, `pcm`

### Speech-to-Text

#### POST `/v1/audio/transcriptions`

Transcribe audio to text with optional speaker identification.

**Request Body (multipart/form-data):**
```
file: <audio file>
model: "gpt-4o-transcribe"
language: "en"
response_format: "verbose_json"
timestamp_granularities[]: "word"
timestamp_granularities[]: "segment"
```

**Response (verbose_json):**
```json
{
  "task": "transcribe",
  "language": "en",
  "duration": 27.4,
  "text": "Imagine the wildest idea...",
  "words": [
    {
      "word": "Imagine",
      "start": 0.0,
      "end": 0.5
    }
  ],
  "segments": [
    {
      "id": 0,
      "start": 0.0,
      "end": 5.0,
      "text": "Imagine the wildest idea..."
    }
  ],
  "usage": {
    "type": "tokens",
    "input_tokens": 14,
    "output_tokens": 45,
    "total_tokens": 59
  }
}
```

**Speaker Diarization:**

For multi-speaker transcription, use `gpt-4o-transcribe-diarize` model:

```
file: <audio file>
model: "gpt-4o-transcribe-diarize"
response_format: "diarized_json"
chunking_strategy: "auto"
known_speaker_names[]: "agent"
known_speaker_references[]: "data:audio/wav;base64,AAA..."
```

**Diarized Response:**
```json
{
  "task": "transcribe",
  "duration": 27.4,
  "text": "Agent: Thanks for calling...\nA: Hi, I'm trying...",
  "segments": [
    {
      "type": "transcript.text.segment",
      "id": "seg_001",
      "start": 0.0,
      "end": 4.7,
      "text": "Thanks for calling OpenAI support.",
      "speaker": "agent"
    },
    {
      "type": "transcript.text.segment",
      "id": "seg_002",
      "start": 4.7,
      "end": 11.8,
      "text": "Hi, I'm trying to enable diarization.",
      "speaker": "A"
    }
  ]
}
```

### Audio Translation

#### POST `/v1/audio/translations`

Translate audio from any language to English.

**Request Body (multipart/form-data):**
```
file: <audio file>
model: "whisper-1"
response_format: "json"
```

**Response:**
```json
{
  "text": "Hello, how are you?"
}
```

### Music Generation

#### POST `/v1/music/generations`

Generate music from text descriptions (async).

**Request Body:**
```json
{
  "prompt": "An upbeat electronic dance track with heavy bass",
  "model": "suno-v3.5",
  "duration": 120,
  "style": "electronic",
  "instrumental": false
}
```

**Response (202 Accepted):**
```json
{
  "task_id": "music_abc123",
  "status": "pending",
  "estimated_completion_time": 30
}
```

#### GET `/v1/music/generations/{task_id}`

Check music generation status.

**Response:**
```json
{
  "task_id": "music_abc123",
  "status": "completed",
  "progress": 100,
  "result": {
    "url": "https://storage.example.com/music_abc123.mp3",
    "duration": 120.5,
    "format": "mp3"
  }
}
```

### Video Generation

#### POST `/v1/video/generations`

Generate video from text or images (async, planned feature).

**Request Body:**
```json
{
  "prompt": "A serene sunset over a mountain landscape",
  "model": "runway-gen3",
  "duration": 5,
  "resolution": "1280x720",
  "fps": 30
}
```

**Response (202 Accepted):**
```json
{
  "task_id": "video_xyz789",
  "status": "pending",
  "estimated_completion_time": 120
}
```

## Provider Support

The API is designed to work with multiple providers through a unified interface:

### Image Providers

| Provider | Models | Features |
|----------|--------|----------|
| OpenAI | DALL-E 2, DALL-E 3, GPT-Image-1 | Generation, editing, variations |
| Midjourney | midjourney | High-quality artistic generation |
| Flux | flux | Fast generation |
| Stable Diffusion | stable-diffusion | Open-source, customizable |

### Audio Providers

| Provider | Models | Features |
|----------|--------|----------|
| OpenAI | TTS-1, TTS-1-HD, GPT-4o-TTS | Text-to-speech |
| OpenAI | Whisper-1, GPT-4o-transcribe | Speech-to-text, diarization |

### Music Providers

| Provider | Models | Features |
|----------|--------|----------|
| Suno AI | suno-v3, suno-v3.5 | Music generation |

### Video Providers (Planned)

| Provider | Models | Features |
|----------|--------|----------|
| RunwayML | runway-gen3 | Text-to-video |
| Stability AI | stability-video | Video generation |

## Authentication

The API supports two authentication methods:

### API Key Authentication

Include your API key in the request header:

```bash
curl -X POST https://api.example.com/v1/images/generations \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A sunset"}'
```

### Bearer Token Authentication

Use a bearer token for JWT-based authentication:

```bash
curl -X POST https://api.example.com/v1/images/generations \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A sunset"}'
```

## Usage Examples

### Python

```python
from openai import OpenAI

# Initialize client
client = OpenAI(
    api_key="your-api-key",
    base_url="https://api.example.com/v1"
)

# Generate an image
response = client.images.generate(
    prompt="A futuristic cityscape at sunset",
    model="gpt-image-1",
    size="1536x1024",
    quality="high",
    n=1
)

print(response.data[0].url)

# Transcribe audio
with open("audio.mp3", "rb") as audio_file:
    transcription = client.audio.transcriptions.create(
        file=audio_file,
        model="gpt-4o-transcribe",
        response_format="verbose_json",
        timestamp_granularities=["word", "segment"]
    )
    print(transcription.text)

# Generate speech
response = client.audio.speech.create(
    model="gpt-4o-mini-tts",
    voice="alloy",
    input="Hello, this is a test."
)

response.stream_to_file("output.mp3")
```

### Node.js

```javascript
import OpenAI from 'openai';
import fs from 'fs';

const client = new OpenAI({
  apiKey: 'your-api-key',
  baseURL: 'https://api.example.com/v1'
});

// Generate an image
const imageResponse = await client.images.generate({
  prompt: 'A futuristic cityscape at sunset',
  model: 'gpt-image-1',
  size: '1536x1024',
  quality: 'high',
  n: 1
});

console.log(imageResponse.data[0].url);

// Transcribe audio
const transcription = await client.audio.transcriptions.create({
  file: fs.createReadStream('audio.mp3'),
  model: 'gpt-4o-transcribe',
  response_format: 'verbose_json',
  timestamp_granularities: ['word', 'segment']
});

console.log(transcription.text);

// Generate speech
const mp3 = await client.audio.speech.create({
  model: 'gpt-4o-mini-tts',
  voice: 'alloy',
  input: 'Hello, this is a test.'
});

const buffer = Buffer.from(await mp3.arrayBuffer());
await fs.promises.writeFile('output.mp3', buffer);
```

### cURL

```bash
# Generate an image
curl https://api.example.com/v1/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "model": "gpt-image-1",
    "prompt": "A cute baby sea otter",
    "n": 1,
    "size": "1024x1024"
  }'

# Transcribe audio
curl https://api.example.com/v1/audio/transcriptions \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: multipart/form-data" \
  -F file="@audio.mp3" \
  -F model="gpt-4o-transcribe"

# Generate speech
curl https://api.example.com/v1/audio/speech \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini-tts",
    "input": "The quick brown fox jumped over the lazy dog.",
    "voice": "alloy"
  }' \
  --output speech.mp3
```

## Implementation Guide

### For API Gateway Integration

To implement this specification in your API Gateway:

#### 1. Provider Abstraction Layer

Create a provider abstraction that maps unified requests to provider-specific APIs:

```javascript
// providers/imageProvider.js
class ImageProvider {
  async generateImage(params) {
    switch (params.model) {
      case 'dall-e-2':
      case 'dall-e-3':
      case 'gpt-image-1':
        return this.openaiProvider.generate(params);
      case 'midjourney':
        return this.midjourneyProvider.generate(params);
      case 'flux':
        return this.fluxProvider.generate(params);
      case 'stable-diffusion':
        return this.stabilityProvider.generate(params);
      default:
        throw new Error(`Unsupported model: ${params.model}`);
    }
  }

  // Normalize provider-specific responses to unified format
  normalizeResponse(providerResponse, provider) {
    // Convert provider response to OpenAI-compatible format
    return {
      created: Math.floor(Date.now() / 1000),
      data: this.normalizeImages(providerResponse, provider),
      usage: this.calculateUsage(providerResponse)
    };
  }
}
```

#### 2. Request Routing

Route requests based on the model parameter:

```javascript
// routes/images.js
router.post('/v1/images/generations', async (req, res) => {
  try {
    const params = req.body;

    // Validate request
    validateImageRequest(params);

    // Route to appropriate provider
    const provider = getProviderForModel(params.model);
    const result = await provider.generateImage(params);

    // Return normalized response
    res.json(result);
  } catch (error) {
    handleError(error, res);
  }
});
```

#### 3. Streaming Support

Implement streaming for progressive image generation:

```javascript
async function streamImageGeneration(params, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const provider = getProviderForModel(params.model);

  for await (const chunk of provider.generateImageStream(params)) {
    const event = {
      type: 'image_generation.partial_image',
      b64_json: chunk.partialImage,
      partial_image_index: chunk.index
    };

    res.write(`event: image_generation.partial_image\n`);
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  }

  res.write(`event: image_generation.completed\n`);
  res.write(`data: ${JSON.stringify(finalEvent)}\n\n`);
  res.end();
}
```

#### 4. Async Task Management

For music and video generation, implement task-based processing:

```javascript
// services/taskManager.js
class TaskManager {
  constructor() {
    this.tasks = new Map();
  }

  async createTask(type, params) {
    const taskId = generateTaskId();

    const task = {
      id: taskId,
      type: type,
      status: 'pending',
      progress: 0,
      params: params,
      createdAt: new Date()
    };

    this.tasks.set(taskId, task);

    // Start async processing
    this.processTask(taskId);

    return {
      task_id: taskId,
      status: 'pending',
      estimated_completion_time: this.estimateTime(type, params)
    };
  }

  async processTask(taskId) {
    const task = this.tasks.get(taskId);
    task.status = 'processing';

    try {
      const provider = this.getProviderForTask(task);

      // Process with progress updates
      const result = await provider.generate(task.params, (progress) => {
        task.progress = progress;
      });

      task.status = 'completed';
      task.result = result;
    } catch (error) {
      task.status = 'failed';
      task.error = error.message;
    }
  }

  getTaskStatus(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    return {
      task_id: task.id,
      status: task.status,
      progress: task.progress,
      result: task.result || null,
      error: task.error || null
    };
  }
}
```

#### 5. Failover Strategy

Implement automatic failover between providers:

```javascript
class ProviderFailover {
  constructor(providers) {
    this.providers = providers; // Ordered list of providers
  }

  async executeWithFailover(operation, params) {
    let lastError;

    for (const provider of this.providers) {
      try {
        console.log(`Trying provider: ${provider.name}`);
        const result = await provider[operation](params);
        return result;
      } catch (error) {
        console.error(`Provider ${provider.name} failed:`, error);
        lastError = error;

        // Continue to next provider
        continue;
      }
    }

    // All providers failed
    throw new Error(`All providers failed. Last error: ${lastError.message}`);
  }
}

// Usage
const imageProviders = [
  new OpenAIProvider(),
  new MidjourneyProvider(),
  new FluxProvider()
];

const failover = new ProviderFailover(imageProviders);
const result = await failover.executeWithFailover('generateImage', params);
```

### Database Schema

For tracking tasks and usage:

```sql
CREATE TABLE media_tasks (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'image', 'audio', 'music', 'video'
  operation VARCHAR(50) NOT NULL, -- 'generate', 'edit', 'transcribe', etc.
  status VARCHAR(50) NOT NULL, -- 'pending', 'processing', 'completed', 'failed'
  progress INTEGER DEFAULT 0,
  params JSONB NOT NULL,
  result JSONB,
  error TEXT,
  provider VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_tasks_user_id ON media_tasks(user_id);
CREATE INDEX idx_tasks_status ON media_tasks(status);
CREATE INDEX idx_tasks_created_at ON media_tasks(created_at);

CREATE TABLE media_usage (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  task_id VARCHAR(255),
  endpoint VARCHAR(255) NOT NULL,
  model VARCHAR(100),
  provider VARCHAR(100),
  tokens_used INTEGER,
  duration_seconds NUMERIC,
  cost NUMERIC(10, 6),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_usage_user_id ON media_usage(user_id);
CREATE INDEX idx_usage_created_at ON media_usage(created_at);
```

## Error Handling

The API uses standard HTTP status codes and returns errors in a consistent format:

### Error Response Format

```json
{
  "error": {
    "message": "Invalid parameter: prompt is required",
    "type": "invalid_request_error",
    "code": "invalid_parameter",
    "param": "prompt"
  }
}
```

### Common Error Codes

| Status Code | Error Type | Description |
|-------------|------------|-------------|
| 400 | invalid_request_error | Invalid parameters or malformed request |
| 401 | authentication_error | Invalid or missing API key |
| 403 | permission_error | Insufficient permissions |
| 404 | not_found_error | Resource not found |
| 429 | rate_limit_error | Too many requests |
| 500 | server_error | Internal server error |
| 503 | service_unavailable | Service temporarily unavailable |

### Error Handling Best Practices

1. **Implement Retry Logic**: For transient errors (500, 503), implement exponential backoff
2. **Validate Input**: Check parameters before sending requests
3. **Handle Rate Limits**: Implement request queuing and throttling
4. **Log Errors**: Track errors for debugging and monitoring
5. **Provide Fallbacks**: Switch to alternative providers when primary fails

### Example Error Handling

```javascript
async function generateImageWithRetry(params, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.images.generate(params);
      return response;
    } catch (error) {
      if (error.status === 429) {
        // Rate limit - wait and retry
        const waitTime = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      } else if (error.status >= 500 && attempt < maxRetries) {
        // Server error - retry
        console.log(`Attempt ${attempt} failed, retrying...`);
        continue;
      } else {
        // Other error - don't retry
        throw error;
      }
    }
  }

  throw new Error('Max retries exceeded');
}
```

## Rate Limiting

Implement rate limiting to prevent abuse:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: {
      message: 'Too many requests, please try again later.',
      type: 'rate_limit_error',
      code: 'rate_limit_exceeded'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply to all media endpoints
app.use('/v1/images/', limiter);
app.use('/v1/audio/', limiter);
app.use('/v1/music/', limiter);
app.use('/v1/video/', limiter);
```

## Monitoring and Observability

Track key metrics for your media API:

### Key Metrics

1. **Request Metrics**
   - Total requests per endpoint
   - Request success/failure rate
   - Average response time
   - P95/P99 latency

2. **Provider Metrics**
   - Provider success rate
   - Provider failover frequency
   - Provider response time

3. **Resource Metrics**
   - Token usage
   - Cost per request
   - Storage usage (for generated media)

4. **Business Metrics**
   - Active users
   - Popular models
   - Feature adoption

### Logging Example

```javascript
function logMediaRequest(req, result, duration) {
  logger.info('Media API Request', {
    endpoint: req.path,
    method: req.method,
    model: req.body.model,
    provider: result.provider,
    duration_ms: duration,
    status: 'success',
    user_id: req.user.id,
    tokens_used: result.usage?.total_tokens
  });
}
```

## Contributing

Contributions to this specification are welcome! Please:

1. Review the OpenAI API standards
2. Ensure backwards compatibility
3. Add tests for new features
4. Update documentation

## License

This specification is released under the MIT License. See [LICENSE](LICENSE) for details.

## Related Links

- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [OpenAPI Specification](https://www.openapis.org/)
- [API Gateway Architecture](https://github.com/deep-assistant/api-gateway/blob/main/ARCHITECTURE.md)
- [Telegram Bot Integration](https://github.com/deep-assistant/telegram-bot/blob/main/ARCHITECTURE.md)
