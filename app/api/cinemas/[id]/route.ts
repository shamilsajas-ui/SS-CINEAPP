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

    const [cinema] = await db
      .select()
      .from(schema.cinemas)
      .where(eq(schema.cinemas.id, id));

    if (!cinema) {
      return NextResponse.json(
        { error: "Cinema not found" },
        { status: 404 }
      );
    }

    const auditoriums = await db
      .select()
      .from(schema.auditoriums)
      .where(eq(schema.auditoriums.cinemaId, cinema.id));

    // Get showtimes at this cinema
    const now = new Date();
    const showtimeList = await db
      .select({
        id: schema.showtimes.id,
        movieId: schema.showtimes.movieId,
        startTime: schema.showtimes.startTime,
        endTime: schema.showtimes.endTime,
        format: schema.showtimes.format,
        basePriceMinorUnits: schema.showtimes.basePriceMinorUnits,
        auditoriumId: schema.auditoriums.id,
        auditoriumName: schema.auditoriums.name,
        screenType: schema.auditoriums.screenType,
        movieTitle: schema.movies.title,
        moviePoster: schema.movies.posterUrl,
        movieRating: schema.movies.contentRating,
        movieDuration: schema.movies.durationMinutes,
      })
      .from(schema.showtimes)
      .innerJoin(
        schema.auditoriums,
        eq(schema.showtimes.auditoriumId, schema.auditoriums.id)
      )
      .innerJoin(
        schema.movies,
        eq(schema.showtimes.movieId, schema.movies.id)
      )
      .where(
        and(
          eq(schema.auditoriums.cinemaId, cinema.id),
          eq(schema.showtimes.isActive, true),
          gte(schema.showtimes.startTime, now)
        )
      )
      .orderBy(asc(schema.showtimes.startTime));

    return NextResponse.json({
      cinema,
      auditoriums,
      showtimes: showtimeList,
    });
  } catch (err: any) {
    console.error("Error fetching cinema details:", err);
    return NextResponse.json(
      { error: "Failed to load cinema schedule" },
      { status: 500 }
    );
  }
}
