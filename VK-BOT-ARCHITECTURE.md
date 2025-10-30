# VK Bot Architecture

**Version:** 1.0.0
**License:** Unlicense
**Runtime:** Python 3.10+ / Node.js 18+
**Primary Frameworks:** vkbottle (Python), node-vk-bot-api (JavaScript)
**Status:** Draft Proposal

## Overview

The VK Bot is a dual-language chatbot implementation for VKontakte (VK.com) platform, designed to provide users access to multiple LLM models through VK communities. This bot serves as a complementary interface to the existing VK mini app in the GPTutor project, offering conversational AI capabilities directly through VK messages.

Like the Telegram bot, this implementation supports both Python and JavaScript runtimes while maintaining architectural consistency with the deep-assistant ecosystem.

### Key Features

- **Multi-model LLM Chat**: Access to GPT-4, Claude, Gemini, and other models via API Gateway
- **Image Generation**: DALL-E integration for text-to-image generation
- **Image Editing**: Background removal, upscaling, and style transfer
- **Payment Processing**: VK Donut/VK Pay integration for token purchases
- **Referral System**: User acquisition and reward mechanism
- **Music Generation**: Suno AI integration (optional)
- **Token-based Balance**: Unified billing system with API Gateway
- **Multi-language Support**: Russian and English interfaces

### Design Principles

1. **Architectural Consistency**: Mirror telegram-bot structure for maintainability
2. **API Gateway Integration**: Leverage existing backend infrastructure
3. **Dual Runtime Support**: Python and JavaScript implementations with feature parity
4. **Community-First Design**: Optimized for VK community interactions
5. **Graceful Degradation**: Handle API failures and rate limits elegantly

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        VK Platform                          │
│  (Community Messages, VK Bots Long Poll API)               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                      VK Bot Service                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Python Bot (vkbottle)  │  JavaScript Bot (node-vk)  │  │
│  ├─────────────────────────┴────────────────────────────┤  │
│  │              Router Layer (Message Handlers)          │  │
│  │  - GPT Chat Router                                    │  │
│  │  - Image Generation Router                            │  │
│  │  - Payment Router                                     │  │
│  │  - Referral Router                                    │  │
│  │  - Settings Router                                    │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │              Services Layer                           │  │
│  │  - API Gateway Service (LLM, Images, TTS)            │  │
│  │  - Database Service (User State, Balance, History)   │  │
│  │  - Payment Service (VK Pay/Donut)                    │  │
│  │  - Analytics Service                                  │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │              Database Layer                           │  │
│  │  - SQLite/Vedis (Python) or Redis (JavaScript)       │  │
│  │  - Tokens, Dialogs, Users, Referrals                 │  │
│  └───────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway Service                      │
│  (OpenAI-compatible proxy with multi-provider failover)    │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│               LLM Provider Ecosystem                        │
│  OpenAI │ Anthropic │ DeepSeek │ Gemini │ Meta Llama      │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
User → VK Community → Long Poll API → VK Bot → Router → Service → API Gateway → LLM Provider
                                         ↓
                                      Database
                                    (State/Balance)
```

## Directory Structure

### Python Bot Structure

```
vk-bot/
├── bot/
│   ├── __init__.py
│   ├── bot_run.py              # Main entry point for Python bot
│   ├── config.py               # Configuration management
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── gpt.py              # GPT chat router
│   │   ├── image.py            # Image generation router
│   │   ├── payment.py          # Payment processing router
│   │   ├── referral.py         # Referral system router
│   │   └── settings.py         # Bot settings router
│   ├── middlewares/
│   │   ├── __init__.py
│   │   ├── auth.py             # User authentication
│   │   ├── balance.py          # Token balance checks
│   │   └── logging.py          # Request logging
│   ├── keyboards/
│   │   ├── __init__.py
│   │   ├── main_menu.py        # Main keyboard layouts
│   │   ├── models.py           # Model selection keyboards
│   │   └── payment.py          # Payment keyboards
│   └── utils/
│       ├── __init__.py
│       ├── text.py             # Text formatting helpers
│       └── validators.py       # Input validation
├── services/
│   ├── __init__.py
│   ├── api_gateway.py          # API Gateway client
│   ├── database.py             # Database operations
│   ├── payment.py              # VK payment integration
│   └── analytics.py            # Usage analytics
├── db/
│   ├── __init__.py
│   ├── models.py               # Database models
│   ├── migrations/             # Database migrations
│   └── repositories/           # Data access layer
│       ├── __init__.py
│       ├── users.py
│       ├── tokens.py
│       ├── dialogs.py
│       └── referrals.py
├── tests/
│   ├── __init__.py
│   ├── test_routers.py
│   ├── test_services.py
│   └── test_database.py
├── requirements.txt
├── requirements-dev.txt
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

