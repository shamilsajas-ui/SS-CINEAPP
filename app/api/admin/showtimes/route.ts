import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { extractSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = extractSessionFromRequest(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const showtimesList = await db
      .select({
        id: schema.showtimes.id,
        startTime: schema.showtimes.startTime,
        endTime: schema.showtimes.endTime,
        format: schema.showtimes.format,
        basePriceMinorUnits: schema.showtimes.basePriceMinorUnits,
        isActive: schema.showtimes.isActive,
        movieTitle: schema.movies.title,
        auditoriumName: schema.auditoriums.name,
        cinemaName: schema.cinemas.name,
      })
      .from(schema.showtimes)
      .innerJoin(schema.movies, eq(schema.showtimes.movieId, schema.movies.id))
      .innerJoin(
        schema.auditoriums,
        eq(schema.showtimes.auditoriumId, schema.auditoriums.id)
      )
      .innerJoin(
        schema.cinemas,
        eq(schema.auditoriums.cinemaId, schema.cinemas.id)
      )
      .orderBy(desc(schema.showtimes.startTime))
      .limit(100);

    return NextResponse.json({ showtimes: showtimesList });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to load showtimes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = extractSessionFromRequest(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { movieId, auditoriumId, startTime, endTime, basePriceMinorUnits, format } = body;

    if (!movieId || !auditoriumId || !startTime || !endTime || !basePriceMinorUnits) {
      return NextResponse.json(
        { error: "Missing required showtime schedule parameters" },
        { status: 400 }
      );
    }

    // Insert showtime
    const [showtime] = await db
      .insert(schema.showtimes)
      .values({
        movieId,
        auditoriumId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        basePriceMinorUnits: Number(basePriceMinorUnits),
        format: format || "Standard 2D",
      })
      .returning();

    // Generate showtime_seats for all seats in the auditorium
    const audSeats = await db
      .select()
      .from(schema.seats)
      .where(eq(schema.seats.auditoriumId, auditoriumId));

    if (audSeats.length > 0) {
      await db.insert(schema.showtimeSeats).values(
        audSeats.map((s: any) => ({
          showtimeId: showtime.id,
          seatId: s.id,
          status: "AVAILABLE" as const,
        }))
      );
    }

    return NextResponse.json({
      showtime,
      seatsGenerated: audSeats.length,
      message: "Showtime scheduled successfully with seats populated",
    });
  } catch (err: any) {
    console.error("Schedule showtime error:", err);
    return NextResponse.json(
      { error: "Failed to schedule showtime" },
      { status: 500 }
    );
  }
}
