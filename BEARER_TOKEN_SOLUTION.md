# Bearer Token Authentication Solution

## Issue #14: Allow to use bearer header in all our API

### Summary

This document provides a comprehensive solution for implementing Bearer token authentication via Authorization headers across all API endpoints in the deep-assistant organization, while maintaining backward compatibility with query parameter authentication.

## Problem Statement

Currently, the api-gateway authentication system uses:
- **User tokens**: Already support `Authorization: Bearer <token>` header ✅
- **Master/Admin tokens**: Only support `?masterToken=<token>` query parameter ❌

This creates several issues:
1. **Security Risk**: Query parameters are logged in server logs, browser history, and proxy logs
2. **Non-standard**: Does not follow OAuth 2.0 and REST API best practices
3. **Inconsistency**: Mixed authentication methods within the same API
4. **OpenAI Compatibility**: Hinders OpenAI API standard compliance needed for Cursor support

## Security Analysis

### Why Bearer Tokens in Headers are More Secure

According to OAuth 2.0 specification (RFC 6750) and 2025 security best practices:

#### Query Parameter Risks:
- ❌ Exposed in web server access logs
- ❌ Stored in browser history
- ❌ Logged by proxies and load balancers
- ❌ Leaked via Referer headers
- ❌ Visible in URL sharing/screenshots

#### Header Benefits:
- ✅ Not logged by default in most servers
- ✅ Not stored in browser history
- ✅ Not leaked via Referer headers
- ✅ Industry standard (OAuth 2.0, OpenAI, etc.)
- ✅ Better separation of concerns

**OAuth 2.0 RFC 6750 Quote:**
> "The access token MUST NOT be transmitted in the clear. Clients MUST use TLS... HTTP servers SHOULD support the HTTP Authorization request header field... The HTTP request entity-body and the HTTP request URI query parameters SHOULD NOT be used to transport access tokens."

### Is This Just Common Practice or Actually More Secure?

**Answer: Both. It's a common practice BECAUSE it's more secure.**

Specific security advantages:
1. **Reduced Attack Surface**: Tokens in headers are less likely to be accidentally exposed
2. **Compliance**: Required for SOC 2, ISO 27001, and other security certifications
3. **Short-lived Tokens**: While both methods require HTTPS, headers make it easier to implement token rotation
4. **Defense in Depth**: Even with HTTPS, avoiding URL exposure adds an extra security layer

## Proposed Solution

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  TokensService.getMasterTokenFromRequest(req)      │    │
│  │                                                     │    │
│  │  Priority 1: Authorization: Bearer <token>  ✅     │    │
│  │  Priority 2: ?masterToken=<token>           ⚠️      │    │
│  │              (deprecated, logs warning)            │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │  TokensService.isValidMasterToken(token)           │    │
│  │                                                     │    │
│  │  Validates against process.env.ADMIN_FIRST         │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Steps

#### Step 1: Enhance TokensService

Add a new method to extract master token from either header or query parameter:

```javascript
// src/services/TokensService.js

getMasterTokenFromRequest(req) {
  // Priority 1: Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.split('Bearer ')[1];
    }
  }

  // Priority 2: Fall back to query parameter (deprecated)
  if (req.query.masterToken) {
    console.log('⚠️ [DEPRECATED] Using masterToken in query parameter is deprecated. Please use Authorization: Bearer header instead.');
    return req.query.masterToken;
  }

  throw new HttpException(401, "Missing authentication token. Please provide Authorization: Bearer header.");
}
```

#### Step 2: Update Controllers

Update 10 endpoints across 5 controllers:

**Before:**
```javascript
await tokensService.isValidMasterToken(req.query.masterToken);
```

**After:**
```javascript
const masterToken = tokensService.getMasterTokenFromRequest(req);
await tokensService.isValidMasterToken(masterToken);
```

**Files to update:**
- `src/controllers/tokensController.js` - 4 endpoints
- `src/controllers/completionsController.js` - 1 endpoint
- `src/controllers/dialogsController.js` - 1 endpoint
- `src/controllers/systemMessagesController.js` - 2 endpoints
- `src/controllers/referralController.js` - 2 endpoints

#### Step 3: Update Documentation

Add Bearer token examples to all documentation:

**Example for README.md:**

```markdown
### Authentication

#### User Token (Already Supported)
```bash
curl -X POST https://api.example.com/v1/chat/completions \
  -H "Authorization: Bearer your-user-token-here" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4", "messages": [{"role": "user", "content": "Hello"}]}'
```

#### Master Token (New: Header Support)

**Recommended (New):**
```bash
curl -X GET "https://api.example.com/token?userId=123" \
  -H "Authorization: Bearer your-master-token-here"
