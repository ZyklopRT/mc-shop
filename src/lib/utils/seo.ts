import { getTranslations } from "next-intl/server";
import { type Metadata } from "next";

export async function generateSEOMetadata(
  locale: string,
  pageKey: string,
  fallbackTitle = "MC Shop",
  fallbackDescription = "Minecraft Shop Administration Panel",
): Promise<Metadata> {
  try {
    const t = await getTranslations({ locale, namespace: `seo.${pageKey}` });

    return {
      title: t("title"),
      description: t("description"),
    };
  } catch {
    // Fallback if translation doesn't exist
    return {
      title: fallbackTitle,
      description: fallbackDescription,
    };
  }
}

export type SEOPageKeys =
  | "homepage"
  | "shops"
  | "browse"
  | "requests"
  | "admin";
