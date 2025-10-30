# Web-Capture Integration Design Document

## Overview
This document describes the integration between the **web-capture** microservice and the **telegram-bot** to enable users to capture web pages in various formats (HTML, Markdown, PNG screenshots) directly from Telegram.

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Telegram  │─────>│ Telegram Bot │─────>│ Web-Capture │
│    Users    │<─────│   (Python)   │<─────│   Service   │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            ├─> API Gateway (existing)
                            ├─> DeepInfra (existing)
                            └─> Web-Capture (new)
```

## Web-Capture Microservice Improvements

### 1. Integration Tests (Issues #5, #8, #11)

**Priority**: HIGH - Ensures reliability for real-world websites

#### GitHub README Test (Issue #5)
```javascript
// tests/integration/github-readme.test.js
describe('GitHub README Download Tests', () => {
  const testUrl = 'https://github.com/nodejs/node/blob/main/README.md';

  describe('Puppeteer Engine', () => {
    test('can download GitHub README as markdown', async () => {
      // Verify markdown conversion works
      // Check for common README elements
    });

    test('can download GitHub README as image screenshot', async () => {
      // Verify PNG screenshot generation
      // Check image dimensions and format
    });
  });

  describe('Playwright Engine', () => {
    test('can download GitHub README as markdown', async () => {
      // Same tests for Playwright
    });

    test('can download GitHub README as image screenshot', async () => {
      // Same tests for Playwright
    });
  });

  describe('Engine Comparison', () => {
    test('both engines can download the same GitHub README', async () => {
      // Verify consistency between engines
    });
  });
});
```

#### Wikipedia Test (Issue #8)
```javascript
// tests/integration/wikipedia-page.test.js
describe('Wikipedia Page Download Tests', () => {
  const testUrl = 'https://en.wikipedia.org/wiki/Wikipedia';

  // Similar structure as GitHub test
  // Focus on:
  // - Table of contents conversion
  // - Citation links handling
  // - Image references
  // - Complex formatting preservation
});
```

#### StackOverflow Test (Issue #11)
```javascript
// tests/integration/stackoverflow-question.test.js
describe('StackOverflow Page Download Tests', () => {
  const testUrl = 'https://stackoverflow.com/questions/927358/how-do-i-undo-the-most-recent-local-commits-in-git';

  // Similar structure as GitHub test
  // Focus on:
  // - Code block preservation
  // - Question/answer structure
  // - Vote counts and metadata
  // - Syntax highlighting in markdown
});
```

### 2. Health Check Endpoint

**Purpose**: Enable monitoring and deployment health checks

```javascript
// src/routes/health.js
export function healthRoutes(app) {
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
      engines: {
        puppeteer: 'available',
        playwright: 'available'
      }
    });
  });

  app.get('/health/ready', async (req, res) => {
    // Check if service is ready to accept requests
    try {
      // Quick browser initialization test
      res.json({ status: 'ready' });
    } catch (error) {
      res.status(503).json({ status: 'not_ready', error: error.message });
    }
  });

  app.get('/health/live', (req, res) => {
    // Kubernetes liveness probe
    res.json({ status: 'alive' });
  });
}
```

### 3. Improved Error Handling

```javascript
// src/middleware/errorHandler.js
export function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const errorResponse = {
    error: {
      message: err.message || 'Internal server error',
      type: err.name || 'Error',
      timestamp: new Date().toISOString()
    }
  };

  // Don't expose internal errors in production
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.error.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
}
```

### 4. Docker Compose for Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  web-capture:
    build: .
    ports:
      - "${PORT:-3000}:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DEFAULT_ENGINE=${DEFAULT_ENGINE:-puppeteer}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## Telegram Bot Integration

### 1. Configuration Changes

#### config.example.py
```python
# Web Capture Service Configuration
WEB_CAPTURE_URL = os.getenv('WEB_CAPTURE_URL', 'http://localhost:3000')
WEB_CAPTURE_ENABLED = os.getenv('WEB_CAPTURE_ENABLED', 'False') == 'True'
WEB_CAPTURE_TIMEOUT = int(os.getenv('WEB_CAPTURE_TIMEOUT', '30'))  # seconds
WEB_CAPTURE_DEFAULT_ENGINE = os.getenv('WEB_CAPTURE_DEFAULT_ENGINE', 'puppeteer')
```

### 2. Web-Capture Service Client

```python
# bot/web_capture/service.py
import httpx
from typing import Optional, Literal
from config import (
    WEB_CAPTURE_URL,
    WEB_CAPTURE_TIMEOUT,
    WEB_CAPTURE_DEFAULT_ENGINE
)

