import { type NextRequest, NextResponse } from "next/server";
import { downloadLatestModpack } from "~/server/actions/modpacks";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ name: string }> },
) {
  try {
    const { name } = await context.params;

    // Decode the modpack name from URL
    const modpackName = decodeURIComponent(name);

    // Download the latest version of the modpack
    const result = await downloadLatestModpack(modpackName);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error ?? "Download failed" },
        { status: 400 },
      );
    }

    const { fileName, modsZipBuffer } = result.data;

    // Return the ZIP file with appropriate headers
    return new NextResponse(modsZipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": modsZipBuffer.length.toString(),
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Download latest API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
