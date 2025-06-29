"use server";

import { db } from "~/server/db";
import {
  ModpackSearchSchema,
  type ModpackSearchData,
  type ModpackInfo,
  type ModpackGroup,
  type ModpackGroupList,
} from "~/lib/validations/modpack";

// Standard action result type
type ActionResult<T = null> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Get modpacks grouped by name with version information
 */
export async function getModpackGroups(
  params: Partial<ModpackSearchData> = {},
): Promise<ActionResult<ModpackGroupList>> {
  try {
    const validatedParams = ModpackSearchSchema.parse(params);
    const {
      query,
      modLoader,
      minecraftVersion,
      isActive,
      isFeatured,
      isPublic,
      limit = 20,
      offset = 0,
    } = validatedParams;

    // Build where clause for filtering
    const where: Record<string, unknown> = {};
    if (query) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ];
    }
    if (modLoader) where.modLoader = modLoader;
    if (minecraftVersion) where.minecraftVersion = minecraftVersion;
    if (isActive !== undefined) where.isActive = isActive;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (isPublic !== undefined) where.isPublic = isPublic;

    // Get distinct modpack names first
    const distinctNames = await db.modpack.findMany({
      where,
      select: { name: true },
      distinct: ["name"],
      orderBy: { name: "asc" },
      take: limit,
      skip: offset,
    });

    const totalDistinctCount = await db.modpack.groupBy({
      by: ["name"],
      where,
      _count: { name: true },
    });

    // For each distinct name, get all versions
    const modpackGroups: ModpackGroup[] = [];

    for (const { name } of distinctNames) {
      const versions = await db.modpack.findMany({
        where: {
          ...where,
          name,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              mcUsername: true,
            },
          },
          _count: {
            select: {
              mods: true,
            },
          },
        },
        orderBy: { releaseDate: "desc" },
      });

      if (versions.length === 0) continue;

      const latestVersion = versions[0]!;
      const totalDownloads = versions.reduce(
        (sum, v) => sum + v.downloadCount,
        0,
      );
      const anyActive = versions.some((v) => v.isActive);
      const anyFeatured = versions.some((v) => v.isFeatured);
      const anyPublic = versions.some((v) => v.isPublic);

      modpackGroups.push({
        name,
        description: latestVersion.description,
        totalVersions: versions.length,
        latestVersion: latestVersion as ModpackInfo,
        allVersions: versions as ModpackInfo[],
        totalDownloads,
        isActive: anyActive,
        isFeatured: anyFeatured,
        isPublic: anyPublic,
      });
    }

    return {
      success: true,
      data: {
        modpackGroups,
        totalCount: totalDistinctCount.length,
        hasMore: offset + limit < totalDistinctCount.length,
      },
    };
  } catch (error) {
    console.error("Error fetching modpack groups:", error);
    return {
      success: false,
      error: "Failed to fetch modpack groups",
    };
  }
}

/**
 * Get all versions of a specific modpack by name
 */
export async function getModpackVersions(
  name: string,
): Promise<ActionResult<ModpackInfo[]>> {
  try {
    const versions = await db.modpack.findMany({
      where: { name },
      include: {
        createdBy: {
          select: {
            id: true,
            mcUsername: true,
          },
        },
        _count: {
          select: {
            mods: true,
          },
        },
      },
      orderBy: { releaseDate: "desc" },
    });

    return {
      success: true,
      data: versions as ModpackInfo[],
    };
  } catch (error) {
    console.error("Error fetching modpack versions:", error);
    return {
      success: false,
      error: "Failed to fetch modpack versions",
    };
  }
}

/**
 * Get existing modpack names for autocomplete/selection
 */
export async function getExistingModpackNames(): Promise<
  ActionResult<string[]>
> {
  try {
    const names = await db.modpack.findMany({
      select: { name: true },
      distinct: ["name"],
      orderBy: { name: "asc" },
    });

    return {
      success: true,
      data: names.map((n) => n.name),
    };
  } catch (error) {
    console.error("Error fetching modpack names:", error);
    return {
      success: false,
      error: "Failed to fetch modpack names",
    };
  }
}

/**
 * Get latest version info for a modpack name
 */
export async function getLatestModpackVersion(
  name: string,
): Promise<ActionResult<ModpackInfo>> {
  try {
    const latestVersion = await db.modpack.findFirst({
      where: { name },
      include: {
        createdBy: {
          select: {
            id: true,
            mcUsername: true,
          },
        },
        _count: {
          select: {
            mods: true,
          },
        },
      },
      orderBy: { releaseDate: "desc" },
    });

    if (!latestVersion) {
      return {
        success: false,
        error: "Modpack not found",
      };
    }

    return {
      success: true,
      data: latestVersion as ModpackInfo,
    };
  } catch (error) {
    console.error("Error fetching latest modpack version:", error);
    return {
      success: false,
      error: "Failed to fetch latest modpack version",
    };
  }
}

/**
 * Suggest next version number based on existing versions
 */
export async function suggestNextVersion(
  name: string,
): Promise<ActionResult<string>> {
  try {
    const versions = await db.modpack.findMany({
      where: { name },
      select: { version: true },
      orderBy: { releaseDate: "desc" },
    });

    if (versions.length === 0) {
      return {
        success: true,
        data: "1.0.0",
      };
    }

    // Simple version increment logic
    const latestVersion = versions[0]!.version;
    const versionParts = latestVersion.split(".");

    if (versionParts.length >= 3) {
      // Increment patch version
      const patch = parseInt(versionParts[2]!) + 1;
      const nextVersion = `${versionParts[0]}.${versionParts[1]}.${patch}`;
      return {
        success: true,
        data: nextVersion,
      };
    } else if (versionParts.length === 2) {
      // Add patch version
      const nextVersion = `${latestVersion}.1`;
      return {
        success: true,
        data: nextVersion,
      };
    } else {
      // Simple increment
      const nextVersion = latestVersion + ".1";
      return {
        success: true,
        data: nextVersion,
      };
    }
  } catch (error) {
    console.error("Error suggesting next version:", error);
    return {
      success: false,
      error: "Failed to suggest next version",
    };
  }
}
