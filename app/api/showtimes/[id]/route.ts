import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { extractSessionFromRequest } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = extractSessionFromRequest(req);

    // Fetch showtime with movie and auditorium
    const [showtimeData] = await db
      .select({
        id: schema.showtimes.id,
        startTime: schema.showtimes.startTime,
        endTime: schema.showtimes.endTime,
        basePriceMinorUnits: schema.showtimes.basePriceMinorUnits,
        format: schema.showtimes.format,
        movieId: schema.movies.id,
        movieTitle: schema.movies.title,
        moviePoster: schema.movies.posterUrl,
        movieRating: schema.movies.contentRating,
        movieDuration: schema.movies.durationMinutes,
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
        schema.movies,
        eq(schema.showtimes.movieId, schema.movies.id)
      )
      .innerJoin(
        schema.auditoriums,
        eq(schema.showtimes.auditoriumId, schema.auditoriums.id)
      )
      .innerJoin(
        schema.cinemas,
        eq(schema.auditoriums.cinemaId, schema.cinemas.id)
      )
      .where(eq(schema.showtimes.id, id));

    if (!showtimeData) {
      return NextResponse.json(
        { error: "Showtime not found" },
        { status: 404 }
      );
    }

    // Fetch all showtime seats
    const showtimeSeatRows = await db
      .select({
        id: schema.showtimeSeats.id,
        seatId: schema.showtimeSeats.seatId,
        status: schema.showtimeSeats.status,
        heldUntil: schema.showtimeSeats.heldUntil,
        heldByUserId: schema.showtimeSeats.heldByUserId,
        rowLabel: schema.seats.rowLabel,
        seatNumber: schema.seats.seatNumber,
        seatType: schema.seats.seatType,
        basePriceMultiplier: schema.seats.basePriceMultiplier,
      })
      .from(schema.showtimeSeats)
      .innerJoin(
        schema.seats,
        eq(schema.showtimeSeats.seatId, schema.seats.id)
      )
      .where(eq(schema.showtimeSeats.showtimeId, id));

    const now = new Date();

    const formattedSeats = showtimeSeatRows.map((seat) => {
      let currentStatus = seat.status;
      // If HELD but expired, consider it AVAILABLE
      if (
        seat.status === "HELD" &&
        seat.heldUntil &&
        new Date(seat.heldUntil) < now
      ) {
        currentStatus = "AVAILABLE";
      }

      const isHeldByMe = Boolean(
        session &&
          currentStatus === "HELD" &&
          seat.heldByUserId === session.id
      );

      const seatPrice = Math.round(
        showtimeData.basePriceMinorUnits * (seat.basePriceMultiplier / 10000)
      );

      return {
        id: seat.id,
        seatId: seat.seatId,
        row: seat.rowLabel,
        number: seat.seatNumber,
        type: seat.seatType,
        status: currentStatus,
        isHeldByMe,
        priceMinorUnits: seatPrice,
        heldUntil: seat.heldUntil,
      };
    });

    // Group seats by row for intuitive UI rendering
    const rowsMap = new Map<string, typeof formattedSeats>();
    for (const s of formattedSeats) {
      if (!rowsMap.has(s.row)) {
        rowsMap.set(s.row, []);
      }
      rowsMap.get(s.row)!.push(s);
    }

    const rows = Array.from(rowsMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([rowLabel, seats]) => ({
        rowLabel,
        seats: seats.sort((a, b) => a.number - b.number),
      }));

    return NextResponse.json({
      showtime: showtimeData,
      rows,
      totalSeats: showtimeData.totalSeats,
      availableCount: formattedSeats.filter((s) => s.status === "AVAILABLE")
        .length,
    });
  } catch (err: any) {
    console.error("Error loading showtime seats:", err);
    return NextResponse.json(
      { error: "Failed to load showtime seat layout" },
      { status: 500 }
    );
  }
}