### JavaScript Bot Structure

```
vk-bot/
├── js/
│   ├── src/
│   │   ├── index.js            # Main entry point for JS bot
│   │   ├── config.js           # Configuration management
│   │   ├── routers/
│   │   │   ├── gpt.js          # GPT chat router
│   │   │   ├── image.js        # Image generation router
│   │   │   ├── payment.js      # Payment processing router
│   │   │   ├── referral.js     # Referral system router
│   │   │   └── settings.js     # Bot settings router
│   │   ├── middlewares/
│   │   │   ├── auth.js         # User authentication
│   │   │   ├── balance.js      # Token balance checks
│   │   │   └── logging.js      # Request logging
│   │   ├── keyboards/
│   │   │   ├── mainMenu.js     # Main keyboard layouts
│   │   │   ├── models.js       # Model selection keyboards
│   │   │   └── payment.js      # Payment keyboards
│   │   ├── services/
│   │   │   ├── apiGateway.js   # API Gateway client
│   │   │   ├── database.js     # Database operations
│   │   │   ├── payment.js      # VK payment integration
│   │   │   └── analytics.js    # Usage analytics
│   │   └── utils/
│   │       ├── text.js         # Text formatting helpers
│   │       └── validators.js   # Input validation
│   ├── tests/
│   │   ├── routers.test.js
│   │   ├── services.test.js
│   │   └── database.test.js
│   ├── package.json
│   ├── package-lock.json
│   └── .env.example
├── Dockerfile.js
└── docker-compose.js.yml
```

## Core Components

### 1. Bot Framework Layer

#### Python Implementation (vkbottle)

```python
from vkbottle.bot import Bot
from vkbottle import Keyboard, KeyboardButtonColor, Text

bot = Bot(token="YOUR_VK_GROUP_TOKEN")

@bot.on.message(text="/start")
async def start_handler(message):
    keyboard = (
        Keyboard()
        .add(Text("💬 Chat with GPT"), color=KeyboardButtonColor.PRIMARY)
        .row()
        .add(Text("🎨 Generate Image"), color=KeyboardButtonColor.POSITIVE)
    )
    return await message.answer(
        "Welcome! Choose an action:",
        keyboard=keyboard.get_json()
    )

bot.run_forever()
```

#### JavaScript Implementation (node-vk-bot-api)

```javascript
const VkBot = require('node-vk-bot-api');
const { Keyboard } = require('node-vk-bot-api');

const bot = new VkBot(process.env.VK_GROUP_TOKEN);

bot.command('/start', async (ctx) => {
  const keyboard = Keyboard.builder()
    .textButton({ label: '💬 Chat with GPT', color: Keyboard.PRIMARY_COLOR })
    .row()
    .textButton({ label: '🎨 Generate Image', color: Keyboard.POSITIVE_COLOR })
    .build();

  await ctx.reply('Welcome! Choose an action:', null, keyboard);
});

bot.startPolling();
```

### 2. Router Layer

Routers handle specific feature domains and delegate business logic to services.

#### GPT Chat Router (Python)

```python
from vkbottle.bot import Message
from vkbottle import BaseStateGroup

class ConversationState(BaseStateGroup):
    WAITING_FOR_MESSAGE = "waiting_for_message"
    WAITING_FOR_MODEL_SELECTION = "waiting_for_model_selection"

@bot.on.message(state=ConversationState.WAITING_FOR_MESSAGE)
async def handle_gpt_message(message: Message):
    # Check user balance
    balance = await database_service.get_user_balance(message.from_id)
    if balance <= 0:
        return await message.answer("Insufficient balance. Please top up.")

    # Send to API Gateway
    response = await api_gateway_service.chat_completion(
        user_id=message.from_id,
        message=message.text,
        model="gpt-4"
    )

    # Update balance
    await database_service.deduct_tokens(
        user_id=message.from_id,
        tokens=response.tokens_used
    )

    return await message.answer(response.content)
```

