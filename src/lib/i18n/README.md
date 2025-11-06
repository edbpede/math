# I18n System Usage Guide

This document provides usage examples for the internationalization (i18n) system.

## Overview

The i18n system provides:
- **Translation loading** with caching for optimal performance
- **Interpolation support** for dynamic values using `{{variable}}` syntax
- **Fallback logic** (requested language → Danish)
- **Reactive state management** with Nanostores for cross-island synchronization
- **Locale-aware formatting** for numbers and dates
- **Context pools** for culturally appropriate exercise content

## Initialization

Initialize the i18n system once on app startup:

```typescript
import { initI18n } from '@/lib/i18n';

// In your main app initialization
await initI18n();
```

## Using Translations in Astro Pages

```astro
---
import { $t, $locale } from '@/lib/i18n';
import { useStore } from '@nanostores/solid';

// Get the current translation function
const t = $t.get();
---

<html lang={$locale.get()}>
  <head>
    <title>{t('app.title')}</title>
  </head>
  <body>
    <h1>{t('common.app.title')}</h1>
    <p>{t('auth.uuid.description')}</p>
  </body>
</html>
```

## Using Translations in SolidJS Islands

```tsx
import { useStore } from '@nanostores/solid';
import { $t, $locale, changeLocale } from '@/lib/i18n';

export function MyComponent() {
  const t = useStore($t);
  const locale = useStore($locale);

  return (
    <div>
      <h1>{t()('common.app.title')}</h1>
      <p>{t()('auth.login.subtitle')}</p>
      <p>Current locale: {locale()}</p>
    </div>
  );
}
```

## Interpolation

Use `{{variable}}` syntax in translation strings:

```json
// In translation file:
{
  "session": {
    "progress": "Exercise {{current}} of {{total}}"
  }
}
```

```typescript
// In code:
const message = t('exercises.session.progress', { current: 5, total: 20 });
// Result: "Exercise 5 of 20"
```

## Language Switching

```tsx
import { changeLocale } from '@/lib/i18n';

function LanguageSelector() {
  const handleLanguageChange = async (newLocale: 'da-DK' | 'en-US') => {
    await changeLocale(newLocale);
  };

  return (
    <div>
      <button onClick={() => handleLanguageChange('da-DK')}>Dansk</button>
      <button onClick={() => handleLanguageChange('en-US')}>English</button>
    </div>
  );
}
```

## Number Formatting

```typescript
import { formatNumber } from '@/lib/i18n';

// Danish: 1.234,56
// English: 1,234.56
const formatted = formatNumber(1234.56, { decimals: 2 });

// With custom options
const price = formatNumber(9.99, {
  locale: 'da-DK',
  decimals: 2,
  useGrouping: false
});
```

## Date Formatting

```typescript
import { formatDate } from '@/lib/i18n';

const date = new Date();

// Format with default locale
const formatted = formatDate(date, { dateStyle: 'medium' });

// Format with specific locale and style
const longFormat = formatDate(date, {
  locale: 'en-US',
  dateStyle: 'long',
  timeStyle: 'short'
});
```

## Context Pools

Get culturally appropriate content for exercises:

```typescript
import { getRandomContext, getRandomContexts } from '@/lib/i18n';

// Get a random name
const studentName = await getRandomContext('names');

// Get multiple random food items
const foodItems = await getRandomContexts('food', 3);
// Returns: ["æbler", "bananer", "kager"] (Danish)
// or: ["apples", "bananas", "cakes"] (English)

// Get items from other categories
const places = await getRandomContexts('places', 2);
const schoolItems = await getRandomContexts('school', 5);
```

## Translation File Structure

Translations are organized by category:

- **common.json** - General UI strings (buttons, status messages, labels)
- **auth.json** - Authentication-related strings (UUID, login, session)
- **navigation.json** - Navigation menu and routing
- **competencies.json** - Competency area names and descriptions
- **exercises.json** - Exercise session and practice strings
- **feedback.json** - Feedback messages (correct/incorrect answers)
- **hints.json** - Hint system strings and strategies
- **contexts.json** - Context pools (names, places, items, measurements)
- **errors.json** - Error messages

## Best Practices

1. **Always use translation keys** - Never hardcode strings in components
2. **Use descriptive keys** - `auth.login.title` is better than `text1`
3. **Provide context in comments** - Add comments in JSON for translators
4. **Keep translations in sync** - Ensure all locales have the same keys
5. **Use interpolation** - For dynamic content, use `{{variable}}` syntax
6. **Test both languages** - Always test UI in both Danish and English
7. **Cache awareness** - Translations are cached, use `changeLocale()` to switch

## Advanced: Custom Locale Detection

```typescript
import { detectBrowserLocale, getCurrentLocale } from '@/lib/i18n';

// Detect and use browser locale
const browserLocale = detectBrowserLocale();
console.log('Browser detected locale:', browserLocale);

// Get current active locale
const currentLocale = getCurrentLocale();
console.log('Current locale:', currentLocale);
```

## Troubleshooting

**Translation not found**
- Check the translation key exists in all locale files
- Verify the key path is correct (e.g., `common.actions.start`)
- Check browser console for warnings

**Interpolation not working**
- Ensure you're passing params object as second argument
- Verify variable names match in translation and code
- Check for typos in `{{variable}}` syntax

**Language not switching**
- Ensure you're calling `changeLocale()` await the promise
- Check that translations are loaded before rendering
- Verify Nanostore is properly integrated

## Example: Complete Component

```tsx
import { useStore } from '@nanostores/solid';
import { createSignal } from 'solid-js';
import { $t, $locale, changeLocale } from '@/lib/i18n';
import { formatNumber } from '@/lib/i18n';

export function ExerciseProgress() {
  const t = useStore($t);
  const locale = useStore($locale);
  const [current, setCurrent] = createSignal(5);
  const [total] = createSignal(20);
  const [score, setScore] = createSignal(85.5);

  const handleSwitchLanguage = async () => {
    const newLocale = locale() === 'da-DK' ? 'en-US' : 'da-DK';
    await changeLocale(newLocale);
  };

  return (
    <div>
      <h2>{t()('exercises.session.title')}</h2>
      <p>
        {t()('exercises.session.progress', {
          current: current(),
          total: total()
        })}
      </p>
      <p>
        Score: {formatNumber(score(), { decimals: 1 })}%
      </p>
      <button onClick={handleSwitchLanguage}>
        {locale() === 'da-DK' ? 'Switch to English' : 'Skift til dansk'}
      </button>
    </div>
  );
}
```
