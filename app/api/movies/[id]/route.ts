import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, gte, asc } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [movie] = await db
      .select()
      .from(schema.movies)
      .where(eq(schema.movies.id, id));

    if (!movie) {
      return NextResponse.json(
        { error: "Movie not found" },
        { status: 404 }
      );
    }

    // Get movie genres
    const movieGenresList = await db
      .select({
        id: schema.genres.id,
        name: schema.genres.name,
        slug: schema.genres.slug,
      })
      .from(schema.movieGenres)
      .innerJoin(
        schema.genres,
        eq(schema.movieGenres.genreId, schema.genres.id)
      )
      .where(eq(schema.movieGenres.movieId, movie.id));

    // Get showtimes for this movie in the future
    const now = new Date();
    const showtimeRecords = await db
      .select({
        id: schema.showtimes.id,
        startTime: schema.showtimes.startTime,
        endTime: schema.showtimes.endTime,
        basePriceMinorUnits: schema.showtimes.basePriceMinorUnits,
        format: schema.showtimes.format,
        auditoriumId: schema.auditoriums.id,
        auditoriumName: schema.auditoriums.name,
        screenType: schema.auditoriums.screenType,
        totalSeats: schema.auditoriums.totalSeats,
        cinemaId: schema.cinemas.id,
        cinemaName: schema.cinemas.name,
        cinemaAddress: schema.cinemas.address,
        cinemaCity: schema.cinemas.city,
      })
      .from(schema.showtimes)
      .innerJoin(
        schema.auditoriums,
        eq(schema.showtimes.auditoriumId, schema.auditoriums.id)
      )
      .innerJoin(
        schema.cinemas,
        eq(schema.auditoriums.cinemaId, schema.cinemas.id)
      )
      .where(
        and(
          eq(schema.showtimes.movieId, movie.id),
          eq(schema.showtimes.isActive, true),
          gte(schema.showtimes.startTime, now)
        )
      )
      .orderBy(asc(schema.showtimes.startTime));

    // Group showtimes by cinema
    const cinemasMap = new Map<string, any>();
    for (const st of showtimeRecords) {
      if (!cinemasMap.has(st.cinemaId)) {
        cinemasMap.set(st.cinemaId, {
          id: st.cinemaId,
          name: st.cinemaName,
          address: st.cinemaAddress,
          city: st.cinemaCity,
          showtimes: [],
        });
      }
      cinemasMap.get(st.cinemaId).showtimes.push({
        id: st.id,
        startTime: st.startTime,
        endTime: st.endTime,
        basePriceMinorUnits: st.basePriceMinorUnits,
        format: st.format,
        auditorium: {
          id: st.auditoriumId,
          name: st.auditoriumName,
          screenType: st.screenType,
          totalSeats: st.totalSeats,
        },
      });
    }

    return NextResponse.json({
      movie: {
        ...movie,
        genres: movieGenresList,
      },
      cinemasWithShowtimes: Array.from(cinemasMap.values()),
    });
  } catch (err: any) {
    console.error("Error loading movie details:", err);
    return NextResponse.json(
      { error: "Failed to load movie details" },
      { status: 500 }
    );
  }
}
