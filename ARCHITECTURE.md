# Web Application Architecture Documentation

## Overview

The Web Application is a browser-based interface for the Deep Assistant personal AI platform. It provides users with chat functionality, model selection, conversation management, and integration with various AI services through the existing api-gateway.

**Key Specifications:**
- Frontend: React 18 + TypeScript 5
- Build Tool: Vite 5
- Styling: CSS Modules + Modern CSS
- License: Unlicense (public domain)
- Version: 1.0.0

## Mission Alignment

This web application supports the Deep Assistant mission: "Personal AI assistant that is available at any device and can be hosted on your hardware or in the cloud with easy migrations and synchronization between them."

The web interface provides:
- Browser-based access from any device
- Self-hosting capability via Docker
- Integration with existing backend infrastructure
- Consistent experience across platforms (web, Telegram, VK)

## System Architecture

The architecture follows a client-server pattern with the React frontend communicating with the existing api-gateway microservice for all AI operations.

### High-Level Flow

Users access the web application through a browser → React frontend handles UI/UX → API Gateway processes requests → External AI services (OpenAI, Anthropic, etc.) → Responses flow back through the gateway → Frontend displays results with streaming support

## Technology Stack

**Frontend:**
- React 18.3.1 with TypeScript 5.6
- Vite 5.4 for fast builds and HMR
- CSS Modules for scoped styling
- Fetch API for HTTP requests
- EventSource for Server-Sent Events (streaming)

**Backend Integration:**
- Existing api-gateway (Node.js/Express)
- OpenAI-compatible API endpoints
- Token-based authentication
- Conversation history persistence

**Development Tools:**
- ESLint for code quality
- TypeScript for type safety
- Vite development server with HMR

**Deployment:**
- Nginx as static file server
- Docker containerization
- Docker Compose orchestration

## Core Components

### 1. Frontend Application Structure

```
web-app/
├── src/
│   ├── components/          # React components
│   │   ├── Chat/           # Chat interface components
│   │   ├── ModelSelector/  # Model selection UI
│   │   ├── Settings/       # User settings and token management
│   │   └── Common/         # Shared UI components
│   ├── services/           # API communication layer
│   │   ├── api.ts          # API Gateway client
│   │   ├── auth.ts         # Authentication service
│   │   └── streaming.ts    # SSE streaming handler
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── App.tsx             # Main application component
│   └── main.tsx            # Application entry point
├── public/                 # Static assets
├── nginx/                  # Nginx configuration
├── Dockerfile             # Container configuration
├── docker-compose.yml     # Orchestration
└── package.json           # Dependencies and scripts
```

### 2. Key Features

**Chat Interface:**
- Real-time message streaming with SSE
- Message history with user/assistant roles
- Markdown rendering for formatted responses
- Code syntax highlighting
- Mobile-responsive design

**Model Management:**
- Model selection from available LLMs
- Display of token costs and capabilities
- Current model indicator

**Authentication:**
- Token-based authentication (32-char hex tokens)
- Token storage in localStorage
- Balance display and tracking
- Token generation for new users

**Conversation Management:**
- Persistent conversation history per user
- Clear conversation functionality
- Conversation list/history view

### 3. API Integration Layer (src/services/api.ts)

**Core API Client Features:**
- Base URL configuration via environment variables
- Bearer token authentication headers
- Error handling and retry logic
- Type-safe request/response handling

**Key Methods:**
```typescript
class ApiService {
  // Chat completions with streaming support
  async createChatCompletion(messages, model, stream = false)

  // Token management
  async getTokenBalance()
  async validateToken()
  async createToken()

  // Conversation history
  async getConversation()
  async clearConversation()

  // Model information
  async getAvailableModels()
}
```

### 4. Streaming Handler (src/services/streaming.ts)

Manages Server-Sent Events for real-time response streaming:

**Capabilities:**
- EventSource connection management
- Message chunk parsing
- Error handling and reconnection
- Stream completion detection
- Token usage tracking

**Flow:**
1. Establish SSE connection to /v1/chat/completions
2. Parse incoming chunks (data: [DONE] or JSON)
3. Extract delta content from streaming format
4. Update UI incrementally
5. Handle completion and cleanup

### 5. React Component Architecture

**App.tsx (Root Component):**
- Authentication state management
- Route/view switching
- Global error boundary

**Chat Component:**
- Message list rendering
- Input field with send button
- Model selector integration
- Streaming state handling
- Auto-scroll to latest message

**ModelSelector Component:**
- Dropdown/modal for model selection
- Model metadata display (cost, context window)
- Current selection indicator

**Settings Component:**
- Token input and validation
- Balance display
- Conversation management
- User preferences

### 6. State Management

**Approach:** React hooks (useState, useEffect, useContext)

**State Structure:**
```typescript
interface AppState {
  // Authentication
  token: string | null
  tokenBalance: number

  // Chat
  messages: Message[]
  currentModel: string
  isStreaming: boolean

  // UI
  isLoading: boolean
  error: string | null
}

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
  timestamp: Date
}
```

### 7. Configuration Management

**Environment Variables:**
```
VITE_API_GATEWAY_URL=http://localhost:3000
VITE_DEFAULT_MODEL=gpt-4o-mini
VITE_APP_TITLE=Deep Assistant
```

