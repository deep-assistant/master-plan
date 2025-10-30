# Deep Assistant Web Application

Browser-based interface for the Deep Assistant personal AI platform. Provides chat functionality, model selection, conversation management, and integration with various AI services through the existing api-gateway.

## Features

- **Chat Interface**: Real-time streaming chat with multiple AI models
- **Model Selection**: Choose from GPT-4, Claude, DeepSeek, and more
- **Token Management**: Track and manage your token balance
- **Conversation History**: Persistent conversation storage
- **Mobile Responsive**: Works on desktop, tablet, and mobile devices
- **Easy Deployment**: Docker support for self-hosting

## Technology Stack

- **Frontend**: React 18 + TypeScript 5
- **Build Tool**: Vite 5
- **Styling**: CSS Modules
- **Deployment**: Docker + Nginx

## Prerequisites

- Node.js 20+ (for development)
- Docker (for deployment)
- Access to the api-gateway service

## Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/deep-assistant/master-plan.git
   cd master-plan/web-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set your configuration:
   ```env
   VITE_API_GATEWAY_URL=http://localhost:3000
   VITE_APP_TITLE=Deep Assistant
   VITE_DEFAULT_MODEL=gpt-4o-mini
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

## Production Build

### Using npm

```bash
npm run build
npm run preview
```

### Using Docker

1. **Build the image**:
   ```bash
   docker build -t deep-assistant-web-app .
   ```

2. **Run the container**:
   ```bash
   docker run -p 8080:80 deep-assistant-web-app
   ```

   The application will be available at `http://localhost:8080`

### Using Docker Compose

```bash
docker-compose up -d
```

The application will be available at `http://localhost:8080`

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_GATEWAY_URL` | `http://localhost:3000` | URL of the api-gateway service |
| `VITE_APP_TITLE` | `Deep Assistant` | Application title shown in header |
| `VITE_DEFAULT_MODEL` | `gpt-4o-mini` | Default AI model selection |

### API Gateway Integration

The web app requires the [api-gateway](https://github.com/deep-assistant/api-gateway) service to be running. The api-gateway provides:

- Chat completions with streaming support
- Token-based authentication
- Conversation history management
- Multi-provider AI model access

## Usage

1. **Authentication**:
   - On first visit, you'll be prompted to enter an authentication token
   - Click "Generate New Token" to create a new token (starts with 10,000 free tokens)
   - Or enter an existing token

2. **Chat**:
   - Select your preferred AI model from the dropdown
   - Type your message in the input field
   - Press Enter or click Send
   - Watch the AI response stream in real-time

3. **Model Selection**:
   - Click the model dropdown in the header
   - Choose from available models (GPT-4, Claude, DeepSeek, etc.)
   - Your selection is saved for the current session

4. **Token Balance**:
   - Your current balance is displayed in the header
   - Balance updates automatically after each message
   - Different models have different token costs

## Architecture

See [ARCHITECTURE.md](../ARCHITECTURE.md) for detailed architecture documentation.

Key architectural decisions:

- **Client-Server Pattern**: React frontend communicates with api-gateway backend
- **Server-Sent Events**: Real-time message streaming using SSE
- **Token Authentication**: Bearer token-based auth compatible with api-gateway
- **CSS Modules**: Scoped styling for component isolation
- **Multi-stage Docker Build**: Optimized production images with Nginx

## Development

### Project Structure

```
web-app/
├── src/
│   ├── components/       # React components
│   │   ├── Chat/        # Chat interface
│   │   ├── ModelSelector/ # Model selection UI
│   │   ├── Settings/    # Auth and settings
│   │   └── Common/      # Shared components
│   ├── services/        # API communication
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   └── main.tsx         # Entry point
├── public/              # Static assets
├── nginx/               # Nginx config
├── Dockerfile           # Docker build
└── docker-compose.yml   # Orchestration
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Check TypeScript types

### Code Quality

- **TypeScript**: Full type safety with strict mode
- **ESLint**: Code quality and consistency checks
- **CSS Modules**: Scoped and modular styling
- **React Best Practices**: Functional components with hooks

## Deployment

### Self-Hosting

The web application is designed to be easily self-hosted:

1. **Docker Deployment** (recommended):
   ```bash
   docker-compose up -d
   ```

2. **Manual Deployment**:
   - Build: `npm run build`
   - Deploy the `dist/` folder to any static hosting service
   - Configure environment variables at build time

### Cloud Hosting

Compatible with:
- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages
- Any static hosting provider

**Note**: Make sure to set environment variables in your hosting platform's configuration.

## Integration with Deep Assistant Ecosystem

This web application is part of the Deep Assistant platform:

- **API Gateway**: Backend service for AI model access
- **Telegram Bot**: Telegram interface to the same platform
- **GPTutor**: VK and Telegram mini-apps
- **Web Capture**: Web page capture microservice

All services share the same authentication tokens and conversation storage.

## Contributing

Contributions are welcome! Please follow the organization's patterns:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write or update tests
5. Submit a pull request

Follow the existing code style and patterns:
- TypeScript for type safety
- Functional components with hooks
- CSS Modules for styling
- Meaningful commit messages

## Troubleshooting

### Issue: Cannot connect to API Gateway

**Solution**: Verify the `VITE_API_GATEWAY_URL` is correct and the api-gateway service is running.

### Issue: Token validation failed

**Solution**: Make sure you're using a valid token. Generate a new token if needed.

### Issue: Messages not streaming

**Solution**: Check browser console for errors. Ensure Server-Sent Events are supported and not blocked.

### Issue: Build fails

**Solution**: Delete `node_modules` and `package-lock.json`, then run `npm install` again.

## License

This project is released under the [Unlicense](../LICENSE) (public domain).

## Links

- [Issue #2](https://github.com/deep-assistant/master-plan/issues/2) - Original feature request
- [Architecture Documentation](../ARCHITECTURE.md)
- [API Gateway](https://github.com/deep-assistant/api-gateway)
- [Master Plan](https://github.com/deep-assistant/master-plan)

## Support

For issues and questions:
- Create an issue on [GitHub](https://github.com/deep-assistant/master-plan/issues)
- Join discussions at [GitHub Discussions](https://github.com/deep-assistant/master-plan/discussions)

---

**Status**: Initial MVP Implementation
**Version**: 1.0.0
**Last Updated**: 2025-10-30
