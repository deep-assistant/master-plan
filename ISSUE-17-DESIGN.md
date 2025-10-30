# Issue #17: Split Bonus and Real Energy Accounts - Design Document

## Current System Analysis

### Token/Energy Storage (api-gateway)
**Location:** `src/repositories/TokensRepository.js`, `src/services/TokensService.js`

**Current Structure:**
```javascript
{
  id: "32-char-hex",           // Auth token
  user_id: "userId",
  tokens_gpt: 10000            // Single energy balance
}
```

**Current Behavior:**
- Users start with 10,000 tokens_gpt
- Daily cron job (midnight Moscow time) adds energy based on referral status
- No distinction between bonus and purchased/real energy
- No expiration mechanism

### Referral System (api-gateway)
**Location:** `src/repositories/ReferralRepository.js`, `src/services/ReferralService.js`

**Current Structure:**
```javascript
{
  id: "userId",
  parent: "parentUserId" | null,
  children: ["childUserId1", ...],
  createDate: "ISO date",
  lastUpdate: "ISO date",
  isActivated: false,
  award: 10000 + (children.length * 500)  // Daily bonus amount
}
```

**Current Daily Award Logic (runAwardUpdate cron):**
- Runs at midnight Moscow time
- Awards ALL users their `award` amount (10,000 base + 500 per referral child)
- Cap: Users with balance >= 30,000 get no daily bonus
- One-time activation: When first referral is confirmed, both referrer and referred get 5,000 bonus

**Problem:** No check for daily activity/spending before granting bonus.

## New System Design

### 1. Split Energy Accounts

#### New Token Structure
```javascript
{
  id: "32-char-hex",           // Auth token (unchanged)
  user_id: "userId",           // Unchanged
  tokens_gpt: 10000,           // REAL energy (purchased, doesn't expire)
  bonus_tokens: 5000,          // BONUS energy (with expiration)
  bonus_history: [             // Track bonus grants with expiration
    {
      id: "unique-id",
      amount: 5000,
      granted_date: "2025-10-30T00:00:00Z",
      expires_date: "2027-10-30T00:00:00Z",  // 2 years
      remaining: 5000,
      source: "daily_award" | "referral_activation" | "referral_daily"
    }
  ],
  last_spending_date: "2025-10-30",  // Track last activity (YYYY-MM-DD)
  total_spent_yesterday: 0           // Track yesterday's total spending
}
```

### 2. Spending Priority

**Order:** Bonus energy (oldest first, FIFO) → Real energy

**Logic:**
1. When user spends energy, check `bonus_history` entries sorted by `granted_date` ASC
2. Deduct from oldest non-expired bonus first
3. If bonus depleted, deduct from `tokens_gpt`
4. Update `remaining` in bonus_history entries
5. Remove fully spent bonus entries
6. Track spending for "last active" check

### 3. Expiration Logic

**Automatic Cleanup:**
- Run during daily cron job
- Check all `bonus_history` entries
- Remove entries where `expires_date < current_date`
- Update `bonus_tokens` total

**2-Year Expiration:**
- Set `expires_date = granted_date + 2 years`
- Users see expiring soon bonuses in balance display

### 4. Daily Award Eligibility

**NEW RULE:** Only grant daily bonus if user had ANY spending yesterday

**Implementation:**
```javascript
async function shouldGrantDailyBonus(userId) {
  const token = await tokensRepository.getTokenByUserId(userId);
  const yesterday = getYesterdayDate(); // "YYYY-MM-DD"

  // Check if user spent anything yesterday
  return token.last_spending_date === yesterday && token.total_spent_yesterday > 0;
}
```

**Daily Cron Updates:**
1. For each user:
   - Check `shouldGrantDailyBonus()`
   - If true AND `bonus_tokens + tokens_gpt < 30000`:
     - Calculate award (10,000 + referrals * 500)
     - Add to `bonus_history` with 2-year expiration
     - Update `bonus_tokens`
     - Send notification
   - Reset `total_spent_yesterday` to 0 for next cycle
2. Clean up expired bonuses

### 5. Referral Bonus Limits

**Current:** Unlimited daily bonus growth (10k + 500 per referral)

