# GitHub Bot App Architecture

## Overview

The GitHub Bot App is a microservice that enables users to interact with GitHub repositories through the Telegram bot. It provides functionality for creating issues and solving them by generating Pull Requests, all through conversational commands in Telegram.

## Purpose

This service bridges the gap between the existing Telegram bot and GitHub's ecosystem, allowing users to:
- Create GitHub issues directly from Telegram conversations
- Request automated issue resolution via AI-powered Pull Request generation
- Monitor and manage GitHub activities without leaving Telegram
- Leverage the deep-assistant's AI capabilities for repository management

## Technology Stack

### Core Framework
- **Runtime:** Node.js 18+ with ES Modules
- **Framework:** Express.js for REST API endpoints
- **GitHub Integration:** Octokit (GitHub REST API v3 client)
- **Authentication:** JWT for GitHub App authentication

### GitHub App Components
- **App Authentication:** Private key-based JWT tokens
- **Installation Tokens:** Per-installation access tokens with repository permissions
- **Webhooks:** Event-driven architecture for GitHub activity monitoring

### Data Persistence
- **Primary Store:** LowDB (JSON file-based) for configuration and state
- **Optional:** Redis for caching and rate limiting (future enhancement)

### Integration Layer
- **Telegram Bot:** Via existing telegram-bot service
- **API Gateway:** For user authentication and token management
- **AI Services:** Claude/GPT models for code generation and issue analysis

## Architecture Components

### 1. GitHub App Core

#### Authentication Service
```
┌─────────────────────────────────────┐
│   GitHub App Authentication        │
├─────────────────────────────────────┤
│ • JWT Token Generation             │
│ • Installation Access Tokens       │
│ • Token Refresh & Caching          │
│ • Permission Validation            │
└─────────────────────────────────────┘
```

**Responsibilities:**
- Generate JWT tokens using the GitHub App's private key
- Obtain installation access tokens for specific repositories
- Cache tokens to minimize API calls
- Validate permissions before operations

#### Webhook Handler
```
┌─────────────────────────────────────┐
│      Webhook Event Processor        │
├─────────────────────────────────────┤
│ • Signature Verification           │
│ • Event Type Routing               │
│ • Payload Validation               │
│ • Error Handling & Logging         │
└─────────────────────────────────────┘
```

**Supported Events:**
- `issues.opened` - New issue notifications
- `pull_request.opened` - PR status updates
- `pull_request.closed` - PR completion tracking
- `installation.created` - New repository access
- `installation_repositories.added` - Repository authorization

### 2. Issue Management Service

#### Issue Creator
```
┌─────────────────────────────────────┐
│        Issue Creation Flow          │
├─────────────────────────────────────┤
│ 1. Parse user request from Telegram│
│ 2. Validate repository access      │
│ 3. Format issue content            │
│ 4. Create issue via GitHub API     │
│ 5. Return issue URL to user        │
└─────────────────────────────────────┘
```

**Features:**
- Natural language to issue formatting
- Template support for common issue types
- Label and milestone assignment
- Assignee suggestions based on repository contributors

#### Issue Analyzer
```
┌─────────────────────────────────────┐
│        Issue Analysis Engine        │
├─────────────────────────────────────┤
│ • Extract requirements              │
│ • Identify affected files           │
│ • Analyze codebase context          │
│ • Generate implementation plan      │
└─────────────────────────────────────┘
```

**Capabilities:**
- Semantic understanding of issue descriptions
- Repository structure analysis
- Dependency mapping
- Complexity estimation

### 3. Pull Request Generation Service

#### Code Generator
```
┌─────────────────────────────────────┐
│     AI-Powered Code Generation      │
├─────────────────────────────────────┤
│ 1. Clone repository (shallow)       │
│ 2. Analyze existing code patterns   │
│ 3. Generate solution using AI       │
│ 4. Run tests and linters            │
│ 5. Commit changes to new branch     │
│ 6. Create Pull Request              │
└─────────────────────────────────────┘
```

**Workflow:**
- Fetch issue details and requirements
- Download relevant repository files
- Use Claude/GPT for code generation with context
- Apply code style and formatting rules
- Create atomic, reviewable commits
- Generate comprehensive PR description

#### PR Manager
```
┌─────────────────────────────────────┐
│      Pull Request Management        │
├─────────────────────────────────────┤
│ • Branch creation & management      │
│ • Commit message formatting         │
│ • PR description generation         │
│ • Status tracking & updates         │
└─────────────────────────────────────┘
```