class WebCaptureService:
    """Client for web-capture microservice"""

    def __init__(self):
        self.base_url = WEB_CAPTURE_URL
        self.timeout = WEB_CAPTURE_TIMEOUT
        self.default_engine = WEB_CAPTURE_DEFAULT_ENGINE

    async def get_html(
        self,
        url: str,
        engine: Optional[str] = None
    ) -> str:
        """Fetch HTML content from URL"""
        engine = engine or self.default_engine
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(
                f"{self.base_url}/html",
                params={"url": url, "engine": engine}
            )
            response.raise_for_status()
            return response.text

    async def get_markdown(
        self,
        url: str,
        engine: Optional[str] = None
    ) -> str:
        """Convert URL to markdown"""
        engine = engine or self.default_engine
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(
                f"{self.base_url}/markdown",
                params={"url": url, "engine": engine}
            )
            response.raise_for_status()
            return response.text

    async def get_screenshot(
        self,
        url: str,
        engine: Optional[str] = None
    ) -> bytes:
        """Capture screenshot of URL"""
        engine = engine or self.default_engine
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(
                f"{self.base_url}/image",
                params={"url": url, "engine": engine}
            )
            response.raise_for_status()
            return response.content

    async def health_check(self) -> dict:
        """Check if web-capture service is healthy"""
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get(f"{self.base_url}/health")
            response.raise_for_status()
            return response.json()
```

### 3. Command Handlers

```python
# bot/web_capture/router.py
from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
import re
from .service import WebCaptureService
from .keyboards import capture_format_keyboard

router = Router(name='web_capture')
service = WebCaptureService()

class CaptureStates(StatesGroup):
    waiting_for_url = State()
    waiting_for_format = State()

# URL pattern
URL_PATTERN = re.compile(
    r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
)

@router.message(Command('capture'))
async def cmd_capture(message: Message, state: FSMContext):
    """Capture a web page in various formats"""
    args = message.text.split(maxsplit=1)

    if len(args) < 2:
        await message.answer(
            "📄 *Web Page Capture*\n\n"
            "Usage: `/capture <URL>`\n\n"
            "Examples:\n"
            "• `/capture https://github.com/nodejs/node`\n"
            "• `/capture https://en.wikipedia.org/wiki/Python`\n\n"
            "I'll help you capture web pages as markdown or screenshots!",
            parse_mode='Markdown'
        )
        return

    url = args[1].strip()

    # Validate URL
    if not URL_PATTERN.match(url):
        await message.answer(
            "❌ Invalid URL format. Please provide a valid HTTP/HTTPS URL."
        )
        return

    # Store URL and ask for format
    await state.update_data(url=url)
    await message.answer(
        f"📄 URL: `{url}`\n\n"
        f"Choose capture format:",
        reply_markup=capture_format_keyboard(),
        parse_mode='Markdown'
    )

