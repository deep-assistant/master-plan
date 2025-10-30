# Deep Assistant Desktop Application - Architecture

## Overview

The Deep Assistant Desktop Application is a cross-platform desktop client built with Electron, providing native access to the Deep Assistant AI service on macOS, Linux, and Windows.

## Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Electron 28.x
- **Build Tool**: electron-builder
- **UI**: Native HTML5/CSS3/JavaScript (no framework dependencies)
- **Architecture**: Multi-process (Main + Renderer with Context Isolation)

## Architecture Pattern

### Electron Multi-Process Architecture

The application follows Electron's recommended security architecture with three distinct processes:

```
┌─────────────────────────────────────────────────────────┐
│                     Main Process                         │
│                    (src/main.js)                        │
│                                                          │
│  - Window Management                                     │
│  - Menu Creation                                         │
│  - IPC Handlers                                          │
│  - System Integration                                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ IPC Communication
                     │
┌────────────────────┴────────────────────────────────────┐
│                  Preload Script                          │
│                 (src/preload.js)                        │
│                                                          │
│  - Secure IPC Bridge                                     │
│  - Context Bridge API                                    │
│  - sandboxed environment                                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ electronAPI
                     │
┌────────────────────┴────────────────────────────────────┐
│                 Renderer Process                         │
│         (src/index.html + src/renderer.js)              │
│                                                          │
│  - User Interface                                        │
│  - Chat Management                                       │
│  - Settings UI                                           │
│  - Event Handling                                        │
└──────────────────────────────────────────────────────────┘
```

### Security Model

The application implements Electron's security best practices:

1. **Context Isolation**: Enabled - Renderer process cannot directly access Node.js or Electron APIs
2. **Node Integration**: Disabled in renderer - Prevents potential XSS attacks
3. **Preload Script**: Acts as a secure bridge, exposing only necessary APIs
4. **Content Security Policy**: Enforced to prevent loading external scripts
5. **Sandboxing**: Renderer process runs in a restricted environment

### IPC Communication Flow

```
User Action (Renderer)
    ↓
electronAPI.sendMessage() (Preload)
    ↓
ipcRenderer.invoke() (Secure Channel)
    ↓
ipcMain.handle() (Main Process)
    ↓
API Request (Future: HTTP to API Gateway)
    ↓
Response Processing (Main Process)
    ↓
Return to Renderer
    ↓
UI Update
```

## Components

### Main Process (`src/main.js`)

**Responsibilities:**
- Create and manage browser windows
- Handle application lifecycle events
- Create native menus
- Process IPC requests from renderer
- Future: HTTP API communication

**Key Functions:**
- `createWindow()`: Initializes main application window with security settings
- `createMenu()`: Builds native application menu with keyboard shortcuts
- IPC Handlers:
  - `get-api-config`: Retrieves stored API configuration
  - `save-api-config`: Persists API settings
  - `send-message`: Processes chat messages (placeholder for API integration)

### Preload Script (`src/preload.js`)

**Responsibilities:**
- Bridge between renderer and main processes
- Expose minimal, secure API to renderer
- Implement context bridge

**Exposed API (`window.electronAPI`):**
- `getApiConfig()`: Fetch API configuration
- `saveApiConfig(config)`: Save API settings
- `sendMessage(data)`: Send chat message to API
- `onNewChat(callback)`: Listen for new chat menu events
- `onOpenSettings(callback)`: Listen for settings menu events

### Renderer Process

#### HTML (`src/index.html`)

**Structure:**
- Sidebar: Chat history and settings access
- Main area: Message display and input
- Settings panel: Configuration overlay

**Security:**
- Content Security Policy header
- No inline scripts or styles (except 'unsafe-inline' for styles, which could be improved)

#### JavaScript (`src/renderer.js`)

**State Management:**
- `apiConfig`: Stores API URL and key
- `currentChatId`: Tracks active conversation

**Key Functions:**
- `init()`: Initializes application state and event listeners
- `handleSendMessage()`: Processes outgoing messages
- `addMessage()`: Renders messages to UI
- `handleNewChat()`: Resets conversation
- Settings management functions

#### CSS (`src/styles.css`)

**Design System:**
- CSS Variables for theming
- Dark mode by default
- Responsive layout with flexbox
- Custom scrollbar styling

**Color Scheme:**
```css
--bg-primary: #1a1a1a    (Main background)
--bg-secondary: #2d2d2d  (Sidebar, panels)
--bg-tertiary: #3d3d3d   (Hover states)
--accent-color: #0066cc  (Interactive elements)
```

## Build System

### electron-builder Configuration

Located in `package.json` under `build` section:

**Targets:**
- **macOS**: DMG and ZIP formats, requires ICNS icon
- **Linux**: AppImage, DEB, RPM packages
- **Windows**: NSIS installer and portable executable

**Output:**
- Build artifacts saved to `dist/` directory
- Different formats for each platform

### Scripts

