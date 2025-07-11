import { getTranslations } from "next-intl/server";
import { type Metadata } from "next";

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment */
export async function generateSEOMetadata(
  locale: "en" | "de",
  pageKey: string,
  fallbackTitle = "MC Shop",
  fallbackDescription = "Minecraft Shop Administration Panel",
): Promise<Metadata> {
  try {
    const t = await getTranslations({
      locale,
      namespace: `seo.${pageKey}` as any,
    });

    return {
      // @ts-expect-error - Dynamic namespace requires type suppression
      title: t("title"),
      // @ts-expect-error - Dynamic namespace requires type suppression
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
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment */

export type SEOPageKeys =
  | "homepage"
  | "shops"
  | "browse"
  | "requests"
  | "admin";