### 4. Integration Layer

#### Telegram Bot Interface
```
┌─────────────────────────────────────┐
│       Telegram Command Handler      │
├─────────────────────────────────────┤
│ /github_issue <repo> <description>  │
│ /github_solve <issue_url>           │
│ /github_status <pr_url>             │
│ /github_repos - List repositories   │
└─────────────────────────────────────┘
```

**Command Flow:**
```
Telegram User → Bot Router → GitHub Bot Service → GitHub API
                    ↓
              API Gateway (Auth)
                    ↓
              AI Service (Code Gen)
```

## Data Flow

### Creating an Issue
```
1. User: "/github_issue deep-assistant/api-gateway Add rate limiting"
   ↓
2. Telegram Bot validates command and user authentication
   ↓
3. GitHub Bot Service receives request via REST API
   ↓
4. Service validates installation and repository access
   ↓
5. AI formats the request into proper issue structure
   ↓
6. GitHub API creates the issue
   ↓
7. Issue URL sent back to user in Telegram
```

### Solving an Issue
```
1. User: "/github_solve https://github.com/org/repo/issues/42"
   ↓
2. GitHub Bot fetches issue details and repository
   ↓
3. Issue Analyzer extracts requirements and context
   ↓
4. Code Generator:
   - Clones repository
   - Analyzes codebase
   - Generates solution using AI
   - Creates tests
   ↓
5. PR Manager:
   - Creates feature branch
   - Commits changes
   - Pushes to GitHub
   - Opens Pull Request
   ↓
6. PR URL and status sent to user in Telegram
   ↓
7. Webhook notifications for PR updates forwarded to Telegram
```

## Security Architecture

### Authentication & Authorization

**GitHub App Authentication:**
- Private key stored securely (environment variable or secrets manager)
- JWT tokens generated with short expiration (10 minutes)
- Installation tokens cached with automatic refresh

**User Authorization:**
- Users must authenticate via API Gateway
- Repository access validated against GitHub App installations
- Rate limiting per user to prevent abuse

**Webhook Security:**
- Signature verification using webhook secret
- HTTPS-only endpoint
- Replay attack prevention via timestamp validation

### Data Protection

**Sensitive Data:**
- GitHub App private key: Environment variable, never logged
- Installation tokens: In-memory cache with encryption at rest
- User associations: Hashed identifiers linking Telegram to GitHub

**Code Security:**
- Sandboxed execution environment for AI-generated code
- No arbitrary code execution from user input
- Repository clones isolated per request
- Automatic cleanup of temporary files

## Scalability Considerations

### Current Phase (MVP)
- Single service instance
- File-based storage (LowDB)
- Synchronous processing
- Manual repository installation

### Future Enhancements

**Horizontal Scaling:**
- Stateless service design
- Redis for shared caching
- Queue system (Bull/BullMQ) for async processing
- Load balancer for multiple instances

**Performance Optimization:**
- Repository cloning: Shallow clones, cached between requests
- AI generation: Streaming responses for real-time feedback
- Webhook processing: Background job queue
- Rate limiting: Distributed rate limiter

## Monitoring & Observability

### Logging Strategy
- **Framework:** Pino with log rotation
- **Levels:** DEBUG, INFO, WARN, ERROR
- **Context:** Request ID tracking across services

### Metrics
- Issue creation success/failure rate
- PR generation completion time
- GitHub API rate limit consumption
- User engagement statistics

### Error Handling
- Graceful degradation for API failures
- User-friendly error messages in Telegram
- Detailed error logging for debugging
- Automatic retry with exponential backoff

## Deployment Architecture

### Development Environment
```
┌──────────────────────────────────────┐
│         Local Development            │
├──────────────────────────────────────┤
│ • Smee.io for webhook forwarding     │
│ • GitHub App in development mode     │
│ • Local API Gateway & Telegram Bot   │
│ • Mock AI services for testing       │
└──────────────────────────────────────┘
```

### Production Environment
```
┌──────────────────────────────────────┐
│            Cloud Hosting             │
├──────────────────────────────────────┤
│ GitHub Bot Service (Node.js)         │
│ ├─ Express API Server                │
│ ├─ Webhook Handler                   │
│ └─ Background Job Processor          │
│                                       │
│ Supporting Services                  │
│ ├─ API Gateway (existing)            │
│ ├─ Telegram Bot (existing)           │
│ └─ Redis (caching)                   │
│                                       │
│ External Services                    │
│ ├─ GitHub API                        │
│ ├─ OpenAI/Anthropic APIs             │
│ └─ Monitoring (e.g., Sentry)         │
└──────────────────────────────────────┘
```

