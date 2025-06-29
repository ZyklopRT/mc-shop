import { type NextRequest, NextResponse } from "next/server";
import { downloadModpack } from "~/server/actions/modpacks";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    // Download the modpack
    const result = await downloadModpack(id);

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
    console.error("Download API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
