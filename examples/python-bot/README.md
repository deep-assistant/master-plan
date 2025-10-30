# Python VK Bot Example

This is a minimal working example of a VK bot implemented in Python using the `vkbottle` framework.

## Features

- ✅ Command handling (`/start`, `/help`, `/balance`, `/models`)
- ✅ Interactive keyboard layouts
- ✅ Conversation state management
- ✅ API Gateway integration for GPT chat
- ✅ User balance checking
- ✅ Error handling

## Prerequisites

- Python 3.10 or higher
- VK Community with:
  - Community Messages enabled
  - Long Poll API enabled
  - Access Token with `messages` scope

## Installation

1. Clone this repository or copy the example files

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your VK token and API Gateway credentials
   ```

## Configuration

### Required Environment Variables

- `VK_GROUP_TOKEN` - Your VK community access token

### Optional Environment Variables

- `API_GATEWAY_URL` - API Gateway base URL (default: https://api.deep-assistant.com)
- `API_GATEWAY_TOKEN` - API Gateway authentication token (required for chat functionality)

### Getting VK Access Token

1. Create a VK Community (if you don't have one)
2. Go to Community Settings → Messages
3. Enable "Community Messages"
4. Go to Settings → API usage → Access tokens
5. Create a token with `messages` scope
6. Copy the token to your `.env` file

## Usage

Run the bot:

```bash
python bot.py
```

The bot will start polling for messages. Open your VK community and send a message to test it.

## Available Commands

- `/start` - Start the bot and show main menu
- `/help` - Display help information
- `/balance` - Check token balance (requires API Gateway)
- `/models` - List available AI models

## Interactive Buttons

- 💬 **Chat with GPT** - Start a conversation with AI (requires API Gateway)
- 🎨 **Generate Image** - Generate images (placeholder)
- 💰 **Balance** - Check your token balance
- ⚙️ **Settings** - Configure bot preferences (placeholder)
- ℹ️ **Help** - Show help message

## Testing Without API Gateway

You can test the basic bot functionality (commands, keyboards, navigation) without setting up the API Gateway. The GPT chat feature will show an error message if the API Gateway is not configured.

## Architecture

```
VK User → VK Community → Bot (vkbottle) → API Gateway → LLM Providers
```

### Components

- **Bot Core**: Handles VK API interactions using vkbottle
- **APIGatewayService**: Communicates with API Gateway for LLM requests
- **State Management**: Tracks conversation state using vkbottle state system
- **Keyboard Layouts**: Provides interactive UI with buttons

## Next Steps

This example demonstrates the core concepts. For a production-ready implementation, you would add:

- Database layer for user data and conversation history
- Payment integration (VK Pay/Donut)
- Image generation functionality
- Referral system
- Settings management
- Comprehensive error handling
- Logging and monitoring
- Rate limiting
- Docker deployment

See [VK-BOT-ARCHITECTURE.md](../../VK-BOT-ARCHITECTURE.md) for the complete architecture and [VK-BOT-IMPLEMENTATION-PLAN.md](../../VK-BOT-IMPLEMENTATION-PLAN.md) for the full implementation roadmap.

## Troubleshooting

### Bot doesn't respond

- Verify Community Messages are enabled
- Check Long Poll API is active
- Verify access token has `messages` scope
- Check console for error messages

### Chat with GPT doesn't work

- Verify API_GATEWAY_TOKEN is set correctly
- Check API Gateway is accessible from your network
- Verify your user has tokens in the API Gateway

### State errors

- States are stored in memory and will be lost on restart
- For production, use a persistent state storage (Redis, database)

## License

Unlicense (Public Domain)
