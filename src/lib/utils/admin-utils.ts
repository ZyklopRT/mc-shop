import { auth } from "~/server/auth";
import { db } from "~/server/db";

/**
 * Check if the current user is authenticated
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Authentication required");
  }
  return session.user;
}

/**
 * Check if the current user is an admin
 * Uses direct database query to work around type issues
 */
export async function requireAdmin() {
  const user = await requireAuth();

  // Use direct query to check admin status
  const result = await db.$queryRaw<[{ isAdmin: boolean }]>`
    SELECT "isAdmin" FROM "User" WHERE id = ${user.id}
  `;

  if (!result[0]?.isAdmin) {
    throw new Error("Admin privileges required");
  }

  return user;
}

/**
 * Check if a user is admin (for use in components)
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const result = await db.$queryRaw<[{ isAdmin: boolean }]>`
      SELECT "isAdmin" FROM "User" WHERE id = ${userId}
    `;

    return result[0]?.isAdmin ?? false;
  } catch {
    return false;
  }
}
