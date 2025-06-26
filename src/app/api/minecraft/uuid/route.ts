import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const uuidRequestSchema = z.object({
  username: z.string().min(1, "Username is required"),
});

/**
 * Server-side UUID retrieval to avoid CORS issues
 * GET /api/minecraft/uuid?username=player
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    const { username: validatedUsername } = uuidRequestSchema.parse({
      username,
    });

    // Fetch UUID from Mojang API server-side
    const response = await fetch(
      `https://api.mojang.com/users/profiles/minecraft/${validatedUsername}`,
      {
        // Cache for 1 hour since UUIDs don't change
        next: { revalidate: 3600 },
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Player not found" },
          { status: 404 },
        );
      }
      return NextResponse.json(
        { error: "Failed to fetch player data" },
        { status: response.status },
      );
    }

    const data = (await response.json()) as { id?: string; name?: string };

    if (!data.id) {
      return NextResponse.json(
        { error: "No UUID found for player" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      username: validatedUsername,
      uuid: data.id,
    });
  } catch (error) {
    console.error("UUID fetch error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid username parameter" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
