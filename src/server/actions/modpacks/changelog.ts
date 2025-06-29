"use server";

import { auth } from "~/server/auth";
import { db } from "~/server/db";
import {
  type ChangelogData,
  type ChangelogEntry,
  VersionComparisonSchema,
  type VersionComparisonData,
} from "~/lib/validations/modpack";
import { ChangeType, ChangeImpact } from "@prisma/client";

// Standard action result type
type ActionResult<T = null> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Compare two modpack versions and generate changelog
 */
export async function compareModpackVersions(
  data: VersionComparisonData,
): Promise<ActionResult<ChangelogData>> {
  try {
    const validatedData = VersionComparisonSchema.parse(data);
    const { version1, version2, modpackName } = validatedData;

    // Get both versions with their mods
    const [modpack1, modpack2] = await Promise.all([
      db.modpack.findUnique({
        where: {
          name_version: {
            name: modpackName,
            version: version1,
          },
        },
        include: {
          mods: true,
        },
      }),
      db.modpack.findUnique({
        where: {
          name_version: {
            name: modpackName,
            version: version2,
          },
        },
        include: {
          mods: true,
        },
      }),
    ]);

    if (!modpack1 || !modpack2) {
      return {
        success: false,
        error: "One or both modpack versions not found",
      };
    }

    // Generate changelog by comparing mods
    const changelog = await generateChangelogFromMods(
      modpack1.mods,
      modpack2.mods,
      modpack2.id,
    );

    return {
      success: true,
      data: changelog,
    };
  } catch (error) {
    console.error("Error comparing modpack versions:", error);
    return {
      success: false,
      error: "Failed to compare modpack versions",
    };
  }
}

/**
 * Generate changelog for the latest version of a modpack
 * Compares with the previous version
 */
export async function generateChangelog(
  modpackId: string,
): Promise<ActionResult<ChangelogData>> {
  try {
    // Get the current modpack
    const currentModpack = await db.modpack.findUnique({
      where: { id: modpackId },
      include: {
        mods: true,
      },
    });

    if (!currentModpack) {
      return {
        success: false,
        error: "Modpack not found",
      };
    }

    // Get the previous version (by release date)
    const previousModpack = await db.modpack.findFirst({
      where: {
        name: currentModpack.name,
        releaseDate: {
          lt: currentModpack.releaseDate,
        },
      },
      include: {
        mods: true,
      },
      orderBy: {
        releaseDate: "desc",
      },
    });

    // If no previous version, everything is new
    if (!previousModpack) {
      const changelog = await generateNewModpackChangelog(
        currentModpack.mods,
        modpackId,
      );
      return {
        success: true,
        data: changelog,
      };
    }

    // Generate changelog by comparing with previous version
    const changelog = await generateChangelogFromMods(
      previousModpack.mods,
      currentModpack.mods,
      modpackId,
    );

    return {
      success: true,
      data: changelog,
    };
  } catch (error) {
    console.error("Error generating changelog:", error);
    return {
      success: false,
      error: "Failed to generate changelog",
    };
  }
}

/**
 * Get existing changelog for a modpack (if stored)
 */
export async function getModpackChangelog(
  modpackId: string,
): Promise<ActionResult<ChangelogData>> {
  try {
    const changelogs = await db.modpackChangelog.findMany({
      where: { modpackId },
      orderBy: [{ changeType: "asc" }, { modName: "asc" }],
    });

    // Convert to ChangelogData format
    const changes: ChangelogEntry[] = changelogs.map((log) => ({
      id: log.id,
      changeType: log.changeType,
      modId: log.modId,
      modName: log.modName,
      oldVersion: log.oldVersion,
      newVersion: log.newVersion,
      description: log.description,
      impact: log.impact,
    }));

    const summary = {
      added: changes.filter((c) => c.changeType === ChangeType.ADDED).length,
      updated: changes.filter((c) => c.changeType === ChangeType.UPDATED)
        .length,
      removed: changes.filter((c) => c.changeType === ChangeType.REMOVED)
        .length,
      unchanged: changes.filter((c) => c.changeType === ChangeType.UNCHANGED)
        .length,
    };

    return {
      success: true,
      data: {
        changes,
        summary,
      },
    };
  } catch (error) {
    console.error("Error fetching changelog:", error);
    return {
      success: false,
      error: "Failed to fetch changelog",
    };
  }
}

/**
 * Force regenerate and store changelog for a modpack
 */
export async function regenerateAndStoreChangelog(
  modpackId: string,
): Promise<ActionResult<ChangelogData>> {
  try {
    // Check authentication and admin status
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const userResult = await db.$queryRaw<[{ isAdmin: boolean }]>`
      SELECT "isAdmin" FROM "User" WHERE id = ${session.user.id}
    `;
    const isAdmin = userResult[0]?.isAdmin ?? false;

    if (!isAdmin) {
      return {
        success: false,
        error: "Admin access required",
      };
    }

    // Generate the changelog
    const changelogResult = await generateChangelog(modpackId);
    if (!changelogResult.success || !changelogResult.data) {
      return changelogResult;
    }

    // Store in database (delete existing first)
    await db.$transaction(async (tx) => {
      // Delete existing changelog entries
      await tx.modpackChangelog.deleteMany({
        where: { modpackId },
      });

      // Insert new changelog entries
      await tx.modpackChangelog.createMany({
        data: changelogResult.data!.changes.map((change) => ({
          modpackId,
          changeType: change.changeType,
          modId: change.modId,
          modName: change.modName,
          oldVersion: change.oldVersion,
          newVersion: change.newVersion,
          description: change.description,
          impact: change.impact,
        })),
      });
    });

    return changelogResult;
  } catch (error) {
    console.error("Error regenerating changelog:", error);
    return {
      success: false,
      error: "Failed to regenerate changelog",
    };
  }
}