#### Image Generation Router (JavaScript)

```javascript
bot.on((ctx) => {
  if (ctx.message.text && ctx.message.text.startsWith('/imagine')) {
    return handleImageGeneration(ctx);
  }
});

async function handleImageGeneration(ctx) {
  const prompt = ctx.message.text.replace('/imagine', '').trim();

  if (!prompt) {
    return ctx.reply('Please provide a prompt: /imagine <description>');
  }

  // Check user balance
  const balance = await databaseService.getUserBalance(ctx.message.from_id);
  if (balance < 100) {
    return ctx.reply('Insufficient balance. Image generation costs 100 tokens.');
  }

  // Generate image via API Gateway
  const result = await apiGatewayService.generateImage({
    userId: ctx.message.from_id,
    prompt: prompt,
    model: 'dall-e-3'
  });

  // Upload to VK and send
  const upload = await bot.uploadDocument({
    peer_id: ctx.message.peer_id,
    file: result.imageUrl
  });

  return ctx.reply('Here is your image:', null, null, [upload]);
}
```

### 3. Services Layer

Services encapsulate business logic and external API interactions.

#### API Gateway Service

```python
import aiohttp
from typing import Optional, Dict, Any

class APIGatewayService:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url
        self.token = token
        self.session: Optional[aiohttp.ClientSession] = None

    async def chat_completion(
        self,
        user_id: int,
        message: str,
        model: str = "gpt-4",
        stream: bool = False
    ) -> Dict[str, Any]:
        """Send chat completion request to API Gateway."""
        async with self.session.post(
            f"{self.base_url}/v1/chat/completions",
            headers={"Authorization": f"Bearer {self.token}"},
            json={
                "model": model,
                "messages": [{"role": "user", "content": message}],
                "user_id": str(user_id),
                "stream": stream
            }
        ) as response:
            response.raise_for_status()
            return await response.json()

    async def generate_image(
        self,
        user_id: int,
        prompt: str,
        model: str = "dall-e-3"
    ) -> Dict[str, Any]:
        """Generate image via API Gateway."""
        async with self.session.post(
            f"{self.base_url}/v1/images/generations",
            headers={"Authorization": f"Bearer {self.token}"},
            json={
                "model": model,
                "prompt": prompt,
                "user_id": str(user_id)
            }
        ) as response:
            response.raise_for_status()
            return await response.json()

    async def get_user_balance(self, user_id: int) -> int:
        """Get user token balance from API Gateway."""
        async with self.session.get(
            f"{self.base_url}/tokens/{user_id}",
            headers={"Authorization": f"Bearer {self.token}"}
        ) as response:
            response.raise_for_status()
            data = await response.json()
            return data.get("balance", 0)
```

#### Database Service

```python
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'

    vk_id = Column(Integer, primary_key=True)
    username = Column(String)
    first_name = Column(String)
    last_name = Column(String)
    referrer_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class DatabaseService:
    def __init__(self, db_path: str):
        self.engine = create_engine(f'sqlite:///{db_path}')
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)

    def get_or_create_user(self, vk_id: int, **kwargs) -> User:
        """Get existing user or create new one."""
        session = self.Session()
        user = session.query(User).filter_by(vk_id=vk_id).first()

        if not user:
            user = User(vk_id=vk_id, **kwargs)
            session.add(user)
            session.commit()

        session.close()
        return user
```

### 4. Payment Integration

#### VK Donut Integration (Python)

```python
from vkbottle import VKAPIError

class PaymentService:
    def __init__(self, bot, api_gateway_service):
        self.bot = bot
        self.api_gateway = api_gateway_service

    async def create_payment_link(
        self,
        user_id: int,
        amount: int,
        tokens: int
    ) -> str:
        """Create VK Donut payment link."""
        # VK Pay integration for direct payments
        link = await self.bot.api.request(
            "donut.getSubscription",
            {
                "owner_id": -self.bot.group_id,
                "user_id": user_id
            }
        )
        return link

    async def handle_payment_notification(self, notification: dict):
        """Handle payment webhook from VK."""
        user_id = notification.get("user_id")
        amount = notification.get("amount")

        # Calculate tokens (e.g., 100 RUB = 1000 tokens)
        tokens = amount * 10

        # Add tokens via API Gateway
        await self.api_gateway.add_tokens(user_id, tokens)
```

