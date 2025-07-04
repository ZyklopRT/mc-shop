# Internationalization (i18n) Setup

This project uses `next-intl` for internationalization with support for English (en) and German (de) locales.

## Overview

The internationalization setup includes:

- Locale-based routing (`/en/`, `/de/`)
- SEO metadata from translation files
- Automatic locale detection and fallbacks
- Locale switching component
- Translation hooks for components

## File Structure

```
src/
├── lib/i18n/
│   ├── config.ts          # i18n configuration
│   └── routing.ts         # Routing configuration with navigation helpers
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx     # Locale-specific layout with SEO
│   │   └── page.tsx       # Localized homepage
│   ├── layout.tsx         # Root layout
│   ├── page.tsx          # Root page (redirects to default locale)
│   └── not-found.tsx     # 404 handler
├── components/
│   ├── locale-selector.tsx # Language switcher component
│   └── navigation.tsx     # Internationalized navigation
└── messages/
    ├── en.json           # English translations
    └── de.json           # German translations
```

## Translation Files

Translation files are located in `/messages/` and contain:

### SEO Metadata Structure

```json
{
  "seo": {
    "homepage": {
      "title": "Page Title",
      "description": "Page Description"
    },
    "shops": { ... },
    "browse": { ... },
    "requests": { ... },
    "admin": { ... }
  }
}
```

### Navigation and UI Text

```json
{
  "navigation": {
    "browseShops": "Browse Shops",
    "requestBoard": "Request Board",
    "myShops": "My Shops",
    "admin": "Admin",
    "signIn": "Sign In",
    "signOut": "Sign Out",
    "register": "Register",
    "welcome": "Welcome, {username}",
    "administrator": "Administrator",
    "user": "User"
  },
  "homepage": {
    "title": "MC Shop",
    "subtitle": "Search for players and items across Minecraft shops",
    "heroAlt": "Minecraft landscape background"
  }
}
```

## Usage

### Using Translations in Components

```tsx
import { useTranslations } from "next-intl";

export function MyComponent() {
  const t = useTranslations("namespace");

  return (
    <div>
      <h1>{t("title")}</h1>
      <p>{t("welcome", { username: "John" })}</p>
    </div>
  );
}
```

### Locale Selector Best Practices

```tsx
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "~/lib/i18n/routing";
import { useTransition } from "react";

export function LocaleSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = (locale: string) => {
    // Prevent unnecessary navigation if same locale
    if (locale === currentLocale) return;

    startTransition(() => {
      // Use router.replace to stay on the same page
      router.replace(pathname, { locale });
    });
  };

  return (
    <Select
      value={currentLocale}
      onValueChange={handleLocaleChange}
      disabled={isPending}
    >
      {/* Select content */}
    </Select>
  );
}
```

### Generating SEO Metadata

```tsx
import { generateSEOMetadata } from "~/lib/utils/seo";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata(locale, "homepage");
}
```

### Navigation with Locale Support

```tsx
import { Link } from "~/lib/i18n/routing";

export function MyComponent() {
  return <Link href="/shops">My Shops</Link>;
}
```

### Programmatic Navigation

```tsx
import { useRouter, usePathname } from "~/lib/i18n/routing";
import { useLocale } from "next-intl";

export function MyComponent() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  const handleClick = () => {
    router.push("/shops");
  };

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };
}
```

## Adding New Pages

1. Create the page in `src/app/[locale]/your-page/page.tsx`
2. Add SEO metadata to translation files under `seo.yourPage`
3. Use the `generateSEOMetadata` utility for metadata generation
4. Use `useTranslations` for page content

Example:

```tsx
// src/app/[locale]/shops/page.tsx
import { generateSEOMetadata } from "~/lib/utils/seo";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata(locale, "shops");
}

export default function ShopsPage() {
  const t = useTranslations("shops");
  return <h1>{t("title")}</h1>;
}
```

## Adding New Locales

1. Add the locale to `src/lib/i18n/routing.ts`
2. Create a new translation file in `/messages/[locale].json`
3. Update the `LocaleSelector` component to include the new locale

## SEO Benefits

- Locale-specific metadata from translation files
- Proper hreflang implementation (via next-intl)
- Search engine friendly URLs (`/en/page`, `/de/page`)
- Automatic locale detection and redirects

## Development

- Translations are hot-reloaded in development
- Missing translations will show the key in development
- The locale selector shows current language and allows switching
- Middleware handles authentication across locales

## Middleware Integration

The middleware handles both authentication and internationalization:

- Locale detection and redirects
- Authentication checks work across locales
- Preserves locale in auth redirects

## Best Practices

1. **Always use the routing helpers from `~/lib/i18n/routing`**
2. **Keep translation keys descriptive and nested logically**
3. **Use interpolation for dynamic content**
4. **Test both locales when developing features**
5. **Update both translation files when adding new text**
6. **Use `useLocale()` instead of `useParams()` for current locale**
7. **Use `router.replace()` instead of `router.push()` for locale switching**
8. **Add transition guards to prevent unnecessary navigation**
9. **Use `startTransition()` for better UX during locale changes**
10. **Always import navigation hooks from `~/lib/i18n/routing`**
