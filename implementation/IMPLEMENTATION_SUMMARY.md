# Issue #17 Implementation Summary

## Overview
This implementation splits the single energy account into **bonus** and **real** energy accounts, with the following key features:

1. **Bonus Energy Expiration**: 2 years from grant date
2. **Daily Activity Requirement**: Only grant daily bonus if user was active yesterday
3. **FIFO Spending**: Oldest bonus energy used first, then real energy
4. **User Notifications**: Notify when balance increases or bonuses expire
5. **Balance Display**: Show real vs bonus breakdown

## Files Modified

### api-gateway Repository

#### 1. `src/repositories/TokensRepository.js`
**Changes:**
- Added new fields: `bonus_tokens`, `bonus_history`, `last_spending_date`, `total_spent_yesterday`
- Implemented `spendEnergy()` with FIFO bonus logic
- Implemented `addBonusEnergy()` with 2-year expiration
- Implemented `addRealEnergy()` for purchases
- Implemented `cleanExpiredBonuses()` for automatic cleanup
- Implemented `wasActiveYesterday()` check
- Implemented `getExpiringBonuses()` for warnings
- Added `migrateToNewStructure()` for data migration

**Key Methods:**
```javascript
async spendEnergy(userId, amount) // FIFO bonus spending
async addBonusEnergy(userId, amount, source) // Add bonus with expiration
async addRealEnergy(userId, amount) // Add real energy
async cleanExpiredBonuses(userId) // Clean up expired
async wasActiveYesterday(userId) // Check activity
```

#### 2. `src/services/TokensService.js`
**Changes:**
- Updated `isHasBalanceToken()` to check total balance (real + bonus)
- Added `getTotalBalance()` method
- Added `getBalanceDetails()` for detailed breakdown

**Key Methods:**
```javascript
async getTotalBalance(userId) // Get total balance
async getBalanceDetails(userId) // Get detailed breakdown
```

#### 3. `src/services/CompletionsService.js`
**Changes:**
- Updated `updateCompletionTokens()` to use new spending logic
- Added `addBonusTokens()` method for granting bonuses

**Key Methods:**
```javascript
async updateCompletionTokens(tokenId, energy, operation) // Updated spending
async addBonusTokens(userId, energy, source) // Add bonus energy
```

#### 4. `src/services/ReferralService.js`
**Changes:**
- Updated `getTokensToUpdate()` to check yesterday's activity
- Updated `runAwardUpdate()` cron to:
  - Check activity before granting
  - Clean expired bonuses
  - Use `addBonusTokens()` for grants
  - Track expiring bonuses
- Updated `createReferral()` to use `addBonusTokens()`

**Key Changes:**
- Daily bonus only granted if user was active yesterday
- Automatic expired bonus cleanup
- All bonuses tracked with expiration dates

#### 5. `src/controllers/tokensController.js`
**New Endpoints:**
- `GET /token/:userId/details` - Get detailed balance breakdown
- `POST /token/migrate` - Run migration (admin only)
- `POST /token/:userId/clean-expired` - Clean expired bonuses

### telegram-bot Repository

#### 1. `bot/middlewares/MiddlewareAward.py`
**Changes:**
- Added notification polling for daily bonuses
- Added warnings for expiring bonuses
- Added messages for expired bonuses
- Enhanced message formatting

**New Features:**
- Checks for pending notifications from api-gateway
- Sends formatted messages for different notification types

#### 2. `bot/balance/router.py` (or `bot/commands.py`)
**Changes:**
- Updated balance display to show:
  - Real vs bonus energy breakdown
  - Expiring soon bonuses
  - Daily bonus eligibility status
  - Enhanced formatting with emojis

**New Display:**
```
💰 Ваш баланс энергии

🔋 Всего: 25,000⚡️

━━━━━━━━━━━━━━━━
├─ 💎 Реальная энергия: 10,000⚡️
│   └─ Не истекает, можно купить
│
├─ 🎁 Бонусная энергия: 15,000⚡️
│   └─ Истекает через 2 года
```

#### 3. `services/tokens_service.py` (NEW)
**New Service:**
- `get_balance_details()` - Fetch detailed balance from api-gateway
- `get_notifications()` - Fetch pending notifications

## Data Structure Changes

### Old Token Structure
```javascript
{
  id: "32-char-hex",
  user_id: "userId",
  tokens_gpt: 10000
}
```

