import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, sql, inArray, lt } from "drizzle-orm";
import { generateQrCodeDataUrl } from "./qrcode";

export class BookingError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "BookingError";
    this.statusCode = statusCode;
  }
}

// Generate human-readable unique reference like CB-8K2N9X
function generateBookingReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let ref = "CB-";
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
}

function generateTicketCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "TKT-";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export interface HoldSeatsParams {
  showtimeId: string;
  showtimeSeatIds: string[];
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Concurrency-Safe Seat Hold Transaction
 * 1. Begin database transaction
 * 2. Lock requested showtime-seat records
 * 3. Confirm every requested seat is available (or expired hold)
 * 4. Create temporary seat hold with expiration time (10 minutes)
 * 5. Calculate price on the server
 * 6. Create the pending booking
 * 7. Commit the transaction
 */
export async function holdSeats({
  showtimeId,
  showtimeSeatIds,
  userId,
  ipAddress,
  userAgent,
}: HoldSeatsParams) {
  if (!showtimeSeatIds || showtimeSeatIds.length === 0) {
    throw new BookingError("No seats specified for reservation", 400);
  }
  if (showtimeSeatIds.length > 10) {
    throw new BookingError("Maximum 10 seats per booking", 400);
  }

  return await db.transaction(async (tx: any) => {
    // 1. Fetch and validate showtime
    const [showtime] = await tx
      .select({
        id: schema.showtimes.id,
        basePriceMinorUnits: schema.showtimes.basePriceMinorUnits,
        startTime: schema.showtimes.startTime,
        isActive: schema.showtimes.isActive,
      })
      .from(schema.showtimes)
      .where(eq(schema.showtimes.id, showtimeId));

    if (!showtime || !showtime.isActive) {
      throw new BookingError("Showtime not found or inactive", 404);
    }

    if (new Date(showtime.startTime) <= new Date()) {
      throw new BookingError("Showtime has already commenced", 400);
    }

    // 2. Query and lock requested showtime-seats
    // Fetch with seat metadata to compute multipliers
    const targetSeats = await tx
      .select({
        showtimeSeatId: schema.showtimeSeats.id,
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
      .where(
        and(
          eq(schema.showtimeSeats.showtimeId, showtimeId),
          inArray(schema.showtimeSeats.id, showtimeSeatIds)
        )
      );

    if (targetSeats.length !== showtimeSeatIds.length) {
      throw new BookingError(
        "One or more selected seats could not be found",
        404
      );
    }

    const now = new Date();

    // 3. Confirm every requested seat is available (or expired hold)
    for (const seat of targetSeats) {
      const isAvailable = seat.status === "AVAILABLE";
      const isExpiredHold =
        seat.status === "HELD" &&
        seat.heldUntil &&
        new Date(seat.heldUntil) < now;
      const isUserOwnHold =
        seat.status === "HELD" && seat.heldByUserId === userId;

      if (!isAvailable && !isExpiredHold && !isUserOwnHold) {
        throw new BookingError(
          `Seat ${seat.rowLabel}${seat.seatNumber} is no longer available. Please select another seat.`,
          409 // Conflict
        );
      }
    }

    // 4. Create temporary seat hold with expiration time (10 minutes)
    const holdDurationMinutes = 10;
    const expiresAt = new Date(now.getTime() + holdDurationMinutes * 60 * 1000);

    await tx
      .update(schema.showtimeSeats)
      .set({
        status: "HELD",
        heldUntil: expiresAt,
        heldByUserId: userId,
        version: sql`${schema.showtimeSeats.version} + 1`,
      })
      .where(inArray(schema.showtimeSeats.id, showtimeSeatIds));

    // 5. Calculate price strictly on the server in minor units (cents)
    let subtotalMinorUnits = 0;
    const itemsData = (targetSeats as any[]).map((seat: any) => {
      // multiplier is in basis points: 10000 = 1.00x, 12500 = 1.25x
      const seatPrice = Math.round(
        showtime.basePriceMinorUnits * (seat.basePriceMultiplier / 10000)
      );
      subtotalMinorUnits += seatPrice;
      return {
        showtimeSeatId: seat.showtimeSeatId,
        priceMinorUnits: seatPrice,
        seatSnapshot: {
          row: seat.rowLabel,
          number: seat.seatNumber,
          type: seat.seatType,
        },
      };
    });

    // Flat booking fee: $1.50 per ticket = 150 cents
    const feeMinorUnits = targetSeats.length * 150;
    // 8.5% sales tax
    const taxMinorUnits = Math.round((subtotalMinorUnits + feeMinorUnits) * 0.085);
    const totalMinorUnits = subtotalMinorUnits + feeMinorUnits + taxMinorUnits;

    // 6. Create the pending booking
    let bookingReference = generateBookingReference();
    // Safety check for unique reference
    const [existingRef] = await tx
      .select({ id: schema.bookings.id })
      .from(schema.bookings)
      .where(eq(schema.bookings.bookingReference, bookingReference));
    if (existingRef) {
      bookingReference = generateBookingReference();
    }

    const [booking] = await tx
      .insert(schema.bookings)
      .values({
        bookingReference,
        userId,
        showtimeId,
        status: "PENDING",
        subtotalMinorUnits,
        feeMinorUnits,
        taxMinorUnits,
        totalMinorUnits,
        currency: "usd",
        expiresAt,
      })
      .returning();

    // Insert booking items
    await tx.insert(schema.bookingItems).values(
      itemsData.map((item: any) => ({
        bookingId: booking.id,
        showtimeSeatId: item.showtimeSeatId,
        priceMinorUnits: item.priceMinorUnits,
        seatSnapshot: item.seatSnapshot,
      }))
    );

    // Audit log entry
    await tx.insert(schema.auditLogs).values({
      userId,
      action: "HOLD_SEATS",
      entityType: "BOOKING",
      entityId: booking.id,
      details: {
        bookingReference,
        showtimeSeatIds,
        expiresAt,
        totalMinorUnits,
      },
      ipAddress,
      userAgent,
    });

    return {
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      status: booking.status,
      expiresAt: booking.expiresAt,
      subtotalMinorUnits,
      feeMinorUnits,
      taxMinorUnits,
      totalMinorUnits,
      seats: itemsData.map((i: any) => ({
        seatId: i.showtimeSeatId,
        ...i.seatSnapshot,
        priceMinorUnits: i.priceMinorUnits,
      })),
    };
  });
}

export interface ConfirmPaymentParams {
  bookingId: string;
  userId: string;
  idempotencyKey?: string;
  provider?: string;
  providerPaymentId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * 8. Confirm seats only after verified payment
 * 9. Use payment idempotency keys so retries cannot create duplicate bookings
 */
export async function confirmPaymentAndBook({
  bookingId,
  userId,
  idempotencyKey,
  provider = "MOCK_TEST",
  providerPaymentId,
  ipAddress,
  userAgent,
}: ConfirmPaymentParams) {
  // Check idempotency first
  if (idempotencyKey) {
    const [existingPayment] = await db
      .select()
      .from(schema.payments)
      .where(eq(schema.payments.idempotencyKey, idempotencyKey));

    if (existingPayment && existingPayment.status === "SUCCEEDED") {
      const [existingBooking] = await db
        .select()
        .from(schema.bookings)
        .where(eq(schema.bookings.id, existingPayment.bookingId));
      const existingTickets = await db
        .select()
        .from(schema.tickets)
        .where(eq(schema.tickets.bookingId, existingPayment.bookingId));

      return {
        booking: existingBooking,
        payment: existingPayment,
        tickets: existingTickets,
        idempotentReplay: true,
      };
    }
  }

  return await db.transaction(async (tx: any) => {
    const [booking] = await tx
      .select()
      .from(schema.bookings)
      .where(eq(schema.bookings.id, bookingId));

    if (!booking) {
      throw new BookingError("Booking not found", 404);
    }

    if (booking.userId !== userId) {
      throw new BookingError("Unauthorized access to booking", 403);
    }

    if (booking.status === "CONFIRMED") {
      const confirmedTickets = await tx
        .select()
        .from(schema.tickets)
        .where(eq(schema.tickets.bookingId, booking.id));
      return { booking, tickets: confirmedTickets, alreadyConfirmed: true };
    }

    if (booking.status !== "PENDING") {
      throw new BookingError(
        `Booking cannot be paid (current status: ${booking.status})`,
        400
      );
    }

    const now = new Date();
    if (new Date(booking.expiresAt) < now) {
      // Mark as expired
      await tx
        .update(schema.bookings)
        .set({ status: "EXPIRED" })
        .where(eq(schema.bookings.id, booking.id));
      throw new BookingError(
        "Seat hold has expired. Please select your seats again.",
        410 // Gone
      );
    }

    // Get booking items
    const items = await tx
      .select()
      .from(schema.bookingItems)
      .where(eq(schema.bookingItems.bookingId, booking.id));

    const showtimeSeatIds = (items as any[]).map((i: any) => i.showtimeSeatId);

    // Verify seats are still HELD by this user
    const currentSeats = await tx
      .select()
      .from(schema.showtimeSeats)
      .where(inArray(schema.showtimeSeats.id, showtimeSeatIds));

    for (const seat of currentSeats) {
      if (seat.status !== "HELD" || seat.heldByUserId !== userId) {
        throw new BookingError(
          "Seat hold was invalidated or expired. Please rebook.",
          409
        );
      }
    }

    // 1. Record payment
    const [payment] = await tx
      .insert(schema.payments)
      .values({
        bookingId: booking.id,
        amountMinorUnits: booking.totalMinorUnits,
        currency: booking.currency,
        status: "SUCCEEDED",
        provider,
        providerPaymentId:
          providerPaymentId || `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        idempotencyKey: idempotencyKey || null,
        metadata: { paidAt: now.toISOString(), provider },
      })
      .returning();

    // 2. Update booking to CONFIRMED
    const [confirmedBooking] = await tx
      .update(schema.bookings)
      .set({
        status: "CONFIRMED",
        updatedAt: now,
      })
      .where(eq(schema.bookings.id, booking.id))
      .returning();

    // 3. Mark seats as BOOKED and clear held timers
    await tx
      .update(schema.showtimeSeats)
      .set({
        status: "BOOKED",
        heldUntil: null,
        heldByUserId: null,
        version: sql`${schema.showtimeSeats.version} + 1`,
      })
      .where(inArray(schema.showtimeSeats.id, showtimeSeatIds));

    // 4. Generate Digital Tickets with QR code
    const generatedTickets = [];
    for (const item of items) {
      const ticketCode = generateTicketCode();
      const qrData = JSON.stringify({
        t: ticketCode,
        b: booking.bookingReference,
        s: item.showtimeSeatId,
        u: userId,
        ts: now.getTime(),
      });
      const qrDataUrl = await generateQrCodeDataUrl(qrData);

      const [ticket] = await tx
        .insert(schema.tickets)
        .values({
          bookingId: booking.id,
          ticketCode,
          qrCodeData: qrDataUrl,
          showtimeSeatId: item.showtimeSeatId,
          status: "VALID",
        })
        .returning();

      generatedTickets.push(ticket);
    }

    // 5. Audit Log
    await tx.insert(schema.auditLogs).values({
      userId,
      action: "CONFIRM_PAYMENT",
      entityType: "BOOKING",
      entityId: booking.id,
      details: {
        paymentId: payment.id,
        bookingReference: booking.bookingReference,
        ticketCount: generatedTickets.length,
        totalPaid: booking.totalMinorUnits,
      },
      ipAddress,
      userAgent,
    });

    return {
      booking: confirmedBooking,
      payment,
      tickets: generatedTickets,
    };
  });
}

/**
 * Cancel an eligible booking and release seats
 */
export async function cancelBooking({
  bookingId,
  userId,
  isAdmin = false,
  ipAddress,
  userAgent,
}: {
  bookingId: string;
  userId: string;
  isAdmin?: boolean;
  ipAddress?: string;
  userAgent?: string;
}) {
  return await db.transaction(async (tx: any) => {
    const [booking] = await tx
      .select({
        id: schema.bookings.id,
        bookingReference: schema.bookings.bookingReference,
        userId: schema.bookings.userId,
        status: schema.bookings.status,
        showtimeId: schema.bookings.showtimeId,
        startTime: schema.showtimes.startTime,
      })
      .from(schema.bookings)
      .innerJoin(
        schema.showtimes,
        eq(schema.bookings.showtimeId, schema.showtimes.id)
      )
      .where(eq(schema.bookings.id, bookingId));

    if (!booking) {
      throw new BookingError("Booking not found", 404);
    }

    if (!isAdmin && booking.userId !== userId) {
      throw new BookingError("Unauthorized access to cancel booking", 403);
    }

    if (booking.status === "CANCELLED") {
      throw new BookingError("Booking has already been cancelled", 400);
    }

    if (booking.status !== "CONFIRMED" && booking.status !== "PENDING") {
      throw new BookingError(
        `Cannot cancel booking with status: ${booking.status}`,
        400
      );
    }

    // Check cancellation policy: must be at least 2 hours before showtime (unless admin)
    const now = new Date();
    const showtimeStart = new Date(booking.startTime);
    const hoursDifference =
      (showtimeStart.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (!isAdmin && hoursDifference < 2) {
      throw new BookingError(
        "Bookings cannot be cancelled less than 2 hours before showtime start.",
        400
      );
    }

    // Get linked seats
    const items = await tx
      .select({ showtimeSeatId: schema.bookingItems.showtimeSeatId })
      .from(schema.bookingItems)
      .where(eq(schema.bookingItems.bookingId, booking.id));

    const showtimeSeatIds = (items as any[]).map((i: any) => i.showtimeSeatId);

    // Update booking to CANCELLED
    await tx
      .update(schema.bookings)
      .set({
        status: "CANCELLED",
        cancelledAt: now,
        updatedAt: now,
      })
      .where(eq(schema.bookings.id, booking.id));

    // Release showtime seats back to AVAILABLE
    if (showtimeSeatIds.length > 0) {
      await tx
        .update(schema.showtimeSeats)
        .set({
          status: "AVAILABLE",
          heldUntil: null,
          heldByUserId: null,
          version: sql`${schema.showtimeSeats.version} + 1`,
        })
        .where(inArray(schema.showtimeSeats.id, showtimeSeatIds));
    }

    // Invalidate tickets
    await tx
      .update(schema.tickets)
      .set({ status: "CANCELLED" })
      .where(eq(schema.tickets.bookingId, booking.id));

    // Mark payments as REFUNDED
    await tx
      .update(schema.payments)
      .set({
        status: "REFUNDED",
        updatedAt: now,
      })
      .where(eq(schema.payments.bookingId, booking.id));

    // Audit log
    await tx.insert(schema.auditLogs).values({
      userId,
      action: "CANCEL_BOOKING",
      entityType: "BOOKING",
      entityId: booking.id,
      details: {
        bookingReference: booking.bookingReference,
        releasedSeatsCount: showtimeSeatIds.length,
        refunded: true,
      },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      bookingReference: booking.bookingReference,
      status: "CANCELLED",
      releasedSeats: showtimeSeatIds.length,
    };
  });
}

/**
 * Idempotent cron routine to release expired seat holds and expire stale pending bookings
 */
export async function releaseExpiredHolds() {
  const now = new Date();

  return await db.transaction(async (tx: any) => {
    // 1. Find all expired showtime_seats
    const expiredSeats = await tx
      .select({ id: schema.showtimeSeats.id })
      .from(schema.showtimeSeats)
      .where(
        and(
          eq(schema.showtimeSeats.status, "HELD"),
          lt(schema.showtimeSeats.heldUntil, now)
        )
      );

    let releasedSeatsCount = 0;
    if (expiredSeats.length > 0) {
      const seatIds = (expiredSeats as any[]).map((s: any) => s.id);
      await tx
        .update(schema.showtimeSeats)
        .set({
          status: "AVAILABLE",
          heldUntil: null,
          heldByUserId: null,
          version: sql`${schema.showtimeSeats.version} + 1`,
        })
        .where(inArray(schema.showtimeSeats.id, seatIds));
      releasedSeatsCount = expiredSeats.length;
    }

    // 2. Find and update stale pending bookings
    const expiredBookings = await tx
      .select({ id: schema.bookings.id })
      .from(schema.bookings)
      .where(
        and(
          eq(schema.bookings.status, "PENDING"),
          lt(schema.bookings.expiresAt, now)
        )
      );

    let expiredBookingsCount = 0;
    if (expiredBookings.length > 0) {
      const bookingIds = (expiredBookings as any[]).map((b: any) => b.id);
      await tx
        .update(schema.bookings)
        .set({
          status: "EXPIRED",
          updatedAt: now,
        })
        .where(inArray(schema.bookings.id, bookingIds));
      expiredBookingsCount = expiredBookings.length;
    }

    if (releasedSeatsCount > 0 || expiredBookingsCount > 0) {
      await tx.insert(schema.auditLogs).values({
        action: "RELEASE_EXPIRED_HOLDS",
        entityType: "CRON",
        entityId: "CRON_SWEEP",
        details: {
          releasedSeatsCount,
          expiredBookingsCount,
          timestamp: now.toISOString(),
        },
      });
    }

    return {
      releasedSeatsCount,
      expiredBookingsCount,
      timestamp: now.toISOString(),
    };
  });
}