**NEW:** Keep current calculation, but:
- Bonus only granted if user was active yesterday
- This naturally limits abuse (inactive users don't get bonuses)
- Active users still benefit from referrals

### 6. Notification System

**When to Notify:**
- Daily bonus granted: "You received X energy! (Active user bonus)"
- Referral activated: "New referral confirmed! +5000 energy"
- Bonus expiring soon: "Warning: 1000 energy expires in 30 days"
- Balance increased from any source

**Implementation Points:**
- api-gateway: Track notification flags in referral service
- telegram-bot: MiddlewareAward already sends messages, extend it
- Add endpoint: `GET /notifications/{userId}` for pending notifications

### 7. Balance Display

**User sees:**
```
💰 Total Balance: 25,000 ⚡️
  ├─ Real Energy: 10,000 ⚡️
  ├─ Bonus Energy: 15,000 ⚡️
  └─ Expiring Soon (30d): 2,000 ⚡️

Daily Bonus: 11,000 ⚡️ (if active yesterday)
Next Grant: Tomorrow at 00:00 MSK
```

## Implementation Plan

### Phase 1: Database Migration (api-gateway)
1. **TokensRepository.js**
   - Add migration function to update existing tokens
   - Convert `tokens_gpt` to real energy
   - Initialize `bonus_tokens = 0`, `bonus_history = []`
   - Set `last_spending_date = today`, `total_spent_yesterday = 0`

2. **TokensService.js**
   - Update `isHasBalanceToken()` to check `tokens_gpt + bonus_tokens`
   - Keep backward compatibility during migration

### Phase 2: Spending Logic (api-gateway)
1. **CompletionsService.js**
   - Refactor `updateCompletionTokens()` to:
     - Accept operation "subtract" or "add"
     - For "subtract": Use FIFO bonus deduction
     - Track spending date and amount
     - Update `last_spending_date`, `total_spent_yesterday`
   - Update `updateCompletionTokensByModel()` to use new logic

2. **TokensRepository.js**
   - Add `spendEnergy(userId, amount)` method
   - Add `addBonusEnergy(userId, amount, source)` method
   - Add `cleanExpiredBonuses(userId)` method

### Phase 3: Daily Award Logic (api-gateway)
1. **ReferralService.js**
   - Update `runAwardUpdate()` cron:
     - Check spending activity before granting
     - Use new `addBonusEnergy()` method
     - Clean expired bonuses
     - Track notifications
   - Update `getTokensToUpdate()` to check activity

### Phase 4: Notification System (api-gateway + telegram-bot)
1. **api-gateway:** Add NotificationService
   - Store pending notifications
   - Endpoint: `GET /notifications/{userId}`
   - Mark as read after delivery

2. **telegram-bot:** Update MiddlewareAward.py
   - Poll notifications endpoint
   - Send balance increase messages
   - Show expiring bonus warnings

### Phase 5: Display Updates (telegram-bot)
1. **bot/balance/router.js** (JavaScript) or **bot/commands.py** (Python)
   - Update balance display command
   - Show real vs bonus breakdown
   - Show expiring bonuses
   - Show daily award status

### Phase 6: Testing
1. Unit tests for new repository methods
2. Integration tests for spending priority
3. Cron job simulation tests
4. Expiration cleanup tests
5. Daily activity check tests

## Migration Strategy

### Step 1: Deploy with Backward Compatibility
- New fields optional
- Old logic still works
- Gradual user data migration

### Step 2: Data Migration Script
```javascript
async function migrateUserTokens() {
  const allTokens = await tokensRepository.getAllTokens();

  for (const token of allTokens.tokens) {
    if (!token.bonus_tokens) {
      // Keep existing tokens_gpt as real energy
      token.bonus_tokens = 0;
      token.bonus_history = [];
      token.last_spending_date = getTodayDate();
      token.total_spent_yesterday = 0;

      await tokensRepository.updateTokenByUserId(token.user_id, token);
    }
  }
}
```

### Step 3: Enable New Logic
- Switch to new spending logic
- Enable activity checks
- Start tracking expiration

## API Changes

### New/Modified Endpoints

#### GET /token/{userId}
**Response:**
```json
{
  "id": "token-id",
  "user_id": "123",
  "tokens_gpt": 10000,
  "bonus_tokens": 5000,
  "total_balance": 15000,
  "bonus_expiring_soon": 1000,
  "bonus_history": [...]
}
```

#### POST /token/{userId}/spend
**Request:**
```json
{
  "amount": 150,
  "operation": "subtract"
}
```

#### GET /notifications/{userId}
**Response:**
```json
{
  "notifications": [
    {
      "type": "bonus_granted",
      "amount": 10500,
      "message": "Daily bonus received!",
      "timestamp": "2025-10-30T00:00:00Z"
    }
  ]
}
```

## Success Criteria

1. ✅ Bonus and real energy are tracked separately
2. ✅ Bonus energy expires after 2 years
3. ✅ Daily bonus only granted if user was active yesterday
4. ✅ Users receive notifications when balance increases
5. ✅ Spending uses bonus energy first (FIFO by grant date)
6. ✅ All existing users migrated without data loss
7. ✅ Tests cover all new functionality
8. ✅ Documentation updated

## Open Questions

1. **Grace Period:** Should there be a grace period for new users? (e.g., first 7 days get bonus regardless of activity)
2. **Spending Threshold:** What counts as "spending"? Any amount > 0, or minimum threshold?
3. **Notification Delivery:** Push notifications or poll-based?
4. **Admin Override:** Should admins be able to grant permanent energy?

## Files to Modify

### api-gateway repository
- `src/repositories/TokensRepository.js` - New fields, migration, spending logic
- `src/services/TokensService.js` - Update balance checks
- `src/services/CompletionsService.js` - Update spending to track activity
- `src/services/ReferralService.js` - Update daily cron, add activity check
- `src/controllers/tokensController.js` - New endpoints
- Add: `src/services/NotificationService.js` - New notification system
- Add: `src/repositories/NotificationRepository.js` - Store notifications
- Add: `migrations/add-bonus-tracking.js` - Migration script

### telegram-bot repository
- `bot/middlewares/MiddlewareAward.py` - Enhanced notifications
- `js/src/bot/middlewares/MiddlewareAward.js` - Enhanced notifications (JS version)
- `bot/balance/router.py` or `js/src/bot/balance/router.js` - Updated display
- `bot/commands.py` or `js/src/bot/commands.js` - Balance command updates
- `js/src/locales/en.yml`, `js/src/locales/ru.yml` - New messages

## Timeline Estimate

- Phase 1 (Migration): 2-3 hours
- Phase 2 (Spending): 3-4 hours
- Phase 3 (Daily Award): 2-3 hours
- Phase 4 (Notifications): 3-4 hours
- Phase 5 (Display): 2-3 hours
- Phase 6 (Testing): 4-5 hours
- **Total: ~20-25 hours**

## Notes

- This design maintains backward compatibility during migration
- The 2-year expiration is configurable via environment variable
- Activity tracking is simple: any spending counts as activity
- FIFO bonus spending ensures oldest bonuses are used first (encourages regular use)
