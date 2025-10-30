# VK Bot Examples

This directory contains minimal working examples of VK bots in both Python and JavaScript, demonstrating the core concepts and architecture patterns for the full VK bot implementation.

## Overview

These examples showcase how to build a VK bot that integrates with the Deep Assistant ecosystem, specifically:
- Handling VK messages and commands
- Creating interactive keyboard layouts
- Managing conversation state
- Integrating with the API Gateway for LLM functionality
- Checking user token balances

## Available Examples

### 1. Python Bot (`python-bot/`)

**Framework:** [vkbottle](https://github.com/vkbottle/vkbottle)

A feature-complete example demonstrating:
- Command handling with decorators
- State management using vkbottle's built-in system
- Async/await patterns with aiohttp
- Clean service architecture

**Quick Start:**
```bash
cd python-bot
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your tokens
python bot.py
```

See [python-bot/README.md](./python-bot/README.md) for detailed instructions.

### 2. JavaScript Bot (`javascript-bot/`)

**Framework:** [node-vk-bot-api](https://github.com/node-vk-bot-api/node-vk-bot-api)

An equivalent implementation in Node.js demonstrating:
- Command and message handling
- In-memory state management (Map-based)
- Async/await with axios
- Modular service design

**Quick Start:**
```bash
cd javascript-bot
npm install
cp .env.example .env
# Edit .env with your tokens
npm start
```

See [javascript-bot/README.md](./javascript-bot/README.md) for detailed instructions.

## Features Demonstrated

Both examples implement the same features to show feature parity:

- ✅ **Basic Commands**
  - `/start` - Welcome message with main menu
  - `/help` - Help information
  - `/balance` - Check token balance
  - `/models` - List available AI models

- ✅ **Interactive Keyboards**
  - Main menu with action buttons
  - Context-sensitive keyboards
  - Cancel functionality

- ✅ **Conversation State**
  - Chat mode for continuous conversations
  - State persistence across messages
  - State cleanup on cancel

- ✅ **API Gateway Integration**
  - Chat completions with GPT models
  - User balance checking
  - Error handling and retries

- ✅ **User Experience**
  - Friendly error messages
  - Balance warnings
  - Token usage tracking

## Architecture Comparison

### Python (vkbottle)

```python
@bot.on.message(text="/start")
async def start_handler(message: Message):
    await message.answer("Welcome!", keyboard=keyboard.get_json())
```

**Pros:**
- Clean decorator-based routing
- Built-in state management
- Type hints with Pydantic
- Native async support

**Cons:**
- Requires Python 3.10+
- Larger memory footprint
- Slower cold start

### JavaScript (node-vk-bot-api)

```javascript
bot.command('/start', async (ctx) => {
  await ctx.reply('Welcome!', null, keyboard);
});
```

**Pros:**
- Fast startup and execution
- Smaller memory footprint
- Familiar syntax for JS developers
- Easy deployment with Node.js

**Cons:**
- Manual state management
- No built-in typing system
- More boilerplate code

## What's Not Included

These are minimal examples. For production, you would add:

- ❌ Database layer (SQLite, PostgreSQL, MongoDB)
- ❌ Persistent state storage (Redis)
- ❌ Payment integration (VK Pay/Donut)
- ❌ Image generation functionality
- ❌ Referral system
- ❌ Settings management
- ❌ Comprehensive error handling
- ❌ Logging and monitoring
- ❌ Rate limiting
- ❌ Unit and integration tests
- ❌ Docker deployment
- ❌ CI/CD pipelines

See the [VK-BOT-ARCHITECTURE.md](../VK-BOT-ARCHITECTURE.md) and [VK-BOT-IMPLEMENTATION-PLAN.md](../VK-BOT-IMPLEMENTATION-PLAN.md) for the complete production architecture.

## Testing the Examples

### Without API Gateway

You can test basic bot functionality without the API Gateway:

1. Set only `VK_GROUP_TOKEN` in `.env`
2. Run the bot
3. Test commands: `/start`, `/help`, `/models`
4. Test keyboard navigation

The GPT chat feature will show a friendly error if API Gateway is not configured.

### With API Gateway

For full functionality including GPT chat:

1. Ensure the API Gateway is running
2. Set `API_GATEWAY_TOKEN` in `.env`
3. Ensure your user has tokens in the API Gateway
4. Test GPT chat functionality

### Testing Checklist

- [ ] Bot responds to `/start` with main menu
- [ ] Help button shows help information
- [ ] All keyboard buttons work
- [ ] Conversation state persists across messages
- [ ] Cancel button returns to main menu
- [ ] Balance check works (if API Gateway configured)
- [ ] GPT chat works (if API Gateway configured)
- [ ] Errors are handled gracefully

## Prerequisites

### VK Platform Setup

1. **Create VK Community** (if you don't have one)
   - Go to https://vk.com/groups
   - Create a new community/group

2. **Enable Community Messages**
   - Go to Community Settings → Messages
   - Enable "Community Messages"
   - Configure "Bot Settings" as needed

3. **Enable Long Poll API**
   - Go to Settings → API usage → Long Poll API
   - Enable Long Poll API
   - Set API version to 5.131 or higher

4. **Get Access Token**
   - Go to Settings → API usage → Access tokens
   - Create a token with `messages` scope
   - Copy the token (starts with `vk1.a.`)

### API Gateway Setup (Optional)

If you want to test the full functionality:

1. Deploy the [api-gateway](https://github.com/deep-assistant/api-gateway)
2. Obtain a master token for authentication
3. Ensure the gateway is accessible from your network

## Environment Variables

Both examples use the same environment variables:

```bash
# Required
VK_GROUP_TOKEN=vk1.a.your_token_here

# Optional (for chat functionality)
API_GATEWAY_URL=https://api.deep-assistant.com
API_GATEWAY_TOKEN=your_gateway_token_here
```

## Next Steps

### Moving to Production

1. **Choose an Implementation**
   - Start with Python or JavaScript based on your preference
   - Or maintain both for redundancy

2. **Add Database Layer**
   - Python: SQLAlchemy with SQLite/PostgreSQL
   - JavaScript: Redis or MongoDB

3. **Add Missing Features**
   - Image generation
   - Payment processing
   - Referral system
   - Settings management

4. **Deploy**
   - Containerize with Docker
   - Set up CI/CD
   - Deploy to production

5. **Monitor**
   - Add logging (Pino, Winston)
   - Set up error tracking
   - Monitor performance

### Creating the Full Repository

These examples are proof-of-concepts. To create the full `vk-bot` repository:

1. Follow the [VK-BOT-IMPLEMENTATION-PLAN.md](../VK-BOT-IMPLEMENTATION-PLAN.md)
2. Set up proper project structure
3. Add all production features
4. Write comprehensive tests
5. Set up deployment infrastructure

## Contributing

These examples are part of the [master-plan](https://github.com/deep-assistant/master-plan) repository and demonstrate the approach for issue [#1](https://github.com/deep-assistant/master-plan/issues/1).

To contribute:
1. Test the examples and report issues
2. Suggest improvements
3. Help with documentation
4. Contribute to the full vk-bot implementation

## Resources

### Documentation
- [VK API Documentation](https://dev.vk.com/api/bots)
- [vkbottle Documentation](https://vkbottle.readthedocs.io/)
- [node-vk-bot-api Documentation](https://github.com/node-vk-bot-api/node-vk-bot-api)

### Related Repositories
- [telegram-bot](https://github.com/deep-assistant/telegram-bot) - Reference implementation
- [api-gateway](https://github.com/deep-assistant/api-gateway) - Backend service
- [GPTutor](https://github.com/deep-assistant/GPTutor) - Existing VK mini app

### Architecture Documents
- [VK-BOT-ARCHITECTURE.md](../VK-BOT-ARCHITECTURE.md) - Full architecture specification
- [VK-BOT-IMPLEMENTATION-PLAN.md](../VK-BOT-IMPLEMENTATION-PLAN.md) - 10-week implementation plan

## License

These examples are released under the Unlicense (Public Domain). Feel free to use them however you like.

## Support

For questions or issues:
- Open an issue on [master-plan](https://github.com/deep-assistant/master-plan/issues)
- Check existing [discussions](https://github.com/deep-assistant/master-plan/discussions)
- Review the architecture documentation

---

**Note:** These are demonstration examples intended to be moved to a dedicated `vk-bot` repository once the full implementation begins.
