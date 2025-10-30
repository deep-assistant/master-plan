# Implementation Plan: Web-Capture Microservice Integration

## Issue Reference
Fixes: https://github.com/deep-assistant/master-plan/issues/10

## Objective
Make web-capture microservice work as expected and integrate it with the Telegram bot.

## Current State Analysis

### Web-Capture Microservice
**Status**: Functional but incomplete testing

**What exists:**
- ✅ Core API endpoints (HTML, Markdown, PNG)
- ✅ Puppeteer and Playwright engine support
- ✅ Basic unit tests
- ✅ Docker support
- ✅ Integration test for Habr.com (PR #9)

**What's missing:**
- ❌ Integration tests for GitHub README (issue #5)
- ❌ Integration tests for Wikipedia (issue #8)
- ❌ Integration tests for StackOverflow (issue #11)
- ❌ Production deployment configuration
- ❌ Health check endpoint
- ❌ Production-ready error handling

### Telegram Bot
**Status**: No web-capture integration

**What exists:**
- ✅ Modular router architecture
- ✅ External service integration pattern (API Gateway, DeepInfra, Suno)
- ✅ Configuration management via config.py
- ✅ File attachment handling

**What's missing:**
- ❌ Web-capture service integration
- ❌ URL detection/handling
- ❌ Commands for web capture

## Implementation Strategy

### Phase 1: Complete Web-Capture Testing (Priority: HIGH)
**Goal**: Ensure web-capture works reliably for real-world websites

**Tasks:**
1. Add integration test for GitHub README pages (issue #5)
2. Add integration test for Wikipedia pages (issue #8)
3. Add integration test for StackOverflow pages (issue #11)
4. Ensure all tests pass for both Puppeteer and Playwright
5. Add health check endpoint (`GET /health`)

**Acceptance Criteria:**
- All integration tests pass
- Both browser engines work correctly
- Service is deployment-ready

### Phase 2: Deployment Readiness (Priority: HIGH)
**Goal**: Make web-capture production-ready

**Tasks:**
1. Add comprehensive error handling
2. Add health check endpoint
3. Add docker-compose configuration for production
4. Add environment variable documentation
5. Update README with deployment instructions

**Acceptance Criteria:**
- Service can be deployed via Docker Compose
- Health checks work
- Error responses are user-friendly

### Phase 3: Telegram Bot Integration (Priority: HIGH)
**Goal**: Enable Telegram users to capture web content

**Tasks:**
1. Add `WEB_CAPTURE_URL` to telegram-bot config
2. Create web-capture service client/helper
3. Implement URL capture commands:
   - `/capture <url>` - Show options (markdown/screenshot)
   - `/markdown <url>` - Return markdown version
   - `/screenshot <url>` - Return PNG screenshot
4. Add inline keyboard for format selection
5. Handle errors gracefully with user feedback
6. Add tests for the integration

**Acceptance Criteria:**
- Users can capture URLs via commands
- Both markdown and screenshot formats work
- Errors are handled gracefully
- Tests verify the integration

### Phase 4: Documentation (Priority: MEDIUM)
**Goal**: Document the integration

**Tasks:**
1. Update web-capture ARCHITECTURE.md with deployment info
2. Update telegram-bot ARCHITECTURE.md with web-capture integration
3. Add user documentation for capture commands
4. Update this repository's README to reflect completion

**Acceptance Criteria:**
- All documentation is updated
- Integration is well-documented
- Users can understand how to use the feature

## Technical Design

### Web-Capture Enhancements

#### New Endpoint: Health Check
```javascript
GET /health
Response: { status: 'ok', version: '1.0.0', engines: ['puppeteer', 'playwright'] }
```

#### Integration Tests Structure
```
tests/integration/
├── habr-article.test.js (existing - PR #9)
├── github-readme.test.js (new - issue #5)
├── wikipedia-page.test.js (new - issue #8)
└── stackoverflow-question.test.js (new - issue #11)
```

### Telegram Bot Integration

#### Configuration (config.py)
```python
# Web capture service
WEB_CAPTURE_URL = os.getenv('WEB_CAPTURE_URL', 'http://localhost:3000')
WEB_CAPTURE_ENABLED = os.getenv('WEB_CAPTURE_ENABLED', 'False') == 'True'
```

#### New Router Structure
```
bot/
├── web_capture/
│   ├── __init__.py
│   ├── router.py          # Command handlers
│   ├── service.py         # Web-capture API client
│   └── keyboards.py       # Inline keyboards for format selection
```

#### Commands
- `/capture <url>` - Interactive capture with format selection
- `/markdown <url>` - Direct markdown capture
- `/screenshot <url>` - Direct screenshot capture

#### User Flow
1. User sends `/capture https://example.com`
2. Bot shows inline keyboard: [Markdown] [Screenshot] [Both]
3. User selects format
4. Bot requests from web-capture service
5. Bot sends result (text/file for markdown, photo for screenshot)
6. On error: Bot sends friendly error message

## Testing Strategy

### Web-Capture Tests
1. **Unit tests**: Existing, ensure they continue to pass
2. **Integration tests**: New tests for GitHub, Wikipedia, StackOverflow
3. **E2E tests**: Existing Docker-based tests

### Telegram Bot Tests
1. **Unit tests**: Test web-capture service client
2. **Integration tests**: Test command handlers with mocked web-capture
3. **E2E tests**: Optional - test against real web-capture instance

## Deployment Considerations

### Web-Capture Deployment
- **Option 1**: Docker Compose (recommended for self-hosting)
- **Option 2**: Kubernetes deployment
- **Option 3**: Cloud service (AWS ECS, Google Cloud Run, etc.)

For this implementation, we'll ensure Docker Compose readiness.

### Telegram Bot Changes
- Add `WEB_CAPTURE_URL` to environment variables
- Add `WEB_CAPTURE_ENABLED` feature flag
- Document in deployment guide

## Rollout Plan

1. **Week 1**: Complete web-capture testing and deployment readiness
2. **Week 2**: Implement telegram-bot integration
3. **Week 3**: Testing and documentation
4. **Week 4**: Production deployment (if applicable)

## Success Metrics

1. ✅ All web-capture integration tests pass (GitHub, Wikipedia, StackOverflow)
2. ✅ Web-capture service is deployable via Docker Compose
3. ✅ Telegram bot can capture URLs in markdown format
4. ✅ Telegram bot can capture URLs as screenshots
5. ✅ Error handling works gracefully
6. ✅ Documentation is complete

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Web-capture timeout on complex pages | High | Add configurable timeout, use domcontentloaded |
| Large file sizes (screenshots) | Medium | Add file size limits, compression options |
| Deployment infrastructure unclear | High | Asked for clarification in issue #10 comment |
| User experience unclear | Medium | Asked for clarification in issue #10 comment |

## Open Questions (Asked in Issue #10)

1. Should web-capture be deployed to specific infrastructure?
2. Should URL capture be automatic (detect URLs) or explicit (commands)?
3. What output format preferences (files vs inline)?

## Timeline Estimate

- **Phase 1** (Web-capture testing): 2-3 days
- **Phase 2** (Deployment readiness): 1-2 days
- **Phase 3** (Telegram integration): 3-4 days
- **Phase 4** (Documentation): 1 day

**Total**: 7-10 days

---

*This plan will be updated as clarifications are received from the issue owner.*
