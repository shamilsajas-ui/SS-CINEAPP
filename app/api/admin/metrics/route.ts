import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { extractSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = extractSessionFromRequest(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    // 1. Total revenue from confirmed bookings
    const [revenueRes] = await db
      .select({
        totalRevenue: sql<number>`coalesce(sum(${schema.bookings.totalMinorUnits}), 0)`,
        confirmedBookings: sql<number>`count(${schema.bookings.id})`,
      })
      .from(schema.bookings)
      .where(eq(schema.bookings.status, "CONFIRMED"));

    // 2. Total valid/used tickets
    const [ticketsRes] = await db
      .select({
        totalTickets: sql<number>`count(${schema.tickets.id})`,
      })
      .from(schema.tickets);

    // 3. Total active movies
    const [moviesRes] = await db
      .select({
        totalMovies: sql<number>`count(${schema.movies.id})`,
      })
      .from(schema.movies)
      .where(eq(schema.movies.isActive, true));

    // 4. Occupancy stats across all showtime seats
    const [seatStats] = await db
      .select({
        totalSeats: sql<number>`count(${schema.showtimeSeats.id})`,
        bookedSeats: sql<number>`count(case when ${schema.showtimeSeats.status} = 'BOOKED' then 1 end)`,
        heldSeats: sql<number>`count(case when ${schema.showtimeSeats.status} = 'HELD' then 1 end)`,
      })
      .from(schema.showtimeSeats);

    const totalSeatsNum = Number(seatStats?.totalSeats || 0);
    const bookedSeatsNum = Number(seatStats?.bookedSeats || 0);
    const occupancyRate =
      totalSeatsNum > 0
        ? Math.round((bookedSeatsNum / totalSeatsNum) * 100)
        : 0;

    // 5. Recent 10 bookings
    const recentBookings = await db
      .select({
        id: schema.bookings.id,
        bookingReference: schema.bookings.bookingReference,
        status: schema.bookings.status,
        totalMinorUnits: schema.bookings.totalMinorUnits,
        createdAt: schema.bookings.createdAt,
        userName: schema.users.name,
        userEmail: schema.users.email,
        movieTitle: schema.movies.title,
      })
      .from(schema.bookings)
      .innerJoin(schema.users, eq(schema.bookings.userId, schema.users.id))
      .innerJoin(
        schema.showtimes,
        eq(schema.bookings.showtimeId, schema.showtimes.id)
      )
      .innerJoin(schema.movies, eq(schema.showtimes.movieId, schema.movies.id))
      .orderBy(desc(schema.bookings.createdAt))
      .limit(10);

    return NextResponse.json({
      metrics: {
        totalRevenueMinorUnits: Number(revenueRes?.totalRevenue || 0),
        totalTicketsSold: Number(ticketsRes?.totalTickets || 0),
        activeMovies: Number(moviesRes?.totalMovies || 0),
        occupancyRatePercentage: occupancyRate,
        totalSeatsTracked: totalSeatsNum,
        heldSeatsCount: Number(seatStats?.heldSeats || 0),
      },
      recentBookings,
    });
  } catch (err: any) {
    console.error("Admin metrics error:", err);
    return NextResponse.json(
      { error: "Failed to load dashboard metrics" },
      { status: 500 }
    );
  }
}
