# Developer Mode Architecture

> Integration of open-source VS Code and AI coding assistant (Copilot alternative) in browser for web application

**Status:** 🚧 Architecture Design / Planning Phase
**Related Issue:** [#9](https://github.com/deep-assistant/master-plan/issues/9)
**Priority:** Medium | **Complexity:** Very High

---

## Table of Contents

1. [Overview](#overview)
2. [Requirements](#requirements)
3. [Technology Stack](#technology-stack)
4. [Architecture Design](#architecture-design)
5. [Component Breakdown](#component-breakdown)
6. [Integration Strategy](#integration-strategy)
7. [Security Considerations](#security-considerations)
8. [Implementation Roadmap](#implementation-roadmap)
9. [Deployment Strategy](#deployment-strategy)
10. [Monitoring and Maintenance](#monitoring-and-maintenance)
11. [References](#references)

---

## Overview

The Developer Mode feature enables users to access a fully-featured, browser-based VS Code environment with AI-powered coding assistance, providing a seamless development experience directly within the web application. This feature aims to create a personal AI assistant that includes professional development tools accessible from any device.

### Goals

- Provide a browser-based VS Code experience with no local installation required
- Integrate AI-powered code completion and assistance (open-source Copilot alternative)
- Enable users to code, debug, and manage projects entirely in the browser
- Support multiple programming languages and frameworks
- Maintain data privacy and security for user code
- Allow easy migration between devices while maintaining workspace state

### Non-Goals (Out of Scope)

- Local desktop VS Code installation management
- Direct GitHub Copilot integration (proprietary)
- Full local development environment emulation
- Real-time collaborative editing (may be added later)

---

## Requirements

### Functional Requirements

1. **Code Editor**
   - Full-featured code editor with syntax highlighting
   - IntelliSense and auto-completion
   - Code formatting and linting
   - File and folder management
   - Multi-file editing with tabs
   - Terminal access within the browser

2. **AI Coding Assistant**
   - Context-aware code completion
   - Code generation from natural language descriptions
   - Code explanation and documentation generation
   - Bug detection and fix suggestions
   - Refactoring suggestions
   - Chat interface for coding questions

3. **Extension Support**
   - Support for VS Code extensions from Open-VSX registry
   - Pre-installed essential extensions (language support, themes, etc.)
   - User ability to install additional extensions

4. **Workspace Management**
   - Save and restore workspace state
   - Project file synchronization
   - Support for Git operations
   - Import/export projects

### Non-Functional Requirements

1. **Performance**
   - Fast initial load time (< 5 seconds)
   - Responsive editor interactions (< 100ms latency)
   - AI suggestions within 1-2 seconds
   - Efficient resource usage (memory and CPU)

2. **Security**
   - Secure authentication and authorization
   - Code encryption at rest and in transit
   - Sandboxed execution environment
   - API key management for AI services
   - CORS and CSP compliance

3. **Scalability**
   - Support for multiple concurrent users
   - Horizontal scaling capability
   - Efficient resource allocation per user session

4. **Availability**
   - 99.9% uptime SLA
   - Graceful degradation when AI service is unavailable
   - Session persistence and recovery

5. **Usability**
   - Intuitive user interface
   - Consistent with VS Code experience
   - Mobile-responsive design (basic support)
   - Accessible (WCAG 2.1 AA compliance)

---

## Technology Stack

### Core Components

#### 1. Browser-Based VS Code

**Selected Solution: OpenVSCode Server**

**Rationale:**
- Direct fork of VS Code with minimal modifications
- Production-tested at scale (Gitpod, GitHub Codespaces)
- Active maintenance and community support
- Clean architecture for web deployment
- Open-source (MIT license)

**Alternatives Considered:**
- **code-server (Coder):** More opinionated with additional features, but heavier and includes modifications that may diverge from upstream VS Code
- **Monaco Editor:** Lightweight but lacks full IDE features (terminal, extensions, file system)
- **Microsoft VS Code for Web:** Requires Microsoft marketplace access (not available for third-party use)

**Key Features:**
- Full VS Code experience in browser
- Terminal support
- Extension marketplace via Open-VSX
- Git integration
- File system access
- Debugging support

#### 2. AI Coding Assistant

**Selected Solution: Tabby**

**Rationale:**
- Self-hosted and privacy-focused
- OpenAPI interface for easy integration
- Active development with regular updates (v0.29 in May 2025)
- Support for multiple AI models (local and cloud-based)
- Built-in VS Code extension available
- Knowledge management with repository context
- Docker deployment support
- GPU support for performance

**Alternatives Considered:**
- **Continue.dev:** Excellent flexibility, but requires more custom configuration and integration work
- **Cody (Sourcegraph):** Strong for enterprise, but requires Sourcegraph infrastructure
- **FauxPilot:** Less actively maintained, limited feature set

**Key Features:**
- Code completion with repository context
- Chat interface for coding assistance
- OpenAI-compatible API
- VS Code extension for seamless integration
- Support for custom AI models
- GitLab/GitHub integration for context
- Document ingestion API
- LDAP/JWT authentication support

#### 3. Backend Infrastructure

**Proposed Stack:**
- **Web Framework:** Node.js with Express or Next.js
- **API Gateway:** Existing api-gateway from deep-assistant ecosystem
- **Database:** PostgreSQL for user data, workspace metadata
- **File Storage:** S3-compatible storage (MinIO, AWS S3, or similar) for user files
- **Session Management:** Redis for session state and caching
- **Container Orchestration:** Docker + Kubernetes for scalability

#### 4. Frontend Integration

**Proposed Stack:**
- **Web Framework:** React or Next.js (consistent with existing stack)
- **State Management:** Redux or Zustand
- **UI Components:** Tailwind CSS or Material-UI
- **Authentication:** JWT tokens, OAuth2 integration

---

## Architecture Design

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          User Browser                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Web Application Frontend                     │  │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────────┐   │  │
│  │  │   Chat UI  │  │ Dashboard  │  │  Developer Mode  │   │  │
│  │  │            │  │            │  │     Toggle       │   │  │
│  │  └────────────┘  └────────────┘  └──────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌───────────────────────────▼──────────────────────────────┐  │
│  │         OpenVSCode Server (Embedded in iframe)           │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │    Editor    │  │   Terminal   │  │ File Manager │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │  Extensions  │  │ Tabby Plugin │  │  Git Panel   │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                    Backend Infrastructure                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                     API Gateway                            │ │
│  │              (Existing deep-assistant gateway)             │ │
│  └────────────────┬───────────────────────┬───────────────────┘ │
│                   │                       │                      │
│  ┌────────────────▼────────┐  ┌──────────▼──────────────────┐  │
│  │  OpenVSCode Server      │  │    Tabby AI Service         │  │
│  │     (per-user pod)      │  │  (shared/multi-tenant)      │  │
│  │  ┌──────────────────┐   │  │  ┌──────────────────────┐  │  │
│  │  │  File System     │   │  │  │  Code Completion     │  │  │
│  │  │  (ephemeral/pvc) │   │  │  │      Models          │  │  │
│  │  └──────────────────┘   │  │  └──────────────────────┘  │  │
│  │  ┌──────────────────┐   │  │  ┌──────────────────────┐  │  │
│  │  │   Extensions     │   │  │  │   Chat Service       │  │  │
│  │  └──────────────────┘   │  │  └──────────────────────┘  │  │
│  └─────────────┬───────────┘  │  ┌──────────────────────┐  │  │
│                │               │  │  Repository Context  │  │  │
│                │               │  └──────────────────────┘  │  │
│                │               └─────────────┬───────────────┘  │
│                │                             │                  │
│  ┌─────────────▼─────────────────────────────▼───────────────┐ │
│  │              Persistent Storage Layer                     │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │ │
│  │  │  PostgreSQL  │  │     Redis    │  │  S3/MinIO    │   │ │
│  │  │  (metadata)  │  │   (cache)    │  │ (user files) │   │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Diagrams

#### 1. User Initiates Developer Mode

```
User → Web App → API Gateway → Session Manager → OpenVSCode Server Pod
                                                         ↓
                                              Load workspace from S3
                                                         ↓
                                              Initialize extensions (inc. Tabby)
                                                         ↓
                                              Return iframe URL with auth token
                                                         ↓
Web App ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
   ↓
Render OpenVSCode Server in iframe
```

#### 2. AI Code Completion Request

```
User types code → OpenVSCode Server → Tabby Extension → Tabby Service
                                                              ↓
                                                    Load repo context
                                                              ↓
                                                    Generate completion
                                                              ↓
OpenVSCode Server ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
   ↓
Display inline suggestion
```

#### 3. Save Workspace

```
User saves file → OpenVSCode Server → API Gateway → File Storage Service
                                                            ↓
                                                    Save to S3/MinIO
                                                            ↓
                                                    Update metadata in PostgreSQL
                                                            ↓
OpenVSCode Server ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
   ↓
Confirm save success
```

---

## Component Breakdown

### 1. OpenVSCode Server Service

**Responsibilities:**
- Serve VS Code interface in browser
- Manage user workspace and file system
- Provide terminal access
- Handle extension loading and management
- Execute code and run development servers

**Configuration:**
```yaml
# docker-compose.yml example
openvscode-server:
  image: gitpod/openvscode-server:latest
  environment:
    - OPENVSCODE_SERVER_ROOT=/workspace
    - CONNECTION_TOKEN=${USER_TOKEN}
  volumes:
    - user-workspace:/workspace
    - extensions:/root/.openvscode-server/extensions
  ports:
    - "3000:3000"
  resources:
    limits:
      memory: 2Gi
      cpu: 1000m
    requests:
      memory: 512Mi
      cpu: 250m
```

**API Endpoints:**
- `GET /healthz` - Health check
- `GET /` - Main VS Code interface
- `WebSocket /` - Terminal and file system operations

**Key Features:**
- Per-user isolated containers
- Automatic workspace persistence
- Pre-installed extensions
- Custom configuration injection

### 2. Tabby AI Service

**Responsibilities:**
- Provide code completion suggestions
- Handle chat-based coding assistance
- Maintain repository context and embeddings
- Manage AI model lifecycle

**Configuration:**
```yaml
# docker-compose.yml example
tabby:
  image: tabbyml/tabby:latest
  command: serve --model StarCoder-1B --chat-model Qwen2 --device cuda
  environment:
    - TABBY_API_KEY=${TABBY_API_KEY}
    - TABBY_MODEL_CACHE=/data/models
  volumes:
    - tabby-data:/data
  ports:
    - "8080:8080"
  resources:
    limits:
      memory: 8Gi
      cpu: 4000m
      nvidia.com/gpu: 1
```

**API Endpoints:**
- `GET /v1/health` - Health check
- `POST /v1/completions` - Code completion
- `POST /v1/chat/completions` - Chat interface
- `POST /v1beta/ingestion` - Document ingestion
- `GET /swagger-ui` - API documentation

**Authentication:**
```http
Authorization: Bearer <token>
```

**Sample Request (Code Completion):**
```json
POST /v1/completions
{
  "language": "python",
  "segments": {
    "prefix": "def fibonacci(n):\n    ",
    "suffix": "\n    return result"
  }
}
```

**Sample Response:**
```json
{
  "id": "cmpl-xxxxx",
  "choices": [
    {
      "text": "if n <= 1:\n        return n\n    result = fibonacci(n-1) + fibonacci(n-2)",
      "index": 0
    }
  ]
}
```

### 3. API Gateway Service

**Responsibilities:**
- Route requests to appropriate services
- Implement authentication and authorization
- Rate limiting and quota management
- Request logging and monitoring
- SSL/TLS termination

**Endpoints:**
- `POST /api/developer-mode/start` - Initialize developer session
- `POST /api/developer-mode/stop` - Terminate developer session
- `GET /api/developer-mode/status` - Get session status
- `GET /api/developer-mode/workspaces` - List user workspaces
- `POST /api/developer-mode/workspace/save` - Save workspace state
- `POST /api/developer-mode/workspace/restore` - Restore workspace

### 4. Frontend Integration Component

**Responsibilities:**
- Embed OpenVSCode Server in iframe
- Handle authentication token passing
- Manage session lifecycle
- Provide UI for mode switching
- Handle error states and fallbacks

**Sample React Component:**
```typescript
import React, { useEffect, useState } from 'react';

interface DeveloperModeProps {
  user: User;
  workspaceId?: string;
}

const DeveloperMode: React.FC<DeveloperModeProps> = ({ user, workspaceId }) => {
  const [sessionUrl, setSessionUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeSession = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/developer-mode/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify({ workspaceId })
        });

        if (!response.ok) {
          throw new Error('Failed to start developer session');
        }

        const data = await response.json();
        setSessionUrl(data.url);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeSession();

    // Cleanup on unmount
    return () => {
      fetch('/api/developer-mode/stop', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
    };
  }, [user.token, workspaceId]);

  if (loading) {
    return <div>Initializing Developer Mode...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <iframe
      src={sessionUrl}
      style={{
        width: '100%',
        height: '100vh',
        border: 'none'
      }}
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
      title="Developer Mode"
    />
  );
};

export default DeveloperMode;
```

### 5. Workspace Manager Service

**Responsibilities:**
- Create and destroy user workspaces
- Manage workspace metadata
- Handle file synchronization
- Implement workspace snapshots and backups

**Database Schema:**
```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  storage_path TEXT NOT NULL,
  last_accessed TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'active' -- active, archived, deleted
);

CREATE TABLE workspace_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  size_bytes BIGINT,
  last_modified TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_workspaces_user_id ON workspaces(user_id);
CREATE INDEX idx_workspace_files_workspace_id ON workspace_files(workspace_id);
```

---

## Integration Strategy

### Phase 1: Basic Integration (MVP)

**Deliverables:**
1. Standalone OpenVSCode Server deployment
2. Basic authentication via API Gateway
3. Single workspace per user
4. Manual Tabby extension installation
5. Temporary file storage (no persistence)

**Timeline:** 4-6 weeks

**Steps:**
1. Set up Docker environment for OpenVSCode Server
2. Configure reverse proxy through API Gateway
3. Implement authentication flow
4. Create basic frontend iframe integration
5. Test basic functionality (editing, terminal, extensions)

### Phase 2: AI Integration

**Deliverables:**
1. Deploy Tabby service
2. Pre-install Tabby extension in OpenVSCode Server
3. Configure AI model access
4. Implement basic code completion
5. Add chat interface for coding assistance

**Timeline:** 3-4 weeks

**Steps:**
1. Deploy Tabby service with Docker
2. Configure Tabby API endpoints
3. Modify OpenVSCode Server to pre-install Tabby extension
4. Configure Tabby extension with API credentials
5. Test code completion across multiple languages
6. Implement chat UI integration

### Phase 3: Persistence and Scalability

**Deliverables:**
1. Persistent workspace storage (S3/MinIO)
2. Workspace management UI
3. Save/restore functionality
4. Kubernetes deployment for scalability
5. Resource limits and quotas

**Timeline:** 4-6 weeks

**Steps:**
1. Implement file storage service with S3/MinIO
2. Create workspace metadata database schema
3. Develop workspace manager service
4. Build workspace management UI
5. Migrate to Kubernetes with Helm charts
6. Implement resource quotas and monitoring

### Phase 4: Advanced Features

**Deliverables:**
1. Git integration with GitHub/GitLab
2. Collaborative editing support
3. Custom extension marketplace
4. Advanced AI features (code review, documentation)
5. Mobile-responsive UI

**Timeline:** 6-8 weeks

**Steps:**
1. Implement Git operations integration
2. Add OAuth integration for GitHub/GitLab
3. Build custom extension registry
4. Enhance Tabby with repository context
5. Optimize UI for mobile devices
6. Add advanced AI capabilities

---

## Security Considerations

### 1. Authentication and Authorization

**Requirements:**
- JWT-based authentication for API Gateway
- Token-based authentication for OpenVSCode Server sessions
- Bearer token authentication for Tabby API
- Role-based access control (RBAC) for workspace access

**Implementation:**
```typescript
// Middleware for API Gateway
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Generate session token for OpenVSCode Server
const generateSessionToken = (userId: string): string => {
  return jwt.sign(
    { userId, type: 'vscode-session' },
    process.env.VSCODE_SECRET,
    { expiresIn: '24h' }
  );
};
```

### 2. Network Security

**Requirements:**
- All communication over HTTPS/WSS
- CORS configuration for frontend access
- Content Security Policy (CSP) headers
- Rate limiting to prevent abuse

**CORS Configuration:**
```typescript
const corsOptions = {
  origin: [process.env.WEB_APP_URL],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

**CSP Headers:**
```http
Content-Security-Policy: default-src 'self';
                         script-src 'self' 'unsafe-inline' 'unsafe-eval';
                         style-src 'self' 'unsafe-inline';
                         frame-src 'self' https://*.openvscode.example.com;
                         connect-src 'self' wss://*.openvscode.example.com https://tabby.example.com;
```

### 3. Container Isolation

**Requirements:**
- Each user workspace in isolated container
- Resource limits (CPU, memory, disk)
- Network policies to restrict inter-container communication
- Read-only root file system where possible

**Kubernetes Network Policy:**
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: openvscode-network-policy
spec:
  podSelector:
    matchLabels:
      app: openvscode-server
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: api-gateway
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: tabby
    ports:
    - protocol: TCP
      port: 8080
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 443  # HTTPS for external resources
```

### 4. Data Protection

**Requirements:**
- Encryption at rest for user files (S3/MinIO with KMS)
- Encryption in transit (TLS 1.3)
- Regular backups of workspaces
- Data retention policies
- GDPR compliance for user data

**S3 Encryption Configuration:**
```typescript
const s3Config = {
  endpoint: process.env.S3_ENDPOINT,
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY,
  sslEnabled: true,
  s3ForcePathStyle: true,
  signatureVersion: 'v4',
  serverSideEncryption: 'aws:kms',
  ssekmsKeyId: process.env.KMS_KEY_ID
};
```

### 5. Code Execution Sandbox

**Requirements:**
- Restricted system calls
- No access to host filesystem
- Limited network access
- Resource quotas enforced

**Docker Security Options:**
```yaml
security_opt:
  - no-new-privileges:true
  - seccomp:unconfined  # Consider custom seccomp profile
cap_drop:
  - ALL
cap_add:
  - CHOWN
  - DAC_OVERRIDE
  - SETGID
  - SETUID
read_only: false  # Needs write access to workspace
tmpfs:
  - /tmp
  - /run
```

### 6. API Security

**Requirements:**
- API key management for Tabby service
- Rate limiting per user
- Request validation and sanitization
- Audit logging

**Rate Limiting Configuration:**
```typescript
import rateLimit from 'express-rate-limit';

const developerModeRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each user to 100 requests per window
  keyGenerator: (req) => req.user.id,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests, please try again later.'
    });
  }
});
```

---

## Implementation Roadmap

### Phase 1: MVP (Months 1-2)

**Month 1: Infrastructure Setup**
- Week 1-2: Docker environment setup for OpenVSCode Server and Tabby
- Week 3: API Gateway integration and routing
- Week 4: Basic authentication implementation

**Month 2: Core Integration**
- Week 1-2: Frontend iframe integration and UI development
- Week 3: Basic testing and bug fixes
- Week 4: Internal alpha testing

**Deliverables:**
- Working OpenVSCode Server accessible via web app
- Basic authentication
- Temporary workspace (session-based)
- Internal demo

### Phase 2: AI Integration (Month 3)

**Month 3: Tabby Integration**
- Week 1: Tabby deployment and configuration
- Week 2: Extension pre-installation in OpenVSCode
- Week 3: Code completion testing
- Week 4: Chat interface development and integration

**Deliverables:**
- Functional AI code completion
- Chat assistant for coding questions
- Support for multiple programming languages

### Phase 3: Production Features (Months 4-5)

**Month 4: Persistence**
- Week 1-2: S3/MinIO storage implementation
- Week 3: Workspace manager service development
- Week 4: Save/restore functionality

**Month 5: Scalability**
- Week 1-2: Kubernetes deployment
- Week 3: Resource management and quotas
- Week 4: Load testing and optimization

**Deliverables:**
- Persistent workspaces
- Scalable infrastructure
- Production-ready deployment

### Phase 4: Advanced Features (Months 6-8)

**Month 6: Git Integration**
- Week 1-2: Git operations in workspace
- Week 3-4: GitHub/GitLab OAuth integration

**Month 7: Enhanced AI**
- Week 1-2: Repository context for AI
- Week 3-4: Advanced AI features (code review, docs)

**Month 8: Polish and Launch**
- Week 1-2: Mobile UI optimization
- Week 3: Beta testing
- Week 4: Public launch preparation

**Deliverables:**
- Full Git integration
- Advanced AI capabilities
- Mobile-responsive UI
- Public beta release

### Estimated Resources

**Development Team:**
- 1 Backend Engineer (API, Kubernetes, infrastructure)
- 1 Frontend Engineer (React, UI/UX)
- 1 DevOps Engineer (Docker, Kubernetes, monitoring)
- 1 AI/ML Engineer (Tabby integration, model optimization)
- 1 QA Engineer (testing, automation)

**Infrastructure:**
- Development environment (staging cluster)
- Production Kubernetes cluster
- S3/MinIO storage (1TB initial, scalable)
- GPU instances for Tabby (NVIDIA T4 or better)
- Load balancers and CDN

**Budget Estimate:**
- Development: 8 months × 5 engineers = 40 person-months
- Infrastructure: ~$2,000-5,000/month (depends on scale)
- Tools and licenses: ~$1,000/month
- Total: ~$100,000-200,000 (depending on team location and infrastructure scale)

---

## Deployment Strategy

### Development Environment

**Requirements:**
- Local Docker Compose for development
- Hot-reload for code changes
- Mock data and services
- Debug logging enabled

**Setup:**
```bash
# Clone repository
git clone https://github.com/deep-assistant/web-app.git
cd web-app/developer-mode

# Start services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

### Staging Environment

**Requirements:**
- Kubernetes cluster (minikube or cloud-based)
- CI/CD pipeline integration
- Automated testing
- Production-like configuration

**Deployment:**
```bash
# Build and push Docker images
docker build -t deep-assistant/openvscode-server:staging .
docker push deep-assistant/openvscode-server:staging

# Deploy to Kubernetes
kubectl apply -f k8s/staging/

# Run smoke tests
npm run test:staging
```

### Production Environment

**Requirements:**
- Kubernetes cluster with HA (multi-zone)
- Auto-scaling policies
- Monitoring and alerting
- Backup and disaster recovery

**Deployment Process:**
1. Tag release in Git
2. CI/CD pipeline builds images
3. Run automated tests
4. Deploy to staging first
5. Run integration tests
6. Manual approval for production
7. Blue-green deployment to production
8. Monitor for errors
9. Rollback if needed

**Helm Chart Example:**
```yaml
# values.yaml
replicaCount: 3

image:
  repository: deep-assistant/openvscode-server
  tag: v1.0.0
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 3000

ingress:
  enabled: true
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: dev.deep-assistant.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: dev-tls
      hosts:
        - dev.deep-assistant.com

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

resources:
  limits:
    cpu: 1000m
    memory: 2Gi
  requests:
    cpu: 250m
    memory: 512Mi

persistence:
  enabled: true
  storageClass: fast-ssd
  size: 10Gi
```

### Monitoring and Observability

**Metrics to Track:**
- Active sessions count
- CPU/Memory usage per user
- API response times
- AI completion latency
- Error rates
- Storage usage

**Tools:**
- Prometheus for metrics collection
- Grafana for visualization
- Loki for log aggregation
- Jaeger for distributed tracing
- Sentry for error tracking

**Sample Prometheus Metrics:**
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'openvscode-server'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        action: keep
        regex: openvscode-server
    metrics_path: '/metrics'

  - job_name: 'tabby'
    static_configs:
      - targets: ['tabby:8080']
    metrics_path: '/metrics'
```

**Grafana Dashboard Queries:**
```promql
# Active Sessions
sum(openvscode_active_sessions)

# CPU Usage
sum(rate(container_cpu_usage_seconds_total{pod=~"openvscode-.*"}[5m])) by (pod)

# Memory Usage
sum(container_memory_usage_bytes{pod=~"openvscode-.*"}) by (pod)

# AI Completion Latency (p95)
histogram_quantile(0.95, sum(rate(tabby_completion_duration_seconds_bucket[5m])) by (le))
```

### Alerts

**Critical Alerts:**
```yaml
groups:
  - name: developer-mode
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"

      - alert: ServiceDown
        expr: up{job="openvscode-server"} == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "OpenVSCode Server is down"

      - alert: HighMemoryUsage
        expr: container_memory_usage_bytes{pod=~"openvscode-.*"} / container_spec_memory_limit_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Pod {{ $labels.pod }} high memory usage"
```

---

## Monitoring and Maintenance

### Health Checks

**OpenVSCode Server:**
```bash
# HTTP health check
curl http://openvscode-server:3000/healthz

# Expected response
{
  "status": "ok",
  "version": "1.85.0"
}
```

**Tabby Service:**
```bash
# HTTP health check
curl http://tabby:8080/v1/health

# Expected response
{
  "status": "healthy",
  "model": "StarCoder-1B",
  "chat_model": "Qwen2"
}
```

### Backup Strategy

**Workspace Backups:**
- Automated daily snapshots of S3/MinIO storage
- Retention: 7 daily, 4 weekly, 12 monthly
- Backup verification tests weekly

**Database Backups:**
- PostgreSQL automated backups every 6 hours
- Point-in-time recovery enabled
- Retention: 30 days

**Configuration Backups:**
- Git-based configuration management
- Kubernetes manifests versioned in Git
- Secrets stored in sealed secrets or external vault

### Disaster Recovery

**RTO (Recovery Time Objective):** 4 hours
**RPO (Recovery Point Objective):** 1 hour

**Recovery Procedures:**
1. Restore infrastructure from IaC (Terraform/Kubernetes manifests)
2. Restore database from latest backup
3. Restore user files from S3 backups
4. Verify services are operational
5. Notify users of service restoration

### Maintenance Windows

**Scheduled Maintenance:**
- Weekly: Security patches (low-impact, rolling updates)
- Monthly: Minor version updates
- Quarterly: Major version updates (planned maintenance window)

**Maintenance Process:**
1. Notify users 7 days in advance
2. Create maintenance branch
3. Deploy to staging
4. Run full test suite
5. Deploy to production during low-usage hours
6. Monitor for issues
7. Post-maintenance report

---

## References

### Official Documentation

1. **OpenVSCode Server**
   - GitHub: https://github.com/gitpod-io/openvscode-server
   - Documentation: https://www.gitpod.io/docs/references/ides-and-editors/vscode
   - Docker Hub: https://hub.docker.com/r/gitpod/openvscode-server

2. **Tabby**
   - GitHub: https://github.com/TabbyML/tabby
   - Documentation: https://tabby.tabbyml.com/docs/
   - API Reference: https://api-docs.tabby.ai/
   - Docker Hub: https://hub.docker.com/r/tabbyml/tabby

3. **Continue.dev** (Alternative)
   - GitHub: https://github.com/continuedev/continue
   - Documentation: https://continue.dev/docs

4. **VS Code**
   - Open-VSX Registry: https://open-vsx.org/
   - VS Code Extension API: https://code.visualstudio.com/api

### Related Projects

1. **Existing deep-assistant infrastructure:**
   - api-gateway: https://github.com/deep-assistant/api-gateway
   - telegram-bot: https://github.com/deep-assistant/telegram-bot
   - web-capture: https://github.com/deep-assistant/web-capture
   - GPTutor: https://github.com/deep-assistant/GPTutor

2. **Similar Projects:**
   - GitHub Codespaces: https://github.com/features/codespaces
   - Gitpod: https://www.gitpod.io/
   - Coder (code-server): https://coder.com/
   - StackBlitz: https://stackblitz.com/

### Technical Resources

1. **Kubernetes:**
   - Best Practices: https://kubernetes.io/docs/concepts/configuration/overview/
   - Security: https://kubernetes.io/docs/concepts/security/

2. **Docker:**
   - Security Best Practices: https://docs.docker.com/engine/security/
   - Multi-stage Builds: https://docs.docker.com/build/building/multi-stage/

3. **Authentication:**
   - JWT Best Practices: https://tools.ietf.org/html/rfc8725
   - OAuth 2.0: https://oauth.net/2/

4. **AI/ML:**
   - StarCoder Model: https://huggingface.co/bigcode/starcoder
   - Qwen2 Model: https://huggingface.co/Qwen

---

## Appendix

### Glossary

- **IDE:** Integrated Development Environment
- **FIM:** Fill-in-the-Middle (prompting style for code completion)
- **JWT:** JSON Web Token
- **CORS:** Cross-Origin Resource Sharing
- **CSP:** Content Security Policy
- **RTO:** Recovery Time Objective
- **RPO:** Recovery Point Objective
- **HA:** High Availability
- **Open-VSX:** Open-source VS Code extension registry
- **OpenAPI:** API specification standard (formerly Swagger)

### FAQ

**Q: Why OpenVSCode Server instead of code-server?**
A: OpenVSCode Server is a direct fork with minimal changes, making it easier to maintain and update with upstream VS Code releases. code-server includes additional modifications that may introduce compatibility issues.

**Q: Can users install their own extensions?**
A: Yes, users can install extensions from the Open-VSX registry. However, Microsoft's marketplace is not available due to licensing restrictions.

**Q: What AI models does Tabby support?**
A: Tabby supports various models including StarCoder, CodeLlama, DeepSeek Coder, Qwen2, and can be configured to use custom models via OpenAI-compatible APIs.

**Q: How is user data protected?**
A: User data is encrypted at rest (S3 with KMS), encrypted in transit (TLS 1.3), and isolated per user in separate containers. Regular backups ensure data durability.

**Q: What's the resource cost per user?**
A: Each active user session requires approximately 512MB-2GB RAM, 0.25-1 CPU core, and 1-10GB disk space depending on workspace size.

**Q: Can this work offline?**
A: No, the browser-based implementation requires an internet connection. For offline development, users should use local VS Code installation.

**Q: How does this compare to GitHub Codespaces?**
A: Similar functionality but fully open-source and self-hosted, giving users complete control over their code and data. GitHub Codespaces is proprietary and cloud-hosted.

**Q: What programming languages are supported?**
A: All languages supported by VS Code and its extensions, including but not limited to: JavaScript/TypeScript, Python, Go, Rust, Java, C/C++, Ruby, PHP, etc.

---

**Document Version:** 1.0
**Last Updated:** 2025-10-30
**Authors:** AI Issue Solver
**Status:** Draft / Architecture Design Phase