## Integration with Existing Services

### API Gateway Integration
- **Authentication:** Reuse existing user token system
- **Energy Currency:** Deduct cost for AI-powered operations
- **Provider Failover:** Leverage existing AI provider chains

### Telegram Bot Integration
- **Command Router:** Add new GitHub-specific command handlers
- **Message Formatting:** Consistent UI/UX with existing features
- **Notification System:** Webhook events as Telegram messages

### Data Sharing
- **User Profiles:** Link Telegram users to GitHub accounts
- **Usage Statistics:** Track GitHub operations in analytics
- **Referral System:** Credit referrers for GitHub bot usage

## Configuration Management

### Environment Variables
```bash
# GitHub App Configuration
GITHUB_APP_ID=123456
GITHUB_APP_PRIVATE_KEY=<base64-encoded-key>
GITHUB_WEBHOOK_SECRET=<webhook-secret>

# Service Configuration
PORT=3000
NODE_ENV=production
LOG_LEVEL=info

# Integration Endpoints
API_GATEWAY_URL=https://api.deep-assistant.com
TELEGRAM_BOT_WEBHOOK=https://telegram.deep-assistant.com/webhook

# AI Services
AI_MODEL_DEFAULT=claude-3-5-sonnet-20241022
AI_MAX_TOKENS=4096

# Security
JWT_SECRET=<jwt-secret>
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=10
```

### Feature Flags
```json
{
  "features": {
    "issue_creation": true,
    "pr_generation": true,
    "auto_merge": false,
    "advanced_analysis": false,
    "multi_file_edits": true
  }
}
```

## API Specification

### REST Endpoints

#### Issue Operations
```
POST /api/issues/create
Body: {
  "repository": "owner/repo",
  "title": "Issue title",
  "description": "Issue description",
  "labels": ["bug", "enhancement"],
  "userId": "telegram-user-id"
}
Response: {
  "success": true,
  "issueUrl": "https://github.com/owner/repo/issues/42",
  "issueNumber": 42
}
```

#### PR Operations
```
POST /api/pull-requests/solve
Body: {
  "issueUrl": "https://github.com/owner/repo/issues/42",
  "userId": "telegram-user-id"
}
Response: {
  "success": true,
  "status": "processing",
  "jobId": "uuid",
  "estimatedTime": 300
}

GET /api/pull-requests/status/:jobId
Response: {
  "status": "completed",
  "prUrl": "https://github.com/owner/repo/pull/43",
  "branch": "fix-issue-42",
  "commits": 3
}
```

#### Webhook Endpoint
```
POST /webhooks/github
Headers: {
  "X-Hub-Signature-256": "sha256=...",
  "X-GitHub-Event": "issues"
}
Body: <GitHub webhook payload>
```

## Error Handling Matrix

| Error Type | User Message | Action | Retry |
|------------|-------------|--------|-------|
| Invalid repository | "Cannot access repository. Please install the GitHub App." | Send installation link | No |
| Permission denied | "You don't have permission to create issues in this repository." | Check user access | No |
| API rate limit | "GitHub API limit reached. Try again in X minutes." | Queue request | Auto |
| AI generation failed | "Could not generate solution. Issue too complex." | Suggest manual resolution | Yes |
| Network timeout | "Request timed out. Please try again." | Retry request | Auto |
| Invalid issue URL | "Please provide a valid GitHub issue URL." | Parse validation | No |

## Future Enhancements

### Phase 2: Advanced Features
- Multi-file PR generation
- Test coverage analysis and generation
- Code review integration with AI
- Automatic issue labeling and triaging

### Phase 3: Collaboration
- Team assignment and notifications
- PR review requests via Telegram
- Merge conflict resolution assistance
- Release notes generation

### Phase 4: Analytics
- Repository health dashboard
- Contribution statistics
- Issue resolution metrics
- AI-generated code quality tracking

## References

- [GitHub Apps Documentation](https://docs.github.com/en/apps)
- [Octokit.js Documentation](https://github.com/octokit/octokit.js)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [OpenAI API](https://platform.openai.com/docs)
- [Anthropic Claude API](https://docs.anthropic.com/)
