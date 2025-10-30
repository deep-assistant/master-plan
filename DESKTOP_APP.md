# Deep Assistant Desktop Application

Standalone desktop application for Deep Assistant, available for macOS, Linux, and Windows.

## Features

- Cross-platform support (macOS, Linux, Windows)
- Native desktop experience using Electron
- Secure API integration with context isolation
- Dark mode interface
- Chat history management
- Configurable API gateway connection

## Development

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

```bash
npm install
```

### Running in Development Mode

```bash
npm run dev
```

### Building for Production

Build for all platforms:
```bash
npm run dist:all
```

Build for specific platforms:
```bash
npm run dist:mac    # macOS
npm run dist:linux  # Linux
npm run dist:win    # Windows
```

## Configuration

Before using the application, you need to configure:

1. **API Gateway URL**: The URL of your Deep Assistant API gateway
2. **API Key**: Your authentication key for the API

You can configure these settings through the Settings panel (Cmd/Ctrl + ,).

## Architecture

The application follows Electron's security best practices:

- **Main Process** (`src/main.js`): Handles window management, menu creation, and system operations
- **Preload Script** (`src/preload.js`): Provides secure IPC communication bridge
- **Renderer Process** (`src/index.html`, `src/renderer.js`, `src/styles.css`): Handles UI and user interactions

Key features:
- Context isolation enabled
- Node integration disabled in renderer
- Content Security Policy enforced

## Project Structure

```
deep-assistant-desktop/
├── src/
│   ├── main.js          # Main Electron process
│   ├── preload.js       # Preload script for security
│   ├── renderer.js      # Renderer process logic
│   ├── index.html       # Main UI
│   └── styles.css       # Styling
├── assets/              # Application icons and resources
├── package.json         # Project configuration
├── DESKTOP_APP.md      # This file
└── ARCHITECTURE.md     # Detailed architecture documentation
```

## License

MIT
