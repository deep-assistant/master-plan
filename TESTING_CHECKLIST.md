# API Gateway Bun Migration - Testing Checklist

This comprehensive checklist ensures thorough validation of the Bun migration before production deployment.

## Pre-Testing Setup

### Environment Preparation
- [ ] Clone the api-gateway repository
- [ ] Checkout the migration branch
- [ ] Ensure Docker is installed and running
- [ ] Ensure Bun is installed locally (optional, for local testing)
- [ ] Prepare test environment variables
- [ ] Back up existing data (src/db/ directory)

### Required Environment Variables
```bash
# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=<your-endpoint>
AZURE_OPENAI_KEY=<your-key>

# OpenAI Configuration
OPENAI_API_KEY=<your-key>

# Other provider keys as needed
DEEPSEEK_API_KEY=<your-key>
DEEPINFRA_API_KEY=<your-key>
OPENROUTER_API_KEY=<your-key>
GOOGLE_API_KEY=<your-key>

# Admin Configuration
ADMIN_FIRST=<admin-token>
```

## Phase 1: Build Testing

### Docker Build Process
- [ ] **Build succeeds without errors**
  ```bash
  docker build -f Dockerfile.bun -t api-gateway-bun:test .
  ```
- [ ] **No build warnings displayed**
- [ ] **Check image size** (should be smaller than Node.js version)
  ```bash
  docker images | grep api-gateway
  ```
- [ ] **Verify multi-stage build** (inspect layers)
  ```bash
  docker history api-gateway-bun:test
  ```
- [ ] **Security scan passes**
  ```bash
  docker scan api-gateway-bun:test
  ```

### Build Time Comparison
- [ ] Record Node.js build time: `_______`
- [ ] Record Bun build time: `_______`
- [ ] Verify Bun is faster or comparable

## Phase 2: Dependency Testing

### Local Testing (Optional)
- [ ] **Install dependencies with Bun**
  ```bash
  cd api-gateway
  rm -f package-lock.json
  bun install
  ```
- [ ] **No installation errors**
- [ ] **bun.lockb file created**
- [ ] **All packages resolved correctly**
- [ ] **Record installation time**

### Container Dependency Check
- [ ] **Verify production dependencies only in final stage**
  ```bash
  docker run --rm api-gateway-bun:test ls -la node_modules | wc -l
  ```
- [ ] **No dev dependencies in production image**
- [ ] **Critical packages present:**
  - [ ] express
  - [ ] openai
  - [ ] lowdb
  - [ ] pino
  - [ ] axios
  - [ ] uuid
  - [ ] multer

## Phase 3: Runtime Testing

### Container Startup
- [ ] **Container starts successfully**
  ```bash
  docker run -d -p 8088:8088 --name api-gateway-test \
    --env-file .env.test \
    api-gateway-bun:test
  ```
- [ ] **No startup errors in logs**
  ```bash
  docker logs api-gateway-test
  ```
- [ ] **Server listening message appears**
- [ ] **Measure startup time**: `_______` (should be <1 second)
- [ ] **Container runs as non-root user**
  ```bash
  docker exec api-gateway-test whoami
  # Should output: bunuser
  ```

### Health Check
- [ ] **Health endpoint responds**
  ```bash
  curl http://localhost:8088/health
  ```
- [ ] **Returns 200 OK status**
- [ ] **Response is valid JSON**
- [ ] **Docker health check passes**
  ```bash
  docker ps | grep api-gateway-test
  # Should show "healthy"
  ```

### Logging System
- [ ] **Pino logger initializes**
- [ ] **Logs appear in docker logs**
- [ ] **Log rotation works** (if applicable)
- [ ] **Log format is correct (JSON)**
- [ ] **No logging errors**

### File System Operations
- [ ] **LowDB database files created** (src/db/)
- [ ] **Can write to database**
- [ ] **Can read from database**
- [ ] **File permissions correct**
- [ ] **Directory permissions correct**

## Phase 4: Functionality Testing

### Authentication & Token Management

#### Token Generation
- [ ] **Generate admin token works**
  ```bash
  docker exec api-gateway-test bun scripts/token-gen.js --userTokenLimit 1000 --chatGptTokenLimit 1000
  ```
- [ ] **Token appears in logs**
- [ ] **Token saved to database**
- [ ] **Token format is correct** (32 hex chars)

#### Token Validation
- [ ] **Valid token accepts requests**
- [ ] **Invalid token rejects requests** (401)
- [ ] **Expired token rejects** (if applicable)
- [ ] **Insufficient balance rejects** (429)

### Chat Completions API

#### Basic Chat Request
- [ ] **POST /v1/chat/completions accepts request**
  ```bash
  curl -X POST http://localhost:8088/v1/chat/completions \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -d '{
      "model": "gpt-4o",
      "messages": [
        {"role": "user", "content": "Say hello"}
      ]
    }'
  ```
