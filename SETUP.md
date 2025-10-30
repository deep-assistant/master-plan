# GitHub Bot App - Setup Guide

This guide provides step-by-step instructions for setting up the GitHub Bot App, from registering the GitHub App to deploying the service.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [GitHub App Registration](#github-app-registration)
3. [Local Development Setup](#local-development-setup)
4. [Configuration](#configuration)
5. [Running the Service](#running-the-service)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### Legal Requirements

- **Legal Entity in India**: As mentioned in issue #24, the GitHub App requires a legal entity to be registered. Ensure this is completed before proceeding with GitHub App registration.

### Technical Requirements

- **Node.js**: Version 18 or higher
- **npm**: Version 9 or higher
- **Git**: Version 2.30 or higher
- **GitHub Account**: Organization account with owner permissions
- **Development Tools**:
  - Text editor (VS Code recommended)
  - Terminal/Command line access
  - Web browser

### Access Requirements

- GitHub Organization owner permissions
- Access to deep-assistant repositories
- API keys for AI services (provided by API Gateway)
- Access to production hosting environment

## GitHub App Registration

### Step 1: Navigate to GitHub Settings

1. Go to your GitHub Organization: https://github.com/deep-assistant
2. Click **Settings** in the top navigation
3. In the left sidebar, scroll down to **Developer settings**
4. Click **GitHub Apps**
5. Click **New GitHub App**

### Step 2: Configure Basic Information

Fill in the following required fields:

#### App Identity

```
GitHub App name: Deep Assistant Bot
Description: AI-powered GitHub integration for the Deep Assistant platform
Homepage URL: https://deep-assistant.com
```

#### Identifying and authorizing users

```
Callback URL: https://github-bot.deep-assistant.com/auth/callback
☐ Request user authorization (OAuth) during installation
   (Check this box if you want users to authorize)

Setup URL (optional): https://github-bot.deep-assistant.com/setup
☑ Redirect on update (check this)
```

#### Post installation

```
Setup URL (optional): https://github-bot.deep-assistant.com/welcome
```

#### Webhook

```
☑ Active (check this box)

Webhook URL: https://github-bot.deep-assistant.com/webhooks/github

Webhook secret: <generate-strong-secret>
```

**Generating a Strong Webhook Secret:**

```bash
# Generate a random secret (32 characters)
openssl rand -hex 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Save this secret securely - you'll need it later!

### Step 3: Set Permissions

Configure the following repository permissions:

#### Repository permissions

| Permission | Access Level | Reason |
|------------|--------------|--------|
| Contents | Read & write | To read code and create/update files for PRs |
| Issues | Read & write | To create and manage issues |
| Metadata | Read only | Required by default |
| Pull requests | Read & write | To create and manage pull requests |
| Commit statuses | Read & write | To update PR status checks (optional) |

#### Organization permissions

| Permission | Access Level | Reason |
|------------|--------------|--------|
| Members | Read only | To validate user access and team assignments |

### Step 4: Subscribe to Events

Select the following events to receive webhooks:

#### Event Subscriptions

- ☑ **Issues**
  - Issue opened
  - Issue closed
  - Issue edited
  - Issue labeled

- ☑ **Pull request**
  - Pull request opened
  - Pull request closed
  - Pull request edited
  - Pull request synchronized

- ☑ **Installation**
  - Installation created
  - Installation deleted

- ☑ **Installation repositories**
  - Installation repositories added
  - Installation repositories removed

- ☑ **Push** (optional, for advanced features)

### Step 5: Where can this GitHub App be installed?

Choose installation scope:

- ◉ **Only on this account** (Recommended for initial testing)
- ○ **Any account** (For public distribution later)

Select "Only on this account" initially. You can change this later when ready for public use.

### Step 6: Create the GitHub App

1. Review all settings carefully
2. Click **Create GitHub App**
3. You'll be redirected to your new app's settings page

### Step 7: Generate and Download Private Key

1. On your new GitHub App's settings page, scroll down to **Private keys**
2. Click **Generate a private key**
3. A `.pem` file will be downloaded automatically
4. **IMPORTANT**: Store this file securely! You cannot download it again
5. Rename the file to something recognizable: `deep-assistant-bot-private-key.pem`

### Step 8: Note Your App ID

On the GitHub App settings page, you'll see:

```
App ID: 123456
```

Save this number - you'll need it for configuration.

### Step 9: Install the App

1. On your GitHub App settings page, click **Install App** in the left sidebar
2. Click **Install** next to your organization name
3. Choose installation scope:
   - ◉ All repositories
   - ○ Only select repositories (choose specific repos)
4. Click **Install**

You'll be redirected to your setup URL or the callback URL.

### Step 10: Get Installation ID

After installation, you need to find your installation ID:

**Method 1: Via URL**
- The installation URL will be: `https://github.com/settings/installations/XXXXXX`
- The number `XXXXXX` is your installation ID

**Method 2: Via API**
```bash
# Using GitHub CLI
gh api /app/installations --jq '.[0].id'

# Or with curl (requires JWT token)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://api.github.com/app/installations
```

## Local Development Setup

### Step 1: Clone the Repository

```bash
# Clone the github-bot repository
git clone https://github.com/deep-assistant/github-bot.git
cd github-bot

# Create a new branch for your work
git checkout -b feature/initial-setup
```

### Step 2: Install Dependencies

```bash
# Install production dependencies
npm install

# Install development dependencies
npm install --save-dev
```

### Step 3: Set Up Webhook Forwarding

For local development, you need to forward GitHub webhooks to your local machine.

#### Using Smee.io

1. Go to https://smee.io/ and click **Start a new channel**
2. Copy the webhook proxy URL (e.g., `https://smee.io/abc123`)
3. Update your GitHub App's webhook URL to this Smee URL:
   - Go to GitHub App settings
   - Update Webhook URL to the Smee URL
   - Save changes

4. Install and run Smee client:
```bash
# Install globally
npm install -g smee-client

# Start forwarding
smee --url https://smee.io/abc123 --target http://localhost:3000/webhooks/github
```

#### Using ngrok (Alternative)

```bash
# Install ngrok
# Download from: https://ngrok.com/download

# Start ngrok
ngrok http 3000

# Use the HTTPS URL (e.g., https://abc123.ngrok.io) as your webhook URL
# Update GitHub App webhook URL to: https://abc123.ngrok.io/webhooks/github
```

### Step 4: Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```bash
# GitHub App Configuration
GITHUB_APP_ID=123456
GITHUB_APP_PRIVATE_KEY_PATH=./deep-assistant-bot-private-key.pem
GITHUB_WEBHOOK_SECRET=your-webhook-secret-from-step-2
GITHUB_INSTALLATION_ID=your-installation-id

# Alternative: Provide private key directly (base64 encoded)
# GITHUB_APP_PRIVATE_KEY=LS0tLS1CRUdJTi...
# Use this for production deployment

# Service Configuration
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# Database
DATABASE_PATH=./data/db.json

# Integration Endpoints
API_GATEWAY_URL=http://localhost:3001
TELEGRAM_BOT_WEBHOOK_URL=http://localhost:3002/webhook

# AI Service Configuration
AI_MODEL_DEFAULT=claude-3-5-sonnet-20241022
AI_MODEL_FALLBACK=gpt-4
AI_MAX_TOKENS=4096
AI_TEMPERATURE=0.7

# Security
JWT_SECRET=your-random-jwt-secret
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=10

# Feature Flags
ENABLE_ISSUE_CREATION=true
ENABLE_PR_GENERATION=true
ENABLE_AUTO_MERGE=false
ENABLE_ADVANCED_ANALYSIS=false

# Optional: Redis (for production)
# REDIS_URL=redis://localhost:6379

# Optional: Sentry (for error tracking)
# SENTRY_DSN=https://...@sentry.io/...
```

### Step 5: Prepare Private Key

If you're providing the private key as an environment variable (recommended for production):

```bash
# Base64 encode the private key
cat deep-assistant-bot-private-key.pem | base64 | tr -d '\n'

# Copy the output and set it as GITHUB_APP_PRIVATE_KEY in .env
```

For local development, it's easier to use `GITHUB_APP_PRIVATE_KEY_PATH`.

### Step 6: Initialize Database

```bash
# Create data directory
mkdir -p data

# Initialize database with default values
npm run db:init
```

## Configuration

### Configuration Files

#### config/github.js

```javascript
export default {
  appId: process.env.GITHUB_APP_ID,
  privateKey: process.env.GITHUB_APP_PRIVATE_KEY ||
              require('fs').readFileSync(process.env.GITHUB_APP_PRIVATE_KEY_PATH),
  webhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
  installationId: process.env.GITHUB_INSTALLATION_ID,
}
```

#### config/database.js

```javascript
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'

const adapter = new JSONFile(process.env.DATABASE_PATH || './data/db.json')
const db = new Low(adapter)

export default db
```

### Validation

Before starting the service, validate your configuration:

```bash
npm run validate:config
```

This will check:
- All required environment variables are set
- Private key is valid and can be parsed
- GitHub App ID is a valid number
- Webhook secret meets minimum length requirements
- Database path is writable

## Running the Service

### Development Mode

```bash
# Start with nodemon (auto-restart on file changes)
npm run dev

# Or start with debug logging
LOG_LEVEL=debug npm run dev
```

The service will start on `http://localhost:3000`.

### Production Mode

```bash
# Build the project (if using TypeScript)
npm run build

# Start the service
npm start
```

### Verify Service is Running

1. Check health endpoint:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-30T12:00:00.000Z",
  "services": {
    "github": "connected",
    "database": "connected"
  }
}
```

2. Check webhook endpoint:
```bash
curl http://localhost:3000/webhooks/github
```

Expected response:
```json
{
  "error": "Method not allowed"
}
```

This is expected - the endpoint only accepts POST requests from GitHub.

## Testing

### Manual Testing

#### Test Webhook Delivery

1. Go to your GitHub App settings
2. Click **Advanced** tab
3. Click **Recent Deliveries**
4. Click **Redeliver** on any webhook
5. Check your service logs for the received webhook

#### Test Issue Creation

Create a test issue via curl:

```bash
curl -X POST http://localhost:3000/api/issues/create \
  -H "Content-Type: application/json" \
  -d '{
    "repository": "deep-assistant/test-repo",
    "title": "Test Issue",
    "description": "This is a test issue created via API",
    "labels": ["test"],
    "userId": "test-user-123"
  }'
```

#### Test PR Generation

```bash
curl -X POST http://localhost:3000/api/pull-requests/solve \
  -H "Content-Type: application/json" \
  -d '{
    "issueUrl": "https://github.com/deep-assistant/test-repo/issues/1",
    "userId": "test-user-123"
  }'
```

### Automated Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage
```

### End-to-End Testing

1. Install the GitHub App on a test repository
2. Create an issue manually on GitHub
3. Verify webhook is received (check logs)
4. Use Telegram bot to create an issue:
   ```
   /github_issue deep-assistant/test-repo Add a test feature
   ```
5. Verify issue is created on GitHub
6. Use Telegram bot to solve the issue:
   ```
   /github_solve https://github.com/deep-assistant/test-repo/issues/1
   ```
7. Verify PR is created on GitHub

## Deployment

### Using Docker

#### Build Docker Image

```bash
# Build the image
docker build -t deep-assistant/github-bot:latest .

# Or using docker-compose
docker-compose build
```

#### Run with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f github-bot

# Stop services
docker-compose down
```

### Using Cloud Platform

#### Deploy to AWS ECS

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

# Tag and push image
docker tag deep-assistant/github-bot:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/github-bot:latest
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/github-bot:latest

# Create/update ECS service
aws ecs update-service --cluster deep-assistant --service github-bot --force-new-deployment
```

#### Deploy to Google Cloud Run

```bash
# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/github-bot

# Deploy to Cloud Run
gcloud run deploy github-bot \
  --image gcr.io/PROJECT_ID/github-bot \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### Deploy to DigitalOcean App Platform

1. Connect your GitHub repository to DigitalOcean App Platform
2. Configure environment variables in the dashboard
3. Deploy automatically on push to main branch

### Post-Deployment Checklist

After deployment:

- [ ] Update GitHub App webhook URL to production URL
- [ ] Verify webhook delivery to production
- [ ] Test issue creation via Telegram
- [ ] Test PR generation
- [ ] Check logs for errors
- [ ] Verify monitoring and alerts are working
- [ ] Test rate limiting
- [ ] Verify SSL certificate is valid
- [ ] Check performance metrics

## Troubleshooting

### Common Issues

#### Webhook Signature Verification Fails

**Symptoms:**
- Log message: "Invalid webhook signature"
- Webhooks are rejected

**Solution:**
```bash
# Verify webhook secret matches
echo $GITHUB_WEBHOOK_SECRET

# Check GitHub App settings and update secret if needed
# Restart service after updating
```

#### Authentication Failures

**Symptoms:**
- Log message: "Failed to generate JWT" or "Invalid token"
- Cannot create issues or PRs

**Solution:**
```bash
# Verify private key is valid
openssl rsa -in deep-assistant-bot-private-key.pem -check

# Verify App ID is correct
echo $GITHUB_APP_ID

# Check token generation
npm run debug:auth
```

#### Permission Denied Errors

**Symptoms:**
- GitHub API returns 403 Forbidden
- Cannot access repository or create issues

**Solution:**
1. Verify GitHub App has correct permissions in settings
2. Check if app is installed on the target repository
3. Verify installation ID is correct:
```bash
gh api /app/installations
```

#### Webhook Not Received

**Symptoms:**
- No webhook events in logs
- Recent Deliveries shows failed attempts

**Solution:**
1. Check webhook URL is correct and accessible:
```bash
curl -I https://github-bot.deep-assistant.com/webhooks/github
```

2. Verify SSL certificate is valid
3. Check firewall rules allow GitHub webhook IPs
4. Test with webhook redelivery in GitHub App settings

#### AI Generation Fails

**Symptoms:**
- PR generation times out or fails
- Error: "Could not generate solution"

**Solution:**
1. Check API Gateway is accessible
2. Verify AI service API keys are valid
3. Check rate limits on AI service
4. Review issue complexity (may be too complex)
5. Check logs for detailed error messages:
```bash
docker-compose logs -f github-bot | grep "ERROR"
```

#### Database Issues

**Symptoms:**
- Error: "Cannot read/write database"
- Service crashes on startup

**Solution:**
```bash
# Check database file permissions
ls -la data/db.json

# Fix permissions
chmod 644 data/db.json

# Reinitialize database if corrupted
npm run db:reset
```

### Debug Mode

Enable detailed logging:

```bash
# Set log level to debug
export LOG_LEVEL=debug

# Or in .env
LOG_LEVEL=debug

# Restart service
npm run dev
```

### Testing Webhooks Locally

Use webhook delivery tester:

```bash
# Install webhook testing tool
npm install -g webhook-test

# Start test server
webhook-test --port 3000 --path /webhooks/github

# Send test webhook
npm run test:webhook
```

### Logs Location

- **Development**: Console output
- **Production (Docker)**: `docker-compose logs github-bot`
- **Production (PM2)**: `~/.pm2/logs/github-bot-out.log`
- **Cloud Run**: View in Google Cloud Console
- **ECS**: View in CloudWatch Logs

## Security Best Practices

1. **Never commit secrets**: Use environment variables or secrets manager
2. **Rotate webhook secret**: Change periodically and update in GitHub App settings
3. **Limit permissions**: Only request necessary GitHub permissions
4. **Use HTTPS**: Always use HTTPS for webhook URLs
5. **Validate inputs**: Always validate user inputs and webhook payloads
6. **Rate limiting**: Implement rate limiting on all API endpoints
7. **Monitor logs**: Regularly review logs for suspicious activity
8. **Update dependencies**: Keep all npm packages up to date
9. **Audit code**: Regular security audits and code reviews

## Getting Help

If you encounter issues not covered in this guide:

1. **Check existing issues**: https://github.com/deep-assistant/github-bot/issues
2. **Review logs**: Enable debug logging and review error messages
3. **GitHub App documentation**: https://docs.github.com/en/apps
4. **Create an issue**: Provide detailed information about your problem
5. **Community discussions**: https://github.com/deep-assistant/master-plan/discussions

## Next Steps

After successful setup:

1. Review [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the system design
2. Review [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for development roadmap
3. Read [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines
4. Join team discussions and planning sessions
5. Start implementing features according to the plan

## Appendix

### Useful Commands

```bash
# Check GitHub App installation
gh api /app/installations

# List installation repositories
gh api /installation/repositories

# Create test issue
gh issue create --repo deep-assistant/test-repo --title "Test" --body "Test issue"

# Trigger webhook redelivery
gh api /app/hook/deliveries/:delivery_id/attempts -X POST

# Check rate limit
gh api /rate_limit
```

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GITHUB_APP_ID` | Yes | - | GitHub App ID from app settings |
| `GITHUB_APP_PRIVATE_KEY` | Yes* | - | Base64 encoded private key |
| `GITHUB_APP_PRIVATE_KEY_PATH` | Yes* | - | Path to .pem file |
| `GITHUB_WEBHOOK_SECRET` | Yes | - | Webhook secret for signature verification |
| `GITHUB_INSTALLATION_ID` | No | - | Installation ID (can be auto-detected) |
| `NODE_ENV` | No | `development` | Environment: development/production |
| `PORT` | No | `3000` | Server port |
| `LOG_LEVEL` | No | `info` | Logging level: debug/info/warn/error |
| `DATABASE_PATH` | No | `./data/db.json` | LowDB database file path |
| `API_GATEWAY_URL` | Yes | - | API Gateway base URL |
| `AI_MODEL_DEFAULT` | No | `claude-3-5-sonnet-20241022` | Default AI model |
| `AI_MAX_TOKENS` | No | `4096` | Maximum tokens for AI generation |
| `JWT_SECRET` | Yes | - | Secret for JWT token signing |
| `RATE_LIMIT_MAX_REQUESTS` | No | `10` | Max requests per window |

*Either `GITHUB_APP_PRIVATE_KEY` or `GITHUB_APP_PRIVATE_KEY_PATH` must be provided.

---

**Document Version:** 1.0
**Last Updated:** 2025-10-30
**Maintainer:** Deep Assistant Team
