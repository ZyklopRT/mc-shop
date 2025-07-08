import { type routing } from "~/lib/i18n/routing";
import type messages from "messages/en.json";

// Enables TypeScript augmentation for next-intl
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
