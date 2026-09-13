import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { extractSessionFromRequest } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = extractSessionFromRequest(req);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const [booking] = await db
      .select({
        id: schema.bookings.id,
        bookingReference: schema.bookings.bookingReference,
        userId: schema.bookings.userId,
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
        cinemaAddress: schema.cinemas.address,
        cinemaCity: schema.cinemas.city,
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
      .where(eq(schema.bookings.id, id));

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Strict Authorization check
    if (booking.userId !== session.id && session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied. You do not own this booking." },
        { status: 403 }
      );
    }

    // Fetch booking items
    const items = await db
      .select({
        id: schema.bookingItems.id,
        priceMinorUnits: schema.bookingItems.priceMinorUnits,
        seatSnapshot: schema.bookingItems.seatSnapshot,
      })
      .from(schema.bookingItems)
      .where(eq(schema.bookingItems.bookingId, booking.id));

    // Fetch tickets if confirmed
    const ticketsList = await db
      .select({
        id: schema.tickets.id,
        ticketCode: schema.tickets.ticketCode,
        qrCodeData: schema.tickets.qrCodeData,
        status: schema.tickets.status,
        issuedAt: schema.tickets.issuedAt,
      })
      .from(schema.tickets)
      .where(eq(schema.tickets.bookingId, booking.id));

    // Fetch payments
    const paymentsList = await db
      .select()
      .from(schema.payments)
      .where(eq(schema.payments.bookingId, booking.id));

    return NextResponse.json({
      booking: {
        ...booking,
        seats: items.map((i: any) => ({
          id: i.id,
          priceMinorUnits: i.priceMinorUnits,
          ...(i.seatSnapshot as any),
        })),
        tickets: ticketsList,
        payments: paymentsList,
      },
    });
  } catch (err: any) {
    console.error("Error fetching booking details:", err);
    return NextResponse.json(
      { error: "Failed to load booking details" },
      { status: 500 }
    );
  }
}
