# How to Apply Telegram Bot Translation

This guide explains how to apply the English translation changes to the telegram-bot repository.

## Quick Summary

The solution for issue #21 involves changing the default language in the telegram-bot's JavaScript implementation from Russian to English.

## Option 1: Apply the Patch File (Recommended)

If you have access to the telegram-bot repository:

```bash
# Navigate to your telegram-bot repository
cd /path/to/telegram-bot

# Apply the patch
git apply /path/to/telegram-bot-i18n.patch

# Or if you cloned this master-plan branch:
git apply ../master-plan/telegram-bot-i18n.patch

# Verify the changes
git diff js/src/i18n.js

# Commit the changes
git add js/src/i18n.js
git commit -m "Change default bot language from Russian to English

- Set default locale to 'en' instead of 'ru'
- Set fallback locale to 'en' instead of 'ru'
- Maintains auto-detection of user language from Telegram
- Russian users will still see Russian automatically

Implements translation requirement from deep-assistant/master-plan#21"

# Push to telegram-bot repository
git push
```

## Option 2: Manual Changes

If you prefer to make changes manually, edit `js/src/i18n.js` in the telegram-bot repository:

### Change 1: Update fallback locale
```javascript
// Line 34: Change from
if (locale !== 'ru') {
  const fallback = loadLocale('ru');

// To:
if (locale !== 'en') {
  const fallback = loadLocale('en');
```

### Change 2: Update default locale parameter
```javascript
// Line 48: Change from
export function createI18nMiddleware(defaultLocale = 'ru') {

// To:
export function createI18nMiddleware(defaultLocale = 'en') {
```

## What These Changes Do

1. **Default Language**: New users without a language preference see English
2. **Auto-detection**: Users with Telegram language set to Russian still see Russian
3. **Fallback**: If a translation is missing in any language, it falls back to English
4. **Extensibility**: Easy to add more languages by creating new `.yml` files

## Testing the Changes

After applying the patch:

```bash
# Navigate to JS bot directory
cd js

# Install dependencies
bun install

# Run the bot
bun src/__main__.js
```

### Manual Testing Checklist

- [ ] Start bot with English Telegram client → Should show English
- [ ] Start bot with Russian Telegram client → Should show Russian
- [ ] Test all commands: /start, /help, /balance, /buy, /referral
- [ ] Test error messages (insufficient balance, etc.)
- [ ] Test payment flow
- [ ] Test referral system
- [ ] Verify button labels are in correct language

## Files Modified

- `js/src/i18n.js` - Changed default locale from 'ru' to 'en'

## Files NOT Modified (No Changes Needed)

- `js/src/locales/en.yml` - Already contains complete English translations
- `js/src/locales/ru.yml` - Already contains complete Russian translations
- All router files - Use i18n system via `ctx.t()` calls

## Verification

To verify the patch applied correctly:

```bash
cd js/src
grep "defaultLocale = 'en'" i18n.js  # Should find the line
grep "locale !== 'en'" i18n.js       # Should find the line
```

Expected output:
```javascript
export function createI18nMiddleware(defaultLocale = 'en') {
    if (locale !== 'en') {
```

## Rollback (If Needed)

To revert these changes:

```bash
git checkout js/src/i18n.js
```

Or manually change `'en'` back to `'ru'` in both locations.

## Future Work

For Python bot translation (currently not implemented):
- See `TRANSLATION_SOLUTION.md` for detailed recommendations
- Estimated effort: 8-12 hours
- Requires creating i18n infrastructure similar to JS version

## Support

For questions or issues:
- Open an issue in [deep-assistant/master-plan](https://github.com/deep-assistant/master-plan/issues)
- Check community: @deepGPT on Telegram

---

**Related:**
- Solution Document: `TRANSLATION_SOLUTION.md`
- Patch File: `telegram-bot-i18n.patch`
- Issue: deep-assistant/master-plan#21
