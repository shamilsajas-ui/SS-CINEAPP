import { NextResponse, NextRequest } from "next/server";
import { extractSessionFromRequest } from "@/lib/auth";
import { cancelBooking, BookingError } from "@/lib/booking-engine";

export async function POST(
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

    const ipAddress = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const result = await cancelBooking({
      bookingId: id,
      userId: session.id,
      isAdmin: session.role === "ADMIN",
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      message: "Booking cancelled and seats released successfully",
      ...result,
    });
  } catch (error: any) {
    if (error instanceof BookingError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("Booking cancellation error:", error);
    return NextResponse.json(
      { error: "Failed to cancel booking" },
      { status: 500 }
    );
  }
}