**Build-time Configuration:**
- API endpoint URLs
- Default model selection
- Feature flags

## Data Flow

### Chat Message Flow

1. User types message → Input component captures text
2. Send button clicked → Message added to local state
3. API service called with message history + new message
4. If streaming enabled:
   - EventSource connection opened
   - Chunks received and parsed
   - UI updated incrementally with assistant response
5. If non-streaming:
   - Single response received
   - UI updated with complete message
6. Token balance updated from response headers/metadata
7. Conversation persisted to api-gateway storage

### Authentication Flow

1. User opens app → Check localStorage for saved token
2. If no token → Show token input/generation screen
3. User inputs token OR requests new token generation
4. Token validated via /token endpoint
5. On success:
   - Token saved to localStorage
   - Balance fetched and displayed
   - Main chat interface loaded
6. On failure:
   - Error shown to user
   - Retry option provided

## Key Design Patterns

1. **Container/Presenter Pattern** - Smart containers manage state and logic, presenters handle UI
2. **Service Layer Pattern** - API communication abstracted into service classes
3. **Hook Pattern** - Custom hooks for reusable logic (useAuth, useChat, useStreaming)
4. **Error Boundary Pattern** - Graceful error handling at component boundaries
5. **Lazy Loading** - Code splitting for optimal bundle size

## Security Features

- Token stored in localStorage (HTTPS required in production)
- No sensitive data in URLs or logs
- CORS configuration for api-gateway integration
- Input sanitization for user messages
- XSS protection via React's built-in escaping

## Performance Considerations

- **Code Splitting** - Dynamic imports for route-based splitting
- **Memoization** - React.memo for expensive components
- **Virtual Scrolling** - For long conversation histories
- **Debouncing** - Input debouncing for search/filter features
- **Bundle Optimization** - Tree shaking and minification via Vite

## Deployment Architecture

### Development
```
npm run dev → Vite dev server on localhost:5173
```

### Production
```
Docker Build → Multi-stage build (node:20 + nginx:alpine)
├── Stage 1: npm install + npm run build
└── Stage 2: nginx serves static files from /usr/share/nginx/html
```

### Docker Compose
```yaml
services:
  web-app:
    build: .
    ports:
      - "8080:80"
    environment:
      - VITE_API_GATEWAY_URL=http://api-gateway:3000
    depends_on:
      - api-gateway
```

## Integration with Existing Services

### API Gateway Integration
- Uses existing /v1/chat/completions endpoint (OpenAI-compatible)
- Token authentication via Bearer token
- Conversation history via /dialog endpoints
- Token management via /token endpoints

### Future Integrations
- Image generation via /images endpoint
- Audio transcription via /v1/audio/transcriptions
- Text-to-speech via /v1/audio/speech
- Referral system via /referral endpoints

## Mobile Responsiveness

**Responsive Design Strategy:**
- Mobile-first CSS approach
- Flexible grid layouts
- Touch-friendly button sizes (min 44×44px)
- Adaptive typography
- Collapsible sidebars for mobile
- Bottom-anchored input on mobile devices

**Breakpoints:**
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## Accessibility

- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- Screen reader compatibility
- Sufficient color contrast (WCAG AA)
- Focus indicators for interactive elements

## Testing Strategy

**Unit Tests:**
- Component rendering tests (React Testing Library)
- Service layer tests (API mocking)
- Utility function tests

**Integration Tests:**
- API integration tests with mock server
- Authentication flow tests
- Chat flow tests

**E2E Tests:**
- Complete user journeys (future)
- Cross-browser testing (future)

## Monitoring and Logging

**Client-side Logging:**
- Error tracking with stack traces
- User action analytics (privacy-respecting)
- Performance metrics (Time to Interactive, First Contentful Paint)

**Error Handling:**
- Global error boundary
- Network error detection and retry
- User-friendly error messages

## Future Enhancements

Based on the roadmap and existing features:

1. **Stage 1: Core Improvements**
   - Custom system messages (Issue #14)
   - Multiple model support display with descriptions

2. **Stage 2: Rich Features**
   - Image generation UI
   - Audio transcription with file upload
   - Text-to-speech playback
   - Web search integration (Issue #52)

3. **Stage 3: Advanced Features**
   - Multi-conversation management (Issue #78)
   - Context switching (Issue #81)
   - Repository in context (Issue #24)

4. **Stage 4: Developer Features**
   - VS Code integration (Issue #9)
   - GitHub Copilot integration
   - Code execution sandbox

5. **Stage 5: Social & Monetization**
   - User payment model (Issue #18)
   - Referral system UI
   - Usage statistics dashboard (Issue #90)

## Contributing Guidelines

Follow the organization's patterns:
- TypeScript for type safety
- Functional components with hooks
- CSS Modules for styling
- ESLint configuration compliance
- Meaningful commit messages
- ARCHITECTURE.md updates for significant changes

## License

This project is released under the Unlicense (public domain), consistent with other Deep Assistant projects.

---

*Last Updated: 2025-10-30*
*Status: Initial Implementation / MVP*
*Related Issues: #2 (master-plan)*