## Message Flow

### User Message Processing Flow

```
1. VK User sends message → VK Community
2. VK Long Poll API delivers event → VK Bot
3. Middleware chain:
   a. Authentication Middleware (get/create user)
   b. Logging Middleware (record request)
   c. Balance Middleware (check tokens)
4. Router matches message to handler
5. Handler delegates to Service
6. Service calls API Gateway
7. API Gateway processes request (LLM/Image)
8. Service updates database (deduct tokens)
9. Handler formats response
10. Bot sends reply → VK API → User
```

### Streaming Response Flow (Python)

```python
@bot.on.message(text="/stream <prompt>")
async def stream_handler(message: Message, prompt: str):
    # Send initial message
    msg = await message.answer("Generating response...")

    full_response = ""
    async for chunk in api_gateway_service.chat_completion_stream(
        user_id=message.from_id,
        message=prompt
    ):
        full_response += chunk

        # Update message every 10 chunks
        if len(full_response) % 100 == 0:
            await bot.api.messages.edit(
                peer_id=message.peer_id,
                message=full_response,
                conversation_message_id=msg.conversation_message_id
            )

    # Final update
    await bot.api.messages.edit(
        peer_id=message.peer_id,
        message=full_response,
        conversation_message_id=msg.conversation_message_id
    )
```

## Configuration

### Environment Variables

#### Python Bot (.env)

```bash
# VK Configuration
VK_GROUP_TOKEN=vk1.a.your_group_token_here
VK_GROUP_ID=123456789

# API Gateway
API_GATEWAY_URL=https://api.deep-assistant.com
API_GATEWAY_TOKEN=your_api_gateway_master_token

# Database
DATABASE_PATH=./data/vk_bot.db

# Payment
VK_PAY_MERCHANT_ID=your_merchant_id
VK_PAY_SECRET=your_payment_secret

# Analytics (optional)
ANALYTICS_TOKEN=your_analytics_token

# Logging
LOG_LEVEL=INFO
LOG_FILE=./logs/vk_bot.log

# Features
ENABLE_SUNO=true
ENABLE_IMAGE_GENERATION=true
ENABLE_REFERRAL_SYSTEM=true

# Rate Limiting
MAX_REQUESTS_PER_MINUTE=30
MAX_REQUESTS_PER_HOUR=500
```

#### JavaScript Bot (.env)

```bash
# VK Configuration
VK_GROUP_TOKEN=vk1.a.your_group_token_here
VK_GROUP_ID=123456789

# API Gateway
API_GATEWAY_URL=https://api.deep-assistant.com
API_GATEWAY_TOKEN=your_api_gateway_master_token

# Redis (for JS bot state)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password

# Payment
VK_PAY_MERCHANT_ID=your_merchant_id
VK_PAY_SECRET=your_payment_secret

# Features
ENABLE_SUNO=true
ENABLE_IMAGE_GENERATION=true
ENABLE_REFERRAL_SYSTEM=true
```

## Deployment

### Docker Deployment (Python)

```dockerfile
# Dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY bot/ ./bot/
COPY services/ ./services/
COPY db/ ./db/

# Create data directories
RUN mkdir -p /app/data /app/logs

# Run bot
CMD ["python", "-m", "bot.bot_run"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  vk-bot-python:
    build: .
    container_name: vk-bot-python
    restart: unless-stopped
    env_file:
      - .env
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    networks:
      - deep-assistant-network

  vk-bot-js:
    build:
      context: .
      dockerfile: Dockerfile.js
    container_name: vk-bot-js
    restart: unless-stopped
    env_file:
      - js/.env
    depends_on:
      - redis
    networks:
      - deep-assistant-network

  redis:
    image: redis:7-alpine
    container_name: vk-bot-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - deep-assistant-network

networks:
  deep-assistant-network:
    external: true

volumes:
  redis-data:
```

### Production Deployment

1. **Obtain VK Access Tokens**:
   - Create VK Community
   - Enable Community Messages (Manage → Messages)
   - Generate Access Token (Settings → API usage → Tokens)
   - Enable Long Poll API (Settings → API usage → Long Poll API)