@router.message(Command('markdown'))
async def cmd_markdown(message: Message):
    """Capture web page as markdown"""
    args = message.text.split(maxsplit=1)

    if len(args) < 2:
        await message.answer("Usage: `/markdown <URL>`", parse_mode='Markdown')
        return

    url = args[1].strip()

    if not URL_PATTERN.match(url):
        await message.answer("❌ Invalid URL format.")
        return

    status_msg = await message.answer("⏳ Capturing page as markdown...")

    try:
        markdown_content = await service.get_markdown(url)

        # If content is too long for Telegram message (4096 chars limit)
        if len(markdown_content) > 4000:
            # Send as file
            from aiogram.types import BufferedInputFile
            file = BufferedInputFile(
                markdown_content.encode('utf-8'),
                filename=f"capture_{url.split('//')[-1][:30]}.md"
            )
            await message.answer_document(
                file,
                caption=f"📄 Markdown capture of:\n`{url}`",
                parse_mode='Markdown'
            )
        else:
            # Send as message
            await message.answer(
                f"📄 Markdown capture:\n\n```markdown\n{markdown_content}\n```",
                parse_mode='Markdown'
            )

        await status_msg.delete()

    except Exception as e:
        await status_msg.edit_text(
            f"❌ Error capturing page:\n`{str(e)}`",
            parse_mode='Markdown'
        )

@router.message(Command('screenshot'))
async def cmd_screenshot(message: Message):
    """Capture web page as screenshot"""
    args = message.text.split(maxsplit=1)

    if len(args) < 2:
        await message.answer("Usage: `/screenshot <URL`", parse_mode='Markdown')
        return

    url = args[1].strip()

    if not URL_PATTERN.match(url):
        await message.answer("❌ Invalid URL format.")
        return

    status_msg = await message.answer("⏳ Capturing screenshot...")

    try:
        screenshot_bytes = await service.get_screenshot(url)

        from aiogram.types import BufferedInputFile
        photo = BufferedInputFile(screenshot_bytes, filename="screenshot.png")

        await message.answer_photo(
            photo,
            caption=f"📸 Screenshot of:\n`{url}`",
            parse_mode='Markdown'
        )

        await status_msg.delete()

    except Exception as e:
        await status_msg.edit_text(
            f"❌ Error capturing screenshot:\n`{str(e)}`",
            parse_mode='Markdown'
        )

# Callback handlers for format selection
@router.callback_query(F.data.startswith('capture_'))
async def handle_capture_format(callback: CallbackQuery, state: FSMContext):
    """Handle format selection from inline keyboard"""
    data = await state.get_data()
    url = data.get('url')

    if not url:
        await callback.answer("❌ URL not found. Please start over.", show_alert=True)
        return

    format_type = callback.data.split('_')[1]  # capture_markdown, capture_screenshot

    await callback.message.edit_reply_markup(reply_markup=None)

    if format_type == 'markdown':
        # Reuse markdown handler logic
        await callback.message.answer("⏳ Capturing page as markdown...")
        try:
            markdown_content = await service.get_markdown(url)
            if len(markdown_content) > 4000:
                from aiogram.types import BufferedInputFile
                file = BufferedInputFile(
                    markdown_content.encode('utf-8'),
                    filename=f"capture.md"
                )
                await callback.message.answer_document(file)
            else:
                await callback.message.answer(
                    f"```markdown\n{markdown_content}\n```",
                    parse_mode='Markdown'
                )
        except Exception as e:
            await callback.message.answer(f"❌ Error: {str(e)}")

    elif format_type == 'screenshot':
        # Reuse screenshot handler logic
        await callback.message.answer("⏳ Capturing screenshot...")
        try:
            screenshot_bytes = await service.get_screenshot(url)
            from aiogram.types import BufferedInputFile
            photo = BufferedInputFile(screenshot_bytes, filename="screenshot.png")
            await callback.message.answer_photo(photo)
        except Exception as e:
            await callback.message.answer(f"❌ Error: {str(e)}")

    elif format_type == 'both':
        await callback.message.answer("⏳ Capturing both formats...")
        # Capture both formats
        # Implementation similar to above

    await state.clear()
    await callback.answer()
```

### 4. Inline Keyboards

```python
# bot/web_capture/keyboards.py
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

def capture_format_keyboard() -> InlineKeyboardMarkup:
    """Keyboard for selecting capture format"""
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(
                text="📝 Markdown",
                callback_data="capture_markdown"
            ),
            InlineKeyboardButton(
                text="📸 Screenshot",
                callback_data="capture_screenshot"
            )
        ],
        [
            InlineKeyboardButton(
                text="📋 Both",
                callback_data="capture_both"
            )
        ]
    ])
