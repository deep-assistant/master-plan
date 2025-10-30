# VK Bot Implementation Plan

**Issue:** [#1 - VK bot (based on https://vk.com/gptutor) additional to the VK mini app](https://github.com/deep-assistant/master-plan/issues/1)
**Status:** Planning Phase
**Target Repository:** `deep-assistant/vk-bot` (new repository)
**Related PR:** [#29](https://github.com/deep-assistant/master-plan/pull/29)

## Executive Summary

This document outlines the step-by-step implementation plan for creating a VK (VKontakte) bot that complements the existing VK mini app in the GPTutor project. The bot will follow the architecture patterns established in the `telegram-bot` repository, with dual Python and JavaScript implementations.

## Goals

1. **Create VK Bot Repository**: Set up a new repository with proper structure and documentation
2. **Python Implementation**: Build a functional VK bot using `vkbottle` framework
3. **JavaScript Implementation**: Build an equivalent VK bot using `node-vk-bot-api` framework
4. **API Gateway Integration**: Connect both implementations to the existing API Gateway
5. **Feature Parity**: Implement core features matching the Telegram bot (GPT chat, images, payments)
6. **Production Readiness**: Add Docker deployment, testing, and monitoring

## Architecture Overview

The VK bot will serve as a conversational interface to the Deep Assistant ecosystem, allowing VK users to interact with multiple LLM models through VK community messages. It will integrate with the existing API Gateway for backend services.

```
VK User → VK Community → VK Bot → API Gateway → LLM Providers
                           ↓
                      Database
                   (User State/Balance)
```

See [VK-BOT-ARCHITECTURE.md](./VK-BOT-ARCHITECTURE.md) for comprehensive architecture details.

## Prerequisites

### VK Platform Setup

- [ ] Create VK Community for the bot
- [ ] Enable Community Messages (Manage → Messages)
- [ ] Configure Bot Settings (Manage → Messages → Bot Settings)
- [ ] Enable Long Poll API (Settings → API usage → Long Poll API)
- [ ] Generate Access Token with `messages` scope
- [ ] Configure VK Pay merchant account (for payments)

### Infrastructure Setup

- [ ] Ensure API Gateway is running and accessible
- [ ] Obtain API Gateway master token for bot authentication
- [ ] Set up Redis instance (for JavaScript bot state)
- [ ] Configure domain/hosting for production deployment
- [ ] Set up monitoring and logging infrastructure

## Implementation Phases

### Phase 1: Repository Setup (Week 1)

**Objective:** Create new repository with proper structure and documentation

#### Tasks

1. **Create Repository**
   - [ ] Request creation of `deep-assistant/vk-bot` repository
   - [ ] Initialize with Unlicense (matching organization standard)
   - [ ] Set up branch protection rules for `main`

2. **Project Structure**
   ```
   vk-bot/
   ├── bot/                 # Python implementation
   ├── js/                  # JavaScript implementation
   ├── docs/                # Additional documentation
   ├── examples/            # Example scripts and experiments
   ├── .github/
   │   └── workflows/       # CI/CD workflows
   ├── ARCHITECTURE.md      # Architecture documentation
   ├── README.md            # Main documentation
   ├── CONTRIBUTING.md      # Contribution guidelines
   ├── LICENSE              # Unlicense
   └── .gitignore
   ```

3. **Documentation**
   - [ ] Copy `VK-BOT-ARCHITECTURE.md` to new repository
   - [ ] Create comprehensive `README.md` with:
     - Project description
     - Quick start guide
     - Installation instructions
     - Configuration guide
     - Usage examples
     - Development setup
   - [ ] Create `CONTRIBUTING.md` with:
     - Code style guidelines
     - Testing requirements
     - Pull request process
     - Development workflow

4. **Configuration Files**
   - [ ] Create `.env.example` for Python bot
   - [ ] Create `js/.env.example` for JavaScript bot
   - [ ] Create `.gitignore` (Python + JavaScript + common patterns)
   - [ ] Create `.dockerignore`

**Deliverables:**
- New repository with complete structure
- Comprehensive documentation
- Configuration templates

---

### Phase 2: Python Bot Core (Week 2-3)

**Objective:** Implement minimal working Python bot with GPT chat functionality

#### Tasks

1. **Setup Python Environment**
   - [ ] Create `requirements.txt` with dependencies:
     - `vkbottle>=4.3.0`
     - `aiohttp>=3.8.0`
     - `sqlalchemy>=2.0.0`
     - `python-dotenv>=1.0.0`
     - `pydantic>=2.0.0`
   - [ ] Create `requirements-dev.txt` for development:
     - `pytest>=7.0.0`
     - `pytest-asyncio>=0.21.0`
     - `black>=23.0.0`
     - `flake8>=6.0.0`
     - `mypy>=1.0.0`

2. **Database Layer**
   - [ ] Create SQLAlchemy models:
     - `User` (vk_id, username, created_at, referrer_id)
     - `Balance` (user_id, tokens, updated_at)
     - `Dialog` (id, user_id, messages, created_at)
     - `Referral` (referrer_id, referred_id, bonus_given)
   - [ ] Create repository classes for data access
   - [ ] Implement migration system

3. **Services Layer**
   - [ ] Create `APIGatewayService`:
     - `chat_completion()` - Send chat requests
     - `get_user_balance()` - Check token balance
     - `add_tokens()` - Add tokens to user
     - `get_conversation_history()` - Fetch history
   - [ ] Create `DatabaseService`:
     - `get_or_create_user()` - User management
     - `get_user_balance()` - Balance queries
     - `deduct_tokens()` - Token deduction
     - `save_message()` - Conversation history
   - [ ] Create `PaymentService`:
     - `create_payment_link()` - Generate VK Pay links
     - `handle_payment_notification()` - Process webhooks

4. **Bot Core**
   - [ ] Create `bot_run.py` main entry point
   - [ ] Implement basic command handlers:
     - `/start` - Welcome message with main menu
     - `/help` - Help information
     - `/balance` - Show token balance
   - [ ] Create main menu keyboard with buttons:
     - 💬 Chat with GPT
     - 💰 Balance
     - ⚙️ Settings

5. **GPT Chat Router**
   - [ ] Implement conversation state management
   - [ ] Create message handler for GPT chat
   - [ ] Add balance checking before processing
   - [ ] Implement token deduction after response
   - [ ] Add error handling for API failures

6. **Testing**
   - [ ] Write unit tests for services
   - [ ] Write integration tests for routers
   - [ ] Create mock VK API for testing
   - [ ] Test with real VK community (development)

**Deliverables:**
- Working Python bot with GPT chat
- Database layer with migrations
- API Gateway integration
- Unit and integration tests
- Development documentation

**Minimal Example (bot/bot_run.py):**
```python
from vkbottle.bot import Bot
from vkbottle import Keyboard, KeyboardButtonColor, Text
import os
from dotenv import load_dotenv

load_dotenv()

bot = Bot(token=os.getenv("VK_GROUP_TOKEN"))

@bot.on.message(text="/start")
async def start_handler(message):
    keyboard = (
        Keyboard()
        .add(Text("💬 Chat with GPT"), color=KeyboardButtonColor.PRIMARY)
        .row()
        .add(Text("💰 Balance"), color=KeyboardButtonColor.SECONDARY)
    )

    await message.answer(
        "Welcome to Deep Assistant VK Bot!\n\n"
        "I can help you with:\n"
        "• Chat with multiple AI models (GPT-4, Claude, etc.)\n"
        "• Generate images\n"
        "• And more!\n\n"
        "Choose an option below:",
        keyboard=keyboard.get_json()
    )

bot.run_forever()
```

---

### Phase 3: JavaScript Bot Core (Week 4-5)

**Objective:** Implement equivalent JavaScript bot with feature parity to Python version

#### Tasks

1. **Setup JavaScript Environment**
   - [ ] Create `package.json` with dependencies:
     - `node-vk-bot-api`
     - `axios`
     - `redis`
     - `dotenv`
     - `pino` (logging)
   - [ ] Create `package.json` dev dependencies:
     - `jest`
     - `eslint`
     - `nodemon`
     - `@types/node` (if using TypeScript)

2. **Database Layer**
   - [ ] Set up Redis connection
   - [ ] Create data access functions:
     - User management
     - Balance tracking
     - Conversation history
     - Referral tracking
   - [ ] Implement Redis caching strategy

3. **Services Layer**
   - [ ] Create `apiGatewayService.js`:
     - Mirror Python APIGatewayService functionality
     - Implement HTTP client with axios
     - Add retry logic for failures
   - [ ] Create `databaseService.js`:
     - Redis operations
     - Data serialization/deserialization
   - [ ] Create `paymentService.js`:
     - VK Pay integration
     - Webhook handling

4. **Bot Core**
   - [ ] Create `index.js` main entry point
   - [ ] Implement command handlers:
     - `/start`, `/help`, `/balance`
   - [ ] Create keyboard layouts
   - [ ] Set up middleware chain

5. **GPT Chat Router**
   - [ ] Implement conversation state with Redis
   - [ ] Create message handler
   - [ ] Add balance checking
   - [ ] Implement token deduction
   - [ ] Error handling

6. **Testing**
   - [ ] Write Jest tests for services
   - [ ] Write integration tests for routers
   - [ ] Create mock VK API
   - [ ] Test with development community

**Deliverables:**
- Working JavaScript bot with GPT chat
- Redis integration for state management
- API Gateway integration
- Jest tests
- Feature parity with Python implementation

**Minimal Example (js/src/index.js):**
```javascript
const VkBot = require('node-vk-bot-api');
const { Keyboard } = require('node-vk-bot-api');
require('dotenv').config();

const bot = new VkBot(process.env.VK_GROUP_TOKEN);

bot.command('/start', async (ctx) => {
  const keyboard = Keyboard.builder()
    .textButton({ label: '💬 Chat with GPT', color: Keyboard.PRIMARY_COLOR })
    .row()
    .textButton({ label: '💰 Balance', color: Keyboard.SECONDARY_COLOR })
    .build();

  await ctx.reply(
    'Welcome to Deep Assistant VK Bot!\n\n' +
    'I can help you with:\n' +
    '• Chat with multiple AI models (GPT-4, Claude, etc.)\n' +
    '• Generate images\n' +
    '• And more!\n\n' +
    'Choose an option below:',
    null,
    keyboard
  );
});

bot.startPolling();
console.log('VK Bot is running...');
```

---

### Phase 4: Advanced Features (Week 6-7)

**Objective:** Add image generation, payment processing, and referral system

#### Tasks - Python Implementation

1. **Image Generation Router**
   - [ ] Implement `/imagine` command
   - [ ] Add image upload to VK
   - [ ] Implement image editing commands:
     - `/edit` - Edit image with prompt
     - `/upscale` - Upscale image
     - `/rembg` - Remove background
   - [ ] Add balance checking (100 tokens per image)

2. **Payment Router**
   - [ ] Implement `/buy` command with token packages
   - [ ] Create VK Pay payment links
   - [ ] Set up webhook endpoint for payment notifications
   - [ ] Implement payment verification
   - [ ] Add tokens to user balance after successful payment

3. **Referral Router**
   - [ ] Implement `/referral` command
   - [ ] Generate referral links
   - [ ] Track referrals in database
   - [ ] Award bonus tokens (referrer + referred user)
   - [ ] Show referral statistics

4. **Settings Router**
   - [ ] Implement `/settings` command
   - [ ] Add model selection (GPT-4, Claude, etc.)
   - [ ] Add language selection (EN/RU)
   - [ ] Add conversation history toggle
   - [ ] Persist user preferences

#### Tasks - JavaScript Implementation

- [ ] Implement all features above in JavaScript
- [ ] Ensure feature parity with Python version
- [ ] Write tests for all new features

**Deliverables:**
- Image generation functionality
- Payment processing with VK Pay
- Referral system
- User settings management
- Tests for all features

---

### Phase 5: Deployment & DevOps (Week 8)

**Objective:** Containerize applications and set up production deployment

#### Tasks

1. **Docker Configuration**
   - [ ] Create `Dockerfile` for Python bot:
     ```dockerfile
     FROM python:3.10-slim
     WORKDIR /app
     COPY requirements.txt .
     RUN pip install --no-cache-dir -r requirements.txt
     COPY bot/ ./bot/
     COPY services/ ./services/
     COPY db/ ./db/
     CMD ["python", "-m", "bot.bot_run"]
     ```
   - [ ] Create `Dockerfile.js` for JavaScript bot
   - [ ] Create `docker-compose.yml` for full stack:
     - Python bot service
     - JavaScript bot service
     - Redis service
     - Shared network
     - Volume mounts

2. **CI/CD Pipeline**
   - [ ] Create `.github/workflows/python-tests.yml`:
     - Run pytest on pull requests
     - Check code style with black/flake8
     - Type checking with mypy
   - [ ] Create `.github/workflows/js-tests.yml`:
     - Run jest on pull requests
     - Lint with eslint
   - [ ] Create `.github/workflows/docker-build.yml`:
     - Build Docker images on main branch
     - Push to GitHub Container Registry

3. **Production Deployment**
   - [ ] Set up production VK community
   - [ ] Configure production environment variables
   - [ ] Deploy Docker containers
   - [ ] Set up reverse proxy (nginx) if needed
   - [ ] Configure SSL/TLS certificates
   - [ ] Set up webhook endpoint for payments

4. **Monitoring & Logging**
   - [ ] Configure structured logging (JSON format)
   - [ ] Set up log rotation
   - [ ] Add health check endpoints
   - [ ] Monitor bot uptime
   - [ ] Track error rates and API latency

**Deliverables:**
- Docker images for both implementations
- CI/CD pipelines
- Production deployment guide
- Monitoring setup

---

### Phase 6: Testing & Quality Assurance (Week 9)

**Objective:** Comprehensive testing and bug fixing

#### Tasks

1. **Functional Testing**
   - [ ] Test all commands with real VK community
   - [ ] Test GPT chat with various models
   - [ ] Test image generation and editing
   - [ ] Test payment flow (with VK test environment)
   - [ ] Test referral system
   - [ ] Test error handling and edge cases

2. **Performance Testing**
   - [ ] Load test with multiple concurrent users
   - [ ] Measure API Gateway latency
   - [ ] Test database performance
   - [ ] Optimize slow queries
   - [ ] Profile memory usage

3. **Security Testing**
   - [ ] Test authentication and authorization
   - [ ] Verify payment webhook signatures
   - [ ] Test rate limiting
   - [ ] Check for SQL injection vulnerabilities
   - [ ] Verify sensitive data is not logged

4. **User Acceptance Testing**
   - [ ] Beta test with small group of users
   - [ ] Gather feedback on UX
   - [ ] Identify and fix bugs
   - [ ] Refine error messages

**Deliverables:**
- Test reports
- Bug fixes
- Performance optimizations
- Security audit results

---

### Phase 7: Documentation & Launch (Week 10)

**Objective:** Complete documentation and public launch

#### Tasks

1. **User Documentation**
   - [ ] Create user guide with screenshots
   - [ ] Document all commands and features
   - [ ] Create FAQ section
   - [ ] Add troubleshooting guide
   - [ ] Create video tutorial (optional)

2. **Developer Documentation**
   - [ ] Complete API documentation
   - [ ] Document database schema
   - [ ] Add code examples
   - [ ] Document deployment process
   - [ ] Add troubleshooting guide for common issues

3. **Launch Preparation**
   - [ ] Final security review
   - [ ] Load testing with expected user count
   - [ ] Set up support channels
   - [ ] Prepare announcement materials
   - [ ] Create marketing materials (if needed)

4. **Public Launch**
   - [ ] Announce on VK community
   - [ ] Post on Telegram channel
   - [ ] Update master-plan README with link to vk-bot repository
   - [ ] Monitor for issues and respond quickly

**Deliverables:**
- Complete documentation
- Public launch
- Support infrastructure

---

## Success Metrics

### Technical Metrics

- **Uptime**: >99.5% availability
- **Response Time**: <500ms average (excluding LLM processing)
- **Error Rate**: <1% of requests
- **Test Coverage**: >80% code coverage

### User Metrics

- **Active Users**: Track daily/weekly/monthly active users
- **Retention**: Monitor user retention rates
- **Feature Usage**: Track which features are most popular
- **User Satisfaction**: Gather feedback and ratings

### Business Metrics

- **Token Purchases**: Track revenue from token sales
- **Referrals**: Track successful referral conversions
- **API Costs**: Monitor API Gateway usage costs
- **Cost per User**: Calculate operating costs per user

---

## Risk Management

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| VK API changes | Medium | High | Monitor VK API changelog, implement API versioning |
| API Gateway downtime | Low | High | Implement retry logic, failover mechanisms |
| Database corruption | Low | High | Regular backups, use WAL mode for SQLite |
| Security breach | Low | Critical | Regular security audits, follow security best practices |

### Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| High API costs | Medium | Medium | Implement rate limiting, monitor usage |
| VK policy violation | Low | Critical | Review VK bot policies, ensure compliance |
| User data leak | Low | Critical | Encrypt sensitive data, limit data retention |
| Spam/abuse | Medium | Medium | Implement rate limiting, abuse detection |

---

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| 1. Repository Setup | Week 1 | Repository structure, documentation |
| 2. Python Bot Core | Weeks 2-3 | Working Python bot with GPT chat |
| 3. JavaScript Bot Core | Weeks 4-5 | Working JavaScript bot with feature parity |
| 4. Advanced Features | Weeks 6-7 | Images, payments, referrals |
| 5. Deployment & DevOps | Week 8 | Docker, CI/CD, production deployment |
| 6. Testing & QA | Week 9 | Comprehensive testing, bug fixes |
| 7. Documentation & Launch | Week 10 | Complete docs, public launch |

**Total Estimated Time:** 10 weeks (2.5 months)

---

## Dependencies

### External Dependencies

- **VK Platform**: VK API availability and stability
- **API Gateway**: Existing API Gateway service must be operational
- **LLM Providers**: OpenAI, Anthropic, etc. availability via API Gateway
- **VK Pay**: Merchant account approval and webhook setup

### Internal Dependencies

- **API Gateway**: Must support required endpoints
- **Infrastructure**: Hosting environment and domain setup
- **Team Resources**: Development and testing resources

---

## Next Steps

### Immediate Actions (This PR)

1. ✅ Create VK Bot architecture document
2. ✅ Update master-plan README with VK bot reference
3. [ ] Create minimal working examples (Python + JavaScript)
4. [ ] Update PR description with implementation plan
5. [ ] Get feedback from maintainers on approach

### Post-PR Actions

1. Create `deep-assistant/vk-bot` repository
2. Begin Phase 1: Repository Setup
3. Start Phase 2: Python Bot Core development
4. Continue following implementation plan phases

---

## Questions for Maintainers

Before proceeding with full implementation, please provide feedback on:

1. **Repository Structure**: Should this be a new repository or integrated into existing GPTutor repo?
2. **Feature Scope**: Are all proposed features (GPT chat, images, payments, referrals) desired for v1.0?
3. **Timeline**: Is the 10-week timeline acceptable, or should we prioritize differently?
4. **Deployment**: Any specific hosting/deployment preferences?
5. **Payment Integration**: Should we use VK Donut, VK Pay, or both?

---

## References

- [VK Bot API Documentation](https://vk-api.readthedocs.io/)
- [vkbottle Framework](https://github.com/vkbottle/vkbottle)
- [node-vk-bot-api Framework](https://github.com/node-vk-bot-api/node-vk-bot-api)
- [Telegram Bot Repository](https://github.com/deep-assistant/telegram-bot) (reference implementation)
- [API Gateway Repository](https://github.com/deep-assistant/api-gateway)
- [GPTutor Repository](https://github.com/deep-assistant/GPTutor) (existing VK mini app)

---

*This implementation plan is a living document and will be updated as the project progresses.*