2. **Configure API Gateway**:
   - Set up API Gateway service (see api-gateway repository)
   - Generate master token for bot authentication
   - Configure failover providers

3. **Deploy Bot**:
   ```bash
   # Clone repository
   git clone https://github.com/deep-assistant/vk-bot.git
   cd vk-bot

   # Configure environment
   cp .env.example .env
   nano .env  # Edit with your tokens

   # Run with Docker Compose
   docker-compose up -d

   # Check logs
   docker-compose logs -f vk-bot-python
   ```

4. **Verify Deployment**:
   - Send `/start` message to your VK community
   - Check bot responds with main menu
   - Test GPT chat functionality
   - Verify token balance integration

## Commands

### User Commands

- `/start` - Initialize bot and show main menu
- `/help` - Display help information and available commands
- `/balance` - Check current token balance
- `/models` - List available LLM models
- `/settings` - Configure bot preferences (language, default model)
- `/referral` - Get referral link and view statistics
- `/history` - View recent conversation history
- `/clear` - Clear conversation context

### Admin Commands

- `/stats` - View bot usage statistics (admin only)
- `/broadcast <message>` - Send message to all users (admin only)
- `/user <vk_id>` - View user information (admin only)

### Image Commands

- `/imagine <prompt>` - Generate image with DALL-E
- `/edit <prompt>` - Edit uploaded image
- `/upscale` - Upscale uploaded image
- `/rembg` - Remove background from image

### Payment Commands

- `/buy` - Purchase tokens
- `/prices` - View token packages and prices
- `/transactions` - View payment history

## Internationalization

### Language Support

The bot supports multiple languages with automatic detection based on user preferences or manual selection.

#### Language Files Structure

```
locales/
├── en.json  # English
├── ru.json  # Russian
└── ...
```

#### Example Locale File (en.json)

```json
{
  "welcome": "Welcome to Deep Assistant VK Bot!",
  "main_menu": {
    "chat": "💬 Chat with GPT",
    "image": "🎨 Generate Image",
    "balance": "💰 Balance",
    "settings": "⚙️ Settings"
  },
  "errors": {
    "insufficient_balance": "Insufficient balance. Please top up to continue.",
    "api_error": "Sorry, an error occurred. Please try again.",
    "invalid_prompt": "Please provide a valid prompt."
  },
  "balance": {
    "current": "Your current balance: {tokens} tokens",
    "low_balance": "Low balance warning: {tokens} tokens remaining"
  }
}
```

## Error Handling

### Error Types and Responses

```python
from enum import Enum

class ErrorType(Enum):
    INSUFFICIENT_BALANCE = "insufficient_balance"
    API_ERROR = "api_error"
    RATE_LIMIT = "rate_limit"
    INVALID_INPUT = "invalid_input"
    UNAUTHORIZED = "unauthorized"

async def handle_error(error: Exception, message: Message):
    """Central error handler."""
    if isinstance(error, InsufficientBalanceError):
        return await message.answer(
            "⚠️ Insufficient balance.\n"
            "Please purchase tokens to continue: /buy"
        )
    elif isinstance(error, RateLimitError):
        return await message.answer(
            "⏱️ Rate limit exceeded.\n"
            "Please wait a moment before trying again."
        )
    elif isinstance(error, APIError):
        logger.error(f"API Error: {error}")
        return await message.answer(
            "❌ An error occurred while processing your request.\n"
            "Please try again or contact support if the issue persists."
        )
    else:
        logger.exception(f"Unexpected error: {error}")
        return await message.answer(
            "❌ An unexpected error occurred.\n"
            "Our team has been notified."
        )
```

## Dependencies

### Python Dependencies (requirements.txt)

```
vkbottle>=4.3.0
aiohttp>=3.8.0
sqlalchemy>=2.0.0
python-dotenv>=1.0.0
pydantic>=2.0.0
redis>=4.5.0
pillow>=10.0.0
```

### JavaScript Dependencies (package.json)

```json
{
  "dependencies": {
    "node-vk-bot-api": "^4.0.0",
    "axios": "^1.6.0",
    "redis": "^4.6.0",
    "dotenv": "^16.0.0",
    "pino": "^8.0.0",
    "sharp": "^0.33.0"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "eslint": "^8.0.0",
    "nodemon": "^3.0.0"
  }
}
```

