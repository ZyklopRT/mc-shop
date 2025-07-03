import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { importItemsSchema, type ImportItem } from "~/lib/validations/admin";
import AdmZip from "adm-zip";
import { promises as fs } from "fs";
import path from "path";

// Configuration for file uploads
export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for large files

// Schema for individual item validation during batch processing
const batchItemSchema = z.object({
  id: z.string().min(1, "Item ID is required"),
  name_en: z.string().min(1, "English name is required"),
  name_de: z.string().min(1, "German name is required"),
  filename: z.string().min(1, "Filename is required"),
});

type ImportResult = {
  success: boolean;
  message?: string;
  imported?: number;
  updated?: number;
  total?: number;
  errors?: string[];
};

type ProcessedFiles = {
  itemsJson: ImportItem[];
  defaultImages: Map<string, Buffer>;
  sphaxImages: Map<string, Buffer>;
};

// Helper function to ensure directory exists
async function ensureDirectoryExists(dirPath: string) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

// Helper function to validate and extract ZIP contents
async function extractZipContents(zipBuffer: Buffer): Promise<ProcessedFiles> {
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();

  let itemsJsonEntry: AdmZip.IZipEntry | null = null;
  const defaultImages = new Map<string, Buffer>();
  const sphaxImages = new Map<string, Buffer>();

  // Process all entries
  for (const entry of entries) {
    const entryName = entry.entryName;

    // Check for items.json
    if (entryName === "items.json" || entryName.endsWith("/items.json")) {
      itemsJsonEntry = entry;
      continue;
    }

    // Check for images in default folder
    if (entryName.includes("images/default/") && entryName.endsWith(".png")) {
      const filename = path.basename(entryName);
      if (filename && !entry.isDirectory) {
        const imageBuffer = entry.getData();
        defaultImages.set(filename, imageBuffer);
      }
      continue;
    }

    // Check for images in sphax folder
    if (entryName.includes("images/sphax/") && entryName.endsWith(".png")) {
      const filename = path.basename(entryName);
      if (filename && !entry.isDirectory) {
        const imageBuffer = entry.getData();
        sphaxImages.set(filename, imageBuffer);
      }
      continue;
    }
  }

  if (!itemsJsonEntry) {
    throw new Error(
      "items.json file not found in ZIP. Please ensure your ZIP contains an items.json file.",
    );
  }

  // Parse items.json
  const itemsJsonContent = itemsJsonEntry.getData().toString("utf8");
  let itemsData: unknown;

  try {
    itemsData = JSON.parse(itemsJsonContent);
  } catch {
    throw new Error("Invalid JSON format in items.json file");
  }

  // Validate items.json structure
  const validatedItems = importItemsSchema.parse(itemsData);

  return {
    itemsJson: validatedItems,
    defaultImages,
    sphaxImages,
  };
}