// Helper Functions

/**
 * Generate changelog by comparing two sets of mods
 */
async function generateChangelogFromMods(
  oldMods: Array<{
    modId: string;
    name: string;
    version: string;
    displayName?: string | null;
  }>,
  newMods: Array<{
    modId: string;
    name: string;
    version: string;
    displayName?: string | null;
  }>,
  modpackId: string,
): Promise<ChangelogData> {
  const changes: ChangelogEntry[] = [];

  // Create maps for easier lookup
  const oldModsMap = new Map(oldMods.map((mod) => [mod.modId, mod]));
  const newModsMap = new Map(newMods.map((mod) => [mod.modId, mod]));

  // Find added mods
  for (const newMod of newMods) {
    if (!oldModsMap.has(newMod.modId)) {
      changes.push({
        id: `${modpackId}-${newMod.modId}-added`,
        changeType: ChangeType.ADDED,
        modId: newMod.modId,
        modName: newMod.displayName ?? newMod.name,
        oldVersion: null,
        newVersion: newMod.version,
        description: `Added ${newMod.displayName ?? newMod.name}`,
        impact: ChangeImpact.PATCH, // Set to PATCH so impact badge doesn't show
      });
    }
  }

  // Find updated and unchanged mods
  for (const oldMod of oldMods) {
    const newMod = newModsMap.get(oldMod.modId);

    if (newMod) {
      if (oldMod.version !== newMod.version) {
        // Mod was updated
        const impact = determineVersionImpact(oldMod.version, newMod.version);
        changes.push({
          id: `${modpackId}-${oldMod.modId}-updated`,
          changeType: ChangeType.UPDATED,
          modId: oldMod.modId,
          modName: newMod.displayName ?? newMod.name,
          oldVersion: oldMod.version,
          newVersion: newMod.version,
          description: `Updated ${newMod.displayName ?? newMod.name} from ${oldMod.version} to ${newMod.version}`,
          impact,
        });
      } else {
        // Mod is unchanged
        changes.push({
          id: `${modpackId}-${oldMod.modId}-unchanged`,
          changeType: ChangeType.UNCHANGED,
          modId: oldMod.modId,
          modName: newMod.displayName ?? newMod.name,
          oldVersion: oldMod.version,
          newVersion: newMod.version,
          description: null,
          impact: ChangeImpact.PATCH,
        });
      }
    }
  }

  // Find removed mods
  for (const oldMod of oldMods) {
    if (!newModsMap.has(oldMod.modId)) {
      changes.push({
        id: `${modpackId}-${oldMod.modId}-removed`,
        changeType: ChangeType.REMOVED,
        modId: oldMod.modId,
        modName: oldMod.displayName ?? oldMod.name,
        oldVersion: oldMod.version,
        newVersion: null,
        description: `Removed ${oldMod.displayName ?? oldMod.name}`,
        impact: ChangeImpact.MAJOR,
      });
    }
  }

  // Sort changes by type priority and name
  changes.sort((a, b) => {
    const typePriority = {
      [ChangeType.ADDED]: 1,
      [ChangeType.UPDATED]: 2,
      [ChangeType.REMOVED]: 3,
      [ChangeType.UNCHANGED]: 4,
    };

    if (typePriority[a.changeType] !== typePriority[b.changeType]) {
      return typePriority[a.changeType] - typePriority[b.changeType];
    }

    return a.modName.localeCompare(b.modName);
  });

  // Generate summary
  const summary = {
    added: changes.filter((c) => c.changeType === ChangeType.ADDED).length,
    updated: changes.filter((c) => c.changeType === ChangeType.UPDATED).length,
    removed: changes.filter((c) => c.changeType === ChangeType.REMOVED).length,
    unchanged: changes.filter((c) => c.changeType === ChangeType.UNCHANGED)
      .length,
  };

  return {
    changes,
    summary,
  };
}

/**
 * Generate changelog for a brand new modpack (first version)
 */
async function generateNewModpackChangelog(
  mods: Array<{
    modId: string;
    name: string;
    version: string;
    displayName?: string | null;
  }>,
  modpackId: string,
): Promise<ChangelogData> {
  const changes: ChangelogEntry[] = mods.map((mod) => ({
    id: `${modpackId}-${mod.modId}-added`,
    changeType: ChangeType.ADDED,
    modId: mod.modId,
    modName: mod.displayName ?? mod.name,
    oldVersion: null,
    newVersion: mod.version,
    description: `Added ${mod.displayName ?? mod.name}`,
    impact: ChangeImpact.PATCH, // Set to PATCH so impact badge doesn't show
  }));

  // Sort by mod name
  changes.sort((a, b) => a.modName.localeCompare(b.modName));

  const summary = {
    added: changes.length,
    updated: 0,
    removed: 0,
    unchanged: 0,
  };

  return {
    changes,
    summary,
  };
}

/**
 * Determine the impact of a version change
 */
function determineVersionImpact(
  oldVersion: string,
  newVersion: string,
): ChangeImpact {
  // Try to parse semantic versioning
  const oldParts = oldVersion.split(".").map((p) => parseInt(p, 10));
  const newParts = newVersion.split(".").map((p) => parseInt(p, 10));

  // If we can't parse as numbers, default to minor
  if (oldParts.some(isNaN) || newParts.some(isNaN)) {
    return ChangeImpact.MINOR;
  }

  // Major version change
  if (oldParts[0] !== newParts[0]) {
    return ChangeImpact.MAJOR;
  }

  // Minor version change
  if (oldParts[1] !== newParts[1]) {
    return ChangeImpact.MINOR;
  }

  // Patch version change (or no recognizable change)
  return ChangeImpact.PATCH;
}