## Testing

### Unit Tests (Python)

```python
import pytest
from bot.routers.gpt import handle_gpt_message
from services.api_gateway import APIGatewayService

@pytest.mark.asyncio
async def test_gpt_message_handler():
    """Test GPT message handling."""
    # Mock message and services
    mock_message = MockMessage(
        from_id=123456,
        text="Hello, GPT!"
    )

    # Test handler
    response = await handle_gpt_message(mock_message)

    assert response is not None
    assert isinstance(response, str)

@pytest.mark.asyncio
async def test_insufficient_balance():
    """Test behavior with insufficient balance."""
    mock_message = MockMessage(
        from_id=999999,  # User with zero balance
        text="Hello"
    )

    with pytest.raises(InsufficientBalanceError):
        await handle_gpt_message(mock_message)
```

### Integration Tests (JavaScript)

```javascript
const { VkBot } = require('./src/index');
const { apiGatewayService } = require('./src/services/apiGateway');

describe('VK Bot Integration', () => {
  test('should handle /start command', async () => {
    const ctx = mockContext({ text: '/start' });
    await bot.handleMessage(ctx);

    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining('Welcome')
    );
  });

  test('should generate image with valid prompt', async () => {
    const ctx = mockContext({ text: '/imagine a sunset' });
    const result = await handleImageGeneration(ctx);

    expect(result).toBeDefined();
    expect(apiGatewayService.generateImage).toHaveBeenCalled();
  });
});
```

## Logging

### Logging Configuration (Python)

```python
import logging
from logging.handlers import RotatingFileHandler

def setup_logging(log_level: str = "INFO", log_file: str = "vk_bot.log"):
    """Configure logging with rotation."""
    logger = logging.getLogger("vk_bot")
    logger.setLevel(getattr(logging, log_level))

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(
        logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    )

    # File handler with rotation
    file_handler = RotatingFileHandler(
        log_file,
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    file_handler.setFormatter(
        logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    )

    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

    return logger
```

## Performance Characteristics

### Expected Performance

- **Message Processing Latency**: 100-500ms (excluding LLM response time)
- **Concurrent Users**: 1000+ per instance
- **Database Operations**: <50ms per query (SQLite)
- **Memory Footprint**: ~200MB (Python), ~150MB (JavaScript)
- **API Gateway Latency**: 1-5 seconds (LLM dependent)

### Optimization Strategies

1. **Connection Pooling**: Reuse HTTP connections to API Gateway
2. **Caching**: Cache user preferences and model lists
3. **Async Operations**: Non-blocking I/O for all external calls
4. **Batch Processing**: Group database operations
5. **Rate Limiting**: Prevent API abuse and reduce costs

## Security Considerations

### Authentication & Authorization

1. **Token Security**: Store VK tokens securely in environment variables
2. **User Verification**: Validate VK user IDs on each request
3. **Admin Commands**: Restrict admin commands to verified administrator IDs
4. **Payment Verification**: Validate VK payment webhooks with signatures

### Data Protection

1. **User Privacy**: Store minimal user data (VK ID, balance, preferences)
2. **Conversation History**: Optional, user-controlled retention
3. **Payment Information**: Never store payment card details
4. **API Keys**: Rotate regularly, use separate keys for dev/prod

### Rate Limiting

```python
from collections import defaultdict
from datetime import datetime, timedelta

class RateLimiter:
    def __init__(self, max_per_minute: int = 30, max_per_hour: int = 500):
        self.max_per_minute = max_per_minute
        self.max_per_hour = max_per_hour
        self.user_requests = defaultdict(list)

    def is_allowed(self, user_id: int) -> bool:
        """Check if user has exceeded rate limits."""
        now = datetime.utcnow()
        requests = self.user_requests[user_id]

        # Remove old requests
        requests = [req for req in requests if req > now - timedelta(hours=1)]

        # Check limits
        recent_minute = len([r for r in requests if r > now - timedelta(minutes=1)])
        recent_hour = len(requests)

        if recent_minute >= self.max_per_minute or recent_hour >= self.max_per_hour:
            return False

        # Add current request
        requests.append(now)
        self.user_requests[user_id] = requests
        return True
```

