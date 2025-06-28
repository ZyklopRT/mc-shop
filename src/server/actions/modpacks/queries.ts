"use server";

import { db } from "~/server/db";
import {
  ModpackSearchSchema,
  type ModpackSearchData,
  type ModpackInfo,
  type ModpackWithMods,
  type ModpackListResponse,
} from "~/lib/validations/modpack";

// Standard action result type
type ActionResult<T = null> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Storage configuration (ready for Phase 2 file processing)
// const MODPACK_STORAGE_PATH = process.env.MODPACK_STORAGE_PATH ?? "/data/modpacks";

/**
 * Get list of modpacks with filtering and pagination
 */
export async function getModpacks(
  params: Partial<ModpackSearchData> = {},
): Promise<ActionResult<ModpackListResponse>> {
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

    // Build where clause
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

    // Get modpacks with creator info and mod count
    const [modpacks, totalCount] = await Promise.all([
      db.modpack.findMany({
        where,
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
        orderBy: [{ isFeatured: "desc" }, { releaseDate: "desc" }],
        take: limit,
        skip: offset,
      }),
      db.modpack.count({ where }),
    ]);

    const hasMore = offset + limit < totalCount;

    return {
      success: true,
      data: {
        modpacks: modpacks as ModpackInfo[],
        totalCount,
        hasMore,
      },
    };
  } catch (error) {
    console.error("Error fetching modpacks:", error);
    return {
      success: false,
      error: "Failed to fetch modpacks",
    };
  }
}

/**
 * Get a single modpack by ID with full details
 */
export async function getModpackById(
  id: string,
): Promise<ActionResult<ModpackWithMods>> {
  try {
    const modpack = await db.modpack.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            mcUsername: true,
          },
        },
        mods: {
          orderBy: {
            name: "asc",
          },
        },
        _count: {
          select: {
            mods: true,
            downloads: true,
          },
        },
      },
    });

    if (!modpack) {
      return {
        success: false,
        error: "Modpack not found",
      };
    }

    return {
      success: true,
      data: modpack as ModpackWithMods,
    };
  } catch (error) {
    console.error("Error fetching modpack:", error);
    return {
      success: false,
      error: "Failed to fetch modpack",
    };
  }
}

/**
 * Get featured modpacks for homepage
 */
export async function getFeaturedModpacks(): Promise<
  ActionResult<ModpackInfo[]>
> {
  try {
    const featuredModpacks = await db.modpack.findMany({
      where: {
        isFeatured: true,
        isActive: true,
        isPublic: true,
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
      orderBy: {
        releaseDate: "desc",
      },
      take: 6, // Limit to 6 featured modpacks
    });

    return {
      success: true,
      data: featuredModpacks as ModpackInfo[],
    };
  } catch (error) {
    console.error("Error fetching featured modpacks:", error);
    return {
      success: false,
      error: "Failed to fetch featured modpacks",
    };
  }
}
