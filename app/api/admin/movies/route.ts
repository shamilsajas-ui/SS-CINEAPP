import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { extractSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = extractSessionFromRequest(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const moviesList = await db
      .select()
      .from(schema.movies)
      .orderBy(desc(schema.movies.createdAt));

    const genresList = await db.select().from(schema.genres);

    return NextResponse.json({ movies: moviesList, genres: genresList });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch movies" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = extractSessionFromRequest(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      synopsis,
      durationMinutes,
      contentRating,
      language,
      releaseDate,
      posterUrl,
      backdropUrl,
      trailerUrl,
      isFeatured = false,
      genreIds = [],
    } = body;

    if (!title || !synopsis || !durationMinutes || !posterUrl) {
      return NextResponse.json(
        { error: "Missing required movie fields" },
        { status: 400 }
      );
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") + "-" + Date.now().toString(36);

    const [movie] = await db
      .insert(schema.movies)
      .values({
        title,
        slug,
        synopsis,
        durationMinutes: Number(durationMinutes),
        contentRating: contentRating || "PG-13",
        language: language || "English",
        releaseDate: releaseDate || new Date().toISOString().split("T")[0],
        posterUrl,
        backdropUrl: backdropUrl || posterUrl,
        trailerUrl: trailerUrl || null,
        isFeatured: Boolean(isFeatured),
      })
      .returning();

    // Link genres
    if (Array.isArray(genreIds) && genreIds.length > 0) {
      await db.insert(schema.movieGenres).values(
        genreIds.map((gId) => ({
          movieId: movie.id,
          genreId: gId,
        }))
      );
    }

    // Audit log
    await db.insert(schema.auditLogs).values({
      userId: session.id,
      action: "CREATE_MOVIE",
      entityType: "MOVIE",
      entityId: movie.id,
      details: { title, slug },
    });

    return NextResponse.json({ movie, message: "Movie created successfully" });
  } catch (err: any) {
    console.error("Create movie error:", err);
    return NextResponse.json(
      { error: "Failed to create movie" },
      { status: 500 }
    );
  }
}
