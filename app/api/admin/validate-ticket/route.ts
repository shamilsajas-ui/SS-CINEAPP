import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { extractSessionFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = extractSessionFromRequest(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    const { ticketCode } = await req.json();
    if (!ticketCode) {
      return NextResponse.json(
        { error: "Ticket code is required" },
        { status: 400 }
      );
    }

    const [ticket] = await db
      .select({
        id: schema.tickets.id,
        ticketCode: schema.tickets.ticketCode,
        status: schema.tickets.status,
        issuedAt: schema.tickets.issuedAt,
        validatedAt: schema.tickets.validatedAt,
        bookingId: schema.bookings.id,
        bookingReference: schema.bookings.bookingReference,
        bookingStatus: schema.bookings.status,
        userName: schema.users.name,
        movieTitle: schema.movies.title,
        startTime: schema.showtimes.startTime,
        format: schema.showtimes.format,
        auditoriumName: schema.auditoriums.name,
        cinemaName: schema.cinemas.name,
        rowLabel: schema.seats.rowLabel,
        seatNumber: schema.seats.seatNumber,
        seatType: schema.seats.seatType,
      })
      .from(schema.tickets)
      .innerJoin(schema.bookings, eq(schema.tickets.bookingId, schema.bookings.id))
      .innerJoin(schema.users, eq(schema.bookings.userId, schema.users.id))
      .innerJoin(
        schema.showtimes,
        eq(schema.bookings.showtimeId, schema.showtimes.id)
      )
      .innerJoin(schema.movies, eq(schema.showtimes.movieId, schema.movies.id))
      .innerJoin(
        schema.auditoriums,
        eq(schema.showtimes.auditoriumId, schema.auditoriums.id)
      )
      .innerJoin(
        schema.cinemas,
        eq(schema.auditoriums.cinemaId, schema.cinemas.id)
      )
      .innerJoin(
        schema.showtimeSeats,
        eq(schema.tickets.showtimeSeatId, schema.showtimeSeats.id)
      )
      .innerJoin(schema.seats, eq(schema.showtimeSeats.seatId, schema.seats.id))
      .where(eq(schema.tickets.ticketCode, ticketCode.trim().toUpperCase()));

    if (!ticket) {
      return NextResponse.json(
        { valid: false, message: "Ticket code not found in system" },
        { status: 404 }
      );
    }

    if (ticket.status === "USED") {
      return NextResponse.json({
        valid: false,
        message: `Ticket was already validated on ${new Date(ticket.validatedAt!).toLocaleString()}`,
        ticket,
      });
    }

    if (ticket.status === "CANCELLED" || ticket.bookingStatus !== "CONFIRMED") {
      return NextResponse.json({
        valid: false,
        message: `Ticket is cancelled or invalid (Booking status: ${ticket.bookingStatus})`,
        ticket,
      });
    }

    // Mark as USED
    const now = new Date();
    await db
      .update(schema.tickets)
      .set({
        status: "USED",
        validatedAt: now,
      })
      .where(eq(schema.tickets.id, ticket.id));

    // Audit log
    await db.insert(schema.auditLogs).values({
      userId: session.id,
      action: "VALIDATE_TICKET",
      entityType: "TICKET",
      entityId: ticket.id,
      details: {
        ticketCode: ticket.ticketCode,
        bookingReference: ticket.bookingReference,
        seat: `${ticket.rowLabel}${ticket.seatNumber}`,
      },
    });

    return NextResponse.json({
      valid: true,
      message: "Ticket verified and admission granted!",
      ticket: {
        ...ticket,
        status: "USED",
        validatedAt: now,
      },
    });
  } catch (err: any) {
    console.error("Ticket validation error:", err);
    return NextResponse.json(
      { error: "Failed to validate ticket" },
      { status: 500 }
    );
  }
}
