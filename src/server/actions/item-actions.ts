"use server";

import { db } from "~/server/db";
import { z } from "zod";
import { readFile } from "fs/promises";
import { join } from "path";

// Schema for individual item validation
const itemSchema = z.object({
  id: z.string(),
  name_en: z.string(),
  name_de: z.string(),
  filename: z.string(),
});

// Schema for bulk import
const bulkImportSchema = z.array(itemSchema);

// Schema for search
const searchItemsSchema = z.object({
  query: z.string().min(1),
  language: z.enum(["en", "de"]).default("en"),
  limit: z.number().min(1).max(50).default(20),
});

/**
 * Bulk import items from JSON file
 */
export async function bulkImportItemsFromFile() {
  try {
    console.log("Starting bulk import of items...");

    // Read the JSON file
    const filePath = join(process.cwd(), "public", "items.json");
    const fileContent = await readFile(filePath, "utf-8");
    const jsonData = JSON.parse(fileContent) as unknown;

    // Validate the data
    const items = bulkImportSchema.parse(jsonData);
    console.log(`Found ${items.length} items to import`);

    // Import items in batches to avoid overwhelming the database
    const batchSize = 100;
    let importedCount = 0;
    let updatedCount = 0;

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      console.log(
        `Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(items.length / batchSize)}`,
      );

      const operations = batch.map(async (item) => {
        const result = await db.minecraftItem.upsert({
          where: { id: item.id },
          update: {
            nameEn: item.name_en,
            nameDe: item.name_de,
            filename: item.filename,
          },
          create: {
            id: item.id,
            nameEn: item.name_en,
            nameDe: item.name_de,
            filename: item.filename,
          },
        });

        // Check if it was created or updated
        const wasCreated =
          result.createdAt.getTime() === result.updatedAt.getTime();
        return wasCreated ? "created" : "updated";
      });

      const results = await Promise.all(operations);
      importedCount += results.filter((r) => r === "created").length;
      updatedCount += results.filter((r) => r === "updated").length;
    }

    console.log(
      `Import complete: ${importedCount} new items, ${updatedCount} updated items`,
    );
    return {
      success: true,
      imported: importedCount,
      updated: updatedCount,
      total: items.length,
    };
  } catch (error) {
    console.error("Bulk import error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to import items",
    };
  }
}

/**
 * Search items by name or ID
 */
export async function searchItems(params: z.infer<typeof searchItemsSchema>) {
  try {
    const { query, language, limit } = searchItemsSchema.parse(params);

    // PostgreSQL case-insensitive search
    const nameField = language === "en" ? "nameEn" : "nameDe";

    const items = await db.minecraftItem.findMany({
      where: {
        OR: [
          { [nameField]: { contains: query, mode: "insensitive" } },
          { id: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: [
        // Prioritize exact matches
        { [nameField]: "asc" },
        { id: "asc" },
      ],
      take: limit,
    });

    return { success: true, items };
  } catch (error) {
    console.error("Search error:", error);
    return { success: false, error: "Search failed", items: [] };
  }
}

/**
 * Get autocomplete suggestions for item search
 */
export async function getItemSuggestions(query: string, limit = 5) {
  if (query.length < 2) return [];

  try {
    const items = await db.minecraftItem.findMany({
      where: {
        OR: [
          { nameEn: { startsWith: query, mode: "insensitive" } },
          { nameDe: { startsWith: query, mode: "insensitive" } },
          { id: { startsWith: query, mode: "insensitive" } },
        ],
      },
      select: { id: true, nameEn: true, nameDe: true, filename: true },
      take: limit,
      orderBy: { nameEn: "asc" },
    });

    return items;
  } catch (error) {
    console.error("Get suggestions error:", error);
    return [];
  }
}

/**
 * Get a single item by ID
 */
export async function getItemById(itemId: string) {
  try {
    const item = await db.minecraftItem.findUnique({
      where: { id: itemId },
      include: {
        shopItems: {
          include: {
            shop: {
              include: {
                owner: { select: { mcUsername: true, id: true } },
              },
            },
          },
          where: { isAvailable: true },
          orderBy: { price: "asc" },
        },
      },
    });

    if (!item) {
      return { success: false, error: "Item not found" };
    }

    return { success: true, item };
  } catch (error) {
    console.error("Get item error:", error);
    return { success: false, error: "Failed to fetch item" };
  }
}

/**
 * Get items count for statistics
 */
export async function getItemsStats() {
  try {
    const total = await db.minecraftItem.count();
    const withShops = await db.minecraftItem.count({
      where: {
        shopItems: {
          some: { isAvailable: true },
        },
      },
    });

    return {
      success: true,
      stats: {
        total,
        availableInShops: withShops,
        withoutShops: total - withShops,
      },
    };
  } catch (error) {
    console.error("Get stats error:", error);
    return { success: false, error: "Failed to fetch statistics" };
  }
}