## Known Issues & TODOs

### Current Limitations

1. **VK API Restrictions**:
   - Community cannot initiate conversations (user must message first)
   - File upload size limits (up to 200MB)
   - No native streaming support (messages must be edited)

2. **Feature Gaps**:
   - Suno AI integration pending API availability
   - Video generation not yet implemented
   - Multi-language support limited to EN/RU

### Future Enhancements

- [ ] Add voice message transcription via Whisper
- [ ] Implement text-to-speech responses
- [ ] Add group chat support with context awareness
- [ ] Integrate web search for real-time information
- [ ] Add document processing (PDF, DOCX)
- [ ] Implement conversation export functionality
- [ ] Add analytics dashboard for users
- [ ] Support VK Mini App integration for rich UI

## Troubleshooting

### Common Issues

#### Bot Not Responding

**Symptoms**: Bot doesn't reply to messages

**Solutions**:
1. Verify Community Messages are enabled (Manage → Messages)
2. Check Long Poll API is active (Settings → API usage → Long Poll API)
3. Verify access token has `messages` scope
4. Check bot logs for errors: `docker-compose logs -f vk-bot-python`

#### Payment Not Working

**Symptoms**: Payment links not generated or webhook not received

**Solutions**:
1. Verify VK Pay merchant credentials
2. Check webhook URL is configured correctly
3. Ensure webhook signature validation is working
4. Test payment in VK test environment first

#### Database Errors

**Symptoms**: SQLite locked errors or connection issues

**Solutions**:
1. Check file permissions on database file
2. Verify only one bot instance is running
3. Consider switching to PostgreSQL for production
4. Enable WAL mode: `PRAGMA journal_mode=WAL;`

#### API Gateway Timeouts

**Symptoms**: Requests to API Gateway fail or timeout

**Solutions**:
1. Verify API Gateway is running and accessible
2. Check network connectivity and firewall rules
3. Increase timeout values in configuration
4. Review API Gateway logs for errors

## API Integration

### VK API Methods Used

- `messages.send` - Send messages to users
- `messages.edit` - Edit existing messages (for streaming)
- `docs.getMessagesUploadServer` - Get upload URL for documents
- `docs.save` - Save uploaded document
- `photos.getMessagesUploadServer` - Get upload URL for photos
- `photos.saveMessagesPhoto` - Save uploaded photo
- `groups.getLongPollServer` - Get Long Poll server URL
- `donut.getSubscription` - Payment integration

### API Gateway Endpoints Used

- `POST /v1/chat/completions` - LLM chat completions
- `POST /v1/images/generations` - Image generation
- `POST /v1/audio/transcriptions` - Audio transcription
- `POST /v1/audio/speech` - Text-to-speech
- `GET /tokens/{user_id}` - Get user balance
- `POST /tokens/{user_id}/add` - Add tokens to user
- `GET /dialogs/{user_id}` - Get conversation history

## Development

### Setup Development Environment

```bash
# Clone repository
git clone https://github.com/deep-assistant/vk-bot.git
cd vk-bot

# Python setup
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
pip install -r requirements-dev.txt

# JavaScript setup
cd js
npm install

# Configure environment
cp .env.example .env
# Edit .env with your development tokens

# Run tests
pytest  # Python
npm test  # JavaScript

# Run in development mode
python -m bot.bot_run  # Python
npm run dev  # JavaScript
```

### Contributing Guidelines

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Write tests for new functionality
4. Ensure all tests pass: `pytest` / `npm test`
5. Follow code style: `black .` / `npm run lint`
6. Commit with clear messages: `git commit -m "Add feature X"`
7. Push and create pull request

## License

This project is released into the public domain under the Unlicense. See LICENSE file for details.

## Contributors

- Deep Assistant Team

## Glossary

- **VK (VKontakte)**: Russian social networking service
- **Long Poll API**: VK API method for receiving real-time updates
- **Community**: VK group/page that can host bots
- **API Gateway**: Unified proxy service for multiple LLM providers
- **vkbottle**: Asynchronous Python framework for VK bots
- **node-vk-bot-api**: Node.js framework for VK bots
- **Token**: Internal currency unit for API usage billing
- **VK Donut**: VK's subscription/donation service
- **VK Pay**: VK's payment processing system
