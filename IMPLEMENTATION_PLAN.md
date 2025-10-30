# Implementation Plan: Bearer Token Authentication for API Gateway

## Issue Reference
https://github.com/deep-assistant/master-plan/issues/14

## Objective
Allow using Bearer token authentication via Authorization header in all API endpoints while maintaining backward compatibility with query parameter authentication.

## Security Analysis

### Why Bearer Token in Headers is More Secure

Based on 2025 security best practices and OAuth 2.0 specifications:

1. **Prevents Logging Exposure**: Query parameters appear in:
   - Web server access logs
   - Browser history
   - Proxy logs
   - Referrer headers when clicking external links

2. **OAuth 2.0 Standard**: The OAuth 2.0 specification explicitly states that:
   - Servers MUST support Authorization header
   - Query parameters SHOULD NOT be used unless impossible to use headers
   - If query params are supported, headers MUST also be supported

3. **Common Practice**: Industry standard for REST APIs is to use `Authorization: Bearer <token>` header

4. **HTTPS Requirement**: While both methods require HTTPS, headers are less likely to be accidentally exposed

### Current Implementation Analysis

Currently, the api-gateway uses:
- **User tokens**: Already support Bearer header via `Authorization: Bearer <token>` (used in `/v1/chat/completions`)
- **Master token**: Only supports query parameter `?masterToken=<token>` (used in admin endpoints)

## Files to Modify

### 1. Service Layer
- `src/services/TokensService.js` - Add method to extract master token from header or query

### 2. Controllers (Master Token Authentication)
- `src/controllers/tokensController.js` - 4 endpoints
- `src/controllers/completionsController.js` - 1 endpoint (`/completions`)
- `src/controllers/dialogsController.js` - 1 endpoint
- `src/controllers/systemMessagesController.js` - 2 endpoints
- `src/controllers/referralController.js` - 2 endpoints

### 3. Documentation
- Create/update README sections with Bearer token examples
- Add migration guide for API consumers

## Implementation Approach

### Phase 1: Add Header Support (Backward Compatible)
1. Add new method `getMasterTokenFromRequest(req)` in `TokensService`
   - First check Authorization header for Bearer token
   - Fall back to query parameter for backward compatibility
   - Log deprecation warning when query parameter is used

2. Update all controllers to use new method

### Phase 2: Documentation
1. Update API documentation with Bearer header examples
2. Add deprecation notice for query parameter authentication
3. Provide migration timeline (suggested: 6-12 months before removal)

### Phase 3: Testing
1. Test Bearer header authentication
2. Test backward compatibility with query parameters
3. Verify deprecation warnings

## Implementation Details

### TokensService Enhancement

```javascript
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

  return null;
}

async isValidMasterToken(token) {
  // Existing implementation remains unchanged
  console.log(`[ проверка мастер токена ${token}...`)
  if (token !== process.env.ADMIN_FIRST) {
    console.log(` не пройдена ]`)
    throw new HttpException(401, "Невалидный мастер токен!");
  }
  console.log(` пройдена ]`)
}
```

### Controller Update Pattern

Before:
```javascript
await tokensService.isValidMasterToken(req.query.masterToken);
```

After:
```javascript
const masterToken = tokensService.getMasterTokenFromRequest(req);
await tokensService.isValidMasterToken(masterToken);
```

## Migration Timeline

1. **Immediate**: Add Bearer header support with backward compatibility
2. **Next 3 months**: Notify all API consumers about deprecation
3. **6-12 months**: Consider removing query parameter support (breaking change, requires major version bump)

## Testing Checklist

- [ ] Bearer token in Authorization header works for all endpoints
- [ ] Query parameter still works (backward compatibility)
- [ ] Deprecation warning is logged when using query parameter
- [ ] Invalid token returns 401
- [ ] Missing token returns appropriate error

## Documentation Updates Needed

1. README.md - Add Bearer token examples
2. ARCHITECTURE.md - Update authentication section
3. API consumers (telegram-bot, etc.) - Update to use Bearer headers

## Benefits

1. **Security**: Follows OAuth 2.0 and REST API best practices
2. **Compatibility**: Maintains backward compatibility during transition
3. **Standard**: Aligns with OpenAI API standard (important for Cursor support)
4. **Future-proof**: Easier to add more advanced auth methods later
