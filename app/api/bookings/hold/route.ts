import { NextResponse, NextRequest } from "next/server";
import { extractSessionFromRequest } from "@/lib/auth";
import { holdSeats, BookingError } from "@/lib/booking-engine";

export async function POST(req: NextRequest) {
  try {
    const session = extractSessionFromRequest(req);
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required to reserve seats" },
        { status: 401 }
      );
    }

    const { showtimeId, showtimeSeatIds } = await req.json();

    if (!showtimeId || !showtimeSeatIds || !Array.isArray(showtimeSeatIds)) {
      return NextResponse.json(
        { error: "Showtime ID and showtimeSeatIds are required" },
        { status: 400 }
      );
    }

    const ipAddress = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const result = await holdSeats({
      showtimeId,
      showtimeSeatIds,
      userId: session.id,
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        message: "Seats held successfully for 10 minutes",
        ...result,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof BookingError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("Seat hold error:", error);
    return NextResponse.json(
      { error: "Failed to reserve seats. Please try again." },
      { status: 500 }
    );
  }
}
