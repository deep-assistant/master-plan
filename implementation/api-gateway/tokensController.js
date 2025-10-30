/**
 * Updated tokensController - Add new endpoints for balance details
 * File: api-gateway/src/controllers/tokensController.js
 *
 * NEW ENDPOINTS:
 * 1. GET /token/:userId/details - Get detailed balance breakdown
 * 2. POST /token/migrate - Run migration (admin only)
 */

// Add these new endpoint handlers to the existing tokensController

// NEW: Get detailed balance with bonus/real split
export async function getTokenDetails(req, res) {
  try {
    const { userId } = req.params;

    // Get detailed balance information
    const details = await tokensService.getBalanceDetails(userId);

    res.json({
      success: true,
      data: details
    });
  } catch (error) {
    console.error('Error getting token details:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// NEW: Migration endpoint (admin only)
export async function migrateTokens(req, res) {
  try {
    // Validate admin token
    const masterToken = req.query.masterToken || req.body.masterToken;
    await tokensService.isValidMasterToken(masterToken);

    // Run migration
    const result = await tokensRepository.migrateToNewStructure();

    res.json({
      success: true,
      message: `Migration complete: ${result.migrated} tokens updated`,
      data: result
    });
  } catch (error) {
    console.error('Error running migration:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// NEW: Clean expired bonuses for a user (admin or user themselves)
export async function cleanExpiredBonuses(req, res) {
  try {
    const { userId } = req.params;

    const result = await tokensRepository.cleanExpiredBonuses(userId);

    res.json({
      success: true,
      message: `Cleaned ${result.cleaned} expired bonuses`,
      data: result
    });
  } catch (error) {
    console.error('Error cleaning expired bonuses:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/**
 * Example route definitions (add to your router):
 *
 * router.get('/token/:userId/details', getTokenDetails);
 * router.post('/token/migrate', migrateTokens);
 * router.post('/token/:userId/clean-expired', cleanExpiredBonuses);
 *
 * Example API calls:
 *
 * // Get detailed balance
 * GET /token/123456789/details
 * Response: {
 *   "success": true,
 *   "data": {
 *     "user_id": "123456789",
 *     "real_tokens": 10000,
 *     "bonus_tokens": 5000,
 *     "total_balance": 15000,
 *     "expiring_soon": 1000,
 *     "bonus_history": [...],
 *     "last_spending_date": "2025-10-30"
 *   }
 * }
 *
 * // Run migration
 * POST /token/migrate?masterToken=YOUR_ADMIN_TOKEN
 * Response: {
 *   "success": true,
 *   "message": "Migration complete: 42 tokens updated",
 *   "data": { "migrated": 42 }
 * }
 */