- [ ] **Returns valid response**
- [ ] **Response format matches OpenAI API**
- [ ] **Token balance decreases**

#### Streaming Responses
- [ ] **Streaming enabled requests work**
  ```bash
  curl -X POST http://localhost:8088/v1/chat/completions \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -d '{
      "model": "gpt-4o",
      "messages": [{"role": "user", "content": "Count to 10"}],
      "stream": true
    }'
  ```
- [ ] **Returns Server-Sent Events**
- [ ] **Stream chunks arrive progressively**
- [ ] **Stream ends properly**
- [ ] **No connection drops**

#### Error Handling
- [ ] **Invalid model returns error**
- [ ] **Missing required fields returns 400**
- [ ] **Malformed JSON returns 400**
- [ ] **Server errors return 500**
- [ ] **Error format matches OpenAI API**

### Provider Failover Testing

#### Multi-Provider Cascade
- [ ] **Primary provider succeeds** (gpt-4o_go)
- [ ] **Failover to secondary** (when primary fails)
- [ ] **Failover to tertiary** (when secondary fails)
- [ ] **All providers exhausted returns error**
- [ ] **Failover logged correctly**

#### Individual Provider Testing
- [ ] **OpenAI provider works**
  ```bash
  # Request with OpenAI model
  ```
- [ ] **DeepSeek provider works**
- [ ] **DeepInfra provider works**
- [ ] **OpenRouter provider works**
- [ ] **Google Generative AI works**

### Dialog Management

#### Dialog Operations
- [ ] **Create new dialog**
- [ ] **Add messages to dialog**
- [ ] **Retrieve dialog history**
- [ ] **Dialog context maintained**
- [ ] **Token limits enforced**

#### Dialog Persistence
- [ ] **Dialogs saved to database**
- [ ] **Dialogs persist across restarts**
  ```bash
  docker restart api-gateway-test
  # Verify dialogs still exist
  ```
- [ ] **Dialog data integrity maintained**

### Audio Processing

#### Transcription (Whisper)
- [ ] **POST /v1/audio/transcriptions accepts file**
  ```bash
  curl -X POST http://localhost:8088/v1/audio/transcriptions \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -F "file=@test-audio.mp3" \
    -F "model=whisper-1"
  ```
- [ ] **Returns transcription text**
- [ ] **Token calculation correct** (15 tokens/second)
- [ ] **Multiple audio formats supported**

#### Text-to-Speech
- [ ] **POST /v1/audio/speech works**
  ```bash
  curl -X POST http://localhost:8088/v1/audio/speech \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "model": "tts-1",
      "input": "Hello world",
      "voice": "alloy"
    }' \
    --output speech.mp3
  ```
- [ ] **Returns audio file**
- [ ] **Token calculation correct** (0.5 tokens/char)
- [ ] **Audio file is valid**

### Referral System
- [ ] **Referral creation works**
- [ ] **Referral tracking works**
- [ ] **Referral rewards calculated**
- [ ] **Referral data persists**

## Phase 5: Performance Testing

### Response Time
- [ ] **Measure average response time**
  ```bash
  # Use Apache Bench or similar
  ab -n 100 -c 10 http://localhost:8088/health
  ```
- [ ] **Response time acceptable**
- [ ] **Compare to Node.js baseline**: `_______`

### Throughput
- [ ] **Measure requests per second**
  ```bash
  ab -n 1000 -c 10 http://localhost:8088/health
  ```
- [ ] **Record results**: `_______` req/s
- [ ] **Compare to Node.js baseline**
- [ ] **Verify 3x improvement or better**

### Concurrent Requests
- [ ] **Test with 10 concurrent requests**
- [ ] **Test with 50 concurrent requests**
- [ ] **Test with 100 concurrent requests**
- [ ] **No timeouts or failures**
- [ ] **Response times remain stable**

### Load Testing
- [ ] **Run extended load test** (10+ minutes)
  ```bash
  # Use tool like wrk or vegeta
  wrk -t12 -c400 -d10m http://localhost:8088/health
  ```
- [ ] **No memory leaks detected**
- [ ] **CPU usage stable**
- [ ] **No connection pool exhaustion**

### Memory Usage
- [ ] **Measure baseline memory**
  ```bash
  docker stats api-gateway-test --no-stream
  ```
- [ ] **Record memory usage**: `_______` MB
- [ ] **Compare to Node.js**: `_______` MB
- [ ] **Memory usage stable over time**
- [ ] **No memory leaks after load test**

### Startup Performance
- [ ] **Cold start time**: `_______` seconds
- [ ] **Restart time**: `_______` seconds
- [ ] **Compare to Node.js cold start**
- [ ] **Verify 3-4x improvement**

## Phase 6: Integration Testing

