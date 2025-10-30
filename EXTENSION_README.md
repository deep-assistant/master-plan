# Deep Assistant - VS Code Extension

A powerful AI assistant extension for Visual Studio Code with full support for web-based editors like github.dev and vscode.dev.

## Features

- **Multiple AI Models**: Support for GPT-4o, Claude, DeepSeek, and more
- **Web Compatible**: Works seamlessly on github.dev and vscode.dev
- **Chat Interface**: Beautiful integrated chat panel in VS Code sidebar
- **Token Management**: Track your API usage with energy-based billing
- **Model Selection**: Easily switch between different AI models
- **Conversation History**: Maintains context across multiple messages

## Supported Models

- GPT-4o / GPT-4o-mini
- Claude 3.7 Sonnet / Claude 3.5 Sonnet / Claude Sonnet 4
- DeepSeek Chat / DeepSeek Reasoner
- o1-preview / o1-mini / o3-mini

## Installation

### From VS Code Marketplace (Coming Soon)

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Deep Assistant"
4. Click Install

### Manual Installation

1. Clone this repository
2. Install dependencies: `npm install`
3. Build the extension: `npm run package`
4. Install the `.vsix` file in VS Code

### Using on github.dev

The extension is fully compatible with github.dev! Simply:

1. Navigate to any GitHub repository
2. Press `.` to open github.dev
3. Install the Deep Assistant extension
4. Configure your API token in settings
5. Start chatting with AI!

## Configuration

After installation, configure the extension in VS Code settings:

1. **API Token** (`deepAssistant.apiToken`): Your Deep Assistant API token
2. **API Base URL** (`deepAssistant.apiBaseUrl`): Default: `https://api.deep-assistant.com`
3. **Default Model** (`deepAssistant.defaultModel`): Choose your preferred AI model
4. **System Message** (`deepAssistant.systemMessage`): Customize the AI's behavior
5. **Show Token Usage** (`deepAssistant.showTokenUsage`): Display energy/token usage

### Getting an API Token

To use the Deep Assistant extension, you need an API token:

1. Visit the Deep Assistant website (link coming soon)
2. Sign up or log in to your account
3. Generate an API token
4. Copy the token to VS Code settings

## Usage

### Opening the Chat Panel

- Click the Deep Assistant icon in the Activity Bar
- Or use Command Palette (Ctrl+Shift+P / Cmd+Shift+P): `Deep Assistant: Start Chat`

### Sending Messages

1. Type your message in the input field at the bottom of the chat panel
2. Press Enter or click Send
3. Wait for the AI response

### Available Commands

- **Deep Assistant: Start Chat** - Open the chat panel
- **Deep Assistant: Clear Chat History** - Clear conversation history
- **Deep Assistant: Select Model** - Choose a different AI model
- **Deep Assistant: Settings** - Open extension settings

### Keyboard Shortcuts

- `Enter` - Send message
- `Shift+Enter` - New line in message

## Architecture

This extension is built with:

- **TypeScript** - Type-safe code
- **Webpack** - Bundling for both desktop and web
- **VS Code API** - Native VS Code integration
- **Fetch API** - Web-compatible HTTP requests

### Project Structure

```
├── src/
│   ├── extension.ts           # Desktop extension entry point
│   ├── web/
│   │   └── extension.ts       # Web extension entry point
│   ├── apiClient.ts           # API integration layer
│   └── chatViewProvider.ts    # Chat UI implementation
├── dist/
│   ├── extension.js           # Compiled desktop extension
│   └── web/
│       └── extension.js       # Compiled web extension
├── package.json               # Extension manifest
├── webpack.config.js          # Build configuration
└── tsconfig.json              # TypeScript configuration
```

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- VS Code

### Setup

```bash
# Install dependencies
npm install

# Compile extension
npm run compile

# Compile web extension
npm run compile-web

# Watch mode (auto-compile on changes)
npm run watch
# or for web extension
npm run watch-web
```

### Testing Locally

1. Open this project in VS Code
2. Press F5 to launch Extension Development Host
3. Test your changes in the new VS Code window

### Testing on Web

```bash
# Build web extension
npm run compile-web

# Test in browser (requires @vscode/test-web)
npx @vscode/test-web --browserType=chromium --extensionDevelopmentPath=.
```

### Building for Production

```bash
# Build both desktop and web extensions
npm run package

# This creates optimized bundles in dist/
```

## API Integration

This extension integrates with the Deep Assistant API Gateway, which provides:

- OpenAI-compatible API endpoints
- Multi-provider failover (OpenAI, DeepSeek, OpenRouter, etc.)
- Token-based authentication
- Energy-based billing system
- Conversation history management

For API documentation, see the [api-gateway ARCHITECTURE.md](https://github.com/deep-assistant/api-gateway/blob/main/ARCHITECTURE.md).

## Roadmap

- [ ] Streaming responses support
- [ ] Code snippet insertion
- [ ] File context sharing
- [ ] Multi-turn conversations with history
- [ ] Voice input/output
- [ ] Image generation
- [ ] Code review assistance
- [ ] Custom system prompts per workspace

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

- Report issues: [GitHub Issues](https://github.com/deep-assistant/master-plan/issues)
- Discussions: [GitHub Discussions](https://github.com/deep-assistant/master-plan/discussions)

## License

This project is released under the Unlicense (public domain). See LICENSE file for details.

## Privacy

- All API requests are sent to the configured API endpoint
- No data is stored locally except for configuration
- Conversation history is managed server-side
- See our Privacy Policy for more details

## Credits

Developed by the Deep Assistant team as part of the mission to create a personal AI assistant available on any device.

---

**Enjoy using Deep Assistant!**
