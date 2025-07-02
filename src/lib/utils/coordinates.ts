/**
 * Check if a shop has valid teleport coordinates (not 0,0,0)
 */
export function hasValidTeleportCoordinates(
  x?: number | null,
  y?: number | null,
  z?: number | null,
): boolean {
  return (
    x !== null &&
    y !== null &&
    z !== null &&
    x !== undefined &&
    y !== undefined &&
    z !== undefined &&
    !(x === 0 && y === 0 && z === 0)
  );
}

/**
 * Format location coordinates for display
 */
export function formatLocation(x?: number, y?: number, z?: number): string {
  if (x === undefined || y === undefined || z === undefined) {
    return "No location set";
  }
  return `${x}, ${y}, ${z}`;
}

/**
 * Calculate distance between two locations
 */
export function calculateDistance(
  pos1: { x?: number; y?: number; z?: number },
  pos2: { x?: number; y?: number; z?: number },
): number | null {
  if (
    pos1.x === undefined ||
    pos1.y === undefined ||
    pos1.z === undefined ||
    pos2.x === undefined ||
    pos2.y === undefined ||
    pos2.z === undefined
  ) {
    return null;
  }

  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const dz = pos1.z - pos2.z;

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