### New Token Structure
```javascript
{
  id: "32-char-hex",
  user_id: "userId",
  tokens_gpt: 10000,              // Real energy
  bonus_tokens: 5000,             // Total bonus energy
  bonus_history: [                // Individual bonus grants
    {
      id: "unique-id",
      amount: 5000,
      granted_date: "2025-10-30T00:00:00Z",
      expires_date: "2027-10-30T00:00:00Z",  // 2 years
      remaining: 5000,
      source: "daily_award" | "referral_activation"
    }
  ],
  last_spending_date: "2025-10-30",  // YYYY-MM-DD
  total_spent_yesterday: 150         // Amount spent yesterday
}
```

## Migration Strategy

### Step 1: Deploy api-gateway with backward compatibility
All new fields are optional and initialized with defaults.

### Step 2: Run migration endpoint
```bash
POST /token/migrate?masterToken=ADMIN_TOKEN
```

This will:
- Add new fields to all existing tokens
- Keep existing `tokens_gpt` as real energy
- Initialize `bonus_tokens = 0`
- Set `last_spending_date = today`

### Step 3: Deploy telegram-bot updates
Update bot to show new balance display and notifications.

### Step 4: Monitor
- Check daily cron job logs
- Verify activity checks working
- Monitor user notifications

## Testing Checklist

### Unit Tests
- [ ] `spendEnergy()` with various scenarios
- [ ] `addBonusEnergy()` creates correct expiration dates
- [ ] `cleanExpiredBonuses()` removes only expired
- [ ] `wasActiveYesterday()` correctly checks activity
- [ ] FIFO spending order (oldest bonus first)

### Integration Tests
- [ ] Daily cron grants bonuses only to active users
- [ ] Spending tracks activity correctly
- [ ] Expired bonuses are cleaned up
- [ ] Notifications are created
- [ ] Balance display shows correct values

### Manual Testing
1. Create test user
2. Grant bonus energy
3. Spend some energy (check FIFO order)
4. Wait for next day (or mock date)
5. Verify daily bonus granted only if active
6. Mock expired bonuses and verify cleanup
7. Check balance display in telegram-bot

## API Examples

### Get Detailed Balance
```bash
GET /token/123456789/details

Response:
{
  "success": true,
  "data": {
    "user_id": "123456789",
    "real_tokens": 10000,
    "bonus_tokens": 5000,
    "total_balance": 15000,
    "expiring_soon": 1000,
    "bonus_history": [...],
    "last_spending_date": "2025-10-30"
  }
}
```

### Spend Energy (Internal)
```javascript
const result = await tokensRepository.spendEnergy(userId, 150);
// Uses bonus energy first (FIFO), then real energy
```

### Add Bonus Energy (Internal)
```javascript
await completionsService.addBonusTokens(userId, 5000, "daily_award");
// Adds bonus with 2-year expiration
```

## Configuration

### Environment Variables
```bash
# Optional: Configure expiration period (default: 2 years)
BONUS_EXPIRATION_YEARS=2

# Optional: Configure expiring soon threshold (default: 30 days)
BONUS_EXPIRING_THRESHOLD_DAYS=30
```

## Rollback Plan

If issues arise:

1. **Immediate**: Disable daily cron job
2. **Data**: All old data preserved in `tokens_gpt`
3. **Code**: Revert to old spending logic (ignore bonus fields)
4. **Recovery**: Keep bonus_history for future re-migration

## Performance Considerations

- **FIFO Sorting**: Bonus history sorted once per spending operation
- **Daily Cron**: Runs once at midnight, iterates all users
- **Cleanup**: Expired bonuses cleaned during daily cron (minimal overhead)
- **Storage**: Each bonus entry ~150 bytes, max ~50 entries per user = 7.5KB

## Security Considerations

- Migration endpoint requires admin master token
- Spending tracked per user (prevents manipulation)
- Expiration dates server-controlled (client cannot modify)
- Balance checks use total balance (bonus + real)

## Success Metrics

1. ✅ All users migrated without data loss
2. ✅ Daily bonuses only granted to active users
3. ✅ Bonus energy expires after 2 years
4. ✅ Users receive notifications
5. ✅ Balance display shows breakdown
6. ✅ Tests pass
7. ✅ No performance degradation

## Timeline

- **Phase 1** (api-gateway core): 6-8 hours
- **Phase 2** (api-gateway cron): 2-3 hours
- **Phase 3** (telegram-bot): 3-4 hours
- **Phase 4** (testing): 4-5 hours
- **Phase 5** (deployment & monitoring): 2-3 hours

**Total: ~20-25 hours**

## Next Steps

1. Review this implementation proposal
2. Get approval from team/product owner
3. Create separate PRs for api-gateway and telegram-bot
4. Implement with comprehensive tests
5. Deploy to staging first
6. Monitor and iterate
7. Deploy to production

## Questions?

Contact the AI assistant or create a comment on issue #17 for clarifications!
