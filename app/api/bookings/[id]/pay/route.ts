import { NextResponse, NextRequest } from "next/server";
import { extractSessionFromRequest } from "@/lib/auth";
import { confirmPaymentAndBook, BookingError } from "@/lib/booking-engine";

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

    const body = await req.json().catch(() => ({}));
    const { idempotencyKey, provider = "MOCK_TEST", providerPaymentId } = body;

    const ipAddress = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const result = await confirmPaymentAndBook({
      bookingId: id,
      userId: session.id,
      idempotencyKey,
      provider,
      providerPaymentId,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      message: "Payment verified and booking confirmed",
      ...result,
    });
  } catch (error: any) {
    if (error instanceof BookingError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("Payment confirmation error:", error);
    return NextResponse.json(
      { error: "Failed to process payment and confirm booking" },
      { status: 500 }
    );
  }
}
