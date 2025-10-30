# Bun Migration Plan for API Gateway

## Executive Summary

This document outlines the comprehensive plan for transitioning the `deep-assistant/api-gateway` from Node.js to Bun runtime. This migration addresses issue [#15](https://github.com/deep-assistant/master-plan/issues/15) and aims to leverage Bun's superior performance characteristics while maintaining full compatibility with the existing codebase.

## Table of Contents

1. [Background](#background)
2. [Why Bun?](#why-bun)
3. [Compatibility Assessment](#compatibility-assessment)
4. [Migration Strategy](#migration-strategy)
5. [Implementation Steps](#implementation-steps)
6. [Testing & Validation](#testing--validation)
7. [Rollback Plan](#rollback-plan)
8. [Performance Benchmarks](#performance-benchmarks)
9. [Risks & Mitigations](#risks--mitigations)

## Background

The API Gateway is currently built on:
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** LowDB (JSON file storage)
- **Key Features:** Multi-provider LLM failover, streaming support, audio processing
- **Deployment:** Docker containers

## Why Bun?

### Performance Benefits
1. **Faster Startup:** Bun starts ~4x faster than Node.js
2. **HTTP Performance:** Express on Bun handles 3x more requests/second (~52k vs ~13k req/s)
3. **Package Installation:** 30x faster than npm
4. **Memory Efficiency:** Lower memory footprint
5. **Built-in Tools:** Native bundler, transpiler, and test runner

### Business Impact
- **Reduced Infrastructure Costs:** Lower CPU and memory usage
- **Better User Experience:** Faster response times
- **Developer Productivity:** Faster installs and hot reload
- **Future-Proof:** Modern runtime with active development

## Compatibility Assessment

### ✅ Fully Compatible Dependencies

Based on research and Bun's Node.js compatibility, these core dependencies are confirmed compatible:

| Dependency | Version | Status | Notes |
|------------|---------|--------|-------|
| Express.js | 4.18.1 | ✅ Compatible | 3x performance improvement |
| OpenAI SDK | 4.63.0 | ✅ Compatible | Standard Web APIs |
| Axios | Latest | ✅ Compatible | HTTP client works natively |
| Pino | 9.6.0 | ✅ Compatible | Logging framework |
| UUID | Latest | ✅ Compatible | Standard crypto APIs |
| Multer | Latest | ✅ Compatible | File upload middleware |
| CORS | Latest | ✅ Compatible | Express middleware |

### ⚠️ Dependencies Requiring Testing

| Dependency | Consideration |
|------------|---------------|
| LowDB | File system operations - needs validation |
| Google Generative AI SDK | Should work but requires testing |
| DeepInfra SDK | Newer SDK, needs validation |
| Pino Log Rotation | File system operations |
| Node-Cron | Timing/scheduling needs verification |

### 🔧 Required Changes

1. **Shebang Scripts:** Update any Node.js-specific shebangs to be Bun-compatible
2. **Package Scripts:** Change `node` commands to `bun` in package.json
3. **Dockerfile:** Replace Node.js base image with Bun image
4. **Environment Setup:** Adjust any Node.js-specific environment variables

## Migration Strategy

### Phased Approach

**Phase 1: Development Environment (This PR)**
- Update Dockerfile for Bun
- Modify package.json scripts
- Create migration documentation
- Set up testing framework

**Phase 2: Testing & Validation (Post-PR)**
- Run comprehensive test suite
- Performance benchmarking
- Load testing
- Integration testing with all LLM providers

**Phase 3: Staging Deployment (Post-Validation)**
- Deploy to staging environment
- Monitor for issues
- Performance analysis
- Bug fixes if needed

**Phase 4: Production Rollout (Final)**
- Gradual rollout with monitoring
- Rollback plan ready
- Performance tracking
- Success metrics validation

### This PR Scope

**This PR focuses on Phase 1 only:**
- ✅ Update Dockerfile to use Bun
- ✅ Modify package.json scripts
- ✅ Create comprehensive migration documentation
- ✅ Provide testing checklist
- ✅ Document expected changes and risks
- ❌ Does NOT include actual deployment or runtime changes

## Implementation Steps

### 1. Update Dockerfile

**Current Dockerfile:**
```dockerfile
FROM node:18
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8088
CMD ["npm", "start"]
```

**New Bun Dockerfile (Multi-stage, Production-Ready):**
```dockerfile
# Use Bun base image (specific version for reproducibility)
FROM oven/bun:1.1.42-alpine AS base

# Install dependencies stage
FROM base AS install
WORKDIR /app
RUN mkdir -p /temp/dev
COPY package.json bun.lockb /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Copy production dependencies
RUN mkdir -p /temp/prod
COPY package.json bun.lockb /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# Build stage
FROM base AS build
WORKDIR /app
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# Production stage
FROM base AS release
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 bunuser && \
    adduser --system --uid 1001 bunuser

# Copy production dependencies and application
COPY --from=install --chown=bunuser:bunuser /temp/prod/node_modules node_modules
COPY --from=build --chown=bunuser:bunuser /app .

# Switch to non-root user
USER bunuser

# Expose port
EXPOSE 8088

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun run healthcheck.js || exit 1

# Start application
CMD ["bun", "run", "src/server.js"]
```

### 2. Update package.json Scripts

**Changes Required:**
```json
{
  "scripts": {
    "start": "bun src/server.js",
    "dev": "bun --watch src/server.js",
    "test": "bun test",
    "generate-token": "bun scripts/token-gen.js",
    "format": "bun run prettier --write .",
    "pull_update": "git pull && bun install"
  }
}
```

### 3. Create .dockerignore

```
node_modules
.git
.gitignore
*.md
.env*
logs
*.log
.DS_Store
coverage
.vscode
.idea
```

### 4. Optional: Create bun.lockb

When dependencies are first installed with Bun, it will automatically generate `bun.lockb` (Bun's lockfile).

**Migration Step:**
```bash
# In the api-gateway directory
rm -f package-lock.json  # Remove npm lockfile
bun install              # Generate bun.lockb
```

### 5. Add Health Check Script

Create `healthcheck.js` in the root:
```javascript
// Simple health check for Docker
const response = await fetch('http://localhost:8088/health').catch(() => null);
process.exit(response?.ok ? 0 : 1);
```

Update server to include health endpoint:
```javascript
// In src/server.js
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});
```

## Testing & Validation

### Pre-Deployment Testing Checklist

#### 1. Build Testing
- [ ] Docker image builds successfully
- [ ] Image size is reasonable (should be smaller than Node.js)
- [ ] No build warnings or errors
- [ ] Multi-stage build works correctly

#### 2. Dependency Testing
- [ ] All npm packages install without errors
- [ ] `bun install` completes successfully
- [ ] No dependency conflicts reported
- [ ] Production dependencies only in final stage

#### 3. Runtime Testing
- [ ] Application starts without errors
- [ ] Express server listens on correct port
- [ ] Health check endpoint responds
- [ ] Logging works (Pino)
- [ ] File operations work (LowDB)

#### 4. Functionality Testing
- [ ] POST /v1/chat/completions works
- [ ] Streaming responses work
- [ ] Token authentication works
- [ ] Multi-provider failover functions
- [ ] Audio transcription works
- [ ] Text-to-speech works
- [ ] Dialog management works
- [ ] Referral system works

#### 5. Integration Testing
- [ ] OpenAI provider works
- [ ] DeepSeek provider works
- [ ] DeepInfra provider works
- [ ] OpenRouter provider works
- [ ] Google Generative AI works

#### 6. Performance Testing
- [ ] Measure startup time (should be faster)
- [ ] Measure request throughput (should be higher)
- [ ] Measure memory usage (should be lower)
- [ ] Load test with concurrent requests
- [ ] Test streaming performance

#### 7. Security Testing
- [ ] Container runs as non-root user
- [ ] No sensitive data in logs
- [ ] Token validation works
- [ ] Rate limiting works (balance-based)

#### 8. Error Handling
- [ ] Graceful shutdown works
- [ ] Error responses are correct
- [ ] Provider failover on errors
- [ ] Proper HTTP status codes
- [ ] Error logging works

### Testing Commands

```bash
# Build the Docker image
docker build -t api-gateway-bun .

# Run the container
docker run -d -p 8088:8088 --name api-gateway-test \
  -e AZURE_OPENAI_ENDPOINT=... \
  -e AZURE_OPENAI_KEY=... \
  api-gateway-bun

# Check logs
docker logs api-gateway-test

# Test health endpoint
curl http://localhost:8088/health

# Test chat completion
curl -X POST http://localhost:8088/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"Hello"}]}'

# Performance test with Apache Bench
ab -n 1000 -c 10 http://localhost:8088/health

# Memory usage
docker stats api-gateway-test

# Cleanup
docker stop api-gateway-test && docker rm api-gateway-test
```

## Rollback Plan

### Immediate Rollback (If Critical Issues)

If critical issues are discovered after deployment:

1. **Revert Dockerfile:**
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. **Rebuild with Node.js:**
   ```bash
   docker build -t api-gateway .
   docker push <registry>/api-gateway:latest
   ```

3. **Redeploy Previous Version:**
   - Use existing Node.js-based containers
   - Update deployment configuration
   - Verify service health

### Partial Rollback (Hybrid Approach)

Run both Node.js and Bun versions in parallel:
- Route percentage of traffic to Bun version
- Monitor performance and errors
- Gradually increase Bun traffic if stable
- Maintain Node.js as fallback

## Performance Benchmarks

### Expected Improvements

| Metric | Node.js (Baseline) | Bun (Expected) | Improvement |
|--------|-------------------|----------------|-------------|
| Startup Time | ~2-3 seconds | ~0.5-1 second | 3-4x faster |
| HTTP Req/sec (Express) | ~13,000 | ~52,000 | 4x faster |
| Package Install | 45-60 seconds | 2-3 seconds | 20-30x faster |
| Memory Usage | 100-150 MB | 70-100 MB | 30% reduction |
| Docker Build | 2-3 minutes | 1-2 minutes | 40% faster |

### Benchmarking Plan

1. **Before Migration:**
   - Record baseline metrics
   - Document current performance
   - Identify bottlenecks

2. **After Migration:**
   - Run same benchmarks
   - Compare results
   - Document improvements

3. **Continuous Monitoring:**
   - Track performance over time
   - Monitor for regressions
   - Optimize based on data

## Risks & Mitigations

### High Risk

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Runtime incompatibility | High | Low | Comprehensive testing before production |
| Production bugs | High | Low | Staged rollout with monitoring |
| Data loss (LowDB issues) | Critical | Very Low | Backup before migration, test file operations |

### Medium Risk

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Performance regression | Medium | Low | Benchmark testing, rollback plan |
| SDK compatibility issues | Medium | Low | Test all provider SDKs thoroughly |
| Learning curve | Low | Medium | Documentation, team training |

### Low Risk

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Docker build changes | Low | High | Document new build process |
| Environment differences | Low | Low | Consistent environments |
| Community support | Low | Low | Bun has active community |

## Success Criteria

Migration is considered successful when:

1. ✅ All functionality works identically to Node.js version
2. ✅ Performance metrics meet or exceed expectations
3. ✅ No critical bugs in production
4. ✅ Team is comfortable with Bun workflow
5. ✅ Documentation is complete and accurate
6. ✅ Monitoring shows stable operation
7. ✅ Cost savings are realized

## Timeline

| Phase | Duration | Activities |
|-------|----------|------------|
| Phase 1: Preparation (This PR) | 1-2 days | Documentation, Dockerfile updates |
| Phase 2: Testing | 3-5 days | Comprehensive testing |
| Phase 3: Staging | 1-2 weeks | Staging deployment, monitoring |
| Phase 4: Production | 1-2 weeks | Gradual rollout |

## References

- [Bun Official Documentation](https://bun.sh/docs)
- [Bun Docker Guide](https://bun.sh/guides/ecosystem/docker)
- [Node.js Compatibility](https://bun.sh/docs/runtime/nodejs-apis)
- [Issue #15](https://github.com/deep-assistant/master-plan/issues/15)
- [API Gateway Architecture](https://github.com/deep-assistant/api-gateway/blob/main/ARCHITECTURE.md)

## Contributors

- Migration Plan: AI Assistant
- Issue Reporter: @konard
- Repository: deep-assistant/api-gateway

---

*This migration plan is part of PR #40 addressing issue #15*