```

### 5. Integration in Main Bot

```python
# bot/bot_run.py (modifications)
from bot.web_capture.router import router as web_capture_router
from config import WEB_CAPTURE_ENABLED

def setup_routers(dp):
    """Setup all routers"""
    # ... existing routers ...

    if WEB_CAPTURE_ENABLED:
        dp.include_router(web_capture_router)
        logger.info("Web capture router enabled")
    else:
        logger.info("Web capture router disabled")
```

## Deployment Guide

### Web-Capture Service

```bash
# Using Docker Compose
cd web-capture
docker-compose -f docker-compose.prod.yml up -d

# Check health
curl http://localhost:3000/health
```

### Telegram Bot

```bash
# Add to .env or environment
export WEB_CAPTURE_URL=http://web-capture:3000
export WEB_CAPTURE_ENABLED=True

# Start bot
python3 __main__.py
```

### Combined Deployment (Docker Compose)

```yaml
# docker-compose.yml (in deployment repo)
version: '3.8'

services:
  web-capture:
    image: ghcr.io/deep-assistant/web-capture:latest
    environment:
      - NODE_ENV=production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  telegram-bot:
    image: ghcr.io/deep-assistant/telegram-bot:latest
    environment:
      - WEB_CAPTURE_URL=http://web-capture:3000
      - WEB_CAPTURE_ENABLED=True
      - TOKEN=${TELEGRAM_BOT_TOKEN}
      # ... other env vars
    depends_on:
      web-capture:
        condition: service_healthy
```

## Testing Strategy

### Web-Capture Tests

```bash
cd web-capture
yarn test                    # Unit tests
yarn test:integration        # Integration tests (new)
yarn test:e2e:docker         # E2E tests
```

### Telegram Bot Tests

```python
# tests/test_web_capture.py
import pytest
from bot.web_capture.service import WebCaptureService

@pytest.mark.asyncio
async def test_markdown_capture():
    service = WebCaptureService()
    markdown = await service.get_markdown('https://example.com')
    assert len(markdown) > 0
    assert 'Example Domain' in markdown

@pytest.mark.asyncio
async def test_screenshot_capture():
    service = WebCaptureService()
    screenshot = await service.get_screenshot('https://example.com')
    assert len(screenshot) > 0
    assert screenshot[:8] == b'\x89PNG\r\n\x1a\n'  # PNG signature
```

## User Documentation

### Bot Commands

#### `/capture <url>`
Capture a web page with format selection.

**Example:**
```
/capture https://github.com/nodejs/node
```
**Result:** Shows inline keyboard to choose Markdown, Screenshot, or Both.

#### `/markdown <url>`
Directly capture page as markdown.

**Example:**
```
/markdown https://en.wikipedia.org/wiki/Python
```
**Result:** Returns markdown version (as message or file if long).

#### `/screenshot <url>`
Directly capture page screenshot.

**Example:**
```
/screenshot https://stackoverflow.com/questions/927358
```
**Result:** Returns PNG screenshot as photo.

## Success Criteria

- ✅ Web-capture has integration tests for GitHub, Wikipedia, StackOverflow
- ✅ Web-capture has health check endpoint
- ✅ Web-capture is production-ready with Docker Compose
- ✅ Telegram bot can capture URLs as markdown
- ✅ Telegram bot can capture URLs as screenshots
- ✅ Error handling is robust and user-friendly
- ✅ Documentation is complete
- ✅ Tests verify the integration

## Future Enhancements

1. **Automatic URL Detection**: Detect URLs in messages and offer to capture
2. **Format Options**: PDF export, full-page screenshots
3. **Caching**: Cache frequently requested pages
4. **Rate Limiting**: Prevent abuse
5. **User Preferences**: Save preferred format per user
6. **Archive Feature**: Save captures for later retrieval

---

*This design document serves as the blueprint for implementing issue #10.*
