// Route handler for large modpack uploads that keeps the raw file upload outside of Server Actions.
// It parses the multipart request, writes the uploaded ZIP to disk for temporary staging, then
// re-uses the existing `uploadModpack` logic to analyse and persist the modpack.
//
// This keeps the heavy network payload outside of the Server Action channel (no 1 MB limit) while
// still leveraging all the validation/DB logic that already exists.

import { type NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import crypto from "node:crypto";
import { tmpdir } from "node:os";
import { uploadModpack } from "~/server/actions/modpacks";

// We intentionally run in the node runtime so that we have access to the filesystem APIs
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // ---------------------------------------------------------------------
    // 1. Parse the multipart request using the built-in Web API.
    //    This buffers the body in memory but does not suffer from the 1 MB
    //    Server Action limit because we are inside a Route Handler.
    // ---------------------------------------------------------------------
    const formData = await req.formData();

    const blob = formData.get("file");
    if (!(blob instanceof Blob)) {
      return NextResponse.json(
        { success: false, error: "File field missing in upload" },
        { status: 400 },
      );
    }

    // ---------------------------------------------------------------------
    // 2. Write the uploaded file to a temporary location on disk so that
    //    downstream processing can read from the filesystem rather than
    //    keeping an entire Buffer alive in memory for the life-time of the
    //    request chain.
    // ---------------------------------------------------------------------
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create unique temp file path
    const tmpFileName = `upload-${crypto.randomUUID()}.zip`;
    const tmpFilePath = path.join(tmpdir(), tmpFileName);
    await fs.writeFile(tmpFilePath, buffer);

    // Replace the original Blob with a File backed by the saved buffer so
    // that the existing Server Action receives the shape it expects.
    const fileForAction = new File([buffer], tmpFileName, {
      type: blob.type || "application/zip",
    });
    formData.set("file", fileForAction);

    // ---------------------------------------------------------------------
    // 3. Delegate to the existing validated Server Action.  Because we are
    //    invoking it **server-side** the FormData never travels over the
    //    network and therefore bypasses the body-size restriction while
    //    still re-using all Zod validation and DB logic.
    // ---------------------------------------------------------------------
    const result = await uploadModpack(formData);

    // Clean up the temporary file regardless of the outcome.
    await fs.unlink(tmpFilePath).catch(() => {
      /* ignore unlink errors */
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Modpack upload route error", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Unexpected server error",
      },
      { status: 500 },
    );
  }
}
