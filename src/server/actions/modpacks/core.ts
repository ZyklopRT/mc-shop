"use server";

import { auth } from "~/server/auth";
import { db } from "~/server/db";
import {
  CreateModpackSchema,
  UpdateModpackSchema,
  type CreateModpackData,
  type UpdateModpackData,
  type ModpackInfo,
} from "~/lib/validations/modpack";

// Standard action result type
type ActionResult<T = null> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Create initial modpack record (before file processing)
 */
export async function createModpack(
  data: CreateModpackData,
): Promise<ActionResult<{ modpackId: string }>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Validate input
    const validatedData = CreateModpackSchema.parse(data);

    // Check for duplicate name/version combination
    const existingModpack = await db.modpack.findUnique({
      where: {
        name_version: {
          name: validatedData.name,
          version: validatedData.version,
        },
      },
    });

    if (existingModpack) {
      return {
        success: false,
        error: `Modpack "${validatedData.name}" version ${validatedData.version} already exists`,
      };
    }

    // Create modpack record (without file data initially)
    const modpack = await db.modpack.create({
      data: {
        ...validatedData,
        filePath: "", // Will be updated after file processing
        fileSize: 0,
        checksum: "",
        createdById: session.user.id,
      },
    });

    return {
      success: true,
      data: { modpackId: modpack.id },
    };
  } catch (error) {
    console.error("Error creating modpack:", error);
    return {
      success: false,
      error: "Failed to create modpack",
    };
  }
}

/**
 * Update modpack metadata
 */
export async function updateModpack(
  data: UpdateModpackData,
): Promise<ActionResult<ModpackInfo>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Validate input
    const validatedData = UpdateModpackSchema.parse(data);
    const { id, ...updateData } = validatedData;

    // Check if modpack exists and user has permission
    const existingModpack = await db.modpack.findUnique({
      where: { id },
      include: {
        createdBy: true,
      },
    });

    if (!existingModpack) {
      return {
        success: false,
        error: "Modpack not found",
      };
    }

    if (existingModpack.createdById !== session.user.id) {
      return {
        success: false,
        error: "You don't have permission to edit this modpack",
      };
    }

    // Update modpack
    const updatedModpack = await db.modpack.update({
      where: { id },
      data: updateData,
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
    });

    return {
      success: true,
      data: updatedModpack as ModpackInfo,
    };
  } catch (error) {
    console.error("Error updating modpack:", error);
    return {
      success: false,
      error: "Failed to update modpack",
    };
  }
}

/**
 * Delete a modpack and its associated files
 */
export async function deleteModpack(
  modpackId: string,
): Promise<ActionResult<null>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Check if modpack exists and user has permission
    const modpack = await db.modpack.findUnique({
      where: { id: modpackId },
      include: {
        createdBy: true,
      },
    });

    if (!modpack) {
      return {
        success: false,
        error: "Modpack not found",
      };
    }

    if (modpack.createdById !== session.user.id) {
      return {
        success: false,
        error: "You don't have permission to delete this modpack",
      };
    }

    // Delete file if it exists (will be implemented in Phase 2)
    // TODO: Add file deletion logic

    // Delete from database (cascade will handle related records)
    await db.modpack.delete({
      where: { id: modpackId },
    });

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("Error deleting modpack:", error);
    return {
      success: false,
      error: "Failed to delete modpack",
    };
  }
}
