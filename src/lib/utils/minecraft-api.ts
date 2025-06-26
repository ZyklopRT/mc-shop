/**
 * Minecraft API utilities for getting player avatars
 * Client-safe version that uses stored UUIDs from database
 */

/**
 * Get Minecraft player avatar URL from username or UUID
 * Client-safe version that doesn't make external API calls
 */
export function getMinecraftAvatarUrl(
  identifier: string, // Can be username or UUID
  size = 32,
  includeOverlay = true,
): string {
  const params = new URLSearchParams({
    size: size.toString(),
    default: "MHF_Steve",
  });

  if (includeOverlay) {
    params.append("overlay", "");
  }

  return `https://crafatar.com/avatars/${identifier}?${params.toString()}`;
}