```

**Deprecated (Still Works):**
```bash
curl -X GET "https://api.example.com/token?userId=123&masterToken=your-master-token-here"
```

⚠️ **Deprecation Notice**: Using `masterToken` as a query parameter is deprecated and will be removed in v2.0.0. Please migrate to using the `Authorization: Bearer` header.
```

## Migration Guide for API Consumers

### For Telegram Bot

**Current code (example):**
```javascript
const response = await fetch(`${API_URL}/token?userId=${userId}&masterToken=${MASTER_TOKEN}`);
```

**Updated code:**
```javascript
const response = await fetch(`${API_URL}/token?userId=${userId}`, {
  headers: {
    'Authorization': `Bearer ${MASTER_TOKEN}`
  }
});
```

### Testing Both Methods

During the transition period, both methods will work:

```bash
# Method 1: Bearer header (recommended)
curl -H "Authorization: Bearer ${MASTER_TOKEN}" \
  "https://api.example.com/token?userId=123"

# Method 2: Query parameter (deprecated, logs warning)
curl "https://api.example.com/token?userId=123&masterToken=${MASTER_TOKEN}"
```

## Timeline

| Phase | Duration | Actions |
|-------|----------|---------|
| **Phase 1: Implementation** | Week 1 | Add Bearer header support to api-gateway |
| **Phase 2: Testing** | Week 1 | Test both methods, verify deprecation warnings |
| **Phase 3: Documentation** | Week 2 | Update all documentation with examples |
| **Phase 4: Notification** | Month 1 | Notify all API consumers (telegram-bot, etc.) |
| **Phase 5: Migration** | Months 2-6 | Update all consumers to use headers |
| **Phase 6: Monitoring** | Months 6-12 | Monitor deprecation warnings, assist migrations |
| **Phase 7: Removal** | v2.0.0 | Remove query parameter support (breaking change) |

## Benefits

### Immediate Benefits
1. **Enhanced Security**: Reduced risk of token exposure
2. **Standards Compliance**: Follows OAuth 2.0 and REST best practices
3. **OpenAI Compatibility**: Better alignment with OpenAI API standard
4. **Backward Compatibility**: No breaking changes during transition

### Long-term Benefits
1. **Future-proofing**: Easier to add OAuth 2.0 flows later
2. **Audit Compliance**: Meets security audit requirements
3. **Professional API**: Industry-standard authentication
4. **Cursor Support**: Enables using our API gateway with Cursor IDE

## Testing Strategy

### Unit Tests
- ✅ Bearer token extraction from Authorization header
- ✅ Query parameter fallback
- ✅ Deprecation warning logging
- ✅ Invalid token rejection
- ✅ Missing token handling

### Integration Tests
- ✅ All 10 endpoints with Bearer header
- ✅ All 10 endpoints with query parameter (deprecated)
- ✅ Mixed usage (some endpoints with header, some with query)

### Security Tests
- ✅ Token not leaked in logs (when using header)
- ✅ Deprecation warning appears (when using query param)
- ✅ Invalid tokens rejected with 401
- ✅ Missing tokens handled gracefully

## Implementation Checklist

### Code Changes
- [ ] Add `getMasterTokenFromRequest()` to TokensService
- [ ] Update tokensController.js (4 endpoints)
- [ ] Update completionsController.js (1 endpoint)
- [ ] Update dialogsController.js (1 endpoint)
- [ ] Update systemMessagesController.js (2 endpoints)
- [ ] Update referralController.js (2 endpoints)

### Documentation
- [ ] Update api-gateway README.md with Bearer examples
- [ ] Update ARCHITECTURE.md authentication section
- [ ] Create MIGRATION_GUIDE.md for API consumers
- [ ] Add deprecation notice to all relevant docs

### Testing
- [ ] Test Bearer header authentication on all endpoints
- [ ] Test backward compatibility with query parameters
- [ ] Verify deprecation warnings in logs
- [ ] Test error handling for missing/invalid tokens

### Deployment
- [ ] Create PR for api-gateway repository
- [ ] Review and merge changes
- [ ] Deploy to production
- [ ] Monitor logs for issues

### Communication
- [ ] Notify telegram-bot maintainers
- [ ] Update API documentation
- [ ] Announce in organization discussions
- [ ] Set timeline for query parameter removal

## Conclusion

This solution provides a secure, standards-compliant authentication method while maintaining full backward compatibility. The phased approach ensures a smooth transition for all API consumers without breaking existing integrations.

The implementation is straightforward, well-tested, and aligns with industry best practices. It also paves the way for future enhancements like OAuth 2.0 flows and better integration with tools like Cursor.

---

**Related Issues:**
- #14 - Allow to use bearer header in all our API
- #8 - Cursor Support via API Gateway

**Related Repositories:**
- deep-assistant/api-gateway
- deep-assistant/telegram-bot
