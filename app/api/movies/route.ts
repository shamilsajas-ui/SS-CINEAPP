import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, ilike, and, gte, lte, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const genreSlug = searchParams.get("genre")?.trim();
    const language = searchParams.get("language")?.trim();
    const cinemaId = searchParams.get("cinemaId")?.trim();
    const dateStr = searchParams.get("date")?.trim();

    // Base query conditions
    const conditions: any[] = [eq(schema.movies.isActive, true)];

    if (search) {
      conditions.push(ilike(schema.movies.title, `%${search}%`));
    }

    if (language && language !== "ALL") {
      conditions.push(eq(schema.movies.language, language));
    }

    let moviesList: (typeof schema.movies.$inferSelect)[] = await db
      .select()
      .from(schema.movies)
      .where(and(...conditions));

    // Fetch genres for all movies
    const allMovieGenres = await db
      .select({
        movieId: schema.movieGenres.movieId,
        genreId: schema.genres.id,
        genreName: schema.genres.name,
        genreSlug: schema.genres.slug,
      })
      .from(schema.movieGenres)
      .innerJoin(
        schema.genres,
        eq(schema.movieGenres.genreId, schema.genres.id)
      );

    const genresByMovie = new Map<string, { id: string; name: string; slug: string }[]>();
    for (const mg of allMovieGenres) {
      const list = genresByMovie.get(mg.movieId) || [];
      list.push({ id: mg.genreId, name: mg.genreName, slug: mg.genreSlug });
      genresByMovie.set(mg.movieId, list);
    }

    // Filter by genre slug if specified
    if (genreSlug && genreSlug !== "all") {
      moviesList = moviesList.filter((m: (typeof schema.movies.$inferSelect)) => {
        const genres = genresByMovie.get(m.id) || [];
        return genres.some((g) => g.slug.toLowerCase() === genreSlug.toLowerCase());
      });
    }

    // Filter by cinema or date if specified
    if (cinemaId || dateStr) {
      const showtimeConditions: any[] = [eq(schema.showtimes.isActive, true)];

      if (dateStr) {
        const startOfDay = new Date(`${dateStr}T00:00:00Z`);
        const endOfDay = new Date(`${dateStr}T23:59:59Z`);
        showtimeConditions.push(
          and(
            gte(schema.showtimes.startTime, startOfDay),
            lte(schema.showtimes.startTime, endOfDay)
          )
        );
      }

      const showtimeQuery = db
        .select({
          movieId: schema.showtimes.movieId,
          cinemaId: schema.auditoriums.cinemaId,
        })
        .from(schema.showtimes)
        .innerJoin(
          schema.auditoriums,
          eq(schema.showtimes.auditoriumId, schema.auditoriums.id)
        )
        .where(and(...showtimeConditions));

      const matchingShowtimes = await showtimeQuery;

      const validMovieIds = new Set<string>();
      for (const st of matchingShowtimes) {
        if (!cinemaId || st.cinemaId === cinemaId) {
          validMovieIds.add(st.movieId);
        }
      }

      moviesList = moviesList.filter((m) => validMovieIds.has(m.id));
    }

    const result = moviesList.map((m) => ({
      ...m,
      genres: genresByMovie.get(m.id) || [],
    }));

    return NextResponse.json({ movies: result });
  } catch (err: any) {
    console.error("Error fetching movies:", err);
    return NextResponse.json(
      { error: "Failed to load movies" },
      { status: 500 }
    );
  }
}