### External Services
- [ ] **OpenAI API integration works**
- [ ] **Azure OpenAI integration works**
- [ ] **DeepSeek API integration works**
- [ ] **DeepInfra API integration works**
- [ ] **OpenRouter API integration works**
- [ ] **Google Generative AI works**

### Webhook/Callback Testing
- [ ] **Streaming callbacks work**
- [ ] **Error callbacks work**
- [ ] **Timeout handling correct**

### CORS Testing
- [ ] **CORS headers present**
- [ ] **Cross-origin requests allowed**
- [ ] **Preflight requests handled**

### Rate Limiting
- [ ] **Balance-based limiting works**
- [ ] **429 returned when insufficient balance**
- [ ] **Rate limit info in response headers**

## Phase 7: Security Testing

### Container Security
- [ ] **Runs as non-root user**
  ```bash
  docker exec api-gateway-test id
  ```
- [ ] **File permissions correct**
- [ ] **No unnecessary ports exposed**
- [ ] **Base image has no critical vulnerabilities**

### API Security
- [ ] **Authentication required**
- [ ] **Invalid tokens rejected**
- [ ] **No token leakage in logs**
- [ ] **No sensitive data exposed**
- [ ] **SQL injection not applicable (LowDB)**
- [ ] **XSS protection in place**

### Environment Variables
- [ ] **Secrets not logged**
- [ ] **Environment variables loaded correctly**
- [ ] **No hardcoded credentials**

## Phase 8: Reliability Testing

### Error Recovery
- [ ] **Graceful shutdown on SIGTERM**
  ```bash
  docker stop api-gateway-test
  ```
- [ ] **Handles provider errors gracefully**
- [ ] **Recovers from temporary failures**
- [ ] **Database errors handled**

### Edge Cases
- [ ] **Empty request body handled**
- [ ] **Very long messages handled**
- [ ] **Large file uploads work**
- [ ] **Malformed JSON handled**
- [ ] **Network timeouts handled**
- [ ] **Provider rate limits handled**

### Restart Testing
- [ ] **Container restarts successfully**
  ```bash
  docker restart api-gateway-test
  ```
- [ ] **State recovered after restart**
- [ ] **No data loss**
- [ ] **Connections reestablished**

## Phase 9: Comparison Testing

### Side-by-Side Comparison
- [ ] **Run Node.js version in parallel**
- [ ] **Send identical requests to both**
- [ ] **Compare responses**
- [ ] **Verify functional equivalence**
- [ ] **Document any differences**

### Performance Comparison

| Metric | Node.js | Bun | Improvement |
|--------|---------|-----|-------------|
| Startup Time | _______ | _______ | _______ |
| Req/sec (Health) | _______ | _______ | _______ |
| Req/sec (Chat) | _______ | _______ | _______ |
| Memory (Idle) | _______ | _______ | _______ |
| Memory (Load) | _______ | _______ | _______ |
| Docker Build | _______ | _______ | _______ |
| Install Time | _______ | _______ | _______ |

## Phase 10: Documentation Review

### Documentation Completeness
- [ ] **Migration plan reviewed**
- [ ] **README updated** (if needed)
- [ ] **Deployment instructions clear**
- [ ] **Environment variables documented**
- [ ] **Known issues documented**

### Code Comments
- [ ] **Dockerfile well-commented**
- [ ] **Changes explained**
- [ ] **Reasoning documented**

## Phase 11: Rollback Testing

### Rollback Verification
- [ ] **Can revert to Node.js easily**
- [ ] **Data compatible between versions**
- [ ] **Rollback procedure documented**
- [ ] **Rollback tested successfully**

## Sign-Off

### Testing Summary
- **Total Tests Run**: _______
- **Tests Passed**: _______
- **Tests Failed**: _______
- **Blockers Found**: _______
- **Performance Gains**: _______

### Approval
- [ ] **All critical tests passed**
- [ ] **Performance meets expectations**
- [ ] **No critical bugs found**
- [ ] **Ready for staging deployment**

**Tested By**: _______________________
**Date**: _______________________
**Signature**: _______________________

## Notes and Issues

Use this section to document any issues, observations, or recommendations:

---

### Issue 1
**Severity**: (Critical/High/Medium/Low)
**Description**:
**Status**: (Open/Resolved/Workaround)
**Notes**:

---

### Issue 2
**Severity**:
**Description**:
**Status**:
**Notes**:

---

## Next Steps

After completing this checklist:

1. **If all tests pass**:
   - Update PR with test results
   - Request code review
   - Prepare for staging deployment

2. **If issues found**:
   - Document all issues
   - Prioritize fixes
   - Retest after fixes
   - Update migration plan if needed

3. **Performance notes**:
   - Document actual vs expected performance
   - Identify optimization opportunities
   - Update benchmarks

---

*This checklist is part of the Bun migration (Issue #15, PR #40)*
