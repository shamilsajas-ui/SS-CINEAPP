import bcrypt from "bcryptjs";
import { db, ensureDatabaseReady } from "../db";
import * as schema from "../db/schema";
import { eq, and, sql } from "drizzle-orm";
import { signToken, verifyToken } from "../lib/auth";
import {
  holdSeats,
  confirmPaymentAndBook,
  cancelBooking,
  releaseExpiredHolds,
  BookingError,
} from "../lib/booking-engine";

async function runQATestSuite() {
  console.log("==========================================================");
  console.log("🧪 STARTING CINEBOOK AGENT 3 - QA AUTOMATED TEST SUITE");
  console.log("==========================================================\n");

  await ensureDatabaseReady();

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`, detail || "");
      throw new Error(`QA Test Failure: ${testName}`);
    }
  }

  // TEST 1: Database Entities and Seed Data Check
  console.log("👉 Test Suite 1: Database Entities & Seed Data");
  const usersList = await db.select().from(schema.users);
  assert(usersList.length >= 2, "Default Admin and Customer users exist in database");

  const moviesList = await db.select().from(schema.movies);
  assert(moviesList.length >= 4, "Rich movie catalog with blockbusters exists");

  const cinemasList = await db.select().from(schema.cinemas);
  assert(cinemasList.length >= 3, "Partner cinemas exist");

  const showtimesList = await db.select().from(schema.showtimes);
  assert(showtimesList.length >= 10, "Scheduled showtimes exist across cinemas");

  const showtimeSeatsList = await db.select().from(schema.showtimeSeats);
  assert(showtimeSeatsList.length > 50, "Auditorium seat grids are populated for showtimes");

  // TEST 2: Authentication & Password Security
  console.log("\n👉 Test Suite 2: Authentication & Password Security");
  const adminUser = (usersList as any[]).find((u: any) => u.role === "ADMIN")!;
  const customerUser = (usersList as any[]).find((u: any) => u.role === "USER")!;

  const isPasswordValid = await bcrypt.compare(
    "adminpassword123",
    adminUser.passwordHash
  );
  assert(isPasswordValid, "Bcrypt correctly validates admin password");

  const isInvalidPasswordRejected = !(await bcrypt.compare(
    "wrongpassword",
    adminUser.passwordHash
  ));
  assert(isInvalidPasswordRejected, "Bcrypt rejects incorrect passwords");

  const token = signToken({
    id: customerUser.id,
    name: customerUser.name,
    email: customerUser.email,
    role: customerUser.role,
  });
  const decoded = verifyToken(token);
  assert(
    decoded !== null && decoded.id === customerUser.id && decoded.email === customerUser.email,
    "JWT signing and session verification works accurately"
  );

  // TEST 3: Mathematical Integrity (Minor Units, Taxes, Fees)
  console.log("\n👉 Test Suite 3: Mathematical Integrity (Minor Units Currency)");
  const targetShowtime = showtimesList[0];
  const targetSeats = await db
    .select()
    .from(schema.showtimeSeats)
    .where(
      and(
        eq(schema.showtimeSeats.showtimeId, targetShowtime.id),
        eq(schema.showtimeSeats.status, "AVAILABLE")
      )
    )
    .limit(2);

  assert(targetSeats.length === 2, "Found 2 available test seats");

  const testHold = await holdSeats({
    showtimeId: targetShowtime.id,
    showtimeSeatIds: [targetSeats[0].id, targetSeats[1].id],
    userId: customerUser.id,
  });

  const expectedFee = 2 * 150; // $1.50 per seat = 300 cents
  assert(testHold.feeMinorUnits === expectedFee, "Convenience fee calculated accurately in minor units ($3.00)");
  assert(
    testHold.totalMinorUnits ===
      testHold.subtotalMinorUnits + testHold.feeMinorUnits + testHold.taxMinorUnits,
    "Total minor units strictly equals subtotal + fees + taxes without floating point drift"
  );

  // TEST 4: Concurrency & Race Condition Test (Simultaneous Seat Reservation)
  console.log("\n👉 Test Suite 4: Concurrent Seat Reservation (Race Condition Prevention)");
  // Find a fresh available seat
  const [contestedSeat] = await db
    .select()
    .from(schema.showtimeSeats)
    .where(
      and(
        eq(schema.showtimeSeats.showtimeId, targetShowtime.id),
        eq(schema.showtimeSeats.status, "AVAILABLE")
      )
    )
    .limit(1);

  assert(Boolean(contestedSeat), "Identified candidate seat for race condition simulation");

  // Fire two concurrent requests trying to reserve the EXACT SAME seat simultaneously
  console.log("  ⚡ Simulating two simultaneous requests competing for seat", contestedSeat.id);
  const [result1, result2] = await Promise.allSettled([
    holdSeats({
      showtimeId: targetShowtime.id,
      showtimeSeatIds: [contestedSeat.id],
      userId: customerUser.id,
    }),
    holdSeats({
      showtimeId: targetShowtime.id,
      showtimeSeatIds: [contestedSeat.id],
      userId: adminUser.id,
    }),
  ]);

  const succeededCount = [result1, result2].filter((r) => r.status === "fulfilled").length;
  const rejectedCount = [result1, result2].filter((r) => r.status === "rejected").length;

  assert(
    succeededCount === 1,
    `Strictly ONE concurrent reservation succeeded (succeeded: ${succeededCount})`
  );
  assert(
    rejectedCount === 1,
    `Strictly ONE concurrent reservation failed with conflict (rejected: ${rejectedCount})`
  );

  const rejectedReason = [result1, result2].find((r) => r.status === "rejected") as PromiseRejectedResult;
  assert(
    rejectedReason.reason instanceof BookingError && rejectedReason.reason.statusCode === 409,
    "Rejected concurrent request received 409 Conflict error"
  );

  // TEST 5: Payment Processing, Idempotency & Ticket Generation
  console.log("\n👉 Test Suite 5: Payment Confirmation & Idempotency Key Validation");
  const idempotencyKey = `qa_test_idemp_${Date.now()}`;

  const paymentResult1 = await confirmPaymentAndBook({
    bookingId: testHold.bookingId,
    userId: customerUser.id,
    idempotencyKey,
    provider: "MOCK_TEST",
  });

  assert(paymentResult1.booking.status === "CONFIRMED", "Booking status transitioned to CONFIRMED");
  assert(paymentResult1.tickets.length === 2, "Generated exactly 2 digital tickets for the 2 seats");
  assert(
    paymentResult1.tickets[0].qrCodeData.startsWith("data:image/png;base64,"),
    "Digital ticket contains valid high-resolution QR code data URL"
  );

  // Test Idempotency: Replaying payment with same idempotency key
  console.log("  ⚡ Replaying duplicate payment request with identical idempotency key...");
  const paymentResult2 = await confirmPaymentAndBook({
    bookingId: testHold.bookingId,
    userId: customerUser.id,
    idempotencyKey,
  });

  assert(
    paymentResult2.idempotentReplay === true,
    "Idempotent replay detected and returned cached booking result without re-charging"
  );

  // Confirm seats are marked BOOKED
  const [updatedSeat1] = await db
    .select()
    .from(schema.showtimeSeats)
    .where(eq(schema.showtimeSeats.id, targetSeats[0].id));
  assert(updatedSeat1.status === "BOOKED", "Showtime seat status is now strictly BOOKED");

  // TEST 6: Expired Hold Sweep & Automatic Release
  console.log("\n👉 Test Suite 6: Expired Seat Hold Release (Cron Operation)");
  const [seatToHold] = await db
    .select()
    .from(schema.showtimeSeats)
    .where(
      and(
        eq(schema.showtimeSeats.showtimeId, targetShowtime.id),
        eq(schema.showtimeSeats.status, "AVAILABLE")
      )
    )
    .limit(1);

  // Create a hold for this seat
  const holdToExpire = await holdSeats({
    showtimeId: targetShowtime.id,
    showtimeSeatIds: [seatToHold.id],
    userId: customerUser.id,
  });

  // Artificially simulate hold expiration by setting held_until to 10 minutes in the past
  const pastTime = new Date(Date.now() - 10 * 60 * 1000);
  await db
    .update(schema.showtimeSeats)
    .set({ heldUntil: pastTime })
    .where(eq(schema.showtimeSeats.id, seatToHold.id));

  await db
    .update(schema.bookings)
    .set({ expiresAt: pastTime })
    .where(eq(schema.bookings.id, holdToExpire.bookingId));

  // Run the idempotent release routine
  const releaseStats = await releaseExpiredHolds();
  assert(releaseStats.releasedSeatsCount >= 1, "Expired hold routine released expired seats");

  const [clearedSeat] = await db
    .select()
    .from(schema.showtimeSeats)
    .where(eq(schema.showtimeSeats.id, seatToHold.id));
  assert(clearedSeat.status === "AVAILABLE", "Expired seat successfully reverted to AVAILABLE status");

  // TEST 7: User Authorization & Privacy Enforcement
  console.log("\n👉 Test Suite 7: User Authorization & Booking Privacy");
  // Customer User should not be able to cancel or access Admin's booking
  let unauthorizedErrorCaught = false;
  try {
    await cancelBooking({
      bookingId: testHold.bookingId,
      userId: "00000000-0000-0000-0000-000000000000", // fake unauthorized user
      isAdmin: false,
    });
  } catch (err: any) {
    if (err instanceof BookingError && err.statusCode === 403) {
      unauthorizedErrorCaught = true;
    }
  }
  assert(unauthorizedErrorCaught, "Prevented unauthorized user from cancelling another user's booking (403 Forbidden)");

  // TEST 8: Eligible Booking Cancellation & Seat Restoration
  console.log("\n👉 Test Suite 8: Customer Booking Cancellation");
  // Find a showtime tomorrow (well > 2 hours in future)
  const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const futureShowtimes = (showtimesList as any[]).filter((s: any) => new Date(s.startTime) > futureTime);
  const futureShowtime = futureShowtimes[0] || showtimesList[showtimesList.length - 1];

  const [futureSeat] = await db
    .select()
    .from(schema.showtimeSeats)
    .where(
      and(
        eq(schema.showtimeSeats.showtimeId, futureShowtime.id),
        eq(schema.showtimeSeats.status, "AVAILABLE")
      )
    )
    .limit(1);

  const futureHold = await holdSeats({
    showtimeId: futureShowtime.id,
    showtimeSeatIds: [futureSeat.id],
    userId: customerUser.id,
  });

  const confirmedFutureBooking = await confirmPaymentAndBook({
    bookingId: futureHold.bookingId,
    userId: customerUser.id,
    idempotencyKey: `future_cancel_${Date.now()}`,
  });

  const cancelResult = await cancelBooking({
    bookingId: confirmedFutureBooking.booking.id,
    userId: customerUser.id,
    isAdmin: false,
  });

  assert(cancelResult.status === "CANCELLED", "Booking status transitioned to CANCELLED");

  const [restoredSeat] = await db
    .select()
    .from(schema.showtimeSeats)
    .where(eq(schema.showtimeSeats.id, futureSeat.id));
  assert(restoredSeat.status === "AVAILABLE", "Cancelled booking restored seats back to AVAILABLE for other customers");

  // TEST 9: Audit Logs Trail
  console.log("\n👉 Test Suite 9: Immutable Audit Logs Trail");
  const logs = await db.select().from(schema.auditLogs);
  assert(logs.length >= 4, `Audit trail contains recorded actions (total logs: ${logs.length})`);

  console.log("\n==========================================================");
  console.log(`🎉 ALL ${passedTests}/${totalTests} QA TESTS PASSED SUCCESSFULLY!`);
  console.log("==========================================================");
}

runQATestSuite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ QA Test Run Terminated with Error:", err);
    process.exit(1);
  });