// Helper function to copy images to public directory
async function copyImages(
  defaultImages: Map<string, Buffer>,
  sphaxImages: Map<string, Buffer>,
): Promise<{ copied: number; errors: string[] }> {
  const errors: string[] = [];
  let copied = 0;

  const publicItemsPath = path.join(process.cwd(), "public", "items");
  const defaultPath = path.join(publicItemsPath, "default");
  const sphaxPath = path.join(publicItemsPath, "sphax");

  // Ensure directories exist
  await ensureDirectoryExists(defaultPath);
  await ensureDirectoryExists(sphaxPath);

  // Copy default images
  for (const [filename, buffer] of defaultImages) {
    try {
      const filePath = path.join(defaultPath, filename);
      await fs.writeFile(filePath, buffer);
      copied++;

      // If no sphax version exists, copy default to sphax
      if (!sphaxImages.has(filename)) {
        const sphaxFilePath = path.join(sphaxPath, filename);
        await fs.writeFile(sphaxFilePath, buffer);
        console.log(
          `Copied ${filename} from default to sphax (missing sphax version)`,
        );
      }
    } catch (error) {
      errors.push(
        `Failed to copy default image ${filename}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // Copy sphax images
  for (const [filename, buffer] of sphaxImages) {
    try {
      const filePath = path.join(sphaxPath, filename);
      await fs.writeFile(filePath, buffer);
      copied++;
    } catch (error) {
      errors.push(
        `Failed to copy sphax image ${filename}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  return { copied, errors };
}

// Helper function to process items in batches
async function processItemsInBatches(
  items: ImportItem[],
  batchSize = 50,
): Promise<{ imported: number; updated: number; errors: string[] }> {
  let imported = 0;
  let updated = 0;
  const errors: string[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    for (const item of batch) {
      try {
        // Validate individual item
        const validatedItem = batchItemSchema.parse(item);

        // Check if item exists
        const existingItem = await db.minecraftItem.findUnique({
          where: { id: validatedItem.id },
        });

        if (existingItem) {
          // Update existing item
          await db.minecraftItem.update({
            where: { id: validatedItem.id },
            data: {
              nameEn: validatedItem.name_en,
              nameDe: validatedItem.name_de,
              filename: validatedItem.filename,
            },
          });
          updated++;
        } else {
          // Create new item
          await db.minecraftItem.create({
            data: {
              id: validatedItem.id,
              nameEn: validatedItem.name_en,
              nameDe: validatedItem.name_de,
              filename: validatedItem.filename,
            },
          });
          imported++;
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        errors.push(`Item ${item.id ?? "unknown"}: ${errorMessage}`);
      }
    }

    // Add small delay between batches to prevent overwhelming the database
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  return { imported, updated, errors };
}

export async function GET() {
  try {
    // Return example structure and documentation
    const exampleItems = [
      {
        id: "minecraft:stone",
        name_en: "Stone",
        name_de: "Stein",
        filename: "minecraft__stone.png",
      },
      {
        id: "minecraft:iron_ingot",
        name_en: "Iron Ingot",
        name_de: "Eisenbarren",
        filename: "minecraft__iron_ingot.png",
      },
      {
        id: "ars_nouveau:source_gem",
        name_en: "Source Gem",
        name_de: "Quellstein",
        filename: "ars_nouveau__source_gem.png",
      },
    ];

    return NextResponse.json({
      message: "ZIP Import Structure Documentation",
      example: exampleItems,
      required_fields: {
        id: "Unique identifier for the item (namespace:item_name)",
        name_en: "English display name",
        name_de: "German display name",
        filename: "Image filename (namespace__item.png format)",
      },
      zip_structure: {
        "items.json": "JSON array with item metadata",
        "images/default/": "Default texture images (PNG format)",
        "images/sphax/": "Optional Sphax texture images (PNG format)",
      },
      notes: [
        "If sphax images are not provided, default images will be copied automatically",
        "Image naming convention: namespace__item.png",
        "Maximum ZIP file size: 50MB",
        "Supported image formats: PNG",
      ],
    });
  } catch (error) {
    console.error("GET /api/admin/items/import error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate example data",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin permissions
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Admin access required.",
        },
        { status: 401 },
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: "No file provided",
        },
        { status: 400 },
      );
    }

    // Validate file type and size
    if (!file.type.includes("zip") && !file.name.endsWith(".zip")) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid file type. Please upload a ZIP file.",
        },
        { status: 400 },
      );
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          message: "File too large. Maximum size is 50MB.",
        },
        { status: 400 },
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const zipBuffer = Buffer.from(arrayBuffer);

    console.log(
      `Processing ZIP file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
    );

    // Extract and validate ZIP contents
    let processedFiles: ProcessedFiles;
    try {
      processedFiles = await extractZipContents(zipBuffer);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to process ZIP file",
        },
        { status: 400 },
      );
    }

    console.log(
      `Found ${processedFiles.itemsJson.length} items, ${processedFiles.defaultImages.size} default images, ${processedFiles.sphaxImages.size} sphax images`,
    );

    // Copy images to public directory
    const imageResult = await copyImages(
      processedFiles.defaultImages,
      processedFiles.sphaxImages,
    );
    console.log(`Copied ${imageResult.copied} images`);

    // Process items in the database
    const dbResult = await processItemsInBatches(processedFiles.itemsJson);

    // Compile results
    const totalErrors = [...imageResult.errors, ...dbResult.errors];
    const hasErrors = totalErrors.length > 0;

    const result: ImportResult = {
      success: true,
      message: hasErrors
        ? `Import completed with ${totalErrors.length} errors. ${dbResult.imported} items imported, ${dbResult.updated} items updated, ${imageResult.copied} images processed.`
        : `Import completed successfully! ${dbResult.imported} items imported, ${dbResult.updated} items updated, ${imageResult.copied} images processed.`,
      imported: dbResult.imported,
      updated: dbResult.updated,
      total: processedFiles.itemsJson.length,
      errors: totalErrors.length > 0 ? totalErrors : undefined,
    };

    console.log("Import completed:", result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/admin/items/import error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json(
      {
        success: false,
        message: `Import failed: ${errorMessage}`,
      },
      { status: 500 },
    );
  }
}
