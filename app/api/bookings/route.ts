import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { extractSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = extractSessionFromRequest(req);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const bookingsList = await db
      .select({
        id: schema.bookings.id,
        bookingReference: schema.bookings.bookingReference,
        status: schema.bookings.status,
        subtotalMinorUnits: schema.bookings.subtotalMinorUnits,
        feeMinorUnits: schema.bookings.feeMinorUnits,
        taxMinorUnits: schema.bookings.taxMinorUnits,
        totalMinorUnits: schema.bookings.totalMinorUnits,
        currency: schema.bookings.currency,
        expiresAt: schema.bookings.expiresAt,
        createdAt: schema.bookings.createdAt,
        cancelledAt: schema.bookings.cancelledAt,
        showtimeId: schema.showtimes.id,
        startTime: schema.showtimes.startTime,
        endTime: schema.showtimes.endTime,
        format: schema.showtimes.format,
        movieTitle: schema.movies.title,
        moviePoster: schema.movies.posterUrl,
        movieRating: schema.movies.contentRating,
        movieDuration: schema.movies.durationMinutes,
        cinemaName: schema.cinemas.name,
        auditoriumName: schema.auditoriums.name,
        screenType: schema.auditoriums.screenType,
      })
      .from(schema.bookings)
      .innerJoin(
        schema.showtimes,
        eq(schema.bookings.showtimeId, schema.showtimes.id)
      )
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
      .where(eq(schema.bookings.userId, session.id))
      .orderBy(desc(schema.bookings.createdAt));

    // For each booking, fetch items and tickets
    const fullBookings = await Promise.all(
      bookingsList.map(async (b: any) => {
        const items = await db
          .select({
            id: schema.bookingItems.id,
            priceMinorUnits: schema.bookingItems.priceMinorUnits,
            seatSnapshot: schema.bookingItems.seatSnapshot,
          })
          .from(schema.bookingItems)
          .where(eq(schema.bookingItems.bookingId, b.id));

        const ticketsList = await db
          .select({
            id: schema.tickets.id,
            ticketCode: schema.tickets.ticketCode,
            status: schema.tickets.status,
          })
          .from(schema.tickets)
          .where(eq(schema.tickets.bookingId, b.id));

        return {
          ...b,
          seats: items.map((i: any) => ({
            id: i.id,
            priceMinorUnits: i.priceMinorUnits,
            ...(i.seatSnapshot as any),
          })),
          tickets: ticketsList,
        };
      })
    );

    return NextResponse.json({ bookings: fullBookings });
  } catch (err: any) {
    console.error("Error loading user bookings:", err);
    return NextResponse.json(
      { error: "Failed to load bookings" },
      { status: 500 }
    );
  }
}