```json
"start": "electron ."           // Run application
"dev": "electron . --dev"       // Run with DevTools
"pack": "electron-builder --dir" // Build without packaging
"dist": "electron-builder"      // Build for current platform
"dist:mac": "..."               // Build for macOS
"dist:linux": "..."             // Build for Linux
"dist:win": "..."               // Build for Windows
"dist:all": "..."               // Build for all platforms
```

## Data Flow

### Message Sending Flow

1. User types message in `<textarea>`
2. User clicks send or presses Enter
3. `handleSendMessage()` validates input and API config
4. Message added to UI as "user" role
5. Loading indicator added as "assistant" role
6. `window.electronAPI.sendMessage()` called
7. Preload script forwards via `ipcRenderer.invoke()`
8. Main process receives via `ipcMain.handle()`
9. **(Future)** Main process makes HTTP request to API Gateway
10. Response returned through IPC chain
11. Renderer updates UI with response
12. Loading indicator removed

### Configuration Flow

1. User opens Settings (menu or button)
2. Settings panel slides in from right
3. User enters API URL and key
4. User clicks "Save Settings"
5. Validation performed (URL format check)
6. `window.electronAPI.saveApiConfig()` called
7. Main process stores configuration
8. **(Future)** Persist to config file or secure storage
9. Success message displayed
10. Panel auto-closes after delay

## Integration Points

### API Gateway Integration (Future Implementation)

The application is designed to integrate with the Deep Assistant API Gateway:

**Endpoint Pattern:**
```
POST {apiUrl}/v1/chat/completions
Authorization: Bearer {apiKey}
Content-Type: application/json

{
  "model": "gpt-4o",
  "messages": [
    {"role": "user", "content": "..."}
  ],
  "stream": true
}
```

**Planned Features:**
- Streaming responses (SSE)
- Token usage tracking
- Model selection
- Dialog history persistence
- Error handling with failover

### Local Storage (Future)

Plans for persistent storage:
- Chat history in local database (e.g., LowDB, SQLite)
- API credentials in secure storage (electron-store with encryption)
- User preferences (theme, settings)
- Cached responses for offline viewing

## File Structure

```
deep-assistant-desktop/
├── src/
│   ├── main.js          # Main process entry point
│   ├── preload.js       # Secure IPC bridge
│   ├── renderer.js      # UI logic
│   ├── index.html       # Application UI
│   └── styles.css       # Styling
├── assets/
│   ├── icon.png         # Linux icon
│   ├── icon.icns        # macOS icon
│   ├── icon.ico         # Windows icon
│   └── README.md        # Asset guidelines
├── dist/                # Build output (gitignored)
├── node_modules/        # Dependencies (gitignored)
├── package.json         # Project config
├── package-lock.json    # Dependency lock
├── ARCHITECTURE.md      # This file
├── DESKTOP_APP.md       # User documentation
├── README.md            # Repository overview
└── .gitignore          # Git exclusions
```

## Future Enhancements

### Phase 1: Core Functionality
- [ ] Complete API Gateway integration with HTTP client
- [ ] Implement streaming response handling
- [ ] Add model selection dropdown
- [ ] Persist chat history locally
- [ ] Secure credential storage

### Phase 2: User Experience
- [ ] Multi-chat management (tabs or list)
- [ ] Export conversations (text, markdown, PDF)
- [ ] Search within conversations
- [ ] Keyboard shortcuts for common actions
- [ ] System tray integration

### Phase 3: Advanced Features
- [ ] Voice input (speech-to-text)
- [ ] Voice output (text-to-speech)
- [ ] Theme customization (light mode, custom colors)
- [ ] Plugin system for extensions
- [ ] Auto-updates mechanism

### Phase 4: Performance & Polish
- [ ] Lazy loading for large chat histories
- [ ] Optimized rendering for long messages
- [ ] Markdown rendering for formatted responses
- [ ] Code syntax highlighting
- [ ] Image/file upload support

## Development Guidelines

### Security Considerations

1. **Never** enable `nodeIntegration` without `contextIsolation`
2. **Always** validate input from renderer before processing
3. **Always** use `contextBridge` for exposing APIs
4. Store credentials securely (use electron-store with encryption)
5. Implement proper CSP headers
6. Keep Electron and dependencies updated

### Testing Strategy

Future testing framework:
- **Unit Tests**: Jest for business logic
- **Integration Tests**: Spectron for Electron flows
- **E2E Tests**: Playwright for full user scenarios
- **Security Audit**: npm audit, Electronegativity

### Build & Release

Recommended CI/CD workflow:
1. Run linting and tests
2. Build for all platforms
3. Sign binaries (macOS/Windows)
4. Create GitHub releases with artifacts
5. Update auto-updater manifest

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [Electron Security Guidelines](https://www.electronjs.org/docs/tutorial/security)
- [electron-builder](https://www.electron.build/)
- [Deep Assistant API Gateway](https://github.com/deep-assistant/api-gateway)

## License

MIT
