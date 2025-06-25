/**
 * Utility functions for handling Minecraft item images
 */

export type TexturePack = "default" | "sphax";

/**
 * Generate the URL for an item image based on filename and texture pack
 */
export function getItemImageUrl(
  filename: string,
  pack: TexturePack = "default",
): string {
  return `/items/${pack}/${filename}`;
}

/**
 * Generate image URLs for both texture packs
 */
export function getItemImageUrls(filename: string) {
  return {
    default: getItemImageUrl(filename, "default"),
    sphax: getItemImageUrl(filename, "sphax"),
  };
}

/**
 * Get the fallback image URL if an item image is not found
 */
export function getFallbackItemImageUrl(): string {
  return "/items/default/minecraft__barrier.png"; // Generic fallback
}

/**
 * Check if an image URL is valid (basic check for extension)
 */
export function isValidImageUrl(url: string): boolean {
  const validExtensions = [".png", ".jpg", ".jpeg", ".webp"];
  return validExtensions.some((ext) => url.toLowerCase().endsWith(ext));
}
